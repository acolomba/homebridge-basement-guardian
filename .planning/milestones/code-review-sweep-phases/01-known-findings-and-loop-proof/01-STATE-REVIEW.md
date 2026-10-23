# State assertion review

Milestone: `code-review-sweep`. Plan: `01-03`. Scope: SC-03 and findings
introduced by its repairs. Production `src/device/state.ts` remains unchanged.

## Initial review

Reviewer: `/root/phase1_state/state_review`, role `gsd-code-reviewer`.
Revision: `33c4fff9f4b014960b631e7c7bf0ebd3abeb4b98`; no state-pair diff.

| ID | Requirement | Rule | Location at initial revision | Severity | Outcome |
| --- | --- | --- | --- | --- | --- |
| SC-03 | SPOT-03 | Unit-testing Assertions: independent whole values and public state; review BLOCKER for weak assertions | `test/device/state.test.ts:232-247,313-328,445-460,483,495-497,604` | BLOCKER | Fixed in tracer and expansion commits; final round 1 clean |

`Object.isFrozen(undefined)` returns true. Frozen checks must first prove
complete expected snapshots or nested records. Version rows and metadata
watermark cases must read canonical storage after action; an old return value
can conceal a corrupt store. No production bug was identified.

Initial triage: opening 1, fixed 0, rejected 0, new 0, reopened 0, closing 1.
This triage is not a post-fix convergence round.

## Deferred seed warnings

Phase 3 owns the existing whole-value warnings at test lines 339-353, 415,
524, and 551; naming at 212; rationale comments at 418-422, 446-449,
567-570, 607-610, and 635-637. It also owns the source header, undefined-field
and readonly declarations at 38-62, and JSDoc at 83-143. These warnings are
deferred, not fixed or rejected here.

## Evidence scope

Node `v26.11.1`; synthetic fixtures only. Temporary mutations provide assertion
strength evidence, not production-bug RED. Every mutation must be restored
byte for byte and followed by compilation and passing owner tests.

## Flagged assumptions

E-07/SPOT-03 remains unclassified. E-08/SPOT-04 belongs to the auth batch.
The descriptor-less prohibition against guessed normal protection telemetry
remains flagged for phase-end judgment. These are not automatic passes.

## Tracer verification

Source revision: `07eaaadcc0b246808a483aac2279f45c8571ddb4`.
The state test diff adds complete merged-snapshot equality and complete
canonical-store equality for the version rows. Applying one stored-state
assertion to all three rows in the tracer avoids conditional test scaffolding;
the expansion still strengthens their returned snapshots.

`npm run build:test && node --test dist-test/test/device/state.test.js`
exited 0: 54 tests passed, zero failed, skipped, or cancelled.

Both negative controls ran compiled state owner tests with the TAP reporter:
`npm run build:test`, then
`node --test --test-reporter=tap dist-test/test/device/state.test.js`.

| Mutation | Named assertion | Mutation exit | Restoration |
| --- | --- | --- | --- |
| Return `undefined` for the merged water-level-7 / wifi-signal patch | `returns a merged snapshot no consumer can modify`: complete snapshot expected, actual `undefined`, `ERR_ASSERTION` | 1 | Exact bytes restored; build 0; owner 0, 54/54 |
| Store `nextSnapshot` on rejected version 4 but return `previous` | `leaves water level at 1 and the applied version at 5 for a patch at version 4`: stored water level 31/version 4 differs from expected 1/5, `ERR_ASSERTION` | 1 | Exact bytes restored; build 0; owner 0, 54/54 |

Restoration `git diff -- src/device/state.ts` is empty after each mutation.
Original source SHA-256 is recorded in the final mutation evidence. The
tracer proves the intended failure direction and restored GREEN before expansion.

## Expansion verification

Source revision: `2fabe98cb24efa6e743a8d966a85f28155b73369`, with the
owned test diff extending all remaining SC-03 cases. No other executable
input changed. Each experiment used `npm run build:test`, followed by
`node --test --test-reporter=tap dist-test/test/device/state.test.js`.
Every target executed and failed with `ERR_ASSERTION` at its complete-value
expectation. Each restoration then rebuilt and passed all 54 state tests.

| Mutation | Named test | Expected / observed | Mutation exit | Restored build / owner |
| --- | --- | --- | --- | --- |
| Omit `readings` from discovery data when nested readings are supplied | `freezes a structured value nested inside the telemetry record` | Expected `readings: { depth: 3 }`; actual record holds only `fault: null` | 1 | 0 / 0 |
| Replace nested-radio metadata with `{}` in `nextSnapshot` | `freezes a structured value nested inside the metadata record` | Expected `radio: { signal: -54 }`; actual metadata `{}` | 1 | 0 / 0 |
| Delete the entry on release rather than storing the released snapshot | `returns a released snapshot no consumer can modify` | Expected complete released snapshot; actual `undefined` | 1 | 0 / 0 |
| Store `nextSnapshot` for rejected version 7 while returning `previous` | `advances a watermark it already held on a patch that reports only device metadata, so a superseded telemetry patch stays refused` | Expected stored water level 1/version 8; actual 31/7; returned old snapshot still passes | 1 | 0 / 0 |

Tracer controls began at 20:19:52 and 20:19:58 UTC; expansion controls at
20:22:29, 20:22:43, 20:22:54, and 20:23:03 UTC on 2026-10-13.
All six restored source files matched their original bytes and SHA-256
`a685723083677ac98895ead0d815a3092b9c51b7fa28308c0dce67de786d2ec4`.
`git diff -- src/device/state.ts` was empty after each restoration. Full TAP
captures and exact replacement strings were retained during execution under
`/tmp/state-negative-evidence/`; the named failures and outcomes above are the
persistent evidence. These are negative controls, not production-bug reports;
no `01-STATE-RED-EVIDENCE.json` is warranted.

`npm run test:coverage:direct -- src/device/state.ts test/device/state.test.ts`
exited 0. The pair ran alone; the coverage runner requires all line, function,
and branch counts to be covered, so all three metrics are 100%.
`node --test dist-test/test/packaging/licenseHeaders.test.js` exited 0: 5/5
tests passed. This gate validates source classification; direct header
inspection also confirms the changed test's locked form.

## Commit and tool evidence

- `07eaaadcc0b246808a483aac2279f45c8571ddb4`: header-only commit;
  committed path `test/device/state.test.ts`; all foreground hooks passed.
- `2fabe98cb24efa6e743a8d966a85f28155b73369`: tracer assertions and this
  report; committed paths verified. An initial commit attempt failed on two
  unnecessary optional chains after whole-value equality narrowed the type.
  Removing those chains corrected the task-induced lint errors; restaging and
  a new foreground attempt passed all hooks. No failed attempt produced a commit.
- Tracer feedback `npm run build:test && node --test --test-reporter=tap
  dist-test/test/device/state.test.js` exited 0 at the tracer commit before
  expansion; all 54 tests passed.
- Fallow guard: no configured boundary or policy rules for either owned path.
  `./node_modules/.bin/fallow audit --base main` exited 0 before each commit.
- Required `SKIP=npm-check pre-commit run --files <owned changed files>`
  passed before foreground commits. Actual commit hooks remained enabled.

Expansion commit: `548f2fa2a04765c5e8530a2ad7ed7890ba53bfe7`; paths are
`test/device/state.test.ts` and this report. Foreground hooks passed, including
static checks, unpaired tests, and isolated state coverage. No tracked file was
deleted by any commit.

## Final re-review: round 1

Reviewer: `/root/phase1_state/state_review`, role `gsd-code-reviewer`.
Reviewed revision: `548f2fa2a04765c5e8530a2ad7ed7890ba53bfe7` against
initial `33c4fff9f4b014960b631e7c7bf0ebd3abeb4b98`. The persistent executable
diff contains only the owned test. The working source/test pair matched HEAD.

| Round | Opening | Fixed | Rejected | New | Reopened | Closing |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | 1 | 0 | 0 | 0 | 0 |

SC-03 is fixed. Final locations: discovery 242-255, nested telemetry 266-276,
version rows 355-374, metadata watermark 501-517, nested metadata 541-551,
merged snapshot 563-574, released snapshot 682-691. Header lines 1-13 satisfy
the locked form. No introduced, rejected, or reopened IDs were found.

The reviewer inspected all six mutation records and their named failures,
restored bytes, build/owner exits, and empty production diff. It reused passing
hook, owner, direct-coverage, license, and Fallow evidence for the unchanged
pair. Existing Phase 3 warnings remain deferred. Counts were sent to the
coordinator before any further work. No D-09 stop condition occurred.
