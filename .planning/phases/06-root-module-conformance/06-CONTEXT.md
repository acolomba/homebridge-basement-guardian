# Phase 6: Root Module Conformance - Context

**Gathered:** 2026-10-19
**Status:** Replanned; ENTRY closure pending human workflow verification
**Mode:** Interactive carry-forward with explicit test-inventory and ENTRY stop-recovery decisions.

<domain>
## Phase Boundary

Review the six root source modules and their six mirrored tests against the
project's TypeScript style, comment, and unit-test rules. Record each confirmed
finding and fix each genuine bug behind a regression test. Keep the full
`test/platform.test.ts` in review. This phase does not sweep unrelated
repository-level tests or the accessory, runtime, device, or Cucumber trees.

</domain>

<decisions>
## Implementation Decisions

### Test inventory

- **D-01:** The maintainer explicitly requested deletion of
  `test/configSchema.test.ts` and `test/packageManifest.test.ts`. Commit
  `9605a63` removed both, together with their unpaired-test declarations.
  They are absent from Phase 6 review and must not be recreated as part of
  planning or execution.
- **D-02:** The six mirrored pairs are `platform`, `config`, `logging`,
  `index`, `settings`, and `protocol`. Other repo-level gates are only
  bounded consumers when a confirmed root finding requires a change; a
  bounded edit does not count as a full review of that gate.

### Carried-forward review policy

- **D-03:** Use the approved SPDX/copyright/overview header form on each
  reviewed file. Record stable finding IDs, exact rules, revision-qualified
  locations, severity, disposition, and actual test/commit evidence in a
  phase ledger. Review complete files, including the full platform owner.
- **D-04:** Stop a batch when an independent correction round with open
  findings makes no progress, a fixed finding reopens, or the Phase 6
  four-round cap is reached. Phase 5's GATES cap extension does not carry
  forward. Report open findings accurately at a stop.
- **D-05:** For a genuine behavior bug, observe the active regression fail
  against unchanged production and commit planning-only RED evidence before
  the minimum GREEN fix. Keep source bytes and Git history intact; do not
  bypass hooks. Fix at the cause with minimum code and trace callers before
  changing shared contracts.
- **D-06:** Preserve the project's identity, telemetry trust, privacy,
  command, persistence, and Homebridge compatibility constraints. Every
  modified pair keeps 100% direct line, function, and branch coverage when
  run alone. Run the full repository check at phase gates; use offline local
  stand-ins for external systems.
- **D-07:** After the round-four STOP with CR-06-ENTRY-019 and
  CR-06-ENTRY-020 open, the maintainer chose “Yes, debug and replan
  (Recommended).” The focused GSD debug recorded active RED and
  revert/reconfirm evidence, then committed logger repairs `24f3620` and
  `2d291cc`. This authorizes one bounded post-debug ENTRY validation and
  closure review of all six files, separate from the capped correction-round
  counter. Preserve round four, its counts, IDs, and STOP. Do not create a
  fifth correction round or an automatic repair/re-review loop. Any remaining
  or new accepted finding stops with exact IDs and needs a new decision.
  Clean closure also requires explicit maintainer confirmation that the
  original Homebridge logging workflow exposes no credential content; silence
  is not confirmation. The debug workflow's RED record is distinct from a
  Phase 6 planning-only RED evidence commit and must be described accurately.

### The agent's Discretion

- Group the five smaller pairs into one or two nonoverlapping batches.
- Choose the order of review and narrow consumer fixes within the roadmap's
  wave and commit rules.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/ROADMAP.md` §Phase 6 — scope, success criteria, batching, and stop rule.
- `.planning/REQUIREMENTS.md` — ROOT-01, PROC-01, PROC-02, and BUG-01.
- `AGENTS.md` — repository, Git, GSD, and verification constraints.
- `.planning/phases/04-runtime-conformance/04-CONTEXT.md` — D-01 through D-07 carry-forward review policy.
- `.planning/phases/05-accessories-conformance/05-CONTEXT.md` — accessory boundary and historical cap exception.
- `.planning/phases/05-accessories-conformance/05-VERIFICATION.md` and `.planning/phases/05-accessories-conformance/05-UAT.md` — accepted Phase 5 boundary and historical STOP; refresh the verification fingerprint after the test removal.
- `.agents/skills/typescript-style/SKILL.md` and `.agents/skills/typescript-unit-tests/SKILL.md` — authoritative style and test rules.
- `.agents/skills/local-verification/SKILL.md` and `.agents/skills/committing/SKILL.md` — check and commit gates.
- `.agents/skills/cucumber/SKILL.md` — applies if a bounded change touches `features/**`.
- `.planning/debug/logging-redaction-leaks.md` — focused debug record and
  pending real Homebridge verification for ENTRY-019/020.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- The six mirrored Node test modules already exist under `test/`.
- `scripts/check-corresponding-tests.mjs` and `scripts/test-coverage-direct.mjs` enforce pairing and isolated coverage.

### Established Patterns

- Source and test pair ownership is one-to-one, including type-only modules and the root barrel.
- Native `node:test` cases use local stand-ins for Homebridge and vendor boundaries.

### Integration Points

- `src/platform.ts` composes the accessory and runtime layers and owns the largest root test module.
- Changes to shared types or configuration can affect earlier reviewed modules; trace consumers before editing.

</code_context>

<specifics>
## Specific Ideas

The maintainer said, "no, remove both tests." The tests were deleted before
the Phase 6 discussion record was written.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>

---

*Phase: 6-root-module-conformance*
*Context gathered: 2026-10-19*
