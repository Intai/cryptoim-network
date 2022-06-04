import { filter, last, pipe, prop, sortBy } from 'ramda'
import MessageTypes from './message-types'

const sortByTimestamp = sortBy(prop('timestamp'))

export const filterSortMessages = (loginPub, conversePub) => pipe(
  filter(({ conversePub: messageConversePub, fromPub }) => (
    // message from myself in the conversation,
    // or messages in a group chat.
    (conversePub === messageConversePub)
      // or from the other user.
      || (loginPub === messageConversePub && conversePub === fromPub)
  )),
  sortByTimestamp
)

export const getNextPair = (conversation, messages) => {
  const lastMessage = messages && last(messages)
  const lastNextPair = lastMessage?.nextPair
  const converseNextPair = conversation.nextPair

  if (lastNextPair && converseNextPair) {
    // a new conversation could be created after previous messages
    // by deleting the previous conversation and accepting a new request.
    return lastMessage.timestamp <= conversation.createdTimestamp
      ? converseNextPair
      : lastNextPair
  }
  return lastNextPair || converseNextPair
}

export const isMessageVisible = message => (
  typeof message.content === 'string'
    || message.content.type === MessageTypes.RICH
)

export const getMessageText = message => (
  typeof message.content === 'string'
    ? message.content
    : message.content.text
)

export const getMessageImages = message => (
  message.content.images
)
