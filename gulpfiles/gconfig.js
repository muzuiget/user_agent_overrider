'use strict';

let commander = require('commander');
let packageJSON = require('../package.json');

let isBuildTask = commander.args.includes('build');

let metainfoVersion = packageJSON.version;
if (commander.metainfoVersion) {
    metainfoVersion = commander.metainfoVersion;
}

let metainfoUnpack = !isBuildTask;
if (commander.metainfoUnpack === 'true') {
    metainfoUnpack = true;
}

let gconfig = {
    profileFolder: commander.profileFolder,
    metainfoVersion: metainfoVersion,
    metainfoUnpack: metainfoUnpack,
};

module.exports = gconfig;
