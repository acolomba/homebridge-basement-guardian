---
phase: 06-validated-release-candidate
plan: 08
subsystem: testing
tags: [cucumber, gherkin, real-pump, mqtt, homebridge, auth]

# Dependency graph
requires:
  - phase: 06-validated-release-candidate
    provides: "the real-pump harness (features/real-pump/support/realWorld.ts) and discovery scenarios built by plan 06-07"
provides:
  - "features/real-pump/heartbeats.feature: connection-health and natural-update scenarios that pass on a quiet-but-healthy run"
  - "features/real-pump/lifecycle.feature: a restart scenario proving Auth0 token-cache reuse, and a shutdown scenario proving no unhandled rejection"
  - "features/real-pump/support/realWorld.ts: restart()/createRuntime() split, log-line and unhandled-rejection recording, per-device change tracking, remember/recall, and tokenCacheFingerprint()"
affects: []

# Actuals (#2632)
actuals:
  tokens: 4760
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A World method split into initialize()/createRuntime() so a lifecycle transition (restart) can rebuild the same collaborator without duplicating its construction"
    - "A single until() poller generalized to accept a synchronous-or-promise read function, shared across all real-pump step modules instead of one copy per module"
    - "Log-line recording as the observable proxy for connection health: only a warn/error line means a real failure, so a quiet run and an observed natural update both read as healthy"

key-files:
  created:
    - features/real-pump/heartbeats.feature
    - features/real-pump/lifecycle.feature
    - features/real-pump/support/heartbeatSteps.ts
    - features/real-pump/support/lifecycleSteps.ts
  modified:
    - features/real-pump/support/realWorld.ts
    - features/real-pump/support/steps.ts

key-decisions:
  - "Used the World's own log lines (warn/error level) as the 'connection error' signal, rather than instrumenting the mqtt socket directly -- the account runtime already funnels every real connection problem (subscription refused, handshake refused) through a rate-limited log.warn, and deliberately does NOT warn on an ordinary daily reconnect (reason 'transport-closed'), so this signal already distinguishes a real failure from routine, harmless churn without inventing new production instrumentation"
  - "Tracked natural store updates with a store.subscribe()-based deviceChanges() log, mirroring features/support/world.ts's established 'changes' pattern, rather than repurposing the existing monitoring-health observations() method -- observations() fires on every REST poll regardless of whether a value changed, so it cannot tell 'a value changed' from 'a poll happened'"
  - "Generalized steps.ts's until() poller to accept a read() that returns a value synchronously or through a promise, and exported it for lifecycleSteps.ts to reuse, rather than keeping a second near-identical poller -- fallow's duplicate-code check flagged the copy, and the two profiles-isolation concern that justified 06-07's separate poller (avoiding a second World constructor) does not apply between sibling files in the same profile"
  - "Compared token-cache reuse by content hash (SHA-256) rather than file mtime -- a rewritten cache with byte-identical content is not the failure case this scenario is watching for, and content hashing is unaffected by filesystem mtime-resolution granularity"

patterns-established:
  - "A restart-capable World splits construction into initialize() (first-time setup: credentials, scratch directory) and createRuntime() (the account-runtime build, callable again from a restart() method), so a lifecycle scenario can rebuild the same collaborator over the same on-disk state without a second, drifted copy of the construction logic"

requirements-completed: [REL-09]

coverage:
  - id: D1
    description: "A quiet-but-healthy connection over one heartbeat interval, or an observed natural update, both pass; only a real connection failure or unhandled rejection fails the scenario"
    requirement: REL-09
    verification:
      - kind: integration
        ref: "npx cucumber-js --profile real --dry-run -- features/real-pump/heartbeats.feature resolves both scenarios with no undefined/ambiguous steps"
        status: pass
    human_judgment: true
    rationale: "No CI or automated run can exercise this suite against the real vendor account; a human with BG_EMAIL/BG_PASSWORD must eventually run `cucumber-js --profile real` by hand to confirm the 960-second wait behaves as designed against the live Gemini, which this plan explicitly does not do (D-04's read-only, opt-in constraint)"
  - id: D2
    description: "A restart over the same scratch storage directory reuses the cached Auth0 token rather than granting a fresh one, and a clean shutdown records no unhandled rejection"
    requirement: REL-09
    verification:
      - kind: integration
        ref: "npx cucumber-js --profile real --dry-run -- features/real-pump/lifecycle.feature resolves both scenarios with no undefined/ambiguous steps"
        status: pass
    human_judgment: true
    rationale: "Same as D1: the restart and shutdown behavior can only be truly proven against the live vendor account by a human running the opt-in suite; this plan built and dry-run-verified the scenarios without dialing the real device, per the safety constraint in this plan's own prompt"

duration: ~30min
completed: 2026-09-05
status: complete
---

# Phase 6 Plan 8: Real-Pump Heartbeats, Restart, and Shutdown Summary

**Completed the REL-09 real-pump suite: a bounded-wait heartbeat/natural-update pair that never requires a status change to pass, a restart scenario proving Auth0 token-cache reuse via a content-hash comparison, and a shutdown scenario proving no unhandled rejection.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-09-05 (approximate)
- **Completed:** 2026-09-05T00:51:43-04:00
- **Tasks:** 2
- **Files modified:** 6 (4 created, 2 modified)

## Accomplishments

- `features/real-pump/heartbeats.feature`, tagged `@real @read-only`, has two scenarios: one waits 960 seconds (chosen to plausibly span one 898-second vendor heartbeat, per README.md, without making a maintainer wait half an hour) and passes on either a quiet-but-healthy connection or an observed update, failing only on a recorded warn/error log line or an unhandled rejection; the other remembers a snapshot, waits, and asserts a later snapshot differs from it *only if* the store actually recorded a change during the wait — never a hard requirement that one occurs.
- `features/real-pump/lifecycle.feature`, tagged `@real @read-only`, has a restart scenario (fingerprint the token cache, restart the harness over the same scratch directory, assert the fingerprint is unchanged — a fresh grant would rewrite it) and a shutdown scenario (stop the harness, assert no unhandled rejection was recorded).
- `features/real-pump/support/realWorld.ts` gained: a `createRuntime()` method extracted from `initialize()` so `restart()` can rebuild the account runtime over the same scratch directory instead of tearing it down; log-line recording (warn/error) exposed as `failureLines()`; `process.on('unhandledRejection', ...)` recording exposed as `unhandledRejections()`, mirroring `features/support/world.ts`'s established pattern; a `store.subscribe()`-based `deviceChanges()` log, re-subscribed against every fresh runtime; generic `remember()`/`recall()`; and `tokenCacheFingerprint()`, a SHA-256 hash of the cached Auth0 token file's contents.
- `features/real-pump/support/steps.ts`'s `until()` poller was generalized to accept a synchronous-or-promise `read()` and exported, so `lifecycleSteps.ts` reuses it instead of carrying a second copy.

## Task Commits

Each task was committed atomically:

1. **Task 1: Heartbeat and natural-update observation** - `2872237` (feat)
2. **Task 2: Restart with token-cache reuse, and clean shutdown** - `a9c5196` (feat)

## Files Created/Modified

- `features/real-pump/heartbeats.feature` - connection-health and natural-update scenarios
- `features/real-pump/support/heartbeatSteps.ts` - wait/remember/assert steps for the heartbeat scenarios
- `features/real-pump/lifecycle.feature` - restart and shutdown scenarios
- `features/real-pump/support/lifecycleSteps.ts` - restart/stop steps and the token-cache-fingerprint comparison
- `features/real-pump/support/realWorld.ts` - restart()/createRuntime() split, log/rejection/change recording, remember/recall, tokenCacheFingerprint()
- `features/real-pump/support/steps.ts` - `until()` generalized to a sync-or-async read and exported for reuse

## Decisions Made

See `key-decisions` in the frontmatter above for full rationale. In short: connection failures are read from the World's own warn/error log lines rather than new socket instrumentation; natural updates are tracked with a dedicated `store.subscribe()`-based log rather than repurposing the existing monitoring-health `observations()`; the `until()` poller is now shared rather than duplicated; and token-cache reuse is proven by content hash rather than file mtime.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Generalized `until()`'s `read()` type to also accept a promise, and awaited it**
- **Found during:** Task 2
- **Issue:** After exporting `steps.ts`'s `until()` and widening its `read` parameter type to `() => T | undefined | Promise<T | undefined>` (to let `lifecycleSteps.ts` share it for the async `tokenCacheFingerprint()` read), the loop body still read `const value = read();` without awaiting it, which fails to typecheck (`tsc -p tsconfig.test.json` reported `Type 'T | (T & ({} | null)) | undefined' is not assignable to type 'T'`) and would have silently treated an unresolved promise as always-defined.
- **Fix:** Changed the loop to `const value = await read();`, which resolves correctly for both a plain synchronous value and a promise.
- **Files modified:** `features/real-pump/support/steps.ts`
- **Verification:** `npm run typecheck`, `npm run build:test`, `npx cucumber-js --profile real --dry-run` (7/7 scenarios resolve) all pass
- **Committed in:** `a9c5196` (Task 2 commit)

**2. [Rule 3 - Blocking] Rewrote `terminalLogging()`'s curried-arrow implementation to avoid an ESLint/Prettier disagreement**
- **Found during:** Task 1
- **Issue:** A curried `const write = (level: string) => (message: string): void => {...}` form triggered an ESLint `indent`/`padding-line-between-statements` error under one formatting, but Prettier's own `--write` reformatted it right back to the form ESLint rejected — an unresolvable loop for that specific curried-arrow shape, the same class of ESLint/Prettier conflict 06-07 hit with a possessive apostrophe.
- **Fix:** Replaced the curried arrow with a plain `function write(level, message)` helper and five small non-curried arrow wrappers, which both tools agree on.
- **Files modified:** `features/real-pump/support/realWorld.ts`
- **Verification:** `npm run lint`, `npm run format:check` both pass with no conflict
- **Committed in:** `2872237` (Task 1 commit)

**3. [Rule 1 - Bug] Rewrote a Cucumber step to a plain arrow function to satisfy `prefer-arrow-callback`**
- **Found during:** Task 1
- **Issue:** `When('the harness waits {int} seconds', async function (this: RealPumpWorld, seconds: number) {...})` never used `this`, so ESLint's `prefer-arrow-callback` (configured `warn`, but `eslint . --max-warnings=0` fails the build on any warning) flagged it as convertible.
- **Fix:** Rewrote it as `async (seconds: number) => {...}`, since the step genuinely needs no `this` typing.
- **Files modified:** `features/real-pump/support/heartbeatSteps.ts`
- **Verification:** `npm run lint` passes with zero warnings
- **Committed in:** `2872237` (Task 1 commit)

**4. [Rule 1 - Bug] Cleared `watchedDeviceIds` and re-subscribed on every `createRuntime()` call**
- **Found during:** Task 2
- **Issue:** The original discovery-guard reused `discoveredDeviceIds` (which persists across a restart, correctly) as the guard for whether to subscribe a change listener. Reusing the same guard for subscription would have meant a restarted runtime's *new* `store` never got a `deviceChanges()` listener for an already-known device, silently breaking heartbeats.feature's natural-update detection after any restart.
- **Fix:** Added a separate `watchedDeviceIds` `Set`, cleared at the top of `createRuntime()`, so every fresh runtime (including a restart's) re-subscribes its own store.
- **Files modified:** `features/real-pump/support/realWorld.ts`
- **Verification:** `npm run typecheck`, `npx cucumber-js --profile real --dry-run` pass; reasoned through by code inspection since no live restart was run against the real account
- **Committed in:** `a9c5196` (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (2 bug, 1 blocking, 1 bug caught by code review before it could ship)
**Impact on plan:** All four were necessary for the plan's own stated `<verify>`/`<done>` clauses (a lint-clean, typecheck-clean, dry-run-clean suite with correct restart semantics) to hold. No scope creep beyond what Task 1's and Task 2's own success criteria already required.

## Issues Encountered

None beyond the deviations above.

## User Setup Required

**External account credentials are required only to actually run the opt-in `real` profile — never for `npm test` or CI.** No step in this plan's execution read `BG_EMAIL`/`BG_PASSWORD` or issued any request to the live vendor account. Per this plan's own safety constraint (D-04) and the prompt's explicit instruction, no scenario built here was run against the real Gemini; verification stopped at `npx cucumber-js --profile real --dry-run` (step resolution) plus `npm run check`-equivalent static gates (typecheck, lint, format, fallow, the default Cucumber profile, and `test/realPumpCommandBlock.test.ts`'s command-block gate).

A human with `BG_EMAIL`/`BG_PASSWORD` set must eventually run `npx cucumber-js --profile real` by hand against the live account to confirm these scenarios pass in practice — this is the human-judgment item recorded in `coverage` above, not a gap in this plan's own work.

## Next Phase Readiness

- The full REL-09 scope (discovery, initial state, heartbeats, natural updates, restart, shutdown) is built under `features/real-pump/` and dry-run clean as one suite (`npx cucumber-js --profile real --dry-run`: 7 scenarios, 7 skipped, 0 undefined/ambiguous).
- REL-09 is marked complete (`gsd_run query requirements.ready-ids` reported it `ready`, since this is the last plan declaring it and 06-07 already shipped its half).
- No blockers for the remainder of Phase 6. The real-pump suite's own follow-up (an actual human run against the live account) is recorded above as a human-judgment coverage item, not a phase blocker — it never blocks phase completion, only the eventual `1.0.0` real-hardware validation record.

## Self-Check: PASSED

All 4 created files exist on disk; both task commits (`2872237`, `a9c5196`) exist in git history with real diffs (240 and 63 line changes respectively, confirmed via `git show --stat`).

---
*Phase: 06-validated-release-candidate*
*Completed: 2026-09-05*
