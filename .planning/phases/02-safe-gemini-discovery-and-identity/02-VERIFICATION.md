---
phase: 02-safe-gemini-discovery-and-identity
verified: 2026-08-29T23:59:00Z
status: human_needed
score: 25/27 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Confirm src/accessories/reconciliation.ts's public Reconciliation.observe(deviceIds) contract can never be driven by a per-device connectivity flag, with a held-out/property-based test rather than a read of the current type signature."
    expected: "No call path, present or future, can pass a per-device online/offline flag into observe(); an offline-but-present device (still in deviceIds) can never be reported confirmedAbsent by this module alone."
    why_human: "PLAN frontmatter tags this truth verification: backstop. The type signature (observe(deviceIds: readonly string[])) is directly observable and structurally supports the claim, but no held-out or property-based test exercises it, and presence/wiring alone does not satisfy a backstop-tagged truth per this verifier's evidentiary bar."
  - test: "Confirm registerDiscoveredDevices's per-device registration/skip outcome is genuinely independent of a device's position in the same inventory batch — reorder features/discovery.feature's mixed-inventory scenario's device list (or add a property-based/randomized-order test) and assert every device's outcome is unchanged."
    expected: "Reordering the deviceIds array between polls changes no individual device's implemented/unsupported/unknown outcome or registration decision."
    why_human: "PLAN frontmatter tags this truth verification: backstop. The dispatch loop (for (const deviceId of deviceIds) { ... continue; }) is structurally order-independent on inspection — no shared mutable state read by one iteration is written by an earlier one in the same batch — but no test (unit, property-based, or Cucumber) explicitly varies device order and re-asserts outcomes, so this is inference from code reading, not evidence a backstop tag accepts."
behavior_unverified_items: []
---

# Phase 2: Safe Gemini Discovery and Identity Verification Report

**Phase Goal:** Every supported physical Gemini can enter HomeKit once with stable identity, while profile uncertainty cannot create fabricated accessories or values.
**Verified:** 2026-08-29T23:59:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | Every valid Gemini on the configured account appears as exactly one accessory; HALO and unknown profiles produce distinct clear log explanations and never block valid devices | ✓ VERIFIED | `src/device/registry.ts` three-way `Map` lookup (`implemented`/`unsupported`/`unknown`), `src/platform.ts:154-193` dispatches every device independently with a per-device `continue`. Independently re-run: `test/device/registry.test.ts` (mutual-exclusivity + `shouldLog` cadence), `features/discovery.feature` scenario "A HALO and an unknown device do not block a valid Gemini in the same inventory" — both pass in a fresh `npx cucumber-js` run (45/45 scenarios). |
| SC2 | Invalid identity, payload shape, field type, or legal-value domain cannot publish a new accessory or replace a cached valid value with a guess | ✓ VERIFIED | `src/device/gemini.ts` field-by-field `validate()`/`decode()` (16 required + 2 optional telemetry fields, 4 optional metadata fields, enum domain checks on `water_level`/`battery_health`/`hours_of_protection`); `decode()` never spreads raw data and throws `TypeError` if a field disagrees with what `validate()` should have confirmed. `src/accessories/basementGuardian.ts:167-182` only calls `decode()` on `validation.valid === true`. Independently re-run: `test/device/gemini.test.ts`, `test/accessories/basementGuardian.test.ts#never calls decode() when validate() reports the snapshot invalid`. |
| SC3 | The same physical device retains its accessory UUID, semantically equivalent service identities, and customized name through restart, rename, and supported profile change | ✓ VERIFIED | `src/platform.ts:156` UUID is `context.api.hap.uuid.generate(deviceId)` alone; the register-vs-update branch (`:163-169`) is a UUID-cache lookup only, never conditioned on `deviceTypeId`/name. `resolveVendorName` (`:80-87`) gates rename adoption on `accessory.displayName === accessory.context.lastVendorName` (`===`, no normalization), per D-030. Independently re-run: `features/discovery.feature` scenarios "An already-cached device is updated on a second poll," "A deviceTypeId change keeps the same accessory," "A vendor rename is adopted when there is no prior customization," "A vendor rename is not adopted after a user customization" — all pass. |
| SC4 | A missing device remains present after failed or single-missing inventories and is removed only after the confirmed two-successful-inventory policy plus a final out-of-band check; a later return begins a new observation epoch | ✓ VERIFIED | `src/accessories/reconciliation.ts` two-consecutive-absence counter (never advanced by a caller-unverified response, since `observe()`'s only input is a deviceId list). `src/runtime/accountRuntime.ts:235-272` `applyDevices()` performs exactly one out-of-band final-check fetch on a non-empty `confirmedAbsent`, calling `reconciliation.forget()` on both the reappeared and confirmed-removed branches (the CR-01 code-review fix, confirmed present in the current source, not merely claimed by SUMMARY.md). `src/platform.ts:208-220` `removeDiscoveredDevice` unregisters, drops the cache entry, and calls `store.remove(deviceId)`, which deletes the snapshot and listener registry (`src/device/state.ts:320-323`) so a later rediscovery starts a fresh epoch. Independently re-run: `node --test --test-name-pattern="DEV-05 removal reconciliation"` (5/5 pass), `features/discovery.feature` removal/reappearance/rediscovery scenarios — all pass. |
| SC5 | Each accessory carries truthful manufacturer, model, serial-number, and firmware metadata sourced only from validated vendor identity fields; the vendor `deviceId` never becomes a user-visible value | ✓ VERIFIED | `src/accessories/basementGuardian.ts:121-133` populates the accessory's existing `AccessoryInformation` service (never `addService`) from `MANUFACTURER`/`MODEL` literals, `snapshot.identity.serialNumber`, and `decoded.metadata.mcuFirmwareVersion` only. `deviceId` is never assigned to a HAP characteristic anywhere in `basementGuardian.ts` or `platform.ts` (displayName uses `snapshot.identity.name`; SerialNumber uses `snapshot.identity.serialNumber`). Independently confirmed by `grep`: no `Characteristic.*deviceId` assignment exists. `features/discovery.feature`'s first scenario asserts the populated `AccessoryInformation` service end to end. |
| SC6 | A profile or payload that stops validating after publication degrades the accessory in place, keeping its identity and last valid values and disabling commands, instead of unregistering it | ✓ VERIFIED (commands clause deferred — see Deferred Items) | `src/accessories/basementGuardian.ts:167-196` `update()` re-resolves the registry and re-validates on every call; a non-implemented outcome or a failed `validate()` both fall through to one shared degrade branch — `decode()` is never called, `AccessoryInformation` is never touched, `untrusted` becomes the five non-connectivity `TrustScope`s, and the transition logs exactly once via a closure-held `degraded` flag. `src/platform.ts` reuses one `BasementGuardianAccessory` instance per physical accessory (`basementGuardianAccessoryFor`) so this closure state survives across polls in the real running plugin, not only inside an isolated test. No unregister call exists on this path. Independently re-run: `node --test --test-name-pattern="degrad|recover|log" .../basementGuardian.test.js` (7/7 pass), `features/discovery.feature` "A payload that stops validating degrades the accessory in place." The "disabling commands" clause has no command surface to disable yet — `02-CONTEXT.md` explicitly scopes commands/self-test out of Phase 2 to Phase 4; see Deferred Items. |

### Plan-Level Must-Haves (Granular Score)

Every plan's `must_haves.truths` was checked individually. 25 of 27 verified directly against the current source and an independently re-run test suite; 2 are `verification: backstop`-tagged and route to human verification (see frontmatter and table above) because no held-out/property-based test exists for them — code-reading alone does not satisfy a backstop tag's evidentiary bar.

**Score:** 25/27 truths verified (2 routed to human verification, insufficient_spec on backstop-tagged claims)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/device/registry.ts` | Three-way family registry, log-cadence tracking | ✓ VERIFIED | `createFamilyRegistry()` returns `{ lookup, shouldLog }`; `Map` populated at module load; wired into `platform.ts` |
| `src/device/gemini.ts` | Complete `DeviceFamily<GeminiDomainState>` | ✓ VERIFIED | Full field-by-field `validate()`/`decode()`, `capabilities()`, `command()` |
| `src/device/halo.ts` | `HALO_DEVICE_TYPE_ID`/`HALO_DISPLAY_NAME` runtime constants | ✓ VERIFIED | Present, consumed by `registry.ts` |
| `src/accessories/basementGuardian.ts` | Accessory factory, `AccessoryInformation`, degrade-in-place | ✓ VERIFIED | `createBasementGuardianAccessory` re-validates every `update()` call |
| `src/accessories/reconciliation.ts` | Two-consecutive-absence state machine | ✓ VERIFIED | `observe`/`forget`, family-neutral, deviceId-list-only contract |
| `src/persistence/accessoryContext.ts` | `lastVendorName` field, corrected fileoverview | ✓ VERIFIED | Field present; fileoverview no longer claims no account identifier; D-01/D-027 both cited |
| `src/platform.ts` | Register/update/remove dispatch, rename adoption | ✓ VERIFIED | `registerDiscoveredDevices`, `updateDiscoveredDevice`, `removeDiscoveredDevice`, `resolveVendorName`, `basementGuardianAccessoryFor` all present and wired |
| `src/runtime/accountRuntime.ts` | Removal protocol, `onTrustworthyInventory`/`onDeviceRemoved` hooks | ✓ VERIFIED | `applyDevices()` implements the two-confirmation-plus-final-check protocol with the CR-01 fix present |
| `src/device/state.ts` | `DeviceStateStore.remove()` | ✓ VERIFIED | Drops snapshot + listener registry entry |
| `features/discovery.feature` | End-to-end coverage of every phase behavior | ✓ VERIFIED | 10 scenarios covering registration, mixed-inventory dispatch, update-in-place, rename adoption/withholding, removal, reappearance, rediscovery-rewatch, degrade-in-place |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `accountRuntime.applyDevices` | `onTrustworthyInventory` hook | direct call | ✓ WIRED | Fires with every trustworthy poll's deviceId list, including empty |
| `platform.ts registerDiscoveredDevices` | `registry.lookup`/`shouldLog` | direct call | ✓ WIRED | Every discovered device dispatched through the registry, not only ones that register |
| `platform.ts registerDiscoveredDevices`/`updateDiscoveredDevice` | `basementGuardian.update()` | `basementGuardianAccessoryFor` get-or-create | ✓ WIRED | Confirmed the same instance is reused across polls (`test/platform.test.ts#reuses the same BasementGuardianAccessory across polls`), not rebuilt — this is what makes DEV-08's log-once/last-valid-value guarantees hold in the live plugin, not only in isolated unit tests |
| `accountRuntime.applyDevices` (final check) | `reconciliation.forget`/`onDeviceRemoved` | confirmed-absent loop | ✓ WIRED | CR-01 fix confirmed present: loop iterates only `confirmedAbsent`, `forget()` called on both branches |
| `platform.ts removeDiscoveredDevice` | `api.unregisterPlatformAccessories` + `store.remove` | direct call | ✓ WIRED | Both the HAP accessory cache and the plugin-side `basementGuardianAccessories` cache are dropped together |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full unit suite, independently re-run (not trusted from SUMMARY.md) | `npm run build:test && node --test "dist-test/test/**/*.test.js"` | 588/588 pass, 0 fail | ✓ PASS |
| Full Cucumber suite, independently re-run | `npx cucumber-js` | 45 scenarios / 391 steps, all pass | ✓ PASS |
| TypeScript compiles clean on both configs | `npx tsc --noEmit -p tsconfig.json`; `-p tsconfig.test.json` | clean | ✓ PASS |
| Lint clean | `npx eslint . --max-warnings=0` | clean | ✓ PASS |
| DEV-05 removal protocol, single named test group | `node --test --test-name-pattern="DEV-05 removal reconciliation" dist-test/test/runtime/accountRuntime.test.js` | 5/5 pass | ✓ PASS |
| DEV-08 degrade/recover/log-once, single named test group | `node --test --test-name-pattern="degrad|recover|log" dist-test/test/accessories/basementGuardian.test.js` | 7/7 pass | ✓ PASS |

### Code Review Findings — Fix Verification (not trusted from REVIEW-FIX.md claims)

The phase went through 3 review iterations (`02-REVIEW.md`, `.iter2`, `.iter3`) and 3 fix passes (`02-REVIEW-FIX.md`, `.iter2`, `.iter3`). Every finding's fix was re-confirmed present in the current source, not accepted from the fix report's own narrative:

| Finding | Severity | Fix confirmed in current source |
|---------|----------|----------------------------------|
| CR-01 (final-check fetch could confirm an unrelated device absent, and recur permanently after one removal) | Critical | ✓ Confirmed — `accountRuntime.ts:257-268` loops only `confirmedAbsent`, calls `reconciliation.forget()` on both branches |
| WR-01 (Cucumber world only watched devices present at launch) | Warning | ✓ Confirmed — `world.ts` re-scans via `watchDevices(runtime)` inside `onTrustworthyInventory` |
| WR-02 (`Reconciliation.forget()` had no production caller) | Warning | ✓ Confirmed — resolved as a direct consequence of the CR-01 fix |
| WR-03 (`watchedDeviceIds` never pruned on removal) | Warning | ✓ Confirmed — `world.ts:511` `this.watchedDeviceIds.delete(deviceId)` present in `onDeviceRemoved` |
| WR-04 (WR-03 fix had no regression coverage) | Warning | ✓ Confirmed — `features/discovery.feature` scenario "A device removed and then rediscovered is watched again" present and passing |
| IN-01 (`services: []` permanent empty literal) | Info | Confirmed intentional and explicitly tested — not a defect, flagged for Phase 3 to grow |

No unresolved findings remain in `02-REVIEW.iter3.md` beyond IN-01 (informational, no fix required).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DEV-01 | 02-03 | Registry three-way outcome; HALO/unknown never block Gemini | ✓ SATISFIED | Code + tests confirmed above. **Note:** `REQUIREMENTS.md`'s checkbox and traceability row for `DEV-01` still read unchecked/"Pending" — the only two requirement rows in this phase not updated to reflect completion (see Anti-Patterns/Gaps below). |
| DEV-02 | 02-01, 02-03 | Family-adapter registry, additive by construction | ✓ SATISFIED | `REQUIREMENTS.md` checkbox and traceability already marked complete |
| DEV-03 | 02-01 | Strict Gemini validation prevents plausible-but-wrong state | ✓ SATISFIED | `REQUIREMENTS.md` already marked complete |
| DEV-04 | 02-01, 02-04 | UUID from `deviceId` alone; `deviceTypeId` change never re-registers | ✓ SATISFIED | `REQUIREMENTS.md` already marked complete |
| DEV-05 | 02-02, 02-05 | Two-confirmation-plus-final-check removal, fresh epoch after | ✓ SATISFIED | `REQUIREMENTS.md` already marked complete |
| DEV-06 | 02-04 | Vendor rename adopted only while HomeKit name matches stored vendor name | ✓ SATISFIED | `REQUIREMENTS.md` already marked complete |
| DEV-07 | 02-01 | Truthful `AccessoryInformation`; `deviceId` never user-visible | ✓ SATISFIED | `REQUIREMENTS.md` already marked complete |
| DEV-08 | 02-06 | Degrade in place; never unregistered for a profile/payload failure alone | ✓ SATISFIED (commands clause deferred to Phase 4, see below) | Code + tests confirmed above. **Note:** `REQUIREMENTS.md`'s checkbox and traceability row for `DEV-08` also still read unchecked/"Pending". |

No orphaned requirements: `.planning/REQUIREMENTS.md`'s Phase 2 traceability rows (`DEV-01` through `DEV-08`) all appear in at least one plan's `requirements:` frontmatter field.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.planning/REQUIREMENTS.md` | 32, 39, 121, 128 | `DEV-01` and `DEV-08` checkboxes/traceability rows still read `[ ]`/"Pending" despite both being fully implemented, tested, and code-reviewed in this phase (`02-03`, `02-06`) | ℹ️ Info | Documentation-only inconsistency, not a functional gap. The `docs(02-03)`/`docs(02-06)` completion commits added only their `SUMMARY.md` files and did not update `REQUIREMENTS.md`, unlike the `02-01`/`02-04`/`02-05` completion commits which did. Recommend updating both rows before the phase's final handoff commit so the traceability document matches the verified state. |

No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`placeholder` markers found in any Phase 2 production file (`src/device/registry.ts`, `src/device/gemini.ts`, `src/device/halo.ts`, `src/accessories/basementGuardian.ts`, `src/accessories/reconciliation.ts`, `src/platform.ts`, `src/runtime/accountRuntime.ts`, `src/persistence/accessoryContext.ts`, `src/device/state.ts`). No stub returns, no hardcoded empty data flowing to a rendered value beyond the one documented, tested, intentional case (`BasementGuardianAccessory.services: []`, IN-01 — real services are Phase 3's scope).

### Human Verification Required

1. **`Reconciliation.observe()`'s connectivity-flag-free contract (backstop-tagged, 02-02)**
   **Test:** Add or point to a held-out/property-based test proving no call path can drive `observe()` with a per-device connectivity flag, distinct from a plain read of the current `observe(deviceIds: readonly string[])` signature.
   **Expected:** The claim holds under a test designed to falsify it, not only under the current signature's absence of such a parameter.
   **Why human:** The plan explicitly tagged this truth `verification: backstop`, and this verifier's evidentiary bar for a backstop tag excludes presence/wiring inference — a human (or a dedicated follow-up plan) needs to either accept the type-signature evidence as sufficient or commission the held-out test.

2. **Registration-order independence (backstop-tagged, 02-03)**
   **Test:** Add a test (unit or Cucumber) that reorders a mixed-inventory device list between polls and asserts every device's implemented/unsupported/unknown outcome and registration decision is unchanged.
   **Expected:** No individual device's outcome depends on its position in the batch.
   **Why human:** Also tagged `verification: backstop`. The dispatch loop's structure supports the claim on inspection, but no test varies device order, so the same evidentiary gap applies.

Neither item reflects a defect found in the code — both are gaps in test *evidence* for a claim the plan authors deliberately flagged as needing stronger-than-normal proof.

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | DEV-08/SC6's "disabling commands" clause — no command surface exists yet to disable | Phase 4 | Phase 4 goal: "Users can inspect durable observed pump activity and safely operate the two controls exposed by the official Gemini client," SC2/SC3 (`System Self-Test`, `Alarm Mute`). `02-CONTEXT.md` explicitly scopes "commands and self-test" out of Phase 2 into Phase 4. `gemini.ts` already exposes `capabilities()`/`command()` for Phase 4 to wire to HAP characteristics and gate on `basementGuardian.untrusted`. |
| 2 | Apple Home not rendering `StatusActive=false` prominently for a degraded accessory | Phase 3 | `02-CONTEXT.md`'s own "Recorded concern for Phase 3" section; Phase 3 owns `SAFE-04`'s fault-adapter visibility design. |

### Gaps Summary

No must-have truth failed, no required artifact is missing or a stub, and no key link is unwired. All 588 unit tests and 45 Cucumber scenarios pass on an independent re-run from this verification pass (not from trusting SUMMARY.md), `tsc`/`eslint` are clean, and every code-review finding across three review iterations (CR-01 critical, WR-01 through WR-04 warnings) was re-confirmed fixed in the current source rather than accepted from the fix report.

The phase is held at `human_needed` rather than `passed` for two reasons, both explicit in the plans' own must-have frontmatter rather than something this pass discovered independently:

1. Two `verification: backstop`-tagged truths (02-02's connectivity-flag-free reconciliation contract, 02-03's registration-order independence) have no held-out or property-based test, only a structurally-supportive but inference-based reading of the current code. Per this verifier's rules, presence/wiring is explicitly insufficient evidence for a backstop-tagged truth.
2. `REQUIREMENTS.md` was not updated for `DEV-01`/`DEV-08` the way it was for the phase's other six requirements — a documentation-only inconsistency, not a functional one, but worth closing before the phase's final handoff commit.

Recommendation: either add the two held-out/property-based tests (closing the human-verification items outright) or have a human explicitly accept the current type-signature/loop-structure evidence as sufficient for these two backstop claims, and update `REQUIREMENTS.md`'s `DEV-01`/`DEV-08` rows to match the other six.

---

_Verified: 2026-08-29T23:59:00Z_
_Verifier: Claude (gsd-verifier)_
