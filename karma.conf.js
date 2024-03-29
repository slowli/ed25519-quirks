const fs = require('fs');
const path = require('path');
const webpackConfig = require('./webpack.config.js');

// Setting `nodeEnv` is necessary in order to set the `process` global.
webpackConfig.optimization.nodeEnv = 'development';
// Disable the `splitChunks` config from `karma-webpack`, since it doesn't
// work for async chunks (which we require because of WASM).
webpackConfig.optimization.splitChunks.cacheGroups.commons = false;
// Remove default entries (we only need test ones, which are added by `karma-webpack`).
delete webpackConfig.entry;

// Directory for Webpack output (relative to the current dir).
// We need to overwrite it in order to enable serving generated files
// (including the WASM module) with the Karma web server.
const WEBPACK_TARGET_DIR = 'dist/__karma__';
// Directory for JS files.
const WEBPACK_JS_DIR = `${WEBPACK_TARGET_DIR}/_assets/js`;

fs.mkdirSync(path.resolve(__dirname, WEBPACK_TARGET_DIR), { recursive: true });

module.exports = (config) => {
  webpackConfig.output.path = path.resolve(__dirname, WEBPACK_TARGET_DIR);
  webpackConfig.output.publicPath = `http://localhost:${config.port}/base/${WEBPACK_TARGET_DIR}/`;

  config.set({
    frameworks: ['mocha', 'webpack'],
    files: [
      { pattern: 'test/**/*.spec.js', watched: false },
      // Add files generated by Webpack to ones served by the Karma web server.
      { pattern: `${WEBPACK_JS_DIR}/*.js`, watched: false, included: false, served: true },
      { pattern: `${WEBPACK_JS_DIR}/*.wasm`, watched: false, included: false, served: true }
    ],
    preprocessors: {
      '**/*.spec.js': ['webpack']
    },
    webpack: webpackConfig,
    logLevel: config.LOG_INFO,
    reporters: ['spec'],
    browsers: ['FirefoxHeadless', 'ChromeHeadless']
  })
};
