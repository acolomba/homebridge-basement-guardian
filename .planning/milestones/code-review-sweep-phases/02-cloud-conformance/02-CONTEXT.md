# Phase 2: Cloud Conformance - Context

**Gathered:** 2026-10-13
**Status:** Ready for planning
**Mode:** Interactive carry-forward; no new meaningful gray area after applying prior decisions and the rulebooks.

<domain>
## Phase Boundary

Review all eight modules under `src/cloud/**`, their eight paired tests, and `test/cloud/alpnServer.ts`. Fix every confirmed style, comment, or testing finding and every discovered bug within this scope. Preserve locked product behavior. Re-verify every cloud WARNING from the seed review and give each an evidence-backed disposition.

</domain>

<decisions>
## Implementation Decisions

### Carry-forward decisions

- **D-01:** Apply the Phase 1 header form to every cloud source/test/helper file: SPDX first, separate copyright and overview JSDoc blocks, one blank line between sections. Original-work copyright is `Copyright (c) 2026 Alessandro Colomba`. Use a brief purpose and essential context; retain license classification and attribution.
- **D-02:** Use the Phase 1 ledger and review protocol. Each finding has a stable ID, rule, location, severity, disposition, and evidence. Reviewers and fixers use the project skills; fixes use atomic passing-hook commits.
- **D-03:** Pause all work for the maintainer if a review round with open findings makes no progress, a fixed finding returns, or round four is reached. Preserve accurate counts and unresolved items. Rejected findings require a reason; a pause or skip is not a fix.
- **D-04:** For each genuine bug, observe an active regression fail against unchanged production. Commit a planning-only record with the complete patch, actual failure command/output, and source commit before the active test and GREEN fix commit. This maintainer-approved sweep policy preserves all hooks. Record negative-control mutations separately and restore them exactly.
- **D-05:** Preserve independent auth caller cancellation, shared request cancellation only after all callers leave, slot ownership through settlement, and no duplicate concurrent grants or automatic retries. Phase 1's verified behavior is the baseline for this sweep.
- **D-06:** Fix confirmed conformance findings at their cause with minimum code. Do not create product features, speculative abstractions, new API integrations, or protocol assumptions. Existing privacy and unknown/stale telemetry rules remain locked.
- **D-07:** Keep each modified source/test pair at 100% direct line/function/branch coverage. Run the full combined-tree gate after waves and at phase end; reuse evidence only for unchanged inputs under local-verification. Do not use live vendor services or real hardware.

### Implementation discretion

Use the rulebooks and caller evidence to select routine fixes and batch boundaries. Re-verify the auth length-only/negative assertions, optional fields, global-fetch default, and test-only filename export. Reject a warning only with source/rule evidence. Trace exact consumers before changing exports or signatures; an export being used in tests alone is not a substitute for checking its intended contract.

No unresolved design preference was identified after scouting the cloud modules. The maintainer selected continuation to Phase 2; discussion does not re-ask settled milestone scope or Phase 1 policy.

</decisions>

<canonical_refs>
## Canonical References

- `AGENTS.md` — repository, Git, TypeScript, and build rules.
- `.planning/PROJECT.md` — sweep scope and locked product behavior.
- `.planning/REQUIREMENTS.md` — CLOUD-01 and cross-phase process/bug obligations.
- `.planning/ROADMAP.md` — Phase 2 success criteria and disjoint batches.
- `.planning/research/SPOT-CHECK-FINDINGS.md` — cloud warnings to re-verify.
- `.planning/phases/01-known-findings-and-loop-proof/01-CONTEXT.md` — approved header, cancellation, ledger, and evidence-first policies.
- `.planning/phases/01-known-findings-and-loop-proof/01-REVIEW-PROTOCOL.md` — reusable review/critical-section/RED record contract.
- `.planning/phases/01-known-findings-and-loop-proof/01-FINDINGS.md` — proven ledger form.
- `.planning/phases/01-known-findings-and-loop-proof/01-VERIFICATION.md` — accepted bounded Phase 1 result; do not infer taxonomy completeness.
- `skills/typescript-google-style-review/SKILL.md` — style rules.
- `skills/typescript-comments/SKILL.md` — comment rules.
- `skills/typescript-unit-testing/SKILL.md` — test implementation.
- `skills/typescript-unit-testing-review/SKILL.md` — pair review.
- `skills/local-verification/SKILL.md` — checks and evidence reuse.
- `.agents/skills/fallow/SKILL.md` and `node_modules/fallow/skills/fallow/SKILL.md` — analysis and exact consumer probes.
- `LICENSE`, `NOTICE`, `test/packaging/licenseHeaders.test.ts` — licensing gate.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- Every cloud module has a mirrored test. `test/cloud/alpnServer.ts` supplies local transport proof.
- `AuthClientOptions` has injected fetch/clock/salt and the optional complete temporary-path producer; Phase 1's waiter and collision tests are verified.
- `src/cloud/httpDispatcher.ts` pairs userland undici fetch with its own agent and forces HTTP/1.1; preserve that transport contract.
- `src/cloud/shadow.ts` owns shadow topic routing, operation deadlines, and credential/connection state.
- `src/cloud/types.ts` narrows vendor wire records; family validation remains elsewhere.

### Established Patterns

- `.js` ESM imports, dependency injection, strict Node assertions, and per-pair coverage.
- No default normal values for omitted/invalid telemetry and no secrets/raw vendor content in logs or records.
- Tests run offline with synthetic fixtures and local loopback listeners.

### Integration Points

- Cloud changes can affect account runtime and accessory callers; trace them before editing.
- The existing feature worktree and branch contain Phase 1. Do not fork from an obsolete remote default or lose those fixes.
- Shared build output, mutations, and Git operations require sequential critical sections. Independent read-only reviews can be parallel.
- GSD manager can resolve same-numbered archived v1.0 phases; only live current-milestone artifacts establish progress. Legacy deferred hardware rows do not skip this cloud sweep.
- Git commits use plain foreground `git commit` and actual hash/path checks. GSD subject-pattern TDD checks cannot discover domain-scoped commits; accepted evidence-first provenance remains authoritative.

</code_context>

<specifics>
## Specific Ideas

Copy the proven Phase 1 process and inspect all cloud files, including already-touched auth files, against the complete rulebooks. Avoid reopening fixed seeds unless evidence shows a regression.

</specifics>

<deferred>
## Deferred Ideas

Device/runtime/accessory/root/Cucumber sweeps remain in their own phases. Hardware gates, live vendor runs, and unrelated repository gate-test review remain outside this phase.

</deferred>
