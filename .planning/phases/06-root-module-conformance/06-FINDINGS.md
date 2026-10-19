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
| CR-06-ENTRY-001 | `AGENTS.md` Privacy; D-06 | `src/logging.ts@eb893e3:58–60` | BLOCKER | 0 | Fixed in round 1: active `redacts the longest registered secret when secrets overlap` failed on `[redacted]def` against unchanged source; longest-first substitution passes with 100% direct owner coverage | source `eb893e3`; RED `0340e45`; fix `c6987fd` |
| CR-06-ENTRY-002 | `AGENTS.md` Privacy; D-06 | `src/logging.ts@eb893e3:74–96` | BLOCKER | 0 | Fixed in round 1: active `redacts a registered secret escaped by object serialization` failed when JSON escaping left a synthetic secret visible; raw and escaped substitutions pass with 100% direct owner coverage | source `d189ec7`; RED `bd5ce3a`; fix `c0b4656` |
| CR-06-ENTRY-003 | `AGENTS.md` Privacy; D-06 | `src/logging.ts@eb893e3:19` | BLOCKER | 0 | Fixed in round 1: active `AUTH-02 redacts a lowercase bearer token with a tilde` failed when the full synthetic token reached the delegate; case-insensitive and tilde-aware matching passes with 100% direct owner coverage | source `040a298`; RED `0da541a`; fix `2113b89` |
| CR-06-ENTRY-004 | `AGENTS.md` Privacy; D-06 | `src/logging.ts@eb893e3:22` | BLOCKER | 0 | Fixed in round 1: active `AUTH-02 redacts a comma inside a quoted password` failed when the suffix `,right` reached the delegate; quoted-value matching passes with 100% direct owner coverage | source `c8a97ba`; RED `5e30e07`; fix `a51f5e6` |
| CR-06-ENTRY-005 | `typescript-style/rules/functions.md` Errors; D-06 | `src/logging.ts@eb893e3:74–96` | BLOCKER | 0 | Fixed in round 1: active `describes an object whose toJSON returns undefined without throwing` failed on the no-throw assertion; the existing fallback now handles a non-string serialization result with 100% direct owner coverage | source `ed39af9`; RED `49717e1`; fix `099618c` |
| CR-06-ENTRY-006 | `typescript-unit-tests/rules/cases.md` Assertions and `review.md` | `test/logging.test.ts@eb893e3:62–107,109–122` | BLOCKER | 0 | Fixed in round 1: both new route-specific parameter assertions failed under temporary raw-parameter forwarding, then passed after exact source restoration with 100% direct owner coverage | source `2bab93d`; negative control not committed; fix `bfd7262` |
| CR-06-ENTRY-007 | Approved header; style `modules-and-data.md` File order | `src/logging.ts@eb893e3:1–2` | WARNING | 0 | Fixed in round 1: separate copyright and file overview JSDocs follow the MIT SPDX line; 100% direct owner coverage | source `4108046`; fix `06515ae` |
| CR-06-ENTRY-008 | Same header rules | `test/logging.test.ts@eb893e3:1–3` | WARNING | 0 | Fixed in round 1: approved test header added without changing assertions; 100% direct owner coverage | source `06515ae`; fix `6ba2a16` |
| CR-06-ENTRY-009 | Same header rules | `src/settings.ts@eb893e3:1–4` | WARNING | 0 | Fixed in round 1: separate copyright and overview JSDocs retain Apache SPDX, template attribution, and identity values; 100% direct owner coverage | source `eb893e3`; fix `093cfdc` |
| CR-06-ENTRY-010 | Same header rules | `test/settings.test.ts@eb893e3:1–3` | WARNING | 0 | Fixed in round 1: approved test header added without changing assertions; 100% direct owner coverage | source `eb893e3`; fix `6d372fc` |
| CR-06-ENTRY-011 | Same header rules | `src/index.ts@eb893e3:1–4` | WARNING | 0 | Fixed in round 1: separate copyright and overview JSDocs retain Apache SPDX and Homebridge template attribution; 100% direct owner coverage | source `eb893e3`; fix `ffcc32b` |
| CR-06-ENTRY-012 | Same header rules | `test/index.test.ts@eb893e3:1–3` | WARNING | 0 | Fixed in round 1: approved test header added without changing assertions; 100% direct owner coverage | source `eb893e3`; fix `fa10938` |
| CR-06-ENTRY-013 | Unit-test `cases.md` Case structure | `test/settings.test.ts@eb893e3:8–26` | WARNING | 0 | Fixed in round 1: separate arrange, act, and assert phases retain the literal, schema, package, and user-agent assertions; 100% direct owner coverage | source `eb893e3`; fix `6befd9c` |
| CR-06-ENTRY-014 | Style `functions.md` Functions | `src/logging.ts@eb893e3:137,164` | WARNING | 0 | Fixed in round 1: `registerSecret` and `write` are named function declarations with unchanged bodies; 100% direct owner coverage | source `6ba2a16`; fix `0937041` |
| CR-06-ENTRY-015 | Style `naming-and-docs.md` Comments | `src/index.ts@eb893e3:8–11` | WARNING | 0 | Fixed in round 1: exported function JSDoc begins with a third-person verb and calls it a function by implication; 100% direct owner coverage | source `eb893e3`; fix `f2e0373` |
| CR-06-ENTRY-016 | `AGENTS.md` Privacy; D-06 | `src/logging.ts@591c5a6:32`; `test/logging.test.ts@591c5a6:387–400` | BLOCKER | 1 | Fixed in round 2: active unquoted-comma regression failed on the exposed `,right` suffix; the matcher now consumes unquoted commas; 100% direct logging coverage | source `401704f`; RED `f7d5a4c`; fix `f6c6317` |
| CR-06-ENTRY-017 | `src/logging.ts:19–21` value-only pattern contract; `typescript-unit-tests/rules/cases.md` Assertions | `src/logging.ts@e5a29d4:32`; `test/logging.test.ts@e5a29d4:402–415` | WARNING | 2 | Fixed in round 3; accepted privacy-first tradeoff after the maintainer decision: later fields may be omitted. The owner test now asserts complete redaction of the ambiguous remainder. This ID is closed by explicit policy, not silently reopened. | source `07d039c`; RED `001800e`; fix `cad5804`; policy fix `6955514` |
| CR-06-ENTRY-018 | `AGENTS.md` Privacy; D-06 | `src/logging.ts@18f6324:32–35`; `test/logging.test.ts@18f6324:417–430` | BLOCKER | 3 | Fixed in round 4: active field-shaped suffix regression failed on leaked `right=middle`; broad redaction hides that ambiguous remainder; 100% direct logging coverage | source `7cd6c77`; RED `3599f67`; fix `6955514` |
| CR-06-ENTRY-019 | `AGENTS.md` Privacy; D-06 | `src/logging.ts@add5a3a:33` | BLOCKER | 4 | Open at four-round cap: `password=left}right` becomes `password=[redacted]}right`; an unquoted password suffix also leaks after `"` | source `add5a3a`; RED pending; fix pending |
| CR-06-ENTRY-020 | `AGENTS.md` Privacy; D-06 | `src/logging.ts@add5a3a:75–80`; bounded caller `src/platform.ts:572` | BLOCKER | 4 | Open at four-round cap: with registered secret `password`, `{"password":"next-secret"}` becomes `{"[redacted]":"next-secret"}`; exact substitution erases the field name before credential matching | source `add5a3a`; RED pending; fix pending |

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
| ENTRY | 0 | `entry_initial_review` at `eb893e3`, clean diff; logging 1–180, logging test 1–432, settings 1–26, settings test 1–26, index 1–13, index test 1–23 | 0 | 0 | 0 | 15 | 0 | 15 | 001–015 | `eac3368` | `637ca38` |
| ENTRY | 1 | `entry_round1_review` at `591c5a6`, clean diff; logging 1–200, logging test 1–555, settings 1–36, settings test 1–54, index 1–23, index test 1–33 | 15 | 15 | 0 | 1 | 0 | 1 | 016 | `401704f` | `f6c6317` |
| ENTRY | 2 | `entry_round2_review` at `e5a29d4`, clean diff; logging 1–200, logging test 1–570, settings 1–36, settings test 1–54, index 1–23, index test 1–33 | 1 | 1 | 0 | 1 | 0 | 1 | 017 | `e018f94` | none; D-04 stop |
| ENTRY | 3 | `entry_round3_review` at `18f6324`, clean diff; logging 1–203, logging test 1–585, settings 1–36, settings test 1–54, index 1–23, index test 1–33 | 1 | 1 | 0 | 1 | 0 | 1 | 018 | `b6964aa` | none; exception exhausted |
| ENTRY | 4 | `entry_round4_review` at `add5a3a`, clean diff; logging 1–201, logging test 1–600, settings 1–36, settings test 1–54, index 1–23, index test 1–33 | 1 | 1 | 0 | 2 | 0 | 2 | 019, 020 | `c91b053` | none; D-04 cap stop |

The required equation is `closing = opening - fixed - rejected + new + reopened`.

## ENTRY D-04 stop

The independent round-2 review closed ENTRY-016 and accepted new ENTRY-017. Its one open finding did not decrease the opening count: `1 - 1 - 0 + 1 + 0 = 1`. This meets the no-progress stop predicate (`closing >= opening`). The only open ENTRY ID is CR-06-ENTRY-017. Repairs attempted before this stop: index header and JSDoc causes 011, 012, and 015; unquoted-password privacy cause 016. The ledger prohibits another ENTRY repair or PLATFORM dispatch until a maintainer resolves the stop. Round 3 and round 4 were not run.

The maintainer then answered the stop decision: **“Authorize one repair and re-review (Recommended).”** This was a one-time D-04 exception for CR-06-ENTRY-017 only. The round-2 stop and counts remain recorded. Evidence commit `001800e` and repair commit `cad5804` used the exception. One independent complete-file round 3 was authorized. Its condition required a new stop with exact IDs if any finding stayed open; no further repair or round was authorized.

Round 3 closed ENTRY-017 but found new BLOCKER CR-06-ENTRY-018. The count again remained one: `1 - 1 - 0 + 1 + 0 = 1`. The one-time exception has been used. No further ENTRY repair or review is authorized. The only open ENTRY ID is CR-06-ENTRY-018, and PLATFORM dispatch remains blocked.

The maintainer answered the next stop decision: **“Yes, prioritize redaction (Recommended).”** This authorizes one bounded safety-first repair for CR-06-ENTRY-018 and one final complete-file review as round 4. The unquoted password remainder must be redacted, even when later log fields are lost. ENTRY-017's field-preservation expectation is an accepted tradeoff under this explicit policy, not a reopened finding. The round-2 and round-3 stop records remain intact. If round 4 has any open finding, stop at the cap with exact IDs.

Evidence commit `3599f67` and source/test commit `6955514` used this second exception. The accepted ENTRY-017 tradeoff is expressed in the revised owner test and source comment. Exactly one independent complete-file round 4 was authorized; its result appears below.

## ENTRY round-four cap stop

The final independent round closed ENTRY-018 and accepted new privacy BLOCKERs ENTRY-019 and ENTRY-020. `1 - 1 - 0 + 2 + 0 = 2`. Open IDs: CR-06-ENTRY-019 and CR-06-ENTRY-020. The four-round cap applies even if a later repair could close these causes. Both one-time maintainer exceptions have been used. No further ENTRY repair or review is authorized, and PLATFORM dispatch remains blocked pending a new maintainer decision.

## Separate post-debug ENTRY validation (not correction round five)

The maintainer authorized a focused GSD debug task and replan after the round-four cap. Debug commits `24f3620` and `2d291cc` changed the logger and its owner tests. `.planning/debug/logging-redaction-leaks.md` records active RED assertions and revert/reconfirm evidence before and after the repair; there is no Phase 6 planning-only RED evidence commit for these debug fixes. Do not infer one from the commit history.

Independent `entry_post_debug_review` read all six complete ENTRY files at `b24cd835d310beacc37beca99e527db125ab032b`: logging 1–227 and owner 1–652, settings 1–36 and owner 1–54, index 1–23 and owner 1–33. All six executable inputs matched HEAD and `2d291cc`; only the non-executable debug session was untracked. The historical ENTRY round-four table and STOP above are unchanged.

| ID | Current-code review result | Evidence | Closure status |
| --- | --- | --- | --- |
| CR-06-ENTRY-019 | Provisionally fixed | `src/logging.ts@b24cd83:33` masks the remainder, including braces, quotes, and newlines; exact delegate assertions at `test/logging.test.ts:447–466` pass | Pending fresh gates and explicit Homebridge result |
| CR-06-ENTRY-020 | Provisionally fixed | Original-text span union at `src/logging.ts@b24cd83:72–109` retains field recognition; exact delegate assertion at `test/logging.test.ts:468–481` passes | Pending fresh gates and explicit Homebridge result |

The independent review accepted no new ENTRY cause and assigned no ENTRY-021. Adjacent newline, registered-secret overlap, all logger routes, settings identity, index registration, and six headers had concrete passing source/test evidence in `06-ENTRY-REVIEW.md`. At the reviewed executable inputs on Node v26.12.0, the three compiled ENTRY owners passed 52/52 tests, pairing passed, fresh isolated direct coverage passed all three 100% thresholds, and fresh `npm run check` passed static, unpaired, 104/104 Cucumber scenarios, 1156/1156 steps, and 43 isolated direct pairs. The executable-input diff from `b24cd83` was empty; the only untracked path was the non-executable debug session. The reviewed code has zero accepted open findings, but ENTRY is **not closed**: the original real Homebridge logging workflow result is still required. PLATFORM dispatch remains blocked.

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
| ENTRY logging and settings owner coverage | `637ca38e76723f629ab070cab1a3e9b7e230ee86`, clean tree, no untracked inputs | v26.12.0 | `npm run test:coverage:direct -- src/logging.ts src/settings.ts` | 0 | about 6 s | Both pairs reached 100% direct line, function, and branch coverage. |
| ENTRY full-check attempt with default npm cache | Same inputs, restricted cache access | v26.12.0 | `npm run check` | 1 | about 36 s | Six static checks passed; two package-inspection tests received npm-cache `EPERM`. Cucumber and full direct coverage did not run. Output: `/private/tmp/guardian-06-03-full.log`. |
| ENTRY full-check attempt with writable cache | Same inputs, restricted loopback socket access | v26.12.0 | `NPM_CONFIG_CACHE=/private/tmp/guardian-06-03-npm-cache npm run check` | 130 after interruption | over 120 s | Static and unpaired checks passed; Cucumber failed because its offline fake cloud could not bind `127.0.0.1` (`EPERM`). The failed run was stopped. Output: `/private/tmp/guardian-06-03-full-native.log`. |
| ENTRY final combined check | Same clean `637ca38e76723f629ab070cab1a3e9b7e230ee86` inputs, writable npm cache and local socket access | v26.12.0 | `NPM_CONFIG_CACHE=/private/tmp/guardian-06-03-npm-cache npm run check` | 0 | about 61 s | Six static checks and compiled unpaired tests passed; 104/104 Cucumber scenarios and 1156/1156 steps passed; direct LCOV merged 43 isolated pairs. Output: `/private/tmp/guardian-06-03-full-final.log`. |
| ENTRY round-1 pre-repair owner coverage | Clean `591c5a6d030c3c658d098b597f439915ed06ea39`; no untracked inputs | v26.12.0 | `npm run test:coverage:direct -- src/logging.ts src/settings.ts src/index.ts` | 0 | about 4 s | All three pairs met 100% direct line, function, and branch coverage. |
| ENTRY round-1 pre-repair combined check | Same clean `591c5a6` inputs, writable npm cache and local socket access | v26.12.0 | `NPM_CONFIG_CACHE=/private/tmp/guardian-06-04-npm-cache npm run check` | 0 | about 59 s | Six static checks, compiled unpaired tests, 104/104 Cucumber scenarios, 1156/1156 steps, and merged direct LCOV for 43 isolated pairs passed. The independent review still found ENTRY-016; this check does not close it. |
| ENTRY round-2 owner coverage | Clean `e5a29d4896dfb1c1856c28f4deb37e0819907c9d`, no untracked inputs; executable-input diff from this revision empty | v26.12.0 | `npm run test:coverage:direct -- src/logging.ts src/settings.ts src/index.ts` | 0 | about 4 s | All three pairs met 100% direct line, function, and branch coverage. The reviewer still found ENTRY-017. |
| ENTRY round-2 combined check | Same clean `e5a29d4` inputs, writable npm cache and local socket access | v26.12.0 | `NPM_CONFIG_CACHE=/private/tmp/guardian-06-04-npm-cache npm run check` | 0 | about 56 s | Six static checks, compiled unpaired tests, 104/104 Cucumber scenarios, 1156/1156 steps, and merged direct LCOV for 43 isolated pairs passed. The review's D-04 stop remains active. |
| ENTRY round-3 owner coverage | Clean `18f63241644aa5a0827bed5e2d9a49ed996bb5ec`, no untracked inputs; executable-input diff from this revision empty | v26.12.0 | `npm run test:coverage:direct -- src/logging.ts src/settings.ts src/index.ts` | 0 | about 4 s | All three pairs met 100% direct line, function, and branch coverage. The reviewer still found ENTRY-018. |
| ENTRY round-3 combined check | Same clean `18f6324` inputs, writable npm cache and local socket access | v26.12.0 | `NPM_CONFIG_CACHE=/private/tmp/guardian-06-04-npm-cache npm run check` | 0 | about 55 s | Six static checks, compiled unpaired tests, 104/104 Cucumber scenarios, 1156/1156 steps, and merged direct LCOV for 43 isolated pairs passed. The one-time exception is exhausted and ENTRY-018 remains open. |
| ENTRY round-4 owner coverage | Clean `add5a3a84654a51cefd13c75af92e2d93c08b686`, no untracked inputs; executable-input diff from this revision empty | v26.12.0 | `npm run test:coverage:direct -- src/logging.ts src/settings.ts src/index.ts` | 0 | about 4 s | All three pairs met 100% direct line, function, and branch coverage. The reviewer still found ENTRY-019 and ENTRY-020. |
| ENTRY round-4 combined check | Same clean `add5a3a` inputs, writable npm cache and local socket access | v26.12.0 | `NPM_CONFIG_CACHE=/private/tmp/guardian-06-04-npm-cache npm run check` | 0 | about 55 s | Six static checks, compiled unpaired tests, 104/104 Cucumber scenarios, 1156/1156 steps, and merged direct LCOV for 43 isolated pairs passed. The D-04 cap stop remains active. |
