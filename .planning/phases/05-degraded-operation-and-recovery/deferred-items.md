# Deferred items — phase 05

Discoveries made while executing a plan that are out of that plan's scope. Each one names what was
found, why it was not fixed here, and what would own it.

## Found during 05-06

### A shadow that goes silent never hands telemetry back to the poll

**File:** `src/device/state.ts:173-175` (`pollTelemetry`), with `src/runtime/accountRuntime.ts:468`.

`pollTelemetry` keeps the previous snapshot's telemetry whenever `shadowVersion` is set, so once a
shadow message with a version has arrived the poll stops replacing `data` for that device. The
watermark is released in exactly one place, `handleShadowDisconnected`. Shadow *silence* is not a
disconnection: the connection is open and the device has stopped speaking, so the watermark stands
and no REST poll refreshes telemetry for as long as the silence lasts.

Reproduced while writing the flood scenario. With a heartbeat delivered before the clock moved past
two missed heartbeats, `Then the canonical snapshot carries these fields: | water_level | 31 |` never
holds, however many polls run. Without a prior heartbeat the same scenario passes on the first poll.

This means the end-to-end path CR-01 describes is reachable only while the shadow has not yet
delivered a versioned message. The accessory-layer defect CR-01 named is real and is fixed by this
plan — a family-valid value arriving on a working transport now reaches the tile — but a second gate
sits upstream of it for any device whose live path spoke and then stopped.

**Not fixed here.** Releasing the watermark on silence changes the reconciliation contract `D-15` and
`SYNC-03` lock, which is an architectural decision rather than a bug fix, and it would change which
source owns telemetry in a state neither decision discusses. Deviation rule 4 applies. It wants a
decision of its own, with the question stated as: does two missed heartbeats mean the shadow has
stopped being the source, in the same sense a closed connection does?

### The lost-link warning names five poisoned scopes where seven are poisoned

**File:** `src/accessories/basementGuardian.ts`, `reportControllerLink`.

The warning says "water, pump, power, battery, and fault values are retained rather than refreshed".
`NON_CONNECTIVITY_SCOPES` holds seven members: those five plus `self-test` and `alarm-mute`. Both
control scopes are withdrawn by the same layer, and a press on either is refused while the link is
lost, so the message under-reports what the owner has lost.

**Not fixed here.** It is user-facing text with a unit case pinning its exact wording, and this
plan's file list covers the trust layering rather than the diagnostic vocabulary. The count in the
comment above `NON_CONNECTIVITY_SCOPES` was wrong in the same way and is corrected, because that one
is a comment about the constant it sits on.
