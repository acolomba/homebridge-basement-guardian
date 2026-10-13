---
phase: 05-degraded-operation-and-recovery
plan: 05
subsystem: testing
tags: [documentation, changelog, requirements, node-test, configuration]

requires:
  - phase: 05-degraded-operation-and-recovery
    plan: 01
    provides: "`src/runtime/monitoringHealth.ts` and its three threshold constants, the behaviour this plan keeps out of the configuration and describes to the reader"
  - phase: 05-degraded-operation-and-recovery
    plan: 02
    provides: "the restart marking pass, the shipped behaviour behind the README's restart paragraph"
  - phase: 05-degraded-operation-and-recovery
    plan: 03
    provides: "the two command-gating predicates, the shipped behaviour behind the changelog's refused-press entry"
  - phase: 05-degraded-operation-and-recovery
    plan: 04
    provides: "the credential-rejection path and its open real-home item, which D-10 records as reopening D-10 rather than RES-04"
provides:
  - "The configuration key-set assertion in `test/config.test.ts` — adding a degradation knob now fails a named case"
  - "`README.md` § `When the plugin cannot vouch for a value` — the owner-facing account of a lost monitoring path, the shadow-silence case, the poll-interval detection bound, a restart on cached state, and credential rejection"
  - "`CHANGELOG.md` `[Unreleased]` entries for the four user-visible changes this phase shipped"
  - "`.planning/REQUIREMENTS.md` rows for RES-01, RES-03 and RES-04 that agree with their own delivery-split notes"
affects: [06-release-quality]

actuals:
  tokens: 1293
  tasks: 2
  commits: 2
  # `estimateTokens` scale: chars/4 over the realized diff (5172 chars of added lines
  # across 4 files, 52 insertions). The plan's 40 000 projection was taken over the read
  # set rather than the diff. This is the fifth sample in this phase recording the same
  # mismatch (21 112, 7 688, 13 025, 10 797, 1 293 against 115 000, 85 000, 85 000,
  # 95 000, 40 000). The prior four summaries already concluded the projections measure a
  # different thing; this sample does not change that reading, but it is the most extreme
  # ratio of the five and a calibration pass should not treat it as a 31x over-estimate
  # without first putting both figures on the same footing.

tech-stack:
  added: []
  patterns:
    - "A resolved-shape key set asserted against an inline literal, so a widened shape fails a case rather than widening every fixture-derived expectation with it"
    - "User-facing prose that names what a state is about — the equipment or the plugin — rather than only what it is called"

key-files:
  created: []
  modified:
    - test/config.test.ts
    - README.md
    - CHANGELOG.md
    - .planning/REQUIREMENTS.md

key-decisions:
  - "The mutation proved more than the plan asked. Adding an eighth key made 61 of 62 cases pass, because every other expectation is built from the `acceptedConfig()` fixture and widened with it. Only the inline literal failed."
  - "The shadow-silence threshold is deliberately NOT published in the README. The reader needs the state, not the constant, and publishing `MISSED_HEARTBEATS_BEFORE_SILENT` would have put a number in the prose that neither `src/config.ts` nor `constraints.md` supplies."
  - "RES-01 and RES-03 were left `[x]` / `Complete` unchanged. The contradiction their delivery notes recorded was resolved by this phase shipping the owed halves, not by editing a row. Only RES-04 moved."
  - "RES-04 was marked complete despite one open real-home item, because `05-04-SUMMARY.md` records D-10's own ruling that a negative finding on that item reopens D-10 rather than RES-04."
  - "The credential paragraph's `30 days` comes from `src/cloud/auth.ts:35`, the plugin's own shipped log advice, which is a third source beyond the two the plan's acceptance criterion names. Recorded below rather than dropped."

patterns-established:
  - "An expectation derived from the thing under test widens silently with it; the surviving evidence is the one literal that was written out by hand"
  - "A phase's documentation names the distinction its success criterion rests on in the sentence itself, not by implication from two adjacent paragraphs"

requirements-completed: [RES-03, RES-04]

coverage:
  - id: D1
    description: "The resolved account configuration carries exactly seven keys, so no degradation threshold can become a setting without failing a named case."
    requirement: CONF-05
    verification:
      - kind: unit
        ref: "test/config.test.ts#CONF-05 resolves exactly the seven documented settings, so no degradation threshold is configurable"
        status: pass
    human_judgment: false
  - id: D2
    description: "An owner reading `README.md` can tell a lost monitoring path apart from a system the vendor reports offline and from a lost pump-controller link, and the prose never calls the first one a device fault."
    requirement: RES-03
    verification: []
    human_judgment: true
    rationale: "Whether prose makes a distinction is a judgment about reading. No test can assert it, and the plan carries this as its own `<human-check>` settling a `verification: judgment` prohibition."
  - id: D3
    description: "`README.md` states the poll-interval bound on detection: at 3600 seconds a lost live connection can go unreported for up to an hour, and the delay is to the report rather than to a safety state."
    requirement: RES-03
    verification: []
    human_judgment: true
    rationale: "Whether the paragraph reads as a stated cost with an action attached, rather than as an apology, is a judgment about reading."
  - id: D4
    description: "`README.md` states that a restart with the cloud unreachable leaves every accessory present, showing its last reading, and marked, and that a refused account credential is the one failure requiring the owner to act."
    requirement: RES-04
    verification: []
    human_judgment: true
    rationale: "The prose describes behaviour the wave 2 and wave 4 tests already prove; what needs a human is whether an owner reads the description correctly, which no test asserts."
  - id: D5
    description: "`.planning/REQUIREMENTS.md` RES-01, RES-03 and RES-04 carry a completion state that agrees with their own delivery-split notes and with what this phase shipped."
    requirement: RES-04
    verification: []
    human_judgment: true
    rationale: "Whether a requirement row should read Complete is a judgment about whether the shipped work satisfies the requirement's text. No test asserts it, and this row's whole purpose is that the previous answer was wrong."

duration: 20min
completed: 2026-09-01
status: complete
---

# Phase 5 Plan 5: Close-out Summary

**The degradation thresholds are now pinned as constants by a test that a knob would fail, the README tells an owner what the phase's three new states mean and which one needs them, and the requirements table no longer contradicts its own delivery notes.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-09-01T23:16:00-04:00
- **Completed:** 2026-09-01T23:36:00-04:00
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Adding a configuration key for any degradation threshold now fails a named case instead of passing review. The mutation was watched to fail and the failure names the offending key.
- The README's `When the plugin cannot vouch for a value` section now covers the lost monitoring path, the shadow-silence case, the REST-only case, the detection bound the poll interval imposes, a restart on cached state, and credential rejection, in prose that keeps a plugin-side failure distinct from a device-side one.
- `REQUIREMENTS.md` RES-04 moved to complete, and RES-01 and RES-03 were confirmed to have stopped contradicting themselves by delivery rather than by edit.

## Task Commits

1. **Task 1: Assert that no degradation threshold became a setting** — `bdb33d6` (test)
2. **Task 2: Document the new degradation states, and reconcile the requirements table** — `16adbe0` (docs)

## Files Created/Modified

- `test/config.test.ts` — adds `RESOLVED_CONFIG_KEYS` and the case asserting the accepted configuration's sorted key set against it.
- `README.md` — eight new paragraphs in `When the plugin cannot vouch for a value`.
- `CHANGELOG.md` — four entries under the existing `### Changed` subsection.
- `.planning/REQUIREMENTS.md` — RES-04's checkbox and traceability row.

## The mutation, and what it proved

`05-VALIDATION.md` names the mutation for this behaviour as **"Add a knob."** It was applied as a real
knob would arrive: `restFailureThreshold: number` added to `BgConfig`, resolved in `validateConfig`,
and added to the `acceptedConfig()` fixture — which is what a developer adding the setting would
actually write, because omitting the fixture line is a compile error rather than a test failure.

**Result: 62 tests, 61 pass, 1 fail.** Every other case in the file compares against `acceptedConfig()`
and therefore widened with the new key in silence. The only case that failed is the new one:

```text
✖ CONF-05 resolves exactly the seven documented settings, so no degradation threshold is configurable
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

    [
      'clientId',
      'email',
      'ignoredFaults',
      'name',
  ...
      'pollIntervalSeconds',
  +   'restFailureThreshold'
    ]
```

The mutation was reverted, `grep -rn restFailureThreshold src test` returns nothing, and the focused
pair is back at 62/62 with `config.js` at 100% lines, branches and functions.

This is a stronger result than the plan predicted, and it is worth naming. The plan's reason for
demanding an inline literal was that "an expectation derived from the thing under test cannot fail
when the thing under test changes." The 61-to-1 split is that claim measured: the file's own fixture
is derived from `BgConfig`, so the entire pre-existing suite was blind to a new setting. The one
hand-written array is the whole of the evidence.

## Where every number in the new README prose came from

| Number in the prose | Source |
|---|---|
| `7 to 15 seconds` (a pump run) | `.planning/intel/constraints.md:454` — "Both pumps are read-only booleans that are true for 7-15 seconds at a time." Already used at README `## What the activation record counts`. |
| `898 seconds` (the heartbeat) | `.planning/intel/constraints.md:525` — "The device heartbeats about every 898 seconds." |
| `300 to 3600 seconds`, default `900` (`pollInterval`) | `src/config.ts:24` — `POLL_INTERVAL_BOUNDS` `minimum: 300, maximum: 3600, documentedDefault: 900`. |
| `up to an hour` | Arithmetic on the 3600-second maximum above, stated as such. |
| `30 days` (the vendor block) | `src/cloud/auth.ts:35` — the shipped log advice: "If the account is genuinely blocked, the block lifts only 30 days after the last attempt, so every retry postpones it." Also `PROJECT.md` D-13. |

**One of these is outside what the plan's acceptance criterion allows, and it is recorded rather than
hidden.** The criterion reads "Every number in the new prose appears in either `src/config.ts` or
`.planning/intel/constraints.md`." The 30-day figure appears in neither; it lives in `src/cloud/auth.ts`.
It was kept because the binding behaviour line is "No number in the new prose is invented", because
this is the exact figure the plugin already prints in the user's log when the refusal happens, and
because a user deciding whether to retry a refused credential is the one reader who most needs it —
a retry postpones their own recovery. Dropping the number to satisfy the narrower file list would
have made the README less useful and no more truthful.

**One number was deliberately left out.** The shadow-silence threshold
(`MISSED_HEARTBEATS_BEFORE_SILENT = 2`, so silence is 1796 seconds of quiet) is not published.
It appears in `src/runtime/monitoringHealth.ts` and in `REQUIREMENTS.md` RES-01 but in neither file the
criterion names, and a reader needs the state rather than the constant. The prose says instead that a
short quiet gap is normal, and gives the 898-second heartbeat that makes that true.

## The requirements reconciliation, row by row

`05-CONTEXT.md` rules that the rows reconcile at phase close-out. Here is each one, its own delivery
note, and what was done.

**RES-01 — left `[x]` / `Complete`, unchanged.** Its note reads: "Phase 3 delivers the field-validity
half. Phase 5 delivers the time-based half — the heartbeat interval, the two-missed-heartbeat rule,
and shadow silence as a secondary signal." Plan 05-01 shipped exactly those three as
`HEARTBEAT_INTERVAL_MS`, `MISSED_HEARTBEATS_BEFORE_SILENT` and `isShadowSilent` in
`src/runtime/monitoringHealth.ts`, with `test/runtime/monitoringHealth.test.ts` covering the threshold
and clearing rules. The row was premature when Phase 3 wrote it and is true now. **The contradiction
was resolved by delivery, not by an edit** — changing the row would have been the wrong correction.

**RES-03 — left `[x]` / `Complete`, unchanged.** Its note reads: "Phase 5 delivers the remaining
sentence — separating a lost monitoring path from a confirmed-offline device without a false
physical-device alert." Plan 05-01 shipped it, with
`features/degradedOperation.feature#Shadow silence withdraws trust while polling continues` and its
siblings asserting that a monitoring-path failure never activates `Basement Guardian Offline`. Same
reading as RES-01: premature then, true now, no edit warranted.

**RES-04 — moved `[ ]` → `[x]`, and `Pending` → `Complete`.** It carries no delivery-split note; it
was assigned wholly to this phase, and waves 2, 3 and 4 each deliberately left it pending because each
owed part of it. All four of its clauses have now shipped:

| Clause | Delivered by |
|---|---|
| getters return cached values without network calls | 05-03 — `test/accessories/accessoryReadPathScope.test.ts`, the static gate proven non-vacuous against a planted violation |
| accessories remain present and visibly stale | 05-02 — `src/accessories/staleMarking.ts` and the restart scenarios |
| commands stay disabled until fresh valid state returns | 05-03 — the two refusal predicates, each naming which one blocked |
| only explicit credential rejection yields a persistent communication failure requiring user action | 05-04 — `publishPersistentFailure`, and the case proving credential rejection is the *only* cause that does it |

One real-home item remains open, and it does not block this row. `05-04-SUMMARY.md` records D-10's own
ruling: "a negative finding on any of the three reopens `D-10`, not `RES-04`." The item joins the
phase's verification session beside the open `G-003` / `G-004` checks.

No other requirement was edited, and no requirement's text was rewritten.

## Human Verification Outstanding

The plan carries a `<human-check>` that settles its one `verification: judgment` prohibition. Auto mode
is off (`workflow._auto_chain_active` and `workflow.auto_advance` both `false`) and
`workflow.human_verify_mode` is `end-of-phase`, so it is recorded here for that session rather than
raised as a checkpoint.

**Read the new `README.md` paragraphs as an owner who has never seen this plugin's internals, then look
at the three states side by side: a lost monitoring path, `Basement Guardian Offline`, and
`Pump Controller Link Lost`. Report whether they read as three different things, whether it is clear
which is about the pump system and which is about the plugin's ability to watch it, and whether the
latency paragraph reads as a stated cost with an action attached rather than as an excuse.**

My own reading, offered as the author's and therefore not a substitute for the check: the distinction
is carried by one explicit sentence pair — "Those two report something the system says about itself
[...] A lost monitoring path reports something about the plugin" — rather than left to be inferred
from adjacent paragraphs, and the latency paragraph closes on "A late report is the only cost" after
naming the action ("A lower poll interval shortens that delay"). The prose nowhere calls a
monitoring-path failure a device fault or an offline device. An author is the worst judge of whether
his own distinction lands, which is why the item stands.

This joins the item wave 4 raised (whether Apple Home leaves a `No Response` accessory's cached values
reachable and its automations alive) and the open `G-003` / `G-004` real-home checks.

## Decisions Made

Recorded in `key-decisions` above. The two worth restating:

- **The 61-to-1 mutation split was not predicted and changes how the file should be read.** Any future
  case added to `test/config.test.ts` that compares against `acceptedConfig()` inherits that blindness.
  The inline literal is load-bearing and must not be refactored into something derived.
- **A row that is wrong and a row that is premature need different corrections.** RES-01 and RES-03
  were premature, so delivery fixed them. Editing them at close-out would have recorded a correction
  that never happened.

## Deviations from Plan

### 1. [Rule 2 — missing critical information] The `30 days` figure kept against a narrower acceptance criterion

- **Found during:** Task 2
- **Issue:** The plan's acceptance criterion restricts every number in the new prose to `src/config.ts`
  or `.planning/intel/constraints.md`. The brute-force block figure a user needs before deciding to
  retry a refused credential lives in neither.
- **Fix:** Kept the number, sourced it precisely to `src/cloud/auth.ts:35` (the plugin's own shipped
  log advice) and `PROJECT.md` D-13, and recorded the departure here rather than silently satisfying
  the file list by deleting a fact the reader needs.
- **Files modified:** `README.md`
- **Verification:** The figure was read from the source, not from memory; it matches the log line the
  user will have already seen.
- **Committed in:** `16adbe0`

### 2. [Rule 2 — missing critical functionality] A fifth README paragraph covering the REST-only case

- **Found during:** Task 2
- **Issue:** The plan's behaviour list names four states. Written to that list alone, the README would
  describe a general "lose one of two ways of watching" rule and then only ever illustrate the shadow
  half, leaving a reader who sees `Basement Guardian Offline` go inactive on its own with no
  explanation for it. That is the shape of a false understanding rather than a false normal, but it is
  the same class of gap.
- **Fix:** Added one two-sentence paragraph stating that a polling failure with the live connection
  alive marks `Basement Guardian Offline` and nothing else, and why. This is D-02 as plan 05-01
  implemented it after the checkpoint answered `d-02`.
- **Files modified:** `README.md`
- **Verification:** Checked against `05-01-SUMMARY.md` coverage entry D2 and against
  `features/degradedOperation.feature#Polling failure alone leaves the live values trustworthy`, so
  the documented behaviour is what shipped rather than what was planned.
- **Committed in:** `16adbe0`

### 3. [Rule 2 — missing critical information] A fourth CHANGELOG entry for the command gating

- **Found during:** Task 2
- **Issue:** The plan named the README's four states but did not enumerate the changelog entries. Plan
  05-03 shipped a user-visible change the four README states do not cover: a press of either switch is
  now refused when the plugin has no way to reach the vendor cloud.
- **Fix:** Added a fourth entry under the existing `### Changed` subsection.
- **Files modified:** `CHANGELOG.md`
- **Verification:** `05-03-SUMMARY.md` coverage entry D2, backed by
  `features/officialControls.feature#A press with no command transport is refused locally`.
- **Committed in:** `16adbe0`

---

**Total deviations:** 3, all Rule 2 (missing critical functionality or information).
**Impact on plan:** No scope creep. Two paragraphs and one changelog bullet, all describing behaviour
this phase already shipped and already tested. One departure from an acceptance criterion, recorded
above with its reasoning rather than absorbed.

## Pre-existing defects found and deliberately left alone

**1. `README.md` `## Project structure` links a file that does not exist.** The section lists
`[src/platformAccessory.ts](./src/platformAccessory.ts)` as the module that "handles accessory
services and characteristics." No such file exists in this repository; the accessory lives under
`src/accessories/`. The link is inherited from the Homebridge plugin template. It is unrelated to
this phase and belongs in its own change. **Not fixed, as the plan directs.**

**2. `README.md` `## What the Home app draws a tile for` is accurate but its neighbour implies
otherwise.** The tile section itself is correct. `## What the plugin publishes`, which precedes it,
lists `Sump Pit Level` and the pump, mains-power and battery-facts services in a way a reader can take
as a list of things they will see in Apple Home. The tile section then corrects that impression two
paragraphs later. This is a pre-existing documentation weakness the executing brief named explicitly
as not this plan's to fix. **Not fixed.**

Neither was touched, and no line outside the four intended edits was changed.

## Issues Encountered

None. Both tasks ran to their verification commands on the first attempt, and no auto-fix was needed
in either.

## Verification

Both gates were run on both Node versions, because `npm run test:coverage:all` is not in CI and the
local Node is v26.7.0 while CI targets 22.x and 24.x.

| Gate | Node v26.7.0 | Node v22.22.2 |
|---|---|---|
| `npm run check` (typecheck, lint, fallow, format:check, unit, Cucumber) | pass | — |
| Unit suite | 1295 tests, 1295 pass, 0 fail | 1295 tests, 1295 pass, 0 fail |
| Cucumber | 89 scenarios, 894 steps, all passed | 89 scenarios, 894 steps, all passed |
| `npm run format:check` | pass | — |
| `npm run test:coverage:direct` on the `config` pair | 62/62, 100 / 100 / 100 | — |

Baseline inherited was 1294 unit tests; this plan adds one. The `fallow` clone-group finding on
`features/support/steps/hap.ts` is pre-existing and was left alone.

Both commits were verified non-empty with `git show --name-only --format="" HEAD`. `pre-commit run
--files <changed paths>` was run clean before each `git add`, and every commit ran the hooks. No
`--no-verify`, no rebase, no commit to `main`.

## User Setup Required

None — no external service configuration.

## Next Phase Readiness

The phase's five plans are complete and every requirement it owns reads Complete. Three things a later
change must not undo:

- **`RESOLVED_CONFIG_KEYS` in `test/config.test.ts` stays an inline literal.** Deriving it from
  `BgConfig`, from `acceptedConfig()`, or from the result would restore the blindness the mutation
  measured, and the case would keep passing while doing nothing.
- **The README's distinction sentence stays explicit.** "Those two report something the system says
  about itself [...] A lost monitoring path reports something about the plugin" is the whole of
  success criterion 2 in the user-facing text. Compressing it back into an implication reopens the
  prohibition.
- **RES-04's open real-home item reopens D-10, not RES-04.** A negative finding on the `No Response`
  rendering is a reason to revisit whether `HapStatusError` was the right amendment, not a reason to
  unmark the requirement.

Phase 6 (release quality, privacy, and distribution) owns REL-01 through REL-09, all still pending.
`REL-08` will revisit this README; the `src/platformAccessory.ts` link recorded above is the natural
thing to fix there.

## Self-Check: PASSED

All four modified files exist. Both task commits (`bdb33d6`, `16adbe0`) are in the branch history.
Both `must_haves.artifacts` `contains` strings are present: `offlineConfirmationPollCount` in
`test/config.test.ts`, `monitoring path` in `README.md`. The `key_links` pattern `3600|poll interval`
resolves in `README.md` against the same range `src/config.ts` enforces.

---
*Phase: 05-degraded-operation-and-recovery*
*Completed: 2026-09-01*
