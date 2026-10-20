---
phase: 07-cucumber-feature-conformance
plan: "16"
subsystem: testing
tags: [cucumber, feature-tables, offline-gate]
requires:
  - phase: 07-15
    provides: Adjudicated Cucumber repairs and focused wrong-result controls
provides:
  - Lower-case word headers in all horizontal device tables
  - Rejection of Gemini table columns that the shadow step does not use
  - Combined offline gate and independent complete-file review evidence
affects: [07-05, 07-14, FEAT-01, FEAT-02]
actuals:
  tokens: 3381
  tasks: 2
  commits: 1
plan_head_before: 50411dfcf1752883dba2351b680cf0e1a8de653b
plan_head_after: 9eda507b8ada35acd0a102e4321d7b5a77e7a6cc
tech-stack:
  added: []
  patterns: [strict device-table headers, local complete-file review]
key-files:
  created:
    - .planning/phases/07-cucumber-feature-conformance/07-16-SUMMARY.md
  modified:
    - features/harness/fakes.feature
    - features/homekit/safety-state.feature
    - features/monitoring/degradation.feature
    - features/plugin/lifecycle.feature
    - features/pump/records.feature
    - features/step_definitions/shadow.steps.ts
key-decisions:
  - Reject optional Gemini table columns that the shadow step does not use.
  - Keep FEAT-01 and FEAT-02 pending while other Phase 7 plans declare them.
requirements-completed: []
coverage:
  - id: D1
    description: All horizontal device headers use lower-case words
    requirement: FEAT-01
    verification:
      - kind: integration
        ref: npm run check
        status: pass
    human_judgment: false
  - id: D2
    description: The six adjudicated findings have verified forward outcomes
    requirement: FEAT-02
    verification:
      - kind: integration
        ref: npm run check
        status: pass
    human_judgment: true
    rationale: The maintainer accepted two no-code findings after reviewing their evidence.
duration: 20min
completed: 2026-10-20
status: complete
---

# Phase 7 Plan 16: Cucumber table and gate summary

All horizontal device tables use lower-case word headers. The combined offline gate passes.

## Results

- **CR-07-ACCOUNT-015 (FIX):** Plan 07-15 seeds an expired cache for the configured account before HTTP 403. Its retained-cache control fails at the cache-absence assertion.
- **CR-07-ACCOUNT-016 (ENFORCE):** This plan changed 29 headers in five feature files. The final search finds no camelCase field in a horizontal device header. Vertical two-cell maps remain unchanged.
- **CR-07-ACCESSORY-007 (MOVE):** Both accessory device steps use `features/lib/deviceTables.ts`. The parser rejects malformed headers, rows, and numeric water levels, as recorded in Plan 07-15.
- **CR-07-HOMEKIT-014 (FIX):** The command assertion reads the raw request path. Plan 07-15's extra-query control fails at the command assertion.
- **CR-07-ACCESSORY-009 (ACCEPT):** The maintainer accepted the production catalogue as the source of expected identity data. Its direct coverage is 542/542 lines, 70/70 functions, and 145/145 branches. The assertion stays unchanged.
- **CR-07-ACCESSORY-019 (KEEP):** The maintainer kept the private-context synchronization Gherkin and steps. They stay unchanged.

The last two decisions close forward remediation only. The ACCOUNT, ACCESSORY, and HOMEKIT batch reports still show their historical STOP outcomes.

## Independent acceptance review

A local `gsd-code-reviewer` read all 15 changed files in full. The first pass found one blocker: the Gemini shadow step accepted optional table fields and discarded them. Commit `9eda507` makes the step reject `device type id` and `water level` before fake vendor setup. The reviewer then reread both affected files in full and marked the blocker fixed. No forward review ID remains open from this acceptance pass.

The reviewer recorded these complete, contiguous spans. Each blob is the final `git hash-object` value.

| File | Blob | Lines |
| --- | --- | ---: |
| `features/account/sign-in.feature` | `cb1f28d9379ab316eaf89e8ff54955dec5b333df` | 1-51 |
| `features/harness/fakes.feature` | `d84f55efd5b21cec0816f6653d35aa06fa8b1539` | 1-99 |
| `features/homekit/official-controls.feature` | `69de42e6881a9b454c52b07a12f0a009d3709e85` | 1-212 |
| `features/homekit/safety-state.feature` | `a37e26be54a6bbcfdc3f07e99ef5530bcdcacb21` | 1-159 |
| `features/lib/deviceTables.ts` | `93838cea7faa5faa533e76bcefe9af6fd9e775d3` | 1-139 |
| `features/monitoring/degradation.feature` | `33abd364ec93b0aa96f19a5b1cd7ae76ecc8bc7b` | 1-707 |
| `features/plugin/lifecycle.feature` | `213fbb977abd1a24f90a228e76c663e312a99ff4` | 1-68 |
| `features/pump/records.feature` | `8e66b1f786fd919042aeb8dbc521ef3c8b920964` | 1-69 |
| `features/shadow/connection-lifecycle.feature` | `4c23223604c9ea42d3574cc35dd82202bc8fc80b` | 1-50 |
| `features/shadow/credential-rotation.feature` | `9b4d7a920fdc715611af0e3b9c956583045dc5f1` | 1-29 |
| `features/shadow/state-merging.feature` | `1d0c93f20bb300d324234c9efbeee9feed4acbca` | 1-86 |
| `features/step_definitions/accessory.steps.ts` | `e6852cf78395b833a933f35810e0558d92942326` | 1-312 |
| `features/step_definitions/account.steps.ts` | `3f42371d7d25e1e3944d810bb0c9224387770358` | 1-238 |
| `features/step_definitions/controls.steps.ts` | `355a4bed8497b9403e4524079338a9c0325aee47` | 1-319 |
| `features/step_definitions/shadow.steps.ts` | `cdd6d60699418e6031616170d421ac53563714a3` | 1-469 |

## Gate evidence

- The full gate passed: `NPM_CONFIG_CACHE=/private/tmp/gsd-phase7-npm-cache npm run check`, exit 0, Node `v26.12.0`. It passed static checks, the test build, unpaired tests, **104/104 Cucumber scenarios**, **1,174/1,174 steps**, and **43 direct coverage pairs**.
- The gate used HEAD `50411df` plus exactly six modified files: the five feature files above and `features/step_definitions/shadow.steps.ts`. There were no untracked repository files. The binary diff SHA-256 was `ff7c43b386cfe6fdc38fda891d1274a4686708da27d62f3827bc58856b9346be`. The diff from `50411df` to commit `9eda507` has the same hash. Commit hooks did not change these files.
- `cucumber-js --dry-run --format usage` exited 0. A search of its output found no `UNUSED`, `UNDEFINED`, or `AMBIGUOUS` entry.
- `cucumber-js --profile real --dry-run --format summary` exited 0: **7 scenarios skipped, 41 steps skipped**, with no live step executed.
- The header-search controls detected `waterLevel` in a later header column, ignored a vertical settings map, and found no camelCase field in the final horizontal device headers.
- Two temporary standalone Cucumber controls supplied `water level` and `device type id` to `Given these gemini devices:`. Each failed in that Given with `a Gemini device table accepts only device id and name`. Neither control is part of the repository.
- `git diff --check`, exact-file pre-commit checks, Fallow audit, and the normal commit hooks passed.

## Task commit and deviations

Commit `9eda507` covers the five header files and the Gemini shadow guard. It kept the six-file combined tree coherent for the full gate.

The independent review found the guard issue after Plan 07-15 closed. The coordinator made the four-line repair during Plan 07-16 and reran the full gate. An external review CLI was denied by automatic approval review because it would transmit complete private files. The local reviewer completed the required review without that transfer. The first full-gate attempts failed because the sandbox blocked the npm cache and local loopback sockets; the final run used a temporary cache and allowed local loopback access.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.

## Next phase readiness

`requirements.ready-ids` returned `ready: []` and `blocked: [FEAT-01, FEAT-02]`. Both remain pending while other Phase 7 plans declare them. Plan 07-05 can review the final shadow parser and feature tables. Plan 07-14 must reconcile the forward dispositions with the unchanged historical STOP reports and repeat the phase gate.

## Self-Check: PASSED

The six code and feature paths exist at `9eda507`. The full-gate input diff matches that commit. The local reviewer cleared its only blocker, and the repository checkout was clean before this summary was written.
