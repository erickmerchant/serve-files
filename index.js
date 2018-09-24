const polka = require('polka')
const morgan = require('morgan')
const compression = require('compression')
const serve = require('serve-static')
const chalk = require('chalk')
const path = require('path')
const assert = require('assert')
const error = require('sergeant/error')
const fs = require('fs')
const promisify = require('util').promisify

const readFile = promisify(fs.readFile)

module.exports = (deps) => {
  assert.ok(deps.out)

  assert.strictEqual(typeof deps.out.write, 'function')

  assert.strictEqual(typeof deps.open, 'function')

  return async (args) => {
    let status
    let file

    if (args['200']) {
      status = 200
      file = '200.html'
    } else {
      status = 404
      file = '404.html'
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

    app.use(serve(args.directory))

    app.use(async (req, res, next) => {
      try {
        let fileContent = await readFile(path.resolve(args.directory, file), 'utf-8')

        res.writeHead(status, { 'content-type': 'text/html; charset=utf-8' })

        res.end(fileContent)
      } catch (err) {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })

        res.end('')
      }
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
