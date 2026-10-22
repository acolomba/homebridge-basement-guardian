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

Each row keeps the original single-owner assignment and starting blob at
`213d9af`. The report index below records the actual committed review blobs,
findings, rounds, and later forward disposition. A reviewed assignment may
still have a historical STOP or a current open finding.

| Owner | Path | Starting blob | Lines | Review report/status |
| --- | --- | --- | ---: | --- |
| 07-02 ACCOUNT | `features/account/configuration.feature` | `631f8aaa331fa0a515f60d6f98c00cbdf83f0688` | 45 | `07-ACCOUNT-REVIEW.md` / reviewed |
| 07-02 ACCOUNT | `features/account/sign-in.feature` | `7976acdf1a3d74ec152a45c14f7225d2a4c4acb0` | 48 | `07-ACCOUNT-REVIEW.md` / reviewed |
| 07-02 ACCOUNT | `features/step_definitions/account.steps.ts` | `0f7922e51215818ae7a30b62239071332a8441f2` | 188 | `07-ACCOUNT-REVIEW.md` / reviewed |
| 07-02 ACCOUNT | `features/step_definitions/configuration.steps.ts` | `e033c7c4049ab64cb8c92ed80613033814218b9e` | 88 | `07-ACCOUNT-REVIEW.md` / reviewed |
| 07-03 ACCESSORY | `features/accessory/discovery.feature` | `616ee68840dd8c1577be2fec05aa6f9f757da309` | 111 | `07-ACCESSORY-REVIEW.md` / reviewed |
| 07-03 ACCESSORY | `features/step_definitions/accessory.steps.ts` | `6dd4cac3f18cb2cf88bd521542b010d1b8b29b40` | 286 | `07-ACCESSORY-REVIEW.md` / reviewed |
| 07-03 ACCESSORY | `features/lib/homebridgeApi.ts` | `3c5b840e017987d12a41b5185bfbf0f3f2e5c1d6` | 321 | `07-ACCESSORY-REVIEW.md` / reviewed |
| 07-03 ACCESSORY | `features/lib/publishedServices.ts` | `50dce0a84088d709f1fec587b29cec31eabba0a1` | 97 | `07-ACCESSORY-REVIEW.md` / reviewed |
| 07-04 HOMEKIT | `features/homekit/official-controls.feature` | `0253457decced7024bdd4d91f2ea03da88969182` | 219 | `07-HOMEKIT-REVIEW.md` / reviewed |
| 07-04 HOMEKIT | `features/homekit/safety-state.feature` | `5e1dbd0013ba6b5c43dc9e2de50f9d0501aa1a15` | 153 | `07-HOMEKIT-REVIEW.md` / reviewed |
| 07-04 HOMEKIT | `features/step_definitions/controls.steps.ts` | `e1791e9b77eaca43519390d4cf46ab678ccc702e` | 316 | `07-HOMEKIT-REVIEW.md` / reviewed |
| 07-04 HOMEKIT | `features/step_definitions/homekit.steps.ts` | `e94c9ce2ba92b8af01f1e4245efa3d4c34911170` | 256 | `07-HOMEKIT-REVIEW.md` / reviewed |
| 07-05 SHADOW | `features/shadow/connection-lifecycle.feature` | `a4335302cf4ec31f4e9d25f68cb7213c0fad300c` | 50 | `07-SHADOW-REVIEW.md` / reviewed |
| 07-05 SHADOW | `features/shadow/credential-rotation.feature` | `98ad2fc94679cd44024ea312c75c8911c5b71705` | 29 | `07-SHADOW-REVIEW.md` / reviewed |
| 07-05 SHADOW | `features/shadow/state-merging.feature` | `6a13b7f83bb3453f3dca90bb0bfb7ad668bd964b` | 86 | `07-SHADOW-REVIEW.md` / reviewed |
| 07-05 SHADOW | `features/step_definitions/shadow.steps.ts` | `e7b3ea7c0d85293d1e9fc9c14ae6d66b428144f6` | 463 | `07-SHADOW-REVIEW.md` / reviewed |
| 07-06 MONITORING | `features/monitoring/degradation.feature` | `10eb9007d87ceeefcd974d47519b8bf08b25fe66` | 707 | `07-MONITORING-REVIEW.md` / reviewed |
| 07-06 MONITORING | `features/step_definitions/runtime.steps.ts` | `2aaecae22b5bcbfb7c544b54ba837db37f309d22` | 256 | `07-MONITORING-REVIEW.md` / reviewed |
| 07-07 RECORDS | `features/plugin/lifecycle.feature` | `8058c755205c0d917bb560dde0f2fc65ae3136ef` | 68 | `07-RECORDS-REVIEW.md` / reviewed |
| 07-07 RECORDS | `features/pump/records.feature` | `0a74cca106c1ea128ac96d218be6c3bb59478fc9` | 69 | `07-RECORDS-REVIEW.md` / reviewed |
| 07-07 RECORDS | `features/lib/vendorRestApi.ts` | `ba75981e04ddd01b8bf22c3c9ad6e350196bfdd6` | 399 | `07-RECORDS-REVIEW.md` / reviewed |
| 07-08 OFFLINE_LIBS | `features/lib/auth0.ts` | `2513ab6eb09fb42a55a4808dc6df2a1beed5a11f` | 149 | `07-OFFLINE-LIBS-REVIEW.md` / reviewed |
| 07-08 OFFLINE_LIBS | `features/lib/loopbackServer.ts` | `359d5e87e51f4dfc15ed761bea489adc0038b86b` | 76 | `07-OFFLINE-LIBS-REVIEW.md` / reviewed |
| 07-08 OFFLINE_LIBS | `features/lib/timers.ts` | `97e6d1300ed774df7adfa2458242288817e062e3` | 83 | `07-OFFLINE-LIBS-REVIEW.md` / reviewed |
| 07-08 OFFLINE_LIBS | `features/lib/shadowBroker.ts` | `e1871ccafb0ca39c97a2684fce46b9fa287542bd` | 273 | `07-OFFLINE-LIBS-REVIEW.md` / reviewed |
| 07-09 HAP | `features/lib/hap.ts` | `9663320dbac2a2e9e51ad66c0d1d0634ca61bf91` | 729 | `07-HAP-REVIEW.md` / reviewed |
| 07-09 HAP | `features/step_definitions/hap.steps.ts` | `47039c7ab6deffbd13686f429c5dc8d73ebdd21b` | 316 | `07-HAP-REVIEW.md` / reviewed |
| 07-10 HARNESS | `features/harness/fakes.feature` | `7477bb607c6707cf58d85abe1cf8bc26ce730936` | 99 | `07-HARNESS-REVIEW.md` / reviewed |
| 07-10 HARNESS | `features/step_definitions/harness.steps.ts` | `81791d153aac114d14fe291b074cfa9b0af7d33f` | 370 | `07-HARNESS-REVIEW.md` / reviewed |
| 07-10 HARNESS | `features/support/world.ts` | `38eeaa15f217dce7b09025f17f7bcf89e0ed0ef5` | 785 | `07-HARNESS-REVIEW.md` / reviewed |
| 07-11 REAL_FEATURES | `features/real-pump/discovery.feature` | `fc0c03df0f0c5ca7987043d248efbe8ae30f98ff` | 26 | `07-REAL-FEATURES-REVIEW.md` / reviewed |
| 07-11 REAL_FEATURES | `features/real-pump/heartbeats.feature` | `1e131d26bd24d388797bad5e0e299a3646a70fe7` | 25 | `07-REAL-FEATURES-REVIEW.md` / reviewed |
| 07-11 REAL_FEATURES | `features/real-pump/lifecycle.feature` | `d52df511e538d38301c6c83fa66427d919fb2e7c` | 21 | `07-REAL-FEATURES-REVIEW.md` / reviewed |
| 07-12 REAL_WORLD | `features/real-pump/support/realWorld.ts` | `f89a7be57f1e3492413deb25d11a8fe9cd48adc2` | 366 | `07-REAL-WORLD-REVIEW.md` / reviewed |
| 07-13 REAL_STEPS | `features/real-pump/support/steps.ts` | `9a52c32eb26e7c4e68c92d3857168b2af094b463` | 72 | `07-REAL-STEPS-REVIEW.md` / reviewed |
| 07-13 REAL_STEPS | `features/real-pump/support/heartbeatSteps.ts` | `3f5aba3bc0bc985218d72c76203991c72e58f24e` | 45 | `07-REAL-STEPS-REVIEW.md` / reviewed |
| 07-13 REAL_STEPS | `features/real-pump/support/lifecycleSteps.ts` | `b94c3e41372e7f14713c8dcb379038df0fab58a6` | 38 | `07-REAL-STEPS-REVIEW.md` / reviewed |

## Inventory reconciliation

The 37 original rows above contain exactly 15 `.feature` and 22 `.ts` paths.
Each belongs to one of the twelve report blobs below. The three original
real-step paths were moved under `features/real-pump/step_definitions/` in Plan
07-13; they remain in the starting inventory so no original file disappears
from the audit. Two new library paths are separate additions:
`features/lib/deviceTables.ts` (Plan 07-15) and
`features/lib/realPumpPolling.ts` (Plan 07-13). Complete-file review of the
first is recorded in Plan 07-16 and of the second in `07-REAL-STEPS-REVIEW.md`.

| Owner | Original paths | Committed report blob | Historical review result | Forward status before further adjudication |
| --- | ---: | --- | --- | --- |
| ACCOUNT | 4 | `07-ACCOUNT-REVIEW.md` `4ce79b2dbbb265c58690ca08a2a125cf5353a25a` | Round 3 STOP: 015, 016 | Both repaired by Plans 07-15/16. |
| ACCESSORY | 4 | `07-ACCESSORY-REVIEW.md` `6799ba5146aa97d08da46c62a3d99dcbd9a14383` | Round 2 STOP: 007, 009, 019 | 007 moved; 009 and 019 closed by maintainer ruling. |
| HOMEKIT | 4 | `07-HOMEKIT-REVIEW.md` `d754ca281aa5a40c6c6fd36c4ca224725f591d3e` | Round 3 STOP: 014 | Fixed in Plan 07-15. |
| SHADOW | 4 | `07-SHADOW-REVIEW.md` `0940f537caf8b7b94daa17603355ead3da34c6f3` | Round 2 clean | No forward open ID. |
| MONITORING | 2 | `07-MONITORING-REVIEW.md` `62d1e013631c98df1ceaae7bafe5faefc99965e3` | Round 1 STOP: 004 | Narrowed in Plan 07-17. |
| RECORDS | 3 | `07-RECORDS-REVIEW.md` `04390413fa8a1b8277f29501cdad6cc4315f74e9` | Round 2 STOP: 012, 013 | Both repaired after STOP; no further batch round. |
| OFFLINE_LIBS | 4 | `07-OFFLINE-LIBS-REVIEW.md` `6d7597b4d582ac2dc44d86e15faf30d856255090` | Round 3 STOP: 016 | 016 remains open. |
| HAP | 2 | `07-HAP-REVIEW.md` `822581fd6c6987c14128b96e2034efa097247310` | Round 3 STOP: 025, 028, 032, 048, 050, 051 | All six remain open. |
| HARNESS | 3 | `07-HARNESS-REVIEW.md` `c8ee48517ebb33b4d73b07578081eb4e6904fac8` | Round 3 clean | No forward open ID. |
| REAL_FEATURES | 3 | `07-REAL-FEATURES-REVIEW.md` `98ca087f0d71b95776831a7f5f7cbfdc449aa9ab` | Round 2 clean | No forward open ID. |
| REAL_WORLD | 1 | `07-REAL-WORLD-REVIEW.md` `f85e1bfcad9d137972375604685b27236ba56421` | Round 2 clean | No forward open ID. |
| REAL_STEPS | 3 | `07-REAL-STEPS-REVIEW.md` `b06870d305349331433d5cb296d13b1ceb5f965e` | Round 2 STOP: 017 | 017 remains open pending maintainer ruling. |

The current forward open set has eight IDs:
`CR-07-OFFLINE_LIBS-016`, `CR-07-HAP-025`, `CR-07-HAP-028`,
`CR-07-HAP-032`, `CR-07-HAP-048`, `CR-07-HAP-050`, `CR-07-HAP-051`, and
`CR-07-REAL_STEPS-017`. This is a status inventory, not a clean phase
sign-off. The detailed finding and round ledger follows after further
reconciliation.

## Finding ledger

No batch review has occurred in plan 07-01. Each later finding receives a
stable `CR-07-BATCH-NNN` ID. Consolidate only from the disjoint batch reports.

| ID | Requirement | Exact rule | First round | Revision-qualified path:line | Severity | Disposition and reason | Regression and RED evidence | Fix commit | Verification |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| _Pending batch reviews_ | | | | | | | | | |

## Offline baseline

All successful commands below used source revision
`cadc07b16db06949d0594a870781af5cc8268d0a` and Node `v26.12.0`.
Before the commands, `git status --porcelain=v1 --untracked-files=all` was
empty. Immediately after the checks, before this ledger edit, it was also
empty. The executable-input diff from that
revision was empty (`git diff --exit-code cadc07b -- .
':(exclude,glob).planning/**/*.md'`, exit 0). Generated build and coverage
output is ignored. No new untracked executable input was present.

| Order | Exact command | Exit | Observed result |
| --- | --- | ---: | --- |
| 1 | `npm run build:test` | 0 | TypeScript test build completed before Cucumber. |
| 2 | `./node_modules/.bin/cucumber-js` | 130 after interruption | Sandbox blocked local fake listeners with `listen EPERM: operation not permitted 127.0.0.1`. It reported 104 scenarios: six passed, 98 failed from the same socket denial. This is environmental, not product RED evidence. |
| 3 | `./node_modules/.bin/cucumber-js` with permitted loopback access | 0 | 104 scenarios passed; 1,156 steps passed; Cucumber reported 24.180 seconds. |
| 4 | `./node_modules/.bin/cucumber-js --dry-run --format usage > /tmp/phase07-usage.txt 2>&1` | 0 | Zero `UNUSED` definitions, checked across the complete usage output. |
| 5 | `./node_modules/.bin/cucumber-js --profile real --dry-run --format summary > /tmp/phase07-real.txt 2>&1` | 0 | Seven scenarios skipped; 41 steps skipped. The full summary had no `UNDEFINED` or `AMBIGUOUS` status. No real step ran. |
| 6 | `npm run check` with permitted loopback access | 0 | Static checks, test build, unpaired tests, 104 passing default scenarios, 1,156 passing steps, and direct coverage completed. It merged `coverage/direct.lcov` from 43 isolated source/test pairs. Wall time was about 60 seconds. |

The built-in usage dry run emitted a `MaxListenersExceededWarning` for 11
`process.unhandledRejection` listeners. It remains a review candidate for
07-10 HARNESS and `features/support/world.ts`. No finding or repair is
preaccepted from the warning alone.

The successful default execution and full gate used only local stand-ins.
The real profile ran with `--dry-run` and selected `@real and @read-only`.
The [Cucumber.js 13.2.1 dry-run documentation](https://github.com/cucumber/cucumber-js/blob/v13.2.1/docs/dry_run.md)
states that hooks and step bodies do not run. It also states that undefined
and ambiguous steps do not force a failing process status. This ledger
therefore checks the real summary text as well as exit 0.
