## Edge cases

The three values (`true`, `false`, `null`) are mutually exclusive, but theorically classical functions can play multiple roles (constructors, methods, plain functions) so there will be false positives.

If we use own data property API form (`f.thisArgumentExpected`), programmers could reconfig the property for these edge cases. If we use other API form, we would need some other mechnism to deal with them or just ignore them.

The following code use `thisArgumentExpected` data property API form for demostration.

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
