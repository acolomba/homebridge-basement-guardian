---
phase: "06"
slug: "root-module-conformance"
status: complete
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-19"
---

# Phase 6 — Validation Strategy

> Per-phase feedback contract. The task map below records executed checks and
> the final evidence at the reviewed Phase 6 tree.

## Test Infrastructure

| Property | Value |
| --- | --- |
| Framework | Native `node:test`, `node:assert/strict`, compiled TypeScript ESM; Cucumber in the full gate |
| Config file | `tsconfig.test.json`, `scripts/check-corresponding-tests.mjs`, `scripts/test-coverage-direct.mjs` |
| Quick run command | `npm run build:test && node --test dist-test/test/<owner>.test.js` |
| Pair coverage command | `npm run test:coverage:direct -- src/<owner>.ts` |
| Full suite command | `npm run check` |
| Estimated runtime | About one minute for the full gate on this host; record actual duration |

## Sampling Rate

- After a cause edit, run the owning test and direct coverage for every
  touched root pair. A shared contract edit also tests affected consumers.
- Every commit uses the repository's normal pre-commit and commit hooks.
- After each combined wave and before phase verification, run `npm run check`.
- Reuse passing evidence only for identical inputs under
  `.agents/skills/local-verification/rules/gates.md`.

ENTRY's correction round four remains a historical cap STOP with
CR-06-ENTRY-019/020 open at that revision. The separate post-debug review
found both fixed in the current code. Debug commits `24f3620` and `2d291cc`,
fresh automated gates, and the maintainer's “Confirmed fixed” Homebridge
workflow result close ENTRY without incrementing the correction-round counter.
Plans 06-05 through 06-08 may proceed in dependency order.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 06-01-01 | 06-01 | 1 | ROOT-01 (PROC-01/02 applied) | T-06-01/T-06-SC | Twelve-file ledger and four-round protocol; no package install | document check | `rg -q '^## Scope and authority$' .planning/phases/06-root-module-conformance/06-REVIEW-PROTOCOL.md && rg -q '^## Finding ledger$' .planning/phases/06-root-module-conformance/06-FINDINGS.md` | ✅ | ✅ protocol and ledger committed; twelve-file scope checked |
| 06-01-02 | 06-01 | 1 | ROOT-01 | T-06-01 | Current baseline and pairing | pairing + full | `npm run --silent test:corresponding`; `npm run check` | ✅ | ✅ baseline pairing and full gate recorded in findings |
| 06-02-01 | 06-02 | 2 | ROOT-01 (PROC-01 applied) | T-06-02/03 | Four complete files reviewed | pairing + manual review | `npm run --silent test:corresponding` | ✅ | ✅ four complete CONFIG_PROTOCOL files reviewed |
| 06-02-02 | 06-02 | 2 | ROOT-01 (BUG-01 applied) | T-06-02 | Config refusal and secret privacy | direct coverage | `npm run test:coverage:direct -- src/config.ts` | ✅ | ✅ config RED/GREEN fixes and direct owner passed |
| 06-02-03 | 06-02 | 2 | ROOT-01 (PROC-02 applied) | T-06-02/03 | Protocol contract and clean batch | direct coverage + full | `npm run test:coverage:direct -- src/config.ts src/protocol.ts`; `npm run check` | ✅ | ✅ CONFIG_PROTOCOL round two closed; full gate passed |
| 06-03-01 | 06-03 | 3 | ROOT-01 (PROC-01 applied) | T-06-04/05 | Six complete ENTRY files reviewed | pairing + manual review | `npm run --silent test:corresponding` | ✅ | ✅ six complete ENTRY files reviewed |
| 06-03-02 | 06-03 | 3 | ROOT-01 (BUG-01 applied) | T-06-04 | Logger redacts all routed secrets | direct coverage | `npm run test:coverage:direct -- src/logging.ts` | ✅ | ✅ logging RED/GREEN and isolated owner passed |
| 06-03-03 | 06-03 | 3 | ROOT-01 | T-06-05 | Settings identity remains stable | direct coverage + full | `npm run test:coverage:direct -- src/logging.ts src/settings.ts`; `npm run check` | ✅ | ✅ settings identity and combined gate passed |
| 06-04-01 | 06-04 | 4 | ROOT-01 (PROC-01/02 applied) | T-06-06/07/17 | One independent post-debug review covers all six ENTRY files and 019/020 plus adjacent cases | owner unit + pairing + manual review | `npm run build:test && node --test dist-test/test/logging.test.js dist-test/test/settings.test.js dist-test/test/index.test.js`; `npm run --silent test:corresponding` | ✅ | ✅ review clean at `b24cd83`; 52/52 owner tests and pairing pass |
| 06-04-02 | 06-04 | 4 | ROOT-01 (BUG-01 applied) | T-06-07/17 | True debug ancestry, explicit real Homebridge result, and current clean gates close ENTRY separately from round four | direct coverage + full + human result | `npm run test:coverage:direct -- src/logging.ts src/settings.ts src/index.ts`; `npm run check` | ✅ | ✅ all automated gates pass; maintainer confirmed the Homebridge workflow |
| 06-05-01 | 06-05 | 5 | ROOT-01 (PROC-01 applied) | T-06-08/09/10 | One reviewer covers full 673/3781 platform pair at current spans | pairing + manual review | `npm run --silent test:corresponding` | ✅ | ✅ complete PLATFORM round zero reviewed |
| 06-05-02 | 06-05 | 5 | ROOT-01 (PROC-01/02 applied) | T-06-08/09/10/11 | PLATFORM round 0 has stable IDs and no source edits | direct coverage + ledger | `npm run test:coverage:direct -- src/platform.ts` | ✅ | ✅ eight accepted and three rejected IDs recorded |
| 06-06-01 | 06-06 | 6 | ROOT-01 (BUG-01 applied) | T-06-12/13 | Accepted initial behavior causes have RED-before-GREEN evidence | direct coverage | `npm run test:coverage:direct -- src/platform.ts` | ✅ | ✅ 001 RED/GREEN and direct owner passed |
| 06-06-02 | 06-06 | 6 | ROOT-01 (PROC-02 applied) | T-06-12/13 | First independent full-file correction round retains PLATFORM IDs | direct coverage + full | `npm run test:coverage:direct -- src/platform.ts`; `npm run check` | ✅ | ✅ round one counted 8 to 4; combined gate passed |
| 06-07-01 | 06-07 | 7 | ROOT-01 (PROC-02, BUG-01 applied) | T-06-14/15 | Remaining independent full-file rounds close or stop under one counter | direct coverage + manual review | `npm run test:coverage:direct -- src/platform.ts` | ✅ | ✅ rounds two and three counted 4 to 1 to 0 |
| 06-07-02 | 06-07 | 7 | ROOT-01 | T-06-14/15 | Terminal PLATFORM owner coverage and combined gate are current | direct coverage + full | `npm run test:coverage:direct -- src/platform.ts`; `npm run check` | ✅ | ✅ terminal platform direct and full gates passed |
| 06-08-01 | 06-08 | 8 | ROOT-01 (PROC-01/02, BUG-01 applied) | T-06-16 | Twelve-owner ledger and bug ancestry reconcile | pairing + ledger audit | `npm run --silent test:corresponding` | ✅ | ✅ twelve owners, findings, and sixteen RED ancestries reconciled |
| 06-08-02 | 06-08 | 8 | ROOT-01 | T-06-16 | Final combined tree and coverage pass | full | `npm run check` | ✅ | ✅ final full gate passed on unchanged executable inputs |
| Confirmed behavior bug | owning cause | owner wave | ROOT-01 (BUG-01 applied) | owning threat | Active named regression fails before fix | RED evidence + owner | `node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence <evidence-file> --raw` | ✅ | ✅ sixteen planning RED ancestries audited; debug sequence recorded separately |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

## Wave 0 Requirements

Existing source/test pairs and build tooling cover the phase. Create the
Phase 6 ledger and review protocol before the first independent review.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
| --- | --- | --- | --- |
| Complete-file style, comment, and test-rule review | ROOT-01 | Reviewer judgment is not a runtime property | Read all twelve current files under the project rulebooks; log rule, location, severity, and disposition for each finding. |
| Review convergence | ROOT-01 (PROC-02 applied) | Independent correction rounds require judgment | Preserve the round-four STOP and its exact IDs; conduct one separate post-debug full-file review, then halt on any accepted open finding. |
| Original Homebridge logging workflow | ROOT-01 (BUG-01 applied) | The agent has no access to the maintainer's original real Homebridge workflow | The maintainer repeats that workflow and explicitly reports whether any unredacted credential suffix or unregistered password value reaches Homebridge logs, without sharing actual credential bytes. No response leaves 06-04 and PLATFORM blocked. |

## Validation Sign-Off

- [x] Every plan task has an executable `<automated>` check or an explicit
      manual reviewer action.
- [x] No three consecutive tasks lack an automated check.
- [x] Every modified pair reaches 100% direct coverage alone.
- [x] No watch-mode flags appear in test commands.
- [x] `nyquist_compliant: true` is set only after execution evidence exists.

**Approval:** complete. The maintainer confirmed the original Homebridge logging workflow; the remaining review and gate evidence is recorded below.

## Execution Evidence

The twelve-file inventory and final current-code finding outcomes are reconciled in `06-FINDINGS.md`. CONFIG_PROTOCOL closed in correction round two, and PLATFORM closed in round three. ENTRY retains its historical round-four STOP and two IDs at that revision; the separately authorized post-debug full-file validation closed both in current code after the maintainer reported “Confirmed fixed.” The correction counter was not reset or extended.

The sixteen Phase 6 planning RED evidence commits were checked for evidence-only paths and ancestry before their GREEN fixes. Each affected owner passed after its fix. The separate logging debug record preserves its actual active RED and revert/reconfirm sequence for the two post-cap causes. All 43 stable finding IDs in the three batch reports match the ledger (CONFIG_PROTOCOL 8, ENTRY 20, PLATFORM 15), and all twelve review-counter equations reconcile.

At final check revision `9861492` on Node v26.12.0, the executable-input diff from the clean reviewed PLATFORM revision `6c0e8bd` was empty across source, tests, support, package, schema, build/lint/coverage configuration, and workflows; there were no untracked executable inputs. Pairing exited 0. The six current root pairs passed `npm run test:coverage:direct -- src/config.ts src/protocol.ts src/logging.ts src/settings.ts src/index.ts src/platform.ts` at 100% isolated line, function, and branch coverage. With `NPM_CONFIG_CACHE=/private/tmp/guardian-06-final-npm-cache` and local socket access, the final `npm run check` exited 0 in about 56 seconds: static checks, compiled unpaired tests, 104/104 Cucumber scenarios, 1156/1156 steps, and 43 isolated coverage pairs passed. Planning-only edits after that check do not change its executable inputs.

Threat references T-06-01 through T-06-17 were checked against the task map, three batch reports, RED/GREEN histories, and current gates. T-06-SC had no package install in this phase. The remaining milestone GATE-01, GATE-02, and hardware checks belong to later phases.
