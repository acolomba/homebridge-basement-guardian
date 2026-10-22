# HAP status addendum

This is the maintainer-authorized, one-review addendum for
`CR-07-HAP-032`. It is separate from Plan 07-09's correction rounds and the
earlier HAP addenda. The historical Round 3 STOP and its six open-at-STOP
IDs remain unchanged.

## Source and focused evidence

Commit `ed861fd70575cd47b6cc6b034d26f90cbcd69059` added two cases to
the existing status-normalization step in
`features/step_definitions/hap.steps.ts`. A plain `Error('-70412')` thrown
by a write handler must reject and store communication failure `-70402`,
while the same message on the update path becomes `-70412`. A bare thrown
`-70413`, below the pinned HAP status range, must also reject and store
`-70402`. The scenario compares a whole projection to independent literal
values. The focused scenario passed 1/1 with 3/3 steps.

Two temporary mutations to the compiled fake each made that scenario fail
at its intended fields: parsing the write handler's plain numeric-message
Error as a HAP status, and omitting the lower status bound. Both compiled
mutations were restored; the focused scenario passed again. The source
commit passed normal hooks on retry. The first hook attempt timed out in
the unrelated `AUTH-02` platform test at its 10-second limit; that test
passed alone in 16 ms before the normal hook retry passed.

## One independent review and STOP

One fresh read-only Claude Opus session read the complete step module at
`ed861fd`, committed blob `8883b8f8993f9743799dc542ab963b85d74489c5`.
The file had 653 newline-terminated lines; the read displayed lines
1–653 and the empty line after the final newline. The reviewer also read
`AGENTS.md`, `07-24-PLAN.md`, `07-REVIEW-PROTOCOL.md`, applicable Cucumber
and TypeScript style rules, `features/harness/fakes.feature`, and the
relevant installed HAP 2.2.2 implementation. It read no earlier HAP
review or addendum, ran no commands, and edited no files. The coordinator
checked the clean source revision, blob, and line count.

The reviewer confirmed that the new cases distinguish update-path numeric
message parsing from write-handler treatment and reject a bare number below
`-70412`. It found a remaining false-assurance gap in the stored-status
check: the immediately preceding case had already left `-70402` in
`on.statusCode`. A fake that returned the right rejection but left that
previous status unchanged could pass the stored-status projection. The
earlier thrown-`0` case had the same precondition weakness. Under the
Cucumber review rule, `CR-07-HAP-032` remains **open**. The one-review
addendum's equation is **opening 1 - fixed 0 - rejected 0 + new 0 +
reopened 0 = closing 1**, so it **STOPPED with no progress**. No second
review was run within this addendum.

The review also listed additional possible status inputs but did not show
a separate current plugin path or a distinct accepted cause. Its
`Then`-only observation repeats rejected HAP IDs 020/024. No new ID was
accepted from this review.

## Post-review correction, not yet reviewed

Commit `a7545ab8d4c04c18f3af5c7787c3dc987cdeaaa1` seeds a distinct
`-70408` status before each fallback write case, including the older
thrown-`0` case. A stale `-70402` from a previous case can no longer make
the stored-status assertion pass. The focused scenario passed 1/1 with
3/3 steps, and the normal hooks passed. The current complete step module
has 657 newline-terminated lines and blob
`2f017766417351f79f3ba0835a38751a6282d7c0`.

This correction happened after the one authorized review. It has not had
an independent complete-file review. The forward status of 032 remains
**open** pending a separately authorized review of this exact source.
The original HAP report and the one-review STOP above are not rewritten.

## Verification

On Node `v26.12.1`, `TEST_CONCURRENCY=1 npm run check` exited 0 at clean
source commit `ed861fd` and again at clean source commit `a7545ab`.
The latest gate passed static checks, the test build, unpaired tests,
130/130 offline Cucumber scenarios, 1400/1400 steps, and all 43 isolated
direct coverage pairs. Cucumber reported 37.238 seconds. The default
usage dry run exited 0 with no `UNUSED`, `UNDEFINED`, or `AMBIGUOUS`
marker. The real-profile dry run exited 0 with six skipped scenarios and
35 skipped steps; no real-profile step body or vendor request ran. The
working tree was clean after these checks. Planning-only edits can reuse
this full gate only while executable inputs remain unchanged.
