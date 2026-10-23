---
phase: 04-runtime-conformance
plan: "08"
subsystem: runtime
tags: [canonical-state, trust, physical-identity, reconciliation, regression-evidence]
status: complete
requires:
  - phase: 04-07
    provides: Complete initial ACCOUNT review and current lifecycle guards
  - phase: 04-12
    provides: Bounded runtime and platform repair for original cached-identity finding 026
provides:
  - Complete independent canonical, per-device trust and removal observations
  - Terminal final-check authentication propagation
  - Targeted reconciliation presence retaining future absence eligibility
  - Order-independent live shadow membership reconciliation
affects: [04-09, 04-10]
tech-stack:
  added: []
  patterns: [Planning-only RED before GREEN, Targeted physical identity operations]
key-files:
  created:
    - .planning/phases/04-runtime-conformance/04-08-SUMMARY.md
  modified:
    - src/runtime/accountRuntime.ts
    - test/runtime/accountRuntime.test.ts
    - src/accessories/reconciliation.ts
    - test/accessories/reconciliation.test.ts
    - .planning/phases/04-runtime-conformance/04-ACCOUNT-REVIEW.md
    - .planning/phases/04-runtime-conformance/04-ACCOUNT-RUNTIME-RED-EVIDENCE.json
key-decisions:
  - Preserve complete canonical readback and narrow keyed trust at actual public checkpoints.
  - Reset only a reappeared candidate through present; successful removal retains forget.
  - Compare physical membership as sets and reuse the existing shadow start replacement contract.
  - Delegate cached startup identity handoff to explicitly declared sequential plan 04-12.
requirements-completed: []
requirements-pending: [RUN-01]
actuals:
  tokens: 4382933
  tasks: 3
  commits: 19
  owned_segment_diff_characters: 17531732
  owned_segment_head: c330a13c4497d5e87c2d8a180ccf8816dc925f80
  interval_diff_characters: 20777790
  interval_tokens: 5194448
  primary_cause_commits: 6
  reconciliation_dependency_commits: 2
  parent_08_evidence_commits: 3
  parent_021_amendment_commits: 1
  delegated_12_declaration_commits: 1
  delegated_12_execution_and_summary_commits: 5
  interposed_coordinator_commits: 1
  measurement_scope: Tokens measure the owned execution segment; commits measure the entire persisted-ledger interval including inserted plan and parent records.
commits: 19
plan_head_before: 49d30f93b72cada50bb2002ce14aaf4fa9822776
plan_head_after: 77b3b8640ce31ef3cccec1c23c8d6732817384f5
coverage:
  - id: ACCOUNT-CANONICAL-TRUST
    description: Complete retained canonical snapshots and keyed trust protect reported ingress and quiet-device recovery.
    requirement: RUN-01
    verification:
      - kind: unit
        ref: test/runtime/accountRuntime.test.ts
        status: pass
      - kind: other
        ref: npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts
        status: pass
    human_judgment: false
  - id: ACCOUNT-PHYSICAL-REMOVAL
    description: Final checks, reappearance, refusal retention and callback-before-prune preserve exact physical identities and anchors.
    requirement: RUN-01
    verification:
      - kind: unit
        ref: test/runtime/accountRuntime.test.ts
        status: pass
      - kind: unit
        ref: test/accessories/reconciliation.test.ts
        status: pass
    human_judgment: false
duration: Approximately 3h30 through pre-summary measurement, including parent checkpoints and inserted plan 04-12
started: 2026-10-15T14:41:54.819335Z
completed: 2026-10-15
---

# Phase 4 Plan 8: ACCOUNT Canonical Trust and Removal Summary

Whole canonical and trust observations protect the existing runtime contract; bounded production repairs retain terminal authentication, future absence eligibility and current physical shadow membership.

## Files Created and Modified

- `.planning/phases/04-runtime-conformance/04-08-SUMMARY.md` — this execution closeout.
- `.planning/phases/04-runtime-conformance/04-ACCOUNT-REVIEW.md` — continuing original findings, complete cause evidence and implementation dispositions.
- `.planning/phases/04-runtime-conformance/04-ACCOUNT-RUNTIME-RED-EVIDENCE.json` — preserved native ACCOUNT RED root and recursive histories.
- `src/runtime/accountRuntime.ts` and `test/runtime/accountRuntime.test.ts` — the primary canonical/trust/removal repairs and active regressions.
- `src/accessories/reconciliation.ts` and `test/accessories/reconciliation.test.ts` — declared targeted-presence dependency and separate headers.

The conditional accountRuntimeSeeds helper was not created. The 021 plan amendment was committed by the parent before dependency edits. Delegated 04-12 separately owns the platform source/owner, new PLATFORM RED JSON and its runtime startup dependency; its summary records those exact paths and commits. Parent-only scheduling, findings, WINDOWS and shared-state records in the measured interval are not executor-owned implementation files.

## Task Completion and Review Scope

All three declared tasks are implemented: canonical/reported trust observations; targeted reconciliation presence; and inventory/removal/anchor preservation. Original 08 IDs 018, 019, 020, 021, 022 and 023 have their cause commits below. Original 026 is implemented through the explicitly declared sequential 04-12 dependency. More than three tasks were not silently appended to this plan.

The complete initial ACCOUNT review already terminated at e6f49a5 before any repair: all 1,283 original source lines and all 3,365 original owner lines, every test/helper/header and five complete books. It found 29 original IDs, 18 BLOCKER and 11 WARNING. Every cause used a fresh typed fixer, complete required books/current files and actual callers, with actual terminal waits and serial writer/build/Git ownership. This summary is execution metadata, not another review.

The original 29 IDs and correction counter **0** continue. Round-zero accounting remains 29 initial/new, zero independently fixed/rejected/reopened and 29 pending independent correction. These implementation dispositions are not independent closure or a partial clean verdict. No full ACCOUNT correction has run. Remaining 04-09 causes and the later complete correction remain required; RUN-01 stays Pending. No early tracer chronology or earlier combined gate is inferred from final focused checks.

Later full ACCOUNT correction must cover the current complete runtime source/owner, actual arrivalAnchorMemoryContract and accountShadowContract helpers, adapted real arrival/shadow owners, and both complete reconciliation and platform pairs with all headers. Their additions do not certify the entire later accessories or root sweep. D-03 global stops and one continuous batch counter remain active.

## Accomplishments

- **018:** Fifteen existing authored cases gain independent complete canonical observations, retaining all original assertions. One new reported-callback case distinguishes accepted version 7, metadata-only version 9, refused version 8 and observation-free version 10. Present/frozen snapshots, distinct clocks, last valid values, refused readback and watermark authority remain protected.
- **019:** Existing 012/013 overlap already protects complete callback values. The remaining quiet-device recovery case now binds independent whole account and keyed-device trust to the actual intermediate and recovered checkpoints. Old count, timing, path and verification assertions remain.
- **020:** Two existing removal cases gain complete ordered identities, snapshots, distinct anchors and trust inside callbacks and after refusal/success. The callback sees both devices before pruning; only the confirmed target disappears. A surviving neighbor retains its exact anchor, and departed-device stray ingress recreates neither state nor anchor.
- **021:** Reconciliation.present resets only the specified physical ID to zero absence count, retaining future eligibility without advancing or resetting a neighbor. Runtime calls it only for the candidate that reappears in the final check. Successful removal still calls forget after its callback; the final inventory is never replayed through observe.
- **022:** A changed physical membership set calls the same shadow client's existing start replacement operation. Unchanged membership, including reversed enumeration of the same two IDs, creates no additional start or transport. Real-shadow public ingress proves both new-device subscription/get routes and retained first-device telemetry. Current-lifecycle checks retain late-await ownership.
- **023:** The nested final-check catch propagates only AuthRejectedError and AuthHaltedError to the existing outer terminal handler. Both terminal rows preserve complete snapshots/anchors/trust while halting later work and closing the owned client. Ordinary transient final-check failure retains its no-removal/retry behavior.
- **026 / delegated 12:** Cached physical IDs reach reconciliation after restore and at platform launch without invented canonical telemetry, trust or anchors. Healthy confirmations and a final check remain necessary for removal. Full details and official Homebridge lifecycle grounding are in 04-12-SUMMARY.md.

## Actual Commits and Measurement

| Ownership / cause | Actual commit |
| --- | --- |
| Parent 023 evidence only | 3d554270b7451443b46a850ba75a150eb409c996 |
| 023 terminal propagation | c18541aa4af394cd4594d486e767b3a030fd79af |
| Parent 021 evidence only | ce3305e8ce53f92e5e4e24a12e1694e95ced4489 |
| Parent 021 bounded declaration | 169dbfdc9938b9084637151cbd08bfaaae5b56e9 |
| 021 separate reconciliation headers | e914a627fd23c98bd6f701fab8547d13a56365f2 |
| 021 targeted presence dependency | 020498a3e2b8d903a0ec9fcc230689927c263592 |
| 021 runtime integration | 105521860844e2c8fc0f04ab917019e9bcf6f564 |
| Parent 022 evidence only | 5987504236d4292d05cb3b1c50ac4a4ce1197a9f |
| 022 physical shadow membership | 30f944c6dc89a91fd21d0875bfbec69b30a45358 |
| 018 complete canonical observations | 7286cb9d9ca3957571481eedaaf56f843ca29544 |
| 019 actual trust checkpoints | 3a9c44104c863631608ec2932d5543630e58957c |
| 020 exact removal and surviving anchors | c330a13c4497d5e87c2d8a180ccf8816dc925f80 |
| Parent sequential 12 declaration | 3f4f1c3c8a9a732cd7a7711debbd7cb836611362 |
| Parent 026 evidence only | 9f7649eac84f5b82106535c941763ec1554bac1d |
| Delegated 12 runtime dependency | d7e05982064fee3af178bbf7def5973b8f20bd14 |
| Delegated 12 platform integration | 6c82ec94abfa25af4ea50c49a926e4a7cfba5af5 |
| Delegated 12 separate source header | b7bae4abe95efa485e06e8d02353bcaf075f0993 |
| Delegated 12 summary | 9825036531dd931bd67968316cd88d6a79fa9bd9 |
| Parent gate/inventory/process records | 77b3b8640ce31ef3cccec1c23c8d6732817384f5 |

The actual persisted gitdir gsd-plan-head-before-04-08 contains 49d30f93b72cada50bb2002ce14aaf4fa9822776 and was recorded before the first 08 evidence commit, including the parent checkpoint. It was read, not reconstructed. Its native timestamp is 14:41:54.819335 UTC. The measured interval through 77b3b86 contains **19 commits**: six primary 08 causes, two reconciliation dependencies, three 08 parent evidence commits, one 021 declaration, one sequential 12 declaration, five 12 execution/summary commits and one parent coordinator commit. The closing 08 summary commit is outside this measurement.

Token actuals use ceil(chars/4) over the realized net owned execution segment 49d30f9..c330a13: 17,531,732 characters = **4,382,933 tokens**. The whole interposed interval through 77b3b86 contains 20,777,790 characters = 5,194,448 tokens. Full recursive native evidence and saved input captures dominate these diffs. These are diff-size estimates on the plan's scale, not harness token use or nineteen 08 implementation commits. Native measurement is /private/tmp/guardian-04-08-closeout/measurement.json. The elapsed span includes parent checkpoints and inserted 12 work; it is not active CPU effort.

## Genuine RED Before GREEN

| Original cause | Actual source → planning-only evidence → GREEN | Native intended full-owner RED |
| --- | --- | --- |
| 023 | 49d30f9 → 3d55427 → c18541a | 155 tests: 153 pass, two terminal-auth whole-state failures |
| 021 | c18541a → ce3305e → declared reconciliation dependencies → 1055218 | 156 tests: 155 pass, one whole-state reappearance/eligibility failure |
| 022 | 1055218 → 5987504 → 30f944c | 157 tests: 156 pass, one new-device routing/whole-state failure after real-shadow readiness |
| 026 / 12 | 3f4f1c3 → 9f7649e → d7e0598 → 6c82ec9 | True platform owner, 64 tests: 63 pass, one cached-removal whole-state failure |

All intended failures are native AssertionError/ERR_ASSERTION deepStrictEqual observations, with zero skip/cancel/todo. Named runs, earlier narrower attempts, whole TAP, stderr, raw argv/exits/UTC times, Node versions, full production manifests/blobs and complete test patches remain retained recursively. Setup/import/compiler/permission/formatter problems remain preparation records. They do not authorize GREEN.

Each parent evidence commit contains planning evidence only and precedes every cause's production change. The active failing owner remained unstaged. The 026 platform owner also remained unstaged through its runtime dependency commit. Five-path budgets include declaration/report/evidence paths; the 021 dependency was declared before external edits, and 026 required a separate sequential plan. No failing-code commit or generic GREEN classifier message substitutes for actual parent ancestry.

The ACCOUNT JSON remains immutable blob b3f7141fc652706628ec55c5bd5c1a3e4b560319 with **14** recursive records. PLATFORM JSON remains immutable blob 5a35d0831979b6c7444b598c0987bdd9d98f758b with **2** records. Current installed CLI and the SAME recursively invoked classifyRedEvidence accept all **16** records in their two files. Each prior root remains complete and exact, including the six original 024/025 records. No second parser, rewritten archive or omitted attempt supplies that result.

Original 024 remains exact. Active 025 retains every literal deadline, timer operation and assertion plus the strictly stronger 013 exact-root verification. Both 023 rows and the whole 021 callback/neighbor case remain exact. The 022 active regression stays byte-exact; its current patch adds the separate order case and later bounded maintenance additions. Full saved/current comparisons in each cause preserve all original assertions and distinguish additions from immutable evidence. The complete 026 platform regression remains exact beside its additive validation cases.

## Separate Maintenance Controls

018 temporarily deletes canonical devices on disconnect: its new complete-present assertion fails where the old optional watermark read could pass. 019 temporarily forwards valid silence values at the wrong checkpoints: the new intermediate keyed-trust assertion fails. 020 temporarily forgets surviving devices' anchors: the new whole surviving-anchor assertion fails after the pre-prune observations pass.

Each control has native intended failure, exact complete source restoration, fresh rebuilt named GREEN and final full-owner/direct GREEN. The shared before/restored account blob is ec7a77182bb5b222c5fe945abe3b4c67912d5781. No control mutation entered Git or genuine RED history. Existing 012/013 and 021 overlap was retained instead of inventing duplicate repairs. Earlier controls, adapter contracts and structured negative controls remain in the continuing ACCOUNT inventory.

## Check Results

All cause records retain exact argv, raw exits, real UTC times, source/owner identities and separate complete streams. Node v26.11.1 and npm 11.20.0 were used. Every stage completed its builds before native compiled owners; every mutating session was collected before dependent work. Selected native compiled coverage and merged source-mapped all-pair coverage remain distinct.

| Stage | Actual focused native result |
| --- | --- |
| 023 | Build/full owner/direct/lint 0; 155 pass; isolated 998/998 lines, 57/57 functions, 184/184 branches. |
| 021 reconciliation | Build/full owner/direct/lint 0; 14 pass; isolated 53/53 lines, 6/6 functions, 12/12 branches. |
| 021 integration | Both full owners/direct selectors/lint 0; ACCOUNT 156 pass; account native 998/998, 57/57, 183/183; reconciliation 53/53, 6/6, 12/12. |
| 022 final with order case | Build/full owner/direct/lint 0; 158 pass; account native 1004/1004, 58/58, 187/187. |
| 018 | Restored build/full owner/direct/lint 0; 159 pass; 1004/1004, 58/58, 188/188. |
| 019 and 020 | Each restored build/full owner/direct/lint 0; 159 pass; 1004/1004, 58/58, 188/188. |
| Delegated 12 final ACCOUNT | 166 pass; direct 0; native 1007/1007 lines, 58/58 functions, 193/193 branches. |
| Delegated 12 final platform | 71 pass; direct 0; native 504/504 lines, 22/22 functions, 57/57 branches; five license-header tests pass. |
| Commits | Recorded-base Fallow audits pass, final exact-file presteps clean before staging, normal foreground hooks pass. |

Applicable commands are npm run build:test; native node --test --test-reporter=tap on each mirrored owner or uniquely anchored named target; npm run test:coverage:direct with each exact source/owner selector; exact-source native coverage with all three 100% thresholds; and uncached pair ESLint. Declaration acceptance or aggregate coverage did not replace executable direct obligations.

Native cause directories under /private/tmp/ are guardian-04-account-023-red/, guardian-04-account-023-green/, guardian-04-account-021-red/, guardian-04-account-021-reconciliation-headers/, guardian-04-account-021-reconciliation-present/, guardian-04-account-021-runtime-green/, guardian-04-account-022-red/, guardian-04-account-022-green/, guardian-04-account-018/, guardian-04-account-019/ and guardian-04-account-020/. Delegated 12 directories and exact final commands are recorded in its summary. Parent evidence verification/prestep/commit streams retain their root prefixes.

The parent supplied full npm run check at 9825036: exit **0**, Node v26.11.1, 2026-10-15 18:08:02.393802–18:08:37.983243 UTC. All six static checks, 104 Cucumber scenarios/1,156 steps and 43 isolated pairs passed. Native files are /private/tmp/guardian-phase4-wave9-cached-identities-gate.json and /private/tmp/guardian-phase4-wave9-cached-identities-full-check.log.

The exact same-session Markdown-only comparator from 9825036 through current 77b3b86 is empty outside planning Markdown, with no untracked executable input and unchanged Node. Its argv/output and scope are retained in /private/tmp/guardian-04-08-closeout/reuse-comparison.json and reuse.diff. This supplies current evidence without new tests or controls for summary metadata. The parent still owes the expressly required full gate after this actual terminal 08 return; no executor full gate or completion of that future gate is claimed.

Exact both-project complete impacts preceded the new Reconciliation/createReconciliation shape at e914a62. The dependency's named, inferred and structural callers were read. The later runtime startup shape has its separate complete six queries and platform integration's eight queries in 04-12. No unavailable private-target result was relabeled complete and no additional trace exception was used. Existing .js imports, deviceId identity, reported-only authority, wall/device/elapsed bases, persistence format and scoped privacy permissions remain.

## Deviations and Process Limits

The 021 dependency and sequential 026 plan were explicitly declared and committed before external edits. Reconciliation header-only work preceded its separate functional cause. Platform source headers followed GREEN under 12; its already conforming owner remained unchanged. These bounded dependencies introduce no package, feature, new privacy permission, compatibility certification or guessed telemetry.

022 preparation did not separately capture the candidate input before its first formatter/lint fixer. Complete retained preparation and current final evidence do not reconstruct that historical input. WINDOWS 51 records this gap. WINDOWS 52 records 12's late explicit summary containment capture. WINDOWS **46–52 remain OPEN and unwaived**; historical missing 07 ledger and uncollected 013 lint session are not cured by these later checks.

This summary's exact-path Fallow guard and explicit canonical-root containment both precede its first write; their actual native record is summary-guard.json under the closeout directory. The original 08 ledger remains untouched. No historical marker was reconstructed and no process exception was silently granted.

Failed attempts remain disclosed: preliminary narrower valid RED runs, report relocation/provenance-buffer preparation, formatter-changing prestep repetition, setup/verifier/lint failures and authorized retries. Initial secret verification failures on actual historical Sonar Git-blob identifiers retained their raw output; the identical authorized clean retries passed without suppression or evidence changes. None is represented as an intended product failure or discarded history.

The cause scans report no unfinished implementation stub or introduced only/skip/todo test. No required focused check is left unrun. Parent combined gates, remaining 09 repairs, independent full correction, RUN-01 verification and actual human judgments remain explicit obligations. Shared STATE/ROADMAP/REQUIREMENTS/WINDOWS/FINDINGS/configuration advancement belongs to the parent. Only workflow.use_worktrees must be restored to true through the registered config-set before final milestone audit/handoff; no whole-config copy is permitted.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Self-Check: PASSED

All eleven declared artifacts and every named native cause directory exist. All nineteen recorded commits are ancestors of current HEAD. The persisted ledger measures nineteen commits, matching the frontmatter and ownership arithmetic. The summary resolves inside the canonical checkout; its guard and containment record precede its first write. The tracked tree and index remain clean, with only this summary untracked. Native results are retained in /private/tmp/guardian-04-08-closeout/self-check.json.
