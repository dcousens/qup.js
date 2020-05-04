const test = require('tape')
const qup = require('../')

test('runs, with N concurrent', (t) => {
  t.plan(12)

  let accum = 0

  function add (x, callback) {
    accum += x
    setTimeout(callback)
  }

  const su = qup(add, 2)

  su.push(2)
  t.equal(accum, 2) // 2 was added
  t.equal(su.running, 1) // add is now waiting on setTimeout
  t.equal(su.q.length, 0) // nothing is left in the queue

  su.push(3)
  t.equal(accum, 5) // 3 was added
  t.equal(su.running, 2) // two add's are now waiting on setTimeout
  t.equal(su.q.length, 0) // still, nothing is left in the queue

  su.push(60, () => {
    t.equal(accum, 65) // 60 was added
    t.equal(su.running, 0) // nothing is running during a callback
    t.equal(su.q.length, 0) // nothing is left in the queue
  })

  t.equal(accum, 5) // nothing was added
  t.equal(su.running, 2) // two add's are still waiting on setTimeout
  t.equal(su.q.length, 1) // 60 is now in the queue
})

test('README example as expected', (t) => {
  t.plan(8)

  const expected = [1, 2, 3, 4, 5, 6, 7, 8]
  const q = qup((x, callback) => {
    t.same(x, expected[0])
    expected.shift()

    // => in order, 1, 2, 3, 4, 5, 6, 7, then 8
    setTimeout(callback)
  }, 3)

  q.push(1)
  q.push(2)
  q.push(3)
  q.push(4)
  q.push(5)
  q.push(6)
  q.push(7)
  q.push(8)
})

test('push, with return value expected (non-batch only)', (t) => {
  const a = 9
  const su = qup((x, callback) => {
    callback(null, a + x)
  })

  t.plan(2)
  su.push(6, (err, y) => {
    t.ifErr(err)
    t.equal(y, 15)
  })
})

test('doesn\'t blow the stack', (t) => {
  const q = qup((x, callback) => {
    if (x === 0) return setTimeout(callback)
    if (x === 1e5 - 1) t.end()

    callback()
  }, 1)

  q.push(0)
  for (let i = 1; i < 1e5; ++i) q.push(i)
})

test('clear, empties the queue', (t) => {
  t.plan(6)
  const expected = [1, 4, 5]

  const q = qup((x, callback) => {
    t.equal(x, expected[0])
    expected.shift()

    setTimeout(callback)
  }, 1)

  q.push(1)
  q.push(2)
  q.push(3)

  t.equal(q.q.length, 2)
  q.clear()
  t.equal(q.q.length, 0)

  q.push(4)
  q.push(5)
  t.equal(q.q.length, 2)
})

test('kill, empties the queue and ignores running', (t) => {
  t.plan(5)

  let i = null
  const q = qup((x, callback) => {
    i = x
    setTimeout(callback)
  }, 1)

  q.push(1, () => {
    t.equal(i, 1)

    // delay, 2 will start, but never callback
    setTimeout(() => {
      q.kill()
      t.equal(q.q.length, 0)
    })
  })

  // NOTE: these will never happend
  q.push(2, () => t.fail()) // will set i = 2, but not fail
  q.push(3, () => t.fail())
  q.push(4, () => t.fail())
  t.equal(q.q.length, 3)

  setTimeout(() => {
    t.equal(i, 2)
    t.equal(q.q.length, 0)
  }, 100)
})
