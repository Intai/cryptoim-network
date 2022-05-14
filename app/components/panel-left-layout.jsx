import React, { useCallback } from 'react'
import styled from 'styled-components'
import { useBdux } from 'bdux/hook'
import Button from './button'
import Profile from './profile'
import RequestList from './request-list'
import ConversationList from './conversation-list'
import { secondaryBackground } from './color'
import { scrollbar } from './scrollbar'
import { useResponsive } from '../hooks/responsive'
import * as LoginAction from '../actions/login-action'

const Container = styled.div`
  ${secondaryBackground}
  flex: 0 0 340px;
  max-width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  ${({ isMdDown }) => isMdDown && 'flex: 1;'}
`

const Scrollbar = styled.div`
  ${scrollbar}
  flex: 1;
`

const LogoutButton = styled(Button)`
  margin: 15px;
`

const PanelLeftLayout = props => {
  const { isMdAndUpOnly } = props
  const { dispatch } = useBdux(props)
  const { isBreakpointUp, isBreakpointDown } = useResponsive()

  const handleLogout = useCallback(() => {
    dispatch(LoginAction.logout())
  }, [dispatch])

  return (!isMdAndUpOnly || isBreakpointUp('md')) && (
    // take the whole width on sm and md screens.
    <Container isMdDown={isBreakpointDown('md')}>
      <Profile />
      <Scrollbar>
        <RequestList />
        <ConversationList />
      </Scrollbar>

      <LogoutButton
        type="button"
        kind="secondary"
        onClick={handleLogout}
      >
        {'Logout'}
      </LogoutButton>
    </Container>
  )
}

export default React.memo(PanelLeftLayout)
