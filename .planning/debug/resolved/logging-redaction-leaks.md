---
status: resolved
trigger: "Yes, debug and replan (Recommended)"
created: 2026-10-19T15:24:40.000Z
updated: 2026-10-19T16:55:46.000Z
---

## Current Focus

hypothesis: Confirmed: `[^"}]+` stops unquoted password redaction early, and exact secret substitution can erase `password` before the structural matcher runs.
test: The final tree passed the full npm check, Fallow audit, pre-commit, and normal commit hooks at `2d291cc`; the maintainer confirmed the real-workflow check.
expecting: The original credential leaks remain absent in the maintainer's real Homebridge workflow.
next_action: None; investigate again only if the maintainer reports a new Homebridge logging regression. Preserve the Phase 6 round-four STOP history in its existing ledgers.
bug_class: bohrbug
candidate_causes:
  - code: The unquoted value class excludes quote and brace, and exact replacement precedes credential matching.
  - data: The input contains an unquoted quote or brace, or a registered secret identical to a credential field name.
  - config: No configurable redaction mode is evident in the logger API.
and_gate: ENTRY-019 requires the regex boundary and a suffix-bearing input; ENTRY-020 requires the replacement order and a field-name collision. The two findings are independent of each other.
reasoning_checkpoint:
  hypothesis: The unquoted value class exposes suffixes after quote or brace; registered-secret replacement erases a credential field name before its value matcher runs.
  confirming_evidence:
    - The brace and quote owner cases both received `[redacted]` followed by the original suffix.
    - The registered-field owner case received `{"[redacted]":"next-secret"}`.
  falsification_test: If either case passes against the unchanged source, or the delegate receives no exposed suffix or value, this mechanism is wrong.
  fix_rationale: Match unquoted values through the remaining message and collect both structural values and registered secrets from the original text; merging overlaps keeps all secret bytes masked.
  blind_spots: Adjacent credential formats and all logger routes still need post-fix checks. A registered secret spanning a structural match is now reproduced by an owner test.
  candidate_causes:
    - code: Value regex excludes quote and brace, and exact replacement precedes structural matching.
    - data: Quote or brace appears within the unquoted password, or a registered secret equals the field name.
    - environment: No environment difference is needed; the compiled owner cases fail deterministically.
  and_gate: Each failure requires its code defect and the triggering input; the two defects are independent and both require repair.
tdd_checkpoint:
  test_file: test/logging.test.ts
  test_name: AUTH-02 redacts a brace inside an unquoted password; AUTH-02 redacts a quote inside an unquoted password; AUTH-02 redacts a new password when its field name is a registered secret
  status: green
  failure_output: The delegate received `password=[redacted]}right`, `password=[redacted]"right`, and `{"[redacted]":"next-secret"}` instead of fully redacted output.

## Symptoms

expected: No credential content reaches a Homebridge delegate logger, including unregistered password text and collisions with registered secret strings.
actual: `password=left}right` can log `}right`; with registered secret `password`, a JSON password field can log its new unregistered value because the field name is replaced first.
errors: No thrown error. Phase 6 review recorded BLOCKERs CR-06-ENTRY-019 and CR-06-ENTRY-020 after correction round 4.
reproduction: See `.planning/phases/06-root-module-conformance/06-ENTRY-REVIEW.md` and `06-FINDINGS.md`; run exact delegate assertions against `createRedactingLogger` in `test/logging.test.ts`.
started: These cases were found in Phase 6 ENTRY correction round 4 at source revision `add5a3a`; no earlier claim of safety for these inputs is established.

## Eliminated

## Evidence

- timestamp: 2026-10-19T15:24:40.000Z
  checked: Phase 6 independent round-four report at `add5a3a`.
  found: The reviewer reproduced both leaks; three ENTRY pairs reached 100% direct coverage and the full repository check passed on the same tree.
  implication: The owner tests need active regressions for these exact inputs; coverage alone does not prove privacy.
- timestamp: 2026-10-19T15:26:00.000Z
  checked: Complete logging source, owner test, round-four findings, and bounded platform caller.
  found: The unquoted pattern is `[^"}]+`; redactText substitutes registered secrets before applying credential patterns; platform.ts registers the validated password.
  implication: Both leaks are deterministic and can be asserted at the delegate without changing the caller.
- timestamp: 2026-10-19T15:26:26.000Z
  checked: Successful `npm run build:test` followed by three named compiled owner tests against unchanged src/logging.ts.
  found: All three tests failed at exact delegate assertions. The outputs exposed `}right`, `"right`, and `next-secret` respectively.
  implication: The active RED cases reproduce both independent privacy blockers and supply specified oracles for the source repair.
- timestamp: 2026-10-19T15:28:10.000Z
  checked: Fresh `npm run build:test` and three named compiled owner tests with the source repair.
  found: Build passed and all three exact delegate assertions passed.
  implication: The targeted repair prevents both observed leaks; adjacent checks and revert/reconfirm remain.
- timestamp: 2026-10-19T15:29:00.000Z
  checked: Isolated direct logging coverage, source diff, Fallow guard, and package dependencies.
  found: Direct coverage passed; Fallow reports no configured boundaries; the source diff is limited to matcher and ordering; Stryker is not installed or configured.
  implication: The no-op detector passes and mutation testing must be logged as unavailable. Revert/reconfirm and adjacent tests remain.
- timestamp: 2026-10-19T15:30:00.000Z
  checked: Revert/reconfirm using HEAD source only, retaining the active owner tests; fresh builds before each named run.
  found: All three assertions failed on HEAD with the original leaked outputs and all three passed again after restoring the repaired source.
  implication: The source repair causes the observed behavior change rather than incidental test or environment state.
- timestamp: 2026-10-19T15:31:00.000Z
  checked: First full `npm run check`, Fallow audit, and installed mutation tooling.
  found: Static checks passed; 51 of 53 unpaired tests passed. The two packed-artifact tests failed because npm's default cache returned EPERM. Fallow audit could not create a temporary worktree. Stryker is absent.
  implication: No logger regression was observed; the complete gate requires a writable npm cache and the audit requires filesystem access.
- timestamp: 2026-10-19T15:33:00.000Z
  checked: Second full check with a writable temporary npm cache and escalated Fallow audit.
  found: Fallow audit exited 0 with only two inherited duplicate groups. Static and all unpaired tests passed, then 98 Cucumber scenarios failed on local `listen EPERM`; the hung runner was interrupted after reporting those failures.
  implication: The complete gate still needs local socket permission; no source failure has appeared.
- timestamp: 2026-10-19T15:33:10.000Z
  checked: Full check with writable npm cache and local loopback access.
  found: Static checks and unpaired tests passed; 104/104 Cucumber scenarios, 1156/1156 steps, and 43 isolated coverage pairs passed.
  implication: The repository gate passes, but overlap reasoning found a privacy risk that the owner tests do not cover.
- timestamp: 2026-10-19T15:33:20.000Z
  checked: Held-out exact delegate test for registered secret `prefix password=inner-secret` on the first source repair.
  found: The delegate received `token prefix password=[redacted]` instead of `token [redacted]`.
  implication: Sequential structural-first substitution splits a registered secret. The source repair must operate on original-text spans.
- timestamp: 2026-10-19T15:34:39.000Z
  checked: Four named exact delegate tests and isolated direct logging coverage after original-text span repair.
  found: All four named cases passed, including the held-out overlap; direct coverage passed.
  implication: The revised repair protects both reported blockers and preserves the full registered-secret substitution in the overlap case.
- timestamp: 2026-10-19T15:35:12.000Z
  checked: Revert/reconfirm of final repair and first full gate on that repair.
  found: HEAD source failed the three original cases, while the overlap guard passed there; all four passed when final source returned. Full gate stopped at two lint style violations in new source, which were corrected without changing runtime behavior.
  implication: The final repair addresses both original leaks. The full gate must be rerun after lint corrections.
- timestamp: 2026-10-19T15:36:44.000Z
  checked: Final full `npm run check` with writable npm cache and local loopback access.
  found: Static checks and unpaired tests passed; 104/104 Cucumber scenarios, 1156/1156 steps, and 43 isolated direct coverage pairs passed.
  implication: Target and adjacent functionality pass. The guardrail is accepted with Stryker mutation testing skipped because it is absent.
- timestamp: 2026-10-19T15:38:04.000Z
  checked: Committing skill pre-commit pass, final Fallow audit, normal commit hooks, focused commit, and Git status.
  found: All gates passed; commit `24f3620` contains only src/logging.ts and test/logging.test.ts. The only remaining untracked path is this active debug session. Phase 6 review and findings ledgers were not edited.
  implication: Automated repair is complete. Human real-workflow verification is required before resolving or archiving the debug session; Phase 6 round-four STOP remains in effect.
- timestamp: 2026-10-19T15:38:23.000Z
  checked: Post-commit unquoted-value boundary against the prior matcher and current matcher.
  found: The prior `[^"}]+` class included newlines; the repaired `[^\r\n]*` class stops before one, leaving a potential credential suffix exposed.
  implication: The newline boundary is an introduced privacy regression. Add an exact delegate test before correcting the matcher.
- timestamp: 2026-10-19T15:38:50.000Z
  checked: Fresh build and named exact delegate test for `password=left\nright` on commit 24f3620 source.
  found: The delegate received `posting password=[redacted]\nright` instead of `posting password=[redacted]`.
  implication: The introduced newline leak is reproduced and has a specified oracle.
- timestamp: 2026-10-19T15:38:55.000Z
  checked: Isolated direct logging coverage and named newline case after matching through the remaining message.
  found: Both checks passed.
  implication: The introduced newline leak is corrected locally; full adjacent verification remains.
- timestamp: 2026-10-19T15:41:07.000Z
  checked: Full check, Fallow audit, pre-commit pass, normal hooks, commits, and final Git status after the newline correction.
  found: Static and unpaired checks passed; 104/104 Cucumber scenarios, 1156/1156 steps, and 43 direct pairs passed. Fallow audit and both commit hooks passed. Only this active debug session is untracked. Phase 6 ledgers were not edited.
  implication: Automated repair is complete at `2d291cc`. Human real-workflow confirmation is required before resolving or archiving the session; the Phase 6 round-four STOP remains in effect.
- timestamp: 2026-10-19T16:55:12.000Z
  checked: Maintainer response to the human-verify checkpoint for the original Homebridge logging workflow.
  found: 'Confirmed fixed'
  implication: Human verification is complete. The debug session can be resolved and archived without changing the Phase 6 review or findings ledgers.
- timestamp: 2026-10-19T16:55:46.000Z
  checked: Archived record, document-only pre-commit pass, and Fallow audit against `HEAD` (`c46a2d9`).
  found: The archive contains the complete prior evidence and STOP references; pre-commit passed with only the committing skill's permitted `npm-check` skip, and Fallow audit returned a pass for the one changed document.
  implication: The resolved record is ready for a normal-hook document-only commit; the source repair and Phase 6 ledgers remain untouched.

## Resolution

root_cause: The unquoted authentication pattern ends at quote or brace characters; registered-secret substitution runs before credential matching and can erase a matching field name. Each defect needs a corresponding input shape to expose a credential.
fix: The unquoted authentication matcher consumes the remainder of the message after a nonquote first character. Redaction collects all credential-value and registered-secret spans from the original text and masks their union, preserving overlaps and field-name recognition.
verification:
  target_test: { result: pass, detail: "Three reported exact delegate cases, newline boundary, and registered-secret overlap pass." }
  mutation_check: { result: skipped, reason_if_skipped: "Stryker is absent from dependencies and node_modules.", mutant_killed: null }
  no_op_deletion: { result: pass, deletion_justified_by_rca: false, detail: "The diff adds original-text spans and removes only sequential substitution that caused the collision." }
  adjacent_tests: { result: pass, suites_run: ["npm run check: static, unpaired, Cucumber, 43 direct pairs"] }
  revert_and_reconfirm: { result: pass, bug_returned_on_revert: true, fixed_on_reapply: true }
  guardrail_verdict: accepted
  full_check: { result: pass, command: "npm_config_cache=/private/tmp/guardian-npm-cache-20261019 npm run check", node: "v26.12.0", scope: "static, unpaired, 104 Cucumber scenarios, 1156 steps, 43 direct pairs" }
  commit_hooks: { result: pass, commits: ["24f3620", "2d291cc"] }
  human_verify: { result: pass, response: 'Confirmed fixed' }
oracle_type: specified
files_changed: [src/logging.ts, test/logging.test.ts]
commits: [24f3620, 2d291cc]

## Prevention

- Code branch: The unquoted value matcher stopped at quote and brace characters, and replacing registered secrets first could hide a credential field name. Matching spans against the original message and masking their union addresses both causes.
- Data branch: An unquoted quote, brace, or newline, or a registered secret equal to a field name, exposed the defects. These inputs are now covered by exact delegate assertions.
- Why not caught: The owner tests and Phase 6 review gate did not cover these credential boundaries before round four; full coverage of existing tests did not establish privacy for missing inputs.
- Recurrence guard: `test/logging.test.ts` has `AUTH-02` exact delegate cases for brace, quote, newline, field-name collision, and registered-secret overlap. All passed with the repair.
- Review history: Phase 6 round-four STOP and subsequent replanning remain in their existing ledgers; closing this debug session does not alter them.
