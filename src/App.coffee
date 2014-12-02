$ = require('jquery')
_ = require('lodash')
Promise = require('bluebird')

Params =
  server: 'a String'
  documentSetId: 'a String'
  apiToken: 'a String'

module.exports = class App
  constructor: (@options) ->
    for k, v of Params
      throw "Must pass options.#{k}, a #{v}" if !@options[k]
      @[k] = @options[k]

    @_ajax = (options) =>
      auth = new Buffer(@apiToken + ':x-auth-token').toString('base64')

      options = _.extend({
        dataType: 'json'
        headers:
          Authorization: "Basic #{auth}"
      }, options)
      Promise.resolve($.ajax(options))

  $: (args...) -> @$el.find(args...)

  getDocuments: ->
    @_ajax(url: "#{@server}/api/v1/document-sets/#{@documentSetId}/documents?stream=true&fields=title")

  attach: (el) ->
    @$el = $(el)
    @$el.text('Loading…')

    @getDocuments()
      .then (result) =>

        folders = {}

        for document in result.items
          parent = folders
          for folder in document.title.split('/').slice(0, -1)
            parent[folder] ?= {}
            parent = parent[folder]

        folderList = _.template('''
          <p><%- folderName %></p>
          <%
            var keys = Object.keys(subfolders);
            keys.sort(function(a, b) {
              return a.localeCompare(b);
            });
          %>
          <% if (keys.length > 0) { %>
            <ul>
              <% _.each(keys, function(key) { %>
                <li>
                  <%=
                    folderList({
                      folderList: folderList,
                      subfolders: subfolders[key],
                      folderName: key
                    })
                  %>
                </li>
              <% }); %>
            </ul>
          <% } %>
        ''')

        @$el.html(folderList(
          folderList: folderList,
          subfolders: folders,
          folderName: 'root'
        ))

      .catch (e) =>
        console.log e
        @$el.text('Error')

    undefined
