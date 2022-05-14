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
import { createStore } from 'bdux/store'
import StoreNames from './store-names'
import ConversationListStore from './conversation-list-store'
import ActionTypes from '../actions/action-types'

const isAction = pathEq(
  ['action', 'type'],
)

const appendRequest = (request, requests, conversations) => {
  const source = requests || []

  // ignore the request if it has been accepted and having conversation.
  const accepted = conversations && find(propEq('conversePub', request.fromPub), conversations)
  if (accepted) {
    return source
  }
  // ignore duplications.
  const dup = find(propEq('fromPub', request.fromPub), source)
  return dup
    ? source
    : source.concat(request)
}

const removeRequest = (request, requests) => {
  const source = requests || []

  // assuming there is no duplications.
  const index = findIndex(propEq('fromPub', request.fromPub), source)
  return (index < 0)
    ? source
    : remove(index, 1, source)
}

const whenReceive = when(
  isAction(ActionTypes.CONVERSATION_APPEND_REQUEST),
  converge(mergeDeepRight, [
    identity,
    ({ state, action: { message }, conversationList }) => ({
      state: {
        requests: appendRequest(message, state?.requests, conversationList?.conversations),
      },
    }),
  ])
)

const whenAccept = when(
  isAction(ActionTypes.CONVERSATION_ACCEPT_REQUEST),
  converge(mergeDeepRight, [
    identity,
    ({ state, action: { message } }) => ({
      state: {
        requests: removeRequest(message, state?.requests),
      },
    }),
  ])
)

export const getReducer = () => {
  const reducerStream = new Bus()
  return {
    input: reducerStream,
    output: reducerStream
      .map(whenReceive)
      .map(whenAccept)
      .map(prop('state')),
  }
}

export default createStore(
  StoreNames.REQUEST_LIST, getReducer, {
    conversationList: ConversationListStore,
  }
)
