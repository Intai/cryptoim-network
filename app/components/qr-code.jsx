import { inc } from 'ramda'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import QRCode from 'qrcode'
import { createUseBdux } from 'bdux/hook'
import { LocationAction } from 'bdux-react-router'
import PanelHeader from './panel-header'
import Anchor from './anchor'
import Button from './button'
import TextInput from './text-input'
import { fontLarge } from './typography'
import { alertBackground, primaryBackground, secondaryBorder } from './color'
import { scrollbar } from './scrollbar'
import { isStrongPassword } from '../utils/login-util'
import * as LoginAction from '../actions/login-action'
import LoginStore from '../stores/login-store'

const Scrollbar = styled.div`
  ${scrollbar}
`

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 15px;
`

const Canvas = styled.canvas`
  max-width: 100%;
  object-fit: contain;
  object-position: bottom;
`

const Message = styled.div`
  ${fontLarge}
  padding: 30px 0 30px 0;
  max-width: 308px;
`

const Separator = styled.div`
  ${secondaryBorder}
  border-top: 1px solid;
  position: relative;
  margin: 15px 0 30px 0;
  max-width: 270px;
  width: 100%;
`

const SeparatorText = styled.div`
  ${primaryBackground}
  position: absolute;
  top: -0.6em;
  left: calc(50% - 1em - 3px);
  padding: 0 6px;
`

const ErrorMessage = styled.div`
  ${alertBackground}
  padding: 10px;
  margin: 0 0 15px;
  width: 270px;
  max-width: calc(100vw - 30px);
  box-sizing: border-box;
  white-space: pre-wrap;
`

const getHref = canvas => (
  canvas?.toDataURL('image/png')
    .replace(/^data:image\/[^;]*/, 'data:application/octet-stream')
)

const useBdux = createUseBdux({
  login: LoginStore,
})

const QrCode = (props) => {
  const { state: { login }, dispatch } = useBdux(props)
  const [isPasswordUpdated, setIsPasswordUpdated] = useState(false)
  const [, forceUpdate] = useState(0)
  const canvasRef = useRef()

  const setCanvasNode = useCallback((node) => {
    canvasRef.current = node
    if (node) {
      QRCode.toCanvas(node, JSON.stringify(login.pair), err => {
        if (!err) {
          forceUpdate(inc)
        }
      })
    }
  }, [login.pair])

  const handleUpdatePassword = useCallback(e => {
    const formData = new FormData(e.target)
    const password = formData.get('password')
    const confirm = formData.get('confirm')

    if (!password) {
      dispatch(LoginAction.requirePassword(true))
    } else if (password !== confirm) {
      dispatch(LoginAction.requireConfirmation(true))
    } else if (!isStrongPassword(password)) {
      dispatch(LoginAction.requireStrong(true))
    } else {
      dispatch(LoginAction.updatePassword(password))
      setIsPasswordUpdated(true)
    }
    e.preventDefault()
  }, [dispatch])

  const handleContinue = useCallback(() => {
    dispatch(LocationAction.push('/conversations'))
  }, [dispatch])

  useEffect(() => {
    // after successfully updating password.
    if (!login?.err && isPasswordUpdated) {
      handleContinue()
    }
  })

  return (
    <>
      <PanelHeader>Login QR code</PanelHeader>
      <Scrollbar>
        <Container>
          <Canvas ref={setCanvasNode} />

          <Message>
            {'This is your login. Please '}
            <Anchor
              href={getHref(canvasRef.current)}
              download="CyphrIM login QR code.png"
              kind="primary"
            >
              {'Download'}
            </Anchor>
            {' and store securely. Anyone has the QR code can login as you.'}
          </Message>

          <Button
            type="button"
            kind="secondary"
            onClick={handleContinue}
          >
            {'Continue'}
          </Button>

          <Separator>
            <SeparatorText>OR</SeparatorText>
          </Separator>

          <form onSubmit={handleUpdatePassword}>
            {login?.err && (
              <ErrorMessage>⚠️  {login.err}</ErrorMessage>
            )}

            <TextInput
              type="password"
              name="password"
              placeholder="Password"
              autoComplete="off"
            />
            <TextInput
              type="password"
              name="confirm"
              placeholder="Confirm Password"
              autoComplete="off"
            />
            <Button
              type="submit"
              kind="secondary"
            >
              {login.auth
                ? 'Update password'
                : 'Setup password'}
            </Button>
          </form>
        </Container>
      </Scrollbar>
    </>
  )
}

export default React.memo(QrCode)
