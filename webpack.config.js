const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const BrowserSyncPlugin = require('browser-sync-webpack-plugin')

// Phaser webpack config
const phaserModule = path.join(__dirname, '/node_modules/phaser-ce/')
const phaser = path.join(phaserModule, 'build/custom/phaser-split.js')
const pixi = path.join(phaserModule, 'build/custom/pixi.js')
const p2 = path.join(phaserModule, 'build/custom/p2.js')


module.exports = env => {

  env = env || {};

  console.log('env.dev: ' + env.dev);
  console.log('env.debug: ' + env.debug);

  return {
    mode: 'development',
    entry: {
      app: [
        path.resolve(__dirname, 'src/main.js')
      ],
      vendor: ['pixi', 'p2', 'phaser', 'webfontloader']
    },
    devtool: 'cheap-source-map',
    output: {
      pathinfo: true,
      path: path.resolve(__dirname, 'dist'),
      publicPath: './dist/',
      filename: '[name].js'
    },
    watch: true,
    watchOptions: {
      aggregateTimeout: 2000
    },
    plugins: [
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(JSON.parse(env.dev || 'false')),
        __DEBUG__: JSON.stringify(JSON.parse(env.debug || 'false')),
      }),
      new HtmlWebpackPlugin({
        filename: '../index.html',
        template: './src/index.html',
        chunks: ['vendor', 'app'],
        chunksSortMode: 'manual',
        minify: {
          removeAttributeQuotes: false,
          collapseWhitespace: false,
          html5: false,
          minifyCSS: false,
          minifyJS: false,
          minifyURLs: false,
          removeComments: false,
          removeEmptyAttributes: false
        },
        hash: false
      }),
      new BrowserSyncPlugin({
        host: process.env.IP || 'localhost',
        port: process.env.PORT || 3000,
        server: {
          baseDir: ['./', './build']
        }
      })
    ],
    module: {
      rules: [
        {
          test: /\.js$/,
          //exclude: /(node_modules)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          },
          include: path.join(__dirname, 'src')
        },
        { test: /pixi\.js/, use: ['expose-loader?PIXI'] },
        { test: /phaser-split\.js$/, use: ['expose-loader?Phaser'] },
        { test: /p2\.js/, use: ['expose-loader?p2'] }
      ]
    },
    resolve: {
      preferRelative: true,
      alias: {
        'phaser': phaser,
        'pixi': pixi,
        'p2': p2
      }
    }
  }
}
