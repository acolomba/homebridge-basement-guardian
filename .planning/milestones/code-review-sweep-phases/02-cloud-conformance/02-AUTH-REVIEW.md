# Auth batch review

Milestone: code-review-sweep. Exclusive owner: 02-01. Isolation: none in the
existing features/code-review-sweep checkout. No branch or worktree creation.

## Inventory and initial triage

Independent reviewer: /root/phase2_auth/auth_initial_review, gsd-code-reviewer.
Full files reviewed at bf9b4c9ff4a1d043c1f53bb4023c2b302c0ab455:
src/cloud/auth.ts (584 lines), test/cloud/auth.test.ts (1301 lines).
Caller reads: accountRuntime auth composition and API deadline/idToken seam.
Conditional consumer assessment is filename-only; no broader sweep is claimed.
Both auth headers already conform to D-01, with SPDX MIT, separate copyright
and overview JSDoc, original author/year, and one blank line between sections.

All rows address CLOUD-01 and first appear at triage round 0. Locations below
refer to the complete source revision above. Initial count: 14 accepted open
causes (9 BLOCKER, 5 WARNING). Triage is not a post-fix review round.

| ID | Rule / section | Revision-qualified location | Severity | Initial evidence and intended disposition |
| --- | --- | --- | --- | --- |
| CR-02-AUTH-001 | AuthClient valid-token contract; invalid input remains untrusted | src/cloud/auth.ts:147-165,364-376 at bf9b4c9 | BLOCKER | Zero/negative TTL delivered once; JSON 1e309 and conversion overflow yield indefinite reuse. Genuine defect; active owner RED before finite-positive TTL and finite expiry repair. |
| CR-02-AUTH-002 | Unit Assertions / HTTP adapters | test/cloud/auth.test.ts:158-169,206-234,262-275 at bf9b4c9 | BLOCKER | Recorder omits method, request observations split URL/body/headers. Compare whole independently expected request. |
| CR-02-AUTH-003 | Unit Assertions / complete values and bytes | test/cloud/auth.test.ts:758-771 at bf9b4c9 | BLOCKER | Token-only cache passes substring privacy assertions. Compare independently expected complete bytes. |
| CR-02-AUTH-004 | Unit Assertions / byte contracts | test/cloud/auth.test.ts:435-440,617-632 at bf9b4c9 | BLOCKER | JSON parsing normalizes cache bytes; compare complete bytes while preserving caller cancellation. |
| CR-02-AUTH-005 | Unit Types and hermeticity / production design | test/cloud/auth.test.ts:126-140,158-172 at bf9b4c9 | BLOCKER | Missing setup falls through to global fetch. Synthetic throwing default plus explicit per-case HTTP injection. |
| CR-02-AUTH-006 | Unit Assertions / public result before interactions | test/cloud/auth.test.ts:253,269,285,300-304,319-322,624-632,752-755,765-771,820-823,905-909 at bf9b4c9 | BLOCKER | Successful cases discard delivered token; assert token before protocol, cache, callback, log, and permission observations. |
| CR-02-AUTH-007 | Unit Assertions / errors by class and fields | test/cloud/auth.test.ts:544-545,601,941,956,983,998,1088-1098,1110,1137,1168,1243-1244,1266-1267 at bf9b4c9 | BLOCKER | Bare/name-only rejections accept unrelated errors; compare classes and relevant structured fields. |
| CR-02-AUTH-008 | Unit Assertions; D-05 caller-owned cancellation | test/cloud/auth.test.ts:1276-1300 and cancellation assertions at bf9b4c9 | BLOCKER | Abort name alone does not establish unchanged reason identity. Assert independently named caller reason by identity. |
| CR-02-AUTH-009 | Unit Production design / test-only exports | src/cloud/auth.ts:77-78 and four exact consumers at bf9b4c9 | BLOCKER | No production intended export contract; private constant plus independent stable filesystem name in four consumers. |
| CR-02-AUTH-010 | Google style Types / optional members | src/cloud/auth.ts:120-123,332,510 at bf9b4c9 | WARNING | Required undefined unions in private FailurePolicy; use optionals, empty initialization, delete recovery clear. |
| CR-02-AUTH-011 | Google style Gate on toolchain / suppression reasons | src/cloud/auth.ts:30 at bf9b4c9 | WARNING | Existing justified Auth0 identifier exemption lacks inline -- reason. |
| CR-02-AUTH-012 | Unit Case structure / AAA | test/cloud/auth.test.ts:507-509,958-969,1090-1099,1125-1139,1156-1170,1290-1300 at bf9b4c9 | WARNING | act & assert marks several expressions. Separate operation and remaining observations. |
| CR-02-AUTH-013 | Google style Functions / named declarations | test/cloud/auth.test.ts:91-93 at bf9b4c9 | WARNING | Named recorder is untyped const arrow without outer this. Use declaration or explicit function type. |
| CR-02-AUTH-014 | Google style Functions / discarded values | test/cloud/auth.test.ts:283,297,314 at bf9b4c9 | WARNING | Secret callbacks return discarded push lengths. Use block bodies. |

## Seed dispositions and preserved contracts

Request length seed: reject blanket removal. Counts distinguish deduplication,
explicit retry frequency and absence of automatic retries when public outcomes
are already asserted. CR-02-AUTH-002 separately addresses omitted request method
and complete content. Negative privacy seed: accepted as CR-02-AUTH-003.
Optional-policy seed: accepted as CR-02-AUTH-010. Global fetch default seed:
accepted as CR-02-AUTH-005. Filename export seed: accepted as CR-02-AUTH-009.
Logging observations remain because exact failure-policy and privacy diagnostics
are established auth contracts under D-08/D-13/D-14/D-22/AUTH-02.

D-05 ownership and Phase 1 exclusive-file behavior remain active. No new
cancellation implementation defect was found. No skipped tests, unawaited async
assertions, broad casts hiding doubles, private-state access, missing mock
verification, injection operation, or unsupported runtime HAP import was found.

## Filename consumer decision

Fallow guard returned exit 0, with no configured boundary restrictions for the
five owned paths. Broad export trace returned exactly four named imports.
Complete production tsconfig.json semantic impact returned no consumers; complete
tsconfig.test.json impact returned exactly these four direct value consumers:

- test/cloud/auth.test.ts
- test/platform.test.ts
- features/support/steps/authentication.ts
- features/real-pump/support/realWorld.ts

The plugin entrypoint is dist/index.js; no documented intended filename export
contract was found. Test-only privileged knowledge is the cause. Preserve the
existing .basement-guardian-token.json storage name; no getter, hook, persistence
module, or package/API migration is needed. External edits stay at that cause.

## Check Results

Node v26.11.1. Baseline at bf9b4c9, unchanged production/tests:

| Command | Exit | Scope and observed evidence |
| --- | --- | --- |
| npm run build:test && node --test --test-reporter=tap dist-test/test/cloud/auth.test.js | 0 | 61 passed; no failures, skips, cancellation; offline fixtures and one case-owned loopback TLS server. TAP: /private/tmp/guardian-phase2-auth-baseline.tap |
| npm run test:coverage:direct -- src/cloud/auth.ts test/cloud/auth.test.ts | 0 | Baseline isolated auth reaches 100% lines, functions, branches. Log: /private/tmp/guardian-phase2-auth-baseline-coverage.log |
| node_modules/.bin/eslint src/cloud/auth.ts test/cloud/auth.test.ts --max-warnings=0 | 0 | Focused enforced style is clean. |

Current Fallow CLI help was read before guard, broad trace and semantic probes.
Production and test-aware semantic results were complete; no missing/partial
analysis is interpreted as deletion proof. No live vendor or real hardware run.

Final verified code revision: 14c740371e8a35f8ade64b7f890c0f88269e7f03,
Node v26.11.1. All source/test inputs are committed and match this revision.

| Command | Exit | Scope and observed evidence |
| --- | --- | --- |
| npm run build:test && node --test --test-reporter=tap dist-test/test/cloud/auth.test.js | 0 | Final 69/69 auth tests, no failures/skips/cancellations; /private/tmp/guardian-auth-r1-final-green.tap |
| npm run test:coverage:direct -- src/cloud/auth.ts test/cloud/auth.test.ts | 0 | Current isolated pair enforces 100% lines/functions/branches; /private/tmp/guardian-auth-r1-final-coverage.log |
| Native auth-only coverage, include dist-test/src/cloud/auth.js with TAP and LCOV reporters | 0 | Fresh compiled-module LF/LH 430/430, FNF/FNH 39/39, BRF/BRH 115/115; /private/tmp/guardian-auth-r1-direct-current.lcov and guardian-auth-r1-direct-current.tap |
| Task 1 tracer build and native owner rerun at 0895691 before expansion | 0 | 66/66; delivered token, independent complete cache Buffer, whole request; /private/tmp/guardian-auth-task1-final.tap |
| npm run build:test && node --test --test-reporter=tap dist-test/test/cloud/auth.test.js dist-test/test/platform.test.js at the filename-change snapshot | 0 | 129/129 (66 auth, 63 platform); /private/tmp/guardian-auth-009-owners.tap |
| npm exec --no -- cucumber-js --profile real --dry-run | 0 | 7 scenarios/41 steps intentionally skipped, no undefined/ambiguous steps; /private/tmp/guardian-auth-009-real-dry-run.log |

The native current-coverage command is:
node --test --experimental-test-coverage --test-coverage-include=dist-test/src/cloud/auth.js --test-reporter=tap --test-reporter-destination=stdout --test-reporter=lcov --test-reporter-destination=/private/tmp/guardian-auth-r1-direct-current.lcov dist-test/test/cloud/auth.test.js.
Selected-pair runs do not refresh merged coverage/direct.lcov. An earlier private
manifest incorrectly used that older merged report's 382/39/108 denominators.
Those denominators are discarded. Required isolated commands did enforce current
100% and passed; the final exact counts above come from fresh auth-only output.

Current and [pinned Cucumber dry-run documentation](https://github.com/cucumber/cucumber-js/blob/v13.2.1/docs/dry_run.md)
match installed 13.2.1 argv_parser/test_case_runner behavior: dry-run executes no
steps or hooks. Undefined/ambiguous steps need explicit output inspection because
dry-run does not fail for them. The output was inspected, rather than treating
exit 0 alone as proof. No live vendor or real-pump execution occurred.
The coordinator owns the current full npm run check wave gate; it remains pending.

## Review rounds

Round 1 independent reviewer: /root/phase2_auth/auth_rereview_1,
gsd-code-reviewer. Reviewed complete auth source/test at
7a13125f7c80b962a78b1d888ee61a0dd1aaea7f against bf9b4c9; inspected only
filename/header deltas in the three conditional consumers. Original IDs
CR-02-AUTH-001 through CR-02-AUTH-014 are independently fixed.

| Round | Opening | Fixed | Rejected | New | Reopened | Closing |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 14 | 14 | 0 | 2 | 0 | 2 |

Reconciliation: 14 - 14 - 0 + 2 + 0 = 2. New accepted IDs:
CR-02-AUTH-015 and CR-02-AUTH-016. Counts and IDs were reported to the
coordinator before further fixes. The count decreased, no fixed cause reopened,
and round one is below the cap. No global-pause trigger occurred. This round
does not claim a clean batch.

| ID | Requirement | Rule / reviewed location | Severity | First round | Evidence and planned remedy |
| --- | --- | --- | --- | --- | --- |
| CR-02-AUTH-015 | CLOUD-01 | D-13 typed terminal refusal; D-06 / src/cloud/auth.ts:337-338,354-359 at 7a13125 | BLOCKER | 1 | Cache rm failure masks AuthRejectedError; a directory cache is already a supported unusable state. Runtime terminal classification at accountRuntime.ts:710-714 misses the filesystem error and delays shutdown. Preserve refusal with a fixed private-data-free cleanup diagnostic; do not recursively delete an unexpected directory. Genuine active owner RED required. |
| CR-02-AUTH-016 | CLOUD-01 | Unit Data-driven cases / test/cloud/auth.test.ts:566-574 at 7a13125 | WARNING | 1 | sharedRoot conditionals choose different dependencies in the row body. Replace with explicit condition-free fresh rows or separate named cases, retaining both scenarios and every current assertion. This is conformance, not production bug RED. |

Round 2 independent reviewer: /root/phase2_auth/auth_rereview_1,
gsd-code-reviewer. Reviewed complete 596-line auth source and 1550-line paired
test at 14c740371e8a35f8ade64b7f890c0f88269e7f03 against bf9b4c9, plus the
same narrow conditional consumer deltas. Original IDs 001-014 remain fixed;
015 and 016 are independently fixed. All five scoped headers conform.

| Round | Opening | Fixed | Rejected | New | Reopened | Closing |
| --- | --- | --- | --- | --- | --- | --- |
| 2 | 2 | 2 | 0 | 0 | 0 | 0 |

Reconciliation: 2 - 2 - 0 + 0 + 0 = 0. Closing open list is empty.
No fixed cause reopened, no open-count stall occurred, and no fourth-round cap
was reached. Round counts were reported to the coordinator before record work.
The reviewer explicitly reports zero open full-batch findings. Current 015
locations: auth.ts:338-344,359-364 and auth.test.ts:1071-1117. Current 016:
auth.test.ts:566-612. Current 001 guards: auth.ts:148-156,370-388;
regressions: auth.test.ts:1441-1478. No phase completion is implied.

## Regression and assertion controls

Two genuine production bugs have complete active regression evidence:

| Finding | Unchanged source | Evidence-only commit | GREEN fix commit | Active test and observed RED |
| --- | --- | --- | --- | --- |
| CR-02-AUTH-001 | bf9b4c9ff4a1d043c1f53bb4023c2b302c0ab455 | f8b8635a4f632a78a7ea023412595230f9ea31ed | b42d3688ddcabe7aacfb8e8d5e16bc499142e5d7 | authenticates again when the cache file carries an infinite expiry; 66 executed, 61 pass, 5 intended expiry failures, no skips/cancellation |
| CR-02-AUTH-015 | 7a13125f7c80b962a78b1d888ee61a0dd1aaea7f | 31b30839ba0779017f289b5a453e657f01405a5b | 9edb50cf4dac1d622c36e0afd21052f6d9be31a2 | D-13 preserves the terminal refusal when the cache path is a directory; 69 executed, 68 pass, one intended AuthRejectedError instanceof failure, no skips/cancellation |

Both RED commands are node --test --test-reporter=tap dist-test/test/cloud/auth.test.js,
after a successful current build. Complete native TAP, real exit 1, full active
regression patch, source revision, expected/actual, Node version, timestamps,
and semantic assessment are in 02-AUTH-RED-EVIDENCE.json. Current top-level
fields describe 015; priorEvidence[0] retains the complete original 001 record,
verified equal to the record in f8b8635. Both classifiers returned
RED_EVIDENCE_OK with semantic inspection of the named intended assertion.
Current 015 classifier was rerun by the executor and passed again.

Actual Git ancestry proves source < evidence < fix for each bug. Actual evidence
commit paths contain only the owned JSON. Production blobs match between source
and evidence: 4306178be18b4e130745d7127d2b3d1f10601ded for 001;
ce09e40cd6987daf087293bbd7bef38e60b5e49e for 015. Active regressions stayed
discoverable through ordinary hook stashing/restoration. Domain-scoped commit
subjects and actual objects/provenance govern; generic subject-based TDD heuristics
do not override the approved D-04 evidence-first policy.

015 keeps refusal and halted policy intact, logs only a fixed diagnostic, and
preserves unexpected directory contents. No recursive removal was added.
[Node's force option](https://nodejs.org/api/fs.html#fspromisesrmpath-options)
suppresses missing-path errors, not all removal errors; installed Node v26.11.1
and definitions agreed. A local directory probe returned ERR_FS_EISDIR.

Assertion controls are separate experiments, not production-bug RED:

| Mutation / named target | Observed outcome | Restoration and GREEN |
| --- | --- | --- |
| POST to GET only / sends the password-realm grant the vendor tenant expects | Native owner exit 1, 68 cases, 65 pass/3 fail; complete request assertions show GET versus POST. The third failure is the real ALPN adapter's incompatible GET body. /private/tmp/guardian-auth-control-method.tap | Exact source bytes restored; rebuilt owner 68/68; guardian-auth-control-method-restored.tap |
| Complete cache to token-only JSON / AUTH-02 writes neither the account email nor the account password into the cache file | Native owner exit 1, 68 cases, 63 pass/5 intended complete-Buffer failures including privacy. /private/tmp/guardian-auth-control-cache.tap | Exact source bytes restored; rebuilt owner 68/68 and isolated direct command exit 0; guardian-auth-final-green.tap |

Each experiment used npm run build:test followed by the native TAP owner.
Restored pre-experiment source SHA-256:
1433a95f1ae5ec9636dc855c8a5c84fa4780399b89afe123ee3de01b34d5fc02.
Source equality and git diff HEAD exit 0 were verified before continuing. No
mutation was committed. Existing Phase 1 occupied-path/cancellation proofs remain
active; their earlier experiments are not falsely claimed as new runs.

## Commits and hooks

Each code commit passed the AGENTS-required SKIP=npm-check pre-commit run --files
step and its enabled foreground git commit hook, including check:commit.
Conditional feature/header commits selected all pairs. Evidence-only commits
correctly selected no build inputs. Later commit-message hook output says no
files for npm-check; the earlier source pre-commit-stage check:commit passed.
No hook was bypassed, no failed commit was amended, and no history was rewritten.

All cause fixes used /root/phase2_auth/auth_cause_fixes, gsd-code-fixer;
independent reviewers performed no mutations. The executor inspected actual
commit paths and absence of tracked deletions. Per-plan disk ledger baseline
bf9b4c9 through code HEAD 14c7403 measures 19 commits before final records.

| Cause | Full commit | Actual scope |
| --- | --- | --- |
| 001 RED | f8b8635a4f632a78a7ea023412595230f9ea31ed | Owned evidence JSON only |
| 001 | b42d3688ddcabe7aacfb8e8d5e16bc499142e5d7 | Auth source/test |
| 005 | b2b2e015b6f4fd32c73b7d50fcb6c746e5b3b365 | Auth test |
| 002 | 3b00c916f2b3212c5893377cef5c836c630cf479 | Auth test |
| 003 | dbf8db024c08668c28846f912575eced0cc99e12 | Auth test |
| 004 | ce3882cf82bc64473b242ebadc8d80ef0f83e805 | Auth test |
| 006 | 08956910cde762bb13250885479ab0a845223ae0 | Auth test |
| Separate consumer headers | eb5b0a0a41c1e010b26436d3dc40c9b557ed55ee | Three conditional consumer files |
| 009 | 516e0becf54af99c544f177eec305d778323521d | Auth pair and three exact external consumers |
| 010 | 83cb2a2592098b87dc684f7ec8162027b5d81804 | Auth source |
| 011 | fada024dbd230af6ba18bfbf43a996c2dcde7ba9 | Auth source, style only |
| 007 | 323432ea562bdd787db7b842a044a0879fd4feb4 | Auth test |
| 008 | 112e5be089402fa058afe6b54bb8da48d23f62d6 | Auth test |
| 012 | 5b6cdc72f8e1b0713016d1a9efcd28f9e723c953 | Auth test, style only |
| 013 | cb47cc83a398d9094a6e2230ef4c193b54855f02 | Auth test, style only |
| 014 | 7a13125f7c80b962a78b1d888ee61a0dd1aaea7f | Auth test, style only |
| 015 RED | 31b30839ba0779017f289b5a453e657f01405a5b | Owned evidence JSON only |
| 015 | 9edb50cf4dac1d622c36e0afd21052f6d9be31a2 | Auth source/test |
| 016 | 14c740371e8a35f8ade64b7f890c0f88269e7f03 | Auth test, style only |

Fallow audits before every commit used recorded batch baseline bf9b4c9 and
returned exit 0/pass. No introduced dead-code, complexity, duplication, or
styling issue was attributed. Later reports show one inherited duplication
group dup:6f87acd9 in existing realWorld/world remember/recall methods. Those
methods are outside the bounded filename edits and were retained; the
coordinator was notified. Boundary/rule-pack absence is not claimed as a
measured security pass. Logs: /private/tmp/guardian-auth-<cause>-audit.json,
guardian-auth-<cause>-precommit*.log, and guardian-auth-<cause>-commit*.log;
additional details are in guardian-auth-fixer-actuals.json and
guardian-auth-r1-fixer-actuals.json.

Failed enabled-hook attempts for 005 (two padding errors), 008 (arbitrary
abort-reason lint policy), and 012 (line length) were corrected, restaged and
retried successfully. Formatting changed regression wrapping before commits;
one draft 006 syntax error was corrected before commit. None supplies bug RED.
Shared state/roadmap/requirements/windows/central ledger and the full wave gate
remain coordinator-owned; CLOUD-01 remains pending for all declaring plans.

## Threat Flags

None -- no security-relevant surface outside the plan's <threat_model> was introduced.
