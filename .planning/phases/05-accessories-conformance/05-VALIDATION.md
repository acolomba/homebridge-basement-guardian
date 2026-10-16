---
phase: "05"
slug: "accessories-conformance"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-16"
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `05-RESEARCH.md` §Validation Architecture before planning. Task
> IDs are filled in from the plans; until then rows are keyed by batch.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Native `node:test` + `node:assert/strict`, strict TypeScript ESM compiled to `dist-test/`; Cucumber inside the full gate |
| **Config file** | `tsconfig.test.json`; `scripts/test-coverage-direct.mjs`; `scripts/check-corresponding-tests.mjs` |
| **Quick run command** | `npm run build:test && node --test dist-test/test/accessories/<name>.test.js` |
| **Pair coverage command** | `npm run test:coverage:direct -- src/accessories/<name>.ts test/accessories/<name>.test.ts` (silent on success; record the raw exit) |
| **Gate command** | `npm run test:unpaired` (the four gates are unpaired by design: `scripts/test-coverage-direct.mjs:17-21`) |
| **Full suite command** | `npm run check` |
| **Runtime** | Node v26.12.0 and npm 11.20.0 at `/opt/homebrew/opt/node/bin`; prefix `PATH` and record `node --version` with every result |
| **Estimated runtime** | Owner run seconds; pair coverage under a minute; full gate ~56–68 seconds (Phase 4 evidence) |

---

## Sampling Rate

- **After every cause commit:** the owner command and the pair coverage command for every touched pair, including each consumer pair; `npm run test:unpaired` when a gate or the `src/` file set changes.
- **After every plan wave:** the parent runs `npm run check` on the combined tree.
- **Before `/gsd-verify-work`:** a current full `npm run check` on the final inputs; reuse only exact unchanged inputs in the same session (`skills/local-verification/SKILL.md`).
- **Max feedback latency:** about 70 seconds for the full gate; seconds for an owner run.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| W0 baseline | coordinator | 0 | ACC-01 | — | N/A | full | `npm run check` | ✅ | ⬜ pending |
| W0 ledger tracer | coordinator | 0 | ACC-01 (PROC-01/02 applied) | — | Ledger counts match reports and Git | ledger tracer | authored in the coordinator plan | ❌ W0 | ⬜ pending |
| DECLARATIONS | batch | per plan | ACC-01 | per plan | N/A | unit + coverage | PAIR commands for alarmMute, services, customCharacteristics, customServices | ✅ | ⬜ pending |
| CATALOGUE | batch | per plan | ACC-01 | per plan | Rows withhold doubtful values; no default projection | unit + coverage | `npm run test:coverage:direct -- src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts` | ✅ | ⬜ pending |
| CONTROLS | batch | per plan | ACC-01 | per plan | Refusal order and status unchanged; one attempt; no secrets in logs | unit + coverage | `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` | ✅ | ⬜ pending |
| RECORDS | batch | per plan | ACC-01 | per plan | Context keys unchanged; one persist per change | unit + coverage | PAIR commands for pumpRecords, reconciliation, staleMarking | ✅ | ⬜ pending |
| ACCESSORY | batch | per plan | ACC-01 | per plan | No false normal; StatusActive withdrawal kept | unit + coverage | `npm run test:coverage:direct -- src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` | ✅ | ⬜ pending |
| GATES | batch | per plan | ACC-01 | per plan | Exactly one HAP importer; no read handler reaches the network | static gate | `npm run test:unpaired` | ✅ | ⬜ pending |
| Bug RED evidence | any batch | per plan | ACC-01 (BUG-01 applied) | — | RED observed before GREEN | evidence check | `node .claude/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence .planning/phases/05-accessories-conformance/05-<PAIR>-RED-EVIDENCE.json --raw` | conditional | ⬜ pending |
| Closeout | coordinator | last | ACC-01 | — | N/A | full | `npm run check` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `05-REVIEW-PROTOCOL.md` — batches, roles, rulebook authority (`skills/` over `.claude/rules/`), D-03 arithmetic, five-path cause budget, runtime paths
- [ ] `05-FINDINGS.md` — 24-path inventory, CR-05-CONTROLS-001…007 at current locations, S-05 candidates as unaccepted leads
- [ ] Ledger tracer predicate — a concrete command written in the coordinator plan
- [ ] Fresh baseline `npm run check` — the last full gate ran in another session and inputs changed since

*No framework install is needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full D-01 header form (SPDX, blank, copyright JSDoc, blank, overview JSDoc) | ACC-01 | `test/packaging/licenseHeaders.test.ts` checks only the SPDX MIT token | Inspect the first lines of all 24 files against `src/runtime/clock.ts:1-9` in the closeout header audit |
| Rule judgments on review findings | ACC-01 (PROC-01 applied) | Rulebook conformance is a reviewer judgment | Independent full-file reviews per batch; ledger records rule, location, severity, disposition |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
