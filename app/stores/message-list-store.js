import {
  converge,
  find,
  identity,
  mergeDeepRight,
  pathEq,
  prop,
  propEq,
  when,
} from 'ramda'
import { Bus } from 'baconjs'
import { createStore } from 'bdux/store'
import StoreNames from './store-names'
import ActionTypes from '../actions/action-types'

const isAction = pathEq(
  ['action', 'type'],
)

const appendMessage = (message, messages) => {
  const source = messages || []
  const dup = find(propEq('uuid', message.uuid), source)
  return dup
    ? source
    : source.concat(message)
}

const whenAppend = when(
  isAction(ActionTypes.MESSAGE_APPEND),
  converge(mergeDeepRight, [
    identity,
    ({ state, action: { message } }) => ({
      state: {
        messages: appendMessage(message, state.messages),
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
        messages: [],
      },
    }),
  ])
)

export const getReducer = () => {
  const reducerStream = new Bus()
  return {
    input: reducerStream,
    output: reducerStream
      .map(whenAppend)
      .map(whenLogout)
      .map(prop('state')),
  }
}

export default createStore(
  () => ({
    name: StoreNames.MESSAGE_LIST,
    defaultValue: {
      messages: [],
    },
  }),
  getReducer,
)
