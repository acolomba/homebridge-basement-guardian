---
phase: 03-device-and-persistence-conformance
reviewed: 2026-10-23T02:27:11Z
depth: standard
reviewed_revision: a18d3141fd7aceab702d04c2bc482e8e7ed7512b
diff_base: aa826a50a0afeda9a95ab05d38240219bfcb5595
reviewer: /root/phase3_verification_refresh/phase3_code_review_refresh
reviewer_role: gsd-code-reviewer
review_purpose: execute-post-advisory-refresh
requirement: DEV-01
files_reviewed: 20
files_reviewed_list:
  - src/device/events.ts
  - src/device/family.ts
  - src/device/gemini.ts
  - src/device/halo.ts
  - src/device/health.ts
  - src/device/registry.ts
  - src/device/state.ts
  - src/device/waterLevel.ts
  - src/persistence/accessoryContext.ts
  - test/device/events.test.ts
  - test/device/family.test.ts
  - test/device/gemini.test.ts
  - test/device/geminiSeeds.ts
  - test/device/halo.test.ts
  - test/device/health.test.ts
  - test/device/registry.test.ts
  - test/device/state.test.ts
  - test/device/stateSeeds.ts
  - test/device/waterLevel.test.ts
  - test/persistence/accessoryContext.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
open_ids: []
reopened_ids: []
pending_stop: false
status: clean
---

# Phase 03: Code Review Report

**Reviewed:** 2026-10-23T02:27:11Z
**Depth:** standard, with bounded consumer tracing
**Files Reviewed:** 20
**Status:** clean within this advisory source and test scope

## Summary

This review refreshes the Phase 03 device and persistence verdict at
`a18d3141fd7aceab702d04c2bc482e8e7ed7512b`. The complete current inventory
contains nine source/test pairs and two test seed helpers. The Git blobs and
line counts of all 20 paths match the sealed Phase 08 manifest. None is ignored.
Since the earlier Phase 03 review at `a10902c5`, three inventory paths changed:
`src/device/state.ts`, `src/persistence/accessoryContext.ts`, and
`test/device/state.test.ts`. The other 17 still have their complete reviewed
file evidence. The changed pair and type contract were read at their current
full contents; unchanged source contracts, test expectations, and exact
consumers were rechecked. No confirmed current BLOCKER or WARNING was found.

## Narrative Findings (AI reviewer)

No new or reopened finding. This is an additional execute:post advisory review,
not a Phase 03 correction round. It does not reset a D-03 counter or change the
38 accepted Phase 03 finding dispositions. No source or test was edited.

## Current behavior and consumer checks

| Scope | Current review result |
| --- | --- |
| Canonical store | `state.ts:219-276` treats empty reported telemetry as no reading: it cannot restamp receipt time or take shadow ownership, while reported metadata can still update its own record. A desired-only document can advance an existing ordering watermark without creating one. The current owner asserts an empty patch followed by a different REST poll at `state.test.ts:416-440`. |
| Silence and replay | `state.ts:334-432` keeps a per-device version fence when a live connection's device falls silent, while handing telemetry back to REST. Duplicate, older, and unversioned telemetry cannot replace a later REST flood reading. A strictly newer version resumes ownership; disconnect or removal starts a new epoch. The current owner checks the flood, neighbour, metadata, first-version, disconnect, and removal paths at `state.test.ts:593-740`. The actual runtime uses `silence` before inventory updates at `accountRuntime.ts:424-456` and `disconnect` after connection loss at `:811-825`; its callback stamps liveness only for accepted nonempty telemetry at `:892-901`. |
| Accepted heartbeat | `state.ts:305-324,357-383` sends an accepted, data-bearing unchanged heartbeat to listeners with an empty changed-key list; refused versions and documents without telemetry do not notify. The store owner checks these distinctions at `state.test.ts:1008-1084`. The actual platform listener forwards the accepted snapshot to the accessory at `platform.ts:180-197`; the accessory updates per-scope trusted time at `basementGuardian.ts:915-922,997-1074`. Its pump observation is based on decoded state transitions, so the unchanged callback does not create another activation. |
| Family and support | Gemini still validates and decodes each scope independently; invalid water, pump, power, battery, fault, connectivity, self-test, or mute fields cannot become normal defaults. HALO remains identified but unsupported. Registry lookup keeps profile selection separate from the vendor `deviceId` used for physical identity. The provisional six-code water ladder and flood threshold remain explicitly gated by G-002. Current test owners use independent complete results and strict type contracts rather than production-generated expectations. |
| Persisted observations | `accessoryContext.ts:32-126` now documents the optional persisted `backupEdgeAwaitingTimestamp` marker used by `pumpRecords.ts:314-405` to avoid counting a watched backup run again when its device timestamp arrives. The stored timestamp members remain device seconds; activation display times remain milliseconds. The context contains no credentials or raw telemetry. Its declaration-only owner checks present, absent, writable, and forbidden members; the pump-record consumer owns the marker's runtime behavior. |

The unchanged 17 inventory files are byte-identical to the complete current
Phase 08 DEVICE review rows. The three changed files are also covered by the
Phase 08 correction reviews at their current blobs. That prior evidence was
used for orientation, then the changed code, discriminating owner cases and
actual runtime, platform, accessory, shadow-parser and pump-record consumers
were inspected against the live tree. The parser keeps only record-shaped
reported sections and finite numeric versions at `shadow.ts:188-205`. A
current read of `08-MANIFEST.json` matched all 20 Git blobs. There was no
structural pre-pass or external reviewer evidence block for this refresh.

## Verification and limits

The earlier Phase 03 `npm run check` at `629cfc4a` is historical evidence only:
the Phase 08 source and test repairs changed its executable inputs. The later
Phase 08 combined `TEST_CONCURRENCY=1 npm run check` at clean `dd87848` exited
zero on Node v26.12.1 with six static checks, 130 offline Cucumber scenarios,
1,401 steps, and 43 isolated direct coverage pairs. A read-only Git diff from
that revision to this reviewed revision found no changed executable input.
This reviewer did not rerun a build, owner suite, coverage command, hook, or
full gate. The Phase 08 final GATE-01 seal remains a separate pending judgment.

Phase 08 subsequently identified and fixed DEVICE-001 (empty telemetry
ownership), DEVICE-002 (unchanged heartbeat trust time), and RUNTIME-006
(replay after silence). These later, distinct accepted causes do not rewrite
the earlier Phase 03 ledger's zero accepted genuine production bugs or its
continuous STATE `10→1→0`, DECODING `14→1→0`, and SUPPORT `10→2→0` correction
histories. The 38 Phase 03 accepted conformance findings remain closed. No
Phase 03 finding reopened, and no Phase 03 D-03 stop was established here.

WINDOWS 46/47 remain OPEN and unwaived. The missing historical clean pre-step
repeat and alias-specific pre-edit Fallow trace cannot be reconstructed by a
current passing check. The historical Gemini `247/247` figure remains
unconfirmed; current native and mapped coverage are separate measurements.
The five successful assertion controls and one unsuccessful TypeError-before-
assert attempt retain their distinct historical classifications.

E-03-01 remains unclassified and unresolved: complete reviewed files and
concrete cases do not supply an exhaustive taxonomy. P-03-01 remains a
human-needed judgment about this bounded telemetry-safety result, with
provisional water and battery meanings, the opaque-key assumption, and real
hardware outside this review. P-03-02 remains a human-needed judgment about
the truthful completion boundary, including the historical limits above.
The Phase 03 equality remains one flagged assumption and zero lifted edge
predicates; both authored prohibitions remain visible. DEV-01 and phase
advancement remain parent-owned. Current Nyquist 18/18 and security 18/18
records are separate bounded gates, not substitute code-review findings.

_Reviewer: /root/phase3_verification_refresh/phase3_code_review_refresh (gsd-code-reviewer)_
_Depth: standard; additional execute:post advisory review; no source fix or commit_
