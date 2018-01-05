'use strict'

const browserify = require('browserify')
const buffer = require('vinyl-buffer')
const gls = require('gulp-live-server')
const gulp = require('gulp')
const jade = require('gulp-jade')
const less = require('gulp-less')
const plumber = require('gulp-plumber')
const source = require('vinyl-source-stream')
const sourcemaps = require('gulp-sourcemaps')
const uglify = require('gulp-uglify')
const watchify = require('watchify')

var buildBrowserify = function() {
  return browserify({
    cache: {},
    packageCache: {},
    fullPaths: true,
    entries: ['./src/main.js'],
    debug: true,
  })
}

gulp.task('browserify', function() {
  // https://github.com/gulpjs/gulp/blob/master/docs/recipes/browserify-uglify-sourcemap.md
  return buildBrowserify().bundle()
    .pipe(plumber())
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/'))
})

gulp.task('jade', function() {
  return gulp
    .src('./jade/**/*.jade')
    .pipe(plumber())
    .pipe(jade())
    .pipe(gulp.dest('dist'))
})

gulp.task('less', function() {
  return gulp
    .src('./less/show.less')
    .pipe(plumber())
    .pipe(less())
    .pipe(gulp.dest('dist'))
})

gulp.task('dev', ['browserify', 'jade', 'less'], function() {
  const server = gls('server.js')
  server.start()

  gulp.watch('./src/**/*.js', ['browserify'])
  gulp.watch('./less/**/*.less', ['less'])
  gulp.watch('./jade/**/*.jade', ['jade'])
  gulp.watch('./server.js', server.start.bind(server))
})

gulp.task('dist', ['browserify', 'jade', 'less'])

gulp.task('default', ['dev'])

process.on('SIGINT', () => process.exit(0)) // so user can always Ctrl+C
