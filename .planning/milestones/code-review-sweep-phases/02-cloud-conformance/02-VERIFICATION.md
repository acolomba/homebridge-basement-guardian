---
phase: 02-cloud-conformance
verified: "2026-10-23T02:18:45Z"
status: passed
score: "18/18 must-haves verified"
covered_files: [".agents/skills/local-verification/SKILL.md",".agents/skills/typescript-style/SKILL.md",".agents/skills/typescript-unit-tests/SKILL.md",".planning/REQUIREMENTS.md",".planning/ROADMAP.md",".planning/phases/02-cloud-conformance/02-01-PLAN.md",".planning/phases/02-cloud-conformance/02-01-SUMMARY.md",".planning/phases/02-cloud-conformance/02-02-PLAN.md",".planning/phases/02-cloud-conformance/02-02-SUMMARY.md",".planning/phases/02-cloud-conformance/02-03-PLAN.md",".planning/phases/02-cloud-conformance/02-03-SUMMARY.md",".planning/phases/02-cloud-conformance/02-04-PLAN.md",".planning/phases/02-cloud-conformance/02-04-SUMMARY.md",".planning/phases/02-cloud-conformance/02-05-PLAN.md",".planning/phases/02-cloud-conformance/02-05-SUMMARY.md",".planning/phases/02-cloud-conformance/02-API-RED-EVIDENCE.json",".planning/phases/02-cloud-conformance/02-API-REVIEW.md",".planning/phases/02-cloud-conformance/02-AUTH-RED-EVIDENCE.json",".planning/phases/02-cloud-conformance/02-AUTH-REVIEW.md",".planning/phases/02-cloud-conformance/02-CONTEXT.md",".planning/phases/02-cloud-conformance/02-DISCUSSION-LOG.md",".planning/phases/02-cloud-conformance/02-FINDINGS.md",".planning/phases/02-cloud-conformance/02-PATTERNS.md",".planning/phases/02-cloud-conformance/02-RESEARCH.md",".planning/phases/02-cloud-conformance/02-REVIEW-DISPOSITION.md",".planning/phases/02-cloud-conformance/02-REVIEW-FIX.md",".planning/phases/02-cloud-conformance/02-REVIEW-PROTOCOL.md",".planning/phases/02-cloud-conformance/02-REVIEW.md",".planning/phases/02-cloud-conformance/02-SECURITY.md",".planning/phases/02-cloud-conformance/02-SHADOW-RED-EVIDENCE.json",".planning/phases/02-cloud-conformance/02-SHADOW-REVIEW.md",".planning/phases/02-cloud-conformance/02-SOURCE-AUDIT.md",".planning/phases/02-cloud-conformance/02-TRANSPORT-REVIEW.md",".planning/phases/02-cloud-conformance/02-UAT.md",".planning/phases/02-cloud-conformance/02-VALIDATION.md",".planning/phases/02-cloud-conformance/COVERAGE.md",".planning/phases/02-cloud-conformance/FALLOW-normalized.json",".planning/phases/02-cloud-conformance/FALLOW.json","AGENTS.md","cucumber.json","features/real-pump/support/realWorld.ts","features/step_definitions/account.steps.ts","package-lock.json","package.json","scripts/check-corresponding-tests.mjs","scripts/test-coverage-direct.mjs","src/cloud/api.ts","src/cloud/auth.ts","src/cloud/errors.ts","src/cloud/httpDispatcher.ts","src/cloud/mqttTransport.ts","src/cloud/shadow.ts","src/cloud/sigv4.ts","src/cloud/types.ts","src/runtime/accountRuntime.ts","test/cloud/alpnServer.ts","test/cloud/api.test.ts","test/cloud/apiSeeds.ts","test/cloud/auth.test.ts","test/cloud/errors.test.ts","test/cloud/httpDispatcher.test.ts","test/cloud/mqttTransport.test.ts","test/cloud/shadow.test.ts","test/cloud/sigv4.test.ts","test/cloud/sigv4Seeds.ts","test/cloud/types.test.ts","test/platform.test.ts","test/runtime/accountShadowContract.ts"]
covered_digest: "v3:sha256:12e7e6d550b8d1b5fc3b09b3a08dbd7036e41923a1329af40d86537a93f676a7"
behavior_unverified: 0
overrides_applied: 0
decision_coverage: {honored: 7, total: 7, not_honored: []}
re_verification:
  previous_status: passed
  previous_score: "18/18"
  gaps_closed: []
  gaps_remaining: []
  regressions: []
judgment_resolutions:
  - {id: E-02-01, status: acknowledged_assumption, reported: pass, accepted_by: maintainer, source: ".planning/phases/02-cloud-conformance/02-UAT.md#1"}
  - {id: P-02-01, status: confirmed, reported: pass, accepted_by: maintainer, source: ".planning/phases/02-cloud-conformance/02-UAT.md#2"}
  - {id: P-02-02, status: confirmed, reported: pass, accepted_by: maintainer, source: ".planning/phases/02-cloud-conformance/02-UAT.md#3"}
retained_limits:
  - "Taxonomy completeness is an acknowledged assumption, not an exhaustive claim."
  - "Active HTTP/2 teardown remains unconfirmed and unmeasured; cleanup evidence is limited to current HTTP/1.1 consumers."
  - "No live vendor, hardware, or universal protocol guarantee is inferred."
human_verification: []
---

# Phase 2: Cloud Conformance Verification Report

**Phase goal:** Every module under `src/cloud/**` and every file under `test/cloud/**` conforms to the style, comment, and unit-testing rules, and any bug found there is fixed behind a regression test.

**Verified:** 2026-10-23T02:18:45Z. **Status:** passed. **Checked revision:** `a18d3141fd7aceab702d04c2bc482e8e7ed7512b` plus concurrent planning-only verification records. The previous report passed; this pass refreshes its evidence against the current tree.

## Goal Achievement

The five ROADMAP success criteria remain mandatory. PLAN truths add specific cloud behavior and gate checks. The final three rows record actual Phase 2 maintainer judgments.

| # | Observable truth | Status | Current evidence |
| --- | --- | --- | --- |
| 1 | Complete cloud inventory, headers, and five auth warning outcomes | VERIFIED | `rg --files` lists eight source modules and 11 cloud test files: the original nine plus approved `apiSeeds.ts` and `sigv4Seeds.ts`. The 19-file ledger records header inspection and each auth warning disposition. The current advisory review covers 21 live paths; the old auth step file was deleted and live account steps moved to `features/step_definitions/account.steps.ts`. |
| 2 | Every finding has a rule, location, severity, and disposition | VERIFIED | Four batch reviews and `02-FINDINGS.md` record 56 accepted causes, all fixed. `02-REVIEW-DISPOSITION.md` keeps CR-02-API-017 fixed with `open: 0`; its earlier open row is historical. |
| 3 | Bounded independent review closes or stops with an explicit pause | VERIFIED | Auth 14→2→0, shadow 10→0, API 15→1→0 then correction round 3 closes API-017 1→0, transport 13→0. No reopening/stall. Current 21-file advisory review reports zero new or reopened findings. |
| 4 | Every touched cloud pair has 100% direct line, function, branch coverage | VERIFIED | Current `coverage/direct.lcov` has eight `src/cloud` records; each has `LH=LF`, `FNH=FNF`, `BRH=BRF`. Fresh full gate reports 43/43 pairs passed. |
| 5 | Every found bug has a pre-fix failing active regression and fix | VERIFIED | Six genuine records in nested auth, shadow, and API RED evidence. Current classifier returns `RED_EVIDENCE_OK` on each outer record. Independently checked all six source→evidence→fix→HEAD ancestry chains and confirmed every evidence commit changed only its batch JSON. Ledger and `02-REVIEW-FIX.md` name active targets, including API-017's four dot-only cases. Assertion mutations are separate. |
| 6 | Auth cancellation is independent and the grant slot stays owned through settlement | VERIFIED | `auth.ts:533-553` tracks waiters and clears the slot in `finally`. Named joined-caller cancellation test passed: one executed, no skip. |
| 7 | Auth tests use offline HTTP and independent public/cache expectations | VERIFIED | `auth.test.ts` injects transport and case-owned storage; `authOptions` has a fixed synthetic failure default. Public token and complete cache bytes are asserted. |
| 8 | Only a current accepted shadow report reaches the patch callback | VERIFIED | `shadow.ts` narrows reported sections and guards callbacks with `isCurrent`. Named stale-connection routing test passed, one executed; accepted-patch and desired-state exclusion cases assert complete values. |
| 9 | Shadow readiness, deadlines, rotation, and shutdown work offline | VERIFIED | Active owner tests cover request-completion readiness, deadlines, replacement, late notifications, and close. Current owner is included in the full gate. |
| 10 | REST route, deadline, error, and privacy contracts hold | VERIFIED | `api.ts:83` rejects exact dot-only segments before auth/HTTP. Named read-refusal variants passed; owner also tests command refusal, whole-operation timeouts, sanitized errors, and declared routes. |
| 11 | Wire validation preserves opaque telemetry and absence semantics | VERIFIED | `types.ts:170` maps only six consumed fields; `shadow.ts:197-210` leaves missing/non-finite values absent. Independent malformed/omitted cases pass; maintainer confirmed P-02-01. |
| 12 | Vendor HTTP uses paired undici fetch/Agent and HTTP/1.1 | VERIFIED | `httpDispatcher.ts` imports both from `undici` and passes shared `Agent({allowH2: false})`. Local ALPN owner asserts complete response and negotiated `http/1.1`. |
| 13 | MQTT callbacks/deadlines/teardown and signer bytes retain contracts | VERIFIED | Runtime supplies `createMqttTransport` to shadow. Named repeated-end test passed, one executed. Signer owner compares complete independent URLs; relevant pairs have 100% direct coverage. |
| 14 | Isolated owners and final combined-tree gate pass | VERIFIED | Fresh current-tree `npm run check` exit 0 on Node v26.12.1: six static checks, 130/130 Cucumber scenarios, 1401/1401 steps, 43/43 direct pairs. Log: `/private/tmp/guardian-phase2-verification-regression-check-unsandboxed.log`. Executable-input diff from clean `dd878480` is empty. |
| 15 | Review pauses, high/critical threats, and judgment flags gate sealing | VERIFIED | No D-03 pause. Current security refresh preserves 17/17 authored mitigations closed at ASVS L1; validation covers 14/14 tasks/correction. Taxonomy and protocol limits remain explicit. |
| 16 | E-02-01 taxonomy boundary has explicit Phase 2 resolution | VERIFIED (human judgment) | UAT checkpoint 1 records maintainer `pass`: full-file review and concrete tests define this phase's boundary; taxonomy completeness is not claimed. |
| 17 | P-02-01 forbids guessed normal telemetry | VERIFIED (human judgment) | UAT checkpoint 2 records maintainer `pass` and confirms absent/untrustworthy values remain without guessed normal measurements. |
| 18 | P-02-02 forbids overstating paused, skipped, unreviewed, archived, or hardware-only work | VERIFIED (human judgment) | UAT checkpoint 3 records maintainer `pass` for bounded review/test scope and retains active-H2, vendor, and hardware limits. |

**Score:** 18/18; 0 present but behavior-unverified; 0 overrides. The historical maintainer judgments remain valid for their stated scope and are not inferred from the current test gate.

### Plan and Requirement Accounting

All five PLAN frontmatters declare `CLOUD-01`; `.planning/REQUIREMENTS.md` assigns and marks it complete for Phase 2. No other requirement is mapped to this phase. PLAN 01 truths map to rows 1–4 and 6–7; PLAN 02 to 3–4 and 8–9; PLAN 03 to 3–4 and 10–11; PLAN 04 to 3–4 and 12–13; PLAN 05 to 1–5 and 14–15. Its two judgment-tier prohibitions map to rows 17–18. ROADMAP criteria remain rows 1–5. Phase 8 owns milestone-wide BUG-01/GATE-01/GATE-02, although their applicable cloud checks pass here.

### Required Artifacts and Key Links

The generic artifact query passes all 17 PLAN artifacts. Its key-link query misses reverse-direction declarations and `.ts` paths imported as `.js`; manual traces establish actual use.

| Artifact group | Substance and consumer | Status |
| --- | --- | --- |
| Auth source/owner/review | Shared grant/cache; offline owner; runtime composition at `accountRuntime.ts:1303` | VERIFIED |
| Shadow source/owner/review | Reported-only current connection; runtime callbacks at `accountRuntime.ts:1322` | VERIFIED |
| API, types, errors and owners/review | Predicates/normalizer/error used by API; runtime uses API methods | VERIFIED |
| HTTP, MQTT, signer and owners/review | Actual undici/MQTT/signing code; runtime injects HTTP and MQTT ports | VERIFIED |
| ALPN and seed helpers | Owners import/call them; case-owned local server and independent synthetic inputs | VERIFIED |
| Findings, validation, RED evidence | Cause/provenance ledger, current gate evidence, active tests, four batch reports | VERIFIED |

| Key link | Manual trace | Status |
| --- | --- | --- |
| Auth owner → factory → runtime | Test imports/calls `createAuthClient`; runtime calls factory with storage/HTTP | WIRED |
| Shadow owner → factory → runtime | Owner delivers transport events; runtime composes callbacks and MQTT factory | WIRED |
| API → types/errors → runtime | API narrows responses and returns real data; runtime imports and calls API | WIRED |
| HTTP owner → ALPN helper | Owner starts loopback server and inspects response/protocol | WIRED |
| Shadow → MQTT and signer | Runtime supplies MQTT factory; shadow calls signer with credentials/clock | WIRED |
| Findings → reviews; validation → npm script | Ledger cites four reports; `package.json` check runs static, build, Cucumber, all-pair coverage | WIRED |

### Data Flow

There is no rendered UI value in this internal phase. Cloud API responses are fetched, shape-checked, narrowed by `toApiDevice`, returned to `accountRuntime`, and used in discovery. Shadow MQTT payloads are parsed, narrowed to accepted reported sections, guarded by current connection, and passed to runtime `onPatch`. Owners inject synthetic responses/messages and assert public values; production does not return static fixtures. No live vendor or hardware observation is claimed.

### Behavioral Spot-Checks and Test Quality

| Behavior | Command / evidence | Result |
| --- | --- | --- |
| Independent auth cancellation | Named `keeps the joined caller grant alive when the first caller aborts` | PASS, 1 test |
| Stale shadow message suppression | Named `routes no message arriving on a connection it has replaced` | PASS, 1 test |
| Dot-only read refusal | Named `rejects device read identifier` | PASS, 2 tests (`.`, `..`) |
| Repeated MQTT end | Named `ends the client once and resolves both times when ended twice` | PASS, 1 test |
| Final combined gate | `NPM_CONFIG_CACHE=/private/tmp/guardian-phase2-verification-npm-cache TEST_CONCURRENCY=1 node .codex/gsd-core/bin/gsd-tools.cjs run-with-timeout 2400 -- bash -c 'npm run check'` | PASS, exit 0; 130 scenarios, 1401 steps, 43 pairs |

Requirement-linked owners have no committed `.skip`, `.only`, or `.todo` tests. Sampled auth/cache, shadow patch, API route/deadline, error, ALPN, MQTT, and signer cases assert values or transitions rather than mere existence. Seed helpers supply independent inputs; no expected output is generated by calling the production function under test. The current direct LCOV confirms all cloud pair denominators match. The first full-check attempt failed due a root-owned npm cache; the sandboxed attempt could not bind loopback. Only the final isolated-cache, loopback-enabled exit 0 counts. No Phase 2 probe script is declared, so probe execution is not applicable.

### Decision Coverage and Anti-Patterns

The decision-coverage query reports 7/7 honored, zero missing. Scans of `src/cloud/**` and `test/cloud/**` found no unresolved `TBD`, `FIXME`, `XXX`, `TODO`, placeholder implementation, or disabled test. No new scoped defect was reproduced. The current advisory re-review covers later edits to `test/cloud/shadow.test.ts`, `test/platform.test.ts`, and the real-pump consumer; unchanged files match original reviewed Git blobs. The inherited Fallow clone warning from later work has no failing cloud test.

### Human Verification

No Phase 2 human item remains pending. PLAN 05's deferred check was completed by three actual UAT decisions. This phase has no new user-facing flow. Active HTTP/2 teardown remains unconfirmed and unmeasured; no universal cleanup, vendor occurrence, or hardware result is asserted.

### Gaps Summary

None. All ROADMAP criteria, added PLAN truths, links, regression histories, and guards are satisfied for the bounded cloud scope. Phase 8 still owns milestone-wide final re-review and gate.

---

_Verified: 2026-10-23T02:18:45Z_
_Verifier: gsd-verifier_
