---
phase: 260828-bq0
plan: 01
subsystem: planning
tags: [requirements, roadmap, traceability, release-gates, documentation]

requires:
  - phase: initialization
    provides: Ingested intel record under .planning/intel/ and the initial four planning artifacts
provides:
  - 46 v1 requirements with a complete 46/46/0 traceability record
  - Release-only framing for validation gates G-001 through G-004
  - New requirements DEV-07, DEV-08, and REL-08
  - New gate G-004 for Leak Sensor notification delivery
  - RES-01 and RES-02 relocated from Phase 5 to Phase 3
  - Backup-battery fault adapter recorded as an open proposal
affects: [phase-2-discovery, phase-3-safety-monitoring, phase-5-degraded-operation, phase-6-release]

actuals:
  tokens: 11614
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Mechanical traceability check: REQUIREMENTS.md table (ID, phase) pairs must equal the ROADMAP.md per-phase Requirements pairs"

key-files:
  created: []
  modified:
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/PROJECT.md
    - .planning/STATE.md

key-decisions:
  - "Validation gates G-001 through G-004 block only the 1.0.0 release, never phase completion"
  - "RES-01 and RES-02 belong to Phase 3 because the D-014 preserve-and-mark invariant is already a Phase 3 success condition"
  - "ignoredFaults keeps seven slugs; Primary Pump Running is an activity adapter, not a notification adapter"
  - "The backup-battery fault adapter stays an open proposal because promoting it would require revising D-008 in the authoritative ADR first"

patterns-established:
  - "Gate discipline: a validation gate is recorded once in REL-07 and never repeated as a phase precondition"
  - "Open proposals live in PROJECT.md Evolution, separate from locked decision blocks"

requirements-completed: [CONF-05, CONF-06, AUTH-02, DEV-07, DEV-08, SAFE-01, SAFE-05, CTRL-02, CTRL-04, RES-01, RES-02, RES-03, REL-07, REL-08]

duration: 9min
completed: 2026-08-28
status: complete
---

# Quick Task 260828-bq0: Refine Planning Artifacts Against Ingested Intel Summary

**The roadmap no longer stalls Phases 3 through 5 behind hardware gates that cannot close on demand, and the requirement record is complete at 46 requirements with an exact phase-for-phase match between REQUIREMENTS.md and ROADMAP.md.**

## Performance

- **Duration:** 9 min
- **Tasks:** 3 of 3
- **Files modified:** 4
- **Commits:** 3

## Accomplishments

- Removed the gate preconditions that made SAFE-01, CTRL-02, CTRL-04, and four roadmap success criteria depend on hardware or real-home validation. Gates G-001 through G-004 now block only the `1.0.0` release, recorded once in REL-07 and Phase 6.
- Added the three missing v1 requirements DEV-07, DEV-08, and REL-08, taking the requirement count from 43 to 46 with a 46/46/0 coverage block.
- Added gate G-004 covering `Sump Pit Flood` Leak Sensor notification delivery in a real eligible Apple home, with no Critical Alerts guarantee claimed anywhere.
- Moved RES-01 and RES-02 from Phase 5 to Phase 3 in both REQUIREMENTS.md and ROADMAP.md, and rewrote Phase 5 around restart behavior, confirmed-offline detection, monitoring-path degradation, and recovery.
- Recorded the backup-battery fault adapter as an open proposal in PROJECT.md, with its `D-008` revision path, without touching any locked decision block.
- Refreshed STATE.md with four release gates, four pending todos, and updated Phase 3, Phase 4, and Phase 6 anchors.

## Task Commits

1. **Task 1: Rewrite REQUIREMENTS.md against the locked change list** - `d6d8a41` (docs)
2. **Task 2: Realign ROADMAP.md phases with the corrected requirement set** - `9178027` (docs)
3. **Task 3: Record the open proposal in PROJECT.md, refresh STATE.md, verify config.json** - `76b3edd` (docs)

## Files Created/Modified

- `.planning/REQUIREMENTS.md` - 46 v1 requirements, three added, nine reworded, traceability table at 46 rows with RES-01 and RES-02 moved to Phase 3
- `.planning/ROADMAP.md` - Release-only gating rule in the Overview, requirement lines realigned across Phases 2, 3, 5, and 6, four success criteria rewritten and three added
- `.planning/PROJECT.md` - G-004 and the release-only gating rule added to Context, Open Proposals subsection added to Evolution
- `.planning/STATE.md` - Blockers reframed as release gates with G-004 added, four pending todos replacing the placeholder, Phase 3, 4, and 6 anchors updated

`.planning/config.json` was verified only. Its SHA-256 is unchanged at `7ba0d0db40b0f390058fe802192595d720a200653d1c0677508d1dc0aa2ddfa4` and all seven corrected values are present.

## Verification Results

Every automated verify block was run and passed. Actual output:

**Task 1 (REQUIREMENTS.md):** traceability rows `46`; body-vs-table ID diff empty at 46 IDs; coverage block reads `v1 requirements: 46 total`, `Mapped to phases: 46`, `Unmapped: 0`; DEV-07, DEV-08, REL-08 all present; G-004 present twice; `RES-01 | Phase 3`, `RES-02 | Phase 3`, `DEV-07 | Phase 2`, `DEV-08 | Phase 2`, `REL-08 | Phase 6`; `After G-0xx` count `0`; both `Sump Pit Level` and `Sump Mains Power` present.

**Task 2 (ROADMAP.md):** roadmap pairs vs requirements pairs diff empty at 46 pairs; `After G-0xx` count `0`; four-gate list present; overview gating sentence present; 6 phase sections and 6 `**Plans**: TBD` lines.

**Task 3 (PROJECT.md, STATE.md, config.json):** locked decision block diff against `HEAD` empty with exactly 5 blocks; PROJECT.md carries G-004, Open Proposals, `WW-GEM-ALERT-3`, `D-008`, and the 2026-08-28 footer; STATE.md carries G-001 through G-004, `homebridge-lib`, `strictValidation`, `D-026`, `D-035`, `D-014`, `total_phases: 6`, the 2026-08-28 activity line, and no `None yet` placeholder; all seven config.json values present and the pinned SHA-256 matches; `git status --porcelain` for `src`, `package.json`, `config.schema.json`, `docs`, and `.planning/intel` is empty.

**Final cross-artifact check:** table IDs equal body IDs; table pairs equal roadmap pairs at 46 pairs; all four gates present in all three gate-bearing documents; `After G-0xx` count `0` in both REQUIREMENTS.md and ROADMAP.md; working tree clean.

## Decisions Made

None beyond the ten resolutions already locked in CONTEXT.md. Two presentation choices worth recording:

- Service names use backticks rather than bold, matching the existing convention in REQUIREMENTS.md (`Sump Pit Flood`, `Mains Power Lost`). The CONTEXT.md change list used bold; the file's own house style won, per the "keep the existing structure and style" constraint.
- The Phase 5 title stayed **Degraded Operation and Recovery**. The change list asked for a rewritten goal and criteria, not a rename, and the title still describes the narrowed scope. The Progress table row therefore needed no change.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] PROJECT.md G-001 bullet contradicted the new release-only gating rule**

- **Found during:** Task 3
- **Issue:** The Context bullet read "G-001 still requires ... validation before mute implementation begins." Adding the mandated bullet "G-001 through G-004 block only the `1.0.0` release. They never block phase completion." directly beneath it created a flat contradiction in adjacent lines. The old clause is also the exact gate-blocks-phase framing that Decision 1 abolishes, and CTRL-04 no longer gates on G-001.
- **Fix:** Changed "before mute implementation begins" to "before the `1.0.0` release". Five words, one clause, no other change to the bullet.
- **Files modified:** `.planning/PROJECT.md`
- **Verification:** Locked decision block tamper diff still empty; G-004 and gating checks pass.
- **Committed in:** `76b3edd`

**2. [Rule 1 - Bug] STATE.md Phase 6 anchor omitted G-004**

- **Found during:** Task 3
- **Issue:** The anchor read "`1.0.0` remains blocked by G-001, G-002, G-003, automated checks, and real-home validation." Once G-004 became a release gate, that sentence understated the release condition. The CONTEXT.md change list named the Phase 3 and Phase 4 anchors but not this one.
- **Fix:** Added G-004 to the anchor's gate list.
- **Files modified:** `.planning/STATE.md`
- **Verification:** All four gates present in STATE.md.
- **Committed in:** `76b3edd`

---

**Total deviations:** 2 auto-fixed (both Rule 1). **Impact:** Both are one-clause internal-consistency repairs to statements that the mandated edits themselves made false. No scope added, no requirement text restructured beyond the change list.

## Issues Encountered

**Stale plan preconditions, corrected by the dispatch briefing.** The plan's Task 1 precondition expects branch `features/planning-refinement` and expects `.planning/config.json` to show as modified-and-uncommitted. Neither held: execution ran in the linked worktree on branch `worktree-agent-a8c1ae320e3fc8125`, and config.json was already committed as `dcbf5f2` before dispatch. The precondition's actual intent was satisfied — nothing was committed to `main`, and config.json was verified by content and hash rather than edited.

**Task 3 verify step 5 has a stale filter.** The check
`git diff --name-only e2208f0..HEAD -- . | grep -vE '^\.planning/(REQUIREMENTS|ROADMAP)\.md$' | grep -vE '^\.planning/quick/260828-bq0-'`
expects an empty result, but `.planning/config.json` now appears in the branch diff because of the pre-dispatch commit `dcbf5f2`. Actual output of the unfiltered diff:

```
.planning/REQUIREMENTS.md
.planning/ROADMAP.md
.planning/config.json
.planning/quick/260828-bq0-refine-planning-artifacts-against-ingest/260828-bq0-CONTEXT.md
.planning/quick/260828-bq0-refine-planning-artifacts-against-ingest/260828-bq0-PLAN.md
```

The check was not weakened and no file was changed to make it pass. The single extra entry is the pre-existing commit the briefing told the executor to leave alone, and its content hash is unchanged. The check's intent — no source or out-of-scope file touched — holds, and the separate `git status --porcelain` guard over `src`, `package.json`, `config.schema.json`, `docs`, and `.planning/intel` returned empty.

**TruffleHog git-mode hook fails structurally in the worktree, as CLAUDE.md documents.** Every commit hit:

```
error preparing repo: failed to read index file: open .../worktrees/agent-a8c1ae320e3fc8125/.git/index: not a directory
```

The documented filesystem route confirmed each set of files before committing with `SKIP=trufflehog`. All three scans returned exit 0 with `verified_secrets: 0` and `unverified_secrets: 0`. No other hook was skipped and `--no-verify` was never used.

## Follow-ups for the User

These are consistency gaps that adding G-004 opened. They sit outside the locked change list, so they were **not** applied:

1. `.planning/PROJECT.md` **Success Metric** still reads "hardware and real-home gates G-001, G-002, and G-003 closed before `1.0.0` can be published." G-004 is missing.
2. `.planning/PROJECT.md` **Constraints → Release** still reads "`1.0.0` is blocked until G-001, G-002, G-003, automated tests, ...". G-004 is missing.
3. The root `CLAUDE.md` **Constraints → Release** bullet carries the same three-gate list and is also now incomplete.

**Unrelated observation, not fixed:** `pre-commit install` has never been run in this repository. `/home/acolomba/homebridge-basement-guardian/.git/hooks/` contains only `.sample` files and `core.hooksPath` is unset, so `git commit` does not trigger hooks on its own. The manual `pre-commit run --files` step that CLAUDE.md mandates is therefore the only gate in force. It was run before all three commits.

## Known Stubs

None. This task changed documentation only; no code, no placeholder values, no skipped tests.

## Threat Flags

None. No new network endpoint, auth path, file access pattern, or schema change. The T-bq0-01 information-disclosure mitigation held: only public field names, enum values, vendor rule IDs, and documented numeric bounds crossed from `.planning/intel/` into the tracked artifacts. No account identifier, `deviceId`, token, endpoint credential, or local-network value was copied.

## Self-Check: PASSED

- `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/PROJECT.md`, `.planning/STATE.md` — all present.
- Commits `d6d8a41`, `9178027`, `76b3edd` — all present in `git log`.
- Working tree clean after Task 3.
