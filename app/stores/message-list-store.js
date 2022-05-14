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

const removeMessage = (message, messages) => {
  const source = messages || []

  // assuming there is no duplications.
  const index = findIndex(propEq('uuid', message.uuid), source)
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
        messages: state?.messages || [],
      },
    }),
  ])
)

const whenAppend = when(
  isAction(ActionTypes.MESSAGE_APPEND),
  converge(mergeDeepRight, [
    identity,
    ({ state, action: { message } }) => ({
      state: {
        messages: appendMessage(message, state?.messages),
      },
    }),
  ])
)

const whenExpire = when(
  isAction(ActionTypes.MESSAGE_EXPIRE),
  converge(mergeDeepRight, [
    identity,
    ({ state, action: { message } }) => ({
      state: {
        messages: removeMessage(message, state?.messages),
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
      .map(whenExpire)
      .map(prop('state')),
  }
}

export default createStore(
  StoreNames.MESSAGE_LIST, getReducer,
)
