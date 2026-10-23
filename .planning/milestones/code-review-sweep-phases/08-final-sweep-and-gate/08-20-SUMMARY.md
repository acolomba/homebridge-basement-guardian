---
phase: 08-final-sweep-and-gate
plan: "20"
status: stopped
subsystem: verification-refresh-corrections
requires:
  - phase: 08-final-sweep-and-gate
    provides: prior exact-blob seal at 5411aa7
provides:
  - active RED and repair for escaped registered-secret logging
  - deterministic arrival-write ordering assertion and negative control
  - independent complete-file review with a new no-progress STOP
affects: [08-10, 08-15, GATE-01, GATE-02, BUG-01]
---

# Phase 8 Plan 20: Verification Refresh Corrections

The Phase 4 advisory review exposed two findings. ROOT-002 had an active named
regression failure on unchanged production at `a18d314`; its complete RED
archive passed `tdd-red-evidence` and was committed alone at `d27a0be`.
Commit `bf2e99c` fixed raw and JSON-escaped secret matching in shared text
redaction. The named case and isolated logger coverage passed.

RUNTIME-007 was a weak test, not a production behavior defect. Commit
`9863d9b` replaced its real-time fallback with an event-loop barrier and an
observed pre-release write count. Its negative control failed on a temporary
non-serializing writer while the old final-byte assertion still matched. The
production source was restored byte for byte. The named case and isolated
arrival-anchor coverage passed.

The full `NPM_CONFIG_CACHE=/private/tmp/guardian-phase8-plan20-npm-cache
TEST_CONCURRENCY=1 npm run check` exited 0 on Node `v26.12.1` at `9863d9b`:
130/130 Cucumber scenarios, 1401/1401 steps, and 43 isolated direct coverage
pairs. Normal commit hooks passed both cause commits.

Independent reviewer `/root/phase8_plan20_owner_review` read complete current
`src/logging.ts` (blob `e3f40d3`, 1-227), `test/logging.test.ts` (blob
`a48a462`, 1-668), and `test/runtime/arrivalAnchors.test.ts` (blob `972cf75`,
1-453). RUNTIME round 3 closed RUNTIME-007 with no new ID. ROOT round 2
closed ROOT-002 but found **CR-08-ROOT-003**: an `Error` subclass constructor
name can contain a registered secret, and the logger prepends that name after
redacting the message. The reviewer reproduced the leak with synthetic data.

ROOT round 2 opened with one ID and closed with one. The review protocol's
no-progress rule stopped the continuation. `08-STOP-CONTINUATION.json` records
the active STOP and the one current forward-open ID; the original historical
STOP remains untouched. The old Plan 08-15 manifest does not cover these
changed blobs. Plan 08-10 and Phase 8 signoff remain incomplete.

## Threat Flags

ROOT-003 can disclose a registered secret through an Error class name. The
passing suite has no case for that path. GATE-02 and final signoff are blocked
until a separately authorized continuation repairs and independently reviews
the current tree.
