---
phase: quick-260906-d6e
plan: 01
subsystem: homekit-services
tags: [homebridge, hap, config-schema, changelog, simple-english, humanizer]

# Dependency graph
requires:
  - phase: 06
    provides: published 0.1.0 release with the prior service names and CHANGELOG body
provides:
  - "backup-pump-running" slug/displayName replacing "backup-pump-activated"
  - Swapped backup-battery displayNames ("Backup Battery Level" for the standard Battery
    service, "Backup Battery" for the vendor-facts service)
  - Alphabetically reordered config.schema.json ignoredFaults enum/enumNames
  - README config example with required email/password fields and a GFM admonition
  - Simple-english/humanizer prose pass over README.md and CONTRIBUTING.md
  - Two-bullet CHANGELOG 0.1.0 entry
affects: [readme, contributing, changelog, config-schema, homekit-service-names]

# Actuals (#2632)
actuals:
  tokens: 15823
  tasks: 4
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Catalogue declaration order vs. schema alphabetical-by-label order are two independent
      orderings over the same seven ignoredFaults names; renaming a slug can require reordering
      one list and not the other."

key-files:
  created: []
  modified:
    - src/accessories/services.ts
    - src/accessories/serviceCatalogue.ts
    - config.schema.json
    - README.md
    - CONTRIBUTING.md
    - CHANGELOG.md
    - test/config.test.ts
    - test/configSchema.test.ts
    - test/platform.test.ts
    - test/accessories/services.test.ts
    - test/accessories/customServices.test.ts
    - test/accessories/staleMarking.test.ts
    - test/accessories/serviceCatalogue.test.ts
    - test/accessories/basementGuardian.test.ts
    - features/safetyMonitoring.feature
    - features/pumpRecords.feature
    - features/support/steps/hap.ts

key-decisions:
  - "Renamed 'Backup Pump Activated' to 'Backup Pump Running' (slug backup-pump-running) to match
    'Primary Pump Running'; kept its position in catalogue-declaration-order lists and moved it
    from first to second position in the schema's alphabetical-by-label ignoredFaults enum."
  - "Swapped the two backup-battery displayNames: the standard hap.Service.Battery row is now
    'Backup Battery Level', the custom BackupBatteryService (vendor-facts) row is now
    'Backup Battery'. Both keep the shared kind: 'backup-battery' and subtype unchanged."
  - "Moved the prefix-collision trailing-comma disambiguation needle in
    basementGuardian.test.ts's two warning-substring assertions from the battery row to the facts
    row, since the short/long prefix relationship inverted under the rename."
  - "Fixed a pre-existing 'Basemenet' typo to 'Basement' in README's opening sentence during the
    simple-english/humanizer pass, since it was in scope as a prose-clarity correction."

patterns-established: []

requirements-completed: [SAFE-02, CONF-06]

# Coverage metadata
coverage:
  - id: D1
    description: "Backup Pump Activated renamed to Backup Pump Running (slug backup-pump-running) everywhere in src/, config.schema.json, test/, features/, and README.md"
    requirement: "CONF-06"
    verification:
      - kind: unit
        ref: "npm run test:unit (1449 tests, 1444 pass, 5 pre-existing unrelated failures)"
        status: pass
      - kind: integration
        ref: "npm run test:cucumber (104 scenarios, 104 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The two backup-battery-kind rows read Backup Battery Level (standard hap.Service.Battery row) and Backup Battery (custom BackupBatteryService row), with the prefix-collision test fix applied"
    requirement: "CONF-06"
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts (PREFIX_COLLISION_FIXED grep check + full suite pass)"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts (full suite pass)"
        status: pass
    human_judgment: false
  - id: D3
    description: "config.schema.json ignoredFaults enum/enumNames reordered to stay alphabetical by label; test/configSchema.test.ts's mirrored expectedValues array matches"
    requirement: "CONF-06"
    verification:
      - kind: unit
        ref: "node -e schema-order check (SCHEMA_ORDER_OK)"
        status: pass
      - kind: unit
        ref: "test/configSchema.test.ts (full suite pass)"
        status: pass
    human_judgment: false
  - id: D4
    description: "README's minimum config example shows email/password placeholders; the Eve-app footnote is a GFM [!NOTE] admonition in its original location; inline [\\*] markers unchanged"
    requirement: "SAFE-02"
    verification:
      - kind: other
        ref: "grep checks: CONFIG_EXAMPLE_HAS_CREDS, PLATFORM_NAME_UNCHANGED, FOOTNOTE_DEF_REMOVED, ADMONITION_ADDED, ADMONITION_POSITION_OK, INLINE_MARKERS_PRESENT"
        status: pass
      - kind: other
        ref: "pre-commit run markdownlint-cli2 mdformat --files README.md CONTRIBUTING.md"
        status: pass
    human_judgment: false
  - id: D5
    description: "README.md and CONTRIBUTING.md passed through simple-english and humanizer skills with all factual content, renamed names, the config example, and the admonition preserved"
    verification:
      - kind: unit
        ref: "test/documentation.test.ts (child bridge, estimate assertions still pass)"
        status: pass
      - kind: other
        ref: "grep checks: TASK_1_2_CONTENT_PRESERVED, PASSING_DOC_ASSERTIONS_PRESERVED, CONTRIBUTING_COMMANDS_PRESERVED"
        status: pass
    human_judgment: false
  - id: D6
    description: "CHANGELOG.md's 0.1.0 body is exactly the two specified bullets; Unreleased stays empty above it; header and links untouched"
    verification:
      - kind: other
        ref: "grep/sed checks: HEADINGS_PRESENT, ORDER_OK, UNRELEASED_EMPTY, BODY_IS_TWO_BULLETS_NO_SUBSECTIONS, BULLET_TEXT_OK, HEADER_PRESERVED"
        status: pass
    human_judgment: false

# Metrics
duration: 70min
completed: 2026-09-06
status: complete
---

# Quick Task 260906-d6e: Rename Pump-Running and Battery Services Summary

**Renamed "Backup Pump Activated" to "Backup Pump Running" and swapped the two backup-battery
displayNames ("Backup Battery Level" / "Backup Battery"), reordered the config schema's
ignoredFaults enum to stay alphabetical, refreshed README's config example and Eve-app footnote,
ran a simple-english/humanizer pass over README.md and CONTRIBUTING.md, and reset CHANGELOG's
0.1.0 entry to two bullets.**

## Performance

- **Duration:** 70 min
- **Started:** 2026-09-06T14:13:47Z
- **Completed:** 2026-09-06T15:24:07Z
- **Tasks:** 4
- **Files modified:** 17

## Accomplishments

- Renamed the `backup-pump-activated` contact-sensor row to `backup-pump-running` /
  "Backup Pump Running" throughout `src/`, `config.schema.json`, every affected `test/` and
  `features/` file, and README.md, reordering only the schema's alphabetical-by-label
  `ignoredFaults` enum/enumNames while leaving every catalogue-declaration-order list untouched.
- Swapped the two `backup-battery`-kind rows' displayNames: the standard `hap.Service.Battery`
  row now reads "Backup Battery Level" and the custom `BackupBatteryService` (vendor-facts) row
  now reads "Backup Battery" — including moving the prefix-collision trailing-comma
  disambiguation needle in `basementGuardian.test.ts` to the row it now belongs to.
- Added the schema-required `email`/`password` fields (with obviously fake placeholder values)
  to README's minimal Homebridge configuration example, and converted the Eve-app footnote
  definition into a GFM `> [!NOTE]` admonition in the same location.
- Ran the `simple-english` and `humanizer` skills over README.md and CONTRIBUTING.md, fixing
  passive-voice constructions, missing articles, an overly long run-on sentence, and a
  pre-existing "Basemenet" typo, while preserving every renamed name, the config example, the
  admonition, and every documented command.
- Reset `CHANGELOG.md`'s `## [0.1.0] - 2026-09-05` section from 27 bullets across four
  subsections to exactly two bullets ("Initial release." and the Gemini-support line), after
  confirming via the `simple-english` and `humanizer` skills that neither line needed a change.

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename the pump-running and battery service names across source, schema, tests, and Cucumber fixtures** - `23d65fa` (feat)
2. **Task 2: README config example and footnote-to-admonition conversion** - `c4ad3ef` (docs)
3. **Task 3: Simple-english and humanizer pass over README.md and CONTRIBUTING.md** - `96f8251` (docs)
4. **Task 4: Reset CHANGELOG.md's 0.1.0 entry to a two-line summary** - `84f1f03` (docs)

**Plan metadata:** to be committed by the orchestrator after this SUMMARY.

## Files Created/Modified

- `src/accessories/services.ts` - `NotificationServiceKind`/`NOTIFICATION_SERVICE_KINDS` renamed slug
- `src/accessories/serviceCatalogue.ts` - pump row and both battery rows renamed
- `config.schema.json` - `ignoredFaults` enum/enumNames renamed and reordered
- `README.md` - accessories list, `ignoredFaults` list, config example, admonition, prose pass
- `CONTRIBUTING.md` - prose pass, commands/paths preserved
- `CHANGELOG.md` - `0.1.0` body reset to two bullets
- `test/config.test.ts`, `test/configSchema.test.ts`, `test/platform.test.ts`,
  `test/accessories/services.test.ts`, `test/accessories/customServices.test.ts`,
  `test/accessories/staleMarking.test.ts`, `test/accessories/serviceCatalogue.test.ts`,
  `test/accessories/basementGuardian.test.ts` - mirrored renames and the prefix-collision fix
- `features/safetyMonitoring.feature`, `features/pumpRecords.feature`,
  `features/support/steps/hap.ts` - mirrored renames in Cucumber fixtures and step definitions

## Decisions Made

- Renamed `backup-pump-activated` to `backup-pump-running` in place everywhere except the schema's
  alphabetical enum, which moved the entry from first to second position (per the plan's explicit
  two-ordering rule).
- Swapped the battery displayNames per the plan: standard service = "Backup Battery Level",
  vendor-facts service = "Backup Battery"; both keep the shared `kind: 'backup-battery'`.
- Fixed a pre-existing "Basemenet" typo to "Basement" in README's opening sentence during the
  prose pass, as an in-scope clarity correction (not a fact change).
- Confirmed via the `simple-english` and `humanizer` skills that the two finalized CHANGELOG
  bullets needed no material change, so no deviation was recorded for Task 4.

## Deviations from Plan

None - plan executed exactly as written. No Rule 1-4 auto-fixes were needed; all renames,
reorderings, and prose edits matched the plan's explicit, line-by-line instructions.

### TOOLING HAZARD ENCOUNTERED (process note, not a deviation from the plan's code)

Committing each task's staged files while `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `COPYING`, and
this quick task's `PLAN.md` sat pre-staged in the index (prior in-progress work on this branch,
per the dispatch context) triggered the pathspec-commit hazard already recorded in
`.planning/STATE.md`'s Blockers section: `git commit -m <msg> -- <paths>` produced a spurious
TruffleHog "files were modified by this hook" failure (0 secrets found) when other files remained
staged outside the pathspec. Worked around, for each of the four task commits, by temporarily
`git restore --staged`-ing the three unrelated pre-existing files plus this task's own `PLAN.md`,
committing with a plain (no-pathspec) `git commit`, then `git add`-ing those files back to restore
the exact pre-existing staged state. Verified after each commit via `git show --name-only` that
only the intended task files landed in each commit, and via `git status --short` that the
pre-existing staged files were restored unchanged.

## Issues Encountered

None beyond the tooling hazard documented above, which was resolved without touching any
production or test file.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All four tasks committed atomically on `features/phase-06-validated-release-candidate`, exactly
  the 17 files in the plan's `files_modified` list changed (confirmed via `git diff --stat`
  against the pre-plan commit).
- `npm run typecheck`/`lint`/`fallow`/`format:check` all pass; `npm run test:cucumber` is fully
  green (104/104); `npm run test:unit` shows no failure beyond the five documented pre-existing
  ones (`test/documentation.test.ts` x3, `test/packedArtifact.test.ts` x2 — both caused by other
  in-progress, uncommitted work on this branch, not by this plan).
- No blockers for the orchestrator's subsequent docs commit (SUMMARY.md, STATE.md, ROADMAP.md,
  REQUIREMENTS.md).

---
*Phase: quick-260906-d6e*
*Completed: 2026-09-06*

## Self-Check: PASSED

All 17 files in `key-files.modified` verified present on disk. All 4 task commit hashes
(`23d65fa`, `c4ad3ef`, `96f8251`, `84f1f03`) verified present in `git log --oneline --all`.
