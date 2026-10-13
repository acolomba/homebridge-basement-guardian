---
phase: 05-degraded-operation-and-recovery
plan: 07
subsystem: api
tags: [homekit, hap, authentication, auth0, trust, lifecycle, cucumber, node-test]

requires:
  - phase: 05-degraded-operation-and-recovery
    plan: 03
    provides: "`commandTransportReady` on `MonitoringTrust`, and the binder's transport rule that reads it"
  - phase: 05-degraded-operation-and-recovery
    plan: 04
    provides: "the terminal authentication branch in `launchFailure`, the `AUTHENTICATION_STOPPED` line, and the unreadable pass in `applyMonitoringHealth`"
  - phase: 05-degraded-operation-and-recovery
    plan: 06
    provides: "`readOutcome` on `features/support/steps/homekit.ts`, which tells an absent characteristic from one that refuses a read"
provides:
  - "`haltOnTerminalAuthFailure` on `src/runtime/accountRuntime.ts` -- one idempotent terminal branch the launch, the poll loop and the rotation loop all route through"
  - "`waitWhileRunning` on `src/runtime/accountRuntime.ts` -- the wait every loop takes, which refuses to run again once the runtime has halted"
  - "the final monitoring-trust push from `stop()`, carrying the command-transport fact alone"
  - "`expireTokenIn` on `features/support/fakeAuth0.ts`, and the step `the tenant issues tokens that expire in {int} seconds`"
  - "`A credential refused after a healthy start makes every service unreadable` in `features/degradedOperation.feature`"
affects: [05-08, 05-09, 05-10, 05-11, 06-release-quality]

actuals:
  tokens: 4606
  tasks: 3
  commits: 5
  # `estimateTokens` scale: chars/4 over the realized diff (18 423 chars of added lines across
  # 6 files, 372 insertions). The plan projected 70 000 on the read-set scale, the same mismatch
  # the six earlier plans of this phase recorded. It is a measurement difference between two
  # scales, not a 15x over-estimate; a calibration pass should put both on one footing before
  # anyone reads it as a ratio.

tech-stack:
  added: []
  patterns:
    - "One terminal act behind one predicate, so every caller that can meet the failure reads as a single guard clause and the flag has exactly one assignment site"
    - "An idempotent terminal branch, because two concurrent loops can meet one refusal and the owner must be told once"
    - "A loop wait that asks the halt flag at both ends: before the wait for a halt this loop's own body raised, and after it for one another loop raised while this one slept"
    - "A shutdown that pushes the fact it is about to act on rather than leaving the tier holding the fact it held"
    - "A scenario that forces a re-grant by shortening the token lifetime past the client's renewal margin, so a running plugin re-authenticates without a restart"

key-files:
  created: []
  modified:
    - src/runtime/accountRuntime.ts
    - test/runtime/accountRuntime.test.ts
    - test/platform.test.ts
    - features/support/fakeAuth0.ts
    - features/support/steps/authentication.ts
    - features/degradedOperation.feature

key-decisions:
  - "The halt flag keeps one assignment site. It moved from the terminal branch inside `launchFailure` into `haltOnTerminalAuthFailure`, which three callers route through; no second flag was raised beside it, so the fact HomeKit presents and the fact the runtime acts on still cannot drift."
  - "`waitWhileRunning` asks the halt flag twice, before the wait and after it. One read alone is wrong in one direction each: reading only before it lets a loop that slept through another loop's halt wake and make one more call; reading only after it makes the halting loop arm one more timer it will never use."
  - "The shutdown push moves `commandTransportReady` alone. `monitoringTrustNow()` is pushed unchanged, so both degradation members carry whatever the last report carried, and a shutdown marks no scope."
  - "The shutdown pushes directly rather than through `reportMonitoringHealth`, because that helper also writes a live-reporting observation to the failure log and a shutdown made no observation."
  - "The scenario's token lifetime is stated in the feature file, not computed in the step. 3660 seconds is 60 seconds past the client's one-hour renewal margin, so the token is current at issue and stale after a 120-second advance -- which is far below the 1796 seconds two missed heartbeats take, keeping the scenario about the refused credential alone."

patterns-established:
  - "Terminal-failure routing: one predicate that answers whether it handled the error, so callers read `if (handled) { return; }` and the act cannot be copied"
  - "Halt-aware loop waits: the flag is read at both ends of every wait, and the comment states the cost of waking rather than calling the guard tidy"

requirements-completed: []

coverage:
  - id: D1
    description: "A credential refusal that arrives after a healthy start reaches the terminal branch: the trust it pushes reports the rejection and an unready command transport, the log records the authentication stop, and the generic device-discovery line is never written for it"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-13 pushes a rejected credential and records the authentication stop for a refusal that follows a healthy start"
        status: pass
    human_judgment: false
  - id: D2
    description: "A refusal met by the credential rotation loop reaches the same branch, instead of being swallowed into a rotation failure that promises another attempt"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-13 pushes a rejected credential and records the authentication stop when a credential rotation is refused"
        status: pass
    human_judgment: false
  - id: D3
    description: "An hour after a mid-run refusal, no inventory call, no credential call and no shadow attempt has been made -- the poll loop, the rotation loop and the shadow retry chain have all stopped"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-13 leaves the poll, the rotation and the shadow retry chain nothing to do once a mid-run refusal has halted it"
        status: pass
    human_judgment: false
  - id: D4
    description: "Two loops meeting one refusal produce one terminal push and one log line"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-13 pushes the terminal trust once when the poll and the rotation meet the refusal together"
        status: pass
    human_judgment: false
  - id: D5
    description: "`stop()` pushes one trust whose command transport is unready, and marks no scope"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#RES-04 pushes an unready command transport, and withdraws no scope, when the runtime stops"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#SYNC-05 pushes once when a shutdown runs twice, because the second call returns before anything else"
        status: pass
    human_judgment: false
  - id: D6
    description: "An owner who changes their vendor password while Homebridge runs finds the accessory unreadable, with its readings kept and the log naming how to correct the account"
    requirement: RES-04
    verification:
      - kind: e2e
        ref: "npm run test:cucumber -- --name \"after a healthy start\""
        status: pass
    human_judgment: false
  - id: D7
    description: "A No Response accessory in a real paired Apple Home still lets an owner reach cached values, and automations built on it behave predictably"
    requirement: RES-04
    verification: []
    human_judgment: true
    rationale: "`05-CONTEXT.md` D-10 grants the `HapStatusError` exception on a measured risk and requires a real-home check. This plan makes the presentation reachable in the common case, which raises the frequency of that risk; nothing automated can answer what Apple Home draws or how an automation reacts."

duration: 25min
completed: 2026-09-02
status: complete
---

# Phase 05 Plan 07: Reachable Credential Refusal and a Shutdown the Tier Hears Summary

**A credential refusal now halts the runtime whenever it arrives rather than only at launch, and a shutdown tells the accessory tier its command transport is gone.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-09-02T13:19:00Z
- **Completed:** 2026-09-02T13:44:00Z
- **Tasks:** 3 of 3
- **Files modified:** 6

## Accomplishments

- One terminal authentication branch, `haltOnTerminalAuthFailure`, now carries the whole terminal act -- set the halt flag, record the authentication stop, push the trust -- and the launch, the poll loop and the rotation loop all route through it. Before this the flag was assigned only inside `launchFailure`, so a password changed at the vendor while Homebridge ran produced `warn Device discovery failed.` forever and no accessory ever went unreadable.
- All three loops stop once the runtime has halted. `waitWhileRunning` reads the flag before and after every wait, so the poll loop exits without arming another timer and the rotation loop and shadow retry chain exit when they wake.
- `stop()` pushes a final monitoring trust carrying the command-transport fact alone, so the tier that decides whether a press may leave the plugin stops answering `commandTransportReady: true` for a runtime that has aborted every request.
- A Cucumber scenario drives the refusal into a plugin that started successfully, by shortening the tenant's stated token lifetime past the client's renewal margin and moving the scenario clock. The five existing credential cases and the one existing credential scenario all reject the *first* call, which is why none of them could see this.

## Task Commits

1. **Task 1 (tracer, TDD): End-to-end -- a password changed at the vendor greys the accessory without a restart**
   - `67bf2d8` (test) -- the four mid-run runtime cases and the platform case
   - `36ef770` (feat) -- the terminal branch, the three routed callers, the halted loops, the corrected comment
2. **Task 2 (TDD): Tell the accessory tier the runtime has stopped**
   - `948fa91` (test) -- the three shutdown-push cases, and the restated aborted-poll case
   - `65a6b7d` (feat) -- the final push from `stop()`
3. **Task 3: Drive the refusal into a plugin that started successfully**
   - `c398523` (test) -- `expireTokenIn`, the new step, the new scenario

## Files Created/Modified

- `src/runtime/accountRuntime.ts` -- adds `haltOnTerminalAuthFailure` and `waitWhileRunning`; routes `launchFailure`, `runPoll`'s catch and `refreshCredentials`'s catch through the branch; halts the poll loop, the rotation loop and the shadow retry chain; pushes the final trust from `stop()`; corrects the comment above `monitoringTrustNow`.
- `test/runtime/accountRuntime.test.ts` -- four mid-run credential cases and three shutdown-push cases; restates `reports nothing for a poll a shutdown aborted`.
- `test/platform.test.ts` -- one case that the unreadable pass reaches a built accessory and a restored one in the same call.
- `features/support/fakeAuth0.ts` -- `expireTokenIn(seconds)`, which changes the stated lifetime and never the token value.
- `features/support/steps/authentication.ts` -- the step `the tenant issues tokens that expire in {int} seconds`.
- `features/degradedOperation.feature` -- the scenario `A credential refused after a healthy start makes every service unreadable`.

## The corrected comment

The comment above `monitoringTrustNow` reasoned from a claim this plan makes false. It read:

> `credentialsRejected` is `halted` and nothing else. `halted` is set in exactly one place -- the terminal branch in `launchFailure` -- so reading it here rather than raising a second flag beside it is what keeps the fact HomeKit presents and the fact the runtime acts on from ever drifting apart (D-13, D-10).

It now reads:

> `credentialsRejected` is `halted` and nothing else. `halted` is assigned in exactly one function -- `haltOnTerminalAuthFailure`, which the launch, the poll loop and the rotation loop all route through -- so reading it here rather than raising a second flag beside it is what keeps the fact HomeKit presents and the fact the runtime acts on from ever drifting apart (D-13, D-10).

One assignment site is still the property the comment wants; it is now one function reached from three callers rather than one branch reached from one.

## The token lifetime, and where it comes from

`src/cloud/auth.ts` renews a token whose expiry sits inside `TOKEN_RENEWAL_MARGIN_MS`, which is `3_600_000` -- one hour. The scenario asks the tenant for a **3660-second** lifetime: 3600 seconds of margin plus 60 seconds of currency, so the token is current the moment it is issued and stale after any advance past 60 seconds. The scenario advances **120 seconds**, which is comfortably past that point and far below the **1796 seconds** two missed heartbeats take, so the tiles in this scenario are answering for a refused credential and not for shadow silence.

## Named mutations: applied, watched, reverted

Every mutation `05-VALIDATION.md` names for a behaviour in this plan was applied to the working tree, run, and reverted. Each is listed with the exact test it broke.

| # | Mutation | Test that failed | Assertion |
|---|---|---|---|
| 1 | Remove the terminal guard from `runPoll`'s catch | `D-13 pushes a rejected credential and records the authentication stop for a refusal that follows a healthy start` | `pushed.credentialsRejected` stayed `false`, `stops` was empty, and `discoveryFailures` held `warn Device discovery failed.` |
| 2 | Remove the terminal guard from `refreshCredentials`'s catch | `D-13 pushes a rejected credential and records the authentication stop when a credential rotation is refused` | `pushed` was the last poll's trust rather than the terminal one, and `rotationFailures` held the "will try again" line |
| 3 | Leave the poll loop's condition without the halted flag (`waitFor` in place of `waitWhileRunning`) | `D-13 leaves the poll, the rotation and the shadow retry chain nothing to do once a mid-run refusal has halted it` | `calls` grew past `atTheRefusal` with further `devices` entries |
| 4 | Delete the push from `stop()` | `RES-04 pushes an unready command transport, and withdraws no scope, when the runtime stops` | `afterStop` held one entry rather than two, so the tier was never told |
| 5 | Push both degradation members true from `stop()` | `RES-04 pushes an unready command transport, and withdraws no scope, when the runtime stops` | `restDegraded` and `shadowSilent` came back `true` from a shutdown that observed nothing |
| 6 | Remove the terminal guard from `runPoll`'s catch (against the scenario) | `A credential refused after a healthy start makes every service unreadable` | `the Sump Pit Flood service never refused a read for Status Active: it answered a read` |
| 7 | Remove the step that shortens the token lifetime | `A credential refused after a healthy start makes every service unreadable` | same assertion -- no re-grant occurs, so the refusal is never met and the service keeps answering |

Mutations 1 and 3 each also broke `D-13 pushes the terminal trust once when the poll and the rotation meet the refusal together`, because that case cannot reach the branch either.

One mutation beyond the named list, applied for the guard this plan adds that the list does not name:

| # | Mutation | Test that failed | Assertion |
|---|---|---|---|
| 8 | Remove the idempotence guard (`if (halted) { return true; }`) | `D-13 pushes the terminal trust once when the poll and the rotation meet the refusal together` | `terminalPushes` came back `2` |

Mutation 5 also broke a pre-existing case, `withdraws the offline verdict from every published accessory once polling has failed twice` in `test/platform.test.ts`. That is a second, independent witness that a shutdown withdrawing scope would be visible at the accessory tier.

## Honest reporting: one test that failed nothing

**`test/platform.test.ts#makes an accessory a successful inventory built unreadable in the same pass as a restored one` passed the moment it was written, before any source change, and no mutation in this plan breaks it.**

The plan asked for it and `05-VERIFICATION.md` listed "a platform case that the restored accessories go unreadable from a mid-run rejection" among the missing artifacts. It is a real assertion -- it drives a controller read on the built accessory's own services and on the restored ones in one `applyMonitoringHealth` call -- but it is **not evidence of this plan's fix**, and the reason is worth stating plainly: `applyMonitoringHealth` acts on the trust it is handed and cannot tell a refusal that arrived at launch from one that arrived mid-run. The defect CR-03 named was entirely upstream, in which runtime path sets the flag. A platform case therefore cannot discriminate, and the mutations it would fail (walking the wrong map, skipping the fan-out) were already failed by the two cases beside it.

It is kept because it documents that the pass reaches both kinds of accessory in one call, and removed nothing. It should not be counted as coverage of CR-03; `D1` through `D4` above are.

A second, smaller instance of the same honesty: in `D-13 pushes the terminal trust once when the poll and the rotation meet the refusal together`, only the `terminalPushes` half discriminates. The `stops: 1` half would hold even without the idempotence guard, because the failure log already rate-limits a repeated activity-and-message pair. The log assertion documents the observable; the push count is what mutation 8 breaks.

## The one existing case that had to move

`test/runtime/accountRuntime.test.ts#reports nothing for a poll a shutdown aborted` asserted `monitoringHealth` held exactly one entry after `await runtime.stop()`. The shutdown push makes that two. The case was restated to snapshot the pushes before the shutdown and then compare both lists, so its original claim -- *the aborted poll itself reports nothing* -- is now stated directly rather than inferred from a total, and the shutdown's own push is named rather than counted with the polls.

**Nothing else moved.** In particular the whole Cucumber suite was re-run immediately after the shutdown push landed, as the plan required: 92 scenarios and 937 steps passed with no scenario weakened and no `After` hook or harness assertion touched. The world registers `runtime.stop()` as a cleanup that runs before the Homebridge stand-in is torn down, and `restartPlugin` stops before it relaunches, so the extra push travels the ordinary fan-out and marks nothing (both degradation members are unchanged and `credentialsRejected` is whatever the run already held).

## Decisions Made

See `key-decisions` in the frontmatter. The one worth repeating here is `waitWhileRunning` reading the halt flag at both ends of the wait. A single read is wrong in one direction each way: reading only *before* the wait lets a loop that slept through another loop's halt wake and make one more vendor call, which the "empty hour" case catches; reading only *after* it makes the halting loop arm one more timer it will never use. The two reads are not redundant, and the branch coverage exercises all four combinations.

## Deviations from Plan

None. The plan was executed as written.

Two things the plan asked for are worth noting as executed rather than as deviations:

- The plan's `<action>` for Task 1 asked for a comment saying why halting the loops "is not merely tidy". It is on `waitWhileRunning` and states the reason the plan gave: the auth client throws before any request leaves once it holds a terminal reason, so a waking loop sends nothing and does not extend the vendor's thirty-day block -- but a runtime that will never attempt anything again must not look like one that is still trying.
- The plan's prohibition against recording a second halt flag holds: `halted` is the only flag, and `credentialsRejected` still reads it directly.

## Issues Encountered

One eslint `max-len` warning on a test title longer than 160 columns, caught by `pre-commit run --files` before the commit and fixed by shortening the title. Nothing else.

`.planning/milestone.lock` is untracked in the working tree. It is a session lock the GSD orchestrator writes and is not part of this plan's output, so it was left alone and not committed.

## Verification

Run on **both** installed Node versions, as every prior plan in this phase did:

- **Node v26.7.0** (the default `node`): `npm run check` green -- typecheck, lint, `fallow`, `format:check`, 1321 unit tests (0 fail), 92 Cucumber scenarios / 937 steps (0 fail). `npm run test:coverage:all` reports 100.00 line / 100.00 branch / 100.00 function across `src/`. `npm run test:coverage:direct` on the `accountRuntime` source-test pair reports 100.00 / 100.00 / 100.00.
- **Node v22.22.2** (`/usr/bin/node`): `npm run typecheck` exit 0; 1321 unit tests (0 fail); 92 Cucumber scenarios / 937 steps (0 fail); `npm run test:coverage:all` 100.00 / 100.00 / 100.00.

`npm run fallow` reports no new finding: one clone group, `features/support/steps/hap.ts:113-124` against `:168-181`, which is the pre-existing finding this phase inherited. Maintainability 92.7, 0 files above threshold, 0 dead-code findings.

Baseline moved from 1313 unit tests / 91 scenarios / 923 steps to **1321 unit tests / 92 scenarios / 937 steps**.

## Threat Flags

None. This plan added no network endpoint, no auth path, no file access pattern and no schema change. It installed no package; `package.json` and `package-lock.json` are untouched.

## Next Phase Readiness

- **05-08** (wave 3) is unblocked. It reports from the shadow arrival callback; nothing here touches `onReportedPatch` or the silence latch.
- **05-09** (wave 4) is unblocked and inherits a correct `commandTransportReady` at shutdown, which its restored-control refusal reads.
- **05-11** (wave 5) is untouched by design. `pollTelemetry` and `releaseShadowSource` were not modified, so `05-CONTEXT.md` D-13's telemetry handover remains entirely 05-11's to implement.
- **RES-04 is still not complete.** This plan closes the "only explicit credential rejection yields a persistent communication failure requiring user action" clause in the forward direction, which `05-VERIFICATION.md` recorded as failing. The other failing clause -- "commands stay disabled until fresh valid state returns", in the failed-restart window -- is 05-09's. `REQUIREMENTS.md` was left at `Pending`, where 05-06 returned it; the row is 05-10's to reconcile at phase close-out.
- **One human check is outstanding** and is recorded as `D7` above: `05-CONTEXT.md` D-10 granted the `HapStatusError` exception on a measured risk and required a real-home confirmation that a No Response accessory still lets an owner reach cached values and behaves predictably in automations. This plan makes that presentation reachable in the case owners actually hit, which raises how often the risk is met. A negative finding reopens D-10.

---
*Phase: 05-degraded-operation-and-recovery*
*Completed: 2026-09-02*

## Self-Check: PASSED

Every file this summary names exists on disk. Every commit hash it names is reachable from `git log --all`. `src/runtime/accountRuntime.ts` carries `haltOnTerminalAuthFailure` and `waitWhileRunning`; `features/degradedOperation.feature` carries the `after a healthy start` scenario.
