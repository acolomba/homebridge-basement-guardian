---
phase: 03-safety-monitoring-in-homekit
verified: 2026-08-30T00:00:00Z
status: human_needed
score: 6/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps: []
deferred:
  - truth: "A lost monitoring path is separated from a confirmed-offline device without a false physical-device alert"
    addressed_in: "Phase 5"
    evidence: "REQUIREMENTS.md RES-03 Delivery split (03-CONTEXT.md D-09): Phase 3 delivers the confirmation counter and the adapter; Phase 5 delivers the remaining sentence."
  - truth: "The heartbeat interval, the two-missed-heartbeat rule, and shadow silence as a secondary staleness signal"
    addressed_in: "Phase 5"
    evidence: "REQUIREMENTS.md RES-01 Delivery split (03-CONTEXT.md D-10): Phase 3 delivers the field-validity half; Phase 5 delivers the time-based half."
  - truth: "A device whose first update throws on every poll never appears in HomeKit rather than appearing empty"
    addressed_in: "Phase 5"
    evidence: "Recorded product choice routed to Phase 5 (Degraded Operation and Recovery). Neither state monitors the pump; neither is a false normal."
behavior_unverified_items: []
coincidental_reliance_items: []
human_verification:
  - test: "In a real Apple home with a current home hub, create an automation triggered by the `Sump Pit Flood` Leak Sensor. Force the plugin into a degraded `water` scope by sending an out-of-domain `water_level`. Confirm the automation still appears in the Home app and still fires when the leak state changes."
    expected: "The automation survives and still fires while the owning service reports `StatusActive = false`."
    why_human: "Apple Home's automation-eligibility behaviour for an inactive service cannot be observed from the plugin side and no authoritative source settles it. Research refuted the specific claim that inactive sensors drop out of automations but could not prove the safe behaviour on current iOS. A failure here reopens `03-CONTEXT.md` D-05, which the whole degradation design rests on. Fold into the G-003 / G-004 real-home session."
  - test: "In the same session, open the degraded accessory's Details in Apple Home."
    expected: "Apple Home renders `StatusActive = false` as a `Status Active` settings row and does not hide the tile."
    why_human: "Controller-side rendering. The plugin can prove it pushed `StatusActive = false` (it does — see SC-6 below); it cannot prove what Apple Home draws. README.md line 80 states this rendering to users, so a negative finding is a documentation defect as well as a D-05 question."
  - test: "Load the plugin in a running Homebridge instance and open its settings form. Add and remove `ignoredFaults` entries through the generated GUI under `strictValidation: true`."
    expected: "The seven-slug enum array renders acceptably and round-trips to `config.json`."
    why_human: "The generated Homebridge Plugin Settings GUI cannot be exercised from `node:test`. Runtime validation in `src/config.ts` is authoritative either way, and administrators can fall back to editing `config.json`."
    status: passed
    verified: 2026-08-31
    evidence: "A human drove the generated form in Homebridge 2.4.0 under `strictValidation: true`. Ticking one box wrote `[\"backup-pump-activated\"]` as a 1-element array and moved the Gemini service count 15 to 14, removing exactly the named sensor and no other; unticking it removed the key entirely and restored all 15 services with 8 of 8 contact sensors. Both directions were read back off the live HAP accessory database, not off the form. The form initially rendered raw slugs rather than service names, which is a defect this check found and which `260831-c7f`, `260831-dlv` and `c268b34` corrected: the options now render as seven alphabetised, human-named checkboxes with no `None` entry, and a checkbox list cannot express a duplicate."
---

# Phase 3: Safety Monitoring in HomeKit — Verification Report

**Phase Goal:** Users can observe every supported basement-protection condition through semantically
truthful services and immediate safety adapters.
**Verified:** 2026-08-30
**Status:** human_needed — no gaps; three controller-side checks remain that only a real Apple home can settle
**Re-verification:** No — initial verification

## How this was verified

This phase's own history is the reason presence checks were not accepted as evidence: four
false-normal or data-loss blockers survived 958 tests at 100% line/branch/function coverage, and two
of them were found only by *executing* the shipped code. So the primary evidence below is execution,
not reading.

Three independent instruments were run, none of them a project test helper:

1. **A verifier-authored behavioural probe** (36 checks) that drives the **shipped**
   `createBasementGuardianAccessory` with the **real** `createFamilyRegistry` and the **real** Gemini
   family adapter against the repo's HAP stand-in, and reads every assertion back off a published
   characteristic on a named service. No project test fixture or stub family was used to build state.
   Result: **36/36**.
2. **A backstop-evidence probe** (7 checks) supplying explicit, directly-observed evidence for the
   three `verification: backstop` truths, so none of them had to abstain.
   Result: **7/7**.
3. **Two live mutation tests** against the shipped source and the compiled output, to prove that two
   claims that would otherwise be assumptions actually discriminate (below).

The project gate was also run once, in this process: `npm run check` **exit 0**, **998 unit tests**,
**62 scenarios / 548 steps**, all passing.

## Goal Achievement

### Observable Truths — the six ROADMAP Success Criteria

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Truthful pit level through an explicit legal-value lookup; `Sump Pit Flood` only at the flood threshold; an unknown code faults rather than guesses; the threshold stays provisional until G-002 | ✓ VERIFIED | Executed: code `31` → `LEAK_DETECTED` + `WaterLevel 100` + raw code `31`; codes `0,1,3,7,15` → `LEAK_NOT_DETECTED` with ladder `0/20/40/60/80`; code `0` leaves `StatusFault` at `NO_FAULT`. An out-of-domain code (`9`) on a never-published accessory publishes **no water service at all** rather than one reading "no leak"; after a good publish it retains `LEAK_DETECTED`/`100` and pushes only `StatusActive = false`. `src/device/waterLevel.ts` is a six-entry `ReadonlyMap`, no popcount and no formula, with `PROVISIONAL_WATER_LEVEL_PERCENTAGES` and `PROVISIONAL_FLOOD_WATER_LEVEL_CODE` naming their own provisionality in one module. |
| 2 | Users can distinguish primary/backup pump operation, mains loss, battery condition, five actionable fault subsystems, and confirmed device offline — without any adapter inventing a cause | ✓ VERIFIED | Executed: both pump activity adapters follow their own boolean independently; `Mains Power Lost` follows `ac_power === false` with **every** pump/fuse/water fault true and mains present (not activated), and publishes `StatusFault = NO_FAULT` in both states; battery health `1/2/32` → `LOW`, `4/8/16` → `NORMAL`, bands `1/2/4/8` → `25/50/75/100` **even with health `32` reported alongside** (no cross-field arbitration), `NOT_CHARGEABLE` never published; five fault adapters driven one at a time each activate alone and leave the other four clear; no aggregate service exists in the published set. Confirmed offline needs N consecutive **disconnected polls** at N = 1, 2 and 8; `data.offline === true` with `connectivity.connected === true` never activates it over 12 repeats. |
| 3 | Live safety conditions and their adapters change immediately with valid source state and return to normal immediately on valid recovery, including backup activity during self-test | ✓ VERIFIED | Executed, all four immediacy layers: (a) the injected `Timers` port recorded **zero** calls across a full source-change-to-characteristic transition; (b) `globalThis.setTimeout`/`setInterval`/`setImmediate`/`queueMicrotask` recorded **zero** calls across the same transition; (c) the characteristic already carried the new value on the statement after `update()` returned, and `update()` returned a non-thenable; (d) the static import gate was **mutation-tested** — planting `import { setTimeout as delay } from 'node:timers/promises'` into `src/accessories/customServices.ts` made it fail by name (`actual: ['customServices.ts']`), so it is not vacuous, and it asserts a floor of 6 enumerated modules. Backup activation publishes during `test_running` in **either** change order, and with `backup_pump_timestamp` absent. Conditions clear on the same update they clear in the source; no acknowledgement latch. |
| 4 | Administrator can omit selected optional Contact Sensor adapters through `ignoredFaults` without losing underlying conditions, diagnostics, pump records, native flood state, or battery state | ✓ VERIFIED | Executed: ignoring `water-sensor-fault` removes only that sensor while `Sump Pit Level` keeps `StatusFault = GENERAL_FAULT`, the raw `Water Sensor Fault Reported` diagnostic stays `true`, `Sump Pit Flood` still reports `LEAK_DETECTED`, both battery services stay, and every other adapter stays. Suppression is idempotent and order-independent, and the published order is the catalogue's. A cached sensor is removed on a restart that adds the slug. `src/config.ts` refuses an unknown slug (naming it and listing all seven), a duplicate, `null`, and a non-array; `config.schema.json` offers exactly seven properties with `uniqueItems: true` and the seven-slug enum, and **no** alert-delay/debounce/acknowledgement/quiet-hours key. |
| 5 | Standard services used only for their defined meaning; exact unsupported facts remain available through read-only vendor-defined characteristics | ✓ VERIFIED | Executed against the published accessory: every non-Apple characteristic carries `perms` exactly `['pr','ev']` — no write permission anywhere; no custom UUID (service or characteristic) lies in Apple's `-0000-1000-8000-0026BB765291` base namespace; **no** `FilterMaintenance` service and no characteristic whose display name matches `/filter/i`; **no** characteristic matching `/wifi|signal|dbm|rssi/i` and `wifi_signal_dbm` reaches no value; the raw thermometer code publishes beside the mapped percentage. No `onGet` handler or HAP `GET` listener exists in `src/accessories/` (comment mentions only). |
| 6 | An invalid, omitted, or stale field preserves the last valid value and faults or deactivates only the narrowest owning scope; `serial_communications === false` immediately activates `Pump Controller Link Lost` while exposing when trustworthy controller data last arrived | ✓ VERIFIED | Executed, one row per scope: a bad `water_level`/`primary_pump_running`/`ac_power`/`battery_health` each yields exactly one `scope:invalid` entry and deactivates exactly the services reading that scope — every other service stays `StatusActive = true` and keeps publishing. An invalid update never cleared an already-active flood, mains loss, or pump fault. `serial_communications === false` activated the adapter **on the same update**, poisoned exactly `water, pump, power, battery, fault` with reason `controller-link-lost`, left `connectivity` trusted (the offline adapter stayed active), kept the link adapter itself `StatusActive = true`, published `ControllerDataLastTrustedAt` as the receipt time of the last link-present snapshot, and retained `Mains Power Present = true` while deactivating its service. A restored link cleared the distrust on the next valid snapshot with no further input. The condition logs once per entry (1 warning over 5 poisoned polls, 2 after a recovery and re-entry). A *validation failure* on `serial_communications` is distinguishable: the adapter publishes nothing and goes inactive rather than reading known-lost. |

**Score:** 6/6 Success Criteria verified (0 present, behavior-unverified)

### Plan-level must-haves

| Plan | Truths | Prohibitions | Artifacts | Status |
|------|--------|--------------|-----------|--------|
| 03-01 HAP stand-in | 11 | 3 | 3 | ✓ VERIFIED — exactly one `createFakeHap` in the repository (`features/support/fakeHap.ts`), imported by both the Cucumber harness and every accessories unit test; three-argument `addService(Class, displayName, subtype)` confirmed in use; duplicate-subtype refusal live |
| 03-02 water ladder + trust scoping | 14 | 4 | 3 | ✓ VERIFIED — see SC-1, SC-6 |
| 03-03 `ignoredFaults` surface | 10 (1 backstop) | 3 | 3 | ✓ VERIFIED — see SC-4; backstop confirmed by execution |
| 03-04 tracer: mains + offline | 18 (1 backstop) | 5 | 6 | ✓ VERIFIED — see SC-2, SC-5; backstop confirmed by execution |
| 03-05 service catalogue | 24 (1 backstop) | 6 | 3 | ✓ VERIFIED — see SC-1..SC-5; backstop confirmed by execution |
| 03-06 controller link + immediacy | 13 | 4 | 3 | ✓ VERIFIED — see SC-3, SC-6 |
| 03-07 scenarios + static gate | 9 | 2 | 2 | ✓ VERIFIED — 12 scenarios in `features/safetyMonitoring.feature`, each `Then` reading a named characteristic on a named service; static gate mutation-tested |
| 03-08 fallow + docs | 10 | 3 | 3 | ✓ VERIFIED — see Documentation below |

**109 truths, 30 prohibitions, 21 unique artifact paths — all present, substantive, wired, and (for
every behavioural truth) exercised.**

### Backstop truths — explicit evidence, no abstention

Three truths carried `verification: backstop`. None was accepted on presence. Each was confirmed by
direct observation of the shipped code.

| Truth | Evidence |
|-------|----------|
| `validateConfig` is a pure function with no timer, no await, and no shared mutable state (03-03) | Global scheduling spies recorded zero calls; the return is a non-thenable; 200 evaluations with a second, differing input interleaved between every one produced byte-identical results (and the two inputs were asserted to differ, so the loop is not trivially satisfied); the caller's object is not mutated and the resolved list does not alias the caller's array |
| `update()` runs to completion synchronously with no await and no scheduled callback (03-04) | Injected `Timers` port and all four global schedulers recorded zero calls across a full transition; `update()` returned `undefined`, non-thenable; the new characteristic value was already readable on the next statement; suppression was idempotent across a second `update()` with no service added or removed |
| Every `project` is a pure synchronous function of its input (03-05) | Every one of the 15 catalogue rows: zero scheduling calls, non-thenable array return, deep-equal output for the same input twice, unchanged output under a reversed projection order, unchanged output with a completely different input interleaved between every projection, identical output from a second independently built catalogue, no input mutation, and no failure under a **deeply frozen** input — so no write path exists |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/device/waterLevel.ts` | the one place the ladder and threshold live | ✓ VERIFIED | 63 lines, explicit six-entry `ReadonlyMap`, throws for an unmapped code, both constants named provisional |
| `src/accessories/serviceCatalogue.ts` | 15 rows, per-value trust gate, get-or-add/remove/push | ✓ VERIFIED | 751 lines; `ensureService` withholds a service until a row has a value to vouch for; `publishValue` guards the non-idempotent `addOptionalCharacteristic` |
| `src/accessories/basementGuardian.ts` | one accessory, `update()`, trust computation, offline counter | ✓ VERIFIED | 567 lines; both the resolved and unresolved paths honour suppression; no `onGet`, no `HapStatusError` |
| `src/accessories/customCharacteristics.ts` | 12 read-only vendor characteristics | ✓ VERIFIED | perms built in one place; hard-coded v4 UUIDs outside Apple's namespace |
| `src/accessories/customServices.ts` | 4 vendor services | ✓ VERIFIED | UUIDs outside Apple's namespace |
| `src/accessories/services.ts` | `CoreServiceKind` + 7 `NotificationServiceKind` + runtime list | ✓ VERIFIED | `primary-pump-running` is core (not removable); `NOTIFICATION_SERVICE_KINDS` is the single source for both the refusal and the schema enum |
| `src/config.ts` | `ignoredFaults` + `offlineConfirmationPollCount` validation | ✓ VERIFIED | executed against all eight input shapes |
| `config.schema.json` | seven properties, no delay key | ✓ VERIFIED | enumerated at runtime |
| `test/accessories/timerFreedom.test.ts` | static gate + negative control | ✓ VERIFIED | mutation-tested; enumerates the real directory with a floor of 6 |
| `features/safetyMonitoring.feature` | scenarios reading published values | ✓ VERIFIED | 12 scenarios; the `pushed` guard means an unwritten characteristic reads as absent |
| `README.md`, `CHANGELOG.md`, `.fallowrc.json` | documentation and dead-code gate | ✓ VERIFIED | see Documentation below |

All 21 unique declared artifact paths exist. None is a stub; every one was reached during execution.

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/config.ts` | `src/accessories/basementGuardian.ts` | `validated.config.ignoredFaults` / `offlineConfirmationPollCount` → `registerDiscoveredDevices` → accessory options | ✓ WIRED | `src/platform.ts:429-430`, `445-446`, `111-112` |
| `src/device/state.ts` store | accessory | `store.subscribe(deviceId, …)` → `update(next, 'live')` | ✓ WIRED | `src/platform.ts:129-131`, subscribed at both `162` and `289` |
| REST poll | accessory | `update(snapshot, 'poll')` inside a `try/finally` that still persists an identity change when the update throws | ✓ WIRED | `src/platform.ts` dispatch path |
| `src/device/gemini.ts` | `src/device/waterLevel.ts` | `isPitFlooded` / `waterLevelPercentage`, one call site | ✓ WIRED | the catalogue never imports the ladder, so G-002 closes with one edit |
| `src/accessories/services.ts` | `config.schema.json` + refusal message | `NOTIFICATION_SERVICE_KINDS` | ✓ WIRED | the refusal message and the schema enum list the same seven slugs in the same order |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `Sump Pit Flood` | `LeakDetected` | `decoded.water.flooded` ← `isPitFlooded(water_level)` | Yes — observed `LEAK_DETECTED` at `31` only | ✓ FLOWING |
| `Sump Pit Level` | `WaterLevel`, `RawWaterLevelCode` | `decoded.water.levelPercent` / `.levelCode` | Yes — observed `0/20/40/60/80/100` and the raw code | ✓ FLOWING |
| `Backup Battery` | `BatteryLevel`, `StatusLowBattery`, `ChargingState` | `decoded.battery.*` | Yes — observed all four bands and all six health codes | ✓ FLOWING |
| `Basement Guardian Offline` | `ContactSensorState` | accessory-local run of consecutive disconnected **polls** | Yes — observed at N = 1, 2, 8, and never from `data.offline` | ✓ FLOWING |
| `Pump Controller Link Lost` | `ContactSensorState`, `ControllerLinkPresent`, `ControllerDataLastTrustedAt` | `decoded.fault.controllerLinkPresent`, `lastTrustedAt.get('fault')` | Yes — observed the ISO time of the last link-present snapshot | ✓ FLOWING |
| every row, untrusted | *(nothing)* | — | Correctly **no** value pushed; only `StatusActive = false` | ✓ FLOWING (by design) |

No value's chain terminates in a static return, a hardcoded literal, or a mock. The one deliberate
"absent" case — an untrusted scope — was confirmed to push nothing at all rather than a default.

### Behavioural Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full project gate | `npm run check` | exit 0 · 998 unit tests · 62 scenarios / 548 steps | ✓ PASS |
| Shipped code end to end vs. real Gemini adapter | verifier probe, 36 checks | 36/36 | ✓ PASS |
| Backstop truths | verifier probe, 7 checks | 7/7 | ✓ PASS |
| Static import gate discriminates | plant `node:timers/promises` in `src/accessories/customServices.ts`, run `timerFreedom.test.js` | FAILS by name: `actual: ['customServices.ts']` | ✓ PASS |
| Unresolved-family suppression test discriminates | strip the `isSuppressed` gate from compiled `republishPublishedRows`, run `platform.test.js` + `basementGuardian.test.js` | FAILS: `actual.ignored = { displayName: 'Mains Power Lost', … }`, `expected.ignored = undefined` | ✓ PASS |
| `ignoredFaults` config refusals | executed `validateConfig` over 8 input shapes | correct refusal text for unknown, duplicate, null, non-array; order-independent acceptance | ✓ PASS |
| Settings schema | enumerated `config.schema.json` at runtime | 7 properties; `uniqueItems: true`; 7-slug enum; zero delay/debounce/ack/quiet keys | ✓ PASS |

Both mutation tests matter: they convert two claims that the SUMMARY asserts (the static gate is not
vacuous; the unresolved-family suppression fix is covered by a discriminating test) from narration
into observed failure.

### Probe Execution

No `scripts/*/tests/probe-*.sh` exists in this repository and no plan declares one. The
verifier-authored probes above stand in that role and were run in this process.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CONF-06 | 03-03, 03-04, 03-06 | unique enumerated `ignoredFaults`, seven slugs | ✓ SATISFIED | SC-4 |
| SAFE-01 | 03-02, 03-05 | explicit level lookup, flood only at threshold, unknown code faults | ✓ SATISFIED | SC-1 |
| SAFE-02 | 03-05 | both Pump services and both activity sensors follow their booleans | ✓ SATISFIED | SC-2 |
| SAFE-03 | 03-05, 03-07 | backup activation publishes immediately, including during self-test, without inventing a cause | ✓ SATISFIED | SC-3 |
| SAFE-04 | 03-05 | five distinct adapters, owning-service `StatusFault` moves, no aggregate | ✓ SATISFIED | SC-2 |
| SAFE-05 | 03-04 | mains presence truthful and independent of pump health | ✓ SATISFIED | SC-2 |
| SAFE-06 | 03-05 | exact battery facts plus labelled 25/50/75/100 estimates, no filter semantics | ✓ SATISFIED | SC-2, SC-5 |
| SAFE-07 | 03-03, 03-06, 03-07 | publish immediately, clear immediately, no delay setting, no latch | ✓ SATISFIED | SC-3 |
| SAFE-08 | 03-04, 03-05 | standard semantics only where truthful, vendor characteristics read-only | ✓ SATISFIED | SC-5 |
| RES-01 (Phase 3 half) | 03-02, 03-04 | field-validity half: last valid value preserved, narrowest scope faulted, active conditions never cleared | ✓ SATISFIED | SC-6. **No over-reach:** no module in `src/accessories/` or `src/device/{waterLevel,gemini}.ts` reads a clock, measures an interval, counts a missed heartbeat, or treats shadow silence as staleness. Grep for `Date.now()`, `heartbeat`, `898`, and clock reads across the phase's modules returns only `src/accessories/reconciliation.ts`, a pre-existing Phase 2 module. |
| RES-02 | 03-06 | `serial_communications === false` activates the adapter, faults the derived services, preserves values, exposes `lastTrustedAt` | ✓ SATISFIED | SC-6 |
| RES-03 (Phase 3 half) | 03-04, 03-06 | confirmation counter and adapter; `data.offline` is corroboration only | ✓ SATISFIED | SC-2. **No over-reach:** the phase delivers the counter and adapter only. Separating a lost monitoring path from a confirmed-offline device is untouched here and stays in Phase 5. |

No orphaned requirements: every ID `REQUIREMENTS.md` maps to Phase 3 is claimed by a plan and
satisfied.

### Decision Coverage

All 18 CONTEXT decisions D-01..D-18 are traceable to shipped artifacts. Seventeen carry an explicit
`D-NN` / `D-0NN` anchor in source, tests, or scenarios. **D-06** (no sixth fault adapter for
`battery_health == 32`) carries no anchor but is honoured behaviourally: `battery_health = 32`
produces `StatusLowBattery = LOW` and the exact code on `Backup Battery Facts`, and the published set
contains exactly five fault adapters. Non-blocking; no action required.

One cosmetic note: the code uses both the Phase 3 two-digit form (`D-16`) and an earlier three-digit
form (`D-016`, `D-006`) that belongs to a different decision register. This is an ID-namespace
collision in comments, not a correctness issue.

### Test Quality Audit

| Check | Result | Verdict |
|-------|--------|---------|
| Disabled/skipped tests on requirements | zero `it.skip` / `describe.skip` / `test.skip` / `.todo` / `xit` anywhere in `test/` or `features/` | ✓ clean |
| Circular tests (system generates its own expected values) | none. The two files that write to disk (`test/cloud/auth.test.ts`, `features/support/steps/authentication.ts`) write a token-cache fixture for a Phase 1 behaviour, not expected values | ✓ clean |
| Assertion strength | value-level and behavioural throughout. Every Cucumber `Then` reads a named characteristic on a named service and compares a value | ✓ sufficient |
| Absence assertions passing on a construction default | **fixed and confirmed.** `features/support/steps/homekit.ts` `pushedValue()` returns `undefined` for any characteristic whose `pushed` flag is false, so `is not activated` cannot pass on HAP's `0` default; `assertServiceNotPublished` first waits for a non-zero published-service count, so an absence read before registration cannot pass vacuously | ✓ clean |
| Static gate vacuity | **mutation-tested.** Enumerates the real directory, asserts a floor of 6 modules, and fails by name on a planted import | ✓ clean |

No BLOCKER and no WARNING from the test-quality audit.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | — |

Zero `TBD`, `FIXME`, or `XXX` markers anywhere in `src/`, `test/`, `features/`, `README.md`,
`CHANGELOG.md`, or `.fallowrc.json`. Zero `TODO` / `HACK` / "not yet implemented" / "coming soon".
The only `PLACEHOLDER` hits are a test-local constant name (`PLACEHOLDER_UUID` in
`test/accessories/services.test.ts`), which is a fixture identifier, not a stub.

### Documentation (03-08)

| Claim | Status | Evidence |
|-------|--------|----------|
| README explains inactive-with-last-valid-value and the `Status Active` row | ✓ | README.md:76, 80 |
| README states the deliberate departure from returning a safe default, and why | ✓ | README.md:78 — "A stale reading shown as a normal one is a false all-clear" |
| README documents `ignoredFaults` as destructive, including Activity History | ✓ | README.md:106, 123, 125 |
| README labels 25/50/75/100 as estimates from the protection band | ✓ | README.md:131 |
| README states the water percentages and flood threshold are provisional, raw code published beside | ✓ | README.md:133 |
| CHANGELOG Unreleased records this phase's user-visible additions in the existing voice | ✓ | Added ×3, Changed ×2 entries covering the accessory, `ignoredFaults`, between-poll updates, refusal, and the inactive-not-normal rule |
| `src/accessories/services.ts` removed from `.fallowrc.json` `ignoreFindings` | ✓ | `ignoreFindings` now holds only `src/device/events.ts`; `src/device/health.ts` is absent too |
| `npm run fallow` green | ✓ | part of `npm run check`, exit 0 |

## Recorded limits (reported, not re-derived)

These were already documented with rationale before verification and are reported as recorded limits
rather than new findings. Each was checked to still be accurately described:

- **The Cucumber immediacy scenario is a no-op against the code as written.** `When the scenario
  clock does not move` is `advanceClock(0)` and no production code reads the scenario clock while
  publishing. Confirmed. SAFE-07's real proof is the four-layer unit gate, which I re-ran and
  mutation-tested independently — it holds.
- **`ignoredFaults` suppression through the unresolved-family path has no Cucumber scenario.**
  Confirmed: the one suppression scenario (`safetyMonitoring.feature:140`) exercises the resolved
  path only. The platform test that covers it **was mutation-tested here and discriminates**.
- **A device whose first update throws on every poll never appears in HomeKit** rather than appearing
  empty. Recorded product choice, routed to Phase 5. Listed under `deferred`.
- **The suppression fix earns no `updatePlatformAccessories` call**, so Homebridge's
  `cachedAccessories` file lags until something else writes. HomeKit is correct every run.
- **`README.md` line 138 links to `src/platformAccessory.ts`**, which no longer exists. Confirmed
  still stale. Cosmetic; a broken link in the Project-structure section only.
- **`.fallowrc.json` keeps one `ignoreFindings` entry** (`src/device/events.ts`). Confirmed as the
  only remaining entry.
- **Two research assumptions cannot be settled from the plugin side** and belong to the G-003/G-004
  real-home session. These are items 1 and 2 in Human Verification below.

## New observations (non-blocking)

1. **`03-VALIDATION.md` was never updated after execution.** Its frontmatter still reads
   `status: draft`, `nyquist_compliant: false`, `wave_0_complete: false`, and **every** row of the
   Per-Task Verification Map is `⬜ pending` with several marked `File Exists: ❌ W0` — even though
   all those files now exist and all those tests now pass. Approval is still `pending`. This is
   artifact staleness, not a goal gap: the map's claims are contradicted by the tree in the *safe*
   direction. Worth a pass before milestone audit so the requirement→test map is not misread as
   evidence that Wave 0 is incomplete.
2. **A wording slip in `03-05-PLAN.md`.** The truth says "publishes **fourteen** services" and then
   enumerates **fifteen** names. The code publishes fifteen service rows across fourteen
   `ServiceKind`s (`backup-battery` publishes twice). The enumerated list matches the code exactly;
   only the numeral is wrong. No behavioural consequence.

### Human Verification Required

Three items. None is an evidence gap in the shipped code — all three are controller-side questions
that only a real Apple home or a running Homebridge instance can answer, and all three were already
recorded as Manual-Only in `03-VALIDATION.md`. They are why this report is `human_needed` rather than
`passed`.

#### 1. A flood automation survives a degraded `water` scope

**Test:** In a real Apple home with a current home hub, create an automation triggered by the
`Sump Pit Flood` Leak Sensor. Force the plugin into a degraded `water` scope by sending an
out-of-domain `water_level`. Confirm the automation still appears in the Home app and still fires
when the leak state changes.
**Expected:** The automation survives and still fires while the owning service reports
`StatusActive = false`.
**Why human:** Apple Home's automation-eligibility behaviour for an inactive service cannot be
observed from the plugin side, and no authoritative source settles it. Research refuted the specific
claim that inactive sensors drop out of automations but could not prove the safe behaviour on current
iOS. **A failure here reopens `03-CONTEXT.md` D-05**, which the whole degradation design rests on.
Fold into the G-003 / G-004 real-home session.

#### 2. Apple Home renders `StatusActive = false` as a settings row

**Test:** In the same session, open the degraded accessory's Details in Apple Home.
**Expected:** A `Status Active` row appears and the tile is not hidden.
**Why human:** Controller-side rendering. The plugin can prove it pushed `StatusActive = false` — it
does, verified above — but not what Apple Home draws. `README.md` line 80 states this rendering to
users, so a negative finding is a documentation defect as well as a D-05 question.

#### 3. The `ignoredFaults` array renders in the Homebridge Settings GUI

**Test:** Load the plugin in a running Homebridge instance, open its settings form, and add and
remove `ignoredFaults` entries through the generated GUI under `strictValidation: true`.
**Expected:** The seven-slug enum array renders acceptably and round-trips to `config.json`.
**Why human:** The generated settings GUI cannot be exercised from `node:test`. Runtime validation in
`src/config.ts` is authoritative either way, and administrators can fall back to editing
`config.json`.

### Gaps Summary

**No gaps.** The phase goal is achieved. Every one of the six ROADMAP Success Criteria was verified
by executing the shipped code — not by reading it, and not by trusting the SUMMARY files — using the
real Gemini family adapter, the real registry, and the repo's HAP stand-in, with every assertion read
back off a published characteristic. All twelve Phase 3 requirements are satisfied, with both
delivery splits (RES-01, RES-03) honoured on the Phase 3 side and no over-reach into Phase 5. All 109
plan-level must-have truths and all 30 prohibitions hold, including the three `verification: backstop`
truths, which were confirmed by direct observation rather than allowed to abstain. The two claims
that would otherwise have been assumptions — that the static import gate is not vacuous, and that the
unresolved-family suppression fix is covered by a discriminating test — were each proved by planting
the defect and watching the check fail by name.

The status is `human_needed`, not `gaps_found`. The three outstanding items are controller-side
questions about what Apple Home and the Homebridge settings GUI do with correctly published state.
The plugin side of each is verified. Items 1 and 2 belong to the G-003 / G-004 real-home session,
which already blocks `1.0.0` under REL-07; item 3 has an authoritative runtime fallback in
`src/config.ts` either way. Nothing here blocks starting Phase 4.

---

_Verified: 2026-08-30_
_Verifier: Claude (gsd-verifier)_
