---
status: testing
phase: 01-secure-cloud-foundation
source: [01-VERIFICATION.md]
started: 2026-08-29
updated: 2026-08-29
---

## Current Test

number: 1
name: Homebridge settings form renders and refuses correctly
expected: |
  One account block; plaintext-storage warning in the header; masked password;
  malformed email refused by the form; saving starts the plugin.
awaiting: user response

## Tests

### 1. Homebridge settings form renders and refuses correctly

expected: Install the built package into a real Homebridge instance, open
Plugins -> Basement Guardian -> Settings, and save a valid account. One account
block; plaintext-storage warning in the header; masked password; malformed email
refused by the form; saving starts the plugin.
why_human: No harness renders the Homebridge settings form (ng-formworks inside
the Homebridge UI). The scenarios prove the refusal behaviour behind the form,
not the form itself.
covers: SC-1
result: [pending]

### 2. Vendor heartbeat topic

expected: Run against real hardware for two heartbeat intervals and watch which
shadow topic carries the partial heartbeat. Partial telemetry arrives on
update-accepted roughly every 898 seconds.
why_human: Only real hardware confirms where the vendor publishes.
covers: SYNC-02
result: [pending]

### 3. Real SigV4 handshake

expected: Open a shadow connection against the real AWS IoT endpoint with real
temporary credentials. Handshake completes; no HTTP 403.
why_human: The fake broker accepts every signature
(features/support/fakeShadowBroker.ts:173 uses `verifyClient: () => !refusing`),
so the suite cannot detect a broken signer. A third implementation of the same
spec reading would not falsify the shared assumption.
covers: SYNC-04, AUTH-01
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
