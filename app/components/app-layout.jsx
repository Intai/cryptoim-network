import React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { primaryBackground } from './color'
import { fontSans, fontNormal } from './typography'
import theme from './theme'
import Main from './main'
import Head from './head'

const Container = styled.div`
  ${primaryBackground}
  ${fontSans}
  ${fontNormal}
  min-height: var(--vh, 100vh);
`

const AppLayout = () => (
  <ThemeProvider theme={theme}>
    <Container>
      <Main />
      <Head />
    </Container>
  </ThemeProvider>
)

export default AppLayout
