---
phase: 05-accessories-conformance
batch: ACCESSORY
review_round: 4
reviewed: 2026-10-18T13:41:26Z
depth: deep
source_revision: 6218b62c55b7d18c0a1ae59c9f8455bf89f1e573
files_reviewed: 2
files_reviewed_list:
  - src/accessories/basementGuardian.ts
  - test/accessories/basementGuardian.test.ts
findings:
  blocker: 0
  warning: 0
  total: 0
status: clean
reviewer: gsd-code-reviewer (correction round 4)
---

# Phase 5 ACCESSORY batch: correction round 4

I read both batch files in full at the committed revision above, the Phase 5 context and review protocol, the ACCESSORY ledger and prior reports, and the authoritative TypeScript style, unit-test, and verification rules. I traced the connectivity receipt time through both `update()` branches, the monitoring transition, and the canonical snapshot store. The transferred HAP source checks were inspected only as context for 017. No source or test file was edited.

Opening: **1**. Confirmed fixed: **1**. Still open: **0**. Rejected: **0**. New: **0**. Reopened: **0**. Closing: **0** (`1 - 1 - 0 + 0 + 0`). The D-03/D-18 recommendation is **clean**. CR-05-ACCESSORY-034 is fixed, and no earlier fix reopened.

## Round status

| ID | Status at this revision | Evidence |
| --- | --- | --- |
| CR-05-ACCESSORY-001 | still fixed | Expiry restores the reported or held control value; the three withdrawal rows separately read it. |
| CR-05-ACCESSORY-002 | still fixed | The unresolved-family path rebinds restored control rows at source `:790-792`. |
| CR-05-ACCESSORY-003 | still fixed | The degradation warning at source `:819-823` does not claim AccessoryInformation stayed unchanged. |
| CR-05-ACCESSORY-004 | still fixed | The pending-window case reads the held value through poll and monitoring republishing, then expiry. |
| CR-05-ACCESSORY-005 | still fixed | Degradation tests compare complete warning arrays. |
| CR-05-ACCESSORY-006 | still fixed | AccessoryInformation assertions cover manufacturer, model, serial number, and firmware revision. |
| CR-05-ACCESSORY-007 | still fixed | The expected trust-scope record is exhaustive at the type boundary and compared with the reported set. |
| CR-05-ACCESSORY-008 | still fixed | Name expectations use independent descriptors or literal names. |
| CR-05-ACCESSORY-009 | still fixed | Both file headers conform, as recorded below. |
| CR-05-ACCESSORY-010 | still fixed | The single-entrypoint owner has top-level cases and no `describe()` wrapper. |
| CR-05-ACCESSORY-011 | still fixed | The source overview and trust/publication comments describe current behavior. |
| CR-05-ACCESSORY-012 | still fixed | The cited source regions do not narrate removed code. |
| CR-05-ACCESSORY-013 | still fixed | The cited test comments describe current assertions. |
| CR-05-ACCESSORY-014 | still fixed | Battery, transport, deferral, and expiry comments agree with their cases. |
| CR-05-ACCESSORY-015 | still fixed | Test constants have no planning-artifact authorship citation. |
| CR-05-ACCESSORY-016 | still fixed | Four double assertions remain inside the documented widening block at test `:183-201`. |
| CR-05-ACCESSORY-017 | still fixed | The owner reads only its own source; the transferred checks remain in `hapImportScope.test.ts:213-259` and all 16 gate cases pass. |
| CR-05-ACCESSORY-018 | still fixed | The option type boundary is checked without enumerating option members. |
| CR-05-ACCESSORY-019 | still fixed | The removed helper-only deferral cases and `deferredTransition` did not return. |
| CR-05-ACCESSORY-020 | still fixed | Remaining `// act & assert` markers precede one throw assertion; multi-action cases use ordered phases. |
| CR-05-ACCESSORY-021 | still fixed | Throw-action and discarded-value callbacks use block bodies. |
| CR-05-ACCESSORY-022 | still fixed | Repeated expected arrays use `Array.from`. |
| CR-05-ACCESSORY-023 | still fixed | Both mains-power data rows create separate cases without branch selection. |
| CR-05-ACCESSORY-024 | still fixed | Command and persistence interactions use strict mocks and verification. |
| CR-05-ACCESSORY-025 | still fixed | `statusActiveReadOf` awaits the HAP read, and callers await it. |
| CR-05-ACCESSORY-026 | still fixed | Titles state behavior or durable requirements, not process IDs. |
| CR-05-ACCESSORY-027 | still fixed | Timer and sentinel names retain their production roles. |
| CR-05-ACCESSORY-028 | still fixed | `SnapshotSource` remains private to the source module. |
| CR-05-ACCESSORY-029 | still fixed | Original construction guard cases require exact `Error` class and complete text. |
| CR-05-ACCESSORY-030 | still fixed | Source `:902,905` excludes live updates from connectivity time; test `:3273-3292` pins the last REST receipt after a later live update. |
| CR-05-ACCESSORY-031 | still fixed | Wrong-type identity and invalid-threshold cases require exact class and diagnostic. |
| CR-05-ACCESSORY-032 | still fixed | Each expiry withdrawal row creates its own named case with fresh accessory, command mock, and timer. |
| CR-05-ACCESSORY-033 | still fixed | The unresolved-family branch records a successful REST receipt at source `:1005-1008`; test `:924-945` checks the complete later withdrawal. |
| CR-05-ACCESSORY-034 | **fixed** | Source `:901-909` records valid REST connectivity even while the previous REST-degraded flag is held; both update branches call it at `:1007,1027`. Test `:3294-3309` observes poll A, withdrawal, recovery poll B, recovery marking, and another withdrawal; it requires `lastTrustedAt: B`. Tests `:3311-3341` pin invalid connectivity and rejected credentials at A, while the prior live-update test remains green. |

## Findings

No new BLOCKER or WARNING findings. No fixed ID reopened.

## Coordinator triage

Accepted the clean result: opening 1, fixed 1, rejected 0, new 0, reopened 0, closing 0.
Finding 034 is fixed and no earlier ID reopened. D-03/D-18 result is `clean` at round 4.

## Seed and lead dispositions

The round-0 dispositions remain supported. S-05-02, S-05-06, S-05-17, S-05-24, and the ACCESSORY part of S-05-25 remain fixed. S-05-20 remains rejected for the recorded rule and caller reasons. The Phase 6 platform variants of S-05-25 remain outside this batch.

## Header inspection

| File | Result |
| --- | --- |
| `src/accessories/basementGuardian.ts` | Conforms: SPDX line 1, copyright block lines 3-5, overview block lines 7-40, imports from line 42. |
| `test/accessories/basementGuardian.test.ts` | Conforms: SPDX line 1, copyright block lines 3-5, overview block lines 7-10, imports from line 12. |

## Toolchain evidence

At HEAD `6218b62c55b7d18c0a1ae59c9f8455bf89f1e573`, `node --version` printed `v26.12.0`. The worktree was clean before this report was written. Commands used the required `/opt/homebrew/opt/node/bin` PATH prefix. These focused checks do not constitute the full project gate.

| Command | Raw exit | Observation |
| --- | --- | --- |
| `npm run typecheck` | 0 | Source and test TypeScript projects passed. |
| `npm run build:test` | 0 | Rebuilt `dist-test` at this revision. |
| `node --test dist-test/test/accessories/basementGuardian.test.js` | 0 | 148 tests, 148 passed, 0 failed, 0 skipped. |
| `npm run test:coverage:direct -- src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` | 0 | The direct pair selector passed its isolated 100% line, function, and branch threshold. |
| `node_modules/.bin/eslint src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts --max-warnings=0` | 0 | Fresh invocation without `--cache`; no warnings or errors. |
| `node --test dist-test/test/accessories/hapImportScope.test.js` | 0 | All 16 gate cases passed, including the moved checks for 017. |
| `npm_config_cache=/private/tmp/guardian-npm-cache npm run test:unpaired` | 0 | Unpaired suite passed with a writable temporary npm cache. |

## Out-of-scope observations

`test/accessories/hapImportScope.test.ts` retains the checks transferred for 017 and belongs to the GATES batch's full review. The canonical snapshot store in `src/device/state.ts` and the runtime's poll and monitoring order were read for the connectivity cause, not added to this batch. The HAP stand-in under `features/lib/hap.ts` belongs to Phase 7, and the missing-device and missing-snapshot restored-refusal variants in `src/platform.ts` remain Phase 6 observations from round 0. No ID is assigned to these paths.
