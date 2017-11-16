'use strict'

var $ = require('jquery')

var Escapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
}
var EscapeTestRegex = /&<>"'/
var EscapeRegex = /&<>"'/g
function escapeChar(c) { return Escapes[c] }

function escapeHtml(s) {
  if (!EscapeTestRegex.test(s)) return s
  return s.replace(EscapeRegex, escapeChar)
}

var h = escapeHtml

function folderListTemplate(args) {
  var keys = Object.keys(args.subfolders)
  keys.sort(function(a, b) { return a.localeCompare(b) })

  var leafClass = keys.length ? '' : 'leaf'
  var selectedClass = args.state.selected === args.fullPath ? 'selected' : ''
  var expandedClass = (args.state.expanded || []).indexOf(args.fullPath) > -1 ? 'expanded' : ''
  var maybeFolderLink = args.folderName ? ('<a href="' + h(args.fullPath) + '" class="folder">' + h(args.folderName) + '</a>') : ''

  var maybeUl = keys.length === 0 ? '' : [
    '<ul class="folders">',
      keys.map(function(key) { return [
        '<li>',
          folderListTemplate({
            subfolders: args.subfolders[key],
            folderName: key,
            fullPath: args.fullPath + '/' + key,
            state: args.state,
          }),
        '</li>',
      ].join('') }).join(''),
    '</ul>',
  ].join('')

  var html = [
    '<div',
      ' data-fullpath="', h(args.fullPath), '"',
      ' class="', leafClass, ' ', selectedClass, ' ', expandedClass, '"',
      '>',
      maybeFolderLink,
      maybeUl,
    '</div>',
  ].join('')

  return html
}

function App(options) {
  var _this = this
  [ 'server', 'documentSetId', 'apiToken' ].forEach(function(prop) {
    if (!options[prop]) {
      throw new Error('Must pass options.' + prop + ', a String')
    }
    _this[prop] = options[prop]
  })
}

App.prototype.$ = function() {
  return this.$el.find.apply(this, Array.prototype.slice.apply(arguments))
}

App.prototype.attach = function(el) {
  this.el = el
  this.el.textContent = 'Loading…'
  this.$el = $(el)

  // Kick off rendering promises, asynchronously
  Promise.all([
    Promise.resolve($.ajax('/folders'+window.location.search)),
    Promise.resolve($.ajax({
      url: this.server + '/api/v1/store/state',
      dataType: 'json',
      headers: {
        Authorization: 'Basic ' + new Buffer(this.apiToken + ':x-auth-token').toString('base64'),
      },
    }))
  ])
    .then(function(values) {
      var folderData = values[0]
      var state = values[1]
      var folders

      if (folderData.errors && folderData.errors[0]) {
        var err = new Error(folderData.errors[0].title)
        err.isOverviewError = true
        throw err
      } else {
        folders = folderData.data
      }

      if (state.selected) {
        this.runSearch(state.selected)
      }

      this.el.innerHTML = folderListTemplate({
        subfolders: folders,
        folderName: '',
        fullPath: '',
        state: state
      })
    })
    .catch(function(e) {
      console.log(e)
      this.el.textContent = e.isOverviewError ? e.message : 'Error in plugin code'
    })

  this.$el.on('click', 'a.folder', function(ev) {
    var folder = ev.currentTarget
    var container = folder.parentNode
    var path = folder.getAttribute('href').substring(1)

    this.runSearch(path)

    if (container.classList.contains('selected')) {
      container.classList.toggle('expanded')
    } else {
      this.$el.find('.selected').removeClass('selected')
      container.classList.add('selected')
      container.classList.add('expanded')
    }

    this.saveState()
  })
}

App.prototype.runSearch = function(path) {
  window.parent.postMessage({
    call: 'setDocumentListParams',
    args: [ {
      q: 'title:"' + path.substr(1).replace('"', '\"') + '"',
      name: 'in ' + path,
    } ],
  }, '*')
}

App.prototype.saveState = function() {
  var selected = $('div.selected').attr('data-fullpath')
  var expanded = $('div.expanded').get().map(function(el) { return el.getAttribute('data-fullpath') })

  $.ajax({
    url: this.server + '/api/v1/store/state',
    type: 'put',
    contentType: 'application/json',
    headers: {
      Authorization: 'Basic '+new Buffer(this.apiToken+':x-auth-token').toString('base64'),
    },
    data: JSON.stringify({
      selected: selected,
      expanded: expanded,
    })
  })
}

module.exports = App
