---
phase: 02-cloud-conformance
fixed_at: 2026-10-14T13:34:20Z
review_path: .planning/phases/02-cloud-conformance/02-REVIEW.md
iteration: 1
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
---

# Phase 2: Code Review Fix Report

**Fixed at:** 2026-10-14T13:34:20Z
**Source review:** .planning/phases/02-cloud-conformance/02-REVIEW.md
**Iteration:** 1 for the new whole-phase cause; API correction round 3 remains pending.
**Fixer:** /root/phase2_routing_fix, gsd-code-fixer.

**Summary:**

- Findings in scope: 1, CR-02-API-017 only.
- Fixed: 1.
- Skipped: 0.
- Independent correction review and the combined full gate remain parent-owned.

## Fixed Issues

### CR-02-API-017: Dot-only identifiers escape the declared device route

**Status:** fixed: requires human verification.
**Files modified:** src/cloud/api.ts; test/cloud/api.test.ts.
**Commit:** b8b660a71f5970fbeee8579c97f8b70c6af60926.
**Evidence-only commit:** 6839060feeb37382f0af7e700e3d060f1ca76d22.
**Applied fix:** The private devicePath helper refuses exactly the complete
identifiers `.` and `..` before token acquisition or HTTP dispatch. Its message
is fixed: `Device identifier cannot be used in a request path.` Both public
implementations are async, so this refusal returns a rejected promise rather
than throwing synchronously. The directly inaccurate helper comment now
describes refusal and ordinary percent encoding.

Native TypeError describes a locally unusable argument. CloudRequestError
requires a numeric HTTP status; no HTTP request exists for this refusal. No
status, raw identifier, URL, cause or new public error type was introduced.
Public interfaces, ordinary percent encoding, physical identity, wire guards,
auth-inclusive deadlines, no-retry commands and prior error/cancellation fixes
remain unchanged. No vendor format rule, double encoding, package, helper or
unrelated cleanup was added.

Four active independent public regressions assert TypeError and its complete
fixed name/message/cause fields, then require an empty authentication/HTTP
interaction record. Each operation returns its promise before assert.rejects,
so a synchronous throw fails the case. The injected boundaries supply valid
token/device/command responses if called; RED therefore fails the intended
missing-rejection assertion instead of a transport or setup failure. Existing
ordinary-ID routes and percent-encoding cases remain active and pass.

## Caller and Scope Evidence

The complete source and paired owner were read before edits, together with
AGENTS, the review workflow, context D-01 through D-07, protocols, original
plans/summaries, API report/RED record, research/patterns and all five required
TypeScript/test/local-verification rulebooks. The existing feature worktree
and features/code-review-sweep branch were retained, isolation none.

Exact Fallow type-aware impact for src/cloud/api.ts:CloudApi against
tsconfig.test.json returned exit 0, complete/high-confidence evidence. Direct
type consumers are src/runtime/accountRuntime.ts and
test/runtime/accountRuntime.test.ts. CloudApi is an interface, so the earlier
CloudApi.sendCommand class-method probe returned exit 2 unknown-symbol; that
probe supplies no consumer proof. No exported signature changed.

Actual source call searches show sendCommand at accountRuntime.ts:1097. Its
await is inside a catch at 1099-1101; commandFailureOf at 237-242 maps every
non-timeout rejection to vendor-error. No production single-device read caller
was found. The owner tests call device through its public promise contract.
CloudRequestError at errors.ts:18-27 requires a status; discovery diagnostics
at accountRuntime.ts:273-279 keep unrelated error text out of logs. Parent
confirmed the native TypeError and promise behavior before implementation.

Only the API source/test, existing API RED JSON and this uncommitted report
were edited. Parent retains REVIEW, dispositions, central ledger, security,
validation, state/roadmap/requirements and independent review ownership.

## RED Provenance and Patch Correspondence

Source commit: b66f7256f242f5c8cad405b4946ce6ab2be66885.
Unchanged production blob: c3c11843113f897de2c8e4d2973ed35b475ab381.
Original owner blob: 5f2556f36954e6933f3459668bee51c35aeed44f.

Fresh npm run build:test exited 0. Native command:
node --test --test-reporter=tap dist-test/test/cloud/api.test.js.
Authoritative RED exited 1: 37 executed,33 passed,4 intended
ERR_ASSERTION Missing expected rejection failures,0 skipped/cancelled/todo.
Each target executed exactly once:

- rejects device read identifier "." before authentication or HTTP
- rejects command identifier "." before authentication or HTTP
- rejects device read identifier ".." before authentication or HTTP
- rejects command identifier ".." before authentication or HTTP

Complete native TAP/stderr, actual command/exit, timestamps, Node version,
unchanged source/blobs, expected/actual, semantic assessment and full active
patch are committed in 02-API-RED-EVIDENCE.json. The CLI check
tdd-red-evidence returned RED_EVIDENCE_OK, exit 0. The same installed
classifier independently accepted each of the four target identities.

The earlier complete top-level record is preserved as priorEvidence[0],
including its complete priorEvidence record and assertionControls archive.
Deep equality against the original committed JSON was verified. No older
record/output/patch/control was dropped or replaced. Production remained
byte-identical through the evidence-only commit; actual objects and ancestry
prove source < evidence < fix. The evidence commit changed only the JSON.

For that planning-only commit, the owned test was temporarily restored to
its original committed bytes after retaining its complete active patch. The
four active regressions were reinstated after the evidence commit, followed
by the source fix. No failing test-only code, skipped regression, hidden
discovery mechanism or assertion-control mutation was committed.

An initial filtered RED run failed the same four rejection assertions. Two
lint-required blank separators were added before the authoritative fresh
37-case RED capture. The first GREEN foreground attempt later failed lint
on two additional missing blank separators before cloudApi construction.
It created no commit. Those two blank lines were corrected and checks
repeated. The committed GREEN test therefore has semantic correspondence
with the recorded RED patch, not byte-exact correspondence. The comparison
confirms that only those blank lines differ; assertions/setup stay identical.

## Verification and Commits

All checks ran in the existing code-review-sweep feature worktree, isolation
none, on Node v26.11.1. No new worktree/branch, install, private cache, live
vendor or hardware request was used. The owner includes its case-owned local
TLS server; authorized escalation supplied loopback/Git filesystem access.

| Command / scope | Actual outcome |
| --- | --- |
| GSD runtime identity, phase init, configured skills and execute:post capability | @opengsd/gsd-core 1.16.0; phase02 resolved; code-review active; runtime codex |
| Fallow guard over all four owned paths | Exit 0; no configured boundaries/rule packs, no architecture certification inferred |
| Fallow audit --base HEAD --format json --quiet --explain before commits | Pass; zero dead-code/complexity/duplication findings; native JSON retained under /private/tmp |
| npm run build:test | Exit 0 before RED and GREEN; successful normal hook rebuilt final committed inputs |
| Native API owner with strict module-only coverage, final committed inputs | Exit 0;37/37,0 skipped/cancelled/todo; all four new targets once |
| Fresh native API-only LCOV |159/159 lines,14/14 functions,31/31 branches;100% each |
| npm run test:coverage:direct -- src/cloud/api.ts test/cloud/api.test.ts | Exit 0 before initial commit and again on final b8b660a inputs |
| ESLint on source/test after final spacing correction | Exit 0 |
| SKIP=npm-check pre-commit run --files exact changed paths | Exit 0 for JSON evidence and source/test; source/test clean repeat after spacing correction |
| Ordinary evidence commit | Exit 0; all applicable hooks pass; no build inputs correctly select no npm-check work |
| First ordinary GREEN commit attempt | Exit 1; lint caught two blank separators; no commit created |
| Ordinary GREEN retry | Exit 0; all applicable hooks including check:commit and gitlint pass |
| Git objects/paths, archived record, four-target native GREEN and ancestry checks | Exit 0; exact owned scope, unchanged evidence production blob, all four targets once |

Native final command: node --test --experimental-test-coverage
--test-coverage-lines=100 --test-coverage-functions=100
--test-coverage-branches=100 --test-coverage-include=dist-test/src/cloud/api.js
--test-reporter=tap --test-reporter=lcov
--test-reporter-destination=/private/tmp/guardian-api017-green.tap
--test-reporter-destination=/private/tmp/guardian-api017-green.lcov
dist-test/test/cloud/api.test.js.

Native denominators come from that fresh API-only LCOV, not merged coverage.
Receipts: /private/tmp/guardian-api017-red-owner.json,
/private/tmp/guardian-api017-green-run.json,
/private/tmp/guardian-api017-direct-final.log and
/private/tmp/guardian-api017-{evidence,fix,fix-final}-audit.json.
Fallow's inherited cache-entry warning is diagnostic, not an introduced finding.

The full npm run check gate is pending with the parent. A passing focused
selector/check:commit does not claim the combined gate or CLOUD-01 completion.
No hook bypass, amend, rebase, stash or history rewrite occurred. This report
is intentionally uncommitted for the parent workflow.

## Review Handoff

This fixes the new cause 017; findings 001-016 remain closed. Earlier API rounds
remain 15→1 and 1→0. Next independent API correction review is round 3, also the first
correction review of the new whole-phase cause. The fixer performed no
independent re-review and claims no clean review seal. No stalled review,
reopened fixed finding or fourth-round trigger was observed during this work.
Round 4 still requires global pause even if clean. The parent owns that audit.

## Threat Flags

None -- no security-relevant surface outside the plan's <threat_model> was introduced.

---

_Fixer: gsd-code-fixer (/root/phase2_routing_fix)_
_Iteration: 1 for CR-02-API-017; independent API round 3 pending_
