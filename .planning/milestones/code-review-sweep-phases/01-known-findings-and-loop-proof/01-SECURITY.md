---
phase: "01"
slug: "known-findings-and-loop-proof"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-10-13"
---

# Phase 1 — Security

The plan-authored register is verified at ASVS L1 depth. Blocking threshold is high. All four SUMMARY Threat Flags report no added surface outside the register. This audit verifies the planned mitigations; it does not claim hardware or vendor validation.

## Trust Boundaries

| Boundary | Data Crossing |
| --- | --- |
| Caller cancellation → shared grant | Cancellation signals from concurrent token consumers |
| Cache writer → local storage | Secret token bytes and owner-only file permissions |
| Reported telemetry → test assertions | Immutable and stale-state snapshots |
| Batch reports → findings ledger | Synthetic failure output, patches, and commit evidence |

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| T-01-01 | Information disclosure | Cache writer | high | mitigate | `src/cloud/auth.ts:242` retains owner-only `wx`; occupied-path bytes/mode test and negative control in `01-AUTH-REVIEW.md`; isolated coverage 100% | closed |
| T-01-02 | Denial of service | Shared grant cancellation | high | mitigate | `waitFor` and waiter-owned cancellation at `src/cloud/auth.ts:444` and `:521`; joined/first/zero-waiter/shutdown cases pass | closed |
| T-01-03 | Denial of service | In-flight settlement | high | mitigate | Slot clears only on attempt settlement; delayed teardown and no-duplicate-grant cases pass in auth owner suite | closed |
| T-01-04 | Information disclosure | Authentication logging | high | mitigate | Token registration and silent caller abort preserved; existing synthetic credential-redaction tests pass; RED patch/TAP audited in `01-FINDINGS.md` | closed |
| T-01-05 | Tampering | Refusal assertions | medium | mitigate | Eight independent full-line cases and observed same-status wrong-cause failure in `01-CONTROLS-REVIEW.md` | closed |
| T-01-06 | Information disclosure | Refusal warnings | medium | mitigate | Complete one-element warning arrays reject extra content; controls owner 63/63 and isolated coverage 100% | closed |
| T-01-07 | Tampering | State assertions | high | mitigate | Complete values before frozen checks and store reads after stale refusal; six intended negative controls and exact restoration in `01-STATE-REVIEW.md` | closed |
| T-01-08 | Tampering | RED/fix provenance | high | mitigate | Actual reachable Git objects and paths; source `109fda7` precedes evidence `919d70d`, which precedes fix `3878103`; classifier `RED_EVIDENCE_OK` | closed |
| T-01-09 | Denial of service | Review loop | medium | mitigate | `01-REVIEW-PROTOCOL.md` immediate stop contract; actual independent round-1 counts auth 3→0, controls 1→0, state 1→0 | closed |
| T-01-10 | Information disclosure | Evidence records | high | mitigate | Synthetic fixtures only; full regression patch and TAP provenance audit recorded in `01-FINDINGS.md` | closed |
| T-01-SC | Tampering | Package installs | high | mitigate | No dependency install or package/lock change in the phase; reserved ID deduplicated across plans | closed |

## Accepted Risks Log

No accepted risks. All planned mitigations are present. Open hardware release gates remain separately tracked and are outside this phase.

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
| --- | --- | --- | --- | --- |
| 2026-10-13 | 11 | 11 | 0 | Execution coordinator, plan register and source/test evidence at L1 depth |

## Sign-Off

- [x] Every threat has a disposition and evidence.
- [x] No accepted risk substitutes for missing mitigation.
- [x] `threats_open: 0` confirmed at the high threshold.
- [x] `status: verified` set.

**Approval:** Verified 2026-10-13 from source, batch reviews, mutation evidence, and combined gate. Numeric IDs are unique; reserved T-01-SC is a single repeated plan prerequisite.
