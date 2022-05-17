var path = require('path'),
  gulp = require('gulp'),
  del = require('del'),
  log = require('fancy-log'),
  PluginError = require('plugin-error'),
  spawn = require('child_process').spawn,
  webpack = require('webpack'),
  webpackStream = require('webpack-stream'),
  WebpackDevServer = require('webpack-dev-server')

function clean() {
  return del('dist')
}

function devServer() {
  const port = process.env.PORT || 80
  const compiler = webpack(require('./webpack/dev.config.js'))

  new WebpackDevServer({
    port,
    host: '0.0.0.0',
    historyApiFallback: true,
    static: {
      directory: path.resolve(__dirname, 'static'),
      publicPath: '/static/',
    },
  }, compiler)
    .startCallback(err => {
      if (err) throw new PluginError('webpack-dev-server', err)
      log('[webpack-dev-server]', 'http://localhost:' + port)
    })
}

function devGunServer(cb) {
  const cmd = spawn('node', [
    'app/server.dev.mjs',
  ], {
    stdio: 'inherit',
  })

  log('[gun]', 'http://localhost:' + 8765)
  cmd.on('close', cb)
}

function buildClient() {
  const env = (process.env.NODE_ENV === 'production') ? 'prod' : 'dev'
  return gulp.src(`app/index.${env}.jsx`)
    .pipe(webpackStream(require('./webpack/client.config.js'), webpack))
    .pipe(gulp.dest('dist'))
}

function buildServer() {
  return gulp.src('app/server.prod.js')
    .pipe(webpackStream(require('./webpack/server.config.js'), webpack))
    .pipe(gulp.dest('dist'))
}

function copyViews() {
  return gulp.src('app/sitemap.ejs')
    .pipe(gulp.dest('dist'))
}

function copyStatic() {
  return gulp.src('static/**/*')
    .pipe(gulp.dest('dist'))
}

function setEnv(env) {
  return function setNodeEnv(cb) {
    process.env.NODE_ENV = env
    cb()
  }
}

function prodServer(cb) {
  const port = process.env.PORT || 8080
  const cmd = spawn('node', [
    'dist/server.js',
  ], {
    stdio: 'inherit',
  })

  log('[express]', 'http://localhost:' + port)
  cmd.on('close', cb)
}

const build = gulp.series(
  clean,
  buildClient,
  buildServer,
  copyViews,
  copyStatic,
)

const prod = gulp.series(
  setEnv('production'),
  build,
  prodServer,
)

const dev = gulp.series(
  clean,
  gulp.parallel(
    devServer,
    devGunServer,
  ),
)

gulp.task('build', build)

gulp.task('prod', prod)

gulp.task('dev', dev)

gulp.task('default', dev)
