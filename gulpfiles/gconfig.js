'use strict';

let _ = require('lodash');
let commander = require('commander');
let packageJSON = require('../package.json');

let isBuildTask = _.includes(commander.args, 'build');

let metainfoVersion = packageJSON.version;
if (commander.metainfoVersion) {
    metainfoVersion = commander.metainfoVersion;
}

let gconfig = {
    profileFolder: commander.profileFolder,
    metainfoUnPack: !isBuildTask,
    metainfoVersion: metainfoVersion,
};

module.exports = gconfig;
