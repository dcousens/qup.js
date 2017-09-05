function Qup (f, concurrent) {
  this.q = []
  this.f = f
  this.concurrent = concurrent || 1
  this.dead = false
  this.running = 0
}

Qup.prototype._run = function qupRun (depth) {
  if (this.running >= this.concurrent) return
  if (!this.q.length) return
  depth = depth | 0

  var { p, callback } = this.q.shift()

  this.running += 1
  this.f(p, (err, result) => {
    this.running -= 1
    if (this.dead) return

    if (callback) callback(err, result)
    if (depth > 1000) setTimeout(() => this._run())
    else this._run(depth + 1)
  })
}

Qup.prototype.push = function qupPush (p, callback) {
  this.q.push({ p, callback })

  if (this.running < this.concurrent) return this._run()
}

Qup.prototype.clear = function qupClear () {
  this.q = []
}

Qup.prototype.kill = function qupPause () {
  this.clear()
  this.dead = true
}

module.exports = function qup (f, concurrent, __batch) {
  // use qup/batch
  if (__batch !== undefined) throw new TypeError('for 2.0.0, use "qup/batch"')
  return new Qup(f, concurrent)
}
