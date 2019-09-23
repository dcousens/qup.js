const test = require('tape')
const qup = require('../batch')

test('runs in batches, with N concurrent', (t) => {
  t.plan(25)

  let accum = 0

  function addBatch (xs, callback) {
    t.ok(xs.length <= 2)

    setTimeout(() => {
      xs.forEach(x => (accum += x))
      callback()
    })
  }

  const su = qup(addBatch, 2, 2)

  su.push(2)
  t.equal(su.running, 1) // waiting for setTimeout
  t.equal(su.q.length, 0) // empty queue

  su.push(3)
  t.equal(su.running, 2) // waiting for setTimeout
  t.equal(su.q.length, 0) // empty queue

  su.push(60)
  su.push(70, () => {
    t.equal(accum, 135)
    t.equal(su.running, 1) // [3] is yet to callback
    t.same(su.q.map(x => x.p), [100])
  })
  // ^ after [2]

  su.push(80)
  su.push(90, () => {
    t.equal(accum, 305)
    t.equal(su.running, 1) // [60, 70] is yet to callback
    t.same(su.q, [])

    su.push(200, () => {
      t.equal(accum, 605)
      t.equal(su.running, 0)
      t.same(su.q, [])
    })
    // ^ after [100], as it already started
  })
  // ^ after [3]

  su.push(100, () => {
    t.equal(accum, 405)
    t.equal(su.running, 1) // [200] is waiting
    t.same(su.q, [])
  })
  // ^ after [60, 70]

  t.equal(accum, 0) // nothing was added
  t.equal(su.running, 2) // [2], [3] are waiting for setTimeout
  t.same(su.q.map(x => x.p), [60, 70, 80, 90, 100])
})

test('README example as expected', (t) => {
  t.plan(5)

  const expected = [[1], [2], [3], [4, 5, 6, 7], [8]]
  const q = qup((batch, callback) => {
    t.same(batch, expected[0])
    expected.shift()

    // => in order, [1], [2], [3], [4, 5, 6, 7], then [8]
    setTimeout(callback)
  }, 3, 4)

  q.push(1)
  q.push(2)
  q.push(3)
  q.push(4)
  q.push(5)
  q.push(6)
  q.push(7)
  q.push(8)
})

test('batch doesn\'t blow the stack', (t) => {
  const q = qup((xs, callback) => {
    let timeout = false
    xs.forEach((x) => {
      if (x === 0) timeout = true
      if (x === 1e5 - 1) t.end()
    })
    if (timeout) return setTimeout(callback)

    callback()
  }, 1, 2)

  q.push(0)
  for (let i = 1; i < 1e5; ++i) q.push(i)
})
