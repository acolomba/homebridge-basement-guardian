---
phase: 05-degraded-operation-and-recovery
plan: 18
subsystem: testing
tags: [credential-refusal, push-ordering, static-gate, discovery-context, homekit, gap-closure]

requires:
  - phase: 05-degraded-operation-and-recovery
    provides: "05-16's wider trust withdrawal under a refused credential, which is why a real accessory republishes `false` before the error lands"
  - phase: 05-degraded-operation-and-recovery
    provides: "05-17's committed tree and its green gate, this plan's baseline"
provides:
  - "An ordering case that fails when the credential-refusal push order is inverted, driven through a real accessory bound to the accessory the error push walks"
  - "A companion case asserting the two push orders read differently over one fixture, so a vacuous fixture is caught by the suite rather than by an executor's report"
  - "One `DiscoveryContext` literal in the platform, and a static gate counting `DiscoveryContext`-shaped object literals rather than mentions of a field name"
  - "The marking pass named and documented for the services it reaches"
  - "One log line when a credential refusal marked nothing at all, and silence when it marked something or had nothing to mark"
  - "Closure of `05-REVIEW-2.md` WR-01, WR-07 and the code half of WR-08"
affects: [platform composition root, credential-refusal presentation, staleMarking callers]

actuals:
  tokens: 33000
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "A static gate marks on the shape of a literal -- every member in key position, in declaration order, with no intervening brace -- rather than on the name of one field, so a property read cannot match it and a re-inlined literal must"
    - "A gate ships its own negative control beside its planted violation: the planted second literal must move the count and a planted property read must not"
    - "A case that reads one fixture under both orders and asserts the readings differ is the automated substitute for an executor's report of a manual mutation"
    - "A collaborator that must not be captured at composition time arrives as a parameter, so the compiler enforces the prohibition the comment states"

key-files:
  created: []
  modified:
    - src/platform.ts
    - src/accessories/staleMarking.ts
    - test/platform.test.ts
    - test/accessories/staleMarking.test.ts
    - test/accessories/basementGuardian.test.ts
    - .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md
    - .planning/WINDOWS.md

key-decisions:
  - "Put the static gate in `test/platform.test.ts` rather than in a new file. The plan's own `<verify>` for task 2 runs the platform coverage pair, and a gate in a separate file would not be run by the command that was supposed to prove it; `files_modified` names the same file."
  - "Passed the command port to the context helper as a parameter instead of reading `runtime.commands` from its closure. `@typescript-eslint/no-use-before-define` rejects the closure form -- the helper has to be declared above the seam whose callbacks call it, which puts its `runtime` reference above the declarator. The parameter is also the harness shape, and it strengthens the prohibition: mutation F now fails the typechecker, the linter and nine runtime cases rather than only the last."
  - "Reported the zero only when the accessory map is non-empty. A launch the vendor refused before the first inventory has nothing to mark and nothing is wrong with that; the condition worth naming is a cache holding accessories and no trust report on any of them. The empty case has its own passing test, and mutation H fails it."
  - "Renamed to `markTrustReportsUnreadable` rather than `markServicesNotVouchedFor`. The verb has to match its object -- the pass makes the trust report unreadable, not the service -- and the second name says what the state is rather than what the pass does."

patterns-established:
  - "The shape detector: `MEMBERS.map((name) => `\\b${name}:`).join('[^{}]*')` over comment-stripped source counts literals of a declared type, and its expected count is the number of literals plus one for the interface body"
  - "The order-sensitivity companion: one fixture read under both orders, asserted to differ, fails on exactly the vacuity a single-order case cannot see"

requirements-completed: [RES-04]

coverage:
  - id: D1
    description: "Inverting the credential-refusal push order fails a unit case, so an edit that reorders the two loops cannot ship a normal-looking accessory over a permanently refused account"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/platform.test.ts#leaves the pushed status standing over an accessory that republishes its own rows"
        status: pass
    human_judgment: false
  - id: D2
    description: "The fixture that ordering case reads is order-sensitive, and the suite says so on its own rather than relying on an executor's report of a manual mutation"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/platform.test.ts#reads a different trust report under each push order, which is what makes the ordering case able to fail"
        status: pass
    human_judgment: false
  - id: D3
    description: "The recording case still pins what it was built to pin -- every accessory in the map hears the same account-wide answer -- and its comment now says so"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/platform.test.ts#leaves the pushed status standing after the boolean fan-out has run"
        status: pass
    human_judgment: false
  - id: D4
    description: "The platform builds its runtime context once, and a second `DiscoveryContext`-shaped literal fails a gate that counts literals rather than mentions of a field name"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/platform.test.ts#holds exactly one DiscoveryContext-shaped literal beside the declaration it satisfies (WR-07, D-12)"
        status: pass
      - kind: unit
        ref: "test/platform.test.ts#reports a planted second literal and stays still for a planted property read (WR-07)"
        status: pass
    human_judgment: false
  - id: D5
    description: "A field dropped from the single literal is a compiler error rather than a silent behavioural difference between the discovery path and the monitoring path"
    requirement: RES-04
    verification:
      - kind: other
        ref: "npm run typecheck"
        status: pass
    human_judgment: false
  - id: D6
    description: "The marking pass reaches exactly the services carrying a trust report, adds a characteristic to none, and is named and documented for that"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/staleMarking.test.ts#counts every service that reports whether the plugin vouches for it, and leaves one that never did alone"
        status: pass
    human_judgment: false
  - id: D7
    description: "An operator is told once when a credential refusal marked nothing at all, and told nothing extra when it marked something or had nothing to mark"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/platform.test.ts#tells an operator when a credential refusal reached no service at all"
        status: pass
      - kind: unit
        ref: "test/platform.test.ts#says nothing extra when the refusal marked the services it reached"
        status: pass
      - kind: unit
        ref: "test/platform.test.ts#says nothing for a refusal that arrived before this run had any accessory to mark"
        status: pass
    human_judgment: false
  - id: D8
    description: "An owner running a real Homebridge over a cache an older release wrote sees the new line in the log and can act on it"
    verification: []
    human_judgment: true
    rationale: "Whether the line reaches an owner and reads as actionable in a real Homebridge log cannot be asserted from the plugin side. The plugin-side half is pinned by D7; the line's readability rides along with the open `G-003` / `G-004` real-home session."

duration: 74min
completed: 2026-09-03
status: complete
---

# Phase 5 Plan 18: The Ordering Case That Can Fail Summary

**A credential-refusal ordering case driven through a real accessory so an inverted push order fails at the unit tier, one `DiscoveryContext` literal behind a shape-marked static gate, and a marking pass named for the trust report it reaches with a line for the refusal that reaches nothing.**

## Performance

- **Duration:** 74 min
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Inverting the two loops in `applyMonitoringHealth` now fails a named unit case. The same inversion left all 1348 unit tests green when the review ran it, and all 1378 at this plan's own baseline.
- The companion case turns the discriminating property into an assertion the suite makes on its own: one fixture read under both push orders, asserted to differ. Built on the recording stand-in it fails, which is exactly the vacuity nobody caught.
- The platform assembles its runtime context in one local function. A static gate counts `DiscoveryContext`-shaped object literals, plants a second one to prove it is not vacuous, plants a property read to prove it does not count mentions, and asserts a floor on the bytes it read.
- `markServicesUnreadable` is `markTrustReportsUnreadable`, and its docblock says what the walk reaches.
- A credential refusal that marked nothing on any accessory logs one line. One that marked something, or had nothing to mark, says nothing.

## Task Commits

1. **Task 1: the fan-out ordering fails at the unit tier when it is inverted** — `df48ed1` (test)
2. **Task 2: one context literal, and a gate that fails when a second appears** — `7139a05` (refactor)
3. **Task 3: the marking pass is named for what it does, and says when it reached nothing** — `1c459d4` (fix)

**Records:** `53e53d9` (docs: validation rows, mutation table, ledger)

## Suite counts

| Point | Node | Unit | Cucumber |
|---|---|---|---|
| Baseline (`3d6128e`) | v26.7.0 | 1378 pass / 0 fail | 102 scenarios, 1120 steps |
| After task 1 | v26.7.0 | 1380 pass / 0 fail | 102 scenarios, 1120 steps |
| After task 2 | v26.7.0 | 1382 pass / 0 fail | 102 scenarios, 1120 steps |
| After task 3 | v26.7.0 | 1385 pass / 0 fail | 102 scenarios, 1120 steps |
| After task 3 | v22.22.2 | 1385 pass / 0 fail | 102 scenarios, 1120 steps |

Every unit of movement is accounted for: task 1 added 2 cases (the real-accessory ordering case and
the order-sensitivity companion), task 2 added 2 (the literal count and its planted controls), task 3
added 3 (the zero-count line, the marked-and-silent case, the empty-account case). 1378 + 2 + 2 + 3 =
1385. No case was removed, renamed or moved.

`npm run test:coverage:all` reports 100.00 line, 100.00 branch and 100.00 function coverage over
`src/` on **both** installed Node versions. **Node 24 is not installed on this machine and nothing is
claimed about it.**

## Mutation A, verbatim — the finding

The plan's central claim, quoted exactly as the runner printed it.

**Before.** `05-REVIEW-2.md` WR-01 records that inverting the two loops left **all 1348 unit tests
green** when the reviewer ran it, and only 2 Cucumber scenarios caught it. Re-measured at this plan's
own baseline the same inversion left **all 1378** green.

**After.** The mutation ran the error push before the boolean fan-out. Counts moved from **1380 pass
/ 0 fail** to **1379 pass / 1 fail**:

```
✖ failing tests:

test at dist-test/test/platform.test.js:1050:5
✖ leaves the pushed status standing over an accessory that republishes its own rows (8.009534ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

    [
      {
        leakDetected: {
          threw: undefined,
          value: 0
        },
        statusActive: {
  +       threw: undefined,
  -       threw: -70402,
          value: false
        }
      }
    ]
```

The failing test is `leaves the pushed status standing over an accessory that republishes its own
rows`, printed at `dist-test/test/platform.test.js:1050:5` (the source case is at
`test/platform.test.ts:1085`). The diff is the whole finding in one line: with the order inverted the
trust report answers a **value** where a **status** should stand — `threw: undefined` where
`threw: -70402` was expected — so the tile reads normally over an account the vendor has refused for
good.

**Mutation B, the same inversion, at the same run.** `leaves the pushed status standing after the
boolean fan-out has run` stayed **green**, together with the two other fixture-driven refusal cases.
That is the direct measurement behind WR-01: the case whose comment claimed to pin the ordering
cannot see the inversion, and the case beside it now can.

## Mutation A2 — is the companion case genuinely order-sensitive?

Yes. Rebuilding its second fixture on `recordingBasementGuardianAccessory` — the stand-in that pushes
nothing — fails it:

```
✖ reads a different trust report under each push order, which is what makes the ordering case able to fail
  AssertionError [ERR_ASSERTION]: Expected "actual" not to be strictly deep-equal to:

  [
    -70402
  ]
```

Both orders read `[-70402]`. A fixture that republishes nothing reads identically whichever way round
the two acts run, so the case cannot see the difference it asserts and fails. That is the automated
signal that separates an ordering case that can fail from one that cannot, and it is what stops this
plan resting on an executor's word about a mutation they applied by hand.

## The detector's counts, as I measured them

Both numbers were re-derived by running the detector, not copied from the plan.

| When | Count | What it is |
|---|---|---|
| `src/platform.ts` at `3d6128e`, before any change | **4** | the `DiscoveryContext` interface body plus three inline literals |
| The same file after task 2 | **2** | the interface body plus one literal |
| With one literal re-inlined (mutation D) | **3** | the gate fails, naming the file and both counts |
| With one extra property read spliced in (mutation D2) | **2 → 2** | **the count does not move** |

Both figures match what the plan measured at `b67d030`, so there was nothing to reconcile.

**Mutation D2 is the point of the whole exercise.** A gate marked on `basementGuardianAccessories`
would answer ten lines in `src/platform.ts`, of which only three were literals; it would move when an
unrelated edit added a property read and would not move for a re-inlined literal spelling a field
differently. The shape detector matches the nine members in key position, in declaration order, with
no intervening brace, so `context.basementGuardianAccessories.get(uuid)` cannot match it. The control
ships as a permanent case beside the planted second literal, so it is re-run on every edit rather
than measured once by me.

The gate also asserts a floor of 20000 bytes on what it read (`src/platform.ts` holds 28077), for the
reason `hapImportScope.test.ts` gives: a gate that silently reads nothing reports the same green as
one that read everything.

## Every mutation, with what it broke

| Mutation | What it did | Result |
|---|---|---|
| **A** | Ran the error push before the boolean fan-out | Fails `leaves the pushed status standing over an accessory that republishes its own rows` at `dist-test/test/platform.test.js:1050`. 1379 pass / 1 fail |
| **A2** | Built the companion's second fixture on the recording stand-in | Fails `reads a different trust report under each push order…` on `notDeepStrictEqual [ -70402 ]` |
| **B** | The same inversion as A | **The recording case stayed green**, with the two other fixture-driven cases. This is a passing result and it is the measurement |
| **C** | Deleted the walk over `context.accessories` | Fails **4** platform cases including the new one; `npm run build:test` also refuses the file on the now-unused import. The new case is not a duplicate of the ones that existed |
| **D** | Re-inlined the literal in `onMonitoringHealth` | Fails the gate: `src/platform.ts holds 3 DiscoveryContext-shaped literals where 2 are expected` |
| **D2** | Spliced one extra property read into a copy of the file text | **The count did not move: 2 → 2.** A passing result, and the one a name-count gate would have failed |
| **E** | Dropped `offlineConfirmationPollCount` from the one literal | `npm run typecheck` fails: `src/platform.ts(504,79): error TS2741: Property 'offlineConfirmationPollCount' is missing in type … but required in type 'DiscoveryContext'` |
| **F** | Hoisted the context to a `const` above the runtime seam | Fails on three layers: `TS2448: Block-scoped variable 'runtime' used before its declaration` and `TS2454`; `no-use-before-define`; and **9** platform cases at runtime on the temporal dead zone |
| **G** | Dropped the `testCharacteristic` guard from the shared walk | Fails `counts every service that reports whether the plugin vouches for it, and leaves one that never did alone` with `marked: 4` against `2` and `carriesTrust: true` against `false`. **11 of the module's 18 cases fail**, because the guard is shared by all three passes |
| **H** | Logged the zero-count line whatever the count | Fails **2** cases: `says nothing extra when the refusal marked the services it reached` and `says nothing for a refusal that arrived before this run had any accessory to mark` |

**No mutation in this plan failed nothing.** Two of the ten are pinned by a passing result rather than
a failing one — B and D2 — and both are recorded as the measurements they are rather than as green
ticks.

**One prediction did not survive measurement.** Mutation G's failing count is `marked: 4`, not the
`marked: 3` I first wrote into `05-VALIDATION.md`: the widened walk also reaches
`AccessoryInformation`, which every constructed `PlatformAccessory` carries. The record was corrected
to the measured number before it was committed.

## What the new ordering case asserts on, and how both loops reach it

The assertion reads the `Sump Pit Flood` `LeakSensor` service on the restored `PlatformAccessory`,
through `trustReadsOf`, which drives a real `handleGetRequest()` rather than inspecting the stored
status.

Both loops reach that one object:

- The **error push** walks `context.accessories.values()`, and the accessory is in that map under
  `ACCESSORY_UUID`.
- The **boolean fan-out** walks `context.basementGuardianAccessories.values()`, and the real
  `BasementGuardianAccessory` in that map was built by `createBasementGuardianAccessory` over the
  *same* `PlatformAccessory` object. Its `update(snapshot, 'poll')` publishes the flood row through
  the catalogue under subtype `sump-pit-flood`, which is the subtype `restoredAccessories` seeds, so
  the catalogue reuses the service rather than adding a second one.

That is precisely what `recordingBasementGuardianAccessory` cannot supply: it holds `services: []` and
`update: () => undefined` and pushes nothing, so the services the error push walks are not services it
ever touched.

## Why the two platform cases expect different values under the status

Both comments say this in the code, not only here.

- The fixture-driven case reads `statusActive: { value: true, threw: -70402 }`. That `true` was
  written by `restoredAccessories()` and no accessory ever republished it, because that case holds no
  instance bound to those services.
- The new case reads `statusActive: { value: false, threw: -70402 }`. Plan 05-16 made a refused
  credential withdraw every trust scope, so a real accessory republishes its trust report as `false`
  before the error lands on it.

Measured directly rather than inferred: the flood service holds `StatusActive: true` after the
healthy `update`, and `false` after `markMonitoring` with the credential member set. So the new
case's expected `false` is **not** a value the field already held — it is produced by the act under
test. Two cases that look contradictory and are not will be "corrected" by the next reader unless the
difference is written down, so it is written down in both.

## The new log line

Logged at `error` level, once, only when the refusal marked nothing and the accessory map is not
empty:

> The vendor refused the account credentials. No accessory shows this, because no cached service
> reports whether the plugin vouches for it. Correct the account email and password in the Homebridge
> UI (Plugins -> Basement Guardian -> Settings).

Run through the `simple-english` skill. Three sentences: **6, 15 and 11 words** (the parenthetical
counts as one word under rule 8.5). The longest is 15, inside the 20-word procedural limit. Active
voice throughout, no semicolon, no `-ing` verb, no modal. It quotes no URL, no header value, no token,
no response body and no account identifier (AUTH-02).

**The empty-account case was decided rather than assumed.** An account with no accessories at all is a
zero too, and it says nothing is wrong: a launch the vendor refused before the first inventory has
nothing to mark. The condition worth naming is a cache that holds accessories and no trust report on
any of them, so the guard asks the map size as well as the count, and the empty case has its own
passing test that mutation H fails.

## The recording case's diff

Only its comment changed. The case body, its fixture, its act and its assertion are byte-identical:

```
-  // The ordering inside the fan-out is load-bearing and this is what pins it: an ordinary push clears
-  // a stored status, so an error pushed before `markMonitoring` republished its rows would be
-  // silently undone by the boolean that followed it.
+  // What this case pins is the fan-out's reach, not its ordering: every accessory in the map hears the
+  // same account-wide answer in the same pass that makes the restored accessories unreadable.
+  //
+  // It cannot pin the ordering, and the comment that said it did was wrong. The stand-in pushes
+  // nothing, so the flood services the error push walks are not services it ever touched, and
+  // inverting the two loops in `applyMonitoringHealth` leaves this case green. The case below --
+  // "leaves the pushed status standing over an accessory that republishes its own rows" -- is the one
+  // that pins the ordering, because the instance it drives republishes onto the very services the
+  // error push then marks (WR-01).
   test('leaves the pushed status standing after the boolean fan-out has run', () => {
```

## Every shipped staleMarking case under the new name

`test/accessories/staleMarking.test.ts` changed on three lines only: the import, the `markUnreadable`
helper's call, and the `describe` title. No case body, fixture, act or assertion moved. The module's
18 cases pass unedited, at 100.00/100.00/100.00 coverage over `staleMarking.js`.
`test/accessories/basementGuardian.test.ts` changed on two lines, both the same rename.

## The `05-VALIDATION.md` floor

`grep -c "05-18"` answered **6** immediately before appending, on lines 547, 570, 571, 572, 573 and
574 — the round's revision note plus five seeded table rows and no subsection heading. That is exactly
the number the plan derived its floor of **16** from, so **the floor stands as written**: 6 measured,
plus the 2 subsection headings, plus one line for each of the eight behaviour rows. After appending
the command answers **18**, above the floor.

## Decisions Made

See `key-decisions` in the frontmatter. The one worth restating: the command port is a **parameter**
of the context helper rather than a closure read, because the linter rejects the closure form and the
parameter enforces the "must not become a constant" prohibition through the compiler instead of
through a comment.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The context helper takes the command port as a parameter**
- **Found during:** Task 2
- **Issue:** The plan prescribed a parameterless local function reading `runtime.commands` from its closure. `@typescript-eslint/no-use-before-define` rejects it: the helper must be declared above the `createAccountRuntimeFromConfig` call whose callbacks use it, which places its `runtime` reference above the declarator. Moving the helper below the seam moves the same error onto `discoveryContext`.
- **Fix:** The helper takes `commandPort: CommandPort` and the three callbacks pass `runtime.commands`. Still one literal; still a function, more strongly so. This is also the harness's own shape (`features/support/world.ts` `discoveryContext` takes `commands`), which the plan asked to be followed.
- **Files modified:** `src/platform.ts`
- **Verification:** `npm run lint` clean; mutation F fails on three layers rather than one.
- **Committed in:** `7139a05`

**2. [Rule 3 - Blocking] A fifth caller of the renamed pass**
- **Found during:** Task 3
- **Issue:** The plan listed four files for the rename. `test/accessories/basementGuardian.test.ts` also imports the pass, so the rename could not compile without it.
- **Fix:** Carried the rename through, with no other edit to that file.
- **Files modified:** `test/accessories/basementGuardian.test.ts`
- **Verification:** `npm run typecheck` clean; the module's cases pass unedited.
- **Committed in:** `1c459d4`

**3. [Documented, not fixed] `README.md:151` still overstates the pass**
- **Found during:** Task 3
- **Issue:** `05-REVIEW-2.md` WR-08 names `README.md:151` alongside the function name and docblock. This plan does not list `README.md` in `files_modified`, and its task 3 asks only for the source rename, the docblock and the report.
- **Fix:** None here, deliberately. `05-REVIEW-2.md` CR-04 already prescribes the README rewrite in full; the sentence stays with it. Recorded in the ledger so it is not lost.

---

**Total deviations:** 2 auto-fixed (both blocking), 1 recorded and deferred.
**Impact on plan:** No scope change. Deviation 1 makes the prohibition stronger than the plan asked
for. Deviation 3 leaves one sentence of WR-08 with the finding that already owns it.

## Issues Encountered

**A prediction I wrote before I measured it.** The first draft of the mutation table said mutation G
would report `marked: 3`. Measured, it reports `marked: 4` — the widened walk also reaches
`AccessoryInformation`. The row was corrected to the measured number and the reason recorded before
`05-VALIDATION.md` was committed, and the code and tests were committed separately from the records
so the correction could be made against a clean tree.

## Ledger entries

| Entry | Kind | What it records |
|---|---|---|
| 27 | deviation | The `DiscoveryContext` half of entry 14 (`05-REVIEW.md` WR-05, `05-REVIEW-2.md` WR-07) is closed. **Entry 14 stays open** for its other half, IN-03, which this plan did not touch — the entry could not be split |
| 28 | deviation | The command-port parameter, with the linter rule that forced it |
| 29 | deviation | The fifth caller the plan did not list |
| 30 | deviation | `README.md:151` still overstates the pass; the sentence stays with CR-04 |

## Next Phase Readiness

`npm run check` is green: typecheck, lint, `fallow`, `format:check`, 1385 unit tests and 102 Cucumber
scenarios. `fallow dupes` reports only the pre-existing `features/support/steps/hap.ts` clone group.
`npm run test:coverage:all` is 100.00/100.00/100.00 on both installed Node versions. `git status` is
clean apart from the untracked `.planning/milestone.lock`, which belongs to another session and was
never staged.

The whole-phase review's WR-01, WR-07 and the code half of WR-08 are closed. `README.md:151` is the
one sentence of WR-08 left standing, and it belongs to CR-04.

## Self-Check: PASSED

- `src/platform.ts`, `src/accessories/staleMarking.ts`, `test/platform.test.ts`,
  `test/accessories/staleMarking.test.ts`, `test/accessories/basementGuardian.test.ts`,
  `.planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md` and `.planning/WINDOWS.md`
  all exist on disk.
- All four commits verified by content with `git show --name-only --format="" HEAD`, never by a
  reported hash: `df48ed1`, `7139a05`, `1c459d4`, `53e53d9`.
- Every plan-level `<verification>` command re-run on the final tree.

---
*Phase: 05-degraded-operation-and-recovery*
*Completed: 2026-09-03*
