# qup
[![Version](http://img.shields.io/npm/v/qup.svg)](https://www.npmjs.org/package/qup)

Javascript `async/await` stack-based concurrent queue.

## Examples

``` javascript
const q = qup(async (headers) => {
	return await fetch(..., headers)
}, 2) // at most 2 concurrent

await q.push({ ... })
await q.push({ ... })

q.push({ ... })
q.push({ ... })
q.push({ ... })

await q.drain()
```

## License [MIT](LICENSE)
