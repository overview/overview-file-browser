'use strict'

const browserify = require('browserify')
const buffer = require('vinyl-buffer')
const express = require('express')
const gulp = require('gulp')
const jade = require('gulp-jade')
const morgan = require('morgan')
const less = require('gulp-less')
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
    extensions: ['.js', '.jade'],
    debug: true,
  }).transform('jadeify')
}

gulp.task('browserify', function() {
  // https://github.com/gulpjs/gulp/blob/master/docs/recipes/browserify-uglify-sourcemap.md
  return buildBrowserify().bundle()
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(uglify())
      .on('error', console.warn)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/'))
})

gulp.task('browserify-dev', function() {
  var bundler, rebundle
  bundler = watchify(buildBrowserify(), watchify.args)
  rebundle = function() {
    return bundler.bundle()
      .on('error', console.warn)
      .pipe(source('main.js'))
      .pipe(gulp.dest('./dist/'))
  }
  bundler.on('update', rebundle)
  return rebundle()
})

gulp.task('jade', function() {
  return gulp.src('./jade/**/*.jade').pipe(jade()).pipe(gulp.dest('dist'))
})

gulp.task('less', function() {
  return gulp.src('./less/show.less').pipe(less()).pipe(gulp.dest('dist'))
})

gulp.task('dev', ['browserify-dev', 'jade', 'less'], function() {
  gulp.watch('./less/**/*.less', ['less'])
  return gulp.watch('./jade/**/*.jade', ['jade'])
})

gulp.task('dist', ['browserify', 'jade', 'less'])

gulp.task('default', ['dev'])
