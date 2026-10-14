# DECODING Conformance Review

Milestone: code-review-sweep. Requirement: DEV-01. Batch baseline:
55627f52d3f9ce5e94e484af268b4555c0d15c7b. One inventory and correction counter
span 03-02 through 03-04. Initial triage is round 0; no correction round has run.

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

The complete independent correction review occurs after 03-04's initial repairs.
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
