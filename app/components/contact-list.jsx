import React from 'react'
import styled from 'styled-components'
import { createUseBdux } from 'bdux/hook'
import ContactListItem from './contact-list-item'
import { fontLarge } from './typography'
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

const useBdux = createUseBdux({
  contactList: ContactListStore,
  conversationList: ConversationListStore,
})

const ContactList = props => {
  const { state: { contactList, conversationList }, dispatch } = useBdux(props)
  const { contacts } = contactList
  const { conversations } = conversationList

  return contacts.length > 0 && (
    <Container>
      <Title>Contacts</Title>
      <ul>
        {contacts.map(contact => (
          <ContactListItem
            key={contact.pub}
            contact={contact}
            conversations={conversations}
            dispatch={dispatch}
          />
        ))}
      </ul>
    </Container>
  )
}

export default React.memo(ContactList)
