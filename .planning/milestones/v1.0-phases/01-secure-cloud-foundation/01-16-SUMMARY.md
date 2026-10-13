---
phase: 01-secure-cloud-foundation
plan: 16
subsystem: api
tags: [typescript, fetch, abortsignal, auth0, filesystem, node-test]

# Dependency graph
requires:
  - phase: 01-secure-cloud-foundation
    provides: the typed REST door built in 01-06 and the token cache built in 01-05
  - phase: 01-secure-cloud-foundation
    provides: the deterministic Cucumber gate restored in 01-12
provides:
  - A REST client whose every failure is a typed vendor error, including a success status carrying a body that is not JSON
  - An operation deadline that is built before the token fetch and governs it, so a stated deadline covers the whole operation
  - One shared cache read and one shared in-flight grant, so concurrent callers cannot double the attempt rate against a throttling tenant
  - A token cache write that creates its temporary file exclusively at owner-only mode and removes it on failure
affects: [phase-04-commands, phase-05-resilience]

actuals:
  tokens: 5200
  tasks: 3
  commits: 7

tech-stack:
  added: []
  patterns:
    - "One fixed unreadable-response message shared by a parse failure and a shape failure, so neither leaks vendor bytes"
    - "Deadline-first composition: build the combined AbortSignal before any awaited step the deadline is meant to cover"
    - "Promise-valued latch (a shared promise, not a boolean flag) for a one-time async read"
    - "Exclusive create plus rename for any file whose mode is a security guarantee"

key-files:
  created: []
  modified:
    - src/cloud/api.ts
    - src/cloud/auth.ts
    - test/cloud/api.test.ts
    - test/cloud/auth.test.ts

key-decisions:
  - "The shared in-flight grant is governed by the signal of whichever caller opened it; a joining caller inherits that cancellation rather than getting its own linked signal."
  - "The temporary cache name gained a random suffix, so an occupied temporary name is no longer reachable by a test; the unwritable-cache case is now driven by a read-only storage directory."
  - "The temporary file's permission window is closed by exclusive creation at mode 0600, not by a post-write chmod."

patterns-established:
  - "Deadline-first composition: a signal that bounds an operation is created before the first awaited step, never after it"
  - "Promise-valued latch: a one-time async read is shared as a promise so concurrent callers await one answer instead of racing a boolean"

requirements-completed: [SYNC-01, AUTH-01, AUTH-02]

coverage:
  - id: D1
    description: "A success status whose body is not JSON raises the vendor error class carrying the route and the status, never an untyped parse error"
    requirement: SYNC-01
    verification:
      - kind: unit
        ref: "test/cloud/api.test.ts#refuses a device response whose body is not JSON at all"
        status: pass
    human_judgment: false
  - id: D2
    description: "The operation deadline governs the token fetch as well as the request, so a lapsed token cannot extend a stated deadline"
    requirement: SYNC-01
    verification:
      - kind: unit
        ref: "test/cloud/api.test.ts#deadlines the token fetch with the same signal it deadlines the request with"
        status: pass
      - kind: unit
        ref: "test/cloud/api.test.ts#abandons a command without sending it when its deadline expired before the token was fetched"
        status: pass
    human_judgment: false
  - id: D3
    description: "Concurrent callers share one cache read and one grant, so a lapsed token produces one attempt however many callers want it"
    requirement: AUTH-01
    verification:
      - kind: unit
        ref: "test/cloud/auth.test.ts#AUTH-01 answers two callers that start together from the cache file, without authenticating"
        status: pass
      - kind: unit
        ref: "test/cloud/auth.test.ts#AUTH-01 issues one grant for two callers that start together with no current token"
        status: pass
    human_judgment: false
  - id: D4
    description: "The token cache file is owner-only on every path that produces one, and no failed write leaves a file holding a bearer token behind"
    requirement: AUTH-02
    verification:
      - kind: unit
        ref: "test/cloud/auth.test.ts#AUTH-02 writes an owner-only cache file on a POSIX host where an earlier run left a wider temporary file behind"
        status: pass
      - kind: unit
        ref: "test/cloud/auth.test.ts#D-08 authenticates, keeps serving at debug level, and orphans no temporary file when the cache path cannot be read or written"
        status: pass
      - kind: unit
        ref: "test/cloud/auth.test.ts#AUTH-02 leaves no temporary file beside the cache file it wrote"
        status: pass
    human_judgment: false
  - id: D5
    description: "The existing token-cache guarantees survive the rewrite: cache path, atomic rename, owner-only mode on the final file, salted fingerprint, and deletion on refusal"
    requirement: AUTH-02
    verification:
      - kind: unit
        ref: "npm run test:coverage:direct -- dist-test/src/cloud/auth.js dist-test/test/cloud/auth.test.js (49 cases, 100% lines/branches/functions)"
        status: pass
    human_judgment: false

# Metrics
duration: 20min
completed: 2026-08-29
status: complete
---

# Phase 1 Plan 16: Cloud Client Warnings Summary

**Typed parse failures on the REST path, a command deadline that starts before the token fetch, one grant per lapse however many callers want it, and a token cache that cannot inherit a wider mode or orphan a bearer token**

## Performance

- **Duration:** 20 min
- **Started:** 2026-08-29T11:47:00Z
- **Completed:** 2026-08-29T12:07:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- `narrow()` no longer lets a `SyntaxError` escape. A success status with a body that is not JSON now raises `CloudRequestError` with the route and the status, so every caller branching on the vendor error class keeps its branch and the operator keeps the route label. The parse error's own message, which embeds the first bytes of the response, is dropped rather than reported (T-01-87).
- `send()` builds the combined deadline before fetching the token and hands the same signal to both the token fetch and `fetch`. A lapsed token can no longer push a 2.5-second command past 12.5 seconds. The operation is still attempted exactly once, because a command that timed out may still have reached the device (D-038).
- `currentToken` now shares the cache read as a promise instead of publishing a boolean before the read it guards, and one in-flight grant is shared and cleared on settle. Two callers arriving together produce one grant, not two, against a tenant whose failures extend a thirty-day block (D-22).
- `writeCachedToken` creates its temporary file exclusively (`flag: 'wx'`) at mode `0o600` and removes it when the rename fails. An occupied temporary name is now a failure rather than a silent mode downgrade, and no failed write leaves a bearer token in the Homebridge storage directory.

## Task Commits

Each task was committed atomically, RED then GREEN:

1. **Task 1 (tracer): Every REST failure is typed, and the deadline covers the whole operation** — `5a071bc` (test), `2506990` (fix)
2. **Task 2: One lapsed token produces one grant** — `4b2d2de` (test), `1db8dc5` (fix)
3. **Task 3: The token cache keeps its permissions and leaves nothing behind** — `260f6c4` (test), `2ef1f6b` (fix)

Each RED commit was run and observed to fail for the intended reason before the matching GREEN commit was written:

- `refuses a device response whose body is not JSON at all` — failed with a raw `SyntaxError` escaping `narrow`.
- `deadlines the token fetch with the same signal it deadlines the request with` — failed on signal identity: the token fetch received the root signal, `fetch` received the composite one.
- `abandons a command without sending it when its deadline expired before the token was fetched` — failed with `Missing expected rejection`; the request went out despite an already-expired deadline.
- Both concurrency cases — failed with two grant requests where one was expected.
- `orphans no temporary file` — failed with `.basement-guardian-token.json.<pid>.tmp` still present.
- `owner-only cache file … wider temporary file behind` — failed `420 !== 384`, that is `0o644` where `0o600` was required. This is the WR-05 mode downgrade, reproduced exactly.

## Files Created/Modified

- `src/cloud/api.ts` — `readBody` and `unreadable` added; `narrow` now guards the body read; `send` builds the deadline first and passes it to `idToken`.
- `src/cloud/auth.ts` — `grantAndCache`, `sharedGrant`, `temporaryPath`, and `storeCache` added; `currentToken` shares the cache read and the grant; `writeCachedToken` creates exclusively and cleans up.
- `test/cloud/api.test.ts` — three cases added, plus `stubSignalRecordingFetch` and `stubRecordingAuth`.
- `test/cloud/auth.test.ts` — four cases added, two reworked; `createStoragePath` now restores the directory mode before removing it.

## Decisions Made

- **The shared grant carries one caller's signal.** `sharedGrant` hands `grantAndCache` the signal of whichever caller opened the attempt. A joining caller therefore inherits that caller's cancellation. Combined with the WR-03 fix, a poll that joins a command's grant can be aborted by the command's 2.5-second deadline. This is bounded and self-correcting: `inFlight` is cleared on settle, `fetchGrant` passes an abort through untouched without reporting a transient failure, and the next attempt starts fresh. The alternative — per-caller linked signals over one underlying grant — buys little and costs real complexity in a module already near its unit-size budget. Both the review and the plan prescribed the simple form.
- **The unwritable-cache case is now driven by a read-only storage directory.** The old test forced a write failure by pre-creating a directory at `${cache}.${pid}.tmp`. The random suffix makes that name unreachable, so the mechanism had to change. The case is guarded by `DIRECTORY_MODES_BLOCK_WRITES` (POSIX, non-root), because a directory mode stops a write only for a process the mode applies to. Coverage does not depend on the guard: the rename-failure path is covered portably by the target-is-a-directory case, and `src/cloud/auth.ts` reports 100 percent lines, branches, and functions.
- **The permission window is closed by exclusive creation, not by chmod.** `writeFile`'s `mode` applies only when the file is created, so the fix is to guarantee creation. `flag: 'wx'` means the file either does not exist and is created at `0o600`, or the write fails. There is no interval in which the token bytes sit in a file this process did not create at owner-only mode. Note that a umask cannot widen `0o600` — it can only narrow it — so umask was never the exposure; an occupied name inheriting its own wider mode was.
- **`storeCache` is split so the cleanup cannot itself fail.** `rm` runs only after `writeFile` succeeded, which means the temporary file exists and its directory is writable. A cleanup attempted after a failed create — for instance in the read-only-directory case — would have needed its own error handling and would have introduced a branch no portable test could cover.

## Deviations from Plan

### Behavioral change beyond the four warnings

**1. [Rule 2 - Missing Critical] Reworked one existing test's failure mechanism**

- **Found during:** Task 3
- **Issue:** `AUTH-02 leaves an earlier cache file byte-for-byte unchanged when the temporary file cannot be written` forced its failure by occupying `${cache}.${pid}.tmp`. The random suffix required by the plan makes that name unreachable, so the test would have passed vacuously — it would have exercised a successful write while claiming to exercise a failed one.
- **Fix:** The case now makes the storage directory read-only, which is a real way for the temporary write to fail, and is guarded to hosts where a directory mode is enforced.
- **Files modified:** `test/cloud/auth.test.ts`
- **Verification:** The case fails if the assertion is inverted; `npm run check` exits 0; direct coverage on the auth pair is 100 percent.
- **Committed in:** `260f6c4`

**2. [Rule 3 - Blocking] `createStoragePath` now restores the directory mode before removing it**

- **Found during:** Task 3
- **Issue:** A case that makes its storage directory read-only leaves its own contents undeletable, so the shared `t.after` cleanup would fail and leak a temporary directory into `/tmp`.
- **Fix:** The cleanup chmods back to `0o700` before `rm`.
- **Files modified:** `test/cloud/auth.test.ts`
- **Verification:** Full unit suite green across repeated runs; no `basement-guardian-auth-*` directories left behind.
- **Committed in:** `260f6c4`

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking). Both are inside `test/cloud/auth.test.ts`, which is a declared file of this plan.
**Impact on plan:** No scope creep. Both changes are consequences of the random temporary suffix the plan itself required.

## Issues Encountered

- **`npm run test:coverage:direct -- <src>` alone runs the wrong tests.** The script ends in `--test-coverage-include`, so a single argument becomes the include value and leaves `node --test` with no test glob; it then discovers `test/**/*.ts` and fails on every file. Both arguments are needed: `npm run test:coverage:direct -- "dist-test/src/cloud/api.js" "dist-test/test/cloud/api.test.js"`. The plan's `<verify>` blocks carry the one-argument form. This is a documentation defect in the plan, not in the code, and it is recorded here so the next plan to use that command does not lose time to it.
- **The RED case for the deadline had to be written so it fails rather than hangs.** The natural formulation — a token fetch that never settles until its signal aborts — hangs forever under the unfixed code, because the signal it receives never aborts. The committed case instead expires the deadline before the call, so the unfixed code sends the request and resolves (failing `assert.rejects`) while the fixed code refuses before reaching the vendor. A future regression fails the suite instead of stalling CI.
- **TruffleHog cannot run in git mode from a linked worktree.** This is the structural failure `CLAUDE.md` documents. Every commit was preceded by a filesystem-mode scan over the exact paths being committed, at `--results=verified,unknown`, all clean at 0 verified and 0 unverified.

## Verification Results

- `npm run check` — exit 0.
- Unit suite — 393 tests, 393 pass, 0 fail (386 before this plan; 7 added).
- `npm run test:coverage:direct` on `src/cloud/api.ts` — 100 percent lines, branches, functions.
- `npm run test:coverage:direct` on `src/cloud/auth.ts` — 100 percent lines, branches, functions.
- `fallow` — 0 files above threshold, dead files 0.0 percent, dead exports 0.0 percent, duplication 0.0 percent, maintainability 92.8.
- Cucumber — three consecutive runs, all exit 0, 32 scenarios and 266 steps passing each time (10.9 s, 10.1 s, 10.7 s).

## Guarantees Deliberately Not Regressed

Each was re-read in the post-change source and is covered by a passing case:

- The cache path is still `<storagePath>/.basement-guardian-token.json`.
- The write is still temp-then-rename, and the rename is still atomic.
- The final file is still `0o600`, on a first write and on a rewrite over a widened file.
- The fingerprint is still a salted SHA-256 over the account email, and neither the email nor the password reaches the file.
- The cache is still deleted when the vendor refuses the credentials.
- The `registerSecret` call site is **unchanged**: still `options.registerSecret(cached.idToken)`, one argument, no role. `registerSecret` does not appear anywhere in this plan's diff. The bearer token is meant to be retained permanently, which is what the no-role form means, and plan 01-15's optional second parameter keeps this compiling.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 4 can rely on the command deadline meaning what it says. The failure this closes would have been user-visible there as a HomeKit write hanging well past HomeKit's patience.
- One thing for a later reader to weigh, not a blocker: a caller joining a shared grant inherits the opening caller's deadline. If Phase 4 finds a background poll being cancelled by a command's 2.5-second deadline often enough to matter, the fix is per-caller linked signals over one underlying grant. Nothing here forecloses that.
- Nothing was touched outside the four declared files.

## Self-Check: PASSED

All five claimed files exist on disk. All six claimed commits exist in the branch history
(`5a071bc`, `2506990`, `4b2d2de`, `1db8dc5`, `260f6c4`, `2ef1f6b`). The diff against the
worktree base touches exactly the four declared files and nothing else.

---
*Phase: 01-secure-cloud-foundation*
*Completed: 2026-08-29*
