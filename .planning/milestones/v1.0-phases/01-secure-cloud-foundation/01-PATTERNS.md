# Phase 1: Secure Cloud Foundation - Pattern Map

**Mapped:** 2026-08-28
**Files analyzed:** 24 source/test/config files created or modified
**Analogs found:** 2 / 24 in-repo source analogs — this is a near-greenfield phase

> **Read this first.** The only existing source is the Homebridge template scaffold, and `D-01`/`D-02` delete most of it in this very phase. `src/platform.ts` and `src/platformAccessory.ts` are the **anti-pattern** this phase removes — do not copy `EXAMPLE_DEVICES`, the Lightbulb service, the motion sensors, the `EveHomeKitTypes` import, or the unmanaged `setInterval`. The load-bearing conventions for this phase live in `.claude/rules/*.md`, `features/CLAUDE.md`, and the tooling configuration, not in existing code. Where there is no analog this document says so and points at the numbered pattern in `01-RESEARCH.md` instead.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/index.ts` | entry/registration | request-response | *(unchanged — it is already the pattern)* | exact, keep as is |
| `src/settings.ts` | config constants | — | *(unchanged)* | exact, keep as is |
| `src/protocol.json` (name at discretion) | static data | — | none | no analog — `D-07` + RESEARCH §Recommended Project Structure |
| `src/config.ts` | config validator | transform | none | no analog — RESEARCH §Code Examples "Config validation that refuses rather than clamps" |
| `src/platform.ts` (rewrite) | composition root | event-driven | `src/platform.ts` (structure only: class shape, `implements DynamicPlatformPlugin`, import ordering, JSDoc) | partial — body is deleted, skeleton survives |
| `src/logging.ts` (name at discretion) | cross-cutting wrapper | transform | none | no analog — RESEARCH Pitfall 8 (`Logging` is a callable interface) |
| `src/runtime/accountRuntime.ts` | service/orchestrator | event-driven | none | no analog — RESEARCH Pattern 2 + Pattern 5 |
| `src/runtime/retryPolicy.ts` | utility | transform | none | no analog — CONTEXT Discretion (capped backoff shape) |
| `src/cloud/types.ts` | wire types + guards | transform | none | no analog — RESEARCH Pitfall 9 |
| `src/cloud/auth.ts` | cloud client | request-response + file-I/O | none | no analog — RESEARCH §Code Examples (Auth0 grant, atomic token write) |
| `src/cloud/api.ts` | cloud client | request-response | none | no analog — RESEARCH Pattern 5 |
| `src/cloud/shadow.ts` | cloud client | pub-sub/streaming | none | no analog — RESEARCH Patterns 3 and 4 |
| `src/device/state.ts` | pure policy/store | transform + pub-sub | none | no analog — `D-19`, `D-20`, intel state-store rules |
| `src/device/{events,health,family,gemini,halo}.ts` | type-only contracts | — | none | no analog — see "Type-only scaffold contract" below |
| `src/accessories/{basementGuardian,services}.ts` | type-only contracts | — | none | same |
| `src/persistence/accessoryContext.ts` | type-only contract | — | none | same |
| `test/**/*.test.ts` (one per src module) | test | — | `test/plugin.test.mjs` (weak) | partial — see note below |
| `features/*.feature` | BDD spec | — | none in repo | no analog — rules in `features/CLAUDE.md` are binding |
| `features/support/{world,fakeAuth0,fakeRestApi,fakeShadowBroker}.ts`, `features/support/steps/*.ts` | test harness | event-driven | none | no analog — RESEARCH Pattern 6 |
| `config.schema.json` | config | — | `config.schema.json` (current) | partial — replaced wholesale per `D-04` |
| `package.json` | config | — | itself | exact |
| `tsconfig.test.json` | config | — | `tsconfig.json` | role-match (extend it) |
| `cucumber.json` | config | — | none | no analog — RESEARCH §Code Examples "Cucumber ESM + TypeScript configuration" |
| `CHANGELOG.md` | doc | — | none | no analog — `.claude/rules/changelog.md` is the spec |
| `.fallowrc.json` | config | — | itself | exact — add `ignoreFindings` |

**Note on `test/plugin.test.mjs`:** it exists and passes, but it is `.mjs`, sits at `test/plugin.test.mjs` rather than the mirrored `test/index.test.ts`, and imports from `dist/`. It does **not** satisfy `.claude/rules/typescript-unit-testing.md`'s pairing rule. Treat it as prior art for "assert the registration, not the framework" and nothing more; the planner should decide explicitly whether it is replaced by `test/index.test.ts`.

## Shared Patterns

These apply to **every** new `.ts` file in this phase. They come from repository rule files and tooling configuration, which are binding.

### Module shape and imports — `.claude/rules/typescript-style-guide.md`

Concrete, copyable form, taken from `src/index.ts` (the one file the phase keeps unchanged):

```ts
import { BasementGuardianPlatform } from './platform.js';
import { PLATFORM_NAME } from './settings.js';

import type { API } from 'homebridge';

/**
 * This method registers the platform with Homebridge
 */
export default (api: API): void => {
  api.registerPlatform(PLATFORM_NAME, BasementGuardianPlatform);
};
```

Rules the planner must carry into every new module:

- File order: `@fileoverview` JSDoc, imports, implementation, one blank line between sections.
- Relative imports carry an explicit `.js` extension (`module: nodenext`). Non-negotiable.
- `import type` for type-only symbols; `export type` for type re-exports.
- **Named exports only.** `export default` is permitted in `src/index.ts` alone.
- File names in `lowerCamelCase`; `UpperCamelCase` for types/classes; `CONSTANT_CASE` for module-level constants.
- Single quotes, semicolons, 2-space indent, trailing commas, spaces inside braces, 160-column limit.
- Comment blocks are consecutive `//` lines, never `/* */`.
- Object types are declared with `interface`, not a `type` alias of an object literal.
- Banned and directly relevant here: `const enum`, `#private`, `@ts-ignore`, `<Type>value` assertions, `{}` as a type, `.bind(this)` on a handler.

> **Contradiction to resolve, not paper over.** `D-09`'s rationale for rejecting Node's strip-only mode cites `const enum` service subtypes, but the style guide's Disallowed list bans `const enum` outright. The parameter-property half of the `D-09` rationale still stands on its own. The planner should state that Phase 1 uses parameter properties and `as const` objects, and that `const enum` is not coming back.

### Import ordering — `eslint.config.js` (`import-x/order`)

```js
groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
'newlines-between': 'always',
alphabetize: { order: 'asc', caseInsensitive: true },
```

Type imports sort **last**, after value imports, with a blank line between groups. `src/index.ts` and `src/platform.ts` both already show this shape. Also active: `@typescript-eslint/explicit-module-boundary-types: 'error'` (every exported function needs an explicit return type), `@stylistic/padding-line-between-statements` (a blank line after any block-like statement), `sonarjs/cognitive-complexity: 15`, `curly: all`, `no-console: warn`.

`tseslint.configs.strictTypeChecked` is enabled. Combined with RESEARCH Pitfall 9 this means: type every wire boundary as `unknown` and narrow it with hand-written predicates in `src/cloud/types.ts`. No `as`.

### Type-strictness constraints — `tsconfig.json`

```jsonc
"strict": true,
"exactOptionalPropertyTypes": true,
"noUncheckedIndexedAccess": true,
"noImplicitOverride": true,
"noImplicitReturns": true,
"noUnusedLocals": true,
"noUnusedParameters": true,
"resolveJsonModule": true,
"module": "nodenext",
"rootDir": "src",
"include": ["eslint.config.js", "homebridge-ui", "src"]
```

Practical consequences the planner must plan for:

- `exactOptionalPropertyTypes` — an optional field cannot be assigned `undefined` explicitly. Config defaults and the `PresignInput` shape both hit this.
- `noUncheckedIndexedAccess` — every `Map`/`Record`/array index yields `T | undefined`. The restored-accessory map and the per-device snapshot lookup both need explicit narrowing.
- `include` does not cover `test/` or `features/` — this is RESEARCH Pitfall 1 (typed ESLint refuses to parse them). `tsconfig.test.json` must fix it.
- `resolveJsonModule` is already on, which `D-07` depends on; RESEARCH Pitfall 5 notes `nodenext` additionally requires an import attribute.

### Complexity budget — `.fallowrc.json`

```jsonc
"entry": ["src/index.ts"],
"health": { "maxCyclomatic": 20, "maxCognitive": 15, "maxUnitSize": 60, "maxCrap": 0 },
"duplicates": { "threshold": 3 },
"includeEntryExports": true,
"rules": { "private-type-leaks": "error" }
```

**`maxUnitSize: 60` is the single most shaping constraint on this phase.** `AccountRuntime` (start, stop, poll timer, rotation timer, retry, root `AbortController`) and the `DeviceStateStore` merge reducer must both be decomposed into named units under 60 lines each *before* they are written, not refactored afterwards. The planner should name those units in the plan. `maxCrap: 0` means every unit is either simple or fully covered. `private-type-leaks: error` means an exported signature cannot reference a non-exported type — relevant to the `D-19` `subscribe(deviceId, listener)` contract and every factory-options interface.

`entry: ["src/index.ts"]` plus `includeEntryExports: true` is the `D-17` dead-code conflict. RESEARCH §"Resolving `D-17` against the `fallow` dead-code gate" resolves it with an enumerated `ignoreFindings` list; copy that list verbatim and add the plan note that each phase deletes its own entries.

### Unit test shape — `.claude/rules/typescript-unit-testing.md`

Every new `src/**/*.ts` gets exactly one `test/**/*.test.ts` at the mirrored path. No exclusions, including the type-only scaffolds. The copyable header and case shape:

```ts
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { mock, verify, when } from 'strong-mock';
```

- `node:test` runner, `node:assert/strict` assertions, `strong-mock` for strict interaction mocks. No other library.
- One top-level `describe()` per exported entrypoint; no nesting; cases are `test()`, never `it()`.
- Phase comments `// arrange`, `// act`, `// assert` (or `// act & assert`) in that order.
- Values named for their production role: `orderService`/`order`, never `result`, `sut`, `data`.
- Mocks: `mock<Port>({ exactParams: true, name: '<role>' })` created inside the case, every promised call stated with exact arguments, `verify(mock)` last. No `It.isAny()`, no `anyTimes()`.
- 100% function/line/branch coverage **per pair, run alone**. Aggregate does not count. No coverage-ignore directives.
- Test support lives beside the concern it serves (`test/cloud/create-fake-shadow.ts`). Do not create `test/helpers/`, `test/utils/`, `test/mocks/`, or `test/shared/`.
- Injected `Clock` over `Date.now()`; `t.mock.timers.enable({ apis: ['setTimeout'] })` only when scheduling itself is the behavior. This is why the CONTEXT discretion item about the clock's shape must be settled in the plan.
- `fetch` is replaced with `t.mock.method(globalThis, 'fetch', …)` returning a **fresh** `Response` per call.
- Filesystem behavior (the token cache) uses one `mkdtemp` per case, removed in `t.after()`.

**Type-only scaffold contract.** The rule file's own "Patterns → Type-only modules" section is the exact template for the eight `D-17` scaffolds:

```ts
void ({ type: 'order.placed', orderId: 'order-123', total: 25 } satisfies OrderEvent);
// @ts-expect-error an event carries its discriminant
void ({ orderId: 'order-123' } satisfies OrderEvent);
```

A type-only scaffold has no executable lines, so it satisfies the 100% rule trivially. That is why RESEARCH Pitfall 7 concludes the scaffolds must be **type-only, with no stub function bodies**. Any scaffold with a runtime body drags a real coverage obligation with it.

> **Style note the planner should settle once.** The examples in `typescript-unit-testing.md` are written without semicolons; `typescript-style-guide.md` requires them and `eslint.config.js` enforces `semi: ['error', 'always']` over `**/*.ts`. Semicolons win. Copy the *structure* of the rule file's examples, not their punctuation.

### Gherkin and step definitions — `features/CLAUDE.md` (binding on the `D-10` harness)

- Concise, active verbs; present tense; no "should"; no `And`.
- Sentence casing for scenarios; **all lower case for steps**.
- "these" when a data table follows: `Given these devices:`.
- Definite article for something specific: "the shadow", "the token cache".
- Step definitions organized **by function, not by feature file**.
- Method naming: Given → the thing given (`devices`); When → the action (`runShadowPatch`); Then → `assert` plus the condition (`assertSnapshotPreservesOmittedFields`).
- Ordered `Given()`, then `When()`, then `Then()` within a module.
- In test code, let exceptions bubble; do not catch and log.

### Changelog entries — `.claude/rules/changelog.md`

One user-visible change per bullet, 40 words or fewer, one sentence, 25 words or fewer per sentence, active voice, lead with what changed for the reader. No internals, no rationale, no list of what remains unimplemented. Apply the `simple-english` and `humanizer` skills before writing. `D-23` bootstraps the file with Keep a Changelog structure and an `Unreleased` section.

### Comment traceability — `.claude/rules/typescript-comments.md`

Comments and test titles may cite decision and requirement IDs (`D-19`, `SYNC-04`, `AUTH-02`, `CONF-05`). They must **not** cite GSD planning steps — no `Phase NN`, `Plan NN`, `Wave N`, `Task N`, and no bare `Pattern N` / `Pitfall N` references to this phase's RESEARCH document. When the plan tells an executor to follow "RESEARCH Pattern 3", the resulting code comment must carry the rationale or the `D-`/requirement ID, not the pattern number.

## Pattern Assignments

### `src/platform.ts` (composition root, event-driven) — **rewrite**

**Analog:** the current `src/platform.ts`, for skeleton only.

What survives the teardown — the class declaration shape, the parameter-property constructor, and the import block form:

```ts
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';

import type { API, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig } from 'homebridge';

export class BasementGuardianPlatform implements DynamicPlatformPlugin {
  public readonly accessories = new Map<string, BasementGuardianPlatformAccessory>();

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
```

Note `accessories` is already a `Map`, which matches `D-03`'s "record restored accessories and nothing else", and the `PlatformAccessory<Context>` generic alias pattern is worth keeping for Phase 2.

What must be deleted, and is explicitly not a model: `import { EveHomeKitTypes } from 'homebridge-lib/EveHomeKitTypes'` (`D-02`), `EXAMPLE_DEVICES`, `CustomServices`/`CustomCharacteristics`, `BasementGuardianAccessory`, the Lightbulb and motion-sensor wiring, and the `setInterval(…, 10_000)` loop (`D-01`).

**Body to write:** RESEARCH Pattern 1 — redacting logger installed first, `validateConfig` refusal returning **before** any `api.on(…)` registration, then `didFinishLaunching` and `shutdown` handlers each wrapped in `void`.

### `src/config.ts` (config validator, transform)

**No analog.** Follow RESEARCH §Code Examples "Config validation that refuses rather than clamps". Key contract: a discriminated `ConfigResult` (`{ ok: false, reason }` | `{ ok: true, config }`), refuse rather than clamp per `D-16`, absent optional fields take documented defaults, bounds `pollInterval` 300–3600 and `offlineConfirmationPollCount` 1–8 default 2 from `CONF-05`. `private-type-leaks: error` means both result variants must be exported types.

### `src/logging.ts` (cross-cutting wrapper, transform)

**No analog.** RESEARCH Pitfall 8 is the whole specification: `Logging` is a **callable interface with seven members**, identical in homebridge 1.8.0 and 2.4.0. Build a function and attach `prefix`, `info`, `success`, `warn`, `error`, `debug`, `log`. A class does not satisfy it. All seven paths redact, including the bare call form and `log(level, …)`. `D-18` and `REL-02` make this a directly tested module.

### `src/cloud/auth.ts` (cloud client, request-response + file-I/O)

**No analog.** RESEARCH §Code Examples supplies both halves: the password-realm grant body (which is a secret in its entirety and never logged) and the atomic owner-only token write — `writeFile(temp, …, { mode: 0o600 })` then `rename` over the target, because `mode` is ignored on an existing file (RESEARCH Pitfall 3). Cache payload `{ idToken, expiresAt, emailFingerprint }` per `D-08`. Error branching: `invalid_grant` → stop (`D-13`); HTTP 429 `too_many_attempts` → long backoff with the 30-day warning (`D-22`, which overrides RESEARCH's recommendation); everything else transient under `D-14`.

### `src/cloud/api.ts` (cloud client, request-response)

**No analog.** RESEARCH Pattern 5: `AbortSignal.any([rootSignal, AbortSignal.timeout(deadlineMs)])` per request; built-in `fetch` only (`D-06`). Response bodies typed `unknown` and narrowed in `src/cloud/types.ts`.

### `src/cloud/shadow.ts` (cloud client, pub-sub/streaming)

**No analog.** RESEARCH Pattern 3 (the ~35-line `node:crypto` SigV4 presigner and the `transformWsUrl` wiring, including the load-bearing `c.options.clientId` assignment) and Pattern 4 (the exact topic subset, the `version` watermark, and the topics that must **not** be subscribed or published). `reconnectPeriod: 0` — `retryPolicy.ts` owns backoff, not mqtt.js. The signer is a pure function of credentials plus a clock, so it is pinned by golden-vector tests under a fixed injected clock.

### `src/runtime/accountRuntime.ts` (orchestrator, event-driven)

**No analog.** RESEARCH Pattern 2 for rotation (the `finally` that always reschedules is `SYNC-04`'s "failed refreshes remain scheduled"), Pattern 5 for abortable waits (`node:timers/promises` `setTimeout(ms, undefined, { signal })`). Constructor DI for `AuthClient`, `CloudApi`, `ShadowClient`, and the clock, per `D-11` and the unit-testing rule's "make dependencies explicit". **Constructing it must not open a connection, read a file, or start a timer** — only `start()` does. Decompose against `maxUnitSize: 60`.

### `src/device/state.ts` (pure policy, transform + pub-sub)

**No analog.** `D-19` fixes the contract: `subscribe(deviceId, listener)` notifying `(next, previous, changedKeys)` from a shallow compare of the merged data object. `D-20` fixes the snapshot shape: typed identity envelope, opaque validated-shape `reported.data`, no field decoding, device time kept separate from local receipt time. Merge never replaces; `desired` is ignored entirely. Additional rules in `.planning/intel/context.md` "Architectural lessons" (the eight state-store rules and the `DeviceStateStore` interface sketch). No sockets, no timers, no HomeKit — this is the module the suite leans on hardest, and `maxUnitSize: 60` applies to the reducer.

### `features/support/*` (test harness, event-driven)

**No analog.** RESEARCH Pattern 6 has the verified `aedes` + `ws` coalescing `Duplex` bridge — copy it, because the obvious `createWebSocketStream` form hangs forever with no error (Pitfall 4). RESEARCH §Code Examples has the verified `cucumber.json` profile shape and the `package.json` script set (`build:test`, `test:unit`, `test:cucumber`, `test`). Support code is imported from `dist-test/`; `paths` points at the uncompiled `.feature` sources.

### `tsconfig.test.json`, `config.schema.json`, `package.json`, `.fallowrc.json`

**Analog: the current files.** `tsconfig.test.json` extends `tsconfig.json` and widens `include`/`rootDir` to cover `src`, `test`, and `features` — that widening is what fixes RESEARCH Pitfall 1, and Pitfall 2 (`no-floating-promises` on every `node:test` `test()` call) needs an accompanying ESLint override. `config.schema.json` is replaced wholesale per `D-04` but keeps `pluginAlias: 'BasementGuardian'`, `pluginType: 'platform'`, and `singular: true` — those three must stay aligned with `PLATFORM_NAME` in `src/settings.ts` and `name` in `package.json`, or every cached accessory is orphaned. `package.json` gains the `D-21` `files` allowlist and the new scripts, and loses `homebridge-lib`.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/config.ts` | config validator | transform | No configuration module exists; the template validates nothing |
| `src/logging.ts` | wrapper | transform | No logging abstraction exists; the template calls `this.log` directly |
| `src/runtime/{accountRuntime,retryPolicy}.ts` | service, utility | event-driven | No runtime layer; the template's only long-lived work is the `setInterval` being deleted |
| `src/cloud/{auth,api,shadow,types}.ts` | cloud clients | request-response, pub-sub | No network code exists anywhere in the repository |
| `src/device/state.ts` | store | transform + pub-sub | No state store exists |
| `src/device/*`, `src/accessories/*`, `src/persistence/*` scaffolds | type-only | — | Nothing comparable; shape is defined by the rule file's type-only-module pattern |
| `features/**` | BDD | — | `features/` contains only `CLAUDE.md`; no `.feature` file or step definition has ever existed here |
| `cucumber.json`, `CHANGELOG.md` | config, doc | — | Neither file exists |

For every row above the planner should cite `01-RESEARCH.md` by section title (not by "Pattern N" in the eventual code comments, per the comment rule), plus the component responsibility table and source layout in `.planning/intel/context.md`.

## Metadata

**Analog search scope:** `src/`, `test/`, `features/`, repository root configuration
**Files scanned:** 5 source files, 1 test file, 4 rule files, 7 configuration files
**Pattern extraction date:** 2026-08-28
