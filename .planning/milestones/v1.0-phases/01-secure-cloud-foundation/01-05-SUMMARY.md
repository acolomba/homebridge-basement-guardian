---
phase: 01-secure-cloud-foundation
plan: 05
subsystem: auth
tags: [auth0, oauth, token-cache, filesystem, sha256, homebridge, node-test]

requires:
  - phase: 01-secure-cloud-foundation
    provides: "The password-realm grant, the in-memory token, and the typed cloud errors from plan 02"
  - phase: 01-secure-cloud-foundation
    provides: "The redacting logger and the config refusal path from plan 04"
provides:
  - "An owner-only token cache under the Homebridge storage path that survives a restart"
  - "A salted email fingerprint that invalidates the cache when the configured account changes"
  - "An atomic temporary-file-then-rename cache write that resists a drifted file mode and a truncated write"
  - "A failure policy that stops on a refused credential, retries a throttle on a long interval, and treats everything else as transient"
  - "AuthHaltedError, AuthThrottledError.retryAfterMs, and the transient CloudRequestError shape the account runtime routes on"
affects: [01-10 account runtime wiring, 01-11 end-to-end verification, retry policy, shadow transport]

actuals:
  tokens: 16149
  tasks: 2
  commits: 6

tech-stack:
  added: []
  patterns:
    - "Temporary sibling file at owner-only mode, renamed over the target, for every security-sensitive file write"
    - "Injected storage path and salt source, so filesystem and randomness are testable through the module's exports"
    - "Failure classes carry structured fields; callers branch on class and field, never on message text"
    - "Consecutive-failure log damping held in a per-client policy record"

key-files:
  created: []
  modified:
    - src/cloud/auth.ts
    - src/cloud/errors.ts
    - src/platform.ts
    - test/cloud/auth.test.ts
    - test/cloud/errors.test.ts
    - test/platform.test.ts
    - test/runtime/accountRuntime.test.ts

key-decisions:
  - "The renewal margin is one hour: it exceeds the longest configurable poll interval, so a token cannot lapse while a request is in flight."
  - "A fresh salt is generated on every cache write rather than held in the client. The salt travels in the file, so the comparison is stable across restarts without any in-memory state."
  - "A missing cache file logs nothing; only an unreadable, malformed, mismatched, or stale cache logs at debug. A first start is ordinary, not an event."
  - "A cache write that fails is not a hard failure. The token is already usable, so the cost is one grant on the next start."
  - "Every client error that is not a throttle is terminal, because the vendor does not publish the code it returns for a wrong password."
  - "A network error carries HTTP status 0 in CloudRequestError, the conventional stand-in for a status that never arrived."
  - "The halt is scoped to the client instance, which the composition root builds once per process, so it lasts until Homebridge restarts."

patterns-established:
  - "Owner-only atomic write: write a per-process temporary sibling with mode 0o600, then rename over the target. The permission assertion runs after a second write, the only ordering that catches the defect."
  - "Salted fingerprint in place of an identifier: store the salt beside the digest so a configuration change invalidates a cache without the file ever holding the raw value."
  - "Per-client failure policy record: one place holds the halted reason and the last transient kind, so log damping and the stop latch do not leak into module scope."

requirements-completed: [AUTH-01, AUTH-02]

coverage:
  - id: D1
    description: "A valid unexpired cached token is reused across a restart with no network call, and a token inside the renewal margin triggers reauthentication before it expires."
    requirement: AUTH-01
    verification:
      - kind: unit
        ref: "test/cloud/auth.test.ts#AUTH-01 answers from the cache file a restart left behind, without authenticating"
        status: pass
      - kind: unit
        ref: "test/cloud/auth.test.ts#AUTH-01 authenticates before expiry when the cached token expires inside the renewal margin"
        status: pass
    human_judgment: false
  - id: D2
    description: "The token cache lives under the injected Homebridge storage path and holds the token, the expiry, a salted fingerprint, and the salt, but never the raw email or the password."
    requirement: AUTH-02
    verification:
      - kind: unit
        ref: "test/cloud/auth.test.ts#AUTH-01 stores the granted token in the cache file under the storage path"
        status: pass
      - kind: unit
        ref: "test/cloud/auth.test.ts#AUTH-02 writes neither the account email nor the account password into the cache file"
        status: pass
    human_judgment: false
  - id: D3
    description: "The cache write is atomic and owner-only: a rewrite over an existing file restores owner-only permissions, and an interrupted temporary write leaves the previous file byte-for-byte unchanged."
    requirement: AUTH-02
    verification:
      - kind: unit
        ref: "test/cloud/auth.test.ts#AUTH-02 restores owner-only permissions on a POSIX host when a second grant rewrites the cache file"
        status: pass
      - kind: unit
        ref: "test/cloud/auth.test.ts#AUTH-02 leaves an earlier cache file byte-for-byte unchanged when the temporary file cannot be written"
        status: pass
    human_judgment: false
  - id: D4
    description: "An unreadable, malformed, expired, or fingerprint-mismatched cache logs at debug and reauthenticates; a changed account email invalidates the cache."
    requirement: AUTH-02
    verification:
      - kind: unit
        ref: "test/cloud/auth.test.ts#D-08 authenticates again when the cache file fingerprints a different account email"
        status: pass
      - kind: unit
        ref: "test/cloud/auth.test.ts#D-08 authenticates again and notes it once at debug when the cache file is not valid JSON"
        status: pass
    human_judgment: false
  - id: D5
    description: "A refused credential stops authentication: one actionable error names the fix, the cache file is deleted, and every later call answers without a request."
    requirement: AUTH-01
    verification:
      - kind: unit
        ref: "test/cloud/auth.test.ts#D-13 deletes the cached token when the vendor refuses the account credentials"
        status: pass
      - kind: unit
        ref: "test/cloud/auth.test.ts#D-13 makes no further attempt once the vendor has refused the account credentials"
        status: pass
      - kind: unit
        ref: "test/cloud/auth.test.ts#D-13 logs one error naming the fix when the vendor refuses the account credentials"
        status: pass
    human_judgment: false
  - id: D6
    description: "An HTTP 429 is retried on a thirty-minute interval rather than the capped backoff, with one warning naming the 429, the thirty-day window, and how to stop the plugin."
    requirement: AUTH-01
    verification:
      - kind: unit
        ref: "test/cloud/auth.test.ts#D-22 answers a throttled grant with the long retry interval"
        status: pass
      - kind: unit
        ref: "test/cloud/auth.test.ts#D-22 warns once, naming the 429, the thirty-day window, and how to stop the plugin"
        status: pass
    human_judgment: false
  - id: D7
    description: "A transient failure keeps the cache and the client: the first is warned, an immediate repeat drops to debug, recovery reports at info, and an abort passes through unlogged."
    requirement: AUTH-01
    verification:
      - kind: unit
        ref: "test/cloud/auth.test.ts#D-14 warns once, drops the repeat to debug, and reports the recovery at info"
        status: pass
      - kind: unit
        ref: "test/cloud/auth.test.ts#lets an abort through untouched and logs nothing for it"
        status: pass
    human_judgment: false
  - id: D8
    description: "The on-disk cache is owner-only on a real Homebridge host, where the storage directory, its umask, and its owner are the operator's rather than a temporary directory's."
    verification: []
    human_judgment: true
    rationale: "The permission assertion runs against a per-case temporary directory. Only a real installation shows the file mode under the operator's own umask, storage path, and account."

duration: 30 min
completed: 2026-08-28
status: complete
---

# Phase 1 Plan 5: Unattended Authentication Summary

**An owner-only, atomically written token cache under the Homebridge storage path, keyed by a salted email fingerprint, with each authentication failure routed to the one answer that is safe for it.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-08-29T00:18:00Z
- **Completed:** 2026-08-29T00:48:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- A restart reuses a valid cached token with no network call, and a token inside a one-hour renewal margin is replaced before it lapses rather than after a request is refused.
- The cache file holds the token, its expiry, a SHA-256 fingerprint of the configured email over a stored salt, and that salt. It never holds the raw email or the password, and it lives only under the injected Homebridge storage path.
- Every cache write goes to a per-process temporary sibling at mode `0o600` and is renamed over the target. A rewrite therefore restores owner-only permissions even when the existing file drifted to `0o644`, and an interrupted write leaves the previous file untouched.
- A refused credential stops authentication for the life of the process: the cache is deleted, one error names the fix, and every later call answers with `AuthHaltedError` without touching the network.
- A throttling response is retried on a thirty-minute interval, with a warning that names the HTTP 429, states that a real block clears only thirty days after the last attempt, and tells the operator how to stop the plugin.
- A transient failure leaves the cache and the client intact, warns once per kind, drops an immediate repeat to debug, and reports recovery at info. An abort the caller asked for travels through untouched and silent.

## Task Commits

1. **Task 1: Cache the token under the storage path, atomically and owner-only** — `8f9001e` (test, RED), `75a2d2d` (feat, GREEN)
2. **Task 2: Route every authentication failure to its correct response** — `6336549` (test, RED), `870bf38` (feat, GREEN), `f76728a` (test, strengthened case), `996814b` (docs, stated assumption)

## Files Created/Modified

- `src/cloud/auth.ts` — Adds the disk cache, the salted fingerprint, the renewal margin, the atomic owner-only write, and the whole failure policy.
- `src/cloud/errors.ts` — Adds `AuthHaltedError` and the `retryAfterMs` field on `AuthThrottledError`. `CloudRequestError` is unchanged, as the shared-type freeze requires.
- `src/platform.ts` — Injects `api.user.storagePath()` and a `randomBytes` salt source into the auth client.
- `test/cloud/auth.test.ts` — 42 cases covering the cache, the fingerprint, the file mode, the atomic write, and every failure class.
- `test/cloud/errors.test.ts` — Covers the new class and the new fields.
- `test/platform.test.ts` — Mocks the Homebridge storage path for the three cases that accept a configuration.
- `test/runtime/accountRuntime.test.ts` — Gives each case its own storage directory, since the real auth client now writes a cache.

## Decisions Made

- **The renewal margin is one hour.** It is longer than the largest configurable poll interval, so a token handed to a caller cannot expire while its request is in flight. A cache that expires in thirty minutes triggers a grant; one that expires in thirty days is reused. The pair of cases pins the margin between those bounds.
- **The salt is generated per write, not held in the client.** The salt travels in the file and the comparison reads it back, so it is stable across restarts with no in-memory state and no separate salt file.
- **A missing cache file logs nothing.** `D-08` names unreadable, malformed, expired, and mismatched as the debug-worthy cases. A first start is none of those. This also keeps the runtime's own log assertions clean.
- **A cache write failure is not a hard failure.** The grant already succeeded, so the plugin logs at debug and serves the token from memory. The cost is one extra grant on the next start.
- **Any client error that is not a throttle is terminal.** The vendor does not publish the code it returns for a wrong password. Stopping on a failure that was actually retryable costs a restart; retrying into a block costs thirty days measured from the last attempt.
- **A network error carries status `0`.** `CloudRequestError.status` is frozen as a number, and zero is the conventional stand-in for a status that never arrived.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Wired the storage path and the salt source through the composition root**

- **Found during:** Task 1
- **Issue:** `storagePath` and `createSalt` are required members of `AuthClientOptions`, so `src/platform.ts` and the two test modules that build a real auth client no longer compiled. Plan 10 owns the eventual platform wiring, but the tree has to typecheck now.
- **Fix:** `src/platform.ts` passes `this.api.user.storagePath()` and a `randomBytes(16).toString('hex')` salt source. `test/platform.test.ts` mocks `api.user` with a per-case temporary directory; `test/runtime/accountRuntime.test.ts` gives each case its own storage directory, removed in `t.after()`.
- **Files modified:** `src/platform.ts`, `test/platform.test.ts`, `test/runtime/accountRuntime.test.ts`
- **Verification:** `npm run check` exits 0; 201 unit cases and 10 Cucumber scenarios pass.
- **Committed in:** `8f9001e`

**2. [Rule 2 - Missing Critical] Handled a failure body that is not JSON**

- **Found during:** Task 2
- **Issue:** The grant path called `response.json()` unguarded. A gateway in front of the tenant answering HTTP 502 with an HTML error page would have thrown a raw `SyntaxError`, bypassing the failure policy entirely: no transient classification, no log damping, no typed error for the runtime to route on.
- **Fix:** The body is read through a guard that returns `undefined` when it cannot be parsed. The status alone then decides the class, which for 502 is transient.
- **Files modified:** `src/cloud/auth.ts`, `test/cloud/auth.test.ts`
- **Verification:** New case `treats a failure body that is not JSON as transient, on the status alone` asserts `CloudRequestError` with status 502.
- **Committed in:** `870bf38`

**3. [Rule 1 - Bug] Corrected an expectation that a blocked cache path logs only once**

- **Found during:** Task 2 (surfaced in Task 1's GREEN step)
- **Issue:** The case that makes the cache path unreadable expected exactly one debug note. The same obstruction also blocks the rewrite, so the implementation correctly emits a second note. The expectation, not the code, was wrong.
- **Fix:** The case now asserts both notes and its title says so.
- **Files modified:** `test/cloud/auth.test.ts`
- **Verification:** Case passes and still asserts the complete message list.
- **Committed in:** `75a2d2d`

---

**Total deviations:** 3 auto-fixed (1 blocking, 1 missing critical, 1 test bug)
**Impact on plan:** No scope creep. Deviation 1 is the minimum needed to keep the tree compiling and does not pre-empt plan 10, which still owns the account-runtime wiring. Deviation 2 closes a real hole in a failure path. Deviation 3 corrects a test expectation, not behavior.

## Notes on the plan's acceptance criteria

- **"Cases prove that invalid JSON, a missing field, and an unreadable path each produce one debug log."** The invalid-JSON and missing-field cases produce exactly one. The unreadable-path case produces two, because a cache path that cannot be read also cannot be written; both notes are asserted.
- **REQUIREMENTS.md was deliberately not touched.** `AUTH-01` and `AUTH-02` are declared by plans 02, 04, 08, 10, and 11 as well, so the shared-ID gate must not mark them complete until every declaring plan has a summary. The IDs are recorded in `requirements-completed` for the orchestrator.

## Issues Encountered

- **A RED commit cannot be red at the type level.** The pre-commit hooks run `typecheck`, `lint`, and `fallow` on every commit, so a test importing a symbol that does not exist blocks the commit. Both RED commits therefore carry the minimum compiling surface the cases need, following the precedent plan 04 set. Task 1's RED commit had 12 of 28 cases failing; Task 2's had 14 of 47.
- **The TruffleHog pre-commit hook cannot run in a linked worktree.** It is a git-mode scan and `.git` is a file here. Each commit was preceded by a filesystem scan over the exact paths being committed, reporting `verified_secrets: 0` and `unverified_secrets: 0`, and used `SKIP=trufflehog` for that hook alone, as `CLAUDE.md` prescribes.

## Known Stubs

None. No hardcoded empty value, placeholder string, or unwired path was left behind.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- The auth client is ready for plan 10 to wire into the account runtime. Plan 10 should keep the storage path and salt source it finds in `src/platform.ts` and add the runtime's own retry cadence around the errors this plan raises.
- `AuthThrottledError.retryAfterMs` and the transient `CloudRequestError` are the two signals a retry policy needs. `AuthHaltedError` means stop asking; a retry policy must not treat it as retryable.
- The fifteen-minute reminder cadence `D-14` describes is still open. This plan implements the warn-once and drop-to-debug halves inside the auth client, as the plan scoped it; the reminder belongs to the account runtime, which sees the whole failure stream.

## Self-Check: PASSED

- All seven modified files exist on disk.
- All six commits are present: `8f9001e`, `75a2d2d`, `6336549`, `870bf38`, `f76728a`, `996814b`.
- `npm run check` exits 0. 201 unit cases pass (up from 170), 10 Cucumber scenarios and 61 steps pass.
- `npm run test:coverage:direct` reports 100 percent lines, branches, and functions for the `src/cloud/auth.ts` pair and for the `src/cloud/errors.ts` pair.
- `.fallowrc.json` is unmodified. `STATE.md` and `ROADMAP.md` are unmodified.

---

*Phase: 01-secure-cloud-foundation*
*Completed: 2026-08-28*
