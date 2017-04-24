'use strict';

let commander = require('commander');

commander
    .option('-p, --profile-folder <value>', 'develop with with a specified profile folder')
    .option('-v, --metainfo-version <value>', 'make with specified release version')
    .option('-u, --metainfo-unpack <value>', 'mark xpi file need to unpack when install')
    .parse(process.argv);
