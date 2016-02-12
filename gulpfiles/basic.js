'use strict';

let del = require('del');
let gulp = require('gulp');
let eslint = require('gulp-eslint');

gulp.task('clean', function() {
    return del(['dist']);
});

gulp.task('eslint', function() {
    let files = [
        'gulpfile.js',
        'gulpfiles/**/*.js',
        'src/**/*.js',
    ];
    return gulp.src(files)
               .pipe(eslint())
               .pipe(eslint.format())
               .pipe(eslint.failOnError());
});
