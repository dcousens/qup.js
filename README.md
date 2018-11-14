# qup

[![build status](https://secure.travis-ci.org/dcousens/qup.png)](http://travis-ci.org/dcousens/qup)
[![Version](http://img.shields.io/npm/v/qup.svg)](https://www.npmjs.org/package/qup)

Runs as synchronously as possible,  but is stack-blowout aware (maximum call stack depth of `1000`).

## Examples

``` javascript
let qup = require('qup/batch')
let q = qup((batch, callback) => {
	console.log(batch)
	// => in order, [1], [2], [3], [4, 5, 6, 7], [8]

	setTimeout(callback)
}, 3, 4) // at most 3 concurrent, in batches of 4

q.push(1)
q.push(2)
q.push(3)
q.push(4)
q.push(5)
q.push(6)
q.push(7)
q.push(8)
```

Serial
``` javascript
let qup = require('qup')
let q = qup((x, callback) => {
	console.log(x)
	// => in order, 1, 2, 3, 4, 5, 6, 7, 8

	setTimeout(callback)
}, 3)

q.push(1)
q.push(2)
q.push(3)
q.push(4)
q.push(5)
q.push(6)
q.push(7)
q.push(8)
```


## License [MIT](LICENSE)
