module.exports = function qup (f, jobs = 1) {
  function signal () {
    let resolve_ = null
    const promise = new Promise((resolve_) => {
      resolve = resolve_
    })
    return { promise, resolve }
  }

  let q = []
  let drain_ = signal()
  let running = 0

  async function run () {
    if (running >= jobs) return
    if (!q.length) return

    const { context, resolve, reject } = q.shift()

    running += 1
    let result, err
    try {
      result = await f(context)
    } catch (e) {
      err = e
    }

    running -= 1
    if (err) return reject(err)
    resolve(result)
    run()

    // ready to drain?
    if (running || q.length) return
    drain_.resolve()
  }

  function push (context) {
    drain_ = signal()
    return new Promise((resolve, reject) => {
      q.push({ context, resolve, reject })
      if (running < jobs) return run()
    })
  }

  function drain () {
    return drain_.promise
  }

  // drained to begin with
  drain_.resolve()
  return {
    push,
    drain
  }
}
