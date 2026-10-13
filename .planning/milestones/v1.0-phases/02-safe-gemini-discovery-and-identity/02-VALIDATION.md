---
phase: 2
slug: safe-gemini-discovery-and-identity
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-29
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `02-RESEARCH.md` § Validation Architecture. Task IDs are filled in once plans exist.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` (unit, Node `^22.10.0 \|\| ^24.0.0` built-in) + `@cucumber/cucumber@13.2.1` (feature/integration) [VERIFIED: `package.json`] |
| **Config file** | `cucumber.json` (profiles: `default`, `real`); unit tests run via `tsconfig.test.json` build + `node --test`, no separate runner config |
| **Quick run command** | `npm run test:unit` (build `dist-test/` then `node --test "dist-test/test/**/*.test.js"`) |
| **Full suite command** | `npm test` (`test:unit` then `test:cucumber`) |
| **Estimated runtime** | Unit suite seconds; Cucumber suite tens of seconds (in-process broker, ephemeral ports, no network) |

---

## Sampling Rate

- **After every task commit:** `npm run test:unit`, plus `npx eslint <changed files> --max-warnings=0`
- **After every plan wave:** `npm test` (both suites, per `D-12`)
- **Before `/gsd-verify-work`:** Full suite must be green — run at least three consecutive times before
  claiming pass. Phase 1's own hazard record notes `npm run check` failed 1 run in 4 while every
  report claimed green; a single green run is not a green gate for this codebase.
- **Max feedback latency:** under 30 seconds for the per-task quick run

---

## Per-Task Verification Map

Task IDs, plans, and waves are not yet known — plans do not exist for this phase yet. Rows below
are seeded at requirement granularity from `02-RESEARCH.md` § Validation Architecture and will be
filled in with real Task ID / Plan / Wave once the planner runs.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | DEV-01 | — | Registry returns implemented/unsupported/unknown for a `deviceTypeId`; non-Gemini never blocks Gemini publication | unit | `npm run test:coverage:direct -- dist-test/src/device/registry.js dist-test/test/device/registry.test.js` | ❌ Wave 0 (new module + test) | ⬜ pending |
| TBD | TBD | TBD | DEV-01 | — | End-to-end: a HALO and an unknown-type device alongside a valid Gemini in one inventory | feature | `npm run test:cucumber` (new scenario) | ❌ Wave 0 (new feature file; `toDevice()` needs a `deviceTypeId` column) | ⬜ pending |
| TBD | TBD | TBD | DEV-02 | — | Registry is keyed by `deviceTypeId`, not a switch/if-chain | unit | same registry test file as DEV-01 | ❌ Wave 0 | ⬜ pending |
| TBD | TBD | TBD | DEV-03 | — | Missing/wrong-type/out-of-domain fields produce `{valid: false, violations}` before decode | unit | `npm run test:coverage:direct -- dist-test/src/device/gemini.js dist-test/test/device/gemini.test.js` | ✅ exists, currently a type-only stub — needs upgrade to real `validate()`/`decode()` behavior cases | ⬜ pending |
| TBD | TBD | TBD | DEV-04 | — | UUID seeded only from `deviceId`; `deviceTypeId` change reuses the same accessory | unit + feature | `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js`; `npm run test:cucumber` | ✅ `platform.test.ts` exists (Phase 1), needs discovery/reconciliation cases; feature scenario is ❌ Wave 0 | ⬜ pending |
| TBD | TBD | TBD | DEV-05 | — | Two consecutive trustworthy absences + final check removes the accessory and ends the epoch; a failed poll never counts; an empty-but-valid list counts | unit + feature | new reconciliation module's direct-coverage command; `npm run test:cucumber` | ❌ Wave 0 (module, unit test, and feature scenario all new) | ⬜ pending |
| TBD | TBD | TBD | DEV-06 | — | Vendor rename adopted only when the HomeKit name still equals the stored prior vendor name | unit | `npm run test:coverage:direct -- <module path>.js <module path>.test.js` (module TBD — see Open Question 1 / Claude's Discretion) | ❌ Wave 0 | ⬜ pending |
| TBD | TBD | TBD | DEV-07 | — | `AccessoryInformation` gets `Manufacturer`/`Model`/`SerialNumber`/`FirmwareRevision` from validated fields; `deviceId` never reaches a HAP characteristic value | unit | `npm run test:coverage:direct -- dist-test/src/accessories/basementGuardian.js dist-test/test/accessories/basementGuardian.test.js` | ✅ exists, currently a type-only stub — needs upgrade | ⬜ pending |
| TBD | TBD | TBD | DEV-08 | — | Degraded accessory sets `StatusActive=false`, leaves `StatusFault=NO_FAULT`, keeps last valid values, logs once | unit + feature | same `basementGuardian` test pair; `npm run test:cucumber` | ✅/❌ mixed — unit pair exists as a stub; feature scenario is Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `features/support/fakeHomebridgeApi.ts` — `hap` is currently `{}` and the accessory stand-in
      has no `addService`/`getService`/`getServiceById`; the `API` stand-in has no
      `registerPlatformAccessories`/`updatePlatformAccessories`/`unregisterPlatformAccessories`.
      The module's own fileoverview already flags this: "The accessory adapters grow this module
      when they arrive."
- [ ] `features/support/steps/harness.ts`'s `toDevice()` hardcodes `deviceTypeId:
      'wayneWaterGemini'` — needs a `deviceTypeId` table column so a scenario can seed a HALO or
      unknown-profile device.
- [ ] `test/device/registry.test.ts` (or wherever the registry module lands) — new, covers DEV-01/DEV-02.
- [ ] New feature file (e.g. `features/discovery.feature`) covering registration, the two-poll
      removal window, vendor-rename adoption, and degrade-in-place — none of these scenarios exist
      today; `features/lifecycle.feature` only covers start/shutdown.
- [ ] `test/device/gemini.test.ts`, `test/accessories/basementGuardian.test.ts`,
      `test/accessories/services.test.ts`, `test/persistence/accessoryContext.test.ts` — all four
      exist today as type-only `satisfies`/`@ts-expect-error` stub tests with zero runtime cases;
      each needs real behavioral coverage once its module gains a production implementation.

---

## Manual-Only Verifications

Phase 2 uses the existing fake REST harness for all defined behaviors; no real-hardware or
real-Apple-Home step is required to verify DEV-01 through DEV-08. The unresolved `<account-id>`
opacity assumption (02-CONTEXT.md "Caveat to confirm") is a documentation caveat, not a blocked
test — every test fixture already uses placeholders regardless of the real shape.

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
