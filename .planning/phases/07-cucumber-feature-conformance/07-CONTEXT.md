# Phase 7: Cucumber Feature Conformance - Context

**Gathered:** 2026-10-19
**Status:** Ready for planning
**Mode:** Interactive carry-forward; no new product decision was needed.

<domain>
## Phase Boundary

Review every current Gherkin and TypeScript file under `features/**` for the
project's behavioral-test, TypeScript, and header rules. Repair confirmed
findings and protect genuine behavior bugs with regression evidence. The three
real-pump features receive static review and a Cucumber dry run only. Phase 7
does not run vendor hardware or expand into the Phase 8 whole-repository gate.

</domain>

<decisions>
## Implementation Decisions

### Scope and rulebook

- **D-01:** Review the actual complete `features/**` inventory: fifteen
  `.feature` files and twenty-two TypeScript files at phase start, including
  `features/lib/hap.ts`. The roadmap's count of twenty-one TypeScript files and
  its `features/support/steps/harness.ts` example are stale; file existence and
  the phase goal determine the inventory.
- **D-02:** `.agents/skills/cucumber/SKILL.md` and its four rule files are the
  current behavioral-testing rulebook. The former `features/CLAUDE.md` and
  `skills/cucumber-behavioral-testing` references in milestone prose refer to
  rules that were migrated into that skill; do not recreate obsolete files.
  `.agents/skills/typescript-style/SKILL.md` governs TypeScript style.
- **D-03:** Keep the default profile's scenario count at its measured phase-start
  baseline unless the ledger explains every count change. Compile first. Run
  the real profile only with `--dry-run`; never execute its steps or contact
  vendor services, hardware, or a real account.

### Review and repair policy

- **D-04:** Apply the approved Phase 1 header form to reviewed TypeScript
  files: SPDX, separate copyright and `@fileoverview` blocks, with the
  established spacing and attribution. Record stable finding IDs, exact rule,
  revision-qualified location, severity, disposition, and test/commit evidence
  in the phase ledger. Review complete files, not only changed lines.
- **D-05:** Each batch uses review, triage, cause repair, and independent
  re-review. Stop all batch work if an open count does not fall, a fixed finding
  reopens, or correction round four is reached, even if clean. Report open IDs
  accurately at STOP. Phase 5's exceptional round extensions do not carry
  forward.
- **D-06:** For a genuine behavior bug, observe the active intended regression
  fail against unchanged production and commit planning-only RED evidence
  before the minimum GREEN code/test fix. Keep source bytes and Git history
  intact; do not bypass hooks. Trace callers before changing shared helpers.
- **D-07:** Preserve product safety, identity, telemetry trust, privacy, and
  Homebridge contracts. Use offline stand-ins. Every modified source/test pair
  retains 100% isolated direct coverage; run the full `npm run check` at wave
  and phase gates. Do not recreate the two tests that the maintainer explicitly
  deleted in Phase 6.

### The agent's Discretion

- Divide Gherkin and TypeScript review into disjoint batches and sequential
  waves for shared world or harness ownership. Choose the smallest repairs
  that satisfy confirmed findings and the existing contracts.
- Apply the current Cucumber skill's layout conventions to the real-pump
  support modules without running their live steps.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and carry-forward decisions
- `.planning/ROADMAP.md` §Phase 7 — goal, success criteria, batching, and cap.
- `.planning/REQUIREMENTS.md` — FEAT-01, FEAT-02, PROC-01, PROC-02, BUG-01.
- `.planning/PROJECT.md` — product safety and offline real-pump boundary.
- `.planning/phases/04-runtime-conformance/04-CONTEXT.md` — D-01 through D-07 review and repair policy.
- `.planning/phases/05-accessories-conformance/05-CONTEXT.md` — D-12 defers the shared HAP fake to this phase.
- `.planning/phases/06-root-module-conformance/06-CONTEXT.md` — deleted-test boundary and latest four-round policy.
- `AGENTS.md` — repository and Git constraints.

### Current rulebooks and configuration
- `.agents/skills/cucumber/SKILL.md` — review severity and required checks.
- `.agents/skills/cucumber/rules/layout.md` — file families and registration boundaries.
- `.agents/skills/cucumber/rules/features.md` — Gherkin wording and scenario rules.
- `.agents/skills/cucumber/rules/steps.md` — step module rules.
- `.agents/skills/cucumber/rules/world-and-stand-ins.md` — world and offline stand-ins.
- `.agents/skills/typescript-style/SKILL.md` — TypeScript style and header rules.
- `.agents/skills/typescript-unit-tests/SKILL.md` — regression-test rules if a production pair changes.
- `.agents/skills/local-verification/SKILL.md` — check schedule.
- `.agents/skills/committing/SKILL.md` — commit protocol.
- `cucumber.json` — installed default and real profile import/tag boundaries.
- `package.json` — pinned Cucumber 13.2.1 range and check scripts.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `features/support/world.ts` owns per-scenario state and cleanup.
- `features/lib/*` supplies local stand-ins, including the shared HAP fake.
- `features/step_definitions/*.steps.ts` contains the default profile's step modules.

### Established Patterns
- `cucumber.json` imports compiled default support and step modules, excludes
  `@real` from the default profile, and isolates the real profile behind
  `@real and @read-only`.
- The installed `@cucumber/cucumber` version is 13.2.1; compare current
  official documentation with its installed CLI and types before relying on
  changed behavior.
- The three real-pump features are intentionally observation-only and may
  contain long waits. A dry run resolves steps without invoking them.

### Integration Points
- `features/support/world.ts` and `features/step_definitions/harness.steps.ts`
  serve many scenarios, so edits to either need a dedicated wave.
- `features/lib/hap.ts` is used by Cucumber and tests; inspect its consumers
  before changing its public shape.

</code_context>

<specifics>
## Specific Ideas

The maintainer asked for Phase 7 autonomous execution in interactive mode.
Earlier phase decisions settle scope, safety, evidence, and correction limits;
no unresolved product preference was identified in this discussion pass.

</specifics>

<deferred>
## Deferred Ideas

- The real Homebridge degraded-status check remains unverified because the
  maintainer could not run it during Phase 6. It is a later release gate, not
  evidence that Phase 7 Cucumber conformance passed.

</deferred>

---

*Phase: 07-cucumber-feature-conformance*
*Context gathered: 2026-10-19*
