var path = require('path'),
  webpack = require('webpack'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  ESLintPlugin = require('eslint-webpack-plugin'),
  env = (process.env.NODE_ENV === 'production') ? 'prod' : 'dev',
  timestamp = process.env.TIMESTAMP || ''

var isExternal = function({ request }, callback) {
  if (request[0] !== '.') {
    return callback(null, 'commonjs ' + request)
  }
  callback()
}

module.exports = {
  mode: 'production',
  target: 'node',
  externals: [isExternal],
  context: path.join(__dirname, '../app'),
  entry: [
    './server',
  ],
  optimization: {
    minimize: true,
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      IMAGES_CDN_DOMAIN: JSON.stringify(process.env.IMAGES_CDN_DOMAIN || '/static/images'),
      STATIC_CDN_DOMAIN: JSON.stringify(`${process.env.WEB_CDN_DOMAIN || ''}/static-${timestamp}`),
      TIMESTAMP: JSON.stringify(timestamp),
    }),
    new HtmlWebpackPlugin({
      filename: 'server.ejs',
      template: '../app/index.ejs',
      head:  '<%- head %>',
      app: '<%- app %>',
      portal: '<%- portal %>',
      inject: false,
      minify: {
        collapseWhitespace: true,
      },
      files: {
        css: [],
        js: [`/static-${timestamp}/client.js`],
      },
    }),
    new ESLintPlugin({
      extensions: ['js', 'jsx'],
      exclude: 'node_modules',
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx', `.${env}.js`, `.${env}.jsx`],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist'),
    filename: 'server.js',
  },
}
