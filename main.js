#!/usr/bin/env node
const command = require('sergeant')
const express = require('express')
const morgan = require('morgan')
const compression = require('compression')
const chalk = require('chalk')
const path = require('path')

command('serve-files', function ({parameter, option}) {
  parameter('destination', {
    description: 'the directory to serve files from',
    default: '.'
  })

  option('port', {
    description: 'the port to listen at',
    default: 8000,
    type: Number
  })

  option('default', {
    description: 'the default response',
    default: 404,
    type: Number
  })

  return function (args) {
    const app = express()

    app.use(morgan(chalk.gray('\u276F') + ' :method :url :status'))

    app.use(compression())

    app.use(express.static(args.destination))

    app.use(function (req, res) {
      if (req.accepts('html')) {
        res.status(args.default)

        res.sendFile(path.resolve(args.destination, args.default + '.html'), {}, function (err) {
          if (err) {
            blank(res)
          }
        })
      } else {
        blank(res)
      }
    })

    app.listen(args.port, function () {
      console.log(chalk.green('\u2714') + ' server is running at %s', args.port)
    })
  }
})(process.argv.slice(2))

function blank (res) {
  res.status(404)

  res.type('txt').send('')
}
