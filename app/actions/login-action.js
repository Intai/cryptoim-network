import { End, fromArray, fromBinder, fromCallback, mergeAll, once } from 'baconjs'
import { LocationAction } from 'bdux-react-router'
import ActionTypes from './action-types'
import { getLocalStorage } from '../utils/common-util'
import {
  recall,
  create,
  createAnonymous,
  authoriseQrCode,
  hasUser,
  setUserName,
  leave,
} from '../utils/login-util'

export const init = () => mergeAll(
  once({
    type: ActionTypes.LOGIN_CHECK_RADATA,
    hasRadata: !!getLocalStorage().radata,
  }),

  fromCallback(callback => {
    recall(({ alias, name, pair, err }) => {
      if (err || !alias) {
        callback({
          type: ActionTypes.LOGIN_RECALL_ERROR,
          err,
        })
      } else {
        callback({
          type: ActionTypes.LOGIN_SUCCESS,
          alias,
          name,
          pair,
        })
      }
    })
  })
)

export const checkAlias = alias => fromCallback(callback => {
  if (alias) {
    hasUser(alias, data => {
      callback(({
        type: ActionTypes.LOGIN_CHECK_ALIAS,
        isRegister: !data,
      }))
    })
  } else {
    callback(({
      type: ActionTypes.LOGIN_CHECK_ALIAS,
      isRegister: false,
    }))
  }
})

export const requireAlias = () => ({
  type: ActionTypes.LOGIN_ERROR,
  err: 'Please enter an alias.',
})

export const requirePassword = () => ({
  type: ActionTypes.LOGIN_ERROR,
  err: 'Please enter a password.',
})

export const requireConfirmation = () => ({
  type: ActionTypes.LOGIN_ERROR,
  err: 'The password confirmation does not match.',
})

export const requireStrong = () => ({
  type: ActionTypes.LOGIN_ERROR,
  err: `The password must contain:
 • length >= 8
 • uppercase character
 • lowercase character
 • numeric value
 • !"#$%&'()*+,-./:;<=>?@[]^_\`{|}~`,
})

export const clearError = () => ({
  type: ActionTypes.LOGIN_ERROR,
  err: null,
})

const adjustErrorMessage = (type, err) => {
  switch (err) {
  case 'User cannot be found!':
    return type === 'qr'
      ? 'Invalid QR code.'
      : 'Please check your alias.'
  default:
    return err
  }
}

export const login = (alias, password) => fromCallback(callback => {
  create(alias, password, ({ alias, name, pair, err }) => {
    if (err) {
      callback({
        type: ActionTypes.LOGIN_ERROR,
        err: adjustErrorMessage('password', err),
      })
    } else {
      callback({
        type: ActionTypes.LOGIN_SUCCESS,
        alias,
        name,
        pair,
      })
    }
  })
})

export const logout = () => {
  leave()
  return fromArray([
    { type: ActionTypes.LOGOUT },
    LocationAction.push('/'),
  ])
}

export const scanQrCode = scanPair => fromCallback(callback => {
  authoriseQrCode(scanPair, ({ alias, name, pair, err }) => {
    if (err) {
      callback({
        type: ActionTypes.LOGIN_ERROR,
        err: adjustErrorMessage('qr', err),
      })
    } else {
      callback({
        type: ActionTypes.LOGIN_SUCCESS,
        alias,
        name,
        pair,
      })
    }
  })
})

export const skip = () => fromBinder(sink => {
  createAnonymous(({ alias, name, pair, err }) => {
    if (err) {
      sink({
        type: ActionTypes.LOGIN_ERROR,
        err: adjustErrorMessage('anonymous', err),
      })
    } else {
      sink(LocationAction.push('/qr-code'))
      sink({
        type: ActionTypes.LOGIN_SUCCESS,
        alias,
        name,
        pair,
      })
    }
    sink(new End())
  })
})

export const rename = name => {
  setUserName(name)
  return {
    type: ActionTypes.LOGIN_RENAME,
    name,
  }
}
