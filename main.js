#!/usr/bin/env node
const command = require('sergeant')
const express = require('express')
const morgan = require('morgan')
const chalk = require('chalk')
const path = require('path')

command('serve-files', function ({parameter, option}) {
  parameter('destination', {
    description: 'the directory to serve files from',
    required: true
  })

  option('port', {
    description: 'the port to listen at',
    default: 8000,
    type: Number
  })

  return function (args) {
    const app = express()

    app.use(morgan(chalk.green('\u276F') + ' :method :url ' + chalk.gray(':status')))

    app.use(express.static(args.destination))

    app.use(function (req, res) {
      if (req.accepts('html')) {
        res.status(200)

        res.sendFile(path.resolve(args.destination, '200.html'), {}, function (err) {
          if (err) {
            res.status(404)

            res.sendFile(path.resolve(args.destination, '404.html'), {}, function (err) {
              if (err) {
                res.type('txt').send('Not found')
              }
            })
          }
        })
      } else {
        res.status(404)

        res.type('txt').send('Not found')
      }
    })

    app.listen(args.port, function () {
      console.log(chalk.green('\u2714') + ' server is running at %s', chalk.gray(args.port))
    })
  }
})(process.argv.slice(2))
