'use strict';

let commander = require('commander');

commander
    .option('-p, --profile-folder <value>', 'develop with with a specified profile folder')
    .option('-v, --metainfo-version <value>', 'make with specified release version')
    .option('-t, --transifex-user <value>', 'Transifex account, format: username:password')
    .parse(process.argv);
