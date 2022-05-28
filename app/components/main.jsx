import React, { useEffect } from 'react'
import styled from 'styled-components'
import { createUseBdux } from 'bdux/hook'
import { LocationAction, LocationStore } from 'bdux-react-router'
import Login from './login'
import PanelLeft from './panel-left'
import PanelRight from './panel-right'
import { canUseDOM } from '../utils/common-util'
import * as LoginAction from '../actions/login-action'
import LoginStore from '../stores/login-store'

const Container = styled.div`
  display: flex;
  height: 100%;
`

const useBdux = createUseBdux({
  location: LocationStore,
  login: LoginStore,
}, [
  LocationAction.listen,
  LoginAction.init,
])

const Main = (props) => {
  const { state: { login, location } } = useBdux(props)

  useEffect(() => {
    if (canUseDOM()) {
      const vh = window.innerHeight
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }
  }, [])

  if (!login?.isAfterRecall) {
    return false
  }
  if (!login.isAuthenticated) {
    return <Login login={login} />
  }

  return (
    <Container>
      <PanelLeft location={location} />
      <PanelRight location={location} />
    </Container>
  )
}

export default Main
