---
phase: 04-runtime-conformance
reviewed: 2026-10-23T02:37:12Z
depth: deep
method: current-source-advisory-review
review_base: cda29908927ef5dbfddcbe31e31e65ba95aa01e8
current_reference: a18d3141fd7aceab702d04c2bc482e8e7ed7512b
files_reviewed: 13
files_reviewed_list:
  - eslint.config.js
  - src/accessories/reconciliation.ts
  - src/logging.ts
  - src/platform.ts
  - src/runtime/accountRuntime.ts
  - src/runtime/arrivalAnchors.ts
  - src/runtime/failureLog.ts
  - test/accessories/reconciliation.test.ts
  - test/logging.test.ts
  - test/platform.test.ts
  - test/runtime/accountRuntime.test.ts
  - test/runtime/arrivalAnchors.test.ts
  - test/runtime/failureLog.test.ts
findings:
  critical: 2
  warning: 0
  info: 0
  total: 2
status: issues_found
status_scope: current-changes-only
historical_findings:
  accepted: 87
  fixed_at_prior_reference: 87
  reopened_by_this_review: 0
correction_counters:
  PORTS: 3
  POLICIES: 2
  TRUST: 2
  ACCOUNT: 3
---

# Phase 04: Code Review Report

**Reviewed:** 2026-10-23T02:37:12Z
**Depth:** Deep
**Files reviewed:** 13
**Status:** Issues found

## Summary

This advisory review covers the thirteen source and owner paths changed from
`cda29908927ef5dbfddcbe31e31e65ba95aa01e8` to
`a18d3141fd7aceab702d04c2bc482e8e7ed7512b`. It inspects the current
implementation and its cross-module callers, including canonical state,
monitoring health, Homebridge persistence, and the restored-accessory marking
passes. The four original full-batch reviews are historical evidence. Their 87
accepted findings remain recorded as fixed at the earlier reference; the two
findings below are new current-scope observations, not renamed historical IDs
or another correction round.

The previous full `npm run check` evidence belongs to the earlier source tree.
No current full gate or direct-coverage result was run by this read-only reviewer.

## Narrative Findings (AI reviewer)

### Critical issues

#### CR-04-ADVISORY-001 — BLOCKER: JSON-escaped registered secrets leak through Error parameters

**File:** `src/logging.ts:134-141`
**Issue:** The object branch adds JSON-escaped forms of registered secrets before
redaction, but the `Error` branch scans only the raw forms. An error message
containing a serialized response can contain an escaped quote or backslash in a
registered password. The exact raw value is then absent, while the escaped
value reaches the Homebridge delegate. This violates the credential-free log
boundary. The current `test/logging.test.ts:179-193` covers the escaped form in
an object, and `:195-209` covers only an unescaped secret in an Error.

**Evidence:** A read-only invocation of the current compiled logger with a
synthetic registered secret containing a quote and an Error whose message holds
its JSON-serialized form returned `escapedSecretPresent: true` and
`redactionPresent: false` from the delegate's captured parameter. The compiled
branch matches the cited source.

**Fix:** Generate raw and JSON-escaped secret variants inside `redactText`, so
every string route, including a message and an Error parameter, uses the same
redaction set. Add an owner case that passes a serialized secret-bearing Error
and compares the whole delegated call to a redacted expectation.

#### CR-04-ADVISORY-002 — BLOCKER: overlap regression can pass without write ordering

**File:** `test/runtime/arrivalAnchors.test.ts:338-359`
**Issue:** The test releases the older blocked rename after either the newer
rename finishes or a real 100 ms timer fires. If filesystem scheduling delays
the newer write past that timer, an implementation that permits overlapping
writes can rename the older file first and the newer file second. The final
file then matches the expected bytes, so the wrong implementation passes.
This is the new case intended to guard the ordering added in
`src/runtime/arrivalAnchors.ts:174-207`; a time-dependent escape defeats that
assertion and makes the test unreliable on slow hosts.

**Fix:** Control both filesystem operations with explicit test barriers and
assert the observed operation order. Do not use a real-time deadline as the
condition for releasing the older rename. Prove the test fails against a
non-serialized writer before accepting it as an ordering regression.

## Scope and limits

The scope includes the logging and platform integrations added after the
original Phase 4 batch reviews. It does not certify untouched runtime pairs or
change any original PORTS, POLICIES, TRUST, or ACCOUNT finding disposition.
No source, test, feature, or other phase artifact was changed in this review.
The applicable Phase 4 human judgments and RUN-01 remain outside this advisory
code review.

---

_Reviewer: gsd-code-reviewer_
_Depth: deep_
