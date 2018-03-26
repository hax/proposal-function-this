void function () {
	'use strict'

	const global = new Function('return this')()

	;['setTimeout', 'setInterval', 'setImmediate'].forEach(patch)

	function patch(name) {
		const origin = global[name]
		if (origin) global[name] = function (callback) {
			Function.asyncThrowIfThis(callback)
			return origin.apply(this, arguments)
		}
	}
}()
