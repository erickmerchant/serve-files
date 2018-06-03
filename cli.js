#!/usr/bin/env node

const command = require('sergeant')
const serve = require('./index')
const open = require('opn')
const out = process.stdout

command('serve-files', serve({open, out}))(process.argv.slice(2))
