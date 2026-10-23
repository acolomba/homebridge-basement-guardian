---
phase: 08-final-sweep-and-gate
plan: "06"
subsystem: root
tags: [homebridge, platform, configuration, logging, protocol, review]
requires:
  - phase: 08-final-sweep-and-gate
    provides: live manifest, review protocol, and independent tracer
provides:
  - complete-file ROOT review of 15 current paths at their committed blobs
  - CR-08-ROOT-001 for central triage and serial repair
affects: [08-09, 08-14, GATE-02]
actuals:
  tokens: 4026
  tasks: 2
  commits: 1
commits: 1
plan_head_before: 01bc3a3b8d542054bfdb98a13ee180155dd92fd2
plan_head_after: 95d2ba8bbdecdcc790c543ae6ddcd7a00a4ac250
tech-stack:
  added: []
  patterns: [complete committed-blob review, owner-consumer trace]
key-files:
  created:
    - .planning/phases/08-final-sweep-and-gate/08-ROOT-REVIEW.md
    - .planning/phases/08-final-sweep-and-gate/08-06-SUMMARY.md
  modified: []
key-decisions:
  - Keep restored display-name log disclosure open for central triage.
  - Preserve the prior scoped deviceId logging rejection under D-14 and D-027.
requirements-completed: []
duration: unknown
completed: 2026-10-22
status: complete
---

# Phase 08 Plan 06: ROOT review summary

**Reviewed all 15 ROOT files at committed blobs and found one open privacy cause in restored accessory logging.**

## Review evidence

- **Revision read:** `01bc3a3b8d542054bfdb98a13ee180155dd92fd2`.
- **Reviewer:** `/root/phase8_plan06`, independent of the reviewed files.
- **Shard A:** `src/platform.ts` `e4bedd50206653eb6456a931edba97ab3bea12c1`; `test/platform.test.ts` `f14616b7da2be4b8af73074914981d2f395db161`; `test/platformSeeds.ts` `ad02884ba05cadfa45959eb8c283720ca56eb27e`.
- **Shard B:** `src/config.ts` `3d299fd1fe718a5ddb6835417849d01b7694f21b`; `src/index.ts` `0c901bb2b5e806a696da8edff1b15667e44eb55b`; `src/logging.ts` `b63fe57face52149c687e342026e6f36c433bc64`; `src/protocol.json` `3088e6a36d1a99d0062b2dea927508f2163a61b9`; `src/protocol.ts` `10564e646c6a23b01402cf4be4af4fdee06faf2d`; `src/settings.ts` `be017883bc3d7b1c90d3a496a77ca53c57ddae41`; `test/config.test.ts` `33e1d51f1db305e2adb9ef4d898a3ccd27ca9e56`; `test/hbConfig/config.example.json` `635aedd287701b420ee2a8cd705cc80cc79393e2`; `test/index.test.ts` `adaf69840bb30e98c5410c72974832c93c4c2281`; `test/logging.test.ts` `49ff7493e93ec88f5c525f60cd7438d05c3dea6a`; `test/protocol.test.ts` `3e72b8f0a9cb2f68bfcac2b865b0eb1c5c891c04`; `test/settings.test.ts` `b805fce4df8a8d3b8fa4be75df331b752d8eaecb`.
- **Complete spans and dispositions:** [08-ROOT-REVIEW.md](08-ROOT-REVIEW.md) has one `1-N` row for every path. The 4,272-line platform owner test has a contiguous chunk ledger there.

## Findings and rejected candidates

`CR-08-ROOT-001` is open at `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:src/platform.ts:694-698`. A restored accessory display name can contain the configured account email. The name reaches the delegate logger as a trailing parameter. The paired test's recording logger drops that parameter. Plan 08-09 must reconcile this cause, and Plan 08-14 must add active RED evidence before a source fix.

The report rejects three candidates with exact rule and revision-qualified evidence: local composite `deviceId` logging under D-14/D-027, the loader-required default export, and test-only `.bind`/`Object.defineProperty` use. No other ROOT finding was accepted.

## Commands and status

| Command or check | Exit | Result |
| --- | ---: | --- |
| Current ROOT path set versus `08-MANIFEST.json` | 0 | 15 actual paths, 15 expected paths, no missing or extra path. |
| Each manifest ROOT `HEAD:<path>` blob and line count | 0 | All 15 match the committed files reviewed. |
| Plan 08-06 shard A row predicate | 0 | Three complete `1-N` rows with full blobs and reviewer. |
| Plan 08-06 shard B row predicate | 0 | Twelve complete `1-N` rows with full blobs and reviewer. |
| `SKIP=npm-check pre-commit run --files <ROOT report and summary>` | 0 | Parent ran planning-file checks before committing. |
| `fallow audit --base 01bc3a3` | 0 | Parent ran the required audit before committing. |
| Build, tests, coverage, full `npm run check` | Not run | Later repair and combined gates own these checks. |

No production, test, fixture, shared state, or central findings ledger file was edited by this reviewer. The parent committed the report as `95d2ba8` with normal hooks. A separate read-only reviewer confirmed the log disclosure and narrowed the name source to the proven vendor-name path.

## Deviations from plan

The parent assigned one independent reviewer to both ROOT shards and retained commit and state ownership in the linked worktree. The file review, candidate triage, and report are complete. No code fix was attempted; the plan assigns fixes to Plan 08-14.

## Next plan readiness

Plan 08-09 can reconcile `CR-08-ROOT-001` with the other owner reports. `GATE-02` remains in progress until all owner reports and the correction loop finish. The Phase 08 final combined gate has not run.

## Threat Flags

`T-08-12` remains open through `CR-08-ROOT-001`. No new security-relevant surface outside the plan's `<threat_model>` was introduced by this review-only work.

## Self-Check: PASSED

Both created files exist. The reviewed revision is an ancestor of the current `HEAD`. The report commit is `95d2ba8`.
