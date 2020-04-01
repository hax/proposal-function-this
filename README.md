# `this` argument reflection of functions

ECMAScript proposal for `this` argument reflection of function objects.

**Stage**: 0

**Champion**: 贺师俊 (HE Shi-Jun)

**Authors**: 贺师俊 (HE Shi-Jun)

This proposal is currently stage 0 and ready for present on 2020 March TC39 meeting.

## Motivation

The keyword `this` in JavaScript is often considered very confusing and hard to understanding. Sometimes the diffculties of learning `this` is overstated, make novices feel distressed and self-handicapped.

ES6 already introduced arrow functions and classes to take some responsibilities of traditional functions, make the usage of `this` much clear than before. In practice, most JavaScript programmers can understand the usage of `this` well, but occasionally make mistakes. For example, when you add an event listener, you may forget to use arrow functions or `bind`, pass in the unbound method directly. This is just a simple mistake, but the resulting bug may be very hidden, and will only be exposed until the listener is called and access `this.foo`, and the error (ReferenceError) usually cannot provide enough information about the bug. And in non-strict functions, "global this" is used as "this value" if no "this argument" is provided, which make non-strict functions behave like a bound function in such cases — accessing `this.foo` won't generate error, makes the bug more difficult to find.

So the real problem is **lacking of the mechnism to provide language-level protections** which can report such errors *early*.

This proposal propose an API to allow frameworks/libraries/devtools inspect
the intended usage of a function, whether the function expect this argument to be passed in, if not match the expectation, frameworks/libraries/devtools could report error in early stage and provide better error/warning message.

For methods and normal functions which have `this` reference in their FunctionBody, the API should return `true`, otherwise the return value is `false`. For arrow functions and bound functions, the value is `false`, for class constructors, the value could be `null`.

By checking the return value, well-designed APIs that want to receive callbacks can throw an error immediately when they receive a function which expect `this` argument, and the error could contain better error message which is helpful to locate the bug.

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
$(e).on('click', hax.showName) // <- no error, eventually output window.name

// safer API:
on(eventType, listener, options) {
  const eventTarget = this.element
  if (Function.expectsThisArgument(listener)) throw new TypeError(
    'listener should not expect this argument, please use arrow function or <function>.bind')
  eventTarget.addEventListener(eventType, listener, options)
}

$(window).on('click', hax.showName) // <- throw TypeError

$(window).on('click', () => hax.showName()) // <- ok
$(window).on('click', hax.showName.bind(hax)) // <- ok

$(window).on('click', test) // <- also ok
function test() { console.log('test') }
```

```js
request(url).then(() => {
  // do sth
}, logger.processError)

// last line should be `e => logger.processError(e)
// not easy to discover the bug because `fetch(url)` rarely failed

// subclassed Promise
class MyPromise extends Promise {
  then(onFulfilled, onRejected) {
    if (onFulfilled?.thisArgumentExpected) throw new TypeError()
    if (onRejected?.thisArgumentExpected) throw new TypeError()
    return super.then(onFulfilled, onRejected)
  }
}
```

## Useful to future language features

```js
// example from https://www.smashingmagazine.com/2018/10/taming-this-javascript-bind-operator/
const plus = x => this + x;
console.info(1::plus(1));
// "[object Window]1"
```

We could improve the semantic of `::`, do the check first to provide better dev experience.
```js
const plus = x => this + x;
// if (!Function.expectThisArgument(plus)) throw new TypeError()
console.info(1::plus(1)); // throw TypeError
```

## API options

- func.thisArgumentExpected (own data prop)
- Function.prototype.thisArgumentExpected (getter/setter)
- Function.expectThisArgument(f) (static method)

See [API.md](API.md) for details.

## Babel plugin and polyfill

TODO
