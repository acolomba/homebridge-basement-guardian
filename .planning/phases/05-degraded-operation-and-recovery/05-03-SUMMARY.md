---
phase: 05-degraded-operation-and-recovery
plan: 03
subsystem: safety-monitoring
tags: [homebridge, hap, typescript, cucumber, node-test, command-gating, static-gate]

requires:
  - phase: 04-pump-records-and-official-controls
    provides: "the control binder, its injected-predicate shape, the local refusal table, and the per-cause HAP status mapping with its macrotask clearing push"
  - phase: 05-degraded-operation-and-recovery
    plan: 01
    provides: "`MonitoringTrust`, `markMonitoring` with its store outside the early return, the per-scope withdrawal that switches the no-fresh-state refusal on for free, and `Given the service fails every request with status 503`"
  - phase: 05-degraded-operation-and-recovery
    plan: 02
    provides: "`test/accessories/timerFreedom.test.ts`'s module floor at 10, unchanged by this plan"
provides:
  - "`TransportTrust` — what the monitoring-health projection's own two facts support, split from what the runtime pushes"
  - "`MonitoringTrust.commandTransportReady` — the runtime-assembled fact the accessory refuses a press on"
  - "`ControlBinderOptions.commandTransportReady` — the second injected predicate beside `offlineConfirmed`"
  - "The transport row in `LOCAL_REFUSALS`, placed before `hasNoFreshState`, with the order pinned by a unit case"
  - "`test/accessories/accessoryReadPathScope.test.ts` — the static gate proving no accessory read path can reach the network"
affects: [05-04-credential-rejection, 05-05-documentation]

actuals:
  tokens: 13025
  tasks: 2
  commits: 3
  # `estimateTokens` scale: chars/4 over the realized diff (52 100 chars, 12 files,
  # 653 insertions). The plan's 85 000 projection was taken over the read set rather than
  # the diff, so the two are not on the same footing. This is the third sample in this
  # phase recording the same mismatch (21 112, 7 688, 13 025 against 115 000, 85 000 and
  # 85 000), which is now enough to say the projections measure a different thing rather
  # than being wrong by a factor.

tech-stack:
  added: []
  patterns:
    - "A projection type split in two, so a module answers only what its own recorded facts support and the composition point assembles the rest"
    - "A refusal table whose ordering is a documented decision pinned by a case with both conditions true, rather than an accident an unrelated edit can change"
    - "A static gate whose every forbidden spelling is declared once and consumed by both the detector and its fixtures"

key-files:
  created:
    - test/accessories/accessoryReadPathScope.test.ts
  modified:
    - src/runtime/monitoringHealth.ts
    - src/runtime/accountRuntime.ts
    - src/accessories/controls.ts
    - src/accessories/basementGuardian.ts
    - features/officialControls.feature
    - test/accessories/controls.test.ts
    - test/accessories/basementGuardian.test.ts
    - test/accessories/hapImportScope.test.ts
    - test/runtime/accountRuntime.test.ts
    - test/runtime/monitoringHealth.test.ts
    - test/platform.test.ts

key-decisions:
  - "Plan 05-01 already left `markMonitoring`'s store OUTSIDE the early return, so this plan changed only the comparison. Both halves now hold, and the mutation shows they are not redundant: a two-field comparison with the store moved back inside fails 4 unit cases and 10 Cucumber scenarios."
  - "`PA-05` resolved as the research recommended: the transport rule is evaluated before the no-fresh-state rule, because naming a stale reading to someone with no way to send is the less actionable truth. Pinned by a unit case with both conditions set."
  - "`commandTransportReadyNow()` reads the three lifecycle flags directly rather than deriving from `monitoringPathNow()`, which is left byte-identical."
  - "The accessory's stored trust starts with `commandTransportReady: false` while both degradation fields start `false`. The opposite default is deliberate: the other two say a value may be stale, this one says a press may leave the plugin."
  - "The terminal authentication branch pushes the trust directly rather than through `reportMonitoringHealth`, so a run that halted at its first grant does not also record a live-reporting observation it never made."
  - "`RES-04` is NOT marked complete. Plans 05-04 and 05-05 still owe part of it, and `05-CONTEXT.md` rules that requirement rows reconcile at phase close-out."

patterns-established:
  - "A widened contract's default is chosen by what the field means, not by copying its neighbours: a safety fact defaults to the refusing value"
  - "A static gate's non-vacuity is shown against a real planted violation in the production tree, not only against its own fixtures"

requirements-completed: []

coverage:
  - id: D1
    description: "A press with no valid state is refused locally with -70412, nothing reaches the vendor, and the log line names the missing state."
    requirement: RES-04
    verification:
      - kind: e2e
        ref: "features/officialControls.feature#A press with no valid state is refused locally"
        status: pass
      - kind: unit
        ref: "test/accessories/controls.test.ts#names the missing state when the capability has not decoded and there is a way to send"
        status: pass
      - kind: unit
        ref: "test/accessories/controls.test.ts#sends nothing at all for a capability whose reported field has not decoded"
        status: pass
    human_judgment: false
  - id: D2
    description: "A press with no command transport is refused locally with -70412, nothing reaches the vendor, and the log line names the missing transport rather than the missing state."
    requirement: RES-04
    verification:
      - kind: e2e
        ref: "features/officialControls.feature#A press with no command transport is refused locally"
        status: pass
      - kind: unit
        ref: "test/accessories/controls.test.ts#names the missing transport when the capability has decoded and there is no way to send"
        status: pass
      - kind: unit
        ref: "test/accessories/controls.test.ts#sends nothing at all for a runtime with no way to reach the vendor"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both conditions true at once produces exactly one refusal, and which log line it writes is pinned so a later reorder of the refusal table cannot change it silently."
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/controls.test.ts#names the missing transport alone when the plugin has neither fresh state nor a way to send"
        status: pass
      - kind: unit
        ref: "test/accessories/controls.test.ts#answers each of the seven refusal causes with the status that describes it"
        status: pass
    human_judgment: false
  - id: D4
    description: "The command transport is unready until the first REST inventory has succeeded, false again after any single failed poll while neither degradation field moves, and false from the terminal authentication branch with no poll loop having run."
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#reports the command transport unready after a single failed poll, with neither degradation field moved"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-13 pushes an unready command transport from the terminal authentication branch and never pushes again"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#RES-04 refuses a press before the runtime has pushed any monitoring trust, and sends nothing"
        status: pass
    human_judgment: false
  - id: D5
    description: "`markMonitoring` stores the trust it was handed on every push, and its unchanged-value check covers every member of `MonitoringTrust`, so a push differing only in `commandTransportReady` turns an accepted press into a refused one with exactly one send across both."
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#RES-04 refuses the next press after a push differing from the stored trust only in the command transport"
        status: pass
    human_judgment: false
  - id: D6
    description: "`trustNow()` answers exactly the two transport facts, so `commandTransportReady` is assembled by the runtime rather than guessed by a module that sees neither the lifecycle nor authentication."
    verification:
      - kind: unit
        ref: "test/runtime/monitoringHealth.test.ts#answers the two transport facts and nothing about the command transport"
        status: pass
    human_judgment: false
  - id: D7
    description: "A refused press leaves the characteristic answering that status to every read until the macrotask clearing push lands, unchanged from what Phase 4 established."
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/controls.test.ts#answers the transport refusal status to every read until the clearing push lands"
        status: pass
      - kind: unit
        ref: "test/accessories/controls.test.ts#arms one clearing push for a runtime with no way to reach the vendor and leaves the characteristic readable"
        status: pass
    human_judgment: false
  - id: D8
    description: "No module under `src/accessories/` imports anything under `src/cloud/` or the account runtime, and no module under `src/` registers a HomeKit read handler in any of its four spellings."
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/accessoryReadPathScope.test.ts#no module in the accessories tier can reach the vendor (RES-04, D-09)"
        status: pass
      - kind: unit
        ref: "test/accessories/accessoryReadPathScope.test.ts#no module under src registers a HomeKit read handler in any spelling that reaches one (RES-04, D-09)"
        status: pass
    human_judgment: false
  - id: D9
    description: "The read-path gate is non-vacuous: it asserts a floor on the modules it enumerated, one planted fixture per spelling proves the detector catches what it claims to, and a prose mention and an unrelated import prove it stays quiet."
    verification:
      - kind: unit
        ref: "test/accessories/accessoryReadPathScope.test.ts#reports a planted read handler in every spelling it is meant to catch (D-09)"
        status: pass
      - kind: unit
        ref: "test/accessories/accessoryReadPathScope.test.ts#reports a planted import of the cloud client and of the account runtime (D-09)"
        status: pass
      - kind: unit
        ref: "test/accessories/accessoryReadPathScope.test.ts#reports neither a comment naming the forbidden spellings nor an unrelated neighbouring import (D-09)"
        status: pass
    human_judgment: false
  - id: D10
    description: "Apple Home shows a refused press as a failure the user can act on, and a No Response is not produced by either local refusal."
    verification: []
    human_judgment: true
    rationale: "Apple Home's rendering of a refused write cannot be asserted from the plugin side. Rides along with the open `G-003` / `G-004` real-home session already listed in `05-VALIDATION.md` § Manual-Only Verifications."

duration: 23min
completed: 2026-09-01
status: complete
---

# Phase 5 Plan 03: Command Gating and the Read-Path Gate Summary

**A press is now refused for the reason it was actually refused for, and a HomeKit read cannot reach the network without failing a gate that has been watched to fail against a real violation.**

## Performance

- **Duration:** 23 min (first commit to last)
- **Started:** 2026-09-02T02:02:31Z
- **Completed:** 2026-09-02T02:25:27Z
- **Tasks:** 2 of 2
- **Files modified:** 12 (1 created, 11 modified)

## Accomplishments

- The two halves of the command gate now fail independently and say which one blocked. With a valid state and no route the refusal names the missing transport; with a route and no valid state it names the missing state; with neither it names the transport, and a unit case pins that ordering.
- The command transport is a runtime-assembled fact, not a guess. It is false before the first inventory has landed, false after a single failed poll while neither degradation field has moved, and false from the terminal authentication branch with no poll loop having run.
- The blocker the plan checker raised is closed on both halves. `markMonitoring` stores the trust unconditionally and its unchanged-value check covers every member of `MonitoringTrust`. The acceptance criterion holds as written: a push differing only in `commandTransportReady` turns an accepted press into a refused one, with exactly one send across both.
- `test/accessories/accessoryReadPathScope.test.ts` enumerates 10 accessory modules and 40 production modules, and both halves were watched to fail against a real violation planted in `src/accessories/basementGuardian.ts`, not only against their own fixtures.
- Six of the seven mutations `05-VALIDATION.md` names for behaviours in this plan were applied, watched to fail their named tests, reverted, and green restored. The seventh left every tier green and is reported as such below.
- The gate ran green on Node 22.22.2 and Node 26.7.0: 1274 unit tests, 87 scenarios, 868 steps, 100/100/100.

## Task Commits

1. **Task 1: Refuse a press for the right reason, and prove the plugin says which one** — `ae622f3` (test), `efeae4a` (feat)
2. **Task 2: Gate the accessory read path, and prove the gate is not vacuous** — `54095b4` (test)

**Plan metadata:** see the `docs(05-03)` commit that follows this file.

## What plan 05-01 left, and what this plan changed

The plan asked this to be recorded explicitly.

**Plan 05-01 already left `markMonitoring`'s store outside the early return.** The code read:

```ts
const unchanged = trust.restDegraded === monitoring.restDegraded && trust.shadowSilent === monitoring.shadowSilent;

monitoring = trust;   // deliberately before the early return

if (unchanged) {
  return;
}
```

So this plan changed exactly one thing there: the comparison now covers `commandTransportReady` as well. The store was already correct and was left where it was, with its comment sharpened to name the real reader — the write path reads the stored value directly rather than through the row projection.

**Both halves are load-bearing, and the mutation shows it.** With the comparison narrowed to two fields *and* the store moved back inside the early return, 4 unit cases and 10 Cucumber scenarios fail. The reason is worse than the one the blocker described: the accessory's stored trust starts `{ false, false, commandTransportReady: false }`, so the runtime's first healthy push — `{ false, false, true }` — reads as "unchanged" under a two-field comparison and never lands. Every press for the life of the process is then refused. The blocker's own case, a single failed poll flipping only the transport, is the second failure in the same list.

## Refusal ordering

`PA-05` was resolved as the research recommended. `LOCAL_REFUSALS` now reads, in evaluation order:

1. `isNotAnOnRequest`
2. `hasNoCommandTransport` — **new**
3. `hasNoFreshState`
4. `isConfirmedOffline`
5. `isAlreadyActive`

The transport rule goes before the state rule because naming a stale reading to a user who has no way to send anything is the less actionable of the two truths. The order is stated in a comment above the table as a decision rather than an accident, and it is pinned by:

`test/accessories/controls.test.ts#names the missing transport alone when the plugin has neither fresh state nor a way to send`

Swapping the two rows fails that case and **only** that case, out of 179 in the two accessory test modules.

## Mutation Testing

Every mutation `05-VALIDATION.md` names for a behaviour in this plan was applied, watched, reverted, and green restored.

| # | Mutation | What failed | Restored |
|---|---|---|---|
| 1 | Remove `hasNoFreshState` from `LOCAL_REFUSALS` | 5 unit cases, including `names the missing state when the capability has not decoded and there is a way to send` and `sends nothing at all for a capability whose reported field has not decoded`; Cucumber — `A press with no valid state is refused locally`, on the write status reading `undefined` (the press was accepted). The transport scenario stayed green | green |
| 2 | Remove the new transport rule | 9 unit cases across `controls.test.ts` and `basementGuardian.test.ts`, including both `RES-04` accessory cases; Cucumber — `A press with no command transport is refused locally`, on the write reading **-70402** instead of -70412. That status comes only from `refuseOutcome`, which runs after `await commands.send(...)`, so the press reached the command port and the vendor route answered. The state scenario stayed green | green |
| 3 | Reorder `LOCAL_REFUSALS` (swap rows 2 and 3) | Exactly one unit case: `names the missing transport alone when the plugin has neither fresh state nor a way to send`. Cucumber stayed green at 2/2, correctly — each scenario sets one condition | green |
| 4 | Make `commandTransportReadyNow()` ignore `halted` | **Nothing.** 1269 unit tests and 87 scenarios all passed. Reported honestly below | green |
| 5 | Delete the push from `launchFailure`'s terminal branch | `accountRuntime.test.ts` — `D-13 pushes an unready command transport from the terminal authentication branch and never pushes again` (1 of 1269). Cucumber stayed green at 87/87 | green, 1269 unit |
| 6 | Make `markMonitoring` return before storing when `restDegraded` and `shadowSilent` are unchanged (with the comparison narrowed to those two) | `basementGuardian.test.ts` — `RES-04 refuses the next press after a push differing from the stored trust only in the command transport`, `CTRL-04 answers -70403 for a write of true while alarm_audio_muted reads true`, `CTRL-04 sends one mute request carrying the only value the plugin will ever ask for`, `CTRL-03 sends a self-test while every reported equipment fault is active`; Cucumber — **10 scenarios** across `officialControls.feature` and `shadowMerge.feature`, each on a press answering `-70412` | green, 1269 unit / 87 scenarios |
| 7 | Plant `.onGet(() => false)` on `StatusActive` inside `publishRow` | `accessoryReadPathScope.test.ts` — `no module under src registers a HomeKit read handler in any spelling that reaches one`, naming `src/accessories/basementGuardian.ts` | green |
| 8 | Plant `import { createCloudApi } from '../cloud/api.js';` in `basementGuardian.ts` | `accessoryReadPathScope.test.ts` — `no module in the accessories tier can reach the vendor`, naming `src/accessories/basementGuardian.ts` | green |
| 9 | Point `REPOSITORY_ROOT` one level wrong (two levels up, not three) | Both real gate cases, with `the gate enumerated 0 TypeScript modules under src/accessories, fewer than the 10 this repository holds`. Worth reading twice: the wrong root resolves to `dist-test/`, which **does** hold `src/accessories` — full of compiled `.js`. So the walk succeeded, found no `.ts`, and without the floor would have reported green having examined nothing. That is precisely the failure the floor exists for | green |

### Mutation 4 left every tier green, and here is why

Making `commandTransportReadyNow()` ignore `halted` changes no observable behaviour, because `halted` can only be set from `launchFailure`, which is reached only from `launch()`, and a run that reached `launch()`'s failure path never set `polling` true. Once `polling` is true, `launch()` is never called again — a successful launch returns `undefined` and `relaunch` stops. So `halted && polling` is unreachable in the runtime as it stands, and `!halted` is redundant given `polling`.

It was kept anyway, for the same reason `monitoringPathNow()` keeps the identical redundancy: the predicate then states its rule outright rather than resting on an invariant (a halt implies a run that never polled) that a future edit could break silently. It is deliberate defence, not a tested behaviour, and this paragraph is the honest record that no test would catch its removal.

## Gate floors, as the walk reported them

Both were read from the gate's own failure message with the floor temporarily raised, not computed:

- `the gate enumerated 10 TypeScript modules under src/accessories` → `ACCESSORIES_MODULE_FLOOR = 10`
- `the gate enumerated 40 TypeScript modules under src` → `SOURCE_MODULE_FLOOR = 40`
- `the gate enumerated 104 TypeScript files under src, test, features` → `SOURCE_FILE_FLOOR = 104` in `test/accessories/hapImportScope.test.ts`, raised from 98

`ACCESSORIES_MODULE_FLOOR` in `test/accessories/timerFreedom.test.ts` stays at 10: this plan added no module under `src/accessories/`.

## Files Created/Modified

- `src/runtime/monitoringHealth.ts` — `TransportTrust` split out, `MonitoringTrust` extending it with `commandTransportReady`, `trustNow()` narrowed to `TransportTrust`, with a doc comment on each saying why the field cannot live here.
- `src/runtime/accountRuntime.ts` — `commandTransportReadyNow()` beside `monitoringPathNow()`, `monitoringTrustNow()` as the one assembly point, and the push in `launchFailure`'s terminal branch.
- `src/accessories/controls.ts` — the `commandTransportReady` option, the `transportReady` sampled fact, `hasNoCommandTransport`, the table row, and the comment stating the ordering decision.
- `src/accessories/basementGuardian.ts` — the initial stored trust with the transport unready, the `commandTransportReady` reader passed to the binder, and the three-member unchanged-value comparison.
- `features/officialControls.feature` — two scenarios, one per half of the gate.
- `test/accessories/accessoryReadPathScope.test.ts` — the read-path gate: two real cases with floors, four planted read-handler fixtures, two planted import fixtures, two negative controls.
- `test/accessories/hapImportScope.test.ts` — file floor 98 to 104, and the comment stating that number in words moved with it. Nothing else changed.
- `test/accessories/controls.test.ts` — the seventh refusal row through the shared table, plus four cases naming the two causes, their precedence, and the clearing push.
- `test/accessories/basementGuardian.test.ts` — the two `RES-04` cases, and `markMonitoring(EVERY_TRANSPORT_WORKING)` added to five existing press cases.
- `test/runtime/accountRuntime.test.ts`, `test/runtime/monitoringHealth.test.ts`, `test/platform.test.ts` — the widened contract and the two new runtime cases.

## Decisions Made

- **`commandTransportReadyNow()` reads the three flags directly.** Deriving it as `monitoringPathNow() !== 'unavailable'` was considered — it is exactly equivalent today and would guarantee the two can never disagree — and rejected, because the two answer different questions (which sources are feeding state, versus whether a command can leave) and `D-04` is explicit that `monitoringPathNow()` must not be edited. Reading it would have coupled a decision about sending to a diagnostic about observing.
- **The initial stored trust defaults the transport to `false` while both degradation fields default to `true`-equivalent.** The asymmetry is the point: a degradation field says a displayed value may be stale, and nothing has gone stale before the first report; the transport field says a press may leave the plugin, and nothing has told the accessory the runtime can reach the vendor yet.
- **The terminal authentication branch pushes directly rather than calling `reportMonitoringHealth()`.** Going through the reporter would also have recorded a `Live device reporting` success, which is an observation a run that halted at its first grant never made.
- **The gate's read-handler half walks `src/` alone.** It is a claim about production code, and the confinement is also what stops the gate's own detector text from reporting the gate.
- **The account runtime is named as one module, not the whole `../runtime/` directory.** The accessories tier legitimately imports the timer port, the command port and the monitoring-trust type from there; `accountRuntime.js` is the one module holding the cloud client and the poll loop.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Five existing press cases needed the transport marked ready**

- **Found during:** Task 1 GREEN.
- **Issue:** the plan requires the stored trust to report the transport unready before the first `markMonitoring` push. Five cases in `basementGuardian.test.ts` press a switch without ever pushing a trust, so three that expected an accepted send and one that expected `RESOURCE_BUSY` would have been refused with `-70412` — passing or failing for a reason unrelated to what each is about.
- **Fix:** each of the five now calls `markMonitoring(EVERY_TRANSPORT_WORKING)` before the press, which is what the runtime does before any accessory can be pressed in production. The confirmed-offline case got it too, though it would have gone on passing: without it, it would have been asserting the transport refusal while claiming to assert the offline one.
- **Files modified:** `test/accessories/basementGuardian.test.ts`
- **Verification:** mutation 6 above — with the store skipped, four of those five fail again, so the marking is load-bearing rather than decoration.
- **Committed in:** `ae622f3` (the change), `efeae4a` (the behaviour that requires it)

**2. [Rule 3 - Blocking] The gate tripped `sonarjs/no-nested-template-literals` and `max-len`**

- **Found during:** Task 2, first `npm run check`.
- **Issue:** the enumeration-member pattern interpolated a nested template (`asPattern(\`${ENUM}.${MEMBER}\`)`), and two assertion messages ran past 160 columns.
- **Fix:** `EVENT_TYPES_READ_REFERENCE` declared once beside the two constants it joins and consumed by both the detector and its fixture; the two messages split across concatenated lines.
- **Files modified:** `test/accessories/accessoryReadPathScope.test.ts`
- **Verification:** `npm run lint` clean; the gate still reports all four spellings.
- **Committed in:** `54095b4`

**3. [Rule 3 - Blocking] Six `MonitoringTrust` literals in three test modules**

- **Found during:** Task 1 RED.
- **Issue:** widening the interface broke every literal and every `deepStrictEqual` against a pushed trust.
- **Fix:** each fixture and expectation gained `commandTransportReady`, chosen to match what the runtime would actually push for that transport state — `false` for `REST_DEGRADED` and `EVERY_TRANSPORT_LOST`, `true` otherwise — rather than a uniform filler.
- **Files modified:** `test/accessories/basementGuardian.test.ts`, `test/platform.test.ts`, `test/runtime/accountRuntime.test.ts`
- **Verification:** the two runtime expectations are exact whole-object comparisons, so a wrong assembled value fails them.
- **Committed in:** `ae622f3`

---

**Total deviations:** 3 auto-fixed (3 × Rule 3)
**Impact on plan:** none on scope. All three are inside the plan's own files, and the first is the plan's own new default reaching cases the plan did not enumerate.

## Issues Encountered

- **Mutation 4 leaves every tier green.** See the section above. `!halted` in `commandTransportReadyNow()` is unreachable-redundant given `polling`, kept as deliberate defence, and untested by construction.
- **`test/accessories/controls.test.ts#names the missing state when the capability has not decoded and there is a way to send` passed at RED.** It had to: the state half already existed and already answered -70412, which is what `05-CONTEXT.md` D-07 records as "cheaper than assumed". It is pinned by mutation 1 rather than by having been watched to fail first. The other four new `controls.test.ts` cases and both new `basementGuardian.test.ts` cases did fail at RED.
- **`test/runtime/monitoringHealth.test.ts#answers the two transport facts and nothing about the command transport` also passed at RED,** for the same reason: it asserts an invariant the split had already established in the same commit. It is an invariant assertion, not a behaviour case, and it fails if a later edit moves the field back into the module.
- **The RED commit carries more wiring than a pure RED would.** Adding a required interface member is a compile error at every call site, so `ae622f3` includes the option declaration, the accessory's reader and the runtime's assembly point with `commandTransportReady` hardcoded `true`. The behaviour — the refusal rule, the real predicate, the terminal-branch push, the unready initial default and the widened comparison — all landed in `efeae4a`, and 11 cases were watched to fail in between.
- **The two new Cucumber scenarios were checked against hazard 1 before being believed.** Each is refused by its own rule, proven by mutations 1 and 2 removing one rule at a time and failing exactly one scenario each while the other stayed green. Neither publishes a water level, so the `water_level: 2` class of error does not apply here.
- **Node 24.x was not available on this machine.** The gate ran green on Node 22.22.2 (`/usr/bin/node`, a CI target) and on the local Node 26.7.0. Node 24.x is covered by CI only, unchanged from waves 1 and 2.

## Known Stubs

None. `src/runtime/accountRuntime.ts` carried a `commandTransportReady: true` stub for exactly one commit (`ae622f3`, the RED half of the TDD pair) and was implemented in the next one. No hardcoded or placeholder value reaches a characteristic.

## Threat Flags

None. This plan adds no network endpoint, no auth path, no file access pattern, and no schema at a trust boundary. It removes reachable network traffic rather than adding any: a press that would have round-tripped into a vendor error is now refused before anything leaves the process.

The four mitigations this plan owns hold:

- **T-05-10** (a press acting on state the plugin cannot vouch for) — both scenarios assert `Then the vendor receives no command`, and mutations 1 and 2 each fail one of them.
- **T-05-11** (a read reaching the vendor) — the static gate, watched to fail against a real planted violation of each half (mutations 7 and 8).
- **T-05-12** (a refusal blamed on the wrong cause) — each rule carries its own cause string, and mutation 3 fails the case that pins which one wins.
- **T-05-13** (denial of service against the user's own controls) — accepted as planned. A single failed poll refuses presses until the next success, up to an hour at the configuration maximum. That is the truthful answer, and it is now visible: `test/runtime/accountRuntime.test.ts#reports the command transport unready after a single failed poll` asserts the recovery on the next success in the same case.

## Verification

Run on Node 22.22.2 and Node 26.7.0. Node 24.x unavailable locally.

| Gate | Result |
|---|---|
| `npm run test:coverage:direct` — `controls` pair | 45/45, 100 lines / 100 branches / 100 functions |
| `npm run test:coverage:direct` — `accountRuntime` pair | 92/92, 100 / 100 / 100 |
| `npm run test:coverage:direct` — `basementGuardian` pair | 134/134, 100 / 100 / 100 |
| `node --test` — `accessoryReadPathScope` | 5/5 |
| `node --test` — `hapImportScope` | 4/4 |
| `npm run test:cucumber -- --name "is refused locally"` | 2 scenarios, 22 steps, all passing |
| `npm run check` | green (typecheck, lint, fallow, format:check, unit + Cucumber) |
| `npm run test:coverage:all` | 1274 tests, 100 / 100 / 100 over `dist-test/src/**/*.js` |
| `npm run fallow` | exit 0 |
| Node 22.22.2 unit + coverage | 1274 tests, 100 / 100 / 100 |
| Node 22.22.2 Cucumber | 87 scenarios, 868 steps, all passing |

`npm run fallow` reports one pre-existing clone group in `features/support/steps/hap.ts:113-124` / `:168-181`. It predates this plan and was left alone.

## TDD Gate Compliance

`ae622f3` is the RED commit (`test(05-03)`), `efeae4a` the GREEN one (`feat(05-03)`), in that order. No refactor was needed. Eleven cases were watched to fail before the behaviour existed; the two that passed at RED are recorded under Issues Encountered with the mutation that pins each.

Task 2 is not a TDD task — it produces a gate, and its RED is the planted violation rather than a commit. Both halves were watched to fail against a real violation in `src/accessories/basementGuardian.ts` before the gate was committed.

## User Setup Required

None — no external service configuration.

## Human Verification Outstanding

One item, joining the open `G-003` / `G-004` real-home session: press a control in Apple Home while the plugin has no route to the vendor, and confirm the refusal reads as a failure the user can act on rather than as a silent no-op, and that the tile stays present and readable afterwards. The clearing push is asserted here at the characteristic; how Apple Home draws a rejected write is not assertable from the plugin side.

## Next Phase Readiness

Ready for plans 05-04 and 05-05. Three things a later plan must not undo:

- **`markMonitoring`'s store stays outside the early return AND its comparison covers every member of `MonitoringTrust`.** Plan 05-04 adds `credentialsRejected` to that type. Both halves must grow with it: mutation 6 shows what a two-field comparison does once the type has three, and the same failure shape is waiting for a fourth.
- **`commandTransportReady` has exactly one source.** The accessory reads the stored trust and the runtime assembles it in one place. A second reader — a row that publishes from the runtime while the binder reads the accessory — is the disagreement `D-07` asks the accessory to prevent.
- **The read-path gate's floors move up, never down.** Plan 05-04 is expected to add at least one module under `src/`; `SOURCE_MODULE_FLOOR` and `hapImportScope.test.ts`'s `SOURCE_FILE_FLOOR` should be raised to whatever the walk then reports, read from the gate rather than computed.

`REQUIREMENTS.md` still shows `RES-04` `Pending`, which is correct: this plan delivers the command-gating and read-path halves, and plans 05-04 and 05-05 owe the rest.

---

*Phase: 05-degraded-operation-and-recovery*
*Completed: 2026-09-01*

## Self-Check: PASSED

The created gate module and this summary both exist on disk. All three task commits (`ae622f3`, `efeae4a`, `54095b4`) are reachable from `HEAD`, and each was confirmed non-empty with `git show --name-only --format=""` at the moment it was made.
