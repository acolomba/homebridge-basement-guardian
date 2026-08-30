---
phase: "3"
slug: "safety-monitoring-in-homekit"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-08-30"
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `03-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` (Node `^22.10.0 \|\| ^24.0.0`) + `node:assert/strict` + `strong-mock@^9.2.2`; `@cucumber/cucumber@^13.2.1` for scenarios |
| **Config file** | `package.json` scripts; `cucumber.json`; `tsconfig.test.json` (compiles `src`, `test`, `features` into `dist-test/`) |
| **Quick run command** | `node --test dist-test/test/<path>.test.js` (after `npm run build:test`) |
| **Full suite command** | `npm run check` (`typecheck` → `lint` → `fallow` → `format:check` → `test`) |
| **Estimated runtime** | ~60 seconds for `npm run check`; a focused `node --test` pair is ~2 seconds |

Focused coverage, which this project gates at 100% lines/branches/functions per source-test pair,
takes **two** arguments — the include value and the test path:

```bash
npm run test:coverage:direct -- "dist-test/src/<path>.js" "dist-test/test/<path>.test.js"
```

A single argument leaves `node --test` globbing unbuilt `.ts` files. This cost time in Phase 1 and
Phase 2; it is a carried hazard, not a hypothetical.

---

## Sampling Rate

- **After every task commit:** `node --test dist-test/test/<touched pair>.test.js`, then
  `npm run test:coverage:direct -- "dist-test/src/<module>.js" "dist-test/test/<module>.test.js"`
- **After every plan wave:** `npm run test` (unit + Cucumber)
- **Before `/gsd-verify-work`:** `npm run check` green **three consecutive times**
- **Max feedback latency:** ~2 seconds for the per-task pair; ~60 seconds for the wave gate

The three-consecutive-run rule is a carried hazard: in Phase 1 `npm run check` exited 1 on one run
in four while every report said green. The race was fixed and verified 6/6, so a failure now is a
real regression rather than noise.

---

## Per-Task Verification Map

Task IDs are assigned when plans are written. This map is keyed by requirement until then; the
planner binds each row to a task ID and the executor updates Status.

| Requirement | Behavior | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---|---|---|---|---|---|---|---|
| SAFE-01 | Every legal code maps through the explicit ladder; `31` → 100; `0` → 0 with `NO_FAULT` | — | N/A | unit (data-driven, one `test()` per row) | `node --test dist-test/test/accessories/waterLevel.test.js` | ❌ W0 | ⬜ pending |
| SAFE-01 | An out-of-domain code never reaches the lookup; it faults the `water` scope only | — | No guessed level from an unvalidated code | unit | `node --test dist-test/test/device/gemini.test.js` | ✅ | ⬜ pending |
| SAFE-01 | `Sump Pit Flood` reports `LEAK_DETECTED` only at `31` | — | N/A | unit | `node --test dist-test/test/accessories/serviceCatalogue.test.js` | ❌ W0 | ⬜ pending |
| SAFE-02 | Both Pump services and both activity ContactSensors follow their booleans | — | N/A | unit | `node --test dist-test/test/accessories/serviceCatalogue.test.js` | ❌ W0 | ⬜ pending |
| SAFE-02 | Eight `ContactSensor` services coexist on one accessory under distinct subtypes | — | N/A | unit | `node --test dist-test/test/accessories/basementGuardian.test.js` | ✅ | ⬜ pending |
| SAFE-03 | A backup-pump activation during `test_running` still publishes immediately | — | N/A | integration (Cucumber) | `npm run test:cucumber` | ❌ W0 | ⬜ pending |
| SAFE-04 | Five adapters transition independently; no aggregate adapter exists | — | No fabricated aggregate fault | unit (data-driven) | `node --test dist-test/test/accessories/serviceCatalogue.test.js` | ❌ W0 | ⬜ pending |
| SAFE-04 | Owning-service `StatusFault` moves with its adapter | — | N/A | unit | same | ❌ W0 | ⬜ pending |
| SAFE-05 | `Mains Power Lost` follows `ac_power === false` independently of pump faults | — | N/A | unit | same | ❌ W0 | ⬜ pending |
| SAFE-06 | `StatusLowBattery` is `LOW` for `battery_voltage_low` or health `1`/`2`/`32`, `NORMAL` for `4`/`8`/`16` | — | N/A | unit (6 health rows × 2 voltage states) | same | ❌ W0 | ⬜ pending |
| SAFE-06 | `BatteryLevel` publishes `1→25, 2→50, 4→75, 8→100` with no cross-field arbitration | — | No invented correction between two vendor fields | unit (data-driven) | same | ❌ W0 | ⬜ pending |
| SAFE-06 | `ChargingState` never publishes `NOT_CHARGEABLE` | — | N/A | unit | same | ❌ W0 | ⬜ pending |
| SAFE-06 | No `FilterMaintenance` service is ever added | — | N/A | unit | `node --test dist-test/test/accessories/basementGuardian.test.js` | ✅ | ⬜ pending |
| SAFE-07 | The injected `Timers` port records zero calls across a source-change transition | — | N/A | unit | `node --test dist-test/test/accessories/basementGuardian.test.js` | ✅ | ⬜ pending |
| SAFE-07 | `globalThis.setTimeout`/`setInterval`/`setImmediate`/`queueMicrotask` record zero calls | — | N/A | unit | same | ✅ | ⬜ pending |
| SAFE-07 | The characteristic already carries the new value on the statement after `update()` returns | — | N/A | unit | same | ✅ | ⬜ pending |
| SAFE-07 | No file under `src/accessories/` imports `node:timers` or `node:timers/promises` | — | N/A | unit (static gate) | `node --test dist-test/test/accessories/timerFreedom.test.js` | ❌ W0 | ⬜ pending |
| SAFE-07 | Negative control: a deliberately debounced variant fails each of the four layers | — | N/A | unit | same | ❌ W0 | ⬜ pending |
| SAFE-07 | The settings form carries no alert-delay key | — | N/A | unit | `node --test dist-test/test/configSchema.test.js` | ✅ | ⬜ pending |
| SAFE-07 | The adapter has already transitioned when the scenario clock moves by zero | — | N/A | integration (Cucumber) | `npm run test:cucumber` | ❌ W0 | ⬜ pending |
| SAFE-08 | Every custom characteristic is read-only (`perms` exactly `['pr', 'ev']`) | — | No writable path onto reported safety state | unit | `node --test dist-test/test/accessories/customCharacteristics.test.js` | ❌ W0 | ⬜ pending |
| SAFE-08 | The raw `water_level` code is published beside the mapped percentage | — | N/A | unit | `node --test dist-test/test/accessories/serviceCatalogue.test.js` | ❌ W0 | ⬜ pending |
| SAFE-08 | No custom UUID falls in the Apple base namespace `-0000-1000-8000-0026BB765291` | — | N/A | unit | `node --test dist-test/test/accessories/customCharacteristics.test.js` | ❌ W0 | ⬜ pending |
| CONF-06 | An unknown slug refuses, and the message names the bad slug and lists all seven valid ones | — | N/A | unit | `node --test dist-test/test/config.test.js` | ✅ | ⬜ pending |
| CONF-06 | A duplicate slug refuses | — | N/A | unit | same | ✅ | ⬜ pending |
| CONF-06 | An accepted slug un-publishes only that ContactSensor; condition, owning-service status, and Battery service all remain | — | N/A | unit | `node --test dist-test/test/accessories/basementGuardian.test.js` | ✅ | ⬜ pending |
| CONF-06 | `Sump Pit Flood` and the Battery service cannot be suppressed | — | N/A | unit | same | ✅ | ⬜ pending |
| CONF-06 | The settings form offers `ignoredFaults` with the seven-slug enum and `uniqueItems` | — | N/A | unit | `node --test dist-test/test/configSchema.test.js` | ✅ | ⬜ pending |
| RES-01 | One invalid field faults exactly one scope; every other scope keeps publishing | — | No false normal from an unrelated bad field | unit (one row per field) | `node --test dist-test/test/device/gemini.test.js` | ✅ | ⬜ pending |
| RES-01 | An invalid update never clears an already-active safety condition | — | Active safety condition survives bad input | unit | `node --test dist-test/test/accessories/basementGuardian.test.js` | ✅ | ⬜ pending |
| RES-01 | A partial heartbeat leaves untouched scopes trusted | — | N/A | integration (Cucumber) | `npm run test:cucumber` | ✅ extend | ⬜ pending |
| RES-02 | `serial_communications === false` activates `Pump Controller Link Lost` and marks five scopes `controller-link-lost` while `connectivity` stays trusted | — | Stale controller values never publish as current | unit | `node --test dist-test/test/accessories/basementGuardian.test.js` | ✅ | ⬜ pending |
| RES-02 | `lastTrustedAt` reports when trustworthy controller data last arrived | — | N/A | unit | same | ✅ | ⬜ pending |
| RES-03 (Phase 3 half) | `Basement Guardian Offline` activates only after N consecutive successful disconnected snapshots; a failed request never counts; any connected snapshot resets | — | No false physical-device alert from a transport failure | unit (data-driven over N = 1, 2, 8) | same | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/accessories/waterLevel.test.ts` — covers SAFE-01
- [ ] `test/accessories/serviceCatalogue.test.ts` — covers SAFE-01, SAFE-02, SAFE-04, SAFE-05, SAFE-06, SAFE-08
- [ ] `test/accessories/customServices.test.ts` — covers SAFE-08
- [ ] `test/accessories/customCharacteristics.test.ts` — covers SAFE-08
- [ ] `test/accessories/timerFreedom.test.ts` — covers SAFE-07 (static import gate + negative control)
- [ ] `test/runtime/timers.test.ts` — pairs the new `src/runtime/timers.ts` port
- [ ] Extend `features/support/fakeHomebridgeApi.ts` to the real HAP signatures: three-argument
      `addService(Class, displayName, subtype)`, plus `updateCharacteristic`, `removeService`,
      `testCharacteristic`, `addOptionalCharacteristic`, `optionalCharacteristics`, and a
      characteristic store a step can read back. **This lands before any scenario plan depends on
      it** — the current two-argument `addService(identifier, subtype?)` would silently record a
      display name as a subtype.
- [ ] New step in `features/support/steps/shadow.ts`: `When the scenario clock does not move`
- [ ] New feature file for safety-condition transitions (`features/safetyConditions.feature`)
- [ ] No framework install needed — `node:test` and Cucumber are already wired.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|---|---|---|---|
| A `Sump Pit Flood` automation still exists and still fires while the `water` scope is degraded (`StatusActive = false`) | SAFE-07, RES-01 (`D-05`) | Apple Home's own rendering and automation-eligibility behavior on current iOS cannot be observed from the plugin side, and no authoritative source settles it. Research refuted the specific claim that inactive sensors drop out of automations, but could not prove the safe behavior on current iOS. | In a real Apple home with a current home hub: create an automation triggered by the `Sump Pit Flood` Leak Sensor. Force the plugin into a degraded `water` scope (send an out-of-domain `water_level`). Confirm the automation still appears in the Home app and still fires when the leak state changes. Fold into the `G-003` / `G-004` real-home session. A failure here reopens `03-CONTEXT.md` `D-05`. |
| Apple Home renders a `StatusActive = false` service as a "Status Active" settings row without hiding the tile | SAFE-08 (`D-05`) | Same reason — controller-side rendering. | Same session: open the degraded accessory's Details and confirm the row appears. |
| The `ignoredFaults` array renders acceptably in the Homebridge Plugin Settings GUI under `strictValidation: true` | CONF-06 | The generated settings GUI cannot be exercised from `node:test`. | Load the plugin in a running Homebridge instance and open its settings form. If the enum array renders poorly, administrators fall back to editing `config.json`; runtime validation in `src/config.ts` is authoritative either way. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
