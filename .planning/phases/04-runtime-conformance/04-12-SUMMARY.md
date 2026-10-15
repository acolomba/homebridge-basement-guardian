---
phase: 04-runtime-conformance
plan: "12"
subsystem: runtime
tags: [cached-identities, reconciliation, homebridge, regression-evidence]
status: complete
requires:
  - phase: 04-07
    provides: Current lifecycle guards and complete initial ACCOUNT review
  - phase: 04-11
    provides: Consumed anchor and shadow adapter contracts
provides:
  - True platform-owner RED before both runtime and platform production repairs
  - Optional known physical IDs at runtime start without fabricated telemetry
  - Validated launch-time cached identity handoff and confirmed removal
  - Separate platform source header repair on GREEN inputs
affects: [04-08, 04-09, 04-10]
tech-stack:
  added: []
  patterns: [Identity-only absence eligibility, Evidence before cross-file repairs]
key-files:
  created:
    - .planning/phases/04-runtime-conformance/04-PLATFORM-RED-EVIDENCE.json
    - .planning/phases/04-runtime-conformance/04-12-SUMMARY.md
  modified:
    - src/runtime/accountRuntime.ts
    - test/runtime/accountRuntime.test.ts
    - src/platform.ts
    - test/platform.test.ts
    - .planning/phases/04-runtime-conformance/04-ACCOUNT-REVIEW.md
key-decisions:
  - Seed absence eligibility through the existing start boundary after restoration and current-lifecycle checks.
  - Read and validate cached physical IDs at launch because platform construction precedes cache restoration.
  - Keep platform RED history separate from the unchanged ACCOUNT pair history.
requirements-completed: []
requirements-pending: [RUN-01]
actuals:
  tokens: 800519
  tasks: 2
  commits: 4
  diff_characters: 3202074
  owned_implementation_commits: 3
  parent_evidence_commits: 1
commits: 4
plan_head_before: 3f4f1c3c8a9a732cd7a7711debbd7cb836611362
plan_head_after: b7bae4abe95efa485e06e8d02353bcaf075f0993
coverage:
  - id: ACCOUNT-026-IDENTITIES
    description: Known cached identities enter absence tracking without supplying canonical telemetry or arrival anchors.
    requirement: RUN-01
    verification:
      - kind: unit
        ref: test/runtime/accountRuntime.test.ts
        status: pass
      - kind: other
        ref: npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts
        status: pass
    human_judgment: false
  - id: ACCOUNT-026-PLATFORM
    description: Restored valid physical IDs reach runtime at launch and require healthy confirmations plus a final inventory check before removal.
    requirement: RUN-01
    verification:
      - kind: unit
        ref: test/platform.test.ts
        status: pass
      - kind: other
        ref: npm run test:coverage:direct -- src/platform.ts test/platform.test.ts
        status: pass
    human_judgment: false
duration: 59 min 18 sec through pre-summary measurement
started: 2026-10-15T17:03:37.741336Z
completed: 2026-10-15
---

# Phase 4 Plan 12: Cached Identity Removal Summary

Cached physical identities enter confirmed-absence tracking at launch while their telemetry remains unknown until observed.

## Files Created and Modified

- `.planning/phases/04-runtime-conformance/04-PLATFORM-RED-EVIDENCE.json` — complete native platform RED root and named-run archive.
- `.planning/phases/04-runtime-conformance/04-12-SUMMARY.md` — this execution record.
- `src/runtime/accountRuntime.ts` — optional identity-only argument on start and guarded reconciliation seeding.
- `test/runtime/accountRuntime.test.ts` — seven added public identity, inventory and lifecycle cases.
- `src/platform.ts` — validated launch-time cached-ID handoff and separate source header repair.
- `test/platform.test.ts` — active cached-removal regression plus seven identity-validation cases.
- `.planning/phases/04-runtime-conformance/04-ACCOUNT-REVIEW.md` — append-only original 026 evidence and implementation records.

No helper, dependency, compiler input, persistence format, feature World or shared-state record changed. The existing ACCOUNT RED file is unchanged.

## Accomplishments

The runtime accepts optional known physical IDs through start. After awaited arrival restoration and the existing current-lifecycle guard, it seeds only reconciliation eligibility before launch. It creates no canonical snapshot, measurement, metadata, watermark, connectivity answer, trust report or arrival anchor for a cached-only identity. Existing no-argument callers remain valid. Tests cover duplicate IDs, healthy confirmation and final check, failed inventories, refusal retry and lifecycle boundaries.

The platform reads its current accessory map in didFinishLaunching. It reuses the existing isRecord guard, accepts only nonempty string deviceIds from restored context, deduplicates them, and passes them to start. Missing or malformed identities receive no substitute. Cached readings remain retained and stale before confirmation. Existing removal callback and pruning order remain authoritative.

Homebridge's official template and callback documentation agree with the installed 2.4.0 declarations. Installed server restoration precedes signalFinished, which emits didFinishLaunching. Reading the map at launch avoids capturing the empty constructor-time cache. No current-documentation difference affected this repair.

The platform owner already had a conforming D-01 header. Its complete bytes stayed unchanged during the separate header cause. Only the production source needed the copyright and overview blocks; MIT attribution and every body byte were preserved.

## Actual Commits and Measurement

| Stage | Commit | Actual paths |
| --- | --- | --- |
| Parent planning-only RED evidence | 9f7649eac84f5b82106535c941763ec1554bac1d | ACCOUNT report and new PLATFORM RED JSON |
| Runtime dependency / task 01 | d7e05982064fee3af178bbf7def5973b8f20bd14 | Runtime source, runtime owner, ACCOUNT report |
| Platform integration / task 02 | 6c82ec94abfa25af4ea50c49a926e4a7cfba5af5 | Platform source, platform owner, ACCOUNT report |
| Separate source header | b7bae4abe95efa485e06e8d02353bcaf075f0993 | Platform source and ACCOUNT report |

The actual gitdir ledger was written before the first plan evidence commit and contains 3f4f1c3c8a9a732cd7a7711debbd7cb836611362. It was not reconstructed. Its recorded file timestamp starts the duration above. The measured interval through b7bae4a contains four commits: one parent evidence commit and three implementation commits.

The realized pre-summary Git diff contains 3,202,074 characters; ceil(chars / 4) is 800,519 tokens on the plan's estimation scale. Complete native evidence and input captures dominate this diff. This is not harness token usage. The closing summary commit is excluded from that measured interval. Measurement and the exact pre-write guard are retained under /private/tmp/guardian-04-12-closeout/.

## Genuine RED and Cross-File Ancestry

Fresh typed fixer account_026_platform_red used the existing public platform constructor, configureAccessory, launch event and injected offline HTTP. The regression compiles against unchanged production. Its three cached-preservation assertions pass; its final whole-state assertion fails because the cached accessory remains and unregister never occurs. The named run executes one intended ERR_ASSERTION/deepStrictEqual failure. The full platform owner executes 64 tests: 63 pass and only that new case fails, with zero skipped, cancelled or todo tests.

Source 3f4f1c3 precedes actual planning-only evidence 9f7649e, which precedes runtime dependency d7e0598 and platform integration 6c82ec9. Both production files and all 44 production inputs remained unchanged through the evidence commit. The failing platform owner remained unstaged during that commit and the runtime dependency commit. No failing code commit, manual stash, hook bypass or history rewrite was used.

The PLATFORM evidence retains blob 5a35d0831979b6c7444b598c0987bdd9d98f758b and both complete native records. The existing ACCOUNT evidence retains blob b3f7141fc652706628ec55c5bd5c1a3e4b560319 and all fourteen recursive records. Current installed CLI checks and the SAME installed classifyRedEvidence accept all sixteen records in their separate files. No second parser or replacement history was introduced.

The saved active platform regression remains byte-exact. Integration adds one import and seven separate validation cases; the header stage changes no owner byte and no source body. Full saved/current comparisons, native input manifests, Git objects and actual commit paths remain available in the cause directories below.

## Exact Consumer and Ownership Evidence

The runtime fixer refreshed AccountRuntime and both factory impacts separately in the production and test compiler projects at 9f7649e. All six native queries returned exit 0, complete identities, the intended selected_project and no omissions. Named and structural callers, including platform and both Worlds, were read. Zero named production consumers did not erase the public return shape or factory contract.

The platform fixer refreshed eight exact platform/runtime queries at d7e0598, independently in both projects. All were complete. It read real index, owner and World consumers before editing. Header-only work changed no signature or field. No private alias/member was removed and no trace exception was needed.

Each fixer read all five complete books and its complete current source/owner/context before editing. Exact guards preceded repository edits and formatting. The parent/executor waited for each actual terminal result before another mutation, build, Git action or dispatch. Every native mutating session was collected before dependent work.

## Check Results

Checks used Node v26.11.1 and npm 11.20.0 in the existing feature checkout with the documented worktree opt-out. Raw argv, stdout/stderr, exits, UTC times, input identities, patches and all attempts live in these directories:

- /private/tmp/guardian-04-account-026-platform-red/
- /private/tmp/guardian-04-account-026-runtime-seed/
- /private/tmp/guardian-04-account-026-platform-green/
- /private/tmp/guardian-04-account-026-platform-headers/

| Stage | Actual native result |
| --- | --- |
| Platform RED | Fresh build 0; named owner 1 with one intended assertion failure; full owner 1 with 64 tests, 63 pass and one intended failure. Final uncached lint 0. |
| Runtime dependency | Fresh build 0; full owner 166 pass; isolated selector 0; native 1007/1007 lines, 58/58 functions, 193/193 branches; uncached lint 0. |
| Platform integration | Fresh build 0; full owners 237 pass = 71 platform + 166 ACCOUNT; both isolated selectors 0; native platform 498/498 lines, 22/22 functions, 57/57 branches; ACCOUNT 1007/1007, 58/58, 193/193; lint 0. |
| Final header inputs | Fresh build 0; platform owner 71 pass; isolated selector 0; native 504/504 lines, 22/22 functions, 57/57 branches; pair lint 0; license-header owner 5 pass. |
| Commits | Recorded-base Fallow audits pass; exact-file pre-steps clean before staging; ordinary foreground hooks, including check:commit, pass. |

The applicable commands were npm run build:test; native node --test --test-reporter=tap on the named or full mirrored owners; exact npm run test:coverage:direct source/owner selectors; native exact-source coverage with all three 100% thresholds; uncached ESLint; and the existing license-header owner. Complete exact argv are retained in each command record.

The final combined owner run completed 17:47:33.528936–17:47:33.987625 UTC. Final platform header build completed 17:57:23.704076–17:57:26.718357 UTC; native platform coverage completed 17:57:48.454353–17:57:48.939971 UTC. The header commit hooks completed 18:01:48.241609 UTC.

Header work reused ACCOUNT evidence only after exact manifest and 33-file import-closure comparisons with the current-session integration inputs. It did not claim a fresh ACCOUNT run. Selected native compiled denominators are distinct from merged source-mapped all-pair LCOV. No full npm run check ran in this executor; the parent owns that required combined gate after actual terminal return and again after completed 04-08.

## Deviations and Preparation Limits

No functional scope deviation occurred. The conforming platform owner header required no edit, so the final header commit contains source and report only. This follows surgical-change rules and preserves the complete owner.

All preparation failures remain native records: an initial RED lint spacing error; temporary verifier symlink handling; artifact-transfer and capture-name preparation problems; runtime verifier setup attempts; two platform integration lint failures; and a terminal-verifier punctuation assertion. Corrected final checks pass. None is relabeled as genuine RED or an observed product defect. Formatter and lint-fixer inputs/outputs were captured for this plan.

The earlier original 022 formatter-input capture gap remains disclosed and unwaived. WINDOWS 46–50 and earlier missing historical captures are not repaired by these current results. The parent owns the pending process-window entry; this executor did not edit WINDOWS or assign an invented ID.

The summary's exact-path Fallow guard preceded its first write. Its absolute path was correct, but explicit canonical-root containment was captured at self-check after that write. This later check does not supply historical pre-write proof. The parent owns any resulting process-window record.

The changed-code scan found no new unfinished stub, only/skip/todo test or unrun required focused verification. Synthetic fixture placeholders are intentional. No new network endpoint, persistence format, package, private account input, hardware run or logging permission was introduced.

## Remaining Review and Parent Work

Original 026 is implemented pending independent full ACCOUNT correction. The original 29 IDs and correction counter 0 continue unchanged. These implementation checks are not a correction round or an independent clean verdict. Both complete platform files join the actual ACCOUNT correction/header/seal inventory alongside the existing adapted reconciliation pair and helpers. This bounded work does not certify the whole root or accessories sweep.

RUN-01 remains Pending. The parent owns the combined full gate, shared-state advancement, 04-08 continuation and later 04-09 full ACCOUNT correction. D-03 global stops remain active. The parent must restore only workflow.use_worktrees=true through the registered configuration command before final milestone audit/handoff. No shared STATE, ROADMAP, REQUIREMENTS, WINDOWS, central findings or configuration record was edited here.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Self-Check: PASSED

All seven declared artifacts exist inside the canonical checkout. All four recorded commits are ancestors of HEAD. The persisted pre-commit ledger measures four commits and 3,202,074 diff characters through b7bae4a, matching the recorded actuals. The tracked tree and index were clean; only this summary was untracked. Native results are retained in /private/tmp/guardian-04-12-closeout/self-check.json.
