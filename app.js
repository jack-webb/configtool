const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const deepDiff = require('deep-diff');
const fuse = require('fuse.js')

const { getFileParameters, resolveConfigUrl } = require('./resolve');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

let fuseInstance = new fuse([], {
  keys: ['path'],
  includeScore: true
});

let baseJsonData = {};
let changes = [];

app.get('/fileParameters', async (req, res) => {
  try {
    const parameters = await getFileParameters(req);
    res.json(parameters);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.get('/loadConfigFile', async (req, res) => {
  const queryParameters = req.query;
  try {
    const url = await resolveConfigUrl(queryParameters);
    const response = await axios.get(url);
    baseJsonData = response.data;

    // Prepare data for Fuse.js
    const flattenedData = [];
    const flattenObject = (obj, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (_.isObject(value)) {
          flattenObject(value, newKey);
        } else {
          flattenedData.push({ path: newKey, value });
        }
      }
    };
    flattenObject(baseJsonData);

    // Initialize Fuse with the prepared data
    fuseInstance = new fuse(flattenedData, {
      keys: ['path'],
      includeScore: true
    });

    res.json({ "url": url });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.post('/validateKey', (req, res) => {
  const { key } = req.body;
  const existingNode = _.get(baseJsonData, key, undefined);
  const isExisting = existingNode !== undefined;

  // Perform fuzzy search to find most likely targets
  const results = fuseInstance.search(key);
  const mostLikelyTargets = results.map(r => r.item.path).slice(0, 10);

  res.json({ isExisting, existingNode, mostLikelyTargets });
});

app.post('/update', (req, res) => {
  const keyValuePairs = req.body.keyValuePairs;
  try {
    changes = [];
    keyValuePairs.forEach(({ key, value }) => {
      changes.push({ key, value });
    });
    res.sendStatus(200);
  } catch (err) {
    return res.status(400).send(err.message);
  }
});

app.get('/diff', (req, res) => {
  let modifiedJsonData = _.cloneDeep(baseJsonData);
  changes.forEach(({ key, value }) => {
    _.set(modifiedJsonData, key, value);
  });
  const differences = deepDiff(baseJsonData, modifiedJsonData) || [];
  const diffResult = differences.map(diff => {
    return {
      path: diff.path.join('.'),
      kind: diff.kind,
      lhs: diff.lhs,
      rhs: diff.rhs
    };
  });
  res.json({ diff: diffResult });
});

app.get('/modified.json', (req, res) => {
  let modifiedJsonData = _.cloneDeep(baseJsonData);
  changes.forEach(({ key, value }) => {
    _.set(modifiedJsonData, key, value);
  });
  res.json(modifiedJsonData);
});

app.get('/makeChanges', (req, res) => {
  const makeChanges = changes.map(({ key, value }) => `file.set('${key}', ${JSON.stringify(value)})`);
  res.json({ makeChanges });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000/');
});
