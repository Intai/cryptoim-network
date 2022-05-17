var path = require('path'),
  webpack = require('webpack'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  ESLintPlugin = require('eslint-webpack-plugin'),
  env = (process.env.NODE_ENV === 'production') ? 'prod' : 'dev'

module.exports = {
  mode: 'development',
  context: path.join(__dirname, '../app'),
  entry: [
    './index',
  ],
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      APP_DOMAIN: JSON.stringify(process.env.APP_DOMAIN || 'http://localhost'),
      GUN_DOMAIN: JSON.stringify(process.env.GUN_DOMAIN || 'http://localhost:8765'),
      IMAGES_CDN_DOMAIN: JSON.stringify(process.env.IMAGES_CDN_DOMAIN || '/static/images'),
      STATIC_CDN_DOMAIN: JSON.stringify(`${process.env.WEB_CDN_DOMAIN || ''}/static`),
      TIMESTAMP: JSON.stringify(''),
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: '../app/index.ejs',
      inject: false,
      files: {
        css: [],
        js: ['/dev.js'],
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
    noParse: /(gun|sea|axe)\.js$/,
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    path: path.join(__dirname, '../dist'),
    publicPath: '/',
    filename: 'dev.js',
  },
}
