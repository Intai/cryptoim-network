import React from 'react'
import styled from 'styled-components'

const Images = styled.div`
  font-size: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: start;
  gap: 10px;
  margin-bottom: 10px;
`

const Image = styled.img`
  max-width: 100%;
`

const MessageImages = ({ images }) => images?.length > 0 && (
  <Images>
    {images.map(({ uuid, name, src }) => (
      <Image
        key={uuid}
        src={src}
        alt={name}
      />
    ))}
  </Images>
)

export default React.memo(MessageImages)
