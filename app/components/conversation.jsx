import { filter, find, last, pipe, prop, propEq, reduce, sortBy } from 'ramda'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useParams } from 'react-router'
import { LocationAction } from 'bdux-react-router'
import styled from 'styled-components'
import { createUseBdux } from 'bdux/hook'
import PanelHeader from './panel-header'
import Message from './message'
import MessageInput from './message-input'
import { scrollbar } from './scrollbar'
import { getStaticUrl } from '../utils/common-util'
import * as ConversationAction from '../actions/conversation-action'
import LoginStore from '../stores/login-store'
import ContactListStore from '../stores/contact-list-store'
import ConversationListStore from '../stores/conversation-list-store'
import MessageListStore from '../stores/message-list-store'

const TrashIcon = styled.img`
  height: 14px;
  padding: 28px 20px 18px 15px;
  vertical-align: top;
  cursor: pointer;
  opacity: 0.5;

  &:hover {
    opacity: 1;
  }
`

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
  const { messages } = messageList
  const scrollbarRef = useRef()

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
  const filteredMessages = useMemo(() => (
    filterSortMessages(loginPub, conversePub)(messages)
  ), [conversePub, loginPub, messages])

  // delete the conversation and then navigate back to the list.
  const handleDelete = useCallback(() => {
    dispatch(ConversationAction.remove(conversation))
    dispatch(LocationAction.replace('/conversations'))
  }, [conversation, dispatch])

  useEffect(() => {
    dispatch(ConversationAction.selectConversation(conversation, last(filteredMessages)?.timestamp))
  // when selecting a different conversation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation])

  useEffect(() => () => {
    dispatch(ConversationAction.deselectConversation())
  // willUnmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const { current: scrollbar } = scrollbarRef
    if (scrollbar) {
      // scroll to the bottom.
      scrollbar.scrollTop = scrollbar.scrollHeight
    }
  // either when switching between conversations,
  // or when there are new messages.
  }, [converseUuid, filteredMessages.length])

  if (!conversation || !contact) {
    // unknown conversation.
    // will redirect in the next didUpdate.
    return <PanelHeader />
  }

  return (
    <>
      <PanelHeader>
        {getContactLabel(contact)}
        <TrashIcon
          src={getStaticUrl('/icons/trash.svg')}
          title="Delete"
          onClick={handleDelete}
        />
      </PanelHeader>
      <Container>
        <MessageList ref={scrollbarRef}>
          {renderMessages((message, prev) => (
            <Message
              key={message.uuid}
              login={login}
              contact={contact}
              message={message}
              prev={prev}
            />
          ), filteredMessages)}
        </MessageList>

        <MessageInput
          conversation={conversation}
          messages={filteredMessages}
          dispatch={dispatch}
        />
      </Container>
    </>
  )
}

export default React.memo(Conversation)
