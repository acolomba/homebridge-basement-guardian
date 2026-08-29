---
phase: 01-secure-cloud-foundation
verified: 2026-08-29T18:43:21Z
status: human_needed
score: 22/22 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 19/20
  scope: "UAT closure of three human items, plus a delta re-verification of the seven files changed by quick task 260829-gx6"
  gaps_closed: []
  gaps_remaining: []
  regressions: []
  human_items_closed:
    - "Homebridge settings form renders and refuses correctly (SC-1, CONF-02) — closed by 01-UAT.md item 1"
    - "Vendor heartbeat topic (SYNC-02) — closed by 01-UAT.md item 2"
    - "Real SigV4 handshake (SYNC-04, AUTH-01) — closed by 01-UAT.md item 3"
  warnings_closed:
    - "W9 — 01-VALIDATION.md marked the D-21 packing check manual. Corrected by commit b35e322: the per-task row now reads `unit` / `node --test dist-test/test/packedArtifact.test.js`, the pre-verify bullet no longer asks for a separate inspection, and an amendment section records the move."
  warnings_opened:
    - "W10 — the AWS IoT shadow document shape is the last wire assumption resting only on a fixture, and a mismatch there is silent"
    - "W11 — the Cucumber REST fake serves a 7-key structural subset of the 13-key measured vendor record"
  human_items_opened:
    - "Confirm a real vendor shadow message actually merges into the canonical snapshot"
deferred:
  - truth: "A user can tell a dead monitoring path apart from a working degraded one"
    addressed_in: "Phase 5"
    evidence: "Phase 5 SC-2: 'Users can distinguish pump-controller link loss, vendor-confirmed device offline, and a degraded REST/MQTT monitoring path'. The representable runtime state and the type contract are delivered in this phase; only the user-facing surfacing defers."
  - truth: "A heartbeat-only telemetry key survives the first poll after shadow ownership is released, marked stale rather than dropped"
    addressed_in: "Phase 3"
    evidence: "Phase 3 SC-6. `pollTelemetry` (src/device/state.ts:164-166) still replaces telemetry wholesale when no watermark is held. Unchanged by this delta."
  - truth: "A rejected complete-shadow request marks the affected device scope untrustworthy"
    addressed_in: "Phase 3"
    evidence: "Phase 3 SC-6. `src/cloud/shadow.ts:257-261` warns and returns. Unchanged by this delta."
human_verification:
  - test: "During the next real-hardware run, log the canonical snapshot for one device immediately before and immediately after a shadow message arrives on `$aws/things/<deviceId>/shadow/get/accepted` and on `.../shadow/update/accepted`."
    expected: "The snapshot's `data` and/or `metadata` records gain real vendor keys, and `receivedAt` moves. Equivalently: `store.applyReportedPatch` is reached with a patch whose `data` or `state` is defined, and `shadowVersion` becomes a number."
    why_human: "Only a real vendor message can falsify the assumed document shape. A document whose `state.reported` is nested differently than assumed is discarded at `src/cloud/shadow.ts:262-267` with a debug line, or produces an all-undefined patch that `carriesObservation` (src/device/state.ts:195-197) drops with no log at all. The plugin reports `shadow-and-poll` either way. 01-UAT.md item 2 measured the topic, the payload size, and the 898-second interval — not that the payload parsed and merged. This is the same class of assumption that broke the REST boundary, at the one remaining boundary where it is still fixture-rested."
---

# Phase 1: Secure Cloud Foundation Verification Report

**Phase Goal:** Administrator can securely connect one Basement Guardian account and the plugin can maintain trustworthy current cloud state over a long-running Homebridge lifecycle.
**Verified:** 2026-08-29T18:43:21Z
**Status:** human_needed
**Re-verification:** Yes — third run. Previous: `human_needed`, 19/20.

## Scope and method of this run

Two things changed: `01-UAT.md` moved to `status: complete` with 3/3 passed, and quick task
260829-gx6 fixed a production-breaking defect inside this phase's REST boundary.

I did not carry forward the previous run's conclusions on the changed surface. I confirmed the code
delta myself with `git diff --stat c269a23..HEAD`, which reports seven files and **exactly two under
`src/`** — `src/cloud/api.ts` (+6) and `src/cloud/types.ts` (+85). Everything else is test, fixture,
or Cucumber-fake code. I ran the phase gate once and the coverage gate once, and I re-proved the
three new REST assertions by mutating the compiled artifact rather than reading the claim that
someone else had.

**On the standing instruction to distrust this phase's history.** This phase was certified sound four
times while `GET /devices` could not be read at all. My previous run was one of those four. The
mechanism was not carelessness about tests — it was that every layer that could have caught it
(production guard, unit fixture, Cucumber fake) encoded one unchecked reading of the vendor. So the
question I carried through this run was not "do the tests pass" but "for each must-have, what stands
outside the fixture". Section **Where each must-have rests** answers that directly, and it is the
reason this run does not return `passed`.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | **SC-1** Administrator can install the dynamic platform and save one valid account through the settings form, with the password-storage warning visible | ✓ VERIFIED | **Was PRESENT_BEHAVIOR_UNVERIFIED; now closed by human evidence.** `01-UAT.md` item 1: throwaway Homebridge 2.4.0 container, UI v5.28.0, the packed 0.1.0 tarball installed into the plugin path, a human reading the rendered form. All five behaviours enumerated separately rather than asserted in bulk: one account block (`singular` honoured), plaintext warning in the header, password field MASKED, malformed email refused, saving starts the plugin. I re-confirmed the schema half against `config.schema.json` — `singular` (:4), `strictValidation` (:5), the plaintext `headerDisplay` (:6), `format: email` (:22), `widget: password` (:28), `\S` patterns (:16, :30, :37) — all unchanged since `1f42292`. The open risk resolved in the safe direction: ng-formworks honours `widget`, so no schema change. Item 5 is independently corroborated in code — `Discovered 1 device(s).` is a real log line at `src/runtime/accountRuntime.ts:493`. Residuals in "Judgment on the UAT evidence". |
| 2 | **SC-2a** Missing configuration leaves the plugin idle with a clear log message | ✓ VERIFIED | `src/platform.ts:62-66` returns before registering a listener; four `features/configuration.feature` scenarios assert refusal text, no lifecycle listener, no accessory, no request reaching the fake cloud. Not in the delta; green in this run's gate. |
| 3 | **SC-2b** Valid configuration authenticates without exposing credentials or tokens | ✓ VERIFIED | `features/authentication.feature` 'No credential reaches the log'; `src/logging.ts` wraps all seven `Logging` members. Not in the delta. |
| 4 | No account identifier reaches the log (PROJECT.md Privacy) | ✓ VERIFIED | Re-derived this run rather than carried: `src/` contains exactly **three** interpolating log calls — `accountRuntime.ts:493` (a device count), `platform.ts:63` (a validation reason, which `src/config.ts:107-109` returns without interpolating the address), and `failureLog.ts:66` (a failure kind). None can carry an email or an account identifier. The wire fix did not add a fourth. |
| 5 | **SC-3a** A partial shadow `reported` patch merges and removes no field it omits | ✓ VERIFIED (fixture-rested — see W10) | `mergeRecord` at `state.ts:119-121`; `features/shadowMerge.feature` 'A partial heartbeat keeps the fields it omits'. `src/device/state.ts` is not in the delta. The merge logic is proven; what no test can prove is that a real vendor document reaches it. |
| 6 | **SC-3b** A `desired`/requested value never becomes reported device state | ✓ VERIFIED | Structural, not behavioural: `ReportedPatch` (`state.ts:52-58`) has no member able to hold it, `toReportedPatch` (`shadow.ts:185-192`) reads only `document.state.reported`, and `SHADOW_TOPICS` carries no delta or wildcard topic. A structural impossibility does not depend on a fixture. |
| 7 | **SC-3c** An omitted-field document cannot corrupt a previously accepted value | ✓ VERIFIED (fixture-rested — see W10) | `carriesObservation` (state.ts:195-197), `nextShadowVersion` (205-211), `nextSnapshot` (218-230) unchanged; five unit cases plus `features/shadowMerge.feature:40-50` green in this run. |
| 8 | **SC-3d** REST snapshots and shadow updates produce one current state per device, neither reverting the other | ✓ VERIFIED (REST half now live-confirmed) | `pollTelemetry` (state.ts:164-166) and the four-reason `releaseShadowSource` loop (`test/runtime/accountRuntime.test.ts:1186-1200`) unchanged and green. **Strengthened this run:** the REST half of this truth is no longer fixture-only — discovery now succeeds against the real vendor (`01-UAT.md` items 1 and 3). The shadow half stays fixture-rested (W10). |
| 9 | **SC-4a** A complete shadow is requested on the first connection and again after every reconnect | ✓ VERIFIED | `requestEveryShadow` (shadow.ts:340-363) unchanged; two `shadowLifecycle.feature` scenarios assert 1 then 2 requests across a forced reconnect. |
| 10 | **SC-4b** Credential rotation refreshes the cache in place without disturbing the live connection | ✓ VERIFIED | `signHandshake` (shadow.ts:232-248) re-reads the cache per handshake; `features/credentialRotation.feature` asserts 1 handshake across rotation. Unchanged. |
| 11 | **SC-4c** Reconnect backoff is capped and a single transport failure produces exactly one retry chain | ✓ VERIFIED | `retryPolicy.ts` pending guard plus `Math.min(maxDelayMs, ...)`; all nine backoff cases and the duplicate-notification case green in this run's gate. |
| 12 | **SC-4d** Shutdown during an in-flight retry wait, an in-flight request, and an open shadow connection produces no unhandled rejection; `stop()` is idempotent | ✓ VERIFIED | `accountRuntime.ts:551-559` guards on `stopped`, aborts once, swallows a close rejection; six `features/lifecycle.feature` scenarios green. Unchanged by the delta. |
| 13 | **SC-4e** Repeated connection cycles leave no superseded connection driving live state and no connection nothing will close | ✓ VERIFIED | `src/cloud/shadow.ts` is **not** in this delta, so 01-14's one-disconnection-per-connection contract and the W1 fix stand as verified last run. Re-read to confirm the fix is still shipped: `get connected() { return !closing && (connection?.live ?? false); }` at shadow.ts:443-444. |
| 14 | The runtime can express that monitoring has stopped, and its monitoring-path contract matches its declared consumer's | ✓ VERIFIED | `src/runtime/accountRuntime.ts` is not in this delta. Re-read to confirm: `if (stopped \|\| halted \|\| !polling) return 'unavailable';` at accountRuntime.ts:233-239. One `MonitoringPath` declaration (`src/device/health.ts:23`), imported at accountRuntime.ts:21. **Independently corroborated live this run:** `01-UAT.md` item 3 records `monitoringPath` reading `shadow-and-poll` while connected and `unavailable` after a clean stop — the 01-18 behaviour, observed rather than asserted. |
| 15 | `npm run check` passes typecheck, lint, all three fallow sub-commands, format:check, and both suites | ✓ VERIFIED | Exit 0 in this run. **497** unit tests, 0 fail, 0 skipped, 0 todo, 30 suites. 35 scenarios / 299 steps in 12.8 s. `fallow`: 0 dead-code issues, 0 above threshold, maintainability 92.9, duplication 0.0%. `npm run test:coverage:all` exit 0: **100% lines / branches / functions on every file**, `types.js` and `api.js` included. |
| 16 | `npm pack --dry-run` lists only the allowlisted files (D-21) | ✓ VERIFIED — now with install-side evidence | `test/packedArtifact.test.ts` green inside the gate (both cases, ~1.2 s each, running a real `npm pack --dry-run --json`). Stronger than last run: the packed 0.1.0 tarball was actually **installed into a Homebridge 2.4.0 container and ran** (`01-UAT.md` item 1), so the allowlist is now known to be sufficient as well as not excessive. |
| 17 | Exactly four typed REST routes exist and no excluded route is constructible (SYNC-01) | ✓ VERIFIED — re-checked against the delta | `ROUTES` (api.ts:27-32) still holds exactly four; `devicePath` still the only builder; `CloudApi` (api.ts:47-52) still declares four operations. The three prohibition cases at `test/cloud/api.test.ts:635-670` survive the delta intact, and the delta **strengthened** them: `vendorBodies()` now feeds each operation a well-formed wire envelope, so every call passes narrowing and its request is recorded rather than cut short by a rejection. `Record<keyof CloudApi, …>` at :599 and :610 is the unchanged type-level door. |
| 18 | The token cache lives under the Homebridge storage path with owner-only mode and a salted email fingerprint (AUTH-02, D-08) | ✓ VERIFIED | Unchanged. Exclusive create at `0o600` (`flag: 'wx'`), random temporary suffix, cleanup on failed rename. 01-SECURITY finding 2 qualification carried: the cached `id_token` payload carries an `email` claim. |
| 19 | Every module of the adopted tree exists, not-yet-wired modules are declaration-only, and the dead-code gate passes on reachability (D-17) | ✓ VERIFIED | `fallow dead-code --fail-on-issues` clean; `.fallowrc.json` byte-identical to the previous run (`git diff` empty) and `ignoreFindings` still holds exactly **8** entries. The delta added no silencing entry, which matters: `WireDevice`, both guards, and `toApiDevice` are genuinely consumed. |
| 20 | The deterministic suite runs offline against transport-level fakes naming no client library (D-10, D-11) | ✓ VERIFIED | 35 scenarios green offline. `features/support/fakeRestApi.ts` now serves the measured wire shape, which makes the acceptance layer stop certifying an imagined one — see W11 for the residual. |
| 21 | **NEW (WIRE-01/02/03)** The REST client reads the vendor device routes as the vendor actually sends them | ✓ VERIFIED — mutation-proved by this verifier | `api.ts:152` uses `isWireDeviceListResponse` and unwraps `body.devices`; `:157` uses `isWireDeviceResponse` and unwraps `body.device`; `toApiDevice` reads `device.attributes.serialNumber`. Guards are distinct by key, so a crossed route cannot pass. **I re-ran the doors myself** — see Behavioral Spot-Checks; all three mutations were caught. Outside the fixture: `01-UAT.md` items 1 and 3 both record discovery succeeding against the real account. |
| 22 | **NEW (AUTH-02, T-GX6-01)** No vendor field the plugin does not read crosses the REST boundary | ✓ VERIFIED — mutation-proved by this verifier | `toApiDevice` (types.ts:158-167) builds field by field and never spreads, so `accountId`, `location`, `homeId`, `roomId`, `state`, `timestamp`, `shadow`, and `attributes` stop at the boundary. Defence in depth downstream: `toSnapshot` (state.ts:173-190) also rebuilds field by field, so even a leak at the boundary would not reach a stored snapshot. Asserted at `test/cloud/api.test.ts:234-247` against a 13-key fixture. Spreading the wire record in the compiled normalizer fails that case — I ran it. |

**Score:** 22/22 truths verified (0 present, behavior-unverified)

### Where each must-have rests

The standing instruction for this run was to say, per must-have, whether anything outside the
fixture supports it. This table is the answer, and rows 4 and 5 are why the status is not `passed`.

| Must-have group | What supports it inside the suite | What supports it outside the suite |
|---|---|---|
| 1 — settings form (SC-1) | `config.schema.json` values, `test/packageManifest.test.ts` | **A human read the rendered form** in Homebridge 2.4.0 / UI 5.28.0 from the packed tarball. Strongest possible evidence for this class. |
| 17, 21, 22 — REST wire shape and boundary privacy (SYNC-01, WIRE-*) | 29 `api.test.ts` cases, 77 `types.test.ts` cases, mutation-proved by me | **A live vendor measurement** (`.planning/intel/constraints.md` §6, 2026-08-29) and **two live runs** where discovery succeeded. The fixture is now downstream of reality rather than upstream of it. |
| 9-14 — connection lifecycle, rotation, backoff, shutdown (SC-4) | 57 `shadow.test.ts` cases, `features/lifecycle.feature`, `credentialRotation.feature` | **A real SigV4 handshake** against the real AWS IoT endpoint through the shipped presigner: ESTABLISHED, 0 errors, no 403, live `monitoringPath` observed. This falsifies the one thing `verifyClient: () => !refusing` never could. |
| 2-4, 18-20 — refusal, redaction, token cache, tooling | Cucumber scenarios and unit cases | Structural, local, and observable in the repository. No vendor assumption is involved. |
| **5, 7, 8 (shadow half) — shadow document → canonical snapshot (SC-3)** | `shadowMerge.feature`, `state.test.ts`, `shadow.test.ts` — all against a document shape the harness itself constructs | **Nothing.** `01-UAT.md` item 2 measured the topic, 584 bytes, and the 898-second interval. It did not record that the payload parsed or that the snapshot changed. See W10. |

### Judgment on the UAT evidence

I read `01-UAT.md` as three claims to test, not three passes to record.

**Item 1 — settings form (SC-1). Accept.** The strongest of the three. It names the Homebridge
version, the UI version, the artifact used (the packed 0.1.0 tarball, not a linked working tree), and
it reports the five behaviours separately rather than as one verdict. The one risk the previous run
flagged as unresolvable — whether ng-formworks honours `widget: password` or requires the
`x-schema-form` spelling — resolved by observation, in the safe direction. Item 5 of that evidence
("saving starts the plugin") is corroborated in code: `Initializing BasementGuardian platform...` and
`Discovered 1 device(s).` are real log lines I can find at `src/platform.ts` and
`src/runtime/accountRuntime.ts:493`, and the second one cannot be emitted unless `api.devices()`
resolved. That makes item 1 a first end-to-end pass through the real Homebridge lifecycle, not only a
form-rendering check.

Two residuals, neither blocking. One UI version was exercised, and `widget` is a UI-layer behaviour
that a future ng-formworks release could change. And the previous run's aside — try a cleared Name
field and a single-space password — is not recorded as tested. That aside was not part of the item's
stated expectation, and the schema/runtime agreement it targets is verified statically (the `\S`
patterns match the runtime's `trim().length > 0`), so I record it rather than reopening the item.

**Item 2 — heartbeat topic (SYNC-02). Accept the claim as written; note that half the stated
expectation is unevidenced.** The measurement is genuinely a measurement: a named topic, two byte
counts that differ in the direction the claim requires (584 partial against 1800 complete), and an
interval of 898 seconds reported as exact rather than approximate. That closes the item as written —
*the vendor publishes device heartbeats on the update-accepted topic the client subscribes to* — and
it upgrades RES-01's two-missed-heartbeat staleness rule from a citation to an observation. The UAT's
own caveat is fair and I keep it: one device, one firmware version.

But the item's stated expectation was "arrives on update/accepted **and merges into the canonical
snapshot**". The evidence covers the first clause. Nothing in it speaks to the second. That gap is
W10 and the one open human item.

**Item 3 — real SigV4 handshake (SYNC-04, AUTH-01). Accept, and it is decisive.** It was driven
"through the shipped presigner rather than a second hand-rolled one", which is the detail that makes
it evidence: 01-SECURITY finding 4 established that the golden-vector test derives the crypto chain
independently but hand-writes the canonical request from the same reading of the spec as the signer,
so a third re-derivation would have proved nothing. A live broker either accepts the signature or
returns 403. It accepted, on the first handshake, with 0 errors, and returned a real 1800-byte
payload. Nothing short of this could have closed it.

**Also closed, and correctly: the CONF-01 child-bridge clause.** `01-VALIDATION.md` routed this to
Manual-Only, and the previous run agreed that a child bridge is a Homebridge process feature the
plugin can only supply a precondition for. The recorded log lines are the ones Homebridge emits for
that path (`Initializing child bridge`, `Child bridge started successfully`, a second HAP port at
51888 beside 51999), and discovery completed from inside that process. Both bridge modes are now
exercised on current Homebridge 2.x, which D-033 asks for. I accept this as evidence and note the
UAT's own point that it was cheap to test now precisely because Phase 1 publishes no accessories, so
the D-036 and REL-08 hazards have nothing to act on yet.

### The wire-shape delta: what I checked and what it cost

**No source file outside the REST boundary moved.** `git diff --stat c269a23..HEAD` reports seven
files; under `src/` there are exactly two, `api.ts` (+6) and `types.ts` (+85). `shadow.ts`,
`accountRuntime.ts`, `state.ts`, `auth.ts`, `sigv4.ts`, `mqttTransport.ts`, `config.ts`,
`logging.ts`, `platform.ts`, `retryPolicy.ts`, and `failureLog.ts` are untouched, so truths 2-14 and
18-20 rest on code this delta did not reach. I verified that from the diff, not from the summary.

**SYNC-01 was strengthened, not weakened.** The three prohibition cases are intact and the delta
improved them: because `vendorBodies()` now carries well-formed envelopes, every operation completes
narrowing and its request is recorded. Under the old bodies, two of the four operations would have
rejected mid-flight. The type-level door (`Record<keyof CloudApi, …>`) is unchanged.

**The refusal contract is unchanged in strictness and slightly stronger in reach.** Pre-fix,
`isApiDeviceList` was `isUnknownArray(value) && value.every(isApiDevice)`. Post-fix,
`isWireDeviceListResponse` is `isRecord(value) && isUnknownArray(value.devices) &&
value.devices.every(isWireDevice)`. Same all-or-nothing semantics on a malformed member — one bad
record still refuses the whole list — plus an envelope check the old one did not have, plus a
required `attributes.serialNumber`. The 19-row malformed table now runs against **both** envelope
guards, and both cross-route rejections are asserted directly. No assertion was relaxed to fit the
new shape; the one assertion that changed shape (`accountRuntime.test.ts`'s `stubCloud`) still
expects `stored: ['account-1_serial-1']`.

**The privacy constraint is enforced twice and asserted once.** `toApiDevice` never spreads, and
`toSnapshot` rebuilds field by field downstream, so a vendor key would have to survive two
field-by-field constructions to reach stored state. Accessory context is not a path today —
`src/persistence/accessoryContext.ts` is a declaration-only scaffold and `src/platform.ts` writes no
context. Logs are not a path: three interpolating calls in all of `src/`, carrying a count, a
validation reason, and a failure kind.

**One thing the delta did change in the project's privacy posture, recorded rather than flagged.**
`.planning/intel/constraints.md` §6 now records a maintainer decision that the vendor `deviceId` is
not sensitive and may be stored in accessory context and written to runtime logs, on the ground that
its `<account-id>` segment is opaque 24-character hex rather than an email. That is consistent with
truth 4 as written (no account *email* reaches the log) and with D-027, which still requires a
placeholder in public artifacts — and the fixtures honour it. Nothing in `src/` logs a `deviceId`
today, so the decision widens a permission the code has not yet used.

**Test count reconciles.** 464 → 497 is +33: four new cases in `api.test.ts` (the two envelope
refusals, the serial lift, and the six-key privacy assertion), and a rewritten `types.test.ts` whose
top-level cases go 16 → 25 with the malformed table growing 16 → 19 rows and running against both
envelope guards. Nothing in the delta is unexplained, and `git diff` shows zero removed `test(`
declarations.

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | A user can tell a dead monitoring path apart from a working degraded one | Phase 5 | Phase 5 SC-2. Representable state and type contract delivered here; only the surfacing defers. |
| 2 | A heartbeat-only telemetry key survives the first poll after ownership release, marked stale rather than dropped | Phase 3 | Phase 3 SC-6. `state.ts:164-166` unchanged by this delta. |
| 3 | A rejected complete-shadow request marks the affected device scope untrustworthy | Phase 3 | Phase 3 SC-6. `shadow.ts:257-261` unchanged by this delta. |

### Required Artifacts

Only artifacts the delta touched, or whose status changed, carry new detail. The rest are carried
forward and were re-confirmed present, substantive, and green under this run's gate.

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/cloud/types.ts` | Wire types, two envelope guards, boundary normalizer | ✓ VERIFIED | 176 lines (+85). `WireDevice`, `WireDeviceListResponse`, `WireDeviceResponse`, `isWireDeviceListResponse`, `isWireDeviceResponse`, `toApiDevice` all present and exported and consumed. `isApiDevice`, `isApiDeviceList`, `DEVICE_STRING_FIELDS` removed with no stale reference anywhere in `src/`, `test/`, or `features/`. `ApiDevice` unchanged, so no downstream consumer moved. |
| `src/cloud/api.ts` | Four routes, envelope unwrapping, typed parse failures | ✓ VERIFIED | 176 lines (+6). Only the import line and two `accepts`/`.then` lines changed. `ROUTES`, `devicePath`, `VendorCall`, `narrow`, `readBody`, `requestInit`, `send`, deadlines, and error text untouched; `/credentials/aws` still routed through `isAwsCredentialsResponse`. |
| `test/cloud/types.test.ts` | Guard and normalizer coverage | ✓ VERIFIED — genuine | 77 passing cases. 19-row malformed table against both guards, both cross-route rejections, both normalizer assertions. Mutation-proved by me. |
| `test/cloud/api.test.ts` | Client-level coverage on the measured shape, plus the SYNC-01 doors | ✓ VERIFIED — genuine | 29 passing cases. `geminiWireDevice()` is deliberately untyped and carries all 13 measured keys in vendor order, so the drop of the eight unread keys is observable; `geminiDevice()` is kept byte-identical as the expected normalized result. Both SYNC-01 doors intact. |
| `test/runtime/accountRuntime.test.ts` | Fixture repaired (outside the task's declared file list) | ✓ VERIFIED | +23/-6: a `geminiWireDeviceList()` helper and one `stubCloud` body. No assertion weakened — the case still expects `stored: ['account-1_serial-1']`. |
| `features/support/fakeRestApi.ts` | Serves the measured wire shape | ✓ VERIFIED — with a residual | Both routes enveloped; `wireDevice()` nests serial and product line under `attributes`; `setDevices(readonly ApiDevice[])` unchanged so no step file moved. Serves 7 of the 13 measured keys — see W11. Account-identifier caveat recorded in a comment at the serializer. |
| `features/support/steps/harness.ts` | Device-list step reads the envelope | ✓ VERIFIED | `assertDeviceListHoldsTheDevices` reads the `devices` key and asserts identifier, name, and `attributes.serialNumber` per record, and calls `assert.fail` when the array is absent rather than passing on `undefined`. |
| `config.schema.json` | Strict single-account settings form | ✓ VERIFIED — now also rendered | Unchanged since `1f42292`. All five properties the UAT confirmed are present at the lines cited in truth 1. |
| `src/cloud/shadow.ts`, `src/runtime/accountRuntime.ts`, `src/device/{state,health}.ts`, `src/{platform,config,logging}.ts`, `src/cloud/{auth,sigv4,mqttTransport}.ts`, `src/runtime/{retryPolicy,failureLog}.ts` | As previously verified | ✓ VERIFIED (carried forward, delta-confirmed) | Not in the delta; confirmed by `git diff --stat`. The two one-line fixes from the previous run were re-read and are still shipped (shadow.ts:443-444, accountRuntime.ts:234). |
| `test/packedArtifact.test.ts`, `test/packageManifest.test.ts` | Packing and manifest prohibitions | ✓ VERIFIED | Both green in this run's gate; `packedArtifact` runs a real `npm pack --dry-run --json` (~1.2 s per case). |
| `src/device/{events,family,gemini,halo}.ts`, `src/accessories/*`, `src/persistence/*` | Declaration-only scaffolds | ✓ VERIFIED (intended) | Unchanged; the eight `.fallowrc.json` entries are unchanged in count and content. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/cloud/api.ts` | `src/cloud/types.ts` | `accepts: isWireDeviceListResponse` / `isWireDeviceResponse` | ✓ WIRED | api.ts:152, :157. Each guard reads only its own key, so a crossed route cannot pass either. |
| `src/cloud/types.ts` `toApiDevice` | `src/device/state.ts` `toSnapshot` | `ApiDevice` unchanged, so the consumer did not move | ✓ WIRED | `ApiDevice` byte-identical; `src/device/state.ts` not in the delta; typecheck clean. |
| `features/support/fakeRestApi.ts` | the production narrowing path | Cucumber discovery scenarios | ✓ WIRED | Load-bearing: the executor's red run failed 16 scenarios with the fake at the wire shape and `src/` pre-fix, which is only possible if the fake's payload reaches the real client. |
| `src/cloud/shadow.ts` | itself — `closing` and `connection.live` | `connected` reads both | ✓ WIRED | shadow.ts:443-444. Unchanged by this delta. |
| `src/runtime/accountRuntime.ts` | itself — `stopped`, `halted`, `polling`, `shadowConnected` | `monitoringPathNow()` derives from four held facts | ✓ WIRED | accountRuntime.ts:233-239. Unchanged, and corroborated live by `01-UAT.md` item 3. |
| `src/runtime/accountRuntime.ts` | `src/device/health.ts` | `MonitoringPath` contract | ✓ WIRED | `import type` at line 21; one declaration in the repo. |
| `src/runtime/accountRuntime.ts` | `src/device/state.ts` | a lost connection releases shadow ownership so the poll takes telemetry back | ✓ WIRED | `handleShadowDisconnected` → `store.releaseShadowSource()` at accountRuntime.ts:274; four unit cases, one per disconnect reason, green. |
| `src/cloud/shadow.ts` | `src/runtime/retryPolicy.ts` | reconnect stays owned by the capped policy | ✓ WIRED | `options.retry.schedule` confirmed at **shadow.ts:287**. `gsd query verify.key-links` on 01-14-PLAN.md still reports 1/2 — a tool false negative from a double-escaped pattern in the plan (W7), re-confirmed this run. |
| `test/cloud/api.test.ts` | `src/cloud/api.ts` | `Record<keyof CloudApi, …>` breaks the build on a fifth operation | ✓ WIRED | Unchanged at :599 and :610; `tsconfig.test.json` includes `test/` and `npm test` runs `build:test` first, so the door sits inside the gate. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `api.ts devices()` | `body.devices` | live `fetch` → `readBody` → `narrow` → `.map(toApiDevice)` | Yes | ✓ FLOWING — and now confirmed against the live vendor. |
| `api.ts device()` | `body.device` | live `fetch` → `readBody` → `narrow` → `toApiDevice` | Yes | ✓ FLOWING |
| `toApiDevice` | `serialNumber` | `device.attributes.serialNumber` | Yes | ✓ FLOWING — no `??` fallback, so a missing serial is refused at the guard rather than defaulted. Correct under the project's safety semantics. |
| `state.ts toSnapshot` | `identity`, `connectivity`, `data` | field-by-field copy from `ApiDevice` | Yes | ✓ FLOWING — second field-by-field construction; nothing spreads. |
| `shadow.ts toReportedPatch` | `data`, `state`, `version` | `document.state.reported.*` from a real MQTT payload | **Unconfirmed against a real payload** | ⚠️ See W10. The read path is real and has no static fallback, but the shape it reads has never been observed post-parse. |
| `shadow.ts` | `connected` | `closing` and `connection.live` | Yes | ✓ FLOWING (carried forward) |
| `accountRuntime.ts` | `monitoringPath` | four held facts | Yes | ✓ FLOWING — observed live reading both `shadow-and-poll` and `unavailable`. |

### Behavioral Spot-Checks

Every mutation below was applied to the compiled `dist-test/` artifact (a gitignored build output),
run, and reverted. `git status --porcelain` is empty at the end of this run, and `dist-test/` was
rebuilt from source afterwards.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full phase gate | `npm run check` | exit 0 | ✓ PASS |
| Unit suite | inside `check` | 497 tests, 497 pass, 0 fail, 0 skipped, 0 todo, 30 suites | ✓ PASS |
| Acceptance suite | inside `check` | 35 scenarios, 299 steps, all pass, 12.8 s | ✓ PASS |
| Whole-project coverage | `npm run test:coverage:all` | exit 0; **100.00 / 100.00 / 100.00** on all files; `types.js` and `api.js` each 100/100/100 | ✓ PASS |
| Dead-code / health / dupes | `fallow` inside `check` | 0 issues; 0 above threshold; maintainability 92.9; duplication 0.0%; `ignoreFindings` still 8 | ✓ PASS |
| **Privacy door (truth 22)** | added `...device` to the compiled `toApiDevice`, reran `api.test.js` | ✖ `carries no vendor field inward beyond the six the plugin reads`, plus 2 collateral | ✓ PASS — the six-key assertion is not vacuous |
| **Envelope door, list route (truth 21)** | made the compiled `isWireDeviceListResponse` return `true` for a bare array, reran `api.test.js` | ✖ `refuses a device list the vendor sent as a bare top-level array` | ✓ PASS — the fixed defect is now genuinely fenced |
| **Serial-lift door (truth 21)** | changed the compiled normalizer to read `device.serialNumber`, reran `api.test.js` + `types.test.js` | ✖ `lifts the serial number the vendor nests under attributes`, ✖ `lifts the serial number from the attributes the vendor nests it in`, plus 2 collateral | ✓ PASS |
| SYNC-01 doors | carried forward from the previous run's mutations; cases re-read and unchanged at `api.test.ts:599-670` | both doors intact, now fed complete envelopes | ℹ Carried forward |
| Packed artifact gate | `test/packedArtifact.test.ts` inside `check` | both cases ✔ against a real `npm pack --dry-run --json` | ✓ PASS |
| Anti-pattern scan, 7 changed files | `grep -nE "TBD\|FIXME\|XXX\|TODO\|HACK\|PLACEHOLDER\|not yet implemented\|coming soon"` | 0 debt markers. The only `placeholder` hits are intentional fixture values, which D-027 requires | ✓ PASS |
| Secret scan, 7 changed files | `grep -nE "[a-f0-9]{24}\|@…\.(com\|net\|org)\|AKIA\|eyJ"` | 0 matches | ✓ PASS |
| Skipped / todo tests | gate output | 0 skipped, 0 todo across 497 | ✓ PASS |
| Test-count reconciliation | 464 + 4 (`api.test.ts`) + 29 (`types.test.ts` rewrite) | measured 497 | ✓ PASS — nothing unexplained |
| Working tree | `git status --porcelain` | empty | ✓ PASS |

### Probe Execution

No `scripts/*/tests/probe-*.sh` exist in this repository and no plan or summary declares one. Probe
execution: N/A. Behavioural evidence came from the three mutations above, from `npm run check` and
`npm run test:coverage:all` run by this verifier, and from the three live runs recorded in
`01-UAT.md`.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CONF-01 | 01-01, 01-02 | Dynamic-platform package, TypeScript ESM, supported runtimes, child bridge | ✓ SATISFIED | `test/packageManifest.test.ts` pins `engines`, `type`, `main`, name, keywords. **Both clauses now exercised on Homebridge 2.4.0:** normal bridge (UAT item 1) and child bridge (UAT Additional Verification, own process, HAP port 51888, discovery completed). The Manual-Only routing is discharged. |
| CONF-02 | 01-04, 01-15 | Settings GUI, strict validation, masked password, plaintext disclosure | ✓ SATISFIED | **Was NEEDS HUMAN.** Closed by UAT item 1: all five behaviours read off the rendered form in the real UI. |
| CONF-03 | 01-02, 01-04, 01-11, 01-15 | Absent or invalid credentials → clear error, no network/timer/accessory work | ✓ SATISFIED | Four `configuration.feature` scenarios, each asserting no listener and no request. |
| CONF-04 | 01-02, 01-04 | Optional `clientId` override, no other constant exposed | ✓ SATISFIED | Single precedence rule against `PROTOCOL.clientId`. |
| CONF-05 | 01-04, 01-10 | `pollInterval` 300-3600 default ~900; `offlineConfirmationPollCount` 1-8 default 2 | ✓ SATISFIED | Bounds in `config.ts` and the schema. |
| AUTH-01 | 01-02, 01-05, 01-08, 01-10, 01-11, 01-16 | Unattended password-realm grant, cached token reuse, reauthentication | ✓ SATISFIED | Plus a live end-to-end run: the grant fed a real `GET /credentials/aws` and a real IoT handshake. |
| AUTH-02 | 01-04, 01-05, 01-11, 01-15, 01-16 | Token under storage path, owner-only, no secret in logs or context | ✓ SATISFIED | Strengthened by truth 22: the REST boundary now drops eight vendor keys by construction, mutation-proved. Qualified by 01-SECURITY finding 2 (the `id_token` payload carries an `email` claim). |
| SYNC-01 | 01-02, 01-06, 01-08, 01-16 | Four typed routes, no excluded route | ✓ SATISFIED | Both prohibition doors intact through the delta and now exercised with complete envelopes. |
| SYNC-02 | 01-02, 01-03, 01-09, 01-11, 01-13 | One canonical snapshot per device, ignore `desired`, preserve omitted | ⚠️ SATISFIED WITH RESIDUAL | The merge contract is verified and the heartbeat **topic** is now a measurement. Whether a real vendor document parses into a patch is unconfirmed — W10. |
| SYNC-03 | 01-09, 01-10, 01-11, 01-13 | Complete shadow after startup and reconnect; poll as backstop; no replay | ✓ SATISFIED | `releaseShadowSource` on every disconnect reason; four-reason loop green. |
| SYNC-04 | 01-07..01-12, 01-14, 01-18 | Rotate in place, failed refresh stays scheduled, capped retries free of duplicate loops | ✓ SATISFIED | **Materially strengthened:** the presigner is now known to produce a URL the real AWS IoT broker accepts. The fake broker could never have told this apart. |
| SYNC-05 | 01-02, 01-06, 01-07, 01-10, 01-11, 01-14, 01-17, 01-18 | Idempotent abortable lifecycle, no unhandled rejection, no leaked work | ✓ SATISFIED | Plus a live observation of `monitoringPath` moving to `unavailable` after a clean stop. |
| WIRE-01..04 | quick 260829-gx6 | Vendor device-route envelopes and nested serial number | ✓ SATISFIED | Truths 21 and 22. Task-local IDs; they are not Phase 1 roadmap requirements and appear in no REQUIREMENTS.md traceability row, so they raise no orphan. |
| REL-04 | 01-19 (early) | Packed-package checks exclude secrets and identifiers | ℹ EARLY COVERAGE | REQUIREMENTS.md maps REL-04 to Phase 6. Noted so Phase 6 knows the assertion exists. |

**Orphaned requirements:** none. All twelve IDs the roadmap assigns to Phase 1 (CONF-01..05,
AUTH-01, AUTH-02, SYNC-01..05) appear in at least one plan's `requirements` field and each resolves
above.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | `TBD` / `FIXME` / `XXX` / `TODO` / `HACK` in phase files | none | 0 found across `src/`, `test/`, `features/`, `config.schema.json`, `.fallowrc.json`, including all seven files the delta touched. |
| — | — | Skipped or todo tests | none | 0 found across 497. |
| `src/cloud/shadow.ts` + `src/device/state.ts` | 262-267, 195-197 | **A vendor shadow document that does not match the assumed shape is dropped silently** | ⚠️ **W10 (new)** | Two silent paths, one behind the other. An unparseable document logs at `debug` and returns. A parseable document whose `state.reported` is nested differently yields an all-undefined patch, which `carriesObservation` drops with **no log at all** and no snapshot change. `monitoringPath` still reads `shadow-and-poll` in both cases, because it derives from the connection, not from arriving data. This is the same failure class as the REST defect, at the one boundary where it is still unfalsified. Detail and closure in the human item. |
| `features/support/fakeRestApi.ts` | 84-96 | The REST fake serves 7 of the 13 measured top-level keys | ⚠️ **W11 (new)** | `location`, `homeId`, `roomId`, `state`, `timestamp`, and `shadow` are absent from the fake, so the acceptance layer does not exercise the drop of the six keys most worth dropping. Not a defect — the guards ignore keys they do not read, and the 13-key unit fixture does cover the drop — but the fake should not be treated as evidence about what survives normalization. The fake also breaks the measured `deviceId === <accountId>_<serialNumber>` relation, which its own comment records. |
| `src/cloud/shadow.ts` | 91, 443 | `ShadowClient.connected` still has no production consumer | ℹ W1 (reduced) | Unchanged. The false-status half is closed; a public boolean that only tests read remains. Phase 3 or 5 will read it or it should go. |
| `src/runtime/accountRuntime.ts` | 237 | A failing poll reports `unavailable` even while the shadow is live and delivering | ⚠️ W3 | Unchanged and deliberate. Errs toward degraded rather than toward a false normal. Phase 5 inherits it as a contract. |
| `src/cloud/auth.ts` | `sharedGrant` | A joining caller inherits the opening caller's cancellation | ⚠️ W4 | Unchanged, bounded, self-correcting, and unreachable this phase. Phase 4 note carried. |
| `src/device/state.ts` | 164-166 | The first poll after ownership release drops heartbeat-only telemetry keys | ⚠️ W5 | Deferred to Phase 3 (SC-6). Unchanged by this delta. |
| `src/cloud/shadow.ts` | 257-261 | A rejected complete-shadow request leaves a per-device blind spot | ⚠️ W6 | Deferred to Phase 3 (SC-6). Unchanged by this delta. |
| `.planning/phases/01-secure-cloud-foundation/01-14-PLAN.md` | 45 | Key-link pattern is double-escaped (`retry\\.schedule`) | ⚠️ W7 | Re-confirmed open. `gsd query verify.key-links` reports 1/2 for that plan; the wiring is real at `shadow.ts:287`. Planning-artifact defect, not a code defect. |

**W9 is closed.** I checked the file rather than the claim. Commit `b35e322` corrected both places
the previous run cited: the pre-verify bullet (line 36) now says the D-21 allowlist is asserted by
`test/packedArtifact.test.ts` inside `npm test` and that no separate inspection is required, and the
per-task row (line 80) now reads plan `01-19`, threat `T-01-60`, method `unit`, command
`node --test dist-test/test/packedArtifact.test.js`, `✅ green`. An amendment section records the
move and confirms `nyquist_compliant: true` is unaffected. Timing note for the record: `b35e322`
landed at 11:19:54 EDT and the previous report was stamped 11:15:27 EDT, so that run flagged a row
that was corrected four minutes later.

### Test Quality Audit

Only rows that changed. The rest carry forward.

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `test/cloud/types.test.ts` | WIRE-01..03, T-GX6-01 | yes | 0 | No | Behavioral | ✓ Strong. 19 malformed rows against **both** guards, both cross-route rejections asserted in both directions, and the normalizer fed through the production guard so it receives the real value with the extra keys attached. Mutation-proved by me. |
| `test/cloud/api.test.ts` | SYNC-01, WIRE-*, AUTH-02 | yes | 0 | No | Behavioral + type-level | ✓ Strong. The untyped 13-key `geminiWireDevice()` is the load-bearing detail: an untyped literal cannot be reshaped by a later edit to a plugin type, so it keeps describing the vendor rather than the plugin. The six-key assertion is only meaningful because that fixture carries eight keys that must not travel. Both SYNC-01 doors survive the delta. |
| `test/runtime/accountRuntime.test.ts` | SYNC-05, AUTH-01, D-13 | yes | 0 | No | Behavioral | ✓ Strong. The delta is a fixture repair only. The expectation `stored: ['account-1_serial-1']` is unchanged, so nothing was weakened to make the new client pass. |
| `features/support/fakeRestApi.ts` | SYNC-01, D-10 | n/a | 0 | No | n/a | ⚠️ Adequate. No longer certifies an imagined shape, which was the point. Serves a 7-key subset — W11. |
| `features/support/fakeShadowBroker.ts` | SYNC-04 | n/a | 0 | No | n/a | ℹ `verifyClient: () => !refusing` still accepts every signature. **This no longer matters for SYNC-04**, because a real handshake closed that item. It still means the acceptance layer proves nothing about signing. |
| `features/support/*` shadow fakes | SYNC-02, SC-3 | n/a | 0 | No | n/a | ⚠️ The harness constructs the shadow documents it then parses, so the suite cannot falsify the document shape. W10. |
| all other `test/**` and `features/**` | mixed | yes | 0 | No | Value / Behavioral | ✓ 497 unit tests, 35 scenarios, none skipped, 100% branch coverage. |

**Disabled tests on requirements:** 0. **Circular patterns:** 0. **Tests asserting a defect as
correct:** 0. **Insufficient assertions:** 0 blocking; one harness limitation routed to the human
item.

### Human Verification Required

The three items from the previous run are closed by `01-UAT.md` and are not repeated. One new item
replaces them.

#### 1. Confirm a real vendor shadow message actually merges into the canonical snapshot

**Test:** During the next real-hardware run — Phase 2 will need one anyway — log the canonical
snapshot for one device immediately before and immediately after a message arrives on
`$aws/things/<deviceId>/shadow/get/accepted`, and again around one `.../shadow/update/accepted`
heartbeat. Logging `Object.keys(parsed)` on the raw payload and the resulting `ReportedPatch` is
enough, and it is cheaper than reasoning about it.

**Expected:** The raw payload's top-level keys include `state`, and `state.reported` holds `data`
and/or `state`. Downstream, `store.applyReportedPatch` receives a patch with at least one section
defined, the snapshot's `data` or `metadata` gains real vendor keys, `shadowVersion` becomes a
number, and `receivedAt` moves.

**Why human:** No harness can falsify this, because the harness builds the documents it parses. And
a mismatch is invisible from outside: `readShadowDocument` discards an unreadable payload with a
`debug` line (`src/cloud/shadow.ts:262-267`), while a payload that parses but nests `reported`
differently produces an all-undefined patch that `carriesObservation` (`src/device/state.ts:195-197`)
drops with **no log at all**. In both cases the plugin keeps reporting `shadow-and-poll` and keeps
serving poll-only state. `01-UAT.md` item 2 recorded the topic, 584 bytes, and an 898-second
interval — real measurements, but all three are satisfied equally by a payload the plugin then
throws away. Its own stated expectation included "and merges into the canonical snapshot", and that
clause has no evidence behind it.

**Why this is being raised now rather than waved through:** this is the same shape of assumption that
made `GET /devices` unreadable in production while 464 unit tests, 35 scenarios, a code review, a
Nyquist audit, a security audit at `threats_open: 0`, and my own previous run all read green. That
one was caught by a live run, not by the suite. The shadow document is the last boundary in this
phase where the assumption is still only in a fixture, and the intel record shows why: the REST
section of `.planning/intel/constraints.md` was corrected by the 2026-08-29 measurement, but §5 still
describes the shadow from a reading of the vendor's own client, uncorrected. Two mitigating facts,
recorded honestly: `update/accepted` is generated by AWS IoT rather than by the vendor, so its
envelope is a documented AWS contract, and the vendor-client snippet in §5 shows the access path
`state.state.reported.data`, which agrees with the code. This is likely fine. It is not confirmed,
and confirming it costs one log line.

### Gaps Summary

**No gaps. No regression from the delta. 22/22 truths verified, and the phase is one cheap
observation away from complete.**

**The three human items are genuinely closed, on evidence I judged rather than accepted.** The
settings form was read by a human in a real Homebridge 2.4.0 container from the packed tarball, with
all five behaviours reported separately and the one open schema risk resolving in the safe direction.
The heartbeat topic is now a measurement — a named topic, 584 bytes against a 1800-byte complete
fetch, and an interval of 898 seconds reported as exact — which is what RES-01's staleness rule
needed under it. The SigV4 handshake ran through the shipped presigner against the real broker and
established with 0 errors and no 403, which is the only thing that could ever have closed it, since
both the fake broker and the golden-vector test are blind to a signer that is wrong in the way the
spec reading is wrong. The CONF-01 child-bridge clause closed alongside them, discharging the last
Manual-Only routing in `01-VALIDATION.md`.

**The wire-shape fix is real and it introduced no regression.** Only two files under `src/` moved,
both at the REST boundary, and I confirmed that from `git diff` before deciding what to re-check.
SYNC-01's two prohibition doors survive intact and are now fed complete envelopes, so every operation
completes narrowing instead of rejecting mid-flight. The refusal contract is at least as strict as
before — same all-or-nothing behaviour on a malformed member, plus an envelope check and a required
`attributes.serialNumber` that did not exist. No assertion was weakened; the one fixture that changed
shape still expects the same stored result. And the privacy constraint is stronger than the brief
asked: `toApiDevice` never spreads, `toSnapshot` rebuilds field by field again downstream, accessory
context is not a live path this phase, and `src/` contains exactly three interpolating log calls,
carrying a count, a validation reason, and a failure kind. I proved the three new assertions by
mutating the compiled normalizer and guard — spread the record, read the serial from the top level,
accept a bare array — and all three mutations were caught.

**W9 is closed and two warnings open.** The D-21 validation row was corrected by `b35e322`; I read
the file. W11 is small: the Cucumber REST fake serves 7 of the 13 measured keys, so the acceptance
layer should not be cited as evidence about which vendor fields get dropped — the unit fixture is
what covers that.

**W10 is the one that matters, and it is why this run returns `human_needed` rather than `passed`.**
The instruction for this run was to say, per must-have, whether anything stands outside the fixture.
For every must-have in this phase, something now does — the settings form was rendered, the REST
shape was measured and re-measured live, the handshake was established against the real broker, the
package was installed and ran — with one exception. The path from a real vendor shadow document to a
canonical snapshot has never been observed end to end, and both ways it can fail are silent: a
`debug` line, or nothing at all, with `monitoringPath` still reporting the healthy combined path. The
merge logic is correct and well tested for the shape it assumes; what is unverified is whether the
vendor sends that shape. That is exactly the proposition that was false at the REST boundary through
four green gates.

**Can Phase 1 be marked COMPLETE?** Not quite, and not for anything that needs re-planning. Every
must-have is verified, every previously open human item is closed, the gate and the coverage gate are
green at 497 tests and 100% branches, and the working tree is clean. What remains is a single
observation on the next real-hardware run: log one shadow payload's top-level keys and the snapshot
before and after. If the snapshot moves, this phase is done and the status becomes `passed` with
nothing else to change. If it does not, the phase has a second production-breaking wire defect and
would have shipped with it.

---

_Verified: 2026-08-29T18:43:21Z_
_Verifier: Claude (gsd-verifier)_
