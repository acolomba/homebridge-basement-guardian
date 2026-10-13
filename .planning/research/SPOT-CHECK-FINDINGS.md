# Spot-check findings (2026-10-13)

Seed input for the `code-review-sweep` milestone. Three source/test pairs were
read against `skills/typescript-google-style-review`,
`skills/typescript-unit-testing-review`, and `skills/typescript-comments` at
commit `64c4fea`. Nothing was built or run. The BLOCKER lines were confirmed by
reading the source; the WARNING lines are reviewer output and need
re-verification when their batch is reviewed.

## Repo-wide checks that passed

- Every `src/**/*.ts` module (except `src/@types/*.d.ts`) has a mirrored
  `test/**/*.test.ts` module.
- The style quick-scan tokens (`var`, `export let`, `public`, `#private`,
  `const enum`, `parseInt`, `@ts-ignore`, `arguments`, `.bind(this)`,
  `Object.defineProperty`, `new Array`) have no hits in `src/`. The one
  `export default` is the Homebridge loader entry `src/index.ts`, which the
  rules permit.
- `test/` has no `it(`, `test.only/skip/todo`, `It.isAny`, `anyTimes`,
  `verifyAll`, `t.mock.module`, `as any`, or `sut`.

## BLOCKER (confirmed)

| ID | Location | Finding |
| --- | --- | --- |
| SC-01 | `test/cloud/auth.test.ts:546` | The "stranded wider temporary file" case plants `${cachePath}.${pid}.tmp`, but production names the file `${target}.${pid}.${randomHex}.tmp` (`src/cloud/auth.ts:212`). The scenario never happens; removing `flag: 'wx'` still passes. Root cause: `process.pid` and `randomBytes` are hidden dependencies (see SC-04). |
| SC-02 | `test/accessories/controls.test.ts:591-623` | The refusal-log case reduces each line to `includes()` booleans. A wrong cause on the rows that share status `-70412` passes; the token and URL checks cannot fail. The rows also loop inside one `test()`. |
| SC-03 | `test/device/state.test.ts:494-496` (also 247, 483, 604) | `Object.isFrozen(undefined)` is `true`, so these pass when the snapshot or nested value is missing. The stale-version cases at 313-329 never read the store after a refused patch. |

## Production design and possible bug

| ID | Location | Finding |
| --- | --- | --- |
| SC-04 | `src/cloud/auth.ts:212` | `temporaryPath()` reads `process.pid` and `randomBytes()` inline; inject the name source through `AuthClientOptions` like `createSalt`. |
| SC-05 | `src/cloud/auth.ts:455-458` | Possible bug: a shared in-flight grant uses the first caller's `AbortSignal`, so a joined caller is aborted by the first caller's abort; no test covers it. |

## WARNING (reviewer output, re-verify)

- Whole-value assertions: `.length` or single-field checks where the whole value is the promise (`auth.test.ts` ~10 sites such as `grantRequests.length`; `state.test.ts:339-353, 415, 524, 551`; `controls.test.ts:831`). `auth.test.ts:503-505` uses standalone negative `includes(...) === false` checks.
- `@fileoverview` missing in about half of `src/` (including `auth.ts`, `state.ts`). Every file opens with an SPDX `//` line instead of a copyright JSDoc; treat that as a convention to record, not a defect.
- `T | undefined` fields instead of optional fields: `src/device/state.ts:38-62`, `src/cloud/auth.ts:104-105`. `DeviceSnapshot` fields are not `readonly` although snapshots are frozen.
- `controls.test.ts`: no `describe()` per exported entrypoint; a case at 217-238 tests the fake HAP, not the module; a hand-rolled `.bind` spy at 316-335 instead of `t.mock.method`; `// act & assert` over two statements at 928-933; undocumented `as unknown as Service` at 158, 330, 853, 874, 905.
- `state.test.ts:212` names a value `data`; design-rationale comments inside cases at 418-422, 446-449, 567-570, 607-610, 635-637.
- `auth.test.ts:123` defaults `httpFetch` to the global `fetch`, so a case that forgets `stubFetch` would reach the network.
- Exports used only by tests: `TOKEN_CACHE_FILENAME` (`src/cloud/auth.ts:69`).
- `src/accessories/controls.ts:304-328`: an ordering comment for `LOCAL_REFUSALS` sits on `NO_COMMAND_TRANSPORT_CAUSE`.
- `src/device/state.ts:83-143`: `applyDiscovery`, `snapshot`, `deviceIds` lack JSDoc; `remove`/`releaseShadowSource` JSDoc carries implementation notes.

## Observed strengths

Dependencies are injected throughout (clock, timers, fetch, logger, salt);
`import type` and `interface` are used consistently; there are no unjustified
`as`/`!`; every `catch` carries a comment; arrange/act/assert markers and
whole-value `deepStrictEqual` are the norm.
