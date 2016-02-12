'use strict';

let _ = require('lodash');
let fetch = require('node-fetch');
let fs = require('fs');
let gulp = require('gulp');
let gutil = require('gulp-util');

let gconfig = require('./gconfig');
let packageJSON = require('../package.json');

let project = packageJSON.name;
let apiUrl = (p) => `http://www.transifex.com/api/2/project/${project}${p}`;
let isIgnored = (l) => _.includes(['en-US', 'zh-CN', 'zh-TW'], l);

gulp.task('pull-i18n', function() {
    if (gconfig.transifexUser === undefined) {
        throw 'use `-t username:password` to indicate your Transifex account';
    }

    let authorization = new Buffer(gconfig.transifexUser).toString('base64');
    let headers = {Authorization: `Basic ${authorization}`};
    let params = {headers};

    let getLangDetail = (lang) => {
        let url = apiUrl(`/language/${lang}/?details`);
        return fetch(url, params)
            .then((resp) => resp.json())
            .then((json) => {
                return {lang: lang, detail: json};
            });
    };

    let getLangs = () => {
        let url = apiUrl('/languages');
        return fetch(url, params)
            .then((resp) => resp.json())
            .then((json) => json.map((item) => item.language_code))
            .then((langs) => Promise.all(langs.map(getLangDetail)));
    };

    let filterHasTraned = (items) => {
        return items.filter((item) => item.detail.translated_segments > 0)
             .filter((item) => !isIgnored(item.lang))
             .map((item) => item.lang)
             .sort();
    };

    let downloadTranFile = (lang, resName) => {
        let resSlug = resName.replace('.', '');
        let url = apiUrl(`/resource/${resSlug}/translation/${lang}/?mode=default&file`);
        return fetch(url, params)
            .then((resp) => resp.text())
            .then((text) => {
                let dir = `src/locale/${lang}/`;
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                    gutil.log(`Creating folder: ${lang}`);
                }
                let file = `${dir}/${resName}`;
                fs.writeFileSync(file, text);
            });
    };

    let downloadTrans = (langs) => {
        let promises = [];
        for (let lang of langs) {
            promises.push(downloadTranFile(lang, 'global.dtd'));
            promises.push(downloadTranFile(lang, 'global.properties'));
        }
        return Promise.all(promises)
            .then(() => langs);
    };

    return getLangs()
        .then(filterHasTraned)
        .then(downloadTrans);
});
