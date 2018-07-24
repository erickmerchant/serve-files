#!/usr/bin/env node

const command = require('sergeant')
const serve = require('./index')
const open = require('opn')
const out = process.stdout

command('serve-files', ({option, parameter}) => {
  parameter('directory', {
    description: 'the directory to serve files from',
    type (val = '.') {
      return val
    }
  })

  option('port', {
    description: 'the port to listen at',
    required: true,
    type (val = 0) {
      return Number(val)
    }
  })

  option('open', {
    description: 'open it'
  })

  option('200', {
    description: 'serve a 200.html file by default'
  })

  return (args) => serve({open, out})(args)
})(process.argv.slice(2))
