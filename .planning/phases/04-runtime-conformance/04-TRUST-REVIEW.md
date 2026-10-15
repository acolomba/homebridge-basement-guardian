---
phase: 04-runtime-conformance
reviewed: 2026-10-15T02:25:29Z
depth: deep
files_reviewed: 4
files_reviewed_list:
  - src/runtime/arrivalAnchors.ts
  - test/runtime/arrivalAnchors.test.ts
  - src/runtime/monitoringHealth.ts
  - test/runtime/monitoringHealth.test.ts
findings:
  critical: 5
  warning: 10
  info: 0
  total: 15
status: issues_found
review_round: 0
correction_counter: 0
source_revision: 23a2511ac6deb26869db8d3c44916623a27ec997
first_independent_observer: /root/phase4_trust_first/trust_initial_review
production_bugs: 1
applied_repairs: 8
arrival_applied_ids: [CR-04-TRUST-001, CR-04-TRUST-002, CR-04-TRUST-003, CR-04-TRUST-004, CR-04-TRUST-005, CR-04-TRUST-006, CR-04-TRUST-007, CR-04-TRUST-008]
partially_applied_ids: [CR-04-TRUST-015]
open_findings: 15
---

# TRUST initial code review

## Narrative Findings (AI reviewer)

This is the complete independent ROUND 0 review, before any TRUST repair.
The reviewer is `gsd-code-reviewer`, identity
`/root/phase4_trust_first/trust_initial_review`. The parent retained the exclusive
foreground lease while this review ran. No source, test, helper, Git index,
shared ledger or requirement was changed. Only this report was created.

The original four files were read in full, including every test and full header.
The initial scope is 1,237 lines: 210 + 164 + 321 + 542. All findings below are
open and unapplied. Current passing checks do not establish conformance.

All IDs below contribute to RUN-01. Header IDs also contribute to PROC-03;
002 contributes to BUG-01. Every finding's initial AND current revision is
`23a2511ac6deb26869db8d3c44916623a27ec997`; its first independent observer is the
reviewer named above. There is no evidence-only or fix commit for any ID yet.
The source blobs below qualify every cited line and are unchanged by this review.

### Critical issues

#### CR-04-TRUST-002 — BLOCKER: Overflow JSON numbers are accepted as wall anchors

**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/src/runtime/arrivalAnchors.ts:85-86`

**Rule:** AGENTS safety semantics; D-05 invalid persisted input; style
Variables, literals, and data, finite-number validation; the store's own
whole-file rejection contract at lines 119–126.

**Issue:** `JSON.parse` accepts `1e309` and produces `Infinity`. The predicate
checks only `typeof anchor === 'number'`, so the store silently restores an
invalid timestamp. A subsequent persist serializes that anchor as `null`.
The next restore rejects the entire file, including valid neighboring anchors.
The injected health projection also treats an infinite future anchor as present,
preventing the normal absent-anchor admission seed. This is an actual input
validation defect, independent of the assertion findings below.

**Native evidence:** The fresh compiled public store restored
`{"placeholder-device":1e309,"placeholder-other-device":1700000000000}` as
`Infinity` and `1700000000000`, with no diagnostic. Persist wrote
`{"placeholder-device":null,"placeholder-other-device":1700000000000}`;
the next fresh store restored neither entry. Exact probe argv, UTC interval,
revision, stdout, stderr and raw exit 0 are retained in `overflow.json`,
`overflow.stdout` and `overflow.stderr` under the native directory below.
This successful exploratory probe is NOT an intended failing owner regression
and is NOT D-04 RED evidence.

**Fix:** First add active owner cases using literal overflow JSON, including a
finite neighbor and zero/finite acceptance controls. Observe the intended
whole-map rejection assertion fail against this unchanged production blob.
Commit complete planning-only D-04 evidence before GREEN. Then require
`typeof anchor === 'number' && Number.isFinite(anchor)`. Preserve the existing
whole-file malformed recovery, filename, numeric map format, wall units,
write/rename ownership and safe diagnostic policy. No migration is required.

**Disposition:** Confirmed production defect; open, unapplied.

#### CR-04-TRUST-003 — BLOCKER: Storage tests derive the durable path from production and never pin stored bytes

**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/test/runtime/arrivalAnchors.test.ts:59-60,79-96,128-144,155-163`

**Rule:** Unit writer/reviewer Assertions: independent expected values and
complete bytes when files are the contract; D-05 exact durable filename/format.

**Issue:** Every test path is built from `ARRIVAL_ANCHOR_FILENAME`, the same
export production uses. Changing that export to another filename leaves this
entire owner green while installed anchors stop restoring. The success and
forget cases only read their output through another instance of the same
implementation. They never independently assert the actual durable file's
complete contents. A coordinated writer/reader format drift can therefore pass.
The compiler, lint and exercised-line coverage do not pin this durable contract.

**Fix:** After public persist, read the literal
`.basement-guardian-arrivals.json` path in the case's real temporary directory
and compare complete bytes against independently specified JSON map bytes,
including zero. Retain the fresh-store restore observation. Do the same after
forget so the absence of the removed key and surviving key/value are fixed
independently of production's reader. Use the exported filename as actual input
or assert its actual value against the literal; do not compute the expectation
from it. Keep all cleanup registered per case.

**Disposition:** Confirmed assertion-maintenance defect; open. No production
failure or genuine RED history is claimed. A filename-drift control is a
separate maintenance control and must restore exact source bytes before GREEN.

#### CR-04-TRUST-004 — BLOCKER: Failed-write case does not observe the memory it promises to keep serving

**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/test/runtime/arrivalAnchors.test.ts:151-163`

**Rule:** Unit writer/reviewer central discrimination question and Assertions:
public result/state before interactions; a wrong implementation must fail the
case named for that behavior.

**Issue:** The case promises to keep serving after persist fails, but observes
only directory entries and a log line. A catch branch that clears the in-memory
anchors after the failed rename would still pass every assertion in this case.
That change adds no new branch and can retain direct coverage. The module's
important surviving public state is never read after the failure.

**Fix:** Record distinguishable device anchors, force the existing rename
failure, then assert the complete public readback of both anchors together
with the storage observations. Retain the no-orphan observation. A restored
negative control may clear the map in the error branch; it must fail the named
state assertion. Do not classify that temporary control as a production bug.

**Disposition:** Confirmed assertion-maintenance defect; open, unapplied.

#### CR-04-TRUST-010 — BLOCKER: Failed-poll case cannot detect a restarted silence window

**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/test/runtime/monitoringHealth.test.ts:302-312`

**Rule:** Unit writer/reviewer central discrimination question and Assertions;
D-05 REST failure supplies no shadow arrival and cannot restart its window.

**Issue:** The case records a failure one millisecond before the original
silence deadline, then immediately expects an empty list. Both correct code
and code that resets the arrival stamps on every failed poll produce that
answer. The assertion does not test its title, “leaves the silence window where
it was.” A broken reset would let a failing monitoring path keep renewing trust.

**Fix:** Capture the state before the failure, record the failure, advance to
the ORIGINAL 1,796,000-ms deadline and assert the complete silent-device list
and account verdict. Use independent literal deadlines. A separate restored
control should reset the stamps on failure and fail the intended assertion.
Preserve current production behavior; no genuine bug RED is warranted here.

**Disposition:** Confirmed assertion-maintenance defect; open, unapplied.

#### CR-04-TRUST-011 — BLOCKER: Several monitoring cases discard parts of their public answer

**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/test/runtime/monitoringHealth.test.ts:155,171,186,205,299,541`

**Rule:** Unit writer/reviewer Assertions: compare whole public values;
membership, individual fields and key lists do not replace the promised value.

**Issue:** Boundary rows observe only whether the expected ID is included.
When `silent` is false, an erroneous list containing another device still
passes that assertion; when true, extra IDs or duplicates are invisible.
REST cases project away the `TransportTrust` result to one property, and the
last case projects it to its keys, allowing the wrong value through that
particular assertion. These cases need independent complete answers rather
than complementary fragments distributed across other tests.

**Fix:** Compare `health.silentDevices()` to `[]` or `[DEVICE_ID]` in each row.
Compare `health.trustNow()` to the complete `{ restDegraded: ... }` object in
REST cases and the final account-only case. Where a case promises independent
account/device facts, observe both complete public outputs. Keep two-device
expectations distinct and independently written. No runtime algorithm change
is requested.

**Disposition:** Confirmed assertion-maintenance defect; open, unapplied.

### Warnings

#### CR-04-TRUST-001 — WARNING: Arrival source and owner lack the approved header form

**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/src/runtime/arrivalAnchors.ts:1-24`

**Also:** `test/runtime/arrivalAnchors.test.ts:1` at the common review revision.

**Rule:** D-01 / PROC-03; style Files and modules.

**Issue:** The source has SPDX immediately followed by the overview and no
separate copyright block. Its complete owner has none of the three sections.
The source-only packaging gate cannot establish owner-header conformance.

**Fix:** Keep MIT SPDX first, one blank line, separate
`Copyright (c) 2026 Alessandro Colomba` JSDoc, one blank line, purpose
`@fileoverview` JSDoc and one blank line before imports. Inspect both files.
Keep this header-only cause separate from behavioral and narrative changes.

**Disposition:** Confirmed mandatory-header defect; open, unapplied.

#### CR-04-TRUST-005 — WARNING: Temporary-name randomness is a hidden dependency

**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/src/runtime/arrivalAnchors.ts:133-134,200-201`

**Rule:** Unit writer/reviewer Production design for tests: make nondeterministic
dependencies explicit; inject the existing hidden dependency rather than add
module replacement, a test mode or a production state reader.

**Issue:** `persist()` reaches imported `randomBytes()` and process identity
through a private helper with no injection seam. The owner cannot select an
occupied temporary name through the public API to verify exclusive-create
ownership. Its only write-failure case exercises rename failure instead.
The factory's “everything ... by injection” claim is therefore incomplete.

**Fix:** Expose an optional complete temporary-path supplier following the
existing auth adapter's `createTemporaryPath` seam, while retaining the current
real temporary-name algorithm as the default wiring. Exercise an actually
occupied synthetic file and independently assert its complete bytes and prior
anchor bytes survive. Do not remove randomness, change create/rename/error
ownership or copy token permissions. Obtain exact current factory/options
impact in both compiler projects before changing the public options contract.

**Disposition:** Confirmed testability/robustness finding; open. No occupied-file
production bug or new helper requirement is claimed.

#### CR-04-TRUST-006 — WARNING: Arrival documentation records an old release and misdescribes admission seeds

**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/src/runtime/arrivalAnchors.ts:57-68,168-169`

**Rule:** Comment policy opening rule and Forbidden narration of past code;
D-05/D-06 current restart and admission semantics. Candidate S-04-07.

**Issue:** “Before this release ... no anchor” and “the only one that has ever
existed” are historical claims in current API documentation. History places
these exact lines in the initial-release commit, which already contains this
same store blob; the current package is a later version. The comments also say
an anchor is absent until restore or a device is heard, but current
`admitDevice()` records a wall anchor when none exists, before any message.

**History:** `git blame -L 56,66` attributes the lines to
`b19ea5890a3fe6b2168a5965271d564cfa0fd8d9`, subject
`feat: initial release of the Basement Guardian plugin (#4)`.
That commit contains store blob `0b04d48709406f65da2457524e6f5226ed12cc4d`
and monitoring blob `3a17ccd8e85ce9c0400e35b99bc81425bfd01029`, identical
to this review. Its parent has no store at that path. Its package version is
0.1.0; current package version is 0.1.1. Exact native history records are retained.

**Fix:** Describe present behavior: get returns the stored wall anchor or
undefined; discovery admission seeds only an absent anchor; restored anchors
are retained; actual messages advance them. Preserve restore-before-launch,
filename, payload and current admission trust. Do not infer a migration or a
new immediate-silence rule from the archived D-08 prose.

**Disposition:** S-04-07 independently accepted as a documentation defect;
open, unapplied. Historical implementation/release claims do not authorize
new storage policy.

#### CR-04-TRUST-007 — WARNING: Arrival privacy explanation states an unqualified identifier guarantee

**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/src/runtime/arrivalAnchors.ts:14-16,143-148`

**Rule:** D-05/D-06 scoped privacy premise; canonical C-002;
STATE Decisions, ratified deviceId treatment; truthful current documentation.

**Issue:** The overview says it stores deviceIds and “no account identifier”.
Canonical C-002 says deviceId contains the account identifier and serial.
The permission rationale also calls deviceId non-sensitive without retaining
STATE's explicitly unconfirmed opaque-account-key premise. Scoped permission
to retain this identifier is not proof that it contains no account identifier.

**Fix:** State the actual stored fields and the existing scoped permission,
with its unconfirmed opaque-key premise and public-artifact sanitization limit.
Keep current file mode and storage policy. Do not remove keys, add a migration,
invent a new permission or claim the premise has been externally verified.

**Disposition:** Confirmed narrative defect; open, unapplied. No new privacy
vulnerability or permission change is asserted. S-04-08's account-source
review remains with ACCOUNT; this finding is confined to the arrival source.

#### CR-04-TRUST-008 — WARNING: Forget case performs restore inside its assertion phase

**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/test/runtime/arrivalAnchors.test.ts:137-144`

**Rule:** Unit writer/reviewer Case structure: arrange, act, assert in order.

**Issue:** After `// assert`, the case constructs a second real store and calls
its exported `restore()` operation. The action producing the asserted state
is hidden inside the assertion phase.

**Fix:** Move construction/restore into the act phase, then compare the
independent whole public observations in assert. Preserve the current surviving
neighbor and removed-device assertions.

**Disposition:** Confirmed mandatory case-structure defect; open, unapplied.

#### CR-04-TRUST-009 — WARNING: Monitoring source and owner lack the approved header form

**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/src/runtime/monitoringHealth.ts:1-21`

**Also:** `test/runtime/monitoringHealth.test.ts:1` at the common review revision.

**Rule:** D-01 / PROC-03; style Files and modules.

**Issue:** The source omits the separate copyright block and section spacing.
Its complete owner begins with imports and has no approved header.

**Fix:** Apply the exact MIT SPDX/copyright/overview form to each file, with
the required blank lines. Keep the header repair separate from monitoring
assertions and present-behavior documentation.

**Disposition:** Confirmed mandatory-header defect; open, unapplied.

#### CR-04-TRUST-012 — WARNING: The stateful arrival fake has no real-adapter contract

**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/test/runtime/monitoringHealth.test.ts:69-91,492-504,514-522`

**Rule:** Unit writer/reviewer Test doubles and Patterns, Shared adapter
contracts: real and stateful fake participants share a discriminating contract.

**Issue:** `recordingAnchors()` implements a stateful ArrivalAnchors boundary,
including independent fake disk operations, and exposes its backing map.
No shared real/fake contract or negative control is present. The health owner
can therefore confirm writes only against its own local implementation while
the real adapter's update and persistence semantics drift independently.
Primitive values avoid an aliasing defect here; no such defect is alleged.

**Fix:** Prefer eliminating the unnecessary second stateful implementation
by constructing the real no-I/O-on-construction store with a controlled
storage location and silent logger, and observing it through its public `get`
operation. Health never calls persist/restore. Alternatively, introduce a
proper declared real/fake contract in bounded authorized tasks, including a
negative control and participant inventory; do not silently create an
undeclared helper. Preserve the special stateless absent-anchor stub.
Exact private/public traces precede any deletion or signature change.

**Disposition:** Confirmed test-design conformance finding; open, unapplied.
No `monitoringHealthSeeds.ts` or `arrivalAnchorsSeeds.ts` is justified by this
finding: it is a stateful-boundary issue, not reusable seed data.

#### CR-04-TRUST-013 — WARNING: Threshold test uses the restricted combined phase marker

**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/test/runtime/monitoringHealth.test.ts:130-135`

**Rule:** Unit writer/reviewer Case structure and writer completion checklist:
`// act & assert` is reserved for one throwing/rejection expression.

**Issue:** A normal `deepStrictEqual()` over three exported constants is marked
`act & assert`. The mandatory convention requires separate observation and
assertion phases for this successful value check.

**Fix:** Read the actual exported threshold values in act and independently
compare their complete object in assert, preserving the literal expected
2 / 898000 / 2 values. The exported values are a real runtime contract; do not
replace the test with a meaningless compiler-shape check.

**Disposition:** Confirmed mandatory case-structure defect; open, unapplied.

#### CR-04-TRUST-014 — WARNING: Monitoring comments narrate removed implementations

**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/src/runtime/monitoringHealth.ts:55-61,193-208,231-235`

**Also:** `test/runtime/monitoringHealth.test.ts:465-468`.

**Rule:** Comment policy Forbidden narration of code that no longer exists;
opening rule: describe current behavior and its reason, leave process history
to Git. D-05 preserves the actual present clock/admission contract.

**Issue:** The comments describe a previous flattened member, a removed
construction seed and behavior “before any anchor existed”. The long D-08
interpretation mixes historical design argument with the current algorithm.
Current safety rationale does not require these removed shapes.

**Fix:** State the current account/device split, continuous maximum of elapsed
and wall durations, omitted wall term when absent, admission-only seeding of
new devices and restored-anchor retention. Keep the rationale for avoiding a
false normal. Do not alter the algorithm, claim a new deadline or turn the
archived platform default into a new health admission rule.

**Disposition:** Confirmed current-comment conformance defect; open, unapplied.

#### CR-04-TRUST-015 — WARNING: Public method descriptions omit the required verb form

**File:** `/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/src/runtime/arrivalAnchors.ts:57-59`

**Also:** `src/runtime/monitoringHealth.ts:158-164`.

**Rule:** Style Comments and documentation: method descriptions begin with a
third-person verb phrase.

**Issue:** `get()` begins “When this device ...”; `silentDevices()` begins
“Every admitted device ...”; `trustNow()` begins “The verdict ...”. These are
public methods governed by the explicit project rule, rather than a reviewer
preference about general prose.

**Fix:** Use “Returns the stored wall anchor ...”, “Returns admitted devices
whose live paths ...”, and “Returns the current account-wide transport
verdict ...”, preserving the exact API and the nuance tracked in 006/014.

**Disposition:** Confirmed documentation-rule defect; open, unapplied.

## Complete manual review and caller analysis

| Original file | Lines read | Source blob | Full header result |
| --- | ---: | --- | --- |
| src/runtime/arrivalAnchors.ts | 1–210 | 0b04d48709406f65da2457524e6f5226ed12cc4d | Open 001 |
| test/runtime/arrivalAnchors.test.ts | 1–164 | 024b81b6de92e1bae41bf146160ac9d14485e73e | Open 001 |
| src/runtime/monitoringHealth.ts | 1–321 | 3a17ccd8e85ce9c0400e35b99bc81425bfd01029 | Open 009 |
| test/runtime/monitoringHealth.test.ts | 1–542 | a663e8b4d3f419a474f3c4e696229b3960a03c8a | Open 009 |

Repository root for every relative path above is
`/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian`.
Both sources are byte-identical to the initial-release revision shown in 006.
No helper or external adaptation currently joins the inventory.

The review loaded complete AGENTS, all five required rulebooks, bootstrap and
configured reviewer-skill references, 04-05/06 plans, CONTEXT, REVIEW-PROTOCOL,
RESEARCH, PATTERNS, FINDINGS, STATE, REQUIREMENTS and canonical intel decisions.
It also compared archived 05.1 clock/restart/per-device decisions with actual
source and Git history. Research candidates were not accepted on authority.
The auth source and complete auth owner were read as bounded analog context;
particularly finite-cache validation, full temporary-path injection, real
per-case directories and independent file bytes. Shadow projection/timer
excerpts and the two current clock ports supplied additional context.
These contextual reads do not certify those other subsystems anew.

The manual pass covered every non-toolchain section of the style, comments,
unit writer and unit reviewer books: module/import form, exports/public
signatures, literals, actual mutations, function/constructor boundaries,
control flow, errors, types, naming, documentation, case structure, doubles,
independent results, public state, timing, filesystem isolation and cleanup.
It checked every test's promised observation rather than treating 100% direct
coverage as behavioral proof. No additional injection, credential, unsafe
deserialization or path-traversal finding was proven. JSON keys are map keys,
not filesystem path fragments; `Object.fromEntries()` avoids assigning them
through a prototype setter. O(n²)/memory/performance concerns were not reviewed.

Actual cross-module traces/read bodies:

- `accountRuntime.ts:330–335` injects the real health projection and shared
  anchors; `393–425` admits each discovered device before applying discovery.
- `accountRuntime.ts:463–524` calls successful removal before health/anchor
  pruning. A refused removal retains tracking. `forgetDevice()` intentionally
  removes only the elapsed stamp; account runtime owns persisted-key removal.
- `accountRuntime.ts:585–667` assembles the account facts and per-device map,
  reports narrow silence, and owns fired-and-forgotten persist calls.
- `accountRuntime.ts:825–870` records actual routed arrivals for existing
  devices before applying state and recovering the reported silent device.
- `accountRuntime.ts:1118–1132` awaits restore before launch/admission.
  `1232–1282` is the public composition factory and creates the real store.
- `platform.ts:387–403` supplies missing-device `shadowSilent: true` while
  retaining actual account facts. It is distinct from health's admitted-device
  measurement. `basementGuardian.ts:943–978` compares and stores all four
  MonitoringTrust members.
- The account owner's `RecordingAnchors` at 407–442 is another consumer of
  the full public store shape. It was read for signature/restore timing only;
  ACCOUNT still owes its complete independent review.

No exact current Fallow private-target or shared-contract mutation trace was
claimed. No symbol, signature, field presence, mutability or visibility was
changed. Before a fixer changes any such target, D-06 still requires exact
separate-project native results and actual structural caller review. An
unsupported private query must remain an unmet trace, not deletion proof.

## Seed-candidate dispositions

| Candidate | Independent TRUST disposition | Evidence / boundary |
| --- | --- | --- |
| S-04-03 | Rejected for these current TRUST shapes | `get(): number \| undefined` is an operation result, not an optional object property. Both options interfaces have required dependencies. Trust objects carry required booleans. No required-present-undefined field here should become optional. Public factory signatures retain their options types even without named external imports. |
| S-04-04 | Rejected for these current TRUST shapes | The rule requiring readonly unreassigned properties is under **Classes**; these are interfaces and factory-owned mutable maps/state. Actual callers rely on `record`/`forget`/restore mutation and replace whole trust values. No class violation or evidence requiring a public readonly conversion was found. |
| S-04-05 | Partly accepted | 003/004/010/011 identify exact missed file/state/deadline/whole-answer promises. Existing full two-device and restart assertions were preserved in the review, not assumed defective. Other batch dispositions remain theirs. |
| S-04-07 | Accepted as 006 | Actual blame/log/tree history plus current admission/restoration/arrival call paths distinguish history from current behavior. No migration or new product policy follows. |
| S-04-08 | ACCOUNT review still pending | Arrival's independent privacy narrative issue is 007. The existing scoped identifier permission and its unconfirmed premise are retained. |

No reusable mutable seed-data violation was established. Module scalar
identifiers/times are immutable; clock and store factories create fresh case
state. Neither conditional seed helper is currently justified. A fixer must
not create one speculatively or use it to hide the fake-contract issue.

## Native evidence and verification limits

Native directory: `/private/tmp/guardian-04-trust-initial-native/`.
`commands.json` retains exact argv, cwd, start/end UTC, child exitCode, Node,
HEAD and all four source/test blob identities for each command. Each numbered
stdout/stderr file is complete and unmodified. All seven stderr files are empty.
Every command below ran at the reviewed revision on Node **v26.11.1**.

| Native record | Exact command / scope | UTC start → end | Raw exit / observed outcome |
| --- | --- | --- | --- |
| 0 | `npm run typecheck` | 02:21:01.028812 → 02:21:05.774975 | 0; both strict compiler projects |
| 1 | `node_modules/.bin/eslint src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts src/runtime/monitoringHealth.ts test/runtime/monitoringHealth.test.ts --max-warnings=0` | 02:21:05.825726 → 02:21:12.989754 | 0; all four current originals |
| 2 | `npm run build:test` | 02:21:13.057068 → 02:21:17.237801 | 0; fresh compiled tests |
| 3 | `node --test --test-reporter=tap dist-test/test/runtime/arrivalAnchors.test.js` | 02:21:17.289935 → 02:21:17.668669 | 0; 7 pass, 0 fail/cancel/skip/todo |
| 4 | `node --test --test-reporter=tap dist-test/test/runtime/monitoringHealth.test.js` | 02:21:17.727833 → 02:21:18.062164 | 0; 32 pass, 0 fail/cancel/skip/todo |
| 5 | `npm run test:coverage:direct -- src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts` | 02:21:18.114855 → 02:21:23.018449 | 0; isolated executable pair, complete lines/functions/branches |
| 6 | `npm run test:coverage:direct -- src/runtime/monitoringHealth.ts test/runtime/monitoringHealth.test.ts` | 02:21:23.078786 → 02:21:28.401948 | 0; isolated executable pair, complete lines/functions/branches |

All times in that table are on **2026-10-15 UTC**. Each direct script performs
its own fresh test build, runs the single owner and enforces one matching LCOV
record with LH=LF, FNH=FNF and BRH=BRF. Both are executable pairs; no declaration
exception was used. The successful selector deletes its temporary per-pair
LCOV, so this review reports the enforced 100% outcome without inventing raw
line/function/branch denominators. These selected runs do not refresh merged
all-pair `coverage/direct.lcov` or establish a full-project gate.

`overflow.json` retains the exact one-off `node --input-type=module -e ...`
argv and its complete synthetic probe; `overflow.stdout` records the invalid
restore/persist/second-restore sequence. It used a real temporary directory
with `finally` cleanup and no private data. It is evidence for 002's diagnosis,
not a failing native owner test, a control, or authorization for GREEN.
`history.json` and five `history-N.stdout`/`.stderr` records retain exact
blame/log/tree/diff argv, UTC, HEAD and raw exits, all 0. The old-to-current
two-source diff is empty. Missing `.codexignore` was observed; the four tracked
originals are not ignored. No ignored/private runtime records were reviewed.

The parent's wave-four `npm run check` result is retained at
`/private/tmp/guardian-phase4-wave4-gate.json` and
`/private/tmp/guardian-phase4-wave4-full-check.log`: exit 0, Node v26.11.1,
revision `9afbabefd7cc04321907669d417078611cbde82e`,
2026-10-15T02:15:14.020912Z → 02:15:50.047695Z, six static checks,
104 scenarios / 1156 steps, 43 direct pairs.

**That full result is historical for this report's exact current-tree gate.**
The required comparison
`git diff 9afbabefd7cc04321907669d417078611cbde82e -- . ':(exclude,glob).planning/**/*.md'`
is NOT empty: `.planning/state.json` changed only its `updated_at` from
`2026-10-15T01:18:40.226Z` to `2026-10-15T02:16:27.559Z`.
The complete diff is `reuse.diff`. `untracked-before.json` is `{}`: no untracked
files existed before report creation. No new executable input appeared.
Nevertheless, the literal Markdown-only reuse predicate fails; this report
does not grant a general planning-JSON exception or claim a current full gate.
Fresh focused checks above supply current owner/toolchain evidence. The parent
still owns the next required complete combined-wave gate.

## Genuine bug history and separate maintenance controls

Only 002 is a confirmed production defect. No active owner regression, native
intended RED, conditional RED JSON, evidence-only commit, source fix or GREEN
bug commit has occurred in this initial review. D-04 remains wholly pending
for that cause. Keep the exploratory probe separate from the mandatory RED
record and preserve every actual failed attempt in future evidence.

003/004/010/011 are assertion maintenance on existing production behavior.
No source mutation control ran in this review. Proposed controls are future
work: name the missed public behavior, obtain the intended failure, restore
the exact original source bytes, rebuild and prove GREEN. No mutation bytes
may enter Git. Header and comment causes are separate from both categories.

## Continuous TRUST ledger and next repair boundaries

| Round / set | IDs | Count |
| --- | --- | ---: |
| Initial opening | none | 0 |
| Initial independently accepted | CR-04-TRUST-001 through CR-04-TRUST-015 | 15 |
| Applied repairs | none | 0 |
| Independently fixed | none | 0 |
| Rejected accepted IDs | none | 0 |
| Reopened | none | 0 |
| Current open | CR-04-TRUST-001 through CR-04-TRUST-015 | 15 |

There are **5 BLOCKER + 10 WARNING** findings. The distinct research-candidate
rejections above do not remove accepted IDs. Round 0 arithmetic is
`0 - 0 - 0 + 15 + 0 = 15`. The correction counter is **0**, continuous across
04-05 and 04-06. No correction review or D-03 stop evaluation has occurred.
The first full correction belongs after the complete repair pass over all four
originals and every actual addition; arrival-only checks cannot close TRUST.

Arrival tasks own 001–008 and the arrival part of 015. Monitoring tasks own
009–014 and the monitoring part of 015. Keep every concrete cause task within
five paths, including report, conditional RED record and any justified helper.
Preserve stable IDs if minimum overlapping comment changes close more than
one rule. The parent must retain bounded task/plan declarations before any
external adaptation; this initial report authorizes no new undeclared path.

No live vendor, hardware, real-pump profile, private account file, package
installation, compatibility-matrix result, release permission, new privacy
permission or persistence migration is claimed. WINDOWS 46/47 remain
OPEN/unwaived. RUN-01 and phase completion remain Pending.

_Initial reviewer: gsd-code-reviewer; correction counter 0; no source repairs._

## CR-04-TRUST-002: Active unchanged-production RED preparation

The fixer `/root/phase4_trust_first/arrival_red_prepare` added two active sibling
regressions to `test/runtime/arrivalAnchors.test.ts`. Each writes literal JSON
containing `1e309` or `-1e309` beside the finite timestamp `1700000000000`.
Each case owns a fresh temporary directory with registered cleanup. Each asserts
the complete two-device public observation against independently written
`{ anchor: undefined, otherAnchor: undefined }`. No logging assertion was added.
The existing finite/zero round-trip control remains active and passes.

All preparation ran serially in the existing `features/code-review-sweep`
checkout, with repository-root cwd:
`/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian`.
The source HEAD is `23a2511ac6deb26869db8d3c44916623a27ec997`.
Node is **v26.11.1**; npm is **11.20.0**.
The production blob remains
`0b04d48709406f65da2457524e6f5226ed12cc4d` before, during and after RED.
The initial owner blob is `024b81b6de92e1bae41bf146160ac9d14485e73e`;
the active regression owner blob is `83c5547be6b1fd65de9f73fc3cee817dc13155f7`.

The exact Fallow guard covered the owner, this report and the declared RED JSON
before edits. It exited 0 and reported no configured boundary restrictions.
`npm run typecheck`, focused ESLint for the source and owner, and
`npm run build:test` each exited 0 before the native owner command.

`node --test --test-reporter=tap dist-test/test/runtime/arrivalAnchors.test.js`
ran from **2026-10-15T02:32:10.432Z** to **2026-10-15T02:32:10.694Z** and
returned raw exit **1**. It executed **9 tests: 7 pass, 2 fail, 0 cancelled,
0 skipped, 0 todo**. Both named overflow cases reached the intended
`deepStrictEqual` assertion and failed with `ERR_ASSERTION`. The positive case
restored `Infinity` and the finite neighbor; the negative case restored
`-Infinity` and the finite neighbor. This is the intended whole-file rejection
failure, with no compilation, import, fixture or setup failure.

`.planning/phases/04-runtime-conformance/04-ARRIVAL-ANCHORS-RED-EVIDENCE.json`
retains complete untouched TAP, separate stderr, exact native argv/cwd/raw exit,
UTC intervals, Node/npm, source/owner blobs, the complete regression patch,
dirty tracked diff, staged diff and complete untracked report bytes at RED.
It also retains the preparation command streams and the first native attempt.
There was no earlier pair evidence record; `priorEvidence` is empty.
The initial successful exploratory overflow probe remains separate.

The installed `classifyRedEvidence` accepts both distinct overflow targets as
`RED_EVIDENCE_OK`, reason `target_test_failed`, with no report errors.
The required command
`GSD_RUNTIME=codex node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence .planning/phases/04-runtime-conformance/04-ARRIVAL-ANCHORS-RED-EVIDENCE.json --raw`
ran against the current on-disk record and exited **0**, with `passed: true`,
`block: false` and `verdict: RED_EVIDENCE_OK`.
Raw command records and separate streams are also retained in
`/private/tmp/guardian-04-arrival-red-native/`.

This is evidence preparation only. No file was staged or committed, production
was not edited, and no GREEN or mutation control ran. The parent must commit
only the planning evidence with normal checks before any production repair.
The active failing owner stays outside that evidence commit. No finding closes:
all **15** accepted TRUST IDs remain open, with correction counter **0**.
This focused RED does not establish direct coverage or a full combined gate.

### Final formatted regression capture

A focused Prettier check returned 1 because the new `deepStrictEqual` call
needed one line. Only that expression's layout changed. The first complete
RED record remains intact in `priorEvidence[0]`, including its original patch,
native streams and installed gate result. The formatter failure is retained
separately and supplies no RED authority.

Fresh typecheck, focused ESLint and `build:test` each returned 0 for the final
owner. The complete native owner ran again from **2026-10-15T02:34:30.431Z**
to **2026-10-15T02:34:30.689Z**, raw exit **1**, with the same intended
**7 pass / 2 fail / 0 cancelled / 0 skipped / 0 todo** result.
Its untouched TAP and separate stderr are the current evidence record.
The final active owner blob is `b474f4aba3ed887057465918187e158f8e766eea`.
The source HEAD and production blob remain unchanged from the first capture.

The current on-disk CLI gate returned **0 / RED_EVIDENCE_OK** again.
Both current named targets are accepted. Recursive validation uses the same
installed `classifyRedEvidence` function and accepts the single archived
record as `RED_EVIDENCE_OK`; that archive has no prior records.
The final focused Prettier check and `git diff --check` pass.
The Git index remains empty. Only the RED JSON and this report are candidates
for the parent's evidence-only commit; the active owner stays unstaged.
All 15 findings remain open and correction counter 0 is unchanged.

### Evidence-commit handoff audit

The executor independently inspected the complete active owner patch, current
production/owner blob identities, empty staged diff and current on-disk CLI
classification. The final owner blob is
`b474f4aba3ed887057465918187e158f8e766eea`; production still matches
`0b04d48709406f65da2457524e6f5226ed12cc4d`. The installed CLI again returned
0 / `RED_EVIDENCE_OK`. This inspection supplies no GREEN authority before the
actual evidence-only commit.

The required recorded-base audit command was
`node_modules/.bin/fallow audit --base 23a2511ac6deb26869db8d3c44916623a27ec997 --format json --quiet --explain`.
Its sandbox attempt returned raw exit 2 because it could not create the
temporary base worktree. The authorized filesystem retry returned raw exit 0,
verdict pass, no findings. Complete argv, cwd, UTC intervals, Node, HEAD,
source/owner blobs, native streams, exact dirty diff and all untracked bytes
for both attempts are retained at
`/private/tmp/guardian-04-arrival-handoff/audit.json` and
`/private/tmp/guardian-04-arrival-handoff/audit-authorized.json`.
The failed attempt remains a disclosed process limitation, not a pass.

## CR-04-TRUST-002: Minimum GREEN repair, pending independent correction

The fixer `gsd-code-fixer`, identity
`/root/phase4_trust_first/arrival_green`, read complete AGENTS, all five
TypeScript/verification books, 04-05, CONTEXT, REVIEW-PROTOCOL, this complete
report, the complete arrival source/owner and the actual validator callers.
The parent retained the exclusive serial foreground lease. This repair ran in
the existing `features/code-review-sweep` checkout with isolation `none`.
No additional worktree was created.

Before the production edit, independent native Git checks established:

- RED source commit `23a2511ac6deb26869db8d3c44916623a27ec997` is an ancestor
  of actual evidence commit `4544c71c75e441751a143160b50b1dc8ebdc62b1`.
- That evidence commit changes exactly this report and
  `04-ARRIVAL-ANCHORS-RED-EVIDENCE.json`. Production and the committed owner
  are absent from its changed paths. The original production blob
  `0b04d48709406f65da2457524e6f5226ed12cc4d` matches the RED source commit,
  evidence commit and working production before GREEN.
- The complete active owner diff equals the current saved `regressionPatch`.
  The owner blob is `b474f4aba3ed887057465918187e158f8e766eea`.
- The installed CLI again accepts the current on-disk record with raw exit 0,
  `RED_EVIDENCE_OK`, `passed: true`, `block: false`.
  The same installed `classifyRedEvidence` accepts both named targets in the
  current record and its single recursive `priorEvidence[0]` record.
  Each native TAP has nine active tests, seven passes and two intended
  `deepStrictEqual` failures with `ERR_ASSERTION`. The positive and negative
  failures expose Infinity/-Infinity plus the finite neighbor. The archived
  record has no further prior records. All retained history remains unchanged.

The exact-path Fallow guard returned 0 before editing, with no configured
boundary restrictions. The only production change requires
`typeof anchor === 'number' && Number.isFinite(anchor)` in `isAnchorFile`.
Its adjacent comment describes finite-number validation and legal zero.
The fixer re-read the affected section and inspected the complete source diff.
Filename, map/key format, wall milliseconds, whole-file rejection, diagnostic
policy, write/rename ownership, cleanup and file mode are preserved.
There is no header repair, other narrative repair, new seam, helper or package.

Native GREEN evidence is retained under
`/private/tmp/guardian-04-arrival-green-native/`. Each named JSON records exact
argv/cwd, UTC start/end, raw child exit/signal, Node/npm, HEAD, source/owner
blobs, full before/after tracked and staged diffs and all untracked bytes.
Separate `.stdout` and `.stderr` files retain untouched command streams.
The recorder and provenance program are retained in `/private/tmp/`.
All commands ran from the repository root in the existing checkout, on
Node **v26.11.1**, npm **11.20.0**, HEAD
`4544c71c75e441751a143160b50b1dc8ebdc62b1`.

| Native record | Exact command / scope | UTC start → end (2026-10-15) | Raw exit / outcome |
| --- | --- | --- | --- |
| typecheck | `npm run typecheck` | 02:41:07.357 → 02:41:10.472 | 0; both strict compiler projects |
| lint | `node_modules/.bin/eslint src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts --max-warnings=0` | 02:41:11.326 → 02:41:15.502 | 0; focused pair |
| build | `npm run build:test` | 02:41:15.958 → 02:41:18.682 | 0; fresh compiled owner |
| owner-green | `node --test --test-reporter=tap dist-test/test/runtime/arrivalAnchors.test.js` | 02:41:22.060 → 02:41:22.309 | 0; 9 pass, 0 fail/cancel/skip/todo |
| direct-green | `npm run test:coverage:direct -- src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts` | 02:41:26.092 → 02:41:29.589 | 0; isolated executable pair, 100% lines/functions/branches |
| format | `node_modules/.bin/prettier --check src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts` | 02:41:34.032 → 02:41:34.257 | 0; no formatter changes |

The direct selector rebuilt before its isolated run and enforced complete
matching LCOV; it did not use declaration acceptance or coverage exceptions.
Its temporary LCOV is deleted by the selector, so no raw denominators are
invented here. These focused checks do not refresh merged all-pair coverage or
prove the required later combined-wave/phase gate.

The GREEN source blob is `1e5db2f2a2901639a63075cd73848936974e2df5`.
The active owner remains `b474f4aba3ed887057465918187e158f8e766eea`:
there are **no formatter/lint or semantic differences** from the current saved
regression patch. The earlier formatter-only change remains disclosed in the
unchanged archived RED history above. Both intended regressions remain active.

**Disposition:** 002 repair applied, pending the parent's normal commit and
independent full-batch correction. No fix commit exists at this handoff.
No file was staged or committed by this fixer; no source mutation control ran.
All original **15** accepted TRUST IDs remain open, with **0** independently
fixed and correction counter **0**. The full correction still belongs after
the complete repair pass over all four originals and actual additions in
04-06. Other accepted causes, shared records and RUN-01 remain unchanged.

## Arrival conformance execution: 001 header cause

The delegated fixer `/root/phase4_trust_first/arrival_conformance` holds the
exclusive writer/build/Git lease in the existing checkout, with isolation none.
It read complete AGENTS, all five books, 04-05, CONTEXT, REVIEW-PROTOCOL,
PATTERNS, this report, the complete source/owner, actual runtime callers,
canonical C-002 and STATE's scoped deviceId premise before editing.
The dispatch sentinel names 04-05 with isolation none. The preserved Git-dir
`gsd-plan-head-before-04-05` remains the real base
`23a2511ac6deb26869db8d3c44916623a27ec997`.

002 is now committed as `06ef961`, after evidence-only `4544c71`.
001 changes only both full headers: MIT SPDX, separate 2026 Alessandro Colomba
copyright JSDoc, overview JSDoc and section spacing. The existing source overview
body is retained for separate narrative causes. Both complete headers were
inspected; no runtime or assertion changes share this cause.

Native records use `/private/tmp/guardian-04-arrival-handoff/` and unique
`conformance-001-*` names. Each records exact argv/cwd, UTC interval, raw exit,
Node, HEAD, source/owner blobs, tracked/staged diffs and all untracked bytes.
`conformance-preflight.json` retains npm, correct root/nonprotected branch,
empty initial index and the preserved base marker. Exact-path guard exited 0.
Checks and commit evidence are appended in subsequent records as they occur;
no future result is claimed here. Every command runs in the main checkout.

001 is applied pending its normal commit and full independent correction.
All original 15 accepted IDs remain open, independently fixed 0, round 0 and
correction counter 0. No helper, RED modification or shared record is added.

## 001 normal commit and 003 durable storage assertions

001 committed normally as `d21c9ba3a85af561353ac0c4b78bd677904706c1`,
changing exactly source, owner and report. The commit ran
2026-10-15T02:46:23.641175Z–02:46:36.972032Z, raw exit 0. Typecheck,
focused ESLint, native owner (9 pass), isolated direct coverage (100% lines,
functions and branches), recorded-base audit and exact clean pre-step all
returned 0. The normal pre-commit npm-check hook passed. The later commit-msg
stage reported no matching npm-check files; it is a distinct hook invocation.
The full retained stderr, rather than its displayed tail, establishes both.

003 changes only owner and report. At source revision `d21c9ba`, the full
round-trip case at owner lines 89–116 and forget case at 161–188 independently
assert the exported filename before reading the literal durable path. They
compare complete UTF-8 contents to literal JSON strings, including zero and
the surviving forgotten-device neighbor, and retain the full fresh-store
readback. Files are read with the same UTF-8 encoding as the real reader;
no parsing, normalization or production serializer supplies expectations.
Each case retains its real mkdtemp and registered cleanup. 008's separate
phase-marker placement remains deliberately unchanged for its own cause.

The checked owner blob is `1a9a01b87715384361003151dcc308bb5c8774ca`;
production is `4dbeedb3eda6a5d26595fdc0419b705d02fb9cee`.
Native `conformance-003-*` records retain exact input diffs/blobs and intervals.
Typecheck, focused ESLint, build:test, full native owner (9 pass), direct pair
(100% lines/functions/branches) and formatter returned 0 before the control.

### 003 separate filename-drift maintenance control

The plausible wrong behavior changes only the durable filename export to
`.basement-guardian-arrivals-drift.json`; coordinated reader/writer drift
previously passed. This is assertion maintenance, not genuine bug RED.
The complete saved source is `/private/tmp/guardian-003-control-original.ts`;
the exact mutation patch is `/private/tmp/guardian-003-control.patch`.
Typecheck, focused ESLint and build:test each returned 0 for the control.
The exact named round-trip native command in `conformance-003-control-owner`
ran 2026-10-15T02:47:29.466879Z–02:47:29.887905Z, raw exit 1:
one test, one intended `deepStrictEqual` / `ERR_ASSERTION` failure comparing
the drifted export with the literal filename. No ENOENT/setup failure occurred.
The mutation source blob was `92f0e20b0f591184df321a2c928df2ad38d676f3`.

`git checkout -- src/runtime/arrivalAnchors.ts` restored production; the
separate identity check compared exact saved bytes and returned 0. Fresh
build:test, full owner (9 pass, 0 fail/cancel/skip/todo) and isolated direct
pair (100% lines/functions/branches) returned 0 after restoration.
Complete untouched TAP, separate stderr, versions, HEAD, all command intervals,
mutation/restore identities and exact dirty inputs remain in the native records.
No control bytes enter Git; the genuine RED JSON remains untouched.

003 is applied pending normal commit and later complete independent correction.
All 15 accepted IDs remain open, independently fixed 0 and counter 0.

## 003 normal commit and 004 surviving-memory assertion

003 committed normally as `99cd24bb060b51cbfef0cafc7ee7ed2a1253ea03`,
changing exactly owner and report. Its raw commit exit was 0 during
2026-10-15T02:48:25.086437Z–02:48:38.706284Z. The recorded-base audit,
exact clean pre-step and normal pre-commit npm-check all passed.

004 changes only owner and report. The failed-rename case at current owner
lines 194–212 records both distinguishable anchors and compares the whole
public memory readback, complete directory entries and retained diagnostic.
The existing target-directory setup still forces rename failure and proves
that no temporary file remains. Production ownership and error handling stay
unchanged. The touched-file rollback list is owner/report; temporary control
changes are confined to the source and restored separately.

At source commit `99cd24b`, the owner blob is
`f6feaae8c4990693417b5802efc41e0bce4431c4` and source blob remains
`4dbeedb3eda6a5d26595fdc0419b705d02fb9cee`.
Exact guard, formatter, typecheck, focused ESLint, build:test and native owner
returned 0. Native records use `conformance-004-*` in the same directory,
with complete provenance and raw streams under the contract above.

### 004 separate failed-rename maintenance control

The plausible wrong behavior clears the anchor map only in persist's catch.
The complete saved source and exact patch are respectively
`/private/tmp/guardian-004-control-original.ts` and
`/private/tmp/guardian-004-control.patch`.
Control typecheck, focused ESLint and fresh build:test returned 0.
The named failed-write owner case ran
2026-10-15T02:49:22.629513Z–02:49:23.048115Z, raw exit 1, one test and one
intended whole-state `deepStrictEqual` / `ERR_ASSERTION` failure. Both memory
anchors became undefined; directory entries and diagnostic still matched.
No setup failure supplied the result. The mutated source blob was
`5a989fbc1a37d07b060a0e5de6b17a093fc1cb88`.

The source was restored with git checkout and exact saved-byte equality passed.
A fresh build, all 9 owner tests and isolated 100% direct lines/functions/
branches then passed, with 0 failures/cancelled/skipped/todo. The source
returns to the blob above. This is a maintenance control, separate from the
unchanged genuine RED history. No mutation is staged or committed.

004 is applied pending normal commit and complete independent correction.
All original 15 findings remain open, independently fixed 0, counter 0.

## 004 normal commit and 008 AAA-only cause

004 committed normally as `5566339`, exactly owner/report. Recorded-base audit
and exact pre-step returned 0; complete ordinary hook streams retain the
passing pre-commit check:commit. Native commit provenance is
`conformance-004-commit.json`; source was restored before staging.

008 changes only the forget case's phase-marker placement, plus this report.
At source revision `5566339`, owner lines 172–180 now construct and restore
the fresh reader under act before asserting its complete public observation.
003's assertions remain unchanged. These are independent line edits: 003
strengthened the observation without moving the phase marker, allowing this
case-structure cause to remain atomic. No minimum overlap is claimed.
The exact guard passed before editing. Checks/commit use `conformance-008-*`
records in the same native directory with the complete provenance contract.
008 is applied pending normal commit and full independent correction;
all original 15 IDs stay open with correction counter 0.

## 008 normal commit and 006 current restart narrative

008 committed normally as `05e495f`, exactly owner/report. Its typecheck,
focused ESLint, fresh build, 9-test native owner, isolated 100% direct pair,
recorded-base audit, exact clean pre-step and ordinary hook all returned 0.

006 changes only source comments and this report. The source overview,
get/record documentation and factory map comment now distinguish restore,
admission-only absent-anchor seeding and actual shadow arrivals. The same get
description begins with "Returns", covering the arrival part of 015 through
the minimum overlapping line. Monitoring's part of 015 remains pending.
No signature, value, algorithm, migration or trust policy changes.

Before editing, the fixer re-read actual accountRuntime restoration before
launch, discovery admission and routed-arrival bodies, plus monitoringHealth's
admitDevice and recordShadowMessage bodies. Admission retains any restored
wall value and seeds only undefined; actual messages record the current wall
clock. No fresh immediate-silence rule follows from these descriptions.

Native `conformance-006-history`, `-blame`, `-history-parent` and
`-history-package` records all returned 0 and preserve exact Git evidence.
Blame attributes the old release prose to
`b19ea5890a3fe6b2168a5965271d564cfa0fd8d9`, whose parent has no arrival source.
That initial release already includes the store and package version 0.1.0;
the current package is 0.1.1. This confirms S-04-07's stale narrative without
inventing a migration. The exact guard passed before the comment-only change.
Native checks use `conformance-006-*`, with all actual revisions, blobs,
intervals, raw streams and exact input diffs retained in the main checkout.
006 and the arrival part of 015 are applied pending normal commit and full
independent correction. All original 15 IDs stay open, counter 0.

## 006 normal commit and 007 scoped privacy premise

006 committed normally as `0e46020`, exactly source/report. Both strict compiler
projects, focused ESLint, fresh build, native 9-test owner, isolated 100% direct
pair, recorded-base audit, clean pre-step and ordinary hooks returned 0.
Its complete source diff contains comments only; 015 remains partially applied.

007 changes only the overview privacy paragraph and write-mode explanation,
plus this report. Canonical C-002 explicitly says deviceId includes an account
identifier and hardware serial. STATE lines 231–233 retain the scoped local
identifier treatment, the unconfirmed opaque-account-key premise and D-027's
public-artifact restriction. The new text states those boundaries together.
The prior unqualified "no account identifier" statement is removed.

Current source revision is `0e46020`; revised locations are the full overview
and comment immediately above storeAnchors. `conformance-007-canonical`
retains the actual canonical excerpts, and the exact guard returned 0 before
editing. All checks use `conformance-007-*` records with actual command,
revision/blob, UTC, raw exit and full input/stream evidence in the main checkout.
No mode argument, payload, path, storage behavior, new privacy permission or
migration is introduced. No external validation of the opaque-key premise is
claimed. 007 is applied pending normal commit and complete independent
correction; all 15 original findings stay open with counter 0.

## Arrival terminal cause inventory and verification

007 committed normally as `d4454b2e5fad2c3f2cc9d1b23f6929b1487cfb47`,
exactly source/report. All its focused checks, audit, clean pre-step and normal
pre-commit npm-check passed. The six conformance commits below are distinct
from 002's genuine bug commits and its immutable evidence record.

| Cause | Normal fix commit | Exact committed paths |
| --- | --- | --- |
| 001 | d21c9ba3a85af561353ac0c4b78bd677904706c1 | arrival source, full owner, this report |
| 003 | 99cd24bb060b51cbfef0cafc7ee7ed2a1253ea03 | full owner, this report |
| 004 | 55663396e1e8f3cac55c5b6b0ae6a1d900de34d4 | full owner, this report |
| 008 | 05e495f6baf45f85d0593bc09946ccb1a5e6887e | full owner, this report |
| 006 and arrival 015 | 0e4602008f9c1a8f35a045100fd066f769190aef | arrival source, this report |
| 007 | d4454b2e5fad2c3f2cc9d1b23f6929b1487cfb47 | arrival source, this report |

Every cause stays within five paths. The source and owner names in this table
mean `src/runtime/arrivalAnchors.ts` and `test/runtime/arrivalAnchors.test.ts`.
The immutable RED JSON, monitoring files and shared records are unchanged.
At `d4454b2`, final locations are source header 1–26, get/record 61–71,
map comment 168, privacy 18–21 and 146–148; owner header 1–10, round trip
89–114, forget 162–187, AAA marker 177 and failed-write case 193–211.

All checks ran in the **main checkout**, Node **v26.11.1**, npm **11.20.0**.
For each cause prefix, the retained `typecheck`, `lint`, `owner`, `direct`,
`audit`, `prestep`, `stage` and `commit` JSON/stdout/stderr files identify
the exact native argv, cwd, raw exit, UTC interval, before/after HEAD,
source/owner blobs, full tracked/staged diff and all untracked bytes.
004's direct record is `restored-direct`; 001's fresh build is included in its
direct command. 003/004 also retain each separate control build and restore.
All ordinary verification commands returned raw **0**:

- `npm run typecheck` checks both strict compiler projects.
- `node_modules/.bin/eslint src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts --max-warnings=0` checks the complete pair.
- `npm run build:test` precedes the compiled owner; the direct script also rebuilds.
- `node --test --test-reporter=tap dist-test/test/runtime/arrivalAnchors.test.js` executes 9 tests, all passing with no fail/cancel/skip/todo.
- `npm run test:coverage:direct -- src/runtime/arrivalAnchors.ts test/runtime/arrivalAnchors.test.ts` enforces isolated 100% lines/functions/branches.
- `node_modules/.bin/fallow audit --base 23a2511ac6deb26869db8d3c44916623a27ec997 --format json --quiet --explain` returns pass for every commit.
- `env SKIP=npm-check pre-commit run --files <all exact cause paths>` returns clean before each stage. No pre-step formatter change required a retry.
- Stage and ordinary foreground commit run through the retained assertion wrapper, checking the exact root, features/code-review-sweep and unchanged base marker before each Git action. Normal pre-commit npm-check passes for all six code commits; the separate commit-msg no-files result is not substituted for it.

The selector enforces complete matching executable LCOV and deletes temporary
per-pair LCOV. These records supply no invented denominator, declaration-only
exception, merged all-pair coverage or full-project gate. The parent still owes
the complete combined-wave gate and complete four-file correction review.

| Cause | Checked HEAD | Source blob | Owner blob | Full owner UTC interval on 2026-10-15 |
| --- | --- | --- | --- | --- |
| 001 | 06ef961 | 4dbeedb3eda6a5d26595fdc0419b705d02fb9cee | 514df5555ec5358030e3467e3c253ea7c5f1cd58 | 02:46:07.575636–02:46:08.013350 |
| 003 | d21c9ba | 4dbeedb3eda6a5d26595fdc0419b705d02fb9cee | 1a9a01b87715384361003151dcc308bb5c8774ca | 02:47:14.106272–02:47:14.527422 |
| 004 | 99cd24b | 4dbeedb3eda6a5d26595fdc0419b705d02fb9cee | f6feaae8c4990693417b5802efc41e0bce4431c4 | 02:49:00.395377–02:49:00.842558 |
| 008 | 5566339 | 4dbeedb3eda6a5d26595fdc0419b705d02fb9cee | 97f611bc74a7183194a995609941a407cc9f68f3 | 02:50:55.067137–02:50:55.487785 |
| 006 | 05e495f | bf3abbcfe0051da47888d7d57ea1705f2b2cf392 | 97f611bc74a7183194a995609941a407cc9f68f3 | 02:52:02.715411–02:52:03.135912 |
| 007 | 0e46020 | 01f144813427051d0fc9f25f59b35136c2fd9acc | 97f611bc74a7183194a995609941a407cc9f68f3 | 02:53:06.955969–02:53:07.366792 |

Restored 003 owner GREEN ran 02:47:48.419298–02:47:48.826161 UTC;
its restored direct check ran 02:47:48.927252–02:47:52.501717, both exit 0.
Restored 004 owner GREEN ran 02:49:34.432848–02:49:34.851077 UTC;
its restored direct check ran 02:49:34.949403–02:49:38.509430, both exit 0.
The two intended control failures remain separate raw exit-1 evidence above.

A supplementary `conformance-final-source-tokens` comparison returned 1:
the standalone scanner did not rescan template continuations and included
following comments in token text. Its complete failure remains retained;
it is not a semantic failure or a passing check. The compiler-based
`conformance-final-emitted-code` comparison returned 0: with comments removed,
emitted JavaScript exactly matches the finite-fix commit `06ef961`.
`conformance-final-provenance` returned 0 and confirms unchanged RED bytes
and a clean source checkout before this report-only closeout. An initial header
apply-patch attempt also failed on report context; the immediate reread found
no changed files, and the corrected patch applied. No failed attempt is used
as verification authority.

## 005 read-only assessment: actual storage boundary and remaining decision

No 005 source, owner, API, helper, permission or mode change was made.
The current real storage adapter owns imported filesystem and cryptographic
operations. Its public `storagePath` controls the directory boundary; the
private random temporary filename is not selectable through that input.

`conformance-005-existing-boundary` is a successful exploratory probe, not a
new owner case, RED or control. At `d4454b2` it created a fresh mkdtemp,
registered finally cleanup, placed an ordinary synthetic file at storagePath
and called public persist with two distinct anchors. Initial temporary-file
creation therefore failed because its parent was not a directory. The whole
independent observation confirmed both memory anchors, complete parent-file
bytes and the sole directory entry survived. It ran
2026-10-15T02:53:55.550970Z–02:53:55.869284Z, raw exit 0.
This demonstrates that an initial create failure is testable without API
expansion. It does **not** discriminate `wx` from `w`, since neither can create
a child under a regular file. It proves no occupied-temporary-file ownership
contract and no production defect.

The six exact impact records are named
`conformance-005-impact-{production,test}-{ArrivalAnchorsOptions,createArrivalAnchors,temporaryPath}`.
Each preserves full native stdout/stderr, argv, versions, HEAD, UTC and blobs.
Each query selected one actual compiler project, with --type-aware,
--type-aware-require complete, --format json --quiet --explain:

| Exact target | tsconfig.json | tsconfig.test.json |
| --- | --- | --- |
| ArrivalAnchorsOptions | Raw 0; complete; no named external consumer | Raw 0; complete; no named external consumer |
| createArrivalAnchors | Raw 0; complete; src/runtime/accountRuntime.ts | Raw 0; complete; source accountRuntime and both arrival/account owners |
| private temporaryPath | Raw 2; export/class method not found | Raw 2; export/class method not found |

The options type still appears in the exported factory signature despite zero
named external imports. The exact private-target trace remains unmet and is
not replaced by a public neighbor or interpreted as deletion proof. Lexical
inspection finds the private helper and its one persist caller. Actual
structural factory calls were read in accountRuntime's composition factory,
its full owner's real-store case and the arrival owner's storeOver helper.

The minimum existing-boundary option is a focused initial-create-failure case,
which needs only owner/report and no new seam. That would leave the collision
promise unverified. If discriminating occupied temporary-name ownership remains
the confirmed cause, a complete path supplier is the narrow deterministic
dependency; a filesystem mock graph, module replacement or test-only accessor
is not justified. The reviewer's optional supplier with live fallback is a
proposal, not an automatically accepted API design. A required supplier with
composition wiring would also affect the actual factory consumers above.
Removing/moving the private helper lacks the exact checker trace required by
D-06. Before any structural repair, the parent must settle that minimum cause
and declare the necessary bounded adapter/composition/owner paths and checks.
This assessment grants no API amendment and makes no acceptance/rejection
change to 005. Its inaccurate "everything ... by injection" overview also
remains within that pending cause rather than being silently repaired here.

Arrival causes 001/002/003/004/006/007/008 and the arrival portion of 015
have applied repairs pending independent verification. 005 remains unapplied;
monitoring 009–014 and monitoring 015 remain for their owner. All original
**15** accepted findings remain open, independently fixed **0**, correction
counter **0**. No correction review ran or stop counter was reset. RUN-01,
shared records, package/live/private inputs and full-gate ownership remain
unchanged. This report-only closeout is committed separately after its own
audit and clean pre-step; its actual commit identity belongs in the parent's
subsequent metadata, not in a predicted self-reference.

## 005 compatible temporary-path dependency and ownership evidence

The committed bounded amendment is `42fea06`. Fixer
`/root/phase4_trust_first/arrival_dependency` read its complete 04-05 plan,
AGENTS, all five required rulebooks, CONTEXT, REVIEW-PROTOCOL, PATTERNS,
this report, the complete arrival source/owner and actual account composition
and owner calls. The parent granted the exclusive foreground writer/build/
control/Git lease. All checks below ran in the **main checkout**, isolation
**none**, on Node **v26.11.1** and npm **11.20.0**. The dispatch sentinel
names 04-05 with isolation none; the batch marker remains
`23a2511ac6deb26869db8d3c44916623a27ec997`.

Before editing, fresh live Fallow help and four exact impact queries ran at
`42fea06`, each with one `--type-aware-project`, `--type-aware-require complete`
and `--format json --quiet --explain`. Records are
`dependency-impact-{production,test}-{options,factory}` in
`/private/tmp/guardian-04-arrival-handoff/`. All four returned raw 0,
status/completeness complete, with distinct production/test project identities.
Options have no named consumers, but remain public in the factory signature.
The production factory query identifies `src/runtime/accountRuntime.ts`;
the test project additionally identifies both arrival/account owners.
Actual structural calls at account source line 1280, account owner line 2936
and arrival owner storeOver were read. They omit the new optional member and
need no adaptation. Earlier private temporaryPath queries remain unavailable;
that missing exact trace grants no deletion permission.

The touched-file rollback list is exactly source, owner and this report.
The exact three-path Fallow guard returned 0 before editing. The only source
changes add documented `ArrivalAnchorsOptions.temporaryPath?: (target: string)
=> string` and select `(options.temporaryPath ?? temporaryPath)(target)`
inside the existing persist catch boundary. This is a trusted adapter
dependency. It is neither user configuration nor a test mode. The private
helper's name, signature, complete body and call-time process/random reads
are unchanged, confirmed by exact source comparison with `42fea06`.
No factory signature, existing caller, required option, export, helper file,
mode, retry, storage format, key or privacy permission changes.

Four new independent owner cases use real per-case mkdtemp with registered
cleanup. Successful injection checks complete literal durable JSON bytes,
both restored observations including zero, and whole directory entries.
The occupied-path case checks the whole directory before reading temporary
bytes, then complete occupied bytes, prior durable bytes and both memory
anchors. This distinguishes unowned occupied files from owned writes.
The failed-rename case checks owned-temp cleanup, both memory anchors,
whole root/target directory entries and complete retained target-child bytes.
The throwing-supplier case proves persist absorbs the error and preserves
both memory anchors, complete durable bytes and directory entries.
Three case-owned strong-mock functions prescribe the exact literal durable
target and full temporary path with exactParams; every verify follows public
state assertions. The error-only supplier is a plain throwing stub.
Existing omitted-option cases still execute native temporary naming.

### 005 separate overwrite maintenance control

The plausible wrong behavior uses `flag: 'w'`, allowing a supplied occupied
temporary path to be overwritten and renamed away. Typecheck, lint and exercised
coverage do not establish exclusive-create ownership. This is a maintenance
control for accepted finding 005, not a new genuine production bug or RED history.

The saved complete source is
`/private/tmp/guardian-dependency-control-original.ts`; the exact mutation patch
is `/private/tmp/guardian-dependency-control.patch`. The control changes only
`wx` to `w`. Control typecheck, focused ESLint and fresh build:test returned 0.
The exact named native TAP command in `dependency-control-owner` ran
2026-10-15T03:05:19.975991Z–03:05:20.435243Z, raw **1**, with one test and
one intended `deepStrictEqual` / `ERR_ASSERTION` failure: the occupied file
vanished from the whole directory observation. That assertion executes before
any attempt to read the now-missing temporary file. There is no ENOENT,
compile, import, fixture or setup failure. The full original TAP and separate
empty stderr remain retained. Control source blob:
`b190f21855d463c16ee94f7a77329c56c7c8dd19`.

Exact saved source bytes were restored and equality verified in
`dependency-control-restore`. Restored source SHA-256:
`349e5bcc3ed093eec8bfed95ab0e56b9b5a143d323640e6b7b5101b9fad09698`;
source blob `aa8bdebcfa86c8ad78b8f0c3d2d614252302fa64`.
The checked owner blob is `2fe109239b192a86d93b061c3f6ba80dfffdb669`.
A fresh rebuild, both complete owners and isolated arrival direct check passed
after restoration. No mutation enters Git. Immutable 002 RED JSON blob
`cac1f810efb536ba384c05bca9396604ccd72d6c` matches `42fea06`, and actual
evidence-only `4544c71` remains an ancestor. No RED record was rewritten.

### 005 focused verification and new threat mitigation

Every `dependency-*` JSON records exact native argv/cwd, UTC start/end,
raw exit, Node, before/after HEAD, source/owner blobs, full tracked/staged
diffs and all untracked bytes. Separate stdout/stderr files retain full streams.
Ordinary current-input checks returned raw **0**:

- `npm run typecheck` checks both strict projects.
- Focused complete-pair ESLint and Prettier pass; both full headers retain
  SPDX, separate copyright, overview and required section spacing.
- Fresh `npm run build:test` precedes the native command covering both
  `dist-test/test/runtime/arrivalAnchors.test.js` and
  `dist-test/test/runtime/accountRuntime.test.js`.
- Both native owners pass **141 tests**, including **13 arrival tests**,
  with zero failures/cancelled/skipped/todo. Restored owner interval:
  2026-10-15T03:05:30.197853Z–03:05:30.749040Z.
- Arrival isolated direct coverage passes **100% lines/functions/branches**,
  including supplied, omitted and supplier-error paths. The restored direct
  interval is 03:05:30.911136Z–03:05:34.556246Z.
- Actual production consumer accountRuntime also passes its isolated direct
  pair; `dependency-account-direct` ran 03:05:01.088415Z–03:05:04.868065Z.
  The later control restores exactly those same source/test bytes.
- `dependency-provenance` confirms unchanged private helper, RED bytes,
  source/evidence ancestry, nonprotected branch and preserved real batch base.
- `dependency-audit` uses recorded base
  `23a2511ac6deb26869db8d3c44916623a27ec997`, returns raw **0** and verdict
  **pass**, with no new findings. Its retained stderr warns that two generated
  tsbuildinfo package entries lie outside the project-root entrypoint scope.
  Configured architecture boundaries and rule packs remain absent; zero
  violations do not claim those detectors measured a policy.

The newly declared **high T-04-21** extends the initial twenty-threat inventory.
Its boundary is trusted temporary-path supplier to filesystem ownership.
Mitigation is retained exclusive creation, cleanup only after successful owned
creation, catch-scoped supplier failures, and the independent whole-byte/state/
directory observations plus restored overwrite control above. T-04-09/10
storage/restart/privacy contracts remain preserved. This is focused mitigation
evidence, not a full security certification or combined-wave gate.

Finding 005 is applied pending its normal three-path cause commit and full
independent correction. No new bug was discovered. Arrival causes
001–008 and arrival 015 now have applied repairs; monitoring causes and the
monitoring portion of 015 remain with 04-06. All original **15** accepted IDs
remain open, independently fixed **0**, correction counter **0**. RUN-01,
shared records and full-gate ownership stay unchanged. No partial clean verdict
or correction reset follows from these owner checks.

## 002 documentation follow-up: finite read-back validation

The fixer `/root/phase4_trust_first/arrival_validation_comment` updates only
the three-line comment above the round-trip case at owner lines 89–91 and
appends this evidence. The comment describes legal zero, its round-trip
observation and finite validation of overflowing JSON numbers. This is a
documentation follow-up to original CR-04-TRUST-002, whose production fix made
the old typeof-only explanation stale. It introduces no new cause or counter.

The fixer read complete AGENTS, all five required rulebooks, 04-05,
REVIEW-PROTOCOL, this report and the complete arrival source/owner. The parent
granted the exclusive foreground lease in the **main checkout**, isolation
**none**, at `02ba8853fd5dfbbbb24760f1f6b9cac1189b6924`. Node is
**v26.11.1** and npm **11.20.0**. The rollback list is exactly owner/report.
The exact two-path Fallow guard returned 0 before editing; no architecture
boundaries or rule packs are configured.

All `comment-*` records in `/private/tmp/guardian-04-arrival-handoff/` retain
exact argv/cwd, UTC intervals, raw exits, runtime version, before/after HEAD,
source/owner blobs, complete tracked/staged diffs and all untracked bytes.
Separate stdout/stderr files retain full native streams. The initial shell
invocation used unavailable `python` and exited 127 before running the guard;
the recorded commands use `python3`. That attempt supplies no passing evidence.

Current-input typecheck, focused owner ESLint and Prettier, fresh build:test,
native owner and isolated direct coverage all returned **0**. The complete
native TAP ran 2026-10-15T03:10:36.409045Z–03:10:36.895985Z: **13 passed**,
zero failures/cancelled/skipped/todo. Direct coverage ran
03:10:37.064154Z–03:10:40.671753Z and enforced **100% lines/functions/branches**.
The checked owner blob is `8567b3d5f21044994b5ea831e15a0b758a121115`.
`comment-emitted-code` confirms identical compiler-emitted owner JavaScript
with comments removed, complete source bytes and immutable RED JSON against
`02ba885`. Test titles, statements and active overflow regressions are unchanged.
The source remains blob `aa8bdebcfa86c8ad78b8f0c3d2d614252302fa64`.

The required Fallow audit against recorded base
`23a2511ac6deb26869db8d3c44916623a27ec997` returned raw **0**, verdict **pass**.
Exact two-path clean pre-step, asserted staging and ordinary foreground commit
evidence follow in their `comment-*` records; no future commit is claimed here.
This focused evidence does not establish a full combined-wave gate. No source
behavior, RED history, helper, shared record or independent correction changed.
All original **15** accepted findings remain open, independently fixed **0**,
correction counter **0**; full TRUST correction remains pending 04-06.

## 04-05 executor metadata handoff

The actual optional-dependency commit is
`02ba8853fd5dfbbbb24760f1f6b9cac1189b6924`; the same-002 owner-comment followup is
`578b8b3e272990ef5608a72b0f437c6765a15b70`. Both ordinary hooks passed.
The report frontmatter now distinguishes the eight fully applied arrival IDs
from partially applied 015. All original 15 remain formally open, independently
fixed 0 and correction counter 0; initial historical observations remain intact.

The executor's native `closeout-native` check returned raw 0 /
`ARRIVAL_CLOSEOUT_OK` on Node v26.11.1. It independently checked the actual
12-commit Git ancestry and paths, evidence-only production equality, immutable
RED bytes, both current and recursive archived records with four installed
target classifications, actual clean-prestep-before-stage ordering, normal
commit streams, three intended controls, current pair blobs and complete
headers, unchanged private helper, unchanged account/monitoring consumers and
all six declared realized output paths. Exact argv/cwd/UTC/revision/input
snapshots and complete streams are in
`/private/tmp/guardian-04-arrival-handoff/closeout-native.json`.
This metadata check supplies no full TRUST correction or full-project gate.

## Monitoring initial repairs: 009 header cause

Fixer `/root/phase4_trust_finish/monitoring_initial_repairs` holds the exclusive
serial writer/build/control/Git lease for ordinary task 04-06-01. All work runs
in the existing **main checkout**, isolation **none**, branch
`features/code-review-sweep`, starting at `86ed892e46ad358e8aedcd671ad0d51337636dee`.
The persisted dispatch sentinel identifies 04-06 and isolation none. The legal
`gsd-plan-head-before-04-06` marker is
`a6d68bcacbf95343b6434d4930f026a943f81b1e`, preserving the parent's amendment
in the plan's measured history. The recorded TRUST audit base remains `23a2511`.

009 changes only complete monitoring source/owner headers: MIT SPDX first,
separate copyright and purpose overview JSDoc, with one blank line between
sections and before imports. Both full headers were re-read. The source's
overview body is retained for the separate present-behavior documentation cause.
Touched-file rollback inventory: monitoring source, owner and this report.
The exact three-path Fallow guard returned 0 before the first edit; no boundary
zones or rule packs are configured. No runtime statement or test assertion
changes with this cause.

Native evidence directory: `/private/tmp/guardian-04-monitoring-repairs/`.
Every named JSON retains exact argv/cwd, UTC start/end, raw child exit,
Node/npm, before/after HEAD, all three owned blobs, complete tracked/staged
diffs and all untracked bytes. Separate stdout/stderr streams remain unmodified.
The `009-*` records cover this cause's checks and ordinary commit. Node is
v26.11.1 and npm is 11.20.0. The private fixture declarations and helper names,
signatures and bodies remain intact; unavailable pretrace output grants no
deletion or redesign permission. Finding 012 belongs to separate task 04-06-03.

009 is applied pending normal commit and full independent correction. All
original **15** accepted IDs remain formally open, independently fixed **0**,
correction counter **0**. No source bug, RED JSON, seed helper or external
adaptation is introduced. Focused checks do not establish a full wave gate.

009 typecheck, complete-pair ESLint/Prettier, fresh build, full native owner
and isolated direct checks each returned 0. The owner ran **32 tests**, all
passing with zero fail/cancel/skip/todo. The direct selector enforced **100%
lines/functions/branches**. The first audit returned raw 2 because the sandbox
could not create its temporary base worktree; `009-audit-authorized` returned
0 / verdict pass against full base `23a2511ac6deb26869db8d3c44916623a27ec997`.
The initial audit interval overlapped the tail of the ordinary build, without
changing the reviewed files or running an owner concurrently; the authorized
audit ran after all checks. Both attempts and full streams remain retained.
No unconfigured boundary/policy detector result is represented as measured.

## 009 commit and 010 original-deadline observations

009 committed normally as `6d4b84ab73fb65c56528681e2b8dbf55a382b598`, exactly
source, owner and report. `009-prestep` was clean before `009-stage`;
`009-commit` returned 0 with the ordinary pre-commit npm-check hook passing.

010 changes only owner and report. Rollback inventory is those two paths;
the temporary maintenance control separately touches and restores source.
The exact guard returned 0 before editing. The failed-poll case now records
the complete silent-device list and account verdict at literal 1,795,999 ms,
records one REST failure, then observes both whole outputs at the independent
literal **1,796,000-ms original deadline**. Expected values are literal objects,
not production constants, serializers or harness answers. This preserves the
existing one-failure account verdict and the original device silence deadline.

`010-typecheck`, complete-pair lint/format, fresh build, full native owner and
direct pair each returned 0. The owner ran **32 passing tests**, with zero
fail/cancel/skip/todo; isolated direct coverage enforced **100% lines/functions/
branches**. These are current main-checkout focused checks, not a full gate.

### 010 separate reset-stamps maintenance control

The plausible wrong behavior resets every tracked elapsed stamp and its wall
anchor when REST fails. Type checking, lint and exercised-line coverage do
not establish this unchanged-deadline contract. The temporary mutation is in
`010-control.patch`; the complete original source is `010-control-original.ts`
in the native directory. No production defect or genuine RED history is claimed.

Control typecheck, focused ESLint and fresh build returned 0. The exact named
native target in `010-control-owner` ran
2026-10-15T03:41:04.774456Z–03:41:05.016517Z, raw **1**, one test, one intended
`ERR_ASSERTION` / `deepStrictEqual` failure. At the original deadline the broken
implementation returned `silent: []` instead of `['placeholder-device']`;
both account objects remained `{ restDegraded: false }`. The assertion executed
without compile/import/setup/fixture failure. Full untouched TAP and separate
stderr remain retained.

`010-control-restore` used git checkout and confirmed **exact saved-byte
equality**. Fresh restored build, whole owner and isolated direct coverage then
returned 0. The restored owner ran 03:41:15.164902Z–03:41:15.405445Z: 32 passed,
zero fail/cancel/skip/todo. Restored direct ran 03:41:15.829433Z–03:41:19.173996Z,
100% lines/functions/branches. No control mutation enters Git; the private
fixture declarations remain unchanged. The source stays at the 009 header blob.
All 15 findings remain formally open, independently fixed 0, counter 0.
