# Phase 4: Pump Records and Official Controls - Research

**Researched:** 2026-08-31
**Domain:** HAP write-path semantics, Homebridge accessory command lifecycle, durable per-accessory observation records, Cucumber fake-cloud harness extension
**Confidence:** HIGH for the HAP write path and every in-repo seam (both probed or read this session); MEDIUM for the fake-harness design; LOW for what Apple Home actually renders

<user_constraints>
## User Constraints (from CONTEXT.md)

**All sixteen decisions below are LOCKED. This research investigates how to implement them, not whether to.**

### Locked Decisions

**The control write seam**

- **D-01 — Catalogue row plus a separate binder:** The catalogue declares and projects both control rows exactly like every other row, so `On` follows reported state. A new `controls` module binds the `onSet` handler to the already-published service through the existing `publishedService(accessory, row)` lookup, which `serviceCatalogue.ts` already documents as "the one lookup an accessory reaches for when it must act on what it already published without publishing anything new". The catalogue stays projection-only; one service list keeps feeding subtypes, `seedConfiguredName`, and the `ServiceDescriptor` order. — **Reversibility:** reversible — the binder is one module with one caller, and no published HomeKit contract depends on where the handler is registered.

- **D-02 — Two trust scopes, `self-test` and `alarm-mute`:** `TrustScope` gains both members rather than one shared `control` scope. An out-of-domain `alarm_audio_muted` deactivates only the Alarm Mute Switch and leaves Self-Test fully trustworthy. This reads `D-014`'s "narrowest affected scope" literally. The existing `fault` and `pump` scopes each group several fields, but those fields feed one set of services; these two feed disjoint services and have nothing to do with each other. — **Reversibility:** costly — `TrustScope` is consumed by the family adapter, the accessory, and every row's trust gate, so merging or splitting later touches all three tiers and their tests.

- **D-03 — Both Switches publish unconditionally, marked with `StatusActive`:** `ensureService` withholds a service until its row projects something, because HAP constructs characteristics at format defaults and this plugin's defaults read as good news. The two control rows are exempt. `constraints.md:387` records that a room holding only sensors does not render in Apple Home at all, and that the Self-Test Switch is what makes it visible. Both Switches therefore publish from the first update, and carry `StatusActive = false` until their reported field decodes.

  **This carries an unverified assumption and must not be planned as settled.** HAP's `Switch` declares only `Name` and `On`, with `Name` optional — verified by instantiating one from the pinned `@homebridge/hap-nodejs`. `StatusActive` reaches it only through the existing `declareCharacteristic` guard, the same route `39560ac` proved works for `ConfiguredName` on `ContactSensor`. That precedent is evidence, not proof, for this characteristic on this service. Phase 4 must raise a human-verification item: confirm in a real paired Apple Home that a Switch carrying `StatusActive = false` still renders and still accepts a press. — **Reversibility:** costly — un-publishing a service that shipped orphans anything a user attached to it.

**Command lifecycle**

- **D-04 — Per-cause HAP status mapping:** Each refusal answers the status that describes it. `api.hap` carries both `HAPStatus` and `HapStatusError` — verified at runtime against the pinned package, where `HAPStatus.OPERATION_TIMED_OUT` resolves to `-70408` — so no direct HAP-NodeJS import is needed.

  | Cause | Status |
  |---|---|
  | Off write during a running test | `NOT_ALLOWED_IN_CURRENT_STATE` (-70412) |
  | Off write while mute is active | `NOT_ALLOWED_IN_CURRENT_STATE` (-70412) |
  | Duplicate on while already active | `RESOURCE_BUSY` (-70403) |
  | Device confirmed offline | `NOT_ALLOWED_IN_CURRENT_STATE` (-70412) |
  | Vendor answered an error | `SERVICE_COMMUNICATION_FAILURE` (-70402) |
  | 2.5-second deadline exceeded | `OPERATION_TIMED_OUT` (-70408) |

  The last row is the one `D-038` names directly. The rest are chosen so a log line and an Eve-class controller read true; Apple Home shows a generic failure for all of them.

- **D-05 — A pending row withholds `On`:** While a control has an unresolved request, its row projects nothing for `On`. This is the same per-value rule every other row already follows — publish a value only when the row can vouch for it — and it solves the clobber directly: the accessory pushes reported state on every update, which would otherwise snap the toggle back before the device confirmed. Because nothing is pushed, HAP keeps serving the value the accepted write left, which is the behaviour `constraints.md:537` records. Pending state reaches the catalogue through `ProjectionInput`, not through a second publish path.

- **D-06 — Expiry snaps back to reported state:** When the 30-second window closes with no confirming report, the row resumes projecting reported state and the Switch returns to what the device actually says. One warning names the capability and that the device never confirmed. The command is never retried, because a command that timed out may already have reached the device (`D-038`). `StatusActive` is not used to mark this: it already means "the reported field did not decode", and giving one signal two meanings would leave a user unable to tell which happened.

- **D-07 — Mirror the official client's local refusals:** The plugin refuses locally, and sends nothing, when the device is confirmed offline, when a test is already running, and when mute is already active. The official Gemini client is the closest thing to a specification this device has, `constraints.md:107-109` records exactly these three rules, and `D-031` independently says to disable commands until fresh state returns. It also stops a press on an unreachable device from blocking HomeKit for the full 2.5 seconds, and stops a duplicate press from operating a real sump pump when the official client would have refused it.

  `CTRL-03` requires rejecting duplicates regardless, so the local rule is not optional for self-test. Applying the same shape to mute keeps one rule rather than two.

**Pump records**

- **D-08 — A records module plus a narrow persist port:** A `pumpRecords` factory owns the counting, the epoch, and the watermarks, and holds the `AccessoryContext` record. The accessory drives it from `update()` and feeds the result into `ProjectionInput`. A one-method `AccessoryStore` port is injected for the disk write, matching the `Timers` and `Clock` ports the codebase already uses, so a test hands in a recorder rather than a live Homebridge API. The accessory's injected options carry no `api` today and should not gain one.

  `src/persistence/accessoryContext.ts` already types `primaryPump`, `backupPump` and `watermarks`, and **no production code reads or writes any of them.** Phase 4 defines the whole runtime behaviour behind those types.

- **D-09 — Count watched rising edges only:** An activation is a false-to-true transition the plugin observed. A run already in progress at the first snapshot after start is not counted. Counting it would add a second activation for one physical run on every restart that lands mid-cycle, and for the primary pump nothing could ever detect or correct that, because the device reports no primary timestamp. The live Contact Sensor still reports the pump running truthfully; only the count abstains. — **Reversibility:** costly — the count is persisted and cumulative, so a later rule change cannot restate history and would leave records built under two different definitions.

- **D-10 — Persist on change only:** `persist()` runs when a value actually changed — a counted edge, a recovered activation, or a new epoch. That is a few small writes per pump cycle and none at all while the basement is dry. No timer is involved, which matters: `basementGuardian.test.ts` asserts zero `setTimeout` / `setInterval` / `setImmediate` / `queueMicrotask` across an `update()`, and that assertion must keep passing.

- **D-11 — A recovered activation carries the device's timestamp:** When reconciliation finds a `backup_pump_timestamp` newer than the watermark, the count advances by exactly one — the timestamp proves at least one activation and nothing about how many — `lastActivationAt` takes the device value, and the watermark advances. Local receive time is not used: it would report a 40-minute-old run as having just happened. `constraints.md:503` forbids comparing a device timestamp against local time; storing and displaying one does no such arithmetic. The live sensor is never pulsed and no late notification is sent, because either would claim a current activation that no longer exists.

- **D-12 — The characteristics carry the "not a lifetime total" claim themselves:** The display names state it, so a controller showing only the characteristic still reads true, and the README explains the epoch and the outage gap. `Last Activation` follows the ISO-8601 string precedent `ControllerDataLastTrustedAt` already set, with the empty string meaning none observed.

  The README must also name the primary/backup asymmetry plainly: the primary count holds only runs observed live, the backup count additionally recovers missed runs from the device timestamp, and neither is a device total. Runs last 7 to 15 seconds against a ~15-minute REST poll, so live shadow delivery is what makes primary counting work at all. No monitoring-completeness indicator is published — that is monitoring-path state and Phase 5 owns it.

- **D-13 — One count, plus a classification of the last activation:** `CTRL-01` asks for one count, so there is one, and every run is in it including self-tests (`C-001`). A separate read-only flag records whether the last activation was test activity, computed by the algorithm at `constraints.md:491-505` — only once `test_running` is false and both device timestamps are stable, comparing the two device timestamps with each other. This uses both watermarks `ActivationWatermarks` already declares and adds one optional context field, which migrates cleanly. Two independent counts were rejected: criterion 1 names one, and a run the heuristic misclassifies would land in the wrong bucket permanently.

  Classification labels the record only. It must never delay or suppress a live `Backup Pump Activated` transition.

**Already settled — do not re-litigate**

- **D-14 — Both controls are `CoreServiceKind`:** `'system-self-test'` and `'alarm-mute'` are already declared in `src/accessories/services.ts:33`. The subtype contract is fixed, and `ignoredFaults` cannot remove either — it removes `NotificationServiceKind` only.

- **D-15 — Built against the Cucumber fake, never a live pump:** Recorded in STATE.md on 2026-08-31 and unchanged. No command reaches a live pump during development. `features/support/fakeShadowBroker.ts` is read-only today — it publishes `get/accepted`, `get/rejected` and `update/accepted` and handles no desired state — so the phase adds `update/rejected`, handling of the plugin's `{"desiredData": ...}` publish, and the five `CTRL-05` outcomes. `features/support/fakeRestApi.ts` already answers `PUT /devices/{id}/data` with `{ success: true }` and records every request.

  The fake must be built from the measured wire shapes in `.planning/intel/constraints.md`, never from invention. A fake we author answers our own design, so anything not grounded in a real observation is an assumption wearing a passing test.

- **D-16 — Mute constants ship provisional:** Self-test has real hardware evidence behind its wire shape. Alarm mute has none — nobody has observed a real Gemini's acknowledgement, state change, duration, latency, or failure behaviour for mute, which is what `G-001` exists for. Mute constants ship named `PROVISIONAL_`, exactly as the Phase 3 water ladder did under `G-002`. `G-001` stays open and blocks `1.0.0`. Phase 4 completion is not blocked by it.

### Claude's Discretion

- The module layout and file names behind `D-01` and `D-08`, and whether the binder takes the rows or looks them up.
- How pending state is represented on `ProjectionInput` — a set, an array, or per-capability flags.
- Custom characteristic UUID allocation for the record characteristics, following the Phase 3 pattern in `src/accessories/customCharacteristics.ts`.
- Whether the record characteristics live on the existing custom Pump services or need a second service — provided the subtype does not change, which `03-CONTEXT.md` already required Phase 3 to leave open for exactly this.
- Exact wording of every log line and every characteristic display name, subject to `D-12`'s content requirement.
- How the fake's five `CTRL-05` outcomes are armed by a scenario.

### Folded Todos (in scope)

- **`2026-08-30-document-which-services-apple-home-renders.md`** (severity major). The README reads as though every published service is something an owner can look at, when five are vendor-defined services whose UUIDs sit outside Apple's base namespace and which Apple Home therefore draws no tile for. Folded because it lands in the same README section `D-12` already edits; because it explains why a standard `Switch` renders when the custom Pump services do not, which is the premise `D-03` rests on; and because its real-home check merges with `D-03`'s open `StatusActive`-on-a-Switch risk — one session answers both. Use the `simple-english` and `humanizer` skills, as the rest of the README was written.

- **`2026-08-31-define-cloud-request-header-policy.md`**, **scoped to the command path only.** Phase 4 is the first code to send a request body, so it decides and applies the header policy for `PUT /devices/{deviceId}/data` — the exact `User-Agent` string, whether `Accept: application/json` is declared, and how the version is sourced without creating package-version drift. The leading candidate is an honest product identifier such as `homebridge-basement-guardian/<version>`. The policy must not expose credentials, account or device identifiers, hostnames, operating-system details, or bridge names, and must not pretend to be the official Basement Guardian application. The fake asserts the approved headers; no live-endpoint verification happens here.

  **Auth0 and the MQTT SigV4 handshake stay out of scope** and stay on the todo for Phase 6. Do not add a custom header to the WebSocket handshake in this phase.

### Deferred Ideas (OUT OF SCOPE)

- A per-pump monitoring-completeness indicator, so a user could judge how complete an activation count is. Rejected here because it is monitoring-path state and Phase 5 owns that design. Recorded so a later phase does not rediscover it as new.

- Two independent activation counts, splitting self-test runs from real ones. Rejected under `D-13`: criterion 1 names one count, and a misclassified run would sit in the wrong bucket permanently.

- The header policy for Auth0 and the AWS IoT MQTT SigV4 WebSocket handshake, and verification of any header policy against live vendor endpoints. Phase 6, on the existing todo.

- The `~898`-second heartbeat timer, the two-missed-heartbeat staleness rule, cached safety state across restart, and separating confirmed-offline from a degraded monitoring path. Phase 5.

- Confirming the `<account-id>` format against a real inventory response. Still open from Phase 2, unchanged by this phase.

- **Reviewed todos, not folded:** `2026-08-31-record-g-002-natural-water-level-evidence.md` (belongs to the Phase 3 water ladder and the `1.0.0` gates) and `2026-08-31-state-the-harness-mdns-prerequisite.md` (development infrastructure documentation, not phase work).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CTRL-01 | Each pump exposes a persisted read-only observation start, observed activation count, and last-observed-activation UTC timestamp that survives normal restarts/upgrades and never claims to be a lifetime total. | Pattern 7 (record characteristics go on the existing `PumpService` as **optional**, quoting `customServices.ts:24-29` which pre-authorises exactly this); Runtime State Inventory (all three context members are new, so the only migration is absent → seeded); Pitfall 2 (the Unix-seconds vs. local-milliseconds unit trap); Code Examples (the three `define()` calls and the `uint8` overflow warning); Don't Hand-Roll (`isoTimestamp` already exists). |
| CTRL-02 | Documentation makes clear that Activity History is controller-owned, is not safety delivery, has no configurable retention, and is not a source of missed-event backfill. | Sources (`constraints.md:391` and Apple's requirements page); Project Constraints (the README prose must go through `simple-english` and `humanizer`); Validation Architecture marks this manual-only, verified by review rather than assertion. |
| CTRL-03 | `System Self-Test` follows reported `test_running`, accepts one valid on request, rejects cancellation and duplicates, permits tests during physical faults, and reflects tests started outside HomeKit. | Pattern 3 (`StatusActive` on a `Switch` is HAP-verified); Pattern 5 (the pending row withholds `On`); Pattern 6 (the `ensureService` exemption D-03 needs); the control binder skeleton; the field-to-scope extension putting `test_running` in the new `self-test` scope; the Cucumber outcome matrix rows for duplicate, off-write, and externally initiated. |
| CTRL-04 | `Alarm Mute` follows reported `alarm_audio_muted`, sends only the official `{"alarm_audio_muted": true}` boolean on command, and provides no duration, timer, simulated unmute, or off write while mute is active. G-001 blocks only the `1.0.0` release. | Don't Hand-Roll (`geminiFamily.command` already answers the measured body); the binder skeleton's `value !== true` refusal; the field-to-scope extension putting `alarm_audio_muted` in the new `alarm-mute` scope; Validation Architecture requires a test that every mute constant is `PROVISIONAL_`-named and lives in one module. |
| CTRL-05 | Each HomeKit command waits at most 2.5 seconds for vendor acceptance, keeps reported state authoritative, tracks one 30-second pending/uncertain request, returns appropriate HAP errors, and never automatically retries or writes requested state into safety data. | Pattern 1 (HAP retains an accepted write and never stores a rejected one — probed); **Pattern 2 (the sticky `statusCode`, the phase's largest new finding)**; Pattern 4 (`api.hap` carries every status D-04 names); the command port design and the `accountRuntime.test.ts:306` guidance; Pitfalls 5, 6, 7 (fake clock, command-scoped arming, `{success:false}`); the Cucumber outcome matrix covering all five outcomes plus the sixth `success:false` branch. |
</phase_requirements>

## Summary

The three genuinely unresolved areas resolved differently than the phase context expected, and one of them changes a locked decision's implementation rather than the decision itself.

**HAP write path.** I read the pinned `@homebridge/hap-nodejs@2.2.2` source and then ran it. Both halves of D-05 and D-04 hold: an accepted `onSet` stores the requested value (`Characteristic.js:1815`), and a rejected one never assigns `this.value` at all, so the old value stays without any `updateCharacteristic` snap-back. But a third fact nobody planned for came out of the probe: **a rejection leaves `characteristic.statusCode` non-zero, and `handleGetRequest` throws that same status on every later read until something pushes a value** (`Characteristic.js:1729`). That is the "No Response" mechanism `03-CONTEXT.md` D-05 forbids the plugin from producing, arriving through the front door that D-04 requires. The mitigation is verified: any `updateCharacteristic` on that characteristic — even with the value it already holds — resets `statusCode` to 0. `StatusActive` on a `Switch` is settled: declared through the existing guard it produces no warning; undeclared it produces the exact warning the guard exists to suppress. `api.hap.HAPStatus` and `api.hap.HapStatusError` both resolve, with the six statuses D-04 names.

**Cucumber harness.** Two structural facts change the shape of the work. The plugin issues exactly one MQTT publish in its whole life — a shadow `get` with an empty payload (`shadow.ts:345`) — so it never sends a shadow update, and the real service therefore never has one of the plugin's to reject. It does not subscribe to `update/rejected` either (`shadow.ts:151-158`). D-15's `{"desiredData": ...}` publish is the REST PUT body (`api.ts:169`), not an MQTT message. The `update/rejected` leaf should be dropped rather than added. The five CTRL-05 outcomes are all observable at the REST layer instead, and `fakeRestApi` already has the two primitives needed: `failNextWith(status)` and `holdNextRequest()`, the latter being an exact fit for the 2.5-second deadline. Separately, `fakeHap.ts` has no `Switch`, no `On`, no `onSet`, and no `HAPStatus` — the fake HAP is the largest single piece of harness work in the phase, and it is the piece most exposed to `.continue-here.md`'s "a fake we author answers our own design."

**Command wiring.** The narrow port belongs on `AccountRuntime`, because that is the only object holding both the `CloudApi` instance and the root `AbortController` that a shutdown cancels through. `test/runtime/accountRuntime.test.ts:306` stays truthful and should not be relaxed globally; it is a per-test stand-in, and only the new command tests need a recording variant.

**Primary recommendation:** Build the accessory's control binder so that every refusal — local or vendor — throws the D-04 status **and then pushes the reported `On` value back onto the characteristic through the injected `Timers` port at delay 0**, because HAP's sticky `statusCode` otherwise leaves the Switch answering an error to every read until the next poll.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Publishing the two control Switches and their `On` projection | `src/accessories/serviceCatalogue.ts` (catalogue row) | — | Every published value in this plugin comes from a row's `project()`. D-01 keeps that true. |
| Binding `onSet` to an already-published Switch | new `src/accessories/controls.ts` (D-01 binder) | `src/accessories/basementGuardian.ts` calls it | `publishedService()` is documented as "the one lookup an accessory reaches for when it must act on what it already published" (`serviceCatalogue.ts:672`). |
| Deciding a command is refused locally (offline, running, already muted) | `src/accessories/controls.ts` | reads decoded state via `ProjectionInput` | D-07 mirrors the official client. The rule is a HomeKit-tier eligibility rule, not device meaning. |
| Building the wire body for a capability | `src/device/gemini.ts` `command()` | — | Already implemented (`gemini.ts:373-378`). Family owns wire shape. |
| Sending the command over HTTP with the 2.5 s deadline | `src/cloud/api.ts` `sendCommand` | — | Already implemented, `COMMAND_DEADLINE_MS = 2_500` (`api.ts:14`). |
| Owning the command port and the root abort signal | `src/runtime/accountRuntime.ts` | `src/platform.ts` injects it into the accessory | The runtime is the only holder of both `CloudApi` and the root `AbortController`. |
| Counting activations, epochs, watermarks, classification | new `src/accessories/pumpRecords.ts` (D-08) | — | Local observation, not device meaning; no family knowledge needed beyond decoded booleans and timestamps. |
| Persisting the record to disk | `AccessoryStore` port, wired in `src/platform.ts` to `api.updatePlatformAccessories` | — | Matches `Timers`/`Clock`; keeps `api` out of the accessory's options (D-08). |
| Marking `test_running` / `alarm_audio_muted` untrustworthy | `src/device/gemini.ts` `TELEMETRY_CHECKS` + `src/device/health.ts` `TrustScope` | `src/device/family.ts` `ScopedDomainState` | D-02, and 03-CONTEXT D-04 explicitly deferred these three fields here. |

## Standard Stack

Phase 4 adds **no external dependency**. Every capability it needs is already in the repository or in the pinned transitive tree.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@homebridge/hap-nodejs` | `2.2.2` (transitive via `homebridge@2.4.0`) | `Switch`, `On`, `StatusActive`, `HAPStatus`, `HapStatusError` | Reached only through `api.hap` at runtime, per CLAUDE.md. `[VERIFIED: node_modules/@homebridge/hap-nodejs/package.json line 3 — `"version": "2.2.2"`]` |
| `homebridge` | `^2.4.0` (devDependency; resolved `2.4.0`) | `API`, `PlatformAccessory`, `Service`, `CharacteristicValue` types | Already the only source of HAP types in `src/`. |
| `@cucumber/cucumber` | `^13.2.1` | The fake-pump feature suite this phase extends | Already the harness. |
| `node:test` | Node 22/24 built-in | Unit tests under `test/` | Repository already uses it exclusively. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `aedes` | `^1.1.1` | In-process MQTT broker behind `fakeShadowBroker.ts` | Only if the phase adds a shadow leaf. See the open question below — it probably should not. |
| `strong-mock` | `^9.2.2` | Already a devDependency | Not needed; every existing test uses hand-written stand-ins, and the phase should follow that. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| A hand-extended `fakeHap.ts` `Switch` | Importing the real `@homebridge/hap-nodejs` into the Cucumber harness | The real HAP would eliminate all fidelity risk on the write path, but it changes what the harness is (a stand-in, deliberately) and it makes the harness depend on a transitive package. Recommended compromise below: keep the fake, and add one **unit** test that runs the same write cases against the real pinned HAP and asserts the fake agrees. |
| A `Timers.setTimeout(…, 0)` push to clear the sticky `statusCode` | Leaving `statusCode` sticky until the next poll | Leaving it means the Switch answers an error to every read for up to ~15 minutes after a refusal, which is precisely what `03-CONTEXT.md` D-05 forbids. |
| A `Timers`-armed 30-second pending window | Lazy expiry evaluated on the next `update()` | Lazy expiry means an unconfirmed toggle can sit "on" for a whole poll interval, which fails D-06's "returns to what the device actually says". |

**Installation:**

```bash
# none — Phase 4 adds no package
```

## Package Legitimacy Audit

Phase 4 installs no external package. The two packages the phase newly *reaches into* are already present and already locked.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@homebridge/hap-nodejs` | npm | last publish 2026-08-22 | 21,770/wk | github.com/homebridge/HAP-NodeJS | `SUS` (`too-new`) | Approved — already a locked transitive dependency of `homebridge`; the `too-new` signal reads the *last publish* date, not the package's age. No `postinstall`. |
| `homebridge` | npm | last publish 2026-08-16 | 26,287/wk | github.com/homebridge/homebridge | `SUS` (`too-new`) | Approved — already a devDependency at `^2.4.0`. No `postinstall`. |

**Packages removed due to `SLOP` verdict:** none
**Packages flagged as suspicious `SUS`:** both, on a `too-new` signal that reflects recent releases rather than a new package. No new install happens, so no `checkpoint:human-verify` is needed. `[VERIFIED: gsd-tools query package-legitimacy check, run this session]`

## Architecture Patterns

### System Architecture Diagram

```
                          Apple Home / Eve  (HAP controller)
                                    |
                       write On=true|            read On, StatusActive
                                    v                     ^
              +---------------------------------------------------------+
              |  HAP  Characteristic.handleSetRequest / handleGetRequest |
              +---------------------------------------------------------+
                     |                                          ^
             onSet   |                          publishValue()  |
                     v                                          |
     +--------------------------------------------------------------------+
     |  src/accessories/controls.ts   (NEW - the D-01 binder)             |
     |                                                                     |
     |  1. read reported state + pending set                               |
     |  2. LOCAL REFUSAL?  (offline | test running | already muted | dup)   |
     |         yes -> throw HapStatusError(...)                            |
     |                 + arm Timers.setTimeout(pushReported, 0)            |
     |  3. mark pending, arm Timers.setTimeout(expire, 30_000)             |
     |  4. await commandPort.send(capability, true)                        |
     |         reject / success:false / timeout                            |
     |             -> clear pending, throw status, arm push-back           |
     |         accepted -> return (HAP keeps the requested value)          |
     +--------------------------------------------------------------------+
                     |                                          ^
    CommandPort.send |                                          | pending set
                     v                                          |
     +--------------------------------+        +-------------------------------+
     |  AccountRuntime.sendCommand    |        | basementGuardian.update()      |
     |  - family.command(cap, true)   |        |  -> pumpRecords.observe()      |
     |  - CloudApi.sendCommand()      |        |  -> ProjectionInput            |
     |  - root AbortSignal            |        |  -> catalogue rows project()   |
     +--------------------------------+        |  -> publishValue() x N         |
                     |                          +-------------------------------+
        PUT /devices/{id}/data                       |             |
        { desiredData: {...} }                       |             | persist on change
        deadline 2500 ms                             |             v
                     v                               |    +------------------+
          +---------------------+                    |    | AccessoryStore   |
          |  Vendor REST cloud  |                    |    | (D-08 port) ->   |
          +---------------------+                    |    | api.updatePlat.. |
                     |                               |    +------------------+
             device acts                             |
                     v                               |
          +---------------------+   shadow update/accepted
          |  AWS IoT shadow     | ------------------->+
          +---------------------+   test_running=true  (reconciles the pending row)
```

The two paths never cross except through `ProjectionInput`. The command path writes no safety state; the projection path writes no command state. That separation is what makes D-037's "never copy requested control state into safety data" structurally true rather than a rule someone has to remember.

### Recommended Project Structure

```
src/accessories/
├── basementGuardian.ts    # gains: records call in update(), pending read, binder call in publishRows()
├── controls.ts            # NEW - the D-01 binder: onSet, local refusals, pending, expiry
├── pumpRecords.ts         # NEW - D-08: epoch, count, watermarks, classification
├── serviceCatalogue.ts    # gains: two control rows, three record characteristics, alwaysPublish flag
├── customCharacteristics.ts  # gains: three read-only record characteristics
├── customServices.ts      # gains: three optional characteristics on PumpService (no new service)
└── services.ts            # unchanged - both kinds already declared

src/runtime/
└── accessoryStore.ts      # NEW - the one-method D-08 persist port

features/support/
├── fakeHap.ts             # gains: Switch, On, onSet, HAPStatus, HapStatusError, write simulation
├── fakeRestApi.ts         # gains: command-scoped arming (accept / reject / hold / device reaction)
└── steps/controls.ts      # NEW - the five CTRL-05 outcome steps
```

### Pattern 1: HAP retains an accepted write, and never stores a rejected one

**What:** `handleSetRequest` captures `oldValue` before the handler, assigns `this.value = value` only on the success path, and on any throw records a status and rethrows without touching `this.value`.

**When to use:** This is the mechanism D-05 rests on. Nothing needs to be added to make an accepted-but-unconfirmed toggle stay on: the row projecting nothing for `On` is sufficient.

**Source:** `node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:1799-1833` `[VERIFIED: read this session]`. Verbatim:

```javascript
const oldValue = this.value;                                   // line 1799
if (this.setHandler) {
    try {
        const writeResponse = await this.setHandler(value, context, connection);   // 1805
        this.statusCode = 0 /* HAPStatus.SUCCESS */;                               // 1806
        ...
            this.value = value;                                                    // 1815
            this.emit("change", { originator: connection, oldValue, newValue: value, reason: "write", context });
            return;
    }
    catch (error) {
        if (typeof error === "number") { ... }
        else if (error instanceof hapStatusError_1.HapStatusError) {
            this.statusCode = error.hapStatus;                                     // 1826
        }
        else { ... this.statusCode = -70402 ... }
        throw this.statusCode;                                                     // 1832
    }
```

Probed and confirmed by running it `[VERIFIED: node probe against node_modules/@homebridge/hap-nodejs, run this session]`:

```
after accepted set, stored value = true  statusCode = 0   changes = [{"old":false,"new":true,"reason":"write"}]
after rejected set, stored value = false thrown = -70412  statusCode = -70412  changes = []  warns = []
```

**Consequences the plan must encode:**

- No `updateCharacteristic` is required to "snap back" after a rejection. HAP never moved the value.
- **No `change` event is emitted on rejection**, so subscribed controllers receive no notification. Apple Home reverts its own optimistic toggle from the write error; other controllers may not. A push (below) covers both.
- A plain `Error` (not a `HapStatusError`, not a number) is converted to `-70402` **and** emits a `characteristicWarning`: `"Unhandled error thrown inside write handler for characteristic: boom"`. The binder must therefore throw only `HapStatusError`, never a bare `Error`.

### Pattern 2: A rejected write leaves a sticky status that fails every later read

**What:** `handleGetRequest`, on a characteristic with no `onGet` and no `get` listener — which is exactly this plugin's every characteristic — checks the stored status first and throws it.

**Source:** `Characteristic.js:1727-1731` `[VERIFIED: read this session]`. Verbatim:

```javascript
if (this.listeners("get").length === 0) {
    if (this.statusCode) {
        throw this.statusCode;
    }
```

Probed `[VERIFIED: node probe, run this session]`:

```
set threw -70403
read after reject: threw -70403
statusCode -70403 value false
statusCode after updateCharacteristic(same value): 0
read after push: ok false
On.statusCode after pushing only StatusActive: -70408 -> read threw -70408
after later accepted set: statusCode 0 value true
```

**Why this matters more than anything else in the phase.** `03-CONTEXT.md` D-05 records: *"`HapStatusError` is forbidden: HAP-NodeJS reserves it for a permanent condition requiring user action, and it produces Apple Home's 'No Response', which erases the retained values `D-014` requires the accessory to keep."* `04-CONTEXT.md` D-04 requires throwing `HapStatusError` from `onSet`. Those two are reconcilable, but only if the sticky status is cleared promptly.

Three facts bound the risk, all probed:

1. The stickiness is **per characteristic**. Pushing `StatusActive` on the same `Switch` did **not** clear `On.statusCode`. Nothing on the other fourteen services is touched.
2. `service.updateCharacteristic(On, <same value>)` clears it to `0` — `updateValue` assigns `this.statusCode = 0` unconditionally before storing (`Characteristic.js:1650`).
3. A later successful `handleSetRequest` also clears it (`Characteristic.js:1787`).

**What is NOT verified:** whether Apple Home degrades the **whole accessory** to "No Response" when one characteristic in a multi-read answers an error status. `Accessory.handleSetCharacteristics` returns the status per characteristic (`Accessory.js:1328-1338`), so HAP itself is per-characteristic; the controller's rendering is not something HAP source can settle. `[ASSUMED]` — this belongs in the same real-home verification session as D-03.

**Prescribed mitigation:** after every rejection, push the reported `On` value back through `publishValue`, scheduled with `Timers.setTimeout(fn, 0)`. It must be a macrotask, not a microtask: a `queueMicrotask` queued inside the handler before the throw runs *before* `handleSetRequest`'s catch assigns `statusCode`, so it would clear a status that has not been set yet and leave the sticky value standing.

### Pattern 3: `addOptionalCharacteristic` is generic, so `StatusActive` on a `Switch` is the same mechanism as `ConfiguredName` on a `ContactSensor`

**What:** `Service.addOptionalCharacteristic` pushes onto `optionalCharacteristics` with no validation and no per-service allow-list (`Service.js:526-533`). `getCharacteristic` finds a class in `optionalCharacteristics` and adds it silently; a class in neither list is still added but emits a warning (`Service.js:472-500`).

**Source:** `[VERIFIED: node_modules/@homebridge/hap-nodejs/dist/lib/Service.js:472-533, read this session]`. Verbatim from `Service.js:494-497`:

```javascript
const instance = this.addCharacteristic(name);
// Not found in optional Characteristics. Adding anyway, but warning about it if it isn't the Name.
if (name.UUID !== Characteristic_1.Characteristic.Name.UUID) {
    this.emitCharacteristicWarningEvent(instance, "warn-message", "Characteristic not in required or optional characteristic section for service " + this.constructor.name + ". Adding anyway.");
```

And `Switch`'s definition, verbatim (`ServiceDefinitions.js:1045-1053`):

```javascript
class Switch extends Service_1.Service {
    static UUID = "00000049-0000-1000-8000-0026BB765291";
    constructor(displayName, subtype) {
        super(displayName, Switch.UUID, subtype);
        // Required Characteristics
        this.addCharacteristic(Characteristic_1.Characteristic.On);
        // Optional Characteristics
        this.addOptionalCharacteristic(Characteristic_1.Characteristic.Name);
    }
}
```

Probed `[VERIFIED: node probe, run this session]`:

```
switch chars: [ 'Name', 'On' ]
switch optional: [ 'Name' ]
after declare+update; chars: [ 'Name=Self Test', 'On=false', 'Status Active=false' ]
warnings: []
undeclared warnings: [... "Characteristic not in required or optional characteristic section for service Switch. Adding anyway." ...]
```

**Answering the research question honestly:** the mechanism is **identical** to `ConfiguredName` on `ContactSensor`. It is not analogous — it is the same two lines of HAP code, with no branch on service class or characteristic class anywhere in the path. `declareCharacteristic` in `serviceCatalogue.ts:743-747` already implements exactly the guard needed. **HAP neither warns nor rejects.** What remains unverified is only what Apple Home *draws*, which is D-03's stated human-verification item and is unchanged by this finding.

`StatusActive`'s HAP default is already `false` (`format: "bool"`, `getDefaultValue()` → `false`, `CharacteristicDefinitions.js:3318-3327`), so D-03's "carry `StatusActive = false` until their reported field decodes" costs no special handling — but the value must still be *pushed*, because `fakeHap.ts` tracks a `pushed` flag and the harness step helper `pushedValue()` treats an unpushed characteristic as absent (`features/support/steps/homekit.ts:63-65`).

### Pattern 4: `api.hap` carries the status vocabulary

`[VERIFIED: node probe against node_modules/@homebridge/hap-nodejs index, run this session]`:

```
HAPStatus present: object -70408 -70412 -70403 -70402
HapStatusError present: function
```

That is `OPERATION_TIMED_OUT`, `NOT_ALLOWED_IN_CURRENT_STATE`, `RESOURCE_BUSY`, `SERVICE_COMMUNICATION_FAILURE` — every status D-04's table names, resolving from the package index. Homebridge's `API['hap']` is declared as `typeof hapNodeJs`, so the index's exports are exactly the `api.hap` surface.

**Caveat, stated honestly.** I verified the *package index* exports these, and that `API['hap']` is typed as `typeof import('hap-nodejs')`. I did **not** boot a Homebridge process and read `api.hap.HAPStatus` off a live `API` object, because that would require starting the bridge. The remaining gap is whether Homebridge's runtime `api.hap` object is the module namespace itself rather than a curated subset. `04-CONTEXT.md` D-04 records that the orchestrator already verified `HAPStatus.OPERATION_TIMED_OUT` resolves to `-70408` at runtime; treat the `api.hap` route as `[VERIFIED via the package index + the declared type]` and, if the planner wants belt and braces, add one Cucumber assertion that reads `hap.HAPStatus.OPERATION_TIMED_OUT` off whatever the harness supplies.

### Pattern 5: A pending row withholds `On` through `ProjectionInput`

D-05 is expressible with no new publish path. Add a member to `ProjectionInput` — a `ReadonlySet<DeviceCapability>` is the cleanest of the three shapes D-16's discretion list allows, because `DeviceCapability` is already `'self-test' | 'alarm-mute'` (`family.ts:18`) and the set is naturally small and order-free:

```typescript
export interface ProjectionInput {
  // ... existing members
  /** Capabilities with an unresolved HomeKit request; their rows withhold `On` (D-05, D-037). */
  pendingControls: ReadonlySet<DeviceCapability>;
}
```

The control row's `values` function then reads:

```typescript
function controlValues(hap: API['hap'], input: ProjectionInput, trust: RowTrust, scope: TrustScope, field: string, capability: DeviceCapability): readonly ProjectedValue[] {
  const reported = booleanOf(trustedGroup(input, trust, scope), field);

  return published([{ characteristic: hap.Characteristic.On, value: input.pendingControls.has(capability) ? undefined : reported }]);
}
```

`published()` (`serviceCatalogue.ts:206-218`) already drops `undefined`, so a pending control publishes nothing for `On` and the `StatusActive` push in `publishRows` still happens. That is the whole of D-05.

### Pattern 6: The control rows need an `ensureService` exemption

`ensureService` refuses to add a service when `projected.length === 0` (`serviceCatalogue.ts:705-714`). A control row whose field has never decoded projects nothing, so without an exemption D-03's "both Switches publish unconditionally" cannot happen. Add one flag to `ServiceRow`:

```typescript
/**
 * Publish this row's service even when the row projects nothing.
 *
 * The gate exists because HAP's format defaults are this plugin's good-news
 * values. It is waived for the two control Switches alone: `On = false` reads
 * as "not running" and "not muted", which is what the device reports in the
 * overwhelmingly common case, and `constraints.md:387` records that a room
 * holding only sensors does not render in Apple Home at all -- the Self-Test
 * Switch is what makes the accessory's room visible (D-03).
 */
alwaysPublish: boolean;
```

`ensureService`'s final line becomes `return projected.length === 0 && !row.alwaysPublish ? undefined : accessory.addService(...)`. **This weakens the invariant `ensureService`'s docblock states**, so the docblock must be revised to name the exemption and its justification rather than left claiming a rule that now has two exceptions.

### Pattern 7: The record characteristics go on the existing `PumpService`, as optional

`customServices.ts`'s own docblock already resolved this discretion item `[VERIFIED: src/accessories/customServices.ts:24-29, read this session]`. Verbatim:

```
 * The same rule is what lets a later release add the pump observation-epoch,
 * observed-count, and last-activation characteristics to an already-published
 * `PumpService` without changing its subtype: the accessory's
 * characteristic-repair guard declares an undeclared characteristic before
 * pushing it, which suppresses the warning HAP otherwise emits, and the subtype
 * -- the one string that must never change -- is untouched.
```

They must be **optional**, never required. `ensureService`'s docblock states the precondition: *"Gating on the projection length is sound only while every required characteristic of a row's service class comes from a scope that row is still publishing from."* The record values come from the accessory's own observation, not from the `pump` scope, so a required record characteristic would be constructed at a format default the moment the row published its pump boolean — a count of 0 and an epoch of `""` presented as fact.

### Anti-Patterns to Avoid

- **Throwing a bare `Error` from `onSet`.** HAP converts it to `-70402` *and* emits a `characteristicWarning` naming the message. Throw only `new hap.HapStatusError(hap.HAPStatus.X)`.
- **Clearing the sticky status with `queueMicrotask`.** It runs before HAP's catch assigns `statusCode`. Use the injected `Timers` at delay 0.
- **Importing `node:timers` anywhere under `src/accessories/`.** `test/accessories/timerFreedom.test.ts` reads the directory's source text and fails on `from 'node:timers'`, `import 'node:timers'`, and `import('node:timers')`, in both quote styles. The injected `Timers` port is the only route.
- **Putting record logic in `src/accessories/reconciliation.ts`.** Despite the name, that module is DEV-05 device-*removal* reconciliation over inventory responses (`reconciliation.ts:1-15`). `constraints.md:513`'s "if reconciliation finds a newer `backup_pump_timestamp`" means the REST poll backstop, not this module.
- **Storing a device Unix-seconds timestamp into `PumpObservation.lastActivationAt`.** See Pitfall 2.
- **Adding a writable custom characteristic.** `customCharacteristics.ts`'s `readOnlyPerms()` is deliberately the single source of permissions so "no declaration can grant a write permission by omission (SAFE-08)". The two writable controls use HAP's own `On`. Do not touch that helper.
- **Publishing on `update/rejected` and calling it a test.** See Open Question 1.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reverting the toggle after a rejected write | An explicit "restore previous value" push before the throw | Nothing — HAP never assigns on rejection (`Characteristic.js:1815` is inside the success path) | A pre-throw push would clear `statusCode`, which HAP then re-sets, leaving you exactly where you started plus a spurious `change` event. |
| The 2.5-second vendor deadline | A `Promise.race` around `sendCommand` | `CloudApi.sendCommand`, which already applies `COMMAND_DEADLINE_MS = 2_500` via `AbortSignal.any([signal, AbortSignal.timeout(2500)])` (`api.ts:14`, `api.ts:127`) | Already built, already covers the token fetch, already performs exactly one attempt with no retry per D-038. |
| The two command bodies | A new payload builder | `geminiFamily.command(capability, requested)` (`gemini.ts:373-378`) | Already answers both measured wire shapes and is currently uncalled outside tests. |
| Declaring a characteristic before pushing it | A per-service allow-list, or a `try`/`catch` around the push | `declareCharacteristic` in `serviceCatalogue.ts:743-747` | Already handles the non-idempotency of `addOptionalCharacteristic` and the cache-restored-service case, and is proven on real hardware (commit `39560ac`). |
| Naming the two Switches for controllers | A second list of display names | `seedConfiguredName(hap, service, row.displayName)` in the existing `publishRows` loop | Already runs for every row; the control rows get it free. |
| Deciding a snapshot's scopes are untrustworthy | A control-specific validity check | `TELEMETRY_CHECKS` + the existing `untrustedScopesOf` / `trustedGroup` chain | The field-to-scope map is the one mechanism; adding a parallel one would let the two disagree. |
| Timing out a fake HTTP request in Cucumber | A new delay-response API on the loopback server | `fakeRestApi.holdNextRequest()` (`fakeRestApi.ts:62-66`) | Already records a request and never answers it, which is what `AbortSignal.timeout(2500)` needs. Only the *scoping* to the command route needs adding. |
| Rejecting a command in Cucumber | A shadow `update/rejected` publish | `fakeRestApi.failNextWith(status)` or a `{ success: false }` body | Both are what the plugin actually observes. The plugin never publishes a shadow update, so the real service never rejects one of its updates, and it does not subscribe to the leaf anyway (see Open Question 1). |

**Key insight:** almost everything Phase 4 needs was built in Phases 1–3 and deliberately left uncalled. `sendCommand`, `geminiFamily.command`, `PumpObservation`, `ActivationWatermarks`, `publishedService`, `declareCharacteristic`, `Timers`, `holdNextRequest`, and `CoreServiceKind`'s two control slugs are all present and all unconsumed by production code. The phase is mostly wiring, plus one genuinely new module pair (`controls.ts`, `pumpRecords.ts`) and one substantial harness extension.

## Runtime State Inventory

Phase 4 is not a rename or migration phase, but it *introduces* durable per-accessory state for the first time, so the same discipline applies in reverse: what will exist at runtime that a code change alone cannot restate?

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `accessory.context.primaryPump`, `.backupPump`, `.watermarks` — typed in `src/persistence/accessoryContext.ts` and **written by nothing today**. Phase 4 is the first writer. Existing installations have `context.device` and `context.lastVendorName` only. | Code must treat all three as absent-on-first-run and seed a fresh epoch. `BasementGuardianAccessoryContext` in `platform.ts:34-38` declares its members optional for exactly this reason; the three new members must be optional too. |
| Live service config | None. The vendor cloud holds no plugin-owned configuration. | none |
| OS-registered state | None. The plugin registers no OS-level artifact. | none |
| Secrets/env vars | None new. The command path reuses the existing bearer token through `CloudApi`. | none |
| Build artifacts | `dist/` and `dist-test/` are rebuilt by `npm run build` / `build:test`. `.continue-here.md` warns that any commit touching `src/` erases a `dist/` UAT scaffold, because `pre-commit` runs `npm fallow` whose `prefallow` runs `rimraf ./dist`. | Expect it during any real-home session; re-inject the scaffold. Not phase code work. |

**The migration question D-13 raises.** D-13 adds "one optional context field" for the last-activation classification. Because every record member is new in this phase, the only migration path that exists is absent → seeded. There is no v1 record shape to migrate from, which is what makes D-13's "migrates cleanly" true. Say so in the record module's docblock so a later phase does not have to re-derive it.

## Common Pitfalls

### Pitfall 1: The sticky `statusCode` leaves the Switch unreadable

**What goes wrong:** a user presses Self-Test while a test is running. The binder throws `NOT_ALLOWED_IN_CURRENT_STATE`. Apple Home shows a failure — correct. Then every subsequent read of that `On` characteristic throws `-70412` until the next poll pushes a value, up to ~15 minutes later.
**Why it happens:** `Characteristic.handleSetRequest` sets `this.statusCode` from the thrown `HapStatusError` and `handleGetRequest` throws a non-zero stored status before it ever looks at the value (`Characteristic.js:1826`, `Characteristic.js:1729`).
**How to avoid:** push the reported `On` value through `publishValue` from a `Timers.setTimeout(fn, 0)` armed immediately before the throw. Verified: `service.updateCharacteristic(On, <even the same value>)` resets `statusCode` to `0`.
**Warning signs:** in a real Apple Home, the Switch tile going grey or the accessory reading "No Response" after a refused press; in a test, `characteristic.statusCode !== 0` after the push settles.

### Pitfall 2: `backup_pump_timestamp` is Unix **seconds**; `lastActivationAt` is local milliseconds

**What goes wrong:** D-11 says a recovered activation stores the device's timestamp. `PumpObservation.lastActivationAt` is documented as *"Local time of the last observed activation"* `[VERIFIED: src/persistence/accessoryContext.ts:31-32]` and `basementGuardian.ts:isoTimestamp` renders a stored value with `new Date(at).toISOString()` (`basementGuardian.ts:288-290`), which expects milliseconds. Storing `1_699_999_000` renders `1970-01-20T...`.
**Why it happens:** the vendor field is Unix seconds `[VERIFIED: .planning/intel/constraints.md:231 — `| \`backup_pump_timestamp\` | Unix seconds. |` and line 241 — `| \`test_timestamp\` | Unix seconds. |`], and `decodePump` carries it through unconverted as `backupActivatedAt` (`gemini.ts:263`).
**How to avoid:** decide the unit **once**, in the record module, and state it in the type's docblock. Multiplying by 1000 is not the arithmetic `constraints.md:503` forbids — that rule is about *comparing* a device timestamp against local time, and a unit conversion compares nothing. Recommended: convert to milliseconds at the record boundary and widen `lastActivationAt`'s docblock from "Local time" to "The moment of the last observed activation, in milliseconds; a live edge carries the plugin's own receipt time and a recovered activation carries the device's own timestamp (D-11)."
**Warning signs:** a `Last Activation` characteristic reading a 1970 date, or a watermark comparison that never advances because two units are being compared.

### Pitfall 3: Adding two `TrustScope` members is a typecheck cascade

**What goes wrong:** `TrustScope` is consumed by `ScopedDomainState` (one member per scope, all non-optional by design), the field-to-scope map, `TRUST_SCOPES` in `basementGuardian.ts:143`, and every catalogue row's trust gate.
**Why it happens:** `family.ts` states the invariant deliberately: *"Every member is `| undefined` rather than optional, so a family that forgets a scope fails to typecheck instead of silently omitting one."* Adding `'self-test'` and `'alarm-mute'` to `TrustScope` therefore *requires* two new `ScopedDomainState` members with quoted hyphenated keys, two new decoders in `gemini.ts`, and two new entries in `TRUST_SCOPES`.
**How to avoid:** plan it as one task, not several. `NON_CONNECTIVITY_SCOPES` derives from `TRUST_SCOPES` by filter (`basementGuardian.ts:154`), so a lost controller link and an unresolved family will automatically deactivate both Switches — which is correct, since both fields come through the controller. `halo.ts` is declaration-only and implements no family, so it adds no burden.
**Warning signs:** a decoder that returns a group for a scope its own fields did not validate; `TRUST_SCOPES` and `TrustScope` drifting out of sync (nothing enforces the list is exhaustive — consider a test that asserts it).

### Pitfall 4: The fake HAP has no write path at all, so a green Cucumber suite proves nothing about D-04 or D-05

**What goes wrong:** the phase extends `fakeHap.ts` with `Switch`, `On`, and an `onSet`, writes five scenarios, watches them pass, and ships a write path that behaves differently in real HAP.
**Why it happens:** `FakeHapCharacteristic` (`features/support/fakeHap.ts:117-132`) declares `displayName`, `UUID`, `props`, `value`, `pushed`, `getDefaultValue()` and nothing else. There is no `statusCode`, no `handleSetRequest`, no `Switch` in `FakeServiceNamespace`, and no `On` in `FakeCharacteristicNamespace`. Every semantic the phase depends on would be one the phase itself authored. `.continue-here.md`: *"a green suite is not evidence"*, and `04-CONTEXT.md` D-15: *"A fake we author answers our own design."*
**How to avoid:** add one **unit** test (not Cucumber) under `test/accessories/` that imports the real `@homebridge/hap-nodejs` — which resolves as a bare specifier from the repository root `[VERIFIED: require.resolve('@homebridge/hap-nodejs') → node_modules/@homebridge/hap-nodejs/dist/index.js, run this session]` — constructs a real `Switch`, and runs the same four write cases (accept, `HapStatusError` reject, plain-`Error` reject, read-after-reject) against both the real HAP and the fake, asserting they agree on stored value and status. That test is the only thing that keeps the fake honest. Note this makes a *test* depend on a transitive package; that is a deliberate, documented exception to "never import HAP-NodeJS directly", which is a **runtime** rule in CLAUDE.md and in `customCharacteristics.ts:21-25`.
**Warning signs:** a fake whose rejected set clears the value, or whose read after a rejection succeeds. Both would pass the phase's own scenarios and both are wrong.

### Pitfall 5: The 30-second pending window needs a controllable clock in Cucumber, and the harness has half of one

**What goes wrong:** a scenario waits 30 real seconds, or the expiry is never tested.
**Why it happens:** the World *is* the `Clock` — `clock: this` with `now()` returning `scenarioTime` and `advanceClock(ms)` moving it (`features/support/world.ts:213-221`, `world.ts:509`). But `DiscoveryContext.timers` is `systemTimers` in both `platform.ts:429` and `world.ts:554`, so an accessory-armed timer would be a real process timer.
**How to avoid:** add a controllable `Timers` implementation in `features/support/`, driven from `advanceClock`, and wire it into `World.discoveryContext()` in place of `systemTimers`. This is safe today precisely because the accessory currently calls the port zero times, so nothing else changes behaviour. The World's `advanceClock` should fire any handler whose deadline has passed.
**Warning signs:** a scenario that sleeps; a Cucumber step timeout at 15 s (`homekit.ts:28`) firing on the expiry scenario.

### Pitfall 6: `holdNextRequest()` holds the *next* request, which may be a poll

**What goes wrong:** the timeout scenario arms `holdNextRequest()`, the 15-minute poll fires first, the poll is held instead of the command, and the scenario times out on the wrong thing.
**Why it happens:** `route()` checks `state.holdNext` before it inspects the method or the path (`fakeRestApi.ts:170-175`).
**How to avoid:** add command-scoped arming — `holdNextCommand()`, `rejectNextCommand(status)`, `answerNextCommandWith(body)` — evaluated inside the `PUT … /data` branch at `fakeRestApi.ts:154-157` rather than in the generic pre-route gate. Leave the existing generic primitives untouched; other scenarios depend on them.
**Warning signs:** a flaky timeout scenario; `fakeRestApi.requests` showing a held `GET /devices` where the scenario expected a `PUT`.

### Pitfall 7: `isCommandResult` accepts `{ success: false }`

**What goes wrong:** the binder treats an HTTP 200 with `{"success": false}` as acceptance.
**Why it happens:** `isCommandResult(value)` returns `isRecord(value) && typeof value.success === 'boolean'` (`src/cloud/types.ts:177-179`), so a `false` body resolves the promise rather than rejecting it.
**How to avoid:** D-04's "Vendor answered an error → `SERVICE_COMMUNICATION_FAILURE`" must cover *both* a rejected promise (`CloudRequestError` from a non-2xx, or an unreadable body) *and* a resolved `{ success: false }`. That is two branches, and the coverage gate needs a test for each.
**Warning signs:** a scenario that arms `{ success: false }` and sees the toggle stay on.

### Pitfall 8: `ROUTES.command` already sits in the route-coverage assertion

`test/cloud/api.test.ts:650` asserts `Object.keys(cloudApi).sort()` equals `['awsCredentials','device','devices','sendCommand']`, and the route set is asserted elsewhere. Adding a header to `requestInit` (`api.ts:112-117`) for the folded header-policy todo touches the shared helper both reads and commands use. `requestInit` branches on `body === undefined`, so a header added to the body branch alone reaches the command only — which is what the folded todo scopes it to. Adding it to both branches would silently change every read request's wire shape and should be a deliberate decision, not a side effect.

## Code Examples

### The narrow command port

Follow the `Timers` / `Clock` shape: an interface in `src/runtime/`, a systemic implementation wired at the composition root, and a stand-in in tests. The accessory tier must never import `src/cloud/`.

```typescript
// src/runtime/commandPort.ts  (NEW)

/** Why a command did not take effect, in the vocabulary the HomeKit tier maps to a HAP status. */
export type CommandFailure = 'vendor-error' | 'timed-out';

/** The one thing a HomeKit control may ask the cloud to do (D-004, CTRL-05). */
export interface CommandPort {
  /**
   * Requests one capability change and resolves with whether the vendor accepted it.
   *
   * Exactly one attempt is made. A command that timed out may already have
   * reached the device, so nothing here retries (D-038).
   */
  send(deviceId: string, capability: DeviceCapability, requested: boolean): Promise<CommandOutcome>;
}

export type CommandOutcome = { accepted: true } | { accepted: false; failure: CommandFailure };
```

The implementation belongs on `AccountRuntime`, because it is the only object holding both the `CloudApi` instance and the root `AbortController` a shutdown cancels through (`accountRuntime.ts:198-201`). Add one member to the `AccountRuntime` interface (`accountRuntime.ts:119-130`) beside `store`:

```typescript
/** The command surface a HomeKit control reaches the vendor through (CTRL-05). */
readonly commands: CommandPort;
```

and wire it into `DiscoveryContext` alongside `timers`, in both `platform.ts:413-450` and `features/support/world.ts:537-556`.

**Why not inject `CloudApi` directly:** `CloudApi.sendCommand` takes a `DeviceCommand` (the already-built `desiredData`), so the caller would need the family adapter too, which drags family knowledge into the accessory tier. Putting `family.command(capability, requested)` behind the port keeps `basementGuardian.ts`'s docblock claim — *"The accessory owns HomeKit and nothing else"* — true.

**About `test/runtime/accountRuntime.test.ts:306.** Verbatim today:

```typescript
sendCommand: () => Promise.reject(new Error('the runtime must not reach the command route')),
```

`[VERIFIED: test/runtime/accountRuntime.test.ts:306, read this session]`

This is a per-test `CloudApi` stand-in, and it stays truthful for every existing case: the *monitoring* path — polling, shadow, credential rotation, removal — still must never reach the command route, and that is a real safety property worth keeping. Do **not** relax it globally. Add a recording variant used only by the new `runtime.commands.send(...)` cases, and change the message on the shared one to name what it now asserts: `'the monitoring path must not reach the command route'`. That keeps a deliberate assertion deliberate rather than letting a new feature quietly delete it.

### The persist port

```typescript
// src/runtime/accessoryStore.ts  (NEW)

/**
 * Persists an accessory's context to the Homebridge cache.
 *
 * A mutation of `accessory.context` is invisible on disk until Homebridge is
 * told about it, so the record module writes through this rather than reaching
 * for `api`. The accessory's injected options carry no `api` today and must not
 * gain one (D-08).
 */
export interface AccessoryStore {
  /** Records that this accessory's context changed and should be written. */
  persist(): void;
}
```

Wired in `platform.ts` at the `createBasementGuardianAccessoryFor` call site (`platform.ts:105-116`), where the `PlatformAccessory` is in scope:

```typescript
store: { persist: () => { context.api.updatePlatformAccessories([accessory]); } },
```

Note the pre-existing call at `platform.ts:230` is inside `updateDiscoveredDevice`'s change-detection `finally` block. The record path's persist is a *second*, independent caller, which is fine — `updatePlatformAccessories` is idempotent — but D-10's "persist on change only" is what stops it becoming a per-poll write.

### The control binder skeleton

```typescript
// src/accessories/controls.ts  (NEW)

// Every refusal answers the status that describes it, so a log line and an
// Eve-class controller read true; Apple Home shows a generic failure for all of
// them (D-04).
function refuse(hap: API['hap'], status: number): never {
  throw new hap.HapStatusError(status);
}

function bindControl(options: ControlBinding): void {
  const { hap, service, capability, log, timers } = options;
  const characteristic = service.getCharacteristic(hap.Characteristic.On);

  characteristic.onSet(async (value) => {
    // The push-back is armed before every throw below. HAP records the thrown
    // status on the characteristic and answers it to every later read until a
    // value is pushed, which is Apple Home's No Response state on the one
    // characteristic (verified against @homebridge/hap-nodejs 2.2.2).
    // A macrotask, not a microtask: a microtask queued here runs before HAP's
    // own catch assigns the status, so it would clear nothing.
    const restore = () => { timers.setTimeout(() => { options.pushReported(); }, 0); };

    if (value !== true) {
      restore();
      refuse(hap, hap.HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE);   // no cancel, no unmute (D-018, D-019)
    }

    if (options.offlineConfirmed()) {
      restore();
      refuse(hap, hap.HAPStatus.NOT_ALLOWED_IN_CURRENT_STATE);   // D-007's third rule, D-031
    }

    if (options.reportedActive() === true) {
      restore();
      refuse(hap, hap.HAPStatus.RESOURCE_BUSY);                  // duplicate (CTRL-03, D-007)
    }

    options.markPending(capability);                             // row withholds `On` from here (D-05)

    const outcome = await options.commands.send(capability, true);

    if (!outcome.accepted) {
      options.clearPending(capability);
      restore();
      refuse(hap, outcome.failure === 'timed-out' ? hap.HAPStatus.OPERATION_TIMED_OUT : hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }

    // Accepted. Nothing is pushed: HAP keeps serving the value this write left,
    // and the pending row withholds `On` until the device confirms or the
    // 30-second window closes (D-05, D-06, constraints.md:537).
  });
}
```

The 30-second expiry timer is armed at `markPending` and cleared when a reported value confirms the request; on fire it clears the pending entry, republishes, and logs one warning naming the capability and that the device never confirmed (D-06). It never retries (D-038).

### Extending the field-to-scope map

```typescript
// src/device/health.ts
export type TrustScope = 'connectivity' | 'water' | 'pump' | 'power' | 'battery' | 'fault' | 'self-test' | 'alarm-mute';
```

`[VERIFIED: src/device/health.ts:27 currently reads `export type TrustScope = 'connectivity' | 'water' | 'pump' | 'power' | 'battery' | 'fault';`]`

```typescript
// src/device/gemini.ts TELEMETRY_CHECKS - the three rows 03-CONTEXT D-04 deferred
{ scope: 'alarm-mute', check: requiredBoolean('alarm_audio_muted') },
{ scope: 'self-test',  check: requiredBoolean('test_running') },
{ scope: 'self-test',  check: optionalNumber('test_timestamp') },
```

Currently `[VERIFIED: src/device/gemini.ts:182-184]`, verbatim:

```typescript
  { scope: undefined, check: requiredBoolean('alarm_audio_muted') },
  { scope: undefined, check: requiredBoolean('test_running') },
  { scope: undefined, check: optionalNumber('test_timestamp') },
```

**On `test_timestamp`'s scope and validity check, answering the research question directly.** It already has a validity check — `optionalNumber` — which is the right one: it is optional on the wire (the device omits it before any test has ever run) and it is a number when present. What changes is only its *scope*. It belongs to `'self-test'`, not `'pump'`, for two reasons. First, D-13 uses it purely for classification, and classification labels a record — it never feeds the live `Backup Pump Activated` transition, which `pumpActivityValues` reads from `backupRunning` alone (`serviceCatalogue.ts:360-364`). Second, if `test_timestamp` owned the `pump` scope, a wrong-typed `test_timestamp` would deactivate both Pump services and both Contact Sensors — a live safety signal deactivated by a field that says nothing about whether a pump is running. That is exactly the over-broad scoping D-014 and D-02 forbid. Filing it under `'self-test'` means a bad `test_timestamp` deactivates the Self-Test Switch and abstains from classification, and nothing else.

**Consequence for D-13:** the record module must treat an absent-or-untrusted `test_timestamp` as "cannot classify" and leave the classification flag at its previous value, not at `false`. `false` would assert "the last activation was not a test", which is a claim the plugin did not earn.

### The three record characteristics

```typescript
// src/accessories/customCharacteristics.ts - three new define() calls, all read-only
ObservationStartedAt: define({
  displayName: 'Observation Start (Not a Lifetime Total)',
  uuid: OBSERVATION_STARTED_AT_UUID,
  format: 'string',
}),
ObservedActivationCount: define({
  displayName: 'Activations Observed Since Start',
  uuid: OBSERVED_ACTIVATION_COUNT_UUID,
  format: 'uint8',   // see note
}),
LastObservedActivationAt: define({
  displayName: 'Last Observed Activation',
  uuid: LAST_OBSERVED_ACTIVATION_AT_UUID,
  format: 'string',
}),
```

D-12's "the display names carry the claim themselves" is what these names encode. Exact wording is Claude's discretion, subject to that content requirement, and the README prose must follow the `simple-english` and `humanizer` skills as the rest of the README was written.

**Format warning on the count.** `define()` supports only `'bool' | 'uint8' | 'string'` (`customCharacteristics.ts:91`). `uint8` caps at 255. A sump pump in a wet basement can run several times an hour; 255 is reachable within weeks, and HAP **clamps** an out-of-range value rather than rejecting it — which `serviceCatalogue.ts`'s own header calls out as the reason every projection is a declared constant or a verbatim decoded value. A clamped count silently stops advancing and reads as a fact. The planner must either add `'uint32'` to the format table (a one-line addition; `hap.Formats.UINT32` exists) or publish the count as a string. **Recommendation: add `uint32`.** `[VERIFIED: src/accessories/customCharacteristics.ts:91 — `type CharacteristicFormat = 'bool' | 'uint8' | 'string';`]`

Both timestamp characteristics follow `ControllerDataLastTrustedAt`'s precedent exactly — `format: 'string'`, ISO-8601, empty string for none observed (`customCharacteristics.ts:171-175`, and `basementGuardian.ts:288-290`'s `isoTimestamp` helper, which the record module should reuse rather than reimplement).

Declare all three as `optional` on `PumpService` in `customServices.ts:133-137`:

```typescript
PumpService: define({
  uuid: PUMP_SERVICE_UUID,
  required: [characteristics.PumpRunning],
  optional: [
    characteristics.PumpFault,
    characteristics.PumpFuseBlown,
    characteristics.ObservationStartedAt,
    characteristics.ObservedActivationCount,
    characteristics.LastObservedActivationAt,
    characteristics.LastActivationWasTestActivity,   // D-13
  ],
}),
```

### The Cucumber outcome matrix

| CTRL-05 outcome | How the scenario arms it | What the plugin observes | Assertion |
|---|---|---|---|
| Accepted | fake answers `PUT` with `200 {"success": true}` (today's default), then the broker publishes `update/accepted` with `test_running: true` | resolved `{success:true}`, then a reported `true` | Switch `On` stays `true`; `StatusActive` `true`; no pending row remains |
| Rejected | `rejectNextCommand(500)` — the fake answers a non-2xx | `CloudRequestError` from `narrow()` (`api.ts:99-103`) | write throws `-70402`; `On` returns to reported `false`; `statusCode` back to `0` after the push |
| Rejected (200 with `success:false`) | `answerNextCommandWith({ success: false })` | resolved `{success:false}` | same as above — this is the second branch Pitfall 7 names |
| Timed out | `holdNextCommand()` — recorded, never answered | `AbortSignal.timeout(2500)` fires inside `send()` | write throws `-70408` after ~2.5 s real time; no retry request appears in `fakeRestApi.requests`; pending is retained per D-038 |
| Late | fake answers `200 {"success": true}`; the broker publishes `test_running: true` only **after** the 30-second window has been advanced past | expiry fires first, then a reported `true` | after expiry the Switch shows reported `false` and one warning is logged; when the late report arrives the Switch follows it with no pending state involved |
| Externally initiated | broker publishes `test_running: true` with **no** HomeKit write at all | a reported `true` and nothing else | Switch follows it; `fakeRestApi.requests` contains no `PUT`; no pending row was ever created |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Characteristic.on('set', cb)` callback style | `Characteristic.onSet(async handler)` | HAP-NodeJS 0.9 / Homebridge 1.3 | HAP warns `"Ignoring on('set') handler as onSet handler was defined instead"` if both are registered (`Characteristic.js:1801-1803`). Use `onSet` only. |
| Returning a "safe default" from a degraded sensor | Preserve the last valid value and mark `StatusActive = false` | This project's D-014, a deliberate departure from HAP-NodeJS's own advice | Already documented in the README's "When the plugin cannot vouch for a value" section. |
| Rejecting a write by calling back with an `Error` | Throwing `HapStatusError` from `onSet` | HAP-NodeJS 0.9+ | A bare `Error` still works but is converted to `-70402` and emits a characteristic warning. |

**Deprecated/outdated:**

- `Service.setCharacteristic` for pushing device state: it calls `setValue`, which routes through `handleSetRequest` and would invoke the plugin's own `onSet` handler. The catalogue correctly uses `updateCharacteristic` everywhere. **Once the two control Switches have an `onSet`, any accidental `setCharacteristic(On, …)` becomes a self-inflicted command.** `populateAccessoryInformation` uses `setCharacteristic` (`basementGuardian.ts:299-304`) but only on `AccessoryInformation`, which has no handler. Worth a note in the binder's docblock.

## Project Constraints (from CLAUDE.md)

| Directive | Where it binds Phase 4 |
|---|---|
| Read a file before editing; trace callers before modifying a function | `publishRows`, `ensureService`, `requestInit`, and `TELEMETRY_CHECKS` all gain callers or semantics in this phase. |
| Consult Homebridge and Cucumber.js primary docs against the **pinned** versions | Done for HAP: `@homebridge/hap-nodejs@2.2.2` source read and executed. Cucumber config is `cucumber.json` with a `default` profile importing `dist-test/features/**/*.js`. |
| TypeScript ESM, relative imports carry `.js` | Every new module. |
| Homebridge `^1.8.0 \|\| ^2.0.0`; use only `api.hap`; never import HAP-NodeJS at runtime | The binder reads `hap.HAPStatus` and `hap.HapStatusError` off the injected namespace. The one exception recommended is a **test-only** import for the fake-fidelity check (Pitfall 4) — flag it for the user. |
| Unknown/stale/invalid values never become guessed measurements | The pending row withholds rather than defaults; an untrusted `test_timestamp` abstains from classification rather than asserting "not a test". |
| Credentials, tokens, account identifiers never enter logs or accessory context | The command path logs a capability name and a cause, never a body, a URL, or a header value. The header-policy todo explicitly forbids identifiers in `User-Agent`. |
| Persistence: accessory-scoped observation data in typed `accessory.context`, explicitly persisted | `AccessoryStore.persist()`. |
| Never commit to `main`; `pre-commit run --all-files` before `git commit`; never `--no-verify`; never rebase | Execution discipline. Current branch is `features/phase-03-safety-monitoring-in-homekit`. |
| Conventional Commits; title 5–72 chars; body lines ≤ 80; no GSD phase mentions | Every commit. |
| Use `simple-english` and `humanizer` for user-facing prose | The README edits (D-12, CTRL-02, and the folded tile-visibility todo). |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` (Node 22.x / 24.x) for unit; `@cucumber/cucumber@^13.2.1` for the fake-pump suite |
| Config file | `cucumber.json` (profiles `default` and `real`); `tsconfig.test.json` for the test build |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm test` (= `test:unit` then `test:cucumber`) |
| Coverage gate | `npm run test:coverage:all` — 100% lines, branches, and functions over `dist-test/src/**/*.js` |

**Honest note on the coverage gate.** `npm run test:coverage:all` is **not** run in CI. `.github/workflows/build.yml` runs `lint`, `format:check`, `typecheck`, `fallow`, `npm test`, and `build` — no coverage step `[VERIFIED: .github/workflows/build.yml:42-66, read this session]`. The 100% gate is a local discipline, so a plan that relies on CI to catch an uncovered branch will not be caught. **Every task that adds a branch must name the test that covers it, and the phase gate must run `npm run test:coverage:all` explicitly.**

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CTRL-01 | Epoch seeded on first observation; count advances on a watched rising edge only; last-activation recorded | unit | `node --test dist-test/test/accessories/pumpRecords.test.js` | ❌ Wave 0 |
| CTRL-01 | Record survives restart — a rebuilt accessory over the same context resumes the epoch and count | unit | `node --test dist-test/test/accessories/pumpRecords.test.js` | ❌ Wave 0 |
| CTRL-01 | `persist()` called on a counted edge and not called on an unchanged update (D-10) | unit | `node --test dist-test/test/accessories/pumpRecords.test.js` | ❌ Wave 0 |
| CTRL-01 | A run already true at the first snapshot is not counted (D-09) | unit | `node --test dist-test/test/accessories/pumpRecords.test.js` | ❌ Wave 0 |
| CTRL-01 | A newer `backup_pump_timestamp` recovers exactly one activation and advances the watermark; a repeated identical timestamp recovers none (D-11) | unit | `node --test dist-test/test/accessories/pumpRecords.test.js` | ❌ Wave 0 |
| CTRL-01 | The three characteristics publish on `PumpService` under an unchanged subtype | unit | `node --test dist-test/test/accessories/serviceCatalogue.test.js` | ✅ exists, extend |
| CTRL-01 | The record survives a full plugin restart end to end | cucumber | `npx cucumber-js --name "observation record"` | ❌ Wave 0 (`features/pumpRecords.feature`) |
| CTRL-02 | README states Activity History is controller-owned, is not safety delivery, has no configurable retention, and is not backfill | manual-only | *(documentation; verified by review, not by assertion)* | n/a |
| CTRL-03 | `On` follows reported `test_running`, including a test started outside HomeKit | cucumber | `npx cucumber-js --name "self-test"` | ❌ Wave 0 (`features/officialControls.feature`) |
| CTRL-03 | An off write during a running test throws `-70412` and sends no request | unit + cucumber | `node --test dist-test/test/accessories/controls.test.js` | ❌ Wave 0 |
| CTRL-03 | A duplicate on write throws `-70403` and sends no request | unit + cucumber | `node --test dist-test/test/accessories/controls.test.js` | ❌ Wave 0 |
| CTRL-03 | A test is permitted while equipment faults are present | unit | `node --test dist-test/test/accessories/controls.test.js` | ❌ Wave 0 |
| CTRL-04 | `On` follows reported `alarm_audio_muted`; only `{"alarm_audio_muted": true}` is ever sent | unit + cucumber | `node --test dist-test/test/accessories/controls.test.js` | ❌ Wave 0 |
| CTRL-04 | An off write while mute is active throws `-70412` and sends no request | unit | `node --test dist-test/test/accessories/controls.test.js` | ❌ Wave 0 |
| CTRL-04 | Every mute constant is named `PROVISIONAL_` and lives in one module | unit | `node --test dist-test/test/accessories/controls.test.js` | ❌ Wave 0 |
| CTRL-05 | Accepted: HAP retains the requested value while pending; no push occurs | unit | `node --test dist-test/test/accessories/controls.test.js` | ❌ Wave 0 |
| CTRL-05 | Rejected (non-2xx) and rejected (`success:false`): both throw `-70402` | unit + cucumber | `node --test dist-test/test/accessories/controls.test.js` | ❌ Wave 0 |
| CTRL-05 | Timed out: throws `-70408` after the 2.5 s deadline and issues exactly one request | cucumber | `npx cucumber-js --name "vendor never answers"` | ❌ Wave 0 |
| CTRL-05 | Late: the 30-second window closes, one warning is logged, the Switch follows reported state, and the late report is then followed | unit + cucumber | `node --test dist-test/test/accessories/controls.test.js` | ❌ Wave 0 |
| CTRL-05 | Externally initiated: the Switch follows with no pending state and no `PUT` | cucumber | `npx cucumber-js --name "started outside HomeKit"` | ❌ Wave 0 |
| CTRL-05 | Requested state never reaches canonical safety state | cucumber | `npx cucumber-js --name "requested"` | ✅ partially — `shadowMerge.feature` already covers requested-state rejection; extend |
| CTRL-05 | After any rejection the characteristic's stored status returns to `0` | unit | `node --test dist-test/test/accessories/controls.test.js` | ❌ Wave 0 |
| — | The fake HAP's write path agrees with the real pinned HAP | unit | `node --test dist-test/test/accessories/hapWriteFidelity.test.js` | ❌ Wave 0 |
| — | `TRUST_SCOPES` lists every `TrustScope` member | unit | `node --test dist-test/test/accessories/basementGuardian.test.js` | ✅ exists, extend |

### Sampling Rate

- **Per task commit:** `npm run test:unit`, plus `pre-commit run --files <changed files>` per CLAUDE.md.
- **Per wave merge:** `npm test` (unit + cucumber).
- **Phase gate:** `npm run check` **and** `npm run test:coverage:all` green before `/gsd-verify-work`. The coverage command must be run explicitly; CI does not run it.

### Wave 0 Gaps

- [ ] `test/accessories/pumpRecords.test.ts` — covers CTRL-01
- [ ] `test/accessories/controls.test.ts` — covers CTRL-03, CTRL-04, CTRL-05
- [ ] `test/accessories/hapWriteFidelity.test.ts` — holds `fakeHap`'s write path honest against real HAP
- [ ] `test/runtime/accessoryStore.test.ts` — covers the D-08 persist port
- [ ] `features/officialControls.feature` + `features/support/steps/controls.ts` — the five CTRL-05 outcomes
- [ ] `features/pumpRecords.feature` — record survival across restart
- [ ] `features/support/fakeHap.ts` extension — `Switch`, `On`, `onSet`, `handleSetRequest` with real-HAP semantics, `statusCode`, `HAPStatus`, `HapStatusError`
- [ ] `features/support/fakeTimers.ts` — a controllable `Timers` driven from `World.advanceClock`, wired into `World.discoveryContext()` in place of `systemTimers`
- [ ] `features/support/fakeShadowBroker.ts` extension — the fake pump's *reaction*: an accepted command flips `test_running` and the broker reports it on `update/accepted`. **No `update/rejected` leaf** (Open Question 1).
- [ ] `features/support/fakeRestApi.ts` extension — command-scoped arming (`holdNextCommand`, `rejectNextCommand`, `answerNextCommandWith`), and a device reaction that flips `test_running` on acceptance
- [ ] Framework install: none — every framework is already present.

**The `.continue-here.md` discipline applies to every safety-bearing row above.** For each of: the pending row withholding `On`, the expiry snap-back, the duplicate refusal, the recovered-activation de-duplication, and the "an untrusted `test_timestamp` does not assert not-a-test" rule — reintroduce the defect and watch the specific test fail. A green run of a test you have not seen fail is not evidence.

## Security Domain

### Applicable ASVS Categories (level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (unchanged) | The command path reuses `AuthClient.idToken` through `CloudApi.send`; Phase 4 adds no credential handling. |
| V3 Session Management | no | No session state. |
| V4 Access Control | **yes** | The write path is the first place a HomeKit controller can cause a physical action. Control is bounded by: only two capabilities exist (`DeviceCapability`), only `true` is ever sent (D-018, D-019), and every custom characteristic stays read-only via `readOnlyPerms()`. HAP pairing is the authentication boundary; the plugin adds no second one. |
| V5 Input Validation | **yes** | `handleSetRequest` calls `validateClientSuppliedValue` before the handler for any connection-originated write (`Characteristic.js:1791-1797`), so a non-boolean cannot reach `onSet` on a `bool` characteristic. The binder still checks `value !== true` explicitly, because `false` is a *valid* boolean the plugin must refuse. |
| V6 Cryptography | no | Nothing new. SigV4 and TLS are untouched; the folded header todo explicitly keeps the WebSocket handshake out of scope. |
| V7 Error Handling & Logging | **yes** | Refusal logs must name a capability and a cause and quote no body, URL, header, token, or account identifier. `RedactingLogger` is already in the path. |
| V13 API | **yes** | The `PUT /devices/{deviceId}/data` body is built by `family.command()` from a fixed two-key vocabulary; `deviceId` is `encodeURIComponent`-escaped in `devicePath` (`api.ts:70-72`), which is already the T-01-31 control. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| A HomeKit automation loops on a Switch and floods the vendor with commands | Denial of Service (against the vendor, and against a real pump) | The local refusals (D-07) reject a duplicate before any request leaves; the 30-second pending window means at most one in-flight request per capability; `sendCommand` never retries (D-038). **The planner should confirm the pending window is per capability per accessory, not global.** |
| Requested control state leaking into canonical safety state | Tampering | Structural: `ReportedPatch` has no member for requested state (`state.ts:44-51`), and the shadow client subscribes to no delta topic (`shadow.ts:24-31`). Phase 4 must not add one. |
| An identifying `User-Agent` exposing the installation | Information Disclosure | The folded header todo forbids credentials, account/device identifiers, hostnames, OS details, and bridge names. `homebridge-basement-guardian/<version>` is the candidate; the fake asserts the approved value. |
| A sticky `HapStatusError` erasing retained safety values across the accessory | Denial of Service (against the user's own monitoring) | Per-characteristic by construction (probed); mitigated by the push-back. **The residual — what Apple Home renders — is unverified and belongs in the D-03 human-verification session.** |
| A refusal message quoting a vendor response body | Information Disclosure | `CloudRequestError` already carries a fixed message plus a route label and a status, never the body (`api.ts:75-91`). The binder must not add one. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | everything | ✓ | matches `^22.10.0 \|\| ^24.0.0` (repo already builds) | — |
| `@homebridge/hap-nodejs` in `node_modules` | the write-path fidelity test | ✓ | 2.2.2 | If a future install hoists it differently, resolve through `homebridge`'s own dependency rather than a bare specifier. |
| `aedes` (fake MQTT broker) | existing shadow scenarios | ✓ | ^1.1.1 | — |
| Vendor Auth0 / REST / AWS IoT endpoints | **not used in this phase** | n/a | — | D-15 forbids reaching them. Everything runs against the loopback fakes. |
| A real paired Apple Home with a hub | D-03's `StatusActive`-on-a-`Switch` check and the tile-visibility list | ✗ (not this session) | — | None. It is a human-verification item, not a fallback. |

**Missing dependencies with no fallback:**

- A real Apple Home for the D-03 check and for the sticky-`statusCode` rendering question. Both are human-verification items, and both belong in the same session per `04-CONTEXT.md`'s Specific Ideas.

**Missing dependencies with fallback:** none.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Apple Home does not degrade the whole accessory to "No Response" when one characteristic answers an error status on a read | Pattern 2, Security Domain | If wrong, a refused Switch press blanks all fifteen services' retained values — the exact D-014 failure the plugin exists to prevent. The `Timers.setTimeout(…, 0)` push shrinks the window to a tick, but does not close it if a read races the push. **Must be raised as a human-verification item.** |
| A2 | Apple Home renders a `Switch` carrying `StatusActive = false` and still accepts a press | Pattern 3 | D-03's own stated risk. HAP's side is now verified (no warning, no rejection); only the controller's rendering is open. |
| A3 | `api.hap` at Homebridge runtime is the HAP-NodeJS module namespace, so `HAPStatus` and `HapStatusError` are reachable through it | Pattern 4 | Verified through the package index and the declared `API['hap'] = typeof hapNodeJs` type, and corroborated by the orchestrator's own runtime check recorded in D-04. If wrong, the binder cannot construct a status error without a forbidden direct import. Cheap to close: one harness assertion. |
| A4 | A `ReadonlySet<DeviceCapability>` on `ProjectionInput` is the right shape for pending state | Pattern 5 | Explicitly Claude's discretion in `04-CONTEXT.md`. No risk beyond refactor cost. |
| A5 | `uint8` is too narrow for an activation count and `uint32` should be added to the format table | Code Examples | If the count is left at `uint8`, HAP clamps at 255 and the count silently stops advancing — a false fact on a safety accessory. |
| A6 | The 30-second pending window is per capability per accessory | Security Domain | A global window would let one accessory's pending self-test block another accessory's mute. Not stated in `04-CONTEXT.md`; the planner should state it. |
| A7 | Converting the device's Unix-seconds timestamp to milliseconds is not the "arithmetic on a device timestamp" `constraints.md:503` forbids | Pitfall 2 | The rule as written forbids *comparing* a device timestamp against local time. A unit conversion compares nothing. If the user reads it more strictly, the alternative is widening the stored type to carry seconds explicitly. |
| A9 | `update/rejected` exists as an AWS IoT device-shadow topic at all | Open Question 1 | General AWS knowledge, not measured and not in `.planning/intel/constraints.md`. Low consequence: the recommendation is to drop the leaf, so the claim is load-bearing only if someone argues the leaf *should* be added. |
| A8 | The header policy should be a version-bearing product identifier sourced from a constant with a manifest test guarding drift | Project Constraints | `src/settings.ts` holds no version constant today and `package.json` is not imported at runtime anywhere in `src/`. A version-free `homebridge-basement-guardian` is the simplest alternative and creates no drift at all. Folded todo, so the phase decides it. |

## Open Questions

1. **~~Does `update/rejected` belong in the fake broker at all?~~ RESOLVED by the user, 2026-09-01: no. Drop the leaf.** This narrows locked `D-15` and the planner should treat the narrowing as settled rather than re-asking. The reasoning is kept below because the planner needs it to write the harness tasks.
   - What we know: `04-CONTEXT.md` D-15 says the phase adds `update/rejected` to `ShadowTopicLeaf`. But the plugin's own topic surface has no such leaf and no update-publish helper, deliberately. `SHADOW_TOPICS` `[VERIFIED: src/cloud/shadow.ts:32-37]` is verbatim:
     ```typescript
     export const SHADOW_TOPICS = {
       get: (deviceId: string): string => `$aws/things/${deviceId}/shadow/get`,
       getAccepted: (deviceId: string): string => `$aws/things/${deviceId}/shadow/get/accepted`,
       getRejected: (deviceId: string): string => `$aws/things/${deviceId}/shadow/get/rejected`,
       updateAccepted: (deviceId: string): string => `$aws/things/${deviceId}/shadow/update/accepted`,
     } as const;
     ```
     and its docblock states: *"the plugin never writes the shadow: device commands travel over the vendor REST command route (SYNC-02)."* `fillRoutes` (`shadow.ts:151-158`) subscribes to exactly those three per device.
   - **The stronger reason, added 2026-09-01 after the user asked directly: the real system never produces a rejection of anything this plugin does.** An `update/rejected` message is the shadow service's answer to a publish on `$aws/things/{thing}/shadow/update`. This plugin issues exactly one publish, ever, and it is not that one `[VERIFIED: src/cloud/shadow.ts:345 — `await target.transport.publish(SHADOW_TOPICS.get(deviceId), '');`, the only `publish` call in the module]`. Commands travel over `PUT /devices/{deviceId}/data`, and the `{"desiredData": ...}` body D-15 refers to is that route's **HTTP body** `[VERIFIED: src/cloud/api.ts:169 — `body: JSON.stringify({ desiredData: command.desiredData })`; and .planning/intel/constraints.md:88-92, which shows it under `PUT /devices/{deviceId}/data` with `Content-Type: application/json`]`, not an MQTT publish. So there is no plugin-issued shadow update for the service to accept or reject.
   - What's also true: the plugin does not subscribe to the leaf either `[VERIFIED: src/cloud/shadow.ts:151-158, `fillRoutes` registers `getAccepted`, `getRejected`, and `updateAccepted` per device and nothing else]`, so even a rejection caused by someone else's update — the device's own, or the vendor cloud's — would not reach it.
   - What is **not** established: whether the vendor's shadow ever emits on that leaf at all. The 2026-08-29 measurement recorded `foreignStateChange` with `operation === 'update'` and says nothing about rejections `[VERIFIED: .planning/intel/constraints.md:148-157]`. That `update/rejected` exists as an AWS IoT topic at all is `[ASSUMED]` — general AWS knowledge, not measured here and not recorded in the repo's intel.
   - Decision as taken: **do not add the subscription, and do not add the leaf.** A fake that publishes a message the real system would never send to a client that would never be listening is the definition of `04-CONTEXT.md` D-15's own warning — "a fake we author answers our own design". Drive all five CTRL-05 outcomes from the REST layer, where the plugin actually observes them, and where the wire shapes are measured. The user confirmed this on 2026-09-01, so `D-15` now reads: extend the broker to let the fake pump *react* to an accepted command by reporting `test_running: true` on `update/accepted`, and drop the `update/rejected` leaf entirely.

2. **Where does the pending-expiry republish run, given the accessory's synchronous-`update()` contract?**
   - What we know: `basementGuardian.ts`'s `update()` docblock promises *"It runs to completion synchronously: nothing is awaited and nothing is scheduled, so two updates cannot interleave."* The expiry callback must publish outside `update()`.
   - What's unclear: whether the expiry should call `republishPublishedRows` directly (re-entering a private function from a timer) or set a flag and force a lightweight republish of the two control rows only.
   - Recommendation: republish the **two control rows only**. Nothing else changed, and a full republish from a timer would make the "two updates cannot interleave" claim harder to hold. Document the narrowing in the binder.

3. **Does the `On` push-back after a rejection race a controller read?**
   - What we know: HAP answers the write error to the controller, then the `Timers.setTimeout(…, 0)` push runs on the next macrotask. A read arriving between the two would see the sticky status.
   - What's unclear: whether Apple Home issues a read that fast after a failed write. Probably yes — controllers commonly re-read after an error.
   - Recommendation: accept the residual, note it in the code, and cover it in the D-03 real-home session by pressing a refused control and watching what the tile does. Do not try to close it in code; there is no earlier hook than "after HAP's catch".

4. **Should `test_running` being untrustworthy also withhold the classification, or only deactivate the Switch?**
   - What we know: D-13's algorithm requires `test_running === false` *and* both timestamps stable before classifying.
   - What's unclear: what to do when `test_running` fails validation mid-sequence.
   - Recommendation: abstain — keep the previous classification value and do not advance the watermarks. Asserting either label from an untrustworthy input is the false-normal pattern D-014 forbids.

## Sources

### Primary (HIGH confidence)

- `node_modules/@homebridge/hap-nodejs@2.2.2/dist/lib/Characteristic.js` — `handleSetRequest` (1786-1881), `handleGetRequest` (1683-1772), `updateValue` (1628-1658). Read and executed.
- `node_modules/@homebridge/hap-nodejs@2.2.2/dist/lib/Service.js` — `getCharacteristic` (472-500), `testCharacteristic`, `updateCharacteristic`, `addOptionalCharacteristic` (526-533). Read.
- `node_modules/@homebridge/hap-nodejs@2.2.2/dist/lib/Accessory.js` — `handleSetCharacteristics` write dispatch (1328-1338), `handleCharacteristicChangeEvent` (1409-1430). Read.
- `node_modules/@homebridge/hap-nodejs@2.2.2/dist/lib/definitions/ServiceDefinitions.js:1045-1056` (`Switch`) and `CharacteristicDefinitions.js:3318-3329` (`StatusActive`). Read.
- Three Node probe scripts run against the pinned package this session, output quoted inline.
- Repository source read this session: `src/accessories/{basementGuardian,serviceCatalogue,customCharacteristics,customServices,services,reconciliation}.ts`, `src/device/{gemini,family,health,state,halo}.ts`, `src/cloud/{api,types,shadow}.ts`, `src/runtime/{accountRuntime,clock,timers}.ts`, `src/persistence/accessoryContext.ts`, `src/platform.ts`, `features/support/{fakeHap,fakeRestApi,fakeShadowBroker,loopbackServer,world}.ts`, `features/support/steps/{homekit,shadow}.ts`, `test/accessories/{timerFreedom,basementGuardian}.test.ts`, `test/runtime/accountRuntime.test.ts`, `package.json`, `cucumber.json`, `.github/workflows/build.yml`.
- `.planning/intel/constraints.md` lines 83-113, 225-242, 380-395, 480-560. Read.
- `.planning/phases/03-safety-monitoring-in-homekit/03-CONTEXT.md` D-04, D-05, and `.continue-here.md`. Read.
- `docs/research/HOMEKIT.md` service table and §3.4. Read.

### Secondary (MEDIUM confidence)

- `gsd-tools query package-legitimacy check --ecosystem npm` — run this session for both HAP packages.
- `.planning/todos/pending/2026-08-31-define-cloud-request-header-policy.md` — read for the folded header scope.

### Tertiary (LOW confidence)

- None. No web search was used: every question in the research focus was answerable from the pinned source or the repository, and answering them from the primary artefact is strictly better than answering them from documentation about a different version.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no package is added; the two touched packages are already locked in the lockfile and their versions were read from disk.
- HAP write-path semantics: HIGH — read from the pinned source *and* executed against it, with output quoted. This is the strongest evidence available short of a real controller.
- `StatusActive` on a `Switch` (HAP side): HIGH — probed both with and without the declaration guard; the mechanism has no service-specific branch.
- `StatusActive` on a `Switch` (Apple Home rendering): LOW — unverifiable in this environment; remains D-03's human-verification item, unchanged.
- Sticky-`statusCode` consequence in Apple Home: LOW — HAP's per-characteristic behaviour is verified; the controller's response is not.
- In-repo seams and wiring: HIGH — every file named was opened this session and every cited value is quoted verbatim.
- Cucumber harness design: MEDIUM — the existing primitives were read and are a good fit, but the fake HAP write path does not exist yet, so its fidelity is a design intention rather than an observation.
- Pitfalls: HIGH for 1, 2, 3, 6, 7, 8 (each traced to a quoted line); MEDIUM for 4 and 5 (design risks rather than observed defects).

**Research date:** 2026-08-31
**Valid until:** 2026-09-30 for the in-repo findings (they change only when the repo does). The HAP findings are pinned to `@homebridge/hap-nodejs@2.2.2` and must be re-probed if that resolution changes — `npm install` in CI runs `npm audit fix`, which can move a transitive version.
</content>
</invoke>
