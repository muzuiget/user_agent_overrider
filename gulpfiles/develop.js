'use strict';

let gulp = require('gulp');
let gutil = require('gulp-util');
let gulpProcess = require('gulp-process');

let gconfig = require('./gconfig');
let commonTasks = require('./common').tasks;

gulp.task('watch', function() {
    let onChange = function(task, event) {
        let files = task.entirety ? task.files : event.path;
        gulp.src(files, {base: task.base})
            .pipe(task.pipes())
            .on('error', (error) => {
                gutil.log(error.message);
            });
    };
    commonTasks.forEach(function(task) {
        gulp.watch(task.files).on('change', (e) => onChange(task, e));
    });
});

gulp.task('process', function(callback) {
    let folder = gconfig.profileFolder;
    if (!folder) {
        callback();
        return;
    }
    gutil.log(`Launching Firefix with profile ${folder}`);
    let args = ['--no-remote', '-profile', folder];
    gulpProcess.start('firefoxProcess', 'firefox', args);
});

gulp.task('livereload', function() {
    let files = [
        'dist/**/*',
    ];
    gulp.watch(files).on('change', () => {
        gulpProcess.restart('firefoxProcess');
    });
});
