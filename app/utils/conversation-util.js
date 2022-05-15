import { memoizeWith, prop } from 'ramda'
import { v4 as uuidv4 } from 'uuid'
import { jsonParse } from './common-util'
import { gun } from './gun-util'
import Sea from 'gun/sea'
import { authUser, getAuthPair } from './login-util'

const decryptMessage = async (forPair, fromEpub, encrypted) => {
  let passphrase = await Sea.secret(fromEpub, forPair)
  return await Sea.decrypt(encrypted, passphrase)
}

const getMessage = (forPair, fromEpub, cb) => {
  gun.get('#messages')
    .get({ '.': { '*': `${forPair.pub}-` } })
    .map()
    .on(json => {
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
}

export const getNextMessage = (nextPair, cb) => {
  getMessage(
    // for the previous message.
    nextPair,
    // from the message itself.
    nextPair.epub,
    // callback to return message one by one.
    cb
  )
}

export const getMyMessage = (cb) => {
  getMessage(
    // for me.
    getAuthPair(),
    // from everyone.
    null,
    // callback to return message one by one.
    cb
  )
}

const encryptMessage = async (user, fromPair, conversePub, content) => {
  let nextPair
  if (content.type === 'request') {
    // sharing the next pair in a group chat.
    nextPair = content.nextPair
  }

  const message = {
    uuid: uuidv4(),
    content,
    conversePub,
    fromPub: getAuthPair().pub,
    nextPair: nextPair || await Sea.pair(),
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
          gun.get('#messages')
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

export const sendMessageToUser = (toPub, conversePub, content, cb) => {
  gun.user(toPub).once(user => {
    if (!user?.epub) {
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
  })
}

const uuidCache = {}

export const createConversation = (message, cb) => {
  const { conversePub, fromPub, nextPair, timestamp } = message
  const targetPub = (conversePub !== getAuthPair().pub) ? conversePub : fromPub
  const uuid = uuidCache[targetPub] || uuidv4()
  uuidCache[targetPub] = uuid
  const conversation = {
    uuid,
    conversePub: targetPub,
    nextPair,
    lastTimestamp: timestamp,
  }

  // encrypt the conversation, so others can not trace.
  Sea.encrypt(conversation, getAuthPair()).then(encrypted => {
    authUser
      .get('conversations')
      .get(`conversation-${uuid}`)
      .put(encrypted)

    if (cb) {
      cb(conversation)
    }
  })
}

export const getConversation = cb => {
  // get conversation one by one, also when created or updated.
  authUser
    .get('conversations')
    .map()
    .on(encrypted => {
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
}

// recursively follow the chain of messages.
// memoize because gun can callback multiple times.
const getNextMessageRecursive = memoizeWith(prop('pub'), (nextPair, cb) => {
  getNextMessage(nextPair, message => {
    cb(message)
    getNextMessageRecursive(message.nextPair, cb)
  })
})

export const getConversationMessage = cb => {
  // for all conversations.
  getConversation(conversation => {
    // get messages one by one, also when created or updated.
    getNextMessageRecursive(conversation.nextPair, cb)
  })
}

export const updateConversationLastTimestamp = (converseUuid, lastTimestamp) => {
  const converseNode = authUser
    .get('conversations')
    .get(`conversation-${converseUuid}`)

  converseNode.once(encrypted => {
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
  })
}

export const expireConversationMessage = (converseUuid, message) => {
  const { conversePub, fromPub, nextPair } = message
  const targetPub = (conversePub !== getAuthPair().pub) ? conversePub : fromPub
  const converseNode = authUser
    .get('conversations')
    .get(`conversation-${converseUuid}`)

  converseNode.once(encrypted => {
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
  })
}
