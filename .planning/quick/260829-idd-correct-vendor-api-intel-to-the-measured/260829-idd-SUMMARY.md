---
phase: quick-260829-idd
plan: 01
subsystem: api
tags: [vendor-api, rest, aws-iot, intel, gemini, privacy]

requires:
  - phase: 01-secure-cloud-foundation
    provides: Live structure-only probes against the vendor API during Phase 1 UAT, which supplied the measurements recorded here.
provides:
  - Measured REST response envelopes for all four vendor routes in the intel record.
  - An unverified marker on the PUT command success body, with its reason.
  - The 13 measured top-level Gemini device keys in returned order, with serialNumber and productLine under attributes.
  - A privacy rule that separates runtime use of deviceId from public artifacts.
  - Observation status for the four Gemini metadata fields, scoped to the tested device.
affects: [02-safe-gemini-discovery-and-identity, gemini-adapter, rest-client, fixtures]

actuals:
  tokens: 7716
  tasks: 2
  commits: 1

tech-stack:
  added: []
  patterns:
    - "Measured facts in the intel record carry their measurement date."
    - "An absence found on one device is recorded as absent on the tested device, never as absent from the API."

key-files:
  created:
    - .planning/quick/260829-idd-correct-vendor-api-intel-to-the-measured/260829-idd-SUMMARY.md
  modified:
    - .planning/intel/constraints.md

key-decisions:
  - "The vendor deviceId is not sensitive at runtime, so the plugin can store it in accessory context and write it to runtime logs. D-027 still requires a placeholder in public artifacts."
  - "The unmeasured PUT success body stays in the record, marked unverified, because it is the best available claim."
  - "Fields that the measurement did not find stay in the record, marked not observed on the tested device."
  - "The section 5 shadow sentence stays in the record, marked unconfirmed, with the contradiction written next to it."

patterns-established:
  - "Response envelope column: every REST route in the intel record states the shape that wraps its result."
  - "One device, one firmware: a single sample never becomes a general claim about the vendor API."

requirements-completed: [INTEL-01, INTEL-02, INTEL-03, INTEL-04, INTEL-05, INTEL-06]

coverage:
  - id: D1
    description: "The REST routes table gives a measured response envelope for each of the four routes, with the plural key for /devices and the singular key for /devices/{deviceId}."
    requirement: INTEL-01
    verification:
      - kind: other
        ref: "G3: grep -cF '{ \"devices\": [ <device>, ... ] }' and grep -cF '{ \"device\": <device> }' over .planning/intel/constraints.md"
        status: pass
      - kind: other
        ref: "G5.1: sed section 4 region | grep -c '2026-08-29'"
        status: pass
    human_judgment: false
  - id: D2
    description: "The PUT /devices/{deviceId}/data success body is marked unverified, with the reason that no command was sent."
    requirement: INTEL-02
    verification:
      - kind: other
        ref: "G7: sed Gemini commands region | grep -icE 'unverified|not verified'"
        status: pass
    human_judgment: false
  - id: D3
    description: "The Gemini identity block lists the 13 measured top-level keys in returned order and places serialNumber and productLine under attributes."
    requirement: INTEL-03
    verification:
      - kind: other
        ref: "G1: identity block key order equals accountId,deviceId,deviceTypeId,location,name,homeId,roomId,state,data,timestamp,shadow,attributes,connectivity,attributes.serialNumber,attributes.productLine"
        status: pass
    human_judgment: false
  - id: D4
    description: "The privacy passage permits deviceId in accessory context and runtime logs, and keeps the D-027 placeholder rule for public artifacts."
    requirement: INTEL-04
    verification:
      - kind: other
        ref: "G2: grep -c 'only as the stable physical-accessory identifier' equals 0"
        status: pass
      - kind: other
        ref: "G6: sed identity region | grep -c 'D-027' is at least 1"
        status: pass
    human_judgment: false
  - id: D5
    description: "The metadata fields are placed in the state object, two are marked not observed on the tested device, and the section 5 shadow sentence is marked contradicted."
    requirement: INTEL-05
    verification:
      - kind: other
        ref: "G4: metadata table rows equal Yes, Yes, Not observed, Not observed"
        status: pass
      - kind: other
        ref: "G5.3 and G5.5: shadow region and metadata region each cite 2026-08-29"
        status: pass
    human_judgment: false
  - id: D6
    description: "The StatusFault conflict in context.md reaches the user as an open finding, and context.md is not edited."
    requirement: INTEL-06
    verification:
      - kind: other
        ref: "G11: git status --porcelain on context.md and 02-CONTEXT.md is empty; G12: the finding names context.md, StatusFault, D-014, and 02-CONTEXT.md"
        status: pass
    human_judgment: true
    rationale: "The user must rule on which of the two conflicting records is wrong. No automated check can make that decision."
  - id: D7
    description: "The new prose matches the file's voice, the four-space content indent survives, and every absence is framed as device-specific."
    verification:
      - kind: manual_procedural
        ref: "git diff HEAD~1 -- .planning/intel/constraints.md, read by eye"
        status: pass
    human_judgment: true
    rationale: "Voice, indent, and the device-specific framing of an absence are judgments that no gate can make."

duration: 8min
completed: 2026-08-29
status: complete
---

# Quick Task 260829-idd: Correct vendor API intel to the measured shape Summary

**The vendor API record now gives measured REST response envelopes, the real Gemini key layout with `serialNumber` under `attributes`, and an unverified marker on the one command response that was never sent.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-08-29T17:25:00Z
- **Completed:** 2026-08-29T17:33:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- The REST routes table now has a `Response envelope` column. The `/devices` route wraps its result in the plural key `devices`. The `/devices/{deviceId}` route wraps its result in the singular key `device`. Neither route answers a bare array or a bare device record. This omission is what let a broken REST client pass every Phase 1 gate.
- The `{ "success": true }` command body is marked unverified. The 2026-08-29 measurement sent no command, because a command operates a real sump pump.
- The Gemini identity block now lists the 13 measured top-level keys in returned order. `serialNumber` and `productLine` moved to `attributes`, where the measurement found them.
- The privacy passage separates two rules. The plugin can store `deviceId` in accessory context and runtime logs. D-027 still requires a placeholder in committed fixtures, samples, issue reports, and published documents.
- The Gemini metadata table names the `state` object as the home of its fields and marks `wifi_firmware_version` and `mcu_target_version` as not observed on the tested device. Neither field was deleted.
- The section 5 shadow sentence is kept and marked unconfirmed, with the contradiction recorded next to it.

## Task Commits

1. **Task 1: Correct the five measured passages in constraints.md** - `15ac20f` (docs)
2. **Task 2: Record the context.md StatusFault conflict as an open finding** - this SUMMARY, left uncommitted for the orchestrator

**Plan metadata:** not committed by this executor, per the dispatch instruction.

## Files Created/Modified

- `.planning/intel/constraints.md` - Five corrected passages: REST envelopes, the unverified command body, the Gemini identity block, the privacy rule, and the metadata observation status.
- `.planning/quick/260829-idd-correct-vendor-api-intel-to-the-measured/260829-idd-SUMMARY.md` - This summary, which carries the open finding.

## Open finding: conflicting degraded-state guidance

Three records disagree about what the plugin must do when a published device's payload stops validating. This task changed none of them. The user has to rule.

`.planning/intel/context.md` line 1459 is a table row. It says that when a published device's payload stops validating, the plugin keeps the accessory, sets `StatusFault` on every service, keeps last-known values, and logs once.

The Phase 2 decision of 2026-08-29 is in `.planning/phases/02-safe-gemini-discovery-and-identity/02-CONTEXT.md`, lines 103-104. It sets `StatusActive` to false on the affected services and leaves `StatusFault` at `NO_FAULT`. It reserves `StatusFault` for the five vendor-reported SAFE-04 conditions: primary pump, backup pump and fuse, water sensor, controller link, and confirmed offline. Its stated reason is that the device can be healthy while the plugin cannot interpret what the device sent.

D-014 is locked. It requires the plugin to apply a failure at the narrowest truthful scope. For a field that fails family validation, it marks the owning service faulty. `StatusFault` on every service is wider than the narrowest truthful scope.

The intel line is the outlier. The two current decisions both disagree with it.

One detail matters for the correction, so that a fix does not create a second conflict. D-014 and the Phase 2 decision do not name the same characteristic. D-014 sets `StatusFault = GENERAL_FAULT` when the controller link is lost, and it marks the owning service faulty when a field fails validation. The Phase 2 decision leaves `StatusFault` at `NO_FAULT` for a plugin-side validation failure. The two agree on scope and differ on the characteristic.

The decision for the user: correct `.planning/intel/context.md` line 1459, or reopen the Phase 2 decision. This task did not rule on it, and it edited neither file.

## Decisions Made

- Followed the plan literally on the `Not measured.` table cell. The plan said that each cell in the new `Response envelope` column is inline code, so the cell is `` `Not measured.` ``. Inline code around an English phrase is unusual. No gate covers it, and a plain-text cell would read better. Flagging it rather than changing it on my own.
- Chose "confirm" as the single verb for the concept, per the pragmatic-mode consistency rule in `simple-english`. The one exception is the word "unverified", which the plan requires as the unmissable status marker.
- Wrote the identity block with a 26-character key column, because `attributes.serialNumber` is 23 characters. The original block used the longest key plus three spaces, and this keeps that rule.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The TruffleHog pre-commit hook failed with the structural worktree error that `CLAUDE.md` documents: `failed to read index file: open <worktree>/.git/index: not a directory`. Resolved by the documented route. A filesystem scan over the changed path returned `verified_secrets: 0` and `unverified_secrets: 0` with exit 0, and only then was the commit prefixed with `SKIP=trufflehog`. No other hook was skipped.
- This repository has no installed git hooks. `/home/acolomba/homebridge-basement-guardian/.git/hooks/pre-commit` and `commit-msg` do not exist, so `git commit` ran no hooks by itself. The manual `pre-commit run --files .planning/intel/constraints.md` was therefore the real gate, which is the order `CLAUDE.md` requires anyway. `gitlint` was run separately against the commit message and passed. This is a pre-existing repository state, not a change made by this task.

## Verification Results

Every gate the plan defines was run. Each result below is the actual output.

| Gate | Expected | Actual | Result |
| --- | --- | --- | --- |
| G1 identity key order | The 15 keys in plan order | `accountId,deviceId,deviceTypeId,location,name,homeId,roomId,state,data,timestamp,shadow,attributes,connectivity,attributes.serialNumber,attributes.productLine` | Pass |
| G2 old claim gone | 0 | 0 | Pass |
| G3 REST envelopes | 1 and 1 | 1 and 1 | Pass |
| G4 metadata table | Yes, Yes, Not observed, Not observed | `Yes`, `Yes`, `Notobserved`, `Notobserved` | Pass |
| G5.1 section 4 date | >= 1 | 1 | Pass |
| G5.2 commands date | >= 1 | 1 | Pass |
| G5.3 shadow date | >= 1 | 1 | Pass |
| G5.4 identity date | >= 1 | 2 | Pass |
| G5.5 metadata date | >= 1 | 1 | Pass |
| G6 D-027 survives | >= 1 | 1 | Pass |
| G7 unverified marker | >= 1 | 1 | Pass |
| G8 no identifier leak | 0 and 0 | 0 and 0 | Pass |
| G9 scope | Empty | Empty for both commands | Pass |
| G10 pre-commit | Exit 0 | Every hook passed except TruffleHog, which aborted for the documented worktree reason. Covered by the filesystem scan. | Pass with the documented worktree route |
| G11 out-of-scope files clean | Empty | Empty for both commands | Pass |
| G12 finding names all three | >= 1 each | Present: `Open finding`, `context.md`, `StatusFault`, `D-014`, `02-CONTEXT.md` | Pass |

Human checks, Task 1. The four-space indent survives on every changed line, and both tables render with matching header, separator, and body column counts. No added line carries an em dash, an en dash, or trailing whitespace. Every new sentence is under the 25-word descriptive limit. Every absence is written as absent on the tested device.

Human check, Task 2. The finding names all three positions with their file paths and line numbers, so the user can rule without opening another file. It states no resolution.

## Next Phase Readiness

- Phase 2 can plan against a vendor API record that matches the wire. The `/devices` and `/devices/{deviceId}` envelopes and the `attributes` nesting are the two facts that a discovery and identity phase needs first.
- The open finding above blocks nothing, but Phase 2 implements degraded-state presentation. Rule on it before that code is written.

## Self-Check: PASSED

- `.planning/intel/constraints.md` exists and is committed.
- `.planning/quick/260829-idd-correct-vendor-api-intel-to-the-measured/260829-idd-SUMMARY.md` exists and is left uncommitted for the orchestrator.
- Commit `15ac20f` exists in `git log` and touches one file.
- `git status --short` lists only the untracked SUMMARY.

______________________________________________________________________

*Phase: quick-260829-idd*
*Completed: 2026-08-29*
