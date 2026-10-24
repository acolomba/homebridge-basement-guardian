# HAP status documentation addendum

This is the separately bounded, one-review addendum for
`CR-07-HAP-050` after Plan 07-27 stopped. The historical HAP Round 3
STOP and Plans 07-24/27 STOP remain unchanged.

## Source and verification

Commit `138ed63fc31f02f590de2f24b096a8dac0140154` changed only the
`FakeHapCharacteristic.statusCode` JSDoc in `features/lib/hap.ts`.
It now states that pinned HAP validates an ordinary push before clearing
status, and failed validation preserves the prior status and value. The
earlier corrected `updateCharacteristic` comment and the fake
implementation were unchanged.

`npm run build:test` exited 0. The real/fake HAP parity module passed
22/22 tests, and the named status-normalization Cucumber scenario passed
1/1 with 3/3 steps. Fallow audit and normal commit hooks passed. On Node
`v26.12.1`, `TEST_CONCURRENCY=1 npm run check` exited 0 at the clean
source commit: static checks, unpaired tests, 130/130 default offline
Cucumber scenarios, 1400/1400 steps, and all 43 direct coverage pairs
passed. Cucumber reported 37.707 seconds. The default usage dry run had
no `UNUSED`, `UNDEFINED`, or `AMBIGUOUS` marker. The real-profile dry run
exited 0 with six skipped scenarios and 35 skipped steps.

## Independent review

One fresh read-only Claude Opus session read the complete current
`features/lib/hap.ts` at commit `138ed63`, blob
`688d99d3e6547ae90ebf1c09ca926a767977b2bd`, 771
newline-terminated lines. It also read `AGENTS.md`, Plan 07-28, the
Phase 7 review protocol, applicable Cucumber and TypeScript style rules,
and pinned HAP 2.2.2's `updateValue` method. It read no earlier report,
other repository source, Git history, or secrets; it ran no checks and
made no edits. The coordinator confirmed the clean source revision,
blob, and line count before and after review.

The reviewer confirmed that both comments now match pinned HAP's order:
an error sets status without replacing the value; a non-error input is
validated first; failed validation preserves the prior status and value;
only successful validation clears status and stores the validated value.
It checked the rest of the module for the same broad claim and found
none. It raised no new candidate. The coordinator also read the local
`validateUserInput` implementation and confirmed its numeric branch may
coerce and clamp inputs, supporting the remaining wording in the
`updateCharacteristic` comment.

`CR-07-HAP-050` is **fixed forward**. The equation is **opening 1 - fixed
1 - rejected 0 + new 0 + reopened 0 = closing 0**. HAP 051 remains
forward-open. This forward closure does not make any earlier STOP clean.

## Gate reuse

`git diff --exit-code 138ed63 -- . ':(exclude,glob).planning/**/*.md'`
exited 0 after review, and the working tree had no untracked executable
input. Planning-only commits may reuse this full gate while those inputs
remain unchanged.
