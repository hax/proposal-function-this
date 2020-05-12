## Current reflection on attributes of functions

Up to now there is no much information developers can get from runtime reflections. The only three are
`name`, `length` and `prototype`.

### name

It's useful for debugging, but not very useful for methods, because the name don't include the name of class, only the name of method.

### length

Not very useful. Because:

- In old time, if someone only use `arguments` in the functions and never use formal parameters, the `length` is just `0`
- ES6+ support parameter default value, and start from the first parameter which have default value, all follow parameters are treat as "optional" and never count in `length`

### prototype

It could be used to determine whether the function is constructors. But have limitations:

- Classical functions always have `prototype` even most of them are not used for constructors, and `prototype` property is unconfigurable (don't know why) means programmers can't delete it to indicate it's not constructor.
- Some functions can't be used with `new` (not a real constructors) but still have prototype, for example
`BigInt`, `Symbol`, some constructors in platform APIs, etc. And we may introduce private constructors in the future.

### callee and caller

Depracated.

## Possible useful reflections

- A more accurate way for IsConstructor (which means it is intened to used as `new`)
- Whether it is intended as methods
- Info of parameters: name, optional?, coecin? etc. (hope function parameter decorator could satisfy it)
