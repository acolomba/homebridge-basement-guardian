# CONFIG_PROTOCOL complete-file review

## Round 0: independent review and triage

Reviewer: `gsd-code-reviewer` agent `review_config_protocol`. Base revision: `5ff22a40053e9635672aae7c399f8e6ac51f21c9`. The worktree had no dirty diff. Node: v26.12.0. The reviewer read every line of `src/config.ts` (1–219), `test/config.test.ts` (1–445), `src/protocol.ts` (1–36), and `test/protocol.test.ts` (1–29). `src/platform.ts` and `src/protocol.json` were bounded consumers. The removed `test/configSchema.test.ts` and `test/packageManifest.test.ts` were outside the inventory.

The independent review checked the project TypeScript style and unit-test rules, the approved header, config refusal order and privacy, accepted input, and the exact protocol contract. `npm run --silent test:corresponding` exited 0 with `Corresponding-tests gate passed.` at the base revision. Fallow guard found no configured boundary zones for the four owners.

| ID | Rule and base location | Severity | Triage |
| --- | --- | --- | --- |
| CR-06-CONFIG_PROTOCOL-001 | `AGENTS.md` Privacy and context D-06; `src/config.ts@5ff22a4:80–85,99,124,131,135`, logged by `src/platform.ts@5ff22a4:564–567` | BLOCKER | Accepted, open. Arbitrary invalid values enter refusal text, so a misplaced private value can reach the Homebridge log. |
| CR-06-CONFIG_PROTOCOL-002 | `config.schema.json` email format and context D-06; `src/config.ts@5ff22a4:14,167–169`, `test/config.test.ts@5ff22a4:88–102` | BLOCKER | Accepted, open. Consecutive or trailing dots in an email address pass runtime validation; two tests pin those malformed addresses as accepted. |
| CR-06-CONFIG_PROTOCOL-003 | `typescript-unit-tests/rules/cases.md` Assertions and `review.md` BLOCKER; `test/protocol.test.ts@5ff22a4:20–28` | BLOCKER | Accepted, open. Nonempty checks pass if a bundled destination changes to a wrong nonempty value. |
| CR-06-CONFIG_PROTOCOL-004 | `06-REVIEW-PROTOCOL.md` approved header and `typescript-style/rules/modules-and-data.md` File order; `src/config.ts@5ff22a4:1–2` | WARNING | Accepted, open. Separate copyright and overview JSDocs are absent. |
| CR-06-CONFIG_PROTOCOL-005 | Same header rules; `test/config.test.ts@5ff22a4:1–4` | WARNING | Accepted, open. SPDX, separate copyright and overview JSDocs are absent. |
| CR-06-CONFIG_PROTOCOL-006 | Same header rules; `src/protocol.ts@5ff22a4:1–5` | WARNING | Accepted, open. Separate copyright and overview JSDocs are absent. |
| CR-06-CONFIG_PROTOCOL-007 | Same header rules; `test/protocol.test.ts@5ff22a4:1–4` | WARNING | Accepted, open. SPDX, separate copyright and overview JSDocs are absent. |

The reviewer rejected three candidates without assigning IDs because they were not filed as findings: `resolveIgnoredFaults()` only runs after invalid entries are refused; `String(email)` and `String(password)` follow successful text validation; and a circular object is outside the `config.json` input contract. The candidate email verdict was accepted as a finding because the runtime claims an email-address check and the form declares `format: email`.

Round 0 counts: opening 0, fixed 0, rejected 0, new 7, reopened 0, closing 7. Open IDs: 001–007. This report and its matching ledger rows are committed before owner repairs.

## Repairs queued for independent round 1

The coordinator recorded every cause commit here before dispatching the next reviewer. All seven IDs remain open until independent round 1 confirms each repair.

| ID | Repair and evidence |
| --- | --- |
| 001 | `500cbad` committed only the validated RED evidence JSON. Its active named config assertion failed against unchanged production (`RED_EVIDENCE_OK`). `5d605c3` removed arbitrary supplied values from integer and ignored-fault refusals; config direct coverage and normal hooks passed. The bounded platform consumer assertion changed in `5dd9bbc`; platform direct coverage passed under native watcher access. Two sandboxed attempts exited 1 with `EMFILE` in an unrelated watcher test. |
| 002 | `b7942c2` committed only validated RED evidence (`RED_EVIDENCE_OK`) for consecutive dots in an account email. `ccee6ce` refuses empty dot-atom parts and updates owner expectations. Named TAP, config direct coverage, and normal hooks passed. |
| 003 | `68c6dc1` asserts the six vendor values independently in the protocol owner test. A temporary `src/protocol.json` change from `wss` to `ws` made `bundles the exact public vendor protocol values` fail at `deepStrictEqual` (exit 1). The fixer restored the JSON byte for byte, confirmed blob `3088e6a36d1a99d0062b2dea927508f2163a61b9`, rebuilt, and observed named GREEN (exit 0). Protocol direct coverage and normal hooks passed. No production protocol field changed. |
| 004 | `7a4b1ca` added the approved header to `src/config.ts` only. |
| 005 | `e393b43` added the approved header to `test/config.test.ts` only. |
| 006 | `c1766e5` added the approved header to `src/protocol.ts` only and preserved the import-attribute comment. |
| 007 | `dd2e5b3` added the approved header to `test/protocol.test.ts` only. |

Each header commit passed its owner coverage, Fallow checks, project pre-step, and normal commit hook. At code revision `dd2e5b3`, `npm run test:coverage:direct -- src/config.ts src/protocol.ts` exited 0 with 100% direct line, function, and branch coverage for both pairs. The bounded platform test change is a scope deviation for cause 001 and does not count as a complete platform review.

## Correction round 1

Independent reviewer `review_config_protocol` read all four current files at clean revision `2c5788f30d52997ab64363c2fff28431d3160761`: `src/config.ts` 1–209, `test/config.test.ts` 1–485, `src/protocol.ts` 1–45, and `test/protocol.test.ts` 1–42. The reviewer checked the bounded platform assertion and unchanged `src/protocol.json` as consumers. IDs 001–007 were confirmed fixed. No fixed ID reopened.

New `CR-06-CONFIG_PROTOCOL-008` is a BLOCKER under `config.schema.json` email format and context D-06 at `src/config.ts@2c5788f:22`. The runtime regex accepts malformed domains including labels with leading or trailing hyphens and punctuation such as parentheses or a port suffix. This differs from 002's empty dot-atom parts. The cause remains open for a named active refusal regression and a minimum domain-label validation repair.

Round 1 counts: opening 7, fixed 7 (001–007), rejected 0, new 1 (008), reopened 0, closing 1 (008). `7 - 7 - 0 + 1 + 0 = 1`. Closing is less than opening, so the no-progress stop does not fire. The counter is 1 of at most 4. This report and ledger are committed before the next repair.

## Repair queued for independent round 2

For 008, `837f061` committed only RED evidence JSON. The active `refuses an account email with an edge hyphen in its domain` assertion failed at the intended `deepStrictEqual` against unchanged source at `e211078`; `check tdd-red-evidence` returned `RED_EVIDENCE_OK`. Commit `037dfe9` checks the practical ASCII dot-atom local part and DNS labels with alphanumeric edges. It adds independent accepted and refused email cases and keeps the privacy-safe refusal text. Named GREEN TAP, config direct 100% coverage, Fallow guard and audit, and the normal commit hook passed. The first commit attempt failed only on regex complexity and lint style; the fixer corrected those issues before the successful normal commit. No production protocol value changed.
