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
| 25 | src/persistence/accessoryContext.ts | adaptation | RECORDS | 1 | 112 | conforms |
| 26 | test/platform.test.ts | adaptation | RECORDS | 1 | 3779 | conforms |
| 27 | src/runtime/accountRuntime.ts | adaptation | RECORDS | 1 | 1346 | conforms |

Kind `addition` is a new file under `src/accessories` or `test/accessories`. Its row is recorded in
the commit right after the one that creates the file. Kind `adaptation` is any other path a batch
edits under D-06 or D-12. Its row is recorded before the edit. The First round of an `addition` or
`adaptation` row is the first correction round that must review it.

## Batch counters

| Batch | Round | Report | Revision | Opening | Fixed | Rejected | New | Reopened | Closing | Open IDs | D-03 result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DECLARATIONS | 0 | 05-DECLARATIONS-REVIEW.md | 053599a80557aa513b2d354833196408b92a4438 | 0 | 0 | 0 | 24 | 0 | 24 | CR-05-DECLARATIONS-001, CR-05-DECLARATIONS-002, CR-05-DECLARATIONS-003, CR-05-DECLARATIONS-004, CR-05-DECLARATIONS-005, CR-05-DECLARATIONS-006, CR-05-DECLARATIONS-007, CR-05-DECLARATIONS-008, CR-05-DECLARATIONS-009, CR-05-DECLARATIONS-010, CR-05-DECLARATIONS-011, CR-05-DECLARATIONS-012, CR-05-DECLARATIONS-013, CR-05-DECLARATIONS-014, CR-05-DECLARATIONS-015, CR-05-DECLARATIONS-016, CR-05-DECLARATIONS-017, CR-05-DECLARATIONS-018, CR-05-DECLARATIONS-019, CR-05-DECLARATIONS-020, CR-05-DECLARATIONS-021, CR-05-DECLARATIONS-022, CR-05-DECLARATIONS-023, CR-05-DECLARATIONS-024 | initial |
| DECLARATIONS | 1 | 05-DECLARATIONS-REVIEW-R1.md | 6a769c548826e4eefdfa809a5e1721ac5224a8e2 | 24 | 24 | 0 | 1 | 0 | 1 | CR-05-DECLARATIONS-025 | continue |
| DECLARATIONS | 2 | 05-DECLARATIONS-REVIEW-R2.md | d9ad7272c514a6be2f244a1815266c771b68b57d | 1 | 1 | 0 | 2 | 0 | 2 | CR-05-DECLARATIONS-026, CR-05-DECLARATIONS-027 | STOP: no progress; resolved by maintainer |
| DECLARATIONS | 3 | 05-DECLARATIONS-REVIEW-R3.md | 935b29044088a2fc0bd0f4e3e764dc4c21081fb7 | 2 | 2 | 0 | 1 | 0 | 1 | CR-05-DECLARATIONS-028 | continue |
| DECLARATIONS | 4 | 05-DECLARATIONS-REVIEW-R4.md | 6fcd1c3aa8f98f9a2e02d1d351c62087b348668f | 1 | 1 | 0 | 0 | 0 | 0 | None | clean |
| CATALOGUE | 0 | 05-CATALOGUE-REVIEW.md | ef7578f8c86c7f7b65adc3648cd7e404cfee7d12 | 0 | 0 | 0 | 15 | 0 | 15 | CR-05-CATALOGUE-001, CR-05-CATALOGUE-002, CR-05-CATALOGUE-003, CR-05-CATALOGUE-004, CR-05-CATALOGUE-005, CR-05-CATALOGUE-006, CR-05-CATALOGUE-007, CR-05-CATALOGUE-008, CR-05-CATALOGUE-009, CR-05-CATALOGUE-010, CR-05-CATALOGUE-011, CR-05-CATALOGUE-012, CR-05-CATALOGUE-013, CR-05-CATALOGUE-014, CR-05-CATALOGUE-015 | initial |
| CATALOGUE | 1 | 05-CATALOGUE-REVIEW-R1.md | 700ce9ac61885e50bfa39d9f0e0774f6372da749 | 15 | 15 | 0 | 2 | 0 | 2 | CR-05-CATALOGUE-016, CR-05-CATALOGUE-017 | continue |
| CATALOGUE | 2 | 05-CATALOGUE-REVIEW-R2.md | ec755ee2e4e9df8c608f11829085db637a472258 | 2 | 2 | 0 | 2 | 0 | 2 | CR-05-CATALOGUE-018, CR-05-CATALOGUE-019 | STOP: no progress; resolved by maintainer |
| CATALOGUE | 3 | 05-CATALOGUE-REVIEW-R3.md | 309d0da49c4866bef00d793477e4603b5c6146e4 | 2 | 2 | 0 | 3 | 0 | 3 | CR-05-CATALOGUE-020, CR-05-CATALOGUE-021, CR-05-CATALOGUE-022 | STOP: no progress; resolved by maintainer |
| CATALOGUE | 4 | 05-CATALOGUE-REVIEW-R4.md | e790d20da2ce14d82304048c524159b23b7b9293 | 3 | 3 | 0 | 2 | 0 | 2 | CR-05-CATALOGUE-023, CR-05-CATALOGUE-024 | continue |
| CATALOGUE | 5 | 05-CATALOGUE-REVIEW-R5.md | ddc645b1329990f3e9a652cfaa48767532d85186 | 2 | 1 | 0 | 0 | 0 | 1 | CR-05-CATALOGUE-024 | continue |
| CATALOGUE | 6 | 05-CATALOGUE-REVIEW-R6.md | 9fb85e1194b8b04a0d663fae5e813e8bbd8a57f1 | 1 | 1 | 0 | 0 | 0 | 0 | None | clean |
| CONTROLS | 0 | 05-CONTROLS-REVIEW.md | 4c143ebad681cf602e787b8c2ea09b050d8a9518 | 7 | 0 | 0 | 22 | 0 | 29 | CR-05-CONTROLS-001, CR-05-CONTROLS-002, CR-05-CONTROLS-003, CR-05-CONTROLS-004, CR-05-CONTROLS-005, CR-05-CONTROLS-006, CR-05-CONTROLS-007, CR-05-CONTROLS-008, CR-05-CONTROLS-009, CR-05-CONTROLS-010, CR-05-CONTROLS-011, CR-05-CONTROLS-012, CR-05-CONTROLS-013, CR-05-CONTROLS-014, CR-05-CONTROLS-015, CR-05-CONTROLS-016, CR-05-CONTROLS-017, CR-05-CONTROLS-018, CR-05-CONTROLS-019, CR-05-CONTROLS-020, CR-05-CONTROLS-021, CR-05-CONTROLS-022, CR-05-CONTROLS-023, CR-05-CONTROLS-024, CR-05-CONTROLS-025, CR-05-CONTROLS-026, CR-05-CONTROLS-027, CR-05-CONTROLS-028, CR-05-CONTROLS-029 | initial |
| CONTROLS | 1 | 05-CONTROLS-REVIEW-R1.md | b86e6b05549e3569ce3e4dae457efb97bd8d6485 | 29 | 29 | 0 | 4 | 0 | 4 | CR-05-CONTROLS-030, CR-05-CONTROLS-031, CR-05-CONTROLS-032, CR-05-CONTROLS-033 | continue |
| CONTROLS | 2 | 05-CONTROLS-REVIEW-R2.md | 858fb2c550fd4aa10d378f8611961034e7458299 | 4 | 4 | 0 | 3 | 0 | 3 | CR-05-CONTROLS-034, CR-05-CONTROLS-035, CR-05-CONTROLS-036 | continue |
| CONTROLS | 3 | 05-CONTROLS-REVIEW-R3.md | 207d5460d50789ae04b7b5ecdd712dc7ff5dfa88 | 3 | 3 | 0 | 2 | 0 | 2 | CR-05-CONTROLS-037, CR-05-CONTROLS-038 | continue |
| CONTROLS | 4 | 05-CONTROLS-REVIEW-R4.md | 3605e598f06f8c3068e102dc777272f5f810ce12 | 2 | 2 | 0 | 3 | 0 | 3 | CR-05-CONTROLS-039, CR-05-CONTROLS-040, CR-05-CONTROLS-041 | STOP: no progress; resolved by maintainer |
| CONTROLS | 5 | 05-CONTROLS-REVIEW-R5.md | 5dd054efc3b9b5c89a336f9e4fd6c04b46a5209e | 3 | 3 | 0 | 1 | 0 | 1 | CR-05-CONTROLS-042 | continue |
| CONTROLS | 6 | 05-CONTROLS-REVIEW-R6.md | bab42433952af1ffc3f83653537f78d1e8bdde40 | 1 | 1 | 0 | 1 | 0 | 1 | CR-05-CONTROLS-043 | STOP: no progress; resolved by maintainer |
| CONTROLS | 7 | 05-CONTROLS-REVIEW-R7.md | 09727ef76427811f8773b47345046c85ce41d657 | 1 | 1 | 0 | 1 | 0 | 1 | CR-05-CONTROLS-044 | STOP: no progress; resolved by maintainer |
| CONTROLS | 8 | 05-CONTROLS-REVIEW-R8.md | 47b0cb1e8e95c0cbe796825142e92b3bc91e151e | 1 | 1 | 0 | 1 | 0 | 1 | CR-05-CONTROLS-045 | STOP: no progress; resolved by maintainer |
| CONTROLS | 9 | 05-CONTROLS-REVIEW-R9.md | 3f5fefeb92bf57132da4d03909956691528882e8 | 1 | 1 | 0 | 0 | 0 | 0 | None | clean |
| RECORDS | 0 | 05-RECORDS-REVIEW.md | 0c0930e890cb41e74d0d4e854ba45c41a31fea4a | 0 | 0 | 0 | 31 | 0 | 31 | CR-05-RECORDS-001, CR-05-RECORDS-002, CR-05-RECORDS-003, CR-05-RECORDS-004, CR-05-RECORDS-005, CR-05-RECORDS-006, CR-05-RECORDS-007, CR-05-RECORDS-008, CR-05-RECORDS-009, CR-05-RECORDS-010, CR-05-RECORDS-011, CR-05-RECORDS-012, CR-05-RECORDS-013, CR-05-RECORDS-014, CR-05-RECORDS-015, CR-05-RECORDS-016, CR-05-RECORDS-017, CR-05-RECORDS-018, CR-05-RECORDS-019, CR-05-RECORDS-020, CR-05-RECORDS-021, CR-05-RECORDS-022, CR-05-RECORDS-023, CR-05-RECORDS-024, CR-05-RECORDS-025, CR-05-RECORDS-026, CR-05-RECORDS-027, CR-05-RECORDS-028, CR-05-RECORDS-029, CR-05-RECORDS-030, CR-05-RECORDS-031 | initial |
| RECORDS | 1 | 05-RECORDS-REVIEW-R1.md | 8e7a2463c53546cbd80f135ea2974b4ec8d85ef7 | 31 | 31 | 1 | 6 | 0 | 5 | CR-05-RECORDS-033, CR-05-RECORDS-034, CR-05-RECORDS-035, CR-05-RECORDS-036, CR-05-RECORDS-037 | continue |
| RECORDS | 2 | 05-RECORDS-REVIEW-R2.md | 07a232ebdcd768bc34ada8957753b90a8f498da4 | 5 | 5 | 0 | 4 | 0 | 4 | CR-05-RECORDS-038, CR-05-RECORDS-039, CR-05-RECORDS-040, CR-05-RECORDS-041 | continue |
| RECORDS | 3 | 05-RECORDS-REVIEW-R3.md | eb762e4774ea5e8203062d30fc759a0421243de5 | 4 | 4 | 0 | 0 | 0 | 0 | None | clean |
| ACCESSORY | 0 | 05-ACCESSORY-REVIEW.md | 9cb164b1299249c2d2083ea81677c83e28e66916 | 0 | 0 | 0 | 29 | 0 | 29 | CR-05-ACCESSORY-001, CR-05-ACCESSORY-002, CR-05-ACCESSORY-003, CR-05-ACCESSORY-004, CR-05-ACCESSORY-005, CR-05-ACCESSORY-006, CR-05-ACCESSORY-007, CR-05-ACCESSORY-008, CR-05-ACCESSORY-009, CR-05-ACCESSORY-010, CR-05-ACCESSORY-011, CR-05-ACCESSORY-012, CR-05-ACCESSORY-013, CR-05-ACCESSORY-014, CR-05-ACCESSORY-015, CR-05-ACCESSORY-016, CR-05-ACCESSORY-017, CR-05-ACCESSORY-018, CR-05-ACCESSORY-019, CR-05-ACCESSORY-020, CR-05-ACCESSORY-021, CR-05-ACCESSORY-022, CR-05-ACCESSORY-023, CR-05-ACCESSORY-024, CR-05-ACCESSORY-025, CR-05-ACCESSORY-026, CR-05-ACCESSORY-027, CR-05-ACCESSORY-028, CR-05-ACCESSORY-029 | initial |
| ACCESSORY | 1 | 05-ACCESSORY-REVIEW-R1.md | 27a959e638209f6956e4715328ebcd89ee818aea | 29 | 27 | 0 | 3 | 0 | 5 | CR-05-ACCESSORY-017, CR-05-ACCESSORY-020, CR-05-ACCESSORY-030, CR-05-ACCESSORY-031, CR-05-ACCESSORY-032 | continue |
| ACCESSORY | 2 | 05-ACCESSORY-REVIEW-R2.md | 7a169429373d331a96698fc5e8bcefaf5aae4c31 | 5 | 5 | 0 | 1 | 0 | 1 | CR-05-ACCESSORY-033 | continue |
| ACCESSORY | 3 | 05-ACCESSORY-REVIEW-R3.md | 530da8016ae53d470b226fde15b29e40be9836dc | 1 | 1 | 0 | 1 | 0 | 1 | CR-05-ACCESSORY-034 | STOP: no progress; resolved by maintainer |
| ACCESSORY | 4 | 05-ACCESSORY-REVIEW-R4.md | 6218b62c55b7d18c0a1ae59c9f8455bf89f1e573 | 1 | 1 | 0 | 0 | 0 | 0 | None | clean |
| GATES | 0 | 05-GATES-REVIEW.md | 379e86772fb2f353abbbe9c35dc3aa502bbb68f9 | 0 | 0 | 0 | 17 | 0 | 17 | CR-05-GATES-001, CR-05-GATES-002, CR-05-GATES-003, CR-05-GATES-004, CR-05-GATES-005, CR-05-GATES-006, CR-05-GATES-007, CR-05-GATES-008, CR-05-GATES-009, CR-05-GATES-010, CR-05-GATES-011, CR-05-GATES-012, CR-05-GATES-013, CR-05-GATES-014, CR-05-GATES-015, CR-05-GATES-016, CR-05-GATES-017 | initial |

The rule is closing = opening - fixed - rejected + new + reopened. Round 0 is the initial review. Its Opening is
the batch's pre-allocated seed IDs: 7 for CONTROLS and 0 for every other batch. Rounds 1 to 10 are
correction rounds, and no batch records a round above 10 (D-18). The result vocabulary is
`initial`, `continue`, `clean` and `STOP: <reason>`, where the reason is `no progress`,
`reopened <IDs>` or `open after round 10`.

## Findings

| ID | Batch | Severity | Rule | Initial location | Current location | First reviewer | Disposition | Reason | Fix commits | Checks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CR-05-CONTROLS-001 | CONTROLS | WARNING | Seed (a), whole-value check: `.agents/skills/typescript-unit-tests/rules/cases.md` Assertions | `64c4fea:test/accessories/controls.test.ts:831` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:817-830` (line 829 compares a warnings count) | spot check 64c4fea; Phase 1 handoff | fixed |  | 7929ddb303 |  |
| CR-05-CONTROLS-002 | CONTROLS | WARNING | Seed (b), no `describe()` per exported entrypoint: `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure | `64c4fea:test/accessories/controls.test.ts` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:12` (cases for `createControlBinder` at 184-881 and for `bindRestoredControlRefusal` at 921-1001) | spot check 64c4fea; Phase 1 handoff | fixed |  | 41e0ca4f79, dbcbf0788d |  |
| CR-05-CONTROLS-003 | CONTROLS | WARNING | Seed (c), case tests the stand-in: `.agents/skills/typescript-unit-tests/SKILL.md` preamble (every case discriminates the module); D-13 | `64c4fea:test/accessories/controls.test.ts:217-238` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:216-243` | spot check 64c4fea; Phase 1 handoff | fixed | after removal, test/accessories/hapWriteFidelity.test.ts 'survives a push queued as a microtask inside the handler, on both implementations' carries the protection (D-13) | 13d46f1810 |  |
| CR-05-CONTROLS-004 | CONTROLS | WARNING | Seed (d), hand-rolled `.bind` spy: `.agents/skills/typescript-unit-tests/rules/test-doubles.md` Spies; `.agents/skills/typescript-style/rules/review.md` Quick scan | `64c4fea:test/accessories/controls.test.ts:316-335` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:321-340` (the spy at 326-332) | spot check 64c4fea; Phase 1 handoff | fixed |  | 014f6014ea |  |
| CR-05-CONTROLS-005 | CONTROLS | WARNING | Seed (e), combined act-and-assert marker over two statements: `.agents/skills/typescript-unit-tests/rules/cases.md` Case structure | `64c4fea:test/accessories/controls.test.ts:928-933` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:926-931, 980-981` | spot check 64c4fea; Phase 1 handoff | fixed |  | 05b4b9ab25 |  |
| CR-05-CONTROLS-006 | CONTROLS | WARNING | Seed (f), undocumented `as unknown as Service` casts: `.agents/skills/typescript-style/rules/types.md`; `.agents/skills/typescript-unit-tests/rules/cases.md` Types and isolation; D-11 | `64c4fea:test/accessories/controls.test.ts:158, 330, 853, 874, 905` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:163, 335, 336, 851, 872, 903` | spot check 64c4fea; Phase 1 handoff | fixed |  | 0506c32ca7 |  |
| CR-05-CONTROLS-007 | CONTROLS | WARNING | Seed (g), ordering comment on the wrong constant: `.agents/skills/typescript-style/rules/naming-and-docs.md` Comments and documentation; `.agents/skills/typescript-style/rules/comments.md` | `64c4fea:src/accessories/controls.ts:304-328` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:304-336` | spot check 64c4fea; Phase 1 handoff | fixed |  | c2026fe917 |  |
| CR-05-CONTROLS-008 | CONTROLS | BLOCKER | D-037; CTRL-03; CTRL-05; .agents/skills/typescript-unit-tests/rules/review.md Classifying findings; D-04 | `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:336-343, 492-499, 537-571; test/accessories/controls.test.ts:245-304, 754-881` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:336-343, 492-499, 537-571; test/accessories/controls.test.ts:245-304, 754-881` | gsd-code-reviewer round 0 | fixed | D-04 genuine bug (coordinator): a second on request while one is pending is sent, and D-037 says to reject it; the new refusal goes last and answers RESOURCE_BUSY | 9b5cd20710, a2ae20acc0 |  |
| CR-05-CONTROLS-009 | CONTROLS | BLOCKER | D-038; D-037; CTRL-05; .agents/skills/typescript-unit-tests/rules/review.md Classifying findings; D-04; D-10 (SC-02) | `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:526-535; test/accessories/controls.test.ts:342-361, 505-515, 586-597` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:526-535; test/accessories/controls.test.ts:342-361, 505-515, 586-597` | gsd-code-reviewer round 0 | fixed | D-04 genuine bug (coordinator): a timed-out command drops its pending entry, and D-038 says to keep it | 1f8593865e, 670ae8955b |  |
| CR-05-CONTROLS-010 | CONTROLS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (a plausible wrong implementation passes); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings; D-05 refusal order | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:409-411, 631-725` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:409-411, 631-725` | gsd-code-reviewer round 0 | fixed | also pins the pending rule from 008 against every rule that can hold with it | 2a6747b101 |  |
| CR-05-CONTROLS-011 | CONTROLS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md; .agents/skills/typescript-unit-tests/rules/cases.md Assertions; .agents/skills/typescript-unit-tests/rules/review.md Classifying findings; D-05 one attempt; D-10 (SC-02) | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:342-361, 586-597` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:342-361, 586-597` | gsd-code-reviewer round 0 | fixed |  | ae0eaa4ef2 |  |
| CR-05-CONTROLS-012 | CONTROLS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md; .agents/skills/typescript-unit-tests/rules/cases.md Assertions; .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:282-304` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:282-304` | gsd-code-reviewer round 0 | fixed |  | 7a3bfc0078 |  |
| CR-05-CONTROLS-013 | CONTROLS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md; .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:184-199, 342-393, 569-584, 727-742; src/accessories/controls.ts:377-381, 501-505` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:184-199, 342-393, 569-584, 727-742; src/accessories/controls.ts:377-381, 501-505` | gsd-code-reviewer round 0 | fixed |  | 5f06eb71de |  |
| CR-05-CONTROLS-014 | CONTROLS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md; .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:363-374, 379-393, 987-1001; src/accessories/controls.ts:429-432, 501-505` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:363-374, 379-393, 987-1001; src/accessories/controls.ts:429-432, 501-505` | gsd-code-reviewer round 0 | fixed |  | 0ca2edf59f |  |
| CR-05-CONTROLS-015 | CONTROLS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md; .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:921-1001; src/accessories/controls.ts:390-436` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:921-1001; src/accessories/controls.ts:390-436` | gsd-code-reviewer round 0 | fixed |  | cc1ebae79a |  |
| CR-05-CONTROLS-016 | CONTROLS | BLOCKER | .agents/skills/typescript-unit-tests/rules/cases.md Assertions (errors by class and structured fields); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings; D-05 HapStatusError thrown only by the binder | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:173-182, 521-545; src/accessories/controls.ts:355-360` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:173-182, 521-545; src/accessories/controls.ts:355-360` | gsd-code-reviewer round 0 | fixed |  | 11b384a4e5 |  |
| CR-05-CONTROLS-017 | CONTROLS | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Case structure; D-10 (SC-02) | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:192, 207, 238, 353, 369, 387, 403, 616, 638, 651, 668, 684, 704, 721, 733, 943, 960, 995` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:192, 207, 238, 353, 369, 387, 403, 616, 638, 651, 668, 684, 704, 721, 733, 943, 960, 995` | gsd-code-reviewer round 0 | fixed |  | 498f0da0e1 |  |
| CR-05-CONTROLS-018 | CONTROLS | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Assertions (await every promise); D-16 | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:910-919` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:910-919` | gsd-code-reviewer round 0 | fixed |  | 5d230b6bb1 |  |
| CR-05-CONTROLS-019 | CONTROLS | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Data-driven cases | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:547-557` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:547-557` | gsd-code-reviewer round 0 | fixed | one sibling test() per REFUSALS row | 074ed67e99 |  |
| CR-05-CONTROLS-020 | CONTROLS | WARNING | .agents/skills/typescript-style/rules/comments.md; .agents/skills/typescript-style/rules/naming-and-docs.md Comments and documentation | `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:143-147` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:143-147` | gsd-code-reviewer round 0 | fixed |  | ee4969f0ec |  |
| CR-05-CONTROLS-021 | CONTROLS | WARNING | .agents/skills/typescript-style/rules/comments.md Forbidden (narration of code that no longer exists) | `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:97-103, 323-324` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:97-103, 323-324` | gsd-code-reviewer round 0 | fixed |  | b1a7668c7d |  |
| CR-05-CONTROLS-022 | CONTROLS | WARNING | .agents/skills/typescript-style/rules/comments.md Forbidden (narration of code that no longer exists) | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:690-693, 710-713` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:690-693, 710-713` | gsd-code-reviewer round 0 | fixed |  | 09882cfdfd |  |
| CR-05-CONTROLS-023 | CONTROLS | WARNING | .agents/skills/typescript-unit-tests/rules/test-doubles.md Mocks; D-10 (SC-02) | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:104-118` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:104-118` | gsd-code-reviewer round 0 | fixed |  | dbad2c167a |  |
| CR-05-CONTROLS-024 | CONTROLS | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Test data and Case structure; D-10 (SC-02) | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:28-30, 433, 444, 455, 466, 477, 488` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:28-30, 433, 444, 455, 466, 477, 488` | gsd-code-reviewer round 0 | fixed |  | c6267b1f87 |  |
| CR-05-CONTROLS-025 | CONTROLS | WARNING | D-01; .agents/skills/typescript-style/rules/modules-and-data.md Files and modules | `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:1-2` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:1-2` | gsd-code-reviewer round 0 | fixed |  | 704a2ff760 |  |
| CR-05-CONTROLS-026 | CONTROLS | WARNING | .agents/skills/typescript-style/rules/comments.md; .agents/skills/typescript-style/rules/naming-and-docs.md Comments and documentation | `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:21-23, 304-305` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:src/accessories/controls.ts:21-23, 304-305` | gsd-code-reviewer round 0 | fixed |  | e3c873166b |  |
| CR-05-CONTROLS-027 | CONTROLS | WARNING | .agents/skills/typescript-style/rules/comments.md | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:74-80` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:74-80` | gsd-code-reviewer round 0 | fixed |  | 710b87f0b7 |  |
| CR-05-CONTROLS-028 | CONTROLS | WARNING | .agents/skills/typescript-style/rules/functions.md | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:98, 154` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:98, 154` | gsd-code-reviewer round 0 | fixed |  | a734c1a235 |  |
| CR-05-CONTROLS-029 | CONTROLS | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Assertions; D-10 (SC-02) | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:265-266, 575-582` | `4c143ebad681cf602e787b8c2ea09b050d8a9518:test/accessories/controls.test.ts:265-266, 575-582` | gsd-code-reviewer round 0 | fixed | D-10 added by the coordinator: the fix adds a field to the REFUSALS rows that SC-02 touched | 9dd9ead688 |  |
| CR-05-CONTROLS-030 | CONTROLS | WARNING | .agents/skills/typescript-style/rules/comments.md (comments describe the code as it stands) | `b86e6b05549e3569ce3e4dae457efb97bd8d6485:test/accessories/controls.test.ts:52-53, 165, 209-216, 431-432, 581-583` | `b86e6b05549e3569ce3e4dae457efb97bd8d6485:test/accessories/controls.test.ts:52-53, 165, 209-216, 431-432, 581-583` | gsd-code-reviewer round 1 | fixed | new cause from the 002 move and earlier repairs; not a reopen of 002 | f96f63c141 |  |
| CR-05-CONTROLS-031 | CONTROLS | WARNING | .agents/skills/typescript-style/rules/functions.md (a function declaration for a named function) | `b86e6b05549e3569ce3e4dae457efb97bd8d6485:test/accessories/controls.test.ts:67, 85` | `b86e6b05549e3569ce3e4dae457efb97bd8d6485:test/accessories/controls.test.ts:67, 85` | gsd-code-reviewer round 1 | fixed |  | 75b9825456 |  |
| CR-05-CONTROLS-032 | CONTROLS | WARNING | .agents/skills/typescript-style/rules/comments.md; .agents/skills/typescript-style/rules/naming-and-docs.md Comments and documentation | `b86e6b05549e3569ce3e4dae457efb97bd8d6485:src/accessories/controls.ts:471-473, 530-531, 601-602` | `b86e6b05549e3569ce3e4dae457efb97bd8d6485:src/accessories/controls.ts:471-473, 530-531, 601-602` | gsd-code-reviewer round 1 | fixed |  | 854d5d117c |  |
| CR-05-CONTROLS-033 | CONTROLS | WARNING | D-038; D-037; CTRL-05; .agents/skills/typescript-style/rules/comments.md by analogy; D-04; D-10 (SC-02) | `b86e6b05549e3569ce3e4dae457efb97bd8d6485:src/accessories/controls.ts:553-556, 563; test/accessories/controls.test.ts:337, 784, 912` | `b86e6b05549e3569ce3e4dae457efb97bd8d6485:src/accessories/controls.ts:553-556, 563; test/accessories/controls.test.ts:337, 784, 912` | gsd-code-reviewer round 1 | fixed | D-04 genuine bug (coordinator): a timed-out command logs that it did not take effect, which D-038 says the plugin cannot know; only the timed-out line changes | 11c32d23df, 7790818ee0 |  |
| CR-05-CONTROLS-034 | CONTROLS | WARNING | .agents/skills/typescript-unit-tests/SKILL.md (a case names the behavior it proves); .agents/skills/typescript-unit-tests/rules/pairing-and-design.md What not to test | `858fb2c550fd4aa10d378f8611961034e7458299:test/accessories/controls.test.ts:917-932 (duplicate of 792-806)` | `858fb2c550fd4aa10d378f8611961034e7458299:test/accessories/controls.test.ts:917-932 (duplicate of 792-806)` | gsd-code-reviewer round 2 | fixed | remove the older case; the D-04 regression case stays (P-05-03) | 5f5a8282b2 |  |
| CR-05-CONTROLS-035 | CONTROLS | WARNING | .agents/skills/typescript-style/rules/comments.md; .agents/skills/typescript-style/rules/naming-and-docs.md Comments and documentation | `858fb2c550fd4aa10d378f8611961034e7458299:src/accessories/controls.ts:89-92, 403-409` | `858fb2c550fd4aa10d378f8611961034e7458299:src/accessories/controls.ts:89-92, 403-409` | gsd-code-reviewer round 2 | fixed |  | 3e879b6a15 |  |
| CR-05-CONTROLS-036 | CONTROLS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (a plausible wrong implementation passes); .agents/skills/typescript-unit-tests/rules/pairing-and-design.md Pairing and coverage | `858fb2c550fd4aa10d378f8611961034e7458299:test/accessories/controls.test.ts:729-759, 838-873, 1210-1231` | `858fb2c550fd4aa10d378f8611961034e7458299:test/accessories/controls.test.ts:729-759, 838-873, 1210-1231` | gsd-code-reviewer round 2 | fixed | pin the decided WR-02 behavior: a refused press while a request waits pushes the reported value | 96273624c9 |  |
| CR-05-CONTROLS-037 | CONTROLS | WARNING | .agents/skills/typescript-style/rules/comments.md; .agents/skills/typescript-style/rules/naming-and-docs.md Comments and documentation | `207d5460d50789ae04b7b5ecdd712dc7ff5dfa88:src/accessories/controls.ts:89-95, 404-412` | `207d5460d50789ae04b7b5ecdd712dc7ff5dfa88:src/accessories/controls.ts:89-95, 404-412` | gsd-code-reviewer round 3 | fixed | new cause in comments the 035 fix restated; not a reopen | 946be0e583, a1be90c32b |  |
| CR-05-CONTROLS-038 | CONTROLS | WARNING | .agents/skills/typescript-style/rules/comments.md | `207d5460d50789ae04b7b5ecdd712dc7ff5dfa88:test/accessories/controls.test.ts:1115-1118` | `207d5460d50789ae04b7b5ecdd712dc7ff5dfa88:test/accessories/controls.test.ts:1115-1118` | gsd-code-reviewer round 3 | fixed | new cause in a comment the 030 fix restated; not a reopen | eb503e5643 |  |
| CR-05-CONTROLS-039 | CONTROLS | WARNING | .agents/skills/typescript-style/rules/comments.md; .agents/skills/typescript-style/rules/naming-and-docs.md Comments and documentation | `3605e598f06f8c3068e102dc777272f5f810ce12:src/accessories/controls.ts:152-153, 272-276, 400-402, 516-518` | `3605e598f06f8c3068e102dc777272f5f810ce12:src/accessories/controls.ts:152-153, 272-276, 400-402, 516-518` | gsd-code-reviewer round 4 | fixed | the comments state the accessory trust rules wrongly; not a reopen of 037 | 77db333166, aded73a1a8 |  |
| CR-05-CONTROLS-040 | CONTROLS | WARNING | .agents/skills/typescript-style/rules/comments.md; .agents/skills/typescript-style/rules/naming-and-docs.md Comments and documentation | `3605e598f06f8c3068e102dc777272f5f810ce12:test/accessories/controls.test.ts:925-927, 929, 1178-1182` | `3605e598f06f8c3068e102dc777272f5f810ce12:test/accessories/controls.test.ts:925-927, 929, 1178-1182` | gsd-code-reviewer round 4 | fixed | the same wrong model in test comments and one title; not a reopen of 038 | 7d1943e615 |  |
| CR-05-CONTROLS-041 | CONTROLS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (a plausible wrong implementation passes); D-037; CTRL-03 | `3605e598f06f8c3068e102dc777272f5f810ce12:test/accessories/controls.test.ts (no case presses while the first send is in flight); src/accessories/controls.ts:answerWrite` | `3605e598f06f8c3068e102dc777272f5f810ce12:test/accessories/controls.test.ts (no case presses while the first send is in flight); src/accessories/controls.ts:answerWrite` | gsd-code-reviewer round 4 | fixed | test gap, not a production bug: the current code refuses the press | f9f2bcd011 |  |
| CR-05-CONTROLS-042 | CONTROLS | WARNING | .agents/skills/typescript-style/rules/comments.md; .agents/skills/typescript-style/rules/naming-and-docs.md Comments and documentation | `5dd054efc3b9b5c89a336f9e4fd6c04b46a5209e:src/accessories/controls.ts:95-105` | `5dd054efc3b9b5c89a336f9e4fd6c04b46a5209e:src/accessories/controls.ts:95-105` | gsd-code-reviewer round 5 | fixed | the transport fact clears after one failed poll, the row trust after two; present since the batch base | 3bda590999 |  |
| CR-05-CONTROLS-043 | CONTROLS | WARNING | .agents/skills/typescript-style/rules/comments.md; .agents/skills/typescript-style/rules/naming-and-docs.md Comments and documentation | `bab42433952af1ffc3f83653537f78d1e8bdde40:src/accessories/controls.ts:18-21` | `bab42433952af1ffc3f83653537f78d1e8bdde40:src/accessories/controls.ts:18-21` | gsd-code-reviewer round 6 | fixed | the overview names the published-service lookup, but binding goes through ensureService, which adds the service on a new accessory | af70160a2f |  |
| CR-05-CONTROLS-044 | CONTROLS | WARNING | .agents/skills/typescript-style/rules/comments.md; .agents/skills/typescript-style/rules/naming-and-docs.md Comments and documentation | `09727ef76427811f8773b47345046c85ce41d657:src/accessories/controls.ts:48-52, 428-443` | `09727ef76427811f8773b47345046c85ce41d657:src/accessories/controls.ts:48-52, 428-443` | gsd-code-reviewer round 7 | fixed | the restored refusal outlives the first inventory for a family that does not resolve; behavior question goes to ACCESSORY as S-05-25 | dda7a47927, 52f33bf519 |  |
| CR-05-CONTROLS-045 | CONTROLS | WARNING | .agents/skills/typescript-style/rules/comments.md; .agents/skills/typescript-style/rules/naming-and-docs.md Comments and documentation | `47b0cb1e8e95c0cbe796825142e92b3bc91e151e:src/accessories/controls.ts:465-469` | `47b0cb1e8e95c0cbe796825142e92b3bc91e151e:src/accessories/controls.ts:465-469` | gsd-code-reviewer round 8 | fixed | pinned HAP lets the binder onSet take over an on(set) refusal too, so onSet is not what makes the refusal replaceable; present since the first release | 23ebcc1759 |  |
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
| CR-05-DECLARATIONS-025 | DECLARATIONS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (cases discriminate); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `6a769c548826e4eefdfa809a5e1721ac5224a8e2:test/accessories/alarmMute.test.ts:25-28, 73-87` | `6a769c548826e4eefdfa809a5e1721ac5224a8e2:test/accessories/alarmMute.test.ts:25-28, 73-87` | gsd-code-reviewer round 1 | fixed |  | 00f7bd6a4c |  |
| CR-05-DECLARATIONS-026 | DECLARATIONS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (cases discriminate); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings; .agents/skills/typescript-style/rules/naming-and-docs.md Naming | `d9ad7272c514a6be2f244a1815266c771b68b57d:test/accessories/alarmMute.test.ts:25-28, 70-87` | `d9ad7272c514a6be2f244a1815266c771b68b57d:test/accessories/alarmMute.test.ts:25-28, 70-87` | gsd-code-reviewer round 2 | fixed |  | ae9647dda2 |  |
| CR-05-DECLARATIONS-027 | DECLARATIONS | WARNING | .agents/skills/typescript-style/rules/comments.md | `d9ad7272c514a6be2f244a1815266c771b68b57d:src/accessories/services.ts:20-22, 58-64` | `d9ad7272c514a6be2f244a1815266c771b68b57d:src/accessories/services.ts:20-22, 58-64` | gsd-code-reviewer round 2 | fixed |  | c88bcca6eb |  |
| CR-05-DECLARATIONS-028 | DECLARATIONS | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Case structure (titles); .agents/skills/typescript-style/rules/comments.md | `935b29044088a2fc0bd0f4e3e764dc4c21081fb7:test/accessories/alarmMute.test.ts:89` | `935b29044088a2fc0bd0f4e3e764dc4c21081fb7:test/accessories/alarmMute.test.ts:89` | gsd-code-reviewer round 3 | fixed |  | bd39257f44 |  |
| CR-05-CATALOGUE-001 | CATALOGUE | WARNING | D-01; .agents/skills/typescript-style/rules/modules-and-data.md Files and modules | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:src/accessories/serviceCatalogue.ts:1-2; test/accessories/serviceCatalogue.test.ts:1` | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:src/accessories/serviceCatalogue.ts:1-2; test/accessories/serviceCatalogue.test.ts:1` | gsd-code-reviewer round 0 | fixed |  | c89c8c48d1 |  |
| CR-05-CATALOGUE-002 | CATALOGUE | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Case structure (act-and-assert marker) | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:1466-1829 (19 markers)` | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:1466-1829 (19 markers)` | gsd-code-reviewer round 0 | fixed |  | e86674b45b |  |
| CR-05-CATALOGUE-003 | CATALOGUE | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (cases discriminate); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:1053-1080, 826-917, 1082-1129, 172-174, 178-190` | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:1053-1080, 826-917, 1082-1129, 172-174, 178-190` | gsd-code-reviewer round 0 | fixed |  | 76d78ebd66 |  |
| CR-05-CATALOGUE-004 | CATALOGUE | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (cases discriminate); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings; .agents/skills/typescript-unit-tests/rules/cases.md Case structure (titles) | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:141-150, 341-402, 1485-1491` | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:141-150, 341-402, 1485-1491` | gsd-code-reviewer round 0 | fixed |  | 36f5ff2633 |  |
| CR-05-CATALOGUE-005 | CATALOGUE | BLOCKER | .agents/skills/typescript-unit-tests/rules/cases.md Assertions (independent expected values); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:1410-1428` | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:1410-1428` | gsd-code-reviewer round 0 | fixed |  | 5420b9d135 |  |
| CR-05-CATALOGUE-006 | CATALOGUE | BLOCKER | .agents/skills/typescript-unit-tests/rules/cases.md Assertions (whole values); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:372-382, 1737-1753` | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:372-382, 1737-1753` | gsd-code-reviewer round 0 | fixed |  | 2f31fbd6fb |  |
| CR-05-CATALOGUE-007 | CATALOGUE | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (cases discriminate); .agents/skills/typescript-unit-tests/rules/boundaries.md (type-level negatives); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:157-158` | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:157-158` | gsd-code-reviewer round 0 | fixed |  | 570adc0658 |  |
| CR-05-CATALOGUE-008 | CATALOGUE | WARNING | .agents/skills/typescript-style/rules/modules-and-data.md Files and modules; .agents/skills/typescript-unit-tests/rules/pairing-and-design.md Design production code for its tests | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:src/accessories/serviceCatalogue.ts:224-241; test/accessories/serviceCatalogue.test.ts:17, 1553-1592, 1788` | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:src/accessories/serviceCatalogue.ts:224-241; test/accessories/serviceCatalogue.test.ts:17, 1553-1592, 1788` | gsd-code-reviewer round 0 | fixed |  | b70716fdbb |  |
| CR-05-CATALOGUE-009 | CATALOGUE | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Case structure (describe per entrypoint) | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:1396-1408, 1574-1586, 1598-1612, 1633-1689, 1693-1718, 1720-1731, 1737-1753, 1758-1770` | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:1396-1408, 1574-1586, 1598-1612, 1633-1689, 1693-1718, 1720-1731, 1737-1753, 1758-1770` | gsd-code-reviewer round 0 | fixed |  | ded037b91b |  |
| CR-05-CATALOGUE-010 | CATALOGUE | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Assertions (await every promise); D-16 | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:2103-2117` | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:2103-2117` | gsd-code-reviewer round 0 | fixed |  | 2de0bbda83 |  |
| CR-05-CATALOGUE-011 | CATALOGUE | WARNING | .agents/skills/typescript-style/rules/comments.md; D-16 | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:src/accessories/serviceCatalogue.ts:1027-1030, 1037` | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:src/accessories/serviceCatalogue.ts:1027-1030, 1037` | gsd-code-reviewer round 0 | fixed |  | 976ca43892 |  |
| CR-05-CATALOGUE-012 | CATALOGUE | WARNING | .agents/skills/typescript-style/rules/comments.md (narration of code history) | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:699-700` | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:699-700` | gsd-code-reviewer round 0 | fixed |  | 53c375a3db |  |
| CR-05-CATALOGUE-013 | CATALOGUE | WARNING | .agents/skills/typescript-style/rules/comments.md | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:90-92, 1053` | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:90-92, 1053` | gsd-code-reviewer round 0 | fixed |  | 7faf1c4c92 |  |
| CR-05-CATALOGUE-014 | CATALOGUE | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Test data | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:103-109, 130` | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:103-109, 130` | gsd-code-reviewer round 0 | fixed |  | 2cec494041 |  |
| CR-05-CATALOGUE-015 | CATALOGUE | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Naming values | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:318-753` | `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12:test/accessories/serviceCatalogue.test.ts:318-753` | gsd-code-reviewer round 0 | fixed |  | e131aad3d9 |  |
| CR-05-CATALOGUE-016 | CATALOGUE | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Case structure (titles); Data-driven cases | `700ce9ac61885e50bfa39d9f0e0774f6372da749:test/accessories/serviceCatalogue.test.ts:1606-1632` | `700ce9ac61885e50bfa39d9f0e0774f6372da749:test/accessories/serviceCatalogue.test.ts:1606-1632` | gsd-code-reviewer round 1 | fixed |  | 1629e77f84 |  |
| CR-05-CATALOGUE-017 | CATALOGUE | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Data-driven cases (no conditional in the loop body) | `700ce9ac61885e50bfa39d9f0e0774f6372da749:test/accessories/serviceCatalogue.test.ts:478, 502, 524, 857, 883, 936, 974, 997, 1087, 1812` | `700ce9ac61885e50bfa39d9f0e0774f6372da749:test/accessories/serviceCatalogue.test.ts:478, 502, 524, 857, 883, 936, 974, 997, 1087, 1812` | gsd-code-reviewer round 1 candidate, accepted by coordinator triage | fixed |  | 1a5c9ffcb5 |  |
| CR-05-CATALOGUE-018 | CATALOGUE | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (cases discriminate); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `ec755ee2e4e9df8c608f11829085db637a472258:test/accessories/serviceCatalogue.test.ts:75-99, 220-222, 908-963, 986-1002` | `ec755ee2e4e9df8c608f11829085db637a472258:test/accessories/serviceCatalogue.test.ts:75-99, 220-222, 908-963, 986-1002` | gsd-code-reviewer round 2 | fixed |  | 8a10ce94fe |  |
| CR-05-CATALOGUE-019 | CATALOGUE | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (cases discriminate); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `ec755ee2e4e9df8c608f11829085db637a472258:test/accessories/serviceCatalogue.test.ts:226-238, 1007-1019, 1116-1134, 1261-1271, 1729-1740` | `ec755ee2e4e9df8c608f11829085db637a472258:test/accessories/serviceCatalogue.test.ts:226-238, 1007-1019, 1116-1134, 1261-1271, 1729-1740` | gsd-code-reviewer round 2 | fixed |  | ae2ab2cb2e |  |
| CR-05-CATALOGUE-020 | CATALOGUE | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (cases discriminate); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `309d0da49c4866bef00d793477e4603b5c6146e4:test/accessories/serviceCatalogue.test.ts:229, 611-623, 639-653` | `309d0da49c4866bef00d793477e4603b5c6146e4:test/accessories/serviceCatalogue.test.ts:229, 611-623, 639-653` | gsd-code-reviewer round 3 | fixed |  | e565941a31 |  |
| CR-05-CATALOGUE-021 | CATALOGUE | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (cases discriminate); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings; .agents/skills/typescript-unit-tests/rules/cases.md Assertions (whole values) | `309d0da49c4866bef00d793477e4603b5c6146e4:test/accessories/serviceCatalogue.test.ts:388-515, 1647-1661, 1774-1785` | `309d0da49c4866bef00d793477e4603b5c6146e4:test/accessories/serviceCatalogue.test.ts:388-515, 1647-1661, 1774-1785` | gsd-code-reviewer round 3 | fixed |  | f55d0f09db |  |
| CR-05-CATALOGUE-022 | CATALOGUE | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (cases discriminate); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings; .agents/skills/typescript-unit-tests/rules/pairing-and-design.md Pairing and coverage | `309d0da49c4866bef00d793477e4603b5c6146e4:test/accessories/serviceCatalogue.test.ts:1183-1215, 1219-1267, 1342-1352` | `309d0da49c4866bef00d793477e4603b5c6146e4:test/accessories/serviceCatalogue.test.ts:1183-1215, 1219-1267, 1342-1352` | gsd-code-reviewer round 3 | fixed |  | 252b50ab4b |  |
| CR-05-CATALOGUE-023 | CATALOGUE | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (cases discriminate); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `e790d20da2ce14d82304048c524159b23b7b9293:test/accessories/serviceCatalogue.test.ts:626-648, 675-716, 900-1005` | `e790d20da2ce14d82304048c524159b23b7b9293:test/accessories/serviceCatalogue.test.ts:626-648, 675-716, 900-1005` | gsd-code-reviewer round 4 | fixed |  | b87ee68ab4 |  |
| CR-05-CATALOGUE-024 | CATALOGUE | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Case structure (titles) | `e790d20da2ce14d82304048c524159b23b7b9293:test/accessories/serviceCatalogue.test.ts:776-791` | `e790d20da2ce14d82304048c524159b23b7b9293:test/accessories/serviceCatalogue.test.ts:776-791` | gsd-code-reviewer round 4 | fixed |  | da8ff2c5dd, 46265a6a01 |  |
| CR-05-RECORDS-001 | RECORDS | BLOCKER | .agents/skills/typescript-style/SKILL.md Classifying findings (incorrect behavior); D-05 (narrow trust, no guessed values); the module's own contract at src/accessories/pumpRecords.ts:20-24 and src/persistence/accessoryContext.ts:57-68 ("Whether the last observed activation was self-test activity") | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:175-187, 304-316, 333-337` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:175-187, 304-316, 333-337` | gsd-code-reviewer round 0 | fixed | D-04 genuine bug (coordinator; maintainer chose to fix): the self-test label describes an activation its timestamps do not yet describe | 9701899ef2, e93758edc4, 30a9895195 |  |
| CR-05-RECORDS-002 | RECORDS | BLOCKER | .agents/skills/typescript-style/SKILL.md Classifying findings (incorrect behavior); the module's own D-009 and D-010 contract (src/accessories/pumpRecords.ts:11-18, 264-268) | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:223, 244, 264-300` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:223, 244, 264-300` | gsd-code-reviewer round 0 | fixed | D-04 genuine bug (coordinator; maintainer chose to fix): a restart mid-run counts one run twice; fix persists one optional member | fb0a1d115c, 5e753ca378, 89fd670fb8 |  |
| CR-05-RECORDS-003 | RECORDS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (every case discriminates the behavior in its title); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings (a case a wrong implementation would pass) | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:192-204, 245-256, 269-286` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:192-204, 245-256, 269-286` | gsd-code-reviewer round 0 | fixed |  | 8036ef652b |  |
| CR-05-RECORDS-004 | RECORDS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md; .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:301-375 (against src/accessories/pumpRecords.ts:175-187)` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:301-375 (against src/accessories/pumpRecords.ts:175-187)` | gsd-code-reviewer round 0 | fixed |  | aa640ad55c |  |
| CR-05-RECORDS-005 | RECORDS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md; .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:377-396` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:377-396` | gsd-code-reviewer round 0 | fixed |  | 644ef35f4e |  |
| CR-05-RECORDS-006 | RECORDS | BLOCKER | .agents/skills/typescript-unit-tests/rules/cases.md Assertions (whole values; "A standalone negative assertion ... passes for any value; assert what the value is") | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:492-506, 508-523` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:492-506, 508-523` | gsd-code-reviewer round 0 | fixed |  | 34451dd60d |  |
| CR-05-RECORDS-007 | RECORDS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md; .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/reconciliation.test.ts:227-256 (especially 242-255); also 211-224` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/reconciliation.test.ts:227-256 (especially 242-255); also 211-224` | gsd-code-reviewer round 0 | fixed |  | 3a30620b06 |  |
| CR-05-RECORDS-008 | RECORDS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md; .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:341-353, 391-401, 441-451` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:341-353, 391-401, 441-451` | gsd-code-reviewer round 0 | fixed |  | b47954b814 |  |
| CR-05-RECORDS-009 | RECORDS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md; .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:16-18, 114-116, 265-288` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:16-18, 114-116, 265-288` | gsd-code-reviewer round 0 | fixed |  | 7cb97fa3f0 |  |
| CR-05-RECORDS-010 | RECORDS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md; .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:84-89, 341-353 (against src/accessories/staleMarking.ts:126-134)` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:84-89, 341-353 (against src/accessories/staleMarking.ts:126-134)` | gsd-code-reviewer round 0 | fixed |  | 62eec51a1f |  |
| CR-05-RECORDS-011 | RECORDS | WARNING | D-01; .agents/skills/typescript-style/rules/modules-and-data.md Files and modules ("copyright JSDoc, @fileoverview JSDoc, imports ... each present section separated by exactly one blank line") | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:1-2; 0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:1` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:1-2; 0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:1` | gsd-code-reviewer round 0 | fixed |  | efdf57713b |  |
| CR-05-RECORDS-012 | RECORDS | WARNING | D-01; .agents/skills/typescript-style/rules/modules-and-data.md Files and modules | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/staleMarking.ts:1-2; 0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:1` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/staleMarking.ts:1-2; 0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:1` | gsd-code-reviewer round 0 | fixed |  | f23ca8d645 |  |
| CR-05-RECORDS-013 | RECORDS | WARNING | .agents/skills/typescript-style/rules/comments.md (comments describe what the code does: the interface JSDoc says "Everything the reconciliation state machine needs"); .agents/skills/typescript-unit-tests/rules/pairing-and-design.md Design production code for its tests (dependencies are explicit; an injected port the module does not use makes the test fabricate one) | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/reconciliation.ts:23, 50-54; 0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/reconciliation.test.ts:17, 22, 42-46` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/reconciliation.ts:23, 50-54; 0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/reconciliation.test.ts:17, 22, 42-46` | gsd-code-reviewer round 0 | fixed | confirms lead S-05-07; D-06 bounded consumer edit at accountRuntime.ts:346 | 5ecfdfe671 |  |
| CR-05-RECORDS-014 | RECORDS | WARNING | .agents/skills/typescript-style/rules/comments.md (comments describe what the code does) | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/reconciliation.ts:11-17` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/reconciliation.ts:11-17` | gsd-code-reviewer round 0 | fixed |  | d16eaf50b8 |  |
| CR-05-RECORDS-015 | RECORDS | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Case structure (one describe() per entrypoint; do not group by anything else) | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/reconciliation.test.ts:211-224` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/reconciliation.test.ts:211-224` | gsd-code-reviewer round 0 | fixed | D-10 cites CR-04-ACCOUNT-021 | 70d97fcee2 |  |
| CR-05-RECORDS-016 | RECORDS | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Case structure (titles state public behavior); .agents/skills/typescript-unit-tests/SKILL.md (a case costs maintenance and must add protection) | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/reconciliation.test.ts:103-114 (duplicate of 76-87)` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/reconciliation.test.ts:103-114 (duplicate of 76-87)` | gsd-code-reviewer round 0 | fixed |  | 7e1eb2ba8b |  |
| CR-05-RECORDS-017 | RECORDS | WARNING | .agents/skills/typescript-style/rules/comments.md (comments describe what the code does) | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:35, 56, 158-159` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:35, 56, 158-159` | gsd-code-reviewer round 0 | fixed |  | 805088b084 |  |
| CR-05-RECORDS-018 | RECORDS | WARNING | .agents/skills/typescript-style/rules/comments.md | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:3, 5-8` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:3, 5-8` | gsd-code-reviewer round 0 | fixed |  | 514f78d657 |  |
| CR-05-RECORDS-019 | RECORDS | WARNING | .agents/skills/typescript-style/rules/comments.md | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:209-216 (against :236, 244)` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:209-216 (against :236, 244)` | gsd-code-reviewer round 0 | fixed |  | 039c51d606 |  |
| CR-05-RECORDS-020 | RECORDS | WARNING | .agents/skills/typescript-style/rules/comments.md | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:278-283; 0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:206-208` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/pumpRecords.ts:278-283; 0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:206-208` | gsd-code-reviewer round 0 | fixed |  | 3dda90283f, 3bed8d8058 |  |
| CR-05-RECORDS-021 | RECORDS | WARNING | .agents/skills/typescript-style/rules/comments.md | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:88-91` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:88-91` | gsd-code-reviewer round 0 | fixed |  | aee539bf57 |  |
| CR-05-RECORDS-022 | RECORDS | WARNING | .agents/skills/typescript-style/rules/comments.md Forbidden in comments ("Any other phrasing whose only purpose is to record which planning artifact authored the line"; narration of a former shape) | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:209; 0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:17` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:209; 0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:17` | gsd-code-reviewer round 0 | fixed |  | 6a6311952f |  |
| CR-05-RECORDS-023 | RECORDS | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Case structure ("Use // act & assert only when one assert.rejects() or assert.throws() expression performs both") and Assertions ("Assert errors by class and structured fields, not by message substring") | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:528-535` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:528-535` | gsd-code-reviewer round 0 | fixed |  | 5e50e263d0 |  |
| CR-05-RECORDS-024 | RECORDS | WARNING | .agents/skills/typescript-style/rules/types.md ("T[]/readonly T[] for simple element types, Array<...>/ReadonlyArray<...> otherwise") | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:314, 441` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:314, 441` | gsd-code-reviewer round 0 | fixed |  | a85b94037b |  |
| CR-05-RECORDS-025 | RECORDS | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Case structure ("Each case gets fresh state ... Only a stateless stub ... may live at module scope") and Test data ("never shared mutable constants") | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:441-506` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:441-506` | gsd-code-reviewer round 0 | fixed |  | 8afc2b9a95 |  |
| CR-05-RECORDS-026 | RECORDS | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Test data ("Typed literals, checked with satisfies when they stand in for a production type") | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:308-311, 331, 347, 362, 383` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:308-311, 331, 347, 362, 383` | gsd-code-reviewer round 0 | fixed |  | 69a609c042 |  |
| CR-05-RECORDS-027 | RECORDS | WARNING | .agents/skills/typescript-style/rules/functions.md ("A named function is a function declaration; an arrow assigned to const only for an explicit function type or a nested function needing the outer this") | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:41, 45; 0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:77` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/pumpRecords.test.ts:41, 45; 0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:77` | gsd-code-reviewer round 0 | fixed |  | 8f6cb8d523, 5abd852e7b |  |
| CR-05-RECORDS-028 | RECORDS | WARNING | D-11 (05-REVIEW-PROTOCOL.md Test-double and gate rules: one commented block with asService and asPlatformAccessory helpers; no inline cast at a call site); .agents/skills/typescript-style/rules/types.md ("as ... only with an obvious or commented reason") | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:26-29, 110-120, 431` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:26-29, 110-120, 431` | gsd-code-reviewer round 0 | fixed |  | 9d8d06de67 |  |
| CR-05-RECORDS-029 | RECORDS | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Assertions ("Await every promise and asynchronous assertion"); D-16 | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:122-136 (used at 260, 280-281, 302-303, 400)` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:122-136 (used at 260, 280-281, 302-303, 400)` | gsd-code-reviewer round 0 | fixed |  | 7a7e175e5c |  |
| CR-05-RECORDS-030 | RECORDS | WARNING | .agents/skills/typescript-style/rules/functions.md ("Concise arrow body only when the return value is used; a discarded value gets a block body or void") | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:88, 427` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:test/accessories/staleMarking.test.ts:88, 427` | gsd-code-reviewer round 0 | fixed |  | 7f52a78827 |  |
| CR-05-RECORDS-031 | RECORDS | WARNING | .agents/skills/typescript-style/rules/comments.md | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/staleMarking.ts:36-39, 41-45, 47-50, 150-156` | `0c0930e890cb41e74d0d4e854ba45c41a31fea4a:src/accessories/staleMarking.ts:36-39, 41-45, 47-50, 150-156` | gsd-code-reviewer round 0 | fixed |  | c2875ee391 |  |
| CR-05-RECORDS-032 | RECORDS | BLOCKER | .agents/skills/typescript-style/SKILL.md Classifying findings (incorrect behavior); D-05 (no guessed values, narrow trust); the module's own D-010 and C-001 contract at src/accessories/pumpRecords.ts:23-26 (a watched run and its own timestamp are not counted twice) and :31-34 (the label "stays unwritten ... until the device timestamps describe that activation") | `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:src/accessories/pumpRecords.ts:301-315 (with :336); 8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:test/accessories/pumpRecords.test.ts:253-272` | `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:src/accessories/pumpRecords.ts:301-315 (with :336); 8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:test/accessories/pumpRecords.test.ts:253-272` | gsd-code-reviewer round 1 | rejected | maintainer decision 2026-10-18: keep the trade-off; the module cannot tell an older first timestamp from the waiting run own without comparing device and local time; clearing the mark risks a double count (and, rarely, a self-test label), keeping it risks an uncounted missed run; 034 states it in the comments |  |  |
| CR-05-RECORDS-033 | RECORDS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (every case discriminates the behavior it covers); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings (a case a wrong implementation would pass) | `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:src/accessories/pumpRecords.ts:323-325; 8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:test/accessories/pumpRecords.test.ts:217-234, 486-517, 544-575, 580-607` | `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:src/accessories/pumpRecords.ts:323-325; 8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:test/accessories/pumpRecords.test.ts:217-234, 486-517, 544-575, 580-607` | gsd-code-reviewer round 1 | fixed |  | 5c16b8b8f1 |  |
| CR-05-RECORDS-034 | RECORDS | WARNING | .agents/skills/typescript-style/rules/comments.md (comments describe what the code does) | `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:src/accessories/pumpRecords.ts:31-34, 293-295, 307-310, 331-334; 8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:test/accessories/pumpRecords.test.ts:253-256` | `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:src/accessories/pumpRecords.ts:31-34, 293-295, 307-310, 331-334; 8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:test/accessories/pumpRecords.test.ts:253-256` | gsd-code-reviewer round 1 | fixed | state the 032 trade-off as an assumption with both consequences | fab1c46109, 3fc4be237e |  |
| CR-05-RECORDS-035 | RECORDS | WARNING | .agents/skills/typescript-style/rules/comments.md (comments describe what the code does) | `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:test/accessories/pumpRecords.test.ts:577-579` | `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:test/accessories/pumpRecords.test.ts:577-579` | gsd-code-reviewer round 1 | fixed |  | 629dbd9ce2 |  |
| CR-05-RECORDS-036 | RECORDS | WARNING | .agents/skills/typescript-style/rules/comments.md (comments describe what the code does) | `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:test/accessories/staleMarking.test.ts:26-29, 31-33` | `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:test/accessories/staleMarking.test.ts:26-29, 31-33` | gsd-code-reviewer round 1 | fixed |  | f840798d1b |  |
| CR-05-RECORDS-037 | RECORDS | WARNING | .agents/skills/typescript-style/rules/comments.md (comments describe what the code does); .agents/skills/typescript-style/rules/naming-and-docs.md (every export is documented) | `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:src/persistence/accessoryContext.ts:37-39, 73-74` | `8e7a2463c53546cbd80f135ea2974b4ec8d85ef7:src/persistence/accessoryContext.ts:37-39, 73-74` | gsd-code-reviewer round 1 | fixed | comment lines in the declared adaptation src/persistence/accessoryContext.ts (row 25) | 72ad42b6d3 |  |
| CR-05-RECORDS-038 | RECORDS | BLOCKER | .agents/skills/typescript-style/SKILL.md Classifying findings (incorrect behavior); D-05 (no guessed values, narrow trust); the module's own D-010 contract at src/accessories/pumpRecords.ts:24-26 and :291-295 ("The device publishes a new backup-pump timestamp only after the pump stops"), and its C-001 contract at :28-34 | `07a232ebdcd768bc34ada8957753b90a8f498da4:src/accessories/pumpRecords.ts:376-384 (with :291-297, :319-329, :31-36)` | `07a232ebdcd768bc34ada8957753b90a8f498da4:src/accessories/pumpRecords.ts:376-384 (with :291-297, :319-329, :31-36)` | gsd-code-reviewer round 2 | fixed | D-04 genuine bug (coordinator, within the 001 class the maintainer chose to fix): an edge and a timestamp advance in one observation; reconcile the timestamp before marking the edge | 5105051818, 700bd8cb4a |  |
| CR-05-RECORDS-039 | RECORDS | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (every case discriminates the behavior it covers); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings (a case a wrong implementation would pass) | `07a232ebdcd768bc34ada8957753b90a8f498da4:test/accessories/pumpRecords.test.ts:200-213 (against src/accessories/pumpRecords.ts:164-168)` | `07a232ebdcd768bc34ada8957753b90a8f498da4:test/accessories/pumpRecords.test.ts:200-213 (against src/accessories/pumpRecords.ts:164-168)` | gsd-code-reviewer round 2 | fixed |  | 6fbb9cac9f |  |
| CR-05-RECORDS-040 | RECORDS | WARNING | .agents/skills/typescript-style/rules/comments.md (comments describe what the code does and, when non-obvious, why) | `07a232ebdcd768bc34ada8957753b90a8f498da4:src/accessories/pumpRecords.ts:317-318` | `07a232ebdcd768bc34ada8957753b90a8f498da4:src/accessories/pumpRecords.ts:317-318` | gsd-code-reviewer round 2 | fixed |  | e3b71fe0da |  |
| CR-05-RECORDS-041 | RECORDS | WARNING | .agents/skills/typescript-style/rules/comments.md (comments describe what the code does) | `07a232ebdcd768bc34ada8957753b90a8f498da4:src/accessories/staleMarking.ts:142-143 (against :19-23)` | `07a232ebdcd768bc34ada8957753b90a8f498da4:src/accessories/staleMarking.ts:142-143 (against :19-23)` | gsd-code-reviewer round 2 | fixed |  | a120892474 |  |
| CR-05-ACCESSORY-001 | ACCESSORY | BLOCKER | .agents/skills/typescript-style/SKILL.md Classifying findings (incorrect behavior); locked D-037 ("If no confirmation arrives within 30 seconds, clear the pending state. Restore the last reported Switch value and log a warning."); D-05 (last valid values; requested state never becomes reported state) | `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:637-653, 667-691 (with src/accessories/controls.ts:533-540, 416-420, CONTROLS batch, read-only here)` | `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:637-653, 667-691 (with src/accessories/controls.ts:533-540, 416-420, CONTROLS batch, read-only here)` | gsd-code-reviewer round 0 | fixed | 05-06; D-04 genuine bug; maintainer chose on 2026-10-18 to fix now: the binder keeps the pre-press value and expiry pushes reported ?? that value (bounded edit to controls.ts)  | 41b2ba7, a6cbebfacd |  |
| CR-05-ACCESSORY-002 | ACCESSORY | BLOCKER | .agents/skills/typescript-style/SKILL.md Classifying findings (incorrect behavior); the module's own rule at :799-806 ("a diagnostic naming the wrong cause is worse than none because an owner acts on it"); D-07, D-08 (one condition answers one cause) | `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:698-706, 721-750, 776-793, 991-1016` | `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:698-706, 721-750, 776-793, 991-1016` | gsd-code-reviewer round 0 | fixed | 05-06; D-04 genuine bug (coordinator): bind the controls in the republish path  | b025898, 7bc27047c0 |  |
| CR-05-ACCESSORY-003 | ACCESSORY | BLOCKER | .agents/skills/typescript-style/SKILL.md Classifying findings (incorrect behavior); the module's rule at :803-806 on diagnostics an owner acts on | `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:807-823 (with :1028, 1041-1043)` | `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:807-823 (with :1028, 1041-1043)` | gsd-code-reviewer round 0 | fixed | 05-06; D-04 genuine bug (coordinator): the degradation line states only what holds on both branches  | e8af5d2, 667601c4ba |  |
| CR-05-ACCESSORY-004 | ACCESSORY | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md (every case discriminates); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings (missing assertions) | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:2746-2776, 2848-2896, 2993-3028, 3034-3064 (against src/accessories/basementGuardian.ts:610-617, 641-642, 985, 1012, 1060)` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:2746-2776, 2848-2896, 2993-3028, 3034-3064 (against src/accessories/basementGuardian.ts:610-617, 641-642, 985, 1012, 1060)` | gsd-code-reviewer round 0 | fixed | 05-07 | 9a4a61334f868e5d7d827bc4e375b9e25407941c |  |
| CR-05-ACCESSORY-005 | ACCESSORY | BLOCKER | .agents/skills/typescript-unit-tests/rules/cases.md Assertions ("Do not assert existence, length, or one property at a time when the whole value is the promise"); precedent CR-05-RECORDS-006 | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:957-969, 971-990` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:957-969, 971-990` | gsd-code-reviewer round 0 | fixed | 05-07 | e136bca8c798f7c83280fec93392c45e181c9624 |  |
| CR-05-ACCESSORY-006 | ACCESSORY | BLOCKER | .agents/skills/typescript-unit-tests/rules/cases.md Assertions (whole values); .agents/skills/typescript-unit-tests/rules/review.md Classifying findings | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:846-863 (line 862), 1119-1139 (line 1137)` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:846-863 (line 862), 1119-1139 (line 1137)` | gsd-code-reviewer round 0 | fixed | 05-07 | e5621eb895dde2a3acb372ada3c90d05ff388216 |  |
| CR-05-ACCESSORY-007 | ACCESSORY | BLOCKER | .agents/skills/typescript-unit-tests/SKILL.md; .agents/skills/typescript-unit-tests/rules/review.md Classifying findings; .agents/skills/typescript-style/rules/comments.md (accuracy) | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:245-247, 2427-2440` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:245-247, 2427-2440` | gsd-code-reviewer round 0 | fixed | 05-07 | 1b7c4b8dea5dfc9359403b4f554988bd836a754d |  |
| CR-05-ACCESSORY-008 | ACCESSORY | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Assertions ("Build expected values independently") and Test data ("Do not compute test data with production code"); .agents/skills/typescript-style/rules/comments.md | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:630-640, 2354-2371, 2378-2398, 2404-2425` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:630-640, 2354-2371, 2378-2398, 2404-2425` | gsd-code-reviewer round 0 | fixed | 05-07 | 48d0c9cbf6df0351848350ad78a50882c73b04c2 |  |
| CR-05-ACCESSORY-009 | ACCESSORY | WARNING | D-01; .agents/skills/typescript-style/rules/modules-and-data.md Files and modules (file order) | `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:1-2; 9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:1` | `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:1-2; 9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:1` | gsd-code-reviewer round 0 | fixed | 05-06; header for the pair | 94d3d4fadc20704c06554af4fa088a8cbbc7a63f |  |
| CR-05-ACCESSORY-010 | ACCESSORY | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Case structure ("A single-entrypoint module keeps cases at the top level.") | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:789, 3456` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:789, 3456` | gsd-code-reviewer round 0 | fixed | 05-07; confirms lead S-05-02 | 34b3f3a44c078a75a23f77bffa8934b3c9101a42 |  |
| CR-05-ACCESSORY-011 | ACCESSORY | WARNING | .agents/skills/typescript-style/rules/comments.md (comments describe what the code does); .agents/skills/typescript-style/rules/naming-and-docs.md Comments and documentation | `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:30-34, 83, 85-94, 99-100, 133-136, 141-143, 268-269, 470-474, 591-596, 626-628, 671-673, 694-697, 708-711, 886-888` | `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:30-34, 83, 85-94, 99-100, 133-136, 141-143, 268-269, 470-474, 591-596, 626-628, 671-673, 694-697, 708-711, 886-888` | gsd-code-reviewer round 0 | fixed | 05-06; includes lead S-05-24 part 1  | a6fa3366bc2181528b4d2c5ecde23ffaed5e2ffa |  |
| CR-05-ACCESSORY-012 | ACCESSORY | WARNING | .agents/skills/typescript-style/rules/comments.md Forbidden ("Narration of code that no longer exists") | `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:567-570, 673, 919-925, 955-960` | `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:567-570, 673, 919-925, 955-960` | gsd-code-reviewer round 0 | fixed | 05-06  | 13e05223b12e4a9798f5c29a3e5695d14bd29e41 |  |
| CR-05-ACCESSORY-013 | ACCESSORY | WARNING | .agents/skills/typescript-style/rules/comments.md Forbidden ("Narration of code that no longer exists") | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:279, 2544-2548, 2781-2782, 2807-2808, 2843-2846, 2947-2950, 2988-2991, 3314-3316` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:279, 2544-2548, 2781-2782, 2807-2808, 2843-2846, 2947-2950, 2988-2991, 3314-3316` | gsd-code-reviewer round 0 | fixed | 05-07; confirms lead S-05-06 | 8ff32fdf7a79f4e26228d0e29e1868151aec666b |  |
| CR-05-ACCESSORY-014 | ACCESSORY | WARNING | .agents/skills/typescript-style/rules/comments.md (comments describe what the code does) | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:47-50, 159-161, 262-264, 282-285, 352-353, 410-412, 1768-1770, 1824-1827, 2544-2546` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:47-50, 159-161, 262-264, 282-285, 352-353, 410-412, 1768-1770, 1824-1827, 2544-2546` | gsd-code-reviewer round 0 | fixed | 05-07 | d647e4352f32399322f2c328841160c57975e133 |  |
| CR-05-ACCESSORY-015 | ACCESSORY | WARNING | .agents/skills/typescript-style/rules/comments.md Forbidden ("Any other phrasing whose only purpose is to record which planning artifact authored the line"); precedent CR-05-RECORDS-022 | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:167-169` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:167-169` | gsd-code-reviewer round 0 | fixed | 05-07 | 726cddc90a8bbd6becd4a444b304a05072ae0397 |  |
| CR-05-ACCESSORY-016 | ACCESSORY | WARNING | .agents/skills/typescript-style/rules/types.md ("as and ! only with an obvious or commented reason"); .agents/skills/typescript-unit-tests/rules/cases.md Types and isolation; D-11 | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:480, 646, 676, 746, 813, 1278, 1279 (the widening is at 176-178)` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:480, 646, 676, 746, 813, 1278, 1279 (the widening is at 176-178)` | gsd-code-reviewer round 0 | fixed | 05-07 | 05deb9361c7bf2f9d0bfa8be8388ef702554f56e |  |
| CR-05-ACCESSORY-017 | ACCESSORY | WARNING | .agents/skills/typescript-unit-tests/rules/pairing-and-design.md ("Do not ... test one source module from another module's test"; "Do not test what a gate already enforces"); .agents/skills/typescript-style/rules/comments.md | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:159-170, 315-319, 760-766, 3401-3455` | `27a959e638209f6956e4715328ebcd89ee818aea:test/accessories/basementGuardian.test.ts:179-189, 3615-3665` | gsd-code-reviewer round 0 | fixed | 05-07; confirms lead S-05-17; round 1 still open | 21454503676b290f6593f34d8e2f470fcfb77a07, 396e819d53a9bfeded10a958a7c9bfb9dab8dedf |  |
| CR-05-ACCESSORY-018 | ACCESSORY | WARNING | .agents/skills/typescript-unit-tests/rules/pairing-and-design.md What not to test ("wrong: pins the member list so a new member 'cannot be added silently'"); .agents/skills/typescript-style/rules/comments.md | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:779-787, 2338-2344` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:779-787, 2338-2344` | gsd-code-reviewer round 0 | fixed | 05-07 | 8ccfc9958cdbe1ce0bbd5ba91fe7c9337d2edc56 |  |
| CR-05-ACCESSORY-019 | ACCESSORY | WARNING | .agents/skills/typescript-unit-tests/rules/pairing-and-design.md ("Test modules and test support ... need no meta-tests"; "the case cannot fail and is a maintenance cost"); .agents/skills/typescript-unit-tests/rules/cases.md (titles state public behavior) | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:419-424, 2080-2131` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:419-424, 2080-2131` | gsd-code-reviewer round 0 | fixed | 05-07 | 3c7740d211481c005e3cc2a2f5542ec5e847a4c3 |  |
| CR-05-ACCESSORY-020 | ACCESSORY | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Case structure; precedent CR-05-CONTROLS-017 | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:2520-2528, 2560-2568, 2601-2609, 2661-2669, 2726-2735, 2754-2765, 2790-2799, 2817-2826, 2871-2882, 2916-2925, 3075-3083; 2828-2829, 2927-2928` | `27a959e638209f6956e4715328ebcd89ee818aea:test/accessories/basementGuardian.test.ts:2590-2604, 2629-2643, 2827-2843, 2943-2969` | gsd-code-reviewer round 0 | fixed | 05-07; round 1 still open | e6efc39de8e5fc7b6e8e086d7f809a29afa71e88, 04a01fd5f47e159088e7029c6892e40db9d4b685 |  |
| CR-05-ACCESSORY-021 | ACCESSORY | WARNING | .agents/skills/typescript-style/rules/functions.md ("Concise arrow body only when the return value is used; a discarded value gets a block body or void"); precedent CR-05-CONTROLS-028 | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:195-196, 200, 202, 208-209, 216-217, 220, 322-329, 337-343, 806, 816, 824, 832, 1398` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:195-196, 200, 202, 208-209, 216-217, 220, 322-329, 337-343, 806, 816, 824, 832, 1398` | gsd-code-reviewer round 0 | fixed | 05-07 | cb7a70c73e98e68625b361820995d1c66f4e090a |  |
| CR-05-ACCESSORY-022 | ACCESSORY | WARNING | .agents/skills/typescript-style/rules/modules-and-data.md ("Arrays built with []"); .agents/skills/typescript-style/rules/review.md quick scan (Array() | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:1388, 1461` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:1388, 1461` | gsd-code-reviewer round 0 | fixed | 05-07 | 816a9d8f4eeca1d1c3bd87fba218f991ada092d0 |  |
| CR-05-ACCESSORY-023 | ACCESSORY | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Data-driven cases ("Do not put a conditional in the loop body"; typed rows carrying the outcome) | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:1047-1066` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:1047-1066` | gsd-code-reviewer round 0 | fixed | 05-07 | f71454c325d15b6a6043a39fb126f2a01eb3d7ab |  |
| CR-05-ACCESSORY-024 | ACCESSORY | WARNING | .agents/skills/typescript-unit-tests/rules/test-doubles.md Mocks ("strong-mock, only when the interaction is public behavior: ... issuing a command"); precedent CR-05-CONTROLS-023 | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:378-391, 393-408, 2591-2598 (asserted at, among others, 2533, 2572, 2586, 2614, 2672, 2686, 2714, 2738, 2768-2775, 2278-2281, 2302-2308, 2332-2335)` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:378-391, 393-408, 2591-2598 (asserted at, among others, 2533, 2572, 2586, 2614, 2672, 2686, 2714, 2738, 2768-2775, 2278-2281, 2302-2308, 2332-2335)` | gsd-code-reviewer round 0 | fixed | 05-07 | cb407f9a8a99a6317343b11f37b97e7357782129 |  |
| CR-05-ACCESSORY-025 | ACCESSORY | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Assertions ("Await every promise"); D-16; precedents CR-05-CONTROLS-018 and CR-05-RECORDS-029 | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:692-702 (used at 707-713)` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:692-702 (used at 707-713)` | gsd-code-reviewer round 0 | fixed | 05-07 | 72fc921d5c3eaca96590341e89aadcccf7426ddb |  |
| CR-05-ACCESSORY-026 | ACCESSORY | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Case structure ("A durable requirement ID may appear; plan, phase, or ticket references may not"); .agents/skills/typescript-style/rules/comments.md ("Test titles state behavior and carry no ticket references") | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:2442, 2460, 2472, 2554, 2575, 2589, 2617, 2848, 2909, 2956, 2993, 3034, 3254, 3276, 3295, 3317` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:2442, 2460, 2472, 2554, 2575, 2589, 2617, 2848, 2909, 2956, 2993, 3034, 3254, 3276, 3295, 3317` | gsd-code-reviewer round 0 | fixed | 05-07 | 55d22866f54247e095767caf50a86d37b0ccda48 |  |
| CR-05-ACCESSORY-027 | ACCESSORY | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Naming values ("Test double: the production role only ... Do not add mock, fake, or stub to the name"; "Name values after their production role"); .agents/skills/typescript-unit-tests/rules/review.md ("a double named after its kind") | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:2510, 2858, 2963, 3000, 3041; 155-157, 3340` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:2510, 2858, 2963, 3000, 3041; 155-157, 3340` | gsd-code-reviewer round 0 | fixed | 05-07 | 00e65cf8dc8f673f98eba73c59950d7e21fe40ee |  |
| CR-05-ACCESSORY-028 | ACCESSORY | WARNING | .agents/skills/typescript-style/rules/modules-and-data.md ("Every export is used outside its module") | `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:67-77` | `9cb164b1299249c2d2083ea81677c83e28e66916:src/accessories/basementGuardian.ts:67-77` | gsd-code-reviewer round 0 | fixed | 05-06; D-06  | 2a5545f5986676c3d7c64cb8a7f89661953f33da |  |
| CR-05-ACCESSORY-029 | ACCESSORY | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Assertions ("Assert errors by class and structured fields") | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:801-817, 1141-1152` | `9cb164b1299249c2d2083ea81677c83e28e66916:test/accessories/basementGuardian.test.ts:801-817, 1141-1152` | gsd-code-reviewer round 0 | fixed | 05-07 | 4b3e2f72b41a6307162ce9b0a327e1bdba9ac3a6 |  |
| CR-05-ACCESSORY-030 | ACCESSORY | BLOCKER | .agents/skills/typescript-style/SKILL.md Classifying findings (incorrect behavior); D-05; src/device/health.ts UntrustedScope.lastTrustedAt contract | `27a959e638209f6956e4715328ebcd89ee818aea:src/accessories/basementGuardian.ts:897-907, 1015-1032` | `27a959e638209f6956e4715328ebcd89ee818aea:src/accessories/basementGuardian.ts:897-907, 1015-1032` | gsd-code-reviewer round 1 | fixed | 05-07; round 1 D-04 genuine bug: live update must not advance connectivity lastTrustedAt | fee3e72921cf7a5209a6a26df18671a11dd9a838 |  |
| CR-05-ACCESSORY-031 | ACCESSORY | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Assertions (error class and complete diagnostic) | `27a959e638209f6956e4715328ebcd89ee818aea:test/accessories/basementGuardian.test.ts:863-881, 1507-1517` | `27a959e638209f6956e4715328ebcd89ee818aea:test/accessories/basementGuardian.test.ts:863-881, 1507-1517` | gsd-code-reviewer round 1 | fixed | 05-07; round 1 | 8d0f11330c7cee150b8a18fee369bab91358d8cb |  |
| CR-05-ACCESSORY-032 | ACCESSORY | WARNING | .agents/skills/typescript-unit-tests/rules/cases.md Data-driven cases (one sibling test per row) | `27a959e638209f6956e4715328ebcd89ee818aea:test/accessories/basementGuardian.test.ts:3183-3279` | `27a959e638209f6956e4715328ebcd89ee818aea:test/accessories/basementGuardian.test.ts:3183-3279` | gsd-code-reviewer round 1 | fixed | 05-07; round 1 | 8cbefd70b5a2ff3b2b782e5d2fd3174fd5079437 |  |
| CR-05-ACCESSORY-033 | ACCESSORY | BLOCKER | .agents/skills/typescript-style/SKILL.md Classifying findings (incorrect behavior); D-05; src/device/health.ts UntrustedScope.lastTrustedAt contract | `7a169429373d331a96698fc5e8bcefaf5aae4c31:src/accessories/basementGuardian.ts:981-1005,1020-1031` | `7a169429373d331a96698fc5e8bcefaf5aae4c31:src/accessories/basementGuardian.ts:981-1005,1020-1031` | gsd-code-reviewer round 2 | fixed | 05-07; round 2 D-04 genuine bug: unresolved-family poll must advance connectivity lastTrustedAt | 4f09addb40a27ef89c4b20e9b48b5376c12395b9 |  |
| CR-05-ACCESSORY-034 | ACCESSORY | BLOCKER | .agents/skills/typescript-style/SKILL.md Classifying findings (incorrect behavior); D-05; src/device/health.ts UntrustedScope.lastTrustedAt contract | `530da8016ae53d470b226fde15b29e40be9836dc:src/accessories/basementGuardian.ts:897-906,1003-1006,1020-1026,971-978` | `530da8016ae53d470b226fde15b29e40be9836dc:src/accessories/basementGuardian.ts:897-906,1003-1006,1020-1026,971-978` | gsd-code-reviewer round 3 | fixed | 05-07; D-03 STOP: round 3 closing 1 did not lower opening 1; maintainer authorized continuation for 034 | 8cbfe7a755ba0e61b1860d6a848b9e4e4e57feb7 |  |
| CR-05-GATES-001 | GATES | WARNING | D-01 in `05-CONTEXT.md`; `.agents/skills/typescript-style/rules/modules-and-data.md`, Files and modules. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/timerFreedom.test.ts:1`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapImportScope.test.ts:1`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/accessoryReadPathScope.test.ts:1`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:1`. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/timerFreedom.test.ts:1`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapImportScope.test.ts:1`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/accessoryReadPathScope.test.ts:1`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:1`. | gsd-code-reviewer round 0 | open |  |  |  |
| CR-05-GATES-002 | GATES | WARNING | `.agents/skills/typescript-unit-tests/rules/cases.md`, Case structure (`// act & assert` is only for one `assert.rejects()` or `assert.throws()`). | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/timerFreedom.test.ts:113-135`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapImportScope.test.ts:170-210`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/accessoryReadPathScope.test.ts:206-235`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:260-267`. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/timerFreedom.test.ts:113-135`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapImportScope.test.ts:170-210`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/accessoryReadPathScope.test.ts:206-235`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:260-267`. | gsd-code-reviewer round 0 | open |  |  |  |
| CR-05-GATES-003 | GATES | BLOCKER | `.agents/skills/typescript-unit-tests/SKILL.md`, every case discriminates its claim; `.agents/skills/typescript-unit-tests/rules/review.md`, weak assertion; D-14. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapImportScope.test.ts:57-63,154-168`. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapImportScope.test.ts:57-63,154-168`. | gsd-code-reviewer round 0 | open |  |  |  |
| CR-05-GATES-004 | GATES | BLOCKER | `.agents/skills/typescript-unit-tests/SKILL.md`, every case discriminates its claim; `.agents/skills/typescript-unit-tests/rules/review.md`, weak assertion; D-14. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/accessoryReadPathScope.test.ts:69-76,190-204`. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/accessoryReadPathScope.test.ts:69-76,190-204`. | gsd-code-reviewer round 0 | open |  |  |  |
| CR-05-GATES-005 | GATES | WARNING | `.agents/skills/typescript-style/rules/comments.md`, Comments describe current code accurately. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/timerFreedom.test.ts:13-17`. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/timerFreedom.test.ts:13-17`. | gsd-code-reviewer round 0 | open |  |  |  |
| CR-05-GATES-006 | GATES | BLOCKER | `.agents/skills/typescript-unit-tests/rules/cases.md`, Assertions (compare whole values; standalone negative assertions are weak); `.agents/skills/typescript-unit-tests/rules/review.md`, Classifying findings. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:375-396`. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:375-396`. | gsd-code-reviewer round 0 | open |  |  |  |
| CR-05-GATES-007 | GATES | WARNING | `.agents/skills/typescript-style/rules/naming-and-docs.md`, Naming (no `_` suffix). | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:51,243-246,258`. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:51,243-246,258`. | gsd-code-reviewer round 0 | open |  |  |  |
| CR-05-GATES-008 | GATES | WARNING | `.agents/skills/typescript-style/rules/functions.md`, Errors (catches read `catch (error: unknown)`); `.agents/skills/typescript-style/SKILL.md`, Classifying findings. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:103-116`. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:103-116`. | gsd-code-reviewer round 0 | open |  |  |  |
| CR-05-GATES-009 | GATES | BLOCKER | `.agents/skills/typescript-style/rules/types.md`, Types (`as` only with an obvious or commented reason, prefer a runtime check); `.agents/skills/typescript-style/SKILL.md`, Classifying findings. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:85-95`. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:85-95`. | gsd-code-reviewer round 0 | open |  |  |  |
| CR-05-GATES-010 | GATES | BLOCKER | `.agents/skills/typescript-unit-tests/rules/cases.md`, Case structure (do not commit skipped cases); `.agents/skills/typescript-unit-tests/rules/review.md`, Classifying findings (a suite that silently omits a case lies). | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:252-268`. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:252-268`. | gsd-code-reviewer round 0 | open |  |  |  |
| CR-05-GATES-011 | GATES | WARNING | `.agents/skills/typescript-unit-tests/rules/pairing-and-design.md`, test support needs no meta-tests; D-13 and D-16. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:477-494`. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:477-494`. | gsd-code-reviewer round 0 | open |  |  |  |
| CR-05-GATES-012 | GATES | BLOCKER | `.agents/skills/typescript-unit-tests/SKILL.md`, every promised behavior gets a discriminating case; D-16. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:270-281` (handler installed in the only accepted-write case); `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:features/lib/hap.ts:316-322` (read-only reference). | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:270-281` (handler installed in the only accepted-write case); `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:features/lib/hap.ts:316-322` (read-only reference). | gsd-code-reviewer round 0 | open |  |  |  |
| CR-05-GATES-013 | GATES | BLOCKER | `.agents/skills/typescript-unit-tests/SKILL.md`, discriminating boundary cases; D-16. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:60-83,270-396` (each script installs at most one handler); `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:features/lib/hap.ts:303-307` (read-only reference). | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:60-83,270-396` (each script installs at most one handler); `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:features/lib/hap.ts:303-307` (read-only reference). | gsd-code-reviewer round 0 | open |  |  |  |
| CR-05-GATES-014 | GATES | BLOCKER | `.agents/skills/typescript-unit-tests/SKILL.md`, discriminating boundary cases; D-16. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:321-350,354-396` (observations only after write settlement); `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:features/lib/hap.ts:316-335` (read-only reference). | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:321-350,354-396` (observations only after write settlement); `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:features/lib/hap.ts:316-335` (read-only reference). | gsd-code-reviewer round 0 | open |  |  |  |
| CR-05-GATES-015 | GATES | WARNING | D-15 in `05-CONTEXT.md` (extract only after confirmed duplication); `.agents/skills/typescript-unit-tests/rules/pairing-and-design.md`, Test support organization. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapImportScope.test.ts:89-101`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/accessoryReadPathScope.test.ts:118-130`. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapImportScope.test.ts:89-101`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/accessoryReadPathScope.test.ts:118-130`. | gsd-code-reviewer round 0 | open |  |  |  |
| CR-05-GATES-016 | GATES | WARNING | `.agents/skills/typescript-unit-tests/SKILL.md`, discriminating controls; `.agents/skills/typescript-style/rules/comments.md`, comments must describe actual behavior. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapImportScope.test.ts:103-110,213-233`. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapImportScope.test.ts:103-110,213-233`. | gsd-code-reviewer round 0 | open |  |  |  |
| CR-05-GATES-017 | GATES | BLOCKER | `.agents/skills/typescript-unit-tests/SKILL.md`, every case must discriminate the behavior it names; `.agents/skills/typescript-unit-tests/rules/cases.md`, Assertions (await every promise); D-16. | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:63-67,149-150,183-184,321-334`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:features/lib/hap.ts:210-211,341-348` (read-only reference). | `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:test/accessories/hapWriteFidelity.test.ts:63-67,149-150,183-184,321-334`; `379e86772fb2f353abbbe9c35dc3aa502bbb68f9:features/lib/hap.ts:210-211,341-348` (read-only reference). | gsd-code-reviewer round 0 | open |  |  |  |

## Candidate leads

| Lead | Owning batch | Location at base | Observation | Likely rule | Disposition |
| --- | --- | --- | --- | --- | --- |
| S-05-01 | DECLARATIONS, CATALOGUE, CONTROLS, GATES | ten files under test/accessories | 36 `// act & assert` markers are not followed by `assert.rejects` or `assert.throws`. Per file: serviceCatalogue 19, accessoryReadPathScope 3, hapImportScope 3, services 3, timerFreedom 2, controls 2, alarmMute 1, customCharacteristics 1, customServices 1, hapWriteFidelity 1. Phases 2 to 4 fixed this as a WARNING each time (CR-02-SHADOW-006, CR-02-AUTH-012, CR-04-PORTS-004, CR-04-POLICIES-006, CR-04-TRUST-013, CR-04-ACCOUNT-041). | unit, Case structure | DECLARATIONS part confirmed as CR-05-DECLARATIONS-010 to 013; CATALOGUE part confirmed as CR-05-CATALOGUE-002; CONTROLS part confirmed as CR-05-CONTROLS-005; GATES portion confirmed as CR-05-GATES-002; other batches already disposed |
| S-05-02 | DECLARATIONS, ACCESSORY | test/accessories/customCharacteristics.test.ts:94; test/accessories/customServices.test.ts:113; test/accessories/basementGuardian.test.ts:789 | A single runtime entrypoint is wrapped in one `describe`. The rule says a single-entrypoint module keeps its cases at the top level. | unit, Case structure | DECLARATIONS part confirmed as CR-05-DECLARATIONS-014 and 015; ACCESSORY part confirmed as CR-05-ACCESSORY-010 |
| S-05-03 | RECORDS | test/accessories/reconciliation.test.ts:52, 144, 227 | The `describe` blocks name methods of the returned object, not exported entrypoints. | unit, Case structure (reviewer judgment) | rejected: the unit-test book reference case groups the operations of a factory returned object under one describe each, as reconciliation.test.ts does; the one misplaced case is CR-05-RECORDS-015 |
| S-05-04 | CONTROLS | test/accessories/controls.test.ts:547-557 | `'answers each of the eight refusal causes ...'` loops all rows inside one `test()` and has no `// arrange`. | unit, Data-driven cases | confirmed as CR-05-CONTROLS-019 |
| S-05-05 | CONTROLS | src/accessories/controls.ts:145-147 | The JSDoc says HAP "keeps only the last handler registered while warning about the ones before it". Pinned HAP 2.2.2 `onSet` assigns one slot and gives no replacement warning; it warns only for a non-function and for ignored `on('set')` listeners (Characteristic.js:1346-1352, 1801-1803). | comments, accuracy | confirmed as CR-05-CONTROLS-020 |
| S-05-06 | CONTROLS, ACCESSORY | src/accessories/controls.ts:97-103, 323-324; test/accessories/controls.test.ts:690, 693, 713; test/accessories/basementGuardian.test.ts:2947 | Narration of code history: "two refusals now answer it", "the new rule", "reconciliation used to read the value". | comments, Narration of code that no longer exists | CONTROLS part confirmed as CR-05-CONTROLS-021 (source) and CR-05-CONTROLS-022 (test); ACCESSORY part confirmed as CR-05-ACCESSORY-013 (test), with the source narration as CR-05-ACCESSORY-012 |
| S-05-07 | RECORDS | src/accessories/reconciliation.ts:51-54 | `ReconciliationOptions.clock: Clock` is required, but nothing in the module reads `options.clock`. Its only production consumer passes it at src/runtime/accountRuntime.ts:346. Removing it is a D-06 contract change with a bounded consumer edit in a Phase 4 file. | style, unused dependency; unit, Design for tests | confirmed as CR-05-RECORDS-013 |
| S-05-08 | DECLARATIONS | src/accessories/customCharacteristics.ts:148 | The comment says "so twelve near-identical class bodies never exist"; the factory defines 16 characteristics. | comments, accuracy | confirmed as CR-05-DECLARATIONS-016 |
| S-05-09 | GATES | test/accessories/hapImportScope.test.ts:60-63; test/accessories/accessoryReadPathScope.test.ts:72-76 | Floor comments state exact counts that research found stale at 1bcaddd: "a hundred and four TypeScript files" when the tree had 132 (`find src test features -name '*.ts' \| wc -l`), and "the production tree forty" when `src` had 43. D-14 keeps the `>=` floors; a stale stated count is a candidate for "wrong for the current tree". | D-14; comments, accuracy | confirmed as CR-05-GATES-003 and 004 (current counts 43 + 68 + 22 = 133) |
| S-05-10 | GATES | test/accessories/timerFreedom.test.ts:13 | "Three modules in this repository already import that form" is true for `src/` (accountRuntime, retryPolicy, mqttTransport); repository-wide, 13 files import it, not counting the gate's own fixture. | comments, accuracy | confirmed as CR-05-GATES-005 |
| S-05-11 | GATES | test/accessories/hapWriteFidelity.test.ts:394-395 | `assert.notStrictEqual(real.statusCode, 0)` is a standalone negative that the next `strictEqual` makes redundant, and the case does not compare the whole record while every sibling does. | unit, Assertions | confirmed as CR-05-GATES-006 |
| S-05-12 | GATES | test/accessories/hapWriteFidelity.test.ts:51, 112, 94 | `require_` uses a trailing-underscore name; `catch {` has no `(error: unknown)`; `manifest as InstalledManifest` has no stated reason. | style, Naming, Errors and Types | confirmed as CR-05-GATES-007 to 009 |
| S-05-13 | GATES | test/accessories/hapWriteFidelity.test.ts:258-268 | A conditionally registered test. Under Homebridge 1.x it does not exist, which works like a skip. | unit, no conditional registration and no skip (reviewer judgment) | confirmed as CR-05-GATES-010 |
| S-05-14 | GATES | test/accessories/hapWriteFidelity.test.ts:481-494 | `'leaves the stand-in published flag ...'` exercises the stand-in only. | unit, test support needs no meta-tests; D-13 and D-16 | confirmed as CR-05-GATES-011 |
| S-05-15 | GATES | test/accessories/hapWriteFidelity.test.ts; features/lib/hap.ts:309-334 | D-16 parity gaps not diffed today: (1) a write with no handler stores the value and reports success, which staleMarking.ts:29-34 and controls.ts:36-41 rely on; (2) a second `onSet` replaces the first, which the `bindRestoredControlRefusal` handoff relies on (controls.ts:42-45, 424-428); (3) real HAP resets `statusCode` to 0 at entry to `handleSetRequest`, while the stand-in clears it only on success, so a read during an in-flight write can differ (Characteristic.js:1786-1787, 1838-1841). | D-16, confirmed gaps only | all three gaps confirmed separately as CR-05-GATES-012, 013, 014 |
| S-05-16 | DECLARATIONS | test/accessories/alarmMute.test.ts:19-29, 52-64 | A source-text gate inside a paired test with no enumeration floor and no planted positive; an empty read would pass. | unit, would a wrong implementation pass? (BLOCKER class) | confirmed as CR-05-DECLARATIONS-005 |
| S-05-17 | CATALOGUE, ACCESSORY | test/accessories/basementGuardian.test.ts:3400-3455; test/accessories/serviceCatalogue.test.ts:1485-1491 | Source-text cases inside paired tests. The `onGet` and get-event checks repeat accessoryReadPathScope.test.ts with a weaker pattern. | unit, Do not test what a gate already enforces | CATALOGUE part rejected: serviceCatalogue.test.ts:1485-1491 checks the waterLevel.js import, not a read handler, and no gate covers that import (its weakness is CR-05-CATALOGUE-004); ACCESSORY part confirmed as CR-05-ACCESSORY-017 |
| S-05-18 | CONTROLS | test/accessories/controls.test.ts:104-118 and similar recorders | A hand-built `CommandPort` recorder asserts sends; the rules give command issuing to `strong-mock`. | unit, Test doubles (reviewer judgment; large refactor) | confirmed as CR-05-CONTROLS-023 |
| S-05-19 | CONTROLS | test/accessories/controls.test.ts:30, reused at 433-488 | The module-level `ACCEPTED: CommandOutcome` object is shared across rows. | unit, Test data (seeds return fresh values) | confirmed as CR-05-CONTROLS-024 |
| S-05-20 | ACCESSORY | src/accessories/basementGuardian.ts:177-180 | `DEFAULT_OFFLINE_CONFIRMATION_POLL_COUNT = 2` repeats the default in src/config.ts, as its comment says. | design (reviewer judgment; src/config.ts belongs to Phase 6) | rejected: no book rule forbids the repeated default, its comment is true, and the only production caller always passes the value; making the option required is a D-06 change for Phases 6 and 7 |
| S-05-21 | DECLARATIONS | src/accessories/customCharacteristics.ts:111-114 | `type CharacteristicDomain = Pick<...>`; the style rules prefer interface extension over `Pick`. | style, Types | rejected: `CharacteristicDomain` picks from homebridge's external `CharacteristicProps`; interface extension needs a project-owned base, and an empty `extends Pick` interface or hand-copied members would be worse (types.md, simplest construct) |
| S-05-22 | GATES | features/lib/hap.ts:300; src/accessories/customCharacteristics.ts:156 | The stand-in base `Characteristic` assigns the default value, while real HAP 2.2.2 leaves the base `value` null (Characteristic.js:1274, 1294-1303) and each definition assigns its own; no fidelity case diffs construction defaults. Found by the DECLARATIONS round-0 review (CR-05-DECLARATIONS-004). | D-16, confirmed gaps only | rejected under D-16: plugin custom characteristics assign defaults; no bare-base consumer |
| S-05-23 | GATES | features/lib/hap.ts:341-348 (read); stand-in getCharacteristic | Two stand-in read-path disagreements with real HAP 2.2.2 that no fidelity case diffs: the stand-in `handleGetRequest` throws synchronously, while real HAP is `async` and rejects (Characteristic.js:1683, 1729-1730); the stand-in `getCharacteristic` does not create a declared-but-absent characteristic, while real HAP does (Service.js:472-499). Found by the CATALOGUE round-0 review (CR-05-CATALOGUE-010, 011). | D-16, confirmed gaps only | read refusal confirmed as CR-05-GATES-017; absent-characteristic lookup rejected under D-16 because plugin guards or declares it |
| S-05-24 | ACCESSORY | src/accessories/basementGuardian.ts:694-697 and the `republish` callback | Found by the CONTROLS correction round 6 review. (1) The comment claims the binder is reached through the published-service lookup, while `publishRows` binds the service `ensureService` answers, which it adds on a new accessory. (2) Unprobed: a request accepted just before a terminal authentication halt could reach its window expiry while HAP still serves the requested `true`, because `republish` does nothing while credentials are rejected; D-037 says expiry restores the last reported value. The CONTROLS round 9 review adds that a window closing while the control scope is withdrawn for a doubtful reason, or while its field no longer decodes, also leaves HAP serving the requested `true`. | comments, accuracy; D-037 behavior (reviewer judgment) | confirmed: part 1 inside CR-05-ACCESSORY-011, part 2 as CR-05-ACCESSORY-001 |
| S-05-25 | ACCESSORY | src/accessories/basementGuardian.ts:991-1012 | Found by the CONTROLS correction round 7 review. For a cached accessory whose family does not resolve, `update()` only republishes and never binds the control rows, so the restored refusal stays after a successful inventory and logs "the plugin has no way to reach the vendor right now" while the transport is ready. Refusing is correct; whether the named cause is wrong output (a D-04 candidate) is for the ACCESSORY batch. The CONTROLS round 8 review found the same refusal and line for a cached accessory whose device is missing from the inventory or has no stored snapshot (src/platform.ts:296-302, 380-391). | D-04 candidate (coordinator judgment); D-05 preserved line | confirmed as CR-05-ACCESSORY-002 for the unresolved family; the missing-device and no-snapshot variants live in src/platform.ts (Phase 6) and are out of scope |


A lead is not a finding. It is a research observation that a reviewer confirms as a finding or
rejects with rule and source evidence.

## Rule applicability (D-14, D-17)

| Gate | Rule | Applicability | Reason |
| --- | --- | --- | --- |
| test/accessories/timerFreedom.test.ts | Mirrored source pairing | N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/timerFreedom.test.ts | One `describe()` per exported entrypoint | N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/timerFreedom.test.ts | Isolated direct coverage | N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/hapImportScope.test.ts | Mirrored source pairing | N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/hapImportScope.test.ts | One `describe()` per exported entrypoint | N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/hapImportScope.test.ts | Isolated direct coverage | N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/accessoryReadPathScope.test.ts | Mirrored source pairing | N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/accessoryReadPathScope.test.ts | One `describe()` per exported entrypoint | N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/accessoryReadPathScope.test.ts | Isolated direct coverage | N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/hapWriteFidelity.test.ts | Mirrored source pairing | N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/hapWriteFidelity.test.ts | One `describe()` per exported entrypoint | N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/hapWriteFidelity.test.ts | Isolated direct coverage | N/A | the gate has no source module; scripts/test-coverage-direct.mjs lists it in repositoryTests |
| test/accessories/timerFreedom.test.ts | Whole-value assertion for `ACCESSORIES_MODULE_FLOOR` | N/A | D-14 keeps the documented >= floor; the gate asserts a lower bound by design |
| test/accessories/hapImportScope.test.ts | Whole-value assertion for `SOURCE_FILE_FLOOR` | N/A | D-14 keeps the documented >= floor; the gate asserts a lower bound by design |
| test/accessories/accessoryReadPathScope.test.ts | Whole-value assertion for `ACCESSORIES_MODULE_FLOOR` | N/A | D-14 keeps the documented >= floor; the gate asserts a lower bound by design |
| test/accessories/accessoryReadPathScope.test.ts | Whole-value assertion for `SOURCE_MODULE_FLOOR` | N/A | D-14 keeps the documented >= floor; the gate asserts a lower bound by design |

The GATES round-0 reviewer confirmed all 16 N/A rows with the stated reasons.

## Genuine bug histories

| Finding | Owner test | RED evidence | Evidence commit | Fix commit | Classifier | Ancestry |
| --- | --- | --- | --- | --- | --- | --- |
| CR-05-CONTROLS-008 | test/accessories/controls.test.ts `refuses a second on request while the first waits for the device, and sends one command` | `05-CONTROLS-RED-EVIDENCE.json` as committed in 9b5cd20 (exit 1, tests 1, fail 1, ERR_ASSERTION at the target deepStrictEqual) | 9b5cd207106e2f1370ab7d563986efccc6d8c9f0 | a2ae20acc02b310ad0c2037ce3489c0f7e338836 | `check tdd-red-evidence` RED_EVIDENCE_OK (target_test_failed) | the evidence commit is the parent of the fix commit; `src/accessories/controls.ts` stays 7a9239714077956f50b9e5fa4eb0a971d03fd1d7 through the evidence commit, which changes only the evidence file |
| CR-05-CONTROLS-009 | test/accessories/controls.test.ts `keeps the request pending when the vendor does not answer in time` | `05-CONTROLS-RED-EVIDENCE.json` as committed in 1f85938 (exit 1, tests 1, fail 1, ERR_ASSERTION at the target deepStrictEqual; `priorEvidence` holds the 008 record in full) | 1f8593865ec49ffeff13ebe33e75bbd1b2932c72 | 670ae8955b6b5cdd38e0a9d9ebeeac936481c972 | `check tdd-red-evidence` RED_EVIDENCE_OK (target_test_failed) | the evidence commit is the parent of the fix commit; `src/accessories/controls.ts` stays e1fddbb00645b26d1e58a55ae2f91ba8869b8241 through the evidence commit, which changes only the evidence file |
| CR-05-CONTROLS-033 | test/accessories/controls.test.ts `warns that a timed-out request may still have reached the device` | `05-CONTROLS-RED-EVIDENCE.json` as committed in 11c32d2 (exit 1, tests 1, suites 1, fail 1, ERR_ASSERTION at the target deepStrictEqual; `priorEvidence` holds the 009 record, which holds the 008 record) | 11c32d23dfbd2f2c06e660200678e6ef0b5b2a71 | 7790818ee032874025f4629998e40d59fb3260dd | `check tdd-red-evidence` RED_EVIDENCE_OK (target_test_failed) | the evidence commit is the parent of the fix commit; `src/accessories/controls.ts` stays 2b0a51f03e7ccbe913ec30306ed8ee558ea419c4 through the evidence commit, which changes only the evidence file |
| CR-05-RECORDS-001 | test/accessories/pumpRecords.test.ts `withholds the self-test label from a watched backup run whose device timestamp has not arrived` | `05-PUMP-RECORDS-RED-EVIDENCE.json` as committed in 9701899 (exit 1, tests 1, fail 1, ERR_ASSERTION at the target deepStrictEqual) | 9701899ef2001050a8105698981e884d0d2d20a4 | e93758edc4e8d61cc24aea4f979d2540e50bb490 | `check tdd-red-evidence` RED_EVIDENCE_OK (target_test_failed) | the evidence commit is the parent of the fix commit; `src/accessories/pumpRecords.ts` stays 74771aee1e664afd2475d9870ced3d025f447294 through the evidence commit, which changes only the evidence file |
| CR-05-RECORDS-002 | test/accessories/pumpRecords.test.ts `counts a watched backup run once across a restart before its device timestamp arrives` | `05-PUMP-RECORDS-RED-EVIDENCE.json` as committed in fb0a1d1 (exit 1, tests 1, fail 1, ERR_ASSERTION at the target deepStrictEqual; `priorEvidence` holds the 001 record) | fb0a1d115c0eb0ace8009157c12129a8776fff82 | 5e753ca378e09eff936ac5b6e2f05138f3960949 | `check tdd-red-evidence` RED_EVIDENCE_OK (target_test_failed) | the evidence commit is the parent of the fix commit; `src/accessories/pumpRecords.ts` stays fb9026b29d1c7fe5f341339734067da7531969fb through the evidence commit, which changes only the evidence file |
| CR-05-RECORDS-038 | test/accessories/pumpRecords.test.ts `reads a timestamp advance that arrives with a backup edge as an earlier run` | `05-PUMP-RECORDS-RED-EVIDENCE.json` as committed in 5105051 (exit 1, tests 1, fail 1, ERR_ASSERTION at the target deepStrictEqual; `priorEvidence` holds the 002 record, which holds the 001 record) | 510505181800c6d3dda4144bccdc7b7fa17a0a39 | 700bd8cb4a5a213f513114afed990ad83b85d28e | `check tdd-red-evidence` RED_EVIDENCE_OK (target_test_failed) | the evidence commit is the parent of the fix commit; `src/accessories/pumpRecords.ts` stays 1dca0e3162dd9d74e1baa63fc55d6cd13170bb55 through the evidence commit, which changes only the evidence file |

| CR-05-ACCESSORY-002 | test/accessories/basementGuardian.test.ts `names missing fresh state for a cached self-test when its family stops resolving` | `05-BASEMENT-GUARDIAN-RED-EVIDENCE.json` as committed in b025898 (exit 1, tests 1, fail 1, ERR_ASSERTION at the target deepStrictEqual) | b025898 | 7bc27047c0dac3369b2e5ff76f025339c1297b63 | `check tdd-red-evidence` RED_EVIDENCE_OK (target_test_failed) | the evidence commit is an ancestor of the fix commit; `src/accessories/basementGuardian.ts` stays 4a7ba93bc5b95c6f7411fe899a8f8f62366cc533 through the evidence commit, which changes only the evidence file |

| CR-05-ACCESSORY-003 | test/accessories/basementGuardian.test.ts `reports degraded services without claiming refreshed metadata stayed unchanged` | `05-BASEMENT-GUARDIAN-RED-EVIDENCE.json` as committed in e8af5d2 (exit 1, tests 1, fail 1, ERR_ASSERTION at the target deepStrictEqual; `priorEvidence` holds the 002 record) | e8af5d2 | 667601c4ba3433061b13864b0801aa10a71efa76 | `check tdd-red-evidence` RED_EVIDENCE_OK (target_test_failed) | the evidence commit is an ancestor of the fix commit; `src/accessories/basementGuardian.ts` stays 678b67e7c0b67f910a8c29b01e80616058843e6a through the evidence commit, which changes only the evidence file; Cucumber consumer amendment c3c0f28 preceded the fix |

| CR-05-ACCESSORY-001 | test/accessories/basementGuardian.test.ts `restores the reported self-test value when an accepted press expires under three withdrawals`; test/accessories/controls.test.ts covers the undefined-report branch | `05-BASEMENT-GUARDIAN-RED-EVIDENCE.json` as committed in 41b2ba7 (exit 1, tests 1, fail 1, ERR_ASSERTION at the target deepStrictEqual; `priorEvidence` holds 003 then 002) | 41b2ba7 | a6cbebfacdf8bf0928b2ca7fe0f30cc5cd9811f4 | `check tdd-red-evidence` RED_EVIDENCE_OK (target_test_failed) | the evidence commit is an ancestor of the fix commit; `src/accessories/controls.ts` stays c739e918c05947d4617be3cfebb8ca95d4da4afd through the evidence commit, which changes only the evidence file; bounded controls amendment 6bc5ce7 and coverage amendment fdea7de preceded the fix |

| CR-05-ACCESSORY-030 | test/accessories/basementGuardian.test.ts `keeps the last REST connectivity time after a later live update` | `05-BASEMENT-GUARDIAN-RED-EVIDENCE.json` as committed in fd1368b (exit 1, tests 1, fail 1, ERR_ASSERTION at the target deepStrictEqual; `priorEvidence` holds 001, 003, then 002) | fd1368bdbcf2b8c5b33dc45ee8aef05e16e8abb1 | fee3e72921cf7a5209a6a26df18671a11dd9a838 | `check tdd-red-evidence` RED_EVIDENCE_OK (target_test_failed) | the evidence commit is the parent of the fix commit; `src/accessories/basementGuardian.ts` stays 9f82c7640ad68639f788bf1fe37d0a1b50c28eab through the evidence commit, which changes only the evidence file |

| CR-05-ACCESSORY-033 | test/accessories/basementGuardian.test.ts `keeps a successful unresolved-family REST poll time for connectivity` | `05-BASEMENT-GUARDIAN-RED-EVIDENCE.json` as committed in 8fc2983 (exit 1, tests 1, fail 1, ERR_ASSERTION at the target deepStrictEqual; `priorEvidence` holds 030, 001, 003, then 002) | 8fc2983a7e0333e0705307b6b1b6983c51f39e57 | 4f09addb40a27ef89c4b20e9b48b5376c12395b9 | `check tdd-red-evidence` RED_EVIDENCE_OK (target_test_failed) | the evidence commit is the parent of the fix commit; `src/accessories/basementGuardian.ts` stays b93bdfc37de97f12d5af1f60f63aaceb2984434f through the evidence commit, which changes only the evidence file |

| CR-05-ACCESSORY-034 | test/accessories/basementGuardian.test.ts `records the first recovered REST poll as connectivity last trusted time` | `05-BASEMENT-GUARDIAN-RED-EVIDENCE.json` as committed in b0ffac0 (exit 1, tests 1, fail 1, ERR_ASSERTION at the target deepStrictEqual; `priorEvidence` holds 033, 030, 001, 003, then 002) | b0ffac009f5c048d4cace92ab6793cee56baaa1b | 8cbfe7a755ba0e61b1860d6a848b9e4e4e57feb7 | `check tdd-red-evidence` RED_EVIDENCE_OK (target_test_failed) | the evidence commit is the parent of the fix commit; `src/accessories/basementGuardian.ts` stays 3f752052090117bffc785285b9db96d1fcd73446 through the evidence commit, which changes only the evidence file |

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

Correction round 2: dispatch 11, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over the eight batch files at `d9ad7272c514a6be2f244a1815266c771b68b57d` with the
opening set {025} and the 24 earlier fixed IDs. Terminal result: `05-DECLARATIONS-REVIEW-R2.md`,
025 fixed, 001 to 024 still fixed, two new findings (026 BLOCKER, 027 WARNING); its typecheck,
ESLint, build, owners (87 tests, 0 failures), four pair commands and batch header check all
exited 0 on Node v26.12.0. Stop rule applied first: opening 1, fixed 1, rejected 0, new 2,
reopened 0, closing 2, result `STOP: no progress`. The round-2 counter row, the two new finding
rows, the 025 disposition and the report stay uncommitted; the phase waits for the maintainer.

Maintainer resolution of the round-2 STOP, 2026-10-17: asked with the exact IDs and counts
(opening 1, fixed 1, rejected 0, new 2, reopened 0, closing 2; open 026 and 027), the maintainer
chose "Resolve and continue": record the resolution in the STOP cell, commit round 2, repair 026
(match any declared name containing `mute` in any case, closing the whole naming class) and 027,
and run correction round 3. The D-18 cap still applies: no round above 10.

Dispatch 12 (CR-05-DECLARATIONS-026, 027): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning alarmMute.test.ts, services.ts and the R2 report. Terminal result: two
commits, `ae9647dda2f825ec92214c4fa80bb5b6ee8badfd` (026: three named value-declaration patterns
and a `declaresMuteValue` predicate matching any-case `mute` names on variable, enum, field and
destructured declarations, with type, function and method names, object-literal keys and string
literals out of scope) and `c88bcca6eb05cde6d23e2bd7772bca75667f68b2` (027: comment text only).
Owners keep 3 and 12 tests with 0 failures; guard, build, pair coverage, ESLint and
`fallow audit --base 053599a` (verdict pass) exited 0 on Node v26.12.0. A read-only scan showed
only `accessories/alarmMute.ts` matching the new scope among the 43 modules. Assertion controls,
recorded in the R2 report and re-run on the final Prettier-formatted blob, each failed the case
with both modules in `declaring` and were restored: (a) a function-local `muteWindowMs`, (b) an
instance `private readonly muteWindowSeconds`, (c) a destructured `muteWindowMs`; the pre-fix
pattern flagged none of the three. Coordinator check: each commit lists only its owned path and
the R2 report, services.ts changes only comment lines, no temporary file remains, the two owners
pass (15 tests, 0 failures), and `git status --porcelain` is empty.

Correction round 3: dispatch 13, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over the eight batch files at `935b29044088a2fc0bd0f4e3e764dc4c21081fb7` with the
opening set {026, 027} and the 25 earlier fixed IDs. Terminal result:
`05-DECLARATIONS-REVIEW-R3.md`, 026 and 027 fixed, 001 to 025 still fixed, one new WARNING
CR-05-DECLARATIONS-028, with reasoned rejections of further scan-evasion forms; its typecheck,
ESLint, build, owners (87 tests, 0 failures), four pair commands and batch header check all
exited 0 on Node v26.12.0. Stop rule applied first: opening 2, fixed 2, rejected 0, new 1,
reopened 0, closing 1, result `continue`.

Dispatch 14 (CR-05-DECLARATIONS-028): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning alarmMute.test.ts and the R3 report. Terminal result: commit
`bd39257f443648b68cc3c7f3944601ee7e170522` (`test(alarmMute): title the scan case after a mute
value`), two owned paths, title change only; the owner keeps 3 tests with 0 failures; guard,
build, pair coverage, ESLint and `fallow audit --base 053599a` (verdict pass) exited 0 on Node
v26.12.0; the pre-step passed on its first run and the hook passed. Coordinator check: the commit
lists only the test and the R3 report, its only test change is the title line, and
`git status --porcelain` is empty.

Correction round 4: dispatch 15, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over the eight batch files at `6fcd1c3aa8f98f9a2e02d1d351c62087b348668f` with the
opening set {028} and the 27 earlier fixed IDs. Terminal result: `05-DECLARATIONS-REVIEW-R4.md`,
`status: clean`, 028 fixed, 001 to 027 still fixed, no new finding; its typecheck, ESLint, build,
owners (87 tests, 0 failures), four pair commands and batch header check all exited 0 on Node
v26.12.0. Stop rule applied first: opening 1, fixed 1, rejected 0, new 0, reopened 0, closing 0,
result `clean`; DECLARATIONS closes at correction round 4.

#### DECLARATIONS closure and wave gate (task 05-02-03)

- `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch DECLARATIONS`:
  exit 0, `ACCESSORIES_HEADERS_OK files=8`.
- `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --require-clean DECLARATIONS`:
  exit 0, `ACCESSORIES_LEDGER_TRACER_OK inventory=24 findings=35 open=0 rounds=5 clean=DECLARATIONS`.

| Field | Value |
| --- | --- |
| Command | `npm run check` |
| Raw exit | 0 |
| HEAD | `b90a65cc1cd82bdc92cdd226c8961d38bce9c98b` (`git status --porcelain` empty before the run) |
| Runtime | Node v26.12.0, npm 11.20.0 |
| UTC start | 2026-10-17T14:04:06Z |
| UTC end | 2026-10-17T14:05:03Z |
| Static checks | passed typecheck (3.6 s); passed lint (2.8 s); passed lint:workflows (0.4 s); passed fallow (3.6 s); passed format:check (0.9 s); passed test:corresponding (0.6 s) |
| Cucumber | 104 scenarios (104 passed); 1156 steps (1156 passed) |
| Direct coverage | Merged LCOV: coverage/direct.lcov (43 pairs) |
| Stderr | `Random order using seed: 312850` |

DECLARATIONS is clean at correction round 4: 28 findings (7 BLOCKER, 21 WARNING), all fixed in
their own commits, none rejected or reopened; one maintainer-resolved D-03 stop at round 2.

### 05-03

Resume check at 2026-10-17T14:12:53Z: Node v26.12.0, empty `git status --porcelain`, tracer
`ACCESSORIES_LEDGER_TRACER_OK inventory=24 findings=35 open=0 rounds=5` (exit 0), and no committed `### 05-03` subsection, so the plan starts at task 05-03-01.

Batch base: `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12`.

RED header check, `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CATALOGUE`:

```text
HEADER_VIOLATION src/accessories/serviceCatalogue.ts: 2 expected an empty line after the SPDX line
HEADER_VIOLATION test/accessories/serviceCatalogue.test.ts: 1 expected "// SPDX-License-Identifier: MIT"
exit=1
```

`node_modules/.bin/fallow guard` on both batch files: exit 0. Role resolution unchanged from
`### 05-02` (model `""`, effort `high`, empty agent-skills for both roles).

Dispatch 1 (round 0): role `gsd-code-reviewer`, model omitted, effort `high`, foreground, over
the two batch files at `ef7578f8c86c7f7b65adc3648cd7e404cfee7d12` with the owned leads and the
review questions. Terminal result: `05-CATALOGUE-REVIEW.md`, 15 findings (5 BLOCKER, 10 WARNING),
`status: issues_found`; its typecheck, ESLint, build, owner (185 tests, 13 suites, 0 failures) and
pair command all exited 0 on Node v26.12.0; no edit, no commit. Coordinator triage accepted all
15 as `open`, rejected lead S-05-17 for this batch, and added lead S-05-23 for GATES.

Dispatch 2 (CR-05-CATALOGUE-001): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning the pair and the report. Terminal result: commit
`c89c8c48d138afd0d3472a593bdd7206a3d8f878` (`style(serviceCatalogue): add the approved file
headers`), three owned paths, header lines only; the owner keeps 185 tests in 13 suites with 0
failures; guard, build, pair coverage, `--headers --batch CATALOGUE` (`ACCESSORIES_HEADERS_OK
files=2`) and `fallow audit --base ef7578f` (verdict pass) exited 0 on Node v26.12.0; the pre-step
passed on its first run and the hook passed. Coordinator check: three owned paths, 0 deleted
lines, only header lines added, the review commit `a68bd36` precedes it, and
`git status --porcelain` is empty.

Dispatch 3 (CR-05-CATALOGUE-011, 008): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning the pair and the report. Terminal result: two commits,
`976ca438921d148763bb751e7cecdf13df818eec` (011, the `seedConfiguredName` JSDoc only) and
`b70716fdbba981be9cc65db15e1af5a6c7a71486` (008, `isRowTrusted` made module-local, its five cases
moved under `describe('isRowFullyTrusted')` with every expected value kept). D-06 evidence, run
before the 008 edit and saved in the session scratch directory: `fallow dead-code --type-aware
--symbol-impact src/accessories/serviceCatalogue.ts:isRowTrusted` with `tsconfig.json` (raw exit
0, empty stderr, `status: complete`, `no-consumers-found`) and with `tsconfig.test.json` (raw exit
0, empty stderr, `status: complete`, one consumer: the paired test). The owner keeps 185 tests (13
suites, then 12 after the empty `describe('isRowTrusted')` was removed) with 0 failures; guard,
build, pair coverage, ESLint, typecheck and `fallow audit --base ef7578f` (verdict pass) exited 0
on Node v26.12.0. Coordinator check: each commit lists only owned paths; 011 changes only JSDoc
lines; the only non-comment source change in 008 is the dropped `export`; `isRowTrusted` no
longer appears in any test; both impact exits read 0 with complete status; `git status
--porcelain` is empty.

Dispatch 4 (CR-05-CATALOGUE-003 to 007): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning the catalogue test and the report. Terminal result: five commits, one per
cause: `76d78ebd665a824a6715babbe6b0b3cb2f895859` (003), `36f5ff26330058513108da32909b0dcba2b7ebdf`
(004: two off-ladder cases added, the import case retitled and kept), `5420b9d135d88463889b58c91aa4b48acfb7e566`
(005: removal), `2f31fbd6fb5c80f20fa5847e454ae6ef81561035` (006: six integer cases removed, the
outage case split into two whole-projection cases) and `570adc06580a0b9f6f76efa4c998939eb24a42f3`
(007: positive and isolated negative type checks). The owner went from 185 to 180 tests (12
suites) with 0 failures; the report maps every removed or added case (P-05-03). Guard, build, pair
coverage, ESLint and `fallow audit --base ef7578f` (verdict pass) exited 0 on Node v26.12.0.
Assertion controls, recorded in the report, each failed the intended case and were restored to
source blob `cef0ebf54fdb34c06e069609b325db919e591718`: 003 (a defaulted battery level), 004 A
(an inline ladder for `WaterLevel`) and B (flood derived from the code), 006 (`StatusFault` raised
for an outage) and 007 (`offlineConfirmed` made optional: `npm run typecheck` exit 2 with TS2578).
Coordinator check: each commit lists only the test and the report, `git diff 430a593..HEAD -- src
features` is empty, the source blob is `cef0ebf5...`, `new hap.HapStatusError` appears once, the
owner passes 180 tests with 0 failures, and `git status --porcelain` is empty.

Dispatch 5 (CR-05-CATALOGUE-002, 010, 012, 013, 014, 015, 009): role `gsd-code-fixer`, model
omitted, effort `high`, foreground, owning the catalogue test and the report. Terminal result:
seven commits, one per cause: `e86674b45bd964f08ede97f94b5a2bbb4e541919` (002, 19 markers to 0),
`2de0bbda8307384a31fb51ace48980c3ba517c55` (010), `53c375a3dbad97df0f457ced3013919f85e057c6`
(012), `7faf1c4c921e01232ec50be27ea8801c13133c74` (013), `2cec4940414ed18e372d89138d4b13c227182c9f`
(014), `e131aad3d9ce05fa77a58a32a158666fff9d4c61` (015) and `ded037b91b6201d851259c1a42bca2f99481a5c1`
(009: cases filed under the entrypoint they call, 12 cases split in two, map in the report). The
owner went from 180 to 192 tests (12 suites) with 0 failures. Guard, build, pair coverage, ESLint
and `fallow audit --base ef7578f` (verdict pass) exited 0 on Node v26.12.0; every pre-step passed
on its first run and every hook passed. Coordinator check: each commit lists only the test and
the report; `git diff 4315d21..HEAD -- src features` is empty; no `// act & assert` remains; the
two comment commits change only comment lines; `git status --porcelain` is empty.

Round-0 repair pass complete: every CATALOGUE finding has a fix commit. Batch checks at HEAD
`ded037b91b6201d851259c1a42bca2f99481a5c1`, Node v26.12.0, 2026-10-17T15:05:37Z to 15:05:44Z:
`npm run build:test` exit 0; the owner exit 0 (tests 192, suites 12, pass 192, fail 0, cancelled
0, skipped 0, todo 0); the pair command exit 0.

Correction round 1: dispatch 6, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over both batch files at `700ce9ac61885e50bfa39d9f0e0774f6372da749` with the opening
set of 15 IDs and their fix commits. Terminal result: `05-CATALOGUE-REVIEW-R1.md`, all 15 fixed,
one new WARNING CR-05-CATALOGUE-016 and twelve candidates considered and not filed; its typecheck,
ESLint, build, owner (192 tests, 12 suites, 0 failures), pair command and batch header check all
exited 0 on Node v26.12.0. Coordinator triage accepted 016 and accepted candidate 1 as
CR-05-CATALOGUE-017 (conditionals in data-loop bodies, against the Data-driven cases rule). Stop
rule: opening 15, fixed 15, rejected 0, new 2, reopened 0, closing 2, result `continue`.

Dispatch 7 (CR-05-CATALOGUE-016, 017): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning the catalogue test and the R1 report. Terminal result: two commits,
`1629e77f84b1b4b9ef8141f4566fffdce556e4eb` (016: the second-scope loop split into two named cases,
expected values kept) and `1a5c9ffcb5f2fe03614b8fa9d6aec1ccef37d836` (017: every data loop's
expected value moved into its rows; no ternary left in any test-registering loop body; the
remaining `===`/`!==` tokens select actual values in `.filter` callbacks). The owner keeps 192
tests in 12 suites with 0 failures and an identical title set for 017. Guard, build, pair
coverage, ESLint and `fallow audit --base ef7578f` (verdict pass) exited 0 on Node v26.12.0; both
pre-steps passed on their first run and both hooks passed. Coordinator check: each commit lists
only the test and the R1 report, `git diff f9b4b88..HEAD -- src features` is empty, the owner
passes 192 tests with 0 failures, and `git status --porcelain` is empty.

Correction round 2: dispatch 8, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over both batch files at `ec755ee2e4e9df8c608f11829085db637a472258` with the opening
set {016, 017} and the 15 earlier fixed IDs. Terminal result: `05-CATALOGUE-REVIEW-R2.md`, 016 and
017 fixed, 001 to 015 still fixed, two new BLOCKERs (018: battery `low` and `levelPercent` never
decoupled from their raw codes; 019: `reportedOffline` never `true`); its typecheck, ESLint,
build, owner (192 tests, 0 failures), pair command and batch header check all exited 0 on Node
v26.12.0. Stop rule applied first: opening 2, fixed 2, rejected 0, new 2, reopened 0, closing 2,
result `STOP: no progress`. The round-2 counter row, the two new finding rows, the 016 and 017
dispositions and the report stay uncommitted; the phase waits for the maintainer.

Maintainer resolution of the CATALOGUE round-2 STOP, 2026-10-17: asked with the exact IDs and
counts (opening 2, fixed 2, rejected 0, new 2, reopened 0, closing 2; open 018 and 019), the
maintainer chose "Resolve and continue": record the resolution in the STOP cell, commit round 2,
add the two missing pins with assertion controls, and run correction round 3. The D-18 cap still
applies: no round above 10.

Dispatch 9 (CR-05-CATALOGUE-018, 019): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning the catalogue test and the R2 report. Terminal result: two commits,
`8a10ce94fec8951ec619340741f8c485585cf98f` (018: three battery cases off the family derivation,
comparing both battery rows whole) and `ae2ab2cb2e69e479ced075aa3500a74b16eb1038` (019: an offline
case with `reportedOffline: true` and no confirmation). The owner went from 192 to 196 tests (12
suites) with 0 failures. Guard, build, pair coverage, ESLint and `fallow audit --base ef7578f`
(verdict pass) exited 0 on Node v26.12.0. Assertion controls, recorded in the R2 report, each
failed the new case(s) on the intended whole-value assertion and were restored to source blob
`cef0ebf54fdb34c06e069609b325db919e591718`: 018 A (`StatusLowBattery` from the raw codes), 018 B
(`BatteryLevel` from the protection-hours band) and 019 (the offline adapter also firing on
`reportedOffline`). Coordinator check: each commit lists only the test and the R2 report,
`git diff 047c26c..HEAD -- src features` is empty, the owner passes 196 tests with 0 failures,
and `git status --porcelain` is empty.

Correction round 3: dispatch 10, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over both batch files at `309d0da49c4866bef00d793477e4603b5c6146e4` with the opening
set {018, 019}, the 17 earlier fixed IDs and a systematic per-row coverage sweep. Terminal
result: `05-CATALOGUE-REVIEW-R3.md`, 018 and 019 fixed, 001 to 017 still fixed, a 17-row sweep
(14 rows fully covered) and three new BLOCKERs (020 self-test signal never set, 021 water rows
never checked whole beside another active condition, 022 the offline row never projected without
a connectivity group); its typecheck, ESLint, build, owner (196 tests, 0 failures), pair command
and batch header check all exited 0 on Node v26.12.0. Stop rule applied first: opening 2, fixed
2, rejected 0, new 3, reopened 0, closing 3, result `STOP: no progress`. The round-3 counter row,
the three new finding rows, the 018 and 019 dispositions and the report stay uncommitted; the
phase waits for the maintainer.

Maintainer resolution of the CATALOGUE round-3 STOP, 2026-10-17: asked with the exact IDs and
counts (opening 2, fixed 2, rejected 0, new 3, reopened 0, closing 3; open 020, 021 and 022), the
maintainer chose "Resolve and continue": record the resolution in the STOP cell, commit round 3,
add the three pins with assertion controls, and run correction round 4 against the row coverage
sweep. The D-18 cap still applies: no round above 10.

Dispatch 11 (CR-05-CATALOGUE-020, 021, 022): role `gsd-code-fixer`, model omitted, effort
`high`, foreground, owning the catalogue test and the R3 report. Terminal result: three commits,
`e565941a31dbee75b44a7d4f5bea3b3bff886b51` (020: the meaningless `pump.testRunning` key removed;
the real `'self-test'.running` signal driven through both activity adapters),
`f55d0f09db20a0c58ffb7f938e83b2e877849f8b` (021: flood and level rows compared whole beside a
sensor fault, a backup run and every other active condition) and
`252b50ab4b6e1bc944b3ba74e90994bd1528793d` (022: the offline row projected with `decoded:
undefined`). The owner went from 196 to 210 tests (12 suites) with 0 failures. Guard, build, pair
coverage, ESLint and `fallow audit --base ef7578f` (verdict pass) exited 0 on Node v26.12.0.
Assertion controls, recorded in the R3 report, each failed the intended cases and were restored to
source blob `cef0ebf54fdb34c06e069609b325db919e591718`: 020 A (hide the alert during a test) and B
(raise it), 021 A (flood withheld during a sensor fault) and B (level withheld), 022 (offline row
withheld without a connectivity group). Coordinator check: each commit lists only the test and
the R3 report, `git diff 520364a..HEAD -- src features` is empty, no ternary remains in the test,
the owner passes 210 tests with 0 failures, and `git status --porcelain` is empty.

Correction round 4: dispatch 12, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over both batch files at `e790d20da2ce14d82304048c524159b23b7b9293` with the opening
set {020, 021, 022}, the 19 earlier fixed IDs and the updated row sweep. Terminal result:
`05-CATALOGUE-REVIEW-R4.md`, 020 to 022 fixed, 001 to 019 still fixed, 16 of 17 rows covered, two
new findings (023 BLOCKER, 024 WARNING); its typecheck, ESLint, build, owner (210 tests, 0
failures), pair command and batch header check all exited 0 on Node v26.12.0. Stop rule applied
first: opening 3, fixed 3, rejected 0, new 2, reopened 0, closing 2, result `continue`.

Dispatch 13 (CR-05-CATALOGUE-023, 024): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning the catalogue test and the R4 report. Terminal result: two commits,
`b87ee68ab4966ab4a0cc2ce144b56954a7f75d79` (023: a two-row loop with the pumps in opposite states,
comparing the Backup Pump and Backup Pump Running rows whole) and
`da8ff2c5dd898acbfdb597efa1934dcc4110653f` (024: the quiet-backup case arranged from
`everyOtherConditionActive()`, expected value unchanged). The owner went from 210 to 212 tests (12
suites) with 0 failures. Guard, build, pair coverage, ESLint and `fallow audit --base ef7578f`
(verdict pass) exited 0 on Node v26.12.0; one gitlint title-length rejection made no commit and
the retry used a shorter title with no amend. Assertion controls for 023, recorded in the R4
report, each failed the new rows and were restored to source blob
`cef0ebf54fdb34c06e069609b325db919e591718`: A (the backup row reads `primaryRunning`) and B (it ORs
both pumps). Coordinator check: each commit lists only the test and the R4 report,
`git diff c79a40e..HEAD -- src features` is empty, the owner passes 212 tests with 0 failures,
and `git status --porcelain` is empty.

Correction round 5: dispatch 14, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over both batch files at `ddc645b1329990f3e9a652cfaa48767532d85186` with the opening
set {023, 024} and the 22 earlier fixed IDs. Terminal result: `05-CATALOGUE-REVIEW-R5.md`, 023
fixed, 024 still open (the arrange leaves the pit dry), 001 to 022 still fixed, all 17 rows
covered, no new finding; its typecheck, ESLint, build, owner (212 tests, 0 failures), pair command
and batch header check all exited 0 on Node v26.12.0. Stop rule applied first: opening 2, fixed 1,
rejected 0, new 0, reopened 0, closing 1, result `continue`.

Dispatch 15 (CR-05-CATALOGUE-024 remainder): role `gsd-code-fixer`, model omitted, effort
`high`, foreground, owning the catalogue test and the R5 report. Terminal result: commit
`46265a6a019396b07e7d2bcff5731cec26d8c61f` (`test(serviceCatalogue): flood the pit in the quiet
backup case`), two owned paths, the flooding water group added to the arrange with the title and
expected value unchanged; the owner keeps 212 tests in 12 suites with 0 failures; guard, build,
pair coverage, ESLint and `fallow audit --base ef7578f` (verdict pass) exited 0 on Node v26.12.0;
the pre-step passed on its first run and the hook passed. Coordinator check: two owned paths,
`git diff 64c57c7..HEAD -- src features` is empty, `git status --porcelain` is empty.

Correction round 6: dispatch 16, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over both batch files at `9fb85e1194b8b04a0d663fae5e813e8bbd8a57f1` with the opening
set {024} and the 23 earlier fixed IDs. Terminal result: `05-CATALOGUE-REVIEW-R6.md`,
`status: clean`, 024 fixed, 001 to 023 still fixed, all 17 rows covered, no new finding; its
typecheck, ESLint, build, owner (212 tests, 0 failures), pair command and batch header check all
exited 0 on Node v26.12.0. Stop rule applied first: opening 1, fixed 1, rejected 0, new 0,
reopened 0, closing 0, result `clean`; CATALOGUE closes at correction round 6.

#### CATALOGUE closure and wave gate (task 05-03-03)

- `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CATALOGUE`:
  exit 0, `ACCESSORIES_HEADERS_OK files=2`.
- `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --require-clean CATALOGUE`:
  exit 0, `ACCESSORIES_LEDGER_TRACER_OK inventory=24 findings=59 open=0 rounds=12 clean=CATALOGUE`.

| Field | Value |
| --- | --- |
| Command | `npm run check` |
| Raw exit | 0 |
| HEAD | `d9ddb347909abef1558cae8c66b8f8d097daf5f6` (`git status --porcelain` empty before the run) |
| Runtime | Node v26.12.0, npm 11.20.0 |
| UTC start | 2026-10-17T17:15:51Z |
| UTC end | 2026-10-17T17:16:47Z |
| Static checks | passed typecheck (2.7 s); passed lint (1.4 s); passed lint:workflows (0.3 s); passed fallow (3.1 s); passed format:check (0.8 s); passed test:corresponding (0.6 s) |
| Cucumber | 104 scenarios (104 passed); 1156 steps (1156 passed) |
| Direct coverage | Merged LCOV: coverage/direct.lcov (43 pairs) |
| Stderr | `Random order using seed: 714783` |

CATALOGUE is clean at correction round 6: 24 findings (11 BLOCKER, 13 WARNING), all fixed, none
rejected or reopened; two maintainer-resolved D-03 stops (rounds 2 and 3).

### 05-04

Resume check at 2026-10-17T17:43:33Z: Node v26.12.0, empty `git status --porcelain`, tracer
`ACCESSORIES_LEDGER_TRACER_OK inventory=24 findings=59 open=0 rounds=12` (exit 0), and no committed `### 05-04` subsection, so the plan starts at task 05-04-01.

Batch base: `4c143ebad681cf602e787b8c2ea09b050d8a9518`.

RED header checks: `--headers --paths src/accessories/controls.ts` printed
`HEADER_VIOLATION src/accessories/controls.ts: 2 expected an empty line after the SPDX line` (exit 1); `--headers --paths test/accessories/controls.test.ts` printed
`ACCESSORIES_HEADERS_OK files=1` (exit 0). `node_modules/.bin/fallow guard` on both batch files: exit 0.

Roles (resolved 2026-10-17): `query resolve-model` gives model `""`, profile `quality`, effort
`high` for both `gsd-code-reviewer` and `gsd-code-fixer`; `query agent-skills` is empty for both.

Dispatch 1 (round 0): role `gsd-code-reviewer`, model omitted, effort `high`, foreground, over
the two batch files at `4c143ebad681cf602e787b8c2ea09b050d8a9518` with the seven seeds, the owned
leads and the review questions. Terminal result: `05-CONTROLS-REVIEW.md`, 29 findings (9 BLOCKER,
20 WARNING), `status: issues_found`. Its typecheck, ESLint, build, owner (63 tests, 0 suites, 0
failures) and pair command all exited 0 on Node v26.12.0. Its two probes were read-only runs of
the compiled module; it made no edit and no commit. Coordinator triage accepted all 29 as `open`,
classified CR-05-CONTROLS-008 and 009 as genuine production bugs under D-04 (locked D-037 and
D-038; the timed-out row of the original research expects the pending state to stay), added the
SC-02 citation to 029 (D-10) and confirmed leads S-05-01 (CONTROLS part), 04, 05, 06 (CONTROLS
part), 18 and 19.

Dispatch 2 (CR-05-CONTROLS-025): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning `src/accessories/controls.ts` and the report. Terminal result: commit
`704a2ff760107617250b372930a101355aef35a4` (`style(controls): add the approved source file
header`), two owned paths. The owner keeps 63 tests (0 suites) with 0 failures; guard, build,
pair coverage, ESLint, `--headers --batch CONTROLS` (`ACCESSORIES_HEADERS_OK files=2`) and
`fallow audit --base 4c143eb` (verdict pass) exited 0 on Node v26.12.0; the pre-step passed on its
first run and the hook passed. Coordinator check: two owned paths; `controls.ts` gains only the
empty line, the copyright block and the empty line (5 added, 0 deleted); the review commit
`eb15deb` precedes it; the GREEN header check `--headers --paths src/accessories/controls.ts`
prints `ACCESSORIES_HEADERS_OK files=1` (exit 0); `git status --porcelain` is empty.

Dispatch 3 (CR-05-CONTROLS-007, 020, 021, 026): role `gsd-code-fixer`, model omitted, effort
`high`, foreground, owning `src/accessories/controls.ts` and the report. Terminal result: four
comment-only commits, one per cause: `c2026fe9175baab0620a066a4fc162b565f12caa` (007, the order
note moved byte for byte above `const LOCAL_REFUSALS`), `ee4969f0ec7a70b4db181dd983480d46e4c5916e`
(020, the `bind` JSDoc states HAP's single set-handler slot), `b1a7668c7d67dbc95f51e55783d109e6e5dd10ad`
(021, the transport notes in the present tense with the real WR-02 title) and
`e3c873166ba1b48a26d880e5832c03bec2ab04bd` (026, the overview push note and the order note's
first sentence). For each, guard, build, owner (63 tests, 0 failures), pair coverage, ESLint and
`fallow audit --base 4c143eb` (verdict pass) exited 0 on Node v26.12.0, and the pre-step and hook
passed. The fixer noted that Git's diff shows 007 as the two cause constants moving rather than
the comment block; the non-comment lines are unchanged. Coordinator check: each commit lists the
two owned paths; the non-comment, non-blank lines of `controls.ts` equal those at the batch base
in the same order (`diff` exit 0); the line before `const LOCAL_REFUSALS` ends the block that
begins "The rules in the order they are evaluated"; `git status --porcelain` is empty.

Dispatch 4 (CR-05-CONTROLS-008, RED): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning only `test/accessories/controls.test.ts`. It added the active regression test
'refuses a second on request while the first waits for the device, and sends one command' at HEAD
`a6bbf922aec5cadff6065dfda854231ba3d3536a`, built, and ran the target alone with the TAP reporter:
raw exit 1, tests 1, pass 0, fail 1, empty stderr, a `testCodeFailure` `ERR_ASSERTION` at the
target's own `deepStrictEqual` (actual: no rejection, two sends, delays `[30000, 30000]`, no
warning). It committed nothing. Coordinator check: the production blob stayed
`7a9239714077956f50b9e5fa4eb0a971d03fd1d7`; the only working-tree change was that test. The
coordinator wrote `05-CONTROLS-RED-EVIDENCE.json` (every `src` blob, the raw TAP, the patch,
`priorEvidence` empty); `check tdd-red-evidence --raw` printed `RED_EVIDENCE_OK`
(`target_test_failed`); the pre-step left it unchanged; it was committed alone as
`9b5cd207106e2f1370ab7d563986efccc6d8c9f0` with the test left unstaged.

Dispatch 5 (CR-05-CONTROLS-008, GREEN): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning the pair and the report. Terminal result: commit
`a2ae20acc02b310ad0c2037ce3489c0f7e338836` (`fix(controls): refuse a second press while one
waits`), three owned paths. The source change only adds lines: the `pending` fact sampled in
`answerWrite`, the module-local `isAwaitingConfirmation` rule, a paragraph on its place in the
order note, and one row appended last in `LOCAL_REFUSALS` (`RESOURCE_BUSY`, cause "an earlier
request is still waiting for the device to confirm it"). The test keeps the regression case
byte for byte and restates the comment above `interface RefusalCase`. Guard, build, the target
alone (pass), the owner (64 tests, 0 failures), pair coverage, ESLint, typecheck, the consumer
`basementGuardian` owner (157 tests, 0 failures) and pair, the whole Cucumber suite (104
scenarios, 1156 steps) and `fallow audit --base 4c143eb` (verdict pass) exited 0 on Node
v26.12.0; no exported name changed, so D-06 did not apply. Coordinator check: three owned paths;
no source line removed; the RED patch's added lines are all in the fix; the evidence commit is
its parent; `git status --porcelain` is empty.

Dispatch 6 (CR-05-CONTROLS-009, RED): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning only `test/accessories/controls.test.ts`. It added the active regression test
'keeps the request pending when the vendor does not answer in time' at HEAD
`df9c823f140eabfc638581f3bc0e123bf29aebf9`, built, and ran the target alone with the TAP
reporter: raw exit 1, tests 1, pass 0, fail 1, empty stderr, a `testCodeFailure` `ERR_ASSERTION`
at the target's own `deepStrictEqual`, where only `pending` (`[]`) and `cancelled` (`[0]`) differ.
It committed nothing. Coordinator check: the production blob stayed
`e1fddbb00645b26d1e58a55ae2f91ba8869b8241`; the only working-tree change was that test. The
coordinator rewrote `05-CONTROLS-RED-EVIDENCE.json` for this cause with the committed 008 record
in `priorEvidence` (deep-equal to it); `check tdd-red-evidence --raw` printed `RED_EVIDENCE_OK`
(`target_test_failed`); the pre-step left it unchanged; it was committed alone as
`1f8593865ec49ffeff13ebe33e75bbd1b2932c72` with the test left unstaged.

Dispatch 7 (CR-05-CONTROLS-009, GREEN): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning the pair and the report. Terminal result: commit
`670ae8955b6b5cdd38e0a9d9ebeeac936481c972` (`fix(controls): keep a timed-out request pending`),
three owned paths. `refuseOutcome` resolves the pending entry only for `vendor-error`; its
comment now states what each outcome does to the entry. The clearing push, warning line, status,
single attempt and throw are unchanged. The test keeps the regression case byte for byte; the
inline failure table and `RefusalCase` gain a hand-written `pendingAfterRefusal` per row (`[]`
except the exceeded deadline, `['self-test']`), and the two vendor-outcome titles interpolate it.
Guard, build, the target alone (pass), the owner (65 tests, 0 failures), pair coverage, ESLint,
typecheck, the `basementGuardian` owner (157 tests, 0 failures) and pair, the whole Cucumber suite
(104 scenarios, 1156 steps) and `fallow audit --base 4c143eb` (verdict pass) exited 0 on Node
v26.12.0; no exported name changed. Coordinator check: three owned paths; the source diff is the
`refuseOutcome` comment and the `vendor-error` condition only; the RED test block is present
verbatim; the evidence commit is its parent; `git status --porcelain` is empty.

Dispatch 8 (CR-05-CONTROLS-003, 004, 006, 005, 001, 019, 024): role `gsd-code-fixer`, model
omitted, effort `high`, foreground, owning the test and the report. Terminal result: seven
test-only commits, one per cause: `13d46f18108bdfeac73febe414fcb60c94009a8f` (003, the
stand-in-only microtask case removed; its protection is hapWriteFidelity's 'survives a push
queued as a microtask inside the handler, on both implementations'),
`014f6014ea75890d98504bd0af9a552b67a19ce2` (004, a `t.mock.method` spy on `onSet`),
`0506c32ca732a313408544e902aebb4241f6d998` (006, the commented `asService` helper),
`05b4b9ab2512b8b3d5a34ffacf92d5239aeafd94` (005, `writeRejection` and split phases),
`7929ddb303343e032d68f3a2597320303131201d` (001, the whole warnings array),
`074ed67e99f121227dad34e86ab3d5b6c9025dc9` (019, one status case per `REFUSALS` row) and
`c6267b1f87ee9a02e14357648b756771a798d3f6` (024, `acceptedOutcome()` and per-row outcome seeds,
`readonly` row fields; D-10 SC-02). The owner went 65 -> 64 (003) -> 71 (019) tests with 0
failures; guard, build, pair coverage, ESLint, typecheck and `fallow audit --base 4c143eb`
(verdict pass) exited 0 after each on Node v26.12.0. Controls (WARNING causes, run anyway): for
004, `bind` without its guard failed the case with `2 !== 1`; for 001, `expire` logging twice
failed the case on the warnings value; both restored to blob
`e28c52bc0f45b0e8a0c4e9e28fd673699bdc9dfb` with `git diff --exit-code` exit 0 and GREEN rebuilt.
Coordinator check: each commit lists the two owned paths; no `src` change since `ced1d75`;
`as unknown as` appears only on the `HAP_NAMESPACE` line and inside `asService`; the
microtask-case title is gone; `git status --porcelain` is empty.

Dispatch 9 (CR-05-CONTROLS-023): role `gsd-code-fixer`, model omitted, effort `high`, foreground,
owning the test and the report. Terminal result: commit
`dbad2c167a26b4c6ae321a8d8bfe52de472774c7` (`test(controls): verify issued commands with strict
mocks`), two owned paths. Twenty-three cases whose promise includes the commands sent now create
`mock<CommandPort>({ exactParams: true, name: 'commands' })` inside the case, state each promised
send with exact arguments (or none) and call `verify(commands)` last; the other cases answer
through a typed stub, `answeringCommands`, whose calls no case asserts. `recordingCommands` and
every `sends` field are gone; `refuse()` takes the port as a parameter, so no loop body branches;
no title, status, cause or warning line changed (D-10 SC-02). The owner keeps 71 tests with 0
failures; guard, build, pair coverage, ESLint, typecheck and `fallow audit --base 4c143eb`
(verdict pass) exited 0 on Node v26.12.0. Control: a second `commands.send` in `answerWrite`
failed ten mock cases (an unexpected call, and with the extra call's error swallowed, `verify`
reporting it); restored to blob `e28c52bc0f45b0e8a0c4e9e28fd673699bdc9dfb` with
`git diff --exit-code` exit 0 and GREEN rebuilt. Coordinator check: two owned paths; no `src`
change; no `recordingCommands`, `anyTimes` or `It.isAny` remains; `git status --porcelain` is
empty.

Dispatch 10 (CR-05-CONTROLS-010, 012, 013, 014): role `gsd-code-fixer`, model omitted, effort
`high`, foreground, owning the test and the report. Terminal result: four test-only commits:
`2a6747b1012108152d74c4ee410e36c42b7b0080` (010: eleven single-write precedence rows, N+A
included because 014 rewrites the case that pinned that pair by accident, and six rows of a
second press over a waiting request), `7a3bfc0078c5940017aa5dea89cf37f7c0796feb` (012: the
non-matching reports keep the window, `cancelled: []`), `5f06eb71de140efcbede317a5dd7ef7a7fa590a8`
(013: a local and both vendor clearing pushes republish the rows) and
`0ca2edf59f0b4cdae67cb35c1ee14c24c6fb1574` (014: the reported value and the held value change
between the refusal and the push). The owner went 71 -> 88 -> 90 tests with 0 failures; guard,
build, pair coverage, ESLint, typecheck and `fallow audit --base 4c143eb` (verdict pass) exited 0
after each on Node v26.12.0. Controls, each restored to blob
`e28c52bc0f45b0e8a0c4e9e28fd673699bdc9dfb` with `git diff --exit-code` exit 0 and GREEN rebuilt:
offline moved to the top, active moved above offline, and pending moved above active each failed
precedence rows (010); `reconcile` cancelling before it compares failed both cases (012); the
binder's push skipping `republish()` failed all three (013); `reported()` sampled when the push is
armed, and the restored refusal reading the held value at refusal time, failed their cases
(014). Coordinator check: each commit lists the two owned paths; no `src` change;
`git status --porcelain` is empty.

Dispatch 11 (CR-05-CONTROLS-011, 029, 015, 016): role `gsd-code-fixer`, model omitted, effort
`high`, foreground, owning the test and the report. Terminal result: four test-only commits:
`ae0eaa4ef2498519f179f349fa30bbaa6147635c` (011: each vendor row carries its delays and
cancellations, every deferral is run, and the strict mock is verified; D-10 SC-02),
`9dd9ead68810c11a672f2942055aabab0cea9aa5` (029: whole delay lists, `delaysAfterRefusal` on every
`REFUSALS` row; D-10 SC-02), `cc1ebae79aa57261a88dcab2aecb27d6f753b0b2` (015: the restored
status, log and clearing-push cases run for a press of `true` and of `false`) and
`11b384a4e5833fa7e013d663b4c47f58986f397b` (016: the handler captured through a `t.mock.method`
spy is called directly and must throw the namespace's `HapStatusError` with the row's status, for
all eight rows and the restored handler). The owner went 90 -> 93 -> 102 tests with 0 failures;
guard, build, pair coverage, ESLint, typecheck and `fallow audit --base 4c143eb` (verdict pass)
exited 0 after each on Node v26.12.0. Controls, each restored to blob
`e28c52bc0f45b0e8a0c4e9e28fd673699bdc9dfb` with `git diff --exit-code` exit 0 and GREEN rebuilt:
a retry on a 5000 ms timer and a `requested.delete` that leaves the window armed (011); an extra
1000 ms deferral (029); a restored handler that lets `false` through (015); `refuse()` throwing a
plain `Error` or a bare number (016, where only the new cases catch either). Coordinator check:
each commit lists the two owned paths; no `src` change; `git status --porcelain` is empty.

Dispatch 12 (CR-05-CONTROLS-017, 018, 022, 027, 028): role `gsd-code-fixer`, model omitted,
effort `high`, foreground, owning the test and the report. Terminal result: five test-only
commits: `498f0da0e13838b6cce1338eaf95498ca8cc3304` (017: the twelve remaining `assertRefused`
sites under `// act` capture `thrown` with `writeRejection`, the helper is gone, no `// act` block
holds an `assert.` call; the other seven sites had gone with earlier repairs; D-10 SC-02),
`5d230b6bb101134a8cd4df110c129723d71b9498` (018: `readOfSwitch` awaits the read; D-16, stand-in
lead S-05-23), `09882cfdfddb9439c667cca756305c4030280e12` (022: the quiet-live-path rule named),
`710b87f0b775938f8c77e0ba0829b66d95a09cc8` (027: the silent log comment) and
`a734c1a2359c6e70f752c9ecf4968faf648fef09` (028: block bodies for the no-op `clearInterval` and
`republish` defaults). The owner keeps 102 tests with 0 failures; guard, build, pair coverage,
ESLint, typecheck and `fallow audit --base 4c143eb` (verdict pass) exited 0 after each on Node
v26.12.0. Coordinator check: each commit lists the two owned paths; no `src` change;
`assertRefused` no longer appears; `git status --porcelain` is empty.

Dispatch 13 (CR-05-CONTROLS-002): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning the test and the report. Terminal result: two test-only commits,
`41e0ca4f794ea33c704cee90d2fe5533a7bbc507` (a pure move of the six declaration blocks that sat
between cases to above the first case; the sorted lines before and after are identical, 1532
lines, and the 43 `test(` calls keep their order) and `dbcbf0788d89ad38c63ceafb7b290e990496a632`
(the reindent: `describe('createControlBinder')` and `describe('bindRestoredControlRefusal')`,
not nested). `git diff -w` of the reindent shows only the `describe` import and the four wrapper
lines. The owner keeps 102 tests, now in 2 suites, with 0 failures; guard, build, pair coverage,
ESLint, typecheck and `fallow audit --base 4c143eb` (verdict pass) exited 0 on Node v26.12.0. The
fixer reported that the move left two position words wrong: the `PRECEDENCE` comment says three
other pairs "have their own cases above" and the `RefusalCase` comment says "Every case below";
both cases now follow the tables. Coordinator check: two owned paths per commit; the sorted-line
`diff` exits 0; the `-w` diff matches; `git status --porcelain` is empty. The position words are
left for correction round 1 to judge.

Round-0 repairs complete. Fresh checks at `dbcbf0788d89ad38c63ceafb7b290e990496a632` on Node
v26.12.0: `npm run build:test` exit 0; `node --test dist-test/test/accessories/controls.test.js`
exit 0 (tests 102, suites 2, pass 102, fail 0, cancelled 0, skipped 0, todo 0);
`npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts`
exit 0 (no output, the pair at 100% alone). Every round-0 finding has at least one fix commit.

Correction round 1: dispatch 14, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over both batch files at `b86e6b05549e3569ce3e4dae457efb97bd8d6485` with the 29
opening IDs and their fix commits. Terminal result: `05-CONTROLS-REVIEW-R1.md`, all 29 confirmed
fixed, none reopened, 4 new WARNINGs (030 to 033), `status: issues_found`. Its typecheck,
ESLint, build, owner (102 tests, 2 suites, 0 failures) and pair command exited 0 on Node
v26.12.0; its probes were read-only runs of the compiled module; no edit, no commit. Coordinator
triage: opening 29, fixed 29, rejected 0, new 4, reopened 0, closing 4, `continue`. 033 is
classified as a genuine bug (D-04) with the coordinator's timed-out wording recorded in the
round report's triage.

Record correction: the ledger commit `ced1d75` wrote 009's evidence commit as `1f85938659`, a
typing error for `1f8593865e` (`1f8593865ec49ffeff13ebe33e75bbd1b2932c72`). The tracer checks fix
commits once a finding is `fixed`, and it named the bad hash; the row now holds the right one,
and every CONTROLS fix-commit hash resolves to a commit.

Dispatch 15 (CR-05-CONTROLS-032): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning `src/accessories/controls.ts` and the R1 report. Terminal result: commit
`854d5d117c64f9b98f56b2cc2e9e7a253940dbbd` (`docs(controls): state when a pending entry exists
and ends`), two owned paths, comment lines only: the `requested` comment names all three ways an
entry ends, the `refuseLocally` comment says a local refusal adds no entry and leaves an earlier
one alone, and the accepted-write comment names the window. It also opened the R1 report's
`## Repair history`. Guard, build, owner (102 tests, 2 suites, 0 failures), pair coverage,
ESLint and `fallow audit --base 4c143eb` (verdict pass) exited 0 on Node v26.12.0. Coordinator
check: two owned paths; the non-comment lines equal those of its parent (`diff` exit 0);
`git status --porcelain` is empty.

Dispatch 16 (CR-05-CONTROLS-033, RED): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning only the test. It added 'warns that a timed-out request may still have reached
the device' inside `describe('createControlBinder')` at HEAD
`564e1661fd570df0a17d9a275a35f368d4cd578b`, built, and ran the target alone: raw exit 1, tests 1,
suites 1, fail 1, empty stderr, a `testCodeFailure` `ERR_ASSERTION` at its own
`deepStrictEqual` where only the warning line differs. It committed nothing; the production blob
stayed `2b0a51f03e7ccbe913ec30306ed8ee558ea419c4`. The coordinator rewrote
`05-CONTROLS-RED-EVIDENCE.json` with the committed 009 record in `priorEvidence`; `check
tdd-red-evidence --raw` printed `RED_EVIDENCE_OK`; it was committed alone as
`11c32d23dfbd2f2c06e660200678e6ef0b5b2a71` with the test left unstaged.

Dispatch 17 (CR-05-CONTROLS-033, GREEN): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning the pair and the R1 report. Terminal result: commit
`7790818ee032874025f4629998e40d59fb3260dd` (`fix(controls): say a timed-out request may still
reach the device`), three owned paths. A module-local `outcomeWarning` gives the timed-out line
"timed out and may still have reached the device"; the `vendor-error` line is unchanged; the
three expectations of the old timed-out line moved to the new one (the exceeded-deadline row is
an SC-02 line, D-10). The target passes alone; owner 103 tests, 2 suites, 0 failures; pair
coverage, ESLint, typecheck, the `basementGuardian` owner (157 tests, 0 failures) and pair, the
whole Cucumber suite (104 scenarios, 1156 steps) and `fallow audit --base 4c143eb` (verdict pass)
exited 0 on Node v26.12.0. Only `src/runtime/commandPort.ts:21` still says "did not take effect",
the `CommandFailure` JSDoc outside this batch. The fixer observed that 'names the capability, the
device and the cause in the one line a refusal logs, and quotes nothing else' now repeats the
regression case. Coordinator check: three owned paths; the only removed source line is the old
`log.warn`; the RED block is present verbatim; the evidence commit is its parent;
`git status --porcelain` is empty.

Dispatch 18 (CR-05-CONTROLS-030, 031): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning the test and the R1 report. Terminal result: two test-only commits,
`f96f63c14119cb327642a4e41ace2411d8660e81` (030: the support comments name the tables and
entrypoints instead of positions, and five more comments of the same class were restated) and
`75b9825456d41ffcc68fd97c54b4271665ca9450` (031: both log stand-ins declare `function noop()`).
The owner keeps 103 tests in 2 suites with 0 failures; guard, build, pair coverage, ESLint,
typecheck and `fallow audit --base 4c143eb` (verdict pass) exited 0 after each on Node v26.12.0.
Coordinator check: two owned paths per commit; no `src` change; `git status --porcelain` is
empty. Every round-1 finding has a fix commit.

Correction round 2: dispatch 19, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over both batch files at `858fb2c550fd4aa10d378f8611961034e7458299` with the four
opening IDs and the 29 earlier fixed IDs. Terminal result: `05-CONTROLS-REVIEW-R2.md`, all four
confirmed fixed, 001 to 029 still fixed, none reopened, 3 new (034 and 035 WARNING, 036 BLOCKER),
`status: issues_found`. Its typecheck, ESLint, build, owner (103 tests, 2 suites, 0 failures),
pair command and header tracer exited 0 on Node v26.12.0; one read-only probe; no edit, no
commit. Coordinator triage: opening 4, fixed 4, rejected 0, new 3, reopened 0, closing 3,
`continue`; 036 pins the decided WR-02 behavior.

Dispatch 20 (CR-05-CONTROLS-035, 036, 034): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning the pair and the R2 report. Terminal result: three commits,
`3e879b6a15786a54226ed0b4a7f13c0b3b8d5464` (035: the gate and clearing-push comments without a
wrong count; comment lines only), `96273624c94085105debf53e7d533c74e86ffa8d` (036: 'returns the
Switch to the reported value when a press is refused while a request waits') and
`5f5a8282b2e4f001632bdb1e2cc7c67c7e209826` (034: the older duplicate case removed; the
regression case and the eight exact-log cases keep its protection, P-05-03). The owner went 103
-> 104 -> 103 tests in 2 suites with 0 failures; guard, build, pair coverage, ESLint, typecheck
and `fallow audit --base 4c143eb` (verdict pass) exited 0 after each on Node v26.12.0. Control
for 036: a clearing push that publishes the held value while a request waits failed only the new
case (`afterThePush: true`); restored to blob `9e67adddaace6c27aed33d1877db1d4e8b180ab6` with
`git diff --exit-code` exit 0 and GREEN rebuilt. Coordinator check: two owned paths per commit;
the non-comment source lines are unchanged since the round-2 revision; `git status --porcelain`
is empty.

Correction round 3: dispatch 21, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over both batch files at `207d5460d50789ae04b7b5ecdd712dc7ff5dfa88` with the three
opening IDs and the 33 earlier fixed IDs. Terminal result: `05-CONTROLS-REVIEW-R3.md`, all three
confirmed fixed, 001 to 033 still fixed, none reopened, 2 new WARNINGs (037, 038), `status:
issues_found`. Its typecheck, ESLint, build, owner (103 tests, 2 suites, 0 failures), pair command
and header tracer exited 0 on Node v26.12.0; one read-only probe; no edit, no commit. Coordinator
triage: opening 3, fixed 3, rejected 0, new 2, reopened 0, closing 2, `continue`.

Dispatch 22 (CR-05-CONTROLS-037, 038): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning the pair and the R3 report. Terminal result: two comment-only commits,
`946be0e583e3734f8b8dfbf1e6a5a3a964146826` (037: the transport and clearing-push comments say
only what the code shows, and three more comments of the same class were restated) and
`eb503e56436bd77a428d0b4f747c9c97af111fb4` (038: the precedence comments no longer count pairs
the table does not hold). The fixer left one same-class paragraph for the coordinator: the order
note justified naming the quiet live path ahead of a missing state with "the state is not
missing", though the order decides only when it is. Dispatch 23 (CR-05-CONTROLS-037, second
commit), same role and settings, owning `src/accessories/controls.ts` and the R3 report:
`a1be90c32b4d5e1b296f19e2742426cc9c2c8bd1` (`docs(controls): ground the order note in the case it
decides`) restates it with the binder-wide scope of the quiet-live-path fact; the fixer corrected
the coordinator's suggested wording, because `hasNoFreshState` refuses whatever the live path
does. Owner 103 tests, 2 suites, 0 failures; guard, build, pair coverage, ESLint and
`fallow audit --base 4c143eb` (verdict pass) exited 0 after each commit on Node v26.12.0.
Coordinator check: two owned paths per commit; the non-comment lines of both files are unchanged
since the round-3 revision; `git status --porcelain` is empty.

Correction round 4: dispatch 24, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over both batch files at `3605e598f06f8c3068e102dc777272f5f810ce12` with the two
opening IDs and the 36 earlier fixed IDs. Terminal result: `05-CONTROLS-REVIEW-R4.md`, both
confirmed fixed, 001 to 036 still fixed, none reopened, 3 new (039 and 040 WARNING, 041 BLOCKER),
`status: issues_found`. Its typecheck, ESLint, build, owner (103 tests, 2 suites, 0 failures),
pair command and header tracer exited 0 on Node v26.12.0; one read-only probe; no edit, no
commit. Coordinator triage: opening 2, fixed 2, rejected 0, new 3, reopened 0, closing 3, so
`STOP: no progress` (D-03, D-18). The row and the report stayed uncommitted, nothing else ran,
and the blocking report named 039, 040 and 041 with the counts. The maintainer chose "Resolve and
continue" on 2026-10-17; the cell now reads `STOP: no progress; resolved by maintainer`.

Dispatch 25 (CR-05-CONTROLS-039, 041, 040): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning the pair and the R4 report. Terminal result: three commits,
`77db33316627473055e663091644b6ea8bfa51a9` (039: the source comments use the catalogue's words,
may publish against can vouch, with two more same-class comments restated),
`f9f2bcd0110757e0a8d6f1daa1bf2e8bf0fcb570` (041: 'refuses a second on request while the first is
still being sent, and sends one command' and a sibling for a confirming report while the send is
in flight) and `7d1943e615323590d28c59240ae50793fae0352f` (040: the test comments and one title
match the withholding rule). The owner went 103 -> 105 tests in 2 suites with 0 failures; guard,
build, pair coverage, ESLint, typecheck and `fallow audit --base 4c143eb` (verdict pass) exited 0
after each on Node v26.12.0. Controls for 041, each restored to blob
`ce37d2a80a9f639ef3d60463b02a61340556cd90` with `git diff --exit-code` exit 0 and GREEN rebuilt:
the request recorded after the send failed both new cases; re-recording the request after an
accepted send failed only the sibling. The fixer reported one further false source comment,
"reads ... and nothing else" above `isConfirmedOffline`. Dispatch 26 (CR-05-CONTROLS-039, second
commit), same settings, owning the source and the R4 report: `aded73a1a83edeac05152628ef8c88cf1abb210c`
(`docs(controls): say which fact no refusal rule reads`) restates it and the `timers` JSDoc,
which `reconcile` contradicted; owner 105 tests, 0 failures; the checks above exited 0.
Coordinator check: two owned paths per commit; the non-comment source lines are unchanged since
the round-4 revision; the test diff of 040 changes one title and comments only;
`git status --porcelain` is empty.

Correction round 5: dispatch 27, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over both batch files at `5dd054efc3b9b5c89a336f9e4fd6c04b46a5209e` with the three
opening IDs and the 38 earlier fixed IDs. Terminal result: `05-CONTROLS-REVIEW-R5.md`, all three
confirmed fixed, 001 to 038 still fixed, none reopened, 1 new WARNING (042), `status:
issues_found`. Its typecheck, ESLint, build, owner (105 tests, 2 suites, 0 failures), pair command
and header tracer exited 0 on Node v26.12.0; no edit, no commit. Coordinator triage: opening 3,
fixed 3, rejected 0, new 1, reopened 0, closing 1, `continue`. The `deviceId`-in-logs observation
is recorded for the maintainer.

Dispatch 28 (CR-05-CONTROLS-042): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning `src/accessories/controls.ts` and the R5 report. Terminal result: commit
`3bda5909998f49e5606a31b10febd7737d9e53ec` (`docs(controls): limit the agreement claim to the
reported value`), two owned paths, JSDoc lines only: no row reads the transport fact, one failed
poll clears it without withdrawing a row's trust, and the agreement claim is limited to
`reported`. Guard, build, owner (105 tests, 2 suites, 0 failures), pair coverage, ESLint,
typecheck and `fallow audit --base 4c143eb` (verdict pass) exited 0 on Node v26.12.0.
Coordinator check: two owned paths; the non-comment source lines are unchanged since the round-5
revision; `git status --porcelain` is empty.

Correction round 6: dispatch 29, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over both batch files at `bab42433952af1ffc3f83653537f78d1e8bdde40` with the opening
ID and the 41 earlier fixed IDs. Terminal result: `05-CONTROLS-REVIEW-R6.md`, 042 confirmed fixed,
001 to 041 still fixed, none reopened, 1 new WARNING (043), `status: issues_found`. Its typecheck,
ESLint, build, owner (105 tests, 2 suites, 0 failures), pair command and header tracer exited 0 on
Node v26.12.0; no edit, no commit. Coordinator triage: opening 1, fixed 1, rejected 0, new 1,
reopened 0, closing 1, so `STOP: no progress` (D-03, D-18); lead S-05-24 added for ACCESSORY. The
row, the lead and the report stayed uncommitted, nothing else ran, and the blocking report named
043 with the counts. The maintainer chose "Resolve and continue" on 2026-10-17; the cell now reads
`STOP: no progress; resolved by maintainer`.

Dispatch 30 (CR-05-CONTROLS-043): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning `src/accessories/controls.ts` and the R6 report. Terminal result: commit
`af70160a2f6202e8b9ae552890faebd24df0921d` (`docs(controls): name the publish pass the binder
attaches through`), two owned paths, JSDoc lines only. The overview now names `ensureService`
(a restored Switch or one just added). Two more cross-module claims the code contradicted were
restated: "every caller uses `publishValue`" now covers writers of `On`, and "this plugin publishes
nothing until the first REST inventory" now says no binder exists before then. Every other
cross-module claim in the overview and the exported JSDoc was checked against its call sites and
kept. Guard, build, owner (105 tests, 2 suites, 0 failures), pair coverage, ESLint, typecheck and
`fallow audit --base 4c143eb` (verdict pass) exited 0 on Node v26.12.0. Coordinator check: two
owned paths; the non-comment source lines are unchanged since the round-6 revision;
`git status --porcelain` is empty.

Correction round 7: dispatch 31, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over both batch files at `09727ef76427811f8773b47345046c85ce41d657` with the opening
ID and the 42 earlier fixed IDs. Terminal result: `05-CONTROLS-REVIEW-R7.md`, 043 confirmed fixed,
001 to 042 still fixed, none reopened, 1 new WARNING (044), `status: issues_found`. Its typecheck,
ESLint, build, owner (105 tests, 2 suites, 0 failures), pair command and header tracer exited 0 on
Node v26.12.0; one read-only probe; no edit, no commit. Coordinator triage: opening 1, fixed 1,
rejected 0, new 1, reopened 0, closing 1, so `STOP: no progress` (D-03, D-18); lead S-05-25 added
for ACCESSORY. The row, the lead and the report stayed uncommitted, nothing else ran, and the
blocking report named 044 with the counts. The maintainer chose "Resolve and continue" on
2026-10-17; the cell now reads `STOP: no progress; resolved by maintainer`.

Dispatch 32 (CR-05-CONTROLS-044 with the comment-claims audit): role `gsd-code-fixer`, model
omitted, effort `high`, foreground, owning the pair (comment lines only) and the R7 report.
Terminal result: two comment-only commits, `dda7a47927b8721e02989fb5df7ece71423add7a` (the 044
fix and 21 more false source claims) and `52f33bf519d45b0933310a3f6a12a601b9a34f4a` (9 false test
claims). The audit lists every claim of both files with its evidence in the R7 report's
`## Comment claims audit`: 136 source rows (89 true, 22 false, 25 rationale) and 54 test rows (42
true, 9 false, 3 rationale). Three HAP claims were checked with a read-only probe of the pinned
`@homebridge/hap-nodejs` 2.2.2 outside the repository. The owner keeps 105 tests in 2 suites with 0
failures; guard, build, pair coverage, ESLint, typecheck and `fallow audit --base 4c143eb`
(verdict pass) exited 0 after each commit on Node v26.12.0; the first commit attempt failed
gitlint on a 74-character title, so no commit happened and the shorter title was committed
without `--amend`. Coordinator check: two owned paths per commit; the non-comment lines of both
files are unchanged since the round-7 revision; `git status --porcelain` is empty.

Correction round 8: dispatch 33, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over both batch files at `47b0cb1e8e95c0cbe796825142e92b3bc91e151e` with the opening
ID and the 43 earlier fixed IDs. Terminal result: `05-CONTROLS-REVIEW-R8.md`, 044 confirmed fixed,
the R7 audit's results confirmed, 001 to 043 still fixed, none reopened, 1 new WARNING (045),
`status: issues_found`. Its typecheck, ESLint, build, owner (105 tests, 2 suites, 0 failures),
pair command and header tracer exited 0 on Node v26.12.0; one read-only probe of the pinned HAP
package; no edit, no commit. Coordinator triage: opening 1, fixed 1, rejected 0, new 1, reopened 0,
closing 1, so `STOP: no progress` (D-03, D-18); lead S-05-25 widened. The row, the lead change and
the report stayed uncommitted, nothing else ran, and the blocking report named 045 with the counts.
The maintainer chose "Resolve and continue" on 2026-10-17; the cell now reads `STOP: no progress;
resolved by maintainer`.

Dispatch 34 (CR-05-CONTROLS-045 with the clause-level audit): role `gsd-code-fixer`, model
omitted, effort `high`, foreground, owning the pair (comment lines only) and the R8 report.
Terminal result: one comment-only commit, `23ebcc1759b90c4d324b10414aeeb473b220b19c`
(`docs(controls): drop comment clauses the code does not support`): the 045 clause and 7 more
false source clauses dropped or narrowed. The R8 report's `## Clause-level comment audit` lists
280 source clauses (212 true, 8 false, 60 rationale) and 112 test clauses (102 true, 0 false, 10
rationale) with their evidence. The owner keeps 105 tests in 2 suites with 0 failures; guard,
build, pair coverage, ESLint, typecheck and `fallow audit --base 4c143eb` (verdict pass) exited 0
on Node v26.12.0. Coordinator check: two owned paths; the non-comment lines of both files are
unchanged since the round-8 revision; `git status --porcelain` is empty.

Correction round 9: dispatch 35, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over both batch files at `3f5fefeb92bf57132da4d03909956691528882e8` with the opening
ID and the 44 earlier fixed IDs. Terminal result: `05-CONTROLS-REVIEW-R9.md`, 045 confirmed
fixed, the clause-level audit's results confirmed, 001 to 044 still fixed, none reopened, no new
finding, `status: clean`. Its typecheck, ESLint, build, owner (105 tests, 2 suites, 0 failures),
pair command and header tracer exited 0 on Node v26.12.0; no edit, no commit. Coordinator triage:
opening 1, fixed 1, rejected 0, new 0, reopened 0, closing 0, `clean`. The batch closes at
correction round 9. Lead S-05-24 widened; the `serviceCatalogue.ts:537-538` claim is recorded for
the phase verifier.

#### CONTROLS closure and wave gate (task 05-04-03)

- `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch CONTROLS`:
  exit 0, `ACCESSORIES_HEADERS_OK files=2`.
- `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --require-clean CONTROLS`:
  exit 0, `ACCESSORIES_LEDGER_TRACER_OK inventory=24 findings=97 open=0 rounds=22 clean=CONTROLS`.
- CONTROLS closed at correction round 9 with 45 findings fixed and none rejected: 11 BLOCKER and
  34 WARNING. Three were genuine production bugs fixed through RED-to-GREEN evidence (008, 009,
  033). The maintainer resolved four D-03 stops (rounds 4, 6, 7 and 8) with "Resolve and
  continue".

| Field | Value |
| --- | --- |
| Command | `npm run check` |
| Raw exit | 0 |
| HEAD | `7e9613198aa455876e6cbbd3e9c69b4e801fb0fd` (`git status --porcelain` empty before the run) |
| Runtime | Node v26.12.0, npm 11.20.0 |
| UTC start | 2026-10-17T23:51:56Z |
| UTC end | 2026-10-17T23:52:53Z |
| Static checks | passed typecheck (3.5 s); passed lint (2.7 s); passed lint:workflows (0.4 s); passed fallow (3.5 s); passed format:check (0.9 s); passed test:corresponding (0.6 s) |
| Cucumber | 104 scenarios (104 passed); 1156 steps (1156 passed) |
| Coverage | `Merged LCOV: coverage/direct.lcov (43 pairs)` |

### 05-05

Resume check at 2026-10-17T23:56:25Z: Node v26.12.0, empty `git status --porcelain`, tracer
`ACCESSORIES_LEDGER_TRACER_OK inventory=24 findings=97 open=0 rounds=22` (exit 0), and no committed
`### 05-05` subsection, so the plan starts at task 05-05-01.

Batch base: `0c0930e890cb41e74d0d4e854ba45c41a31fea4a`.

RED header checks: `--headers --paths src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts`
printed `HEADER_VIOLATION src/accessories/pumpRecords.ts: 2 expected an empty line after the SPDX line`
and `HEADER_VIOLATION test/accessories/pumpRecords.test.ts: 1 expected "// SPDX-License-Identifier: MIT"`
(exit 1); `--headers --paths src/accessories/reconciliation.ts test/accessories/reconciliation.test.ts`
printed `ACCESSORIES_HEADERS_OK files=2` (exit 0); `--headers --paths src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts`
printed the same two violations for the staleMarking pair (exit 1). `node_modules/.bin/fallow guard`
on the six batch files: exit 0.

Roles: as for 05-04 (model `""`, profile `quality`, effort `high`, empty agent-skills for both
roles).

Dispatch 1 (round 0): role `gsd-code-reviewer`, model omitted, effort `high`, foreground, over
the six batch files at `0c0930e890cb41e74d0d4e854ba45c41a31fea4a` with the leads and the review
questions. Terminal result: `05-RECORDS-REVIEW.md`, 31 findings (10 BLOCKER, 21 WARNING),
`status: issues_found`. Its typecheck, ESLint, build, owners (pumpRecords 33, reconciliation 14,
staleMarking 18 tests, 0 failures) and the three pair commands exited 0 on Node v26.12.0. Its
probes were read-only runs of the compiled module, and its two impact commands for
`ReconciliationOptions` exited 0 with complete results; no edit, no commit. Coordinator triage
accepted all 31 as `open` and classified 001 and 002 as genuine bugs (D-04). The maintainer chose
on 2026-10-18 to fix both in this batch, 002 with one optional persisted member. S-05-03 was
rejected and S-05-07 confirmed as 013.

Dispatch 2 (CR-05-RECORDS-011): role `gsd-code-fixer`, model omitted, effort `high`, foreground,
owning the pumpRecords pair and the report. Terminal result: commit
`efdf57713b747a4a2b543754c498b070a0e050d1` (`style(pumpRecords): add the approved file headers`),
three owned paths, header lines only (the source gains 5 lines, the test 10; nothing below the
headers changed). The owner keeps 33 tests with 0 failures; guard, build, pair coverage, ESLint,
the header check (`ACCESSORIES_HEADERS_OK files=2`) and `fallow audit --base 0c0930e` (verdict
pass) exited 0 on Node v26.12.0. Coordinator check: three owned paths; no line deleted; the
review commit `fd62233` precedes it; the GREEN header check exits 0; `git status --porcelain` is
empty.

Dispatch 3 (CR-05-RECORDS-001, RED): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning only `test/accessories/pumpRecords.test.ts`. It added 'withholds the self-test
label from a watched backup run whose device timestamp has not arrived' at HEAD
`ec5093bdcfe094e2330ab3dc20defdae4865d9aa`, built, and ran the target alone: raw exit 1, tests 1,
fail 1, empty stderr, a `testCodeFailure` `ERR_ASSERTION` at its own `deepStrictEqual`, where the
label stays `true` at all four run observations. It committed nothing; the production blob stayed
`74771aee1e664afd2475d9870ced3d025f447294`. The coordinator wrote
`05-PUMP-RECORDS-RED-EVIDENCE.json` (`priorEvidence` empty); `check tdd-red-evidence --raw`
printed `RED_EVIDENCE_OK`; it was committed alone as `9701899ef2001050a8105698981e884d0d2d20a4`.

Dispatch 4 (CR-05-RECORDS-001, GREEN): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning the pumpRecords pair and the report. Terminal result: commit
`e93758edc4e8d61cc24aea4f979d2540e50bb490` (`fix(pumpRecords): withhold the self-test label from an
unlabelled run`), three owned paths. A counted backup activation (a watched edge, or a recovered
missed activation) removes the stored label. Classification is withheld while a counted run
waits for its timestamp or while the record holds no activation. The persisted keys, seeding,
absorption, the classification rule and every log line are unchanged. The test keeps the
regression case byte for byte and adds the P4 case. Its control (no-activation withholding
removed) failed only that case, restored to blob `fb9026b29d1c7fe5f341339734067da7531969fb`. One
existing case that earned a label with no activation now earns it from a recovered activation,
with the same title and assertions. Owner 35 tests, 0 failures; pair coverage, ESLint, typecheck,
the `basementGuardian` (157) and `serviceCatalogue` (212) owners, the whole Cucumber suite (104
scenarios, 1156 steps) and `fallow audit --base 0c0930e` (verdict pass) exited 0 on Node v26.12.0.
The fixer noted that the `lastActivationWasTestActivity` JSDoc in
`src/persistence/accessoryContext.ts` no longer covers the removal. Coordinator check: three
owned paths; the RED block is present verbatim; the evidence commit is its parent;
`grep -cE 'primaryPump\?:|backupPump\?:|watermarks\?:' src/accessories/pumpRecords.ts` prints 3;
`git status --porcelain` is empty.

CR-05-RECORDS-002 consumer edit, declared before the edit (D-06): both impact commands for
`src/persistence/accessoryContext.ts:ActivationWatermarks` exited 0 with empty stderr and
`status: complete`. With `tsconfig.json` they name `src/persistence/accessoryContext.ts` and
`src/accessories/pumpRecords.ts`; with `tsconfig.test.json` they also name
`test/persistence/accessoryContext.test.ts`, whose type-level checks an added optional member
leaves valid. Inventory row 25 declares `src/persistence/accessoryContext.ts` as an `adaptation`
of RECORDS with First round 1. The same file carries the label JSDoc that 001 changed the meaning
of, so its follow-up comment edit is covered by the same row.

Dispatch 5 (CR-05-RECORDS-002, RED): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning only `test/accessories/pumpRecords.test.ts`. It added 'counts a watched backup
run once across a restart before its device timestamp arrives' at HEAD
`cac84d994b6445c0c696ee6467b192814e667a8e`, built, and ran the target alone: raw exit 1, tests 1,
fail 1, empty stderr, a `testCodeFailure` `ERR_ASSERTION` at its own `deepStrictEqual` (actual
`activationCount: 2`, `lastActivationAt` on the device clock). It committed nothing; the
production blob stayed `fb9026b29d1c7fe5f341339734067da7531969fb`. The coordinator rewrote
`05-PUMP-RECORDS-RED-EVIDENCE.json` with the committed 001 record in `priorEvidence`; `check
tdd-red-evidence --raw` printed `RED_EVIDENCE_OK`; it was committed alone as
`fb0a1d115c0eb0ace8009157c12129a8776fff82`.

Dispatch 6 (CR-05-RECORDS-002 GREEN, and a CR-05-RECORDS-001 comment follow-up): role
`gsd-code-fixer`, model omitted, effort `high`, foreground, owning the pumpRecords pair,
`src/persistence/accessoryContext.ts` (adaptation row 25) and the report. Terminal result: commit
`5e753ca378e09eff936ac5b6e2f05138f3960949` (`fix(pumpRecords): remember a counted backup run across
a restart`, four owned paths). `ActivationWatermarks` gains the optional
`backupEdgeAwaitingTimestamp?: boolean`. The in-memory flag is gone. A watched edge sets the
member, seeding and absorption remove it, absorption and the classification withholding read it,
and `isActivationWatermarks` validates it. A damaged-record row covers the new branch. No
top-level context key changed. Commit `30a9895195227b38025b35d516101ec927d85a16`
(`docs(pumpRecords): say a counted backup run removes the stored label`, two paths) restates the
`lastActivationWasTestActivity` JSDoc for the 001 behavior, comment lines only. The re-run impact
commands matched the ledger. Owner 37 tests, 0 failures; pumpRecords and accessoryContext pairs,
ESLint, typecheck, the `basementGuardian` owner (157) and pair, the whole Cucumber suite (104
scenarios, 1156 steps) and `fallow audit --base 0c0930e` (verdict pass) exited 0 on Node v26.12.0.
Coordinator check: owned paths only; the RED block is present verbatim; the evidence commit is the
fix commit's parent; a fresh build, owner (37 tests, 0 failures) and pair command after the
commits exited 0; `git status --porcelain` is empty.

Dispatch 7 (CR-05-RECORDS-012, 031, 008, 009, 010, 028, 029, 030): role `gsd-code-fixer`, model
omitted, effort `high`, foreground, owning the staleMarking pair and the report. Terminal result:
eight commits, one per cause: `f23ca8d645c5fa398c4cbd03800f9b6bca1e0b03` (012, the pair's headers),
`c2875ee3919dad375b9411592227b8ab2fa16978` (031, the caller claims), `b47954b8140872902d0ae2b972f80d32d5fb22e8`
(008, both control Switches refuse), `7cb97fa3f0a559d5d78b03afb7a6a7668cb1dec5` (009, a status no
default gives), `62eec51a1fe5b748badc833e2505feefbaacd289` (010, the refusal is the control
module's), `9d8d06de670f6d632cdc9143d0a8c3be5b995a29` (028, one commented widening block),
`7a7e175e5cf8e1321e6aeb4827972bfd7a9b23b6` (029, an awaited read) and
`7f52a7882711bbaeb0c55d3eeb8975852fff9217` (030, block-bodied no-op stubs). The owner went 18 -> 19
tests with 0 failures; guard, build, pair coverage, ESLint, typecheck and `fallow audit --base
0c0930e` (verdict pass) exited 0 after each on Node v26.12.0. Controls, each restored to blob
`4c26ae9fa332ff0ba0c026bd4cb3e6aa5aa7aa10`: arming only the first control (008), ignoring the
status (009) and a local refusal with no push (010) each failed its case. Coordinator check: owned
paths only; the non-comment source lines are unchanged; `as unknown as` appears only inside the
widening block; `--headers --paths` on the pair prints `ACCESSORIES_HEADERS_OK files=2`;
`git status --porcelain` is empty.

The fixer also reported that `test/platform.test.ts` 'asks Homebridge to store the accessory whose
snapshot counted an activation, and no other' has failed since the CR-05-RECORDS-002 fix
`5e753ca`. Its expected watermarks lack the `backupEdgeAwaitingTimestamp: true` that the fix now
stores. The 002 dispatch ran the `basementGuardian` and Cucumber consumers, but it did not run this
Phase 6 test. A fresh run of every unit module at this point shows that one failure among 1631
tests. Inventory row 26 declares `test/platform.test.ts` as a RECORDS adaptation (First round 1)
before the bounded edit, which updates only that expectation.

Dispatch 8 (CR-05-RECORDS-002, consumer follow-up): role `gsd-code-fixer`, model omitted, effort
`high`, foreground, owning `test/platform.test.ts` (adaptation row 26) and the report. Terminal
result: commit `89fd670fb862fdc2fd684e3dc251839588754c2e` (`test(pumpRecords): expect the stored
awaiting mark in the platform case`), two owned paths. The one expected context of the accessory
that counted a watched backup run gains `backupEdgeAwaitingTimestamp: true`, and nothing else
changes. Before the edit, the case failed with only that member missing; after it, the platform
owner keeps 70 tests with 0 failures, its pair, ESLint and typecheck exit 0, and every unit module
passes (59 modules, 1631 tests, 0 failures). `fallow audit --base 0c0930e` reports verdict pass.
From here on, every production fix in this phase also runs every unit module, not only the named
consumers.

Dispatch 9 (CR-05-RECORDS-017, 018, 019, 020, 014): role `gsd-code-fixer`, model omitted, effort
`high`, foreground, owning `src/accessories/pumpRecords.ts`, `src/accessories/reconciliation.ts`
and the report. Terminal result: five comment-only commits, one per cause:
`805088b084882c496d01cbe527ec091ac4c8f241` (017, which stored times are milliseconds),
`514f78d657e7088fa9ad0a1332e298766d342a63` (018, recovered runs in the overview, and the
counted-run claim narrowed), `039c51d606debc570d799e08d6afa2ae0c4658ac` (019, the creation-time
warning), `3dda90283f25c8e377eb00e587970cbee8997400` (020, the baseline rule, and the
missed-activation claim narrowed) and `d16eaf50b8c0bc8cd918f0b444a4ac1b049cc151` (014, all three
reconciliation inputs; "HTTP 200" restated as any 2xx). Owners 37 and 14 tests, pairs, ESLint and
`fallow audit --base 0c0930e` (verdict pass) exited 0 after each on Node v26.12.0. The fixer
reported two things. The test comment at `test/accessories/pumpRecords.test.ts:216-219` still
gives 020's always-true reason; it goes to the pumpRecords test dispatch. And it noted a possible
behavior issue: first-timestamp seeding removes a pending awaiting mark, so a first timestamp older
than a watched edge would let that edge's own later timestamp count again. Correction round 1 will
judge it. Coordinator check: owned paths only; the non-comment lines of both sources are unchanged;
`git status --porcelain` is empty.

CR-05-RECORDS-013 (lead S-05-07) consumer edit, declared before the edit (D-06):
`fallow dead-code --type-aware --symbol-impact src/accessories/reconciliation.ts:ReconciliationOptions`
exited 0 with `status: complete` and empty stderr. With `tsconfig.json` it names only
`reconciliation.ts`; with `tsconfig.test.json` it also names `test/accessories/reconciliation.test.ts`.
No production module names the type. Because `src/runtime/accountRuntime.ts` passes an object
literal to `createReconciliation`, the coordinator also ran the same command on
`src/accessories/reconciliation.ts:createReconciliation`. It exited 0 with `status: complete` and
empty stderr. With `tsconfig.json` it names `reconciliation.ts` and `src/runtime/accountRuntime.ts`
as the only production consumer; with `tsconfig.test.json` it adds
`test/accessories/reconciliation.test.ts`. Inventory row 27 declares `src/runtime/accountRuntime.ts`
as a RECORDS adaptation (First round 1). `test/runtime/accountRuntime.test.ts` does not call
`createReconciliation` and stays unchanged. This edit does not reopen Phase 4's closed ACCOUNT
counter (D-10).

Dispatch 10 (CR-05-RECORDS-013, 007, 015, 016): role `gsd-code-fixer`, model omitted, effort
`high`, foreground, owning the reconciliation pair, `src/runtime/accountRuntime.ts` (adaptation row
27, 013 only) and the report. Terminal result: four commits, one per cause:
`5ecfdfe67102d1f25c99ce47976e2f57b1c7cbab` (013, `refactor(reconciliation): drop the unread clock
option`: the `clock` member and its import are gone, and the one `createReconciliation` call in
the runtime passes `{ log: options.log }`; the re-run impact commands matched the ledger;
accountRuntime owner 169 tests and pair, and every unit module, 1631 tests with 0 failures),
`3a30620b0609b2c10efbbc6884b4650c13e4af8a` (007: the forget case confirms a returned deviceId
afresh; its control, a `forget` that keeps a tombstone, failed only that case, restored to blob
`532a0ea5a1455d2189511a7eb27162e7bd5cbbd1`), `70d97fcee2e43cd08427d8fb53c966f362959214` (015: a
pure move under `describe('forget')`; D-10 cites CR-04-ACCOUNT-021) and
`7e1eb2ba8b0f39dfcd6a14591c5e9f28a6bbf73e` (016: the duplicate empty-list case removed; the
unchanged 'reports a deviceId confirmed absent on its second consecutive absence' keeps its
protection, P-05-03). The owner went 14 -> 13 tests with 0 failures; pair coverage, ESLint,
typecheck and `fallow audit --base 0c0930e` (verdict pass) exited 0 after each on Node v26.12.0.
Coordinator check: owned paths only; `git diff 0c0930e..HEAD -- src/runtime/accountRuntime.ts`
changes only the `createReconciliation` call; `test/runtime/accountRuntime.test.ts` is unchanged;
`git status --porcelain` is empty.

Dispatch 11 (CR-05-RECORDS-003, 004, 005, 006): role `gsd-code-fixer`, model omitted, effort
`high`, foreground, owning the pumpRecords test and the report. Terminal result: four test-only
commits: `8036ef652bb930304b3a61bae2a5dd2e5e6bda53` (003: the stored watermark and the write after
an absorbed and a recovered timestamp), `aa640ad55ca16543cab37b758595cf70ca3e8f22` (004: one row
per self-test label check, each failing only for its own check),
`644ef35f4e917b9ca575c8525b69dc1fef084ad7` (005: a watermark-only classification change asks for a
write) and `34451dd60d46a94a99d440237f48a4e8ffea5200` (006: the exact unreadable-record line, and
an identifier context the line must not quote). The owner went 37 -> 40 tests with 0 failures;
guard, build, pair coverage, ESLint, typecheck and `fallow audit --base 0c0930e` (verdict pass)
exited 0 after each on Node v26.12.0. Controls, each restored to blob
`3596f5faa51ade3fb985150a67d96fe1c0e8e3bb`, failed their intended cases: an absorb or a recovery
that does not move the watermark or ask for a write (003); each label check removed in turn (004);
change detection that ignores the watermark (005); a different, a second, or an identifier-quoting
warning line (006). Coordinator check: two owned paths per commit; no `src` change;
`git status --porcelain` is empty.

Dispatch 12 (CR-05-RECORDS-020 test half, 021 to 027): role `gsd-code-fixer`, model omitted,
effort `high`, foreground, owning the pumpRecords test and the report. Terminal result: eight
test-only commits: `3bed8d8058f7c6cd0007a38362d9b63a3f76d0a0` (020, the baseline case comment),
`aee539bf578a6b59052ec297f0c77490436d01d9` (021), `6a6311952f867efc5b077612beb4abd21df8eac4` (022;
the staleMarking half had gone with `7cb97fa`), `5e50e263d096be1fefc0cdd7dcdaefd12506af9a` (023, one
`assert.throws` case per getter with the full message), `a85b94037b2ed968721abfd1ff128d7558d70305`
(024, a named row interface; inferred label arrays, because the project lint forbids both
`Array<T>` and `ReadonlyArray<T>`), `8afc2b9a95920507df808ceb417109f30e165cda` (025, row
factories), `69a609c04257842a92021c41021b46a78c4b384b` (026, `satisfies` on all twelve partial
literals) and `8f6cb8d52373115b744bd30694128e00defd75f6` (027, nested function declarations). The
owner went 40 -> 41 tests with 0 failures; guard, build, pair coverage, ESLint, typecheck and
`fallow audit --base 0c0930e` (verdict pass) exited 0 after each on Node v26.12.0. 027's second
site, `const noop` in `test/accessories/staleMarking.test.ts`, is outside this dispatch's paths and
goes to the next one. Coordinator check: two owned paths per commit; no `src` change;
`git status --porcelain` is empty.

Dispatch 13 (CR-05-RECORDS-027, staleMarking site): role `gsd-code-fixer`, model omitted, effort
`high`, foreground, owning the staleMarking test and the report. Terminal result: commit
`5abd852e7b42e492821ebb3bdbbab3334bb9b75c` (`test(staleMarking): declare the silent log no-op as a
function`), two owned paths; the owner keeps 19 tests with 0 failures; guard, build, pair
coverage, ESLint, typecheck and `fallow audit --base 0c0930e` (verdict pass) exited 0 on Node
v26.12.0. Coordinator check: two owned paths; `git status --porcelain` is empty.

Round-0 repairs complete. Fresh checks at `5abd852e7b42e492821ebb3bdbbab3334bb9b75c` on Node
v26.12.0: `npm run build:test` exit 0; the three owners together exit 0 (tests 73, suites 6, pass
73, fail 0: pumpRecords 41, reconciliation 13, staleMarking 19); `npm run test:coverage:direct --`
the pumpRecords, reconciliation, staleMarking, accountRuntime, accessoryContext and platform
sources exit 0 (each pair at 100% alone); every unit module exits 0 (tests 1634, fail 0). Every
round-0 finding has at least one fix commit.

Correction round 1: dispatch 14, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over the six core files and the three adaptation hunks at
`8e7a2463c53546cbd80f135ea2974b4ec8d85ef7` with the 31 opening IDs. Terminal result:
`05-RECORDS-REVIEW-R1.md`, all 31 confirmed fixed, none reopened, 6 new (032 and 033 BLOCKER,
034 to 037 WARNING), `status: issues_found`. Its typecheck, ESLint, build, the six owners (73 and
240 tests, 0 failures), the six pair commands and the header tracer exited 0 on Node v26.12.0; its
probes were read-only runs of the compiled module; no edit, no commit. Coordinator triage:
opening 31, fixed 31, rejected 1 (032, by the maintainer's decision on 2026-10-18 to keep the
first-timestamp trade-off), new 6, reopened 0, closing 5, `continue`.

Dispatch 15 (CR-05-RECORDS-033 to 037): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning the pumpRecords and staleMarking tests, the pumpRecords source and
`src/persistence/accessoryContext.ts` (comment lines only), and the R1 report. Terminal result:
six commits: `fab1c46109598a978faec5cfbc496667adb07768` (034 source half: the first-timestamp rule
stated as an assumption with both costs), `72ad42b6d3ff11b525189a7b4974115447aa8591` (037),
`5c16b8b8f174ef642ed136009d826603082df837` (033: a recovered run removes the stored label; its
control, the removal deleted from the recovery branch, failed the case, restored to blob
`1dca0e3162dd9d74e1baa63fc55d6cd13170bb55`), `3fc4be237e5290f6d26336cf85ab8c1ccf03600c` (034 test
half), `629dbd9ce2a0309b5283ec204b9f2bd12a00dff7` (035) and `f840798d1b37a9c5ec90265465447066b059b45f`
(036). Owners pumpRecords 42, accessoryContext 1 and staleMarking 19 tests with 0 failures; pairs,
ESLint, typecheck and `fallow audit --base 0c0930e` (verdict pass) exited 0 after each on Node
v26.12.0. Coordinator check: owned paths only; the non-comment lines of both sources are
unchanged since the round-1 revision; `git status --porcelain` is empty.

Correction round 2: dispatch 16, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over the six core files and the three adaptation hunks at
`07a232ebdcd768bc34ada8957753b90a8f498da4` with the five opening IDs. Terminal result:
`05-RECORDS-REVIEW-R2.md`, all five confirmed fixed, 001 to 031 still fixed, none reopened, 4 new
(038 and 039 BLOCKER, 040 and 041 WARNING), `status: issues_found`. Its checks exited 0 on Node
v26.12.0 (owners 74 and 240 tests, 0 failures); one read-only probe; no edit, no commit.
Coordinator triage: opening 5, fixed 5, rejected 0, new 4, reopened 0, closing 4, `continue`. 038 is
classified as a genuine bug within the 001 class.

Dispatch 17 (CR-05-RECORDS-038, RED): role `gsd-code-fixer`, model omitted, effort `high`,
foreground, owning only the pumpRecords test. It added 'reads a timestamp advance that arrives with
a backup edge as an earlier run' at HEAD `056264f19895c88e1ab1106573a97ebfa44e026e`, with expected
values worked out by hand from the fixed rule. It built and ran the target alone: raw exit 1,
tests 1, fail 1, empty stderr, a `testCodeFailure` `ERR_ASSERTION` at its own `deepStrictEqual`
(actual count 1, the awaiting mark cleared, and the running run labelled a self-test). It committed
nothing; the production blob stayed `1dca0e3162dd9d74e1baa63fc55d6cd13170bb55`. The coordinator
rewrote `05-PUMP-RECORDS-RED-EVIDENCE.json` with the committed 002 record in `priorEvidence`;
`check tdd-red-evidence --raw` printed `RED_EVIDENCE_OK`; it was committed alone as
`510505181800c6d3dda4144bccdc7b7fa17a0a39`.

Dispatch 18 (CR-05-RECORDS-038 GREEN, 040, 041, 039): role `gsd-code-fixer`, model omitted, effort
`high`, foreground, owning the pumpRecords pair, the staleMarking source (comment lines only) and
the R2 report. Terminal result: four commits: `700bd8cb4a5a213f513114afed990ad83b85d28e` (038:
`observe` reconciles the backup timestamp before it marks the edge; the regression case is byte
for byte the evidence patch; no existing case changed; owner 43, every unit module 1636 tests with 0
failures, the whole Cucumber suite 104 scenarios), `e3b71fe0da175297ec879d8961c0cfcfd1abf8f6` (040),
`a120892474028ff2369973b6e1f70c57b67b3c15` (041, and the nearby every-service claim) and
`6fbb9cac9f02762ddd836f2942dc949fe5855ee5` (039: one row per pump for a run whose running state
fails to decode for one snapshot; its control `reportedRunning ?? false` failed both rows,
restored to blob `55a94ab0d1a214a4b85a3d40cd6e55646f282833`). The owner ends at 45 tests with 0
failures; pairs, ESLint, typecheck and `fallow audit --base 0c0930e` (verdict pass) exited 0 after
each on Node v26.12.0. Coordinator check: owned paths only; the RED block is present verbatim; the
evidence commit is the fix commit's parent; the staleMarking source's non-comment lines are
unchanged; `git status --porcelain` is empty.

Correction round 3: dispatch 19, role `gsd-code-reviewer`, model omitted, effort `high`,
foreground, over the six core files and the three adaptation hunks at
`eb762e4774ea5e8203062d30fc759a0421243de5` with the four opening IDs. Terminal result:
`05-RECORDS-REVIEW-R3.md`, all four confirmed fixed, every earlier fixed ID still fixed, none
reopened, no new finding, `status: clean`. Its checks exited 0 on Node v26.12.0 (owners 77 and 240
tests, 0 failures; header tracer `ACCESSORIES_HEADERS_OK files=6`); one read-only probe; no edit,
no commit. Coordinator triage: opening 4, fixed 4, rejected 0, new 0, reopened 0, closing 0,
`clean`. The batch closes at correction round 3.

#### RECORDS closure and wave gate (task 05-05-03)

- `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --headers --batch RECORDS`:
  exit 0, `ACCESSORIES_HEADERS_OK files=9`.
- `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs --require-clean RECORDS`:
  exit 0, `ACCESSORIES_LEDGER_TRACER_OK inventory=27 findings=138 open=0 rounds=26 clean=RECORDS`.
- RECORDS closed at correction round 3 with 41 findings: 40 fixed and 1 rejected by the
  maintainer's decision (032): 13 BLOCKER and 27 WARNING fixed, 1 BLOCKER rejected. Three genuine
  bugs in pumpRecords were fixed through RED-to-GREEN evidence (001, 002, 038), and 002 needed one
  consumer follow-up in the platform test. The S-05-07 branch
  removed the unread `clock` option (D-06, adaptation row 27). Adaptation rows 25 and 26 cover the
  persisted awaiting mark and its platform-test expectation.

| Field | Value |
| --- | --- |
| Command | `npm run check` |
| Raw exit | 0 |
| HEAD | `c98babf44c810ceeea745a34021adf52260d5df9` (`git status --porcelain` empty before the run) |
| Runtime | Node v26.12.0, npm 11.20.0 |
| UTC start | 2026-10-18T03:30:27Z |
| UTC end | 2026-10-18T03:31:29Z |
| Static checks | passed typecheck (2.8 s); passed lint (10.1 s); passed lint:workflows (0.3 s); passed fallow (3.2 s); passed format:check (0.8 s); passed test:corresponding (0.6 s) |
| Cucumber | 104 scenarios (104 passed); 1156 steps (1156 passed) |
| Coverage | `Merged LCOV: coverage/direct.lcov (43 pairs)` |

### 05-06

Resume check at 2026-10-18T10:33:22Z: Node v26.12.0, empty `git status --porcelain`, tracer
`ACCESSORIES_LEDGER_TRACER_OK inventory=27 findings=138 open=0 rounds=26` (exit 0), and no committed
`### 05-06` subsection, so the plan starts at task 05-06-01.

Batch base (05-07 reuses it): `9cb164b1299249c2d2083ea81677c83e28e66916`. Accessory owner at the
base: `npm run build:test` exit 0; `node --test dist-test/test/accessories/basementGuardian.test.js`
exit 0, tests 157, suites 1, pass 157, fail 0.

RED header check: `--headers --batch ACCESSORY` printed
`HEADER_VIOLATION src/accessories/basementGuardian.ts: 2 expected an empty line after the SPDX line`
and `HEADER_VIOLATION test/accessories/basementGuardian.test.ts: 1 expected "// SPDX-License-Identifier: MIT"`
(exit 1). `node_modules/.bin/fallow guard` on both batch files: exit 0. `grep -n 'as unknown as'`
lists the commented `HAP_NAMESPACE` widening at test line 178 and seven inline casts at 480, 646,
676, 746, 813, 1278 and 1279.

Roles: as for 05-04 (model `""`, profile `quality`, effort `high`, empty agent-skills for both
roles).

Dispatch 1 (round 0): role `gsd-code-reviewer`, model omitted, effort `high`, foreground, over
both batch files at `9cb164b1299249c2d2083ea81677c83e28e66916`, with all 1,066 source lines and
all 3,456 test lines read in full, the six leads and the review questions. Terminal result:
`05-ACCESSORY-REVIEW.md`, 29 findings (7 BLOCKER, 22 WARNING), `status: issues_found`. Its
typecheck, ESLint, build, owner (157 tests, 1 suite, 0 failures), pair command and guard exited 0
on Node v26.12.0; the header tracer exited 1 with the two expected violations (009). Its probes
were read-only runs of the compiled modules; no edit, no commit. Coordinator triage accepted all
29 as `open`: 05-06 takes 001, 002, 003, 009, 011, 012 and 028, and 05-07 takes the rest. 002 and
003 are classified as genuine bugs (D-04). 001 is a D-04 candidate whose fix edits the closed
CONTROLS module. The maintainer paused the session before deciding it.

#### Resume point

Paused 2026-10-18 at the maintainer's request (`/gsd-pause`), at resume point (a).

- Batch: ACCESSORY (plans 05-06 and 05-07; batch base `9cb164b1299249c2d2083ea81677c83e28e66916`).
- Last committed round: round 0, `05-ACCESSORY-REVIEW.md`, result `initial`, committed in
  `79108d4e83157e51b50973caf50c431d7d23d863`.
- Open IDs: CR-05-ACCESSORY-001 to 029 (7 BLOCKER, 22 WARNING). Open IDs with fix commits: none.
- Owning plan: 05-06 takes 001, 002, 003, 009, 011, 012 and 028; 05-07 takes the rest.
- Waiting on the maintainer: whether CR-05-ACCESSORY-001 is fixed now or deferred. The fix edits
  `src/accessories/controls.ts`, the closed CONTROLS batch. The binder would keep the pre-press
  value, and expiry would push `reported() ?? that value`.
- Next step on resume: ask that decision, then continue task 05-06-01 with the pair-header fixer for
  009 (`style(basementGuardian): add the approved file headers`). Then task 05-06-02: the comment
  and style causes 011, 012 and 028, the D-04 sequences for 002 and 003 with
  `05-BASEMENT-GUARDIAN-RED-EVIDENCE.json`, and 001 as decided. Then the 05-06 gate.

Resumed 2026-10-18. The maintainer decided to fix CR-05-ACCESSORY-001 now: the binder keeps the
value HAP served before an accepted press, and expiry pushes `reported() ?? that value`. This is a
bounded edit to `src/accessories/controls.ts`; the ACCESSORY correction rounds review that hunk as
a reference. Next step: the pair-header fixer for CR-05-ACCESSORY-009.

#### Source repairs and wave gate

All seven 05-06 findings have repair commits in the findings table: 009 (pair headers), 011 and
012 (source comments), 028 (local snapshot-source type), and the genuine bugs 002, 003 and 001.
The RED evidence commits for 002, 003 and 001 are respectively `b025898`, `e8af5d2` and
`41b2ba7`, preceding fixes `7bc27047c0dac3369b2e5ff76f025339c1297b63`,
`667601c4ba3433061b13864b0801aa10a71efa76` and
`a6cbebfacdf8bf0928b2ca7fe0f30cc5cd9811f4`. The evidence classifier returned
`RED_EVIDENCE_OK` (exit 0). The 001 repair used the committed bounded controls amendments
`6bc5ce7` and `fdea7de`; the 003 repair used the committed Cucumber consumer amendment
`c3c0f28`. Each source repair passed its owner and direct pair checks, Fallow audit against the
batch base, pre-commit, and the normal commit hook.

Fresh committed-tree gate at HEAD `37259fc636a7c80cf4ff2557e68b750d7b72615d`, Node
v26.12.0 and npm 11.20.0:

| Command | UTC start | UTC end | Raw exit | Printed result |
| --- | --- | --- | --- | --- |
| `npm run build:test` | 2026-10-18T11:54:49.127374Z | 2026-10-18T11:54:52.387501Z | 0 | build succeeded |
| `node --test dist-test/test/accessories/basementGuardian.test.js` | 2026-10-18T11:54:52.387706Z | 2026-10-18T11:54:52.841736Z | 0 | 160 tests, 160 passed, 0 failed |
| `npm run test:coverage:direct -- src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` | 2026-10-18T11:54:52.841893Z | 2026-10-18T11:54:56.877226Z | 0 | accessory pair at 100% direct coverage |
| `npm run check` (sandbox) | 2026-10-18T11:55:04.423209Z | 2026-10-18T11:55:36.809403Z | 1 | package inspection's `npm pack --dry-run --json` received EPERM on the home npm cache |
| `npm run check` (host-resource rerun) | 2026-10-18T11:55:47.326111Z | 2026-10-18T11:56:44.876680Z | 0 | typecheck, lint, workflow lint, Fallow, format and corresponding checks passed; 104 scenarios passed, 1156 steps passed; merged LCOV from 43 direct pairs |

After the gate, the ledger tracer printed `ACCESSORIES_LEDGER_TRACER_OK inventory=27 findings=167
open=29 rounds=27` (exit 0) and the header tracer printed `ACCESSORIES_HEADERS_OK files=2`
(exit 0). ACCESSORY still has exactly one counter row, round 0. All 29 findings retain disposition
`open` until the 05-07 correction review. The 22 IDs handed to 05-07 are
CR-05-ACCESSORY-004 through 008, 010, 013 through 027, and 029. The source-side IDs 001, 002,
003, 009, 011, 012 and 028 have fix commits; 05-07 reviews those repairs and closes or reopens them.

### 05-07

Plan start at HEAD `65e0faf4b096cc18b5fb6e4774ad737443654c7f` on 2026-10-18,
with an empty `git status --porcelain` and Node v26.12.0. The ACCESSORY counter still has only
round 0, and CR-05-ACCESSORY-016 is `open`. Owner command
`node --test dist-test/test/accessories/basementGuardian.test.js` exits 0: 160 tests, 160 passed,
0 failed. `node_modules/.bin/fallow guard` on the source and test pair exits 0. The ledger tracer
exits 0 (`ACCESSORIES_LEDGER_TRACER_OK inventory=27 findings=167 open=29 rounds=27`).

RED `rg -n 'as unknown as' test/accessories/basementGuardian.test.ts` prints lines 189
(`HAP_NAMESPACE`), 194 (an `asPlatformAccessory` helper already added with the 05-06 repair for
002), and seven inline call-site casts at 497, 663, 693, 763, 830, 1350 and 1351. The 05-07
D-11 repair will move or retain the existing helper inside one commented widening block, add the
other two helpers there and replace the seven inline casts. The target is four cast lines, all in
that block, with the owner count still 160.

All 22 findings assigned to 05-07 now have fix hashes; with the seven from 05-06, all 29
ACCESSORY rows have at least one fix commit. They remain `open` until independent correction
review. Test-side fixes removed helper-only and weaker source-text cases only after the report
named their remaining protection. The 010 wrapper commit `34b3f3a44c078a75a23f77bffa8934b3c9101a42`
was last: its whitespace-ignored diff has only the wrapper, orphan import and three approved
formatter layouts, and the owner count stayed 153. The bounded amendments `dac8cb5`, `a7d2d9a`
and `92947e2` preceded their dependent edits.

Fresh pre-round checks on committed HEAD `a99b217390db112abb5d9c7e544de11681310039`, Node
v26.12.0 (all raw exits 0):

| Command | UTC start | UTC end | Printed result |
| --- | --- | --- | --- |
| `npm run build:test` | 2026-10-18T12:50:28.573732Z | 2026-10-18T12:50:32.007995Z | build passed |
| `node --test dist-test/test/accessories/basementGuardian.test.js` | 2026-10-18T12:50:32.008394Z | 2026-10-18T12:50:32.409590Z | 153 tests, 153 passed, 0 failed |
| `npm run test:coverage:direct -- src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` | 2026-10-18T12:50:32.410095Z | 2026-10-18T12:50:36.914640Z | direct pair at 100% |

The ledger tracer exits 0 before correction review, with the ACCESSORY counter still at round 0.

Round-1 repairs are committed through `d3815f99f53f324b326305ed7d56fa23255fc610`.
The 017 HAP source checks moved to the existing GATES owner under the bounded 05-07
amendment; its inventory batch remains GATES. On this clean HEAD, fresh pre-round-2 checks
completed by 2026-10-18T13:11:52Z with Node v26.12.0: `npm run build:test` exited 0;
`node --test dist-test/test/accessories/basementGuardian.test.js` exited 0 with 144 tests,
144 passed and 0 failed; `npm run test:coverage:direct -- src/accessories/basementGuardian.ts
test/accessories/basementGuardian.test.ts` exited 0 with the direct pair at 100%. All five
round-1 open IDs have repair hashes and remain `open` until independent round-2 review.

Round-2's sole open ID 033 has RED evidence commit `8fc2983` and repair commit `4f09add`,
recorded through clean HEAD `0497cfbb06a081822cec68f8797d3ca48a6ba149`. Fresh
pre-round-3 checks completed by 2026-10-18T13:23:41Z with Node v26.12.0: `npm run build:test`
exited 0; `node --test dist-test/test/accessories/basementGuardian.test.js` exited 0 with
145 tests, 145 passed and 0 failed; `npm run test:coverage:direct --
src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` exited 0 with
the direct pair at 100%. ID 033 remains `open` pending independent round-3 review.

After the maintainer-authorized round-3 continuation, ID 034 has RED evidence commit
`b0ffac0` and repair commit `8cbfe7a`, recorded through clean HEAD
`2c279259f6af69e07cd8f731aa6e7a59f19d94ab`. Fresh pre-round-4 checks completed by
2026-10-18T13:38:20Z with Node v26.12.0: `npm run build:test` exited 0;
`node --test dist-test/test/accessories/basementGuardian.test.js` exited 0 with 148 tests,
148 passed and 0 failed; `npm run test:coverage:direct -- src/accessories/basementGuardian.ts
test/accessories/basementGuardian.test.ts` exited 0 with the direct pair at 100%. ID 034
remains `open` pending independent round-4 review.

Round 4 closed ACCESSORY with opening 1, fixed 1, new 0, reopened 0 and closing 0. On clean
committed HEAD `448b0d42f58f35d509f1c5a987165f46caca56b7`, Node v26.12.0 and npm
11.20.0, `05-ledger-tracer.mjs --require-clean ACCESSORY` exited 0 with `clean=ACCESSORY`,
and `05-ledger-tracer.mjs --headers --batch ACCESSORY` exited 0 with `files=2`.
`npm run check` with a writable temporary npm cache and host permission started at
2026-10-18T13:48:07Z, ended at 2026-10-18T13:49:04Z and exited 0. Its printed result was
104 scenarios passed, 1,156 steps passed, and `Merged LCOV: coverage/direct.lcov (43 pairs)`.
The first sandboxed attempt could not bind Cucumber's local `127.0.0.1` fake-cloud listeners
(`listen EPERM`); the host-permission run above is the passing full gate.

### 05-08

Resume check at clean HEAD `379e86772fb2f353abbbe9c35dc3aa502bbb68f9` on
2026-10-18T13:51:44Z: `git status --porcelain` was empty, Node was v26.12.0, and the ledger
tracer exited 0 (`inventory=27 findings=172 open=0 rounds=31`). No committed `### 05-08`
record or GATES counter row existed. This HEAD is the GATES batch base. The four compiled gate
owners each exited 0: timerFreedom 3/3, hapImportScope 16/16, accessoryReadPathScope 5/5,
and hapWriteFidelity 18/18. Using the gates' own recursive `.ts` enumeration rule, the tree
has 43 files under `src`, 68 under `test`, 22 under `features`, and 10 under
`src/accessories`; the HAP gate's three roots contain 133 files in total. The RED header
tracer exited 1 and named each of the four gates at line 1 for its missing SPDX line.
`fallow guard` on all four gates exited 0.
