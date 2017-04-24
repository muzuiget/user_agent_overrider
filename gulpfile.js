/* eslint-env node */
/* eslint strict: [2, "global"] */

'use strict';

let gulp = require('gulp');
let runSeq = require('run-sequence');

require('./gulpfiles/commander');
require('./gulpfiles/basic');
require('./gulpfiles/common');
require('./gulpfiles/develop');
require('./gulpfiles/product');

gulp.task('make', function(callback) {
    runSeq(['copy', 'metainfo', 'manifest', 'script'], callback);
});

gulp.task('remake', function(callback) {
    runSeq('clean', 'make', callback);
});

gulp.task('build', function(callback) {
    runSeq('remake', 'product', callback);
});

gulp.task('default', function(callback) {
    runSeq('remake', ['process', 'livereload', 'watch'], callback);
});
