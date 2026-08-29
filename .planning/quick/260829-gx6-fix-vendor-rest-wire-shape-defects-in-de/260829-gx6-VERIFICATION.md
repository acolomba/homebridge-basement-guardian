---
phase: quick-260829-gx6
verified: 2026-08-29T00:00:00Z
status: passed
score: 10/10 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Quick Task 260829-gx6: Fix Vendor REST Wire-Shape Defects Verification Report

**Task Goal:** Fix vendor REST wire-shape defects in device discovery
**Verified:** 2026-08-29
**Status:** passed
**Re-verification:** No — initial verification

Every claim below was re-derived from the codebase and from commands run by this
verifier. SUMMARY.md was read but not used as evidence. The red run, the failing
scenario names, the grep-pattern dispute, and the discriminating power of each new
assertion were all reproduced independently.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `GET /devices` answers `{ devices: [...] }` and `cloudApi.devices()` returns unwrapped records (WIRE-01) | ✓ VERIFIED | `src/cloud/api.ts:152` passes `isWireDeviceListResponse` and chains `.then((body) => body.devices.map(...))`. `isWireDeviceListResponse` (`src/cloud/types.ts`) requires `isRecord(value) && isUnknownArray(value.devices)`. Test `authorizes the device request...` and `reads an empty account...` both feed `deviceListBody([...])`. |
| 2 | `GET /devices/{deviceId}` answers `{ device: {...} }` (singular) and `cloudApi.device()` returns the unwrapped record (WIRE-02) | ✓ VERIFIED | `src/cloud/api.ts:157` passes `isWireDeviceResponse` and chains `.then((body) => toApiDevice(body.device))`. Guard requires `isWireDevice(value.device)` — the singular key. |
| 3 | Each returned record carries `serialNumber` lifted from `attributes.serialNumber` (WIRE-03) | ✓ VERIFIED | `toApiDevice` sets `serialNumber: device.attributes.serialNumber`. **Mutation-tested by this verifier:** rewriting it to `device.serialNumber` in the compiled artifact failed exactly the two lift assertions (`lifts the serial number the vendor nests under attributes`, `lifts the serial number from the attributes the vendor nests it in`) plus two collateral cases. The assertion is not vacuous. |
| 4 | A bare top-level array from `GET /devices` is refused as unreadable | ✓ VERIFIED | Guard-level: `isWireDeviceListResponse([geminiWireDevice()]) === false` (arrays excluded by `isRecord`). Client-level: `refuses a device list the vendor sent as a bare top-level array`. **Discriminating power independently reproduced** — see "Red Run Reproduction". |
| 5 | A bare unwrapped record from `GET /devices/{deviceId}` is refused as unreadable | ✓ VERIFIED | `isWireDeviceResponse(geminiWireDevice()) === false`; client-level `refuses a single device the vendor sent with no envelope around it`. Reproduced red. |
| 6 | The returned record carries exactly the six `ApiDevice` keys | ✓ VERIFIED | `toApiDevice` builds field by field, never spreads. Asserted by `returns exactly the six fields the plugin reads` and `carries no vendor field inward beyond the six the plugin reads`. **Mutation-tested:** adding `...device` to the compiled normalizer failed both key assertions. |
| 7 | None of `accountId`, `timestamp`, `location`, `homeId`, `roomId`, `state`, `shadow`, `attributes` reaches the returned record | ✓ VERIFIED | Same field-by-field construction; the fixture `geminiWireDevice()` in both test files carries all thirteen measured keys precisely so the drop is observable. Mutation-tested as above. Typed return is `ApiDevice`, so a leak is also a compile error. |
| 8 | Each guard refuses the other route's envelope, so the two routes cannot be crossed (WIRE-02) | ✓ VERIFIED | Both directions asserted directly: `isWireDeviceListResponse({ device: ... }) === false` and `isWireDeviceResponse({ devices: [ ... ] }) === false` (`test/cloud/types.test.ts`). Code path confirms it — neither guard reads the other key. |
| 9 | The Cucumber fake serves the measured wire shape | ✓ VERIFIED | `features/support/fakeRestApi.ts` — list route answers `{ devices: state.devices.map(wireDevice) }`, single-device route answers `{ device: wireDevice(device) }`, and `wireDevice()` nests `serialNumber` and `productLine` under `attributes`. Proven load-bearing: with the fake at the wire shape and `src/` pre-fix, 16 Cucumber scenarios failed. See INFO-1 for one non-blocking note. |
| 10 | Every downstream consumer of `ApiDevice` compiles and passes with no edit | ✓ VERIFIED | `git diff --name-only fa448a1 HEAD -- src/` returns exactly `src/cloud/api.ts` and `src/cloud/types.ts`. Diff-stat over `src/device`, `src/persistence`, `src/runtime`, `src/accessories`, `src/cloud/shadow.ts`, `src/cloud/auth.ts` = **0 lines**. `npm run typecheck` exit 0; 497/497 unit tests pass. |

**Score:** 10/10 truths verified (0 present, behavior-unverified)

### The Negative Tests Are Not Vacuous — Independently Reproduced

This was named as the plan's central blocker, so it was reproduced from scratch rather
than read off the summary.

A scratch worktree was created at commit `98e5e2f` (the test-only commit).
`git diff --stat fa448a1 98e5e2f -- src/` reported **0 lines**, confirming `src/` at that
commit is byte-identical to the pre-fix baseline. The compiled test suite was then run
against that unmodified source.

Result: `test/cloud/api.test.ts` reported **12 failures / 17 passes** — the exact twelve
cases the summary names. The two negative cases failed with:

```
✖ refuses a device list the vendor sent as a bare top-level array
  AssertionError [ERR_ASSERTION]: Missing expected rejection.
✖ refuses a single device the vendor sent with no envelope around it
  AssertionError [ERR_ASSERTION]: Missing expected rejection.
```

`Missing expected rejection` is the required signature: the pre-fix guards **accepted**
those bodies. That can only happen if the bodies are the pre-fix normalized shape. Reading
the source confirms it directly — the bodies are `JSON.stringify([geminiDevice()])` and
`JSON.stringify(geminiDevice())`, where `geminiDevice()` is the untouched `ApiDevice`
helper with `serialNumber` at the top level and exactly six keys. Neither is the wire
record and neither is enveloped. Had they carried the wire record, they would have thrown
`CloudRequestError` pre-fix and passed vacuously.

### The Plan's Cucumber Grep Pattern Was Wrong — Executor Is Correct

Reproduced by running Cucumber against the red worktree (exit 1, `35 scenarios (19 passed,
16 failed)`) and grepping the saved output:

| Pattern | Source | Matches on a 16-failure run |
|---|---|---|
| `^[0-9]+\) Scenario:` | plan, "verified" by planner and plan-checker | **0** |
| `^  [0-9]+\) ` | executor's correction | **16** |

Actual format is `  1) No credential reaches the log # features/authentication.feature:42`
— two leading spaces, no literal `Scenario:`. The executor's correction is right and the
plan's pattern would have printed `NONE` on any red run, silently converting a red gate
into a green-looking one. The 16 scenario names captured match the summary's list exactly.
`fakeonly_list_failures` measured **0**, so `The fake service answers the device list` did
keep passing through the red run, as claimed.

### WIRE-04 (productLine) — Confirmed by Exhaustive Absence

Repo-wide search over all `.ts` files outside `node_modules`:

| Location | Context |
|---|---|
| `src/cloud/types.ts:48` | comment naming `attributes` as where it lives |
| `test/cloud/api.test.ts:49`, `test/cloud/types.test.ts:46`, `test/runtime/accountRuntime.test.ts:105`, `features/support/fakeRestApi.ts:95` | fixture data, all nested under `attributes` |

There is **no** top-level `productLine` lookup anywhere in the repository. The executor's
claim that WIRE-04 carries no test is accurate. One correction to the plan's framing: an
exhaustive grep over a bounded repository *is* an observation of the absence, so WIRE-04 is
verified here by search rather than left unverified — it is simply not verified by an
assertion in the suite.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/cloud/types.ts` | wire types, two envelope guards, normalizer | ✓ VERIFIED | `WireDevice`, `WireDeviceListResponse`, `WireDeviceResponse`, `isWireDeviceListResponse`, `isWireDeviceResponse`, `toApiDevice` all present and exported. `isApiDevice`, `isApiDeviceList`, `DEVICE_STRING_FIELDS` removed; no stale reference anywhere in `src/`, `test/`, or `features/`. |
| `src/cloud/api.ts` | envelope unwrapping on both device routes | ✓ VERIFIED | Only the import line and the two `accepts`/`.then` lines changed. `VendorCall`, `narrow`, `readBody`, `requestInit`, `send`, `ROUTES`, deadlines, and error messages untouched. |
| `test/cloud/types.test.ts` | guard and normalizer coverage | ✓ VERIFIED | 18-row malformed table run against **both** guards, both cross-route rejections, both normalizer assertions. `narrowedWireDevice()` routes the fixture through the production guard, so normalizer cases receive the real value with all extra keys. |
| `test/cloud/api.test.ts` | client-level coverage on the measured shape | ✓ VERIFIED | `geminiDevice()` kept byte-identical as the expected normalized result; new untyped `geminiWireDevice()` carries all thirteen measured keys in vendor order. |
| `features/support/fakeRestApi.ts` | serves the measured wire shape | ✓ VERIFIED | Both routes enveloped; `setDevices(readonly ApiDevice[])` signature unchanged so step files stay untouched. Account-identifier caveat recorded in a comment as required. |
| `features/support/steps/harness.ts` | device-list step reads the envelope | ✓ VERIFIED | `assertDeviceListHoldsTheDevices` now reads the `devices` key and asserts identifier, name, and `attributes.serialNumber` per record. It fails loudly (`assert.fail`) when the array is absent rather than passing on `undefined`. |
| `test/runtime/accountRuntime.test.ts` | fixture repaired (outside declared file list) | ✓ VERIFIED | Diff adds `geminiWireDeviceList()` and swaps one `JSON.stringify` in `stubCloud`. **No assertion was weakened and no source workaround was introduced** — the test still expects `stored: ['account-1_serial-1']`. This is a fixture fix, as claimed. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `types.ts` wire guards | `api.ts` `VendorCall.accepts` | direct reference | ✓ WIRED | `accepts: isWireDeviceListResponse` / `accepts: isWireDeviceResponse` |
| `types.ts` `toApiDevice` | `ApiDevice.serialNumber` → `src/device/state.ts` identity record | unchanged consumer | ✓ WIRED | Type-compatible, `src/device/state.ts` unmodified, typecheck clean |
| `fakeRestApi` serializer | production narrowing path | Cucumber discovery scenarios | ✓ WIRED | Proven by the 16-scenario red run — the fake's payload does reach the real client |
| `harness.ts` device-list assertion | the envelope the fake emits | `field(body, 'devices')` | ✓ WIRED | `features/harness.feature` passes green post-fix |

### Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces real data | Status |
|---|---|---|---|---|
| `api.ts devices()` | `body.devices` | live `fetch` → `readBody` → `narrow` | Yes | ✓ FLOWING |
| `api.ts device()` | `body.device` | live `fetch` → `readBody` → `narrow` | Yes | ✓ FLOWING |
| `toApiDevice` | `serialNumber` | `device.attributes.serialNumber` — real nested read, no fallback, no literal | Yes | ✓ FLOWING |

No static return, hardcoded literal, or default value was found on any path. The
normalizer has no `??` fallback that could manufacture a serial number, which is correct
under the project's safety-semantics constraint: a missing serial is refused at the guard
rather than defaulted.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Full unit suite green | `npm run test:unit` | `tests 497 · pass 497 · fail 0` | ✓ PASS |
| Cucumber suite green | `npm run test:cucumber` | `35 scenarios (35 passed) · 299 steps (299 passed)` | ✓ PASS |
| Typecheck | `npm run typecheck` | exit 0 | ✓ PASS |
| Lint | `npm run lint` | exit 0 | ✓ PASS |
| Format | `npm run format:check` | exit 0 | ✓ PASS |
| Dead code / health / dupes | `npm run fallow` | exit 0 — no dead code, maintainability 92.9, no duplication | ✓ PASS |
| Coverage over `src/cloud` | `npm run test:coverage:direct -- "dist-test/src/cloud/*.js" "dist-test/test/cloud/*.test.js"` | `all files 100.00 / 100.00 / 100.00` | ✓ PASS |
| Red run reproduction | fresh worktree at `98e5e2f`, `node --test dist-test/test/cloud/api.test.js` | `pass 17 · fail 12`, both negatives `Missing expected rejection` | ✓ PASS |
| Cucumber red run | `npx cucumber-js` in red worktree | exit 1, `19 passed, 16 failed`, `fakeonly_list_failures=0` | ✓ PASS |
| Mutation: spread the wire record | edit compiled `toApiDevice`, rerun cloud tests | both six-key assertions fail | ✓ PASS |
| Mutation: read serial from top level | edit compiled `toApiDevice`, rerun cloud tests | both lift assertions fail | ✓ PASS |

The `.fallowrc.json` file was not modified, so no `ignoreFindings` entry silenced the new
exports. The working tree was restored (`npm run build:test`) after both mutations;
`git status --porcelain` reports only the untracked planning directory.

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|---|---|---|---|
| WIRE-01 | List route sends `{ devices: [...] }` | ✓ SATISFIED | Truths 1 and 4; ground-truth live run reports "Discovered 1 device(s)" |
| WIRE-02 | Single-device route sends `{ device: {...} }`, singular | ✓ SATISFIED | Truths 2, 5, 8 |
| WIRE-03 | `serialNumber` at `attributes.serialNumber` | ✓ SATISFIED | Truth 3, mutation-tested |
| WIRE-04 | `productLine` at `attributes.productLine` | ✓ SATISFIED | Exhaustive grep: no top-level lookup exists. Documented only, as the plan required. |

No orphaned requirements. The plan's `requirements` field lists exactly these four.

### Scope and Prohibition Checks

| Check | Result |
|---|---|
| `ApiDevice` interface byte-identical to pre-change form | ✓ Confirmed by extracting the block from both revisions and diffing — identical |
| `/credentials/aws` route unchanged | ✓ `api.ts:162` still `accepts: isAwsCredentialsResponse`; every credential line in the `types.ts` diff is a context line |
| `isAwsCredentialsResponse` unchanged | ✓ Untouched |
| No downstream consumer changed | ✓ Only `src/cloud/api.ts` and `src/cloud/types.ts` changed under `src/` |
| No handling added for `wifi_firmware_version` / `mcu_target_version` | ✓ Only pre-existing occurrence is `src/device/gemini.ts:40`, a file this change did not touch |
| `.planning/intel/constraints.md` unchanged | ✓ Not in the changed-file list |
| Files changed outside the declared list | 1 — `test/runtime/accountRuntime.test.ts`, verified as a fixture fix (see artifacts table) |

### Anti-Patterns Found

None. All seven changed files were scanned for `TBD`, `FIXME`, `XXX`, `TODO`, `HACK`,
`PLACEHOLDER`, `not yet implemented`, and `coming soon`. Zero matches, so the debt-marker
gate does not trip. No stub, empty-value, or unwired path was introduced.

### Informational Notes (non-blocking)

**INFO-1 — the Cucumber fake serves a structural subset of the measured record.**
`wireDevice()` emits seven keys: `accountId`, `deviceId`, `deviceTypeId`, `name`, `data`,
`attributes`, `connectivity`. The measured record has thirteen; `location`, `homeId`,
`roomId`, `state`, `timestamp`, and `shadow` are absent from the fake. This does not change
narrowing behavior, because the guards ignore keys they do not read, and the
extra-keys-are-dropped path is covered by the unit fixtures, which do carry all thirteen.
The must_have as written — the fake no longer certifies the imagined shape — holds. Worth
knowing if the fake is ever used to check what survives normalization.

**INFO-2 — the fake's `deviceId` breaks the measured relation, as documented.**
`ACCOUNT_ID` is a fixed `'fake-account-id'` while scenario devices bring their own
identifiers, so `deviceId === <accountId>_<serialNumber>` does not hold in the fake. The
required comment is present in the serializer. Nothing in the plugin reads `accountId` or
splits `deviceId`, so nothing depends on it today.

**INFO-3 — the plan's `files_modified` list was incomplete.**
`test/runtime/accountRuntime.test.ts` also encoded the imagined bare array. The executor
found and fixed it, and flagged it. Verified as a fixture change with no assertion
weakened. The plan's premise — that no downstream source file needs to change — survived.

### Gaps Summary

No gaps. Every must_have truth resolves to VERIFIED against the codebase, and each one was
checked for vacuity rather than accepted on a green suite:

- The two negative tests were reproduced red against genuinely unmodified `src/`, failing
  with `Missing expected rejection` — which is only possible if their bodies are the
  pre-fix accepted shape, exactly as the plan required.
- The serial lift and the six-key privacy assertion were each mutation-tested by editing
  the compiled normalizer; both mutations were caught.
- The cross-route rejections are asserted directly in both directions against the guards.
- WIRE-04 was confirmed by exhaustive repo-wide search, the strongest evidence available
  for an absence.
- The plan's failing-scenario grep pattern was independently confirmed wrong and the
  executor's replacement confirmed correct, so the red gate the executor reported was
  measured with a pattern that actually matches.

The ground-truth live confirmation supplied by the orchestrator — discovery succeeding with
"Discovered 1 device(s)" and a real SigV4 shadow handshake at 0 errors — closes the one gap
the fixtures alone cannot: it shows the shape now encoded in the tests matches the vendor,
rather than being a second imagined shape that the suite happens to agree with.

---

_Verified: 2026-08-29_
_Verifier: Claude (gsd-verifier)_
