function Qup (f, concurrent, batch) {
  this.q = []
  this.f = f
  this.batch = batch || 1
  this.concurrent = concurrent || 1
  this.dead = false
  this.running = 0
}

Qup.prototype._runBatch = function qupRunBatch (depth) {
  if (this.running >= this.concurrent) return
  if (!this.q.length) return
  depth = depth | 0

  var ps = []
  var callbacks = []

  for (var i = 0; i < this.batch; ++i) {
    var qi = this.q[i]
    if (!qi) break

    ps.push(qi.p)
    if (qi.callback) callbacks.push(qi.callback)
  }

  this.q = this.q.slice(this.batch)

  this.running += 1
  this.f(ps, (err) => {
    this.running -= 1
    if (this.dead) return

    callbacks.forEach(callback => callback(err))
    if (depth > 1000) setTimeout(() => this._runBatch())
    else this._runBatch(depth + 1)
  })
}

Qup.prototype.push = function qupPush (p, callback) {
  this.q.push({ p, callback })

  if (this.running < this.concurrent) return this._runBatch()
}

Qup.prototype.clear = function qupClear () {
  this.q = []
}

Qup.prototype.kill = function qupPause () {
  this.clear()
  this.dead = true
}

module.exports = function qup (f, concurrent, batch) {
  return new Qup(f, concurrent, batch)
}
