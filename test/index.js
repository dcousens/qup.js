var test = require('tape')
var qup = require('../')

test('runs, with N concurrent', (t) => {
  t.plan(12)

  var accum = 0

  function add (x, callback) {
    accum += x
    setTimeout(callback)
  }

  var su = qup(add, 2)

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

test('runs in batches, with N concurrent', (t) => {
  t.plan(25)

  var accum = 0

  function addBatch (xs, callback) {
    t.ok(xs.length <= 2)

    setTimeout(() => {
      xs.forEach(x => (accum += x))
      callback()
    })
  }

  var su = qup(addBatch, 2, 2)

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

  let expected = [[1], [2], [3], [4, 5, 6], [7, 8]]
  let q = qup((batch, callback) => {
    t.same(batch, expected[0])
    expected.shift()

    // => in order, [1], [2], [3], [4, 5, 6], [7, 8]
    setTimeout(callback)
  }, 3, 3)

  q.push(1)
  q.push(2)
  q.push(3)
  q.push(4)
  q.push(5)
  q.push(6)
  q.push(7)
  q.push(8)
})

test('doesn\'t blow the stack', (t) => {
  let q = qup((x, callback) => {
    if (x === 0) return setTimeout(callback)
    if (x === 1e5 - 1) t.end()

    callback()
  }, 1)

  q.push(0)
  for (var i = 1; i < 1e5; ++i) q.push(i)
})

test('clear works as expected', (t) => {
  t.plan(6)
  let expected = [1, 4, 5]

  let q = qup((x, callback) => {
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
