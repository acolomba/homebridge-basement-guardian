---
phase: quick-260829-gx6
plan: 01
subsystem: cloud
status: complete
tags: [rest-boundary, type-narrowing, vendor-wire-shape]
requires:
  - src/cloud/errors.ts
  - src/cloud/auth.ts
provides:
  - isWireDeviceListResponse
  - isWireDeviceResponse
  - toApiDevice
  - WireDevice
  - WireDeviceListResponse
  - WireDeviceResponse
affects:
  - src/cloud/api.ts
  - features/support/fakeRestApi.ts
tech-stack:
  added: []
  patterns:
    - "Normalize at the REST boundary: guard the vendor envelope, then build the internal record field by field."
key-files:
  created: []
  modified:
    - src/cloud/types.ts
    - src/cloud/api.ts
    - test/cloud/types.test.ts
    - test/cloud/api.test.ts
    - test/runtime/accountRuntime.test.ts
    - features/support/fakeRestApi.ts
    - features/support/steps/harness.ts
decisions:
  - "The wire guard requires attributes.serialNumber but not attributes.productLine, because nothing in the plugin reads the product line."
  - "toApiDevice builds its result field by field and never spreads the wire record, so accountId and the shadow snapshot stop at the boundary."
  - "ApiDevice and every downstream consumer were left untouched; only the boundary changed."
metrics:
  duration: ~30 min
  completed: 2026-08-29
actuals:
  tokens: 30700
  tasks: 3
  commits: 2
requirements: [WIRE-01, WIRE-02, WIRE-03, WIRE-04]
---

# Quick Task 260829-gx6: Fix Vendor REST Wire-Shape Defects Summary

The REST client now reads the vendor device routes as the vendor actually sends them: a `devices` envelope for the list, a `device` envelope for one device, and the serial number lifted out of `attributes`.

## What Was Done

**Task 1 — red (commit `98e5e2f`, `test(cloud):`).** Rewrote the fixtures in `test/cloud/api.test.ts` and the Cucumber fake onto the measured wire shape, and amended the harness device-list step. No file under `src/` was touched.

**Task 2 — green (commit `cf7222b`, `fix(cloud):`).** Added `WireDevice`, `WireDeviceListResponse`, `WireDeviceResponse`, the two envelope guards, and `toApiDevice` to `src/cloud/types.ts`; pointed both device routes at them in `src/cloud/api.ts`. Deleted `isApiDevice`, `isApiDeviceList`, and `DEVICE_STRING_FIELDS`.

**Task 3 — gate.** Three consecutive full checks, then whole-project coverage.

## The Red Run Is the Evidence

The fixtures were verified to fail against the pre-fix build. Against unmodified `src/`, `npm run test:unit` exited 1 with **12 failing cases**:

| Failing unit case | Why |
|---|---|
| `refuses a device list the vendor sent as a bare top-level array` | **negative — WIRE-01 discriminator** |
| `refuses a single device the vendor sent with no envelope around it` | **negative — WIRE-02/03 discriminator** |
| `lifts the serial number the vendor nests under attributes` | new, WIRE-03 |
| `carries no vendor field inward beyond the six the plugin reads` | new, T-GX6-01 |
| `authorizes the device request with the bearer token the auth client supplies` | body became an envelope |
| `reads an empty account as an empty device list` | body became an envelope |
| `reads one device from the device route` | body became an envelope |
| `encodes a device identifier that needs percent-encoding into the path` | body became an envelope |
| `deadlines a read route with the configured request timeout` | body became an envelope |
| `deadlines the token fetch with the same signal it deadlines the request with` | body became an envelope |
| `reaches only the four declared routes when every operation runs (SYNC-01)` | body became an envelope |
| `touches no excluded account-management path family (SYNC-01)` | body became an envelope |

Both negative cases failed with `AssertionError: Missing expected rejection` — that is, the pre-fix guards **accepted** those bodies. That is the mechanism the plan demanded: their bodies are the pre-fix normalized shape (`[geminiDevice()]` and `geminiDevice()`), not the wire record. Had they carried the wire record they would have passed before any source change and proved nothing.

The Cucumber red run exited 1 with **16 failing scenarios**:

`No credential reaches the log` · `A rotation refreshes the next handshake and leaves the live one alone` · `The plugin keeps polling while the shadow connection is unavailable` · `The combined path returns when the connection recovers` · `Shutdown during a pending retry raises nothing` · `Shutdown with an open shadow connection releases it` · `Shutdown while a reconnect is pending leaves no live connection` · `A second shutdown completes` · `A start after a shutdown performs no work` · `The plugin requests the complete shadow on the first connection` · `A reconnect requests the complete shadow again` · `A poll does not revert the value the live shadow delivered` · `The poll reconciles state the shadow did not carry` · `A partial heartbeat keeps the fields it omits` · `A requested value becomes neither device state nor a fresh receipt time` · `An identical heartbeat reports no change`

**Fake-only scenarios that kept passing.** The measured `fakeonly_list_failures` count was **0** — `The fake service answers the device list` (`features/harness.feature:18`) passed in the red run, as expected, because it exercises the fake alone and never reaches the production client. The other two fake-only REST scenarios, `The fake service answers the temporary credentials` and `The fake service fails one armed request`, also kept passing.

`git status --porcelain src/` reported **0 lines** at the end of Task 1.

**Normalizer discrimination.** `toApiDevice` is new and so had no red baseline. It was temporarily mutated to read the serial from the top level; `node --test dist-test/test/cloud/types.test.js` then failed exactly one case, `lifts the serial number from the attributes the vendor nests it in`. The mutation was reverted and the file restored.

## Green Gate

| Gate | Result |
|---|---|
| `npm run check` run 1 | exit 0 |
| `npm run check` run 2 | exit 0 |
| `npm run check` run 3 | exit 0 |
| `npm run test:coverage:all` | exit 0 — 100% lines, branches, functions |
| `npm run test:coverage:direct` over `src/cloud` | `api.js` and `types.js` both 100/100/100 |
| `npm run fallow` | exit 0 — no dead-code, health, or duplicate finding |
| unit suite | 497 pass, 0 fail |
| Cucumber suite | 35 scenarios, 35 passed |
| `git status --porcelain` | 0 lines |

**No `.fallowrc.json` `ignoreFindings` entry was added.** The new exports are genuinely consumed, so the last-resort blanket silence was not needed.

## Deviations from Plan

### 1. [Rule 3 — blocking fixture] `test/runtime/accountRuntime.test.ts` also encoded the imagined shape

- **Found during:** Task 2, after the source fix landed.
- **Issue:** `stubCloud` answered the device route with `JSON.stringify([geminiDevice()])` — a bare array of normalized records. With the client now requiring the real envelope, discovery read nothing and `AUTH-01 authenticates once and carries the bearer token onto every vendor route` failed with `stored: []` against an expected `['account-1_serial-1']`.
- **Why this is in scope:** it is the same defect the task exists to fix — a fixture built from the wrong assumption — in a file the plan's list missed. No file under `src/` needed a change, so the plan's premise held.
- **Fix:** added a local `geminiWireDeviceList()` helper that wraps the existing `geminiDevice()` fixture in the list envelope and nests the serial under `attributes`.
- **Commit:** `cf7222b`

### 2. The plan's failing-scenario grep pattern does not match this Cucumber version

The plan's verify block used `grep -E '^[0-9]+\) Scenario:'`. This Cucumber release prints failures as `  N) <scenario name> # <file>:<line>` — two leading spaces, and no literal `Scenario:`. That pattern returns nothing regardless of how many scenarios fail, so it would have reported `NONE` on a red run. The names above were captured with `^  [0-9]+\) ` instead. Worth correcting in future plans; nothing about the code changed as a result.

### 3. Envelope helper signature

The plan asked for two helpers wrapping the wire record. `deviceListBody(devices)` was made to take the array instead, so the empty-account body and the malformed-record body reuse it rather than repeating a literal. `deviceBody()` is unparameterized as specified.

## Environment Notes (not defects in this change)

- **`node_modules` is absent from this worktree.** Node and npm resolve the parent checkout's `node_modules` by walking up the directory tree, so the whole toolchain runs. The plan's precondition read literally ("`node_modules` present") is false here; the precondition's intent — a runnable toolchain with a passing typecheck — was verified directly and held.
- **`dist/` was unbuilt in this worktree at start.** That made `packedArtifact.test.ts` fail 2 cases on a bare `npm run test:unit` with `run npm run build first`. `npm run build` was run once to get a clean 464-pass baseline before any edit. `npm run check` builds `dist/` itself via `prefallow`, so the gate is unaffected.

## Facts Stated Plainly, Not Overclaimed

- **WIRE-04 carries no test, and none is possible.** It is discharged by a comment in `src/cloud/types.ts` naming `attributes` as where `productLine` lives, and by the absence of any top-level lookup for it. An absence is not observable behavior, so no assertion can prove it. Confirmed by reading the diff: `productLine` appears only nested under `attributes` in fixtures and in that one comment. **WIRE-04 was addressed by documentation and code review of the diff — it was not verified by test.**
- **The Cucumber fake breaks the measured `deviceId` relation.** On the live vendor, `deviceId` is byte-identical to `<accountId>_<attributes.serialNumber>`. The fake pairs one fixed placeholder account identifier (`fake-account-id`) with whatever device identifiers a scenario brings, so that relation does not hold there. Nothing in the plugin reads the account identifier or splits a `deviceId` today, so this costs nothing now; a future change that came to depend on the relation would **not** be caught by this fake. A comment in the fake's serializer records this.
- **Test counts are not evidence of vendor compatibility.** These changes were validated against fixtures rebuilt from a live probe's measured structure, not against the live API. Only a real-account run can confirm discovery now succeeds end to end.

## Files Deleted

No files were deleted. Three symbols were removed from `src/cloud/types.ts`: `isApiDevice`, `isApiDeviceList`, and the `DEVICE_STRING_FIELDS` constant (replaced by `WIRE_DEVICE_STRING_FIELDS`, which names the three top-level string fields the wire record must carry).

## Threat Mitigations Applied

| Threat | Disposition | How |
|---|---|---|
| T-GX6-01 information disclosure via `toApiDevice` | mitigated | Builds field by field, never spreads. `carries no vendor field inward beyond the six the plugin reads` asserts the returned record's sorted key list is exactly the six `ApiDevice` keys. |
| T-GX6-02 tampering via the envelope guards | mitigated | Both guards check every field the plugin reads, including `attributes.serialNumber`. The malformed table covers 18 rejection rows against each guard. |
| T-GX6-03 information disclosure via the `unreadable` path | mitigated | `api.ts` error construction unchanged; `keeps the token, the base URL, and the response body out of a failed request error` still passes. |
| T-GX6-04 real identifiers in fixtures | mitigated | Every fixture uses invented placeholders. TruffleHog filesystem scans on both commits reported `verified_secrets: 0, unverified_secrets: 0`. |
| T-GX6-05 tampering via `devicePath` | accepted | Unchanged; the identifier stays opaque and percent-encoded. |

No threat flags: this change adds no new network endpoint, auth path, or trust boundary. It narrows an existing one.

## Verification Against Plan Invariants

- `git diff --stat HEAD~2 HEAD` over `src/device`, `src/persistence`, `src/runtime`, `src/accessories`, `src/cloud/shadow.ts`, `src/cloud/auth.ts` → **0 lines**.
- The `ApiDevice` interface in `src/cloud/types.ts` is byte-identical to its pre-change form; the diff hunk begins after its closing brace.
- `src/cloud/api.ts` still routes `/credentials/aws` through `isAwsCredentialsResponse`; only the import line changed.
- No handling was added for `wifi_firmware_version` or `mcu_target_version`. Every occurrence in the repo predates this change and sits in files this task did not touch.
- `.planning/intel/constraints.md` is unchanged; `git status --porcelain .planning/` reported 0 lines during execution.

## Commits

| Commit | Subject | Files |
|---|---|---|
| `98e5e2f` | `test(cloud): encode the measured vendor wire shape in the fixtures` | `test/cloud/api.test.ts`, `features/support/fakeRestApi.ts`, `features/support/steps/harness.ts` |
| `cf7222b` | `fix(cloud): read the vendor device routes as the vendor sends them` | `src/cloud/types.ts`, `src/cloud/api.ts`, `test/cloud/types.test.ts`, `test/runtime/accountRuntime.test.ts` |

Neither is pushed. Both were committed with `SKIP=trufflehog` after a clean filesystem scan, per the worktree procedure in `CLAUDE.md`; no other hook was skipped and `--no-verify` was never used.

## Known Stubs

None. No placeholder, empty-value, or unwired path was introduced.

## Self-Check: PASSED

- `src/cloud/types.ts`, `src/cloud/api.ts`, `test/cloud/types.test.ts`, `test/cloud/api.test.ts`, `test/runtime/accountRuntime.test.ts`, `features/support/fakeRestApi.ts`, `features/support/steps/harness.ts` — all present.
- Commits `98e5e2f` and `cf7222b` — both found in `git log`.
- Working tree clean; three consecutive `npm run check` runs at exit 0 all follow the last commit.
