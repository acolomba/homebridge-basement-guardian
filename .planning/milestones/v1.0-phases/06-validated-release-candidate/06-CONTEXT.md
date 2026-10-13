# Phase 6: Validated Release Candidate - Context

**Gathered:** 2026-09-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Maintainer can produce an npm-ready v1 release candidate: compatibility across the
declared Node.js/Homebridge matrix, privacy/telemetry audits, a correctly licensed
packed artifact, release-process scaffolding (prerelease metadata, issue templates,
security reporting), and user-facing documentation of the known safety/privacy
caveats. Phase 6 gets the package to the edge of publishable; the actual `1.0.0`
release stays blocked on G-001 through G-004 and remains a maintainer action, not
something this phase performs.

</domain>

<decisions>
## Implementation Decisions

### Publish Scope
- **D-01:** Phase 6 stops at "ready to publish." It flips `package.json`'s
  `private: true` off, corrects the `license` field to `SEE LICENSE IN LICENSE`
  (per D-035), and wires a publish-capable GitHub Actions workflow — but no
  step in this phase's own execution actually runs `npm publish`. The first
  real `0.x` prerelease to the npm `next` dist-tag is a deliberate action the
  maintainer takes afterward. — **Reversibility:** reversible — nothing
  external happens automatically; flipping `private` back or not running the
  workflow costs nothing.
  - Researched: npm now requires an explicit `--tag` on any prerelease
    publish (no more relying on the version string alone), so a manual or
    workflow-triggered `npm publish --tag next` is the standard shape either
    way — this doesn't change the decision, just confirms the mechanism.
  - **Amended 2026-09-07:** the scope statement was right for Phase 6, but the
    conclusion drawn from it was wrong. "No publish during this phase" became
    `workflow_dispatch` as the workflow's permanent and only trigger, and the
    comment in `publish.yml` hardened that into "it must never fire on its
    own." A one-off scope limit is not a release policy. `publish.yml` now
    publishes on a push of a `v*.*.*` tag, which is the ordinary shape for a
    released package and what `pi-claude-marketplace` uses. The reversibility
    note above no longer holds: pushing a version tag now publishes to npm,
    and an npm publish cannot be undone. The tag push is the deliberate
    maintainer action this decision asked for; it is now the tag rather than a
    button in the Actions tab.

### CI Compatibility Matrix
- **D-02:** Extend the existing `.github/workflows/build.yml` Node-version
  matrix (`22.x`, `24.x`) with a second matrix dimension for three pinned
  Homebridge versions — minimum-supported 1.8.x, latest 1.x, and current 2.x
  — each installed as a matrix-selected devDependency, running the same
  lint/test/build steps per combination. Mirrors how the Node dimension
  already works rather than adding a separate, narrower compatibility job.
  — **Reversibility:** reversible — a CI config change with no external
  consequence.
  - Researched: no official Homebridge-provided template or documented
    convention exists for this; the project is designing its own approach.
    Confirmed as a relevant fact: Homebridge 2.x renamed the HAP dependency
    to `@homebridge/hap-nodejs`, which this project's `api.hap`-only rule
    (no direct HAP-NodeJS import) already avoids being broken by.

### Hardware-Gate Prep Work
- **D-03:** Phase 6 writes ready-to-run checklists/scripts for each open
  hardware/real-home gate, even though it cannot close any of them itself:
  - **G-001** (Alarm Mute): the exact measurement procedure for
    acknowledgement, state, duration, latency, and failure behavior — written
    but not executed, since pressing Alarm Mute on real hardware was
    explicitly declined during the 05.1 wrap-up.
  - **G-002** (water-level codes): the checklist for the still-unvalidated
    codes `0`, `7`, `15`, `31` and the flood threshold (folds the
    `2026-08-31-record-g-002-natural-water-level-evidence.md` todo — the `1`
    to `3` transition already observed 2026-08-31 stays the only measured
    data point until a future session runs this checklist).
  - **G-003/G-004** (paired Apple Home): the Contact Sensor and Leak Sensor
    notification checks, plus Phase 3's open flood-automation check, in one
    combined session recipe.
  A future hardware or paired-home session should be able to execute
  directly from these artifacts without rediscovering context.
  — **Reversibility:** reversible — documentation and scripts, not gate
  closures.

### Real-Pump Suite Depth (REL-09)
- **D-04:** Build the full REL-09 scope this phase, not a skeleton: an
  opt-in `@real @read-only` Cucumber profile under `features/real-pump/`
  observing discovery, initial REST state, full shadow state, heartbeats,
  natural updates, restart, and shutdown against the one real Gemini on the
  account. No scenario requires a natural status change to pass. All command
  paths are hard-blocked in the test transport itself — not left to operator
  discipline — matching the project's Test Strategy section in PROJECT.md.
  — **Reversibility:** reversible.

### Folded Todos
- **Record G-002 natural water-level evidence** (`2026-08-31`) — folds into
  D-03: becomes the concrete G-002 checklist artifact, listing exactly which
  codes remain unobserved and what a future session needs to record.
- **Define cloud request header policy** (`2026-08-31`) — folds into the
  REL-03/REL-04 privacy/telemetry review: define and document the
  user-agent string and any additional headers for Auth0, the vendor REST
  API, and (if needed) the MQTT WebSocket handshake. Use
  `homebridge-adt-pulse` as comparative research only — do not assume its
  Chrome-impersonation approach fits this integration.
- **State the harness mDNS prerequisite in `dev/README.md`** (`2026-08-31`)
  — folds in as Phase 6 dev-docs work: document the multicast/mDNS
  prerequisite for pairing, the firewall ports involved, and the tunnel form
  needed on a host without multicast (per the observed `floyd` 0-responders
  failure).

### Claude's Discretion
- Exact CI job/workflow structure for the Homebridge-version matrix
  (separate job vs. matrix expansion; how the pinned versions are installed).
- Exact tooling used for the license/secret/identifier audits (REL-04, REL-05).
- Structure and wording of the G-001/G-002/G-003/G-004 prep checklists,
  as long as they are directly executable by a future session.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Release Requirements and Roadmap
- `.planning/ROADMAP.md` — Phase 6 section: Goal, Requirements (REL-01
  through REL-09), Success Criteria (6 items)
- `.planning/REQUIREMENTS.md` — REL-01 through REL-09 full text, under
  "Release Quality, Privacy, and Distribution"

### Locked ADR Decisions
- `.planning/intel/decisions.md` — authoritative decision record; the
  `release-and-governance` scope covers D-025 (best-effort support/security
  advisories), D-026 (staged 0.x releases on npm `next`), D-027 (sanitized
  artifacts), D-032 (Node support), D-033 (Homebridge support), D-034
  (Verified claim only after 1.0), D-035 (mixed MIT/Apache license
  boundary); D-023 (unattended credentials, plaintext disclosure) and D-036
  (main/child bridge) inform REL-08's documentation requirement
- `.planning/PROJECT.md` — `<decisions>` block, `release-and-governance` and
  `configuration-security-and-privacy` scopes (mirrors decisions.md)

### Hardware/Real-Home Gates
- `.planning/PROJECT.md` — G-001 through G-004 descriptions and the
  constraint that they block only the `1.0.0` release, never phase
  completion
- `.planning/phases/04-pump-records-and-official-controls/04-UAT.md`,
  section "Deferred session, 2026-09-04" — the forcing-harness recipe and
  field domains from the last attempted paired-home session; the model for
  how the G-003/G-004 prep checklist should be structured
- `.planning/STATE.md` — "Deferred Verification" table (Phase 3 and Phase 4
  rows) and the G-001-declined decision recorded in the 05.1 wrap-up

### Existing CI and Package State
- `.github/workflows/build.yml` — current Node-version matrix (`22.x`,
  `24.x`) to extend with the Homebridge-version dimension
- `package.json` — `private: true` (to flip), `license: "Apache-2.0"` (to
  correct to `SEE LICENSE IN LICENSE`), `engines` (already correct)
- `config.schema.json` — `strictValidation: true` (already correct; resolved
  in Phase 1, do not re-touch)

### Test Strategy
- `.planning/PROJECT.md` — "Real-Pump Integration Tests" subsection under
  Test Strategy: `features/real-pump/`, `@real @read-only` tags, the
  command-blocking-in-the-transport rule, credential handling in ignored
  local files

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.github/workflows/build.yml`'s `strategy.matrix.node-version` — the
  existing pattern to extend with a `homebridge-version` (or similar)
  matrix dimension, reusing the same job steps.
- `features/support/` Cucumber harness (`fakeShadowBroker.ts`,
  `fakeRestApi.ts`, `fakeHap.ts`, the `World` type) — the real-pump suite
  needs its own read-only support code, likely under `features/real-pump/`,
  pointed at a real transport instead of the fakes; reuse `World`'s shape
  where it fits.

### Established Patterns
- D-026's staged-release pattern (`0.x` on npm `next`, GitHub prerelease
  labels, safe-user warnings) already defines what "ready to publish" must
  produce — Phase 6 does not redesign this, only implements it.
- The project's "build it, verify it, use it, revert it, never commit it"
  discipline for any harness that could mutate real telemetry (established
  during the 05.1 wrap-up's UAT forcing harness) is the precedent for
  handling any measurement tooling built for the G-001/G-002 prep work.

### Integration Points
- `package.json`'s `engines`/`private`/`license` fields are the mechanical
  switches D-01 flips.
- `.pre-commit-config.yaml` and the CI workflow both gate merges; the new
  Homebridge-version matrix is additive to the existing hooks, not a
  replacement.

</code_context>

<specifics>
## Specific Ideas

- The real-pump suite's command-blocking must live in the test transport
  itself (a structural guard), not rely on the operator remembering not to
  send commands — restated explicitly during discussion as a hard
  requirement, not a nice-to-have.
- The G-001/G-002/G-003/G-004 prep checklists should be concrete enough
  that whoever runs the future session (maintainer or otherwise) does not
  need to re-read this phase's planning artifacts first.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. All three matched pending
todos were folded into this phase's decisions rather than deferred further.

</deferred>

---

*Phase: 6-Validated Release Candidate*
*Context gathered: 2026-09-04*
