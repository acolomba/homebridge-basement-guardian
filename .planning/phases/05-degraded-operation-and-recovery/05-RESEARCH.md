# Phase 5: Degraded Operation and Recovery - Research

**Researched:** 2026-09-01
**Domain:** In-repo TypeScript ESM Homebridge plugin — transport health projection, HAP characteristic
lifecycle across a Homebridge accessory-cache restart, and command gating.
**Confidence:** HIGH for everything traced to a quoted source line; MEDIUM for the two Apple Home
rendering questions, which no source in this repository can settle.

## Summary

Every finding below came from reading this repository and the two pinned packages in `node_modules`.
No external package is added by this phase, so no registry work applies. The research answered the
seven questions the brief posed and found **four decisions that cannot be implemented as written**,
plus **three factual errors in `05-CONTEXT.md`'s own supporting prose**. Those are the load-bearing
results; the rest is wiring detail.

The largest finding is that `D-06` rests on a false premise. `05-CONTEXT.md` names
`src/persistence/accessoryContext.ts` as "the cached state D-06 publishes from", but that module
holds no telemetry by deliberate design, and says so in its own overview. The cached values a user
sees after a restart come from the **Homebridge accessory cache**, which serializes each
characteristic's `value` and restores it through `PlatformAccessory.deserialize` before the plugin
runs a line of publishing code. That inverts D-06's implementation: the plugin does not publish
cached values on restart — HAP is already serving them — so D-06 is a *marking* pass, not a
*publishing* pass, and it must run at `configureAccessory` time, not "from the first update", because
the first update does not arrive until the first successful REST poll.

The second largest is that the existing `monitoringPath` projection **already collapses the exact
distinction `D-04` is built on**. `monitoringPathNow()` returns `'unavailable'` whenever the poll is
failing, whatever the shadow is doing, so REST-down/shadow-up and both-down are the same value today.
`D-04` requires them to differ. And `shadowConnected` tracks the socket, not message arrival, so it
goes false on the provider's own daily connection ceiling and stays true while a device that has
stopped heartbeating goes silent. Neither is the signal `D-05` needs; a recorded last-shadow-message
timestamp is.

**Primary recommendation:** Add one runtime-owned `MonitoringHealth` projection that records
`lastShadowMessageAt` and a consecutive-REST-failure count, evaluate shadow silence lazily on the
poll tick against the injected `Clock` (never a new timer — that is what makes it testable), push the
resulting global trust withdrawal into the accessory tier through a new push method on
`BasementGuardianAccessory`, and reuse the existing `DistrustReason` value `'unreachable'`, which is
declared and unused. `D-07`'s "valid state" predicate needs no new code — it already exists and fires
automatically once the withdrawal lands.

## User Constraints (from CONTEXT.md)

### Locked Decisions

Copied verbatim from `.planning/phases/05-degraded-operation-and-recovery/05-CONTEXT.md`
`<decisions>`. These are binding; research investigated how to implement them, not whether to.

#### Degraded monitoring path — how it becomes visible

- **D-01 — The signal is `StatusActive = false`, not a new adapter and not a new characteristic:**
  Success criterion 2 forbids using `Basement Guardian Offline` or `Pump Controller Link Lost` for a
  monitoring-path failure, because those assert something about the device while this asserts
  something about us. `StatusActive` already carries exactly the claim needed — "do not trust this
  reading right now" — and Phase 3 confirmed against a real paired Apple Home that it draws a
  `Status Active — No` row under Details, keeps the tile present, and retains the last value. No new
  HomeKit surface is introduced.

- **D-02 — A monitoring-path degradation marks every scope on every accessory:** A transport outage
  is global — one REST poll and one MQTT connection per account, not per field — so the per-scope
  shape `D-014` uses for field validation does not fit it. If the plugin cannot see the device,
  nothing it displays is fresh, so nothing may read as trustworthy. Preserve-and-mark still holds:
  values are retained, only trust is withdrawn. The accepted cost is that a whole home of
  accessories goes `Status Active — No` at once, which is the truthful reading.

- **D-03 — The resulting double meaning is accepted and resolved outside HomeKit:** `StatusActive`
  now means both "this field failed validation" (Phase 3) and "we cannot see the device at all"
  (this phase). `03-CONTEXT.md` D-06 refused to overload `StatusActive` for the pending window on
  exactly this ground, and the distinction here is different in kind: the two are not rival
  explanations, because when the monitoring path is down every field is untrustworthy anyway. The
  distinction matters for diagnosis, not for safety. HomeKit therefore carries one signal with one
  meaning — untrustworthy — while the `FailureLog` line and the existing
  `ControllerDataLastTrustedAt` characteristic tell a diagnosing user which cause it was.

- **D-04 — REST and shadow are distinguished, and only shadow loss withdraws trust:** The two
  transports fail independently and cost different things.
  - *REST down, shadow alive:* live pushes still arrive, so state is current and only the
    reconciliation backstop is missing. Reported in logs and diagnostics; **does not** mark HomeKit.
  - *Shadow down, REST alive:* polls still arrive about every fifteen minutes, but a pump run lasts
    7–15 seconds and can begin and end entirely between two polls. `Primary Pump Running` would
    never fire and the primary activation count would silently stop advancing, with nothing looking
    wrong. **This marks scopes untrustworthy.** It is the false-normal case this project exists to
    prevent, and Phase 4's README already records that live shadow delivery is what makes primary
    counting work at all.
  - *Both down:* everything is marked.

- **D-05 — The threshold mirrors the shapes already ratified, rather than inventing a number:** Two
  consecutive failed REST polls, or two missed heartbeats of shadow silence, marks the path
  degraded. `RES-01` already fixes the shadow half — the device heartbeat is approximately 898
  seconds, roughly fifteen minutes of silence is normal, silence is a secondary staleness signal
  only after two missed heartbeats, and one missed heartbeat is never evidence of anything. Two is
  also `offlineConfirmationPollCount`'s default. One transient blip never trips it.
  `offlineConfirmationPollCount` itself is **not** reused for REST failures: it counts *successful*
  snapshots reporting disconnected, a failed request is explicitly not a snapshot (`D-016`), and
  raising it to 8 for offline confirmation must not silently slow degradation reporting.

#### Restart on cached state

- **D-06 — Cached values publish with `StatusActive = false` immediately, from the first update:**
  `RES-04` requires accessories to stay present and visibly stale. There is no unmarked window: a
  restart before the first poll means the plugin has never had current data this run, and a stale
  value that reads as trustworthy is the false normal the project forbids. A restart is usually
  seconds from its first poll, so the marked window is short in practice — and when it is not short,
  that is precisely when a user should see it.

- **D-07 — Commands gate on two separate predicates, refused separately:** Success criterion 3 says
  commands stay disabled until valid state **and** command transport return, and those can differ —
  a fresh shadow snapshot can arrive while REST authentication has not completed, or the reverse.
  The binder consults two distinct predicates, each with its own log line naming which one blocked,
  so a user diagnosing a refused press learns whether the plugin lacks state or lacks a way to send.
  Phase 4's binder already takes `offlineConfirmed` as an injected predicate, so this is a known
  shape rather than a new one.

- **D-08 — The new refusal cause answers `NOT_ALLOWED_IN_CURRENT_STATE` (-70412):** It reuses the
  status the offline refusal already answers, because the condition is the same shape — the plugin
  will not act because the device's current state is unknown. `RESOURCE_BUSY` reads as contention
  and is already taken by duplicate-while-active; `SERVICE_COMMUNICATION_FAILURE` is already taken
  by a vendor-answered error and reusing it would blur a vendor refusal with a local one, which is
  the distinction `04-CONTEXT.md` D-04's per-cause table exists to preserve. Both new predicates
  answer -70412; the log line carries the distinction.

  `04-CONTEXT.md` D-04's residual applies unchanged: a refused press leaves the characteristic
  answering that status to every read until the macrotask clearing push lands.

- **D-09 — "Getters return cached values without network calls" is proven structurally, not built:**
  Phase 3 built the accessory to publish state rather than answer pull-style getters — values are
  pushed on `update()` and HAP serves the last pushed value — so this is very likely already true by
  construction. Treat it as an invariant to assert rather than a feature to add: a static gate in
  the spirit of Phase 3's import gate and the `update()` timer-freedom assertion, proving no
  accessory read path can reach the cloud client. Cheap, and it stays true as later code lands.

  The gate must be proven non-vacuous the way Phase 3 proved its own — plant a violating read path,
  watch the gate fail, remove it. An unlisted module and a clean module produce the identical green.

#### Credential rejection

- **D-10 — Credential rejection alone may use `HapStatusError`, amending `03-CONTEXT.md` D-05:**
  This is a deliberate, narrow exception to a locked Phase 3 decision, not a bypass. D-05 forbids
  `HapStatusError` because it produces "No Response", and that decision governs degradation
  reporting — which is what credential rejection is. Phase 4 could use `HapStatusError` only because
  `04-CONTEXT.md` D-04 governs *command refusal*, a different act; no such gap exists here.

  The exception is granted because credential rejection is unlike every other failure in this phase:
  it never self-clears, and `D-13` records that the vendor lifts a brute-force block only **thirty
  days after the last attempt**, so an automatic retry does not merely fail — it extends the
  lockout. `src/cloud/auth.ts` already stops the client for good on a refusal. "Requiring user
  action" is literal, and a `Status Active — No` row under Details is too easy to miss for a failure
  only the user can resolve.

  **This carries a measured risk and a real-home check.** A No Response accessory is greyed out in
  Apple Home, which sits in tension with `RES-04`'s own "accessories remain present and visibly
  stale" — preserve-and-mark risks becoming preserve-and-hide. Phase 3's still-open check 1 is
  already testing whether a *degraded* scope still fires automations; No Response is a stronger form
  of the same question and nobody has tested it. This phase must raise a human-verification item:
  confirm a No Response accessory still lets a user reach cached values, and confirm what happens to
  automations built on it. A negative finding reopens D-10, not `RES-04`.
  — **Reversibility:** costly — the amendment is one narrow branch, but it edits a locked Phase 3
  decision that the whole degradation design rests on, so reversing it means revisiting D-05's text
  as well as the code.

#### Clearing

- **D-11 — One valid observation clears its own cause; the asymmetry is deliberate:** Two failures
  withdraw trust so a blip cannot flap it, but a single good observation restores it, because a good
  observation is direct evidence and Phase 3 established that recovery is immediate on valid data
  rather than delayed by a confirmation count. Clearing is **matched to cause**: a successful REST
  poll clears the REST degradation, a shadow message clears the shadow one, and a family-valid field
  clears its own scope's validation failure. A REST poll must not clear a shadow-silence
  degradation — shadow silence is precisely the case where REST still works while live signals go
  unobserved, so that would restore trust the plugin has not earned.

### Claude's Discretion

- Module layout and file names behind every decision above, and whether the degraded-path state
  lives in a new module or extends an existing one.
- How the two command-gating predicates are represented on the binder's options — two functions, a
  small readiness object, or a discriminated union — provided each refusal can name which one
  blocked.
- Exact wording of every log line, subject to `AUTH-02` (no URL, header value, token, or response
  body) and to the 2026-08-29 ruling that a vendor `deviceId` **is** admitted to logs.
- Whether the REST-failure counter reuses `reconciliation.ts`'s existing counting shape or gets its
  own.
- The `FailureLog` `kind` strings, subject to that module's existing convention: a capitalized noun
  phrase reading as the subject of the recovery sentence.

### Deferred Ideas (OUT OF SCOPE)

- **A vendor characteristic naming the degradation cause** — considered for D-03 and declined,
  because Apple Home draws no tile for vendor-defined services, so the user most likely to need it
  would not see it. If a later phase adds a diagnostics surface, this belongs there.
- **A longer secondary threshold after which REST-only loss also withdraws trust** — considered for
  D-04 and declined as a third threshold to specify, justify and test. Revisit if real use shows the
  missing backstop matters more than expected.
- **A distinct HomeKit marker for "never observed this run" versus "observed and lost"** —
  considered for D-06 and declined to keep one signal with one meaning. The distinction survives in
  logs.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RES-03 (remaining sentence) | "Failed REST requests or monitoring-path loss are logged and diagnosed separately without a false physical-device alert." `[VERIFIED: .planning/REQUIREMENTS.md:65]` | Finding 2 (the two transports and what each is observable from), Finding 5 (`offlineValues` reads `offlineConfirmed` alone and never a reported field, so no monitoring failure can reach the offline adapter today — the "without a false physical-device alert" half is already structurally true and must be *kept* true when D-02's global withdrawal lands). |
| RES-04 (in full) | "After a failed restart, getters return cached values without network calls, accessories remain present and visibly stale, commands stay disabled until fresh valid state returns, and only explicit credential rejection yields a persistent communication failure requiring user action." `[VERIFIED: .planning/REQUIREMENTS.md:67]` | Finding 3 (getters — already true by construction, and the exact static gate shape to assert it), Finding 4 (present-and-stale — the cache is HAP's, not the plugin's, and where the marking pass must run), Finding 6 (command gating — one predicate already exists, one is new), Finding 7 (credential rejection — the mechanism that produces No Response without a getter). |
| RES-01 (not delivered here; must not be contradicted) | "The device heartbeat is approximately 898 seconds, and approximately 15 minutes of shadow silence is normal. Shadow silence is a secondary staleness signal only after two missed heartbeats, and one missed heartbeat is never evidence that the device is offline." `[VERIFIED: .planning/REQUIREMENTS.md:62]` | Confirmed against the measured intel, not restated from the requirement — see "Protocol facts confirmed" below. |
| CONF-05 | "an integer `offlineConfirmationPollCount` from 1 through 8, with 2 by default" `[VERIFIED: .planning/REQUIREMENTS.md:14]`; enforced in code as `{ field: 'offlineConfirmationPollCount', … }` and `POLL_INTERVAL_BOUNDS: IntegerBounds = { field: 'pollInterval', unit: 'seconds', minimum: 300, maximum: 3600, documentedDefault: 900 }` `[VERIFIED: src/config.ts:24, :27]` | Finding 2's sampling-rate argument: the poll interval is a user-settable 300–3600 s, which bounds how quickly a lazily evaluated shadow-silence check can fire. |

**Traceability defect found.** `.planning/REQUIREMENTS.md` marks both `RES-01` and `RES-03` as `[x]`
and their traceability rows as `Complete` `[VERIFIED: .planning/REQUIREMENTS.md:62, :65, :144, :146]`,
while the same file's own inline delivery-split notes say Phase 5 still owes the time-based half of
`RES-01` and the remaining sentence of `RES-03` `[VERIFIED: .planning/REQUIREMENTS.md:63, :66]`. The
file contradicts itself. The planner should include a task correcting the two checkboxes and the two
traceability rows; leaving them means Phase 5's own delivery cannot be tracked and a later audit will
read both as already shipped.

## Project Constraints (from CLAUDE.md)

These are directives, not suggestions. Every plan must comply.

| Directive | Source | Consequence for this phase |
|---|---|---|
| Read a file before editing it; trace a function's callers before modifying it. | `CLAUDE.md` "General" | Every module this phase touches is already published-to by another module. `basementGuardian.update()` has two callers (`platform.ts:246`, `platform.ts:315`) plus the store subscription (`platform.ts:159-161`). |
| TypeScript ESM on Node `^22.10.0 \|\| ^24.0.0`; relative ESM imports carry `.js`. | `CLAUDE.md` "Constraints"; `package.json` `engines` `[VERIFIED: package.json engines = {"node":"^22.10.0 \|\| ^24.0.0","homebridge":"^1.8.0 \|\| ^2.0.0"}]` | Every new import in `src/` needs the `.js` suffix. |
| HAP objects come only from `api.hap`; no direct HAP-NodeJS import at runtime. | `CLAUDE.md` "Constraints" | `D-10`'s `HapStatusError` must be constructed as `new hap.HapStatusError(...)`. The static gate at `test/accessories/hapImportScope.test.ts` enforces this and permits exactly one importer, `test/accessories/hapWriteFidelity.test.ts` `[VERIFIED: test/accessories/hapImportScope.test.ts:44-47, :146]`. |
| Unknown, stale, omitted, or invalid values never become guessed measurements or normal defaults; preserve the last valid value and mark the narrowest affected scope. | `CLAUDE.md` "Constraints" (`D-014`) | `D-02` widens the scope for a global cause. The invariant to hold is that no value is *blanked*. |
| Credentials, tokens, temporary AWS credentials, raw responses, and account identifiers never enter logs or accessory context. | `CLAUDE.md` "Constraints" (`AUTH-02`, `D-027`) | Every new log line this phase adds. The vendor `deviceId` is admitted by the 2026-08-29 ruling. |
| Never commit to `main`; branch names `features/*`. | `CLAUDE.md` "Git" | Work continues on `features/phase-04-pump-records-and-official-controls` or a new `features/phase-05-*` branch. |
| Run `pre-commit run --all-files` (or `--files <changed>`) **before** `git commit`; never `--no-verify`; never amend to recover from a hook failure. | `CLAUDE.md` "Git" | The hooks are `npm lint`, `npm format:check`, `npm typecheck`, `npm fallow` `[VERIFIED: STATE.md, "A RED commit CAN pass the pre-commit hooks", corrected 2026-08-30]`. **The test suite is not a hook.** A RED commit passes unless its tests name a module that does not exist yet, which is a compile error. Two Phase 3 plans and two Phase 4 plans recorded the opposite by inheriting it from a prior summary; do not inherit it again. |
| Never rebase; update branches by merging. | `CLAUDE.md` "Git" | — |
| Simplicity first: no speculative abstraction, no configurability that was not asked for. | `CLAUDE.md` §2 | `05-CONTEXT.md` `<specifics>` reinforces this: "Resist adding a config knob for [D-05's thresholds] without asking." |
| Surgical changes: touch only what the request requires. | `CLAUDE.md` §3 | This phase edits four published modules. Every edit must trace to a decision. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Detecting REST poll failure and counting consecutive failures | `src/runtime/accountRuntime.ts` | — | It is the only module that runs the poll and sees the whole stream of outcomes `[VERIFIED: src/runtime/accountRuntime.ts:522-546]`. |
| Detecting shadow silence (message arrival, not socket state) | `src/runtime/accountRuntime.ts` | `src/cloud/shadow.ts` | The runtime owns the `onReportedPatch` callback the client invokes per message `[VERIFIED: src/runtime/accountRuntime.ts:419-421]`. The client itself must stay ignorant of thresholds — it already reports connection events and nothing else. |
| Holding the account-wide monitoring-health projection | `src/runtime/` (new module, or `accountRuntime` internals) | `src/device/health.ts` | `DeviceHealth` and `MonitoringPath` are already declared there and `DeviceHealth` is documented as "the aggregate projection nothing assembles yet" `[VERIFIED: src/device/health.ts:11-14]`. |
| Turning monitoring health into per-scope distrust | `src/accessories/basementGuardian.ts` | — | `untrusted` is computed there and nowhere else `[VERIFIED: src/accessories/basementGuardian.ts:718, :737]`. |
| Deciding what a service publishes under distrust | `src/accessories/serviceCatalogue.ts` | — | `isRowTrusted` / `isRowFullyTrusted` are the one rule `[VERIFIED: src/accessories/serviceCatalogue.ts:214-215, :230-231]`. |
| Marking restored accessories stale before the first poll | `src/platform.ts` (`configureAccessory`) | — | It is the only code that runs while a restored accessory exists and no fresh data does `[VERIFIED: src/platform.ts:501-504]`. |
| Gating a command press | `src/accessories/controls.ts` | `src/accessories/basementGuardian.ts` | The binder owns `LOCAL_REFUSALS`; the accessory supplies the injected predicates `[VERIFIED: src/accessories/controls.ts:200-205; src/accessories/basementGuardian.ts:511-519]`. |
| Reporting the diagnostic distinction between causes | `src/runtime/failureLog.ts` | — | Rate-limited, keyed by `kind`, already the home for `Device polling` and `The shadow connection` `[VERIFIED: src/runtime/accountRuntime.ts:45-48]`. |
| Producing the persistent credential-rejection presentation | `src/accessories/basementGuardian.ts` | `src/cloud/auth.ts` (detection only) | Detection already exists; nothing carries it to the accessory tier today (Finding 7). |

No capability in this phase belongs to a browser, CDN, or database tier — this is a single-process
Node plugin with one cloud dependency.

## Standard Stack

**This phase adds no dependency.** Everything it needs is already installed and already used.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `homebridge` (types + `api.hap`) | `^2.4.0` installed, `^1.8.0 \|\| ^2.0.0` supported `[VERIFIED: node_modules/homebridge/package.json version 2.4.0; package.json engines]` | HAP service/characteristic surface, accessory cache | The only runtime source of HAP objects this project permits. |
| `@homebridge/hap-nodejs` | `2.2.2`, pinned exactly `[VERIFIED: node_modules/@homebridge/hap-nodejs/package.json version 2.2.2; package.json devDependencies "@homebridge/hap-nodejs":"2.2.2"]` | devDependency only — read for behaviour, imported by exactly one test file | `D-17` permits one test-scope importer for write-fidelity checking. |
| `mqtt` | `^5.15.2` `[VERIFIED: package.json dependencies]` | The one runtime dependency; already wired behind `src/cloud/mqttTransport.ts` | Not touched by this phase. |

### Supporting (test tier, already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:test` | Node built-in | Unit tests under `test/`, mirroring `src/` | Every unit case. Run with `npm run test:unit`. |
| `@cucumber/cucumber` | `^13.2.1` `[VERIFIED: package.json devDependencies]` | End-to-end fake-pump scenarios under `features/` | Every behaviour that crosses the runtime→accessory→HAP seam. |
| `aedes` | `^1.1.1` `[VERIFIED: package.json devDependencies]` | The fake MQTT broker behind `features/support/fakeShadowBroker.ts` | Shadow silence and reconnect scenarios. |
| `strong-mock` | `^9.2.2` `[VERIFIED: package.json devDependencies]` | Unit-tier collaborators | Where a hand-rolled stub would be longer. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| A lazily evaluated silence check on the poll tick | A dedicated `waitFor()` loop in the runtime at a fixed cadence | The loop uses `node:timers/promises` on **real** time `[VERIFIED: src/runtime/accountRuntime.ts:1, :264-272]`, which the Cucumber harness cannot advance — its controllable clock only drives the injected `Timers` port, which the runtime does not take. A silence check evaluated against the injected `Clock` on the existing poll tick is drivable by `advanceClock()` `[VERIFIED: features/support/world.ts:226-240]`. **Choose the lazy evaluation.** See Pitfall 3. |
| A new `MonitoringHealth` module under `src/runtime/` | Extending `accountRuntime.ts` in place | `accountRuntime.ts` is already 786 lines and `.fallowrc.json` caps `maxUnitSize: 60` and `maxCognitive: 15` `[VERIFIED: .fallowrc.json health block]`. A separate module keeps the health rules unit-testable without standing up a runtime. Recommended, but this is Claude's discretion per `05-CONTEXT.md`. |
| Reusing `src/accessories/reconciliation.ts` for the REST-failure count | A plain integer in the health projection | `reconciliation.ts` counts **per-deviceId absence across inventory responses** `[VERIFIED: src/accessories/reconciliation.ts:70-96]`. A REST failure is account-wide — one poll serves every device — so the per-device map buys nothing and the `forget`/`observe` vocabulary would mislead. **Use a plain counter.** |

**Note on a path in `05-CONTEXT.md`:** the `<code_context>` section names
`src/runtime/reconciliation.ts`. That file does not exist. The module is at
`src/accessories/reconciliation.ts` `[VERIFIED: file listing of src/; src/accessories/reconciliation.ts:1-15]`.

## Package Legitimacy Audit

**Not applicable.** This phase installs no external package. `package.json` is unchanged by every
decision in `05-CONTEXT.md`, and the Standard Stack table above lists only already-installed
dependencies, each verified by reading `package.json` and the corresponding `node_modules` manifest
in this session.

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```text
                    ┌──────────────────────── Vendor cloud ────────────────────────┐
                    │  Auth0 grant        REST /devices, /command      AWS IoT MQTT │
                    └──────┬──────────────────────┬───────────────────────┬────────┘
                           │                      │                       │
                     idToken() throws        poll outcome            message arrival
                     AuthHaltedError          success/failure         (per message,
                     once halted                                       change or not)
                           │                      │                       │
                           ▼                      ▼                       ▼
   ┌───────────────────────────────── src/runtime/accountRuntime.ts ─────────────────────────────┐
   │  halted flag              polling flag              shadowConnected flag                     │
   │  (terminal, D-13)         (single failure)          (socket, flaps on the daily ceiling)     │
   │                                                                                             │
   │  ── NEW ──►  MonitoringHealth                                                               │
   │              • consecutiveRestFailures : number                                             │
   │              • lastShadowMessageAt     : number | undefined   ← stamped in onReportedPatch   │
   │              • credentialsRejected     : boolean              ← set at launchFailure         │
   │              evaluated lazily on each poll tick, against the injected Clock                  │
   └────────────┬────────────────────────────────────────────────────┬──────────────────────────┘
                │                                                    │
      store.applyDiscovery / applyReportedPatch          ── NEW ── monitoring-health push
                │                                                    │
                ▼                                                    │
   ┌──── src/device/state.ts ────┐                                    │
   │ notify() fires ONLY when a  │  ✗ a repeated identical heartbeat  │
   │ telemetry key changed       │    reaches no listener             │
   └────────────┬────────────────┘                                    │
                │ store.subscribe (live)                              │
                │                                                     │
   ┌────────────▼───── src/platform.ts ──────────────────────────────▼─────────────────────────┐
   │  onTrustworthyInventory → registerDiscoveredDevices → update(snapshot,'poll')             │
   │  subscribeToLiveState   → update(snapshot,'live')                                          │
   │  configureAccessory     → records the restored accessory in a map, publishes NOTHING       │
   │                            ── NEW ── mark every restored service StatusActive = false      │
   └────────────┬───────────────────────────────────────────────────────────────────────────────┘
                │
   ┌────────────▼──── src/accessories/basementGuardian.ts ────────────────────────────────────┐
   │  untrusted = untrustedScopesOf(distrustReasonsOf(violated, linkLost), lastTrustedAt)      │
   │              ── NEW ── ∪ { every scope : 'unreachable' } when monitoring is degraded       │
   │  publishRows(projectionInputOf(decoded, controls.pending))                                 │
   │  ── NEW ── credential rejection → updateValue(new hap.HapStatusError(...)) per service     │
   └────────────┬─────────────────────────────────────────────┬───────────────────────────────┘
                │ project()                                    │ offlineConfirmed / NEW predicate
                ▼                                              ▼
   ┌──── serviceCatalogue.ts ────┐              ┌──── controls.ts ────┐
   │ isRowTrusted → publish or [] │              │ LOCAL_REFUSALS      │
   │ StatusActive = fullyTrusted  │              │ first match wins    │
   └──────────────────────────────┘              └─────────────────────┘
                │                                              │
                ▼                                              ▼
        HAP characteristic .value            HAP throws statusCode on read
        (serialized to the Homebridge cache) (never serialized)
```

### Recommended Project Structure

```text
src/
├── runtime/
│   ├── monitoringHealth.ts     # NEW — the account-wide projection (D-04, D-05, D-11)
│   └── accountRuntime.ts       # stamps arrivals, counts failures, pushes health out
├── device/
│   └── health.ts               # unchanged — DistrustReason 'unreachable' already declared
├── accessories/
│   └── basementGuardian.ts     # NEW push method; global withdrawal; credential-rejection branch
└── platform.ts                 # configureAccessory marks restored services stale
test/
├── runtime/monitoringHealth.test.ts
└── accessories/accessoryReadPathScope.test.ts   # NEW — D-09's static gate
features/
├── degradedOperation.feature   # extended with the D-04 matrix, D-06 restart, D-07 gating
└── support/fakeHomebridgeApi.ts # restoreCachedAccessories() must carry services + values
```

### Pattern 1: The account-wide health projection, evaluated lazily

**What:** A plain record of facts plus pure predicates over it. No timer, no clock reading inside
the record — the clock is injected and read at the evaluation site, exactly as
`src/runtime/failureLog.ts` does.

**When to use:** For every `D-04` / `D-05` / `D-11` question.

**Why this shape:** `failureLog.ts` is the ratified precedent — "The module owns no timer. It decides
what to log when it is told something happened, and its callers own the scheduling, so an hour of
failures is a matter of advancing the injected clock."
`[VERIFIED: src/runtime/failureLog.ts:37-39]`. The same reasoning applies here and is the only thing
that makes a 1796-second threshold testable in a suite whose scenarios never sleep.

```ts
// Source: shape follows src/runtime/failureLog.ts:41-69 and src/runtime/clock.ts:7-10
import type { Clock } from './clock.js';

/** Two consecutive failed REST polls, mirroring offlineConfirmationPollCount's default (D-05). */
export const REST_FAILURE_THRESHOLD = 2;

/**
 * The device heartbeat, measured at approximately 898 seconds
 * (`.planning/intel/constraints.md:525`). Two missed heartbeats is the shadow-silence
 * threshold RES-01 fixes; one is never evidence of anything.
 */
export const HEARTBEAT_INTERVAL_MS = 898_000;
export const MISSED_HEARTBEATS_BEFORE_SILENT = 2;

export interface MonitoringFacts {
  consecutiveRestFailures: number;
  /** Local time a shadow message last arrived, whatever it carried. Undefined until one has. */
  lastShadowMessageAt: number | undefined;
  credentialsRejected: boolean;
}

export function isRestDegraded(facts: MonitoringFacts): boolean {
  return facts.consecutiveRestFailures >= REST_FAILURE_THRESHOLD;
}

// Silence is measured from the last message, never from the socket state: the provider closes an
// established connection at a ceiling it publishes no knob for, so at least one reconnect a day is
// ordinary (src/cloud/shadow.ts:307-309), and a device that stops heartbeating goes silent while
// the socket stays open. Neither is visible in `shadowConnected`.
export function isShadowSilent(facts: MonitoringFacts, clock: Clock): boolean {
  if (facts.lastShadowMessageAt === undefined) {
    return false; // Nothing has ever arrived: that is startup, not silence. See Open Question 2.
  }

  return clock.now() - facts.lastShadowMessageAt >= HEARTBEAT_INTERVAL_MS * MISSED_HEARTBEATS_BEFORE_SILENT;
}
```

### Pattern 2: The global trust withdrawal composes with per-field violations for free

**What:** Add `'unreachable'` for every scope that does not already carry a reason.

**When to use:** For `D-02`.

**Why it composes:** `distrustReasonsOf` already layers a second, broader cause on top of per-field
violations using exactly this guard — `if (!reasons.has(scope)) { reasons.set(scope, 'controller-link-lost'); }`
`[VERIFIED: src/accessories/basementGuardian.ts:277-283]`. A third layer costs one more loop and
inherits the precedence rule already documented there: "a scope already untrusted because its own
field violated keeps saying so, and the lost link adds the scopes that had nothing wrong with them"
`[VERIFIED: src/accessories/basementGuardian.ts:271-275]`.

`DistrustReason` already declares the value and nothing in `src/` uses it:
`export type DistrustReason = 'stale' | 'unreachable' | 'invalid' | 'controller-link-lost';`
`[VERIFIED: src/device/health.ts:36]`. A repository-wide grep for `'unreachable'` returns that
declaration and one line in `test/device/health.test.ts` `[VERIFIED: grep over src/, test/, features/]`.
No new union member is needed, and no row tolerates it — every `toleratedDistrust` in the catalogue
is `[]` except `pump-controller-link-lost`, which lists `['controller-link-lost']`
`[VERIFIED: src/accessories/serviceCatalogue.ts:735 and the eleven other row definitions at :607-772]`.
So `'unreachable'` deactivates every row including the controller-link adapter, which is correct:
that adapter asserts a *device* fact the plugin can no longer observe.

### Pattern 3: The restart marking pass

**What:** Walk the restored accessory's services and push `StatusActive = false` onto each one that
already carries the characteristic. Do not add the characteristic, do not construct a
`BasementGuardianAccessory`, do not read `context.device`.

**When to use:** For `D-06`.

**Why not construct the accessory:** `createBasementGuardianAccessory` throws when
`context.device` is absent `[VERIFIED: src/accessories/basementGuardian.ts:206-212]`, and
`platform.ts` documents that a cache written before `context.device` existed carries none — the
discovery path is what supplies it `[VERIFIED: src/platform.ts:218-220]`. Constructing at
`configureAccessory` would throw on exactly the upgrade path `04-UAT.md` item 1 is already worried
about.

```ts
// Source: publishValue's declare-then-update shape, src/accessories/serviceCatalogue.ts:923-927.
// Deliberately narrower: testCharacteristic first, so a service that never carried StatusActive
// does not gain one on restart. A row that was never published has nothing stale to mark.
function markRestoredServicesStale(accessory: PlatformAccessory, hap: API['hap']): number {
  let marked = 0;

  for (const service of accessory.services) {
    if (service.testCharacteristic(hap.Characteristic.StatusActive)) {
      service.updateCharacteristic(hap.Characteristic.StatusActive, false);
      marked += 1;
    }
  }

  return marked;
}
```

Returning the count is not decoration — it is what lets a test assert the pass did work rather than
enumerate an empty list. Phase 3 learned this proving its import gate: "a gate that silently reads
nothing reports the same green as a gate that read everything"
`[VERIFIED: test/accessories/timerFreedom.test.ts:20-22]`.

### Pattern 4: The credential-rejection presentation, without a getter

**What:** `service.updateCharacteristic(char, new hap.HapStatusError(status))`.

**When to use:** For `D-10` only.

**Why it works without an `onGet`:** `updateValue` short-circuits on an `Error` — it assigns
`this.statusCode` and returns **before** touching `this.value`, so the last valid value is retained
and no change event is emitted `[VERIFIED: node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:1627-1634]`.
A later read with no `getHandler` and no `'get'` listeners hits
`if (this.statusCode) { throw this.statusCode; }` `[VERIFIED: node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:1727-1731]`.
So the No Response presentation is reachable through the push path alone. **`D-10` does not require
an `onGet` handler and therefore does not conflict with `D-09`.** That was the single biggest risk in
the phase and it is resolved.

Two consequences the planner must plan for:

1. **No change event is emitted**, so a paired controller holding an event subscription is not
   notified — the status surfaces on the next read. That is acceptable for a condition that requires
   user action, but it means an automated end-to-end assertion must *read* the characteristic, not
   watch for a change.
2. **`publishValue`'s signature is `(service, characteristic, value: CharacteristicValue)`**
   `[VERIFIED: src/accessories/serviceCatalogue.ts:923]`. An `Error` is not a `CharacteristicValue`.
   Do not widen `publishValue` — that would let any caller push an error and quietly reopen
   `03-CONTEXT.md` D-05 for every row. Add a separate, narrowly named function beside it, so the
   grep for the forbidden act names exactly one call site.
3. **`statusCode` is not serialized.** `Characteristic.serialize` returns
   `{ displayName, UUID, eventOnlyCharacteristic, constructorName, value, props }`
   `[VERIFIED: node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:2302-2309]`. So the No
   Response state does not survive a restart on its own — it is re-established when the runtime halts
   again, which it will, because a halted credential fails on the first grant.

### Anti-Patterns to Avoid

- **Deriving shadow health from `shadowConnected`.** It is set false by a routine daily close the
  provider makes at "a ceiling it does not publish a knob for" `[VERIFIED: src/cloud/shadow.ts:307-309]`,
  and stays true while a device that stopped heartbeating goes silent. Using it would flap daily
  *and* miss the case `D-04` says matters most.
- **Reusing `monitoringPath` as the D-04 discriminator without changing it.** See Finding 1 — it
  collapses two of the three cases `D-04` distinguishes.
- **Routing the global withdrawal through `store.subscribe`.** `notify()` returns early when no
  telemetry key changed `[VERIFIED: src/device/state.ts:262-266]`. A withdrawal and a clearing
  heartbeat both change zero telemetry keys.
- **Adding a config knob for D-05's thresholds.** `05-CONTEXT.md` `<specifics>` forbids it without
  asking.
- **Widening `publishValue` to accept an `Error`.** See Pattern 4 consequence 2.
- **Storing a telemetry snapshot in `accessory.context` to satisfy D-06.** The context module
  refuses this by design and explains why: "A stored snapshot would be a second source of safety
  state that nothing refreshes, and it would read as current after a restart."
  `[VERIFIED: src/persistence/accessoryContext.ts:11-14]`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Rate-limited failure reporting for a new degradation cause | A second warn-once flag beside `degraded` / `controllerLinkLost` | `options.failures.recordFailure(kind, reason)` / `recordSuccess(kind)` | Already gives warn-then-debug-then-warn-every-900s plus a `${kind} recovered.` line `[VERIFIED: src/runtime/failureLog.ts:41-69]`. `05-CONTEXT.md` names it as D-03's home. |
| A per-scope distrust set | A parallel "globally degraded" boolean read by each row | `untrustedScopes: readonly UntrustedScope[]` in `ProjectionInput` | Every row and `StatusActive` already read exactly this `[VERIFIED: src/accessories/serviceCatalogue.ts:81, :214, :230]`. A second signal is a second thing to keep in sync. |
| Telling a trustworthy inventory response from a failed one | A new HTTP check | The existing `onTrustworthyInventory` contract | Documented as "HTTP 200 with a schema-valid envelope, including a valid empty list; a failed or malformed response never reaches this listener (D-029)" `[VERIFIED: src/runtime/accountRuntime.ts:112-117]`. |
| A "no fresh state" command refusal | A new predicate | `hasNoFreshState`, already in `LOCAL_REFUSALS` | It fires on `request.reported === undefined` `[VERIFIED: src/accessories/controls.ts:168-170]`, and `reportedControlValue` already returns `undefined` for an untrusted scope `[VERIFIED: src/accessories/basementGuardian.ts:446-455]`. See Finding 6. |
| Restoring cached characteristic values on restart | Any plugin-side cache | Homebridge's own `PlatformAccessory.deserialize` | It already restores services and values `[VERIFIED: node_modules/homebridge/dist/bridgeService.js:227-229; node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:2302-2309]`. |
| A shadow-silence timer | `setTimeout` / `setInterval` anywhere in `src/accessories/` | Lazy evaluation against the injected `Clock` on the poll tick | `test/accessories/timerFreedom.test.ts` is a static gate: no module under `src/accessories/` may import `node:timers` or `node:timers/promises` `[VERIFIED: test/accessories/timerFreedom.test.ts:37]`. And a real-time loop in the runtime is untestable in Cucumber. |
| A hand-built HAP stand-in for a new unit test | A third stand-in | `features/support/fakeHap.ts` | STATE.md records the standing rule: "new accessories unit tests must import `features/support/fakeHap.ts` rather than grow their own". |

**Key insight:** this phase is almost entirely *wiring an existing signal to an existing consumer*.
The temptation is to build a parallel degradation mechanism because the global cause feels different
from a field violation. It is not different at the point of consumption — `isRowTrusted` cannot tell
them apart and should not.

## Findings

The seven questions the brief posed, answered with quoted evidence.

### Finding 1 — `monitoringPath` already collapses the distinction `D-04` is built on

`monitoringPathNow()` reads, verbatim:

```ts
  function monitoringPathNow(): MonitoringPath {
    if (stopped || halted || !polling) {
      return 'unavailable';
    }

    return shadowConnected ? 'shadow-and-poll' : 'poll-only';
  }
```

`[VERIFIED: src/runtime/accountRuntime.ts:337-343]`

Map that onto `D-04`'s three cases:

| `D-04` case | `polling` | `shadowConnected` | Today's `monitoringPath` | `D-04` requires |
|---|---|---|---|---|
| REST down, shadow alive | `false` | `true` | `'unavailable'` | logged only; **must not mark HomeKit** |
| Shadow down, REST alive | `true` | `false` | `'poll-only'` | **must mark scopes untrustworthy** |
| Both down | `false` | `false` | `'unavailable'` | mark everything |

Rows 1 and 3 produce the same value, so `monitoringPath` cannot discriminate them. Worse, the value
it produces for row 1 is the *most* severe one, which is the opposite of what `D-04` asks. The
comment above the function states the design intent explicitly: "Polling is the floor below both: it
is the reconciliation backstop, so a poll that is not succeeding means the plugin cannot vouch for
what it holds even while the shadow is live" `[VERIFIED: src/runtime/accountRuntime.ts:330-333]`.
That is a deliberate Phase 1 judgement and `D-04` overrules it for the HomeKit-marking question.

**Consequence for the planner.** Do not change `monitoringPathNow()`. Two Cucumber scenarios and
roughly a dozen unit cases assert its current values `[VERIFIED: features/degradedOperation.feature:18, :29, :31; test/runtime/accountRuntime.test.ts:1034, :1077, :1097, :1113, :1130, :1149, :1162, :1208, :1221, :1234, :1248, :1265, :1281, :1687]`,
and it answers a different question — which sources are feeding state. Add a *separate* projection
for the marking decision. `MonitoringPath` stays a diagnostic; the new projection is the safety
signal.

Also note: `polling` flips on a **single** failure — `recordPollFailure` sets `polling = false`
`[VERIFIED: src/runtime/accountRuntime.ts:352-355]`. `D-05` wants two consecutive. Nothing counts
consecutive REST failures anywhere in `src/` today.

### Finding 2 — What each transport actually exposes

**REST poll failure is observable at exactly one place.** `runPoll()` catches, discards a
shutdown-caused abort, and calls `recordPollFailure(error)`:

```ts
      if (root.signal.aborted) {
        return;
      }

      recordPollFailure(error);
```

`[VERIFIED: src/runtime/accountRuntime.ts:531-538]`. Success is `recordPollSuccess()` at `:525` and
at `:596` in `launch()`. Adding a counter is a two-line change at those three sites. **No consecutive
count exists today** — verified by reading both recorders `[VERIFIED: src/runtime/accountRuntime.ts:347-355]`.

**The MQTT client surfaces a connection signal, and it is the wrong signal.** `ShadowDisconnectReason`
is declared as `export type ShadowDisconnectReason = 'transport-closed' | 'transport-error' | 'subscription-refused' | 'handshake-refused';`
`[VERIFIED: src/cloud/shadow.ts:48]`, and `handleShadowDisconnected` already treats one of the four
as routine: `if (reason !== 'transport-closed') { options.failures.recordFailure(SHADOW, SHADOW_DEGRADED); }`
`[VERIFIED: src/runtime/accountRuntime.ts:373-384]`. `handleClose` explains why — the provider closes
established connections at an unpublished ceiling, so "at least one reconnect a day is expected
operation" `[VERIFIED: src/cloud/shadow.ts:306-309]`. A shadow-loss rule keyed on `shadowConnected`
would therefore fire daily on healthy hardware.

**Message arrival is observable, and it is the right signal.** The runtime supplies the per-message
callback:

```ts
        onReportedPatch: (deviceId: string, patch: ReportedPatch) => {
          options.store.applyReportedPatch(deviceId, patch);
        },
```

`[VERIFIED: src/runtime/accountRuntime.ts:419-421]`

This fires for every routed shadow message the client could read, before any change filtering
`[VERIFIED: src/cloud/shadow.ts:250-272]`. Stamping `lastShadowMessageAt = options.clock.now()` there
is one line and is the only place that sees every arrival.

**Is "two missed heartbeats" measurable?** Yes, from `lastShadowMessageAt` and the injected `Clock`,
and only from there. It is **not** measurable from `snapshot.receivedAt`, because a successful REST
poll bumps that field too: `toSnapshot` sets `receivedAt` unconditionally and its comment says "it
always records the receipt: a successful poll is a real observation about this device even when it
adds no telemetry" `[VERIFIED: src/device/state.ts:177-198]`. Using `receivedAt` would let a REST poll
clear a shadow-silence degradation, which `D-11` explicitly forbids.

**Can the plugin tell shadow-down-REST-up from both-down today?** Not for the marking decision — see
Finding 1. It *can* tell them apart internally, because `polling` and `shadowConnected` are separate
booleans `[VERIFIED: src/runtime/accountRuntime.ts:338-342]`; the information exists and is discarded
at the projection. That is the cheapest possible fix: a second projection over the same two facts
plus the two new ones.

**Protocol facts confirmed against the measured intel, not restated from the requirement.**
`.planning/intel/constraints.md:525` reads verbatim: "**Reachability is not silence.** The device
heartbeats about every 898 seconds. MQTT silence alone does not prove that the device is offline."
And `:527`: "Poll REST about every 15 minutes by default. Activate **Basement Guardian Offline**
after the configured number of successful disconnected snapshots." And `:529`: "The
`offlineConfirmationPollCount` field accepts integers from 1 through 8 and defaults to 2. A failed
REST request does not count as a disconnected snapshot." And `:531`: "If both monitoring paths become
stale, preserve the last valid values and mark the narrowest affected scope as untrustworthy. Do not
reset safety conditions to normal." `[VERIFIED: .planning/intel/constraints.md:525-531]`

One further measured fact bears directly on `D-11`: "**Heartbeats are partial payloads.** They carry
only `battery_health`, `hours_of_protection`, `water_level`, `serial_communications`, `offline`,
`mcu_target_version` and `wifi_signal_dbm`." `[VERIFIED: .planning/intel/constraints.md:533]` A
heartbeat therefore usually carries *identical* values — which is exactly the case `notify()` filters
out. See Pitfall 1.

### Finding 3 — `D-09`'s invariant is already structurally true

A repository-wide grep for `onGet`, `.on('get'`, `CharacteristicEventTypes`, and `getHandler` over
`src/` returns exactly two hits, both prose or an unrelated write handler:

- `src/accessories/basementGuardian.ts:26` — the file overview, which states the invariant: "Nothing
  here registers an `onGet` handler or a HAP `GET` event listener. Every value reaches HomeKit by
  being pushed, so HAP serves the last pushed value directly and a read never reaches the network
  (RES-04)." `[VERIFIED: src/accessories/basementGuardian.ts:26-28]`
- `src/accessories/controls.ts:385` — `service.getCharacteristic(hap.Characteristic.On).onSet(...)`,
  a **write** handler, which `RES-04` does not govern `[VERIFIED: src/accessories/controls.ts:383-385]`.

And no module under `src/accessories/` imports anything under `src/cloud/` — the complete set of
cross-directory imports from that tier is `../device/family.js`, `../device/health.js`,
`../device/registry.js`, `../device/state.js`, `../runtime/accessoryStore.js`,
`../runtime/commandPort.js`, `../runtime/timers.js`, `../runtime/clock.js`, and
`../persistence/accessoryContext.js` `[VERIFIED: grep of ^import over src/accessories/*.ts]`.

**So `D-09` is an assertion, not a build.** The gate should assert both halves, because either one
alone is bypassable:

1. No file under `src/accessories/` imports `../cloud/` or `../runtime/accountRuntime.js`.
2. No file under `src/accessories/` registers a read handler — the spellings to detect are
   `.onGet(`, `.on('get'`, `.on("get"`, and `CharacteristicEventTypes.GET`.

Copy the structure of `test/accessories/hapImportScope.test.ts` wholesale: a `SOURCE_FILE_FLOOR`
assertion so an empty read fails by name, one positive fixture per spelling, and negative fixtures
for a comment naming the forbidden thing and for an unrelated import
`[VERIFIED: test/accessories/hapImportScope.test.ts:63, :101-131, :142-147]`. Phase 3 already learned
that "the static gate reads an import rather than a mention, so the gate's own prose naming the
forbidden modules does not report itself" `[VERIFIED: STATE.md, Phase 03 accumulated context]`.

**Non-vacuity proof, per `D-09`'s own requirement.** Plant `service.getCharacteristic(hap.Characteristic.StatusActive).onGet(() => false);`
inside `publishRow` in `src/accessories/basementGuardian.ts`, run the gate, watch it name that file,
remove it. Separately plant `import { createCloudApi } from '../cloud/api.js';` in the same file for
the import half. Record both in the plan's verification steps, not only in a summary.

### Finding 4 — `D-06` rests on a false premise, and the fix is smaller than the decision implies

**The premise.** `05-CONTEXT.md` `<code_context>` says: "`src/persistence/accessoryContext.ts` — the
typed accessory context Phase 4 widened; the cached state D-06 publishes from."

**The module says the opposite, in its own overview:**

> It also holds no telemetry snapshot and no timer. A stored snapshot would be a second source of
> safety state that nothing refreshes, and it would read as current after a restart. What survives a
> restart is what the plugin observed over time, which the cloud does not report: how many times each
> pump ran and when it last ran, plus the vendor name last adopted for the display name (D-030).

`[VERIFIED: src/persistence/accessoryContext.ts:11-16]`

Its `AccessoryContext` interface carries `deviceId`, `deviceTypeId`, `serialNumber`, optional
`primaryPump`, `backupPump`, `watermarks`, and `lastVendorName` — no telemetry
`[VERIFIED: src/persistence/accessoryContext.ts:85-107]`.

**Where the cached values actually come from.** Homebridge restores accessories through
`PlatformAccessory.deserialize(serialized)` `[VERIFIED: node_modules/homebridge/dist/bridgeService.js:227-229]`,
and `Characteristic.serialize` persists the value:

```js
        return {
            displayName: characteristic.displayName,
            UUID: characteristic.UUID,
            eventOnlyCharacteristic: characteristic.UUID === Characteristic.ProgrammableSwitchEvent.UUID,
            constructorName: constructorName,
            value: characteristic.value,
            props: (0, clone_1.clone)({}, characteristic.props),
        };
```

`[VERIFIED: node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:2302-2309]`

This is corroborated inside this repository: `seedConfiguredName`'s docblock relies on it —
"`Characteristic.serialize` writes its value into the Homebridge accessory cache, so a rename a user
makes survives a restart" `[VERIFIED: src/accessories/serviceCatalogue.ts:944-947]`.

**So the false-normal window is real and is wider than D-06's wording admits.** After a restart, HAP
serves the persisted `StatusActive` — which for a healthy shutdown is `true` — from the moment the
bridge publishes, and the plugin publishes nothing until the first successful REST poll, because
`configureAccessory` does only this:

```ts
  configureAccessory(accessory: PlatformAccessory): void {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.set(accessory.UUID, accessory);
  }
```

`[VERIFIED: src/platform.ts:501-504]`

`update()` is reached only from `updateDiscoveredDevice` (`platform.ts:246`), `dispatchDiscoveredDevice`
(`platform.ts:315`), and the store subscription (`platform.ts:159-161`) — all downstream of
`onTrustworthyInventory`, which only a successful REST inventory fires
`[VERIFIED: src/runtime/accountRuntime.ts:286; src/platform.ts:340-353]`.

**Therefore D-06 cannot be implemented as written.** "from the first update" leaves the window open
for as long as the first poll takes — seconds normally, but unbounded when the cloud is down, which
is precisely the `RES-04` scenario ("after a failed restart"). The marking must happen at
`configureAccessory`, before `didFinishLaunching`. This is not a contradiction of `D-06`'s intent —
its own text says "There is no unmarked window" — it is a correction to its mechanism. **Name this in
the plan as an amendment to D-06's wording: replace "from the first update" with "at
`configureAccessory`, before the launch event."**

Pattern 3 above gives the implementation. Note the deliberate narrowing to services that already
carry `StatusActive`: pushing it onto one that never did would add a characteristic on upgrade, which
is the same unresolved question `04-UAT.md` item 1 is holding open.

### Finding 5 — Where a global withdrawal attaches, and one place it conflicts

**The attachment point.** `untrusted` is assembled in exactly two statements, both inside `update()`:
`untrusted = untrustedScopesOf(reasonsOf(NON_CONNECTIVITY_SCOPES, 'invalid'), lastTrustedAt);` on the
unresolved-family branch, and `untrusted = untrustedScopesOf(reasons, lastTrustedAt);` on the normal
branch `[VERIFIED: src/accessories/basementGuardian.ts:718, :737]`. Both feed
`projectionInputOf(...)` → `ProjectionInput.untrustedScopes` → every row's `project()` and
`StatusActive` `[VERIFIED: src/accessories/basementGuardian.ts:487-491, :574-577]`.

Add the global reason inside `distrustReasonsOf`, using the same non-overwriting guard already there
(Pattern 2). It composes; it does not conflict.

**Two conflicts it does create, both real.**

**(a) `reportDegradation()` will log a false cause.** It fires for any untrusted scope whose reason
is not `controller-link-lost`:

```ts
  function reportDegradation(): void {
    if (!untrusted.some((scope) => scope.reason !== 'controller-link-lost')) {
```

and the message it writes is `Degraded ${deviceId}: the profile or payload stopped validating.`
`[VERIFIED: src/accessories/basementGuardian.ts:625-644]`. A transport outage did not stop anything
validating. The predicate must exclude `'unreachable'` too, and `D-03`'s diagnostic line must come
from the runtime's `FailureLog` instead — which is what `05-CONTEXT.md` says it should
("This is the established home for transient runtime failure reporting and is where D-03's
diagnostic distinction lives").

**(b) `recordTrustedScopes` freezes every `lastTrustedAt` during an outage.** It advances a scope's
timestamp only when the reasons map does not hold it `[VERIFIED: src/accessories/basementGuardian.ts:669-675]`.
Under a global withdrawal, no scope advances — including `fault`, which is what
`ControllerDataLastTrustedAt` publishes `[VERIFIED: src/accessories/basementGuardian.ts:489]`. That
is the *truthful* behaviour and `D-03` even relies on it, since it names
`ControllerDataLastTrustedAt` as one of the two diagnostic surfaces. Flagging it so nobody "fixes"
it later.

**The scope-set question `D-02` leaves open — recommend a narrowing.** `D-02` says "every scope on
every accessory". Applied literally that includes `connectivity`, which deactivates
`Basement Guardian Offline`: its row is `{ kind: 'basement-guardian-offline', displayName: 'Basement Guardian Offline', scope: 'connectivity', toleratedDistrust: [], … }`
`[VERIFIED: src/accessories/serviceCatalogue.ts:766-774]` and `toRow`'s gate is
`project(input) { return isRowTrusted(this, input.untrustedScopes) ? values(input, this) : []; }`
`[VERIFIED: src/accessories/serviceCatalogue.ts:596-598]`.

That is right in the both-down case and **wrong in the shadow-down/REST-up case**, which is the case
`D-04` says matters most: there, REST is still landing, so `connectivity.connected` is still a fresh
observation and `offlineConfirmed` is still being advanced or reset on every poll
`[VERIFIED: src/accessories/basementGuardian.ts:730-734]`. Marking `connectivity` untrusted there
would silence the one adapter that *is* still being fed.

**Recommendation:** shadow silence withdraws `NON_CONNECTIVITY_SCOPES` — the constant already exists,
`const NON_CONNECTIVITY_SCOPES: ReadonlySet<TrustScope> = new Set(TRUST_SCOPES.filter((scope) => scope !== 'connectivity'));`
`[VERIFIED: src/accessories/basementGuardian.ts:194]` — and a REST degradation adds `connectivity`.
Both-down then yields all eight, satisfying `D-02`'s "everything is marked" for the case it was
written about, while the shadow-only case leaves the still-observed scope alone. This is a
*narrowing* of D-02 that preserves its stated principle ("If the plugin cannot see the device,
nothing it displays is fresh") rather than contradicting it, but it is a change to the decision's
literal text and needs the maintainer's ruling. See Open Question 1.

**Delivery mechanism.** `store.subscribe` cannot carry this — `notify()` returns early when no
telemetry key changed `[VERIFIED: src/device/state.ts:262-266]`. Add a push method on
`BasementGuardianAccessory` (for example `markMonitoring(degradedScopes: ReadonlySet<TrustScope>): void`)
that recomputes `untrusted` and calls the existing `republishPublishedRows(projectionInputOf(lastDecoded, controls.pending))`
`[VERIFIED: src/accessories/basementGuardian.ts:585-622]`. That function is already the
"refresh what is published, add nothing" path and is exactly the right semantics: an accessory that
has published nothing gains nothing, and one that has published keeps its values and loses its
`StatusActive`.

Wire it from `platform.ts`, which already holds `basementGuardianAccessories` and already builds the
`DiscoveryContext` twice `[VERIFIED: src/platform.ts:451-497]`. The runtime needs one new
`AccountRuntimeOptions` callback beside `onTrustworthyInventory` and `onDeviceRemoved`.

### Finding 6 — One of `D-07`'s two predicates already exists; the other is genuinely new

**"Valid state" is already implemented and already answers -70412.** `LOCAL_REFUSALS` reads verbatim:

```ts
const LOCAL_REFUSALS: readonly LocalRefusal[] = [
  { applies: isNotAnOnRequest, status: notAllowedInCurrentState, cause: 'only an on request is supported, and the device reports when the condition ends' },
  { applies: hasNoFreshState, status: notAllowedInCurrentState, cause: 'the plugin has no fresh state for it' },
  { applies: isConfirmedOffline, status: notAllowedInCurrentState, cause: 'the device is confirmed offline' },
  { applies: isAlreadyActive, status: (hap) => hap.HAPStatus.RESOURCE_BUSY, cause: 'it already reads active' },
];
```

`[VERIFIED: src/accessories/controls.ts:200-205]`

`hasNoFreshState` is `request.reported === undefined` `[VERIFIED: src/accessories/controls.ts:168-170]`,
and `reportedControlValue` returns `undefined` the moment the control's own scope is untrusted:

```ts
  function reportedControlValue(control: ControlDefinition): boolean | undefined {
    if (untrusted.some((scope) => scope.scope === control.capability)) {
      return undefined;
    }
```

`[VERIFIED: src/accessories/basementGuardian.ts:446-449]`

`self-test` and `alarm-mute` are both `TrustScope` members `[VERIFIED: src/device/health.ts:27]` and
both control rows are filed under them `[VERIFIED: src/accessories/serviceCatalogue.ts:751-772]`. So
**the moment D-02's withdrawal lands, presses are already refused with -70412 and a log line saying
"the plugin has no fresh state for it".** `D-07`'s state half needs no new predicate and `D-08`'s
status is already what it answers.

**"Command transport" is new.** Commands reach the vendor through
`options.api.sendCommand(deviceId, command, root.signal)` `[VERIFIED: src/runtime/accountRuntime.ts:636]`,
and every REST call first awaits `const idToken = await options.auth.idToken(deadline);`
`[VERIFIED: src/cloud/api.ts:162]`, which throws once halted:

```ts
  async function currentToken(signal: AbortSignal): Promise<CachedToken> {
    if (policy.haltedReason !== undefined) {
      throw new AuthHaltedError(HALTED, policy.haltedReason);
    }
```

`[VERIFIED: src/cloud/auth.ts:451-454]`

Today that failure travels the whole round trip and lands as `{ accepted: false, failure: 'vendor-error' }`
`[VERIFIED: src/runtime/accountRuntime.ts:639-641]` → `SERVICE_COMMUNICATION_FAILURE`
`[VERIFIED: src/accessories/controls.ts:213-215]` — which is exactly the blur `D-08` says to avoid.
So "command transport" resolves concretely to: *authentication is halted, or has never yet succeeded,
or the REST path is degraded.* All three are runtime-local facts.

**Wiring.** Give the binder a second injected `() => boolean` beside `offlineConfirmed`, supplied by
the accessory from a value the platform pushes in, exactly as `commands: runtime.commands` is already
threaded through `DiscoveryContext` `[VERIFIED: src/platform.ts:142, :465]`.

**Ordering matters and must be decided.** `localRefusalFor` returns the first match:
`return LOCAL_REFUSALS.find((refusal) => refusal.applies(request));` `[VERIFIED: src/accessories/controls.ts:207-209]`.
In the both-down case both new predicates are true, and whichever sits earlier writes the log line —
so `D-07`'s "each with its own log line naming which one blocked" is satisfiable only for one of them
at a time. Recommend placing the transport rule **immediately after `isNotAnOnRequest` and before
`hasNoFreshState`**, because when there is no way to send, naming the missing state is the less
actionable of the two truths. Whatever order is chosen, a unit case must pin it with both conditions
true simultaneously — otherwise the ordering is untested and a later reorder is silent.

### Finding 7 — Credential rejection reaches nothing today

**Detection exists.** `grantFailure` sets `policy.haltedReason = reason;` on any 4xx that is not a
throttle and returns an `AuthRejectedError` `[VERIFIED: src/cloud/auth.ts:322-330]`, and
`launchFailure` converts either terminal error into the runtime's own halt:

```ts
    if (error instanceof AuthRejectedError || error instanceof AuthHaltedError) {
      halted = true;
      options.failures.recordFailure(AUTHENTICATION, AUTHENTICATION_STOPPED);

      return undefined;
    }
```

`[VERIFIED: src/runtime/accountRuntime.ts:571-576]`

with the user-facing line `'Monitoring has stopped because the vendor refused the account credentials. Correct the account in Homebridge to start the plugin again.'`
`[VERIFIED: src/runtime/accountRuntime.ts:53-54]`.

**Nothing carries it to the accessory tier.** `halted` is a closure-local `let` read only by
`monitoringPathNow()` `[VERIFIED: src/runtime/accountRuntime.ts:338]`, and `monitoringPath` is read
by no module under `src/accessories/` or `src/platform.ts` — the only readers are the runtime's own
getter, unit tests, and one Cucumber step `[VERIFIED: grep for monitoringPath over src/, test/, features/]`.
And `monitoringPath` cannot distinguish halted from stopped from poll-failing anyway (Finding 1).

**So `D-10` needs a dedicated signal**, not a reuse. Add a `credentialsRejected` fact to the health
projection, set it beside `halted = true`, and push it out on the same new callback the global
withdrawal uses. Then in the accessory, push `new hap.HapStatusError(status)` onto every published
service's marker characteristic (Pattern 4).

**The status is not specified by `D-10`.** `D-08` claims `SERVICE_COMMUNICATION_FAILURE` is "already
taken by a vendor-answered error", but that reservation is on the **command-write** path
(`statusOf`, `src/accessories/controls.ts:213-215`), a different surface from a characteristic read.
`-70402` is the conventional producer of Apple Home's No Response. See Open Question 3.

## Common Pitfalls

### Pitfall 1: An identical heartbeat cannot clear a shadow-silence degradation through the live path

**What goes wrong:** `D-11` says "a shadow message clears the shadow one." If the clearing is wired
through `store.subscribe`, a heartbeat carrying the same values as the last one clears nothing, and
the accessory stays marked until a value happens to change.

**Why it happens:** `notify()` returns before reaching any listener when no telemetry key moved:

```ts
  const changed = changedKeys(previous === undefined ? {} : previous.data, next.data);

  if (changed.length === 0) {
    return;
  }
```

`[VERIFIED: src/device/state.ts:262-266]`

and the store's own contract documents this as intentional — "A change that leaves every telemetry
value where it was notifies nobody, which is what keeps a repeated heartbeat silent"
`[VERIFIED: src/device/state.ts:100-102]`. A heartbeat carries seven fields on a quiet system, all of
which are usually unchanged `[VERIFIED: .planning/intel/constraints.md:533]`.

**How to avoid:** stamp arrival in `onReportedPatch` (which fires per message, upstream of the store)
and drive the clearing from the health projection, not from a snapshot listener.

**Warning sign:** a scenario that publishes a heartbeat with a *changed* field to prove recovery.
That fixture sits at the value the defect produces — the exact shape this project has hit six times.
Publish an **identical** heartbeat in at least one recovery scenario.

### Pitfall 2: The Cucumber harness cannot see the restart false normal at all

**What goes wrong:** every `D-06` scenario passes whether or not the plugin marks the restored
accessory.

**Why it happens:** `restoreCachedAccessories()` deliberately drops the service surface. Its own
docblock says so:

> What deliberately does not come back is the published service surface. The real cache carries
> services and their last values too, so a restored accessory answers reads before the plugin has
> republished anything. Leaving them out makes an assertion after a restart read only what this run
> published, which is a stricter question than a real restart asks and never a laxer one.

`[VERIFIED: features/support/fakeHomebridgeApi.ts:106-110]`

That last clause is true for Phase 4's question (*did the plugin republish?*) and **false for Phase
5's** (*does a stale value read as trustworthy before it republishes?*). With no restored services
there is nothing stale to read, so the false normal is structurally invisible.

**How to avoid:** extend `restoreCachedAccessories()` to carry each service and each characteristic's
last value across a restart, including the `pushed` flag `features/support/publishedServices.ts`
relies on `[VERIFIED: features/support/publishedServices.ts:50-52]`. Record the reversal of the
docblock's stated choice in the plan, with this reason.

**Warning sign:** a `D-06` scenario that passes on the current harness. It is not evidence.

### Pitfall 3: A real-time silence loop is untestable in this suite

**What goes wrong:** a `waitFor(SILENCE_CHECK_MS)` loop in the runtime cannot be advanced by any
scenario, so a shadow-silence test would need ~30 real minutes.

**Why it happens:** the runtime schedules through `timers.setTimeout(delayMs, undefined, { signal: root.signal })`
from `node:timers/promises` `[VERIFIED: src/runtime/accountRuntime.ts:1, :266]` — real time. The
harness's controllable timers are `createFakeTimers(this)` and are handed only to the accessory tier
through `DiscoveryContext` `[VERIFIED: features/support/world.ts:167, and the timers member of the
discovery context]`. The harness clock `advanceClock()` moves `scenarioTime` and runs due fake timers
`[VERIFIED: features/support/world.ts:237-240]`; it does not touch `node:timers/promises`.

**How to avoid:** evaluate silence lazily on the existing poll tick against the injected `Clock`.
A scenario then sets `Given a short poll interval` (0.05 s `[VERIFIED: features/support/steps/runtime.ts:18]`),
publishes one shadow message, calls `advanceClock(2 * 898_000)`, and waits for the next poll.

**Cost to record:** detection latency is bounded by the poll interval, which a user may set as high
as 3600 s `[VERIFIED: src/config.ts:24]`. At the 900 s default the check samples a 1796 s condition
twice per threshold — comfortable. At 3600 s it samples slower than the threshold, so a degradation
can go unreported for up to an hour. State this in the README rather than adding a knob.

### Pitfall 4: `reportDegradation()` will name a cause that did not happen

Covered in Finding 5(a). The message asserts "the profile or payload stopped validating"
`[VERIFIED: src/accessories/basementGuardian.ts:640-643]`, which is false for a transport outage.
Fix the predicate at the same time as the withdrawal, or the plugin lies in its own log the first
time the cloud hiccups.

### Pitfall 5: A green Cucumber suite is not evidence for this projection path

`04-VERIFICATION.md` carries the warning as W-1: "No Cucumber scenario detects removal of the
pending-window withholding. Mutating `controlValues()` to ignore `pendingControls` killed 2 unit
cases but left all 78 scenarios green." `[VERIFIED: .planning/phases/04-pump-records-and-official-controls/04-VERIFICATION.md, warnings block]`
Phase 5 edits the same `project()` → `publishRow` → `StatusActive` path. The Validation Architecture
section below names the mutation that must fail for each new behaviour.

### Pitfall 6: Trusting a summary over the source

Two Phase 3 plans and two Phase 4 plans repeated a false claim about the pre-commit hooks, each
inheriting it from the previous summary `[VERIFIED: STATE.md, "A RED commit CAN pass the pre-commit
hooks", corrected 2026-08-30]`. Three claims in `05-CONTEXT.md`'s own supporting prose are wrong (see
"Errors found in the phase's own inputs"). Read the file.

## Errors found in the phase's own inputs

These are not decisions; they are supporting statements that do not survive contact with the source.
The decisions they support are unaffected except where noted.

| Where | Claim | What the source says |
|---|---|---|
| `05-CONTEXT.md` `<code_context>` | "`src/persistence/accessoryContext.ts` — … the cached state D-06 publishes from." | That module holds no telemetry by design `[VERIFIED: src/persistence/accessoryContext.ts:11-16]`. The cached state is HAP's. **This one does affect D-06's implementation** — see Finding 4. |
| `05-CONTEXT.md` `<code_context>` and Claude's Discretion | "`src/runtime/reconciliation.ts` — an existing consecutive-observation counter". | The file is `src/accessories/reconciliation.ts` `[VERIFIED: file listing]`, and it counts per-deviceId absence across inventories, not consecutive request outcomes `[VERIFIED: src/accessories/reconciliation.ts:70-96]`. |
| `05-CONTEXT.md` D-03 and `<canonical_refs>` | "`03-CONTEXT.md` D-06 refused to overload `StatusActive` for the pending window." | `03-CONTEXT.md` D-06 is "No sixth fault adapter" — the battery question `[VERIFIED: .planning/phases/03-safety-monitoring-in-homekit/03-CONTEXT.md, D-06]`. The pending-window refusal is `04-CONTEXT.md` D-06: "`StatusActive` is not used to mark this: it already means 'the reported field did not decode'" `[VERIFIED: .planning/phases/04-pump-records-and-official-controls/04-CONTEXT.md, D-06]`. D-03's argument is unaffected — only the citation is wrong. |
| `.planning/REQUIREMENTS.md` | `RES-01` and `RES-03` marked `[x]` / `Complete`. | The same file's delivery-split notes say Phase 5 still owes both `[VERIFIED: .planning/REQUIREMENTS.md:62-63, :65-66, :144, :146]`. |

## Code Examples

### Stamping shadow arrival (the one line that makes D-05 measurable)

```ts
// Source: src/runtime/accountRuntime.ts:416-424, one line added.
// This callback fires for every routed shadow message the client could read, before any change
// filtering (src/cloud/shadow.ts:250-272), which is why it and not store.subscribe is the
// arrival signal. A message that carries no observation still proves the path is alive.
      const client = options.createShadow({
        credentials: cache,
        retry: shadowRetry,
        onReportedPatch: (deviceId: string, patch: ReportedPatch) => {
          health.recordShadowMessage(options.clock.now());   // ← added
          options.store.applyReportedPatch(deviceId, patch);
        },
        onConnected: handleShadowConnected,
        onDisconnected: handleShadowDisconnected,
      });
```

### Counting consecutive REST failures without disturbing `monitoringPath`

```ts
// Source: src/runtime/accountRuntime.ts:347-355, extended.
// `polling` keeps its existing single-failure meaning, because monitoringPathNow() and fourteen
// assertions depend on it. The consecutive count is a separate fact for a separate projection.
  function recordPollSuccess(): void {
    polling = true;
    health.recordRestSuccess();       // ← resets the run to 0 (D-11: one good observation clears)
    options.failures.recordSuccess(POLLING);
  }

  function recordPollFailure(error: unknown): void {
    polling = false;
    health.recordRestFailure();       // ← advances the run (D-05: two consecutive)
    options.failures.recordFailure(POLLING, describeFailure(error));
  }
```

### The global withdrawal, layered onto the existing reason map

```ts
// Source: src/accessories/basementGuardian.ts:271-285, extended with a third layer.
// The guard is the same one the controller-link layer already uses: a scope already untrusted for
// its own field keeps saying so, and each broader cause only adds the scopes nothing else claimed.
function distrustReasonsOf(
  violated: ReadonlySet<TrustScope>,
  controllerLinkLost: boolean,
  monitoringDegraded: ReadonlySet<TrustScope>,   // ← added
): ReadonlyMap<TrustScope, DistrustReason> {
  const reasons = reasonsOf(violated, 'invalid');

  if (controllerLinkLost) {
    for (const scope of NON_CONNECTIVITY_SCOPES) {
      if (!reasons.has(scope)) {
        reasons.set(scope, 'controller-link-lost');
      }
    }
  }

  for (const scope of monitoringDegraded) {       // ← added
    if (!reasons.has(scope)) {
      reasons.set(scope, 'unreachable');
    }
  }

  return reasons;
}
```

### The credential-rejection push (D-10), beside `publishValue` rather than inside it

```ts
// Source: src/accessories/serviceCatalogue.ts:923-927, as a sibling.
// Deliberately a separate exported function with a name that says what it does, so a grep for the
// one act 03-CONTEXT.md D-05 forbids returns exactly one production call site. HAP assigns the
// status and returns before it touches `this.value`, so the retained last-valid value survives
// (node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:1627-1634).
export function publishPersistentFailure(hap: API['hap'], service: Service, characteristic: CharacteristicClass, status: number): void {
  declareCharacteristic(service, characteristic);

  service.updateCharacteristic(characteristic, new hap.HapStatusError(status));
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| `MonitoringPath` as the single health value | A separate marking projection beside it | This phase | `MonitoringPath` stays the diagnostic it was designed as; `D-04`'s three-way distinction gets a signal that can express it. |
| Degradation causes assembled only from family validation | A third layer for a global, non-payload cause | This phase | `distrustReasonsOf` gains one loop; `isRowTrusted` is unchanged. |
| `configureAccessory` records and nothing else | Records, then marks restored services stale | This phase | Closes `RES-04`'s "visibly stale" window on a failed restart. |
| Degradation reported only via `StatusActive` | Plus one `HapStatusError` branch for credential rejection | This phase (`D-10`, amending `03-CONTEXT.md` D-05) | The first time this plugin makes an accessory unreadable. Carries a real-home check. |

**Deprecated / superseded within the project:**

- `05-CONTEXT.md`'s reference to `src/runtime/reconciliation.ts` — no such file.
- `05-CONTEXT.md`'s claim that `accessoryContext.ts` is where D-06 publishes from.
- `features/support/fakeHomebridgeApi.ts:106-110`'s "never a laxer one" rationale — true until this
  phase, false for `D-06`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | Apple Home renders a No Response accessory such that a user can still reach cached values in Details, and automations built on it survive. | Finding 7 / Pattern 4 | **High.** `D-10` says a negative finding reopens the decision. Nothing in this repository or in HAP's source can answer it; only a real paired home can. Already scheduled as a human-verification item by `D-10`. |
| A2 | Placing the transport predicate before `hasNoFreshState` produces the more actionable log line in the both-down case. | Finding 6 | Low. It is a log-ordering judgement; either order is defensible and a unit case pins whichever is chosen. |
| A3 | `-70402 SERVICE_COMMUNICATION_FAILURE` is the status that produces Apple Home's No Response for a read failure. | Finding 7 | Medium. HAP throws whatever `statusCode` holds, so any error status makes the read fail; which one Apple Home renders as greyed-out is an Apple behaviour nobody here has tested. Folds into the A1 human check. |
| A4 | A 3600-second poll interval delaying shadow-silence detection by up to an hour is acceptable. | Pitfall 3 | Low. It delays a *report*, never a safety state, and the alternative is an untestable real-time loop. Worth one line in the README. |
| A5 | Extending `restoreCachedAccessories()` to carry services and values does not invalidate an existing scenario. | Pitfall 2 | Medium. 78 scenarios currently run against a harness that restores no services. Some restart assertion may be relying on the empty surface. Run the full suite immediately after the harness change, before writing any new scenario, and treat a failure as information rather than as breakage. |

**No `[ASSUMED]` claim in this document concerns a package name, a version, or a wire shape.** Every
such value was read from the file that defines it and quoted.

## Open Questions

1. **Does the global withdrawal include the `connectivity` scope when only the shadow is silent?**
   - What we know: `D-02` says "every scope on every accessory". Including `connectivity`
     deactivates `Basement Guardian Offline` `[VERIFIED: src/accessories/serviceCatalogue.ts:766-774, :596-598]`.
     In the shadow-only case REST is still landing, so `connectivity` is the one scope still being
     freshly observed `[VERIFIED: src/accessories/basementGuardian.ts:730-734]`.
   - What's unclear: whether `D-02`'s "every scope" was written with the shadow-only case in mind, or
     with the both-down case it spends its prose on.
   - Recommendation: shadow silence withdraws `NON_CONNECTIVITY_SCOPES`; a REST degradation adds
     `connectivity`; both-down yields all eight. This preserves `D-02`'s stated principle and keeps
     `RES-03`'s "without a false physical-device alert" honest in both directions. **Needs a ruling —
     it narrows the literal text of a locked decision.**

2. **Is "the plugin has never received a shadow message this run" silence, or startup?**
   - What we know: `lastShadowMessageAt` is `undefined` before the first message. A restart that
     cannot reach the broker leaves it undefined forever.
   - What's unclear: `D-05` says "two missed heartbeats of shadow silence", which presupposes a
     baseline. `D-06` separately says a restart with no fresh data marks everything anyway, which
     covers the startup case from the other direction — but only until the first successful poll
     lands, after which `D-06`'s marking is gone and `D-05`'s has not started.
   - Recommendation: treat plugin start as the baseline — seed `lastShadowMessageAt` from the clock
     when the runtime starts, so a shadow that never connects becomes silent two heartbeats after
     startup rather than never. That closes the gap without a new rule. **Needs a ruling.**

3. **Which HAP status does `D-10` push?**
   - What we know: any non-zero `statusCode` makes a read throw `[VERIFIED: node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:1727-1731]`.
     `D-08` reserves `SERVICE_COMMUNICATION_FAILURE` for a vendor-answered command error — on the
     *write* path `[VERIFIED: src/accessories/controls.ts:213-215]`.
   - Recommendation: `-70402`. It is the conventional No Response producer and the read/write
     surfaces are distinct enough that `D-08`'s reservation does not reach it. Confirm alongside A1.

4. **Does `D-10`'s No Response apply to every published service, or to one marker service?**
   - What we know: `D-10` says "a No Response accessory", singular. Apple Home greys the accessory
     when a characteristic read fails; which characteristics must fail to achieve that is untested.
   - Recommendation: push onto every published service's `StatusActive`, since every service already
     carries it after any update `[VERIFIED: src/accessories/basementGuardian.ts:576, :688]`, and let
     the human check report what Apple Home actually draws. Narrow it afterwards if one is enough.

5. **Where does D-06's marking pass live so Cucumber can exercise the real code?**
   - What we know: `world.ts` stands in for `configureAccessory` rather than calling it — "What
     `BasementGuardianPlatform.configureAccessory` does, which is the one thing the harness stands in
     for that a restart depends on" `[VERIFIED: features/support/world.ts:571-585]`. If the marking
     goes into the platform method, the harness must copy it, and then the suite tests its own copy.
   - Recommendation: put the pass in an exported function (in `platform.ts` or a small new module)
     that both `configureAccessory` and `world.ts`'s `restoredAccessories()` call. Then the scenario
     drives real code. **This is a plan-shaping constraint, not a preference.**

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| Node.js | Everything | ✓ | Local runtime is newer than both CI targets — MEMORY.md records "local Node is newer than CI, so a local green gate proves less than it looks", and `04-VERIFICATION.md` W-2 records verification ran on 26.7.0 | Run the gate on 22.x and 24.x before claiming green |
| `npm` | Build and test | ✓ | — | — |
| `@homebridge/hap-nodejs` | Behaviour reading; one test importer | ✓ | 2.2.2, pinned exactly | — |
| `homebridge` | Types, `api.hap`, accessory cache behaviour | ✓ | 2.4.0 | — |
| `aedes` (fake broker) | Shadow silence scenarios | ✓ | ^1.1.1 | — |
| Real paired Apple Home | A1, A3, and `D-10`'s check | ✗ | — | **None.** The check is deferred to the `G-003`/`G-004` session, joining `04-UAT.md`'s five open items and Phase 3's open check 1. |
| Real Gemini hardware | Not required by this phase | n/a | — | Everything here is transport and projection behaviour the fakes reproduce. |

**Missing dependencies with no fallback:** a real paired Apple Home, for `D-10` only. It does not
block implementation — `D-10` ships and the check rides along, exactly as `03-CONTEXT.md` D-05's own
residual does.

**CI reality to plan against:** `.github/workflows/build.yml` runs lint, `format:check`, `typecheck`,
`fallow`, `npm test`, build, and audit on Node 22.x and 24.x `[VERIFIED: .github/workflows/build.yml, steps list]`.
`npm test` is `npm run test:unit && npm run test:cucumber` `[VERIFIED: package.json scripts.test]`.
**`npm run test:coverage:all` is not in CI** — the 100/100/100 gate is local discipline
`[VERIFIED: .github/workflows/build.yml has no coverage step; package.json scripts.test:coverage:all exists]`.
Do not write a plan whose safety rests on CI enforcing coverage.

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Unit framework | `node:test`, compiled to `dist-test/` first `[VERIFIED: package.json scripts.test:unit]` |
| E2E framework | `@cucumber/cucumber` ^13.2.1 over `features/`, on the fake cloud + fake HAP |
| Config file | `cucumber.*` config resolved by `cucumber-js` (invoked with no explicit `-c`); unit tests need none |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm test` (unit + Cucumber) |
| Coverage gate (local only) | `npm run test:coverage:all` — 100 lines / 100 branches / 100 functions over `dist-test/src/**/*.js` |
| Health gate | `npm run fallow` — `maxCyclomatic: 20`, `maxCognitive: 15`, `maxUnitSize: 60`, `maxCrap: 0` `[VERIFIED: .fallowrc.json]` |

### Phase Requirements → Test Map

Every row names the **mutation that must fail it**. A test whose named mutation still passes is not
evidence — that is the rule this project paid for six times in Phase 4.

| Req | Behaviour | Type | Command | Mutation that must fail it | File |
|---|---|---|---|---|---|
| RES-03 | Two consecutive REST failures mark the path degraded; one does not | unit | `node --test dist-test/test/runtime/monitoringHealth.test.js` | Change `>=` to `> 0` in `isRestDegraded` | ❌ Wave 0 — `test/runtime/monitoringHealth.test.ts` |
| RES-03 | Shadow silence is measured from message arrival, never from `shadowConnected` | unit | same | Replace `isShadowSilent` with `() => !shadowConnected` | ❌ Wave 0 |
| RES-03 | One missed heartbeat is not silence; two is | unit | same | Change `MISSED_HEARTBEATS_BEFORE_SILENT` to `1` | ❌ Wave 0 |
| RES-03 | A REST poll does not clear a shadow-silence degradation (D-11) | unit | same | Make `recordRestSuccess()` also clear `lastShadowMessageAt`'s effect | ❌ Wave 0 |
| RES-03 | A monitoring-path failure never activates `Basement Guardian Offline` | e2e | `npm run test:cucumber` | Make `offlineValues` read the degradation instead of `offlineConfirmed` | `features/degradedOperation.feature` (extend) |
| RES-03 | REST down + shadow alive leaves every service `Status Active = true` | e2e | same | Mark on any degradation rather than on shadow loss alone | `features/degradedOperation.feature` |
| RES-03 | Shadow silent + REST alive sets `Status Active = false` on `Sump Pit Flood` while its `Leak Detected` value is retained | e2e | same | Withdraw only on `polling === false` | `features/degradedOperation.feature` |
| RES-01 (not contradicted) | An **identical** heartbeat clears shadow silence | e2e | same | Drive the clearing from `store.subscribe` instead of `onReportedPatch` | `features/degradedOperation.feature` |
| RES-04 | A restored accessory reads `Status Active = false` before any poll lands | e2e | same | Delete the `configureAccessory` marking pass | `features/degradedOperation.feature` — **requires the harness change below** |
| RES-04 | The restored accessory's last values are retained, not blanked | e2e | same | Push a format default instead of only `StatusActive` | same |
| RES-04 | No module under `src/accessories/` registers a read handler | unit (static) | `node --test dist-test/test/accessories/accessoryReadPathScope.test.js` | Plant `.onGet(() => false)` in `publishRow` | ❌ Wave 0 — `test/accessories/accessoryReadPathScope.test.ts` |
| RES-04 | No module under `src/accessories/` imports the cloud client | unit (static) | same | Plant `import { createCloudApi } from '../cloud/api.js';` in `basementGuardian.ts` | ❌ Wave 0 |
| RES-04 | The gate is non-vacuous: it enumerated a floor of files | unit (static) | same | Point `REPOSITORY_ROOT` one level wrong | ❌ Wave 0 |
| RES-04 | A press with no valid state is refused -70412 naming the state | unit | `node --test dist-test/test/accessories/controls.test.js` | Remove `hasNoFreshState` from `LOCAL_REFUSALS` | `test/accessories/controls.test.ts` (extend) |
| RES-04 | A press with no command transport is refused -70412 naming the transport | unit | same | Remove the new rule | same |
| RES-04 | With both true, the log names the agreed one | unit | same | Reorder `LOCAL_REFUSALS` | same |
| RES-04 | A press after credential rejection is refused locally, not via a vendor round trip | e2e | `npm run test:cucumber` | Delete the transport predicate — the press then reaches `commands.send` | `features/officialControls.feature` (extend) |
| RES-04 | Credential rejection makes a read throw and retains the value | unit | `node --test dist-test/test/accessories/basementGuardian.test.js` | Push `false` instead of a `HapStatusError` | `test/accessories/basementGuardian.test.ts` (extend) |
| RES-04 | Credential rejection is the **only** cause that does this | unit | same | Make the shadow-silence path push a `HapStatusError` too | same |
| CONF-05 | The degradation thresholds are not configurable | unit | `node --test dist-test/test/config.test.js` | Add a knob | `test/config.test.ts` (assert the resolved config's key set is unchanged) |

### Sampling Rate

- **Per task commit:** `npm run test:unit`. Remember the hooks do not run tests — a RED commit is
  possible and is the intended `test(...)` → `feat(...)` shape.
- **Per wave merge:** `npm test` (unit + all Cucumber scenarios).
- **Phase gate:** `npm test` green **plus** `npm run test:coverage:all` at 100/100/100 **plus**
  `npm run fallow` **on both Node 22.x and 24.x**, because CI carries neither the coverage gate nor
  this developer's Node version.

### Wave 0 Gaps

- [ ] `test/runtime/monitoringHealth.test.ts` — covers RES-03's threshold and clearing rules
- [ ] `test/accessories/accessoryReadPathScope.test.ts` — D-09's static gate, modelled on
      `test/accessories/hapImportScope.test.ts`
- [ ] **`features/support/fakeHomebridgeApi.ts` — `restoreCachedAccessories()` must carry services
      and their last characteristic values (and the `pushed` flag) across a restart.** Without this
      change every `D-06` scenario is vacuous (Pitfall 2). This is the single highest-value item in
      Wave 0 and it reverses a documented deliberate choice, so the plan must record the reversal and
      re-run all 78 existing scenarios immediately after it.
- [ ] **An exported marking function both `platform.configureAccessory` and `world.restoredAccessories()`
      call** — otherwise the harness tests its own copy of the behaviour (Open Question 5).
- [ ] A Cucumber step reading `Status Active` on a named service. The generic step
      `Then the {string} service reports {string} as {string}` already exists
      `[VERIFIED: features/support/steps/homekit.ts:123]` and resolves values through
      `pushedValue`, which distinguishes a pushed value from a format default
      `[VERIFIED: features/support/publishedServices.ts:50-52]`. Confirm it reaches `Status Active`
      by name; if not, that is the only new step needed.
- [ ] A step making the fake broker connect and then stay silent while the scenario advances the
      clock. The broker publishes only when a step tells it to
      `[VERIFIED: features/support/fakeShadowBroker.ts:203-211]`, so silence needs no new fake
      capability — only a `When the scenario advances the clock by N seconds` step if one does not
      already exist.

### The end-to-end blindness this phase must not inherit

`04-VERIFICATION.md` W-1 records that mutating away the pending-window withholding killed 2 unit
cases and left all 78 Cucumber scenarios green. The root cause is that no scenario asserted a value
the withholding controls. Phase 5's answer is structural, not aspirational:

1. **Every projection behaviour above has an e2e row that asserts `Status Active` by value**, not
   merely that a service exists. Existence is what 78 scenarios already assert, and it is what stayed
   green.
2. **The harness gains the restored service surface**, so the restart assertions have something to be
   wrong about.
3. **Every row names its mutation.** The plan's verification step for each is: apply the mutation,
   confirm the named test fails, revert, confirm green. Phase 3 and Phase 4 both proved gates this
   way; this is the same discipline applied to behaviour.
4. **At least one recovery scenario publishes an identical heartbeat**, so the clearing path is
   tested against the case the store filters out rather than the case it passes through.

## Security Domain

Enabled — `.planning/config.json` sets no `security_enforcement: false` `[VERIFIED: .planning/config.json]`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | yes (indirectly) | Unchanged. This phase reads `AuthHaltedError` / `AuthRejectedError` state; it must not add a retry. `D-13`'s thirty-day block makes a retry actively harmful `[VERIFIED: src/cloud/errors.ts:52-60]`. |
| V3 Session Management | no | No session surface. |
| V4 Access Control | no | No multi-user surface. |
| V5 Input Validation | yes | Unchanged. Family validation is Phase 2/3's; this phase adds no new decode path. |
| V6 Cryptography | no | SigV4 signing is untouched. |
| V7 Error Handling and Logging | **yes — the active one** | Every new log line must carry no URL, header value, token, or response body (`AUTH-02`). The precedent to copy is `describeFailure`, which quotes only a route label and an HTTP status and never the error's own message, because "an arbitrary error's message can name a URL" `[VERIFIED: src/runtime/accountRuntime.ts:184-192]`. The vendor `deviceId` **is** admitted (2026-08-29 ruling), and the Phase 4 privacy test asserts it is PRESENT `[VERIFIED: STATE.md, mid-execution ruling 1]`. |
| V8 Data Protection | yes | `D-06` must not add telemetry to `accessory.context`, which Homebridge writes to disk in plain text and keeps in backups `[VERIFIED: src/persistence/accessoryContext.ts:4-9]`. Finding 4 shows no telemetry is needed. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| A degradation log line quoting the vendor error message, which may embed a URL or token | Information Disclosure | Fixed message plus a route label and status, as `describeFailure` already does |
| An automatic retry after credential rejection extending the vendor's thirty-day block | Denial of Service (self-inflicted) | `halted` is terminal; nothing this phase adds may schedule a retry |
| A stale value reading as trustworthy after restart | Spoofing (of device state) | The `D-06` marking pass — this phase's core mitigation |
| A monitoring-path failure presented as a device fault | Spoofing (of device state) | `RES-03`'s remaining sentence; `offlineValues` reads `offlineConfirmed` alone `[VERIFIED: src/accessories/serviceCatalogue.ts:579-581]` |
| Accessory context growing to hold secrets | Information Disclosure | `accessoryContext.ts`'s stated contract; no change proposed |

## Sources

### Primary (HIGH confidence — read in this session)

- `src/runtime/accountRuntime.ts` — poll loop, shadow wiring, `monitoringPathNow`, `launchFailure`,
  `commands`
- `src/cloud/shadow.ts` — `ShadowDisconnectReason`, `handleMessage`, `handleClose`, `handleConnect`
- `src/cloud/auth.ts`, `src/cloud/errors.ts`, `src/cloud/api.ts` — halting, terminal errors, the
  `idToken()` gate on every REST call
- `src/device/state.ts` — `DeviceSnapshot`, `receivedAt` semantics, `notify()`'s change filter
- `src/device/health.ts` — `MonitoringPath`, `TrustScope`, `DistrustReason`, `UntrustedScope`,
  `DeviceHealth`
- `src/accessories/basementGuardian.ts` — `update()`, `distrustReasonsOf`, `reportDegradation`,
  `reportedControlValue`, `publishRows`, `republishPublishedRows`
- `src/accessories/serviceCatalogue.ts` — `ProjectionInput`, `isRowTrusted`, `isRowFullyTrusted`,
  `toRow`, every row definition, `ensureService`, `publishValue`, `seedConfiguredName`
- `src/accessories/controls.ts` — `LOCAL_REFUSALS`, `hasNoFreshState`, `statusOf`, `answerWrite`
- `src/accessories/reconciliation.ts`, `src/runtime/failureLog.ts`, `src/runtime/clock.ts`,
  `src/runtime/timers.ts`, `src/persistence/accessoryContext.ts`, `src/config.ts`, `src/platform.ts`
- `test/accessories/hapImportScope.test.ts`, `test/accessories/timerFreedom.test.ts` — the two gate
  templates
- `features/support/fakeHomebridgeApi.ts`, `features/support/world.ts`,
  `features/support/publishedServices.ts`, `features/support/fakeShadowBroker.ts`,
  `features/support/steps/homekit.ts`, `features/support/steps/runtime.ts`,
  `features/degradedOperation.feature`, `features/lifecycle.feature`
- `node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js` (2.2.2) — `updateValue`,
  `handleGetRequest`, `serialize`
- `node_modules/homebridge/dist/bridgeService.js` (2.4.0) — cached-accessory load path
- `package.json`, `.fallowrc.json`, `.github/workflows/build.yml`

### Primary (HIGH confidence — planning artifacts)

- `.planning/intel/constraints.md` — the measured wire shapes, especially `:525-533`
- `.planning/REQUIREMENTS.md` — RES-01, RES-03, RES-04, CONF-05 and the traceability table
- `.planning/phases/05-degraded-operation-and-recovery/05-CONTEXT.md`
- `.planning/phases/03-safety-monitoring-in-homekit/03-CONTEXT.md` — D-05, D-06, D-09, D-10
- `.planning/phases/04-pump-records-and-official-controls/04-CONTEXT.md` — D-04, D-06, D-07
- `.planning/phases/04-pump-records-and-official-controls/04-VERIFICATION.md` — W-1, W-2, W-3
- `.planning/phases/04-pump-records-and-official-controls/04-UAT.md` — the six open human items
- `.planning/STATE.md` — the pre-commit correction, the commit-handler hazard, the Phase 3/4 rulings

### Secondary (MEDIUM confidence)

None used. No external documentation was consulted, because every question this phase raises is
answerable from this repository or its pinned dependencies, and a web source would rank below both.

### Tertiary (LOW confidence)

None.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new dependency; every version read from `package.json` and the
  corresponding `node_modules` manifest.
- Architecture: HIGH — every attachment point, conflict, and composition rule traced to a quoted
  source line.
- Pitfalls: HIGH — each of the six is grounded in a specific quoted line or a recorded prior defect.
- `D-10` presentation mechanism: HIGH — verified against the pinned HAP source.
- `D-10` Apple Home rendering (A1, A3): **LOW** — unverifiable in this environment, deferred to the
  real-home session by `D-10`'s own text.
- Validation architecture: HIGH for the mutation list; MEDIUM for A5 (the harness change's blast
  radius across 78 existing scenarios is unknown until it is run).

**Research date:** 2026-09-01
**Valid until:** 2026-10-01 for the in-repo findings, which change only when the code does. The two
Apple Home questions have no expiry — they are open until a human answers them.

---

*Phase: 5-Degraded Operation and Recovery*
