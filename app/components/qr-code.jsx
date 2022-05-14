import { inc } from 'ramda'
import React, { useCallback, useRef, useState } from 'react'
import styled from 'styled-components'
import QRCode from 'qrcode'
import { createUseBdux } from 'bdux/hook'
import { LocationAction } from 'bdux-react-router'
import PanelHeader from './panel-header'
import Anchor from './anchor'
import Button from './button'
import { fontLarge } from './typography'
import LoginStore from '../stores/login-store'

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

const getHref = canvas => (
  canvas?.toDataURL('image/png')
    .replace(/^data:image\/[^;]*/, 'data:application/octet-stream')
)

const useBdux = createUseBdux({
  login: LoginStore,
})

const QrCode = (props) => {
  const { state: { login } } = useBdux(props)
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

  const handleContinue = useCallback(() => {
    LocationAction.push('/conversations')
  }, [])

  return (
    <>
      <PanelHeader>Login QR code</PanelHeader>
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
          {'Done'}
        </Button>
      </Container>
    </>
  )
}

export default React.memo(QrCode)
