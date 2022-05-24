import {
  converge,
  either,
  find,
  findIndex,
  identity,
  mergeDeepRight,
  pathEq,
  prop,
  propEq,
  remove,
  when,
  whereEq,
} from 'ramda'
import { Bus } from 'baconjs'
import { createStore } from 'bdux/store'
import StoreNames from './store-names'
import ConversationListStore from './conversation-list-store'
import RemovedListStore from './removed-list-store'
import ActionTypes from '../actions/action-types'
import * as ConversationAction from '../actions/conversation-action'

const isAction = pathEq(
  ['action', 'type'],
)

const appendRequest = (
  request,
  removed,
  requests,
  conversations,
  dispatch,
) => {
  const source = requests || []
  const { content, conversePub, nextPair } = request
  const { adminPub } = content

  // ignore the request if it has been accepted or declined.
  if ((removed && removed[request.uuid])
    // or exactly the same request by uuid.
    || find(propEq('uuid', request.uuid), source)) {
    return source
  }

  if (conversations) {
    if (
      // for a group chat request.
      (adminPub && (
        // if already accepted the group chat.
        find(whereEq({ conversePub, rootPair: nextPair }), conversations)
          // and ignore duplications.
          || find(propEq('conversePub', conversePub), source)))

      // between two users.
      || (!adminPub && (
        // if already having conversation.
        find(propEq('conversePub', request.fromPub), conversations)
          // and ignore duplications.
          || find(propEq('fromPub', request.fromPub), source)))
    ) {
      // don't need to ask again.
      dispatch(ConversationAction.declineRequest(request))
      return source
    }
  }

  return source.concat(request)
}

const removeRequest = (request, requests) => {
  const source = requests || []

  // assuming there is no duplications.
  const index = findIndex(propEq('fromPub', request.fromPub), source)
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
        requests: state?.requests || [],
      },
    }),
  ])
)

const whenReceive = when(
  isAction(ActionTypes.REQUEST_APPEND),
  converge(mergeDeepRight, [
    identity,
    ({ state, action: { message }, conversationList, removedList, dispatch }) => ({
      state: {
        requests: appendRequest(
          message,
          removedList?.removed,
          state?.requests,
          conversationList?.conversations,
          dispatch,
        ),
      },
    }),
  ])
)

const whenAcceptDecline = when(
  either(
    isAction(ActionTypes.REQUEST_ACCEPT),
    isAction(ActionTypes.REQUEST_DECLINE)
  ),
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
      .map(whenInit)
      .map(whenReceive)
      .map(whenAcceptDecline)
      .map(prop('state')),
  }
}

export default createStore(
  StoreNames.REQUEST_LIST, getReducer, {
    conversationList: ConversationListStore,
    removedList: RemovedListStore,
  }
)
