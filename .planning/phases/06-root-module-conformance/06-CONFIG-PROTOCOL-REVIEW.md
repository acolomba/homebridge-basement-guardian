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
