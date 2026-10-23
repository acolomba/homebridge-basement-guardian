# Phase 1: Known Findings and Loop Proof - Context

**Gathered:** 2026-10-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix SC-01 through SC-05 and prove the review loop, findings ledger, and file-header form for later phases. This phase covers `src/cloud/auth.ts` with `test/cloud/auth.test.ts`, `test/accessories/controls.test.ts`, and `test/device/state.test.ts`. Re-verify the seed WARNING findings in the owning later phases. Fix findings introduced by these changes here.

</domain>

<decisions>
## Implementation Decisions

### File headers

- **D-01:** Keep the SPDX comment on the first line. Follow it with separate copyright and `@fileoverview` JSDoc blocks. Separate each section and imports with one blank line.
- **D-02:** Use `Copyright (c) 2026 Alessandro Colomba` for original work. Preserve existing Apache license classification and template attribution.
- **D-03:** Keep overviews brief: usually one purpose sentence, with essential dependency or safety context where needed. Apply the header to every file touched by this phase.

### Shared authentication cancellation

- **D-04:** Cancel only the caller whose signal aborts. Other callers continue waiting for the same grant.
- **D-05:** Cancel the shared request when no callers remain. Preserve prompt shutdown and the existing request timeout. Do not create duplicate concurrent grants or automatic retries.
- **D-06:** Prove the joined-caller defect with an active regression test observed failing against unchanged production source. Before the fix, commit a planning-only evidence record containing the complete regression patch, failing command/output, and source commit. Then commit the active test and production fix together after GREEN and passing hooks. The maintainer approved this exception to the roadmap's literal active-test-first commit requirement on 2026-10-13. Test cancellation when all callers leave as well. Apply this evidence-first policy to bugs found during this sweep; never bypass hooks or hide active tests from discovery.

### Review records and stopping

- **D-07:** Write one findings ledger per phase. Give findings stable IDs and record rule, location, severity, outcome, and test/commit evidence. Keep seed IDs SC-01 through SC-05.
- **D-08:** Include a per-round progress summary. Phase 8 assembles the milestone bug ledger from the phase records.
- **D-09:** Pause for the maintainer's decision when a round makes no progress, a fixed finding returns, or the four-round cap is reached. Report unresolved findings and evidence, and offer retry, skip, or stop. Do not continue independent batches past this pause.

### Implementation discretion

Select the smallest implementation that satisfies the decisions and existing interfaces. The roadmap already fixes disjoint batches, atomic commits, regression-first bug fixes, and direct coverage requirements.

</decisions>

<canonical_refs>
## Canonical References

Downstream agents must read these before planning or implementing.

- `AGENTS.md` — repository, TypeScript, Git, and verification rules.
- `.planning/PROJECT.md` — current milestone scope and locked product behavior.
- `.planning/REQUIREMENTS.md` — SPOT-01 through SPOT-04 and PROC-01 through PROC-03.
- `.planning/ROADMAP.md` — Phase 1 success criteria and batching.
- `.planning/research/SPOT-CHECK-FINDINGS.md` — seed findings and WARNING deferrals.
- `.planning/STATE.md` — commit-handler hazard and release-only gates.
- `.planning/.continue-here.md` — handoff constraints; all eight current milestone phases start unimplemented.
- `.claude/commands/babysit-pr.md` — bounded review-loop reference only; no PR/Sonar run in this phase.
- `skills/typescript-google-style-review/SKILL.md` — source/test style and file order.
- `skills/typescript-comments/SKILL.md` — comment policy.
- `skills/typescript-unit-testing/SKILL.md` — regression-test implementation.
- `skills/typescript-unit-testing-review/SKILL.md` — source/test pair review.
- `skills/local-verification/SKILL.md` — incremental checks and combined-tree gates.
- `test/packaging/licenseHeaders.test.ts`, `LICENSE`, `NOTICE` — existing license classification and gate.

External references consulted: https://google.github.io/styleguide/tsguide.html#source-file-structure and https://nodejs.org/download/release/v22.15.0/docs/api/globals.html#class-abortsignal . Follow installed Node definitions and supported runtime versions when implementing.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `AuthClientOptions` injects fetch, clock, salt, and logging; extend this seam for temporary names.
- `sharedGrant()` coalesces the full grant and cache-write attempt.
- Existing auth tests cover concurrent grants and shutdown; extend them with controlled deferred requests.

### Established Patterns

- TypeScript ESM imports use `.js` extensions.
- Tests use `node:test`, explicit arrange/act/assert markers, and injected dependencies.
- The license gate expects source SPDX identifiers; retain MIT/Apache classification.

### Integration Points

- `createAuthClient().idToken(signal)` is the per-caller cancellation boundary.
- The account runtime supplies a shared root signal for shutdown, which must still stop all work promptly.
- Use plain `git commit` after required pre-commit checks; verify actual committed paths. The GSD commit helper has produced empty commits here.
- GSD manager discovery resolves archived v1.0 phases with the same numbers. Determine current progress from the live phase directory and current roadmap, never archived verification.

</code_context>

<specifics>
## Specific Ideas

```ts
// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Manages authentication and the token cache.
 */
```

</specifics>

<deferred>
## Deferred Ideas

Seed WARNING findings remain assigned to Phases 2, 3, and 5. Hardware gates and live real-pump runs remain outside this milestone's scope.

</deferred>
