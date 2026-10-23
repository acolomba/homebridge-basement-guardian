# Phase 3: Device and Persistence Conformance - Context

**Gathered:** 2026-10-14
**Status:** Ready for planning
**Mode:** Interactive carry-forward; prior decisions and rulebooks answer the implementation preferences. No new meaningful gray area was found.

<domain>
## Phase Boundary

Review all eight src/device modules and src/persistence/accessoryContext.ts,
with their nine mirrored tests: 18 current files. Fix every confirmed style,
comment, testing or genuine bug finding in this scope. Re-verify each state
WARNING from the seed review with a concrete disposition. Preserve all locked
product behavior and the already verified Phase 1 state-test remedies.

</domain>

<decisions>
## Implementation Decisions

### Carry-forward decisions

- **D-01:** Apply the approved header to every source/test/helper touched:
  SPDX first, separate copyright and overview JSDoc blocks, one blank line
  between sections. Original-work copyright is Copyright (c) 2026 Alessandro
  Colomba. Keep a brief purpose and essential context; preserve license and
  attribution, including existing template-derived boundaries.
- **D-02:** Use stable finding IDs, exact rules, revision-qualified locations,
  severity, disposition and actual test/commit evidence in a phase ledger.
  Full-file reviewers and cause fixers use the complete project rulebooks.
  Each cause fix is atomic and passes the required pre-step and normal hooks.
- **D-03:** Pause ALL work if an independent correction round with open findings
  does not reduce the open count, a previously fixed finding reopens, or round
  four is reached, even if clean. Report accurate IDs/counts before any further
  repair or dispatch. A new cause never resets an existing batch's counter.
  Tracer checks and initial clarifications are not correction rounds.
- **D-04:** For a genuine bug, observe an active intended regression failure
  against unchanged production. Commit planning-only complete patch/native
  output/command/exit/source-commit/version evidence BEFORE the minimum GREEN
  production and active-test commit. This is the maintainer-approved sweep
  policy. Preserve every earlier record and actual Git ancestry. No failing
  code commit, hidden/skipped regression or hook bypass. Assertion controls
  are separate and restore exact source bytes before rebuilt GREEN.
- **D-05:** Preserve the locked safety and identity contracts: opaque canonical
  telemetry, current reported-only patches, monotonic watermark behavior,
  immutable public snapshots, narrow invalid-scope trust, last valid values,
  deviceId physical identity, deviceTypeId adapter selection, and distinct
  local/device clocks. Keep persisted observations and invalid-record recovery
  semantics. No new family meaning, fallback normal state or persistence
  migration is inferred from a type/style change.
- **D-06:** Fix confirmed findings at their cause with minimum code. Trace exact
  consumers before changing shared/exported types, names or signatures. An
  owning plan includes narrowly required external consumer edits in its wave;
  those edits do not imply a completed later subsystem sweep. Re-verify
  undefined/optional and readonly warnings against actual public shape,
  exhaustiveness and mutation contracts before choosing a repair or rejection.
  Preserve privacy, opaque identity, existing features and ADR-locked behavior.
- **D-07:** Every modified source/test pair alone keeps 100% direct lines,
  functions and branches. Run the full combined gate after waves and at phase
  end; reuse only exact unchanged inputs under local-verification. Serialize
  build output, mutation experiments, shared helpers, Git and shared records.
  Use offline synthetic inputs; no live vendor or hardware runs or installs.

### Implementation discretion

The rulebooks and exact caller evidence determine routine cause fixes and
batch ownership. State and Gemini may each own a batch; group the smaller
modules without splitting a shared-type repair across concurrent owners.
Research/planning chooses the dependency order and tracer slices. Reused fresh
test seeds belong to their concern module when the rulebook requires it; any
new helper joins the reviewed/header inventory and broad staged selector.

The seed review's six state WARNING categories remain candidates, not automatic
findings: optional fields, snapshot readonly members, missing/implementation
JSDoc, the value named data, in-case rationale comments, and length/single-field
assertions. Preserve SC-03's verified whole snapshots, frozen-shape presence
checks and canonical store reads after refused patches. A confirmed reopening
triggers D-03; merely re-reading that file is not a new defect.

No new product preference is unresolved. The original all-remaining-phases
request authorizes continuation; Phase 2's three human decisions are bounded
to Phase 2 and do not preapprove Phase 3 taxonomy or prohibition judgments.

</decisions>

<canonical_refs>
## Canonical References

- AGENTS.md — repository, Git, TypeScript and verification requirements.
- .planning/PROJECT.md, .planning/REQUIREMENTS.md, .planning/ROADMAP.md — DEV-01,
  current milestone boundaries and applicable process/bug obligations.
- .planning/intel/decisions.md — authoritative locked safety, family, identity,
  timing and persistence decisions. Interpret source comments against this
  record; do not invent protocol facts or privacy exceptions.
- .planning/research/SPOT-CHECK-FINDINGS.md — state warnings to re-verify.
- .planning/phases/01-known-findings-and-loop-proof/01-CONTEXT.md,
  .planning/phases/01-known-findings-and-loop-proof/01-REVIEW-PROTOCOL.md,
  .planning/phases/01-known-findings-and-loop-proof/01-FINDINGS.md — approved
  milestone policies and proven record form.
- .planning/phases/01-known-findings-and-loop-proof/01-VERIFICATION.md — bounded
  SC-03 baseline; unchanged prior work is not a full Phase 3 review.
- .planning/phases/02-cloud-conformance/02-CONTEXT.md,
  .planning/phases/02-cloud-conformance/02-REVIEW-PROTOCOL.md,
  .planning/phases/02-cloud-conformance/02-FINDINGS.md,
  .planning/phases/02-cloud-conformance/02-VERIFICATION.md — latest loop,
  six-history provenance, judgment boundaries and parser hazards.
- skills/typescript-google-style-review/SKILL.md,
  skills/typescript-comments/SKILL.md,
  skills/typescript-unit-testing/SKILL.md,
  skills/typescript-unit-testing-review/SKILL.md,
  skills/local-verification/SKILL.md — complete owning rulebooks.
- .agents/skills/fallow/SKILL.md,
  node_modules/fallow/skills/fallow/SKILL.md — exact consumer evidence and audits.
- LICENSE, NOTICE, test/packaging/licenseHeaders.test.ts — existing licensing
  and source-only header gate; independently inspect test/helper headers too.

No new external integration is proposed. If an actual repair depends on a
Homebridge API behavior, consult only the applicable official documentation
and compare the pinned package and installed definitions as AGENTS requires.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- All nine production modules have mirrored node:test owners. There is no
  current device/persistence helper beyond the 18-file initial inventory.
- state.ts owns canonical discovery/report merging and snapshot/listener state;
  DeviceSnapshot and ReportedPatch also connect cloud, runtime and accessories.
- family.ts defines guarded, scoped decoding and family-neutral public state;
  Gemini implements it, while HALO remains deliberately unimplemented.
- waterLevel.ts isolates provisional mapping/threshold behavior. Existing
  hardware gates do not authorize new meanings during this conformance phase.
- accessoryContext.ts describes typed persisted observations, identity and
  watermarks; runtime/accessory consumers own actual storage mutations.

### Established Patterns

- TypeScript ESM .js imports, injected dependencies and strict independent
  public assertions. Family decoding retains invalid/omitted scope absence.
- Physical identity stays separate from profile selection and vendor display
  naming. Persisted observation epochs retain their current reset boundary.
- Snapshot runtime immutability and mutable persistence records are distinct
  contracts; readonly/optional edits require exact caller and shape evidence.

### Integration Points

- Shared DeviceSnapshot/ReportedPatch/family/context types can affect account
  runtime, accessory observations, platform tests and Cucumber support. Trace
  them before editing and retain narrow explicit ownership.
- Current feature worktree includes completed Phases 1 and 2. No branch switch
  or new checkout should lose those fixes; execution isolation is sequential.
- GSD manager can match archived v1.0 phase numbers. Only live current-milestone
  directories and current roadmap/verification establish progress. Historical
  product Phase 3 proposals do not belong to this conformance Phase 3.
- Use ordinary foreground git commits with actual path/hash checks. Subject
  heuristics and partial summary parsers do not replace real evidence. Complete
  saved patches may differ only by documented formatter/lint changes in GREEN.
- Selected pair commands do not refresh merged coverage/direct.lcov. Quote
  fresh native module-only counts or actual selector pass; full gates merge all.

</code_context>

<specifics>
## Specific Ideas

Carry the verified process into a complete full-file review of all 18 current
files. Preserve established meanings while strengthening conformance and
discriminating public observations. No new meaningful gray area required a
fresh question after applying prior decisions and the fixed roadmap scope.

</specifics>

<deferred>
## Deferred Ideas

Runtime, accessory, root and Cucumber whole-subsystem sweeps remain in Phases
4–7, except narrow consumers required by an owned repair. Phase 8 performs
the final whole-repository review and milestone bug audit. Hardware/release
gates, new family adapters or alert mappings, existing product proposals,
live vendor runs and unrelated repository gate-test reviews stay outside.

</deferred>
