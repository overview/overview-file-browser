module.exports = (config) ->
  config.set
    browsers: [ 'PhantomJS' ]
    frameworks: [ 'browserify', 'mocha' ]
    reporters: [ 'mocha' ]

    files: [
      'test/*Test.coffee'
    ]

    browserify:
      debug: true
      transform: [ 'coffeeify' ]
      extensions: [ '.js', '.coffee', '.jade' ]
