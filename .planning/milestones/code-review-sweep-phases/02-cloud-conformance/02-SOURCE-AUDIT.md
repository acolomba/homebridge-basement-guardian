# Phase 02 source and probe audit

Planning mode: standard, tracer-first, MVP off, reversibility gates on.
Discovery Level 0: existing architecture/patterns and installed tools; no new
dependencies, API integration, ORM schema or AI system. Estimates use measured
calibration factor 1, sample_count 0, confidence low; no self-rated confidence.

## Dependency and ownership audit

| Plan / wave | Needs | Creates / expands | Tasks |
| --- | --- | --- | --- |
| 02-01 / 1 | Phase 1 auth baseline, complete rulebooks | Auth pair, conditional exact filename consumers, batch evidence | 3 |
| 02-02 / 2 | Previous executor/combined gate released shared resources | Shadow pair and batch evidence | 2 |
| 02-03 / 3 | Previous executor/combined gate released shared resources | API/types/errors pairs and batch evidence | 3 |
| 02-04 / 4 | Previous executor/combined gate released shared resources | HTTP/MQTT/signing pairs, ALPN helper and batch evidence | 3 |
| 02-05 / 5 | All four reports/summaries and current gate evidence | Central findings and executed validation | 2 |

Serial dependencies protect shared build output, mutation restoration and the
Git index in the existing worktree under isolation none. They add no product
dependency. Same-wave file overlap is absent. Every task modifies at most five
declared files, including its conditional evidence. API and transport use three
tasks so each pair can carry real bug evidence without crossing that limit.
Batch code scopes are disjoint; only auth owns its three conditional external
consumers, and only transport owns alpnServer.ts. Coordinator owns shared state.

Existing implementation/rulebook/compiler/gate paths were checked with git
ls-files. Reports, conditional RED records, numbered summaries, protocol,
coverage declaration and this audit are explicitly new paths. Core workflow
references are runtime instructions; no runtime mirror is edited. Commands are
repo-root-relative and compiled owners use dist-test/test/cloud. No test/dist
path is authored. Local verification owns all reuse and combined gate rules.

## Multi-source coverage

| Source | ID | Feature or constraint | Plans/tasks | Status |
| --- | --- | --- | --- | --- |
| GOAL | Phase 2 | Every cloud source/test file conforms; every genuine bug is regression-proven | 02-01 through 02-05 | COVERED |
| REQ | CLOUD-01 | src/cloud/** and test/cloud/** conform | All five plans | COVERED |
| RESEARCH | Inventory | Eight source/test pairs and ALPN helper; four exclusive batches | 02-01, 02-02, 02-03, 02-04 | COVERED |
| RESEARCH | Auth warnings | Length-only and negative assertions, true optional policy, live HTTP default, filename purpose | 02-01-01 through 02-01-03 | COVERED |
| RESEARCH | Exact consumers | Four filename consumers; auth owns narrow external changes if removed | 02-01-02 | COVERED |
| RESEARCH | API tests | API helper fails closed; whole public request/result and structured errors | 02-03-01, 02-03-03 | COVERED |
| RESEARCH | Shared shapes | exactOptionalPropertyTypes; trace clears/builders/callers; no mechanical public patch conversion | 02-01-03, 02-03-02 | COVERED |
| RESEARCH | Tier boundary | Cloud carries opaque wire values; family meaning stays in device adapters | 02-02, 02-03 | COVERED |
| RESEARCH | Shadow | Current-connection guards, reported-only patches, readiness/rotation/shutdown | 02-02 | COVERED |
| RESEARCH | Transport | Pinned undici fetch/Agent HTTP/1.1, MQTT handshake contract, existing Node crypto | 02-04 | COVERED |
| RESEARCH | Resources | Case-owned loopback/certificate/filesystem teardown; no helper meta-tests | 02-04-01, 02-04-02 | COVERED |
| RESEARCH | Runtime state | Preserve cache filename/format/storage, device identity, service config, registrations and secrets/env contracts | 02-01 through 02-04 | COVERED |
| RESEARCH | Verification | Eight isolated direct 100% pairs, staged helper/feature selection, current compiled paths, full gates | All plans; 02-05-02 | COVERED |
| RESEARCH | Environment | Listener/setup errors are not RED; no framework install/vendor/hardware run | Protocol; 02-04-01; all batches | COVERED |
| RESEARCH | Process | Full rulebooks, independent bounded reviews, passing-hook commits, real ancestry and privacy | Protocol; all tasks; 02-05 | COVERED |
| RESEARCH | Security | ASVS L1/high blocking, cache/redaction, ownership, deadlines, validation/crypto | T-02-01 through T-02-16 | COVERED |
| CONTEXT | D-01 | Separate header sections, original copyright, preserved license/attribution, all 17 files | All batches; 02-05-02 | COVERED |
| CONTEXT | D-02 | Stable complete findings, independent roles and passing-hook cause commits | Protocol; all batches; 02-05 | COVERED |
| CONTEXT | D-03 | Global pause on open-count stall, reopened fix or round four | Protocol; batch close tasks; 02-05 | COVERED |
| CONTEXT | D-04 | Active unchanged-production RED; complete planning record commit before GREEN; separate restored controls | All batch tasks; 02-05 | COVERED |
| CONTEXT | D-05 | Independent auth cancellation, final-caller abort, slot through settlement, single grants/no retry | 02-01-01, 02-01-03 | COVERED |
| CONTEXT | D-06 | Minimum confirmed causes, preserved product/privacy/unknown semantics; no new integration | All batch tasks; 02-05 | COVERED |
| CONTEXT | D-07 | Direct 100%, full waves/final gate, exact-input reuse, offline only | All plans; protocol; 02-05-02 | COVERED |

Exclusions are explicit source exclusions: other subsystem/Cucumber full sweeps,
repo-level gate-test review, live hardware/vendor runs, release-only gates and
PR/version/release duties. The three conditional feature/platform edits are
bounded filename consumers, not a sweep of those phases. All required source
items are covered; final review outcomes are execution evidence, not pre-approved.

## Spec-less fallback and equality

No phase SPEC supplies Edge Coverage or Prohibitions. The absent configuration
key defaults the fallback ON. The supplied deterministic report has exactly one
item: CLOUD-01, category unclassified, status unresolved, verification null,
probe unclassified — review manually. No resolved edge is available to lift.
E-02-01 is explicitly carried in 02-05 as a flagged assumption; concrete test
coverage does not invent taxonomy completion.

## Prohibition recall and precision

The adversarial recall asks what CLOUD-01 could silently become that the author
would object to. One precision pass gives these ten candidates:

| Candidate | Precision outcome | Owner / rationale |
| --- | --- | --- |
| Guessed healthy basement telemetry during conformance | KEEP P-02-01 safety | Bespoke product safety intent |
| Paused/skipped/unreviewed evidence presented as complete | KEEP P-02-02 transparency | Bespoke truthful sweep completion |
| Missed cloud file | DROP routine engineering | Inventory/full-file review |
| Weak result assertion | DROP routine engineering | Unit rulebook/re-review |
| Stale compiled owner | DROP routine engineering | Local verification |
| Duplicate grants or lost cancellation ownership | DROP routine engineering | D-05 public behavior and auth tests |
| Wrong optional-field semantics | DROP routine engineering | Compiler/caller trace and owner tests |
| Leaked local listener/file handle | DROP routine engineering | Case teardown and adapter review |
| Credential/injection/path security violation | DROP canon security | Canon referral below |
| Speculative API/protocol additions disguised as cleanup | DROP routine scope correctness | Locked D-06 and full independent review |

Canon breadcrumb: credential disclosure, injection and path traversal are canon
security; covered by $gsd-secure-phase plus relevant static/security tooling,
not minted as bespoke prohibitions here. Phase threat models remain explicit.

The existing projectProhibitions serializer projected the two kept items into
02-05 must_haves.prohibitions with status resolved and verification judgment.
No descriptor/check path is invented. dispositionForProhibition returns
unverified, flagged true for both; neither is dismissed or automatically green.
Phase-end human-check receives both, with E-02-01. Phase 1's human judgment is
bounded to its own scope and supplies no Phase 2 approval.

| Section | Surfaced | Authored must_haves | Flagged assumptions | Equality |
| --- | --- | --- | --- | --- |
| Edges | 1 | 0 | 1 | 1 = 0 + 1 |
| Kept prohibitions | 2 | 2 | 0 | 2 = 2 + 0 |

## Active planner contributions

All contributions from guardian-phase2-planner-contributions.txt were read
verbatim and applied. API coverage: this conformance phase preserves existing
API contracts; COVERAGE.md declares no new external integration with reason.
Assumption delta: private optional-policy conformance changes no account/device
identity model; no product model transition is planned. Schema push: no ORM
schema files are in scope. Security: every plan has configured L1/high-blocking
threat modeling, unique numeric IDs and reserved T-02-SC. TDD: every code task
is test-first for actual discovered defects with behavior expectations; the
approved complete-patch evidence-first policy overrides failing-code/subject
heuristics. No existing passing behavior is forced into a fictitious RED.
