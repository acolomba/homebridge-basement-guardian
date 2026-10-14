---
phase: "02"
slug: cloud-conformance
status: verified
threats_open: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
created: "2026-10-14"
---

# Phase 2 — Security

Independent auditor /root/phase2_security returned SECURED at revision
66fbd236892e27add2d98eeb3b289a43d6142eca. All 17 authored mitigation entries
are closed at ASVS L1: 15 high and two medium. No accepted or transferred risk
was used. This verifies the authored controls and leaves phase approval pending.

## Trust Boundaries

| Boundary | Data crossing |
| --- | --- |
| Auth/cache and callers | Tokens, cache ownership, caller cancellation and sanitized diagnostics |
| Shadow/transport and device consumers | Reported telemetry, connection ownership and bounded lifecycle operations |
| API/wire and callers | Guarded vendor records, commands, deadlines and fixed failures |
| Signing/HTTP/MQTT and cloud endpoints | Credentials, exact request bytes and connection settings |
| Batch records and phase completion | Finding IDs, regression provenance and measured checks |
| Shared worktree and Git | Test inputs, mutation restoration and verified source revisions |

## Threat Register

All entries have disposition mitigate. Evidence locations refer to the audited
revision. CLOSED means the authored mitigation is present, within the limits below.

| Threat ID | Category | Component | Severity | Mitigation evidence | Status |
| --- | --- | --- | --- | --- | --- |
| T-02-01 | Information disclosure | Auth cache/diagnostics | high | auth.ts:243 exclusive owner-only write/rename, :255 restricted fields, :588 secret registration; auth.test.ts:893 complete privacy bytes, :983 occupied-file refusal, :1030 permission restoration; logging.ts:55 redaction | CLOSED |
| T-02-02 | Denial of service | Shared grant/waiters | high | auth.ts:456 independent waiter settlement, :533 shared attempt, :536 slot until settlement, :551 final-waiter abort; auth.test.ts:479, :541, :586, :650 public lifecycle cases; no internal retry | CLOSED |
| T-02-03 | Information disclosure | Auth test HTTP | high | auth.test.ts:122 options helper, :130 fixed throwing default, explicit synthetic transports and :291 case-owned loopback adapter | CLOSED |
| T-02-04 | Tampering | Filename/private policy | medium | auth.ts:79 private unchanged filename, :121 optional policy, :142 storage root, :334 deletion; independent consumers auth.test.ts:152, platform.test.ts:829, authentication.ts:69, realWorld.ts:198 | CLOSED |
| T-02-05 | Tampering | Reported/current shadow | high | shadow.ts:158 routing, :168 guard, :197 reported-only narrowing, :204 finite-version absence, :228/:391 current ownership; shadow.test.ts:429, :499, :578, :957 | CLOSED |
| T-02-06 | Denial of service | Shadow lifecycle | high | shadow.ts:29/:430 deadlines, :352 readiness, :444 old transport teardown, :419 shutdown refusal, :471 memoized close; shadow.test.ts:330, :341, :920, :995 | CLOSED |
| T-02-07 | Information disclosure | Shadow diagnostics | medium | shadow.ts:149, :270, :278, :314, :331 fixed diagnostics and :95 disconnection contract; shadow.test.ts:854 complete sanitized lifecycle | CLOSED |
| T-02-08 | Tampering | Wire narrowing/normalization | high | types.ts:114, :142, :153, :158, :182, :187 predicates and :170 opaque telemetry normalization; api.ts:127/:187/:192; types.test.ts:123/:274; bounded routing limitation below | CLOSED |
| T-02-09 | Denial of service | API operation deadline | high | api.ts:165 composite deadline before token, :166/:167 same signal for auth/HTTP, :169 body handling, :27 command deadline, :208 single send; api.test.ts:454, :633, :652, :897 | CLOSED |
| T-02-10 | Information disclosure | API HTTP/errors | high | api.test.ts:34 fail-closed default; api.ts:89 fixed unreadable error, :116 contained cleanup failure, :122 fixed status/route; api.test.ts:420/:990, errors.test.ts:19/:47 complete failures | CLOSED |
| T-02-11 | Tampering | HTTP pairing/signing | high | httpDispatcher.ts:12 paired userland fetch/Agent, :20 H2 disabled, :30 paired dispatcher; sigv4.ts:44/:48/:55 SHA-256/HMAC, :93 token placement; httpDispatcher.test.ts:114 and sigv4.test.ts:24/:100 independent bytes | CLOSED |
| T-02-12 | Denial of service | MQTT/ALPN cleanup | high | mqttTransport.ts:113 deadlines, :127 timer cancellation, :146 callback-owned end, :205 memoization; tests:463/:548; alpnServer.ts:63 certificate finally cleanup, :125 listener close; three consumers register close hooks; H2 limit below | CLOSED |
| T-02-13 | Information disclosure | Transport records | high | apiSeeds.ts:46 and sigv4Seeds.ts:13 synthetic credentials; mqttTransport.ts:20 fixed deadline text; fixed shadow diagnostics; batch/RED records contain synthetic evidence, no generated keys | CLOSED |
| T-02-14 | Repudiation | Finding/bug provenance | high | All five saved records independently classify RED_EVIDENCE_OK/target_test_failed; actual source→evidence→fix→HEAD ancestry, evidence-only paths, unchanged production blobs and archives pass; six rounds reconcile in 02-FINDINGS.md | CLOSED |
| T-02-15 | Tampering | Shared verification inputs | high | All 19 cloud files and external consumers match reviewed snapshots; control restoration hashes match committed source; empty executable-input diff from e57e7d4, no untracked inputs, same Node v26.11.1 and passing full-gate log | CLOSED |
| T-02-16 | Information disclosure | Ledger/validation | high | Inspected ledger, reports and committed regression records contain synthetic observations, fixed diagnostics and provenance; no live private store/account/vendor response was read; enabled secret hooks passed | CLOSED |
| T-02-SC | Tampering | Package installs | high | package.json, package-lock.json and dependency history unchanged from baseline; no install/upgrade/proposal; conditional legitimacy gate not triggered | CLOSED |

## Accepted Risks Log

No accepted risks. No transfer disposition. Summary Threat Flags are None;
the audit did not invent additional threat entries or waive unresolved concerns.

## Retained Concerns and Limits

The initial audit retained dot-only routing as a concern. The final code review
confirmed CR-02-API-017 as a public-contract defect, now independently fixed.
The private helper refuses exactly '.' and '..' with a fixed TypeError, through
promise rejection before token/authentication or HTTP. Ordinary opaque IDs and
percent encoding remain unchanged. No vendor occurrence, authorization bypass,
real actuation or security impact was established or claimed.

The ALPN helper closes its listener but has no active-H2 session tracking,
destruction or close deadline. Its body is unchanged except for the header.
Certificate cleanup and consumer close hooks are present, and current paired
Agent consumers enforce HTTP/1.1 with passing evidence. T-02-12 closure covers
those declared controls. Active-H2 teardown remains unconfirmed and unmeasured.

E-02-01 taxonomy and descriptorless P-02-01/P-02-02 remain pending human
judgment. Tests do not establish taxonomy completeness or maintainer approval.
Phase 1 approval is bounded to that scope. No audited round triggers D-03.

## Security Audit Trail

| Audit date | Total | Closed | Open | Run by |
| --- | --- | --- | --- | --- |
| 2026-10-14 | 17 | 17 | 0 | /root/phase2_security, independent typed auditor |

The auditor performed read-only code/evidence checks and an offline pure
injected-transport probe. No build, broad test repeat, install, live network,
vendor/hardware call, private-file read or implementation write occurred.
The only pre-existing dirty record was the parent-owned Validation Audit append.
The parent records this verdict; overall CLOUD-01 and phase advancement remain
pending independent code review, verification and maintainer judgment.

## Sign-Off

- [x] All 17 authored threats retain a mitigation disposition.
- [x] No accepted risks used to close an entry.
- [x] threats_open: 0, including all high-severity entries.
- [x] status: verified reflects ASVS L1 authored-control evidence.

**Approval:** Security mitigation verification only, 2026-10-14.

## Independent Routing Correction Refresh

Auditor /root/phase2_security returned SECURED again at
3f58756db1e052308543d9776d7738467d30dd14: 17/17 authored mitigations closed,
15 high and two medium, zero blocking/nonblocking open and no accepted or
transferred risks. ASVS L1/high threshold is unchanged. The initial register's
locations above refer to its explicitly stated historical revision; refreshed
affected evidence is below.

| Threat | Current correction evidence |
| --- | --- |
| T-02-08 | api.ts:83 guards exact control segments; :193/:203 promise rejection; types.ts predicates/opaque representation unchanged; four api.test.ts:229 regressions |
| T-02-09 | api.ts:169 composite deadline before token, :170/:171 same auth/HTTP signal, :173 body signal; :27/:212 command deadline and single attempt unchanged |
| T-02-10 | api.ts:84 fixed local TypeError contains no identifier/URL/status/cause; :93/:108/:120/:126 preserve sanitized response failures; complete error-field tests |
| T-02-14 | Six independently classified genuine records; new b66f725→6839060→b8b660a ancestry, JSON-only evidence, unchanged production blob, complete archive and semantic patch correspondence; API round 3 closes 1→0 |
| T-02-15 | Exact current inputs match clean a973483 full-gate reference, no untracked files, Node v26.11.1; other 17 cloud files and relevant external controls match the prior audit |
| T-02-16 | Synthetic correction inputs/native failures/provenance; fixed local refusal excludes raw identifiers; no private account/cache/vendor material read |

An independent offline actual-export probe confirms all four combinations
return promises, reject with the complete fixed TypeError and touch neither
auth nor HTTP. Ordinary/percent-encoded IDs retain exact paths. All six nested
genuine histories classify RED_EVIDENCE_OK. The older complete API archive
matches the original record; GREEN has only two extra lint blank lines.

Fresh API evidence is 37/37 and isolated 159/159 lines,14/14 functions,31/31
branches. Fresh full gate at a973483 exited 0: all six static checks,
104 scenarios/1,156 steps and 43 pairs. Reuse is proved by exact unchanged
inputs. No broad test rerun, install, network/vendor/hardware call or private
read occurred in this audit. The parent alone had a dirty validation record.

Unchanged threats retain their original mitigations. No new threat entry or
risk waiver was invented. Routing is fixed; ALPN active-H2 and E-02-01/P-02-01/
P-02-02 limitations remain pending. API round 3 has no stop trigger; round 4
would require global pause. Overall phase approval is not supplied here.

## Security Audit 2026-10-14

| Metric | Count |
|---|---|
| Threats found | 17 |
| Closed | 17 |
| Open | 0 |
