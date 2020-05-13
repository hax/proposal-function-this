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

This proposal propose a runtime reflection API to allow frameworks/libraries/tools (and possible future language features) inspect the intended usage of a function, whether the function expect this argument to be passed in, if not match the expectation, frameworks/libraries/tools (and possible future language features) could report error in early stage and provide better error/warning message.

For methods and normal functions which have `this` reference in their FunctionBody, the API should return `true`, otherwise the return value is `false`. For arrow functions and bound functions, the value is always `false`, for class constructors, the value should be `null`.

The three values are mutually exclusive, but theorically classical functions can play multiple roles (constructors, methods, plain functions) so there will be false positives, see [edge-cases.md](edge-cases.md).

For built-in functions and platform APIs, it should have `thisArgumentExpected` be `null` if it always throw unless invoked via `new`, be `true` if it always throw when `this` argument passed in is `undefined`, otherwise be `false`. Basically most prototype methods would return `true`, other methods and functions return `false`, but there are some exceptions (see [built-ins.md](built-ins.md)).

By checking the return value, well-designed APIs that want to receive callbacks can throw an error immediately when they receive a function which expect `this` argument, and the error could contain better error message which is helpful to locate the bug.

## Use cases

(Temporarily use `thisArgumentExpected` API option in the examples, see later section for other possible API options)

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
ElementWrapper.prototype.on = function (eventType, listener, options) {
  const eventTarget = this.element
  if (listener.thisArgumentExpected) throw new TypeError(
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

// we can let request() return subclassed Promise to solve the problem
class MyPromise extends Promise {
  then(onFulfilled, onRejected) {
    if (onFulfilled?.thisArgumentExpected) throw new TypeError()
    if (onRejected?.thisArgumentExpected) throw new TypeError()
    return super.then(onFulfilled, onRejected)
  }
}
```

## Useful to future language features

In principle, we can't change the behavior of current APIs because it may break the web, but new APIs could leavage this feature. For example, https://github.com/tc39/proposal-upsert/issues/20 suggest `new Map ( [iterable [, valueFn]] )`, when the user calls `map.get(key)` and no entry for key exists, it’ll call `valueFn(key)` and insert and return the resulting value. Obviously `valueFn` should be a function with `thisArgumentExpected` be `false`. A common use case is `new Map([], Object)`, which will generate a new object as default. In some cases u need to change that to generating instance of class `MyObject`, it's possible u made mistake to write `new Map([], MyObject)`, with the feature used, an error will be thrown immediately, so u could correct code to `new Map([], v => new MyObject(v))` in first place.

This feature could also be helpful to new operators, for example bind operator proposal.

```js
// example from https://www.smashingmagazine.com/2018/10/taming-this-javascript-bind-operator/
const plus = x => this + x;
console.info(1::plus(1));
// "[object Window]1"
```

We could improve the semantic of `::`, do the check first to provide better dev experience.
```js
const plus = x => this + x;
// if (!plus.thisArgumentExpected) throw new TypeError()
console.info(1::plus(1)); // throw TypeError
```

This could also work for pipeline operators:
```js
x |> object.method
```
Currently pipeline proposal would desugar it as `object.method(x)` to ensure
using correct `this`, but it's easy to break
```js
x |> a?.foo ?? b.foo
// desugar to (func ?? object.method)(x) and lose `this`
```

Other examples:
```js
// works for most 3rd party promise libraries,
// but break if use built-in Promise
let {resolve: toPromise} = Promise
x |> toPromise
```
```js
const {reverse} = Array.prototype
// this work
arrayLike |> reverse.call
// but very easy to forget .call
arrayLike |> reverse
```

So desugar to `object.method(x)` is not as great as we expect,
may be doing the check could provide better dev experience.
```js
// let pipeline first check the expression
// if (expression.thisArgumentExpected) throw new TypeError()
value |> expression
```

This could be even more useful in [function composition operator](https://github.com/TheNavigateur/proposal-pipeline-operator-for-function-composition)
(possible follow-on proposal after pipeline)

```js
button.onclick = f1 +> f2 +> f3
// semantic: button.onclick = event => (event |> f1 |> f2 |> f3)
```
because if there is any misuse of unbound method, the error would be thrown directly,
do not need to wait until click event occured.

## API options

- func.thisArgumentExpected (own data prop)
- Function.prototype.thisArgumentExpected (getter/setter)
- Function.expectThisArgument(f) (static method)

See [API.md](API.md) for details.

## Babel plugin and polyfill

TODO
