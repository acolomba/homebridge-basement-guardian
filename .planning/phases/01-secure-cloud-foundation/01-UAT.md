---
status: complete
phase: 01-secure-cloud-foundation
source: [01-VERIFICATION.md]
started: 2026-08-29
updated: 2026-08-29
---

## Current Test

none — all tests complete

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
result: [pass]
tested: 2026-08-29
evidence: |
  Run in a throwaway Homebridge 2.4.0 container (homebridge/homebridge:latest,
  UI v5.28.0) with the packed 0.1.0 tarball installed into the plugin path.
  All five behaviours confirmed by a human reading the rendered form:

  1. One account block only. No control offers a second Basement Guardian
     block, so `singular: true` is honoured by the UI.
  2. The plaintext-storage warning renders in the header.
  3. The password field renders MASKED. This was the one open risk: the schema
     masks via `"widget": "password"` rather than the `x-schema-form` form that
     Homebridge documentation shows, and no harness could say which key
     ng-formworks honours. It honours `widget`. No schema change needed.
  4. A malformed email is refused by the form.
  5. Saving a valid account starts the plugin. The log showed
     `Initializing BasementGuardian platform...` then `Discovered 1 device(s).`

  Item 5 is stronger than the form check alone: it is the first run through the
  real Homebridge platform lifecycle (validateConfig, redacting logger,
  didFinishLaunching, auth, discovery) rather than through a probe calling the
  composition root directly. No accessory appears in HomeKit, which is correct —
  Phase 1 registers no platform accessories by design.

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
passed: 3
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

## Additional Verification

Not one of the three items, but closed in the same session because the harness
was already standing.

### CONF-01 child-bridge clause

`01-VERIFICATION.md` records this clause as Manual-Only: "a child bridge is a
Homebridge process feature the plugin can only supply a precondition for." It
had never been exercised.

result: [pass]
tested: 2026-08-29
evidence: |
  A `_bridge` block was added to the platform config and Homebridge restarted:

    [Basement Guardian] Initializing child bridge 0E:FA:11:22:33:45
    [Basement Guardian] Child bridge starting (pid 167)...
    [Basement Guardian] Child bridge started successfully (plugin v0.1.0).
    Homebridge v2.4.0 (HAP v2.2.2) (Basement Guardian) is running on port 51888.
    [Basement Guardian] Discovered 1 device(s).

  The plugin runs in its own process on its own HAP bridge, alongside the main
  bridge on 51999, and completes discovery against the vendor cloud from inside
  it. Both bridge modes of `CONF-01` are now exercised on current Homebridge
  2.x, which `D-033` also asks for.

  Cheap to test now and not later: Phase 1 publishes no accessories, so the two
  documented child-bridge hazards in `D-036` and `REL-08` — separate HomeKit
  pairing, and a bridge-mode change re-creating accessories and disrupting
  rooms and scenes — have nothing to act on yet.
