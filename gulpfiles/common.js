'use strict';

let change = require('gulp-change');
let gulp = require('gulp');
let lazypipe = require('lazypipe');

let gconfig = require('./gconfig');

let tasks = [

    {
        name: 'copy',
        files: [
            'src/**/*.css',
            'src/**/*.dtd',
            'src/**/*.manifest',
            'src/**/*.png',
            'src/**/*.properties',
            'src/**/*.xul',
        ],
        base: 'src',
        pipes: function() {
            let pipes = lazypipe()
                .pipe(gulp.dest, 'dist/nonpack/');
            return pipes();
        },
    },

    {
        name: 'metainfo',
        files: [
            'src/install.rdf',
        ],
        base: 'src',
        pipes: function() {
            let pipes = lazypipe()
                .pipe(change, (content) => {
                    return content
                        .replace('${version}', gconfig.metainfoVersion)
                        .replace('${unpack}', gconfig.metainfoUnPack);
                })
                .pipe(gulp.dest, 'dist/nonpack/');
            return pipes();
        },
    },

    {
        name: 'script',
        files: [
            'src/**/*.js',
        ],
        base: 'src',
        entirety: true,
        pipes: function() {
            let pipes = lazypipe()
                .pipe(gulp.dest, 'dist/nonpack/');
            return pipes();
        },
    },

];

tasks.forEach(function(task) {
    gulp.task(task.name, function() {
        return gulp.src(task.files, {base: task.base})
                   .pipe(task.pipes());
    });
});

module.exports = {tasks};
