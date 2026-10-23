---
phase: "05"
slug: "accessories-conformance"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-10-19"
---

# Phase 5 — Security

This is an ASVS level 1 review of the threat register in the nine Phase 5 plans.
It records the controls present at closeout. It does not claim that the stopped
GATES review closed cleanly or that every possible safety path was proved.

## Trust Boundaries

| Boundary | Data or decision crossing it |
| --- | --- |
| Vendor state to accessory services | Telemetry, trust marks, pump records and published HAP values |
| HomeKit write to vendor command | Local refusal, one command attempt, and error/log output |
| Accessory data to persistence | Context keys, watermarks and one persist call per change |
| Review and test evidence to phase status | Ledger counts, RED records, independent reviews, full gate and maintainer judgment |

## Threat Register

The repeated package-installation threat T-05-SC is listed once. “Closed by
retirement” means the named custom scanner no longer exists; its historical
finding stays open in the review ledger. The narrower replacement boundary was
accepted by the maintainer in `05-UAT.md`.

| Threat ID | Severity | Disposition and evidence | Status |
| --- | --- | --- | --- |
| T-05-01 | high | Ledger tracer passes the current 31-path, 247-finding, 47-round ledger; planted controls are recorded in `05-01-SUMMARY.md`. | closed |
| T-05-02 | high | `05-REVIEW-PROTOCOL.md` and the 18/18 decision check remain the rule source; `05-VERIFICATION.md` records the accepted stop. | closed |
| T-05-03 | medium | Fresh full-gate evidence is in `05-01-SUMMARY.md`; the final changed tree passed `npm run check` with 104 scenarios, 1,156 steps and 43 direct pairs. | closed |
| T-05-04 | high | The declaration review and UUID checks are in `05-02-SUMMARY.md`; declaration owner and pair checks passed. | closed |
| T-05-05 | high | `PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE` remains `true` in `src/accessories/alarmMute.ts`; `05-02-SUMMARY.md` records the owner check. | closed |
| T-05-06 | high | The declaration counter and file scope pass `05-ledger-tracer.mjs`; `05-02-SUMMARY.md` records the review rounds. | closed |
| T-05-07 | high | `05-03-SUMMARY.md` records catalogue review and direct coverage; current `serviceCatalogue.ts` retains trust withholding and status projections. | closed |
| T-05-08 | high | `05-03-SUMMARY.md` records service-name and subtype controls; the current full Cucumber gate passed. | closed |
| T-05-09 | medium | `serviceCatalogue.ts` still pushes a `HapStatusError` in `publishPersistentFailure`; catalogue pair coverage passed. | closed |
| T-05-10 | high | `controls.ts` retains `LOCAL_REFUSALS` and the single-attempt path; `05-04-SUMMARY.md` records refusal tests. | closed |
| T-05-11 | high | `05-04-SUMMARY.md` records exact-line refusal-log checks; the controls owner passed. | closed |
| T-05-12 | medium | `05-04-SUMMARY.md` and the passing ledger tracer record all seven seed dispositions. | closed |
| T-05-13 | high | `05-05-SUMMARY.md` records persisted shape, watermark and persist-on-change checks; the records pair passed. | closed |
| T-05-14 | high | `staleMarking.ts` retains restored-control refusal and the records owner passed, as recorded in `05-05-SUMMARY.md`. | closed |
| T-05-15 | high | `05-05-SUMMARY.md` records complete D-06 impact results, the account-runtime adaptation and passing combined gate. | closed |
| T-05-16 | high | `basementGuardian.ts` still sets `StatusActive` from trust scopes; `05-06-SUMMARY.md` and `05-07-SUMMARY.md` record restored controls and pair coverage. | closed |
| T-05-17 | medium | `05-06-SUMMARY.md` leaves ACCESSORY open to 05-07; `05-07-SUMMARY.md` closes its fourth round cleanly. | closed |
| T-05-18 | high | `05-07-SUMMARY.md` records the isolated style change and before/after checks. | closed |
| T-05-19 | high | `05-07-SUMMARY.md` records covering and restored controls; ACCESSORY closes cleanly with full pair coverage. | closed |
| T-05-20 | high | The custom HAP import scanner was retired in `05-08-SUMMARY.md`. Current import restrictions are in ESLint; `05-UAT.md` accepts this narrower boundary. | closed by retirement |
| T-05-21 | high | The custom accessory read-path scanner was retired in `05-08-SUMMARY.md`. Current handler restrictions are in ESLint and real-HAP tests; `05-UAT.md` accepts this narrower boundary. | closed by retirement |
| T-05-22 | high | `05-08-SUMMARY.md` retains the real-HAP parity owner; `05-HAP-WRITE-FIDELITY-RED-EVIDENCE.json` passes RED verification and the owner passed 22/22. | closed |
| T-05-23 | high | `05-08-SUMMARY.md` records the read-refusal repair; the final Cucumber gate passed 104 scenarios and 1,156 steps. | closed |
| T-05-24 | high | `05-08-SUMMARY.md` records the platform read consumer repair; the final direct-coverage gate passed 43 pairs. | closed |
| T-05-25 | medium | `05-REVIEW-PROTOCOL.md` defines pause/resume; `05-FINDINGS.md` and `05-08-SUMMARY.md` preserve the round-15 STOP. | closed |
| T-05-SC | high | No new package was installed in the Phase 5 plans; their summaries list no added dependency. | closed |

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
| --- | --- | --- | --- | --- |
| R-05-01 | T-05-20, T-05-21 | Replacement ESLint checks cover ordinary syntax only. Alias and computed-name forms remain outside the claimed boundary; the retired scanners' two historical findings remain open. | Maintainer, one bundled “Accept” in `05-UAT.md` | 2026-10-19 |

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
| --- | ---: | ---: | ---: | --- |
| 2026-10-19 | 26 | 26 | 0 | Phase 5 verification refresh, ASVS level 1 |

## Sign-Off

- [x] All registered threats have a disposition.
- [x] The accepted replacement boundary is documented.
- [x] `threats_open: 0` counts high and critical threats without an active mitigation or accepted disposition.
- [x] `status: verified` is set in frontmatter.

**Approval:** Verified within the bounded Phase 5 acceptance in `05-UAT.md`.
