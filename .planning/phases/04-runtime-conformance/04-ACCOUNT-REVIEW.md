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

## CR-04-ACCOUNT-012: account diagnostic notifications at the injected boundary

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_lifecycle/account_012_failure_boundary`, on 2026-10-15.
Disposition: **implemented; pending independent full ACCOUNT correction**.
The complete initial report and every prior appendix remain intact.
The original 29 stable IDs and correction counter **0** continue.
This boundary repair supplies no correction round or partial clean verdict.

Thirty-two lifecycle, trust and removal cases now inject an exact-parameter
`strong-mock` FailureLog. Each states every allowed success, failure and forget
notification with exact kinds, complete reasons and definite multiplicities.
Each case asserts public runtime state before explicitly verifying its mock.
The aborted-launch case permits no notification at all.
Terminal refusals permit the authentication diagnostic and no polling, rotation
or shadow failure. Ordinary closes permit no failure; actual shadow errors do.
Repeated refreshes, silent polls and refused removals each notify the boundary
on every occurrence. Distinct live-reporting and removal kinds retain both
device identities. No logger output, severity, reminder count or redactor
result is asserted by the account owner.

State observations retain the existing path transitions, exact retry/close
multiplicity, removal identities and no-extra-report promises. Converted silence
cases assert complete keyed trust values. The refused-removal case independently
expects its complete retained snapshot and exact anchor set before another retry.
The removed-device case independently expects absence at removal and a complete
freshly admitted snapshot and anchor after return. It also compares the entire
13-event diagnostic timeline before final mock verification, including both
device-scoped forgets before the returning device's success notification.
This preserves the account's responsibility for departure versus recovery.
The failure-log owner's success/forget distinction supplies the output policy.

The incidental composition redaction case now checks public registration through
an exact mock: bearer token without a role, plus all three AWS values under
their exact roles. Its complete discovered snapshot and stopped path are asserted
first. Both original 028 registration-before-use cases remain byte-identical,
including their independently expected chronological streams.
Redaction, reminder cadence, severity selection and recovery formatting remain
in `test/logging.test.ts` and `test/runtime/failureLog.test.ts`.
Those owners were read; neither is changed or newly certified here.

All account logging uses a silent typed stub. Cases with no diagnostic promise
use a plain silent FailureLog stub. The local harness accepts an optional third
FailureLog argument; existing two-argument calls remain compatible.
`Harness.logged` retains its existing type/member shape as an empty compatibility
array. It is not populated or asserted and supplies no logging evidence.
`fakeShadow`, `recordingAnchors`, all existing private interfaces and their fields
remain unchanged apart from that explanatory comment.

### Local orphan cleanup and actual rule applicability

Pre-edit HEAD was `d4c8e5bd13d25772a8053989518ee0955a133163`, on
`features/code-review-sweep`, with clean status and empty index.
Before edits, the fixer read complete AGENTS and all five complete project books,
amended 04-07, full 04-11-SUMMARY, newest protocol, this entire report,
the complete 1328-line source and 4356-line owner, including full headers.
Actual callers were traced through the local harness, both factories,
poll/rotation/terminal/shadow/removal paths, platform and both World compositions.
The complete failure-log source/owner and logging source/owner were read.
The exact three-path Fallow guard passed before repository edits.

Fresh exact queries for recordingLog, countOf, countOfLine, recoveriesIn,
liveReportingRecoveredLine and Harness.logged ran separately in both compiler
projects. All twelve returned raw exit **2**, unavailable/not-found, without a
complete selected-project result. They remain retained under
`/private/tmp/guardian-04-account-012-pretrace/`; none is deletion permission.
The installed help and lexical consumers were also inspected.

The protocol's exact private-alias/member deletion restriction does not cover
local nonexported function declarations. AGENTS requires removing functions,
imports and variables this change orphans. Applying that actual scope removes
only the five logger-only local functions above, the unused discovery-output
constant and imports. The local endToEndRuntime helper loses its newly unused
logger-array parameter; its sole lexical caller stops passing an empty array.
No private alias/member is deleted, and no shared/exported contract, API,
configuration or visibility changes. This is rule applicability, not a waiver
or a complete private-symbol trace. No artificial calls, test-only exports,
suppression or generic helper directory is introduced.

### Separate assertion maintenance control

The plausible wrong behavior omits the live-reporting forget when a device
leaves the account. Canonical removal, anchor pruning and later admission still
succeed, while the failure-log boundary retains the previous device's cause.
Compilation and direct coverage cannot establish the missing notification.

The temporary source edit deletes only
`options.failures.forget(liveReportingKind(deviceId))` from successful removal.
Fresh compilation exits 0. The exact target is
`^DEV-05 removal reconciliation forgets both reporting kinds when a removed device returns as a new admission$`.
Public removal, fresh canonical snapshot, exact anchor and empty command-attempt
assertions pass first. The independent whole notification stream then fails
with native ERR_ASSERTION/deepStrictEqual: its actual stream omits exactly
`['forget', 'Live device reporting for account-1_serial-1']`.
One test executes and fails, with zero skip/cancel/todo.
This is the intended owning assertion, not setup, compilation or mock-dispatch
failure, and not genuine production RED.

The source was restored through Git and compared byte for byte with saved bytes.
Source before/restored blob: `641f40950d20e1fbfbc7de6dd1200e867c67ecb0`.
Temporary control blob: `2ee564f6e4da9fe513259f5eda35987bf6fb4c13`.
A fresh restored build and the exact named target both exit 0.
The final owner blob is `02d887c020d72e9c61f6c73036b0192580bee2c9`.
No control mutation enters Git or the genuine RED history.

### Verification location and retained native evidence

All builds, owners, direct checks and source controls ran serially in the existing
linked feature checkout with `workflow.use_worktrees=false`.
No worktree, branch or recovery sentinel was created.
Versions: Node v26.11.1, npm 11.20.0, TypeScript 6.0.3 and Fallow 3.27.0.
Native directory: `/private/tmp/guardian-04-account-012/`.
Each command record retains exact executable/argv, cwd, HEAD, input blobs,
UTC start/end, raw child exit and complete separate stdout/stderr.
Saved complete before bytes, input manifest, dirty diff, lexical callers,
control patch and final owner support input and restoration comparisons.

| Native record | Actual scope and raw result |
| --- | --- |
| guard.json in the pretrace directory | Exact three owned paths before edits; exit 0, no configured zones/rule packs. |
| baseline-build-final.json, baseline-target-final.json | Fresh build and exact timeline target; both exit 0. |
| control-build.json, control-target.json | Temporary-source build 0; intended whole-notification assertion failure 1, 14:04:41.844–14:04:42.135 UTC. |
| restore-source.json, restored-build.json, restored-target.json | Git restoration, fresh build and named GREEN; all exit 0. |
| build-final.json | Fresh npm run build:test; exit 0, 14:05:38.037–14:05:40.803 UTC. |
| owner-final.json | Full compiled owner with TAP; exit 0, 153 pass, zero fail/cancel/skip/todo. |
| direct-final.json | Exact source/owner test:coverage:direct selector including fresh build; exit 0. |
| native-coverage-final.json | Full owner and exact-source include with all three 100% thresholds; exit 0. Native compiled lines 995/995, functions 57/57, branches 180/180. |
| lint-final.json | Exact source/owner ESLint, max warnings 0, no cache; exit 0. |
| audit.json | Original base e6f49a59671c13a20b696b7f46e38406a36aeec0, JSON/quiet/explain; exit 0, verdict pass. |
| evidence-gate.json, provenance-1.json | Unchanged RED CLI and SAME installed recursive classifier; all six records RED_EVIDENCE_OK, exit 0. |
| pre-step-1.json | Required exact two-path SKIP=npm-check pre-commit; exit 0, clean with no formatter changes. Repeated after this report update before staging. |

The first patch-generation attempt failed before a repository edit because its
assertion removal also removed an AAA marker. Its terminal tool output is retained.
The first edited candidate then failed build and lint because its expectation
generator read the wrong object and left a computed logger-output assertion.
Complete native errors remain in build-1.json and lint-1.json; both were corrected
before the first owner run. A later timeline baseline failed because the fixture's
connected notification had not settled before the first clock advance.
The removal case now explicitly settles initial readiness before that advance.
The complete baseline-target.json failure remains; the subsequent baseline,
control and restored checks use the corrected case. None is genuine RED.

Provenance checks all 138 authored test declarations remain: 33 converted cases
and 105 preserved cases, allowing only silent-stub/caller substitutions in the
otherwise unchanged cases. Every one of the 116 authored empty command-attempt
assertions remains exact; generated rows retain their previous execution count.
Original 024/025 regression bodies, both 028 cases and both private stateful
fixture bodies remain byte-identical. All 015 contract assertions and structured
negative controls remain unchanged. All private interface shapes remain intact.
Every other tracked input matches the initial manifest. The full production
source has no final diff. The six-record RED file retains blob
`849b2e725bc19a4742e962910cce05f804a6a4c1`, with every archived stream intact.
The native compiled denominator above is the actual current run; it is not
substituted for prior 181-branch records or merged source-map LCOV.
Selected direct checks do not refresh merged all-pair coverage.

### Atomic commit and remaining scope

The atomic commit introducing this appendix and the owner repair is titled
`test: verify account diagnostics at the failure boundary`.
Its only final paths are `test/runtime/accountRuntime.test.ts` and this report.
The production path was used only for the restored temporary control.
Exact clean `SKIP=npm-check pre-commit run --files` precedes staging and repeats
after report or formatter changes. Native branch/HEAD/index assertions,
authorized linked-index staging and plain foreground normal commit records
retain the actual terminal result and hash. No hook bypass, amend, stash,
rebase or history rewrite is used.

Only original 012 is implemented here. Original 013 remains the separate 04-07
API/registration/listener mock-conformance cause; existing unrelated violations
are not silently repaired. Later owning causes and independent full ACCOUNT
correction remain pending. The parent owns the full combined gate after completed
04-07; no full npm run check runs in this task. RUN-01 remains Pending.
The 29 stable IDs, counter 0 and D-03 remain unchanged.
WINDOWS 46/47/48 remain OPEN and unwaived.

## CR-04-ACCOUNT-013: prescribed account interactions

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_lifecycle/account_013_prescribed_interactions`, on 2026-10-15.
Disposition: **implemented; pending independent full ACCOUNT correction**.
The complete initial report and every prior appendix remain intact.
The original 29 stable IDs and correction counter **0** continue.
This repair supplies no correction round or partial clean verdict.

### Roles and preserved promises

Cases now prescribe command dispatch, credential registration, trustworthy
inventory, confirmed removal and monitoring notifications with exact-parameter
strong mocks. Every mock has explicit verification in its owning case after
public state assertions. All allowed calls have definite counts and complete
meaningful arguments. There is no anyTimes, wildcard argument, shared verification,
cleanup verification or process-wide mock registry.

The complete owner still has 138 authored declarations and 153 executed cases.
Its 132 authored cases with mocks contain 254 independently verified handles.
All 116 authored empty-command-attempt assertions remain exact.
Command attempts are recorded before the injected strict command port runs.
An unexpected call that commands.send catches therefore remains observable
both through the whole attempt assertion and through explicit mock verification.
Existing exact single-attempt assertions on potentially delivered failures remain.

Scheduled REST cases prescribe their actual root AbortSignal and exact request
multiplicity. The existing createRetry injection supplies that root before start;
no private accessor or test-only production hook is added.
The HTTP composition cases prescribe the complete method, URL, headers and body,
with fresh Response objects for every allowed call.
Matchers are limited to nonstructural URL and AbortSignal objects.
They check exact URLs and signal class plus its initial abort state.
Command cases prescribe exact physical identity, complete desired data and
the signal's initial state. Their public outcome and existing request observations
remain; original 009/010's additional command assertions retain their later scope.

Monitoring listeners prescribe both the complete account struct and each keyed
device map. Existing state, silence, timing and no-extra-report assertions remain.
Cases capture their promised pre-stop state in ACT, stop in ACT when needed,
then assert that captured state and verify all notifications, including shutdown.
No shutdown action was added after ASSERT to satisfy cleanup expectations.
The unchanged-snapshot subscriber uses an exact mock with no allowed call.
The composition listener also checks its complete second argument.
Original 019 remains subject to its later owning repair and full correction.

Construction uses strict HTTP and MQTT ports with no allowed call.
Its truthful title promises no HTTP request or socket opening, matching the
actual observed boundaries. No file-read or timer observation is invented.
The requestSpy replacement/count is removed from that case.

Canned values and failures that only drive paths remain typed stubs.
The contract-checked stateful shadow and arrival-anchor adapters retain their
complete bodies, names, signatures and existing private interface shapes.
Their state and lifecycle observations remain meaningful fake-state assertions.
The local harness accepts optional overrides of existing public ports;
the local HTTP stub accepts an optional injected HTTP port.
Only those nonexported local function signatures change.
No shared/exported signature, private alias/member shape, production API,
configuration, helper file or dependency changes. D-06's private-alias/member
restriction does not cover these local functions; no trace exception is claimed.
Superseded canned command arguments and redundant literal spreads are removed.

Every original FailureLog call expectation remains structurally identical.
The exact 012 diagnostic timeline, silent logs, 015 contracts and structured
negative controls remain. Both complete 028 ordering cases remain byte-identical,
including their independent chronological streams and per-case verification.

### Active regressions and immutable history

Original 024 remains byte-identical. Original 025 retains every original
assertion, timer observation, literal deadline and before/after count.
Its additive verification now prescribes exactly two credential calls on the
actual root signal and verifies that mock after the original assertions.
Its local harness call adds the public-port override and captures that root
through createRetry. Formatting expands that call; no timing operation changes.
The saved original and current complete case bodies are retained side by side
in provenance.json. This is stronger active verification, not a rewritten RED.

The six-record RED JSON remains byte-identical at blob
`849b2e725bc19a4742e962910cce05f804a6a4c1`.
The current installed checker accepts it. The SAME installed classifyRedEvidence
recursively accepts every root/archive record as RED_EVIDENCE_OK.
No evidence field, archived stream or genuine source/evidence/fix ancestry changes.

### Separate maintenance control

The plausible wrong behavior automatically dispatches a self-test during launch
and discards the caught refusal. Compilation and coverage cannot prove absence.
The temporary source adds only that loop before launch records success.
Fresh compilation passes. The exact target
`^start discovers every device and stores its canonical snapshot$` fails its
intended whole empty-attempt assertion after the independent canonical assertion.
Native ERR_ASSERTION/deepStrictEqual contains one complete request:
placeholder device account-1_serial-1, desiredData test_running=true,
aborted=false, against expected []. One test fails, with zero skip/cancel/todo.
This proves the strict route preserves 027's record-before-rejection discriminator.
It is not a swallowed mock exception, setup failure or genuine production RED.

Production is restored through Git and compared byte for byte with saved bytes.
Source before/restored blob: `641f40950d20e1fbfbc7de6dd1200e867c67ecb0`.
Temporary control blob: `70e65211f7cdcc0e2edfe85cb2b4356e377fde35`.
Fresh restored build, both named startup/025 targets and full owner pass.
No control enters Git. The final owner blob is
`b9df254238e42506df1c34617a3317057ce1b6c3`.

### Verification location and retained attempts

Pre-edit HEAD was `0b86403ffecb4eac0794c7dc98bc9e4104b08daf`, on
features/code-review-sweep, with clean status and empty index.
The fixer read AGENTS and all five complete TypeScript/local-verification books,
amended 04-07, full 04-11-SUMMARY, newest protocol, the full ACCOUNT report,
the current production/owner and actual factory/callback callers.
Installed strong-mock 9.2.2 documentation and declarations were read before use.
The approved source/owner headers and existing adapter contracts remain intact.
Exact owned-path Fallow guards precede repository edits and formatter changes.

Checks run in the existing linked feature checkout with
workflow.use_worktrees=false. No additional checkout or branch is created.
Versions: Node v26.11.1, npm 11.20.0, TypeScript 6.0.3, Fallow 3.27.0.
Native directory: `/private/tmp/guardian-04-account-013/`.
Each record retains exact executable/argv, cwd, HEAD, input blobs, versions,
real UTC start/end, separate complete stdout/stderr and raw child exit.
Before bytes, failed attempts, final owner, control patch and complete dirty diff
are retained. Provenance checks actual test inventory, interfaces, fixtures,
original assertions, all diagnostic expectations and recursive RED history.

| Native record | Actual scope and raw result |
| --- | --- |
| guard*.json | Exact owned paths before edits; exit 0, no configured zones/rule packs. |
| baseline-build.json, baseline-target.json | Fresh final-fixture build and startup/025 targets; both exit 0. |
| control-build.json, control-target.json | Temporary-source build 0; intended named assertion failure 1, 14:27:23.897–14:27:24.194 UTC. |
| restoration.json, build-final.json | Exact source restoration and fresh build; exit 0, build 14:27:34.072–14:27:36.974 UTC. |
| restored-target.json, owner-final.json | Named targets and full compiled owner; exit 0, 153 pass, zero fail/cancel/skip/todo. |
| direct-final.json | Exact source/owner test:coverage:direct selector with fresh build; exit 0. |
| native-coverage-final.json | Isolated exact-source thresholds; exit 0, 995/995 native lines, 57/57 functions, 181/181 branches. |
| lint-final-2.json | Exact source/owner uncached ESLint, max warnings 0; exit 0. |
| audit.json | Original base e6f49a59671c13a20b696b7f46e38406a36aeec0, JSON/quiet/explain; exit 0, verdict pass. |
| evidence-gate.json, provenance-1.json | Immutable RED checker and SAME recursive classifier; all six accepted, exit 0. |
| pre-step-1.json | Exact two final paths with SKIP=npm-check pre-commit; exit 0, clean with no formatter changes, 14:30:28.397–14:30:31.725 UTC. Repeated after this row before staging. |

Preparation failures remain visible. Build-2 found colliding local inventory
bindings; its emitted owner failed import and is not valid test evidence.
The owned file was restored and the corrected candidate reapplied.
Build-4 found unused root bindings in zero-call cases.
Build-6 found generated capture syntax; the owned file was restored and corrected.
Build-7 found unused captures; its provisional run exposed renamed expected keys.
Build-9 and format-1 found malformed HTTP verification insertion; restoration and
corrected reapplication preceded the successful final build.
Owner-10 found the legitimate second inventory request omitted from its HTTP
expectations. The explicit exact response expectation was added.
Earlier formatting/lint and patch-generation failures remain native/tool streams.
None is relabeled as a passing check or genuine RED.

Sequencing deviation: ESLint --fix yielded session 47163 at 14:25:37.372 UTC.
The fixer proceeded with formatter/build before collecting its terminal exit 1
at 14:25:48.809 UTC. Those intermediate inputs and outputs are retained.
This violated serial mutation ownership; no historical ordering repair or waiver
is claimed. After collecting the session, serial format-4 and lint-final passed.
A final guarded launch expectation change then preceded baseline-build,
control/restoration, build-final, full owner, direct coverage and lint-final-2.
Only that final unchanged-input evidence supports this implementation.
The parent owns the separate process-window entry after terminal return.

Selected coverage does not refresh merged all-pair LCOV.
No full npm run check runs here; the parent owns the combined gate after 04-07.
Read-only gitdir lookup found gsd-plan-head-before-04-07 absent.
No measurement sentinel was created or reconstructed.

### Atomic commit and remaining scope

The commit introducing this appendix is titled
`test: prescribe account runtime interactions explicitly`.
Its only final paths are test/runtime/accountRuntime.test.ts and this report.
Production is owned only for the exactly restored control.
Exact clean SKIP=npm-check pre-commit runs on both paths before staging,
and repeats after any report or formatter change.
Native branch/HEAD/index assertions, authorized linked-index staging and plain
foreground normal commit retain their real terminal results and actual hash.
No amend, hook bypass, stash, rebase or history rewrite is used.

Only original 013 is implemented here. The other 04-07 causes retain their
implementation dispositions, pending later independent full ACCOUNT correction
after the remaining 04-08/09 causes. No original cause or counter is reassigned.
RUN-01 remains Pending. The 29 stable IDs, counter 0 and D-03 remain unchanged.
WINDOWS 46/47/48 remain OPEN and unwaived.

## CR-04-ACCOUNT-023: terminal final-check authentication RED checkpoint

Prepared by typed `gsd-code-fixer`, task
`/root/phase4_account_trust/account_023_red`, on 2026-10-15.
This appendix records unchanged-production RED preparation only.
Original 023 remains OPEN. Every earlier implementation disposition remains.
The original 29 IDs and ACCOUNT correction counter **0** continue.
There is no independent correction, closure, or partial clean verdict.

### Public regression and intended failure

Two fresh sibling cases in `test/runtime/accountRuntime.test.ts:829` exercise:

- `halts monitoring when the final inventory check rejects account credentials`
- `halts monitoring when the final inventory check reports halted authentication`

Each case calls public `createAccountRuntime` through the existing harness.
The first successful inventory admits one synthetic device.
Two successful empty polls reach the out-of-band final inventory check.
That fourth inventory request rejects with AuthRejectedError or AuthHaltedError.
The expected answer follows the existing terminal-auth policy: unavailable path,
unready command transport, rejected credentials, and one close before explicit stop.
Complete canonical snapshots, exact arrival anchors and keyed trust remain present.
Advancing 3600000 ms must leave the full terminal state and report history unchanged.
No later poll, credential refresh, shadow creation, removal or command is permitted.

The executed `deepStrictEqual` compares all captured public observations together.
It independently expects both complete states, both close counts, the whole request
history, inventory callbacks, and empty removal and command-attempt sets.
Exact-parameter strong mocks prescribe finite requests on the actual root signal,
inventory notifications and forbidden command/removal ports.
Every mock has explicit owning-case verification after the public assertion.
The contract-checked shadow and anchor adapters retain their complete bodies.
Health histories capture the public callback values; no production expected value,
private access, test export, shared helper edit or logger assertion is introduced.

Both final named targets fail the intended AssertionError/ERR_ASSERTION with
operator deepStrictEqual. Immediately after the final check, the actual path is
`shadow-and-poll`; account and device still say ready=true/rejected=false.
Their complete snapshot and exact anchor remain intact.
The actual shadow close count is zero immediately and before explicit shutdown.
The later clock advance records one additional inventory attempt and one
additional credential attempt: eight operations instead of the expected six.
Those extra attempts reach the strict ports, which reject them; runtime catches
the errors. The additional generic failure report is ancillary to the defect.
The immediate state and zero-close captures precede those unexpected mock calls.
The actual test failure comes from the explicit whole-state assertion, not mock
verification, fixture, compilation, import, setup, TypeError, skip or cancellation.

The complete owner executes 155 cases: all 153 prior cases pass and only these
two new cases fail. In particular, the existing transient final-check failure
still retains the device and retries removal on the next successful poll.
Original 024 remains exact. Original 025 retains every literal deadline, timer
operation, assertion and the strictly stronger 013 verification unchanged.
Removing only the new row block reproduces the entire pre-edit owner byte for byte.

### Native evidence and preparation history

All commands ran serially in the existing linked feature checkout with
`workflow.use_worktrees=false`, Node v26.11.1 and npm 11.20.0.
No worktree or branch was created. Native directory:
`/private/tmp/guardian-04-account-023-red/`.
Each command has complete separate stdout/stderr, exact argv, raw exit,
UTC start/end, HEAD, versions and input source/owner blobs.

| Native record | Actual command or scope and raw result |
| --- | --- |
| guard.json | Exact three owned paths before edits or formatting; exit 0, no configured boundary zones or rule packs. |
| snapshot.json, before.json | Clean feature HEAD/index/status, complete tracked-input manifest, saved owner/report/RED bytes and all 44 production blobs; exit 0. |
| owner-format.json, owner-format-2.json | Exact owner Prettier; exits 0. First run formats the new harness binding; second is unchanged. |
| owner-lint.json, owner-lint-final.json | Exact uncached owner ESLint, max warnings 0; exits 0. |
| build.json | First fresh npm run build:test; exit 0, 14:49:01.278412–14:49:04.159468 UTC. |
| target-rejected.json | First exact AuthRejected target; exit 1 at intended immediate whole-trust assertion. Complete original patch and owner bytes retained. |
| build-final.json | Fresh npm run build:test after combining all observations; exit 0, 14:49:49.810808–14:49:53.254149 UTC. |
| target-rejected-final.json | Exact AuthRejected named target with native TAP; exit 1, one intended failure, zero skip/cancel/todo, 14:49:59.094810–14:49:59.417121 UTC. |
| target-halted-final.json | Exact AuthHalted named target with native TAP; exit 1, one intended failure, zero skip/cancel/todo, 14:49:59.798652–14:50:00.102607 UTC. |
| owner-final.json | node --test --test-reporter=tap dist-test/test/runtime/accountRuntime.test.js; exit 1, 155 tests, 153 pass, two intended new failures, zero skip/cancel/todo, 14:50:00.511893–14:50:00.957829 UTC. |
| installed-gate.json | Actual on-disk pair record through installed check tdd-red-evidence CLI with GSD_RUNTIME=codex and --raw; exit 0, RED_EVIDENCE_OK. |
| assemble.json, assembly-verification.json | Complete prior-root preservation and SAME installed classifier recursively over all ten current/archive records; exit 0, every verdict RED_EVIDENCE_OK. |
| final-provenance-2.json, verified-inputs.json | Exact report prefix, complete saved/active patch, all prior owner bytes and original RED root, every unrelated tracked input and all 44 production blobs; exit 0. |

Each named command is `node --test --test-reporter=tap`, followed by an exact
anchored `--test-name-pattern` for its full title above and
`dist-test/test/runtime/accountRuntime.test.js`. The command records retain
the actual complete argv. Complete native TAP remains untouched in both JSON
and separate stdout files. Full npm build output is separate from TAP.
No preparation attempt is discarded. The first valid RED checked immediate
trust; its later close/work assertions were not reached. The final preparation
puts every captured public observation into the executed whole assertion.
All builds, formatting and lint attempts passed; the retained test failures
are intended RED, not disguised preparation errors.
The first report patch matched an earlier repeated footer and inserted this
appendix mid-report. The complete preparation report is retained separately.
Before handoff, relocation restored every original byte as the report prefix;
relocate-appendix.json records the successful exact comparison and correction.
The first final-provenance capture exhausted Node's default subprocess-output
buffer while retaining the complete dirty diff. Its raw failure is preserved.
The corrected capture raises only that output limit; no executable input changes.

### Immutable history and unchanged production

Source HEAD is `49d30f93b72cada50bb2002ce14aaf4fa9822776`.
Production account blob remains `641f40950d20e1fbfbc7de6dd1200e867c67ecb0`.
All 44 tracked production files match that commit byte for byte; the source diff
is empty. Original owner blob is `b9df254238e42506df1c34617a3317057ce1b6c3`.
Final active owner blob is `e87b406b12ed6453e716a2131c0bb40afa922638`.
The complete new regression patch and compiled source/owner identities are retained.
The entire pre-edit report remains an exact prefix, with no rewritten disposition.

The pair JSON's new root contains the complete final full-owner native run.
Its `priorEvidence[0]` is the ENTIRE previous root from immutable blob
`849b2e725bc19a4742e962910cce05f804a6a4c1`, preserving every original field,
raw stream and recursive archive. The exact previous raw JSON is retained too.
Three additional archives hold the preliminary target and both final named runs,
with their respective complete patches and original/current owner identities.
There are ten current/recursive records: six preserved records and four new ones.
The SAME installed classifyRedEvidence accepts all ten as RED_EVIDENCE_OK.
The full-owner output independently classifies for each new target.
No second parser, partial history, evidence-path workaround or old-field rewrite
supplies that result. The current installed CLI separately accepts the actual
on-disk record; its generic GREEN message does not replace the parent evidence commit.

### Terminal handoff and bounded next action

Exactly three repository paths change: the owner, this report and the pair RED JSON.
No production source, shared record, summary, plan, dependency or configuration changes.
The full current 1328-line source, 7243-line pre-edit owner, full ACCOUNT report,
04-08 plan, context/research/patterns/protocol/findings, canonical decisions,
07/11 summaries, AGENTS and all five complete books were read before edits.
Actual platform and both World factory callers, error classes, final-check probe,
reconciliation, anchor and health boundaries were inspected.
This local case addition changes no existing public/shared/private alias/member contract.
No contract-change or deletion trace exception is used.

The smallest proposed GREEN action is to propagate only terminal-auth errors
from the nested final-check catch to runPoll's existing terminal act.
Ordinary final-check errors keep their current silent return and no-removal behavior.
This is a candidate repair only; production has not been edited or controlled.
No direct-coverage pass, full npm run check, staging, commit, finding closure or
correction round is claimed. The failing owner remains active and unstaged.
The parent alone commits complete planning evidence through the required clean
pre-step and ordinary foreground hooks BEFORE any GREEN edit or active-test commit.
RUN-01 remains Pending. D-03 and all historical open process limits remain in force.

## CR-04-ACCOUNT-023: terminal final-check authentication propagation

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_trust/account_023_green`, on 2026-10-15.
Disposition: **fixed: requires human verification and independent full ACCOUNT correction**.
The entire previous report remains an exact byte prefix.
All 29 original IDs and ACCOUNT correction counter **0** continue.
This cause supplies no independent closure, correction round or partial clean verdict.

### Minimum repair and preserved boundaries

The final inventory fetch catch at `src/runtime/accountRuntime.ts:469` now
rethrows only `AuthRejectedError` and `AuthHaltedError`.
Both actual `applyDevices` callers already handle those errors:
`runPoll` invokes the existing terminal act, and `launch` delegates to `launchFailure`.
The rethrow prevents the enclosing poll from recording success after terminal refusal.
The existing terminal act marks credentials rejected, makes commands unready,
pushes complete keyed trust and closes the owned shadow client.
Its existing halt guard prevents later polling, rotation and connection attempts.
Explicit stop still aborts the shared root; terminal halt remains distinct.

Every other final-fetch error retains the existing silent return and no-removal behavior.
The unchanged transient final-check case still retries removal on the next successful poll.
No new retry, authentication policy, removal condition or transport teardown promise is added.
No public/shared name, signature, field presence, mutability or visibility changes.
No private alias/member is deleted or renamed; D-06 contract-change traces are not triggered.
Actual source callers, platform and both World composition callers, error classes,
reconciliation and the complete current source/owner were inspected before the edit.
The required bootstrap, AGENTS, five complete project books and owning planning context were loaded.
Both complete source/owner headers retain the approved form and `.js` imports.

The cause changes exactly three paths: source, mirrored owner and this report.
The owner contains the already active two-row regression, byte-identical to the RED checkpoint.
Both rows retain the complete independent canonical snapshots, exact anchors,
account and keyed-device trust histories, close counts and full request history.
They also preserve empty command/removal sets and explicit strict-port verification.
Advancing 3600000 ms leaves the entire halted observation unchanged.
No extra terminal report required an expectation adjustment.
Original 024 remains exact, and 025 retains every literal deadline, timer operation,
assertion and the stronger 013 verification unchanged.
All prior owner assertions, adapter contracts and negative controls remain intact.

### Evidence-first ancestry and immutable history

The actual chain is source `49d30f93b72cada50bb2002ce14aaf4fa9822776`
then planning-only evidence `3d554270b7451443b46a850ba75a150eb409c996`
then this implementation commit.
The evidence commit changes only this report and the pair RED JSON.
Both source and evidence commits retain production blob
`641f40950d20e1fbfbc7de6dd1200e867c67ecb0`.
GREEN production is `35411e8afb0f4b902684507cf31ad9da9cce0b53`.
Active owner remains `e87b406b12ed6453e716a2131c0bb40afa922638`.
Its full diff against the recorded source commit equals the saved regression patch exactly.
The complete owner is byte-identical to its saved pre-GREEN contents.

RED JSON remains immutable blob `3358f0816f73c4e18ca1d40207d013a9d3c0a9bc`.
The installed CLI accepts the actual on-disk file as `RED_EVIDENCE_OK`.
The SAME installed `classifyRedEvidence` recursively accepts all ten current/archive records.
The full-owner RED also classifies independently for the second new target.
The entire prior six-record root is deep-equal to immutable blob
`849b2e725bc19a4742e962910cce05f804a6a4c1`; its saved raw JSON is exact.
No archived field, native stream, test patch or source/evidence history is rewritten.
The original RED remains 155 cases: 153 pass, two intended assertion failures.
No assertion-maintenance control or additional genuine RED claim is introduced here.

### Verification location, current inputs and attempts

All checks ran serially in the existing linked `features/code-review-sweep` checkout,
under the documented `workflow.use_worktrees=false` opt-out.
Read-only lint and provenance checks overlapped after all build/coverage commands completed.
No new checkout, branch, recovery sentinel or dependency was created.
Node v26.11.1 and npm 11.20.0 were recorded for every native command.
Native directory: `/private/tmp/guardian-04-account-023-green/`.
Each check retains exact argv, raw exit, real UTC start/end, HEAD, input blobs
and complete separate stdout/stderr.
Saved source/owner/report bytes, tracked manifest, exact before/after dirty diffs,
ancestry, full patch comparison and recursive classifications remain in before.json
and provenance.json. Every other tracked input matches its saved SHA-256.

| Native record | Actual command/scope and raw result |
| --- | --- |
| guard.json | Exact three-path installed Fallow guard before repository edits; exit 0, no configured zones/rule packs. |
| build-1.json | Fresh npm run build:test; exit 0, 15:03:35.811118–15:03:39.015868 UTC. |
| owner-1.json | Full native TAP owner; exit 0, 155 pass, zero fail/cancel/skip/todo, 15:03:42.443367–15:03:42.897319 UTC. |
| direct-1.json | Exact isolated source/owner test:coverage:direct selector including fresh build; exit 0. |
| native-coverage-1.json | Full owner, exact-source include and all three 100% thresholds; exit 0, native compiled 998/998 lines, 57/57 functions, 184/184 branches. Native LCOV is accountRuntime.lcov. |
| lint-1.json | Exact source/owner ESLint, max warnings 0, no cache; exit 0. |
| evidence-gate.json, provenance-1.json | Current installed RED CLI and SAME recursive classifier; exit 0, all ten accepted and full saved/active patch exact. |
| audit.json | Fallow audit against actual ACCOUNT base e6f49a59671c13a20b696b7f46e38406a36aeec0, JSON/quiet/explain; exit 0, verdict pass, zero introduced issues. |
| pre-step-1.json | Exact three-file SKIP=npm-check pre-commit; exit 0, clean with no formatter changes, 15:05:58.552099–15:06:02.084219 UTC. Repeated after this report update before staging. |

All executable GREEN checks passed their first attempt; no owner expectation changed.
The initial temporary snapshot script failed on hashing a tracked symlink as a regular file.
Its terminal tool output remains retained; it changed no repository input.
The corrected snapshot hashes actual symlink bytes through Git's stdin and succeeds.
snapshot-2.json retains that successful command and full streams.
This script-preparation failure supplies no test or historical-process evidence.
Selected pair checks do not refresh merged all-pair source-mapped LCOV.
No full npm run check ran here; the parent owns the combined wave and phase gates.

### Commit, threats and remaining scope

The implementation commit introducing this appendix and both TypeScript paths is titled
`fix: halt monitoring on final inventory authentication refusal`.
The exact three-file clean `SKIP=npm-check pre-commit run --files` must pass
after this final report content before staging, then the normal foreground commit runs.
Native pre-step, branch/HEAD/index assertions, authorized linked-Git staging,
ordinary hook completion and actual commit path/hash records establish the result.
No amend, no-verify, rebase, stash, wrapper or history rewrite is used.

T-04-13/T-04-16 retain terminal ownership and healthy-runtime removal boundaries.
T-04-14 preserves sanitized diagnostics and synthetic evidence; T-04-SC has no install.
No security-relevant surface outside the existing threat model is introduced.
Only original 023 is implemented by this cause, pending independent full correction.
Remaining 04-08 IDs are 018–022 and 026; the declared 04-09 work remains pending.
The original 29-ID ledger and counter 0 remain unchanged; RUN-01 remains Pending.
D-03 and all historical OPEN/unwaived process limits remain in force.
No shared ledger, summary, STATE, ROADMAP, REQUIREMENTS, WINDOWS or configuration was edited.
The parent retains its full-gate and final worktree-setting restoration obligations.

## CR-04-ACCOUNT-021: final-check reappearance RED checkpoint

Prepared by typed `gsd-code-fixer`, task
`/root/phase4_account_trust/account_021_red`, on 2026-10-15.
This appendix records unchanged-production RED preparation only.
Original 021 remains OPEN. All earlier implementation dispositions remain.
The original 29 IDs, 18 BLOCKER/11 WARNING initial counts and ACCOUNT
correction counter **0** continue. No correction review or closure occurred.

### Public regression and intended failure

The new standalone case at `test/runtime/accountRuntime.test.ts:829` is
`removes a reappeared device only after two later healthy omissions and a final check`.
It uses public `createAccountRuntime` through the existing fresh harness.
Every existing case, assertion, contract and negative control remains unchanged.
Removing only this insertion reproduces the complete pre-edit owner byte for byte.
This includes both active 023 rows, exact original 024, and every literal timer
operation/deadline/assertion plus the stronger 013 verification in active 025.

The case admits two synthetic physical devices. Two healthy regular inventories
omit the first device but retain its neighbor. The out-of-band final fetch then
contains the first device and omits the neighbor. The next regular inventory is
empty: it supplies the first later omission of the reappeared device and the
neighbor's first regular omission. Both devices must remain. The following
regular inventory contains the neighbor and omits the first device again.
That second later omission must trigger another final fetch and exact-device removal.
The final-check response is never replayed as a regular inventory observation.

The first executed `deepStrictEqual` passes: both complete canonical snapshots,
physical ID order, exact anchors and whole account/keyed trust remain correct
after reappearance and after the first later omission. The second executed
`deepStrictEqual` fails with AssertionError/ERR_ASSERTION at the intended boundary.
Actual state still contains both devices, snapshots, anchors and trust entries.
Removal and callback-state arrays are empty. Only six inventory requests occur;
the expected final check would be the seventh. No setup, compiler, import,
TypeError, mock-verification, filter, skip or cancellation supplies this RED.

Independent expected values also require the removal callback to see both
complete snapshots and anchors before pruning. Afterward, only the neighbor
may remain, with its complete snapshot received at START_TIME + 4000 and its
original exact anchor. Callback capture includes the complete request history.
Exact-parameter strong mocks prescribe finite root-signal requests, exact
inventory callbacks and the one physical removal. A command port permits no call.
Each mock has explicit verification at the case's end, after public assertions.
Current production never reaches the expected removal callback; the whole-state
assertion detects that absence before verification. Logging stays silent.

### Native attempts, location and immutable history

All commands completed serially in the existing linked feature checkout with
`workflow.use_worktrees=false`, Node v26.11.1 and npm 11.20.0.
Native directory: `/private/tmp/guardian-04-account-021-red/`.
Every command record retains complete separate stdout/stderr, exact argv,
raw exit, real UTC start/end, source HEAD, full production manifest, source/owner
blobs and complete source/owner bytes. Preparation captures retain their actual
patches, including the initial pre-format candidate. Build output is separate from TAP.

| Native record | Actual scope and raw result |
| --- | --- |
| before.json, saved before files | Clean c18541a feature HEAD, empty index/status, 44 production and 698 tracked input identities, complete owner/report/prior raw JSON. |
| guard.json | Exact three owned paths before any edit or formatter; exit 0, no configured zones/rule packs. |
| owner-format.json | Exact owner Prettier; exit 0, formats only the new case. |
| owner-lint.json | Exact uncached owner ESLint, max warnings 0; exit 0. |
| build.json | Fresh npm run build:test; exit 0, 15:13:57.651893–15:14:00.965606 UTC. |
| target.json | Native TAP exact anchored title above; exit 1, one intended assertion failure, zero skip/cancel/todo, 15:14:04.196529–15:14:04.541730 UTC. |
| owner.json | node --test --test-reporter=tap dist-test/test/runtime/accountRuntime.test.js; exit 1, 156 cases, 155 pass, only the new case fails; zero skip/cancel/todo, 15:14:14.523939–15:14:14.985607 UTC. |
| assemble.json, classifications.json | Complete old-root preservation and SAME installed classifier recursively over all twelve records; exit 0, every verdict RED_EVIDENCE_OK. |
| installed-gate.json | Installed check tdd-red-evidence CLI on actual on-disk pair with GSD_RUNTIME=codex and --raw; exit 0, RED_EVIDENCE_OK. |
| finalize.json, semantic-assessments.json | Independent semantics and actual source-commit/blob check for every current/archive record; exit 0. |

The named command uses `node --test --test-reporter=tap`, exact anchored
`--test-name-pattern` for the full title above, and the compiled owner path.
Complete TAP is untouched in JSON and separate stdout files, including Node's
own diagnostic formatting. Both native attempts reached the same intended assertion.
No unsuccessful preparation or native attempt was dropped or relabeled.

The pair RED root contains the complete final full-owner run.
Its `priorEvidence[0]` is the ENTIRE previous ten-record root, deep-equal to
blob `3358f0816f73c4e18ca1d40207d013a9d3c0a9bc`. Its exact raw JSON is retained too.
The other archive is this case's complete named run. Total recursive records:
**12 = 10 preserved + 2 new**. Every record retains complete native output,
patch, expected/actual, semantic assessment and actual source/test provenance.
The SAME installed `classifyRedEvidence` accepts all twelve as RED_EVIDENCE_OK.
Independent review retains the preliminary 025 timing failures as timing attempts,
and the preliminary 023 immediate-trust failure as that narrower attempt.
Neither becomes a later assertion or native timer-clamp proof.
No second parser, partial history or alternative evidence-path gate is used.

Source HEAD remains `c18541aa4af394cd4594d486e767b3a030fd79af`.
Production account blob remains `35411e8afb0f4b902684507cf31ad9da9cce0b53`.
All 44 production files match that HEAD byte for byte; the source diff is empty.
Original owner is `e87b406b12ed6453e716a2131c0bb40afa922638`.
Active owner is `5ff214b9d474fde7da84a26844663e34d5cd4aef`.
The saved root regressionPatch equals the entire current owner diff exactly.
The complete preceding report remains an exact byte prefix.

### Terminal checkpoint and required bounded amendment

Exactly three authorized paths change: owner, this report and pair RED JSON.
No source, reconciliation, platform, feature, helper, summary or shared record changes.
The full current account source/owner and reconciliation source/owner were read,
with actual platform/World callbacks, complete AGENTS and all five project books.
The owning 08 plan, protocol, context, research, patterns, findings, full ACCOUNT
report, 07/11 summaries and canonical decisions were loaded before edits.
This local case addition changes no existing shared/public/private-member contract.

The minimum proposed GREEN repair needs a targeted presence-reset operation,
such as `Reconciliation.present(deviceId: string): void`, that sets only the
named device's absence count to zero and retains its tracking. Runtime would
call it only for a confirmed candidate found present in the final fetch.
`forget` keeps its successful-removal semantics. Calling full `observe` on the
final response would advance unrelated omissions and is outside this contract.
This is a proposal only; no reconciliation or runtime production edit occurred.

Before external edits, the parent must declare a serial dependency task in 04-08
for `src/accessories/reconciliation.ts`, its mirrored owner, this ACCOUNT report
and the 04-08 plan amendment. That four-path task adds the targeted contract and
public tests. Refresh exact Reconciliation and createReconciliation impacts
independently in both compiler projects, require complete evidence and inspect
actual structural callers before editing. Then the existing runtime task can
change account source/owner/report/RED within four paths. The plan amendment
and evidence commit remain parent responsibilities; no extra path is implied.

The parent alone commits complete planning evidence after the clean required
pre-step and ordinary foreground hooks BEFORE any GREEN edit. The active failing
owner stays unstaged. The classifier's generic GREEN message does not satisfy
that ordering. No staging, commit, source control, direct-coverage pass, full
npm run check, finding closure or correction round occurred in this preparation.
RUN-01 remains Pending. D-03 and all historical open process limits remain.

## Original 021 dependency: reconciliation headers only

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_trust/account_021_reconciliation_headers`, on 2026-10-15.
Disposition: **header dependency implemented; original 021 remains OPEN**.
The entire earlier report remains an exact byte prefix.
All 29 original IDs and ACCOUNT correction counter **0** continue.
This cause supplies no correction round, independent closure or clean verdict.

### Header scope and inspected callers

Pre-edit HEAD is declaration 169dbfdc9938b9084637151cbd08bfaaae5b56e9.
Task 04-08-03 follows planning-only 021 evidence ce3305e.
This slice changes exactly reconciliation source, its mirrored owner and this report.
The committed owning plan declaration is the fourth cause path.
Targeted presence and runtime integration remain separate functional work.

Both complete headers now have SPDX MIT first, one blank line, separate
Copyright (c) 2026 Alessandro Colomba JSDoc, one blank line, separate purpose
@fileoverview JSDoc, one blank line, then imports.
The source retains its ENTIRE original overview: trustworthy empty inventories,
caller-owned validation, absence counting and physical deviceId identity.
The owner overview states its absence-confirmation and tracking-removal purpose.
MIT classification remains; no template attribution is removed.
Both complete files were read before editing and both full headers inspected.
Every byte from first import through EOF remains unchanged in both files.
No function, signature, contract, test operation, assertion or runtime behavior changes.

Complete AGENTS, bootstrap and all five complete project books were loaded.
The amended 04-08 including dependency/tail, newest full protocol, CONTEXT,
RESEARCH, PATTERNS, FINDINGS, full ACCOUNT report, 04-07/11 summaries and canonical
decisions were read, with applicable locked state, privacy and license boundaries.
Lexical consumers are the mirrored owner and account runtime.
Actual owner factory/observe/forget callers and runtime caller bodies were inspected.
The runtime creates reconciliation once; applyDevices observes regular inventories,
forgets final-check reappearances and forgets successful removals.
The known reappearance defect remains. No public/shared/private shape changes,
so D-06 contract-change impacts are not triggered by these headers.
The later functional cause still requires fresh complete exact impacts separately
for both compiler projects before edits. This does not certify the accessories sweep.

### Verification location and native evidence

All checks ran serially in the existing linked features/code-review-sweep checkout,
with workflow.use_worktrees=false, Node v26.11.1 and npm 11.20.0.
No new checkout, branch, recovery sentinel, dependency or repository helper was created.
Native directory: `/private/tmp/guardian-04-account-021-reconciliation-headers/`.
Every command retains exact argv, raw exit, real UTC start/end, HEAD, input blobs
and complete separate stdout/stderr. Complete pre-edit files, tracked manifest
and exact initial/current diffs support byte comparisons.

| Native record | Actual scope and raw result |
| --- | --- |
| before.json, guard.json | Exact branch/HEAD/empty index and active-owner-only initial diff; exact three-path Fallow guard before edits or formatting; exit 0, no configured zones/rule packs. |
| header-provenance.json | Both complete bodies from first import exact, prior report prefix exact and every other tracked input unchanged; exit 0. |
| build.json | Fresh npm run build:test; exit 0, 15:26:57.507272–15:27:01.242686 UTC. |
| owner.json | node --test --test-reporter=tap dist-test/test/accessories/reconciliation.test.js; exit 0, 9 pass, zero fail/cancel/skip/todo. |
| direct.json | Exact npm run test:coverage:direct reconciliation source/owner selector including fresh build; exit 0. |
| native-coverage.json | Full owner, exact-source include and all three 100% thresholds; exit 0, native compiled 50/50 lines, 5/5 functions, 11/11 branches. Complete reconciliation.lcov retained. |
| lint.json | Exact source/owner ESLint, max warnings 0, no cache; exit 0. |
| audit.json | Fallow audit against real ACCOUNT base e6f49a59671c13a20b696b7f46e38406a36aeec0, JSON/quiet/explain; exit 0, verdict pass, zero introduced issues. |
| pre-step-1.json | Exact three-path SKIP=npm-check pre-commit; exit 0, clean with no formatter changes, 15:27:59.471857–15:28:02.262985 UTC. Repeated after this appendix before staging. |

All focused checks passed first attempts. The audit cache-entry warning remains retained.
The first report patch failed to match its context before changing any bytes;
the corrected append preserves the complete previous report prefix.
This preparation failure is not a test result or passing gate.
Selected direct runs do not refresh merged all-pair source-mapped LCOV.
No account-owner GREEN, full npm run check or source control is claimed here.
The parent owns combined wave and phase gates.

Source header blob changes from 03de159a000e30ad0cf65cbc65d353f7613d925e
to 7761f91181950c8047a61319558400e633a89150.
Owner header blob changes from 2c9fc71103028610492c8d87fc0143efb28143af
to a2c4a35703ef66305998f7c547ef7722775a6797.
Account production remains 35411e8afb0f4b902684507cf31ad9da9cce0b53.
Active failing account owner remains 5ff214b9d474fde7da84a26844663e34d5cd4aef;
its entire pre-existing patch stays byte-exact and unstaged through this dependency.
RED JSON remains 822f393d3a0f37667cb8024e314a8ddd7ca7e993, preserving all twelve
complete recursive records and every prior native-history byte unchanged.
No archived record, active regression or earlier disposition is rewritten.

### Atomic commit and remaining scope

The commit introducing this appendix and both headers is titled
`fix: complete reconciliation file headers`.
Its actual hash and exact paths follow from Git and retained terminal native records.
The exact three-file clean pre-step repeats after this report content before staging.
Only these three owned paths are staged; the ordinary foreground commit runs hooks.
Native branch/HEAD/index, staging, commit and postcommit records establish the result.
No manual stash, hook bypass, amend, rebase, wrapper or history rewrite is used.

Original 021 still needs its targeted presence dependency and runtime repair.
T-04-16 retains existing inventory/removal boundaries; no new policy follows.
No security-relevant surface outside the existing threat model is introduced.
RUN-01 remains Pending. D-03, original IDs/counter and historical open limits remain.
Plans, shared records, summaries, configuration and unrelated code stay unchanged.
The parent retains full-gate and final worktree-setting restoration obligations.

## Original 021 dependency: targeted reconciliation presence

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_trust/account_021_reconciliation_present`, on 2026-10-15.
Disposition: **dependency implemented; original 021 remains OPEN for runtime integration**.
The complete earlier report remains an exact byte prefix.
All 29 original IDs, initial 18 BLOCKER/11 WARNING counts and ACCOUNT
correction counter **0** continue. No independent correction or closure occurs.

### Minimum operation and public owner

The documented `Reconciliation.present(deviceId): void` records presence by
setting only that physical device's absence count to zero.
It retains eligibility for later absence confirmation and admits a newly present ID.
It does not advance or reset any other device's count.
The complete `observe` and `forget` implementations remain byte-identical.
The confirmation threshold, repeated confirmation, logging and caller-owned
trustworthiness policy remain unchanged. No full inventory is replayed.
The runtime still calls `forget` for final-check reappearance; its separate
declared integration must call `present` for that confirmed candidate only.
Successful removal continues to call `forget`.

Five independent public cases exercise the new operation through the factory:
reset after confirmed absence; exact first/second/third later omission answers;
no neighbor count advancement; no neighbor count reset; fresh presence admission;
and `forget` removing that presence eligibility.
The two neighbor cases start from distinct counts and compare complete ordered
confirmation arrays, so both advancing and resetting a neighbor are detectable.
Every case completes its operations in ACT and asserts independent whole values.
No private access, state getter, new helper, test-only export or logging assertion is added.
All nine original cases, their operations and assertions remain byte-identical.
Both complete approved headers and the entire original source overview remain exact.
Removing only the documented declaration/method reproduces the complete prior source.

### Pre-edit consumers, reads and declaration

Pre-edit HEAD is `e914a627fd23c98bd6f701fab8547d13a56365f2`.
The actual ordering is source c18541a, planning-only RED ce3305e,
bounded declaration 169dbfd, header-only dependency e914a62, then this functional cause.
Task 04-08-03 changes reconciliation source, its mirrored owner and this report.
The already committed 04-08 declaration is its fourth cause path.
No runtime, account owner, evidence, helper, plan or shared-state path is edited here.

Installed Fallow help was read before four refreshed exact impacts at e914a62.
Each command uses `dead-code --type-aware --symbol-impact
src/accessories/reconciliation.ts:<symbol> --type-aware-project <project>
--type-aware-require complete --format json --quiet --explain`.
Each native exit is 0 with status and identity completeness both complete.
Each selects its independently requested project; no omitted evidence is reported.

| Exact symbol | tsconfig.json | tsconfig.test.json |
| --- | --- | --- |
| Reconciliation | Complete; no named consumer | Complete; reconciliation owner |
| createReconciliation | Complete; account runtime | Complete; account runtime and reconciliation owner |

Zero named production type consumers do not hide the factory's public return contract.
The actual inferred runtime object and every `observe`/`forget` call were inspected,
with the owner factory's explicit return type and both complete reconciliation files.
The complete 1332-line account source, 7532-line active account owner and 3303-line
pre-edit report were loaded through bounded contiguous reads before repository edits.
Complete AGENTS, bootstrap, all five books, amended 04-08 and its tail, protocol,
CONTEXT, RESEARCH, PATTERNS, FINDINGS, 07/11 summaries and canonical decisions were read.
Applicable locked state, privacy, identity, licensing and platform/World callbacks
were inspected. The native read inventory distinguishes complete from contextual reads.
No prior trace exception supplies evidence for this new public operation.
This dependency does not certify the later accessories sweep or full ACCOUNT conformance.

### Verification location and retained attempts

All checks ran serially in the existing linked features/code-review-sweep checkout,
using the documented workflow.use_worktrees=false opt-out.
No new checkout, branch, recovery sentinel, package or repository helper was created.
Node v26.11.1 and npm 11.20.0 are recorded for every command.
Native directory: `/private/tmp/guardian-04-account-021-reconciliation-present/`.
Each record retains exact argv, raw exit, real UTC start/end, HEAD, input blobs
and complete separate stdout/stderr. Saved complete before/after bytes, all 698
tracked identities, untracked inventory and exact dirty diffs support comparison.

| Native record | Actual scope and raw result |
| --- | --- |
| before.json, guard.json | Exact initial branch/HEAD/empty index and active-account-owner-only diff; exact three-path Fallow guard before edits; exit 0, no configured zones/rule packs. |
| resolver.json, impact-Reconciliation-production/test.json, impact-createReconciliation-production/test.json | Fresh Codex resolver: omitted model, effort high, tier opus; four exact complete pre-edit impacts, each exit 0. |
| build-final.json | Fresh npm run build:test after formatting; exit 0, 15:40:42.065658–15:40:45.134610 UTC. |
| owner-final.json | Full native TAP reconciliation owner; exit 0, 14 pass, zero fail/cancel/skip/todo, 15:40:50.203938–15:40:50.448179 UTC. |
| direct-final.json | Exact npm run test:coverage:direct reconciliation source/owner selector including fresh build; exit 0. |
| native-coverage-final.json | Full owner, exact-source include and all three 100% thresholds; exit 0, native compiled 53/53 lines, 6/6 functions, 12/12 branches; reconciliation-final.lcov retained. |
| lint-final.json | Exact source/owner ESLint, max warnings 0, no cache; exit 0. |
| implementation-verification.json, pre-report-provenance.json | Minimal source addition, all nine old cases exact, headers/overview exact, active account patch exact and all unrelated tracked inputs unchanged; exit 0. |
| evidence-gate.json, history-final.json | Installed current RED CLI and SAME recursively invoked classifier; exit 0, all twelve records RED_EVIDENCE_OK, prior ten-record root and saved active patch exact. |
| audit.json, audit-final.json | Fallow audit against real ACCOUNT base e6f49a59671c13a20b696b7f46e38406a36aeec0, JSON/quiet/explain; both exit 0, verdict pass, zero introduced issues. Final audit repeats on the formatted inputs. |
| pre-step-1.json | Exact three-file SKIP=npm-check pre-commit; exit 1 solely because Prettier compacted two new test assertions. Every other applicable hook passed. A clean repetition is required after this appendix before staging. |

All initial build, owner, coverage and lint checks passed.
The formatter-changing pre-step remains a failed attempt, with complete streams retained.
Fresh build, full owner, direct selector, native coverage and uncached lint repeated
on the final formatted owner bytes and passed. No behavioral expectation changed.
No source mutation control or new genuine RED history is claimed by this dependency.
Selected pair checks do not refresh merged all-pair source-mapped LCOV.
No full account-owner GREEN or full npm run check runs here.
The active account regression still requires its separate runtime repair.
The parent owns the combined wave and phase gates after the declared repairs.

### Immutable evidence, commit and remaining scope

Reconciliation source changes from 7761f91181950c8047a61319558400e633a89150
to e25bd84d713b6daa16b9616d00e6f4d7f41f8f62.
Its owner changes from a2c4a35703ef66305998f7c547ef7722775a6797
to d2f766376859734efac00a8e98c52400e49e50eb.
Account production remains 35411e8afb0f4b902684507cf31ad9da9cce0b53.
Active failing account owner remains 5ff214b9d474fde7da84a26844663e34d5cd4aef;
its entire saved patch remains exact and unstaged.
RED JSON remains 822f393d3a0f37667cb8024e314a8ddd7ca7e993 with all twelve records.
The prior ten-record raw root remains exactly blob 3358f0816f73c4e18ca1d40207d013a9d3c0a9bc.
Actual source commits/blobs, evidence-first ancestry and every recursive classification
were rechecked. Historical preliminary timing and immediate-trust attempts retain
their original narrower meaning. No archived native output or disposition changes.

The atomic commit introducing this appendix and both TypeScript paths is titled
`fix: retain reconciliation tracking after targeted presence`.
The exact three-path clean pre-step repeats after this report update before staging.
Only these three owned paths are staged. The ordinary foreground commit runs hooks,
using their normal temporary handling of the unrelated unstaged account regression.
Native staging, hook and postcommit records establish the actual hash and paths.
No manual stash, GSD commit wrapper, hook bypass, amend, rebase or history rewrite is used.

Original 021 remains OPEN until its runtime integration and independent full correction.
The original 29-ID ledger and counter 0 continue. RUN-01 remains Pending.
T-04-16 retains targeted physical identity and neighbor isolation within the existing
inventory/removal boundary. No new removal, trust or privacy policy follows.
No security-relevant surface outside the existing threat model is introduced.
D-03 and all historical OPEN/unwaived limits remain in force.
The parent retains full-gate and final worktree-setting restoration obligations.

## CR-04-ACCOUNT-021: targeted runtime reappearance integration

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_trust/account_021_runtime_green`, on 2026-10-15.
Disposition: **fixed: requires human verification and independent full ACCOUNT correction**.
All 29 original IDs, initial 18 BLOCKER/11 WARNING counts and correction counter **0** continue.
This appendix preserves every earlier report byte and supplies no independent correction or closure.

### Minimum runtime change and unchanged owner

The final-check reappearance branch at `src/runtime/accountRuntime.ts:495`
calls `reconciliation.present(deviceId)` for that confirmed candidate only.
Its comment describes the retained eligibility and zero absence count.
Successful removal still calls `forget` after the removal callback succeeds.
The final response never passes through full-inventory `observe`.
No other runtime statement changes.
The existing lifecycle guards, transient-error handling, terminal-auth propagation,
callback-before-prune order, trust and arrival-anchor ownership remain unchanged.
No new tracking, removal, identity, telemetry, privacy or retry policy follows.

The entire active owner remains byte-identical to the RED checkpoint:
`5ff214b9d474fde7da84a26844663e34d5cd4aef`.
The regression retains both complete retained-state observations and the complete post-removal observation.
Independent expectations retain exact physical IDs, snapshots, anchors, account trust and keyed device trust.
The callback observes both devices before pruning.
The extra final response cannot advance the neighbor's absence count.
Every exact root-signal request, inventory callback, removal and forbidden command expectation remains.
All original assertions, both terminal 023 rows, original 024 and stronger 025 verification remain exact.
Adapter contracts and negative controls also remain unchanged.

Pre-edit HEAD was `020498a3e2b8d903a0ec9fcc230689927c263592` on `features/code-review-sweep`.
The index was empty and only the active regression owner was unstaged.
The cause changes exactly account source, its mirrored owner and this report.
No reconciliation, plan, RED JSON, helper, configuration or shared record changes.
The documented worktree opt-out remains false, with no new checkout or branch.

Complete account source (1332 lines), owner (7532 lines), reconciliation source/owner
and the prior 3436-line ACCOUNT report were read before the runtime edit.
The bootstrap, AGENTS, all five project books, amended 04-08 including dependency/tail,
protocol, CONTEXT, RESEARCH, PATTERNS, FINDINGS, 07/11 summaries and canonical decisions were loaded.
Actual callers were traced through launch/runPoll to applyDevices and reconciliation.
Platform and both World composition/removal callbacks were inspected.
All four complete source/owner headers retain the approved form and `.js` imports.
No public/shared/private name, signature, field, visibility or mutability changes in this integration.
The dependency's four exact pre-edit impacts remain complete in both compiler projects at e914a62.
No new trace exception or broader accessories-sweep claim follows.
Both reconciliation files join the later full ACCOUNT correction and seal inventory.

### Immutable evidence and actual ancestry

The actual chain is source `c18541aa4af394cd4594d486e767b3a030fd79af`,
planning-only evidence `ce3305e8ce53f92e5e4e24a12e1694e95ced4489`,
declaration `169dbfdc9938b9084637151cbd08bfaaae5b56e9`,
headers `e914a627fd23c98bd6f701fab8547d13a56365f2`,
then dependency `020498a3e2b8d903a0ec9fcc230689927c263592`, before this runtime repair.
Every predecessor retains account source blob `35411e8afb0f4b902684507cf31ad9da9cce0b53`.
The new account source blob is `334537d18395e5f234bb346e2a993852ab80f730`.
The evidence commit contains only planning report and RED JSON paths.
Its genuine RED remains 156 cases, 155 pass and one intended complete-state assertion failure.

RED JSON retains immutable blob `822f393d3a0f37667cb8024e314a8ddd7ca7e993`.
The current installed CLI accepts the actual file.
The SAME installed `classifyRedEvidence` recursively accepts all twelve complete records as `RED_EVIDENCE_OK`.
Every recorded sourceCommit/sourceBlob pair resolves through actual Git objects.
The entire previous ten-record root remains deep-equal to blob `3358f0816f73c4e18ca1d40207d013a9d3c0a9bc`.
Its saved raw JSON also equals that immutable Git blob byte for byte.
The saved regressionPatch equals the complete active owner diff against c18541a exactly.
There is no formatter difference, rewritten history, second parser or evidence-path workaround.
Earlier preliminary timing and immediate-trust attempts retain their original narrower meaning.

### Current native checks and verification location

All builds, owners and coverage commands completed serially in the existing linked checkout.
Node v26.11.1 and npm 11.20.0 are recorded for every command.
Native directory: `/private/tmp/guardian-04-account-021-runtime-green/`.
Each command retains exact argv, raw exit, real UTC start/end, HEAD, input blobs and separate complete stdout/stderr.
The before/after manifest covers all 698 tracked inputs and the untracked set.
Saved full files and dirty diffs support exact owner, source, report-prefix and unrelated-input comparisons.

| Native record | Actual scope and raw result |
| --- | --- |
| before.json, guard.json | Exact branch/HEAD/empty index and active-owner-only initial diff. Exact three-path guard before repository edits, exit 0, no configured zones/rule packs. |
| evidence-gate.json, history-before-edit.json | Current installed CLI and SAME recursive classifier before GREEN, exit 0. All twelve accepted, prior raw root and active patch exact, actual evidence-first ancestry verified. |
| build.json | Fresh npm run build:test, exit 0, 15:50:19.690621–15:50:23.022857 UTC. |
| owner-account.json | Full native TAP account owner, exit 0, 156 pass, zero fail/cancel/skip/todo, 15:50:38.938703–15:50:39.427520 UTC. |
| owner-reconciliation.json | Full native TAP reconciliation owner, exit 0, 14 pass, zero fail/cancel/skip/todo. |
| direct-account.json, direct-reconciliation.json | Each exact npm run test:coverage:direct source/owner selector with fresh build, exit 0. |
| coverage-account.json | Full account owner, exact-source include and all three 100% thresholds, exit 0. Native compiled 998/998 lines, 57/57 functions, 183/183 branches. accountRuntime.lcov retained. |
| coverage-reconciliation.json | Full reconciliation owner, exact-source include and all three 100% thresholds, exit 0. Native compiled 53/53 lines, 6/6 functions, 12/12 branches. reconciliation.lcov retained. |
| lint.json | Exact current account and reconciliation pairs, uncached ESLint, max warnings 0, exit 0. |
| audit.json | Fallow audit against real initial ACCOUNT base e6f49a59671c13a20b696b7f46e38406a36aeec0, JSON/quiet/explain, exit 0, verdict pass, zero introduced issues. |
| pre-step.json | Exact three-file SKIP=npm-check pre-commit, exit 0, clean with no formatter change, 15:53:01.541678–15:53:04.837601 UTC. Repeated after this record update before staging. |

All executable checks passed their first attempt without an owner expectation change.
The first report patch matched a repeated footer and inserted this appendix before the last existing dependency record.
The report-prefix assertion caught that placement, with raw exit 1 retained in report-prefix-attempt.json.
The appendix moved to EOF, and report-prefix-restored.json verifies every original report byte as the exact prefix.
An initial relocation patch format failed before edits. Its corrected application succeeded.
These report preparation attempts supply no test result or historical waiver.
Native coverage denominators describe these current compiled inputs.
They do not replace earlier 184-branch evidence or merged source-mapped all-pair LCOV.
Selected direct runs do not refresh that merged artifact.
No full npm run check ran here. The parent owns the later combined-wave and phase gates.
No temporary source mutation control, new regression history, package install, live vendor or hardware run occurred.

### Atomic commit and remaining work

The commit introducing this appendix and both account paths is titled
`fix: retain absence eligibility after final-check reappearance`.
The exact three-file clean `SKIP=npm-check pre-commit run --files` precedes staging.
Report or formatter changes require another clean pre-step before staging.
Native branch/HEAD/index assertions, authorized linked-Git staging and normal foreground hooks retain their terminal results.
Actual postcommit Git objects establish the hash, exact three paths, no deletion and clean index/tree.
No wrapper, manual stash, amend, hook bypass, rebase or history rewrite is used.

Only original 021 is implemented here, pending human verification and independent full correction after the complete repair pass.
Remaining 04-08 IDs are 018, 019, 020, 022 and 026.
The declared 04-09 causes remain pending.
T-04-16 retains targeted identity, neighbor isolation and callback-before-prune within the existing removal boundary.
No security-relevant surface outside the existing threat model is introduced.
RUN-01 remains Pending. Original IDs, counter 0, D-03 and all historical OPEN/unwaived limits remain.
The parent retains its full-gate, shared-state and final worktree-setting restoration obligations.

## CR-04-ACCOUNT-022: later-device shadow membership RED checkpoint

Prepared by typed `gsd-code-fixer`, task
`/root/phase4_account_trust/account_022_red`, on 2026-10-15.
This appendix records active unchanged-production RED preparation only.
Original 022 remains OPEN. All earlier implementation dispositions remain.
All 29 original IDs, initial 18 BLOCKER/11 WARNING counts and ACCOUNT
correction counter **0** continue. No independent correction or closure occurs.
The complete earlier report remains an exact byte prefix.

### Public regression and intended assertion

The new standalone case at `test/runtime/accountRuntime.test.ts:830` is
`adds a later discovered device to live shadow routing without reconnecting unchanged inventories`.
It calls public `createAccountRuntime` with the real `createShadowClient`.
An injected offline `MqttTransport` provides typed handler-registration stubs
and exact-parameter strong mocks for subscription, publication and ending.
The actual real client's route table, complete-shadow requests and current
connection guards process every message. The test assumes no fake routing equivalence.
The existing lifecycle-only fake contract, fakeShadow and recordingAnchors remain unchanged.

The first inventory admits one synthetic physical device. The offline transport
completes the real subscription and get-publication readiness chain.
The first executed assertion independently compares the complete canonical
snapshot, ID set, healthy account and keyed-device trust, and ready public path.
It passes. Thus the intended failure follows established real shadow readiness.

At elapsed 1000 ms, a later successful inventory admits the second device.
Existing start/replacement behavior must establish all six accepted/rejected
topics and request both complete shadows. The next unchanged inventory at
2000 ms must leave that replacement count unchanged.
At 2250 ms, the current transport delivers first-device update-accepted and
second-device get-accepted documents. Complete independent expected snapshots
retain both identities, connectivity, unaffected data, metadata, watermarks,
device timestamps and distinct local receipt times. Exact arrival anchors
must advance for both devices. Full account and keyed-device trust stay healthy.
After stop, a further second-device message must change neither snapshot nor anchor.
Command trust becomes unready in the complete account and keyed-device answers.

The second executed deepStrictEqual compares all these captured observations,
the whole subscription/get histories and all trustworthy inventories together.
It fails with AssertionError/ERR_ASSERTION for the intended missing membership:

- Both physical devices are present in canonical storage and REST observations.
- Only the first three-topic subscription and first-device get exist.
- The first-device message updates level 3, firmware first-live, version 11,
  receipt and anchor START_TIME + 2250, as independently expected.
- The second-device message is ignored. Its level remains 1, pump false,
  metadata empty and watermark absent. Receipt remains START_TIME + 2000;
  its anchor remains the exact admission time START_TIME + 1000.
- The connection count remains one. The chosen existing start operation would
  replace once on membership change, then remain at two through the unchanged poll.
- Shutdown suppresses the subsequent message through the real ownership guard.

The failure is the explicit public-state assertion. It is not strict mock
dispatch or verification, fixture, compilation, import, TypeError, missing
target, filtering, skip or cancellation. The forbidden command/removal ports
and exact inventory/trust callbacks have explicit verification after public
assertions, as does every created transport-operation mock.
Canned REST and credential answers remain typed stubs. Logging stays silent.

### Native results and preparation attempts

All commands completed serially in the existing linked feature checkout with
workflow.use_worktrees=false, Node v26.11.1 and npm 11.20.0.
No additional checkout, branch, recovery sentinel or dependency was created.
Native directory: `/private/tmp/guardian-04-account-022-red/`.
Each command retains exact argv, raw exit, real UTC start/end, source HEAD,
source/owner blobs, complete separate stdout/stderr and its full active patch.
Complete before/current owner bytes and the 44-file production manifest remain.

| Native record | Actual command or scope and raw result |
| --- | --- |
| before.json, guard.json | Clean HEAD 1055218, empty index/status, 44 production and 695 file/symlink identities; exact three-path Fallow guard before edits or formatting, exit 0. No boundary zones/rule packs configured. |
| owner-format.json | First exact owner Prettier, exit 0; complete post-format candidate bytes/patch retained. The original insertion remains in the tool patch, without a separate pre-format file capture. |
| owner-lint.json | First uncached owner ESLint, exit 1 for new-case array notation, indentation and padding. Full streams and original candidate bytes/patch retained. |
| build.json | First fresh npm run build:test, exit 0. No native test ran on that candidate. |
| lint-fix.json, format-final.json, lint-final.json | Serial exact-owner lint fixing, formatting and final uncached lint; each exit 0. Every mutating process completed before the next command. |
| build-final.json | Fresh npm run build:test, exit 0, 16:01:04.249283–16:01:07.283976 UTC. |
| target.json | Native TAP exact anchored title above, exit 1; one executed intended assertion failure, zero skip/cancel/todo, 16:01:07.369312–16:01:07.695318 UTC. |
| owner.json | node --test --test-reporter=tap dist-test/test/runtime/accountRuntime.test.js, exit 1; 157 tests, 156 pass and only the new assertion fails, zero skip/cancel/todo, 16:01:17.360171–16:01:17.792340 UTC. |
| assemble.json, classifications.json | Complete old-root preservation and SAME installed classifyRedEvidence recursively over all fourteen records; exit 0, every verdict RED_EVIDENCE_OK, actual source Git blobs verified. |
| installed-gate.json | Installed check tdd-red-evidence on the actual on-disk pair with GSD_RUNTIME=codex and --raw; exit 0, RED_EVIDENCE_OK. |

The exact named command uses node --test --test-reporter=tap,
`--test-name-pattern=^adds a later discovered device to live shadow routing without reconnecting unchanged inventories$`,
and the compiled account owner. Native TAP remains complete and untouched in
both the JSON records and separate stdout files. Build output is separate.
The initial shell invocation used unavailable `python` and exited 127 before
snapshot or guard. Its exact tool stderr and command are retained separately
in preparationAttempts. The corrected invocation uses installed python3.
No UTC is invented for that first tool-only failure.
All preparation attempts retain their actual meaning; none is intended RED.
Both actual native test runs reach the same intended assertion.
Mutating-tool records identify their completed output bytes and patch.
Their pre-command candidate bytes were not separately captured for the first
formatter and lint-fix invocation; the exact edits remain in the tool record.
This preparation provenance limit does not replace either complete native RED
run: both ran on the same saved final owner with a fresh preceding build.

### Immutable history, production and prior owner

Source HEAD remains `105521860844e2c8fc0f04ab917019e9bcf6f564`.
Account source remains blob `334537d18395e5f234bb346e2a993852ab80f730`.
All 44 production files remain byte-identical to that commit, including shadow.
Original owner is `5ff214b9d474fde7da84a26844663e34d5cd4aef`.
Active owner is `6c5489e0836a084fc93650e937ef000410615d7d`.
Removing only the new standalone case and its two import adjustments reproduces
the entire original owner byte for byte. Every earlier assertion, both 023
terminal rows, the full two-device 021 regression, exact 024, all 025 literal
timer/deadline assertions and its stronger 013 verification remain unchanged.
Both contract helpers, all existing contracts and negative controls stay exact.

The pair JSON root contains the complete full-owner native run and active patch.
Its priorEvidence[0] is the ENTIRE original twelve-record root from immutable
blob `822f393d3a0f37667cb8024e314a8ddd7ca7e993`, deeply verbatim.
The exact old raw JSON is retained in priorEvidencePreservation as well.
The other archive is this case's complete named-target run.
Total recursive records are **14 = 12 preserved + 2 new**.
The saved root regressionPatch equals the entire active owner diff exactly.
The SAME installed classifyRedEvidence accepts every old/new record as
RED_EVIDENCE_OK; the current CLI separately accepts the actual on-disk pair.
Independent semantic assessments retain every original narrower preliminary
025 timing and 023 immediate-trust attempt without relabeling it.
Every recorded sourceCommit resolves to its actual account source Git blob.
No second parser, partial history or alternative evidence-path gate is used.

### Terminal checkpoint and bounded next action

Exactly three repository paths change: account owner, this report and pair RED JSON.
No production, real shadow owner, helper, seed, plan, summary, configuration or shared record changes.
Complete current account source/owner and full prior ACCOUNT report were read
through bounded contiguous ranges before edits, with complete AGENTS, bootstrap,
all five books and the amended 08 plan including dependency and tail.
Current protocol, context, research, patterns, findings, 07/11 summaries,
canonical decisions and applicable locked-state boundaries were loaded.
Actual shadow start/replacement/routing/readiness/current-close operations,
its owner examples and platform/World composition callers were inspected.
No existing public/shared/private alias/member shape or signature changes.
No exact private-target deletion exception or fake-equivalence claim follows.

The minimum proposed GREEN repair reconciles the existing shadow client's
tracked physical device membership through its existing start operation only
when membership changes. An unchanged poll must not reconnect. Preserve
post-await lifecycle ownership, current connection handling and existing
credential rotation, with no new external API or reconnect policy.
This proposal fits existing task 04-08-01 and needs no external edit or new task.
Any wider dependency still requires the parent's concrete sequential cause plan first.

The parent alone commits complete planning evidence after the required clean
pre-step and ordinary foreground hooks BEFORE any GREEN edit or code staging.
The failing active owner remains unstaged. The classifier's generic GREEN
message does not establish that parent commit or authorize skipping it.
No production control, direct-coverage pass, full npm run check, staging,
commit, repair, closure, correction or ancillary summary occurred here.
RUN-01 remains Pending. D-03 and all historical OPEN/unwaived limits continue.

## CR-04-ACCOUNT-022: current physical shadow membership

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_trust/account_022_green`, on 2026-10-15.
Disposition: **fixed: requires human verification and independent full ACCOUNT correction**.
The complete previous report remains an exact byte prefix.
All 29 original IDs, initial 18 BLOCKER/11 WARNING counts and ACCOUNT
correction counter **0** continue. This is no independent correction or closure.

### Minimum repair and public observations

`attemptShadow` retains the physical IDs from its last successful current start.
It compares set cardinality and membership, independently of enumeration order.
An existing client with unchanged membership returns without starting again.
Changed nonempty membership calls that SAME client's existing `start(deviceIds)`.
The real shadow client replaces its owned connection, rebuilds all routes and
requests each complete shadow through its existing public contract.
The runtime records the new set only after start resolves and the existing
post-await lifecycle guard passes. That guard still closes a late client.
Credential rotation keeps the existing mutable cache and leaves membership alone.
The existing no-device guard remains: an empty account opens no connection.
Confirmed-removal pruning, root cancellation, terminal halt, live ingress,
canonical watermarks, per-device silence and identity policy stay unchanged.

The saved 022 regression passes without changing a single byte or assertion.
It uses the real shadow client over an offline injected transport.
It establishes startup readiness before discovering the second physical device.
It observes the complete six-topic replacement and both complete-shadow gets.
The next unchanged poll retains exactly two transports.
Both devices' live messages produce independent complete canonical snapshots
and exact new arrival anchors. Shutdown suppresses later ingress.
Both account and keyed-device trust answers retain all expected fields.
Every prescribed transport, inventory, trust, removal and command mock is verified.

One additional standalone public case checks the same two physical IDs in reverse order.
The real canonical store remains behind a typed `DeviceStateStore` port whose
`deviceIds` enumeration reverses after startup; the later REST response reverses too.
The whole observation independently expects both complete snapshots, exact anchors,
the reversed public ID order and exactly one original `start([first, second])`.
A strict lifecycle mock permits that one start and the normal close.
The start recorder records before delegation, so a caught unexpected call remains visible.
This protects physical membership against a positional-list comparison.
No shared helper, public API, private accessor, test mode or source control is added.

### Exact input preservation and genuine ancestry

Pre-edit HEAD was evidence-only `5987504236d4292d05cb3b1c50ac4a4ce1197a9f`.
Its parent is actual source `105521860844e2c8fc0f04ab917019e9bcf6f564`.
Both retain account production blob `334537d18395e5f234bb346e2a993852ab80f730`.
The evidence commit changes ONLY this report and the pair RED JSON.
It precedes every production edit in this cause; the active failing owner was unstaged.
Its native full-owner RED remains 157 cases, 156 pass and one intended
ERR_ASSERTION/deepStrictEqual failure after successful real-shadow startup readiness.

The pair RED retains immutable blob `b3f7141fc652706628ec55c5bd5c1a3e4b560319`.
The installed CLI accepts the actual on-disk file as RED_EVIDENCE_OK.
The SAME installed `classifyRedEvidence` recursively accepts all fourteen records.
Every recorded sourceCommit/sourceBlob resolves through actual Git objects.
The entire preceding twelve-record root remains deep-equal to immutable blob
`822f393d3a0f37667cb8024e314a8ddd7ca7e993`; its embedded raw JSON is byte-exact.
The root native output equals the retained complete owner.stdout byte for byte.
All narrower preliminary timing and immediate-trust attempts retain their meaning.
The RED preparation's missing separate pre-first-formatter/lint-fix candidate
captures remain disclosed above. No historical capture or waiver is invented.

Before the added order case, the entire GREEN owner exactly matched the saved
active owner `6c5489e0836a084fc93650e937ef000410615d7d` and regressionPatch.
After removing ONLY that new case, the complete final owner still matches those bytes.
The immutable saved patch therefore differs from the current patch solely by
the additive order case. Full saved/current owners and the exact added body
remain side by side in implementation-final.json.
Original 024, all literal 025 deadlines/timer assertions and stronger 013 verification,
both terminal 023 rows, the complete two-device 021 callback/neighbor regression,
all prior assertions, adapter contracts and negative controls remain byte-exact.
No saved record or assertion is weakened or rewritten.

### Reads, verification location and native records

The complete 1332-line account source, 7839-line active owner and 3716-line report
were read before editing through bounded contiguous ranges.
Complete AGENTS, bootstrap, all five project books, amended 04-08 including its
dependency and tail, current protocol, CONTEXT, RESEARCH, PATTERNS, FINDINGS,
07/11 summaries, canonical decisions and applicable locked STATE were loaded.
The actual real shadow source and complete owner were read, including current
connection, start/replacement, routing, readiness, get and close behavior.
Actual account callers were traced through openShadow, retryShadow, runPoll,
refreshCredentials and lifecycle entrypoints; platform and both World compositions
were inspected. Both complete approved headers and `.js` imports remain intact.
No existing name, signature, public/shared field, mutability, visibility or
private alias/member changes or deletion triggers D-06 contract-impact requirements.

Every command ran serially in the existing linked features/code-review-sweep checkout,
with workflow.use_worktrees=false, Node v26.11.1 and npm 11.20.0.
No checkout, branch, recovery sentinel, package or repository helper was created.
Native directory: `/private/tmp/guardian-04-account-022-green/`.
Each command retains exact argv, raw exit, real UTC start/end, HEAD, input blobs
and complete separate stdout/stderr. Before/after bytes and full dirty diffs remain.
The 695-file/symlink manifest comparison preserves every nonowned tracked input
and the untracked inventory. Reconciliation and both concern helpers stay unchanged.

| Native record | Actual scope and raw result |
| --- | --- |
| before.json, guard.json | Expected feature HEAD, empty index and active-owner-only initial diff; exact three-path guard before any repository edit/formatter, exit 0, no configured zones/rule packs. |
| evidence-gate.json, history-before-edit.json | Installed current RED CLI and SAME recursive classifier before GREEN, exit 0; all fourteen accepted, entire prior root/raw and original active patch exact. |
| build-final.json | Fresh npm run build:test, exit 0, 16:15:15.415068–16:15:18.436479 UTC. |
| owner-final.json | Full native TAP account owner, exit 0; 158 pass, zero fail/cancel/skip/todo, 16:15:20.161854–16:15:20.608973 UTC. |
| direct-final.json | Exact npm run test:coverage:direct account source/owner selector, including fresh build, exit 0. |
| native-coverage-final.json | Full owner, exact-source include and all three 100% thresholds, exit 0; native compiled 1004/1004 lines, 58/58 functions, 187/187 branches. accountRuntime-final.lcov retained. |
| lint-final.json | Exact source/owner ESLint, max warnings 0, no cache, exit 0. |
| implementation-final.json, history-final.json | Minimum source edits plus formatter-only callback indentation; entire prior owner exact after removing one additive case; all fourteen RED records accepted, exit 0. |
| audit-final.json | Fallow audit against actual ACCOUNT base e6f49a59671c13a20b696b7f46e38406a36aeec0, JSON/quiet/explain, exit 0, verdict pass. |
| pre-step-1.json | Exact three-path SKIP=npm-check pre-commit, exit 0, clean with no formatter change, 16:16:30.097768–16:16:32.998875 UTC. Repeated after this appendix before staging. |

All executable checks passed their first candidate.
The initial unchanged-regression owner had 157 pass and native 186/186 branches.
The additive order observation required fresh build, full owner, direct coverage,
native LCOV and uncached lint; all passed on the final 158-case owner.
Both actual branch denominators remain retained; neither replaces historical results.
All mutating tool sessions completed before the next edit/build.
No failed native attempt, full npm run check or new assertion control is claimed.
Selected pairs do not refresh merged all-pair source-mapped LCOV.
The parent owns the later combined-wave and phase gates.

### Atomic commit and remaining scope

The commit introducing this appendix and both account files is titled
`fix: reconcile live shadow membership after discovery`.
Only source, mirrored owner and this report enter that atomic cause commit.
The exact three-file clean pre-step repeats after the final report content,
then authorized linked-Git staging and a normal foreground commit run hooks.
Native staged-scope and actual postcommit objects establish the hash and paths.
No manual stash, wrapper, amend, hook bypass, rebase or history rewrite is used.

Only original 022 is implemented here, pending human verification and full correction.
Remaining 04-08 IDs are 018, 019, 020 and 026; the 04-09 causes remain pending.
T-04-15 retains reported ingress and physical identity within existing boundaries.
No security-relevant surface outside the existing threat model is introduced.
RUN-01 remains Pending. All 29 IDs, counter 0, D-03 and historical OPEN/unwaived limits continue.
No plan, evidence JSON, shared ledger, summary, STATE, ROADMAP, REQUIREMENTS,
WINDOWS, configuration or external subsystem path was edited.
The parent retains shared-state, full-gate and final worktree-setting restoration duties.

## CR-04-ACCOUNT-018: complete retained canonical observations

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_trust/account_018_snapshots`, on 2026-10-15.
Disposition: **implemented; pending independent full ACCOUNT correction**.
The complete preceding report remains an exact byte prefix.
All 29 original IDs, initial 18 BLOCKER/11 WARNING counts and ACCOUNT
correction counter **0** continue. This is assertion maintenance, with no
production bug, correction round, independent closure or partial clean verdict.

### Missing observations and narrow changes

Fifteen existing authored cases gain complete independent canonical expectations.
Thirteen cover polling, rejected polling, shadow ownership, silence handover,
metadata-only ingress, live recovery and the two-device handover boundaries.
The failed-poll case independently pins its present baseline and final readback;
its original before/after comparison remains as an additional assertion.
The unchanged-heartbeat case now pins its complete canonical readback as well
as its existing trust and no-subscriber-notification promises.

The four generated disconnect reasons share one strengthened authored case.
Each now requires a present snapshot containing exact identity, connectivity,
retained telemetry, metadata, absent watermark, device timestamp and receipt.
The setup supplies nonempty metadata and a receipt 123 ms after admission.
The device timestamp remains distinct from local receipt and elapsed time.
The complete snapshot and its identity, connectivity, data and metadata must
remain frozen. The original optional watermark assertion remains unchanged.

One new standalone case drives the public reported-patch callback through
accepted telemetry at version 7, metadata-only version 9, refused telemetry
and metadata at version 8, and an observation-free version 10.
Independent whole expectations require omitted values to remain, metadata to
merge separately, the watermark to order messages, and receipt time to advance
only for an observation. Refused input preserves the canonical readback and
the exact preceding snapshot reference. An observation-free callback advances
the existing watermark while retaining the last receipt and device timestamp.
The final whole readback and nested telemetry/metadata records remain frozen.
These assertions preserve opaque canonical values; they add no family decoding,
normalization, invalid-field policy or desired-state authority.

All original assertions remain in their original cases and order.
Of 142 pre-edit authored declarations, 127 remain byte-exact and 15 gain the
bounded observations above. The new case produces 143 authored declarations
and 159 executed tests. Original 024, stronger 025 with every literal deadline,
both terminal 023 rows, the full 021 callback/neighbor case, real-shadow 022,
its additive order case, contracts and negative controls remain byte-exact.
Earlier 012 removal expectations already cover their canonical baseline;
this cause changes neither those cases nor original 019/020's remaining scope.
No expected answer comes from production computation or a harness projection.

### Separate assertion maintenance control and restoration

The plausible wrong behavior deletes canonical devices on disconnection
instead of releasing only their ownership watermark. The old optional
undefined-watermark assertion accepts that destruction. Compilation and direct
coverage do not establish retained state.

The temporary control replaces only the disconnect loop's
`options.store.releaseShadowSource(deviceId)` with `options.store.remove(deviceId)`.
Its fresh build exits 0. The exact named target is
`the degraded monitoring path SYNC-03 hands telemetry back to the poll when the connection reports transport-closed`.
Native TAP executes one test and fails its intended new deepStrictEqual:
actual is undefined; expected is the complete retained snapshot, including
firmware v9 and receipt 1787918400123. ERR_ASSERTION/AssertionError and the
deepStrictEqual operator identify the failure. There are zero skips,
cancellations or todos. No setup, import, TypeError or mock refusal supplies it.

The source is restored through Git and compared byte for byte with the saved
full source. Before/restored blob is ec7a77182bb5b222c5fe945abe3b4c67912d5781;
control blob is 9e36f56457daca0b6fb82445565eb1bc8da88d83.
The complete source diff is empty. Fresh restored build, named targets and full
owner pass. The final disconnect case and complete helper prefix remain exact
to the control's inputs. Later literal-only expected flood values affect other
cases; their final full-owner, direct, LCOV and uncached lint checks repeat.
No control mutation enters Git or the genuine RED history.

### Reads, verification location and native evidence

Pre-edit HEAD is 30f944c6dc89a91fd21d0875bfbec69b30a45358, on features/code-review-sweep,
with clean tree and empty index. Complete AGENTS, bootstrap, all five project
books, amended 04-08 including task 03/tail, current protocol, CONTEXT, RESEARCH,
PATTERNS, FINDINGS, full ACCOUNT report, 07/11 summaries and canonical decisions
were loaded before edits, with applicable locked STATE boundaries.
The full 1340-line account source, 7948-line owner and canonical state source
and owner were read through bounded contiguous ranges.
Actual callers were traced through harness/factories, poll/applyDevices,
disconnect release and reported callbacks, plus platform and World store users.
Both complete approved headers and .js imports remain intact.
No public/shared/private alias/member shape, signature or visibility changes;
no contract-change impact exception is needed.

All commands completed serially in the existing linked feature checkout,
with workflow.use_worktrees=false, Node v26.11.1 and npm 11.20.0.
No checkout, branch, recovery sentinel, repository helper or package was created.
Native directory: `/private/tmp/guardian-04-account-018/`.
Every recorded command retains exact argv, raw exit, UTC start/end, HEAD,
Node/npm, separate complete stdout/stderr, full before/after tracked manifests,
owned file bytes, untracked inventory and dirty diffs. The initial manifest
covers 698 tracked file/symlink inputs. All nonowned tracked bytes remain exact.

| Native record | Actual scope and raw result |
| --- | --- |
| before.json, guard.json, guard-literal-expectations.json, guard-report.json | Clean initial snapshot; exact three-path guards before edits/formatter, exit 0, no configured zones/rule packs. |
| build-baseline.json, target-baseline.json, owner-baseline.json, lint-baseline.json | Fresh strengthened candidate build, both named targets, full 159-test owner and uncached lint, exit 0. |
| build-control.json, target-control.json | Temporary build 0; intended named whole-present-snapshot failure 1, 16:25:19.127234–16:25:19.437774 UTC. |
| restore-source.json, restoration-and-history.json, build-restored.json, target-restored.json | Exact full source restoration, same installed recursive history check, fresh build and both named targets GREEN, exit 0. |
| build-final.json | Fresh npm run build:test after independent literal expectations, exit 0, 16:27:32.547291–16:27:35.621986 UTC. |
| owner-final-literals.json | Full native TAP owner, exit 0; 159 pass, zero fail/cancel/skip/todo, 16:27:36.232820–16:27:36.696018 UTC. |
| direct-final-literals.json | Exact npm run test:coverage:direct account source/owner selector with fresh build, exit 0. |
| native-coverage-final-literals.json | Full owner, exact-source include and all three 100% thresholds, exit 0; 1004/1004 native compiled lines, 58/58 functions, 188/188 branches. accountRuntime-final.lcov retained. |
| lint-final-literals.json | Exact source/owner ESLint, max warnings 0, no cache, exit 0. |
| evidence-gate.json, history-final.json, provenance.json | Current installed RED CLI and SAME recursively invoked classifier, exit 0; all fourteen records accepted, prior root/raw exact, complete saved/current case comparison preserves every original assertion. |
| audit.json | Fallow audit against real ACCOUNT base e6f49a59671c13a20b696b7f46e38406a36aeec0, JSON/quiet/explain, exit 0, verdict pass. Authorized temporary linked-Git access used directly. |
| pre-step-1.json | Exact two-file SKIP=npm-check pre-commit, exit 0, clean with no formatter change, 16:28:20.860504–16:28:23.713255 UTC. Repetition follows this final report before staging. |

All executable checks passed; the only intentional native failure is the
separately labeled maintenance control. Formatting completed before the next
build; every yielded command reached terminal completion before later mutation.
Selected coverage does not refresh merged all-pair source-mapped LCOV.
No full npm run check runs here; the parent owns combined-wave and phase gates.

### Immutable history, commit and remaining scope

The genuine RED JSON remains b3f7141fc652706628ec55c5bd5c1a3e4b560319.
Its complete fourteen-record history, root native TAP, preceding twelve-record
root/raw JSON and every sourceCommit/sourceBlob remain exact and valid.
The saved 022 regression patch and active text remain exact; current differences
are only the previously additive order case and these bounded 018 additions.
Complete saved/current case bodies and diffs remain side by side in provenance.json.
Final owner blob is e16de10ab64ea9fb2ffee53be7a6193d40c48f93.

The atomic commit introducing this appendix is titled
`test: protect complete account snapshots during handover`.
Only test/runtime/accountRuntime.test.ts and this report are staged.
The exact two-file clean pre-step repeats after this final content before staging.
Authorized linked-Git staging and a plain foreground commit run normal hooks.
Actual native terminal records and postcommit Git objects establish completion,
hash, exact two paths, no deletion and clean tree/index. No wrapper, manual stash,
amend, hook bypass, rebase or history rewrite is used.

Only original 018 is implemented here, pending full independent ACCOUNT correction.
Remaining 04-08 causes are 019, 020 and 026; the declared 04-09 work remains.
T-04-15 preserves complete canonical ingress and physical identity observations.
No security-relevant surface outside the existing threat model is introduced.
RUN-01 remains Pending. Original IDs, counter 0, D-03 and historical OPEN/unwaived
limits continue. No evidence, plan, helper, external subsystem, summary, config,
STATE, ROADMAP, REQUIREMENTS, WINDOWS or central FINDINGS path changes.
The parent retains its full-gate, shared-state and final worktree-setting restoration duties.

## CR-04-ACCOUNT-019: trust at the quiet-device recovery boundary

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_trust/account_019_trust`, on 2026-10-15.
Disposition: **implemented; pending independent full ACCOUNT correction**.
The complete preceding report remains an exact byte prefix.
All 29 original IDs, initial 18 BLOCKER/11 WARNING counts and ACCOUNT
correction counter **0** continue. This is assertion maintenance, with no
production bug, independent correction, finding rejection or partial clean verdict.

### Existing implementation overlap and remaining gap

Original 012 at 0b86403ffecb4eac0794c7dc98bc9e4104b08daf already added
complete keyed trust observations to the converted diagnostic cases.
Original 013 at 95a99345e6f0e680c06ed322a1be7a5da82ff838 already prescribes
both complete callback arguments through exact-parameter strong mocks.
This includes the single-device cases that retain `silenceOf` as an additional
timing projection, and composition's supplied-listener case at current owner
line 7972. Its second argument contains the exact physical ID and all four
trust fields; the owning case explicitly verifies that listener.
No duplicate composition repair or removal of the useful projections is needed.
Original 018 at 7286cb9d9ca3957571481eedaaf56f843ca29544 independently
protects canonical snapshots and leaves this trust cause separate.

The existing D-14 quiet-pump recovery case, beginning at pre-edit owner line 6169,
still captured only a count at its important intermediate quiet/healthy split.
The installed strong-mock README states that different expectations can be
satisfied in any order (lines 658–660). Its complete allowed argument values
therefore do not attach each map to that checkpoint. The final keyed map
already has a complete independent expectation from 012.

Only that existing case changes. It now captures the complete account struct
and keyed device map at the quiet checkpoint, then independently compares
all four fields and both physical IDs after the actions finish.
The quiet device alone has shadowSilent=true. Its reporting neighbor remains
shadowSilent=false; REST remains trusted, commands ready and credentials accepted.
The final existing whole-map observation gains the account struct from the
same recovery boundary. Both device entries are healthy, while the account
continues to decline an account-wide silence answer.
All old count, no-extra-report, two-boolean, path, keyed-map, command-absence
and explicit mock-verification assertions remain in the same case and order.
Every other case and the complete support prefix remain byte-identical.
No expected answer comes from production or a harness computation.

### Separate assertion maintenance control

The plausible wrong public behavior forwards valid device trust maps at the
wrong poll checkpoints. Complete callback values and multiplicities alone,
compilation, lint and direct coverage do not establish checkpoint timing.
The temporary source control changes only the forwarded first-device silence
on a two-device account: it reports silence after one poll interval and
healthy after two. It leaves the internal health, recovery latch, diagnostics,
canonical state, account fields, neighbor, report count and final recovery alone.
Thus the set of permitted callback values still contains every expected value.
This control is separate from genuine production RED history.

The fresh control build exits 0. The exact named D-14 recovery target executes
one test and fails the new intermediate deepStrictEqual with AssertionError
and ERR_ASSERTION: actual first-device shadowSilent=false, expected=true.
Zero tests are skipped, cancelled or marked todo. The failure is the intended
checkpoint assertion, not a mock refusal, setup, import or TypeError.
The native record does not claim that the old owner was separately run against
this control; the installed mock semantics and retained old assertions identify
the missing discriminator.

The full source was restored through Git and compared byte for byte.
Before/restored blob is ec7a77182bb5b222c5fe945abe3b4c67912d5781;
control blob is 09fe8fe65c27ef01c1f59f209f3d613e0663e084.
The source diff is empty. A fresh rebuilt named target passes after restoration.
The final owner is eb297df730787f15cb0fdcc10beabefe5d57269e and matches
the control target's owner bytes exactly. No control mutation enters Git.

### Reads, current checks and verification location

Pre-edit HEAD is 7286cb9d9ca3957571481eedaaf56f843ca29544 on features/code-review-sweep,
with clean tree and empty index. The bootstrap, complete AGENTS and all five
complete project books were loaded, including the additional unit reviewer.
The amended 04-08 plan including task 03/tail, current protocol, CONTEXT,
RESEARCH, PATTERNS, FINDINGS, full ACCOUNT report, 07/11 summaries, canonical
decisions and applicable STATE boundaries were read through bounded ranges.
The complete 1340-line account source, 8187-line owner and monitoring-health
source/owner were read. Callers were traced from health projection through
runtime reporting/recovery and composition to platform fan-out, accessory
trust consumers and both Worlds. Both full approved headers remain intact.
No existing public/shared/private alias/member name, signature, field,
visibility or mutability changes; no contract-impact or deletion exception applies.

All checks ran serially in the existing linked feature checkout with
workflow.use_worktrees=false, Node v26.11.1 and npm 11.20.0.
No checkout, branch, recovery sentinel, package or repository helper was created.
Native directory: `/private/tmp/guardian-04-account-019/`.
Every recorded command retains exact argv, raw exit, UTC start/end, HEAD,
Node/npm, complete separate stdout/stderr, before/after tracked manifests,
owned file bytes, untracked inventory and full dirty diffs.
The initial manifest covers 698 tracked file/symlink inputs.

| Native record | Actual scope and raw result |
| --- | --- |
| before.json, guard.json, guard-report.json | Clean initial snapshot; exact three-path guards before edits, exit 0, no configured zones/rule packs. |
| resolver-full.json | Fresh Codex fixer resolution, exit 0: model empty/omitted, effort high, tier opus. |
| build-baseline.json, target-baseline.json | Fresh strengthened owner build and exact named target, exit 0. |
| build-control.json, target-control.json | Temporary build 0; intended named whole intermediate-trust assertion failure 1, 16:36:21.399219–16:36:21.694971 UTC. |
| restore-source.json, restored-inputs.json, build-restored.json, target-restored.json | Exact full source restoration, manifest comparison, fresh build and named GREEN, exit 0. Restored build 16:36:34.897290–16:36:37.944821 UTC. |
| owner-final.json | Full native TAP owner, exit 0, 159 pass, zero fail/cancel/skip/todo, 16:36:47.146475–16:36:47.593159 UTC. |
| direct-final.json | Exact account source/owner test:coverage:direct selector, including fresh build, exit 0. |
| native-coverage-final.json | Full owner, exact-source include and all three 100% thresholds, exit 0: 1004/1004 native compiled lines, 58/58 functions, 188/188 branches. accountRuntime-final.lcov retained. |
| lint-final.json | Exact source/owner ESLint, max warnings 0, no cache, exit 0. |
| evidence-gate.json, history-final.json, provenance.json | Installed current RED CLI and SAME recursively invoked classifier, exit 0: all fourteen accepted, prior twelve-record root/raw and native TAP exact; saved/current patch and case comparisons retained. |
| audit.json | Fallow audit against real ACCOUNT base e6f49a59671c13a20b696b7f46e38406a36aeec0, JSON/quiet/explain, exit 0, verdict pass. Authorized temporary linked-Git access used directly. |
| pre-step-1.json | Exact two-file SKIP=npm-check pre-commit, exit 0, clean without formatter changes, 16:38:25.708870–16:38:28.874393 UTC. Repetition follows this report before staging. |

Every executable check passed; the separately labeled control is the intended
failure. Initial read-only discovery attempts used one absent temporary script
path and two unavailable resolver-search paths; their tool errors supplied no
test or provenance result. The actual script and registered resolver were then
read and used successfully. No failed build, test preparation or gate is hidden.
Every mutating process completed before the next edit/build.
Selected coverage does not refresh merged all-pair source-mapped LCOV.
No full npm run check runs here; the parent owns combined-wave and phase gates.

### Immutable history, atomic commit and remaining scope

The genuine RED JSON remains b3f7141fc652706628ec55c5bd5c1a3e4b560319.
All fourteen complete records, preceding twelve-record root/raw, original native
TAP, sourceCommit/sourceBlob identities and genuine ancestry remain exact.
The saved 022 patch remains unchanged; current owner differences retain the
previous additive order case, 018 observations and this one bounded case change.
Exact reversal of only these additions reproduces the entire pre-edit owner.
Original 024, every literal 025 deadline and stronger verification, both 023
terminal rows, full 021 callback/neighbor case, real-shadow 022 and order case,
018 whole snapshots/frozen/refused readbacks, contracts and negative controls
remain byte-identical. All nonowned tracked bytes and untracked inputs match.

The atomic commit introducing this appendix is titled
`test: pin per-device trust at recovery checkpoints`.
Only test/runtime/accountRuntime.test.ts and this report are staged.
The exact two-file clean pre-step repeats after this final content before staging.
Authorized linked-Git staging and a plain foreground commit run normal hooks.
Terminal native records and actual postcommit Git objects establish the hash,
exact paths, no deletions and clean tree/index. No wrapper, manual stash,
amend, hook bypass, rebase or history rewrite is used.

Only original 019 is implemented here, pending independent full ACCOUNT correction.
The existing 012/013 overlap supplies its already implemented portions without
duplicated changes or rejecting the original finding. Remaining 04-08 causes
are 020 and 026; declared 04-09 work and full ACCOUNT correction remain pending.
T-04-15 retains narrow per-device trust and physical identity observations.
No security-relevant surface outside the existing threat model is introduced.
RUN-01 remains Pending. Original IDs, counter 0, D-03 and historical OPEN/unwaived
limits continue. No evidence, plan, helper, external subsystem, summary, config,
STATE, ROADMAP, REQUIREMENTS, WINDOWS or central FINDINGS path changes.
The parent retains full-gate, shared-state and final worktree-setting restoration duties.

## CR-04-ACCOUNT-020: retained removal state and surviving arrival anchors

Implemented by typed `gsd-code-fixer`, task
`/root/phase4_account_trust/account_020_removal`, on 2026-10-15.
Disposition: **implemented; pending independent full ACCOUNT correction**.
The complete preceding report remains an exact byte prefix.
All 29 original IDs, initial 18 BLOCKER/11 WARNING counts and ACCOUNT
correction counter **0** continue. This is assertion maintenance, with no
production bug, independent correction, rejection or partial clean verdict.

### Existing overlap and the remaining observations

Original 012 already independently pins the refused target's complete snapshot,
exact anchor and later removal retry, with complete diagnostic expectations.
Original 021 already observes both complete device snapshots, anchors, account
trust and keyed trust inside the successful removal callback before pruning.
It then requires only the target to disappear and the exact neighbor to remain.
Those cases and every original assertion remain unchanged by this cause.

Two existing cases gain the remaining observations; no new case or helper is added.
The two-refusal case now records complete ordered physical IDs, both snapshots,
both distinct restored timestamps, account trust and keyed device trust inside
each callback and after both refusals. The second callback also observes the
state retained after the first refusal. Both exact snapshots and anchors survive
both failed removals. A new unsorted attempt assertion pins first-device then
second-device order; the existing sorted assertion and all diagnostic checks remain.

The final stray-message case now retains a second physical device in every
later inventory. It captures complete state before confirmation, inside the
successful callback, after removal and after a later departed-device message.
The callback still sees the target and both exact anchors. Only the target's
snapshot, physical ID, anchor and keyed trust disappear after success.
The neighbor retains its complete canonical value, independently specified
receipt at START_TIME + 3592000, and restored anchor START_TIME - 456.
The departed target's restored anchor is independently START_TIME - 123.
The stray message recreates neither snapshot nor anchor and emits no trust report.
The original anchor-presence assertion remains as an additional observation.

Every action and checkpoint capture finishes before the new assertions run.
Independent literal expectations include every snapshot and all four trust fields.
Existing exact removal/command mocks remain explicitly verified. The expanded
stray case adds an exact-parameter, finite monitoring callback mock and verifies it.
Its three pre-stop reports and lack of a fourth report after stray ingress are
observed separately from shutdown's unready-command report. Logging stays silent.

### Separate assertion control and exact restoration

The plausible wrong behavior removes every surviving device's anchor alongside
the confirmed target. The old single-device presence checks, compilation and
direct coverage cannot distinguish that collateral deletion.
The temporary source adds only a loop over the remaining canonical IDs after
the target's existing anchor cleanup, forgetting each remaining anchor.
No production API, private alias/member shape or signature changes.

Fresh compilation passes. The exact named final stray-message target executes
one test and fails the new combined trackingAtRemoval/afterStray deepStrictEqual.
Actual anchors are empty; expected is the surviving second device at
1787918399544. Complete before-removal and inside-callback assertions pass first.
Native AssertionError, ERR_ASSERTION and deepStrictEqual identify the intended
failure, with zero skip/cancel/todo. No mock refusal, setup, import, compiler
error or TypeError supplies this maintenance control. It is not genuine RED.

The entire source is restored through Git and compared byte for byte.
Before/restored blob is ec7a77182bb5b222c5fe945abe3b4c67912d5781;
control blob is 7d102fca63566259892d48256f5f9dd2830407d6.
The source diff is empty. Fresh restored build and both strengthened named
targets pass. The final owner matches the control owner's complete bytes at
81f236dc8c3bd74b2836f8fd85fe6bdeb8b7cb43. No control enters Git.

### Reads, native evidence and verification location

Pre-edit HEAD is 3a9c44104c863631608ec2932d5543630e58957c, on features/code-review-sweep,
with clean tree and empty index. Bootstrap, complete AGENTS and all five complete
books were loaded. The amended 04-08 plan including dependency/tail, protocol,
CONTEXT, RESEARCH, PATTERNS, FINDINGS, complete ACCOUNT report, 07/11 summaries,
canonical decisions and applicable STATE boundaries were read.
The full 1340-line account source and 8197-line owner were read in contiguous
bounded pages, as were reconciliation and arrival-anchor sources and owners.
Actual runtime, health, platform and both World removal/anchor callers were
traced before edits. Both approved complete headers remain intact.
No shared/public/private alias/member name, shape, visibility or signature
changes or deletion triggers a contract-impact query. No trace exception is used.

All checks completed serially in the existing linked feature checkout with
workflow.use_worktrees=false, Node v26.11.1 and npm 11.20.0.
No checkout, branch, recovery sentinel, repository helper or package was created.
Native directory: `/private/tmp/guardian-04-account-020/`.
Every recorded check retains exact argv, raw exit, UTC start/end, HEAD, Node/npm,
complete separate stdout/stderr, full before/after tracked manifests, owned
file bytes, untracked inventory and dirty diffs. The manifest covers 698 inputs.

| Native record | Actual scope and raw result |
| --- | --- |
| before.json, guard*.json | Clean initial snapshot and exact three-path guards before edits/formatters; exit 0, no configured zones/rule packs. |
| resolver.json | Fresh Codex fixer resolution, exit 0: model empty/omitted, effort high, tier opus. |
| build-baseline.json, target-baseline.json | Fresh build and both strengthened existing cases, exit 0. |
| build-control.json, target-control.json | Temporary build 0; intended named whole-survivor-anchor assertion failure 1, 16:47:21.913419–16:47:22.214562 UTC. |
| restore-source.json, restored-inputs.json | Exact complete Git source restoration, unrelated tracked bytes and prior report prefix, exit 0. |
| build-restored.json, target-restored.json | Fresh restored build and both named targets GREEN, exit 0; build 16:47:36.783098–16:47:39.677473 UTC. |
| owner-final.json | Full native TAP owner, exit 0, 159 pass, zero fail/cancel/skip/todo, 16:47:48.062675–16:47:48.495803 UTC. |
| direct-final.json | Exact account source/owner test:coverage:direct selector, including fresh build, exit 0. |
| native-coverage-final.json | Full owner, exact-source include and all three 100% thresholds, exit 0: 1004/1004 native lines, 58/58 functions, 188/188 branches. accountRuntime-final.lcov retained. |
| lint-final.json | Exact source/owner ESLint, max warnings 0, no cache, exit 0. |
| evidence-gate.json, history-final.json, provenance.json | Current installed RED CLI and SAME recursive classifier, exit 0: all fourteen records accepted; original twelve-record root/raw, native TAP and saved regression patch exact. |
| audit.json | Fallow audit against actual ACCOUNT base e6f49a59671c13a20b696b7f46e38406a36aeec0, JSON/quiet/explain, exit 0, verdict pass. Authorized temporary linked-Git access used directly. |
| pre-step-1.json | Exact two-file SKIP=npm-check pre-commit, exit 0, clean without formatter changes, 16:49:30.583240–16:49:33.228165 UTC. Repetition follows this appendix before staging. |

All executable candidates passed; the separate maintenance control is the only
intended test failure. Earlier read-only shell discovery had an unmatched glob;
its tool error supplied no provenance or test evidence. Some broad read outputs
were truncated; bounded follow-up reads supplied the affected required content.
No failed build, owner, lint or verification attempt is hidden.
Every mutating process completed before the next edit/build.
Selected coverage does not refresh merged all-pair source-mapped LCOV.
No full npm run check runs here; the parent owns combined-wave and phase gates.

### Immutable history, atomic commit and remaining scope

The genuine RED JSON remains b3f7141fc652706628ec55c5bd5c1a3e4b560319.
All fourteen complete records, prior twelve-record root/raw JSON, original TAP,
sourceCommit/sourceBlob identities and genuine ancestry remain exact.
There are still 143 authored cases. The other 141 cases and all support outside
these two changed cases remain byte-identical. Parsed assertion comparison
confirms every original assertion in both changed cases remains in its order.
Original 024, stronger 025 with every literal deadline, both 023 terminal rows,
full 021 callback/neighbor proof, real-shadow 022 and order case, 018 whole
snapshots/frozen/refused readbacks, 019 checkpoints, contracts and negative
controls remain byte-identical. All nonowned tracked bytes and untracked inputs match.

The atomic commit introducing this appendix is titled
`test: protect removal tracking and surviving arrival anchors`.
Only test/runtime/accountRuntime.test.ts and this report are staged.
Exact two-file clean pre-commit repeats after this final content before staging.
Authorized linked-Git staging and a plain foreground commit run normal hooks.
Terminal native records and actual postcommit Git objects establish its hash,
exact paths, no deletions and clean tree/index. No wrapper, manual stash,
amend, hook bypass, rebase or history rewrite is used.

Only original 020 is implemented here, pending independent full ACCOUNT correction.
Existing 012/021 overlap supplies the already implemented portions without
duplicated scenarios or rejection of the original finding. Remaining 04-08 work
is original 026 and its parent-owned external planning checkpoint.
Declared 04-09 work and full correction remain pending. T-04-16 retains exact
physical identity, callback-before-prune and neighbor preservation boundaries.
No security-relevant surface outside the existing threat model is introduced.
RUN-01 remains Pending. Original IDs, counter 0, D-03 and historical OPEN/unwaived
limits continue. No evidence, plan, helper, external subsystem, summary, config,
STATE, ROADMAP, REQUIREMENTS, WINDOWS or central FINDINGS path changes.
The parent retains full-gate, shared-state and final worktree-setting restoration duties.

## CR-04-ACCOUNT-026: true platform owner RED checkpoint

Prepared by typed `gsd-code-fixer`, task
`/root/phase4_account_trust/account_026_platform_red`, on 2026-10-15.
This appendix records active unchanged-production RED preparation only.
Original 026 remains **unimplemented** pending the parent evidence commit,
runtime dependency, platform integration and later independent full correction.
The entire preceding report remains an exact byte prefix.
All 29 original IDs, initial 18 BLOCKER/11 WARNING counts and ACCOUNT
correction counter **0** continue. No correction or partial clean verdict occurs.

### Public restored-cache regression

The new case at `test/platform.test.ts:688` is
`removes a restored device absent at startup only after healthy confirmations and a final inventory check`.
It uses only the existing public constructor, configureAccessory and registered
launch/shutdown listeners. Typed injected HTTP responses remain offline.
The existing Homebridge/HAP stand-in supplies the accessory constructor and HAP
objects through its API. The same supplied HAP namespace reaches the platform.
No new cast, production API, private accessor, helper or seed is introduced.

The platform constructs its runtime before cache restoration. The case restores
one synthetic physical deviceId with a cached flood value of 1, vendor name and
complete primary-pump observation record. ConfigureAccessory marks its existing
StatusActive false without changing those values. No canonical snapshot,
telemetry, fresh measurement, arrival stamp or normal condition is invented.

The initial healthy empty inventory supplies the first absence. The case checks
retention before the 300000-ms poll boundary. The second healthy empty inventory
is requested at that boundary. A potential third, final inventory response is
held so the case can also distinguish premature unregister from confirmed removal.
It releases that response unconditionally: it never waits for the final request
that the actual defect prevents. All actions and shutdown complete before ASSERT.

All three preservation assertions pass. The fourth, afterFinalAnswer
deepStrictEqual, executes and fails with AssertionError/ERR_ASSERTION.
Actual state retains the cached accessory UUID and an empty removal-state array.
Expected state has no cached accessory and exactly one unregister callback.
That callback must see the same accessory still in the platform map, the full
unchanged context, flood=1, stale active=false and three inventory requests.
Its exact plugin name, platform name and accessory argument are prescribed by
an exact-parameter, finite strong mock. Verification is explicit after the
independent public assertions. The intended failure precedes verification;
it is not a fixture, strict-dispatch, compiler, import, TypeError, filter,
skip, cancellation or permission failure. Logging is silent.

### Native evidence, preparation and verification location

All commands completed serially in the existing linked features/code-review-sweep
checkout with workflow.use_worktrees=false. No new checkout or branch was created.
Node v26.11.1 and npm 11.20.0 are recorded for every command.
Native directory: `/private/tmp/guardian-04-account-026-platform-red/`.
Each record retains exact argv, raw exit, real UTC start/end, source HEAD,
full before/after tracked manifests, index/status, blobs and complete separate
stdout/stderr. Complete source and owner bytes and full patches are retained.
Before every formatter invocation, full input bytes, patch and blob were saved;
the completed output bytes are saved separately. No mutating session overlapped.

| Native record | Actual scope and raw result |
| --- | --- |
| before.json, guard.json | Clean HEAD 3f4f1c3, empty index/status, 699 tracked file/symlink inputs and all 44 production identities. Exact three-path Fallow guard before any repository edit or formatter: exit 0, no configured zones/rule packs. |
| resolver.json | Fresh Codex fixer resolver: model empty/omitted, effort high, tier opus; exit 0. The same resolver was also queried before editing. |
| owner-format.json | Exact-owner Prettier, exit 0. Complete pre-format and post-format source/patch captured. |
| owner-lint.json, build.json | First uncached lint exits 1 solely for a required blank line; first fresh build exits 0. No test ran on those preparation bytes. |
| owner-lint-final.json | Corrected exact-owner uncached ESLint, max warnings 0; exit 0. |
| build-final.json | Fresh npm run build:test, exit 0, 17:12:50.964247–17:12:54.026983 UTC. |
| target.json | Exact fully qualified anchored named native TAP target, exit 1: one executed intended assertion failure, zero skip/cancel/todo, 17:12:54.659373–17:12:55.093336 UTC. |
| owner.json | node --test --test-reporter=tap dist-test/test/platform.test.js, exit 1: 64 tests, 63 pass, only the new case fails, zero skip/cancel/todo, 17:12:59.784161–17:13:00.206026 UTC. |

The named argv uses the full `BasementGuardianPlatform` suite and exact case
title, with native TAP and the compiled platform owner. Both complete native
runs reach the same intended assertion on exactly the same final owner bytes.
The full npm build output remains separate from TAP. The initial lint failure
and its complete input/output remain preparation history, not genuine RED.
One artifact-transfer attempt exceeded the single-tool output capacity before
any repository write. Bounded contiguous transfer supplied the complete file;
the failed attempt remains separately recorded without invented timestamps.
Some broad read outputs were truncated; bounded follow-up reads supplied the
required complete context. Read-only missing/glob probes supply no test evidence.

### Separate pair history and unchanged inputs

The NEW declared file is
`.planning/phases/04-runtime-conformance/04-PLATFORM-RED-EVIDENCE.json`.
Its root retains the full-owner run. priorEvidence[0] retains the complete
earlier named run, with every field, native stream, full patch and source/owner
bytes. This new pair history contains exactly **two** intended RED records.
It preserves every platform native attempt in full; no failed setup is relabeled.
The installed CLI accepted the actual on-disk file as RED_EVIDENCE_OK, exit 0.
The SAME installed classifyRedEvidence recursively accepted both records as
RED_EVIDENCE_OK. Independent inspection confirmed the intended assertion,
complete native streams, exact active patch and actual Git source identities.

The separate ACCOUNT record remains byte-exact at
`b3f7141fc652706628ec55c5bd5c1a3e4b560319`, with all fourteen histories.
No ACCOUNT record is embedded, displaced or duplicated in the platform history.
Its SAME installed recursive classification accepted all fourteen records;
real sourceCommit/sourceBlob comparisons passed. The original 022 missing first formatter
input captures remain disclosed and unwaived; these new captures cannot repair them.

Source HEAD remains `3f4f1c3c8a9a732cd7a7711debbd7cb836611362`.
Platform source remains `7bea5aed77dd653d7396c7279fa709b6677817df`;
runtime source remains `ec7a77182bb5b222c5fe945abe3b4c67912d5781`.
Every one of the 44 production paths matches that HEAD byte for byte.
Active platform owner is `eb576cb98b369df0b0d01616451c049013b31130`.
The saved root patch equals the entire current owner diff exactly.
Removing only the new case and its HttpFetch type import reproduces the entire
prior owner, including every original case, assertion, helper and header.
The account source/owner, persistence, reconciliation, packages and all other
tracked inputs remain exact. No new untracked executable is introduced.

### Official lifecycle grounding and terminal parent boundary

Context7 MCP and ctx7 are unavailable. The applicable official fallback is the
[Homebridge template lifecycle](https://github.com/homebridge/homebridge-plugin-template/blob/latest/src/platform.ts)
and [DynamicPlatformPlugin callback](https://developers.homebridge.io/homebridge/interfaces/DynamicPlatformPlugin.html).
The template places discovery on launch after cached restoration. The callback
initializes each restored accessory. Installed Homebridge 2.4.0 agrees:
dist/api.d.ts:78–86 defines the callback, dist/server.js:181–184 restores cached
accessories before signalFinished, and dist/api.js:179–181 emits launch.
No relevant documentation/version difference was observed. Project runtime
construction at platform.ts:581 precedes configureAccessory:632, so future
integration must read the current validated context deviceIds at launch.
Proposal probes remain leads, not refreshed contract-impact evidence.

Complete AGENTS, bootstrap and all five complete project books were read.
The complete 04-12 and amended 08/09/10 plans, ROADMAP, latest protocol,
CONTEXT, RESEARCH, PATTERNS, FINDINGS, prior 4310-line ACCOUNT report, 07/11
summaries, canonical decisions and relevant locked STATE were loaded.
Complete current platform source/2384-line owner and account source/8395-line
owner were read in contiguous bounded pages, with persistence/reconciliation
and actual index/platform/World composition, restore and removal callers.
This added case changes no existing shared/public/private alias or member shape.
No incomplete impact result is treated as permission for a contract change.

Exactly three repository paths remain dirty and unstaged: platform owner,
this report and new platform RED JSON. The pre-code 04-12 declaration is already
committed as the fourth cause path. No production/header/runtime dependency,
control, GREEN, code staging, commit, direct-coverage pass, full npm run check,
summary, shared-record advancement or independent correction occurred here.
The parent ALONE commits planning report plus platform JSON after its clean
required pre-step and normal foreground hooks, leaving the failing owner unstaged.
That actual evidence-only commit must precede task 04-12-01 runtime GREEN,
then platform integration GREEN, then the separate platform header-only cause.
The generic classifier GREEN message does not establish an evidence commit.
RUN-01 remains Pending. D-03, original IDs/counter and all historical OPEN limits
remain. T-04-16 preserves cached identity, values and final confirmation; no new
product/privacy/removal policy, package, private input, live vendor or hardware
meaning is introduced. Parent full gates and later full correction remain pending.

Terminal provenance verification completed at 17:18:35.481 UTC with exit 0.
It confirms the exact three dirty paths, empty unchanged index, all 44 production
files and every other tracked input, full prior report prefix, complete original
ACCOUNT JSON, all original owner bytes outside the import/new case, and the
root patch matching the active owner. The first verifier attempt exited 1
because git hash-object followed a tracked directory symlink. Its full native
record remains history-provenance.json. The corrected temporary verifier hashes
the symlink target text and passed; neither attempt is native test RED.

## CR-04-ACCOUNT-026 — runtime startup identity dependency

This appendix implements only declared task 04-12-01. The original finding
remains open for platform integration, its separate header cause, parent gates
and independent full correction. This logic change requires human verification.
The initial ACCOUNT result remains 29 stable IDs: 18 BLOCKER and 11 WARNING.
The correction counter remains 0. RUN-01 remains Pending; D-03 still applies.

### Actual dependency ancestry and narrow implementation

The committed fourth cause-path declaration is
`3f4f1c3c8a9a732cd7a7711debbd7cb836611362`. That actual source commit produced
the two genuine platform RED runs. The actual evidence-only commit is
`9f7649eac84f5b82106535c941763ec1554bac1d`, containing only this report and the
new platform pair JSON. Git ancestry and its exact two paths were verified.
It precedes this runtime GREEN. The dependency's actual Git object is returned
by the normal foreground commit and recorded by the later platform integration;
no predicted hash, reconstructed 07 ledger or classifier message substitutes
for that commit. Both production files were unchanged through the evidence commit.

AccountRuntime.start accepts an optional readonly knownDeviceIds array, with
an empty default. Existing no-argument callers retain their behavior. After
anchor restoration and the existing terminal guard, start passes these IDs
to the existing reconciliation.present operation before launch. No other
production operation changes. Identity supplies absence eligibility only.
It creates no canonical snapshot, metadata, value, watermark, connectivity,
trust report or arrival anchor. Existing successful inventories, two healthy
absence confirmations, final inventory checks and successful removal callbacks
still govern removal and pruning. Existing start, shutdown and terminal guards
continue to own asynchronous work.

Only accountRuntime.ts, its direct owner and this report belong to this
dependency commit. Platform source, owner and headers are not integrated here.
The runtime source changes from ec7a77182bb5b222c5fe945abe3b4c67912d5781
to d60a04e0d006746c79726d8ea10240e909499f00. No private member is deleted.
No package, persistence format, permission, log, feature, vendor or hardware
behavior is added. Cached identity validation remains the platform's responsibility.

### Fresh exact contract impact before editing

The fresh configured fixer resolver selected an omitted model, high effort
and opus tier. Complete project instructions, bootstrap, all five project
books, current plans and locked context were loaded before implementation.
The complete runtime/platform sources and owners, reconciliation source/owner,
factory composition and actual no-argument World/start consumers were read.
Exact Fallow guard covered all three owned paths before editing; later edit
and formatter boundaries have their own guard captures. Each returned exit 0.

All six independent pre-edit impact commands ran at evidence HEAD 9f7649e.
Each used --type-aware, one --type-aware-project, --symbol-impact,
--type-aware-require complete, --format json, --quiet and --explain.
Every selected project and identity reports complete, with no omissions.

| Exact symbol | tsconfig.json | tsconfig.test.json |
| --- | --- | --- |
| AccountRuntime | Complete; no named consumers | Complete; direct owner and both Worlds |
| createAccountRuntime | Complete; no named consumers | Complete; direct owner |
| createAccountRuntimeFromConfig | Complete; platform | Complete; platform, direct owner and both Worlds |

The production project hash is
sha256:21136545e03add83002d24624dc948bec8da00383132c13a0882182a003d9a26.
The test project hash is
sha256:d84fa7d40c0319006004dc8560f0e84f3dee27cc3a3f1353bcb201f05c00e3b8.
Structural consumers and no-argument starts were traced separately from named
symbol results. Proposal probes were not reused as pre-edit evidence.
Complete argv, selected projects, UTC, HEAD, streams, exits and results remain
in the six symbol/project records under the native directory below.

### Public owner proof and native checks

Seven new executed cases use fresh state, independent whole expected literals
and exact strict request/removal/forbidden-command mocks. Verification follows
public result assertions. They establish no-argument compatibility; duplicate
ID deduplication; two healthy omissions plus a held final check; no fabricated
state or anchors; preserved restored anchors until legitimate removal; failed
and incomplete inventory rejection without confirmation advancement; failed
final checks and callback refusal retaining eligibility; repeated start guards;
and shutdown ownership during restoration or final inventory awaits.
The incomplete-inventory row exercises the existing CloudApi rejection contract,
without adding another validator. The complete original 353198 owner bytes
remain exact around one contiguous insertion. Original 024/025 deadline cases,
both 023 rows, 021 whole-state and 022 real-shadow/order cases, 018/019/020 cases,
shared contracts and negative controls remain intact.

Native records are under
`/private/tmp/guardian-04-account-026-runtime-seed/`.
Checks ran in the existing linked features/code-review-sweep checkout with
workflow.use_worktrees=false, Node v26.11.1 and npm 11.20.0.
No new checkout or manual stash was created. Each mutation completed before
the next edit or build. Initial and final successful attempts are retained.

| Record | Actual final result |
| --- | --- |
| format-final | Exact source/owner Prettier, exit 0; complete authored bytes and patch captured first, complete output captured afterward |
| build-final | Fresh npm run build:test, exit 0, 17:34:52.193935–17:34:55.182990 UTC |
| owner-final | Full native direct-owner TAP, exit 0; 166 tests, 166 pass, 0 fail/cancel/skip/todo, 17:34:55.472130–17:34:55.928970 UTC |
| lint-final | Exact source/owner ESLint --max-warnings=0 --no-cache, exit 0 |
| direct-final | Exact isolated account source/owner direct coverage with fresh build, exit 0 |
| native-coverage-final | Native isolated TAP plus accountRuntime-final.lcov, exit 0; 166 pass, no failure/skip/cancel; 1007/1007 lines, 193/193 branches, 58/58 functions |
| installed-platform, installed-account | Installed CLI on each actual immutable file, exit 0; RED_EVIDENCE_OK |
| preservation-final-bytes | SAME installed classifyRedEvidence accepts all 2 platform plus 14 ACCOUNT records; actual sourceCommit/sourceBlob identities and complete raw histories retained; exit 0 |
| audit | Fallow audit against actual ACCOUNT base e6f49a59671c13a20b696b7f46e38406a36aeec0, exit 0, verdict pass; required final pre-commit audit is captured separately |

Raw streams, full argv, UTC, HEAD, exits, input/output copies, manifests and
patches remain native artifacts. The first capture helper copied all 697
regular tracked files but omitted three directory symlinks. The supplemental
verifier checked their literal targets against evidence HEAD, and subsequent
snapshots capture all 700 tracked files/symlinks. This is disclosed rather than
relabeling the earlier manifest. Three temporary verifier attempts failed on
an obsolete 699 count, the default Git output buffer, and an older record's
schema. Corrected verification passed; all attempts remain. They are verifier
preparation, not native test RED or code failures. No test/build/lint attempt
failed during this dependency stage.

### Immutable history and next boundary

The platform JSON remains byte-exact at
5a35d0831979b6c7444b598c0987bdd9d98f758b with its two records. The separate
ACCOUNT JSON remains byte-exact at b3f7141fc652706628ec55c5bd5c1a3e4b560319
with fourteen records. Both installed CLI checks and recursive SAME-classifier
results are accepted. Full stored output bytes, prior records and real Git
provenance remain exact. This stage does not repair or waive original 022's
missing first formatter input captures.

The active platform owner remains exactly
eb576cb98b369df0b0d01616451c049013b31130, unstaged. Its full patch still equals
the immutable platform RED root. Platform production remains
7bea5aed77dd653d7396c7279fa709b6677817df. Every other tracked input and the full
prior report prefix are preserved. No active platform owner run is claimed
GREEN, and no full npm run check or independent correction is claimed.
The parent retains platform integration, header repair, combined gates,
shared-record updates, final configuration restoration and the full correction.

## Original CR-04-ACCOUNT-026: platform integration GREEN

Disposition: implemented; requires human verification and the later full
ACCOUNT correction. This is the bounded platform integration declared in
04-12-02. The original 29 stable finding IDs, clean counter 0 and RUN-01
Pending remain unchanged. This appendix does not certify the whole sweep.

### Actual dependency and launch handoff

The real ancestry is source/declaration
3f4f1c3c8a9a732cd7a7711debbd7cb836611362, planning-only platform evidence
9f7649eac84f5b82106535c941763ec1554bac1d, runtime dependency
d7e05982064fee3af178bbf7def5973b8f20bd14, then this integration.
The dependency commit changed only the runtime source, its owner and this
report. It supplied the backward-compatible start(knownDeviceIds = [])
contract and seeded reconciliation after awaited anchor restoration.
This integration does not imply a direct source-to-final transition.

At didFinishLaunching, the platform reads its current accessory map.
It narrows each cached device value with the existing isRecord guard and
accepts only a nonempty string deviceId. A Set deduplicates those physical
identities before runtime.start receives them. The read occurs after cached
accessory restoration, even though runtime construction occurs earlier.
Missing, malformed and empty IDs remain unguessed. Neither UUIDs nor
deviceTypeId substitute for identity. No telemetry, measurements or arrival
anchors are created by the handoff. No generic helper or public API was added.

The [official platform template](https://github.com/homebridge/homebridge-plugin-template/blob/latest/src/platform.ts)
and [DynamicPlatformPlugin callback documentation](https://developers.homebridge.io/homebridge/interfaces/DynamicPlatformPlugin.html)
agree with installed Homebridge 2.4.0. Its dist/api.d.ts lines 78–86 describe
configureAccessory restoration; dist/server.js lines 181–184 restore the
cache before signalling completion, and dist/api.js lines 179–181 emit
didFinishLaunching. No relevant version difference was found. Context7 was
unavailable, so these applicable official sources and installed files were
used without installing packages or contacting vendor services.

### Scope, current consumers and owner promises

The exact three-path Fallow guard ran before edits and again before the
report append. No boundary zones or rule packs are configured.
All eight fresh symbol-impact queries completed at dependency HEAD, with
one explicit project per query: BasementGuardianPlatform, AccountRuntime,
createAccountRuntime and createAccountRuntimeFromConfig, independently in
tsconfig.json and tsconfig.test.json. Each returned status complete,
identity.completeness complete and no omissions. Full argv, selected project,
configuration hash, UTC, HEAD, raw streams and exit remain in native records.
The named and structural consumers, real caller bodies, persistence and
reconciliation paths were read. Existing no-argument World startup callers
remain compatible with the optional runtime argument.

The saved active RED owner blob was
eb576cb98b369df0b0d01616451c049013b31130. Its original restored-device case
is byte-exact in GREEN, including all independent public assertions and
literal promises: cached context and last values survive stale marking,
two healthy absences precede a current final check, and unregistration sees
the cached accessory before pruning. All earlier owner bytes are retained
outside the new import and additions. The six invalid-context cases narrow
unknown raw JSON and assert the whole retained public cache/context result.
The additional duplicate-restoration case requires exactly one physical
removal. Every new strict mock is verified after public assertions; there
are no logger-output checks, private hooks or casts hiding invalid doubles.
The original regression also proves the cache is read after construction.

Only src/platform.ts, test/platform.test.ts and this append-only report
belong to this integration cause. Both existing header byte sequences are
preserved for the separate header cause. Runtime source remains
d60a04e0d006746c79726d8ea10240e909499f00; its owner remains
d2cd76a5d4a2a90d6316463ca250e30b4cea294d. Before commit, all other tracked
inputs among 700 files/symlinks and the complete prior report prefix were
checked byte-exact. Platform GREEN source is
e531faef7a30b4680e6f6a652c7de675569d52e8; platform owner is
e37697774ec89fb532f6d890d2f3df2c4536f033.

### Native verification and retained attempts

Checks ran in the existing linked features/code-review-sweep checkout with
workflow.use_worktrees=false, Node v26.11.1 and npm 11.20.0.
Native records are under /private/tmp/guardian-04-account-026-platform-green/.
Every formatter and hook attempt has complete input/output copies, manifests,
blob identities, patches, argv, UTC, HEAD, exits and full raw streams.
Each mutating process completed before the next edit or build.

| Record | Actual result |
| --- | --- |
| format-final-2 | Exact source/owner Prettier, exit 0; no changes |
| lint-final-2 | Exact source/owner ESLint --max-warnings=0 --no-cache, exit 0 |
| build-final-2 | Fresh npm run build:test, exit 0, 17:47:30.023834–17:47:32.839674 UTC |
| owners-final-2 | Both full native owners, exit 0, 237 tests: 71 platform plus 166 ACCOUNT; 0 fail/cancel/skip/todo, 17:47:33.528936–17:47:33.987625 UTC |
| direct-platform-final, direct-account-final | Each exact isolated source/owner selector with a fresh build, exit 0; 100% lines, functions and branches |
| native-platform-final | Full native platform owner plus platform-final.lcov, exit 0; 71 pass; 498/498 lines, 22/22 functions, 57/57 branches |
| native-account-final | Full native ACCOUNT owner plus accountRuntime-final.lcov, exit 0; 166 pass; 1007/1007 lines, 58/58 functions, 193/193 branches |
| installed-platform, installed-account | Installed evidence CLI on both actual immutable files, exit 0; RED_EVIDENCE_OK |
| preservation-before-report | SAME installed classifier recursively accepts all 2 platform plus 14 ACCOUNT records; sourceCommit/sourceBlob, immutable raw histories, original owner bytes, headers and all other inputs verified, exit 0 |
| audit | Fallow audit against actual ACCOUNT base e6f49a59671c13a20b696b7f46e38406a36aeec0, exit 0, verdict pass; final pre-commit audit retained separately |

All build, owner and isolated coverage attempts passed. The first lint
attempt found a missing blank line and an unsafe JSON.parse expectation in
the added tests. A later lint attempt found identical route stubs after the
duplicate case was added. These were corrected without weakening assertions;
both failed raw attempts and final clean lint remain. Formatter changes were
limited to new test text and the added imports. No original case was rewritten.

### Immutable evidence and remaining boundary

The platform evidence remains exactly
5a35d0831979b6c7444b598c0987bdd9d98f758b, with two records. ACCOUNT evidence
remains exactly b3f7141fc652706628ec55c5bd5c1a3e4b560319, with fourteen.
Both installed CLI checks and recursive SAME-classifier results pass.
Stored patches, complete raw outputs and actual Git provenance remain intact.
Original 022's missing first formatter input captures remain disclosed and
unwaived; this integration does not reconstruct that historical gap.

The separate header cause, combined full gate, shared records, final
configuration restoration and full ACCOUNT correction remain with the parent.
No full npm run check, independent final correction, clean run increment or
root whole-sweep certification is claimed here. Existing D-03 stop conditions
and all earlier unresolved limits remain in force.

## Original CR-04-ACCOUNT-026: separate platform header dependency

Implemented by typed gsd-code-fixer, task
`/root/phase4_account_trust/account_026_platform_headers`, on 2026-10-15.
This is the separate header cause declared in 04-12, after successful platform
integration 6c82ec94abfa25af4ea50c49a926e4a7cfba5af5. Original 026 retains its
implementation disposition pending human verification and independent full
ACCOUNT correction. The initial 29 IDs, 18 BLOCKER/11 WARNING counts and
correction counter 0 remain. RUN-01 remains Pending; D-03 still applies.

### Actual header scope and byte preservation

Only src/platform.ts and this appended report change. The already conforming
test/platform.test.ts header and ENTIRE owner remain byte-exact. The parent
confirmed this narrower two-path cause after actual header inspection.
The previously committed 04-12 declaration remains the separate cause-path
declaration. No new finding ID or correction round is introduced.

The source now has SPDX MIT first, one blank line, separate Copyright (c) 2026
Alessandro Colomba JSDoc, one blank line, separate purpose @fileoverview JSDoc,
one blank line, then imports. The overview describes Homebridge lifecycle,
discovery and monitoring updates. LICENSE and NOTICE already classify this
source as original MIT work; this cause does not infer a new classification.
The source-only packaging gate and both complete actual headers were inspected.

The full 655-line source, 2683-line owner and 4720-line pre-edit report were
read in bounded contiguous pages. Truncated broad outputs received bounded
follow-up reads. Complete AGENTS, bootstrap and all five project books were
loaded, with current 04-12, amended 08/09/10, protocol, CONTEXT, ROADMAP and
applicable canonical licensing/header decisions. Actual index registration,
World factory/callback uses, source imports and all owner uses were inspected.
No function, API, signature, field, mutability, visibility, alias or private
member changes; the contract-impact gate is not triggered by this header.

Every byte from first import through EOF remains identical in both files.
The entire owner remains e37697774ec89fb532f6d890d2f3df2c4536f033, including
the active restored-cache regression, six invalid-context rows and duplicate
identity case. Source changes only its header, from
e531faef7a30b4680e6f6a652c7de675569d52e8 to
b7c1103e669d7d56f0a4b4c84dde7fb9248b23f5. Runtime source and owner remain
d60a04e0d006746c79726d8ea10240e909499f00 and
d2cd76a5d4a2a90d6316463ca250e30b4cea294d, respectively.

### Verification location and retained native evidence

Checks ran serially in the existing linked features/code-review-sweep checkout,
using workflow.use_worktrees=false, Node v26.11.1 and npm 11.20.0.
No new checkout, branch, recovery sentinel, helper or package was introduced.
Native directory: /private/tmp/guardian-04-account-026-platform-headers/.
Each command retains complete input/output copies, all 700 tracked file/symlink
identities and modes, full dirty/index patches, untracked inventory, argv,
HEAD, UTC start/end, raw exit and separate complete stdout/stderr.
Formatter inputs and full patches were captured before each invocation and
outputs afterward. Every mutating process completed before the next edit/build.

| Native record | Actual result |
| --- | --- |
| guard, guard-format, guard-report | Exact three authorized paths before source/report edits and final formatter; exit 0, no configured boundary zones or rule packs |
| format, format-final | Exact source/owner Prettier; exit 0, unchanged |
| build | Fresh npm run build:test; exit 0, 17:57:23.704076–17:57:26.718357 UTC |
| owner | Full native platform TAP; exit 0, 71 pass, zero fail/cancel/skip/todo, 17:57:30.513704–17:57:30.939089 UTC |
| direct | Exact npm run test:coverage:direct -- src/platform.ts test/platform.test.ts, including fresh build; exit 0, isolated 100% lines/functions/branches |
| native-coverage | Full platform owner with exact-source 100% thresholds and platform.lcov; exit 0, 71 pass, 504/504 native compiled lines, 22/22 functions, 57/57 branches |
| lint | Exact source/owner ESLint --max-warnings=0 --no-cache; exit 0 |
| license-headers | Existing compiled packaging owner; exit 0, all five cases pass |
| installed-platform, installed-account | Installed CLI on each actual unchanged RED JSON; exit 0, RED_EVIDENCE_OK |
| preservation-before-report | Complete source/owner body identity, whole-owner identity, all unrelated tracked bytes/modes and full prior report prefix; exit 0. SAME installed classifier accepts all 2 platform plus 14 ACCOUNT records |
| audit | Fallow audit --base e6f49a59671c13a20b696b7f46e38406a36aeec0 --format json --quiet --explain; exit 0, verdict pass, zero introduced issues. Authorized temporary linked-Git access used directly |
| pre-step-1 | Exact two-file SKIP=npm-check pre-commit; exit 0, clean without formatter changes, 18:00:26.987181–18:00:29.244426 UTC. Repeated after this final report update before staging |

The unchanged ACCOUNT evidence is reused from this session's integration
records at /private/tmp/guardian-04-account-026-platform-green/:
owners-final-2 (237 combined tests, including 166 ACCOUNT), direct-account-final
(isolated 100%) and native-account-final (1007/1007 lines, 58/58 functions,
193/193 branches). Their exact argv, raw exit 0, Node, UTC and input manifests
remain in those records. Their recorded HEAD is runtime dependency d7e0598;
the checked dirty inputs equal clean integration reference 6c82ec9 except the
then-unappended planning report. Comparing current inputs adds only this
source header and report. All 33 files in the ACCOUNT owner's actual relative
import closure remain exact; that closure includes neither platform file.
The account source/owner, dependencies, compiler inputs, runtime and tools are
unchanged. No fresh ACCOUNT test or full npm run check is claimed here.
The parent supplies the required combined gate after terminal 04-12.

All executable checks passed. Read-only discovery had an absent NOTICE.md probe
and an unmatched audit-output search; neither changed repository inputs or
supplies a test result. A resolver query returned only the omitted model;
the complete resolve-execution result separately confirms high effort.
Selected pair checks do not refresh merged all-pair source-map LCOV.
The native compiled denominator above includes the actual current header.
No temporary source control is needed for this reversible header-only change.

### Immutable history and normal atomic closeout

Platform evidence remains 5a35d0831979b6c7444b598c0987bdd9d98f758b with two
records; ACCOUNT evidence remains b3f7141fc652706628ec55c5bd5c1a3e4b560319 with
fourteen. Complete raw files equal their immutable Git objects. The SAME
installed recursive classifier accepts every record; sourceCommit/sourceBlob
identities and the saved active platform regression text remain exact.
Actual ancestry remains declaration/source 3f4f1c3, planning-only evidence
9f7649e, runtime dependency d7e0598, platform integration 6c82ec9, then this
header cause. No original case, native stream or evidence history is rewritten.

The atomic commit is titled `fix: complete platform source header` and contains
exactly src/platform.ts and this report. Recorded-base Fallow audit, the exact
two-file clean SKIP=npm-check pre-commit, branch/HEAD/index checks, authorized
individual staging and normal foreground hooks retain their terminal results
in the native directory. The actual postcommit Git object establishes its
hash, two paths, no deletions and clean tree/index. No wrapper, manual stash,
amend, hook bypass, rebase or history rewrite is used.

Original 022's missing first formatter input captures remain disclosed and
unwaived, as do WINDOWS 46–50 and other historical limits. No full ACCOUNT
correction occurs before the remaining 09 work. No root whole-sweep verdict,
shared record, requirement completion or summary is written by this cause.
No security-relevant surface outside the existing threat model is introduced.
The parent retains combined gates, summary creation, final configuration
restoration and independent full ACCOUNT correction.

## Original CR-04-ACCOUNT-026: post-gate storage fixture isolation

Implemented by typed gsd-code-fixer, task
`/root/phase4_account_trust/account_026_fixture_isolation`, on 2026-10-15.
This follow-up executes only the newly declared 04-12-03 fixture cause.
Declaration 815fd49eb31d036fd41dd1752d00514d37b9fa3e precedes the owner edit.
The original 29 finding IDs and ACCOUNT correction counter 0 remain unchanged.
RUN-01 remains Pending. This is implementation self-check, not independent correction.

### Retained interruption and diagnostic limits

The parent full gate at ce67f4b117146f4d9f9fc793c36aaf3b5e29fe85 remains
failed/interrupted, with actual exit 1 and controlled SIGTERM.
Its platform child reports 16 passing cases and a file-level interruption
after 154723 ms. It records no named stuck case or original filesystem error.
The native gate and interruption records remain under
/private/tmp/guardian-phase4-wave10-final-state-*.
The investigation retains twelve naturally passing owner/coverage runs.
These later passes do not erase the failed parent gate.

Installed Node v26.11.1 lazily loads recursive removal's internal rimraf module.
That module captures timers.setTimeout at initialization and uses it for retries.
The leading platform cases enable fake setTimeout before their first recursive cleanup.
A later retry can therefore wait on the first case's inactive mock queue.
The installed context timer reset restores real timers and does nothing when inactive.

Complete scripts and native results remain in
/private/tmp/guardian-04-platform-hang-investigation/.
The corrected unlink probe observes one injected retry resolving with real timers,
remaining pending with mocked priming, and resolving with reset before cleanup.
The earlier lstat probe did not reach the retry path and supplies no positive causal proof.
The unchanged compiled-owner diagnostic injects exactly one EBUSY at cleanup ordinal 13.
It records the first 16 cases passing, then stalls until its 15-second bound sends SIGTERM.
Its actual exit is 1. This is controlled fixture diagnostic evidence, not genuine production RED.
The precise connection to the original full-gate interruption remains inferred
because that gate did not capture the original filesystem error.

### One-line repair and preserved inputs

Inside expectStoragePath's existing t.after callback, the owner now calls
t.mock.timers.reset() immediately before recursive rm.
The helper signature, retry settings, every case body, every assertion and test order remain intact.
No production API, helper, package, compiler input or configuration changes.
No internal-module priming, disabled retry, real sleep, skipped test or reporter change is added.

The complete 2683-line pre-edit owner, all actual helper callers, full report,
existing summary, amended plan, protocol, context, AGENTS and bootstrap were read.
All five complete project books were loaded, including the additional unit reviewer.
Fresh model and execution resolution each returned an empty model override and high effort.
The documented worktree opt-out and matching forced-none phase 04/plan 04-12 sentinel apply.
No checkout, branch or recovery sentinel was created.
This local body change deletes no private member and changes no contract signature.

The exact installed three-path guard preceded the owner edit and metadata writes.
Explicit canonical-root containment and the exact relative summary-path check
passed before the first summary edit, at 18:32:41.840 UTC.
Every mutating process reached actual terminal completion before the next edit or build.
The entire earlier report and summary remain exact byte prefixes.
Removing only the new reset line reproduces the entire saved platform owner.
Its blob changes from e37697774ec89fb532f6d890d2f3df2c4536f033
to 1b29564013cf6483e0c885f04b46bbd9fc964659.
All 44 production files and every nonowned tracked input remain byte-exact.
The active original 026 restored-cache regression remains exact.

### Current focused verification

Checks ran serially in the existing linked features/code-review-sweep checkout,
with workflow.use_worktrees=false, Node v26.11.1 and npm 11.20.0.
Native directory: /private/tmp/guardian-04-platform-fixture-isolation/.
Each command retains complete before/after input manifests and copies, dirty/index patches,
untracked inventory, exact argv, UTC, HEAD, raw exit and separate stdout/stderr.
Compiled source/owner copies are retained alongside the input snapshots.

| Record | Actual result |
| --- | --- |
| guard-owner, guard-metadata | Exact three paths, exit 0; no configured zones or rule packs |
| build | Fresh npm run build:test, exit 0, 18:31:13.840–18:31:17.266 UTC |
| controlled-owner | Same preloader, DIAG_BUSY_CLEANUP=13 and exact native coverage argv as the retained stalled diagnostic; explicit 60-second bound; exit 0, 71 pass, no timeout, no remaining process group, 18:31:22.160–18:31:22.753 UTC |
| owner | Full natural native TAP owner, exit 0; 71 pass, zero fail/cancel/skip/todo, 18:31:34.309–18:31:34.718 UTC |
| direct | Exact npm run test:coverage:direct -- src/platform.ts test/platform.test.ts, including fresh build, exit 0 |
| native-coverage | Exact-source native thresholds and platform.lcov, exit 0; 504/504 lines, 22/22 functions, 57/57 branches; 71 pass, zero fail/cancel/skip/todo |
| lint | Exact owner ESLint --max-warnings=0 --no-cache, exit 0 |
| before-metadata | Complete input preservation, exact owner reversal, both metadata prefixes, canonical containment and SAME installed recursive classifier, exit 0 |

All executable checks passed on the sole one-line candidate.
One temporary capture invocation incorrectly supplied GSD_RUNTIME=codex as an executable.
It failed with FileNotFoundError before spawning a child; its tool error and before snapshot remain retained.
Corrected native resolver commands passed. This preparation error supplies no test evidence.
The earlier interrupted diagnostic, natural runs and unsuccessful initial probe remain unchanged.
No diagnostic is inserted into either genuine RED JSON or used to change a classifier.

Platform evidence remains 5a35d0831979b6c7444b598c0987bdd9d98f758b with two records.
ACCOUNT evidence remains b3f7141fc652706628ec55c5bd5c1a3e4b560319 with fourteen.
The SAME installed recursive classifier accepts all sixteen records, with actual source blobs verified.
Selected coverage does not refresh merged all-pair source-mapped LCOV.
No fresh ACCOUNT owner run or full npm run check is claimed here.
The parent supplies the required full combined gate after this actual terminal handoff.

### Atomic closeout and remaining work

Only test/platform.test.ts, this report and the existing 04-12 summary enter the commit.
The pre-code plan declaration is the fourth total cause path.
The commit introducing this appendix is titled
`test: reset platform timers before storage cleanup`.
Recorded-real-base Fallow audit, exact three-path clean pre-step before staging,
authorized linked-index staging and plain foreground normal hooks retain native terminal records.
The actual Git object and returned terminal result establish the hash and committed paths.
No wrapper, manual stash, amend, hook bypass, rebase or history rewrite is used.

No independent review, finding closure, correction round or fixed-finding reopening is claimed.
Original 026 retains its implementation disposition pending human verification and full ACCOUNT correction.
The historical two-task/four-commit summary measurement remains unchanged.
WINDOWS 46–53 remain OPEN and unwaived, including the prior summary containment gap.
This new pre-write check does not reconstruct historical proof.
No security-relevant surface outside the existing threat model is introduced.
The parent retains combined gates, shared records, configuration restoration and later full correction.

The recorded-base audit used 3f4f1c3c8a9a732cd7a7711debbd7cb836611362,
the actual original plan-12 source base. Its actual exit is 0 and verdict is pass,
with zero introduced issues. The retained cache-entry warning is diagnostic output.
The exact three-path SKIP=npm-check pre-commit passed cleanly with exit 0
at 18:34:19.006 UTC, without formatter changes or staging.
The final audit and clean pre-step repeat after this metadata addition before staging.
Native preservation-after-metadata confirms both entire historical prefixes and all nonowned inputs.

## CR-04-ACCOUNT-004: current behavior comment rationale

**Requirement:** RUN-01. **Original severity:** WARNING.
**Rule:** skills/typescript-comments/SKILL.md, forbidden narration of removed code;
present-tense descriptions of current behavior and durable decision/finding IDs.
**Owning task:** 04-09-02. **Disposition:** applied, pending full ACCOUNT correction.
**Fixer:** gsd-code-fixer, /root/phase4_account_trust/account_004_comments.
**Pre-edit HEAD:** 8a700ac4b3594bf0c16af0a5e3ce35223ef3f574.
This is one original cause, not an independent correction or a clean verdict.
All original 29 IDs, 18 BLOCKER/11 WARNING, and correction counter 0 remain.

### Seven comment blocks and unchanged executable inputs

All seven blocks cited by the original finding remain at this pre-edit revision.
The repair changes only their removed-implementation narration:

| Current candidate location | Present-tense rationale retained |
| --- | --- |
| src/runtime/accountRuntime.ts:489–491 | Final-check omissions cannot advance unrelated absence counters; CR-01 |
| src/runtime/accountRuntime.ts:642–644 | Each inventoried system receives its own silence answer; D-01, D-03 |
| src/runtime/accountRuntime.ts:820–822 | Disconnect releases fleet ownership; silence release names one controller |
| test/runtime/accountRuntime.test.ts:2936–2937 | Missing stored anchor uses admission and seeds the next run; D-08 |
| test/runtime/accountRuntime.test.ts:5412–5417 | Mid-run refusal requires rejected-credential trust and authentication stop; CR-03, D-10, D-03 |
| test/runtime/accountRuntime.test.ts:5535–5536 | Rotation refusal is terminal and does not promise retry; CR-03, D-10 |
| test/runtime/accountRuntime.test.ts:6545–6546 | Poll recovery leaves live silence unresolved; arrival clears it; D-11 |

The complete source, owner and existing report bytes were read and retained
before edits in /private/tmp/guardian-04-account-004/.
whole-input-read-manifest.json records full byte/line counts and SHA-256 identities
for the source, owner, report and current project/plan context inputs.
The five complete rulebooks were loaded. Their applicable rules were inspected:
comment rationale/current tense, surgical style scope, unchanged public test promises,
unchanged independent assertions/doubles and fresh focused verification.
The complete source and the seven affected owner contexts were inspected manually.
This scoped repair supplies no full-owner independent correction judgment.

Actual source callers were traced before edits: applyDevices is awaited by launch
and runPoll; monitoringTrustByDevice feeds pushMonitoringTrust and
reportMonitoringHealth; the disconnect handler is supplied to the current shadow
client. The relevant launch, poll, rotation, terminal-authentication, arrival and
reporting paths, harness wiring and affected complete test bodies were inspected.
The platform and both feature composition callers retain their existing contracts.
No public/private symbol, shape, signature, member, import or header changes.
No deletion or type-impact exception is requested or inferred.

Before/after full-file comparison removes only standalone // comment lines and
finds every remaining byte equal. TypeScript comment-free emitted JavaScript is
also byte-identical for both files. All 149 authored test call expressions,
including their complete bodies and titles, are byte-identical; generated rows
produce 166 native tests. Parse diagnostics are zero.
comments-only-comparison-corrected.json retains this proof.
An earlier standalone scanner comparison mishandled template lexical context,
reported unequal token streams and stopped before starting the build.
That invalid comparison remains in comments-only-comparison.json; it is not a
source failure. Exact line-byte and TypeScript emit comparisons replace it.

Source blob changes from d60a04e0d006746c79726d8ea10240e909499f00 to
c0ee18053e9abb21a98cf228bee36e8b5fd9309c. Owner blob changes from
d2cd76a5d4a2a90d6316463ca250e30b4cea294d to
cc26ce420e8013a2d4beb645dfff0928eae1c639.
All original 336805 report-prefix bytes are checked before this append and
remain exact. The entire prefix includes every earlier finding and evidence record.

### Verification location and native evidence

All checks run serially in the existing linked features/code-review-sweep
checkout, with workflow.use_worktrees=false, Node v26.11.1 and npm 11.20.0.
The persisted 04/04-09 isolation sentinel directly reads none.
The existing Git-dir gsd-plan-head-before-04-09 directly reads
8a700ac4b3594bf0c16af0a5e3ce35223ef3f574; it is not reconstructed or overwritten.
The parent's initial-ledger-checkpoint.json remains unchanged.

Each named native record has exact argv, cwd, actual UTC start/end, raw child
exit, HEAD, source/owner/report Git blobs and SHA-256 values, plus complete
separate stdout/stderr. Native directory: /private/tmp/guardian-04-account-004/.

| Record | Actual result |
| --- | --- |
| preedit-guard | Installed Fallow guard on all three owned paths, exit 0; no configured zones/rule packs |
| build | npm run build:test, exit 0, 18:42:39.574–18:42:42.431 UTC |
| owner | node --test --test-reporter=tap dist-test/test/runtime/accountRuntime.test.js, exit 0; 166 pass, zero fail/cancel/skip/todo |
| direct | npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts, fresh build, exit 0 |
| native-coverage | Exact compiled source include, 100% native thresholds and accountRuntime.lcov, exit 0; 1003/1003 lines, 58/58 functions, 193/193 branches; 166 pass |
| lint | Exact source/owner ESLint --max-warnings=0 --no-cache, exit 0 |
| audit | Fallow audit --base 8a700ac4b3594bf0c16af0a5e3ce35223ef3f574 --format json --quiet --explain, exit 0, verdict pass, zero introduced issues |
| account-evidence, platform-evidence | Existing current on-disk RED checker, both exit 0 / RED_EVIDENCE_OK |
| recursive-preservation.json | SAME installed classifyRedEvidence accepts all 14 ACCOUNT plus 2 PLATFORM records; exact immutable root blobs retained |

ACCOUNT evidence remains b3f7141fc652706628ec55c5bd5c1a3e4b560319.
PLATFORM evidence remains 5a35d0831979b6c7444b598c0987bdd9d98f758b.
This comment repair creates no genuine production bug or assertion control.
All executable regressions and their complete recursive histories remain unchanged.
Selected native coverage does not refresh merged all-pair source-map LCOV.
The parent's earlier e2b884e full gate predates these TypeScript input changes;
no reuse or fresh full npm run check is claimed. The parent owns the combined gate.

### Atomic closeout and remaining work

Only the source, its owner and this append enter the atomic cause commit titled
docs: describe current account runtime behavior.
After this report append, the recorded-base audit repeats and the exact
SKIP=npm-check pre-commit run --files invocation covers all three final paths.
A clean terminal pre-step precedes staging and a plain foreground git commit
with ordinary hooks. Native final-audit, pre-step and foreground hook records
establish their actual outcomes; the returned Git object supplies the real hash.
No amend, hook bypass, wrapper commit, manual stash, rebase or history rewrite.

The preserved executable bytes retain 024 ownership guards, 025 literal deadline
cases, 013 strict interactions, both 023 rows, 021 targeted presence/callback
order, 022 real-shadow membership, 018 frozen/refused canonical observations,
019 checkpoints, 020 anchors, 026 active regression and platform fixture isolation.
RUN-01 stays Pending. WINDOWS 46–53 stay OPEN and unwaived.
All remaining ACCOUNT causes and full independent correction belong to the parent.
No fixed-ID reopening, correction increment, full-review closure or phase completion
is claimed. No security-relevant surface outside the existing threat model changes.

## CR-04-ACCOUNT-005: explicit registration helper function type

**Requirement:** RUN-01. **Original severity:** WARNING.
**Rule:** skills/typescript-google-style-review/SKILL.md, Functions: a named
function uses a declaration, or a const arrow has an explicit function type.
**Owning task:** 04-09-01. **Disposition:** applied, pending independent correction.
**Fixer:** gsd-code-fixer, /root/phase4_account_trust/account_005_declaration.
**Pre-edit HEAD:** 92ed72f01b62bb2eb69c5e174f94a0f4fe0b32ce.
This repairs only original 005. All original 29 IDs, 18 BLOCKER/11 WARNING,
and correction counter 0 remain. This is not a clean full ACCOUNT review.

### Minimum declaration conformance and caller preservation

At the current source location, src/runtime/accountRuntime.ts:1294, the helper
has parameter and return annotations but no explicit function type on its binding.
The one-line repair puts the same callable type on the const binding:
`(secret: string, role?: SecretRole) => void`.
The arrow parameters receive those same types from the binding.
The const binding, helper name, optional role, void result and complete body stay
the same. Its closure still calls deps.log.registerSecret(secret, role).
No symbol is renamed, deleted, exported, reassigned or made public.
No public shape, visibility, mutability, alias or consumer signature changes.

The complete source, owner, existing report and required context bytes were read
and retained before editing in /private/tmp/guardian-04-account-005/.
whole-input-read-manifest.json records their byte counts, line counts and hashes;
before-input-manifest.json records all tracked and nonignored untracked inputs.
The complete five rulebooks and configured fixer skills were loaded.
Manual inspection covered the complete source and the relevant complete owner
composition/registration cases and actual authentication/logger implementations.
This scoped repair supplies no independent full-owner correction judgment.

The helper is supplied unchanged to createAuthClient and createAccountRuntime.
The auth client's idToken operation calls it with the bearer token and no role.
refreshCredentials calls the runtime port with the access key, secret access key
and session token, in that order, before cache replacement or first shadow use.
The unchanged delegate retains method-call receiver binding and both arguments.
Existing complete composition cases cover bearer/AWS registration and its order.

Fresh exact private-symbol queries were run separately for tsconfig.json and
tsconfig.test.json before editing, with require-complete, JSON and explain flags.
Both exit 2: export or class method registerSecret not found.
These remain unsupported results, not complete consumer traces or deletion proof.
No exception or public-neighbor trace is used. No contract change is attempted.
The installed TypeScript checker independently compares the before/after helper
types in both projects: both retain
`(secret: string, role?: SecretRole | undefined) => void`, const binding and body.
That comparison does not relabel either unsupported Fallow query as complete.

The full source differs by exactly the one intended type-annotation line.
Its TypeScript-emitted JavaScript is byte-identical before and after the repair.
All 371108 owner bytes, including every one of the 149 authored test calls,
remain exact. Generated rows still execute as 166 native tests.
Both complete headers, imports, test titles, assertions and helpers stay exact.
Source blob changes from c0ee18053e9abb21a98cf228bee36e8b5fd9309c to
c87b9330ad2589e7941c11aba90f2079c67dbc30.
Owner blob remains cc26ce420e8013a2d4beb645dfff0928eae1c639.
All 344691 existing report-prefix bytes were checked exact before this append.

### Verification location and native evidence

All checks run serially in the existing linked features/code-review-sweep
checkout, with workflow.use_worktrees=false, Node v26.11.1 and npm 11.20.0.
No isolated fixer worktree is created. The persisted 04/04-09 sentinel reads none.
The existing Git-dir gsd-plan-head-before-04-09 directly reads
8a700ac4b3594bf0c16af0a5e3ce35223ef3f574 and remains unchanged.
The parent's initial-ledger-checkpoint.json is preserved byte-for-byte.

Each native record in /private/tmp/guardian-04-account-005/ retains exact argv,
cwd, actual UTC start/end, raw child exit, before/after HEAD, Node/npm versions,
source/owner/report blobs and SHA-256 values, and complete separate stdout/stderr.

| Native record | Actual result |
| --- | --- |
| preedit-guard | Installed Fallow guard on both exact owned paths, exit 0; no configured zones or rule packs |
| impact-production, impact-test | Exact private target, separate compiler projects, exit 2 each; unsupported, retained without a pass claim |
| build | npm run build:test, exit 0, 18:49:24.764–18:49:28.011 UTC |
| owner | Complete compiled owner, TAP, exit 0; 166 pass, zero fail/cancel/skip/todo |
| direct | npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts, fresh build, exit 0 |
| native-coverage | Exact compiled source include and native LCOV, exit 0; 1003/1003 lines, 58/58 functions, 193/193 branches; all 166 cases pass |
| lint | Exact source/owner ESLint --max-warnings=0 --no-cache, exit 0 |
| audit | Fallow audit --base 8a700ac4b3594bf0c16af0a5e3ce35223ef3f574 --format json --quiet --explain, exit 0, verdict pass; zero introduced issues |
| account-evidence, platform-evidence | Current installed on-disk RED checker, exit 0 and RED_EVIDENCE_OK for both |
| preservation | Exact one-line type-only diff, identical emitted JavaScript, both unchanged checker signatures, whole-owner preservation and SAME installed classifier over all 14 ACCOUNT plus 2 PLATFORM records; exit 0 |

ACCOUNT evidence remains b3f7141fc652706628ec55c5bd5c1a3e4b560319.
PLATFORM evidence remains 5a35d0831979b6c7444b598c0987bdd9d98f758b.
Every archived record retains its complete native output and original source
commit/blob identity. The SAME installed classifyRedEvidence accepts each as
RED_EVIDENCE_OK. Preliminary timing/setup attempts retain their historical limits.
This declaration cause adds no genuine production defect, regression or control.
The exact whole owner preserves 024, every literal 025 deadline and stronger
013 verification, 023 rows, 021 presence, 022 membership, 018 canonical values,
019 checkpoints, 020 anchors and 026 active regression without assertion changes.
Canonical reported-only authority, clocks, watermarks, identity, privacy,
root lifecycle and one potentially delivered command attempt retain identical
executable JavaScript. Selected LCOV does not refresh merged all-pair LCOV.
No fresh full npm run check or full-gate reuse is claimed; the parent owns it.

### Atomic closeout and remaining work

Only src/runtime/accountRuntime.ts and this report append enter the cause commit,
titled refactor: type the account secret registration helper.
After the append, the recorded-base audit repeats and the exact required
SKIP=npm-check pre-commit run --files invocation covers these two final paths.
A clean terminal pre-step must precede staging and plain foreground git commit
with all ordinary hooks. final-audit, pre-step, commit streams and terminal
manifest/Git records retain the actual results and resulting commit hash.
Any formatter change requires another clean pre-step before staging.
No wrapper commit, hook bypass, amend, manual stash, rebase or history rewrite.

The report prefix and every input outside the two owned paths remain exact.
RUN-01 stays Pending. WINDOWS 46–53 stay OPEN and unwaived.
Remaining ACCOUNT causes and full independent correction belong to the parent;
no correction increment, reopening, closure or phase completion is claimed.
No security-relevant surface outside the existing threat model changes.

## CR-04-ACCOUNT-010: Complete command outcomes and reported authority

### Scope, current cause and caller contract

Original CR-04-ACCOUNT-010 remains an assertion-maintenance cause under 04-09-01.
Its governing rules require complete public results and independently expected
state before interactions, plus D-037 reported-only canonical authority.
The original location is R:test/runtime/accountRuntime.test.ts:2976-3040;
the current seven cases begin at test/runtime/accountRuntime.test.ts:8117.
This appendix records only this cause. The original 29 findings, initial
18 BLOCKER / 11 WARNING counts, correction counter 0 and RUN-01 Pending remain.

Earlier 012 covers silent failure ports and logger behavior. Earlier 013 already
strengthens exact command mocks, root-signal matchers and explicit verification.
Those changes leave mute's discarded outcome and post-command canonical state
unobserved. Current production returns the correct outcome and makes no
optimistic canonical write. No production defect or genuine RED is claimed.

The complete current source, owner and report were read before edits, using
bounded contiguous reads to fill actual output truncation gaps. The complete
AGENTS/bootstrap, all five TypeScript/testing/local-verification books, 04-09
plan, protocol, context, research, patterns, findings, canonical decisions,
applicable state and prior 07/08/11/12 summaries were loaded.
Actual commandPort, family, registry, Gemini, cloud API, controls and platform
contracts and callers were inspected. Controls consume CommandPort.send's
whole result; platform composition passes the runtime port through discovery
and accessory binding. The tests call that public port, resolve the real store
identity and registry family, generate the actual Gemini body, and observe the
injected CloudApi.sendCommand port. They retain exact device, body and signal
matching. No command API, eligibility, wire capability, deadline or retry changes.

Seven existing cases now capture the post-command canonical snapshot in ACT.
Each ASSERT section first checks the complete accepted/vendor-error/timed-out
result, then a complete literal unchanged snapshot, then exact request
interactions and strict verify. The mute case now captures and checks its result.
The literal snapshots independently include identity, connectivity, data,
metadata, shadowVersion, deviceTimestamp and receivedAt. The unsupported-family
case expects its actual Halo identity; the unknown-device refusal observes the
known device's unchanged state. Both local refusals retain an empty request set.
Rejected, refused and timed-out dispatched commands now check the exact one-body
request. Existing one-attempt assertions for route failure and timeout remain.
No requested field becomes reported data after acceptance or refusal.

The eighth command case belongs to original 009 and remains byte-exact.
Its cancellation promise is not corrected or closed by this cause.
No helper, fixture, seed, production API or private alias is changed or deleted.

### Separate assertion-maintenance controls and exact restoration

Both controls temporarily change only src/runtime/accountRuntime.ts, separately.
Each starts with an exact-path Fallow guard and fresh npm run build:test.
Each retains complete source/owner bytes, input manifests, full patches, raw TAP,
argv, actual UTC times, Node/npm and separate streams in the native directory.
These are diagnostic assertion-maintenance controls, not genuine production RED.
No control or failing test enters Git or immutable RED history.

| Native record | Intended observation and actual terminal result |
| --- | --- |
| outcome-control-build | Build exit 0, 18:59:29.825844-18:59:32.812681 UTC. Control source 1081b94fb6a0fbf199f1dc9921df33a2bc66d452 returns vendor-error only for accepted mute. |
| outcome-control-target | Exact anchored alarm-mute case, exit 1, 18:59:33.498586-18:59:33.793868 UTC. One intended deepStrictEqual failure: actual complete refusal versus expected accepted true. |
| outcome-restore, outcome-restored-build, outcome-restored-target | Exact source checkout and byte comparison; fresh build and all eight command cases exit 0 before the second control. |
| canonical-control-build | Build exit 0, 18:59:58.048110-19:00:00.942496 UTC. Control source 94e2cd618fb17aaea8a88abd9d3c38cdeb8a9bbc applies accepted desiredData as a reported patch. |
| canonical-control-target | Exact anchored self-test case, exit 1, 19:00:01.561419-19:00:01.856075 UTC. Accepted result passes; complete snapshot fails on added test_running true. |
| canonical-control-mute-target | Exact anchored mute case, exit 1, 19:00:15.397503-19:00:15.690122 UTC. Accepted result passes; complete snapshot fails on added alarm_audio_muted true. |
| canonical-restore, source-restoration | Exact source checkout, then byte comparison exit 0 at 19:00:19.381360 UTC. Production is restored before all subsequent GREEN checks. |

Every named control executes one intended case, with no skip/cancel/todo or
setup/mock failure. The control owner is 8275d7808132f16249bc2ef3b193590226a53e52.
The first five strengthened cases remain byte-identical in the final seven-case
owner; only the two local-refusal snapshot checks were subsequently added.
The final complete source is c87b9330ad2589e7941c11aba90f2079c67dbc30,
byte-identical to the initial source. The final owner is
0768003087142d7c3d744412f030262f47ede840, from initial
cc26ce420e8013a2d4beb645dfff0928eae1c639.

### Final-input verification and preservation

All checks run serially in the existing linked features/code-review-sweep
checkout, with workflow.use_worktrees=false, Node v26.11.1 and npm 11.20.0.
No new checkout or recovery sentinel is created. The persisted 04/04-09 sentinel
still records isolation none. The Git-dir plan-head ledger directly retains
8a700ac4b3594bf0c16af0a5e3ce35223ef3f574. The parent's initial checkpoint retains
SHA-256 aef5e272b16ba900cae197a46420256be5bb9f530c77061d8fe14f979627af53.

Native directory: /private/tmp/guardian-04-account-010/.
Every subprocess record retains exact argv/cwd, raw exit, UTC start/end,
before/after HEAD, Node/npm, complete separate streams and before/after input
manifests. The initial snapshot saves all 702 complete input files; each later
snapshot saves complete source/owner/report bytes, all input hashes/modes and
complete dirty/staged patches. No yielded mutation is left uncollected.

| Final-input native record | Actual terminal result |
| --- | --- |
| build-final-seven | npm run build:test, exit 0, 19:01:12.759218-19:01:16.129082 UTC. |
| targets-final-seven | Native TAP with command-suite selector, exit 0; all eight command cases pass, no fail/cancel/skip/todo. |
| owner-final-seven | Full compiled owner, exit 0, 19:01:17.739223-19:01:18.289049 UTC; 166 pass, no fail/cancel/skip/todo. |
| direct-final-seven | Exact npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts, fresh build, exit 0. |
| native-coverage-final-seven | Exact compiled source include, full owner and native LCOV, exit 0; 1003/1003 lines, 58/58 functions and 193/193 branches. |
| lint-final-seven | Exact source/owner ESLint --max-warnings=0 --no-cache, exit 0. |
| account-evidence, platform-evidence | Current installed on-disk RED CLI, exit 0 and RED_EVIDENCE_OK for both immutable files. |
| preservation | Installed TypeScript AST comparison, complete input preservation and SAME recursive classifier, exit 0, 19:03:41.993746-19:03:42.721489 UTC. |
| audit | Recorded-base Fallow audit, exit 0, verdict pass; zero introduced issues. |

The preservation proof compares all 149 authored test declarations, preserves
all original assertions and verify calls in order within the seven changed
cases, and proves the remaining 142 cases and all text outside those seven
calls byte-exact. Both complete headers, imports and every test title remain.
Thus 023/021/022 real-shadow rows and order, exact 024, every literal 025 deadline
and stronger 013 verification, 018 frozen/refused state, 019 checkpoints, 020
anchors, active 026, fixtures, contracts and earlier negative controls remain.
Every one of the 700 input paths outside owner/report retains its saved hash
and mode. The complete 352549-byte report prefix remains exact before append.

ACCOUNT RED remains b3f7141fc652706628ec55c5bd5c1a3e4b560319; PLATFORM RED remains
5a35d0831979b6c7444b598c0987bdd9d98f758b. The SAME installed classifyRedEvidence
accepts all 14 ACCOUNT and 2 PLATFORM recursive records as RED_EVIDENCE_OK;
each sourceCommit:path resolves to its original sourceBlob. Native output,
historical limits and archived semantics remain intact. No second parser or
new evidence record is introduced. Earlier first-five and final-seven attempts
are separately retained; only final-seven records support final owner claims.
Selected LCOV does not refresh merged all-pair LCOV.

### Atomic closeout and remaining work

Only test/runtime/accountRuntime.test.ts and this report append enter the cause
commit, titled test: protect command outcomes and reported state.
After this append, the recorded-base audit and preservation proof repeat.
The exact required SKIP=npm-check pre-commit run --files invocation covers both
final paths before staging; any formatter/report change requires another clean
terminal pre-step. Plain foreground git commit runs all ordinary hooks.
The final-audit, final-preservation, pre-step, commit streams and terminal Git
records retain actual results and the resulting commit hash. No wrapper commit,
hook bypass, amend, manual stash, rebase or history rewrite is used.

This cause strengthens T-04-17's existing command outcome and reported-authority
observations. No new security-relevant surface or product meaning is introduced.
No full npm run check, full-gate reuse, full correction, reopening, closure or
phase completion is claimed; the parent owns the remaining work and full gate.
RUN-01 stays Pending. WINDOWS 46-53 stay OPEN and unwaived.

## CR-04-ACCOUNT-009: actual pending-command root cancellation

**Requirement:** RUN-01. **Original severity:** BLOCKER.
**Rule:** unit writer/reviewer, central discrimination rule and Assertions;
04-09-01's existing shared-root cancellation contract. **Seed:** S-04-06.
**Disposition:** applied, pending independent full ACCOUNT correction.
**Fixer:** gsd-code-fixer, /root/phase4_account_trust/account_009_pending_command.
**Pre-edit HEAD:** 0c5647fcd8a8e1808bb6e8cc68bab2ed110f4d9e.
Original location remains R:test/runtime/accountRuntime.test.ts:3072-3082.
The new public case begins at current test/runtime/accountRuntime.test.ts:8118;
the existing already-aborted case now begins at line 8425.
The original 29 IDs, initial 18 BLOCKER/11 WARNING counts and correction counter
0 remain. This is assertion maintenance on correct production, with no genuine
production bug, independent correction, reopening or clean verdict.

### Discriminating public setup and preserved scope

The new standalone case sends a self-test through runtime.commands.send while
the runtime is running. The injected command boundary announces actual dispatch,
captures the actual signal and returns an unresolved response. It records the
initially live signal and unresolved outcome before shutdown. Its abort listener
rejects that pending response when the actual signal aborts.
After stop and promise settling, the case captures the actual abort and complete
refused outcome. The independently expected result is accepted=false with
failure=vendor-error. It then asserts the complete unchanged canonical snapshot,
actual root-signal identity and exact singleton device/body/initial-abort request,
followed by explicit owning-case strong-mock verification.
The actual public retry factory supplies the root identity during construction;
there is no private accessor or production hook.

The command mock has exactParams, exact physical device and self-test body,
an initially live AbortSignal matcher, one allowed call and explicit verify.
Signal identity is asserted separately against the actual captured root.
All actions and checkpoint captures finish in ACT before ASSERT.
The owned response is unconditionally released only AFTER the shutdown checkpoint
capture. This lets a broken implementation finish and fail the captured-state
assertion instead of hanging while awaiting an un-aborted signal.
It adds no runtime deadline, retry, eligibility or wider teardown policy.

The existing case is retained under the truthful title
passes an already-aborted signal to a command sent after shutdown.
Its complete body, assertions, exact request and strict verification stay exact.
All seven 010 command outcomes and whole canonical expectations remain byte-exact.
The remaining 148 prior cases also remain byte-exact; all 149 original assertion
and verify sequences retain their exact order. One type-only CommandOutcome
import supports the new case. No helper, seed, fixture, API, alias, field,
signature, package, configuration or shared record changes.

The complete current 1341-line source, 8920-line pre-edit owner and 5337-line
report were read through bounded contiguous ranges before editing.
Complete AGENTS/bootstrap and all five project books were loaded, including the
unit reviewer. Current 09 plan, protocol, CONTEXT, RESEARCH, PATTERNS, FINDINGS,
canonical decisions, applicable state and 07/08/11/12 summaries were read.
Actual commandPort, family/registry, Gemini command builder, REST dispatch,
controls outcome consumer, platform and both World composition/lifecycle callers
were inspected. No contract change or private deletion triggers an impact query.
Full approved headers and .js imports remain intact.

### Separate maintenance control and exact source restoration

The plausible wrong behavior sends an initially live signal that is independent
of the runtime root. Compilation, lint and direct coverage cannot prove that
shutdown reaches the actual pending request. The old stop-before-send setup
does not establish this pending-work contract.

The sole temporary production edit replaces root.signal with
new AbortController().signal at the existing sendCommand call.
Its fresh build exits 0. The exact anchored new target exits 1 at its FIRST
whole deepStrictEqual assertion: atDispatch remains correctly live/unresolved,
but atShutdown is aborted=false/outcome=undefined. Releasing the owned response
then produces accepted=true instead of the independently expected refusal.
Native AssertionError, ERR_ASSERTION and deepStrictEqual identify the intended
failure; one test executes, with zero skip/cancel/todo and no timeout.
No strict-mock, setup, import, compilation or cancellation failure supplies it.
The subprocess has a ten-second bound and finishes in about 0.3 seconds.

The full production source was restored through Git and compared byte for byte.
Before/restored blob: c87b9330ad2589e7941c11aba90f2079c67dbc30.
Temporary control blob: 770b7072137f7e51e240d0cd0938960b09321db6.
The source diff is empty before every restored GREEN check and before staging.
The final owner blob is 169775e1c3bc0c457f2ae02eca45567e229835fe.
No control mutation or new genuine RED record enters Git.

### Native verification, immutable history and input preservation

All checks run serially in the existing linked features/code-review-sweep
checkout with workflow.use_worktrees=false, Node v26.11.1 and npm 11.20.0.
No new checkout, branch or recovery sentinel is created.
Fresh model resolution returns an empty model override, high effort and opus
tier; execution resolution separately confirms high effective effort.
The persisted 04/04-09 sentinel remains isolation none. The existing gitdir
plan-head ledger remains 8a700ac4b3594bf0c16af0a5e3ce35223ef3f574.
The parent's initial-ledger-checkpoint.json retains SHA-256
aef5e272b16ba900cae197a46420256be5bb9f530c77061d8fe14f979627af53.

Native directory: /private/tmp/guardian-04-account-009/.
Each subprocess record retains exact argv/cwd, actual UTC start/end, raw exit,
Node/npm, HEAD, complete separate stdout/stderr, full source/owner/report input
copies, all 702 tracked/nonignored input identities/modes and full dirty/index
patches before and after. Initial input copies retain all 702 complete inputs.
Compiled control copies are retained before the restored build; restored native
runs also retain their exact compiled source/owner copies and blob identities.
Every yielded process reached terminal completion before dependent work.

| Native record | Actual terminal result |
| --- | --- |
| preedit-guard, guard-control, guard-restore, guard-report | Exact three authorized paths before changes; exit 0, no configured zones or rule packs |
| build-baseline, lint-baseline, target-baseline | Fresh build, uncached exact-pair lint and unique intended target; exit 0 |
| control-build, control-target | Build 0; intended assertion failure 1, 19:12:08.614666-19:12:08.918685 UTC; no timeout |
| restore-source, restoration-proof | Git restoration and complete source-byte equality; exit 0 |
| build-restored | Fresh npm run build:test, exit 0, 19:12:43.118725-19:12:46.138960 UTC |
| target-restored | Unique pending-command native TAP, exit 0; one pass, no fail/cancel/skip/todo |
| owner-final | Full native TAP owner, exit 0, 19:12:54.536343-19:12:54.977162 UTC; 167 pass, no fail/cancel/skip/todo |
| direct-final | Exact npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts with fresh build; exit 0 |
| native-coverage-final | Full owner, exact compiled-source include and all three 100% thresholds, exit 0; 1003/1003 lines, 58/58 functions, 193/193 branches; accountRuntime-final.lcov retained |
| lint-final | Exact source/owner ESLint --max-warnings=0 --no-cache, exit 0 |
| account-evidence, platform-evidence | Installed CLI on each actual unchanged RED file, exit 0; RED_EVIDENCE_OK |
| preservation-corrected | Complete original case/assertion-order, exact source/report-prefix and unrelated-input comparisons; SAME installed recursive classifier accepts all 14 ACCOUNT plus 2 PLATFORM records; exit 0 |
| audit | Fallow audit --base 8a700ac4b3594bf0c16af0a5e3ce35223ef3f574 --format json --quiet --explain; exit 0, verdict pass, zero introduced issues |

All executable candidates pass except the deliberately wrong signal control.
The first temporary preservation verifier omitted the call-expression semicolon
when reconstructing the expected insertion. Its retained exit 1 is a verifier
preparation failure. Adding that punctuation to the temporary verifier makes
the exact comparison pass without changing any repository byte.
No unsuccessful attempt is discarded or relabeled as genuine RED.

preservation-proof.json retains every complete saved/current original case,
their exact assertion/verify sequences, the new case, input identities and
all recursive classification/source-blob results. It proves the entire owner
diff is exactly the additive case/import and one truthful title change.
The complete 362579-byte earlier report remains an exact prefix.
All 700 input paths outside owner/report retain their saved hashes and modes.
Original 024, every literal 025 deadline and stronger 013 verification, 023
terminal rows, 021 callback/neighbor proof, 022 real-shadow/order cases, 018
frozen/refused readbacks, 019 checkpoints, 020 anchors, 026 and contracts remain.
ACCOUNT RED remains b3f7141fc652706628ec55c5bd5c1a3e4b560319; PLATFORM remains
5a35d0831979b6c7444b598c0987bdd9d98f758b. Every archived record, raw output,
sourceCommit/sourceBlob and genuine evidence-first ancestry remains unchanged.
No second parser or replacement history is introduced. Selected LCOV does not
refresh merged all-pair source-map LCOV. The parent owns the full combined gate.

### Atomic closeout and remaining work

Only test/runtime/accountRuntime.test.ts and this append enter the cause commit,
titled test: prove pending command cancellation on shutdown.
Recorded-base audit and preservation repeat after this append. The exact required
SKIP=npm-check pre-commit run --files covers both FINAL paths before staging.
Any formatter or report change requires another clean terminal pre-step.
Plain foreground git commit runs all ordinary hooks with SKIP absent.
Native final-audit, preservation, pre-step, hook streams and actual postcommit
Git objects establish the terminal result, exact two paths and clean tree/index.
No wrapper, manual stash, amend, hook bypass, rebase or history rewrite is used.

Original 009 and seed S-04-06 are implemented pending full independent correction.
This protects T-04-17's existing shared-root single-attempt command boundary.
No security-relevant surface outside the existing threat model changes.
RUN-01 stays Pending. WINDOWS 46-53 stay OPEN and unwaived. Remaining causes,
full ACCOUNT correction, full gates and shared-state advancement stay with the
parent. No new policy, correction count, fixed-ID reopening or closure is claimed.

## CR-04-ACCOUNT-011: construction title and existing observation overlap

**Requirement:** RUN-01. **Original severity:** BLOCKER.
**Rule:** unit writer/reviewer, central title-discrimination rule and Assertions.
**Owning task:** 04-09-01.
**Disposition:** applied through original 013 overlap, pending independent full ACCOUNT correction.
**Fixer:** gsd-code-fixer, /root/phase4_account_trust/account_011_construction_scope.
**Current revision:** fa8a21f298aef15e659344aa723a756934affa4c.
The original location remains R:test/runtime/accountRuntime.test.ts:3087-3118.
The current case occupies test/runtime/accountRuntime.test.ts:8554-8583.
All original 29 IDs, initial 18 BLOCKER/11 WARNING counts and correction counter 0 remain.
This disposition records existing implementation overlap. It supplies no independent correction or finding closure.

### Existing accepted remedy and actual case

Original 011 permits a narrow title plus source/design review of the construction prohibition.
Original 013 implemented that remedy at 95a99345e6f0e680c06ed322a1be7a5da82ff838.
Its actual owner diff replaces the broad connection/file/timer title with
`builds every collaborator without requesting HTTP or opening a socket`.
It replaces the fetch replacement/count and socket counter with exact-parameter strong mocks.
Neither mock allows a call. The case asserts the public unavailable monitoring path, then explicitly verifies both mocks.
The current complete case retains those observations through fa8a21f.
The 013 appendix and 07 summary already disclose this narrower promise.

The case calls only exported createAccountRuntimeFromConfig and reads the public monitoringPath.
Its temporary directory belongs to case setup and cleanup.
The title claims neither file-read nor timer observation.
No missing current assertion requires another owner edit or duplicate scenario.
This preserves the accepted original finding and its implementation history without a rejection or replacement ID.

### Current construction design and actual callers

Source/design inspection retains the writer rule: construction opens no connection, reads no file and starts no timer.
The complete current source was read, including both factory bodies and every returned operation.
The composed adapter constructors and actual platform/World caller bodies were inspected.
The relevant current boundaries are:

| Boundary | Current source evidence |
| --- | --- |
| Composition | accountRuntime.ts:1290-1341 creates auth, API, state, failure-log, anchors and the runtime. Its shadow factory remains a deferred callback. |
| Runtime | accountRuntime.ts:342 creates the root, two retry policies, reconciliation, health and local state. It defines operations without invoking launch or background loops. |
| Authentication | auth.ts:521 initializes local state and returns idToken. currentToken calls readCachedToken at line 566 only through that operation. |
| Anchor storage | arrivalAnchors.ts:169 creates the map. restore reads storage at line 186 onward, and persist owns writes. |
| Other composed factories | api.ts:186 returns request methods. state.ts:324, failureLog.ts:62, monitoringHealth.ts:235 and reconciliation.ts:77 initialize maps or local state. |
| Retry scheduling | retryPolicy.ts:49 defines the policy. schedule invokes waitThenRun, which owns timers.setTimeout. Construction invokes neither. |
| Shadow transport | The deferred runtime callback creates the client only during credential work. shadow.ts:217 initializes state, and its start at line 461 invokes openConnection. |
| Lifecycle | accountRuntime.ts:1168 starts anchor restoration before launch. Background polling and credential loops start through launch, after the existing ownership guards. |
| Platform caller | platform.ts:591 constructs the runtime. Its launch callback at lines 617-629 calls start with validated known physical IDs. |
| Other callers | features/support/world.ts:648 constructs and line 704 starts. realWorld.ts:298 constructs through its existing createRuntime operation. |

This is bounded static design evidence. It adds no automated file-read or timer claim to the construction case.
All existing source, owner, adapter, helper, case, assertion and header bytes remain unchanged.
No contract, private member, alias, public shape, dependency or configuration changes.
D-06 contract-change queries are not triggered by this report-only disposition.
Canonical reported authority, single-attempt commands and current root/lifecycle ownership remain exact.

### Verification location, unchanged inputs and native records

The full 1341-line source, 9010-line owner and 5498-line preceding report were read through bounded contiguous ranges.
Complete AGENTS/bootstrap and all five project books were loaded, including the unit reviewer.
Current 09 plan, protocol, CONTEXT, RESEARCH, PATTERNS, FINDINGS, canonical decisions and applicable STATE were read.
Prior 07/08/11/12 summaries and actual adapter constructors/callers supplied the overlap and design context.
This scoped cause disposition supplies no independent full-owner correction judgment.

All current checks run in the existing linked features/code-review-sweep checkout with workflow.use_worktrees=false.
The persisted 04/04-09 isolation sentinel reads none. No additional checkout or recovery sentinel is created.
Fresh resolver records select an omitted model, high effort and opus tier. Execution resolution confirms high effective effort.
Native records remain under /private/tmp/guardian-04-account-011/.
Each subprocess retains exact argv/cwd, raw exit, actual UTC start/end, Node/npm and separate complete stdout/stderr.
Before/after snapshots retain all 702 input identities and modes, complete owned bytes, dirty/index patches and compiled copies.

The same-session focused evidence belongs to the final 009 candidate committed as fa8a21f.
The exact comparator is `git diff fa8a21f298aef15e659344aa723a756934affa4c -- . ':(exclude,glob).planning/**/*.md'`.
Its output is empty, and no untracked executable input exists.
Every non-planning-Markdown input in each reused command manifest matches current bytes and mode.
The current Node v26.11.1 and npm 11.20.0 match those records.
Complete argv, versions, UTC, raw exits and input identities remain in /private/tmp/guardian-04-account-009/:

| Reused native record | Actual scope and result |
| --- | --- |
| build-restored | npm run build:test, exit 0, 19:12:43.118725-19:12:46.138960 UTC |
| owner-final | Full compiled native TAP owner, exit 0, 19:12:54.536343-19:12:54.977162 UTC. All 167 tests pass, with zero fail/cancel/skip/todo. |
| direct-final | Exact account source/owner test:coverage:direct selector with fresh build, exit 0, 19:12:55.548853-19:12:59.433634 UTC |
| native-coverage-final | Full owner with exact-source include and all three 100% thresholds, exit 0. Native LCOV records 1003/1003 lines, 58/58 functions and 193/193 branches. |
| lint-final | Exact source/owner ESLint --max-warnings=0 --no-cache, exit 0 |
| commit | Normal foreground commit and ordinary hooks, exit 0, producing fa8a21f at 19:18:05.703570 UTC |

Current reuse-before and preservation-before records exit 0.
They preserve all 701 inputs outside this report and its complete 373579-byte prefix.
The current installed RED CLI accepts both actual unchanged files with exit 0 and RED_EVIDENCE_OK.
The SAME installed classifyRedEvidence recursively accepts all fourteen ACCOUNT and two PLATFORM records.
Every recorded sourceCommit:path resolves to its original sourceBlob.
ACCOUNT evidence remains b3f7141fc652706628ec55c5bd5c1a3e4b560319.
PLATFORM evidence remains 5a35d0831979b6c7444b598c0987bdd9d98f758b.
The original plan ledger and parent initial-ledger-checkpoint.json remain exact.
The source remains c87b9330ad2589e7941c11aba90f2079c67dbc30.
The complete owner remains 169775e1c3bc0c457f2ae02eca45567e229835fe.

No new native test, control, genuine RED, production repair or full npm run check is claimed.
Selected coverage does not refresh merged all-pair LCOV. The parent owns the required combined gate.
The earlier e2b884e full gate predates later TypeScript changes and supplies no current full-gate reuse here.

### Atomic report-only closeout and remaining work

Only this report append enters the commit, titled `docs: record construction test scope overlap`.
The recorded-base Fallow audit uses the actual 09 base 8a700ac4b3594bf0c16af0a5e3ce35223ef3f574.
The audit exits 0 with verdict pass and zero issues at 19:23:32.850818 UTC.
The exact one-path pre-step exits 0, clean without formatter changes, at 19:23:40.059064 UTC.
Final audit, preservation and pre-step repeat after this result entry before staging.
The exact required SKIP=npm-check pre-commit run --files covers this final path before staging.
Report or formatter changes require another clean terminal pre-step.
Plain foreground git commit runs ordinary hooks with SKIP absent.
Final audit, preservation, pre-step, hook streams and actual Git objects establish the terminal result.
No wrapper, manual stash, amend, hook bypass, rebase or history rewrite is used.

Original 011 retains applied-overlap status pending independent full ACCOUNT correction.
RUN-01 stays Pending. WINDOWS 46-53 remain OPEN and unwaived.
No correction increment, fixed-ID reopening, rejection, clean verdict or phase completion is claimed.
No security-relevant surface outside the existing threat model changes.
The parent retains remaining causes, full correction, combined gates and shared-state advancement.

## CR-04-ACCOUNT-029: supplied composition rotation floor

**Requirement:** RUN-01. **Original severity:** BLOCKER.
**Rule:** unit writer/reviewer, case-title discrimination and independent Assertions.
**Owning task:** 04-09-01. **Disposition:** applied, pending independent full ACCOUNT correction.
**Fixer:** gsd-code-fixer, /root/phase4_account_trust/account_029_rotation_floor.
**Pre-edit HEAD:** 028ea7f677e60b579822cf08b57e7ccc0c7cafa2.
Original location remains R:test/runtime/accountRuntime.test.ts:3157-3199.
The retained lead case starts at current owner line 8647; the new floor case starts at 8746.
The original 29 IDs, initial 18 BLOCKER/11 WARNING counts and correction counter 0 remain.
This is assertion maintenance on correct production, with no independent correction or clean verdict.

### Existing timing overlap and minimum remaining repair

Original 007 independently protects the bundled 600000-ms lead and 30000-ms floor.
Original 013 already supplies exact finite HTTP expectations and owning-case verification.
The direct-runtime short-floor case reaches the runtime options but bypasses composition.
The existing composition case returns credentials an hour away, so its deadline exercises only the supplied lead.
Its complete body, timer operations, request expectations and assertions remain byte-exact.
Only its title narrows to the lead promise it actually observes.

One separate case calls the public createAccountRuntimeFromConfig factory.
The supplied response expires five milliseconds after the initial wall time, inside the supplied ten-ms lead window.
The independently expected five-ms floor is observed immediately before and at its boundary.
ACT advances literal four milliseconds, captures complete public state, then advances one millisecond and captures again.
The request history must be [0] at four ms and [0, 5] at five ms.
Both checkpoints also require the complete independently specified canonical snapshot and poll-only path.
The snapshot retains physical identity, connectivity, all telemetry, metadata, watermark, device time and receipt time.
Shutdown is completed before ASSERT and must leave the public path unavailable.

The exact-parameter HTTP mock permits one token exchange, one inventory and two credential requests.
Each response is fresh; exact method, URL, authorization, user agent, body and initially live signals are prescribed.
The case explicitly verifies the mock after all whole public observations.
The offline broker refusal drives the existing poll-only path without a live network connection.
Separate wall and monotonic bases retain their existing units.
The existing root, mutable credential cache, role registration, request deadlines and single credential loop remain unchanged.
No retry/deadline policy, helper, seed, API, package or configuration is introduced.

Complete AGENTS/bootstrap, all five project books, current 09 plan, protocol,
CONTEXT, RESEARCH, PATTERNS, FINDINGS, canonical decisions, applicable STATE,
PROJECT/ROADMAP/REQUIREMENTS and prior 07/08/11/12 summaries were loaded.
The complete current 1341-line source, 9010-line owner and 5619-line report were read through bounded contiguous ranges.
Actual platform and both World factory/start callers retain default and optional override behavior.
The traced path is composition -> createAccountRuntime -> runCredentials ->
refreshCredentials -> rotationDelayMs -> waitWhileRunning/waitFor, with the real auth/REST HTTP boundary.
Production correctly forwards deps.minRotationDelayMs; no production defect is inferred.
No existing shared/public/private name, signature, member, alias, mutability or visibility changes or deletion triggers D-06 impact requirements.
Both approved complete headers, .js imports and all existing contracts remain intact.

### Separate maintenance control and exact restoration

The plausible wrong behavior wires MIN_ROTATION_DELAY_MS instead of the caller's floor.
Compilation, lint and direct coverage cannot establish that composition honors this value.
The sole temporary production edit replaces the minRotationDelayMs composition expression with that bundled constant.
The fresh control build exits 0.
The unique named new target exits 1 at the intended whole deepStrictEqual assertion:
the five-ms checkpoint has credentialRequests [0], while the independent expectation is [0, 5].
Both complete snapshots and poll-only paths remain correct.
Native AssertionError, ERR_ASSERTION and deepStrictEqual identify the failure.
Exactly one test executes, with zero skip/cancel/todo and no setup or unexpected-mock failure.
The native process completes in about 0.3 seconds; no timeout supplies the result.

The full production source was restored through Git and compared byte for byte before GREEN checks.
Before/restored source blob is c87b9330ad2589e7941c11aba90f2079c67dbc30.
Temporary control blob is ebb87ce271dc3588dd6080219389276bbef7337a.
The source diff is empty. Fresh rebuilt lead and floor named targets both pass.
The final owner is 04481f0b4f91a2c63a03bc46e9f13f981e45f598, identical to the control owner's bytes.
No temporary mutation or new genuine RED record enters Git.

### Native checks, preservation and verification location

All checks run serially in the existing linked features/code-review-sweep checkout,
with workflow.use_worktrees=false, Node v26.11.1 and npm 11.20.0.
Fresh model/execution resolution selects an omitted model, high effective effort and opus tier.
The persisted phase 04/plan 04-09 sentinel remains isolation none.
No additional checkout, branch or recovery sentinel is created.
Native directory: /private/tmp/guardian-04-account-029/.
Every subprocess record retains exact argv/cwd, actual UTC start/end, raw exit,
Node/npm, before/after HEAD, all 702 input identities and modes, complete dirty/index patches,
full owned bytes, compiled source/owner copies and complete separate stdout/stderr.
The initial snapshot also saves every complete tracked/nonignored input.
Every process reaches terminal completion before dependent edits or builds.

| Native record | Actual terminal result |
| --- | --- |
| preedit-guard, guard-control, guard-restore, guard-report | Exact three authorized paths before changes; exit 0, no configured zones or rule packs |
| build-baseline, target-baseline, lint-baseline | Fresh build, exact new target and uncached pair lint; exit 0 |
| control-build, control-target | Build 0; intended named assertion failure 1, 19:31:53.243614-19:31:53.550921 UTC |
| restore-source, build-restored, target-restored | Exact source restoration; fresh build 19:32:03.209981-19:32:06.092037 UTC; both lead/floor targets pass; exit 0 |
| owner-final | Full compiled native TAP, exit 0, 19:32:19.175595-19:32:19.630602 UTC; 168 pass, zero fail/cancel/skip/todo |
| direct-final | Exact npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts with fresh build; exit 0 |
| native-coverage-final | Full owner with exact compiled-source include and all three 100% thresholds; exit 0; 1003/1003 lines, 58/58 functions, 193/193 branches; accountRuntime-final.lcov retained |
| lint-final | Exact source/owner ESLint --max-warnings=0 --no-cache; exit 0 |
| account-evidence, platform-evidence | Current installed on-disk RED CLI; exit 0, RED_EVIDENCE_OK for both unchanged files |
| preservation | Complete original case/assertion-order, source restoration, report-prefix and unrelated-input comparisons; SAME installed recursive classifier over all sixteen records; exit 0 |
| audit | Fallow audit against actual 09 base 8a700ac4b3594bf0c16af0a5e3ce35223ef3f574, JSON/quiet/explain; exit 0, verdict pass, zero introduced issues |

All executable candidate checks pass; the deliberate maintenance control is the intended failure.
Early read-only discovery had an unmatched temporary-path glob and a denied unrelated temporary directory listing.
Those tool results changed no repository input and supply no test or provenance evidence.
No unsuccessful native test or preparation attempt is omitted or relabeled as genuine RED.

preservation-proof.json retains all 150 complete saved/current original authored cases,
their exact assertion/verify sequences and order, and the one new case.
Reversing only the new case and truthful lead title reproduces the entire original owner byte for byte.
The entire 383144-byte previous report remains an exact prefix before this append.
All 700 inputs outside owner/report retain their saved hashes and modes.
Original 024, every literal 025 deadline and stronger 013 verification, 023 rows,
021 callback/neighbor proof, 022 real-shadow/order cases, 018 frozen/refused readbacks,
019 checkpoints, 020 anchors, 026 fixture/contracts and all prior negative controls remain intact.
The existing 09 plan ledger retains 8a700ac4b3594bf0c16af0a5e3ce35223ef3f574.
The parent's initial-ledger-checkpoint.json retains SHA-256 aef5e272b16ba900cae197a46420256be5bb9f530c77061d8fe14f979627af53.

ACCOUNT evidence remains b3f7141fc652706628ec55c5bd5c1a3e4b560319 with fourteen complete records.
PLATFORM evidence remains 5a35d0831979b6c7444b598c0987bdd9d98f758b with two complete records.
The SAME installed classifyRedEvidence accepts every recursive record as RED_EVIDENCE_OK;
each sourceCommit:path resolves to its original sourceBlob, and every raw history remains byte-exact.
No second parser or replacement history is introduced.
Selected native LCOV does not refresh merged all-pair source-map LCOV.
No full npm run check, full-gate reuse, independent correction or closure is claimed; the parent owns those remaining gates.

### Atomic closeout and remaining work

Only test/runtime/accountRuntime.test.ts and this append enter the cause commit,
titled test: verify the supplied composition rotation floor.
Recorded-base audit and preservation repeat after the append.
The exact required SKIP=npm-check pre-commit run --files covers both FINAL paths before staging.
Any report or formatter change requires another clean terminal pre-step.
Plain foreground git commit runs all ordinary hooks with SKIP absent.
Final audit, preservation, pre-step, hook streams and actual postcommit Git objects establish completion.
No wrapper, manual stash, amend, hook bypass, rebase or history rewrite is used.

Original 029 is implemented pending full independent ACCOUNT correction.
This preserves the existing command/composition threat boundary without new security-relevant surface or product meaning.
RUN-01 stays Pending. WINDOWS 46-53 remain OPEN and unwaived.
No correction increment, fixed-ID reopening, rejection, clean verdict or phase completion is claimed.
The parent retains remaining causes, full correction, combined gates and shared-state advancement.

## CR-04-ACCOUNT-016: separate actions, captures and assertions

**Requirement:** RUN-01. **Original severity:** WARNING.
**Rule:** unit writer/reviewer, Case structure: ordered arrange/act/assert;
the combined marker permits only one throwing or rejection expression.
**Owning task:** 04-09-02. **Disposition:** applied, pending independent full ACCOUNT correction.
**Fixer:** gsd-code-fixer, /root/phase4_account_trust/account_016_case_phases.
**Pre-edit HEAD:** fbc4c02381aa53a57219b2cd41236e8e572af653.
Original locations remain R:test/runtime/accountRuntime.test.ts:1623-1624,
2631-2645, 2664-2683, 3331-3338, with wrappers at 1486-1490 and 3234-3238.
The original 29 IDs, initial 18 BLOCKER/11 WARNING counts and correction counter 0 remain.
This structural repair supplies no independent correction, reopening or clean verdict.

### Existing overlap and eight remaining cases

Original 012 already captures the failed-final-check and refused-removal checkpoints before ASSERT.
Original 013 preserves those captures while adding explicit owning-case strict verification.
Original 020 adds complete ordered removal observations before its assertions.
Those removal cases already have one arrange/act/assert sequence and remain byte-exact here.
The existing 018, 009 and 010 cases also separate their actions and public captures correctly.
No duplicate repair, split scenario or new test is needed for those overlaps.

Eight current cases still carried an invalid combined marker:

| Current owner case location | Remaining structural repair |
| --- | --- |
| 4214, 4234, 4254, 5209 | Start each stop operation and await its promise in ACT; retain doesNotReject on that same promise in ASSERT |
| 4309 | Start and await runtime.start, then settle in ACT; retain its no-rejection assertion afterward |
| 4590 | Capture the ordinary monitoringPath read in ACT and compare it in ASSERT |
| 8877 | Tick and finish settling in ACT; retain the no-rejection assertion on the settling promise afterward |
| 8980 | Finish both tick/settle sequences and capture the device-request count in ACT; retain no-rejection and literal count 4 assertions afterward |

Awaited operations retain the existing no-throw promise: a synchronous throw or
rejected operation still fails its case. Every original assertion method and
expected literal remains in its original order. Only the observed argument
changes from an action callback or inline read to its captured promise/value.
There is no multi-operation assertion callback or return to ACT after ASSERT.
All 151 authored declarations now have exactly one ordered phase sequence.
Generated rows still execute 168 cases; no title or row changes.

The full 1341-line source, 9120-line pre-edit owner and 5757-line report were read.
Bounded follow-up reads filled actual truncated-output gaps.
Complete AGENTS/bootstrap, all five project books, current 09 plan, protocol,
CONTEXT, RESEARCH, PATTERNS, FINDINGS, canonical decisions, applicable STATE
and prior 07/08/11/12 summaries were loaded before repository edits.
Actual case callers are native test registration and their local harness.
The complete harness, settle, fakeShadow, anchor fixture and composition bodies
were traced through public start/stop, credential work, polling and callbacks.
Platform and both World composition/lifecycle callers retain their contracts.
No helper, source, seed, public/shared/private name, signature, member, alias,
visibility or mutability changes or deletion triggers D-06 impact requirements.
Both complete headers, imports and all existing contracts remain exact.

### Fresh native checks and verification location

All checks run serially in the existing linked features/code-review-sweep checkout,
with workflow.use_worktrees=false, Node v26.11.1 and npm 11.20.0.
Fresh model/execution resolution selects an omitted model, high effective effort and opus tier.
The persisted phase 04/plan 04-09 sentinel remains isolation none.
No new checkout, branch or recovery sentinel is created.
Native directory: /private/tmp/guardian-04-account-016/.
Each subprocess record retains exact argv/cwd, actual UTC start/end, raw exit,
Node/npm, HEAD, all 702 input identities/modes, complete dirty/index patches,
owned source/owner/report copies, compiled copies and complete separate streams.
The initial snapshot also saves all complete input files and literal symlink targets.
Every process reaches terminal completion before dependent edits or builds.

| Native record | Actual terminal result |
| --- | --- |
| preedit-guard, guard-report | Exact two authorized paths before edits/formatting, exit 0; no configured zones or rule packs |
| format | Exact owner Prettier, exit 0; unchanged |
| build | npm run build:test, exit 0, 19:41:53.744078-19:41:56.670161 UTC |
| owner | Full compiled native TAP, exit 0, 19:42:05.939785-19:42:06.371511 UTC; 168 pass, zero fail/cancel/skip/todo |
| direct | Exact npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts with fresh build, exit 0 |
| native-coverage | Full owner, exact compiled-source include and all three 100% thresholds, exit 0; 1003/1003 lines, 58/58 functions, 193/193 branches; accountRuntime.lcov retained |
| lint | Exact source/owner ESLint --max-warnings=0 --no-cache, exit 0 |
| account-evidence, platform-evidence | Current installed on-disk RED CLI, exit 0 and RED_EVIDENCE_OK for both immutable files |
| preservation | Full case/phase/assertion-order and unrelated-input comparison, SAME installed recursive classifier over all sixteen records, exit 0 |
| audit | Fallow audit --base 8a700ac4b3594bf0c16af0a5e3ce35223ef3f574 --format json --quiet --explain, exit 0, verdict pass; zero introduced issues |

All executable checks pass on the sole candidate; the formatter changes nothing.
No temporary control is needed for the phase-only change, and none is run.
No genuine production bug, new RED record or full npm run check is claimed.
The parent owns the combined gate. Selected LCOV does not refresh merged all-pair LCOV.
One read-only resolver search used an unmatched shell glob; its tool failure
changed no input and supplies no test result. Oversized read outputs received
bounded follow-up reads. No unsuccessful executable verification is hidden.

### Exact preservation and atomic closeout

preservation-proof.json retains complete saved/current changed cases and their
assertion sequences. All expected arguments and assertion methods match in order.
The other 143 complete cases and all owner text outside the eight cases are byte-exact.
Replacing only those eight bodies with their originals reproduces the entire old owner.
No case, assertion, literal expectation, explicit verification or public observation is removed.
Source remains c87b9330ad2589e7941c11aba90f2079c67dbc30.
Owner changes from 04481f0b4f91a2c63a03bc46e9f13f981e45f598
to 7a89b75213e76a1130bf9274c7ae92b8dc2c4f8a.
The complete 393906-byte previous report remains an exact prefix before this append.
All 700 inputs outside owner/report retain their saved hashes and modes.

Original 024, every literal 025 deadline and stronger 013 verification, both 023
rows, 021 callback/neighbor proof, 022 real-shadow/order cases, 018 frozen/refused
readbacks, 019 checkpoints, 020 anchors, 026 fixture/contracts and all negative
controls remain byte-exact. Original 009's actual pending/refused command and
010's complete outcomes/canonical observations remain byte-exact. Original 029's
literal four/five-ms floor case and the complete retained lead case remain exact.
ACCOUNT RED remains b3f7141fc652706628ec55c5bd5c1a3e4b560319, with fourteen records.
PLATFORM RED remains 5a35d0831979b6c7444b598c0987bdd9d98f758b, with two records.
The SAME installed classifyRedEvidence accepts all sixteen recursively;
each sourceCommit:path resolves to its original sourceBlob. Raw histories remain exact.
No second parser, replacement history or historical waiver is introduced.
The original 09 plan ledger and parent's initial-ledger-checkpoint.json remain exact.

Only test/runtime/accountRuntime.test.ts and this append enter the cause commit,
titled test: separate account runtime case phases.
Recorded-base audit and preservation repeat after this append.
The exact required SKIP=npm-check pre-commit run --files covers both FINAL paths
before staging; any report or formatter change requires another clean terminal pre-step.
Plain foreground git commit runs all ordinary hooks with SKIP absent.
Final audit, preservation, pre-step, hook streams and actual Git objects establish completion.
No wrapper, manual stash, amend, hook bypass, rebase or history rewrite is used.

Original 016 is applied pending full independent ACCOUNT correction.
RUN-01 stays Pending. WINDOWS 46-53 remain OPEN and unwaived.
No correction increment, fixed-ID reopening, rejection, clean verdict or phase completion is claimed.
No security-relevant surface outside the existing threat model changes.
The parent retains remaining causes, full correction, combined gates and shared-state advancement.

## CR-04-ACCOUNT-017: groups name the exported runtime factories

**Requirement:** RUN-01. **Original severity:** WARNING.
**Rule:** unit writer/reviewer, Case structure: one top-level describe per
exported entrypoint; no nested concern groups or shared mutable setup.
**Owning task:** 04-09-02. **Disposition:** applied, pending independent full ACCOUNT correction.
**Fixer:** gsd-code-fixer, /root/phase4_account_trust/account_017_entrypoint_groups.
**Pre-edit HEAD:** 2e669f75032573047f2b87630ac5dc4717d9aa46.
Original locations remain R:test/runtime/accountRuntime.test.ts:623,869,1050,
1399,1618,2538,2975,3086,3342. Current factory groups begin at owner 923 and 8511.
The original 29 IDs, initial 18 BLOCKER/11 WARNING counts and correction counter 0 remain.
This organization change supplies no independent correction or clean verdict.

### Factory ownership and exact case preservation

The nine original describe groups become exactly two top-level groups:
createAccountRuntime owns 138 authored cases and createAccountRuntimeFromConfig
owns eight. Five authored fixture-contract declarations remain independent;
their generated rows exercise the existing account shadow and anchor participants.
No describe is nested. Every stateful case still constructs fresh dependencies.
No shared mutable setup, new scenario, helper abstraction or data refactor is added.

The actual harness and endToEndRuntime call createAccountRuntime. The eight
configuration cases call createAccountRuntimeFromConfig. AUTH-01 calls the former
through endToEndRuntime, so it moves from after the configuration group to the end
of the createAccountRuntime group, immediately before configuration cases.
This is the sole change to relative case order. Order within each factory group
and all other case order remain exact. The parent explicitly permitted this
necessary organization choice after the initial pre-edit ordering conflict.

PendingInventory, endToEndRuntime, stubCloud and credentialRequestCount move
before the factory groups while retaining their module lexical scope, complete
raw declarations and signatures. The existing removal-local devicesCallCount
retains its body and signature inside the runtime factory group. Scope inspection
finds no colliding direct declarations. No public/shared/private alias, member,
shape, visibility or callable contract changes, so D-06 contract-change impacts
are not triggered. No unsupported private query supplies deletion permission.

Complete source 1-1341, owner 1-9146 and prior report 1-5886 were read before edits.
Bounded follow-up reads filled actual output truncation gaps. AGENTS/bootstrap,
all five complete books, 09 plan, protocol, CONTEXT, RESEARCH, PATTERNS, FINDINGS,
canonical decisions, applicable STATE and prior 07/08/11/12 summaries were loaded.
Actual platform and both World factory/lifecycle callers were inspected.
Both complete approved headers and .js imports remain intact.

The installed TypeScript parser compares every complete saved/current case.
All 151 authored case ASTs, complete token streams, literal spellings, assertion
payloads, verify calls and ordered AAA phases match exactly. All 35 function and
interface declarations retain their semantics. The four relocated module-level
declarations also retain exact raw text and module scope. Before/after full case
order lists and all raw bodies/tokens/ASTs remain in preservation proof files.
Only describe boundaries, indentation, declaration placement and the one permitted
AUTH case position change. A required blank line at a flattened boundary resolves
the sole lint error; the final formatter changes nothing.

### Retained owner interruption and separate fixture follow-up

The first full native owner stalls after 159 passing cases, before reporting the
moved AUTH case. Its child receives controlled SIGTERM after about 47 seconds.
owner.json retains raw exit 1, complete TAP/stderr and the file-level
ERR_TEST_FAILURE/SIGTERM. No intended assertion failure, original filesystem
error, EBUSY or cleanup trace was captured. This is an interrupted execution,
not genuine production RED, a reopened fixed finding or a passing check.
The same unchanged compiled owner retry with a native ten-second test bound
passes all 168 cases in about 0.45 seconds. That retry does not erase the hazard.

The first recursive cleanup remains original 024, now at owner 2213.
Its case enables fake setTimeout at 2135 and stops the runtime before recursive
rm, without an explicit timer reset. AUTH's unchanged endToEndRuntime cleanup
at 843 uses maxRetries 3/retryDelay 100. AUTH itself enables no fake timers.
Its cleanup hook is registered before its separate runtime-stop hook.
Moving AUTH does not make it the first recursive rm under mocked timers.
The earlier platform investigation proves Node's lazy internal/fs/rimraf can
capture a mocked retry timer; that is a plausible existing fixture hazard here.
The precise cause of this interruption remains unconfirmed.

The concrete separate follow-up must inspect all account recursive cleanup sites,
not depend on test ordering or one priming case:

| Current cleanup owner | Current line | Existing timer/cleanup boundary |
| --- | ---: | --- |
| endToEndRuntime / AUTH-01 | 843 | Real-timer case; recursive retry settings 3/100 |
| Original 024 pending final inventory | 2213 | Mocked setTimeout; stop then recursive rm |
| Registration-before-composed-use | 8581 | Stop then recursive retry cleanup |
| Inert construction | 8625 | Recursive retry cleanup |
| AUTH-02 composed registration | 8672 | Recursive retry cleanup |
| Supplied rotation lead | 8770 | Mocked setTimeout; recursive retry cleanup |
| Supplied rotation floor | 8882 | Existing explicit reset before recursive cleanup |
| Default monitoring listener | 8926 | Mocked setTimeout; recursive retry cleanup |
| Supplied monitoring listener | 8981 | Mocked setTimeout; recursive retry cleanup |
| Default removal listener | 9091 | Mocked setTimeout; recursive retry cleanup |

Declare that bounded test-fixture cause separately. Reproduce an actual account
cleanup retry under bounded native execution before choosing a repair. If the
timer-capture cause is confirmed, reset owning timer contexts before recursive
cleanup while preserving all operations/assertions and production. No such
diagnostic control or fixture repair is included in 017. cleanup-assessment-proof.json
retains exact before/current sites, the failed native run and unchanged retry.

### Final formatted-input checks and verification location

All commands run serially in the existing linked features/code-review-sweep
checkout with workflow.use_worktrees=false, Node v26.11.1 and npm 11.20.0.
No isolated worktree, branch or recovery sentinel is created. The persisted
04/04-09 isolation sentinel reads none. Fresh resolver/execution records retain
the omitted model and high effective effort. The original 09 ledger remains
8a700ac4b3594bf0c16af0a5e3ce35223ef3f574; the parent checkpoint remains exact.

Native directory: /private/tmp/guardian-04-account-017/.
Each subprocess retains exact argv/cwd, raw exit, real UTC start/end, Node/npm,
HEAD, all 702 input identities/modes, full dirty/index patches, complete owned
bytes, compiled copies and separate full stdout/stderr. Initial snapshots save
every full tracked/nonignored input and literal symlink target. Each mutation
finishes before another edit/build; no active process is treated as completion.

| Final-input native record | Actual terminal result |
| --- | --- |
| final-format | Exact owner Prettier, exit 0, unchanged |
| final-build | npm run build:test, exit 0, 19:55:24.366037-19:55:27.345286 UTC |
| final-owner | Full native TAP owner, exit 0, 19:55:27.967758-19:55:28.430064 UTC; 168 pass, zero fail/cancel/skip/todo |
| final-direct | Exact npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts with fresh build, exit 0 |
| final-native-coverage | Full owner with exact compiled-source include, ten-second native test bound and all three 100% thresholds, exit 0; 1003/1003 lines, 58/58 functions, 193/193 branches; accountRuntime-final.lcov retained |
| final-lint | Exact source/owner ESLint --max-warnings=0 --no-cache, exit 0 |
| account-evidence, platform-evidence | Current installed on-disk RED CLI, exit 0 and RED_EVIDENCE_OK for both unchanged histories |
| preservation-before-report | All 151 token/AST/case/assertion comparisons and SAME installed classifier over all sixteen recursive records, exit 0 |

The initial native owner interruption/raw 1 and unchanged retry/raw 0 remain
separate from these final-input successes. Initial lint exits 1 for the required
blank line at the flattened group boundary. An initial patch-format attempt
fails before changing any repository byte; the corrected patch applies cleanly.
The sandbox denies read-only ps; the authorized retry inspects only the actual
owned test process tree, then controlled child termination collects native output.
A temporary assessment output name initially overlaps its command record; the
complete assessment is retained under the distinct proof name above. No failed
attempt is discarded, relabeled as RED or used as a passing final result.

### Active regressions, immutable histories and atomic closeout

The complete 402985-byte prior report remains an exact prefix. All 700 input
paths outside owner/report retain their saved hashes and modes. Source remains
c87b9330ad2589e7941c11aba90f2079c67dbc30. Owner changes from
7a89b75213e76a1130bf9274c7ae92b8dc2c4f8a to 3f2991823b157d31f41e1c2a88c3faa710f9cdc7.
This is not a blanket owner byte-freeze claim: regrouping indents active RED
cases and changes their suite-qualified names, while preserving their complete
tokens and semantics. Saved historical patches and current complete bodies are
retained together. Original 024 remains semantically exact; 025 keeps every
literal deadline, timer operation and original assertion plus stronger 013
verification. Both 023 rows, whole 021 callback/neighbor case, real-shadow 022
and order case, 018 frozen/refused readbacks, 019 checkpoints, 020 anchors,
026 fixture/contracts, 009 pending/refused command, 010 canonical observations
and 029 literal four/five-ms floor all retain their pre-edit token streams.

ACCOUNT evidence remains b3f7141fc652706628ec55c5bd5c1a3e4b560319, with fourteen
records. PLATFORM remains 5a35d0831979b6c7444b598c0987bdd9d98f758b, with two.
The SAME installed classifyRedEvidence recursively accepts all sixteen, with
every sourceCommit:path resolving to its original sourceBlob. Complete raw
histories, prior patches and actual evidence-first ancestry remain unchanged.
No second parser, rewritten JSON, new genuine regression or new control is added.
Selected native LCOV does not refresh merged all-pair source-map LCOV.
No full npm run check, full-gate reuse or independent correction is claimed.

Only test/runtime/accountRuntime.test.ts and this append enter the atomic cause
commit, titled test: group account cases by exported factories. Recorded-base
Fallow audit uses 8a700ac4b3594bf0c16af0a5e3ce35223ef3f574. Preservation and audit
repeat after this append. Exact SKIP=npm-check pre-commit run --files covers
both final paths and must finish clean before staging; any formatter/report
change requires clean repetition. Plain foreground git commit runs ordinary
hooks with SKIP absent. Native terminal records and actual Git objects supply
the resulting hash and exact paths. No wrapper, manual stash, amend, hook bypass,
rebase or history rewrite is used.

Original 017 is applied pending full independent ACCOUNT correction. The explicit
fixture-hazard follow-up remains with the parent and receives a separate declared
cause. RUN-01 stays Pending. WINDOWS 46-53 remain OPEN and unwaived. No correction
increment, fixed-ID reopening, rejection, phase completion or new security-relevant
surface is claimed. The parent retains remaining causes, full correction, combined
gates, shared records and the worktree-setting restoration obligation.

## Declared task 04-09-03: account storage cleanup timer isolation

The amended declaration landed at fb57728454df9eeb5262eba9f08a4e43e5c965ef
before these edits. This separate fixture cause adds five context-owned timer
resets before affected recursive storage cleanup. It changes no production code,
public API, helper shape, test assertion, deadline, retry option or hook order.
The original 29 finding IDs, correction counter zero and all eight initial
09 cause promises remain intact. This is neither production RED nor an
independent review, reopened finding or full correction result.

### Confirmed control mechanism and historical limits

The preceding 017 natural owner attempt exited raw 1 before AUTH-01. Its original
filesystem error was not captured. Its unchanged retry exited 0, and its final
168-case checks passed. Those observations remain separate and unchanged.

The executor's already-completed unchanged-owner control retained every input
and compiled byte. Cleanup ordinal 1 was the original 024 account-halt fixture,
with mocked setTimeout still enabled. Cleanup ordinal 2 was endToEndRuntime's
AUTH account fixture. The unchanged preloader injected one EBUSY at that second
root. The owner then stalled after 159 passing cases. The external 15-second
bound sent SIGTERM to owned process group 90171; actual raw exit was 1. No
SIGKILL was needed, and the group was gone. No new baseline control was run.

Installed Node v26.11.1 lazily loads internal rimraf, whose module captures
setTimeout from timers. Its retryable errors include EBUSY. Static inspection
and the unchanged control confirm that loading rimraf while the first context
still owns mocked timers can leave later filesystem retry work on that clock.
Connecting this mechanism to the earlier natural interruption remains an
inference: the missing original filesystem error cannot be reconstructed.
No Node internal module was primed, and no retry was disabled.

The baseline records and unmodified preloader remain under
/private/tmp/guardian-04-account-cleanup-investigation. The preparation-only
Python unmatched-parenthesis error recorded there remains a preparation error,
not a native test failure. The control is fixture evidence, not production RED.

### All ten recursive cleanup sites

The table gives saved and current rm line numbers. Only contexts that enable
mocked timers receive a new reset. Four real-timer sites remain byte-exact.
The already-correct floor case retains its complete stop/reset/rm body.

| Context | Saved/current rm line | Timer ownership and change |
| --- | --- | --- |
| endToEndRuntime / AUTH-01 | 843 / 843 | Real timers; unchanged |
| Original 024 pending final inventory | 2213 / 2214 | New reset after existing awaited runtime.stop |
| Registration before composed use | 8581 / 8582 | Real timers; unchanged |
| Inert composed construction | 8625 / 8626 | Real timers; unchanged |
| AUTH-02 composed registration | 8672 / 8673 | Real timers; unchanged |
| Supplied refresh lead | 8770 / 8772 | New reset immediately before rm |
| Supplied refresh floor | 8882 / 8884 | Existing stop/reset/rm; complete case unchanged |
| Default monitoring-health listener | 8926 / 8929 | New reset immediately before rm |
| Supplied monitoring-health listener | 8981 / 8985 | New reset immediately before rm |
| Default removal listener | 9091 / 9096 | New reset immediately before rm |

No new runtime.stop call, helper abstraction, assertion, real sleep, reporter
change, seed, dependency or configuration change accompanies the five resets.
All affected cleanup hooks retain their existing stop-before-reset ordering.
All five required TypeScript and local-verification books, current protocol,
full amended plan, report, source, owner, callers and required planning context
were read before editing. The declared workflow.use_worktrees=false opt-out and
phase/plan isolation-none sentinel remain unchanged; checks ran in this linked
main checkout. There was no new worktree.

### Final-input native results

Complete command records, separate stdout/stderr, UTC boundaries, raw exits,
owned process groups, bounds, input manifests and compiled copies reside under
/private/tmp/guardian-04-account-cleanup-isolation. Node was v26.11.1 and npm
11.20.0. Every row below exited 0 without timeout or SIGKILL; each child group
was gone before subsequent edits or builds.

| Record | Actual command or result |
| --- | --- |
| build-final | npm run build:test; 20:10:33.500128-20:10:36.713150 UTC |
| controlled-after | Exact baseline argv and unchanged fault/preloader; 30-second external bound; 20:10:52.079005-20:10:52.940369 UTC; full 168 pass, zero fail/cancel/skip/todo |
| owner | node --test --test-reporter=tap dist-test/test/runtime/accountRuntime.test.js; full 168 pass |
| direct | npm run test:coverage:direct -- src/runtime/accountRuntime.ts test/runtime/accountRuntime.test.ts; fresh build and 100% |
| native-coverage | Full owner, exact compiled-source include and three 100% native thresholds; full 168 pass; accountRuntime.lcov: 1003/1003 lines, 58/58 functions, 193/193 branches |
| lint | Exact source/owner ESLint --max-warnings=0 --no-cache; exit 0 |
| account-evidence, platform-evidence | Actual installed RED-evidence CLI; both RED_EVIDENCE_OK |
| preservation | Complete saved/current 151-case comparison and SAME installed recursive classifier; exit 0 |

The controlled-after argv was exactly:

```text
node --import=/private/tmp/guardian-04-account-cleanup-investigation/trace-account-cleanup.mjs --test --experimental-test-coverage --test-coverage-include=dist-test/src/runtime/accountRuntime.js --test-reporter=tap dist-test/test/runtime/accountRuntime.test.js
```

The unchanged preloader again injected its single EBUSY at ordinal 2. All ten
cleanup ordinals completed, including that retry, in process group 99683.
The full controlled owner completed naturally within one second. The selected
native LCOV proves this exact source pair; it does not refresh merged all-pair
source-map LCOV or establish the parent's combined gate.

### Exact preservation and retained preparation attempts

All 702 tracked inputs have complete initial copies and full hash/mode manifests.
Every command retains before/after input identities, raw patches and compiled
source/owner copies. All 700 paths outside owner/report, including all 44
production files, retain their exact saved hashes and modes. Production source
remains c87b9330ad2589e7941c11aba90f2079c67dbc30. The owner changes from
3f2991823b157d31f41e1c2a88c3faa710f9cdc7 to
bc5c8bd8e665fd8f6b1fec098a4938d772d230ff. The complete 415074-byte prior
report remains an exact prefix.

This is an explicit five-line teardown change, not a blanket owner byte freeze.
Removing only those five new reset statements restores the entire saved owner
byte-for-byte. Complete saved/current bodies, literal/token streams and ASTs for
all 151 authored cases are retained together in preservation proof JSON. Original
024's full comparison shows the new post-stop teardown reset; every other byte
of that active case remains exact. Original 025 retains every literal deadline,
timer operation and assertion, including stronger 013 verification. Both 023
rows, complete 021 callback/neighbor, real-shadow 022 and ordering, 018 frozen
and refused readbacks, 019 checkpoints, 020 anchors and 026 fixture/contracts
retain their complete prior contents. All helper names, signatures, visibility,
mutability and private aliases remain exact. No D06 shape change is introduced.

ACCOUNT JSON remains b3f7141fc652706628ec55c5bd5c1a3e4b560319 and PLATFORM
JSON remains 5a35d0831979b6c7444b598c0987bdd9d98f758b. The SAME installed
classifyRedEvidence accepts all fourteen recursive ACCOUNT and two PLATFORM
records. Every recorded sourceCommit:path resolves to its original sourceBlob.
There is no second parser or evidence rewrite. The initial 09 ledger checkpoint
is unchanged; its SHA-256 remains
aef5e272b16ba900cae197a46420256be5bb9f530c77061d8fe14f979627af53.

A preparation patch with numbered unified headers was rejected before any edit.
Its normalized form initially matched two identical real-timer cleanup blocks
instead of two intended mocked contexts. Diff inspection caught that scope error
before any test or control. The first candidate build exited 0 and is retained
as build, not final-input evidence. After collecting its actual terminal, a fresh
guard and title-anchored correction restored both real-timer cases and added the
two intended resets. The corrected full owner was reread, freshly rebuilt and
used for every passing test/control above. All preparation attempts are retained.

### Atomic closeout boundary

Only the test owner and this append enter the fixture cause commit. The final
recorded-base Fallow audit uses 8a700ac4b3594bf0c16af0a5e3ce35223ef3f574.
Preservation and audit run against the final append. The exact
SKIP=npm-check pre-commit run --files covers these two final paths and must be
clean before staging; any formatter/report change requires clean repetition.
Plain foreground git commit runs ordinary hooks with SKIP absent. Actual native
terminal records and Git objects establish its exit, resulting hash and paths.
No wrapper commit, manual stash, amend, hook bypass, rebase or history rewrite
is used. No new security-relevant surface was introduced.

Original 017 remains applied pending full independent ACCOUNT correction.
RUN-01 stays Pending; WINDOWS 46-53 remain OPEN and unwaived. The correction
counter remains zero. No SUMMARY, shared record, full npm run check, finding
014 work or full correction is included here. The parent retains those gates,
remaining causes and worktree-setting restoration obligation.

### 2026-10-15 — original 014 fresh concern seeds

Original CR-04-ACCOUNT-014 is applied pending full independent ACCOUNT
correction under 04-09-02. Its bounded change uses the already declared
conditional `test/runtime/accountRuntimeSeeds.ts`. The final paths are that
helper, `test/runtime/accountRuntime.test.ts`, and this appended report.
No production file changed. This is test-data conformance, with no new
production defect, production RED, control mutation, or test case.

The eight owner-local builders moved with their exact signatures and bodies:
`accountConfig`, `geminiDevice`, `otherGeminiDevice`, `bothDevicesAt`,
`geminiWireDeviceList`, `credentialsAt`, `rotatedCredentialsAt`, and
`heartbeatPatch`. The ninth export, `testConstants`, returns the former
constants object's exact literal values and retains its `ProtocolConstants`
result type. All ten former value/property uses now invoke this factory.
Every export is consumed by the owner. These factories return fresh objects,
arrays, nested settings, device data/connectivity, credentials, or heartbeat
data as applicable. Helper module bindings contain only private primitives.
Expected answers remain independently specified in the cases.

The whole existing owner header remains intact. The new helper has the full
SPDX, copyright and fileoverview header and documented typed factories.
No generic helper layer, stateful fake, fixture mode, production export,
private alias, member contract, or extra test data moved or changed.

All required current planning, protocol, context, research, patterns,
findings, canonical decisions, applicable state, prior summaries, production
source, owner and actual callers were read before edits. All five complete
comments, Google style, unit writer, unit reviewer and local verification
books were applied. The scoped unit review preserves the existing groups,
AAA blocks, mocks, verification, operations, assertions and cleanup order.
This scoped check is not the pending independent full correction review.

The pre-write exact three-path Fallow guard returned raw 0 at
20:27:02.590810–20:27:02.987033 UTC and explicitly reported the conditional
helper absent. The initial full snapshot also records its absence. Creation
followed that guard; subsequent owner edits, formatting and this append each
have their own preceding exact guard. Guards report no configured boundary
zones or rule packs. Native records are in
`/private/tmp/guardian-04-account-014/guard-*.json` with separate streams.

The existing builders and constants value were owner-local, nonexported
bindings. Their actual callers and public factory structural types were read
before the bounded extraction. No existing shared/exported API shape or
private alias/member deletion was changed, so no substitute or exception to
D-06 was needed. The new helper inventory was then queried for all nine exact
exports separately in both projects, with `--type-aware`, one
`--type-aware-project`, `--type-aware-require complete --format json --quiet
--explain` per invocation. All nine `tsconfig.test.json` results are raw 0,
status complete, with this owner as the sole direct consumer. All nine
`tsconfig.json` results are raw 1, status unavailable, omission `no-project`,
because the production project excludes test support. These limitations are
retained, not treated as complete proof or a waiver. Exact argv, UTC, raw
status and streams are retained in `impact-inventory.json` and
`impact-*.stdout`/`impact-*.stderr` in the same temporary evidence directory.

Verification ran in the existing linked checkout on
`features/code-review-sweep`, starting clean at
`44040a96f48d58d905d53782a6a32fa5cf8d4364`, with Node v26.11.1 and npm 11.20.0.
The documented `workflow.use_worktrees=false` opt-out was honored; no checkout,
configuration, isolation sentinel or shared planning record was created or
changed. Each native attempt retains input blobs, full owner/helper copies,
compiled inputs, argv, UTC start/end, raw exit and separate stdout/stderr.
No attempt timed out or required a signal. The substantive results are:

| Check | Native result and UTC interval |
| --- | --- |
| First fresh build | Raw 2, 20:32:14.167471–20:32:17.325828; only the now-unused owner `ReportedPatch` import remained after moving `heartbeatPatch`. |
| Corrected fresh build | Raw 0, 20:32:53.452689–20:32:56.881776; only that orphan import was removed under its own guard. |
| Complete natural account owner | Raw 0, 20:33:12.387030–20:33:13.134474; 168 pass, zero fail/cancelled/skipped/todo. |
| Exact direct source/test pair | Raw 0, 20:33:26.840960–20:33:31.216550; fresh build and isolated 100% coverage. |
| Native exact-source coverage | Raw 0, 20:33:49.335477–20:33:50.098592; 168 pass, exact `SF:dist-test/src/runtime/accountRuntime.js`, LF/LH 1003/1003, FNF/FNH 58/58, BRF/BRH 193/193. |
| Uncached full owner/helper ESLint | Raw 0, 20:34:02.800471–20:34:08.607280; zero warnings. |
| Installed ACCOUNT evidence CLI | Raw 0, 20:34:09.121309–20:34:09.624031; `RED_EVIDENCE_OK`. |
| Installed PLATFORM evidence CLI | Raw 0, 20:34:44.486976–20:34:44.927973; `RED_EVIDENCE_OK`. |

Complete saved/current raw case and AST/token comparisons retain all 151
authored cases in order, allowing only the constants factory calls. An exact
whole-owner transformation comparison allows only the declared seed blocks,
imports and ten constants calls; every remaining byte matches. The eight
moved signatures/bodies match exactly after the added export modifier, and
the constants literal AST matches its former initializer. These checks
preserve all prior accepted repairs and every existing teardown reset,
including the five cleanup resets and the preexisting floor reset. No seed
meta-tests were added. The 700 other initial inputs, including all 44
production files, retain their exact hashes and modes. The full saved report
is an unchanged prefix of this append.

ACCOUNT evidence retains blob
`b3f7141fc652706628ec55c5bd5c1a3e4b560319`; PLATFORM evidence retains blob
`5a35d0831979b6c7444b598c0987bdd9d98f758b`. The same installed classifier
recursively accepts all 14 plus 2 records, and each actual
`sourceCommit:sourceFile` resolves to its recorded source blob. No parser,
record or history was replaced. The initial 09 ledger checkpoint retains
SHA-256 `aef5e272b16ba900cae197a46420256be5bb9f530c77061d8fe14f979627af53`;
the actual Git-directory plan-head ledger still contains
`8a700ac4b3594bf0c16af0a5e3ce35223ef3f574`.

This append is committed only after a clean exact
`SKIP=npm-check pre-commit run --files` over all three final paths, followed
by staging those paths, the recorded-base Fallow audit, and plain foreground
`git commit` with ordinary hooks and SKIP absent. Shared test support must
select all 43 source/test pairs in the actual staged selector and ordinary
`check:commit`; temporary native records retain that inventory and hook
result. The actual terminal commit record and Git object establish the hash
and three committed paths. No wrapper commit, manual stash, amend, hook
bypass, rebase or history rewrite is used.

The first build failure remains an explicit attempt, not a production RED
claim. Original 017's natural filesystem cause remains unconfirmed; this
change does not reinterpret that interruption or its controlled retry.
Original 014 remains applied pending the parent's fresh independent full
ACCOUNT correction, including the complete new helper/header/inventory.
The original initial review remains 29 findings, 18 blocking and 11 warning;
the correction counter remains zero. No clean review, independently closed
finding, reopened finding or full correction verdict is claimed here.
RUN-01 stays Pending and WINDOWS 46-53 remain OPEN and unwaived. The parent
retains the required combined full gate, full correction, seal and eventual
worktree-setting restoration obligations. No SUMMARY was written here.
