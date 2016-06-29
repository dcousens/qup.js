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
  t.plan(20)

  var accum = 0

  function addBatch (xs, callback) {
    t.ok(xs.length <= 2)

    xs.forEach(x => (accum += x))
    setTimeout(callback)
  }

  var su = qup(addBatch, 2, 2)

  su.push(2)
  t.equal(accum, 2) // 2 was added
  t.equal(su.running, 1) // add is now waiting on setTimeout
  t.equal(su.q.length, 0) // nothing is left in the queue

  su.push(3)
  t.equal(accum, 5) // 3 was added
  t.equal(su.running, 2) // two add's are now waiting on setTimeout
  t.equal(su.q.length, 0) // still, nothing is left in the queue

  su.push(60)
  su.push(70)
  su.push(80, () => {
    t.equal(accum, 345) // [100, 90], [80, 70] was added in 2 concurrent batches, 60 is still waiting
    t.equal(su.running, 0) // nothing is waiting
    t.equal(su.q.length, 1) // 60 is in the queue waiting
  })

  su.push(90)
  su.push(100, () => {
    t.equal(accum, 345) // [100, 90], [80, 70] was added in 2 concurrent batches, 60 is still waiting
    t.equal(su.running, 1) // [80, 70] is waiting to callback
    t.equal(su.q.length, 1) // 60 is in the queue waiting
  })

  t.equal(accum, 5) // nothing was added
  t.equal(su.running, 2) // two add's are still waiting on setTimeout
  t.equal(su.q.length, 5) // 60 and 70 are now in the queue
})
