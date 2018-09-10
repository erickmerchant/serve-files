const express = require('express')
const morgan = require('morgan')
const compression = require('compression')
const chalk = require('chalk')
const path = require('path')
const assert = require('assert')
const error = require('sergeant/error')

module.exports = (deps) => {
  assert.ok(deps.out)

  assert.strictEqual(typeof deps.out.write, 'function')

  assert.strictEqual(typeof deps.open, 'function')

  return (args) => {
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

    app.use((req, res, next) => {
      res.status(status)

      res.sendFile(path.resolve(args.directory, file), {}, (err) => {
        if (err) {
          next(err)
        }
      })
    })

    app.use((err, req, res, next) => {
      res.contentType('text/plain').status(err.status).send('')
    })

    const listener = app.listen(args.port, (err) => {
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
