import React from 'react'
import styled from 'styled-components'
import { tertiaryBackground, secondaryText } from './color'
import { fontSmall } from './typography'

const MessageListItem = styled.li`
  ${({ isMine }) => isMine && 'text-align: right;'}
  display: block;

  &:last-child {
    margin-bottom: 15px;
  }
`

const Label = styled.div`
  ${secondaryText}
  margin-top: 10px;
`

const Content = styled.div`
  ${tertiaryBackground}
  display: inline-block;
  padding: 15px 15px 10px 15px;
  margin-top: 5px;
  text-align: left;
  max-width: 80%;
  ${({ isMine }) => isMine && 'background: rgba(16, 124, 241, 0.25);'}
  ${({ isSameContact }) => isSameContact && 'margin-top: 0;'}
`

const Timestamp = styled.div`
  ${secondaryText}
  ${fontSmall}
  text-align: right;
  margin-top: 5px;
`

export const getContactLabel = contact => {
  if (contact) {
    const { alias, name } = contact
    return name || alias
  }
  return null
}

const getLocalDateString = timestamp => new Date(timestamp)
  .toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    hourCycle: 'h24',
    minute: 'numeric',
  })

const Message = ({ login, contact, message, prev }) => {
  const { content, fromPub, timestamp } = message
  const { pair: { pub: loginPub } } = login
  const isMine = fromPub === loginPub
  const isSameContact = prev?.fromPub === fromPub

  if (typeof content !== 'string') {
    return false
  }
  return (
    <MessageListItem isMine={isMine}>
      {!isSameContact && (
        <Label>
          {getContactLabel(isMine ? login : contact)}
        </Label>
      )}

      <Content
        isMine={isMine}
        isSameContact={isSameContact}
      >
        {content}
        <Timestamp>{getLocalDateString(timestamp)}</Timestamp>
      </Content>
    </MessageListItem>
  )
}

export default React.memo(Message)
