import React from 'react'
import {
  updateRouterLocation,
  Router,
  Routes,
  Route,
} from 'bdux-react-router'
import { createUseBdux } from 'bdux/hook'
import PanelLeftLayout from './panel-left-layout'
import * as ContactAction from '../actions/contact-action'
import * as ConversationAction from '../actions/conversation-action'
import ContactListStore from '../stores/contact-list-store'
import ConversationListStore from '../stores/conversation-list-store'
import RequestListStore from '../stores/request-list-store'

const useBdux = createUseBdux({
  contactList: ContactListStore,
  conversationList: ConversationListStore,
  requestList: RequestListStore,
}, [
  ContactAction.init,
  ConversationAction.init,
])

const PanelLeft = props => {
  const { location } = props
  const { state: { contactList, conversationList } } = useBdux(props)

  // wait for contacts and conversations are initialised.
  return contactList && conversationList && (
    <Router location={updateRouterLocation(location)}>
      <Routes>
        <Route
          element={<PanelLeftLayout />}
          path="/conversations"
        />
        <Route
          element={<PanelLeftLayout isMdAndUpOnly />}
          path="/conversation/:converseUuid"
        />
        <Route
          element={<PanelLeftLayout isMdAndUpOnly />}
          path="/group/:converseUuid"
        />
        <Route
          // don't render the left panel on sm and md screens.
          // the only exception is /conversations.
          element={<PanelLeftLayout isMdAndUpOnly />}
          path="*"
        />
      </Routes>
    </Router>
  )
}

export default React.memo(PanelLeft)
