# HAP status correction review

This is the maintainer-authorized, one-review addendum for
`CR-07-HAP-032`. It reviews the correction made after Plan 07-24 stopped.
The historical HAP Round 3 STOP and Plan 07-24's one-review STOP remain
unchanged.

## Reviewed source and scope

At review, HEAD was `24a774ecb8c9b456f0a2ed7740c809dca37f93af` and the
working tree was clean. The step module was last changed at source commit
`a7545ab8d4c04c18f3af5c7787c3dc987cdeaaa1`; its committed blob was
`2f017766417351f79f3ba0835a38751a6282d7c0`, with 657
newline-terminated lines. The same blob and line count were confirmed after
the review.

The first CLI attempt exited 1 before reviewing because sandboxed DNS could
not reach the API server (`ENOTFOUND`). The authorized network-enabled
retry exited 0. One fresh, read-only Claude Opus review read the complete
657-line step module, `AGENTS.md`, Plan 07-25, the Phase 7 review protocol,
the Cucumber skill and its layout and step rules, and the TypeScript style
skill with its comments, functions, and review rules. It read no earlier
review report, Git history, or other source file; it ran no checks and made
no edits. The reviewer reported no new candidates.

## Finding disposition

The reviewer tested the plausible wrong behavior that returns the expected
rejection but leaves the stored status unchanged. The thrown-`0` case and
the two cases added in Plan 07-24 now start from `-70408`, while their
expected stored result is `-70402`. Leaving the prior value in place fails
the whole projection. The known bare `-70408` case expects that exact
rejection and stored status, so a fake that always stores `-70402` fails.
For the plain `Error('-70412')` handler and below-range bare `-70413`, the
projection also distinguishes wrong rejection and wrong stored statuses.

The reviewer could not inspect the fake implementation under this review's
source-disclosure boundary. The coordinator read `features/lib/hap.ts`
locally: `StandInCharacteristic.statusCode` is a writable number field at
line 310, and `handleSetRequest` clears it before the handler, then stores
the normalized refusal at lines 333–350. The seed therefore changes the
actual precondition of each case. The focused scenario passed 1/1 with
3/3 steps and the full gate passed at clean source commit `a7545ab`, as
recorded in `07-HAP-STATUS-ADDENDUM.md`.

`CR-07-HAP-032` is **fixed forward** at this reviewed source. The review
equation is **opening 1 - fixed 1 - rejected 0 + new 0 + reopened 0 =
closing 0**. The reviewer found no new candidate. HAP 048, 050, and 051
remain forward-open. This forward closure does not make either earlier STOP
round clean.

## Verification reuse

`git diff --exit-code a7545ab -- . ':(exclude,glob).planning/**/*.md'`
exited 0 after review, and the working tree had no untracked executable
input. On Node `v26.12.1`, the full `TEST_CONCURRENCY=1 npm run check` gate
at clean source commit `a7545ab` exited 0: 130/130 default offline
scenarios, 1400/1400 steps, and all 43 direct coverage pairs passed. The
default usage dry run had no `UNUSED`, `UNDEFINED`, or `AMBIGUOUS` marker;
the real-profile dry run had six skipped scenarios and 35 skipped steps.
Planning-only edits reuse that evidence because executable inputs did not
change.
