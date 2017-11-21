#!/usr/bin/env node
const command = require('sergeant')
const express = require('express')
const morgan = require('morgan')
const compression = require('compression')
const getPort = require('get-port')
const opn = require('opn')
const chalk = require('chalk')
const path = require('path')

command('serve-files', function ({parameter, option}) {
  parameter('directory', {
    description: 'the directory to serve files from',
    default: '.'
  })

  option('port', {
    description: 'the port to listen at',
    type: Number
  })

  option('open', {
    description: 'open it',
    type: Boolean
  })

  option('default', {
    description: 'the default response status',
    default: 404,
    type: Number
  })

  return function (args) {
    const app = express()

    app.use(morgan(chalk.green('\u276F') + ' :method :url ' + chalk.gray(':status')))

    app.use(compression())

    app.use(express.static(args.directory))

    app.use(function (req, res) {
      res.status(args.default)

      res.sendFile(path.resolve(args.directory, args.default + '.html'), {}, function (err) {
        if (err) {
          res.type('text/plain').send('')
        }
      })
    })

    const portPromise = args.port != null ? Promise.resolve(args.port) : getPort()

    portPromise.then(function (port) {
      app.listen(port, function () {
        console.log(chalk.green('\u276F') + ' server is listening at port %s', port)

        if (args.open) {
          opn(`http://localhost:${port}`)
        }
      })
    })
  }
})(process.argv.slice(2))
