import React, { useCallback } from 'react'
import styled from 'styled-components'
import { useBdux } from 'bdux'
import { LocationAction } from 'bdux-react-router'
import Button from './button'
import PanelHeader from './panel-header'
import PromoFeatures from './promo-features'
import { scrollbar } from './scrollbar'
import { isBreakpointUp } from '../hooks/responsive'
import { getStaticUrl } from '../utils/common-util'

const Scrollbar = styled.div`
  ${scrollbar}
  flex: 1;
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100%;
`

const Logo = styled.img`
  max-width: 180px;
  flex: 0 0 calc(180px - 36px);
`

const ContinueButton = styled(Button)`
  ${isBreakpointUp('md', 'display: none;')}
  margin: 15px 0 30px 0;
`

const Home = props => {
  const { dispatch } = useBdux(props)

  const handleContinue = useCallback(() => {
    dispatch(LocationAction.push('/conversations'))
  }, [dispatch])

  return (
    <>
      <PanelHeader />
      <Scrollbar>
        <Container>
          <Logo src={getStaticUrl('/images/logo.png')} />
          <PromoFeatures />
          <ContinueButton
            type="button"
            kind="secondary"
            onClick={handleContinue}
          >
            {'Continue'}
          </ContinueButton>
        </Container>
      </Scrollbar>
    </>
  )
}

export default React.memo(Home)
