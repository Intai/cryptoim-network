import { filter, find, findLast, prop, propEq } from 'ramda'
import {
  combineAsArray,
  combineTemplate,
  End,
  fromArray,
  fromBinder,
  fromCallback,
  fromPromise,
  mergeAll,
  never,
  once,
} from 'baconjs'
import { LocationAction } from 'bdux-react-router'
import ActionTypes from './action-types'
import { canUseDOM, getStaticUrl } from '../utils/common-util'
import { Sea } from '../utils/gun-util'
import {
  getConversation,
  createConversation,
  updateConversation,
  removeConversation,
  createGroup,
  updateGroup,
  getRemovedRequests,
  removeRequest,
  getConversationMessage,
  getExpiredConversationMessage,
  getMyMessage,
  sendNextMessage,
  sendMessageToUser,
  sendNextMessageToUser,
  expireConversationMessage,
} from '../utils/conversation-util'

const appendConversationMessage = sink => message => {
  const { type, renewPair } = message.content

  if (type === 'renewGroup') {
    sink({
      type: ActionTypes.MESSAGE_APPEND,
      message: {
        ...message,
        nextPair: renewPair,
      },
    })
  } else {
    sink({
      type: ActionTypes.MESSAGE_APPEND,
      message,
    })
  }
}

export const init = () => mergeAll(
  once({
    type: ActionTypes.CONVERSATION_INIT,
  }),

  fromBinder(sink => (
    getRemovedRequests(uuids => {
      sink({
        type: ActionTypes.REQUEST_REMOVED,
        uuids,
      })
    })
  )),

  fromBinder(sink => (
    getConversation(conversation => {
      sink({
        type: ActionTypes.CONVERSATION_APPEND,
        conversation,
      })
    })
  )),

  fromBinder(sink => (
    getConversationMessage(appendConversationMessage(sink))
  )),

  fromBinder(sink => (
    getMyMessage(message => {
      const { type } = message.content
      if (type === 'request') {
        sink({
          type: ActionTypes.REQUEST_APPEND,
          message,
        })
      }
    })
  ))
)

export const remove = conversation => {
  if (conversation) {
    removeConversation(conversation)
    return {
      type: ActionTypes.CONVERSATION_DELETE,
      conversation,
    }
  }
}

export const selectConversation = (conversation, timestamp) => conversation && ({
  type: ActionTypes.CONVERSATION_SELECT,
  conversation,
  timestamp,
})

export const deselectConversation = () => ({
  type: ActionTypes.CONVERSATION_SELECT,
  conversation: null,
})

const countEncryptPub = messages => messages.reduce(
  (accum, { encryptPub }) => {
    if (encryptPub) {
      // count the number of direct child messages in the tree of messages.
      accum[encryptPub] = (accum[encryptPub] || 0) + 1
    }
    return accum
  },
  {}
)

const isSingleExpired = counts => ({ encryptPub, timestamp }) => (
  // if the message is older than 90 days.
  timestamp < Date.now() - 1000 * 60 * 60 * 24 * 90
    // and there is no sibling in the tree of messages.
    && counts[encryptPub] === 1
)

const findLastExpiredMessage = sortedMessages => (
  findLast(
    isSingleExpired(countEncryptPub(sortedMessages)),
    sortedMessages
  )
)

export const expireConversation = (converseUuid, sortedMessages) => {
  const lastExpiredMessage = findLastExpiredMessage(sortedMessages)
  if (lastExpiredMessage) {
    // expire old messages by pointing the conversation to start from the next pair.
    expireConversationMessage(converseUuid, lastExpiredMessage)
  }
}

export const getExpiredMessages = conversation => mergeAll(
  once({
    type: ActionTypes.CONVERSATION_LOAD_EXPIRED,
    conversation,
  }),

  fromBinder(sink => (
    // load old messages from the conversation's very first pair.
    getExpiredConversationMessage(
      conversation,
      appendConversationMessage(sink)
    )
  ))
)

export const sendMessage = (nextPair, conversePub, content) => mergeAll(
  once({
    type: ActionTypes.CONVERSATION_SEND_TEXT,
  }),

  fromCallback(callback => {
    sendNextMessage(nextPair, conversePub, content, ({ message, err }) => {
      if (err) {
        callback({
          type: ActionTypes.CONVERSATION_SEND_TEXT_ERROR,
          err,
        })
      } else {
        // indicate the success in the ui.
        callback({
          type: ActionTypes.CONVERSATION_SEND_TEXT_SUCCESS,
          message,
        })
      }
    })
  })
)

export const updateLastTimestamp = (conversation, lastTimestamp) => {
  // update the conversation's lastTimestamp,
  // so we can figure out which messages are new.
  updateConversation(conversation.uuid, { lastTimestamp })
}

export const updateGroupTimestamp = (conversation, groupTimestamp) => {
  // update the conversation's groupTimestamp,
  // so we can figure out groupPair.
  updateConversation(conversation.uuid, { groupTimestamp })
}

const getNotificationMessage = (contact, conversation) => {
  if (conversation.name) {
    return `New message in group ${conversation.name}`
  }
  if (contact) {
    const { alias, name } = contact
    return `New message from ${name || alias}`
  }
}

export const notifyNewMessage = (contact, conversation, message) => {
  if (canUseDOM()
    && typeof message.content === 'string'
    && Notification.permission === 'granted') {
    const title = getNotificationMessage(contact, conversation)
    if (title) {
      return fromCallback(callback => {
        const notification = new Notification(title, {
          tag: message.uuid,
          body: message.content,
          icon: getStaticUrl('/favicon/favicon-32x32.png'),
        })

        notification.addEventListener('click', () => {
          window.focus()
          notification.close()
          callback(LocationAction.push(`/conversation/${conversation.uuid}`))
        })
      })
    }
  }
}

export const sendRequest = (userPub, text) => mergeAll(
  once({
    type: ActionTypes.CONVERSATION_SEND_REQUEST,
    userPub,
  }),

  fromCallback(callback => {
    const content = {
      type: 'request',
      text,
    }
    sendMessageToUser(userPub, userPub, content, ({ message, err }) => {
      if (err) {
        callback({
          type: ActionTypes.CONVERSATION_SEND_REQUEST_ERROR,
          userPub,
          err,
        })
      } else {
        // create a conversation after successfully sent the request.
        createConversation(message, conversation => {
          // and then navigate to the conversation.
          callback(LocationAction.push(`/conversation/${conversation.uuid}`))
        })
      }
    })
  })
)

export const acceptRequest = message => (
  fromBinder(sink => {
    // mark the request as processed.
    removeRequest(message)
    // create a conversation when accepting the request.
    createConversation(message, conversation => {
      // remove the request from request list store.
      sink({
        type: ActionTypes.REQUEST_ACCEPT,
        message,
      })
      // and then navigate to the conversation.
      sink(LocationAction.push(`/conversation/${conversation.uuid}`))
      sink(new End())
    })
  })
)

export const declineRequest = message => {
  // mark the request as processed.
  removeRequest(message)
  // remove the request from request list store.
  return {
    type: ActionTypes.REQUEST_DECLINE,
    message,
  }
}

export const amendRequest = (nextPair, conversePub, request) => {
  // mark the request as processed.
  removeRequest(request)
  // send a message in the conversation to amend the next pair.
  sendNextMessage(nextPair, conversePub, {
    type: 'amendRequest',
    nextPair: request.nextPair,
  })
  // remove the request from request list store.
  return {
    type: ActionTypes.REQUEST_ACCEPT,
    message: request,
  }
}

const filterRequestError = filter(
  propEq('type', ActionTypes.CONVERSATION_SEND_REQUEST_ERROR)
)

const findRequestSuccess = find(
  propEq('type', ActionTypes.CONVERSATION_SEND_REQUEST_SUCCESS)
)

export const sendGroupRequests = (userPubs, loginPub, text) => mergeAll(
  once({
    type: ActionTypes.CONVERSATION_SEND_GROUP_REQUESTS,
    userPubs,
  }),

  combineTemplate({
    // generate pairs for the group conversation.
    nextPair: fromPromise(Sea.pair()),
    conversePub: fromPromise(Sea.pair()).map(prop('pub')),
  })
    .flatMap(({ nextPair, conversePub }) => (
      // combine to wait for all group requests to finish.
      combineAsArray(userPubs.map(userPub => (
        fromCallback(callback => {
          const content = {
            type: 'request',
            adminPub: loginPub,
            memberPubs: [loginPub].concat(userPubs),
            nextPair,
            text,
          }
          // send group request one by one.
          sendMessageToUser(userPub, conversePub, content, ({ message, err }) => {
            if (err) {
              callback({
                type: ActionTypes.CONVERSATION_SEND_REQUEST_ERROR,
                userPub,
                err,
              })
            } else {
              callback({
                type: ActionTypes.CONVERSATION_SEND_REQUEST_SUCCESS,
                message,
              })
            }
          })
        })
      )))
    ))
    .flatMap(actions => {
      const errorActions = filterRequestError(actions)
      const successAction = findRequestSuccess(actions)

      // pass on error actions.
      const errorStream = errorActions.legnth > 0 && fromArray(errorActions)
      // if there is at least one group request was successful.
      const successStream = successAction && fromCallback(callback => {
        // create a conversation after successfully sent at least one request.
        createConversation(successAction.message, conversation => {
          // and then navigate to the conversation.
          callback(LocationAction.push(`/conversation/${conversation.uuid}`))
        })
      })

      if (successStream) {
        return !errorStream
          ? successStream
          : errorStream.merge(successStream)
      } else {
        return errorStream || never()
      }
    })
)

export const updateGroupConversation = (conversation, update) => {
  // update the group conversation e.g groupPair.
  if (conversation.memberPubs) {
    updateConversation(conversation.uuid, update)
  }
}

export const updateGroupName = (conversation, name) => {
  // update the group name.
  if (conversation.memberPubs) {
    updateGroup(conversation.groupPair, { name })
  }
}

export const renewGroupMembers = ({
  conversation,
  nextPair,
  memberPubs,
  addedPubs,
  removedPubs,
  remainingPubs,
  loginPub,
  text,
}) => {
  const { conversePub, groupPair } = conversation

  const sendRequests = targetPair => {
    // send group requests to new members.
    addedPubs.map(userPub => {
      sendMessageToUser(userPub, conversePub, {
        type: 'request',
        adminPub: loginPub,
        memberPubs,
        nextPair: targetPair,
        text,
      })
    })
  }

  if (removedPubs.length > 0) {
    // generate a new pair to exclude removed members.
    Sea.pair().then(renewPair => {
      // update the existing group.
      updateGroup(groupPair, { memberPubs }, group => {
        // and create a new group for the new pair.
        createGroup(renewPair, group)
      })
      // send the new pair to remaining members.
      remainingPubs.concat(loginPub).forEach(userPub => {
        sendNextMessageToUser(nextPair, userPub, conversePub, {
          type: 'renewGroup',
          renewPair,
        })
      })
      // send requests to new members.
      sendRequests(renewPair)
    })
  } else {
    // if there is no one removed,
    // simply update the existing group.
    updateGroup(groupPair, { memberPubs })
    // send requests to new members.
    sendRequests(groupPair)
  }
}

export const clearError = userPub => ({
  type: ActionTypes.CONVERSATION_CLEAR_REQUEST_ERROR,
  userPub,
})
