---
phase: quick-260905-fiy
plan: 01
subsystem: testing
tags: [cucumber, cucumber-js, real-pump, timeout]

requires: []
provides:
  - Per-step Cucumber timeout on the real-pump heartbeat wait step, sized above its 960-second wait
affects: [real-pump suite, REL-09]

actuals:
  tokens: 219
  tasks: 1
  commits: 1

tech-stack:
  added: []
  patterns:
    - "Module-local STEP_TIMEOUT_MS constant passed as the IDefineStep options argument, matching the existing pattern in features/support/steps/controls.ts, runtime.ts, homekit.ts, and shadow.ts"

key-files:
  created: []
  modified:
    - features/real-pump/support/heartbeatSteps.ts

key-decisions:
  - "STEP_TIMEOUT_MS set to a fixed 1,000,000ms ceiling at registration time rather than computed from the matched {int}, because Cucumber's step-options object is fixed when the step is registered, not when it runs"

patterns-established: []

requirements-completed: [REL-09]

coverage:
  - id: D1
    description: "The harness waits {int} seconds step carries an explicit { timeout: STEP_TIMEOUT_MS } option so its 960-second wait survives Cucumber's 5000ms default step timeout"
    requirement: "REL-09"
    verification:
      - kind: other
        ref: "npx cucumber-js --profile real --dry-run -- features/real-pump/heartbeats.feature (resolves 7 scenarios, 0 undefined/ambiguous)"
        status: pass
      - kind: other
        ref: "npm run typecheck"
        status: pass
      - kind: other
        ref: "npm run build:test"
        status: pass
    human_judgment: true
    rationale: "Dry-run and typecheck confirm the step is registered correctly and compiles, but no automated check in this task actually runs the 960-second real wait against the live Gemini account -- that requires the maintainer's opt-in real-pump suite execution."

duration: 8min
completed: 2026-09-05
status: complete
---

# Quick Task 260905-fiy: Fix missing per-step timeout on the real-pump heartbeat wait Summary

**Gave the real-pump `the harness waits {int} seconds` step its own 1,000,000ms Cucumber step timeout, so `heartbeats.feature`'s 960-second waits are no longer killed by Cucumber's 5000ms default.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-05T15:13:00Z
- **Completed:** 2026-09-05T15:21:23Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added a module-level `STEP_TIMEOUT_MS` constant (1,000,000ms, about 16.7 minutes) with a comment explaining Cucumber's 5000ms default, the step's 960-second caller, and why the ceiling is fixed at registration time.
- Registered `the harness waits {int} seconds` with `{ timeout: STEP_TIMEOUT_MS }` as the second argument, matching the `(pattern, options, code)` `IDefineStep` overload and the precedent already used in `features/support/steps/controls.ts`, `runtime.ts`, `homekit.ts`, and `shadow.ts`.
- Left the step's body, every other step in the file, and every other step definition in the codebase untouched. No `setDefaultTimeout()` call was added anywhere.

## Task Commits

Each task was committed atomically:

1. **Task 1: Give the wait step its own per-step timeout, end to end** - `892a6c7` (fix)

**Plan metadata:** committed separately per orchestrator convention (docs commit not made by this executor)

## Files Created/Modified
- `features/real-pump/support/heartbeatSteps.ts` - Adds `STEP_TIMEOUT_MS` and passes `{ timeout: STEP_TIMEOUT_MS }` to the `the harness waits {int} seconds` step registration

## Decisions Made
- `STEP_TIMEOUT_MS` is a fixed literal (1,000,000ms) rather than derived from the matched `{int}`, because Cucumber evaluates the options object once at registration time, before any scenario runs, so it cannot read the matched argument.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

`heartbeats.feature`'s two scenarios can now run past Cucumber's 5000ms default and reach their intended 960-second wait when the opt-in real-pump suite is run against the live Gemini account. That live run itself was not executed as part of this task (out of scope: this task only fixes the timeout registration and verifies via `--dry-run`). The maintainer's deferred real-pump suite execution (tracked in `06-VERIFICATION.md`) is the next place this fix gets exercised end to end.

## Self-Check: PASSED

- FOUND: `features/real-pump/support/heartbeatSteps.ts`
- FOUND: commit `892a6c7`

---
*Phase: quick-260905-fiy*
*Completed: 2026-09-05*
