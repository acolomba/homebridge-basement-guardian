---
phase: "03"
slug: "device-and-persistence-conformance"
status: verified
threats_open: 0
threats_total: 18
threats_closed: 18
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
created: "2026-10-14"
audited_revision: 96eb04b833664694b3c32e466d6985bea3c9a02b
---

# Phase 3 — Security

Independent auditor /root/phase3_security returned SECURED at the clean revision
above. All 18 authored threats have observed mitigations at ASVS L1 presence
verification depth. Severity totals: 15 high, three medium, zero critical/low.
All dispositions are mitigate. No risk was accepted or transferred.
This verdict does not advance DEV-01 or resolve the maintainer judgments.

## Trust Boundaries

| Boundary | Data crossing / constraint |
| --- | --- |
| Vendor report to immutable state | Opaque reported values, monotonic versions and required absent values |
| State to family projection | Narrow trust scopes, device clocks and provisional measurements |
| Profile to physical accessory | Immutable deviceId identity versus deviceTypeId adapter selection |
| Context to observation reducer | Mutable stored records, whole-record recovery and explicit persistence |
| Native evidence to completion claims | Actual reviewed blobs, commands, exits, controls and process limits |

## Threat Register

All locations refer to the audited revision. Every status below is CLOSED.

| Threat ID | Category | Component | Severity | Disposition | Observed mitigation / exact evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| T-03-01 | Tampering | Snapshot freezing | high | mitigate | state.ts:150–170 recursively freezes values/envelope; discovery/report/release invoke it at206/263/405. state.test.ts:228–270,521–563 compares complete values before freeze checks. | closed |
| T-03-02 | Tampering | Monotonic canonical state | high | mitigate | state.ts:142–143,346–354 refuses duplicate/older versions before storage. state.test.ts:314–368,486–506 independently checks returned and canonical snapshots. | closed |
| T-03-03 | Information disclosure | Listener failures | high | mitigate | state.ts:308–312 logs fixed text. state.test.ts:996–1032 throws identifying synthetic text and checks safe message, complete state and later notification. | closed |
| T-03-04 | Tampering | Exhaustive family scopes | high | mitigate | family.ts:169–181 requires every key with explicit undefined allowed; family.test.ts:87–110 protects omission. gemini.test.ts:258–277 checks complete independent invalid-water result. | closed |
| T-03-05 | Tampering | Desired versus reported state | high | mitigate | family.ts:72–74 exposes desiredData; family.test.ts:103–104 rejects reportedData. cloud/shadow.ts:197–204 selects reported sections; runtime/accountRuntime.ts:252–261 selects implemented adapter. | closed |
| T-03-06 | Tampering | Narrow decoder trust | high | mitigate | gemini.ts:172–205,349–376 gates scopes; live read guards remain231–276. gemini.test.ts:303–509 checks complete invalid-scope results;610–639 retains four guard cases. | closed |
| T-03-07 | Tampering | Device clock domains | high | mitigate | gemini.ts:251–252,288–293,325–326 passes optional timestamps without age policy. gemini.test.ts:575–607 has independent recent/ancient literals. family.ts:89–96,130–137 documents device seconds. | closed |
| T-03-08 | Tampering | Metadata and official controls | medium | mitigate | gemini.ts:337–356,376 independently guards metadata; accessories/basementGuardian.ts:256–265,1028–1042 consumes it. Exact desiredData bodies remain gemini.ts:388–393 and gemini.test.ts:656–698. | closed |
| T-03-09 | Tampering | Provisional water map | high | mitigate | waterLevel.ts:32–60 retains explicit six-code map, threshold and rejection; gemini.ts:85,173,282–285,368 gates lookup. waterLevel.test.ts:17–112 independently checks map/illegal values/threshold. Hardware G-002 remains outside. | closed |
| T-03-10 | Tampering | Public event contract | medium | mitigate | events.ts:23–58 requires identity, local time, discriminants and recovered device timestamp. events.test.ts:24–64 contains union positives/six meaningful negatives; declaration-only outcome. | closed |
| T-03-11 | Tampering | Narrow health projection | high | mitigate | health.ts:30–59 and health.test.ts:17–57 preserve vocabulary/absence. accessories/serviceCatalogue.ts:257–276,335–344,642–643 filters owning scope and refuses undefined candidates. | closed |
| T-03-12 | Tampering | Registry and physical identity | high | mitigate | registry.ts:73–91 distinguishes Gemini/HALO/unknown; registry.test.ts:28–71 checks independent outcomes. platform.ts:282–305 seeds UUID from deviceId and refuses unsupported registration. accountRuntime.ts:252–261 supplies no unsupported command body. | closed |
| T-03-13 | Denial of service | Explanation cadence | medium | mitigate | registry.ts:94–101 tracks profile per physical device; registry.test.ts:76–121 checks repeat/change/other device. platform.ts:300–303 uses shouldLog. | closed |
| T-03-14 | Tampering | Mutable persistence/recovery | high | mitigate | persistence/accessoryContext.ts:33–109 and owner:55–64 retain writable fields. accessories/pumpRecords.ts:228–258 recovers/seeds,269–297 handles units/watermarks,346–349 persists; platform.ts:149–154 wires Homebridge persistence. | closed |
| T-03-15 | Information disclosure | Persisted/public identifiers | high | mitigate | accessoryContext.ts:90–111 excludes credentials/raw snapshots; owner:92–95 protects exclusions. platform.ts:228–238,308–313 and pumpRecords.ts:249–258 select fields. STATE.md:231–233 retains scoped deviceId policy/opaque-key assumption; decisions.md:614–627 retains D-027 public/planning exclusions. | closed |
| T-03-16 | Tampering | Review/evidence provenance | high | mitigate | Independently checked47introducing commits,20reviewed blobs,nine unchanged emitted outputs,38closed IDs and continuous rounds. Current/all-history RED inventory empty. Five intended control failures, one unsuccessful TypeError attempt and saved restoration blobs inspected. SEAL-AUDIT.json:223,425,508,735,1090. | closed |
| T-03-17 | Information disclosure | Sanitized evidence/secret hooks | high | mitigate | Synthetic owners/seeds inspected. .pre-commit-config.yaml:20,45–51 configures secret hooks. Native ordinary streams confirm private-key/TruffleHog/check:commit for44introducing commits plus aggregate2d7d9f7. Three earlier streams have the retention limit below. | closed |
| T-03-SC | Tampering | Installation boundary | high | mitigate | Actual pre-phase aa826a50 manifest/lock diff is empty. All20nonplanning changed paths are the18core files/two helpers. No package addition or newly required package triggers installation; no install performed. | closed |

Device paths in this table are under src/device or test/device unless another
module path is given. Persistence owner means test/persistence/accessoryContext.test.ts.

## Observed Verification

Read-only inline checks exited0 at the audited revision on Nodev26.11.1:
SECURITY_READONLY_GIT_NATIVE_CHECKS_OK, observed21:23:59.825–21:24:01.218UTC;
SECRET_HOOK_NATIVE_PRESENCE_CONFIRMED; and
SECURITY_CONTROL_SOURCE_AND_NATIVE_CASES_OK. Three saved control-source blobs
match actual historical objects. Retained outputs contain170authored runtime
cases; every nonempty isolated coverage denominator is complete. Four owners
are declaration-only, without invented runtime coverage.

The same-session full npm run check at clean629cfc4a35527c7faf098e0f9937c29775332c17
ran20:26:42.951916–20:27:18.476401UTC, exit0, Nodev26.11.1: six static checks,
104Cucumber scenarios,1156steps and43isolated pairs. Native record:
/private/tmp/guardian-phase3-seal-full-gate.json. Executable-input diff and
untracked inventory are empty. Literal Markdown-exclusion comparison contains
only03-SEAL-AUDIT.json, a planning artifact outside executable hook inputs;
it is not described as an empty literal comparison.

## Accepted Risks Log

No accepted risks. No mitigation, process gap or hardware assumption was waived.

## Limits and Unregistered Flags

No additional surface appears in the eight summary Threat Flags sections or
SEAL-AUDIT.json:1351. This is bounded ASVS L1 presence verification, without a
new threat scan, certification, live vendor, hardware or release approval.

Three early ordinary commit streams,5808523/169e4ed/3e4ba69, are referenced as
original tool output without separately retained JSON captures. Their historical
hook streams were not independently reconstructed. Native retained evidence
for the remaining44introducing commits is distinct from that limitation.

WINDOWS46/47 remain OPEN/unwaived. Current successful checks do not reconstruct
the missing historical clean-prestep repeat or exact alias-specific pre-edit
trace. Historical Gemini247/247 remains unconfirmed; current compiled273/273
and merged source-mapped248/248 remain separate representations.

The opaque-key assumption and E-03-01/P-03-01/P-03-02 judgments remain unresolved.
All38code findings remain closed in continuous round2 histories. Independent
security verification does not imply perfect past procedure, DEV-01 completion
or phase advancement. Implementation/tests/Git state were untouched by the auditor.

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open blocking | Open non-blocking | Run By |
| --- | --- | --- | --- | --- | --- |
| 2026-10-14 | 18 | 18 | 0 | 0 | /root/phase3_security, gsd-security-auditor |

## Sign-Off

- [x] All18authored threats have mitigate dispositions with observed evidence.
- [x] No accepted risks were invented.
- [x] threats_open:0 confirmed; no non-blocking threat remains open.
- [x] status:verified applies only to the bounded security verdict.

Approval: bounded security verification2026-10-14. Parent goal verification and
actual Phase03judgments remain pending.
