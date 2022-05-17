import React from 'react'
import { resetLocationHistory, LocationAction, LocationStore } from 'bdux-react-router'
import { createRoot } from 'bdux-universal'
import App from '../components/app.prod'
import ActionTypes from '../actions/action-types'
import LoginStore from '../stores/login-store'

export const renderElement = ({ dispatch }, req, _res, sheet) => {
  const { path, cookies } = req

  dispatch(LocationAction.listen())
  resetLocationHistory(path)
  if (!cookies?.recall) {
    dispatch({ type: ActionTypes.LOGOUT })
  }
  return sheet.collectStyles(<App />)
}

export default createRoot(
  renderElement, {
    location: LocationStore,
    login: LoginStore,
  },
)
