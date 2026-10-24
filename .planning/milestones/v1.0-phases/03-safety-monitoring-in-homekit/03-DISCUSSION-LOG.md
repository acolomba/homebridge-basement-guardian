# Phase 3: Safety Monitoring in HomeKit - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-30
**Phase:** 3-safety-monitoring-in-homekit
**Areas discussed:** Water level and flood threshold, Trust scoping, Degraded-state visibility,
Battery and the sixth adapter, Offline and staleness boundary, Service subtypes, `ignoredFaults`
handling, Custom vendor fact surface, `wifi_signal_dbm`, Missing `primary-pump-running` kind,
Proving `SAFE-07` immediacy, Service display names

---

## Water level: the percentage ladder

| Option | Description | Selected |
|--------|-------------|----------|
| Even five-step | `1→20, 3→40, 7→60, 15→80, 31→100`. Five equal steps for five stacked sensors; `31` is 100% of the reportable range. | ✓ |
| Headroom ladder | `1→17, 3→33, 7→50, 15→67, 31→83`, reserving 100% for a condition the device cannot report. | |
| Bottom-weighted | `1→10, 3→30, 7→50, 15→75, 31→100`, on the argument that risk rises faster near the top. | |

**User's choice:** Even five-step
**Notes:** The bottom-weighted curve would have been invented rather than measured — sensor
spacing is unknown. Every row but `1` stays provisional until G-002.

---

## Water level: what code `0` reports

| Option | Description | Selected |
|--------|-------------|----------|
| 0% — below lowest sensor | `SAFE-01` requires every legal code through the lookup; under the thermometer reading `0` means no sensor wet. | ✓ |
| Fault the Sump Pit service | Matches intel's line that `0` is unvalidated, but `SAFE-01` lists `0` among the codes the lookup must handle. | |

**User's choice:** 0% with `NO_FAULT`
**Notes:** Faulting a legal code would apply the behavior `SAFE-01` reserves for unknown codes.

---

## Water level: the flood threshold

| Option | Description | Selected |
|--------|-------------|----------|
| `31` only | Matches `WW-GEM-ALERT-7` (`water_level > 15`) exactly; `31` is the only legal code above `15`. | ✓ |
| `15` and above | Trips one step earlier for more warning time. | |

**User's choice:** `31` only
**Notes:** Firing at MidHigh would assert a flood the vendor does not treat as one, and `D-007`
forbids mislabeling routine level movement. The Sump Pit Level service already shows the rise.

---

## Trust scoping: how one invalid field maps onto scopes

| Option | Description | Selected |
|--------|-------------|----------|
| Per-field scope map | Field→`TrustScope` map plus a partial-decode path; one bad field faults one scope. Whole-accessory degradation reserved for an unresolvable family. | ✓ |
| Two-tier by violation kind | `missing` or unresolvable family degrades everything; `wrong-type` and `out-of-domain` degrade the owning scope only. | |
| Keep whole-snapshot degradation | No rework — Phase 2's behavior stands. | |

**User's choice:** Per-field scope map
**Notes:** Surfaced during the water-level discussion as a conflict between what Phase 2 built and
what Phase 3 promises. The do-nothing option was presented as the baseline but conflicts with
locked `D-014` and this phase's success criterion 6 — a bad `wifi_signal_dbm` type would have
blanked trust in flood detection. Confirmed beforehand that Phase 1's merge reducer folds partial
heartbeats key by key, so heartbeats do not present as missing fields.

---

## Degraded-state visibility in Apple Home

Research presented before the question: HAP-NodeJS's own wiki names `StatusActive = false` as the
recommended workaround and reserves `HapStatusError` for permanent user-actionable conditions; its
default advice to return a safe default is one this project rejects in favor of `D-014`.

| Option | Description | Selected |
|--------|-------------|----------|
| `StatusActive` only, plus documentation | Retain values, one warn log, README guidance. No ADR revision. | ✓ |
| Revise `D-016`, add one narrow adapter | A real tile, at the cost of an ADR revision and `CONF-06` going from seven slugs to eight. | |
| Ship `StatusActive`, defer the surface to Phase 5 | Decide visibility with the full offline picture in hand. | |

**User's choice:** `StatusActive` only, plus documentation
**Notes:** Closes the concern Phase 2 recorded for Phase 3. An unconfirmed HAP-NodeJS issue report
that inactive sensors drop out of automations was flagged as requiring verification rather than
assumption — if true it reopens this decision.

---

## Backup battery: the sixth adapter proposal

| Option | Description | Selected |
|--------|-------------|----------|
| No sixth adapter — use `StatusLowBattery` | Keep `D-008` at five; surface `battery_health == 32` through the standard Battery service. | ✓ |
| Yes — revise `D-008`, add the adapter | A real tile for a total-protection-loss condition, at the cost of an ADR revision and a `CONF-06` change. | |

**User's choice:** No sixth adapter
**Notes:** Resolves the open proposal recorded in PROJECT.md, against the adapter. Accepted trade:
`StatusLowBattery` is an indicator rather than a tile, and driving a "low" characteristic from a
"not detected" condition is a small semantic stretch.

---

## Backup battery: what drives `StatusLowBattery`

| Option | Description | Selected |
|--------|-------------|----------|
| Voltage low, or health Replace/Poor/NotDetected | Covers vendor rules `WW-GEM-ALERT-1`, `-2`, `-3`, `-11`. | ✓ |
| `battery_voltage_low` only | Strictest semantics, but Replace and NotDetected then have no Apple Home surface. | |

**User's choice:** Voltage low, or health `1`/`2`/`32`

---

## Backup battery: level versus health conflict

| Option | Description | Selected |
|--------|-------------|----------|
| Report the band as reported | No arbitration between two vendor fields the plugin has no evidence about. | ✓ |
| Fault the battery scope on the conflict | Treat a protection band with no detected battery as internally inconsistent. | |

**User's choice:** Report the band as reported
**Notes:** Faulting would rest on an unverified assumption about how the device pairs the two
fields. `StatusLowBattery` already carries the warning.

---

## Offline confirmation counter

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — counter and adapter together in Phase 3 | Consume `offlineConfirmationPollCount`; failed requests never count. | ✓ |
| No — adapter now, counter in Phase 5 | Smaller phase, but the adapter could flap on one transient disconnect. | |

**User's choice:** Counter and adapter together

---

## `RES-01` ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Split: field-validity in Phase 3, timers in Phase 5 | REQUIREMENTS.md records `RES-01` as spanning both phases. | ✓ |
| All of `RES-01` in Phase 3 | Keeps the requirement whole, but builds the timer before Phase 5 defines the distinction it serves. | |

**User's choice:** Split across Phase 3 and Phase 5

---

## `serial_communications === false` blast radius

| Option | Description | Selected |
|--------|-------------|----------|
| Every controller-derived scope | `water`, `pump`, `power`, `battery`, `fault` untrusted; only `connectivity` stays trusted. | ✓ |
| Pump and water only | Narrower, but `ac_power`, `battery_health` and the fault booleans also arrive through the controller. | |

**User's choice:** Every controller-derived scope
**Notes:** The narrow reading would publish stale values as current.

---

## Service subtype strings

| Option | Description | Selected |
|--------|-------------|----------|
| The `ServiceKind` slug verbatim | Same token the user types into `ignoredFaults`; readable in `cachedAccessories`. | ✓ |
| Namespaced or versioned prefix | Room to migrate later — but a later prefix change orphans every service. | |

**User's choice:** Slug verbatim
**Notes:** Rated one-way in CONTEXT.md. Subtypes are already scoped within one accessory, so a
namespace buys nothing.

---

## `ignoredFaults` validation

| Option | Description | Selected |
|--------|-------------|----------|
| Warn and ignore the bad entry | Plugin starts; monitoring stays active; log names the bad slug. *(recommended)* | |
| Refuse the configuration | Consistent with `validateConfig`'s existing refusals; a typo means the user did not get what they asked for. | ✓ |

**User's choice:** Refuse the configuration — **against the recommendation**
**Notes:** Chosen for consistency with the Phase 1 refusal policy. The accepted risk is that a
typo in a cosmetic list leaves the pump entirely unmonitored until the configuration is fixed. The
mitigation is entirely in message quality, so naming the bad slug and enumerating the seven valid
ones became a requirement of the decision rather than a nicety.

---

## Custom vendor fact surface

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror every exact fact | Raw `water_level` code published beside the mapped percentage. | ✓ |
| Only facts with no standard home | Leaner, but the provisional water-level mapping becomes unverifiable from HomeKit. | |

**User's choice:** Mirror every exact fact
**Notes:** Decisive argument was G-002 — publishing the raw code is what makes the provisional
ladder checkable against a real pit.

---

## `wifi_signal_dbm`

| Option | Description | Selected |
|--------|-------------|----------|
| Omit it entirely | Diagnostics, not a basement-protection condition; belongs to no `TrustScope`. | ✓ |
| Read-only characteristic on the accessory | Link quality for Eve-class apps, but needs an invented host service. | |

**User's choice:** Omit
**Notes:** Phase 2 named "concluding that none exists" a valid outcome. This is that conclusion.

---

## Missing `primary-pump-running` service kind

Raised by Claude after comparing `src/accessories/services.ts` against `HOMEKIT.md` §3.2 and
`CONF-06`: `CoreServiceKind` declares `'primary-pump'` but no kind for the `Primary Pump Running`
ContactSensor, while the backup side has both.

| Option | Description | Selected |
|--------|-------------|----------|
| Add as a non-removable core kind | Matches `CONF-06`'s stated reason for seven slugs rather than eight. | ✓ |
| Add as a removable notification kind | Would require a `CONF-06` requirement change. | |

**User's choice:** Non-removable core kind

---

## Proving `SAFE-07` immediacy

| Option | Description | Selected |
|--------|-------------|----------|
| Injected timer spy plus scenarios | Timer factory injected like `Clock`; assert zero calls across a transition. Falsifiable. | ✓ |
| Behavioral scenarios only | A debounce shorter than the harness advance would survive. | |

**User's choice:** Injected timer spy plus scenarios
**Notes:** Directly answers the Phase 1 hazard that a passing test is not evidence.

---

## Service display names

| Option | Description | Selected |
|--------|-------------|----------|
| `HOMEKIT.md` names verbatim | Apple Home groups tiles under their accessory; users rename freely. | ✓ |
| Prefix with the vendor device name | Disambiguates two systems, but leaves thirteen stale names after a vendor rename. | |

**User's choice:** Verbatim
**Notes:** `D-030`'s rename logic governs only the accessory name, so a prefix would not be
reached by it.

---

## Claude's Discretion

- Custom service and characteristic UUID allocation, and the module layout holding them.
- How the field→`TrustScope` map is expressed.
- The shape of the partly-valid decode result.
- The custom Pump service shape, so Phase 4 can add record characteristics without a subtype change.
- Exact log wording, subject to the `ignoredFaults` message content requirement.
- Whether `DistrustReason` gains members.
- Naming of the provisional water-level constants.

## Deferred Ideas

- Durable pump records and the two writable controls — Phase 4.
- Heartbeat timer, two-missed-heartbeat staleness, shadow silence as a secondary signal — Phase 5.
- Cached safety state across restart; confirmed-offline versus degraded monitoring path — Phase 5.
- A dedicated untrusted-data notification adapter — rejected; would need `D-016` revised first.
- Confirming the `<account-id>` format against a real inventory response — open from Phase 2.
