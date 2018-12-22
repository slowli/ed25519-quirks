const webpackConfig = require('./webpack.config.js');
webpackConfig.mode = 'none';
webpackConfig.output.filename = '[name].js';

module.exports = (config) => {
  config.set({
    frameworks: ['mocha'],
    files: [
      'test/**/*.spec.js'
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
