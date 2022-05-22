import { find, propEq } from 'ramda'
import React, { useCallback, useMemo, useRef } from 'react'
import styled from 'styled-components'
import { LocationAction } from 'bdux-react-router'
import Checkbox from './checkbox'
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

const ContactCheckbox = styled(Checkbox)`
  flex: 0 0 auto;
  margin: -1px 0 -2px 0;
`

const Name = styled.div`
  flex: 1;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  padding: 15px 0 15px 10px;
  margin: -15px 0;
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

const ContactListItem = ({
  login,
  contact,
  conversations,
  checkedPubs,
  isEditingGroup,
  isGroupChat,
  dispatch,
}) => {
  const { alias, name, pub } = contact
  const contactName = name || alias || pub
  const checkboxRef = useRef()

  const conversation = useMemo(() => (
    find(propEq('conversePub', pub), conversations)
  ), [conversations, pub])

  const handleNavigate = useCallback(() => {
    if (isGroupChat) {
      const { current: checkbox } = checkboxRef
      if (checkbox) {
        checkbox.click()
      }
    } else if (conversation) {
      dispatch(LocationAction.push(`/conversation/${conversation.uuid}`))
    } else {
      dispatch(ConversationAction.sendRequest(pub, getRequestMessage(login)))
    }
  }, [conversation, dispatch, isGroupChat, login, pub])

  const handleDelete = useCallback(() => {
    dispatch(ContactAction.remove(contact))
    if (conversation) {
      dispatch(ConversationAction.remove(conversation))
    }
  }, [contact, conversation, dispatch])

  return (
    <ListItem>
      {isGroupChat && (
        <ContactCheckbox
          ref={checkboxRef}
          name={pub}
          value={contactName}
          checked={!!checkedPubs[pub]}
        />
      )}

      <Name onClick={handleNavigate}>{contactName}</Name>
      {!isEditingGroup && (
        <TrashIcon
          src={getStaticUrl('/icons/trash.svg')}
          title="Delete the contact"
          onClick={handleDelete}
        />
      )}
    </ListItem>
  )
}

export default React.memo(ContactListItem)
