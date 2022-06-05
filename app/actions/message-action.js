import { find, findLast } from 'ramda'
import {
  fromBinder,
  fromCallback,
  mergeAll,
  once,
} from 'baconjs'
import ActionTypes from './action-types'
import MessageTypes from '../utils/message-types'
import { canUseNotification, getStaticUrl } from '../utils/common-util'
import {
  sendNextMessage,
  expireConversationMessage,
  getExpiredConversationMessage,
} from '../utils/conversation-util'
import { isMessageVisible, getMessageText } from '../utils/message-util'

const notificationCache = []

const getNotificationMessage = (contact, conversation) => {
  if (conversation.name) {
    return conversation.name
  }
  if (contact) {
    const contactName = contact.name || contact.alias
    if (contactName) {
      return contactName
    }
  }
  return 'New message'
}

const getServiceWorker = async (conversation, message) => {
  const { uuid: tag } = conversation
  const { timestamp } = message
  const registration = await navigator.serviceWorker.ready
  const notifications = [await registration.getNotifications(), ...notificationCache]

  if (!find(
    // skip if already notified.
    notification => tag === notification.tag && timestamp <= notification.timestamp,
    notifications
  )) {
    return registration
  }
}

export const notifyNewMessage = (contact, conversation, message) => {
  if (canUseNotification()
    && Notification.permission === 'granted'
    && isMessageVisible(message)
  ) {
    const text = getMessageText(message)
    if (text) {
      getServiceWorker(conversation, message).then(registration => {
        if (registration) {
          const notification = {
            tag: conversation.uuid,
            body: text,
            icon: getStaticUrl('/favicon/android-chrome-192x192.png'),
            timestamp: message.timestamp,
          }
          notificationCache.push(notification)
          registration.showNotification(
            getNotificationMessage(contact, conversation),
            notification
          )
        }
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
  timestamp && timestamp < Date.now() - 1000 * 60 * 60 * 24 * 90
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

  if (type === MessageTypes.RENEW_GROUP) {
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
