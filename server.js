#!/usr/bin/env node
'use strict'

const express = require('express');
const morgan = require('morgan');
const oboe = require('oboe');
const API = require('overview-api-node');

const app = express();
app.use(morgan('short'));

app.get('/folders', function(req, res) {
  const folders = {};
  let foundADoc = false;
  let foundAFolder = false;
  const client = new API(req.query.server, req.query.apiToken, oboe);

  client.docSet(req.query.documentSetId).getDocuments(["title"])
    .on('node', '!items[*]', function(document) {
      let parent = folders;

      foundADoc = true;
      document.title.split('/').slice(0, -1).forEach(function(folder) {
        parent[folder] = parent[folder] || {};
        parent = parent[folder];
        foundAFolder = true;
      });

      return oboe.drop;
    })

    .on('done', function() {
      if(foundADoc && !foundAFolder) {
        const msg = 'Unfortunately, this plugin only works if you imported ' +
          'your documents using the "Add all files in a folder...", option, ' +
          'which is only available in Chrome.';

        res.json({"errors": [{"code": "DocsWithoutFolders", "title": msg}]})
      } else {
        res.json({"data": folders});
      }
    });
});

app.use(express.static(`${__dirname}/dist`, {
  extensions: [ 'html' ],
  setHeaders: function(res) { res.setHeader('Access-Control-Allow-Origin', '*'); }
}))

const PORT = process.env.PORT || 3000;

app.listen(PORT, function() {
  console.log('Listening on http://localhost:%s', PORT);
});
