---
phase: 04-runtime-conformance
plan: "07"
subsystem: runtime
tags: [lifecycle, credential-rotation, regression-evidence, strict-mocks, account-runtime]
status: complete
requires:
  - phase: 04-06
    provides: Arrival and monitoring contracts with preserved safety semantics
  - phase: 04-11
    provides: Bounded real and ACCOUNT anchor/shadow agreement
provides:
  - Complete initial ACCOUNT review with stable findings across all owning plans
  - Current-lifecycle ownership guards and deadline-preserving bounded waits
  - Independent startup, anchor, timing, command-absence and registration observations
  - Silent logging, exact FailureLog routing and prescribed public interactions
affects: [04-08, 04-09, 04-10]
tech-stack:
  added: []
  patterns: [Evidence before production fixes, Explicit per-case strict verification]
key-files:
  created:
    - .planning/phases/04-runtime-conformance/04-ACCOUNT-REVIEW.md
    - .planning/phases/04-runtime-conformance/04-ACCOUNT-RUNTIME-RED-EVIDENCE.json
    - .planning/phases/04-runtime-conformance/04-07-SUMMARY.md
  modified:
    - src/runtime/accountRuntime.ts
    - test/runtime/accountRuntime.test.ts
key-decisions:
  - Preserve lifecycle/root ownership and the original expiration-minus-lead deadline.
  - Keep immutable native RED history while permitting strictly stronger active verification with explicit patch comparison.
  - Observe runtime notifications at FailureLog and registration boundaries; keep logging discipline in its own owners.
requirements-completed: []
requirements-pending: [RUN-01]
actuals:
  tokens: 219461
  tasks: 2
  commits: 19
  owned_implementation_commits: 12
  parent_evidence_commits: 2
  delegated_contract_commits: 2
  interposed_coordinator_commits: 3
  measurement_scope: Documented Git interval includes interposed commits; token measurement uses the two owned execution segments.
plan_head_before: e6f49a59671c13a20b696b7f46e38406a36aeec0
plan_head_after: 95a99345e6f0e680c06ed322a1be7a5da82ff838
precommit_ledger_status: absent_not_reconstructed
coverage:
  - id: ACCOUNT-STARTUP
    description: Public startup preserves the injected store, restore order and exact restored anchors.
    requirement: RUN-01
    verification:
      - kind: unit
        ref: test/runtime/accountRuntime.test.ts
        status: pass
      - kind: other
        ref: npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts
        status: pass
    human_judgment: false
  - id: ACCOUNT-LIFECYCLE
    description: Late inventory work respects ended lifecycle ownership; long waits preserve the full credential deadline.
    requirement: RUN-01
    verification:
      - kind: unit
        ref: test/runtime/accountRuntime.test.ts
        status: pass
      - kind: other
        ref: npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts
        status: pass
    human_judgment: false
  - id: ACCOUNT-OBSERVATIONS
    description: Independent notification, absence, registration and strict interaction assertions protect the owned promises.
    requirement: RUN-01
    verification:
      - kind: unit
        ref: test/runtime/accountRuntime.test.ts
        status: pass
    human_judgment: false
duration: Multi-session; retained native records span at least 9h37
completed: 2026-10-15
---

# Phase 4 Plan 7: ACCOUNT Lifecycle Conformance Summary

Current-lifecycle guards, bounded credential waits and independent public observations preserve the existing account runtime contracts.

## Files Created and Modified

- `.planning/phases/04-runtime-conformance/04-ACCOUNT-REVIEW.md` — complete initial source/owner review and append-only cause evidence.
- `.planning/phases/04-runtime-conformance/04-ACCOUNT-RUNTIME-RED-EVIDENCE.json` — immutable current and recursive native RED history.
- `.planning/phases/04-runtime-conformance/04-07-SUMMARY.md` — this execution record.
- `src/runtime/accountRuntime.ts` — two minimum production repairs, approved headers and bounded factual comment repairs.
- `test/runtime/accountRuntime.test.ts` — active regressions, independent observations, exact diagnostics and per-case prescribed interactions.

The conditional accountRuntimeSeeds helper was not created. Original 014 owns that later concern. The added shadow helper and adapted arrival/shadow owners belong to delegated 04-11 and remain in the later ACCOUNT review inventory.

## Task Completion and Review Scope

Both original tasks are implemented: restore-to-admission/startup and owned lifecycle/polling/rotation/shutdown. Work was committed by accepted cause, with terminal evidence checkpoints and an inserted contract dependency between execution segments. The final full owner and exact isolated pair cover both completed task scopes. No early tracer chronology or current full combined gate is inferred from that final focused result.

Before any repair, fresh typed account_initial_review read all 1,283 source lines and all 3,365 initial owner lines, every case/helper/header, all five complete books and actual callers/adapters. Initial revision was e6f49a59671c13a20b696b7f46e38406a36aeec0. Initial blobs were source bf9094668ef1e600d44c2e302e46dfaf6c3e5866 and owner c88d2d89a924c4f7d4397ae4b1de3b53051518b3. It reported 29 findings: 18 BLOCKER and 11 WARNING; genuine candidates 021–026. Complete native review evidence remains in /private/tmp/guardian-04-account-initial-native/.

Implemented original 07 IDs are 001, 002, 003, 006, 007, 008, 012, 013, 024, 025, 027 and 028. Original 015 is implemented through separately approved 04-11, with its own summary and parent gate. These are implementation dispositions awaiting independent correction, not thirteen independently closed findings.

ACCOUNT keeps its original 29 IDs and correction counter **0**. Round-zero arithmetic remains initial/new 29, independently fixed/rejected/reopened 0, pending independent correction 29. There has been no full ACCOUNT correction or partial clean verdict. Later full review must include the current complete source/owner, both concern helpers and adapted real arrival/shadow owners, with all headers. Earlier cloud/TRUST reviews remain historical for changed files.

## Accomplishments

- Prevented successful or failed pending restore/inventory continuations from acquiring lifecycle permission after stop or terminal-auth halt. Existing explicit stop, shared-root cancellation and terminal halt distinctions remain.
- Split waits into representable native timer segments without advancing credential refresh before the original expiration-minus-lead deadline. The fifty-day regression retains independent before/at-deadline checks; a separate actual Node probe establishes the native overflow clamp.
- Preserved exact injected-store identity, restore-before-admission and restored timestamps until actual arrival. Independently specified bundled lead/floor boundaries replace expectations derived from the same inputs.
- Qualified scoped deviceId comments with the unconfirmed opaque-key premise and accurately described root cancellation, explicit shadow close and deliberate factory-failure testing.
- Recorded command attempts before rejection, protected caught/discarded refusals, and verified token/all-AWS-role registration before downstream use and after rotation.
- Replaced incidental logger assertions with silent logging and exact FailureLog notifications. Prescribed API, command and callback interactions use explicit per-case strict verification after public state assertions; whole trust captures remain independent and complete.

## Actual Commits and Measurement

Exactly twelve original 07 implementation commits exist on this branch:

| Original ID | Commit | Result |
| --- | --- | --- |
| 024 | c179545bf4d2bb1aa35a3e4b204b92f3930b1941 | Current ownership after pending inventory work |
| 025 | 03df99257d871a6c2c959363ac99ed078cdd63bd | Complete distant expiry deadline with bounded waits |
| 001 | 604d072a4f5169ef17f27a74c1176e8f1aca2289 | Separate source/owner headers |
| 006 | 18d814eaefe9e3e46a3f92ce7e36d8e5c3dad6ea | Injected store identity and independent snapshot |
| 008 | 84fd96017082503acc897521f2d458e82297266f | Exact restored/new arrival anchors |
| 007 | c627c2a5290f6caeae3e961cf2284f96bb761e2a | Independent bundled timing boundaries |
| 002 | 3d193f1333c6039e68cd539df133ac6e88da2507 | Scoped privacy wording |
| 003 | 128c005b91b653815d46ea8dbe3119bebf9dc06d | Accurate lifecycle wording |
| 027 | d6e4ee6e2cab5e62cba4396e5e0f2424b920f185 | Observable forbidden command attempts |
| 028 | d4c8e5bd13d25772a8053989518ee0955a133163 | Registration before downstream use |
| 012 | 0b86403ffecb4eac0794c7dc98bc9e4104b08daf | Exact FailureLog boundary |
| 013 | 95a99345e6f0e680c06ed322a1be7a5da82ff838 | Prescribed interactions and explicit verification |

Parent evidence-only commits are 250516bb892a3d88bd5c63826ed3073876e4fad6 and 6f9500e54ac7b6e72db982f42722f9ce2bf768d7. Delegated 015 commits fae2ce4800e256a52e3aa1af7371a255a7db124b and 4fc498ce4de72104461c4cef51aada40a3f2d233 belong to 04-11. Interposed coordinator records are 6072c20, ac52e22 and 09facce.

The documented e6f49a5..95a9934 Git interval therefore contains **19 = 12 implementation + 2 parent evidence + 2 delegated contracts + 3 coordinator records**. The frontmatter interval count is not a claim of nineteen 07-only implementation commits. The summary metadata commit is outside that measured range.

The required pre-first-commit gitdir ledger is absent. Nothing was created or reconstructed after discovering that absence. The documented initial revision and exact commit set support the measurements, but do not establish historical ledger compliance. The parent will record this open process deviation.

Token actuals use chars/4 over the realized NET diff of the four original source/owner/report/evidence paths in the two owned segments: e6f49a5..c627c2a = 518,876 characters; 09facce..95a9934 = 358,968. Total 877,844 / 4 = **219,461 tokens**. The inserted 04-11 modifications are excluded by the segment boundaries. This is a diff-size measure, not harness token use. Complete hashes and alternate cumulative measurements remain in /private/tmp/guardian-04-07-closeout/measurement.json.

The initial retained review manifest is timestamped 2026-10-15T04:55:36.594717+00:00. Final implementation closeout was observed at 14:32:25 UTC. This span includes parent evidence checkpoints, the maintainer decision and inserted 04-11; it is not active CPU effort or proof of a persisted plan-start timer.

## Genuine RED Before GREEN

024 ancestry is source e6f49a5 → planning-only evidence 250516b → GREEN c179545. The active unchanged-production owner ran 129 tests: 128 pass, one intended deepStrictEqual failure, no skips/cancellations. A final inventory response after terminal halt removed the snapshot and anchor and appended trust. The parent independently verified full native output, patch, production manifest and classification before committing evidence only; the failing owner stayed unstaged until GREEN.

025 ancestry is source c179545 → planning-only evidence 6f9500e → GREEN 03df992. Its full owner ran 136 tests: 135 pass, one intended timer-range assertion failure, no skips/cancellations. Actual overflowing waits were 4,319,999,990 and 2,172,516,343 ms. A separate unmocked Node probe records 4,319,999,990 → 1 ms with TimeoutOverflowWarning. Fake-timer observations alone do not establish that clamp.

The pair evidence retains all six current/recursive records, including every prior attempt, complete TAP/stdout/stderr, patches, argv, raw exits, actual UTC times, versions and source/test identities. The installed current CLI and SAME recursively invoked classifier accept all six as RED_EVIDENCE_OK. Current evidence blob remains 849b2e725bc19a4742e962910cce05f804a6a4c1. No archived byte or genuine source/evidence/fix ancestry changed.

Original 024 remains exact. Active 025 keeps every original timer operation, literal deadline, expected count and assertion. Cause 013 adds an exact-root credential mock and explicit verification, with the original and current full bodies retained side by side in its provenance. This is strictly stronger active verification; it does not rewrite immutable RED history. The scope clarification and exact saved-patch comparison are recorded in the 013 appendix.

Native histories remain in /private/tmp/guardian-04-account-024-red/ and /private/tmp/guardian-04-account-025-red/, with corresponding root-verification and GREEN directories. No failing code commit, skipped regression or subject-prefix ancestry proof was used.

## Check Results

All executable checks used Node v26.11.1, npm 11.20.0, TypeScript 6.0.3 and Fallow 3.27.0 in the existing linked feature checkout. Each cause retains exact argv, raw exits, UTC start/end, separate native streams, input blobs, failed attempts and real commit paths. The report maps every original ID to its actual records.

Final executable evidence is tied to the unchanged final candidate committed as 95a9934:

| Command / observation | Raw result and native reference |
| --- | --- |
| npm run build:test | Exit 0, 14:27:34.072–14:27:36.974 UTC; 013/build-final.json |
| node --test --test-reporter=tap dist-test/test/runtime/accountRuntime.test.js | Exit 0, 14:27:38.618–14:27:39.065; 153 pass, zero fail/cancel/skip/todo; 013/owner-final.json |
| npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts | Exit 0 with fresh build; 14:27:39.727–14:27:43.657; 013/direct-final.json |
| Isolated native exact-source thresholds and LCOV | Exit 0, 14:27:51.051–14:27:51.610; 995/995 lines, 57/57 functions, 181/181 branches; 013/native-coverage-final.json |
| Uncached exact source/owner ESLint, max warnings 0 | Exit 0; 013/lint-final-2.json |
| Fallow audit against actual initial base e6f49a59671c13a20b696b7f46e38406a36aeec0, JSON/quiet/explain | Exit 0, verdict pass; 013/audit.json |
| Final forbidden-command maintenance control | Intended assertion failure 1, exact restoration 0, fresh build/named targets/full owner GREEN; 013/control-target.json and restoration.json |
| Exact clean pre-step then ordinary foreground commit hooks | Exit 0; 013/pre-step-final.json, commit.native.json and native streams |

The final owner contains 138 authored declarations and 153 executed cases. 132 authored cases contain 254 explicitly verified mock handles. All 116 authored empty-command-attempt assertions remain. Per-case ACT captures state and performs any stop before ASSERT; verification follows public state assertions. Typed canned responses remain stubs, and the contract-checked stateful adapters retain their names/signatures and behavior.

The 012 final native branch denominator was 180/180; 013's final LCOV is 181/181. Both actual records remain distinct. The initial quick 013 message saying 180 was corrected from the actual LCOV; it is not substituted for the retained native result. Selected compiled denominators are distinct from merged source-mapped all-pair LCOV.

Every implementation commit passed its required exact-file clean pre-step before staging and normal foreground hooks. Formatter/report changes required clean repetition. Earlier sandbox failures and authorized retries remain recorded; later necessary linked-Git staging/commits used the already authorized access directly. No wrapper, amend, hook bypass, stash, rebase or history rewrite was used.

Cause directories are /private/tmp/guardian-04-account-024-green/, guardian-04-account-025-green/, guardian-04-account-001-headers/, guardian-04-account-006-identity/, guardian-04-account-008-anchors/, guardian-04-account-007-timing/, guardian-04-account-002/, guardian-04-account-003/, guardian-04-account-027/, guardian-04-account-028/, guardian-04-account-012/ and guardian-04-account-013/ under /private/tmp/.

The parent's inserted-wave full gate passed at ac52e22: Node v26.11.1, 13:11:31.509381–13:12:06.485929 UTC, six static checks, 104 Cucumber scenarios, 1,156 steps and 43 isolated pairs. Its exact files are /private/tmp/guardian-phase4-wave7-contract-gate.json and guardian-phase4-wave7-contract-full-check.log. Later 07 changes invalidate reuse as a current combined-tree result. The parent owes a fresh full npm run check after this terminal return; the executor did not run an extra full gate.

## Separate Maintenance Controls

Store identity, restored-anchor precision, independent bundled lead/floor timing, forbidden-command absence, registration order and removed-device forget routing each have intended native failures followed by exact source restoration and rebuilt GREEN. They are assertion-maintenance controls, not production bugs or additions to genuine RED history. The final strict fixture control re-proves the caught/discarded command refusal remains observable after mock conversion.

All original public promises were retained or given truthful observations. Construction's title now claims the observed HTTP/socket boundaries; no file-read/timer proof is invented. Public notification mocks contain exact independent arguments and finite counts; complete device maps are asserted where promised. Local logger-only functions and parameters orphaned by 012 were removed under AGENTS after lexical applicability review. That is not a private alias/member trace waiver or a shared API change.

## Deviations and Process Limits

The inserted bounded 015 dependency was explicitly approved and declared before its edits; see 04-11. No production feature, privacy permission, persistence format, package, compiler setting or undeclared helper was added. The conditional seed remains absent.

Two open process deviations require parent ledger records after terminal return:

- **013 serial mutation gap:** ESLint --fix yielded session 47163 at 14:25:37.372 UTC. Formatter/build work began before its terminal exit 1 was collected at 14:25:48.809. Intermediate native inputs/outputs remain. Later completed serial format/lint, a final guarded expectation edit, baseline/control/restoration, fresh build/full owner/direct/lint provide current evidence. They do not repair the historical ordering or supply a waiver.
- **Missing 07 pre-first-commit ledger:** the exact gitdir path is absent. The documented Git base, measured interval and explicit owned commit set are retained separately. Nothing was reconstructed or represented as contemporaneously persisted.

WINDOWS 46/47/48 remain OPEN and unwaived. The parent owns the additional actual ledger IDs; no executor record assigned or closed them. Initial 07 execution and subsequent resumptions share the same original review and counter.

Preparation failures are preserved, including private-target unsupported results, script/compiler/lint errors, comparison-script failures and strict expectation corrections. Invalid import/setup failures are not intended RED. No stale intermediate pass is used as final evidence. The report gives actual attempt records and final unchanged-input scope.

## Stubs, Threats and Remaining Work

The changed-file scan found only intentional synthetic fixture identifiers and explanatory fixture wording. No unfinished runtime stub, skipped/todo/only test or unrun required focused verification was introduced. An existing empty logging compatibility array is unasserted and supplies no claimed logging coverage. Parent-only combined gates and process ledger writes remain explicit obligations.

The two production repairs address T-04-13 within existing root/current ownership and scheduling boundaries. Registration observations and scoped factual comments address T-04-14 without new permissions. Inputs remain synthetic/offline; no package was installed (T-04-SC).

Plan 08 retains original IDs 018–023 and 026. Plan 09 retains 004–005, 009–011, 014, 016–017 and 029. Some stronger 013 observations overlap later scopes; their IDs and independent review obligations remain unchanged. RUN-01 stays Pending, and no phase completion is claimed. D-03 global stops remain in force for future actual corrections.

The parent owns shared-state advancement, the fresh combined gate and restoration of only workflow.use_worktrees=true before final milestone audit/handoff. No shared STATE/ROADMAP/REQUIREMENTS/WINDOWS/central findings/config file was edited by this executor.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Self-Check: PASSED

All declared created/modified files exist. Every exact implementation/evidence commit is an ancestor of HEAD, and the documented interval and owned-set counts reconcile. Source is 641f40950d20e1fbfbc7de6dd1200e867c67ecb0, final owner b9df254238e42506df1c34617a3317057ce1b6c3 and immutable RED 849b2e725bc19a4742e962910cce05f804a6a4c1. No tracked file deletion or untracked executable remains. This validates artifact claims, not the absent historical ledger or pending independent correction/full gate.
