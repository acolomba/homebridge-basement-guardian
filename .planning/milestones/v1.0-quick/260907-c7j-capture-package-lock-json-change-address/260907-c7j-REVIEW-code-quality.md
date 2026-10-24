# Code quality review — `homebridge-basement-guardian`

Whole-codebase review of `src/**/*.ts` (43 files, ~11.3k lines), with extra
scrutiny on the four commits `features/refinements` carries ahead of
`origin/main`.

Reviewed against:

- `CLAUDE.md` (project) and `~/.claude/CLAUDE.md` (global)
- `.claude/rules/typescript-comments.md`
- `.claude/rules/typescript-style-guide.md`
- `.claude/rules/changelog.md`

Verification performed while reviewing:

- `npm run typecheck` — clean.
- `npx eslint src --max-warnings=0` — clean.
- Exhaustive differential test of the old and new `EMAIL_PATTERN` over every
  string up to length 7 drawn from `{a, ., @, space, -, tab}`: **zero**
  behavioural differences. The `src/config.ts` regex change is a pure
  backtracking fix, not a semantic one.
- Manual trace of the `pumpRecords` watched-edge / watermark absorber over
  four interleavings (edge-then-timestamp, timestamp-then-edge, both in one
  observation, run entirely between polls). No double count and no missed
  count in any of them.

## Summary

The safety invariant this codebase exists to hold — unknown, stale, omitted or
invalid telemetry never becomes a guessed measurement or a normal-looking
default — is enforced consistently and at the right layers:

- `gemini.ts` decodes per scope and omits any scope whose own fields failed
  their shape check, rather than defaulting it.
- `serviceCatalogue.published()` drops every `undefined` candidate, and
  `ensureService` refuses to *create* a service a row cannot vouch for, which
  is what stops HAP's format defaults (`LEAK_NOT_DETECTED`, `NO_FAULT`,
  `BATTERY_LEVEL_NORMAL`) from being published as facts.
- `isRowTrusted` / `isRowPublishable` split "can I vouch for this" from
  "would publishing this overwrite a good value", and the split is applied
  the same way on the write path (`reportedControlValue`) as on the read
  path, so a press and a tile cannot disagree.
- `monitoringDegradedScopes` withdraws exactly the scopes each transport
  failure actually costs, and `silenceElapsedMs` takes the *larger* of the
  monotonic and wall terms, which can only ever report silence sooner.

I found no defect in any of that. The four `features/refinements` source
changes are all behaviour-preserving: the regex is provably equivalent, the
`nextOfflineCount` signature change reads the same boolean off the object it
now takes, `countWatchedActivation` captured nothing from the closure it was
lifted out of, `String.raw` produces byte-identical patterns, and
`DEFAULT_PLATFORM_DEPS` holds one function nobody mutates.

One BLOCKING finding, and it is a written-rule violation in a comment rather
than a behavioural defect. Everything else is advisory.

## BLOCKING

### B1 — GSD planning reference in a comment

`src/runtime/accountRuntime.ts:71`

```ts
// The vendor `deviceId` is the Phase 2 ruling's non-sensitive value, permitted
// in logs and in accessory context, and it names no route, header, credential
// or account (D-14, D-027, AUTH-02).
```

**What is wrong.** `.claude/rules/typescript-comments.md` forbids `Phase NN`
references to GSD planning steps in comments, and lists exactly this shape
under "Forbidden". A repo-wide grep for
`phase [0-9]|plan [0-9]|wave [0-9]|task [0-9]|milestone|pitfall [0-9]|pattern [0-9]`
over `src/` returns this one line and nothing else, so the rule is otherwise
held throughout and this is a single isolated break.

**Failure scenario.** A maintainer reading this line needs to know *why* a
`deviceId` — which the same comment says reads `<account-id>_<serial-number>`
— is allowed into log output, because the Privacy constraint in `CLAUDE.md`
otherwise forbids account identifiers there. The anchor offered is "the Phase
2 ruling". GSD phase directories are renumbered per milestone and archived by
`/gsd:cleanup`, which is the stated reason the rule exists: the token resolves
to a different artifact per milestone and to nothing at all once the
milestone is archived. The maintainer is then left with a privacy exemption
they cannot verify, in the one function that puts an account-derived
identifier into a warning line. The durable anchor is already on the same
line and is what should carry it.

**Fix.** Drop the planning token and let the decision ID that is already cited
do the work:

```ts
// The vendor `deviceId` is a non-sensitive value, permitted in logs and in
// accessory context, and it names no route, header, credential or account
// (D-14, D-027, AUTH-02).
```

## ADVISORY

### A1 — Date-stamped decision reference, same rule's spirit

`src/accessories/controls.ts:514-516`

> `// deliberate. It reads `<account-id>_<serial-number>`, and the 2026-08-29`
> `// ruling treats it as non-sensitive and admits it to logs and accessory`
> `// context; `D-027` still keeps it out of public artifacts.`

Not literally forbidden — the rule names `milestone vX.Y` and UAT-decision
parentheticals — but "the 2026-08-29 ruling" is the same kind of anchor: it
points at a dated artifact rather than at a specification row. `D-027` is
already cited on the next clause and is sufficient. Consider dropping the
date.

### A2 — Planning-artifact filename in a doc comment

`src/accessories/serviceCatalogue.ts:979`

> `* This is the one act `03-CONTEXT.md` D-05 otherwise forbids.`

`D-05` is the anchor the rule endorses; `03-CONTEXT.md` names the planning
file it currently lives in, which is the coupling the comment rule exists to
avoid. Consider `This is the one act D-05 otherwise forbids.`

### A3 — `AccessoryContext` no longer describes what is persisted

`src/persistence/accessoryContext.ts:85-108`, `src/platform.ts:48-58`

`AccessoryContext` is documented as "Everything Homebridge persists for one
accessory" and declares `deviceId`, `deviceTypeId` and `serialNumber` as
top-level members. What the platform actually writes is
`context.device = { deviceId, deviceTypeId }` (nested, `platform.ts:238`,
`:309`) and no `serialNumber` at all. `BasementGuardianAccessoryContext` pulls
four members out of `AccessoryContext` by indexed access — `lastVendorName`,
`primaryPump`, `backupPump`, `watermarks` — and diverges on the other three.

No runtime consequence: nothing reads the three drifted members, and
`deviceIdOf` narrows `context.device` structurally at
`basementGuardian.ts:239-248`. But the file's stated role as the single source
of the stored shape is no longer true, and a future reader wiring a new
persisted member from it would put it in the wrong place. Either reshape
`AccessoryContext` to carry `device?: { deviceId; deviceTypeId }` or soften
the `@fileoverview` to say it declares the *observation* members only.

### A4 — Shared mutable default dependency record

`src/platform.ts:497-499`

```ts
const DEFAULT_PLATFORM_DEPS: PlatformDeps = { httpFetch };
```

The accompanying comment says the sharing is inert because "nothing mutates
it", which is true today but not enforced: `PlatformDeps.httpFetch`
(`:493-495`) is a plain mutable member, so a test that constructs the platform
with the default and then assigns `deps.httpFetch` would leak that transport
into every later construction in the same process. Marking the member
`readonly` makes the comment's claim a compiler guarantee at zero cost.

### A5 — `within()` leaves its deadline armed if `begin` throws synchronously

`src/cloud/mqttTransport.ts:108-131`

`begin(settle)` is invoked inside the `new Promise` executor. If it throws
synchronously — an mqtt.js `subscribe`/`publish` rejecting its arguments
before it ever calls back — the promise rejects, but `expiry.abort()` is never
reached, so the `timers.setTimeout(deadlineMs, …)` wait survives for the full
10 s and then rejects an already-settled promise. The rejection is harmless;
the live timer is the cost, and `SYNC-05` is explicit that shutdown leaves no
timer holding the process open.

I could not construct a reachable input for this against the pinned mqtt.js —
both call sites pass a `string[]` and a `string` — so it is advisory rather
than blocking. A two-line guard closes it:

```ts
try {
  begin(settle);
} catch (error: unknown) {
  expiry.abort();
  reject(error);
}
```

### A6 — A shared grant inherits only the first caller's deadline

`src/cloud/auth.ts:455-461`, with `src/cloud/api.ts:150-156`

`sharedGrant` memoises `grantAndCache(options, policy, signal)` using the
`AbortSignal` of whichever caller arrived first, and every later joiner rides
that signal. The deadlines are not the same across call sites: a command uses
`COMMAND_DEADLINE_MS` (2 500 ms, `api.ts:18`) while a poll uses
`REQUEST_TIMEOUT_MS` (10 000 ms, `accountRuntime.ts:40`).

Scenario: the cached token has just crossed its renewal margin, and a HomeKit
press lands a fraction of a second before the poll tick. The press's `send()`
starts the grant under a 2 500 ms deadline; the poll's `send()` joins it. The
tenant answers at 4 s. Both reject. `fetchGrant`'s `if (signal.aborted) throw
error` (`auth.ts:373`) treats it as a caller-requested abort, so no
authentication warning is logged, and `runPoll` records it through
`describeFailure` as the generic "Device discovery failed." — a poll failure
that names a cause that did not happen. One more such coincidence trips
`REST_FAILURE_THRESHOLD` and withdraws `connectivity`.

Self-correcting (the next poll retries and the token cache is rewritten), and
the sharing itself is load-bearing under `D-22`, so this is a robustness note
rather than a defect. If it is worth closing, sharing the grant under an
internal signal derived from the root controller — with each caller racing its
own deadline against the shared promise — would keep the single-attempt
property without letting the shortest deadline in the room govern everyone.

### A7 — Per-message array allocation on the shadow arrival path

`src/runtime/accountRuntime.ts:801`

```ts
if (options.store.deviceIds().includes(deviceId)) {
```

`deviceIds()` copies the whole key set (`state.ts:343-345`) and `includes` is
a linear scan, both on every routed shadow message. Correct, and irrelevant at
fleet sizes of one to a handful. Noted only because the surrounding comment
argues at length that this path introduces no cost; `store.snapshot(deviceId)
!== undefined` would be the O(1) form of the same question.

### A8 — `nextOfflineCount` now takes a snapshot member to read one boolean

`src/accessories/basementGuardian.ts:402-404`

```ts
function nextOfflineCount(previous: number, connectivity: DeviceSnapshot['connectivity'], threshold: number): number {
  return connectivity.connected ? 0 : Math.min(previous + 1, threshold);
}
```

Behaviour is identical to the boolean form it replaced, so this is taste. The
cost is that a pure counter helper now names `DeviceSnapshot` in its
signature, which the function does not otherwise care about. If the Sonar
finding was about an unnamed boolean argument at the call site, a named
parameter object (`{ connected }`) would satisfy it without importing the
snapshot type into the helper's contract. Reasonable engineers could take
either side; the current form is fine.

### A9 — `CLAUDE.md` runtime constraint is stale

`CLAUDE.md` states the runtime constraint as Node `^22.10.0 || ^24.0.0`.
`package.json:29-32` declares `^22.10.0 || ^24.0.0 || ^26.0.0`, and
`src/cloud/httpDispatcher.ts:2-19` is written specifically around Node 26's
`allowH2` default flip. Pre-existing on `origin/main`, not introduced by this
branch, but the review standard and the code now disagree about a supported
platform. Worth a one-line correction to `CLAUDE.md` the next time it is
touched.

## Notes on the branch commits (no findings)

- **`7012d5b` `src/config.ts`** — `EMAIL_PATTERN` rewritten from
  `[^\s@]+@[^\s@]+\.[^\s@]+` to `[^\s@]+@[^\s@][^\s@.]*\.[^\s@]+`. Proven
  equivalent by exhaustive differential test (see header). The new form is
  deterministic where the old one could backtrack between the domain-label and
  TLD classes. `test/config.test.ts` gained cases for it.
- **`7012d5b` `src/logging.ts`** — `String.raw` produces byte-identical
  pattern sources; the redaction behaviour is unchanged. All four patterns
  carry `g` and are only ever used with `String.prototype.replace`, which
  resets `lastIndex`, so module-level sharing stays safe.
- **`7012d5b` `src/index.ts`** — arrow → function declaration. This moves the
  file *into* compliance with the style guide's one sanctioned default export
  ("`src/index.ts` exports exactly one default, a function declaration").
- **`7012d5b` `src/accessories/pumpRecords.ts`** — `countWatchedActivation`
  read only its two parameters before the lift, so hoisting it to module scope
  changed nothing.
- **`4b4b41c` `src/cloud/auth.ts`** — the suppression comment's claim is
  accurate: `sonar-project.properties` does carry the matching `e1` entry
  (`typescript:S5332`, `resourceKey=src/cloud/auth.ts`). The `http://`
  string is Auth0's opaque `grant_type` identifier and is never fetched.
- **`4b4b41c` `eslint.config.js`** — the `src/**/*.ts` block spreads
  `sonarjs.configs.recommended.rules` without re-registering the plugin, which
  is correct for ESLint 10, and pins the four unicorn rules Sonar imports.
  `npx eslint src --max-warnings=0` is clean under it.

BLOCKING_COUNT: 1
