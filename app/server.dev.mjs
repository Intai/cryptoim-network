import express from 'express'
import Gun from 'gun'

const port = 8765
const app = express()
app.use(Gun.serve)
const server = app.listen(port)
Gun({
  radisk: true,
  file: 'radata',
  web: server,
})
