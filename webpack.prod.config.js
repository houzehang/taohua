const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  entry: {
    vendor: [ 'react', 'react-dom', 'jquery' ],
    app : './dev/scripts/app.js',
    version : './dev/scripts/version.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: './',
    filename: '[name].[hash].js',
  },
  module: {
    rules: [
      { test: /\.html$/i, loader: 'html-loader' },
      {
        test: /\.jsx?$/,
        exclude: /node_module/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['es2015', 'react', 'stage-2']
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        })
      },
      {
        test: /\.less$/i,
        use: ExtractTextPlugin.extract([ 'css-loader', 'less-loader' ])
      },
      {
        test: /\.(gif|png|jpe?g|svg|mp3)$/i,
        use: [ 'file-loader' ]
      }
    ],
  },
  resolve: {
    modules: ['node_modules', path.resolve(__dirname, 'dev')],
    extensions: ['.js', '.jsx', '.less', '.css'],
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
    }),
    new CleanWebpackPlugin(['dist'], {
      root: __dirname
    }),
    new ExtractTextPlugin("[name].[hash].css"),
    new CopyWebpackPlugin([
      { from: 'libs/**/*', to: '' },
      { from: 'dev/version.html', to: 'version.html', toType: "file" }
    ]),
    new UglifyJSPlugin({
      sourceMap: true
    }),
    new HtmlWebpackPlugin({
      chunks: ["app"],
      title: "Shell脚本助手",
      template: path.resolve(__dirname, "dev", "index.html"),
      filename: "index.html"
    }),
    new HtmlWebpackPlugin({
      chunks: ["version"],
      template: path.resolve(__dirname, "dev", "version.html"),
      filename: "version.html",
    }),
    new HtmlWebpackIncludeAssetsPlugin({
      assets: [
        './libs/flexible.js'
      ],
      publicPath: false,
      append: false,
      files: ['index.html']
    }),
    new HtmlWebpackIncludeAssetsPlugin({
      assets: [
        './libs/flexible.js'
      ],
      publicPath: false,
      append: false,
      files: ['version.html']
    })
  ],
};
