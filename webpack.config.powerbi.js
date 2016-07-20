const path = require('path');
const webpack = require('webpack');

module.exports = {
    devtool: 'eval',
    resolve: {
        extensions: ['', '.webpack.js', '.web.js', '.js', '.json']
    },
    module: {
        loaders: [
            {
                test: /\.scss$/,
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
    },
    externals: {
        jquery: "jQuery",
        d3: "d3",
        underscore: "_",
        "lodash": "_"
    },
    plugins: [
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.ProvidePlugin({
            'Promise': 'exports?global.Promise!es6-promise'
        }),
        new webpack.DefinePlugin({
            'process.env.DEBUG': "\"" + (process.env.DEBUG || "") + "\""
        })
    ],
};
