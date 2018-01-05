#!/usr/bin/env node
'use strict'

const express = require('express')
const morgan = require('morgan')
const oboe = require('oboe')

const app = express()
app.use(morgan('short'))

app.get('/folders', (req, res) => {
  const folders = {}
  let foundADoc = false
  let foundAFolder = false

  const url = `${req.query.server}/api/v1/document-sets/${req.query.documentSetId}/documents?fields=title`
  oboe({
    url: url,
    headers: { Authorization: `Basic ${new Buffer(req.query.apiToken + ':x-auth-token').toString('base64')}` },
  })
    .on('node', '!.items[*]', (document) => {
      let parent = folders

      foundADoc = true
      document.title.split('/').slice(0, -1).forEach(folder => {
        parent[folder] = parent[folder] || {}
        parent = parent[folder]
        foundAFolder = true
      })

      return oboe.drop
    })

    .on('done', () => {
      if(foundADoc && !foundAFolder) {
        const msg = 'Unfortunately, this plugin only works if you import documents using the "Add all files in a folder..." button'

        res.json({"errors": [{"code": "DocsWithoutFolders", "title": msg}]})
      } else {
        res.json({"data": folders})
      }
    })

    .on('fail', (err) => {
      const msg = `Failed to GET ${url}: ${err.body}`
      res.json({"errors": [{"code": "OverviewError", "title": msg}]})
    })
})

app.use(express.static(`${__dirname}/dist`, {
  extensions: [ 'html' ],
  setHeaders: (res) => { res.setHeader('Access-Control-Allow-Origin', '*') }
}))

const PORT = process.env.PORT || 80

app.listen(PORT, function() {
  console.log(`Listening on http://0.0.0.0:${PORT}`)
})
