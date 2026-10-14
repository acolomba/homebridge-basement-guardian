---
phase: "02"
slug: "cloud-conformance"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-13"
---

# Phase 2 — Validation Strategy

## Test Infrastructure

Use the installed Node test runner and TypeScript build in tsconfig.test.json.
Compile with `npm run build:test`; run owners from dist-test/test/cloud.
The full gate is `npm run check`, with a 2,400-second limit. A timeout is not a pass.
No framework installation or live vendor access is required.

## Sampling Rate

After edits, compile and run the owner tests. Before code commits, run isolated
coverage and the required pre-commit checks, then verify the foreground commit
hook. After each combined wave and before phase verification, run the full gate.
Reuse evidence only for unchanged inputs under skills/local-verification/SKILL.md.
Serialize compilation, mutation experiments, helper edits, Git and ledger writes.

## Per-Task Verification Map

All rows address CLOUD-01. Owner commands use current compiled output;
coverage commands rebuild it. The plans include an immediate fails_when sibling
for every runnable automated command. No execution result is inferred here.

| Task ID | Automated command / scope | Threat Ref | Failure signal | Status |
| --- | --- | --- | --- | --- |
| 02-01-01 | npm run build:test && node --test dist-test/test/cloud/auth.test.js | T-02-01, T-02-02, T-02-03 | Nonzero, zero/skipped/cancelled target or wrong public cache/cancellation result | Pass: final owner 69/69; complete public tracer |
| 02-01-02 | npm run build:test && node --test dist-test/test/cloud/auth.test.js dist-test/test/platform.test.js; npm exec --no -- cucumber-js --profile real --dry-run | T-02-04 | Nonzero, missing owner/step resolution or changed filename contract | Pass: snapshot owners 129/129; dry-run resolves 7 scenarios/41 steps, no execution |
| 02-01-03 | npm run test:coverage:direct -- src/cloud/auth.ts test/cloud/auth.test.ts | T-02-01 through T-02-04 | Nonzero, missing source coverage or any metric below 100% | Pass: isolated 100%; independent rounds 14→2→0 |
| 02-02-01 | npm run build:test && node --test dist-test/test/cloud/shadow.test.js | T-02-05 | Nonzero, zero/skipped/cancelled target or invalid patch/current callback accepted | Pass: final owner 55/55; exact current reported patch |
| 02-02-02 | npm run test:coverage:direct -- src/cloud/shadow.ts test/cloud/shadow.test.ts | T-02-05, T-02-06, T-02-07 | Nonzero, missing source coverage or any metric below 100% | Pass: isolated 100%; independent round 10→0 |
| 02-03-01 | npm run build:test && node --test dist-test/test/cloud/api.test.js; npm run test:coverage:direct -- src/cloud/api.ts test/cloud/api.test.ts | T-02-08, T-02-09, T-02-10 | Nonzero, missing owner/coverage or wrong public deadline/privacy result | Pass: owner 33/33; isolated 100%; both real bug records |
| 02-03-02 | npm run test:coverage:direct -- src/cloud/types.ts test/cloud/types.test.ts | T-02-08 | Nonzero, missing source coverage or any metric below 100% | Pass: owner 77/77; isolated 100% |
| 02-03-03 | npm run test:coverage:direct -- src/cloud/errors.ts test/cloud/errors.test.ts | T-02-10 | Nonzero, wrong structured error or any metric below 100% | Pass: owner 5/5; isolated 100%; rounds 15→1→0 |
| 02-04-01 | npm run build:test && node --test dist-test/test/cloud/httpDispatcher.test.js; npm run test:coverage:direct -- src/cloud/httpDispatcher.ts test/cloud/httpDispatcher.test.ts | T-02-11, T-02-12 | Nonzero, listener/setup error, wrong ALPN/HTTP result or coverage below 100% | Pass: owner 3/3; isolated 100%; complete response and cancellation |
| 02-04-02 | npm run test:coverage:direct -- src/cloud/mqttTransport.ts test/cloud/mqttTransport.test.ts | T-02-12, T-02-13 | Nonzero, lifecycle/teardown contract failure or coverage below 100% | Pass: owner 21/21; isolated 100%; strict interactions and callback-owned end |
| 02-04-03 | npm run test:coverage:direct -- src/cloud/sigv4.ts test/cloud/sigv4.test.ts | T-02-11, T-02-13 | Nonzero, wrong exact signing bytes or coverage below 100% | Pass: owner 9/9; isolated 100%; independent round 13→0 |
| 02-05-01 | PLAN.md's Node ledger-section assertion, then real provenance inspection | T-02-14 | Nonzero, missing ledger sections/CLOUD-01 or absent LEDGER_TRACER_OK | Pending |
| 02-05-02 | npm run build:test && node --test dist-test/test/packaging/licenseHeaders.test.js && npm run check | T-02-14, T-02-15, T-02-16 | Nonzero, timeout, static/Cucumber failure or any isolated pair below 100% | Pending |

For each module above, run `npm run test:coverage:direct -- src/cloud/<module>.ts test/cloud/<module>.test.ts`.
Every pair alone must reach 100% lines, functions and branches. Shared helper
or feature support edits select all pairs under the staged-input hook policy.
If removing the filename export, also verify the platform test and both feature
support consumers; preserve the existing on-disk path.

## Wave 0 Requirements

Existing infrastructure covers the phase. Create the coordinator-owned inventory,
findings and review-round records. Batch executors create their own review evidence.
Use case-owned loopback servers where required; sandbox EPERM is not bug RED.
Executors run sequentially in the existing worktree under recorded isolation none.
The coordinator maintains live rounds from first triage and writes a diagnostic
ledger immediately on a pause; central final consolidation occurs in 02-05.

## Manual-Only Verifications

| Behavior | Requirement | Instructions |
| --- | --- | --- |
| Complete inventory | CLOUD-01, PROC-03 | Record all eight source/test pairs and the ALPN helper; inspect each full header. |
| Finding closure | CLOUD-01, PROC-01 | Record stable IDs, exact rules/locations, dispositions and real evidence. |
| Bounded convergence | PROC-02 | Independent re-review; pause all work on stall, reopening or round four. |
| Bug provenance | BUG-01 | Observe active RED on unchanged production; commit full patch/output/source record before GREEN fix; inspect real Git ancestry. |

Negative-control mutations demonstrate assertions; they do not prove production
bugs. Restore every mutation. No skipped or hidden regression substitutes for RED.

## Probe and Judgment Handoff

E-02-01/CLOUD-01 is exactly one unclassified/unresolved deterministic fallback
edge, carried as a flagged assumption. Concrete tests do not establish taxonomy
completeness. P-02-01 safety and P-02-02 truthful completion are descriptorless
judgment prohibitions in 02-05; both remain flagged-unverified. No check path,
automatic dismissal or approval is invented. The phase-end human-check records
actual judgment or retains these flags. Phase 1 approval applies to Phase 1 scope.
Probe equality and recall/precision evidence are in 02-SOURCE-AUDIT.md.

## Validation Sign-Off

- [ ] Final plans map every task to automated checks or explicit evidence checks.
- [ ] No three consecutive tasks lack automated verification.
- [ ] All references exist; no watch commands or live services.
- [ ] All eight isolated pairs reach 100% direct coverage.
- [ ] Full combined-tree gate passes.
- [ ] Independent round evidence, complete ledger and headers pass.
- [ ] Provenance is audited for each genuine bug.
- [ ] nyquist_compliant and wave_0_complete reflect executed evidence.

**Approval:** Pending execution and independent validation. Phase 1 is an
unchanged-source baseline for planning, not proof of future Phase 2 edits.

## Wave 1 measured evidence

The coordinator ran npm run check on clean HEAD
eccbe11e0cfe7baa6970dbb65776a6d95858dc4d, with source revision
14c740371e8a35f8ade64b7f890c0f88269e7f03, Node v26.11.1. Exit 0 was
observed before 2026-10-13T23:57:28Z. All static gates passed, 104 Cucumber
scenarios and 1,156 steps passed, and all 43 isolated pairs passed and merged
their LCOV into coverage/direct.lcov. Complete log:
/private/tmp/guardian-phase2-wave1-full-check.log.

The committed auth report and summary record all 16 fixed findings, two cleanly
reconciled rounds (14→2→0), actual passing hooks, both genuine pre-fix regression
records, and exact source restoration for separate assertion controls. The summary
validator passes. Wave hooks report no schema drift; codebase drift is skipped
because no STRUCTURE.md exists. No broader conformance review is implied by the
full gate. CLOUD-01 remains pending until the other declaring plans finish.

Subsequent coordinator changes are planning records only. This clean verified HEAD
is the reuse reference; any later build-input edit requires a new full wave gate.

## Wave 2 measured evidence

The coordinator ran npm run check on clean HEAD
d7db0c2847ae7417bf6361f53ba193b67339dc0a, with shadow source revision
8277ae16577453bd270803f09941ee74f8b2fbd7, Node v26.11.1. Exit 0 was
observed before 2026-10-14T00:22:17Z. All static gates passed, 104 Cucumber
scenarios and 1,156 steps passed, and all 43 isolated pairs passed and merged
their LCOV into coverage/direct.lcov. Complete log:
/private/tmp/guardian-phase2-wave2-full-check.log.

The committed shadow report and summary retain ten independently fixed findings,
round 1 reconciliation 10→0, complete headers, actual passing hooks, genuine
overflowing-version RED/source/evidence/fix provenance, and restored wrong-secret
assertion controls. The summary validator passes. Wave hooks report no schema
drift; codebase drift is skipped because no STRUCTURE.md exists. Remaining cloud
conformance batches and the phase-end judgment flags remain pending.

This clean verified HEAD replaces the Wave 1 reuse reference. Subsequent planning
record updates change no executable input; later code edits require a new gate.

## Wave 3 measured evidence

The coordinator ran npm run check on clean HEAD
b3eaaf19b85f06dfb9f57e5ac3517464f5a3e77b, with reviewed code revision
f34682f12200e9b5985bf79d3c2c77dc22b67838, Node v26.11.1. Exit 0 was
observed before 2026-10-14T01:13:01Z. All static gates passed, 104 Cucumber
scenarios and 1,156 steps passed, and all 43 isolated pairs passed and merged
their LCOV into coverage/direct.lcov. Complete log:
/private/tmp/guardian-phase2-wave3-full-check.log.

The committed API report and summary account for 16 fixed findings, independent
rounds 15→1→0, both genuine error-handling RED/source/evidence/fix histories,
actual passing hooks, and separate restored assertion controls. The parent
authorized test/cloud/apiSeeds.ts as the required reusable fresh-seed concern
module. It was reviewed with the six original files, has a complete header, and
its support change passed the all-pair commit selector. Final inventory therefore
includes this helper in addition to the original 17 cloud files.

The dot-only identifier concern remains UNCONFIRMED: the API's string and wire
contracts permit dot-only values, while URL normalization changes their target
path. The documented vendor shape suggests other identifiers but supplies no
established hard precondition here; no vendor occurrence was observed. It is
neither fixed nor dismissed on improbability. Carry its actual behavior and
contract limitation into the central ledger and phase-end judgment.

Summary validation and schema-drift gate pass; codebase drift is skipped without
STRUCTURE.md. This clean verified HEAD replaces the Wave 2 reuse reference.
Transport/signing review, final consolidation and phase judgments remain pending.

## Wave 4 measured evidence

The coordinator ran npm run check on clean HEAD
e57e7d4d3a6276838a8d5024cdb0644413d28d75, with reviewed code revision
fb3de06560c1978281bfd8ee4f97c3fd8b9d1204, Node v26.11.1. Exit 0 was
observed before 2026-10-14T12:39:55Z. All static gates passed, 104 Cucumber
scenarios and 1,156 steps passed, and all 43 isolated pairs passed and merged
their LCOV into coverage/direct.lcov. Complete log:
/private/tmp/guardian-phase2-wave4-full-check.log.

The committed transport report and summary account for 13 fixed findings,
one independent round 13→0, actual passing hooks and four separately restored
assertion controls. No genuine production bug was established in this batch.
The authorized test/cloud/sigv4Seeds.ts holds the existing fresh input seed.
It has a complete header and independent full-file review; its support edit
passed the all-pair commit selector. Final cloud inventory is 19 files, including
both authorized seed helpers in addition to the original 17.

The ALPN helper's active HTTP/2 session-close concern remains UNCONFIRMED.
The expected HTTP/1.1 cases pass; no executed current failure establishes a
finding. Carry it alongside the API dot-only concern into the central ledger
and phase-end judgment without inventing a production bug or cleanup change.

Summary validation and schema-drift gate pass; codebase drift is skipped without
STRUCTURE.md. The executor completed its records before the requested stop
reached it. Actual committed completion was reconciled, so no duplicate retry
was dispatched. Its recorded elapsed time includes the delayed closeout.

This clean verified HEAD replaces the Wave 3 reuse reference. Final ledger,
independent phase audits and phase-end judgments remain pending. Subsequent
planning-only edits can reuse this result only after exact input comparison.
