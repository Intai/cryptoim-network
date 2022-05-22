import React from 'react'
import styled from 'styled-components'
import { createUseBdux } from 'bdux/hook'
import RequestListItem from './request-list-item'
import { fontLarge } from './typography'
import LoginStore from '../stores/login-store'
import RequestListStore from '../stores/request-list-store'

const Title = styled.div`
  ${fontLarge}
  margin: 15px 20px;
`

const useBdux = createUseBdux({
  login: LoginStore,
  requestList: RequestListStore,
})

const RequestList = (props) => {
  const { state: { login, requestList }, dispatch } = useBdux(props)

  return requestList?.requests.length > 0 && (
    <>
      <Title>Requests</Title>
      <ul>
        {requestList.requests.map(request => (
          <RequestListItem
            key={request.uuid}
            login={login}
            request={request}
            dispatch={dispatch}
          />
        ))}
      </ul>
    </>
  )
}

export default React.memo(RequestList)
