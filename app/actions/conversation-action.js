import {
  fromBinder,
  fromCallback,
  mergeAll,
  once,
} from 'baconjs'
import { LocationAction } from 'bdux-react-router'
import ActionTypes from './action-types'
import { canUseDOM, getStaticUrl } from '../utils/common-util'
import {
  createConversation,
  getConversation,
  removeConversation,
  getConversationMessage,
  getMyMessage,
  sendMessageToUser,
  sendNextMessage,
  updateConversationLastTimestamp,
  expireConversationMessage,
} from '../utils/conversation-util'

export const init = () => mergeAll(
  once({
    type: ActionTypes.CONVERSATION_INIT,
  }),

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
    })
  )),

  fromBinder(sink => (
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

export const clearError = publicKey => ({
  type: ActionTypes.CONVERSATION_CLEAR_REQUEST_ERROR,
  publicKey,
})
