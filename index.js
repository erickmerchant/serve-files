const polka = require('polka')
const morgan = require('morgan')
const compression = require('compression')
const sirv = require('sirv')
const chalk = require('chalk')
const path = require('path')
const assert = require('assert')
const error = require('sergeant/error')
const promisify = require('util').promisify
const fs = require('fs')
const access = promisify(fs.access)
const createReadStream = fs.createReadStream

module.exports = (deps) => {
  assert.ok(deps.out)

  assert.strictEqual(typeof deps.out.write, 'function')

  assert.strictEqual(typeof deps.open, 'function')

  return async (args) => {
    let status
    let file
    let exists

    if (args['200']) {
      status = 200
      file = path.resolve(args.directory, '200.html')
    } else {
      status = 404
      file = path.resolve(args.directory, '404.html')
    }

    if (!args.dev) {
      try {
        await access(file, fs.constants.R_OK)

        exists = true
      } catch (err) {
        error(err)

        exists = false
      }
    }

    const app = polka({
      onError (err, req, res) {
        error(err)

        res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })

        res.end('')
      }
    })

    app.use(morgan(`${chalk.gray('[serve-files]')} :method :url :status`, {
      stream: deps.out
    }))

    app.use(compression())

    app.use(sirv(args.directory, {
      etag: true,
      dev: args.dev,
      onNoMatch () {
        console.log(arguments)
      }
    }))

    app.use(async (req, res, next) => {
      try {
        if (exists == null) {
          await access(file, fs.constants.R_OK)
        }

        if (exists == null || exists) {
          res.writeHead(status, { 'content-type': 'text/html' })

          createReadStream(file, 'utf-8').pipe(res)

          return
        }
      } catch (err) {
        error(err)
      }

      res.statusCode = 500

      res.end()
    })

    app.listen(args.port, (err) => {
      if (err) error(err)
      else {
        deps.out.write(`${chalk.gray('[serve-files]')} server is listening at port ${args.port}\n`)

        if (args.open) {
          const options = {}

          deps.open(`http://localhost:${args.port}`, options).catch(error)
        }
      }
    })

    return app
  }
}
