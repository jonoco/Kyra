var gulp = require('gulp'),
  gutil = require('gulp-util'),
  webserver = require('gulp-webserver'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  jsonminify = require('gulp-jsonminify'),
  ghPages = require('gulp-gh-pages');

gulp.task('js', function() {
  gulp.src('builds/development/js/**/*')
});

gulp.task('html', function() {
  gulp.src('builds/development/*.html')
});

gulp.task('watch', function() {
  gulp.watch('builds/development/js/**/*', ['js']);
  gulp.watch(['builds/development/*.html',
    'builds/development/views/*.html'], ['html']);
});

gulp.task('webserver', function() {
  gulp.src('builds/development/')
    .pipe(webserver({
      livereload: true,
      open: true
    }));
});

gulp.task('default', ['watch', 'html', 'js', 'webserver']);

gulp.task('scripts', function() {
    return gulp.src('builds/development/js/*.js')
      .pipe(concat('all.min.js'))
      .pipe(gulp.dest('builds/production/js'));
});

gulp.task('assets', function() {
  return gulp.src('builds/development/assets/**')
    .pipe(gulp.dest('builds/production/assets/'));
});

gulp.task('json', function() {
  return gulp.src('builds/development/js/json/*.json')
    .pipe(gulp.dest('builds/production/js/json'));
});

gulp.task('ghpage', function() {
  return gulp.src('builds/production/**/*')
    .pipe(ghPages());
});

gulp.task('deploy', ['scripts', 'assets', 'json', 'ghpage']);





