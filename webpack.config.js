const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const path = require('path');

module.exports = {
  entry: './src/index',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bootstrap.js',
  },
  module: {
    rules: [
      {
        test: /\.js/,
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
    new CopyWebpackPlugin(['index.html']),
    new VueLoaderPlugin(),

    // This hard-codes the relative path to the `encoding` module from the `wasm/pkg` directory,
    // which is the only place using `TextEncoder` / `TextDecoder` globals.
    new webpack.ProvidePlugin({
      TextEncoder: ['../../src/encoding', 'TextEncoder'],
      TextDecoder: ['../../src/encoding', 'TextDecoder']
    })
  ],
};
