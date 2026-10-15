---
phase: 04-runtime-conformance
reviewed: 2026-10-15T04:56:02Z
depth: deep
batch: ACCOUNT
round: 0
correction_counter: 0
source_revision: e6f49a59671c13a20b696b7f46e38406a36aeec0
files_reviewed: 2
files_reviewed_list:
  - src/runtime/accountRuntime.ts
  - test/runtime/accountRuntime.test.ts
findings:
  critical: 18
  warning: 11
  info: 0
  total: 29
status: issues_found
---

# ACCOUNT: full initial code review

This is the terminal round-zero report for the complete ACCOUNT batch, before
its first repair. It covers all three repair slices, 04-07, 04-08 and 04-09.
It is not a correction review or a partial clean verdict. RUN-01 remains Pending.

## Summary

The complete original source and owner contain 29 confirmed review findings:
18 BLOCKER and 11 WARNING. Six concern genuine production behavior; the other
23 concern documentation, test discrimination, or the required project rules.
Five behavior observations have fresh public-runtime/native probes. The sixth,
cached startup absence, follows from the complete platform/runtime call chain.
No source or test was changed. No finding is fixed, rejected, or reopened.

The fresh owner passes 128 cases. The isolated pair reaches 100% native lines,
functions and branches. Type checking, exact-file ESLint, formatting, pairing,
and the recorded-base Fallow audit pass. Those results do not resolve the
findings below. No full `npm run check` was run; the parent owns that gate.

## Initial scope and provenance

Reviewer: `gsd-code-reviewer`, task
`/root/phase4_account_lifecycle/account_initial_review`.
First independent observer of every ACCOUNT ID below is this reviewer.
Every finding contributes RUN-01; 001 also contributes PROC-03 and genuine
behavior findings also require BUG-01 evidence. All initial and current source
locations in this report refer to the same revision:
`e6f49a59671c13a20b696b7f46e38406a36aeec0` (abbreviated `R` below).

Repository root, used to expand every file location below:
`/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian`.

| Full reviewed file | Initial/current Git blob | Every line read |
| --- | --- | --- |
| `src/runtime/accountRuntime.ts` | `bf9094668ef1e600d44c2e302e46dfaf6c3e5866` | 1–1283: 1–340, 341–690, 691–1020, 1021–1283 |
| `test/runtime/accountRuntime.test.ts` | `c88d2d89a924c4f7d4397ae4b1de3b53051518b3` | 1–3365: 1–420, 421–850, 851–1270, 1271–1690, 1691–2105, 2106–2530, 2531–2950, 2951–3365 |

These are contiguous full-file reads, not a selected diff. The source review
includes all declarations, nested helpers, callbacks, loops, command handling
and composition. The owner review includes its complete header, every case,
every generated disconnect-reason row, every harness function, all seed and
logger functions, `answering`, `hangingUntilAborted`, `fakeShadow`,
`recordingAnchors`, `settle`, `harness`, `shadowOptionsOf`, `silenceOf`,
`devicesCallCount`, `endToEndRuntime`, `stubCloud` and `credentialRequestCount`.

| Owner range | Full reviewed content | Native cases |
| --- | --- | ---: |
| 1–622 | Imports, constants, all initial seeds, adapters and harness/helper bodies | Support |
| 623–867 | Startup, inventory, registration and restart anchors | 16 |
| 869–1048 | Credential rotation | 9 |
| 1050–1397 | Polling, canonical ownership and two-device handover | 15 |
| 1399–1616 | Shutdown, pending work and trust | 14 |
| 1618–2536 | Monitoring, authentication, retry and live silence; all four generated reason cases | 46 |
| 2538–2890 | Full removal group, including its local helper | 13 |
| 2892–2973 | Entire wired-runtime and HTTP support | Support |
| 2975–3084 | Commands | 8 |
| 3086–3340 | Composition | 6 |
| 3342–3365 | Wired account | 1 |

The intervening blank lines were included. The full initial pair has 4648
lines. `input-manifest.json` retains exact blobs, SHA-256 values, full read
ranges and every authored test declaration, beside the complete native TAP.

Both complete headers were inspected independently of the packaging gate.
The source begins with SPDX immediately followed by imports and lacks copyright
and overview blocks. The owner begins with an import and has none of the three
required sections. Both are original project work; no Apache/template boundary
is introduced by the proposed header repair.

### Context and caller reads

Read complete AGENTS.md; the agent-skills bootstrap; all five complete books
(`typescript-google-style-review`, `typescript-comments`,
`typescript-unit-testing`, `typescript-unit-testing-review`,
`local-verification`); 04-07/08/09 plans; 04-CONTEXT, 04-RESEARCH,
04-PATTERNS, 04-REVIEW-PROTOCOL and 04-FINDINGS; and all 830 lines of canonical
`.planning/intel/decisions.md`. Also consulted current PROJECT/REQUIREMENTS,
the applicable STATE/privacy and protocol-constraints entries, the source-only
packaging header gate, compiler/configuration inputs, and the existing coverage
selector. Configured skill injection was queried for this reviewer's own role;
its three-book subset did not replace either additional complete book.

Read these actual supporting modules completely, without claiming a new
whole-subsystem conformance verdict for them:

| Supporting source | Full line range |
| --- | --- |
| `src/runtime/commandPort.ts` | 1–48 |
| `src/runtime/retryPolicy.ts` | 1–101 |
| `src/runtime/arrivalAnchors.ts` | 1–211 |
| `src/runtime/monitoringHealth.ts` | 1–311 |
| `src/cloud/auth.ts` | 1–596 |
| `src/cloud/api.ts` | 1–215 |
| `src/cloud/shadow.ts` | 1–478 |
| `src/cloud/types.ts` | 1–189 |
| `src/device/state.ts` | 1–419 |
| `src/accessories/reconciliation.ts` | 1–103 |
| `src/platform.ts` | 1–644 |

Also read complete family and registry contracts, the actual Gemini command
builder, feature World composition/consumer sections, and
features/CLAUDE.md plus the complete Cucumber skill. No feature or real-pump
test was run. `test/runtime/arrivalAnchorMemoryContract.ts` was read completely
(including its header and typed inventory) as existing TRUST support. It is
not an ACCOUNT addition or an authorized ACCOUNT edit.

The import/call graph traced was platform/World → composition factory → auth,
REST, state, anchors, health and retry; runtime start → restore → launch →
applyDevices → inventory listener/reconciliation; polls → final fetch →
removal callback → exact-device pruning; credential loop → role registration →
cache/shadow; shadow callbacks → arrival stamp → canonical patch → trust; and
commands → family lookup/body → exactly one REST attempt. Error propagation
was followed through launchFailure, runPoll, refreshCredentials and the nested
final-check catch, including concurrent halt and pending completion.

## Narrative Findings (AI reviewer)

All entries below have disposition **OPEN — confirmed initial finding**. The
`R:path:line` notation is revision-qualified by the full R hash above and uses
the absolute repository root above. Fix suggestions are future work, not
authorization to skip the protocol's pre-edit consumer checks, cause budgets,
owner RED, evidence commit, normal hooks or full correction review.

### BLOCKER findings

### CR-04-ACCOUNT-006: The public-store test can accept a second store

**File/location:** `R:test/runtime/accountRuntime.test.ts:643-652`.
**Rule:** unit writer/reviewer, Assertions: independent expected values and
public state; each case must reject a plausible wrong implementation.
**Slice:** 04-07-01. **Kind:** assertion maintenance.
**Issue:** Comparing `runtime.store.snapshot(...)` with the injected store's
own answer proves equal current data, not the promised single-store identity.
A separate store copied from discovery passes; two absent snapshots also
compare equal. The test asks the harness/production store for its expectation.
**Fix:** Assert `runtime.store === store` and independently specify any snapshot
whose contents the case also promises. Keep the full discovery observation.

### CR-04-ACCOUNT-007: Bundled rotation timing supplies its own expected answer

**File/location:** `R:test/runtime/accountRuntime.test.ts:121-123,527-529,870-883,947-965`.
**Rule:** unit writer/reviewer, Assertions and Patterns: expected values are
independent from production computations; public behavior must discriminate.
**Slice:** 04-07-02. **Kind:** assertion maintenance.
**Issue:** `ROTATION_DELAY_MS` subtracts imported `ROTATION_LEAD_MS`, which the
harness also supplies as input. Changing the exported ten-minute default changes
both sides together. The bundled floor is likewise advanced through imported
`MIN_ROTATION_DELAY_MS`. A wrong exported default can retain full coverage and
pass these tests. The custom short timing cases do not validate bundled values.
**Fix:** Keep the public exports as actual inputs and independently expect the
documented literal elapsed boundaries (3000000 ms from the one-hour fixture,
and 30000 ms floor), including before-boundary and at-boundary observations.

### CR-04-ACCOUNT-008: Restart coverage does not preserve the actual restored anchor

**File/location:** `R:test/runtime/accountRuntime.test.ts:816-865`.
**Rule:** unit writer/reviewer, Assertions: whole public state and independent
expected values; D-05/D-07 preserve restored anchors until a real arrival.
**Slice:** 04-07-01. **Kind:** assertion maintenance.
**Issue:** The restart case checks only one silent boolean and report count.
Replacing the restored anchor with a different old timestamp can preserve both
assertions while corrupting future restart evidence. The separate fresh-install
case proves a new anchor, not preservation of the restored value.
**Fix:** Read back the exact restored timestamp and independently expected
complete anchor set after startup, and then the exact new timestamp/set after
an actual reported arrival. Preserve the delayed restore ordering discriminator.

### CR-04-ACCOUNT-009: The in-flight command cancellation test starts no in-flight command

**File/location:** `R:test/runtime/accountRuntime.test.ts:3072-3082`.
**Rule:** unit writer/reviewer, Assertions and central discrimination rule;
04-09-01's existing shared-root cancellation promise. Seed S-04-06.
**Slice:** 04-09-01. **Kind:** assertion maintenance, not a production cancellation bug.
**Issue:** The case stops the runtime before sending and the command resolves
successfully immediately. It proves only that an already-aborted signal reaches
the port. It cannot distinguish a fresh signal that was already aborted from
the actual root, or prove cancellation of pending work.
**Fix:** Start a pending command, capture its initially un-aborted signal,
observe that dispatch began, stop, and assert its actual abort and complete
refused outcome before exact request checks. Retain any separately useful
already-aborted-signal case under a truthful title. Add no wider teardown claim.

### CR-04-ACCOUNT-010: Command tests leave accepted results and canonical authority unprotected

**File/location:** `R:test/runtime/accountRuntime.test.ts:2976-3040`.
**Rule:** unit writer/reviewer, Assertions: public result/state before
interactions and whole independent expectations; D-037 reported authority.
**Slice:** 04-09-01. **Kind:** assertion maintenance.
**Issue:** The alarm-mute case discards the outcome. None of the successful
command cases reads canonical state after acceptance. An implementation that
returns a refusal only for mute, or writes requested fields into the canonical
store after an accepted request, can pass the named cases and the other command
tests. Current production does not make that optimistic write.
**Fix:** Assert the full outcome for each control and the complete independently
expected unchanged canonical snapshot, then the exact one device/body/request.
Keep exact multiplicity checks on potentially delivered failures/timeouts.

### CR-04-ACCOUNT-011: The construction case does not observe two of its claimed boundaries

**File/location:** `R:test/runtime/accountRuntime.test.ts:3087-3118`.
**Rule:** unit writer/reviewer, each case discriminates its title; Assertions.
**Slice:** 04-09-01. **Kind:** assertion maintenance.
**Issue:** The title promises no file read and no timer, but assertions observe
only monitoringPath, fetch count and socket count. A constructor that reads
storage or starts a timer can pass. This is not evidence that production currently
does either; current construction was traced and is inert.
**Fix:** Add a discriminating observation for each boundary the case retains in
its promise, using supported context-owned boundary doubles, or narrow its
title to the actual public observations and retain the construction prohibition
in source/design review. Do not add a production test mode or private accessor.

### CR-04-ACCOUNT-018: Optional snapshot reads let destructive disconnects pass

**File/location:** `R:test/runtime/accountRuntime.test.ts:1832-1845`; related
canonical preservation cases at `1051-1082,1140-1156,1195-1224,1282-1395`.
**Rule:** unit writer/reviewer, Assertions: assert presence and complete public
values, independent expectations; SC-03's missing-snapshot guard and readback.
**Slice:** 04-08-01. **Kind:** assertion maintenance.
**Issue:** Every disconnect row expects only
`store.snapshot(DEVICE_ID)?.shadowVersion === undefined`. Deleting the snapshot
entirely gives the same answer. The promised telemetry handover must retain the
device, values, metadata, receipt and identity. Several related cases observe
only chosen fields, and the failed-poll case takes its whole expected value from
the production store without first independently pinning a present baseline.
**Fix:** Assert the complete present canonical snapshot after each transition
and refused/unchanged operation, with literal expectations and distinct device
and receipt clocks. Preserve meaningful selected-field assertions as additions,
not substitutes for the promised retained state.

### CR-04-ACCOUNT-019: Per-device trust cases discard identity or most of the public trust answer

**File/location:** `R:test/runtime/accountRuntime.test.ts:2194-2205,2273-2285,2322-2357,2412-2475,3241-3281`.
**Rule:** unit writer/reviewer, Assertions: whole independent public state;
D-05 preserves narrow per-device trust and account-wide facts separately.
**Slice:** primary 04-08-01; composition part 04-09-01, same cause/ID.
**Issue:** `silenceOf` projects away keys and three trust fields. The two-device
recovery case records only the number of reports at the important intermediate
quiet/healthy split, then checks two booleans after both devices recovered.
Wrong non-silence fields or a wrong intermediate keyed map can escape those
assertions. The composition listener captures only its first argument, so a
missing/wrong second-argument map also passes that case.
**Fix:** Capture the complete account struct and complete keyed per-device map
at the quiet/healthy boundary and after recovery, with independent expected
keys and all four fields. Observe both callback arguments through composition.
Retain exact no-extra-report counts where multiplicity is the promise.

### CR-04-ACCOUNT-020: Removal preservation tests can miss corrupted anchors and collateral pruning

**File/location:** `R:test/runtime/accountRuntime.test.ts:2653-2684,2819-2888`.
**Rule:** unit writer/reviewer, Assertions: whole public state, not mere
existence; D-029 callback-before-prune and exact-device cleanup.
**Slice:** 04-08-02. **Kind:** assertion maintenance.
**Issue:** A refused removal checks only snapshot existence and `Map.has`, so
replacing its retained data or anchor with the wrong value can pass. The anchor
deletion/stray-message cases use one device, so deleting a surviving neighbor's
anchor/tracking along with the removed device is unobserved. Callback order is
described but not observed against state/anchors at that callback boundary.
**Fix:** Use a surviving second device. Capture complete canonical, trust and
anchor sets before/inside/after refused and successful callbacks, then after a
stray message. Independently expect retained exact timestamps and exact-device
pruning only after successful callback. Keep removal-attempt identity/order.

### CR-04-ACCOUNT-021: Final-check reappearance deletes future absence eligibility

**File/location:** `R:src/runtime/accountRuntime.ts:454-460`;
`R:src/accessories/reconciliation.ts:76-99`;
`R:test/runtime/accountRuntime.test.ts:2593-2614`.
**Rule:** canonical D-029; D-05 removal preservation; correctness.
**Slice:** 04-08-02. **Kind:** genuine production bug candidate, independently confirmed.
**Issue:** Reappearance in the final fetch calls `reconciliation.forget`.
That deletes the device's entry instead of retaining it with zero absences.
If subsequent regular inventories omit it, `observe` has no entry to increment:
it never removes that cached device, however many later healthy inventories
omit it. The existing test stops after only the first later omission.
**Evidence:** Public-runtime probe `reappearance` observes 4 calls/no removal
after reappearance, then 6 calls/no removal with the device still stored after
two further absent inventories. D-029 requires another final check/removal.
**Fix:** Reset presence for the reappeared candidate while retaining tracking;
do not re-observe unrelated omissions from the out-of-band inventory. Extend
the owner through two later omissions and final-check outcome. If the
reconciliation contract needs a method, declare/trace that bounded adaptation
and its owner before editing.

### CR-04-ACCOUNT-022: Later discovered devices never join the shadow subscription set

**File/location:** `R:src/runtime/accountRuntime.ts:419-428,813-818,875,980-984`;
`R:src/cloud/shadow.ts:461-467`.
**Rule:** canonical D-002/D-003, F-001; D-05 current live-state ownership;
correctness of discovering every supported physical device.
**Slice:** 04-08-01. **Kind:** genuine production bug candidate, independently confirmed.
**Issue:** The first shadow start captures the initial store IDs. Later polls
admit new devices, but `attemptShadow` returns whenever `shadow` exists.
The real client's routes and reconnect device list are only changed by `start`.
The new pump therefore gets REST state but no live subscription or full-shadow
request for the rest of this runtime, including after ordinary client reconnects.
Between-poll pump/flood changes can be missed.
**Evidence:** Probe `new-device-subscriptions`: inventories and store grow from
`[device-a]` to `[device-a, device-b]`; subscriptions remain `[[device-a]]`.
**Fix:** Reconcile the active shadow's device set when inventory membership
changes, using the existing start/replacement ownership contract or a traced
narrow adapter operation. Prove new-device full-shadow/live ingress and retained
existing-device behavior through the public owner. Do not reconnect on every
unchanged poll or change physical identity.

### CR-04-ACCOUNT-023: A terminal authentication refusal in the final check is swallowed

**File/location:** `R:src/runtime/accountRuntime.ts:438-445,980-983`;
terminal classifier at `710-735`.
**Rule:** canonical D-023/D-031 and current terminal-auth policy; D-05 lifecycle
preservation; correctness.
**Slice:** 04-08-02. **Kind:** genuine production bug candidate, independently confirmed.
**Issue:** The nested fetch catch drops AuthRejectedError/AuthHaltedError along
with transient final-check failures. The outer poll then records success and
leaves commandTransportReady true and credentialsRejected false. The live
client remains open until another operation discovers the halt, potentially a
whole poll/rotation interval later. Authentication refusal must be terminal
regardless of which authenticated fetch meets it.
**Evidence:** Probe `final-check-auth-refusal` observes the refusal on call 4,
then `shadow-and-poll` and a final account answer with ready=true/rejected=false.
**Fix:** Preserve silent/no-removal handling for ordinary final-check failures,
but propagate/classify terminal-auth answers through the existing terminal act.
Ensure the enclosing poll cannot subsequently record success for that terminal
outcome. Prove the full terminal trust, close and no-later-work behavior.

### CR-04-ACCOUNT-024: Post-await inventory work can remove devices after terminal halt

**File/location:** `R:src/runtime/accountRuntime.ts:439-471,980-984,1055-1057,1130-1132`;
existing ownership predicate at `806-808`.
**Rule:** D-05 lifecycle/current ownership; canonical D-029's healthy-runtime
condition; correctness and data-loss risk.
**Slice:** 04-07-02; final-check assertion/adapter work remains in 04-08-02
under this same original ID.
**Kind:** genuine production bug candidate, independently confirmed.
**Issue:** Inventory and final-check continuations have no current-running guard
after their awaits. Terminal halt deliberately differs from root abort, so an
already pending final fetch can really resolve after another loop halts the
runtime. It still invokes removal and prunes observations. Similar successful
inventory continuations can still admit/apply/report after lifecycle ownership
ends; relying only on a request's rejection does not guard a resolved result.
**Evidence:** Probe `late-final-check-after-halt` first observes rejected=true,
unavailable path and a retained device. Resolving the pending final fetch then
removes `device-a` and empties the store while the runtime remains halted.
**Fix:** Recheck existing lifecycle ownership after restore/inventory/final-check
awaits and before applying/removing/reporting or starting work. Guard mutation
and resulting outcome consistently. Keep explicit stop's shared-root abort and
terminal halt's distinct semantics; add no universal transport-teardown promise.
Prove both pending-success and pending-failure boundaries in the mirrored owner.

### CR-04-ACCOUNT-025: A distant valid vendor expiry overflows Node's timer into a tight refresh loop

**File/location:** `R:src/runtime/accountRuntime.ts:306-313,954,969-974`;
`R:src/cloud/types.ts:140-142,180-181`.
**Rule:** correctness on untrusted expiry; D-05 existing bounded scheduling;
style Errors/Types require meaningful runtime validation, not just plausible data.
**Slice:** 04-07-02. **Kind:** genuine production bug candidate, independently confirmed.
**Issue:** A parseable date can produce a delay above Node's 2147483647-ms
timer range. The code checks NaN but not representability. Node clamps an
overflowing timeout to 1 ms, so a malformed distant credential expiry repeatedly
fetches/rotates almost immediately and can flood/throttle the account.
**Evidence:** Public runtime requests delay 4319999990 for a 50-day expiry.
A separate unmocked native Node probe records effectiveDelay=1 and the actual
TimeoutOverflowWarning. The first probe's context timer did not expose a native
delay; only the separate unmocked result supplies the clamp evidence.
**Fix:** Handle out-of-range waits without passing an overflowing timeout to
Node: retain the intended expiration schedule with bounded waits, or apply the
existing invalid-expiry fallback after an explicit validity judgment. Do not
silently invent a new product refresh interval. Add the active owner regression
before GREEN under D-04.

### CR-04-ACCOUNT-026: Cached devices absent at startup never enter removal tracking

**File/location:** `R:src/runtime/accountRuntime.ts:334,419-430,1254-1256`;
`R:src/platform.ts:581-607,627-643`;
`R:src/accessories/reconciliation.ts:70-88`.
**Rule:** canonical D-029 explicitly covers cached accessories; D-020 confirmed
removal and D-031 cached restart preservation; correctness.
**Slice:** 04-08-02, with a bounded platform/owner adaptation declared before edits.
**Kind:** genuine production bug candidate, independently confirmed by call-chain proof.
**Issue:** Homebridge restoration records cached device identities only in the
platform's accessory map. The composition factory creates an empty canonical
store, and reconciliation learns only IDs present in successful inventories in
this process. A cached device already absent on the first inventory is absent
from that tracking forever. Two, three or any number of healthy empty inventories
can never produce its removal callback. No complete vendor snapshot needs to
be persisted to retain the known physical ID.
**Evidence:** Full platform/runtime/reconciliation reads show no path from
`configureAccessory`'s cached IDs to reconciliation; the public options/factory
shape contains no such input. This is static cross-file evidence, not a native
owner regression or a new inventory policy.
**Fix:** Supply the restored known physical identities to the existing absence
state machine before counting healthy inventories. Preserve cached values until
confirmation, failed/incomplete-inventory behavior, final current check and
callback-before-prune. Declare exact platform/owner contract paths, impacts,
headers and direct checks before that narrowly required external repair.

### CR-04-ACCOUNT-027: The harness cannot detect the forbidden command calls it claims to reject

**File/location:** `R:test/runtime/accountRuntime.test.ts:488-500`.
**Rule:** unit writer/reviewer, Test doubles and Assertions: strict absence
interaction promises; each case rejects a plausible wrong implementation.
**Slice:** 04-07-01. **Kind:** assertion maintenance.
**Issue:** With no scripted command, sendCommand rejects before recording the
attempt. Runtime commands.send catches that rejection and returns a refusal.
A monitoring path that mistakenly sends a command and discards that outcome
therefore leaves no recorded command and need not fail a case, contrary to the
explicit harness comments. Throwing from a dependency is not a strict absence
assertion when the module catches it.
**Fix:** Use an explicitly verified strict command port with no allowed calls
in non-command cases, or record every attempted call before rejection and assert
the full empty attempt set. Verification must run in the owning case, not hidden
in shared cleanup. Keep this maintenance control separate from genuine RED.

### CR-04-ACCOUNT-028: Credential registration tests do not protect registration-before-use ordering

**File/location:** `R:test/runtime/accountRuntime.test.ts:531-533,700-713,3121-3154`.
**Rule:** unit writer/reviewer, Test doubles: shared exact order log when order
is the promise; Assertions: complete meaningful observations; AUTH-02.
**Slice:** 04-07-02. **Kind:** assertion maintenance.
**Issue:** The registration strings and shadow calls are collected separately.
Moving the three role registrations after shadow creation/start leaves the
expected registration list unchanged. The redaction composition case logs only
after startup/stop and omits the AWS access-key ID from that logging check, so
it cannot protect the required before-downstream-use boundary either.
**Fix:** Observe ordered registration and first downstream credential use through
one independently expected chronological stream with verified strict mocks.
Cover all three AWS roles and token registration at their actual boundaries;
retain exact role replacement behavior without asserting incidental logger text.

### CR-04-ACCOUNT-029: Composition's claimed injected floor is never reached

**File/location:** `R:test/runtime/accountRuntime.test.ts:3157-3199`.
**Rule:** unit writer/reviewer, case-title discrimination and Assertions.
**Slice:** 04-09-01. **Kind:** assertion maintenance.
**Issue:** The case supplies a short lead and floor but returns credentials
expiring an hour away. Its expected deadline exercises the lead only. Wiring
the bundled floor instead of `deps.minRotationDelayMs` still passes, while the
title claims both supplied settings are proven.
**Fix:** Add a separate composition case with expiry inside the lead window,
then independently assert before/at the supplied floor. Keep the existing
far-expiry lead case and distinguish the actual two public promises.

### WARNING findings

### CR-04-ACCOUNT-001: Both complete file headers are below the required form

**File/location:** `R:src/runtime/accountRuntime.ts:1-2` and
`R:test/runtime/accountRuntime.test.ts:1-6`.
**Rule:** D-01; style Files and modules; PROC-03 approved header.
**Slice:** 04-07-01. **Kind:** required header conformance.
**Issue:** Source lacks copyright and overview; test lacks SPDX, copyright and
overview. Source-only SPDX checking cannot establish owner/header conformance.
**Fix:** Apply SPDX first, blank line, separate copyright JSDoc, blank line,
purpose overview JSDoc, blank line, imports. Keep this header-only cause separate
from functional repairs and preserve the existing MIT classification.

### CR-04-ACCOUNT-002: Privacy comments turn the scoped opaque-key premise into a guarantee

**File/location:** `R:src/runtime/accountRuntime.ts:71-76` and
`R:test/runtime/accountRuntime.test.ts:2247-2250`.
**Rule:** D-05/D-06 privacy preservation; comments policy, factual what/why;
canonical C-002/D-027 and scoped STATE decision. Seed S-04-08.
**Slice:** 04-07-02. **Kind:** documentation accuracy, not a new disclosure permission.
**Issue:** "names no person" and "unlocks no route" are asserted as established
properties. STATE explicitly retains an unconfirmed opaque-key premise. The
test comment also calls deviceId unconditionally non-sensitive. The existing
local log/context permission is real; its rationale is not an independently
established universal privacy guarantee.
**Fix:** State the existing scoped log/context/persistence permission and its
unconfirmed opaque-key assumption. Keep public artifacts sanitized. Do not remove
the permitted per-device identifiers, introduce a migration or widen permission.

### CR-04-ACCOUNT-003: Current lifecycle comments misdescribe the actual side-effect boundary

**File/location:** `R:src/runtime/accountRuntime.ts:316-322` and
`R:test/runtime/accountRuntime.test.ts:511-513`; actual adapter at
`R:src/cloud/shadow.ts:217-223,412-447,461-475`.
**Rule:** style Comments and documentation; comments policy what/why;
D-05 bounded shared-root shutdown semantics.
**Slice:** 04-07-02. **Kind:** documentation accuracy.
**Issue:** The root is said to cancel every connection through one mechanism,
but the socket is explicitly closed separately, and a client still starting
has its own post-await close guard. The harness says the real factory opens a
socket and handshake refusal throws from the factory. The actual factory is
inert; start opens the transport and broker failures arrive through callbacks.
**Fix:** Describe the current root cancellation, explicit close and owned
late-start handling precisely, and identify the harness's scripted factory
failure as a deliberate runtime-factory failure path rather than broker behavior.
Do not expand runtime teardown or change the real adapter by analogy.

### CR-04-ACCOUNT-004: Comments retain removed-implementation history

**File/location:** `R:src/runtime/accountRuntime.ts:450-453,604-608,784-787`;
`R:test/runtime/accountRuntime.test.ts:833-835,1963-1969,2026-2027,2409-2411`.
**Rule:** typescript-comments, Forbidden in comments and test titles:
"Narration of code that no longer exists."
**Slice:** 04-09-02. **Kind:** required comment conformance.
**Issue:** The text describes the removed whole-fleet replay, a flatten that
"is simply gone", signatures that "now differ", behavior "before any anchor
existed", a branch that formerly did not exist and rotation that "used to"
swallow a refusal. The reason should survive without narrating the diff.
**Fix:** Preserve the actual safety rationale in present-tense descriptions of
current behavior and durable finding/decision IDs. Remove only process/diff
history; do not change semantics or delete necessary domain explanations.

### CR-04-ACCOUNT-005: The named registration helper uses an untyped const arrow

**File/location:** `R:src/runtime/accountRuntime.ts:1236-1238`.
**Rule:** style Functions: a named function is a declaration; const arrows need
an explicit function type or outer-this requirement.
**Slice:** 04-09-01. **Kind:** required declaration conformance.
**Issue:** registerSecret has neither exception. A return annotation on the
arrow is not an explicit function type on its binding.
**Fix:** Use a function declaration with the same name/signature/body, or an
explicit function-type binding if it has a real purpose. Its exact private
impact queries are unavailable; do not delete or rename the helper or substitute
a public neighbor's trace as permission.

### CR-04-ACCOUNT-012: The account owner verifies logger behavior outside a logging module

**File/location:** `R:test/runtime/accountRuntime.test.ts:232-249,654-664,716-745,967-988,1123-1138,1493-1505,1521-1537,1647-1678,1694-1697,1712-1724,1743-1756,1771-1829,1970-2054,2082-2104,2207-2271,2361-2379,2439-2517,2616-2812,3121-3154`.
**Rule:** unit writer/reviewer, Test doubles: "Logging gets a silent stub; log
calls are asserted only in a module whose job is logging."
**Slice:** original owner 04-07-02; applies across later slices without new IDs.
**Kind:** test-boundary conformance.
**Issue:** The owner installs real FailureLog plus a recording logger and pins
logger output, filtering and reminder counts throughout lifecycle/trust/removal
cases. This couples account behavior to the separate logger/failure-log owners
and duplicates those owners' discipline tests. Runtime's meaningful failure
routing still needs observation at its injected FailureLog boundary.
**Fix:** Keep a silent Logging stub. Observe exact public failure/success/forget
notifications with an appropriate strict FailureLog double, and assert runtime
state first. Keep redaction's output behavior in its actual logging owner while
testing account registration/wiring through the public registration boundary.
Do not discard the runtime's diagnostic cause or per-device routing assertions.

### CR-04-ACCOUNT-013: Prescribed interactions use ad hoc mock recorders

**File/location:** `R:test/runtime/accountRuntime.test.ts:477-559,700-713,2385-2405,3089-3118,3245-3267`.
**Rule:** unit writer/reviewer, Test doubles: prescribed interactions use
strong-mock with exactParams, complete expectations and explicit per-case verify;
a replacement method is a stub, not a real-behavior spy.
**Slice:** original owner 04-07-01; carry this cause through 04-08/09 as needed.
**Kind:** test-double conformance; separate from 027's swallowed-call hole.
**Issue:** API/registration/listener/command callbacks are plain functions whose
arrays/counts serve as promised interaction mocks. None has strict complete
expectations or explicit verify. `requestSpy` replaces fetch and counts it,
so it is a stub used as a mock rather than a real-behavior spy.
**Fix:** Match each double to its role: keep canned responses as typed stubs,
stateful boundaries as fakes, and prescribed public callbacks/commands as exact
strong-mock instances verified at each case's end. Use one whole timeline where
cross-port order is itself the promise. Keep genuine multiplicity observations.

### CR-04-ACCOUNT-014: Shared seed data lives in the owner and one object is reused across cases

**File/location:** `R:test/runtime/accountRuntime.test.ts:135-229,602-604`.
**Rule:** unit writer/reviewer, Test data and Case structure: cross-case seeds
are fresh functions in the concern's seed module; no shared mutable data.
**Slice:** 04-09-02. **Kind:** test data/support conformance.
**Issue:** Configuration/device/credential/heartbeat seed builders are shared
inside the owner. `testConstants` is a mutable object reused by all wired cases.
It has no stateless-port role and can carry accidental cross-case mutation.
**Fix:** Extract the existing fresh concern seeds to the conditionally declared
`test/runtime/accountRuntimeSeeds.ts`; return a fresh constants object too.
Add no generic helper layer or extra data. The helper needs full headers,
full-file review and the required broader staged support checks.

### CR-04-ACCOUNT-015: Stateful account fakes have no real/fake contract agreement

**File/location:** `R:test/runtime/accountRuntime.test.ts:304-334,416-442`;
existing TRUST contract inventory at
`R:test/runtime/arrivalAnchorMemoryContract.ts:25-28`.
**Rule:** unit writer/reviewer, Patterns: Shared adapter contracts, fresh
participants, typed inventory and independently proved negative control.
**Slice:** 04-07-01. **Kind:** test-adapter reliability/conformance.
**Issue:** fakeShadow owns connection/start/close state; recordingAnchors owns
mutable record/forget/restore state. Neither account participant is checked
against the real adapter's consumed public semantics. The existing TRUST helper
lists only real and monitoring participants and omits deletion by design, while
account consumes deletion/restore as well. Its mere existence does not cover
this fake. The shadow fake also announces connected before its optional start
wait, unlike real subscription readiness.
**Fix:** Use contract-checked consumed boundary behavior or replace a boundary
that only needs prescribed interactions with strict mocks. Reuse existing
concern support only within its actual scope. Any helper inventory/signature
adaptation first needs its own exact two-project pretrace and owning-wave
amendment; the TRUST helper's prior exception does not apply to ACCOUNT.

### CR-04-ACCOUNT-016: Several cases misuse or repeat AAA phases

**File/location:** `R:test/runtime/accountRuntime.test.ts:1623-1624,2631-2645,2664-2683,3331-3338`;
multi-operation act-and-assert wrappers at `1486-1490,3234-3238`.
**Rule:** unit writer/reviewer, Case structure: arrange/act/assert in order;
combined marker only for one throwing/rejection expression.
**Slice:** 04-09-02. **Kind:** required test-structure conformance.
**Issue:** A normal property comparison is labeled act-and-assert; removal
cases return to act after assert; the no-op removal wrapper adds another
assertion after a combined phase. Other combined wrappers execute multiple
operations/settling steps rather than the one expression the rule allows.
**Fix:** Capture each public transition in the act phase and assert afterward,
or split distinct scenarios into independent named cases. Separate ordinary
reads/actions from assertions and preserve all existing behavioral promises.

### CR-04-ACCOUNT-017: Describe blocks group internal concerns rather than exported entrypoints

**File/location:** `R:test/runtime/accountRuntime.test.ts:623,869,1050,1399,1618,2538,2975,3086,3342`.
**Rule:** unit writer/reviewer, Case structure: top-level describe names an
exported entrypoint; no grouping by private helpers/concerns.
**Slice:** 04-09-02. **Kind:** required test organization conformance.
**Issue:** Nine groups include credential rotation, poll backstop, degraded
monitoring, removal and wired account. The module exports the two factories,
not those internal orchestration concerns. Only the composition group is named
for its exported entrypoint.
**Fix:** Organize the cases under the actual factory entrypoints (or independent
top-level cases where appropriate). Preserve fresh per-case harness state and
public behavior titles; do not move shared mutable setup into describe.

## Seed dispositions and complete five-book judgment

| Seed | Initial disposition | Evidence/rule |
| --- | --- | --- |
| S-04-03 | Rejected as blanket ACCOUNT advice | No source object-type alias contains forbidden undefined/null members. Required absent fields belong to exhaustive imported snapshots/patches; optional dependency overrides are already optional. Local factory variables/signature unions are not prohibited alias members. Preserve required shape and public declarations; no zero-import deletion inference. |
| S-04-04 | Rejected as blanket ACCOUNT advice | Style's mandatory readonly rule concerns properties not reassigned outside a class constructor. ACCOUNT uses factory-owned closures and interfaces; it has no class fields to which that rule applies. MutableCredentialCache.replace intentionally replaces the held credentials; public readonly store/commands/path already express their actual exposed contract. |
| S-04-05 | Accepted only for proven incomplete promises | 006/007/008/010/011/018/019/020/028/029. Exact request count=1 for single-attempt failures, close count=1 for idempotent close, and before/after counts when multiplicity alone is the promise are valid; they must not all be mechanically converted into unrelated state assertions. 027 separately identifies a swallowed forbidden interaction. |
| S-04-06 | Accepted as 009 | Stop occurs at owner3076 before send3079; no pending work exists at shutdown. Current source actually passes the root signal; no production cancellation defect is inferred. |
| S-04-08 | Accepted as 002's bounded wording defect | b868f4e9435f75706e70c0b489b08ed115dc6d3b introduced the current account-ID-aware text. STATE231–233 explicitly preserves an unconfirmed opaque-key premise. C-002 identifies account+serial composition. Protocol constraints195–204 and the scoped decision permit local context/log use while D-027 sanitizes public artifacts. Do not restore the older false "names no account" claim or remove that scoped permission. |

The complete books were applied beyond those seeds. Style review checked every
declaration/import/export, visibility, initialization, coercion, control-flow,
error boundary, assertion and naming rule. No dangerous function, hidden
global clock read, unjustified source assertion, bare any, default export,
suppression, private access, or ignored toolchain error was found. The test's
`as const` has its literal-row role; its three temporary closure-holder union
assertions express deliberate initially-empty slots, not forged invalid doubles.
No new optional/readonly conversion is prescribed. Function-shape, headers and
documentation findings are 001–005.

Comment review covered every source/owner comment and title. Durable IDs are
allowed domain anchors; there was no forbidden GSD phase/task title. Present
policy/history inaccuracies are 002–004. Necessary domain explanations and
distinct clock bases remain useful and must survive any edits.

Writer and reviewer books were both applied to all nine groups and all 128
native cases, including harness-local code. Pairing, runner/assertion libraries,
strict compiler model, fresh runtime construction, awaited async assertions,
temporary-directory cleanup, context-owned global fetch/timer replacements,
fresh Responses, offline transports, no only/skip/todo, and exported-only
production access were checked. The scalar/no-throw/multiplicity cases were
judged against their actual narrow promise; an assertion was not rejected
merely for being scalar. The specific gaps and hard-rule violations are listed
above. Event-loop settling is the existing approved technique; no real elapsed
sleep or live-service fallback was introduced by this review.

Local-verification judgment is based on the fresh exact-input native evidence
below. Its full-wave and phase gates remain with the parent. No earlier batch's
clean judgment, coverage representation, process exception or private-helper
trace exception was inherited as ACCOUNT approval.

## Native toolchain and consumer evidence

Evidence directory: `/private/tmp/guardian-04-account-initial-native/`.
Each check has separate `<name>.stdout`, `<name>.stderr` and `<name>.json`
containing exact argv, raw exit, UTC start/end. `checks.json` collects focused
checks; `input-manifest.json` retains revision/branch/blobs, exact initial empty
dirty diff/status, tool versions, read ranges and complete case inventory.
Source and owner remained byte-identical to the blobs above through this report.

Observed versions: Node v26.11.1, npm 11.20.0, TypeScript 6.0.3,
Fallow 3.27.0. Existing package.json permits Node26; the older AGENTS embedded
range was not used to narrow the current approved runtime. No install occurred.

| Name | Exact native command/scope | Raw exit/result |
| --- | --- | --- |
| build | `npm run build:test` | 0; fresh compilation before owner |
| owner | `node --test --test-reporter=tap dist-test/test/runtime/accountRuntime.test.js` | 0; 128 pass, 0 fail/cancel/skip/todo, nine suites |
| direct | `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts` | 0; exact isolated selector, including its fresh build |
| native-coverage | `node --test --experimental-test-coverage --test-coverage-lines=100 --test-coverage-functions=100 --test-coverage-branches=100 --test-coverage-include=dist-test/src/runtime/accountRuntime.js --test-reporter=tap --test-reporter-destination=stdout --test-reporter=lcov --test-reporter-destination=/private/tmp/guardian-04-account-initial-native/accountRuntime.lcov dist-test/test/runtime/accountRuntime.test.js` | 0; 128 pass; native 964/964 lines, 57/57 functions, 167/167 branches |
| typecheck | `npm run typecheck` | 0; production and test compiler projects |
| lint | `node_modules/.bin/eslint src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts --max-warnings=0 --no-cache` | 0 |
| format | `node_modules/.bin/prettier --check src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts` | 0 |
| pairing | `npm run test:corresponding` | 0 |
| fallow-dead-code | `node_modules/.bin/fallow dead-code --file src/runtime/accountRuntime.ts --file test/runtime/accountRuntime.test.ts --format json --quiet --explain` | 0; no scoped structural issue |
| fallow-audit | `node_modules/.bin/fallow audit --base e6f49a59671c13a20b696b7f46e38406a36aeec0 --format json --quiet --explain` | 0; pass, zero changed source files; not a full-source correctness verdict |
| fallow-guard | `node_modules/.bin/fallow guard src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts .planning/phases/04-runtime-conformance/04-ACCOUNT-REVIEW.md --format json --quiet --explain` | 0; no configured boundary zones/rule packs; repeated immediately before report creation |

The native LCOV and compiled denominators above are retained directly. Selected
pair runs do not refresh the merged all-pair source-mapped LCOV. No full gate,
commit hook or pre-commit result is invented for this read-only review.

### Exact symbol evidence and its limits

Live Fallow guard/dead-code help was read and retained. Every impact command
uses the following exact form, independently once for each project:

`node_modules/.bin/fallow dead-code --type-aware --symbol-impact src/runtime/accountRuntime.ts:<symbol> --type-aware-project <project> --type-aware-require complete --format json --quiet --explain`.

| Exact symbol | tsconfig.json | tsconfig.test.json |
| --- | --- | --- |
| AccountRuntimeOptions | 0; complete; 0 named consumers | 0; complete; 0 named consumers |
| AccountRuntimeDeps | 0; complete; 0 named consumers | 0; complete; 0 named consumers |
| ShadowRuntimeOptions | 0; complete; 0 named consumers | 0; complete; account owner |
| AccountRuntime | 0; complete; 0 named consumers | 0; complete; account owner and both Worlds |
| createAccountRuntime | 0; complete; 0 external named consumers | 0; complete; account owner |
| createAccountRuntimeFromConfig | 0; complete; platform | 0; complete; platform, account owner and both Worlds |
| MutableCredentialCache | 2; exact private target unavailable | 2; exact private target unavailable |
| rotationDelayMs | 2; exact private target unavailable | 2; exact private target unavailable |
| registerSecret | 2; exact private target unavailable | 2; exact private target unavailable |
| applyDevices | 2; exact private target unavailable | 2; exact private target unavailable |

Raw names are `impact-<symbol>-production/test.stdout/.stderr/.json`.
Public results independently name the expected selected_project and complete
identity. Private results say the export/class method was not found; there is
no selected-project completeness proof and no deletion permission. Lexical
uses and enclosing signatures were read. In particular, zero named options/Deps
imports do not remove their public factory-parameter role or their structural
platform/World callers. These round-zero probes are evidence at R; the fixer
must refresh exact actual targets before any later contract edit. No ACCOUNT
exception or neighboring-symbol substitute is granted.

## Genuine behavior observations versus assertion controls

Genuine production candidates are exactly **021, 022, 023, 024, 025, 026**.
They remain OPEN. `probes.mjs`, `probes.stdout/.stderr/.json` retain five
read-only public observations against fresh compiled unchanged production.
`native-timer-bound.stdout/.stderr/.json` retain the separate unmocked timer
clamp. Probe cases record observed outputs; their successful process exits are
not regression GREEN and are not evidence of desired behavior. For 026 the
complete call-chain proof above is static.

No active mirrored-owner regression was added, no native intended regression
failure was claimed, no RED JSON was authored/classified, and no GREEN source
change or evidence commit occurred. Each confirmed behavior repair must first
obtain the actual active-owner unchanged-production RED and complete
planning-only evidence/ancestry required by D-04. Preserve every real attempt.

Assertion-maintenance BLOCKERs are exactly **006, 007, 008, 009, 010, 011,
018, 019, 020, 027, 028, 029**. They do not increase the production-bug count.
The report names a plausible wrong implementation for each; it claims no
mutation-control success. Any later controls must fail the intended assertion,
retain raw evidence, restore exact bytes, rebuild and prove GREEN separately.

## Continuous round-zero ledger and slice handoff

Every ID is allocated once. All rows have initial/current R locations, exact
rules, severity, first observer and OPEN disposition in their entry above.
No repair/evidence/fix hash exists yet; native check paths apply to unchanged R.
Later appendices must preserve these initial records and add actual evidence
and commits without replacing the initial verdict.

| Original owning slice | Stable OPEN IDs (prefix CR-04-ACCOUNT-) | Count |
| --- | --- | ---: |
| 04-07-01 | 001, 006, 008, 013, 015, 027 | 6 |
| 04-07-02 | 002, 003, 007, 012, 024, 025, 028 | 7 |
| 04-08-01 | 018, 019, 022 | 3 |
| 04-08-02 | 020, 021, 023, 026 | 4 |
| 04-09-01 | 005, 009, 010, 011, 029 | 5 |
| 04-09-02 | 004, 014, 016, 017 | 4 |

019's composition observation and 024's final-check observation stay with their
same ID and original owning cause, as stated above. Shared harness causes
013/012 may require serial follow-through across cases in all three plans;
that does not create another cause or a review counter. Any newly required
external path/helper first needs the bounded amendment and independent owner
review required by D-06. This report grants no silent sixth path.

Round 0 arithmetic: opening accepted IDs 0; initially confirmed/new IDs 001–029
= 29; fixed 0; rejected allocated IDs 0; reopened 0; closing OPEN 001–029 = 29.
Seed rejections S-04-03/04 are not fixed/rejected finding IDs. Correction counter
remains **0**. The complete initial review is now terminal; all repairs and
all independent full-batch correction remain pending.

After the complete 04-07/08/09 repair pass, the fresh independent correction
must again read the entire current source/owner plus every actual addition and
full header. D-03 remains global: a nonreducing open correction count, reopening
of a fixed ID, or correction round four even clean stops ALL work immediately.
No initial finding count, slice completion or earlier batch waiver resets it.

Historical WINDOWS 46/47 remain OPEN/unwaived. No missing historical hook stream,
private pretrace or earlier coverage count was reconstructed by this review.
No source/test/configuration/Git/shared-record mutation, new checkout, package
installation, live vendor request, hardware test or release claim occurred.

_Terminal initial reviewer: account_initial_review; complete full ACCOUNT scope;
correction counter 0; 29 OPEN findings._

## CR-04-ACCOUNT-024: active unchanged-production RED handoff

Prepared by typed `gsd-code-fixer`, task
`/root/phase4_account_lifecycle/account_024_red`, on 2026-10-15.
This appendix preserves the complete initial report above. It is evidence
preparation, not a repair, correction review, or finding disposition.
All 29 original IDs remain OPEN. Fixed/rejected/reopened counts remain zero;
the continuous ACCOUNT correction counter remains **0**.

The active mirrored-owner case is
`retains halted state when a pending final inventory check succeeds`, at
`test/runtime/accountRuntime.test.ts:623`. It uses public
`createAccountRuntime`, fresh typed case state, context timers, independent
whole expected canonical/trust values, and the real arrival-anchor adapter in
a per-case temporary directory. Its removal callback uses the real canonical
store's `remove`, observed by a context method spy with no replacement.
The case retains an exact empty removal-argument assertion after public-state
assertions. No logger assertion, shared helper edit, header repair, source
mutation control, production API change, skipped regression, or new package
was added.

The fourth inventory request waits inside the final removal check. After the
credential loop receives `AuthRejectedError` at elapsed 2500 ms, the case
captures the complete halted state, then resolves that pending request.
The intended `deepStrictEqual` fails: the device snapshot and exact anchor
disappear, and another trust report contains an empty per-device map. The
before-completion observation matches the independently specified halted
state. This failure demonstrates 024's late-success boundary; it supplies no
025 overflow evidence or wider lifecycle closure.

| Native command | Raw result |
| --- | --- |
| `npm run build:test` | 0; fresh compilation, 2026-10-15T05:05:18.538Z–05:05:21.159Z |
| `node --test --test-reporter=tap '--test-name-pattern=^retains halted state when a pending final inventory check succeeds$' dist-test/test/runtime/accountRuntime.test.js` | 1; one executed intended assertion failure; zero skipped/cancelled/todo |
| `node --test --test-reporter=tap dist-test/test/runtime/accountRuntime.test.js` | 1; 129 cases, 128 pass, only the new intended assertion fails; zero skipped/cancelled/todo |
| `node_modules/.bin/eslint test/runtime/accountRuntime.test.ts --max-warnings=0 --no-cache` | Final run 0; first preparation failure retained in full |
| `GSD_RUNTIME=codex node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence .planning/phases/04-runtime-conformance/04-ACCOUNT-RUNTIME-RED-EVIDENCE.json --raw` | 0; current on-disk record is `RED_EVIDENCE_OK`, `target_test_failed` |

Checks ran in the existing `features/code-review-sweep` linked checkout with
`workflow.use_worktrees=false`, Node v26.11.1 and npm 11.20.0.
The first owner-only lint attempt exposed an unsupported compiler-library
`Promise.withResolvers` reference plus local lint issues. Those preparation
errors were corrected before compilation and either native test run. Their
complete stdout/stderr, argv, raw exit and UTC times remain in the evidence;
they are not RED evidence. Formatting and lint ran only on the owner.

The pair record is
`.planning/phases/04-runtime-conformance/04-ACCOUNT-RUNTIME-RED-EVIDENCE.json`.
Its root preserves the complete full-owner native run. `priorEvidence[0]`
preserves the complete earlier named-target run at the same final test bytes.
Both records include the full regression patch, source/test identities,
versions, native streams/times and semantic assessment. The same installed
`classifyRedEvidence` recursively returns `RED_EVIDENCE_OK` for both; no second
report parser or external evidence-path gate was used. This pair evidence did
not exist before this attempt; no earlier pair history was displaced.

Native captures and the exact before-edit snapshot are retained under
`/private/tmp/guardian-04-account-024-red/`. The original initial-review probes
under `/private/tmp/guardian-04-account-initial-native/` remain untouched.
Their successful observation-process exits remain distinct from this genuine
active assertion failure.

Source commit remains `e6f49a59671c13a20b696b7f46e38406a36aeec0`.
Production `src/runtime/accountRuntime.ts` remains byte-identical to blob
`bf9094668ef1e600d44c2e302e46dfaf6c3e5866`. The complete tracked `src/`
blob manifest matches that source commit and `git diff -- src` is empty.
The active owner blob is `14a9c5c91292197b64cd2639ed754724fe313fd7`;
its original blob was `c88d2d89a924c4f7d4397ae4b1de3b53051518b3`.

No staging, commit, full `npm run check`, direct-coverage success, GREEN repair,
finding closure, or correction round is claimed. The active failing owner
remains unstaged. The parent must commit only complete planning evidence
through the required clean pre-step and ordinary hooks before any GREEN edit.
The classifier's generic GREEN message does not replace that D-04 ordering.
Global D-03 stop conditions and all existing cause budgets remain in force.

## CR-04-ACCOUNT-024: bounded lifecycle ownership repair

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_lifecycle/account_024_green`, on 2026-10-15.
Disposition: **fixed by implementing agent; requires human verification and
independent full ACCOUNT correction**. This appendix preserves the complete
round-zero review and RED handoff. It is not an independent correction or a
partial clean verdict. The ACCOUNT correction counter remains **0**.

The repair uses the existing `hasFinished()` predicate after awaited anchor
restore, launch/regular inventory, applied inventory, and the final removal
check. A completion that has lost lifecycle ownership admits no new device,
removes no device, reports no poll result, and starts no background work.
Late poll failures also preserve the halted answer. Terminal errors still
reach the existing idempotent classifier; explicit shutdown still aborts the
shared root. No universal transport teardown, retry policy, credential-expiry
policy, inventory membership policy, or new authentication policy is added.
The nested final-check terminal-error handling remains the separate OPEN 023.

The private predicate moved before its first new use to satisfy the existing
declaration-order rule. Its name, signature and body are unchanged. No shared
or exported contract, field, mutability, visibility, private alias, or signature
changed or was deleted. D-06 contract-change impact queries were therefore not
triggered. Actual callers were traced before edits: start -> restore -> launch;
launch/relaunch -> applyDevices; runPolls -> runPoll -> applyDevices; and
applyDevices -> final fetch -> removal/pruning. Platform and both World
composition/start/stop callers, REST resolution, the real anchor adapter,
reconciliation, canonical lifecycle decisions and the shadow ownership analog
were read. The full current 1283-line source and 3506-line active owner were
read before repair, with all five complete project books and AGENTS.

The cause changes exactly three repository paths:

- `src/runtime/accountRuntime.ts`
- `test/runtime/accountRuntime.test.ts`
- `.planning/phases/04-runtime-conformance/04-ACCOUNT-REVIEW.md`

Header conformance remains original 001; this functional cause adds no header
or unrelated cleanup. There is no new helper file, dependency, configuration,
central ledger, state, roadmap, requirement, or WINDOWS edit.

### Active regression and immutable evidence

Source `e6f49a59671c13a20b696b7f46e38406a36aeec0` precedes planning-only
evidence commit `250516bb892a3d88bd5c63826ed3073876e4fad6`, the repair's parent.
Production at the evidence commit still has blob
`bf9094668ef1e600d44c2e302e46dfaf6c3e5866`. The pair's RED JSON retains blob
`137389f36157ae9a3df284d618e929c0d2eaa416` unchanged. Its installed CLI check
and the SAME installed recursive `classifyRedEvidence` accept both complete
records as `RED_EVIDENCE_OK`. The root native record remains 129 cases,
128 pass and one intended `ERR_ASSERTION`/`deepStrictEqual` failure. No RED
record or archived output is rewritten by this repair.

The entire saved regression addition remains an exact byte substring of the
GREEN owner, including its original title and all assertions. There is no
formatter difference inside that saved case. Additional cases exercise
shutdown during restore, successful launch inventory after shutdown, shutdown
between launch admission and its awaited continuation, regular inventory
success/failure after terminal halt, and final-check failure after halt.
They observe complete independently specified canonical/trust/anchor state
through public factories. The existing in-flight launch-abort case now awaits
dispatch before shutdown, so it still tests its actual pending-request promise
after the new restore guard. No skipped or weakened regression is introduced.

### Verification and retained attempts

Checks ran in the existing linked `features/code-review-sweep` checkout with
`workflow.use_worktrees=false`, Node v26.11.1, npm 11.20.0 and Fallow 3.27.0.
No new worktree or branch was created. No full `npm run check` ran here; the
parent owns the combined wave and later phase gate.

Native directory: `/private/tmp/guardian-04-account-024-green/`.
Each command record retains argv, cwd, HEAD, versions, real UTC times, separate
stdout/stderr and the child's raw exit. `provenance.json` retains complete
dirty diff, blobs, ancestry, saved-patch comparison and recursive verdicts.

| Native record | Scope and actual result |
| --- | --- |
| `guard.json` | Exact three authorized paths before edits; exit 0. No boundary zones or rule packs configured. |
| `build-1.json` | Fresh `npm run build:test`; exit 0. |
| `owner-1.json` | Complete compiled owner; exit 0, 134 pass at the first candidate. |
| `direct-3.json` | Exact isolated source/owner selector, including fresh build; exit 0. |
| `native-coverage-2.json` | Complete compiled owner; exit 0, 135 pass, zero fail/cancel/skip/todo. Native compiled coverage: 983/983 lines, 57/57 functions, 180/180 branches. |
| `lint-3.json` | Both exact TypeScript files, no cache, max warnings 0; exit 0. |
| `evidence-gate.json` | Current unchanged RED JSON, installed checker; exit 0, RED_EVIDENCE_OK. |
| `audit.json` | Fallow audit against real initial ACCOUNT base e6f49a59671c13a20b696b7f46e38406a36aeec0; exit 0, pass. Its four changed paths include prior planning evidence; this repair has three paths. |
| `pre-step-1.json` | Required SKIP=npm-check pre-commit on all three paths; exit 0, clean, no formatter changes. Repeated after this result was recorded. |

The first direct run and first native coverage run failed their thresholds
because the existing idempotent terminal-classifier branch lost its caller.
The poll error guard now preserves that classifier path while suppressing late
nonterminal failures. These are retained `direct-1`/`native-coverage-1` attempts,
not claimed passes. `lint-1`/`lint-2` retain declaration-order, row-callback and
blank-line preparation failures. `direct-2` retains one new case's incorrect
expected inventory callback history; its public state assertion already
passed. The independent expected callback history was corrected to include
the two healthy empty inventories before the pending final check. All failed
outputs remain intact. No source mutation control or additional genuine RED
claim follows from these preparation failures.

### Atomic commit check and remaining scope

The repair commit is the Git object introducing this appendix and both
TypeScript changes. Its conventional title is
`fix: retain account ownership after pending inventory work`.
Resolve its actual hash and paths with `git log -1 --name-status --` on these
three paths. The required exact-file clean pre-step, exact branch/HEAD check,
stage attempt and foreground normal commit have separate native records in
the same directory. Only their terminal native results certify completion;
the implementing agent returns the actual hash and hook result to the parent.
No amend, hook bypass, stash, rebase or history rewrite is authorized.

Only original **CR-04-ACCOUNT-024** is implemented by this cause. Other original
IDs **001–023 and 025–029** remain OPEN (28); 021/022/023/025/026 are not repaired
here. This is an implementation disposition pending the eventual full-batch
independent correction, not a recalculated correction-round verdict.
Round-zero's 29 findings and all initial observations remain historical facts.
RUN-01 remains Pending. D-03 stop rules and historical WINDOWS 46/47 remain
unchanged and unwaived.

## CR-04-ACCOUNT-025: active unchanged-production RED handoff

Prepared by typed `gsd-code-fixer`, task
`/root/phase4_account_lifecycle/account_025_red`, on 2026-10-15.
This appendix preserves the complete initial report and both 024 appendices.
It records evidence preparation only. Original 025 remains OPEN; 024 retains
its implementation disposition pending independent full ACCOUNT correction.
The original 29 finding IDs and correction counter **0** are unchanged.

The active mirrored-owner case is
`waits until a distant credential expiry using only representable native timer delays`,
at `test/runtime/accountRuntime.test.ts:623`. It starts the public
`createAccountRuntime` with a valid expiry fifty days away and a ten-ms lead.
Its intended refresh deadline is 4319999990 ms. A context-owned method spy
observes the actual `node:timers/promises` object after the context enables
timer mocks. No timer method implementation is replaced by this spy.
The case observes the public monitoring path, every requested native delay,
and independent refresh counts across two representable waits and the final
remaining deadline. It requests no new refresh interval or invalid-date policy.

The final named and full-owner runs execute the intended `deepStrictEqual`
for timer representability. Both fail with `ERR_ASSERTION`: the runtime passes
`[4319999990, 2172516343]` as out-of-range delays, where the expected set is
exactly `[]`. The public `shadow-and-poll` assertion passes first. The following
independent no-early-refresh/deadline assertion stays active, but this RED stops
at the timer-range assertion. The existing 024 case remains byte-identical
and passes in the full owner. There is no setup, compilation, import,
TypeError, skip, cancellation, source mutation control, or logger assertion
supplying this RED.

The timer mocks provide deterministic scheduling. Their behavior does not
establish native timer clamping. A separate actual-native probe at current
source HEAD records requestedDelay=4319999990 and effectiveDelay=1, plus the
complete native `TimeoutOverflowWarning` and its one-ms fallback message.
The probe clears the timer immediately. It opens no cloud boundary and waits
for no elapsed deadline. The initial review's independent native probe and
its original raw streams remain intact and are also retained in the record.

### Native attempts and verification location

All checks ran in the existing linked `features/code-review-sweep` checkout,
with `workflow.use_worktrees=false`, Node v26.11.1 and npm 11.20.0.
No worktree or branch was created. Native captures are retained under
`/private/tmp/guardian-04-account-025-red/`. Each command has complete separate
stdout/stderr, exact argv, raw child exit, UTC start/end, versions and HEAD.

| Native record | Command/scope and raw result |
| --- | --- |
| `guard.json` | Installed Fallow guard on exactly the three authorized paths before edits; exit 0, no configured zones/rule packs. |
| `owner-format.json`, `owner-format-2.json` | Exact owner Prettier; both exit 0, unchanged. |
| `owner-lint.json`, `owner-lint-2.json` | Exact owner ESLint, max warnings 0, no cache; both exit 0. |
| `build.json`, `build-2.json` | Fresh `npm run build:test`; both exit 0; complete npm stdout/stderr retained. |
| `target.json`, `owner.json` | First exact named/full-owner attempts; exit 1, only the new 025 case fails. These preliminary failures precede execution of the timer-range assertion. |
| `target-2.json` | `node --test --test-reporter=tap '--test-name-pattern=^waits until a distant credential expiry using only representable native timer delays$' dist-test/test/runtime/accountRuntime.test.js`; exit 1, one intended timer-range assertion failure, zero skip/cancel/todo. |
| `owner-2.json` | `node --test --test-reporter=tap dist-test/test/runtime/accountRuntime.test.js`; exit 1, 136 tests, 135 pass, only 025 fails, zero skip/cancel/todo. |
| `native-timer-bound.json` | Isolated actual-native timer probe; exit 0, effective one-ms delay and native overflow warning. This observation is distinct from an intended regression run. |
| `current-installed-gate.json` | Installed CLI on the actual on-disk pair record; exit 0, `RED_EVIDENCE_OK`, `target_test_failed`. |

The first named/full runs failed the independent timing assertion with refresh
counts 2,3,3,4 instead of 1,1,1,2. Their bounded-delay assertion had not run.
Both complete streams, original owner blob and full original regression patch
remain separately archived. The final preparation places the intended
timer-range assertion after public path state and before the timing assertion.
The final fresh build precedes both final native runs. No preparation attempt
is discarded, and no mocked timing result is called native-clamp proof.

### Evidence history and unchanged production

The pair record is
`.planning/phases/04-runtime-conformance/04-ACCOUNT-RUNTIME-RED-EVIDENCE.json`.
Its root is the final full-owner 025 run. `priorEvidence[0]` is the ENTIRE
previous 024 root, including its recursively nested earlier named run and
every other original field. Its raw original JSON is retained too. The saved
previous blob is `137389f36157ae9a3df284d618e929c0d2eaa416`, from evidence
commit `250516bb892a3d88bd5c63826ed3073876e4fad6`.
The other three direct archives preserve both preliminary 025 runs and the
final named 025 run. The SAME installed `classifyRedEvidence` recursively
accepts all six root/archive records as `RED_EVIDENCE_OK`. The installed
`check tdd-red-evidence` CLI separately accepts the actual on-disk pair file.
No second report parser or external evidence-path gate is used.

Source HEAD remains `c179545bf4d2bb1aa35a3e4b204b92f3930b1941`.
Production `src/runtime/accountRuntime.ts` retains blob
`79128e3d0a6387c68d26266368138589b71c6e14`, including the implemented 024
guards. All 44 tracked `src/` files match that commit byte for byte, and
`git diff -- src` is empty. The final active owner blob is
`9d146246782548769812b926fb9a627d45bbfb5c`. The full patch, original/current
owner blobs, compiled hashes and production manifest are retained in the
record. The original report bytes remain an exact prefix of this appendix.

No staging, commit, GREEN production edit, source control, direct-coverage
success, full `npm run check`, finding closure, correction review, ancillary
summary, or shared-state advancement is claimed. The failing owner remains
unstaged. The parent alone must commit the complete planning evidence through
the required clean pre-step and ordinary hooks before any 025 GREEN edit.
All cause budgets, D-03 stop conditions and historical limits remain in force.

## CR-04-ACCOUNT-025: deadline-preserving bounded waits

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_lifecycle/account_025_green`, on 2026-10-15.
Disposition: **fixed by implementing agent; requires human verification and
independent full ACCOUNT correction**. This appendix preserves the complete
initial review and both genuine RED histories. It is not a correction review
or a clean verdict. The continuous ACCOUNT correction counter remains **0**.

The existing `waitFor` body waits in segments no greater than 2147483647 ms.
Each completed full segment is subtracted before the final remainder wait.
The fifty-day expiry therefore retains its entire 4319999990-ms
expiration-minus-lead delay. Credentials are not refreshed at the intermediate
segment boundaries. The same root signal reaches every segment, and the
existing catch still returns false on cancellation. The lifecycle predicates,
credential lead/floor, invalid-date fallback and refresh loop are unchanged.
No new interval, product policy, API, helper, alias, signature or caller is added.

The full current 1312-line source and 3734-line active owner were read before
repair, with complete AGENTS and all five complete project books. Callers were
traced through waitWhileRunning to retryShadow, runPolls and runCredentials,
plus relaunch's direct waitFor call. The actual platform and both World
composition/start/stop callers were read. This repair changes only the helper
body and a module-local native timer-limit constant. It does not rename,
delete or change a private/shared/exported signature, visibility or contract.
D-06 contract-change impact queries are therefore not triggered.

The cause changes exactly these three repository paths:

- `src/runtime/accountRuntime.ts`
- `test/runtime/accountRuntime.test.ts`
- `.planning/phases/04-runtime-conformance/04-ACCOUNT-REVIEW.md`

The owner change is the original active 025 regression and its timer-object
import. Its entire saved patch is byte-identical to the active owner diff
against source commit c179545. The original 024 regression is also preserved
byte for byte. No added coverage case was needed: the existing active cases
cover every new branch. Header conformance remains original 001; this cause
contains no header churn, helper/configuration edit or shared-record change.

### Immutable evidence and actual ancestry

Source commit `c179545bf4d2bb1aa35a3e4b204b92f3930b1941` precedes
planning-only evidence commit `6f9500e54ac7b6e72db982f42722f9ce2bf768d7`,
the repair's parent. Both commits retain production blob
`79128e3d0a6387c68d26266368138589b71c6e14`. The evidence commit changes only
this report and the RED JSON; no failing owner was committed there.
The GREEN source blob is `767f8ff14df4220134281288d743697ece3df9f6`.
The active owner retains blob `9d146246782548769812b926fb9a627d45bbfb5c`.

The RED JSON remains unchanged at blob
`849b2e725bc19a4742e962910cce05f804a6a4c1`. Its installed CLI check passes,
and the SAME installed classifyRedEvidence recursively accepts all six
current/archive records as RED_EVIDENCE_OK. Actual source/test Git objects and
the full saved active patch were compared again. The independent native clamp
probe remains in `/private/tmp/guardian-04-account-025-red/`; the deterministic
GREEN owner makes no new claim about an unmocked fifty-day elapsed wait.
All 43 other production files remain byte-identical to c179545.

### Verification location, exact inputs and native records

Checks ran in the existing linked `features/code-review-sweep` checkout with
`workflow.use_worktrees=false`, Node v26.11.1, npm 11.20.0, TypeScript 6.0.3
and Fallow 3.27.0. No worktree or branch was created. No full npm run check ran
here; the parent owns the combined wave and later phase gate.

Native directory: `/private/tmp/guardian-04-account-025-green/`.
Every command record retains exact argv, cwd, HEAD, versions, real UTC
start/end times, separate stdout/stderr and raw exit. `before.json` retains
the exact initial dirty diff, index state, tracked path/blob/SHA-256 manifest
and untracked contents. `provenance.json` retains the complete repair diff,
actual ancestry, immutable evidence hash, recursive classifications, patch
comparison and native LCOV metrics.

| Native record | Actual command/scope and raw result |
| --- | --- |
| `guard.json` | Exact three authorized paths before edits; exit 0, no configured zones/rule packs. |
| `build-1.json` | Fresh npm run build:test; exit 0, 2026-10-15T05:31:02.630Z–05:31:05.440Z. |
| `owner-1.json` | Complete compiled owner with TAP; exit 0, 136 pass, zero fail/cancel/skip/todo. |
| `direct-1.json` | Exact isolated source/owner selector, including fresh build; exit 0. |
| `native-coverage-1.json` | Complete owner, exit 0, 136 pass; native compiled 988/988 lines, 57/57 functions, 181/181 branches. |
| `lint-1.json` | Exact two TypeScript files, no cache, max warnings 0; exit 0. |
| `evidence-gate.json` | Installed CLI on unchanged on-disk RED JSON; exit 0, RED_EVIDENCE_OK. |
| `provenance-1.json` | Exact active patch, retained 024 case, six recursive verdicts and real source/evidence ancestry; exit 0. |
| `audit-1.json` | Fallow audit against initial ACCOUNT base e6f49a59671c13a20b696b7f46e38406a36aeec0; exit 0, pass. |
| `pre-step-1.json` | Required SKIP=npm-check pre-commit on all three changed paths; exit 0, clean, no formatter changes. Repeated after recording this result. |
| `pre-step-2.json` | Repeated exact-file pre-step before staging; exit 0, clean, source/owner blobs unchanged. |
| `stage-1.json` | Sandbox staging attempt; exit 128, linked-checkout index.lock creation denied. Index remained empty; complete stderr retained. Clean pre-step repeats before the authorized filesystem retry. |

All GREEN source/owner checks passed their first attempt. The temporary
snapshot script initially encountered tracked directory/symlink entries.
Its two failed preparation attempts and corrected passing third attempt remain
in snapshot-attempt-1/2/3 native records. They changed no repository input and
are not test evidence or a hidden passing gate. No source mutation control,
install, live vendor request or hardware run occurred.

The initial staging attempt could not create the linked checkout's index.lock
outside the writable checkout root. This is a retained filesystem failure,
not a source/test failure or a hook bypass. The retry uses the authorized
filesystem permission after another clean exact-file pre-step. Its separate
native record and normal commit result remain the completion authority.

### Commit and remaining scope

The repair commit is the Git object introducing this appendix and both
TypeScript changes, titled `fix: preserve distant credential refresh deadlines`.
Resolve its actual hash and exact paths from Git. The clean exact-file
pre-step, branch/HEAD/index assertions, staging and normal foreground commit
have separate native records; only their terminal results prove completion.
No amend, hook bypass, stash, rebase or history rewrite is authorized.

Only original 025 is implemented by this cause. Original 024 retains its
separate implementation disposition. The other 27 original IDs remain OPEN:
001–023 and 026–029. Both implemented behavior fixes still await independent
full ACCOUNT correction after all 04-08/09 causes. The initial 29 findings and
their original observations remain intact; RUN-01 remains Pending. No finding
counter, D-03 stop condition or historical WINDOWS exception is reset or waived.

## CR-04-ACCOUNT-001: complete source and owner headers

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_lifecycle/account_001_headers`, on 2026-10-15.
Disposition: **implemented; pending independent full ACCOUNT correction**.
This appendix preserves the complete initial review and all earlier repair
appendices. The original 29 stable finding IDs and continuous ACCOUNT
correction counter **0** remain unchanged. No partial clean verdict is claimed.

Both complete headers now follow D-01 and the approved PROC-03 form:
SPDX MIT first, one blank line, a separate copyright JSDoc for
Copyright (c) 2026 Alessandro Colomba, one blank line, a separate purpose
`@fileoverview` JSDoc, one blank line, then imports. The source coordinates
account monitoring, credential rotation and commands. Its owner verifies
account monitoring, lifecycle ownership and commands. Both files are original
project work; the source's MIT classification is retained, with no template
or Apache boundary added to the owner.

The repair changes exactly three repository paths:

- `src/runtime/accountRuntime.ts`, header at lines 1–10;
- `test/runtime/accountRuntime.test.ts`, header at lines 1–10;
- `.planning/phases/04-runtime-conformance/04-ACCOUNT-REVIEW.md`, this appendix.

Pre-edit HEAD was `03df99257d871a6c2c959363ac99ed078cdd63bd`, on
`features/code-review-sweep`, with empty index and clean tracked/untracked
status. Complete AGENTS, all five complete project books, 04-07-PLAN,
the complete review protocol including current isolation/maintainer notes,
and the complete ACCOUNT report were read before the repository edits.
Both actual complete headers and adjacent imports were inspected, along with
the existing approved source/owner header pattern. No function, signature,
alias, field, caller or runtime contract changes, so D-06 impact queries are
not triggered. The implementation and owner bodies beginning at their first
imports are byte-identical to their saved pre-edit bodies. This also preserves
every original 024/025 active regression, assertion and native-history reference.

### Verification location and immutable evidence

All checks ran in the existing linked `features/code-review-sweep` checkout,
with `workflow.use_worktrees=false`. No new checkout, branch or recovery
sentinel was created. Observed versions: Node v26.11.1, npm 11.20.0,
TypeScript 6.0.3 and Fallow 3.27.0. No full `npm run check` ran here;
the parent owns the combined wave and later phase gates.

Native directory: `/private/tmp/guardian-04-account-001-headers/`.
Each command has separate complete `.stdout`, `.stderr` and `.json` records
with exact executable/argv, cwd, pre-command HEAD, versions, raw child exit,
and real UTC start/end. `before.json` records the exact initial empty diff,
index, untracked set and 694 tracked path/blob/SHA-256 entries. Saved complete
source/owner/report bytes support exact comparison. `provenance.json` retains
the complete repair diff, header/body comparisons, original report-prefix
comparison, unchanged evidence identity and native LCOV metrics.

| Native record | Actual command/scope and raw result |
| --- | --- |
| `guard.json` | Installed Fallow guard on exactly the three authorized paths before edits; exit 0, no configured zones/rule packs. |
| `snapshot.json` | Initial branch/HEAD/index/clean-status assertions, tracked manifest and exact pre-edit bytes; exit 0. |
| `build.json` | `npm run build:test`; exit 0, 2026-10-15T05:37:26.300Z–05:37:29.335Z. |
| `owner.json` | `node --test --test-reporter=tap dist-test/test/runtime/accountRuntime.test.js`; exit 0, 136 pass, zero fail/cancel/skip/todo. |
| `direct.json` | `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts`; exit 0, exact isolated selector including fresh build. |
| `native-coverage.json` | Complete compiled owner with all three 100% thresholds and exact-source include; exit 0, native compiled 994/994 lines, 57/57 functions, 181/181 branches. Full argv and LCOV retained. |
| `lint.json` | Exact source/owner ESLint, no cache, max warnings 0; exit 0. |
| `audit.json` | `node_modules/.bin/fallow audit --base e6f49a59671c13a20b696b7f46e38406a36aeec0 --format json --quiet --explain`; exit 0, verdict pass. |
| `provenance-1.json` | Exact approved headers, unchanged entire source/owner bodies and original report prefix, unchanged RED blob, no unrelated tracked-input changes; exit 0. |
| `pre-step-1.json` | Exact `SKIP=npm-check pre-commit run --files` on all three changed paths; exit 0, clean, no formatter changes, 2026-10-15T05:38:54.094Z–05:38:57.006Z. |
| `provenance-2.json` | Repeated complete byte/provenance check after the clean pre-step; exit 0, exact three changed paths, empty index/untracked set. |
| `pre-step-2.json` | Repeated exact three-path clean pre-step after recording results; exit 0, no formatter changes. |
| `assert-before-stage.json` | Exact feature branch, expected HEAD, empty index and three-path dirty scope; exit 0. |
| `stage-1.json` | Initial sandbox staging; exit 128, linked-checkout index.lock creation denied. No commit or hook ran. |

The source blob changes only its header, from
`767f8ff14df4220134281288d743697ece3df9f6` to
`6e6795bb2720ea38dd46d01393d82692c636de16`.
The owner blob changes only its header, from
`9d146246782548769812b926fb9a627d45bbfb5c` to
`cd258df8167e85daa7da8e2079c4f85d8e9894c9`.
The entire RED JSON, including all six current/archive records and their
complete untouched streams, retains blob
`849b2e725bc19a4742e962910cce05f804a6a4c1`.
The current native compiled line denominator includes the added header;
selected pair checks do not refresh merged all-pair source-map LCOV.
No new RED evidence, mutation control, install, live account or hardware run
is introduced by this header cause.

### Commit and remaining scope

The repair commit is the Git object introducing this appendix and both
header changes, titled `fix: complete account runtime file headers`.
Resolve its actual hash and exact three paths from Git. The exact-file clean
pre-step, branch/HEAD/index assertions, stage attempts and normal foreground
commit have separate native records. Only their terminal native results
certify completion; the implementing agent returns those results to the parent.
No amend, hook bypass, stash, rebase or history rewrite is authorized.

The initial staging failure is a filesystem-permission result, not a source,
test or hook failure. Its complete native stderr is retained. The retry uses
the authorized filesystem permission only after another exact-file clean
pre-step. Separate `pre-step-3`, `stage-2`, staged assertions and foreground
commit records retain the actual terminal results; no prospective pass is
implied here.

Only original 001 is implemented by this cause. Original 024 and 025 retain
their separate implementation dispositions pending independent full ACCOUNT
correction. The other 26 original IDs remain OPEN: 002–023 and 026–029.
No ACCOUNT correction occurs until every 04-08/09 initial cause is finished.
RUN-01 remains Pending, and D-03 stop conditions and historical WINDOWS 46/47
remain unchanged and unwaived.

## CR-04-ACCOUNT-006: exact injected store identity

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_lifecycle/account_006_store_identity`, on 2026-10-15.
Disposition: **implemented; pending independent full ACCOUNT correction**.
The complete initial report and all prior appendices remain intact.
The continuous ACCOUNT correction counter remains **0**. No partial clean
verdict or correction review is claimed.

The existing `reads canonical state from the one store it maintains` case
now asserts `assert.strictEqual(runtime.store, store)`. It then compares the
complete public snapshot against an independent literal: identity, connectivity,
all three discovery data values, empty metadata, absent shadow watermark,
device timestamp and local receipt timestamp. The separate complete discovery
case remains unchanged. No production behavior, API, private contract, header,
mock, helper, configuration or shared record changes.

Pre-edit HEAD was `604d072a4f5169ef17f27a74c1176e8f1aca2289` on
`features/code-review-sweep`, with clean status and empty index. Before editing,
the fixer read complete AGENTS, all five complete project books, 04-07-PLAN,
the full review protocol and this full report. The complete source, relevant
owner setup and adjacent cases, public store contract, factory wiring and
actual platform/World store consumers were read. The source return and the
owner harness both use the same injected store. No name, signature, field,
mutability, visibility or alias change triggers D-06 impact queries.

### Separate assertion maintenance control

The plausible wrong public behavior is a distinct store object that forwards
the injected store's methods. Equal current snapshot values do not establish
the promised binding identity; the prior deep-value assertion accepts this
behavior. Compilation and direct coverage also cannot establish identity.

The only temporary source change was `store: { ...options.store }` in the
public factory's returned runtime. The copied methods retain their original
closure-backed state, so the snapshot remains equal while the store reference
differs. After a fresh successful build, the exact named test failed at the
new strict identity assertion: `Values have same structure but are not
reference-equal`. Native TAP records one executed test, one failure and zero
skip/cancel/todo. There was no setup, import, compilation or other state failure.
This is an assertion maintenance control, not a genuine production RED.

The complete source was then restored exactly and compared with its saved
bytes. Source before/restored blob:
`6e6795bb2720ea38dd46d01393d82692c636de16`.
Temporary control blob: `ae229dffab326a3d76bf4caaba9800bcd8494f51`.
The source diff is empty; no mutation enters Git. A fresh restored build and
the exact named test pass. The final owner blob is
`e276f66508b481b1724d52cfd9da6f504f31d8ab`.

### Verification location and native evidence

All checks ran in the existing linked `features/code-review-sweep` checkout,
with `workflow.use_worktrees=false`, Node v26.11.1, npm 11.20.0,
TypeScript 6.0.3 and Fallow 3.27.0. No worktree or branch was created.
No full `npm run check` ran here; the parent owns the combined wave gate.

Native directory: `/private/tmp/guardian-04-account-006-identity/`.
Every command record retains executable/argv, cwd, HEAD, versions, raw exit,
real UTC start/end and complete separate stdout/stderr. Saved before/control/
restored source bytes, the final owner, exact full patch and tracked-file
hash manifest are retained. Provenance checks confirm all unrelated tracked
file bytes and the complete prior report prefix remain intact.

| Native record | Actual command/scope and raw result |
| --- | --- |
| `guard.json` | Fallow guard on exactly the three owned paths before edits; exit 0, no configured zones/rule packs. |
| `snapshot.json` | Exact initial feature branch/HEAD/index/clean-status assertions; exit 0, 694 tracked entries. |
| `baseline-build.json`, `baseline-target.json` | Fresh build then exact named test with strengthened assertions; both exit 0. |
| `control-build.json`, `control-target.json` | Fresh temporary-source build exits 0; exact named test exits 1 at intended identity assertion. |
| `control-provenance.json` | Exact one-line source mutation and complete intended-failure semantics; exit 0. |
| `restored-build.json`, `restored-target.json` | Exact restored source, fresh build then named test; both exit 0. |
| `owner.json` | Complete compiled owner; exit 0, 136 pass, zero fail/cancel/skip/todo. |
| `direct.json` | Exact isolated source/owner selector, including fresh build; exit 0. |
| `native-coverage.json` | Complete owner with exact-source 100% thresholds; exit 0, native compiled 994/994 lines, 57/57 functions, 181/181 branches. |
| `lint.json` | Exact owner ESLint, no cache, max warnings 0; exit 0. |
| `audit.json` | Fallow audit against initial ACCOUNT base e6f49a59671c13a20b696b7f46e38406a36aeec0; exit 0, verdict pass. |
| `evidence-gate.json` | Installed CLI on unchanged genuine RED JSON; exit 0, RED_EVIDENCE_OK. |
| `provenance-1.json` | Source restoration, complete prior report prefix, unchanged unrelated files and immutable RED blob; exit 0. |
| `pre-step-1.json` | Required exact two-file SKIP=npm-check pre-commit; exit 0, clean, no formatter changes. |
| `provenance-2.json` | Repeated restored-source, final-owner and unchanged-input checks after clean pre-step; exit 0. |
| `pre-step-2.json` | Repeated exact two-file clean pre-step after report update; exit 0, no formatter changes. |
| `assert-before-stage.json` | Exact feature branch/HEAD, empty index and final two-path scope; exit 0. |
| `stage-1.json` | Sandbox staging exits 128: linked-checkout index.lock creation denied; no commit or hook ran. |

The genuine RED JSON retains blob
`849b2e725bc19a4742e962910cce05f804a6a4c1`, including all original archived
streams. Original 024/025 active cases and all other owner assertions remain
byte-identical; the owner diff is confined to this identity case. Selected
coverage does not refresh merged all-pair source-map LCOV. No package install,
live request or hardware test occurs.

### Atomic commit and remaining scope

The commit introducing this appendix and the owner assertion is titled
`fix: assert account runtime store identity`. Resolve its actual hash and
exact two paths from Git. Only `test/runtime/accountRuntime.test.ts` and this
report belong to the final commit. The source control is restored before any
staging. Exact-file clean pre-step, branch/HEAD/index checks, staging and normal
foreground commit records retain the terminal results in the native directory.
No amend, hook bypass, rebase, stash or history rewrite is used.

The initial staging failure is a filesystem-permission result, not a source,
test or hook failure. Complete native stderr is retained. The retry uses the
authorized filesystem permission after another clean exact-file pre-step.
Separate pre-step, staging, staged-scope assertion and foreground commit
records retain the real terminal outcomes; no prospective hook pass is implied.

Only original 006 is implemented by this cause. Original 001, 024 and 025
retain their implementation dispositions pending independent full ACCOUNT
correction. The other 25 original IDs remain OPEN: 002–005, 007–023 and 026–029.
RUN-01 remains Pending. No full ACCOUNT correction occurs until every owning
04-08/09 cause finishes. D-03 stop conditions, counter 0 and historical
WINDOWS 46/47 remain unchanged and unwaived.

## CR-04-ACCOUNT-008: exact restored and reported arrival anchors

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_lifecycle/account_008_restored_anchors`, on 2026-10-15.
Disposition: **implemented; pending independent full ACCOUNT correction**.
The complete initial report and all earlier repair appendices remain intact.
The continuous ACCOUNT correction counter remains **0**. This is assertion
maintenance, with no genuine production RED or partial clean verdict.

The restart case now captures the exact public anchor read and complete stored
anchor set after startup. Both independently expect `START_TIME - 1796000`.
The existing first-report count and silent boolean remain, preserving the
one-event-loop-turn delayed restore ordering discriminator. The case advances
the injected clock by 123 ms, routes a real reported arrival through the actual
shadow callback supplied by public `createAccountRuntime`, and asserts the
exact new timestamp and complete singleton anchor set as `START_TIME + 123`.
Expected timestamps use independent literal intervals; no production formatter,
projection, private access, new helper or API supplies the expected answer.

Pre-edit HEAD was `18d814eaefe9e3e46a3f92ce7e36d8e5c3dad6ea` on
`features/code-review-sweep`, with clean status and empty index. Before edits,
complete AGENTS, all five complete project books, 04-07-PLAN, the full review
protocol and this full report were read. The complete runtime, relevant owner
setup and restart cases, arrival-anchor and monitoring-health contracts, and
actual start/health composition callers were inspected. No contract, signature,
alias, name, visibility or mutability change triggers D-06 impact queries.
Only the existing restart case changes; the source has no final diff.

### Separate assertion maintenance control

The plausible wrong behavior replaces a restored timestamp with another old
timestamp during admission. The old boolean/count observations, compilation
and direct coverage cannot distinguish those two timestamps. The temporary
minimum source mutation inserted one call after `health.admitDevice`:
`options.anchors.record(device.deviceId, options.clock.now() - 1800000)`.
It replaces the restored `1787916604000` with `1787916600000`, while retaining
exactly one first report and `silent: true`.

After a fresh successful build, the exact named target executes and fails its
new startup `deepStrictEqual`: only the anchor and stored timestamp differ.
Native TAP records one test, one intended failure and zero skips, cancellations
or todos. The actual reported-arrival action has already executed before this
assertion. The failure is not setup, compilation, import or unrelated state.
The full source is restored and compared byte for byte, then rebuilt. The
same target passes after restoration. This control is separate from genuine
RED history; no mutation or evidence JSON change enters Git.

Source before/restored blob:
`6e6795bb2720ea38dd46d01393d82692c636de16`.
One-line control blob: `5519d39c5e71c3d466f3cc76a83cd7f675cc1d88`.
Final owner blob: `7ad6da177dbe54556473e8461029d8cf2b13b50e`.
The full owner outside this restart case remains byte-identical, including
every active 024/025 case and the implemented 001/006 changes.

### Verification location and retained native records

All checks ran in the existing linked `features/code-review-sweep` checkout,
with `workflow.use_worktrees=false`, Node v26.11.1, npm 11.20.0,
TypeScript 6.0.3 and Fallow 3.27.0. No new checkout or branch was created.
No full `npm run check` ran here; the parent owns the combined wave gate.
Selected coverage does not refresh the merged all-pair source-map LCOV.

Native directory: `/private/tmp/guardian-04-account-008-anchors/`.
Each command record retains exact executable/argv, cwd, HEAD, versions, raw
exit, real UTC times and separate complete stdout/stderr. `before.json`
retains the initial empty diff/index/untracked set and 694 tracked entries.
Saved before/control/preparation/restored source bytes, final owner, exact
control patch and complete repair diff support independent comparison.
`provenance.json` compares every unrelated tracked input, the complete earlier
report prefix and unchanged owner text outside the assigned restart case.

| Native record | Scope and actual raw result |
| --- | --- |
| `guard.json` | Exact three owned paths before edits; exit 0, no configured zones or rule packs. |
| `snapshot.json` | Exact initial feature branch/HEAD/index/clean-status assertions; exit 0. |
| `baseline-build.json`, `baseline-target.json` | Fresh build and strengthened named target; both exit 0. |
| `control-build-2.json`, `control-target.json` | One-line source control builds with exit 0; named target exits 1 at intended exact-anchor assertion. |
| `restore-check.json`, `restored-build.json`, `restored-target.json` | Exact full source bytes and empty source diff, fresh build and named GREEN; all exit 0. |
| `final-control-build.json`, `final-control-target.json` | Repeated control on final owner bytes; build 0, intended named assertion failure 1. |
| `provenance-3.json`, `final-restored-build.json`, `final-restored-target.json` | Exact second restoration, fresh build and final named GREEN; all exit 0. |
| `owner-final.json` | Full compiled owner; exit 0, 136 pass, zero failures/cancellations/skips/todos. |
| `direct-final.json` | Exact isolated source/owner selector including fresh build; exit 0. |
| `native-coverage-final.json` | Complete owner and exact-source 100% thresholds; exit 0, native compiled 994/994 lines, 57/57 functions, 181/181 branches. |
| `lint-final.json` | Exact owner ESLint, no cache, max warnings 0; exit 0. |
| `audit.json` | Fallow audit against initial ACCOUNT base e6f49a59671c13a20b696b7f46e38406a36aeec0; exit 0, pass. |
| `evidence-gate.json` | Installed CLI on unchanged genuine RED JSON; exit 0, RED_EVIDENCE_OK. |
| `provenance-4.json` | Exact restored source, unchanged unrelated tracked files, prior report prefix and complete owner outside restart case; exit 0. |
| `pre-step-1.json` | Required exact two-file SKIP=npm-check pre-commit; exit 0, clean, no formatter changes, 2026-10-15T05:51:31.338Z–05:51:34.229Z. Repeated after this result was recorded. |

All preparation attempts remain native records. An initial temporary control
was built before it was reduced to the one-line admission mutation; its full
source bytes and successful build are retained, and no target ran against it.
The first exact lint exposed Prettier's double-quoted apostrophe title. The
title now avoids that apostrophe, and lint passes. The first provenance script
failed to locate the reformatted title; its corrected reruns pass. The final
control/build/restoration and all focused checks repeat on the final owner.
These preparation results are not relabeled as genuine RED or passing gates.

The complete genuine RED JSON retains blob
`849b2e725bc19a4742e962910cce05f804a6a4c1`, including all archived streams.
No package install, live vendor request, hardware run, helper, configuration,
privacy-comment cleanup or shared-record change is introduced.

### Atomic commit and remaining scope

The commit introducing this appendix and restart assertion is titled
`fix: preserve restored arrival anchor assertions`. Resolve the actual hash
and exact two paths from Git. Only `test/runtime/accountRuntime.test.ts` and
this report are staged. Separate native exact-file clean pre-step, branch/HEAD/
index assertions, authorized staging and ordinary foreground commit records
retain their terminal results. No hook bypass, amend, stash, rebase or history
rewrite is used. The known linked-index sandbox boundary uses the authorized
filesystem permission after a fresh clean pre-step; no denial is manufactured.

Only original 008 is implemented by this cause. Original 001, 006, 024 and 025
retain their separate implementation dispositions. The other 24 original IDs
remain OPEN: 002–005, 007, 009–023 and 026–029. All implementations still await
independent full ACCOUNT correction after all owning causes finish. RUN-01
remains Pending, counter 0 and D-03 stop conditions are unchanged, and the
historical WINDOWS 46/47 exceptions remain OPEN and unwaived.

## CR-04-ACCOUNT-007: independent bundled rotation deadlines

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_lifecycle/account_007_timing`, on 2026-10-15.
Disposition: **implemented; pending independent full ACCOUNT correction**.
The complete initial review and every earlier appendix remain intact.
The continuous ACCOUNT correction counter remains **0**. This is assertion
maintenance, with no genuine production RED or partial clean verdict.

The existing lead case now expects the one-hour fixture's rotation at a
literal 3000000 ms. It observes exactly one credential request at 2999999 ms
and exactly two at 3000000 ms. The existing failed-refresh retry case observes
two requests at 29999 ms after rejection and three at 30000 ms. Both bundled
exports remain the actual harness inputs. Expected boundaries are independent
of those inputs. Exact before/at request multiplicity is the public timing
promise, so no unrelated state assertion or redundant new case is added.
Every custom timing case and the genuine distant-expiry case remains unchanged.

Pre-edit HEAD was `84fd96017082503acc897521f2d458e82297266f` on
`features/code-review-sweep`, with clean status and empty index. Complete
AGENTS, all five complete project books, 04-07-PLAN, the full review protocol
and this full report were read before edits. The complete current 1327-line
source and 3770-line owner were read. Callers were traced through harness and
composition -> createAccountRuntime -> runCredentials -> refreshCredentials ->
rotationDelayMs -> waitWhileRunning/waitFor. Platform and both World factory
callers retain their existing optional override/default behavior.

The final cause changes exactly two repository paths:

- `test/runtime/accountRuntime.test.ts`, literal expected delay at line 133
  and failed-refresh before/at floor observation at lines 1365 onward;
- `.planning/phases/04-runtime-conformance/04-ACCOUNT-REVIEW.md`, this appendix.

The production source is owned only for the separate temporary controls below.
No final source diff, API, signature, name, alias, visibility, helper,
configuration, dependency, shared record or policy change is introduced.

### Separate assertion maintenance controls

Both plausible wrong defaults retain compilation and direct coverage. The
previous derived expectations move with the wrong input. The lead control
changes only `ROTATION_LEAD_MS` from 600000 to 599999; the resulting deadline
is 3000001 ms. After a fresh successful build, the exact lead target fails its
intended `deepStrictEqual`: beforeDue=1, afterDue=1 instead of 1,2. The old
derived delay would also become 3000001 and conceal that one-ms error.

The complete source is restored byte for byte, rebuilt, and the exact lead
target passes. Separately, the floor control changes only
`MIN_ROTATION_DELAY_MS` from 30000 to 30001. After its fresh successful build,
the exact failed-refresh target fails its new intended `deepStrictEqual`:
beforeFloor=2, afterFloor=2 instead of 2,3. The old imported advance would move
to 30001 and conceal the error. Both native failures execute exactly one test,
with zero skips, cancellations or todos; neither is setup, import, compilation
or unrelated assertion failure. Both full TAP streams remain untouched.

The full source is restored again, compared byte for byte, and rebuilt. Both
targets then pass before full-owner and direct checks. Source before/restored
blob: `6e6795bb2720ea38dd46d01393d82692c636de16`.
Lead control blob: `848037b59adcef0ac8732d3949f2460d38a74a5f`.
Floor control blob: `5df1e7b4825dc93e659090e3d34a150c7f5faf8f`.
Final owner blob: `f457367f2d4dd764547e6df151ca119e8a6e4921`.
No control mutation enters Git or the genuine RED JSON.

Before either exported-value control, live Fallow help and exact symbol impacts
were read and retained. Each of `ROTATION_LEAD_MS` and
`MIN_ROTATION_DELAY_MS` was queried independently for `tsconfig.json` and
`tsconfig.test.json` with `--type-aware --symbol-impact
src/runtime/accountRuntime.ts:<symbol> --type-aware-project <project>
--type-aware-require complete --format json --quiet --explain`.
All four native exits are 0, with complete identities and the correct selected
project. Production names no external consumer; the test project names only
the complete account owner. Internal composition and actual structural callers
were read separately. These traces supply no deletion or rename permission.

### Verification location and native records

All checks ran in the existing linked `features/code-review-sweep` checkout,
with `workflow.use_worktrees=false`, Node v26.11.1, npm 11.20.0,
TypeScript 6.0.3 and Fallow 3.27.0. No new checkout or branch was created.
No full `npm run check` ran here; the parent owns the combined wave gate.
Selected coverage does not refresh merged all-pair source-map LCOV.

Native directory: `/private/tmp/guardian-04-account-007-timing/`.
Every command record retains exact executable/argv, cwd, HEAD, versions, raw
exit, real UTC start/end times and separate complete stdout/stderr. Saved
before bytes, full input manifest, exact control patches and final repair
diff support restoration and unchanged-input comparison.

| Native record | Actual scope and raw result |
| --- | --- |
| `snapshot.json`, `guard.json` | Initial clean/index snapshot and exact three-path pre-edit Fallow guard; exit 0, no configured zones or rule packs. |
| `impact-lead-production/test.json`, `impact-floor-production/test.json` | Four independent exact-symbol compiler-project traces; each exit 0, complete. |
| `baseline-build.json`, `baseline-target.json` | Fresh build and both strengthened named targets; exits 0. |
| `lead-control-build.json`, `lead-control-target.json` | Build 0; one intended named assertion failure, exit 1, 2026-10-15T05:56:17.429Z–05:56:18.106Z. |
| `lead-restoration.json`, `lead-restored-build.json`, `lead-restored-target.json` | Exact source-byte restoration, fresh build, named GREEN; each exit 0. |
| `floor-control-build.json`, `floor-control-target.json` | Build 0; one intended named assertion failure, exit 1, 2026-10-15T05:56:41.330Z–05:56:42.008Z. |
| `floor-restoration.json`, `restored-build.json`, `restored-target.json` | Exact second restoration, fresh build, both named targets GREEN; each exit 0. Restored build 2026-10-15T05:56:51.120Z–05:56:54.166Z. |
| `owner.json` | `node --test --test-reporter=tap dist-test/test/runtime/accountRuntime.test.js`; exit 0, 136 pass, zero fail/cancel/skip/todo. |
| `direct.json` | `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts`; exit 0, exact isolated selector including fresh build. |
| `native-coverage.json` | Full owner, exact-source include, all three 100% thresholds; exit 0, 994/994 native lines, 57/57 functions, 181/181 branches. |
| `lint.json` | Exact owner ESLint, no cache, max warnings 0; exit 0. |
| `evidence-gate.json` | Installed CLI on unchanged genuine RED JSON; exit 0, RED_EVIDENCE_OK. |
| `audit.json` | Fallow audit against real initial ACCOUNT base e6f49a59671c13a20b696b7f46e38406a36aeec0; exit 0, verdict pass. |
| `pre-step.json` | Required exact two-file SKIP=npm-check pre-commit; exit 0, clean with no formatter changes, 2026-10-15T05:58:21.535Z–05:58:24.412Z. Repeated after recording this result. |

The genuine RED JSON retains blob
`849b2e725bc19a4742e962910cce05f804a6a4c1`, with all original archived streams.
Every 024/025 active case and the complete owner outside the exact two edits
remain byte-identical. The complete earlier report remains an exact prefix.
The native provenance record compares every other tracked input and records
the final dirty diff, compiled hashes and native coverage denominators.

### Atomic commit and remaining scope

The commit introducing this appendix and the independent timing expectations
is titled `fix: assert bundled credential rotation deadlines`. Resolve its
actual hash and exact two paths from Git. Required exact-file clean pre-step,
branch/HEAD/index assertions, authorized staging and plain foreground normal
commit retain their terminal output in the native directory. Only the owner
and report are staged. No hook bypass, amend, stash, rebase or history rewrite
is used. The known linked-index sandbox boundary uses the authorized filesystem
permission after the clean pre-step; no repeat denial is manufactured.

Only original 007 is implemented by this cause. Original 001, 006, 008, 024
and 025 retain their separate implementation dispositions. The other 23
original IDs remain OPEN: 002–005, 009–023 and 026–029. All implementations
await independent full ACCOUNT correction after all owning causes finish.
RUN-01 remains Pending, counter 0 and D-03 stop conditions are unchanged,
and historical WINDOWS 46/47 remain OPEN and unwaived.

## CR-04-ACCOUNT-015A: consumed arrival-anchor agreement

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_lifecycle/account_015a_anchor_agreement`, on 2026-10-15.
Disposition: **anchor portion implemented; original 015 remains OPEN pending
shadow agreement and independent full ACCOUNT correction**. The original
29 IDs and correction counter **0** continue. This appendix preserves the
entire initial report and every earlier appendix. It claims no correction,
independent closure or maintainer verification of the implementation.

Pre-edit HEAD was `6072c207706224f93059cfb9ebe1c1e6185c554e`, on
`features/code-review-sweep`, with clean status and empty index. The approved
04-11 declaration and amended 04-07 dependency already exist at that commit.
This task changes exactly four implementation paths: the ACCOUNT owner,
`test/runtime/arrivalAnchorMemoryContract.ts`, the arrival-anchor owner and
this report. The committed pre-code 04-11 declaration is the fifth cause path.
No production, compiler configuration, monitoring-owner, RED JSON, other
helper, central ledger or shared-state path changes.

### Exact exception and consumed contracts

Before editing the inventory, fresh exact Fallow queries targeted
`test/runtime/arrivalAnchorMemoryContract.ts:ARRIVAL_ANCHOR_MEMORY_PARTICIPANTS`.
Each used one `--type-aware-project`, `--type-aware --symbol-impact`,
`--type-aware-require complete --format json --quiet --explain`.
The test query exits 0, status/completeness complete, selected_project
`tsconfig.test.json`, and names only arrivalAnchors.test.ts and
monitoringHealth.test.ts. Production exits **1**, unavailable/no-project,
selected_project `tsconfig.json`. This remains an unmet completeness check.
Installed TypeScript 6.0.3 programs independently confirm that production
excludes the helper and tests include it. The maintainer exception permits
only adding ACCOUNT to this test-only inventory on that evidence.
No private-fixture or other exported-shape exception follows.

The existing memory cases, exercise signature, observation types and SAME
pure assertion function remain unchanged. All five cases now also run with
fresh ACCOUNT `recordingAnchors` participants. Existing real/monitoring
participants and the structured TRUST zero-loss negative control are intact.

The same concern helper adds a separately scoped typed real/ACCOUNT inventory,
three consumed persistence cases, action/capture function and pure assertion:
deletion affects only its named device; restore recovers persisted zero while
retaining another device present only in memory; persistence keeps memory and
captures a snapshot including deletion, independent of later mutations.
Both owners complete all actions and reads in ACT, then invoke the SAME
assertion against independent literal whole observations in ASSERT.
Three private broken participants separately ignore forget, restore or persist.
The SAME assertion rejects each. Independent negative expectations check
AssertionError identity, ERR_ASSERTION, complete actual/expected structures
and deepStrictEqual operator. These are adapter-contract negative controls,
not production RED or temporary source-mutation claims.

The private ACCOUNT `recordingAnchors` name and complete signature stay intact.
Its body keeps a separate map snapshot initialized from the supplied restored
entries. Persist replaces that snapshot and separately increments the existing
invocation counter; restore still merges after one event-loop turn. Existing
startup ordering, restored-anchor, reporting-count, removal and 024/025 cases
remain byte-identical. Counts establish invocation timing; the new contract
establishes state semantics. Neither observation substitutes for the other.

The agreement covers successful consumed state operations only. It does not
establish disk bytes, malformed JSON handling, temporary-file ownership,
persistence failures or complete disk equivalence. Every existing real-owner
disk/error/temporary-path-supplier case remains unchanged. All monitoring
cases and its helper remain unchanged. No source API, product policy, privacy
permission, live boundary, package installation or feature changes.

### Complete reads, headers and native checks

Before edits, the fixer read complete AGENTS, all five complete books, the
04-11 plan, amended 04-07 plan, complete latest review protocol and this whole
report. All six task read_first files were read completely: arrivalAnchors
and accountRuntime source, memory helper and arrival/account/monitoring owners.
Actual callers were traced through harness/start/health to get/record,
start to restore, reportMonitoringHealth to persist, and confirmed successful
removal to forget. Existing memory exercise/assert callers in both owners
were inspected. Installed Fallow help and TypeScript/Node API declarations
were consulted without installation. The four actual test/helper headers
(ACCOUNT, memory helper, arrival and monitoring) were inspected in full:
SPDX MIT, separate 2026 copyright JSDoc, separate purpose overview and imports.
New helper exports have JSDoc; .js imports and compiled layout remain intact.
This implementation review supplies no independent full ACCOUNT correction.

All checks ran in the existing linked feature checkout, using the documented
`workflow.use_worktrees=false` opt-out. No worktree or branch was created.
Versions: Node v26.11.1, npm 11.20.0, TypeScript 6.0.3, Fallow 3.27.0.
Native directory: `/private/tmp/guardian-04-account-015a/`. Every command record
retains exact executable/argv, cwd, HEAD, versions, real UTC start/end, separate
complete stdout/stderr and raw exit. before.json saves exact tracked hashes,
empty diff/index/untracked set and complete before bytes. provenance.json
retains the full dirty diff, blobs, compiled hashes and unchanged-input checks.

| Native record | Actual scope and raw result |
| --- | --- |
| snapshot.json, guard.json | Clean initial state and exact four-path pre-edit guard; exit 0. No boundary zones/rule packs configured. |
| impact-production.json, impact-test.json, project-scope.json | Inventory production unavailable/raw 1; test complete/0; installed program membership/0, as limited above. |
| build-final.json | Fresh npm run build:test; exit 0, 2026-10-15T12:50:18.093Z–12:50:21.358Z. |
| owners-final.json | Full account, arrival and monitoring compiled owners; exit 0, 206 pass, zero fail/cancel/skip/todo. |
| direct-account-final.json, direct-arrival-final.json, direct-monitoring-final.json | Each exact npm run test:coverage:direct source/owner pair with fresh build; all exit 0. |
| coverage-accountRuntime.json | Exact-source native thresholds; exit 0, 147 pass; 994/994 lines, 57/57 functions, 181/181 branches. |
| coverage-arrivalAnchors.json | Exact-source native thresholds; exit 0, 21 pass; 145/145 lines, 15/15 functions, 32/32 branches. |
| coverage-monitoringHealth.json | Exact-source native thresholds; exit 0, 38 pass; 154/154 lines, 13/13 functions, 18/18 branches. |
| lint-final.json | Exact three changed TypeScript files, no cache, max warnings 0; exit 0. |
| audit.json | Fallow audit against original e6f49a59671c13a20b696b7f46e38406a36aeec0; exit 0, verdict pass, no introduced issue. |
| evidence-gate.json, provenance-2.json | Unchanged RED record CLI and SAME installed recursive classifier; all six records RED_EVIDENCE_OK; exit 0. |

All build, owner, lint and direct checks passed on their first candidate.
After self-review tightened the persisted-memory observation and names, fresh
final checks repeated on the actual final TypeScript bytes. The first temporary
provenance script had a syntax error; its raw failure is retained as
provenance-1.json/.stderr. Corrected provenance-2 passes; no repository input
changed to resolve it. Earlier passing candidate outputs remain retained too.
No failed check is discarded or relabeled. Selected direct coverage does not
refresh merged all-pair source-map LCOV.

All production bytes remain unchanged, including account source blob
`6e6795bb2720ea38dd46d01393d82692c636de16`. The complete six-record genuine
RED JSON retains blob `849b2e725bc19a4742e962910cce05f804a6a4c1`.
Provenance verifies the exact existing memory cases/assertions, all original
ACCOUNT test cases, every real-anchor case and all other tracked inputs.
Prior TRUST reviews and controls remain historical and unchanged; adapted
owners/helper join the later full ACCOUNT correction inventory.

### Threat mitigations, commit and remaining scope

T-04-09/T-04-21: fresh independent state observations preserve the separate
real disk/error/ownership tests and temporary-path-supplier coverage.
T-04-13: existing account lifecycle and 024/025 regressions remain intact;
shadow agreement remains the next declared task. T-04-14: synthetic identifiers
only, no new logging permission, ordinary secret hooks. T-04-SC: no install.
These are bounded observed checks, not a universal persistence/lifecycle claim.

The atomic commit introducing this appendix and the three test/helper changes
is titled `test: verify consumed account arrival anchor agreement`.
Its exact four paths and actual hash are resolved from that Git object.
Before the first 04-11 commit the authorized gitdir ledger records
gsd-plan-head-before-04-11 as 6072c207706224f93059cfb9ebe1c1e6185c554e.
Exact-file clean SKIP=npm-check pre-commit precedes staging; any formatter or
report change requires repetition. Native pre-step, branch/HEAD/index checks,
authorized linked-index staging and plain foreground commit retain terminal
results. The shared support path selects all 43 pairs in ordinary staged
check:commit; only its terminal output establishes success. No prospective
hook pass, amend, no-verify, rebase, stash or history rewrite is claimed.

Only the anchor portion of original 015 is implemented here. Shadow agreement,
the remaining accepted causes and eventual independent full ACCOUNT correction
remain pending. Original 001/006/007/008/024/025 retain their implementation
dispositions. The 29 original IDs and counter 0 are unchanged. Parent full
npm run check after terminal 04-11 remains required; none runs in this task.
RUN-01 remains Pending. D-03 and historical WINDOWS 46/47 remain unwaived.

## CR-04-ACCOUNT-015B: consumed shadow lifecycle agreement

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_lifecycle/account_015b_shadow_agreement`, on 2026-10-15.
Disposition: **shadow portion implemented; original 015 awaits independent
full ACCOUNT correction**. The anchor portion retains its separate 015A
implementation. All 29 original IDs and correction counter **0** continue.
This appendix preserves the complete initial report and every prior appendix.
It claims no independent closure, correction review or partial clean verdict.

Pre-edit HEAD was `fae2ce4800e256a52e3aa1af7371a255a7db124b`, on
`features/code-review-sweep`, with clean status and empty index. This task
changes exactly four paths: `test/runtime/accountRuntime.test.ts`, new
`test/runtime/accountShadowContract.ts`, `test/cloud/shadow.test.ts`, and
this report. The pre-code 04-11 declaration at 6072c20 remains the fifth
cause path. No source, compiler configuration, anchor helper/owner, RED
history, shared-state record or other implementation path changes.

### Common contract and real-owner boundary

The new concern helper declares a typed real/ACCOUNT participant inventory.
Both owners use fresh participants for the same three scenarios and invoke
the SAME pure assertion function after completing actions and capture.
Whole independently literal observations include connection state, complete
notification history, opened connections and close effects at each checkpoint:

- Construction is inert; normal start resolves while readiness remains false.
- Readiness reports connected once; repeated close ends ownership once.
- Closing during pending readiness suppresses its late connected notification.
- Closing before start prevents a later start from opening a connection.

The real participant runs `createShadowClient` over an injected offline
`MqttTransport`. Its connect callback starts the actual subscription path.
Separate public subscription and get-publish promises control readiness.
A real-owner case independently captures false readiness after subscription
completion while get-publish remains pending, then true readiness after that
request completes. Existing subscription-refusal, transport-error, reconnect,
replaced-connection, routing, shutdown and credential-owner cases remain intact.

The ACCOUNT `fakeShadow` keeps its exact private name, full signature and
recorder shape. Its ordinary start resolves before readiness on a later
event-loop turn. A close flag prevents that late completion from becoming
live, and a memoized close preserves the consumed once-only ending behavior.
The optional `whileStarting` remains the intentional pending-start factory
seam for existing shutdown/halt cases. It is not repurposed as a simulated
subscription or get request. Every original ACCOUNT case, including all 015A
anchor checks, original 024/025 regressions and pending-start shutdown cases,
remains byte-identical. Their unchanged assertions pass with the new body.

Each owner uses exact-parameter strong mocks for its promised connected
callback and forbidden disconnection, verified in the owning case after
state assertions. A private deliberately broken participant permits opening
after close. The SAME pure contract assertion rejects it. An independently
written expected error checks AssertionError identity, ERR_ASSERTION, full
actual/expected checkpoint arrays and deepStrictEqual operator. This is a
contract negative control, not genuine production RED or a source mutation.

The common contract establishes only the consumed lifecycle facts above.
The ACCOUNT participant implements no transport protocol, broker operation,
subscription validation, message parsing or network failure. It supplies no
full network equivalence or universal external transport teardown claim.
Replacement-connection and real protocol/error promises stay in the real
owner. Missing values, mutable aliases, value overwrite, deletion and input
validation do not apply to this lifecycle-only contract. Both complete
adapted owners and the complete new helper join later full ACCOUNT correction;
earlier TRUST/cloud review judgments remain historical.

### Complete reads, verification location and native evidence

Before edits, complete AGENTS, all five complete books, 04-11, amended 04-07,
the newest complete review protocol and this entire report were read.
All four read_first files were read completely: shadow and account source,
and both complete owners. Actual callers were traced from harness and wired
composition to fakeShadow, and from refresh/openShadow/attemptShadow to
start, post-await close, terminal halt and explicit stop. The real start,
connect, requestEveryShadow, current-connection guard and close were traced.
No existing shared/exported/private signature, name, visibility or alias is
changed or deleted. The private impact limitations and narrow inventory
exception remain unchanged; no neighboring trace supplies extra permission.

The new helper and both complete owner headers were inspected independently:
SPDX MIT first, separate 2026 copyright JSDoc, separate purpose overview,
then imports. New helper exports have purpose JSDoc, and .js ESM imports and
the compiled owner layout remain intact. No new package or production hook
is introduced. Implementation review is not independent correction.

All checks ran in the existing linked feature checkout with
`workflow.use_worktrees=false`; no additional checkout, branch or recovery
sentinel was created. Versions: Node v26.11.1, npm 11.20.0, TypeScript 6.0.3,
Fallow 3.27.0. Native directory: `/private/tmp/guardian-04-account-015b/`.
Every command record retains exact executable/argv, cwd, HEAD, versions,
UTC start/end, complete separate stdout/stderr and raw child exit.
before.json saves the initial exact tracked hashes and clean diff/index.
provenance.json retains the full dirty diff, new helper bytes, compiled
hashes, blobs, source/history preservation and recursive classifications.

| Native record | Actual scope and raw result |
| --- | --- |
| snapshot.json, guard.json | Clean initial state and exact four-path pre-edit Fallow guard; exit 0. No boundary zones/rule packs configured. |
| callers.json | Actual lexical shadow/start/close callers before edits; exit 0. |
| build-final.json | Fresh npm run build:test; exit 0, 2026-10-15T13:01:26.621Z–13:01:30.084Z. |
| owners-final.json | Both complete compiled owners; exit 0, 210 pass, zero fail/cancel/skip/todo. |
| direct-account.json, direct-shadow.json | Each exact npm run test:coverage:direct source/owner pair with fresh build; exit 0. |
| coverage-account.json | Isolated exact-source native thresholds; exit 0, 151 pass, 994/994 lines, 57/57 functions, 181/181 branches. |
| coverage-shadow.json | Isolated exact-source native thresholds; exit 0, 59 pass, 339/339 lines, 30/30 functions, 75/75 branches. |
| lint-final.json | All three changed TypeScript files, no cache, max warnings 0; exit 0. |
| evidence-gate.json, provenance-1.json | Unchanged RED CLI and SAME installed recursive classifier; all six records RED_EVIDENCE_OK; exit 0. |
| audit.json | Fallow audit against e6f49a59671c13a20b696b7f46e38406a36aeec0; exit 0, verdict pass, zero introduced issues. |
| pre-step-1.json | Exact four-file SKIP=npm-check pre-commit; exit 0, clean, no formatter changes. Repeated after this report update before staging. |

The first build and owners passed. The first lint attempt found one import
group and two void-expression shorthand errors in the new code; its complete
failure remains lint-1.json/.stdout/.stderr. They were corrected before the
final build, owners, direct coverage and lint. No failed attempt is discarded
or relabeled. Selected direct runs do not refresh merged all-pair LCOV.

The first temporary pre-stage assertion script trimmed Git's leading status
space before extracting paths, losing the leading dot of .planning. Its raw
failure remains assert-before-stage.json/.stderr. Branch, HEAD and empty-index
checks had passed; the corrected exact-path check uses Git's path output
without status-column parsing. Staging contains only the four authorized
paths. No executable input changed to correct this evidence script.

All production bytes remain unchanged, including account blob
`6e6795bb2720ea38dd46d01393d82692c636de16` and shadow blob
`018f49c720f0119fb131b4f03dfbc3966a98dadc`.
The complete six-record genuine RED JSON retains blob
`849b2e725bc19a4742e962910cce05f804a6a4c1`.
Provenance checks every other tracked input, prior report bytes, the exact
private signature/recorder and all original cases in both owners.

### Threat mitigations, atomic commit and remaining scope

T-04-13: fresh whole lifecycle observations distinguish start from readiness
and suppress late readiness after close; existing ownership cases stay active.
T-04-14: synthetic data only, ordinary secret hooks, no new logging permission.
T-04-SC: no install. No production surface or broader lifecycle policy changes.

The atomic commit introducing this appendix and three test/helper changes is
titled `test: verify consumed account shadow lifecycle agreement`.
Resolve its actual hash and exact four paths from Git. Exact clean
`SKIP=npm-check pre-commit run --files` precedes staging; report or formatter
changes require repetition. Native pre-step, branch/HEAD/index assertions,
authorized linked-index staging and plain foreground normal commit records
retain the terminal results. Shared support selects all 43 pairs in ordinary
check:commit. Only the actual terminal hook result establishes success.
No hook bypass, amend, stash, rebase or history rewrite is authorized.

Original 015's anchor and shadow portions are implemented pending full ACCOUNT
correction after all owning causes. Other initial findings retain their prior
dispositions; the 29 original IDs and counter 0 remain. The parent owns full
npm run check after terminal 04-11 and after completed 04-07; no full gate runs
in this task. RUN-01 remains Pending. D-03 and WINDOWS 46/47 remain unwaived.

## CR-04-ACCOUNT-002: scoped identifier permission and unconfirmed premise

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_lifecycle/account_002_privacy_comments`, on 2026-10-15.
Disposition: **implemented; pending independent full ACCOUNT correction**.
The complete initial report and every prior appendix remain intact.
The original 29 stable IDs and correction counter **0** continue.
This repair supplies no correction round or partial clean verdict.

The source comment at `src/runtime/accountRuntime.ts:81` and owner comment at
`test/runtime/accountRuntime.test.ts:2881` state the existing local permission.
It covers runtime logs, accessory context and persisted arrival anchors.
Both comments explicitly retain the unconfirmed opaque-account-key premise.
Both require placeholders in public and planning artifacts.
Per-device identifiers, all log strings and persistence behavior remain unchanged.
No identifier removal, migration, additional permission or privacy guarantee follows.

The canonical evidence is `.planning/STATE.md:231–233`, including its explicit
unconfirmed premise, and the later retained-log ruling at lines 313–318.
`.planning/intel/decisions.md:83–92` (C-002) identifies account-plus-serial composition.
D-027 at lines 614–630 requires sanitized public and committed planning artifacts.
`.planning/intel/constraints.md:195–204` describes the composition and scoped permission.
History `b868f4e9435f75706e70c0b489b08ed115dc6d3b` introduced the account-aware
wording and the unsupported person/route guarantees. Its full two-file diff
is retained in `history.json/.stdout/.stderr` below. The repair retains
account-aware wording and the scoped permission without those guarantees.
The applicable rules are D-05/D-06 privacy preservation and
`typescript-comments` factual what/why prose. Original S-04-08 retains its disposition.

Pre-edit HEAD was `09facce8d9c17a6bc7368fa09854ecd32d3aaff0`, on
`features/code-review-sweep`, with clean status and empty index.
The fixer read complete AGENTS, all five complete project books, amended 04-07,
04-11-SUMMARY, the newest full protocol and this full report before editing.
The complete 1327-line source and 3999-line owner were read, including headers.
The reporting-kind calls from monitoring-health reporting and removal cleanup
were traced in the complete source. No function, signature, export, alias,
field or visibility changes, so contract-change impact queries are not triggered.
The pre-edit guard covered all three owned paths before any repository edit.

### Verification location and native evidence

All commands ran in the existing linked feature checkout with
`workflow.use_worktrees=false`. No additional worktree or branch was created.
Versions: Node v26.11.1, npm 11.20.0, TypeScript 6.0.3 and Fallow 3.27.0.
Native directory: `/private/tmp/guardian-04-account-002/`.
Every command record retains exact argv, cwd, HEAD, versions, input blobs,
UTC start/end, raw child exit and full separate stdout/stderr.
`before.json` retains the empty initial diff/index/untracked set and 694 tracked inputs.
Saved complete source, owner and report bytes support exact comparison.

| Native record | Actual scope and raw result |
| --- | --- |
| guard.json | Exact three-path pre-edit Fallow guard; exit 0, no configured boundary zones or rule packs. |
| build.json | Fresh `npm run build:test`; exit 0, 13:18:12.625–13:18:16.137 UTC. |
| owner.json | `node --test --test-reporter=tap dist-test/test/runtime/accountRuntime.test.js`; exit 0, 151 pass, zero fail/cancel/skip/todo. |
| direct.json | `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts`; exit 0, exact isolated selector including fresh build. |
| native-coverage.json | Full owner, exact-source include, all three 100% thresholds; exit 0, 151 pass. Native compiled coverage: 993/993 lines, 57/57 functions, 181/181 branches. |
| lint.json | Exact two TypeScript files, no cache, max warnings 0; exit 0. |
| audit.json | Fallow audit against original ACCOUNT base e6f49a59671c13a20b696b7f46e38406a36aeec0; exit 0, pass. |
| pre-step-1.json | Required exact three-file SKIP=npm-check pre-commit; exit 0, clean with no formatter changes, 13:19:43.712–13:19:47.186 UTC. Repeated after this report update before staging. |

`provenance.json` retains the complete dirty diff and before/after blobs.
It compares every non-comment source and owner line byte for byte.
All executable statements, test titles and assertions remain unchanged.
It also verifies every unrelated tracked input and the complete earlier report prefix.
The RED file retains blob `849b2e725bc19a4742e962910cce05f804a6a4c1` and
all six records. Existing adapter contracts, negative controls and original
024/025 regressions remain unchanged. This documentation repair adds no bug,
regression, control, helper, configuration, package, shared record or runtime behavior.
Selected coverage does not refresh merged all-pair source-map LCOV.
No full `npm run check` ran here. The parent owns the combined gate after 04-07.

### Atomic commit and remaining scope

The commit introducing this appendix and both comment edits is titled
`fix: qualify scoped device identifier privacy comments`.
It contains exactly the source, mirrored owner and this report.
Exact clean `SKIP=npm-check pre-commit run --files` precedes staging.
Report or formatter changes require another clean pre-step before staging.
Native pre-step, branch/HEAD/index assertions, authorized linked-index staging
and ordinary foreground commit records retain their actual terminal results.
The returned actual Git hash and paths establish the committed result.
No hook bypass, amend, stash, rebase or history rewrite is authorized.

Only original 002 is implemented here. Original 003, 012, 013, 027 and 028
remain for 04-07, with later owning causes and full ACCOUNT correction still pending.
RUN-01 remains Pending. D-03 stays in force.
WINDOWS 46/47/48 remain OPEN and unwaived.

## CR-04-ACCOUNT-003: current lifecycle and factory boundaries

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_lifecycle/account_003_lifecycle_comments`, on 2026-10-15.
Disposition: **implemented; pending independent full ACCOUNT correction**.
The complete initial report and every earlier appendix remain intact.
The original 29 stable IDs and correction counter **0** continue.
This repair supplies no correction round or partial clean verdict.

The `createAccountRuntime` JSDoc at `src/runtime/accountRuntime.ts:327`
describes the root signal's shutdown cancellation of runtime waits and requests.
It separately describes explicit closure of the recorded shadow client.
It also identifies the post-start ownership check that closes a client whose
start resolves after shutdown or terminal authentication halt.
The factory remains inert until start; no universal transport teardown is claimed.
The harness comment at `test/runtime/accountRuntime.test.ts:557` identifies
the scripted throw as the deliberate runtime factory-error path.
It states that the real factory is inert, start opens the transport, and
broker failures arrive through connection callbacks.
The scripted error text, factory body and every other executable statement stay unchanged.

These statements follow the actual current source boundaries:
runtime `waitFor` passes `root.signal` to its bounded waits;
inventory, credential and command requests receive the same root signal;
`stop` aborts the root and awaits `closeQuietly(shadow)`;
`attemptShadow` awaits start, checks `hasFinished`, and closes an unrecorded late client.
Terminal authentication halt retains its distinct explicit-close behavior.
In `src/cloud/shadow.ts`, construction initializes closures and returns methods.
Its `start` calls `openConnection`, which constructs the transport and attaches
connect/error/close callbacks. Those callbacks classify broker/transport failures.
Its `close` sets closing before memoizing the transport ending.
The applicable rules are style Comments and documentation, comments policy
factual what/why, and D-05 bounded lifecycle preservation.
No API, signature, alias, field, visibility, private contract or policy changes.

Pre-edit HEAD was `3d193f1333c6039e68cd539df133ac6e88da2507` on
`features/code-review-sweep`, with clean status and empty index.
Before editing, the fixer read complete AGENTS and all five complete project books,
the amended 04-07 plan, 04-11-SUMMARY, newest protocol and this full report.
No 04-07-SUMMARY exists yet; the amended plan supplies the current owning scope.
The complete 1326-line account source, 4000-line owner and real shadow source were read.
Actual composition/start/stop callers in platform and both Worlds were inspected.
The exact three-path Fallow guard ran before any repository edit.
Contract-change impact queries are not triggered by these two comment edits.
Original 004's historical narration and all other causes remain outside this repair.

### Verification location and native evidence

All checks ran in the existing linked feature checkout with
`workflow.use_worktrees=false`. No checkout, branch or recovery sentinel was created.
Versions: Node v26.11.1, npm 11.20.0, TypeScript 6.0.3 and Fallow 3.27.0.
Native directory: `/private/tmp/guardian-04-account-003/`.
Every check retains exact executable/argv, cwd, pre-command HEAD, versions,
input blobs, UTC start/end, raw child exit and complete separate stdout/stderr.
`before.json` saves 694 tracked input identities, empty diff/index/untracked set,
and complete source/owner/report before bytes for exact comparison.

| Native record | Actual scope and raw result |
| --- | --- |
| guard.json | Exact three authorized paths before edits; exit 0, no configured boundary zones or rule packs. |
| build.json | Fresh `npm run build:test`; exit 0, 13:24:29.026–13:24:31.927 UTC. |
| owner.json | Full compiled owner with native TAP; exit 0, 151 pass, zero fail/cancel/skip/todo. |
| direct.json | Exact isolated source/owner selector with fresh build; exit 0. |
| native-coverage.json | Complete owner, exact-source include, all three 100% thresholds; exit 0, 995/995 native compiled lines, 57/57 functions, 181/181 branches. Full argv and LCOV retained. |
| lint.json | Exact two TypeScript files, no cache, max warnings 0; exit 0. |
| statements-and-history-2.json | TypeScript parser/printer comparison with comments removed and emitted JavaScript byte comparison; exit 0. SAME installed recursive classifier accepts all six RED records. |
| evidence-gate.json | Installed CLI on unchanged on-disk genuine RED JSON; exit 0, RED_EVIDENCE_OK. |
| audit.json | Recorded initial ACCOUNT base e6f49a59671c13a20b696b7f46e38406a36aeec0; exit 0, verdict pass. |
| pre-step-1.json | Required exact three-file SKIP=npm-check pre-commit; exit 0, clean with no formatter changes, 13:26:33.654–13:26:36.239 UTC. Repeated after this report update before staging. |

Source blob changes only its JSDoc, from
`09b5896c610d0a7d6e5b5937ef867c04498fc6a5` to
`641f40950d20e1fbfbc7de6dd1200e867c67ecb0`.
Owner blob changes only its factory comment, from
`b89564d8e7c5fc7e569eec160360617023c32d91` to
`19e804d678d2058bd1a70aab445e84d88cc366e7`.
`provenance.json` retains the complete dirty diff and verifies the prior report
prefix and every unrelated tracked input against the initial manifest.

The first statements-and-history attempt exits 1 and remains retained in full.
Its standalone scanner did not re-scan template contexts, so it treated JSDoc
text containing backticks as tokens. No repository input changed to correct it.
The corrected comparison uses the installed TypeScript parser and printer,
then independently compares comment-free emitted JavaScript byte for byte.
Both source and owner pass those comparisons; every title, assertion,
adapter contract, pure assertion and negative control remains unchanged.
Original 024/025 regressions remain intact. The entire six-record RED JSON
retains blob `849b2e725bc19a4742e962910cce05f804a6a4c1`.
This documentation cause adds no bug, regression, mutation control, helper,
configuration, package or shared record. Selected direct coverage does not
refresh merged all-pair source-map LCOV. The parent owns the full combined
gate after completed 04-07; no full `npm run check` runs in this task.

### Atomic commit and remaining scope

The commit introducing this appendix and both comment edits is titled
`fix: describe account lifecycle cancellation boundaries`.
It contains exactly the source, mirrored owner and this report.
Exact clean `SKIP=npm-check pre-commit run --files` precedes staging.
Report or formatter changes require another clean pre-step before staging.
Native pre-step, branch/HEAD/index checks, authorized linked-index staging
and plain foreground normal commit records retain terminal results.
The returned actual Git hash and paths establish the committed result.
No hook bypass, amend, stash, rebase or history rewrite is authorized.

Only original 003 is implemented here. Original 012, 013, 027 and 028 remain
for 04-07, with later owning causes and full ACCOUNT correction still pending.
Original 015 retains both implementations and the parent's passing combined gate.
The 29 stable IDs and counter 0 remain; RUN-01 remains Pending.
D-03 stays in force. WINDOWS 46/47/48 remain OPEN and unwaived.

## CR-04-ACCOUNT-027: observable forbidden command attempts

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_lifecycle/account_027_forbidden_commands`, on 2026-10-15.
Disposition: **implemented; pending independent full ACCOUNT correction**.
The complete initial report and every prior appendix remain intact.
The original 29 stable IDs and correction counter **0** continue.
This assertion-maintenance repair supplies no correction round or partial clean verdict.

The harness records every `sendCommand` attempt before testing for a scripted answer.
An unscripted rejection therefore remains observable when `commands.send` catches it.
Each of 114 authored noncommand harness cases ends with
`assert.deepStrictEqual(commandRequests, [])`, after its existing assertions.
Generated rows expand those declarations to 119 executed absence checks.
These cover startup, restore, polling, rotation, shadow callbacks, terminal halt,
shutdown, silence recovery and removal. The check compares the whole attempt set.
No verification is hidden in a hook, cleanup function or callback.
The existing record includes device identity, complete desired data and initial signal state.

The original 025 timing regression uses the harness but remains byte-identical.
Its named promise concerns timer representability and the refresh deadline.
It does not acquire a separate command-absence promise in this repair.
The original self-contained 024 regression also remains byte-identical.
All eight command cases retain their exact bodies, including their request and
multiplicity expectations. All 015 contracts and negative controls remain unchanged.
This does not claim that every original owner case asserts command absence.
Original 012 logger-boundary and 013 strict-mock conformance remain separate pending causes.

Pre-edit HEAD was `128c005b91b653815d46ea8dbe3119bebf9dc06d`, on
`features/code-review-sweep`, with clean status and empty index.
Before editing, the fixer read complete AGENTS and all five complete project books,
amended 04-07, 04-11-SUMMARY, newest protocol, this full report, the complete
1328-line account source and 4000-line owner, including both full headers.
Actual callers were traced through every harness case and both public factories,
launch/poll/rotation/shadow/removal/stop, command-body lookup and caught dispatch,
plus platform and both World composition callers.
The exact three-path Fallow guard ran before repository edits.
No existing private, shared or exported name, signature, field, alias, visibility
or mutability changes; contract-change impact queries are not triggered.

### Separate assertion maintenance control

The plausible wrong behavior automatically sends a self-test for each device
during launch, awaits `commands.send`, and discards its refused outcome.
The command API catches the harness rejection and returns a vendor-error refusal.
Canonical discovery and monitoring state can therefore remain correct.
Compilation and direct coverage cannot establish the required absence of dispatch.

The temporary source mutation adds only that loop immediately before launch
records poll success. Fresh compilation exits 0. The exact named target is
`^start discovers every device and stores its canonical snapshot$`.
Its independent complete canonical snapshot assertion passes first.
The new empty-attempt assertion then fails with native `ERR_ASSERTION` and
`deepStrictEqual`: actual is one attempt with placeholder device
`account-1_serial-1`, desired data `{ test_running: true }` and `aborted: false`;
expected is `[]`. Native TAP records one executed test, one failure and
zero skips, cancellations or todos. The failure is neither a thrown strict-mock
error nor a setup/import/compilation failure. It proves the caught-refusal hole
is detected by an explicit owning-case assertion.

The complete production file was restored byte for byte and compared with its
saved bytes and Git diff. Source before/restored blob:
`641f40950d20e1fbfbc7de6dd1200e867c67ecb0`.
Temporary control blob: `70e65211f7cdcc0e2edfe85cb2b4356e377fde35`.
The fresh restored build and exact target both exit 0.
Final owner blob: `d46e162b12b40fde6d5deecef650425a14e61905`.
No control mutation enters Git or the genuine RED history.

### Verification location and retained native evidence

All checks ran serially in the existing linked feature checkout with
`workflow.use_worktrees=false`. No worktree, branch or recovery sentinel was created.
Versions: Node v26.11.1, npm 11.20.0, TypeScript 6.0.3 and Fallow 3.27.0.
Native directory: `/private/tmp/guardian-04-account-027/`.
Each check retains exact executable/argv, cwd, HEAD, input blobs, versions,
UTC start/end, raw child exit and complete separate stdout/stderr.
Saved before/control/restored source identities, compiled control bytes, complete
patch, case inventory and provenance support exact comparison.

| Native record | Actual scope and raw result |
| --- | --- |
| guard.json | Exact three owned paths before edits; exit 0, no configured zones or rule packs. |
| baseline-build.json, baseline-target.json | Fresh compilation and strengthened startup target; both exit 0. |
| control-build.json, control-target.json | Fresh temporary-source build 0; intended named assertion failure 1, 13:33:39.365–13:33:39.846 UTC. |
| restoration.json, restored-build.json, restored-target.json | Exact complete source restoration, fresh build and named GREEN; all exit 0. |
| build-final.json | Fresh `npm run build:test`; exit 0, 13:36:57.144–13:37:00.223 UTC. |
| owner-final.json | `node --test --test-reporter=tap dist-test/test/runtime/accountRuntime.test.js`; exit 0, 151 pass, zero fail/cancel/skip/todo. |
| direct-final.json | `npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts`; exit 0, exact isolated selector including fresh build. |
| native-coverage-final.json | Full compiled owner, exact-source include and all three 100% thresholds; exit 0. Native lines 995/995, functions 57/57, branches 181/181; full argv and LCOV retained. |
| lint-final-2.json | Exact source/owner ESLint, max warnings 0, no cache; exit 0. |
| evidence-gate.json, provenance-3.json | Unchanged on-disk genuine RED CLI and SAME installed recursive classifier; all six records RED_EVIDENCE_OK, exit 0. |
| audit.json | Fallow audit against original base e6f49a59671c13a20b696b7f46e38406a36aeec0, JSON/quiet/explain; exit 0, verdict pass. |
| pre-step-1.json | Exact two final paths with required SKIP=npm-check pre-commit; exit 0, clean, 13:37:38.048–13:37:40.954 UTC. Repeated after this report update before staging. |

The first temporary provenance comparison retained formatting hints in the
TypeScript printer, so it rejected a harmless formatter-expanded argument object.
Its complete failure remains in provenance-1.json and separate native streams.
The corrected comparison checks the parsed AST after removing only each added
binding and final empty-attempt assertion; every original test operation and
assertion remains intact. It separately compares unmodified cases byte for byte,
all 27 private function signatures, every interface shape and all unrelated inputs.
The earlier patch-generation attempts failed before repository changes; their
terminal tool output is retained. No build, owner, coverage or lint failure is concealed.

The full source has no final diff. All other production, helper and contract bytes
remain unchanged. The six-record genuine RED file retains blob
`849b2e725bc19a4742e962910cce05f804a6a4c1`, including every archived stream.
Selected direct checks do not refresh merged all-pair source-mapped LCOV.
The parent owns the full combined gate after completed 04-07;
no full `npm run check` runs in this task.

### Atomic commit and remaining scope

The atomic commit introducing this appendix and the owner repair is titled
`test: detect forbidden monitoring command attempts`.
It contains only `test/runtime/accountRuntime.test.ts` and this report.
The production path is owned only for the restored temporary control, so the
cause uses exactly its three declared paths and adds no repository helper.
Exact clean pre-commit runs again after this report update before staging.
Native branch/HEAD/index checks, authorized linked-index staging and plain
foreground normal commit records retain the terminal results and actual hash.
No hook bypass, amend, stash, rebase or history rewrite is authorized.

Only original 027 is implemented here. Original 012, 013 and 028 remain for
04-07, with later owning causes and independent full ACCOUNT correction pending.
The 29 stable IDs and counter 0 continue; RUN-01 remains Pending.
D-03 stays in force. WINDOWS 46/47/48 remain OPEN and unwaived.

## CR-04-ACCOUNT-028: credential registration before downstream use

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_lifecycle/account_028_registration_order`, on 2026-10-15.
Disposition: **implemented; pending independent full ACCOUNT correction**.
The complete initial report and every previous appendix remain intact.
The original 29 stable IDs and correction counter **0** continue.
This assertion-maintenance repair supplies no correction round or partial clean verdict.

Two fresh public-factory cases add independent whole chronological observations.
The runtime case registers all three initial AWS values under their exact roles
before the shadow factory reads the complete credential object.
At the next rotation it registers all three replacement values under the same roles.
The original held cache then supplies the complete replacement object for the next handshake.
The shadow start and close each have one exact strong-mock expectation.
A strict command port with no allowed call protects the new monitoring case.
The composition case observes the real auth/REST/shadow wiring through injected boundaries.
It expects token registration with no role before the first authenticated HTTP request.
It also expects all three AWS-role registrations before the first MQTT connection attempt.
The offline broker deliberately refuses that attempt; its public path remains poll-only.
This case does not claim a successful signed handshake or broker subscription.

Both cases compare complete independently literal canonical state before interaction checks.
ACT completes every operation and captures each chronological observation before ASSERT.
ASSERT compares each entire timeline against an independent literal and explicitly verifies every mock.
All mocks use exactParams and exact registration/lifecycle arguments with definite counts.
Logging is silent in both new cases; no logger output is asserted.
Existing registration checks remain byte-identical, including the separate logger-output case.
That logger-boundary cause remains original 012; this repair does not claim its correction.

Pre-edit HEAD was `d6e4ee6e2cab5e62cba4396e5e0f2424b920f185` on
`features/code-review-sweep`, with clean status and empty index.
The fixer read complete AGENTS and all five complete project books, amended 04-07,
04-11-SUMMARY, the newest protocol, this full report and the complete current pair.
The source had 1328 lines; the owner had 4114 lines before this repair.
No 04-07-SUMMARY exists yet; the amended plan supplies the current owning scope.
Actual auth, REST, shadow, MQTT and logging contracts were read before editing.
Callers were traced from platform and both Worlds through composition, token registration,
HTTP authorization, credential refresh, cache creation/replacement and shadow start.
The exact three-path Fallow guard ran before repository edits and again before this appendix.
No existing name, signature, export, alias, field, visibility or mutability changes.
D-06 contract-change impact queries are not triggered; no private-trace exception is inferred.

### Separate assertion maintenance control

The plausible wrong behavior moves all three AWS registrations after shadow creation/start.
Registration values and final canonical/cache state remain correct, so separate unordered arrays,
compilation and direct coverage can accept that behavior.
The temporary source moves only the three registration calls below cache creation/replacement
and awaited openShadow, before the existing rotation-success notification.
After a fresh successful build, the exact named target fails its intended whole-order assertion:
`^registers every AWS role before shadow use and replaces the next handshake credentials in place$`.
Public canonical, replacement-cache and stopped-path assertions pass first.
Native ERR_ASSERTION/deepStrictEqual reports shadow credentials as the first actual event,
where the independently expected first three events are the three role registrations.
The final control executes one test, one intended failure and zero skip/cancel/todo.
It is neither a setup/import/compilation failure nor genuine production RED.

The control ran again after the new expectation callbacks received lint-required braces
and the runtime case moved outside the existing internal describe group.
Both complete attempts remain retained. The final control uses the final owner bytes.
The source was restored through Git after each attempt and compared byte for byte.
Source before/restored blob: `641f40950d20e1fbfbc7de6dd1200e867c67ecb0`.
Temporary control blob: `6a9e6e2d258de2071c795129978f843ca341bd4b`.
Final owner blob: `6ad279d247668060a44390199608d1a723125730`.
The fresh restored build and full owner pass; no control mutation enters Git.

### Verification location and retained native evidence

All builds, owner runs, coverage and source controls ran serially in the existing linked checkout.
`workflow.use_worktrees=false`; no worktree, branch or recovery sentinel was created.
Independent read-only lint, audit and provenance checks could overlap.
Versions: Node v26.11.1, npm 11.20.0, TypeScript 6.0.3 and Fallow 3.27.0.
Native directory: `/private/tmp/guardian-04-account-028/`.
Each command retains exact executable/argv, cwd, HEAD, input blobs, versions,
UTC start/end, raw exit and complete separate stdout/stderr.
Saved complete before/control/restored identities, compiled control bytes and patches
support independent source restoration and final-input comparison.

| Native record | Actual scope and raw result |
| --- | --- |
| guard.json, report-guard.json | Exact three owned paths before edits; exit 0, no configured boundary zones or rule packs. |
| baseline-build.json, baseline-target.json | Fresh build and both new cases; both exit 0. |
| control-build.json, control-target.json | Initial temporary build 0; named intended order-assertion failure 1. |
| restoration.json, restored-build.json, restored-target.json | Exact first restoration, fresh build and both named targets; all exit 0. |
| final-control-build.json, final-control-target.json | Final-owner temporary build 0; exact named intended assertion failure 1, 13:48:59.220–13:48:59.805 UTC. |
| final-restoration.json, build-final.json | Exact second restoration and fresh build; both exit 0, build 13:49:11.198–13:49:14.760 UTC. |
| owner-final.json | Full compiled owner with TAP; exit 0, 153 pass, zero fail/cancel/skip/todo. |
| direct-final.json | Exact isolated source/owner selector including fresh build; exit 0. |
| native-coverage-final.json | Full owner, exact-source include and all three 100% thresholds; exit 0. Native compiled lines 995/995, functions 57/57, branches 181/181. |
| lint-final-2.json | Exact source/owner ESLint, max warnings 0, no cache; exit 0. |
| audit.json | Original base e6f49a59671c13a20b696b7f46e38406a36aeec0, JSON/quiet/explain; exit 0, verdict pass. |
| evidence-gate.json, provenance-1.json | Unchanged on-disk genuine RED CLI and SAME installed recursive classifier; all six records RED_EVIDENCE_OK, exit 0. |
| pre-step-1.json | Required exact two-path SKIP=npm-check pre-commit; exit 0, clean, 13:51:04.545–13:51:07.736 UTC. Repeated after this report update before staging. |

The first lint attempt found ten void-expression shorthand errors in the new expectations.
Explicit callback bodies resolved them; the full failed streams remain in lint.json.
No other build, owner or coverage attempt failed outside the deliberate controls.
Provenance preserves all 136 existing authored test calls byte for byte,
including generated rows, original 024/025 regressions, every 015 contract/negative control
and all 027 absence assertions. It also preserves all 33 existing function/interface declarations.
Every other tracked path retains its initial blob; the full source has no final diff.
The complete six-record genuine RED file retains blob
`849b2e725bc19a4742e962910cce05f804a6a4c1`, with every archived stream unchanged.
Selected coverage does not refresh merged all-pair source-mapped LCOV.
No helper, API, configuration, dependency, shared record, live input or product policy changes.

### Atomic commit and remaining scope

The atomic commit introducing this appendix and the two new owner cases is titled
`test: verify credential registration before downstream use`.
Its final paths are only `test/runtime/accountRuntime.test.ts` and this report.
The production path is owned only for the fully restored temporary control.
Exact clean SKIP=npm-check pre-commit precedes staging and repeats after report changes.
Native branch/HEAD/index assertions, authorized linked-index staging and plain foreground
normal commit output retain the actual terminal result and Git hash.
No hook bypass, amend, stash, rebase or history rewrite is used.

Only original 028 is implemented here. Original 012 and 013 remain for 04-07,
with later owning causes and independent full ACCOUNT correction pending.
The parent owns the full combined gate after completed 04-07; none runs in this task.
The 29 stable IDs and counter 0 continue; RUN-01 remains Pending.
D-03 stays in force. WINDOWS 46/47/48 remain OPEN and unwaived.
