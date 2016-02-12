'use strict';

let _ = require('lodash');
let commander = require('commander');
let packageJSON = require('../package.json');

let isBuildTask = _.includes(commander.args, 'build');

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
    transifexUser: commander.transifexUser,
};

module.exports = gconfig;
