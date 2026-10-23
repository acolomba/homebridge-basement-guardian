---
phase: 07-cucumber-feature-conformance
plan: "02"
subsystem: testing
tags: [cucumber, account, auth, review]
requires:
  - phase: 07-01
    provides: Phase 7 review baseline and protocol
provides:
  - Complete-file ACCOUNT review with three independently checked correction rounds
  - Focused ACCOUNT assertion, privacy, cache, and wording repairs
  - Exact STOP record with two unresolved FEAT-02 findings
affects: [cucumber-feature-conformance, FEAT-01, FEAT-02]
actuals:
  tokens: 6582
  tasks: 3
  commits: 16
plan_head_before: e3af8dda5294a5933b55c097e3d8e749ee70725a
plan_head_after: 7cc8b8cad5565e7aa307910b909620b5b899d012
tech-stack:
  added: []
  patterns: [complete-file independent review, one-cause repair commits, temporary negative controls]
key-files:
  created:
    - .planning/phases/07-cucumber-feature-conformance/07-ACCOUNT-REVIEW.md
    - .planning/phases/07-cucumber-feature-conformance/07-02-SUMMARY.md
  modified:
    - features/account/configuration.feature
    - features/account/sign-in.feature
    - features/step_definitions/account.steps.ts
    - features/step_definitions/configuration.steps.ts
key-decisions:
  - Narrow refusal and throttle scenario titles to observations that their steps prove; retain direct retry evidence in existing unit tests.
  - Stop after Round 3 because the positive open count remained two; leave the shared device-table parser to phase reconciliation.
requirements-completed: []
duration: 35min
completed: 2026-10-19
status: complete
---

# Phase 7 Plan 02: ACCOUNT complete-file review summary

Four ACCOUNT files received full independent review and focused repairs. Round 3 ended at the required STOP with two open findings.

## Results

- The reviewer read all four files from line 1 to the final line at the recorded commit and blob in each round. See [07-ACCOUNT-REVIEW.md](./07-ACCOUNT-REVIEW.md) for spans, stable IDs, and evidence.
- The bounded counts were **8 → 6 → 2 → 2**. Round 3 fixed 013 and 014, found 015 and 016, and reopened none. The positive count did not fall, so no Round 4 or further ACCOUNT repair was dispatched.
- **CR-07-ACCOUNT-015 (BLOCKER, open):** the refusal scenario seeds a foreign-account cache. Cache deletion on account mismatch could hide missing deletion on HTTP 403.
- **CR-07-ACCOUNT-016 (WARNING, open):** the sign-in device table uses camelCase `deviceId` instead of the required lower-case words. Its parser is in the shared, unowned `shadow.steps.ts`.
- No production file changed. These findings concern scenario evidence and wording; no production bug or active production RED/GREEN pair was claimed.

## Verification

- Final source revision `29f0d02`: `npm run test:cucumber` passed **104/104 scenarios, 1,162/1,162 steps** on Node v26.12.0. The scenario count stayed at 104. Six added steps are accounted for in the batch report.
- Compiled default-profile `cucumber-js --dry-run --format usage` exited 0 with no unused, undefined, or ambiguous step bindings. It printed a non-failing `MaxListenersExceededWarning`.
- Named cloud-auth and runtime tests for refusal stop and throttle delay passed 2/2 each. The password-registration platform unit test passed 1/1. Temporary negative controls demonstrated the new assertions reject wrong cache, log, restart, and accessory results; each was removed before commit.
- Fallow audit and normal hooks passed for repair and report commits. The first hook attempt for `29f0d02` hit an unrelated temporary-directory `ENOTEMPTY` cleanup failure; its normal retry passed. The coordinator will run the full combined-wave `npm run check`.
- No real Cucumber profile or live vendor account ran.

## Commits

Task 1: `122fe44` recorded Round 0. Task 2: `40ea9a8`, `b7f7eaa`, `25fe450`, `5d4c5cb`, `7a37b78`, `5d6adcd`, `3cc1f2d`, `5402e64`, `431542a`, `9ee6d05`, `cc3e0e2`, `86ffd23`, `53bd4bb`, and `29f0d02` repaired one cause per commit. Task 3: `7cc8b8c` recorded the independent rounds and STOP. The measured ledger count before this summary commit is **16**.

## Deviations from Plan

The reviewed source revealed new accepted findings in each round. Repairs stayed within the four owned ACCOUNT paths. The exact nondecreasing-count STOP ended repairs with 015 and 016 open, as the plan allows. Refusal and throttle scenario titles were narrowed to their observed behavior; existing direct unit tests cover the timing behavior. No unlisted source or test was edited.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Next Phase Readiness

The phase coordinator has the exact open IDs and the shared-parser dependency for reconciliation. FEAT-02 is not claimed complete by this summary. The combined-wave full gate is pending coordinator execution.

## Self-Check: PASSED

Both plan records exist; `122fe44` and `7cc8b8c` are ancestors of HEAD. All four reviewed source paths exist. The final report commit deleted no tracked file. The remaining `placeholder-*` strings are synthetic Cucumber fixture values, not runtime stubs.
