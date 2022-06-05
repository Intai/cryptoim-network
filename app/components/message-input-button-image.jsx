import { append, forEach, inc } from 'ramda'
import { v4 as uuidv4 } from 'uuid'
import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import FileInput from './file-input'
import { inputBackground } from './color'
import { getStaticUrl } from '../utils/common-util'

const ImageFileInputWrap = styled.div`
  ${inputBackground}
  flex: 0 0 auto;
  margin: 0 0 30px 0;
  display: flex;
  align-items: end;
`

const ImageFileInput = styled(FileInput)`
  padding: 12px 15px 12px 5px;
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

  let dataUrl = canvas.toDataURL('image/webp', 0.5)
  if (dataUrl.indexOf('data:image/webp') < 0) {
    // fallback to jpeg if webp is not supported.
    dataUrl = canvas.toDataURL('image/jpeg', 0.1)
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

const MessageInputButtonImage = ({ setImages, textAreaRef }) => {
  const [version, setVersion] = useState(0)

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
  }, [setImages, textAreaRef])

  return (
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
  )
}

export default React .memo(MessageInputButtonImage)
