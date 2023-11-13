import { test } from 'node:test'
import t from 'node:assert'
import qup from '../index.js'

const tests = []

test('minimal', async () => {
  const fsquare = qup((x) => {
    return x * x
  })

  t.equal(await fsquare.push(2), 4)
  t.equal(await fsquare.push(4), 16)

  const squares = [2, 4, 8].map(x => fsquare.push(x))
  t.deepEqual(await Promise.all(squares), [4, 16, 64])
})

test('not synchronous', async () => {
  let value = 0
  const fset = qup((x) => {
    value = x
    return value
  }, 1)

  t.equal(value, 0)
  const fa = fset.push(1)
  t.equal(value, 1)
  t.equal(await fa, 1)

  const fb = fset.push(2)
  t.equal(value, 2)
  const fc = fset.push(3)
  t.equal(value, 2) // jobs = 1, wait...
  t.equal(await fb, 2)
  t.equal(value, 3)
  t.equal(await fc, 3)
})

function sleep (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

test('asynchronous', async () => {
  let value = 0
  const fset = qup(async (x) => {
    await sleep(10)
    value = x
    return value
  }, 1)

  t.equal(value, 0)
  const fa = fset.push(1)
  t.equal(value, 0) // sleeping...
  t.equal(await fa, 1)

  const fb = fset.push(2)
  t.equal(value, 1) // sleeping
  const fc = fset.push(3)
  t.equal(value, 1) // sleeping
  t.equal(await fb, 2)
  t.equal(value, 2) // sleeping, jobs = 1
  t.equal(await fc, 3)
})

test('drainable', async () => {
  let value = 0
  const fset = qup(async (x) => {
    await sleep(1)
    value = x
  }, 1)

  for (let i = 0; i < 100; ++i) {
    fset.push(i)
  }

  t.equal(value, 0)
  await fset.drain()
  t.equal(value, 99)
})

test('jobs > 1', async () => {
  let value = 0
  const finc = qup(async () => {
    await sleep(1)
    value += 1
    return value
  }, 5)

  for (let i = 0; i < 5; ++i) finc.push()
  t.equal(value, 0)
  t.equal(await finc.push(), 6)
  for (let i = 0; i < 10; ++i) finc.push()
  t.equal(value, 6)
  await sleep(1) // wait ~5
  t.equal(value, 11)
  await sleep(1) // wait ~5
  t.equal(value, 16)
})

function near (x, value, error = 0.1) {
  const d = value * error
  if (Math.abs(x - value) < d) return value
  return x
}

test('job queue', async () => {
  const ff = qup(async (f) => {
    return await f()
  }, 100)

  const before = Date.now()
  t.deepEqual(await Promise.all([
    ff.push(() => 1),
    ff.push(async () => {
      await sleep(100)
      return 3
    }),
    ff.push(async () => {
      await sleep(200)
      return 7
    }),
    ff.push(async () => {
      await sleep(200)
      return 99
    }),
    ff.push(async () => {
      await sleep(100)
      return 155
    }),
  ]), [
    1,
    3,
    7,
    99,
    155
  ])

  const after = Date.now()
  t.equal(near(after - before, 200, 0.1), 200)
})
