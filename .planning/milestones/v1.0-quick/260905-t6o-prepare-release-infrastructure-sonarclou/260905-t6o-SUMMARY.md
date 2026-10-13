---
phase: quick-260905-t6o
plan: 01
subsystem: release-infrastructure
tags: [sonarcloud, ci, npm-publish, readme, changelog]
status: complete
dependency-graph:
  requires: []
  provides:
    - sonar-project.properties
    - test:coverage npm script
    - .github/workflows/sonarcloud.yml
  affects:
    - .github/workflows/publish.yml
    - README.md
    - CHANGELOG.md
tech-stack:
  added:
    - SonarCloud (SonarSource/sonarqube-scan-action@v8)
  patterns:
    - "node:test lcov reporter output rewritten from dist-test/src/*.js to src/*.ts so SonarCloud coverage import resolves against sonar.sources=src"
key-files:
  created:
    - sonar-project.properties
    - .github/workflows/sonarcloud.yml
  modified:
    - package.json
    - .github/workflows/publish.yml
    - README.md
    - CHANGELOG.md
decisions:
  - "Task 3's npm dist-tag change (staged next -> default latest) ships as instructed, per the maintainer's already-recorded decision; G-001..G-004 remain pending release gates, tracked separately."
metrics:
  duration: ~45 min
  completed: 2026-09-05
actuals:
  tokens: 14000
  tasks: 6
  commits: 6
---

# Phase quick-260905-t6o Plan 01: Prepare release infrastructure (SonarCloud, npm latest, README/CHANGELOG) Summary

Stood up SonarCloud analysis end to end (config, source-mapped coverage script, guarded CI workflow), pointed `publish.yml` at npm's real `latest` tag, added a CI/Sonar/GitHub/npm badge row and a rewritten release-status disclaimer to `README.md`, and cut `CHANGELOG.md`'s `[Unreleased]` section into a dated `[0.1.0] - 2026-09-05` release.

## What was built

1. **`sonar-project.properties`** (new) — `sonar.projectKey=acolomba_homebridge-basement-guardian`, `sonar.organization=acolomba`, `sonar.sources=src`, `sonar.tests=test,features`, `sonar.javascript.lcov.reportPaths=coverage/unit.lcov`, plus exclusions. `sonar.projectVersion=0.1.0` matches `package.json`.
2. **`package.json`'s new `test:coverage` script** — builds, runs `node --test` with `--experimental-test-coverage` and both `spec` (stdout) and `lcov` (`coverage/unit.lcov`) reporters, then rewrites every `SF:dist-test/src/*.js` marker line to `SF:src/*.ts` with an inline `node -e` script. Verified end to end: 100% line/branch/function coverage, zero remaining `dist-test` paths in the lcov output.
3. **`.github/workflows/sonarcloud.yml`** (new) — triggers on push/PR to `main` (with `paths-ignore: .planning/**`) and `workflow_dispatch`. Guards the job against `dependabot[bot]`-authored runs and fork-originated PRs (where `SONAR_TOKEN`/`GITHUB_TOKEN` are unavailable). Pins this repo's own `actions/checkout@v5` / `actions/setup-node@v6` and plain `npm install`, matching `package-audit.yml`'s style rather than the reference project's `v7`/`npm ci` pins.
4. **`.github/workflows/publish.yml`** — publish step now reads exactly `run: npm publish` with no `--tag` override, so it defaults to npm's `latest` tag. Comment above it rewritten to describe a real 0.1.0 release. `workflow_dispatch:` remains the sole trigger; checkout/setup-node/auth steps are unchanged.
5. **`README.md`** — added a badge row (CI, seven SonarCloud metrics, static GitHub and npm badges) directly under the H1. Rewrote the opening disclaimer blockquote to present 0.1.0 as a genuine release rather than an unshipped build, while pointing to "Values that are estimates" and "The two controls" for what real-hardware testing has not yet confirmed, and naming the still-pending real-Apple-Home notification confirmation. Kept the literal "vendor alarm" phrase `test/documentation.test.ts` gates on.
6. **`CHANGELOG.md`** — retitled `[Unreleased]` to `[0.1.0] - 2026-09-05`, added a fresh empty `[Unreleased]` heading above it, kept all 27 original bullets, and reworded the one bullet describing the README's vendor-guidance change so it no longer ties that guidance to a staged build.

## Verification

- `npm run test:coverage` exits 0; `coverage/unit.lcov` has zero `SF:dist-test` lines and 38 `SF:src/*.ts` lines, at 100% line/branch/function coverage.
- `pre-commit run check-yaml yamllint --files .github/workflows/sonarcloud.yml .github/workflows/publish.yml` — both pass.
- `.github/workflows/publish.yml` has exactly one `npm publish` line, with no `--tag`.
- `npm run build:test && node --test dist-test/test/documentation.test.js` — all 5 assertions pass, including the `/vendor alarm/i` gate (REL-08, D-026), against the rewritten README.
- `node --test dist-test/test/repositoryGovernance.test.js` — unaffected, all 4 pass.
- `CHANGELOG.md` has `## [0.1.0] - 2026-09-05` positioned after an empty `## [Unreleased]`, with all 27 original bullets intact.
- `git diff --stat` across all six commits touches exactly the six files in `files_modified`: `sonar-project.properties`, `package.json`, `.github/workflows/sonarcloud.yml`, `.github/workflows/publish.yml`, `README.md`, `CHANGELOG.md`.
- Full `npm run check` (typecheck, lint, fallow, format:check, unit tests, Cucumber) passes clean: 1449 unit tests, 104 Cucumber scenarios / 1156 steps, all green.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written, task by task.

### Note on the plan's own Task 4 verify script

Task 4's automated `BADGE_COUNT_OK` check uses `grep -c` (which counts matching *lines*) to assert seven occurrences of the SonarCloud badge URL pattern. Because the action explicitly instructs placing every badge on one single space-separated line (matching `pi-claude-marketplace`'s convention, and required for `mdformat`'s `wrap = "no"` / disabled `MD013` to leave it alone), `grep -c` on that pattern always returns `1` (one matching line), never `7`, regardless of how many badges are actually present. Confirmed the real requirement independently with `grep -o ... | wc -l`, which reported the correct count of 7 SonarCloud badges, 1 CI badge, 1 GitHub badge, and 1 npm badge. This is a mismatch in the plan's own verify script against its own action instructions, not a defect in the implementation — not logged to `WINDOWS.md` since it is a verify-script wording issue rather than a stub, skipped test, or unmet truth in the shipped code.

## Known Stubs

None. This plan adds infrastructure only (config, CI workflow, docs); no runtime code paths were stubbed.

## Threat Flags

None beyond what the plan's own `<threat_model>` already documents (T-t6o-01, T-t6o-02, T-t6o-03, T-t6o-SC) — no new trust boundary or surface was introduced outside that register.

## Self-Check: PASSED

- `sonar-project.properties` — FOUND
- `.github/workflows/sonarcloud.yml` — FOUND
- All six commit hashes verified present in `git log --oneline`:
  - `950b9c3` feat(release): add SonarCloud project config and coverage script
  - `6853417` feat(release): add SonarCloud Analysis CI workflow
  - `e55f146` feat(release): publish 0.1.0 to npm's default latest tag
  - `134da9e` feat(release): add CI, SonarCloud, GitHub, and npm badges to README
  - `533d09b` docs(release): rewrite the README disclaimer for a real 0.1.0 release
  - `3b76e49` docs(release): cut Unreleased into a dated 0.1.0 release
