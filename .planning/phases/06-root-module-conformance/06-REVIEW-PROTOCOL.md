# Phase 6 review and evidence protocol

## Scope and authority

The live `code-review-sweep` milestone, `06-CONTEXT.md` decisions D-01 through D-06, `AGENTS.md`, and the project TypeScript and unit-test skills govern this review. Phase 1's review and evidence contract supplies the established process. Review exactly six mirrored root pairs: `config`, `protocol`, `logging`, `settings`, `index`, and `platform`, each as `src/<name>.ts` and `test/<name>.test.ts`. Read each complete file at a recorded Git revision, including the complete platform test. `test/configSchema.test.ts` and `test/packageManifest.test.ts` were removed by the maintainer and must stay outside the inventory and review. Treat other repository gates as bounded consumers only when a confirmed root finding requires a change.

Use three nonoverlapping batches: `CONFIG_PROTOCOL` owns config and protocol, `ENTRY` owns logging, settings, and index, and `PLATFORM` owns platform. A reviewer uses the `gsd-code-reviewer` role; a cause fixer uses `gsd-code-fixer`. Both load their configured skills. Record the reviewer, full-file spans, revision, and any dirty diff. Review source and owner tests against exact applicable rules. Preserve device identity, telemetry trust, privacy, command, persistence, and Homebridge compatibility constraints. Use offline synthetic inputs and existing local stand-ins.

Each TypeScript owner needs the approved header: SPDX on line one, a separate copyright JSDoc with `Copyright (c) 2026 Alessandro Colomba`, a separate `@fileoverview` JSDoc, and one blank line between those parts and imports. Preserve Apache-2.0 classification and Homebridge template attribution in `index` and `settings`. Inventory header status is a review cue, not an accepted finding.

## Finding ledger

`06-FINDINGS.md` is the central ledger. Assign every accepted or rejected candidate one stable ID of the form `CR-06-CONFIG_PROTOCOL-NNN`, `CR-06-ENTRY-NNN`, or `CR-06-PLATFORM-NNN`. Increase the number within its batch. Keep an ID when a finding recurs; give separate causes separate IDs. Each row records the exact rule, revision-qualified file and line, severity, first round, current disposition, concrete rejection reason or repair, reviewer evidence, regression title and command where applicable, and source, RED evidence, and fix commits. Do not call an unreviewed file clean.

## Correction rounds and stops

First triage the complete files and commit the batch report and ledger. Fix accepted causes one at a time. After repairs, an independent reviewer reads the complete owned files and introduced changes again. Each correction round records reviewer, reviewed revision and diff, opening, fixed, rejected, new, reopened, and closing counts, with ID transitions. Enforce `closing = opening - fixed - rejected + new + reopened`; the IDs must reconcile with the numbers. A missing review cannot count as a zero-finding round. Commit the round report and ledger counter **before** its next repairs. Record every repair commit in a ledger commit **before** the next independent round. Resume only from these durable commits and their exact revisions.

Stop all batch dispatches immediately if a round has open findings and makes no progress (`closing >= opening`), any fixed finding reopens, or correction round four is reached, even when round four closes cleanly. Record the actual counts, open IDs, attempted repairs, and stop reason. Do not silently reset the counter or convert a pause into a fix. A maintainer decision is required before work continues past a stop. Phase 5's `GATES` cap exception does not apply to Phase 6.

## Post-debug ENTRY validation after the round-four STOP

D-07 records the maintainer's separate “Yes, debug and replan
(Recommended)” decision. Preserve the historical ENTRY round-four row:
opening 1, fixed 1, rejected 0, new 2, reopened 0, closing 2, open IDs
CR-06-ENTRY-019 and CR-06-ENTRY-020. Focused GSD debug subsequently
recorded active RED and revert/reconfirm runs and committed `24f3620` and
`2d291cc`. Its record is not a Phase 6 planning-only RED evidence commit;
record the actual cross-workflow sequence without inventing one.

Run exactly one independent post-debug validation review at a recorded current
revision. The reviewer reads all six complete ENTRY source/test files, checks
the exact ENTRY-019 and ENTRY-020 delegate outputs, and probes adjacent
redaction routes, newlines, registered-secret overlap, headers, settings,
and registration. Record complete spans, rule-qualified locations, stable
IDs, and actual executable-input diff in `06-ENTRY-REVIEW.md` and
`06-FINDINGS.md`. Append a separately named post-debug validation result;
do not increment or rewrite the four-round correction counter. Use a new
stable ENTRY ID for a genuinely new cause and retain an existing ID for the
same cause. If any accepted finding remains or appears, stop with exact open
IDs and require a new maintainer decision. Do not fix and re-review
automatically.

Clean ENTRY closure requires that one review to find zero accepted open
findings, 100% isolated direct coverage for logging, settings, and index,
a fresh passing `npm run check` on the reviewed executable inputs, and an
explicit maintainer result from the original Homebridge logging workflow
confirming no unredacted suffix or unregistered password value in its logs.
An unanswered human check is pending, not a pass. Record only the result,
not actual credential bytes. Compare the debug's pre-fix source, active RED
assertions, and timestamps with its GREEN commits to assess the BUG-01
behavior objective; if that proof is ambiguous, stop for a new decision.
Record debug evidence and commit ancestry truthfully, then append closure
without changing the historical round-four STOP row. Plans 06-05 through
06-08 may dispatch only
after 06-04 records this clean closure and completes; an open finding,
failed gate, or pending human result keeps PLATFORM blocked.

## Genuine bugs and assertion controls

For a genuine behavior bug, keep production unchanged, add an active regression to the owning test, compile, and run the named test. RED must execute and fail on the intended assertion. A setup failure, no tests, a skipped test, or an environmental error is not RED. Save complete native TAP output, command, exit, target, expected and actual behavior, unchanged source commit, full regression patch, semantic assessment, Node version, and timestamps. Validate the record with `node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence <record.json> --raw` and require `RED_EVIDENCE_OK` and semantic review. Commit **only** the planning RED evidence before the minimum GREEN production/test change; leave the active regression in the working tree. Verify the evidence commit's paths, then run GREEN and direct coverage. Never bypass normal hooks or rewrite history.

For a test-assertion repair, a temporary negative control is separate from genuine bug RED. Capture its named failure, restore every temporary source byte, rebuild, and prove GREEN before committing. Do not commit a mutation. Trace callers before a shared-contract edit, using Fallow symbol impact or a targeted import trace. Fix at the cause with one cause per hook-passing commit.

## Checks, commits, and resume

Use `npm run build:test` before a compiled owner test. Run each changed pair's direct coverage alone; it must reach 100% line, function, and branch coverage. Run `npm run --silent test:corresponding` for pairing. The coordinator runs fresh `npm run check` for the baseline, after the combined code wave, at the phase gate, and at final handoff. It includes static checks, repository tests, Cucumber, and all isolated pairs. A timeout, interrupted run, or nonzero exit is not a pass. Reuse same-session passing evidence only after an exact unchanged-input diff and untracked-input comparison under `local-verification`.

Serialize compilation, `dist-test`, temporary mutations, Git index use, commits, and full checks in a shared checkout. Before each commit run the project Fallow audit and `SKIP=npm-check pre-commit run --files <changed files>`; restage any fixer output and repeat until clean. Use normal foreground `git commit` with project Conventional Commit domain scopes. Do not use `--no-verify`, `--amend`, or a skipped-hook substitute. At every handoff, give the next owner the last committed report, ledger revision and counter, open IDs, RED evidence commits, repair commits, and exact check exits. The coordinator owns state, roadmap, requirements, and the final combined gate.
