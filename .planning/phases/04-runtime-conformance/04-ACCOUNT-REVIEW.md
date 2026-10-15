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
