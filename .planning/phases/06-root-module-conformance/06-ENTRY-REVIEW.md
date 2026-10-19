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

## Handoff to 06-04

This plan owns accepted logging and settings causes 001–010, 013, and 014. Plan 06-04 owns index causes 011, 012, and 015 and the first independent correction round across all six complete files. Its opening count is the same 15 IDs; it must account for every repair and may not reset ENTRY's counter.
