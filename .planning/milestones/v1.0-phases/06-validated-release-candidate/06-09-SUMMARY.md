---
phase: 06-validated-release-candidate
plan: 09
subsystem: release-governance
tags: [checklist, hardware-validation, uat, release-process, documentation]

# Dependency graph
requires:
  - phase: 04-pump-records-and-official-controls
    provides: 04-UAT.md's test/expected/why_human/status structure and the recorded forcing-harness recipe/field domains from the deferred 2026-09-04 paired-home session
provides:
  - dev/prep/g001-alarm-mute-checklist.md — ready-to-run G-001 alarm-mute measurement procedure
  - dev/prep/g002-water-level-checklist.md — ready-to-run G-002 water-level-ladder measurement procedure
  - dev/prep/g003-g004-paired-home-checklist.md — combined G-003/G-004/Phase-3-flood-automation paired-home session recipe
  - dev/prep/release-checklist.md — literal per-publish release-readiness checklist implementing D-026
affects: [06-10, any future maintainer session that executes G-001..G-004 or publishes a release]

actuals:
  tokens: 7171
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "dev/prep/ runbook checklists modeled on 04-UAT.md's test/expected/why_human/status structure"

key-files:
  created:
    - dev/prep/g001-alarm-mute-checklist.md
    - dev/prep/g002-water-level-checklist.md
    - dev/prep/g003-g004-paired-home-checklist.md
    - dev/prep/release-checklist.md
  modified: []

key-decisions:
  - "Every checklist item's status is written pending; this phase performs no hardware or paired-home measurement itself, so no item may be marked passed from this phase's own evidence (D-03, T-06-21)"
  - "G-002's existing 1-to-3 water-level transition (observed 2026-08-31, mapped 20% to 40%) is recorded as prior evidence, not re-asked for; only codes 0, 7, 15, 31 and the flood threshold remain open items"
  - "G-003, G-004, and Phase 3's still-open flood-automation check are combined into one session recipe because all three need the same paired real Apple Home, reusing 04-UAT.md's recorded forcing-harness field domains rather than re-deriving them"
  - "release-checklist.md separates every-prerelease gates from the additional gates required only before 1.0.0, and states plainly that no G-00X row may be checked off from this phase's own evidence"

requirements-completed: []

coverage:
  - id: D1
    description: "G-001 alarm-mute checklist covers acknowledgement, latency, duration, and failure behavior, citing PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE"
    verification:
      - kind: other
        ref: "grep checks in 06-09-PLAN.md Task 1 verify block"
        status: pass
    human_judgment: false
  - id: D2
    description: "G-002 water-level checklist names all four unvalidated codes (0, 7, 15, 31) and the flood threshold, recording the 2026-08-31 data point as prior evidence"
    verification:
      - kind: other
        ref: "grep checks in 06-09-PLAN.md Task 1 verify block"
        status: pass
    human_judgment: false
  - id: D3
    description: "Combined G-003/G-004/flood-automation checklist covers all three checks in one paired-home session recipe"
    verification:
      - kind: other
        ref: "grep checks in 06-09-PLAN.md Task 2 verify block"
        status: pass
    human_judgment: false
  - id: D4
    description: "Release-readiness checklist implements D-026's staged-release requirements as a literal per-publish list"
    verification:
      - kind: other
        ref: "grep checks in 06-09-PLAN.md Task 3 verify block"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-09-05
status: complete
---

# Phase 6 Plan 09: Hardware/Release-Gate Checklists Summary

**Four ready-to-run `dev/prep/` checklists for G-001, G-002, G-003/G-004, and the release-readiness gate — written but deliberately unexecuted, every item status: pending.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-09-05T03:33:09Z
- **Tasks:** 3
- **Files modified:** 4 (all new)

## Accomplishments

- Wrote `dev/prep/g001-alarm-mute-checklist.md`: four items (acknowledgement,
  latency, mute duration, failure behavior) covering everything G-001 needs,
  citing `PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE` as the constant a future
  session confirms or corrects.
- Wrote `dev/prep/g002-water-level-checklist.md`: four items for codes `0`,
  `7`, `15`, `31` and the flood threshold, recording the existing `1`-to-`3`
  transition (2026-08-31, 20% to 40%) as settled prior evidence rather than
  re-asking for it.
- Wrote `dev/prep/g003-g004-paired-home-checklist.md`: combined G-003 (both
  pump Contact Sensors), G-004 (Leak Sensor notification delivery and the
  Critical Alerts claim), and Phase 3's still-open flood-automation check
  into one session recipe, reusing the forcing-harness mechanism and field
  domains recorded in `04-UAT.md`'s "Deferred session, 2026-09-04" section.
- Wrote `dev/prep/release-checklist.md`: turns D-026's staged-release
  decision into a literal per-publish checklist (automated checks, SemVer,
  `npm publish --tag next`, GitHub prerelease flag, release notes,
  CHANGELOG move), plus a separate section for the additional gates
  (G-001..G-004, real-pump suite, package/secret scans) required only
  before `1.0.0`.

## Task Commits

Each task was committed atomically:

1. **Task 1: G-001 and G-002 checklists** - `f62c480` (feat)
2. **Task 2: G-003/G-004 combined paired-home checklist** - `b6612f1` (feat)
3. **Task 3: Release-readiness checklist** - `eaf48a8` (feat)

**Plan metadata:** committed alongside this SUMMARY (see final commit below).

## Files Created

- `dev/prep/g001-alarm-mute-checklist.md`
- `dev/prep/g002-water-level-checklist.md`
- `dev/prep/g003-g004-paired-home-checklist.md`
- `dev/prep/release-checklist.md`

## Decisions Made

- Every checklist item's `status:` is `pending`. Confirmed by grep across all
  four files: no `status: passed` or `status: complete` string appears
  anywhere in this plan's own artifacts, satisfying the plan's prohibition
  and threat register entry T-06-21.
- G-003, G-004, and Phase 3's flood-automation check share one session
  recipe rather than three separate files, because all three need the same
  real paired Apple Home and the same forcing-harness mechanism — splitting
  them would duplicate the mechanism description three times.
- `release-checklist.md` explicitly separates "every prerelease" gates from
  "additional gates before `1.0.0`" so a maintainer publishing a `0.x`
  prerelease is not misled into thinking G-001..G-004 apply to that publish.

## Deviations from Plan

None — plan executed exactly as written. All three tasks' automated verify
commands (grep checks named in the plan) pass against the committed files.

## REL-07 Requirement Status

REL-07 is declared by this plan, by 06-01 (already done), and by 06-10 (not
yet run). Per the requirements gate note, `requirements.ready-ids` was run
against this plan and returned REL-07 as `blocked`, not `ready`:

```json
{ "ready": [], "blocked": ["REL-07"], "total": 1 }
```

REL-07 is therefore **not** marked complete by this plan. It stays open
until 06-10 finishes and the gate reports it ready.

## Issues Encountered

None.

## Next Phase Readiness

- All four `dev/prep/` checklists are in place and directly executable by a
  future hardware/real-home session or a future release, with no need to
  re-read this phase's planning artifacts first.
- `06-10` is the remaining plan expected to close out REL-07's requirement
  status alongside this plan's and 06-01's contributions.

---

*Phase: 06-validated-release-candidate*
*Plan: 09*
*Completed: 2026-09-05*

## Self-Check: PASSED

All four checklist files and this SUMMARY.md were confirmed present on disk.
All four task/summary commit hashes (`f62c480`, `b6612f1`, `eaf48a8`,
`d268912`) were confirmed present in git history.
