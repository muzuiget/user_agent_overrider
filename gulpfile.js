'use strict';

let del = require('del');
let gulp = require('gulp');
let runSeq = require('run-sequence');
let zip = require('gulp-zip');

gulp.task('clean', function() {
    return del(['dist']);
});

gulp.task('copy', function()  {
    let files = [
        'src/**/*.css',
        'src/**/*.dtd',
        'src/**/*.manifest',
        'src/**/*.png',
        'src/**/*.properties',
        'src/**/*.rdf',
        'src/**/*.xul',
    ];
    return gulp.src(files)
               .pipe(gulp.dest('dist/unpack/'));
});

gulp.task('script', function()  {
    let files = [
        'src/**/*.js',
    ];
    return gulp.src(files)
               .pipe(gulp.dest('dist/unpack/'));
});

gulp.task('xpi', function() {
    return gulp.src('dist/*')
        .pipe(zip('user_agent_overrider.xpi'))
        .pipe(gulp.dest('dist/xpi/'));
});

gulp.task('product', function(callback) {
    runSeq(['xpi'], callback);
});

gulp.task('make', function(callback) {
    runSeq(['copy', 'script'], callback);
});

gulp.task('remake', function(callback) {
    runSeq('clean', 'make', callback);
});

gulp.task('build', function(callback) {
    runSeq('remake', 'product', callback);
});

gulp.task('default', function(callback) {
    runSeq('remake', callback);
});
