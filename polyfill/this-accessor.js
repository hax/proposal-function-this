void function () {
	'use strict'

	const returnThis = new Function('return this')
	const funcToStr = Function.prototype.toString

	if (!returnThis.this) {

		Object.defineProperty(Function.prototype, 'this', {
			get: function () {
				switch (funcThis(this)) {
					case 'bound':
					case 'lexical':
						return undefined
					case 'new':
					case 'dynmaic':
						Object.defineProperty(this, 'this', {value: true, configurable: true})
						return this.this
					case 'none':
						Object.defineProperty(this, 'this', {value: false, configurable: true})
						return this.this
				}
			},
			configurable: true,
		})

		const global = returnThis()
		for (const name of Object.getOwnPropertyNames(global)) {
			const value = global[name]
			const type = typeof value
			if (hasThis(value)) {
				Object.defineProperty(value, 'this', {value: isTitleCase(name), configurable: true})
			} else if (type === 'object') {
				if (value) initStaticMethods(value)
			}
		}
	}

	function initStaticMethods(obj) {
		Object.getOwnPropertyNames(obj).forEach(function (name) {
			const val = obj[name]
			if (hasThis(val)) Object.defineProperty(val, 'this', {value: false, configurable: true})
		})
	}

	function hasThis(f) {
		if (typeof f !== 'function') return false
		const name = String(f.name)
		if (name.startsWith('bound ')) return false
		const source = funcToStr.call(f)
		if (/^(function|get|set|class) /.test(source)) return true
		return false
	}

	function guessThis(f) {
		if (!hasThis(f)) return null
		const source = funcToStr.call(f)
		return source.startsWith('class ')
			|| source.endsWith('{ [native code] }')
			|| /\bthis\b/.test(source)
	}

	function isTitleCase(s) {
		const c = s.charCodeAt(0)
		return c >= 65 && c <= 90
	}

}()
