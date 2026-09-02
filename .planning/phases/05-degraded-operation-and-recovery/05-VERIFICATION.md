---
phase: 05-degraded-operation-and-recovery
verified: 2026-09-02T10:58:15Z
status: gaps_found
score: 1/4 roadmap success criteria verified (7 plan-frontmatter truths also fail)
behavior_unverified: 0
overrides_applied: 0
decision_coverage:
  honored: 12
  total: 12
  not_honored: []
gaps:
  - truth: "Users can distinguish pump-controller link loss, vendor-confirmed device offline, and a degraded REST/MQTT monitoring path; only the first two use their defined safety adapters. (ROADMAP SC-2)"
    status: failed
    reason: >-
      Two independent defects. (a) CR-01: withdrawing trust from a scope also stops that scope
      publishing, so with the shadow silent and REST healthy a flooded poll is decoded, validated by
      the family, and then discarded -- HomeKit keeps showing "no leak" while the plugin holds
      "leak". The user is not shown a degraded path; they are shown a false normal. (b) WR-01: with
      the controller link lost and BOTH transports down, `Pump Controller Link Lost` still publishes
      an activated sensor with `Status Active = true`, and six scopes report `controller-link-lost`
      when the real cause is `unreachable`. A device adapter reads trustworthy while the plugin is
      totally blind, which is exactly the conflation this criterion forbids.
    artifacts:
      - path: src/accessories/serviceCatalogue.ts
        issue: >-
          `isRowTrusted` treats the monitoring reason `unreachable` like a field-validation failure,
          so `project()` returns `[]` and `publishRows` pushes nothing but `StatusActive`. A
          monitoring outage means the plugin is seeing less, never that the value it did receive is
          doubtful.
      - path: src/accessories/basementGuardian.ts
        issue: >-
          `distrustReasonsOf` (lines 323-345) applies the controller-link layer before the
          monitoring layer, and `pump-controller-link-lost` is the one row that tolerates
          `controller-link-lost`, so that reason wins the `fault` scope permanently and the
          monitoring layer can never reach it.
    missing:
      - "Let a row keep publishing a value received on a still-working transport while `StatusActive` alone carries the doubt, so a monitoring withdrawal marks rather than withholds."
      - "Apply the monitoring layer before the controller-link layer so `unreachable` (tolerated by no row) beats `controller-link-lost` (tolerated by one), while `invalid` still wins over both."
      - "A test that polls a CHANGED, flooded payload during shadow silence and asserts `Leak Detected` reached HomeKit with `Status Active` still false. Without it the fix is unprovable."
      - "A test asserting `Pump Controller Link Lost` reports `Status Active` as false under both transports lost when the last snapshot had `serial_communications: false`."
  - truth: "Restart without fresh cloud state ... prevents commands until valid state and command transport return. (ROADMAP SC-3, second half)"
    status: partial
    reason: >-
      The cached-state half is delivered and verified. The command half is delivered only for an
      accessory a successful inventory has already built. In the window this criterion names -- a
      restart with the cloud unreachable -- `configureAccessory` marks the restored services stale
      but binds no `onSet` handler, and no `update()` runs until the first successful REST
      inventory, which is unbounded. A press on the restored `System Self-Test` or `Alarm Mute`
      Switch is therefore not refused; it is silently accepted. Confirmed against the pinned real
      HAP 2.2.2 as well as the stand-in: `handleSetRequest(true)` with no registered handler
      resolves and stores the value. Every other refusal in this phase names its cause; this one is
      silent and the toggle flips in Apple Home.
    artifacts:
      - path: src/accessories/basementGuardian.ts
        issue: "`bindControlRow` is reachable only from `publishRows`, which runs only inside `update()`."
      - path: src/platform.ts
        issue: "`configureAccessory` (lines 571-576) marks stale and stores the accessory; it binds no control handler."
    missing:
      - "Bind the control rows to whatever restored services already exist, before the first update. With `monitoring.commandTransportReady` already defaulting to false, the existing `hasNoCommandTransport` rule produces the right -70412 refusal the moment a handler exists."
  - truth: "Fresh family-valid input clears the matching degradation promptly. (ROADMAP SC-4, first half)"
    status: failed
    reason: >-
      CR-02 confirmed by probe against the built tree. `reportMonitoringHealth()` runs only from
      `recordPollSuccess()` and `recordPollFailure()`. A shadow message arriving after a silence
      produces ZERO pushes; the latch clears only at the next poll tick. `pollIntervalSeconds`
      accepts up to 3600, so a flood detected one second after the live path recovers can go
      unreported in HomeKit for an hour. D-05 ratifies lazy DETECTION on the poll tick; it does not
      ratify lazy CLEARING, and D-11 is explicit that "a single good observation restores it".
      Combined with CR-01, every live message arriving in the recovery window is decoded, stored
      into `lastDecoded`, and then not published.
    artifacts:
      - path: src/runtime/accountRuntime.ts
        issue: >-
          `onReportedPatch` (lines 508-516) calls `health.recordShadowMessage()` and reports
          nothing; `handleShadowConnected()` reports nothing either. Only the two poll recorders
          call `reportMonitoringHealth()`.
    missing:
      - "Report from the arrival callback when the silence latch actually moves, guarded by a `reportedShadowSilent` flag so it fires once per recovery rather than on every heartbeat. No timer is introduced, so D-05's testability constraint is untouched."
      - "A scenario that clears the silence under a LONG poll interval. `An identical heartbeat clears the shadow silence` runs under `a short poll interval`, so it passes without discriminating this."
  - truth: "Authentication rejection remains a clear user-actionable communication failure. (ROADMAP SC-4, second half; RES-04 last clause)"
    status: failed
    reason: >-
      CR-03 confirmed by probe. `halted = true` is assigned in exactly one place, `launchFailure`,
      reachable only from `launch()` / `relaunch()`. After `startBackgroundWork()` has run, no path
      sets it. `runPoll`'s catch does not inspect the error type; `refreshCredentials`'s catch
      swallows everything into `ROTATION_FAILED`. Probe result for a run that starts successfully
      and then meets `AuthRejectedError` on the next poll -- `credentialsRejected: false`, zero
      `AUTHENTICATION_STOPPED` lines, the log says the generic `Device discovery failed.`, no
      accessory goes unreadable, and the poll loop keeps waking. A user who changes their vendor
      password while Homebridge is running -- the common case -- gets only `Status Active - No`,
      which is precisely the presentation D-10 rejects for this cause as "too easy to miss for a
      failure only the user can resolve". The whole D-10 presentation is reachable only through a
      restart.
    artifacts:
      - path: src/runtime/accountRuntime.ts
        issue: "`runPoll` catch (lines 617-635) records a generic poll failure for a terminal auth error; `refreshCredentials` catch (lines 594-599) swallows it as a rotation failure."
      - path: features/degradedOperation.feature
        issue: "`Credential rejection makes every service unreadable` drives the refusal through `When the plugin restarts`, so it exercises only the launch path that already works."
    missing:
      - "Route `AuthRejectedError` and `AuthHaltedError` out of the poll loop through the same terminal branch: set `halted`, record `AUTHENTICATION_STOPPED`, push the trust, and stop `runPolls` looping."
      - "A runtime case that succeeds on the first `devices` call and rejects the second with `AuthRejectedError`, asserting the pushed `credentialsRejected: true` and the `AUTHENTICATION` line."
      - "A platform case that the restored accessories go unreadable from a mid-run rejection."
  - truth: "`REQUIREMENTS.md` no longer contradicts itself: RES-04 carries a completion state that agrees with what this phase shipped. (05-05 must_have)"
    status: failed
    reason: >-
      `05-05-SUMMARY.md` moved RES-04 from `Pending` to `Complete`. Two of RES-04's four clauses are
      not delivered. `commands stay disabled until fresh valid state returns` fails in the failed
      restart window the requirement itself names. `only explicit credential rejection yields a
      persistent communication failure requiring user action` holds in the `only` direction but not
      the forward one: an explicit rejection after a successful start yields nothing. The row is not
      accurate.
    artifacts:
      - path: .planning/REQUIREMENTS.md
        issue: "Line 147 marks RES-04 `Complete`; line 67's own text is not satisfied."
    missing:
      - "Return RES-04 to a state that matches what shipped, or close the two gaps above first."
  - truth: "README states the delay is to the report and never to a safety state, and that the plugin holds no value back while it waits. (05-05 must_have)"
    status: failed
    reason: >-
      The README says it and the code does not do it. Per CR-01 the plugin does hold values back --
      once a scope is withdrawn no new value for it reaches HomeKit at all, including values from
      the transport that is still working -- and `Status Active` IS the safety state the delay
      applies to. The second claim, that on credential rejection "Every service then answers `No
      Response` in Apple Home", is also inaccurate as written: `markServicesUnreadable` pushes the
      status onto `StatusActive` alone, and a probe confirms `Leak Detected` still answers its
      retained value under a success status. Documented behaviour a safety plugin does not have is
      worse than silence.
    artifacts:
      - path: README.md
        issue: "Lines 141-149 assert behaviour CR-01 and CR-02 contradict."
      - path: CHANGELOG.md
        issue: "Lines 24-27 omit that the marked services also stop updating."
    missing:
      - "After CR-01 and CR-02 are closed the first claim becomes true. Until then it must not ship."
      - "Restate the No Response claim as what the code does: every service that reports whether the plugin vouches for it stops answering that report, which Apple Home draws as No Response for the accessory."
deferred: []
behavior_unverified_items: []
human_verification:
  - test: "Install this build over an accessory cache written by a release that predates it. Restart Homebridge with the vendor cloud unreachable. Open the accessory in Apple Home."
    expected: "The tile is present, showing the reading the previous run left, with `Status Active - No` under Details, and no service carries a characteristic it did not have before the upgrade."
    why_human: "insufficient_spec -- no test in this repository has met a real Homebridge accessory cache; the harness restores through a JSON round trip of its own design. This is 05-02's declared `verification: backstop` truth, whose second half rests on Homebridge's own `configureAccessory` / `didFinishLaunching` call ordering. Extends `04-UAT.md` human item 1."
  - test: "Force a credential rejection on a real paired home. Open the greyed-out accessory, try to reach its cached values, and trigger an automation built on one of its sensors."
    expected: "An owner can still reach the cached values, automations built on the sensors survive, and -70402 is the status Apple Home renders as No Response."
    why_human: "D-10 mandates this check by name. A No Response accessory is greyed out in Apple Home, which sits in tension with RES-04's own `accessories remain present and visibly stale` -- preserve-and-mark risks becoming preserve-and-hide. A negative finding reopens D-10, not RES-04. Nobody has tested it."
  - test: "Force a degraded monitoring scope on a real paired home and confirm the rendering."
    expected: "The `Status Active` row reads `No`, the tile stays present, and the last value is retained."
    why_human: "Apple Home rendering cannot be asserted from the plugin side. Rides along with the open G-003 / G-004 session."
---

# Phase 5: Degraded Operation and Recovery — Verification Report

**Phase Goal:** Users keep cached safety state through restart and can tell vendor-confirmed device
offline apart from a degraded monitoring path. Each degradation clears once fresh valid data
returns.

**Verified:** 2026-09-02T10:58:15Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## How this was verified

Every finding below was reached by executing the shipped code, not by reading it. Four probe scripts
drove the built `dist-test` tree: two over `createAccountRuntime` with the real failure log, retry
policies and injected clock; two over `createBasementGuardianAccessory` with the real `Gemini`
family, the real service catalogue, and the real `markRestoredServicesStale` /
`markServicesUnreadable` passes. One check ran against the pinned real `@homebridge/hap-nodejs`
2.2.2. Transcripts are quoted inline.

The suite state was established independently and is not evidence here: 1295 unit tests, 89 Cucumber
scenarios, 894 steps, all green; coverage 100/100/100; regression gate clean. Three of the four
findings below are invisible to that suite, which is the point of this report.

## Goal Achievement

### Observable Truths — ROADMAP Success Criteria

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-1 | `Basement Guardian Offline` activates only after the configured number of successful REST snapshots report the device disconnected, and a failed REST request never counts toward that confirmation | ✓ VERIFIED | Probe P1 over the real Gemini adapter with `offlineConfirmationPollCount: 2`: contact `0` after one connected poll, `0` after one disconnected poll, `1` after two, back to `0` on the next connected poll. Probe P1b: two disconnected `shadow`-sourced updates leave it at `0`. `offlineCount` advances only under `if (source === 'poll')` (`basementGuardian.ts:848, 879`), and a failed REST request produces no snapshot at all, so it cannot reach the counter |
| SC-2 | Users can distinguish pump-controller link loss, vendor-confirmed device offline, and a degraded REST/MQTT monitoring path; only the first two use their defined safety adapters | ✗ FAILED | Half holds, half does not. Neither adapter is ever activated BY a monitoring failure (probe P3: both contacts stay `0` with both transports down) — that part is real. But CR-01 makes the degraded path present itself as a false normal, and WR-01 makes `Pump Controller Link Lost` read trustworthy while the plugin is blind. See below |
| SC-3 | Restart without fresh cloud state leaves cached accessories and values available but visibly stale and prevents commands until valid state and command transport return | ⚠️ PARTIAL — counted as FAILED | Cached-state half VERIFIED (probe R1). Command half fails in the restart window the criterion names (probe R2, corroborated against real HAP 2.2.2) |
| SC-4 | Fresh family-valid input clears the matching degradation promptly, while authentication rejection remains a clear user-actionable communication failure | ✗ FAILED | Both halves. Shadow silence does not clear on the message that proves recovery (CR-02, probe). A credential rejection after a successful start never reaches the terminal branch (CR-03, probe) |

**Score:** 1/4 roadmap success criteria verified.

### What genuinely holds — credit where it is due

This phase did real work and most of the machinery is sound. Verified against the running code:

| Delivered behaviour | Evidence |
|---|---|
| The offline-confirmation contract (SC-1) is intact end to end | Probes P1, P1b — the run advances only on successful REST snapshots and resets on the first connected one |
| The two transports are genuinely distinguished, and only shadow loss withdraws live-value trust | Probe P5: REST-only degradation leaves `Sump Pit Flood` `Status Active = true` and withdraws `connectivity` alone (`distrust = connectivity:unreachable`), exactly as the narrowed D-02 specifies |
| `monitoringPathNow()` is byte-identical and the trust decision is a second projection beside it | Established independently; the fourteen prior assertions pass unmodified |
| Thresholds are real and boundary-correct | `REST_FAILURE_THRESHOLD = 2`, `HEARTBEAT_INTERVAL_MS * MISSED_HEARTBEATS_BEFORE_SILENT` compared with `>=`, no division or rounding. Silence is derived from `onReportedPatch` arrival stamps against the injected clock, never from the socket flag and never from `snapshot.receivedAt` — the two sources D-05 forbids by name |
| A REST poll does not clear a shadow-silence degradation | `recordRestSuccess()` touches only `consecutiveRestFailures`; `lastShadowMessageAt` is moved by `recordShadowMessage()` alone (`monitoringHealth.ts:143-162`) |
| The restart marking pass works and is real shared code | Probe R1: 17 services marked, `Leak Detected` retained at `1`, `Status Active` `false`, reads still answer. `markRestoredServicesStale` is one exported function called by both `platform.configureAccessory` and `features/support/world.ts` |
| No accessory read path can reach the network | Zero `onGet` handlers under `src/`, no `src/accessories/` module imports `src/cloud/`, and the static gate carries real enumeration floors (10 / 40 / 104) with non-vacuous planted-fixture controls |
| Command gating on a live accessory is correct and names its cause | Probe R3: transport unready → `-70412`, `"the plugin has no way to reach the vendor right now"`, nothing sent. Transport ready → sent. Shadow silent (state withheld) → `-70412`, `"the plugin has no fresh state for it"`, nothing sent. The refusal order is pinned by a test |
| Credential rejection makes services unreadable while retaining values | Probe R4: 17 services marked, `Status Active` throws, `Leak Detected` answers its retained `1`. It is the only cause in the plugin that does this |
| `markMonitoring` stores outside the early return and compares all four members | `basementGuardian.ts:807-819`, established independently |
| The degradation thresholds are not configurable | `test/config.test.ts:414` asserts the resolved config key set with `deepStrictEqual` |
| The false-cause log line was fixed | `reportDegradation()` excludes both `controller-link-lost` and `unreachable`, so a transport outage no longer claims a profile stopped validating |
| No debt markers, no skipped tests | Scan over all 31 files this phase changed: zero `TBD`/`FIXME`/`XXX`, zero `TODO`/`HACK`/`PLACEHOLDER`, zero `.skip`/`.todo` |

### Plan `must_haves` truths the code does NOT do

The orchestrator asked directly. Seven, across three plans:

| Plan | Truth as written | What the code does |
|---|---|---|
| 05-01 | "A trust withdrawal retains every published value and **changes only whether the plugin vouches for it**." | The first clause holds; the second does not. A withdrawal also stops the scope publishing, so new valid values from a working transport are discarded (CR-01) |
| 05-01 | "Clearing is matched to cause ... **one good observation clears its own cause immediately** rather than after a confirmation run (D-11)." | True for REST. False for shadow: the observation clears nothing until the next poll tick (CR-02) |
| 05-01 | "A heartbeat carrying values identical to the previous one **clears** shadow silence, because arrival is stamped at `onReportedPatch` upstream of the store's change filter." | The stamping is correct and is genuinely upstream of the change filter. The clearing is not driven from the arrival. The scenario proving this runs under `a short poll interval`, which is what lets it pass |
| 05-03 | "The command transport is unready **while the runtime is stopped**, while authentication is halted, and until the first REST inventory has succeeded." | `commandTransportReadyNow()` answers correctly, but `stop()` pushes nothing (probe: 0 pushes emitted by `stop()`), so every accessory keeps `commandTransportReady: true` from the last successful poll. The tier that decides never learns |
| 05-04 | "A vendor refusal of the account credentials makes **every published service unreadable**." | Only when the refusal arrives at launch. A refusal after a successful start reaches nothing (CR-03) |
| 05-04 | "Nothing this phase adds retries after a credential rejection ... **no timer, no relaunch, and no poll follows it**." | True for a launch-time refusal. After a mid-run refusal the poll loop keeps waking. It sends no vendor traffic — `auth.ts:452-453` throws `AuthHaltedError` before the request, so the thirty-day block is not extended — but the runtime never stops either |
| 05-05 | "The README states ... **It delays a report, never a safety state**" and "a refused account credential ... **Every service then answers `No Response`**" | The README states both. Neither is true of the shipped code (WR-03) |

The remaining plan truths hold. In particular 05-02's five non-backstop truths are all verified, and
its sixth is a declared `verification: backstop` item routed to human verification below.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/runtime/monitoringHealth.ts` | The account-wide monitoring-trust projection | ✓ VERIFIED | 163 lines, exists, substantive, wired from `accountRuntime.ts` |
| `test/runtime/monitoringHealth.test.ts` | Threshold, boundary, precision, clearing cases | ✓ VERIFIED | 241 lines |
| `features/degradedOperation.feature` | The end-to-end transport matrix | ⚠️ PRESENT, EVIDENCE WEAK | 11 scenarios, all green — and three of them cannot see the defects in the behaviour they cover. See Test Quality Audit |
| `src/accessories/staleMarking.ts` | The restart and credential passes | ✓ VERIFIED | Both exported, both called, both proven by probe |
| `test/accessories/staleMarking.test.ts` | Unit cases for the pass | ✓ VERIFIED | 281 lines |
| `features/support/fakeHomebridgeApi.ts` | A cache carrying services and last values across a restart | ✓ VERIFIED | The deliberate service-dropping choice at lines 106-110 was reversed, which is what gives every D-06 scenario something to be wrong about |
| `test/accessories/accessoryReadPathScope.test.ts` | The static read-path gate | ✓ VERIFIED | 236 lines, real enumeration floors, planted-fixture controls per spelling. (The `contains: accessoryReadPathScope` pattern check fails only because the plan named the file's own basename; the file is substantive) |
| `src/accessories/controls.ts` | The command-transport refusal beside the existing local refusals | ✓ VERIFIED | Probe R3 |
| `src/accessories/serviceCatalogue.ts` | `publishPersistentFailure`, the one narrow production call site | ✓ VERIFIED | One production caller |
| `test/accessories/hapWriteFidelity.test.ts` | The push-an-error fidelity case against the pinned real HAP | ✓ VERIFIED | 113 lines. The strongest artifact in the phase: one script driven against both HAPs, whole record compared. (Same cosmetic `contains` miss as above) |
| `test/config.test.ts` | The assertion that no threshold became a config key | ✓ VERIFIED | `deepStrictEqual` on the resolved key set |
| `README.md` | The user-facing account of degraded operation | ✗ INACCURATE | Present and well written; two claims contradict the shipped behaviour |

### Key Link Verification

| From | To | Via | Status |
|---|---|---|---|
| `accountRuntime.ts` | `monitoringHealth.ts` | arrival stamping and the REST run | ✓ WIRED |
| `accountRuntime.ts` | `platform.ts` | `onMonitoringHealth` carries `MonitoringTrust` out | ✓ WIRED |
| `platform.ts` | `basementGuardian.ts` | `applyMonitoringHealth` → `markMonitoring` fan-out | ✓ WIRED |
| `basementGuardian.ts` | `serviceCatalogue.ts` | the monitoring cause as a third distrust layer | ⚠️ WIRED BUT WRONG — reaches every row through the *withholding* mechanism rather than the marking one (CR-01) |
| `platform.ts` | `staleMarking.ts` | `configureAccessory` calls the pass | ✓ WIRED |
| `world.ts` | `staleMarking.ts` | the harness calls the same exported function | ✓ WIRED |
| `accountRuntime.ts` | `platform.ts` | the terminal auth branch pushes `credentialsRejected: true` | ⚠️ HOLLOW — the branch exists and is wired, but is unreachable after `startBackgroundWork()` (CR-03) |
| `platform.ts` | `staleMarking.ts` | `applyMonitoringHealth` → `markServicesUnreadable` | ✓ WIRED (downstream of the hollow link above) |
| `staleMarking.ts` | `serviceCatalogue.ts` | the pass pushes through `publishPersistentFailure` | ✓ WIRED |
| `README.md` | `src/config.ts` | the documented 300–3600 second bound | ✓ WIRED |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Reaches HomeKit | Status |
|---|---|---|---|---|
| `Sump Pit Flood` / `Leak Detected` | flood verdict from a REST poll during shadow silence | real REST poll, family-validated | **No** | ✗ DISCONNECTED — decoded, validated, discarded |
| `Sump Pit Flood` / `Leak Detected` | flood verdict from a shadow message during recovery | real shadow message | **No** (until the next poll tick) | ✗ DISCONNECTED |
| `Basement Guardian Offline` / `Contact Sensor State` | `offlineCount >= threshold` | successful REST snapshots only | Yes | ✓ FLOWING |
| Restored services / `Status Active` | `markRestoredServicesStale` | the restart pass | Yes | ✓ FLOWING |
| Every service / `Status Active` status code | `credentialsRejected` | terminal auth branch | Yes at launch, **No** mid-run | ⚠️ PARTIAL |

### Behavioural Spot-Checks

All run against the built `dist-test` tree. Output quoted verbatim.

| Behaviour | Probe | Result | Status |
|---|---|---|---|
| Offline confirmation counts successful disconnected snapshots only | P1 | `1 connected → 0`, `1 disconnected → 0`, `2 disconnected → 1`, `connected → 0` | ✓ PASS |
| Shadow-sourced updates do not advance the run | P1b | `after 2 disconnected SHADOW updates Offline contact = 0` | ✓ PASS |
| A flooded poll during shadow silence reaches HomeKit | P2 | `FLOODED poll leak = 0 statusActive = false` → `a flooded reading from the WORKING transport is DISCARDED`; the `1` appears only when the silence clears | ✗ FAIL (CR-01) |
| A monitoring failure never activates the two device adapters | P3 | both down: `offline = 0 link = 0` | ✓ PASS |
| Under a total blackout nothing reads as trustworthy | P4 | `link lost, BOTH down: link contact = 1 statusActive = true` | ✗ FAIL (WR-01) |
| REST-only degradation leaves live values trusted | P5 | `flood statusActive = true, offline statusActive = false, distrust = connectivity:unreachable` | ✓ PASS |
| A returning shadow message clears the silence latch | CR-02 A/B | `pushes at message arrival: 0`; latch clears only `after next poll tick` | ✗ FAIL (CR-02) |
| A mid-run credential rejection reaches the terminal branch | CR-03 | `credentialsRejected = false`, `AUTHENTICATION_STOPPED lines: 0`, log says `Device discovery failed.`, poll loop keeps waking | ✗ FAIL (CR-03) |
| `stop()` pushes a final trust | WR-07 | `pushes emitted by stop(): 0`, accessories keep `commandTransportReady: true` | ✗ FAIL (WR-07) |
| Restart leaves cached values present and marked | R1 | `marked 17 services`, `leak = 1`, `statusActive = false`, read `answers` | ✓ PASS |
| A press on a restored switch before the first poll is refused | R2 | `press outcome = ACCEPTED (no error)`, `commands sent = 0`, `switch value after press = true` | ✗ FAIL (WR-02) |
| Real HAP 2.2.2 agrees a set with no handler is silently accepted | real-HAP check | `handleSetRequest resolved: undefined`, `value after: true`, `listeners on SET: 0` | ✗ CONFIRMS R2 |
| Command gating on a live accessory names its cause | R3 | `-70412` + `"no way to reach the vendor right now"`; `-70412` + `"no fresh state for it"`; nothing sent in either | ✓ PASS |
| Credential rejection makes services unreadable and retains values | R4 | `marked 17`, `Status Active read = throws`, `Leak Detected read = answers 1` | ✓ PASS |

### Probe Execution

N/A — this project defines no `scripts/*/tests/probe-*.sh`. The verifier's own probes above serve
the same function and their transcripts are quoted.

### Test Quality Audit

No skipped tests, no circular fixtures, no coverage exceptions. The problem is not test hygiene; it
is that three green scenarios cannot see the defect in the behaviour they cover.

| Test | Linked | Assertion level | Verdict |
|---|---|---|---|
| `degradedOperation.feature` — "Shadow silence withdraws trust while polling continues" | RES-03 | Value (`Status Active`) | ⚠️ BLIND to CR-01. It polls with the SAME telemetry and asserts `the "Sump Pit Flood" sensor is not activated` after a DRY poll, which passes either way |
| `basementGuardian.test.ts` — "retains every published value across a lost monitoring path and moves the trust flag alone" | RES-03 | Value | ⚠️ Asserts the defect's own signature: that nothing moved is exactly what CR-01 produces |
| `degradedOperation.feature` — "An identical heartbeat clears the shadow silence" | RES-01, D-11 | Value | ⚠️ BLIND to CR-02. Runs under `a short poll interval`, so the poll-tick clearing and the arrival clearing are indistinguishable |
| `degradedOperation.feature` — "Credential rejection makes every service unreadable" | RES-04, D-10 | Value + read-throws | ⚠️ BLIND to CR-03. Drives the refusal through `When the plugin restarts`, so it covers only the launch path |
| `degradedOperation.feature` — "A transport outage leaves every service readable" | RES-04 | Existence-of-answer | ⚠️ WR-06: `assertReadAnswered` inverts a predicate that returns `false` for an ABSENT characteristic, so an absent characteristic reads as "answers a read" — the exact state CR-01 produces on a first run |
| `accountRuntime.test.ts` — every credential-rejection case (lines 594, 994, 1164, 1181, 1459) | RES-04, D-10 | Value | ⚠️ All five reject the FIRST `devices` call. The mid-run class is untested |
| `hapWriteFidelity.test.ts` | D-17, SAFE-08 | Behavioural, against the pinned real HAP | ✓ STRONG |
| `accessoryReadPathScope.test.ts` | RES-04, D-09 | Static, with enumeration floors and planted-fixture controls | ✓ STRONG |

**Disabled tests on requirements:** 0. **Circular patterns:** 0. **Blind-but-green tests on
phase-central behaviour:** 6 → ⚠️ WARNING, and the direct cause of why a fully green suite coexists
with three blockers. This is the same shape `04-VERIFICATION.md` W-1 recorded, arriving through a
different door: the phase built the harness improvements it promised, and then wrote the assertions
against payloads that do not move.

### Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|---|---|---|---|
| RES-03 | 05-01 | ⚠️ PARTIAL | The literal text holds: the adapter's activation rule is intact (P1), a failed request never counts, and a monitoring-path loss raises no false physical-device alert (P3) and is diagnosed under its own failure-log kind. What fails is the phase's own delivery of the distinction to the user (SC-2) and the promptness of clearing (SC-4) |
| RES-04 | 05-02, 05-03, 05-04 | ✗ BLOCKED | Two of four clauses fail. "getters return cached values without network calls" ✓ (static gate). "accessories remain present and visibly stale" ✓ (R1). "commands stay disabled until fresh valid state returns" ✗ in the failed-restart window the clause names (R2). "only explicit credential rejection yields a persistent communication failure requiring user action" ✗ in the forward direction (CR-03) |
| CONF-05 | 05-05 | ✓ SATISFIED | No threshold became a setting; the resolved key set is asserted |

**Is the `RES-04: Complete` row now accurate? No.** Plainly: `05-05-SUMMARY.md` moved RES-04 from
`Pending` to `Complete`, and the requirement's own text is not satisfied. A user who changes their
vendor password while Homebridge runs gets a generic "Device discovery failed." and a `Status Active
- No` row — not the persistent, user-actionable communication failure RES-04's last clause requires.
A user who restarts with the cloud unreachable can press `System Self-Test` and have HomeKit tell
them it worked. Marking RES-04 `Complete` makes a later audit read a gap as shipped, which is the
exact failure 05-05's own prohibition forbids: "MUST NOT record a requirement as complete while that
requirement's own delivery notes say part of it is still owed."

### Decision Coverage

All 12 trackable `05-CONTEXT.md` decisions are honored by shipped artifacts (12/12, non-blocking
heuristic gate). Worth reading against the findings above: the decisions were translated into code,
and two of them — D-02's marking semantics and D-11's clearing-on-observation — were translated into
code that does something narrower than the decision says. Coverage is not correctness.

### Prohibitions

Every prohibition in all five plans carries `status: flagged-unverified`. Two are now
counter-indicated by the shipped behaviour:

| Prohibition | Plan | Disposition |
|---|---|---|
| "MUST NOT blank, default, or reset a retained value when trust is withdrawn. Preserve-and-mark must not become preserve-and-hide." | 05-01 | ⚠️ **Honoured in letter, broken in spirit.** Nothing is blanked. But a valid new value is withheld, so preserve-and-mark became preserve-and-freeze, and the frozen value reads "no leak" while the plugin holds "leak" |
| "MUST NOT let a press reach the vendor while the plugin cannot vouch for the device's current state." | 05-03 | ✓ Honoured — but its converse is not: in the restart window a press reaches nothing AND is reported as successful (R2) |
| The remaining 22 | all | flagged-unverified; no enforcement evidence wired. Per the fail-closed default these are recorded as unverified, not green |

### Anti-Patterns Found

None. Zero debt markers, zero skipped tests, zero placeholder returns across all 31 files this phase
changed.

## Gaps Summary

The phase built almost everything it promised and built most of it well. The offline-confirmation
contract, the two-transport distinction, the threshold arithmetic, the restart marking pass, the
static read-path gate, the live-accessory command gating, the HAP fidelity case and the
configuration-key assertion are all real, all wired, and all confirmed by driving the shipped code.

Three defects sit past that, and each of them lands on the one thing this project exists to prevent.

**The withdrawal mechanism was reused for a cause whose values are not in doubt.** Marking a scope
untrustworthy also stops it publishing. That is right when a field failed validation — the value is
bad. It is wrong when a transport went quiet — the values still arriving on the transport that works
are fine. So with the shadow silent and REST healthy, a flooded pit is decoded, family-validated,
and thrown away, while Apple Home draws "no leak" on the tile and no automation fires. Apple Home
does not render `Status Active` on the tile, so the one signal carrying the doubt is the one the
owner will not see.

**Recovery waits for a clock rather than for evidence.** The message that proves the live path is
carrying again clears nothing. The latch moves at the next poll tick, up to an hour later at the
configured maximum, and every message in that window is decoded, stored, and not published. D-11
says a single good observation restores trust because it is direct evidence. The code says a poll
tick does.

**The one failure that requires a user is unreachable in the case a user will actually hit.** A
credential rejected at launch produces the full D-10 presentation. A credential rejected while
Homebridge is running — a password changed at the vendor, an account blocked — produces a generic
"Device discovery failed." forever, and the poll loop keeps waking against a locally halted auth
client. Every credential-rejection test in the repository rejects the first `devices` call, so the
whole class went untested and the feature reads as delivered.

Underneath all three is one pattern the suite could not catch: the scenarios that cover these
behaviours assert against payloads that do not move, under intervals that collapse the distinction,
or through the one entry path that works. `04-VERIFICATION.md` W-1 recorded this shape a phase ago.
The harness improvements this phase shipped were the right answer to it; the assertions written on
top of them were not.

None of the gaps is deferred. Phase 6 is release packaging and addresses none of this.

---

_Verified: 2026-09-02T10:58:15Z_
_Verifier: Claude (gsd-verifier)_
