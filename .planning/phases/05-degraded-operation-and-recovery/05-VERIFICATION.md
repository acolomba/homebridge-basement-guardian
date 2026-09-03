---
phase: 05-degraded-operation-and-recovery
verified: 2026-09-03T01:41:28Z
status: passed
score: 4/4 roadmap success criteria verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 3/4
  gaps_closed:
    - "SC-4 second half: a credential rejection now survives a later live message, two simulated hours, and a press on either control. Measured end to end (P4, P5) and pinned by mutation at both tiers"
    - "`REQUIREMENTS.md` RES-04: the row is re-cited clause by clause with a discriminating mutation named for each. Four of those mutations were re-run here and all four fail something"
  gaps_remaining: []
  regressions:
    - "None. SC-1, SC-2 and SC-3 were re-measured by execution rather than carried forward, because nineteen plans touched the same seven files. All three still hold"
gaps: []
deferred:
  - truth: "A No Response accessory still lets an owner reach cached values, and automations built on its sensors survive — and it is still No Response after a device heartbeat"
    addressed_in: "G-003 / G-004 real-paired-home session (PROJECT.md release gates; 04-UAT.md item 1)"
    evidence: >-
      D-10 mandates the check by name. The heartbeat half is now answered on the plugin side by
      probes P4 and P5 and by the shipped scenario `A credential refused mid-run stays refused when
      the next heartbeat lands`; what remains is Apple Home's own rendering, which cannot be
      asserted from the plugin side. Blocks 1.0.0, not this phase.
  - truth: "Installing this build over an accessory cache written by a release that predates it leaves every tile present, marked, and carrying no characteristic it did not have before"
    addressed_in: "G-003 / G-004 real-paired-home session (05-02's declared `verification: backstop` truth)"
    evidence: >-
      No test in this repository has met a real Homebridge accessory cache; the harness restores
      through a JSON round trip of its own design. The plugin-side half is measured here — probe
      P7c shows the pass adds no characteristic to a service that never carried one and names the
      zero — but the cache format itself is exogenous.
  - truth: "A degraded monitoring scope renders as `Status Active — No` with the tile present and the last value retained"
    addressed_in: "G-003 / G-004 real-paired-home session"
    evidence: "Apple Home rendering cannot be asserted from the plugin side. Rides along with the same session."
  - truth: "The `Pump Controller Link Lost` warning names five poisoned scopes where seven are withdrawn"
    addressed_in: "Recorded deferral — WINDOWS ledger entry 6, deferred-items.md"
    evidence: >-
      Confirmed still present at `src/accessories/basementGuardian.ts:833-835`: the line reads
      "water, pump, power, battery, and fault values are retained", omitting `self-test` and
      `alarm-mute`. Diagnostic vocabulary, not a safety path; README line 133 states the seven
      correctly. Not a phase gap.
  - truth: "Shadow silence is measured against a wall clock that can jump (IN-03)"
    addressed_in: "Explicit phase deferral, WINDOWS ledger entry 14"
    evidence: "Disposition recorded in 05-VALIDATION.md with the reason 05-06-PLAN.md gave."
behavior_unverified_items: []
coincidental_reliance_items: []
human_verification: []
---

# Phase 5: Degraded Operation and Recovery — Verification Report

**Phase Goal:** Users keep cached safety state through restart and can tell vendor-confirmed device
offline apart from a degraded monitoring path. Each degradation clears once fresh valid data
returns.

**Verified:** 2026-09-03T01:41:28Z
**Status:** passed — 4/4
**Re-verification:** Yes — third verification, after the 05-13 … 05-19 round that closed
`05-REVIEW-2.md`
**Tree:** `features/phase-05-degraded-operation-and-recovery`, HEAD `10e2a60`, clean apart from an
untracked `.planning/milestone.lock`

## How this was verified

Nothing below rests on a SUMMARY claim, and nothing rests on the standing report I am replacing.

**Nine probe files, run against the compiled tree.** They drive the real `createAccountRuntime`, the
real `createDeviceStateStore`, the real `createShadowClient`, the real Gemini family, the real
service catalogue and the real registry. They live outside the repository and add nothing to it.
Every one is listed with its result below and can be re-run.

**Twelve mutations, applied to the compiled `dist-test` tree** — a build artifact, never the source
— and reverted by `npm run build:test`. `git status` was clean before and after every one, and the
final state was rebuilt from source and re-run green.

**Independent baseline.** 1385 unit tests pass on the default `node` (v26.7.0) and on `/usr/bin/node`
(v22.22.2); 102 Cucumber scenarios, 1120 steps; `npm run test:coverage:all` reports 100.00 / 100.00 /
100.00 over `src/`. **Node 24 is not installed on this machine, so no Node 24 claim is made here.**

## Goal Achievement

### Observable Truths — ROADMAP Success Criteria

| # | Truth | Status | The measurement that decided it |
|---|-------|--------|---------------------------------|
| SC-1 | `Basement Guardian Offline` activates only after the configured number of successful REST snapshots report the device disconnected, and a failed REST request never counts | ✓ VERIFIED | Probe **P7a**, threshold 2: contact `0` after one connected poll, `0` after one disconnected, `1` after two, back to `0` on the next connected poll. Two disconnected *live* documents leave it at `0`. A full monitoring blackout leaves it at `0` while `Status Active` goes `false`. Re-measured, not carried forward |
| SC-2 | Users can distinguish pump-controller link loss, vendor-confirmed device offline, and a degraded REST/MQTT monitoring path; only the first two use their defined safety adapters | ✓ VERIFIED | Probes **P8a**, **P8b**, **P1**. Three conditions read apart at the characteristic; a blackout activates neither adapter; the per-device handover now delivers the quiet pump's flood to HomeKit. Pinned by mutation at both tiers |
| SC-3 | Restart without fresh cloud state leaves cached accessories and values available but visibly stale and prevents commands until valid state and command transport return | ✓ VERIFIED | Probe **P7b**: the cached flood reading survives the restart passes (`Leak Detected = 1`), `Status Active` reads `false`, a press is refused `-70412` naming the transport, and the Switch stays readable. Probe **P7c** for the upgrade cache |
| SC-4 | Fresh family-valid input clears the matching degradation promptly, while authentication rejection remains a clear user-actionable communication failure | ✓ VERIFIED | First half: probe **P8c** — a successful poll does not clear a shadow silence, and one live message clears it at the arrival, in exactly one push. Second half: probe **P4** — a mid-run refusal closes the socket and every service still refuses a read after a changed heartbeat and after two simulated hours; probe **P2** — after a press on either control too. **This was the one gap in the standing report and it is closed** |

**Score: 4/4.**

### The four blockers

#### CR-01 — a poll must find the quiet pump's flood on a two-pump account — **CLOSED**

**Probe P1.** Two pumps, both speaking once, then pumpB heartbeating every heartbeat interval for
ten simulated hours while pumpA is silent and every poll reports pumpA's pit flooded.

```text
after first heartbeats  A = 3 v 1
elapsed 10 h, heartbeat steps = 41
  A water_level = 31  shadowVersion = undefined
  B water_level = 3   shadowVersion = 42
  last pushed trust = {"restDegraded":false,"shadowSilent":true,...}
```

The flood reaches the store, the healthy neighbour keeps the reading its own live path delivered,
and the account is told to stop vouching. **Mutation M1** — `recordShadowMessage` stamps one
account-wide key, which is the pre-05-14 shape — reproduces the review's reproduction exactly
(`A = 3, shadowVersion = 1, shadowSilent = false`) and fails **15 unit tests and 11 scenarios**.

It reaches HomeKit, not only the store. Under M1 the shipped scenario
`A poll finds a flood on the pump that went quiet while its neighbour keeps reporting` fails on
`Then the "Sump Pit Flood" service on "Front Sump Pump" reports "Leak Detected" as "1"`.

#### CR-02 — a press after a credential refusal must leave both controls marked — **CLOSED**

**Probe P2**, the whole terminal act as the platform performs it, then a press on each Switch.

```text
after refusal     every watched service: refused(-70402)
press             refused(-70412) | 1 deferred macrotask
after press       every watched service: refused(-70402)
after mute press  every watched service: refused(-70402)
commands sent     []
```

**Mutation M2** — the `credentialsRejected` guard removed from the binder's `republish` callback —
reproduces the defect (`System Self-Test` and `Alarm Mute` return to `answered(...)`) and fails
**3 unit tests and 1 scenario**.

Worth naming: under M2 the controls answer `false`, not the review's `true`. WR-03's widening now
puts a truthful value under the status, so **the two fixes are independent and each does its own
half.** Probe P2b measures the widening on its own — every one of the eight scopes reports
`unreachable` under a refused credential — and confirms D-02's narrowing survived it:
`Basement Guardian Offline` still publishes its `ContactSensorState` rather than being withheld.

#### CR-03 — a metadata-only shadow document — **CLOSED, both halves**

**Probe P3a**, ownership: a `state`-only document with `version: 9` leaves `shadowVersion`
`undefined` and merges its metadata; the next poll wins with `water_level: 31`. **Probe P3b**, the
device still speaking: the report re-arms the silence window and moves `receivedAt`; two full
heartbeats of real quiet after it still report silent.

Both directions are pinned. Reverting the ownership guard to `carriesObservation` fails P3a plus
**2 unit tests and 1 scenario**. Over-narrowing `carriesObservation` to `patch.data !== undefined`
— the "false silence" 05-15 refused — fails P3b's `receivedAt` assertion and the unit case
`advances the receipt time and establishes no watermark for a patch that reports only device
metadata`. **Narrowing too far leaves all 102 scenarios green,** so that one unit case is the whole
protection for the second half.

#### CR-04 — README and CHANGELOG — **CLOSED**

The sentence `the plugin holds no value back while it waits` is gone from both files (`grep` finds
it nowhere). README now reads "The delay is to the report **and to the reading**", names the
two-missed-heartbeat handover, says the handover is per system and the marking is account-wide, and
states "Every service **that reports whether the plugin vouches for it** then stops answering."
Every one of those clauses is true of code measured in this report (P1, P8a, P7c). CHANGELOG's
"successful polls keep their readings current" is replaced by "It hands the readings back to polling
at the same moment."

### The eight warnings

| # | Warning | Status | Evidence |
|---|---------|--------|----------|
| WR-01 | The unit case pinning the credential-refusal push order passed with the order inverted | ✓ CLOSED | **Mutation M3** — the error push moved above the boolean fan-out — now fails `leaves the pushed status standing over an accessory that republishes its own rows`, `tells an operator when a credential refusal reached no service at all`, and **3 scenarios**. It left all 1348 unit tests green when the review ran it |
| WR-02 | The row published the reported value while the write path refused "no fresh state" | ✓ CLOSED | Probe **P6a**: during shadow silence `On` still answers `false` and the press is refused with *"the live connection is quiet, so the plugin cannot see the device confirm the command"* — not "no fresh state". **Mutation M4**, deleting the rule from `LOCAL_REFUSALS`, fails **8 unit tests and 2 scenarios** |
| WR-03 | `credentialsRejected` withdrew no trust scope | ✓ CLOSED | Probe **P2b**: all eight scopes `unreachable`, every `Status Active` reads `false` under the marking, and the offline adapter still publishes its verdict |
| WR-04 | The `credentialsRejected` member of the republish comparison was unprovable | ✓ CLOSED | **Mutation M5** — the member replaced with `true` — now fails **4 unit tests**, all three of them WR-03's own cases plus one. It left 1348 unit tests and 96 scenarios green when the review ran it |
| WR-05 | The account-wide release stripped ownership from healthy devices | ✓ CLOSED | `releaseShadowSource(deviceId)` takes its device; the disconnection path loops explicitly. Probe **P1** measures the consequence: pumpB keeps `3` across 41 polls of its neighbour's silence |
| WR-06 | A confirmation on the poll that crossed into silence was dropped and expired with a false warning | ✓ CLOSED | Probe **P6b**: after the confirming snapshot, `armed delays: []` — the deadline was cancelled — and no expiry warning is logged. **Mutation M6**, reconciling through the trust gate again, fails P6b and **2 named unit cases** |
| WR-07 | `DiscoveryContext` built three times | ✓ CLOSED | One literal at `src/platform.ts:530`, three call sites. I ran the gate's own detector independently against the real file: **2 shapes** (the interface plus one literal), **3** with a literal planted. The gate is non-vacuous and does not move on a property read |
| WR-08 | `markServicesUnreadable` claimed more than the pass does | ✓ CLOSED | Renamed `markTrustReportsUnreadable`; docblock restated; the zero-count line ships and has its own case. **Mutation M7**, dropping the `testCharacteristic` guard, fails **14 unit tests**. README:151 corrected by 05-19 |

### Binding decisions from `05-CONTEXT.md`

| Decision | Status | Measurement |
|---|---|---|
| D-02 — a REST-only degradation withdraws `connectivity` and only `connectivity` | ✓ HONOURED | Probe **P8a**: REST degraded → `{connectivity: unreachable}` exactly; shadow silent → the seven non-connectivity scopes exactly; both down → all eight |
| D-11 — clearing matched to cause | ✓ HONOURED | Probe **P8c**: a successful poll across the silence window leaves `shadowSilent: true` with `restDegraded: false`; one live message clears it, in exactly one push, at the arrival |
| D-13 — two missed heartbeats release the shadow's ownership of telemetry | ✓ HONOURED, per device | Probes **P1** and **P3a**. See the residual below for the one shape it does not cover |
| D-01, D-03, D-04 | ✓ HONOURED | Probe **P8b**: three conditions read apart on one signal; the `FailureLog` line carries the cause |
| D-05, D-06, D-07, D-08, D-09, D-10, D-12 | ✓ HONOURED | Probes **P7a/b/c**, **P6a**, **P2**, **P4**. The read-path and cloud-import gates were re-run as part of the full unit suite |
| `03-CONTEXT.md` D-05 — `publishPersistentFailure` keeps exactly **one** production call site | ✓ HONOURED | `grep -rn publishPersistentFailure src/` answers its declaration in `serviceCatalogue.ts`, one import in `staleMarking.ts`, and **one call at `staleMarking.ts:171`**. 05-16 explicitly refused the review's first option because it would have made the count two |

### Every probe, so a later reader can re-run them

Probes live in the session scratchpad and import from `dist-test`. Run with `node --test <file>`
after `npm run build:test`.

| Probe | What it drives | Result |
|---|---|---|
| P1 `p1-cr01.test.mjs` | Real runtime, two devices, 41 heartbeat steps, 10 simulated hours | ✓ PASS — A reaches 31, B holds 3 |
| P2 `p2-cr02.test.mjs` | Real accessory + `applyMonitoringHealth`, refusal then two presses | ✓ PASS — every service `refused(-70402)` throughout |
| P2b (same file) | The marking alone, no error push | ✓ PASS — eight scopes `unreachable`, offline adapter still publishes |
| P3a `p3-cr03.test.mjs` | Real store, metadata-only document then a poll | ✓ PASS — the poll wins |
| P3b (same file) | The same document as evidence the device spoke | ✓ PASS — `receivedAt` moves, silence re-arms, real quiet still reported |
| P4 `p4-sc4.test.mjs` | Runtime + store + accessory wired as the platform wires them; mid-run refusal, heartbeat, two hours | ✓ PASS — shadow closed once, every service refuses a read at every point |
| P5 `p5-shadow-gate.test.mjs` | **The real `createShadowClient`** over a stub transport | ✓ PASS — 1 patch before `close()`, 1 after, 1 after it settles |
| P6a `p6-controls.test.mjs` | Row and write path during shadow silence | ✓ PASS — one fact, and the cause names the quiet connection |
| P6b (same file) | A confirmation on the poll that crossed into silence | ✓ PASS — deadline cancelled, no expiry warning |
| P7a `p7-sc1-sc3.test.mjs` | The offline confirmation counter | ✓ PASS — 0 / 0 / 1 / 0; live docs 0; blackout 0 |
| P7b (same file) | The three restart passes on a restored accessory | ✓ PASS — 2 controls refused, 17 services marked, reading retained, press refused |
| P7c (same file) | An upgrade cache carrying no trust report | ✓ PASS — marked 0, no characteristic added |
| P8a `p8-sc2.test.mjs` | D-02's three withdrawal shapes | ✓ PASS |
| P8b (same file) | The three conditions read apart; blackout asserts no device fact | ✓ PASS |
| P8c (same file) | D-11 clearing | ✓ PASS |
| P9a `p9-residual.test.mjs` | Four hours of metadata-only reports over a held watermark | ⓘ OBSERVATION — see below |

### Every mutation

Applied to `dist-test`, reverted by rebuild. The tree was rebuilt from source and re-run green
afterwards (1385 / 102 / 1120).

| # | Mutation | Fails | Verdict |
|---|---|---|---|
| M1 | `recordShadowMessage` stamps one account-wide key (undo CR-01/WR-05) | 15 unit, 11 scenarios | load-bearing |
| M2 | the `credentialsRejected` guard removed from `republish` (undo CR-02) | 3 unit, 1 scenario | load-bearing |
| M3 | `nextShadowVersion` reads `carriesObservation` again (undo CR-03 ownership) | 2 unit, 1 scenario | load-bearing |
| M3b | `carriesObservation` narrowed to `patch.data` (over-narrow) | 1 unit, **0 scenarios** | load-bearing at the unit tier only |
| M4 | `void closeQuietly(shadow)` deleted from the halt | 1 unit, 1 scenario — **and, with the mechanism assertion suppressed, the user-visible `still answers no read` assertion fails too** | load-bearing on the behaviour, not only the mechanism |
| M5 | the error push moved above the boolean fan-out (undo WR-01) | 2 unit, 3 scenarios | load-bearing — left 1348 green for the reviewer |
| M6 | `credentialsRejected` member replaced with `true` (undo WR-04) | 4 unit, 0 scenarios | load-bearing — left 1348 + 96 green for the reviewer |
| M7 | reconcile through the trust gate again (undo WR-06) | 2 unit, 0 scenarios | load-bearing at the unit tier |
| M8 | the quiet-live-connection rule deleted from `LOCAL_REFUSALS` (undo WR-02) | 8 unit, 2 scenarios | load-bearing |
| M9 | the quiet rule reordered above the transport rule | 1 unit, 0 scenarios | load-bearing — **exactly as WINDOWS ledger 26 says**, unit tier only |
| M10 | `testCharacteristic` guard dropped from the shared walk (undo WR-08) | 14 unit | load-bearing |
| M11 | both `configureAccessory` passes deleted | 5 unit, **0 scenarios** | load-bearing at the unit tier only — **exactly as WINDOWS ledger 1 says** |
| M12 | `!halted` dropped from `commandTransportReadyNow()` | 2 unit, 1 scenario | load-bearing — **contradicts WINDOWS ledger 2, see below** |

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/runtime/monitoringHealth.ts` | per-device arrival stamps; `silentDevices()`; account-wide `trustNow()` | ✓ VERIFIED | `Map<string, number>`; `admitDevice` does not re-stamp; `forgetDevice` prunes. M1 kills it |
| `src/runtime/accountRuntime.ts` (handover) | per-device release at the head of `applyDevices` | ✓ VERIFIED | Line 339-341, upstream of every `applyDiscovery`. M1 kills it |
| `src/runtime/accountRuntime.ts` (halt) | `haltOnTerminalAuthFailure` stops the loops **and closes the shadow** | ✓ VERIFIED | Line 544 `void closeQuietly(shadow)`, synchronous into `close()`. M4 kills it |
| `src/cloud/shadow.ts` | `close()` sets `closing` before ending the transport; `isCurrent` gates `onMessage` | ✓ VERIFIED | **P5 measures this against the shipped client, not the comment.** It is the single mechanism SC-4's second half rests on |
| `src/device/state.ts` | ownership guard reads `patch.data`; `carriesObservation` left wide for receipt | ✓ VERIFIED | Lines 226-242. M3 and M3b kill it from opposite sides |
| `src/accessories/basementGuardian.ts` | `credentialsRejected → EVERY_SCOPE`; guarded `republish`; `reconcileControls` on the decoded value; `liveConfirmationObservable` | ✓ VERIFIED | Lines 317-327, 677-683, 870-873, 618-620. M2, M6, M7 kill them |
| `src/accessories/controls.ts` | third refusal rule with a true cause, between transport and state | ✓ VERIFIED | Line 155 of `LOCAL_REFUSALS`. M8 and M9 kill it |
| `src/accessories/staleMarking.ts` | one guarded walk; `markTrustReportsUnreadable` | ✓ VERIFIED | M10 kills it |
| `src/platform.ts` | one `DiscoveryContext` literal; fan-out before the error push; zero-count line | ✓ VERIFIED | Lines 530, 380-410. M5 and M11 kill them; the static gate re-derived independently |
| `README.md` | agrees with the shipped code | ✓ VERIFIED | Every clause of the degradation section traced to a measurement above |
| `CHANGELOG.md` | agrees with the shipped code | ✓ VERIFIED | The overstated line is replaced |
| `.planning/REQUIREMENTS.md` | RES-03 / RES-04 states agree with what shipped | ✓ VERIFIED | RES-04 re-cited clause by clause; four of its named mutations re-run here and all four fail something |

### Key Link Verification

| From | To | Via | Status |
|---|---|---|---|
| `applyDevices` | `store.releaseShadowSource(deviceId)` | `health.silentDevices()` | ✓ WIRED (M1) |
| `applyDiscovery` admission | `health.admitDevice` | direct call, line 347 | ✓ WIRED |
| `onDeviceRemoved` confirmation | `health.forgetDevice` | line 382 | ✓ WIRED |
| `onReportedPatch` | `health.recordShadowMessage(deviceId)` | line 667, per device | ✓ WIRED (M1) |
| `haltOnTerminalAuthFailure` | shadow socket shutdown | `void closeQuietly(shadow)`, line 544 | ✓ WIRED (M4, P5) — **the gap the last report found, now closed** |
| `shadow.close()` | `onReportedPatch` silenced | `closing` → `isCurrent` → `onMessage` | ✓ WIRED (P5) |
| binder `republish` | `credentialsRejected` guard | line 678 | ✓ WIRED (M2) |
| `platform` monitoring handler | `markTrustReportsUnreadable` | `credentialsRejected` branch, after the fan-out | ✓ WIRED (M5) |
| `reportedControlValue` | `isRowPublishable` | the row's own rule, one copy | ✓ WIRED (M8) |
| `reconcileControls` | `decodedControlValue` | no trust gate | ✓ WIRED (M7) |
| `configureAccessory` | both restart passes | direct calls, lines 596-597 | ✓ WIRED (M11, unit tier) |

### Data-Flow Trace

| Artifact | Value | Source | Real data | Status |
|---|---|---|---|---|
| `Sump Pit Flood` / `Leak Detected` on the quiet pump | `1` | REST poll body, after the per-device release | yes | ✓ FLOWING (P1, scenario) |
| `Sump Pit Level` / `Water Level` on the healthy neighbour | `80` | that pump's own heartbeat | yes | ✓ FLOWING (scenario) |
| `Status Active` under a refused credential | `HapStatusError(-70402)` | `applyMonitoringHealth` → `markTrustReportsUnreadable` | yes | ✓ FLOWING (P2, P4) |
| `Basement Guardian Offline` / `ContactSensorState` | `0` / `1` | the confirmation run over poll snapshots only | yes | ✓ FLOWING (P7a) |
| Restored `Leak Detected` after a restart | `1` | the Homebridge accessory cache HAP serialized | yes | ✓ FLOWING (P7b) |
| Merged shadow `metadata` | `{wifi_signal_dbm, mcu_firmware_version}` | a `state`-only document | yes | ✓ FLOWING (P3a) |

### Behavioural Spot-Checks

| Behaviour | Command | Result | Status |
|---|---|---|---|
| Unit suite, default node v26.7.0 | `node --test "dist-test/test/**/*.test.js"` | 1385 pass / 0 fail | ✓ PASS |
| Unit suite, `/usr/bin/node` v22.22.2 | same, explicit file list | 1385 pass / 0 fail | ✓ PASS |
| Cucumber | `npx cucumber-js` | 102 scenarios, 1120 steps, all pass | ✓ PASS |
| Coverage | `npm run test:coverage:all` | 100.00 / 100.00 / 100.00 over `src/` | ✓ PASS |
| Full gate | `npm run check` | typecheck, lint, fallow, format, both suites — clean | ✓ PASS |
| Node 24 matrix leg | — | **not installed on this machine** | ? SKIP — no claim made |

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|---|---|---|---|
| RES-03 | offline adapter on successful snapshots only; monitoring loss diagnosed separately without a false device alert | ✓ SATISFIED | P7a for the counter and for a live document not counting; P8b for the blackout asserting no device fact; P8a/P8b for the separation. Phase 5's remaining sentence is delivered |
| RES-04 | cached reads, present-and-stale, commands disabled, credential rejection persistent | ✓ SATISFIED, all four clauses | Clause 1: the read-path and cloud-import gates run green in the suite. Clause 2: P7b/P7c, with the call site gated at the unit tier (M11). Clause 3: P7b and P6a. Clause 4: **P4, P5 and P2** — the clause that was overstated last time. The `only` direction still holds: `A transport outage leaves every service readable` |

The `Complete` mark on both rows is now accurate. Line 72's clause-by-clause re-citation names a
discriminating mutation for each clause; I re-ran four of them (M5, M2, M8, M10) and every one fails
something.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| — | — | — | — | No `TBD`, `FIXME`, `XXX`, `TODO`, `HACK` or `PLACEHOLDER` in any of the 36 `src/`, `test/`, `features/`, README or CHANGELOG files this phase changed |

## Things I found that fail nothing

These change no verdict. Each is recorded because a later reader should not have to rediscover it.

### 1. Settling WINDOWS ledger entry 33 — my predecessor's record was wrong and the review was right

Entry 33 asks a re-verification to settle a contradiction. Settled: **`05-REVIEW-2.md` CR-04 was
correct and the standing `05-VERIFICATION.md` was not.** That report listed among its `gaps_closed`:
"README: `the plugin holds no value back while it waits` is now a true statement about the shipped
code." It was false for the whole ~30-minute window its own paragraph was about, exactly as CR-04
measured. Plan 05-19 deleted the sentence rather than softening it. This report replaces that record;
the `05-VALIDATION.md` gap-closure row pinned on the same sentence is moot because the sentence no
longer exists. **Neither the review nor 05-19 should be doubted on this; the previous verifier
should.**

### 2. WINDOWS ledger entry 2 is now stale and can be closed

Entry 2 records that `commandTransportReadyNow()`'s `!halted` term is redundant and that no test
fails when it is removed. **That is no longer true.** Mutation M12 — dropping `!halted` — fails 2
unit tests and 1 scenario. WR-03's scope withdrawal and 05-16's cases made the term load-bearing.
The entry should be closed rather than waived.

### 3. SC-4's durability is single-layered, and the layer is in another module

`haltOnTerminalAuthFailure` does not guard `onReportedPatch` on `halted`, and nothing re-applies the
marking. The whole presentation therefore rests on one fact: that `shadow.close()` synchronously sets
`closing`, and that `isCurrent` gates `onMessage`. Probe **P5** confirms it against the shipped
client, so the criterion holds. But probe **P4** also shows what happens if that one gate is ever
bypassed — I forced a patch into `onReportedPatch` after the halt and **every service returned to
`answered(false)` permanently**. The previous report's `missing` list offered three fixes; the
executor took one. That is legitimate, and the remaining two (a `halted` guard on the arrival path, or
re-applying the marking) are cheap defence in depth for a plugin whose whole point is refusing a false
all-clear. Not a gap — a note for whoever next touches `shadow.ts`.

### 4. Telemetry ownership has no expiry of its own once established

CR-03's fix guards *establishing* the watermark, exactly as the review prescribed. It does not guard
*retaining* it. Probe **P9a**: a device sends one telemetry heartbeat, then four hours of
metadata-only reports while every poll reports a flooding pit.

```text
metadata-only reports : 17
stored water_level    : 3   (the poll reported 31 throughout)
shadowVersion         : 18
last pushed trust     : {"restDegraded":false,"shadowSilent":false,...}
```

Telemetry frozen at `3`, nothing marked, everything vouched for. This is CR-03's symptom reached from
the retention direction. **It is not a phase gap and not a defect against any decision:** D-13 says
ownership ends on two missed heartbeats, a metadata report *is* a heartbeat, and 05-15's key-decision
records deliberately leaving `carriesObservation` wide so a metadata-reporting pump does not read as
silent. It also may not be reachable — if the vendor's REST snapshot is fed from the same shadow, the
two sources cannot diverge the way my probe forces them to. **It is a maintainer question, not a
gap:** should telemetry ownership expire on the absence of a *telemetry* document rather than on the
absence of *any* document? Recommend a WINDOWS entry.

### 5. Two protections live at one tier only, and both are already recorded honestly

- Deleting **both** `configureAccessory` passes fails 5 unit tests and **zero** scenarios (M11),
  because `features/support/world.ts` calls the exported passes itself. WINDOWS ledger 1 and RES-04's
  clause 2 correction both say exactly this. Verified, and the record is accurate.
- Reordering the quiet-connection rule above the transport rule fails **one** unit case and zero
  scenarios (M9). WINDOWS ledger 26 says exactly this. Verified.
- Narrowing `carriesObservation` too far fails **one** unit case and zero scenarios (M3b). This one is
  *not* in the ledger. It is the whole protection for CR-03's second half, and a later author
  refactoring `state.ts` would have no warning. Worth an entry.

### 6. The 29 open ledger entries — which warrant a maintainer decision

Reviewing all 29 against the code: most are deviation records that document a plan premise that did
not survive measurement, which is the ledger working as intended. Three are more than bookkeeping and
should get a maintainer decision rather than a blanket waive at ship time:

- **Entry 19** — shadow-silence marking is account-wide on a multi-pump account, so one quiet pump
  makes the owner's *working* pump stop vouching too. Deliberate in 05-14, argued in 05-VALIDATION,
  and now stated in the README. It is a real user-facing cost on a multi-system account and the phase
  chose it knowingly. A decision, not a defect.
- **Entry 6** — the controller-link warn line names five poisoned scopes where seven are withdrawn.
  Confirmed still present. Diagnostic only; the README states the seven correctly.
- **Entry 32** — 22 rows in the first-round verification map still read `pending` and are not. Plan
  05-19 could not edit them without breaking its own prohibition and appended a reconciliation
  instead. Bookkeeping, but it makes the map misleading to a reader who does not find the appendix.

**Entries 2 and 33 above should be closed** on this report's evidence. The rest are correctly scoped
and none blocks the phase.

### 7. The account-wide/per-device split, stated plainly

Because it took three rounds to get here and is easy to misread: **the telemetry handover is per
device; the trust marking is account-wide.** `silentDevices()` releases each quiet pump's watermark on
its own, while `trustNow().shadowSilent` is `silentDevices().length > 0`. Both halves are measured in
P1 and both are stated correctly in the README.

## Verdict

The phase reaches **4/4**. Every one of the four blockers is closed in the code and every closure is
pinned by a mutation I applied and reverted myself; every one of the eight warnings is closed, and
the two that previously survived a mutation with the whole suite green — WR-01 and WR-04 — now fail 2
and 4 unit cases respectively. SC-1, SC-2 and SC-3 were re-measured rather than carried forward and
none regressed across nineteen plans and thirty-seven commits over the same seven files.

The gap that stood at 3/4 is genuinely closed, and closed at the right layer: the halt ends the live
connection, the real client refuses to route after it, the binder's republish is guarded, and the
value under the status is `false` rather than a claim of full trust. Four independent doors, three of
them added this round, and the shipped scenario fails on the user-visible assertion when the
mechanism is reverted — not only on the mechanism assertion.

The single most important thing I found is not a gap: **the standing verification report I am
replacing certified a README sentence as true that the code contradicted, and the code review caught
it.** Ledger entry 33 asked for that to be settled and it is settled against the verifier. It is the
same defect this phase has now shown seventeen times — a check passing because the thing it rested on
already sat at the value the defect produces — and this time it was the check itself.

---

_Verified: 2026-09-03T01:41:28Z_
_Verifier: Claude (gsd-verifier)_
