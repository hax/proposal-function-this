# \<function>.thisArgumentExpected

ECMAScript proposal for `thisArgumentExpected` data property of function objects.

**Stage**: 0

**Champion**: 贺师俊 (HE Shi-Jun)

**Authors**: 贺师俊 (HE Shi-Jun)

This proposal is currently stage 0 and ready for present on 2020 Feb TC39 meeting.

## Motivation

The keyword `this` in JavaScript is often considered very confusing and hard to understanding. Sometimes the diffculties of learning `this` is overstated, make novices feel distressed and self-handicapped.

ES6 already introduced arrow functions and classes to take some responsibilities of traditional functions, make the usage of `this` much clear than before. In practice, most JavaScript programmers can understand the usage of `this` well, but occasionally make mistakes. For example, when you add an event listener, you may forget to use arrow functions or `bind`, pass in the unbound method directly. This is just a simple mistake, but the resulting bug may be very hidden, and will only be exposed until the listener is called and access `this.foo`, and the error (ReferenceError) usually cannot provide enough information about the bug. And in non-strict functions, "global this" is used as "this value" if no "this argument" is provided, which make non-strict functions behave like a bound function in such cases — accessing `this.foo` won't generate error, makes the bug more difficult to find.

So the real problem is **lacking of the mechnism to provide language-level protections** which can report such errors *early*.

This proposal addresses this problem and proposes `thisArgumentExpected` data property of the function objects.

The `thisArgumentExpected` property indicates whether the function expect "this argument" to be passed in. For methods and normal functions which have `this` reference in their FunctionBody, the value is `true`, otherwise the value is `false`. For arrow functions and bound functions, the value is `false`, for class constructors, the value is `null`.

By checking the `thisArgumentExpected` property, well-designed APIs that want to receive callbacks can throw an error immediately when they receive a function that have `thisArgumentExpected` value being `true`, and the error could contain better error message which is helpful to locate the bug.

## Use cases

```js
class Test {
	constructor(name) {
		this.name = name
	}
	showName() {
		console.log(this.name)
	}
}

const hax = new Test('hax')
window.addEventListener('click', hax.showName) // <- no error, eventually output window.name

// safer API:
function on(eventTarget, eventType, listener, options) {
	if (listener.thisArgumentExpected) throw new TypeError(
		'listener should not expect this argument, please use arrow function or <function>.bind')
	eventTarget.addEventListener(eventType, listener, options)
}

on(window, 'click', hax.showName) // <- throw TypeError

on(window, 'click', () => hax.showName()) // <- ok
on(window, 'click', hax.showName.bind(hax)) // <- ok

on(window, 'click', test) // <- also ok
function test() { console.log('test') }
```

```js
fetch(url).then(() => {
	// do sth
}, logger.processError)

// last line should be `e => logger.processError(e)
// not easy to discover the bug because `fetch(url)` rarely failed

// Fix Promise.prototype.then
let {then} = Promise.prototype
Promise.prototype.then = function (onFulfilled, onRejected) {
	if (onFulfilled?.thisArgumentExpected) throw new TypeError()
	if (onRejected?.thisArgumentExpected) throw new TypeError()
	return then.call(this, onFulfilled, onRejected)
}
```


## Semantics

```js
let pd = Object.getOwnPropertyDescriptor(callable, 'thisArgumentExpected')
pd.enumerable // false
pd.writable // false
pd.configurable // true
pd.value // true | false | null
```

`pd.value`:

- class constructor => `null`
- bound function => `false`
- arrow function => `false`
- explicit this ([gilbert/es-explicit-this proposal](https://github.com/gilbert/es-explicit-this)) => `true`
- implicit this (FunctionBody contains `this` or `super.foo`) => `true`
- otherwise => `false`

## Edge cases

Programmers could reconfig the property for some edge cases.

### Direct `eval`

```js
function func() {}
func.thisArgumentExpected // false

function directEval() {
	eval('this')
}
directEval.thisArgumentExpected // false

Object.defineProperty(directEval, 'thisArgumentExpected', {value: true})
```

### Old style constructor functions

```js
function implicitThis() { this }
implicitThis.thisArgumentExpected // true

function OldStyleConstructor(foo) {
	this.foo = foo
}
new OldStyleConstructor(42)

OldStyleConstructor.thisArgumentExpected // true
Object.defineProperty(OldStyleConstructor, 'thisArgumentExpected', {value: null})
```

```js
function OldStyleConstructor(foo) {
	if (new.target === undefined) return new OldStyleConstructor(foo)
	this.foo = foo
}
Object.defineProperty(OldStyleConstructor, 'thisArgumentExpected', {value: false})
```

### Optional `this` argument

```js
class X {
	static of(...args) {
		return new (this ?? X)(args)
	}
}
X.of.thisArgumentExpected // true
Object.defineProperty(X.of, 'thisArgumentExpected', {value: false})
```

### Retrieve global this

```js
let getGlobalThis = new Function('return this')
getGlobalThis.thisArgumentExpected // true
Object.defineProperty(getGlobalThis, 'thisArgumentExpected', {value: false})
```

## Babel plugin and polyfill

TODO
