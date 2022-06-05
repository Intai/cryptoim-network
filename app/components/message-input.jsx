import React, { useCallback, useRef, useState } from 'react'
import styled from 'styled-components'
import TextArea from './text-area'
import Button from './button'
import MessageInputAudio from './message-input-audio'
import MessageInputImages from './message-input-images'
import MessageInputButtonAudio from './message-input-button-audio'
import MessageInputButtonImage from './message-input-button-image'
import MessageTypes from '../utils/message-types'
import { getNextPair } from '../utils/message-util'
import * as MessageAction from '../actions/message-action'

const MessageForm = styled.form`
  flex: 0 0 72px;
  display: flex;
  flex-wrap: wrap;
  padding-top: 15px;
`

const MessageTextArea = styled(TextArea)`
  flex: 1;
  margin-bottom: 30px;
  overflow: hidden;
`

const MessageButton = styled(Button)`
  flex: 0 0 auto;
  align-self: end;
  margin-bottom: 30px;
  height: 42px;
  width: 70px;
`

const MessageInput = ({ conversation, messages, dispatch }) => {
  const [images, setImages] = useState([])
  const [audio, setAudio] = useState()
  const textAreaRef = useRef()

  const handleSend = useCallback(e => {
    const form = e.target.form || e.target
    const formData = new FormData(form)
    const text = formData.get('text')
    const hasImages = images.length > 0

    if (text || audio || hasImages) {
      // the next pair either from the last message
      // or the conversation's initial pair.
      const nextPair = getNextPair(conversation, messages)

      if (nextPair) {
        const content = (!audio && !hasImages)
          ? text
          : {
            type: MessageTypes.RICH,
            images,
            audio,
            text,
          }

        // send a text message using the nextPair.
        dispatch(MessageAction.sendMessage(nextPair, conversation.conversePub, content))
        // clear the attached images and audio.
        setImages([])
        setAudio(null)
        // clear the text area.
        textAreaRef.current?.clear()
      }
    }
    e.preventDefault()
  }, [audio, conversation, dispatch, images, messages])

  return (
    <MessageForm onSubmit={handleSend}>
      <MessageInputImages
        images={images}
        setImages={setImages}
      />
      <MessageInputAudio
        audio={audio}
        setAudio={setAudio}
      />

      <MessageTextArea
        ref={textAreaRef}
        type="text"
        name="text"
        autoComplete="off"
        placeholder="Text message"
        onSubmit={handleSend}
      />

      <MessageInputButtonAudio
        setAudio={setAudio}
        textAreaRef={textAreaRef}
      />
      <MessageInputButtonImage
        setImages={setImages}
        textAreaRef={textAreaRef}
      />

      <MessageButton type="submit">
        {'Send'}
      </MessageButton>
    </MessageForm>
  )
}

export default React.memo(MessageInput)
