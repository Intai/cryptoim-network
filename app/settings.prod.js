import 'bdux' // unnecessary import to balance code splitting.
import * as Universal from 'bdux-universal/middleware'
import { applyMiddleware } from 'bdux/middleware'

applyMiddleware(
  Universal,
)
