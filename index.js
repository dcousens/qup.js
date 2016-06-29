function Qup (f, concurrent, batch) {
  this.q = []
  this.f = f
  this.concurrent = concurrent
  this.running = 0
  this.batch = batch || null
}

Qup.prototype._run = function qupRun () {
  if (this.running >= this.concurrent) return
  if (!this.q.length) return

  var { p, callback } = this.q.pop()

  this.running += 1
  this.f(p, (err) => {
    this.running -= 1

    setTimeout(() => this._run())
    if (callback) callback(err)
  })
}

Qup.prototype._runBatch = function qupRunBatch () {
  if (this.running >= this.concurrent) return
  if (!this.q.length) return

  var ps = []
  var callbacks = []

  for (var i = 0; i < Math.min(this.batch, this.q.length); ++i) {
    var { p, callback } = this.q.pop()

    ps.push(p)
    if (callback) callbacks.push(callback)
  }

  this.running += 1
  this.f(ps, (err) => {
    this.running -= 1

    setTimeout(() => this._runBatch())
    callbacks.forEach(callback => callback(err))
  })
}

Qup.prototype.push = function qupPush (p, callback) {
  this.q.push({ p, callback })

  if (this.running < this.concurrent) return this.batch === null ? this._run() : this._runBatch()
}

Qup.prototype.pop = function qupPop () {
  return this.q.pop()
}

module.exports = function qup (f, concurrent, batch) {
  return new Qup(f, concurrent, batch)
}
