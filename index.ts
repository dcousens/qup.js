export default function qup<C = void, T = void> (f: (context: C) => T | Promise<T>, jobs: number = 1) {
  function signal () {
    let resolve: () => void = () => {}
    const promise = new Promise<void>((resolve_) => {
      resolve = resolve_
    })
    return { promise, resolve }
  }

  let q: {
    context: C
    resolve: (result: T) => void
    reject: (err: any) => void
  }[] = []
  let drain_ = signal()
  let running = 0

  async function run () {
    if (running >= jobs) return

    const next = q.shift()
    if (!next) return
    const { context, resolve, reject } = next

    running += 1
    let result: T
    try {
      result = await f(context)
    } catch (e: any) {
      running -= 1
      return reject(e)
    }

    running -= 1
    resolve(result)
    run()

    // ready to drain?
    if (running || q.length) return
    drain_.resolve()
  }

  function push (context: C) {
    drain_ = signal()
    return new Promise<T>((resolve, reject) => {
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
