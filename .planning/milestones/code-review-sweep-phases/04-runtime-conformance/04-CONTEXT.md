# Phase 4: Runtime Conformance - Context

**Gathered:** 2026-10-14
**Status:** Ready for planning
**Mode:** Interactive carry-forward. Existing decisions answer the implementation preferences; no new meaningful gray area remains after the source scout.

<domain>
## Phase Boundary

Review every module under src/runtime and every mirrored test under test/runtime:
ten source/test pairs, 20 current files. Fix every confirmed style, comment,
unit-testing or genuine behavior finding within this scope. The complete
accountRuntime source and its full owner must receive independent review.
Preserve locked product behavior and completed cloud/device/persistence fixes.
No broad accessory, root or Cucumber sweep is assigned to this phase.

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


### Runtime preservation and implementation discretion

The carry-forward policies apply to runtime ownership, retry scheduling,
shutdown, clocks, monitoring trust, commands and persisted arrival anchors.
Preserve the existing distinction between monitoring-path failure and device
offline state, reported authority over controls, one potentially delivered
command attempt, shared-root cancellation and explicit current lifecycle
ownership. Do not infer a new retry, deadline, timestamp-domain or recovery
policy from a conformance repair.

Research and planning choose dependency order and tracer slices. AccountRuntime
owns one continuous batch even when execution spans sequential plans; every
independent correction round keeps its original IDs and counts. The full
1,283-line source and 3,365-line owner cannot be replaced by a short diff-only
review. Group the nine smaller pairs into disjoint review batches, respecting
shared type/seed ownership and serial build/Git critical sections.

Trace exact production/test consumers and private aliases before a shared
contract change or removal. A narrow external adaptation requires a declared
bounded task in its owning wave, including report/evidence/helper paths within
the five-file cause budget. It does not complete the consumer's later sweep.
Actual test helpers join full review, header inspection and broad staged checks.
Declaration-only contracts retain meaningful strict compiler positives/negatives
without artificial runtime wrappers or fabricated coverage percentages.

Recheck runtime source narrative against canonical decisions and actual shipped
history. In particular, initial absence/restart language and identifier privacy
claims are review candidates, not new product permissions or automatic findings.
The scoped deviceId persistence/log treatment retains its opaque-key assumption;
public and committed planning artifacts remain sanitized. No new migration,
opaque-ID guarantee or universal transport teardown claim is authorized.

No new product preference was identified. The original all-remaining-phases
request authorizes routine continuation. Phase 3's three actual maintainer
judgments are bounded to Phase 3 and do not preapprove Phase 4 taxonomy or
prohibition judgments. WINDOWS 46/47 remain OPEN/unwaived historical process
exceptions. Three early hook streams lack separately retained JSON; historical
Gemini 247/247 remains independently unconfirmed. Current successful checks
cannot reconstruct those missing historical proofs.

</decisions>

<canonical_refs>
## Canonical References

Downstream agents must read these before planning or implementing:

- AGENTS.md — repository, Git, TypeScript and verification rules.
- .planning/PROJECT.md, .planning/REQUIREMENTS.md, .planning/ROADMAP.md — RUN-01,
  current milestone scope and process/bug obligations.
- .planning/intel/decisions.md — locked lifecycle, clocks, privacy, identity,
  telemetry, commands and persistence decisions.
- .planning/research/SPOT-CHECK-FINDINGS.md — seed candidates, not automatic defects.
- .planning/phases/01-known-findings-and-loop-proof/01-CONTEXT.md and
  .planning/phases/01-known-findings-and-loop-proof/01-REVIEW-PROTOCOL.md —
  approved milestone policy and evidence-first contract.
- .planning/phases/02-cloud-conformance/02-CONTEXT.md,
  .planning/phases/02-cloud-conformance/02-FINDINGS.md,
  .planning/phases/02-cloud-conformance/02-VERIFICATION.md — actual cloud
  contracts, six genuine bug histories and bounded ALPN evidence.
- .planning/phases/03-device-and-persistence-conformance/03-CONTEXT.md,
  .planning/phases/03-device-and-persistence-conformance/03-REVIEW-PROTOCOL.md,
  .planning/phases/03-device-and-persistence-conformance/03-FINDINGS.md,
  .planning/phases/03-device-and-persistence-conformance/03-VERIFICATION.md,
  .planning/phases/03-device-and-persistence-conformance/03-UAT.md — accepted
  current contracts, exact provenance/coverage and actual bounded judgments.
- .planning/WINDOWS.md — historical process gaps; use owning CLI for changes.
- skills/typescript-google-style-review/SKILL.md,
  skills/typescript-comments/SKILL.md,
  skills/typescript-unit-testing/SKILL.md,
  skills/typescript-unit-testing-review/SKILL.md,
  skills/local-verification/SKILL.md — complete owning rulebooks.
- .agents/skills/fallow/SKILL.md and node_modules/fallow/skills/fallow/SKILL.md —
  exact consumer/private-alias traces and recorded-base audits.
- LICENSE, NOTICE, test/packaging/licenseHeaders.test.ts — existing license
  boundaries and source-only header gate; separately inspect owners/helpers.

No new external integration is proposed. If a real repair depends on Homebridge
or Cucumber behavior, consult only applicable official documentation and compare
pinned packages and installed definitions under AGENTS. No install is authorized.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- Ten existing mirrored pairs: accessoryStore, accountRuntime, arrivalAnchors,
  clock, commandPort, failureLog, monitoringHealth, monotonicClock, retryPolicy
  and timers. Initial inventory has no separate runtime helper.
- Clock/MonotonicClock/Timers are injected ports. CommandPort exposes the
  family-neutral request outcome, while AccountRuntime composes real clients.
- ArrivalAnchors owns a map and disk operations; monitoring/runtime owns timing.
- Existing native Node tests, synthetic clocks and local simulator patterns
  support offline behavior and strict contract checks.

### Established Patterns

- TypeScript ESM .js imports, injected ports and independent public assertions.
- RetryPolicy keeps a pending guard, capped backoff and shared-root abortable
  waiting. CommandPort documents a single attempt without automatic retry.
- Full current inputs retain 100% isolated runtime coverage; declarations have
  honest selector acceptance. All combined waves and phase end run the full gate.

### Integration Points

- Runtime composes auth, REST, shadow, canonical state, registry and reconciliation.
  Trace actual callers before changing shared signatures or export visibility.
- Completed Phase 3 changes preserve emitted behavior and public contract shapes.
  Current branch features/code-review-sweep retains all completed milestone work.
- Existing GSD manager can confuse archived same-numbered phases; only live
  current-milestone folders and current ROADMAP/verification establish progress.
- Force isolation:none and read the persisted sentinel directly before each
  executor. No checkout from the stale remote default, history rewrite or reset.
- Preserve raw failed sandbox attempts before authorized filesystem retries.
  A formatter-changing pre-step must repeat clean BEFORE staging/normal commit.
- Native compiled and merged source-mapped LCOV are distinct representations.
  Selected pair checks do not refresh the merged full-gate coverage artifact.

</code_context>

<specifics>
## Specific Ideas

Carry the verified process into complete review of all 20 runtime files.
Scope, safety semantics, ledger, stopping, regression evidence and verification
policy are already decided. No new question was needed to repeat those choices.
Planning selects bounded dependency-aware batches without weakening full-file
review or the accountRuntime counter across sequential slices.

</specifics>

<deferred>
## Deferred Ideas

Accessory, root and Cucumber whole-subsystem sweeps remain in Phases 5–7,
except declared narrow consumers required by a runtime cause. Phase 8 performs
the final whole-repository re-review and milestone bug audit. Hardware/release
gates, live vendor runs, new product features and unrelated gate-test reviews
remain outside scope. Historical WINDOWS 46/47 remain visible for milestone
disposition; no automatic waiver follows from this context.

</deferred>
