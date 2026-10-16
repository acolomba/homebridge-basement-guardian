---
phase: "04"
slug: "runtime-conformance"
status: verified
threats_open: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
threats_total: 32
current_plan_qualified_rows: 58
historical_plan_qualified_occurrences: 137
accepted_historical_limits: 3
created: "2026-10-16"
---

# Phase 4 — Security

The authored mitigations are present at the configured L1 evidence-presence depth. There are 32 distinct IDs and 58 current plan-qualified rows, including the repeated package boundary. All 58 current rows are closed; no blocking threat remains. This is not a new threat scan or an ASVS L2/L3 assessment.

## Scope and Evidence

The reference commit is cda29908927ef5dbfddcbe31e31e65ba95aa01e8. The seal SHA256 is bad44c95f952224b042dd35a98327e62e241ebb0dbb85c733d7d0ddf4c3b211c. Its 34 current review/header inputs match their actual reviewed Git blobs. The complete 137 historical plan-qualified occurrences across 45 Git plan versions remain in the seal. Reused numeric IDs retain their component and plan; they are not silently assigned a later meaning.

The full input-applicable parent gate passed at Node v26.11.1/npm 11.20.0 on 2026-10-16, 15:39:39.811823–15:40:35.513971 UTC: six static checks, 104 scenarios/1156 steps and 43 isolated pairs. Canonical tracer/history/seal passed again after the two core-label corrections. Normal parent commit hooks passed, including the secret scan, with SKIP absent. No dependency or lockfile changed in this phase.

Native evidence: /private/tmp/guardian-phase4-verification-docs/security-presence-proof.json; /private/tmp/guardian-04-10-canonical/final-native/*-labels-final; /private/tmp/guardian-04-10-closeout/postseal/full-gate; /private/tmp/guardian-04-10-closeout/metadata/commit. These are original/current scoped records, not replacements for missing historical observations.

## Trust Boundaries

| Boundary | Observed mitigation |
| --- | --- |
| Injected public ports, persisted anchors and clock domains | Strict positive/negative contracts, exact storage validation, distinct wall/elapsed/device clocks and real owner observations |
| Account and cloud workers | Shared-root cancellation, current connection ownership, terminal/late-await guards and registered credential redaction |
| Accessory identity and controls | deviceId identity, reported-only canonical authority, exact one-attempt outcomes, callback-before-prune and suspended uncertain registration until restart |
| Review, native evidence and claims | Original scopes/counters, real Git ancestry, raw failure/restore/GREEN distinctions and the exact three accepted historical audit qualifications |
| Packages and public artifacts | Existing dependencies only, unchanged package/lock bodies, synthetic scoped inputs and normal secret hooks |

## Current Plan-Qualified Threat Register

Each row preserves its authored component and mitigation. Closure is supported by the current full-review/pair/history/control evidence in the canonical record. L1 presence is the scope of this assessment.

| Plan / Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 04-01-PLAN.md / T-04-01 | Tampering | AccessoryStore / Clock public contracts | high | mitigate | 04-01-01/02 retain required persistence/epoch shape, strict negatives, exact both-project callers and bounded compatibility. | closed |
| 04-01-PLAN.md / T-04-02 | Repudiation | PORTS full initial review and cause evidence | high | mitigate | 04-01-01 records all eight reviewed paths/revision/headers, native outcomes and D-04 provenance before accepting fixes. | closed |
| 04-01-PLAN.md / T-04-SC | Tampering | Package installation | high | mitigate | No install is authorized; a newly required package returns to research legitimacy audit, with blocking human verification for assumed/suspect packages before any install. | closed |
| 04-02-PLAN.md / T-04-03 | Tampering | Monotonic conversion / silence clock domains | high | mitigate | 04-02-01 preserves integer elapsed basis and independent controlled conversion; no inferred wall/device equivalence. | closed |
| 04-02-PLAN.md / T-04-04 | Denial of service | Timer scheduling/cancellation | high | mitigate | 04-02-02 verifies actual timeout/interval/cancel through exports and full PORTS closure with current owner/direct checks. | closed |
| 04-02-PLAN.md / T-04-SC | Tampering | Package installation | high | mitigate | No install is authorized; a newly required package returns to research legitimacy audit, with blocking human verification for assumed/suspect packages before any install. | closed |
| 04-03-PLAN.md / T-04-05 | Tampering | CommandOutcome / inferred control consumers | high | mitigate | 04-03-01 retains exact discriminated accepted/refused shapes and one-attempt semantics with meaningful strict negatives and both-project structural caller evidence. | closed |
| 04-03-PLAN.md / T-04-06 | Information disclosure | FailureLog messages / artifact inputs | high | mitigate | 04-03-02 preserves fixed sanitized whole streams, per-kind cadence and ordinary secret hooks; no real account material. | closed |
| 04-03-PLAN.md / T-04-SC | Tampering | Package installation | high | mitigate | No install is authorized; a newly required package returns to research legitimacy audit, with blocking human verification for assumed/suspect packages before any install. | closed |
| 04-04-PLAN.md / T-04-07 | Denial of service | Retry pending wait / shared-root cancellation | high | mitigate | 04-04-01 independently verifies cap, pending guard, reset and abort through real public operations without new timers/retries. | closed |
| 04-04-PLAN.md / T-04-08 | Repudiation | POLICIES correction / current evidence | high | mitigate | 04-04-02 audits all six full files plus additions, original stable IDs and exact correction arithmetic; immediate D-03 stop blocks false closure. | closed |
| 04-04-PLAN.md / T-04-SC | Tampering | Package installation | high | mitigate | No install is authorized; a newly required package returns to research legitimacy audit, with blocking human verification for assumed/suspect packages before any install. | closed |
| 04-05-PLAN.md / T-04-09 | Tampering | Arrival persistence / restart anchors | high | mitigate | 04-05-01/02 preserve exact storage format/key/malformed recovery and real temp round-trip/whole bytes; no inferred migration. | closed |
| 04-05-PLAN.md / T-04-10 | Information disclosure | Stored device keys / release/privacy narrative | high | mitigate | 04-05-02 compares actual canonical history, preserves scoped unconfirmed opaque-key premise, and uses only synthetic sanitized evidence. | closed |
| 04-05-PLAN.md / T-04-21 | Tampering | Optional trusted temporary-path supplier / exclusive-create ownership | high | mitigate | 04-05-03 retains the native default and wx ownership boundary; occupied-file bytes survive, only owned files are cleaned up, and supplier errors stay within the existing persist failure boundary. | closed |
| 04-05-PLAN.md / T-04-SC | Tampering | Package installation | high | mitigate | No install is authorized; a newly required package returns to research legitimacy audit, with blocking human verification for assumed/suspect packages before any install. | closed |
| 04-06-PLAN.md / T-04-11 | Tampering | Per-device monitoring trust / clock domains | high | mitigate | 04-06-01/02 preserve full independent two-device projections, restored anchors, separate wall/elapsed and narrow invalid scope without false normal. | closed |
| 04-06-PLAN.md / T-04-12 | Denial of service | Silence/recovery / TRUST closure | high | mitigate | 04-06 verifies existing clock-boundary/recovery rules and complete current four-file correction plus the actual shared memory contract and its negative control; D-03 prevents repeated unproductive repair. | closed |
| 04-06-PLAN.md / T-04-SC | Tampering | Package installation | high | mitigate | No install is authorized; a newly required package returns to research legitimacy audit, with blocking human verification for assumed/suspect packages before any install. | closed |
| 04-07-PLAN.md / T-04-13 | Denial of service | Account lifecycle / polling / credentials / shutdown | high | mitigate | 04-07-01/02 preserve current ownership/root cancellation/throttle/late-await semantics with discriminating public lifecycle observations. | closed |
| 04-07-PLAN.md / T-04-14 | Information disclosure | Account credential registration / device narrative | high | mitigate | 04-07-02 verifies role registration before use and exact canonical scoped identifier treatment; synthetic safe output and ordinary secret hooks. | closed |
| 04-07-PLAN.md / T-04-SC | Tampering | Package installation | high | mitigate | No install is authorized; a newly required package returns to research legitimacy audit, with blocking human verification for assumed/suspect packages before any install. | closed |
| 04-08-PLAN.md / T-04-15 | Tampering | Canonical reported ingress / narrow per-device trust | high | mitigate | 04-08-01 independently reads whole canonical state/trust after accepted/refused reported patches and preserves SC-03/watermark/clock rules. | closed |
| 04-08-PLAN.md / T-04-16 | Tampering | Inventory removal / physical tracking and anchors | high | mitigate | 04-08-02 preserves healthy final-check/callback-before-prune order, refused tracking and exact-device cleanup with complete public identity observations. | closed |
| 04-08-PLAN.md / T-04-SC | Tampering | Package installation | high | mitigate | No install is authorized; a newly required package returns to research legitimacy audit, with blocking human verification for assumed/suspect packages before any install. | closed |
| 04-09-PLAN.md / T-04-17 | Tampering | Command delivery / reported canonical authority | high | mitigate | 04-09-01 observes exact whole outcome/body/device and one attempt, with no optimistic canonical state; intended root-cancellation setup is independently checked. | closed |
| 04-09-PLAN.md / T-04-18 | Repudiation | ACCOUNT full correction / cause ownership | high | mitigate | 04-09-02 audits the actual delegated04-19 complete current correction, original stable IDs/counts and immediate global D-03 outcome before metadata closeout. | closed |
| 04-09-PLAN.md / T-04-SC | Tampering | Package installation | high | mitigate | No install is authorized; a newly required package returns to research legitimacy audit, with blocking human verification for assumed/suspect packages before any install. | closed |
| 04-10-PLAN.md / T-04-19 | Repudiation | Full review/round/native/Git provenance and seal | high | mitigate | 04-10 independently queries exact unique scope/current blobs/counts/native evidence/actual commits/ancestry and all D-03 conditions; no self-reported count/prefix completion. | closed |
| 04-10-PLAN.md / T-04-20 | Information disclosure | Evidence/ledger/native output and public artifacts | high | mitigate | 04-10 audits only complete synthetic sanitized artifacts, preserves scoped unconfirmed identifier assumptions and actual secret hooks with no private inputs. | closed |
| 04-10-PLAN.md / T-04-SC | Tampering | Package installation | high | mitigate | No install is authorized; a newly required package returns to research legitimacy audit, with blocking human verification for assumed/suspect packages before any install. | closed |
| 04-11-PLAN.md / T-04-09 | Tampering | Anchor memory/persistence boundary | high | mitigate | Fresh independent real/fake observations preserve storage limits and old real-owner cases. | closed |
| 04-11-PLAN.md / T-04-13 | Denial of service | Shadow readiness and account lifecycle | high | mitigate | Preserve actual ownership/start/readiness/close distinctions and original regression cases. | closed |
| 04-11-PLAN.md / T-04-14 | Information disclosure | Synthetic test/evidence data | high | mitigate | Use synthetic identifiers and existing normal secret hooks; no private inputs or new logging permission. | closed |
| 04-11-PLAN.md / T-04-21 | Tampering | Trusted temporary-path supplier | high | mitigate | Keep real adapter ownership/cleanup tests and immutable earlier histories intact. | closed |
| 04-11-PLAN.md / T-04-SC | Tampering | Packages | high | mitigate | No install or upgrade is authorized. | closed |
| 04-12-PLAN.md / T-04-16 | Tampering | Cached physical identity and confirmed removal | high | mitigate | Seed validated IDs only, retain unknown observations and require healthy confirmations/final check/callback before prune. | closed |
| 04-12-PLAN.md / T-04-13 | Denial of service | Lifecycle/start ownership | high | mitigate | Preserve repeated start, shutdown, terminal halt and late-await guards. | closed |
| 04-12-PLAN.md / T-04-14 | Information disclosure | Restored context and evidence | high | mitigate | Synthetic identities, existing scoped permission, no private account input or new logs/persistence. | closed |
| 04-12-PLAN.md / T-04-19 | Repudiation | Cross-file dependency evidence | high | mitigate | True platform RED before both production stages; actual dependency and final integration commits retained. | closed |
| 04-12-PLAN.md / T-04-SC | Tampering | Packages | high | mitigate | No install or upgrade. | closed |
| 04-13-PLAN.md / T-04-22 | Tampering | Runtime membership replacement/live watermark | high | mitigate | 13-01 true-owner RED and current whole state/trust prove disconnect release, REST authority and current-only readiness. | closed |
| 04-13-PLAN.md / T-04-23 | Denial of service / Information disclosure | Uncertain first registration/local ownership/restart diagnostic | high | mitigate | 13-02 true-owner RED and GREEN prove either identical throw leaves no local success/listener claim and remains suspended across later inventories/removal/reappearance, healthy devices continue, normal/restored one-UUID ownership persists, and an actual safe/redacted restart-required diagnostic reaches the delegate. Preserve uncertainty about bridge acceptance; no automatic retry/compensation or recovery guarantee. | closed |
| 04-13-PLAN.md / T-04-SC | Tampering | Package installs | high | mitigate | No install; any new dependency returns to research legitimacy audit and required human gate before installation. | closed |
| 04-14-PLAN.md / T-04-24 | Tampering | Discovery API double/existing contract | high | mitigate | 14-03 uses a valid typed mock or fully traced real narrow port;031/026 public cases remain independently checked. | closed |
| 04-14-PLAN.md / T-04-SC | Tampering | Package installs | high | mitigate | No install; return new package need to legitimacy research before any install. | closed |
| 04-15-PLAN.md / T-04-25 | Information disclosure | Logger maintenance/security observation boundary | high | mitigate | 15-01 preserves actual wrapper/password registration and logging-owned redaction proof with explicit narrow conditional paths/traces; no security assertion is silently discarded. | closed |
| 04-15-PLAN.md / T-04-SC | Tampering | Package installs | high | mitigate | No install or replacement mocking/parser dependency; new need returns to research legitimacy audit. | closed |
| 04-16-PLAN.md / T-04-26 | Tampering | Architecture gate/lifecycle evidence | high | mitigate | 16-01 controlled signals;16-02 real ESLint AST/binding rules and positive/negative controls preserve SAFE-07/shared wiring and public persistence. | closed |
| 04-16-PLAN.md / T-04-27 | Information disclosure | Actual HTTP absence boundary | high | mitigate | 16-03 uses empty exact injected HttpFetch expectations and restored discriminating control; no default live port supplies an offline test. | closed |
| 04-16-PLAN.md / T-04-SC | Tampering | Parser/mock/package installs | high | mitigate | Existing ESLint/TypeScript/strong-mock only; any new dependency returns to research legitimacy gate. | closed |
| 04-17-PLAN.md / T-04-28 | Repudiation | Whole ACCOUNT correction/counter and trust evidence | high | mitigate | 17-01 whole trust assertions;17-02 full current inventory/read/native/ancestry/sets with immediate parent D-03 evaluation before any follow-on command. | closed |
| 04-17-PLAN.md / T-04-SC | Tampering | Package installs | high | mitigate | No install; new dependency requires legitimacy research and its actual blocking gate. | closed |
| 04-18-PLAN.md / T-04-29 | Repudiation | Owner maintenance and original stable finding accounting | high | mitigate | 18-01 preserves both whole ownership checkpoints/security promises;18-02 proves comment-only behavior identity;18-03 preserves every complete control;19 alone supplies full independent closure and D-03. | closed |
| 04-18-PLAN.md / T-04-SC | Tampering | Package installation | high | mitigate | No install; a new dependency requires research legitimacy audit and its applicable blocking human gate first. | closed |
| 04-19-PLAN.md / T-04-30 | Tampering | Configured remaining catalogue/assertion control | high | mitigate | 19-01 literal whole sixteen-name expectation, explicit ignored subtype, configured-only sibling-loss intended failure and complete exact restoration before GREEN. | closed |
| 04-19-PLAN.md / T-04-31 | Repudiation | Whole correction3/native provenance/global stop | high | mitigate | 19-02 full current inventory/books/headers/callers, current owner/direct/native histories and exact independent sets; parent FIRST D-03 before every follow-on action. | closed |
| 04-19-PLAN.md / T-04-SC | Tampering | Package installation | high | mitigate | No install; any newly required dependency returns to legitimacy research and its applicable blocking human gate first. | closed |

## Observed Mitigation Index

The following judgments are retained from the exact audited current seal; they do not erase historical process limits.

| ID | Observed scoped evidence |
| --- | --- |
| T-04-01 | Strict current AccessoryStore/Clock contracts, both-project compatibility and exact full PORTS closure; declaration coverage remains null. |
| T-04-02 | Actual complete PORTS scopes, stable IDs, nine cause path budgets, original normal hooks and immediate D03 stop/resolution are retained; historical capture windows are not retroactively repaired. |
| T-04-SC | No dependency install/upgrade or new parser/mock package was authorized or performed. Existing exact package/lock versions and normal secret hooks remain; any new need requires the existing legitimacy gate. |
| T-04-03 | Exact 1_999_999n→1 and 2_000_000n→2 conversion plus independent wall correction; no host-suspend experiment or cross-platform guarantee is invented. |
| T-04-04 | Whole timeout/interval/cancellation observations and later single-shot/early-callback controls protect actual native exports. |
| T-04-05 | Positive/negative compiler outcomes retain required cause/discriminant and one possibly delivered command attempt. |
| T-04-06 | Fixed exact per-kind failure streams, reminder boundaries, recovery and silent forget remain; real redactor owns synthetic registered-secret cases. |
| T-04-07 | Real public retry cases retain first/capped delays, one pending wait, reset and shared-root abort; suppressed child counts are not invented. |
| T-04-08 | All six complete POLICIES files and two exact independent rounds retain 13 accepted/closed IDs with no rejected/reopened IDs. |
| T-04-09 | Actual real temporary storage owner protects complete JSON bytes, invalid/nonfinite records, unknown keys, recovery, round-trip and ownership. Current two overflow cases preserve zero/finite neighbors. |
| T-04-10 | Current comments explicitly preserve scoped local persistence permission and unconfirmed opaque-key premise; synthetic evidence only. |
| T-04-21 | Actual trusted temporary-path supplier is limited to existing storage trust. wx protects occupied unowned bytes; only owned temporary files are removed and supplier throws enter existing failure boundary. TRUST017 narrow USER control is raw1, not a production pass. |
| T-04-11 | Independent complete two-device trust outcomes retain wall/elapsed separation, restored anchors, silence/recovery and narrow validity scope; no fabricated offline/default normal. |
| T-04-12 | Full TRUST correction includes original four files plus actual shared memory contract, consumed fake/real parity and named negative controls; 17 accepted/closed IDs, counter2. |
| T-04-13 | Current account source retains shared root abort, terminal guards after awaits, healthy neighbors, throttle and startup/stop ownership. All27 historical promises remain discriminating. |
| T-04-14 | Credential roles are registered before refresh/application; current real wrapper/delegate tests protect registered secrets and exact safe diagnostics. No private account input or broader local identity permission is introduced. |
| T-04-15 | Complete canonical state/trust checks preserve refused stale patches and REST/shadow authority. Replacement releases old readiness/watermark before new current connection becomes ready. |
| T-04-16 | Reappearance marks eligibility present; restored known IDs seed identity only. Two healthy omissions, a final healthy inventory and successful callback precede exact-device pruning. Failed callbacks retain eligibility. |
| T-04-17 | Actual pending command/root abort, literal complete outcomes/bodies/device identities, one attempt and unchanged canonical state retain official-control authority. |
| T-04-18 | All48 accepted ACCOUNT IDs independently closed at whole correction3; original13 and later16/18 scopes retain their actual formats and continuous counters. |
| T-04-19 | Actual canonical automated seal and history audits passed with required markers and raw0. All99 exact original commit/input/chronology and accepted-limit obligations are integrated. This does not complete RUN-01, actual E/P judgments, parent final gate, goal/security/Nyquist verification or waive WINDOWS46–58. |
| T-04-20 | All inspected records and owner inputs use synthetic data. Actual historical secret hooks and privacy caveats remain; parent will run normal hooks on the completed canonical records. |
| T-04-22 | Actual genuine030 two owner RED records, minimum fix and complete current replacement case prove live-path/watermark release and current-only ownership. |
| T-04-23 | USER supersession is authoritative: any synchronous registration throw is uncertain until restart, keyed by stable accessoryMap ownership; no automatic retry after absence/removal/store replacement. Normal return earns ownership; configureAccessory restoration is authoritative. Both identical-error positions and real redacted restart-required delegate diagnostics remain tested. No acceptance oracle, compensation or restart recovery guarantee. |
| T-04-24 | Current exact typed DiscoveryApi, original separate project impact evidence and actual031/026 whole public identity cases remain; no any/double cast or weakened API added. |
| T-04-25 | Logger-owned real redaction and platform composition/password registration remain. Incidental output suppression does not remove the actual security-result assertions; same-error registration cases still observe safe restart diagnostics. |
| T-04-26 | Configured TypeScript/ESLint binding rules and ten unpaired controls protect real factory/context/timer identity, preserve ESM impliedNodeFormat and reject only intended architecture mutations. No fictional production pair/coverage denominator. |
| T-04-27 | Inert construction observes the real injected userland HttpFetch port with exact empty expectations. Existing036 mock already caught043 control; no previously blind global-fetch claim or live vendor operation. |
| T-04-28 | Whole trust forwarding uses the named physical accessory, independent full per-device reports and recovery. Full ACCOUNT2 counter/sets and current3 retain actual immediate D03 checks. |
| T-04-29 | Both uncertain-registration checkpoints are captured before all assertions; exact expected rows/privacy promises remain. Comment-only047 significant tokens/AST identity and all ten flattened architecture controls retain behavior. |
| T-04-30 | Configured catalogue independently expects all16 remaining service names plus explicit ignored subtype. Named control yields15 when only Backup Pump Fault is suppressed and Primary remains. All44 source bodies/modes and3 literal links restored before fresh GREEN; no genuine RED JSON bug claim. |
| T-04-31 | Actual latest full review covers18 current paths, headers, complete five books/callers and all original48 closures; final opening=fixed5, rejected/new/reopened/closing0 and counter2→3 exactly once. Parent first D03 allfalse precedes gate. A fourth whole correction would stop immediately. |

The T-04-19/T-04-20 snapshot predates the subsequent parent gate and normal metadata commit. Those later operations now have the native passing evidence above. Human judgments and phase advancement remain separate.

## Accepted Historical Limits

The actual maintainer selected option 1 after the exact three limits were presented. Acceptance applies only to these commits and facts. The two unknown audit exits remain null. A present-day audit is not historical evidence, and no other or future exception follows.

| Risk | Threat | Exact commit | Preserved fact | Accepted by | Date |
| --- | --- | --- | --- | --- | --- |
| H-04-01 | T-04-19 | ce3305e8ce53f92e5e4e24a12e1694e95ced4489 | Original pass JSON exists; the audit subprocess exit remains null. | Maintainer, actual option-1 reply | 2026-10-16 |
| H-04-02 | T-04-19 | 5987504236d4292d05cb3b1c50ac4a4ce1197a9f | Original pass JSON exists; the audit subprocess exit remains null. | Maintainer, actual option-1 reply | 2026-10-16 |
| H-04-03 | T-04-19 | 84fd96017082503acc897521f2d458e82297266f | The exact owner-title wording changed after its sole retained audit; no later audit is claimed. | Maintainer, actual option-1 reply | 2026-10-16 |

## Historical and Human Limits

WINDOWS46–58 remain OPEN/unwaived. Missing historical captures, pre-edit traces, timing or process-order evidence are not recreated by current passes. These remain separate process dispositions, not silently closed code findings. PORTS round2 retains its actual stop and bounded continuation. ACCOUNT stays at correction3; a fourth whole correction still stops under D-03.

E-04-01 and P-04-01/P-04-02 remain pending. The equations remain edges1=lifted0+flagged1 and prohibitions2=authored2+omitted0. This report does not supply exhaustive taxonomy, an enforcement descriptor, new vendor meaning, hardware evidence or release approval. RUN-01 remains Pending.

## Security Audit Trail

| Date | Distinct threats | Current qualified rows | Closed | Blocking open | Method |
| --- | ---: | ---: | ---: | ---: | --- |
| 2026-10-16 | 32 | 58 | 58 | 0 | Authored register, L1 scoped mitigation presence with exact current reviewed inputs |

## Sign-Off

- [x] Every current plan-qualified threat retains a disposition and scoped observed mitigation.
- [x] All three accepted historical audit limits are exact and explicit.
- [x] No other historical process exception is waived.
- [x] threats_open is zero at the configured high threshold.
- [x] status is verified at ASVS L1 presence depth.

Approval: verified 2026-10-16 for the stated security scope. Phase/human completion remains pending.
