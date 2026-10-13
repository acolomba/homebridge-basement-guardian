---
phase: "3"
slug: "safety-monitoring-in-homekit"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-08-30"
---

# Phase 3 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Register authored at plan time across the eight `<threat_model>` blocks in `03-01-PLAN.md` through
`03-08-PLAN.md`. Verified against the current tree rather than the plans' prose, because four
blockers and 21 warnings were fixed across three code-review iterations after the plans were
written, relocating several mitigations.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Decoded domain state → a published HAP characteristic | The last point at which a wrong value can still be refused. HAP clamps rather than refuses, so nothing downstream catches a bad push. | Safety-bearing measurements and booleans |
| Vendor payload → decoded domain state | Fail-closed per-field validation; a violated field's whole scope goes `undefined` rather than partially populated. | Untrusted vendor JSON |
| The accessory's per-poll state → the confirmed-offline adapter | A physical-device alert derived from plugin-side counting, not a reported field. Miscounting raises an alert the vendor never did. | Derived connectivity verdict |
| Administrator `ignoredFaults` → the published service set | Removing a service orphans whatever a user attached to it in their controller. | Administrator configuration |
| Live shadow patch → published characteristic | Between-poll path added this phase; must not advance poll-derived counters. | Partial device state |

---

## Threat Register

35 threats. All dispositions resolved. Full per-threat evidence with file and line references is in
the audit record below; this table carries the disposition and status.

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-03-01 | Spoofing (verification evidence) | Cucumber HAP stand-in | high | mitigate | Three-argument `addService` at the real HAP shape | closed |
| T-03-02 | Tampering (duplicate service) | `fakeHomebridgeApi.ts` | medium | mitigate | Both real-HAP refusals reproduced verbatim | closed |
| T-03-03 | Tampering (hostile payload) | `src/device/gemini.ts` | high | mitigate | Fail-closed field checks before decode; decoders throw rather than default | closed |
| T-03-04 | Spoofing (fabricated measurement) | `src/device/waterLevel.ts` | high | mitigate | Six-entry `ReadonlyMap`, no arithmetic path, unmapped code throws | closed |
| T-03-05 | Tampering (prototype pollution) | decode and projection paths | medium | mitigate | Zero spreads of vendor records; state deep-frozen | closed |
| T-03-06 | Info Disclosure (false assurance from unvalidated scope) | `src/device/gemini.ts` | high | mitigate | A scope is `undefined` when any of its fields violated — never partial | closed |
| T-03-07 | DoS (silent typo) | `src/config.ts` | high | mitigate | Refuses unknown and duplicate slugs, naming the offender and all seven valid ones | closed |
| T-03-08 | Info Disclosure (account identifier in log) | `src/config.ts` refusals | high | mitigate | No refusal branch interpolates `fields.email` — verified by exhaustive inspection | closed |
| T-03-09 | Tampering (form/runtime enum drift) | `config.schema.json` | medium | mitigate | Schema enum compared against an independent inline literal | closed |
| T-03-10 | DoS (plugin-side delay control) | settings form | medium | mitigate | Exhaustive key-set plus a substring scan for delay/latch vocabulary | closed |
| T-03-11 | Spoofing (kinder-than-HAP defaults) | `features/support/fakeHap.ts` | high | mitigate | Stand-in defaults match pinned HAP exactly | closed |
| T-03-12 | Tampering (stand-in drift) | test doubles | medium | mitigate | Exactly one stand-in; the third double was deleted | closed |
| T-03-13 | Spoofing (construction defaults) | `serviceCatalogue.ts` `ensureService` | high | mitigate | No service is added at all until its row can project a value | closed |
| T-03-14 | Tampering (clamped out-of-range value) | `serviceCatalogue.ts` projections | high | mitigate | Every value is a declared HAP constant or a verbatim read; no arithmetic reaches a projection | closed |
| T-03-15 | Tampering (retained value erased) | `basementGuardian.ts` publish loop | high | mitigate | An untrusted row receives only a `StatusActive` push; `HapStatusError` absent, `Error` push type-prevented | closed |
| T-03-16 | Spoofing (unraised offline alert) | offline confirmation counter | high | mitigate | Reads `connectivity.connected` only, never `data.offline`; thresholds 1/2/8 covered | closed |
| T-03-17 | DoS (suppression) | `ignoredFaults` branch | medium | mitigate | Suppression removes one Contact Sensor and nothing else; core kinds cannot be named | closed |
| T-03-18 | Tampering (duplicate after restart) | `ensureService` | medium | mitigate | Lookup passes the service class; characteristic repair guarded before a non-idempotent add | closed |
| T-03-19 | Spoofing (computed level) | `serviceCatalogue.ts` | high | mitigate | Reads the decoded percentage verbatim; the ladder stays behind the family boundary | closed |
| T-03-20 | Info Disclosure (aggregate hides a cause) | fault adapters | high | mitigate | Five separate rows and conditions; no aggregate row; raw causes separately readable | closed |
| T-03-21 | Tampering (corrected battery reading) | battery projections | medium | mitigate | Level and facts read disjoint fields; neither consults the other | closed |
| T-03-22 | Spoofing (writable characteristic) | `customCharacteristics.ts` | high | mitigate | One read-only perms source feeds the sole define factory; no `PAIRED_WRITE` in `src/` | closed |
| T-03-23 | Info Disclosure (Wi-Fi diagnostics as safety state) | metadata | low | accept | Decoded but projected by no row; forbidden-name checks in place | closed |
| T-03-24 | Spoofing (values while link down) | controller-link distrust | high | mitigate | Five non-connectivity scopes marked `controller-link-lost`; the link adapter tolerates it | closed |
| T-03-25 | Spoofing (alert from non-poll source) | offline counter | high | mitigate | Both counter call sites guarded on `source === 'poll'` | closed |
| T-03-26 | DoS (deferral) | publish path | high | mitigate | Four independent immediacy layers, each with a negative control proving it catches a planted deferral | closed |
| T-03-27 | DoS (failing listener) | `src/device/state.ts` | medium | accept | Per-listener `try`/`catch`; other listeners still run and the reducer returns | closed |
| T-03-28 | Info Disclosure (identifier in log) | degradation warning | high | mitigate | Names `deviceId` only; redacting logger in place | closed |
| T-03-29 | Spoofing (scenario observing nothing) | Cucumber steps | high | mitigate | `pushedValue()` requires an actual push, so the nine steps can no longer pass on HAP's `0` default | closed |
| T-03-30 | DoS (deferral no spy sees) | static import gate | high | mitigate | Reads the real directory; five planted spellings detected; comment and unrelated import stay quiet | closed |
| T-03-31 | Spoofing (gate reading nothing) | static import gate | medium | mitigate | Module-count floor of 6 against exactly 6 files, so a wrong path cannot pass vacuously | closed |
| T-03-32 | Info Disclosure (estimate as measurement) | `README.md` | medium | mitigate | Battery bands named an estimate; water percentages named provisional with only the 20% code confirmed | closed |
| T-03-33 | DoS (unexplained destructive setting) | `README.md` | medium | mitigate | Seven slugs listed, refusal behaviour stated, removal cost stated per sensor | closed |
| T-03-34 | Tampering (exemption outlived its reason) | `.fallowrc.json` | low | accept | Two of three stale entries removed; the third is retained by acceptance criteria and recorded as no longer load-bearing | open — below `high` threshold (non-blocking) |
| T-03-SC | Tampering (supply chain) | npm installs | high | accept | `git diff` on `package.json` across the phase is empty; no commit touches `package-lock.json` | closed |

*Status: open · closed · open — below `high` threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` count toward `threats_open`*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-03-01 | T-03-SC | This phase installs no npm package. Verified rather than asserted: `git diff` on `package.json` across every phase commit is empty, and no commit touches `package-lock.json`. | Phase 3 security audit | 2026-08-30 |
| R-03-02 | T-03-23 | `wifiSignalDbm` is Wi-Fi module diagnostics, not a basement-protection condition, and belongs to no `TrustScope`. It is decoded but projected by no row, so it never reaches HomeKit (`D-16`). | Phase 3 discussion, `D-16` | 2026-08-30 |
| R-03-03 | T-03-27 | A failing store listener is contained per-listener: other listeners still run and the reducer returns. The platform adds one listener and no second guard, as declared. | Phase 3 security audit | 2026-08-30 |
| R-03-04 | T-03-34 | Low severity, below the `high` block threshold. Two of three stale `ignoreFindings` entries were removed and both removals were falsified. The remaining `src/device/events.ts` entry is measurably no longer load-bearing but is retained because two plan acceptance criteria require it; the mitigation's second clause ("justified by naming the declaration that still has no production consumer") is unsatisfiable as written. Resolve when that file next gains or loses a consumer. | Phase 3 security audit | 2026-08-30 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-30 | 35 | 34 | 1 (non-blocking) | gsd-security-auditor (ASVS L1, block on `high`) |

---

## Findings the Audit Recorded Beyond the Register

These are not open threats. They are recorded because each is a place where evidence was weaker than
it appeared, and this phase produced four blockers that lived under a fully green suite.

1. **T-03-08's plan text overstated its own test evidence.** The plan claimed a case proving that no
   producible refusal contains a configuration-sourced `@`. The actual test checks one refusal shape
   from one configuration. The threat was closed on exhaustive inspection of every `firstRefusal`
   branch, which is stronger evidence than the test the plan cited. Separately: `ignoredFaultsRefusal`
   and `integerRefusal` do quote administrator-authored values, so an email pasted into
   `ignoredFaults` would reach the log. That is not the account-identifier field T-03-08 names, so it
   does not open the threat — but it is worth knowing before Phase 6's privacy gate.

2. **"No unregistered threat flags" rests on an absence.** No `03-0N-SUMMARY.md` contains a
   `## Threat Flags` section at all. The conclusion follows from the section never having been
   written, not from an executor positively reporting none.

3. **T-03-13 carries a live invariant, not merely a closed finding.** The projection-length gate in
   `serviceCatalogue.ts` is sound only while every *required* characteristic of a row's service class
   comes from a scope that row still publishes from. That holds today across all seven service
   classes. A future row that made a cross-scope characteristic required would silently reopen the
   false-normal path this threat covers. `ensureService`'s doc comment records the precondition and a
   guard test pins the alignment.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-30
