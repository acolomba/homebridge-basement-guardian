---
phase: 2
slug: safe-gemini-discovery-and-identity
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-29
---

# Phase 2 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Vendor REST device snapshot -> family validation | Untrusted wire-shaped telemetry/metadata crossing into `DeviceFamily.validate()`/`decode()`. | Device snapshot (telemetry, metadata) |
| Decoded domain state -> `accessory.context` / log lines | Any value that could carry more of the raw vendor record than the plugin intends to expose. | Decoded device state |
| Poll-cycle outcome (trustworthy vs. failed) -> reconciliation counter | The caller's HTTP-success/schema-validity judgment crossing into the count that eventually authorizes unregistering a user's accessory. | Poll success/failure signal |
| `deviceTypeId` string (vendor-controlled) -> registry outcome dispatch | The single field that decides whether a device's payload is ever decoded under Gemini's field semantics. | `deviceTypeId` string |
| Vendor-reported device name (mutable, user-visible) -> `accessory.displayName` | The one place a vendor-controlled string can silently overwrite a user's own HomeKit customization. | Vendor device name string |
| Reconciliation's `confirmedAbsent` signal -> out-of-band final-check fetch -> `unregisterPlatformAccessories` | The full chain from "two polls in a row said this device is gone" to an irreversible-feeling HomeKit action that also drops the device's persisted activity history. | Device presence/absence signal |
| A snapshot that fails family validation or resolves to a non-implemented family -> the accessory's retained last-valid state | The boundary that must never let an uninterpretable payload either overwrite good state or take the accessory itself down. | Invalid/unresolved device snapshot |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-02-01 | Tampering | `src/device/registry.ts` consumers (`src/platform.ts`) | high | mitigate | Every call site branches on the registry's `kind` discriminant (`platform.ts:66,173`); only `implemented` reaches `family.validate`/`decode`. Mutual-exclusivity test (Task 1) and mixed-inventory feature scenario (Task 2) prove an unsupported/unknown device never reaches Gemini's decoder. | closed |
| T-02-02 | Tampering | `src/device/gemini.ts` validate/decode ordering, `src/accessories/basementGuardian.ts` | high | mitigate | `update()` calls `family.decode()` only inside `if (validation.valid)` (`basementGuardian.ts:171-176`); the failed-validate branch never calls `decode()`, covered by the "decode never runs after a failed validate" test. | closed |
| T-02-04 | Repudiation, Denial of Service | `src/accessories/reconciliation.ts` | high | mitigate | `observe(deviceIds: readonly string[])` has no parameter slot for a per-device failure/connectivity signal (`reconciliation.ts:37,73`); two consecutive omissions are required before confirmed-absent, proven by the behavior test suite. | closed |
| T-02-05 | Denial of Service | `src/runtime/accountRuntime.ts`, `src/platform.ts` | high | mitigate | `applyDevices()` requires the out-of-band final-check fetch before any `onDeviceRemoved` call; a reappearance calls `reconciliation.forget()` instead of removing, and a failed fetch is caught silently, removing nothing (`accountRuntime.ts:243-269`). Proven by the Task 1 behavior suite and Task 2 reappearance scenario. | closed |
| T-02-06 | Tampering | `src/platform.ts` rename-adoption branch | medium | mitigate | `resolveVendorName()` only adopts the vendor name when `accessory.displayName === accessory.context.lastVendorName` still holds (`platform.ts:80-84`); a user rename is detected the instant the two values diverge and is never overwritten, proven by the "not adopted" feature scenario. | closed |
| T-02-07 | Tampering (state corruption via erased retained values) | `src/accessories/basementGuardian.ts` | medium | mitigate | The degrade branch in `update()` returns without touching `AccessoryInformation` getters/characteristics and never throws `HapStatusError` or pushes an `Error` through `updateCharacteristic` (`basementGuardian.ts:183-186`), proven by the "unchanged after degrading" test. | closed |
| T-02-08 | Tampering (conflating a plugin-interpretation failure with a vendor-reported fault) | `src/accessories/basementGuardian.ts` | medium | mitigate | Every degraded `UntrustedScope` uses `reason: 'invalid'` (`basementGuardian.ts:116`); no code in this phase sets `StatusFault`/`GENERAL_FAULT` (confirmed absent from `src/` outside test files) — that characteristic is reserved for Phase 3's `SAFE-04` fault adapters. | closed |
| T-02-09 | Information Disclosure | `src/device/gemini.ts` decode(), `src/accessories/basementGuardian.ts` update() | low | mitigate | `decode()` and `AccessoryInformation` population build every field explicitly; no `{ ...snapshot.metadata }` or `{ ...snapshot.data }` spread exists anywhere in either file (confirmed absent by grep), so an unread vendor key can never reach domain state, context, or a log line. | closed |

*Status: open · closed · open — below {block_on} threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

No accepted risks.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-29 | 8 | 8 | 0 | orchestrator (grep-level, L1, all registers plan-time-authored) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-29
