import {
  fromBinder,
  fromCallback,
  mergeAll,
  once,
} from 'baconjs'
import ActionTypes from './action-types'
import {
  createConversation,
  getConversation,
  getConversationMessage,
  getMyMessage,
  sendMessageToUser,
  sendNextMessage,
  expireConversationMessage,
} from '../utils/conversation-util'

export const init = () => mergeAll(
  once({
    type: ActionTypes.CONVERSATION_INIT,
  }),

  fromBinder(sink => {
    getConversation(conversation => {
      sink({
        type: ActionTypes.CONVERSATION_APPEND,
        conversation,
      })
    })
  }),

  fromBinder(sink => {
    getConversationMessage(message => {
      sink({
        type: ActionTypes.MESSAGE_APPEND,
        message,
      })
    })
  }),

  fromBinder(sink => {
    getMyMessage(message => {
      sink({
        type: ActionTypes.MESSAGE_APPEND,
        message,
      })

      if (message.content.type === 'request') {
        sink({
          type: ActionTypes.CONVERSATION_APPEND_REQUEST,
          message,
        })
      }
    })
  })
)

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

export const sendRequest = (publicKey, text) => mergeAll(
  once({
    type: ActionTypes.CONVERSATION_SEND_REQUEST,
    publicKey,
  }),

  fromCallback(callback => {
    const content = {
      type: 'request',
      text,
    }
    sendMessageToUser(publicKey, publicKey, content, ({ message, err }) => {
      if (err) {
        callback({
          type: ActionTypes.CONVERSATION_SEND_REQUEST_ERROR,
          publicKey,
          err,
        })
      } else {
        // create a conversation after successfully sent the request.
        createConversation(message)
        // indicate the success in the ui.
        callback({
          type: ActionTypes.CONVERSATION_SEND_REQUEST_SUCCESS,
          publicKey,
          message,
        })
      }
    })
  })
)

export const acceptRequest = message => {
  // create a conversation when accepting the request.
  createConversation(message)
  // remove the request from data store.
  return {
    type: ActionTypes.CONVERSATION_ACCEPT_REQUEST,
    message,
  }
}
