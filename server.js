var express = require('express');
var morgan = require('morgan');
var oboe = require('oboe');
var API = require('overview-api-node');

app = express();
app.use(morgan('dev'));

app.get('/folders', function(req, res) {
  var folders = {};
  var client = new API(req.query.server, req.query.apiToken, oboe);

  client.docSet(req.query.documentSetId).getDocuments(["title"])
    .on('node', '!items[*]', function(document) {
      var parent = folders;

      document.title.split('/').slice(0, -1).forEach(function(folder) {
        parent[folder] = parent[folder] || {};
        parent = parent[folder];
      });

      return oboe.drop;
    })

    .on('done', function() {
      res.json(folders);
    });
});

app.use(express.static('dist', {
  extensions: [ 'html' ],
  setHeaders: function(res) { res.setHeader('Access-Control-Allow-Origin', '*'); }
}))

app.listen(8000)
console.log('Serving at http://localhost:8000')
