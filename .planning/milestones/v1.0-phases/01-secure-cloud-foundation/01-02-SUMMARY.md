---
phase: 01-secure-cloud-foundation
plan: 02
subsystem: cloud-runtime
tags: [auth0, rest, abortsignal, type-predicates, state-store, homebridge-lifecycle, tdd]

requires:
  - "01-01: the second TypeScript project, typed lint over test/**, and the npm run check gate"
provides:
  - "`src/protocol.json` and `PROTOCOL`, the six bundled public vendor constants, shipped in dist/"
  - "`Clock` and `systemClock`, the injectable time source every later module takes"
  - "`validateConfig` returning a discriminated ConfigResult that refuses rather than clamps"
  - "`CloudRequestError`, `AuthRejectedError`, and `AuthThrottledError` with structured fields"
  - "`isRecord`, `isApiDevice`, and `isApiDeviceList`, the hand-written wire-boundary predicates"
  - "`createAuthClient`, the Auth0 password-realm grant with an in-memory token"
  - "`createCloudApi`, a typed fetch wrapper over GET /devices with per-request deadlines"
  - "`createDeviceStateStore`, one frozen canonical snapshot per device"
  - "`createAccountRuntime`, start and stop over one root AbortController"
  - "`src/platform.ts` as the composition root wiring all of the above"
affects: [01-03, 01-04, 01-05, 01-06, 01-07, 01-08, 01-09, 01-10, 01-11, accessory-adapters, cucumber-harness]

actuals:
  tokens: 16400
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Wire boundary typed unknown and narrowed by hand-written predicates; no assertion syntax"
    - "AbortSignal.any([rootSignal, AbortSignal.timeout(deadline)]) on every vendor request"
    - "Factory functions taking an explicit options object; construction performs no I/O"
    - "Failure logging is a fixed message plus an HTTP status, never an error's own message"
    - "Frozen snapshots copied out of the vendor record, with device time kept apart from receipt time"

key-files:
  created:
    - src/protocol.json
    - src/protocol.ts
    - src/runtime/clock.ts
    - src/config.ts
    - src/cloud/errors.ts
    - src/cloud/types.ts
    - src/cloud/auth.ts
    - src/cloud/api.ts
    - src/device/state.ts
    - src/runtime/accountRuntime.ts
    - test/protocol.test.ts
    - test/runtime/clock.test.ts
    - test/config.test.ts
    - test/cloud/errors.test.ts
    - test/cloud/types.test.ts
    - test/cloud/auth.test.ts
    - test/cloud/api.test.ts
    - test/device/state.test.ts
    - test/runtime/accountRuntime.test.ts
  modified:
    - src/platform.ts
    - test/platform.test.ts

key-decisions:
  - "An invalid supplied poll interval is refused, not replaced by the documented default; only an absent field defaults"
  - "`isRecord` is exported from src/cloud/types.ts, because two source modules need it and duplicating it would trip the duplicate-code gate"
  - "`start()` catches every discovery failure, so the platform's `void runtime.start()` cannot raise an unhandled rejection"
  - "`CloudRequestError` takes its message as a constructor parameter, so a rejected body and a rejected status read differently"
  - "The per-request deadline is 10 seconds, a discretionary value the settings form does not expose"
  - "Commit titles carry no phase-plan scope, following CLAUDE.md and the precedent set in 01-01"

patterns-established:
  - "Recording Logging stub that collects every message, so a case asserts the complete log and proves no secret leaked"
  - "Fetch stubs that record the request and answer with a fresh Response per call"
  - "Data-driven rejection rows for a predicate, one sibling test() per row"

requirements-completed: [CONF-01, CONF-03, CONF-04, AUTH-01, SYNC-01, SYNC-02, SYNC-05]

coverage:
  - id: D1
    description: "A configured account authenticates through the Auth0 password-realm grant and sends the id_token as a bearer token"
    requirement: AUTH-01
    verification:
      - kind: unit
        ref: "test/cloud/auth.test.ts#sends the password-realm grant the vendor tenant expects"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#authenticates, discovers one device, and stores its canonical snapshot"
        status: pass
    human_judgment: false
  - id: D2
    description: "GET /devices produces one canonical snapshot per returned device, carrying identity, connectivity, opaque data, device time, and a separate receipt time"
    requirement: SYNC-02
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#authenticates, discovers one device, and stores its canonical snapshot"
        status: pass
      - kind: unit
        ref: "test/device/state.test.ts#builds a snapshot that keeps device time apart from local receipt time"
        status: pass
    human_judgment: false
  - id: D3
    description: "The plugin starts its cloud work from didFinishLaunching and never from the platform constructor"
    requirement: SYNC-05
    verification:
      - kind: unit
        ref: "test/platform.test.ts#registers the launch and shutdown listeners once the configuration is valid"
        status: pass
    human_judgment: false
  - id: D4
    description: "stop() aborts the root controller once and can be called twice without raising"
    requirement: SYNC-05
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#resolves a second stop without raising"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#performs no request when start runs after stop"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#resolves start with no unhandled rejection when a shutdown interrupts discovery"
        status: pass
    human_judgment: false
  - id: D5
    description: "An omitted clientId resolves to the bundled public constant; a supplied value overrides it, and no other protocol constant is configurable"
    requirement: CONF-04
    verification:
      - kind: unit
        ref: "test/config.test.ts#resolves the bundled client identifier and the documented defaults when the optional fields are absent"
        status: pass
      - kind: unit
        ref: "test/config.test.ts#resolves a supplied client identifier over the bundled one"
        status: pass
    human_judgment: false
  - id: D6
    description: "The bundled protocol data file is present in dist/ after a build and in the packed package"
    verification:
      - kind: other
        ref: "npm run build && test -f dist/protocol.json; npm pack --dry-run lists dist/protocol.json"
        status: pass
    human_judgment: false
  - id: D7
    description: "Nothing is decoded from reported.data: the snapshot carries it as an opaque validated-shape record"
    requirement: SYNC-02
    verification:
      - kind: unit
        ref: "test/device/state.test.ts#copies the vendor record, so a later change to it cannot reach stored state"
        status: pass
      - kind: unit
        ref: "test/cloud/types.test.ts#accepts a device record carrying every field the plugin reads"
        status: pass
    human_judgment: false
  - id: D8
    description: "No authentication request body, Authorization header, access token, or vendor response body reaches the log"
    requirement: AUTH-01
    verification:
      - kind: unit
        ref: "test/cloud/auth.test.ts#logs one fixed message and the status, and never a credential, body, or token"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#logs a fixed message that repeats nothing from an unexpected discovery failure"
        status: pass
    human_judgment: false
  - id: D9
    description: "A malformed vendor payload is rejected rather than admitted to the store"
    requirement: SYNC-01
    verification:
      - kind: unit
        ref: "test/cloud/api.test.ts#refuses a device response whose shape the plugin cannot read"
        status: pass
      - kind: unit
        ref: "test/cloud/types.test.ts#rejects a list holding one malformed device record"
        status: pass
    human_judgment: false
  - id: D10
    description: "The plugin installs and does not start unless it is configured"
    requirement: CONF-03
    verification:
      - kind: unit
        ref: "test/platform.test.ts#logs one actionable refusal and registers no listener when the account email is missing"
        status: pass
    human_judgment: false
  - id: D11
    description: "The root signal and the per-request deadline each abort an in-flight request"
    requirement: SYNC-05
    verification:
      - kind: unit
        ref: "test/cloud/api.test.ts#aborts an in-flight device request when the root signal aborts"
        status: pass
      - kind: unit
        ref: "test/cloud/api.test.ts#aborts a device request on its own deadline while the root signal stays open"
        status: pass
    human_judgment: false
  - id: D12
    description: "npm run check passes across typecheck, lint, all three fallow sub-commands, format:check, and both test suites"
    verification:
      - kind: other
        ref: "npm run check (exit 0)"
        status: pass
    human_judgment: false
  - id: D13
    description: "A real Basement Guardian account authenticates against the live vendor tenant and discovers the real device"
    verification: []
    human_judgment: true
    rationale: "Every case runs against a stubbed fetch. The bundled constants, the grant shape, and the bearer header are taken from captured vendor traffic but have not been exercised against the live tenant from this code. Only a human with a real account can confirm that."

duration: 29min
completed: 2026-08-28
status: complete
---

# Phase 1 Plan 02: Tracer Slice Summary

**A configured account authenticates against the vendor Auth0 tenant, discovers devices over REST, and lands one frozen canonical snapshot per device in the store, released cleanly on the Homebridge shutdown event.**

## Performance

- **Duration:** 29 min
- **Started:** 2026-08-28T22:25:00Z
- **Completed:** 2026-08-28T22:54:12Z
- **Tasks:** 3
- **Files created or modified:** 21

## Accomplishments

- One end-to-end case drives the whole architecture. It stubs `fetch`, answers the token request and `GET /devices`, and asserts the stored snapshot, the bearer header, and the token that produced it. Every layer this phase will extend now has a working reference path.
- The vendor boundary admits nothing it has not checked. Responses are typed `unknown` and narrowed by hand-written predicates, so a malformed payload raises `CloudRequestError` instead of becoming device state.
- Failure logging cannot leak. Both failure paths log a fixed message plus an HTTP status. One case asserts the complete recorded log against a vendor error whose own message carries a URL, and proves the URL never reaches it.
- The snapshot keeps device time and local receipt time apart. The end-to-end case uses two different values, so an implementation that collapsed them would fail.
- The plugin refuses to start on an invalid account before it registers a listener, which is what the Homebridge Verified rule requires.
- A shutdown during discovery cancels the in-flight request and leaves no unhandled rejection.
- All 12 source modules have a mirrored test module. Each pair reports 100 percent lines, branches, and functions when run alone.

## Task Commits

1. **Task 1: bundled constants, the injected clock, and configuration** - `53326f9`
2. **Task 2: the vendor boundary** - `cb02cae`
3. **Task 3: snapshot store, account runtime, and composition root** - `2a1dd5c`

## Files Created/Modified

- `src/protocol.json` - The six public vendor constants; `tsc` copies it into `dist/`
- `src/protocol.ts` - Typed accessor, imported with a `type: "json"` import attribute
- `src/runtime/clock.ts` - `Clock` and `systemClock`; no logic in this phase reads the process time directly
- `src/config.ts` - Discriminated `ConfigResult`; refuses missing credentials and invalid supplied numbers
- `src/cloud/errors.ts` - Three error classes with structured fields and no URL in any message
- `src/cloud/types.ts` - Wire types and the `isRecord`, `isApiDevice`, `isApiDeviceList` predicates
- `src/cloud/auth.ts` - Password-realm grant, in-memory token with its expiry, silent about secrets
- `src/cloud/api.ts` - Base URL, bearer header, per-request deadline, route labels, `GET /devices`
- `src/device/state.ts` - One frozen snapshot per `deviceId`, copied out of the vendor record
- `src/runtime/accountRuntime.ts` - `start` and `stop` over one root `AbortController`
- `src/platform.ts` - Composition root; refuses before registering, starts on launch, stops on shutdown
- `test/platform.test.ts` - Extended with the refusal, registration, and lifecycle cases
- Nine new mirrored test modules covering the modules above

## Decisions Made

- **An invalid supplied number is refused, not defaulted.** The plan enumerates refusal on a missing email and a missing password only, and defers range checking to a later plan. That left a gap: a supplied `pollInterval` of `"every-ten-minutes"` had to become something. Silently substituting 900 is the exact behavior `D-16` forbids. `validateConfig` now defaults only when the field is absent and refuses when a supplied value is not a number. It still does not clamp and still checks no range, so the later plan adds bounds to a guard that already exists.

- **`isRecord` is exported from `src/cloud/types.ts`.** Both `types.ts` and `auth.ts` must narrow an unknown JSON body. The predicate is three lines, assertion syntax is banned, and two identical copies in `src/` would meet the duplicate-code gate's threshold. Exporting one predicate from the module whose stated job is narrowing the wire boundary was cheaper than either alternative.

- **`start()` never rejects.** The platform wraps both handlers in `void`, which discards a promise but does not catch it. A rejected discovery would therefore have become an unhandled rejection, against the threat register entry for the runtime lifecycle and against the Homebridge Verified rule. `start()` catches, logs a fixed message, and resolves.

- **`CloudRequestError` takes a message.** The interfaces block pins the readonly fields, not the constructor. A shared message template would have read "failed with HTTP 200" for a well-formed response with an unreadable body, so the message is a constructor parameter and the two failures read differently.

- **The per-request deadline is 10 seconds.** This is discretionary and not exposed in the settings form. The 2.5-second command deadline is a separate value that arrives with the command path.

- **Commit titles carry no `(phase-plan)` scope.** CLAUDE.md instructs commit titles to avoid planning references, following the precedent recorded in `01-01`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The precondition artifact is not present in a worktree**

- **Found during:** Task 1, precondition check
- **Issue:** The task's precondition requires `research.tar.gz` at the repository root. The file is git-ignored, and git does not copy ignored files into a linked worktree, so it was absent from the execution root.
- **Fix:** The archive is present in the main checkout of the same repository. `research/API.md` was read from there with `tar xzOf`, a read-only operation with no side effect on either tree. The precondition's purpose, that the six bundled constants can be sourced, was met.
- **Files modified:** None. Only the six constants were copied into `src/protocol.json`; nothing else from the archive reached the repository, and the archive is still untracked.
- **Verification:** `git status --porcelain --ignored` reports no `research` entry in the worktree.
- **Committed in:** `53326f9`

**2. [Rule 2 - Missing critical] Configuration substituted a default for an invalid supplied value**

- **Found during:** Task 1
- **Issue:** With defaults applied only on absence, a supplied but non-numeric `pollInterval` had no defined outcome. Falling back to the documented default is the silent substitution `D-16` explicitly forbids.
- **Fix:** `validateConfig` refuses a supplied value that is not a number, with a reason naming the field. It performs no clamping and no range check, so the later plan's bounds slot into the same guard.
- **Files modified:** `src/config.ts`, `test/config.test.ts`
- **Verification:** Two cases assert the refusal; the accepted-configuration cases assert the defaults still apply on absence.
- **Committed in:** `53326f9`

**3. [Rule 3 - Blocking] Two source modules needed the same record predicate**

- **Found during:** Task 2
- **Issue:** `src/cloud/types.ts` and `src/cloud/auth.ts` both narrow an unknown JSON body. The style guide bans assertion syntax, so a predicate is the only route, and two identical three-line copies in `src/` would meet the `fallow dupes` threshold of 3.
- **Fix:** `isRecord` is exported from `src/cloud/types.ts` and imported by `src/cloud/auth.ts`. It is one symbol beyond the interfaces block, in the module whose stated purpose is narrowing the wire boundary.
- **Files modified:** `src/cloud/types.ts`, `src/cloud/auth.ts`, `test/cloud/types.test.ts`
- **Verification:** `npm run fallow` reports no duplication and no dead export.
- **Committed in:** `cb02cae`

**4. [Rule 2 - Missing critical] A failed discovery would have raised an unhandled rejection**

- **Found during:** Task 3
- **Issue:** The composition root wraps both lifecycle handlers in `void`. `void` discards a promise but does not catch it, so any rejection from `start()` would surface as an unhandled rejection. The threat register requires that a shutdown during discovery cannot raise one, and the Homebridge Verified checklist forbids unhandled exceptions.
- **Fix:** `start()` catches every discovery failure. A `CloudRequestError` logs its route and status; anything else logs a fixed message and nothing from the error.
- **Files modified:** `src/runtime/accountRuntime.ts`, `test/runtime/accountRuntime.test.ts`
- **Verification:** Three cases: a shutdown mid-discovery resolves `start()`, a refused discovery logs the route and status, and an unexpected failure whose message carries a URL logs only the fixed message.
- **Committed in:** `2a1dd5c`

**5. [Rule 3 - Blocking] Bare numbers rejected in template literals**

- **Found during:** Task 2
- **Issue:** `@typescript-eslint/restrict-template-expressions` runs with `allowNumber` off under `strictTypeChecked`, so `HTTP ${status}` failed lint at zero warnings.
- **Fix:** Wrapped each numeric interpolation in `String(...)`, the coercion the style guide names.
- **Files modified:** `src/cloud/auth.ts`, `src/cloud/api.ts`, `test/cloud/auth.test.ts`
- **Verification:** `npm run lint` exits 0.
- **Committed in:** `cb02cae`

**6. [Rule 3 - Blocking] Stringifying a fetch argument tripped the base-to-string rule**

- **Found during:** Task 2
- **Issue:** The test fetch stubs typed their first argument as `string | URL | Request`. `Request` has no useful `toString`, so `no-base-to-string` failed. `String(init?.body)` failed for the same reason across the `BodyInit` union.
- **Fix:** The stubs declare `string | URL`, which is what the production code passes, and read the body only when it is a string.
- **Files modified:** `test/cloud/auth.test.ts`, `test/cloud/api.test.ts`
- **Verification:** `npm run lint` exits 0; the recorded URL and body assertions still discriminate.
- **Committed in:** `cb02cae`

---

**Total deviations:** 6 auto-fixed (4 blocking, 2 missing critical)
**Impact on plan:** Every fix was needed to satisfy a gate or a locked decision the plan itself cites. Two added behavior the plan did not enumerate, and both close a hole a locked decision forbids leaving open. No acceptance criterion was weakened and no file outside the plan's declared list was touched.

## TDD Gate Compliance

Each task produced one `feat:` commit rather than a `test:` then `feat:` pair. This is the sequence the plan itself specifies, and its reasoning holds for all three tasks, not only the third.

A test module that imports a source module which does not yet exist cannot be committed here. Three gates reject it: `fallow dead-code --fail-on-issues` reports an unresolved import, `npm run build:test` fails to compile, and typed lint turns the error-typed imports into errors at zero warnings. All three run as pre-commit hooks over the whole repository, and CLAUDE.md forbids `--no-verify`.

The RED step was therefore observed by running, in the working tree, before any implementation:

- **Task 1.** `npm run build:test` reported `TS2307: Cannot find module '../src/config.js'`, `'../src/protocol.js'`, and `'../../src/runtime/clock.js'` across the three new test modules.
- **Task 2.** The same command reported `TS2307` for `'../../src/cloud/api.js'`, `'auth.js'`, `'errors.js'`, and `'types.js'` across the four new test modules.
- **Task 3.** `test/runtime/accountRuntime.test.ts` was written in full first, from the plan's behavior block. `npm run build:test` reported `TS2307: Cannot find module '../../src/device/state.js'` and `'../../src/runtime/accountRuntime.js'`. The store and the runtime were then written, and the case passed without a single edit to the test.

The GREEN gate is present for all three tasks. No REFACTOR commit was needed.

## Issues Encountered

- **`node_modules` is absent from the worktree.** Node and npm resolve through the parent repository's `node_modules`, so every script runs. `fallow` prints `node_modules directory not found. Run npm install first for accurate results` on each invocation and then passes. This matches what `01-01` recorded and does not change any gate result.
- **The `trufflehog` pre-commit hook cannot run in a worktree.** It is a git-mode scan and `.git` is a file here, so it aborts on the index. CLAUDE.md documents this and prescribes a filesystem scan over the paths being committed instead. That scan was run before each of the three commits and reported `verified_secrets: 0, unverified_secrets: 0` every time. Each commit then used `SKIP=trufflehog` and no other skip.
- **Testing the per-request deadline needs a real timer.** `AbortSignal.timeout` is native and unaffected by `t.mock.timers`, so the deadline case waits 10 real milliseconds. The stubbed request never settles on its own, so the assertion is driven by the deadline rather than by a sleep.

## Known Stubs

None. No placeholder value, empty return, or unwired path was left behind. Every module this plan creates is reachable from `src/index.ts` through the platform.

## Deferred Items

These are the plan's own boundaries, restated so the next plan knows where to attach:

- The disk token cache, the email fingerprint, and the `invalid_grant` and 429 failure policy. `src/cloud/auth.ts` holds the token in memory only and splits 429 from every other status without applying either policy.
- The structural redacting logger. Until it exists, both failure paths log a fixed message plus a status, which is the interim discipline the plan requires.
- Range validation for `pollInterval` and `offlineConfirmationPollCount`, and the full refusal messages.
- The three remaining REST routes, the shadow client, credential rotation, polling, retry, and backoff.
- Merge semantics for partial shadow patches, the change-notification contract, and `subscribe`.
- `AccountRuntimeOptions.clock` is injected and not yet read. The scheduling work that needs it arrives with the poll and rotation timers.

## User Setup Required

None. No external service configuration is required to build, test, or check this plan's output. Running the plugin against a real account needs Basement Guardian credentials in `config.json`, which is the phase's own deliverable and not a setup step for this plan.

## Next Phase Readiness

Ready. The tracer path is proven and every later plan in this phase extends a module that now exists with a test beside it:

- `npm run check` exits 0 across typecheck, lint, all three `fallow` sub-commands, `format:check`, and both suites.
- All 12 source modules pair with a test module, each at 100 percent lines, branches, and functions run alone.
- `dist/protocol.json` exists after a build and appears in `npm pack --dry-run`.
- `.fallowrc.json` was not touched, and no dead-code suppression was added. Its `ignoreDependencies` list still holds `aedes`, `mqtt`, and `ws`; this plan imported none of them.

## Self-Check: PASSED

- All 19 created files and both modified files exist on disk.
- All three commits are present in `git log`.
- Every task `<acceptance_criteria>` was re-run and passes.
- The plan-level `<verification>` block was re-run: the end-to-end case passes, `fallow` reports no unresolved import, the full unit suite passes 86 cases, `dist/protocol.json` exists after a build, and `npm run check` exits 0.
- `git diff --name-only` against the wave base lists exactly the 21 files the plan declares. No shared planning artifact, no `features/` path, and no `.fallowrc.json` change.
- No stub, skipped test, or unrun verification step remains.

---

*Phase: 01-secure-cloud-foundation*
*Completed: 2026-08-28*
