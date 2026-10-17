# Phase 5: Accessories Conformance - Context

**Gathered:** 2026-10-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Review every module under `src/accessories/**` (ten) and every file under
`test/accessories/**` (fourteen) against the style, comment and
unit-testing rulebooks, and fix each confirmed bug behind a regression test
(ACC-01). The fourteen tests include four gates with no single source:
`timerFreedom`, `hapImportScope`, `accessoryReadPathScope` and
`hapWriteFidelity`. The spot-check WARNING lines for `controls.ts` and
`controls.test.ts` each get an outcome. No new product behavior, family
meaning, fallback state or persistence migration is in scope.

</domain>

<decisions>
## Implementation Decisions

### Carry-forward decisions (Phase 4 D-01..D-07, unchanged)

- **D-01:** Approved header on every source/test/helper touched: SPDX first,
  separate copyright and overview JSDoc blocks, one blank line between
  sections, Copyright (c) 2026 Alessandro Colomba for original work; keep
  license and attribution boundaries.
- **D-02:** Stable finding IDs, exact rules, revision-qualified locations,
  severity, disposition and actual test/commit evidence in a phase ledger.
  Full-file reviewers and cause fixers use the complete rulebooks. Each cause
  fix is atomic and passes the pre-step and normal hooks.
- **D-03:** Stop ALL work if an independent correction round with open
  findings does not reduce the open count, or a fixed finding reopens.
  Report accurate IDs/counts first. A new cause never resets an existing
  batch counter. Tracer checks and initial clarifications are not correction
  rounds. For Phase 5 the round cap is D-18, not Phase 4's round four.
- **D-04:** Genuine bug: observe an active regression failure against
  unchanged production; commit planning-only RED evidence before the minimum
  GREEN commit. No failing code commit, hidden/skipped regression or hook
  bypass. Assertion controls restore exact source bytes before rebuilt GREEN.
- **D-05:** Preserve locked safety and identity contracts (opaque canonical
  telemetry, narrow invalid-scope trust, last valid values, deviceId identity,
  deviceTypeId adapter selection, distinct local/device clocks, persisted
  observations). No new meaning or fallback inferred from a style change.
- **D-06:** Fix at the cause with minimum code. Trace exact consumers before
  changing shared/exported types, names or signatures. Narrow external
  consumer edits are bounded tasks in the owning wave and do not complete
  that consumer's later sweep.
- **D-07:** Every modified pair alone keeps 100% direct lines, functions and
  branches. Full combined gate after waves and at phase end; reuse only exact
  unchanged inputs. Serialize build output, mutation experiments, shared
  helpers, Git and shared records. Offline synthetic inputs only.

### Earlier reviews and fixes

- **D-08:** `test/accessories/controls.test.ts` (Phase 1 SC-02 fix) and the
  `reconciliation` pair (Phase 4 ACCOUNT consumer edits `e914a62`, `020498a`,
  `9b33167`) get a full fresh full-file review like every other file.
  Earlier fixes are regression anchors; earlier edits do not count as a
  completed sweep.
- **D-09:** The Phase 1 deferred seed warnings get stable Phase 5 IDs before
  the first review round, each re-verified against current lines and then
  fixed or rejected with a reason: (a) whole-value check at original
  `controls.test.ts:831`; (b) no `describe()` per exported entrypoint;
  (c) case at original 217-238 tests the fake HAP; (d) hand-rolled `.bind`
  spy at original 316-335 instead of `t.mock.method`; (e) `// act & assert`
  over two statements at original 928-933; (f) undocumented
  `as unknown as Service` casts; (g) `LOCAL_REFUSALS` ordering comment on
  `NO_COMMAND_TRANSPORT_CAUSE` at `controls.ts:304-328`. Line numbers are
  pre-Phase-1; relocate them by content.
- **D-10:** A Phase 5 finding on lines a Phase 1/4 fix touched is a new
  Phase 5 ID that cites the earlier ID. It triggers the D-03 stop only if
  the same fixed defect returns. A new cause is not a reopen. Phase 4
  counters (PORTS 3 / POLICIES 2 / TRUST 2 / ACCOUNT 3) do not carry into
  Phase 5 batches.

### HAP test doubles and casts

- **D-11:** Each test file widens the HAP stand-in in one named, commented
  place (pattern: `controls.test.ts:44-46` `HAP_NAMESPACE`; add e.g.
  `asService`/`asAccessory` helpers as needed). Inline `as unknown as` casts
  are replaced by those helpers. No production type changes to remove casts.
- **D-12:** `features/support/fakeHap.ts` (722 lines, 14 importers) stays
  outside Phase 5's sweep. Edit it only when a confirmed accessory finding
  requires it, as a declared bounded consumer task (D-06). Its full review
  belongs to the phase that owns `features/**`.
- **D-13:** A case that proves only stand-in behavior moves to
  `hapWriteFidelity.test.ts` (where it runs against real HAP too) or is
  removed with a ledger reason if it adds nothing there.

### Static and fidelity tests

- **D-14:** Keep the documented `>=` enumeration floors in the three static
  gates. Fix a floor only if it is wrong for the current tree. Record the
  whole-value rule as N/A for the floor with the stated design reason.
- **D-15:** Do not extract a shared static-gate helper up front. Extract one
  test-support helper, in its own bounded task, only if a reviewer or
  `fallow dupes` confirms a duplication finding.
- **D-16:** For `hapWriteFidelity.test.ts`, fix confirmed rule findings and
  confirmed gaps where stand-in and real HAP could disagree undetected. Add
  no parity cases beyond those.
- **D-17:** A unit-testing rule that cannot apply to a gate with no source
  module (e.g. one `describe()` per exported entrypoint) is recorded N/A in
  the ledger with a one-line reason. All other rules apply in full.

### Correction round cap (maintainer decision during planning)

- **D-18:** Each Phase 5 batch may run up to ten correction rounds. When a
  round still has open findings but fewer than its opening count, repairs
  continue and the next correction round runs. STOP ALL work on the
  reviewer's terminal result when: a round with open findings does not
  lower the open count; a fixed finding reopens; or correction round 10
  ends with open findings. A clean round at any point closes the batch;
  a clean round 10 closes it normally. This replaces Phase 4's
  "round four is reached, even if clean" stop and the "about four rounds"
  wording of PROC-02 and ROADMAP for Phase 5 only; Phases 6-8 keep the
  four-round cap unless the maintainer extends this. — **Reversibility:**
  reversible — a planning-policy change; no code or published contract
  depends on it.

### Claude's Discretion

- Batch grouping and wave order, within the roadmap batching note
  (`basementGuardian` and `serviceCatalogue` alone; `controls` with the seed
  warnings; the four gates together; no two plans in one wave edit the same
  file).
- Names of the per-file widening helpers.
- Applying the D-01 header to the 21 files that lack it (nine sources and
  twelve tests) as ordinary findings.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and policy
- `.planning/ROADMAP.md` §Phase 5 — goal, success criteria, batching note
- `.planning/REQUIREMENTS.md` — ACC-01, PROC-01, PROC-02, BUG-01
- `.planning/phases/04-runtime-conformance/04-CONTEXT.md` — source of D-01..D-07
- `.planning/phases/05-accessories-conformance/.continue-here.md` — blocking
  anti-patterns, runtime and commit protocol

### Seed findings
- `.planning/research/SPOT-CHECK-FINDINGS.md` lines 27, 39, 42, 46 — controls
  seeds
- `.planning/phases/01-known-findings-and-loop-proof/01-CONTROLS-REVIEW.md`
  §Deferred seed warnings — SC-02 fix and Phase 5 handoff
- `.planning/phases/04-runtime-conformance/04-ACCOUNT-REVIEW.md` — earlier
  reconciliation edits

### Rulebooks
- `skills/typescript-google-style-review/SKILL.md`
- `skills/typescript-comments/SKILL.md`
- `skills/typescript-unit-testing/SKILL.md`
- `skills/typescript-unit-testing-review/SKILL.md`
- `skills/local-verification/SKILL.md`
- The `skills/` rulebooks are authoritative (AGENTS.md). The tracked
  `.claude/rules/typescript-unit-testing.md` copy also allows
  `// act & assert` for "a data row"; `skills/` allows it only for one
  `assert.rejects`/`assert.throws`. Reviewers and fixers follow `skills/`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `features/support/fakeHap.ts` `createFakeHap`, `FakeHapService`,
  `FakeHapCharacteristic`: the shared HAP stand-in used by tests and Cucumber.
- `controls.test.ts:44-46` `HAP_NAMESPACE`: the commented single-widening
  pattern D-11 extends.

### Established Patterns
- 24 `as unknown as` casts across `controls` (7), `basementGuardian` (8),
  `staleMarking` (5), `serviceCatalogue` (2), `customServices` (1),
  `customCharacteristics` (1).
- Static gates enumerate directories, assert a documented floor, and pair
  planted-positive with planted-negative cases.
- `hapWriteFidelity.test.ts` is the only file allowed to import
  `@homebridge/hap-nodejs` (D-17 of the earlier milestone); it diffs real
  HAP and the stand-in on the same write script.
- Headers: only `reconciliation.ts` has the full D-01 header; the other nine
  sources put `@fileoverview` directly after SPDX, with no blank line and no
  copyright block. Among tests only `controls.test.ts` and
  `reconciliation.test.ts` conform; the four gates open with `@fileoverview`;
  eight tests open with imports.

### Integration Points
- ~13.7K lines total; `basementGuardian.test.ts` 3,456 and
  `serviceCatalogue.test.ts` 2,291 lines.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the decisions above.

</specifics>

<deferred>
## Deferred Ideas

- Full conformance review of `features/support/fakeHap.ts`: belongs to the
  phase that owns `features/**`.

</deferred>

---

*Phase: 05-accessories-conformance*
*Context gathered: 2026-10-16*
