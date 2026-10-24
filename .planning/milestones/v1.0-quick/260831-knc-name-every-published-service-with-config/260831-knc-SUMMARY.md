---
phase: quick-260831-knc
plan: 01
subsystem: accessories
tags: [homekit, hap, naming, safety]
status: complete
requires:
  - src/accessories/serviceCatalogue.ts
  - src/accessories/customServices.ts
  - features/support/fakeHap.ts
provides:
  - seedConfiguredName
  - ConfiguredName on every published service
affects:
  - src/accessories/basementGuardian.ts
tech-stack:
  added: []
  patterns:
    - One declaration guard shared by every writer that pushes onto a service.
    - Seed-only-when-absent for a paired-write characteristic the user owns.
key-files:
  created: []
  modified:
    - features/support/fakeHap.ts
    - features/support/steps/hap.ts
    - src/accessories/serviceCatalogue.ts
    - src/accessories/customServices.ts
    - src/accessories/basementGuardian.ts
    - test/accessories/serviceCatalogue.test.ts
    - test/accessories/basementGuardian.test.ts
    - test/accessories/customServices.test.ts
decisions:
  - Every catalogue row is seeded, not only the nine Apple Home draws, because one rule cannot drift while two lists can.
  - ConfiguredName is written only onto a service carrying no non-empty name, because HAP serialises the value into the Homebridge accessory cache.
  - No set handler is registered, so the first paired-write characteristic this plugin publishes reaches no vendor endpoint.
metrics:
  duration: 55 min
  completed: 2026-08-31
actuals:
  tokens: 41000
  tasks: 2
  commits: 1
requirements: [SAFE-04, SAFE-08]
---

# Quick Task 260831-knc: Name Every Published Service with ConfiguredName Summary

Every service the accessory publishes now carries `Configured Name`, seeded once
from the catalogue row's display name and never written over a name a paired
controller wrote.

## What Was Built

`seedConfiguredName(hap, service, displayName)` in `serviceCatalogue.ts`. It
declares `ConfiguredName` through a guard now shared with `publishValue`, then
writes the display name only when the service carries no non-empty name. Both
publish loops in `basementGuardian.ts` call it — `publishRows` after
`ensureService` answers a service, and `republishPublishedRows` after
`publishedService` does — so a degraded accessory and a service restored from the
Homebridge cache are named too.

The four vendor-defined services declare `ConfiguredName` optional alongside
`StatusActive` and `StatusFault`, which suppresses the HAP warning on a restored
accessory. The `customServices.ts` header no longer claims every characteristic
those services carry is read-only; it now says every *vendor-defined*
characteristic is, names `ConfiguredName` as the one writable member, and states
that no set handler exists for it and that the subtype is untouched.

The HAP stand-in carries `ConfiguredName` at the real identifier, the string
format, and all three permissions, defaulting to the empty string — the sentinel
the seeding rule reads.

## Verification

All gates run individually. `npm run build`, `npm run check` and `npm run fallow`
were never invoked directly.

| Gate | Result |
|------|--------|
| `npm run typecheck` | clean |
| `npm run lint` | clean |
| `npm run format:check` | clean |
| `npm run test:unit` | 1011 pass, 0 fail |
| `npm run test:cucumber` | 62 scenarios, 548 steps, all pass |
| `npm run test:coverage:all` | 100% lines, branches, functions across all files |
| `pre-commit run --files <8 changed files>` | every hook passed |

Structural checks from the plan:

- `git diff 5ce6aa1 -- src/accessories/services.ts` — empty. The `ServiceKind`
  union is untouched.
- `git diff 5ce6aa1 -- test/accessories/basementGuardian.test.ts | grep PUBLISHED_SERVICES`
  on changed lines — empty. The fifteen published descriptors are unchanged.
- No `subtype` line changed under `src/`. The only diff hits containing the word
  are comment rewraps in the `customServices.ts` header.
- `name: row.displayName` still builds `ServiceDescriptor`, so a user rename does
  not alter what the accessory reports as published.
- No display name is written as a literal in any new case. Test 5 and 6 read
  every expected name from `CATALOGUE`; the accessory-level cases resolve a row
  by its `ServiceKind` slug through a new `rowOfKind` helper.
- No second list of service names exists in `src/`.

### The new cases are not vacuous

Three mutation runs, each reverted immediately:

| Mutation | Result |
|----------|--------|
| Drop the seed from `publishRows` | 2 failures: the catalogue-sourced case and the no-clobber case |
| Drop the seed from `republishPublishedRows` | 1 failure: the degraded-path case |
| Remove the no-clobber guard (seed unconditionally) | 2 failures, including the no-clobber case |

Both call sites and the guard are load-bearing.

### Evidence re-confirmation

Finding 1 of the plan re-confirmed before any code was written. The pinned
`@homebridge/hap-nodejs` declares `ConfiguredName` with UUID
`000000E3-0000-1000-8000-0026BB765291`, format `string`, and perms `ev`, `pr`,
`pw` — all three as the plan recorded. No stop condition triggered.

## Deviations from Plan

### 1. [Plan-sanctioned] Task 1 and Task 2 folded into one `feat(...)` commit

**Found during:** Task 1, at the RED gate.

RED was real: `npm run test:unit` failed to build `dist-test` with
`TS2305: Module has no exported member 'seedConfiguredName'`, exactly as the plan
predicted. `npm run typecheck` passed, however — `tsconfig.json` includes only
`eslint.config.js`, `homebridge-ui` and `src`, so it never sees the test files.
The hook that actually blocked was `npm lint`: `eslint .` covers `test/`, and the
type-aware `@typescript-eslint/no-unsafe-call` rule reported four errors on the
unresolved `seedConfiguredName` calls.

Per the plan's own instruction, Tasks 1 and 2 were folded into one `feat(...)`
commit rather than shipping a stub to make the hook pass. No case was weakened.

This corrects a detail in `.planning/STATE.md`: a RED commit does pass the four
hooks in general, but not when the missing symbol is called from a test file,
because `npm lint` type-checks `test/` even though `npm typecheck` does not.

### 2. [Rule 2 - Missing critical functionality] Test 7 strengthened

**Found during:** Task 1, writing the degraded-path case.

The plan specified Test 7 as: publish while resolving, then send a snapshot whose
family no longer resolves, then assert the services still carry their names. That
case passes without the `republishPublishedRows` call site — the names were
already seeded by the first update, and an absent line cannot be caught by
coverage. It would have proven nothing about the second call site the plan's own
success criteria require.

The case now empties the name on one published service before the degraded
update, standing for a service restored from the Homebridge cache with no name,
and asserts it comes back while an untouched sibling keeps its own. The mutation
run above confirms it fails when the second seed is removed.

### 3. [Rule 3 - Naming] `statusCharacteristics` renamed to `sharedCharacteristics`

**Found during:** Task 2, in `customServices.ts`.

The constant now holds `ConfiguredName` beside the two status characteristics, so
the old name described a list it no longer is. Renamed with the comment amended.
No behavior change; the declaration order is `[...optional, StatusActive,
StatusFault, ConfiguredName]`, which the `customServices.test.ts` expectations
now state.

## Note on a Plan Verify Command

`grep -c "000000E3-0000-1000-8000-0026BB765291" features/support/fakeHap.ts features/support/steps/hap.ts`
answers `0` for `fakeHap.ts` and `1` for `steps/hap.ts`. This is correct rather
than a miss. The stand-in composes every one of its fifteen standard identifiers
from a shared `APPLE_BASE_UUID` suffix, and `ConfiguredName` follows that
convention with `` `000000E3${APPLE_BASE_UUID}` ``. The full literal is written
out in `steps/hap.ts`, which is where the drift check lives, exactly as
`LeakDetected` and `ContactSensorState` already do.

## dist/ UAT Scaffold State

**The scaffold is gone.** `grep -c __bgUatSnapshot dist/accessories/basementGuardian.js`
answered `2` before the commit and answers `0` after. `npm fallow` ran
`prefallow` → `npm run build` → `rimraf ./dist && tsc` as a commit hook, exactly
as the plan expected. This is correct, not a failure.

**Do not restore** `/tmp/claude-1000/-home-acolomba-homebridge-basement-guardian/6d35ecfb-0da8-444e-81dd-c9fc98f8d666/scratchpad/basementGuardian.patched.js`.
It predates this change and restoring it would put pre-change code back into
`dist/` and un-ship the fix.

Re-injection must target the freshly built
`dist/accessories/basementGuardian.js`, which now carries the change:
`grep -c seedConfiguredName dist/accessories/basementGuardian.js` answers `3`
(the import and both call sites).

## Container State

The container `bg-dev-homebridge` was **not** touched. It was never restarted,
stopped, reset, or watched. It is still running the pre-change build, so the
change has not reached the paired bridge.

## Outstanding

Both remaining items need one restart of the paired bridge, which is the Task 3
checkpoint.

1. **Live HAP probe.** `./dev/hb observe` reads `http://127.0.0.1:51826/accessories`,
   which is what a controller reads. It cannot say anything until Homebridge
   reloads the plugin. Expected: all fifteen services report a `Configured Name`
   equal to the `Name` beside it.
2. **The Apple Home check**, which this task cannot close and never could. Whether
   Apple Home labels a secondary service of a bridged accessory by
   `ConfiguredName` is controller-side and unobservable from this machine. See
   `<human_check>` in the plan for the five steps; steps 1 and 3 are the ones
   that matter, and step 3 — renaming a sensor and confirming the name survives
   two poll intervals — can only be answered in a real home, because only a real
   controller performs the paired write.

Both ride along with the `G-003` / `G-004` session already scheduled in
`.planning/STATE.md`, which needs the same paired home.

## Known Stubs

None.

## Threat Flags

None. The change introduces one paired-write characteristic, which the plan's
threat register already covers as `T-knc-01` through `T-knc-05`. The two
`mitigate` dispositions are both implemented and tested: the no-clobber rule
(`T-knc-01`) and the static gate proving no accessory module registers a set
handler (`T-knc-03`).

## Commits

| Commit | Message |
|--------|---------|
| `39560ac` | `feat(homekit): name every published service for controllers` |

## Self-Check: PASSED

- `src/accessories/serviceCatalogue.ts` — FOUND, exports `seedConfiguredName`
- `src/accessories/customServices.ts` — FOUND, declares `ConfiguredName`
- `src/accessories/basementGuardian.ts` — FOUND, two call sites
- `features/support/fakeHap.ts` — FOUND, carries `ConfiguredName`
- `features/support/steps/hap.ts` — FOUND, asserts the identifier
- `test/accessories/serviceCatalogue.test.ts` — FOUND, four helper cases
- `test/accessories/basementGuardian.test.ts` — FOUND, three accessory cases plus the set-handler gate
- `test/accessories/customServices.test.ts` — FOUND, four extended expectations
- Commit `39560ac` — FOUND in `git log`
- The commit deleted no tracked file, and no untracked file was left behind
