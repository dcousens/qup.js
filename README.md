# qup
[![Version](http://img.shields.io/npm/v/qup.svg)](https://www.npmjs.org/package/qup)

Javascript `async/await` stack-based concurrent queue.

## Examples

``` javascript
const q = qup(async (...parameters) => {
	return await fetch(...parameters)
}, 2) // at most 2 concurrent

await q.push({ ... })
await q.push({ ... })

q.push({ ... })
q.push({ ... })
q.push({ ... })

await q.drain()
```

## License [MIT](LICENSE)
