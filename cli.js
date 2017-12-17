#!/usr/bin/env node
const command = require('sergeant')
const serve = require('./index')
const opener = require('opn')
const out = process.stdout

command('serve-files', serve({opener, out}))(process.argv.slice(2))
