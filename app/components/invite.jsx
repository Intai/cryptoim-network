import React, { useCallback } from 'react'
import styled from 'styled-components'
import QRCode from 'qrcode'
import { createUseBdux } from 'bdux/hook'
import { LocationAction } from 'bdux-react-router'
import PanelHeader from './panel-header'
import Anchor from './anchor'
import ContactList from './contact-list'
import { fontLarge } from './typography'
import { scrollbar } from './scrollbar'
import { getAppUrl } from '../utils/common-util'
import LoginStore from '../stores/login-store'

const Scrollbar = styled.div`
  ${scrollbar}
`

const Canvas = styled.canvas`
  max-width: 100%;
  object-fit: contain;
  object-position: bottom;
  margin: 15px auto;
  display: block;
`

const InviteMessageWrap = styled.div`
  text-align: center;
`

const InviteMessage = styled.div`
  ${fontLarge}
  display: inline-block;
  padding: 15px 20px 30px 20px;
  text-align: left;
  max-width: 100%;
  width: 330px;
  box-sizing: border-box;
`

const InviteAnchor = styled(Anchor)`
  display: inline-block;
  margin-top: 5px;
`

const getFromText = profileName => {
  if (profileName) {
    const truncated = (profileName.length > 10)
      ? `${profileName.slice(0, 10)}…`
      : profileName
    return ` from ${truncated}`
  }
  return ''
}

const useBdux = createUseBdux({
  login: LoginStore,
})

const Invite = (props) => {
  const { state: { login }, dispatch } = useBdux(props)
  const profileName = login.name || login.alias

  const setCanvasNode = useCallback((node) => {
    if (node) {
      QRCode.toCanvas(node, login.pair.pub)
    }
  }, [login.pair])

  const handleInviteScan = useCallback(e => {
    dispatch(LocationAction.push(e.currentTarget.href))
    e.preventDefault()
  }, [dispatch])

  // replace dots to avoid routing confusion. assuming there is no
  // space in public key. need to convert back on the receiving end.
  const inviteUrl = getAppUrl(`/invite?pub=${login.pair.pub}`)

  return (
    <>
      <PanelHeader>New conversation</PanelHeader>
      <Scrollbar>
        <Canvas ref={setCanvasNode} />

        <InviteMessageWrap>
          <InviteMessage>
            {'This is your invite QR code. To invite a new contact. Please either '}
            <InviteAnchor
              href="/invite/scan"
              kind="primary"
              onClick={handleInviteScan}
            >
              {'Scan their invite QR code'}
            </InviteAnchor>
            {' or '}
            <InviteAnchor
              href={`mailto:?subject=CyphrIM%20invite${getFromText(profileName)}&body=${inviteUrl}`}
              kind="primary"
            >
              {'Email your invite link'}
            </InviteAnchor>
          </InviteMessage>
        </InviteMessageWrap>

        <ContactList />
      </Scrollbar>
    </>
  )
}

export default React.memo(Invite)
