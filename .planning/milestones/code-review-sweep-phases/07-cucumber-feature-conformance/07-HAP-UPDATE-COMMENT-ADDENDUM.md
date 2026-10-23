# HAP update comment addendum

This is the maintainer-authorized, one-review addendum for
`CR-07-HAP-050`. It is separate from the HAP batch correction rounds.
The historical HAP Round 3 STOP and Plan 07-24 STOP remain unchanged.

## Source and verification

Commit `2a27c8d022a83f72924be6dc60c918db58f72406` changed only the
comment above `updateCharacteristic` in `features/lib/hap.ts`. It now
states that pinned HAP validates a non-error value before clearing status
and storing the validated value. Validation may change the value or fail
and preserve the prior status. The comment limits the stand-in's claim to
accepted values this plugin publishes. The fake implementation did not
change.

`npm run build:test` exited 0. The real/fake HAP parity module passed
22/22 tests, and the named status-normalization Cucumber scenario passed
1/1 with 3/3 steps. Fallow audit and normal commit hooks passed. On Node
`v26.12.1`, `TEST_CONCURRENCY=1 npm run check` exited 0 at the clean
source commit: static checks, unpaired tests, 130/130 default offline
Cucumber scenarios, 1400/1400 steps, and all 43 direct coverage pairs
passed. Cucumber reported 37.468 seconds. The default usage dry run had
no `UNUSED`, `UNDEFINED`, or `AMBIGUOUS` marker. The real-profile dry run
exited 0 with six skipped scenarios and 35 skipped steps.

## One independent review and STOP

One fresh read-only Claude Opus session read the complete current
`features/lib/hap.ts` at commit `2a27c8d`, blob
`b27ec95df04c4cadd39545ab2b4f39cae58ab4ad`, 770
newline-terminated lines. It also read `AGENTS.md`, Plan 07-27, the
Phase 7 review protocol, applicable Cucumber and TypeScript style rules,
and the pinned HAP 2.2.2 `updateValue` method in the installed dependency.
It read no earlier report, other repository source, Git history, or
secrets; it ran no checks and made no edits. The coordinator confirmed
the clean source revision, blob, and line count before and after review.

The reviewer confirmed that the edited `updateCharacteristic` comment
matches pinned HAP's validation order. It also found the same overbroad
claim in the exported `FakeHapCharacteristic.statusCode` JSDoc at
`2a27c8d:features/lib/hap.ts:199-201`: an ordinary push supposedly
clears status whatever its value. Pinned HAP returns from a failed
validation before clearing status. This is the same inaccurate
description of ordinary HAP updates, not a distinct cause or a new ID.
Therefore `CR-07-HAP-050` remains **open**.

The one-review equation is **opening 1 - fixed 0 - rejected 0 + new 0 +
reopened 0 = closing 1**. The addendum **STOPPED with no progress**. No
second review or source correction was made within it. A later, separately
bounded addendum may correct the remaining JSDoc while preserving this
STOP. HAP 051 also remains forward-open.

## Gate reuse

`git diff --exit-code 2a27c8d -- . ':(exclude,glob).planning/**/*.md'`
exited 0 after review, and the working tree had no untracked executable
input. Planning-only commits may reuse this full gate while those inputs
remain unchanged.
