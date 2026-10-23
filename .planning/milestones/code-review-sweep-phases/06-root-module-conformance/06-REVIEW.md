---
phase: 06-root-module-conformance
reviewed: 2026-10-19T18:22:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - features/account/configuration.feature
  - src/accessories/pumpRecords.ts
  - src/accessories/staleMarking.ts
  - src/config.ts
  - src/index.ts
  - src/logging.ts
  - src/platform.ts
  - src/protocol.ts
  - src/settings.ts
  - test/accessories/pumpRecords.test.ts
  - test/accessories/staleMarking.test.ts
  - test/config.test.ts
  - test/index.test.ts
  - test/logging.test.ts
  - test/platform.test.ts
  - test/protocol.test.ts
  - test/settings.test.ts
findings:
  critical: 2
  warning: 1
  info: 0
  total: 3
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-10-19T18:22:00Z
**Depth:** standard
**Files reviewed:** 17
**Status:** issues_found

## Summary

The current tree has two safety defects. A restored pump record accepts invalid numeric values, and a failed monitoring trust update can leave HomeKit rows active after trust has been withdrawn. One platform test can wait indefinitely on a supported filesystem watcher event. This advisory review is separate from the Phase 06 batch finding ledger; it does not change the historical ENTRY round-four STOP or any batch round.

The full `npm run check` gate passed with a temporary npm cache and localhost socket access: 104 Cucumber scenarios, 1,156 steps, and 43 direct coverage pairs. A read-only reproduction confirmed that a negative restored activation count is returned unchanged. Passing tests do not cover the defects below.

## Narrative Findings (AI reviewer)

### CR-01: Invalid restored pump numbers are treated as trustworthy

**Classification:** BLOCKER
**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/src/accessories/pumpRecords.ts:119-151`
**Issue:** `isPumpObservation` and `isActivationWatermarks` check only `typeof number`. A cached record with `activationCount: -2` is resumed and returned as a valid count; a subsequent watched activation changes it to `-1`. A cached `lastActivationAt: 1e308` also passes, but `recordProjectionOf` in `src/accessories/basementGuardian.ts:443-445` passes it to `new Date(at).toISOString()`, which throws `RangeError`. The platform then skips that device on every inventory while the invalid cache remains. The damaged-record cases in `test/accessories/pumpRecords.test.ts:808-887` cover wrong types but not invalid numeric domains.
**Fix:** Validate restored counts as nonnegative safe integers and all stored times as finite values in their valid ranges before resuming any part of the record. Treat a failed check as an unreadable record, start a new observation epoch, and add owner cases for negative and fractional counts and an out-of-range timestamp.

### CR-02: A failed trust publication is never retried with unchanged health

**Classification:** BLOCKER
**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/src/platform.ts:438-442`
**Issue:** `applyMonitoringHealth` catches a `markMonitoring` failure and continues. Inside the called accessory, `src/accessories/basementGuardian.ts:959-980` stores `monitoring = trust` before republishing rows. `republishPublishedRows` walks services in order without isolating a failed `updateCharacteristic`. If one service throws while a degraded health report withdraws trust, later services keep their previously active `StatusActive` values. The next identical health report returns at the `unchanged` check, so the stale active rows are not retried. The current platform tests inject failures in cached credential marking, but not in this normal monitoring publication path.
**Fix:** Keep a pending-publication flag until all affected trust rows have been written; retry an identical health report after a failed pass. Isolate service writes so a failing service does not prevent later services from losing trust. Add a regression in which one service fails once and two identical degraded health reports leave every affected service inactive.

### WR-01: The token-cache test can wait forever for a watcher filename

**Classification:** WARNING
**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/test/platform.test.ts:1010-1026`
**Issue:** The `fs.watch` callback removes a pending file only for a `rename` event with a non-null filename. Node's installed `WatchListener` type permits `filename: null`. If either atomic rename arrives with no filename, `filesWritten` never resolves and the test hangs, even though both files were written.
**Fix:** On each watcher event, check the directory contents for both expected files without relying on the event filename. Give the wait a bounded failure path and close the watcher on error or timeout.

---

_Reviewed: 2026-10-19T18:22:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
