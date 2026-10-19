# Roadmap: Basement Guardian

## Milestones

- ✅ **v1.0 Initial Release** — Phases 1-6 (shipped 2026-10-13)
- 🚧 **code-review-sweep Code Review Sweep** — Phases 1-8 (in progress)

## Phases

<details>
<summary>✅ v1.0 Initial Release (Phases 1-6) — SHIPPED 2026-10-13</summary>

- [x] Phase 1: Secure Cloud Foundation (17/17 plans) — completed 2026-08-29
- [x] Phase 2: Safe Gemini Discovery and Identity (6/6 plans) — completed 2026-08-29
- [x] Phase 3: Safety Monitoring in HomeKit (8/8 plans) — completed 2026-09-05
- [x] Phase 4: Pump Records and Official Controls (6/6 plans) — completed 2026-09-05
- [x] Phase 5: Degraded Operation and Recovery (19/19 plans) — completed 2026-09-04
- [x] Phase 5.1: Per-Pump Trust and Monotonic Silence (7/7 plans, INSERTED) — completed 2026-09-04
- [x] Phase 6: Validated Release Candidate (10/10 plans) — completed 2026-09-05

Full phase details: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

### In progress code-review-sweep (Code Review Sweep)

**Milestone Goal:** Every source, unit-test, and Cucumber file conforms to the project's TypeScript style, comment, unit-testing, and behavioral-testing rules, and every bug found on the way is fixed behind a regression test.

Phase 1 fixes the five spot-check findings and uses them to prove the review loop, the findings ledger, and the file-header form. Phases 2 to 7 each sweep one part of the tree with the same loop. Phase 8 re-reviews the whole repository and runs the full `npm run check` gate. Product behavior changes only where a bug is fixed.

**Rulebooks:** `skills/typescript-google-style-review`, `skills/typescript-comments`, `skills/typescript-unit-testing`, `skills/typescript-unit-testing-review`, `skills/cucumber-behavioral-testing`, `features/CLAUDE.md`, and `skills/local-verification`. Seed findings: `.planning/research/SPOT-CHECK-FINDINGS.md`.

**Phase numbering:** Numbering restarts at 1 for this milestone. Integer phases are planned work. Decimal phases (2.1, 2.2) are urgent insertions marked `INSERTED`.

- [x] **Phase 1: Known Findings and Loop Proof** - Fix the five spot-check findings and prove the loop, the ledger, and the header form on them. (completed 2026-10-13)
- [x] **Phase 2: Cloud Conformance** - `src/cloud/**` and `test/cloud/**` conform to the rules. (completed 2026-10-14)
- [x] **Phase 3: Device and Persistence Conformance** - `src/device/**`, `src/persistence/**`, and their tests conform to the rules. (completed 2026-10-14)
- [x] **Phase 4: Runtime Conformance** - `src/runtime/**` and `test/runtime/**` conform to the rules. (completed 2026-10-16)
- [x] **Phase 5: Accessories Conformance** - `src/accessories/**` and `test/accessories/**` conform to the rules. (completed 2026-10-19)
- [ ] **Phase 6: Root Module Conformance** - The root modules `src/*.ts` and their tests conform to the rules.
- [ ] **Phase 7: Cucumber Feature Conformance** - Gherkin, step definitions, and support code under `features/**` conform to the rules.
- [ ] **Phase 8: Final Sweep and Gate** - A full-repo re-review finds nothing open, the bug ledger is complete, and the full `npm run check` passes.

## Phase Details

### Phase 1: Known Findings and Loop Proof

**Goal**: The five spot-check findings are fixed behind tests that can fail, and the review loop, the findings ledger, and the file-header form that later phases reuse are proven on them.
**Depends on**: Nothing (first phase of this milestone)
**Requirements**: SPOT-01, SPOT-02, SPOT-03, SPOT-04, PROC-01, PROC-02, PROC-03
**Success Criteria** (what must be TRUE):
  1. The auth cache test plants the stranded temporary file under the exact name production uses, through a temporary-name source injected by `AuthClientOptions`, and removing `flag: 'wx'` from `src/cloud/auth.ts` makes that test fail (SPOT-01; SC-01, SC-04).
  2. The control refusal-log test runs one `test()` per refusal row and asserts each exact log line, so a wrong cause on a row that shares status `-70412` fails a named test. The device-state frozen checks fail when the snapshot or nested value is missing, and each stale-version case reads the store after the refused patch and asserts the stored state (SPOT-02, SPOT-03; SC-02, SC-03).
  3. A caller that joins an in-flight token grant is not aborted when the first caller aborts, and a regression test committed before the fix was seen to fail. If the shared abort is kept instead, `src/cloud/auth.ts` documents it and a test pins it (SPOT-04; SC-05).
  4. The phase ledger records the rule, location, severity, and outcome (fixed, or rejected with a stated reason) of SC-01 to SC-05 and of every finding the loop raised. The last re-review round reports no open finding, or the phase stopped at the round cap with a report. The ledger format and the loop steps are written down for Phases 2 to 8 to copy (PROC-01, PROC-02).
  5. One file-header form (SPDX line, then copyright and `@fileoverview` JSDoc) is recorded as the milestone rule, every file this phase touched carries it, and the license-header gate passes (PROC-03).

**Plans**: TBD
- [x] 01-01-PLAN.md
- [x] 01-02-PLAN.md
- [x] 01-03-PLAN.md
- [x] 01-04-PLAN.md

**Batching**: Three batches share no file, so they can run in one wave: the `src/cloud/auth.ts` / `test/cloud/auth.test.ts` pair (SPOT-01, SPOT-04), `test/accessories/controls.test.ts` (SPOT-02), and `test/device/state.test.ts` (SPOT-03). Decide the header form during discussion, before planning, so each batch applies it to the files it already touches. The loop's scope here is SC-01 to SC-05 plus anything the fixes introduce. The spot check's WARNING lines go to the phases that own their files (Phases 2, 3, and 5) and are re-verified there. Each batch runs review → triage → fix → re-review, capped at about four rounds, and stops early on a round that does not lower the open count or that brings back a fixed finding. `gsd-code-reviewer` subagents review and `gsd-code-fixer` subagents fix, each with the project's `agent_skills`. Each fix is an atomic commit that passes the pre-commit hooks; never `--no-verify`.

### Phase 2: Cloud Conformance

**Goal**: Every module under `src/cloud/**` and every file under `test/cloud/**` conforms to the style, comment, and unit-testing rules, and any bug found there is fixed behind a regression test.
**Depends on**: Phase 1
**Requirements**: CLOUD-01
**Success Criteria** (what must be TRUE):
  1. The ledger lists all eight `src/cloud/**` modules and all nine `test/cloud/**` files as reviewed, each carries the Phase 1 header form, and the spot-check WARNING lines for `auth.ts` and `auth.test.ts` each have an outcome: the `.length`-only and standalone negative `includes` assertions, the `T | undefined` fields, the global `fetch` default, and the test-only `TOKEN_CACHE_FILENAME` export.
  2. The phase ledger records each finding's rule, location, severity, and outcome, fixed or rejected with a stated reason (applies PROC-01).
  3. The last re-review round reports no open finding, or the phase stopped at about four rounds or on a no-progress round with a report of what stays open and why (applies PROC-02).
  4. Every source/test pair the phase touched still reaches 100% direct line, function, and branch coverage when it runs alone.
  5. Every bug found has a regression test that was committed and seen failing before its fix, and the ledger names the test and the fix commit (applies BUG-01).

**Plans**: TBD
- [x] 02-01-PLAN.md
- [x] 02-02-PLAN.md
- [x] 02-03-PLAN.md
- [x] 02-04-PLAN.md
- [x] 02-05-PLAN.md

**Batching**: Eight pairs plus the `test/cloud/alpnServer.ts` test helper. `auth.ts` (496 lines) and `shadow.ts` (475 lines) can each be a batch of their own; the six smaller modules fit in two or three batches. Plans are batches of source/test pairs, grouped so that no two plans in the same wave edit the same file. Each batch runs review → triage → fix → re-review, capped at about four rounds, and stops early on a round that does not lower the open count or that brings back a fixed finding. `gsd-code-reviewer` subagents review and `gsd-code-fixer` subagents fix, each with the project's `agent_skills`. Each fix is an atomic commit that passes the pre-commit hooks; never `--no-verify`.

### Phase 3: Device and Persistence Conformance

**Goal**: Every module under `src/device/**` and `src/persistence/**`, and each paired test, conforms to the style, comment, and unit-testing rules, and any bug found there is fixed behind a regression test.
**Depends on**: Phase 1
**Requirements**: DEV-01
**Success Criteria** (what must be TRUE):
  1. The ledger lists all eight `src/device/**` pairs and the `src/persistence/accessoryContext.ts` pair as reviewed, each file carries the Phase 1 header form, and the spot-check WARNING lines for `state.ts` and `state.test.ts` each have an outcome: the `T | undefined` fields, the `DeviceSnapshot` fields that are not `readonly`, the missing or implementation-note JSDoc, the value named `data`, the design-rationale comments inside cases, and the `.length`-only or single-field assertions.
  2. The phase ledger records each finding's rule, location, severity, and outcome, fixed or rejected with a stated reason (applies PROC-01).
  3. The last re-review round reports no open finding, or the phase stopped at about four rounds or on a no-progress round with a report of what stays open and why (applies PROC-02).
  4. Every source/test pair the phase touched still reaches 100% direct line, function, and branch coverage when it runs alone.
  5. Every bug found has a regression test that was committed and seen failing before its fix, and the ledger names the test and the fix commit (applies BUG-01).

**Plans**: 8/8 plans complete in 8 serial waves
**Wave 1**
- [x] 03-01-PLAN.md — State review and six warning dispositions

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 03-02-PLAN.md — Family contracts and decoding batch triage

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 03-03-PLAN.md — Gemini decoding conformance

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 03-04-PLAN.md — Water-level conformance and decoding review closure

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 03-05-PLAN.md — Events and health; support batch triage

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 03-06-PLAN.md — HALO and registry conformance

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 03-07-PLAN.md — Persistence and support review closure

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 03-08-PLAN.md — Ledger, provenance and final scope audit

**Batching**: Nine pairs. `state.ts` (403 lines) and `gemini.ts` (402 lines) can each be a batch of their own; the six small device modules and `accessoryContext.ts` fit in one or two batches. A change to an exported type such as `DeviceSnapshot` can reach files in other subsystems; the plan that makes the change owns those edits in its wave. Plans are batches of source/test pairs, grouped so that no two plans in the same wave edit the same file. Each batch runs review → triage → fix → re-review, capped at about four rounds, and stops early on a round that does not lower the open count or that brings back a fixed finding. `gsd-code-reviewer` subagents review and `gsd-code-fixer` subagents fix, each with the project's `agent_skills`. Each fix is an atomic commit that passes the pre-commit hooks; never `--no-verify`.

### Phase 4: Runtime Conformance

**Goal**: Every module under `src/runtime/**` and every file under `test/runtime/**` conforms to the style, comment, and unit-testing rules, and any bug found there is fixed behind a regression test.
**Depends on**: Phase 1
**Requirements**: RUN-01
**Success Criteria** (what must be TRUE):
  1. The ledger lists all ten `src/runtime/**` pairs as reviewed, including `accountRuntime.ts` and its full 3,365-line test, and each file carries the Phase 1 header form.
  2. The phase ledger records each finding's rule, location, severity, and outcome, fixed or rejected with a stated reason (applies PROC-01).
  3. The last re-review round reports no open finding, or the phase stopped at about four rounds or on a no-progress round with a report of what stays open and why (applies PROC-02).
  4. Every source/test pair the phase touched still reaches 100% direct line, function, and branch coverage when it runs alone.
  5. Every bug found has a regression test that was committed and seen failing before its fix, and the ledger names the test and the fix commit (applies BUG-01).

**Plans**: 19/19 plans complete; 19 complete, 0 pending

**Wave 1**
- [x] 04-01-PLAN.md

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 04-02-PLAN.md

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 04-03-PLAN.md

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 04-04-PLAN.md

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 04-05-PLAN.md

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 04-06-PLAN.md

**Wave 7** *(bounded ACCOUNT adapter contracts, before lifecycle continuation)*
- [x] 04-11-PLAN.md

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 04-07-PLAN.md

**Wave 9** *(cached-identity dependency before trust-plan continuation)*
- [x] 04-12-PLAN.md

**Wave 10** *(blocked on Wave 9 completion)*
- [x] 04-08-PLAN.md

**Wave 11** *(completed 08/12 plus committed 09/correction-1 checkpoint)*
- [x] 04-13-PLAN.md — Replacement ownership, uncertain registration and poll boundary

**Wave 12** *(blocked on Wave 11 completion)*
- [x] 04-14-PLAN.md — Callable bindings, platform comments and typed API port

**Wave 13** *(blocked on Wave 12 completion)*
- [x] 04-15-PLAN.md — Silent logging, exact mocks and fresh concern seeds

**Wave 14** *(blocked on Wave 13 completion)*
- [x] 04-16-PLAN.md — Deferred synchronization, architecture gates and actual HTTP absence

**Wave 15** *(blocked on Wave 14 completion)*
- [x] 04-17-PLAN.md — Whole trust forwarding and full ACCOUNT correction 2

**Wave 16** *(blocked on Wave 15 completion)*
- [x] 04-18-PLAN.md — Registration test phases, accurate comment and architecture owner organization

**Wave 17** *(blocked on Wave 16 completion)*
- [x] 04-19-PLAN.md — Complete configured catalogue and full ACCOUNT correction 3

**Wave 18** *(08 complete; blocked on delegated 19 correction and resolved findings)*
- [x] 04-09-PLAN.md — Metadata closeout; original repairs and ledger preserved

**Wave 19** *(blocked on Wave 18 completion)*
- [x] 04-10-PLAN.md — Current inventory, historical evidence and final seal

**Batching**: Ten pairs. `accountRuntime.ts` (1,283 lines; test 3,365 lines) is a batch of its own and can split across sequential waves if one plan cannot hold it; the nine small modules fit in two or three batches. Plans are batches of source/test pairs, grouped so that no two plans in the same wave edit the same file. Each batch runs review → triage → fix → re-review, capped at about four rounds, and stops early on a round that does not lower the open count or that brings back a fixed finding. `gsd-code-reviewer` subagents review and `gsd-code-fixer` subagents fix, each with the project's `agent_skills`. Each fix is an atomic commit that passes the pre-commit hooks; never `--no-verify`.

ACCOUNT correction 1 at d785fd7 independently fixed original 001–029 and found 030–044.
The open count fell from 29 to 15, with no rejection or reopening; counter 1 continues.
Plans 13–17 declare those repairs before edits. They do not depend on the incomplete 09 summary;
its already committed implementation is an available checkpoint.
Correction 2 at d0f46b0 fixed 14, rejected none, found 045–048 and reopened none.
Five remain: 041/045/046/047/048; 48 accepted = 43 independently closed + 5 open.
The parent applied D-03 immediately: 5 < 15, no reopening, counter 2 < 4.
Plans 18–19 declare the bounded repairs and ONE whole correction 3 before edits.
Plan 09 closes after 19 only when actual findings are resolved and D-03 permits.
Correction 3 at 4a4e445 independently fixed all five: no new/rejected/reopened/open IDs.
All 48 accepted findings are closed at counter 3. Root first applied D-03: all false;
the subsequent full combined gate passed. Plan 09 metadata closeout and 10 seal remain.

### Phase 5: Accessories Conformance

**Goal**: Every module under `src/accessories/**` and every file under `test/accessories/**` conforms to the style, comment, and unit-testing rules, and any bug found there is fixed behind a regression test.
**Depends on**: Phase 1
**Requirements**: ACC-01
**Success Criteria** (what must be TRUE):
  1. The ledger preserves the review of all ten `src/accessories/**` modules and the fourteen test files in the Wave 0 inventory. The current tree has ten sources, ten paired tests and one real-HAP fidelity test; these 21 paths carry the Phase 1 header form. The three retired scanner tests remain historical review entries. The spot-check WARNING lines for `controls.ts` and `controls.test.ts` each have a recorded outcome.
  2. The phase ledger records each finding's rule, location, severity, and outcome. It names the two historical open scanner findings, the STOP decision and why those files were retired, without claiming the findings were fixed or rejected (applies PROC-01).
  3. Five batches close cleanly. GATES stops at its amended cap of fifteen rounds with two open findings in retired scanner code. The ledger preserves the STOP and the maintainer's replacement decision. Current lint boundaries, the retained HAP parity test and the full gate provide the replacement evidence; none is described as a clean GATES round (applies PROC-02).
  4. Every source/test pair the phase touched still reaches 100% direct line, function, and branch coverage when it runs alone.
  5. Every bug found has a regression test that was committed and seen failing before its fix, and the ledger names the test and the fix commit (applies BUG-01).

**Plans**: 8 completed, 1 stopped and superseded in 9 serial waves; phase verification passed after maintainer acceptance
**Wave 1**
- [x] 05-01-PLAN.md — Wave 0: findings ledger, ledger tracer, review protocol and fresh baseline gate

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 05-02-PLAN.md — DECLARATIONS: alarmMute, services, customCharacteristics and customServices pairs

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 05-03-PLAN.md — CATALOGUE: serviceCatalogue pair

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 05-04-PLAN.md — CONTROLS: controls pair and seed warnings CR-05-CONTROLS-001 to 007

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 05-05-PLAN.md — RECORDS: pumpRecords, reconciliation and staleMarking pairs (conditional S-05-07 consumer edit)

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 05-06-PLAN.md — ACCESSORY part 1: full review, header and source-side causes

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 05-07-PLAN.md — ACCESSORY part 2: test-side causes and correction rounds (same counter)

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 05-08-PLAN.md — GATES: stopped at round 15; custom scanners retired by maintainer decision, with history in 05-08-SUMMARY.md

**Wave 9** *(blocked on Wave 8 completion)*
- [x] 05-09-PLAN.md — Closeout: historical ledger, current lint and HAP parity checks, validation map and phase-end gate

**Cross-cutting constraints:**
- The batch is resumable: each correction round's report and counter row are committed before that round's repairs start, and each dispatch's fix commits are recorded in a ledger commit before the next dispatch, so a paused session resumes from the ledger through the protocol's resume check without repeating a committed round.
- The wave ends with a fresh npm run check exit 0 on the combined tree, recorded in the ledger.

**Batching**: The historical review covered ten source/test pairs plus four unpaired tests. The GATES batch reached its amended fifteen-round cap and stopped. The maintainer retired three scanner tests and their shared helper; the real-HAP fidelity test remains. The current closeout reviews the lint replacement and retained behavior checks. Earlier review reports and correction rounds remain in Git and in the ledger.

### Phase 6: Root Module Conformance

**Goal**: The root modules `src/platform.ts`, `config.ts`, `logging.ts`, `index.ts`, `settings.ts`, and `protocol.ts`, and their paired tests, conform to the style, comment, and unit-testing rules, and any bug found there is fixed behind a regression test.
**Depends on**: Phase 1, Phase 5
**Requirements**: ROOT-01
**Success Criteria** (what must be TRUE):
  1. The ledger lists the six root modules and their paired tests as reviewed, including the full 2,375-line `test/platform.test.ts`, and each file carries the Phase 1 header form. The repo-level gate tests stay unchanged unless a fix needs them, and the ledger says why for each one touched.
  2. The phase ledger records each finding's rule, location, severity, and outcome, fixed or rejected with a stated reason (applies PROC-01).
  3. The last re-review round reports no open finding, or the phase stopped at about four rounds or on a no-progress round with a report of what stays open and why (applies PROC-02).
  4. Every source/test pair the phase touched still reaches 100% direct line, function, and branch coverage when it runs alone.
  5. Every bug found has a regression test that was committed and seen failing before its fix, and the ledger names the test and the fix commit (applies BUG-01).

**Plans**: TBD
**Batching**: Six pairs. `platform.ts` (644 lines; test 2,375 lines) is a batch of its own; the other five fit in one or two batches. This phase runs after Phase 5 because `platform.ts` wires the accessories tier, so the two phases must not edit that wiring at the same time. Classify `test/configSchema.test.ts` and `test/packageManifest.test.ts` during discussion: each is either a root-module test in scope or a repo-level gate test left for the future requirement. Plans are batches of source/test pairs, grouped so that no two plans in the same wave edit the same file. Each batch runs review → triage → fix → re-review, capped at about four rounds, and stops early on a round that does not lower the open count or that brings back a fixed finding. `gsd-code-reviewer` subagents review and `gsd-code-fixer` subagents fix, each with the project's `agent_skills`. Each fix is an atomic commit that passes the pre-commit hooks; never `--no-verify`.

### Phase 7: Cucumber Feature Conformance

**Goal**: Every Gherkin file, step definition, and support module under `features/**` follows `features/CLAUDE.md`, `skills/cucumber-behavioral-testing`, and the TypeScript rules, and any bug found there is fixed behind a regression test.
**Depends on**: Phase 1
**Requirements**: FEAT-01, FEAT-02
**Success Criteria** (what must be TRUE):
  1. All fifteen `features/**/*.feature` files, including the three under `features/real-pump/`, use sentence-case scenario names, lower-case steps, no `And`, no "should", the present tense, "these" before a data table, and "the" for a specific thing (FEAT-01).
  2. Step definitions are grouped into modules by function rather than by feature file, ordered `Given()`, `When()`, `Then()`, and named for the given thing, the action, or `assert` plus the condition. All 21 TypeScript files under `features/support/**` and `features/real-pump/support/**` follow the TypeScript rules and carry the Phase 1 header form (FEAT-02).
  3. The default Cucumber profile passes with the same scenario count as at phase start, or the ledger explains each change in the count, and `cucumber-js --profile real --dry-run` resolves every real-pump step without contacting the vendor.
  4. The phase ledger records each finding's rule, location, severity, and outcome, and the last re-review round reports no open finding, or the phase stopped at the round cap with a report (applies PROC-01 and PROC-02).
  5. Every bug found has a regression test that was committed and seen failing before its fix, and every source/test pair a fix touched still reaches 100% direct coverage (applies BUG-01).

**Plans**: TBD
**Batching**: Batches split the `.feature` files (Gherkin rules) from the TypeScript step and support code. `features/support/world.ts` and `features/support/steps/harness.ts` serve every scenario, so a batch that edits them runs in a wave of its own. The real-pump files get static review and a dry run only, never a live run. Plans are batches grouped so that no two plans in the same wave edit the same file. Each batch runs review → triage → fix → re-review, capped at about four rounds, and stops early on a round that does not lower the open count or that brings back a fixed finding. `gsd-code-reviewer` subagents review and `gsd-code-fixer` subagents fix, each with the project's `agent_skills`. Each fix is an atomic commit that passes the pre-commit hooks; never `--no-verify`.

### Phase 8: Final Sweep and Gate

**Goal**: The whole in-scope tree passes one more review as a unit, the milestone bug ledger is complete and audited, and the full `npm run check` gate passes at milestone end.
**Depends on**: Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, Phase 7
**Requirements**: GATE-01, GATE-02, BUG-01
**Success Criteria** (what must be TRUE):
  1. A full-repo re-review of every in-scope file (`src/**`, the paired tests under `test/**`, and `features/**`) against all the rulebooks reports no open finding, including drift across subsystems such as a file without the Phase 1 header form (GATE-02).
  2. The full `npm run check` passes on the final combined tree: static checks, unpaired unit tests, Cucumber, and 100% direct line, function, and branch coverage for every source/test pair run alone (GATE-01).
  3. The milestone bug ledger lists every bug found in Phases 1 to 8. Each entry names its regression test and its fix commit, and the test fails when run against the tree just before the fix (BUG-01).
  4. Every phase ledger from Phase 1 to Phase 8 gives every finding an outcome, fixed or rejected with a stated reason, and every phase that stopped at the round cap has a report.

**Plans**: TBD
**Batching**: One full-repo review pass, split across reviewer subagents by subsystem, then fix batches under the same rules as earlier phases: no two plans in the same wave edit the same file, review → triage → fix → re-review capped at about four rounds, `gsd-code-reviewer` and `gsd-code-fixer` subagents with the project's `agent_skills`, and atomic commits that pass the pre-commit hooks; never `--no-verify`. The full `npm run check` runs on the combined tree after the last fix.

## Progress

**Execution order:** Phases run in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. Phases 2 to 7 need only Phase 1 (the header form and the ledger format). Phase 6 also runs after Phase 5, because `src/platform.ts` wires the accessories tier. Phase 8 runs after all the others.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Known Findings and Loop Proof | code-review-sweep | 4/4 | Complete    | 2026-10-13 |
| 2. Cloud Conformance | code-review-sweep | 5/5 | Complete    | 2026-10-14 |
| 3. Device and Persistence Conformance | code-review-sweep | 8/8 | Complete    | 2026-10-14 |
| 4. Runtime Conformance | code-review-sweep | 19/19 | Complete    | 2026-10-16 |
| 5. Accessories Conformance | code-review-sweep | 9/9 | Complete    | 2026-10-19 |
| 6. Root Module Conformance | code-review-sweep | 0/TBD | Not started | - |
| 7. Cucumber Feature Conformance | code-review-sweep | 0/TBD | Not started | - |
| 8. Final Sweep and Gate | code-review-sweep | 0/TBD | Not started | - |
