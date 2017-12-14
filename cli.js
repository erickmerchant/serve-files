#!/usr/bin/env node
const command = require('sergeant')
const serve = require('./index')

command('serve-files', function ({parameter, option}) {
  parameter('directory', {
    description: 'the directory to serve files from',
    default: { value: '.' }
  })

  option('port', {
    description: 'the port to listen at',
    default: { text: 'a random port', value: false },
    type: Number
  })

  option('open', {
    description: 'open it',
    type: Boolean
  })

  option('default', {
    description: 'the default response status',
    default: { value: 404 },
    type: Number
  })

  return serve
})(process.argv.slice(2))
