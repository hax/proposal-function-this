# API options

## `Function.isThisArgumentExpected(func)` static method

See #3

## `thisArgumentExpected` own property

### Semantics

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

### `this: void` trick in TypeScript

```ts
function f(this: void) {
  this.foo // Property 'foo' does not exist on type 'void'.ts(2339)
}
```

Some people use `this: void` (or `this: never`) trick to prevent the use of `this`. We suggest TypeScript compiler emit `function f()` instead of `function f(this)` (when [explicit `this` parameter](https://github.com/gilbert/es-explicit-this) is introduced) in such cases to avoid `f.thisArgumentExpected` become `true` which is opposite to programmer's intention.

## Some complex examples

```js
function f() {
  return function () {
    return () => this
  }
}
f.thisArgumentExpected // false
f().thisArgumentExpected // true
f()().thisArgumentExpected // false

let o = {
  m(x = () => super.foo) {}
}
o.m.thisArgumentExpected // true
```


## Built-in functions

For built-in functions, it should have `thisArgumentExpected` be `null` if it always throw unless invoked via `new`, be `true` if it always throw when `this` argument passed in is `undefined`, otherwise be `false`.

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
