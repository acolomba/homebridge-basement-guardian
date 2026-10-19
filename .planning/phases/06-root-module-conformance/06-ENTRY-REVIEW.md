# ENTRY complete-file review

## Round 0: independent review and triage

Independent reviewer: `gsd-code-reviewer` agent `entry_initial_review`. Base revision: `eb893e3bee2554365fb4d52bd7e681a546e3186b`, with a clean worktree and no untracked inputs. Node: v26.12.0. The reviewer read the complete `src/logging.ts` (1–180), `test/logging.test.ts` (1–432), `src/settings.ts` (1–26), `test/settings.test.ts` (1–26), `src/index.ts` (1–13), and `test/index.test.ts` (1–23). `src/platform.ts` was a bounded caller. The removed `test/configSchema.test.ts` and `test/packageManifest.test.ts` are outside the inventory.

The reviewer applied the TypeScript style, comment, and unit-test rules, checked all seven logging routes, secret rotation, the three settings constants, and Homebridge's single platform registration. `npm run --silent test:corresponding` exited 0 with `Corresponding-tests gate passed.` Fallow guard reported no configured zones for the six owners. The prior complete check at `437213f` applies to unchanged executable inputs: `git diff --stat 437213f -- src test features scripts package.json package-lock.json config.schema.json tsconfig.json tsconfig.build.json tsconfig.test.json eslint.config.js .fallowrc.json .pre-commit-config.yaml .github/workflows` was empty, with no untracked inputs.

The coordinator compiled unchanged source with `npm run build:test` (exit 0) and invoked the compiled logger with synthetic values. It produced `token [redacted]def` for overlapping registered secrets, left an escaped secret in JSON, left a bearer suffix, left a comma-delimited password suffix, and raised `TypeError` for an object whose `toJSON` returns `undefined`. These observed outputs support the five behavior findings below; the subsequent active owner regressions remain subject to D-05 RED evidence before a source fix.

| ID | Exact rule and base location | Severity | Triage |
| --- | --- | --- | --- |
| CR-06-ENTRY-001 | `AGENTS.md` Privacy; D-06; `src/logging.ts@eb893e3:58–60` | BLOCKER | Accepted, open. Registering `abc` before `abcdef` writes `[redacted]def`, leaking part of the longer value. |
| CR-06-ENTRY-002 | `AGENTS.md` Privacy; D-06; `src/logging.ts@eb893e3:74–96` | BLOCKER | Accepted, open. JSON escaping occurs before exact secret substitution, so `my\"pass` remains visible inside an object parameter. |
| CR-06-ENTRY-003 | `AGENTS.md` Privacy; D-06; `src/logging.ts@eb893e3:19` | BLOCKER | Accepted, open. The authorization pattern leaves token text after `~` and does not match lowercase `bearer`. |
| CR-06-ENTRY-004 | `AGENTS.md` Privacy; D-06; `src/logging.ts@eb893e3:22` | BLOCKER | Accepted, open. A comma inside a quoted password survives the authentication-body pattern. |
| CR-06-ENTRY-005 | `typescript-style/rules/functions.md` Errors; D-06; `src/logging.ts@eb893e3:74–96` | BLOCKER | Accepted, open. `JSON.stringify` can return `undefined`, after which the logger raises `TypeError` instead of safely describing the object. |
| CR-06-ENTRY-006 | `typescript-unit-tests/rules/cases.md` Assertions and `review.md` BLOCKER; `test/logging.test.ts@eb893e3:62–107,109–122` | BLOCKER | Accepted, open. Bare callable and `.log` tests do not reject a wrapper that forwards trailing parameters without redaction. |
| CR-06-ENTRY-007 | Approved header; `typescript-style/rules/modules-and-data.md` File order; `src/logging.ts@eb893e3:1–2` | WARNING | Accepted, open. Separate copyright and overview JSDocs are absent. |
| CR-06-ENTRY-008 | Same header rules; `test/logging.test.ts@eb893e3:1–3` | WARNING | Accepted, open. SPDX, copyright, and overview are absent. |
| CR-06-ENTRY-009 | Same header rules; `src/settings.ts@eb893e3:1–4` | WARNING | Accepted, open. Apache SPDX and template attribution exist; separate copyright and overview are absent. |
| CR-06-ENTRY-010 | Same header rules; `test/settings.test.ts@eb893e3:1–3` | WARNING | Accepted, open. SPDX, copyright, and overview are absent. |
| CR-06-ENTRY-011 | Same header rules; `src/index.ts@eb893e3:1–4` | WARNING | Accepted, open for 06-04. Apache SPDX and template attribution exist; separate copyright and overview are absent. |
| CR-06-ENTRY-012 | Same header rules; `test/index.test.ts@eb893e3:1–3` | WARNING | Accepted, open for 06-04. SPDX, copyright, and overview are absent. |
| CR-06-ENTRY-013 | `typescript-unit-tests/rules/cases.md` Case structure; `test/settings.test.ts@eb893e3:8–26` | WARNING | Accepted, open. The `act & assert` label is reserved for one throws/rejects expression; constant checks need separate phases. |
| CR-06-ENTRY-014 | `typescript-style/rules/functions.md` Functions; `src/logging.ts@eb893e3:137,164` | WARNING | Accepted, open. Named local functions use const arrows without an explicit function type or outer `this` requirement. |
| CR-06-ENTRY-015 | `typescript-style/rules/naming-and-docs.md` Comments; `src/index.ts@eb893e3:8–11` | WARNING | Accepted, open for 06-04. The exported function's JSDoc calls it a method and does not begin with a third-person verb. |

Round 0 counts: opening 0, fixed 0, rejected 0, new 15, reopened 0, closing 15. Open IDs: 001–015. `0 - 0 - 0 + 15 + 0 = 15`. The correction-round counter remains 0 until the complete logging, settings, and index repair wave receives an independent review in 06-04. No D-04 stop applies to the initial triage. The report and matching central ledger are committed before source or test edits.

## Repair after round 0: CR-06-ENTRY-001

At source revision `eac3368`, the active owner case `redacts the longest registered secret when secrets overlap` compiled with `npm run build:test` (exit 0). Its named TAP run exited 1 on the intended delegate assertion: expected `token [redacted]`, received `token [redacted]def`. The complete TAP, active test patch, source blob, and semantic assessment are in `06-ENTRY-RED-EVIDENCE.json`. The validator returned `RED_EVIDENCE_OK`; the evidence-only commit is `0340e45`.

Commit `c6987fd` processes registered secrets from longest to shortest without changing role rotation or delegate routes. The named owner case passed (1/1); `npm run test:coverage:direct -- src/logging.ts` exited 0 at 100% direct line, function, and branch coverage. `npm run --silent test:corresponding`, Fallow guard, Fallow audit, the pre-commit step, and the normal commit hooks passed. Checks ran in the shared main checkout on Node v26.12.0. The repair awaits the first independent ENTRY correction round; the round-0 count remains unchanged.

## Repair after round 0: CR-06-ENTRY-002

At source revision `d189ec7`, the active owner case `redacts a registered secret escaped by object serialization` compiled with `npm run build:test` (exit 0). Its named TAP run exited 1 on the intended delegate assertion: the expected object text had `[redacted]`, but the actual text retained the synthetic secret with its quote escaped. `06-ENTRY-RED-EVIDENCE.json` holds the complete TAP, active patch, source blob, semantic assessment, and unchanged evidence for finding 001. The validator returned `RED_EVIDENCE_OK`; the evidence-only commit is `bd5ce3a`.

Commit `c0b4656` matches both raw registered secrets and their JSON escaped forms in serialized object parameters. The named owner case passed (1/1); `npm run test:coverage:direct -- src/logging.ts` exited 0 at 100% direct line, function, and branch coverage. `npm run --silent test:corresponding`, Fallow guard, Fallow audit, the pre-commit step, and the normal commit hooks passed. Checks ran in the shared main checkout on Node v26.12.0. The repair awaits the first independent ENTRY correction round; the round-0 count remains unchanged.

## Repair after round 0: CR-06-ENTRY-003

At source revision `040a298`, the active owner case `AUTH-02 redacts a lowercase bearer token with a tilde` compiled with `npm run build:test` (exit 0). Its named TAP run exited 1 on the intended delegate assertion: the expected line kept `bearer` and the final period with `[redacted]` in between, but the actual line exposed the full synthetic token. `06-ENTRY-RED-EVIDENCE.json` holds the complete TAP, active patch, source blob, semantic assessment, and unchanged evidence for findings 001 and 002. The validator returned `RED_EVIDENCE_OK`; the evidence-only commit is `0da541a`.

Commit `2113b89` makes the authorization pattern case-insensitive and includes `~` in token matches while keeping the final sentence period outside the match. The named owner case passed (1/1); `npm run test:coverage:direct -- src/logging.ts` exited 0 at 100% direct line, function, and branch coverage. `npm run --silent test:corresponding`, Fallow guard, Fallow audit, the pre-commit step, and the normal commit hooks passed. Checks ran in the shared main checkout on Node v26.12.0. The repair awaits the first independent ENTRY correction round; the round-0 count remains unchanged.

## Repair after round 0: CR-06-ENTRY-004

At source revision `c8a97ba`, the active owner case `AUTH-02 redacts a comma inside a quoted password` compiled with `npm run build:test` (exit 0). Its named TAP run exited 1 on the intended delegate assertion: expected `{"password":"[redacted]"}`, received `{"password":"[redacted],right"}`. `06-ENTRY-RED-EVIDENCE.json` holds the complete TAP, active patch, source blob, semantic assessment, and unchanged evidence for findings 001–003. The validator returned `RED_EVIDENCE_OK`; the evidence-only commit is `5e30e07`.

Commit `a51f5e6` matches an entire quoted authentication value, including commas, before the existing unquoted-value pattern. The named owner case passed (1/1); `npm run test:coverage:direct -- src/logging.ts` exited 0 at 100% direct line, function, and branch coverage. `npm run --silent test:corresponding`, Fallow guard, Fallow audit, the pre-commit step, and the normal commit hooks passed. The pre-commit formatter changed the source layout; its second run passed before the commit. Checks ran in the shared main checkout on Node v26.12.0. The repair awaits the first independent ENTRY correction round; the round-0 count remains unchanged.

## Repair after round 0: CR-06-ENTRY-005

At source revision `ed39af9`, the active owner case `describes an object whose toJSON returns undefined without throwing` compiled with `npm run build:test` (exit 0). Its named TAP run exited 1 at the intended no-throw assertion: the logger raised `TypeError` before the delegate received `[unserializable object]`. An initial assertion against the Error object produced TAP the validator could not parse; the final test asserts its short message. `06-ENTRY-RED-EVIDENCE.json` holds the complete final TAP, active patch, source blob, semantic assessment, and unchanged evidence for findings 001–004. The validator returned `RED_EVIDENCE_OK`; the evidence-only commit is `49717e1`.

Commit `099618c` sends a non-string serialization result through the existing fallback. The named owner case passed (1/1); `npm run test:coverage:direct -- src/logging.ts` exited 0 at 100% direct line, function, and branch coverage. `npm run --silent test:corresponding`, Fallow guard, Fallow audit, the pre-commit step, and the normal commit hooks passed. Checks ran in the shared main checkout on Node v26.12.0. The repair awaits the first independent ENTRY correction round; the round-0 count remains unchanged.

## Repair after round 0: CR-06-ENTRY-006

At source revision `2bab93d`, two active owner cases checked registered-secret redaction in trailing parameters through the callable logger and `.log(level, ...)`. A temporary mutation forwarded raw parameters on those two routes. After `npm run build:test` passed, each named TAP run exited 1 on the intended exact delegate assertion: it received `attempt with account-password` instead of `attempt with [redacted]`. The mutation was not committed. Restoring `src/logging.ts` returned it to its original Git blob `42c5d322c94c4b9547017029e0a087cfd8699cf7`, with no source diff.

After rebuilding the restored source, both named cases passed (1/1 each). Commit `bfd7262` adds only those assertions. `npm run test:coverage:direct -- src/logging.ts` exited 0 at 100% direct line, function, and branch coverage. `npm run --silent test:corresponding`, Fallow guard, Fallow audit, the pre-commit step, and the normal commit hooks passed. Checks ran in the shared main checkout on Node v26.12.0. This test-assertion repair uses a temporary negative control rather than genuine-bug RED evidence. It awaits the first independent ENTRY correction round; the round-0 count remains unchanged.

## Repair after round 0: CR-06-ENTRY-007

Commit `06515ae` adds separate copyright and file overview JSDocs after the MIT SPDX line in `src/logging.ts`. The implementation is unchanged. Both named callable and `.log` trailing-parameter tests passed. Direct logging coverage remained 100% for lines, functions, and branches. The corresponding-test gate, Fallow guard and audit, pre-commit step, and normal commit hooks passed.

## Repair after round 0: CR-06-ENTRY-008

Commit `6ba2a16` adds the approved SPDX, copyright, and file overview header to `test/logging.test.ts`. Assertions are unchanged. Both named trailing-parameter tests passed. Direct logging coverage remained 100% for lines, functions, and branches. The corresponding-test gate, Fallow guard and audit, pre-commit step, and normal commit hooks passed.

## Repair after round 0: CR-06-ENTRY-009

Commit `093cfdc` adds separate copyright and file overview JSDocs to `src/settings.ts`. It retains the Apache-2.0 SPDX line, Homebridge template attribution, and all three identity values. `npm run test:coverage:direct -- src/settings.ts` exited 0 at 100% direct line, function, and branch coverage. Fallow guard and audit, the pre-commit step, and normal commit hooks passed. Checks ran in the shared main checkout on Node v26.12.0. The repair awaits the first independent ENTRY correction round; the round-0 count remains unchanged.

## Repair after round 0: CR-06-ENTRY-010

Commit `6d372fc` adds the approved SPDX, copyright, and file overview header to `test/settings.test.ts`. The test assertions are unchanged. `npm run test:coverage:direct -- src/settings.ts` exited 0 at 100% direct line, function, and branch coverage. Fallow guard and audit, the pre-commit step, and normal commit hooks passed. Checks ran in the shared main checkout on Node v26.12.0. The repair awaits the first independent ENTRY correction round; the round-0 count remains unchanged.

## Repair after round 0: CR-06-ENTRY-013

Commit `6befd9c` gives each settings constant case separate arrange, act, and assert phases. The assertions still check the same literal names, schema and package values, and user-agent shape. `npm run test:coverage:direct -- src/settings.ts` exited 0 at 100% direct line, function, and branch coverage. Fallow guard and audit, the pre-commit step, and normal commit hooks passed. Checks ran in the shared main checkout on Node v26.12.0. The repair awaits the first independent ENTRY correction round; the round-0 count remains unchanged.

## Repair after round 0: CR-06-ENTRY-014

Commit `0937041` changes the named local `registerSecret` and `write` arrows to function declarations in `src/logging.ts`. Their bodies and call paths are unchanged. Both named trailing-parameter tests passed. Direct logging coverage remained 100% for lines, functions, and branches. The corresponding-test gate, Fallow guard and audit, pre-commit step, and normal commit hooks passed. All three logging style repairs ran in the shared main checkout on Node v26.12.0. They await the first independent ENTRY correction round; the round-0 count remains unchanged.

## Handoff to 06-04

This plan owns accepted logging and settings causes 001–010, 013, and 014. Plan 06-04 owns index causes 011, 012, and 015 and the first independent correction round across all six complete files. Its opening count is the same 15 IDs; it must account for every repair and may not reset ENTRY's counter.

The twelve logging and settings causes have repair commits recorded above and in `06-FINDINGS.md`; they remain open until the independent complete-file correction review. The three index causes have no repair yet. The initial report commit is `eac3368`; the last repair ledger commit is `637ca38`. Neither plan boundary nor the combined passing gate advances the ENTRY correction counter beyond round 0. There is no no-progress, reopened, or four-round stop at this handoff.

At clean source revision `637ca38e76723f629ab070cab1a3e9b7e230ee86` on Node v26.12.0, `npm run test:coverage:direct -- src/logging.ts src/settings.ts` exited 0. Both pairs met 100% direct line, function, and branch coverage. The fresh full `npm run check` exited 0 with a writable temporary npm cache and local loopback socket access. Six static checks, compiled unpaired tests, 104 of 104 Cucumber scenarios, 1156 of 1156 steps, and merged direct LCOV for 43 isolated pairs passed. Full output is `/private/tmp/guardian-06-03-full-final.log`. `git diff --stat 637ca38 -- src test features scripts package.json package-lock.json config.schema.json tsconfig.json tsconfig.build.json tsconfig.test.json eslint.config.js .fallowrc.json .pre-commit-config.yaml .github/workflows` was empty, and there were no untracked inputs.

Two restricted attempts did not pass: the default npm cache caused `EPERM` in two package-inspection tests; with a writable cache, Cucumber's fake cloud could not bind `127.0.0.1` in the sandbox. The final run used the same executable inputs and passed. These were environment-access failures, not code corrections.

## Repair after round 0: CR-06-ENTRY-011, 012, and 015

Commit `ffcc32b` adds separate copyright and overview JSDocs to `src/index.ts`. It keeps the Apache SPDX line and the Homebridge template attribution. Commit `fa10938` adds the approved SPDX, copyright, and overview header to `test/index.test.ts`. Commit `f2e0373` changes the exported function description to a third-person verb phrase. Each finding has its own style-only commit. The `registerPlatform` call, name, class, imports, and test assertions are unchanged.

After each edit, `npm run test:coverage:direct -- src/index.ts` exited 0 at 100% direct line, function, and branch coverage. Fallow guard and audit, the pre-commit step, and normal commit hooks passed for each cause. The first independent ENTRY correction round has not yet run, so the round-0 count remains 15 open IDs.

## Correction round 1: complete ENTRY re-review

Independent `gsd-code-reviewer` agent `entry_round1_review` read all six complete files at clean source revision `591c5a6d030c3c658d098b597f439915ed06ea39`, with no dirty or untracked inputs: `src/logging.ts` 1–200, `test/logging.test.ts` 1–555, `src/settings.ts` 1–36, `test/settings.test.ts` 1–54, `src/index.ts` 1–23, and `test/index.test.ts` 1–33. The reviewer checked the full files, not only the index diff since `637ca38`. The three index repairs and all twelve prior logging and settings repairs were present.

The reviewer independently marked CR-06-ENTRY-001 through 015 fixed. Its evidence covers longest-first substitution (`logging.ts:74–76`), escaped JSON secrets (`111–115`), lowercase bearer tokens (`28`), quoted passwords with commas (`31,37`), serialization fallback (`90–97`), callable and `.log` trailing-parameter assertions (`test/logging.test.ts:87–100,134–147`), six approved file headers (each file's opening lines), settings test phases (`test/settings.test.ts:18–54`), named logger functions (`logging.ts:157,184`), and the entry function description (`index.ts:18–23`).

The reviewer found one new BLOCKER, CR-06-ENTRY-016, at `src/logging.ts@591c5a6:32`. The unquoted authentication matcher stops at a comma. With no registered secret, `password=left,right` reaches the delegate as `password=[redacted],right`. The existing case at `test/logging.test.ts@591c5a6:387–400` covers a quoted password only. The reviewer reproduced the unquoted expression with the current regexes. This is a separate branch from fixed quoted-value finding 004; no fixed ID reopened. It requires an active owner regression and prior RED evidence before a source repair.

Round 1 counts: opening 15, fixed 15, rejected 0, new 1, reopened 0, closing 1. `15 - 15 - 0 + 1 + 0 = 1`. Open ID: 016. D-04 permits repair because closing is below opening, no fixed finding reopened, and this is round 1 of at most four. The round report and ledger were committed before work on 016.

## Repair after round 1: CR-06-ENTRY-016

At unchanged logging source commit `401704f`, the active owner case `AUTH-02 redacts a comma inside an unquoted password` compiled with `npm run build:test` (exit 0). Its named TAP run exited 1 on the exact delegate assertion: expected `posting password=[redacted]`, received `posting password=[redacted],right`. The complete TAP, test patch, unchanged source blob, and semantic assessment are in `06-ENTRY-RED-EVIDENCE.json`. The validator returned `RED_EVIDENCE_OK`. Commit `f7d5a4c` contains only that evidence; the active regression remained in the working tree.

Commit `f6c6317` removes the comma delimiter from the unquoted authentication-value matcher. The new named case passed (1/1), and `npm run test:coverage:direct -- src/logging.ts` exited 0 at 100% direct line, function, and branch coverage. `npm run --silent test:corresponding`, Fallow guard and audit, the pre-commit step, and normal commit hooks passed. The repair awaits independent round 2; the round-1 closing count remains one open ID.

## Correction round 2: D-04 no-progress stop

Independent `gsd-code-reviewer` agent `entry_round2_review` read all six complete files at clean source revision `e5a29d4896dfb1c1856c28f4deb37e0819907c9d`, with no dirty or untracked inputs: `src/logging.ts` 1–200, `test/logging.test.ts` 1–570, `src/settings.ts` 1–36, `test/settings.test.ts` 1–54, `src/index.ts` 1–23, and `test/index.test.ts` 1–33. The review covered the full files, not only the logging diff. The reviewer confirmed CR-06-ENTRY-016 fixed: the matcher at `logging.ts:32` consumes the entire unquoted comma password, and the active assertion at `test/logging.test.ts:402–415` checks the delegated text. IDs 001–015 stayed fixed; none reopened.

The reviewer accepted new WARNING CR-06-ENTRY-017 at `src/logging.ts@e5a29d4:32`. The same `[^"}]+` matcher consumes a following comma-delimited field. For example, `posting password=left,right, status=ok` becomes `posting password=[redacted]`. That drops `status=ok`, contrary to the local value-only pattern contract at `logging.ts:19–21`. The new regression checks an unquoted comma without a following field, so it does not catch this output. The reviewer reproduced the behavior with the current regex. A later correction would need to recognize a following field boundary and assert the complete delegate text.

Round 2 counts: opening 1, fixed 1, rejected 0, new 1, reopened 0, closing 1. `1 - 1 - 0 + 1 + 0 = 1`. Open ID: 017. Because an accepted finding remains and closing did not decrease, D-04 requires an immediate no-progress stop. No round 3 or further fix was started. The maintainer must resolve this stop before ENTRY or PLATFORM work continues.

At the reviewed revision, all three ENTRY pairs met 100% isolated direct line, function, and branch coverage. A fresh `npm run check` also passed with 104/104 Cucumber scenarios, 1156/1156 steps, and 43 isolated pairs. These checks do not override the independent finding or D-04 stop.

## One-time maintainer authorization after round 2

The maintainer answered the D-04 stop decision: **“Authorize one repair and re-review (Recommended).”** This permits one cause repair for CR-06-ENTRY-017 and one independent complete six-file correction review as round 3. It does not erase the round-2 no-progress stop or reset the ENTRY counter. If round 3 has any open finding, execution stops with the exact IDs. No further repair or round is authorized by this answer.

## One-time repair of CR-06-ENTRY-017

At unchanged logging source commit `07d039c`, the active owner case `AUTH-02 preserves a following field after an unquoted password` compiled with `npm run build:test` (exit 0). Its named TAP run exited 1 on the exact delegate assertion: expected `posting password=[redacted], status=ok`, received `posting password=[redacted]`. The complete TAP, active test patch, source blob, and semantic assessment are in `06-ENTRY-RED-EVIDENCE.json`. The validator returned `RED_EVIDENCE_OK`; evidence-only commit `001800e` contains no source or test change.

Commit `cad5804` changes the unquoted matcher to stop before a comma followed by a field assignment, while retaining commas inside the password. Both named unquoted-password cases passed (2/2), `npm run test:coverage:direct -- src/logging.ts` exited 0 at 100% direct line, function, and branch coverage, and `npm run --silent test:corresponding` passed. Fallow guard and audit, the pre-commit step, and normal commit hooks passed. The formatter changed layout only and its second run passed before the commit. The fix awaits the single authorized independent round 3.

## Correction round 3: one-time exception exhausted

Independent `gsd-code-reviewer` agent `entry_round3_review` read all six complete files at clean source revision `18f63241644aa5a0827bed5e2d9a49ed996bb5ec`, with no dirty or untracked inputs: `src/logging.ts` 1–203, `test/logging.test.ts` 1–585, `src/settings.ts` 1–36, `test/settings.test.ts` 1–54, `src/index.ts` 1–23, and `test/index.test.ts` 1–33. The diff from the prior reviewed source revision `e5a29d4` touched only logging source and owner test. The reviewer read each whole file, not only that diff.

The reviewer confirmed CR-06-ENTRY-017 fixed. `password=left,right, status=ok` now reaches the delegate as `password=[redacted], status=ok`, with an exact assertion at `test/logging.test.ts:417–430`. IDs 001–016 stayed fixed; none reopened.

The reviewer accepted new BLOCKER CR-06-ENTRY-018 at `src/logging.ts@18f6324:32–35` under `AGENTS.md` Privacy and D-06. An unregistered password `password=left,right=middle` reaches the delegate as `password=[redacted],right=middle`. The negative lookahead mistakes `right=` within the password for a new field assignment. The reviewer reproduced this output with the current expression. This is a distinct delimiter ambiguity introduced by the fix for 017; the original plain comma case for 016 remains covered. A future repair must protect ambiguous password text and add an exact delegate assertion.

Round 3 counts: opening 1, fixed 1, rejected 0, new 1, reopened 0, closing 1. `1 - 1 - 0 + 1 + 0 = 1`. Open ID: 018. The D-04 no-progress predicate holds, and the maintainer's one-time repair and re-review authorization is exhausted. No additional repair or round was started. PLATFORM dispatch remains blocked pending a new maintainer decision.

At the reviewed revision, all three ENTRY pairs met 100% isolated direct line, function, and branch coverage. A fresh `npm run check` passed with 104/104 Cucumber scenarios, 1156/1156 steps, and 43 isolated pairs. The passing checks do not override the reviewer finding or D-04 stop.

## Second maintainer decision: privacy first

The maintainer answered the round-3 stop decision: **“Yes, prioritize redaction (Recommended).”** This authorizes one bounded safety-first repair for CR-06-ENTRY-018 and one final independent complete six-file review as round 4. The unquoted password remainder must be redacted even if later log fields are lost. The previous ENTRY-017 field-preservation expectation becomes an accepted tradeoff under this explicit policy; it is not silently reopened. Both prior D-04 stop records and their counts remain in this report. If round 4 has any open finding, the four-round cap requires a stop with exact IDs and no more repair or review.
