# Phase 4: Pump Records and Official Controls - Context

**Gathered:** 2026-08-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 adds the two things a Basement Guardian owner can do rather than only watch, and the
durable record of what the pumps have done. Phase 3 published the Pump services carrying live
state; Phase 4 gives those services their record characteristics and adds the two writable
controls the official Gemini client exposes.

**In scope:** durable per-pump observation records — observation epoch, observed activation count,
last observed activation, and de-duplicated recovery of a backup activation from the device's own
timestamp (`CTRL-01`); documentation that Activity History is controller-owned and is not safety
delivery (`CTRL-02`); the `System Self-Test` Switch following reported `test_running` (`CTRL-03`);
the `Alarm Mute` Switch following reported `alarm_audio_muted` (`CTRL-04`); and the command
lifecycle — the 2.5-second vendor deadline, the 30-second pending window, per-cause HAP errors, and
reconciliation of accepted, rejected, timed-out, late and externally initiated state (`CTRL-05`).
It also extends the Cucumber fake-pump harness to drive commands and the five `CTRL-05` outcomes.

**Out of scope:** the ~898-second heartbeat timer, the two-missed-heartbeat staleness rule, cached
safety state across restart, and telling a confirmed-offline device apart from a degraded
monitoring path (Phase 5, per `03-CONTEXT.md` D-10). Packaging, licensing, the compatibility
matrix, and every real-home release gate including the `G-003` check of both pump Contact Sensors
(Phase 6). Direct pump control, provisioning, and every other vendor route (`D-004`, permanently
out of scope).

Phase 3's remaining human-verification item does not gate this phase. It gates the `1.0.0` release.

</domain>

<decisions>
## Implementation Decisions

### The control write seam

The service catalogue is purely projective today: `ServiceRow.project()` answers values to push and
there is no write path anywhere in `src/accessories/`. Two writable Switches are the first thing
that needs one.

- **D-01 — Catalogue row plus a separate binder:** The catalogue declares and projects both control
  rows exactly like every other row, so `On` follows reported state. A new `controls` module binds
  the `onSet` handler to the already-published service through the existing
  `publishedService(accessory, row)` lookup, which `serviceCatalogue.ts` already documents as "the
  one lookup an accessory reaches for when it must act on what it already published without
  publishing anything new". The catalogue stays projection-only; one service list keeps feeding
  subtypes, `seedConfiguredName`, and the `ServiceDescriptor` order. — **Reversibility:** reversible
  — the binder is one module with one caller, and no published HomeKit contract depends on where the
  handler is registered.

- **D-02 — Two trust scopes, `self-test` and `alarm-mute`:** `TrustScope` gains both members rather
  than one shared `control` scope. An out-of-domain `alarm_audio_muted` deactivates only the Alarm
  Mute Switch and leaves Self-Test fully trustworthy. This reads `D-014`'s "narrowest affected
  scope" literally. The existing `fault` and `pump` scopes each group several fields, but those
  fields feed one set of services; these two feed disjoint services and have nothing to do with each
  other. — **Reversibility:** costly — `TrustScope` is consumed by the family adapter, the
  accessory, and every row's trust gate, so merging or splitting later touches all three tiers and
  their tests.

- **D-03 — Both Switches publish unconditionally, marked with `StatusActive`:** `ensureService`
  withholds a service until its row projects something, because HAP constructs characteristics at
  format defaults and this plugin's defaults read as good news. The two control rows are exempt.
  `constraints.md:387` records that a room holding only sensors does not render in Apple Home at
  all, and that the Self-Test Switch is what makes it visible. Both Switches therefore publish from
  the first update, and carry `StatusActive = false` until their reported field decodes.

  **This carries an unverified assumption and must not be planned as settled.** HAP's `Switch`
  declares only `Name` and `On`, with `Name` optional — verified by instantiating one from the
  pinned `@homebridge/hap-nodejs`. `StatusActive` reaches it only through the existing
  `declareCharacteristic` guard, the same route `39560ac` proved works for `ConfiguredName` on
  `ContactSensor`. That precedent is evidence, not proof, for this characteristic on this service.
  Phase 4 must raise a human-verification item: confirm in a real paired Apple Home that a Switch
  carrying `StatusActive = false` still renders and still accepts a press. — **Reversibility:**
  costly — un-publishing a service that shipped orphans anything a user attached to it.

### Command lifecycle

- **D-04 — Per-cause HAP status mapping:** Each refusal answers the status that describes it.
  `api.hap` carries both `HAPStatus` and `HapStatusError` — verified at runtime against the pinned
  package, where `HAPStatus.OPERATION_TIMED_OUT` resolves to `-70408` — so no direct HAP-NodeJS
  import is needed.

  | Cause | Status |
  |---|---|
  | Off write during a running test | `NOT_ALLOWED_IN_CURRENT_STATE` (-70412) |
  | Off write while mute is active | `NOT_ALLOWED_IN_CURRENT_STATE` (-70412) |
  | Duplicate on while already active | `RESOURCE_BUSY` (-70403) |
  | Device confirmed offline | `NOT_ALLOWED_IN_CURRENT_STATE` (-70412) |
  | Vendor answered an error | `SERVICE_COMMUNICATION_FAILURE` (-70402) |
  | 2.5-second deadline exceeded | `OPERATION_TIMED_OUT` (-70408) |

  The last row is the one `D-038` names directly. The rest are chosen so a log line and an
  Eve-class controller read true; Apple Home shows a generic failure for all of them.

- **D-05 — A pending row withholds `On`:** While a control has an unresolved request, its row
  projects nothing for `On`. This is the same per-value rule every other row already follows —
  publish a value only when the row can vouch for it — and it solves the clobber directly: the
  accessory pushes reported state on every update, which would otherwise snap the toggle back
  before the device confirmed. Because nothing is pushed, HAP keeps serving the value the accepted
  write left, which is the behaviour `constraints.md:537` records. Pending state reaches the
  catalogue through `ProjectionInput`, not through a second publish path.

- **D-06 — Expiry snaps back to reported state:** When the 30-second window closes with no
  confirming report, the row resumes projecting reported state and the Switch returns to what the
  device actually says. One warning names the capability and that the device never confirmed. The
  command is never retried, because a command that timed out may already have reached the device
  (`D-038`). `StatusActive` is not used to mark this: it already means "the reported field did not
  decode", and giving one signal two meanings would leave a user unable to tell which happened.

- **D-07 — Mirror the official client's local refusals:** The plugin refuses locally, and sends
  nothing, when the device is confirmed offline, when a test is already running, and when mute is
  already active. The official Gemini client is the closest thing to a specification this device
  has, `constraints.md:107-109` records exactly these three rules, and `D-031` independently says to
  disable commands until fresh state returns. It also stops a press on an unreachable device from
  blocking HomeKit for the full 2.5 seconds, and stops a duplicate press from operating a real sump
  pump when the official client would have refused it.

  `CTRL-03` requires rejecting duplicates regardless, so the local rule is not optional for
  self-test. Applying the same shape to mute keeps one rule rather than two.

### Pump records

- **D-08 — A records module plus a narrow persist port:** A `pumpRecords` factory owns the counting,
  the epoch, and the watermarks, and holds the `AccessoryContext` record. The accessory drives it
  from `update()` and feeds the result into `ProjectionInput`. A one-method `AccessoryStore` port is
  injected for the disk write, matching the `Timers` and `Clock` ports the codebase already uses, so
  a test hands in a recorder rather than a live Homebridge API. The accessory's injected options
  carry no `api` today and should not gain one.

  `src/persistence/accessoryContext.ts` already types `primaryPump`, `backupPump` and `watermarks`,
  and **no production code reads or writes any of them.** Phase 4 defines the whole runtime
  behaviour behind those types.

- **D-09 — Count watched rising edges only:** An activation is a false-to-true transition the plugin
  observed. A run already in progress at the first snapshot after start is not counted. Counting it
  would add a second activation for one physical run on every restart that lands mid-cycle, and for
  the primary pump nothing could ever detect or correct that, because the device reports no primary
  timestamp. The live Contact Sensor still reports the pump running truthfully; only the count
  abstains. — **Reversibility:** costly — the count is persisted and cumulative, so a later rule
  change cannot restate history and would leave records built under two different definitions.

- **D-10 — Persist on change only:** `persist()` runs when a value actually changed — a counted
  edge, a recovered activation, or a new epoch. That is a few small writes per pump cycle and none
  at all while the basement is dry. No timer is involved, which matters: `basementGuardian.test.ts`
  asserts zero `setTimeout` / `setInterval` / `setImmediate` / `queueMicrotask` across an
  `update()`, and that assertion must keep passing.

- **D-11 — A recovered activation carries the device's timestamp:** When reconciliation finds a
  `backup_pump_timestamp` newer than the watermark, the count advances by exactly one — the
  timestamp proves at least one activation and nothing about how many — `lastActivationAt` takes the
  device value, and the watermark advances. Local receive time is not used: it would report a
  40-minute-old run as having just happened. `constraints.md:503` forbids comparing a device
  timestamp against local time; storing and displaying one does no such arithmetic. The live sensor
  is never pulsed and no late notification is sent, because either would claim a current activation
  that no longer exists.

- **D-12 — The characteristics carry the "not a lifetime total" claim themselves:** The display
  names state it, so a controller showing only the characteristic still reads true, and the README
  explains the epoch and the outage gap. `Last Activation` follows the ISO-8601 string precedent
  `ControllerDataLastTrustedAt` already set, with the empty string meaning none observed.

  The README must also name the primary/backup asymmetry plainly: the primary count holds only runs
  observed live, the backup count additionally recovers missed runs from the device timestamp, and
  neither is a device total. Runs last 7 to 15 seconds against a ~15-minute REST poll, so live
  shadow delivery is what makes primary counting work at all. No monitoring-completeness indicator
  is published — that is monitoring-path state and Phase 5 owns it.

- **D-13 — One count, plus a classification of the last activation:** `CTRL-01` asks for one count,
  so there is one, and every run is in it including self-tests (`C-001`). A separate read-only flag
  records whether the last activation was test activity, computed by the algorithm at
  `constraints.md:491-505` — only once `test_running` is false and both device timestamps are
  stable, comparing the two device timestamps with each other. This uses both watermarks
  `ActivationWatermarks` already declares and adds one optional context field, which migrates
  cleanly. Two independent counts were rejected: criterion 1 names one, and a run the heuristic
  misclassifies would land in the wrong bucket permanently.

  Classification labels the record only. It must never delay or suppress a live `Backup Pump
  Activated` transition.

### Already settled — do not re-litigate

- **D-14 — Both controls are `CoreServiceKind`:** `'system-self-test'` and `'alarm-mute'` are
  already declared in `src/accessories/services.ts:33`. The subtype contract is fixed, and
  `ignoredFaults` cannot remove either — it removes `NotificationServiceKind` only.

- **D-15 — Built against the Cucumber fake, never a live pump:** Recorded in STATE.md on
  2026-08-31 and unchanged. No command reaches a live pump during development.
  `features/support/fakeShadowBroker.ts` is read-only today — it publishes `get/accepted`,
  `get/rejected` and `update/accepted` and handles no desired state — so the phase adds
  `update/rejected`, handling of the plugin's `{"desiredData": ...}` publish, and the five
  `CTRL-05` outcomes. `features/support/fakeRestApi.ts` already answers
  `PUT /devices/{id}/data` with `{ success: true }` and records every request.

  The fake must be built from the measured wire shapes in `.planning/intel/constraints.md`, never
  from invention. A fake we author answers our own design, so anything not grounded in a real
  observation is an assumption wearing a passing test.

- **D-16 — Mute constants ship provisional:** Self-test has real hardware evidence behind its wire
  shape. Alarm mute has none — nobody has observed a real Gemini's acknowledgement, state change,
  duration, latency, or failure behaviour for mute, which is what `G-001` exists for. Mute constants
  ship named `PROVISIONAL_`, exactly as the Phase 3 water ladder did under `G-002`. `G-001` stays
  open and blocks `1.0.0`. Phase 4 completion is not blocked by it.

### Claude's Discretion

- The module layout and file names behind `D-01` and `D-08`, and whether the binder takes the rows
  or looks them up.
- How pending state is represented on `ProjectionInput` — a set, an array, or per-capability flags.
- Custom characteristic UUID allocation for the record characteristics, following the Phase 3
  pattern in `src/accessories/customCharacteristics.ts`.
- Whether the record characteristics live on the existing custom Pump services or need a second
  service — provided the subtype does not change, which `03-CONTEXT.md` already required Phase 3 to
  leave open for exactly this.
- Exact wording of every log line and every characteristic display name, subject to `D-12`'s
  content requirement.
- How the fake's five `CTRL-05` outcomes are armed by a scenario.

### Folded Todos

- **`2026-08-30-document-which-services-apple-home-renders.md`** (severity major). The README reads
  as though every published service is something an owner can look at, when five are vendor-defined
  services whose UUIDs sit outside Apple's base namespace and which Apple Home therefore draws no
  tile for. Folded because it lands in the same README section `D-12` already edits; because it
  explains why a standard `Switch` renders when the custom Pump services do not, which is the
  premise `D-03` rests on; and because its real-home check merges with `D-03`'s open
  `StatusActive`-on-a-Switch risk — one session answers both. Use the `simple-english` and
  `humanizer` skills, as the rest of the README was written.

- **`2026-08-31-define-cloud-request-header-policy.md`**, **scoped to the command path only.**
  Phase 4 is the first code to send a request body, so it decides and applies the header policy for
  `PUT /devices/{deviceId}/data` — the exact `User-Agent` string, whether `Accept:
  application/json` is declared, and how the version is sourced without creating package-version
  drift. The leading candidate is an honest product identifier such as
  `homebridge-basement-guardian/<version>`. The policy must not expose credentials, account or
  device identifiers, hostnames, operating-system details, or bridge names, and must not pretend to
  be the official Basement Guardian application. The fake asserts the approved headers; no
  live-endpoint verification happens here.

  **Auth0 and the MQTT SigV4 handshake stay out of scope** and stay on the todo for Phase 6. Do not
  add a custom header to the WebSocket handshake in this phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Protocol facts — the primary specification for the commands

- `.planning/intel/constraints.md:83-113` — the two measured Gemini command bodies, the
  `PUT /devices/{deviceId}/data` route, the unverified `{ "success": true }` response body, the
  official client's three eligibility rules, and the explicit warning that HALO's `pump_state` is a
  different model that Gemini does not define.
- `.planning/intel/constraints.md:487-517` — backup activation, self-test classification with the
  four-phase timestamp table, the "compare device timestamps with each other, not with local time"
  rule and its measured ~3-second host skew, and recovery after a missed activation.
- `.planning/intel/constraints.md:535-541` — the Self-Test Switch reconciliation contract, the
  ~16-second observed test duration, the absence of a cancel command, and rejection of duplicates.
- `.planning/intel/constraints.md:546-554` — the Alarm Mute Switch contract and what `G-001` must
  still confirm.
- `.planning/intel/constraints.md:387` — a room holding only sensors does not render in Apple Home;
  the Self-Test Switch is what makes it visible. This is the premise `D-03` rests on.
- `.planning/intel/constraints.md:391` — Apple Activity History is controller-owned, needs a
  supported hub and the current Home architecture, and cannot be given retention or backfill. This
  is what `CTRL-02` documents.

### HomeKit mapping

- `docs/research/HOMEKIT.md` — the complete service table, including `System Self-Test` and
  `Alarm Mute` as standard `Switch` services driven by reported state; §3.2 covers pump
  representation and §3.4 backup activation and its recovery rules.

### Locked product decisions governing this phase

- `D-004` — official controls only; self-test and audible-alarm mute, nothing else.
- `D-009` — truthful custom Pump services with observed counts and timestamps, never lifetime or
  private-history claims.
- `D-010` — backup activity driven from live running state, de-duplicated recovered evidence, never
  a synthesized late pulse, latch, or cause.
- `D-014` — preserve untrusted state; mark only the truthful scope; require fresh valid input to
  recover.
- `D-018` — reported `test_running` owns the Switch; accept only valid on requests; reject
  cancellation, duplicates and stale paths; invent no physical eligibility rules.
- `D-019` — reported `alarm_audio_muted` owns the Switch; only the validated boolean on command; no
  duration, timer, or unmute write.
- `D-020` — one UTC observation epoch, count, and last-activation time per pump; no reset control;
  a new epoch after confirmed removal or unmigratable data.
- `D-031` — disable commands until fresh state returns.
- `D-037` — reported state stays authoritative; one 30-second pending request; clear on rejection,
  report, or expiry; never copy requested control state into safety data.
- `D-038` — 2.5-second API deadline; return an operation timeout; retain uncertain pending state;
  never automatically retry a potentially delivered command.
- `C-001` — report every observed backup run immediately, self-tests included, without inferring
  mains loss or primary-pump failure.

### Requirements

- `.planning/REQUIREMENTS.md:54-58` — `CTRL-01` through `CTRL-05`.

### Prior phase context

- `.planning/phases/03-safety-monitoring-in-homekit/03-CONTEXT.md` — the Pump services this phase
  extends; D-04's field-to-scope map, which `D-02` adds two members to; D-05's `StatusActive`
  convention, which `D-03` follows; and the Deferred Ideas list, which named this phase's records
  and controls.
- `.planning/phases/03-safety-monitoring-in-homekit/.continue-here.md` — the four blocking
  constraints carried forward. The first governs this phase directly: a green suite is not
  evidence, and four blocker-severity false-normal defects shipped inside 958 passing tests at 100%
  coverage. For any safety-bearing claim, reintroduce the defect and watch the specific test fail.

### Project state

- `.planning/STATE.md` — the 2026-08-31 Phase 4 entry recording `D-15` and `D-16`, and the
  Blockers/Concerns section carrying `G-001` through `G-004`.

### External documentation

- Pinned HAP typings under `node_modules/@homebridge/hap-nodejs/dist/`. `HAPStatus` is declared in
  `dist/lib/HAPServer.d.ts` and `HapStatusError` in `dist/lib/util/hapStatusError.d.ts`; both are
  re-exported from the package index and both resolve through `api.hap` at runtime. Use `api.hap`;
  never import HAP-NodeJS directly.
- <https://support.apple.com/en-gb/105011> — Apple's Activity History requirements, which `CTRL-02`
  documents against.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/cloud/api.ts` — `sendCommand` is **fully implemented and never called outside tests**. It
  builds `{ desiredData }`, sets `Content-Type: application/json`, applies `COMMAND_DEADLINE_MS =
  2_500`, narrows the response through `isCommandResult`, and performs exactly one attempt with no
  retry. `ROUTES.command` is already in the route set the coverage test asserts. `requestInit` at
  lines 112-117 is where the folded header-policy todo lands.
- `src/device/gemini.ts:360-378` — `CAPABILITIES` and `command()` already answer both measured wire
  shapes. **Never called outside tests.** `DeviceCapability` is `'self-test' | 'alarm-mute'`.
- `src/persistence/accessoryContext.ts` — `PumpObservation`, `ActivationWatermarks`, and the
  `AccessoryContext` members. **A pure type module with no production consumer.** Its docblocks
  already state the epoch rationale and the per-field watermark rationale.
- `src/accessories/serviceCatalogue.ts` — `publishedService()` for acting on an already-published
  service, `publishValue()` and `declareCharacteristic()` for the declare-before-push path,
  `seedConfiguredName()` for naming, and `ProjectionInput` as the one channel accessory state
  reaches a row through.
- `src/accessories/customCharacteristics.ts` — the `define()` helper and the read-only perms
  pattern. `ControllerDataLastTrustedAt` is the ISO-8601 string precedent `D-12` follows.
- `src/runtime/timers.ts` — the `Timers` port, already injected into the accessory and deliberately
  never called. `D-10` keeps it that way for the update path.
- `features/support/fakeRestApi.ts:154-157` — already answers `PUT` on the command suffix with
  `{ success: true }` and records every request with method, path, authorization and body.

### Established Patterns

- Factory with injected options returning a closure-backed object — `state.ts`, `registry.ts`,
  `reconciliation.ts`, `basementGuardian.ts`. `pumpRecords` and the controls binder follow it.
- Narrow injected ports for anything the module must be provable about — `Timers`, `Clock`.
  `AccessoryStore` in `D-08` follows this.
- Hand-written predicate narrowing (`isRecord` plus named field checks), never `as` assertions.
- Unit tests under `test/` mirroring `src/`; Cucumber features and step definitions under
  `features/`, with the fake cloud, fake HAP, and plugin harness in `features/support/`.
- New accessories unit tests import `features/support/fakeHap.ts` rather than growing their own HAP
  stand-in. `test/accessories/basementGuardian.test.ts` still carries a second hand-built stand-in;
  STATE.md records that migrating it belongs with a rework of its `AccessoryInformation`
  assertions, not with this phase.

### Integration Points

- `src/accessories/basementGuardian.ts` — `update()` gains the records call and the pending-state
  read; `publishRows()` is where the binder attaches after a control row is first published. The
  file is already 579 lines and its docblock claims it owns HomeKit and nothing else; `D-01` and
  `D-08` are both shaped to keep that claim true.
- `src/device/health.ts` — `TrustScope` gains the two members from `D-02`.
- `src/device/gemini.ts` — the field-to-scope map gains `test_running`, `alarm_audio_muted` and
  `test_timestamp`, which `03-CONTEXT.md` D-04 explicitly left to this phase.
- `src/platform.ts` — where `AccessoryStore` is wired to `api.updatePlatformAccessories`, and where
  the accessory would receive a command port reaching `CloudApi.sendCommand`.
- `src/runtime/accountRuntime.ts` — currently asserts in tests that the runtime never reaches the
  command route (`accountRuntime.test.ts:306`). Check whether that stand-in stays truthful once a
  command path exists, and update the assertion deliberately rather than by accident.
- `features/support/fakeShadowBroker.ts` — `ShadowTopicLeaf` gains `update/rejected`; the broker
  gains desired-state handling and a publish for it.
- `README.md` — the record characteristics, the primary/backup asymmetry, the Apple Home rendering
  list from the folded todo, and the `CTRL-02` Activity History wording.

</code_context>

<specifics>
## Specific Ideas

- `D-03` is the one decision in this phase resting on an unverified assumption. Plan a human
  verification item for it explicitly rather than letting the phase claim it: confirm in a real
  paired Apple Home that a `Switch` carrying `StatusActive = false` still renders and still accepts
  a press. Fold the folded todo's tile-visibility list into the same session.

- The `.continue-here.md` anti-pattern "verifying the change, not the outcome" applies directly to
  `D-03`. A test asserting `StatusActive` is present on the Switch proves the characteristic landed;
  it says nothing about what Apple Home draws. Keep the two claims separate in the verification
  report.

- Keep the `PROVISIONAL_` mute constants in one place, so closing `G-001` is a single reviewable
  edit — the same shape Phase 3 used for the water ladder under `G-002`.

- The five `CTRL-05` outcomes are the phase's real test surface: accepted, rejected, timed out,
  late, and externally initiated. "Externally initiated" means the shadow reports `test_running:
  true` with no HomeKit command behind it — the Switch must follow it without any pending state
  existing at all.

</specifics>

<deferred>
## Deferred Ideas

- A per-pump monitoring-completeness indicator, so a user could judge how complete an activation
  count is. Rejected here because it is monitoring-path state and Phase 5 owns that design.
  Recorded so a later phase does not rediscover it as new.

- Two independent activation counts, splitting self-test runs from real ones. Rejected under `D-13`:
  criterion 1 names one count, and a misclassified run would sit in the wrong bucket permanently.

- The header policy for Auth0 and the AWS IoT MQTT SigV4 WebSocket handshake, and verification of
  any header policy against live vendor endpoints. Phase 6, on the existing todo.

- The `~898`-second heartbeat timer, the two-missed-heartbeat staleness rule, cached safety state
  across restart, and separating confirmed-offline from a degraded monitoring path. Phase 5.

- Confirming the `<account-id>` format against a real inventory response. Still open from Phase 2,
  unchanged by this phase.

### Reviewed Todos (not folded)

- **`2026-08-31-record-g-002-natural-water-level-evidence.md`** — water-level validation evidence
  for `G-002`. Matched on generic keywords only. It belongs to the water ladder Phase 3 shipped and
  to the `1.0.0` release gates, not to pump records or controls.

- **`2026-08-31-state-the-harness-mdns-prerequisite.md`** — the dev UAT harness mDNS prerequisites.
  Development infrastructure documentation; it will matter when `D-03`'s real-home check is run, but
  it is not phase work.

</deferred>

---

*Phase: 4-Pump Records and Official Controls*
*Context gathered: 2026-08-31*
