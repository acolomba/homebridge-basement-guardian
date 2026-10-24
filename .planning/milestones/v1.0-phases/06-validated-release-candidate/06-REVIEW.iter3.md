---
phase: 06-validated-release-candidate
reviewed: 2026-09-05T13:23:38Z
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
  warning: 3
  info: 0
  total: 3
status: issues_found
---

# Phase 6: Code Review Report

**Reviewed:** 2026-09-05T13:23:38Z
**Depth:** standard
**Files Reviewed:** 79
**Status:** issues_found

## Summary

This is a re-review of the same 79-file scope as the prior `06-REVIEW.md`. Since that review, two
commits fixed both of its in-scope findings (`0ca3ee0` for CR-01, `586fcb2` for WR-01) and a third
(`83463e7`) reclassified `src/platform.ts` from Apache-2.0 to MIT in `LICENSE`/`NOTICE`/`README.md`.
I verified both fixes directly rather than trusting the fix report's own account: `test/packaging/
dependencyTelemetry.test.ts` now derives the scanned path set from `package-lock.json`'s `packages`
map instead of a single hard-coded `node_modules/mqtt` directory (confirmed against the installed
tree: 46 non-dev packages, all present on disk, all scanned), and `src/runtime/retryPolicy.ts`'s
`FIRST_RETRY_DELAY_MS = 500` now agrees with the formula that consumes it. `npx tsc --noEmit`, `npx
eslint . --max-warnings=0`, `npm test` (1444 unit cases), `npm run test:cucumber` (104 scenarios),
and `npx fallow dead-code|health|dupes` all pass; the one `dupes` hit is the pre-existing, already
accepted `remember`/`recall` duplication from `IN-01`, unchanged since the last review.

Reviewing the full scope again rather than only the diff surfaced three new findings the prior pass
did not report, all in the same class as CR-01: a static gate whose own text or design covers less
than it claims. None rises to the severity of CR-01 (that one silently skipped nearly the entire
scanned dependency tree); these are narrower gaps in gates added during this same phase.

## Warnings

### WR-01: `licenseHeaders.test.ts`'s own test title still claims three template-derived files

**File:** `test/packaging/licenseHeaders.test.ts:45,50,82`
**Issue:** `APACHE_DERIVED_FILES` holds exactly two entries (`src/index.ts`, `src/settings.ts`), and
the comment directly above it correctly says "The two `src/*.ts` files that stayed near-verbatim
Apache-2.0 template material" (line 45) after `src/platform.ts` was reclassified to MIT. But the
test case built from that same array, 32 lines later, still reads:

```ts
test('the three template-derived files carry the Apache-2.0 SPDX header and the template note (REL-05, D-035)', () => {
```

This title was never updated when the array dropped from three entries to two (it already read
"three" against a two-entry array at the commit that introduced it, `291d748`, which predates the
platform.ts reclassification commit `83463e7` that brought the rest of the surrounding prose into
agreement). A maintainer reading a failing-test list, or `grep`ing test titles for "platform.ts", is
told a fact about the license boundary that the code beside it already contradicts. This is exactly
the kind of drift `D-035`'s per-file gate exists to prevent in the shipped license text itself; the
gate's own self-description is not proofread against its own data.
**Fix:**
```ts
test('the two template-derived files carry the Apache-2.0 SPDX header and the template note (REL-05, D-035)', () => {
```

### WR-02: CI's only dependency-vulnerability check can never fail the build

**File:** `.github/workflows/build.yml:73-79`
**Issue:** The "List, audit, fix outdated dependencies and build again" step is the only place in
the entire pipeline that runs `npm audit`, and both of its security-relevant invocations discard
their exit status:

```yaml
run: |
  npm list --outdated
  npm audit || true  # ignore failures
  npm audit fix || true
  npm list --outdated
  npm run build
```

Every other supply-chain control this phase added is a hard gate that fails the job by design:
`dependencyAllowlist.test.ts` fails on any dependency beyond `mqtt`, `dependencyLicenses.test.ts`
fails on a GPL-family license, `dependencyTelemetry.test.ts` fails on a telemetry-SDK signature, and
the packaging workflow runs `trufflehog ... --fail`. A known CVE in `mqtt`'s dependency tree,
however, is only ever printed to a log nobody is required to read; `npm audit`'s own non-zero exit
on a found vulnerability is deliberately swallowed, so this step is unable to turn red no matter
what it finds. Given how deliberately this phase gates the license and telemetry boundaries, a
vulnerability scan that structurally cannot fail reads as an oversight rather than a considered
choice, and nothing in the workflow or `06-RESEARCH.md` states it as one.
**Fix:** At minimum, fail on `npm audit`'s own signal (it already exits non-zero only at the
configured severity threshold) and drop the auto-remediating `audit fix` step from CI, which mutates
`node_modules` mid-job for no effect that survives the job:
```yaml
- name: Audit production dependencies for known vulnerabilities
  run: npm audit --omit=dev
```

### WR-03: The GPL-license gate silently passes a production dependency with no recorded license

**File:** `test/packaging/dependencyLicenses.test.ts:47-51`
**Issue:** The violation filter drops any lockfile entry whose `license` field is absent before
testing it against `GPL_FAMILY`:

```ts
.filter(([, entry]) => entry.license != null && GPL_FAMILY.test(entry.license))
```

Today every one of the 46 non-dev packages in `package-lock.json` carries a `license` field, so the
gate currently examines the whole production closure and the test is green. But `npm`'s own lockfile
writer omits `license` for a package whose `package.json` does not declare one, or declares it as a
non-string form (a `licenses` array, an SPDX expression `npm` could not parse) — none of which is
hypothetical for a transitive dependency pulled in by a future `mqtt` upgrade. Such a package would
be silently treated as compliant rather than as a finding, which is the same shape of gap `CR-01`
already identified and fixed one file over in this same directory (a scan that covers less than it
implies it does): the module's own `@fileoverview` says the gate "fails by naming any GPL-family
package it finds," but a package with no recorded license is never named either way.
**Fix:** Treat a missing or unrecognized license as a finding rather than as compliant, the same way
an unusable auth cache or malformed shadow message is treated elsewhere in this codebase as "cannot
vouch" rather than "assume fine":
```ts
const violations = Object.entries(lockfile.packages)
  .filter(([path]) => path !== '')
  .filter(([, entry]) => !entry.dev)
  .filter(([, entry]) => entry.license == null || GPL_FAMILY.test(entry.license))
  .map(([path, entry]) => `${path} (${entry.license ?? 'no recorded license'})`);
```

---

_Reviewed: 2026-09-05T13:23:38Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
