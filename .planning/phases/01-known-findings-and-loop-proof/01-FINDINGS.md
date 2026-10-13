# Phase 1 findings ledger

Milestone: `code-review-sweep`. Audited on 2026-10-13 at combined source
revision `218ab0cac702c5699ced277aaf499fe5f5194d54`, Node v26.11.1.
Scope: SC-01 through SC-05 and findings introduced by their repairs.
All five accepted seeds are fixed. No introduced, rejected, reopened, skipped,
or open accepted finding remains. Hardware and live vendor checks are outside
this scope. Archived milestone records supply no current completion evidence.

## Findings in first-round and stable-ID order

Initial triage precedes each batch's first post-fix round. All seeds first
appear at triage (round 0); all close at that batch's round 1.

| ID | Requirement | Rule and original location | Severity | First round | Outcome and current location | Evidence / fix |
| --- | --- | --- | --- | --- | --- | --- |
| SC-01 | SPOT-01 | Unit-testing Assertions/bytes and explicit dependencies; `test/cloud/auth.test.ts:542-563` at `109fda7` | BLOCKER | 0 | Fixed; exact occupied-path byte/mode/directory/log checks at `test/cloud/auth.test.ts:847-889` | Exclusive-create negative control; `221581cdd2f1fa370e4e0c515efeba97667d5198` |
| SC-02 | SPOT-02 | Unit-testing Assertions/Data-driven cases; `test/accessories/controls.test.ts:591-623` at `07424ba` | BLOCKER | 0 | Fixed; fresh exact-warning cases at `test/accessories/controls.test.ts:424-516,599-620` | Same-status wrong-cause negative control; `906daa9647fc51273d46c3207dd16ddb3520a16c`, `d023bbb0381050abdab195e1f8abb94e6036c658` |
| SC-03 | SPOT-03 | Unit-testing Assertions/public state; `test/device/state.test.ts:232-247,313-328,445-460,483,495-497,604` at `33c4fff` | BLOCKER | 0 | Fixed; complete values before freeze and canonical-store reads at `test/device/state.test.ts:242-276,355-374,501-517,541-574,682-691` | Six negative controls; `2fabe98cb24efa6e743a8d966a85f28155b73369`, `548f2fa2a04765c5e8530a2ad7ed7890ba53bfe7` |
| SC-04 | SPOT-01 | Explicit dependencies for filesystem behavior; hidden temporary-name entropy at `src/cloud/auth.ts:211-212,246-247` at `109fda7` | BLOCKER | 0 | Fixed; optional complete-path producer at `src/cloud/auth.ts:95,264` | Exact-path occupied-file and fallback cases; `3c9327e33457231756d7c765208dc8bb14c5a8c4` |
| SC-05 | SPOT-04 | D-04/D-05 independent caller cancellation and shared attempt ownership; `src/cloud/auth.ts:455-460,477,482` at `109fda7` | BLOCKER | 0 | Fixed; per-caller waiting/shared controller at `src/cloud/auth.ts:444-484,521-570` | Genuine production RED `919d70d2c4dd054aa146a5e46e01dd97aa2f5d3c`; GREEN `3878103c489f9042b573e2ac47ce56d582c0b021` |

SC-01 and SC-04 retain separate IDs: one repairs a non-discriminating assertion;
the other exposes the exact production temporary path. SC-05 is the sole
observed production bug. No genuine introduced bug or new CR ID was reported.
No rejection reason is applicable because all five seeds were accepted.

## Chronological review rounds

Triage is not a convergence round. Tracer feedback and owner checks do not
create extra rounds. The independent reviewers inspected the entire triaged
batch and the changes introduced by its fixes.

| Batch / round | Reviewer | Reviewed revision / baseline | Opening | Fixed | Rejected | New | Reopened | Closing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Auth / 1 | `auth_review_initial`, gsd-code-reviewer | `221581c` / `109fda7` | 3 | 3 | 0 | 0 | 0 | 0 |
| Controls / 1 | `/root/phase1_controls/controls_review`, gsd-code-reviewer | `d023bbb` / `07424ba` | 1 | 1 | 0 | 0 | 0 | 0 |
| State / 1 | `/root/phase1_state/state_review`, gsd-code-reviewer | `548f2fa` / `33c4fff` | 1 | 1 | 0 | 0 | 0 | 0 |

Auth: `3 - 3 - 0 + 0 + 0 = 0` (SC-01, SC-04, SC-05).
Controls: `1 - 1 - 0 + 0 + 0 = 0` (SC-02).
State: `1 - 1 - 0 + 0 + 0 = 0` (SC-03).
Total: `5 - 5 - 0 + 0 + 0 = 0`.

Each report explicitly records zero open findings and reports its counts to the
coordinator. All three final reports exist; missing evidence was not treated
as a clean result. No positive-count stall, returning fixed finding, or fourth
round occurred. D-09 therefore required no maintainer pause or retry/skip/stop
decision. The reusable [protocol](./01-REVIEW-PROTOCOL.md#review-rounds-d-07-d-08-d-09)
defines the immediate all-batch stop if any future round meets those conditions.

## SC-05 production regression provenance

Named test: `keeps the joined caller grant alive when the first caller aborts`
in `test/cloud/auth.test.ts`. Command:
`npm run build:test && node --test --test-reporter=tap dist-test/test/cloud/auth.test.js`.
Against unchanged source `109fda723d684b842e710786ddf08162ee65f816`,
the 2026-10-13T19:53:33.831Z Node v26.11.1 run exited 1: 52 active tests,
51 passed, one failed, zero cancelled/skipped. Its `deepStrictEqual` expected
the joined caller to fulfill with the synthetic token; it observed rejection.
This is an executed behavioral assertion failure, not a setup or permission error.

The [RED record](./01-AUTH-RED-EVIDENCE.json) contains the full active test
patch, unchanged native TAP, source revision, command/status, timestamp,
expected/actual outcome, and semantic assessment. The original fields at
evidence commit `919d70d` exactly match the current record; later mutation
evidence is in a separate field. The classifier was rerun during this audit:

```sh
node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence .planning/phases/01-known-findings-and-loop-proof/01-AUTH-RED-EVIDENCE.json --raw
```

Exit 0; `passed: true`, `RED_EVIDENCE_OK`, `target_test_failed`, valid TAP.
Semantic inspection confirms the intended joined-caller failure.

`git merge-base --is-ancestor` proves source < evidence < fix and that all
three are reachable from this feature branch. `git show --name-only` proves
`919d70d` changes only the planning RED JSON. `3878103` changes only
`src/cloud/auth.ts` and `test/cloud/auth.test.ts`; its patch contains the active
named regression and production cancellation fix. This follows the maintainer's
explicit D-06 evidence-first exception, resolved in live CONTEXT.md. Literal
active-test-first or commit-subject heuristics do not override that decision.

## Assertion-strength evidence and restoration

All experiments use synthetic fixtures. They establish discrimination of the
repaired assertions; they do not add production-bug reports.

| Seed | Named target / negative control | Observed failure | Restored GREEN and persistent record |
| --- | --- | --- | --- |
| SC-01 / SC-04 | `AUTH-02 preserves an occupied injected temporary file and the prior cache bytes`; remove only `flag: 'wx'` | Native TAP owner exit 1; intended complete earlier-target Buffer assertion fails; 60 pass, 1 fail | Source equals `3c9327e`; rebuilt isolated auth pair 100%; `01-AUTH-RED-EVIDENCE.json` separate `mutationEvidence` and `01-AUTH-REVIEW.md` |
| SC-02 | `logs the exact refusal for a runtime with no way to reach the vendor`; replace transport-unavailable cause with confirmed-offline cause, keeping `-70412` | Compiled targeted TAP exit 1; intended complete one-element warning-array assertion fails | Original source blob `1760d2c767d6286acd3b7145a1d3e85621315e62`; empty source diff; build/57-test tracer GREEN, final 63/63 and isolated 100%; `01-CONTROLS-REVIEW.md` |
| SC-03 | `returns a merged snapshot no consumer can modify`; return undefined | Owner TAP exit 1; complete snapshot assertion fails | Exact source restoration, rebuilt 54/54; `01-STATE-REVIEW.md` |
| SC-03 | `leaves water level at 1 and the applied version at 5 for a patch at version 4`; corrupt canonical storage while returning previous | Owner TAP exit 1; stored 31/4 differs from expected 1/5 | Exact source restoration, rebuilt 54/54; `01-STATE-REVIEW.md` |
| SC-03 | `freezes a structured value nested inside the telemetry record`; omit readings | Owner TAP exit 1; complete readings expectation fails | Exact source restoration, rebuilt 54/54; `01-STATE-REVIEW.md` |
| SC-03 | `freezes a structured value nested inside the metadata record`; replace radio metadata with empty object | Owner TAP exit 1; complete radio expectation fails | Exact source restoration, rebuilt 54/54; `01-STATE-REVIEW.md` |
| SC-03 | `returns a released snapshot no consumer can modify`; delete released entry | Owner TAP exit 1; complete released-snapshot expectation fails | Exact source restoration, rebuilt 54/54; `01-STATE-REVIEW.md` |
| SC-03 | `advances a watermark it already held on a patch that reports only device metadata, so a superseded telemetry patch stays refused`; store refused version 7 while returning previous | Owner TAP exit 1; stored 31/7 differs from expected 1/8 | Exact source restoration, rebuilt 54/54; final isolated state pair 100%; `01-STATE-REVIEW.md` |

Commands, Node v26.11.1, experiment revisions, and restoration timestamps are
in the linked batch records. Controls restoration completed by 20:10:11 UTC;
state experiments ran from 20:19:52 through 20:23:03 UTC. State restoration
SHA-256 is `a685723083677ac98895ead0d815a3092b9c51b7fa28308c0dce67de786d2ec4`.
No mutation was committed. Controls/state production remain unchanged; no
conditional production-bug RED JSON is warranted for those batches.

## Real commit/path audit

All full hashes above and below were checked as ancestors of HEAD. Actual paths
were inspected with `git show`; no recorded task commit deletes a tracked file.
The batch reports record passing Fallow audits, required pre-commit steps, and
enabled foreground commit hooks. Incremental hooks supply focused evidence.

| Commit | Actual changed paths / purpose |
| --- | --- |
| `919d70d` | `01-AUTH-RED-EVIDENCE.json` only; production RED evidence |
| `3878103` | Auth source/test; SC-05 fix and active regression |
| `bb879a7f8e62437bf03c0af804ff3677d706cae1` | Auth source/test; separate headers |
| `3c9327e` | Auth source/test; SC-04 full-path seam |
| `221581c` | Auth test only; SC-01 assertions |
| `2b08571202c2b1ea73b41808073d983ee8129835` | Controls test only; header |
| `906daa9` | Controls test and `01-CONTROLS-REVIEW.md`; tracer |
| `d023bbb` | Controls test only; eight exact warning cases |
| `07eaaadcc0b246808a483aac2279f45c8571ddb4` | State test only; header |
| `2fabe98` | State test and `01-STATE-REVIEW.md`; tracer |
| `548f2fa` | State test and `01-STATE-REVIEW.md`; expansion |

Process paths in this table are under this phase directory. Short hashes refer
to the full hashes in the findings table or header rows; the three batch
summaries also retain full hashes. Git object contents and ancestry are the
authority; project commit titles deliberately omit planning identifiers.

## Verification scope and reuse

Final owner reports: auth 61/61, controls 63/63, state 54/54; all exit 0.
Each pair independently reaches 100% lines/functions/branches. The coordinator's
same-session `npm run check` at `218ab0c`, Node v26.11.1, completed at
2026-10-13T20:27:52Z with exit 0. Static checks passed; 104 Cucumber scenarios
and 1156 steps passed; all 43 isolated pairs passed and merged into direct LCOV.

Reuse was checked against the exact retained dirty diff and untracked lock
contents, not just a path list. The baseline and current diff are byte-identical;
the sole untracked file is the same planning milestone lock. The generic
non-Markdown exclusion still shows baseline `.planning/state.json`; its bytes
are part of the exact verified diff and introduce no executable input. Build
inputs are unchanged. The log is `/private/tmp/guardian-phase1-full-check.log`;
the retained comparisons are `/private/tmp/guardian-phase1-verified.diff` and
`/private/tmp/guardian-phase1-verified-milestone.lock`. Planning Markdown commits
preserve this evidence under the [local verification policy](../../../skills/local-verification/SKILL.md).

See [validation](./01-VALIDATION.md) for the four-file header inspection,
task/threat mapping, license gate, and phase verification handoff. The
[review protocol](./01-REVIEW-PROTOCOL.md) supplies reusable ledger columns,
chronological rounds, D-06 evidence handling, D-09 stops, and the locked header.

## Deferred warnings and judgment flags

Original seed WARNINGs remain deferred for re-verification: auth to Phase 2,
state to Phase 3, controls to Phase 5. Their exact seed locations are in
`01-AUTH-REVIEW.md`, `01-STATE-REVIEW.md`, `01-CONTROLS-REVIEW.md`, and
`.planning/research/SPOT-CHECK-FINDINGS.md`. They are not fixed or rejected here.

E-07/SPOT-03 and E-08/SPOT-04 remain unclassified taxonomy assumptions.
Concrete state/cancellation behaviors have tests; taxonomy completeness is
pending independent verifier judgment. P-01 (no guessed normal telemetry) and
P-02 (no false completion of paused/skipped/hardware/archived work) retain
descriptor-less, flagged-unverified status. No enforcement descriptor or
automatic green result is invented. These four flags must appear in phase-end
judgment. No current provenance contradiction or unresolved high threat was found.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.
