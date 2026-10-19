# Phase 6: Root Module Conformance - Discussion Log

> **Audit trail only.** Planning and execution use `06-CONTEXT.md`.

**Date:** 2026-10-19
**Phase:** 6-root-module-conformance
**Areas discussed:** Two unpaired tests; ENTRY round-four STOP

---

## Two unpaired tests

| Option | Description | Selected |
|--------|-------------|----------|
| Review as root tests | Include both files in the Phase 6 review. | |
| Leave as repository gates | Keep both files but outside the six-pair review. | |
| Remove both tests | Delete both files and their tooling declarations. | ✓ |

**User's choice:** "no, remove both tests."

**Notes:** The earlier suggestion to exclude the files without deleting them
was corrected by the maintainer. Commit `9605a63` physically removed both.
The full repository check passed after deletion.

## ENTRY round-four STOP

| Option | Description | Selected |
|--------|-------------|----------|
| Debug and replan | Investigate ENTRY-019/020 outside the stopped correction loop, then plan a bounded validation gate. | ✓ |
| Leave ENTRY stopped | Keep both privacy findings open and do not dispatch PLATFORM. | |

**User's choice:** “Yes, debug and replan (Recommended).”

**Notes:** Round four remains a STOP with opening 1, fixed 1, new 2,
closing 2, and open IDs CR-06-ENTRY-019/020. Focused GSD debug reproduced
both leaks before the repair, committed `24f3620` and `2d291cc`, and passed
the full repository check and normal hooks. Its RED and revert/reconfirm
record is not a Phase 6 planning-only RED evidence commit. The debug session
still awaits the maintainer's original Homebridge workflow check. The
replanned gate permits one independent complete-file review after debugging;
it does not authorize a fifth correction round or automatic fixes. PLATFORM
remains blocked until ENTRY closes cleanly, including explicit human
confirmation. Any open or new accepted finding needs another decision.

## The agent's Discretion

Batching the five smaller pairs within the roadmap's nonoverlapping-wave rule.

## Deferred Ideas

None.
