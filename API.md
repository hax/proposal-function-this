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
