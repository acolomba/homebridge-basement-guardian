# Requirements: Basement Guardian -- code-review-sweep

**Defined:** 2026-10-13
**Core Value:** HomeKit must promptly show trustworthy basement-protection conditions while clearly marking stale or invalid telemetry instead of reporting a false normal state.

Rulebooks: `skills/typescript-google-style-review`, `skills/typescript-comments`,
`skills/typescript-unit-testing`, `skills/typescript-unit-testing-review`,
`skills/cucumber-behavioral-testing`, `features/CLAUDE.md`, and
`skills/local-verification`. Seed findings: `.planning/research/SPOT-CHECK-FINDINGS.md`.

## Milestone Requirements

### Process

- [x] **PROC-01**: Each phase writes a findings ledger. Every finding records its rule, location, severity, and outcome (fixed, or rejected with a stated reason).
- [x] **PROC-02**: Each phase converges. The last re-review reports no open finding within about four rounds, or the phase stops and reports why.
- [x] **PROC-03**: One file-header form (SPDX line, then copyright and `@fileoverview` JSDoc) is decided once and applied to every file, and the license-header gate still passes.

### Known findings

- [x] **SPOT-01**: The auth cache test plants a real stranded temporary file through an injected temporary-name source (SC-01, SC-04).
- [x] **SPOT-02**: The control refusal-log test asserts the exact line for each refusal row, one `test()` per row (SC-02).
- [x] **SPOT-03**: The device-state frozen checks fail when the snapshot is missing, and the stale-version cases assert the stored state (SC-03).
- [x] **SPOT-04**: An aborted first caller cannot cancel a second caller that joined the same token grant, or the behavior is documented and tested (SC-05).

### Conformance

Each covers the source modules and their paired tests against the style, comment, and unit-testing rules.

- [x] **CLOUD-01**: `src/cloud/**` and `test/cloud/**` conform.
- [x] **DEV-01**: `src/device/**`, `src/persistence/**`, and their tests conform.
- [x] **RUN-01**: `src/runtime/**` and `test/runtime/**` conform.
- [x] **ACC-01**: `src/accessories/**` and `test/accessories/**` conform.
- [x] **ROOT-01**: The root modules `src/*.ts` and their tests conform.
- [x] **FEAT-01**: `features/**/*.feature` follow the Gherkin rules in `features/CLAUDE.md` and `skills/cucumber-behavioral-testing`.
- [x] **FEAT-02**: `features/**` step definitions and support code follow `skills/cucumber-behavioral-testing`, `features/CLAUDE.md`, and the TypeScript rules.

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
| PROC-01 | Phase 1 | Complete |
| PROC-02 | Phase 1 | Complete |
| PROC-03 | Phase 1 | Complete |
| SPOT-01 | Phase 1 | Complete |
| SPOT-02 | Phase 1 | Complete |
| SPOT-03 | Phase 1 | Complete |
| SPOT-04 | Phase 1 | Complete |
| CLOUD-01 | Phase 2 | Complete |
| DEV-01 | Phase 3 | Complete |
| RUN-01 | Phase 4 | Complete |
| ACC-01 | Phase 5 | Complete |
| ROOT-01 | Phase 6 | Complete |
| FEAT-01 | Phase 7 | Complete |
| FEAT-02 | Phase 7 | Complete |
| BUG-01 | Phase 8 | Pending |
| GATE-01 | Phase 8 | Pending |
| GATE-02 | Phase 8 | Pending |

PROC-01, PROC-02, and BUG-01 apply to every phase. Each maps to one phase for
traceability: PROC-01 and PROC-02 to Phase 1, where the ledger format and the loop
are set up, and BUG-01 to Phase 8, where the milestone bug ledger is audited.
Phases 2 to 7 state in their success criteria that they apply all three. PROC-03
is decided in Phase 1. Phases 2 to 7 apply the header form to their own files,
and the Phase 8 re-review confirms that every file carries it.

**Coverage:**
- Milestone requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0

---
*Requirements defined: 2026-10-13*
*Last updated: 2026-10-13 after roadmap creation*
