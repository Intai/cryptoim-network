import {
  converge,
  identity,
  mergeDeepRight,
  pathEq,
  prop,
  when,
} from 'ramda'
import { Bus } from 'baconjs'
import { createStore } from 'bdux/store'
import StoreNames from './store-names'
import ActionTypes from '../actions/action-types'
import * as ConversationAction from '../actions/conversation-action'

const isAction = pathEq(
  ['action', 'type'],
)

const whenInit = when(
  isAction(ActionTypes.CONVERSATION_INIT),
  converge(mergeDeepRight, [
    identity,
    ({ state }) => ({
      state: {
        removed: state?.removed || {},
      },
    }),
  ])
)

const whenRemoved = when(
  isAction(ActionTypes.REQUEST_REMOVED),
  converge(mergeDeepRight, [
    identity,
    ({ state, action: { uuids }, dispatch }) => {
      dispatch(ConversationAction.updateRequestRemoved())
      return {
        state: {
          removed: uuids.reduce((accum, uuid) => {
            accum[uuid] = true
            return accum
          }, { ...state?.removed }),
        },
      }
    },
  ])
)

export const getReducer = () => {
  const reducerStream = new Bus()
  return {
    input: reducerStream,
    output: reducerStream
      .map(whenInit)
      .map(whenRemoved)
      .map(prop('state')),
  }
}

export default createStore(
  StoreNames.REMOVED_LIST, getReducer
)
