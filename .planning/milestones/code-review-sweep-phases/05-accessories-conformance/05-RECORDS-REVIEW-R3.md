---
phase: 05-accessories-conformance
batch: RECORDS
review_round: 3
reviewed: 2026-10-18T03:31:00Z
depth: deep
source_revision: eb762e4774ea5e8203062d30fc759a0421243de5
files_reviewed: 9
files_reviewed_list:
  - src/accessories/pumpRecords.ts
  - test/accessories/pumpRecords.test.ts
  - src/accessories/reconciliation.ts
  - test/accessories/reconciliation.test.ts
  - src/accessories/staleMarking.ts
  - test/accessories/staleMarking.test.ts
  - src/persistence/accessoryContext.ts
  - test/platform.test.ts
  - src/runtime/accountRuntime.ts
findings:
  blocker: 0
  warning: 0
  total: 0
status: clean
reviewer: gsd-code-reviewer (correction round 3)
---

# Phase 5 RECORDS batch: correction round 3

Revision `eb762e4774ea5e8203062d30fc759a0421243de5` equals `git rev-parse HEAD`. `git status --porcelain`
was empty before the review started and after the last command. I read every line of the six core
files fresh and in full at this revision. For the three adaptation rows, I read the hunks changed
since the batch base `0c0930e890cb41e74d0d4e854ba45c41a31fea4a` and their enclosing declarations:
`PumpObservation` and `ActivationWatermarks` in `src/persistence/accessoryContext.ts` (`:32-102`); the
case `asks Homebridge to store the accessory whose snapshot counted an activation, and no other` in
`test/platform.test.ts` (`:3219-3345`, hunk at `:3319`); and the `createReconciliation` call in
`createAccountRuntime` in `src/runtime/accountRuntime.ts` (`:346`). The rest of those three files
belongs to their owning phases. Since the round-2 revision `07a232e`, the source changes are the
038 reorder and comment lines in `src/accessories/pumpRecords.ts`, comment lines in
`src/accessories/staleMarking.ts`, and two added test blocks in `test/accessories/pumpRecords.test.ts`.
None of the three adaptation files changed.

I applied the three `.agents/skills/` books (each `SKILL.md` with every file in `rules/`). Where the
`.claude/rules/*.md` copies differ from them, `.agents/skills/` wins. Severities follow each book's
"Classifying findings" section. There is no Info tier. I checked every comment and JSDoc block in
the six core files and in the adaptation declarations, clause by clause, against the code and its
callers (`src/accessories/serviceCatalogue.ts:980-1009`, `src/platform.ts:442-465`,
`src/accessories/controls.ts`, `features/lib/hap.ts`, `node_modules/homebridge/dist/logger.d.ts:24-33`
and `node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:1683-1713`).

I ran one read-only probe of the compiled module `dist-test/src/accessories/pumpRecords.js` with
made-up inputs (`r3-probe.mjs`, in the session scratch directory, exit 0). I changed no source or
test file, ran no mutation experiment, made no commit and used no stash. The only file I wrote in
the repository is this report. I deleted the ESLint cache under `node_modules/.cache/eslint/` before
the lint run, as `.agents/skills/local-verification/rules/commands.md` directs for a fresh lint.

## Round status

Opening open IDs: 4 (CR-05-RECORDS-038 to 041). Result: 4 fixed, 0 still open. Earlier fixed IDs
CR-05-RECORDS-001 to 031 and 033 to 037: all still fixed, 0 reopened. CR-05-RECORDS-032 stays
rejected by the maintainer's decision. I judged only whether the comments describe it truly, and
they do (`pumpRecords.ts:309-321`, `pumpRecords.test.ts:288-294`).

| ID | Status | Evidence at `eb762e4774ea5e8203062d30fc759a0421243de5` |
| --- | --- | --- |
| CR-05-RECORDS-038 | fixed | `src/accessories/pumpRecords.ts:379-382` reconciles the backup timestamp before the backup edge block (`:384-389`), and classification stays last (`:391`). The regression case `reads a timestamp advance that arrives with a backup edge as an earlier run` (`test/accessories/pumpRecords.test.ts:683-705`) asserts the whole `records.backup` and the stored mark after the second running observation: count 2, `lastActivationAt` `OBSERVED_NEXT_AT`, no label, mark `true`. The old order gives count 1, mark absent and label `true`, so the case fails it. The probe confirms the other two outcomes of the same reorder: R2's S-B (a fresh record whose edge brings the first timestamp, then the run's own) now counts 1 (`activationCount: 1, lastActivationAt: 20`); a watched run A whose timestamp arrives on the next run B's edge is absorbed for A, and B awaits its own (count 2, then B's own timestamp absorbed; with A's settled self-test pair on B's edge, the label stays absent while B runs). The comments at `:291-299`, `:31-36` and `:379-381` state the rule as the code applies it. |
| CR-05-RECORDS-039 | fixed | `pumpRecords.test.ts:215-248`: one sibling `test()` per pump from typed rows (`UndecodedRunRow`), each driving `false`, `true` at `OBSERVED_NEXT_AT`, an undecoded running value, then `true`, and asserting the whole pump record (count 1, `lastActivationAt` `OBSERVED_NEXT_AT`). `rememberedRunning` returning `reportedRunning ?? false` gives count 2 and fails both rows, as the fixer's control saw. `reportedRunning ?? true` fails the existing `:202-213` case. Both halves of "neither counts nor clears" (`pumpRecords.ts:164-165`) are now discriminated. |
| CR-05-RECORDS-040 | fixed | `pumpRecords.ts:319-321` now gives the reason that holds: the stored shape uses the mark's absence to say that no run waits (`accessoryContext.ts:98-99`, "Absent means no counted run waits for its timestamp"). After the `delete` at `:323` or `:329`, the watermarks object has no mark key, which is how `seed` (`:280`) writes a record that never had one. No type rule is claimed. |
| CR-05-RECORDS-041 | fixed | `staleMarking.ts:140-144` keeps the characteristic-level fact and drops the tile claim. `:146-149` says that the trust report of every service that carries one is made unreadable, which is what `:168-171` does through `publishPersistentFailure` (`serviceCatalogue.ts:1005-1009`). Neither sentence contradicts the overview (`:19-23`) or the caller (`platform.ts:456-463`): one characteristic that answers a status presents the tile as "No Response". |
| CR-05-RECORDS-001 | still fixed | `pumpRecords.ts:347` withholds classification while the mark is set or the record holds no `lastActivationAt`. `:336` and `:386` remove the label on a recovered and on a watched activation. P1 (`pumpRecords.test.ts:649-676`) and P4 (`:561-581`) pass. The 038 same-observation path, which showed the same symptom through a different cause, is now closed. |
| CR-05-RECORDS-002 | still fixed | The mark is stored (`pumpRecords.ts:387`), validated (`:148-151`), removed (`:323`, `:329`) and read (`:328`, `:347`). The regression case `:370-388` and the damaged-record row `:809-816` pass. The consumer expectation is at `test/platform.test.ts:3319`. |
| CR-05-RECORDS-003 | still fixed | `pumpRecords.test.ts:252-269` and `:343-365`. |
| CR-05-RECORDS-004 | still fixed | `pumpRecords.test.ts:525-556`. Each row still fails for its own broken check. |
| CR-05-RECORDS-005 | still fixed | `pumpRecords.test.ts:586-614`. |
| CR-05-RECORDS-006 | still fixed | `pumpRecords.test.ts:748`, `:819-833`, `:839-848`. |
| CR-05-RECORDS-007 | still fixed | `test/accessories/reconciliation.test.ts:210-224`. |
| CR-05-RECORDS-008 | still fixed | `staleMarking.test.ts:432-448`. |
| CR-05-RECORDS-009 | still fixed | `staleMarking.test.ts:29`, `:357-377`. |
| CR-05-RECORDS-010 | still fixed | `staleMarking.test.ts:453-483`. |
| CR-05-RECORDS-011 | still fixed | The pumpRecords pair has the D-01 layout (`:1-9` in each file). The tracer printed `ACCESSORIES_HEADERS_OK files=6`. |
| CR-05-RECORDS-012 | still fixed | The staleMarking pair has the D-01 layout. The same tracer run covers it. |
| CR-05-RECORDS-013 | still fixed | `src/accessories/reconciliation.ts:48-51` has only `log`. `grep -n "Clock\|clock"` over the pair finds nothing (exit 1). `accountRuntime.ts:346` passes `{ log: options.log }`. |
| CR-05-RECORDS-014 | still fixed | `reconciliation.ts:11-16`. |
| CR-05-RECORDS-015 | still fixed | `reconciliation.test.ts:226-239` is under `describe('forget')`. |
| CR-05-RECORDS-016 | still fixed | No duplicate. `reconciliation.test.ts:72-83` keeps the empty-list confirmation. |
| CR-05-RECORDS-017 | still fixed | `pumpRecords.ts:47`, `:68-72`, `:178-183`. |
| CR-05-RECORDS-018 | still fixed | `pumpRecords.ts:8-9`, `:11-17`. |
| CR-05-RECORDS-019 | still fixed | `pumpRecords.ts:240-243`. |
| CR-05-RECORDS-020 | still fixed | `pumpRecords.ts:309-311`; `pumpRecords.test.ts:271-273`. |
| CR-05-RECORDS-021 | still fixed | `pumpRecords.test.ts:100-103`. |
| CR-05-RECORDS-022 | still fixed | `grep -n "Ruled\|CONTEXT\|plan as written"` over both test files: no hit (exit 1). |
| CR-05-RECORDS-023 | still fixed | `pumpRecords.test.ts:853-864`. |
| CR-05-RECORDS-024 | still fixed | Only `readonly UndecodedRunRow[]`, `readonly WithheldLabelRow[]`, `readonly DamagedRecordRow[]`, `string[]` and `Deferral[]`. |
| CR-05-RECORDS-025 | still fixed | `pumpRecords.test.ts:752-817`: each row holds a `stored()` factory. |
| CR-05-RECORDS-026 | still fixed | Every standalone partial observation literal ends in `satisfies Partial<PumpRecordsObservation>` (including the new `earlierSelfTest`, `:686-690`), and the new rows are checked with `satisfies readonly UndecodedRunRow[]`. |
| CR-05-RECORDS-027 | still fixed | `pumpRecords.test.ts:51-57` and `staleMarking.test.ts:108-110` are function declarations. |
| CR-05-RECORDS-028 | still fixed | `as unknown as` appears only at `staleMarking.test.ts:51, 55, 60`, inside the commented block `:46-61`. |
| CR-05-RECORDS-029 | still fixed | `staleMarking.test.ts:214-225` awaits the read, and every caller awaits `readOf`. |
| CR-05-RECORDS-030 | still fixed | `staleMarking.test.ts:141-146`, `:166-171`, `:557-559` are block bodies. |
| CR-05-RECORDS-031 | still fixed | `staleMarking.ts:41-50` names the two restart passes; `:151-154` gives the walk reason only. |
| CR-05-RECORDS-033 | still fixed | `pumpRecords.test.ts:619-644` asserts the whole `records.backup` with the label `undefined` after a recovery from a stored label `true`. Without `dropTestActivityLabel` at `pumpRecords.ts:336`, classification abstains on that observation (`:203`), so the label stays `true` and the case fails. |
| CR-05-RECORDS-034 | still fixed | `pumpRecords.ts:31-36`, `:291-299`, `:309-321`, `:341-345` and `pumpRecords.test.ts:288-294` state the 032 trade-off as an assumption with both costs. The 038 edit kept those clauses and added the same-observation rule, which is consistent with them: a first timestamp that arrives on an edge observation is seeded before the mark exists, so it clears only the mark of an earlier waiting run. |
| CR-05-RECORDS-035 | still fixed | `pumpRecords.test.ts:646-648` keeps the claim on the record. No HomeKit claim remains in the file. |
| CR-05-RECORDS-036 | still fixed | `staleMarking.test.ts:26-28` and `:31-33`, unchanged since round 2. |
| CR-05-RECORDS-037 | still fixed | `src/persistence/accessoryContext.ts:37-40` and `:74-76`, unchanged since round 2. |

Arithmetic: opening 4 - fixed 4 - rejected 0 + new 0 + reopened 0 = closing 0.

## Findings

None.

## Candidates considered and not filed

- **The 038 regression case pins only the "recovered" outcome of the reorder.** The fix gives three
  outcomes for an advance on an edge observation: recovered (no mark, a stored watermark), absorbed
  for an earlier waiting run (mark already set), and seeded (no watermark). No case drives the second
  or the third: no case has an edge observation whose advance meets an existing mark, and no case
  brings the first-ever timestamp on an edge observation. Not filed. The behavior is the composition
  of the call order with the three branches of `reconcileBackupTimestamp`. The order is pinned by
  `:683-705`, which the pre-fix order fails on count, mark and label. Each branch is pinned by its own
  cases (absorb `:343-365`, `:370-388`; seed `:274-286`, `:295-310`; recover `:252-269`). Local
  mutations of the current code (the old order, a cleared instead of a set mark, a reconcile that does
  not move the watermark) each fail a case. A wrong implementation that passes needs a separate
  edge-observation branch that ignores the mark or the seed, which is a rewrite rather than a
  plausible slip. The probe shows that the current code gives the right result for both untested
  outcomes.
- **`reconciliation.test.ts:25`, `const noop: () => void = (): void => { ... }`.** The rule allows an
  arrow assigned to `const` "for an explicit function type", and this one carries one. The round-0
  report cited this line as a conforming form when it filed CR-05-RECORDS-027. The line was touched
  by CR-04-ACCOUNT-032 (D-10). The annotation adds nothing that a function declaration would not give,
  but no rule text makes it a finding, so it is not filed.
- **`pumpRecords.test.ts:678-682`, "The record counts that earlier run on the device clock".** The
  case's assertion cannot see the earlier run's device time, because the watched edge overwrites
  `lastActivationAt` in the same observation. Not filed. The sentence is true of the code, and the
  device-clock conversion of a recovered run is pinned by `:252-269` and `:619-644`, on the same
  branch.
- **`pumpRecords.ts:291-294`, "the first advance in a later observation than a watched backup edge".**
  With the 032 trade-off, that first advance can be a seed that clears the mark rather than an
  absorption. Not filed. Both clear the mark and count nothing, and `:313-317` states the seed case
  and its cost.
- **`accessoryContext.ts:96-97`, "When `true`, the next backup timestamp past the watermark is taken
  as that same run's own".** After the reorder, the timestamp in the edge's own observation is
  reconciled before the mark is set, so it is never the "next" timestamp for that edge. With no
  watermark, the seed also takes it as the run's own (`pumpRecords.ts:313-314`). The claim holds.
- **`pumpRecords.ts:164-165`, after 039.** "neither counts nor clears" and "stops an undecoded snapshot
  followed by a `true` from manufacturing an edge" both hold, and both halves now have a case.
- **`staleMarking.ts:140-149` (041) against `platform.ts:453`.** The platform passes
  `HAPStatus.SERVICE_COMMUNICATION_FAILURE` (-70402), and the test uses `RESOURCE_BUSY` (-70403) on
  purpose (`staleMarking.test.ts:26-28`). The JSDoc says "a named status" and names none, so it
  holds for both.
- **`staleMarking.test.ts:563`, `binder.bind(...)`.** The quick scan hit is `ControlBinder.bind`, a
  method of the module under test, not `Function.prototype.bind`.
- **`test/accessories/pumpRecords.test.ts:47-48`, "`Logging` is a callable interface carrying seven
  members".** `node_modules/homebridge/dist/logger.d.ts:24-33` declares `prefix`, `info`, `success`,
  `warn`, `error`, `debug` and `log` beside the call signature. It holds, and so does
  `reconciliation.test.ts:22-23`.
- **`staleMarking.test.ts:210-213`, "real HAP answers it asynchronously and rejects with the stored
  status".** `Characteristic.handleGetRequest` is `async` (`Characteristic.js:1683`). Checked; it
  holds.
- **Earlier rounds' candidates** (the `silentLog` comments, the refusal warning assertion, the
  two-edge sequence, the upgrade record inside the awaiting window, `accessoryContext.ts:64-69`,
  `:82-87` and `:94-99`, `staleMarking.ts:25-32`, `:42-44` and `:63-67`, `staleMarking.test.ts:42`,
  `:63-65`, `:149-150`, `:166-167` and `:533-535`, the resume comparison, the row member mutability,
  `pumpRecords.test.ts:403-406`, the `| undefined` value members, the spies on four timer APIs, the
  test-title possessives, and the two adaptation hunks). I found no new evidence for any of them. The
  two-edge candidate from round 1 is unchanged by the reorder: there, run A's timestamp arrives on
  A's own stop observation after B's edge, not on B's edge observation.
- **The `test/platform.test.ts:3319` hunk.** Unchanged and correct: the second system counts a watched
  backup edge with no timestamp, so its stored context carries the mark.
- **The `src/runtime/accountRuntime.ts:346` hunk.** Unchanged and correct: the runtime keeps
  `options.clock` for `createMonitoringHealth` (`:347`).

## Header inspection

| File | Result |
| --- | --- |
| `src/accessories/pumpRecords.ts` | Conforms: SPDX, blank, copyright block, blank, overview, blank, imports. |
| `test/accessories/pumpRecords.test.ts` | Conforms (same layout). |
| `src/accessories/reconciliation.ts` | Conforms. |
| `test/accessories/reconciliation.test.ts` | Conforms. |
| `src/accessories/staleMarking.ts` | Conforms. |
| `test/accessories/staleMarking.test.ts` | Conforms. |
| `src/persistence/accessoryContext.ts` | Conforms (adaptation; `:1-30`). |
| `test/platform.test.ts` | Conforms (adaptation; `:1-9`). |
| `src/runtime/accountRuntime.ts` | Conforms (adaptation; `:1-9`). |

`node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --paths` over the six
core files printed `ACCESSORIES_HEADERS_OK files=6` (exit 0).

## Toolchain evidence

All commands ran in the worktree at `eb762e4774ea5e8203062d30fc759a0421243de5`. `node --version` printed
`v26.12.0` and `npm --version` printed `11.20.0`. The first command started at 2026-10-18T03:26:17Z,
and the header tracer ended at 2026-10-18T03:26:52Z. Raw output is in the session scratch directory.
No command whose exit is reported was piped.

| Command | Raw exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | Both `tsc --noEmit` passes (src and test projects) are clean. |
| `node_modules/.bin/eslint --max-warnings=0 <the nine files>` | 0 | No output. The ESLint cache was deleted first, so the result is fresh. |
| `npm run build:test` | 0 | Clean compile to `dist-test`. |
| `node --test dist-test/test/accessories/pumpRecords.test.js dist-test/test/accessories/reconciliation.test.js dist-test/test/accessories/staleMarking.test.js` | 0 | Default reporter, exit 0. With `--test-reporter=tap`, also exit 0: tests 77, suites 6, pass 77, fail 0, cancelled 0, skipped 0, todo 0. Each module alone: pumpRecords 45, reconciliation 13, staleMarking 19, each exit 0 with fail 0. |
| `node --test dist-test/test/platform.test.js dist-test/test/runtime/accountRuntime.test.js dist-test/test/persistence/accessoryContext.test.js` | 0 | Default reporter, exit 0. With `--test-reporter=tap`, also exit 0: tests 240, suites 7, pass 240, fail 0, cancelled 0, skipped 0, todo 0. Each module alone: platform 70, accountRuntime 169, accessoryContext 1, each exit 0 with fail 0. |
| `npm run test:coverage:direct -- src/accessories/pumpRecords.ts src/accessories/reconciliation.ts src/accessories/staleMarking.ts src/runtime/accountRuntime.ts src/persistence/accessoryContext.ts src/platform.ts` | 0 | The selector prints nothing after the npm banner on success. Each of the six pairs is at 100% lines, functions and branches when it runs alone. |
| `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --paths <the six core files>` | 0 | `ACCESSORIES_HEADERS_OK files=6` |
| `node <scratch>/r3-probe.mjs <worktree>/dist-test/src/accessories/pumpRecords.js` | 0 | Read-only probe, made-up inputs: R2's S-B (count 1); a watched run's timestamp on the next run's edge (count 2 after both timestamps, the second absorbed); the same with a settled self-test pair (label absent while the second run runs, mark `true`); an undecoded running value whose snapshot carries an advance, then `true` (count 2: one recovered run and one watched edge). |

No check failed, so this round has no toolchain finding.

## Out-of-scope observations

- `src/platform.ts:66` (Phase 6). The `watermarks` member JSDoc of `BasementGuardianAccessoryContext`
  still says "The device timestamps already turned into an activation record". The coordinator sent
  this to Phase 6 in round 2.
- `src/persistence/accessoryContext.ts:104-110` (outside the declarations this batch changed; owned by
  the file's own phase). `AccessoryContext` declares top-level `deviceId`, `deviceTypeId` and
  `serialNumber`, while the platform stores `device: { deviceId, deviceTypeId }` and no
  `serialNumber` (`test/platform.test.ts:3301`). Recorded in round 2; unchanged.
- `src/persistence/accessoryContext.ts:18-23, 122` (as rounds 1 and 2 reported). The overview and the
  `watermarks` member still do not mention the stored awaiting mark.
- `src/accessories/serviceCatalogue.ts:340-350, 466-475` (Phase 5 CATALOGUE, closed). An absent label
  is not pushed, so HAP keeps serving the last published label. This is still the coordinator's
  presentation question for the phase verifier. The 038 fix removes one way to publish `true` for a
  real run.

## Coordinator triage

Triaged 2026-10-18 by the coordinator. Opening 4, fixed 4, rejected 0, new 0, reopened 0,
closing 0. The round is `clean` (D-03 as amended, D-18), and it closes the RECORDS batch at
correction round 3. CR-05-RECORDS-001 to 031 and 033 to 041 are `fixed`; 032 stays rejected by the
maintainer's decision.

- **CR-05-RECORDS-038 to 041:** `fixed`, as the Round status shows.
- **Not filed:** the coordinator keeps the reviewer's two rejections. The 038 reorder has a case for
  its "recovered" outcome, and its other branches are each pinned separately. The `noop` in the
  reconciliation test carries an explicit function type, the conforming form.
- **Out-of-scope observations, for the phase verifier:** the stale `watermarks` JSDoc at
  `src/platform.ts:66` (Phase 6); the `AccessoryContext` top-level identity members against the
  stored `device` object, and the overview and `watermarks` member that omit the awaiting mark
  (`src/persistence/accessoryContext.ts`, outside the declarations this batch changed); and the
  label presentation (an absent label is not pushed, so HAP keeps the last published label).
