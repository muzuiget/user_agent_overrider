'use strict';

let gulp = require('gulp');
let runSeq = require('run-sequence');
let zip = require('gulp-zip');

let gconfig = require('./gconfig');

gulp.task('create-xpi', function() {
    let version = gconfig.metainfoVersion;
    return gulp.src('dist/nonpack/*')
        .pipe(zip(`user_agent_overrider-${version}.xpi`))
        .pipe(gulp.dest('dist/xpi/'));
});

gulp.task('product', function(callback) {
    runSeq('create-xpi', callback);
});
