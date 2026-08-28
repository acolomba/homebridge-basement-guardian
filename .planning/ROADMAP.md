# Roadmap: Basement Guardian

## Overview

Basement Guardian progresses from a secure, long-running vendor-cloud connection to stable Gemini accessory discovery, truthful HomeKit safety representation, official controls and pump records, explicit degraded-operation behavior, and finally an npm-ready release candidate. Each phase ends in an observable capability, and the last phase accepts the package only after compatibility, privacy, repository, hardware, and real-home gates pass.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): planned milestone work
- Decimal phases (2.1, 2.2): urgent insertions marked `INSERTED`

- [ ] **Phase 1: Secure Cloud Foundation** - Administrator can safely configure one account and maintain a trustworthy synchronized cloud-state runtime.
- [ ] **Phase 2: Safe Gemini Discovery and Identity** - Every valid Gemini receives one stable accessory while unsupported or invalid profiles fail safely.
- [ ] **Phase 3: Safety Monitoring in HomeKit** - Users receive truthful, immediate water, pump, power, battery, fault, and connectivity state.
- [ ] **Phase 4: Pump Records and Official Controls** - Users can inspect observed pump activity and use validated self-test and alarm-mute controls.
- [ ] **Phase 5: Degraded Operation and Recovery** - Users retain last-known safety state with explicit loss-of-trust signals through failures and restart.
- [ ] **Phase 6: Validated Release Candidate** - Maintainer has a compatible, tested, private, licensed, and gate-cleared package ready for controlled release.

## Phase Details

### Phase 1: Secure Cloud Foundation
**Goal**: Administrator can securely connect one Basement Guardian account and the plugin can maintain trustworthy current cloud state over a long-running Homebridge lifecycle.
**Depends on**: Nothing (first phase)
**Requirements**: CONF-01, CONF-02, CONF-03, CONF-04, CONF-05, AUTH-01, AUTH-02, SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05
**Success Criteria** (what must be TRUE):
  1. Administrator can install the dynamic platform and save one valid account through the Homebridge settings form, with the password-storage warning visible.
  2. Missing configuration leaves the plugin idle with a clear log message; valid configuration authenticates without exposing credentials or tokens.
  3. REST snapshots and partial shadow updates produce one current state per device without omitted or desired fields corrupting previously accepted values.
  4. Full-shadow refresh, REST reconciliation, credential rotation, retry, and shutdown can run repeatedly without duplicate loops, leaked work, or unhandled errors.
**Plans**: TBD
**UI hint**: yes

### Phase 2: Safe Gemini Discovery and Identity
**Goal**: Every supported physical Gemini can enter HomeKit once with stable identity, while profile uncertainty cannot create fabricated accessories or values.
**Depends on**: Phase 1
**Requirements**: DEV-01, DEV-02, DEV-03, DEV-04, DEV-05, DEV-06
**Success Criteria** (what must be TRUE):
  1. Every valid Gemini on the configured account appears as exactly one accessory, while HALO and unknown profiles produce distinct clear log explanations and do not block valid devices.
  2. Invalid identity, payload shape, field type, or legal-value domains cannot publish a new accessory or replace a cached valid value with a guess.
  3. The same physical device retains its accessory UUID, semantically equivalent service identities, and customized name through restart, rename, and supported profile change.
  4. A missing device remains present after failed or single-missing inventories and is removed only after the confirmed two-successful-inventory policy; a later return begins a new observation epoch.
**Plans**: TBD

### Phase 3: Safety Monitoring in HomeKit
**Goal**: Users can observe every supported basement-protection condition through semantically truthful services and immediate safety adapters.
**Depends on**: Phase 2
**Requirements**: CONF-06, SAFE-01, SAFE-02, SAFE-03, SAFE-04, SAFE-05, SAFE-06, SAFE-07, SAFE-08
**Success Criteria** (what must be TRUE):
  1. After G-002 validation, users can inspect truthful pit level and receive `Sump Pit Flood` only at the confirmed flood threshold; invalid codes display a fault rather than a guessed level.
  2. Users can distinguish primary/backup pump operation, mains loss, battery condition, five actionable fault subsystems, and confirmed device offline without any adapter inventing a cause.
  3. Live safety conditions and their adapters change immediately with valid source state and return to normal immediately on valid recovery, including backup activity during self-test.
  4. Administrator can omit selected optional Contact Sensor adapters through `ignoredFaults` without losing underlying conditions, diagnostics, pump records, native flood state, or battery state.
  5. Standard services are used only for their defined meaning, while exact unsupported facts remain available through read-only vendor-defined characteristics.
**Plans**: TBD

### Phase 4: Pump Records and Official Controls
**Goal**: Users can inspect durable observed pump activity and safely operate the two controls exposed by the official Gemini client.
**Depends on**: Phase 3
**Requirements**: CTRL-01, CTRL-02, CTRL-03, CTRL-04, CTRL-05
**Success Criteria** (what must be TRUE):
  1. Users can inspect each pump's observation start, detected activation count, and last detected activation after normal restart or upgrade, with no claim that the record is a device lifetime total.
  2. Users can start one System Self-Test when state and command transport are fresh, see reported test progress, and cannot issue unsupported cancellation or duplicate commands.
  3. After G-001 hardware validation, users can request the official boolean Alarm Mute and see only device-reported mute state, with no invented duration, timer, or unmute control.
  4. Accepted, rejected, timed-out, late, and externally initiated control state reconciles within the 2.5-second API and 30-second pending policies without changing canonical safety state optimistically.
  5. G-003 confirms both pump Contact Sensors in an eligible real Apple home, and documentation does not treat Activity History as safety delivery or claim configurable retention/backfill.
**Plans**: TBD

### Phase 5: Degraded Operation and Recovery
**Goal**: Users keep the best-known safety picture and can tell exactly which source is untrustworthy until fresh valid data repairs it.
**Depends on**: Phase 4
**Requirements**: RES-01, RES-02, RES-03, RES-04
**Success Criteria** (what must be TRUE):
  1. Communication loss, invalid fields, and partial payloads preserve active conditions and last valid values while faulting or deactivating only the affected scope.
  2. Users can distinguish pump-controller link loss, vendor-confirmed device offline, and a degraded REST/MQTT monitoring path; only the first two use their defined safety adapters.
  3. Restart without fresh cloud state leaves cached accessories and values available but visibly stale and prevents commands until valid state and command transport return.
  4. Fresh family-valid input clears the matching degradation promptly, while authentication rejection remains a clear user-actionable communication failure.
**Plans**: TBD

### Phase 6: Validated Release Candidate
**Goal**: Maintainer can produce an npm-ready v1 package whose compatibility, safety evidence, privacy, licensing, support, and distribution controls are complete.
**Depends on**: Phase 5
**Requirements**: REL-01, REL-02, REL-03, REL-04, REL-05, REL-06, REL-07
**Success Criteria** (what must be TRUE):
  1. Repository quality checks and deterministic policy/integration tests pass across the declared Node.js 22/24 and supported Homebridge 1.x/2.x matrix without live secrets or hardware.
  2. Network, dependency, log, fixture, planning, and packed-package audits find no telemetry, automatic uploads, credentials, or private account/local-network identifiers.
  3. The packed npm artifact contains aligned metadata, complete mixed-license texts/notices, required settings assets, and only intended distributable files.
  4. G-001, G-002, G-003, automated checks, and required real-home tests are recorded as passed before a `1.0.0` candidate is considered publishable.
  5. Prerelease metadata, safe-user warnings, release notes, best-effort issue templates, private security reporting, stable identities, and Homebridge Verified claim rules are ready and do not publish or claim approval prematurely.
**Plans**: TBD

## Progress

**Execution Order:** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Secure Cloud Foundation | 0/TBD | Not started | - |
| 2. Safe Gemini Discovery and Identity | 0/TBD | Not started | - |
| 3. Safety Monitoring in HomeKit | 0/TBD | Not started | - |
| 4. Pump Records and Official Controls | 0/TBD | Not started | - |
| 5. Degraded Operation and Recovery | 0/TBD | Not started | - |
| 6. Validated Release Candidate | 0/TBD | Not started | - |
