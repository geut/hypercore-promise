const test = require('tape')
const hypercorePromise = require('..')
const hypercore = require('hypercore')
const ram = require('random-access-memory')
const tempy = require('tempy')

test('default hypercore', async function (t) {
  t.plan(4)

  const dir = tempy.directory()

  t.comment(`Creating a feed in: ${dir}`)
  const feed = hypercorePromise(dir, { valueEncoding: 'utf-8' })

  await feed.ready()
  t.ok(Buffer.isBuffer(feed.key), 'Feed is ready and has a key')

  const seq = await feed.append('foo')
  t.equal(await feed.get(seq), 'foo')
  t.equal(await feed.head(), 'foo')

  const msg = await new Promise(resolve => {
    const stream = feed.createReadStream()
    stream.on('data', (msg) => {
      resolve(msg)
    })
  })
  t.equal(msg, 'foo')
})

test('set an external hypercore instance', async function (t) {
  t.plan(1)

  const _feed = hypercore(ram)
  const feed = hypercorePromise(_feed)
  await feed.ready()
  t.equal(_feed._storage, feed._storage)
})

test.only('cache methods', async function (t) {
  t.plan(1)

  const feed = hypercorePromise(ram)
  t.equal(feed.ready, feed.ready, 'Should get the same function')
})
