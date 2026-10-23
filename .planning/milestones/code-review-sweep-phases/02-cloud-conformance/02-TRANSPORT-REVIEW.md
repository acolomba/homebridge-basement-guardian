# Transport, signing and ALPN conformance review

## Scope and baseline

Plan 02-04, isolation none, existing features/code-review-sweep worktree.
Baseline 5f91f1dbea4113ceaf32fbf715dcc41d489086a9. Full owned inventory:
src/cloud/httpDispatcher.ts, src/cloud/mqttTransport.ts, src/cloud/sigv4.ts,
test/cloud/httpDispatcher.test.ts, test/cloud/mqttTransport.test.ts,
test/cloud/sigv4.test.ts, and test/cloud/alpnServer.ts. Source lengths are
39, 206 and 87; test/helper lengths are 108, 361, 145 and 128.

The coordinator authorized the bounded test/cloud/sigv4Seeds.ts addition for
CR-02-TRANSPORT-013. Move the existing fresh input seed without new flexibility,
with its implementation and complete header together. Final independent review
includes this eighth file; its support edit selects every pair in check:commit.

Independent initial reviewer: /root/phase2_transport/transport_review_initial,
gsd-code-reviewer. Full style, comments, unit writer/reviewer and local
verification rules were read; callers in auth, API, shadow and account runtime
were traced. Reviewer performed no mutation. Executor Fallow guard exits 0,
with no configured boundaries; this does not establish a security assessment.

The coordinator's full check at b3eaaf19 passes all static checks, 104 scenarios,
1,156 steps and 43 isolated pairs on Node v26.11.1. An exact executable-input
diff is empty through this baseline, with no untracked inputs. After edits,
fresh owner/direct checks are required. The coordinator owns the full wave gate.

## Findings and initial triage

All rows address CLOUD-01 and first appear at round 0, accepted and open.
Locations refer to baseline 5f91f1d. Initial count: 13 distinct causes,
five BLOCKER and eight WARNING. Assertion weaknesses are test defects,
not confirmed production bugs.

| ID | Severity | Exact rule / location | Evidence and minimum remedy |
| --- | --- | --- | --- |
| CR-02-TRANSPORT-001 | WARNING | D-01; Google Files and modules / all seven openings | Missing separate SPDX/copyright/overview form; preserve MIT attribution in a separate header commit. |
| CR-02-TRANSPORT-002 | BLOCKER | Unit Assertions complete independent bytes / sigv4.test.ts:107-119 | Four negative-only signatures accept absent or arbitrary signatures; require independently expected complete URLs. |
| CR-02-TRANSPORT-003 | BLOCKER | Unit Assertions; preserved end completion / mqttTransport.test.ts:70-73,276-297 | Immediate callbacks hide premature end resolution; observe simultaneous promises before and after case-owned callback completion. |
| CR-02-TRANSPORT-004 | BLOCKER | Unit Assertions complete byte values / mqttTransport.test.ts:176-188 | UTF-8 projection hides corrupted Buffer bytes; compare whole topic and non-UTF-8 payload record. |
| CR-02-TRANSPORT-005 | BLOCKER | Unit Assertions errors and named behavior / httpDispatcher.test.ts:82-87 | Bare rejects accepts unrelated failure; assert distinct caller reason identity and no server request. |
| CR-02-TRANSPORT-006 | BLOCKER | Unit Assertions result before interactions; tracer / httpDispatcher.test.ts:92-107 | TLS result discarded; consume and assert complete response before observed HTTP/1.1 negotiation. |
| CR-02-TRANSPORT-007 | WARNING | Unit Test doubles / mqttTransport.test.ts:42-95,105-158,222-297 | Prescribed connect, subscribe, publish, end and signing calls use handwritten recorders; use case-owned exact strong mocks for promised interactions and typed stubs otherwise. |
| CR-02-TRANSPORT-008 | WARNING | Unit Case structure AAA / mqttTransport.test.ts:106,114,131; sigv4.test.ts:113-119 | Forbidden combined arrange/act and missing arrangement; separate phases. |
| CR-02-TRANSPORT-009 | WARNING | Unit Environment / httpDispatcher.test.ts:96-100 | CA restoration registered after mutation; register before changing process trust. |
| CR-02-TRANSPORT-010 | WARNING | Google Comments and documentation; D-06 / httpDispatcher.ts:22 | Documentation recommends global-fetch test default; describe explicit offline injection. |
| CR-02-TRANSPORT-011 | WARNING | Google Naming / mqttTransport.ts:167 | Underscore parameter prefixes; rename without changing hook contract. |
| CR-02-TRANSPORT-012 | WARNING | Unit Naming values / sigv4.test.ts:44-45 | HMAC helper parameter data is forbidden; use payload. |
| CR-02-TRANSPORT-013 | WARNING | Unit Test data cross-case seeds / sigv4.test.ts:58-68,74-141 | Reusable fresh baseInput seed lives in the owner; move the unchanged factory into the authorized concern seed file. |

Counts and IDs were reported to the coordinator before repairs. Triage is
round 0, not an independent post-fix convergence round.
The same independent reviewer confirmed 013 in a narrow original-code rule
clarification before signing repairs. Opening 13 was reported and accepted by
the coordinator before the first post-fix round; no re-review is hidden here.

## Preserved contracts and candidate dispositions

Preserve paired userland undici fetch/Agent with explicit allowH2 false;
factory-time MQTT handshake; shadow current-connection and retry ownership;
callback/deadline completion; exact Node-crypto signing and token placement.
No packages, protocols, APIs or lifecycle redesign are authorized.

The signer module Buffer is read only during initialization to produce immutable
strings; cases do not access or mutate it. No shared-state defect is confirmed.
Registration-time row objects/Date values each belong to one case; fresh case
construction can accompany assertion repairs. pendingTimers observes process
resources without replacing globals or retaining shared mutable state.

ALPN HTTP/2 session cleanup is UNCONFIRMED: Node server.close waits for active
sessions, while expected HTTP/1.1 owner cases pass. No observed current owned
failure establishes a production bug. Do not silently close this concern or
infer a new transport contract.

## Check Results

Node v26.11.1 at unchanged baseline 5f91f1d:

| Command / scope | Exit | Observed outcome |
| --- | --- | --- |
| npm run build:test | 0 | Fresh compiled owners under dist-test/test/cloud. |
| node --test --test-reporter=tap dist-test/test/cloud/httpDispatcher.test.js dist-test/test/cloud/mqttTransport.test.js dist-test/test/cloud/sigv4.test.js | 0 | 33/33 pass, no skipped/cancelled tests, case-owned loopback permitted. |
| npm run test:coverage:direct -- src/cloud/httpDispatcher.ts test/cloud/httpDispatcher.test.ts | 0 | Baseline HTTP alone reaches 100% lines/functions/branches. |
| Fallow guard for all seven owned files | 0 | No configured boundary restriction; live CLI help read. |

Documentation fallback: no Context7 tools or ctx7 executable was available.
Pinned [undici 7.29.1 Client documentation](https://raw.githubusercontent.com/nodejs/undici/v7.29.1/docs/docs/api/Client.md)
and installed declarations agree on allowH2 default false and dispatcher type.
[MQTT.js 5.16.0 README](https://github.com/mqttjs/MQTT.js/blob/v5.16.0/README.md)
and installed client declarations establish existing callback signatures.
[Node test timers](https://nodejs.org/api/test.html#mocking-timers) match the
installed v26.11.1 runner. No live vendor or real hardware was used.

## Review rounds

Round 1 independent reviewer: /root/phase2_transport/transport_review_initial,
gsd-code-reviewer. All eight complete files (1,423 lines) and the full baseline
diff were reviewed at fb3de06560c1978281bfd8ee4f97c3fd8b9d1204, with complete
rulebooks, report, protocol and raw command/control evidence. Reviewer made no
writes, builds or mutations. Every original finding is independently fixed.

| Round | Opening | Fixed | Rejected | New | Reopened | Closing |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 13 | 13 | 0 | 0 | 0 | 0 |

Reconciliation: 13 - 13 - 0 + 0 + 0 = 0. Closing open list is empty.
Counts and IDs were reported before final record work. No open-count stall,
reopened fixed cause or fourth-round cap occurred. Five BLOCKER and eight
WARNING causes are fixed. This closes the batch review, not the combined gate
or whole CLOUD-01 requirement.

| ID suffix | Final disposition / location at fb3de06 | Evidence |
| --- | --- | --- |
| 001 | Fixed; all eight openings | Separate MIT SPDX, original copyright and overview; original headers f5d2456, new seed 27a5df7. |
| 002 | Fixed; sigv4.test.ts:100-155 | Four complete independent URLs; missing-signature control fails. |
| 003 | Fixed; mqttTransport.test.ts:463-541 | Pending callback completion, simultaneous/repeated shared promises and exact force calls. |
| 004 | Fixed; mqttTransport.test.ts:272-304 | Whole non-UTF-8 topic/Buffer record; normalization control fails. |
| 005 | Fixed; httpDispatcher.test.ts:92-109 | Exact caller reason and no recorded request. |
| 006 | Fixed; httpDispatcher.test.ts:124-134 | Complete status/content type/body precedes HTTP/1.1 observation. |
| 007 | Fixed; mqttTransport.test.ts:121-190,237-541 | Case-owned exact mocks, complete promised calls and explicit verification; duplicate registration control fails. |
| 008 | Fixed; mqttTransport.test.ts:121-190; sigv4.test.ts:146-154 | Separate arrange/act/assert, fresh row inputs. |
| 009 | Fixed; httpDispatcher.test.ts:118-122 | CA restoration precedes trust mutation. |
| 010 | Fixed; httpDispatcher.ts:14 | Explicit offline injection documentation. |
| 011 | Fixed; mqttTransport.ts:172 | Typed handshake tuple retains client argument three. |
| 012 | Fixed; sigv4.test.ts:51-52 | Role-named payload parameter. |
| 013 | Fixed; sigv4Seeds.ts:20-31 | Unchanged fresh input seed in the authorized concern file. |

Reviewer explicitly found no weakened original outcome, new confirmed finding
or production bug. The ALPN H2 session concern remains unconfirmed and uncounted.

## HTTP tracer completion

The fixer /root/phase2_transport/transport_cause_fixes, gsd-code-fixer,
completed initial headers and the HTTP causes at a2430e3c4cfc94ab5d7fa68ddbcf3c0b14bb166d.
Each successful commit passed Fallow audit against 5f91f1d, the required
SKIP=npm-check pre-commit run --files step, and ordinary foreground git commit
with all hooks. The header edit selected all 43 pairs because it includes
ALPN support. No tracked file was deleted or other owner edited.

| Cause | Full commit | Actual scope |
| --- | --- | --- |
| 001 | f5d2456755a02c8508caf5f729447bf38f2067bc | Seven original header openings only |
| 005 | dc6f2a169dabd9bd8cd41c67ce263915ae0bb78d | test/cloud/httpDispatcher.test.ts |
| 006 | 3c0f1b6188f7b3f9ae7fd0739dcb6ee694555c20 | test/cloud/httpDispatcher.test.ts |
| 009 | e6e3f479b1d48bd24c51506dc7248b9f684c05e6 | test/cloud/httpDispatcher.test.ts |
| 010 | a2430e3c4cfc94ab5d7fa68ddbcf3c0b14bb166d | src/cloud/httpDispatcher.ts documentation only |

At this revision, npm run build:test followed by node --test
dist-test/test/cloud/httpDispatcher.test.js and npm run test:coverage:direct --
src/cloud/httpDispatcher.ts test/cloud/httpDispatcher.test.ts passed twice.
Both fresh owners executed 3/3 with no skips/cancellations; HTTP alone reached
100% lines/functions/branches. Second run is the required tracer feedback
before MQTT expansion. Commands, complete outputs, timestamps, paths and hooks
are retained in /private/tmp/guardian-transport-fixer-actuals.json. Every exit is 0.
No genuine bug or mutation was needed for this tracer. These owner checks are
not independent convergence rounds. The coordinator full wave gate is pending.

## Threat Flags

None -- no security-relevant surface outside the plan's <threat_model> was introduced.

## MQTT completion

The same fixer completed MQTT repairs through
992eb13babba2298ad25807d5acbc4de196e2f94. Callbacks, factory-time handshake,
deadline cancellation and end completion retain their original contract.
The unused signing-hook bindings use the existing typed handshake tuple;
installed MQTT 5.16.0 passes URL, options and client in that order. No exported
type or protocol changed. Before this private callback spelling edit, complete
consumer and installed call-site evidence was read.

| Cause | Full commit | Actual scope |
| --- | --- | --- |
| 003 | f81d3e974e1654a7f0e6ad7ef2a9b55f5963e6c9 | test/cloud/mqttTransport.test.ts |
| 004 | d4ce7c554cae6cb7f24c7357378f2f4e790654e3 | test/cloud/mqttTransport.test.ts |
| 008 MQTT part | 31c406ea69926f1aeca979feb88ce952c0a4ebd2 | test/cloud/mqttTransport.test.ts |
| 007 | 7c80ea06aef7f4e8c30f2378b4d8af1d49bc3e2f | test/cloud/mqttTransport.test.ts |
| 011 | 77eebb791918321ea9c5bb5347a549ff7cc5dc4d | src/cloud/mqttTransport.ts |
| 007 registration completion | 992eb13babba2298ad25807d5acbc4de196e2f94 | test/cloud/mqttTransport.test.ts |

Executor inspection before independent round 1 identified the original 007
listener-registry overwrite limitation after callback mock conversion. Four
case-owned strict registration mocks now require one event/callback registration,
and each notification case verifies registration and callback mocks after its
complete public observations. This is completion of original 007 before any
formal independent closure, not a reopened fixed finding or hidden review round.

Final fresh native MQTT owner at 992eb13 executes 21/21 with no skips or
cancellations, exit 0. npm run test:coverage:direct -- src/cloud/mqttTransport.ts
test/cloud/mqttTransport.test.ts exits 0 and enforces 100% lines/functions/branches.
Every successful commit has audit/manual pre-step/enabled foreground hooks exit 0.
Void/spacing lint failures created no commit and were corrected/restaged/retried.

Three assertion controls are distinct from genuine production bugs:

| Control / named target | Observed native result | Restoration |
| --- | --- | --- |
| Premature end resolution / ends the client once and resolves both times when ended twice | One active target, ERR_ASSERTION, exit 1, no skips/cancellations | Exact source SHA-256 0e0916b1dca0c9d7f9b53fbfab1723110b90fc782d27ca4f2ce4e6a6987aa95d; rebuilt 21/21 GREEN |
| UTF-8 decode/re-encode / forwards the message notification with its topic and payload | One active target, ERR_ASSERTION, exit 1, no skips/cancellations | Same exact source SHA-256; rebuilt 21/21 GREEN |
| Duplicate message registration / forwards the message notification with its topic and payload | One active target, strict-mock unexpected second call, exit 1, no skips/cancellations | Exact source SHA-256 7aac52aad1aa7dd0e805fb274303fbb730c1816db4a61348e3cd2af6b99829c6; rebuilt 21/21 GREEN |

Full native reports, complete temporary source patches/bytes, source commits,
timestamps and exact restoration receipts are in the private fixer manifest.
No mutation was committed, no RED classifier was used for these controls,
and no genuine production bug is claimed. Shared tracking files and the full
wave gate remain coordinator-owned.

## Signing completion and final checks

| Cause | Full commit | Actual scope |
| --- | --- | --- |
| 012 | a4a65eda2cb9dfd76abda282b2658318b7323045 | test/cloud/sigv4.test.ts |
| 013 | 27a5df7070e843c34e9d39ca1985f0c4daaba1b5 | test/cloud/sigv4.test.ts; test/cloud/sigv4Seeds.ts |
| 008 signer part | 1ad928514f82f0132d1ae3529ab8c6053d5419d7 | test/cloud/sigv4.test.ts |
| 002 | fb3de06560c1978281bfd8ee4f97c3fd8b9d1204 | test/cloud/sigv4.test.ts |

The new seed keeps the original factory body and fixtures without new flexibility.
Its header and implementation were committed together; no empty stub or meta-test
was added. The enabled seed commit check selected all 43 pairs and passed.
Independent Node createHash/createHmac calculations with manually specified
canonical/query inputs produced the four literal expected URLs. Production,
seed and harness code did not calculate the expected bytes. Signer production
body remains unchanged; its baseline diff is header-only.

Fourth assertion control: source at 1ad928514f82f0132d1ae3529ab8c6053d5419d7
returns a URL without its signature only for other-secret-access-key. The named
signs the complete URL for a different secret access key case executes once and
fails ERR_ASSERTION, exit 1, no skips/cancellations. Exact source SHA-256
a72e4e4ef51726b2fb081376e2dc52d5a24c819b23c5ca43a782f9ee7b697419 is restored;
fresh full signer returns 9/9 GREEN. Full patch/output/source/time/restoration
are retained in the private manifest, separately from production-bug evidence.
No genuine bug was established; conditional RED JSON was therefore not created.

At reviewed code fb3de06 on Node v26.11.1, all exact plan selectors passed:
npm run test:coverage:direct -- src/cloud/httpDispatcher.ts test/cloud/httpDispatcher.test.ts;
npm run test:coverage:direct -- src/cloud/mqttTransport.ts test/cloud/mqttTransport.test.ts;
npm run test:coverage:direct -- src/cloud/sigv4.ts test/cloud/sigv4.test.ts.
Source/test/helper inputs are unchanged after their passing checks.

Executor independently rebuilt the final tree and measured fresh module-only
native coverage at fb3de06. Every native exit is 0; all 33 tests pass with zero
skips/cancellations. Exact counts come from these reports, not the older merged
coverage/direct.lcov (selected-pair commands do not refresh that merged file).

| Pair | Cases | Lines covered/total | Functions | Branches | Fresh report |
| --- | --- | --- | --- | --- | --- |
| HTTP | 3 | 23/23 | 1/1 | 2/2 | /private/tmp/guardian-transport-http-final.lcov |
| MQTT | 21 | 118/118 | 20/20 | 24/24 | /private/tmp/guardian-transport-mqtt-final.lcov |
| Signing | 9 | 61/61 | 4/4 | 5/5 | /private/tmp/guardian-transport-sigv4-final.lcov |

Commands use node --test --experimental-test-coverage, 100 thresholds for
--test-coverage-lines, --test-coverage-functions and --test-coverage-branches,
and --test-coverage-include=dist-test/src/cloud/httpDispatcher.js (respectively
mqttTransport.js and sigv4.js). Native TAP and LCOV reporters write the sibling
guardian-transport-http-final.tap, mqtt-final.tap and sigv4-final.tap reports;
owners are dist-test/test/cloud/httpDispatcher.test.js, mqttTransport.test.js
and sigv4.test.js. Complete literal flags and actual outputs are available in
the retained tool receipts and the named report files.

All fifteen successful code commits pass audit, clean manual pre-step and
enabled foreground hooks. Four formatting pre-step failures, one void-expression
foreground failure and one spacing lint failure were corrected and retried;
none supplies bug RED. Actual commit paths, complete hooks, command arguments,
timestamps, source bytes and all controls are in the private fixer manifest.
No stash, blanket reset, clean, bypass, amend, rebase, history rewrite, tracked
deletion or other-owner edit occurred. Isolation none preserves the authorized
existing feature branch; no agent branch/worktree was created or switched.

Stub scan finds no introduced product placeholder, TODO, FIXME, disabled test
or unrun owned verification. Shared records/CLOUD-01/full wave gate stay with
the coordinator. All executor resources are released after record closeout.

The records pre-step corrected a trailing blank line in the summary before
its clean repeat. This is a metadata formatting correction, not bug evidence.
