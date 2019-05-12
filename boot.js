require('dotenv').config()
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const path = require("path")
const app = express();
const config = require('./webpack.dev.config.js');
const compiler = webpack(config);

// Tell express to use the webpack-dev-middleware and use the webpack.config.js
// configuration file as a base.
app.use(webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath
}));
app.use('/', express.static(__dirname));
app.use(webpackHotMiddleware(compiler));

// Serve the files on port 3000.
app.listen(process.env.PORT, function () {
  console.log(`App listening on port ${process.env.PORT}!\n`);
});