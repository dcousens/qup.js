# qup

[![build status](https://secure.travis-ci.org/dcousens/qup.png)](http://travis-ci.org/dcousens/qup)
[![Version](http://img.shields.io/npm/v/qup.svg)](https://www.npmjs.org/package/qup)

Runs as synchronously as possible,  but is stack-blowout aware (maximum call stack depth of `1000`).

## Examples

``` javascript
let q = qup((batch, callback) => {
	console.log(batch)
	// => in order, [1], [2], [3], [4, 5, 6]

	setTimeout(callback)
}, 3, 10)

q.push(1)
q.push(2)
q.push(3)
q.push(4)
q.push(5)
q.push(6)
```


## License [ISC](LICENSE)
