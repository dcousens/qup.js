export default function <C, T> (f: (context: C) => T, jobs?: number): ({
  push: (context: C) => Promise<T>
  drain: () => Promise<void>
})
