import { find, propEq } from 'ramda'
import React, { useCallback } from 'react'
import styled from 'styled-components'
import { LocationAction } from 'bdux-react-router'
import { secondaryBackground } from './color'
import { getStaticUrl } from '../utils/common-util'
import * as ContactAction from '../actions/contact-action'

const ListItem = styled.li`
  display: flex;
  padding: 15px 20px;
  cursor: pointer;

  &:hover {
    ${secondaryBackground}
  }
`

const Name = styled.div`
  flex: 1;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`

const TrashIcon = styled.img`
  flex: 0 0 auto;
  height: 14px;
  padding: 1px 0 0 10px;
  opacity: 0.25;

  &:hover {
    opacity: 1;
  }
`

const ContactListItem = ({ contact, conversations, dispatch }) => {
  const { alias, name, pub } = contact
  const contactName = name || alias || pub

  const handleNavigate = useCallback(() => {
    const conversation = find(propEq('conversePub', pub), conversations)
    if (conversation) {
      dispatch(LocationAction.push(`/conversation/${conversation.uuid}`))
    }
  }, [conversations, dispatch, pub])

  const handleDelete = useCallback(() => {
    dispatch(ContactAction.remove(contact))
  }, [contact, dispatch])

  return (
    <ListItem>
      <Name onClick={handleNavigate}>{contactName}</Name>
      <TrashIcon
        src={getStaticUrl('/icons/trash.svg')}
        title="Delete"
        onClick={handleDelete}
      />
    </ListItem>
  )
}

export default React.memo(ContactListItem)
