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

const isAction = pathEq(
  ['action', 'type'],
)

const whenCheckRadata = when(
  isAction(ActionTypes.LOGIN_CHECK_RADATA),
  converge(mergeDeepRight, [
    identity,
    ({ action: { hasRadata } }) => ({
      state: {
        hasRadata,
      },
    }),
  ])
)

const whenCheckAlias = when(
  isAction(ActionTypes.LOGIN_CHECK_ALIAS),
  converge(mergeDeepRight, [
    identity,
    ({ action: { isRegister } }) => ({
      state: {
        isRegister,
      },
    }),
  ])
)

const whenRecallError = when(
  isAction(ActionTypes.LOGIN_RECALL_ERROR),
  converge(mergeDeepRight, [
    identity,
    () => ({
      state: {
        isAuthenticated: false,
        isAfterRecall: true,
        err: null,
      },
    }),
  ])
)

const whenAuthError = when(
  isAction(ActionTypes.LOGIN_ERROR),
  converge(mergeDeepRight, [
    identity,
    ({ action: { err } }) => ({
      state: {
        isAuthenticated: false,
        err,
      },
    }),
  ])
)

const whenPasswordError = when(
  isAction(ActionTypes.PASSWORD_ERROR),
  converge(mergeDeepRight, [
    identity,
    ({ action: { err } }) => ({
      state: {
        err,
      },
    }),
  ])
)

const whenSuccess = when(
  isAction(ActionTypes.LOGIN_SUCCESS),
  converge(mergeDeepRight, [
    identity,
    ({ action: { alias, name, auth, pair } }) => ({
      state: {
        isAuthenticated: !!pair,
        isAfterRecall: true,
        err: null,
        alias,
        name,
        auth,
        pair,
      },
    }),
  ])
)

const whenRename = when(
  isAction(ActionTypes.LOGIN_RENAME),
  converge(mergeDeepRight, [
    identity,
    ({ action: { name } }) => ({
      state: {
        name,
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
        isRegister: undefined,
        isAuthenticated: false,
        isAfterRecall: true,
        err: null,
      },
    }),
  ])
)

export const getReducer = () => {
  const reducerStream = new Bus()
  return {
    input: reducerStream,
    output: reducerStream
      .map(whenCheckRadata)
      .map(whenCheckAlias)
      .map(whenRecallError)
      .map(whenAuthError)
      .map(whenPasswordError)
      .map(whenSuccess)
      .map(whenRename)
      .map(whenLogout)
      .map(prop('state')),
  }
}

export default createStore(
  StoreNames.LOGIN, getReducer,
)
