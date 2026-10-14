---
phase: 02-cloud-conformance
reviewed: 2026-10-14T13:19:41Z
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
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-10-14T13:19:41Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found
**Revision:** a0df3a682476612e364a1c601843390f5a418245
**Baseline:** aa054de81be0ad378bb9fef3f701ead1eb497bf6
**Reviewer:** /root/phase2_final_review, gsd-code-reviewer

## Summary

One new BLOCKER remains: accepted dot-only device identifiers change the REST
request route during URL normalization. The incorrect routing is confirmed;
vendor occurrence and security impact are not established. No previously fixed
finding reopened. Phase 2 cannot receive a clean code-review result yet.

The complete contents of all 22 files were read. The 19 cloud files received
standard source/test/helper review. The three external auth consumers were read
in full to assess their filename/header edits and changed interactions; this
does not claim the later platform or Cucumber subsystem sweep. Source predicates,
error propagation, request deadlines, auth waiter ownership, cache writes,
shadow routing, transport callbacks, signing bytes and relevant runtime callers
were checked against the project rulebooks and batch records.

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

## Narrative Findings (AI reviewer)

### Critical Issues

### CR-02-API-017: Dot-only identifiers escape the declared device route

**Severity:** BLOCKER
**Requirement:** CLOUD-01; opaque device identity and closed REST routes (T-01-31, SYNC-01)
**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/src/cloud/api.ts:82-83`
**Related locations:** api.ts:167,199-208; types.ts:126-127,142-149; test/cloud/api.test.ts:206-233,688-769.
**Disposition:** New, open. This assigns an ID to the previously unconfirmed
dot-only candidate; it does not reopen CR-02-API-001 through 016.

**Issue:** devicePath encodes an opaque identifier with encodeURIComponent,
which leaves `.` and `..` unchanged. The URL constructor in send then interprets
them as path-control segments. The existing CloudApi methods accept string
identifiers, the wire predicates accept both values, and no enforced identifier
precondition excludes them. The documented vendor identifier shape therefore
cannot establish that this branch is unreachable.

For an accepted `.` identifier, sendCommand issues PUT /devices/data. For `..`,
it issues PUT /data. Neither is the declared PUT /devices/{deviceId}/data route.
The same helper also misroutes device reads. A malformed accepted inventory
can therefore make a later device operation target another route while the
error label and command-result processing still describe a device operation.
The existing percent-encoding and route-surface tests exercise ordinary
identifiers, so they do not discriminate this failure.

**Observed evidence:** A pure offline probe called the actual compiled
createCloudApi and isWireDeviceResponse exports with synthetic records and an
explicit injected HTTP transport on Node v26.11.1. It made no network request,
read no private cache, and changed no source or test. Its complete observations:

```json
{"deviceId":".","wireAccepted":true,"request":{"method":"PUT","path":"/devices/data"},"answer":{"success":true}}
{"deviceId":"..","wireAccepted":true,"request":{"method":"PUT","path":"/data"},"answer":{"success":true}}
```

The compiled inputs match the reviewed source and the unchanged full-gate
reference. The returned success is the injected response, demonstrating that
the client accepts a command response after constructing the wrong target.
It does not demonstrate actual vendor acceptance, device actuation, an
authorization bypass or occurrence in a real account.

**Fix:** Refuse the two URL control-segment identifiers before obtaining a token
or dispatching a device read/command, using a fixed sanitized promise rejection.
Keep ordinary opaque identifiers and current percent-encoding behavior intact;
do not invent a vendor-format regex or change physical identity. Add independent
paired regressions for both identifiers through both public operations, asserting
the rejection and that no authentication or HTTP dispatch occurs. Merely
replacing dots with %2E is insufficient because URL parsing also normalizes
percent-encoded dot segments. Follow D-04 with active unchanged-production
failure evidence before the cause fix. This review supplies a diagnostic probe,
not an invented committed regression or RED record.

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
regressions; no new mutation, generated test or fabricated RED was introduced.
Formatter/lint adaptations in AUTH-001/API-014/API-015 are not called byte-exact
patch correspondence. The supplied independent provenance audit remains the
history evidence; this review did not rerun those historical experiments.

This whole-phase assessment is separate from the completed batch correction
rounds: earlier accepted open 0, new 1, reopened 0, final narrative open 1.
The recorded batch transitions remain 14→2→0, 10→0, 15→1→0 and 13→0. No fixed
finding returned, no recorded positive-count round stalled, and no fourth
correction round was reached. The new cause was reported immediately to the
parent; no implementation repair or further correction round was performed
by this reviewer. The parent owns subsequent D-03 scheduling and disposition.

## Verification Evidence and Limits

The same-session npm run check result at clean
e57e7d4d3a6276838a8d5024cdb0644413d28d75 is reused under local-verification.
Its recorded exit is 0 on Node v26.11.1, within the 2,400-second limit. The retained
guardian-phase2-wave4-full-check.log was read: all six static gates pass,
104 scenarios/1,156 steps pass, and all 43 isolated pairs produce the merged
coverage/direct.lcov. The eight cloud owner records show direct 100% lines,
functions and branches. These passing checks do not cover the newly identified
dot-only behavior.

The current comparison against that clean reference is empty after excluding
planning Markdown. The only untracked inputs before this report are the two
nonexecutable planning Fallow JSON files. Source, tests, helpers, dependency,
configuration, tools and Node inputs are unchanged. No fresh full-run claim is
made and no broad suite was needlessly repeated. No installation, live vendor
call, hardware run, implementation mutation or commit occurred.

The ALPN helper at test/cloud/alpnServer.ts:125-136 closes its listener without
active HTTP/2 session tracking, destruction or a close deadline. Its body is
unchanged except for the header. Current HTTP/1.1 consumers and their recorded
checks pass. No observed current failure confirms the retained active-H2
teardown candidate, so it is unresolved and uncounted, with no speculative
cleanup recommendation presented as a required fix.

The security report's 17 closed ASVS L1 authored controls do not waive the new
routing finding or establish universal path confinement. E-02-01 taxonomy and
descriptorless P-02-01 safety/P-02-02 truthful-completion judgments remain
pending. This review supplies no Phase 2 human approval, inferred Phase 1
approval, taxonomy-completeness claim or overall CLOUD-01 completion.

---

_Reviewed: 2026-10-14T13:19:41Z_
_Reviewer: gsd-code-reviewer (/root/phase2_final_review)_
_Depth: standard_
