---
phase: 03-safety-monitoring-in-homekit
plan: 03
subsystem: config
tags: [homebridge, config-schema, validation, notification-adapters]

requires:
  - phase: 01-account-configuration
    provides: validateConfig, BgConfig, the IntegerBounds refusal pattern, describeValue
  - phase: 02-safe-gemini-discovery-and-identity
    provides: the accessory that will publish the service set ignoredFaults filters
provides:
  - "'primary-pump-running' on CoreServiceKind, the eighth truthful service kind (D-13)"
  - NOTIFICATION_SERVICE_KINDS, the one runtime list of the seven removable notification names
  - isNotificationServiceKind, a hand-written predicate over administrator-supplied text
  - "BgConfig.ignoredFaults, resolved to the empty list when absent (D-017 publish-by-default)"
  - The D-17 refusal that names an unrecognised or repeated entry and enumerates all seven valid ones
  - The shipped ignoredFaults settings-form control, a unique array over the same seven names
  - An exhaustive seven-key settings-form gate plus a delay-token scan over every shipped key
affects: [service publication, accessory service set, platform wiring]

actuals:
  tokens: 29000
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A user-facing value domain declared once as a type and once as a runtime list, with the configuration check and the shipped form both tracing to the list"
    - "A field refusal that enumerates its whole valid domain, because the refusal is the only route back from a refused start"

key-files:
  created: []
  modified:
    - src/accessories/services.ts
    - src/config.ts
    - config.schema.json
    - test/accessories/services.test.ts
    - test/config.test.ts
    - test/configSchema.test.ts
    - test/runtime/accountRuntime.test.ts
    - features/support/world.ts

key-decisions:
  - "The refusal enumerates the seven valid names by joining NOTIFICATION_SERVICE_KINDS, so the message can never name a sensor the type does not declare"
  - "ignoredFaults is checked last in firstRefusal, after both integer fields, keeping the reason for a multi-problem configuration fixed"
  - "An entry that is not text takes the unknown-name refusal rather than a separate type refusal; the administrator needs the valid names either way"
  - "Membership is tested through a widened readonly string[] view of the same list rather than an `as` assertion"

patterns-established:
  - "Value-domain drift gate: the shipped settings-form enum and the runtime list are each compared entry by entry against the same independently written literal, so neither can drift unnoticed"
  - "Absence gate: SAFE-07 is proven by scanning every shipped form key for delay-shaped tokens, read from the file rather than a literal, so a key added later is covered"

requirements-completed: [CONF-06, SAFE-07]

coverage:
  - id: D1
    description: "'primary-pump-running' is a CoreServiceKind and not a NotificationServiceKind, leaving the removable list at seven (D-13)"
    requirement: CONF-06
    verification:
      - kind: unit
        ref: "test/accessories/services.test.ts#satisfies CoreServiceKind and @ts-expect-error negatives"
        status: pass
    human_judgment: false
  - id: D2
    description: "NOTIFICATION_SERVICE_KINDS lists exactly the seven removable names in declaration order, and isNotificationServiceKind narrows only those"
    requirement: CONF-06
    verification:
      - kind: unit
        ref: "test/accessories/services.test.ts#CONF-06 lists the seven removable notification sensors in declaration order"
        status: pass
      - kind: unit
        ref: "test/accessories/services.test.ts#refuses a truthful service kind as a removable notification sensor"
        status: pass
    human_judgment: false
  - id: D3
    description: "An absent ignoredFaults resolves to the empty list; an empty, single, full, and reversed list are each accepted and resolved in the supplied order"
    requirement: CONF-06
    verification:
      - kind: unit
        ref: "test/config.test.ts#CONF-06 accepts an empty list and resolves it in the supplied order"
        status: pass
      - kind: unit
        ref: "test/config.test.ts#CONF-06 publishes every adapter when the configuration omits the removable sensor list"
        status: pass
    human_judgment: false
  - id: D4
    description: "An unrecognised entry refuses the configuration, and the refusal names that entry and enumerates all seven valid ones (D-17)"
    requirement: CONF-06
    verification:
      - kind: unit
        ref: "test/config.test.ts#CONF-06 names {sensor} in the refusal for an unrecognised removable sensor (7 cases)"
        status: pass
      - kind: unit
        ref: "test/config.test.ts#CONF-06 refuses a misspelled sensor name and enumerates every removable sensor"
        status: pass
    human_judgment: false
  - id: D5
    description: "A repeated entry refuses the configuration, and the refusal names the repeated entry and says the list must be unique"
    requirement: CONF-06
    verification:
      - kind: unit
        ref: "test/config.test.ts#CONF-06 refuses a repeated removable sensor and says the list must be unique"
        status: pass
    human_judgment: false
  - id: D6
    description: "A null, a bare string, an object, and a number each refuse with a reason describing the supplied value; the poll interval is still reported first"
    requirement: CONF-06
    verification:
      - kind: unit
        ref: "test/config.test.ts#CONF-06 refuses a removable sensor list of {value} that is not a list (4 cases)"
        status: pass
      - kind: unit
        ref: "test/config.test.ts#CONF-06 reports the poll interval before the removable sensor list when both are wrong"
        status: pass
    human_judgment: false
  - id: D7
    description: "No ignoredFaults refusal quotes the account email, the password, or any account identifier"
    requirement: CONF-06
    verification:
      - kind: unit
        ref: "test/config.test.ts#CONF-06 refuses an unrecognised removable sensor without quoting the account email"
        status: pass
    human_judgment: false
  - id: D8
    description: "The shipped settings form offers ignoredFaults as a unique array whose enum equals the seven names the type declares"
    requirement: CONF-06
    verification:
      - kind: unit
        ref: "test/configSchema.test.ts#CONF-06 offers exactly the seven removable notification sensors and no other value"
        status: pass
      - kind: unit
        ref: "test/configSchema.test.ts#CONF-06 offers the removable notification sensors as a list that cannot repeat a name"
        status: pass
    human_judgment: false
  - id: D9
    description: "The settings form offers exactly seven keys and none of them reads as a delay, debounce, acknowledgement, latch, or quiet-hours control (SAFE-07, D-18)"
    requirement: SAFE-07
    verification:
      - kind: unit
        ref: "test/configSchema.test.ts#SAFE-07 offers no settings-form control that could delay a notification"
        status: pass
      - kind: unit
        ref: "test/configSchema.test.ts#CONF-04 exposes no vendor protocol constant other than the client identifier"
        status: pass
    human_judgment: false

duration: 31 min
completed: 2026-08-30
status: complete
---

# Phase 3 Plan 3: The ignoredFaults Configuration Surface Summary

**`ignoredFaults` as a unique enumerated list, with a D-17 refusal that names the offending entry and enumerates all seven valid ones, plus a seven-key settings-form gate that proves no alert-delay control exists.**

## Performance

- **Duration:** 31 min
- **Started:** 2026-08-30T14:22:00Z
- **Completed:** 2026-08-30T14:53:25Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- `'primary-pump-running'` joins `CoreServiceKind` as the eighth truthful kind, which is what keeps the removable list at seven names rather than eight (D-13).
- `NOTIFICATION_SERVICE_KINDS` and `isNotificationServiceKind` give the seven removable names a runtime identity. Both the configuration refusal and the shipped settings-form enum now trace to that one list.
- `BgConfig.ignoredFaults` parses and resolves like every other field: absent takes the documented empty default, which publishes every adapter (D-017); a supplied value is never clamped and never silently replaced.
- The D-17 refusal is testable behaviour rather than log prose. Seven separate cases each assert one valid name appears in the message, so dropping the enumeration breaks seven cases while still naming the bad entry.
- The settings form gained the `ignoredFaults` control, and the SAFE-07 absence gate now scans every shipped key for delay-shaped tokens instead of only pinning the key count.

## Task Commits

1. **Task 1: services.ts — the primary-pump-running kind and the runtime slug list** — `f34f9bf` (feat)
2. **Task 2: config.ts — ignoredFaults parsing and the D-17 refusal** — `71aa19a` (feat)
3. **Task 3: config.schema.json — the ignoredFaults control and the exhaustive seven-key gate** — `41f5170` (feat)

## Files Created/Modified

- `src/accessories/services.ts` — adds `'primary-pump-running'`, exports `NOTIFICATION_SERVICE_KINDS` and `isNotificationServiceKind`, and rewrites the `@fileoverview` sentence that called the module a declaration only.
- `src/config.ts` — adds `BgConfig.ignoredFaults`, `ignoredFaultsRefusal`, `resolveIgnoredFaults`, and a local `isUnknownArray` predicate; joins the refusal onto the end of the existing `??` chain.
- `config.schema.json` — adds the `ignoredFaults` array control with `uniqueItems: true` and a seven-name `items.enum`.
- `test/accessories/services.test.ts` — grows from a type-only module to twelve runtime cases plus the existing `satisfies` positives and `@ts-expect-error` negatives.
- `test/config.test.ts` — 23 new cases covering acceptance, refusal, message content, check order, and the no-identifier rule.
- `test/configSchema.test.ts` — the seven-key gate, the enum comparison, the `uniqueItems` case, and the delay-token scan.
- `test/runtime/accountRuntime.test.ts` — one line: `ignoredFaults: []` on the `BgConfig` literal.
- `features/support/world.ts` — one line: `ignoredFaults: []` on the harness runtime config.

## Decisions Made

- **The enumeration is joined from `NOTIFICATION_SERVICE_KINDS`, not written out in `src/config.ts`.** The message can then never name a sensor the type does not declare. The tests write the seven names out independently, so a drift between the two is caught rather than mirrored.
- **An entry that is not text (`[1]`) takes the unknown-name refusal, not a separate type refusal.** The administrator needs the list of valid names in either case, and a second message shape would be one more thing to keep in step with the type.
- **Membership is tested through a widened `readonly string[]` view of the same list.** `Array.includes` demands an argument of the element type; the project narrows with predicates and never with `as`, so a widened alias is the honest way to ask the question.
- **`ignoredFaults` is checked last in `firstRefusal`.** A configuration with several problems keeps reporting the same first reason, which is the property the existing fixed-order case already pins.

## Verification Evidence

Every gate below was run at the final state of the branch.

| Gate | Result |
|---|---|
| `test:coverage:direct` on `src/accessories/services.js` + its test | 12/12 pass, 100% lines/branches/functions |
| `test:coverage:direct` on `src/config.js` + its test | 58/58 pass, 100% lines/branches/functions |
| `node --test dist-test/test/configSchema.test.js` | 14/14 pass |
| `npm run test:cucumber` | 50 scenarios, 406 steps, all passed |
| `npm run check` | exit 0 on three consecutive runs; 710 unit tests, 50 scenarios |

### A passing test is not evidence — the defects that were patched back in

Each new gate was falsified by injecting the defect it exists to catch, rebuilding, and confirming that exactly the intended cases failed.

| Injected defect | Cases that failed |
|---|---|
| Two entries of `NOTIFICATION_SERVICE_KINDS` swapped | the declaration-order case (1 of 12) |
| One entry dropped from `NOTIFICATION_SERVICE_KINDS` | the order case and the `water-sensor-fault` predicate case (2 of 12) |
| Refusal drops the enumeration and names only the bad entry | 11 of 58 — all seven per-name cases plus the four whole-message cases. The "names the unrecognised entry" case still passed, which is correct: it is the seven-name loop that pins the enumeration, not the entry name. |
| Duplicate check removed | the duplicate case alone (1 of 58) |
| `ignoredFaults` checked before `pollInterval` | the fixed-order case alone (1 of 58) |
| `floodAlertDelaySeconds` added to the shipped form | the SAFE-07 delay-token case and the seven-key case (2 of 14) |
| One enum entry misspelled in the shipped form | the enum comparison case alone (1 of 14) |
| `uniqueItems` removed from the shipped form | the unique-list case alone (1 of 14) |

The SAFE-07 case passes trivially against the current schema because it asserts an absence. The `floodAlertDelaySeconds` injection is what makes it a gate rather than a tautology.

**One guard is compiler-enforced rather than case-enforced, and is reported as such.** The `typeof value === 'string'` half of `isNotificationServiceKind` cannot be falsified at run time: removing it does not change any answer, because `includes(1)` and `includes(undefined)` are already `false`. Removing it stops the module compiling, which is the real gate. The non-string cases cover its false branch for coverage and document the contract; they do not prove the guard.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `ReadonlyArray<T>` is forbidden by the lint gate**

- **Found during:** Task 2
- **Issue:** The accepted-list rows needed an annotation, because inference widens `[]` and `['mains-power-lost']` to `string[]`, which is not assignable to `readonly NotificationServiceKind[]`. Written as `ReadonlyArray<{ ... }>`, `@typescript-eslint/array-type` refused it: "Array type using 'ReadonlyArray<T>' is forbidden. Use 'readonly T[]' instead." The project's ESLint configuration is stricter here than the style guide's `Array<...>`-for-complex-types rule.
- **Fix:** Declared a module-local `AcceptedSensorList` interface and annotated the rows as `readonly AcceptedSensorList[]`.
- **Files modified:** `test/config.test.ts`
- **Verification:** `npm run lint` exit 0; `npm run check` exit 0 three times.
- **Committed in:** `71aa19a`

**2. [Rule 3 - Blocking] The `items` member is a named interface, not the inline object type the plan wrote**

- **Found during:** Task 3
- **Issue:** The plan's action specifies `items?: { type: string; enum: string[] }`. The style guide requires object types to be declared with `interface`, and the same ESLint `array-type` rule governs the nested `string[]`.
- **Fix:** Declared a module-local `SettingsFormItems` interface with the same two members and used `items?: SettingsFormItems`. The assertion is unchanged — the whole `items` object is compared against an inline literal.
- **Files modified:** `test/configSchema.test.ts`
- **Verification:** `npm run lint` and `npm run typecheck` exit 0; the enum-drift injection above still fails the case.
- **Committed in:** `41f5170`

**3. [Rule 3 - Blocking] Task 1's first commit title exceeded the gitlint limit**

- **Found during:** Task 1
- **Issue:** `gitlint` refused a 78-character title against the project's 72-character maximum, so the commit did not happen. It was caught by verifying `git log` rather than by assuming the commit succeeded.
- **Fix:** Retitled to "feat(03-03): add the primary pump activity kind and the slug list" (61 characters). No content changed.
- **Files modified:** none
- **Verification:** `git show --name-only HEAD` lists both intended files under `f34f9bf`.
- **Committed in:** `f34f9bf`

---

**Total deviations:** 3 auto-fixed (3 blocking).
**Impact on plan:** None on scope or behaviour. All three were forced by project gates the plan itself requires. No file outside the plan's `files_modified` was touched, and `.fallowrc.json` was not edited.

## TDD Gate Compliance

All three tasks carry `tdd="true"`. The RED phase was run and recorded for each, but **RED and GREEN landed in one commit per task rather than as separate `test(...)` then `feat(...)` commits.** This repeats the constraint 03-01 recorded, for the same reason: `.pre-commit-config.yaml` runs `npm run typecheck` project-wide on every commit touching `src/`, `test/`, or `features/`, and a RED commit here references exports that do not yet exist. `CLAUDE.md` forbids `--no-verify` outright. The two conventions are incompatible, and the project rule wins.

The RED observations themselves were made and are reported:

- **Task 1 RED:** three compile errors naming exactly the three additions — the two missing exports and `'primary-pump-running'` not satisfying `CoreServiceKind`.
- **Task 2 RED:** a genuine two-step. `BgConfig.ignoredFaults` and `resolveIgnoredFaults` were added first with no refusal logic, which compiled and let the suite run: **18 of 58 cases failed**, every one of them a refusal case, while all acceptance cases passed. Adding `ignoredFaultsRefusal` took it to 58/58.
- **Task 3 RED:** three of fourteen cases failed against the unchanged schema — the seven-key case, the `uniqueItems` case, and the enum case. The SAFE-07 delay case passed at RED, which is why it was falsified separately by injecting a delay key.

## Issues Encountered

None beyond the three blocking gates recorded above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `BgConfig.ignoredFaults` is resolved and available. Nothing consumes it yet: the plan that builds the service catalogue and the plan that wires `src/platform.ts` own routing it to the accessory's service set.
- `src/accessories/services.ts` now carries runtime values and has a production consumer in `src/config.ts`. Its entry in `.fallowrc.json` `ignoreFindings` is therefore stale, and removing it is deliberately left to the plan that owns that file, per the wave-serialisation hazard.
- No `subtype:` string literal and no custom service or characteristic UUID was written, so the D-12 one-way door stays closed for the plan that gates it.
- `PROJECT.md` still lists the backup-battery fault adapter as an open proposal. It was resolved against a sixth adapter during discussion, which is what keeps this list at seven names; removing the proposal is a phase-completion task.

## Self-Check: PASSED

- `src/accessories/services.ts`, `src/config.ts`, `config.schema.json`, and all five test/support files exist on disk with the stated changes.
- `f34f9bf`, `71aa19a`, and `41f5170` are all present in `git log`, and `git show --name-only` was run on each to confirm the intended files landed. No commit deleted a tracked file.
- Every task's `<acceptance_criteria>` was checked against the artifact — schema keys read back with `node`, message content read back with `grep`, one-line additions confirmed with `git diff --numstat`.
- The plan-level `<verification>` was re-run at the final branch state: both coverage pairs at 100%, the schema suite at 14/14, and `npm run check` exit 0 three consecutive times.

---
*Phase: 03-safety-monitoring-in-homekit*
*Completed: 2026-08-30*
