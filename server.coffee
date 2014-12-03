
express = require('express')
morgan = require('morgan')
oboe = require('oboe')

app = express()
app.use(morgan('dev'))

app.get '/folders', (req, res) ->

  folders = {}

  oboe(
    url: "#{req.query.server}/api/v1/document-sets/#{req.query.documentSetId}/documents?stream=true&fields=title"
    headers:
      Authorization: 'Basic '+new Buffer(req.query.apiToken+':x-auth-token').toString('base64')
  )
    .on 'node', '!items[*]', (document) ->

      parent = folders
      for folder in document.title.split('/').slice(0, -1)
        parent[folder] ?= {}
        parent = parent[folder]

      oboe.drop

    .on 'done', ->
      res.json(folders)

app.use(express.static('dist', {
  extensions: [ 'html' ]
  setHeaders: (res) -> res.setHeader('Access-Control-Allow-Origin', '*')
}))

app.listen(8000)
console.log('Serving at http://localhost:8000')
