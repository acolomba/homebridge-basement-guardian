---
created: 2026-08-31T01:55:18.023Z
title: Document which services Apple Home renders
area: docs
severity: major
files:
  - README.md:125
  - README.md:133
  - README.md:78-84
  - src/accessories/customServices.ts:72-75
---

## Problem

The README reads as though every published service is something the owner can
look at. `README.md:125` says `Sump Pit Level`, `Primary Pump`, `Primary Pump
Running`, `Backup Pump`, `Sump Mains Power`, and both battery services "stay in
your home", and `README.md:133` explains the provisional water-level percentages
in the same register. Neither says that most of those services **do not appear
in Apple Home at all**.

Five of them are vendor-defined services whose UUIDs sit outside Apple's base
namespace (`src/accessories/customServices.ts:72-75`). Controllers render only
service types they recognise, so Apple Home draws no tile for `Sump Pit Level`,
`Primary Pump`, `Backup Pump`, `Sump Mains Power`, or `Backup Battery Facts`.
What Apple Home does show is `Sump Pit Flood` (a standard `LeakSensor`), the
seven Contact Sensors, and the standard `Battery`.

Observed on a real Homebridge 2.4.0 instance on 2026-08-30 against a real
device: the values are published and readable over HAP (`Water Level=20`,
`Raw Water Level Code=1`) but absent from the Homebridge UI, which is the same
class of controller behaviour. The owner noticed the pit level was missing and
asked whether it was represented at all.

**This is a documentation defect, not a code defect.** The invisibility is the
correct and deliberate consequence of ROADMAP SC-5 and `D-021` / `SAFE-06` —
standard services are used only for their defined meaning. `03-RESEARCH.md:400`
records that borrowing `HumiditySensor` or `AirQualitySensor` for a renderable
0-100 number was rejected, and that `WaterLevel` is declared optional on exactly
one standard service, `HumidifierDehumidifier`, which is a writable control
service and therefore barred by `SAFE-08`. Invisible-but-truthful was the only
remaining option.

The harm is that an owner reads the README, expects a pit-level tile, does not
get one, and concludes the plugin is broken — on a product whose whole purpose
is being trusted about basement conditions.

## Solution

Add a short README section naming which services Apple Home renders and which
need an Eve-class controller, and say plainly why: no Apple service means "sump
pit", and borrowing one that means something else would misreport what the
sensor is.

Place it next to the existing "When the plugin cannot vouch for a value"
section (`README.md:78-84`), which already explains the Apple-Home-versus-Eve
split for `StatusActive` — the same rendering distinction, so the two belong
together.

Use the `simple-english` and `humanizer` skills, as the rest of the README was
written.

Related to open Phase 3 human-verification item 2, which asks what Apple Home
draws for `StatusActive`. If that check is ever run, confirm the tile-visibility
list above at the same time — one real-home session answers both.
