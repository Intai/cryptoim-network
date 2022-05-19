import './settings'
import fs from 'fs'
import path from 'path'
import express from 'express'
import cookieParser from 'cookie-parser'
import { ServerStyleSheet } from 'styled-components'
import { Gun } from './utils/gun-util'
import AppRoot from './roots/app-root'

const app = express()
const port = process.env.PORT || 8080
const defaultDigest = Date.now()

const renderApp = (req, res) => {
  const image = process.env.CONTAINER_IMAGE
  const digest = image ? image.replace(/^.*@sha256:/, '') : defaultDigest
  const etag = `W/"${digest}"`

  if (req.header('If-None-Match') === etag) {
    res.sendStatus(304)
    return
  }

  fs.readFile('./dist/server.ejs', 'utf8', (err, file) => {
    if (err) {
      throw err
    }

    const [head, afterHead] = file.split('<%- head %>')
    const [beforePortal, afterPortal] = afterHead.split('<%- portal %>')
    const [beforeApp, tail] = afterPortal.split('<%- app %>')
    let body = ''

    res.set('Content-Type', 'text/html')
    res.set('Etag', etag)
    body += head
    body += beforePortal

    const sheetApp = new ServerStyleSheet()
    const htmlApp = AppRoot.renderToString(req, res, sheetApp)
    body += beforeApp
    body += sheetApp.getStyleTags()
    body += htmlApp
    sheetApp.seal()

    body += tail
    res.set('Content-Length', Buffer.byteLength(body, 'utf8'))
    res.end(body)
  })
}

const serviceWorker = (req, res) => {
  fs.readFile('./dist/service-worker.js', 'utf8', function (err, data) {
    if (err) {
      throw err
    }

    const image = process.env.CONTAINER_IMAGE
    const digest = image ? image.replace(/^.*@sha256:/, '') : defaultDigest
    const replaced = data.replace('<DIGEST>', digest)
    res.set('Content-Type', 'application/javascript')
    res.send(replaced)
  })
}

const sitemap = (req, res) => {
  res.set('Content-Type', 'application/xml')
  res.render(path.join(__dirname, '/sitemap'))
}

app.set('etag', 'weak')
app.set('view engine', 'ejs')
app.use(/^\/static[^/]*/, express.static('dist', { maxAge: 15552000000 }))
app.use('/favicon.ico', express.static('dist/favicon'))
app.get('/service-worker', serviceWorker)
app.get('/sitemap.xml', sitemap)
app.use(Gun.serve)
app.use(cookieParser())
app.get('*', renderApp)

const server = app.listen(port)
process.gun = Gun({
  radisk: true,
  file: 'radata',
  web: server,
})
