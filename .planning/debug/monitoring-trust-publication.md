---
status: awaiting_human_verify
trigger: "Phase 6 advisory CR-02: failed HomeKit trust publication is never retried with unchanged monitoring health"
created: 2026-10-19T00:00:00Z
updated: 2026-10-19T18:30:05Z
---

## Current Focus

bug_class: bohrbug — a one-shot characteristic failure gives a deterministic partial publication.
hypothesis: An exception from one service aborts republishPublishedRows, while markMonitoring has already stored the new trust; the unchanged check then skips an identical retry.
test: The GREEN source-and-test commit passed normal hooks, including check:commit and staged direct coverage.
expecting: A real Homebridge run shows degraded trust to the owner and recovers the failed row after a later identical health report.
next_action: Ask the owner to confirm the monitoring trust display in a real Homebridge environment; archive only after that confirmation.
reasoning_checkpoint:
  hypothesis: A thrown service write aborts the catalogue pass, and an identical health report skips the unfinished pass because monitoring was already stored.
  confirming_evidence:
    - The RED owner test left all 17 StatusActive rows true after the first service write threw.
    - The code stores monitoring before publication and returns for unchanged reports without tracking incomplete publication.
  falsification_test: If isolating service writes and retrying an unchanged report leaves any affected row active, this explanation is incomplete.
  fix_rationale: Continue the catalogue after a failed service, propagate the aggregate failure, and keep publication pending until a complete pass succeeds.
  blind_spots: No real Homebridge runtime was used; the test uses the repository's HAP stand-in and a one-shot injected failure.
  candidate_causes:
    - code — the loop aborts on the first thrown characteristic write, and unchanged trust skips retry.
    - environment — a Homebridge characteristic write can throw, but the injected failure reproduces without a specific runtime or version.
    - data — the second health report repeats the same trust values, which is an ordinary input rather than malformed data.
  and_gate: yes — the persistent false-active symptom requires both an aborted publication and the unchanged-report early return.

## Symptoms

expected: After a degraded monitoring report, all affected HomeKit StatusActive rows lose trust even if one characteristic write fails; an identical later report retries incomplete publication.
actual: markMonitoring stores monitoring before republishing, republishPublishedRows can throw on one service, platform catches it, and the next identical report returns early while later rows may stay active.
errors: No user error message; observed in current code during final Phase 6 advisory review.
reproduction: Add synthetic owner tests in test/accessories/basementGuardian.test.ts that fail one StatusActive write once, then send two identical degraded health reports.
timeline: Found in the Phase 6 final advisory review on 2026-10-19.

## Evidence

- timestamp: 2026-10-19T18:25:51Z
  checked: src/accessories/basementGuardian.ts markMonitoring and republishPublishedRows; src/platform.ts applyMonitoringHealth.
  found: markMonitoring stores monitoring before its unchanged return and republishPublishedRows has no per-service isolation; the platform catches a thrown markMonitoring call.
  implication: A failed write can leave later StatusActive rows untouched and an identical health report can skip retry.
- timestamp: 2026-10-19T18:25:51Z
  checked: Candidate categories and neighboring paths.
  found: Code path supplies the early return and abort; data input must contain the same health state on retry; no configuration or runtime-specific behavior is required.
  implication: The failure has two simultaneous code conditions, with a repeated report as the trigger. Test both partial publication and retry.
- timestamp: 2026-10-19T18:25:51Z
  checked: Agent-authored test diff SHA-256 1b5aabed264ebf1ecbcb37cc099fd6cdb0716d3f9d70f1c9afd200a5720006c8; command `npm run --silent build:test && node --test --test-name-pattern 'marks later services inactive after one trust write fails and retries the failed service on the same report' dist-test/test/accessories/basementGuardian.test.js`.
  found: RED, exit 1. After the first injected failure all 17 StatusActive values remained true; the specified result is inactive for the other 15 affected rows and active only for the failed first row and unaffected connectivity row.
  implication: The code aborts at the first service. The same owner test also checks the identical-report retry after the first assertion passes.
- timestamp: 2026-10-19T18:25:51Z
  checked: Required RED commit against repository commit hooks.
  found: Staging the failing test invokes check:commit and rejects the commit. The RED evidence commit contains this session file only; the test stays unstaged until the GREEN source-and-test commit.
  implication: The RED SHA proves the failing test run and fixes its diff hash without bypassing hooks.
- timestamp: 2026-10-19T18:27:00Z
  checked: RED evidence commit.
  found: Commit 4bca6a9 saved the failing command, output summary, and test diff hash with normal hooks. The failing test remained unstaged.
  implication: The source change can be tested against a fixed regression oracle.
- timestamp: 2026-10-19T18:30:00Z
  checked: Changed source and owner test.
  found: The named owner test passes, and `npm run --silent test:coverage:direct -- src/accessories/basementGuardian.ts` passes with direct pair coverage requirements.
  implication: The fix satisfies the stated oracle and exercises the changed source branches; revert-and-reconfirm remains.
- timestamp: 2026-10-19T18:28:00Z
  checked: Revert-and-reconfirm using only the source diff.
  found: With the source patch reversed, the named test failed with all 17 StatusActive rows still true. Reapplying the same patch made the test pass.
  implication: This source change is necessary for the specified behavior; a retry-specific mutation check remains.
- timestamp: 2026-10-19T18:29:00Z
  checked: Manual retry-specific mutant.
  found: Making the unchanged-report branch return even while publication was pending compiled and made the owner test fail at its final assertion; the first service stayed active. Restoring the condition returned the test to GREEN.
  implication: The owner test checks both service isolation and the pending-publication retry.
- timestamp: 2026-10-19T18:29:30Z
  checked: Adjacent platform pair.
  found: The sandboxed direct run failed with EMFILE from the unrelated filesystem watcher case. The same `npm run --silent test:coverage:direct -- src/platform.ts` command passed outside the sandbox.
  implication: The adjacent platform tests pass; the sandbox watcher limit is an environment constraint, not a regression in this fix.
- timestamp: 2026-10-19T18:30:05Z
  checked: Repository commit gate and Fallow audit.
  found: `node_modules/.bin/fallow audit --base HEAD` passed. Commit 646b327 passed the normal pre-commit and commit-message hooks, including `npm run check:commit` and staged direct coverage, on Node v26.12.0.
  implication: The code and owner test are committed; only real Homebridge confirmation remains before archiving this debug session.

## Eliminated

## Resolution

root_cause: A thrown service write aborts the remaining catalogue rows; an identical later trust report skips the incomplete publication because markMonitoring has already stored that trust.
fix: Record incomplete row publication, continue past a failed service, and retry an unchanged monitoring report until every row publishes successfully.
verification:
  target_test: { result: pass }
  mutation_check: { result: skipped, reason_if_skipped: Stryker is not configured in package.json }
  no_op_deletion: { result: pass, deletion_justified_by_rca: false }
  adjacent_tests: { result: pass, suites_run: [direct coverage for src/platform.ts outside the sandbox] }
  revert_and_reconfirm: { result: pass, bug_returned_on_revert: true, fixed_on_reapply: true }
  guardrail_verdict: accepted
files_changed: [src/accessories/basementGuardian.ts, test/accessories/basementGuardian.test.ts]
oracle_type: specified — every affected StatusActive must be inactive after a degraded report, and an incomplete pass must be retried.
