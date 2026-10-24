---
phase: 05-degraded-operation-and-recovery
plan: 16
subsystem: ui
tags: [credential-refusal, homekit, control-write, trust-scopes, no-response, gap-closure]

requires:
  - phase: 05-degraded-operation-and-recovery
    provides: "05-12's closed message route into the credential refusal, and the settling read step it added"
  - phase: 05-degraded-operation-and-recovery
    provides: "05-09's restored-control refusal, which is the shape this fix copies"
provides:
  - "A credential refusal the accessory holds as a state, so no control write can republish over it"
  - "One guarded seam covering all three ways a control request ends: the local refusal, the request expiry and the vendor refusal"
  - "A refused credential that withdraws every trust scope, so the value under the marking is false rather than a claim of full trust"
  - "A withdrawal that marks without withholding, so `Basement Guardian Offline` keeps publishing its verdict"
  - "The credential member of the republish comparison made provable, and the comment beside it corrected"
  - "Closure of `05-REVIEW-2.md` CR-02, WR-03 and WR-04"
affects: [05-17, 05-18, control write path, monitoring trust withdrawal]

actuals:
  tokens: 10800
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A guard sits on the callback every path converges on rather than on the function above it, so a path that bypasses that function is closed by construction rather than by a second guard"
    - "A unit case drives the platform's own two acts in the platform's own order, through the exported pass rather than a copy of it"
    - "A case pushes the opposite verdict into a row before the transition it measures, so a withdrawal that withheld is caught rather than agreed with by accident"
    - "A comparison comment names which member is proven by which case, instead of asserting the property for the list as a whole"

key-files:
  created: []
  modified:
    - src/accessories/basementGuardian.ts
    - test/accessories/basementGuardian.test.ts
    - features/degradedOperation.feature
    - .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md
    - .planning/WINDOWS.md

key-decisions:
  - "Guarded the `republish` callback the control binder holds, not `clearRefusal`. The request-expiry path calls the callback directly and never reaches `clearRefusal`, so guarding the function above would have closed two paths of three while looking equivalent. Proved by measurement: mutation A fails all three unit cases together."
  - "Refused the review's first option -- teaching `publishRow` to push the persistent failure. It would add a second production call site of the act `03-CONTEXT.md` D-05 forbids, and `publishPersistentFailure`'s docblock states that the single call site is what keeps the locked decision reviewable. The count is still one."
  - "Added three unit cases in task 1 although the task listed only the feature file and the accessory source. The task's own coverage verify demands 100 percent branch coverage and the new guard adds a branch no scenario can reach; the same three cases are what prove all three leaking callers closed."
  - "Wrote the connectivity case by pushing the opposite verdict into the row first. Asserting the right verdict on a row that already held it would have passed under the mutation the case exists to catch."

patterns-established:
  - "The seam guard: one binder callback, one guard, three refusal paths"
  - "`CREDENTIALS_REFUSED` and `COMMAND_TRANSPORT_UNREADY` differ in the credential member alone, which is the pair the republish comparison has to tell apart"

requirements-completed: [RES-04]

coverage:
  - id: D1
    description: "A press on either control Switch after a refused credential leaves both control services and the flood sensor still refusing reads, with their readings retained"
    requirement: RES-04
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#A press after a refused credential leaves both controls still refusing reads"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#CR-02 leaves both controls refusing reads when the press it refused itself runs its clearing push"
        status: pass
    human_judgment: false
  - id: D2
    description: "The request-expiry and vendor-refusal paths are covered by the same closed seam"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#CR-02 leaves both controls refusing reads when a request that outlived its window runs its clearing push"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#CR-02 leaves both controls refusing reads when the vendor refusal that answered a press runs its clearing push"
        status: pass
    human_judgment: false
  - id: D3
    description: "A refused credential withdraws every trust scope, so the value under the marking reads false"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#WR-03 withdraws every scope under a refused credential, saying the plugin is seeing less rather than that a value is wrong"
        status: pass
    human_judgment: false
  - id: D4
    description: "`Basement Guardian Offline` keeps publishing the verdict it holds under that wider withdrawal, marked rather than blank"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#WR-03 keeps the offline adapter publishing its verdict under a refused credential and stops vouching for it"
        status: pass
    human_judgment: false
  - id: D5
    description: "Preserve-and-mark holds under the wider withdrawal: every reading a row published before the refusal is still published after it"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#WR-03 leaves every reading a row published where it was when the credential refusal lands"
        status: pass
      - kind: e2e
        ref: "features/degradedOperation.feature#A press after a refused credential leaves both controls still refusing reads"
        status: pass
    human_judgment: false
  - id: D6
    description: "A trust push differing from the stored one only in the credential member still republishes"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#WR-04 republishes for a trust push differing from the stored one only in the credential member"
        status: pass
    human_judgment: false
  - id: D7
    description: "Apple Home still renders the refusal as No Response after the owner presses one of the control switches"
    requirement: RES-04
    verification: []
    human_judgment: true
    rationale: "Apple Home rendering cannot be asserted from the plugin side. The plugin-side half is pinned by D1; the third moment is recorded in `05-VALIDATION.md`'s Manual-Only Verifications table and rides along with the open `G-003` / `G-004` real-home session."

duration: 32min
completed: 2026-09-02
status: complete
---

# Phase 5 Plan 16: A Refusal a Press Cannot Erase Summary

**One guard on the single republish callback the control binder holds closes the local refusal, the request expiry and the vendor refusal together, and a refused credential now withdraws every trust scope so the value under the marking is `false` rather than a claim of full trust.**

## Performance

- **Duration:** 32 min
- **Started:** 2026-09-02T22:05Z
- **Completed:** 2026-09-02T22:37Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Closed `05-REVIEW-2.md` CR-02. One press on one control switch returned **both** control services to a fully vouched-for read on a permanently halted plugin, and left them there.
- Closed the two paths the reproduction did not use, and proved each separately rather than crediting the fix with them.
- Closed WR-03: a refused credential withdraws every scope, and the offline adapter still publishes its verdict because the reason filled in says the plugin is seeing less.
- Closed WR-04: the reviewer's own mutation left 1348 unit tests and 96 scenarios green before this round and now fails four named cases.
- Kept the forbidden persistent-failure push at exactly one production call site.

## Task Commits

1. **Task 1: the seam, the scenario and one case per refusal path** — `cc0d23f` (fix)
2. **Task 2: the wider withdrawal and the corrected comparison comment** — `baf03b2` (fix)
3. **Task 3: the validation rows, the mutation table and the ledger** — `9e21c8f` (docs)

## The RED run, as the scenario found it

Before the source change, with the scenario written and the plugin unmodified:

```text
Failed scenarios:
  1) A press after a refused credential leaves both controls still refusing reads
       Then the "System Self-Test" service still answers no read for "Status Active"
           Error: the System Self-Test service never refused a read for Status Active:
                  it answered a read
1 scenario (1 failed)
29 steps (17 passed, 11 skipped, 1 failed)
```

Cucumber stops at the first failing step, so the failure names one service. Two probes measured the rest, and both are the evidence that the red is real rather than incidental.

**Probe 1 — restate the assertions to the broken values.** Moving the three read assertions to *before* the clock advance and restating them *after* it to what the defect produces made the scenario pass, 26 of 26 steps:

| Moment | System Self-Test | Alarm Mute | Sump Pit Flood |
|---|---|---|---|
| After the press, before the clock advance | refuses a read | refuses a read | refuses a read |
| After the clock advance | **answers, `Status Active` = `true`** | **answers, `Status Active` = `true`** | refuses a read |

That is the review's recorded reproduction, measured through the repository's own steps. A press on the self-test control un-marked the alarm-mute control as well, because the clearing push republishes every control row. The flood sensor was untouched, which is what makes the accessory read as half working while it is entirely dead.

**Probe 2 — the press is not the damage.** The first row above is the proof. Everything still refuses immediately after the press; the plugin arms the clearing push for the next macrotask, and the damage lands when that macrotask runs.

## Mutations

Every mutation was applied after its task was committed, run, and reverted only once `git status` showed the mutated file was the only changed one, with `npm run build:test` after each.

### Mutation A — remove the credential guard from the republish callback

Kills both tiers.

- **Scenario:** `features/degradedOperation.feature:551` fails at `Then the "System Self-Test" service still answers no read for "Status Active"` with `it answered a read`.
- **Unit:** all three cases fail together, each on `{ selfTest: true, alarmMute: true }` against `{ selfTest: 'refused -70402', alarmMute: 'refused -70402' }`:
  - `CR-02 leaves both controls refusing reads when the press it refused itself runs its clearing push` — `test/accessories/basementGuardian.test.ts:2355`
  - `CR-02 leaves both controls refusing reads when a request that outlived its window runs its clearing push` — `:2376`
  - `CR-02 leaves both controls refusing reads when the vendor refusal that answered a press runs its clearing push` — `:2390`

That the three fail **together** is the measurement behind the claim that one seam closes three doors. It is not read off the call graph.

### Mutation B — drop the clock advance, with A still applied

**Behaved exactly as the plan predicted.** The scenario **passes in 1.6 s against the defect**, 27 of 27 steps. Without the advance the scenario reads the moment before the clearing push runs, so it would have been green whatever the plugin did. Plan 05-12's equivalent mutation did not behave as its plan predicted; this one did.

### Mutation C — guard `republishPublishedRows` as well

**At task 1 this failed nothing at all** — 1363 unit tests and 101 scenarios green. A refused credential withdrew no scope yet, so the halt's own republish pushed the same `true` it had already published, and suppressing it changed nothing observable.

**After task 2 it fails three cases:**

| Case | Line | Fails on |
|---|---|---|
| `WR-03 keeps the offline adapter publishing its verdict...` | `:2793` | `{ offlineState: 1, offlineActive: true }` — the opposite verdict pushed in first survived, so no republish happened |
| `WR-03 leaves every reading a row published...` | `:2834` | `moved: Set(0)` against `Set(1) { 'Status Active' }` |
| `WR-04 republishes for a trust push...` | `:2856` | `after: { flood: true, offline: true }` against `{ flood: false, offline: false }` |

The full-withdrawal case at `:2815` still passes under C, because it reads the accessory's exposed scope list, which `markMonitoring` computes before the republish. So the withdrawal is right and never reaches a tile — which is precisely the shape of defect this phase exists to close, and it is now caught by the other three. The null result at task 1 and the three failures at task 2 are the same measurement taken twice.

### Mutation D — remove the credential branch from `monitoringDegradedScopes`

Fails all four task 2 cases, at `:2793`, `:2815`, `:2834` and `:2856`. The withdrawal case fails on `[]` against the eight-scope list; the WR-04 case on `after: { flood: true, offline: true }`. No scenario fails.

### Mutation E — replace the credential comparison member with a constant

This is the reviewer's own mutation, and its before-and-after is the finding.

| | Unit | Cucumber |
|---|---|---|
| **Before this round** (`05-REVIEW-2.md` WR-04) | 1348 passed, 0 failed | 96 scenarios passed |
| **After this round** | 1363 passed, **4 failed** | 101 scenarios passed |

The four are `:2793`, `:2815`, `:2834` and `:2856`. The offline case fails on `offlineState: 1` — the opposite verdict the case pushed in first survived untouched, which says no republish happened at all.

All 101 scenarios still pass under E, and that is correct rather than a gap: the end-to-end tier reads the status the platform pushes immediately after the fan-out, which hides the boolean underneath it. The member is pinned at the unit tier deliberately.

An unplanned finding rode along. The four cases push `CREDENTIALS_REFUSED` as their **first** trust, and the accessory's initial stored trust already differs from it in the credential member alone — the command transport starts unready by design. So the member is load-bearing on the very first push, not only on the two-failed-polls-then-halt path the reviewer traced.

### Mutation F — a withholding reason instead of the seeing-less one

Fills the credential branch's scopes with `invalid` rather than `unreachable`. Fails `WR-03 keeps the offline adapter publishing its verdict...` at `:2793` on:

```text
actual:   { offlineState: 1, offlineActive: false }
expected: { offlineState: 0, offlineActive: false }
```

**It fails on the withheld value, with the marking still correct.** The case discriminates the withholding alone. This is the mutation that pins `05-CONTEXT.md` D-02's narrowing against the widening. It also fails the withdrawal case at `:2815` on the reason.

## The two source changes

**Task 1 — one hunk**, at `src/accessories/basementGuardian.ts:616`:

```ts
     republish: () => {
+      if (monitoring.credentialsRejected) {
+        return;
+      }
+
       republishControlRows(controls.pending);
     },
```

with twelve lines of comment above it saying why the guard is on the callback rather than on `clearRefusal`, why the `On` push after it still runs, and why `republishPublishedRows`, `publishRows` and `publishRow` are deliberately left unguarded.

**Task 2 — the withdrawal branch**, at `:314`:

```ts
 function monitoringDegradedScopes(trust: MonitoringTrust): ReadonlySet<TrustScope> {
+  if (trust.credentialsRejected) {
+    return EVERY_SCOPE;
+  }
+
   if (trust.shadowSilent) {
```

plus a ten-line comment above the function saying that the two branches below recover on their own while this one does not, and that the reason filled in is the seeing-less one so the connectivity adapter keeps its verdict. `markMonitoring`'s comparison comment was rewritten in the same commit to name which member is proven by which case rather than asserting the property for the list as a whole.

## Which production path reaches the new withdrawal branch

`src/platform.ts:381` — `applyMonitoringHealth` fans `markMonitoring(trust)` out over every `BasementGuardianAccessory` before it marks anything unreadable, and the runtime sets `credentialsRejected` at the terminal authentication halt. `reasonsNow()` reads the branch on that call and on every later projection. It is not test-only.

## The forbidden act still has one production call site

```text
$ grep -rn "publishPersistentFailure(" src/ | grep -v "export function"
src/accessories/staleMarking.ts:159:    publishPersistentFailure(hap, service, hap.Characteristic.StatusActive, status);
```

**One.** `test/accessories/basementGuardian.test.ts` also pins the count structurally, in `serviceCatalogue.ts names an errored characteristic once, inside publishPersistentFailure`, which still passes. The accessory tier's file docblock — "it never throws `HapStatusError` and never pushes an `Error` through a characteristic" — is still true and was not retracted.

## Gates, on both installed Node versions

Node 24 is not installed locally and is not claimed.

| Gate | node v26.7.0 | /usr/bin/node v22.22.2 |
|---|---|---|
| Unit tests | 1367 passed, 0 failed | 1367 passed, 0 failed |
| Cucumber | 101 scenarios, 1108 steps, all passed | 101 scenarios, 1108 steps, all passed |
| Coverage over `src/` | 100.00 / 100.00 / 100.00 | 100.00 / 100.00 / 100.00 |
| `npm run check` | exit 0 | — |
| `npm run fallow` | exit 0 | — |

Against the recorded baseline of **1360 unit tests, 100 scenarios and 1079 steps**: **+7 unit cases** and **+1 scenario carrying +29 steps**. Every unit of movement is accounted for — three seam cases in task 1, four withdrawal and comparison cases in task 2, and the one new scenario. Nothing was lost.

`npm run fallow` reports one clone group, `features/support/steps/hap.ts:113-124` against `168-181` — the pre-existing one this phase inherited. No dead-code finding.

## The three guard scenarios still pass, unedited

| Scenario | Result |
|---|---|
| `A credential refused mid-run stays refused when the next heartbeat lands` (05-12, the message route) | 1 passed, 25 steps |
| `A restored control is refused rather than silently accepted` (05-09, shares the clearing push) | 1 passed, 15 steps |
| `A transport outage leaves every service readable` (credential rejection stays the only unreadable cause) | 1 passed, 12 steps |

## `05-VALIDATION.md`: the measured baseline and the floor

`grep -c "05-16"` answered **4** immediately before appending, on lines 468 to 471 — four seeded table rows and no subsection heading. That is the number the plan derived its floor of **13** from, so **the floor stands as written**. After appending it answers **15**.

## Decisions Made

Recorded in the frontmatter. The load-bearing one is where the guard sits: on the callback the binder holds, not on `clearRefusal` above it. `expire()` calls the callback directly at `controls.ts:443` and never reaches `clearRefusal`, so a guard on `clearRefusal` would have closed two of the three paths while reading as though it had closed three. Mutation A failing all three cases together is the measurement, not the reading.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Task 1 needed unit cases the task's `<files>` did not list**

- **Found during:** Task 1, at the `npm run test:coverage:direct` verify.
- **Issue:** The task listed `features/degradedOperation.feature, src/accessories/basementGuardian.ts`, but its own verify demands 100 percent line and branch coverage of `basementGuardian.js`, and the new guard adds a branch that only a credential-rejected trust reaches. Cucumber does not contribute to that measurement. The run reported `99.71% line` and `99.31% branch`, uncovered lines `434-435` — the guard itself.
- **Fix:** Added three unit cases, one per refusal path, plus the helpers they share. `test/accessories/basementGuardian.test.ts` is in the plan's own `files_modified`, so the file was in scope; the task's list was narrower than the task's verify.
- **Verification:** `100.00 / 100.00 / 100.00` on the same command. The same three cases are what prove all three leaking callers closed, which was a success criterion no other artifact would have met.
- **Committed in:** `cc0d23f` (Task 1 commit). **Ledger:** appended as a deviation entry.

---

**Total deviations:** 1 auto-fixed (1 blocking).
**Impact on plan:** The addition was inside the plan's declared file set and produced the evidence for a criterion the plan required. No scope creep.

## Plan premises that did not survive measurement

**None that were wrong.** Two were checked and held:

- The plan corrected an earlier misstatement about `expire()`, saying it calls `republish()` directly at `controls.ts:443` and never reaches `clearRefusal`. **Read and confirmed** at `controls.ts:438-445`, and confirmed again by mutation A killing the expiry case.
- The plan predicted mutation B would make the scenario pass against the defect. **It did**, unlike its counterpart in plan 05-12.

One prediction was stated conditionally and resolved on the null side: the plan allowed that mutation C might fail nothing at task 1 and asked for that to be recorded as a coverage gap task 2 closes. It failed nothing at task 1 and fails three cases after task 2, which is exactly the shape the plan anticipated.

## Issues Encountered

None. The first draft of the connectivity case would have been vacuous — asserting the offline adapter still publishes `CONTACT_DETECTED` when the row already held that value, so mutation F's withheld value would have matched the expectation. Rewritten before it was run: the case now pushes the **opposite** verdict into the row first, so a withdrawal that withheld leaves the wrong reading standing. Mutation F confirms the rewrite works.

## Threat Flags

None. This plan added no network endpoint, no auth path, no file access and no schema change. `package.json` and `package-lock.json` are not in the diff and no package was installed, which closes `T-05-16-SC`.

## Known Stubs

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- CR-02, WR-03 and WR-04 are closed. `05-REVIEW-2.md`'s remaining code findings for this phase are WR-02 and WR-06 (plan 05-17) and WR-01 (plan 05-18).
- Plan 05-17 edits `reportedControlValue` and `reconcileControls` in the same module. Both now run under a wider withdrawal on the credential path: `reportedControlValue` returns `undefined` for every control scope once the credentials are refused, which is why the clearing push falls back to `heldOn`. Worth reading before that plan changes the guard.
- The D-10 real-home item now carries a third moment — the owner's press — and stays open, riding along with `G-003` / `G-004`.

## Self-Check: PASSED

All five modified files exist on disk. All three commits (`cc0d23f`, `baf03b2`, `9e21c8f`) are in the branch history and were each verified by `git show --name-only --format="" HEAD` naming only this plan's own paths. The plan's four `contains` claims are present: `credentialsRejected` in `src/accessories/basementGuardian.ts` and in `test/accessories/basementGuardian.test.ts`, `press after` in `features/degradedOperation.feature`, and `05-16` in `05-VALIDATION.md` fifteen times.

---

_Phase: 05-degraded-operation-and-recovery_
_Completed: 2026-09-02_
