---
phase: "03"
slug: "device-and-persistence-conformance"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-14"
---

# Phase 3 — Validation Strategy

## Test Infrastructure

Use the installed node:test and node:assert/strict framework. Compile with
`npm run build:test` under tsconfig.test.json. Owners run from
dist-test/test/device or dist-test/test/persistence. The full gate is
`npm run check`; its 2,400-second limit is not a passing result.
No framework install, vendor account or hardware run is required.
Focused runtime has not been measured; no feedback latency is claimed.

## Sampling Rate

After each edit, build serially and run the affected owner. Before each source
commit, run every modified pair's isolated coverage and the required pre-step,
then verify the normal foreground commit hook. After each combined wave and
before phase verification, run the full gate. Reuse evidence only for exact
unchanged inputs under skills/local-verification/SKILL.md.
Serialize shared builds, mutation restoration, helpers, Git and shared records.

## Per-Task Verification Map

All rows address DEV-01. These are pending execution commands, not research
results. The planner supplies task and unique threat references after ownership
is finalized. Every runnable automated command needs an immediate fails_when
sibling in its plan. No three consecutive tasks may lack automated feedback.

| Pair | Owner after fresh build | Isolated direct command | File exists | Status |
| --- | --- | --- | --- | --- |
| State | node --test --test-reporter=tap dist-test/test/device/state.test.js | npm run test:coverage:direct -- src/device/state.ts test/device/state.test.ts | Yes | Pending |
| Family | node --test --test-reporter=tap dist-test/test/device/family.test.js | npm run test:coverage:direct -- src/device/family.ts test/device/family.test.ts | Yes | Pending |
| Gemini | node --test --test-reporter=tap dist-test/test/device/gemini.test.js | npm run test:coverage:direct -- src/device/gemini.ts test/device/gemini.test.ts | Yes | Pending |
| Water level | node --test --test-reporter=tap dist-test/test/device/waterLevel.test.js | npm run test:coverage:direct -- src/device/waterLevel.ts test/device/waterLevel.test.ts | Yes | Pending |
| Events | node --test --test-reporter=tap dist-test/test/device/events.test.js | npm run test:coverage:direct -- src/device/events.ts test/device/events.test.ts | Yes | Pending |
| Health | node --test --test-reporter=tap dist-test/test/device/health.test.js | npm run test:coverage:direct -- src/device/health.ts test/device/health.test.ts | Yes | Pending |
| HALO | node --test --test-reporter=tap dist-test/test/device/halo.test.js | npm run test:coverage:direct -- src/device/halo.ts test/device/halo.test.ts | Yes | Pending |
| Registry | node --test --test-reporter=tap dist-test/test/device/registry.test.js | npm run test:coverage:direct -- src/device/registry.ts test/device/registry.test.ts | Yes | Pending |
| Context | node --test --test-reporter=tap dist-test/test/persistence/accessoryContext.test.js | npm run test:coverage:direct -- src/persistence/accessoryContext.ts test/persistence/accessoryContext.test.ts | Yes | Pending |

Every pair alone must reach 100% lines, functions and branches. Inspect all
18 source/test headers and every conditional helper. A selected pair does not
refresh merged all-pair coverage. Shared helper or feature changes select all
pairs under the staged-input hook policy. Trace and validate exact external
consumers if a shared contract changes; this does not complete their subsystem
sweep. Any real-pump profile resolution check is dry-run only.

## Wave 0 Requirements

Existing infrastructure covers all nine pairs. Before execution, create the
review protocol, live inventory/finding and round ledgers. No speculative
runner or seed helper is required. Preserve SC-03 whole frozen snapshots and
canonical readback after refused patches. Genuine bugs require active intended
RED on unchanged production and committed planning-only complete evidence
before the passing fix/test commit. Preserve all histories. Assertion controls
are separate and restore exact production bytes before rebuilt GREEN.

## Manual-Only Verifications

| Behavior | Requirement | Why manual | Instructions |
| --- | --- | --- | --- |
| Residual taxonomy or descriptorless prohibition judgment | DEV-01 | A concrete review does not invent exhaustive taxonomy or maintainer values approval | Surface only actual Phase 3 flagged items at seal; do not inherit Phase 2 answers |

Live vendor occurrence, hardware safety and release gates remain outside this
phase. Automated synthetic tests do not prove those conditions.

## Validation Sign-Off

- [ ] Every task has automated verification and a concrete failure signal.
- [ ] Sampling continuity has no three consecutive tasks without feedback.
- [ ] Wave 0 records exist; no missing owner or framework remains.
- [ ] Nine isolated pairs pass all three coverage metrics at 100%.
- [ ] Every modified helper and exact external consumer is covered.
- [ ] Genuine RED provenance and assertion restoration are independently audited.
- [ ] Full combined gate and independent review results are current.
- [ ] Any required Phase 3 human judgment is recorded explicitly.
- [ ] nyquist_compliant and wave_0_complete reflect executed evidence.

**Approval:** Pending execution and independent validation.
