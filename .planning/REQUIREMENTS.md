# Requirements: Basement Guardian -- code-review-sweep

**Defined:** 2026-10-13
**Core Value:** HomeKit must promptly show trustworthy basement-protection conditions while clearly marking stale or invalid telemetry instead of reporting a false normal state.

Rulebooks: `skills/typescript-google-style-review`, `skills/typescript-comments`,
`skills/typescript-unit-testing`, `skills/typescript-unit-testing-review`,
`skills/cucumber-behavioral-testing`, `features/CLAUDE.md`, and
`skills/local-verification`. Seed findings: `.planning/research/SPOT-CHECK-FINDINGS.md`.

## Milestone Requirements

### Process

- [ ] **PROC-01**: Each phase writes a findings ledger. Every finding records its rule, location, severity, and outcome (fixed, or rejected with a stated reason).
- [ ] **PROC-02**: Each phase converges. The last re-review reports no open finding within about four rounds, or the phase stops and reports why.
- [ ] **PROC-03**: One file-header form (SPDX line, then copyright and `@fileoverview` JSDoc) is decided once and applied to every file, and the license-header gate still passes.

### Known findings

- [ ] **SPOT-01**: The auth cache test plants a real stranded temporary file through an injected temporary-name source (SC-01, SC-04).
- [ ] **SPOT-02**: The control refusal-log test asserts the exact line for each refusal row, one `test()` per row (SC-02).
- [ ] **SPOT-03**: The device-state frozen checks fail when the snapshot is missing, and the stale-version cases assert the stored state (SC-03).
- [ ] **SPOT-04**: An aborted first caller cannot cancel a second caller that joined the same token grant, or the behavior is documented and tested (SC-05).

### Conformance

Each covers the source modules and their paired tests against the style, comment, and unit-testing rules.

- [ ] **CLOUD-01**: `src/cloud/**` and `test/cloud/**` conform.
- [ ] **DEV-01**: `src/device/**`, `src/persistence/**`, and their tests conform.
- [ ] **RUN-01**: `src/runtime/**` and `test/runtime/**` conform.
- [ ] **ACC-01**: `src/accessories/**` and `test/accessories/**` conform.
- [ ] **ROOT-01**: The root modules `src/*.ts` and their tests conform.
- [ ] **FEAT-01**: `features/**/*.feature` follow the Gherkin rules in `features/CLAUDE.md` and `skills/cucumber-behavioral-testing`.
- [ ] **FEAT-02**: `features/**` step definitions and support code follow `skills/cucumber-behavioral-testing`, `features/CLAUDE.md`, and the TypeScript rules.

### Bugs and gates

- [ ] **BUG-01**: Each bug found gets a failing regression test before its fix and is listed in the phase ledger.
- [ ] **GATE-01**: Every source/test pair keeps 100% direct coverage, and the full `npm run check` passes at milestone end.
- [ ] **GATE-02**: A final full-repo re-review finds no open findings.

## Future Requirements

- Review of repo-level gate tests (`test/packaging/**`, `test/architecture/**`, `test/documentation.test.ts`, `test/repositoryGovernance.test.ts`, `test/packedArtifact.test.ts`, `test/realPumpCommandBlock.test.ts`) against the unit-testing rules.

## Out of Scope

| Item | Reason |
|------|--------|
| Behavior changes beyond bug fixes | The sweep is conformance work; product behavior is locked by v1.0 decisions. |
| Repo-level gate tests | Not selected for this milestone, except where a fix must touch them. |
| Live `features/real-pump` runs | Needs vendor hardware and credentials; those files get static review only. |
| Hardware gates G-001 to G-004 | Tracked separately; they block `1.0.0`, not this milestone. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|

**Coverage:**
- Milestone requirements: 15 total
- Mapped to phases: 0
- Unmapped: 15

---
*Requirements defined: 2026-10-13*
*Last updated: 2026-10-13 after initial definition*
