'use strict';

let del = require('del');
let gulp = require('gulp');

gulp.task('clean', function() {
    return del(['dist']);
});
