# Function this

ECMAScript proposal for `this` data property of plain functions.

**Stage**: pre-0
**Champion**: ?
**Authors**: 贺师俊 (@hax)

This proposal is currently pre-stage0.

## Motivation

JavaScript函数中的动态`this`常被认为存在设计缺陷，难以理解。虽然ES5加入了strict模式和Function.prototype.bind作为补救，但这些措施过于保守，以至于一些人认为这只是进一步复杂化了问题。

幸好ES6加入了arrow functions和class，分担了传统函数的职责。正确使用这些特性，可以很好的将函数分为三类：

- class methods or method-like functions (dynmaic this)
- static methods or plain functions (no this)
- callback or thunk (lexical this)

这基本解决了传统函数身兼数职所导致的问题。只要遵循简单的代码原则，在绝大多数cases中不会再存在对`this`的混淆。

不幸的是，对`this`错误的教学方法（比如将所有`this`的不同用法罗列一处）以及一些历史APIs的拖累，导致社区仍然对`this`视若猛虎，过度夸张了`this`可能引发的混淆。这一方面使得新手产生了畏难情绪和自我设障，反过来进一步加深了我们对于`this`难学的偏见；另一方面也影响了TC39对`this`相关特性的推进，使我们缺乏改善`this`的机会。

实际上，绝大多数JavaScript程序员都能掌握和理解`this`，只是偶尔会犯错，比如在需要添加event listener的时候，直接把unbound方法传入，而忘记使用arrow functions或bind。这本身只是一个简单失误，但导致的bug可能十分隐蔽，只在listener被调用，且访问了未预期的`this`上的属性或方法时才会暴露。所以问题在于我们缺乏语言级的保护措施，能在早期（如传入listener时）就报告错误。

本提案就针对此问题，提议为函数增加`this` data property。

`this`属性表示该函数是否使用dynamic this。注意，只有普通函数、方法具有该属性，arrow functions和bound functions（Function.prototype.bind调用所产生的函数）上没有该属性。

通过检查`this`属性，设计良好的APIs如果希望接收callback，可以在接收到使用了dynamic this的函数时扔出异常，并且该异常的stack包含了传入unbound函数处从而很容易定位问题；而不必等到函数实际以undefined或global作为`this`被回调并产生问题时才被迫抛出异常，且该异常的stack中通常无法追溯到传入unbound函数处。

## Use cases

TODO

## Semantics

```js
const functionWithThis = function () { return this }
const functionWithoutThis = function () {}
const arrowFunction = () => this
const boundFunction = functionWithThis.bind(null)

assert.equal ( getThis(functionWithThis), {value: true, enumerable: false, writable: false, configurable: true} )
assert.equal ( getThis(functionWithoutThis), {value: false, enumerable: false, writable: false, configurable: true} )
assert.equal ( getThis(arrowFunction), undefined )
assert.equal ( getThis(boundFunction), undefined )

function getThis(f) {
	return Object.getOwnPropertyDescriptor(f, 'this')
}
```

## Alternative names

- `<function>.dynamicThis`
- `<function>.thisDynamic`

## Alternative semantic

Instead of boolean value property for plain functions, it could be a string value property for all functions:

- arrow functions: `"lexical"`
- bound functions: `"bound"`
- functions with this: `"dynamic"`
- functions without this: `"none"`

## Helpers

These helpers functions could be leave to userland, but we include them here for convenience.

### `Function.throwIfThis`

```js
Function.throwIfThis = function (f) {
	if (f.this) throw new TypeError()
}
Function.asyncThrowIfThis = async function (f) {
	if (f.this) throw new TypeError()
}
```

### `Function.toggleThis`

```js
Function.toggleThis = function (f) {
	const pd = Object.getOwnPropertyDescriptor(f, 'this')
	if (pd) {
		pd.value = !pd.value
		Object.defineProperty(f, 'this', pd)
	}
}
```

### Usage
```js
function guardThis() {
	if (this === undefined) {
		// ...
	}
}

Function.throwIfThis(guardThis) // throw
Function.throwIfThis(Function.toggleThis(guardThis)) // not throw

function implicitThis() {
	return eval('this')
}

Function.throwIfThis(implictThis) // not throw
Function.throwIfThis(Function.toggleThis(implictThis)) // throw
```

## Babel plugin and polyfill

TODO

## Fix current libraries

### Array.prototype.forEach/map/some/every/reduce/reduceRight

```js
const {forEach} = Array.prototype
Array.prototype.forEach = function (callback, thisArg = undefined) {
	if (thisArg === undefined && this.length) Function.throwIfThis(callback)
	return forEach.call(this, callback, thisArg)
}
```

### setTimeout/setInterval

```js
const oldSetTimeout = setTimeout
setTimeout = function (func, ...args) {
	Function.asyncThrowIfThis(func)
	return oldSetTimeout.call(this, func, ...args)
}
```

### addEventListener

```js
const {addEventListener} = EventTarget.prototype
EventTarget.prototype.addEventListener = function (eventType, listener, options = {}) {
	if (options.throwIfThis) Function.throwIfThis(listener)
	return addEventListener.call(this, eventType, listener, options)
}
```
