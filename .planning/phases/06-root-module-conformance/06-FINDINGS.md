# Phase 6 root module findings

## Finding ledger

The inventory is fixed by D-01 and D-02 at baseline source revision `4bb84f631ac806f0a8d686db9735d454ee004851`. Each row is Git tracked at that revision. The line count is `wc -l` on that file. Header status checks the complete D-03 SPDX, separate copyright, and separate `@fileoverview` form. It is not a reviewed finding or a clean-file judgment. Preserve Apache-2.0 and template attribution for `index` and `settings`.

| Batch | File | Baseline revision | Lines | Header status |
| --- | --- | --- | ---: | --- |
| CONFIG_PROTOCOL | `src/config.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 219 | Partial: SPDX only |
| CONFIG_PROTOCOL | `test/config.test.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 445 | Missing complete header |
| CONFIG_PROTOCOL | `src/protocol.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 36 | Partial: SPDX only |
| CONFIG_PROTOCOL | `test/protocol.test.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 29 | Missing complete header |
| ENTRY | `src/logging.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 180 | Partial: SPDX only |
| ENTRY | `test/logging.test.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 432 | Missing complete header |
| ENTRY | `src/settings.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 26 | Partial: Apache SPDX and attribution present |
| ENTRY | `test/settings.test.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 26 | Missing complete header |
| ENTRY | `src/index.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 13 | Partial: Apache SPDX and attribution present |
| ENTRY | `test/index.test.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 23 | Missing complete header |
| PLATFORM | `src/platform.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 673 | Complete approved form |
| PLATFORM | `test/platform.test.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 3781 | Complete approved form |

The maintainer removed `test/configSchema.test.ts` and `test/packageManifest.test.ts` in `9605a63`. They are absent from Git's tracked-file inventory and this review. This is twelve files in exactly six mirrored pairs.

## CONFIG_PROTOCOL stable IDs

The full-file independent review at `5ff22a40053e9635672aae7c399f8e6ac51f21c9` accepted seven causes. The matching report is `06-CONFIG-PROTOCOL-REVIEW.md`.

| ID | Rule | Revision-qualified location | Severity | First round | Disposition and evidence | Source / RED / fix commits |
| --- | --- | --- | --- | --- | --- | --- |
| CR-06-CONFIG_PROTOCOL-001 | `AGENTS.md` Privacy; D-06 | `src/config.ts@5ff22a4:80–85,99,124,131,135` | BLOCKER | 0 | Fixed in round 1: active `keeps a private value out of a poll interval refusal` failed before source fix; safe field-specific refusals and bounded platform assertion pass | source `d2ab800`; RED `500cbad`; fix `5d605c3`; consumer `5dd9bbc` |
| CR-06-CONFIG_PROTOCOL-002 | `config.schema.json` email format; D-06 | `src/config.ts@5ff22a4:14,167–169`; `test/config.test.ts@5ff22a4:88–102` | BLOCKER | 0 | Fixed in round 1: active `refuses an account email with consecutive domain dots` failed before source fix; runtime now refuses empty dot-atom parts | source `5dd9bbc`; RED `b7942c2`; fix `ccee6ce` |
| CR-06-CONFIG_PROTOCOL-003 | Unit-test `cases.md` Assertions, `review.md` BLOCKER | `test/protocol.test.ts@5ff22a4:20–28` | BLOCKER | 0 | Fixed in round 1: temporary `wss` to `ws` JSON mutation made exact-value assertion fail; source bytes were restored and GREEN passed | source `ccee6ce`; RED not applicable; fix `68c6dc1` |
| CR-06-CONFIG_PROTOCOL-004 | Approved header; style `modules-and-data.md` File order | `src/config.ts@5ff22a4:1–2` | WARNING | 0 | Fixed in round 1: approved copyright and overview header | source `68c6dc1`; fix `7a4b1ca` |
| CR-06-CONFIG_PROTOCOL-005 | Approved header; style `modules-and-data.md` File order | `test/config.test.ts@5ff22a4:1–4` | WARNING | 0 | Fixed in round 1: approved SPDX, copyright, and overview header | source `7a4b1ca`; fix `e393b43` |
| CR-06-CONFIG_PROTOCOL-006 | Approved header; style `modules-and-data.md` File order | `src/protocol.ts@5ff22a4:1–5` | WARNING | 0 | Fixed in round 1: approved copyright and overview header | source `e393b43`; fix `c1766e5` |
| CR-06-CONFIG_PROTOCOL-007 | Approved header; style `modules-and-data.md` File order | `test/protocol.test.ts@5ff22a4:1–4` | WARNING | 0 | Fixed in round 1: approved SPDX, copyright, and overview header | source `c1766e5`; fix `dd2e5b3` |
| CR-06-CONFIG_PROTOCOL-008 | `config.schema.json` email format; D-06 | `src/config.ts@2c5788f:22` | BLOCKER | 1 | Fixed in round 2: active edge-hyphen refusal failed before source fix; practical dot-atom local text and DNS label checks reject malformed parts | source `e211078`; RED `837f061`; fix `037dfe9` |

## ENTRY stable IDs

The complete independent round-0 review at `eb893e3bee2554365fb4d52bd7e681a546e3186b` accepted 15 causes. Its report is `06-ENTRY-REVIEW.md`. The five logging behavior outputs were independently reproduced with synthetic values through compiled unchanged source before any repair.

| ID | Rule | Revision-qualified location | Severity | First round | Disposition and evidence | Source / RED / fix commits |
| --- | --- | --- | --- | --- | --- | --- |
| CR-06-ENTRY-001 | `AGENTS.md` Privacy; D-06 | `src/logging.ts@eb893e3:58–60` | BLOCKER | 0 | Repair committed, pending independent round-1 review: active `redacts the longest registered secret when secrets overlap` failed on `[redacted]def` against unchanged source; longest-first substitution passes with 100% direct owner coverage | source `eb893e3`; RED `0340e45`; fix `c6987fd` |
| CR-06-ENTRY-002 | `AGENTS.md` Privacy; D-06 | `src/logging.ts@eb893e3:74–96` | BLOCKER | 0 | Repair committed, pending independent round-1 review: active `redacts a registered secret escaped by object serialization` failed when JSON escaping left a synthetic secret visible; raw and escaped substitutions pass with 100% direct owner coverage | source `d189ec7`; RED `bd5ce3a`; fix `c0b4656` |
| CR-06-ENTRY-003 | `AGENTS.md` Privacy; D-06 | `src/logging.ts@eb893e3:19` | BLOCKER | 0 | Repair committed, pending independent round-1 review: active `AUTH-02 redacts a lowercase bearer token with a tilde` failed when the full synthetic token reached the delegate; case-insensitive and tilde-aware matching passes with 100% direct owner coverage | source `040a298`; RED `0da541a`; fix `2113b89` |
| CR-06-ENTRY-004 | `AGENTS.md` Privacy; D-06 | `src/logging.ts@eb893e3:22` | BLOCKER | 0 | Repair committed, pending independent round-1 review: active `AUTH-02 redacts a comma inside a quoted password` failed when the suffix `,right` reached the delegate; quoted-value matching passes with 100% direct owner coverage | source `c8a97ba`; RED `5e30e07`; fix `a51f5e6` |
| CR-06-ENTRY-005 | `typescript-style/rules/functions.md` Errors; D-06 | `src/logging.ts@eb893e3:74–96` | BLOCKER | 0 | Open: undefined JSON serialization raises from logger | source `eb893e3`; RED pending; fix pending |
| CR-06-ENTRY-006 | `typescript-unit-tests/rules/cases.md` Assertions and `review.md` | `test/logging.test.ts@eb893e3:62–107,109–122` | BLOCKER | 0 | Open: callable and `.log` parameter routes lack discriminating assertions | source `eb893e3`; fix pending |
| CR-06-ENTRY-007 | Approved header; style `modules-and-data.md` File order | `src/logging.ts@eb893e3:1–2` | WARNING | 0 | Open: incomplete header | source `eb893e3`; fix pending |
| CR-06-ENTRY-008 | Same header rules | `test/logging.test.ts@eb893e3:1–3` | WARNING | 0 | Open: missing header | source `eb893e3`; fix pending |
| CR-06-ENTRY-009 | Same header rules | `src/settings.ts@eb893e3:1–4` | WARNING | 0 | Open: incomplete Apache header; retain attribution | source `eb893e3`; fix pending |
| CR-06-ENTRY-010 | Same header rules | `test/settings.test.ts@eb893e3:1–3` | WARNING | 0 | Open: missing header | source `eb893e3`; fix pending |
| CR-06-ENTRY-011 | Same header rules | `src/index.ts@eb893e3:1–4` | WARNING | 0 | Open for 06-04: incomplete Apache header; retain attribution | source `eb893e3`; fix pending |
| CR-06-ENTRY-012 | Same header rules | `test/index.test.ts@eb893e3:1–3` | WARNING | 0 | Open for 06-04: missing header | source `eb893e3`; fix pending |
| CR-06-ENTRY-013 | Unit-test `cases.md` Case structure | `test/settings.test.ts@eb893e3:8–26` | WARNING | 0 | Open: `act & assert` labels misstate constant checks | source `eb893e3`; fix pending |
| CR-06-ENTRY-014 | Style `functions.md` Functions | `src/logging.ts@eb893e3:137,164` | WARNING | 0 | Open: const arrows for named local functions | source `eb893e3`; fix pending |
| CR-06-ENTRY-015 | Style `naming-and-docs.md` Comments | `src/index.ts@eb893e3:8–11` | WARNING | 0 | Open for 06-04: exported function JSDoc misnames it | source `eb893e3`; fix pending |

## PLATFORM stable IDs

No review has been dispatched. No findings have been accepted or rejected.

| ID | Rule | Revision-qualified location | Severity | First round | Disposition and evidence | Source / RED / fix commits |
| --- | --- | --- | --- | --- | --- | --- |

## Correction rounds

No correction round has started. For each independent round, commit its report and this counter before repairs. Record repair commits here before the next round. Stop under the three predicates in `06-REVIEW-PROTOCOL.md`.

| Batch | Round | Reviewer and revision | Opening | Fixed | Rejected | New | Reopened | Closing | Open IDs | Report commit | Repair ledger commit |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| CONFIG_PROTOCOL | 0 | `review_config_protocol` at `5ff22a4`, clean diff; four complete files | 0 | 0 | 0 | 7 | 0 | 7 | 001–007 | `d2ab800` | `2c5788f` |
| CONFIG_PROTOCOL | 1 | `review_config_protocol` at `2c5788f`, clean diff; config 1–209, config test 1–485, protocol 1–45, protocol test 1–42 | 7 | 7 | 0 | 1 | 0 | 1 | 008 | `e211078` | `2c5788f` |
| CONFIG_PROTOCOL | 2 | `review_config_protocol` at `41d1ee3`, clean diff; config 1–216, config test 1–503, protocol 1–45, protocol test 1–42 | 1 | 1 | 0 | 0 | 0 | 0 | none | `8b3606a` | `41d1ee3` |
| ENTRY | 0 | `entry_initial_review` at `eb893e3`, clean diff; logging 1–180, logging test 1–432, settings 1–26, settings test 1–26, index 1–13, index test 1–23 | 0 | 0 | 0 | 15 | 0 | 15 | 001–015 | pending | pending |

The required equation is `closing = opening - fixed - rejected + new + reopened`.

## Evidence

Baseline fingerprint: the executable-input source revision is `4bb84f631ac806f0a8d686db9735d454ee004851`. The check ran at `9528f28d31ebe0ffc562fb09f22acdc143a0c942`, whose committed change contains only this ledger and `06-REVIEW-PROTOCOL.md`. `git diff --stat 4bb84f631ac806f0a8d686db9735d454ee004851 -- src test features scripts package.json package-lock.json config.schema.json tsconfig.json tsconfig.build.json tsconfig.test.json eslint.config.js .fallowrc.json .pre-commit-config.yaml .github/workflows` returned no changes before or after the checks. `git ls-files --others --exclude-standard` returned no untracked inputs. The only dirty paths were `.planning/STATE.md` and `.planning/state.json`, changed by `state.begin-phase`; neither is an executable check input. Pairing and full-check evidence below covers this exact tree. Any source, test, support, dependency, or tool input change requires a fresh check.

| Gate | Source revision and input scope | Node | Command | Exit | Duration | Result |
| --- | --- | --- | --- | ---: | --- | --- |
| Baseline pairing | `4bb84f631ac806f0a8d686db9735d454ee004851`, checked at `9528f28d31ebe0ffc562fb09f22acdc143a0c942` | v26.12.0 | `npm run --silent test:corresponding` | 0 | 0.5 s | `Corresponding-tests gate passed.` |
| First full-check attempt | Same inputs; restricted sandbox | v26.12.0 | `npm run check` | 1 | 34 s | Static checks passed; compiled unpaired suite had 51/53 pass. Both `packedArtifact` tests failed because child `npm pack --dry-run --json` received npm-cache `EPERM`. Cucumber and direct coverage did not run. Full output: `/private/tmp/guardian-06-01-baseline.log`. |
| Baseline full check | Same inputs; local npm-cache and socket access | v26.12.0 | `npm run check` | 0 | 61 s | Six static checks passed; compiled unpaired tests passed; 104/104 Cucumber scenarios and 1156/1156 steps passed; direct LCOV merged 43 isolated pairs. Full output: `/private/tmp/guardian-06-01-baseline-native.log`. No install or source change occurred between attempts. |
| CONFIG_PROTOCOL owner and bounded consumer coverage | `437213ff60c0a7f91fc9c1203714852a95bac99b`, clean tree, no untracked inputs | v26.12.0 | `npm run test:coverage:direct -- src/config.ts src/protocol.ts src/platform.ts` | 0 | 4.4 s | Each of the three owner pairs met 100% direct line, function, and branch coverage. |
| Combined check before bounded scenario correction | `8b3606a`, clean tree | v26.12.0 | `npm run check` | 1 | about 60 s | Static and unpaired gates passed; 103/104 Cucumber scenarios passed. The configuration scenario still expected the old value-quoting refusal. Full output: `/private/tmp/guardian-06-02-full.log`. |
| Bounded configuration scenario | `437213f`, clean tree | v26.12.0 | `npx cucumber-js --name 'The plugin starts nothing on an out-of-range poll interval'` | 0 | 0.2 s | 1/1 scenario and 7/7 steps passed after exact refusal expectation update. |
| Final combined check | `437213ff60c0a7f91fc9c1203714852a95bac99b`, clean tree, no untracked inputs | v26.12.0 | `npm run check` | 0 | about 61 s | Six static checks, compiled unpaired suite, 104/104 Cucumber scenarios, 1156/1156 steps, and merged direct LCOV for 43 isolated pairs passed. Full output: `/private/tmp/guardian-06-02-full-final.log`. |
