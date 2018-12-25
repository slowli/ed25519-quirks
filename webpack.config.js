const pug = require('pug');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const path = require('path');

const pages = require('./templates/pages.json');
const publicPath = process.env.WEBPACK_PUBLIC_PATH || '/';

module.exports = {
  entry: {
    basics: './src/basics',
    malleability: './src/malleability',
    wildcards: './src/wildcards'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath,
    filename: '[name].js',
    chunkFilename: '[name].[chunkhash:8].js'
  },
  optimization: {
    splitChunks: {
      chunks: 'async', // 'all' doesn't work for some reason
      cacheGroups: {
        vendors: false // disable splitting the main chunk into 3rd-party and built-in parts
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.js/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.vue$/,
        use: 'vue-loader'
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
        ]
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: './templates/base.css', to: 'base.css' },
      {
        from: './templates/*.pug',
        ignore: '_*.pug',
        to: '[name]/index.html',
        toType: 'template',

        transformPath(targetPath) {
          return targetPath.startsWith('index/index') ? 'index.html' : targetPath;
        },

        transform(content, path) {
          const render = pug.compile(content, {
            filename: path
          });
          return render({ $pages: pages });
        }
      }
    ]),

    new VueLoaderPlugin(),

    // This hard-codes the relative path to the `encoding` module from the `wasm/pkg` directory,
    // which is the only place using `TextEncoder` / `TextDecoder` globals.
    new webpack.ProvidePlugin({
      TextEncoder: ['../../src/encoding', 'TextEncoder'],
      TextDecoder: ['../../src/encoding', 'TextDecoder']
    })
  ],
};
