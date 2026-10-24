---
phase: 07-cucumber-feature-conformance
plan: "15"
subsystem: testing
tags: [cucumber, device-tables, authentication, homekit-controls]
requires:
  - phase: 07-01
    provides: Phase 7 review protocol and offline baseline
  - phase: 07-02
    provides: ACCOUNT finding report
  - phase: 07-03
    provides: ACCESSORY finding report
  - phase: 07-04
    provides: HOMEKIT finding report
provides:
  - Same-account expired-cache refusal assertion with retained-cache wrong-result proof
  - Strict shared device-table parser used by shadow and accessory steps
  - Raw vendor command-path assertion with extra-query wrong-result proof
  - Forward closure record for two maintainer-adjudicated no-code findings
affects: [07-16, 07-14, FEAT-01, FEAT-02]
actuals:
  tokens: 4522
  tasks: 2
  commits: 2
plan_head_before: 836860317a38dd904a490a5487a3619e8a44b7d3
plan_head_after: cce1c1bbd798e17c54ad84d16ff334b5d0edbbcb
tech-stack:
  added: []
  patterns: [strict horizontal device-table parsing, temporary wrong-result controls]
key-files:
  created:
    - features/lib/deviceTables.ts
    - .planning/phases/07-cucumber-feature-conformance/07-15-SUMMARY.md
  modified:
    - features/account/sign-in.feature
    - features/step_definitions/account.steps.ts
    - features/step_definitions/shadow.steps.ts
    - features/shadow/connection-lifecycle.feature
    - features/step_definitions/accessory.steps.ts
    - features/step_definitions/controls.steps.ts
    - features/shadow/credential-rotation.feature
    - features/shadow/state-merging.feature
    - features/homekit/official-controls.feature
key-decisions:
  - Keep ACCESSORY-009's catalogue assertion and ACCESSORY-019's private-context scenario unchanged under the maintainer rulings.
  - Leave FEAT-01 and FEAT-02 pending until the other declaring plans finish and the combined gate passes.
requirements-completed: []
coverage:
  - id: D1
    description: Same-account expired-cache refusal and strict lower-case device input
    requirement: FEAT-01
    verification:
      - kind: integration
        ref: "cucumber-js --name 'A refused credential clears the cache and reports how to correct the account|The plugin requests the complete shadow on the first connection'"
        status: pass
    human_judgment: true
    rationale: Plan 07-16 owns the remaining headers and combined full gate.
  - id: D2
    description: Shared accessory parser and exact raw vendor command path
    requirement: FEAT-02
    verification:
      - kind: integration
        ref: "cucumber-js --name 'A valid Gemini becomes one registered accessory with a populated AccessoryInformation service|A press of the self-test switch reaches the vendor and the device.s report leaves it on|A rotation refreshes the next handshake and leaves the live one alone|A partial heartbeat keeps the fields it omits'"
        status: pass
    human_judgment: true
    rationale: Plan 07-16 owns the combined full gate and independent review of the new parser.
duration: 6min
completed: 2026-10-20
status: complete
---

# Phase 7 Plan 15: Adjudicated Cucumber repairs summary

An expired cache for the configured account now exercises the HTTP 403 deletion path. Device tables reject malformed input, and command assertions compare the complete recorded path.

## Results

- **CR-07-ACCOUNT-015 (FIX):** The refusal scenario seeds a token with the configured email fingerprint, `CACHE_SALT`, and expiry at `SCENARIO_START_TIME - 1000`. Its Given confirms the cache file exists before startup. The scenario retains one token request, the refusal log, cache absence, zero vendor requests, and credential-log checks.
- **CR-07-ACCOUNT-016 (ENFORCE, Plan 15 slice):** The five owned feature files use `device id` horizontal headers. `parseDeviceRows` accepts lower-case `device id`, `name`, optional `device type id`, and optional `water level`. It rejects unknown, repeated, missing, and blank fields. Plan 07-16 owns the remaining header rollout.
- **CR-07-ACCESSORY-007 (MOVE):** `parseAccessoryDevices` and its Gemini telemetry, device-type conversion, and numeric water-level validation live in `features/lib/deviceTables.ts`. Both accessory device-table call sites import that named export through `.js`.
- **CR-07-HOMEKIT-014 (FIX):** The command Then compares each recorded non-GET request's raw method, path, and JSON body. An extra query string is no longer stripped by URL pathname parsing.
- **CR-07-ACCESSORY-009 (ACCEPT):** The maintainer's forward closure keeps the declarative catalogue assertion unchanged. The ruling and prior direct-coverage evidence remain in `07-ADJUDICATION.md`. The historical ACCESSORY STOP report remains unchanged.
- **CR-07-ACCESSORY-019 (KEEP):** The maintainer's forward closure keeps the private-context synchronization Gherkin and steps unchanged. The ruling remains in `07-ADJUDICATION.md`; the historical ACCESSORY STOP report remains unchanged.

## Verification

- `npm run build:test` passed on Node `v26.12.0`. The two Task 1 scenarios passed **2/2 scenarios, 18/18 steps**. The four Task 2 scenarios passed **4/4 scenarios, 43/43 steps** after control removal. All scenarios used offline loopback fakes.
- A direct compiled-library check accepted one typed row and rejected six malformed tables: camelCase header, missing required header, repeated header, blank required cell, unequal row length, and nonnumeric water level.
- Temporary retained-cache control: after the refusal, the test step restored the same-account expired cache. The named scenario failed at `Then the token cache is absent` with `true !== false` (**1 failed scenario, 1 failed step**). The control was removed before commit.
- Temporary extra-query control: the test step added `?dryRun=1` to the recorded command path. The named self-test scenario failed at `Then the vendor receives 1 self-test command`; the diff showed `/devices/placeholder-gemini/data?dryRun=1` against `/devices/placeholder-gemini/data` (**1 failed scenario, 1 failed step**). The control was removed before commit.
- Fallow audit passed before both commits; both normal commit hooks passed. The first hook attempt caught an import-order error, which was fixed before the successful commit. No real profile ran.
- The combined `npm run check`, usage check, and real-profile dry run are assigned to Plan 07-16. This plan makes no full-gate claim.

## Task Commits

1. Task 1, same-account refusal and shared parser: `2a76813` (`test(cucumber): validate device tables and refusal cache`).
2. Task 2, raw command path and remaining owned headers: `cce1c1b` (`test(cucumber): compare exact vendor command paths`).

The persisted plan ledger measures **2** commits from `8368603` through `cce1c1b`. The realized ten-file diff is 18,089 characters, or 4,522 estimate-scale tokens after division by four.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Moved accessory caller migration into Task 1**

- **Found during:** Task 1 pre-commit Fallow audit.
- **Issue:** Leaving the old parser in the accessory step module until Task 2 produced one unused new export and two duplicate-code groups. The audit failed on the intermediate task boundary.
- **Fix:** Removed the old parser and connected both accessory call sites in Task 1. Task 2 then changed the raw path assertion and three feature headers. All ten owned paths remained within this plan.
- **Verification:** The focused Task 1 scenarios, six malformed table probes, and Fallow audit passed before the Task 1 commit.
- **Committed in:** `2a76813`.

## Known Stubs

None. `placeholder-*` values are offline fixture identifiers and credentials, not product stubs.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Next Phase Readiness

`requirements.ready-ids` returned `ready: []` and `blocked: [FEAT-01, FEAT-02]`; neither shared requirement was marked complete. Plan 07-16 must finish the header rollout, independently review the new parser, and run the combined full check, usage check, and seven-scenario/41-step real-profile dry run. Plan 07-14 then reconciles the forward outcomes with the unchanged ACCOUNT, ACCESSORY, and HOMEKIT STOP reports.

## Self-Check: PASSED

All ten owned feature paths and this summary exist. Both task commits are ancestors of HEAD, and the persisted ledger measured two commits before the metadata commit.
