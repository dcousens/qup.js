# qup
[![NPM](https://img.shields.io/npm/v/qup.svg)](https://www.npmjs.org/package/qup)

Javascript `async/await` stack-based concurrent queue.

## Examples

``` javascript
const q = qup(async (x) => {
  return x * x
}, 2) // at most 2 concurrent

await q.push(2)
// => 4

await q.push(4)
// => 16

q.push(3)
// => Promise { <pending> }

await Promise.all([
  q.push(2),
  q.push(4),
  q.push(8)
])
// => [4, 16, 64]

// or
await q.drain()
```

## License [MIT](LICENSE)
