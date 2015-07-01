require('./test_helper')
App = require('../src/App')
$ = require('jquery')

describe 'App', ->
  beforeEach ->
    @stateAjaxArgs =
      'url': 'https://example.org/api/v1/store/state'
      'dataType': 'json'
      'headers':
        'Authorization': 'Basic YXNkZjp4LWF1dGgtdG9rZW4='

    @foldersAjaxArgs = '/folders' + window.location.search

    @sandbox = sinon.sandbox.create()
    ajaxStub = @sandbox.stub($, 'ajax')
    ajaxStub.withArgs(@stateAjaxArgs).returns(
      new Promise (resolve, reject) =>
        @resolveState = resolve
        @rejectState = reject
    )
    ajaxStub.withArgs(@foldersAjaxArgs).returns(
      new Promise (resolve, reject) =>
        @resolveFolders = resolve
        @rejectFolders = reject
    )

    @options =
      server: 'https://example.org'
      documentSetId: '1'
      apiToken: 'asdf'
    @subject = new App(@options)

  afterEach ->
    @sandbox.restore()

  describe '#attach', ->
    beforeEach ->
      @$el = $('<div></div>')
      @subject.attach(@$el[0])

    it 'should show loading', ->
      expect(@$el.text()).to.eq('Loading…')

    it 'should make an ajax request for the data', ->
      expect($.ajax).to.have.been.calledTwice
      expect($.ajax).to.have.been.calledWith(@foldersAjaxArgs)
      expect($.ajax).to.have.been.calledWith(@stateAjaxArgs)

    it 'should show error on error', (done) ->
      @rejectState('an xhr')
      setTimeout(=> # slower than process.nextTick()
        expect(@$el.text()).to.eq('Error.')
        done()
      , 0)

    it 'should show documents on success', (done) ->
      @resolveState(
        'selected': '/root/child2',
        'expanded': ["/root","/root/child1","/root/child2"]
      )

      @resolveFolders(
        'data':
          'root':
            'child1':
              'subchild1': {}
            'child2': {}
      )

      setTimeout(=> # slower than process.nextTick()
        expect(@$el.find('ul > li > div > a.folder').text()).to.eq('rootchild1subchild1child2')
        done()
      , 0)
