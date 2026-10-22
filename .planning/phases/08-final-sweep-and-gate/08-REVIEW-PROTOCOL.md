# Phase 08 complete-file review protocol

This protocol applies to the `code-review-sweep` milestone. The starting
snapshot is commit `0217a8ac4e0c049eb152dc2b01d2952b1ae826d1`. The live
inventory is [08-MANIFEST.json](08-MANIFEST.json): 137 current in-scope paths,
the same count as research, with ten named repository gate tests excluded and
the two maintainer-retired root tests absent. The manifest records each full
Git blob, line count, single owner, shard, and batch report. A manifest row is
an assignment, never proof that a reviewer read the file.

## Scope and acceptance

| Owner | Exact path set | Paths | Shard A | Shard B | Report |
| --- | --- | ---: | ---: | ---: | --- |
| CLOUD | `src/cloud/**`, `test/cloud/**` | 19 | Five paths named in Plan 08-02 | Remaining 14 | `08-CLOUD-REVIEW.md` |
| DEVICE | `src/device/**`, `src/persistence/**`, matching `test/**` | 20 | Six paths named in Plan 08-03 | Remaining 14 | `08-DEVICE-REVIEW.md` |
| RUNTIME | `src/runtime/**`, `test/runtime/**` | 23 | Four paths named in Plan 08-04 | Remaining 19 | `08-RUNTIME-REVIEW.md` |
| ACCESSORY | `src/accessories/**`, `test/accessories/**` | 21 | Four paths named in Plan 08-05 | Remaining 17 | `08-ACCESSORY-REVIEW.md` |
| ROOT | Root `src/*`, root `test/*`, `test/hbConfig/config.example.json` | 15 | Three paths named in Plan 08-06 | Remaining 12 | `08-ROOT-REVIEW.md` |
| FEATURES | Every tracked `features/**` path | 39 | All 15 `.feature` paths named in Plan 08-07 | Remaining 24 | `08-FEATURES-REVIEW.md` |

The manifest's explicit `shard` value is authoritative for each path. Plans
08-12 and 08-13 finish the RUNTIME and ACCESSORY reports without reassigning
paths. A file read across an owner boundary is context, not another ownership
claim. If a path is added, deleted, moved, or repaired, update the manifest and
the one owning report before claiming final coverage. Keep historical rows for
moves and STOPs. The ten excluded repository tests still run in the final gate.

Use the current `.agents/skills/typescript-style`, `typescript-unit-tests`,
and `cucumber` rulebooks and their applicable `rules/*.md` files. Check the
Phase 1 TypeScript header form: SPDX first, then separate copyright and brief
`@fileoverview` JSDoc blocks; preserve attribution. Apply Cucumber rules to
feature files and step/support code; review the two ROOT JSON fixtures for
their data contracts. Compare relevant Homebridge and Cucumber primary docs
with pinned packages and installed types when API behavior matters. The
concrete Phase 8 success criteria in `.planning/ROADMAP.md` govern acceptance.

## Review and finding records

Round zero is independent discovery before any repair. Each assigned complete
file needs a **same-row** path, `1-N` contiguous line span (or contiguous
subspans covering `1-N` for a large file), full committed blob, reviewer,
finding count, and IDs or explicit clean result. A partial first-half RUNTIME
owner-test row in Plan 08-04 remains partial until Plan 08-12 completes it.
Record the commit actually read; a stale starting blob cannot certify a later
tree. Record bounded cross-boundary reads separately. A reviewer who edits a
file cannot certify its independent review. A different reviewer must read
the complete changed file after a repair, even if the repair touched one line.

Assign one never-reused `CR-08-BATCH-NNN` ID per distinct cause, where BATCH
is CLOUD, DEVICE, RUNTIME, ACCESSORY, ROOT, or FEATURES. Keep an ID when its
cause moves or reopens. Each finding record contains the requirement, exact
current rule file and section, first round, initial and current
`commit:path:line` locations, severity, disposition (`open`, `fixed`, or
`rejected`), a rejection reason or fix explanation, named check and command,
RED evidence JSON/checker result/commit when applicable, GREEN fix commit,
and raw exit status at each verification revision. A candidate rejected
without an ID still needs its rule, location, and evidence-based reason in the
batch report. Centralize accepted IDs and their forward status in
[08-FINDINGS.md](08-FINDINGS.md); never infer closure from a passing gate.

For every correction round record opening, fixed, rejected, new, reopened,
closing, and the exact open ID set. Check:

`closing = opening - fixed - rejected + new + reopened`

Stop the **whole review** immediately when an open round makes no progress,
a fixed cause reopens, or round four completes. Round four ends review even if
its closing set is empty. Do not start round five. Preserve each historical
STOP and the forward-open ID set separately; a later repair does not erase
the STOP. No unreviewed file counts as clean.

## Repair and verification order

For a genuine behavior bug, add an active named regression against unchanged
production, run it, and observe the intended assertion fail. A build error,
zero executed tests, permission failure, or unrelated failure is not RED.
Record command, raw exit, output, expected and actual behavior, source commit,
active test patch, and semantic assessment in planning-only JSON. Validate it
with `node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence
<record.json> --raw`; require `RED_EVIDENCE_OK`. Commit only planning evidence
before the GREEN source/test fix. Keep the active regression in the worktree;
make the smallest cause repair, run the named check, and commit with ordinary
hooks. Trace callers before shared-code edits. Modified source/test pairs need
100% isolated direct line, function, and branch coverage. A test-strength
negative control is not automatically a production bug.

Serialize build output, test runs, temporary RED worktrees, Git staging and
commits, and all cross-owner edits. The coordinator assigns one critical
section across the checkout. Run `TEST_CONCURRENCY=1 npm run check` on the
combined tree after each repair wave and at the final sealed input. Record
command, exit, revision, Node version, and executable-input diff/untracked
state. A prior phase's pass is historical; reuse only evidence from this
session with unchanged executable inputs under `local-verification/rules/gates.md`.
Default Cucumber uses offline stand-ins; the real profile is dry-run only.

## Unresolved spec-less probe rows

Seven surfaced rows remain flagged: BUG-01 adjacency, empty, and ordering;
GATE-01 adjacency, empty, and ordering; GATE-02 unclassified. Their status is
unresolved. The accounting is **seven surfaced = zero lifted as proven edge
predicates + seven flagged**. No taxonomy disposition or backstop result is
invented. Use the concrete Phase 8 ROADMAP criteria for acceptance and keep
these flags visible in the central ledger.
