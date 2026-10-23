# HAP overview addendum

This is the maintainer-authorized, one-review forward disposition of
`CR-07-HAP-025`. It is separate from Plan 07-09's correction rounds. The
historical Round 3 STOP and its six open-at-STOP IDs remain unchanged.

## Source change

Commit `8785450c80dc8493ca7b72f142227877756ee5c6` removed the
`addService` claim from the `features/lib/hap.ts` file overview. The new
paragraph says that the injected `Service` and `Characteristic` members are
constructible base classes. `addService` is implemented by the separate
`features/lib/homebridgeApi.ts` fake. No executable code changed. The
complete HAP file has 769 newline-terminated lines and committed blob
`1249430a36662b1ee0f0751f32e95445f8dab42d`.

## One independent review

One fresh read-only Claude Opus session read the complete current HAP file,
lines 1–769 plus its final newline, at clean commit `8785450`. It also
read `AGENTS.md`, `07-22-PLAN.md`, `07-REVIEW-PROTOCOL.md`, all TypeScript
style rules, and the Cucumber skill and stand-in rule. It read no prior HAP
report or addendum, ran no commands, and edited no files. The coordinator
checked the source revision, line count, blob, and clean tree before and
after the review.

The reviewer found `CR-07-HAP-025` **fixed**. The current overview at
`features/lib/hap.ts:7-29` makes no `addService` claim, and the file has no
`addService` member. This satisfies the current-code comment rule in
`.agents/skills/typescript-style/rules/comments.md` §Comments and test
titles. Its one formal additional warning concerns uppercase `UUID`
constructor parameters at lines 261, 314, 460, and 479. That is the existing
forward-open `CR-07-HAP-048`; the reviewer did not establish a new ID.

The reviewer listed three non-finding wording observations. The proposed
controller-write validation difference is not established for the direct
`handleSetRequest(value)` call: pinned HAP 2.2.2 validates a client-supplied
value only when its `connection` argument is defined. The fake and direct
fidelity test call this method without a connection. Broader input validation
was already triaged under `CR-07-HAP-042`; the update-path comment remains
open under `CR-07-HAP-050`. The phrase about a status named by the handler
at line 211 is qualified by the same interface's status explanation at
lines 196–203 and the status normalization code. The Battery comment at
line 661 is resolved by the explicit `StatusActive`/`StatusFault` names at
lines 720–721. These observations do not add a finding to this one-review
addendum.

Forward disposition: `CR-07-HAP-025` is **closed by this addendum**. The
forward-open HAP IDs are `028`, `032`, `048`, `050`, and `051`. No correction
Round 4 was run, and this addendum does not claim a clean historical batch
round.

## Verification

On Node `v26.12.1`, pre-commit checks, Fallow audit, and the normal commit
hooks passed. At clean source commit `8785450`, `TEST_CONCURRENCY=1 npm run
check` exited 0: static checks, test build, unpaired tests, 130/130 offline
Cucumber scenarios, 1400/1400 steps, and all 43 isolated direct coverage
pairs passed. Cucumber reported 37.209 seconds. The default Cucumber usage
dry run exited 0 and contained no `UNUSED`, `UNDEFINED`, or `AMBIGUOUS`
marker. The real-profile dry run exited 0 with six skipped scenarios and 35
skipped steps; no real-profile step body or vendor request ran. The working
tree was clean after these checks. Planning-only edits can reuse this full
gate only while executable inputs remain unchanged.
