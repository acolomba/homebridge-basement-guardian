# Phase 04 findings ledger

Milestone: code-review-sweep. Requirement RUN-01 remains Pending.
Current through 04-03: PORTS is independently clean at correction round 3.
POLICIES has complete initial review, six applied causes and six retry causes
remaining. Full wave-three verification passed. No production bug is confirmed.
The parent coordinator alone consolidates actual reports into this ledger.

## Full current inventory

Initial source/test baseline: 008218be4badf44455ab35906f1dfcff06089bf8.
Exactly twenty initial core paths form ten mirrored pairs. PORTS has full initial
review and complete-header inspection. POLICIES has complete initial review;
TRUST and ACCOUNT remain pending. ACCOUNT initial sizes are 1,283 source
lines and 3,365 owner lines; line-count changes never shrink the full review.

| Batch | Exact path | Scope | Full initial review | Current full correction | Header |
| --- | --- | --- | --- | --- | --- |
| PORTS | src/runtime/accessoryStore.ts | core | 6f475a0; full file/header | Round 3; dd5ea2d; clean | Approved; independently inspected |
| PORTS | test/runtime/accessoryStore.test.ts | core | 6f475a0; full file/header | Round 3; dd5ea2d; clean | Approved; independently inspected |
| PORTS | src/runtime/clock.ts | core | 6f475a0; full file/header | Round 3; dd5ea2d; clean | Approved; independently inspected |
| PORTS | test/runtime/clock.test.ts | core | 6f475a0; full file/header | Round 3; dd5ea2d; clean | Approved; independently inspected |
| PORTS | src/runtime/monotonicClock.ts | core | 6f475a0; full file/header | Round 3; dd5ea2d; clean | Approved; independently inspected |
| PORTS | test/runtime/monotonicClock.test.ts | core | 6f475a0; full file/header | Round 3; dd5ea2d; clean | Approved; independently inspected |
| PORTS | src/runtime/timers.ts | core | 6f475a0; full file/header | Round 3; dd5ea2d; clean | Approved; independently inspected |
| PORTS | test/runtime/timers.test.ts | core | 6f475a0; full file/header | Round 3; dd5ea2d; clean | Approved; independently inspected |
| POLICIES | src/runtime/commandPort.ts | core | e25e26e; full file/header | Pending | Applied; independent correction pending |
| POLICIES | test/runtime/commandPort.test.ts | core | e25e26e; full file/header | Pending | Applied; independent correction pending |
| POLICIES | src/runtime/failureLog.ts | core | e25e26e; full file/header | Pending | Applied; independent correction pending |
| POLICIES | test/runtime/failureLog.test.ts | core | e25e26e; full file/header | Pending | Applied; independent correction pending |
| POLICIES | src/runtime/retryPolicy.ts | core | e25e26e; full file/header | Pending | Nonconformant; repair pending |
| POLICIES | test/runtime/retryPolicy.test.ts | core | e25e26e; full file/header | Pending | Nonconformant; repair pending |
| TRUST | src/runtime/arrivalAnchors.ts | core | Pending | Pending | Pending |
| TRUST | test/runtime/arrivalAnchors.test.ts | core | Pending | Pending | Pending |
| TRUST | src/runtime/monitoringHealth.ts | core | Pending | Pending | Pending |
| TRUST | test/runtime/monitoringHealth.test.ts | core | Pending | Pending | Pending |
| ACCOUNT | src/runtime/accountRuntime.ts | core | Pending | Pending | Pending |
| ACCOUNT | test/runtime/accountRuntime.test.ts | core | Pending | Pending | Pending |

Initial helper inventory is empty. Add every actual helper and every narrowly
required external adaptation as its own exact row before edits, with owning
task/wave, revision/blob, full-review evidence and complete header evidence.
No source-only license result substitutes for owner/helper header inspection.

## Batch reports and continuous counters

| Batch | Plans | Report | Initial review | Last correction round | Open IDs |
| --- | --- | --- | --- | --- | --- |
| PORTS | 04-01/02 | 04-PORTS-REVIEW.md | 7 accepted at 6f475a0 | 3; clean at dd5ea2d | None; 0 |
| POLICIES | 04-03/04 | 04-POLICIES-REVIEW.md | 12 accepted at e25e26e | 0; six repairs applied | 001–012; 12 pending independent closure |
| TRUST | 04-05/06 | 04-TRUST-REVIEW.md | Pending | Not started | Unknown until review |
| ACCOUNT | 04-07/08/09 | 04-ACCOUNT-REVIEW.md | Pending | Not started | Unknown until full review |

D-03 requires opening/fixed/rejected/new/reopened/closing ID sets/counts for each
independent full correction. No-progress with open findings, a reopened fix, or
round four even clean pauses ALL work before further edits/builds/dispatch.
ACCOUNT keeps one counter across all slices and any added owning cause tasks.

## Candidate triage — no preaccepted finding

| Candidate | Review question | Owning task | Disposition / evidence |
| --- | --- | --- | --- |
| S-04-01 | accessoryStore compiler positives/negatives versus tests of a literal recorder | 04-01-01 | Accepted CR-04-PORTS-002; compiler repair applied |
| S-04-02 | CommandOutcome inline-object union against interface/public constituent rules | 04-03-01 | Accepted CR-04-POLICIES-002; public variants applied |
| S-04-03 | Optional versus required-present undefined; actual exhaustive public shape | Every affected cause, coordinated in 04-09-02 | Pending |
| S-04-04 | Readonly advice versus interface rule scope and actual mutation contract | Every affected cause, coordinated in 04-09-02 | Pending |
| S-04-05 | Count/negative/single-field checks versus each complete independently expected promise | Every owner, ACCOUNT 04-07 through 04-09 | Pending |
| S-04-06 | In-flight command-cancellation title versus actual stop/send/root-signal setup | 04-09-01 | Pending |
| S-04-07 | Arrival absence/restart/seeding narration versus canonical shipped history | 04-05-02 | Pending |
| S-04-08 | Runtime identifier-privacy narration versus scoped permission and unconfirmed opaque-key premise | 04-07-02; 04-09-02 | Pending |

These questions do not limit complete style/comment/writer/reviewer review.
Each gets fixed/rejected with exact current rule/source evidence and accepted
stable finding IDs where applicable. A research example is not proof of a bug.

## Stable findings

| ID | Requirement | Exact rule/section | Initial revision:path:line | Current revision:path:line | Severity | First reviewer | Disposition/reason | Native checks/raw exits | Source/evidence/fix commits and paths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

The complete 04-PORTS-REVIEW.md retains exact rule sections, initial/current
revision-qualified locations, severities, first observers, blobs and full native
command mappings for every ID. Its round-3 disposition table at dd5ea2d is the
current independent finding record, superseding the partial wave-one status.

| Stable PORTS ID | Cause / severity | Initial observation | Repair | Current independent result |
| --- | --- | --- | --- | --- |
| CR-04-PORTS-001 | Store headers; WARNING | 6f475a0, source/owner headers | 227c799 | Fixed; dd5ea2d full pair |
| CR-04-PORTS-002 | Declaration-only compiler contracts; BLOCKER | 6f475a0, store owner 17–42 | ce36088 | Fixed; dd5ea2d owner 11–19 |
| CR-04-PORTS-003 | Clock headers; WARNING | 6f475a0, source/owner headers | fd53a74 | Fixed; dd5ea2d full pair |
| CR-04-PORTS-004 | Separate wall-clock act/assert; WARNING | 6f475a0, clock owner 16–17 | 84f4ca8 | Fixed; dd5ea2d owner 23–31 |
| CR-04-PORTS-005 | Monotonic headers; WARNING | 6f475a0, source/owner headers | 8fb80f9 | Fixed; dd5ea2d full pair |
| CR-04-PORTS-006 | Exact millisecond assertions; BLOCKER | 6f475a0, monotonic owner 17–44 | 419cab0 | Fixed; dd5ea2d owner 23–49 |
| CR-04-PORTS-007 | Timer headers; WARNING | 6f475a0, source/owner headers | 8177bec | Fixed; dd5ea2d full pair |
| CR-04-PORTS-008 | Single-shot timeout protection; BLOCKER | 8177bec, timer owner | f99a637 | Fixed; dd5ea2d owner 31–47 |
| CR-04-PORTS-009 | First-deadline observation; BLOCKER | f99a637, timer owner 31 | dd5ea2d | Fixed; dd5ea2d owner 31–47 |

Header causes apply D-01 and style Files and modules. Assertion causes apply
unit writer/reviewer independent whole-value observations and wrong-behavior
protection; 004 applies the explicit AAA rule. All have RUN-01; header causes
also contribute PROC-03. First reviewer for 001–007 is ports_initial_review,
008 ports_full_correction, 009 ports_full_correction_two, each under the typed
executor identities retained in the report. Fresh ports_full_correction_three
confirmed all nine fixed, complete eight-file/header scope, no new/reopened IDs.
Each repair has owner/direct/build exit 0, recorded-base audit pass, clean
pre-step before staging and ordinary hooks pass; full mappings remain in report.
S-04-01 is resolved by 002; S-04-03/04 were rejected for PORTS only.
S-04-05's PORTS assertion findings are fixed; other batches remain pending.

No rows are allocated before actual independent observation.
Use CR-04-PORTS-NNN / POLICIES / TRUST / ACCOUNT per protocol.

## Genuine bug history and separate controls

No Phase04 bug is accepted. Conditional pair RED files are declared by the
owning plans. For each actual bug retain the active intended failure on
UNCHANGED production, complete native TAP/command/raw exit/target/expected/
actual/semantic assessment/versions/times/blobs/full test patch, all recursively
nested priorEvidence, evidence-only commit BEFORE minimum GREEN and active test.
Classifier success and independent actual Git ancestry/blob semantics are both
mandatory. Controls remain separately labeled; restore exact bytes, rebuild
and prove GREEN. No failing/skipped code commit or fabricated failure.

## Checks and threat dispositions

PORTS rows have observed current evidence below; later batches remain Pending.
Record exact command, raw exit, revision/blobs,
Node/runtime, scope, timings and dirty/untracked input evidence. Record each
normal hook/clean pre-step and raw Fallow recorded-base audit. Pair evidence
is isolated; declaration-only selectors have no invented numerical coverage.
The parent owns every full combined-wave and phase npm run check.

T-04-01 through T-04-20 and reserved T-04-SC are planned review obligations,
not observed mitigation passes. Later added surfaces extend actual inventory.

## Unresolved probe and prohibition judgments

E-04-01: deterministic RUN-01 category unclassified, status unresolved,
verification/resolution/reason null; probe unclassified — review manually.
Actual equality: edges 1 surfaced = 0 lifted + 1 flagged assumption.
P-04-01 safety and P-04-02 truthful runtime completion are projected through
the existing projectProhibitions serializer into 04-10. Both remain unresolved,
descriptorless, unverified/flagged; prohibitions 2 = 2 authored + 0 omitted.
No inherited Phase3 answer or invented descriptor resolves them. At the seal
parent presents actual remaining Phase04 judgments with evidence/limits.

## Historical evidence limits retained

WINDOWS46/47 remain OPEN/unwaived: 18e8b83 clean pre-step repetition and a63a9eb
exact private-alias pretrace gaps. Three early hook streams lack separate JSON;
original output is the retained limit. Historical Gemini247 remains unconfirmed;
current273 compiled and248 merged are distinct representations. Phase3 closed
after actual three judgments at2716926; they do not preapprove Phase04.
Prior full gate cf04e71/Node26.11.1/exit0/104scenarios/1156steps/43pairs is prior
baseline only; exact unchanged inputs and session evidence govern any reuse.
No live vendor/hardware/private-data/install or later subsystem completion claim.

## Coordinator seal

04-10 produces 04-SEAL-AUDIT.json from actual reports/Git/native results.
It proves exact unique twenty core paths and ten pairs plus all actual additions,
full scope/header provenance, stable IDs/rules/locations/dispositions/counts,
all threat/evidence histories and final checked inputs. Automated readiness
does not supply pending human judgments or authorize shared-state advancement.

## Coordinator wave 1 evidence

At clean 4a69d1434c4cb682c40dbf1a6f757dd127c78dbb, `npm run check`
returned 0 on Node v26.11.1, 2026-10-14T23:05:55.982633Z to
23:06:31.058351Z. Six static checks, 104 Cucumber scenarios / 1156 steps
and all 43 isolated pairs passed. Native full output and metadata are
`/private/tmp/guardian-phase4-wave1-full-check.log` and
`/private/tmp/guardian-phase4-wave1-gate.json`. This is current combined-wave
evidence, not inherited Phase3 evidence; RUN-01 remains Pending.

Clock assertion control returned seconds temporarily: strict typecheck/lint
passed, native TAP returned 1 with both intended wrong-unit assertions.
Exact source blob c6b98a6e2c6863ae0a567d38f1665e40fceb122b was restored,
then fresh build, two cases and isolated coverage passed. This is a separate
restored control, not genuine bug RED. Store is declaration-only with strict
positive/negative compiler contracts and honest selector acceptance.

All four cause commits have clean first pre-steps before staging and passing
normal hooks. The cause-002 sandbox audit exit 2 remains historical failure;
authorized retry exit 0/verdict pass supplies the actual audit result. Complete
native records live under guardian-04-ports-initial-native and
guardian-04-ports-fix-native in /private/tmp. No helper, API/body change,
new package, source control mutation or new process-window waiver is claimed.

The first generic summary advisory mistook two test commands for file paths.
Explicit real output paths corrected its selection; recheck passed all four
checks. No runtime evidence changed. Full PORTS correction follows 04-02.

## Coordinator wave 2 evidence and actual stop resolution

Full `npm run check` returned 0 at clean 1993aaa0b3d468b2e78d0ccacd353b713739c4ef
on v26.11.1, 2026-10-15T00:43:09.634130+00:00 to 2026-10-15T00:43:44.569875+00:00.
Six static checks, 104 scenarios / 1156 steps and all 43 isolated pairs passed.
Full native output: /private/tmp/guardian-phase4-wave2-full-check.log; metadata:
/private/tmp/guardian-phase4-wave2-gate.json. No dependency/runtime input changed.

Continuous full correction counts: round1 7−7+1=1 (new008), round2
1−1+1=1 (new009), round3 1−1=0. Rejected/reopened sets are empty throughout.
Round2 correctly triggered D-03; ALL work stopped and leases were released.
The actual maintainer response `1` authorized only the bounded009 repair and
another review retaining counter2. Round3 independently closed009 with all
prior fixes retained, counter3. No counter reset, retroactive waiver or implied
permission for a future round4 exists. Full native round1/2/3 records and
controls remain under /private/tmp/guardian-04-ports-fix-native/.

Separate assertion controls:006 wrong divisor fails both exact observations;
008 repeating timeout fails the later log;009 late-first-fire and repeating
controls each fail the intended first/later whole log. Each009 control passed
typecheck/lint before native exit1 (4 pass/1 fail), exact source restoration,
fresh build and GREEN5 owner cases/direct100%. These are maintenance controls
on correct production, with no genuine bug or RED JSON. Source APIs/bodies
remain unchanged beneath approved headers. No helper or external adaptation.

Execution-record commit1993aaa follows the five source/test cause commits. Generic summary JSON passed; schema drift found none,
codebase drift explicitly skipped absent STRUCTURE.md. RUN-01 remains Pending.
WINDOWS46/47 remain OPEN/unwaived; this recorded D-03 decision changes neither.

## Coordinator wave 3 evidence and POLICIES handoff

`npm run check` returned 0 at clean b0bbecb466927ef6a1253857af7aa192af8f57e1
on v26.11.1, 2026-10-15T01:17:33.752503+00:00 to 2026-10-15T01:18:08.596890+00:00.
Six static checks, 104 scenarios / 1156 steps and all 43 isolated pairs passed.
Native output: /private/tmp/guardian-phase4-wave3-full-check.log; metadata:
/private/tmp/guardian-phase4-wave3-gate.json. Generic04-03 summary passed;
schema drift found none; codebase drift explicitly skipped absent STRUCTURE.md.

Fresh typed policies_initial_review inspected all six originals, full headers,
all five books and actual callers at e25e26e. Exact initial/current locations,
blobs, rules, native evidence and first observer are retained in
04-POLICIES-REVIEW.md, with repair appendices qualified by real commits.
Initial 12 accepted = 2 BLOCKER + 10 WARNING, no production bugs.

| Stable POLICIES ID | Accepted cause / severity | Current repair disposition |
| --- | --- | --- |
| CR-04-POLICIES-001 | Command pair headers; WARNING | Applied8052f80; full correction pending |
| CR-04-POLICIES-002 | Interface object variants; WARNING | Appliedc0f8062; full correction pending |
| CR-04-POLICIES-003 | Logging pair headers; WARNING | Appliedbd335c2; full correction pending |
| CR-04-POLICIES-004 | Complete hourly stream; BLOCKER | Applied5f07760; full correction pending |
| CR-04-POLICIES-005 | Clock role naming; WARNING | Appliedda5269f; full correction pending |
| CR-04-POLICIES-006 | Reminder AAA; WARNING | Applieded06aa0; full correction pending |
| CR-04-POLICIES-007 | Retry pair headers; WARNING | Unapplied;04-04 |
| CR-04-POLICIES-008 | Scheduled boundaries/pending observations; BLOCKER | Unapplied;04-04 |
| CR-04-POLICIES-009 | Reset act/assert/title; WARNING | Unapplied;04-04 |
| CR-04-POLICIES-010 | Silent logging double; WARNING | Unapplied;04-04 |
| CR-04-POLICIES-011 | Named logger helper declaration; WARNING | Unapplied;04-04; may share010 minimum cause |
| CR-04-POLICIES-012 | Prescribed callback double; WARNING | Unapplied;04-04 |

These are applied dispositions, not independent fixed-ID judgments: opening
accepted001–012 remains12, correction counter0, no rejected/reopened/new IDs
or D-03 stop in POLICIES. Full six-file correction follows all retry repairs.
Header causes apply D-01/style Files and modules;002 style Types;004/008
independent whole-value discrimination;005 Naming;006/009 AAA;010/012 Test
doubles;011 Functions. All contribute RUN-01, headers also PROC-03.

S-04-02 accepted002; S-04-03/04 rejected for POLICIES current shapes only;
S-04-05 partially accepted004/008. Other batch obligations remain open.
Exact six pre-edit symbol impacts at8052f80 independently selected both
compiler projects, all exit0/complete; inferred controls/runtime wiring read.
Public mutable accepted/refused constituents preserve exact required failure
vocabulary, transitive use and compiler positives/negatives. No forced imports,
private leak, suppression, optional/readonly conversion or external adaptation.
FailureLog body from first import is unchanged; retry pair remains at baseline.

Cause004 count-preserving wrong-debug-message control passed typecheck/lint,
then failed the named whole120-entry hourly stream assertion (native exit1).
Exact source4d724a609b5da08f31b7978396fd4d240c93fe70 restored, then
fresh build,15 cases and isolated100% passed before commit. This is a
maintenance control on correct production, with no genuine bug/RED JSON.
Native initial/fix/closeout records remain under guardian-04-policies-*-native
and guardian-04-policies-closeout in /private/tmp; report maps exact directories.
Six cause audits, clean pre-steps before staging and ordinary hooks passed.
Failed sandbox/reuse/comparison attempts remain historical, not passing
evidence. No helper, deleted alias, package or new behavior; WINDOW46/47
remain OPEN/unwaived. RUN-01 Pending.
