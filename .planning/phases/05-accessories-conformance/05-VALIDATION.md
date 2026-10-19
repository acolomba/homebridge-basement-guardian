---
phase: "05"
slug: "accessories-conformance"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: true
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
| **Gate command** | `npm run lint` and `npm run test:unpaired` (the retained HAP parity test is unpaired) |
| **Full suite command** | `npm run check` |
| **Runtime** | Node v26.12.0 and npm 11.20.0 at `/opt/homebrew/opt/node/bin`; prefix `PATH` and record `node --version` with every result |
| **Estimated runtime** | Owner run seconds; pair coverage under a minute; full gate ~56–68 seconds (Phase 4 evidence) |

---

## Sampling Rate

- **After every cause commit:** the owner command and the pair coverage command for every touched pair, including each consumer pair; `npm run test:unpaired` when a gate or the `src/` file set changes.
- **After every plan wave:** the parent runs `npm run check` on the combined tree.
- **Before `/gsd-verify-work`:** a current full `npm run check` on the final inputs; reuse only exact unchanged inputs in the same session (`.agents/skills/local-verification/SKILL.md`).
- **Max feedback latency:** about 70 seconds for the full gate; seconds for an owner run.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| W0 baseline | coordinator | 0 | ACC-01 | — | N/A | full | `npm run check` | ✅ | ✅ green (`05-FINDINGS.md` `### 05-01`) |
| W0 ledger tracer | coordinator | 0 | ACC-01 (PROC-01/02 applied) | — | Ledger counts match reports and Git | ledger tracer | `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs` | ✅ | ✅ green (`05-FINDINGS.md` `### 05-01`) |
| DECLARATIONS | 05-02 | 2 | ACC-01 | per plan | N/A | unit + coverage | PAIR commands for alarmMute, services, customCharacteristics, customServices | ✅ | ✅ green (clean ledger; current full gate) |
| CATALOGUE | 05-03 | 3 | ACC-01 | per plan | Rows withhold doubtful values; no default projection | unit + coverage | `npm run test:coverage:direct -- src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts` | ✅ | ✅ green (clean ledger; current full gate) |
| CONTROLS | 05-04 | 4 | ACC-01 | per plan | Refusal order and status unchanged; one attempt; no secrets in logs | unit + coverage | `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` | ✅ | ✅ green (clean ledger; current full gate) |
| RECORDS | 05-05 | 5 | ACC-01 | per plan | Context keys unchanged; one persist per change | unit + coverage | PAIR commands for pumpRecords, reconciliation, staleMarking | ✅ | ✅ green (clean ledger; current full gate) |
| ACCESSORY | 05-06/07 | 6-7 | ACC-01 | per plan | No false normal; StatusActive withdrawal kept | unit + coverage | `npm run test:coverage:direct -- src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` | ✅ | ✅ green (clean ledger; current full gate) |
| GATES historical review | 05-08 | 8 | ACC-01 | per plan | Scanner review stopped at round 15 with two open findings | review ledger | `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs` | ✅ | ⚠️ stopped; the old all-clean predicate fails |
| Current lint and HAP parity | 05-09 | 9 | ACC-01 | per plan | Static import and ordinary handler-registration boundaries; real-HAP write parity | lint + unpaired | `npm run lint && npm run test:unpaired` | ✅ | ✅ green (11 forbidden probes, 2 allowed owners, parity 22/22, full gate) |
| Bug RED evidence | any batch | per plan | ACC-01 (BUG-01 applied) | — | RED observed before GREEN | evidence check | `node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence .planning/phases/05-accessories-conformance/05-<PAIR>-RED-EVIDENCE.json --raw` | ✅ | ✅ green (four evidence files exited 0) |
| Closeout | 05-09 | 9 | ACC-01 | — | N/A | full | `npm run check` | ✅ | ✅ green (a95b870, 2026-10-19T08:34:32Z to 08:35:36Z) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `05-REVIEW-PROTOCOL.md` — batches, roles, rulebook authority (`.agents/skills/` over `.claude/rules/`), D-03 arithmetic, five-path cause budget, runtime paths
- [x] `05-FINDINGS.md` — 24-path inventory, CR-05-CONTROLS-001…007 at current locations, S-05 candidates as unaccepted leads
- [x] Ledger tracer predicate — a concrete command written in the coordinator plan
- [x] Fresh baseline `npm run check` — the last full gate ran in another session and inputs changed since

*No framework install is needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full D-01 header form (SPDX, blank, copyright JSDoc, blank, overview JSDoc) | ACC-01 | `test/packaging/licenseHeaders.test.ts` checks only the SPDX MIT token | Run the ledger header tracer on the 21 current accessory source and test paths; the four retired paths remain historical inventory only |
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
