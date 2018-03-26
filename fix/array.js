void function () {
	'use strict'

	const arrayProto = Array.prototype
	const typedArrayProto = Object.getPrototypeOf(Int8Array.prototype)

	;['forEach', 'map', 'filter', 'some', 'every',
		'find', 'findIndex',
		'flatMap',
	].forEach(function (name) {
		patch(name, arrayProto)
		patch(name, typedArrayProto)
	})

	function patch(name, proto) {
		const origin = proto[name]
		if (origin) proto[name] = function (callback, thisArg = undefined) {
			if (thisArg === undefined) {
				if (this.length) Function.throwIfThis(callback)
				else Function.asyncThrowIfThis(callback)
			}
			return origin.call(this, callback, thisArg)
		}
	}
}()
