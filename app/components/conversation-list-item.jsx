import { find, propEq } from 'ramda'
import React, { useCallback } from 'react'
import styled from 'styled-components'
import { LocationAction } from 'bdux-react-router'
import { primaryBackground } from './color'

const ListItem = styled.li`
  display: block;
  padding: 15px 20px 15px 30px;
  box-sizing: border-box;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  cursor: pointer;
  ${({ isSelected, ...args }) => isSelected && primaryBackground(args)}

  &:hover {
    ${primaryBackground}
  }
`

const getContactLabel = contact => {
  if (contact) {
    const { alias, name, pub } = contact
    return name || alias || pub
  }
  return null
}

const ConversationListItem = ({ contacts, conversation, isSelected, dispatch }) => {
  const { uuid, conversePub } = conversation
  const contact = find(propEq('pub', conversePub), contacts)

  const handleSelect = useCallback(() => {
    dispatch(LocationAction.push(`/conversation/${uuid}`))
  }, [dispatch, uuid])

  return (
    <ListItem
      isSelected={isSelected}
      onClick={handleSelect}
    >
      {getContactLabel(contact) || conversePub}
    </ListItem>
  )
}

export default React.memo(ConversationListItem)
