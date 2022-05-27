import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { createUseBdux } from 'bdux/hook'
import RequestListItem from './request-list-item'
import { fontLarge } from './typography'
import { getStaticUrl } from '../utils/common-util'
import LoginStore from '../stores/login-store'
import RequestListStore from '../stores/request-list-store'

const COUNT_VISIBLE = 3

const Title = styled.div`
  ${fontLarge}
  margin: 15px 20px;
`

const EllipsisIcon = styled.img`
  height: 16px;
  padding: 5px;
  margin: 0 0 0 25px;
  cursor: pointer;
  opacity: 0.5;

  &:hover {
    opacity: 1;
  }
`

const useBdux = createUseBdux({
  login: LoginStore,
  requestList: RequestListStore,
})

const RequestList = (props) => {
  const { state: { login, requestList }, dispatch } = useBdux(props)
  const [isShowAll, setIsShowAll] = useState(false)

  const handleShowAll = useCallback(() => {
    setIsShowAll(true)
  }, [])

  if (!requestList) {
    return false
  }

  const { requests } = requestList
  const hasMore = !isShowAll && requests.length > COUNT_VISIBLE
  const visibleRequests = isShowAll
    ? requests
    : requests.slice(0, COUNT_VISIBLE)

  return requestList.requests.length > 0 && (
    <>
      <Title>Requests</Title>
      <ul>
        {visibleRequests.map(request => (
          <RequestListItem
            key={request.uuid}
            login={login}
            request={request}
            dispatch={dispatch}
          />
        ))}
      </ul>
      {hasMore && (
        <EllipsisIcon
          src={getStaticUrl('/icons/ellipsis.svg')}
          title="Show all requests"
          onClick={handleShowAll}
        />
      )}
    </>
  )
}

export default React.memo(RequestList)
