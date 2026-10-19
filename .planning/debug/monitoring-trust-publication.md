---
status: investigating
trigger: "Phase 6 advisory CR-02: failed HomeKit trust publication is never retried with unchanged monitoring health"
created: 2026-10-19T00:00:00Z
updated: 2026-10-19T18:25:51Z
---

## Current Focus

bug_class: bohrbug — a one-shot characteristic failure gives a deterministic partial publication.
hypothesis: An exception from one service aborts republishPublishedRows, while markMonitoring has already stored the new trust; the unchanged check then skips an identical retry.
test: The agent-authored owner test makes the first published service reject one write, then sends the same degraded report twice.
expecting: After the first report, later affected services are inactive; after the second, the failed service is inactive.
next_action: Commit this RED evidence with normal hooks while the failing test stays unstaged, then implement the fix.

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

## Eliminated

## Resolution

root_cause:
fix:
verification:
files_changed:
oracle_type: specified — every affected StatusActive must be inactive after a degraded report, and an incomplete pass must be retried.
