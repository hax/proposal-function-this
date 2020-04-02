void function () {
	'use strict'

	const PROP_NAME = 'this'

	const funcToStr = Function.prototype.toString
	const {defineProperty} = Reflect

	if (!funcToStr[PROP_NAME]) {

		defineProperty(Function.prototype, PROP_NAME, {
			get() {
				const value = guessThis(this)
				if (value != null) {
					defineProperty(this, PROP_NAME, {value/*, configurable: true*/})
					return this[PROP_NAME]
				}
			},
			configurable: true,
		})

		const global = typeof globalThis !== 'undefined'
			? globalThis : new Function('return this')()

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
			if (hasThis(val)) defineProperty(val, 'this', {value: false, configurable: true})
		})
	}

	function hasThis(f) {
		if (typeof f !== 'function') return false
		const {name} = f

		// some spec internal functions?
		if (name == null) return false

		if (name !== '') {
			if (name.startsWith('bound ')) return false
			if (name.startsWith('get ')) return true
			if (name.startsWith('set ')) return true
		}

		// TODO: need tiny token scanners for function source

		const source = funcToStr.call(f)

		// method() {}
		if (name !== '' && source.startsWith(name)) return true

		if (/^class\b/.test(source) && (name === '' || !source.startsWith(name))) return false
		if (/^["'[]/.test(source)) return true
		if (/^((async\s+)?function)\b/.test(source)) return true
		return false
	}

	function guessThis(f) {
		if (!hasThis(f)) return null
		const source = funcToStr.call(f)
		return source.startsWith('class ')
			|| source.endsWith('{ [native code] }')
			|| /\bthis\b/.test(source)
			|| /\bsuper\b/.test(source)
	}

	function isTitleCase(s) {
		const c = s.charCodeAt(0)
		return c >= 65 && c <= 90
	}

}()
