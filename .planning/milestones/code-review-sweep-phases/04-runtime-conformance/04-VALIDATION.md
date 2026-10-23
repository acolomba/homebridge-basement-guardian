---
phase: "04"
slug: "runtime-conformance"
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-14"
validated: "2026-10-16"
---

# Phase 4 — Validation Strategy

This validation map covers all 19 executed plans and 48 actual tasks. Automated task coverage is complete. RUN-01 remains PARTIAL/Pending because phase goal/security verification and three actual human judgments remain required. Nyquist compliance stays false conservatively until those judgments are resolved. A passing coverage gate does not supply human acceptance.

## Audit Scope and Evidence

This is a validation-coverage audit, not another whole-batch correction review. It consumes existing independent review and native execution evidence. It does not reopen or re-review all 87 findings. The 14 MB seal is processed structurally; there is no claim that every serialized byte was manually read. Source/test names, contracts, verify blocks, current blob identities and native streams establish the map.

The current reference is `cda29908927ef5dbfddcbe31e31e65ba95aa01e8`. The canonical seal SHA256 is `bad44c95f952224b042dd35a98327e62e241ebb0dbb85c733d7d0ddf4c3b211c`. It records 34 reviewed paths (20 original core paths), 14 pairs, 87 closed findings, ten whole-batch rounds, 27 genuine RED records across nine bug episodes, 39 maintenance attempts/43 intended targets, eight seeds, 32 threats, 137 historical plan-qualified threat occurrences and 99 historical commits. These record counts do not imply a new bug or threat classification.

## Test Infrastructure

| Property | Actual evidence |
| --- | --- |
| Framework | Native node:test / node:assert/strict; strict TypeScript ESM; existing Cucumber runner |
| Runtime | Node v26.11.1, npm 11.20.0 |
| Focused feedback | npm run build:test followed by exact compiled owner |
| Isolated coverage | npm run test:coverage:direct -- <source.ts> <owner.test.ts> |
| Full combined gate | npm run check |
| Executable pairs | 12 in current seal, each isolated 100% lines/functions/branches |
| Declaration-only pairs | accessoryStore and commandPort: meaningful strict compiler contracts, zero authored runtime cases, coverage null |
| Unpaired architecture owner | test/architecture/platformWiring.test.ts: ten typed positive/negative configured-rule controls; actual unpaired selector, no invented source denominator |

The direct selector rejects missing/wrong executable LCOV sources and any unequal hit/found denominator. Its type-only branch permits no LCOV records after strict compilation. The AccessoryStore void callback intentionally accepts a value-returning implementation; omission and noncallable persistence are the meaningful negatives. CommandOutcome checks require a refusal cause and closed discriminants/vocabulary.

## Current Full Gate and Feedback Latency

The latest actual full gate is `/private/tmp/guardian-04-10-closeout/postseal/full-gate/attempt.json`: npm run check, raw exit 0, empty stderr, Node v26.11.1/npm 11.20.0, at source HEAD 3ed5af03cefba8928a7b863fc999ccd7c20a64b9, 2026-10-16T15:39:39.811823+00:00 through 15:40:35.513971+00:00 (55.702148 seconds). It reports six passing static checks, 104 Cucumber scenarios/1156 steps and 43 isolated pairs. Successful unpaired output is suppressed; no unpaired count is inferred.

A fresh read-only comparison of all 721 recorded tracked/untracked input entries to the current tree finds only `.planning/ROADMAP.md` and the exact declared generated `.planning/phases/04-runtime-conformance/04-SEAL-AUDIT.json` differ. All 28 recorded source/owner blobs still match Git hash-object. This preserves applicability of the existing gate under the project rulebook; the generated seal is an exact existing exception, not a general JSON exclusion. Historical native evidence continues to describe its original tool versions and inputs.

| Observed command | Native UTC interval | Actual elapsed |
| --- | --- | ---: |
| Final ledger tracer | 15:42:35.395964–15:42:35.578405 | 0.182441 s |
| Final history audit | 15:42:36.132864–15:42:38.232101 | 2.099237 s |
| Final automated seal audit | 15:42:38.820157–15:43:06.814953 | 27.994796 s |
| Plan19 readiness build | 07:12:14.160015–07:12:17.185411 | 3.025396 s |
| Plan19 seven-owner readiness | 07:12:24.398046–07:12:46.405964 | 22.007918 s |

These are measured process intervals, not a universal feedback guarantee. Some whole-owner/full gates exceed a 30-second feedback target. Do not invent an estimated latency for any task lacking retained timestamps.

## Exact Command Keys

`BUILD` is `npm run build:test`. Every compiled owner below requires a fresh build or exact unchanged compiled-input evidence. `PAIR:<name>` expands to the exact command in this table.

| Key | Exact command | Result |
| --- | --- | --- |
| PAIR:runtime/accessoryStore | `npm run test:coverage:direct -- src/runtime/accessoryStore.ts test/runtime/accessoryStore.test.ts` | compiler contract / null coverage; exit 0 |
| PAIR:runtime/clock | `npm run test:coverage:direct -- src/runtime/clock.ts test/runtime/clock.test.ts` | isolated 100/100/100; exit 0 |
| PAIR:runtime/monotonicClock | `npm run test:coverage:direct -- src/runtime/monotonicClock.ts test/runtime/monotonicClock.test.ts` | isolated 100/100/100; exit 0 |
| PAIR:runtime/timers | `npm run test:coverage:direct -- src/runtime/timers.ts test/runtime/timers.test.ts` | isolated 100/100/100; exit 0 |
| PAIR:runtime/commandPort | `npm run test:coverage:direct -- src/runtime/commandPort.ts test/runtime/commandPort.test.ts` | compiler contract / null coverage; exit 0 |
| PAIR:runtime/failureLog | `npm run test:coverage:direct -- src/runtime/failureLog.ts test/runtime/failureLog.test.ts` | isolated 100/100/100; exit 0 |
| PAIR:runtime/retryPolicy | `npm run test:coverage:direct -- src/runtime/retryPolicy.ts test/runtime/retryPolicy.test.ts` | isolated 100/100/100; exit 0 |
| PAIR:runtime/arrivalAnchors | `npm run test:coverage:direct -- src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts` | isolated 100/100/100; exit 0 |
| PAIR:runtime/monitoringHealth | `npm run test:coverage:direct -- src/runtime/monitoringHealth.ts test/runtime/monitoringHealth.test.ts` | isolated 100/100/100; exit 0 |
| PAIR:runtime/accountRuntime | `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts` | isolated 100/100/100; exit 0 |
| PAIR:cloud/shadow | `npm run test:coverage:direct -- src/cloud/shadow.ts test/cloud/shadow.test.ts` | isolated 100/100/100; exit 0 |
| PAIR:accessories/reconciliation | `npm run test:coverage:direct -- src/accessories/reconciliation.ts test/accessories/reconciliation.test.ts` | isolated 100/100/100; exit 0 |
| PAIR:platform | `npm run test:coverage:direct -- src/platform.ts test/platform.test.ts` | isolated 100/100/100; exit 0 |
| PAIR:logging | `npm run test:coverage:direct -- src/logging.ts test/logging.test.ts` | isolated 100/100/100; exit 0 |

`TRACER`, `SEAL` and `HISTORY` mean the exact literal inline node predicates in 04-10 PLAN verify blocks. Their complete argv and input/stream hashes are retained in `/private/tmp/guardian-04-10-canonical/final-native/{tracer,seal,history}-labels-final/attempt.json`, not paraphrased substitute commands. Their stdout is respectively RUNTIME_LEDGER_TRACER_OK, RUNTIME_SEAL_AUTOMATED_AUDIT_OK and RUNTIME_HISTORY_AUDIT_OK; all three raw exits are 0 and stderr is empty. Stream SHA256 values were independently compared with retained streams during this audit.

## Per-Task Verification Map

All rows address RUN-01. COVERED denotes the task’s automated verification obligation, not completion of phase acceptance. Reviews/caller traces/header inspection/history judgments still rely on actual retained independent reports; a green owner alone does not prove those process obligations. Tasks are listed by actual wave rather than original draft order. The full literal command and fail-condition map is in the companion temporary audit task-map.json, extracted directly from the current plans.

| Task | Wave | Observable obligation | Commands | Coverage |
| --- | ---: | --- | --- | --- |
| 04-01-01 | 1 | Prove the accessory persistence declaration after full PORTS initial review | `npm run build:test && node --test dist-test/test/runtime/accessoryStore.test.js`; `npm run test:coverage:direct -- src/runtime/accessoryStore.ts test/runtime/accessoryStore.test.ts` | COVERED |
| 04-01-02 | 1 | Complete wall-clock conformance without collapsing time domains | `npm run build:test && node --test dist-test/test/runtime/clock.test.js`; `npm run test:coverage:direct -- src/runtime/clock.ts test/runtime/clock.test.ts` | COVERED |
| 04-02-01 | 2 | Prove forward elapsed readings through the public monotonic adapter | `npm run build:test && node --test dist-test/test/runtime/monotonicClock.test.js`; `npm run test:coverage:direct -- src/runtime/monotonicClock.ts test/runtime/monotonicClock.test.ts` | COVERED |
| 04-02-02 | 2 | Finish scheduling causes and re-review every PORTS file | `npm run build:test && node --test dist-test/test/runtime/timers.test.js`; `npm run test:coverage:direct -- src/runtime/timers.ts test/runtime/timers.test.ts` | COVERED |
| 04-03-01 | 3 | Prove accepted/refused public outcomes after the whole POLICIES review | `npm run build:test && node --test dist-test/test/runtime/commandPort.test.js`; `npm run test:coverage:direct -- src/runtime/commandPort.ts test/runtime/commandPort.test.ts` | COVERED |
| 04-03-02 | 3 | Complete safe failure-stream conformance with exact cadence observations | `npm run build:test && node --test dist-test/test/runtime/failureLog.test.js`; `npm run test:coverage:direct -- src/runtime/failureLog.ts test/runtime/failureLog.test.ts` | COVERED |
| 04-04-01 | 4 | Prove the public retry schedule with one pending abortable path | `npm run build:test && node --test dist-test/test/runtime/retryPolicy.test.js`; `npm run test:coverage:direct -- src/runtime/retryPolicy.ts test/runtime/retryPolicy.test.ts` | COVERED |
| 04-04-02 | 4 | Independently close all POLICIES files with continuous round arithmetic | `npm run build:test && node --test dist-test/test/runtime/commandPort.test.js dist-test/test/runtime/failureLog.test.js dist-test/test/runtime/retryPolicy.test.js` | COVERED |
| 04-05-01 | 5 | Prove one stored arrival through restore before repairing TRUST | `npm run build:test && node --test dist-test/test/runtime/arrivalAnchors.test.js`; `npm run test:coverage:direct -- src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts` | COVERED |
| 04-05-02 | 5 | Finish arrival causes and verify current restart/privacy narrative | `npm run test:coverage:direct -- src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts` | COVERED |
| 04-05-03 | 5 | Resolve CR-04-TRUST-005 through a compatible temporary-path dependency | `npm run typecheck && npm run build:test && node --test --test-reporter=tap dist-test/test/runtime/arrivalAnchors.test.js dist-test/test/runtime/accountRuntime.test.js`; `npm run test:coverage:direct -- src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts` | COVERED |
| 04-06-01 | 6 | Prove one device arrival through a distinct two-device trust projection | `npm run build:test && node --test dist-test/test/runtime/monitoringHealth.test.js`; `npm run test:coverage:direct -- src/runtime/monitoringHealth.ts test/runtime/monitoringHealth.test.ts` | COVERED |
| 04-06-02 | 6 | Complete health causes and full TRUST independent correction | `npm run test:coverage:direct -- src/runtime/monitoringHealth.ts test/runtime/monitoringHealth.test.ts` | COVERED |
| 04-06-03 | 6 | Verify the preserved monitoring fake through a shared memory contract | `npm run typecheck && npm run build:test && node --test --test-reporter=tap dist-test/test/runtime/arrivalAnchors.test.js dist-test/test/runtime/monitoringHealth.test.js`; `npm run test:coverage:direct -- src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts`; `npm run test:coverage:direct -- src/runtime/monitoringHealth.ts test/runtime/monitoringHealth.test.ts` | COVERED |
| 04-11-01 | 7 | Check ACCOUNT arrival-anchor agreement | `npm run build:test && node --test dist-test/test/runtime/accountRuntime.test.js dist-test/test/runtime/arrivalAnchors.test.js dist-test/test/runtime/monitoringHealth.test.js`; `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts`; `npm run test:coverage:direct -- src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts`; `npm run test:coverage:direct -- src/runtime/monitoringHealth.ts test/runtime/monitoringHealth.test.ts` | COVERED |
| 04-11-02 | 7 | Check ACCOUNT shadow lifecycle agreement | `npm run build:test && node --test dist-test/test/runtime/accountRuntime.test.js dist-test/test/cloud/shadow.test.js`; `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts`; `npm run test:coverage:direct -- src/cloud/shadow.ts test/cloud/shadow.test.ts` | COVERED |
| 04-07-01 | 8 | Prove restore-to-admission after reviewing the whole ACCOUNT pair | `npm run build:test && node --test dist-test/test/runtime/accountRuntime.test.js`; `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts` | COVERED |
| 04-07-02 | 8 | Complete owned lifecycle, polling, credential rotation and shutdown causes | `npm run build:test && node --test dist-test/test/runtime/accountRuntime.test.js`; `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts` | COVERED |
| 04-12-01 | 9 | Seed known physical IDs through the existing runtime start boundary | `npm run build:test && node --test dist-test/test/runtime/accountRuntime.test.js`; `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts` | COVERED |
| 04-12-02 | 9 | Prove and wire restored platform identities at launch | `npm run build:test && node --test dist-test/test/platform.test.js dist-test/test/runtime/accountRuntime.test.js`; `npm run test:coverage:direct -- src/platform.ts test/platform.test.ts`; `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts` | COVERED |
| 04-12-03 | 9 | Isolate mocked timers before recursive storage teardown | `npm run build:test && node --test dist-test/test/platform.test.js`; `npm run test:coverage:direct -- src/platform.ts test/platform.test.ts` | COVERED |
| 04-08-01 | 10 | Prove reported ingress through canonical state and two-device trust | `npm run build:test && node --test dist-test/test/runtime/accountRuntime.test.js`; `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts` | COVERED |
| 04-08-02 | 10 | Finish trustworthy inventory, removal and anchor ownership causes | `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts` | COVERED |
| 04-08-03 | 10 | Add targeted reconciliation presence reset for original 021 | `npm run build:test && node --test dist-test/test/accessories/reconciliation.test.js`; `npm run test:coverage:direct -- src/accessories/reconciliation.ts test/accessories/reconciliation.test.ts` | COVERED |
| 04-13-01 | 11 | Relinquish replaced shadow ownership through the real runtime path —030 | `npm run build:test && node --test dist-test/test/runtime/accountRuntime.test.js`; `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts`; `GSD_RUNTIME=codex node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence .planning/phases/04-runtime-conformance/04-ACCOUNT-RUNTIME-RED-EVIDENCE.json --raw` | COVERED |
| 04-13-02 | 11 | Fail visibly and suspend uncertain accessory registration until restart —031 | `npm run build:test && node --test dist-test/test/platform.test.js`; `npm run test:coverage:direct -- src/platform.ts test/platform.test.ts`; `GSD_RUNTIME=codex node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence .planning/phases/04-runtime-conformance/04-PLATFORM-RED-EVIDENCE.json --raw` | COVERED |
| 04-13-03 | 11 | Observe the configured poll immediately before its deadline —044 | `npm run build:test && node --test dist-test/test/runtime/accountRuntime.test.js`; `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts` | COVERED |
| 04-14-01 | 12 | Conform local callable bindings through all three real owners —032 | `npm run build:test && node --test dist-test/test/runtime/accountRuntime.test.js dist-test/test/accessories/reconciliation.test.js dist-test/test/platform.test.js`; `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts src/accessories/reconciliation.ts test/accessories/reconciliation.test.ts src/platform.ts test/platform.test.ts` | COVERED |
| 04-14-02 | 12 | State current platform rationale in source and owner comments —033 | `npm run build:test && node --test dist-test/test/platform.test.js`; `npm run test:coverage:direct -- src/platform.ts test/platform.test.ts` | COVERED |
| 04-14-03 | 12 | Make discovery's Homebridge API double satisfy its actual contract —034 | `npm run build:test && node --test dist-test/test/platform.test.js`; `npm run test:coverage:direct -- src/platform.ts test/platform.test.ts` | COVERED |
| 04-15-01 | 13 | Observe platform domain and security boundaries with silent incidental logs —035 | `npm run build:test && node --test dist-test/test/platform.test.js dist-test/test/logging.test.js`; `npm run test:coverage:direct -- src/platform.ts test/platform.test.ts src/logging.ts test/logging.test.ts` | COVERED |
| 04-15-02 | 13 | State complete finite platform public interactions —036 | `npm run build:test && node --test dist-test/test/platform.test.js`; `npm run test:coverage:direct -- src/platform.ts test/platform.test.ts` | COVERED |
| 04-15-03 | 13 | Give platform cases fresh seeds and their own trust maps —037 | `npm run build:test && node --test dist-test/test/platform.test.js`; `npm run test:coverage:direct -- src/platform.ts test/platform.test.ts` | COVERED |
| 04-16-01 | 14 | Await announced platform lifecycle boundaries —038 | `npm run build:test && node --test dist-test/test/platform.test.js`; `npm run test:coverage:direct -- src/platform.ts test/platform.test.ts` | COVERED |
| 04-16-02 | 14 | Replace private-source gates and dispose their group/AAA overlap —039/040/041 | `npm run build:test && node --test dist-test/test/platform.test.js dist-test/test/architecture/platformWiring.test.js`; `node_modules/.bin/eslint . --max-warnings=0 --no-cache`; `npm run test:corresponding && npm run test:unpaired:compiled`; `npm run test:coverage:direct -- src/platform.ts test/platform.test.ts` | COVERED |
| 04-16-03 | 14 | Observe the actual platform HTTP dependency's absence —042 | `npm run build:test && node --test dist-test/test/platform.test.js`; `npm run test:coverage:direct -- src/platform.ts test/platform.test.ts` | COVERED |
| 04-17-01 | 15 | Forward every named device's complete monitoring trust —043 | `npm run build:test && node --test dist-test/test/platform.test.js`; `npm run test:coverage:direct -- src/platform.ts test/platform.test.ts` | COVERED |
| 04-17-02 | 15 | Review the whole current ACCOUNT batch and immediately enforce D-03 | `npm run build:test && node --test dist-test/test/runtime/accountRuntime.test.js dist-test/test/runtime/arrivalAnchors.test.js dist-test/test/cloud/shadow.test.js dist-test/test/accessories/reconciliation.test.js dist-test/test/platform.test.js dist-test/test/logging.test.js dist-test/test/architecture/platformWiring.test.js`; `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts src/cloud/shadow.ts test/cloud/shadow.test.ts src/accessories/reconciliation.ts test/accessories/reconciliation.test.ts src/platform.ts test/platform.test.ts`; `npm run test:coverage:direct -- src/logging.ts test/logging.test.ts`; `node_modules/.bin/eslint . --max-warnings=0 --no-cache`; `GSD_RUNTIME=codex node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence .planning/phases/04-runtime-conformance/04-ACCOUNT-RUNTIME-RED-EVIDENCE.json --raw`; `GSD_RUNTIME=codex node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence .planning/phases/04-runtime-conformance/04-PLATFORM-RED-EVIDENCE.json --raw` | COVERED |
| 04-18-01 | 16 | Capture both registration checkpoints before assertions —041 | `npm run build:test && node --test dist-test/test/platform.test.js`; `npm run test:coverage:direct -- src/platform.ts test/platform.test.ts` | COVERED |
| 04-18-02 | 16 | Describe the missing-entry fixture accurately —047 | `npm run build:test && node --test dist-test/test/platform.test.js`; `npm run test:coverage:direct -- src/platform.ts test/platform.test.ts` | COVERED |
| 04-18-03 | 16 | Flatten and name the complete architecture controls —046/048 | `npm run build:test && node --test dist-test/test/architecture/platformWiring.test.js`; `node_modules/.bin/eslint . --max-warnings=0 --no-cache`; `npm run test:corresponding && npm run test:unpaired:compiled` | COVERED |
| 04-19-01 | 17 | Observe the whole configured remaining service catalogue —045 | `npm run build:test && node --test --test-reporter=tap --test-name-pattern='publishes every adapter but the one an administrator ignored' dist-test/test/platform.test.js`; `npm run build:test && node --test dist-test/test/platform.test.js`; `npm run test:coverage:direct -- src/platform.ts test/platform.test.ts` | COVERED |
| 04-19-02 | 17 | Review the WHOLE current ACCOUNT batch and return the immediate D-03 result | `npm run build:test && node --test dist-test/test/runtime/accountRuntime.test.js dist-test/test/runtime/arrivalAnchors.test.js dist-test/test/cloud/shadow.test.js dist-test/test/accessories/reconciliation.test.js dist-test/test/platform.test.js dist-test/test/logging.test.js dist-test/test/architecture/platformWiring.test.js`; `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts src/cloud/shadow.ts test/cloud/shadow.test.ts src/accessories/reconciliation.ts test/accessories/reconciliation.test.ts src/platform.ts test/platform.test.ts`; `npm run test:coverage:direct -- src/logging.ts test/logging.test.ts`; `node_modules/.bin/eslint . --max-warnings=0 --no-cache`; `GSD_RUNTIME=codex node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence .planning/phases/04-runtime-conformance/04-ACCOUNT-RUNTIME-RED-EVIDENCE.json --raw`; `GSD_RUNTIME=codex node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence .planning/phases/04-runtime-conformance/04-PLATFORM-RED-EVIDENCE.json --raw`; `node -e 'const fs=require("node:fs"),assert=require("node:assert/strict"),red=require("./.codex/gsd-core/bin/lib/tdd-red-evidence.cjs");const base=".planning/phases/04-runtime-conformance/";for(const [file,expectedCount] of [["04-ACCOUNT-RUNTIME-RED-EVIDENCE.json",16],["04-PLATFORM-RED-EVIDENCE.json",7]]){let count=0;function walk(n){if(Array.isArray(n)){for(const child of n)walk(child);return;}if(!n\|\|typeof n!=="object")return;if(n.command&&Object.hasOwn(n,"exitCode")&&n.targetTest){assert.equal(red.classifyRedEvidence(n).verdict,"RED_EVIDENCE_OK");count++;if(n.priorEvidence)walk(n.priorEvidence);}else for(const child of Object.values(n))walk(child);}walk(JSON.parse(fs.readFileSync(base+file,"utf8")));assert.equal(count,expectedCount);console.log(file+" recursive "+count+" RED_EVIDENCE_OK");}'` | COVERED |
| 04-09-01 | 18 | Prove one real command from runtime port through exact family request/outcome | `npm run build:test && node --test dist-test/test/runtime/accountRuntime.test.js`; `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts` | COVERED |
| 04-09-02 | 18 | Close original implementation records after delegated whole correction19 | `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts` | COVERED |
| 04-09-03 | 18 | Isolate account storage cleanup from mocked retry timers | `npm run build:test && node --test dist-test/test/runtime/accountRuntime.test.js`; `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts` | COVERED |
| 04-10-01 | 19 | Trace one actual review outcome through report, current blobs and real Git commits | TRACER | COVERED |
| 04-10-02 | 19 | Audit the exact whole inventory, all histories, rounds, threats and final checked input | SEAL; HISTORY; `npm run build:test && node --test dist-test/test/packaging/licenseHeaders.test.js`; `npm run check` | COVERED |

## Failure Conditions

Every one of the 48 current task verify blocks declares fails_when. A nonzero command, stale/missing target, unintended skip/cancellation or incomplete promised public observation fails its mapped task. Executable pair failure includes missing/extra/wrong source LCOV or any line/function/branch below 100%. A declaration-only pair fails strict intended positive/negative compilation or selector acceptance; zero cases and null coverage are valid.

Specific controls also require the intended assertion to fail under the retained controlled defect, exact source/mode/literal-link restoration, a rebuilt green target and preserved original promises. Setup/import/parser errors and unrelated TypeErrors cannot substitute. Review tasks require whole original batch plus actual additions, exact revisions/headers, independent terminal review and continuous D-03 arithmetic; owner green alone is insufficient. Seal/history tasks reject missing/substituted paths, changed histories, unsupported audit exceptions, stale inputs, unresolved stop or inferred human approval. All literal task-specific conditions remain authoritative in each current PLAN.

## Wave 0 Requirements

- [x] Existing compiler, runner, source/test pairing and isolated selector are present and exercised.
- [x] Authored protocol and original twenty-file ownership ledger exist.
- [x] All four actual batch reports exist and retain original findings and continuous rounds.
- [x] Every actual task/wave/threat binding has automated commands and failure conditions.
- [x] Ledger, inventory and history predicates exist and ran with real native terminal evidence.
- [x] Source baseline and exact same-session check inputs are recorded; final pair identities are current.
- [x] Existing forced-none isolation is evidenced in dispatch records/summaries; current direct sentinel is phase04/plan04-10/isolation none.

Wave 0 marks available validation prerequisites, not blanket process compliance. Historical dispatch/serial/evidence exceptions in WINDOWS46–58 stay OPEN/unwaived. Later passing gates do not erase those failures.

## Manual-Only Judgments and Requirement Status

| ID | Actual status | Required resolution |
| --- | --- | --- |
| RUN-01 | PARTIAL / Pending | Complete independent goal/security verification and actual phase judgments; automated task coverage is present |
| E-04-01 | Unclassified, unresolved, flagged assumption | Actual human category/resolution/reason/verification; one surfaced = zero lifted + one flagged |
| P-04-01 | Descriptorless, unverified | Actual phase-specific human judgment; no serializer substitute |
| P-04-02 | Descriptorless, unverified | Actual phase-specific human judgment; two surfaced = two authored + zero omitted |

Vendor/hardware/real-home/install and release gates remain outside this validation audit. Exact acceptance is limited to 021 ce3305e /022 5987504 unknown historical audit exits (null remains null) and 008 84fd960’s exact post-audit title patch. It does not waive other WINDOWS46–58 entries. Prior Phase3 answers and the bounded historical acceptance supply none of the three pending phase judgments.

## Continuous Stop Accounting

ACCOUNT remains at correction counter3 with zero open findings. Any next whole correction would be round4 and must stop under D-03. The present coverage audit is not a fresh code-review/correction round. Original PORTS round2 stop and narrowly authorized009 continuation remain intact. No counter reset, generic new threat policy or RED reclassification is implied.

## Validation Sign-Off

- [x] All 19 actual plans and 48 tasks are represented; none lacks automated feedback or explicit failure condition.
- [x] No three consecutive tasks lack automated feedback.
- [x] All fourteen current source/owner identities match recorded pair evidence.
- [x] Twelve executable pairs have isolated 100% evidence; two declaration-only pairs retain compiler evidence and null coverage.
- [x] Expanded helpers/config/architecture owner and supporting logging pair have their actual assigned checks.
- [x] Current full gate and canonical tracer/history/seal streams have actual passing evidence.
- [x] Measurement scope, old versions/inputs, suppressed counts and historical limits stay explicit.
- [x] No tests, production files, reports, build outputs or Git state were changed by this read-only audit.
- [ ] Phase goal/security verification and all three actual human judgments complete RUN-01.
- [ ] nyquist_compliant may become true only after remaining required validation obligations are resolved.

## Coverage Audit Detail

| Metric | Result |
| --- | --- |
| Actual plans / tasks | 19 / 48 |
| Automated task obligations COVERED | 48 |
| Automated task obligations PARTIAL / MISSING | 0 / 0 |
| Newly discovered behavioral test gaps | 0 |
| Tests generated / executed in this audit | 0 / 0 (existing evidence reused on unchanged inputs) |
| Pending human judgments | 3 |
| Requirement classification | RUN-01 PARTIAL |
| Metadata gaps | Existing draft ten-wave/twenty-task map and stale flags need replacement by this actual map |

The parent publishes this map from the independent read-only Nyquist audit. The owning append-audit record follows; the independent task map and native proof remain under /private/tmp/guardian-phase4-nyquist-audit/.

## Validation Audit 2026-10-16

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Pending human judgments | 3 |
| Automated tasks covered | 48 |

## Final Human Resolution — 2026-10-16

The preceding audit describes its original pending state. The maintainer has now answered "pass" separately for E-04-01, P-04-01 and P-04-02 in 04-UAT.md. All 25 UAT rows pass: 22 automated entries and three human judgments; no issues, skipped, blocked or pending rows remain. The independent goal report passed its 24 automated checks, and its canonical status became passed after the owning UAT predicate passed. The security record has zero open declared threats. The requirement owner reported RUN-01 ready and marked it Complete.

Nyquist compliance is now true: all 48 tasks have feedback, and the three actual human obligations are satisfied. The edge remains unclassified/unresolved as an explicitly accepted coverage boundary; descriptorless prohibitions gained human judgments, not invented automated enforcement. The two historical audit exits remain null, the exact post-audit title qualification remains, and other WINDOWS46–58 remain OPEN/unwaived. No hardware, real-home, cross-version or release completion follows.

## Validation Audit 2026-10-23

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Pending human judgments | 0 |
| Automated tasks covered | 48 |
