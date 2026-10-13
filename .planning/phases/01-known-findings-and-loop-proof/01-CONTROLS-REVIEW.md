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
| SC-02 | SPOT-02 | Unit-test assertions and data-driven cases | `test/accessories/controls.test.ts:591-623` | BLOCKER | Accepted; repair in progress |

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

Restoration verified the exact source blob above and an empty source diff.
`npm run build:test && node --test --test-reporter=tap dist-test/test/accessories/controls.test.js`
exited 0 with 57/57 passing tests. Isolated compiled pair coverage exited 0
and required 100% line/function/branch coverage. Restoration was verified
by 2026-10-13T20:10:11Z. No mutation was staged or committed.

## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.
