---
phase: 06-validated-release-candidate
reviewed: 2026-09-05T14:05:00Z
depth: standard
files_reviewed: 79
files_reviewed_list:
  - CHANGELOG.md
  - cucumber.json
  - dev/prep/g001-alarm-mute-checklist.md
  - dev/prep/g002-water-level-checklist.md
  - dev/prep/g003-g004-paired-home-checklist.md
  - dev/prep/release-checklist.md
  - dev/README.md
  - features/real-pump/discovery.feature
  - features/real-pump/heartbeats.feature
  - features/real-pump/lifecycle.feature
  - features/real-pump/support/heartbeatSteps.ts
  - features/real-pump/support/lifecycleSteps.ts
  - features/real-pump/support/realWorld.ts
  - features/real-pump/support/steps.ts
  - .github/ISSUE_TEMPLATE/bug-report.md
  - .github/ISSUE_TEMPLATE/support-request.md
  - .github/workflows/build.yml
  - .github/workflows/package-audit.yml
  - .github/workflows/publish.yml
  - LICENSE
  - NOTICE
  - package.json
  - README.md
  - SECURITY.md
  - src/accessories/alarmMute.ts
  - src/accessories/basementGuardian.ts
  - src/accessories/controls.ts
  - src/accessories/customCharacteristics.ts
  - src/accessories/customServices.ts
  - src/accessories/pumpRecords.ts
  - src/accessories/reconciliation.ts
  - src/accessories/serviceCatalogue.ts
  - src/accessories/services.ts
  - src/accessories/staleMarking.ts
  - src/cloud/api.ts
  - src/cloud/auth.ts
  - src/cloud/errors.ts
  - src/cloud/mqttTransport.ts
  - src/cloud/shadow.ts
  - src/cloud/sigv4.ts
  - src/cloud/types.ts
  - src/config.ts
  - src/device/events.ts
  - src/device/family.ts
  - src/device/gemini.ts
  - src/device/halo.ts
  - src/device/health.ts
  - src/device/registry.ts
  - src/device/state.ts
  - src/device/waterLevel.ts
  - src/index.ts
  - src/logging.ts
  - src/persistence/accessoryContext.ts
  - src/platform.ts
  - src/protocol.ts
  - src/runtime/accessoryStore.ts
  - src/runtime/accountRuntime.ts
  - src/runtime/arrivalAnchors.ts
  - src/runtime/clock.ts
  - src/runtime/commandPort.ts
  - src/runtime/failureLog.ts
  - src/runtime/monitoringHealth.ts
  - src/runtime/monotonicClock.ts
  - src/runtime/retryPolicy.ts
  - src/runtime/timers.ts
  - src/settings.ts
  - test/cloud/api.test.ts
  - test/cloud/auth.test.ts
  - test/cloud/mqttTransport.test.ts
  - test/cloud/shadow.test.ts
  - test/documentation.test.ts
  - test/packaging/dependencyAllowlist.test.ts
  - test/packaging/dependencyLicenses.test.ts
  - test/packaging/dependencyTelemetry.test.ts
  - test/packaging/licenseHeaders.test.ts
  - test/packedArtifact.test.ts
  - test/realPumpCommandBlock.test.ts
  - test/repositoryGovernance.test.ts
  - test/settings.test.ts
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 6: Code Review Report

**Reviewed:** 2026-09-05T14:05:00Z
**Depth:** standard
**Files Reviewed:** 79
**Status:** issues_found

## Summary

This is a re-review of the same 79-file scope as the prior `06-REVIEW.md`/`06-REVIEW.iter3.md`
passes. Since the last recorded review, three commits (`1a01df5`, `02faee4`, `a45d5cf`) fixed all
three warnings that pass reported (`WR-01` license-header test title, `WR-02` the CI `npm audit`
step that could never fail, `WR-03` the GPL-license gate that silently passed an unrecorded
license). I verified each fix directly against the current file contents rather than trusting the
prior fix report: `licenseHeaders.test.ts`'s test title now says "two" and matches the two-entry
`APACHE_DERIVED_FILES` array; `build.yml`'s audit step is now a single `npm audit --omit=dev` with
no `|| true` and no mid-job `audit fix`; and `dependencyLicenses.test.ts`'s filter now treats a
missing or unrecognized `license` field as a violation rather than silently passing it.

I then read every file in scope in full rather than only the files changed since the last review,
including the cloud transport layer, the device state store and family adapters, the account
runtime, the accessory/service-catalogue tier, the pump-observation record, the Cucumber real-pump
harness, and every packaging/governance test. The codebase is unusually rigorous: nearly every
function carries a comment stating the invariant it protects and the failure mode it was written
against, decoded telemetry is validated field-by-field before any value reaches HomeKit, every
disk write goes through a write-temp-then-rename sequence, and the safety rule (never guess, never
substitute a normal value for a doubtful one) is applied consistently across the state store, the
family adapters, and the service catalogue. I did not find a new bug, security issue, or logic
defect in the source, tests, or Cucumber harness.

The one new finding is in CI infrastructure: `package-audit.yml`'s TruffleHog installation step
pipes a script fetched from a mutable branch ref to `sh`, which is a supply-chain gap of exactly
the kind this project is otherwise careful to avoid (the pre-commit hook pins TruffleHog by git
tag; the workflow's own comment claims parity with that pin but does not achieve it).

## Warnings

### WR-01: The packaging workflow pins TruffleHog's binary version but not the script that installs it

**File:** `.github/workflows/package-audit.yml:42-46`
**Issue:** The "Install trufflehog" step fetches and executes an install script from TruffleHog's
`main` branch -- a mutable ref that can change on every run -- and only pins the binary version as
an argument to that script:

```yaml
run: |
  curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b /usr/local/bin v3.92.4
```

The comment directly above it says: "Pinned to the same revision `.pre-commit-config.yaml` already
pins for the trufflehog hook, so both scans run identical code." That is not what happens.
`.pre-commit-config.yaml` pins TruffleHog by `rev: v3.92.4` against `pre-commit`'s own repo-clone
mechanism, which checks out that exact tagged commit and runs the code as it existed there. This
workflow step instead always re-fetches whatever is currently on `main` of
`trufflesecurity/trufflehog` and executes it immediately via `sh`, before that script goes on to
install the pinned `v3.92.4` binary. If that install script is compromised, altered, or simply
changed in a way that mishandles its arguments between one workflow run and the next, this step
runs arbitrary code in CI with no version pin protecting it -- the `v3.92.4` argument only
constrains which trufflehog binary the (unpinned) script chooses to download. This is the classic
`curl | sh` supply-chain gap, and it sits in the one workflow whose whole job is scanning the
publish-bound tarball for leaked secrets, which makes the workflow's own install step the least
trustworthy line in it.
**Fix:** Pin the install script to the same tag the binary is pinned to, matching the precision
`.pre-commit-config.yaml` already has:
```yaml
run: |
  curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/v3.92.4/scripts/install.sh | sh -s -- -b /usr/local/bin v3.92.4
```
or better, download and verify the released binary archive directly (checksum-verified) rather than
executing a fetched shell script at all.

---

_Reviewed: 2026-09-05T14:05:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
