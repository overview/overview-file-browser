'use strict'

require('./test_helper')
const App = require('../src/App')
const $ = require('jquery')

describe('App', function() {
  beforeEach(function() {
    this.stateAjaxArgs = {
      'url': 'https://origin.org/api/v1/store/state',
      'dataType': 'json',
      'headers': {
        'Authorization': 'Basic YXNkZjp4LWF1dGgtdG9rZW4=',
      }
    }

    this.foldersAjaxArgs = '/folders' + window.location.search

    this.sandbox = sinon.sandbox.create()
    const ajaxStub = this.sandbox.stub($, 'ajax')
    ajaxStub.withArgs(this.stateAjaxArgs).returns(
      new Promise((resolve, reject) => {
        this.resolveState = resolve
        this.rejectState = reject
      })
    )
    ajaxStub.withArgs(this.foldersAjaxArgs).returns(
      new Promise((resolve, reject) => {
        this.resolveFolders = resolve
        this.rejectFolders = reject
      })
    )

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
      expect($.ajax).to.have.been.calledTwice
      expect($.ajax).to.have.been.calledWith(this.foldersAjaxArgs)
      expect($.ajax).to.have.been.calledWith(this.stateAjaxArgs)
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
      }, 0)
    })
  })
})
