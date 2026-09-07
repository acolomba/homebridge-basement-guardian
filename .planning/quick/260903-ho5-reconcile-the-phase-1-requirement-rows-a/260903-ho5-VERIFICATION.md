---
phase: quick-260903-ho5
verified: 2026-09-03T00:00:00Z
status: gaps_found
score: 5/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "Every status this task changes cites the artifact and the assertion that justifies it."
    status: failed
    reason: >-
      First-round row 2 reads `✅ shipped` on a citation its source does not carry. The cell
      says "05-01 mutation 2 failed 13 unit cases in `monitoringHealth.test.ts`".
      `05-01-SUMMARY.md:241` names no file for mutation 2, and all three cases it does name
      live in `test/runtime/accountRuntime.test.ts`. The mutation itself
      (`isShadowSilent` → `() => !shadowConnected`) is not expressible inside any module the
      row's own command reaches: `shadowConnected` is a local of `src/runtime/accountRuntime.ts`
      and `test/runtime/monitoringHealth.test.ts` imports only
      `src/runtime/monitoringHealth.js` and `src/runtime/clock.js`. The row's own tier therefore
      cannot see its own named mutation, which is the exact condition
      `⚠️ green, blind at this tier` exists for.
    artifacts:
      - path: ".planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md"
        issue: "Line 95, first-round row 2 Status cell: `✅ shipped` with a file attribution the cited summary does not make."
    missing:
      - "Re-run 05-01 mutation 2 and record which module fails, or restate row 2 as `⚠️ green, blind at this tier` naming `test/runtime/accountRuntime.test.ts` and the Cucumber suite as the tiers that carry it."
      - "Correct the cell's file attribution: `05-01-SUMMARY.md:241` names no module for mutation 2."
      - "Correct the First-round reconciliation note's counts if row 2 moves (18 shipped / 2 green → 17 / 3)."
  - truth: "Every status this task changes cites the artifact and the assertion that justifies it."
    status: partial
    reason: >-
      WINDOWS ledger entry 38 and the `### Second-round reconciliation` note both explain the
      22-versus-24 discrepancy as caused by "two prose mentions of the pending marker that are
      not cells". Prose mentions inflate an unanchored count; they cannot make a true 24 read
      as 22. The explanation does not survive arithmetic. The same sentence's own count is
      also now stale: the file holds four prose mentions (lines 119, 206, 703, 745), two of
      them added by this task's own notes.
    artifacts:
      - path: ".planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md"
        issue: "Line 761-765, `**The corrected count.**` paragraph."
      - path: ".planning/WINDOWS.md"
        issue: "Ledger entry 38 repeats the same explanation."
    missing:
      - "Drop the causal claim, or replace it with a measured one. Recording 22-stated against 24-measured needs no explanation to be useful."
      - "Restate the prose-mention count as four, or drop it."
human_verification: []
---

# Quick task 260903-ho5 Verification Report

**Task goal:** reconcile the Phase 1 requirement rows and the Phase 5 validation status cells
against measured evidence, so that every status cell asserts exactly what its evidence carries.

**Verified:** 2026-09-03
**Status:** gaps_found
**Re-verification:** No — initial verification.

## Method

This is a documentation-reconciliation task, so counting cells proves nothing. Every finding below
comes from reading a cell and following its citation to the artifact it names. Where a citation
names a test case, the case was located in the test tree. Where a citation names a mutation, the
mutation was read in the summary that measured it.

All 22 first-round cells and all 24 second-round cells were read against their sources — not a
sample of eight. No source file, test file or build artifact was modified.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The twelve Phase 1 requirement rows carry the status Phase 1 verification measured, in both the checkbox list and the traceability table | ✓ VERIFIED | `REQUIREMENTS.md:10-30` twelve `- [x]`; `:115-127` twelve `Complete`; each has its own `✓ SATISFIED` verdict at `01-VERIFICATION.md:431-445` |
| 2 | Every one of the 22 first-round rows shows whether its named mutation was applied and what it failed | ✓ VERIFIED | 22 rows, 0 pending, `Plan` column names a summary on all 22 |
| 3 | A row whose named mutation left every tier green does not read as shipped, and its cell says what is true instead | ✓ VERIFIED | Rows 9 and 17 carry `⚠️ green` and each names its null result and ledger entry |
| 4 | The second-round rows carry their disposition in the row, not only in an appendix | ✓ VERIFIED | 24 rows, 0 pending; `### Second gap-closure round reconciliation` retained with a pointer line at its head |
| 5 | Every status this task changes cites the artifact and the assertion that justifies it | ✗ FAILED | First-round row 2 (`05-VALIDATION.md:95`) attributes 13 unit-case failures to `monitoringHealth.test.ts`; the cited summary names no module and the three cases it does name live elsewhere. See item 1 below |
| 6 | No file under `src/`, `test/` or `features/` changes | ✓ VERIFIED | `git log --name-only --format="" 9324047..HEAD \| grep -cE '^(src\|test\|features)/'` → 0; `git status --porcelain` → only untracked `.planning/milestone.lock` |

**Score:** 5/6 truths verified.

---

## Item 1 — First-round cells against their mutation evidence

Route used for each row: row → positional entry in `### Named mutations` (`05-VALIDATION.md:559-582`,
22 entries in row order) → the mutation's measured outcome in a first-round summary.

All 22 checked. Twenty-one hold. One does not.

| Row | Mutation | Cell status | Source | Verdict |
|---|---|---|---|---|
| 1 | 05-01 m1 | ✅ shipped | `05-01-SUMMARY.md:240` — 2 of 20 in `monitoringHealth.test.ts` | ✓ exact |
| 2 | 05-01 m2 | ✅ shipped | `05-01-SUMMARY.md:241` — "13 unit cases including …", no module named | ✗ **unsupported, see below** |
| 3 | 05-01 m3 | ✅ shipped | `:242` — 5 of 20 in `monitoringHealth.test.ts` | ✓ exact |
| 4 | 05-01 m4 | ✅ shipped | `:243` — 1 of 20, `leaves the shadow silent when a poll succeeds` | ✓ exact |
| 5 | 05-01 m5 | ✅ shipped | `:244` — six offline-adapter cases + 2 Cucumber scenarios on the Offline assertion | ✓ exact; Cucumber is the row's tier |
| 6 | 05-01 m6 | ✅ shipped | `:245` — `Polling failure alone leaves the live values trustworthy` | ✓ exact |
| 7 | 05-01 m7 | ⚠️ shipped, blind to CR-01 | `:246` — 4 of 5 new scenarios; audit at `4631d46` | ✓ exact |
| 8 | 05-01 m8 | ⚠️ shipped, blind to CR-02 | `:247` — 1 of 83, its own scenario; audit marks it CR-02 | ✓ exact |
| 9 | 05-02 m1b | ⚠️ green, blind at this tier | `05-02-SUMMARY.md:214` — Cucumber green 4/4, `platform.test.ts` alone | ✓ exact; `05-VERIFICATION.md` M11 corroborates at 5 unit / 0 scenarios |
| 10 | 05-02 m2 | ✅ shipped | `:215` — `A restart retains the values it marks stale` on `Water Level` | ✓ exact |
| 11-13 | 05-03 m7, m8, m9 | ✅ shipped | `05-03-SUMMARY.md:263-265` | ✓ exact, all three |
| 14 | 05-03 m1 | ✅ shipped | `:257`; case located in `test/accessories/controls.test.ts` | ✓ file attribution confirmed by grep |
| 15 | 05-03 m2 | ✅ shipped | `:258` — 9 cases across `controls.test.ts` and `basementGuardian.test.ts` | ✓ exact |
| 16 | 05-03 m3 | ✅ shipped | `:259`; case located in `controls.test.ts`; the "179" is `05-03-SUMMARY.md:248` | ✓ exact |
| 17 | 05-03 m4 | ⚠️ green, mutation failed nothing | `:260` — "**Nothing.** 1269 unit tests and 87 scenarios all passed" | ✓ exact; see item 7b |
| 18 | 05-03 m5 | ✅ shipped | `:261` — 1 of 1269 in `accountRuntime.test.ts` | ✓ exact |
| 19 | 05-03 m6 | ✅ shipped | `:262` — 4 cases in `basementGuardian.test.ts` + 10 scenarios | ✓ exact |
| 20 | 05-04 m1 | ✅ shipped | `05-04-SUMMARY.md:291` — `serviceCatalogue.test.ts` and `staleMarking.test.ts` by name | ✓ exact; both are the row's own command |
| 21 | 05-04 m2 | ✅ shipped | `:292` — 2 cases in `platform.test.ts`, credential scenario green as control | ✓ exact |
| 22 | 05-05 | ✅ shipped | `05-05-SUMMARY.md:143` — 62 tests, 61 pass, 1 fail; case located in `test/config.test.ts` | ✓ exact |

### 🛑 BLOCKER — first-round row 2 asserts more than its evidence carries

**The cell** (`05-VALIDATION.md:95`):

> `✅ shipped — 05-01 mutation 2 failed 13 unit cases in monitoringHealth.test.ts and 24 scenarios`

**The evidence** (`05-01-SUMMARY.md:241`):

> `13 unit cases including reports the shadow silent once two heartbeats have passed with no message,
> reports the shadow trusted over the same span once a message reached the reported-patch callback,
> reports the silent live connection once across three silent polls inside one reminder interval;
> 24 Cucumber scenarios`

Three checks, each re-runnable:

1. The summary names **no module** for mutation 2. Every other 05-01 mutation entry that failed a
   unit case names one. The `monitoringHealth.test.ts` attribution in the cell has no source.

2. All three cases the summary does name live in a different file:

   ```bash
   grep -rln "reports the shadow silent once two heartbeats have passed with no message" test/
   grep -rln "reports the shadow trusted over the same span once a message reached the reported-patch callback" test/
   grep -rln "reports the silent live connection once across three silent polls inside one reminder interval" test/
   # all three → test/runtime/accountRuntime.test.ts
   ```

3. The mutation is not expressible in any module the row's command reaches. `isShadowSilent` is a
   private function of `src/runtime/monitoringHealth.ts:146`. `shadowConnected` is a local variable
   of `src/runtime/accountRuntime.ts:272`, not in scope in `monitoringHealth.ts`:

   ```bash
   grep -rn "isShadowSilent\|shadowConnected" src/
   sed -n '1,8p' test/runtime/monitoringHealth.test.ts   # imports monitoringHealth.js and clock.js only
   ```

   `test/runtime/monitoringHealth.test.ts` imports only `src/runtime/monitoringHealth.js` and
   `src/runtime/clock.js`. A mutation that reads the socket flag cannot reach that dependency graph.

Row 2's `Automated Command` is `node --test dist-test/test/runtime/monitoringHealth.test.js`. Under
the file's own vocabulary, `✅ shipped` requires the named mutation to fail "a test at the tier the
row's own Automated Command runs". On this evidence it did not. The honest status is
`⚠️ green, blind at this tier`, naming `test/runtime/accountRuntime.test.ts` and the Cucumber suite
as the tiers that carry it.

**Stated honestly: I did not re-run mutation 2.** The finding rests on the three checks above. It is
overturned if a re-run of mutation 2 fails a case in `monitoringHealth.test.ts` — which the import
graph makes hard to see how. Either way the current cell is not supported by the citation it gives.

This is the same shape as ledger entry 33: a status certified against a sentence the artifact does
not carry. Row 2 was the only cell of 46 where it happened.

---

## Item 2 — The four non-shipped first-round rows

All four hold.

**Row 9 → `⚠️ green, blind at this tier`.** `05-02-SUMMARY.md:214` records mutation 1b — "the row's
literal wording" — deleting the `configureAccessory` call site: "`platform.test.ts` … **Cucumber
stayed green at 4/4 restart scenarios**". The row's command is `npm run test:cucumber`. The cell
also states, correctly, that form 1a *did* fail both restart scenarios (`:213`), so only the
call-site half is blind. `05-VERIFICATION.md:230` (M11) independently re-measured 5 unit / 0
scenarios. ✓ The status is the right one and the cell does not overstate the blindness.

**Row 17 → `⚠️ green, mutation failed nothing`.** `05-03-SUMMARY.md:260` reads "**Nothing.** 1269
unit tests and 87 scenarios all passed". ✓ Exact quotation, correct status. See item 7b for the
judgment question.

**Rows 7 and 8 → `⚠️ shipped, blind to CR-0N`.** Both halves of the definition hold for each:

- Row 7: `05-01-SUMMARY.md:246` — mutation 7 failed "Cucumber — 4 of the 5 new scenarios", the row's
  own tier. `git show 4631d46:…05-VERIFICATION.md` line 298 marks
  `Shadow silence withdraws trust while polling continues` "⚠️ BLIND to CR-01".
- Row 8: `05-01-SUMMARY.md:247` — mutation 8 failed exactly `An identical heartbeat clears the
  shadow silence`, 1 of 83, the row's own tier and own scenario. The audit marks that scenario
  "⚠️ BLIND to CR-02. Runs under `a short poll interval`".

Neither was written down to a `⚠️ green` string, which is the understatement failure the plan
warned against. ✓

---

## Item 3 — The rows 5 / 7 judgment call

**The executor is right. Row 5 is plain `✅ shipped` and the blind assertion belongs to row 7 alone.**

Four independent checks agree:

1. **The audit names one assertion, and it is row 7's.** `git show 4631d46:…05-VERIFICATION.md`:

   > ⚠️ BLIND to CR-01. It polls with the SAME telemetry and asserts `the "Sump Pit Flood" sensor is
   > not activated` after a DRY poll, which passes either way

   Row 7's Secure Behavior is the `Sump Pit Flood` retained-value clause. Row 5's is
   `A monitoring-path failure never activates Basement Guardian Offline`.

2. **The scenario's four closing assertions are transcribed faithfully.**
   `git show 4631d46:features/degradedOperation.feature` ends the scenario on `Status Active false`
   / `Sump Pit Flood sensor is not activated` / `Offline Status Active true` /
   `Offline sensor is not activated` — exactly the four the SUMMARY lists, in order. Row 5's own
   assertion is the fourth, which the audit does not name.

3. **The decisive check, which the SUMMARY does not make and I did.** Row 5's assertion is not
   merely unnamed by the audit — it is demonstrably *not* blind, because a mutation moved it.
   `05-01-SUMMARY.md:244` records mutation 5 failing both `Shadow silence withdraws trust while
   polling continues` and `Both monitoring paths lost withdraws every scope`, "both on
   `Then the "Basement Guardian Offline" sensor is not activated`". An assertion that a mutation
   kills is by definition not one that "passes either way". Marking row 5 blind would have been
   contradicted by the row's own mutation result.

4. **Probe P3 corroborates by execution.** `4631d46` line 275: "A monitoring failure never activates
   the two device adapters | P3 | both down: `offline = 0 link = 0` | ✓ PASS", and line 181 quotes
   the SC-2 row verbatim as the SUMMARY does: "both contacts stay `0` with both transports
   down — that part is real".

The plan's premise of "about three blind rows" was measured false and the correction is right.

---

## Item 4 — Second-round cells

All 24 read against the matching `### Plan 05-NN rows` and `### Plan 05-NN mutations` subsections.
All 24 hold.

**22 `✅ shipped`.** Sampled and confirmed exact against their subsections: 05-13 rows against
mutations A / C / E (`:303`, `:305`, `:307`); 05-14 rows against mutations A and E (`:344`, `:348`);
05-15 rows against mutations A, C and D (`:387`, `:389`, `:390`); 05-16 rows against mutations A, D,
F and E (`:436`, `:440`, `:442`, `:441`); 05-17 rows against mutations A, D and G (`:479`, `:482`,
`:485`); 05-18 rows against mutations A, A2, D, H and G (`:522-531`); the two 05-19 documentation
rows against their named code assertions. Two file attributions the subsections omit were confirmed
by grep — `WR-02 returns the Switch to the value the device reported…` and `WR-06 resolves a request
the device confirmed…` both live in `test/accessories/basementGuardian.test.ts`, which is those
rows' own module.

**The 05-14 WR-05 row → `⚠️ green, blind at this tier`. Correct, and it is the subtler of the two.**
The row's named mutation is B ("Release every stored device whenever any one is silent"). `:345`
records it killing the scenario at `features/degradedOperation.feature:211` and names no unit case.
The row's `Automated command` is `npm run test:coverage:direct -- … dist-test/test/device/state.test.js`
— the unit tier. Mutation fails only e2e; row runs only unit. That is the definition, applied
correctly. The cell names mutation F at `state.test.ts:582` and `:609` as the unit-tier pin, which
`:349` confirms.

**The 05-14 CR-01 admit-call row → `⚠️ green, mutation failed nothing`. Correct.** The row's named
mutation is C. `:346`: "**This failed nothing in the new scenario, which passed unchanged.**" The
cell reproduces the structural reason and all six pinning artifacts — five scenario names plus
`goes silent two heartbeats after admission when no message ever arrives` at
`test/runtime/monitoringHealth.test.ts:239` — matching `:346` item for item. Ledger 21 confirmed
`waived` with the same text.

**Zero `⚠️ shipped, blind to CR-0N` in the second round — the executor's reason holds.** Commit
`4631d46`'s audit lists eight tests; the three carrying a literal `BLIND to CR-0N` label are
`Shadow silence withdraws trust while polling continues`, `An identical heartbeat clears the shadow
silence` and `Credential rejection makes every service unreadable`. None of them carries a
second-round row: every second-round row is carried by a test that round wrote, and each row's
`--name` filter names it. The fourth string cannot attach.

**Three facts recorded as attaching to no row — all three claims verified.** 05-17 mutation B is not
named by any of the three 05-17 rows (they name A, D, G) and `:480` confirms it fails one unit case
and no scenario. 05-18 mutations B and D2 are not named by any of the five 05-18 rows (A, A2, D, H,
G) and `:517` states their passing result is the measurement. 05-16 mutation C is not named by any
of the four 05-16 rows (A, D, F, E) and `:439` records it closed by task 2.

---

## Item 5 — Phase 1 transcription

**Twelve rows.** Both locations reconciled; each of the twelve has its own `✓ SATISFIED` verdict at
`01-VERIFICATION.md:433-444`, whose closing paragraph states "**Orphaned requirements:** none". The
phase-level `22/22` was correctly not used as per-row evidence.

**SYNC-03 reads `Phase 1, Phase 5`.** `RES-01` and `RES-03` already use that form (`:149`, `:151`),
so the format is consistent.

**All three qualifications survived, and none is inflated.**

| Qualification | Source | Wording in `REQUIREMENTS.md` | Verdict |
|---|---|---|---|
| AUTH-02 | `01-SECURITY.md` finding 2 | "holds the account email inside the `id_token` payload, because the grant requests the `openid profile email` scope. The file is owner-only and already holds a live bearer token, so the impact is low. The comment in `src/cloud/auth.ts` that says the file never holds the email is inaccurate." | ✓ faithful, including the scope string and the `0o600` fact restated as owner-only. If anything it is *milder* than the source, which the source itself calls low impact |
| SYNC-02 | `01-VERIFICATION.md:20`, `:463` (W10-R) | "the partial merge itself is deduced from the confirmed document shape and a proved pure spread. No probe observed it." | ✓ faithful; the source says "inferred … not observed" and calls it "Sound, but deductive" |
| SYNC-04 | `01-VERIFICATION.md:443` | "rotation and reconnect exercised against fakes. The presigner alone met a real AWS IoT broker" | ✓ faithful; source says "Rotation and reconnect remain fake-exercised" |

**REL-04 is correctly still `Pending`.** `01-VERIFICATION.md:446` marks it `ℹ EARLY COVERAGE` and
states outright "REQUIREMENTS.md maps REL-04 to Phase 6." The reconciliation paragraph reproduces
that reasoning. All nine `REL-` rows stay `Pending`, which is the positive control that the file was
not flipped wholesale:

```bash
grep -cE '^\| [A-Z]+-[0-9]+ \|.*\| Pending \|$' .planning/REQUIREMENTS.md   # → 9
grep -c '^- \[ \] \*\*' .planning/REQUIREMENTS.md                           # → 9, all REL-
```

---

## Item 6 — The mapping disagreement

**The note reports the conflict and does not resolve it.** `05-VALIDATION.md:163-174` gives both
counts — ledger 13 and plan 05-10's "three of those rows" against the audit's six blind-but-green
with three labelled — names which rows the inference lands on (7 and 8), names the one that lands
nowhere (`Credential rejection makes every service unreadable`), and closes "no artifact states it.
This task does not pick one source over the other." ✓

**The credential scenario is recorded as a missing row, not a status.** `:176-178`: "The first round
never wrote an end-to-end row for the credential refusal … It is a hole in the map, not a status on
a row." ✓

**The falsehood did not reappear.** The note says the opposite of the forbidden sentence:

> The scenario is executed by the bare `npm run test:cucumber` that rows 5 through 10 carry, because
> that command runs the whole suite with no name filter; no row states the behaviour it covers.

Verified against the table: rows 5-10 (`05-VALIDATION.md:98-103`) all carry `npm run test:cucumber`
with no `--name` filter. The criterion is stated as subject matter, exactly as required. ✓

**One check the note makes that I confirmed independently.** The audit's blind-but-green count of 6
is correct as stated: `git show 4631d46:…05-VERIFICATION.md` line 307 reads "**Blind-but-green tests
on phase-central behaviour:** 6", and the table above it holds exactly three `BLIND to CR-0N`
labels. ✓

---

## Item 7 — The two premises the executor measured false

### 7a. The blind-row count: 2, not ~3

Confirmed. See item 3. The plan explicitly delegated the decision ("Read the scenario and decide
which of the two rows the blind assertion belongs to") and set its floor at `blind>=2` for exactly
this. The executor read it, decided, and wrote the reasoning into the file rather than only into the
SUMMARY. That is the behaviour the plan asked for.

### 7b. Row 17 — my answer: **keeping the cell is right, and it does not understate. But it is the weakest cell in the file.**

The facts. `05-03-SUMMARY.md:260` records mutation 4 failing nothing. `05-VERIFICATION.md:231` (M12)
re-ran the identical mutation on 2026-09-03: "`!halted` dropped from `commandTransportReadyNow()` |
2 unit, 1 scenario | load-bearing — **contradicts WINDOWS ledger 2**". Section 2 at `:320-324` says
so in full.

**Why keeping the warning is the only status the evidence supports.** The upgrade candidate is
`✅ shipped`, which requires the mutation to fail a test at the tier the row's own command runs —
`node --test dist-test/test/runtime/accountRuntime.test.js`. **M12 names no module for its 2 unit
cases.** Every neighbouring M-row in that table is equally unattributed. So the record cannot say
whether today's failures land in `accountRuntime.test.ts` (→ `✅ shipped`) or in 05-16's
`basementGuardian.test.ts` cases (→ `⚠️ green, blind at this tier`). Upgrading on M12 would have
been an inference dressed as a measurement — the precise failure this task exists to repair. The
executor's stated reason (a row is a claim about its own named test and its own named mutation) is a
sound rule; this stronger reason also holds and reaches the same cell.

**Where it is weak.** The vocabulary defines the string in the present tense — "the named mutation
left every tier green" — and the cell's own body says two sentences later that the mutation now
fails 2 unit cases and 1 scenario. The status string and the cell body are in different tenses. No
reader is misled, because the cell states the whole thing plainly and names ledger 37, which is the
right outcome. But a reader skimming the Status column alone gets a fact that stopped being true.

**Recommendation, not a gap.** If the row is ever touched again, the cheap fix is to date the
string — "`⚠️ green, mutation failed nothing (as measured 05-03)`" — or to re-run M12 and record the
module, which would settle the row outright. I would not open a gap for it: the cell carries its own
correction, and the plan's rule against upgrading on later coverage is the right rule.

---

## ⚠️ WARNING — an explanation that does not survive arithmetic

`05-VALIDATION.md:761-765` and WINDOWS ledger entry 38 both say:

> Entry 32 says twenty-two rows in this table read pending. The measured count is twenty-four. The
> file also holds two prose mentions of the pending marker that are not cells, **which is the
> likeliest source of the difference.**

Prose mentions inflate an unanchored count. They cannot make a true 24 read as 22. The stated cause
runs the wrong direction and no arrangement of it reaches 22.

The same sentence's count is also stale. Four prose mentions exist now, two of them written by this
task's own notes:

```bash
grep -nE '^[^|]*⬜ pending' .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md
# 119 (new), 206 (pre-existing), 703 (pre-existing), 745 (new)
```

The correction itself — 22 stated, 24 measured, split 3/4/3/4/3/5/2 by plan — is right and needs no
explanation to be useful. The hedge "likeliest" keeps this out of blocker territory, but it puts an
uncheckable causal guess in a permanent record beside a measured fact, which is the register this
task was built to avoid.

---

## Things I checked that fail nothing

- **The `Task ID` column still reads `TBD` on all 22 first-round rows.** Pre-existing:
  `git show 9324047:…05-VALIDATION.md | grep -c '^| TBD | TBD |'` → 22. The plan asked only for the
  `Plan` column, which is now filled on all 22 (`grep -cE '^\| TBD \| 05-0[1-5] \|'` → 22). The
  SUMMARY's phrase "none kept `TBD`" is about the `Plan` column and is accurate there, though a
  reader could take it as covering `Task ID`. No debt marker in the anti-pattern sense.
- **No blank line between the vocabulary paragraph and the first-round table header**
  (`05-VALIDATION.md:91` / `:92`). `.pre-commit-config.yaml` excludes `^\.planning/` from `mdformat`
  and `markdownlint-cli2`, so no gate sees it, and no renderer was available here to test whether
  GitHub still splits the paragraph. Cosmetic at worst; recorded so it is not rediscovered.
- **Plan 05-10's paragraph.** Put into the past tense ("still read `⬜ pending` **when this plan
  ran**"), marked "**Superseded 2026-09-03.**", pointed at the new note, reasoning intact and nothing
  deleted (`:204-212`). Exactly what prohibition 8 asked.
- **Plan 05-19's appendix.** `### Second gap-closure round reconciliation` retained in full with one
  pointer line added at its head (`:798-800`). Nothing removed.
- **Ledger.** 12, 13, 32 read `fixed`; 36, 37, 38 appended and open; `open_count` 11, `total_count`
  38. Entry 36 quotes `STATE.md` lines 50, 291 and 386 — all three quotations verified exact against
  the file.
- **Commit hygiene.** Four commits since `9324047`, none touching `src/`, `test/` or `features/`;
  working tree clean apart from the untracked `.planning/milestone.lock`, which was correctly never
  staged.
- **Cell counts.** `⬜ pending` on a table row: 0. Four vocabulary strings on table rows: 132 =
  86 + 22 + 24. First-round region: 18 / 1 / 1 / 2. Second-round region: 22 / 1 / 1 / 0. Every
  number in the SUMMARY's two count tables reproduces.

---

## Gaps Summary

Forty-five of forty-six reconciled cells assert exactly what their evidence carries. The twelve
Phase 1 rows are backed row by row rather than by the phase score, and all three qualifications
survived without inflation. The two judgment calls the plan left open — rows 5/7, and row 17 — were
both decided correctly, and the row 5 decision is stronger than the SUMMARY argues, because row 5's
assertion was itself killed by a mutation and so cannot be one that "passes either way".

One cell fails. First-round row 2 reads `✅ shipped` on a file attribution its cited summary does not
make, and the row's own test module cannot reach the mutation the row names. That is one cell out of
forty-six, and it is the exact defect class the task was commissioned to repair, so it should be
closed rather than waived.

One note carries a causal explanation that runs backwards arithmetically, in the file and in ledger
entry 38. Low cost to fix: delete the guess, keep the measurement.

---

*Verified: 2026-09-03*
*Verifier: Claude (gsd-verifier)*
