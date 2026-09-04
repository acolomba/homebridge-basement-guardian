---
status: testing
phase: 04-pump-records-and-official-controls
source: [04-VERIFICATION.md]
started: 2026-09-01T20:15:00Z
updated: 2026-09-04T19:30:00Z
---

## Current Test

number: 2
name: What Apple Home draws for a Switch carrying `StatusActive = false` (D-03)
expected: |
  Record what Apple Home draws for a Switch the plugin cannot vouch for, and whether it is
  distinguishable from an ordinary off switch.
awaiting: user response

Items 1 and 5 passed on 2026-09-04 and carry their evidence below. Items 2, 3 and 4 need a real
paired Apple Home and belong to one session with Phase 3's still-open flood-automation check. Item 6
needs a command sent to real hardware and blocks `1.0.0` only.

## Tests

### 1. A cached-before-this-release accessory adopts the four record characteristics

test: Install this build over an existing paired installation whose accessories were cached
BEFORE this release, restart Homebridge, and open the accessory details for Primary Pump and
Backup Pump in a controller that shows every characteristic (Eve or Controller for HomeKit).

expected: Both restored PumpService instances adopt the four record characteristics and each
reads a real value rather than being absent or reading a format default.

why_human: Nothing in this phase has met a real Homebridge cache. The harness restores an
accessory's context through a JSON round trip but restores no services, so a real restored
Service carrying cached characteristics is a shape no test has produced. Whether HAP adds four
characteristics to a service persisted without them is an upgrade path only a real bridge can
answer. **This is the one open item that can change what an owner sees.**

status: passed
verified: 2026-09-04
evidence: |
  Run against the live dev container (homebridge/homebridge:latest, Homebridge v2.4.0, HAP v2.2.2,
  Node v24.20.0) holding the one real Gemini.

  **Method, stated because it simulates the upgrade rather than installing an older build.** The
  container was stopped, and the four record characteristics were deleted from both PumpService
  entries in `dev/homebridge/accessories/cachedAccessories` -- three from Primary Pump, four from
  Backup Pump -- leaving each service persisted exactly as a pre-release cache holds it:
  `[Name, Pump Running, Configured Name, Pump Fault, Status Fault, Status Active]`. The container was
  then started on that cache. This presents HAP with the shape the question is about, a persisted
  service lacking those characteristics; it does not reproduce any other difference a genuinely older
  build might have carried.

  **Result: all four adopted, each reading a real value.** After
  `Loading accessory from cache: Gemini (17 services no longer vouched for, 2 controls refusing
  presses)` and the first poll, the live HAP database read:

  - Primary Pump -- `Observation Start="2026-09-02T18:05:59.917Z"`,
    `Activations Observed Since Observation Start=15`,
    `Last Observed Activation At="2026-09-02T18:38:14.183Z"`
  - Backup Pump -- the same `Observation Start`, `Activations Observed Since Observation Start=0`,
    `Last Observed Activation At=""`, `Last Activation Was Self-Test=1`

  None is a format default: the counts and timestamps are the record this account actually
  accumulated on 2026-09-02, restored from accessory context and republished onto characteristics
  that did not exist on the service a moment earlier. `Last Observed Activation At=""` on the backup
  pump is the record's own never-observed value beside its count of zero, not an unset characteristic.

  Two corroborating details. The adopted characteristics sort **after** `Status Active` in the live
  service, where the pre-strip cache carried them before it, which is the signature of a runtime
  addition rather than a restore. And `cachedAccessories` was rewritten by the end of the run
  carrying all seven characteristics and their values, so the upgrade persists rather than repeating
  on every boot.

### 2. What Apple Home draws for a Switch carrying `StatusActive = false` (D-03)

test: In a real paired Apple Home, look at the System Self-Test and Alarm Mute switches while
the plugin has no decoded value for that control — send an out-of-domain `test_running` or
`alarm_audio_muted` so the scope goes untrustworthy.

expected: Record what Apple Home draws, and whether it is distinguishable from an ordinary off
switch.

why_human: D-03 rides on this. A Switch is writable, unlike the sensors Phase 3's StatusActive
check closed against, so the Phase 3 finding does not transfer.

### 3. What a tile shows for a characteristic answering an error status on a read (D-04 residual)

test: Press a control the plugin will refuse — System Self-Test off, or on while the device is
confirmed offline — and watch the tile in Apple Home.

expected: Record what Apple Home draws in the window before the clearing push lands, and confirm
the tile recovers.

why_human: The clearing push is proven to return the stored status to zero (probe and mutation),
but what a controller renders in the interval is Apple's behaviour.

### 4. The tile-visibility list against a real Apple Home

test: Compare the tile list in README.md "What the Home app draws a tile for" against what the
app actually shows for one installed accessory.

expected: The eleven listed services draw a tile, the five vendor-defined ones do not, Backup
Battery behaves as the README describes, and a room holding only this accessory's sensors behaves
as described.

why_human: The code side is verified — the two lists match the shipped service types exactly —
but whether Apple Home draws a tile for an Apple-namespace type in this arrangement is Apple's
behaviour, not the plugin's.

### 5. The Activity History section against Apple's own requirements page (CTRL-02)

test: Read README.md "Apple's Activity History" against https://support.apple.com/en-gb/105011
and confirm each factual claim: up to 30 days, supported home hub, current Home architecture, no
retention setting available to a plugin, no backfill.

expected: Every claim matches Apple's current documentation, or the section is corrected.

why_human: CTRL-02 is satisfied entirely by documentation, and the `<human-check>` recorded for
it was performed by the agent that wrote the prose. The negative claims CTRL-02 actually requires
are present and correct; what needs a human is the accuracy of the positive Apple facts beside
them.

status: passed
verified: 2026-09-04
evidence: |
  `README.md` section *Apple's Activity History* checked clause by clause against
  <https://support.apple.com/en-gb/105011> as that page reads on 2026-09-04.

  - "eligible accessories, including contact sensors" -- the page lists "garage doors, contact
    sensors, smoke detectors, doors and windows". Correct, and the relevant one: this plugin
    publishes eight contact sensors.
  - "Apple documents up to 30 days" -- "View up to 30 days of activity", and "Activity is
    permanently deleted after 30 days". Correct.
  - "It needs a supported home hub and the current Home architecture" -- "You need an Apple TV or
    HomePod with tvOS 17 or later in a home on the latest version of Apple Home". Correct as a
    paraphrase; the README's wording is looser than Apple's but says nothing Apple's page does not.
  - "The plugin cannot give it a retention setting" -- the page offers only "One Month" or "Off",
    with no adjustable window, and nothing a plugin could set. Correct.
  - "The plugin cannot put a missed event into it afterward" -- **Apple's page does not address
    backfill in either direction.** No correction is needed, because the sentence is a claim about
    what this plugin can do rather than about what Apple documents, and it is worded that way. Noted
    so a later reader does not go looking for an Apple citation that does not exist.

  No documentation defect found; the section stands as written.

### 6. G-001 — Alarm Mute against real hardware

test: Press Alarm Mute on real hardware and observe the acknowledgement, how long the reported
`alarm_audio_muted` takes to change, how long the mute lasts, and what happens when the request
fails.

expected: The four unknowns are measured, and `PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE` is
confirmed or corrected.

why_human: Carried forward, **not a Phase 4 gate** — it blocks `1.0.0` only. Nobody has observed
a real Gemini answer a mute request. The phase ships the contract as a single named provisional
constant and claims nothing about mute's behaviour, which is what CTRL-04 asked for.

## Session grouping

Items 2, 3 and 4 belong to ONE real-paired-home session, together with Phase 3's still-open
flood-automation check (a flood automation must survive a degraded `water` scope) and the
`G-003` / `G-004` gates. Item 1 needs an upgrade over an existing paired install. Item 5 is a
desk task needing no hardware. Item 6 needs the pump itself.
