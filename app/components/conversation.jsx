import { filter, find, pipe, prop, propEq, reduce, sortBy } from 'ramda'
import React, { useMemo } from 'react'
import { useParams } from 'react-router'
import styled from 'styled-components'
import { createUseBdux } from 'bdux/hook'
import PanelHeader from './panel-header'
import Message from './message'
import MessageInput from './message-input'
import { scrollbar } from './scrollbar'
import LoginStore from '../stores/login-store'
import ContactListStore from '../stores/contact-list-store'
import ConversationListStore from '../stores/conversation-list-store'
import MessageListStore from '../stores/message-list-store'

const Container = styled.div`
  max-width: calc(100% - 40px);
  width: 975px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`

const MessageList = styled.ul`
  ${scrollbar}
  flex: 1;
`

const sortByTimestamp = sortBy(prop('timestamp'))

const filterSortMessages = (loginPub, conversePub) => pipe(
  filter(({ conversePub: messageConversePub, fromPub }) => (
    // message from myself in the conversation.
    (loginPub === fromPub && conversePub === messageConversePub)
      // or from the other user.
      || (loginPub === messageConversePub && conversePub === fromPub)
  )),
  sortByTimestamp
)

const getContactLabel = contact => {
  if (contact) {
    const { alias, name, pub } = contact
    return name || alias || pub
  }
  return null
}

const renderMessages = (render, messages) => reduce(
  ({ elements, prev }, message) => {
    // render with the previous message.
    const element = render(message, prev)
    elements.push(element)

    return {
      elements,
      prev: message,
    }
  }, {
    elements: [],
    prev: null,
  },
  messages
).elements

const useBdux = createUseBdux({
  login: LoginStore,
  contactList: ContactListStore,
  conversationList: ConversationListStore,
  messageList: MessageListStore,
})

const Conversation = (props) => {
  const { converseUuid } = useParams()
  const { state: { login, contactList, conversationList, messageList }, dispatch } = useBdux(props)

  // find the conversation by uuid in url.
  const conversation = useMemo(() => (
    find(propEq('uuid', converseUuid), conversationList.conversations)
  ), [conversationList.conversations, converseUuid])

  // find the other user in the conversation.
  const conversePub = conversation?.conversePub
  const contact = useMemo(() => (
    find(propEq('pub', conversePub), contactList.contacts)
  ), [contactList.contacts, conversePub])

  // filter and sort the messages in the conversation.
  const { pair: { pub: loginPub } } = login
  const messages = useMemo(() => (
    filterSortMessages(loginPub, conversePub)(messageList.messages)
  ), [conversePub, loginPub, messageList.messages])

  if (!conversation || !contact) {
    // unknown conversation.
    // will redirect in the next didUpdate.
    return <PanelHeader />
  }

  return (
    <>
      <PanelHeader>{getContactLabel(contact)}</PanelHeader>
      <Container>
        <MessageList>
          {renderMessages((message, prev) => (
            <Message
              key={message.uuid}
              login={login}
              contact={contact}
              message={message}
              prev={prev}
            />
          ), messages)}
        </MessageList>

        <MessageInput
          conversation={conversation}
          messages={messages}
          dispatch={dispatch}
        />
      </Container>
    </>
  )
}

export default React.memo(Conversation)
