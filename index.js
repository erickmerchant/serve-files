const express = require('express')
const morgan = require('morgan')
const compression = require('compression')
const getPort = require('get-port')
const opn = require('opn')
const chalk = require('chalk')
const path = require('path')

module.exports = function (args) {
  let port

  if (!args.port) {
    port = getPort()
  } else {
    port = Promise.resolve(Number(args.port))
  }

  const app = express()

  app.use(morgan(chalk.green('\u276F') + ' :method :url ' + chalk.gray(':status')))

  app.use(compression())

  app.use(express.static(args.directory))

  app.use(function (req, res) {
    res.status(args.default)

    if (req.accepts(['text/plain', 'text/html']) === 'text/html') {
      res.sendFile(path.resolve(args.directory, args.default + '.html'), {}, function (err) {
        if (err) {
          res.type('text/html').send('')
        }
      })
    } else {
      res.type('text/plain').send('')
    }
  })

  port.then(function (port) {
    app.listen(port, function () {
      console.log(chalk.green('\u276F') + ' server is listening at port %s', port)

      if (args.open) {
        opn(`http://localhost:${port}`)
      }
    })
  })
}
