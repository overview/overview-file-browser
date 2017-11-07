var browserify = require('browserify');
var express = require('express');
var gulp = require('gulp');
var jade = require('gulp-jade');
var morgan = require('morgan');
var less = require('gulp-less');
var source = require('vinyl-source-stream');
var watchify = require('watchify');

var buildBrowserify = function() {
  return browserify({
    cache: {},
    packageCache: {},
    fullPaths: true,
    entries: ['./src/main.coffee'],
    extensions: ['.js', '.coffee', '.jade'],
    debug: true
  }).transform('coffeeify').transform('jadeify');
};

gulp.task('browserify', function() {
  return buildBrowserify().transform('uglifyify').bundle()
    .on('error', console.warn)
    .pipe(source('main.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('browserify-dev', function() {
  var bundler, rebundle;
  bundler = watchify(buildBrowserify(), watchify.args);
  rebundle = function() {
    return bundler.bundle()
      .on('error', console.warn)
      .pipe(source('main.js'))
      .pipe(gulp.dest('./dist/'));
  };
  bundler.on('update', rebundle);
  return rebundle();
});

gulp.task('jade', function() {
  return gulp.src('./jade/**/*.jade').pipe(jade()).pipe(gulp.dest('dist'));
});

gulp.task('less', function() {
  return gulp.src('./less/show.less').pipe(less()).pipe(gulp.dest('dist'));
});

gulp.task('dev', ['browserify-dev', 'jade', 'less'], function() {
  gulp.watch('./less/**/*.less', ['less']);
  return gulp.watch('./jade/**/*.jade', ['jade']);
});

gulp.task('dist', ['browserify', 'jade', 'less']);

gulp.task('default', ['dev']);
