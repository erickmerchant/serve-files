const express = require('express')
const morgan = require('morgan')
const compression = require('compression')
const getPort = require('get-port')
const chalk = require('chalk')
const path = require('path')
const assert = require('assert')

function number (val) {
  return Number(val)
}

module.exports = function (deps) {
  assert.ok(deps.out)

  assert.equal(typeof deps.out.write, 'function')

  assert.equal(typeof deps.open, 'function')

  return function ({parameter, option}) {
    parameter('directory', {
      description: 'the directory to serve files from',
      default: '.'
    })

    option('port', {
      description: 'the port to listen at',
      default: false,
      type: number
    })

    option('open', {
      description: 'open it',
      default: false
    })

    option('default', {
      description: 'the default response status',
      default: 404,
      type: number
    })

    return function (args) {
      let port

      if (!args.port) {
        port = getPort()
      } else {
        port = Promise.resolve(Number(args.port))
      }

      const app = express()

      app.use(morgan(chalk.green('\u276F') + ' :method :url ' + chalk.gray(':status'), {
        stream: deps.out
      }))

      app.use(compression())

      app.use(express.static(args.directory))

      app.use(function (req, res) {
        if (req.accepts(['text/plain', 'text/html']) === 'text/html') {
          res.status(args.default)

          res.sendFile(path.resolve(args.directory, args.default + '.html'), {}, function (err) {
            if (err) {
              res.type('text/html').send('')
            }
          })
        } else {
          res.status(404)

          res.type('text/plain').send('')
        }
      })

      return port.then(function (port) {
        return app.listen(port, function () {
          deps.out.write(`${chalk.green('\u276F')} server is listening at port ${port}\n`)

          if (args.open) {
            const options = {}

            deps.open(`http://localhost:${port}`, options).catch(function () {
              console.error(`${chalk.red('\u2718')} Unable to open`)
            })
          }
        })
      })
    }
  }
}
