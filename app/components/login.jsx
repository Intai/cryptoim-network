import { not, test } from 'ramda'
import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { useBdux } from 'bdux/hook'
import TextInput from './text-input'
import Button from './button'
import LoginScan from './login-scan'
import PromoFeatures from './promo-features'
import { primaryBackground, alertBackground, secondaryBorder } from './color'
import { isBreakpointUp } from '../hooks/responsive'
import { getStaticUrl } from '../utils/common-util'
import * as LoginAction from '../actions/login-action'

const Container = styled.div`
  display: flex;
  justify-content: center;
`

const PromoContainer = styled.div`
  display: none;
  flex-direction: column;
  justify-content: center;
  ${isBreakpointUp('md', 'display: flex;')}
`

const PromoFeaturesBelowLogo = styled(PromoFeatures)`
  margin: 98px 0 30px 45px;
  max-width: 320px;

  ${isBreakpointUp('lg', `
    margin-top: 80px;
    max-width: 360px;
  `)}
`

const PromoFeaturesBelowForm = styled(PromoFeatures)`
  margin: 45px 0 15px 0;
  width: 270px;
  max-width: calc(100vw - 30px);
  ${isBreakpointUp('md', 'display: none;')}
`

const LoginContainer = styled.div`
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

const LoginForm = styled.form`
  padding-bottom: 15px;
`

const ErrorMessage = styled.div`
  ${alertBackground}
  padding: 10px;
  margin: 0 0 15px;
  width: 270px;
  max-width: calc(100vw - 30px);
  box-sizing: border-box;
  white-space: pre-wrap;
`

const Separator = styled.div`
  ${secondaryBorder}
  border-top: 1px solid;
  position: relative;
  margin: 30px 0;
`

const SeparatorText = styled.div`
  ${primaryBackground}
  position: absolute;
  top: -0.6em;
  left: calc(50% - 1em - 3px);
  padding: 0 6px;
`

const isStrong = test(/(?=^.{8,}$)(?=.*\d)(?=.*\W+)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)

const getLoginLabel = login => {
  const isRegister = login?.isRegister

  if (isRegister === true) {
    return 'Register'
  } if (isRegister === false) {
    return 'Login'
  }
  return 'Register / Login'
}

const Login = (props) => {
  const { login } = props
  const { dispatch } = useBdux(props)
  const [isScanning, setIsScanning] = useState(false)
  const hasRadata = login?.hasRadata

  const handleLogin = useCallback(e => {
    const formData = new FormData(e.target)
    const alias = formData.get('alias')
    const password = formData.get('password')
    const confirm = formData.get('confirm')

    if (!alias) {
      dispatch(LoginAction.requireAlias())
    } else if (!password) {
      dispatch(LoginAction.requirePassword())
    } else if (password !== confirm) {
      dispatch(LoginAction.requireConfirmation())
    } else if (!isStrong(password)) {
      dispatch(LoginAction.requireStrong())
    } else {
      dispatch(LoginAction.login(alias, password))
    }
    e.preventDefault()
  }, [dispatch])

  const handleChangeAlias = useCallback((e) => {
    dispatch(LoginAction.checkAlias(e.target.value))
  }, [dispatch])

  const handleToggleScan = useCallback(() => {
    dispatch(LoginAction.clearError())
    setIsScanning(not)
  }, [dispatch])

  const handleSkip = useCallback(() => {
    dispatch(LoginAction.skip())
  }, [dispatch])

  if (isScanning) {
    return (
      <LoginContainer>
        <LoginScan
          login={login}
          onCancel={handleToggleScan}
        />
      </LoginContainer>
    )
  }

  return login && (
    <Container>
      <LoginContainer>
        <Logo src={getStaticUrl('/images/logo.png')} />
        <LoginForm onSubmit={handleLogin}>
          <Button
            type="button"
            kind={hasRadata ? 'primary' : 'secondary'}
            onClick={handleToggleScan}
          >
            {'Scan QR code'}
          </Button>

          <Button
            type="button"
            kind={hasRadata ? 'secondary' : 'primary'}
            onClick={handleSkip}
          >
            {'Skip'}
          </Button>

          <Separator>
            <SeparatorText>OR</SeparatorText>
          </Separator>

          {login?.err && (
            <ErrorMessage>⚠️  {login.err}</ErrorMessage>
          )}

          <TextInput
            name="alias"
            placeholder="Alias"
            autoComplete="off"
            onBlur={handleChangeAlias}
          />
          <TextInput
            type="password"
            name="password"
            placeholder="Password"
            autoComplete="off"
          />
          <TextInput
            type="password"
            name="confirm"
            placeholder="Confirm Password"
            autoComplete="off"
          />
          <Button
            type="submit"
            kind="secondary"
          >
            {getLoginLabel(login)}
          </Button>

          <PromoFeaturesBelowForm />
        </LoginForm>
      </LoginContainer>

      <PromoContainer>
        <PromoFeaturesBelowLogo />
      </PromoContainer>
    </Container>
  )
}

export default React.memo(Login)
