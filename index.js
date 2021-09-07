module.exports = function qup (f, jobs = 1) {
  let q = []
  let draining = []
  let running = 0

  async function run () {
    if (running >= jobs) return
    if (!q.length) return

    const { parameters, resolve, reject } = q.shift()

    running += 1
    let result, err
    try {
      result = await f(parameters)
    } catch (e) {
      err = e
    }

    running -= 1
    if (err) return reject(err)
    resolve(result)
    run()

    // drained?
    if (running || q.length) return

    for (const resolve of draining) resolve()
    draining = []
  }

  function push (parameters) {
    return new Promise((resolve, reject) => {
      q.push({ parameters, resolve, reject })
      if (running < jobs) return run()
    })
  }

  function drain () {
    if (running === 0) return
    return new Promise((resolve) => draining.push(resolve))
  }

  return {
    push,
    drain
  }
}
