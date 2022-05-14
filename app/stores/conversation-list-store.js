import {
  converge,
  find,
  findIndex,
  identity,
  mergeDeepRight,
  pathEq,
  prop,
  propEq,
  remove,
  when,
} from 'ramda'
import { Bus } from 'baconjs'
import ActionTypes from '../actions/action-types'
import StoreNames from '../stores/store-names'
import { createStore } from 'bdux/store'

const isAction = pathEq(
  ['action', 'type'],
)

const appendConversation = (conversation, conversations) => {
  const source = conversations || []
  const dup = find(propEq('conversePub', conversation.conversePub), source)
  return dup
    ? source
    : source.concat(conversation)
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

const whenRemove = when(
  isAction(ActionTypes.CONVERSATION_REMOVE),
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
    ({ action: { publicKey } }) => ({
      state: {
        errors: {
          [publicKey]: null,
        },
      },
    }),
  ])
)

const whenSendRequestError = when(
  isAction(ActionTypes.CONVERSATION_SEND_REQUEST_ERROR),
  converge(mergeDeepRight, [
    identity,
    ({ action: { publicKey, err } }) => ({
      state: {
        errors: {
          [publicKey]: err,
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
      .map(whenRemove)
      .map(whenSendRequest)
      .map(whenSendRequestError)
      .map(prop('state')),
  }
}

export default createStore(
  StoreNames.CONVERSATION_LIST, getReducer,
)
