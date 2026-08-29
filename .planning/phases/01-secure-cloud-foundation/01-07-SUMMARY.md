---
phase: 01-secure-cloud-foundation
plan: 07
subsystem: cloud-transport
tags: [aws-sigv4, aws-iot, mqtt, presigned-url, backoff, abort-signal, node-crypto, tdd]

requires:
  - phase: "01-02"
    provides: "src/runtime/clock.ts, the injected time source every scheduling module takes"
  - phase: "01-03"
    provides: ".fallowrc.json ignoreFindings, seeded with the eight scaffold paths in the declared order"
  - phase: "01-06"
    provides: "src/cloud/types.ts AwsCredentials, the vendor credential shape the signer is fed from"
provides:
  - "`presignIotWebsocketUrl`, a pure credentials-plus-clock to URL function pinned by an independently computed vector"
  - "`PresignInput` and `IOT_SERVICE_NAME`, the signer's published contract"
  - "The AWS IoT signing variant proven directly: the security token sits outside the signed query string"
  - "`createRetryPolicy`, capped backoff with a re-entrancy guard and an abortable wait"
  - "`RetryPolicy`, `RetryPolicyOptions`, and `MAX_BACKOFF_MS`"
  - "Two transitional `.fallowrc.json` ignoreFindings entries, both measured to suppress a real finding"
affects: [01-09, 01-10, 01-11, shadow-client, mqtt-transport, account-runtime]

actuals:
  tokens: 4400
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - "The one hand-rolled cryptographic surface is a pure function of its input, so a golden vector pins it completely"
    - "The canonicalization is ours; HMAC-SHA256 and SHA-256 come from the platform library"
    - "A golden-vector test writes the canonical request out as a literal, so the expectation inherits nothing from production"
    - "Reconnect timing lives in the consumer, not in the transport client whose own reconnect period is uncapped"
    - "A pending guard cleared in a `finally` turns one transport failure's two notifications into one retry"
    - "Every wait ends on the shared root signal, so shutdown leaves no timer holding the process open"
    - "A builtin timer is imported as a default so the property lookup happens at call time and the test runner's mocks reach it"

key-files:
  created:
    - src/cloud/sigv4.ts
    - src/runtime/retryPolicy.ts
    - test/cloud/sigv4.test.ts
    - test/runtime/retryPolicy.test.ts
  modified:
    - .fallowrc.json

key-decisions:
  - "The transport checkpoint (D-05) was resolved before execution: the user selected `mqtt-own-sigv4`, the general-purpose MQTT client with an in-house SigV4 presigner"
  - "`clock` was left out of `RetryPolicyOptions`: the module reads no time, and the phase already omits an unused option rather than shipping one"
  - "The module headers name the wiring commit rather than a plan number, because the repository comment policy forbids planning-artifact references in source comments"
  - "`node:timers/promises` is imported as a default, because the named ESM export of a builtin is a snapshot binding the test runner's timer mocks cannot replace"
  - "Backoff sensitivity is asserted against the independently computed baseline signature, not against a second production call"

patterns-established:
  - "Golden-vector signing test: literal canonical request, inline four-step HMAC chain, whole-string comparison"
  - "Sensitivity rows that compare the extracted signature against an independently derived baseline rather than against another production output"
  - "A session-token-only variation that compares the whole URL, which proves both the unchanged signature and the changed parameter in one assertion"
  - "A real `setImmediate` turn drains the microtask chain behind a faked `setTimeout`, so no case counts microtask turns"
  - "Retried work supplied by a small counted-work factory, which keeps three cases from becoming identical closures"

requirements-completed: [SYNC-04, SYNC-05]

coverage:
  - id: D1
    description: "The AWS IoT WebSocket URL is signed in house from temporary credentials plus a clock, and the same input produces byte-identical output on every call"
    requirement: SYNC-04
    verification:
      - kind: unit
        ref: "test/cloud/sigv4.test.ts#signs the canonical request the AWS IoT variant defines"
        status: pass
      - kind: unit
        ref: "test/cloud/sigv4.test.ts#produces a byte-identical string for two calls with the same input"
        status: pass
    human_judgment: false
  - id: D2
    description: "The session token is appended after the signature and is not part of the signed query string, which is the AWS IoT signing variant"
    requirement: SYNC-04
    verification:
      - kind: unit
        ref: "test/cloud/sigv4.test.ts#leaves the signature untouched when only the session token changes"
        status: pass
      - kind: unit
        ref: "test/cloud/sigv4.test.ts#percent-encodes a session token that carries reserved characters"
        status: pass
    human_judgment: false
  - id: D3
    description: "The signature covers the secret, the region, the host, and the signing instant, so a defect in any of them fails the handshake rather than degrading silently"
    requirement: SYNC-04
    verification:
      - kind: unit
        ref: "test/cloud/sigv4.test.ts#produces a different signature for a different secret access key"
        status: pass
      - kind: unit
        ref: "test/cloud/sigv4.test.ts#produces a different signature for a different region"
        status: pass
      - kind: unit
        ref: "test/cloud/sigv4.test.ts#produces a different signature for a different host"
        status: pass
      - kind: unit
        ref: "test/cloud/sigv4.test.ts#produces a different signature for a clock one second later"
        status: pass
    human_judgment: false
  - id: D4
    description: "Reconnect backoff is capped, so a long outage cannot push the next attempt days away"
    requirement: SYNC-04
    verification:
      - kind: unit
        ref: "test/runtime/retryPolicy.test.ts#waits 500 ms before attempt 1"
        status: pass
      - kind: unit
        ref: "test/runtime/retryPolicy.test.ts#waits 30000 ms before attempt 7"
        status: pass
      - kind: unit
        ref: "test/runtime/retryPolicy.test.ts#waits 30000 ms before attempt 20"
        status: pass
    human_judgment: false
  - id: D5
    description: "A duplicate failure notification produces one retry, because both the error and the close notifications fire for a single transport failure"
    requirement: SYNC-04
    verification:
      - kind: unit
        ref: "test/runtime/retryPolicy.test.ts#runs the work once when an error and a close notification both ask for a retry"
        status: pass
      - kind: unit
        ref: "test/runtime/retryPolicy.test.ts#runs the work again for a failure that arrives after the previous retry finished"
        status: pass
    human_judgment: false
  - id: D6
    description: "Every retry wait is abortable through the shared root signal and leaks no timer when a shutdown interrupts it"
    requirement: SYNC-05
    verification:
      - kind: unit
        ref: "test/runtime/retryPolicy.test.ts#leaves the work uninvoked when a shutdown aborts a pending wait"
        status: pass
      - kind: unit
        ref: "test/runtime/retryPolicy.test.ts#keeps a rejection from the work inside the policy"
        status: pass
    human_judgment: false
  - id: D7
    description: "A successful attempt resets the backoff, so a later isolated failure retries quickly rather than at the previous cap"
    requirement: SYNC-04
    verification:
      - kind: unit
        ref: "test/runtime/retryPolicy.test.ts#restores the first delay after a successful attempt resets it"
        status: pass
    human_judgment: false
  - id: D8
    description: "Both modules are parked in the .fallowrc.json ignoreFindings list with a module-header note, and each entry suppresses a real finding"
    verification:
      - kind: other
        ref: "node -e ignoreFindings assertion from the plan (exit 0)"
        status: pass
      - kind: other
        ref: "npm run fallow (dead-code, health, dupes, all --fail-on-issues)"
        status: pass
    human_judgment: false
  - id: D9
    description: "The signed URL never reaches a log or an error message, since it carries the credential scope, the session token, and the signature"
    requirement: SYNC-04
    verification: []
    human_judgment: true
    rationale: "An absence of logging cannot be asserted from the module's own tests; it is a reading of the source, re-checkable at the phase seal."

duration: 25 min
completed: 2026-08-28
status: complete
---

# Phase 1 Plan 07: AWS IoT URL Signer and Retry Policy Summary

**A pure `node:crypto` SigV4 presigner for `iotdevicegateway`, pinned by an independently computed golden vector, plus a capped, guarded, abortable reconnect policy.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-08-29T01:19:00Z
- **Completed:** 2026-08-29T01:44:00Z
- **Tasks:** 2
- **Files modified:** 5

## Checkpoint Resolution

The plan opens with a `checkpoint:decision` on `D-05`, rated one-way. It was resolved before
execution began: the orchestrator presented the three options with the research context and the user
selected **`mqtt-own-sigv4`** — the general-purpose MQTT client with an in-house SigV4 presigner,
which is the research recommendation. The checkpoint was not re-asked.

The repository already assumes that outcome. `package.json` lists `mqtt` as the only runtime
dependency, and the Cucumber fake broker is MQTT-over-WebSocket on `aedes` plus `ws`.

## Accomplishments

- `presignIotWebsocketUrl` produces the presigned broker URL from temporary credentials and an
  injected instant. It reads no clock, logs nothing, and never places the URL into an error, because
  the URL carries the credential scope, the session token, and the signature.
- The golden-vector case compares the complete produced string against a signature the test computes
  with its own four-step HMAC chain over a canonical request written out as a literal. Production and
  test agreed on the first run, which is the evidence that the canonicalization is right rather than
  merely self-consistent.
- The AWS IoT signing variant is asserted directly. Changing only the session token leaves the
  signature untouched and changes only the trailing security-token parameter. A signer that folded
  the token into the canonical query string would pass every other case and fail this one.
- `createRetryPolicy` caps the wait at the configured ceiling, pinned row by row from 500 ms through
  the cap and again at attempt 20. Two schedule calls before the wait elapses run the work once. An
  abort of the shared signal skips the work, clears the guard, and raises nothing.
- Both new modules are parked in `.fallowrc.json` `ignoreFindings`, and each entry was measured to
  suppress a real finding rather than being added on faith. See "Issues Encountered".

## Task Commits

1. **Task 1: Sign the AWS IoT WebSocket URL deterministically**
   - `db28107` (test) — failing cases plus the compiling skeleton and the ignore entry
   - `18a2404` (feat) — the canonicalization, the HMAC chain, and the token placement
2. **Task 2: Cap the reconnect backoff and make a duplicate failure produce one retry**
   - `06d3bda` (test) — failing cases plus the compiling skeleton and the ignore entry
   - `32cfa5b` (feat) — capped delay, pending guard, abortable wait

No refactor commit was needed for either task.

## Files Created/Modified

- `src/cloud/sigv4.ts` — The presigner, `PresignInput`, and `IOT_SERVICE_NAME`. Pure; no clock read,
  no logger, no error carrying the URL.
- `src/runtime/retryPolicy.ts` — `createRetryPolicy`, `RetryPolicy`, `RetryPolicyOptions`, and
  `MAX_BACKOFF_MS`.
- `test/cloud/sigv4.test.ts` — Nine cases: the golden vector, determinism, the injected scheme, four
  sensitivity rows, and two session-token cases.
- `test/runtime/retryPolicy.test.ts` — Fifteen cases: nine backoff-table rows plus reset, the
  duplicate-notification guard, the pending report, re-scheduling after completion, the abort, and
  the rejecting work.
- `.fallowrc.json` — Two transitional `ignoreFindings` entries appended after the eight scaffolds.
  `ignoreDependencies` and `ignorePatterns` untouched.

## Decisions Made

- **`clock` is not part of `RetryPolicyOptions`.** The module reads no time; it waits on a timer and
  counts attempts. Shipping a required option no code reads would force every future consumer to
  supply a dependency for nothing. Plan 01-06 already set this precedent in the other direction by
  omitting `log` from `CloudApiOptions` because that module logs nothing. See "Deviations".
- **`node:timers/promises` is imported as a default rather than by name.** Measured, not assumed: a
  named ESM import of a Node builtin is a snapshot binding, so `t.mock.timers.enable({ apis:
  ['setTimeout'] })` cannot reach it and the wait would only be testable by awaiting a real timer,
  which the unit-testing rule forbids. A namespace import fails the same way. The default import is
  the property-lookup form the Node test-runner documentation itself uses. The reason is recorded in
  the module header.
- **Sensitivity cases assert against the independently derived baseline signature**, not against a
  second production call, so a signer that ignores the secret fails rather than being compared with
  itself.
- **The session-token case compares the whole URL** rather than a parsed field, which proves the
  unchanged signature and the changed parameter in one assertion.
- **The synthetic credential values are not any published example pair.** They are plain
  `test-`-prefixed strings, deliberately outside the `AKIA`/`ASIA` access-key shape, so the secret
  scanner reports neither a verified nor an unverified finding.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The module-header note names the wiring commit, not "plan 10"**

- **Found during:** Task 1
- **Issue:** The plan's acceptance criterion asks each module header to name plan 10 as the plan that
  removes the ignore entry. `.claude/rules/typescript-comments.md` forbids `Plan NN` references in
  source comments; git history owns process history. A repository rule outranks the plan.
- **Fix:** Each header states the same fact by its condition instead: the entry and the note are
  removed together, in the commit that wires the shadow client into the account runtime and makes
  the module reachable from the entry point. Plan 10's own check is a removal check, so it is
  unaffected.
- **Files modified:** `src/cloud/sigv4.ts`, `src/runtime/retryPolicy.ts`
- **Verification:** `pre-commit run --files ...` clean; the note is present and names no planning
  artifact.
- **Committed in:** `db28107`, `06d3bda`

**2. [Rule 2 - Missing Critical] `clock` omitted from `RetryPolicyOptions`**

- **Found during:** Task 2
- **Issue:** The plan's `<interfaces>` block declares `clock: Clock` on `RetryPolicyOptions`, but the
  module has nothing to read a clock for. It waits on `node:timers/promises` and counts attempts.
- **Fix:** The option was left out. `CLAUDE.md` is explicit that speculative parameters are a defect
  ("No features beyond what was asked", "no flexibility that wasn't requested"), and plan 01-06 made
  the same call by omitting `log` from `CloudApiOptions`.
- **Impact on plan 10:** the composition root constructs the policy with `{ signal, maxDelayMs, log }`.
  Passing a `clock` is a compile error, which surfaces loudly rather than silently.
- **Files modified:** `src/runtime/retryPolicy.ts`
- **Verification:** `npm run typecheck` clean; the pair reports 100 percent coverage with no
  unreachable option.
- **Committed in:** `06d3bda`

**3. [Rule 3 - Blocking] The default timer import replaced the named one**

- **Found during:** Task 2
- **Issue:** The plan mandates the context's fake timers and forbids awaiting a real timer, and the
  `key_links` contract requires the module to reach `node:timers/promises`. With
  `import { setTimeout as delay } from 'node:timers/promises'` those requirements are not jointly
  satisfiable: the snapshot binding is immune to `t.mock.timers`.
- **Fix:** `import timers from 'node:timers/promises'` and `timers.setTimeout(...)`, with the reason
  in the module header. The style guide permits a default import for external code that offers
  nothing else, and for a mockable wait it does not.
- **Files modified:** `src/runtime/retryPolicy.ts`
- **Verification:** All fifteen retry-policy cases run under `t.mock.timers` and the suite exits on
  its own; no case awaits a real timer.
- **Committed in:** `32cfa5b`

**4. [Rule 3 - Blocking] Lint-driven shape changes in the test modules**

- **Found during:** Tasks 1 and 2
- **Issue:** `sonarjs/no-nested-template-literals` rejected the inline credential encoding;
  `@typescript-eslint/require-await` rejected `async` work with no `await`;
  `@typescript-eslint/restrict-template-expressions` rejected numbers in a case title; and
  `sonarjs/no-identical-functions` rejected two identical counting closures.
- **Fix:** A named `credential` binding in the signer; work written as `() => Promise.resolve()` and
  `() => Promise.reject(new Error(...))`; `String(...)` in the interpolated titles; and one
  `countedWork()` factory shared by the three cases that count runs.
- **Files modified:** `src/cloud/sigv4.ts`, `test/runtime/retryPolicy.test.ts`
- **Verification:** `npx eslint ... --max-warnings=0` clean on all four files.
- **Committed in:** `18a2404`, `06d3bda`

______________________________________________________________________

**Total deviations:** 4 auto-fixed (3 blocking, 1 missing critical).
**Impact on plan:** No scope change. Two deviations resolve a conflict between the plan text and a
binding repository rule, one removes an unused required option, one is ordinary lint conformance.
The published contract changed in exactly one place — `RetryPolicyOptions` has no `clock`.

## Issues Encountered

- **The stale plan text about `features/**` was not exercised.** Both `<action>` blocks tell the
  executor to wait for plan 08 task 3 if `fallow` reports a `features/**` finding, on the premise
  that a `features/`-only commit skips the hooks. Both halves are stale: plan 01-01 corrected the
  hook patterns to match `features/**`, and plan 01-08 landed in wave 2. `fallow` reported no
  `features/**` finding at any point, so no wait was needed.

- **The `ignoreFindings` entries were measured, not assumed, and they are required.** Plan 01-03
  found its eight scaffold entries inert and reported that `fallow` prints no note about it. Both
  points needed re-checking here. Running `fallow dead-code` after adding `src/cloud/sigv4.ts` and
  its test, with no ignore entry, produced:

  ```
  ● Unused exports (1)
    src/cloud/sigv4.ts
      :2 IOT_SERVICE_NAME
  ```

  and the same for `MAX_BACKOFF_MS` in `src/runtime/retryPolicy.ts`. So the plan's premise holds:
  a mirrored test counts as a consumer for what it imports, and a constant it has no reason to
  import is still one finding, which blocks the commit. `fallow` **does** print the
  `ignoreFindings patterns matched no finding this run` note — it named the eight scaffolds on every
  run and never named the two new entries, which is direct confirmation that the new entries
  suppress real findings while the eight remain inert.

- **`node_modules` is absent from the worktree.** Resolution falls through to the parent repository,
  so every script runs. `fallow` prints its `node_modules directory not found` warning and passes,
  matching the three prior plans.

- **The worktree `trufflehog` hook fails structurally, as `CLAUDE.md` documents.** Every commit ran
  `pre-commit run --files <changed files>` first, then the filesystem scan over the same paths
  (`--results=verified,unknown --fail`), which reported `verified_secrets: 0` and
  `unverified_secrets: 0` each time. Only then was `SKIP=trufflehog` used, and it was never extended
  to another hook. No commit used `--no-verify`.

- **Two cases pass against the RED skeleton.** The determinism case and the four signature-
  sensitivity rows hold for a stub that ignores its input, and the abort case holds for a policy that
  runs nothing. That is expected rather than a false RED: those cases exist to discriminate a
  *wrong signer* and a *leaky policy*, and the discriminating cases in both modules failed in RED and
  passed in GREEN.

## TDD Gate Compliance

Both tasks ran RED then GREEN. `test(01-07)` precedes `feat(01-07)` in both pairs; no `refactor`
commit was needed because neither implementation had an obvious cleanup left after GREEN.

## User Setup Required

None — no external service configuration required.

## Verification

Re-run at the end of the plan, all from the worktree:

- `node --test dist-test/test/cloud/sigv4.test.js` — 9 pass, 0 fail.
- `node --test dist-test/test/runtime/retryPolicy.test.js` — 15 pass, 0 fail.
- `npm run test:coverage:direct` — 100 percent lines, branches, and functions for each pair alone.
- `npm run check` exits 0: type check, lint, all three `fallow` sub-commands, format check, **266
  unit tests** (up from 242), and **10 Cucumber scenarios over 61 steps**. `fallow dupes` reports no
  duplication.
- The plan's `node -e` `.fallowrc.json` assertion exits 0: no duplicate entry, both transitional
  paths present, and the eight scaffolds still leading the list in their established order.

## Next Phase Readiness

- Plan 09 can import `presignIotWebsocketUrl` for the transport's URL-transform hook and take a
  constructed `RetryPolicy` in `ShadowClientOptions`. Note the one contract change:
  `createRetryPolicy` takes `{ signal, maxDelayMs, log }` with no `clock`.
- Plan 09 appends `src/cloud/mqttTransport.ts` and `src/cloud/shadow.ts` to `ignoreFindings` after
  the two entries added here. Plan 10 removes all four and the four module-header notes.
- No blockers. `STATE.md` and `ROADMAP.md` were deliberately left untouched; the orchestrator owns
  them after the wave merges.

______________________________________________________________________

*Phase: 01-secure-cloud-foundation*
*Completed: 2026-08-28*
