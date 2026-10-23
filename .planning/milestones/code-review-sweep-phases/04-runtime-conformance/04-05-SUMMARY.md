---
phase: 04-runtime-conformance
plan: "05"
subsystem: runtime
tags: [typescript, arrival-anchors, persistence, conformance]
status: complete
requires:
  - phase: 04-04
    provides: Completed policy repairs and verified wave-four baseline
provides:
  - Complete independent initial four-file TRUST review
  - Finite persisted-anchor validation with evidence-first active regressions
  - Independent durable bytes, error-state and temporary-file ownership observations
  - Compatible optional trusted temporary-path dependency
affects: [04-06, 04-10, runtime-conformance]
tech-stack:
  added: []
  patterns: [per-case temporary storage, complete independent observations, strict supplier mocks]
key-files:
  created:
    - .planning/phases/04-runtime-conformance/04-TRUST-REVIEW.md
    - .planning/phases/04-runtime-conformance/04-ARRIVAL-ANCHORS-RED-EVIDENCE.json
    - .planning/phases/04-runtime-conformance/04-05-SUMMARY.md
  modified:
    - src/runtime/arrivalAnchors.ts
    - test/runtime/arrivalAnchors.test.ts
    - .planning/phases/04-runtime-conformance/04-05-PLAN.md
key-decisions:
  - Reject whole persisted maps containing positive or negative overflow timestamps
  - Preserve native temporary naming through an optional trusted adapter dependency
  - Preserve the private temporaryPath helper when exact semantic queries are unavailable
  - Keep the original TRUST correction counter across both owning plans
requirements-completed: [RUN-01]
actuals:
  tokens: 59030
  tasks: 3
  commits: 12
plan_head_before: 23a2511ac6deb26869db8d3c44916623a27ec997
plan_head_after: 578b8b3e272990ef5608a72b0f437c6765a15b70
coverage:
  - id: D1
    description: Persisted anchors reject overflow maps and retain exact durable format and restart observations
    requirement: RUN-01
    verification:
      - kind: unit
        ref: test/runtime/arrivalAnchors.test.ts
        status: pass
      - kind: other
        ref: npm run test:coverage:direct -- src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: Supplied temporary paths preserve occupied files and clean up only owned writes
    requirement: RUN-01
    verification:
      - kind: unit
        ref: test/runtime/arrivalAnchors.test.ts
        status: pass
    human_judgment: false
duration: 57min recorded dispatch-to-measure window
started: 2026-10-15T02:17:28.993Z
completed: 2026-10-15
---

# Phase 4 Plan 5: Persisted Arrival Conformance Summary

**Arrival storage rejects non-finite timestamps and has independent durable-byte, restart and temporary-file ownership tests.**

Actual source: `src/runtime/arrivalAnchors.ts`.
Actual owner: `test/runtime/arrivalAnchors.test.ts`.
Continuing report: `.planning/phases/04-runtime-conformance/04-TRUST-REVIEW.md`.
Genuine regression record: `.planning/phases/04-runtime-conformance/04-ARRIVAL-ANCHORS-RED-EVIDENCE.json`.
Parent amendment: `.planning/phases/04-runtime-conformance/04-05-PLAN.md`.
Actual summary: `.planning/phases/04-runtime-conformance/04-05-SUMMARY.md`.

## Accomplishments

- A fresh independent typed reviewer read all four original TRUST files, all 1,237 lines and complete headers before the first repair. It loaded all five rulebooks, actual consumers, canonical decisions and source history.
- Positive and negative overflow JSON numbers now cause whole-file rejection. Legal zero and finite neighbors retain their existing behavior.
- Real per-case temporary storage proves the literal durable filename, complete JSON bytes, restored observations, forgotten keys and memory surviving failed writes.
- Both arrival headers conform. Present-tense documentation distinguishes restore, admission seeding and actual arrivals, and retains the unconfirmed opaque-key privacy premise.
- A bounded third task adds the optional trusted `ArrivalAnchorsOptions.temporaryPath` member. Existing callers and the native private naming algorithm remain unchanged.
- Three separate assertion controls reached intended failures. Exact source restoration and fresh GREEN checks followed every control.

All three amended plan tasks have completed their assigned arrival work.
The requirement field records this plan's contribution; RUN-01 remains Pending.
The parent owns shared records, wave-five full verification and phase judgments.
Complete TRUST correction belongs after the monitoring repair pass in 04-06.
No partial or full TRUST clean verdict is claimed here.

## Task Commits

| Task / cause | Actual commit | Exact scope |
| --- | --- | --- |
| 04-05-01 / 002 evidence | `4544c71c75e441751a143160b50b1dc8ebdc62b1` | Parent committed only RED JSON and report before GREEN |
| 04-05-01 / 002 finite validation | `06ef961ce7af2513529117cb60902e5ac4c1e67f` | Source, active owner, report |
| 04-05-01 / 001 headers | `d21c9ba3a85af561353ac0c4b78bd677904706c1` | Source, owner, report |
| 04-05-01 / 003 durable assertions | `99cd24bb060b51cbfef0cafc7ee7ed2a1253ea03` | Owner, report |
| 04-05-02 / 004 failed-write memory | `55663396e1e8f3cac55c5b6b0ae6a1d900de34d4` | Owner, report |
| 04-05-02 / 008 AAA | `05e495f6baf45f85d0593bc09946ccb1a5e6887e` | Owner, report |
| 04-05-02 / 006 and arrival 015 | `0e4602008f9c1a8f35a045100fd066f769190aef` | Source, report |
| 04-05-02 / 007 privacy narrative | `d4454b2e5fad2c3f2cc9d1b23f6929b1487cfb47` | Source, report |
| Arrival evidence closeout | `9617bd8f26dbb7c162f7d99eb45a61de8b4135f7` | Report only |
| Parent bounded amendment | `42fea06ce69128285685b53859fe30a278d4ee43` | Plan only, before 005 API edit |
| 04-05-03 / 005 dependency | `02ba8853fd5dfbbbb24760f1f6b9cac1189b6924` | Source, owner, report |
| 002 comment followup | `578b8b3e272990ef5608a72b0f437c6765a15b70` | Owner comment, report |

The on-disk `gsd-plan-head-before-04-05` ledger contains the real baseline
`23a2511`. It was persisted before the executor's first source commit using
the baseline already established before the parent's evidence-only commit.
It includes that actual parent commit; it was not inferred from a later HEAD.
Native `closeout-measure` measured 12 commits and 236,118 realized diff characters
through `578b8b3`: ceiling(chars / 4) = 59,030 tokens, on the estimate's scale.
This excludes the separate execution-metadata commit and summary content.
There are eight original arrival cause commits, one same-cause comment followup,
and three planning/report commits. No tracked file was deleted.
Five realized paths changed before this summary. No conditional seed helper
was justified or created. Every cause stayed within five concrete paths;
005 includes the parent's earlier plan amendment as its fourth path.

## Independent Review and Continuous Arithmetic

Initial reviewer: `/root/phase4_trust_first/trust_initial_review`, typed
`gsd-code-reviewer`, at `23a2511`. All typed fixers loaded the complete five
books and ran serially with terminal waits. Model resolution returned an empty
explicit model and actual Codex effort `high` before each dispatch/followup.

Original source/owner inventory: arrivalAnchors 210/164 lines and
monitoringHealth 321/542 lines. No helper or external code adaptation joins it.
Both current arrival full headers were separately inspected; source-only
packaging checks do not certify owner headers.

| Set | IDs / count |
| --- | --- |
| Round 0 accepted | 001–015; 15, including 5 BLOCKER and 10 WARNING |
| Fully applied arrival repairs | 001–008; 8 |
| Partially applied | Arrival portion of 015; monitoring portion remains |
| Monitoring pass still required | 009–014 and monitoring 015 |
| Independently fixed / rejected / reopened | 0 / 0 / 0 |
| Current formally open | All original 15 IDs |
| Continuous correction counter | 0 |

Round 0 remains `0 - 0 - 0 + 15 + 0 = 15`.
Owner runs, source controls, initial clarifications and arrival repair slices
are not correction rounds. No full correction ran, no D-03 trigger occurred,
and no previous human waiver was reused. The complete next correction must
review both sources, both complete owners and every actual addition.

S-04-03 required-absence advice and S-04-04 readonly advice were rejected for
these factory interfaces using their actual contracts and callers, not converted
automatically. S-04-05 produced exact independent-observation repairs.
S-04-07 was accepted as 006 after blame/log/tree evidence at
`b19ea5890a3fe6b2168a5965271d564cfa0fd8d9`: the original-release store already
had the current format, and current admission seeds only an absent anchor.
No migration or release guarantee follows. S-04-08's ACCOUNT portion remains
with that later batch; the distinct arrival privacy repair is 007.

## Genuine Bug Provenance and Separate Controls

Only 002 is a genuine production bug. Unchanged production blob
`0b04d48709406f65da2457524e6f5226ed12cc4d` produced native owner RED:
9 tests, 7 pass and 2 intended `ERR_ASSERTION` failures for literal `1e309`
and `-1e309` beside a finite neighbor. Both whole-map rejection expectations
failed at their intended assertions, without compilation or setup failure.
Final RED ran 2026-10-15T02:34:30.431Z–02:34:30.689Z, raw exit 1,
Node v26.11.1 / npm 11.20.0. The first pre-format capture remains complete
inside `priorEvidence[0]`. Both current and recursively archived named targets
use the same installed `classifyRedEvidence` and return `RED_EVIDENCE_OK`.

The real chain is `23a2511` source -> `4544c71` planning-only evidence ->
`06ef961` minimum GREEN source plus active regressions. The parent verified
the evidence commit's exact two paths and unchanged production through it.
The saved active owner patch matched GREEN before subsequent declared
assertion/header changes. Its earlier formatter-only difference is retained.
No failing code test was committed, hidden or skipped. RED JSON blob
`cac1f810efb536ba384c05bca9396604ccd72d6c` remains unchanged.

| Maintenance cause | Deliberate wrong behavior | Actual result / restoration |
| --- | --- | --- |
| 003 | Change exported durable filename | Named literal-filename assertion failed, raw 1; exact source restored, rebuilt 9/9 and isolated 100% passed |
| 004 | Clear memory in persist's error branch | Named complete-memory assertion failed, raw 1; exact source restored, rebuilt 9/9 and isolated 100% passed |
| 005 | Change exclusive `wx` to `w` | Named occupied-file directory assertion failed, raw 1 before missing-file reads; exact source restored, rebuilt 141/141 and arrival isolated 100% passed |

All three controls passed typecheck/lint/build before their intended failure.
Native TAP, mutation patches, saved original source, exact restore comparisons
and GREEN outputs remain in the continuing report/native records. These
controls are separate from 002 RED and add no fabricated bug history.

## Check Results

All commands ran at repository-root cwd on Node **v26.11.1**, npm **11.20.0**.
The continuing report retains exact argv, scope, revision/blob, UTC interval,
raw exit, separate native streams and exact dirty/untracked input snapshots.
Current source blob is `aa8bdebcfa86c8ad78b8f0c3d2d614252302fa64`;
owner blob is `8567b3d5f21044994b5ea831e15a0b758a121115`.

| Check / native records | Actual result |
| --- | --- |
| `npm run typecheck`, complete-pair ESLint and Prettier | 0; both strict projects and complete arrival files |
| `npm run build:test` then native arrival/account owners, dependency-restored-owners | 0; 141 passing tests, including 13 arrival, no failures/skips/cancellations; 03:05:30.197853Z–03:05:30.749040Z at 42fea06 with exact restored final source bytes |
| `npm run test:coverage:direct -- src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts`, comment-direct | 0; latest 13-test owner and isolated 100% lines/functions/branches; 03:10:37.064154Z–03:10:40.671753Z at 02ba885 with final owner comment bytes |
| Account direct selector, dependency-account-direct | 0; actual production consumer isolated 100%, unchanged account source/owner; 03:05:01.088415Z–03:05:04.868065Z |
| Four refreshed exact options/factory impact queries | 0, complete; separate actual tsconfig.json and tsconfig.test.json at 42fea06 before 005 edit |
| Exact private temporaryPath queries | 2, unavailable; retained unmet evidence, no removal or signature/body change permitted |
| Recorded-base Fallow audits | 0 / verdict pass before every actual commit; base 23a2511; no configured architecture/rule-pack detector claim |
| Exact-file pre-step, stage and foreground normal commits | Clean 0 before staging; normal hooks pass, including applicable check:commit |
| Current/recursive genuine RED classifiers and real Git chain | 0 / RED_EVIDENCE_OK; all targets and actual evidence-before-fix ancestry |
| Stub/deletion/inventory checks | No functional stubs, skipped tests, helper additions, external adaptation or tracked deletions |
| Installed generic summary verifier and extractor | 0; JSON passed:true, files found, commits exist, self_check:passed; structured extraction matches declared outputs |

Native directories are `/private/tmp/guardian-04-trust-initial-native/`,
`/private/tmp/guardian-04-arrival-red-native/`,
`/private/tmp/guardian-04-arrival-green-native/` and
`/private/tmp/guardian-04-arrival-handoff/`. The latter contains separate
`conformance-*`, `dependency-*`, `comment-*` and closeout records.
Root evidence/amendment streams use the
`/private/tmp/guardian-04-arrival-root-evidence-*` and
`/private/tmp/guardian-04-arrival-amendment-*` prefixes.

Direct selectors enforce complete isolated LCOV then delete their temporary
files. No numerical denominator is invented and no declaration exception is
used. Selected runs do not refresh merged all-pair coverage. The parent's
prior full wave-four gate is historical: its literal Markdown-only reuse
predicate failed on a planning state.json timestamp change. No general JSON
exception or current full-gate claim is made. The parent still owes the full
combined wave-five gate on current inputs and later phase-end checks.

## Declared Threat Mitigations

T-04-09 retains whole-map invalid recovery, exact durable filename/map keys,
wall timestamps and atomic write ownership. Overflow now fails validation.
T-04-10 retains scoped local identifier persistence and its unconfirmed
opaque-key premise; all examples remain synthetic and sanitized.
The parent's amendment declares **high T-04-21** for trusted temporary-path
supplier -> filesystem ownership. Tests prove occupied files stay unowned,
only successfully created temporary files are cleaned up, supplier errors stay
within persist's existing boundary, and omitted suppliers retain native naming.
T-04-21 extends the initial twenty-threat inventory and must remain visible
to 04-06/04-10 security and seal audits. No new inventory path was introduced.
T-04-SC is preserved: no package installation or substitution occurred.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Deviations and Evidence Limits

- Finding 005 required a bounded third task. Work stopped at an internal coordinator checkpoint; the parent committed the one-path amendment before any optional-member edit. No new user policy decision was inferred.
- The evidence-only commit was handed to the parent under the protocol's explicit ownership rule. Its actual hash authorized GREEN; prepared evidence alone did not.
- A sandbox audit returned 2 because it could not create the base worktree; its authorized retry returned 0. A 005 stage failed on external linked-worktree metadata, and an unstaged commit assertion stopped before Git commit; authorized retries succeeded. All attempts remain retained.
- The first RED owner needed a formatter-only assertion layout change. Both complete RED captures and the formatting failure remain preserved recursively.
- A header apply-patch context attempt failed without changing files. A standalone token comparison later failed because it mishandled template continuations; a real compiler-based emitted-code comparison passed. Neither failed attempt is reported as passing evidence.
- A final typed-fixer turn hit model capacity after staging. Fresh required resolution and the same agent's followup completed the normal commit using the retained clean pre-step/stage evidence. No source or index work was discarded.
- The first summary-verifier launch passed an environment assignment as an executable and stopped in the recorder before starting the check. The failed launch is retained; the corrected env-prefixed command and JSON verifier both returned 0.
- The same 002 cause received a final owner-comment followup because its old typeof-only rationale became stale after finite validation. Emitted test statements and production bytes remain unchanged by that followup.
- Exact private-helper semantic queries remain unavailable. The helper name, signature, full body and call-time randomness are preserved; public neighbors do not substitute for private deletion evidence.
- WINDOWS 46/47 remain OPEN/unwaived historical exceptions. Prior missing hook streams and historical Gemini counts are not reconstructed by these current checks.

No known functional stub, skipped target, unrun assigned focused verify or
authentication gate remains. Placeholder device strings are intentional
sanitized synthetic keys. Monitoring repairs, complete TRUST correction,
combined gates and phase/human judgments remain explicitly with their owners.
Shared STATE, ROADMAP, REQUIREMENTS, WINDOWS and central FINDINGS were untouched
by this executor. No live vendor, hardware, real-pump profile, private account
input, new storage format, migration, privacy permission or release promise
is claimed.

## Self-Check: PASSED

All six realized output paths exist. All 12 listed commits are actual ancestors
of the recorded head, with their declared scopes and no tracked deletions.
The persisted baseline and measured commit/token counts agree.
Native `closeout-native` returned 0 / `ARRIVAL_CLOSEOUT_OK`, independently
confirming current source/owner blobs, complete headers, unchanged consumers
and private helper, evidence-before-fix ancestry, both recursive RED records
and four target classifications, retained check streams and three intended
controls. The actual helper inventory is empty. All 15 TRUST IDs remain pending
complete independent correction, counter 0. Parent-owned full verification and
shared-state advancement remain pending.
