---
phase: 01-secure-cloud-foundation
plan: 01
subsystem: infra
tags: [homebridge, typescript, node-test, cucumber, strong-mock, mqtt, eslint, npm-packaging]

requires: []
provides:
  - "Runtime dependency set reduced to `mqtt`; `homebridge-lib` and `ts-node` removed"
  - "`files` publish allowlist replacing `.npmignore`; `npm pack` drops from 755 files to 14"
  - "`tsconfig.test.json`, the second TypeScript project that emits src, test, and features into `dist-test`"
  - "Typed ESLint that parses `test/**` and `features/**` without a project-service error"
  - "`cucumber.json` with the `default` and `real` profiles"
  - "`build:test`, `test:unit`, `test:cucumber`, `test:coverage:direct`, `test:coverage:all` scripts, and a `test` script running both suites"
  - "`CHANGELOG.md` with Keep a Changelog structure and an Unreleased section"
  - "`src/platform.ts` as a composition root that records restored accessories and nothing else"
  - "Three mirrored test modules at 100 percent direct coverage"
  - "Local pre-commit hooks that fire on `test/**` and `features/**` commits"
affects: [01-02, 01-03, 01-04, 01-05, cloud-clients, accessory-adapters, cucumber-harness]

actuals:
  tokens: 6900
  tasks: 3
  commits: 5

tech-stack:
  added: [mqtt, "@cucumber/cucumber", aedes, ws, strong-mock]
  patterns:
    - "Compile-then-test: tsc emits to dist-test, node --test runs the emitted JavaScript"
    - "Publish allowlist over denylist"
    - "Enumerated dead-code exemptions that each phase retires as its package gains a consumer"

key-files:
  created:
    - tsconfig.test.json
    - cucumber.json
    - CHANGELOG.md
    - test/index.test.ts
    - test/settings.test.ts
    - test/platform.test.ts
    - test/hbConfig/config.example.json
  modified:
    - package.json
    - .fallowrc.json
    - eslint.config.js
    - .pre-commit-config.yaml
    - .gitignore
    - .prettierignore
    - src/platform.ts

key-decisions:
  - "Commit messages carry no phase-plan scope, because CLAUDE.md forbids planning references in commit titles"
  - "`ignoreDependencies` in `.fallowrc.json` carries an enumerated, self-retiring list rather than a broad glob"
  - "`dist-test/**` is excluded from dead-code analysis, because the test build copies the package manifest into that tree"
  - "`BasementGuardianAccessoryContext` keeps its interface form behind a targeted lint suppression rather than collapsing to a type alias"
  - "`test/settings.test.ts` imports the two JSON artifacts with import attributes rather than reading them through computed paths"

patterns-established:
  - "Mirrored test paths: every src/**/*.ts has one test/**/*.test.ts at the same relative path"
  - "Silent Logging stub built with Object.assign, because Logging is a callable interface"
  - "Strict strong-mock with no stated expectation as the proof that a port is never touched"

requirements-completed: [CONF-01]

coverage:
  - id: D1
    description: "The runtime dependency set is exactly `mqtt`, and the four development packages are installed"
    requirement: CONF-01
    verification:
      - kind: other
        ref: "node -e assertion over package.json dependencies, scripts, and files"
        status: pass
    human_judgment: false
  - id: D2
    description: "`npm pack --dry-run` lists only `dist/**` plus the four npm-forced files and `config.schema.json`"
    verification:
      - kind: other
        ref: "npm pack --dry-run --json piped through the allowlist assertion (14 files)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A `.ts` file under `test/` parses and lints clean under typed ESLint at --max-warnings=0"
    verification:
      - kind: other
        ref: "npx eslint test/lintProbe.test.ts --max-warnings=0 (probe created, linted, removed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The Cucumber `default` and `real` profiles resolve and the suite runs"
    verification:
      - kind: other
        ref: "node -e assertion over cucumber.json; npm run test:cucumber reports 0 scenarios and exits 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "`test/hbConfig/config.json` is untracked and ignored; `config.example.json` is tracked in its place"
    verification:
      - kind: other
        ref: "git check-ignore -q test/hbConfig/config.json && git ls-files --error-unmatch test/hbConfig/config.example.json"
        status: pass
    human_judgment: false
  - id: D6
    description: "The local pre-commit hooks fire on commits touching only `test/**` or `features/**`"
    verification:
      - kind: other
        ref: "node -e assertion over .pre-commit-config.yaml (0 stale patterns, 4 corrected); hooks ran on the test-only RED commit"
        status: pass
    human_judgment: false
  - id: D7
    description: "The platform records restored accessories under their UUID and touches nothing on the Homebridge API"
    verification:
      - kind: unit
        ref: "test/platform.test.ts#holds no accessory and calls nothing on the API once constructed"
        status: pass
      - kind: unit
        ref: "test/platform.test.ts#records a restored accessory under its UUID"
        status: pass
      - kind: unit
        ref: "test/platform.test.ts#keeps one entry when the same accessory is restored twice"
        status: pass
    human_judgment: false
  - id: D8
    description: "No code path removes a cached accessory from a user's HomeKit (D-03)"
    verification:
      - kind: unit
        ref: "test/platform.test.ts#D-03 removes nothing from HomeKit while restoring cached accessories"
        status: pass
      - kind: other
        ref: "grep for registerPlatformAccessories, updatePlatformAccessories, unregisterPlatformAccessories in src/platform.ts (0 hits)"
        status: pass
    human_judgment: false
  - id: D9
    description: "The plugin registers exactly one platform under the name `BasementGuardian`, aligned with the schema alias and the package name"
    requirement: CONF-01
    verification:
      - kind: unit
        ref: "test/index.test.ts#registers the Basement Guardian platform and touches nothing else on the API"
        status: pass
      - kind: unit
        ref: "test/settings.test.ts#names the platform the settings schema advertises as its plugin alias"
        status: pass
      - kind: unit
        ref: "test/settings.test.ts#names the plugin the package publishes"
        status: pass
    human_judgment: false
  - id: D10
    description: "`npm run check` passes across typecheck, lint, all three fallow sub-commands, format:check, and both test suites"
    verification:
      - kind: other
        ref: "npm run check (exit 0)"
        status: pass
    human_judgment: false
  - id: D11
    description: "A developer's existing Homebridge instance no longer receives example accessories from this build"
    verification: []
    human_judgment: true
    rationale: "Example accessories already written to a developer's accessory cache by an earlier `npm run watch` persist there. D-03 forbids the plugin from removing them, so only a human running the plugin against that instance can confirm the observed HomeKit state."

duration: 28min
completed: 2026-08-28
status: complete
---

# Phase 1 Plan 01: Toolchain and Template Teardown Summary

**A repository that builds, lints, dead-code-checks, tests, and packs cleanly, with the Homebridge template scaffold replaced by a platform that only records restored accessories.**

## Performance

- **Duration:** 28 min
- **Started:** 2026-08-28T21:46:13Z
- **Completed:** 2026-08-28T22:14:06Z
- **Tasks:** 3
- **Files modified:** 19

## Accomplishments

- `npm pack --dry-run` now lists 14 files instead of 755. The agent runtime directory, `research.tar.gz` with its live vendor scripts and captured cloud responses, `CLAUDE.md`, and `features/` no longer reach the published package.
- The template scaffold is gone. No example light, no two example motion sensors, and no unmanaged 10-second interval. `src/platform.ts` is 34 lines and holds no removal path of any kind.
- The first TypeScript test file can now land. Typed ESLint parses `test/**` and `features/**`, and `node:test`'s promise-returning `test()` no longer fails the lint gate.
- `test/hbConfig/config.json` is untracked and ignored before any developer supplies a real account password to it.
- Three mirrored test modules reach 100 percent line, branch, and function coverage per pair, run alone.

## Task Commits

1. **Task 1: dependency swap, scripts, packaging allowlist** - `f6fdc78` (build)
2. **Task 2: second TypeScript project, typed lint, ignore and hook configuration** - `3f08879` (build)
3. **Task 3: template teardown, TDD** - `c1ad984` (test, RED) → `c5f8e1d` (feat, GREEN) → `7f13220` (refactor)

## Files Created/Modified

- `package.json` - Dependency swap, six new scripts, `files` publish allowlist
- `package-lock.json` - Regenerated for the dependency swap
- `.npmignore` - Deleted; the allowlist replaces it
- `CHANGELOG.md` - Keep a Changelog structure with an Unreleased section
- `tsconfig.test.json` - Second project, `rootDir` `.`, `outDir` `dist-test`, covering src, test, features
- `eslint.config.js` - `parserOptions.project` over both projects, `dist-test/**` ignored, floating-promise override for test and feature sources
- `cucumber.json` - `default` and `real` profiles importing support code from `dist-test`
- `.fallowrc.json` - Enumerated dependency exemptions and a `dist-test/**` analysis exclusion
- `.pre-commit-config.yaml` - Corrected file patterns on the four local hooks
- `.gitignore` - `dist-test`, and `test/hbConfig/config.json` untracked
- `.prettierignore` - `dist-test/`
- `test/hbConfig/config.example.json` - Tracked stand-in for the development configuration
- `src/platform.ts` - Rewritten as a composition root
- `src/platformAccessory.ts` - Deleted
- `src/@types/homebridge-lib.d.ts` - Deleted with the directory
- `test/plugin.test.mjs` - Deleted; `test/index.test.ts` carries its assertion
- `test/index.test.ts`, `test/settings.test.ts`, `test/platform.test.ts` - Mirrored test modules

## Decisions Made

- **Commit messages carry no `(phase-plan)` scope.** CLAUDE.md instructs commit titles to avoid planning references, which overrides the GSD `{type}({phase}-{plan})` convention. The TDD gate sequence is still visible as `test:` → `feat:` → `refactor:`.
- **Dead-code exemptions are an enumerated, self-retiring list.** `mqtt`, `aedes`, and `ws` are installed here but first imported by later work. The list follows the precedent the research set for `ignoreFindings`: each entry disappears when its package gains a consumer. Two entries were already retired inside this plan.
- **`BasementGuardianAccessoryContext` keeps its interface form.** It is empty today and therefore equivalent to its supertype, which the lint rule correctly reports. A targeted suppression with a stated reason preserves the named extension point that the accessory adapters extend, rather than collapsing it to a type alias that would have to be converted back.
- **`test/settings.test.ts` imports `config.schema.json` and `package.json` with import attributes.** `tsc` copies both into `dist-test`, so the alignment assertions need no path arithmetic against the emitted layout.
- **The accessory doubles are `strong-mock` mocks, not cast object literals.** The unit-testing rule forbids hiding an invalid double behind an assertion, and a mock states exactly which accessory properties the platform reads.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Dead-code gate rejected the new dependency set**

- **Found during:** Task 1
- **Issue:** `npm run fallow` is part of `npm run check` and of the `npm-fallow` pre-commit hook, which fires on any `package.json` change. After the dependency swap it reported `mqtt`, `aedes`, `ws`, and `strong-mock` as unused (their first consumers arrive in later work) and `homebridge-lib` as unlisted (its last import is deleted in Task 3). The Task 1 commit could not pass its own hooks, and Task 3's `npm run check` acceptance criterion could not pass either.
- **Fix:** Added `ignoreDependencies` to `.fallowrc.json` as an enumerated list, mirroring the enumerated `ignoreFindings` convention the research established for the same class of conflict. `homebridge-lib` and `strong-mock` were removed from the list in `7f13220` once each stopped qualifying.
- **Files modified:** `.fallowrc.json`
- **Verification:** `npm run fallow` exits 0 at every commit in this plan.
- **Committed in:** `f6fdc78`, retired in `7f13220`

**2. [Rule 3 - Blocking] Dead-code gate read `dist-test/package.json` as a second package**

- **Found during:** Task 3
- **Issue:** `test/settings.test.ts` imports `../package.json`, so `tsc` copies it into `dist-test`. The analyzer treated that copy as a second package manifest and reported `homebridge` as an unused devDependency. `fallow`'s built-in ignores cover `**/dist/**` but not `dist-test`, and `npm run check` runs `fallow` before `test`, so whether the failure appeared depended on whether an earlier run had left `dist-test` on disk.
- **Fix:** Added `"ignorePatterns": ["dist-test/**"]`, matching the `dist-test` exclusions Task 2 added to git, prettier, and ESLint. A build output directory must not be analyzed.
- **Files modified:** `.fallowrc.json`
- **Verification:** `npm run fallow` exits 0 with `dist-test` present and absent.
- **Committed in:** `c1ad984`

**3. [Rule 3 - Blocking] Empty interface rejected by the lint gate**

- **Found during:** Task 3
- **Issue:** The plan specifies `BasementGuardianAccessoryContext` as an interface extending `UnknownContext` with no members. `@typescript-eslint/no-empty-object-type` reports that as equivalent to its supertype, failing `npm run lint` at `--max-warnings=0`.
- **Fix:** A single `// eslint-disable-next-line` with a stated reason, the suppression form the style guide already sanctions. The alternative, a type alias, would erase the extension point and have to be converted back.
- **Files modified:** `src/platform.ts`
- **Verification:** `npm run lint` exits 0; `npx tsc --noEmit` confirms the restored-accessory map still accepts a `PlatformAccessory` with no cast.
- **Committed in:** `c5f8e1d`

**4. [Rule 1 - Bug] Void-expression arrow in the registration expectation**

- **Found during:** Task 3
- **Issue:** `when(() => api.registerPlatform(...))` returns a void expression from a shorthand arrow, which `@typescript-eslint/no-confusing-void-expression` rejects.
- **Fix:** Block body, which is the form the style guide requires when the return value is discarded.
- **Files modified:** `test/index.test.ts`
- **Verification:** `npm run lint` exits 0; the case still fails against a platform that registers under the wrong name.
- **Committed in:** `c1ad984`

**5. [Rule 3 - Blocking] Exported accessory type lost its last consumer**

- **Found during:** Task 3
- **Issue:** Deleting `src/platformAccessory.ts` left `BasementGuardianPlatformAccessory` exported with no consumer outside its own module, which `fallow dead-code` reported. The export cannot simply be dropped: `private-type-leaks` is an error, and the exported `accessories` map references the type.
- **Fix:** `test/platform.test.ts` now asserts the value the map returns through that type. The test module that owns `src/platform.ts` should cover its exported type surface anyway.
- **Files modified:** `test/platform.test.ts`
- **Verification:** `npm run fallow` exits 0; the annotation fails to compile if the map's value type changes.
- **Committed in:** `c5f8e1d`

---

**Total deviations:** 5 auto-fixed (4 blocking, 1 bug)
**Impact on plan:** Every fix was needed to make a gate the plan itself requires pass. Three touched `.fallowrc.json`, which the plan did not list among its files; each was the minimum change that keeps `npm run check` green and self-retiring. No scope creep, and no acceptance criterion was weakened.

## TDD Gate Compliance

The RED, GREEN, and REFACTOR gates are all present, in order: `c1ad984` (`test:`), `c5f8e1d` (`feat:`), `7f13220` (`refactor:`).

Two notes on the gate sequence:

- **Commit scope.** The gate convention greps for `^test({phase}-{plan})`. These commits carry no phase-plan scope, because CLAUDE.md instructs commit titles to avoid planning references. The gate order is intact; only the scope string differs.
- **RED honesty.** All four `test/platform.test.ts` cases failed against the template implementation, for the behavioral reason under test: the constructor reaches into the injected API, so a strict mock rejects construction. The `test/index.test.ts` and `test/settings.test.ts` cases passed on first run. That is expected rather than a fail-fast trip, because this plan does not change `src/index.ts` or `src/settings.ts`; those two modules are characterization tests written to satisfy the mirrored-pairing rule and to preserve the deleted smoke test's assertion.

## Issues Encountered

- **Verifying the RED failure reason.** The worktree resolves bare module specifiers through the parent repository's `node_modules`, so `homebridge-lib` still loaded after Task 1 uninstalled it. That turned out to help: the RED run failed inside the constructor's HAP access rather than on module resolution, which is the behavior the cases are about.
- **The `--test-coverage-include` argument.** `test:coverage:direct` ends with a bare `--test-coverage-include`, so a caller supplies the source glob and the test file together: `npm run test:coverage:direct -- dist-test/src/platform.js dist-test/test/platform.test.js`. All three pairs report 100 percent lines, branches, and functions.
- **Cucumber with no feature files.** `npm run test:cucumber` reports `0 scenarios` and exits 0, so `npm run check` is green before the harness plan writes the first feature.

## Deferred Items

- The four local pre-commit hooks match `tsconfig\.json` but not `tsconfig.test.json` or `cucumber.json`. A commit that changes only one of those two files fires none of them. Out of scope here, which corrected the `(src|tests)/` pattern only.
- `package.json` still carries `private: true` and `version: 0.1.0`. STATE.md assigns both to a later phase.

## User Setup Required

None. No external service configuration is required by this plan.

A developer whose Homebridge instance already holds example accessories from an earlier `npm run watch` must clear that instance's cache by hand. The plugin must not delete anything from HomeKit (D-03), so the accessories persist until the developer removes them.

## Next Phase Readiness

Ready. Every quality gate the following plans depend on is green:

- `npm run check` exits 0 across typecheck, lint, all three `fallow` sub-commands, `format:check`, and both test suites.
- `test/**/*.ts` and `features/**/*.ts` parse under typed ESLint and compile through `tsconfig.test.json`.
- The Cucumber profiles resolve, so the harness plan needs only feature files and support code.
- `src/platform.ts` is an empty composition root awaiting configuration validation and runtime start-up.

Three entries remain in `.fallowrc.json`'s `ignoreDependencies`: `mqtt`, `aedes`, and `ws`. Each must be removed by the plan that first imports its package, and the list must be empty before release.

---

*Phase: 01-secure-cloud-foundation*
*Completed: 2026-08-28*
