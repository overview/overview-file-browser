'use strict'

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
  var maybeFolderLink = args.folderName ? ('<a href="#' + h(args.fullPath) + '" class="folder">' + h(args.folderName) + '</a>') : ''

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

  var neededKeys = [ 'server', 'origin', 'documentSetId', 'apiToken' ]
  
  neededKeys.forEach(function(prop) {
    if (!options[prop]) {
      throw new Error('Must pass options.' + prop + ', a String')
    }
    _this[prop] = options[prop]
  })
}

function loadStateFromOverviewPromise(origin, apiToken) {
  return fetch(origin + '/api/v1/store/state', {
    headers: {
      Authorization: 'Basic ' + window.btoa(apiToken + ':x-auth-token'),
    },
  })
    .then(function(r) { return r.json() })
}

function loadFoldersFromPluginPromise(server, documentSetId, apiToken) {
  return fetch(
    [
      '/folders',
      '?apiToken=', encodeURIComponent(apiToken),
      '&documentSetId=', encodeURIComponent(documentSetId),
      '&server=', encodeURIComponent(server),
    ].join('')
  )
    .then(function(r) { return r.json() })
    .then(function(folderData) {
      if (folderData.errors && folderData.errors[0]) {
        var err = new Error(folderData.errors[0].title)
        err.isOverviewError = true
        throw err
      } else {
        return folderData.data
      }
    })
}

App.prototype.attach = function(el) {
  var _this = this
  this.el = el
  this.el.textContent = 'Loading…'

  // Kick off rendering promises, asynchronously
  Promise.all([
    loadFoldersFromPluginPromise(this.server, this.documentSetId, this.apiToken),
    loadStateFromOverviewPromise(this.origin, this.apiToken),
  ])
    .then(function(values) {
      var folders = values[0]
      var state = values[1]

      if (state.selected) {
        _this.runSearch(state.selected)
      }

      _this.el.innerHTML = folderListTemplate({
        subfolders: folders,
        folderName: '',
        fullPath: '',
        state: state
      })
    })
    .catch(function(e) {
      _this.el.textContent = e.isOverviewError ? e.message : 'Error in plugin code'
      console.warn(e, _this.el, _this.el.textContent)
    })

  this.el.addEventListener('click', function(ev) {
    // Only catch on click a.folder
    var a = ev.target
    while (a && a.tagName !== 'A') {
      a = a.parentNode
    }
    if (!a || !a.classList.contains('folder')) return

    var folder = a
    var container = folder.parentNode
    var path = folder.getAttribute('href').substring(1)

    _this.runSearch(path)

    if (container.classList.contains('selected')) {
      container.classList.toggle('expanded')
    } else {
      // Remove ".selected" from everything
      Array.prototype.forEach.call(_this.el.querySelectorAll('.selected'), function(el) {
        el.classList.remove('selected')
      })
      // Add ".selected" and ".expanded" to current class
      container.classList.add('selected')
      container.classList.add('expanded')
    }

    _this.saveState()
  })
}

App.prototype.runSearch = function(path) {
  window.parent.postMessage({
    call: 'refineDocumentListParams',
    args: [ {
      q: 'title:"' + path.substr(1).replace('"', '\"') + '"',
      name: 'in ' + path,
    } ],
  }, this.origin)
}

App.prototype.saveState = function() {
  var selected = null
  var selectedNode = this.el.querySelector('div.selected')
  if (selectedNode) selected = selectedNode.getAttribute('data-fullpath')

  var expanded = []
  var expandedNodes = this.el.querySelectorAll('div.expanded')
  if (expandedNodes) expanded = Array.prototype.map.call(expandedNodes, function(el) {
    return el.getAttribute('data-fullpath')
  })

  fetch(this.origin + '/api/v1/store/state', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + window.btoa(this.apiToken + ':x-auth-token'),
    },
    body: JSON.stringify({
      selected: selected,
      expanded: expanded,
    })
  }) // and ignore any success or errors
}

module.exports = App
