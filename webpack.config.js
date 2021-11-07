const path = require('path');

const webpack = require('webpack');
const { VueLoaderPlugin } = require('vue-loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const AutoprefixerPlugin = require('autoprefixer');

const pages = require('./assets/templates/pages.json');
const publicPath = process.env.WEBPACK_PUBLIC_PATH || '/';

const entries = {
  index: './src/home',
  about: './src/about',
  basics: './src/basics',
  malleability: './src/malleability',
  wildcards: './src/wildcards',
};

const htmlPlugins = Object.keys(entries).map((entry) => new HtmlWebpackPlugin({
  filename: entry === 'index' ? 'index.html' : `${entry}/index.html`,
  chunks: [entry, 'commons'],
  template: `assets/templates/${entry}.pug`,
  templateParameters: {
    $pages: pages,
  },
}));

module.exports = {
  entry: entries,
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath,
    filename: '_assets/js/[name].js',
    chunkFilename: '_assets/js/[name].[chunkhash:8].js',
    webassemblyModuleFilename: '_assets/js/[hash].module.wasm',
  },
  experiments: {
    asyncWebAssembly: true,
    topLevelAwait: true
  },
  optimization: {
    splitChunks: {
      chunks: 'async',
      cacheGroups: {
        vendors: false, // disable splitting the main chunk into 3rd-party and built-in parts
        commons: {
          name: 'commons',
          chunks: 'initial',
          minChunks: Object.keys(entries).length,
        },
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
      },
      {
        test: /\.scss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [AutoprefixerPlugin],
              },
            },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.pug$/i,
        loader: 'pug-loader',
      },
      {
        test: /\.(woff|woff2)$/i,
        type: 'asset',
      },
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '_assets/css/[name].css',
    }),

    new VueLoaderPlugin(),

    // This hard-codes the relative path to the `TextDecoder` module from the `wasm/pkg` directory,
    // which is the only place using the `TextDecoder` global.
    new webpack.ProvidePlugin({
      TextDecoder: ['../../src/TextDecoder', 'default']
    }),

    ...htmlPlugins
  ],
};
