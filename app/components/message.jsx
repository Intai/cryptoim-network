import { find, propEq } from 'ramda'
import React, { useMemo } from 'react'
import styled from 'styled-components'
import MessageInputImages from './message-images'
import { tertiaryBackground, secondaryText } from './color'
import { fontSmall } from './typography'
import { isMessageVisible, getMessageText, getMessageImages } from '../utils/message-util'

const MessageListItem = styled.li`
  ${({ isMine }) => isMine && 'text-align: right;'}
  display: block;
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
  white-space: pre-wrap;
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

const Message = ({ login, contacts, message, prev }) => {
  const { fromPub, timestamp } = message
  const { pair: { pub: loginPub } } = login
  const isMine = fromPub === loginPub
  const isSameContact = prev?.fromPub === fromPub && prev && isMessageVisible(prev)
  const images = getMessageImages(message)

  const contact = useMemo(() => (
    find(propEq('pub', fromPub), contacts)
  ), [contacts, fromPub])

  if (!isMessageVisible(message)) {
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
        <MessageInputImages images={images} />
        {getMessageText(message)}
        <Timestamp>{getLocalDateString(timestamp)}</Timestamp>
      </Content>
    </MessageListItem>
  )
}

export default React.memo(Message)
