const test = require('tape')
const got = require('got')
const chalk = require('chalk')
const execa = require('execa')
const getPort = require('get-port')
const stream = require('stream')
const out = new stream.Writable()

out._write = () => {}

const noopDeps = {
  out,
  open () {}
}
const noopDefiners = {
  parameter () {},
  option () {}
}

test('index.js - options and parameters', function (t) {
  t.plan(10)

  const parameters = {}
  const options = {}

  require('./index')(noopDeps)({
    parameter (name, args) {
      parameters[name] = args
    },
    option (name, args) {
      options[name] = args
    }
  })

  t.ok(parameters.directory)

  t.equal(parameters.directory.default.value, '.')

  t.ok(options.port)

  t.equal(options.port.default.value, false)

  t.equal(options.port.type, Number)

  t.ok(options.open)

  t.equal(options.open.type.name, 'Browser')

  t.ok(options.default)

  t.equal(options.default.default.value, 404)

  t.equal(options.default.type, Number)
})

test('index.js - good response', function (t) {
  t.plan(3)

  getPort().then(async function (port) {
    const app = await require('./index')(noopDeps)(noopDefiners)({port, directory: './fixtures/', default: 404})

    try {
      const response = await got(`http://localhost:${port}/`)

      t.equal(200, response.statusCode)

      t.equal('text/html; charset=utf-8', response.headers['content-type'].toLowerCase())

      t.equal('<h1>index</h1>\n', response.body)
    } catch (e) {
      t.error(e)
    }

    app.close()
  })
})

test('index.js - default response', function (t) {
  t.plan(3)

  getPort().then(async function (port) {
    const app = await require('./index')(noopDeps)(noopDefiners)({port, directory: './fixtures/', default: 404})

    try {
      await got(`http://localhost:${port}/does-not-exist.html`, {
        headers: {
          accept: 'text/html,*,*'
        }
      })
    } catch (e) {
      t.equal(404, e.response.statusCode)

      t.equal('text/html; charset=utf-8', e.response.headers['content-type'].toLowerCase())

      t.equal('<h1>404</h1>\n', e.response.body)
    }

    app.close()
  })
})

test('index.js - default does not exist', function (t) {
  t.plan(3)

  getPort().then(async function (port) {
    const app = await require('./index')(noopDeps)(noopDefiners)({port, directory: './fixtures/', default: 400})

    try {
      await got(`http://localhost:${port}/does-not-exist.html`, {
        headers: {
          accept: 'text/html,*,*'
        }
      })
    } catch (e) {
      t.equal(400, e.response.statusCode)

      t.equal('text/html; charset=utf-8', e.response.headers['content-type'].toLowerCase())

      t.equal('', e.response.body)
    }

    app.close()
  })
})

test('index.js - default no html', function (t) {
  t.plan(3)

  getPort().then(async function (port) {
    const app = await require('./index')(noopDeps)(noopDefiners)({port, directory: './fixtures/', default: 404})

    try {
      await got(`http://localhost:${port}/does-not-exist.html`, {
        headers: {
          accept: 'application/json,*/*'
        }
      })
    } catch (e) {
      t.equal(404, e.response.statusCode)

      t.equal('text/plain; charset=utf-8', e.response.headers['content-type'].toLowerCase())

      t.equal('', e.response.body)
    }

    app.close()
  })
})

test('index.js - get port', async function (t) {
  t.plan(1)

  const app = await require('./index')(noopDeps)(noopDefiners)({port: false, directory: './fixtures/', default: 404})

  process.nextTick(async function () {
    try {
      const response = await got(`http://localhost:${app.address().port}/`)

      t.equal('<h1>index</h1>\n', response.body)
    } catch (e) {
      t.error(e)
    }

    app.close()
  })
})

test('index.js - open in browser', async function (t) {
  t.plan(2)

  getPort().then(async function (port) {
    const app = await require('./index')({
      out,
      open (url) {
        t.equal(url, `http://localhost:${port}`)
      }
    })(noopDefiners)({port, directory: './fixtures/', default: 404, open: true})

    try {
      const response = await got(`http://localhost:${port}/`)

      t.equal('<h1>index</h1>\n', response.body)
    } catch (e) {
      t.error(e)
    }

    app.close()
  })
})

test('index.js - output', async function (t) {
  t.plan(1)

  const out = new stream.Writable()
  const output = []

  out._write = function (line, encoding, done) {
    output.push(line.toString('utf8'))

    done()
  }

  getPort().then(async function (port) {
    const app = await require('./index')({
      out,
      open () {}
    })(noopDefiners)({port, directory: './fixtures/', default: 404})

    try {
      await got(`http://localhost:${app.address().port}/`)
    } catch (e) {
      t.error(e)
    }

    app.close()

    t.deepEqual(output, [
      `${chalk.green('\u276F')} server is listening at port ${port}\n`,
      `${chalk.green('\u276F')} GET / ${chalk.gray('200')}\n`
    ])
  })
})

test('cli.js', async function (t) {
  t.plan(4)

  try {
    await execa('node', ['./cli.js', '-h'])
  } catch (e) {
    t.ok(e)

    t.equal(e.stderr.includes('Usage'), true)

    t.equal(e.stderr.includes('Options'), true)

    t.equal(e.stderr.includes('Parameters'), true)
  }
})
