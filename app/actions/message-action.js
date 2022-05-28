import { findLast } from 'ramda'
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
  sendNextMessage,
  expireConversationMessage,
  getExpiredConversationMessage,
} from '../utils/conversation-util'

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
    && window.Notification
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

export const expireConversationMessages = (converseUuid, sortedMessages) => {
  const lastExpiredMessage = findLastExpiredMessage(sortedMessages)
  if (lastExpiredMessage) {
    // expire old messages by pointing the conversation to start from the next pair.
    expireConversationMessage(converseUuid, lastExpiredMessage)
  }
}

export const appendConversationMessage = sink => message => {
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
