---
phase: 01-secure-cloud-foundation
plan: 12
subsystem: testing
tags: [cucumber, node-test, eslint, aws-iot, credential-rotation]

requires:
  - phase: 01-secure-cloud-foundation
    provides: the account runtime, its composition seam, and the transport-level cucumber harness
provides:
  - A credential-rotation scenario that passes repeatedly rather than four times in five
  - Step assertions that wait on the collection they read instead of a neighbouring one
  - Rotation lead and floor as injected runtime options, with the seam choosing the bundled pair
  - A floating-promise rule that covers the cucumber harness again
affects: [gap-closure plans 01-13 through 01-17, every later phase that commits behind npm run check]

actuals:
  tokens: 5300
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A step that asserts a positive count waits on that same collection, then asserts the exact count"
    - "Scenario-scoped timing overrides travel through the composition seam, like the poll interval"

key-files:
  created: []
  modified:
    - features/support/steps/shadow.ts
    - features/support/steps/runtime.ts
    - features/support/world.ts
    - features/credentialRotation.feature
    - src/runtime/accountRuntime.ts
    - test/runtime/accountRuntime.test.ts
    - eslint.config.js

key-decisions:
  - "The rotation lead and floor are required members of AccountRuntimeOptions and optional members of AccountRuntimeDeps, so the seam stays the single place the bundled numbers are chosen and a missing member is a compile error rather than a silent zero."
  - "A scenario opts into the compressed rotation timing through a short rotation interval step rather than every scenario taking it, because a rotation firing every few milliseconds adds vendor requests the request-count assertions never asked for."
  - "The floating-promise exemption names the unit tree alone; the harness needed no call-site changes, which the narrowing proves rather than assumes."

patterns-established:
  - "Wait then assert: untilTrue establishes the floor on the collection actually read, and the existing exact assertion keeps the ceiling"
  - "Absence assertions stay bare: waiting cannot strengthen an assertion that nothing happened"

requirements-completed: [SYNC-04]

coverage:
  - id: D1
    description: "Every positive step assertion waits on the collection it reads, so the credential-rotation scenario stops failing intermittently"
    requirement: SYNC-04
    verification:
      - kind: e2e
        ref: "npx cucumber-js --name \"A rotation refreshes the next handshake and leaves the live one alone\" (8 concurrent runs)"
        status: pass
      - kind: e2e
        ref: "npm run test:cucumber (5 consecutive fresh runs)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The rotation lead and floor arrive through AccountRuntimeOptions, so a scenario drives rotation in milliseconds rather than waiting thirty real seconds"
    requirement: SYNC-04
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#SYNC-04 arms the rotation on the lead and floor the caller states rather than the bundled pair"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#SYNC-04 takes the injected lead when the expiry sits further out than the injected floor"
        status: pass
      - kind: e2e
        ref: "npm run test:cucumber wall clock: 40.2s before, 10.2s after"
        status: pass
    human_judgment: false
  - id: D3
    description: "A floating promise in the cucumber harness is a lint error again"
    verification:
      - kind: other
        ref: "npx eslint . --max-warnings=0, plus a throwaway floating promise in features/support/steps/harness.ts that the rule reported and that was then reverted"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-08-29
status: complete
---

# Phase 01 Plan 12: Deterministic Phase Seal Summary

**The credential-rotation flake is closed by waiting on the collection each step reads, and the rotation lead and floor are injected options, which cuts the cucumber suite from 40 seconds to 10.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-08-29T11:00:00Z
- **Completed:** 2026-08-29T11:34:08Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Reproduced the flake first: one of six concurrent runs of the credential-rotation scenario failed with the exact diagnosed symptom, `['placeholder-shadow-client']` against the expected two identifiers.
- Routed the client-identifier assertion, the canonical-change count, and the recovery announcement through the world's wait on the collection each one reads, keeping the exact assertion after the wait.
- Made the rotation lead and floor required members of `AccountRuntimeOptions`, supplied by the composition seam, so a scenario can compress them without a production escape hatch.
- Narrowed the floating-promise exemption to the unit tree and proved the rule is live on the harness.
- Suite wall clock: 40.2s before, 10.2s after. Unit tests: 384 before, 386 after. `fallow dupes`: 0%.

## Task Commits

1. **Task 1: Every positive step assertion waits on the collection it reads** - `527234c` (test)
2. **Task 2: Rotation lead and floor become injected options** - `41bf6cb` (feat)
3. **Task 3: A floating promise in the harness is a lint error again** - `0e497c2` (chore)

## Files Created/Modified

- `features/support/steps/shadow.ts` - Client-identifier and canonical-change assertions wait on the collection they read; the expected identifier pair is a named module constant.
- `features/support/steps/runtime.ts` - Recovery assertion waits on the log; the separate rotation deadline and step timeout are gone; a short-rotation Given was added.
- `features/support/world.ts` - Harness rotation lead and floor as module constants, applied only when a scenario asks for the short interval.
- `features/credentialRotation.feature` - Background asks for the short rotation interval.
- `src/runtime/accountRuntime.ts` - `rotationLeadMs` and `minRotationDelayMs` on `AccountRuntimeOptions`; optional on `AccountRuntimeDeps` with the bundled values as the seam's default.
- `test/runtime/accountRuntime.test.ts` - Harness carries the pair; three rotation cases now assert against injected values; a seam case proves the caller's pair reaches the schedule.
- `eslint.config.js` - Floating-promise exemption narrowed to `test/**`, with a corrected rationale.

## Sibling-step survey

The survey described in the plan is confirmed, with one addition.

| Step | Module | Verdict |
| --- | --- | --- |
| `assertClientIdentifiers` | shadow | Raced. Fixed. |
| `assertCanonicalChangeCount` | shadow | Read a plugin-filled array with no wait. Fixed. |
| `assertRecoveryAnnouncedOnce` | runtime | Genuinely raced: the runtime sets the monitoring path before it reports the recovery, so the preceding step's wait on the path could return between the two. Fixed. |
| `assertHandshakeCarriesTheRotatedCredentials` | shadow | Safe. Preceded by `Then the broker holds 2 handshakes`, which waits on the collection it reads. Unchanged. |
| `assertNoCompleteShadowRequest` | shadow | Absence. Stays bare. |
| `assertSnapshotOmitsField` | shadow | Absence. Stays bare. **Not named in the plan's survey**, which counted four absence assertions across the two modules; there are five. |
| `assertNoUnhandledRejection` | runtime | Absence. Stays bare. |
| `assertNoErrorLogged` | runtime | Absence. Stays bare. |
| `assertNoRequestReachesTheCloud` | runtime | Absence. Stays bare. |

Outside the two modules the plan named, four further steps read plugin-filled state without a wait of their own, and each was traced to a preceding await rather than left to chance:

- `assertTokenRequestCount`, `assertGrantCarriesTheAccount`, `assertRefusalReported`, and `assertThrottleReported` (`features/support/steps/authentication.ts`) all follow `When the plugin starts`, which awaits the launch. The tenant records a grant before it answers, and both the refusal and the throttle lines are written inside the launch the step awaited, so none can be read early.
- `assertTokenCachePresent` follows the same awaited start, and `createAuthClient` awaits `writeCachedToken` before it returns the token the launch needed (`src/cloud/auth.ts:420`). Not a race.
- `assertBrokerHoldsTheHandshake` (`features/support/steps/harness.ts`) reads `clientIds` bare, but the connection it counts is the harness's own subscriber, established through an awaited `connectAsync`. It never runs in a scenario that starts the plugin. Not a race.

None of these was changed.

## Decisions Made

- Rotation timing is injected as required members of `AccountRuntimeOptions` and optional members of `AccountRuntimeDeps`. Required at the runtime keeps a missing member a compile error; optional at the seam keeps the bundled numbers in one place instead of pushing them into `platform.ts`.
- The compressed harness timing is scenario-scoped rather than global. See deviation 1.
- The two harness numbers are a 20 ms lead and a 50 ms floor. Both are well under a second, and the floor is what the rotation step waits out.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Compressed rotation timing had to become a scenario opt-in**

- **Found during:** Task 2
- **Issue:** The plan directs the world to pass a millisecond floor and lead unconditionally. The runtime's rotation is a loop, so a 10 ms floor makes the plugin request `/credentials/aws` about a hundred times a second in every scenario. `features/lifecycle.feature:44` asserts an exact vendor request count, and it failed with `3 !== 2` on the first run after the change. `features/lifecycle.feature:25` and `features/authentication.feature:33` assert exact counts too.
- **Fix:** Added a `Given a short rotation interval` step, mirroring the existing `Given a short poll interval`, and put it in the credential-rotation Background. Every other scenario leaves both members absent, so the seam supplies the bundled pair. `exactOptionalPropertyTypes` forbids passing `undefined`, so the world spreads a conditional object rather than naming the members with an undefined value.
- **Files modified:** `features/support/world.ts`, `features/support/steps/runtime.ts`, `features/credentialRotation.feature`
- **Verification:** Full suite 32/32 across five consecutive runs; the rotation scenario alone runs in 0.8 s.
- **Committed in:** `41bf6cb`

**File touched that the plan did not declare:** `features/credentialRotation.feature`. The plan's `files_modified` does not list it, and task 1 forbids changing any `.feature` file. Task 1 changed none. The one line added in task 2 is the opt-in above; without it the plan's own instruction breaks three other scenarios.

**2. [Rule 3 - Blocking] The worktree had no `node_modules`**

- **Found during:** Task 1 setup
- **Issue:** A linked worktree carries no installed dependencies, so nothing could be built or run.
- **Fix:** Symlinked `node_modules` to the main checkout rather than reinstalling. The symlink was removed before returning. No package was installed, added, removed, or upgraded, which `T-01-68` requires.
- **Files modified:** none tracked
- **Verification:** `git status --short` clean apart from the symlink, which was never staged.

**3. [Rule 1 - Bug in the plan's verify command] The task verify commands run the whole suite**

- **Found during:** Task 1
- **Issue:** `npx cucumber-js features/credentialRotation.feature` does not run that feature alone. Cucumber.js 13 merges CLI paths with the configuration file's `paths`, and prints a deprecation notice saying the CLI argument will override in a future major. So the plan's five-run gate was really five full-suite runs.
- **Fix:** Isolated the scenario with `--name` for the focused runs, and ran the full suite five consecutive times for the gate, which is the stronger reading of the criterion. Recorded here per the CLAUDE.md rule about documenting where pinned behavior differs from current documentation.
- **Verification:** Both forms reported below.

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** One extra line in one feature file, one extra step definition, and one extra world method. No scope creep; deviation 1 was forced by the plan's own instruction conflicting with three existing scenarios.

## Verification results

**Five consecutive fresh `npm run test:cucumber` runs, all exit 0:**

| Run | Result | Wall clock |
| --- | --- | --- |
| 1 | 32 scenarios, 266 steps, 0 failed | 10.259s |
| 2 | 32 scenarios, 266 steps, 0 failed | 10.117s |
| 3 | 32 scenarios, 266 steps, 0 failed | 10.180s |
| 4 | 32 scenarios, 266 steps, 0 failed | 10.195s |
| 5 | 32 scenarios, 266 steps, 0 failed | 10.720s |

**Concurrent stress on the rotation scenario, before and after:**

| State | Runs | Result | Each |
| --- | --- | --- | --- |
| Before | 6 concurrent | 5 passed, 1 failed on `assertClientIdentifiers` | 30.77s |
| After task 1 | 6 concurrent | 6 passed | 30.78s |
| After task 2 | 8 concurrent | 8 passed | 0.81s |

**Other gates:**

- `npm run check` run twice, exit 0 both times.
- `npm run test:unit`: 386 pass, 0 fail (384 before; two cases were converted, two added).
- `npm run test:coverage:direct` for `dist-test/src/runtime/accountRuntime.js`: 100.00 lines, 100.00 branches, 100.00 functions.
- `npx eslint . --max-warnings=0`: clean with the exemption narrowed.
- `fallow dupes`: no duplication. `fallow dead-code` and `fallow health`: clean, maintainability 92.8.
- `pre-commit run --files <changed files>` run before every commit; every hook passed except TruffleHog, which fails structurally in a linked worktree. Each commit was preceded by a clean `trufflehog filesystem ... --results=verified,unknown --fail` scan reporting `verified_secrets: 0` and `unverified_secrets: 0`, and used `SKIP=trufflehog` alone, per CLAUDE.md.

## Issues Encountered

- **The TDD RED gate for task 2 could not be a separate commit.** Making `minRotationDelayMs` a required option is a type change, so a test-only commit naming it would not compile, and the repository's `npm typecheck` pre-commit hook would refuse the commit. The test and the implementation therefore landed together in `41bf6cb`. Task 1's RED was demonstrated properly and is recorded above: the baseline failure was reproduced before any edit.
- **`exactOptionalPropertyTypes: true`** rejects passing `undefined` for an optional member, which is why the world spreads a conditional object into the seam call.

## Known Stubs

None. No file created or modified in this plan carries a placeholder value, a `TODO`, a `FIXME`, a skipped test, or an unrun `<verify>`.

## Threat Flags

None. No file changed here adds a network endpoint, an authentication path, a file-access pattern, or a schema at a trust boundary. `T-01-68` held: no package was installed, added, removed, or upgraded.

## Next Phase Readiness

- The phase seal is deterministic, so gap-closure plans 01-13 through 01-17 can now read a red `npm run check` as their own regression.
- The suite is four times faster, so every later plan's pre-commit gate costs about ten seconds of cucumber rather than forty.
- Nothing is blocked. `STATE.md` and `ROADMAP.md` were deliberately left untouched; the orchestrator owns those after the wave merges.

## Self-Check: PASSED

Every file named above exists on disk, all three task commits are present in the branch history, and `git diff --diff-filter=D 09bb79b..HEAD` reports no deleted file.

---
*Phase: 01-secure-cloud-foundation*
*Completed: 2026-08-29*
