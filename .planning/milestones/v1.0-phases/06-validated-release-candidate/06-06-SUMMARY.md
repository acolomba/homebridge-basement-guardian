---
phase: 06-validated-release-candidate
plan: 06
subsystem: docs
tags: [readme, documentation, node-test, static-text-gate]

# Dependency graph
requires: []
provides:
  - "README.md discloses all five REL-08 safety/privacy items under a passing test gate"
  - "dev/README.md documents the mDNS/multicast pairing prerequisite"
affects: [06-verification, release-checklist]

# Actuals (#2632)
actuals:
  tokens: 1300
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns: ["Static source-text gate applied to README.md (test/documentation.test.ts), mirroring hapImportScope.test.ts's read-raw-text/assert.match shape"]

key-files:
  created:
    - test/documentation.test.ts
  modified:
    - README.md
    - dev/README.md

key-decisions:
  - "The plaintext-password disclosure is added to README.md even though config.schema.json's GUI text already discloses it, for parity with a reader who only browses the repo (RESEARCH.md Open Question Q1)"
  - "The Critical Alerts non-guarantee is phrased as a flat 'makes no guarantee' statement, never 'should' or 'is expected to', per the plan's prohibition"

patterns-established:
  - "test/documentation.test.ts: one node:test case per disclosure, case-insensitive regex against README.md's raw text read once at module scope"

requirements-completed: [REL-08]

coverage:
  - id: D1
    description: "README.md discloses plaintext password storage, child bridge recommendation with pairing/re-creation warning, prerelease vendor-alarm instruction, battery-estimate disclosure, and no-Critical-Alerts-guarantee statement"
    requirement: "REL-08"
    verification:
      - kind: unit
        ref: "test/documentation.test.ts#discloses that Homebridge stores the password in plain text (REL-08, D-023)"
        status: pass
      - kind: unit
        ref: "test/documentation.test.ts#recommends a child bridge and warns about pairing loss on re-creation (REL-08, D-036)"
        status: pass
      - kind: unit
        ref: "test/documentation.test.ts#warns to keep the vendor alarm and notifications enabled during prerelease use (REL-08, D-026)"
        status: pass
      - kind: unit
        ref: "test/documentation.test.ts#discloses that battery levels are estimates (REL-08)"
        status: pass
      - kind: unit
        ref: "test/documentation.test.ts#states there is no guarantee of Critical Alerts delivery (REL-08)"
        status: pass
    human_judgment: false
  - id: D2
    description: "dev/README.md's Networking section documents the host mDNS/multicast prerequisite, a fail-fast precheck command, the firewall ports involved, and a tunnel-based workaround"
    verification:
      - kind: other
        ref: "grep -qi multicast dev/README.md && grep -qi 5353 dev/README.md"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-09-05
status: complete
---

# Phase 6 Plan 06: REL-08 README Disclosures and dev/README.md mDNS Prerequisite Summary

**README.md now carries all five REL-08 safety/privacy disclosures under a five-case passing test gate, and dev/README.md documents the host multicast prerequisite for HAP pairing.**

## Performance

- **Duration:** 12 min
- **Tasks:** 2 completed
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- Closed the three previously-missing REL-08 disclosures in README.md: the plaintext-password
  parity mention, a new "Running as a child bridge" section, and a flat no-Critical-Alerts-
  guarantee statement, plus extended the existing prerelease banner with the vendor-alarm
  instruction.
- Added `test/documentation.test.ts`, a five-case static source-text gate matching the codebase's
  established `hapImportScope.test.ts` pattern, so any future edit that removes or rewords a
  disclosure past its regex fails the suite by name.
- Extended `dev/README.md`'s Networking section with the mDNS/multicast prerequisite, a fail-fast
  `avahi-browse`/`dns-sd` precheck, the firewall ports involved (UDP 5353 plus the HAP TCP range),
  and a tunnel/reflector workaround for a host without multicast, closing a pending todo recorded
  against the observed `floyd` host's "0 responders where the LAN shows 25" failure.

## Task Commits

Each task was committed atomically:

1. **Task 1: The five REL-08 disclosures and their test gate** - `56f3ea9` (feat)
2. **Task 2: dev/README.md mDNS/multicast prerequisite** - `5ce313c` (docs)

_Note: Task 2 is typed `docs` rather than `feat` because it ships no production code or test — it
is a documentation-only addition to a dev-facing README._

## Files Created/Modified

- `README.md` - Added the plaintext-password parity sentence, a new "Running as a child bridge"
  section, a Critical Alerts non-guarantee sentence, and extended the prerelease banner with the
  vendor-alarm instruction. The existing battery-estimate disclosure (lines 227-231) was left
  unchanged.
- `test/documentation.test.ts` - New file. Five `node:test` cases, each a case-insensitive regex
  assertion against README.md's raw text, one per REL-08 clause.
- `dev/README.md` - Extended the "Networking" section with the host multicast prerequisite, a
  precheck command, port numbers, and a workaround.

## Decisions Made

- Added the plaintext-password disclosure to README.md even though `config.schema.json`'s GUI text
  already discloses it (RESEARCH.md's Open Question Q1 recommended this for parity with a reader
  who only browses the repository rather than the Homebridge Settings GUI).
- Phrased the Critical Alerts disclosure as "makes no guarantee that..." rather than "should
  deliver" or "is expected to notify", per the plan's explicit prohibition against wording that
  could read as an implicit guarantee.
- Placed the child-bridge section immediately after "Homebridge configuration" (one of the two
  locations the plan allowed) rather than after "Project structure", since it reads naturally
  alongside the other setup-time configuration guidance.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

REL-08 is fully satisfied and gated by a passing automated test. No blockers for the remaining
Phase 6 plans; `dev/README.md`'s mDNS prerequisite also closes the pending todo that named it,
which the next `/gsd-progress` or STATE.md reconciliation pass can retire.

---
*Phase: 06-validated-release-candidate*
*Completed: 2026-09-05*

## Self-Check: PASSED

- FOUND: test/documentation.test.ts
- FOUND: .planning/phases/06-validated-release-candidate/06-06-SUMMARY.md
- FOUND: 56f3ea9 (Task 1 commit)
- FOUND: 5ce313c (Task 2 commit)
