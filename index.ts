export default function qup<Context = void, ResultType = void> (f: (context: Context) => ResultType | Promise<ResultType>, jobs: number = 1) {
  function signal () {
    let resolve: () => void = () => {}
    let resolved = false
    const promise = new Promise<void>((resolve_) => {
      resolve = () => {
        resolve_()
        resolved = true
      }
    })
    return { promise, resolve, resolved: () => resolved }
  }

  const q: {
    context: Context
    resolve: (result: ResultType) => void
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
    let result: ResultType
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

  function push (context: Context) {
    if (drain_.resolved()) drain_ = signal()
    return new Promise<ResultType>((resolve, reject) => {
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
