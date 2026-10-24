# Project Retrospective

## Code Review Sweep — 2026-10-23

**Scope:** Eight phases and 106 plans. The milestone reviewed the source, paired tests, and Cucumber files. The archived [audit](milestones/code-review-sweep-MILESTONE-AUDIT.md) gives the evidence and limits.

### What changed

- The five initial spot-check findings were fixed and used to establish the review loop.
- The final review covered 137 current in-scope files at their exact revisions.
- The full check passed 130 offline Cucumber scenarios, 1401 steps, and 43 direct coverage pairs.
- A Homebridge 2.4.0 Docker probe confirmed the trust-publication retry with synthetic data.

### What worked

- Named regressions and source-reversal checks exposed behavior defects before their repairs were accepted.
- Exact file revisions made later corrections traceable without erasing earlier STOP records.
- The final audit found no broken cross-phase runtime flow.

### What caused rework

- Several review rounds found a new cause after an earlier cause was fixed. The bounded STOP rule required separate correction plans.
- Repeated one-finding decisions and narrow source-disclosure approvals slowed the review. Future review plans can ask for one decision on a complete batch when the scope is known.
- Three bug histories lack complete native pre-fix output. The maintainer accepted that limit, and the audit keeps it visible.

### Carry forward

- Keep the shadow-liveness debug session open until live vendor traffic confirms the repaired behavior. The closeout acknowledges this check as deferred.
- Keep G-001 through G-004 separate from repository review. They still block publication of `1.0.0`.
- Use the passing full gate only for unchanged executable inputs. Re-run it after source, test, or tool changes.

## Cross-Milestone Trends

The v1.0 milestone delivered the release candidate and the offline harness. This sweep used that harness to review the current tree and repair defects. Both milestones retain separate real-home release gates.
