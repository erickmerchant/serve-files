const express = require('express')
const morgan = require('morgan')
const compression = require('compression')
const getPort = require('get-port')
const chalk = require('chalk')
const path = require('path')
const assert = require('assert')
const error = require('sergeant/error')

module.exports = function (deps) {
  assert.ok(deps.out)

  assert.equal(typeof deps.out.write, 'function')

  assert.equal(typeof deps.open, 'function')

  return function ({parameter, option}) {
    parameter('directory', {
      description: 'the directory to serve files from',
      type: function (val) {
        if (val == null) {
          return '.'
        }

        return val
      }
    })

    option('port', {
      description: 'the port to listen at',
      type: function number (val) {
        if (val == null) {
          return null
        }

        return Number(val)
      }
    })

    option('open', {
      description: 'open it'
    })

    option('200', {
      description: 'serve the index page for html responses'
    })

    return function (args) {
      let status
      let file
      let port

      if (args['200']) {
        status = 200
        file = 'index.html'
      } else {
        status = 404
        file = '404.html'
      }

      if (!args.port) {
        port = getPort()
      } else {
        port = Promise.resolve(Number(args.port))
      }

      const app = express()

      app.use(morgan(`${chalk.gray('[serve-files]')} :method :url :status`, {
        stream: deps.out
      }))

      app.use(compression())

      app.use(express.static(args.directory))

      app.use(function (req, res) {
        if (req.accepts(['text/plain', 'text/html']) === 'text/html') {
          res.status(status)

          res.sendFile(path.resolve(args.directory, file), {}, function (err) {
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
        return app.listen(port, function (err) {
          if (err) {
            error(err)

            return
          }

          deps.out.write(`${chalk.gray('[serve-files]')} server is listening at port ${port}\n`)

          if (args.open) {
            const options = {}

            deps.open(`http://localhost:${port}`, options).catch(error)
          }
        })
          .on('error', error)
      })
    }
  }
}
