---
phase: 02-cloud-conformance
reviewed: 2026-10-14T13:41:17Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - features/real-pump/support/realWorld.ts
  - features/support/steps/authentication.ts
  - src/cloud/api.ts
  - src/cloud/auth.ts
  - src/cloud/errors.ts
  - src/cloud/httpDispatcher.ts
  - src/cloud/mqttTransport.ts
  - src/cloud/shadow.ts
  - src/cloud/sigv4.ts
  - src/cloud/types.ts
  - test/cloud/alpnServer.ts
  - test/cloud/api.test.ts
  - test/cloud/apiSeeds.ts
  - test/cloud/auth.test.ts
  - test/cloud/errors.test.ts
  - test/cloud/httpDispatcher.test.ts
  - test/cloud/mqttTransport.test.ts
  - test/cloud/shadow.test.ts
  - test/cloud/sigv4.test.ts
  - test/cloud/sigv4Seeds.ts
  - test/cloud/types.test.ts
  - test/platform.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 2: Code Review Report

**Reviewed:** 2026-10-14T13:41:17Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** clean
**Revision:** a973483f4a9a47e8dc861be3138cbbad3a633e67
**Baseline:** aa054de81be0ad378bb9fef3f701ead1eb497bf6
**Reviewer:** /root/phase2_final_review, gsd-code-reviewer

## Summary

No open BLOCKER or WARNING remains in the reviewed scope. API correction round 3
independently verifies CR-02-API-017 fixed: both dot-only identifiers are refused
before authentication or HTTP. New 0, reopened 0, closing open 0. The earlier
55 accepted findings remain fixed. This clean code-review result does not
resolve the retained unconfirmed concern or pending maintainer judgments.

The complete contents of all 22 files were read. The 19 cloud files received
standard source/test/helper review. The three external auth consumers were read
in full to assess their filename/header edits and changed interactions; this
does not claim the later platform or Cucumber subsystem sweep. Source predicates,
error propagation, request deadlines, auth waiter ownership, cache writes,
shadow routing, transport callbacks, signing bytes and relevant runtime callers
were checked against the project rulebooks and batch records.

For this correction assessment, the complete current API source and paired
1,093-line owner were reread with relevant runtime callers. Git blob equality
against the initial full review at a0df3a682476612e364a1c601843390f5a418245
proves the other 20 scoped files unchanged. Their prior complete-file reviews
remain applicable. No inventory or subsystem boundary was reset or narrowed.

The supplied scope resolver is degraded: phase-range/no-task-commit-rows. Its
22-file inventory agrees with the explicit scope, actual baseline diff and
summary inventories. Task tables contain complete hashes despite that parser
limitation. No file was silently dropped or replaced by a heuristic scope.

## Structural Findings (fallow)

The normalized pre-pass supplies this one candidate:

```json
{
  "type": "duplicate_block",
  "message": "Duplicate block (2 instances)",
  "file": "features/real-pump/support/realWorld.ts",
  "line": 177,
  "related_file": "features/support/world.ts"
}
```

**Disposition:** Inherited duplication candidate; no accepted Phase 2 finding.
The current remember/recall methods at realWorld.ts:177-188 and world.ts:518-529
share the same map operations and missing-value check, with distinct diagnostic
wording. The realWorld methods are present at the baseline and untouched by its
filename/header edits. No new defect or required consolidation is established.
This candidate is retained separately and excluded from narrative counts.

The supplied raw pre-pass is kind audit, verdict fail, with recorded exit 1;
its base is 64c4fea22d3d04d6af405f215d89de283aedaad5. It also contains complexity
results beyond the normalized payload, so its verdict is not described as a
passing phase-specific gate. The required orientation against this review's
actual baseline first exited 2 because sandbox permissions prevented its
temporary baseline worktree. The authorized retry exited 0, kind audit-brief,
verdict pass: zero introduced duplication groups and one inherited group
dup:6f87acd9. That attribution corroborates the source/base comparison.
Orientation is not correctness proof. No configured architecture/rule-pack
coverage is inferred from empty detector counts.

The correction assessment reran the orientation against the same phase baseline
at a973483f4a9a47e8dc861be3138cbbad3a633e67, with authorized temporary-worktree
access. It exited 0, kind audit-brief, verdict pass: zero introduced dead-code,
complexity, duplication or styling findings, and one inherited duplication
group. The skipped TypeScript cache-entry diagnostic is retained as a setup
limitation, not source finding or evidence of measured architecture coverage.

## Narrative Findings (AI reviewer)

No open narrative findings. The fixed finding below retains its stable ID,
original evidence, severity and correction history; frontmatter counts describe
current open findings only.

### Fixed Finding History

### CR-02-API-017: Dot-only identifiers escape the declared device route

**Historical Severity:** BLOCKER
**Requirement:** CLOUD-01; opaque device identity and closed REST routes (T-01-31, SYNC-01)
**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/src/cloud/api.ts:82-87`
**Current related locations:** api.ts:193-196,203-212; test/cloud/api.test.ts:229-299; accountRuntime.ts:237-242,1097-1101.
**Original locations:** api.ts:82-83,167,199-208 and types.ts:126-127,142-149 at a0df3a6.
**Disposition:** Fixed and independently verified in API correction round 3.
The initial whole-phase assessment assigned 017 to the previously unconfirmed
candidate; it did not reopen CR-02-API-001 through 016.

**Original Issue:** devicePath encoded an opaque identifier with encodeURIComponent,
which leaves `.` and `..` unchanged. The URL constructor in send then interprets
them as path-control segments. The existing CloudApi methods accept string
identifiers, the wire predicates accept both values, and no enforced identifier
precondition excludes them. The documented vendor identifier shape therefore
cannot establish that this branch is unreachable.

For an accepted `.` identifier, sendCommand issued PUT /devices/data. For `..`,
it issued PUT /data. Neither was the declared PUT /devices/{deviceId}/data route.
The same helper also misrouted device reads. A malformed accepted inventory
could therefore make a later device operation target another route while the
error label and command-result processing still described a device operation.
The initial percent-encoding and route-surface tests exercised ordinary
identifiers, so they did not discriminate this failure.

**Initial observed evidence:** A pure offline probe at a0df3a6 called the actual compiled
createCloudApi and isWireDeviceResponse exports with synthetic records and an
explicit injected HTTP transport on Node v26.11.1. It made no network request,
read no private cache, and changed no source or test. Its complete observations:

```json
{"deviceId":".","wireAccepted":true,"request":{"method":"PUT","path":"/devices/data"},"answer":{"success":true}}
{"deviceId":"..","wireAccepted":true,"request":{"method":"PUT","path":"/data"},"answer":{"success":true}}
```

Those compiled inputs matched the initial reviewed source and full-gate
reference. The returned success was the injected response, demonstrating that
the client accepted a command response after constructing the wrong target.
It did not demonstrate actual vendor acceptance, device actuation, an
authorization bypass or occurrence in a real account.

**Verified Fix:** devicePath refuses exactly `.` and `..` with native TypeError
and the fixed message `Device identifier cannot be used in a request path.`
Its guard runs before send and therefore before token acquisition or HTTP.
Both public implementations are async, preserving rejected-promise behavior
when the local argument is unusable. The error has no raw identifier, URL,
HTTP status or cause. No new exported type, vendor-format regex, double encoding
or identity change was introduced. Ordinary identifiers still use the same
encodeURIComponent expression. The auth-inclusive deadlines, one-attempt
commands, typed HTTP failures and response-body cancellation code are unchanged.

The runtime's sendCommand await remains inside its existing catch;
commandFailureOf maps this non-timeout rejection to vendor-error. No production
single-device read caller was found. The interface still promises the same
results. Four independent active regressions compare the TypeError class and
complete fixed name/message/cause fields, then compare an empty auth/HTTP
interaction record. Their boundaries return valid responses if touched, so
an accidental dispatch cannot pass by producing an unrelated rejection. Each
operation is called before assert.rejects, so a synchronous throw fails.

An independent pure offline current-export probe confirmed all four combinations
of identifier and operation return Promise objects, reject with the exact
TypeError message and leave both boundaries untouched. It used no network,
cache, new test file or mutation. The retained 37-case native GREEN receipt
and fresh full gate supply the executed paired-test evidence.

**Actual Correction Provenance:**

| Stage | Commit / observed evidence |
| --- | --- |
| Unchanged source | b66f7256f242f5c8cad405b4946ce6ab2be66885; API blob c3c11843113f897de2c8e4d2973ed35b475ab381 |
| Planning-only RED evidence | 6839060feeb37382f0af7e700e3d060f1ca76d22; only 02-API-RED-EVIDENCE.json changes |
| GREEN cause and active tests | b8b660a71f5970fbeee8579c97f8b70c6af60926; only src/cloud/api.ts and test/cloud/api.test.ts change |
| Reviewed current HEAD | a973483f4a9a47e8dc861be3138cbbad3a633e67 |

Actual Git objects prove source < evidence < fix < HEAD and identical production
through the evidence commit. The updated JSON retains the entire older API
record as priorEvidence[0], including its nested history and assertion control;
deep equality against the unchanged source-commit JSON passes. The earlier
auth/shadow evidence files are unchanged. All six genuine histories remain
separate from the eight assertion controls.

The authoritative fresh native RED executes 37 tests: 33 pass and these four
targets fail ERR_ASSERTION, Missing expected rejection, exactly once each:

- rejects device read identifier "." before authentication or HTTP
- rejects command identifier "." before authentication or HTTP
- rejects device read identifier ".." before authentication or HTTP
- rejects command identifier ".." before authentication or HTTP

The recorded exit is 1, with zero skipped/cancelled/todo tests and successful
prior build. This reviewer reran the read-only tdd-red-evidence classifier:
exit 0, RED_EVIDENCE_OK, target_test_failed, all four intended failures named.
The full active patch has semantic correspondence with the GREEN test changes.
Independent comparison finds identical nonblank added lines; GREEN has exactly
two additional lint-required blank lines. Byte-exact patch identity is not
claimed. No historical failure was recreated or mutation introduced by this
reviewer.

## Prior Findings and Convergence

The four batch reports, all five plans/summaries, context/protocol, findings,
validation, security and conditional auth/shadow/API RED records were inspected.
The final source and active assertions preserve the remedies for all 55 earlier
accepted findings: auth 16, shadow 10, API 16 and transport 13. Auth independent
cancellation and settlement ownership remain intact; terminal refusal survives
cache cleanup failure. Shadow versions reject non-finite values. API pending-body
aborts preserve their reason, and failed cleanup preserves its typed HTTP error.
Complete request/cache/payload/signing expectations and explicit offline injection
remain present.

The earlier five genuine histories and eight assertion controls stay distinct.
Recorded complete patches and intended native failures agree with the active
regressions; this reviewer introduced no mutation, test or fabricated RED.
Formatter/lint adaptations in AUTH-001/API-014/API-015 are not called byte-exact
patch correspondence. The supplied independent provenance audit remains the
history evidence; this review did not rerun those historical experiments.

The initial whole-phase assessment adding 017 was triage, not a post-fix
correction round. This assessment is API correction round 3 and the first
independent correction review of 017. The API cap was not reset.

| API correction round | Opening | Fixed | Rejected | New | Reopened | Closing |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 15 | 15 | 0 | 1 | 0 | 1 |
| 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| 3 at a973483 | 1 | 1 | 0 | 0 | 0 | 0 |

Round 3 equation: 1 - 1 - 0 + 0 + 0 = 0. Counts and stable-ID disposition were
reported to the parent before this report update. No earlier fixed finding
reopened, the open count decreased, and round 3 is below 4. No D-03 global-pause
trigger occurred. Any fourth correction round still requires global pause,
even if clean. The other batch transitions remain auth 14→2→0, shadow 10→0 and
transport 13→0. All 56 accepted causes are now fixed; overall CLOUD-01 approval
and shared-record reconciliation remain parent-owned.

## Verification Evidence and Limits

The parent executed a fresh same-session npm run check at clean
a973483f4a9a47e8dc861be3138cbbad3a633e67 on Node v26.11.1, exit 0 observed
before 2026-10-14T13:38:55Z within the 2,400-second limit. This reviewer read
/private/tmp/guardian-phase2-api017-full-check.log: all six static gates pass,
104 scenarios/1,156 steps pass, and all 43 isolated pairs produce the merged
coverage/direct.lcov. This fresh result includes the four dot-only regressions.
The reviewer reuses it under local-verification and did not rerun the broad gate.

The API native receipt /private/tmp/guardian-api017-green.tap passes 37/37;
guardian-api017-green.lcov shows 159/159 lines, 14/14 functions and 31/31
branches, each 100%. Earlier owner evidence remains applicable to the other
unchanged scoped files, with the fresh combined gate validating their current
interactions as well. No stale merged denominator replaces the API-only counts.

The working tree and index were clean at correction-review entry. Executable
inputs remain identical to the fresh full-gate reference; this review changes
only its owned planning Markdown report. No untracked executable input,
installation, live vendor call, hardware run, implementation mutation or commit
was introduced. No fresh broad execution by this reviewer is claimed.

The ALPN helper at test/cloud/alpnServer.ts:125-136 closes its listener without
active HTTP/2 session tracking, destruction or a close deadline. Its body is
unchanged except for the header. Current HTTP/1.1 consumers and their recorded
checks pass. No observed current failure confirms the retained active-H2
teardown candidate, so it is unresolved and uncounted, with no speculative
cleanup recommendation presented as a required fix.

The security report's 17 closed ASVS L1 authored controls did not waive the
routing finding; its local repair establishes no vendor occurrence or security
impact and supplies no universal path-confinement claim. E-02-01 taxonomy and
descriptorless P-02-01 safety/P-02-02 truthful-completion judgments remain
pending. This review supplies no Phase 2 human approval, inferred Phase 1
approval, taxonomy-completeness claim or overall CLOUD-01 completion.

---

_Reviewed: 2026-10-14T13:41:17Z_
_Reviewer: gsd-code-reviewer (/root/phase2_final_review)_
_Depth: standard_
