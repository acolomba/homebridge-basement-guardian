# G-003 / G-004 -- Paired Apple Home Validation Checklist

**Blocks:** `1.0.0` only. Does not block any phase's completion.

**Why this exists.** Three still-open checks all need the same real, paired Apple Home with a current-generation home hub and the current Home architecture, so they belong in one session:

- **G-003** -- both bridged pump Contact Sensors (Primary Pump Activity, Backup Pump Activity, and their peers) render correctly in a real eligible Apple home.
- **G-004** -- `Sump Pit Flood` Leak Sensor notification delivery works with a current home hub and Home architecture, and no documentation this project ships claims a Critical Alerts guarantee it cannot back up.
- **The Phase 3 flood automation check** (also called the flood-automation check below) -- an automation built on `Sump Pit Flood` survives a degraded `water` scope and still exists and fires afterward. A failure here reopens `03-CONTEXT.md` D-05, which the whole `StatusActive = false` degradation design rests on. This is the load-bearing check of the three.

This checklist reuses the forcing-harness recipe and field domains recorded in `.planning/phases/04-pump-records-and-official-controls/04-UAT.md`, section "Deferred session, 2026-09-04," rather than re-deriving them -- that session was set up and then deferred **before pairing** due to a dev container host-networking problem, so nothing about Apple Home's behavior was actually observed. This is the first attempt to run all three checks against real pairing.

**No item below may be marked "passed" from this phase's own evidence.** This checklist was written, not executed. Every item starts `status: pending`.

## Before you start

You need:

- A real Homebridge instance, paired to a real Apple Home, with a current-generation home hub (Apple TV or HomePod running tvOS/HomePod software current enough for "the current Home architecture") and the account already migrated to that architecture.
- The plugin installed and running against the one real Gemini device on the account.
- A host with working multicast/mDNS reachable from the phone doing the pairing -- see `dev/README.md`'s Networking section for the host prerequisites; a host without multicast will fail pairing with zero responders.
- The ability to build an automation in the Home app.

## The forcing mechanism (reused from 04-UAT.md, not re-derived)

The degradation-dependent checks below need the plugin driven into a state the real vendor cloud will not produce on demand. The prior session built this, verified it, and reverted it -- rebuild it from this description when this session runs.

**Mechanism:** override reported telemetry fields at the one snapshot chokepoint, `freeze()` in `src/device/state.ts`, so the override lands on `data` **before** family validation and the plugin treats the value exactly as it would treat the same value from the vendor. Read a JSON file (for example `/homebridge/uat-force.json` inside the dev container's storage directory) on every snapshot, so a scenario changes with a file write and a restart rather than a rebuild. Log `[UAT HARNESS] forcing reported fields: …` on every application so it can never run silently.

**Discipline, restated because it is load-bearing:** build it, verify it against the real device, use it to make your observations, then revert it and confirm `dist/` carries zero references before ending the session. Never commit it.

**Field domains, measured 2026-09-04 (reuse these, do not re-derive):**

| Scenario                                          | Override                                                      | Effect                                                                                                                                               |
| ------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Water scope untrusted                             | `{"water_level": 99}`                                         | `Sump Pit Flood` and `Sump Pit Level` go `Status Active=0`, retaining last valid values; legal codes are `{0, 1, 3, 7, 15, 31}`                      |
| Both controls untrusted                           | `{"test_running": "unknown", "alarm_audio_muted": "unknown"}` | `System Self-Test` and `Alarm Mute` go `Status Active=0`; both fields are required booleans                                                          |
| A refusable press                                 | `{"test_running": true}`                                      | `System Self-Test` reads `On=1`, so pressing it **off** is refused -- sends nothing to the hardware, safe to try                                     |
| Healthy                                           | `{}` or no file                                               | All 17 services vouched for                                                                                                                          |
| Flood value, for driving a real leak-state change | `{"water_level": 31}`                                         | `Sump Pit Flood`'s `Leak Detected` goes active -- use this to drive the automation-firing half of the flood-automation check after recovery          |
| Healthy after a forced flood value                | `{}` or no file                                               | Returns `Sump Pit Flood` to its unforced state -- the first real change after a `{"water_level": 31}` override, for firing an automation on recovery |

**Important limitation already established:** while `Sump Pit Flood` is degraded (untrusted, `Status Active=0`), its `Leak Detected` value is frozen at its last trusted reading and cannot change -- that is the preserve-and-mark rule (D-014). No automation can fire from a leak-state change that never happens while the sensor is inactive. Plan the flood-automation check around this: force the degradation, confirm the automation still exists and is still enabled (the check this needs to answer), then let the sensor recover and force a real leak-state change to confirm the automation fires afterward -- see item 3 below.

## Items

### 1. G-003 -- Both pump Contact Sensors in a real eligible home

test: With the plugin running normally (no forced degradation), open the Home app and confirm both Primary Pump Activity and Backup Pump Activity Contact Sensors appear, each showing the correct open/closed state matching the device's current running state. Trigger a pump activation if possible (or wait for a natural one) and confirm the sensor's state changes correctly in the Home app.

expected: Both Contact Sensors render as expected Apple Home tiles, each independently reflecting its own pump's running state, with no cross-talk between the two.

why_human: Apple Home's rendering of a real HAP Contact Sensor accessory service, in a real paired home with a real hub, is Apple's behavior -- no fake HAP stand-in (`features/support/fakeHap.ts`) can be evidence for it.

status: pending

### 2. G-004 -- Leak Sensor notification delivery and the Critical Alerts claim

test: With the plugin running normally, force `Sump Pit Flood` active via the `{"water_level": 31}` override (see forcing mechanism above) and confirm a notification is delivered to a phone signed into the paired home, through the current home hub. Record whether the notification arrived, how quickly, and whether it behaved like an ordinary notification or like a Critical Alert (bypassing Focus/Do Not Disturb). Separately, confirm no documentation this project ships (README.md, config.schema.json, or elsewhere) claims a Critical Alerts guarantee.

expected: A recorded observation of whether and how the notification arrived, and confirmation that the project's own documentation makes no Critical Alerts promise beyond what was actually observed.

why_human: Notification delivery through a real home hub and the current Home architecture is Apple's infrastructure behavior, not something the plugin controls or a fake can simulate.

status: pending

### 3. Phase 3's flood-automation check (load-bearing -- reopens D-05 on failure)

test, part (a) -- survives degradation: Build a Home app automation triggered by `Sump Pit Flood`'s `Leak Detected` (any reasonable action, e.g. a notification or a scene). Force the water scope untrustworthy with `{"water_level": 99}`. Confirm the automation still appears in the Home app, is still listed as enabled, and was not silently removed or disabled by the `Status Active = false` state.

test, part (b) -- fires after recovery: Clear the override (or set it to `{}`), confirming the sensor returns to a trusted, active state. Then force a real leak-state change with `{"water_level": 31}` and confirm the automation actually fires.

expected: The automation survives the degraded scope (part a) and fires on the first real change after recovery (part b). **A failure at either part reopens `03-CONTEXT.md` D-05** -- the finding that `StatusActive = false` does not remove a sensor from Apple Home automations -- which the whole degradation design in this codebase currently rests on.

why_human: Whether Apple Home silently drops or disables an automation whose trigger accessory reports `Status Active = false` is Apple's behavior, observable only in a real paired home. The 2026-08-30 research finding that refuted the original blocking concern was a documentation review, not a live observation; this item is that live observation.

status: pending

## After running this checklist

Record results in this file (update each item's `status` to `passed` or `failed` with an `evidence:` block, following `04-UAT.md`'s structure) or in a dedicated UAT record for the session. If item 3 fails, escalate immediately -- do not continue treating `03-CONTEXT.md` D-05 as settled, and raise it with the maintainer before any further work on the degradation design. Report the outcome of all three items in `.planning/STATE.md`'s Deferred Verification table and G-003/G-004 rows.
