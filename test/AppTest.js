'use strict'

const $ = require('jquery')
require('./test_helper')
const App = require('../src/App')

describe('App', function() {
  beforeEach(function() {
    this.stateAjaxArgs = [ 'https://origin.org/api/v1/store/state', {
      'headers': {
        'Authorization': 'Basic YXNkZjp4LWF1dGgtdG9rZW4=',
      }
    } ]

    this.foldersAjaxArgs = [
      '/folders?apiToken=asdf&documentSetId=1&server=https%3A%2F%2Fexample.org'
    ]

    // Returns a function that resolves a promise
    //
    // Input to the returned function: successful JSON
    // Output: a Fetch API Response object
    function respondToFetch(resolve) {
      return function(jsonResponse) {
        var blob = new Blob([ JSON.stringify(jsonResponse) ])
        var init = { status: 200, statusText: 'OK' }
        var response = new Response(blob, init)
        resolve(response)
      }
    }

    this.sandbox = sinon.sandbox.create()
    this.sandbox.stub(window, 'fetch').callsFake((...args) => {
      if (args[0] === this.stateAjaxArgs[0]) {
        return new Promise((resolve, reject) => {
          this.resolveState = respondToFetch(resolve)
          this.rejectState = reject
        })
      }
      if (args[0] === this.foldersAjaxArgs[0]) {
        return new Promise((resolve, reject) => {
          this.resolveFolders = respondToFetch(resolve)
          this.rejectFolders = reject
        })
      }
      console.warn('Unhandled args', ...args)
    })

    this.options = {
      server: 'https://example.org',
      origin: 'https://origin.org',
      documentSetId: '1',
      apiToken: 'asdf',
    }
    this.subject = new App(this.options)
  })

  afterEach(function() {
    this.sandbox.restore()
  })

  describe('#attach', function() {
    beforeEach(function() {
      this.$el = $('<div></div>')
      this.subject.attach(this.$el[0])
    })

    it('should show loading', function() {
      expect(this.$el.text()).to.eq('Loading…')
    })

    it('should make an ajax request for the data', function() {
      expect(window.fetch).to.have.been.calledTwice
      expect(window.fetch).to.have.been.calledWith(...this.foldersAjaxArgs)
      expect(window.fetch).to.have.been.calledWith(...this.stateAjaxArgs)
    })

    it('should show error on error', function(done) {
      this.rejectState('an xhr')
      setTimeout(() => { // slower than process.nextTick()
        expect(this.$el.text()).to.eq('Error in plugin code')
        done()
      }, 0)
    })

    it('should show documents on success', function(done) {
      this.resolveState({
        'selected': '/root/child2',
        'expanded': ['/root','/root/child1','/root/child2'],
      })

      this.resolveFolders({
        'data': {
          'root': {
            'child1': {
              'subchild1': {},
            },
            'child2': {},
          },
        },
      })

      setTimeout(() => { // slower than process.nextTick()
        expect(this.$el.find('ul > li > div > a.folder').text()).to.eq('rootchild1subchild1child2')
        done()
      }, 10) // make sure the wait() and accompanying Promises finish
    })
  })
})
