---
gsd_state_version: 1.0
current_phase: 03
current_phase_name: Safety Monitoring in HomeKit
status: executing
stopped_at: Phase 3 context gathered
last_updated: "2026-08-30T13:02:54.562Z"
last_activity: 2026-08-29
last_activity_desc: Phase 02 complete, transitioned to Phase 3
state_head: e817ed2fe993973699addf3d393ca46ba566c4dc
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 31
  completed_plans: 23
  percent: 33
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-29)

**Core value:** HomeKit must promptly show trustworthy basement-protection conditions while clearly marking stale or invalid telemetry instead of reporting a false normal state.
**Current focus:** Phase 3 — Safety Monitoring in HomeKit

## Current Position

Phase: 03 (Safety Monitoring in HomeKit) — READY TO EXECUTE
Plan: Not started
Status: Ready to execute
Last activity: 2026-08-29 — Phase 02 complete, transitioned to Phase 3

Phase 01 is COMPLETE as of 2026-08-29. Verification is `passed` at 22/22, with all
three UAT items passed against real hardware.

Phase 02 is COMPLETE as of 2026-08-29. Verification is `passed` at 25/27, with both
backstop-tagged UAT items accepted on structural evidence and no defects found.

Progress: [███░░░░░░░] 2 of 6 phases complete (33%) — 23/23 plans

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

Last session: 2026-08-30T04:24:40.689Z
Stopped at: Phase 3 context gathered
Resume file: .planning/phases/03-safety-monitoring-in-homekit/03-CONTEXT.md
