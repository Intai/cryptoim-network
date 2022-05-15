import React from 'react'
import styled from 'styled-components'
import PromoFeatures from './promo-features'
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

const Home = () => (
  <Scrollbar>
    <Container>
      <Logo src={getStaticUrl('/images/logo.png')} />
      <PromoFeatures />
    </Container>
  </Scrollbar>
)

export default React.memo(Home)
