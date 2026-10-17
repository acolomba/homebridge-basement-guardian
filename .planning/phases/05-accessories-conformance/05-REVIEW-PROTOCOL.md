# Phase 5 review and evidence protocol

Requirement: ACC-01. Decisions D-01 to D-18 from `05-CONTEXT.md` apply to every Phase 5 plan.
Research leads (S-05-NN in `05-FINDINGS.md`) and the seven seeds are candidates, not accepted
findings. No finding, bug count or clean verdict is assigned at plan time.

## Scope and authority

Six batches cover the 24 inventory paths in `05-FINDINGS.md`:

| Batch | Plans | Round-0 report |
| --- | --- | --- |
| DECLARATIONS | 05-02 | `05-DECLARATIONS-REVIEW.md` |
| CATALOGUE | 05-03 | `05-CATALOGUE-REVIEW.md` |
| CONTROLS | 05-04 | `05-CONTROLS-REVIEW.md` |
| RECORDS | 05-05 | `05-RECORDS-REVIEW.md` |
| ACCESSORY | 05-06 and 05-07, sharing one report and one counter | `05-ACCESSORY-REVIEW.md` |
| GATES | 05-08 | `05-GATES-REVIEW.md` |

05-01 and 05-09 are coordinator plans with no batch. The round-0 report is
`05-<BATCH>-REVIEW.md`; correction round N, from 1 to 10 (D-18), writes
`05-<BATCH>-REVIEW-R<N>.md`.

Every inventory file gets a fresh full-file review. That includes `test/accessories/controls.test.ts`
(Phase 1 SC-02 fix) and the `reconciliation` pair (Phase 4 ACCOUNT consumer edits): earlier fixes
are regression anchors, and earlier edits do not count as a completed sweep (D-08). The seven
Phase 1 seed warnings hold the pre-allocated IDs CR-05-CONTROLS-001 to CR-05-CONTROLS-007 from
Wave 0; the CONTROLS round-0 review re-verifies each against current lines, and each ends fixed or
rejected with a reason (D-09).

The `.agents/skills/*/SKILL.md` books, with every file in their `rules/` directories, are
authoritative (AGENTS.md). Claude Code also loads the tracked `.claude/rules/*.md` copies into
every agent, and those copies disagree with `.agents/skills/`. The `.claude` unit-testing copy,
`.claude/rules/typescript-unit-testing.md` (deleted in `f68df73`), allowed `// act & assert` for
"a data row"; `.agents/skills/typescript-unit-tests/rules/cases.md` allows it only for one
`assert.rejects()` or `assert.throws()` expression. The tracked `.claude` comments copy lacks the
narration and prose rules. Every reviewer and fixer dispatch says that `.agents/skills/` wins.
This phase never edits `.claude/rules/`.

## Execution model and leases

The runtime is Claude Code with `.claude/gsd-core` paths, recorded once here. Phase 4's
`.codex/gsd-core` paths and `GSD_RUNTIME=codex` do not apply. Batch plans run inline in a
top-level session that has the Agent tool (`/gsd-execute-phase 05 --interactive` or the autonomous
`--interactive` inline path). A `gsd-executor` subagent has no Agent tool and halts on its first
task's precondition. `workflow.use_worktrees` stays false; it is restored to true only at
milestone end, through its registered owner. One writer works in the existing checkout on branch
`features/code-review-sweep`.

The session that executes a plan is the coordinator. It owns Git, the ledger, the triage
sections, builds, mutation experiments and full gates. Subagents own only the paths their
dispatch names. Dispatch one subagent at a time, in the foreground. While it runs, run no
repository command, build, edit or commit; only its returned final result ends its lease. An
interim message never ends a lease.

Before each dispatch, run `node .claude/gsd-core/bin/gsd-tools.cjs query resolve-model <role>`
and `node .claude/gsd-core/bin/gsd-tools.cjs query agent-skills <role>`. Omit `model` when the
resolved model is empty. Record the resolved effort, because the Agent tool takes no effort
parameter, and include the agent-skills block in the prompt. Record per dispatch: role, resolved
model and effort, inputs, revision and terminal result.

Prefix every shell command with `export PATH="/opt/homebrew/opt/node/bin:$PATH" &&` and record
`node --version` with every result. After any runtime change, rerun the earlier checks. No
symlink repair, package install or upgrade. Each `gsd-tools windows append --description` text
starts with `[code-review-sweep]`; never hand-edit `.planning/WINDOWS.md`. STATE.md, ROADMAP.md
and REQUIREMENTS.md belong to the execute-phase workflow steps; nobody marks ACC-01 complete by
hand.

## Reviewer dispatch contract

Each review is a typed `gsd-code-reviewer` dispatch. The reviewer is read-only except for its
report path.

- Config: `files` (the exact batch inventory paths whose First round is at most this round),
  `review_path` and `depth: deep`.
- Required reading: AGENTS.md; the three books (`.agents/skills/typescript-style`,
  `.agents/skills/typescript-unit-tests` and `.agents/skills/local-verification`, each `SKILL.md`
  with every file in its `rules/` directory); `05-CONTEXT.md`; this protocol; the batch's ledger
  rows; `features/lib/hap.ts` when a batch test imports it; and
  `node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js` when a finding depends on HAP
  semantics.
- Overrides of the agent's defaults: style, comment and unit-testing rule violations are
  findings, in test files too. Severities are BLOCKER and WARNING exactly as each book's
  "Classifying findings" section defines them; there is no Info tier. IDs are
  `CR-05-<BATCH>-NNN` and continue after the batch's highest ledger ID; CONTROLS 001 to 007 are
  the seeds.
- Each finding is a `### <ID> - <SEVERITY>: <title>` section under `## Findings` with these
  lines: `**Rule:**` (book path and section), `**Location:**`
  (`<40-hex revision>:<path>:<lines>`), `**Issue:**`, `**Fix:**` and `**Flags:**`. The flags name
  a genuine production bug candidate (D-04), an exported contract change (D-06), a D-10 citation
  (SC-02 or a CR-04-ACCOUNT-0xx ID) when the lines were touched by those fixes, and D-11, D-13,
  D-14, D-16 or D-17 where they apply.
- A missing D-01 header is one finding per pair, and one per file for a gate.
- The report also has `## Seed and lead dispositions` (confirm as a finding, or reject with rule
  and source evidence, for every seed and lead the batch owns), `## Header inspection` (for each
  file: conforms, or the gap), `## Toolchain evidence` (a fresh `npm run typecheck`, the batch
  owner tests and the pair commands, with raw exits and `node --version`; a failed or missing
  check is a finding) and `## Out-of-scope observations` (a defect in a file outside the batch,
  with the owning phase; it gets no CR-05 ID unless a Phase 5 edit caused it).
- Frontmatter: `phase`, `batch`, `review_round`, `reviewed` (UTC), `depth`, `source_revision`
  (40 hex), `files_reviewed`, `files_reviewed_list`, `findings` (`blocker`, `warning`, `total`),
  `status` (`clean` or `issues_found`) and `reviewer`.
- No source or test edit, no mutation experiment, no commit.

A correction-round dispatch also gives the opening open-ID set and every fixed ID with its fix
commit. It requires a fresh read of every line of every listed file, never a diff, and a
`## Round status` section: each opening ID confirmed fixed or still open, each earlier fixed ID
still fixed or reopened, and new IDs for new causes only.

## Fixer dispatch contract

Each repair is a typed `gsd-code-fixer` dispatch that owns exactly the listed cause IDs and paths.

- Config: `review_path` (the report that holds the causes), `fix_scope: critical_warning`,
  `padded_phase: 05`, `phase_dir`, and `fix_report_path` under the session scratch directory,
  never in the repository.
- Required reading: AGENTS.md, the three books, this protocol, the cause sections and every file
  it edits. For any path under `features/`, also `.agents/skills/cucumber/SKILL.md` with every
  file in its `rules/` directory.
- Overrides of the agent's defaults: never use `gsd-tools query commit`; create no worktree;
  commit titles carry a domain scope and no phase, plan, wave, milestone or finding ID; follow the
  cause procedure for each cause, one commit per cause, at most five paths per commit including
  the report.
- Return, per cause: ID, commit hash, committed paths, each command with its raw exit and
  `node --version`, and any deviation.
- If a cause cannot be fixed inside its paths, restore that cause's paths with
  `git checkout -- <path>`, commit nothing for it, and return.

## Cause procedure and commit protocol

1. Run a fresh `node_modules/.bin/fallow guard <exact paths>`; it must exit 0.
2. A change to an exported name, type, signature, field presence, mutability or visibility runs
   the D-06 section below first.
3. Make the minimal edit at the cause. Preserve every pinned literal (the D-05 section) unless the
   finding names that behavior. Add no new export, reset hook or production type change for a
   test. Header-only edits go in their own commit. A reindent goes in its own style-only commit,
   last among that file's causes, recorded with `git diff -w "$HASH"^.."$HASH" -- <file>` showing
   that only the wrapper lines changed.
4. Run `npm run build:test`, the owner test `node --test dist-test/test/accessories/<name>.test.js`,
   and `npm run test:coverage:direct -- <source> <test>` for each touched pair and each touched
   consumer pair. Run `npm run test:unpaired` when a gate file or the `src/` file set changes.
5. Run `node_modules/.bin/fallow audit --base <batch base> --format json --quiet --explain`; the
   verdict must be pass. A fail is fixed, never relabeled.
6. Append the cause's row to the report's `## Repair history` with Edit.
7. Run `SKIP=npm-check pre-commit run --files <exact paths>`, repeated until it exits 0 with no
   file modified.
8. `git add <exact paths>`.
9. Run a foreground `git commit` with SKIP unset. The hook runs `npm run check:commit`; gitlint
   checks a title of 5 to 72 characters, no trailing punctuation, no WIP, and body lines of at most
   80 characters. The message ends with the session's attribution line.
10. Confirm `git show --name-only --format= HEAD` lists exactly the staged paths and
    `git status --porcelain` is empty.

A failed hook means no commit happened: fix, repeat the pre-step, restage and commit again. Never
`--amend`, `--no-verify`, rebase or rewrite history.

Commit types: `style(<module>)` for headers and formatting, `docs(<module>)` for comments and JSDoc
only, `test(<module>)` for test-only causes, `refactor(<module>)` for a behavior-preserving code
change, `fix(<module>)` for a production fix, and `docs:` for ledger and report records.
`<module>` is the file stem, such as `controls` or `serviceCatalogue`. Execution metadata (each
plan's SUMMARY.md and the workflow's STATE.md, ROADMAP.md and REQUIREMENTS.md updates) uses the
same plain foreground commit with a title such as `docs: record the declarations batch summary`,
never the workflow's default `docs({phase}-{plan}): ...` title and never its commit handler.

## Genuine bugs and stand-in defects (D-04)

The coordinator decides whether a finding is a genuine production bug: wrong observable behavior
of `src/accessories` code, not a weak test.

1. Fixer dispatch 1 writes only the active regression test in the mirrored owner while production
   is unchanged, builds, and runs
   `node --test --test-reporter=tap --test-name-pattern='^<exact title>$' dist-test/test/accessories/<owner>.test.js`.
   It saves raw stdout, stderr and exit in the session scratch directory, commits nothing, and
   returns.
2. The coordinator requires the named target to run and fail on the intended assertion. A
   compile, import, fixture, setup, skipped, cancelled, missing or unrelated failure, or an
   unexpected pass, is not RED.
3. The coordinator writes `05-<NAME>-RED-EVIDENCE.json` with `command`, `argv`, `cwd`,
   `sourceHEAD`, `sourceCommit`, `nodeVersion`, `npmVersion`, `startedAt`, `finishedAt`,
   `exitCode`, `signal`, `output` (raw TAP), `stderr`, `targetTest`, `targetFile`, `expected`,
   `actual`, `semanticAssessment`, `regressionPatch` (the complete test diff), `productionBlobs`
   (path to `git hash-object`) and `priorEvidence` (every earlier record for the same name, in
   full).
4. It runs
   `node .claude/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence .planning/phases/05-accessories-conformance/05-<NAME>-RED-EVIDENCE.json --raw`
   and requires `RED_EVIDENCE_OK`.
5. It commits the evidence file alone as `test(<module>): record <behavior> regression evidence`.
   The failing test stays unstaged in the working tree.
6. Fixer dispatch 2 applies the minimum production fix, keeps the active test, proves GREEN (owner
   and pair) and commits both as `fix(<module>): <behavior>`.
7. The ledger's `## Genuine bug histories` row names the test title, both commits, the classifier
   result and the ancestry check: the evidence commit is an ancestor of the fix commit, and the
   production blobs are unchanged through the evidence commit.

No failing code commit, hidden or skipped regression, or hook bypass. GSD's TDD subject check
cannot see domain-scoped commits, so each SUMMARY lists the evidence-to-fix pairs under
`## TDD Gate Compliance`. A confirmed disagreement between `features/lib/hap.ts` and real HAP
follows the same order with `05-HAP-WRITE-FIDELITY-RED-EVIDENCE.json`, because the stand-in can
hide production behavior.

## Assertion controls (D-04)

For each BLOCKER cause where a case let a wrong implementation pass, the fixer:

1. names the plausible wrong behavior;
2. records the production blob;
3. applies the wrong behavior temporarily, builds, runs the named case and observes its intended
   assertion fail;
4. restores the exact bytes (`git hash-object` equals the recorded blob and
   `git diff --exit-code -- <path>` exits 0);
5. rebuilds and proves GREEN.

Record it as a control in the report, never as RED history. Never stage or commit a control
mutation.

## Contract changes and consumers (D-06)

Before changing an exported name, type, signature, field presence, mutability or visibility, run
both of these, keep stdout, stderr and raw exit, and read every named consumer:

```bash
node_modules/.bin/fallow dead-code --type-aware --symbol-impact <file>:<symbol> --type-aware-project tsconfig.json --type-aware-require complete --format json --quiet --explain
node_modules/.bin/fallow dead-code --type-aware --symbol-impact <file>:<symbol> --type-aware-project tsconfig.test.json --type-aware-require complete --format json --quiet --explain
```

Both must exit 0 with complete results. A failed, incomplete or exit-less impact command is not
evidence: make no edit, keep the cause open and stop for a maintainer decision.

Known consumers, copied from `05-RESEARCH.md` (Exact consumers for D-06 contract changes):

| Module | External importers |
| --- | --- |
| alarmMute | src/accessories/controls.ts |
| services | src/platform.ts, src/config.ts, src/accessories/basementGuardian.ts, src/accessories/serviceCatalogue.ts, test/platform.test.ts, test/config.test.ts, test/accessories/serviceCatalogue.test.ts, test/accessories/basementGuardian.test.ts, features/support/world.ts, features/step_definitions/configuration.steps.ts |
| customCharacteristics | src/accessories/customServices.ts, src/accessories/serviceCatalogue.ts, src/accessories/staleMarking.ts; tests: serviceCatalogue, customServices, basementGuardian |
| customServices | src/accessories/serviceCatalogue.ts; test/accessories/serviceCatalogue.test.ts |
| serviceCatalogue | src/accessories/basementGuardian.ts, src/accessories/staleMarking.ts, src/accessories/controls.ts; test/platform.test.ts, test/configSchema.test.ts, test/accessories/basementGuardian.test.ts; features/lib/publishedServices.ts, features/step_definitions/homekit.steps.ts |
| controls | src/accessories/basementGuardian.ts, src/accessories/staleMarking.ts; test/accessories/staleMarking.test.ts |
| pumpRecords | src/accessories/basementGuardian.ts |
| reconciliation | src/runtime/accountRuntime.ts |
| staleMarking | src/platform.ts, test/platform.test.ts, test/accessories/basementGuardian.test.ts, features/support/world.ts |
| basementGuardian | src/platform.ts, test/platform.test.ts, features/support/world.ts |

The table is a reading list; the two impact commands above, run at the edit's revision, are the
evidence for any edit.

A narrow consumer edit outside the batch needs its path in the plan's `files_modified`. If it is
missing, first commit a record-only amendment of the owning plan (files_modified, task text and
threat row), then add an inventory row of Kind `adaptation`, then edit. Later correction rounds
review an adaptation's changed hunks and their enclosing declarations, and the round report states
that scope; the rest of that file stays with its owning phase, and an observation there is an
out-of-scope observation. A consumer edit does not complete that consumer's own sweep: Phase 6
owns `src/platform.ts` and `test/platform.test.ts`, and Phase 7 owns `features/**`, including
`features/lib/hap.ts` under D-12. An edit to `src/runtime/accountRuntime.ts` does not reopen Phase
4's closed ACCOUNT counter (D-10).

## Correction rounds and the stop rule

Round 0 is the initial review. Tracer checks and clarifications are not rounds. A correction round
is an independent full-batch review after the complete repair pass, of every listed file.
Counters are per batch and start fresh in Phase 5 (D-10); a new cause never resets a counter.
The arithmetic is closing = opening - fixed - rejected + new + reopened. The ID sets must
reconcile, and IDs are never renamed.

D-18: each batch may run up to ten correction rounds, numbered 1 to 10. For Phase 5 only, this
replaces Phase 4's round-four stop and the "about four rounds" wording of PROC-02 and the ROADMAP.

On the reviewer's final result, before any other action, compute the counts and apply D-03 as
amended and D-18:

- A round whose closing is 0 is `clean` and closes the batch at any round from 0 to 10, correction
  round 10 included.
- STOP when the round has open findings and closing >= opening (`STOP: no progress`).
- STOP when any fixed ID reopened (`STOP: reopened <IDs>`).
- STOP when correction round 10 ends with open findings (`STOP: open after round 10`).
- Otherwise the open count fell, findings remain and the round is below 10, so the result is
  `continue`: repair the open findings and run the next round.

No batch runs more than ten correction rounds. STOP means: write the round's counter row with its
`STOP: <reason>` in the ledger, leave it uncommitted, run nothing else, commit nothing, and end
the plan with a blocking report of exact IDs and counts. Only a maintainer resolution recorded in
that STOP cell (`resolved by maintainer`) lets a later row follow it, and never past round 10.

D-10: a new cause on lines a Phase 1 or Phase 4 fix touched gets a new ID that cites SC-02 or the
CR-04-ACCOUNT ID. Only the return of the same fixed defect is a reopen.

## Pausing and resuming a batch

D-18 lets a batch outlast one session's context, so batches are not split for it; the ledger is
the resume record. There are two resume points:

- (a) the commit of a round's report and counter row, which always lands before that round's
  repairs start;
- (b) the ledger commit the coordinator makes after it verifies each dispatch that committed
  something: it records the hashes in Fix commits, runs the tracer and commits the ledger alone
  (`docs: record the <batch> repair commits`), which also gives the next fixer the clean tree its
  cause procedure checks.

Never pause between a reviewer's final result and its counter row, inside a cause procedure,
inside a D-04 RED-to-GREEN window, inside a D-06 sequence from its record-only amendment to its
consumer edit, between a new file's commit and its inventory-row commit, or while a subagent holds
its lease.

Pause check: GSD's per-wave context guard does not run on the `--interactive` inline path. At
every resume point the coordinator rates its own context pressure with the tiers in
`.claude/gsd-core/references/context-budget.md`. `workflow.context_guard_mode` is `auto`, so at
POOR it pauses at once. To pause, it adds a `#### Resume point` entry under its plan's
`### 05-NN` evidence (batch, last committed round and result, open IDs, open IDs that already have
fix commits, next step), commits the ledger alone (`docs: record the paused <batch> state`) and
ends the session with that entry as its report. A GSD pause-work handoff, if written, is committed
the same way, never through `gsd-tools query commit` and never under a `wip:` title.

At the start of every correction round, and after any context compaction, the coordinator re-reads
the batch's last counter row from the ledger file instead of trusting memory.

Resume check, the first step of every batch plan: GSD's safe-resume gate finds a plan's commits by
a plan ID in their titles, which this phase never writes, so it cannot see a half-done batch. Run
`node --version`, `git status --porcelain` and the tracer, then apply the first case that matches:

1. An uncommitted counter row that reads STOP: run nothing, because the phase waits for the
   maintainer.
2. An uncommitted round report, alone or with uncommitted edits to the ledger only, is a round in
   progress. If its frontmatter has `status` and it has its `## Findings` section (round 0) or
   `## Round status` section (correction round), it is that round's terminal result: finish its
   triage and apply the stop rule before anything else. Otherwise it has no terminal result: move
   it to the session scratch directory, note that in the resume entry and dispatch the same round
   again.
3. Uncommitted edits to the ledger alone mean a coordinator step did not finish. Keep the edits
   that the committed reports, their `## Repair history` rows and `git log` confirm, drop the
   rest, redo that step and commit the ledger.
4. Any other uncommitted change means a session ended inside a step: save `git status --porcelain`
   and `git diff` to the session scratch directory and stop for the maintainer.
5. With a clean tree, a plan whose `### 05-NN` subsection is not in the committed ledger starts at
   its first task. Otherwise it continues at its first step whose record is missing: open IDs it
   owns that have no fix commit after the batch's last counter row are repaired first, then the
   next correction round runs (05-06 runs none), and a batch whose last committed row is `clean`
   runs only its closure (the header and require-clean tracer runs, then `npm run check`).

For ACCESSORY, 05-06 owns the round-0 row and the causes tagged 05-06, and 05-07 owns the causes
tagged 05-07 and every correction round.

## Preservation (D-05)

These stay unchanged unless a finding names the behavior and D-04 proves it:

- the 16 characteristic UUID literals (`customCharacteristics.ts`) and the 4 service UUID literals
  (`customServices.ts`);
- service subtypes (the ServiceKind slugs) and display names;
- the `PumpRecordsContext` keys `primaryPump`, `backupPump` and `watermarks`;
- HAP status numbers;
- refusal order, causes and exact log lines (`controls.ts` `LOCAL_REFUSALS` and the vendor
  refusals);
- `PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE`;
- one command attempt with no retry;
- the macrotask clearing push;
- row withholding (no default projection);
- `StatusActive` withdrawal, with `StatusFault` kept for the five SAFE-04 conditions;
- last valid values;
- `deviceId` identity and its presence in log lines;
- `HapStatusError` thrown only by the binder and pushed only by `publishPersistentFailure`.

## Test-double and gate rules (D-11 to D-17)

- D-11: each test file widens the stand-in in one commented block next to its namespace widening,
  with helpers named `asService`, `asPlatformAccessory`, `asStandInServiceClass` and
  `contextlessAccessory` as needed. No inline cast remains at a call site. No production type
  changes.
- D-12: `features/lib/hap.ts` changes only as a declared bounded consumer task, gets the D-01
  header in its own commit when touched, and keeps its full review for Phase 7.
- D-13: a case that proves only stand-in behavior moves to `hapWriteFidelity.test.ts` or is
  removed with a ledger reason.
- D-14: the `>=` floors stay. A floor changes only when it is wrong for the current tree.
- D-15: a shared static-gate helper exists only after a confirmed duplication finding.
  `fallow dupes` skips test files by default, so that route is reviewer judgment.
- D-16: `hapWriteFidelity.test.ts` gains only fixes of confirmed findings and cases for confirmed
  undetected disagreements.
- D-17: the rules that need a source module (mirrored pairing, one `describe()` per exported
  entrypoint, isolated direct coverage) are N/A for the four gates, recorded with a one-line
  reason. Every other rule applies.

## Ledger, reports and tracer

The ledger format is `05-FINDINGS.md`. Each finding keeps one stable ID with its exact rule, its
revision-qualified initial and current locations, its severity, its disposition and the actual
test and commit evidence (D-02). Dispositions are `pending`, `open`, `fixed` (only after a
correction round confirms it) and `rejected` (with a reason). The coordinator appends
`## Coordinator triage` to each report, and fixers append `## Repair history`.

The tracer command is `node .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs`. It
runs after every ledger change. `--require-clean <BATCH>` and `--headers --batch <BATCH>` run at
batch closure; `--require-clean all` and `--headers` run at closeout. Every committed ledger state
is also a resume record (`## Pausing and resuming a batch`).

## Checks and gates (D-07)

Owner and pair commands, from `05-RESEARCH.md` (Per-pair isolated direct-coverage commands):

| Pair | Owner test | Pair coverage |
| --- | --- | --- |
| alarmMute | `node --test dist-test/test/accessories/alarmMute.test.js` | `npm run test:coverage:direct -- src/accessories/alarmMute.ts test/accessories/alarmMute.test.ts` |
| services | `node --test dist-test/test/accessories/services.test.js` | `npm run test:coverage:direct -- src/accessories/services.ts test/accessories/services.test.ts` |
| customCharacteristics | `node --test dist-test/test/accessories/customCharacteristics.test.js` | `npm run test:coverage:direct -- src/accessories/customCharacteristics.ts test/accessories/customCharacteristics.test.ts` |
| customServices | `node --test dist-test/test/accessories/customServices.test.js` | `npm run test:coverage:direct -- src/accessories/customServices.ts test/accessories/customServices.test.ts` |
| serviceCatalogue | `node --test dist-test/test/accessories/serviceCatalogue.test.js` | `npm run test:coverage:direct -- src/accessories/serviceCatalogue.ts test/accessories/serviceCatalogue.test.ts` |
| controls | `node --test dist-test/test/accessories/controls.test.js` | `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` |
| pumpRecords | `node --test dist-test/test/accessories/pumpRecords.test.js` | `npm run test:coverage:direct -- src/accessories/pumpRecords.ts test/accessories/pumpRecords.test.ts` |
| reconciliation | `node --test dist-test/test/accessories/reconciliation.test.js` | `npm run test:coverage:direct -- src/accessories/reconciliation.ts test/accessories/reconciliation.test.ts` |
| staleMarking | `node --test dist-test/test/accessories/staleMarking.test.js` | `npm run test:coverage:direct -- src/accessories/staleMarking.ts test/accessories/staleMarking.test.ts` |
| basementGuardian | `node --test dist-test/test/accessories/basementGuardian.test.js` | `npm run test:coverage:direct -- src/accessories/basementGuardian.ts test/accessories/basementGuardian.test.ts` |

Run `npm run build:test` before the owner commands. The selector prints nothing on success; record
its raw exit. The four gates run through `npm run test:unpaired`; passing a gate path to
`test:coverage:direct` fails by design (D-17).

Each plan is one wave and ends with a fresh `npm run check`, recorded with the command, raw exit,
HEAD, Node and npm versions, UTC start and end, and the scenario and step counts. The 2,400-second
limit is a timeout, never a pass. Reuse a result only under
`.agents/skills/local-verification/SKILL.md`: same session and unchanged inputs. A planning-only
diff is checked with `git diff <verified-commit> -- . ':(exclude,glob).planning/**/*.md'` and no
new untracked executable input. Offline synthetic inputs only; no live vendor, hardware or
real-pump profile run.

## Prohibitions, assumption and limits

These three prohibitions bind every batch (text as in `05-09-PLAN.md`):

- P-05-01: MUST NOT let a style, comment or test-structure repair turn unknown, stale, omitted or
  invalid telemetry into a guessed or normal HomeKit value, or change a refusal order, HAP status,
  refusal cause or log line, UUID, subtype, display name or persisted context key; such a change
  happens only as a genuine bug fix with D-04 evidence.
- P-05-02: MUST NOT present a skipped, stopped, unreviewed or unobserved accessory review,
  regression history or check as completed, clean or verified.
- P-05-03: MUST NOT remove, move or restructure an accessory test case so that a plausible wrong
  implementation it caught before now passes, unless the ledger names where that protection now
  lives (D-13).

E-05-01 (the ACC-01 edge row, category unclassified, status unresolved) stays a flagged assumption
for the maintainer. Phase 4's counters and WINDOWS 46 to 58 stay untouched and unwaived. Earlier
full gates are history, not evidence for this phase.
