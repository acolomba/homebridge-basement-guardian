# API, wire types and errors conformance review

## Scope and baseline

Plan 02-03, isolation none, features/code-review-sweep. Baseline
22644f309952adadd2fbefca7bee21ef02951376. Full owned inventory:
src/cloud/api.ts, src/cloud/types.ts, src/cloud/errors.ts,
test/cloud/api.test.ts, test/cloud/types.test.ts, test/cloud/errors.test.ts.
The coordinator authorized test/cloud/apiSeeds.ts as a bounded fresh-seed helper;
this executor owns its header, implementation and final full review as well.
Independent initial reviewer: /root/phase2_api/api_initial_review,
gsd-code-reviewer. All six files were read completely with the full style,
comments, unit writer/reviewer and local-verification rulebooks.

The coordinator's full check at d7db0c2 passed 104 scenarios, 1,156 steps,
43 isolated pairs on Node v26.11.1. Executable inputs are unchanged at this
baseline. Changed inputs require fresh owner/direct evidence; the coordinator
owns the full wave gate. No package installation or live vendor/hardware run.

## Findings and initial triage

Every row concerns CLOUD-01, first round 0. Locations refer to baseline
22644f3. Initial review raised fifteen causes: seven BLOCKER, eight WARNING.
Assertion weaknesses do not establish production defects. All fifteen are
accepted. Coordinator authorization resolves seed-support ownership for 013.

| ID | Severity | Rule / location | Evidence and minimum remedy |
| --- | --- | --- | --- |
| CR-02-API-001 | WARNING | D-01; Google Files and modules / all six openings | Missing separate original copyright and overview; tests also lack SPDX. Separate header-only commit. |
| CR-02-API-002 | WARNING | Unit Types and hermeticity, Production design / api.test.ts:82-89,104-185 | Live global HTTP fallback depends on prior global replacement. Fail closed and inject every case's transport explicitly. |
| CR-02-API-003 | BLOCKER | Unit Assertions / api.test.ts:243-270,294-306,498-521,595-610,678-782; types.test.ts:242-244 | Discarded results, serial/key projections and incomplete request headers permit wrong public results. Whole independent result before complete request/meaningful observations. |
| CR-02-API-004 | BLOCKER | Unit Assertions / api.test.ts:477-495,739-758; errors.test.ts:20-27 | Filtered secret absence accepts unrelated/empty output. Exact sanitized class/fields and full headers/constructor fields. |
| CR-02-API-005 | BLOCKER | Unit Assertions / api.test.ts:524-572,613-626 | Bare rejects accepts unrelated failures. Distinct abort reasons/class/fields and request/no-request observations. |
| CR-02-API-006 | BLOCKER | Unit Assertions independent expectations / api.test.ts:511-521 | Expected deadline imports same production constant. Independent 2,500 ms expectation. |
| CR-02-API-007 | BLOCKER | Unit Production design / api.ts:18,31-36; api.test.ts:5,201-214,521 | ROUTES and COMMAND_DEADLINE_MS have only owner-test consumers. Exact consumer probes before making private; public operations prove route/deadline surface. |
| CR-02-API-008 | WARNING | Google Types / api.ts:62-68,170-183 | Private VendorCall.body union with undefined. True optional member and omitted read builder fields; preserve parameter and public semantics. |
| CR-02-API-009 | WARNING | Unit Case structure AAA / types.test.ts:136-279; api.test.ts:201-214,624-626,669-675; errors.test.ts:8-72 | Nonthrowing/multiple observations use combined marker, constructors omit arrangement. Separate phases. |
| CR-02-API-010 | WARNING | Unit Case structure exported entrypoints / errors.test.ts:8-73 | Four error exports have ungrouped cases. Four flat describe groups. |
| CR-02-API-011 | WARNING | Comments Forbidden history narration / api.test.ts:395-399,419,723-724,760-765 | Comments describe replaced implementation/fallback. Describe current envelope/loopback purpose. |
| CR-02-API-012 | WARNING | Google Naming; Unit Naming / api.test.ts:126,137,140,181; types.test.ts:127-133,273-276 | Underscore callback names and bare result row binding. Use production role names. |
| CR-02-API-013 | WARNING | Unit Test data seeds / api.test.ts:23-80; types.test.ts:16-134 | Cross-case seed functions and mutable module fixture graphs remain in owners. Needs bounded cloud concern seed ownership or equivalent rule-conforming remedy. |
| CR-02-API-014 | BLOCKER | D-038 whole-operation deadline / api.ts:89-96,150-155; accountRuntime.ts:237-242,1097-1101 | Catching pending-body abort replaces TimeoutError with unreadable CloudRequestError200; runtime reports vendor-error. Active unchanged-production regression, preserve composite abort reason before genuine parse sanitization. |
| CR-02-API-015 | BLOCKER | Typed sanitized HTTP error contract / api.ts:102-108; accountRuntime.ts:273-279 | Errored body cancel rejects before CloudRequestError construction, replacing HTTP status/route with raw stream error. Active regression, contain cleanup failure without exposing its text. |

## Consumer and candidate dispositions

createCloudApi is composed at accountRuntime.ts:1255 with its injected HTTP
port; command results/classification at 237-242,1097-1101 require preserved
timeout identity and one attempt. VendorCall and its builders are private.
Public ApiDevice/wire/credential/command/error exports have production consumers;
family telemetry remains opaque and no shared shape conversion is planned.

The additional dot-only identifier candidate remains an explicit unconfirmed
concern. Actual sendCommand('..') reaches /data and sendCommand('.') reaches
/devices/data because WHATWG URL normalizes literal and percent-encoded dot
segments. Documentation describes account-id_serial-number identifiers, but
the API's string type and wire guards do not enforce that format. No established
hard valid-input precondition settles this concern, and no vendor occurrence
was established. No new validation/encoding protocol is inferred. This candidate
is neither claimed fixed nor dismissed on improbability; the coordinator receives
the actual behavior and contract limitation.

isRecord's non-array object predicate is retained at a JSON boundary. No
speculative finite-connectivity/credential-format restriction is introduced.
Existing structured malformed-body assertions, meaningful route-surface checks,
case-owned loopback/CA restoration and fresh responses remain authoritative.

## Review rounds

Triage is round 0. Round 1 independent reviewer:
/root/phase2_api/api_initial_review, gsd-code-reviewer. Reviewed all seven
complete files at 8012ddf54d1f35385377f6de9cca3f99837f59c3, including the
full baseline diff and authorized fixture helper. All fifteen initial causes
are independently fixed; no fixed finding reopened.

| Round | Opening | Fixed | Rejected | New | Reopened | Closing |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 15 | 15 | 0 | 1 | 0 | 1 |

Reconciliation: 15 - 15 - 0 + 1 + 0 = 1. Closing list contains only
CR-02-API-016, WARNING. Counts and IDs were reported to the coordinator before
follow-up repair. Count decreased, no fixed cause reopened, and round 1 is
below the cap; no global-pause trigger occurred. This is not a clean seal.

| ID | Requirement | Rule / reviewed location | Severity | First round | Evidence and minimum remedy |
| --- | --- | --- | --- | --- | --- |
| CR-02-API-016 | CLOUD-01 | Comments current behavior; Google Comments and documentation / 8012ddf:api.test.ts:771-773 | WARNING | 1 | Claim that the first body-bearing request first identifies the plugin contradicts read User-Agent at api.ts:147 and api.test.ts:810-835. Remove inaccurate first sentence and retain complete-header rationale. Comment conformance, no bug RED. |

Round 2 used the same independent reviewer and read all seven complete files at
f34682f12200e9b5985bf79d3c2c77dc22b67838. The reviewer explicitly reports
zero open findings: 016 is fixed and 001-015 remain fixed.

| Round | Opening | Fixed | Rejected | New | Reopened | Closing |
| --- | --- | --- | --- | --- | --- | --- |
| 2 | 1 | 1 | 0 | 0 | 0 | 0 |

Reconciliation: 1 - 1 - 0 + 0 + 0 = 0. Counts were reported before closeout.
No open-count stall, reopened fixed cause or fourth-round cap occurred.
Sixteen confirmed causes are fixed; the unconfirmed dot-only concern remains
explicitly unresolved and uncounted. This seals this batch's review, not the
full cloud requirement or coordinator-owned combined gate.

## Final dispositions

Every row is Fixed. Current locations refer to f34682f; commit references are
expanded with full hashes below. Header-only conformance is separated from
functional repairs; the new helper starts with its complete header and working
implementation/imports rather than an unused header stub.

| ID suffix | Current location / named behavior | Fix commits |
| --- | --- | --- |
| 001 | All seven openings: separate MIT SPDX, original copyright and overview | 6b801927; new helper 28a65e17 |
| 002 | api.test.ts:34-43 and every operation: fail-closed explicit transport | 60cfd6f6 |
| 003 | authorizes the device request with the bearer token the auth client supplies; complete normalization and error contracts | 517bf0d5,82bc842b,ce812b55; control 88e6e4c2 |
| 004 | keeps the token, the base URL, and the response body out of a failed request error; complete identity header and route-only error | b0104000,65486cad |
| 005 | api.test.ts:468-611,652-677: root/read/command abort identity, complete ordered single request, no HTTP after expired auth | d1874c3f,f4df2ed1 |
| 006 | deadlines a command with the command deadline rather than the request timeout: independent 2,500 ms | d29717cb |
| 007 | api.ts:27,40: private constants; offers exactly four operations and reaches only the four declared routes | 601296f9 |
| 008 | api.ts:76,185,190,195: private optional body and omitted read builders | 036f9648 |
| 009 | Types/errors separate AAA; API combined marker only for one rejection expression | 896892f2,7788a4d8; API case repairs above |
| 010 | errors.test.ts:18,65,94,123: four exported-error groups | 68b5f8f0 |
| 011 | api.test.ts:341-342,362,876: current envelope/loopback comments | 19edf27e |
| 012 | Role-named API callbacks and command rows | d771bcf3,892629a6 |
| 013 | apiSeeds.ts: fresh typed device/wire/credential inputs and malformed factories; owners build mutable inputs inside each case | 28a65e17,925c5c1d,8012ddf5 |
| 014 | api.ts:98-106,112,125,169; preserves the command timeout reason while its response body is pending; preserves root cancellation while a device response body is pending | 526ace58 |
| 015 | api.ts:116-122; retains the typed HTTP failure when response body cancellation rejects | a5196c19 |
| 016 | api.test.ts:771-772: accurate complete-header rationale | f34682f1 |

## Check Results

Checks ran in the pinned existing feature worktree, isolation none, on Node
v26.11.1. Private receipts label the location main checkout; the authoritative
Git root is the existing code-review-sweep worktree named in this report.
No vendor, hardware or package-install check was run.

| Command / scope | Exit | Actual evidence |
| --- | --- | --- |
| npm run build:test && node --test dist-test/test/cloud/api.test.js | 0 | Final 33/33, no skips/cancellations, f34682f |
| npm run test:coverage:direct -- src/cloud/api.ts test/cloud/api.test.ts | 0 | Final API isolated 100%, f34682f |
| npm run test:coverage:direct -- src/cloud/types.ts test/cloud/types.test.ts | 0 | Types isolated 100%, 8012ddf; exact inputs unchanged through f34682f |
| npm run test:coverage:direct -- src/cloud/errors.ts test/cloud/errors.test.ts | 0 | Errors isolated 100%, 8012ddf; exact inputs unchanged through f34682f |
| Native module-only TAP/LCOV strict thresholds | 0 | API 33 cases, 156/156 lines, 14/14 functions, 28/28 branches; types 77 cases, 69/69,14/14,31/31; errors 5 cases,71/71,8/8,9/9 |
| First tracer acceptance and required second feedback run | 0 | Both exact API owner/build and direct selectors passed at f4df2ed1, before types mutations; 33/33 |
| Fallow guard / exact consumers / per-commit audit | 0 | Guard no configured boundaries; complete constant consumers and traces; every audit passes against 22644f3 with no introduced finding |
| Required pre-step and enabled foreground hooks | 0 | All 27 successful commits pass; 24 build-input commits pass check:commit, seed edits select all pairs |
| RED classifier and actual Git provenance | 0 | Both genuine records RED_EVIDENCE_OK; current classifier rerun, archived first record and real ancestry inspected |
| Wrong command identity header control | 1 | One named complete-header assertion fails; source restored byte-exact, fresh full API 33/33 GREEN |

Native selectors use --experimental-test-coverage with line/function/branch
thresholds of 100 and --test-coverage-include naming only the compiled owning
module. Compiled owners are dist-test/test/cloud/api.test.js,
dist-test/test/cloud/types.test.js and dist-test/test/cloud/errors.test.js.
Actual current LCOV reports are /private/tmp/guardian-api-round1-final.lcov,
/private/tmp/guardian-types-final.lcov and /private/tmp/guardian-errors-final.lcov.
Selected-pair commands do not refresh merged coverage/direct.lcov; denominators
come only from these fresh module reports. Full commands, exits, timestamps,
revisions and unchanged-input receipts: /private/tmp/guardian-api-handoff.json,
/private/tmp/guardian-api-final-receipts.json and
/private/tmp/guardian-api-fixer-actuals.json. The coordinator owns npm run check.

## Genuine regressions and separate assertion control

| Finding | Unchanged source | Evidence-only commit | GREEN source/test fix | Intended RED |
| --- | --- | --- | --- | --- |
| CR-02-API-014 | 6b801927b64f2596068f229f802533421351d860 | 4e97640e5f34aa7df92a413a6950ca3323cd3377 | 526ace58b1dd7afc56249fc0564ee621b82ef1cb | Pending command timeout/root cancellation tests execute: 35 total,33 pass,2 intended identity failures |
| CR-02-API-015 | 526ace58b1dd7afc56249fc0564ee621b82ef1cb | a88590e9bc5b8d254f5a5c95e2ce3095df19b909 | a5196c1989d659ca69e710b569e40714d4365b4a | Errored-response cleanup class test executes:36 total,35 pass,1 intended class failure |

Both active regressions were compiled successfully then ran via native TAP:
node --test --test-reporter=tap dist-test/test/cloud/api.test.js. Each real exit
is 1; neither has zero/skipped/cancelled targets or setup failure masquerading
as RED. Complete unmodified TAP, full active patches, command, expected/actual,
source commit/blobs, Node version, timestamps and semantic assessment are in
02-API-RED-EVIDENCE.json. Current top-level fields describe 015; priorEvidence
retains 014 in full. Both classifiers returned RED_EVIDENCE_OK and both target
assertions failed for the intended behavior.

Actual Git objects prove source < evidence < fix. Each evidence commit modifies
only the owned JSON. Unchanged production blobs are
9e0ac79e5baac134c45cb33f98d5aba6c2868c39 for 014 and
2e7973c8e346b4948d1bb6e6035ed8cd0c41668b for 015. Saved active patches
match the GREEN test diffs; regressions remain active. No failing code, skipped
test, test hook, automatic retry or speculative protocol was added. Approved
D-04 provenance governs rather than generic phase-subject TDD heuristics.

The separate control mutates only the command identity header to wrong-agent.
The named declares exactly four headers on a command request test executes and
fails ERR_ASSERTION, exit 1. Source is restored exactly to blob
c3c11843113f897de2c8e4d2973ed35b475ab381, matching pre-control and current
source. Fresh build/full API returns 33/33 GREEN. The control is retained under
assertionControls and record commit 88e6e4c2; it is not production RED, used no
classifier, and its source mutation was never committed.

Official references checked for the fixes: [Node AbortSignal](https://nodejs.org/api/globals.html#abortsignalthrowifaborted),
[WHATWG streams cancellation](https://streams.spec.whatwg.org/#rs-cancel), and
[pinned undici 7.29.1 body consumption](https://raw.githubusercontent.com/nodejs/undici/v7.29.1/lib/web/fetch/body.js).
No Context7 MCP or ctx7 CLI was available; official fallback documentation and
installed Node/undici definitions govern. AbortSignal preserves its reason;
errored stream cancellation rejects, so cleanup cannot replace typed status/route.

## Commits and hooks

Fixer: /root/phase2_api/api_cause_fixes, gsd-code-fixer. Each cause is an atomic
passing-hook commit. Exact modified paths were staged individually after the
required SKIP=npm-check pre-commit run --files step, formatter corrections and
clean repeat, followed by plain foreground git commit with all hooks enabled.
Evidence-only commits select no build inputs; seed support commits select all
pairs. Commit-message-stage npm-check no-files output does not negate the
earlier passing pre-commit-stage check:commit.

| Task / cause | Full hash | Actual scope |
| --- | --- | --- |
| Headers 001 | 6b801927b64f2596068f229f802533421351d860 | Six original source/test files |
| API014 RED | 4e97640e5f34aa7df92a413a6950ca3323cd3377 | Evidence JSON only |
| API014 GREEN | 526ace58b1dd7afc56249fc0564ee621b82ef1cb | API source/test |
| API015 RED | a88590e9bc5b8d254f5a5c95e2ce3095df19b909 | Evidence JSON only |
| API015 GREEN | a5196c1989d659ca69e710b569e40714d4365b4a | API source/test |
| API002 | 60cfd6f6f4f8a1327599ad61e37039d21afa8405 | API test |
| API003 | 517bf0d50e1b250076ecbd880f190b28bfddadf4 | API test |
| API004 | b0104000d4bebcb4dbc47037a5f7b37ded817914 | API test |
| API005 | d1874c3faaeb8152dbf3a179fcda16b63eae8a49 | API test |
| API006 | d29717cb8f84f525fa216e0c151f64d204a9fcee | API test |
| API007 | 601296f93f4c474ce4e78019f5d9bcf42f7799cc | API source/test |
| API008 | 036f9648c1ed3fb44011b40244f73c130c0139a2 | API source |
| API011 | 19edf27ea03d322744f91a0138f590a0984016f6 | API test |
| API012 | d771bcf3567abafcd140e410fc6d32cf50d6345e | API test |
| API013 | 28a65e176df0488d13d38233391780f0ef7922bb | API test/seed helper |
| API005 ordering | f4df2ed19baddb3ce10cb13609184b484eb76773 | API test |
| Types003 | 82bc842b4a749b73dd1e2d3829ad98f940c64c1e | Types test |
| Types009 | 896892f23a445620f89cd2e3c5edb016153220ca | Types test |
| Types012 | 892629a611e6642404e95aa014970630a7742a9f | Types test |
| Types013 | 925c5c1d936786a1cf3335923733682f8b792ed3 | Types test/seed helper |
| Errors003 | ce812b5562f80f30a94ed2ac919c244e67eb73e8 | Errors test |
| Errors004 | 65486cad101b48ede0f1753973791a71c9e11a30 | Errors test |
| Errors009 | 7788a4d833f1ab8d57130195b109d8485030cafe | Errors test |
| Errors010 | 68b5f8f0dbc8753dc20cb17198258cd1c4dbc560 | Errors test |
| API003 control | 88e6e4c24434a6adadee9e1368c94b33329f34b1 | Evidence JSON only |
| Types013 factories | 8012ddf54d1f35385377f6de9cca3f99837f59c3 | Types test/seed helper |
| Follow-up016 | f34682f12200e9b5985bf79d3c2c77dc22b67838 | API test comment only |

All 27 successful commits and 24 build-input checks pass. Three rejected
foreground attempts (pending-body test lint, injection import order, and
files-modified during an unfinished naming hook) made no commit. Formatter and
setup errors were corrected, restaged and retried without bypass or amend.
The premature-edit mistake was recovered by preserving the exact own patch,
restoring only that owned file to the staged state, finishing the hook to
terminal, then reapplying the patch. No stash, blanket reset, rebase, history
rewrite, tracked deletion or other-owner edit occurred.

The disk plan ledger baseline 22644f3 measures 27 commits through reviewed
f34682f. Final review/summary metadata follows this snapshot. All seven headers
were inspected; the seed helper has no meta-test requirement. Stub scan finds
only the intentional synthetic placeholder-location fixture string, not an
unwired product value. Shared state/roadmap/requirements/windows/central ledger
remain coordinator-owned; CLOUD-01 and the full wave gate remain pending.

## Threat Flags

None -- no security-relevant surface outside the plan's <threat_model> was introduced.
