# Controls review and assertion evidence

Scope: `test/accessories/controls.test.ts`; production controls are read-only
except a temporary, restored cause substitution. The coordinator owns the
central findings ledger and the full combined gate.

## Initial triage

Reviewer: independent `gsd-code-reviewer`, agent
`/root/phase1_controls/controls_review`. Revision:
`07424ba58513a8c8a7c757e5a69353cf1f8e9faf`. Node: v26.11.1.

| ID | Requirement | Rule | Location | Severity | Disposition |
| --- | --- | --- | --- | --- | --- |
| SC-02 | SPOT-02 | Unit-test assertions and data-driven cases | Original `test/accessories/controls.test.ts:591-623`; repaired `424-516,599-620` | BLOCKER | Fixed in `d023bbb`; independently re-reviewed |

The warning case reduces complete content to four substring booleans. An
offline refusal can name the unsupported-off cause while retaining status
`-70412` and every boolean. It also combines eight rows in one test. Global
line-count differences fail already; omissions compensated by another row's
extra output can pass. Each repaired row must compare its fresh warning array
with one independently written exact line.

No introduced findings were reported. Initial triage is not a convergence
round. Planned header compliance is tracked under PROC-03.

## Deferred seed warnings

These seed warnings have no assigned IDs. They stay with Phase 5:

- `SPOT-CHECK-FINDINGS.md:39`: whole-value check at the original test line 831.
- `SPOT-CHECK-FINDINGS.md:42`: entrypoint groups, fake-only case, hand-written
  spy, AAA marker, and Service assertions.
- `SPOT-CHECK-FINDINGS.md:46`: ordering comment attached to a source constant.

## Verification and commits

Fallow guard for the owned pair exited 0 and found no configured restrictions.
Fallow audit against `main` at the initial revision exited 0 with verdict pass.
The sandbox could not create the baseline temporary checkout; the permitted
run succeeded. This is an environment permission condition, not RED evidence.

## Header and tracer proof

Header commit: `2b08571202c2b1ea73b41808073d983ee8129835`,
`style(controls): add the approved test file header`. Inspection confirmed
only the owned test changed, with no deletions. Header compilation, 56 owner
tests, and isolated coverage passed. Required pre-commit and the enabled
foreground commit hook both exited 0.

Tracer title: `logs the exact refusal for a runtime with no way to reach the vendor`.
Test revision: header commit plus the active standalone tracer patch. Source
revision: `2b08571202c2b1ea73b41808073d983ee8129835`; the source blob
`1760d2c767d6286acd3b7145a1d3e85621315e62` is unchanged from initial triage.

Negative control: replace only the `hasNoCommandTransport` row's cause with
`the device is confirmed offline`. Both rows retain status `-70412`.
Command:

```sh
npm run build:test && node --test --test-reporter=tap --test-name-pattern='^logs the exact refusal for a runtime with no way to reach the vendor$' dist-test/test/accessories/controls.test.js
```

Node v26.11.1; captured on 2026-10-13. Compilation passed, Node exited 1,
and the intended whole-array assertion failed. This is assertion-strength
evidence from a temporary mutation, not an observed production bug.

Complete Node TAP (blank-line whitespace normalized by the required hook):

```text
TAP version 13
# Subtest: logs the exact refusal for a runtime with no way to reach the vendor
not ok 1 - logs the exact refusal for a runtime with no way to reach the vendor
  ---
  duration_ms: 2.449792
  type: 'test'
  location: '/Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/dist-test/test/accessories/controls.test.js:451:1'
  failureType: 'testCodeFailure'
  error: |-
    Expected values to be strictly deep-equal:
    + actual - expected

      [
    +   'Refused self-test on account-1_serial-1: the device is confirmed offline.'
    -   'Refused self-test on account-1_serial-1: the plugin has no way to reach the vendor right now.'
      ]

  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected:
    0: 'Refused self-test on account-1_serial-1: the plugin has no way to reach the vendor right now.'
  actual:
    0: 'Refused self-test on account-1_serial-1: the device is confirmed offline.'
  operator: 'deepStrictEqual'
  stack: |-
    TestContext.<anonymous> (file:///Users/acolomba/src/homebridge-basement-guardian-code-review-sweep/homebridge-basement-guardian/dist-test/test/accessories/controls.test.js:459:12)
    async Test.run (node:internal/test_runner/test:1409:7)
    async startSubtestAfterBootstrap (node:internal/test_runner/harness:387:3)
  ...
1..1
# tests 1
# suites 0
# pass 0
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 135.708375
```

Tracer commit: `906daa9647fc51273d46c3207dd16ddb3520a16c`,
`test(controls): prove exact unavailable transport warning`. Fallow audit
against `main` passed. Required pre-commit passed after its trailing-whitespace
fixer; the enabled foreground commit hook passed. Inspection confirmed only
the owned test and this review record changed, with no deletions.

Restoration verified the exact source blob above and an empty source diff.
`npm run build:test && node --test --test-reporter=tap dist-test/test/accessories/controls.test.js`
exited 0 with 57/57 passing tests. Isolated compiled pair coverage exited 0
and required 100% line/function/branch coverage. Restoration was verified
by 2026-10-13T20:10:11Z. No mutation was staged or committed.

The post-commit tracer feedback gate ran the plan's exact automated command,
`npm run build:test && node --test dist-test/test/accessories/controls.test.js`,
and exited 0 with 57/57 tests passing at `906daa9`. This automated-only gate
allowed expansion under the configured end-of-phase verification mode.

## Expansion verification and commit

Expansion commit: `d023bbb0381050abdab195e1f8abb94e6036c658`,
`test(controls): assert each exact refusal warning`. The patch preserves all
eight existing refusal rows and unrelated tests. Each row has an independently
authored complete line. Each sibling test creates new commands, service,
binder, timers, and warnings. Exact one-element array equality rejects wrong
causes, no warnings, empty warnings, and additional warnings. The transport
tracer's title remains in the generated cases.

The removed token/URL constants and comments became unused when the weak
boolean-summary case was replaced. The unrelated status loop remains.

At Node v26.11.1, against this exact code snapshot:

| Command or check | Exit | Evidence scope |
| --- | --- | --- |
| `npm run test:coverage:direct -- src/accessories/controls.ts test/accessories/controls.test.ts` | 0 | Isolated controls pair; 100% lines, functions, branches |
| `node --test dist-test/test/accessories/controls.test.js` | 0 | 63/63 owner tests, including eight named exact-log rows |
| `node --test dist-test/test/packaging/licenseHeaders.test.js` | 0 | 5/5 license classification tests |
| Required `SKIP=npm-check pre-commit run --files test/accessories/controls.test.ts` | 0 | Formatting, secrets, and applicable hooks |
| Fallow audit against `main` | 0 | Verdict pass; no new dead-code, complexity, or duplication findings |
| Enabled foreground `git commit` hook | 0 | Incremental `npm run check:commit` passed |
| Source blob and baseline source diff | 0 | Original blob retained; production controls unchanged |

Committed paths were inspected: the expansion changes only the owned test,
with no tracked file deletion. The coordinator supplies the combined-tree
`npm run check`; focused evidence does not establish that gate.

## Review rounds

Round 1 reviewer: independent `gsd-code-reviewer`, agent
`/root/phase1_controls/controls_review`. Reviewed revision:
`d023bbb0381050abdab195e1f8abb94e6036c658`. Diff: initial triage revision
`07424ba` through `d023bbb`, scoped to the owned test; the source/test pair
and mutation record were also inspected. The reviewer reused the exact-input
focused verification and hook evidence under local-verification rules.

| Round | Opening | Fixed | Rejected | New | Reopened | Closing |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 (SC-02) | 1 (SC-02) | 0 | 0 | 0 | 0 |

Closing = 1 - 1 - 0 + 0 + 0 = 0. The reviewer explicitly found no introduced
finding and no open finding in the triaged scope. No new controls IDs were
needed. The result was sent to the coordinator before any further work.
There was no stall, recurrence, or fourth-round cap; no maintainer pause was
triggered. Deferred seed warnings retain their Phase 5 ownership.

No genuine production bug was found in this batch, so the conditional
`01-CONTROLS-RED-EVIDENCE.json` was not created. The temporary mutation is
recorded separately above.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.
