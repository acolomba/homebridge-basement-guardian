---
status: resolved
trigger: "Phase 6 advisory finding CR-01: invalid restored pump numbers are treated as trustworthy"
created: 2026-10-19T18:33:26Z
updated: 2026-10-19T18:39:57Z
---

## Current Focus

hypothesis: Confirmed: a corrupt numeric cache passes the type-only restore guards and is resumed as trusted pump history.
test: All scoped debugger verification completed.
expecting: No invalid restored number is resumed; the first observation starts a fresh record and requests persistence.
bug_class: Bohrbug (deterministic corrupted-cache input)
reasoning_checkpoint:
  hypothesis: A corrupt cached numeric field is published or retained because the restore guards accept every value with typeof number.
  confirming_evidence:
    - Seven active numeric-domain owner cases fail against unchanged production at the whole-record assertion.
    - The negative-count case returns -2 with zero writes and no unreadable warning; out-of-range restored times and watermarks are also accepted.
  falsification_test: If a domain check rejects each invalid count and time but an owner case still resumes any bad value, the guard hypothesis is incomplete.
  fix_rationale: Validate restored counts as nonnegative safe integers and stored times as finite values within the ECMAScript Date range, with seconds scaled before comparison; resumedRecord already resets the whole record when any guard fails.
  blind_spots: Synthetic contexts prove restore behavior but do not run a real Homebridge host; malformed values arriving in new decoded observations are outside this restored-cache defect.
  candidate_causes:
    - 'code: type-only guards in pumpRecords.ts omit numeric-domain checks'
    - 'data: a malformed cached count or timestamp provides the triggering input'
    - 'environment: Node or Homebridge conversion behavior; contradicted by deterministic direct owner reproduction before any projection'
  and_gate: 'yes: the invalid stored value and permissive restore guard must coexist for this symptom; the fix makes the boundary reject that data'
next_action: Archive this resolved record, append its prevention entry to the debug knowledge base, and commit those planning files.

## Symptoms

expected: Restored pump activation counts and timestamps are validated before use. Corrupt values cannot appear as trustworthy HomeKit history or crash ISO formatting.
actual: A negative activation count is restored unchanged and a 1e308 timestamp can throw during basement guardian projection.
errors: RangeError can occur when an out-of-range timestamp reaches Date.toISOString().
reproduction: Restore synthetic records with activationCount -2 or a fractional count, or lastActivationAt 1e308; exercise pump record ownership and projection behavior.
started: Identified by Phase 6 advisory review CR-01 on 2026-10-19; no prior valid behavior for corrupt records is established.

## Eliminated

## Evidence

- timestamp: 2026-10-19T18:34:00Z
  checked: Phase 06 review CR-01 and the pump record restore path
  found: isPumpObservation tests stored times and count with typeof number; isActivationWatermarks permits any numeric watermark. resumedRecord resumes the whole record when these guards pass.
  implication: A corrupt numeric cache can bypass restoration rejection and flow into HomeKit projection.
- timestamp: 2026-10-19T18:34:00Z
  checked: recordProjectionOf caller and existing owner tests
  found: recordProjectionOf formats restored times as ISO dates; the DAMAGED_RECORDS table tests wrong types but no invalid numeric domains.
  implication: A synthetic owner test can reproduce the exact restored-record fault and distinguish fresh-epoch reset from continued use.
- timestamp: 2026-10-19T18:34:45Z
  checked: npm run build:test and node --test dist-test/test/accessories/pumpRecords.test.js against unchanged src/accessories/pumpRecords.ts
  found: Build passed; 46 of 53 owner cases passed and seven newly added numeric-domain cases failed at the intended whole-record assertion. The negative count remained -2, with no warning or persistence; invalid times and watermarks were likewise resumed.
  implication: Reproduction is deterministic and supports the guard defect, not a test setup or environment failure.
- timestamp: 2026-10-19T18:35:00Z
  checked: Named TAP RED run, GSD RED evidence validator, and planning-only commit
  found: The named negative-count case failed with exit 1; validator returned RED_EVIDENCE_OK; commit 03db78f contains only 06-PUMP-RECORDS-RED-EVIDENCE.json and passed normal hooks.
  implication: Phase 6 BUG-01 RED provenance is preserved before source change.
- timestamp: 2026-10-19T18:36:00Z
  checked: Focused owner module and direct coverage after the guard change
  found: All 53 owner cases pass, including seven numeric-domain regressions; pumpRecords direct coverage exits 0.
  implication: The guard rejects the reproduced invalid records without disturbing existing owner behavior; immediate date boundaries remain to be checked.
- timestamp: 2026-10-19T18:37:00Z
  checked: Owner direct coverage after adding the last-valid and immediately-invalid date boundary cases
  found: The direct pair exits 0 with all 56 owner tests and required line, function, and branch coverage.
  implication: The guard accepts the inclusive Date limit and rejects the next millisecond and next device second.
- timestamp: 2026-10-19T18:38:00Z
  checked: Revert-and-reconfirm, adjacent owners, mutation tool availability, and pre-commit fixers
  found: Restoring committed source made the named case fail with -2; restoring the fixed source made it pass. BasementGuardian owner passed 149/149; platform owner passed 76/76 outside the sandbox after its filesystem watcher hit EMFILE inside the sandbox. No Stryker is configured. Pre-commit formatters completed, and the formatted pumpRecords pair passes direct coverage.
  implication: The repair causes the observed behavior change and leaves adjacent runtime paths working; mutation checking degrades to a logged skip.
- timestamp: 2026-10-19T18:39:57Z
  checked: Final Fallow audit and hooked GREEN commit
  found: Fallow new-only audit passed with no introduced findings; commit 68114f4 contains only pumpRecords source and owner test, and the normal hook passed check:commit. Parent is coordinating the combined full gate for Phase 6, so this owner did not start an overlapping full check.
  implication: CR-01 is self-verified by synthetic owner behavior and adjacent suites; normal repository commit checks pass.

## Resolution

root_cause: A malformed cached numeric count or timestamp passes the type-only restore guards, allowing resumedRecord to expose invalid persisted pump history as trusted state.
fix: Replaced type-only restore checks with nonnegative safe-integer count validation and finite Date-range checks for stored millisecond times and device-second watermarks. Any failure uses the existing whole-record reset at the first observation.
verification:
  target_test: { result: pass, named_test: 'starts observation again and says so once for a pump record with a negative count' }
  mutation_check: { result: skipped, reason_if_skipped: 'Stryker is absent from package.json and package-lock.json' }
  no_op_deletion: { result: pass, deletion_justified_by_rca: false }
  adjacent_tests: { result: pass, suites_run: ['basementGuardian owner 149/149', 'platform owner 76/76 outside the sandbox'] }
  revert_and_reconfirm: { result: pass, bug_returned_on_revert: true, fixed_on_reapply: true }
  guardrail_verdict: accepted
  direct_coverage: pass
  fallow_audit: pass on formatted final diff with zero introduced findings
  normal_hooks: pass on RED evidence commit 03db78f and GREEN fix commit 68114f4 (including check:commit)
  combined_full_check: delegated to Phase 6 parent to avoid overlapping builds
files_changed: [src/accessories/pumpRecords.ts, test/accessories/pumpRecords.test.ts]

## Prevention

branches:
  code: The restoration checks narrowed JSON members by numeric type but did not check whether the count or date could be published safely.
  data: A persisted context can contain a malformed numeric value, including a negative count or a number outside Date range.
  environment: The owner reproduction uses synthetic contexts and is deterministic; Node or Homebridge version did not cause it.
why_not_caught: The owner test suite covered malformed field types but omitted invalid numeric domains, so the existing full test gate passed without exercising this restored-cache path.
recurrence_guard: The active DAMAGED_RECORDS owner rows in test/accessories/pumpRecords.test.ts now cover negative, fractional, unsafe counts and invalid timestamps; the exact Date boundary has a separate acceptance test.
commits:
  red_evidence: 03db78f3f1ef7a7df88b8dedf9d392fb0f901c91
  green_fix: 68114f400d76e744f403268f9eeda1a56df9b6c4
