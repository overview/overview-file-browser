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

  $: (args...) -> @$el.find(args...)

  attach: (el) ->
    @$el = $(el)
    @$el.text('Loading…')

    Promise.all([
      Promise.resolve($.ajax('/folders'+window.location.search))
      Promise.resolve($.ajax(
        url: "#{@server}/api/v1/store/state"
        dataType: 'json'
        headers:
          Authorization: 'Basic '+new Buffer(@apiToken+':x-auth-token').toString('base64')
      ))
    ])
      .spread (folders, state) =>

        folderList = _.template('''
          <div data-fullpath="<%- fullPath %>" class="<%- Object.keys(subfolders).length ? '' : 'leaf' %> <%- state.selected == fullPath ? 'selected' : '' %> <%- (state.expanded || []).indexOf(fullPath) > -1 ? 'expanded' : '' %>">
            <% if (folderName) { %>
              <a href="#<%- fullPath %>" class="folder"><%- folderName %></a>
            <% } %>
            <%
              var keys = Object.keys(subfolders);
              keys.sort(function(a, b) {
                return a.localeCompare(b);
              });
            %>
            <% if (keys.length > 0) { %>
              <ul class="folders">
                <% _.each(keys, function(key) { %>
                  <li>
                    <%=
                      folderList({
                        folderList: folderList,
                        subfolders: subfolders[key],
                        folderName: key,
                        fullPath: fullPath+'/'+key,
                        state: state
                      })
                    %>
                  </li>
                <% }); %>
              </ul>
            <% } %>
          </div>
        ''')

        @$el.html(folderList(
          folderList: folderList,
          subfolders: folders,
          folderName: '',
          fullPath: '',
          state: state
        ))

      .catch (e) =>
        console.log e
        @$el.text('Error')

    @$el.on 'click', 'a.folder', (ev) =>

      $folder = $(ev.currentTarget)
      $container = $folder.parent()
      path = $folder.attr('href').substring(2)

      window.parent.postMessage({
        call: 'setDocumentListParams',
        args: [{q: "title:\"#{path}\"", name: "in #{path}"}]
      }, @options.server)

      if $container.hasClass('selected')
        $container.toggleClass('expanded')

      else
        @$el.find('.selected').removeClass('selected')
        $container.addClass('selected expanded')

      @saveState()

    undefined

  saveState: ->

    selected = $('div.selected').attr('data-fullpath')
    expanded = $('div.expanded').get().map (el) ->
      el.getAttribute('data-fullpath')

    $.ajax
      url: "#{@server}/api/v1/store/state"
      type: 'put'
      contentType: 'application/json'
      headers:
        Authorization: 'Basic '+new Buffer(@apiToken+':x-auth-token').toString('base64')
      data: JSON.stringify(
        selected: selected
        expanded: expanded
      )
