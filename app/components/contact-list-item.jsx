import { find, propEq } from 'ramda'
import React, { useCallback, useMemo } from 'react'
import styled from 'styled-components'
import { LocationAction } from 'bdux-react-router'
import { secondaryBackground } from './color'
import { getStaticUrl } from '../utils/common-util'
import { getRequestMessage } from '../utils/login-util'
import * as ContactAction from '../actions/contact-action'
import * as ConversationAction from '../actions/conversation-action'

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
  opacity: 0.5;

  &:hover {
    opacity: 1;
  }
`

const ContactListItem = ({ login, contact, conversations, dispatch }) => {
  const { alias, name, pub } = contact
  const contactName = name || alias || pub

  const conversation = useMemo(() => (
    find(propEq('conversePub', pub), conversations)
  ), [conversations, pub])

  const handleNavigate = useCallback(() => {
    if (conversation) {
      dispatch(LocationAction.push(`/conversation/${conversation.uuid}`))
    } else {
      dispatch(ConversationAction.sendRequest(pub, getRequestMessage(login)))
    }
  }, [conversation, dispatch, login, pub])

  const handleDelete = useCallback(() => {
    dispatch(ContactAction.remove(contact))
    if (conversation) {
      dispatch(ConversationAction.remove(conversation))
    }
  }, [contact, conversation, dispatch])

  return (
    <ListItem>
      <Name onClick={handleNavigate}>{contactName}</Name>
      <TrashIcon
        src={getStaticUrl('/icons/trash.svg')}
        title="Delete the contact"
        onClick={handleDelete}
      />
    </ListItem>
  )
}

export default React.memo(ContactListItem)
