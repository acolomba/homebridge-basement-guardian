---
paths:
  - "**/*.ts"
---

# TypeScript style rules

Rule form of the Google TypeScript Style Guide for a Homebridge plugin built from the official plugin template. Where the guide is silent, the template's ESLint configuration decides; those points are marked *(template)*. "Do" and "Do not" are hard rules. "Prefer" states the default and allows a justified exception. "May" grants a permission. Copy the **Good** form.

## Formatting

- Indent with 2 spaces. End lines with LF. Keep lines within 160 columns. *(template)*
- End every statement with a semicolon. Do not rely on automatic semicolon insertion.
- Delimit strings with single quotes. Use a template literal instead of escaping a quote or concatenating several literals.
- Put a trailing comma after the last element of a multi-line array, object, parameter list, or argument list. *(template)*
- Put spaces inside object braces: `{ log, api }`, `import { API } from 'homebridge';`. *(template)*
- Open a brace on the same line as its statement. Put `else`, `catch`, and `finally` on the closing brace's line.
- Put `case` and `default` at the same indentation as their `switch`. *(template)*
- Do not leave a blank line at the start or end of a function body. Separate methods, and the constructor, from surrounding members with one blank line. Use a blank line inside a body only to group statements.
- Do not put a semicolon after a class declaration or after a method body. A statement that contains a class expression ends with a semicolon.
- Do not put a space after `...` in rest or spread. Write `function*` and `yield*` with the star attached to the keyword.
- Use only ASCII spaces as whitespace; escape every other whitespace character in a literal. Use the special escape (`\n`, `\t`, `\'`) rather than a numeric one. Write a printable non-ASCII character as itself (`'μs'`); escape only non-printable characters and add a comment.
- Write a multi-line comment as consecutive `//` lines, not a `/* */` block. Do not draw boxes around comments.

## Files and modules

- Order a file as: copyright JSDoc, `@fileoverview` JSDoc, imports, implementation, each present section separated by exactly one blank line.
- Name files in `lowerCamelCase`, as the template's scaffold does: `platformAccessory.ts`. *(template)*
- Use ES module syntax only. Do not use `namespace`, `module Foo {}`, `/// <reference>`, or `import x = require()`. Namespace your code with separate files.
- Import files in the same project with relative paths, with the `.js` extension the template's `nodenext` resolution requires: `import { PLATFORM_NAME } from './settings.js';`. Limit `../` chains. *(template)*
- Prefer named imports for symbols used often or with clear names. Prefer a namespace import (`import * as hap from ...`) for many symbols from one large API or for common names such as `Service` that would otherwise need aliases. Rename an import only to avoid a collision, to name a generated symbol, or to make an unclear name clear.
- Use a default import only for external code that offers nothing else. Use a side-effect import (`import 'x';`) only to load a library for its side effects.
- Mark imports used only as types: `import type { API } from 'homebridge';` or `import { type Logging, HapStatusError } from 'homebridge';`. Re-export types with `export type`.
- Use named exports. Do not use default exports.
  - **Exception (Homebridge).** Homebridge loads a plugin through the default export of its entry module and fails otherwise. `src/index.ts` exports exactly one default, a function declaration; no other module uses a default export.
- Export only symbols used outside the module. Do not `export let`; keep the binding module-local and export a getter function. Do the conditional first, then `export const`; every export is final once the module body has run.
- Do not create a class of static members to namespace values. Export the constants and functions directly.
- Declare before use: do not use a variable, function, or import above its declaration. *(template; classes and enums are exempt)*

**Good** (`src/index.ts`, the one permitted default export)

```ts
import type { API } from 'homebridge';
import { ExampleHomebridgePlatform } from './platform.js';
import { PLATFORM_NAME } from './settings.js';

export default function registerPlatform(api: API): void {
  api.registerPlatform(PLATFORM_NAME, ExampleHomebridgePlatform);
}
```

## Variables, literals, and data

- Declare with `const`; use `let` only when the binding is reassigned. Never use `var`. Declare one variable per declaration.
- Build arrays with `[]`, never `Array()` or `new Array()`. Do not put non-numeric properties on an array; use a `Map` or an object.
- Build objects with a literal, never `new Object()`.
- Spread only an iterable into an array and only an object into an object. Never spread a primitive, `null`, or `undefined`: write `const lines = show ? [line] : []; [...lines]`, not `[...(show && line)]`. Do not spread class instances or functions.
- Put destructuring defaults on the left-hand side: `function configure({ name = 'default' }: Options = {})`. An optional destructured object defaults to `{}`, an optional destructured array to `[]`. Keep parameter destructuring to one level of unquoted shorthand properties.
- Do not mix computed or quoted keys with unquoted keys in one literal unless the computed key is a symbol.
- Do not use line continuations (a backslash at the end of a line) inside a string. Concatenate literals, or keep one long literal when splitting would hurt searchability.
- Write number prefixes in lowercase (`0x`, `0o`, `0b`). Do not write a leading zero otherwise.
- Coerce with `String(value)`, `Boolean(value)`, `!!value`, or a template literal. Never construct `new String()`, `new Number()`, or `new Boolean()`.
- Parse numbers with `Number(text)` and check the result with `Number.isNaN()` or `Number.isFinite()` unless failure is impossible. Do not use unary `+`. Do not use `parseInt` or `parseFloat` except for a non-decimal radix, after validating the digits.
- Do not write `!!value` in an `if`, `for`, or `while` condition; rely on the implicit coercion. Never coerce an enum value to boolean, implicitly or with `Boolean()`; compare it: `level !== SupportLevel.NONE`.

## Classes

- Omit an empty constructor and one that only calls `super()`. Keep a constructor whose parameters are parameter properties, or that is `private` to prevent instantiation.
- Call constructors with parentheses: `new Map()`, never `new Map`.
- Declare an injected value as a parameter property instead of declaring the field and assigning it. Initialize every other field at its declaration. Do not add or delete instance properties after construction; initialize an optional field to `undefined`.
- Mark every property never reassigned outside the constructor `readonly`.
- Do not use `#private` fields; use `private`.
- Never write `public`, except on a non-readonly public parameter property. `readonly` on a parameter already makes it a public property.
- Do not read a private member through `obj['name']`. Use dot notation for every property access whose name is a valid identifier. *(template)*
- Keep getters pure: no observable state change. Do not write a getter/setter pair that only passes a field through; make the field public or `readonly` instead. Do not define accessors with `Object.defineProperty`.
- Use a computed member name only for a symbol. Implement `[Symbol.iterator]()` on a class that is logically iterable; otherwise use symbols sparingly.
- Prefer a module-local function over a private static method. Never use `this` in a static context. Call a static method on the class that declares it.
- Do not store an arrow function in a property to bind `this`; call the method from an arrow function at the call site: `setTimeout(() => { this.poll(); }, delay)`. Exception: an event handler that must later be removed may be an arrow-function property, because it is a stable bound reference. Never install a handler with `.bind(this)`; it cannot be removed.
- Limit visibility. Move a private helper to a non-exported function in the module. Do not manipulate prototypes, write mixins, or modify built-in objects or the global object.

**Good**

```ts
export class ExampleHomebridgePlatform implements DynamicPlatformPlugin {
  readonly accessories = new Map<string, PlatformAccessory>();

  constructor(
    readonly log: Logging,
    readonly config: PlatformConfig,
    readonly api: API,
  ) {
    this.api.on('didFinishLaunching', () => {
      this.discoverDevices();
    });
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.accessories.set(accessory.UUID, accessory);
  }
}
```

**Bad**

```ts
export class ExampleHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly accessories: Map<string, PlatformAccessory> = new Map();
  #cache = new Map<string, PlatformAccessory>();

  constructor(public readonly log: Logging, public readonly config: PlatformConfig, public readonly api: API) {
    this.api.on('didFinishLaunching', this.discoverDevices.bind(this));
  }
};
```

## Functions

- Prefer a function declaration for a named function. Use an arrow function assigned to a `const` only when an explicit function type is needed or the function is nested and needs the outer `this`.
- Do not use `function` expressions; use arrow functions. Exceptions: a generator, or a function that exists to rebind `this`.
- Use a concise arrow body only when the return value is used. When the value is discarded, use a block body or `void`: `promise.then((value) => { this.log.info(value); })`.
- Use `this` only in constructors, methods, functions declaring a `this:` parameter, and arrow functions inside those. Never use `this` for the global object or an event target.
- Pass a callback as an arrow function that forwards arguments explicitly, `.map((text) => Number(text))`, unless both signatures are stable. Do not pass a named function that has optional parameters to a higher-order function.
- Give a default initializer no side effects and no shared mutable value. Use defaults sparingly; when a function takes several optional parameters without a natural order, take a destructured options object.
- Use a rest parameter instead of `arguments`; never name anything `arguments`. Use spread instead of `Function.prototype.apply`.
- Prefer parentheses around a single arrow parameter: `(accessory) => accessory.UUID`.
- Do not use `bind`, `call`, or `apply` where an arrow function or an explicit parameter works.

## Control flow

- Use braces on every control-flow body, and put the first statement on its own line. *(template `curly: all`; the guide's single-line `if` exception is not used)*
- Do not assign inside a condition. When an assignment in a condition is the clearest form, wrap it in a second pair of parentheses.
- Iterate arrays with `for (const accessory of accessories)`; use an index loop or `entries()` only when the index is needed. Never use `for-in` on an array. Use `for-in` only on a dictionary-style object with a `hasOwnProperty` guard, and prefer `for-of` over `Object.keys()`, `Object.values()`, or `Object.entries()`.
- Add grouping parentheses whenever a reader could misread precedence. Do not parenthesize the whole operand of `return`, `throw`, `typeof`, `void`, `delete`, `case`, `in`, `of`, or `yield`.
- Compare with `===` and `!==`. `== null` and `!= null` are allowed to match both `null` and `undefined`. *(template `eqeqeq: smart`)*
- Give every `switch` a `default` group, last, even if empty. End every non-empty group with `break`, `return`, or `throw`. Only an empty group may fall through.

## Errors

- Prefer throwing to returning an error object or filling an error parameter. Define an `Error` subclass when the native `Error` cannot carry the needed information.
- Throw and reject only `Error` instances, created with `new`: `throw new Error('...')`, `Promise.reject(new Error('...'))`.
- Catch as `catch (error: unknown)` and assume it is an `Error`. Do not defensively handle non-`Error` values unless a specific API is known to throw them; then say so in a comment.
- Never leave a catch block empty without a comment stating why nothing is done.
- Keep a `try` block to the statements that can throw; move the rest out. A `try` may cover a whole loop.

## Types

- Do not write `as` or `!` without an obvious or explicit reason. Prefer a runtime check (`instanceof`, `if (value)`). When an assertion is safe for a local reason, state the reason in a comment on the line above.
- Write assertions as `value as Type`, never `<Type>value`. Double-assert through `unknown`, never `any` or `{}`.
- Type an object literal with an annotation, `const order: Order = { ... }`, not with `as Order`; the annotation reports unknown fields.
- Rely on inference for a variable initialized with a string, number, boolean, RegExp, or `new` expression. Do not annotate `const enabled: boolean = true` or `const ids: Set<string> = new Set()`. Give type arguments to an empty generic: `new Set<string>()`. Annotate an expression whose type a reader cannot see at a glance.
- Return type annotations are optional. Add one when the return type is not obvious from the name and body.
- Do not put `| null` or `| undefined` in a type alias; add it where the alias is used. Prefer an optional field or parameter (`name?: string`) to `name: string | undefined`. Initialize class fields instead of making them optional.
- Give a structural value its type at the declaration. Declare object types with `interface`, not a `type` alias of an object literal and not a class.
- Write `T[]` and `readonly T[]` for a simple element type (identifier or dotted name), including `T[][]`. Write `Array<...>` and `ReadonlyArray<...>` for anything else: `Array<string | number>`, `Array<{ name: string }>`, `Array<readonly string[]>`.
- Label an index signature meaningfully: `{ [serialNumber: string]: Accessory }`. Prefer `Map` and `Set` over an object used as a map. Use `Record<Keys, Value>` when the keys are statically known.
- Use the simplest type construct that expresses the code. Use mapped and conditional types sparingly; prefer interface extension over `Pick` and friends.
- Avoid `any`. Use a specific type, an inline object type, a generic, or `unknown` narrowed with a type guard. When `any` is unavoidable, suppress the lint rule on that line and say why: `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- <reason>`.
- Do not use `{}` as a type; use `unknown`, `Record<string, T>`, or `object`. Never use `String`, `Number`, `Boolean`, or `Object` as types.
- Return a tuple `[string, number]` instead of defining a `Pair` type; return an inline object type when the parts deserve names.
- Do not design an API whose only generic is the return type. When calling one, pass the type argument explicitly.
- All code passes the compiler. Never use `@ts-ignore` or `@ts-nocheck`. Use `@ts-expect-error` only in a unit test, with a description, when a cast with a comment would not do.

## Naming

| Style | Used for |
| --- | --- |
| `UpperCamelCase` | class, interface, type alias, enum, type parameter |
| `lowerCamelCase` | variable, parameter, function, method, property, module alias, file name *(template)* |
| `CONSTANT_CASE` | module-level constant, `static readonly` field, enum member |

- Make names descriptive to a new reader. Do not use ambiguous or project-private abbreviations, and do not drop letters from a word. A name in a scope of ten lines or fewer may be short.
- Treat an acronym as a word: `loadHttpUrl`, `deviceId`, not `loadHTTPURL` or `deviceID`.
- Do not encode the type in the name: no `_` prefix or suffix, no `opt_`, no `I` prefix or `Interface` suffix, no Hungarian notation. Do not name a parameter `_`; omit unused destructured elements with commas instead. Use `$` only where a framework requires it.
- Use `CONSTANT_CASE` only for a value that exists once per program: a module-level `const`, a static field of a module-level class, or an enum member. A local in a function is `lowerCamelCase`. An arrow function implementing an interface may be `lowerCamelCase`.
- Keep the source's casing when aliasing a symbol. Alias with `const`, or a `readonly` field in a class.
- A type parameter is a single uppercase letter or `UpperCamelCase`.

## Comments and documentation

- Use `/** JSDoc */` for documentation a user of the code reads, and `//` for implementation notes.
- Document every top-level export, and any property or method whose purpose its name and type do not make obvious. A class comment says how and when to use the class.
- Begin a method description with a third-person verb phrase: `Registers the accessory ...`, not `Register ...`.
- Write `@param` and `@return` only when they add information beyond the name and type. Put each tag on its own line; indent a wrapped tag description by four spaces. Do not indent a wrapped `@fileoverview`.
- Document parameter properties with `@param` on the constructor.
- Do not repeat types in JSDoc. Do not write `@private`, `@override`, `@implements`, or `@enum` on code that uses the keyword.
- Write JSDoc as Markdown; use a `-` list for a list.
- Add a parameter-name comment when a literal argument is unclear: `setTimeout(poll, /* delayMs= */ 5000)`. Before doing so, consider an options object.
- Mark deprecations with `@deprecated` and directions for fixing call sites.
- Do not define decorators. Homebridge defines none, so plugin code uses none.

## Disallowed

`var` · `namespace` / `module {}` · `require` · `export default` outside `src/index.ts` · `export let` · `#private` · `public` on a non-parameter or readonly member · `const enum` · `debugger` · `with` · `eval` and `new Function()` · `new String()` / `new Number()` / `new Boolean()` / `new Object()` / `new Array()` · unary `+` · `parseInt`/`parseFloat` for base 10 · `<Type>value` assertions · `{}` and `Object` as types · `@ts-ignore` / `@ts-nocheck` · `arguments` · `.bind(this)` when installing a handler · non-standard or proposal-stage language features · modifying built-ins or the global object.

## Policy

- A new file follows these rules completely. In an existing file that does not, keep new code consistent with the file where the rules do not settle the question, but never violate a rule.
- Do not reformat unrelated code in a change. Style-only edits go in their own change.
