# Context: Refine planning artifacts against ingested intel

**Date:** 2026-08-28
**Status:** Decisions locked by the user. Do not revisit or re-ask.

## Why

A consistency and completeness audit compared `.planning/PROJECT.md`,
`.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, and `.planning/STATE.md`
against the ingested record in `.planning/intel/`. All 40 locked decisions were
present and the traceability arithmetic was correct. The audit found ten gaps
and inconsistencies. The user resolved each one. This task applies those
resolutions.

## Scope

Change only these files:

- `.planning/config.json` (already done — see "Already applied" below)
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/PROJECT.md`
- `.planning/STATE.md`

Do not change `.planning/intel/**`. It is the ingested record and the counts in
`SYNTHESIS.md` must stay accurate.

Do not change `docs/research/**`, `src/**`, `package.json`, or
`config.schema.json` in this task.

## Already applied before planning

`.planning/config.json` was updated through `gsd-tools query config-set`:

| Key | Was | Now |
|---|---|---|
| `runtime` | `codex` | `claude` |
| `claude_md_path` | `./.claude/CLAUDE.md` | `CLAUDE.md` |
| `context_window` | `272000` | `1000000` |
| `git.branching_strategy` | `none` | `phase` |
| `git.phase_branch_template` | `gsd/phase-{phase}-{slug}` | `features/phase-{phase}-{slug}` |
| `git.milestone_branch_template` | `gsd/{milestone}-{slug}` | `features/{milestone}-{slug}` |
| `git.quick_branch_template` | `null` | `features/quick-{slug}` |

Reason: the referenced `./.claude/CLAUDE.md` does not exist, the runtime did not
match the installed agent set, and `branching_strategy: none` conflicted with
the repository rule "NEVER commit to the main branch". Branch templates use
`features/` because `CLAUDE.md` permits only `main`, `features/*`, and
`releases/*`.

Do not repeat these edits. Verify them only.

## Decision 1 — Validation gates block the release, not the phase

`SAFE-01` and `CTRL-04` currently begin with "After G-002 closes," and "After
G-001 closes,". `ROADMAP.md` repeats the same gating in Phase 3 success
criterion 1 and Phase 4 success criteria 3 and 5.

The roadmap runs Phase 1 through Phase 6 in strict order. G-002 needs a natural
pump cycle, which depends on weather. G-003 needs a real Apple home. So an open
gate stalls every later phase, although the code can be written now. `REL-07`
already blocks `1.0.0` on the same gates, so the gates are counted twice.

**Resolution:** G-001 through G-004 block only the `1.0.0` release, through
`REL-07` in Phase 6. They never block phase completion. Phases deliver the
implementation and mark unvalidated constants provisional.

## Decision 2 — The D-014 invariant moves to Phase 3

`RES-01` and `RES-02` are in Phase 5, but Phase 3 success criterion 1 already
requires that invalid codes fault instead of guessing. That behavior is `RES-01`.

**Resolution:** move `RES-01` and `RES-02` to Phase 3. Phase 5 keeps `RES-03`
and `RES-04` and becomes restart behavior, confirmed-offline detection,
monitoring-path degradation, and recovery.

## Decision 3 — Add three requirements and one gate

`DEV-07`, `DEV-08`, `REL-08`, and gate `G-004`. Full text in the change list
below.

## Decision 4 — The backup-battery adapter stays a proposal

`intel/constraints.md` section 8 lists `battery_health == 32` (NotDetected) as a
fault-bearing signal with vendor rule `WW-GEM-ALERT-3`. But `D-008` enumerates
only five Apple Home fault adapters, and `intel/constraints.md` section 1
records that Apple Home does not render `StatusFault`. So a backup battery that
is not detected — a total loss of backup protection — is invisible in Apple
Home.

**Resolution:** record this as an open proposal in `PROJECT.md`, to resolve
during Phase 3 discussion. Do not change `D-008`. Changing it requires a
revision to the authoritative ADR at `docs/research/DECISIONS.md` first, per the
existing Evolution rule in `PROJECT.md`.

## Decision 5 — `ignoredFaults` keeps seven slugs

`intel/context.md` section 8 defines eight `ContactSensor` services, but `D-017`
enumerates seven `ignoredFaults` slugs. The missing one is
`primary-pump-running`.

**Resolution:** keep seven. `Primary Pump Running` is an activity adapter, not a
notification adapter. Record that reason in `CONF-06` so the omission reads as a
decision, not an oversight.

## Decision 6 — Record the heartbeat and staleness policy

**Resolution:** add the documented facts to `RES-01`.

---

# Change list

## A. `.planning/REQUIREMENTS.md`

### A1. Remove gate language from requirement text

- **SAFE-01** — delete the leading "After G-002 closes,". Restate: the **Sump Pit
  Level** service maps every legal Gemini water-level code (`0`, `1`, `3`, `7`,
  `15`, `31`) through an explicit lookup and never through a population count;
  unknown values fault the service instead of guessing a level; **Sump Pit
  Flood** activates only at the flood threshold. Add that the flood-threshold
  constant and the level mappings other than `1` stay provisional until G-002
  closes, and that G-002 blocks only the `1.0.0` release.
- **CTRL-04** — delete the leading "After G-001 closes,". Restate: **Alarm Mute**
  follows reported `alarm_audio_muted`, sends only the official
  `{"alarm_audio_muted": true}` boolean, and provides no duration, timer,
  simulated unmute, or off write while mute is active. Add that G-001 blocks
  only the `1.0.0` release.
- **CTRL-02** — remove the G-003 gating clause. Keep the documentation
  obligation: Activity History is controller-owned, it is not safety delivery,
  it has no configurable retention, and it is not a source of missed-event
  backfill. G-003 stays listed in `REL-07`.

### A2. Reword these requirements

- **RES-01** — append the heartbeat and staleness policy from
  `intel/context.md` section 1 and section 4: the device heartbeat is
  approximately 898 seconds; approximately 15 minutes of shadow silence is
  normal; shadow silence is a secondary staleness signal only after two missed
  heartbeats; one missed heartbeat is never evidence that the device is offline.
- **RES-03** — name the field. **Basement Guardian Offline** activates only
  after the configured number of successful REST snapshots report
  `connectivity.connected === false`. `data.offline === true` is corroboration
  and diagnostics only, and it never activates the adapter by itself (`D-016`).
  Keep the existing clause about failed REST requests and monitoring-path loss
  being logged and diagnosed separately.
- **CONF-05** — add the poll-interval bound of 300 through 3600 seconds with an
  approximately 900-second default. Add that `D-015`'s 105 to 120 minute
  worst-case offline confirmation assumes the default interval: a 3600-second
  interval with a count of 8 extends confirmation to approximately eight hours.
- **CONF-06** — add why `ignoredFaults` enumerates seven slugs and not eight.
  **Primary Pump Running** is an activity adapter, not a notification adapter,
  and it is deliberately not removable.
- **AUTH-02** — add that the cached ID-token file uses owner-only permissions
  where the operating system supports them.
- **SAFE-01** and **SAFE-05** — use the canonical service names from
  `intel/constraints.md` section 2: **Sump Pit Level** for the custom pit service
  and **Sump Mains Power** for the custom power service. `D-030` locks functional
  service names as stable identity, so fix the names here once.

### A3. Add three v1 requirements

Add to the "Device Families and Accessory Lifecycle" section:

- **DEV-07**: The accessory publishes a populated `AccessoryInformation` service
  with Manufacturer, Model, SerialNumber, and FirmwareRevision, sourced only
  from validated vendor identity and the metadata fields
  `mcu_firmware_version`, `wifi_firmware_version`, and `mcu_target_version`. It
  exposes remaining truthful metadata such as `wifi_signal_dbm` read-only where
  a semantically correct representation exists. The vendor `deviceId` never
  becomes a user-visible value, and `D-027` privacy rules continue to control
  logs, fixtures, and public artifacts.
- **DEV-08**: A published accessory whose `deviceTypeId` changes to an
  unsupported family, or whose payload stops validating after publication, keeps
  its HomeKit identity and last valid values, marks its services inactive or
  faulty, disables commands, logs the condition once, and is never unregistered
  for that reason alone. It resumes normal operation when a supported profile
  and fresh family-valid state return. (Locked by `C-002`.)

Add to the "Release Quality, Privacy, and Distribution" section:

- **REL-08**: User-facing documentation states that Homebridge stores the
  account password in plain text in `config.json` and in backups (`D-023`),
  recommends a child bridge while warning that a child bridge needs separate
  HomeKit pairing and that a bridge-mode change can recreate accessories and
  disrupt rooms, scenes, and automations (`D-036`), marks prerelease builds
  experimental and tells users to keep the vendor alarm and vendor notifications
  enabled (`D-026`), identifies the 25/50/75/100 battery percentages as
  documented estimates rather than measured charge (`D-012`), and makes no
  Critical Alerts guarantee for the flood Leak Sensor.

### A4. Add gate G-004

Source: `intel/constraints.md` section 5 item 1 — "Validate Leak Sensor
notification behavior with the supported Apple Home architecture and a current
home hub. Do not claim a Critical Alerts guarantee." No gate covers this
real-home item today.

- **G-004**: Validate **Sump Pit Flood** Leak Sensor notification delivery in a
  real eligible Apple home with a current home hub and the current Home
  architecture. Confirm that no documentation claims a Critical Alerts
  guarantee.
- **REL-07** — add G-004 to its gate list beside G-001, G-002, and G-003.

### A5. Traceability and coverage

- Move `RES-01` and `RES-02` from Phase 5 to Phase 3.
- Add `DEV-07` → Phase 2, `DEV-08` → Phase 2, `REL-08` → Phase 6.
- Update the coverage block: v1 requirements 43 → 46, mapped 46, unmapped 0.
- Update the "Last updated" footer line.

## B. `.planning/ROADMAP.md`

- **Overview** — state that hardware and real-home validation gates block only
  the `1.0.0` release, not phase completion.
- **Phase 2** — add `DEV-07` and `DEV-08` to its Requirements line. Add success
  criteria for (a) truthful identity and firmware metadata on the accessory and
  (b) a profile or payload that stops validating degrades the accessory in place
  instead of unregistering it.
- **Phase 3** — add `RES-01` and `RES-02` to its Requirements line. Rewrite
  success criterion 1 so it drops "After G-002 validation," and stays achievable
  without hardware validation: explicit lookup, fault on unknown, flood only at
  the threshold, threshold constant provisional. Add a success criterion for the
  `D-014` invariant: invalid or omitted fields preserve the last valid value and
  fault only the narrowest owning scope, and `serial_communications === false`
  immediately activates **Pump Controller Link Lost**.
- **Phase 4** — rewrite success criterion 3 so it drops "After G-001 hardware
  validation,". Rewrite success criterion 5 so G-003 is no longer a Phase 4
  completion condition; keep the Activity History documentation obligation and
  leave the G-003 real-home validation to Phase 6.
- **Phase 5** — remove `RES-01` and `RES-02` from its Requirements line, leaving
  `RES-03` and `RES-04`. Rewrite the phase goal and success criteria so the
  phase covers restart behavior, confirmed-offline detection, monitoring-path
  degradation, and recovery. Keep the criterion that distinguishes
  controller-link loss, vendor-confirmed device offline, and a degraded
  REST/MQTT monitoring path.
- **Phase 6** — add `REL-08` to its Requirements line. Update success criterion 4
  to list G-001, G-002, G-003, and G-004. Add a success criterion for the
  `REL-08` documentation obligations.

## C. `.planning/PROJECT.md`

- **Context** — add a bullet for G-004. Add a bullet stating that G-001 through
  G-004 block the `1.0.0` release only and do not block phase completion, and
  that phases deliver implementation with unvalidated constants marked
  provisional.
- Do **not** change any `<decisions status="locked">` block.
- **Evolution** — add a short "Open Proposals" subsection with the
  backup-battery fault adapter proposal from Decision 4 above, including its
  rationale and the note that resolving it in favor of the adapter requires a
  revision to `D-008` in `docs/research/DECISIONS.md` first.
- Update the "Last updated" footer line.

## D. `.planning/STATE.md`

- **Blockers/Concerns** — present G-001, G-002, and G-003 as `1.0.0` release
  gates rather than phase blockers. Add G-004 (Leak Sensor notification
  validation in a real Apple home; no Critical Alerts claim).
- **Pending Todos** — add the backup-battery fault adapter proposal for Phase 3
  discussion. Add three repository-drift items to handle in their phases:
  `package.json` `version: "1.0.0"` and `private: true` contradict `D-026`'s
  staged `0.x` prerelease plan; `package.json` `license: "Apache-2.0"`
  contradicts `D-035`'s `SEE LICENSE IN LICENSE`; `homebridge-lib` is still a
  runtime dependency and `config.schema.json` still has
  `strictValidation: false`.
- **Accumulated Context / Decisions** — update the Phase 3 anchor to include the
  `D-014` preserve-and-mark invariant. Update the Phase 4 anchor to record that
  gates no longer block phase completion.
- Keep `progress.total_phases` at 6. Update the "Last activity" line.

## Style and process

- Keep the existing document structure, heading style, and requirement ID
  format.
- Requirement prose follows the Simplified Technical English house style already
  used in these files: short sentences, active voice, one meaning per word.
- Run `pre-commit run --files <changed files>` before each commit. Fix failures,
  restage, and rerun until clean. Never use `--no-verify`.
- Work on the current branch. Do not create another branch and do not commit to
  `main`.
