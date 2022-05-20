import React, { useCallback } from 'react'
import styled from 'styled-components'
import { primaryBackground, primaryButton, secondaryButton } from './color'
import { getStaticUrl } from '../utils/common-util'
import * as ContactAction from '../actions/contact-action'
import * as ConversationAction from '../actions/conversation-action'

const AcceptButton = styled.div`
  ${secondaryButton}
  flex: 0 0 auto;
  padding: 5px 10px;
  margin: 10px 0 10px 10px;
`

const AcceptWrap = styled.div`
  flex: 1;
  display: flex;

  &:hover {
    ${primaryBackground}

    >${AcceptButton} {
      ${primaryButton}
    }
  }
`

const TrashIcon = styled.img`
  flex: 0 0 auto;
  height: 14px;
  padding: 17px 15px;
  opacity: 0.5;

  &:hover {
    opacity: 1;
  }
`

const ListItem = styled.li`
  display: flex;
  cursor: pointer;

  &:hover {
    ${primaryBackground}
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

  const handleAccept = useCallback(() => {
    dispatch(ContactAction.invite(fromPub))
    dispatch(ConversationAction.acceptRequest(request))
  }, [dispatch, fromPub, request])

  const handleDecline = useCallback(() => {
    dispatch(ConversationAction.declineRequest(request))
  }, [dispatch, request])

  return (
    <ListItem>
      <AcceptWrap onClick={handleAccept}>
        <Message>{text}</Message>
        <AcceptButton>Accept</AcceptButton>
      </AcceptWrap>
      <TrashIcon
        src={getStaticUrl('/icons/trash.svg')}
        title="Decline"
        onClick={handleDecline}
      />
    </ListItem>
  )
}

export default React.memo(RequestListItem)
