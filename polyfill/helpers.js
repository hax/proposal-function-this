void function () {
	'use strict'

	function throwIfThis(func) {
		if (typeof func !== 'function') throw new TypeError()
		if (func.this) throw new TypeError()
	}
	async function asyncThrowIfThis(func) {
		if (typeof func !== 'function') throw new TypeError()
		if (func.this) throw new TypeError()
	}

	function toggleThis(func) {
		if (typeof func !== 'function') throw new TypeError()
		if (func.this === undefined) return
		const pd = Object.getOwnPropertyDescriptor(func, 'this')
		if (pd) {
			pd.value = !pd.value
			Object.defineProperty(func, 'this', pd)
		}
	}

	Object.defineProperty(Function, 'throwIfThis', {
		value: throwIfThis,
		writable: true,
		configurable: true,
	})
	Object.defineProperty(Function, 'asyncThrowIfThis', {
		value: asyncThrowIfThis,
		writable: true,
		configurable: true,
	})
	Object.defineProperty(Function, 'toggleThis', {
		value: toggleThis,
		writable: true,
		configurable: true,
	})

}()
