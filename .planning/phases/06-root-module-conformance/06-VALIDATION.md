---
phase: "06"
slug: "root-module-conformance"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-19"
---

# Phase 6 — Validation Strategy

> Per-phase feedback contract. The plan tasks and their threat references are
> filled in after planning.

## Test Infrastructure

| Property | Value |
| --- | --- |
| Framework | Native `node:test`, `node:assert/strict`, compiled TypeScript ESM; Cucumber in the full gate |
| Config file | `tsconfig.test.json`, `scripts/check-corresponding-tests.mjs`, `scripts/test-coverage-direct.mjs` |
| Quick run command | `npm run build:test && node --test dist-test/test/<owner>.test.js` |
| Pair coverage command | `npm run test:coverage:direct -- src/<owner>.ts` |
| Full suite command | `npm run check` |
| Estimated runtime | About one minute for the full gate on this host; record actual duration |

## Sampling Rate

- After a cause edit, run the owning test and direct coverage for every
  touched root pair. A shared contract edit also tests affected consumers.
- Every commit uses the repository's normal pre-commit and commit hooks.
- After each combined wave and before phase verification, run `npm run check`.
- Reuse passing evidence only for identical inputs under
  `.agents/skills/local-verification/rules/gates.md`.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Wave 0 baseline | Coordinator | 0 | ROOT-01 | — | No deleted test is restored | pairing + full | `npm run check` | ✅ | ✅ green on the post-deletion `9605a63` code tree |
| A: config/protocol | TBD | TBD | ROOT-01 | Per plan | Invalid config stays refused; protocol meaning is unchanged | owner + direct coverage | `npm run test:coverage:direct -- src/config.ts src/protocol.ts` | ✅ | ⬜ pending |
| B: logging/settings/index | TBD | TBD | ROOT-01 | Per plan | Secrets stay redacted; registration identity stays stable | owner + direct coverage | `npm run test:coverage:direct -- src/logging.ts src/settings.ts src/index.ts` | ✅ | ⬜ pending |
| C: platform | TBD | TBD | ROOT-01 | Per plan | Trust, identity, lifecycle, and persistence remain correct | owner + direct coverage | `npm run test:coverage:direct -- src/platform.ts` | ✅ | ⬜ pending |
| Confirmed behavior bug | Per cause | Per plan | ROOT-01 (BUG-01 applied) | Per plan | Active named regression fails before fix | RED evidence + owner | `node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence <evidence-file> --raw` | Conditional | ⬜ pending |
| Phase closeout | Final plan | Final wave | ROOT-01 | — | No current regression | full | `npm run check` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

## Wave 0 Requirements

Existing source/test pairs and build tooling cover the phase. Create the
Phase 6 ledger and review protocol before the first independent review.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
| --- | --- | --- | --- |
| Complete-file style, comment, and test-rule review | ROOT-01 | Reviewer judgment is not a runtime property | Read all twelve current files under the project rulebooks; log rule, location, severity, and disposition for each finding. |
| Review convergence | ROOT-01 (PROC-02 applied) | Independent correction rounds require judgment | Reconcile opening, fixed, new, reopened, and closing IDs; apply the four-round and no-progress stop rules. |

## Validation Sign-Off

- [ ] Every plan task has an executable `<automated>` check or an explicit
      manual reviewer action.
- [ ] No three consecutive tasks lack an automated check.
- [ ] Every modified pair reaches 100% direct coverage alone.
- [ ] No watch-mode flags appear in test commands.
- [ ] `nyquist_compliant: true` is set only after execution evidence exists.

**Approval:** pending.
