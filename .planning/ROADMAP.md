# Roadmap: Basement Guardian

## Milestones

- ✅ **v1.0 Initial Release** — 7 phases, 73 plans (archived 2026-10-13)
- ✅ **code-review-sweep Code Review Sweep** — 8 phases, 106 plans (archived 2026-10-23)

The code review sweep is a repository quality milestone. The real-home and hardware gates G-001 through G-004 still block publication of `1.0.0`.

## Phases

<details>
<summary>v1.0 Initial Release — archived 2026-10-13</summary>

The implementation and release-candidate work is in [the v1.0 roadmap](milestones/v1.0-ROADMAP.md).

</details>

<details>
<summary>code-review-sweep Code Review Sweep — archived 2026-10-23</summary>

- [x] Phase 1: Known Findings and Loop Proof
- [x] Phase 2: Cloud Conformance
- [x] Phase 3: Device and Persistence Conformance
- [x] Phase 4: Runtime Conformance
- [x] Phase 5: Accessories Conformance
- [x] Phase 6: Root Module Conformance
- [x] Phase 7: Cucumber Feature Conformance
- [x] Phase 8: Final Sweep and Gate

The full phase details are in [the archived roadmap](milestones/code-review-sweep-ROADMAP.md). The [milestone audit](milestones/code-review-sweep-MILESTONE-AUDIT.md) records the passing checks and accepted limits.

</details>

## Backlog

### Phase 999.1: Reuse an abandoned token grant that succeeded (BACKLOG)

**Goal:** [Captured for future planning] When the last waiter abandons a shared grant in `src/cloud/auth.ts` after the vendor already answered, `grantAndCache` throws on abort after it writes the token cache. The token never reaches the in-memory `cached`, and `cacheRead` is memoized, so the next caller sends a fresh password grant. Rework `grantAndCache` so an aborted attempt still hands back the token it wrote. Today this costs one extra grant in a rare race against a throttling tenant (D-22). Found in the PR #23 review.
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)
