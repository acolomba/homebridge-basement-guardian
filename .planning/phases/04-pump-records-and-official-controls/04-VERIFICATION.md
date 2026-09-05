---
phase: 04-pump-records-and-official-controls
verified: 2026-09-01T20:06:25Z
status: human_needed
score: 17/17 must-haves verified
behavior_unverified: 0
overrides_applied: 0
verification_method: >-
  Executed the shipped code. 100 behavioural probe checks against the compiled modules
  (dist-test), one loopback HTTP server driving the real command path, one probe against the
  real pinned @homebridge/hap-nodejs, and six live mutations of shipped source to prove the
  load-bearing assertions are not vacuous. Working tree restored and re-verified green.
decision_coverage:
  honored: 17
  total: 17
  not_honored: []
requirements:
  CTRL-01: satisfied
  CTRL-02: satisfied_pending_human   # documentation-only; the recorded human-check was self-performed
  CTRL-03: satisfied
  CTRL-04: satisfied
  CTRL-05: satisfied
human_verification:

  - test: >-
      Install this build over an existing paired installation whose accessories were cached
      BEFORE this release, restart Homebridge, and open the accessory details for Primary Pump
      and Backup Pump in a controller that shows every characteristic (Eve or Controller for
      HomeKit).
    expected: >-
      Both restored PumpService instances adopt Observation Start, Activations Observed Since
      Observation Start and Last Observed Activation At (and Last Activation Was Self-Test on
      the backup pump), and each reads a real value rather than being absent or reading a
      format default.
    why_human: >-
      Nothing in this phase has met a real Homebridge cache. The harness restores an
      accessory's context through a JSON round trip but restores no services, so a real
      restored Service carrying cached characteristics is a shape no test has produced. Whether
      HAP adds four characteristics to a service that was persisted without them is an upgrade
      path only a real bridge can answer.
  - test: >-
      In a real paired Apple Home, look at the System Self-Test and Alarm Mute switches while
      the plugin has no decoded value for that control (send an out-of-domain test_running or
      alarm_audio_muted so the scope goes untrustworthy).
    expected: >-
      Record what Apple Home draws for a Switch carrying StatusActive = false, and whether it
      is distinguishable from an ordinary off switch.
    why_human: >-
      D-03 rides on this. A Switch is writable, unlike the sensors the Phase 3 StatusActive
      check closed against, so the Phase 3 finding does not transfer.
  - test: >-
      Press a control the plugin will refuse -- press System Self-Test off, or press it on
      while the device is confirmed offline -- and watch the tile in Apple Home.
    expected: >-
      Record what Apple Home draws for a characteristic that answers an error status on a read,
      in the window before the clearing push lands, and confirm the tile recovers.
    why_human: >-
      D-04's residual. The clearing push is proven to return the stored status to zero (probe
      and mutation), but what a controller renders in the interval is Apple's behaviour.
  - test: >-
      In a real paired Apple Home, compare the tile list in README.md "What the Home app draws
      a tile for" against what the app actually shows for one installed accessory.
    expected: >-
      The eleven listed services draw a tile, the five vendor-defined ones do not, Backup
      Battery behaves as the README describes, and a room holding only this accessory's sensors
      behaves as described.
    why_human: >-
      The code side is verified -- the two lists match the shipped service types exactly (probe
      6) -- but whether Apple Home draws a tile for an Apple-namespace type in this arrangement
      is Apple's behaviour, not the plugin's.
  - test: >-
      Read README.md "Apple's Activity History" against Apple's own requirements page
      (https://support.apple.com/en-gb/105011) and confirm each factual claim: up to 30 days,
      supported home hub, current Home architecture, no retention setting available to a plugin,
      no backfill.
    expected: Every claim matches Apple's current documentation, or the section is corrected.
    why_human: >-
      CTRL-02 is satisfied entirely by documentation. The <human-check> recorded for it in
      04-06 was performed by the agent that wrote the prose and is recorded human_judgment:
      true, so it is not independent evidence. The negative claims CTRL-02 actually requires
      (not safety delivery, no configurable retention, no backfill) ARE present and correct in
      the text; what needs a human is the accuracy of the positive Apple facts cited beside them.
  - test: >-
      G-001 -- against real hardware, press Alarm Mute and observe the acknowledgement, how
      long the reported alarm_audio_muted takes to change, how long the mute lasts, and what
      happens when the request fails.
    expected: The four unknowns are measured, and PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE is confirmed or corrected.
    why_human: >-
      Carried forward, not a Phase 4 gate. Nobody has observed a real Gemini answer a mute
      request. The phase ships the contract as a single named provisional constant and claims
      nothing about mute's behaviour, which is what CTRL-04 asked for.
warnings:

  - id: W-1
    summary: >-
      No Cucumber scenario detects removal of the pending-window withholding. Mutating
      controlValues() to ignore pendingControls killed 2 unit cases but left all 78 scenarios
      green. The behaviour itself is verified (probe 7 proves a poll does not snap the switch
      back, and the same mutation fails that probe), so this is a coverage observation about
      the end-to-end tier rather than a defect.
  - id: W-2
    summary: >-
      npm run test:coverage:all is not in CI. .github/workflows/build.yml runs lint,
      format:check, typecheck, fallow, npm test, build and audit on Node 22.x and 24.x. The
      100/100/100 gate is local discipline only, and this verification ran it on Node 26.7.0,
      which is neither CI runtime.
  - id: W-3
    summary: >-
      Classification of the last backup activation can carry a stale label for up to two poll
      intervals during a live run. Recorded by the executors, confirmed by reading
      classifiedAsTestActivity(): the label is only recomputed once test_running reads false
      and both device timestamps have been stable across two observations.
audit_acknowledged:
  milestone: 1.0
  at: 2026-09-05
  status: human_needed
---

# Phase 4: Pump Records and Official Controls — Verification Report

**Phase Goal:** Users can inspect durable observed pump activity and safely operate the two controls exposed by the official Gemini client.
**Verified:** 2026-09-01T20:06:25Z
**Branch / HEAD:** `features/phase-04-pump-records-and-official-controls` @ `3d9d441`, working tree clean before and after verification.
**Status:** human_needed
**Re-verification:** No — initial verification.

## How this was verified

SUMMARY.md claims were not used as evidence. Everything below was produced by running the
shipped code:

| Probe | What it drove | Result |
| --- | --- | --- |
| P1 | `createCustomCharacteristics` against the **real** pinned `@homebridge/hap-nodejs` | 256 and 70000 survive on the count; a `uint8` control clamps to 255 |
| P2 | `createPumpRecords` directly, 27 cases | 27/27 |
| P3 / P3b | `createControlBinder` against the HAP stand-in, 44 cases incl. a microtask mutant | 44/44 |
| P4 | `createServiceCatalogue` row projections, 18 cases | 17/18 (one probe-authoring error, corrected in P4b) |
| P5 | Real `createCloudApi().sendCommand` against a loopback HTTP server | 18/20 (two over-strict probe assertions, see below) |
| P6 | Tile-visibility list and `PumpService` characteristic optionality | pass |
| P7 | The real `createBasementGuardianAccessory` end to end, 16 cases | 16/16 |
| M1–M6 | Six live mutations of shipped source | every one killed the case that claims to cover it |

The two P5 "failures" are probe artifacts, not code defects, and are recorded honestly:
`accept-language: *` and `user-agent: node` on a read are undici's own defaults, not headers the
plugin sets. `git diff 77e73a1..HEAD -- src/cloud/api.ts` shows the read branch byte-identical
to the baseline. The P4 failure was a collision in my own `Object.fromEntries` key; the dump in
P4b shows both pump rows carrying all three record values verbatim.

**Gate results, run by this verification rather than read from a summary:**
`npm run check` exit 0 (typecheck, lint, fallow, format:check, 1207 unit cases, 78 scenarios,
753 steps). `npm run test:coverage:all` exit 0 at 100/100/100.

## Goal Achievement

### Observable Truths — ROADMAP Success Criteria

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Users can inspect each pump's observation start, detected activation count, and last detected activation after normal restart or upgrade, with no claim that the record is a device lifetime total | ✓ VERIFIED | P2 27/27 and P7. Both pump rows publish all three values; the backup pump adds the self-test label and the primary does not (P4b dump). Restart survival proven by mutation, not by a passing test: forcing `resumedRecord()` to `undefined` **fails** the scenario, and so does neutering `store.persist()`. Display name is "Activations Observed Since Observation Start" — the name itself refuses the lifetime claim |
| 2 | Users can start one System Self-Test when state and command transport are fresh, see reported test progress, and cannot issue unsupported cancellation or duplicate commands | ✓ VERIFIED | P3: an on write sends exactly one `{deviceId,'self-test',true}`; an off write throws −70412 and sends nothing; a duplicate throws −70403 and sends nothing; a confirmed-offline device and an undecoded scope both throw −70412 and send nothing. P7: the device's own report is what leaves the switch on, and reported `test_running: false` turns it off again |
| 3 | Users can request the official boolean Alarm Mute and see only device-reported mute state, with no invented duration, timer, or unmute control; the mute constants stay provisional until G-001 closes | ✓ VERIFIED | P5: `geminiFamily.command('alarm-mute', true)` is exactly `{"desiredData":{"alarm_audio_muted":true}}`. Exactly one mute constant exists in the codebase, `PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE` in `src/accessories/alarmMute.ts`; a repository-wide grep finds no unmute, duration, timer or schedule anywhere except prose forbidding them. P7: the mute switch follows reported state |
| 4 | Accepted, rejected, timed-out, late, and externally initiated control state reconciles within the 2.5-second API and 30-second pending policies without changing canonical safety state optimistically | ✓ VERIFIED | P5 against a real socket: `COMMAND_DEADLINE_MS` is 2500, a held response aborts at 2.4 s with a `TimeoutError`, and the server records **one** request. P3: the window is 30 000 ms, expiry drops the entry, republishes, warns once and retries nothing. Canonical state has exactly two writers, `applyDiscovery` and `applyReportedPatch`, both fed by the vendor; the binder is constructed with no store handle at all, and `shadowMerge.feature` asserts the canonical snapshot still reads `test_running: false` after an accepted command |
| 5 | Documentation does not treat Activity History as safety delivery or claim configurable retention/backfill; the G-003 real-home check belongs to Phase 6 | ✓ VERIFIED | `README.md` states each negative directly: "Activity History belongs to your controller, not to this plugin", "cannot give it a retention setting", "cannot put a missed event into it afterward", "is not how this plugin delivers safety state". No G-003 work was attempted in this phase |

### Observable Truths — the load-bearing claims checked against the shipped code

| # | Claim as made | Status | Evidence |
| --- | --- | --- | --- |
| 6 | `D-15` narrowing honored: no `update/rejected` leaf, no desired-state publish handling | ✓ VERIFIED | `git diff 77e73a1..HEAD -- features/support/fakeShadowBroker.ts` is **empty**. `ShadowTopicLeaf` still reads `'get/accepted' \| 'get/rejected' \| 'update/accepted'`. `src/cloud/shadow.ts` routes exactly those three topics. The 04-05 claim that the broker needed no change is true |
| 7 | `D-17`: exactly one importer of `@homebridge/hap-nodejs`, enforced by a **non-vacuous** source-text gate | ✓ VERIFIED | Gate passes as shipped. **M1:** planting `src/__probe_second_importer.ts` fails it by name (`actual: ['src/__probe_second_importer.ts', 'test/accessories/hapWriteFidelity.test.ts']`). A planted prose-only file did **not** trip it. The file floor is 98 against an actual 99 — tight, so a wrong-directory read cannot pass |
| 8 | `D-04`: the clearing push is a macrotask through the injected `Timers` port at delay 0, and the ordering rests on the handler being async | ✓ VERIFIED | `answerWrite` is `async`, so a refusal rejects a promise rather than throwing synchronously. **M2:** P3 case 10 runs the same refusal with the delay-0 callback rescheduled as a microtask — the stored status stays sticky (unreadable switch); the shipped macrotask form returns it to `0`. **M3:** replacing `armClearingPush` with a no-op fails three scenarios |
| 9 | `D-10`: the zero-timer assertion over `update()` is unchanged and was not widened | ✓ VERIFIED | Baseline `77e73a1` lines 1482–1517 versus current lines 1675–1710 `diff` **byte-for-byte identical**. The write path's deferral is asserted separately, and a second case at line 1831 adds `counted: 1` so the zero-scheduling read cannot pass for having driven nothing |
| 10 | `D-12`: `'uint32'` in `define()`'s format union; a count past 255 survives against REAL HAP | ✓ VERIFIED | P1 against the pinned package: `ObservedActivationCount` reports `format: uint32`, accepts 256 → 256 and 70000 → 70000. A `uint8` characteristic built the same way clamps 256 → 255. P2 case k accumulates 300 watched activations in the record itself |
| 11 | `D-11`: device Unix seconds converted to milliseconds at the record boundary; no 1970 dates | ✓ VERIFIED | P2 case e2: a device value of `1690000500` is stored as `1690000500000` and renders as **2023**. The only arithmetic on a device timestamp in the module is `× 1000`; watermark comparisons are device-clock against device-clock |
| 12 | `D-05`/`D-06`: the pending window is per capability per accessory, proven **at the row** | ✓ VERIFIED | P4: with `pendingControls = {'self-test'}` the `alarm-mute` row still projects `On` from reported state, and the mirror holds; both withhold when both are pending. P3 case 9: two capabilities on one binder are independent, and two binders on two accessories are independent. **M4:** making the row ignore `pendingControls` fails 2 unit cases and fails P7's snap-back check |
| 13 | Ruling `263cae0`: `deviceId` present in all three control log lines | ✓ VERIFIED | Observed in probe output for all three: `Refused self-test on acct_SN123: ...`, `The self-test request on acct_SN123 did not take effect: ...`, `The self-test request on acct_SN123 was never confirmed ...`. `controls.test.ts:530` asserts the identifier **present** and asserts token and base URL absent, so a removal fails by name |
| 14 | Ruling `69c203d`: the first device timestamp seeds the watermark rather than being counted | ✓ VERIFIED | P2 cases d/d2: the first `backup_pump_timestamp` leaves the count at 0 and `lastActivationAt` absent while seeding the watermark; a later, strictly greater value recovers exactly one; an identical repeat recovers nothing; a watched edge followed by its own timestamp is absorbed without a second count |
| 15 | The command request carries the approved headers and no installation detail; read requests are unchanged | ✓ VERIFIED | P5 against a real server: `user-agent: homebridge-basement-guardian`, `accept: application/json`, `content-type: application/json`, `authorization`. No credential, account identifier, device identifier or OS detail in any other governed header. The read branch is byte-identical to baseline; `src/cloud/auth.ts` and `src/cloud/sigv4.ts` were not touched at all this phase |
| 16 | An HTTP 200 carrying `{"success": false}` is a refusal, not an acceptance | ✓ VERIFIED | P5 case 3 against a real 200 response; `accountRuntime.ts:638` maps it to `{accepted: false, failure: 'vendor-error'}`, which the binder answers as −70402 |
| 17 | A command is attempted exactly once, on every failure path | ✓ VERIFIED | P5: one request recorded on timeout, one on HTTP 500, one on `success:false`. P3: one send on vendor-error and one on timeout, none after expiry. `features/officialControls.feature` asserts "the vendor receives 1 self-test command" **after** a later inventory poll was answered, so the count is a real absence rather than a race |

**Score:** 17/17 truths verified (0 present, behavior-unverified).

### Mutation log — proof the assertions are not vacuous

The phase's own history is six positives that passed for the wrong reason. Every load-bearing
assertion below was therefore attacked rather than read.

| # | Mutation applied to shipped source | Expected to be caught by | Result |
| --- | --- | --- | --- |
| M1 | Plant `src/__probe_second_importer.ts` importing the pinned HAP package | `test/accessories/hapImportScope.test.ts` | ✓ fails by name; a prose-only planted file does **not** trip it |
| M2 | Reschedule the delay-0 clearing push as a microtask | the D-04 ordering claim | ✓ the refusal status stays sticky; the shipped form clears it |
| M3 | `armClearingPush` → no-op | the "switch answers a read" scenarios | ✓ 3 scenarios fail |
| M4 | `controlValues` ignores `pendingControls` | the withholding claim | ✓ 2 unit cases fail and P7's snap-back check fails — **but 78/78 scenarios still pass** (W-1) |
| M5 | `resumedRecord()` forced to `undefined` | the restart scenario | ✓ the restart scenario fails. This is the exact mutation the previous, broken version of that scenario survived at 17/17 |
| M6 | `store.persist()` → no-op | the restart scenario | ✓ the restart scenario fails, so the persist port is load-bearing end to end |

Working tree restored after every mutation; `git status` clean and the full suite re-run green
(1207 unit cases, 78 scenarios, 753 steps).

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/accessories/controls.ts` | The control binder | ✓ VERIFIED | 394 lines. `createControlBinder` present, imported and used by `basementGuardian.ts`; driven end to end by P3/P7 |
| `src/runtime/commandPort.ts` | The one-method vendor port | ✓ VERIFIED | `CommandPort` implemented once, in `accountRuntime.ts`; injected into the accessory by `platform.ts` |
| `src/accessories/pumpRecords.ts` | Epoch, watched edges, de-duplicated recovery, watermarks, classification | ✓ VERIFIED | 360 lines, 100 % covered, all five behaviours driven by P2 |
| `src/accessories/alarmMute.ts` | The one place the provisional mute contract lives | ✓ VERIFIED | 31 lines, one export, one consumer (`controls.ts:152`) |
| `src/accessories/customCharacteristics.ts` | Four read-only record characteristics and the `uint32` format | ✓ VERIFIED | All four `['pr','ev']`; none writable; verified against real HAP |
| `src/runtime/accessoryStore.ts` | The narrow persist port | ✓ VERIFIED | One implementation only, the per-accessory closure at `platform.ts:137` calling `updatePlatformAccessories` |
| `src/persistence/accessoryContext.ts` | Record types reconciled with first-run absence | ✓ VERIFIED | All three observation members optional; absent-to-seeded is the only migration |
| `test/accessories/hapWriteFidelity.test.ts` | The one permitted HAP import | ✓ VERIFIED | Sole importer; includes its own uint8-clamping case |
| `test/accessories/hapImportScope.test.ts` | The single-importer gate | ✓ VERIFIED | Non-vacuous (M1) |
| `features/officialControls.feature` | Five CTRL-05 outcomes plus the success-false branch | ✓ VERIFIED | 11 scenarios: accepted, refused, success-false, never-answered, late report, externally initiated, armed-refusal-applies-once, mute press, mute off write |
| `features/pumpRecords.feature` | Record survival across a restart | ✓ VERIFIED | Non-vacuous (M5, M6) |
| `features/support/fakeRestApi.ts` | Command-scoped arming | ✓ VERIFIED | The "never answers" scenario runs at a short poll interval and proves a later inventory request was answered while the command sat held |
| `README.md` | Record, tiles, Activity History, both controls | ✓ VERIFIED (content) / human (Apple facts) | Both tile lists match the shipped service types exactly (P6) |

### Key Link Verification

| From | To | Via | Status |
| --- | --- | --- | --- |
| `basementGuardian.ts` | `controls.ts` | `createControlBinder`, `controls.pending` into `ProjectionInput` | ✓ WIRED — P7 presses a real switch through the real accessory |
| `controls.ts` | `commandPort.ts` | `await commands.send(...)`, outcome → HAP status | ✓ WIRED — P3 |
| `accountRuntime.ts` | `cloud/api.ts` | `commandBodyOf` → `sendCommand` under the root signal | ✓ WIRED — P5 over a real socket |
| `basementGuardian.ts` | `pumpRecords.ts` | one `records.observe(...)` per snapshot, before the rows publish | ✓ WIRED — P7 shows the count reaching the characteristic |
| `basementGuardian.ts` | `serviceCatalogue.ts` | `recordProjectionOf` formats, rows read verbatim | ✓ WIRED — P4b dump |
| `platform.ts` | `runtime/accessoryStore.ts` | the only `persist` implementation, `updatePlatformAccessories([accessory])` | ✓ WIRED — M6 proves it load-bearing |
| `fakeRestApi.ts` | `fakeShadowBroker.ts` | accepted command → device reaction on `update/accepted` | ✓ WIRED — the accepted-self-test scenario reaches shadow version 1 |
| `hapImportScope.test.ts` | `hapWriteFidelity.test.ts` | names it the sole permitted importer | ✓ WIRED — M1 |

### Data-Flow Trace (Level 4)

| Published value | Source | Real data? | Status |
| --- | --- | --- | --- |
| `Activations Observed Since Observation Start` | `records.primary/backup.activationCount`, built from decoded `primary_pump_running` / `backup_pump_running` edges and `backup_pump_timestamp` | yes | ✓ FLOWING |
| `Observation Start` | the first snapshot's own `receivedAt`, not a clock read | yes | ✓ FLOWING |
| `Last Observed Activation At` | a watched receipt time, or a device timestamp × 1000 | yes | ✓ FLOWING |
| `Last Activation Was Self-Test` | `test_timestamp` vs `backup_pump_timestamp`, both device-clock | yes | ✓ FLOWING |
| `On` (both controls) | decoded `test_running` / `alarm_audio_muted`, withheld while pending | yes | ✓ FLOWING |
| an unobserved record | nothing published at all, rather than 0 and 1970 | n/a | ✓ correct absence (P4 case G5) |

No value traces to a static return, a literal or a mock.

### Behavioural Spot-Checks

| Behaviour | Command | Result | Status |
| --- | --- | --- | --- |
| Full gate | `npm run check` | exit 0 — 1207 unit cases, 78 scenarios, 753 steps | ✓ PASS |
| Coverage gate | `npm run test:coverage:all` | exit 0 — 100.00 / 100.00 / 100.00 | ✓ PASS |
| Single named gate | `node --test dist-test/test/accessories/hapImportScope.test.js` | 4/4 | ✓ PASS |
| Command wire shape | loopback server + `createCloudApi().sendCommand` | `PUT /devices/acct_SN123/data`, `{"desiredData":{"test_running":true}}` | ✓ PASS |
| Command deadline | held response | aborts at ~2.4 s with `TimeoutError`, one request recorded | ✓ PASS |

### Requirements Coverage

| Requirement | Source plans | Status | Evidence |
| --- | --- | --- | --- |
| CTRL-01 | 04-03, 04-04, 04-05, 04-06 | ✓ SATISFIED | P2 (27/27), P4, P6, P7; restart survival proven by M5 and M6. Should read **Complete** in REQUIREMENTS.md |
| CTRL-02 | 04-05 (carried), 04-06 | ✓ SATISFIED, human confirmation outstanding | The three negative claims CTRL-02 requires are present and correct in `README.md`. The positive Apple facts cited beside them need an independent human read (human item 5). Should read **Complete** with the human item tracked, or **Complete pending doc review** if the row supports it |
| CTRL-03 | 04-01, 04-02, 04-05, 04-06 | ✓ SATISFIED | P3 (all five refusal causes and the accepted path), P7 (reported state authoritative), externally-initiated scenario. Should read **Complete** |
| CTRL-04 | 04-02, 04-05, 04-06 | ✓ SATISFIED | P5 (one measured body), single provisional constant, no unmute/duration/timer anywhere. G-001 stays open and blocks 1.0.0 only. Should read **Complete** |
| CTRL-05 | 04-01, 04-02, 04-05, 04-06 | ✓ SATISFIED | P5 (2.5 s, one attempt, success-false), P3 (statuses, 30 s window, per capability per accessory), `shadowMerge.feature` (no optimistic canonical write). Should read **Complete** |

No orphaned requirements: REQUIREMENTS.md maps CTRL-01…CTRL-05 to Phase 4 and all five are
claimed by at least one plan.

### Prohibitions

All 40 declared prohibitions across the six plans carry `status: flagged-unverified`. Thirty-four
are `verification: test`; six are `verification: judgment`. Assessed against the shipped code:

| Group | Verdict |
| --- | --- |
| Enforced and proven by mutation (M1–M6) | single HAP importer; no microtask clearing push; the pending-window withholding; the persist gate |
| Enforced and proven by execution | only `HapStatusError` thrown (P3 returns −70412 / −70403 / −70408, which a bare `Error` cannot produce); no `setCharacteristic` on a control switch (P3 case 11); no retry on any path (P5, P3); no run-already-in-progress counted (P2 b); no device-vs-local-time comparison (only `× 1000`); no record characteristic required on `PumpService` (P6: all four optional, `required` is `['Name','Pump Running']`); no write permission on any custom characteristic (P1: `['pr','ev']`); one activation count per pump; no persist on an unchanged update (P2 f2); no Homebridge API handle in the accessory's options (the interface carries `store`, not `api`); no header policy on the read branch (byte-identical diff); no header policy on Auth0 or SigV4 (neither file touched); no unmute, duration or timer for mute (repository-wide grep) |
| Enforced by a static gate | no `node:timers` import in the accessories tier (`timerFreedom.test.ts`, floor raised to 9 to match the tier); no `update()` widening (byte-for-byte diff) |
| `verification: judgment` — **flagged, human review recommended** | the five README prohibitions (Activity History framing, the count not presented as a device figure, tiles, the mute claim, no promised alert) and "MUST NOT invent a wire shape". The wire-shape one traces to `.planning/intel/constraints.md:91,100,231,239,240` — measured, not invented. The five README ones are judgment and route to human item 5 |

No prohibition was found violated. Six judgment-tier items are recorded as flagged rather than
green, per the fail-closed rule.

### Test Quality Audit

| Check | Result |
| --- | --- |
| Disabled tests on requirements | 0 — no `.skip`, `.only`, `.todo`, `xit`, `xdescribe`, `@wip` anywhere under `test/` or `features/` |
| Circular tests | 0 — the three `writeFile` calls in tests write an auth token-cache fixture, not expected values. No capture/baseline/snapshot generator exists |
| Expected-value provenance | **VALID** — the command bodies, the Unix-seconds units, the ~16 s test duration and the ~7–15 s pump run all trace to quoted lines in `.planning/intel/constraints.md`, which records measured observations |
| Assertion strength | Value and behavioural. Notably, the D-03 control cases assert `pushed: false` rather than `value: false`, which is the defence against the "fixture already sat at the bool default" failure that bit this phase six times |
| Coverage quantity | 1207 unit cases, 78 scenarios, 753 steps; 100/100/100 over every executable `src/` module |

### Decision Coverage

All 17 `04-CONTEXT.md` decisions (D-01 … D-17) appear in shipped source, tests or features.
17/17 honored, 0 not honored. Non-blocking gate; recorded for drift tracking.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| — | — | — | — | None. No `TBD`, `FIXME`, `XXX`, `HACK`, `PLACEHOLDER` or `TODO` in any of the 47 files this phase modified |

One pre-existing `fallow` clone-group finding on `features/support/steps/hap.ts` predates this
phase and does not fail the gate. Confirmed: `npm run fallow` passes inside `npm run check`.

### Known limitations carried forward (not credited as verified)

1. **Nothing has met a real Homebridge cache.** The record-survival evidence is a JSON round trip
   through an in-memory map that deliberately restores no services. Human item 1.
2. **Alarm Mute has no hardware evidence at all.** Constants ship `PROVISIONAL_`; `G-001` stays
   open and blocks 1.0.0 only. Nothing in this report claims mute's behaviour is known.
3. **Classification can carry a stale label for up to two poll intervals** (W-3).
4. **Three real-home questions are raised, not answered** — D-03 Switch rendering under
   `StatusActive = false`, the D-04 read-error residual, and the tile-visibility list. Human
   items 2, 3, 4. Phase 3's open flood-automation check joins the same session.
5. **`npm run test:coverage:all` is not in CI** (W-2).
6. **The 04-06 `<human-check>` on README prose was performed by the agent that wrote the prose**
   and is recorded `human_judgment: true`. Treated as unverified; human item 5.

### Gaps Summary

None. Every must-have resolved to VERIFIED against executed code, and each of the six load-bearing
assertions survived a mutation designed to make it fail. The phase goal is achieved in the
codebase: a user can inspect a durable, honestly-named observed activation record on both pumps
that survives a restart, and can operate exactly the two controls the official client exposes,
with reported state authoritative, every refusal answered locally without touching the network,
one attempt per command, and no requested value ever reaching canonical safety state.

The status is `human_needed` rather than `passed` because six items cannot be settled without a
real bridge, a real Apple Home, real hardware, or an independent human read of documentation
prose. Five of those six are questions this phase raised honestly rather than defects it left
behind, and the sixth — the real Homebridge cache — is the one open question with the potential
to change what an owner sees.

Recommended REQUIREMENTS.md close-out: CTRL-01, CTRL-03, CTRL-04 and CTRL-05 → **Complete**.
CTRL-02 → **Complete** with human item 5 tracked against the release checklist, since the
requirement's own negative claims are met and only the cited Apple facts await an independent read.

---

_Verified: 2026-09-01T20:06:25Z_
_Verifier: Claude (gsd-verifier) — by executing the shipped code_
