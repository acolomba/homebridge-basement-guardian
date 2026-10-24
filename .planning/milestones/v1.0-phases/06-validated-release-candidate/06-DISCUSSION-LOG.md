# Phase 6: Validated Release Candidate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-04
**Phase:** 6-Validated Release Candidate
**Areas discussed:** Publish scope, CI compatibility matrix, Hardware-gate prep work, Real-pump suite depth (REL-09), Todo folding

---

## Publish Scope

Brief web research (workflow.research_before_questions is enabled) found that
npm now requires an explicit `--tag` on any prerelease publish, and that the
common pattern is either a manual `npm publish --tag next` or a CI-triggered
publish of a per-commit prerelease version to `next`.

| Option | Description | Selected |
|--------|-------------|----------|
| Stop at "ready to publish" | Build/verify everything, flip `private`, fix license metadata, wire a publish workflow — but the actual first `npm publish --tag next` stays a deliberate action outside this phase's automation | ✓ |
| Phase 6 cuts the first 0.x prerelease itself | The phase's own execution ends by actually running `npm publish --tag next` | |
| Build a CI publish workflow, manual trigger only | Add a workflow that CAN publish (workflow_dispatch/tag push) but nothing in Phase 6 fires it | |

**User's choice:** Stop at "ready to publish" (recommended option).
**Notes:** Matches the "never auto-publish" caution already implied by D-026/D-034.

---

## CI Compatibility Matrix

Brief web research found no official Homebridge-provided CI template or
documented convention for matrixing plugin tests against multiple installed
Homebridge major versions — this project designs its own approach. Confirmed
Homebridge 2.x renamed the HAP dependency to `@homebridge/hap-nodejs`, which
this project's `api.hap`-only rule already avoids being broken by.

| Option | Description | Selected |
|--------|-------------|----------|
| Add a Homebridge-version matrix dimension | Cross Node version with 3 pinned Homebridge versions (min 1.8.x, latest 1.x, current 2.x), running full lint/test/build per combination | ✓ |
| Separate compatibility job, not a full matrix | Keep the Node matrix as the fast gate; add one distinct job that only verifies install + load/register for the 3 Homebridge versions | |
| You decide during planning | No real vision tradeoff — let the researcher/planner pick | |

**User's choice:** Add a Homebridge-version matrix dimension (recommended option).
**Notes:** Mirrors how the existing Node-version matrix in `build.yml` already works.

---

## Hardware-Gate Prep Work

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, write checklists/scripts now | Write an exact step-by-step procedure for each open gate (G-001–G-004) so a future session is fast | ✓ |
| No, leave gate-closing entirely for later | Phase 6 only documents the gates as open items, no prep artifacts | |
| Only for the cheap ones (G-002) | Prep only the G-002 checklist, skip G-001/G-003/G-004 | |

**User's choice:** Yes, write checklists/scripts now (recommended option).
**Notes:** Mirrors what the 05.1 wrap-up already did informally for the deferred paired-home session.

---

## Real-Pump Suite Depth (REL-09)

| Option | Description | Selected |
|--------|-------------|----------|
| Full REL-09 scope now | Complete opt-in `@real @read-only` suite: discovery, REST snapshot, full shadow, heartbeats, restart, shutdown; commands hard-blocked in the test transport | ✓ |
| Minimal skeleton, defer full coverage | Wire up the opt-in tag/profile/command-blocking guard plus 1-2 smoke scenarios; full coverage becomes a follow-up quick task | |

**User's choice:** Full REL-09 scope now (recommended option).
**Notes:** Given only one physical Gemini exists and the project's established discipline about never letting anything mutate real telemetry, command-blocking must be structural (in the transport), not operator discipline.

---

## Todo Folding

Three pending todos scored as possible Phase 6 matches via `todo.match-phase`.

| Todo | Fold decision |
|------|----------------|
| Record G-002 natural water-level evidence | Folded — becomes the G-002 checklist artifact under Hardware-Gate Prep Work |
| Define cloud request header policy | Folded — becomes part of the REL-03/REL-04 privacy/telemetry review |
| State the harness mDNS prerequisite in dev/README.md | Folded — becomes Phase 6 dev-docs work |

**User's choice:** Fold all three.
**Notes:** All three folded in fully; none left as reviewed-but-deferred.

---

## Claude's Discretion

- Exact CI job/workflow structure for the Homebridge-version matrix.
- Exact tooling used for license/secret/identifier audits (REL-04, REL-05).
- Structure and wording of the G-001–G-004 prep checklists.

## Deferred Ideas

None — discussion stayed within phase scope.
