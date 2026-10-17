# Phase 5 findings ledger

Requirement ACC-01 (with PROC-01, PROC-02 and BUG-01 applied) stays Pending until phase verification.
Base revision: `e65382053a264f8003b96b1a4536e061338f07c8`.
The procedures that write and check this ledger live in `05-REVIEW-PROTOCOL.md`.

## Scope inventory

| # | Path | Kind | Batch | First round | Lines at base | Header at base |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | src/accessories/alarmMute.ts | core | DECLARATIONS | 0 | 32 | SPDX+overview |
| 2 | test/accessories/alarmMute.test.ts | core | DECLARATIONS | 0 | 64 | none |
| 3 | src/accessories/services.ts | core | DECLARATIONS | 0 | 104 | SPDX+overview |
| 4 | test/accessories/services.test.ts | core | DECLARATIONS | 0 | 69 | none |
| 5 | src/accessories/customCharacteristics.ts | core | DECLARATIONS | 0 | 225 | SPDX+overview |
| 6 | test/accessories/customCharacteristics.test.ts | core | DECLARATIONS | 0 | 354 | none |
| 7 | src/accessories/customServices.ts | core | DECLARATIONS | 0 | 164 | SPDX+overview |
| 8 | test/accessories/customServices.test.ts | core | DECLARATIONS | 0 | 260 | none |
| 9 | src/accessories/serviceCatalogue.ts | core | CATALOGUE | 0 | 1044 | SPDX+overview |
| 10 | test/accessories/serviceCatalogue.test.ts | core | CATALOGUE | 0 | 2291 | none |
| 11 | src/accessories/controls.ts | core | CONTROLS | 0 | 595 | SPDX+overview |
| 12 | test/accessories/controls.test.ts | core | CONTROLS | 0 | 1001 | conforms |
| 13 | src/accessories/pumpRecords.ts | core | RECORDS | 0 | 361 | SPDX+overview |
| 14 | test/accessories/pumpRecords.test.ts | core | RECORDS | 0 | 535 | none |
| 15 | src/accessories/reconciliation.ts | core | RECORDS | 0 | 114 | conforms |
| 16 | test/accessories/reconciliation.test.ts | core | RECORDS | 0 | 256 | conforms |
| 17 | src/accessories/staleMarking.ts | core | RECORDS | 0 | 174 | SPDX+overview |
| 18 | test/accessories/staleMarking.test.ts | core | RECORDS | 0 | 452 | none |
| 19 | src/accessories/basementGuardian.ts | core | ACCESSORY | 0 | 1066 | SPDX+overview |
| 20 | test/accessories/basementGuardian.test.ts | core | ACCESSORY | 0 | 3456 | none |
| 21 | test/accessories/timerFreedom.test.ts | core | GATES | 0 | 136 | overview-only |
| 22 | test/accessories/hapImportScope.test.ts | core | GATES | 0 | 190 | overview-only |
| 23 | test/accessories/accessoryReadPathScope.test.ts | core | GATES | 0 | 236 | overview-only |
| 24 | test/accessories/hapWriteFidelity.test.ts | core | GATES | 0 | 553 | overview-only |

Kind `addition` is a new file under `src/accessories` or `test/accessories`. Its row is recorded in
the commit right after the one that creates the file. Kind `adaptation` is any other path a batch
edits under D-06 or D-12. Its row is recorded before the edit. The First round of an `addition` or
`adaptation` row is the first correction round that must review it.

## Batch counters

| Batch | Round | Report | Revision | Opening | Fixed | Rejected | New | Reopened | Closing | Open IDs | D-03 result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DECLARATIONS | 0 | 05-DECLARATIONS-REVIEW.md | 053599a80557aa513b2d354833196408b92a4438 | 0 | 0 | 0 | 24 | 0 | 24 | CR-05-DECLARATIONS-001, CR-05-DECLARATIONS-002, CR-05-DECLARATIONS-003, CR-05-DECLARATIONS-004, CR-05-DECLARATIONS-005, CR-05-DECLARATIONS-006, CR-05-DECLARATIONS-007, CR-05-DECLARATIONS-008, CR-05-DECLARATIONS-009, CR-05-DECLARATIONS-010, CR-05-DECLARATIONS-011, CR-05-DECLARATIONS-012, CR-05-DECLARATIONS-013, CR-05-DECLARATIONS-014, CR-05-DECLARATIONS-015, CR-05-DECLARATIONS-016, CR-05-DECLARATIONS-017, CR-05-DECLARATIONS-018, CR-05-DECLARATIONS-019, CR-05-DECLARATIONS-020, CR-05-DECLARATIONS-021, CR-05-DECLARATIONS-022, CR-05-DECLARATIONS-023, CR-05-DECLARATIONS-024 | initial |
| DECLARATIONS | 1 | 05-DECLARATIONS-REVIEW-R1.md | 6a769c548826e4eefdfa809a5e1721ac5224a8e2 | 24 | 24 | 0 | 1 | 0 | 1 | CR-05-DECLARATIONS-025 | continue |

The rule is closing = opening - fixed - rejected + new + reopened. Round 0 is the initial review. Its Opening is
the batch's pre-allocated seed IDs: 7 for CONTROLS and 0 for every other batch. Rounds 1 to 10 are
correction rounds, and no batch records a round above 10 (D-18). The result vocabulary is
`initial`, `continue`, `clean` and `STOP: <reason>`, where the reason is `no progress`,
`reopened <IDs>` or `open after round 10`.

## Findings

| ID | Batch | Severity | Rule | Initial location | Current location | First reviewer | Disposition | Reason | Fix commits | Checks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CR-05-CONTROLS-001 | CONTROLS | pending | Seed (a), whole-value check: `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions | `64c4fea:test/accessories/controls.test.ts:831` | `e65382053a264f8003b96b1a4536e061338f07c8:test/accessories/controls.test.ts:817-830` (line 829 compares a warnings count) | spot check 64c4fea; Phase 1 handoff | pending |  |  |  |
| CR-05-CONTROLS-002 | CONTROLS | pending | Seed (b), no `describe()` per exported entrypoint: `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure | `64c4fea:test/accessories/controls.test.ts` | `e65382053a264f8003b96b1a4536e061338f07c8:test/accessories/controls.test.ts:12` (exports `bindRestoredControlRefusal` at src/accessories/controls.ts:421 and `createControlBinder` at src/accessories/controls.ts:445) | spot check 64c4fea; Phase 1 handoff | pending |  |  |  |
| CR-05-CONTROLS-003 | CONTROLS | pending | Seed (c), case tests the stand-in: `.agents/skills/typescript-unit-tests/SKILL.md` preamble (every case discriminates the module); D-13 | `64c4fea:test/accessories/controls.test.ts:217-238` | `e65382053a264f8003b96b1a4536e061338f07c8:test/accessories/controls.test.ts:216-243` | spot check 64c4fea; Phase 1 handoff | pending |  |  |  |
| CR-05-CONTROLS-004 | CONTROLS | pending | Seed (d), hand-rolled `.bind` spy: `.agents/skills/typescript-unit-tests/rules/test-doubles.md` Spies; `.agents/skills/typescript-style/rules/review.md` Quick scan | `64c4fea:test/accessories/controls.test.ts:316-335` | `e65382053a264f8003b96b1a4536e061338f07c8:test/accessories/controls.test.ts:321-340` | spot check 64c4fea; Phase 1 handoff | pending |  |  |  |
| CR-05-CONTROLS-005 | CONTROLS | pending | Seed (e), combined act-and-assert marker over two statements: `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure | `64c4fea:test/accessories/controls.test.ts:928-933` | `e65382053a264f8003b96b1a4536e061338f07c8:test/accessories/controls.test.ts:921-932, 975-982` | spot check 64c4fea; Phase 1 handoff | pending |  |  |  |
| CR-05-CONTROLS-006 | CONTROLS | pending | Seed (f), undocumented `as unknown as Service` casts: `.agents/skills/typescript-style/rules/types.md`; `.agents/skills/typescript-unit-tests/rules/cases.md` Types and isolation; D-11 | `64c4fea:test/accessories/controls.test.ts:158, 330, 853, 874, 905` | `e65382053a264f8003b96b1a4536e061338f07c8:test/accessories/controls.test.ts:163, 335, 336, 851, 872, 903` | spot check 64c4fea; Phase 1 handoff | pending |  |  |  |
| CR-05-CONTROLS-007 | CONTROLS | pending | Seed (g), ordering comment on the wrong constant: `.agents/skills/typescript-style/rules/naming-and-docs.md` Comments and documentation; `.agents/skills/typescript-style/rules/comments.md` | `64c4fea:src/accessories/controls.ts:304-328` | `e65382053a264f8003b96b1a4536e061338f07c8:src/accessories/controls.ts:304-336` | spot check 64c4fea; Phase 1 handoff | pending |  |  |  |
| CR-05-DECLARATIONS-001 | DECLARATIONS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (cases discriminate); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings; .agents/skills/typescript-unit-tests/rules/cases.md Assertions | `053599a80557aa513b2d354833196408b92a4438:test/accessories/customCharacteristics.test.ts:43-69, 124-145, 163-173` | `053599a80557aa513b2d354833196408b92a4438:test/accessories/customCharacteristics.test.ts:43-69, 124-145, 163-173` | gsd-code-reviewer round 0 | fixed |  | 7bb76e693c |  |
| CR-05-DECLARATIONS-002 | DECLARATIONS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (cases discriminate); .agents/skills/typescript-unit-tests/rules/pairing-and-design.md Pairing and coverage; .agents/skills/typescript-unit-tests/rules/cases.md Assertions | `053599a80557aa513b2d354833196408b92a4438:test/accessories/customServices.test.ts:44-93, 151-186, 249-259` | `053599a80557aa513b2d354833196408b92a4438:test/accessories/customServices.test.ts:44-93, 151-186, 249-259` | gsd-code-reviewer round 0 | fixed |  | 9fba016816 |  |
| CR-05-DECLARATIONS-003 | DECLARATIONS | BLOCKER | .agents/skills/typescript-unit-tests/rules/cases.md Assertions (whole values, independent expected values); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `053599a80557aa513b2d354833196408b92a4438:test/accessories/customCharacteristics.test.ts:43-69, 109-122, 199-208, 279-293` | `053599a80557aa513b2d354833196408b92a4438:test/accessories/customCharacteristics.test.ts:43-69, 109-122, 199-208, 279-293` | gsd-code-reviewer round 0 | fixed |  | 9ef87cb48a |  |
| CR-05-DECLARATIONS-004 | DECLARATIONS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (cases discriminate); .agents/skills/typescript-unit-tests/rules/cases.md Assertions; D-13; D-16 | `053599a80557aa513b2d354833196408b92a4438:test/accessories/customCharacteristics.test.ts:224-263, 341-353 (production line src/accessories/customCharacteristics.ts:156)` | `053599a80557aa513b2d354833196408b92a4438:test/accessories/customCharacteristics.test.ts:224-263, 341-353 (production line src/accessories/customCharacteristics.ts:156)` | gsd-code-reviewer round 0 | fixed |  | 637da579f4 |  |
| CR-05-DECLARATIONS-005 | DECLARATIONS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (cases discriminate); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `053599a80557aa513b2d354833196408b92a4438:test/accessories/alarmMute.test.ts:14-29, 50-64` | `053599a80557aa513b2d354833196408b92a4438:test/accessories/alarmMute.test.ts:14-29, 50-64` | gsd-code-reviewer round 0 | fixed |  | c0a7b763a0 |  |
| CR-05-DECLARATIONS-006 | DECLARATIONS | WARNING | D-01; .agents/skills/typescript-style/rules/modules-and-data.md Files and modules | `053599a80557aa513b2d354833196408b92a4438:src/accessories/alarmMute.ts:1-22; test/accessories/alarmMute.test.ts:1` | `053599a80557aa513b2d354833196408b92a4438:src/accessories/alarmMute.ts:1-22; test/accessories/alarmMute.test.ts:1` | gsd-code-reviewer round 0 | fixed |  | f7b69290fe |  |
| CR-05-DECLARATIONS-007 | DECLARATIONS | WARNING | D-01; .agents/skills/typescript-style/rules/modules-and-data.md Files and modules | `053599a80557aa513b2d354833196408b92a4438:src/accessories/services.ts:1-19; test/accessories/services.test.ts:1` | `053599a80557aa513b2d354833196408b92a4438:src/accessories/services.ts:1-19; test/accessories/services.test.ts:1` | gsd-code-reviewer round 0 | fixed |  | bf0f76d1f9 |  |
| CR-05-DECLARATIONS-008 | DECLARATIONS | WARNING | D-01; .agents/skills/typescript-style/rules/modules-and-data.md Files and modules | `053599a80557aa513b2d354833196408b92a4438:src/accessories/customCharacteristics.ts:1-33; test/accessories/customCharacteristics.test.ts:1` | `053599a80557aa513b2d354833196408b92a4438:src/accessories/customCharacteristics.ts:1-33; test/accessories/customCharacteristics.test.ts:1` | gsd-code-reviewer round 0 | fixed |  | 44583304e3 |  |
| CR-05-DECLARATIONS-009 | DECLARATIONS | WARNING | D-01; .agents/skills/typescript-style/rules/modules-and-data.md Files and modules | `053599a80557aa513b2d354833196408b92a4438:src/accessories/customServices.ts:1-47; test/accessories/customServices.test.ts:1` | `053599a80557aa513b2d354833196408b92a4438:src/accessories/customServices.ts:1-47; test/accessories/customServices.test.ts:1` | gsd-code-reviewer round 0 | fixed |  | 0dcd7c206f |  |
| CR-05-DECLARATIONS-010 | DECLARATIONS | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Case structure (act-and-assert marker) | `053599a80557aa513b2d354833196408b92a4438:test/accessories/alarmMute.test.ts:45-48` | `053599a80557aa513b2d354833196408b92a4438:test/accessories/alarmMute.test.ts:45-48` | gsd-code-reviewer round 0 | fixed |  | b8cbe8cd2d |  |
| CR-05-DECLARATIONS-011 | DECLARATIONS | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Case structure (act-and-assert marker) | `053599a80557aa513b2d354833196408b92a4438:test/accessories/services.test.ts:47-50, 52-57, 59-69` | `053599a80557aa513b2d354833196408b92a4438:test/accessories/services.test.ts:47-50, 52-57, 59-69` | gsd-code-reviewer round 0 | fixed |  | 9cedd4da95 |  |
| CR-05-DECLARATIONS-012 | DECLARATIONS | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Case structure (act-and-assert marker) | `053599a80557aa513b2d354833196408b92a4438:test/accessories/customCharacteristics.test.ts:138-145` | `053599a80557aa513b2d354833196408b92a4438:test/accessories/customCharacteristics.test.ts:138-145` | gsd-code-reviewer round 0 | fixed |  | 7bb76e693c |  |
| CR-05-DECLARATIONS-013 | DECLARATIONS | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Case structure (act-and-assert marker) | `053599a80557aa513b2d354833196408b92a4438:test/accessories/customServices.test.ts:179-186` | `053599a80557aa513b2d354833196408b92a4438:test/accessories/customServices.test.ts:179-186` | gsd-code-reviewer round 0 | fixed |  | 9fba016816 |  |
| CR-05-DECLARATIONS-014 | DECLARATIONS | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Case structure (single-entrypoint module at top level) | `053599a80557aa513b2d354833196408b92a4438:test/accessories/customCharacteristics.test.ts:2, 94-354` | `053599a80557aa513b2d354833196408b92a4438:test/accessories/customCharacteristics.test.ts:2, 94-354` | gsd-code-reviewer round 0 | fixed |  | 7cb0069f78 |  |
| CR-05-DECLARATIONS-015 | DECLARATIONS | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Case structure (single-entrypoint module at top level) | `053599a80557aa513b2d354833196408b92a4438:test/accessories/customServices.test.ts:2, 113-260` | `053599a80557aa513b2d354833196408b92a4438:test/accessories/customServices.test.ts:2, 113-260` | gsd-code-reviewer round 0 | fixed |  | 96d5b19061 |  |
| CR-05-DECLARATIONS-016 | DECLARATIONS | WARNING | .agents/skills/typescript-style/rules/comments.md | `053599a80557aa513b2d354833196408b92a4438:src/accessories/customCharacteristics.ts:148` | `053599a80557aa513b2d354833196408b92a4438:src/accessories/customCharacteristics.ts:148` | gsd-code-reviewer round 0 | fixed |  | 644df7da5f |  |
| CR-05-DECLARATIONS-017 | DECLARATIONS | WARNING | .agents/skills/typescript-style/rules/comments.md (narration of code that does not exist) | `053599a80557aa513b2d354833196408b92a4438:src/accessories/customCharacteristics.ts:102-104` | `053599a80557aa513b2d354833196408b92a4438:src/accessories/customCharacteristics.ts:102-104` | gsd-code-reviewer round 0 | fixed |  | a9d9c4aea8 |  |
| CR-05-DECLARATIONS-018 | DECLARATIONS | WARNING | .agents/skills/typescript-style/rules/comments.md | `053599a80557aa513b2d354833196408b92a4438:src/accessories/services.ts:10-13` | `053599a80557aa513b2d354833196408b92a4438:src/accessories/services.ts:10-13` | gsd-code-reviewer round 0 | fixed |  | dfcd54710f |  |
| CR-05-DECLARATIONS-019 | DECLARATIONS | WARNING | .agents/skills/typescript-style/rules/comments.md; .agents/skills/typescript-unit-tests/rules/cases.md Case structure (titles) | `053599a80557aa513b2d354833196408b92a4438:src/accessories/customServices.ts:88; test/accessories/customServices.test.ts:140` | `053599a80557aa513b2d354833196408b92a4438:src/accessories/customServices.ts:88; test/accessories/customServices.test.ts:140` | gsd-code-reviewer round 0 | fixed |  | ef0db0a69b |  |
| CR-05-DECLARATIONS-020 | DECLARATIONS | WARNING | .agents/skills/typescript-style/rules/comments.md (narration of release history) | `053599a80557aa513b2d354833196408b92a4438:src/accessories/customServices.ts:24-30` | `053599a80557aa513b2d354833196408b92a4438:src/accessories/customServices.ts:24-30` | gsd-code-reviewer round 0 | fixed |  | 5df1dff0f9 |  |
| CR-05-DECLARATIONS-021 | DECLARATIONS | WARNING | .agents/skills/typescript-style/rules/naming-and-docs.md Naming; .agents/skills/typescript-style/rules/comments.md | `053599a80557aa513b2d354833196408b92a4438:test/accessories/alarmMute.test.ts:14-17, 59` | `053599a80557aa513b2d354833196408b92a4438:test/accessories/alarmMute.test.ts:14-17, 59` | gsd-code-reviewer round 0 | fixed |  | 8d4ed4d289 |  |
| CR-05-DECLARATIONS-022 | DECLARATIONS | WARNING | .agents/skills/typescript-style/rules/types.md (array types) | `053599a80557aa513b2d354833196408b92a4438:test/accessories/alarmMute.test.ts:19, 22` | `053599a80557aa513b2d354833196408b92a4438:test/accessories/alarmMute.test.ts:19, 22` | gsd-code-reviewer round 0 | fixed |  | 69c7801d97 |  |
| CR-05-DECLARATIONS-023 | DECLARATIONS | WARNING | .agents/skills/typescript-style/rules/types.md (array types) | `053599a80557aa513b2d354833196408b92a4438:test/accessories/customServices.test.ts:101, 105` | `053599a80557aa513b2d354833196408b92a4438:test/accessories/customServices.test.ts:101, 105` | gsd-code-reviewer round 0 | fixed |  | 6472fa9690 |  |
| CR-05-DECLARATIONS-024 | DECLARATIONS | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Test data; Case structure | `053599a80557aa513b2d354833196408b92a4438:test/accessories/services.test.ts:10-18` | `053599a80557aa513b2d354833196408b92a4438:test/accessories/services.test.ts:10-18` | gsd-code-reviewer round 0 | fixed |  | 960f812d00 |  |
| CR-05-DECLARATIONS-025 | DECLARATIONS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (cases discriminate); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `6a769c548826e4eefdfa809a5e1721ac5224a8e2:test/accessories/alarmMute.test.ts:25-28, 73-87` | `6a769c548826e4eefdfa809a5e1721ac5224a8e2:test/accessories/alarmMute.test.ts:25-28, 73-87` | gsd-code-reviewer round 1 | open |  | 00f7bd6a4c |  |

## Candidate leads

| Lead | Owning batch | Location at base | Observation | Likely rule | Disposition |
| --- | --- | --- | --- | --- | --- |
| S-05-01 | DECLARATIONS, CATALOGUE, CONTROLS, GATES | ten files under test/accessories | 36 `// act & assert` markers are not followed by `assert.rejects` or `assert.throws`. Per file: serviceCatalogue 19, accessoryReadPathScope 3, hapImportScope 3, services 3, timerFreedom 2, controls 2, alarmMute 1, customCharacteristics 1, customServices 1, hapWriteFidelity 1. Phases 2 to 4 fixed this as a WARNING each time (CR-02-SHADOW-006, CR-02-AUTH-012, CR-04-PORTS-004, CR-04-POLICIES-006, CR-04-TRUST-013, CR-04-ACCOUNT-041). | unit, Case structure | DECLARATIONS part confirmed as CR-05-DECLARATIONS-010 to 013; CATALOGUE, CONTROLS and GATES parts unreviewed |
| S-05-02 | DECLARATIONS, ACCESSORY | test/accessories/customCharacteristics.test.ts:94; test/accessories/customServices.test.ts:113; test/accessories/basementGuardian.test.ts:789 | A single runtime entrypoint is wrapped in one `describe`. The rule says a single-entrypoint module keeps its cases at the top level. | unit, Case structure | DECLARATIONS part confirmed as CR-05-DECLARATIONS-014 and 015; ACCESSORY part unreviewed |
| S-05-03 | RECORDS | test/accessories/reconciliation.test.ts:52, 144, 227 | The `describe` blocks name methods of the returned object, not exported entrypoints. | unit, Case structure (reviewer judgment) | unreviewed |
| S-05-04 | CONTROLS | test/accessories/controls.test.ts:547-557 | `'answers each of the eight refusal causes ...'` loops all rows inside one `test()` and has no `// arrange`. | unit, Data-driven cases | unreviewed |
| S-05-05 | CONTROLS | src/accessories/controls.ts:145-147 | The JSDoc says HAP "keeps only the last handler registered while warning about the ones before it". Pinned HAP 2.2.2 `onSet` assigns one slot and gives no replacement warning; it warns only for a non-function and for ignored `on('set')` listeners (Characteristic.js:1346-1352, 1801-1803). | comments, accuracy | unreviewed |
| S-05-06 | CONTROLS, ACCESSORY | src/accessories/controls.ts:97-103, 323-324; test/accessories/controls.test.ts:690, 693, 713; test/accessories/basementGuardian.test.ts:2947 | Narration of code history: "two refusals now answer it", "the new rule", "reconciliation used to read the value". | comments, Narration of code that no longer exists | unreviewed |
| S-05-07 | RECORDS | src/accessories/reconciliation.ts:51-54 | `ReconciliationOptions.clock: Clock` is required, but nothing in the module reads `options.clock`. Its only production consumer passes it at src/runtime/accountRuntime.ts:346. Removing it is a D-06 contract change with a bounded consumer edit in a Phase 4 file. | style, unused dependency; unit, Design for tests | unreviewed |
| S-05-08 | DECLARATIONS | src/accessories/customCharacteristics.ts:148 | The comment says "so twelve near-identical class bodies never exist"; the factory defines 16 characteristics. | comments, accuracy | confirmed as CR-05-DECLARATIONS-016 |
| S-05-09 | GATES | test/accessories/hapImportScope.test.ts:60-63; test/accessories/accessoryReadPathScope.test.ts:72-76 | Floor comments state exact counts that research found stale at 1bcaddd: "a hundred and four TypeScript files" when the tree had 132 (`find src test features -name '*.ts' \| wc -l`), and "the production tree forty" when `src` had 43. D-14 keeps the `>=` floors; a stale stated count is a candidate for "wrong for the current tree". | D-14; comments, accuracy | unreviewed |
| S-05-10 | GATES | test/accessories/timerFreedom.test.ts:13 | "Three modules in this repository already import that form" is true for `src/` (accountRuntime, retryPolicy, mqttTransport); repository-wide, 13 files import it, not counting the gate's own fixture. | comments, accuracy | unreviewed |
| S-05-11 | GATES | test/accessories/hapWriteFidelity.test.ts:394-395 | `assert.notStrictEqual(real.statusCode, 0)` is a standalone negative that the next `strictEqual` makes redundant, and the case does not compare the whole record while every sibling does. | unit, Assertions | unreviewed |
| S-05-12 | GATES | test/accessories/hapWriteFidelity.test.ts:51, 112, 94 | `require_` uses a trailing-underscore name; `catch {` has no `(error: unknown)`; `manifest as InstalledManifest` has no stated reason. | style, Naming, Errors and Types | unreviewed |
| S-05-13 | GATES | test/accessories/hapWriteFidelity.test.ts:258-268 | A conditionally registered test. Under Homebridge 1.x it does not exist, which works like a skip. | unit, no conditional registration and no skip (reviewer judgment) | unreviewed |
| S-05-14 | GATES | test/accessories/hapWriteFidelity.test.ts:481-494 | `'leaves the stand-in published flag ...'` exercises the stand-in only. | unit, test support needs no meta-tests; D-13 and D-16 | unreviewed |
| S-05-15 | GATES | test/accessories/hapWriteFidelity.test.ts; features/lib/hap.ts:309-334 | D-16 parity gaps not diffed today: (1) a write with no handler stores the value and reports success, which staleMarking.ts:29-34 and controls.ts:36-41 rely on; (2) a second `onSet` replaces the first, which the `bindRestoredControlRefusal` handoff relies on (controls.ts:42-45, 424-428); (3) real HAP resets `statusCode` to 0 at entry to `handleSetRequest`, while the stand-in clears it only on success, so a read during an in-flight write can differ (Characteristic.js:1786-1787, 1838-1841). | D-16, confirmed gaps only | unreviewed |
| S-05-16 | DECLARATIONS | test/accessories/alarmMute.test.ts:19-29, 52-64 | A source-text gate inside a paired test with no enumeration floor and no planted positive; an empty read would pass. | unit, would a wrong implementation pass? (BLOCKER class) | confirmed as CR-05-DECLARATIONS-005 |
| S-05-17 | CATALOGUE, ACCESSORY | test/accessories/basementGuardian.test.ts:3400-3455; test/accessories/serviceCatalogue.test.ts:1485-1491 | Source-text cases inside paired tests. The `onGet` and get-event checks repeat accessoryReadPathScope.test.ts with a weaker pattern. | unit, Do not test what a gate already enforces | unreviewed |
| S-05-18 | CONTROLS | test/accessories/controls.test.ts:104-118 and similar recorders | A hand-built `CommandPort` recorder asserts sends; the rules give command issuing to `strong-mock`. | unit, Test doubles (reviewer judgment; large refactor) | unreviewed |
| S-05-19 | CONTROLS | test/accessories/controls.test.ts:30, reused at 433-488 | The module-level `ACCEPTED: CommandOutcome` object is shared across rows. | unit, Test data (seeds return fresh values) | unreviewed |
| S-05-20 | ACCESSORY | src/accessories/basementGuardian.ts:177-180 | `DEFAULT_OFFLINE_CONFIRMATION_POLL_COUNT = 2` repeats the default in src/config.ts, as its comment says. | design (reviewer judgment; src/config.ts belongs to Phase 6) | unreviewed |
| S-05-21 | DECLARATIONS | src/accessories/customCharacteristics.ts:111-114 | `type CharacteristicDomain = Pick<...>`; the style rules prefer interface extension over `Pick`. | style, Types | rejected: `CharacteristicDomain` picks from homebridge's external `CharacteristicProps`; interface extension needs a project-owned base, and an empty `extends Pick` interface or hand-copied members would be worse (types.md, simplest construct) |
| S-05-22 | GATES | features/lib/hap.ts:300; src/accessories/customCharacteristics.ts:156 | The stand-in base `Characteristic` assigns the default value, while real HAP 2.2.2 leaves the base `value` null (Characteristic.js:1274, 1294-1303) and each definition assigns its own; no fidelity case diffs construction defaults. Found by the DECLARATIONS round-0 review (CR-05-DECLARATIONS-004). | D-16, confirmed gaps only | unreviewed |

A lead is not a finding. It is a research observation that a reviewer confirms as a finding or
rejects with rule and source evidence.

## Rule applicability (D-14, D-17)

| Gate | Rule | Applicability | Reason |
| --- | --- | --- | --- |
| test/accessories/timerFreedom.test.ts | Mirrored source pairing | proposed N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/timerFreedom.test.ts | One `describe()` per exported entrypoint | proposed N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/timerFreedom.test.ts | Isolated direct coverage | proposed N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/hapImportScope.test.ts | Mirrored source pairing | proposed N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/hapImportScope.test.ts | One `describe()` per exported entrypoint | proposed N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/hapImportScope.test.ts | Isolated direct coverage | proposed N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/accessoryReadPathScope.test.ts | Mirrored source pairing | proposed N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/accessoryReadPathScope.test.ts | One `describe()` per exported entrypoint | proposed N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/accessoryReadPathScope.test.ts | Isolated direct coverage | proposed N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/hapWriteFidelity.test.ts | Mirrored source pairing | proposed N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/hapWriteFidelity.test.ts | One `describe()` per exported entrypoint | proposed N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/hapWriteFidelity.test.ts | Isolated direct coverage | proposed N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/timerFreedom.test.ts | Whole-value assertion for `ACCESSORIES_MODULE_FLOOR` | proposed N/A | D-14 keeps the documented >= floor; the gate asserts a lower bound by design |
| test/accessories/hapImportScope.test.ts | Whole-value assertion for `SOURCE_FILE_FLOOR` | proposed N/A | D-14 keeps the documented >= floor; the gate asserts a lower bound by design |
| test/accessories/accessoryReadPathScope.test.ts | Whole-value assertion for `ACCESSORIES_MODULE_FLOOR` | proposed N/A | D-14 keeps the documented >= floor; the gate asserts a lower bound by design |
| test/accessories/accessoryReadPathScope.test.ts | Whole-value assertion for `SOURCE_MODULE_FLOOR` | proposed N/A | D-14 keeps the documented >= floor; the gate asserts a lower bound by design |

The GATES plan confirms or changes each row.

## Genuine bug histories

| Finding | Owner test | RED evidence | Evidence commit | Fix commit | Classifier | Ancestry |
| --- | --- | --- | --- | --- | --- | --- |

## Coordinator evidence

### 05-01

Base revision `e65382053a264f8003b96b1a4536e061338f07c8` on branch `features/code-review-sweep`,
recorded 2026-10-17T04:18:03Z with an empty `git status --porcelain`. Runtime: Node v26.12.0 at
`/opt/homebrew/opt/node/bin/node`, npm 11.20.0. `wc -l` and the first 12 lines of all 24 inventory
files matched the expected counts and header states above; `git ls-files src/accessories test/accessories`
lists exactly those 24 paths.

#### Tracer proof (task 05-01-01)

All runs from the repository root at base `e65382053a264f8003b96b1a4536e061338f07c8` with the
tracer and ledger uncommitted, Node v26.12.0, 2026-10-17T04:25Z. Each output line is copied as
printed (stdout and stderr together); `exit=` is the raw exit status.

Real ledger and header controls:

```text
--- ledger mode on 05-FINDINGS.md
ACCESSORIES_LEDGER_TRACER_OK inventory=24 findings=7 open=0 rounds=0
exit=0
--- --headers --paths src/runtime/clock.ts test/accessories/reconciliation.test.ts
ACCESSORIES_HEADERS_OK files=2
exit=0
--- --headers --paths src/accessories/controls.ts
HEADER_VIOLATION src/accessories/controls.ts: 2 expected an empty line after the SPDX line
exit=1
--- --headers (all inventory rows)
HEADER_VIOLATION src/accessories/alarmMute.ts: 2 expected an empty line after the SPDX line
HEADER_VIOLATION test/accessories/alarmMute.test.ts: 1 expected "// SPDX-License-Identifier: MIT"
HEADER_VIOLATION src/accessories/services.ts: 2 expected an empty line after the SPDX line
HEADER_VIOLATION test/accessories/services.test.ts: 1 expected "// SPDX-License-Identifier: MIT"
HEADER_VIOLATION src/accessories/customCharacteristics.ts: 2 expected an empty line after the SPDX line
HEADER_VIOLATION test/accessories/customCharacteristics.test.ts: 1 expected "// SPDX-License-Identifier: MIT"
HEADER_VIOLATION src/accessories/customServices.ts: 2 expected an empty line after the SPDX line
HEADER_VIOLATION test/accessories/customServices.test.ts: 1 expected "// SPDX-License-Identifier: MIT"
HEADER_VIOLATION src/accessories/serviceCatalogue.ts: 2 expected an empty line after the SPDX line
HEADER_VIOLATION test/accessories/serviceCatalogue.test.ts: 1 expected "// SPDX-License-Identifier: MIT"
HEADER_VIOLATION src/accessories/controls.ts: 2 expected an empty line after the SPDX line
HEADER_VIOLATION src/accessories/pumpRecords.ts: 2 expected an empty line after the SPDX line
HEADER_VIOLATION test/accessories/pumpRecords.test.ts: 1 expected "// SPDX-License-Identifier: MIT"
HEADER_VIOLATION src/accessories/staleMarking.ts: 2 expected an empty line after the SPDX line
HEADER_VIOLATION test/accessories/staleMarking.test.ts: 1 expected "// SPDX-License-Identifier: MIT"
HEADER_VIOLATION src/accessories/basementGuardian.ts: 2 expected an empty line after the SPDX line
HEADER_VIOLATION test/accessories/basementGuardian.test.ts: 1 expected "// SPDX-License-Identifier: MIT"
HEADER_VIOLATION test/accessories/timerFreedom.test.ts: 1 expected "// SPDX-License-Identifier: MIT"
HEADER_VIOLATION test/accessories/hapImportScope.test.ts: 1 expected "// SPDX-License-Identifier: MIT"
HEADER_VIOLATION test/accessories/accessoryReadPathScope.test.ts: 1 expected "// SPDX-License-Identifier: MIT"
HEADER_VIOLATION test/accessories/hapWriteFidelity.test.ts: 1 expected "// SPDX-License-Identifier: MIT"
exit=1
```

The 21 `HEADER_VIOLATION` paths are the nine sources and twelve tests the inventory marks
`SPDX+overview`, `none` or `overview-only`; `src/accessories/reconciliation.ts`,
`test/accessories/reconciliation.test.ts` and `test/accessories/controls.test.ts` are not named.

Planted copies, written by a generator in the session scratch directory (never in the
repository) and run with `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --ledger <scratch>/planted/<name>.md`.
Each planted counter row uses the base revision as Revision and `05-DECLARATIONS-REVIEW.md` or
`05-DECLARATIONS-REVIEW-R<N>.md` as Report; those reports do not exist, so L5 and L6 lines in the
sequence runs are expected and ignored.

| Copy | Planted change | Expected | Observed |
| --- | --- | --- | --- |
| defect-duplicate-seed | CR-05-CONTROLS-001 row duplicated | exit 1, L3 naming CR-05-CONTROLS-001 | exit 1, L3 line naming CR-05-CONTROLS-001 |
| defect-counter-sum | DECLARATIONS round 0: Opening 0, New 2, Closing 3 | exit 1, L4-sum | exit 1, L4-sum line |
| defect-missing-inventory-path | alarmMute.ts inventory row deleted | exit 1, L2 naming src/accessories/alarmMute.ts | exit 1, two L2 lines naming it |
| sequence-d18-accept-ten-rounds | rounds 0 to 10, Closing 10 then one fix per round, `continue` to round 9, `clean` at round 10 | no line starting `LEDGER_VIOLATION L4` | no L4 line; only L6 lines |
| sequence-d18-reject-round10-open | same from Closing 11; round 10 Closing 1 reads `continue` | L4-stop naming round 10 | L4-stop line naming DECLARATIONS round 10 |
| sequence-d18-reject-round11 | round 10 reads `STOP: open after round 10; resolved by maintainer`, plus round 11 Opening 1, Fixed 1, Closing 0, `clean` | L4-cap naming round 11, no L4-stop | L4-cap line naming round 11; no L4-stop line |
| sequence-d03-reject-no-progress | round 0 Closing 3; round 1 Opening 3, Fixed 1, New 1, Closing 3, `continue` | L4-stop naming round 1 | L4-stop line naming round 1 |
| sequence-d03-reject-reopen | round 0 Closing 3; round 1 Opening 3, Fixed 2, Reopened 1, Closing 2, `continue` | L4-stop naming round 1 | L4-stop line naming round 1 |

Raw output of the eight runs:

```text
--- defect-duplicate-seed
LEDGER_VIOLATION L3: finding ID CR-05-CONTROLS-001 appears more than once
exit=1
--- defect-counter-sum
LEDGER_VIOLATION L4-sum: DECLARATIONS round 0: Closing 3 differs from Opening - Fixed - Rejected + New + Reopened = 2
LEDGER_VIOLATION L5: DECLARATIONS round 0: Closing 3 differs from the 0 findings with Disposition open
LEDGER_VIOLATION L5: DECLARATIONS round 0: Open IDs "CR-05-DECLARATIONS-001, CR-05-DECLARATIONS-002, CR-05-DECLARATIONS-003" should be "None"
LEDGER_VIOLATION L6: DECLARATIONS round 0: report 05-DECLARATIONS-REVIEW.md does not exist under .planning/phases/05-accessories-conformance
exit=1
--- defect-missing-inventory-path
LEDGER_VIOLATION L2: the core inventory row for src/accessories/alarmMute.ts is missing
LEDGER_VIOLATION L2: src/accessories/alarmMute.ts is tracked under src/accessories or test/accessories but has no inventory row
exit=1
--- sequence-d18-accept-ten-rounds
LEDGER_VIOLATION L6: DECLARATIONS round 0: report 05-DECLARATIONS-REVIEW.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 1: report 05-DECLARATIONS-REVIEW-R1.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 2: report 05-DECLARATIONS-REVIEW-R2.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 3: report 05-DECLARATIONS-REVIEW-R3.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 4: report 05-DECLARATIONS-REVIEW-R4.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 5: report 05-DECLARATIONS-REVIEW-R5.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 6: report 05-DECLARATIONS-REVIEW-R6.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 7: report 05-DECLARATIONS-REVIEW-R7.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 8: report 05-DECLARATIONS-REVIEW-R8.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 9: report 05-DECLARATIONS-REVIEW-R9.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 10: report 05-DECLARATIONS-REVIEW-R10.md does not exist under .planning/phases/05-accessories-conformance
exit=1
--- sequence-d18-reject-round10-open
LEDGER_VIOLATION L4-stop: DECLARATIONS round 10: D-03 result "continue" should be "STOP: <reason>"
LEDGER_VIOLATION L5: DECLARATIONS round 10: Closing 1 differs from the 0 findings with Disposition open
LEDGER_VIOLATION L5: DECLARATIONS round 10: Open IDs "CR-05-DECLARATIONS-001" should be "None"
LEDGER_VIOLATION L6: DECLARATIONS round 0: report 05-DECLARATIONS-REVIEW.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 1: report 05-DECLARATIONS-REVIEW-R1.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 2: report 05-DECLARATIONS-REVIEW-R2.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 3: report 05-DECLARATIONS-REVIEW-R3.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 4: report 05-DECLARATIONS-REVIEW-R4.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 5: report 05-DECLARATIONS-REVIEW-R5.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 6: report 05-DECLARATIONS-REVIEW-R6.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 7: report 05-DECLARATIONS-REVIEW-R7.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 8: report 05-DECLARATIONS-REVIEW-R8.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 9: report 05-DECLARATIONS-REVIEW-R9.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 10: report 05-DECLARATIONS-REVIEW-R10.md does not exist under .planning/phases/05-accessories-conformance
exit=1
--- sequence-d18-reject-round11
LEDGER_VIOLATION L4-cap: DECLARATIONS round 11: no batch records a round above 10 (D-18)
LEDGER_VIOLATION L6: DECLARATIONS round 0: report 05-DECLARATIONS-REVIEW.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 1: report 05-DECLARATIONS-REVIEW-R1.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 2: report 05-DECLARATIONS-REVIEW-R2.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 3: report 05-DECLARATIONS-REVIEW-R3.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 4: report 05-DECLARATIONS-REVIEW-R4.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 5: report 05-DECLARATIONS-REVIEW-R5.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 6: report 05-DECLARATIONS-REVIEW-R6.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 7: report 05-DECLARATIONS-REVIEW-R7.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 8: report 05-DECLARATIONS-REVIEW-R8.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 9: report 05-DECLARATIONS-REVIEW-R9.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 10: report 05-DECLARATIONS-REVIEW-R10.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 11: report 05-DECLARATIONS-REVIEW-R11.md does not exist under .planning/phases/05-accessories-conformance
exit=1
--- sequence-d03-reject-no-progress
LEDGER_VIOLATION L4-stop: DECLARATIONS round 1: D-03 result "continue" should be "STOP: <reason>"
LEDGER_VIOLATION L5: DECLARATIONS round 1: Closing 3 differs from the 0 findings with Disposition open
LEDGER_VIOLATION L5: DECLARATIONS round 1: Open IDs "CR-05-DECLARATIONS-001, CR-05-DECLARATIONS-002, CR-05-DECLARATIONS-003" should be "None"
LEDGER_VIOLATION L6: DECLARATIONS round 0: report 05-DECLARATIONS-REVIEW.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 1: report 05-DECLARATIONS-REVIEW-R1.md does not exist under .planning/phases/05-accessories-conformance
exit=1
--- sequence-d03-reject-reopen
LEDGER_VIOLATION L4-stop: DECLARATIONS round 1: D-03 result "continue" should be "STOP: <reason>"
LEDGER_VIOLATION L5: DECLARATIONS round 1: Closing 2 differs from the 0 findings with Disposition open
LEDGER_VIOLATION L5: DECLARATIONS round 1: Open IDs "CR-05-DECLARATIONS-001, CR-05-DECLARATIONS-002" should be "None"
LEDGER_VIOLATION L6: DECLARATIONS round 0: report 05-DECLARATIONS-REVIEW.md does not exist under .planning/phases/05-accessories-conformance
LEDGER_VIOLATION L6: DECLARATIONS round 1: report 05-DECLARATIONS-REVIEW-R1.md does not exist under .planning/phases/05-accessories-conformance
exit=1
```

#### Baseline gate (task 05-01-03)

| Field | Value |
| --- | --- |
| Command | `npm run check` |
| Raw exit | 0 |
| HEAD | `97e80a58ba8c271fbf295162d5016a81e7074ee8` (the protocol commit; `git status --porcelain` empty before the run) |
| Runtime | Node v26.12.0, npm 11.20.0 |
| UTC start | 2026-10-17T04:29:02Z |
| UTC end | 2026-10-17T04:30:01Z |
| Static checks | passed typecheck (3.5 s); passed lint (2.7 s); passed lint:workflows (0.4 s); passed fallow (3.5 s); passed format:check (0.8 s); passed test:corresponding (0.6 s) |
| Cucumber | 104 scenarios (104 passed); 1156 steps (1156 passed); 0m 24.198s (0m 24.87s executing your code) |
| Direct coverage | Merged LCOV: coverage/direct.lcov (43 pairs) |
| Stderr | `Random order using seed: 200367` |

This is a fresh run in this session; no earlier gate is reused. The stages are static checks,
`build:test`, `test:unpaired:compiled`, Cucumber and `test:coverage:direct:compiled --all`, and
each reached its summary line above.

### 05-02

Resume check at 2026-10-17T11:21:23Z: Node v26.12.0, empty `git status --porcelain`, tracer
`ACCESSORIES_LEDGER_TRACER_OK inventory=24 findings=7 open=0 rounds=0` (exit 0), and no committed
`### 05-02` subsection, so the plan starts at task 05-02-01.

Batch base: `053599a80557aa513b2d354833196408b92a4438`.

RED header check, `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --paths src/accessories/alarmMute.ts test/accessories/alarmMute.test.ts`:

```text
HEADER_VIOLATION src/accessories/alarmMute.ts: 2 expected an empty line after the SPDX line
HEADER_VIOLATION test/accessories/alarmMute.test.ts: 1 expected "// SPDX-License-Identifier: MIT"
exit=1
```

`node_modules/.bin/fallow guard` on the eight batch files: exit 0 (no boundary zones or rule packs
configured; every file in zone `none`).

Role resolution: `query resolve-model gsd-code-reviewer` and `gsd-code-fixer` both return model
`""` (omitted from dispatch), effort `high`, tier `opus`, profile `quality`;
`query agent-skills` returns an empty block for both roles.

Dispatch 1 (round 0): role `gsd-code-reviewer`, model omitted (resolved `""`), effort `high`
recorded (the Agent tool takes no effort parameter), foreground. Inputs: the eight batch files,
`review_path` `05-DECLARATIONS-REVIEW.md`, `review_round` 0, `source_revision`
`053599a80557aa513b2d354833196408b92a4438`, the owned leads and review questions of the plan's
execution notes, and the `.agents/skills` authority statement. Terminal result: report written,
24 findings (5 BLOCKER, 19 WARNING), `status: issues_found`; its toolchain runs (typecheck,
build:test, the four owners with 109 tests and 0 failures, the four pair commands) all exited 0
on Node v26.12.0; it edited no source or test and made no commit. Coordinator triage accepted all
24 as `open` and added lead S-05-22 for GATES.

Dispatch 2 (CR-05-DECLARATIONS-006): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning `src/accessories/alarmMute.ts`, `test/accessories/alarmMute.test.ts` and the
report. Terminal result: commit `f7b69290feadacd8d8b199750f5998564c6874f9`
(`style(alarmMute): add the approved file headers`), three owned paths, 21 insertions and 0
deletions; guard, build, owner (3 tests, 0 failures), pair coverage, header check and
`fallow audit --base 053599a` (verdict pass) all exited 0 on Node v26.12.0; the pre-step passed on
its first run and the hook (`npm run check:commit`, gitlint) passed. Coordinator check: the path
list is exactly the three owned paths, `git status --porcelain` is empty, the source diff adds only
header lines, the GREEN header check prints `ACCESSORIES_HEADERS_OK files=2` (exit 0), the owner
test reports 3 tests and 0 failures, the pair command exits 0, and the review commit `0d996f7` is
an ancestor of the header commit. The finding stays `open` until a correction round confirms it.

Dispatch 3 (CR-05-DECLARATIONS-007, 008, 009): role `gsd-code-fixer`, model omitted, effort
`high`, foreground, owning the services, customCharacteristics and customServices pairs and the
report. Terminal result: three header-only commits, `bf0f76d1f9ae647b3c796e4bf4349e42f14a48cf`
(services), `44583304e3f79ed288ee5df5059179abd9021896` (customCharacteristics) and
`0dcd7c206f95e897d47ff8b980d00791a1fdd073` (customServices), each with three owned paths; owner
counts unchanged (services 12, customCharacteristics 66, customServices 28 tests, 0 failures);
guard, build, pair coverage, header checks and `fallow audit --base 053599a` (verdict pass) exited
0 on Node v26.12.0; each pre-step passed on its first run and each hook passed. Coordinator
check: every commit lists exactly its three owned paths with 0 deleted lines, every added source
or test line is a header line, `git status --porcelain` is empty, and
`05-ledger-tracer.mjs --headers --batch DECLARATIONS` prints `ACCESSORIES_HEADERS_OK files=8`
(exit 0).

Dispatch 4 (CR-05-DECLARATIONS-016 to 020): role `gsd-code-fixer`, model omitted, effort
`high`, foreground, owning customCharacteristics.ts, services.ts, customServices.ts,
customServices.test.ts and the report. Terminal result: five commits, one per cause:
`644df7da5f5e97aca3ce08b6536d4846eba8b1fe` (016), `a9d9c4aea854f4e95eeef2f45de5085d54628ba9`
(017), `dfcd54710fd316a237296bdd4b9a491f84ff6eb4` (018), `ef0db0a69b59f8656b913bf562133b420165b342`
(019) and `5df1dff0f93cf0ee06e10db4974e6dc64ab8d7a6` (020); owner counts unchanged; guard, build,
pair coverage and `fallow audit --base 053599a` (verdict pass) exited 0 on Node v26.12.0; every
pre-step passed on its first run and every hook passed. Coordinator check: each commit lists
only its owned paths and the report, every changed source or test line is comment or JSDoc text
except the one intended test title in `ef0db0a` (019), and `git status --porcelain` is empty. The
fixer noted, without editing it, that the customServices.ts overview paragraph after the 020 edit
still opens "for the same reason", whose link to the paragraph before it is loose; the next
correction round reviews the whole file.

Dispatch 5 (CR-05-DECLARATIONS-005, 010, 021, 022, 011, 024): role `gsd-code-fixer`, model
omitted, effort `high`, foreground, owning alarmMute.test.ts, services.test.ts and the report.
Terminal result: six commits, one per cause: `c0a7b763a0234d7b1913dfff8d277ba1efaedf38` (005),
`b8cbe8cd2d7327718da2af455dfe8a83c176189b` (010), `8d4ed4d289c3785713d496ef03e7090bd5d7b6ad`
(021), `69c7801d97f3e5084cbf37181b9b7ce398818c6c` (022), `9cedd4da9516c475020510e32b21862199ff28ec`
(011) and `960f812d009ac7c7f4733ac42ae38ae693d28e17` (024); owners keep 3 (alarmMute) and 12
(services) tests with 0 failures; guard, build, pair coverage and `fallow audit --base 053599a`
(verdict pass) exited 0 on Node v26.12.0; every pre-step passed on its first run and every hook
passed. Assertion controls for the BLOCKER 005, recorded in the report: control A (a temporary
`src/accessories/temporaryMuteControl.ts` declaring `ALARM_MUTE_SECONDS`) and control B (the scan
root pointed at `.github/`) each made the named case fail on its intended whole-value assertion,
and each was restored (the temporary file deleted; the test blob
`8c4cb53358d9027f3dc7e0addf508a301a7929cc` equal before and after) with the case passing again.
Coordinator check: each commit lists only its test file and the report, `git diff c4def61..HEAD --
src` is empty, the temporary file is absent, `git status --porcelain` is empty, and
`SOURCE_MODULE_FLOOR` is 43, equal to the 43 `.ts` modules under `src/` today.

Dispatch 6 (CR-05-DECLARATIONS-001, 003, 004, 012): role `gsd-code-fixer`, model omitted,
effort `high`, foreground, owning customCharacteristics.test.ts and the report. Terminal result:
three commits, `7bb76e693c3ee0cc19b8d34cef7878728fb86a2b` (001, which also closes 012 by removing
the 16 "same identifier to every caller" cases), `9ef87cb48a947338e041f7b1d4baf666bdb0e877` (003,
folding three domain cases into the per-row whole value) and
`637da579f4c0a050c909248f2921e492167d41a4` (004, a null-valued base characteristic in the one
widening helper); the owner went from 66 to 50 to 47 tests with 0 failures, and the report maps
each removed case to where its protection now lives (P-05-03). Guard, build, pair coverage and
`fallow audit --base 053599a` (verdict pass) exited 0 on Node v26.12.0. One gitlint rejection of a
73-character title made no commit; the retry used a shorter title with no amend. Assertion
controls, recorded in the report, each failed the intended cases and were restored to source blob
`f9da27e6e8e9cf1ddd8931b6e087a488122df7b6`: 001 (swapped `PUMP_RUNNING_UUID` and
`PUMP_FAULT_UUID`: 3 cases fail), 003 (`maxValue: 255` on `ObservedActivationCount`: 2 cases fail)
and 004 (the default assignment deleted: all 6 "starts ..." cases fail). Coordinator check: each
commit lists only the test and the report, `git diff b26521e..HEAD -- src features` is empty, the
test's 16 UUID literals equal the source's 16, one `as unknown as` remains (in the widening
helper), no `// act & assert` remains, the owner passes 47 tests with 0 failures, and
`git status --porcelain` is empty.

Dispatch 7 (CR-05-DECLARATIONS-002, 013, 023): role `gsd-code-fixer`, model omitted, effort
`high`, foreground, owning customServices.test.ts and the report. Terminal result: two commits,
`9fba01681697766a71f52f5476fb1be6cea1e0d5` (002, which also closes 013 by removing the four "same
identifier to every caller" cases, and keeps cross-factory distinctness as a repeated-identifier
comparison against `[]`) and `6472fa9690eb16ee6d2aea3eb33f2a296b235dd5` (023, named element
interfaces, because the lint preset's `@typescript-eslint/array-type` rejects `ReadonlyArray`);
the owner went from 28 to 25 tests with 0 failures, and the report maps the removed cases
(P-05-03). Guard, build, pair coverage, ESLint and `fallow audit --base 053599a` (verdict pass)
exited 0 on Node v26.12.0; one Prettier reflow on the first pre-step, clean on the second.
Assertion controls, recorded in the report, each failed the intended cases and were restored to
source blob `43e5ab42eb2535527d0e5eda6e6fea1aaf7815bf`: A (sump-pit and pump service literals
swapped: 5 cases fail) and B (a service literal equal to a characteristic literal: the
cross-factory case fails). Coordinator check: each commit lists only the test and the report,
`git diff 3baea31..HEAD -- src features` is empty, the test's 4 service literals equal the
source's 4, no `// act & assert` remains, the owner passes 25 tests with 0 failures, and
`git status --porcelain` is empty.

Dispatch 8 (CR-05-DECLARATIONS-014, 015): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning the two custom test files and the report. Terminal result: two style-only
commits, `7cb0069f78ec90334133608bac968e431f7d08a7` (014) and
`96d5b190618ac8a055d4723bebc0078736efe1ee` (015), each removing one `describe` wrapper and its
import; owner counts unchanged (47 and 25 tests, now 0 suites) with identical title sets; guard,
build, pair coverage, ESLint and `fallow audit --base 053599a` (verdict pass) exited 0 on Node
v26.12.0. The Prettier hook joined one statement per file once the dedent let it fit; the fixer
kept the hook's formatting. Coordinator check: each commit lists only its test and the report;
with all whitespace removed, the customServices file differs from its parent only by the
wrapper and the import, and the customCharacteristics file differs additionally only by one
trailing comma in a call's argument list that Prettier dropped when it joined the line (no
semantic change); `git status --porcelain` is empty.

Round-0 repair pass complete: every DECLARATIONS finding has at least one fix commit (012 and 013
were closed by the 001 and 002 commits). Batch checks at HEAD
`96d5b190618ac8a055d4723bebc0078736efe1ee`, Node v26.12.0, 2026-10-17T12:33:07Z to 12:33:30Z:
`npm run build:test` exit 0; the four owners in one `node --test` run exit 0 (tests 87, suites 0,
pass 87, fail 0, cancelled 0, skipped 0, todo 0); `npm run test:coverage:direct --` with the four
sources exit 0; each pair command alone exit 0 (alarmMute, services, customCharacteristics,
customServices).

Correction round 1: dispatch 9, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over the eight batch files at `6a769c548826e4eefdfa809a5e1721ac5224a8e2` with the
opening set of 24 IDs and their fix commits. Terminal result: `05-DECLARATIONS-REVIEW-R1.md`, all
24 opening IDs confirmed fixed, one new BLOCKER CR-05-DECLARATIONS-025, `status: issues_found`;
its typecheck, ESLint, build, owners (87 tests, 0 failures), four pair commands and batch header
check all exited 0 on Node v26.12.0. Before any other action the coordinator applied the stop
rule: opening 24, fixed 24, rejected 0, new 1, reopened 0, closing 1, result `continue`.

Dispatch 10 (CR-05-DECLARATIONS-025): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning alarmMute.test.ts and the R1 report. Terminal result: commit
`00f7bd6a4cfd19fc47ad61a0dc96cc54857826e0` (`test(alarmMute): flag any declared mute constant in
the scan`), two owned paths; the owner keeps 3 tests with 0 failures; guard, build, pair coverage,
ESLint and `fallow audit --base 053599a` (verdict pass) exited 0 on Node v26.12.0; the pre-step
passed on its first run and the hook passed. Assertion control, recorded in the R1 report: a
temporary `src/accessories/temporaryMuteControl.ts` declaring `MUTE_DURATION_MS` made the case
fail with both modules in `declaring`, while the same plant passed the pre-fix filter; the file
was deleted and `src` is clean. Coordinator check: the commit lists only the test and the R1
report, it changes only the filter predicate and the pattern's comment, the temporary file is
absent, and `git status --porcelain` is empty.
