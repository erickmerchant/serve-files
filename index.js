const express = require('express')
const morgan = require('morgan')
const compression = require('compression')
const chalk = require('chalk')
const path = require('path')
const assert = require('assert')
const error = require('sergeant/error')

module.exports = function (deps) {
  assert.ok(deps.out)

  assert.equal(typeof deps.out.write, 'function')

  assert.equal(typeof deps.open, 'function')

  return function (args) {
    let status
    let file

    if (args['200']) {
      status = 200
      file = '200.html'
    } else {
      status = 404
      file = '404.html'
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

    const listener = app.listen(args.port, function (err) {
      const port = listener.address().port

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

    return listener
  }
}
