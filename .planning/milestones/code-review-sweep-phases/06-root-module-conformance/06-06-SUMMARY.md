---
phase: 06-root-module-conformance
plan: "06"
subsystem: platform-review
tags: [platform, homebridge, trust, code-review]
requires:
  - phase: 06-root-module-conformance
    provides: Committed PLATFORM round-zero findings from plan 06-05
provides:
  - Atomic repairs for eight initial PLATFORM causes
  - Independent complete-file correction round one with four open IDs
  - Passing combined full check on the repaired owner pair
affects: [06-root-module-conformance, ROOT-01, platform]
tech-stack:
  added: []
  patterns: [cause-level RED and GREEN evidence, independent complete-file correction review]
key-files:
  created:
    - .planning/phases/06-root-module-conformance/06-PLATFORM-RED-EVIDENCE.json
    - .planning/phases/06-root-module-conformance/06-06-SUMMARY.md
  modified:
    - src/platform.ts
    - test/platform.test.ts
    - .planning/phases/06-root-module-conformance/06-PLATFORM-REVIEW.md
    - .planning/phases/06-root-module-conformance/06-FINDINGS.md
key-decisions:
  - "Keep CR-06-PLATFORM-003 open because the shutdown tests do not reach the default poll timer."
  - "Accept distinct safety and persistence causes CR-06-PLATFORM-012 through 014 for the next bounded round."
requirements-completed: []
completed: 2026-10-19
status: complete
---

# Phase 6 Plan 06: PLATFORM initial repairs and correction round one

**Seven initial causes were verified fixed; CR-06-PLATFORM-003 and three new causes remain open.**

## Repairs

CR-06-PLATFORM-001 has active RED evidence at `08b97e9` against unchanged source and a GREEN source/test fix at `37e2fb7`. The platform now continues live trust publication and cached unreadable marking after a failing accessory. The owner regression checks a healthy neighbor and shutdown completion. Earlier evidence-only corrections are preserved in Git history.

Test-only repairs were committed separately: 002 `647ff47` checks the complete synthetic token cache record; 003 `2e60f69` adds shutdown timing checks but remains incomplete; 004 `b7e4670` checks two devices after each failed poll; 005 `7389501` checks both restored trust services; 006 `59ff8f0` checks both restored controls; 007 `38c8a77` requires the fourth, final inventory response before removal; and 008 `47bf976` converts three named local arrows to function declarations. Each assertion repair used a temporary wrong-behavior control, restored its bytes, passed its named owner, and received a separate ledger commit. No control mutation was committed.

## Independent correction review

The `gsd-code-reviewer` read all of `src/platform.ts@7558443` lines 1–681 and `test/platform.test.ts@7558443` lines 1–3999 at a clean executable revision. The report and ledger are committed at `19255e5`. Round one reconciles opening 8, fixed 7, rejected 0, new 3, reopened 0, closing 4: `8 - 7 - 0 + 3 + 0 = 4`.

Open IDs are CR-06-PLATFORM-003 and 012–014. The 003 shutdown tests tick 300 seconds, short of the 900-second default poll interval. A cached service throw can leave sibling trust reports readable (012). A restored service throw can prevent ownership and later stale/control setup (013). A failed Homebridge cache write can lose a counted pump observation after restart (014). Round one made progress, so D-04 permits plan 06-07 to repair these causes and run the next independent round. A human logic check for 001 remains a separate terminal gate.

## Verification

On Node v26.12.0, every cause's named owner check, direct platform coverage at 100% line/function/branch, pairing, Fallow guard/audit, and normal hooks passed before its repair was recorded. The combined `npm run check` at `19255e5` exited 0 with a writable npm cache and local socket access: static checks, compiled unpaired tests, 104/104 Cucumber scenarios, 1156/1156 steps, and 43 isolated coverage pairs passed. The round-one review still leaves four accepted findings open; the passing gate does not close them.

## Deviations from plan

The 007 review suggested three inventory calls, but tracing the named case showed four total: one registration request, two ordinary absent polls, and one final check. The case and ledger use the observed four-call sequence. The 003 repair passed a credential-retry control but did not reach the later poll timer; the independent review kept that ID open.

## Threat Flags

T-06-12 remains relevant through open trust and persistence causes 012–014. No security-relevant surface outside the plan's `<threat_model>` was introduced.

## Requirement status

`ROOT-01` remains pending. Plan 06-07 continues from the committed round-one counter with exactly four open PLATFORM IDs.
