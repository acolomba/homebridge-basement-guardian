# Phase 5: Accessories Conformance - Pattern Map

**Mapped:** 2026-10-16
**Files analyzed:** 24 in-scope source/test files plus coordinator artifacts
(protocol, ledger, per-batch reports, RED evidence)
**Analogs found:** all files have an analog; no file lacks one

All analog paths below are git-tracked (`git ls-files` checked for
`src/runtime/clock.ts`, `.claude/rules/typescript-unit-testing.md` and the
Phase 4 artifacts). The `skills/*/SKILL.md` rulebooks are authoritative over
`.claude/rules/*` (AGENTS.md). The `.claude/rules` unit-testing copy also allows
`// act & assert` for "a data row". `skills/` allows it only for one
`assert.rejects`/`assert.throws`.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
| --- | --- | --- | --- | --- |
| `05-REVIEW-PROTOCOL.md` (new) | config (process contract) | batch | `.planning/phases/04-runtime-conformance/04-REVIEW-PROTOCOL.md` | exact |
| `05-FINDINGS.md` (new) | store (ledger) | CRUD | `.planning/phases/04-runtime-conformance/04-FINDINGS.md` | exact |
| `05-<BATCH>-REVIEW.md` (DECLARATIONS, CATALOGUE, CONTROLS, RECORDS, ACCESSORY, GATES) | review report | batch | `.planning/phases/04-runtime-conformance/04-PORTS-REVIEW.md` | exact |
| `05-<NAME>-RED-EVIDENCE.json` (only if a genuine bug is found) | test evidence | file-I/O | `.planning/phases/04-runtime-conformance/04-PLATFORM-RED-EVIDENCE.json` | exact |
| 9 sources: `src/accessories/{alarmMute,services,customCharacteristics,customServices,serviceCatalogue,controls,pumpRecords,staleMarking,basementGuardian}.ts` (D-01 header) | header fix | transform | `src/runtime/clock.ts:1-9`, `src/accessories/reconciliation.ts:1-8` | exact |
| 12 tests without D-01 (`alarmMute`, `services`, `customCharacteristics`, `customServices`, `serviceCatalogue`, `pumpRecords`, `staleMarking`, `basementGuardian` + 4 gates) | header fix | transform | `test/accessories/controls.test.ts:1-15` | exact |
| `test/accessories/{controls,basementGuardian,staleMarking,serviceCatalogue,customCharacteristics,customServices}.test.ts` (D-11 widening) | test helper | transform | `test/accessories/controls.test.ts:44-46`, `test/accessories/customCharacteristics.test.ts:71-75` | exact |
| `test/accessories/controls.test.ts` (seeds CR-05-CONTROLS-001..006) | test | event-driven | the same file (in-file patterns) + research examples | exact |
| `src/accessories/controls.ts` (seed CR-05-CONTROLS-007, S-05-05/06) | service comments | request-response | `src/accessories/controls.ts:304-336` itself | exact |
| Tests that lack one `describe` per export (seed b, S-05-02/03) | test | — | `test/runtime/accountRuntime.test.ts:829,8782` | role-match |
| 4 gates (`timerFreedom`, `hapImportScope`, `accessoryReadPathScope`, `hapWriteFidelity`) | test (static gate) | batch / file-I/O | the same files (floors at `hapImportScope.test.ts:57-63`) | exact |
| Possible bounded consumer: `src/runtime/accountRuntime.ts:346` (S-05-07) | service | request-response | Phase 4 ACCOUNT bounded consumer edits `e914a62` | role-match |

## Pattern Assignments

### `05-REVIEW-PROTOCOL.md` (process contract)

**Analog:** `.planning/phases/04-runtime-conformance/04-REVIEW-PROTOCOL.md`

Copy these section headings and keep their order. Change the IDs and batch
names to Phase 5 values.

- `## Serial ownership and execution` (line 8)
- `## Typed roles, terminal waits and complete books — D-01, D-02` (45)
- `## Stable ledger and seed triage` (75-89)
- `## Consumers, aliases and bounded cause tasks — D-06` (91)
- `## Correction rounds and global stop — D-03` (146-163)
- `## Genuine bug evidence and separate controls — D-04` (165)
- `## Runtime preservation — D-05, D-06` (207)
- `## Checks, commit ordering and historical limits — D-07` (239)

Leave out the Phase 4-only sections: `Seal and summaries` (288; research Open
Question 2 recommends a smaller closeout), the TRUST-017/ACCOUNT-015 maintainer
exceptions (326, 345) and run-scoped fixer isolation (312).

Ledger text to adapt (lines 77-83):

```text
Allocate CR-04-PORTS-NNN, CR-04-POLICIES-NNN, CR-04-TRUST-NNN or
CR-04-ACCOUNT-NNN once per cause. Keep IDs on recurrence. Each finding records
RUN-01, exact rule/section, initial and current revision-qualified path/line,
BLOCKER/WARNING, first independent observation, triage/disposition, reason,
actual tests/commands/raw exits, source/evidence/fix hashes and committed paths.
```

Phase 5 version: use `CR-05-{DECLARATIONS,CATALOGUE,CONTROLS,RECORDS,ACCESSORY,GATES}-NNN`
and ACC-01. Reserve CONTROLS-001..007 for seeds (a)-(g).

Stop arithmetic to copy verbatim (lines 153-163): `closing = opening - fixed -
rejected + new + reopened`. Stop on a correction round with open findings and no
reduction, on any reopen, or at round four.

Phase 5 additions: (1) a paragraph that states `skills/` is authoritative over
`.claude/rules/typescript-unit-testing.md` for `// act & assert`; (2) the D-17
N/A rules for the four gates (mirrored pairing, one `describe` per export,
isolated direct coverage); (3) the D-10 citation rule (cite SC-02 /
CR-04-ACCOUNT-0xx); (4) the runtime path choice (`.claude/gsd-core` vs
`.codex/gsd-core`).

---

### `05-FINDINGS.md` (ledger)

**Analog:** `.planning/phases/04-runtime-conformance/04-FINDINGS.md`

Section skeleton to copy: `## Full current inventory` (10), `## Batch reports and
continuous counters` (56), `## Candidate triage — no preaccepted finding` (70),
`## Stable findings` (87), `## Genuine bug history and separate controls` (124),
`## Checks and threat dispositions` (137). Do not copy the per-wave narrative
sections (180+). Put one short `## Coordinator wave N evidence` per wave.

Counter table (lines 58-63):

```markdown
| Batch | Plans | Report | Initial review | Last correction round | Open IDs |
| --- | --- | --- | --- | --- | --- |
| PORTS | 04-01/02 | 04-PORTS-REVIEW.md | 7 accepted at 6f475a0 | 3; clean at dd5ea2d | None; 0 |
```

Findings table header (lines 89-90):

```markdown
| ID | Requirement | Exact rule/section | Initial revision:path:line | Current revision:path:line | Severity | First reviewer | Disposition/reason | Native checks/raw exits | Source/evidence/fix commits and paths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
```

Inventory: the 24-path table in `05-RESEARCH.md` §Initial Scope Inventory
(lines 168-193) with the D-01 header status. Candidate triage: S-05-01..21
(`05-RESEARCH.md:248-270`), each "not yet a finding". Seed rows: CR-05-CONTROLS-001..007
with the current locations from `05-RESEARCH.md:221-229`.

---

### `05-<BATCH>-REVIEW.md` (per-batch review report)

**Analog:** `.planning/phases/04-runtime-conformance/04-PORTS-REVIEW.md:1-27`

Frontmatter to copy:

```yaml
---
phase: 04-runtime-conformance
reviewed: 2026-10-14T22:50:16Z
depth: deep
files_reviewed: 8
files_reviewed_list:
  - src/runtime/accessoryStore.ts
  - test/runtime/accessoryStore.test.ts
findings:
  critical: 2
  warning: 5
  info: 0
  total: 7
status: issues_found
batch: PORTS
review_round: 0
correction_rounds: 0
source_revision: 6f475a0db1698847ed7a1c7238ccb461dfdb8bda
first_reviewer: /root/phase4_ports_first/ports_initial_review
---
```

ACCESSORY may span two plans that share one report and one counter. This is the
same as ACCOUNT in Phase 4 (`04-ACCOUNT-REVIEW.md`).

---

### `05-*-RED-EVIDENCE.json` (D-04, only for genuine bugs)

**Analog:** `.planning/phases/04-runtime-conformance/04-PLATFORM-RED-EVIDENCE.json`

Keys: `command`, `argv`, `cwd`, `sourceHEAD`, `sourceCommit`, `nodeVersion`,
`npmVersion`, `startedAt`, `finishedAt`, `exitCode` (non-zero), `signal`,
`output` (raw TAP). The command form is
`node --test --test-reporter=tap dist-test/test/accessories/<x>.test.js`.
Validate with
`node .claude/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence <record> --raw`.
Commit the evidence by itself, then the minimum GREEN commit.

---

### D-01 header: the nine sources

**Analog:** `src/runtime/clock.ts:1-9` (also `src/accessories/reconciliation.ts:1-8`)

```typescript
// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Supplies current wall time in epoch milliseconds.
 */
```

Current wrong form (`src/accessories/controls.ts:1-3`): the SPDX line is followed
directly by `/**` and ` * @fileoverview ...`. Fix: add a blank line and the
copyright block above the overview, and keep the overview text the same. All
ten sources are MIT. No Apache boundary applies
(`test/packaging/licenseHeaders.test.ts:49`). Header-only fixes go in commits
of their own.

### D-01 header: the twelve tests

**Analog:** `test/accessories/controls.test.ts:1-15`

```typescript
// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Tests control writes and refusal diagnostics.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createFakeHap } from '../../features/support/fakeHap.js';
import { bindRestoredControlRefusal, createControlBinder } from '../../src/accessories/controls.js';
```

Eight paired tests start with imports, so add all three blocks to them. The four
gates start at `/**\n * @fileoverview` (for example `timerFreedom.test.ts:1-8`),
so add the SPDX line and the copyright block above the long overview. Keep the
import grouping: node builtins, blank line, relative `.js` imports.

---

### D-11 widening helpers (six test files)

**Analog A (const):** `test/accessories/controls.test.ts:44-46`

```typescript
// The stand-in answers the members the plugin reads and nothing else, which no structural type can
// express; the widening is what lets it stand where the plugin takes the real namespace.
const HAP_NAMESPACE = HAP as unknown as API['hap'];
```

**Analog B (function):** `test/accessories/customCharacteristics.test.ts:71-75`

```typescript
// The stand-in answers the members the plugin reads and nothing else, which no structural type can
// express; the widening is what lets it stand where the plugin takes the real namespace.
function hapNamespace(): API['hap'] {
  return createFakeHap() as unknown as API['hap'];
}
```

New helper shape (`05-RESEARCH.md:475-481`), with one per target type per file:

```typescript
// The stand-in answers the members the plugin reads and nothing else, which no structural type
// can express; this is the one place a stand-in service stands where the plugin takes a Service.
function asService(service: FakeHapService): Service {
  return service as unknown as Service;
}
```

Inline casts to replace: controls.test.ts 163, 335, 336, 851, 872, 903
(Service); basementGuardian.test.ts 480, 746 (PlatformAccessory), 646, 676, 1278,
1279 (`FakeServiceClass`), 813 (the deliberately invalid `{ context: null }`, so
give it its own named, commented helper); staleMarking.test.ts 111, 115, 119
(PlatformAccessory), 431 (Service). Do not change production types.

---

### `test/accessories/controls.test.ts` seeds (CR-05-CONTROLS-001..006)

**001 whole value** (current 817-830). Line 829 compares a projection
`{ warnings: warnings.length, pending: [...] }`. Compare the whole `warnings`
array to the exact expected lines instead.

**002 describe per export.** Analog `test/runtime/accountRuntime.test.ts:829`
`describe('createAccountRuntime', ...)` and `:8782`
`describe('createAccountRuntimeFromConfig', ...)`. Add
`describe('bindRestoredControlRefusal')` and `describe('createControlBinder')`
and import `describe` at line 12. Make the reindent its own style-only commit
and check it with `git diff -w`.

**003 tests the fake** (216-243). Remove it with the ledger reason "duplicated
against both implementations at hapWriteFidelity.test.ts:375-396" (D-13/D-16).

**004 `.bind` spy** (321-340). Current code:

```typescript
  let registrations = 0;
  const declared = characteristic.onSet.bind(characteristic);
  characteristic.onSet = (handler) => {
    registrations += 1;

    return declared(handler);
  };
```

Replacement (`05-RESEARCH.md:454-468`):
`const onSetSpy = t.mock.method(onCharacteristic(service), 'onSet');` and
`assert.strictEqual(onSetSpy.mock.callCount(), 1);`. The test callback takes `(t)`.

**005 `// act & assert` over two statements** (921-932, and also 975-982).
Current:

```typescript
  // act & assert
  await assertRefused(service, true, NOT_ALLOWED_IN_CURRENT_STATE);
  assert.deepStrictEqual(
```

Split it into `// act` and `// assert`. Use the combined marker only when one
`assert.rejects`/`assert.throws` does both. Apply the same rule to the other
S-05-01 sites (36 markers in 10 files).

**006 casts:** see D-11 above.

**S-05-04 data rows** (547-557): use one sibling `test()` per row
(`05-RESEARCH.md:487-497`), with `REFUSALS`/`refuse` from 518-545.

### `src/accessories/controls.ts` seed CR-05-CONTROLS-007

Current (304-336): the `LOCAL_REFUSALS` ordering comment (304-322) is followed
with no blank line by the `NO_COMMAND_TRANSPORT_CAUSE` comment (323-327). Move the
ordering comment block so that it sits directly above `const LOCAL_REFUSALS`
(336), and keep each cause comment above its own constant. Do not change any
string literal. Refusal causes are pinned by exact-line tests
(controls.test.ts:424-516). Also remove the history narration "two refusals now
answer it" (S-05-06) only if a reviewer accepts that finding.

---

### Static gates (GATES batch)

**Analog:** the gates themselves. Floor pattern from `hapImportScope.test.ts:57-63`:

```typescript
/** Every directory holding TypeScript this repository authors. */
const SOURCE_DIRECTORIES: readonly string[] = ['src', 'test', 'features'];

// The three directories hold a hundred and four TypeScript files. A gate that enumerated
// fewer than this read the wrong tree, and the single-importer assertion built on that
// read would pass without examining a single file.
const SOURCE_FILE_FLOOR = 104;
```

Keep the `>=` floor (D-14). The stated count is stale (132 now; `src` is 43 against
"forty" at `accessoryReadPathScope.test.ts:72-76`). Re-count at the GATES wave
after earlier waves finish. In the ledger, record the whole-value rule as N/A
for floors, with the D-14 reason.

## Shared Patterns

### Headers and imports
**Source:** `src/runtime/clock.ts:1-9`, `test/accessories/controls.test.ts:1-15`.
**Apply to:** all 21 non-conforming files. Keep `.js` relative imports.

### HAP only through the injected namespace
**Source:** `controls.test.ts:44-46` and `features/support/fakeHap.ts`
(`createFakeHap`). Only `hapWriteFidelity.test.ts` imports `@homebridge/hap-nodejs`.
Do not edit `fakeHap.ts` unless a declared bounded task needs it (D-12).

### AAA markers
**Source:** `skills/typescript-unit-testing/SKILL.md:42` (authoritative).
Use `// arrange`, `// act`, `// assert`. Use `// act & assert` only for one
`assert.rejects`/`assert.throws`.

### Review and evidence ownership
**Source:** `04-REVIEW-PROTOCOL.md:8-43`. The parent owns Git, the ledger and
full gates. There is one writer in the existing checkout. A cause commit has at
most five paths. Run `SKIP=npm-check pre-commit run --files ...` before each
commit. Run `npm run check` after each wave.

### Exact consumers before contract changes
**Source:** `05-RESEARCH.md:361-381` consumer table and the two `fallow dead-code
--type-aware --symbol-impact` commands (run once for `tsconfig.json` and once
for `tsconfig.test.json`).

### Pinned literals
Do not change UUIDs (`customCharacteristics.ts:85-100`,
`customServices.ts:78-81`), subtypes, context keys (`pumpRecords.ts:63-67`),
display names or log/refusal lines in a style fix (D-05).

## No Analog Found

None. Every file has an in-repo or Phase 4 analog. No accessory test-support
helper exists yet. If D-15 adds one, use the D-01 test header. A non-`.test.ts`
file under `test/` selects all pairs in the staged selector.

## Metadata

**Analog search scope:** `src/accessories`, `src/runtime`, `test/accessories`,
`test/runtime`, `.planning/phases/04-runtime-conformance`
**Files scanned:** ~14
**Pattern extraction date:** 2026-10-16
