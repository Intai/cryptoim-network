import React from 'react'
import styled from 'styled-components'
import { secondaryText } from './color'
import { fontLarge } from './typography'
import { scrollbar } from './scrollbar'
import { getStaticUrl } from '../utils/common-util'

const Scrollbar = styled.div`
  ${scrollbar}
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
`

const Logo = styled.img`
  max-width: 180px;
  flex: 0 0 calc(180px - 36px);
`

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

const Home = () => (
  <Scrollbar>
    <Container>
      <Logo src={getStaticUrl('/images/logo.png')} />

      <Features>
        <Title>Encrypted</Title>
        <Description>
          {'On top of end-to-end encryption, '}
          {'messages are encrypted, which means no one can read them without your encryption key.'}
        </Description>

        <Title>Distributed</Title>
        <Description>
          {'Sync directly peer-to-peer between your devices & friends. '}
          {'Decentralisation means there is no corporation or government owning your data.'}
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
    </Container>
  </Scrollbar>
)

export default React.memo(Home)
