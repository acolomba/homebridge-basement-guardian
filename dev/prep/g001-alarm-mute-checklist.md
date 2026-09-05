# G-001 -- Alarm Mute Validation Checklist

**Blocks:** `1.0.0` only. Does not block any phase's completion.

**Why this exists.** Nobody has observed a real Gemini's acknowledgement of an alarm-mute request, the timing of its reported state change, how long a mute actually lasts, or what the device does when a mute request fails. The self-test command has real hardware evidence behind its wire shape (G-CTRL work already closed); alarm mute has none. Everything this plugin assumes about mute lives in `src/accessories/alarmMute.ts`, named `PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE` (currently `true`, the whole of the measured command body `{"alarm_audio_muted": true}` -- nothing else has ever been sent to a real device). This checklist is what a future session runs to confirm or correct that one constant and close G-001.

**Before you start:** you need a real Gemini, network access to press Alarm Mute either through the Home app or the vendor mobile application, and a way to watch the plugin's logs and the device's reported `alarm_audio_muted` field in real time (e.g. `dev/observe.mjs` or the Homebridge log at debug level). Pressing Alarm Mute on real hardware silences the physical alarm -- confirm with whoever is present in the basement before you press it.

**No item below may be marked "passed" from this phase's own evidence.** This checklist was written, not executed. Every item starts `status: pending` and stays that way until a future session records a real observation.

## Items

### 1. Acknowledgement behavior

test: Press Alarm Mute (via the Home app's Alarm Mute switch, or via the vendor mobile application while watching the plugin's logs and the shadow document). Note whether the vendor cloud sends any distinct acknowledgement -- an `accepted` MQTT message, an HTTP 2xx on the command POST, or any signal that arrives before `alarm_audio_muted` itself changes -- or whether the only observable signal is the reported field changing.

expected: A record of what the device/cloud actually does between the press and the reported change: nothing observable, a distinct accept message, or something else. State it plainly, including "no separate acknowledgement observed" as a valid, complete answer.

why_human: No fake can answer this -- the Cucumber fake-pump harness's `fakeShadowBroker.ts` answers the way this project's engineers designed it to answer, not the way a real Gemini answers. Confirming or refuting the fake's shape requires a real device.

status: pending

### 2. Latency of the reported state change

test: With a clock or timestamped log visible, press Alarm Mute and measure the elapsed time between the press and the moment `alarm_audio_muted` reads `true` in the shadow document the plugin receives.

expected: A measured latency (e.g. "reported within 2 seconds" or "reported on the next heartbeat, ~30 seconds later"). Compare this against the project's 2.5-second command-deadline constant (D-038) -- if the real latency regularly exceeds 2.5 seconds, note that the deadline may need revisiting before `1.0.0`, but do not change the deadline as part of running this checklist.

why_human: Timing behavior of the real vendor cloud and the physical device cannot be fabricated; the fake harness's timing is an engineering choice, not a measurement.

status: pending

### 3. Mute duration

test: After confirming `alarm_audio_muted` reads `true`, wait and observe whether and when it reverts to `false` on its own, without any HomeKit or vendor-app interaction. Record the elapsed time if it reverts, or note that it did not revert within your observation window (state the window length).

expected: Either a measured duration the mute lasts before the device clears it itself, or a confirmed observation that the device does not self-clear within a stated window (e.g. one hour). `PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE` carries no duration, timer, schedule, or unmute value today -- this item tells a future session whether that omission is correct or whether the device has a real, observable mute lifetime the plugin should represent.

why_human: The vendor's official client offers no duration selector and no unmute command, so no engineering guess can substitute for watching a real device's behavior over time.

status: pending

### 4. Failure behavior

test: Provoke a mute request that will fail -- for example, by pressing Alarm Mute while the device is confirmed offline (no shadow updates for longer than the confirmed-offline threshold), or while the account's authentication has been intentionally left in a refused state. Observe what the vendor cloud or the device reports: a rejection, a timeout with no response, or something else, and what (if anything) the plugin's control binder does in response.

expected: A record of the failure shape: rejected outright, timed out with no acknowledgement, or another shape entirely. Compare it against the five `CTRL-05` outcomes already validated for self-test (accepted, rejected, timed out, late, externally initiated) and note whether alarm mute's failure modes match or differ.

why_human: Nobody has provoked a real mute failure. The fake harness's failure paths were authored to answer this project's own design questions, not measured against a real Gemini's actual failure behavior.

status: pending

## Forcing a rare condition, if needed

Item 4 may require driving the device into a state (offline, or a refused credential) that will not occur naturally on demand. If you build any temporary tooling to force that state, follow the discipline already established for this kind of work: build it, verify it against the real device, use it to make your one observation, then revert it and never commit it. See `.planning/phases/04-pump-records-and-official-controls/04-UAT.md`, section "Deferred session, 2026-09-04," for the exact recorded precedent -- a JSON-file override read at the plugin's one snapshot chokepoint, logged on every application so it can never run silently, and confirmed removed from `dist/` before the session ends.

## After running this checklist

Record the results in this file (update each item's `status` to `passed` or `failed` with an `evidence:` block, following `04-UAT.md`'s structure) or in a dedicated UAT record for the session. Update `src/accessories/alarmMute.ts`'s `PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE` and its doc comment only if a measurement contradicts what is currently assumed. Report the outcome in `.planning/STATE.md`'s G-001 row.
