# Phase 07 REAL_STEPS complete-file review

## Round 0 complete-file review

Claude Opus 5.5 reviewed the three current modules in a user-authorized, read-only
session. It read only those modules and the applicable project rules. It did not
edit files or run commands. The coordinator confirmed the committed revision
`d359735586293ae18afd0ec8044ebafddbe59890` and these complete contiguous
spans and Git blobs before triage:

| Path | Lines read | Blob |
| --- | ---: | --- |
| `features/real-pump/support/steps.ts` | 1–72 | `91e644aecf773767dac583ec6801aa118ec4d7a3` |
| `features/real-pump/support/heartbeatSteps.ts` | 1–27 | `57695cb738772966bfff41c36608fb0aa46a316d` |
| `features/real-pump/support/lifecycleSteps.ts` | 1–40 | `ee77a31410f6becc85cd39a1c9f3fb45e6f26863` |

The inventory blobs in `07-REVIEW-PROTOCOL.md` predate Plans 07-11 and 07-12;
the blobs above are the ones the reviewer actually read. The coordinator also
read the current three real features, `realWorld.ts`, and `cucumber.json` to
triage the reviewer's explicitly limited hypotheses. No real step ran.

## Round 0 findings and dispositions

All locations below are at commit `d359735`. `B` means BLOCKER and `W` means
WARNING. Each accepted finding is open until its cause is repaired and an
independent complete-file correction round confirms it. FEAT-02 applies to
step/support defects; FEAT-01 also applies to the step wording in 001.

| ID | Requirement | Rule | Observed location | Severity | Disposition and repair |
| --- | --- | --- | --- | --- | --- |
| CR-07-REAL_STEPS-001 | FEAT-01/02 | `cucumber/SKILL.md` §Review, plausible wrong implementation; `rules/steps.md` §Steps, whole outcome | `d359735:features/real-pump/support/steps.ts:48-49` | B | **Accepted, open.** “Discovers one device” passes when two systems are discovered. The account may legitimately own more than one physical system, so change this phrase to “at least one device” in all three real features and its binding; preserve the positive-count assertion. The three feature paths need an exact-path plan addendum before editing. |
| CR-07-REAL_STEPS-002 | FEAT-02 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source, Phase 1 header form | `d359735:features/real-pump/support/steps.ts:1` | W | **Accepted, open.** Add SPDX and separate copyright JSDoc. |
| CR-07-REAL_STEPS-003 | FEAT-02 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source, Phase 1 header form | `d359735:features/real-pump/support/heartbeatSteps.ts:1` | W | **Accepted, open.** Add SPDX and separate copyright JSDoc. |
| CR-07-REAL_STEPS-004 | FEAT-02 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source, Phase 1 header form | `d359735:features/real-pump/support/lifecycleSteps.ts:1` | W | **Accepted, open.** Add SPDX and separate copyright JSDoc. |
| CR-07-REAL_STEPS-005 | FEAT-02 | `cucumber/rules/layout.md` §Boundaries, step suffix and registration; §Vertical functions | `d359735:features/real-pump/support/steps.ts:13,44-72` | W | **Accepted, open.** Move discovery registrations to `real-pump/step_definitions/discovery.steps.ts`; the old path and generic name register steps from support. |
| CR-07-REAL_STEPS-006 | FEAT-02 | `cucumber/rules/layout.md` §Boundaries, step suffix and registration | `d359735:features/real-pump/support/heartbeatSteps.ts:9,20-27` | W | **Accepted, open.** Move registrations to `real-pump/step_definitions/heartbeats.steps.ts`. |
| CR-07-REAL_STEPS-007 | FEAT-02 | `cucumber/rules/layout.md` §Boundaries, step suffix and registration | `d359735:features/real-pump/support/lifecycleSteps.ts:9,17-40` | W | **Accepted, open.** Move registrations to `real-pump/step_definitions/lifecycle.steps.ts`. |
| CR-07-REAL_STEPS-008 | FEAT-02 | `cucumber/rules/steps.md` §Module structure, no exports; `rules/layout.md` §Boundaries, shared helpers | `d359735:features/real-pump/support/steps.ts:17-42`; importer `d359735:features/real-pump/support/lifecycleSteps.ts:11` | W | **Accepted, open.** Extract the shared `until` poller without behavior change into `features/lib/realPumpPolling.ts`; both modules import it with relative `.js` paths. |
| CR-07-REAL_STEPS-009 | FEAT-02 | `typescript-style/rules/comments.md` §Forbidden in comments and test titles, current code | `d359735:features/real-pump/support/steps.ts:2-7` | W | **Accepted, open.** The overview predicts later heartbeats/restart modules that already exist and claims lifecycle ownership. Make it describe discovery only. |
| CR-07-REAL_STEPS-010 | FEAT-02 | `typescript-style/rules/comments.md` §Forbidden in comments and test titles, current code | `d359735:features/real-pump/support/heartbeatSteps.ts:2-3` | W | **Accepted, open.** Its overview claims heartbeat and natural-update observation, but the module only waits and checks errors. Describe that behavior. |
| CR-07-REAL_STEPS-011 | FEAT-02 | `cucumber/rules/layout.md` §Vertical functions, step ownership | `d359735:features/real-pump/support/steps.ts:44-46`; `d359735:features/real-pump/support/lifecycleSteps.ts:17-23` | W | **Accepted, open.** Move “the harness starts” into the lifecycle registration module alongside restart and stop. |
| CR-07-REAL_STEPS-012 | FEAT-02 | `cucumber/SKILL.md` §Review, scenario must actually run its bound; `cucumber/rules/steps.md` §Tools | `d359735:features/real-pump/support/steps.ts:48,63`; `d359735:features/real-pump/support/lifecycleSteps.ts:25` | B | **Accepted, open.** Current features pass 30, 45, and 10 seconds to these bounded pollers, but no real-profile default timeout is registered. Installed Cucumber 13.2.1 defaults to 5 seconds. Give each registration a fixed Cucumber ceiling above its feature wait while `until` enforces the stated bound. |
| CR-07-REAL_STEPS-013 | FEAT-02 | `AGENTS.md` §Project, Privacy; `cucumber/SKILL.md` §Review, no private output | `d359735:features/real-pump/support/steps.ts:59-60` | B | **Accepted, open.** A failed snapshot assertion prints the real device ID, either in the interpolated message or the default actual/expected diff. Use fixed messages and boolean equality. |
| CR-07-REAL_STEPS-014 | FEAT-02 | `AGENTS.md` §Project, Privacy; `cucumber/SKILL.md` §Review, no private output | `d359735:features/real-pump/support/lifecycleSteps.ts:31-34` | B | **Accepted, open.** A failed strict equality prints token-cache fingerprints derived from private token-file contents. Compare through a boolean and a fixed message. |
| CR-07-REAL_STEPS-015 | FEAT-02 | `AGENTS.md` §Project, Privacy; `cucumber/SKILL.md` §Review, no private output | `d359735:features/real-pump/support/heartbeatSteps.ts:24-26` | B | **Accepted, open.** A failed deep equality prints full warning/error log lines, whose content is not constrained to a safe assertion payload. Assert the count is zero with a fixed message. The World already stores only fixed markers for unhandled rejections; retain that check. |

Opening accepted set: 001–015 (15). The reviewer reported the layout and
header issues as three file-specific causes each. Its stated total of 12
misadded its own rows; the coordinator counted 11 confirmed row causes, then
accepted four locally confirmed hypothesis causes (012–015) for 15. No
source edit preceded this triage.

## Rejected candidates and scope decisions

- A strict `deviceIds().length === 1` repair for 001 would reject a legitimate
  account with multiple systems. The phrase, rather than the assertion, is
  wrong for the project contract.
- The reviewer suspected the 10-second rejection wait might exceed its fixed
  10,000 ms Cucumber ceiling. The only feature invocation passes one second.
  Its 960-second heartbeat wait already has a 1,000,000 ms ceiling and the
  feature confirms that value. Neither needs a change for this cause.
- `realWorld.ts` returns a SHA-256 token-file fingerprint, fixed unhandled
  rejection markers, and redacted log lines; it registers account email and
  password as secrets. Fixed assertion messages still avoid exposing device
  IDs, credential-derived fingerprints, or arbitrary warning text on failures.
- The World calls the account runtime's start, stop, discovery, and read
  accessors. These steps contain no vendor command path. Cucumber's `real`
  profile imports only `dist-test/features/real-pump/**/*.js`, selects
  `@real and @read-only`, and will be checked only with `--dry-run`.
- `cucumber/rules/layout.md` ordinarily puts step modules directly under
  `features/step_definitions/`, but that directory is imported by the default
  offline profile. Plan 07-13's `features/real-pump/step_definitions/` is a
  deliberate isolation exception. The real-profile import glob includes it;
  the default import glob does not. The specific `.steps.ts` suffix and
  no-registration-in-support rules still apply.
- `realPumpPolling.ts` names the real-profile polling behavior rather than a
  generic catch-all `utils` module; it registers nothing and serves two
  separate real-profile step modules.
- The reviewer found `until`'s loop, typed `this` callbacks, `.js` imports,
  and existing 960-second wait ceiling sound. No live profile invocation is
  authorized to verify vendor behavior.

## Correction rounds

Round 0 opens 15 IDs. Each repair will name its ID and commit, then a
different read-only reviewer will read all three moved step modules and the
polling helper completely at their current committed blobs. For each
correction round record `closing = opening - fixed - rejected + new + reopened`
and the exact open set. Stop immediately if a positive closing count does not
fall, a fixed ID returns, or round four completes. Preserve any STOP as an
observation even if later user adjudication changes forward disposition.

## Round 0 repair evidence

Each accepted cause has one normal-hook source commit. These are feature and
test-support repairs; no production source changed, so no production
source/test RED pair was needed. The real profile was never run live.

| ID | Repair commit | Focused evidence |
| --- | --- | --- |
| 001 | `d9f9a31` | Three real features and the binding say “at least one”; build and real dry run passed 6/35 skipped. |
| 002 | `ab9be77` | Discovery header has SPDX, separate copyright, and overview; pre-commit and normal hooks passed. |
| 003 | `5fa7ccf` | Heartbeat header has the approved form; pre-commit and normal hooks passed. |
| 004 | `1288e20` | Lifecycle header has the approved form; pre-commit and normal hooks passed. |
| 005 | `4ea0759` | Discovery registrations moved to `real-pump/step_definitions/discovery.steps.ts`; build and real 6/35 dry run passed. |
| 006 | `49dc7ed` | Heartbeat registrations moved to `real-pump/step_definitions/heartbeats.steps.ts`; build and real 6/35 dry run passed. |
| 007 | `ccc5db3` | Lifecycle registrations moved to `real-pump/step_definitions/lifecycle.steps.ts`; build and real 6/35 dry run passed. Default usage dry run showed zero `UNUSED`. |
| 008 | `8338e98` | Shared `until` moved unchanged to `features/lib/realPumpPolling.ts`; both imports resolved; build and real 6/35 dry run passed. |
| 009 | `c782c0c` | Discovery overview now describes the current module; pre-commit and normal hooks passed. |
| 010 | `c1f83a0` | Heartbeat overview now describes the wait and failure check; pre-commit and normal hooks passed. |
| 011 | `1fffda4` | “Harness starts” moved beside restart and stop; build and real 6/35 dry run passed. |
| 012 | `c53a2a1` | Fixed Cucumber ceilings of 35, 50, and 15 seconds exceed the feature waits of 30, 45, and 10 seconds; `until` still enforces each feature bound. Build and real 6/35 dry run passed. This dry run proves binding, not live timing. |
| 013 | `6784a74` | Snapshot failure messages no longer include the real ID or an actual/expected ID diff; build and normal hooks passed. |
| 014 | `b457639` | Token-cache equality failure no longer prints either fingerprint; build and normal hooks passed. |
| 015 | `81fd0ed` | Warning/error assertion prints only a count and fixed message; build and normal hooks passed. |

At clean commit `ccc5db3`, the real-profile command
`./node_modules/.bin/cucumber-js --profile real --dry-run --format summary`
exited 0 with exactly six skipped scenarios and 35 skipped steps; the output
reported 0.0 seconds executing code. The default
`./node_modules/.bin/cucumber-js --dry-run --format usage` exited 0 and had no
`UNUSED` definitions. Build, pre-commit, Fallow audit, and normal commit hooks
passed for the individual changes. The correction reviewer must confirm the
current four complete files before the forward set may close.
