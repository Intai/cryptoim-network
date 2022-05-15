import { count, find, propEq } from 'ramda'
import React, { useCallback, useMemo } from 'react'
import styled from 'styled-components'
import { LocationAction } from 'bdux-react-router'
import { primaryBackground, secondaryText } from './color'

const ListItem = styled.li`
  display: block;
  padding: 15px 20px 15px 30px;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  ${({ isSelected, ...args }) => isSelected && primaryBackground(args)}

  &:hover {
    ${primaryBackground}
  }
`

const Label = styled.div`
  flex: 1;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`

const Count = styled.div`
  ${secondaryText}
  flex: 0 0 auto;
  padding-left: 10px;
`

const isNewMessageInConversation = (conversePub, lastTimestamp) => message => {
  const { conversePub: messageConversePub, fromPub, timestamp } = message

  // if the message is newer.
  return (!lastTimestamp || timestamp > lastTimestamp)
    // message from myself in the conversation.
    && (conversePub === messageConversePub
      // or from the other user.
      || conversePub === fromPub)
}

const getContactLabel = contact => {
  if (contact) {
    const { alias, name, pub } = contact
    return name || alias || pub
  }
  return null
}

const ConversationListItem = ({ contacts, conversation, messages, isSelected, dispatch }) => {
  const { uuid, conversePub, lastTimestamp } = conversation
  const contact = find(propEq('pub', conversePub), contacts)

  const handleSelect = useCallback(() => {
    dispatch(LocationAction.push(`/conversation/${uuid}`))
  }, [dispatch, uuid])

  const newCount = useMemo(() => (
    count(isNewMessageInConversation(conversePub, lastTimestamp), messages)
  ), [conversePub, lastTimestamp, messages])

  return (
    <ListItem
      isSelected={isSelected}
      onClick={handleSelect}
    >
      <Label>{getContactLabel(contact) || conversePub}</Label>
      {!!newCount && <Count>{newCount} new</Count>}
    </ListItem>
  )
}

export default React.memo(ConversationListItem)
