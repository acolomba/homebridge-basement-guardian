---
phase: 05-accessories-conformance
plan: "08"
subsystem: accessories
tags: [code-review, accessories, gates]
status: stopped
requires:
  - phase: 05-accessories-conformance
    provides: completed source and paired-test reviews
provides:
  - historical GATES review through correction round 15
  - explicit STOP record and maintainer decision to retire the source scanners
  - retained real-HAP write fidelity test
requirements-completed: []
key-files:
  modified:
    - .planning/phases/05-accessories-conformance/05-FINDINGS.md
    - .planning/phases/05-accessories-conformance/05-ledger-tracer.mjs
  deleted:
    - test/accessories/timerFreedom.test.ts
    - test/accessories/hapImportScope.test.ts
    - test/accessories/accessoryReadPathScope.test.ts
    - test/accessories/staticGateSources.ts
completed: 2026-10-19
---

# Accessory GATES review stopped and superseded

The four unpaired tests received a full round-0 review and 15 correction rounds.
Round 15 closed with two open findings in the custom source scanners. Its result is
`STOP: no progress; open after round 15`. No round 16 ran, and this plan did not
close cleanly. [The round-15 report](05-GATES-REVIEW-R15.md) describes the two
scanner misses and says neither is a production defect.

The maintainer then chose to retire the custom scanners. Commit `3299b7e` removed
three scanner tests and their helper, and put common import and registration
boundaries in ESLint. The real-HAP write fidelity test stayed. The decision is
recorded in the round-15 STOP cell of `05-FINDINGS.md`; the valid historical
scanner findings remain open there. Commit `8ec1bac` preserved that report and
made the ordinary ledger trace accept the four retired inventory paths while
still rejecting an all-batches-clean claim.

Current lint, parity, and combined-tree evidence belongs to the revised 05-09
closeout. This summary records a stopped plan, not an ACC-01 pass.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.
