void function () {
	'use strict'

	const then = Promise.prototype.then

	Promise.prototype.then = function (onFulfilled, onRejected) {
		if (typeof onFulfilled === 'function') Function.asyncThrowIfThis(onFulfilled)
		if (typeof onRejected === 'function') Function.asyncThrowIfThis(onRejected)
		return then.call(this, onFulfilled, onRejected)
	}


	const promiseTry = Promise.try

	if (promiseTry) Promise.try = function (callback) {
		Function.asyncThrowIfThis(callback)
		return promiseTry.call(this, callback)
	}
}()
