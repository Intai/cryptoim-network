import {
  converge,
  equals,
  find,
  findIndex,
  identity,
  mergeDeepRight,
  pathEq,
  prop,
  propEq,
  remove,
  update,
  when,
} from 'ramda'
import { Bus } from 'baconjs'
import { createStore } from 'bdux/store'
import StoreNames from './store-names'
import ContactListStore from './contact-list-store'
import ActionTypes from '../actions/action-types'
import * as ConversationAction from '../actions/conversation-action'

const isAction = pathEq(
  ['action', 'type'],
)

const appendConversation = (conversation, conversations) => {
  const source = conversations || []
  const current = find(propEq('conversePub', conversation.conversePub), source)

  if (!current) {
    return source.concat(conversation)
  }
  if (!equals(current, conversation)) {
    const index = source.indexOf(current)
    return update(index, conversation, source)
  }
  return source
}

const removeConversation = (conversation, conversations) => {
  const source = conversations || []
  const index = findIndex(propEq('conversePub', conversation.conversePub), source)
  return (index < 0)
    ? source
    : remove(index, 1, source)
}

const whenInit = when(
  isAction(ActionTypes.CONVERSATION_INIT),
  converge(mergeDeepRight, [
    identity,
    ({ state }) => ({
      state: {
        conversations: state?.conversations || [],
        selected: null,
        errors: {},
      },
    }),
  ])
)

const whenAppend = when(
  isAction(ActionTypes.CONVERSATION_APPEND),
  converge(mergeDeepRight, [
    identity,
    ({ state, action: { conversation } }) => ({
      state: {
        conversations: appendConversation(conversation, state?.conversations),
      },
    }),
  ])
)

const whenSelect = when(
  isAction(ActionTypes.CONVERSATION_SELECT),
  converge(mergeDeepRight, [
    identity,
    ({ action: { conversation, timestamp }, dispatch }) => {
      // if the last message's timestamp is newer.
      const lastTimestamp = conversation?.lastTimestamp
      if (timestamp && lastTimestamp && timestamp > lastTimestamp) {
        // update the lastTimestamp in the conversation.
        dispatch(ConversationAction.updateLastTimestamp(conversation, timestamp))
      }

      return {
        state: {
          selected: conversation,
        },
      }
    },
  ])
)

const isMessageInConversation = message => conversation => {
  const { conversePub } = conversation
  const { conversePub: messageConversePub, fromPub } = message

  // message from myself in the conversation.
  return conversePub === messageConversePub
    // or from the other user.
    || conversePub === fromPub
}

const whenAppendMessage = when(
  isAction(ActionTypes.MESSAGE_APPEND),
  args => {
    const { state, action: { message }, contactList, dispatch } = args
    const { conversations, selected } = state
    const { content, fromPub, timestamp } = message
    const conversation = selected || find(isMessageInConversation(message), conversations)

    // if the message is in the currently selected conversation.
    if (selected && isMessageInConversation(message)(selected)) {
      // and the timestamp is newer.
      const currentTimestamp = selected.lastTimestamp
      if (!currentTimestamp || timestamp > currentTimestamp) {
        // update the lastTimestamp in the conversation.
        dispatch(ConversationAction.updateLastTimestamp(selected, timestamp))
      }
    } else {
      const sender = find(propEq('pub', fromPub), contactList.contacts)

      if (conversation
        // if the message is newer than the lastTimestamp in the conversation.
        && (!conversation.lastTimestamp || timestamp > conversation.lastTimestamp)) {
        // create a browser notification.
        dispatch(ConversationAction.notifyNewMessage(sender, conversation, message))
      }
    }

    if (content.type === 'renewGroup' && conversation
      // if the renewGroup message is newer than the groupTimestamp in the conversation.
      && (!conversation.groupTimestamp || timestamp > conversation.groupTimestamp)) {
      // update the groupTimestamp in the conversation.
      dispatch(ConversationAction.updateGroupTimestamp(conversation, timestamp))
      // update groupPair to new one to exclude some members.
      dispatch(ConversationAction.updateGroupConversation(conversation, {
        groupPair: content.renewPair,
      }))
    }

    return args
  }
)

const whenRemove = when(
  isAction(ActionTypes.CONVERSATION_DELETE),
  converge(mergeDeepRight, [
    identity,
    ({ state, action: { conversation } }) => ({
      state: {
        conversations: removeConversation(conversation, state?.conversations),
      },
    }),
  ])
)

const whenSendRequest = when(
  isAction(ActionTypes.CONVERSATION_SEND_REQUEST),
  converge(mergeDeepRight, [
    identity,
    ({ action: { userPub } }) => ({
      state: {
        errors: {
          [userPub]: null,
        },
      },
    }),
  ])
)

const whenSendGroupRequests = when(
  isAction(ActionTypes.CONVERSATION_SEND_GROUP_REQUESTS),
  converge(mergeDeepRight, [
    identity,
    ({ action: { userPubs } }) => ({
      state: {
        errors: userPubs.reduce((accum, userPub) => {
          accum[userPub] = null
          return accum
        }, {}),
      },
    }),
  ])
)

const whenSendRequestError = when(
  isAction(ActionTypes.CONVERSATION_SEND_REQUEST_ERROR),
  converge(mergeDeepRight, [
    identity,
    ({ action: { userPub, err } }) => ({
      state: {
        errors: {
          [userPub]: err,
        },
      },
    }),
  ])
)

const whenClearRequestError = when(
  isAction(ActionTypes.CONVERSATION_CLEAR_REQUEST_ERROR),
  converge(mergeDeepRight, [
    identity,
    ({ action: { userPub } }) => ({
      state: {
        errors: {
          [userPub]: null,
        },
      },
    }),
  ])
)

export const getReducer = () => {
  const reducerStream = new Bus()
  return {
    input: reducerStream,
    output: reducerStream
      .map(whenInit)
      .map(whenAppend)
      .map(whenSelect)
      .map(whenAppendMessage)
      .map(whenRemove)
      .map(whenSendRequest)
      .map(whenSendRequestError)
      .map(whenSendGroupRequests)
      .map(whenClearRequestError)
      .map(prop('state')),
  }
}

export default createStore(
  StoreNames.CONVERSATION_LIST, getReducer, {
    contactList: ContactListStore,
  }
)
