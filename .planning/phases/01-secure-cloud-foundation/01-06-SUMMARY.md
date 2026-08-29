---
phase: 01-secure-cloud-foundation
plan: 06
subsystem: api
tags: [rest, fetch, abortsignal, type-predicates, aws-iot-credentials, tdd]

requires:
  - phase: "01-02"
    provides: "src/cloud/types.ts, src/cloud/api.ts, CloudRequestError, and the AbortSignal.any request discipline"
provides:
  - "`AwsCredentials`, `AwsCredentialsResponse`, `DeviceCommand`, and `CommandResult`, the remaining vendor wire types"
  - "`isAwsCredentialsResponse` and `isCommandResult`, hand-written predicates for the credential and command answers"
  - "`ROUTES`, the closed four-route surface, and `COMMAND_DEADLINE_MS`"
  - "`CloudApi.device`, `CloudApi.awsCredentials`, and `CloudApi.sendCommand` beside discovery"
  - "One private request helper owning the base URL join, the bearer header, the composed deadline, the status check, and the predicate check"
affects: [01-07, 01-09, 01-10, 01-11, shadow-client, controls-phase]

actuals:
  tokens: 11700
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "A closed `as const` route object plus an exact-set assertion, so an excluded route family cannot be reached without failing the suite"
    - "One typed call descriptor per operation, carrying its route label, path, deadline, body, and narrowing predicate"
    - "A shared string-field guard, so a predicate states its string fields once instead of repeating a typeof check per field"
    - "Recording the deadline a route asks for, so a case reads a 2500 ms deadline without waiting it out"

key-files:
  created: []
  modified:
    - src/cloud/types.ts
    - src/cloud/api.ts
    - test/cloud/types.test.ts
    - test/cloud/api.test.ts
    - test/runtime/accountRuntime.test.ts
    - features/support/fakeRestApi.ts

key-decisions:
  - "`CloudApiOptions` keeps its three fields; the `log` member the interfaces block sketched is omitted because the module logs nothing"
  - "The Cucumber fake REST service reads its wire shapes from src/cloud/types.ts instead of restating them"
  - "A test records the deadline each route asks for rather than waiting 2500 ms for one to elapse"
  - "The default request timeout in the API test fixture is 10 seconds, matching production, so a case can tell the two deadlines apart"

patterns-established:
  - "Call descriptor plus one shared send helper: every operation is a thin body over the same authorization, deadline, status, and shape checks"
  - "A test double for a widened port names its unreachable members and rejects them, instead of a Partial cast"

requirements-completed: [SYNC-01]

coverage:
  - id: D1
    description: "The runtime reaches the vendor through exactly four typed REST operations and no other route is reachable from the client"
    requirement: SYNC-01
    verification:
      - kind: unit
        ref: "test/cloud/api.test.ts#reaches exactly the four vendor routes this version uses"
        status: pass
      - kind: unit
        ref: "test/cloud/api.test.ts#reads one device from the device route"
        status: pass
      - kind: unit
        ref: "test/cloud/api.test.ts#reads the shadow endpoint, the client identifier, and the temporary credentials"
        status: pass
      - kind: unit
        ref: "test/cloud/api.test.ts#sends a device command as a desiredData body and reports the vendor answer"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every request carries an Authorization bearer header built from the auth client's token"
    requirement: SYNC-01
    verification:
      - kind: unit
        ref: "test/cloud/api.test.ts#authorizes the device request with the bearer token the auth client supplies"
        status: pass
      - kind: unit
        ref: "test/cloud/api.test.ts#reads one device from the device route"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every request aborts on the shared root signal and on its own deadline, whichever fires first"
    requirement: SYNC-05
    verification:
      - kind: unit
        ref: "test/cloud/api.test.ts#aborts an in-flight device request when the root signal aborts"
        status: pass
      - kind: unit
        ref: "test/cloud/api.test.ts#aborts a device request on its own deadline while the root signal stays open"
        status: pass
      - kind: unit
        ref: "test/cloud/api.test.ts#aborts a command on its own deadline while the root signal stays open"
        status: pass
    human_judgment: false
  - id: D4
    description: "A command waits at most 2500 milliseconds for vendor acceptance, which is shorter than the read routes' request timeout"
    verification:
      - kind: unit
        ref: "test/cloud/api.test.ts#waits at most 2500 milliseconds for the vendor to accept a command"
        status: pass
      - kind: unit
        ref: "test/cloud/api.test.ts#deadlines a command with the command deadline rather than the request timeout"
        status: pass
      - kind: unit
        ref: "test/cloud/api.test.ts#deadlines a read route with the configured request timeout"
        status: pass
    human_judgment: false
  - id: D5
    description: "A response body is typed unknown at the boundary and narrowed by a hand-written predicate; a rejected shape raises CloudRequestError"
    requirement: SYNC-01
    verification:
      - kind: unit
        ref: "test/cloud/types.test.ts#rejects a record with no session token"
        status: pass
      - kind: unit
        ref: "test/cloud/api.test.ts#refuses a credential response whose shape the plugin cannot read"
        status: pass
      - kind: unit
        ref: "test/cloud/api.test.ts#refuses a command response whose shape the plugin cannot read"
        status: pass
    human_judgment: false
  - id: D6
    description: "No token, base URL, response body, or account identifier reaches an error field"
    requirement: AUTH-02
    verification:
      - kind: unit
        ref: "test/cloud/api.test.ts#keeps the token, the base URL, and the response body out of a failed request error"
        status: pass
    human_judgment: false
  - id: D7
    description: "A device identifier needing percent-encoding produces an encoded path segment, not a literal one"
    verification:
      - kind: unit
        ref: "test/cloud/api.test.ts#encodes a device identifier that needs percent-encoding into the path"
        status: pass
    human_judgment: false
  - id: D8
    description: "A device record's data object is carried through untouched, with no key added, removed, renamed, or converted"
    requirement: SYNC-01
    verification:
      - kind: unit
        ref: "test/cloud/types.test.ts#accepts a device that has reported no telemetry yet"
        status: pass
      - kind: unit
        ref: "test/cloud/api.test.ts#reads one device from the device route"
        status: pass
    human_judgment: false
  - id: D9
    description: "npm run check passes across typecheck, lint, all three fallow sub-commands, format:check, and both test suites"
    verification:
      - kind: other
        ref: "npm run check (exit 0)"
        status: pass
    human_judgment: false
  - id: D10
    description: "The four operations work against the live vendor REST API"
    verification: []
    human_judgment: true
    rationale: "Every case runs against a stubbed fetch or the loopback fake. The route paths, the command body, and the credential response shape come from captured vendor traffic, but no request from this code has reached the real service. Only a maintainer with a real account can confirm that, and the command routes need a real Gemini to answer."

duration: 28min
completed: 2026-08-29
status: complete
---

# Phase 1 Plan 06: Typed Vendor REST Door Summary

**Four typed vendor operations behind one closed `ROUTES` object, each authorized, deadlined, and narrowed by a hand-written predicate before its answer leaves the client.**

## Performance

- **Duration:** 28 min
- **Started:** 2026-08-29T00:44:00Z
- **Completed:** 2026-08-29T01:12:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- The client now reaches device discovery, one device, temporary AWS IoT credentials, and a device command, and nothing else. `ROUTES` is a closed `as const` object and a test asserts its exact value set, so adding a fifth route fails the suite rather than quietly widening the surface the coverage matrix recorded.
- Every operation is a thin body over one shared helper. That helper owns the base URL join, the bearer header, the composed deadline, the status check, and the predicate check, so no operation can return a body it did not verify.
- The credential and command answers are narrowed like the device answers were. `isAwsCredentialsResponse` requires all four capitalized credential field names; `isCommandResult` accepts `{ success: false }`, because a refusal is a valid answer and must not raise.
- A command uses the 2500-millisecond deadline while a read uses the configured request timeout, and one case reads each deadline without waiting for it.
- A failed request carries the numeric status and the route label. One case asserts that the token, the base URL, the account-bearing device identifier, and the vendor's own error text all stay out of the error.
- The Cucumber fake REST service reads its wire shapes from `src/cloud/types.ts` instead of restating them, which is what its own module note anticipated and what keeps the duplication gate green.
- `npm run check` exits 0 with 242 unit tests and 10 Cucumber scenarios (61 steps) passing, up from 201 and 10.

## Task Commits

1. **Task 1: Narrow every vendor payload with a hand-written predicate** - `dcc6e12` (feat)
2. **Task 2: Complete the four typed routes with composed deadlines** - `f635ac7` (feat)

## Files Created/Modified

- `src/cloud/types.ts` - Adds `AwsCredentials`, `AwsCredentialsResponse`, `DeviceCommand`, `CommandResult`, and two predicates; extracts a shared string-field guard
- `src/cloud/api.ts` - Adds `ROUTES`, `COMMAND_DEADLINE_MS`, and the device, credentials, and command operations over one shared request helper
- `test/cloud/types.test.ts` - Data-driven rejection rows for all four predicates, plus the outbound `DeviceCommand` type contract
- `test/cloud/api.test.ts` - Nineteen cases covering the route set, both deadlines, encoding, authorization, and the error's contents
- `test/runtime/accountRuntime.test.ts` - Replaces two partial `CloudApi` literals with a discovery-only double whose other routes reject
- `features/support/fakeRestApi.ts` - Reads and re-exports the wire shapes from `src/cloud/types.ts`

## Decisions Made

- **`CloudApiOptions` keeps its three fields.** The plan's `<interfaces>` block sketched a fourth, `log: Logging`. Nothing in the module logs, and the plan's own prohibition is that no header value, token, or body reaches a log line. A required-but-unread field would have forced edits to `src/platform.ts` and `test/runtime/accountRuntime.test.ts`, both outside this plan's declared files, to pass a value nobody reads. The field is omitted; a later plan that needs it can add it with its first consumer.

- **The fake REST service reads the real wire types.** Adding `AwsCredentials` and `AwsCredentialsResponse` to `src/cloud/types.ts` pushed `fallow dupes` to 2.9 percent across two files and failed the gate, because the harness had declared the same four shapes. Re-pointing the harness closes it and has a second benefit: a scenario can no longer arm a payload the production predicates would reject.

- **A test records the deadline rather than waiting it out.** `AbortSignal.timeout` is native and unaffected by `t.mock.timers`, so proving the 2500-millisecond command deadline by elapsing it would put a 2.5-second wait in the unit suite. Two cases replace `AbortSignal.timeout` with a recorder and assert the deadline each route asked for; a third replaces it with a controller the case aborts, proving the command still rejects on its own deadline while the root signal stays open.

- **The API test fixture's request timeout is 10 seconds.** That is the production value, and it is longer than the command deadline, which is what lets a case tell the two apart. The previous fixture used 1 second, which would have made the command deadline the longer of the two and inverted the relation the plan states.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The duplication gate failed once the credential types existed**

- **Found during:** Task 1
- **Issue:** `features/support/fakeRestApi.ts` declared `ApiConnectivity`, `ApiDevice`, `AwsCredentials`, and `AwsCredentialsResponse` for itself. Once `src/cloud/types.ts` carried the same four shapes, `fallow dupes --fail-on-issues` reported one 48-line clone group and 2.9 percent duplication across the two files, and failed. `.fallowrc.json` is owned by other plans and was not touched.
- **Fix:** The harness imports the two shapes it uses from `src/cloud/types.ts` and re-exports them, so its own consumers keep importing from `../fakeRestApi.js`. Its module note said to do exactly this once the shared module was reachable.
- **Files modified:** `features/support/fakeRestApi.ts`
- **Verification:** `fallow dupes` reports no duplication; the 10 Cucumber scenarios still pass.
- **Committed in:** `dcc6e12`

**2. [Rule 3 - Blocking] Two runtime cases built a partial CloudApi**

- **Found during:** Task 2
- **Issue:** `test/runtime/accountRuntime.test.ts` declared `const api: CloudApi = { devices: ... }` in two cases. Widening `CloudApi` from one operation to four made both stop compiling with TS2739.
- **Fix:** A local `discoveryOnlyApi(devices)` returns a complete `CloudApi` whose other three routes reject with a named error. The unit-testing rule forbids a broad `Partial<T>` cast, and a rejecting member is stronger than a silent one: a runtime that reached the credentials or command route would now fail the case instead of passing.
- **Files modified:** `test/runtime/accountRuntime.test.ts`
- **Verification:** Both cases still assert their exact recorded log, and the pair still reports 100 percent lines, branches, and functions run alone.
- **Committed in:** `f635ac7`

**3. [Rule 3 - Blocking] The lint indent rule rejected the request-init ternary**

- **Found during:** Task 2
- **Issue:** Choosing between a bodyless read init and a JSON command init with a multi-line ternary produced formatting that Prettier and the `@stylistic` `indent` rule disagree about; `eslint --max-warnings=0` reported five indent errors that `prettier --write` did not remove.
- **Fix:** The choice moved into a named `requestInit` function with an early return. It also reads better and keeps `send` well under the 60-line unit budget.
- **Files modified:** `src/cloud/api.ts`
- **Verification:** `npm run lint` and `npm run format:check` both exit 0; `src/cloud/api.ts` still reports 100 percent branch coverage, so both init shapes are exercised.
- **Committed in:** `f635ac7`

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** Each fix was needed to pass a gate the plan itself names. Two touched files outside the plan's declared list — `features/support/fakeRestApi.ts` and `test/runtime/accountRuntime.test.ts` — and both were forced by changes the plan mandates. No acceptance criterion was weakened, and `.fallowrc.json` was not touched.

## Issues Encountered

- **`node_modules` is absent from the worktree.** Node and npm resolve through the parent repository, so every script runs. `fallow` prints a warning about it on each invocation and then passes, matching what `01-01` and `01-02` recorded.
- **The `trufflehog` pre-commit hook cannot run in a worktree.** It is a git-mode scan and `.git` is a file here. A filesystem scan over the paths being committed was run before each commit and reported `verified_secrets: 0, unverified_secrets: 0` both times. Each commit used `SKIP=trufflehog` and no other skip.
- **`npm run test:coverage:all` reports `src/platform.js` at 85.71 percent function coverage.** This predates this plan: neither `src/platform.ts` nor `test/platform.test.ts` is in this plan's diff against the wave base, and the aggregate coverage script is not part of `npm run check`. Recorded below as a deferred item rather than fixed, because it is out of this plan's scope.

## Known Stubs

None. Every operation performs a real request, narrows a real answer, and is exercised by a case that would fail if it did not.

## Deferred Items

- **`src/platform.js` function coverage is 85.71 percent when run alone.** One of its seven functions is never entered by `test/platform.test.ts`. It arrived with an earlier plan in this phase and blocks nothing today, because `npm run check` runs `npm test` rather than `npm run test:coverage:all`. Whichever plan next edits `src/platform.ts` should close it, or the phase's verification step should.
- The shadow client that consumes `awsCredentials`, and the controls that call `sendCommand`. This plan ships the typed door; the self-test and alarm-mute commands that travel through it belong to the controls phase.
- Retry and backoff for the read routes. `sendCommand` deliberately performs exactly one attempt and must stay that way.

## User Setup Required

None. No external service configuration is required to build, test, or check this plan's output.

## Next Phase Readiness

Ready. The contract plans 09 and 10 are written against now exists and is tested:

- `npm run check` exits 0 across typecheck, lint, all three `fallow` sub-commands, `format:check`, and both suites: 242 unit tests and 10 Cucumber scenarios, up from 201 and 10 with no regression.
- Both source-test pairs report 100 percent lines, branches, and functions run alone.
- `.fallowrc.json` was not touched and no dead-code suppression was added.
- `ROUTES` is closed and asserted, so the excluded route families in `01-COVERAGE.md` stay unreachable without a failing test.

## TDD Gate Compliance

Each task produced one `feat:` commit rather than a `test:` then `feat:` pair, for the reason `01-02` recorded and which still holds. A test module that imports a symbol its source module does not yet export cannot be committed here: `npm run build:test` fails to compile it, typed lint turns the resulting error-typed imports into errors at zero warnings, and `fallow` runs over the whole repository. All three are local pre-commit hooks and `CLAUDE.md` forbids `--no-verify`.

The RED step was therefore observed in the working tree before any implementation:

- **Task 1.** The predicate tests were written first. `npm run build:test` reported `TS2305: Module '"../../src/cloud/types.js"' has no exported member 'isAwsCredentialsResponse'`, the same for `isCommandResult`, and for the `AwsCredentialsResponse` type.
- **Task 2.** The route tests were written first. `npm run build:test` reported `TS2305` for `COMMAND_DEADLINE_MS` and `ROUTES`, and `TS2339`/`TS2551` for `device`, `awsCredentials`, and `sendCommand` across ten call sites.

In both tasks the source was then written and the tests passed with no edit to the assertions. The GREEN gate is present for both. No REFACTOR commit was needed; the one refactor performed (extracting `requestInit`) happened before the task's own commit and is part of it.

## Self-Check: PASSED

- All six modified files exist on disk and appear in `git diff --name-only` against the wave base: `src/cloud/types.ts`, `src/cloud/api.ts`, `test/cloud/types.test.ts`, `test/cloud/api.test.ts`, `test/runtime/accountRuntime.test.ts`, `features/support/fakeRestApi.ts`.
- Both commits are present in `git log`: `dcc6e12` and `f635ac7`.
- Neither commit deletes a tracked file; `git diff --diff-filter=D` is empty for both.
- Every task acceptance criterion was re-run: `node --test` passes both pairs, `npm run test:coverage:direct` reports 100 percent for each pair alone, and `npm run check` exits 0.
- `.fallowrc.json`, `.planning/STATE.md`, and `.planning/ROADMAP.md` are untouched.
- No stub, skipped test, or unrun verification step remains.

---

*Phase: 01-secure-cloud-foundation*
*Completed: 2026-08-29*
