import { remove } from 'ramda'
import React, { useCallback } from 'react'
import styled from 'styled-components'
import { inputBackground } from './color'
import { getStaticUrl } from '../utils/common-util'

const ImagesWrap = styled.div`
  flex: 0 0 100%;
  font-size: 0;
  box-sizing: border-box;
`

const Images = styled.div`
  ${inputBackground}
  margin-right: 70px;
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 5px;
  padding: 5px 5px 0 5px;
`

const ImageWrap = styled.div`
  position: relative;
`

const Image = styled.img`
  max-height: 100px;
`

const RemoveIcon = styled.img`
  ${inputBackground}
  position: absolute;
  right: -4px;
  top: -4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  padding: 4px 4px 3px 4px;
  cursor: pointer;
`

const MessageInputImage = ({ image, setImages }) => {
  const { name, src } = image

  const handleRemoveImage = useCallback(() => {
    setImages(images => {
      const index = images.indexOf(image)
      return (index >= 0)
        ? remove(index, 1, images)
        : images
    })
  }, [image, setImages])

  return (
    <ImageWrap>
      <Image
        src={src}
        alt={name}
      />
      <RemoveIcon
        src={getStaticUrl('/icons/xmark.svg')}
        title="Remove the image"
        onClick={handleRemoveImage}
      />
    </ImageWrap>
  )
}

const MessageInputImageMemo = React.memo(MessageInputImage)

const MessageInputImages = ({ images, setImages }) => images.length > 0 && (
  <ImagesWrap>
    <Images>
      {images.map(image => (
        <MessageInputImageMemo
          key={image.uuid}
          image={image}
          setImages={setImages}
        />
      ))}
    </Images>
  </ImagesWrap>
)

export default React.memo(MessageInputImages)
