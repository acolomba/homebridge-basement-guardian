---
phase: 01-known-findings-and-loop-proof
reviewed: 2026-10-13T20:37:48Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/cloud/auth.ts
  - test/cloud/auth.test.ts
  - test/accessories/controls.test.ts
  - test/device/state.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 1: Code Review Report

**Reviewed:** 2026-10-13T20:37:48Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** clean

## Summary

Reviewed the complete four-file scope at `4a4ffd1` against `109fda7`, including
the SC-01 through SC-05 repairs and defects potentially introduced by them.
No actionable BLOCKER or WARNING remains within that scope. Original seed
WARNINGs retain their assigned Phase 2, 3, and 5 reviews; this result does not
close those deferred items.

Read `src/accessories/controls.ts` and `src/device/state.ts` as owner references.
Traced auth through the REST caller's individual deadlines, runtime composition
and root shutdown, and the HTTP transport. Reviewed the live context, research,
review protocol, batch reports, summaries, findings, security, validation, and
committed RED evidence. Applied the configured TypeScript style, comment,
unit-test review, and local-verification rules.

## Structural Findings (fallow)

The supplied Fallow 3.27.0 audit at `4a4ffd1` reports zero dead-code issues,
cycles, duplication groups, complexity findings, or introduced findings.
The separate orientation report uses the correct phase baseline `109fda7`.

Orientation flags the auth contract's consumers and two added rejection-rule
suppressions. The option is optional, existing composition remains compatible,
and the suppressions preserve caller-owned abort reasons. These attention
signals are not substantiated defects. Boundary and policy counts do not
establish coverage: neither detector has configured rules. The audit against
`main` is broader than this phase's four-file scope.

## Narrative Findings (AI reviewer)

No in-scope findings.

The cancellation analysis covered first and joined callers, pre-aborted input,
shared cache reads, grant/cache settlement, zero-waiter cancellation, delayed
transport teardown, deadlines, and root shutdown. Per-caller waits reject
promptly and release once; the shared slot remains occupied until settlement.
Underlying fulfillment and rejection retain observers after cancellation.

The occupied-path case selects the actual injected path and compares complete
file bytes, permissions, directory contents, diagnostics, concurrent caller
results, and subsequent in-memory reuse. The eight refusal cases use fresh
fixtures and independent exact warning literals. Frozen checks first assert
complete expected values; stale-version cases separately inspect canonical
storage. All four touched headers match the locked form. Recorded negative
controls target those assertions and retain restoration evidence.

## Verification Evidence

Reused the coordinator's same-session `npm run check` at `218ab0c`, Node
v26.11.1, exit 0: static checks, 104 Cucumber scenarios, 1156 steps, and all
43 isolated pairs. The retained full-check log confirms those counts. A fresh
diff from that revision contains no change outside planning artifacts; no
source, test, dependency, configuration, or tool input changed. No passing
test was rerun merely for reassurance. Final owner evidence is auth 61/61,
controls 63/63, and state 54/54, with each pair at 100% direct line, function,
and branch coverage.

Independently inspected Git objects and ancestry: unchanged auth source at
`109fda7` precedes planning-only evidence `919d70d`, which precedes the active
regression and fix at `3878103`. Original evidence fields still match the
committed record. The RED classifier rerun returned `RED_EVIDENCE_OK` for the
intended joined-caller assertion: 51 passed, one failed, zero cancelled. The
live D-06 decision explicitly authorizes this evidence-first sequence;
phase-number subject heuristics do not invalidate these reachable commits.

E-07, E-08, P-01, and P-02 remain explicit phase-verifier judgment items.
This code review does not supply taxonomy completeness, hardware, live-vendor,
or release approval. No source file, Git index, or shared planning state was
changed by this review.

---

_Reviewed: 2026-10-13T20:37:48Z_
_Reviewer: gsd-code-reviewer (`phase1_final_review`)_
_Depth: standard_
