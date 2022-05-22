import React, { useCallback, useRef, useState } from 'react'
import styled from 'styled-components'
import { createUseBdux } from 'bdux/hook'
import { LocationAction } from 'bdux-react-router'
import Button from './button'
import { inputBackground } from './color'
import { fontSans } from './typography'
import { getStaticUrl } from '../utils/common-util'
import * as LoginAction from '../actions/login-action'
import LoginStore from '../stores/login-store'

const Container = styled.div`
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
`

const Alias = styled.div`
  display: inline-block;
  max-width: calc(100% - 45px);
  font-size: 30px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  padding: 18px 0 0 15px;
  box-sizing: border-box;
  cursor: pointer;
`

const AliasTextInput = styled.input`
  ${inputBackground}
  ${fontSans}
  border: 0;
  outline: 0;
  display: inline-block;
  max-width: calc(100% - 60px);
  width: 100%;
  font-size: 30px;
  margin: 18px 2px 1.5px 13px;
  box-sizing: border-box;
`

const KeyIcon = styled.img`
  height: 20px;
  padding: 26px 15px 0 10px;
  vertical-align: top;
  opacity: 0.5;

  &:hover {
    opacity: 1;
  }
`

const ChatButton = styled(Button)`
  margin: 20px 15px 15px 15px;
`

const useBdux = createUseBdux({
  login: LoginStore,
})

const Profile = props => {
  const { state: { login }, dispatch } = useBdux(props)
  const [isEditing, setIsEditing] = useState(false)
  const offsetRef = useRef(0)
  const profileName = login.name || login.alias

  const setInputNode = useCallback(node => {
    if (node) {
      const { current: offset } = offsetRef
      node.value = profileName
      node.focus()
      node.setSelectionRange(offset, offset)
      node.scrollLeft = 0
    }
  }, [profileName])

  const handleStartEditing = useCallback(e => {
    const node = e.target
    const selection = window.getSelection()
    if (selection.focusNode && selection.focusNode.nodeType === Node.TEXT_NODE) {
      offsetRef.current = Math.min(selection.focusOffset || 0, node.innerText.length)
    }
    setIsEditing(true)
  }, [])

  const handleKeyDown = useCallback(e => {
    if (e.keyCode === 13) {
      e.target.blur()
    } if (e.keyCode === 27) {
      setIsEditing(false)
    }
  }, [])

  const handleBlur = useCallback(e => {
    dispatch(LoginAction.rename(e.target.value))
    setIsEditing(false)
  }, [dispatch])

  const handleShowQrCode = useCallback(e => {
    dispatch(LocationAction.push(e.currentTarget.href))
    e.preventDefault()
  }, [dispatch])

  const handleStartChat = useCallback(() => {
    dispatch(LocationAction.push('/conversation/new'))
  }, [dispatch])

  return (
    <Container>
      <div>
        {isEditing
          ? (
            <AliasTextInput
              ref={setInputNode}
              spellCheck="false"
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
            />
          ) : (
            <Alias onClick={handleStartEditing}>
              {profileName}
            </Alias>
          )
        }
        <a
          href="/qr-code"
          onClick={handleShowQrCode}
        >
          <KeyIcon
            src={getStaticUrl('/icons/key.svg')}
            title="Login QR code"
          />
        </a>
      </div>

      <ChatButton onClick={handleStartChat}>
        {'Start chat'}
      </ChatButton>
    </Container>
  )
}

export default React.memo(Profile)
