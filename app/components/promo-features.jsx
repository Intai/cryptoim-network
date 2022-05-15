import React from 'react'
import styled from 'styled-components'
import { secondaryText } from './color'
import { fontLarge } from './typography'

const Features = styled.div`
  flex: 0 0 auto;
  margin: 0 15px 30px 15px;
  max-width: 360px;
`

const Title = styled.div`
  ${fontLarge}
  margin-top: 15px;
`

const Description = styled.div`
  ${secondaryText}
`

const PromoFeatures = ({ className }) => (
  <Features className={className}>
    <Title>Encrypted</Title>
    <Description>
      {'On top of end-to-end encryption, '}
      {'messages are encrypted, which means no one can read them without your encryption key.'}
    </Description>

    <Title>Distributed</Title>
    <Description>
      {'Sync directly peer-to-peer between your devices & friends. '}
      {'Decentralised, so there is no corporation or government owning your data.'}
    </Description>

    <Title>Open Source</Title>
    <Description>
      {'Built on top of GUN '}
      <a
        href="https://gun.eco"
        target="_blank"
        rel="noreferrer"
      >
        {'https://gun.eco'}
      </a>
      {' which is an awesome open source distributed graph database. '}
      {'Don\'t just believe words on this page. Please do examine the open source codebases. '}
      <a
        href="https://github.com/Intai/cyphrim-com"
        target="_blank"
        rel="noreferrer"
      >
        {'https://github.com/Intai/cyphrim-com'}
      </a>
    </Description>
  </Features>
)

export default React.memo(PromoFeatures)
