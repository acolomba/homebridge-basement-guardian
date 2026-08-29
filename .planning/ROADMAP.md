# Roadmap: Basement Guardian

## Overview

Basement Guardian progresses from a secure, long-running vendor-cloud connection to stable Gemini accessory discovery, truthful HomeKit safety representation, official controls and pump records, explicit degraded-operation behavior, and finally an npm-ready release candidate. Each phase ends in an observable capability, and the last phase accepts the package only after compatibility, privacy, repository, hardware, and real-home gates pass.

The hardware and real-home validation gates G-001 through G-004 block only the `1.0.0` release, not phase completion. Each phase delivers its implementation and marks any unvalidated constant provisional.

Each phase adds unit tests and applicable fake-pump scenarios for its behavior. Phase 6 runs the complete suites and compatibility matrix.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): planned milestone work
- Decimal phases (2.1, 2.2): urgent insertions marked `INSERTED`

- [x] **Phase 1: Secure Cloud Foundation** - Administrator can safely configure one account and maintain a trustworthy synchronized cloud-state runtime.
- [ ] **Phase 2: Safe Gemini Discovery and Identity** - Every valid Gemini receives one stable accessory while unsupported or invalid profiles fail safely.
- [ ] **Phase 3: Safety Monitoring in HomeKit** - Users receive truthful, immediate water, pump, power, battery, fault, and connectivity state.
- [ ] **Phase 4: Pump Records and Official Controls** - Users can inspect observed pump activity and use validated self-test and alarm-mute controls.
- [ ] **Phase 5: Degraded Operation and Recovery** - Users keep cached safety state through restart and can separate confirmed device offline from a degraded monitoring path.
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

**Plans**: 11/11 executed, plus 6 gap-closure plans from verification

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Toolchain, packaging, and template teardown

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Tracer: configure, authenticate, discover, store, shut down

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — Canonical snapshot store and architecture scaffolds
- [x] 01-04-PLAN.md — Settings form, configuration refusal, and redacted logging
- [x] 01-05-PLAN.md — Auth token cache and authentication failure policy
- [x] 01-06-PLAN.md — Typed REST surface and wire-type predicates

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-07-PLAN.md — SigV4 presigner and retry policy, behind the transport decision gate
- [x] 01-08-PLAN.md — Fake cloud transport harness

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 01-09-PLAN.md — Shadow client: topics, watermark, and reconnect

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 01-10-PLAN.md — Account runtime orchestration and lifecycle

**Wave 7** *(blocked on Wave 6 completion)*

- [x] 01-11-PLAN.md — Phase scenarios and changelog

**Gap closure Wave 1** *(from 01-VERIFICATION.md; blocked on Wave 7 completion)*

- [x] 01-12-PLAN.md — Acceptance-gate determinism and injected rotation timing

**Gap closure Wave 2** *(blocked on Gap closure Wave 1)*

- [x] 01-14-PLAN.md — Shadow connection generation and transport deadlines
- [x] 01-15-PLAN.md — Account-identifier privacy, logger bounds, form agreement
- [x] 01-16-PLAN.md — REST and auth client robustness

**Gap closure Wave 3** *(blocked on Gap closure Wave 2)*

- [x] 01-13-PLAN.md — Merge reducer: false freshness, source ownership, change detection

**Gap closure Wave 4** *(blocked on Gap closure Wave 3)*

- [x] 01-17-PLAN.md — Monitoring path contract, dead state, and shutdown windows

**Cross-cutting constraints:**

- Shutdown during an in-flight retry wait, an in-flight request, and an open shadow connection produces no unhandled rejection (SYNC-05).

**UI hint**: yes

### Phase 2: Safe Gemini Discovery and Identity

**Goal**: Every supported physical Gemini can enter HomeKit once with stable identity, while profile uncertainty cannot create fabricated accessories or values.
**Depends on**: Phase 1
**Requirements**: DEV-01, DEV-02, DEV-03, DEV-04, DEV-05, DEV-06, DEV-07, DEV-08
**Success Criteria** (what must be TRUE):

  1. Every valid Gemini on the configured account appears as exactly one accessory, while HALO and unknown profiles produce distinct clear log explanations and do not block valid devices.
  2. Invalid identity, payload shape, field type, or legal-value domains cannot publish a new accessory or replace a cached valid value with a guess.
  3. The same physical device retains its accessory UUID, semantically equivalent service identities, and customized name through restart, rename, and supported profile change.
  4. A missing device remains present after failed or single-missing inventories and is removed only after the confirmed two-successful-inventory policy; a later return begins a new observation epoch.
  5. Each accessory carries truthful manufacturer, model, serial-number, and firmware metadata sourced only from validated vendor identity fields, and the vendor `deviceId` never becomes a user-visible value.
  6. A profile or payload that stops validating after publication degrades the accessory in place, keeping its identity and last valid values and disabling commands, instead of unregistering it.

**Plans**: 2/6 plans executed

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Tracer: one valid Gemini becomes one published accessory with AccessoryInformation; complete Gemini field validation/decoding/commands
- [x] 02-02-PLAN.md — Reconciliation state machine and `DeviceStateStore.remove`

**Wave 2** *(blocked on 02-01)*

- [ ] 02-03-PLAN.md — Family registry three-way outcome and mixed-inventory dispatch

**Wave 3** *(blocked on 02-03)*

- [ ] 02-04-PLAN.md — Accessory identity unification and vendor-rename adoption

**Wave 4** *(blocked on 02-04 and 02-02)*

- [ ] 02-05-PLAN.md — Two-confirmation-plus-final-check removal wiring

**Wave 5** *(blocked on 02-05)*

- [ ] 02-06-PLAN.md — Degrade-in-place

### Phase 3: Safety Monitoring in HomeKit

**Goal**: Users can observe every supported basement-protection condition through semantically truthful services and immediate safety adapters.
**Depends on**: Phase 2
**Requirements**: CONF-06, SAFE-01, SAFE-02, SAFE-03, SAFE-04, SAFE-05, SAFE-06, SAFE-07, SAFE-08, RES-01, RES-02
**Success Criteria** (what must be TRUE):

  1. Users can inspect truthful pit level through an explicit legal-value lookup and receive `Sump Pit Flood` only at the flood threshold; an unknown code displays a fault rather than a guessed level, and the threshold constant stays provisional until G-002 closes.
  2. Users can distinguish primary/backup pump operation, mains loss, battery condition, five actionable fault subsystems, and confirmed device offline without any adapter inventing a cause.
  3. Live safety conditions and their adapters change immediately with valid source state and return to normal immediately on valid recovery, including backup activity during self-test.
  4. Administrator can omit selected optional Contact Sensor adapters through `ignoredFaults` without losing underlying conditions, diagnostics, pump records, native flood state, or battery state.
  5. Standard services are used only for their defined meaning, while exact unsupported facts remain available through read-only vendor-defined characteristics.
  6. An invalid, omitted, or stale field preserves the last valid value and faults or deactivates only the narrowest owning scope, and `serial_communications === false` immediately activates `Pump Controller Link Lost` while exposing when trustworthy controller data last arrived.

**Plans**: TBD

### Phase 4: Pump Records and Official Controls

**Goal**: Users can inspect durable observed pump activity and safely operate the two controls exposed by the official Gemini client.
**Depends on**: Phase 3
**Requirements**: CTRL-01, CTRL-02, CTRL-03, CTRL-04, CTRL-05
**Success Criteria** (what must be TRUE):

  1. Users can inspect each pump's observation start, detected activation count, and last detected activation after normal restart or upgrade, with no claim that the record is a device lifetime total.
  2. Users can start one System Self-Test when state and command transport are fresh, see reported test progress, and cannot issue unsupported cancellation or duplicate commands.
  3. Users can request the official boolean Alarm Mute and see only device-reported mute state, with no invented duration, timer, or unmute control; the mute constants stay provisional until G-001 closes.
  4. Accepted, rejected, timed-out, late, and externally initiated control state reconciles within the 2.5-second API and 30-second pending policies without changing canonical safety state optimistically.
  5. Documentation does not treat Activity History as safety delivery or claim configurable retention/backfill; the G-003 real-home check of both pump Contact Sensors belongs to Phase 6 release validation.

**Plans**: TBD

### Phase 5: Degraded Operation and Recovery

**Goal**: Users keep cached safety state through restart and can tell vendor-confirmed device offline apart from a degraded monitoring path. Each degradation clears once fresh valid data returns.
**Depends on**: Phase 4
**Requirements**: RES-03, RES-04
**Success Criteria** (what must be TRUE):

  1. `Basement Guardian Offline` activates only after the configured number of successful REST snapshots report the device disconnected, and a failed REST request never counts toward that confirmation.
  2. Users can distinguish pump-controller link loss, vendor-confirmed device offline, and a degraded REST/MQTT monitoring path; only the first two use their defined safety adapters.
  3. Restart without fresh cloud state leaves cached accessories and values available but visibly stale and prevents commands until valid state and command transport return.
  4. Fresh family-valid input clears the matching degradation promptly, while authentication rejection remains a clear user-actionable communication failure.

**Plans**: TBD

### Phase 6: Validated Release Candidate

**Goal**: Maintainer can produce an npm-ready v1 package whose compatibility, safety evidence, privacy, licensing, support, and distribution controls are complete.
**Depends on**: Phase 5
**Requirements**: REL-01, REL-02, REL-03, REL-04, REL-05, REL-06, REL-07, REL-08, REL-09
**Success Criteria** (what must be TRUE):

  1. Repository quality checks, unit tests, and deterministic fake-pump integration tests pass across the declared Node.js and Homebridge compatibility matrix.
  2. Network, dependency, log, fixture, planning, and packed-package audits find no telemetry, automatic uploads, credentials, or private account/local-network identifiers.
  3. The packed npm artifact contains aligned metadata, complete mixed-license texts/notices, required settings assets, and only intended distributable files.
  4. G-001, G-002, G-003, G-004, automated checks, and read-only real-pump tests are recorded as passed before a `1.0.0` candidate is considered publishable.
  5. Prerelease metadata, safe-user warnings, release notes, best-effort issue templates, private security reporting, stable identities, and Homebridge Verified claim rules are ready and do not publish or claim approval prematurely.
  6. User-facing documentation discloses plaintext password storage, explains the child-bridge recommendation with its separate pairing and accessory re-creation consequences, marks prereleases experimental while telling users to keep the vendor alarm and notifications enabled, labels the 25/50/75/100 battery levels as estimates, and claims no Critical Alerts guarantee.

**Plans**: TBD

## Progress

**Execution Order:** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Secure Cloud Foundation | 17/17 | Complete | 2026-08-29 |
| 2. Safe Gemini Discovery and Identity | 2/6 | In Progress|  |
| 3. Safety Monitoring in HomeKit | 0/TBD | Not started | - |
| 4. Pump Records and Official Controls | 0/TBD | Not started | - |
| 5. Degraded Operation and Recovery | 0/TBD | Not started | - |
| 6. Validated Release Candidate | 0/TBD | Not started | - |
