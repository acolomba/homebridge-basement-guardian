# State assertion review

Milestone: `code-review-sweep`. Plan: `01-03`. Scope: SC-03 and findings
introduced by its repairs. Production `src/device/state.ts` remains unchanged.

## Initial review

Reviewer: `/root/phase1_state/state_review`, role `gsd-code-reviewer`.
Revision: `33c4fff9f4b014960b631e7c7bf0ebd3abeb4b98`; no state-pair diff.

| ID | Requirement | Rule | Location at initial revision | Severity | Outcome |
| --- | --- | --- | --- | --- | --- |
| SC-03 | SPOT-03 | Unit-testing Assertions: independent whole values and public state; review BLOCKER for weak assertions | `test/device/state.test.ts:232-247,313-328,445-460,483,495-497,604` | BLOCKER | Accepted; repair and verification in progress |

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
