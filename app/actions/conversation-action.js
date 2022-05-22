import { filter, find, prop, propEq } from 'ramda'
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
  removeConversation,
  getRemovedRequest,
  removeRequest,
  getConversationMessage,
  getMyMessage,
  sendMessageToUser,
  sendNextMessage,
  updateConversationName,
  updateConversationLastTimestamp,
  expireConversationMessage,
} from '../utils/conversation-util'

export const init = () => mergeAll(
  once({
    type: ActionTypes.CONVERSATION_INIT,
  }),

  fromBinder(sink => (
    getRemovedRequest(uuid => {
      sink({
        type: ActionTypes.REQUEST_REMOVED,
        uuid,
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
    getConversationMessage(message => {
      sink({
        type: ActionTypes.MESSAGE_APPEND,
        message,
      })

      const { type } = message.content
      if (type === 'updateGroup') {
        sink({
          type: ActionTypes.GROUP_UPDATE,
          message,
        })
      }
    })
  )),

  fromBinder(sink => (
    getMyMessage(message => {
      sink({
        type: ActionTypes.MESSAGE_APPEND,
        message,
      })

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

export const expireConversation = (converseUuid, message) => {
  expireConversationMessage(converseUuid, message)
  return {
    type: ActionTypes.MESSAGE_EXPIRE,
    message,
  }
}

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
  updateConversationLastTimestamp(conversation.uuid, lastTimestamp)
}

export const notifyNewMessage = (contact, conversation, message) => (
  canUseDOM()
    && typeof message.content === 'string'
    && Notification.permission === 'granted'
    && fromCallback(callback => {
      const { alias, name } = contact
      const notification = new Notification(`New message from ${name || alias}`, {
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
)

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

export const updateGroupName = (conversation, name) => {
  // update the group conversation's name.
  if (conversation.memberPubs) {
    updateConversationName(conversation.uuid, name)
  }
}

export const applyGroupUpdate = (conversation, message) => {
  const { content: { name } } = message
  // mark the group update as processed.
  removeRequest(message)
  // and then update the group.
  updateGroupName(conversation, name)
}

export const sendGroupUpdate = (nextPair, conversePub, update) => {
  // send group update inside the conversation.
  sendNextMessage(nextPair, conversePub, {
    type: 'updateGroup',
    ...update,
  })
}

export const clearError = userPub => ({
  type: ActionTypes.CONVERSATION_CLEAR_REQUEST_ERROR,
  userPub,
})
