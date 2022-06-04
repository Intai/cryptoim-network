import { append, forEach, inc } from 'ramda'
import { v4 as uuidv4 } from 'uuid'
import React, { useCallback, useRef, useState } from 'react'
import styled from 'styled-components'
import TextArea from './text-area'
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

const ImageFileInputWrap = styled.div`
  ${inputBackground}
  flex: 0 0 auto;
  margin: 0 0 30px 0;
  display: flex;
  align-items: end;
`

const ImageFileInput = styled(FileInput)`
  padding: 12px 15px 12px 10px;
  margin: 0;
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

const adjustDimension = ({ width, height }) => {
  if (width > height) {
    return width > 2500
      ? [2500, height * 2500 / width]
      : [width, height]
  }
  return height > 2500
    ? [width * 2500 / height, 2500]
    : [width, height]
}

const getImageElement = (func, dataUrl) => {
  const img = new Image()
  img.onload = () => func(img)
  img.src = dataUrl
}

const resizeImageElementToDataUrl = img => {
  const [width, height] = adjustDimension(img)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)

  let dataUrl = canvas.toDataURL('image/webp')
  if (dataUrl.indexOf('data:image/webp') < 0) {
    // fallback to jpeg if webp is not supported.
    dataUrl = canvas.toDataURL('image/jpeg')
  }
  return dataUrl
}

const getDataUrl = (func, file) => {
  const reader = new FileReader()
  reader.onloadend = () => {
    getImageElement(element => {
      func(resizeImageElementToDataUrl(element))
    }, reader.result)
  }
  reader.readAsDataURL(file)
}

const MessageInput = ({ conversation, messages, dispatch }) => {
  const [images, setImages] = useState([])
  const [version, setVersion] = useState(0)
  const textAreaRef = useRef()

  const handleSend = useCallback(e => {
    const form = e.target.form || e.target
    const formData = new FormData(form)
    const text = formData.get('text')
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
        // clear the text area.
        textAreaRef.current?.clear()
      }
    }
    e.preventDefault()
  }, [conversation, dispatch, images, messages])

  const handleAttachImage = useCallback(e => {
    const { files } = e.target

    // read files to data urls.
    if (files.length > 0) {
      forEach(file => {
        getDataUrl(dataUrl => {
          setImages(append({
            uuid: uuidv4(),
            name: file.name,
            src: dataUrl,
          }))
        }, file)
      }, files)

      // increment verion to render a new file input.
      setVersion(inc)
      // continue typing the text message.
      textAreaRef.current?.focus()
    }
  }, [])

  return (
    <MessageForm onSubmit={handleSend}>
      <MessageInputImages
        images={images}
        setImages={setImages}
      />

      <MessageTextArea
        ref={textAreaRef}
        type="text"
        name="text"
        autoComplete="off"
        placeholder="Text message"
        onSubmit={handleSend}
      />

      <ImageFileInputWrap>
        <ImageFileInput
          key={version}
          accept="image/*"
          multiple
          onChange={handleAttachImage}
        >
          <ImageIcon
            src={getStaticUrl('/icons/image.svg')}
            title="Attach images"
          />
        </ImageFileInput>
      </ImageFileInputWrap>

      <MessageButton type="submit">
        {'Send'}
      </MessageButton>
    </MessageForm>
  )
}

export default React.memo(MessageInput)
