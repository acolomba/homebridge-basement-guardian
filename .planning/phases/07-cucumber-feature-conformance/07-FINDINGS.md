# Phase 07 findings and baseline

This ledger belongs to the `code-review-sweep` milestone. Plan 07-01 records
scope and baseline. Plans 07-02 through 07-13 own disjoint batch reports;
plan 07-14 consolidates their reviewed findings here. The inventory and
record rules are in [07-REVIEW-PROTOCOL.md](07-REVIEW-PROTOCOL.md).

## Source snapshot

- Starting source revision: `213d9afb69408d323b43a8be2f7f16520c68495e`.
- Starting inputs: 37 tracked paths, 15 `.feature` and 22 `.ts`; clean worktree.
- Node: `v26.12.0`.
- Installed Cucumber CLI: `13.2.1`; manifest range: `^13.2.1`.
- The `AGENTS.md` project description names Node 22/24. The package manifest
  also permits Node 26. This Node 26 baseline is not Node 22/24 compatibility
  evidence.

## Probe disposition

| Probe | Classification | Acceptance source | Status |
| --- | --- | --- | --- |
| FEAT-01 | unclassified/unresolved | ROADMAP Phase 7 criteria 1, 3, and 4 | No probe proof or backstop claimed. |
| FEAT-02 | unclassified/unresolved | ROADMAP Phase 7 criteria 2 through 5 | No probe proof or backstop claimed. |

## Batch index and file ledger

Each row is an assignment, not a completed review. A batch report must add
its actual reviewed revision, complete-file review result, findings, rounds,
and check evidence. The blob and line count pin the starting source at the
revision above. Plan 07-14 reconciles every row to a report.

| Owner | Path | Starting blob | Lines | Review report/status |
| --- | --- | --- | ---: | --- |
| 07-02 ACCOUNT | `features/account/configuration.feature` | `631f8aaa331fa0a515f60d6f98c00cbdf83f0688` | 45 | `07-ACCOUNT-REVIEW.md` / pending |
| 07-02 ACCOUNT | `features/account/sign-in.feature` | `7976acdf1a3d74ec152a45c14f7225d2a4c4acb0` | 48 | `07-ACCOUNT-REVIEW.md` / pending |
| 07-02 ACCOUNT | `features/step_definitions/account.steps.ts` | `0f7922e51215818ae7a30b62239071332a8441f2` | 188 | `07-ACCOUNT-REVIEW.md` / pending |
| 07-02 ACCOUNT | `features/step_definitions/configuration.steps.ts` | `e033c7c4049ab64cb8c92ed80613033814218b9e` | 88 | `07-ACCOUNT-REVIEW.md` / pending |
| 07-03 ACCESSORY | `features/accessory/discovery.feature` | `616ee68840dd8c1577be2fec05aa6f9f757da309` | 111 | `07-ACCESSORY-REVIEW.md` / pending |
| 07-03 ACCESSORY | `features/step_definitions/accessory.steps.ts` | `6dd4cac3f18cb2cf88bd521542b010d1b8b29b40` | 286 | `07-ACCESSORY-REVIEW.md` / pending |
| 07-03 ACCESSORY | `features/lib/homebridgeApi.ts` | `3c5b840e017987d12a41b5185bfbf0f3f2e5c1d6` | 321 | `07-ACCESSORY-REVIEW.md` / pending |
| 07-03 ACCESSORY | `features/lib/publishedServices.ts` | `50dce0a84088d709f1fec587b29cec31eabba0a1` | 97 | `07-ACCESSORY-REVIEW.md` / pending |
| 07-04 HOMEKIT | `features/homekit/official-controls.feature` | `0253457decced7024bdd4d91f2ea03da88969182` | 219 | `07-HOMEKIT-REVIEW.md` / pending |
| 07-04 HOMEKIT | `features/homekit/safety-state.feature` | `5e1dbd0013ba6b5c43dc9e2de50f9d0501aa1a15` | 153 | `07-HOMEKIT-REVIEW.md` / pending |
| 07-04 HOMEKIT | `features/step_definitions/controls.steps.ts` | `e1791e9b77eaca43519390d4cf46ab678ccc702e` | 316 | `07-HOMEKIT-REVIEW.md` / pending |
| 07-04 HOMEKIT | `features/step_definitions/homekit.steps.ts` | `e94c9ce2ba92b8af01f1e4245efa3d4c34911170` | 256 | `07-HOMEKIT-REVIEW.md` / pending |
| 07-05 SHADOW | `features/shadow/connection-lifecycle.feature` | `a4335302cf4ec31f4e9d25f68cb7213c0fad300c` | 50 | `07-SHADOW-REVIEW.md` / pending |
| 07-05 SHADOW | `features/shadow/credential-rotation.feature` | `98ad2fc94679cd44024ea312c75c8911c5b71705` | 29 | `07-SHADOW-REVIEW.md` / pending |
| 07-05 SHADOW | `features/shadow/state-merging.feature` | `6a13b7f83bb3453f3dca90bb0bfb7ad668bd964b` | 86 | `07-SHADOW-REVIEW.md` / pending |
| 07-05 SHADOW | `features/step_definitions/shadow.steps.ts` | `e7b3ea7c0d85293d1e9fc9c14ae6d66b428144f6` | 463 | `07-SHADOW-REVIEW.md` / pending |
| 07-06 MONITORING | `features/monitoring/degradation.feature` | `10eb9007d87ceeefcd974d47519b8bf08b25fe66` | 707 | `07-MONITORING-REVIEW.md` / pending |
| 07-06 MONITORING | `features/step_definitions/runtime.steps.ts` | `2aaecae22b5bcbfb7c544b54ba837db37f309d22` | 256 | `07-MONITORING-REVIEW.md` / pending |
| 07-07 RECORDS | `features/plugin/lifecycle.feature` | `8058c755205c0d917bb560dde0f2fc65ae3136ef` | 68 | `07-RECORDS-REVIEW.md` / pending |
| 07-07 RECORDS | `features/pump/records.feature` | `0a74cca106c1ea128ac96d218be6c3bb59478fc9` | 69 | `07-RECORDS-REVIEW.md` / pending |
| 07-07 RECORDS | `features/lib/vendorRestApi.ts` | `ba75981e04ddd01b8bf22c3c9ad6e350196bfdd6` | 399 | `07-RECORDS-REVIEW.md` / pending |
| 07-08 OFFLINE_LIBS | `features/lib/auth0.ts` | `2513ab6eb09fb42a55a4808dc6df2a1beed5a11f` | 149 | `07-OFFLINE-LIBS-REVIEW.md` / pending |
| 07-08 OFFLINE_LIBS | `features/lib/loopbackServer.ts` | `359d5e87e51f4dfc15ed761bea489adc0038b86b` | 76 | `07-OFFLINE-LIBS-REVIEW.md` / pending |
| 07-08 OFFLINE_LIBS | `features/lib/timers.ts` | `97e6d1300ed774df7adfa2458242288817e062e3` | 83 | `07-OFFLINE-LIBS-REVIEW.md` / pending |
| 07-08 OFFLINE_LIBS | `features/lib/shadowBroker.ts` | `e1871ccafb0ca39c97a2684fce46b9fa287542bd` | 273 | `07-OFFLINE-LIBS-REVIEW.md` / pending |
| 07-09 HAP | `features/lib/hap.ts` | `9663320dbac2a2e9e51ad66c0d1d0634ca61bf91` | 729 | `07-HAP-REVIEW.md` / pending |
| 07-09 HAP | `features/step_definitions/hap.steps.ts` | `47039c7ab6deffbd13686f429c5dc8d73ebdd21b` | 316 | `07-HAP-REVIEW.md` / pending |
| 07-10 HARNESS | `features/harness/fakes.feature` | `7477bb607c6707cf58d85abe1cf8bc26ce730936` | 99 | `07-HARNESS-REVIEW.md` / pending |
| 07-10 HARNESS | `features/step_definitions/harness.steps.ts` | `81791d153aac114d14fe291b074cfa9b0af7d33f` | 370 | `07-HARNESS-REVIEW.md` / pending |
| 07-10 HARNESS | `features/support/world.ts` | `38eeaa15f217dce7b09025f17f7bcf89e0ed0ef5` | 785 | `07-HARNESS-REVIEW.md` / pending |
| 07-11 REAL_FEATURES | `features/real-pump/discovery.feature` | `fc0c03df0f0c5ca7987043d248efbe8ae30f98ff` | 26 | `07-REAL-FEATURES-REVIEW.md` / pending |
| 07-11 REAL_FEATURES | `features/real-pump/heartbeats.feature` | `1e131d26bd24d388797bad5e0e299a3646a70fe7` | 25 | `07-REAL-FEATURES-REVIEW.md` / pending |
| 07-11 REAL_FEATURES | `features/real-pump/lifecycle.feature` | `d52df511e538d38301c6c83fa66427d919fb2e7c` | 21 | `07-REAL-FEATURES-REVIEW.md` / pending |
| 07-12 REAL_WORLD | `features/real-pump/support/realWorld.ts` | `f89a7be57f1e3492413deb25d11a8fe9cd48adc2` | 366 | `07-REAL-WORLD-REVIEW.md` / pending |
| 07-13 REAL_STEPS | `features/real-pump/support/steps.ts` | `9a52c32eb26e7c4e68c92d3857168b2af094b463` | 72 | `07-REAL-STEPS-REVIEW.md` / pending |
| 07-13 REAL_STEPS | `features/real-pump/support/heartbeatSteps.ts` | `3f5aba3bc0bc985218d72c76203991c72e58f24e` | 45 | `07-REAL-STEPS-REVIEW.md` / pending |
| 07-13 REAL_STEPS | `features/real-pump/support/lifecycleSteps.ts` | `b94c3e41372e7f14713c8dcb379038df0fab58a6` | 38 | `07-REAL-STEPS-REVIEW.md` / pending |

## Finding ledger

No batch review has occurred in plan 07-01. Each later finding receives a
stable `CR-07-BATCH-NNN` ID. Consolidate only from the disjoint batch reports.

| ID | Requirement | Exact rule | First round | Revision-qualified path:line | Severity | Disposition and reason | Regression and RED evidence | Fix commit | Verification |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| _Pending batch reviews_ | | | | | | | | | |

## Offline baseline

Plan 07-01 task 02 will append the executed commands, status-checked output,
exit codes, input state, timing, and direct-coverage result here. A prior
research observation is not accepted as this plan's execution evidence.
