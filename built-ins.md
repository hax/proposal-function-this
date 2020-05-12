# Built-in functions and platform APIs (non ECMAScript code functions)

For built-in functions and platform APIs, it should have `thisArgumentExpected` be `null` if it always throw unless invoked via `new`, be `true` if it always throw when `this` argument passed in is `undefined`, otherwise be `false`.

Basically most prototype methods would return `true`, other methods and functions return `false`. But there are some exceptions.

## pre-ES6 built-in constructors

Most pre-ES6 built-in constructors could be called as normal functions (without `new`), and some even have different semantics for `new` and normal call (eg. `Date`), so they would have
`thisArgumentExpected` be `false` instead of `null`.

## some static methods use `this` value

The typical one is `Promise.xxx`, they need this argument to be `Promise` or the subclasses of `Promise`, so they have `thisArgumentExpected` be `true`.

Some methods allow optional `this` value (eg. `Array.of`), because it still possible to send `undefined` to them as this argument, they have `thisArgumentExpected` be `false`.

## methods on `globalThis`

As developer perspective, methods on `globalThis` are just functions available in global scope even some of them are really prototype methods on `Window`. To allow developers use such methods as normal functions without explictly specify receiver (use `setTimeout()` instead of `window.setTimeout()`), these methods will use global object of the current realm as this value if the this argument passed in is `undefined`. So they have `thisArgumentExpected` be `false`.

## Examples

```js
Map.thisArgumentExpected // null
Date.thisArgumentExpected // false
Object.thisArgumentExpected // false
Object.prototype.valueOf.thisArgumentExpected // true
Math.abs.thisArgumentExpected // false
Array.isArray.thisArgumentExpected // false
Array.of.thisArgumentExpected // false
Promise.resolve.thisArgumentExpected // true
setTimeout.thisArgumentExpected // false
```
