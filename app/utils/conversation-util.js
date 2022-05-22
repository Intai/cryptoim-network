import { F, find, memoizeWith, pipe, prop, propEq, T } from 'ramda'
import { v4 as uuidv4 } from 'uuid'
import { jsonParse } from './common-util'
import { Sea, getGun, gunOnce } from './gun-util'
import { getAuthUser, getAuthPair } from './login-util'

const decryptMessage = async (forPair, fromEpub, encrypted) => {
  let passphrase = await Sea.secret(fromEpub, forPair)
  return await Sea.decrypt(encrypted, passphrase)
}

const getMessage = (forPair, fromEpub, cb) => {
  let ev

  getGun().get('#messages')
    .get({ '.': { '*': `${forPair.pub}-` } })
    .map()
    .on((json, _key, _msg, _ev) => {
      ev = _ev
      if (json) {
        // parse the json string and then decrypt back to message object.
        const { encrypted, origin } = jsonParse(json)
        decryptMessage(forPair || getAuthPair(), fromEpub || origin, encrypted)
          .then(data => {
            if (data) {
              cb(data)
            }
          })
      }
    })

  return () => {
    if (ev) {
      ev.off()
    }
  }
}

export const getNextMessage = (nextPair, cb) => (
  getMessage(
    // for the previous message.
    nextPair,
    // from the message itself.
    nextPair.epub,
    // callback to return message one by one.
    cb
  )
)

export const getMyMessage = cb => (
  getMessage(
    // for me.
    getAuthPair(),
    // from everyone.
    null,
    // callback to return message one by one.
    cb
  )
)

const encryptMessage = async (user, fromPair, conversePub, content) => {
  const message = {
    uuid: uuidv4(),
    content,
    conversePub,
    fromPub: getAuthPair().pub,
    nextPair: content.nextPair || await Sea.pair(),
    timestamp: Date.now(),
  }
  const passphrase = await Sea.secret(user.epub, fromPair)
  const encrypted = await Sea.encrypt(message, passphrase)

  return {
    message,
    encrypted,
    origin: fromPair.epub,
  }
}

const sendMessage = (user, fromPair, conversePub, content, cb) => {
  encryptMessage(user, fromPair, conversePub, content)
    .then(({ message, encrypted, origin }) => {
      // hash the encrypted message to freeze, so it can not be modified.
      const json = JSON.stringify({ encrypted, origin })
      Sea.work(json, null, null, { name: 'SHA-256' })
        .then(hash => {
          getGun().get('#messages')
            .get(`${user.pub}-#${hash}`)
            .put(json)

          cb({ message })
        })
    })
}

export const sendNextMessage = (nextPair, conversePub, content, cb) => {
  sendMessage(
    // to the next message.
    nextPair,
    // from the message itself.
    nextPair,
    // in a conversation.
    conversePub,
    // message content.
    content,
    // callback to return the message sent.
    cb
  )
}

const whenUser = user => (
  !user || user.epub
)

export const sendMessageToUser = (toPub, conversePub, content, cb) => {
  if (!toPub) {
    cb({ err: 'Invalid contact.' })
    return
  }

  getGun().user(toPub).on(gunOnce(whenUser, user => {
    if (!user) {
      cb({ err: 'Invalid contact.' })
    } else {
      sendMessage(
        // to the other user.
        user,
        // from me.
        getAuthPair(),
        // in a conversation.
        conversePub,
        // message content.
        content,
        // callback to return the message sent.
        cb
      )
    }
  }))
}

const uuidCache = {}

export const createConversation = (message, cb) => {
  const { content, conversePub, fromPub, nextPair, timestamp } = message
  const { memberPubs = null } = content
  const targetPub = (conversePub !== getAuthPair().pub) ? conversePub : fromPub
  const uuid = uuidCache[targetPub] || uuidv4()
  uuidCache[targetPub] = uuid
  const conversation = {
    uuid,
    conversePub: targetPub,
    memberPubs,
    nextPair,
    lastTimestamp: timestamp,
  }

  // encrypt the conversation, so others can not trace.
  Sea.encrypt(conversation, getAuthPair()).then(encrypted => {
    getAuthUser()
      .get('conversations')
      .get(`conversation-${uuid}`)
      .put(encrypted)

    if (cb) {
      cb(conversation)
    }
  })
}

export const getConversation = cb => {
  let ev

  // get conversation one by one, also when created or updated.
  getAuthUser()
    .get('conversations')
    .map()
    .on((encrypted, _key, _msg, _ev) => {
      ev = _ev
      if (encrypted) {
        Sea.decrypt(encrypted, getAuthPair()).then(conversation => {
          if (conversation) {
            const { uuid, conversePub } = conversation
            uuidCache[conversePub] = uuid
            cb(conversation)
          }
        })
      }
    })

  return () => {
    if (ev) {
      ev.off()
    }
  }
}

export const removeConversation = conversation => {
  getAuthUser()
    .get('conversations')
    .get(`conversation-${conversation.uuid}`)
    .put(null)
}

export const getRemovedRequest = cb => {
  let ev

  getAuthUser()
    .get('requests')
    .map()
    .on((uuid, _key, _msg, _ev) => {
      ev = _ev
      if (uuid) {
        cb(uuid)
      }
    })

  return () => {
    if (ev) {
      ev.off()
    }
  }
}

export const removeRequest = message => {
  const { uuid } = message
  getAuthUser()
    .get('requests')
    .get(`request-${uuid}`)
    .put(uuid)
}

const pushUnsub = (unsub, unsubs) => {
  if (unsubs.indexOf(unsub) < 0) {
    unsubs.push(unsub)
  }
}

// recursively follow the chain of messages.
// memoize because gun can callback multiple times.
const getNextMessageRecursive = memoizeWith(prop('pub'), (nextPair, cb, unsubs) => {
  const unsub = getNextMessage(nextPair, message => {
    cb(message)
    getNextMessageRecursive(message.nextPair, cb, unsubs)
  })

  // accumulate unsubscribe functions.
  pushUnsub(unsub, unsubs)
})

export const getConversationMessage = cb => {
  const unsubs = []

  // for all conversations.
  const unsub = getConversation(conversation => {
    // get messages one by one, also when created or updated.
    getNextMessageRecursive(conversation.nextPair, cb, unsubs)
  })

  // be able to unsubscribe from the conversation and all messages recursively.
  pushUnsub(unsub, unsubs)
  return unsubs.length > 0
    ? pipe(...unsubs)
    : F
}

export const updateConversationLastTimestamp = (converseUuid, lastTimestamp) => {
  const converseNode = getAuthUser()
    .get('conversations')
    .get(`conversation-${converseUuid}`)

  converseNode.on(gunOnce(T, encrypted => {
    if (encrypted) {
      Sea.decrypt(encrypted, getAuthPair()).then(data => {
        const conversation = {
          ...data,
          lastTimestamp,
        }

        // update the pair to the first message in the conversation.
        Sea.encrypt(conversation, getAuthPair()).then(encrypted => {
          converseNode.put(encrypted)
        })
      })
    }
  }))
}

export const expireConversationMessage = (converseUuid, message) => {
  const { conversePub, fromPub, nextPair } = message
  const targetPub = (conversePub !== getAuthPair().pub) ? conversePub : fromPub
  const converseNode = getAuthUser()
    .get('conversations')
    .get(`conversation-${converseUuid}`)

  converseNode.on(gunOnce(T, encrypted => {
    if (encrypted) {
      Sea.decrypt(encrypted, getAuthPair()).then(data => {
        // double check if the message is in the conversation.
        if (data?.conversePub === targetPub) {
          const conversation = {
            ...data,
            nextPair,
          }

          // update the pair to the first message in the conversation.
          Sea.encrypt(conversation, getAuthPair()).then(encrypted => {
            converseNode.put(encrypted)
          })
        }
      })
    }
  }))
}

export const getGroupName = (login, contacts, conversation) => {
  const { name, memberPubs } = conversation
  if (name) {
    // if the conversation has a name.
    return name
  }

  // otherwise return members' names separated by comma.
  const labels = memberPubs.reduce((accum, memberPub) => {
    const contact = (login.pair.pub !== memberPub)
      ? find(propEq('pub', memberPub), contacts)
      : login

    if (contact) {
      const { alias, name } = contact
      const label = name || alias
      if (label) {
        accum.push(label)
      }
    }
    return accum
  }, [])

  return labels.join(', ')
}
