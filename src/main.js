var App = require('./App')
var $ = require('jquery')
var QueryString = require('querystring')

$(function() {
  var options = QueryString.parse(window.location.search.substr(1))
  var app = new App(options)
  app.attach($('#app'))
})
