# Phase 2 cloud findings ledger

Milestone: code-review-sweep. Requirement: CLOUD-01. Coordinator-delegated
evidence audit in features/code-review-sweep, isolation none. This first slice
traces one actual finding; complete inventory and final checks follow in task 2.
It does not claim whole-requirement completion or phase-end approval.

## Inventory

Tracer inventory: src/cloud/auth.ts and test/cloud/auth.test.ts. Independent
full-file review at 14c740371e8a35f8ade64b7f890c0f88269e7f03 covers both files
and the bounded filename/header deltas in three external consumers. Authoritative
batch record: .planning/phases/02-cloud-conformance/02-AUTH-REVIEW.md.

## Findings

| ID | Requirement | Rule and original location | Severity | First round | Disposition and public evidence | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| CR-02-AUTH-015 | CLOUD-01 | D-13 terminal refusal; auth.ts:337-338,354-359 at 7a13125f7c80b962a78b1d888ee61a0dd1aaea7f | BLOCKER | 1 | Fixed; D-13 preserves the terminal refusal when the cache path is a directory asserts AuthRejectedError, halted follow-up, one grant, preserved directory bytes and fixed sanitized logs | 9edb50cf4dac1d622c36e0afd21052f6d9be31a2 |

Audit command: node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence
.planning/phases/02-cloud-conformance/02-AUTH-RED-EVIDENCE.json --raw.
Observed exit 0, RED_EVIDENCE_OK, target_test_failed, valid native TAP.
The active intended target failed class discrimination: expected true, actual
false. The owner executed 69 tests, 68 passed, one failed, zero skipped or
cancelled. Node v26.11.1; capture 2026-10-13T23:04:22.700Z through
2026-10-13T23:04:24.907Z. This is a genuine unchanged-production failure,
not an assertion mutation or environment/setup failure.

Actual Git objects establish source 7a13125f7c80b962a78b1d888ee61a0dd1aaea7f
< evidence 31b30839ba0779017f289b5a453e657f01405a5b
< fix 9edb50cf4dac1d622c36e0afd21052f6d9be31a2 < HEAD.
Evidence changes only 02-AUTH-RED-EVIDENCE.json. Source and evidence production
blobs both equal ce09e40cd6987daf087293bbd7bef38e60b5e49e. The fix changes
only auth source/test and includes the complete saved active regression patch.
The enabled-hook passing repair contains nonrecursive cleanup failure handling;
the auth report records pre-step and foreground hook exits. Current locations
are auth.ts:338-344,359-364 and auth.test.ts:1071-1117.

## Review rounds

Independent reviewer /root/phase2_auth/auth_rereview_1, gsd-code-reviewer,
reviewed the complete auth pair and bounded consumer deltas. Triage and tracer
checks are not post-fix rounds.

| Batch / round | Reviewed revision | Opening | Fixed | Rejected | New | Reopened | Closing |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Auth / 1 | 7a13125f7c80b962a78b1d888ee61a0dd1aaea7f | 14 | 14 | 0 | 2 | 0 | 2 |
| Auth / 2 | 14c740371e8a35f8ade64b7f890c0f88269e7f03 | 2 | 2 | 0 | 0 | 0 | 0 |

Round 1 introduces only 015 and 016 after closing 001-014. Round 2 closes
015/016 and explicitly reports zero open findings. Equations: 14-14+2=2;
2-2=0. Counts decreased, no fixed finding reopened, and no fourth round was
reached. D-03 supplies no pause trigger for this audited slice.

## Judgment handoff

E-02-01 remains one unclassified/unresolved taxonomy assumption. P-02-01 safety
and P-02-02 truthful completion remain descriptorless, flagged-unverified
judgment items. Phase 1 approval does not approve Phase 2 scope. Complete batch
and phase judgments remain pending with the parent coordinator.

## Threat Flags

None -- no security-relevant surface outside the plan's <threat_model> was introduced.
