'use strict';

let fs = require('fs');
let gulp = require('gulp');
let lazypipe = require('lazypipe');
let nunjucks = require('gulp-nunjucks');
let propertiesReader = require('properties-reader');
let rename = require('gulp-rename');

let gconfig = require('./gconfig');
let packageJSON = require('../package.json');

let idname = packageJSON.name.replace(/_/g, '');

let tasks = [

    {
        name: 'copy',
        files: [
            'src/**/*',
            '!src/**/*.nj',
            '!src/_includes/',
            '!src/_includes/**/*',
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
            'src/install.rdf.nj',
        ],
        base: 'src',
        pipes: function() {
            let defaultPath = 'src/locale/en-US/global.properties';
            let defaultProp = propertiesReader(defaultPath);
            let defauleLocaleName = defaultProp.get('extensionName');
            let defauleLocaleDesc = defaultProp.get('extensionDesc');

            let langs = fs.readdirSync('src/locale');
            let locales = [];
            for (let lang of langs) {
                if (lang === 'en-US') {
                    continue;
                }

                let path = `src/locale/${lang}/global.properties`;
                let prop = propertiesReader(path);
                let name = prop.get('extensionName');
                let desc = prop.get('extensionDescription');
                let locale = {
                    lang: lang,
                    name: name || defauleLocaleName,
                    desc: desc || defauleLocaleDesc,
                };
                locales.push(locale);
            }

            let nunjucksData = {
                version: gconfig.metainfoVersion,
                unpack: gconfig.metainfoUnpack,
                locales: locales,
            };

            let pipes = lazypipe()
                .pipe(nunjucks.compile, nunjucksData)
                .pipe(rename, {extname: ''})
                .pipe(gulp.dest, 'dist/nonpack/');
            return pipes();
        },
    },

    {
        name: 'manifest',
        files: [
            'src/chrome.manifest.nj',
        ],
        base: 'src',
        pipes: function() {
            let langs = fs.readdirSync('src/locale');
            let pipes = lazypipe()
                .pipe(nunjucks.compile, {idname, langs})
                .pipe(rename, {extname: ''})
                .pipe(gulp.dest, 'dist/nonpack/');
            return pipes();
        },
    },

    {
        name: 'script',
        files: [
            'src/**/*.js.nj',
        ],
        base: 'src',
        entirety: true,
        pipes: function() {
            let pipes = lazypipe()
                .pipe(nunjucks.compile)
                .pipe(rename, {extname: ''})
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
