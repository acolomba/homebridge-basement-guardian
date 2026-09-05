---
phase: 06-validated-release-candidate
reviewed: 2026-09-05T05:17:11Z
depth: standard
files_reviewed: 55
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
  critical: 2
  warning: 1
  info: 0
  total: 3
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-09-05T05:17:11Z
**Depth:** standard
**Files Reviewed:** 79 (per the required-reading list; 32 `src/*.ts` files carried only a one-line SPDX header diff and were read but not re-analyzed for pre-existing logic, per the workflow's scoping note)
**Status:** issues_found

## Summary

This phase's substantive new logic is the outbound identity-header threading across `src/cloud/api.ts`, `src/cloud/auth.ts`, `src/cloud/mqttTransport.ts`, and `src/cloud/shadow.ts` (REL-03/REL-04), the real-pump Cucumber harness and its structural command-block gate (`test/realPumpCommandBlock.test.ts`, `features/real-pump/**`), the packaging/license gates under `test/packaging/`, and the new `LICENSE`/`NOTICE`/CI-workflow artifacts (REL-05).

The identity-header threading itself is correctly wired end to end (`PLUGIN_USER_AGENT` → REST reads, REST commands, the Auth0 grant, and the MQTT WebSocket handshake) and is well covered by `test/cloud/api.test.ts`, `test/cloud/auth.test.ts`, and `test/cloud/mqttTransport.test.ts`. The real-pump harness correctly builds no accessory/command layer, and the structural gate proving that is sound.

However, this phase's own headline deliverable — the split MIT/Apache-2.0 licensing scheme (D-035, REL-05) — was left inconsistent between the legally operative `LICENSE`/`NOTICE` files and the actual per-file SPDX headers the test suite enforces, because a later maintainer decision (reclassifying `src/platform.ts` from Apache-2.0 to MIT, recorded in this phase's own `06-02-SUMMARY.md`) updated the source header and the test's allowlist but never the two documents a redistributor is expected to read first. `README.md`'s license section was also never reconciled with the split scheme. Both are documentation-only defects, but they are exactly the class of defect this phase existed to eliminate, and neither is caught by any existing gate. A secondary finding notes an untested wiring path for the new `userAgent` field on the shadow-connection seam.

## Critical Issues

### CR-01: NOTICE and LICENSE still claim `src/platform.ts` is Apache-2.0, contradicting its actual MIT header

**File:** `NOTICE:7-11`, `LICENSE:1-8` (vs. `src/platform.ts:1` and `test/packaging/licenseHeaders.test.ts:44-50`)

**Issue:** `NOTICE` states:

```
Three files carried forward from that template and modified for this project remain licensed under Apache-2.0:
- src/index.ts
- src/settings.ts
- src/platform.ts
```

`LICENSE`'s header prose makes the identical claim ("carries three modified template files under the template's original Apache License ... src/index.ts, src/settings.ts, and src/platform.ts"). But `src/platform.ts`'s own first line reads `// SPDX-License-Identifier: MIT`, and `test/packaging/licenseHeaders.test.ts`'s `APACHE_DERIVED_FILES` constant (line 50) lists only `['src/index.ts', 'src/settings.ts']`, with a comment explicitly recording that `src/platform.ts` "was reexamined and classified MIT instead ... an explicit maintainer decision recorded in this plan's own SUMMARY."

This project's own planning artifacts confirm the sequence: `06-01` wrote `LICENSE`/`NOTICE` naming all three files Apache-2.0 (the RESEARCH.md default), and `06-02` later reclassified `src/platform.ts` as MIT — updating the file's SPDX header and the test's allowlist — but never went back to update `LICENSE` or `NOTICE`. The result is a shipped package whose attribution notice and license text disagree with the license grant actually stated in the file itself. No existing test catches this: `licenseHeaders.test.ts` only regex-matches that `LICENSE`/`NOTICE` mention "Apache License" and "MIT License" generically (lines 26-42); it never cross-checks the specific files `LICENSE`/`NOTICE` name against the classification the per-file SPDX gate enforces.

**Fix:** Update `NOTICE` and `LICENSE`'s prose to name only `src/index.ts` and `src/settings.ts` as the Apache-2.0-derived files, and add an assertion to `test/packaging/licenseHeaders.test.ts` that cross-checks `APACHE_DERIVED_FILES` against the file list embedded in `NOTICE`/`LICENSE`, so the two can never drift apart again:

```ts
test('NOTICE and LICENSE name exactly the SPDX-classified Apache-derived files (REL-05, D-035)', () => {
  const notice = readFileSync(join(REPOSITORY_ROOT, 'NOTICE'), 'utf8');
  for (const file of APACHE_DERIVED_FILES) {
    assert.match(notice, new RegExp(file.replace('.', '\\.')));
  }
  assert.doesNotMatch(notice, /src\/platform\.ts/);
});
```

### CR-02: README's License section omits the project's actual MIT/Apache-2.0 split

**File:** `README.md:253-255`

**Issue:** The README's closing section reads:

```
## License

Licensed under the [Apache License 2.0](./LICENSE).
```

This phase established (D-035, REL-05) that the project is dual-licensed: two files remain Apache-2.0-derived template material, and every other file — the entire runtime, all `src/cloud/*`, all `src/device/*`, all `src/accessories/*`, and so on — is original MIT-licensed work (confirmed by `NOTICE`, by `LICENSE`'s own header prose, by `package.json`'s `"license": "SEE LICENSE IN LICENSE"`, and by the per-file SPDX headers `test/packaging/licenseHeaders.test.ts` enforces). Stating flatly that the project is "Licensed under the Apache License 2.0" tells a reader — and any automated license scanner that reads README prose rather than `LICENSE` — the opposite of what is actually true for over 95% of the codebase. `test/documentation.test.ts`, the module that gates README content for this phase, never checks this section.

**Fix:** Replace the License section with a statement of the actual split, consistent with `NOTICE`:

```markdown
## License

This project is dual-licensed. `src/index.ts` and `src/settings.ts` remain
licensed under the [Apache License 2.0](./LICENSE), carried forward and
modified from the Homebridge plugin template. Every other file is original
work licensed under the [MIT License](./LICENSE). See [NOTICE](./NOTICE) for
the complete attribution.
```

## Warnings

### WR-01: The shadow-client `userAgent` wiring has no test asserting the value that actually reaches the transport

**File:** `src/runtime/accountRuntime.ts:1200` (via `src/cloud/shadow.ts:426-430`)

**Issue:** `createAccountRuntimeFromConfig` passes `userAgent: PLUGIN_USER_AGENT` into `createShadowClient`, which forwards it into the `MqttTransportOptions` it builds for `createTransport` (`src/cloud/shadow.ts:426-430`). This is the production wiring this phase's REL-03/REL-04 work exists to guarantee, but no test observes the value at either seam:

- `test/cloud/shadow.test.ts` supplies a fixed `userAgent: 'harness-user-agent'` (line 195) and records every `MqttTransportOptions` the fake `createTransport` receives (`transports[n]?.options`, used elsewhere in the file for `url`, `clientId`, `deadlineMs`, and `signUrl` assertions), but no case asserts `transports[0]?.options.userAgent`.
- `test/runtime/accountRuntime.test.ts`'s `createAccountRuntimeFromConfig` suite (starting line 2942) never opens a real connection and never stubs `createShadowClient`/`createMqttTransport` to observe what `userAgent` value the composition seam actually supplies; every case there uses a `connect` function that throws before any option is inspectable.

A regression that dropped, hardcoded, or mistyped the `userAgent` value anywhere along this chain (`accountRuntime.ts` → `shadow.ts` → `mqttTransport.ts`) would still pass every existing test and would still reach 100% line/function coverage, because the property assignment introduces no branch. This is exactly the "would a plausible wrong implementation still pass" gap the project's own unit-testing rules call out.

**Fix:** Add an assertion in `test/cloud/shadow.test.ts` that `transports[0]?.options.userAgent` equals the `userAgent` the case's `ShadowClientOptions` supplied, and add a case in `test/runtime/accountRuntime.test.ts`'s `createAccountRuntimeFromConfig` suite that stubs `connect` to capture the `MqttConnectOptions.wsOptions` (or otherwise observes the composed `userAgent`) and asserts it equals `PLUGIN_USER_AGENT`.

---

_Reviewed: 2026-09-05T05:17:11Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
