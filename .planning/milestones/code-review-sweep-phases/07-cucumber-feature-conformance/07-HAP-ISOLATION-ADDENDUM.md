# HAP isolation addendum

This is the maintainer-authorized, one-review forward disposition of
`CR-07-HAP-028`. It is separate from Plan 07-09's correction rounds and
Plan 07-22's overview addendum. The historical Round 3 STOP and its six
open-at-STOP IDs remain unchanged.

## Source change

Commit `ed90a3919f46cf3e7182247480ad35545e878e13` changed only the
characteristic-isolation step in `features/step_definitions/hap.steps.ts`.
The step now keeps references to the two arrays it deliberately mutates.
Its `finally` restores each array's contents in place, so a regression that
shares an array cannot leave a module-level default changed after the
assertion fails. The comment explains the readonly-to-mutable casts. The
assertion still compares the second instance's complete property projection
to independent expected values. The complete step module has 628
newline-terminated lines and committed blob
`9c3b35aa3f8c51050feaa2edb3d7bf93dcd25d77`.

## One independent review

One fresh read-only Claude Opus session read the complete current step
module, lines 1–628 plus its final newline, at clean commit `ed90a39`.
It also read `AGENTS.md`, `07-23-PLAN.md`, `07-REVIEW-PROTOCOL.md`, the
applicable Cucumber and TypeScript style rules, the complete HAP stand-in,
and the complete `features/harness/fakes.feature`. It read no prior HAP
report or addendum, ran no commands, and edited no files. The coordinator
checked the revision, line count, blob, and clean tree before and after.

The reviewer found `CR-07-HAP-028` **fixed**. The step captures both array
references at lines 182–183, snapshots their contents at 184–185, and
restores those same arrays with `splice` in `finally` at 196–200. The
reason for the casts appears at 180–181. It confirmed that sharing either
array or the whole props object would fail the assertion while restoration
would keep later randomly ordered scenarios isolated. This satisfies
`.agents/skills/typescript-style/rules/types.md` §Types and the Cucumber
world rule against state leaking between scenarios.

The reviewer's two other warning candidates have prior dispositions. Its
objection to self-contained `Then` steps that exercise ephemeral local
objects is the pattern rejected under `CR-07-HAP-020` and `024` after the
maintainer's ruling; splitting these contracts into World-backed actions
would add state without observing another product behavior. Its helper-name
warning is the existing forward-open `CR-07-HAP-051`.
The accompanying placement note about the format-default comment is not a
separate false claim: that paragraph introduces the following
`assertFormatDefaults` check, while the general helper returns the state
of any characteristic. The review established no new ID.

Forward disposition: `CR-07-HAP-028` is **closed by this addendum**. The
forward-open HAP IDs are `032`, `048`, `050`, and `051`. No correction Round
4 was run, and this addendum does not claim a clean historical batch round.

## Verification

On Node `v26.12.1`, `npm run build:test` exited 0 and the focused “Fake
hap characteristics keep separate properties” scenario passed 1/1 with
3/3 steps. Pre-commit checks, Fallow audit, and normal commit hooks passed.
At clean source commit `ed90a39`, `TEST_CONCURRENCY=1 npm run check` exited
0: static checks, test build, unpaired tests, 130/130 offline Cucumber
scenarios, 1400/1400 steps, and all 43 isolated direct coverage pairs
passed. Cucumber reported 37.222 seconds. The default usage dry run exited
0 and contained no `UNUSED`, `UNDEFINED`, or `AMBIGUOUS` marker. The
real-profile dry run exited 0 with six skipped scenarios and 35 skipped
steps; no real-profile step body or vendor request ran. The working tree
was clean after these checks. Planning-only edits can reuse this full gate
only while executable inputs remain unchanged.
