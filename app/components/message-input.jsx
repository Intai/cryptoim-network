import { append, forEach } from 'ramda'
import { v4 as uuidv4 } from 'uuid'
import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import TextInput from './text-input'
import FileInput from './file-input'
import Button from './button'
import MessageInputImages from './message-input-images'
import { inputBackground } from './color'
import MessageTypes from '../utils/message-types'
import { getStaticUrl } from '../utils/common-util'
import { getNextPair } from '../utils/message-util'
import * as MessageAction from '../actions/message-action'

const MessageForm = styled.form`
  flex: 0 0 72px;
  display: flex;
  flex-wrap: wrap;
`

const MessageTextInput = styled(TextInput)`
  flex: 1;
  margin-bottom: 30px;
  overflow: hidden;
`

const MessageButton = styled(Button)`
  flex: 0 0 auto;
  margin-bottom: 30px;
  width: 70px;
`

const ImageFileInput = styled(FileInput)`
  ${inputBackground}
  flex: 0 0 auto;
  margin: 0 0 30px 0;
  padding: 12px 15px 12px 10px;
  width: auto;
  max-width: none;
  border: none;
`

const ImageIcon = styled.img`
  height: 18px;
  transition: transform linear 100ms;
  vertical-align: top;
  cursor: pointer;

  &:hover {
    transform: scale(1.3);
  }
`

const MessageInput = ({ conversation, messages, dispatch }) => {
  const [images, setImages] = useState([])

  const handleSend = useCallback(e => {
    const formData = new FormData(e.target)
    const text = formData.get('text')
    const input = e.currentTarget.querySelector('input')
    const hasImages = images.length > 0

    if (text || hasImages) {
      // the next pair either from the last message
      // or the conversation's initial pair.
      const nextPair = getNextPair(conversation, messages)

      if (nextPair) {
        const content = !hasImages
          ? text
          : {
            type: MessageTypes.IMAGES,
            images,
            text,
          }

        // send a text message using the nextPair.
        dispatch(MessageAction.sendMessage(nextPair, conversation.conversePub, content))
        // clear the attached images.
        setImages([])
        // clear the text input.
        if (input) {
          input.value = ''
        }
      }
    }
    e.preventDefault()
  }, [conversation, dispatch, images, messages])

  const handleAttachImage = useCallback(e => {
    const { files } = e.target

    // read files to data urls.
    if (files.length > 0) {
      forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => setImages(append({
          uuid: uuidv4(),
          name: file.name,
          src: reader.result,
        }))
        reader.readAsDataURL(file)
      }, files)
    }
  }, [])

  return (
    <MessageForm onSubmit={handleSend}>
      <MessageInputImages
        images={images}
        setImages={setImages}
      />

      <MessageTextInput
        type="text"
        name="text"
        autoComplete="off"
        placeholder="Text message"
      />

      <ImageFileInput
        accept="image/*"
        multiple
        onChange={handleAttachImage}
      >
        <ImageIcon
          src={getStaticUrl('/icons/image.svg')}
          title="Attach images"
        />
      </ImageFileInput>

      <MessageButton type="submit">
        {'Send'}
      </MessageButton>
    </MessageForm>
  )
}

export default React.memo(MessageInput)
