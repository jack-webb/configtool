const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');

module.exports = function(app) {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static('public'));
  app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
  // app.use('/frontend', express.static(path.join(__dirname, 'frontend')));
};
