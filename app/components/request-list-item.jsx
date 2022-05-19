import React, { useCallback } from 'react'
import styled from 'styled-components'
import { primaryBackground, primaryButton, secondaryButton } from './color'
import * as ContactAction from '../actions/contact-action'
import * as ConversationAction from '../actions/conversation-action'

const AcceptButton = styled.div`
  ${secondaryButton}
  flex: 0 0 auto;
  padding: 5px 10px;
  margin: 10px 15px 10px 10px;
`

const ListItem = styled.li`
  display: flex;
  cursor: pointer;

  &:hover {
    ${primaryBackground}

    >${AcceptButton} {
      ${primaryButton}
    }
  }
`

const Message = styled.div`
  flex: 1;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  padding: 15px 0 15px 30px;
  box-sizing: border-box;
`

const RequestListItem = ({ request, dispatch }) => {
  const { fromPub, content: { text } } = request
  console.log('intai render request', request)
  const handleAccept = useCallback(() => {
    dispatch(ContactAction.invite(fromPub))
    dispatch(ConversationAction.acceptRequest(request))
  }, [dispatch, fromPub, request])

  return (
    <ListItem onClick={handleAccept}>
      <Message>{text}</Message>
      <AcceptButton>Accept</AcceptButton>
    </ListItem>
  )
}

export default React.memo(RequestListItem)
