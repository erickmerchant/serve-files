const express = require('express')
const morgan = require('morgan')
const compression = require('compression')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs')
const promisify = require('util').promisify
const assert = require('assert')
const error = require('sergeant/error')
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)

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

    app.use(async function (req, res, next) {
      switch (req.accepts(['application/json', 'text/html', 'text/plain'])) {
        case 'text/html':
          res.status(status)

          res.sendFile(path.resolve(args.directory, file), {}, function (err) {
            if (err) {
              next(err)
            }
          })
          break
        case 'application/json':
          try {
            res.contentType('application/json')

            const dir = path.resolve(path.join(args.directory, req.path))
            const stats = await stat(dir)

            if (stats.isDirectory()) {
              const list = await readdir(dir)

              res.status(200).send(list.map((item) => path.join(req.path, item)))

              return
            }
          } catch (err) {
            res.status(404).send('')
          }
          break
        default:
          res.contentType('text/plain').status(404).send('')
      }
    })

    app.use(function (err, req, res, next) {
      res.contentType('text/plain').status(err.status).send('')
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
