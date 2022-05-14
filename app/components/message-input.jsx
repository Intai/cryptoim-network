import { last } from 'ramda'
import React, { useCallback } from 'react'
import styled from 'styled-components'
import TextInput from './text-input'
import Button from './button'
import * as ConversationAction from '../actions/conversation-action'

const MessageForm = styled.form`
  flex: 0 0 72px;
  display: flex;
`

const MessageTextInput = styled(TextInput)`
  flex: 1;
  margin-bottom: 30px;
`

const MessageButton = styled(Button)`
  flex: 0 0 auto;
  margin-bottom: 30px;
  width: 70px;
`

const MessageInput = ({ conversation, messages, dispatch }) => {
  const handleSend = useCallback((e) => {
    const formData = new FormData(e.target)
    const text = formData.get('text')
    const input = e.currentTarget.querySelector('input')

    if (text) {
      // the next pair either from the last message
      // or the conversation's initial pair.
      const nextPair = last(messages)?.nextPair || conversation.nextPair
      if (nextPair) {
        // send a text message using the nextPair.
        dispatch(ConversationAction.sendMessage(nextPair, conversation.conversePub, text))
        // clear the text input.
        if (input) {
          input.value = ''
        }
      }
    }
    e.preventDefault()
  }, [conversation, dispatch, messages])

  return (
    <MessageForm onSubmit={handleSend}>
      <MessageTextInput
        type="text"
        name="text"
        autoComplete="off"
        placeholder="Text message"
      />
      <MessageButton type="submit">
        {'Send'}
      </MessageButton>
    </MessageForm>
  )
}

export default React.memo(MessageInput)
