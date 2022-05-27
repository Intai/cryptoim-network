import { difference, intersection, keys } from 'ramda'
import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { createUseBdux } from 'bdux/hook'
import { LocationAction } from 'bdux-react-router'
import Button from './button'
import ContactListItem from './contact-list-item'
import { alertBackground } from './color'
import { fontLarge } from './typography'
import { getGroupRequestMessage } from '../utils/login-util'
import * as RequestAction from '../actions/request-action'
import * as ConversationAction from '../actions/conversation-action'
import LoginStore from '../stores/login-store'
import ContactListStore from '../stores/contact-list-store'
import ConversationListStore from '../stores/conversation-list-store'

const Container = styled.div`
  max-width: 100%;
  width: 975px;
  margin: 0 auto;
`

const Title = styled.div`
  ${fontLarge}
  margin: 15px 20px;
`

const Buttons = styled.div`
  margin-left: 20px;
`

const ErrorMessage = styled.div`
  ${alertBackground}
  display: block;
  padding: 10px;
  margin: 0 20xp 15px 20px;
  box-sizing: border-box;
  white-space: pre-wrap;
`

const defaultCheckedPubs = {}

const useBdux = createUseBdux({
  login: LoginStore,
  contactList: ContactListStore,
  conversationList: ConversationListStore,
})

const ContactList = props => {
  const { checkedPubs: propsCheckedPubs, conversation, nextPair } = props
  const isEditingGroup = !!propsCheckedPubs
  const checkedPubs = propsCheckedPubs || defaultCheckedPubs
  const { state: { login, contactList, conversationList }, dispatch } = useBdux(props)
  const { contacts } = contactList
  const { conversations } = conversationList
  const [isGroupChat, setIsGroupChat] = useState(isEditingGroup)
  const [error, setError] = useState(null)

  const handleSelectContacts = useCallback(() => {
    setIsGroupChat(true)
  }, [])

  const handleCancelGroup = useCallback(() => {
    setIsGroupChat(false)
  }, [])

  // start a new group chat.
  const handleStartGroup = useCallback(e => {
    const formData = new FormData(e.target)
    const publicKeys = Array.from(formData.keys())
    const names = Array.from(formData.values())

    // there needs to be at least one user selected.
    if (publicKeys.length > 0) {
      dispatch(RequestAction.sendGroupRequests(
        publicKeys,
        login.pair.pub,
        getGroupRequestMessage(login, names)
      ))
      setError(null)
    } else {
      setError('Please select at least one contact.')
    }
    e.preventDefault()
  }, [dispatch, login])

  // edit existing group members.
  const handleEditGroup = useCallback(e => {
    const formData = new FormData(e.target)
    const prevPubs = keys(checkedPubs)
    const nextPubs = Array.from(formData.keys())
    const names = Array.from(formData.values())
    const removedPubs = difference(prevPubs, nextPubs)
    const addedPubs = difference(nextPubs, prevPubs)
    const remainingPubs = intersection(prevPubs, nextPubs)

    if (nextPubs.length > 0) {
      const { pub: loginPub } = login.pair
      const memberPubs = [loginPub].concat(nextPubs)
      const text = getGroupRequestMessage(login, names)

      // - update group details.
      // - invite new members.
      // - exclude removed members.
      dispatch(ConversationAction.renewGroupMembers({
        conversation,
        nextPair,
        memberPubs,
        addedPubs,
        removedPubs,
        remainingPubs,
        loginPub,
        text,
      }))

      if (conversation) {
        // assuming we want to get back to conversation after updating group members.
        dispatch(LocationAction.push(`/conversation/${conversation.uuid}`))
      } else {
        setError(null)
      }
    } else {
      setError('Please select at least one contact.')
    }
    e.preventDefault()
  }, [checkedPubs, conversation, dispatch, login, nextPair])

  return contacts.length > 0 && (
    <Container>
      <Title>Contacts</Title>
      <form onSubmit={isEditingGroup ? handleEditGroup : handleStartGroup}>
        <Buttons>
          {!isGroupChat && (
            <Button
              type="button"
              kind="secondary"
              onClick={handleSelectContacts}
            >
              {'Select contacts for a group chat'}
            </Button>
          )}

          {isGroupChat && (
            <Button
              type="submit"
              kind="primary"
            >
              {isEditingGroup
                ? 'Update the group members'
                : 'Start the group chat'}
            </Button>
          )}

          {!isEditingGroup && isGroupChat && (
            <Button
              type="button"
              kind="secondary"
              onClick={handleCancelGroup}
            >
              {'Cancel'}
            </Button>
          )}
        </Buttons>

        {error && (
          <ErrorMessage>⚠️  {error}</ErrorMessage>
        )}

        <ul>
          {contacts.map(contact => (
            <ContactListItem
              key={contact.pub}
              login={login}
              contact={contact}
              conversations={conversations}
              checkedPubs={checkedPubs}
              isEditingGroup={isEditingGroup}
              isGroupChat={isGroupChat}
              dispatch={dispatch}
            />
          ))}
        </ul>
      </form>
    </Container>
  )
}

export default React.memo(ContactList)
