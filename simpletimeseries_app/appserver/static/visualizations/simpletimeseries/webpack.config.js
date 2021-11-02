var webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: 'visualization_source',
    resolve: {
        root: [
            path.join(__dirname, 'src'),
        ]
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components|search_mrsparkle)/,
                loader: 'babel-loader', // 'babel-loader' is also a valid name to reference
            }
        ]
    },
    output: {
        filename: 'visualization.js',
        libraryTarget: 'amd'
    },
    externals: [
        'api/SplunkVisualizationBase',
        'api/SplunkVisualizationUtils',
        'jquery'
    ]
};