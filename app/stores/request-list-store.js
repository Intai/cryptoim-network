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
import LoginStore from './login-store'
import ConversationListStore from './conversation-list-store'
import MessageListStore from './message-list-store'
import RemovedListStore from './removed-list-store'
import { filterSortMessages, getNextPair } from '../utils/message-util'
import ActionTypes from '../actions/action-types'
import * as ConversationAction from '../actions/conversation-action'

const isAction = pathEq(
  ['action', 'type'],
)

const appendRequest = ({
  request,
  requests,
  login,
  conversations,
  messages,
  removed,
  dispatch,
}) => {
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
    // for a group chat request.
    if (adminPub && (
      // if already accepted the group chat.
      find(whereEq({ conversePub, rootPair: nextPair }), conversations)
        // and ignore duplications.
        || find(propEq('conversePub', conversePub), source))
    ) {
      // don't need to ask again.
      dispatch(ConversationAction.declineRequest(request))
      return source
    }

    // between two users.
    if (!adminPub) {
      // ignore duplications.
      if (find(propEq('fromPub', request.fromPub), source)) {
        // don't need to ask again.
        dispatch(ConversationAction.declineRequest(request))
        return source
      }

      // if already having conversation.
      const conversation = find(propEq('conversePub', request.fromPub), conversations)
      if (conversation) {
        // amend the request into the conversation.
        dispatch(ConversationAction.amendRequest(
          getNextPair(conversation, filterSortMessages(login.pair.pub, conversePub)(messages)),
          conversePub,
          request
        ))
        return source
      }
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
    ({ state, action: { message }, login, conversationList, messageList, removedList, dispatch }) => ({
      state: {
        requests: appendRequest({
          request: message,
          requests: state?.requests,
          login,
          conversations: conversationList?.conversations,
          messages: messageList?.messages,
          removed: removedList?.removed,
          dispatch,
        }),
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

const whenLogout = when(
  isAction(ActionTypes.LOGOUT),
  converge(mergeDeepRight, [
    identity,
    () => ({
      state: {
        requests: [],
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
      .map(whenLogout)
      .map(prop('state')),
  }
}

export default createStore(
  StoreNames.REQUEST_LIST, getReducer, {
    login: LoginStore,
    conversationList: ConversationListStore,
    messageList: MessageListStore,
    removedList: RemovedListStore,
  }
)
