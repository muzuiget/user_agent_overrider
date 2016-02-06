'use strict';

let change = require('gulp-change');
let fs = require('fs');
let gulp = require('gulp');
let lazypipe = require('lazypipe');
let nunjucks = require('gulp-nunjucks');

let gconfig = require('./gconfig');
let packageJSON = require('../package.json');

let idname = packageJSON.name.replace(/_/g, '');

let tasks = [

    {
        name: 'copy',
        files: [
            'src/**/*.css',
            'src/**/*.dtd',
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
        name: 'manifest',
        files: [
            'src/chrome.manifest',
        ],
        base: 'src',
        pipes: function() {
            let langs = fs.readdirSync('src/locale');
            let pipes = lazypipe()
                .pipe(nunjucks.compile, {idname, langs})
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
