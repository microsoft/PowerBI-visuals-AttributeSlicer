var wallabyWebpack = require('wallaby-webpack');

var webpackPostprocessor = wallabyWebpack({
    module: {
      loaders: [
          { 
            test: /\.js$/, 
            loader: "babel-loader",
            exclude: /(node_modules|bower_components)/,
            query: {
              presets: ['es2015']
            } 
          },
          {
              test: /\.s?css$/,
              loaders: ["style", "css", "sass"]
          },
          {
              test: /\.json$/,
              loader: 'json-loader'
          },
          {
              test: /\.html$/,
              loader: 'raw-loader'
          }
      ],
    }
});

module.exports = function (wallaby) {
  return {
    files: [
      { pattern: 'node_modules/es6-promise/dist/es6-promise.js', instrument: false },
      { pattern: 'src/**/*.{js,ts,css,scss,json,html}', load: false },
      { pattern: 'base/**/*.{ts,js}', load: false },
      { pattern: 'src/**/*.spec.ts', ignore: true, load:false },
      { pattern: 'node_modules/**/*.{css,scss}', load:false, ignore: true /* ignoring loads faster, but gives css/scss errors */ }
    ],

    tests: [
      { pattern: 'src/**/*.spec.ts', load: false }
    ],

    env: {
      kind: "electron"
    },

    postprocessor: webpackPostprocessor,
    setup: () => {
      require('babel-polyfill'); // Required for Promises for some reason
    },
    testFramework: 'mocha',
    bootstrap: function () {
      window.__moduleBundler.loadTests();
    }
  };
};