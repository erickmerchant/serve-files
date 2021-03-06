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
  async open () { return null }
}

test('index.js - good response', async (t) => {
  t.plan(4)

  const port = await getPort()

  require('./index')(noopDeps)({ port, directory: './fixtures/' }, async (err, app) => {
    t.error(err)

    try {
      const response = await got(`http://localhost:${port}/`)

      t.equal(200, response.statusCode)

      t.equal('text/html', response.headers['content-type'].toLowerCase())

      t.equal('<h1>index</h1>\n', response.body)
    } catch (e) {
      t.error(e)
    }

    app.server.close()
  })
})

test('index.js - default response', async (t) => {
  t.plan(4)

  const port = await getPort()

  require('./index')(noopDeps)({ port, directory: './fixtures/' }, async (err, app) => {
    t.error(err)

    try {
      await got(`http://localhost:${port}/does-not-exist.html`, {
        headers: {
          accept: 'text/html,*,*'
        }
      })
    } catch (e) {
      t.equal(404, e.response.statusCode)

      t.equal('text/html', e.response.headers['content-type'].toLowerCase())

      t.equal('<h1>404</h1>\n', e.response.body)
    }

    app.server.close()
  })
})

test('index.js - default 200', async (t) => {
  t.plan(4)

  const port = await getPort()

  require('./index')(noopDeps)({ port, directory: './fixtures/', '200': true }, async (err, app) => {
    t.error(err)

    const response = await got(`http://localhost:${port}/does-not-exist.html`, {
      headers: {
        accept: 'text/html,*,*'
      }
    })

    t.equal(200, response.statusCode)

    t.equal('text/html', response.headers['content-type'].toLowerCase())

    t.equal('<h1>200</h1>\n', response.body)

    app.server.close()
  })
})

test('index.js - open in browser', async (t) => {
  t.plan(3)

  const port = await getPort()

  require('./index')({
    out,
    async open (url) {
      t.equal(url, `http://localhost:${port}`)

      return null
    }
  })({ port, directory: './fixtures/', open: true }, async (err, app) => {
    t.error(err)

    try {
      const response = await got(`http://localhost:${port}/`)

      t.equal('<h1>index</h1>\n', response.body)
    } catch (e) {
      t.error(e)
    }

    app.server.close()
  })
})

test('index.js - output', async (t) => {
  t.plan(2)

  const out = new stream.Writable()
  const output = []

  out._write = (line, encoding, done) => {
    output.push(line.toString('utf8'))

    done()
  }

  const port = await getPort()

  require('./index')({
    out,
    async open () { return null }
  })({ port, directory: './fixtures/' }, async (err, app) => {
    t.error(err)

    try {
      await got(`http://localhost:${port}/`)
    } catch (e) {
      t.error(e)
    }

    app.server.close(() => {
      t.deepEqual(output, [
        `${chalk.gray('[serve-files]')} server is listening at port ${port}\n`,
        `${chalk.gray('[serve-files]')} GET / 200\n`
      ])
    })
  })
})

test('cli.js', async (t) => {
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
