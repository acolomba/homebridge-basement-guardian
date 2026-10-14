# DECODING Conformance Review

Milestone: code-review-sweep. Requirement: DEV-01. Batch baseline:
55627f52d3f9ce5e94e484af268b4555c0d15c7b. One inventory and correction counter
span 03-02 through 03-04. Initial triage is round 0. The current correction
verdict and remaining owner handoff are recorded below.

## Initial Independent Review

Reviewer /root/phase3_family/decoding_initial_review, role gsd-code-reviewer,
read all six complete source/owner files at the baseline: family, Gemini and
waterLevel. It read the complete comments, Google style, unit writer, unit
reviewer and local-verification skills, headers, compiler negatives and helpers.
Relevant metadata, scope and official command consumer bodies were read.
The review was read-only: no build, mutation, edit, index operation or Git write.
It accepted coordinator-supplied unchanged-input gate evidence at 26761a6:
Node v26.11.1, six static checks, 104 scenarios, 1,156 steps, 43 isolated pairs.
It did not independently rerun or inspect that gate's native output.

Initial count: 12 confirmed open IDs, 2 BLOCKER and 10 WARNING. No genuine
production behavior defect is confirmed. No fixed STATE finding or SC-03
reopening was observed. All locations below refer to the baseline revision.

## Stable Finding Inventory

This table preserves the original twelve-ID initial inventory and its initial
statuses. Current independent dispositions, including later initial additions,
are recorded in the correction-round section below.

| ID (CR-03-DECODING-) | Severity | Initial location | Exact rule and cause | Disposition and owner |
| --- | --- | --- | --- | --- |
| 001 | WARNING | Source openings: family:1-13, gemini:1-15, waterLevel:1-17; all mirrored owners:1 | Context D-01; Google Files and modules: approved separate SPDX/copyright/overview headers are missing | Confirmed; family portion 03-02, Gemini 03-03, water 03-04; open |
| 002 | WARNING | family:28-35; gemini:102-105,195-197; Gemini owner:73-74,192 | Comments What and why; Google Comments and documentation: metadata has an actual AccessoryInformation firmware consumer, despite no owning safety trust scope | Confirmed; family portion 03-02; Gemini portions 03-03; open |
| 003 | WARNING | family:195-196 | Google Comments and documentation: public capabilities/command methods lack useful descriptions of their state/request boundary | Confirmed; 03-02; open |
| 004 | WARNING | family:47 | Google Types: inline object shapes in FamilyValidation require interfaces; retain the exported discriminated union | Confirmed; 03-02; open |
| 005 | WARNING | gemini:105,117,346 | Google Types: unnecessary GeminiFieldScope alias includes undefined | Confirmed; 03-03; open |
| 006 | WARNING | gemini:225-227 | Comments What and why: guard comment says every field validates before decode, but decode independently gates each scope | Confirmed; 03-03; open |
| 007 | BLOCKER | Gemini owner:304-309,335-398 | Unit Assertions: invalid-scope preservation promises observe only absence lists or no throw; wrong healthy values can pass | Confirmed assertion maintenance; 03-03; open |
| 008 | BLOCKER | Gemini owner:463-470 | Unit Assertions, independent expectations: age case compares two production outputs; equal fabricated state can pass | Confirmed assertion maintenance; 03-03; open |
| 009 | WARNING | Gemini owner:29-62,108-124 | Unit Test data: cross-case telemetry/metadata/snapshot seeds belong in fresh concern-local factories | Confirmed; 03-03 conditional geminiSeeds; open |
| 010 | WARNING | Gemini owner:127-148,164-170,248-267,285-301,463-470,506-534; water owner:15-17,46-48,54-65,77-80 | Unit Case structure: ordinary operations combine act/assert or omit arrange; combined phases are reserved for throwing/rejection expressions | Confirmed; 03-03 Gemini portion, 03-04 water portion; open |
| 011 | WARNING | Gemini owner:230-244 | Google Quick scan and Classes: Object.defineProperty accessor fixture is forbidden; preserve changing-read guard reachability with a conforming narrow fixture | Confirmed; 03-03; open |
| 012 | WARNING | Gemini owner:114-119 | Unit Naming: helper parameter data needs a role-specific telemetry name; canonical property data stays | Confirmed; 03-03; open |

Locations use src/device/name.ts or test/device/name.test.ts as identified by
source/owner in the table. Every row contributes to DEV-01. IDs are allocated
once per cause; shared portions retain their ID until all portions are closed.

## Candidate Dispositions

- Required undefined members stay required. ScopedDomainState construction and
  the omitted-scope compiler negative prove exhaustive present keys. Retain
  required timestamp/metadata absence fields and FieldViolation.scope.
- The class-only readonly rule does not automatically apply to these interfaces.
  No reviewed mutation contract requires an interface readonly repair.
- Scalar battery percentage, low-battery and controller-link promises retain
  scalar equality; a specifically promised absent group may be undefined.
- The existing illegal-water tracer at Gemini owner:285-301 compares the whole
  independently authored decoded result. No artificial RED is justified.
- Family remains declaration-only. Meaningful satisfies/expected-error verdict,
  desiredData, omitted-scope and support-flag contracts stay at module scope.
  Zero runtime cases and declaration-only selector success are appropriate;
  neither is a numerical runtime coverage claim.
- Numeric validators remain unconfirmed. typeof number alone establishes no
  vendor range policy. No numeric-domain repair or new meaning is authorized.
- Changing-read fixtures exercise a broken stable-record contract, not real
  vendor getter behavior. Guard TypeError class assertions are appropriate.
- Generic official desiredData commands, provisional water ladder/threshold,
  HALO support, device identity, clocks and existing scope meanings remain.
- Runtime map/threshold export assertions are not type-member enumeration.

## Exact Consumer Evidence

At the baseline, six fresh installed Fallow symbol-impact commands exited 0,
status complete, semantic completeness complete, backend typescript-go. Each
used dead-code --type-aware --type-aware-project with tsconfig.json or
tsconfig.test.json, --symbol-impact src/device/family.ts:<symbol>, --format json
and --quiet. Full stdout/stderr, raw exits, targets/projects and revision are
retained in /tmp/family-impact-<symbol>-<project>.json.json.

| Symbol | Production direct consumers | Test-project direct consumers |
| --- | --- | --- |
| ScopedDomainState | src/device/gemini.ts | Gemini and test/device/family.test.ts |
| FamilyValidation | src/device/gemini.ts; src/accessories/basementGuardian.ts | Both source consumers and test/device/family.test.ts |
| DeviceFamily | src/device/gemini.ts; src/device/registry.ts | Both source consumers; test/accessories/basementGuardian.test.ts; test/device/family.test.ts; test/platform.test.ts |

Read actual Gemini construction, validation, registry map, family compile
contracts, accessory violatedScopesOf and metadata projection, and both test
consumer constructor bodies. Structural serviceCatalogue decodedGroup and
runtime commandBodyOf were also read. The accessory validates then decodes a
partly invalid snapshot; firmware comes from decoded metadata when available.
Invalid metadata preserves prior information and adds no safety TrustScope.
Exact direct type consumers do not enumerate every structural downstream read.
No consumer edit is justified by the shape-preserving declaration repair.

Fallow guard for the family pair exited 0. /tmp/family-guard.json retains complete
stdout/stderr and command. No architecture zones or rule packs are configured;
this is not a policy-compliance measurement.

## Correction Round History

| Review | Opening | Fixed | Rejected accepted IDs | New | Reopened | Closing |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Initial round 0 | 12 | 0 | 0 | 0 | 0 | 12 |
| Later initial clarification | 12 | 0 | 0 | 2 | 0 | 14 |
| Correction round 1 | 14 | 14 | 0 | 1 | 0 | 1 |

The complete independent correction review follows 03-04's initial repairs.
Tracer checks, candidate clarifications and ordinary checks are not rounds.
D-03 stops all work before another edit/build/commit/dispatch if an open round
does not reduce, a fixed finding reopens, or round four is reached even clean.

## Out-of-Scope Observation

src/accessories/basementGuardian.ts:268-269 also says no published service reads
undefined-scope metadata. This external comment remains untouched for its
accessory sweep. It requires no contract adaptation and is outside this task.

## Family Execution Evidence

Family execution finished at 29ddff5ec7d642de54f05fe8c815dc88590976a6.
Fixer /root/phase3_family/family_cause_fixer used role gsd-code-fixer with
configured complete rulebooks. Both typed roles resolved an empty model ID,
so the model was omitted; resolved effort high was applied. Initial reviewer
effort used resolve-execution; fixer effort used resolve-model --pick effort.
GSD_RUNTIME=codex applied to all resolution calls. The coordinator persisted
isolation none and the worker read its sentinel directly. Existing feature
checkout was retained. Parent and child serialized task/build/Git work.

| ID portion | Actual commit | Actual paths | Applied outcome / current revision-qualified location |
| --- | --- | --- | --- |
| 001 family | 93284c763d81033641d90298494f9a58b2261d69 | src/device/family.ts; test/device/family.test.ts | Approved original MIT headers at 29ddff5:source/owner:1-9; remaining four headers pending |
| 002 family | 7cbeed2d68dba91eb542d3c4a84b76736315bb79 | src/device/family.ts | Actual firmware projection versus safety-scope ownership explained at 29ddff5:37-39; Gemini portions pending |
| 003 | 3064645d40e8bb41f32ef86b3a19ad2792b90738 | src/device/family.ts | Capability/request descriptions at 29ddff5:212,214; applied pending final independent correction review |
| 004 | 29ddff5ec7d642de54f05fe8c815dc88590976a6 | src/device/family.ts; .planning/phases/03-device-and-persistence-conformance/03-02-PLAN.md | Documented exported verdict interfaces at 29ddff5:44-53 and unchanged union contract:64; applied pending final independent correction review |

Each cause was staged individually. Recorded-base audit, exact-file
SKIP=npm-check pre-commit run --files, and normal foreground git commit exited
0 for all four introducing commits. Every selected normal check:commit hook
passed. No formatter changed bytes in these pre-steps, so no corrective repeat
was required. The pre-steps were clean before launching their commits.
Actual Git objects confirm only the paths shown, with no deletion. No query
commit wrapper, hook bypass, amend, history rewrite or broad staging was used.

Full command captures retain command, cwd, start/end UTC, revision, exact dirty
diff, Node/npm, unmodified stdout, separate stderr and raw exitCode. The 28
captures are /tmp/family-fixer-*.json, excluding the separate semantics record.
The first clean pre-step ended 17:14:14.508462Z before commit launch
17:14:23.819931Z. The final clean source/plan pre-step ended
17:22:27.613078Z before commit launch 17:22:43.548745Z, which ended
17:22:55.837325Z with exit 0.

### Bounded declaration-visibility conflict

CR-004's initially proposed private interfaces compiled and passed the
pre-step, but audit could not accept that remedy. The first audit at
17:16:48.669110Z exited 2 because its temporary baseline worktree was
unavailable; this is not a pass. The authorized retry at 17:17:06.458922Z
exited 1, verdict fail, with exactly two introduced private-type-leaks:
ValidFamilyValidation and RejectedFamilyValidation in the exported
FamilyValidation union. The configured rule is private-type-leaks:error.
Both native captures remain /tmp/family-fixer-004-audit-sandbox.json and
/tmp/family-fixer-004-audit-escalated.json.

The fixer and executor returned terminal checkpoints before an alternate
edit. The coordinator amended the concrete task/file map to authorize
documented exported variants, preserving valid:true versus valid:false and
readonly FieldViolation[] exactly. That plan amendment is committed with the
CR-004 source repair. No suppression or forced consumer import was introduced.
The variants are genuinely used in the public FamilyValidation union, whose
production and test consumers are recorded above. The resumed audit exited 0,
verdict pass, with no unused exports or private-type leaks. Capture:
/tmp/family-fixer-004-resumed-audit.json. This initial remedy clarification
is neither a correction round nor a genuine production defect.

### Native tracer and final checks

All following commands ran serially on Node v26.11.1 and npm 11.20.0 using
installed dependencies and synthetic offline inputs.

- npm run build:test before header commit and fresh after it exited 0.
  node --test --test-reporter=tap dist-test/test/device/family.test.js
  dist-test/test/device/gemini.test.js exited 0 before and after the commit.
  TAP reports 90 passes: one family file sentinel and 89 Gemini executable
  cases. Zero failed, skipped, cancelled or todo targets. The repeated
  post-commit tracer feedback preceded expansion.
- The named SAFE-01 case, "omits the water scope for an out-of-domain
  water_level while every other scope keeps its current values", executed
  and passed. It independently compares the whole nine-group decoded result,
  with water undefined and healthy pump/power/battery/fault/connectivity/
  controls/metadata. It was already implemented and needed no test edit.
- The meaningful omitted-scope compiler negative remains at family owner
  29ddff5:108-109. Strict build also retains desiredData, verdict discriminant,
  support-flag and timestamp negatives; present undefined scopes remain valid.
- Final npm run test:coverage:direct -- src/device/family.ts
  test/device/family.test.ts exited 0 at 29ddff5, ending 17:23:04.162366Z.
  The existing selector accepts declaration-only output after successful
  strict compilation. It supplies no numeric runtime line/function/branch
  coverage claim. Capture /tmp/family-fixer-004-final-selector.json.
- Final npm run build:test exited 0, ending 17:23:07.984585Z, followed by
  node --test --test-reporter=tap dist-test/test/device/gemini.test.js exit 0,
  ending 17:23:11.161575Z: 89 tests, 89 pass, zero fail/skip/cancel/todo.
  Captures /tmp/family-fixer-004-final-build.json and
  /tmp/family-fixer-004-final-gemini.json.
- Resumed CR-004 also ran fresh build, combined tracer and declaration selector
  before its commit, all exit 0; native captures use 004-resumed-* filenames.

/tmp/family-fixer-semantics.json records unchanged non-comment source tokens
through causes 001-003, unchanged owner tokens, identical source tokens after
expanding the named verdict interfaces, and identical emitted production
JavaScript versus the batch baseline. The source changes add no runtime
behavior, fields, guessed normal state, mapping or command. Required scope
presence, timestamp units, metadata absence and FieldViolation.scope remain.

No genuine bug was accepted, so no 03-FAMILY-RED-EVIDENCE.json exists. No
assertion mutation or artificial RED was performed. The coordinator owns the
fresh combined npm run check gate; focused checks and hooks do not replace it.

### Remaining batch inventory

Family portions 001/002 and complete causes 003/004 are applied. IDs 001 and
002 stay open for their later portions, and 005-012 stay open for Gemini/water.
There are ten remaining open IDs before independent correction acceptance:
001, 002, 005, 006, 007, 008, 009, 010, 011, 012. This is an initial repair
status, not a correction-round reconciliation. The next full independent
correction verdict remains after 03-04, using the original round-0 inventory.
No fixed finding reopened; no nonreducing correction or fourth round occurred.
Overall DEV-01 remains pending. Existing WINDOWS 46 records the earlier
STATE CR-008 pre-step ordering deviation and remains explicitly open process
history; this family contribution neither waives nor closes it.

## Gemini Execution Evidence

Gemini execution started from be7a2350ecf7e05633c0d44679bf549b0ba6657d and
finished its code at cd975d25a8f4a545a6a4f6a18794fb469c71fa09. The existing
features/code-review-sweep checkout and directly read isolation-none sentinel
were retained. Parent and children serialized code, builds, controls and Git.
Fixer /root/phase3_gemini/gemini_cause_fixer used role gsd-code-fixer; narrow
reviewer /root/phase3_gemini/gemini_tracer_review used gsd-code-reviewer. Actual
GSD_RUNTIME=codex resolve-model calls returned effort high and omitted model
IDs. Both read their configured complete skills plus the writer/reviewer and
local-verification rules needed by this contribution.

### Applied Gemini causes

Locations in this table are qualified by the final code revision cd975d25.
These are initial-pass repair outcomes; full independent DECODING correction
acceptance remains scheduled after 03-04.

| ID portion | Actual commit | Actual paths | Applied outcome and current location |
| --- | --- | --- | --- |
| 007 | b87c55ac489c13e0de7b6ee80911755d37e03edf | test/device/gemini.test.ts | Independent complete invalid telemetry/control/metadata results at 301-512; test_timestamp row 449-477 also expects the complete self-test-only violation |
| 001 Gemini | 305ed865320e3a618ffab0c66bfa75c5c6d55479 | src/device/gemini.ts; test/device/gemini.test.ts | Separate MIT SPDX/copyright/overview sections at source/owner 1-9; water portion remains |
| 002 Gemini | 9ec326b0ab9a8962d69b7b9ffbb069e323e7e017 | src/device/gemini.ts; test/device/gemini.test.ts | Actual firmware information use versus safety scope ownership at source 117-120,198-200 and owner 51-52,164 |
| 005 | a63a9eb01d9ea23941c85c2d1d1a1d6093b442d8 | src/device/gemini.ts | Private alias inlined at scope member 120 and set annotation 349; required undefined values preserved; trace-process gap below |
| 006 | 5555069b4ba1cee5a3ca64784a8e01cde28216ac | src/device/gemini.ts | Independent per-scope checks and stable-record guard explanation at 228-230; guard bodies unchanged |
| 008 | 50b5d83542ae8a0f626355a3a8265faac49de137 | test/device/gemini.test.ts | Recent and ancient results each compare with a separate full independent literal at 575-607 |
| 012 | 35956f11424ea4ba2f4d143afba46cc87224974d | test/device/gemini.test.ts | Snapshot parameter renamed telemetry before relocation; canonical data property retained |
| 009 | 294f1c90350a95b9587ec6fdab3f9d052e5ce0f9 | test/device/gemini.test.ts; test/device/geminiSeeds.ts | Four reused fresh seed factories moved into their documented, headered concern helper at helper 18,40,50,55 |
| 011 | e944df894677a1eae774a4295a0dc2863318cd2e | test/device/gemini.test.ts | Narrow Proxy changing-read fixture at 194-215; four existing TypeError guard cases at 610-640 still execute |
| 010 Gemini | cd975d25a8f4a545a6a4f6a18794fb469c71fa09 | test/device/gemini.test.ts | Ordinary cases have separate arrange/act/assert; only four throwing expressions retain combined phases; water portion remains |

All ten actual introducing commits passed recorded-baseline Fallow audits,
clean exact-file SKIP=npm-check pre-commit run --files before commit launch,
and normal foreground git commit hooks, each exit 0. Actual objects match the
paths above; none deletes a tracked file. The source/header causes are separate
from assertion repairs. No commit wrapper, hook bypass, amend, branch switch or
history rewrite was used. Complete command captures include command arrays,
cwd, UTC start/end, revision, exact dirty diff/untracked bytes, runtime versions,
unmodified stdout, separate stderr and raw exitCode. The 91-capture index and
ten-commit ordering/path audit are /tmp/gemini-fixer-handoff.json; native records
are /tmp/gemini-*.json. For example, the first clean pre-step ended
17:38:05.171179Z before the commit started 17:38:07.436276Z. The last clean
code pre-step ended 17:49:26.602548Z before commit launch 17:49:28.581278Z.

### Native tracer, controls and final checks

All commands used Node v26.11.1, npm 11.20.0 and installed dependencies with
offline synthetic inputs. The invalid test_timestamp tracer independently
expects all nine required groups: self-test undefined, healthy pump booleans,
required absent activation timestamp, existing water/power/battery/fault/
connectivity/mute values and firmware metadata. It also observes the complete
validation verdict naming only the self-test violation. Expectations never
come from a production helper. Wrong metadata retains complete independent
healthy safety groups; absent metadata retains present undefined members.
Legitimate scalar battery/link promises remain scalar.

- Fresh build:test, native owner and isolated direct selector passed before
  the 007 commit. Fresh build:test and complete owner were repeated immediately
  after it and before expansion: 88/88 pass, zero fail/skip/cancel/todo.
- One redundant doesNotThrow water case was removed. The existing illegal
  water case compares the whole independently expected result and naturally
  also fails on a throw. Test count therefore changes from 89 to 88.
- A deliberate test_timestamp scope=pump mutation was built at b87c55a.
  The selected decode tracer executed one test but threw TypeError before its
  assertion: /tmp/gemini-007-control-tap.json, exit 1. This is a failed control
  attempt, not assertion-discrimination evidence or genuine production RED.
- Under the same mutation, the named validation case executed one test and
  failed ERR_ASSERTION on actual pump versus expected self-test. Command:
  node --test --test-reporter=tap --test-name-pattern
  'wrong-type test_timestamp violation to the self-test scope'
  dist-test/test/device/gemini.test.js. Native capture
  /tmp/gemini-007-control-validation-tap.json records exit 1, start
  17:39:12.738538Z and end 17:39:13.008768Z. Exact saved source was restored
  with cmp exit 0; fresh build and full owner then passed. Preservation record
  verifies the saved bytes equal the actual b87c55a source blob.
- A second separate control inverted primaryRunning at cd975d25. Command:
  node --test --test-reporter=tap --test-name-pattern
  'control field test_timestamp is invalid' dist-test/test/device/gemini.test.js.
  It executed one test and failed the strengthened complete-state assertion:
  actual primaryRunning true versus independently expected false. Capture
  /tmp/gemini-007-healthy-control-tap.json records ERR_ASSERTION, exit 1,
  start 17:52:22.702524Z and end 17:52:22.994516Z. Exact saved/restored SHA256
  is 995177d1a87ade122a0abc7b574e6dc7c0b9469bf09bfea50772abb703107a91.
  No mutated byte was committed.
- Final restored npm run build:test exited 0, ending 17:52:26.288327Z.
  The subsequent node --test --experimental-test-coverage --test-reporter=tap
  dist-test/test/device/gemini.test.js exited 0, ending 17:52:27.158605Z:
  88 tests, 88 pass, zero fail/skip/cancel/todo. Gemini runtime coverage is
  100% lines/functions/branches; companion direct LCOV has 247/247 lines,
  30/30 functions and 85/85 branches. Imported waterLevel's aggregate result
  is not its owner coverage and is not used as that claim.
- Final npm run test:coverage:direct -- src/device/gemini.ts
  test/device/gemini.test.ts exited 0, ending 17:52:31.434469Z at cd975d25.
  All final captures have empty dirty diff and no untracked inputs; paths are
  /tmp/gemini-final-restored-build.json, -owner.json and -direct.json.
- Seed staging selects all 43 existing pairs by the support-path rule at
  scripts/test-coverage-direct.mjs:113-122. Its normal check:commit passed.
  Quiet native output does not enumerate per-pair counts. This staged hook
  does not include the coordinator's required full Cucumber wave gate.

The Proxy fixture copies its input and changes only the selected field after
its first read. It deliberately breaks the stable-record contract to reach
four existing public decoder guards. It makes no vendor getter observation,
adds no public test hook and removes no guard. The new helper supplies fresh
telemetry/metadata/omission records and snapshot envelopes; whole expected
results remain independent literals in the owner. All three headers and four
helper export descriptions were inspected.

### Exact consumers and preservation limits

Four installed Fallow semantic impact commands used dead-code --type-aware
--type-aware-project tsconfig.json or tsconfig.test.json --symbol-impact
src/device/gemini.ts:geminiFamily or :GeminiDomainState --format json --quiet.
All exited 0 with complete status and semantic completeness; records are
/tmp/gemini-impact-<symbol>-src.json and -test.json. geminiFamily has production
consumer registry and test-project consumers registry plus the Gemini,
registry and basementGuardian owners. GeminiDomainState has no external
production type consumer and one test consumer, its owner. Actual registry
construction, external test constructors and structural accessory metadata/
scope readers were read. These public symbol queries do not prove every
structural downstream read. No public signature, shape or consumer changed.

Guard exited 0 before changes, captured in /tmp/gemini-guard.json. It reports
no configured architecture zones or rule packs; no measured policy-compliance
claim follows. /tmp/gemini-preservation.json records equal source tokens after
equivalent private-alias expansion and identical actual compiler-emitted
production JavaScript with comments removed versus 55627f52. Emitted SHA256
is ebf4c87470f4d37531d5e4ca1e7d265a9a5468d7fff57a22e83c67620de84418.
Required undefined keys, guards, current numeric domains, provisional bands,
official command bodies, separate clocks and identity/privacy remain intact.
Numeric-validator concerns remain unconfirmed; no finite/range/unit policy
was introduced. No genuine behavior bug was accepted, so no conditional
03-GEMINI-RED-EVIDENCE.json was created.

### Retained attempts and process deviation

The first 007 audit exited 2 because a temporary baseline worktree was
unavailable; /tmp/gemini-007-audit-sandbox.json retains it. Authorized retry
/tmp/gemini-007-audit.json exited 0/verdict pass. The denied attempt is not a
pass. Causes 007 and 011 had formatter pre-step exits 1; each restaged and
repeated to a clean exit 0 BEFORE its normal commit. Those native records remain.

The first 009 normal commit attempt exited 1 because import-x/order required
a blank line between import groups. No commit existed from that attempt.
/tmp/gemini-009-commit.json retains the full hook output. The fixer corrected
the import group and included the reused telemetryWithout factory in the same
helper, rebuilt, checked, audited, ran a clean pre-step and retried ordinary
commit. Only the successful retry created 294f1c9; no partial 009 commit or
history rewrite occurred.

CR-005 has an explicit trace-process deviation. Before editing at 9ec326b, the
fixer read the complete source and ran rg -n
'GeminiFieldScope|untrustedScopesOf|scope:' src/device/gemini.ts. The output
identified alias declaration 110 and two uses, scope member 122 and set return
annotation 351. This source-search evidence is in its conversation output.
It did not run or capture the required alias-specific pre-edit Fallow trace.
The four public-symbol queries above do not cover this private alias. No later
check is represented as an earlier trace or as compliant ordering. Expanded
type/source-token and emitted-JavaScript equality are bounded preservation
evidence, not replacement trace evidence. The coordinator authorized accurate
record/summary closeout and owns the WINDOWS disposition. Existing WINDOWS 46
remains open. No new behavior defect or D-03 reopening is inferred solely from
this process gap, and no unnecessary source change or history rewrite follows.

### Independent narrow tracer/helper check

The typed read-only reviewer examined complete Gemini source/owner/helper and
all five specified rulebooks at cd975d25, actual Git objects, command captures,
controls and restoration hashes. It accepted current unchanged native evidence
without rebuilding. It found no concrete issue or reopened finding in the
tracer/helper scope. It confirmed complete independent invalid-self-test and
age results, fresh documented seeds, all three headers, all four guarded
TypeErrors, 88/88 tests and all three isolated metrics at 100%. It independently
confirmed ten clean pre-step ends precede their commit starts and the first
009 hook attempt created no commit. The separate trace gap is disclosed above.
This is a narrow tracer/helper clarification, not a full correction round or
whole-batch acceptance.

### Current DECODING status after Gemini

Original round 0 remains 12 confirmed IDs: 2 BLOCKER, 10 WARNING. No correction
round has run and its count table above is unchanged. All Gemini portions are
applied, pending the complete independent correction review. IDs 001 and 010
still have unapplied water portions; all other initial code portions are
applied. This two-ID repair remainder is not an independently reconciled
closing count. No fixed finding reopened or nonreducing/fourth correction
condition occurred. The coordinator still owns npm run check on the combined
wave, shared records, process-ledger dispositions and phase advancement.
DEV-01 remains pending; E-03-01, P-03-01 and P-03-02 remain unresolved judgments.

## Water Execution Evidence

Water execution began from 2ff2d366cd8d853edd39b577ed161ef9c1e84071 and its code
finished at 93a425d4dd41ef062351ef9f8d0107ed75626e52. The existing feature
checkout and directly read isolation-none sentinel were retained. Typed fixer
/root/phase3_water/water_cause_fixer read the complete owning files and project
rulebooks. GSD_RUNTIME=codex resolve-model returned effort high with an omitted
model ID; configured skills were loaded. Task, build and Git handoffs were serial.

| Cause | Actual commit | Actual paths | Outcome at 93a425d4 |
| --- | --- | --- | --- |
| 001 water | 5b4ada4c40f2004ce684700eebbbfbe303a11922 | src/device/waterLevel.ts; test/device/waterLevel.test.ts | Separate original MIT headers; source 1-22 and owner 1-9 |
| 010 water | 7b8a83cf2cae0db41ae392ede8b6fb250c3e2865 | test/device/waterLevel.test.ts | Separate ordinary AAA phases; only throwing expressions combine act/assert |
| 013 | 4aeaef9bec74e924dbe5e305201530f2f2114e5d | test/device/waterLevel.test.ts | Six illegal-code cases assert native TypeError class at 38-45 |
| 014 | 93a425d4dd41ef062351ef9f8d0107ed75626e52 | test/device/waterLevel.test.ts | Complete independently literal entries at 73-88 |

Each cause passed Fallow audit against recorded DECODING baseline 55627f52,
exact-file SKIP=npm-check pre-commit run --files, and ordinary foreground
git commit with enabled hooks. All successful raw exits were 0. Actual objects
match the paths above and delete no tracked file. Clean pre-step end times
precede commit launches: 18:11:45.331779Z < 18:12:00.294307Z;
18:13:06.255042Z < 18:13:08.925705Z; 18:18:16.706476Z < 18:18:18.520302Z;
18:18:58.408277Z < 18:19:03.529505Z. No source implementation changed.

The initial ledger write was denied by filesystem permissions before any
commit; its authorized retry persisted the original HEAD. The first Python
invocation was unavailable, exit 127; python3 succeeded. The first 001 audit
exited 2 because its temporary baseline worktree was unavailable. Its authorized
retry exited 0/verdict pass. These attempts remain distinct from passing evidence.
Native audit captures are /tmp/water-001-audit-sandbox.json and
/tmp/water-001-audit.json. No hook bypass, history rewrite or wrapper commit ran.

### Independently accepted initial additions

Before changing either assertion candidate, typed reviewer
/root/phase3_water/decoding_reviewer performed a read-only initial clarification
at 7b8a83cf2cae0db41ae392ede8b6fb250c3e2865. It read complete water and Gemini
files, rules, actual guard consumers and native records. This was not a correction
round. It independently accepted two WARNING causes, both present at baseline:

| ID | Initial revision-qualified location | Exact rule | Accepted cause and bound |
| --- | --- | --- | --- |
| CR-03-DECODING-013 | 55627f52:water owner 25-31; 7b8a83c:44-52, substring at 48 | Unit writer Assertions:93; reviewer Assertions:48 | Message-substring form is forbidden. Native TypeError already supplies the complete error contract; retain all six cases without adding an error type or field. |
| CR-03-DECODING-014 | 55627f52:water owner 54-65; 7b8a83c:81-102 | Unit writer Assertions:92; reviewer Assertions:47; 03-04 PLAN:94 | Whole map entries must be compared directly. Existing ordered keys and values jointly pin membership and associations; no weak-protection or production-defect claim is accepted. |

Original IDs 001-012 remain unchanged. The actual opening inventory becomes
14 = 2 BLOCKER + 12 WARNING. The counter stays round 0 until the first complete
correction below. One redundant map-values case was removed after the complete
entries comparison replaced it; no skipped target or weakened observation remains.
No mutation control was necessary for this assertion-form repair. The preceding
checks already discriminated map contents, so no new protection defect was claimed.

### Native checks and preserved behavior

All commands used Node v26.11.1 and npm 11.20.0 with installed dependencies and
synthetic offline inputs. /tmp/water-final-handoff.json indexes 48 native captures,
including complete stdout, separate stderr, command, cwd, raw exit, UTC start/end,
revision, exact dirty diff and untracked contents. Current final captures have
empty dirty diffs and no untracked executable inputs.

- Fresh npm run build:test and node --test --test-reporter=tap
  dist-test/test/device/waterLevel.test.js dist-test/test/device/gemini.test.js
  passed initially and again after the header commit before expansion: 110/110,
  water 22 plus Gemini 88, zero fail/skip/cancel/todo. Post-header feedback and
  the independent full decoder probe preceded the AAA expansion.
- Final npm run build:test exited 0, ending 18:20:10.714373Z at 93a425d4.
  The following combined native owners exited 0, ending 18:20:11.361229Z:
  109/109, water 21 plus Gemini 88, zero fail/skip/cancel/todo.
  Captures: /tmp/water-final-build.json and /tmp/water-final-owners.json.
- node --test --test-reporter=tap /tmp/water-tracer.mjs passed 2/2 initially,
  after the header before expansion, and finally at 93a425d4. Both temporary
  cases call the actual compiled Gemini adapter and independently compare all
  nine decoded groups and complete validation verdicts. Legal 31 returns water
  { levelCode: 31, levelPercent: 100, flooded: true }; illegal 2 returns water
  undefined while every healthy group retains the independent expected literal.
  No production output constructs the expectations. Final native record is
  /tmp/water-final-tracer.json; the probe source remains /tmp/water-tracer.mjs.
- npm run test:coverage:direct -- src/device/waterLevel.ts
  test/device/waterLevel.test.ts exited 0 at 18:19:59.458474Z.
  The family pair command exited 0 at 18:20:03.568722Z and the Gemini pair
  command exited 0 at 18:20:07.543217Z. Records are
  /tmp/water-final-water-selector.json, /tmp/water-final-family-selector.json
  and /tmp/water-final-gemini-selector.json. Family is declaration-only after
  strict compilation; no numerical runtime coverage is claimed for it.
- node --test --experimental-test-coverage
  --test-coverage-include=dist-test/src/device/waterLevel.js
  --test-reporter=tap --test-reporter-destination=stdout --test-reporter=lcov
  --test-reporter-destination=/tmp/water-final-native.lcov
  dist-test/test/device/waterLevel.test.js exited 0 at 18:20:17.370753Z.
  Native water owner passes 21/21 with 100% lines/functions/branches.
  The one actual LCOV record names compiled dist-test/src/device/waterLevel.js:
  lines 62/62, functions 2/2, branches 4/4. These are compiled JavaScript counts,
  not fabricated TypeScript counts. Capture: /tmp/water-final-native.json.
- /tmp/water-final-preservation.json records unchanged production tokens and
  installed TypeScript compiler output with comments removed versus 55627f52.
  Emitted SHA256 is 96ef7df40af7331575f30af05a82b375d1d9821d6d82202e2bbd28d54d5d2306.
  All six literal mappings, threshold 31, guarded lookup and provisional limits
  remain unchanged. Only water code 1 has existing hardware-validation evidence.

Guard exited 0 before edits and reports no configured architecture zones/rule
packs, rather than measured policy compliance. Header and test-form changes
alter no exported symbol, function body, type or signature; no production
symbol refactor, export deletion or external adaptation occurred in this slice.
No genuine behavior defect was accepted and no 03-WATER-RED-EVIDENCE.json exists.
Current numeric candidates and hardware/release gates remain outside this repair.
The full combined npm run check belongs to the coordinator after handoff.

## Independent Full Correction Review — Round 1

Typed reviewer /root/phase3_water/decoding_reviewer read all seven complete files
at clean 93a425d4dd41ef062351ef9f8d0107ed75626e52: family, Gemini and waterLevel
sources and owners, plus geminiSeeds. It read complete applicable rulebooks,
AGENTS, context/protocol, current report, prior summaries, canonical decisions,
actual consumers, Git objects and native capture evidence. It made no source,
test, compiled-output, index, Git or planning mutation and ran no build.

| ID | Independent disposition at 93a425d4 | Current evidence |
| --- | --- | --- |
| 001 | Fixed | All six source/owner headers and actual helper conform |
| 002 | Fixed | Family 37-39; Gemini source 117-120,198-200; owner 51-52,164; actual firmware/safety consumers |
| 003 | Fixed | Family capability/command descriptions 212-215 |
| 004 | Fixed | Family documented public variants 44-53 and exact discriminated union 64 |
| 005 | Fixed in code | Gemini alias inlined 120,349; missing pre-edit trace remains a process gap |
| 006 | Fixed | Gemini actual scope/guard explanation 228-230 |
| 007 | Fixed | Gemini owner whole independent invalid results 303-509; test_timestamp row/verdict 449-477 |
| 008 | Fixed | Separate complete recent/ancient expected literals 575-607 |
| 009 | Fixed | Four fresh documented helper factories 17-65; independent owner expectations |
| 010 | Fixed | Ordinary Gemini/water cases have separate AAA; throws alone combine phases |
| 011 | Fixed | Narrow copying Proxy 194-215; four public guard cases 610-640 |
| 012 | Fixed | Helper telemetry parameter 55; canonical data remains 59 |
| 013 | Fixed | Water TypeError class cases 38-45 |
| 014 | Fixed | Water complete independent entries 73-88 |

Every row addresses DEV-01. Opening 14 - fixed 14 - rejected 0 + new 1 + reopened
0 = closing 1. Open ID is CR-03-DECODING-015. This is correction round 1; all
initial and clarification history survives. No accepted fix or SC-03 reopened.
The round reduces 14 to 1 and is below four, so D-03 permits the bounded owner
return. DECODING is not closed.

### New finding and exact owner return

CR-03-DECODING-015 is WARNING, DEV-01, comments policy line 8: comments describe
what the code does. At 93a425d4:test/device/family.test.ts:85-96, the comment says
only the lost-link scope is absent and the rest keep publishing. The literal
instead has eight undefined groups and only connectivity populated. The same
mismatch exists at 55627f52:owner:75-86. This is a factual documentation defect,
not a runtime or assertion defect.

Return serially to original family task 03-02-02. Required code path is only
test/device/family.test.ts. Replace the comment with an accurate description,
such as "Connectivity can remain available while every other group is absent."
Keep the complete literal and compiler contracts unchanged. Record-only updates
belong to the owned report/coordinator. No production change, genuine RED or
assertion control is justified. The water task does not edit this family file.
After the bounded repair, the next independent full batch review is round 2,
opening 1; the counter never resets.

### Header, native and provenance inspection

Complete approved MIT headers were inspected at source family 1-18, Gemini
1-20 and waterLevel 1-22; all three owners and geminiSeeds 1-9. SPDX is first;
correct copyright and overview blocks are separate with required blank lines.
The reviewer inspected public export descriptions, required undefined shape,
compiler negatives, seed freshness, guarded lookup and official commands.

It independently accepted current final three selectors, fresh 109/109 owners,
2/2 complete real probes and water native 62/62,2/2,4/4 counts. Gemini's retained
restored owner has native 100% lines/functions/branches and its current isolated
selector passes. The earlier 247/247 Gemini line count in this report remains
historically reported, not independently confirmed: no matching raw LCOV was
retained or located. The older merged source-mapped artifact has 248/248 lines,
30/30 functions and 85/85 branches. These are distinct representations; neither
is substituted for the current isolated verdict or a current whole-tree gate.

The reviewer inspected all 18 introducing family/Gemini/water commits, actual
paths and ancestry, passing audits and clean pre-steps before normal commits.
Gemini wrong-scope validation and healthy-primary inversion controls each
executed the intended assertion and failed ERR_ASSERTION with exit 1. The
earlier decode TypeError-before-assert attempt stays unsuccessful. Saved bytes
match actual source blobs; exact restoration and rebuilt GREEN are confirmed.
STATE's whole/frozen/canonical-refusal SC-03 cases remain intact; its files have
not changed since the closing STATE review.

After live help, Fallow orientation used review --base 55627f52 --brief
--format json --quiet, raw exit 0 and reported verdict pass. Removed-test
pointers match the documented redundant cases. Orientation is not a gate.

WINDOWS 46 (STATE pre-step ordering) and 47 (Gemini missing alias-specific
pre-edit trace) remain explicitly unwaived process gaps. Later checks do not
establish earlier compliance. Sandbox failures, private-interface audit failure,
formatter retries and the failed Gemini import-hook attempt remain preserved.
No code finding is invented from those process gaps.

The prior coordinator full gate at a54cba5 predates the water test changes and
cannot be reused for this tree. A fresh coordinator npm run check follows
remaining repairs. DEV-01 and E-03-01/P-03-01/P-03-02 remain pending.

## Bounded Family Owner Return — CR-03-DECODING-015

The coordinator returned only 015 to original task 03-02-02 after independent
round 1 at clean 6009a05356fcbda9fbd45cee70765e59fd483290. The executor read
the current full report, amended plan, family pair and applicable rulebooks.
Typed fixer /root/phase3_family/family_cause_fixer used the configured complete
skills, freshly resolved omitted model ID and high effort with GSD_RUNTIME=codex.
The persisted none sentinel was read directly; existing feature checkout and
serial foreground ownership were retained. No review was dispatched here.

Commit 1e8b074c68b8f73ad122cae6d8d1d07d86c2e079 changes only
test/device/family.test.ts:85-86. Its comment now states that every required
group is present even when undefined and connectivity can remain available
while the other groups are absent. The complete positive literal and all nine
expected-error negatives are byte-identical. No production source, interface,
export, suppression, helper or later Gemini/water repair changed.

Node v26.11.1 and npm 11.20.0 were used for all checks. Fallow guard before
the edit exited 0 and reports no configured zones or rule packs. Fallow audit
--base 55627f52d3f9ce5e94e484af268b4555c0d15c7b --format json --quiet exited
0, verdict pass, ending 18:35:30.438827Z. Native capture is
/tmp/family-015-audit-sandbox.json. No failed retry occurred for this cause.

npm run test:coverage:direct -- src/device/family.ts test/device/family.test.ts
exited 0, ending 18:34:59.266009Z; declaration-only acceptance after strict
compilation supplies no numerical runtime coverage. Fresh npm run build:test
exited 0 at 18:35:25.231379Z before node --test --test-reporter=tap
dist-test/test/device/gemini.test.js exited 0 at 18:35:29.197139Z: 88 tests,
88 pass, zero failed/skipped/cancelled/todo. These are the current owner cases
after the earlier documented redundant test removal.

The exact-file SKIP=npm-check pre-commit run --files test/device/family.test.ts
exited 0 without byte changes, ending 18:35:46.822005Z. Normal foreground
git commit launched at 18:35:53.875409Z and ended 18:36:06.977335Z, exit 0;
its selected check:commit hook passed. Actual Git inspection confirms the
single owner path, two added comment lines and one removed comment line, with
no deletion or unrelated change. No hook bypass, amend or history rewrite ran.

Ten retained records under /tmp/family-015-*.json include nine command captures
and the preservation record. Command records keep complete stdout, separate
stderr, raw exit, UTC start/end, revision and exact dirty diff. The preservation
record and captured semantics command confirm unchanged owner tokens, identical
compiler-emitted owner JavaScript with comments removed, all production sources
unchanged, and nine active compiler negatives. Emitted SHA256 is
8454cfeaaebc370c0562437ffe9a3a674fc78e6afd2903e04e754aa284c54e53.

015 is applied pending the complete seven-file independent correction round 2,
opening 1, through the resumed water reviewer. Round 1 stays opening 14, fixed
14, rejected 0, new 1, reopened 0, closing 1. This bounded fix/check is not a
correction verdict and does not reset the batch counter or declare it clean.
No genuine RED, assertion control, full gate or overall DEV-01 closure is
claimed. The coordinator owns the combined gate and shared records. WINDOWS
46 and 47 remain explicitly unwaived; all earlier failures and histories above
are preserved.
