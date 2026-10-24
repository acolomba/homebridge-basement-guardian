---
phase: 05-degraded-operation-and-recovery
plan: 10
subsystem: docs
tags: [documentation, requirements, validation, changelog, readme, phase-close-out]

requires:
  - phase: 05-degraded-operation-and-recovery
    plan: 06
    provides: "the publishing predicate that lets a family-valid value on a working transport reach the tile, which is what makes the README's `holds no value back` claim true at the accessory layer"
  - phase: 05-degraded-operation-and-recovery
    plan: 07
    provides: "the terminal branch a credential refusal reaches after a healthy start, and the shutdown push, which close RES-04's fourth clause in the forward direction"
  - phase: 05-degraded-operation-and-recovery
    plan: 08
    provides: "the arrival-driven recovery report and the parked-poll scenario, which close two of the seven false plan truths"
  - phase: 05-degraded-operation-and-recovery
    plan: 09
    provides: "the restored-control refusal, which closes RES-04's third clause in the failed-restart window the clause names"
  - phase: 05-degraded-operation-and-recovery
    plan: 11
    provides: "the silence-triggered telemetry handover, which is the second gate the README's `holds no value back` claim needed for a device whose live path had spoken"
provides:
  - "`README.md` § `When the plugin cannot vouch for a value`, agreeing with the shipped code, with the detection residual stated"
  - "`CHANGELOG.md` `[Unreleased]` entries widened to a mid-run refusal, to a press after a restart, and to prompt clearing"
  - "`.planning/REQUIREMENTS.md` RES-04 complete, with one named passing assertion recorded per clause"
  - "`05-VALIDATION.md` gap-closure rows and mutations reconciled against the six summaries"
  - "the seven-truth ledger, in this summary"
affects: [06-release-quality]

actuals:
  tokens: 6306
  tasks: 2
  commits: 2
  # `estimateTokens` scale: chars/4 over the realized diff (25 223 chars of added lines across
  # 5 files, 137 insertions), excluding this summary. The plan projected 35 000 on the read-set
  # scale every plan of this phase used. That is the same two-scale mismatch plans 05-06, 05-07
  # and 05-08 recorded; do not read it as a 5x over-estimate until both figures sit on one
  # footing. The read set here was large and the write set small, which is what a reconciliation
  # plan is.

tech-stack:
  added: []
  patterns:
    - "A requirement row moves only after each of its own clauses is matched to a named passing assertion, and the matching is written into the row"
    - "A verification map is reconciled against the summaries rather than the plans, because six times in this phase a plan's premise did not survive contact with the code"
    - "A superseded plan truth is recorded once, in the closing plan, rather than corrected in the plan that got it wrong"

key-files:
  created:
    - .planning/phases/05-degraded-operation-and-recovery/05-10-SUMMARY.md
  modified:
    - README.md
    - CHANGELOG.md
    - .planning/REQUIREMENTS.md
    - .planning/WINDOWS.md
    - .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md

key-decisions:
  - "RES-04 moved on clause-by-clause evidence, not on schedule. All four clauses matched a named passing assertion, so the row moved; had one failed to match, the row would have stayed pending and named the clause."
  - "SYNC-03 stays pending. Its row belongs to a Phase 1 block in which no requirement is marked complete, so moving one row of that block on Phase 5 evidence would misreport which phase delivered it. The 05-11 amendment changed SYNC-03's text, not its completion state."
  - "RES-01 and RES-03 already read complete and stay there. Both are now supported by stronger evidence than when they were marked, and neither needed a row move to record that."
  - "The first-round Per-Task Verification Map was not touched. This plan reconciled the gap-closure rows against their summaries and has no equivalent basis for the first round, and three of those rows are the ones the verifier found green but blind."
  - "The README's five-service list was corrected to name the two control switches as well. It sits inside the section this plan certifies, and the code withdraws seven scopes, not five."
  - "One mutation was added and recorded as NOT RUN rather than claimed. No mutation in 05-09's five reaches the binder-replacement assertion, and inventing a result would be the exact failure this round exists to close."

requirements-completed: [RES-04]

coverage:
  - id: D1
    description: "Every sentence in the changed README section and in each changed changelog entry traces to a named passing assertion or a named source location"
    requirement: RES-03
    verification:
      - kind: other
        ref: "The sentence-to-evidence table in this summary, one row per sentence"
        status: pass
    human_judgment: false
  - id: D2
    description: "RES-04's four clauses each match a named passing assertion, and the row moved only on that"
    requirement: RES-04
    verification:
      - kind: other
        ref: ".planning/REQUIREMENTS.md RES-04, which records the assertion per clause"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every gap-closure validation row was checked against the six summaries, no table was duplicated, and every row names a mutation"
    requirement: RES-03
    verification:
      - kind: other
        ref: "05-VALIDATION.md § Gap-closure round rows, reconciliation note dated 2026-09-02"
        status: pass
    human_judgment: false
  - id: D4
    description: "Apple Home draws the states this documentation describes: a marked tile keeps its value with `Status Active — No` under Details, a No Response accessory still lets an owner reach cached values, and a refused restored control does not flip"
    verification: []
    human_judgment: true
    rationale: "Three prior plans raised the same class of question and none has been answered. Nothing on the plugin side can assert what a paired iOS controller draws. This documentation now tells an owner what to expect in each state, so a negative finding is a documentation defect as well as a D-10 question."

duration: 46min
completed: 2026-09-02
status: complete
---

# Phase 5 Plan 10: Documentation, RES-04 and the Truth Ledger Summary

**The owner-facing account of degraded operation, restart and credential rejection now says what the
code does, RES-04 is complete on one named assertion per clause, and the seven plan truths the
verifier found false are recorded in one place with the plan that made each true.**

## Performance

- **Duration:** 46 min
- **Started:** 2026-09-02T15:57:00Z
- **Completed:** 2026-09-02T16:23:00Z
- **Tasks:** 2
- **Files modified:** 5

## Task Commits

1. **Task 1: Make the owner-facing prose say what the plugin does** — `25fc39d`
   (`docs: correct the degraded and refused-credential accounts`)
2. **Task 2: Restore the requirement row on evidence, and close the truth ledger** — `2c5611d`
   (`docs: close RES-04 and reconcile the phase validation map`)

Both commits were confirmed non-empty with `git show --name-only --format="" HEAD`. No `--no-verify`,
no rebase, no commit on `main`.

## Sentence-to-evidence mapping

Every sentence this plan added or changed, and what it rests on. A sentence with no trace would have
been removed rather than softened; none was.

### README, `## When the plugin cannot vouch for a value`

| Sentence | Evidence |
|---|---|
| "The plugin marks the water, pump, power, battery, and fault services inactive." (controller-link case) | `src/accessories/basementGuardian.ts:207` — `NON_CONNECTIVITY_SCOPES` is `TRUST_SCOPES` less `connectivity`, seven members; the five named here are five of them |
| "It marks both control switches inactive too." | The other two members of that set are `self-test` and `alarm-mute`; `publishRow` pushes `StatusActive` for every row including the two `Switch` rows (`src/accessories/basementGuardian.ts:586`). Unit: `test/accessories/serviceCatalogue.test.ts#publishes nothing for a scope a lost controller link poisoned` |
| "It activates `Pump Controller Link Lost` and publishes the time trustworthy controller data last arrived." | Unchanged claim, split from the sentence above. `test/accessories/serviceCatalogue.test.ts#activates one fault adapter alone for a lost controller link` |
| "…the plugin marks the water, pump, power, battery, and fault services inactive, and both control switches with them." (live-connection case) | `monitoringDegradedScopes` returns `NON_CONNECTIVITY_SCOPES` for `shadowSilent` (`src/accessories/basementGuardian.ts:306-309`). Unit: `test/accessories/basementGuardian.test.ts#RES-04 refuses a press while a monitoring outage leaves the control unvouched for, and sends nothing` |
| "The delay is to the report, never to a reading." | Replaces "never to a safety state", which the verifier read against `Status Active`. The report is the marking; the readings keep moving. Scenario `A flooded pit reaches Apple Home while the live path is silent` |
| "The plugin holds no value back while it waits, and it turns nothing normal." | Kept. False before this round, true after 05-06 and 05-11. Scenario `A pit that floods after the live path went quiet still reaches Apple Home`; unit `test/accessories/serviceCatalogue.test.ts#publishes a flooded pit whose scope the plugin can no longer watch, and stops vouching for it` |
| "It still sends the readings from each successful poll to HomeKit." | `test/runtime/accountRuntime.test.ts#D-13 reports the flood a poll found on a device whose live path went quiet` |
| "If a poll finds a flooded pit while the live connection is quiet, `Sump Pit Flood` reports it." | Scenario `A pit that floods after the live path went quiet still reaches Apple Home` — `Leak Detected` activated with `Status Active` false on both closing steps |
| "The marking is what the delay costs. Until that poll, the affected services still say the plugin vouches for them." | The residual `05-CONTEXT.md` D-05 ratified: silence is evaluated lazily on the poll tick, from arrival stamps at `onReportedPatch`. `src/runtime/monitoringHealth.ts` `isShadowSilent`; `test/runtime/monitoringHealth.test.ts` boundary cases |
| "The refusal has the same effect whenever it arrives, at the first sign-in or during a run." | Scenario `A credential refused after a healthy start makes every service unreadable`; unit `test/runtime/accountRuntime.test.ts#D-13 pushes a rejected credential and records the authentication stop for a refusal that follows a healthy start` |
| "Every service then stops answering whether the plugin vouches for it." | `src/accessories/staleMarking.ts:157-161` — `markServicesUnreadable` walks services carrying `StatusActive` and pushes a persistent failure onto that characteristic alone |
| "Apple Home shows the whole accessory as `No Response`, not the inactive state the other failures use." | `05-CONTEXT.md` D-10, which grants the `HapStatusError` exception for this cause alone; `test/platform.test.ts#leaves every restored accessory readable for a shadow silence` and its three siblings hold the "only this cause" half |
| "Each service keeps the value it last published, and a controller that reads one of those values directly still gets it." | `test/platform.test.ts#makes every restored accessory unreadable when the vendor has refused the credentials` — recorded reads are `statusActive: { threw: COMMUNICATION_FAILURE }` beside `leakDetected: { value: LEAK_DETECTED, threw: undefined }` |
| "The log names what happened." | The `AUTHENTICATION_STOPPED` line; `test/runtime/accountRuntime.test.ts#D-13 pushes a rejected credential and records the authentication stop when a credential rotation is refused` |

Two sentences in the section carry no test trace and were kept deliberately, because neither
documents a behaviour of this code. "Most Homebridge plugins substitute a safe default here, such as
a not-detected state" is a statement about other software. "`pollInterval` accepts 300 to 3600
seconds, and the default is 900" traces to `src/config.ts:24`, `POLL_INTERVAL_BOUNDS`, which was read
rather than remembered. No threshold constant was published: the prose names the state and the poll
interval, never `REST_FAILURE_THRESHOLD` or `MISSED_HEARTBEATS_BEFORE_SILENT`.

### CHANGELOG, `[Unreleased]`

| Entry | Change | Evidence |
|---|---|---|
| "…marks its services inactive when the vendor cloud stops sending live changes, and successful polls keep their readings current." | Checked rather than assumed. The review's objection was that the entry omitted that the services also stop updating; after 05-06 and 05-11 they do not, so the entry became accurate and was widened to say so | Scenario `A pit that floods after the live path went quiet still reaches Apple Home` |
| "When live changes return, the plugin marks its services active again at once rather than at its next poll." | Added. Prompt clearing is owner-visible — at a 3600-second interval the old behaviour cost an hour — and no existing entry described it | `test/runtime/accountRuntime.test.ts#RES-03 restores the trust on the message that proves the live path is carrying, with no clock movement and no poll`; scenario `A returning heartbeat clears the shadow silence before the next poll` |
| "While the plugin cannot reach the vendor cloud, including after a restart, it now refuses a press of either switch and logs the cause." | Widened to the restart window | `test/platform.test.ts#refuses a press on every restored control, so a press before the first poll is not silently accepted (RES-04, D-07)`; scenario `A press on a restored control is refused rather than silently accepted` |
| "When the vendor refuses your account email or password, at the first sign-in or during a run, Apple Home shows the accessory as `No Response`. Correct the account and restart Homebridge to clear it." | Widened to a mid-run refusal, and the `No Response` wording corrected the same way as the README | Scenario `A credential refused after a healthy start makes every service unreadable`; `test/platform.test.ts#makes every restored accessory unreadable when the vendor has refused the credentials` |

Every entry is one sentence, or two where the second tells the reader what to do, and each stays
under the changelog rule's 40-word target and 25-word sentence limit. `npm run format:check` exits 0
and names neither file.

## RES-04, clause by clause

The row moved only because all four matched. Recorded in `REQUIREMENTS.md` itself so a later audit
does not have to find this summary.

| Clause | Assertion that holds it | Plan |
|---|---|---|
| "getters return cached values without network calls" | `test/accessories/accessoryReadPathScope.test.ts#no module under src registers a HomeKit read handler in any spelling that reaches one (RES-04, D-09)` and `#no module in the accessories tier can reach the vendor (RES-04, D-09)`, non-vacuous by `#reports a planted read handler in every spelling it is meant to catch (D-09)` | 05-02 |
| "accessories remain present and visibly stale" | `features/degradedOperation.feature#A restarted plugin marks restored values stale before any poll` and `#A restart retains the values it marks stale`, with `test/accessories/staleMarking.test.ts#counts every restored service that already reports whether the plugin vouches for it` | 05-02, strengthened by 05-06's `readOutcome` |
| "commands stay disabled until fresh valid state returns" | `test/platform.test.ts#refuses a press on every restored control, so a press before the first poll is not silently accepted (RES-04, D-07)` for the failed-restart window, `test/accessories/basementGuardian.test.ts#RES-04 refuses a press while a monitoring outage leaves the control unvouched for, and sends nothing` for a live accessory, and `test/runtime/accountRuntime.test.ts#RES-04 pushes an unready command transport, and withdraws no scope, when the runtime stops` for the shutdown the tier used not to hear | 05-03, 05-06, 05-07, 05-09 |
| "only explicit credential rejection yields a persistent communication failure requiring user action" | Forward: `test/runtime/accountRuntime.test.ts#D-13 pushes a rejected credential and records the authentication stop for a refusal that follows a healthy start`. Only: `test/platform.test.ts#leaves every restored accessory readable for a shadow silence`, `for a REST degradation`, `for an unready command transport`, `for both transports lost` | 05-04, closed for the mid-run case by 05-07 |

This clause was the one the verifier called out by name: "a user who changes their vendor password
while Homebridge runs gets a generic `Device discovery failed.`". That path now halts, logs the
authentication stop and pushes the terminal trust, and the whole D-10 presentation is reachable in
the case owners actually hit.

## RES-01, RES-03 and SYNC-03, judged

**RES-01 — complete, and it stays complete.** Its Phase 5 half is the time-based one: the heartbeat
interval, the two-missed-heartbeat rule, and shadow silence as a secondary staleness signal. The
verifier confirmed the thresholds are real and boundary-correct, derived from arrival stamps at
`onReportedPatch` against the injected clock rather than from socket state or `snapshot.receivedAt`.
Its field-validity half is more true now than when the row moved, not less: 05-06 is what stopped a
communication failure from discarding a value the family had validated, which is `RES-01`'s own
"preserves the last valid value" clause.

**RES-03 — complete, and it stays complete.** The verifier recorded it PARTIAL, and was explicit that
the literal text held; what failed was the phase's delivery of the distinction to the owner (SC-2)
and the promptness of clearing (SC-4). Both are closed. A monitoring outage activates no safety
adapter (`test/accessories/serviceCatalogue.test.ts#activates no Pump Controller Link Lost contact
for a monitoring outage the last snapshot said nothing about` and its `Basement Guardian Offline`
sibling), a blind plugin vouches for no controller-link verdict
(`features/degradedOperation.feature#A blind plugin vouches for no controller-link verdict`), and the
clearing is driven from the observation rather than from a clock
(`test/runtime/accountRuntime.test.ts#RES-03 restores the trust on the message that proves the live
path is carrying, with no clock movement and no poll`). Plan 05-08 marked the row; nothing here
contradicts it.

**SYNC-03 — pending, and it stays pending. This is a deliberate judgement, not an oversight.** Plan
05-11 amended SYNC-03's text in place, and its amended clause has covering assertions:
`test/runtime/accountRuntime.test.ts#D-13 lets the live path own telemetry again on the first message
that carries an observation`, the four unedited `SYNC-03 hands telemetry back to the poll when the
connection reports <reason>` cases, and `test/device/state.test.ts#moves no value and notifies nobody
when it runs again on a later poll of the same silence`. The row still reads `Phase 1 | Pending`
because **every** Phase 1 row does — CONF-01 through CONF-05, AUTH-01, AUTH-02 and SYNC-01 through
SYNC-05 are all pending, while Phase 2 onward are all complete. That is a Phase 1 bookkeeping gap,
not a fact about SYNC-03. Closing one row of that block on evidence gathered in Phase 5 would
misreport which phase delivered it, and this plan has no basis for the clauses it did not audit — the
complete-shadow request after startup and reconnect, and the MQTT-persistence rule. Recorded as
ledger entry 12 so a Phase 1 close-out or the milestone audit picks it up.

## The seven-truth ledger

`05-VERIFICATION.md` records seven `must_haves` truths, across three plans, that the code did not do.
Those plans are the record of what was built and what was got wrong, so none was edited. Each is
recorded once here, with the wording as it stands in the plan, what was actually true, the plan that
superseded it, and the assertion that now holds it.

**All seven are closed. None stands false.**

### 1. 05-01 — "A trust withdrawal retains every published value and changes only whether the plugin vouches for it."

**What was true:** the first clause held; the second did not. A withdrawal also stopped the scope
publishing, so a family-valid value arriving on the transport that still worked was decoded,
validated, and discarded. The tile kept reading "no leak" while the plugin held "leak" (CR-01).

**Superseded by 05-06 and 05-11.** Two gates, one behind the other. 05-06 split `isRowPublishable`
from the vouching predicate at the accessory layer. 05-11 released the shadow's telemetry ownership
on silence, without which no poll could deliver anything to that layer for a device whose live path
had ever spoken.

**Assertions:** `features/degradedOperation.feature#A flooded pit reaches Apple Home while the live
path is silent`; `features/degradedOperation.feature#A pit that floods after the live path went quiet
still reaches Apple Home`; `test/accessories/serviceCatalogue.test.ts#publishes a flooded pit whose
scope the plugin can no longer watch, and stops vouching for it`;
`test/runtime/accountRuntime.test.ts#D-13 reports the flood a poll found on a device whose live path
went quiet`.

### 2. 05-01 — "Clearing is matched to cause … one good observation clears its own cause immediately rather than after a confirmation run (D-11)."

**What was true:** true for REST, false for shadow. `reportMonitoringHealth()` ran only from the two
poll recorders, so the message that proved the live path was carrying cleared nothing until the next
poll tick — up to 3600 seconds later (CR-02).

**Superseded by 05-08.**

**Assertions:** `test/runtime/accountRuntime.test.ts#RES-03 restores the trust on the message that
proves the live path is carrying, with no clock movement and no poll`;
`features/degradedOperation.feature#A returning heartbeat clears the shadow silence before the next
poll`.

### 3. 05-01 — "A heartbeat carrying values identical to the previous one clears shadow silence, because arrival is stamped at `onReportedPatch` upstream of the store's change filter."

**What was true:** the stamping was correct and genuinely upstream of the change filter. The clearing
was not driven from the arrival. The scenario proving it ran under a short poll interval, which is
what let it pass either way.

**Superseded by 05-08**, which drove the report from the arrival and added a scenario whose device
polling is parked at the vendor, so no poll tick can satisfy it. **Re-checked by 05-11**, which found
the handover had broken that scenario's premise, repaired it on the second heartbeat, and proved the
repair load-bearing with a pair: repaired it fails under a change-only report, unrepaired it passes.

**Assertions:** `test/runtime/accountRuntime.test.ts#clears the silence on a heartbeat carrying the
values the store already holds, which notifies no subscriber`; `features/degradedOperation.feature#A
returning heartbeat clears the shadow silence before the next poll`.

**One thing a later reader must not lose:** `An identical heartbeat clears the shadow silence` does
not, on its own, discriminate this. Its polls keep running, so a poll tick reports the cleared silence
inside the step deadline. The parked-poll scenario is the one carrying the property. Do not delete it
as a duplicate.

### 4. 05-03 — "The command transport is unready while the runtime is stopped, while authentication is halted, and until the first REST inventory has succeeded."

**What was true:** `commandTransportReadyNow()` answered correctly, but `stop()` pushed nothing, so
every accessory kept `commandTransportReady: true` from the last successful poll. The tier that
decides whether a press may leave the plugin never learned. A press arriving during shutdown was
accepted locally and turned into a `vendor-error` by the aborted root signal — a HomeKit failure
naming the vendor for a refusal that was entirely local (WR-07).

**Superseded by 05-07.**

**Assertion:** `test/runtime/accountRuntime.test.ts#RES-04 pushes an unready command transport, and
withdraws no scope, when the runtime stops`.

**Still open beside it:** the `!halted` term in `commandTransportReadyNow()` is redundant given
`polling`, and no test fails when it is removed. It is kept as deliberate defence and is ledger
entry 2.

### 5. 05-04 — "A vendor refusal of the account credentials makes every published service unreadable."

**What was true:** only when the refusal arrived at launch. `halted` was assigned in exactly one
place, reachable only from `launch()` and `relaunch()`, so a password changed at the vendor while
Homebridge ran produced a generic "Device discovery failed." forever and no accessory ever went
unreadable (CR-03).

**Superseded by 05-07**, which routed the two terminal auth errors out of the poll loop and the
rotation loop through one idempotent branch.

**Assertions:** `test/runtime/accountRuntime.test.ts#D-13 pushes a rejected credential and records the
authentication stop for a refusal that follows a healthy start`; `#… when a credential rotation is
refused`; `features/degradedOperation.feature#A credential refused after a healthy start makes every
service unreadable`.

**The truth's wording still overstates the mechanism, and that is what this plan corrected in the
documentation.** "Unreadable" reaches `Status Active` alone. A controller reading `Leak Detected`
directly still gets the retained value under a success status; Apple Home's accessory-wide No
Response follows from the failing characteristic in a bulk read. The reachability gap is closed. The
wording is closed in effect, not in letter, and the README no longer repeats it.

**Recorded beside it:** `test/platform.test.ts#makes an accessory a successful inventory built
unreadable in the same pass as a restored one` passed before any source change and fails no mutation,
because `applyMonitoringHealth` cannot tell a launch refusal from a mid-run one. It is ledger entry 7.
It is not coverage of CR-03; the four runtime cases are.

### 6. 05-04 — "Nothing this phase adds retries after a credential rejection … no timer, no relaunch, and no poll follows it."

**What was true:** true for a launch-time refusal. After a mid-run refusal the poll loop kept waking.
It sent no vendor traffic, because the auth client throws before any request leaves once it holds a
terminal reason, so the thirty-day block was not extended — but the runtime never stopped either.

**Superseded by 05-07**, through `waitWhileRunning`, which reads the halt flag before and after every
wait.

**Assertion:** `test/runtime/accountRuntime.test.ts#D-13 leaves the poll, the rotation and the shadow
retry chain nothing to do once a mid-run refusal has halted it`.

### 7. 05-05 — "The README states … It delays a report, never a safety state", and "a refused account credential … Every service then answers `No Response`."

**What was true:** the README stated both and the code did neither. The plugin held values back once
a scope was withdrawn, and `Status Active` was the very thing the delay applied to. The No Response
claim named a presentation the code produces only in aggregate (WR-03).

**Superseded by 05-10, this plan.** The first claim became available because 05-06 and 05-11 made the
behaviour true, and the sentence was rewritten to say "never to a reading" and to state the residual
the paragraph left out. The second was restated as what the code does.

**Assertions:** claim one — the two flood scenarios in entry 1 above; claim two —
`test/platform.test.ts#makes every restored accessory unreadable when the vendor has refused the
credentials`, whose recorded reads are `statusActive: { threw: COMMUNICATION_FAILURE }` beside
`leakDetected: { value: LEAK_DETECTED, threw: undefined }`.

**WR-03's third claim** was that the changelog's live-changes entry omitted that the marked services
also stop updating. That was checked rather than assumed: after 05-06 and 05-11 they no longer stop
updating, so the entry became accurate as written and was widened to say the readings stay current.

## Review findings carried forward as deferred

Both were recorded in `05-06-PLAN.md` under `Review findings this round does not act on` and are now
in `05-VALIDATION.md` § `Planning hazards and deferrals`, so `05-REVIEW.md` closes with a disposition
for every current finding.

**WR-05 — the nine-member `DiscoveryContext` literal is written out three times in
`src/platform.ts`.** Deferred. The drift it warns about has not happened: the reviewer read all three
copies and found them byte-identical. It wants a change that owns the composition root, which no plan
in this round took. `features/support/world.ts` already uses the shape the fix would build.

**IN-03 — shadow silence is measured against a wall clock that can jump.** Deferred. The finding
itself says "No change required for this release". A Raspberry Pi with no real-time clock can jump
hours on its first NTP sync after boot, reporting a healthy shadow as silent or suppressing a real
silence for the size of the jump. Neither is a false normal that persists, and both self-clear. It
wants a note in the intel document so a later monotonic-clock decision has the reason recorded.

## What `05-VALIDATION.md` reconciliation found

The gap-closure rows were written when the round was planned, so this was a verification pass. Each
row was checked against the six summaries for three things: does the behaviour it names match the
behaviour an executor asserted, does the automated command match the one that was run, does the named
file exist. **No table was duplicated.** The first-round table and its two `REST down + shadow alive`
rows were not touched.

**Twenty-five rows confirmed unchanged.** Four corrected:

| Row | Drift | Correction |
|---|---|---|
| 05-06, validation-failure withholding | Named one of the two withholding causes it covers. 05-06's `D2` asserts both the validation cause and the controller-link cause, and the mutations table names a mutation for each | Behaviour widened to name both halves |
| 05-09, the shared guarded walk | Claimed `npm run fallow` as evidence. 05-09 measured this three ways and disproved it: a literal third near-copy produces byte-identical gate output, and a planted pair of identical 23-line blocks is what the detector does see. The extraction removed no finding and would not have created one | Test type and command changed to the unit pair; the gate recorded as a baseline check, not evidence. The discriminating mutation is the guard widening, which fails cases in two different passes from one edit |
| 05-11, the affected scenarios | Said three scenarios; four were affected, and the membership differs from the plan's list in both directions. Also described the handover as emptying the telemetry record, when the harness's `Given these devices:` supplies the full valid Gemini body and the handover reverts to `water_level: 1`, a legal non-flood rung | Row restated: four affected, two repaired, two left honest, and the revert target named |
| 05-10, the documentation row | Task ID `T2`; the documentation work is task 1 | Corrected to `T1` |

**One row added,** for a behaviour the mutations table already named but no row carried: the
credential-rotation refusal reaching the same terminal branch, which 05-07 shipped and asserted as its
`D2`.

**Three mutations corrected** where the executor found the written form inexpressible or unreachable:
the `ensureService` mutation (which cannot be written without changing that function's signature, so
05-06 applied the equivalent on the same path), the standing-hold mutation (which needs two forms,
because the literal one fails the parked step before the closing step runs), and the
scenario-repair mutation (which refers to a line that was never added, and which 05-11 replaced with a
pair run against the defect the scenario exists to catch).

**Three mutations added** so every row names one: for the two amendment notes, for the documentation
row, and for the binder-replacement assertion. **The last is recorded as NOT RUN**, because none of
05-09's five mutations reaches it and inventing a result would be the exact failure this round exists
to close. It is ledger entry 11.

## Deviations from Plan

### 1. [Rule 2 — missing critical correctness] The README's five-service list understates what a withdrawal reaches

- **Found during:** Task 1
- **Issue:** Two sentences in the section this plan certifies say the plugin marks "the water, pump,
  power, battery, and fault services" inactive. `NON_CONNECTIVITY_SCOPES` holds seven members: those
  five plus `self-test` and `alarm-mute`. `publishRow` pushes `StatusActive` for every row, the two
  control rows included, and a press on either is refused while the scope is withdrawn. The section
  therefore under-reported what an owner loses, in the same shape as `05-REVIEW.md` WR-06's class of
  defect and as the log-line finding recorded as ledger entry 6.
- **Fix:** Both sentences now name the two control switches. The count was derived from
  `TRUST_SCOPES` in the source, not from any document.
- **Files modified:** `README.md`
- **Verification:** `src/accessories/basementGuardian.ts:181,207,306-309,586`; unit
  `test/accessories/basementGuardian.test.ts#RES-04 refuses a press while a monitoring outage leaves
  the control unvouched for, and sends nothing`
- **Committed in:** `25fc39d`

### 2. [Rule 3 — Blocking] The plan's `<interfaces>` describes a `REQUIREMENTS.md` note that is not there

- **Found during:** Task 2
- **Issue:** The plan quotes line 67 as
  `- [ ] **RES-04**: ... (returned to pending by plan 05-06)`. The working tree carries no such
  parenthetical; 05-06's `0b94b74` returned the checkbox and the table row without adding one. Acting
  on the quoted text would have meant editing a string that does not exist.
- **Fix:** The row was read from disk and edited as it stands. The line number also moved, from 67 to
  69.
- **Files modified:** none beyond the intended `.planning/REQUIREMENTS.md` edit
- **Verification:** `grep -n "RES-04" .planning/REQUIREMENTS.md` before and after
- **Committed in:** `2c5611d`

### 3. [Rule 3 — Blocking] Two gap-closure rows had no mutation, and one mutation had no row

- **Found during:** Task 2
- **Issue:** The plan's acceptance criterion requires every gap-closure row to name a mutation and
  every mutation to name a row. Cross-checking the two tables found the binder-replacement row and the
  two documentation-style rows with no mutation, and the credential-rotation mutation with no row.
- **Fix:** One row added, three mutations added. The binder-replacement mutation is marked NOT RUN
  and carried into the ledger rather than claimed.
- **Files modified:** `.planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md`,
  `.planning/WINDOWS.md`
- **Committed in:** `2c5611d`

---

**Total deviations:** 3 (1 × Rule 2, 2 × Rule 3). **Impact:** no scope creep. Deviation 1 corrects a
documentation claim inside the section this plan certifies. Deviations 2 and 3 are the plan's own
instructions meeting the working tree.

## What this plan deliberately did not do

- **It did not touch the first-round Per-Task Verification Map.** Its 22 rows still read
  `⬜ pending`. This plan reconciled the gap-closure round against six summaries and has no equivalent
  basis for the first round; three of those rows are the ones the verifier found green but blind, so
  marking them shipped would assert the opposite of what was measured. Ledger entry 13.
- **It did not set `05-VALIDATION.md`'s frontmatter.** `status: draft`, `nyquist_compliant: false`
  and `wave_0_complete: false` belong to the `/gsd-validate-phase` sign-off, not to a plan executor.
- **It did not move any Phase 1 requirement row.** Ledger entry 12.
- **It did not edit any executed plan or summary.** The prohibition holds and the file list enforces
  it: this plan touched `README.md`, `CHANGELOG.md`, `REQUIREMENTS.md`, `WINDOWS.md` and
  `05-VALIDATION.md`, and no source file, no test, and no package.
- **It did not fix the README's `## Project structure` link to `src/platformAccessory.ts`.** That is
  pre-existing, outside the section this plan owns, and is ledger entry 4. Nor did it act on the known
  pre-existing defect that the README implies `Sump Pit Level` and the pump, mains-power and
  battery-facts services draw tiles in Apple Home; they are vendor-defined and Apple Home draws no
  tile for any of them.

## Known Stubs

None. This plan changed no source file, added no test, and installed no package. `package.json` and
`package-lock.json` are untouched.

## Threat Flags

None. `T-05-39` and `T-05-40` are the two threats this plan carries `mitigate` for, and both are
mitigated as written: every documentation sentence is traced in the table above, and RES-04 moved only
after each clause matched a passing assertion, with the matching written into the row. `T-05-41` holds
— no executed plan or summary was edited. `T-05-42` and `T-05-SC` are `accept` and are unaffected: the
prose carries no account identifier, token, device identifier or log excerpt, and no package was
installed.

## Broken-windows ledger

Four entries added by this plan, all `open`:

- **11** — `test/accessories/staleMarking.test.ts`: the binder-replacement assertion carries no
  discriminating mutation. The candidate is named in `05-VALIDATION.md` and was not run.
- **12** — `.planning/REQUIREMENTS.md`: every Phase 1 requirement row still reads Pending, SYNC-03
  included. Wants a Phase 1 close-out or a milestone audit.
- **13** — `.planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md`: the 22 first-round
  rows still read pending.
- **14** — `.planning/phases/05-degraded-operation-and-recovery/05-REVIEW.md`: WR-05 and IN-03 close
  deferred, with dispositions carried into `05-VALIDATION.md`.

Entries 2, 3, 4, 6, 7, 9 and 10 remain open from earlier plans in this phase and were not acted on
here. Entries 5 and 8 are fixed; entry 1 is waived. **Eleven open, one waived, two fixed.**
`/gsd-ship` blocks while `open_count > 0`, so the phase closes with that gate visible rather than
quietly satisfied.

## Human verification still outstanding

Three plans raised the same class of question and none has been answered. They belong together in one
real-home session rather than as three separate items.

1. **A No Response accessory in a real paired home** — can an owner still reach cached values, and do
   automations built on its sensors behave predictably? `05-CONTEXT.md` D-10 mandates this by name and
   grants the `HapStatusError` exception on it. 05-07 made the presentation reachable in the common
   case, which raises how often the risk is met. A negative finding reopens D-10, not RES-04.
2. **A `-70412` write on a bridged secondary Switch** — nobody has watched a real iOS controller draw
   one, nor confirmed that an automation built on that Switch stays quiet. Raised by 05-09 as `D6`.
   It is the same open question as item 1 and should join it.
3. **A marked but still-published tile** — the value on the tile with `Status Active — No` under
   Details, and whether a leak notification fires for a `Leak Sensor` whose `Status Active` is false.
   Raised by 05-06 as `D9` and by 05-11 as `D9`. This round changed what an owner sees during an
   outage: values now move on a marked tile where they previously froze.

All three ride along with the open G-003 / G-004 session and extend `04-UAT.md` human item 1.

## Verification

| Gate | Node v26.7.0 (default) | Node v22.22.2 (`/usr/bin/node`) |
|---|---|---|
| `npm run check` | exit 0 | exit 0 |
| Unit tests | 1345 tests, 1345 pass, 0 fail | 1345 tests, 1345 pass, 0 fail |
| Cucumber | 95 scenarios, 986 steps, all pass | 95 scenarios, 986 steps, all pass |
| `npm run test:coverage:all` | exit 0, all files 100.00 / 100.00 / 100.00 | exit 0, all files 100.00 / 100.00 / 100.00 |
| `npm run format:check` | exit 0, names neither `README.md` nor `CHANGELOG.md` | — |
| `npm run fallow` | one clone group, `features/support/steps/hap.ts:113-124` / `:168-181`, pre-existing; 0 above threshold, maintainability 92.6 | — |

Node 24.x is not installed locally, so the gate ran on the two versions that are. The second version
was reached with `/usr/bin` prefixed onto `PATH`. `npm run test:coverage:all` is not in CI, so it was
run here deliberately.

The baseline is unchanged from `05-11-SUMMARY.md`: 1345 unit tests, 95 scenarios, 986 steps. This plan
changed no source and added no test, so an unchanged baseline is the expected result.

## Next Phase Readiness

Phase 5 closes with all four ROADMAP success criteria delivered and with no plan truth standing false.
RES-04 is complete on evidence, RES-01 and RES-03 stand, and the seven-truth ledger above is the one
place a reader finds what the first round got wrong and what fixed it.

Phase 6 is release packaging. Two things it should carry:

- **Eleven ledger entries are open.** With `workflow.windows_enforce` enabled, `/gsd-ship` blocks
  until each is fixed or waived with a reason. Several are recordings rather than defects and will
  waive cleanly; entries 12 and 13 want a decision rather than a fix.
- **The three human items above are one session, not three.** REL-07 blocks `1.0.0` on G-003 and
  G-004, which is the session they ride along with.

## Self-Check: PASSED

Files:

- `README.md` — FOUND
- `CHANGELOG.md` — FOUND
- `.planning/REQUIREMENTS.md` — FOUND
- `.planning/WINDOWS.md` — FOUND
- `.planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md` — FOUND
- `.planning/phases/05-degraded-operation-and-recovery/05-10-SUMMARY.md` — FOUND

Commits:

- `25fc39d` — FOUND
- `2c5611d` — FOUND

Content checks: `grep -n "RES-04" .planning/REQUIREMENTS.md` shows the checkbox at `[x]` and the
traceability row at `Complete`. `grep -c "✅ shipped"` over `05-VALIDATION.md` returns 30 — the 29
gap-closure rows plus the one added — and `grep -c "⬜ pending"` returns 23, which is the 22
first-round rows plus one prose mention of the marker in the reconciliation note. The gap-closure
table is marked and the first-round table is untouched. Each test and scenario name quoted in this
summary was located in its file before being written down.

---

*Phase: 05-degraded-operation-and-recovery*
*Completed: 2026-09-02*
