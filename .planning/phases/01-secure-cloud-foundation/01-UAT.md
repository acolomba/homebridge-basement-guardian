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
result: [pass]
tested: 2026-08-29
evidence: |
  A 38-minute run against the real account and one wayneWaterGemini device,
  driving the production composition root with the real mqtt transport. The
  topic tap recorded:

    +   3s  $aws/things/<device>/shadow/get/accepted     1800 bytes
    + 692s  $aws/things/<device>/shadow/update/accepted   584 bytes
    +1590s  $aws/things/<device>/shadow/update/accepted   584 bytes

  The partial heartbeat arrives on update/accepted, as the intel recorded. The
  measured interval between the two heartbeats is 898 seconds exactly, matching
  the documented value rather than approximating it. Both heartbeats are 584
  bytes and carry keys [data, state]; the startup fetch on get/accepted is 1800
  bytes, so the heartbeat is genuinely partial.

  Why this matters beyond the topic name: RES-01 treats shadow silence as a
  staleness signal only after two missed heartbeats. That rule is sound only if
  898 seconds is the real cadence. The constant now rests on a measurement
  rather than on a citation.

  One device, one firmware version. The interval is not proven for other
  hardware.

### 3. Real SigV4 handshake

expected: Open a shadow connection against the real AWS IoT endpoint with real
temporary credentials. Handshake completes; no HTTP 403.
why_human: The fake broker accepts every signature
(features/support/fakeShadowBroker.ts:173 uses `verifyClient: () => !refusing`),
so the suite cannot detect a broken signer. A third implementation of the same
spec reading would not falsify the shared assumption.
covers: SYNC-04, AUTH-01
result: [pass]
tested: 2026-08-29
evidence: |
  A live shadow connection against the real AWS IoT endpoint using real
  temporary credentials from GET /credentials/aws, driven through the shipped
  presigner rather than a second hand-rolled one:

    handshake #1 opening (presigned URL withheld)
    handshake #1 ESTABLISHED
    handshakes opened: 1, errors: 0
    monitoringPath (live, before stop): shadow-and-poll

  No HTTP 403. A real 1800-byte shadow payload returned on get/accepted, so the
  connection carried traffic rather than merely opening.

  Also confirmed here: monitoringPath reads `unavailable` after a clean stop,
  which is the monitoringPathNow() behaviour plan 01-18 settled. A first probe
  sampled it after stop() and misread the pass as a failure.

  Note: this run was only possible after quick task 260829-gx6. Discovery failed
  before the shadow was ever reached, because GET /devices returns
  { devices: [...] } and the client required a bare array. UAT found that defect;
  four Phase 1 gates had not.

## Summary

total: 3
passed: 2
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
