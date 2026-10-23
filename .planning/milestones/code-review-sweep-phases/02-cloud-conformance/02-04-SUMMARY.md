---
phase: 02-cloud-conformance
plan: "04"
subsystem: transport
tags: [cloud, conformance, http, mqtt, sigv4]
requires:
  - phase: 02-cloud-conformance
    provides: Completed API wave and released sequential build and Git resources
provides:
  - Complete offline HTTP response and caller-cancellation observations
  - Exact MQTT interactions, payload bytes and callback-owned end completion
  - Independent complete signing URLs and a fresh concern-owned input seed
  - Clean independent eight-file transport review after thirteen cause repairs
affects: [cloud, review-process]
tech-stack:
  added: []
  patterns: [paired undici HTTP transport, strict promised interactions, independent signing bytes]
key-files:
  created:
    - test/cloud/sigv4Seeds.ts
    - .planning/phases/02-cloud-conformance/02-TRANSPORT-REVIEW.md
  modified:
    - src/cloud/httpDispatcher.ts
    - src/cloud/mqttTransport.ts
    - src/cloud/sigv4.ts
    - test/cloud/httpDispatcher.test.ts
    - test/cloud/mqttTransport.test.ts
    - test/cloud/sigv4.test.ts
    - test/cloud/alpnServer.ts
key-decisions:
  - Preserve paired userland fetch and Agent with explicit HTTP/1.1
  - Preserve factory-time MQTT handshake, deadlines and callback-owned teardown
  - Move the unchanged signing input seed into authorized test support
requirements-completed: [CLOUD-01]
actuals:
  tokens: 16498
  tasks: 3
  commits: 15
plan_head_before: 5f91f1dbea4113ceaf32fbf715dcc41d489086a9
plan_head_after: fb3de06560c1978281bfd8ee4f97c3fd8b9d1204
coverage:
  - id: D1
    description: HTTP returns complete HTTPS results and preserves caller cancellation
    requirement: CLOUD-01
    verification:
      - kind: unit
        ref: test/cloud/httpDispatcher.test.ts#negotiates HTTP/1.1 even when the server offers HTTP/2
        status: pass
      - kind: unit
        ref: test/cloud/httpDispatcher.test.ts#rejects with the caller reason without sending an already-aborted request
        status: pass
    human_judgment: false
  - id: D2
    description: MQTT forwards exact bytes and waits for shared client end completion
    requirement: CLOUD-01
    verification:
      - kind: unit
        ref: test/cloud/mqttTransport.test.ts#forwards the message notification with its topic and payload
        status: pass
      - kind: unit
        ref: test/cloud/mqttTransport.test.ts#ends the client once and resolves both times when ended twice
        status: pass
    human_judgment: false
  - id: D3
    description: Signing preserves independently expected complete URL bytes
    requirement: CLOUD-01
    verification:
      - kind: unit
        ref: test/cloud/sigv4.test.ts#signs the complete URL for a different secret access key
        status: pass
      - kind: other
        ref: .planning/phases/02-cloud-conformance/02-TRANSPORT-REVIEW.md#Review rounds
        status: pass
    human_judgment: false
duration: 664min
started: "2026-10-14T01:17:08Z"
completed: "2026-10-14"
status: complete
---

# Phase 2 Plan 4: Transport and Signing Conformance Summary

**HTTP, MQTT and signing have complete offline observations, strict promised interactions, eight inspected headers, and a clean independent review.**

## Performance

- Tasks: 3/3. Implementation files: 8. New records: this summary and the review.
- Started: 2026-10-14T01:17:08Z. Recorded completion: 2026-10-14T12:21Z.
- Recorded elapsed wall time: 11h 4m. Fixer implementation/check records finish at 01:52:29Z; final record closeout occurs later.
- Isolation: none in the existing features/code-review-sweep worktree. No branch or worktree was created or switched.
- Actual tokens use chars/4 over the realized code diff and new records. Fifteen commits are measured from the persisted plan ledger through reviewed code fb3de06; the final records commit follows that snapshot.

## Accomplishments

The HTTP tracer consumes the complete HTTPS result before checking negotiated
HTTP/1.1. The already-aborted request case preserves the caller's exact reason
and observes no server request. Certificate restoration is registered before
trust changes. Paired userland undici fetch/Agent and allowH2 false remain intact.

MQTT tests require exact connection options, signing identity, callback
registrations, notifications and commands. Strict mocks have definite counts
and explicit verification after public observations. Canned error/deadline
paths remain typed stubs. Non-UTF-8 payloads are compared as complete Buffers.
Simultaneous end promises remain pending until the client callback, then resolve
together and retain memoization. Factory handshake, deadlines and teardown stay
under their existing owners.

Four changed signing inputs now have independently calculated complete expected
URLs. Node crypto primitives and security-token placement are preserved. The
coordinator authorized sigv4Seeds.ts to hold the unchanged fresh input seed;
its header and implementation ship together, without new flexibility or meta-tests.

## Task Commits

| Task / cause | Full commit |
| --- | --- |
| 1 / original seven headers 001 | f5d2456755a02c8508caf5f729447bf38f2067bc |
| 1 / caller cancellation 005 | dc6f2a169dabd9bd8cd41c67ce263915ae0bb78d |
| 1 / complete HTTPS result 006 | 3c0f1b6188f7b3f9ae7fd0739dcb6ee694555c20 |
| 1 / CA restoration order 009 | e6e3f479b1d48bd24c51506dc7248b9f684c05e6 |
| 1 / offline injection documentation 010 | a2430e3c4cfc94ab5d7fa68ddbcf3c0b14bb166d |
| 2 / callback end completion 003 | f81d3e974e1654a7f0e6ad7ef2a9b55f5963e6c9 |
| 2 / complete payload bytes 004 | d4ce7c554cae6cb7f24c7357378f2f4e790654e3 |
| 2 / MQTT AAA 008 | 31c406ea69926f1aeca979feb88ce952c0a4ebd2 |
| 2 / strict promised interactions 007 | 7c80ea06aef7f4e8c30f2378b4d8af1d49bc3e2f |
| 2 / hook binding naming 011 | 77eebb791918321ea9c5bb5347a549ff7cc5dc4d |
| 2 / original registration cause completion 007 | 992eb13babba2298ad25807d5acbc4de196e2f94 |
| 3 / HMAC parameter naming 012 | a4a65eda2cb9dfd76abda282b2658318b7323045 |
| 3 / authorized seed and header 013 | 27a5df7070e843c34e9d39ca1985f0c4daaba1b5 |
| 3 / signing AAA 008 | 1ad928514f82f0132d1ae3529ab8c6053d5419d7 |
| 3 / independent complete URLs 002 | fb3de06560c1978281bfd8ee4f97c3fd8b9d1204 |

Actual paths, hooks, chronology, reviewed locations and controls are retained in
02-TRANSPORT-REVIEW.md and /private/tmp/guardian-transport-fixer-actuals.json.
Confirmed repairs use gsd-code-fixer. Initial and full re-review use the separate
gsd-code-reviewer. No tracked file was deleted.

## TDD Gate Compliance

No genuine production defect was established. Header, naming and assertion
maintenance preserve implemented behavior; no fictitious RED or conditional
RED JSON was created. Approved D-04 applies if a genuine defect emerges, rather
than requiring a failing-code commit for existing correct behavior.

Four separate controls prove assertion/interaction discrimination: premature
end resolution, UTF-8 payload normalization, duplicate listener registration,
and a missing signature for a changed secret. Each native named target executes
once and fails its intended assertion or strict interaction, exit 1, with no
skips/cancellations. Source restores byte-exact before a fresh full owner GREEN.

The first two MQTT controls restore SHA-256
0e0916b1dca0c9d7f9b53fbfab1723110b90fc782d27ca4f2ce4e6a6987aa95d.
The registration control restores
7aac52aad1aa7dd0e805fb274303fbb730c1816db4a61348e3cd2af6b99829c6.
Signing restores
a72e4e4ef51726b2fb081376e2dc52d5a24c819b23c5ca43a782f9ee7b697419.
Full temporary patches, native output, source commits/bytes, timestamps and
restoration receipts are separate negativeControls entries in the private manifest.
No mutation was committed or classified as production-bug RED.

## Check Results

Final evidence covers reviewed code fb3de06, Node v26.11.1. No live vendor,
hardware, package installation, dependency upgrade or new integration was used.

| Command / check | Outcome |
| --- | --- |
| npm run build:test | Exit 0; fresh final compiled owners |
| npm run build:test followed by node --test dist-test/test/cloud/httpDispatcher.test.js | Exit 0; 3/3; tracer and feedback both run before MQTT expansion |
| npm run test:coverage:direct -- src/cloud/httpDispatcher.ts test/cloud/httpDispatcher.test.ts | Exit 0; HTTP isolated 100%, tracer repeated |
| npm run test:coverage:direct -- src/cloud/mqttTransport.ts test/cloud/mqttTransport.test.ts | Exit 0; MQTT isolated 100% |
| npm run test:coverage:direct -- src/cloud/sigv4.ts test/cloud/sigv4.test.ts | Exit 0; signing isolated 100% |
| Fresh native module-only TAP/LCOV with all three thresholds at 100 | Exit 0 each; HTTP 3 cases, 23/23 lines, 1/1 functions, 2/2 branches; MQTT 21 cases, 118/118,20/20,24/24; signing 9 cases,61/61,4/4,5/5 |
| Required manual pre-step and enabled foreground commit hooks | All fifteen successful commits pass; ALPN header and new seed support select all 43 pairs |
| Fallow guard, consumer evidence, per-commit audits and final review | All complete; audit/review pass with no introduced finding |
| Independent source/header/ancestry/restoration checks | All eight headers, fifteen ancestors and four exact restorations pass |

All 33 final native cases pass; none is skipped or cancelled. Fresh reports are
/private/tmp/guardian-transport-http-final.lcov, guardian-transport-mqtt-final.lcov
and guardian-transport-sigv4-final.lcov, with sibling native TAP files.
Exact counts come from these module-only reports. Selected-pair commands do not
refresh the merged coverage/direct.lcov. The coordinator owns the full npm run
check wave gate and shared tracking; this summary does not claim that gate passed.

## Review Convergence

Independent reviewer /root/phase2_transport/transport_review_initial reviewed
all eight complete files and the full baseline diff at fb3de06.

| Round | Opening | Fixed | Rejected | New | Reopened | Closing |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 13 | 13 | 0 | 0 | 0 | 0 |

Initial 013 is an original-code seed clarification, authorized before signing
repairs and the first post-fix round. Original 007 registration completion
occurred before formal closure. Neither is a hidden round or reopened fix.
Counts and IDs were reported before further record work. No stall, reopening
or fourth-round trigger occurred. All five blockers and eight warnings are fixed.

## Deviations from Plan

The coordinator authorized one bounded test-support addition for confirmed
013: sigv4Seeds.ts. It moves the existing fresh seed unchanged, receives a full
header and independent whole-file review, and passes the all-pair hook selector.
No production API, protocol, library, feature or lifecycle redesign was added.

Shared STATE, ROADMAP, REQUIREMENTS, WINDOWS and central ledger updates remain
coordinator-owned. CLOUD-01 is pending overall. The requirements-completed
frontmatter records this plan's contribution, not whole-requirement completion.

## Issues Encountered

Four formatting pre-step failures, a void-expression foreground hook failure,
and one spacing lint failure were corrected, restaged and retried. Failed
attempts made no commit and do not supply RED evidence. The records pre-step
corrected a trailing blank line before its clean repeat. One idle follow-up
message was corrected with an explicit fixer continuation.

The ALPN helper's active HTTP/2 session-close concern remains UNCONFIRMED.
Expected HTTP/1.1 cases pass; no executed current failure established a finding.
It is retained for coordinator judgment, without a speculative cleanup change.

## Known Stubs

None. No introduced placeholder, TODO, FIXME, disabled test or unrun owned
verification remains. Empty payload and synthetic credentials are intentional
test inputs, not product stubs.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Next Phase Readiness

Ready for the coordinator's full combined wave gate and final ledger audit.
All owned code and review inputs are committed; shared records remain untouched.

## Self-Check: PASSED

All eight implementation files and the report exist. All fifteen recorded
commits are ancestors of reviewed HEAD. All four pre-control bytes/hashes and
restoration receipts were inspected. Current source/test inputs match the
reviewed commit, with no mutation, tracked deletion or untracked executable input.
This summary is checked on disk before its records commit.
