var express = require('express');
var morgan = require('morgan');
var oboe = require('oboe');
var API = require('overview-api-node');

app = express();
app.use(morgan('dev'));

app.get('/folders', function(req, res) {
  var folders = {};
  var foundADoc = false;
  var foundAFolder = false;
  var client = new API(req.query.server, req.query.apiToken, oboe);

  client.docSet(req.query.documentSetId).getDocuments(["title"])
    .on('node', '!items[*]', function(document) {
      var parent = folders;

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
        var msg = 'Unfortunately, this plugin only works if you imported ' +
          'your documents using the "Add all files in a folder...", option, ' +
          'which is only available in Chrome.';

        res.json({"errors": [{"code": "DocsWithoutFolders", "title": msg}]})
      }
      else {
        res.json({"data": folders});
      }
    });
});

app.use(express.static('dist', {
  extensions: [ 'html' ],
  setHeaders: function(res) { res.setHeader('Access-Control-Allow-Origin', '*'); }
}))

const PORT = process.env.PORT || 3000;

app.listen(PORT);
console.log('Listening on http://localhost:%s', PORT);
