import * as Logger from 'bdux-logger'
import * as Universal from 'bdux-universal/middleware'
import { applyMiddleware } from 'bdux/middleware'

applyMiddleware(
  Universal,
  Logger,
)
