---
phase: quick-260907-c7j
plan: 01
subsystem: maintenance
tags: [sonarcloud, static-analysis, release, lockfile]
status: complete
requires: []
provides:
  - lockfile agreeing with the declared Node.js engine range
  - eight cleared SonarCloud findings
  - version 0.1.1
affects:
  - src/index.ts
  - src/config.ts
  - src/logging.ts
  - src/platform.ts
  - src/accessories/pumpRecords.ts
  - src/accessories/basementGuardian.ts
  - test/config.test.ts
  - package.json
  - package-lock.json
  - sonar-project.properties
  - CHANGELOG.md
tech-stack:
  added: []
  patterns:
    - String.raw for regex sources built through a template literal
    - module-scope constant for an injected-dependency default
key-files:
  created: []
  modified:
    - src/index.ts
    - src/config.ts
    - src/logging.ts
    - src/platform.ts
    - src/accessories/pumpRecords.ts
    - src/accessories/basementGuardian.ts
    - test/config.test.ts
    - package.json
    - package-lock.json
    - sonar-project.properties
    - CHANGELOG.md
decisions:
  - The named default export in src/index.ts is a function declaration, not the named const arrow the plan proposed, because the project style rule names a function declaration for that exact file.
  - EMAIL_PATTERN equivalence was proved by exhaustive comparison over a five-character alphabet up to length seven, then pinned by ten characterization cases.
  - The three String.raw conversions were accepted only after comparing the produced pattern sources byte for byte against the cooked ones.
metrics:
  duration: ~35 min
  completed: 2026-09-07
actuals:
  tokens: 3000
  tasks: 3
  commits: 3
  plan_head_before: b19ea58
---

# Quick Task 260907-c7j: Lockfile, SonarCloud Findings, and 0.1.1 Summary

Cleared the eight open SonarCloud findings without moving any behavior, captured the pending lockfile regeneration, and cut version 0.1.1 on `features/refinements`.

## Commits

| Task | Commit | Message | Files |
|------|--------|---------|-------|
| 1 | `ea6627b` | `chore: regenerate package-lock.json for the declared engine range` | `package-lock.json` |
| 2 | `7012d5b` | `refactor: clear the eight open SonarCloud findings` | `src/index.ts`, `src/config.ts`, `src/logging.ts`, `src/platform.ts`, `src/accessories/pumpRecords.ts`, `src/accessories/basementGuardian.ts`, `test/config.test.ts` |
| 3 | `bd7bb78` | `chore(release): bump version to 0.1.1` | `package.json`, `package-lock.json`, `sonar-project.properties`, `CHANGELOG.md` |

## What Was Done

### Task 1 — lockfile

`git diff package-lock.json` held exactly one hunk: the root package's `engines.node` moving from `^22.10.0 || ^24.0.0` to `^22.10.0 || ^24.0.0 || ^26.0.0`, the value `package.json` already carried. No version field, dependency, or integrity hash moved. Committed as generated.

### Task 2 — the eight findings

Every site was located by reading the file and matching the described code. The recorded line numbers were correct in all six cases, but they were not relied on.

| # | Rule | Site | Fix |
|---|------|------|-----|
| 1 | S7726 | `src/index.ts` | The unnamed default-export arrow became a named function declaration, `registerPlatform`. |
| 2 | S7780 x3 | `src/logging.ts` | The three `new RegExp(\`...\`)` template literals now use `String.raw`, with single backslashes replacing the doubled ones. |
| 3 | S8786 | `src/config.ts` | `EMAIL_PATTERN` became `/^[^\s@]+@[^\s@][^\s@.]*\.[^\s@]+$/`. Excluding the dot from the run before `\.` removes the quadratic backtracking. |
| 4 | S7737 | `src/platform.ts` | The `deps` parameter defaults to a module-level `DEFAULT_PLATFORM_DEPS` instead of a fresh object literal. |
| 5 | S7721 | `src/accessories/pumpRecords.ts` | `countWatchedActivation` moved, with its comment, from inside `createPumpRecords` to module scope between `recordValues` and `createPumpRecords`. It closes over nothing. |
| 6 | S2301 | `src/accessories/basementGuardian.ts` | `nextOfflineCount` takes `connectivity: DeviceSnapshot['connectivity']` instead of a bare `connected` boolean, and reads `.connected` in its body. Both call sites pass `snapshot.connectivity`. |

No `sonar-project.properties` ignore entry was added, and the existing S5332 entry was not touched. None of the eight rules runs in `npm run lint`, so local evidence proves no regression; the rule verdicts arrive on the next SonarCloud analysis.

### Task 3 — 0.1.1

`npm version 0.1.1 --no-git-tag-version` moved `package.json` and both lockfile version fields and nothing else. `sonar.projectVersion` follows. `CHANGELOG.md` gained a `## [0.1.1] - 2026-09-07` section below a surviving, empty `## [Unreleased]`, in the flat-bullet style the 0.1.0 entry uses. The entry does not claim new Node.js 26 support: `git show v0.1.0:package.json` confirms the `^26.0.0` range shipped in 0.1.0 and only the lockfile lagged. No tag was created.

## Behavior Preservation Evidence

The acceptance bar was that nothing observable changes. Three claims needed proof rather than inspection.

**The regex (T-c7j-01).** Old and new patterns were compared over every string up to length seven drawn from `["a", "b", "@", ".", " "]` — 97,655 strings covering each meaningful character class. Zero verdict differences. Ten hand-picked cases, including `user@example..test` and `user@example.test.`, agreed too. Ten characterization cases were then added to `test/config.test.ts` and run against the **unmodified** pattern first: 72 of 72 passed. The pattern was rewritten and the same 72 passed again.

**The credential patterns (T-c7j-02).** The three cooked sources were captured before the edit, the three `String.raw` sources were built after it, and the pairs were compared with `Buffer.compare`. All three are byte-identical, flags included. `test/logging.test.ts` passes unedited.

**The offline counter (T-c7j-03).** The branch and the `Math.min` clamp are unchanged; only how the connectivity value arrives changed. The Cucumber suite covering the offline-confirmation run passes at 104 scenarios and 1,156 steps.

`npm run check` passes end to end on the final tree: typecheck, lint, fallow, format check, 1,459 unit tests, and 104 Cucumber scenarios.

## Deviations from Plan

**1. [CLAUDE.md enforcement] `src/index.ts` uses a function declaration, not a named const arrow**

- **Found during:** Task 2, finding 1.
- **Issue:** The plan chose "bind the arrow to a named `const`, then `export default <name>`", reasoning that it avoids `function` keyword churn. The project rule at `.claude/rules/typescript-style-guide.md` contradicts this twice: "Prefer a function declaration for a named function", and, in the Homebridge exception that names this file, "`src/index.ts` exports exactly one default, a function declaration". Its worked example is this very file.
- **Fix:** Used `export default function registerPlatform(api: API): void`. Both forms satisfy S7726 equally; only this one satisfies the project rule. The plan's own verify regex, `export default [A-Za-z_]`, matches either.
- **Files modified:** `src/index.ts`
- **Commit:** `7012d5b`

**2. [Environment, not a code change] The Cucumber suite needed a different Node binary**

- **Found during:** Task 2 verification.
- **Issue:** `npm run check` failed at the Cucumber step with "Cucumber can only run on Node.js versions 22 || 24 || >=26. This Node.js version is v26.8.0-alpha.0.0.0". The Node on `PATH` (`~/.hermes/node`, v26.8.0-alpha.0.0.0) is a prerelease, which semver does not treat as satisfying `>=26`.
- **Diagnosis:** Pre-existing and environmental. `npx cucumber-js --version` fails identically, before any feature file or step definition loads, so no source edit can cause it.
- **Fix:** Ran the suite under the stable Homebrew Node v26.8.1 by prefixing `PATH="/opt/homebrew/bin:$PATH"` for those commands. No repository file, no version pin, and no configuration changed.
- **Files modified:** none

## Threat Flags

None. No new network endpoint, auth path, file access pattern, or trust-boundary schema change was introduced. The two boundaries the plan named were both narrowed rather than widened.

## Known Stubs

None. No stub, TODO, FIXME, skipped test, or unrun verification was left behind.

## Verification

- Three commits on `features/refinements`, in plan order.
- No branch created or switched, no tag created, nothing pushed, no PR opened.
- `--no-verify` was never used. `pre-commit run --files` ran over the staged paths before each of the three commits and passed with no file rewritten.
- `git status --porcelain` reports only the untracked `.planning/quick/260907-c7j-.../` directory, which the orchestrator commits separately.

## Self-Check: PASSED

All eleven touched files exist. All three commit hashes resolve. No stub patterns and no skipped tests in the changed files.
