---
gsd_state_version: 1.0
current_phase: 03
current_phase_name: Safety Monitoring in HomeKit
status: executing
stopped_at: Completed 03-06-PLAN.md
last_updated: "2026-08-30T18:55:25.987Z"
last_activity: 2026-08-30
last_activity_desc: Phase 03 execution started
state_head: b97f81bb1c17a0e23e1ba425e5ec344962f61a59
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 31
  completed_plans: 29
  percent: 33
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-29)

**Core value:** HomeKit must promptly show trustworthy basement-protection conditions while clearly marking stale or invalid telemetry instead of reporting a false normal state.
**Current focus:** Phase 03 — Safety Monitoring in HomeKit

## Current Position

Phase: 03 (Safety Monitoring in HomeKit) — EXECUTING
Plan: 7 of 8
Status: Ready to execute
Last activity: 2026-08-30 — Phase 03 execution started

Phase 01 is COMPLETE as of 2026-08-29. Verification is `passed` at 22/22, with all
three UAT items passed against real hardware.

Phase 02 is COMPLETE as of 2026-08-29. Verification is `passed` at 25/27, with both
backstop-tagged UAT items accepted on structural evidence and no defects found.

Progress: [███░░░░░░░] 2 of 6 phases complete ([███░░░░░░░] 33%) — 23/23 plans

## Performance Metrics

**Velocity:**

- Total plans completed: 6
- Average duration: -
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 02 | 6 | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: Not available

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 03 P01 | 39 min | 3 tasks | 6 files |
| Phase 03 P02 | 42 min | 3 tasks | 7 files |
| Phase 03 P03 | 31 min | 3 tasks | 8 files |
| Phase 03 P04 | 60 min | 1 tasks | 12 files |
| Phase 03 P05 | 60 min | 3 tasks | 7 files |
| Phase 03 P06 | 45 min | 3 tasks | 7 files |

## Accumulated Context

### Decisions

All 40 ADR-locked decisions are preserved in PROJECT.md `<decisions>` blocks. Current planning anchors:

- [Phase 1]: One singular account; bundled Auth0 client ID; typed REST/shadow state; secrets stay in Homebridge-owned storage.
- [Phase 2]: Gemini only in v1; family validation fails closed; `deviceId` preserves physical identity.
- [Phase 2, decided 2026-08-29]: The vendor `deviceId` is treated as non-sensitive and may enter
  accessory context and logs. `D-027` still keeps it out of public artifacts. Rests on
  `<account-id>` being an opaque key, unconfirmed against a real inventory response.

- [Phase 2, decided 2026-08-29]: A valid empty inventory list counts toward confirmed removal,
  keeping `D-029` as locked. Accepted risk: a sustained account glitch could remove every
  accessory, bounded by two confirmations plus a final check.

- [Phase 2, decided 2026-08-29]: Build the full capability-descriptor family registry per `DEV-02`,
  not a minimal interface. Gemini is the only complete implementation this milestone.

- [Phase 2, decided 2026-08-29]: Degraded accessories set `StatusActive` false and leave
  `StatusFault` at `NO_FAULT`. `StatusFault` stays reserved for the five vendor-reported
  `SAFE-04` conditions. Apple Home visibility of that state is a recorded Phase 3 concern.

- [Phase 3]: Truthful standards-first HomeKit mapping with separate actionable fault adapters; the `D-014` preserve-and-mark invariant keeps the last valid value and faults only the narrowest owning scope.
- [Phase 4]: Only self-test and boolean alarm mute are writable; reported state remains authoritative. Validation gates no longer block phase completion; they block only the `1.0.0` release.
- [Phase 6]: `1.0.0` remains blocked by G-001, G-002, G-003, G-004, automated checks, read-only real-pump tests, and real-home validation.
- [Cross-phase tests]: Unit tests mirror `src/` under `test/`. Cucumber fake-pump tests run in CI. Real-pump tests are opt-in and read-only.
- [Cross-phase architecture]: Manual constructor dependency injection is preferred for plugin-owned services. This preference is not ADR-locked and can change during phase discussion.
- [Phase 03]: The Cucumber harness has one hand-built HAP stand-in, features/support/fakeHap.ts, whose Service and Characteristic are constructible base classes. — Every module this phase adds declares its HomeKit types by subclassing the injected api.hap namespace, so a stand-in of identifier constants cannot exercise any of them.
- [Phase 03]: FakeHomebridgeApi exposes a hap member typed as the stand-in namespace, beside the deliberately widened api member. — api is widened to Homebridge own API type, which types hap as the real HAP-NodeJS namespace, so a step reaching a service class through api.hap would hand a real HAP class to a stand-in accessory.
- [Phase 03]: Phase 3: the provisional water-level ladder and flood threshold live in src/device/waterLevel.ts alone, named PROVISIONAL_*, so closing G-002 is one reviewable edit.
- [Phase 03]: Phase 3: FieldViolation carries the TrustScope its field owns, and decode() omits only the scopes that did not validate. undefined means the scope did not validate, never that it reported nothing.
- [Phase 03]: Phase 3: the six Gemini group interfaces were not declared. The family-neutral groups already carry Gemini's exact members, so GeminiDomainState aliases ScopedDomainState; empty extending interfaces fail lint and re-declaration would duplicate them.
- [Phase 03]: Phase 3: a defensive guard behind a validation gate is covered by constructing the broken contract it names, never by a coverage exception or a silent default.
- [Phase 03]: D-12 confirmed: a HomeKit service subtype is its ServiceKind slug verbatim, and custom service and characteristic UUIDs are hard-coded random v4 literals outside Apple's base namespace — A seed-derived identifier would silently orphan every custom service on every installed accessory if the seed were later edited, with a green test suite. A literal cannot drift.
- [Phase 03]: The accessory logs its degradation warning on any transition into a degraded state, not only when no adapter resolves — A per-field validation failure now narrows distrust to one scope, but the owner still needs the diagnostic; scoping the log to the unresolved-family branch would have removed a passing discovery scenario's assertion.
- [Phase 03]: Both battery services publish under the single backup-battery kind and subtype, named Backup Battery and Backup Battery Facts
- [Phase 03]: A row's trust gate is applied per decoded scope group rather than per row, so Sump Pit Level keeps publishing water while the fault scope is untrusted
- [Phase 03]: A merged backup-pump verdict is withheld unless both raw causes decoded, rather than defaulting the missing one to false
- [Phase 03]: hap.Service.Battery is used; the Service.BatteryService alias does not exist on the Homebridge 2.x HAP line

### Pending Todos

- Backup-battery fault adapter: RESOLVED in the Phase 3 discussion (2026-08-30) against a sixth
  adapter. `D-008` stays locked at five; `battery_health == 32` surfaces through the standard
  Battery service's `StatusLowBattery`. Remove the open proposal from PROJECT.md when Phase 3
  completes.
- `package.json` keeps `private: true` as an accidental-publish guard. Remove it in Phase 6 when the first `0.x` prerelease goes to the npm `next` tag under `D-026`. The version now reads `0.1.0`.
- `package.json` declares `license: "Apache-2.0"`, which contradicts the `D-035` `SEE LICENSE IN LICENSE` metadata rule. Resolve in Phase 6.
- `homebridge-lib` is still a runtime dependency and `config.schema.json` still carries `strictValidation: false`. Resolve the schema flag in Phase 1 and the dependency removal in Phase 6.

### Blockers/Concerns

These are `1.0.0` release gates, not phase blockers. Each phase delivers its implementation and marks any unvalidated constant provisional.

- G-001: Validate Gemini alarm-mute acknowledgement, state changes, duration, latency, and failure behavior before the `1.0.0` release.
- G-002: Validate all Gemini water-level codes and the flood threshold during a natural cycle.
- G-003: Validate both pump Contact Sensors in an eligible real Apple home before release.
- G-004: Validate `Sump Pit Flood` Leak Sensor notification delivery in a real eligible Apple home with a current home hub and the current Home architecture, and confirm that no documentation claims a Critical Alerts guarantee.

Carried forward from Phase 2:

- [Phase 2 → Phase 3]: RESOLVED in the Phase 3 discussion (2026-08-30). Degraded state is marked
  with `StatusActive = false` plus README guidance, with no new adapter and no ADR revision
  (`03-CONTEXT.md` D-05). Apple Home shows it under accessory Details as "Status Active — No".

Opened by the Phase 3 discussion, resolved by Phase 3 research:

- [Phase 3]: The claim that `StatusActive = false` drops a sensor out of Apple Home automations was
  REFUTED at its source (2026-08-30). The cited issue is a 2017 thread on a different subject, and
  its one relevant comment contradicts the claim. `D-05` stands. Residual: nobody could confirm
  Apple Home's behavior on current iOS, so a real-home check rides along with `G-003`/`G-004` —
  build an automation on `Sump Pit Flood`, force a degraded scope, confirm it still fires. Only a
  positive finding there reopens `D-05`.
- Phase 3: test/accessories/basementGuardian.test.ts still carries a second hand-built HAP stand-in. Migrating it now would weaken one assertion from undefined to the empty string and drop a branch the pair 100% coverage needs. Migrate when 03-04 or 03-06 reworks its AccessoryInformation assertions; new accessories unit tests must import features/support/fakeHap.ts rather than grow their own.

### Quick Tasks Completed

| # | Description | Date | Commit | Status | Directory |
|---|-------------|------|--------|--------|-----------|
| 260829-idd | Correct vendor API intel to the measured wire shape | 2026-08-29 | cd7c651 |  | [260829-idd-correct-vendor-api-intel-to-the-measured](./quick/260829-idd-correct-vendor-api-intel-to-the-measured/) |
| 260829-gx6 | Fix vendor REST wire-shape defects in device discovery | 2026-08-29 | 6826afd | Verified | [260829-gx6-fix-vendor-rest-wire-shape-defects-in-de](./quick/260829-gx6-fix-vendor-rest-wire-shape-defects-in-de/) |
| 260828-bq0 | Refine planning artifacts against ingested intel | 2026-08-28 | 76b3edd |  | [260828-bq0-refine-planning-artifacts-against-ingest](./quick/260828-bq0-refine-planning-artifacts-against-ingest/) |
| 2 | Set the package version to 0.1.0 | 2026-08-28 | 4e46bd1 |  | — |
| 260828-jaf | Record constructor dependency injection as a revisitable preference | 2026-08-28 | b0543e2 |  | [260828-jaf-record-constructor-dependency-injection-](./quick/260828-jaf-record-constructor-dependency-injection-/) |
| 260828-jkw | Add agent reference documentation links | 2026-08-28 | 91c21a1 |  | [260828-jkw-add-agent-reference-documentation-links](./quick/260828-jkw-add-agent-reference-documentation-links/) |

## Deferred Items

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| Device family | HALO adapter implementation | Deferred | Initialization | v2 |
| Setup | Custom setup interface | Deferred | Initialization | v2 |

## Session Continuity

Last session: 2026-08-30T18:55:25.706Z
Stopped at: Completed 03-06-PLAN.md
Resume file: None
