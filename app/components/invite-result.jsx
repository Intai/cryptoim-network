import { find, propEq } from 'ramda'
import React, { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { createUseBdux } from 'bdux/hook'
import { LocationAction } from 'bdux-react-router'
import PanelHeader from './panel-header'
import { fontLarge } from './typography'
import * as ContactAction from '../actions/contact-action'
import * as ConversationAction from '../actions/conversation-action'
import LoginStore from '../stores/login-store'
import ConversationListStore from '../stores/conversation-list-store'

const InviteMessageWrap = styled.div`
  text-align: center;
`

const InviteMessage = styled.div`
  ${fontLarge}
  display: inline-block;
  padding: 15px;
  text-align: left;
  max-width: 300px;
`

const getRequestMessage = ({ alias, name, pair: { pub } }) => (
  `From ${name || alias || pub}`
)

const useBdux = createUseBdux({
  login: LoginStore,
  conversationList: ConversationListStore,
})

const InviteResult = props => {
  const [searchParams] = useSearchParams()
  const publicKey = searchParams.get('pub')
  const { state: { login, conversationList }, dispatch } = useBdux(props)
  const { conversations, errors } = conversationList
  const error = publicKey ? errors[publicKey] : 'Invalid public key.'
  const countRef = useRef(0)

  const sendRequest = () => {
    if (publicKey) {
      dispatch(ContactAction.invite(publicKey))
      dispatch(ConversationAction.sendRequest(publicKey, getRequestMessage(login)))
    }
  }

  useEffect(() => {
    if (!error) {
      // try to find the conversation by its public key.
      // if it's there, navigate to the conversation.
      const conversation = find(propEq('conversePub', publicKey), conversations)
      if (conversation) {
        dispatch(LocationAction.replace(`/conversation/${conversation.uuid}`))
      }
    } else if (countRef.current < 1) {
      if (publicKey) {
        dispatch(ConversationAction.clearError(publicKey))
      }
      countRef.current += 1
      setTimeout(sendRequest, 300)
    }
  })

  useEffect(() => {
    // gun doesn't return user in the callback if too early.
    // please remove the timeout when fixed.
    setTimeout(sendRequest, 300)
  // didMount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return error && countRef.current >= 1 && (
    <>
      <PanelHeader>Invite link</PanelHeader>
      <InviteMessageWrap>
        <InviteMessage>
          {'Sorry, can not verify the invite link. Could be network issue. Please try again later.'}
        </InviteMessage>
      </InviteMessageWrap>
    </>
  )
}

export default React.memo(InviteResult)
