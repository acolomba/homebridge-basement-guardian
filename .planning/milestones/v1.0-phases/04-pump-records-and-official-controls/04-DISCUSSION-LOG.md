# Phase 4: Pump Records and Official Controls - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-31
**Phase:** 4-Pump Records and Official Controls
**Areas discussed:** Control write seam, Command lifecycle in HomeKit, Pump record ownership, Primary vs backup asymmetry

---

## Control Write Seam

### Where the `onSet` handlers live

| Option | Description | Selected |
|--------|-------------|----------|
| Catalogue row + separate binder | Catalogue keeps declaring and projecting both Switch rows; a small controls module binds `onSet` via the existing `publishedService()` lookup. Catalogue stays projection-only. | ✓ |
| Extend `ServiceRow` with a control binding | `ServiceRow` gains an optional `control` field; the accessory binds `onSet` inline. One file, but the catalogue stops being purely projective. | |
| Fully separate controls module | A controls module owns both Switches end to end. Catalogue read-only by construction, but a second publish and naming path. | |

**User's choice:** Catalogue row + separate binder.
**Notes:** `publishedService()` already documents itself as "the one lookup an accessory reaches for when it must act on what it already published without publishing anything new" — it reads as though it was left for this.

### Trust scoping for the control fields

| Option | Description | Selected |
|--------|-------------|----------|
| Two scopes: `self-test` and `alarm-mute` | Narrowest possible; a bad `alarm_audio_muted` leaves Self-Test trustworthy. `TrustScope` grows 6 → 8. | ✓ |
| One `control` scope | Follows the existing grouping precedent (`fault` covers four booleans, `pump` covers two pumps). A bad `test_running` would deactivate the unrelated Alarm Mute Switch. | |
| No new scope — ride `connectivity` | Commands are gated on reachability anyway. An out-of-domain `test_running` on a reachable device would fault nothing. | |

**User's choice:** Two scopes.
**Notes:** The existing precedent groups fields feeding one set of services; these two feed disjoint services.

### Publish gate for the two Switches

| Option | Description | Selected |
|--------|-------------|----------|
| Publish always + `StatusActive = false` until reported | Room renders; the undecoded state is marked the same way every other scope marks it. Relies on an unverified characteristic pairing. | ✓ |
| Same gate as every other row | Fully consistent with `ensureService`. A device whose `test_running` never validates publishes no Switch, and the room may not render at all. | |
| Publish always, no `StatusActive` | Simplest, avoids the unverified pairing. Nothing distinguishes "reported off" from "never reported". | |

**User's choice:** Publish always with `StatusActive = false`.
**Notes:** Accepted with the risk stated explicitly — HAP's `Switch` declares only `Name` and `On` (verified by instantiating one from the pinned package), so `StatusActive` reaches it only through `declareCharacteristic`. Recorded as a required Phase 4 human-verification item rather than assumed.

---

## Command Lifecycle in HomeKit

### HAP error mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Per-cause mapping | Six causes, four distinct statuses. Log lines and Eve-class clients read true. | ✓ |
| Two codes only | Timeout plus one catch-all. A plugin-side refusal would report as a communication failure that never happened. | |
| Per-cause, no pre-emptive refusals | Only vendor rejection and timeout can occur. Pairs only with forwarding every write. | |

**User's choice:** Per-cause mapping.
**Notes:** `api.hap` was verified at runtime to carry both `HAPStatus` (`OPERATION_TIMED_OUT` = -70408) and `HapStatusError`, so no direct HAP-NodeJS import is needed.

### What the Switch shows during a pending request

| Option | Description | Selected |
|--------|-------------|----------|
| Row projects nothing for `On` while pending | The existing "cannot vouch, publish nothing" rule; HAP keeps serving the accepted value. No clobber, no new push path. | ✓ |
| Push reported state always | Strictly authoritative at every instant, but the toggle visibly flicks back and reads as a failed command. Contradicts `constraints.md:537`. | |
| Binder suppresses the accessory's push | Same visible behaviour, but a second place decides what gets published. | |

**User's choice:** Row withholds `On` while pending.

### Pending expiry

| Option | Description | Selected |
|--------|-------------|----------|
| Snap back to reported state, log a warning | `D-037`'s "clear on expiry"; never a retry. | ✓ |
| Snap back and mark `StatusActive = false` | Gives one signal two meanings — a user could not tell an expiry from an undecoded field. | |
| Hold the requested value indefinitely | A false normal on the control surface with nothing to clear it. | |

**User's choice:** Snap back with one warning.

### Local refusals

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror the official client | Refuse locally on offline, test already running, and already muted. Backed by `constraints.md:107-109` and `D-031`. | ✓ |
| Forward everything | The plugin invents no rules, but a duplicate press operates a real sump pump the official client would have refused. | |
| Block only on confirmed offline | `CTRL-03` requires the duplicate rule anyway, leaving only mute forwarded — the one command with zero hardware evidence. | |

**User's choice:** Mirror the official client.

---

## Pump Record Ownership

### Where records are computed and persisted

| Option | Description | Selected |
|--------|-------------|----------|
| Records module + narrow `AccessoryStore` port | Matches the existing `Timers` / `Clock` port pattern; keeps the accessory's "HomeKit and nothing else" claim true. | ✓ |
| Compute in the runtime, pass down | Runtime would need the accessory's context to persist, reaching back into the object it stays above. | |
| Directly in the accessory closure | Beside `offlineCount` and `lastTrustedAt`, but `basementGuardian.ts` is already 579 lines and adding persistence falsifies its docblock. | |

**User's choice:** Records module + narrow persist port.

### A pump already running at the first snapshot

| Option | Description | Selected |
|--------|-------------|----------|
| No — count rising edges only | A restart mid-run never inflates the count. For the primary pump nothing could ever detect or correct a double-count, since no primary timestamp exists. | ✓ |
| Yes — a run observed is a run counted | Simpler rule, but the count silently inflates on every restart during rain. | |
| Yes, and start the epoch there | Same double-count, plus the epoch moves on every mid-run restart. | |

**User's choice:** Rising edges only.

### Making the "not a lifetime total" claim visible

| Option | Description | Selected |
|--------|-------------|----------|
| Characteristic names + README | Names carry it, so a controller showing only the characteristic still reads true. | ✓ |
| README only | An Eve-class client shows a bare name and number with no context. | |
| Names, README, and a log line at epoch start | One more surface to word and test; the epoch characteristic already carries the fact where a user sees it. | |

**User's choice:** Characteristic names + README.

### Persist cadence

| Option | Description | Selected |
|--------|-------------|----------|
| On change only | A few small writes per pump cycle, none while dry. No timer, so the accessory's zero-scheduling assertion survives. | ✓ |
| Debounce through the `Timers` port | Introduces scheduling into the accessory tier to optimise a write happening a few times an hour. | |
| On change plus a shutdown flush | The flush would write nothing new and adds an untestable path. | |

**User's choice:** On change only.

---

## Primary vs Backup Asymmetry

### Timestamp for a recovered activation

| Option | Description | Selected |
|--------|-------------|----------|
| The device's own timestamp | The activation happened when the device says it did. No cross-clock arithmetic is performed. | ✓ |
| Local receive time | Matches the field's current doc comment, but reports a 40-minute-old run as having just happened. | |
| Both — local for edges, device value published separately | Most explicit, mirrors the raw-water-level-code precedent, but adds a fourth characteristic and two timestamps to reconcile. | |

**User's choice:** The device's own timestamp. Count advances by exactly one; the live sensor is never pulsed.

### The primary pump's unrecoverable gap

| Option | Description | Selected |
|--------|-------------|----------|
| Document it; no new surface | README names the asymmetry plainly. | ✓ |
| Say nothing beyond the existing epoch | A user comparing the two counts has no way to learn why they differ. | |
| Publish a monitoring-completeness indicator | Monitoring-path state, which Phase 5 owns; would likely be reworked. | |

**User's choice:** Document it.

### Self-test classification

| Option | Description | Selected |
|--------|-------------|----------|
| One count, plus classify the last activation | `CTRL-01` gets its one count with every run in it; a read-only flag records whether the last was test activity, using both watermarks the context type already declares. | ✓ |
| One count, no classification | Smallest thing satisfying the requirement, but `ActivationWatermarks.testTimestamp` stays dead type and self-tests are indistinguishable from real runs. | |
| Two separate counts | Most informative, but criterion 1 names one count and a misclassified run sits in the wrong bucket permanently. | |

**User's choice:** One count plus a last-activation classification.

---

## Todo Cross-Reference

Four pending todos matched the phase. Two were folded.

| Todo | Score | Outcome |
|------|-------|---------|
| `2026-08-30-document-which-services-apple-home-renders.md` | 0.2 | **Folded** — same README section as `D-12`, and its real-home check merges with `D-03`'s open risk |
| `2026-08-31-define-cloud-request-header-policy.md` | 0.9 | **Folded, scoped to the command path only** — Auth0 and the MQTT handshake stay on the todo for Phase 6 |
| `2026-08-31-record-g-002-natural-water-level-evidence.md` | 0.6 | Reviewed, not folded — belongs to the water ladder and the release gates |
| `2026-08-31-state-the-harness-mdns-prerequisite.md` | 0.2 | Reviewed, not folded — development infrastructure documentation |

**Notes:** The first selection round returned "fold both" together with "neither — review only", which are contradictory. A follow-up question settled the header policy at command-path scope only, rather than guessing at intent.

---

## Claude's Discretion

- Module layout and file names behind `D-01` and `D-08`; whether the binder takes the rows or looks them up.
- How pending state is represented on `ProjectionInput`.
- Custom characteristic UUID allocation for the record characteristics.
- Whether the record characteristics live on the existing custom Pump services or a second service, provided the subtype does not change.
- Exact wording of every log line and characteristic display name.
- How the fake's five `CTRL-05` outcomes are armed by a scenario.

## Deferred Ideas

- A per-pump monitoring-completeness indicator — Phase 5 owns monitoring-path state.
- Two independent activation counts — rejected under `D-13`.
- Header policy for Auth0 and the MQTT SigV4 handshake, and live-endpoint verification — Phase 6.
- The heartbeat timer, staleness rule, cached state across restart, and confirmed-offline versus degraded path — Phase 5.
- Confirming the `<account-id>` format against a real inventory response — open from Phase 2.
