---
phase: 03-safety-monitoring-in-homekit
plan: 08
subsystem: infra
tags: [documentation, readme, changelog, fallow, dead-code, build-gate]

requires:
  - phase: 03-03
    provides: the runtime slug list in src/accessories/services.ts that src/config.ts consumes, which made that module's exemption stale
  - phase: 03-05
    provides: the fifteen published rows and their display names, which the README section names
  - phase: 03-06
    provides: the controller-link distrust and the live store subscription the README describes
provides:
  - An ignoreFindings list holding one entry instead of three, with both removals proven non-vacuous
  - The administrator-facing explanation of what the plugin publishes and what an inactive service means
  - The ignoredFaults documentation, including the refusal that stops the plugin starting
  - The estimate and provisional labelling for the battery bands and the water ladder
affects: [phase verification, the G-002 validation session, the real-home session]

actuals:
  tokens: 2802
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "An exemption removal is proven by planting a dead export and watching the gate fail, so a green run is not read as a checked module"
    - "A published number that is not a measurement is labelled in the text and shipped beside its raw vendor value"

key-files:
  created: []
  modified:
    - .fallowrc.json
    - README.md
    - CHANGELOG.md
    - src/device/health.ts

key-decisions:
  - "src/device/health.ts came out of ignoreFindings after measurement, against the plan's expectation that it would stay: production: false makes fallow count test files as consumers, so DeviceHealth's test-only consumer keeps the gate green"
  - "The src/device/events.ts entry stays although measurement shows it no longer suppresses a finding, because the plan scopes it out and its declarations still have no production consumer"
  - "Each removal was falsified with a planted dead export, because a module absent from ignoreFindings and a module with nothing to report produce the identical green"
  - "The stale README note claiming the plugin still carries the Homebridge template's starter accessories was corrected, because it contradicted the sections this plan adds"

patterns-established:
  - "Falsify an exemption removal, not just the gate: plant a dead export in the newly checked module and confirm the gate fails"
  - "Attribute a rendering claim to the controller that renders it, so the documentation never asserts Apple Home behaviour no source settles"

requirements-completed: [CONF-06, SAFE-06, SAFE-08]

coverage:
  - id: D1
    description: "src/accessories/services.ts and src/device/health.ts leave ignoreFindings, and both modules are genuinely analysed afterwards rather than passing because nothing reports on them"
    verification:
      - kind: other
        ref: "npm run fallow (three consecutive runs, exit 0) plus a planted dead export in each module failing the gate at exit 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every key of .fallowrc.json other than ignoreFindings is unchanged, so no threshold was loosened to pass the gate"
    verification:
      - kind: other
        ref: "git diff .fallowrc.json — one changed line, the ignoreFindings array"
        status: pass
    human_judgment: false
  - id: D3
    description: "The README names all seven ignoredFaults slugs, states that an unrecognised or repeated entry stops the plugin starting, and names the two services that cannot be removed"
    verification:
      - kind: other
        ref: "grep over README.md for each of the seven slugs, for 'does not start', and for 'cannot be removed'"
        status: pass
    human_judgment: false
  - id: D4
    description: "The README states that a removed sensor takes its automations, scenes, and Activity History with it, and that the condition, the owning service's status, and the log entry all remain"
    verification:
      - kind: other
        ref: "grep over README.md for 'Activity History' and the surrounding CAUTION paragraph"
        status: pass
    human_judgment: false
  - id: D5
    description: "The README states that the plugin keeps the last trusted value and marks the service inactive rather than substituting a normal reading, and says this differs from common plugin behaviour"
    verification:
      - kind: other
        ref: "grep over README.md for 'Most Homebridge plugins' and 'last value it does trust'"
        status: pass
    human_judgment: false
  - id: D6
    description: "The README labels the battery percentage an estimate from a reported protection band, and the water-level percentages and flood threshold provisional, with the raw vendor codes published beside both"
    verification:
      - kind: other
        ref: "grep over README.md for 'is an estimate' and 'are provisional'"
        status: pass
    human_judgment: false
  - id: D7
    description: "Neither file promises alert delivery, alert timing, or Critical Alerts, and neither references a planning artifact"
    verification:
      - kind: other
        ref: "grep over README.md and CHANGELOG.md for critical alert, guarantee, will notify, verified, phase, wave, milestone, plan — no match"
        status: pass
    human_judgment: false
  - id: D8
    description: "An administrator who has never read the planning documents can read the four new sections and understand what is published, what an inactive service means, what removing an adapter costs, and which numbers are estimates"
    verification: []
    human_judgment: true
    rationale: "The task carries a <human-check> asking for exactly this reading, and the plan marks all three of its prohibitions verification: judgment. Whether the ignoredFaults warning reads as a real consequence rather than a footnote, and whether nothing reads as a promise about being alerted, is a reading judgment no grep settles. A human should read README.md lines 63-121."
  - id: D9
    description: "Apple Home on current iOS shows an inactive service as a Status Active row and still fires automations built on it"
    verification: []
    human_judgment: true
    rationale: "Research assumption A1, the phase's top human-verification item. The README states this behaviour, and no source settles Apple Home's behaviour on current iOS. It rides along with the G-003 and G-004 real-home session. A2, that Apple Home does not migrate a removed service's automations, is likewise inferred on the controller side rather than observed."

duration: 38 min
completed: 2026-08-30
status: complete
---

# Phase 3 Plan 8: Exemption Retirement and the Administrator Documentation Summary

**Two of three dead-code exemptions retired and each removal proven non-vacuous by a planted dead export, plus four README sections telling an administrator what the plugin publishes, what an inactive service means, what removing a sensor costs in their home, and which published numbers are estimates rather than measurements.**

## Performance

- **Duration:** 38 min
- **Started:** 2026-08-30T20:05:00Z
- **Completed:** 2026-08-30T20:43:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `.fallowrc.json` `ignoreFindings` went from three entries to one. Both `src/accessories/services.ts` and `src/device/health.ts` came out, and both are now genuinely analysed: a planted dead export in either fails the gate at exit 1.
- Every other key of `.fallowrc.json` is byte-identical. No threshold was loosened, and no module this phase wrote produced a health or duplication finding that would have tempted one.
- `README.md` gained four sections after `Homebridge configuration`: what the plugin publishes, what happens when it cannot vouch for a value, how `ignoredFaults` behaves and what it costs, and which numbers are estimates.
- `CHANGELOG.md`'s Unreleased section gained five bullets in the existing second-person voice, three under `Added` and two under `Changed`.

## Task Commits

1. **Task 1: retire the stale dead-code exemptions** — `286a15d` (chore)
2. **Task 2: document published services and untrusted values** — `b80ca22` (docs)

Both were verified with `git show --name-only` after the commit rather than assumed from the absence of an error.

## Files Created/Modified

- `.fallowrc.json` — `ignoreFindings` reduced from three entries to `["src/device/events.ts"]`. No other key touched.
- `README.md` — the four new sections, plus a corrected status note (see Deviations).
- `CHANGELOG.md` — five Unreleased bullets.
- `src/device/health.ts` — the `@fileoverview` no longer claims an `ignoreFindings` entry the module has lost (see Deviations).

## Measurement Results

The plan asked this plan to measure rather than assume, so the measurements are recorded rather than summarised.

| Configuration | `npm run fallow` |
|---|---|
| Baseline, all three entries (as committed) | exit 0 |
| `services.ts` removed | exit 0 |
| `services.ts` and `health.ts` removed (shipped) | exit 0 |
| all three removed | exit 0 |

### `src/device/health.ts` came out, against the plan's expectation

The plan and `03-RESEARCH.md` Open Question 3 both expected this entry to stay, on the grounds that `DeviceHealth` has no production consumer. That premise is correct and was confirmed by grep: `DeviceHealth` is named only in `src/device/health.ts` itself and in `test/device/health.test.ts`. Nothing in `src/` constructs one.

It does not follow that the entry is needed. `.fallowrc.json` sets `"production": false`, so `fallow dead-code` counts a test file as a consumer. `test/device/health.test.ts` imports `DeviceHealth`, which is why the gate stays green without the exemption. The other four declarations have real production consumers, confirmed by grep: `MonitoringPath` in `src/runtime/accountRuntime.ts`, `TrustScope` in `src/device/family.ts` and `src/device/gemini.ts`, and `TrustScope`, `DistrustReason`, and `UntrustedScope` in `src/accessories/basementGuardian.ts` and `src/accessories/serviceCatalogue.ts`. The `DistrustReason` consumer arrived with the controller-link work, exactly as the plan predicted.

### The one entry that remains, and the honest reason

`.fallowrc.json` still lists `src/device/events.ts`. The plan's acceptance criterion asks this summary to name, for each remaining entry, the declaration that still has no production consumer. For this module it is **every** declaration: `DeviceEventBase`, `PrimaryPumpStarted`, `BackupPumpStarted`, `SelfTestStarted`, `BackupPumpActivationRecovered`, and `DeviceEvent`. Nothing under `src/` imports the module at all; its only importer is `test/device/events.test.ts`. Durable pump records are the work that will consume it, and they are out of this phase's scope.

**Reported plainly rather than glossed:** measurement shows this entry no longer suppresses a real finding either. With `ignoreFindings` set to `[]`, `npm run fallow` still exits 0, for the same `production: false` reason. The entry stays because the plan scopes it out and its acceptance criteria require it to still be listed, not because it is load-bearing. A later plan that gives these declarations a production consumer, or that sets `production: true`, should re-measure rather than inherit this.

## Falsification

A passing gate is not evidence that a module is checked. A module removed from `ignoreFindings` and a module with nothing to report produce the identical green, so each removal was falsified by planting a dead export and rebuilding.

| Module | Exemption state | Planted `export type FallowProbeUnusedType` | Result |
|---|---|---|---|
| `src/device/health.ts` | removed (shipped) | yes | **exit 1**, `Unused type exports (1) :56` |
| `src/accessories/services.ts` | removed (shipped) | yes | **exit 1**, `Unused type exports (1) :96` |
| `src/device/events.ts` | still listed | yes | exit 0, `✓ No issues found` |

The first two rows are the evidence that the removals mean something. The third is the control: the same probe planted in the module that keeps its entry is swallowed, which is what an exemption is supposed to do and confirms the probe itself discriminates. Every probe was reverted; `git diff --stat` afterwards showed `.fallowrc.json` alone.

## Decisions Made

- **`health.ts` was removed on measurement, not on the plan's forecast.** The plan wrote the conditional correctly and the measurement resolved it the other way. The reason is a property of the configuration (`production: false`) rather than of the code, and it is recorded above so a later reader does not conclude that `DeviceHealth` gained a production consumer. It did not.
- **`events.ts` stays despite being measurably unnecessary.** Two acceptance criteria require it, and removing it would have been an unrequested scope change to a shared file whose whole reason for single-plan ownership is that it serialises waves.
- **Claims about controller rendering are attributed to the controller.** The README says Apple Home shows the inactive state as a `Status Active` row and that Eve-class controllers show it directly. It does not assert that Apple Home will keep firing an automation on an inactive sensor, because no source settles that. Research carries it as assumption A1 for the real-home session.
- **The `ignoredFaults` refusal is documented as a cost, not a feature.** The text states that a typo leaves the pump unmonitored until it is corrected. That is the accepted risk `D-17` records, and an administrator who is not told it cannot weigh it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `src/device/health.ts` claimed an exemption it no longer carries**

- **Found during:** Task 1
- **Issue:** The module's `@fileoverview` read: "The four declarations under it still have none, which is why this module keeps its entry in the `ignoreFindings` list of `.fallowrc.json`." Both halves became false in this commit. Three of those four declarations have production consumers, and the entry was being deleted in the same change. Leaving a comment that points at a configuration entry which no longer exists is precisely the stale claim this task exists to retire, one file over.
- **Fix:** The paragraph now names `DeviceHealth` as the one declaration with no production consumer and names where the other four are consumed. It no longer mentions `.fallowrc.json`.
- **Files modified:** `src/device/health.ts` (outside the plan's `files_modified`)
- **Verification:** `npm run check` exit 0 three consecutive times; `npm run fallow` exit 0 three consecutive times.
- **Committed in:** `286a15d`

**2. [Rule 1 - Bug] The README's status note contradicted the sections this plan adds**

- **Found during:** Task 2
- **Issue:** The note under the title read: "This project currently contains the working starter accessories supplied by the official Homebridge plugin template. Basement-specific discovery, sensors, and automations still need to be implemented." Both sentences are false. `CHANGELOG.md` already records the template's example light and motion sensors as removed, and this phase publishes fifteen services. Adding a section that names all fifteen, four lines below a note saying sensors are not implemented, would have left the document contradicting itself on its own subject.
- **Fix:** The note now states that the plugin is in development and unreleased, that some published values are estimates and some are provisional until validated against real hardware, and that the sections below name each one. That is accurate and it sets up the estimates section.
- **Files modified:** `README.md` (inside `files_modified`; the note is outside the four sections the plan specified, so it is recorded here)
- **Verification:** `npm run format:check` exit 0; `mdformat` and `markdownlint-cli2` pass without rewriting.
- **Committed in:** `b80ca22`

---

**Total deviations:** 2 auto-fixed (2 bugs).
**Impact on plan:** No scope creep. Both are stale claims that this plan's own work made false or visibly contradictory. One file outside `files_modified` was touched (`src/device/health.ts`), recorded above. The plan's forbidden sections (`Requirements`, `Development`, `Project structure`, `License`) were not touched, and nothing under `docs/research/` was edited.

## Verification Status

- `npm run fallow` — exit 0 on **three consecutive runs** after the edit.
- `npm run check` — exit 0 on **three consecutive runs** (`typecheck` → `lint` → `fallow` → `format:check` → `test`).
- `npm run test:unit` — 958 tests, 958 passed, 0 failed.
- `npm run test:cucumber` — 61 scenarios, 537 steps, all passed.
- `npm run format:check` — all matched files use Prettier code style.
- `pre-commit run --files` — run before each commit and passing, including TruffleHog, `mdformat`, and `markdownlint-cli2`. No hook rewrote a file. Neither commit used `--no-verify`.
- Every acceptance criterion of task 2 was checked by grep against `README.md` and `CHANGELOG.md` rather than by rereading the draft, including the four forbidden-content criteria, which returned no match.

## Issues Encountered

**`README.md`'s `Project structure` section links to a file that does not exist.** It points at [`src/platformAccessory.ts`](./src/platformAccessory.ts); `ls src/` confirms no such file. The accessory tier now lives under `src/accessories/`. This was found while reading the file and **was not fixed**: the plan's action states explicitly that the `Project structure` section is not to be touched, and the link is a pre-existing defect this plan did not cause. It is recorded here so the next plan that may edit that section can close it, rather than left for someone to rediscover.

**No test covers the new prose.** The four README sections are checked by grep against their acceptance criteria and by the human read the task's `<human-check>` requests. Nothing in the suite fails if a later edit removes the estimate labelling. This is the ordinary condition of documentation, and it is stated here because three of this plan's prohibitions carry `verification: judgment` and none of them is machine-enforced.

## Known Stubs

None. This plan adds no code symbol and leaves no placeholder. The one deliberately retained configuration entry (`src/device/events.ts`) is measured, justified, and recorded above rather than left unexplained.

## TDD Gate Compliance

Neither task carries `tdd="true"`, and neither ships production behaviour: task 1 edits build configuration and one comment, task 2 edits two documents. No `test(...)` / `feat(...)` gate sequence applies. The evidence standard the phase holds itself to is met by the falsification table above rather than by a RED commit.

Commit types are `chore` for the configuration change and `docs` for the documentation, both matching Conventional Commits. Typing either `feat` would have announced a feature that does not exist.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

This is the last plan of the phase.

- The build gate now checks every module whose exemption this phase made stale, and the one remaining exemption is measured rather than assumed.
- The documentation obligations that `D-05`, `D-17`, and the estimate labelling created are discharged in the README.
- Two open items go to the real-home session rather than to a later plan: research assumption **A1** (whether Apple Home on current iOS still fires an automation built on a sensor whose `StatusActive` is false) and **A2** (whether a removed service's automations, scenes, and Activity History are genuinely orphaned). The README states both behaviours. A1 is the phase's top human-verification item and rides along with `G-003` and `G-004`; a positive finding there reopens `D-05` and this README section with it.
- `G-002` remains open, and the README now says so in the reader's own terms: every water-level step except the one mapping to 20 percent, and the flood threshold, are labelled provisional in the shipped documentation.
- `PROJECT.md` still lists the backup-battery fault adapter as an open proposal. The Phase 3 discussion resolved it against a sixth adapter, which is what keeps `ignoredFaults` at seven names. Removing that proposal is a phase-completion task and was not done here.

## Self-Check: PASSED

- All four modified files exist on disk and are tracked in `HEAD`.
- Both commit hashes resolve: `286a15d` and `b80ca22`. `git show --name-only` on each confirms exactly the files it claims, and neither commit deleted a tracked file.
- `git diff --stat 286a15d~1..HEAD` lists exactly those four files and no others.
- Every acceptance criterion of both tasks was re-checked against the artifact after the commits, not against the draft.
- The plan-level `<verification>` was re-run at the final tree state: `npm run fallow` and `npm run check` each exit 0 three consecutive times.

---

*Phase: 03-safety-monitoring-in-homekit*
*Completed: 2026-08-30*
