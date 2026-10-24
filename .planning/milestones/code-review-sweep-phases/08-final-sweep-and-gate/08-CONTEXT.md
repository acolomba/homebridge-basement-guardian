# Phase 8: Final Sweep and Gate - Context

**Gathered:** 2026-10-22
**Status:** Ready for planning
**Mode:** Autonomous carry-forward; earlier decisions settle the review policy.

<domain>
## Phase Boundary

Review the complete current `src/**`, paired `test/**`, and `features/**` tree as
one milestone. Audit every phase findings ledger and assemble the milestone bug
ledger. Run the full repository gate on the final combined tree. This phase
does not add product behavior or extend the scope to repository-level gate tests
that the requirements exclude. Real-pump scenarios receive static review and
dry-run evidence only; no live vendor or hardware run is authorized here.

</domain>

<decisions>
## Implementation Decisions

### Scope and rulebooks

- Use the live file inventory and the current `.agents/skills` rulebooks. The
  older `skills/*` and `features/CLAUDE.md` names in milestone prose refer to
  rules migrated into the current skills; do not recreate obsolete files.
- Apply the Phase 1 header form: SPDX first, then separate copyright and brief
  `@fileoverview` JSDoc blocks. Preserve existing license attribution.
- Keep `test/configSchema.test.ts` and `test/packageManifest.test.ts` deleted,
  as the maintainer requested in Phase 6.

### Review, repair, and evidence

- Review complete current files across subsystem boundaries, not only diffs.
  Divide the inventory into disjoint batches. Record stable IDs, exact rule,
  revision-qualified location, severity, disposition, and test/commit evidence.
- Fix confirmed findings at their cause. Stop the whole review when an open
  correction round makes no progress, a fixed finding returns, or round four
  is reached. Preserve historical STOP records and report any forward-open
  findings without silently waiving them.
- For a genuine behavior bug, observe an active regression failure against
  unchanged production and commit planning-only RED evidence before the
  minimum GREEN source/test fix. Use normal hooks and atomic commits.
- Audit the actual phase ledgers and Git ancestry for every bug. Do not infer
  a regression, fix commit, rejection reason, or closure from a passing check.

### Verification and closeout

- Preserve safety, identity, telemetry trust, privacy, persistence, and
  Homebridge contracts. Modified source/test pairs retain 100% isolated direct
  line, function, and branch coverage. Run the full `npm run check` on the final
  combined tree.
- Earlier Phase 1–6 verification reports currently read stale because later
  phases changed covered files. Reconcile their verification status before
  declaring the milestone complete; a prior pass is not a current pass.
- Keep the 18 open and 19 waived cross-milestone windows visible for audit.
  An open window is not automatically a current code finding, nor is it
  automatically closed by Phase 8's gate.

### The agent's Discretion

Choose disjoint review batches and the smallest verified repairs. Schedule
shared files serially and use the project's offline stand-ins. Use in-session
reviewers where independent review is required.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- Phase 1–7 findings, review, validation, and verification records provide the
  prior inventory and outcomes.
- `scripts/check-corresponding-tests.mjs` and
  `scripts/test-coverage-direct.mjs` enforce pairing and isolated coverage.
- The existing `features/lib` and support modules provide offline stand-ins.

### Established Patterns

- Source/test pairs use TypeScript ESM with `.js` relative imports and
  `node:test`; Cucumber uses separate default and read-only real profiles.
- Normal pre-commit hooks run incremental checks. The full `npm run check`
  remains the combined-tree phase and milestone gate.

### Integration Points

- `src/platform.ts` composes the runtime, cloud, device, and accessory layers.
- `features/support/world.ts` and shared fake modules serve many scenarios,
  so edits to them require separate review waves.
- GSD currently reports Phase 1–6 verification stale; Phase 7 is passed and
  Phase 8 has no plans yet.

</code_context>

<specifics>
## Specific Ideas

The maintainer requested `$gsd-autonomous --from 8`. Prior phase decisions
resolve review scope and process; no new product preference was identified.

</specifics>

<deferred>
## Deferred Ideas

Real Homebridge confirmation of the monitoring trust publication repair and
hardware gates remain outside this milestone. They must not be counted as
Phase 8's static or offline test evidence.

</deferred>
