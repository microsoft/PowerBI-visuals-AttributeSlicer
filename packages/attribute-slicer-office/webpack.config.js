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

const webpack = require('webpack');
const path = require('path');
const ENTRY = './src/app.ts';
const fs = require("fs");
const pkg = require("./package.json");

const baseConfig = function() {
    return {
        entry: ENTRY,
        output: {
            path: path.join(__dirname, 'public'),
            filename: "bundle.js"
        },
        resolve: {
            extensions: ['.webpack.js', '.web.js', '.js', '.ts', '.scss']
        },
        module: {
            loaders: [
                {
                    test: /\.ts?$/,
                    loader: 'ts-loader',
                },
                {
                    test: /\.scss$/,
                    loaders: ["style-loader", "css-loader", "sass-loader"]
                },
                {
                    test: /\.html$/,
                    loader: 'raw-loader'
                }
            ]
        },
        plugins: [
            new webpack.ProvidePlugin({
                'Promise': 'es6-promise'
            })
        ]
    };
};

module.exports = function (env) {
    const config = baseConfig();
    if (env !== "prod") {
        config.devtool = "eval";
    } else {
        var banner = new webpack.BannerPlugin(fs.readFileSync("LICENSE").toString());
        var uglify = new webpack.optimize.UglifyJsPlugin({
            mangle: true,
            minimize: true,
            compress: false,
            beautify: false,
            output: {
                ascii_only: true, // Necessary, otherwise it messes up the unicode characters that lineup is using for font-awesome
                comments: false,
            }
        });
        config.plugins.push(uglify);
        config.plugins.push(banner);
    }
    config.plugins.push(
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify(env === "prod" || process.env.NODE_ENV === "production" ? "production" : "dev"),
                'BUILD_VERSION': JSON.stringify(pkg.version + "+" + (process.env.BUILD_VERSION || "dev")),
            },
        })
    );
    return config;
};

