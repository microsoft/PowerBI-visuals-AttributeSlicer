/*
 * Copyright (c) Microsoft
 * All rights reserved.
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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