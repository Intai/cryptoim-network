import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import QrScanner from 'qr-scanner'
import { createUseBdux } from 'bdux/hook'
import { LocationAction } from 'bdux-react-router'
import PanelHeader from './panel-header'
import Button from './button'
import Select from './select'
import { alertBackground, secondaryBorder } from './color'
import { canUseDOM } from '../utils/common-util'
import { getRequestMessage } from '../utils/login-util'
import * as ContactAction from '../actions/contact-action'
import * as RequestAction from '../actions/request-action'
import LoginStore from '../stores/login-store'
import ConversationListStore from '../stores/conversation-list-store'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const Video = styled.video`
  ${secondaryBorder}
  border: 1px solid;
  width: calc(100% - 30px);
  max-height: calc(var(--vh, 100vh) - 218px);
  margin: 15px 0 20px;
  position: relative;
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

const useBdux = createUseBdux({
  login: LoginStore,
  conversationList: ConversationListStore,
})

const InviteScan = props => {
  const { state: { login, conversationList }, dispatch } = useBdux(props)
  const [isBlocked, setIsBlocked] = useState(false)
  const [hasCamera, setHasCamera] = useState(true)
  const [cameras, setCameras] = useState([])
  const qrScannerRef = useRef()
  const publicKeyRef = useRef()
  const requestMessage = useMemo(() => getRequestMessage(login), [login])
  const { errors } = conversationList
  const error = errors[publicKeyRef.current]

  const setVideoNode = useCallback((node) => {
    if (node) {
      const qrScanner = new QrScanner(node, result => {
        const publicKey = result.data
        if (publicKey && publicKeyRef.current !== publicKey) {
          publicKeyRef.current = publicKey
          dispatch(ContactAction.append(publicKey))
          dispatch(RequestAction.sendRequest(publicKey, requestMessage))
        }
      }, {
        highlightScanRegion: true,
      })

      // start scanning and keep a reference to detroy when unmounting.
      qrScannerRef.current = qrScanner
      qrScanner.start().catch(() => {
        setIsBlocked(true)
      })
    }
  }, [dispatch, requestMessage])

  useEffect(() => {
    if (canUseDOM()) {
      const vh = window.innerHeight
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    // detect cameras.
    QrScanner.hasCamera().then(setHasCamera)
    QrScanner.listCameras().then(setCameras)

    return () => {
      const { current: qrScanner } = qrScannerRef
      if (qrScanner) {
        // clean up the scanner library.
        qrScanner.destroy()
      }
    }
  }, [])

  const handleChangeCamera = useCallback((e) => {
    const { current: qrScanner } = qrScannerRef
    if (qrScanner) {
      // select a different camera.
      qrScanner.setCamera(e.target.value)
    }
  }, [])

  const handleCancel = useCallback(() => {
    LocationAction.push('/conversation/new')
  }, [])

  const hasCameraNotBlocked = hasCamera && !isBlocked
  const errorMessage = (error && 'Sorry, can not verify the invite QR code. Could be network issue. Please try again later.')
    || (!hasCameraNotBlocked && 'There is no camera detected.')

  return (
    <>
      <PanelHeader href="/conversation/new">
        {'Invite QR code'}
      </PanelHeader>

      <Container>
        <Video ref={setVideoNode} />
        <div>
          {errorMessage && (
            <ErrorMessage>⚠️  {errorMessage}</ErrorMessage>
          )}

          {hasCameraNotBlocked && (
            <Select onChange={handleChangeCamera}>
              {cameras.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </Select>
          )}

          <Button
            type="button"
            kind="secondary"
            onClick={handleCancel}
          >
            {'Cancel'}
          </Button>
        </div>
      </Container>
    </>
  )
}

export default React.memo(InviteScan)
