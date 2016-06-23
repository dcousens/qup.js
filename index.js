function Sue (f, concurrent, batch) {
  this.q = []
  this.f = f
  this.concurrent = concurrent
  this.running = 0
  this.batch = batch || null
}

Sue.prototype._run = function qrun () {
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

Sue.prototype._runBatch = function qrun () {
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

Sue.prototype.push = function qpush (p, callback) {
  this.q.push({ p, callback })

  if (this.running < this.concurrent) return this.batch === null ? this._run() : this._runBatch()
}

Sue.prototype.pop = function qpop () {
  return this.q.pop()
}

module.exports = Sue
