---
phase: quick-260903-ho5
plan: 01
subsystem: testing
tags: [planning-records, requirements, mutation-testing, windows-ledger]

requires:
  - phase: 01-secure-cloud-foundation
    provides: the per-row `### Requirements Coverage` verdicts that resolve the twelve Phase 1 identifiers
  - phase: 05-degraded-operation-and-recovery
    provides: the five first-round mutation tables and the eight per-plan gap-closure subsections
provides:
  - twelve Phase 1 requirement rows reconciled in both locations, each citing its per-row verdict
  - 22 first-round verification-map cells carrying a measured status
  - 24 second-round verification-map cells carrying a measured status
  - a four-string status vocabulary defined once in `05-VALIDATION.md`
  - WINDOWS ledger entries 12, 13 and 32 closed, three new entries appended
affects: [06-release-quality, milestone-audit, gsd-ship]

actuals:
  tokens: 57487
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A status cell carries its own evidence citation, so a reader does not have to find an appendix"
    - "A measured status vocabulary separates a mutation that failed nothing from a mutation that discriminated while the carrying test stayed blind"

key-files:
  created: []
  modified:
    - .planning/REQUIREMENTS.md
    - .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md
    - .planning/WINDOWS.md

key-decisions:
  - "The blind assertion in `Shadow silence withdraws trust while polling continues` belongs to first-round row 7 alone, not to rows 5 and 7 together"
  - "First-round row 17 keeps `⚠️ green, mutation failed nothing` although the third verification re-measured the same mutation as load-bearing, because a row is a claim about its own named test and its own named mutation"
  - "Second-round row 6 reads `⚠️ green, blind at this tier` because its named mutation failed only at the end-to-end tier and its own command runs the unit tier"

patterns-established:
  - "Each of the two verification-map tables is followed by a dated reconciliation note carrying the counts, the evidence route, and every row that did not reach plain shipped"

requirements-completed:
  [
    CONF-01,
    CONF-02,
    CONF-03,
    CONF-04,
    CONF-05,
    AUTH-01,
    AUTH-02,
    SYNC-01,
    SYNC-02,
    SYNC-03,
    SYNC-04,
    SYNC-05,
  ]

coverage:
  - id: D1
    description: "The twelve Phase 1 requirement identifiers read complete in the checkbox list and in the traceability table, each on its own verdict in the `### Requirements Coverage` table of 01-VERIFICATION.md"
    requirement: "CONF-01..05, AUTH-01, AUTH-02, SYNC-01..05"
    verification:
      - kind: other
        ref: "grep -cE '^\\| (CONF-0[1-5]|AUTH-0[12]|SYNC-0[1-5]) \\| Phase 1[^|]*\\| Complete \\|' .planning/REQUIREMENTS.md == 12"
        status: pass
      - kind: other
        ref: "grep -c '^- [ ] **' .planning/REQUIREMENTS.md == 9, all nine REL-"
        status: pass
    human_judgment: false
  - id: D2
    description: "All 22 first-round Per-Task Verification Map rows carry a measured status, and no row reads pending"
    verification:
      - kind: other
        ref: "task 1 region gate: rows=22 pending=0 warn=2 blind=2 planned=22"
        status: pass
    human_judgment: false
  - id: D3
    description: "All 24 second-round rows carry a measured status in the row itself, and no table row anywhere in the file reads pending"
    verification:
      - kind: other
        ref: "task 3 gate: rows=24 pending=0 warn=2 filepending=0 filetotal=132 firstround=22"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every status this task changed cites the artifact and the assertion that justifies it"
    verification: []
    human_judgment: true
    rationale: "Whether a citation actually supports the status it carries is a reading judgment. The gates count cells; they cannot read a citation against its source."
  - id: D5
    description: "WINDOWS ledger entries 12, 13 and 32 read fixed, and three new entries record the debt this task created and the facts it measured"
    verification:
      - kind: other
        ref: "gsd-tools.cjs windows status: entries 12/13/32 == fixed, total_count == 38"
        status: pass
    human_judgment: false
  - id: D6
    description: "No file under src/, test/ or features/ changed"
    verification:
      - kind: other
        ref: "git log --name-only --format='' 9324047..HEAD | grep -cE '^(src|test|features)/' == 0"
        status: pass
      - kind: other
        ref: "git status --porcelain -- src test features | wc -l == 0"
        status: pass
    human_judgment: false

duration: 14 min
completed: 2026-09-03
status: complete
---

# Quick task 260903-ho5: Reconcile the Phase 1 requirement rows and the Phase 5 validation cells

**Twelve Phase 1 requirement rows and 46 verification-map cells now carry the status their own evidence supports, with four rows deliberately not marked shipped and two planner premises corrected by measurement.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-09-03T17:15:00Z
- **Completed:** 2026-09-03T17:29:08Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Twelve Phase 1 identifiers reconciled in both locations of `REQUIREMENTS.md`, each on its own per-row verdict rather than on the phase-level 22/22 score, with the three qualifications the verification attaches recorded rather than dropped.
- 22 first-round verification-map cells reconciled through the `### Named mutations` table, the route plan 05-10 did not take.
- 24 second-round cells reconciled into the rows themselves, superseding plan 05-19's editing prohibition and saying so in the file.
- A four-string status vocabulary defined once, above the first table that uses it.
- Two planner premises measured false and reported: the blind-assertion split between rows 5 and 7, and the durability of row 17's null mutation result.

## Task Commits

1. **Task 1: close out the twelve verified requirement rows** — `0e40ff4` (docs)
2. **Task 2: reconcile the 22 first-round rows** — `2ed1c52` (docs)
3. **Task 3: move the second-round dispositions into the rows** — `d740c80` (docs)

Each commit was verified by content with `git show --name-only --format="" HEAD`. No commit was empty.

## Files Created/Modified

- `.planning/REQUIREMENTS.md` — twelve rows flipped in the checkbox list and the traceability table, SYNC-03's phase cell set to `Phase 1, Phase 5`, a dated reconciliation paragraph added under the table, and the trailing `Last updated` line refreshed.
- `.planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md` — the status vocabulary, 46 reconciled cells, the Plan column filled for all 22 first-round rows, two dated reconciliation notes, plan 05-10's closing claim put into the past tense, the second-round governing paragraph given a dated clause, and a pointer line at the head of the earlier reconciliation subsection.
- `.planning/WINDOWS.md` — entries 12, 13 and 32 marked fixed; entries 36, 37 and 38 appended.

## Status counts

### First-round Per-Task Verification Map — 22 rows

| Status string | Count | Which rows |
|---|---|---|
| `✅ shipped` | 18 | rows 1-6, 10-16, 18-22 |
| `⚠️ green, blind at this tier` | 1 | row 9 |
| `⚠️ green, mutation failed nothing` | 1 | row 17 |
| `⚠️ shipped, blind to CR-0N` | 2 | rows 7 and 8 |

Composition of the 18: eight rows from `05-01`, one from `05-02`, seven from `05-03`, two from `05-04`
and one from `05-05`. The Plan column names a summary for all 22 rows, so no row was left uncovered
and none kept `TBD`.

### Second gap-closure round — 24 rows

| Status string | Count | Which rows |
|---|---|---|
| `✅ shipped` | 22 | every row except the two below |
| `⚠️ green, blind at this tier` | 1 | the 05-14 WR-05 row |
| `⚠️ green, mutation failed nothing` | 1 | the 05-14 CR-01 admit-call row |
| `⚠️ shipped, blind to CR-0N` | 0 | none — commit `4631d46`'s audit predates this round |

The 24 split by plan: 05-13 three rows, 05-14 four, 05-15 three, 05-16 four, 05-17 three, 05-18 five,
05-19 two.

File-wide totals after all three tasks: `⬜ pending` on a table row reads 0, and the four vocabulary
strings on table rows read 132. The 132 is composed of the 86 cells the file already held, plus the
22 of the first round, plus the 24 of the second.

## Every row that did not reach plain shipped

**`⚠️ shipped, blind to CR-0N` — the mutation discriminated at the row's own tier, and the audit
separately marks the carrying test blind.**

- **First-round row 7**, `Shadow silent + REST alive sets Status Active false on Sump Pit Flood while
  its Leak Detected value is retained`. `05-01` mutation 7 failed 4 of the 5 new Cucumber scenarios,
  which is the tier this row's bare `npm run test:cucumber` runs. Commit `4631d46`'s audit marks its
  carrying scenario blind to CR-01. → `⚠️ shipped, blind to CR-01`.
- **First-round row 8**, `An identical heartbeat clears shadow silence`. `05-01` mutation 8 failed
  exactly one thing in the whole suite, this row's own scenario, 1 of 83. The audit marks that
  scenario blind to CR-02 because it runs under a short poll interval. → `⚠️ shipped, blind to CR-02`.

**`⚠️ green, blind at this tier` — the mutation fails only at a tier the row's command does not run.**

- **First-round row 9**, `A restored accessory reads Status Active false before any poll`. The row's
  literal mutation is `05-02` form 1b, deleting the `configureAccessory` call site; it left Cucumber
  green at 4 of 4 restart scenarios and failed `test/platform.test.ts` alone. Form 1a, deleting the
  marking from the pass, did fail both restart scenarios, so only the call-site half is blind. WINDOWS
  ledger 1, and `05-VERIFICATION.md` M11 re-measured it at 5 unit and 0 scenarios.
- **Second-round 05-14 WR-05 row**, `The healthy pump keeps the live readings it is still receiving`.
  Its named mutation, releasing every stored device whenever any one is silent, killed the scenario at
  `features/degradedOperation.feature:211` and no unit case. The row's own command runs the unit tier
  only. Mutation F pins the same requirement at that tier, at `test/device/state.test.ts:582` and
  `:609`. The `### Plan 05-14 rows` subsection already records this split as its honest limit.

**`⚠️ green, mutation failed nothing` — the mutation discriminated nowhere.**

- **First-round row 17**, `The command transport is unready for good once the runtime has halted`.
  `05-03` mutation 4 failed nothing: 1269 unit tests and 87 scenarios all passed
  (`05-03-SUMMARY.md:260`, WINDOWS ledger 2).
- **Second-round 05-14 CR-01 row**, `The quiet pump's tile stops saying the plugin vouches for it`.
  Mutation C, reverting the admit call, left the scenario passing unchanged, for a structural reason
  the `### Plan 05-14 mutations` subsection gives. Five shipped scenarios and one unit case pin it
  instead. WINDOWS ledger 21.

## Where the planner's derived mapping disagreed with the measurement

Both disagreements were resolved in favour of the measurement, and both are recorded in the file's own
notes rather than only here.

**1. The blind assertion belongs to first-round row 7 alone, not to rows 5 and 7.** The plan expected
about three `⚠️ shipped, blind to CR-0N` rows and named rows 5 and 7 as sharing the CR-01 finding,
while asking the executor to read the scenario and decide.

`Shadow silence withdraws trust while polling continues`, as commit `4631d46` measured it, ends in
four assertions:

1. `the "Sump Pit Flood" service reports "Status Active" as "false"`
2. `the "Sump Pit Flood" sensor is not activated`
3. `the "Basement Guardian Offline" service reports "Status Active" as "true"`
4. `the "Basement Guardian Offline" sensor is not activated`

The audit names exactly one of them as the blind one: assertion 2, `the "Sump Pit Flood" sensor is not
activated` after a dry poll, "which passes either way". That assertion is row 7's retained-value
clause. Row 5's Secure Behavior is `A monitoring-path failure never activates Basement Guardian
Offline`, and its own assertion in this scenario is number 4, which the audit does not name. CR-01 is
about a withdrawn scope withholding a flooded reading; it does not touch the Offline adapter's
activation rule, so assertion 4 could not move under it. Probe P3 in the same report measured row 5's
behaviour by execution and found it real: "both contacts stay 0 with both transports down — that part
is real". Marking row 5 blind would have stated the opposite of a measurement in the report that
supplies the blind finding.

Row 5 is therefore plain `✅ shipped`, and the first round carries two `⚠️ shipped, blind` rows rather
than three. The plan's `blind>=2` floor was set at 2 for exactly this reason and it holds.

**2. First-round row 17's null result no longer reproduces.** The plan asked the executor to check
whether any later plan or the third verification added a discriminating measurement, and said the row
keeps its status "if none did".

One did. `05-VERIFICATION.md` mutation M12 — `!halted` dropped from `commandTransportReadyNow()` — was
re-run on 2026-09-03 and fails 2 unit cases and 1 scenario. Its section 2 says so in full: "Entry 2
records that `commandTransportReadyNow()`'s `!halted` term is redundant and that no test fails when it
is removed. **That is no longer true.** ... WR-03's scope withdrawal and 05-16's cases made the term
load-bearing."

The row keeps `⚠️ green, mutation failed nothing`, because the same plan states that a row is a claim
about its own named test and its own named mutation, and forbids upgrading a status on the basis of
later coverage. The tests that now pin the term were written by later rounds. The cell says where the
behaviour is pinned today, and ledger entry 37 records that entry 2 reads `fixed` with an empty reason
while its description still asserts a fact that no longer holds.

## The audit's three labelled blind scenarios, mapped to rows

Commit `4631d46` counts six blind-but-green tests on phase-central behaviour. Three carry the literal
`BLIND to CR-01/02/03` label. They do not map onto three rows.

| Labelled scenario | Blocker | Lands on |
|---|---|---|
| `Shadow silence withdraws trust while polling continues` | CR-01 | first-round row 7 |
| `An identical heartbeat clears the shadow silence` | CR-02 | first-round row 8 |
| `Credential rejection makes every service unreadable` | CR-03 | **no row at all** |

The third lands nowhere because it is end to end, and both credential rows in the first-round table
state unit-level behaviour as their Secure Behavior. The criterion is subject matter, not command
coverage: rows 5 through 10 carry `npm run test:cucumber` bare, with no `--name` filter, so that
command does run the whole suite and does execute the scenario. No row states the behaviour it covers.
That is a hole in the map — the first round never wrote an end-to-end row for the credential refusal —
and it is recorded as a missing row rather than as a status on some other row.

Both WINDOWS ledger 13 and plan 05-10's paragraph say "three of those rows". Commit `4631d46` counts
six blind-but-green tests, three labelled. The step from three blind scenarios to three blind rows is
an inference, and no artifact states it. The note in the file gives the count from each source and
names the one that lands nowhere, without picking a source.

## The stale STATE.md lines this task creates

Prohibition 6 forbade editing `.planning/STATE.md`, because a second session may share this working
tree and STATE.md is its highest-contention file. Closing the Phase 1 block makes two of its sentences
false:

- **Line 50, Current Position:** "SYNC-03 stays pending with its reason recorded."
- **Line 291, Accumulated Context:** "[Phase 05]: SYNC-03 stays pending because its row sits in a
  Phase 1 block where no requirement is marked complete; closing one row of that block on Phase 5
  evidence would misreport which phase delivered it"

Both are now false: all twelve Phase 1 identifiers read `Complete` and SYNC-03 reads `Phase 1,
Phase 5`. **WINDOWS ledger entry 36** records both, quoted, with the reason they were not edited here.

**The incidental third finding, outside this task's scope.** Line 386, in Blockers, still carries
"A shadow that goes silent never releases the telemetry watermark (src/device/state.ts pollTelemetry),
so no REST poll refreshes telemetry for a device whose live path spoke and then stopped; releasing it
on silence changes D-15/SYNC-03 and needs a decision" as an open concern, while ledger entry 5 records
the same defect `fixed` on 2026-09-02 and SYNC-03's own amendment ratifies the fix. Entry 36 names it
as an incidental finding.

## Decisions Made

- **The blind assertion belongs to row 7 alone.** Reasoned from the four assertions in the scenario,
  the audit's named one, and CR-01's subject. Row 5 is plain shipped and the file's note says why.
- **Row 17 keeps its warning status.** A row is a claim about its own named test and its own named
  mutation. Later coverage is named in the cell without upgrading the status.
- **Second-round 05-14 WR-05 row reads `⚠️ green, blind at this tier`.** The row pairs a mutation that
  discriminates end to end with a unit-tier command. That is the definition of the string.
- **Plan 05-18's mutations B and D2, and plan 05-17's mutation B, attach to no row.** They are
  plan-level controls. The five 05-18 rows and the three 05-17 rows each name a mutation that failed
  at its own row's tier. Forcing a row to carry a control would misreport what the control measured.
- **Plan 05-16 mutation C and plan 05-15 mutation A earn no warning status.** Each failed nothing at
  its plan's task 1 and was closed by task 2, which the reconciliation table and the per-plan
  subsections both record. Neither is the named mutation of a row in the second-round table.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's expected blind-row count did not survive measurement**

- **Found during:** Task 2
- **Issue:** The plan expected roughly three `⚠️ shipped, blind to CR-0N` rows, with rows 5 and 7
  sharing the CR-01 finding, while explicitly asking the executor to read the scenario and decide.
- **Fix:** Read the scenario at commit `4631d46`. The audit names one assertion, and it is row 7's.
  Row 5 is plain `✅ shipped`. Two rows carry the blind status, not three.
- **Files modified:** `05-VALIDATION.md`
- **Verification:** Task 2 gate `blind>=2` passes at 2. The reasoning is written into the file's
  `### First-round reconciliation` note.
- **Committed in:** `2ed1c52`

**2. [Rule 1 - Bug] The plan's premise about first-round row 17 did not survive measurement**

- **Found during:** Task 2
- **Issue:** The plan said ledger entry 2 "closed the ledger item and added no discriminating
  measurement", and asked whether any later plan or the third verification added one.
- **Fix:** `05-VERIFICATION.md` M12 re-ran the same mutation on 2026-09-03 and it fails 2 unit cases
  and 1 scenario. The row keeps its status per the plan's own rule against upgrading on later
  coverage, and the cell plus a new ledger entry record the current pin.
- **Files modified:** `05-VALIDATION.md`, `.planning/WINDOWS.md`
- **Verification:** Task 2 gate `warn>=2` passes at 2. Ledger entry 37 appended.
- **Committed in:** `2ed1c52`

**3. [Rule 2 - Missing Critical] Two more ledger entries than the plan's verification predicted**

- **Found during:** Tasks 2 and 3
- **Issue:** The plan's step 3 verification predicted `open_count` at 9 — 11 measured, minus three
  closed, plus the one entry task 1 appends. Tasks 2 and 3 each authorise appending a measured fact no
  entry holds, and each turned one up.
- **Fix:** Appended entry 37 (ledger entry 2's description is stale) and entry 38 (entry 32's count of
  twenty-two against the measured twenty-four). `open_count` is therefore 11, not 9, and `total_count`
  is 38.
- **Files modified:** `.planning/WINDOWS.md`
- **Verification:** `windows status` reports entries 12, 13 and 32 all `fixed`; `total_count` 38 meets
  the plan's stated floor of 36.
- **Committed in:** `2ed1c52`, `d740c80`

---

**Total deviations:** 3 auto-fixed (2 false premises corrected by measurement, 1 required ledger
append beyond the predicted count)
**Impact on plan:** No scope creep. Both false premises are the kind the plan told the executor to
measure rather than assume, and the gates it built accommodated both outcomes.

## Issues Encountered

None. All three gates failed on the untouched tree with the numbers their `fails_when` sections state,
and each passed only after its task's work. Every baseline in the plan reproduced exactly.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `REQUIREMENTS.md` reads `Pending` on nine rows, all of them Phase 6 `REL-` identifiers. Phase 6 has
  not started.
- No table row anywhere in `05-VALIDATION.md` reads pending.
- WINDOWS `open_count` is 11 and `total_count` is 38. Entries 36, 37 and 38 are open and each names a
  record edit a later session should make: two stale SYNC-03 sentences plus a stale Blockers line in
  `.planning/STATE.md`, a stale ledger entry 2 description, and entry 32's corrected count.
- `.planning/STATE.md` was not edited, per prohibition 6. Its two SYNC-03 sentences are now false and
  a session that owns the tree should fix them.

## Self-Check: PASSED

- `.planning/REQUIREMENTS.md` — FOUND
- `.planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md` — FOUND
- `.planning/WINDOWS.md` — FOUND
- Commit `0e40ff4` — FOUND, names `.planning/REQUIREMENTS.md` and `.planning/WINDOWS.md`
- Commit `2ed1c52` — FOUND, names `05-VALIDATION.md` and `.planning/WINDOWS.md`
- Commit `d740c80` — FOUND, names `05-VALIDATION.md` and `.planning/WINDOWS.md`
- `git log --name-only --format="" 9324047..HEAD | grep -cE '^(src|test|features)/'` — 0
- `git status --porcelain -- src test features | wc -l` — 0

---
*Quick task: 260903-ho5*
*Completed: 2026-09-03*
