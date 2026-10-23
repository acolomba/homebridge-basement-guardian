---
phase: "08"
slug: "final-sweep-and-gate"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-22"
---

# Phase 8 — Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Node test runner and Cucumber.js 13.2.1 |
| Config file | `tsconfig.test.json`, `cucumber.json`, `package.json` |
| Quick run command | `npm run build:test` followed by the affected owner test or default scenario |
| Full suite command | `TEST_CONCURRENCY=1 npm run check` |
| Estimated runtime | Record the measured duration at the Phase 8 gate |

## Sampling Rate

- After a source or test repair, run the focused owner test and direct pair
  coverage, or the affected offline Cucumber scenario. Use the normal commit
  hook after the committing skill's fixer step.
- After each combined repair wave, run `TEST_CONCURRENCY=1 npm run check`.
- Before Phase 8 verification and milestone audit, run the full gate on the
  final combined tree and record the exact commit, Node version, exit and scope.
- A planning-only commit may reuse same-session evidence only when executable
  inputs are proven unchanged by the local-verification rule.

## Per-Task Verification Map

The plan IDs and task commands will be added when Phase 8 plans exist.

| Task family | Requirement | Test type | Automated command | Status |
|-------------|-------------|-----------|-------------------|--------|
| Six complete-file review batches and correction rounds | GATE-02 | static review and owner checks | `TEST_CONCURRENCY=1 npm run check` after each combined repair wave | pending |
| Genuine bug provenance and new RED/GREEN evidence | BUG-01 | active target regression and Git audit | `gsd-tools check tdd-red-evidence <archive> --raw`, named owner test and Git ancestry checks | pending |
| Final combined tree | GATE-01 | static, unpaired, offline Cucumber and isolated direct coverage | `TEST_CONCURRENCY=1 npm run check` | pending |
| Prior phase verification freshness | GATE-01, GATE-02 | GSD verifier | `gsd-tools query verification.status <phase-dir>` for Phases 1–7 | blocked by current ROOT STOP |

## Prior-phase verifier refresh attempt

Plan 08-10 started after the former Phase 8 review seal. Phase 1's normal
verification-only route stopped at `tdd.review-checkpoint`: it requires separate
`test(01-01)` and `feat(01-01)` commits, while the approved D-06 plan retained
the active RED in a planning-only commit and committed the test with its fix.
Plan 08-22 corrected the plan's execution-mode metadata to `execute` and
documented the approved custom TDD task. The GSD checkpoint now reports
`block: false`, `violations: 0`, `tddPlans: 0` (skip). Separately, the actual
RED archive still reports `RED_EVIDENCE_OK`; Git proves source `109fda7` <
planning-only evidence `919d70d` < active test and fix `3878103`. This is a
metadata reconciliation, not a new RED/GREEN sequence. No old verifier status
was edited.

| Phase | Current GSD status after bounded acceptance | Remaining condition |
| --- | --- | --- |
| 01 | passed, 14/14 | Approved D-06 RED lineage retained; the standard checkpoint skips the custom path. |
| 02 | passed, 18/18 | No current gap. |
| 03 | passed, 22/22 | The maintainer accepted the current bounded scope; E-03-01 stays an acknowledged unclassified assumption and WINDOWS 46/47 remain open. |
| 04 | passed, 27/27 | Phase 8 repairs close the two earlier advisory findings. |
| 05 | passed, 12/12 | Historical GATES STOP and retired scanner findings stay visible. |
| 06 | passed, 5/5 concrete truths | A later Homebridge 2.4.0 Docker run passed the failed-write and identical-retry check with a synthetic bridged accessory. The resolved debug record retains the synthetic scope. |
| 07 | passed, 5/5 | Historical batch STOPs stay visible. |

At `9863d9b`, the Plan 08-20 full `npm run check` passed 130/130 scenarios,
1401/1401 steps, and all 43 direct coverage pairs on Node `v26.12.1`. This is
a combined-tree test result, not a verifier pass or a current review seal.

At `499659b`, Plan 08-21's full `NPM_CONFIG_CACHE=/private/tmp/guardian-phase8-plan21-npm-cache TEST_CONCURRENCY=1 npm run check` exited 0 on Node `v26.12.1`: 130/130 Cucumber scenarios, 1401/1401 steps, and 43 direct coverage pairs. The separate ROOT-003 review closed its only ID and a one-off exact-blob audit passed all 137 current paths. Both earlier STOP records remain unchanged. This check preceded the subsequent verifier refresh and signoff.

The six fresh verifier reports were generated through GSD's verifier route, with the report's covered-input fingerprint computed by GSD. Phase 2's existing report remains current. GSD status queries after the refresh returned exactly the statuses above. No report frontmatter was edited by the coordinator to force a pass. No executable input changed from `499659b` through the planning-only report refresh at `51ffc50`; `git diff --exit-code 499659b HEAD -- src test features package.json package-lock.json cucumber.json tsconfig.json tsconfig.test.json eslint.config.js scripts` exited 0.

The maintainer subsequently answered **“Accept this bounded scope”** for the
three Phase 3 judgments and **“Accept the limited evidence”** for the three
debug-only BUG-01 records and two Phase 8 prohibitions. The answers are in
[03-UAT.md](../03-device-and-persistence-conformance/03-UAT.md) and
[08-UAT.md](08-UAT.md). An independent Phase 3 verifier refresh reports
`passed`, 22/22. The later Homebridge 2.4.0 Docker run resolved Phase 6's
pending failed-write check, and its current verifier now reports `passed`,
5/5. No executable input changed after the `499659b` full gate.

## Homebridge integration closeout and fresh combined gate

On 2026-10-23 the maintainer authorized instrumentation and a Docker test.
At repository revision `ed35f84aa5b21c665308a5bf869c75f5c05dad78`, a
launched Homebridge 2.4.0 process on Node v24.22.1 registered and bridged a
synthetic Gemini accessory. The probe injected one flood `StatusActive` write
failure. The other 15 affected services became inactive on that report; an
identical second report retried the failed flood write and made all 16 affected
services inactive. The unaffected connectivity service stayed active. The
container exited 0. The [resolved debug record](../../debug/resolved/monitoring-trust-publication.md)
holds the image ID, probe hash, and observed values. The probe used no vendor
credentials and did not exercise a physical pump or Apple Home rendering.

The first fresh `TEST_CONCURRENCY=1 npm run check` attempt could not open the
Cucumber fake cloud's loopback socket in the sandbox (`listen EPERM
127.0.0.1`). It was interrupted after those environment failures and is not
counted as a pass. With local socket access, the exact command
`NPM_CONFIG_CACHE=/private/tmp/guardian-homebridge-closeout-npm-cache
TEST_CONCURRENCY=1 npm run check` exited 0 on Node v26.12.1 and npm 11.20.0.
Its log `/private/tmp/guardian-homebridge-closeout-check-authorized.log`
records six static passes, 130/130 offline Cucumber scenarios, 1401/1401
steps, and all 43 isolated direct coverage pairs. The executable-input diff
from `499659b` is empty, and no executable inputs are untracked.

Fresh default Cucumber usage dry run exited 0 with no unused, undefined, or
ambiguous definition. The real profile dry run exited 0 with 6/6 scenarios
and 35/35 steps skipped; it did not contact a vendor or device. GSD now
returns `passed` for Phase 6. All seven prior-phase statuses are `passed`.

## Final profile and window audit

The default `./node_modules/.bin/cucumber-js --dry-run --format usage` exited 0 and listed no `UNUSED`, undefined, or ambiguous definition. The read-only `./node_modules/.bin/cucumber-js --profile real --dry-run --format summary` exited 0: six scenarios and 35 steps were all skipped. The latter bound steps without contacting the vendor or running hardware. Both commands used the compiled inputs from the `499659b` full gate.

`gsd-tools windows status --raw` reconciled all 58 rows with the ledger counts. The original research baseline was 18 open, 19 waived, and 21 fixed. Window 36's three stale STATE statements have already been corrected; `gsd-tools windows fixed 36` changed only its status through the supported command. The current ledger is **17 open, 19 waived, 22 fixed**. All 19 waivers retain reasons.

| Open ID | Current disposition after individual audit |
| --- | --- |
| 11 | The old stale-marking binder mutation was never run; current tests do not reconstruct that assertion-strength proof. Keep open. |
| 14 | The earlier WR-05 and IN-03 deferral/disposition record is historical; do not infer closure from later code without its exact acceptance evidence. Keep open. |
| 35 | `carriesObservation` has unit and one scenario observation, but the historical single-tier concern is not retroactively disproved. Keep open. |
| 44 | Private vulnerability reporting still requires an external GitHub account/repository decision. Keep open. |
| 46 | Phase 3 formatter/commit ordering cannot be reconstructed; keep open. |
| 47 | Phase 3 alias-specific pre-edit trace cannot be reconstructed; keep open. |
| 48 | Phase 4 summary's pre-edit guard timing cannot be reconstructed; keep open. |
| 49 | Phase 4 fixer overlap with a still-running lint session cannot be reconstructed; keep open. |
| 50 | Phase 4 pre-first-commit ledger remains absent; keep open. |
| 51 | Phase 4 initial formatter/lint input bytes remain uncaptured; keep open. |
| 52 | Phase 4 canonical-root containment was checked only after the write; keep open. |
| 53 | Phase 4 generated state JSON lacked the original pre-mutation guard; keep open. |
| 54 | Phase 4 follow-up plans lacked a fresh guard before formatter edits; keep open. |
| 55 | Phase 4 native capture and serial-order gaps for Plan 14 remain historical; keep open. |
| 56 | Phase 4 native capture and read/compile ordering gaps for Plan 15 remain historical; keep open. |
| 57 | Phase 4 native capture and failed sandbox-attempt limits for Plan 16 remain historical; keep open. |
| 58 | Phase 4 explicit agent-effort dispatch and capture limits remain historical; keep open. |

These windows are separate from the Phase 8 review findings. The current Phase 8 forward-open ID set is empty. Window 11 is an old test-strength limit, 14 and 35 are evidence/deferral limits, 44 is external account configuration, and 46–58 are historical process records. None is silently counted as a current code defect or waived.

## Wave 0 Requirements

Existing Node, Cucumber and direct-coverage infrastructure covers this phase.
Execution must create a live file manifest, batch review reports, a Phase 8
findings ledger, and the milestone bug index. It must refresh the manifest when
the tree changes.

## Manual-Only Verifications

Phase 8 adds no new live vendor or hardware test. The real Cucumber profile
is dry-run only. The refreshed Phase 6 verifier still requires one real
Homebridge failed-write and retry check before the inherited phase result can
pass; the maintainer cannot run it now. Phase 8 signoff keeps that limit open.

## Validation Sign-Off

- [ ] Every plan task has a concrete automated check or explicit evidence audit.
- [ ] No three consecutive tasks lack automated verification.
- [ ] Every combined repair wave and the final tree pass the full gate.
- [ ] All 43 direct source/test pairs reach 100% line, function and branch coverage.
- [ ] No watch-mode flags or live real-pump execution.
- [ ] `nyquist_compliant: true` is set after the final evidence audit.

**Approval:** Pending Phase 8 execution and verification.
