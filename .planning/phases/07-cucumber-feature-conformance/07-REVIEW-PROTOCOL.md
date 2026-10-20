# Phase 07 review protocol

This protocol applies to the `code-review-sweep` milestone. The source snapshot is
commit `213d9afb69408d323b43a8be2f7f16520c68495e`. The inventory contains
15 Gherkin files and 22 TypeScript files tracked under `features/`. Each path
has one owner in plans 07-02 through 07-13. Plan 07-14 consolidates the batch
reports into [07-FINDINGS.md](07-FINDINGS.md).

## Rules and acceptance source

- Review Gherkin against `.agents/skills/cucumber/SKILL.md` and
  `rules/features.md`. Use its `rules/layout.md` for file placement.
- Review step modules against `rules/steps.md` and `rules/layout.md`.
- Review worlds, hooks, fakes, and drivers against `rules/world-and-stand-ins.md`
  and `rules/layout.md`.
- Review every TypeScript file against `.agents/skills/typescript-style/SKILL.md`
  and its applicable rules. Apply the Phase 1 header form: SPDX line, separate
  copyright JSDoc, and separate `@fileoverview` JSDoc, with one blank line
  between each part and the imports. Preserve existing attribution.
- Apply `.agents/skills/local-verification/SKILL.md` and
  `.agents/skills/committing/SKILL.md` to each check and commit. The current
  Cucumber CLI is 13.2.1, installed from the manifest range `^13.2.1`.
- Use the five Phase 7 success criteria in `.planning/ROADMAP.md:305-310` as
  acceptance checks. FEAT-01 and FEAT-02 have unclassified, unresolved
  spec-less probe rows. Neither probe supplies proof or a backstop.

The roadmap's 21-file TypeScript count and its `features/support/steps/harness.ts`
example are stale. `features/lib/hap.ts` is part of the current 22-file scope.
Do not restore the two tests removed by the maintainer in Phase 6.

## Batch ownership and source snapshot

The blob is the full committed Git blob ID at the source commit above. Lines
count newline-terminated lines in that blob. A batch report must record the
revision that its reviewer actually read, even when it differs from this
starting revision. No report can claim review from this inventory alone.

| Owner | Batch report | Tracked path | Blob | Lines |
| --- | --- | --- | --- | ---: |
| 07-02 ACCOUNT | `07-ACCOUNT-REVIEW.md` | `features/account/configuration.feature` | `631f8aaa331fa0a515f60d6f98c00cbdf83f0688` | 45 |
| 07-02 ACCOUNT | `07-ACCOUNT-REVIEW.md` | `features/account/sign-in.feature` | `7976acdf1a3d74ec152a45c14f7225d2a4c4acb0` | 48 |
| 07-02 ACCOUNT | `07-ACCOUNT-REVIEW.md` | `features/step_definitions/account.steps.ts` | `0f7922e51215818ae7a30b62239071332a8441f2` | 188 |
| 07-02 ACCOUNT | `07-ACCOUNT-REVIEW.md` | `features/step_definitions/configuration.steps.ts` | `e033c7c4049ab64cb8c92ed80613033814218b9e` | 88 |
| 07-03 ACCESSORY | `07-ACCESSORY-REVIEW.md` | `features/accessory/discovery.feature` | `616ee68840dd8c1577be2fec05aa6f9f757da309` | 111 |
| 07-03 ACCESSORY | `07-ACCESSORY-REVIEW.md` | `features/step_definitions/accessory.steps.ts` | `6dd4cac3f18cb2cf88bd521542b010d1b8b29b40` | 286 |
| 07-03 ACCESSORY | `07-ACCESSORY-REVIEW.md` | `features/lib/homebridgeApi.ts` | `3c5b840e017987d12a41b5185bfbf0f3f2e5c1d6` | 321 |
| 07-03 ACCESSORY | `07-ACCESSORY-REVIEW.md` | `features/lib/publishedServices.ts` | `50dce0a84088d709f1fec587b29cec31eabba0a1` | 97 |
| 07-04 HOMEKIT | `07-HOMEKIT-REVIEW.md` | `features/homekit/official-controls.feature` | `0253457decced7024bdd4d91f2ea03da88969182` | 219 |
| 07-04 HOMEKIT | `07-HOMEKIT-REVIEW.md` | `features/homekit/safety-state.feature` | `5e1dbd0013ba6b5c43dc9e2de50f9d0501aa1a15` | 153 |
| 07-04 HOMEKIT | `07-HOMEKIT-REVIEW.md` | `features/step_definitions/controls.steps.ts` | `e1791e9b77eaca43519390d4cf46ab678ccc702e` | 316 |
| 07-04 HOMEKIT | `07-HOMEKIT-REVIEW.md` | `features/step_definitions/homekit.steps.ts` | `e94c9ce2ba92b8af01f1e4245efa3d4c34911170` | 256 |
| 07-05 SHADOW | `07-SHADOW-REVIEW.md` | `features/shadow/connection-lifecycle.feature` | `a4335302cf4ec31f4e9d25f68cb7213c0fad300c` | 50 |
| 07-05 SHADOW | `07-SHADOW-REVIEW.md` | `features/shadow/credential-rotation.feature` | `98ad2fc94679cd44024ea312c75c8911c5b71705` | 29 |
| 07-05 SHADOW | `07-SHADOW-REVIEW.md` | `features/shadow/state-merging.feature` | `6a13b7f83bb3453f3dca90bb0bfb7ad668bd964b` | 86 |
| 07-05 SHADOW | `07-SHADOW-REVIEW.md` | `features/step_definitions/shadow.steps.ts` | `e7b3ea7c0d85293d1e9fc9c14ae6d66b428144f6` | 463 |
| 07-06 MONITORING | `07-MONITORING-REVIEW.md` | `features/monitoring/degradation.feature` | `10eb9007d87ceeefcd974d47519b8bf08b25fe66` | 707 |
| 07-06 MONITORING | `07-MONITORING-REVIEW.md` | `features/step_definitions/runtime.steps.ts` | `2aaecae22b5bcbfb7c544b54ba837db37f309d22` | 256 |
| 07-07 RECORDS | `07-RECORDS-REVIEW.md` | `features/plugin/lifecycle.feature` | `8058c755205c0d917bb560dde0f2fc65ae3136ef` | 68 |
| 07-07 RECORDS | `07-RECORDS-REVIEW.md` | `features/pump/records.feature` | `0a74cca106c1ea128ac96d218be6c3bb59478fc9` | 69 |
| 07-07 RECORDS | `07-RECORDS-REVIEW.md` | `features/lib/vendorRestApi.ts` | `ba75981e04ddd01b8bf22c3c9ad6e350196bfdd6` | 399 |
| 07-08 OFFLINE_LIBS | `07-OFFLINE-LIBS-REVIEW.md` | `features/lib/auth0.ts` | `2513ab6eb09fb42a55a4808dc6df2a1beed5a11f` | 149 |
| 07-08 OFFLINE_LIBS | `07-OFFLINE-LIBS-REVIEW.md` | `features/lib/loopbackServer.ts` | `359d5e87e51f4dfc15ed761bea489adc0038b86b` | 76 |
| 07-08 OFFLINE_LIBS | `07-OFFLINE-LIBS-REVIEW.md` | `features/lib/timers.ts` | `97e6d1300ed774df7adfa2458242288817e062e3` | 83 |
| 07-08 OFFLINE_LIBS | `07-OFFLINE-LIBS-REVIEW.md` | `features/lib/shadowBroker.ts` | `e1871ccafb0ca39c97a2684fce46b9fa287542bd` | 273 |
| 07-09 HAP | `07-HAP-REVIEW.md` | `features/lib/hap.ts` | `9663320dbac2a2e9e51ad66c0d1d0634ca61bf91` | 729 |
| 07-09 HAP | `07-HAP-REVIEW.md` | `features/step_definitions/hap.steps.ts` | `47039c7ab6deffbd13686f429c5dc8d73ebdd21b` | 316 |
| 07-10 HARNESS | `07-HARNESS-REVIEW.md` | `features/harness/fakes.feature` | `7477bb607c6707cf58d85abe1cf8bc26ce730936` | 99 |
| 07-10 HARNESS | `07-HARNESS-REVIEW.md` | `features/step_definitions/harness.steps.ts` | `81791d153aac114d14fe291b074cfa9b0af7d33f` | 370 |
| 07-10 HARNESS | `07-HARNESS-REVIEW.md` | `features/support/world.ts` | `38eeaa15f217dce7b09025f17f7bcf89e0ed0ef5` | 785 |
| 07-11 REAL_FEATURES | `07-REAL-FEATURES-REVIEW.md` | `features/real-pump/discovery.feature` | `fc0c03df0f0c5ca7987043d248efbe8ae30f98ff` | 26 |
| 07-11 REAL_FEATURES | `07-REAL-FEATURES-REVIEW.md` | `features/real-pump/heartbeats.feature` | `1e131d26bd24d388797bad5e0e299a3646a70fe7` | 25 |
| 07-11 REAL_FEATURES | `07-REAL-FEATURES-REVIEW.md` | `features/real-pump/lifecycle.feature` | `d52df511e538d38301c6c83fa66427d919fb2e7c` | 21 |
| 07-12 REAL_WORLD | `07-REAL-WORLD-REVIEW.md` | `features/real-pump/support/realWorld.ts` | `f89a7be57f1e3492413deb25d11a8fe9cd48adc2` | 366 |
| 07-13 REAL_STEPS | `07-REAL-STEPS-REVIEW.md` | `features/real-pump/support/steps.ts` | `9a52c32eb26e7c4e68c92d3857168b2af094b463` | 72 |
| 07-13 REAL_STEPS | `07-REAL-STEPS-REVIEW.md` | `features/real-pump/support/heartbeatSteps.ts` | `3f5aba3bc0bc985218d72c76203991c72e58f24e` | 45 |
| 07-13 REAL_STEPS | `07-REAL-STEPS-REVIEW.md` | `features/real-pump/support/lifecycleSteps.ts` | `b94c3e41372e7f14713c8dcb379038df0fab58a6` | 38 |

The 12 owner sets are disjoint. New files from an accepted repair must appear
in that owner's report and in the final ledger. A moved path keeps its original
row and adds a destination row with the move commit.

## Finding and review records

Read every line of every owned file against the applicable rules. Record a
complete-file row for each path in the batch report, including a clean review.
For each finding, allocate the next never-reused `CR-07-BATCH-NNN` ID. `BATCH`
is the uppercase batch name in the table; `NNN` starts at `001` within that
batch. Keep an ID when the same cause moves or returns. Give a separate ID to
a distinct cause at the same line.

Each finding row must contain: ID; requirement; exact rule file and heading;
first review round; `commit:path:line` at the observed revision; severity
(`BLOCKER` or `WARNING` under the skills); disposition (`open`, `fixed`, or
`rejected`); rejection reason or fix detail; named regression and command;
RED evidence path, checker result, and commit when applicable; fix commit;
and latest verification scope, command, exit, and revision. Never replace an
observed location with an unqualified current line number. Order rows by first
round and ID. The central ledger indexes the batch reports and consolidates
these fields in plan 07-14.

Round 0 is the independent complete-file review before edits. Triage every
candidate against its rule and evidence. Each later correction round has a
different reviewer who reads the complete current files, not only the diff.
Record reviewer, revision, opening IDs, fixed IDs, rejected IDs, new IDs,
reopened IDs, and closing IDs. Count them with:

`closing = opening - fixed - rejected + new + reopened`

Stop all batch work immediately if the open count does not fall after a
correction round, a fixed ID reopens, or round four completes. Round four
stops work even when its closing count is zero. Report actual open IDs at
STOP. Do not start a fifth correction round. An absent review is not a
zero-finding review. A correction is one cause per commit, with normal hooks.

## Regression and verification order

For a genuine behavior bug, first add an active named regression while
production is unchanged. Run that named test and observe its intended
assertion fail. A build error, zero executed tests, permission error, or
unrelated failure is not RED evidence. Save command, exit, full output,
expected and actual values, source commit, active patch, and semantic
assessment in a planning evidence record. Run
`node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence <record.json> --raw`.
Require `RED_EVIDENCE_OK` and inspect the failure semantics. Commit only that
planning evidence before any production repair. Keep the active regression
in the worktree. Then make the minimum GREEN source and test change, rerun
the named test, and commit through normal hooks. Never rewrite source bytes
or Git history to manufacture RED. Trace callers before changing a shared
helper. Verify 100% isolated direct line, function, and branch coverage for
each modified production source/test pair.

Compile with `npm run build:test` before any Cucumber command. The default
profile must execute offline. The real profile may run only with `--dry-run`.
Inspect its summary for seven skipped scenarios, 41 skipped steps, and no
undefined or ambiguous status; its exit code alone is insufficient. Check
default usage for `UNUSED` definitions. Keep the scenario count at 104 unless
the ledger explains each change. Run `npm run check` on the combined tree
after each wave and at phase end. Record command, exit, revision, Node
version, and exact input diff and untracked state for every reused result.

## Shared checkout critical section

The coordinator grants one critical section across this checkout. It covers
build output, temporary mutation and restoration, test runs, staging,
pre-commit hooks, and foreground commits. Other owners pause writes and
checks until release. Release follows a verified restoration and status
check. A full combined-tree check runs after each wave, outside any RED
experiment. No owner edits another owner's paths, central ledger, state,
roadmap, or requirements. The coordinator owns those shared records.
