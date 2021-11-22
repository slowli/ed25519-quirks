const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const toml = require('toml');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const AutoprefixerPlugin = require('autoprefixer');

const pages = require('./assets/templates/pages.json');

function requireToml(pathToToml) {
  return toml.parse(fs.readFileSync(pathToToml, { encoding: 'utf-8' }));
}

const cargoLockfile = requireToml('./wasm/Cargo.lock');

function getDependencyInfo(dependencyName) {
  const packageInfo = cargoLockfile.package.find(({ name }) => name === dependencyName);
  return {
    version: packageInfo.version,
  };
}

function getGitInfo() {
  const gitOutput = execSync('git status --porcelain=v2 --branch', {
    encoding: 'utf8',
  });
  const gitOutputLines = gitOutput.split('\n');
  const commitLine = gitOutputLines.find((line) => line.startsWith('# branch.oid'));
  const commitHash = commitLine.match(/\b(?<hash>[0-9a-f]{40})$/).groups.hash;
  const isDirty = gitOutputLines.some((line) => line.startsWith('1 ') || line.startsWith('2 '));
  return { commitHash, isDirty };
}

function getRustInfo() {
  const rustcOutput = execSync('rustc --version', {
    encoding: 'utf8',
  });
  return rustcOutput.replace(/^rustc\s+/, '').trim();
}

const buildInfo = {
  deps: ['ed25519-dalek', 'curve25519-dalek', 'wasm-bindgen'].reduce(
    (acc, name) => {
      acc[name] = getDependencyInfo(name);
      return acc;
    },
    {},
  ),
  git: getGitInfo(),
  rust: getRustInfo(),
};

const entries = {
  index: './src/home',
  about: './src/about',
  basics: './src/basics',
  malleability: './src/malleability',
  wildcards: './src/wildcards',
  clamping: './src/clamping',
};
const htmlPlugins = Object.keys(entries).map((entry) => new HtmlWebpackPlugin({
  filename: entry === 'index' ? 'index.html' : `${entry}/index.html`,
  chunks: [entry, 'commons'],
  template: `assets/templates/${entry}.pug`,
  templateParameters: {
    $pages: pages,
    $buildInfo: buildInfo,
  },
}));

module.exports = {
  entry: entries,
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: process.env.WEBPACK_PUBLIC_PATH || '/',
    filename: '_assets/js/[name].js',
    chunkFilename: '_assets/js/[name].[chunkhash:8].js',
    webassemblyModuleFilename: '_assets/js/[hash].module.wasm',
  },
  experiments: {
    asyncWebAssembly: true,
    topLevelAwait: true,
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
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.js/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.vue$/,
        use: 'vue-loader',
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader',
        ],
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
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{
        from: './assets/favicon',
        to: '_assets/css/[name][ext]',
      }],
    }),

    new MiniCssExtractPlugin({
      filename: '_assets/css/[name].css',
    }),

    new VueLoaderPlugin(),

    // This hard-codes the relative path to the `TextDecoder` module from the `wasm/pkg` directory,
    // which is the only place using the `TextDecoder` global.
    new webpack.ProvidePlugin({
      TextDecoder: ['../../src/TextDecoder', 'default'],
    }),

    ...htmlPlugins,
  ],
};
