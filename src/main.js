var App = require('./App')
var QueryString = require('querystring')

var options = QueryString.parse(window.location.search.substr(1))
var app = new App(options)
app.attach(document.getElementById('app'))
