---
phase: 08-final-sweep-and-gate
plan: "21"
status: complete
subsystem: logging-redaction
provides:
  - active RED and GREEN for Error class-name disclosure
  - separate zero-open independent ROOT review
  - current 137-path exact-blob seal
affects: [08-10, GATE-01, GATE-02, BUG-01]
---

# Plan 08-21: Error class-name disclosure

The active named regression failed against unchanged `4093bad` because the
Homebridge delegate received a synthetic registered secret in an `Error`
class name. [Complete RED evidence](08-ROOT-003-RED-EVIDENCE.json) passed
`tdd-red-evidence` and was committed alone with the plan at `eff1a58`.
Commit `499659b` redacts the assembled Error description and commits the
active case. The named case and isolated logger direct coverage passed.
The normal commit hook passed.

The full `NPM_CONFIG_CACHE=/private/tmp/guardian-phase8-plan21-npm-cache
TEST_CONCURRENCY=1 npm run check` exited 0 at `499659b` on Node `v26.12.1`:
130/130 Cucumber scenarios, 1401/1401 steps, and 43 direct coverage pairs.

Independent reviewer `/root/root003_independent_review` read the complete
current source and test blobs. The [separate continuation](08-ROOT-003-CONTINUATION.md)
opened with ROOT-003, fixed it, found none, reopened none, and closed empty.
The two earlier STOP records and their counts remain unchanged. The manifest
now records 137 current blobs: 134 unchanged from the former seal and three
changed blobs with complete independent owner reviews. A one-off exact-blob
audit exited 0. The source tree is ready for prior-phase verifier refresh.

## Threat Flags

Historical BUG-01 debug-evidence limits and stale Phase 1–7 verifier reports
still prevent final Phase 8 signoff. The repaired Error class-name disclosure
has active RED, GREEN, full-gate, and independent complete-file evidence.
