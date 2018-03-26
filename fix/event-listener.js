void function () {
	'use strict'

	const addEventListener = EventTarget.prototype.addEventListener

	EventTarget.prototype.addEventListener = function (type, listener, options = {}) {
		if (options.throwIfThis) Function.throwIfThis(listener)
		addEventListener.call(this, type, listener, options)
	}
}()
