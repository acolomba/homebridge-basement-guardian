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

All rows address DEV-01. Ownership is finalized in eight serial plans and three
continuous review batches. These are pending execution commands, not passing
research/planning results. Every runnable automated command has an immediate
fails_when sibling in its plan. No task lacks automated feedback. Declaration-only
owners retain compiler contracts and honest selector results rather than invented
runtime coverage counts. Each task modifies at most five declared paths including
conditional evidence, report and helper; required external cause scope is amended
explicitly in its owning wave before edits.

| Task | Wave / batch | Exact automated scope in PLAN | Threat Ref | Execution status |
| --- | --- | --- | --- | --- |
| 03-01-01 | 1 / STATE | build:test plus state owner, unversioned returned/canonical tracer | T-03-01, T-03-02 | Pending |
| 03-01-02 | 1 / STATE | isolated state pair, six warning dispositions and preserved SC-03 | T-03-01, T-03-02, T-03-03 | Pending |
| 03-01-03 | 1 / STATE | isolated state and full check; complete STATE correction verdict | T-03-01, T-03-02, T-03-03 | Pending |
| 03-02-01 | 2 / DECODING | build:test plus family/Gemini owners; required shape and actual invalid-water result | T-03-04, T-03-05 | Pending |
| 03-02-02 | 2 / DECODING | family declaration selector plus real Gemini owner | T-03-04, T-03-05 | Pending |
| 03-03-01 | 3 / DECODING | build:test plus Gemini owner; complete invalid-self-test result | T-03-06, T-03-07 | Pending |
| 03-03-02 | 3 / DECODING | isolated Gemini pair, guards, independent results and age invariance | T-03-06, T-03-07, T-03-08 | Pending |
| 03-04-01 | 4 / DECODING | build:test plus waterLevel/Gemini owners; actual guarded lookup | T-03-09 | Pending |
| 03-04-02 | 4 / DECODING | all three isolated decoding pairs and full check; whole DECODING verdict | T-03-04 through T-03-09 | Pending |
| 03-05-01 | 5 / SUPPORT | build:test events compiler/owner plus declaration selector | T-03-10 | Pending |
| 03-05-02 | 5 / SUPPORT | health selector plus actual serviceCatalogue owner | T-03-11 | Pending |
| 03-06-01 | 6 / SUPPORT | build:test plus HALO/registry owners; actual unsupported result | T-03-12 | Pending |
| 03-06-02 | 6 / SUPPORT | isolated HALO and registry pairs; whole outcomes/cadence | T-03-12, T-03-13 | Pending |
| 03-07-01 | 7 / SUPPORT | build:test context/pumpRecords owners plus context selector | T-03-14, T-03-15 | Pending |
| 03-07-02 | 7 / SUPPORT | context selector and actual pumpRecords owner; units/doc-test triage | T-03-14, T-03-15 | Pending |
| 03-07-03 | 7 / SUPPORT | all five isolated support pairs and full check; whole SUPPORT verdict | T-03-10 through T-03-15 | Pending |
| 03-08-01 | 8 / coordinator | actual JSON/Git ledger tracer in PLAN, DEVICE_LEDGER_TRACER_OK | T-03-16, T-03-17 | Pending |
| 03-08-02 | 8 / coordinator | actual aggregate audit, license owner and full check | T-03-01 through T-03-17 | Pending |

T-03-SC is reserved in every plan. No package installation is authorized. Every
code wave has a coordinator-owned full npm run check even where the focused
task commands above do not repeat it. Reuse follows exact-input local-verification;
a passing commit hook never replaces the combined gate.

### Exact pair command map

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

Existing infrastructure covers all nine pairs. Planning has created the review
protocol, pending inventory/findings/round ledger and eight task maps. They are
ready for execution inspection, not executed validation; wave_0_complete stays
false until the coordinator verifies actual dispatch readiness. No runner or
speculative seed helper is required. Preserve SC-03 whole frozen snapshots and
canonical readback after refused patches.

Initial full-file reviews cover STATE 2 files, DECODING 6 and SUPPORT 10 before
their respective repair passes. One counter per batch survives every serial
slice and owner correction. D-03 pauses ALL work before any next write/build/
commit/dispatch for a non-reducing round with open IDs, reopened fix, or fourth
round even clean. No plan/batch counter reset is permitted.

Genuine bugs require active intended RED on unchanged production and committed
planning-only complete patch/native output/command/actual exit/target/source
commit+blobs/runtime/time evidence before the passing GREEN source/active-test
commit. Audit real ancestry and recursively preserve every nested priorEvidence.
Assertions controls remain separate and restore exact production bytes before
rebuilt GREEN. Compiler-only proofs are not artificial runtime failure evidence;
an unsupported intended classifier result is surfaced before GREEN.

If exact shared consumers require changes, amend the concrete owning-wave
task/file map before edits; no cause task exceeds five changed paths including
conditional evidence/reports/helpers. Every actual extension joins complete
headers/review and native owner/direct checks. Seeds trigger broad staged
selection. The coordinator creates 03-SEAL-AUDIT.json only during 03-08 and
audits its claims against real reports/native outputs/Git objects.

## Manual-Only Verifications

| Behavior | Requirement | Why manual | Instructions |
| --- | --- | --- | --- |
| E-03-01 unclassified/unresolved taxonomy | DEV-01 | Actual deterministic report has no classified behavior taxonomy | Keep flagged; concrete file/tests coverage does not resolve it or imply exhaustive taxonomy |
| P-03-01 safety telemetry | DEV-01 | Existing serializer yielded unresolved descriptorless, unverified/flagged item | Present actual scope-qualified safety evidence/limits only if genuinely human_needed at seal |
| P-03-02 truthful completion | DEV-01 | Existing serializer yielded unresolved descriptorless, unverified/flagged item | Present actual inventory/review/provenance/gate evidence and limits only if genuinely human_needed at seal |

No Phase 2 human answer resolves these Phase 3 items. Equality remains edge
1 = 0 lifted + 1 flagged assumption and prohibitions 2 = 2 authored + 0 omitted.
No wired check descriptor or invented enforcement pass exists. The parent owns
real judgment collection and phase advancement; do not automatically accept.

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
