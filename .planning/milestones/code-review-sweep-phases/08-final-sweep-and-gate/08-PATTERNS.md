# Phase 8: Final Sweep and Gate - Pattern Map

**Mapped:** 2026-10-22
**Files analyzed:** 18 planned record files, plus six existing verification reports to refresh
**Analogs found:** 18 / 18 record files; six verification files have existing in-place structure

Phase 8 creates planning evidence, not a runtime module. Classify these records by their evidence flow. The six report names below are proposed ownership names; the planner may choose different names while keeping the six disjoint inventories.

## File Classification

| New or modified file | Role | Data flow | Closest tracked analog | Match |
| --- | --- | --- | --- | --- |
| `08-REVIEW-PROTOCOL.md` (live manifest) | config / inventory | batch | `07-REVIEW-PROTOCOL.md` | exact |
| `08-CLOUD-REVIEW.md` | review report | batch | `07-REAL-STEPS-REVIEW.md` | role match |
| `08-DEVICE-REVIEW.md` | review report | batch | `07-REAL-STEPS-REVIEW.md` | role match |
| `08-RUNTIME-REVIEW.md` | review report | batch | `07-REAL-STEPS-REVIEW.md` | role match |
| `08-ACCESSORY-REVIEW.md` | review report | batch | `07-REAL-STEPS-REVIEW.md` | role match |
| `08-ROOT-REVIEW.md` | review report | batch | `07-REAL-STEPS-REVIEW.md` | role match |
| `08-FEATURES-REVIEW.md` | review report | batch | `07-REAL-STEPS-REVIEW.md` | exact role and data flow |
| `08-FINDINGS.md` | central ledger | batch / transform | `07-FINDINGS.md` | exact |
| `08-BUG-LEDGER.md` (proposed name) | provenance ledger | transform | `01-FINDINGS.md` | role match |
| `08-VALIDATION.md` | gate record | batch | `07-VALIDATION.md` | exact |
| `08-VERIFICATION.md` | phase verifier record | transform | `07-VERIFICATION.md` | exact |
| `08-01-SUMMARY.md` or each planned `08-XX-SUMMARY.md` | plan summary | transform | `07-30-SUMMARY.md` | exact |
| `01-VERIFICATION.md` through `06-VERIFICATION.md` | existing verifier records | transform | `07-VERIFICATION.md` | exact form, existing files |

The proposed manifest should cover the live tracked `src/**`, paired `test/**`, and `features/**` paths, including the JSON fixtures identified in `08-RESEARCH.md`. Refresh the count at execution; the research snapshot was 137 paths. The two maintainer-retired root tests stay absent. The ten repository-level tests remain outside complete-file review and still run in the full gate.

## Pattern Assignments

### `08-REVIEW-PROTOCOL.md` — inventory, batch ownership, and rules

**Analog:** `.planning/phases/07-cucumber-feature-conformance/07-REVIEW-PROTOCOL.md`.

Its opening ties the snapshot to a commit and assigns one owner per path (lines 3–7):

```text
The source snapshot is commit `213d9afb69408d323b43a8be2f7f16520c68495e`.
Each path has one owner in plans 07-02 through 07-13.
```

Copy the table contract at lines 31–38: `Owner | Batch report | Tracked path | Blob | Lines`. Lines 33–36 distinguish starting blobs from the actual revision a reviewer reads. Lines 78–80 require additions and moves to remain traceable. For Phase 8, compute a fresh `git ls-files src test features` manifest and give every current path exactly one of CLOUD, DEVICE, RUNTIME, ACCESSORY, ROOT, or FEATURES. Record starting commit, full blob, line count, owner, and report path. Keep cross-boundary reads distinct from ownership. Apply the current `.agents/skills` rule paths from `08-CONTEXT.md` and `08-RESEARCH.md`; do not revive old `skills/*` or `features/CLAUDE.md` names.

The protocol's finding schema and stop equation are ready to copy from lines 82–113:

```text
closing = opening - fixed - rejected + new + reopened

Stop all batch work immediately if the open count does not fall after a
correction round, a fixed ID reopens, or round four completes.
```

Keep the Phase 8 locked RED order from lines 115–130: active named assertion failure against unchanged production; planning-only RED record and commit; minimum GREEN source/test commit; normal hooks and direct coverage. The current phase context also requires stopping the whole review on those conditions.

### Six `08-*-REVIEW.md` batch reports — complete-file reviews

**Analog:** `.planning/phases/07-cucumber-feature-conformance/07-REAL-STEPS-REVIEW.md`.

Use the complete-file table at lines 3–20. It identifies reviewer, committed revision, contiguous ranges, exact Git blobs, and bounded cross-file reads:

```markdown
| Path | Lines read | Blob |
| --- | ---: | --- |
| `features/real-pump/support/steps.ts` | 1–72 | `91e644aecf773767dac583ec6801aa118ec4d7a3` |
```

Use the finding table at lines 22–45: stable ID, requirement, exact rule, `commit:path:line`, severity, and disposition. Its rows show why the defect matters, with a concrete repair. Use lines 93–124 for per-ID repair commits and focused evidence. Keep each batch's chronological correction-round equation and historical STOP, even when later work closes the forward finding. Do not treat a reviewer's cross-boundary read as ownership of another batch's file.

For a clean file, record a complete-file row and explicit zero findings. For a changed file, review the whole new blob. Apply TypeScript style and unit-test rules to source/test owners; apply Cucumber rules to FEATURES; apply header form to TypeScript. The actual Phase 8 report paths and counts must be derived from the live inventory, not copied from Phase 7's 37-file snapshot.

### `08-FINDINGS.md` — central stable-ID ledger

**Analog:** `.planning/phases/07-cucumber-feature-conformance/07-FINDINGS.md`.

Its opening and inventory structure at lines 1–32 separate source snapshot, batch index, and file ledger. Lines 72–100 reconcile moves, additions, report blobs, historical result, and forward status. Copy that separation for the final current tree. Lines 102–113 define the consolidated finding row:

```text
source report line ... rule, revision-qualified location,
severity, disposition, and evidence.
Repeated IDs show later round or repair evidence;
the forward open set and historical STOPs remain separate
```

The phase-end model at lines 634–658 compares report blobs, original inventory, additions, all stable IDs, round arithmetic, historical STOPs, and forward-open status. The final gate row at lines 613–620 records order, exact command, exit, and observed result; lines 649–658 tie it to a source commit. Use a new `CR-08-BATCH-NNN` ID for each distinct cause, preserve the observed revision-qualified location, and add later disposition without overwriting history. A successful GATE-02 outcome requires no forward-open current finding, but past STOPs remain visible.

### `08-BUG-LEDGER.md` — milestone bug provenance

**Analog:** `.planning/phases/01-known-findings-and-loop-proof/01-FINDINGS.md`, lines 52–82 and 107–131. This is a new cross-phase index; no existing single file audits every Phase 1–7 bug. Use one row per genuine behavior bug, linked to its phase finding and RED JSON. Copy the SC-05 proof fields:

```text
Named test: `keeps the joined caller grant alive when the first caller aborts`
Against unchanged source `109fda723d684b842e710786ddf08162ee65f816`,
the ... run exited 1 ... one failed, zero cancelled/skipped.
```

The provenance paragraph at lines 76–80 verifies `source < evidence < fix` with `git merge-base --is-ancestor`, checks actual changed paths with `git show --name-only`, and confirms the evidence commit changes planning material only. Recheck the native target failure and semantics for each archived RED record; do not infer a bug or closure from a green gate or commit title. Lines 84–105 distinguish assertion-strength negative controls from production bugs. Include that distinction in the milestone index. Name absent evidence explicitly instead of filling a guessed commit or outcome.

### `08-VALIDATION.md` and final combined-tree gate

**Analog:** `.planning/phases/07-cucumber-feature-conformance/07-VALIDATION.md`, lines 10–42 and 65–82.

Copy the test infrastructure, sampling, and per-requirement map, adapting it to BUG-01, GATE-01, and GATE-02. The gate record at lines 65–75 contains the essential proof:

```text
At clean executable-input commit `7616dc2` on Node `v26.12.1`, the command
`TEST_CONCURRENCY=1 npm run check` exited 0.
```

Record command, exit, revision, Node version, test/scenario/step/direct-pair counts, and executable-input diff or untracked state. The current repository gate policy is `.agents/skills/local-verification/rules/gates.md`; the prior Phase 7 numbers are historical and must not become Phase 8 results. Run real-pump profile only as a dry run, and inspect undefined/ambiguous statuses rather than trusting exit 0. `08-RESEARCH.md` lines 204–218 supplies the exact focused and full commands.

### Stale `01-VERIFICATION.md` through `06-VERIFICATION.md`, then `08-VERIFICATION.md`

**Analog:** `.planning/phases/07-cucumber-feature-conformance/07-VERIFICATION.md`. The verifier-owned front matter begins at lines 1–6:

```yaml
phase: 07-cucumber-feature-conformance
verified: 2026-10-22T22:44:32Z
status: passed
score: 5/5 must-haves verified
covered_files:
```

The `covered_files` list binds claims to source and planning inputs. Refresh the six stale reports through the GSD verifier workflow after the last Phase 8 source change, rather than editing their `status` text manually. Recheck Phase 7 freshness too. The current status query described in `08-RESEARCH.md` lines 160–167 is the entry point. Phase 8's verifier must judge its own requirements against the current ledger and final gate; a past `passed` front matter value does not certify the new tree.

### `08-XX-SUMMARY.md` — plan and gate handoff

**Analog:** `.planning/phases/07-cucumber-feature-conformance/07-30-SUMMARY.md`, lines 1–57. Copy front matter for phase, plan, requirements, key files, decisions, and status; follow it with concise change and verification evidence. Lines 41–48 identify focused check, hook/Fallow audit, full gate, scenario and direct-pair results. Lines 50–52 show the mandatory `## Threat Flags` section. Keep the exact actual command and revision in Phase 8 summaries; do not copy Phase 7's 130/1400 counts as current results.

## Shared Patterns

### Rule and review ownership

`07-REVIEW-PROTOCOL.md:82–113` supplies stable IDs, complete-file review, chronological round accounting, and STOP conditions. `08-CONTEXT.md` fixes the six ownership domains and current rulebooks. Record each reviewed path at its actual blob. New, moved, or repaired paths need explicit rows and fresh complete-file review.

### Gate and evidence validity

`07-VALIDATION.md:65–82` and `.agents/skills/local-verification/rules/gates.md` make a gate result reusable only while executable inputs are unchanged. Run `TEST_CONCURRENCY=1 npm run check` on the sealed combined tree. `07-FINDINGS.md:613–632` shows how to record a sandbox failure separately from a permitted rerun. A failed environmental attempt is not a pass or product RED.

### Cross-milestone windows

`.planning/WINDOWS.md` is the existing tracked register for open, waived, and fixed windows. Audit its current 18 open and 19 waived items against evidence. Use `gsd-tools windows` for any justified status change; do not hand-edit the register or equate an old open window with a current Phase 8 finding.

## No Analog Found

| File | Role | Data flow | Gap |
| --- | --- | --- | --- |
| `08-BUG-LEDGER.md` | milestone provenance index | transform | Phase 1–7 ledgers prove individual bugs, but no single cross-phase ledger exists. Assemble it from the phase ledgers and Git objects. |

## Metadata

**Analog search scope:** Tracked Phase 1–7 protocol, findings, batch review, validation, verification, and summary records; current project rulebooks.
**Tracked-source gate:** All named analog files above were confirmed by `git ls-files`.
**Fallow guard:** `08-PATTERNS.md` returned zone `none`, with no configured rule pack.
**Pattern extraction date:** 2026-10-22.
