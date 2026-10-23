# Shadow conformance review

## Scope and baseline

Plan 02-02, isolation none, features/code-review-sweep. Baseline
82d6d1a32d2dd078f07691171407f4d9d3d26f7d. Full owned inventory:
src/cloud/shadow.ts (475 lines), test/cloud/shadow.test.ts (992 lines).
Independent initial reviewer: /root/phase2_shadow/shadow_initial_review,
gsd-code-reviewer. Complete style, comment, unit writer/reviewer and local
verification rulebooks apply. No initial review mutation occurred.

The coordinator's full check at eccbe11 passed 104 scenarios, 1,156 steps,
43 isolated pairs on Node v26.11.1. Build inputs remain identical at this
baseline. Changed build inputs require fresh owner and isolated coverage;
the coordinator owns the later full wave gate.

## Findings and initial triage

Every row concerns CLOUD-01, first round 0, accepted and initially open. Locations
below are qualified by baseline 82d6d1a. Assertion defects do not establish
production bugs. Initial opening count: 10 (3 BLOCKER, 7 WARNING).

| ID | Rule | Location | Severity | Evidence and minimum cause |
| --- | --- | --- | --- | --- |
| CR-02-SHADOW-001 | D-01; Google Files and modules | shadow.ts:1-6; shadow.test.ts:1-5 | WARNING | Missing separate SPDX/copyright/fileoverview blocks; preserve MIT and original copyright in separate header commit. |
| CR-02-SHADOW-002 | Comments Forbidden history narration | shadow.ts:99-105 | WARNING | These were once plain variables describes removed implementation; state current connection ownership. |
| CR-02-SHADOW-003 | Unit Assertions whole independent byte output | shadow.test.ts:399-429,683-717 | BLOCKER | Length/projection checks miss wrong secret forwarding; compare independently expected complete signed URLs and refreshed identities. |
| CR-02-SHADOW-004 | Unit Assertions complete promised result | shadow.test.ts:833-850 | BLOCKER | Filter-only privacy rows pass if callback is omitted; compare complete sanitized lifecycle. |
| CR-02-SHADOW-005 | Unit Case structure exported entrypoint groups | shadow.test.ts:250,398,432,581,624 | WARNING | Multiple operation/private-behavior groups; one flat createShadowClient group. |
| CR-02-SHADOW-006 | Unit Case structure AAA | shadow.test.ts:233-245,856-857 | WARNING | act & assert outside one throwing expression; separate observations and assertions. |
| CR-02-SHADOW-007 | Unit Test doubles logging role | shadow.test.ts:304-321,351-369,529-539,548-558,566-576,788-830 | WARNING | Exact logging assertions outside logging module; silent logger and existing public patch/lifecycle/state assertions. |
| CR-02-SHADOW-008 | Unit Test data seed placement | shadow.test.ts:65-73,673,689 | WARNING | Two-case rotated seed; inline small typed credential literals within pair scope. |
| CR-02-SHADOW-009 | Google Functions named declaration | shadow.test.ts:103 | WARNING | Untyped noop arrow; named function declaration or explicit function type. |
| CR-02-SHADOW-010 | Safety invalid-value semantics; bug scope; D-06 | shadow.ts:173-182,194-202 | BLOCKER | Raw JSON version 1e400 becomes Infinity; state watermark rejects subsequent finite versions. Require active unchanged-production RED then finite-number guard preserving undefined absence. |

The 010 caller trace is accountRuntime.ts:825-866 to state.ts:159-160,
269,277-287,363-373. No integer/range protocol assumption is introduced.
SHADOW_TOPICS has external feature consumers; no export deletion is proposed.
Transport collections are valid stateful fake observations, not a prescribed
interaction mock. Count checks retain their connection-count promise.
Current-connection guards, reported-only routing, readiness, deadlines,
rotation, shutdown and handshake-on-factory-call contracts remain authoritative.

Fallow guard exit 0 for both owned paths; no boundary rules are configured.
No package install, live vendor service or hardware run is authorized.

## Review rounds

Triage is round 0. Opening IDs were CR-02-SHADOW-001 through 010. Initial
triage was reported to the coordinator before repairs.

Round 1 independent reviewer: /root/phase2_shadow/shadow_initial_review,
gsd-code-reviewer. Complete 478-line source and 1,011-line test reviewed at
8277ae16577453bd270803f09941ee74f8b2fbd7, including the complete baseline
diff and all rulebooks. Every initial finding is independently fixed. The
reviewer explicitly reported zero new causes and zero reopened findings.

| Round | Opening | Fixed | Rejected | New | Reopened | Closing |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 10 | 10 | 0 | 0 | 0 | 0 |

Reconciliation: 10 - 10 - 0 + 0 + 0 = 0. Closing open list is empty.
The counts and IDs were reported before final record work. No stall,
reopening, or fourth-round cap occurred. This is batch review closure;
the coordinator's full wave gate and CLOUD-01 remain pending.

| ID | Final disposition | Location at reviewed 8277ae1 | Named behavior / evidence |
| --- | --- | --- | --- |
| CR-02-SHADOW-001 | Fixed | Both files:1-11 | Separate MIT SPDX, original copyright and overview, with exact spacing. |
| CR-02-SHADOW-002 | Fixed | shadow.ts:105-108 | Current connection ownership commentary. |
| CR-02-SHADOW-003 | Fixed | shadow.test.ts:402-427,697-738 | Both signs the handshake cases compare complete independent signed URLs and refreshed identity. Wrong-secret controls fail both assertions. |
| CR-02-SHADOW-004 | Fixed | shadow.test.ts:854-866 | Reports the complete sanitized lifecycle after a credential-bearing error; missing or wrong classification fails. |
| CR-02-SHADOW-005 | Fixed | shadow.test.ts:226,257 | Flat SHADOW_TOPICS and createShadowClient entrypoint groups. |
| CR-02-SHADOW-006 | Fixed | shadow.test.ts:227-253,868-877 | Separate arrange, act observations and assert; no combined nonthrowing marker. |
| CR-02-SHADOW-007 | Fixed | shadow.test.ts:74-88; affected lifecycle cases | Silent typed logger; complete public patch, connected, transport and classification outcomes retained. |
| CR-02-SHADOW-008 | Fixed | shadow.test.ts:681-687,703-709 | Fresh satisfies-checked rotated credentials in each case. |
| CR-02-SHADOW-009 | Fixed | shadow.test.ts:97-99 | Named no-op declaration. |
| CR-02-SHADOW-010 | Fixed | shadow.ts:204; shadow.test.ts:525-539 | Reports an overflowing document version as absent; raw JSON regression preserves telemetry with absent invalid version. |

## Check Results

Final focused verification at 8277ae16577453bd270803f09941ee74f8b2fbd7,
Node v26.11.1, uses fresh compiled inputs. Complete command/output manifest:
/private/tmp/guardian-shadow-fixer-actuals.json. No live vendor or hardware run.

| Command / check | Exit | Evidence |
| --- | --- | --- |
| npm run build:test && node --test --test-reporter=tap dist-test/test/cloud/shadow.test.js | 0 | Final 55/55 pass, no skips/cancellations; guardian-shadow-check-32.log. |
| npm run test:coverage:direct:compiled -- src/cloud/shadow.ts test/cloud/shadow.test.ts after fresh build | 0 | Current isolated owner enforces 100% lines/functions/branches; check-32.log. |
| npm run test:coverage:direct -- src/cloud/shadow.ts test/cloud/shadow.test.ts | 0 | Executor reran the exact plan command at the same unchanged code revision; /private/tmp/guardian-shadow-plan-verify.log. |
| Native module-only TAP/LCOV | 0 | Fresh shadow.js only: LF/LH 339/339, FNF/FNH 30/30, BRF/BRH 74/74; /private/tmp/guardian-shadow-final.lcov. |
| Tracer rerun before expansion at f1be01b | 0 | npm run build:test && node --test dist-test/test/cloud/shadow.test.js; 61/61, guardian-shadow-check-14.log. |
| Current RED classifier and Git provenance inspection | 0 | RED_EVIDENCE_OK; exact patch, source blobs, evidence-only paths, source/evidence/fix ancestry; guardian-shadow-check-33.log. |
| Fallow audits before every commit against 82d6d1a | 0 | Successful audits pass with no introduced finding; setup failure was resolved by authorized escalation. |
| Required pre-step and enabled ordinary commit hooks | 0 | All eleven successful commits pass. Three failed hook attempts and one formatter pre-step were corrected and retried. |

The native module-only command is:
node --test --experimental-test-coverage --test-coverage-lines=100 --test-coverage-functions=100 --test-coverage-branches=100 --test-coverage-include=dist-test/src/cloud/shadow.js --test-reporter=tap --test-reporter-destination=stdout --test-reporter=lcov --test-reporter-destination=/private/tmp/guardian-shadow-final.lcov dist-test/test/cloud/shadow.test.js.
Selected-pair runs do not refresh merged coverage/direct.lcov; exact counts
above come only from this fresh module report. The coordinator owns npm run check.

## Genuine bug and separate assertion control

CR-02-SHADOW-010 is the sole production bug found. Its active raw JSON regression
executed against unchanged production 5db616f17da938298d4dc10cb05f462838258c49:
61 owner tests, 60 pass, one intended deepStrictEqual failure (Infinity versus
undefined), none skipped or cancelled. The complete native TAP, real exit 1,
command, full regression patch, expected/actual, source commit/blobs, Node
version, timestamps and semantic assessment are in 02-SHADOW-RED-EVIDENCE.json.
The classifier returned RED_EVIDENCE_OK; semantic inspection confirmed the
intended observable patch failure, rather than setup or unrelated failures.

Actual ancestry is source 5db616f → evidence 461601d → GREEN fix f1be01b.
Evidence 461601dc1ce6df30e77614e6135e4cd5d7647abd modifies only the owned JSON.
Production source blob 8853c0a2e0fb406867bf03935696d31cd927bbde is unchanged
between source and evidence. The complete saved regression patch exactly
matches the test diff in GREEN f1be01b2c9c28cf69b68527797ff1d1f3e047ec8.
The active regression remains discoverable and committed; no failing code
commit, hidden regression or hook bypass was used. D-04 governs actual Git
objects and provenance, rather than generic phase-subject TDD heuristics.

CR-02-SHADOW-003 used a separate wrong-secret assertion control: both complete
URL cases executed and failed with ERR_ASSERTION, then source bytes were
restored to exact blob 018f49c720f0119fb131b4f03dfbc3966a98dadc with empty
source diff. Fresh build and complete owner returned GREEN 61/61. The control,
native output, restoration and independent Node crypto fixture calculation
are separate assertionControls fields in the JSON; they are not bug RED.
The fixture calculation never calls the production or harness serializer.
No mutation was committed.

## Commits and hooks

Fixer: /root/phase2_shadow/shadow_cause_fixes, gsd-code-fixer. Every cause
uses a separate atomic passing-hook commit. The required pre-step is
SKIP=npm-check pre-commit run --files with the actual changed paths, followed
by restaging fixer edits and ordinary foreground git commit with all hooks.
Evidence-only commits select no build inputs; code commits run check:commit.
No amend, rebase, history rewrite, skipped hook, or tracked deletion occurred.

| Cause | Full commit | Actual paths |
| --- | --- | --- |
| 001 headers | 5db616f17da938298d4dc10cb05f462838258c49 | src/cloud/shadow.ts; test/cloud/shadow.test.ts |
| 010 RED evidence | 461601dc1ce6df30e77614e6135e4cd5d7647abd | .planning/phases/02-cloud-conformance/02-SHADOW-RED-EVIDENCE.json |
| 010 GREEN | f1be01b2c9c28cf69b68527797ff1d1f3e047ec8 | src/cloud/shadow.ts; test/cloud/shadow.test.ts |
| 002 comments | 71ff3ee4015228345eb22b7aa66679dee4dc8c8d | src/cloud/shadow.ts |
| 003 signed URLs / controls | 4a6954c221b4f1a1d50967cc1233fdd62a2885c7 | test/cloud/shadow.test.ts; .planning/phases/02-cloud-conformance/02-SHADOW-RED-EVIDENCE.json |
| 004 complete lifecycle | db79085c526248965ffa004d2d669834201f9a68 | test/cloud/shadow.test.ts |
| 005 flat groups | 5f67ac1e2a5d954a2c78ed9a6de681832ef65ccf | test/cloud/shadow.test.ts |
| 006 AAA | 4d764a1ee99aac6546ad000a1d067e0d99457cd9 | test/cloud/shadow.test.ts |
| 007 silent logging | bb423681d0e14e19c0a9380cc7e3f8ea85ce43db | test/cloud/shadow.test.ts |
| 008 case-owned credentials | 2021fce25ed97525be8ed46a18919c95443fbcfd | test/cloud/shadow.test.ts |
| 009 no-op declaration | 8277ae16577453bd270803f09941ee74f8b2fbd7 | test/cloud/shadow.test.ts |

Enabled hooks caught max-len (003), blank-line placement (005), and declaration
spacing (009) before any commit; each was corrected, audited, restaged and
retried with all hooks. The formatter changed 007 during the pre-step; its
repeat passed before commit. Fallow temporary baseline setup first exited 2;
authorized escalation reran it successfully. No failed attempt is RED proof.
Fallow absence of configured architecture rules is not a security certification.

## Threat Flags

None -- no security-relevant surface outside the plan's <threat_model> was introduced.
