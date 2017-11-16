module.exports = function(config) {
  config.set({
    browsers: [ 'Electron' ],
    frameworks: [ 'browserify', 'mocha' ],
    reporters: [ 'mocha' ],
    verbose: true,

    files: [
      'test/*Test.js',
    ],

    preprocessors: {
      'test/*Test.js': [ 'browserify' ],
    },

    browserify: {
      debug: true,
      extensions: [ '.js', '.jade' ],
    },
  })
}
