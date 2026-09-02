---
phase: 05-degraded-operation-and-recovery
verified: 2026-09-02T16:56:36Z
status: gaps_found
score: 3/4 roadmap success criteria verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 1/4
  gaps_closed:
    - "SC-2 (CR-01): a family-valid value arriving on a working transport now reaches the tile while `Status Active` alone carries the doubt"
    - "SC-2 (CR-01 upstream half, D-13): a shadow that has missed two heartbeats hands telemetry back to the poll, so the flood a poll finds during silence actually reaches HomeKit"
    - "SC-2 (WR-01): `Pump Controller Link Lost` reports `Status Active = false` when both transports are down, and every scope reports `unreachable` rather than `controller-link-lost`"
    - "SC-3 command half (WR-02): a press on a restored control in the failed-restart window is refused with -70412 and a named cause, and the live binder replaces the refusal on first publish"
    - "SC-4 first half (CR-02): the shadow-silence degradation clears at the message that proves recovery, not at the next poll tick"
    - "README: `the plugin holds no value back while it waits` is now a true statement about the shipped code"
  gaps_remaining:
    - "SC-4 second half: a credential rejection is now reached mid-run, but the presentation it produces does not survive the next live message"
    - "`REQUIREMENTS.md` RES-04 `Complete` overstates clause 4"
  regressions:
    - "None found in SC-1, SC-2 or SC-3. The gap below is a new defect in the state plan 05-07 created, not a regression of previously working behaviour."
gaps:
  - truth: "Authentication rejection remains a clear user-actionable communication failure. (ROADMAP SC-4, second half; RES-04 clause 4)"
    status: partial
    reason: >-
      CR-03's core is genuinely closed: `haltOnTerminalAuthFailure` is now reached from the launch,
      the poll catch and the rotation catch, all three loops stop, and `AUTHENTICATION_STOPPED` is
      recorded. Mutating the poll catch's call away kills a scenario, so the halt is real and pinned.
      What does not hold is the word `remains`. The halt does not close the shadow socket --
      `closeQuietly(shadow)` is reached only from `stop()` -- and `onReportedPatch` carries no
      `halted` guard. So a live message arriving after the halt reaches
      `store.applyReportedPatch` -> `subscribeToLiveState` -> `accessory.update()`, and an ordinary
      `updateValue` clears a stored `statusCode` (confirmed against the pinned real HAP 2.2.2:
      after `updateValue(new HapStatusError(-70402))` a plain `updateValue(false)` returns
      `statusCode` to `0` and the get answers normally again).
      Measured end to end through the Cucumber harness, three scenarios written for this report:
      (a) control -- refusal, no heartbeat: every service refuses reads, the D-10 presentation holds;
      (b) treatment -- refusal, then one heartbeat carrying a changed `water_level`: every service
      answers reads again, including `Basement Guardian Offline`, and `Sump Pit Flood` reports
      `Status Active` as **`true`**;
      (c) two simulated hours later: still readable, still `Status Active = true`.
      The runtime is permanently dead at that point -- no poll, no rotation, no command, and the
      vendor block lifts only thirty days after the last attempt -- while Apple Home shows a normal,
      fully-vouched-for accessory. That is a false normal after a terminal failure, which is the
      failure this project exists to prevent, and it is a weaker presentation than the
      `Status Active - No` row D-10 rejected by name as "too easy to miss for a failure only the
      user can resolve".
      The defect is order-dependent and bites the common case. When the shadow was healthy at halt
      time -- a vendor REST refusal after a password change, with the MQTT socket still running on
      temporary AWS credentials that outlive it -- `reportedShadowSilent` is `false`, so the arrival
      path never calls `reportMonitoringHealth()`, so the platform's `credentialsRejected` branch
      never re-marks. When the shadow was already silent at halt time the arrival does report, the
      platform re-marks, and the presentation survives. Nothing re-marks on shadow disconnection
      either: `handleShadowDisconnected` pushes no monitoring trust.
    artifacts:
      - path: src/runtime/accountRuntime.ts
        issue: >-
          `haltOnTerminalAuthFailure` (lines 485-501) stops the loops but does not close the shadow;
          `onReportedPatch` (lines 586-618) carries no `halted` guard, so live messages keep flowing
          into the accessory tier after the runtime has stopped for good.
      - path: src/platform.ts
        issue: >-
          `markServicesUnreadable` is applied once, from the `credentialsRejected` branch of the
          monitoring-health handler (lines 376-397). Nothing re-applies it, and every later
          `accessory.update()` clears it.
      - path: README.md
        issue: >-
          Lines 149-151 state "The refusal has the same effect whenever it arrives, at the first
          sign-in or during a run" and "Every service then stops answering whether the plugin
          vouches for it." Neither is true for a run in which one live message follows the refusal.
      - path: features/degradedOperation.feature
        issue: >-
          `A credential refused after a healthy start makes every service unreadable` asserts the
          marking at the instant it lands and never publishes a message afterwards, so it passes
          against the defect.
    missing:
      - "Make the terminal state durable rather than a one-shot push. Either close the shadow in `haltOnTerminalAuthFailure` the way `stop()` does, or guard `onReportedPatch` on `halted`, or re-apply the unreadable marking after any push that could have cleared it."
      - "A scenario that publishes a changed heartbeat AFTER the mid-run refusal and asserts every service still answers no read. Without it the fix is unprovable and the current scenario stays blind to it."
      - "Correct README lines 149-151 to whatever ships, or ship the durable behaviour they already promise."
  - truth: "`REQUIREMENTS.md` RES-04 carries a completion state that agrees with what this phase shipped. (05-05 / 05-10 must_have)"
    status: partial
    reason: >-
      Three of the four clauses now hold and were verified by execution, which is real movement from
      the last report. Clause 4 does not. `only explicit credential rejection yields a persistent
      communication failure requiring user action` holds in the `only` direction -- a transport
      outage leaves every service readable, confirmed -- and fails on `persistent`. The named
      assertion the row cites for that clause,
      `D-13 pushes a rejected credential and records the authentication stop for a refusal that
      follows a healthy start`, asserts that the push HAPPENED. It does not assert that it survives.
      The row's own method -- one named passing assertion per clause -- is sound; this clause's
      assertion does not cover the word the clause turns on.
    artifacts:
      - path: .planning/REQUIREMENTS.md
        issue: "Line 69 marks RES-04 `Complete` and line 150 repeats it; clause 4 of line 69's own text is not satisfied."
    missing:
      - "Close the gap above, then the row is accurate. Until then RES-04 should name the clause rather than read `Complete`."
deferred:
  - truth: "The `Pump Controller Link Lost` warning names five poisoned scopes where seven are poisoned"
    addressed_in: "Recorded deferral (deferred-items.md, found during 05-06)"
    evidence: >-
      Confirmed still present by probe: the warn line reads "water, pump, power, battery, and fault
      values are retained", omitting `self-test` and `alarm-mute`. Diagnostic vocabulary, not a
      safety path; the README states the seven correctly (line 133). Not a phase gap.
  - truth: "Shadow silence is measured against a wall clock that can jump (IN-03)"
    addressed_in: "Explicit phase deferral, WINDOWS ledger entry 14"
    evidence: "Disposition recorded in 05-VALIDATION.md with the reason 05-06-PLAN.md gave."
  - truth: "The nine-member `DiscoveryContext` literal is written three times (WR-05)"
    addressed_in: "Explicit phase deferral, WINDOWS ledger entry 14"
    evidence: "Structural duplication in the composition root; no behavioural consequence."
behavior_unverified_items: []
coincidental_reliance_items: []
human_verification:
  - test: "Install this build over an accessory cache written by a release that predates it. Restart Homebridge with the vendor cloud unreachable. Open the accessory in Apple Home."
    expected: "The tile is present, showing the reading the previous run left, with `Status Active - No` under Details, and no service carries a characteristic it did not have before the upgrade."
    why_human: "insufficient_spec -- no test in this repository has met a real Homebridge accessory cache; the harness restores through a JSON round trip of its own design. 05-02's declared `verification: backstop` truth. Extends `04-UAT.md` human item 1. Correctly bundled with the G-003 / G-004 session."
  - test: "Force a credential rejection on a real paired home. Open the greyed-out accessory, try to reach its cached values, and trigger an automation built on one of its sensors. Then wait for at least one device heartbeat and look again."
    expected: "An owner can still reach the cached values, automations built on the sensors survive, and -70402 is the status Apple Home renders as No Response -- and it is still No Response after the heartbeat."
    why_human: "D-10 mandates the first half by name. The second half is new: the gap above shows the presentation is undone by the next live message, so this session should now measure how Apple Home behaves across that transition rather than only at the instant of the refusal. A negative finding on the first half reopens D-10; a confirmation of the second half is the gap above, already actionable without it."
  - test: "Force a degraded monitoring scope on a real paired home and confirm the rendering."
    expected: "The `Status Active` row reads `No`, the tile stays present, and the last value is retained."
    why_human: "Apple Home rendering cannot be asserted from the plugin side. Rides along with the open G-003 / G-004 session."
---

# Phase 5: Degraded Operation and Recovery — Verification Report

**Phase Goal:** Users keep cached safety state through restart and can tell vendor-confirmed device
offline apart from a degraded monitoring path. Each degradation clears once fresh valid data
returns.

**Verified:** 2026-09-02T16:56:36Z
**Status:** gaps_found
**Re-verification:** Yes — after the 05-06 … 05-11 gap-closure round

## How this was verified

Nothing below rests on a SUMMARY claim. Every verdict was reached one of three ways.

**Probes over the built tree.** Five scripts drove `dist-test` with the real `Gemini` family, the
real service catalogue and the real registry: the accessory publishing and trust layers (P2, P4),
the offline-confirmation counter (P7), and the restored-control refusal against the **pinned real
`@homebridge/hap-nodejs` 2.2.2** rather than the stand-in (P3, P6).

**Mutation testing.** Six mutations were applied to the compiled `dist-test` tree — a build
artifact, so the source tree was never touched — and reverted by rebuild. This answers the question
a passing suite cannot: is the assertion load-bearing, or green but blind. `git status` is clean and
`dist-test` was diffed byte-for-byte against a pristine copy afterwards.

**Scenarios written for this report.** Three Cucumber scenarios were run from a scratchpad path
against the repository's own step definitions. They added nothing to the repository and are the
evidence for the one gap below.

The suite state was established independently and is not evidence here: 95 Cucumber scenarios, 986
steps, all green. Re-run and confirmed. The gap below is invisible to it, which is the point.

## Goal Achievement

### Observable Truths — ROADMAP Success Criteria

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-1 | `Basement Guardian Offline` activates only after the configured number of successful REST snapshots report the device disconnected, and a failed REST request never counts toward that confirmation | ✓ VERIFIED | Probe P7 with `offlineConfirmationPollCount: 2`: contact `0` after one connected poll, `0` after one disconnected, `1` after two, back to `0` on the next connected poll. Two disconnected `shadow`-sourced updates leave it at `0`. A full monitoring blackout leaves it at `0`. Unchanged by the gap round |
| SC-2 | Users can distinguish pump-controller link loss, vendor-confirmed device offline, and a degraded REST/MQTT monitoring path; only the first two use their defined safety adapters | ✓ VERIFIED | Both layers hold, and both are pinned. See below |
| SC-3 | Restart without fresh cloud state leaves cached accessories and values available but visibly stale and prevents commands until valid state and command transport return | ✓ VERIFIED | Cached half unchanged and green. Command half now real: probe P3 on real HAP 2.2.2 refuses the press, names the cause, holds the toggle, clears the status on the next macrotask, and the live binder takes the slot back on first publish. Mutation M6 kills it |
| SC-4 | Fresh family-valid input clears the matching degradation promptly, while authentication rejection remains a clear user-actionable communication failure | ✗ FAILED | First half VERIFIED and pinned. Second half is now *reached* but does not *remain*: one live message after a mid-run refusal restores every service to a fully-trusted read. See the gap |

**Score:** 3/4 roadmap success criteria verified.

### SC-2 — both layers, judged separately

The criterion needed two independent mechanisms and both were checked on their own.

**Layer 1, the accessory projection (CR-01).** `isRowPublishable` exempts exactly the `unreachable`
reason while `isRowFullyTrusted` keeps the un-narrowed predicate, so a monitoring withdrawal marks
rather than withholds.

Probe P2a, shadow silent and REST healthy, a flooded poll:

```text
healthy Sump Pit Flood: {"Leak Detected":0,"Status Active":true}
silent  Sump Pit Flood: {"Leak Detected":1,"Status Active":false}
untrusted: water:unreachable,pump:unreachable,...(7 scopes)
```

The flood reaches HomeKit and the trust row alone carries the doubt. **Mutation M1** —
`SEEING_LESS_REASONS` emptied, reverting the fix — kills 2 Cucumber scenarios. The end-to-end tier
is not blind to it, which is what the carried Phase 4 warning asked to be re-established.

**Layer 2, telemetry ownership (D-13, plan 05-11).** `pollTelemetry` froze telemetry during silence
because `releaseShadowSource()` had one caller, `handleShadowDisconnected`. The release now also
fires at the head of `applyDevices`, gated on `health.trustNow().shadowSilent`, upstream of every
`applyDiscovery` write. **Mutation M3** — that call disabled — kills
`A pit that floods after the live path went quiet still reaches Apple Home` on the assertion
`| water_level | 31 |`. Layer 2 is genuinely load-bearing and not a duplicate of layer 1.

**WR-01, the layer order.** `distrustReasonsOf` now fills `invalid`, then `unreachable`, then
`controller-link-lost`. Probe P2b, controller link lost with both transports down:

```text
link lost, transports OK : Pump Controller Link Lost {"Contact":1,"Status Active":true}
link lost, both down     : Pump Controller Link Lost {"Contact":1,"Status Active":false}
untrusted: all eight scopes report `unreachable`
```

**Mutation M2** — the two layers swapped back — kills one Cucumber scenario and one unit assertion
with an exact reason-map diff. Pinned at both tiers.

**Only the first two use their safety adapters.** Probe P2c: with both transports down, neither
`Basement Guardian Offline` nor `Pump Controller Link Lost` activates. The contacts stay `0` and
only `Status Active` moves. A monitoring failure never asserts a device fact.

### The narrowing did not open a false-normal path

The obvious risk of exempting `unreachable` is that an *invalid* value rides out on the exemption.
It does not. `reasonsOf(violated, 'invalid')` runs first and the monitoring layer fills only empty
scopes, so `invalid` beats `unreachable` and stays withheld. Verified three ways:

| Case | Result |
|---|---|
| P4a — invalid `water_level` arriving *during* silence | `water:invalid`; the last valid reading (code 1 / 20 %) is retained, `Status Active` false. The bad value never reaches the characteristic |
| P4b — invalid first, silence second | `water:invalid` survives the monitoring layer; the other seven scopes go `unreachable`. Same retained value |
| P4c — the whole payload unresolvable during silence | All eight scopes `invalid`, the flood reading retained, `Status Active` false |

With both transports down no new value arrives at all, so the exemption changes nothing there:
`markMonitoring` republishes the values already on the characteristics. The behaviour changes only
where a working transport delivered something new, which is exactly CR-01's case.

### The one gap — SC-4's second half

CR-03's core is fixed and I want to be precise about that, because the fix is real: the halt is
reachable from all three call sites, all three loops stop, and **mutation M4** — the poll catch's
call to `haltOnTerminalAuthFailure` disabled — kills a scenario. A mid-run refusal now genuinely
stops the plugin. That was the whole of CR-03 as written.

What the phase also has to deliver is that the refusal *remains* visible. It does not.

`haltOnTerminalAuthFailure` does not close the shadow socket, and `onReportedPatch` has no `halted`
guard. On real HAP 2.2.2 (probe P6) an ordinary `updateValue` clears a stored `statusCode`:

```text
2 value/status: true -70402      get -> throws
3 value/status after an ordinary push: false 0    get -> ok
```

Driven end to end through the harness — control and treatment, both scenarios written for this
report and both passing as written:

| Scenario | Assertion | Result |
|---|---|---|
| Mid-run refusal, **no** heartbeat | every service *answers no read* for `Status Active` | holds — D-10's presentation is correct at the instant it lands |
| Mid-run refusal, **one** changed heartbeat | `Sump Pit Flood` and `Basement Guardian Offline` *answer a read*; `Sump Pit Flood` reports `Status Active` as **`true`**; the `System Self-Test` switch answers a read | the presentation is gone |
| …and two simulated hours later | still readable, still `Status Active = true` | permanent |

The runtime is dead at that point and never recovers by itself. Apple Home shows a normal accessory.
Nothing re-marks: `handleShadowDisconnected` pushes no monitoring trust, and the arrival path's
`reportedShadowSilent` latch is `false` in exactly the case that matters — a REST credential refused
while the MQTT socket still runs on temporary AWS credentials that outlive it.

This is not a regression of previously working behaviour. Before 05-07 the mid-run halt state did
not exist, so nothing was marked and nothing was un-marked. 05-07 delivered the marking; the gap is
that it delivered a one-shot rather than a state.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/accessories/serviceCatalogue.ts` | `isRowPublishable` / `isRowFullyTrusted` split, `SEEING_LESS_REASONS` = `{unreachable}` | ✓ VERIFIED | Wired at `toRow` line 642 and the control-value path line 324. M1 kills it |
| `src/accessories/basementGuardian.ts` | monitoring layer above the controller-link layer | ✓ VERIFIED | Lines 332-354. M2 kills it at both tiers |
| `src/runtime/accountRuntime.ts` (handover) | release at the head of `applyDevices`, gated on `shadowSilent` | ✓ VERIFIED | Line 333, upstream of `applyDiscovery`. M3 kills it |
| `src/runtime/accountRuntime.ts` (recovery) | arrival-driven report, latched once per recovery | ✓ VERIFIED | Lines 616-618. M5 kills it |
| `src/runtime/accountRuntime.ts` (halt) | `haltOnTerminalAuthFailure` from launch, poll and rotation | ⚠️ PARTIAL | Reached and idempotent (M4 kills it). Does not close the shadow, so the state it creates is not durable |
| `src/accessories/controls.ts` | `bindRestoredControlRefusal`, replaceable by construction | ✓ VERIFIED | P3 on real HAP 2.2.2: refuse, name, hold, clear, replace |
| `src/accessories/staleMarking.ts` | one guarded walk shared by all three restart passes | ✓ VERIFIED | `overServicesCarrying`; M6 kills the refusal pass |
| `src/platform.ts` | `configureAccessory` calls all three passes | ✓ VERIFIED | Lines 577-588; counts logged as assertable evidence |
| `README.md` | agrees with the shipped code | ⚠️ PARTIAL | Lines 133-147 now accurate, including the `holds no value back` claim my last report called false. Lines 149-151 are not |
| `.planning/REQUIREMENTS.md` | RES-04 state agrees with what shipped | ⚠️ PARTIAL | Clauses 1-3 verified; clause 4 overstated |

### Key Link Verification

| From | To | Via | Status |
|---|---|---|---|
| `platform.configureAccessory` | `refuseRestoredControls` | direct call, line 580 | ✓ WIRED (M6) |
| `refuseRestoredControls` | `bindRestoredControlRefusal` | `overServicesCarrying` on `Characteristic.On` | ✓ WIRED (P3) |
| `createControlBinder.bind` | the restored refusal's slot | HAP's single `onSet` slot | ✓ WIRED (P3 case C) |
| `applyDevices` | `store.releaseShadowSource` | `health.trustNow().shadowSilent` | ✓ WIRED (M3) |
| `onReportedPatch` | `reportMonitoringHealth` | `reportedShadowSilent` latch | ✓ WIRED (M5) |
| `runPoll` catch | `haltOnTerminalAuthFailure` | direct call, line 739 | ✓ WIRED (M4) |
| `haltOnTerminalAuthFailure` | shadow socket shutdown | — | ✗ NOT WIRED — the gap |
| `platform` monitoring handler | `markServicesUnreadable` | `credentialsRejected` branch | ⚠️ PARTIAL — applied once, undone by any later `update()` |

### Mutation Results

| # | Mutation | Killed by | Verdict |
|---|---|---|---|
| M1 | `SEEING_LESS_REASONS` emptied (undo CR-01) | 2 Cucumber scenarios | load-bearing |
| M2 | `distrustReasonsOf` layers swapped (undo WR-01) | 1 scenario + 1 unit assertion | load-bearing |
| M3 | silence-triggered handover disabled (undo D-13) | `A pit that floods after the live path went quiet…` | load-bearing |
| M4 | poll catch no longer halts on `AuthRejectedError` | 1 scenario | load-bearing |
| M5 | arrival-driven recovery report removed (undo CR-02) | 1 scenario | load-bearing |
| M6 | restored-control refusal made a no-op (undo WR-02) | 1 scenario | load-bearing |
| M7 | live binder registers a listener instead of taking the `onSet` slot — **the exact candidate WINDOWS ledger 11 records as NOT RUN** | 55 scenarios | see below |

### Behavioural Spot-Checks

| Behaviour | Command | Result | Status |
|---|---|---|---|
| Whole suite green | `npx cucumber-js` | 95 scenarios, 986 steps, all passed | ✓ PASS |
| Flood publishes during silence | probe P2a | `Leak Detected 1`, `Status Active false` | ✓ PASS |
| Restored press refused on real HAP 2.2.2 | probe P3 case B | `statusCode -70412`, toggle stays `false`, cause named | ✓ PASS |
| Live binder replaces the refusal | probe P3 case C | press accepted, command sent, no refusal logged | ✓ PASS |
| Offline counter contract | probe P7 | 0 / 0 / 1 / 0, shadow-sourced 0, blind 0 | ✓ PASS |
| No Response survives a heartbeat | scratchpad scenario | services answer reads again, `Status Active true` | ✗ FAIL |

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|---|---|---|---|
| RES-03 | offline adapter on successful snapshots only; monitoring loss diagnosed separately without a false device alert | ✓ SATISFIED | P7 for the counter; P2c for no false alert; the SC-2 layers for the separation. Its Phase 5 sentence is genuinely delivered now |
| RES-04 | cached reads, present-and-stale, commands disabled, credential rejection persistent | ⚠️ 3 of 4 | Clauses 1-3 verified by execution. Clause 4 fails on `persistent` — see the gap |

### Judgement calls the orchestrator asked for

**Is RES-04's `Complete` row accurate?** No, but it is much closer than last time and the method
behind it is sound. Clause 3 — the one I failed last time — is now genuinely delivered, and the
row's evidence for it is the right assertion. Clause 4 is the problem: the cited assertion proves
the push happened, not that it persists, and `persistent` is the word the clause turns on. The row
should name that clause rather than read `Complete`.

**Is the SYNC-03 `Pending` judgement defensible?** Yes. I looked for a real gap wearing a
bookkeeping argument and did not find one. SYNC-03's own text was delivered in Phase 1 and only
*amended* here, the amendment is implemented and mutation-pinned (M3), and every Phase 1 row reads
`Pending` because Phase 1 predates the mark-complete habit. Closing one row of that block on Phase 5
evidence would misreport which phase delivered it. Ledger entry 12 routes it correctly to a Phase 1
close-out or a milestone audit. No Phase 5 debt hides there. The amendment note is present and
correctly disambiguates `05-CONTEXT.md` D-13 from Phase 1's own D-13.

**Ledger entry 11 — the NOT RUN mutation.** Over-cautious, and now discharged. I ran the exact
candidate it names (M7: `bind` registering an additional listener rather than taking HAP's single
`onSet` slot). It kills 55 scenarios. Separately, probe P3 case C demonstrates the replacement
directly on real HAP 2.2.2: after `bind` runs on a service that already carries the restored
refusal, the press is accepted and the command is sent with nothing refused. The behaviour is
verified. The narrow point the ledger makes — that no mutation isolates the *replacement* rather
than the binder as a whole — stands as a test-design residual, but it puts no phase outcome at risk.

**Ledger entry 13 — 22 first-round validation rows still `pending`.** The concern that matters is
the three green-but-blind rows, and it is now answered independently: M1, M2, M3, M5 and M6 each
kill at least one end-to-end scenario, so the four central mechanisms of this phase are
mutation-pinned. What remains is validation bookkeeping, not an unverified behaviour. Not a phase
gap.

**Are the three human items one real-home session, and does any block the phase?** The bundling is
right — all three need a real paired Apple Home and the same session, and they gate `1.0.0` through
`G-003`/`G-004` rather than gating this phase. None of them blocks Phase 5. Item 2's premise has
shifted, though: the D-10 check should now also look at what happens *after* a heartbeat, because
the gap above shows the No Response is undone by one. That does not turn item 2 into a phase
blocker; the gap is already actionable without a real home.

**The D-13 handover's cost, considered and accepted.** Releasing telemetry ownership on silence
means a REST body replaces what the shadow last delivered, and `An identical heartbeat clears the
shadow silence` documents the reversion (`water_level` 3 -> 1). In the harness that is a fixture
artifact: the REST body is a fixed value independent of the heartbeat. In production the vendor's
REST snapshot is fed from the same device, so a silent device makes both sources report the same
last-known state. `Status Active` marks it either way. Recorded as an observation, not a gap — it is
the explicit maintainer ruling with the tradeoff stated in D-13.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| — | — | — | — | No `TBD`, `FIXME` or `XXX` in any of the 122 files this phase changed |

### Gaps Summary

The gap round did real, verifiable work. Six of the seven things I failed last time are closed, and
they are closed properly rather than papered over: five of the six are pinned by a mutation that
kills an end-to-end scenario, and the CR-01 fix needed a second mechanism that plan 05-11 found by
disproving its own plan's premise. SC-2 and SC-3 both moved from failed to verified, and SC-4's
first half with them. The one README claim I called false is now true of the shipped code.

One gap remains, and it sits in the state the gap round itself created. 05-07 made a mid-run
credential rejection reach the terminal branch, which was the whole of CR-03 as written and which
mutation testing confirms is real. It did not make the resulting presentation durable. The halt
leaves the shadow socket open and puts no guard on the arrival path, so the first live message that
carries a changed value clears the `-70402` from all seventeen services and restores
`Status Active = true` — permanently, because nothing ever pushes again. A plugin that will never
work again until the owner changes a password then looks completely normal in Apple Home. That is
the false all-clear this project exists to prevent, arrived at from a new direction, and the current
scenario cannot see it because it never publishes a message after the refusal.

The fix is small — close the shadow on halt, or guard `onReportedPatch`, or re-apply the marking —
and the scenario that would have caught it is one step longer than the one that shipped.

---

_Verified: 2026-09-02T16:56:36Z_
_Verifier: Claude (gsd-verifier)_
