---
phase: 05-degraded-operation-and-recovery
plan: 19
subsystem: testing
tags: [documentation, readme, changelog, requirements, validation, gap-closure]

requires:
  - phase: 05-degraded-operation-and-recovery
    provides: "the six shipped plans of the second gap-closure round, 05-13 to 05-18, whose summaries are the source of truth for what the corrected prose must describe"
  - phase: 05-degraded-operation-and-recovery
    provides: "05-18's renamed marking pass, which is what README:151 now says"
provides:
  - "A README that says a poll does not replace a reading the live path still owns, and when it starts to"
  - "A README that says the trust report on every service carrying one stops answering, rather than that every service does"
  - "A changelog entry carrying the same correction"
  - "RES-03's Phase 5 half settled, and RES-04 re-cited clause by clause with a discriminating mutation named for each"
  - "The round's documentation rows, its reconciliation, its second structural lesson, and a sign-off filled in against measurements"
  - "Closure of 05-REVIEW-2.md CR-04 and the documentation half of WR-08"
affects: [phase close-out, re-verification, milestone audit]

actuals:
  tokens: 9700
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A documentation row names the code assertion its sentence depends on and says it is a trace rather than a test, because prose has no mutation of its own"
    - "A requirement clause is cited on an assertion paired with the mutation that fails it, never on one that only proves an act happened"
    - "An unchecked sign-off box with its reason beside it is worth more than a checked one with nothing behind it"

key-files:
  created:
    - .planning/phases/05-degraded-operation-and-recovery/05-19-SUMMARY.md
  modified:
    - README.md
    - CHANGELOG.md
    - .planning/REQUIREMENTS.md
    - .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md
    - .planning/WINDOWS.md

key-decisions:
  - "Deleted the sentence CR-04 names rather than softening it. 'The plugin holds no value back while it waits' has no assertion behind it and the code asserts the opposite for the window the paragraph is about"
  - "Said the marking stays account-wide in the README, because after plan 05-14 the handover is per system and the marking is not, and the less flattering half is the one an owner needs"
  - "Judged plan 05-18's zero-count line an operator's line and kept it out of the README's owner-facing section"
  - "Left every existing 05-VALIDATION.md table untouched and appended the round's reconciliation instead, because the plan's prohibition and the table's own governing sentence cannot both be honoured by editing the Status column"

patterns-established:
  - "Every kept sentence in a corrected section is listed beside the named passing assertion that fails if it becomes untrue, and every deleted sentence beside the reason"

requirements-completed: [RES-03, RES-04]

coverage:
  - id: D1
    description: "The README says a poll does not replace a reading the live path still owns, and says when polling takes the readings back"
    requirement: RES-03
    verification:
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#D-13 keeps a pump run the live path reported when a poll arrives inside the two-heartbeat window"
        status: pass
      - kind: e2e
        ref: "features/degradedOperation.feature#A pit that floods after the live path went quiet still reaches Apple Home"
        status: pass
      - kind: e2e
        ref: "features/degradedOperation.feature#A poll finds a flood on the pump that went quiet while its neighbour keeps reporting"
        status: pass
      - kind: unit
        ref: "test/runtime/monitoringHealth.test.ts#stops vouching for the account while one pump is quiet and vouches again once it speaks"
        status: pass
    human_judgment: true
    rationale: "The named cases pass and pin the behaviour, but nothing asserts that the paragraph describes them. Whether the prose reads truly to an owner is exactly the judgment CR-04 was raised about, and the mapping from sentence to case is the trace below rather than a test."
  - id: D2
    description: "The README says the trust report on every service that carries one stops answering under a refused credential, which is what the pass does"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/staleMarking.test.ts#counts every service that reports whether the plugin vouches for it, and leaves one that never did alone"
        status: pass
      - kind: unit
        ref: "test/accessories/staleMarking.test.ts#retains every other reading on a service it marks, so the tile keeps its last values"
        status: pass
    human_judgment: true
    rationale: "Same shape as D1. The pass's reach is pinned by mutation G; that the sentence describes it is a reading judgment."
  - id: D3
    description: "The unreleased changelog entry carries the same correction in the register the surrounding entries use"
    requirement: RES-03
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#A pit that floods after the live path went quiet still reaches Apple Home"
        status: pass
    human_judgment: true
    rationale: "One scenario carries both halves of the entry, but no test asserts that the entry describes it."
  - id: D4
    description: "RES-03's Phase 5 half is settled and RES-04 is re-cited clause by clause, each citation paired with the mutation that fails it"
    requirement: RES-04
    verification:
      - kind: other
        ref: 'grep -c "05-19" .planning/REQUIREMENTS.md'
        status: pass
    human_judgment: true
    rationale: "The grep proves attribution and passes identically whichever branch was taken. Whether each cited assertion has a genuinely discriminating mutation is a reading of 05-VALIDATION.md, recorded below clause by clause."
  - id: D5
    description: "05-VALIDATION.md carries the round's documentation rows, its reconciliation, its second structural lesson and a sign-off filled in against measurements"
    requirement: RES-03
    verification:
      - kind: other
        ref: 'grep -c "05-19" .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md answers 22 against a measured baseline of 5 and a floor of 9'
        status: pass
    human_judgment: true
    rationale: "A count cannot tell a well-formed documentation trace from a badly-formed one. What discriminates is the sentence-by-sentence trace below and the rule that a prose row names the code assertion its sentence depends on."
  - id: D6
    description: "This plan changed no file under src/, test/ or features/"
    verification:
      - kind: other
        ref: "git diff --stat ad74303..HEAD -- src test features"
        status: pass
    human_judgment: false

duration: 46 min
completed: 2026-09-03
status: complete
---

# Phase 5 Plan 19: The README Says What the Plugin Does Summary

**The README no longer promises an owner that a poll's readings reach HomeKit while the live connection is quiet: it says the live path keeps the readings until it has missed two heartbeats, that the handover is per system while the marking is not, and that a refused credential silences the trust report on every service carrying one rather than every service.**

## Performance

- **Duration:** 46 min
- **Tasks:** 2
- **Files modified:** 5 (2 published, 3 planning). **No file under `src/`, `test/` or `features/`.**

## No code changed

```
$ git diff --stat ad74303..HEAD -- src test features
(no output)
```

Stated explicitly because it is this plan's central prohibition: rewriting prose to match a defect is how CR-04 happened, so a correction that revealed the code was wrong would have been stopped and planned rather than written around. Nothing did.

## Task Commits

1. **Task 1: the README and the changelog say what the plugin does** - `d176107` (docs)
2. **Task 2: the round's records closed against what was run** - `18cf414` (docs)
3. **Task 1 follow-on: the changelog entry split to the sentence-length limit** - `04249dd` (docs)

Each verified by content with `git show --name-only --format="" HEAD` immediately after committing, never by a reported hash. No commit deleted a tracked file. `gsd-tools query commit` was not used.

The third commit is a correction of my own: the first draft of the changelog entry ran to 27 words in one sentence, over ASD-STE100's 25-word descriptive limit. It is two sentences of 16 and 12 now. Committed separately rather than amended, because this repository does not rewrite history.

---

## The sentence-by-sentence trace

This is the deliverable. Every sentence that stays is named beside the assertion that fails if it becomes untrue; every sentence deleted is named beside its reason.

### README:145 — the shadow-silence paragraph

**Before, verbatim:**

> The delay is to the report, never to a reading. The plugin holds no value back while it waits, and it turns nothing normal. It still sends the readings from each successful poll to HomeKit. If a poll finds a flooded pit while the live connection is quiet, `Sump Pit Flood` reports it. The marking is what the delay costs. Until that poll, the affected services still say the plugin vouches for them.

**After, verbatim:**

> The delay is to the report and to the reading. While the live connection still owns the readings, a poll does not replace them. The tile shows the last reading that connection sent, and the affected services still say the plugin vouches for them. Two missed heartbeats end the ownership, and polling takes the readings back. From then on each successful poll updates the tile. If a poll finds a flooded pit, `Sump Pit Flood` reports it, and the trust row alone carries the doubt. The plugin ends the ownership one system at a time, so a quiet system does not take another system's readings away. The marking stays account-wide. While any system is quiet, the plugin stops vouching for every system on the account.

| # | Sentence | Assertion that fails if it becomes untrue |
|---|---|---|
| 1 | "The delay is to the report and to the reading." | The topic sentence for 2 to 5. Its reading half is `test/runtime/accountRuntime.test.ts` — `D-13 keeps a pump run the live path reported when a poll arrives inside the two-heartbeat window`; its report half is `features/degradedOperation.feature` — `A flooded pit reaches Apple Home while the live path is silent`, which reads `Status Active` `true` before the clock crosses two heartbeats and `false` after |
| 2 | "While the live connection still owns the readings, a poll does not replace them." | `test/runtime/accountRuntime.test.ts` — `D-13 keeps a pump run the live path reported when a poll arrives inside the two-heartbeat window`. A live message reports `primary_pump_running: true`, a poll reports `false`, and the snapshot still reads `true` |
| 3 | "The tile shows the last reading that connection sent, and the affected services still say the plugin vouches for them." | First half: the same D-13 case. Second half: `features/degradedOperation.feature` — `A flooded pit reaches Apple Home while the live path is silent`, plus `test/runtime/monitoringHealth.test.ts` — `vouches for a shadow over a device it has only just admitted` |
| 4 | "Two missed heartbeats end the ownership, and polling takes the readings back." | `features/degradedOperation.feature` — `A pit that floods after the live path went quiet still reaches Apple Home`: the clock moves 1796 seconds, and the poll's `water_level 31` then reaches the canonical snapshot. Also `test/runtime/accountRuntime.test.ts` — `D-13 hands only the quiet pump back to the poll and leaves its neighbour owning its telemetry` |
| 5 | "From then on each successful poll updates the tile." | The same scenario's `Then the canonical snapshot carries these fields: \| water_level \| 31 \|` |
| 6 | "If a poll finds a flooded pit, `Sump Pit Flood` reports it, and the trust row alone carries the doubt." | The same scenario's `Then the "Sump Pit Flood" sensor is activated` followed by `Then the "Sump Pit Flood" service reports "Status Active" as "false"` |
| 7 | "The plugin ends the ownership one system at a time, so a quiet system does not take another system's readings away." | `features/degradedOperation.feature` — `A poll finds a flood on the pump that went quiet while its neighbour keeps reporting`; `test/runtime/accountRuntime.test.ts` — `D-13 hands only the quiet pump back to the poll and leaves its neighbour owning its telemetry`; `test/device/state.test.ts` — `leaves the pump beside it owning its own telemetry` |
| 8 | "The marking stays account-wide." | `test/runtime/monitoringHealth.test.ts` — `stops vouching for the account while one pump is quiet and vouches again once it speaks` |
| 9 | "While any system is quiet, the plugin stops vouching for every system on the account." | The same case |

**Deleted, with reasons:**

| Deleted sentence | Reason |
|---|---|
| "The delay is to the report, never to a reading." | False. `pollTelemetry` returns `previous.data` whenever `shadowVersion` is set, so the delay is to the reading as well, and a named unit case pins it |
| "The plugin holds no value back while it waits, and it turns nothing normal." | The first clause is the sentence CR-04 is about and has no assertion behind it: the plugin holds every poll's reading back for the whole window. The second clause is true but already said in the same section's opening paragraph, and repeating a rule is how two statements of it drift apart |
| "It still sends the readings from each successful poll to HomeKit." | False for the window the paragraph is about |
| "If a poll finds a flooded pit while the live connection is quiet, `Sump Pit Flood` reports it." | False as written, because "while the live connection is quiet" spans the whole window. The claim survives with its condition corrected and is sentence 6 above |
| "The marking is what the delay costs." | False. The reading is delayed too, so the marking is not what the delay costs |
| "Until that poll, the affected services still say the plugin vouches for them." | Kept in substance, folded into sentence 3 so that the tile and the trust row are described under one condition rather than in two places |

**Longest sentence:** *"The plugin ends the ownership one system at a time, so a quiet system does not take another system's readings away."* — **21 words**, inside ASD-STE100's 25-word descriptive limit.

### README:151 — the credential-refusal paragraph

Only the first sentence changed, as the plan directed. Every other sentence is traced because the acceptance criterion asks for every kept sentence in the corrected paragraphs.

| # | Sentence | Assertion, or the reason there is none |
|---|---|---|
| 1 | **Changed.** "Every service that reports whether the plugin vouches for it then stops answering." (was "Every service then stops answering whether the plugin vouches for it.") | `test/accessories/staleMarking.test.ts` — `counts every service that reports whether the plugin vouches for it, and leaves one that never did alone`. Plan 05-18 pinned it with mutation G: dropping the `testCharacteristic` guard fails it with `marked: 4` against `2` and fails 11 of the module's 18 cases |
| 2 | "Apple Home shows the whole accessory as `No Response`, not the inactive state the other failures use." | **Split trace, stated honestly.** The plugin-side half — that a marked service refuses a read instead of answering an inactive value — is `test/accessories/staleMarking.test.ts` — `makes a read of every marked service throw the status it was given, and leaves the value it held`, and `test/platform.test.ts` — `leaves the pushed status standing over an accessory that republishes its own rows`, which reads `threw: -70402`. **What Apple Home draws over that is not assertable from this repository at all**, and it is registered as a manual-only verification riding on the open `G-003` / `G-004` session. This is a claim about Apple's software, not about the plugin, so no test could ever exist for it; that is different from an untraced claim and it was not deleted on that basis |
| 3 | "Each service keeps the value it last published, and a controller that reads one of those values directly still gets it." | `test/accessories/staleMarking.test.ts` — `makes a read of every marked service throw the status it was given, and leaves the value it held` for the first half, and `retains every other reading on a service it marks, so the tile keeps its last values` for the second. Sentence 1 and this sentence now agree, which is the second half of WR-08 |
| 4 | "This state does not clear itself." | `features/degradedOperation.feature` — `A credential refused mid-run stays refused when the next heartbeat lands` and `A press after a refused credential leaves both controls still refusing reads`; `test/cloud/auth.test.ts` — `D-13 makes no further attempt once the vendor has refused the account credentials` |
| 5 | "The log names what happened." | `features/authentication.feature` — `A refused credential stops authentication and clears the cache`, whose step asserts the whole `error Authentication stopped after HTTP 403: ...` line |
| 6 | "You must correct the email and the password in the Homebridge settings and then restart the plugin." | The same assertion. The line's own advice, `src/cloud/auth.ts:30`, says saving in the settings restarts the plugin, which is the same act stated the way an owner performs it |

**Longest sentence:** *"Each service keeps the value it last published, and a controller that reads one of those values directly still gets it."* — **21 words**. Unchanged by this plan; the sentence I changed is 13 words.

**Plan 05-18's zero-count line: judged an operator's line, and kept out of the README.** The line fires only when a credential refusal marked nothing because the cached accessories carry no trust report at all — a cache written by a release before the row was published. `package.json` reads `0.1.0` and `CHANGELOG.md` has no released section, so no such cache exists in the field yet. Its condition is one an owner cannot observe or name, and its corrective action is the one this paragraph already gives. The paragraph also already sends the owner to the log. Putting an upgrade-path condition into an owner-facing section would trade a real instruction for a plugin-internal caveat, so the line stays where plan 05-18 put it.

### CHANGELOG:24

**Before:** "The plugin now marks its services inactive when the vendor cloud stops sending live changes, and successful polls keep their readings current."

**After:** "The plugin now marks its services inactive when the vendor cloud stops sending live changes. It hands the readings back to polling at the same moment."

| Sentence | Assertion |
|---|---|
| "The plugin now marks its services inactive when the vendor cloud stops sending live changes." | `features/degradedOperation.feature` — `Shadow silence withdraws trust while polling continues`, and `A pit that floods after the live path went quiet still reaches Apple Home`, which reads `Status Active` as `false` once the clock crosses two heartbeats |
| "It hands the readings back to polling at the same moment." | One scenario carries both halves: `A pit that floods after the live path went quiet still reaches Apple Home` reads `Status Active` `false` and then reads the poll's `water_level 31` off the canonical snapshot. Also `test/runtime/accountRuntime.test.ts` — `D-13 hands only the quiet pump back to the poll and leaves its neighbour owning its telemetry` |

**Deleted:** "and successful polls keep their readings current" — CR-04's claim in one clause. False for the window the entry is about.

**Longest sentence:** *"The plugin now marks its services inactive when the vendor cloud stops sending live changes."* — **15 words**.

### The other five § Changed entries, read against what this round shipped

| Line | Entry | Judgment |
|---|---|---|
| 23 | Preserve-and-mark: "it marks the affected services inactive and keeps their last trusted value. It never substitutes a normal reading." | **Accurate.** Plan 05-16 widened the withdrawal under a credential refusal and left preserve-and-mark intact, pinned by `WR-03 leaves every reading a row published where it was when the credential refusal lands` |
| 25 | "When live changes return, the plugin marks its services active again at once rather than at its next poll." | **Accurate.** `A returning heartbeat clears the shadow silence before the next poll` still passes unedited, and plan 05-14 confirmed it under per-device stamps |
| 26 | "After a restart the plugin marks every restored service inactive until a poll succeeds." | **Accurate.** Untouched this round; `A restarted plugin marks restored values stale before any poll` and `A restart retains the values it marks stale` still pass |
| 27 | "While the plugin cannot reach the vendor cloud, including after a restart, it now refuses a press of either switch and logs the cause." | **Accurate but narrower than what shipped, and left alone.** Plan 05-17 added a third refusal rule: a press is also refused while the live connection is quiet and the cloud is answering normally. The entry does not overstate — everything it says is true and "logs the cause" is now more true than before, since 05-17 replaced an untrue cause. It under-describes. The plan's instruction is to correct entries that overstate and not to add an entry per plan, so this is reported as a finding rather than rewritten |
| 28 | "When the vendor refuses your account email or password ... Apple Home shows the accessory as `No Response`." | **Accurate.** The one case that produces no `No Response` is a cache written by an earlier release, and there is no earlier release: the package is `0.1.0` with no released changelog section |

### The reviewer's candidate rewrite, clause by clause

`05-REVIEW-2.md` supplied five sentences for README:145. It was read as a starting point and checked against the code as it stands after six plans.

| Candidate clause | Disposition |
|---|---|
| "The delay is to the report and to the reading." | **Taken verbatim.** It is the correction, stated plainly |
| "While the live connection still owns the readings, a poll does not replace them." | **Taken verbatim.** Condition before statement, which is what STE asks for and what the D-13 case measures |
| "The plugin gives the readings back to polling after two missed heartbeats, which is about 30 minutes." | **Taken, with the constant dropped.** Line 143 already gives an owner the 898-second heartbeat and the poll interval, so "about 30 minutes" is derivable. Repeating a threshold in two paragraphs is how the two drift apart, which is what the plan forbade |
| "From that point, each successful poll updates the tile: if a poll finds a flooded pit, `Sump Pit Flood` reports it, and the trust row alone carries the doubt." | **Taken, split into two sentences.** The colon joined a general rule to an instance; STE prefers one idea per sentence, and the split keeps both under the word limit |
| "Before that point, the tile shows the last reading the live connection sent." | **Taken, moved earlier and merged.** It belongs beside the trust half, so that both halves of the pre-handover state are described under one condition rather than in two places |
| — | **Two sentences added that the candidate does not have.** The per-system handover, which is new in this round and needed plan 05-14's scenario behind it, and the account-wide marking, which 05-14 chose deliberately and recorded with its cost. The candidate was written against the review's snapshot of the code and predates both |

For README:151 the reviewer proposed "Every service that reports whether the plugin vouches for it stops answering." **Taken, with the word order corrected** to keep "then" where the original sentence had it, so the paragraph's sequence from the preceding one still reads.

---

## What `REQUIREMENTS.md` now says

### RES-03 — the branch taken, and the evidence that decided it

`05-CONTEXT.md` records the row as an incidental finding: it read `Complete` from Phase 3's `f73f692` while its own note said Phase 5 still owed a sentence. **Branch taken: the row stays `Complete`, because Phase 5 delivered that sentence.** The amendment, quoted from the file:

> *Phase 5's half settled 2026-09-03 by plan 05-19, at the close of the second gap-closure round. The row stays `Complete`.* [...] **No false physical-device alert:** `test/accessories/serviceCatalogue.test.ts` holds that with both transports down and the controller link intact, neither `Basement Guardian Offline` nor `Pump Controller Link Lost` is activated by the outage itself; the mutation is deriving `controllerLinkValues`' activation from the row's trust instead of from the decoded `controllerLinkPresent`. **Told apart:** `features/degradedOperation.feature` — `A blind plugin vouches for no controller-link verdict` [...] and `Polling failure alone leaves the live values trustworthy` [...]. **Diagnosed separately:** `test/runtime/accountRuntime.test.ts` — `reports the silent live connection once across three silent polls inside one reminder interval` and `announces the live connection recovered once a message arrives after the silence` record a lost monitoring path under `Live device reporting`, its own activity beside `Device polling`; the mutation is reporting from the arrival unconditionally, with no latch guard.

Each of the three parts is cited on an assertion that has a discriminating mutation named in `05-VALIDATION.md`, so none rests on an assertion that only proves an act happened.

`RES-01` is named by the same incidental finding and was deliberately not touched. Its mis-marking came from the same Phase 3 commit, and reconciling it belongs with ledger entry 12's Phase 1 block at a milestone audit.

### RES-04 — the branch taken for each of the four clauses

**Branch taken: the row stays `Complete`, all four clauses.** One citation was corrected rather than re-affirmed.

| Clause | Branch | The evidence that decided it |
|---|---|---|
| 1. Cached reads with no network calls | Complete, citation unchanged | `test/accessories/accessoryReadPathScope.test.ts` — the two static-gate cases, with three named mutations: plant `.onGet(() => false)` in `publishRow`, plant a `createCloudApi` import in `basementGuardian.ts`, and point `REPOSITORY_ROOT` one level wrong to prove the gate is not vacuous |
| 2. Accessories present and visibly stale | Complete, **citation corrected** | The clause is discriminated by `A restart retains the values it marks stale` under the mutation "push a format default instead of only `StatusActive`". But the previous citation also credited the restart scenarios with the platform's own call site, and they cannot fail it: ledger entry 1 records that deleting the `configureAccessory` marking pass leaves every Cucumber scenario green, because `features/support/world.ts:594` calls the exported pass itself. The clause now names `test/platform.test.ts` for that call site |
| 3. Commands disabled until fresh valid state returns | Complete, citation widened | `test/platform.test.ts` — `refuses a press on every restored control...`, mutation: remove the pass's call from `configureAccessory`. Widened this round by `features/officialControls.feature` — `A press while the live connection is quiet names the quiet connection`, failed by deleting the rule's row from `LOCAL_REFUSALS` and by answering its predicate from `commandTransportReady` |
| 4. Only a credential rejection is persistent and requires user action | Complete, citation widened | Plan 05-12's re-citation stands. This round added the two routes that were undoing the presentation: `A press after a refused credential leaves both controls still refusing reads` with the three `CR-02` unit cases, all failed together by removing the credential guard from the republish callback; and `test/platform.test.ts` — `leaves the pushed status standing over an accessory that republishes its own rows`, failed by inverting the two loops in `applyMonitoringHealth`, an inversion that left all 1348 unit tests green when the reviewer ran it and all 1378 at plan 05-18's baseline. The `only` direction still holds through `A transport outage leaves every service readable`, and what "every service" reaches is now `counts every service that reports whether the plugin vouches for it, and leaves one that never did alone`, failed by mutation G |

`grep -c "05-19" .planning/REQUIREMENTS.md` answers **2**, above the floor of non-zero. As the plan says, that verify proves attribution and passes identically whichever branch was taken; the branch is decided by the table above.

---

## `05-VALIDATION.md`

### The measured baseline and the floor

**`B` measured immediately before appending: 5**, on lines **128, 132, 580, 620 and 621**. Only three are about this plan: the round's section heading and its two seeded rows. **Lines 128 and 132 belong to plan 05-06** and match only because their Threat Ref column reads `T-05-19`.

**Floor asserted from that measurement: 9** — `B` of 5, plus one `### Plan 05-19 rows` heading, plus one line for each of the three documentation rows. No `### Plan 05-19 mutations` subsection exists, deliberately: prose has no mutation of its own. **After appending the command answers 22.**

The plan's line numbers for those five hits did not survive measurement — it named 321, 361 and 362 where the file now holds 580, 620 and 621. The count is unchanged, so the floor is unchanged and is restated from the measurement rather than from the plan.

### What was appended

1. **`### Plan 05-19 rows`** — three rows, each labelled *"Documentation trace, not a test"* and each naming the code assertion its sentence depends on.
2. **A sixth item under "The end-to-end blindness this phase must not inherit"** — that per-plan mutation testing cannot see a defect living between two plans that are each correct. The first structural lesson the plan asked for, that every scenario used one `deviceId` until plan 05-13, **was already recorded as item 5** by plan 05-13, so it was not written twice.
3. **`### Second gap-closure round reconciliation (plan 05-19)`** — the per-plan disposition, the eleven predictions that did not survive measurement, the Wave 0 evidence, and one correction that belongs to an earlier round.
4. **The `Validation Sign-Off` block**, filled in.

### The reconciliation, and a plan self-inconsistency

The second-round table's own governing paragraph says *"the closing plan reconciles these rows against those summaries"*. This plan's prohibitions say *"MUST NOT edit an existing `05-VALIDATION.md` table. New material is appended."* Both cannot be honoured by editing the Status column. **The prohibition was honoured literally**: every existing table was left as its plan wrote it, and the disposition of all 22 second-round rows was appended instead, in the subsection the table's own sentence points a reader at. Twenty-two rows in that table therefore still read `⬜ pending` and are not; the appended subsection says so in its first paragraph. Recorded as ledger entry 32.

### Predictions that did not survive, by plan

Every one is recorded in the appended subsection as a table. In brief: 05-14's mutation B was predicted to possibly pass and fails; its mutation C was predicted to fail and failed nothing. 05-15's stated consequence of refusing a watermark advance was backwards, and two of its mutations broke less than expected for reasons that are correct rather than gaps. 05-16's mutation C behaved exactly as its plan conditionally predicted. 05-17's task 2 disagreement is not observable through the refusal at all; its mutation B fails no scenario, and the single unit case that catches it was written by that plan for that mutation; its mutation F failed nothing until a vacuous case was rebuilt. 05-18's mutation G reports `marked: 4`, not the `marked: 3` its executor first wrote, because the widened walk also reaches `AccessoryInformation`. 05-13's five mutations all failed something, and its own `serviceOf` acceptance criterion contradicted its `<action>`.

### One correction that belongs to an earlier round, recorded rather than made

The gap-closure mutations table pins *"Every documentation claim is traceable to a passing assertion"* on watching the README sentence **"The plugin holds no value back while it waits"** stand on nothing. `05-VERIFICATION.md` separately lists **"README: `the plugin holds no value back while it waits` is now a true statement about the shipped code"** among its `gaps_closed`. CR-04 showed that sentence false, and this plan deleted it. **Neither record was edited** — the table belongs to plan 05-10's round and the report belongs to a verifier — and both are recorded in the appended subsection and as ledger entry 33. This is the phase's signature defect once more: a check that passed because the claim it rested on was never read against the code.

### The sign-off, and what each box rests on

| Box | State | Measurement |
|---|---|---|
| All tasks have `<automated>` verify or Wave 0 dependencies | ✅ | 47 `<task>` elements across the phase's nineteen plans; 46 carry at least one `<automated>` block; the one that does not is a `checkpoint` task, which the criterion exempts |
| Sampling continuity | ✅ | Follows from the line above — no run of three exists |
| Wave 0 covers all MISSING references | ✅ | All six items exist and are exercised; evidence written into the reconciliation subsection rather than by checking the Wave 0 boxes, which this plan's action does not authorise it to write |
| No watch-mode flags | ✅ | `package.json`'s five test scripts carry no `--watch` |
| Feedback latency | ✅ | `npm run test:unit` **13.9 s** wall including the TypeScript build; `npm test`, the named full-suite pair, **54.5 s**, inside the ~90 s bound. `npm run check` takes **105.1 s** but adds typecheck, lint, `fallow` and `format:check`, which this line does not name |
| `nyquist_compliant: true` in frontmatter | ⬜ | **Not this plan's to set.** The frontmatter still reads `status: draft`, `nyquist_compliant: false`, `wave_0_complete: false`. Those are written by `validate-phase` §6, and this plan leaves a verifier's fields alone for the same reason it leaves `05-VERIFICATION.md` alone |

**Approval: still pending, and stated as what it is.** Approval is a human act and nobody has taken it. `05-VERIFICATION.md` reads `status: gaps_found` with two `gaps_remaining` entries, written before plans 05-12 to 05-19 landed and not re-run since, and one of its `gaps_closed` entries names a sentence that has now been deleted as untrue. All three `Manual-Only Verifications` rows ride on the open `G-003` / `G-004` real-home session. A re-verification and that session are what would move the line.

---

## Gates, on both installed Node versions

**Node 24 is not installed on this machine and nothing is claimed about it.** The v22 lower bound and a runtime above the v24 upper bound were both exercised, so the CI matrix is only partly reproduced here.

| Gate | `node` v26.7.0 | `/usr/bin/node` v22.22.2 |
|---|---|---|
| Unit tests | 1385 pass, 0 fail | 1385 pass, 0 fail |
| Cucumber | 102 scenarios, 1120 steps, all passed | 102 scenarios, 1120 steps, all passed |
| Coverage over `src/` | 100.00 / 100.00 / 100.00 | 100.00 / 100.00 / 100.00 |
| `npm run check` | exit 0 | — |

### Against the 1349 / 96 / 1011 baseline the round started from

**1385 / 102 / 1120.** Every unit of movement is accounted for by the seven plans:

| Plan | Unit | Scenarios | Steps | What moved |
|---|---|---|---|---|
| 05-13 | +0 | +2 | +28 | Two harness scenarios, no production code |
| 05-14 | +9 | +1 | +22 | Five monitoring-health, two store, two runtime cases; the CR-01 scenario |
| 05-15 | +2 | +1 | +18 | One store case, one runtime case; the metadata scenario |
| 05-16 | +7 | +1 | +29 | Three seam cases, four withdrawal and comparison cases; the press scenario |
| 05-17 | +11 | +1 | +12 | Six in task 1, two in task 2, three in task 3; the quiet-connection scenario |
| 05-18 | +7 | +0 | +0 | Two ordering, two gate, three log-line cases |
| 05-19 | +0 | +0 | +0 | This plan changes no code |
| **Total** | **+36** | **+6** | **+109** | 1349 + 36 = **1385**; 96 + 6 = **102**; 1011 + 109 = **1120** |

Nothing was lost, renamed away, or removed. Coverage held at 100 on all three axes throughout.

---

## Ledger

**Closed: one.**

| Entry | Closed by | Evidence |
|---|---|---|
| 30 | This plan, task 1 | `README.md:151` now reads "Every service that reports whether the plugin vouches for it then stops answering", which is what `markTrustReportsUnreadable` does. Pinned by `test/accessories/staleMarking.test.ts` — `counts every service that reports whether the plugin vouches for it, and leaves one that never did alone`, and by plan 05-18's mutation G |

**Appended: three.** Entries 31 (two of this plan's own verify commands are wrong), 32 (the table-edit prohibition against the table's own delegation), 33 (two records naming a sentence that has been deleted as untrue).

**Open: 29.** One line each on why it is still open and what would close it.

| # | Why it is still open | What would close it |
|---|---|---|
| 2 | `commandTransportReadyNow()`'s `!halted` term is redundant and no test fails when it is removed; kept as deliberate defence | A case that reaches the halted path with polling healthy, or a decision to remove the term |
| 3 | The README's 30-day figure is sourced outside the two files plan 05-05's criterion names | A citation in one of those files, or a criterion that admits the real source |
| 4 | Pre-existing: `## Project structure` links `src/platformAccessory.ts`, which does not exist | A one-line README fix; outside the two sections this plan owns |
| 6 | `reportControllerLink` names five poisoned scopes where `NON_CONNECTIVITY_SCOPES` holds seven | A comment corrected to seven, or a case pinning the count |
| 7 | A platform case passes without the fix and fails no mutation | A discriminating mutation, or deletion in favour of D1 to D4 |
| 9 | A scenario now rests its "not activated" assertion on the polled level rather than the retained heartbeat | A heartbeat step that survives the handover, or an assertion restated on what it now measures |
| 10 | Plan 05-11's prescribed scenario repair does not work, and the repair that does is different | A recorded rule for repairing these scenarios, in the harness docs |
| 11 | `lets the accessory own binder replace the refusal` carries no discriminating mutation; the candidate is recorded and **not run** | Running the recorded candidate: bind the restored refusal as an additional listener rather than into HAP's single `onSet` slot |
| 12 | Every Phase 1 requirement row still reads `Pending`, including `SYNC-03` which plan 05-11 amended in place | A Phase 1 close-out or a milestone audit. Explicitly not this plan's, and this plan did not make it worse |
| 13 | The 22 first-round Per-Task Verification Map rows still read pending; three are the rows the verifier found green but blind | A verifier re-running the first round, not a plan marking them |
| 14 | The `IN-03` half — shadow silence measured against a jumpable wall clock — is untouched; the `DiscoveryContext` half was closed by 05-18 as entry 27 and the entry could not be split | A note in the intel document so a later monotonic-clock decision has the reason recorded |
| 15 | Plan 05-12's mutation B did not produce the predicted outcome | Nothing to fix; it is a record. It closes when the phase's records are archived |
| 16 | `closeQuietly` was relocated for a linter rule the plan did not anticipate | A record; closes with the phase |
| 17 | `harness.ts` keeps a private single-device `currentAccessory` and a module-constant `topicNamed` | A scenario that needs either to be plural, and the harness change it forces |
| 18 | `awaitSubscription` reads a cumulative topic count, so it answers for either device on a two-device account | A scenario that must know a particular device's subscription was established |
| 19 | Shadow-silence marking is account-wide: a two-pump owner is told the plugin cannot vouch for both when it can vouch for one. Deliberate | A per-device `MonitoringTrust` crossing `onMonitoringHealth`, `applyMonitoringHealth` and the platform fan-out — a design change, not a fix. **The README now says this**, which is the part of it a reader could act on |
| 20 | Plan 05-14 task 1 had to touch two test files it did not list | A record; closes with the phase |
| 21 | Plan 05-14's mutation C failed nothing in the new scenario | A record, with the five scenarios and one case that do pin the admit call |
| 22 | Plan 05-15's stated consequence of refusing a watermark advance was backwards | A record; the shipped case pins the measured consequence |
| 23 | Plan 05-16 task 1 needed unit cases its `<files>` did not list | A record; closes with the phase |
| 24 | Plan 05-17's first withholding case was vacuous because `gemini.ts:370` drops a violated scope's group | A record, with the rule a later author needs |
| 25 | `serviceCatalogue.ts` needed no edit although plan 05-17 listed it | A record; closes with the phase |
| 26 | Plan 05-17's mutation B fails no Cucumber scenario; no shipped scenario sets a quiet live path and an unready transport together | A scenario that sets both, if one is ever worth the cost |
| 27 | The `DiscoveryContext` half of entry 14 is closed, but the entry records it and stays open because entry 14 could not be split | Closing entry 14's `IN-03` half |
| 28 | Plan 05-18's context helper takes the command port as a parameter, which its plan did not prescribe | A record; the prohibition is stronger than the plan asked for |
| 29 | Plan 05-18 found a fifth caller of the renamed pass | A record; closes with the phase |
| 31 | Two of plan 05-19's own verify commands cannot do what they say | A plan-template fix: `windows list` is not a subcommand, and `npm run format:check` cannot name a markdown file |
| 32 | The second-round table's Status cells still read pending because this plan may not edit an existing table | A later plan or a verifier with the authority to write that column |
| 33 | Two records name a README sentence that has been deleted as untrue | A re-verification of phase 05 |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's ledger verify names a subcommand that does not exist**

- **Found during:** Task 2, running the plan's `<verify>` block.
- **Issue:** `node .claude/gsd-core/bin/gsd-tools.cjs windows list` exits non-zero with `Unknown windows subcommand: list. Available: status, append, waive, fixed`.
- **Fix:** Ran `windows status` instead, which answers the same question in JSON. The verify's intent — that no entry is marked fixed whose closing evidence is not named in this summary — is met: exactly one entry was closed and its evidence is named above.
- **Verification:** `windows status` reports `open=29, waived=1, fixed=3, total=33`.
- **Committed in:** `18cf414`. **Ledger:** entry 31.

**2. [Rule 1 - Bug] The plan's task 1 verify tests a condition that cannot fire**

- **Found during:** Task 1, at `npm run format:check`.
- **Issue:** The `<fails_when>` says the command fails if "its output names `README.md` or `CHANGELOG.md`". The script runs `prettier --check "**/*.{js,json,mjs,ts}"` and can never name a markdown file.
- **Fix:** Ran it anyway (clean), and ran the gate that does cover markdown: `pre-commit run --files README.md CHANGELOG.md`, whose `mdformat` and `markdownlint-cli2` hooks both passed on both files.
- **Committed in:** `d176107`. **Ledger:** entry 31.

**3. [Rule 1 - Bug] My own changelog sentence broke the length rule the plan imposed**

- **Found during:** Writing this summary, counting words for the acceptance criterion.
- **Issue:** The corrected entry ran to 27 words in one sentence, over ASD-STE100's 25-word descriptive limit — the rule the plan's own `<action>` requires every changed sentence to be run through.
- **Fix:** Split into two sentences of 16 and 12 words.
- **Verification:** `pre-commit run --files CHANGELOG.md` clean; the entry reads in the register the neighbouring two-sentence entries use.
- **Committed in:** `04249dd`.

---

**Total deviations:** 3 auto-fixed (3 bugs — two in the plan's own verify block, one in my own prose).
**Impact on plan:** None on scope. Nothing under `src/`, `test/` or `features/` was touched, no package was installed, and `package.json` and `package-lock.json` are unchanged, which closes `T-05-19-SC`.

## Plan premises that did not survive measurement

Four, all reported rather than worked around.

1. **`gsd-tools.cjs windows list` is not a subcommand.** Deviation 1.
2. **`npm run format:check` cannot name `README.md` or `CHANGELOG.md`.** Deviation 2. The orchestrator's briefing also stated that the two files "are not prettier-ignored the way `.planning/` is"; measured, prettier's glob covers `js`, `json`, `mjs` and `ts` only, so neither file reaches it at all. Markdown is gated by `mdformat` and `markdownlint-cli2`.
3. **The `05-VALIDATION.md` line numbers for the five `05-19` hits have moved** — 580, 620 and 621, not 321, 361 and 362. `B` is still 5 and the floor of 9 still stands, restated from the measurement.
4. **The table-edit prohibition and the table's own delegation to the closing plan cannot both be honoured.** Recorded above and as ledger entry 32.

Everything else held: `README.md:145` and `:151` were exactly the CR-04 and WR-08 sentences the plan quoted, `CHANGELOG.md:24` carried the clause the review named, `pollTelemetry` still returns `previous.data` when the shadow owns telemetry, and the recorded 1385 / 102 / 1120 starting gate was confirmed on the committed tree before any edit.

## A sentence I found false that the plan did not name

None in the two corrected sections beyond CR-04 and WR-08 themselves. Outside them, one record is now untrue and one is narrower than what shipped:

- **`05-VERIFICATION.md` `gaps_closed` asserts that "The plugin holds no value back while it waits" is a true statement about the shipped code.** It is not, and was not when the verifier wrote it. Recorded, not edited — a verifier owns that report. Ledger entry 33.
- **`CHANGELOG.md:27` describes the control-refusal rule more narrowly than the plugin now implements it.** True as written, but silent about the third refusal rule plan 05-17 added. Reported rather than rewritten, for the reason in the changelog table above.

## A sentence whose truth I could not trace to an assertion

One, and it is untraceable by construction rather than unpinned: **"Apple Home shows the whole accessory as `No Response`"** at `README.md:151`. What Apple Home draws is not assertable from this repository, and the phase's own `Manual-Only Verifications` table records it as riding on the open `G-003` / `G-004` real-home session. The plugin-side half — that a marked service refuses a read rather than answering an inactive value — is pinned by `makes a read of every marked service throw the status it was given, and leaves the value it held` and by `leaves the pushed status standing over an accessory that republishes its own rows`, which reads `threw: -70402`. The sentence was kept on that basis and the split is stated here rather than papered over.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired component was introduced. This plan wrote prose and planning records only.

## Threat Flags

None. `T-05-19-01` through `T-05-19-04` are the plan's own mitigations and each is implemented above. `T-05-19-05` holds: nothing added to `README.md` or `CHANGELOG.md` names an account, a serial number, a token, a URL or a local-network value. `T-05-19-SC` holds: no package was installed and `package.json` and `package-lock.json` are not in the diff.

## Issues Encountered

None unresolved. The one judgment call worth naming is the table-edit prohibition, which is recorded as a plan self-inconsistency rather than resolved in either direction by preference.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

`05-REVIEW-2.md` is closed: four blockers and eight warnings, all dispositioned. CR-04 and the documentation half of WR-08 were the last two, and they are the subject of this plan.

Three things the next reader should know:

1. **`05-VERIFICATION.md` is stale.** It reads `status: gaps_found` at `3/4`, was written before plans 05-12 to 05-19 landed, and one of its `gaps_closed` entries names a sentence that no longer exists. A re-verification is the next useful act on this phase.
2. **Twenty-two rows of the second gap-closure round table still read `⬜ pending`** and are not. Their disposition is in `05-VALIDATION.md` under `Second gap-closure round reconciliation`, and the reason the cells were not edited is ledger entry 32.
3. **Twenty-nine ledger entries are open**, most of them records rather than defects. Entries 11, 13 and 26 are the three that name real coverage a later plan could close.

---

*Phase: 05-degraded-operation-and-recovery*
*Completed: 2026-09-03*

## Self-Check: PASSED

- `README.md`, `CHANGELOG.md`, `.planning/REQUIREMENTS.md`, `.planning/WINDOWS.md` and `.planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md` — all FOUND on disk
- Commits `d176107`, `18cf414`, `04249dd` — all three FOUND in `git log`, each verified by `git show --name-only --format="" HEAD` at the time it was made, never by a reported hash. No commit deleted a tracked file
- `git diff --stat ad74303..HEAD -- src test features` — **empty**
- `grep -c "05-19" .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md` — answers **22** against a measured baseline of **5** and a floor of **9**
- `grep -c "05-19" .planning/REQUIREMENTS.md` — answers **2**, above the non-zero floor
- `npm run check` — exit 0: 1385 unit tests, 102 scenarios, 1120 steps
- `npm run test:coverage:all` — 100.00 / 100.00 / 100.00 on `node` v26.7.0 and on `/usr/bin/node` v22.22.2
