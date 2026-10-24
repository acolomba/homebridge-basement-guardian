---
phase: 01-secure-cloud-foundation
plan: 15
subsystem: infra
tags: [homebridge, config-schema, logging, redaction, privacy, credential-rotation]

requires:
  - phase: 01-secure-cloud-foundation
    provides: the configuration validator, the redacting logger, the platform composition root, and the credential rotation loop
provides:
  - A malformed-email refusal that names the field and the rule and quotes no account identifier
  - A scenario proving the configured account email appears in no logged line
  - A settings form whose required list and blank-value rules match the validator's
  - An unserializable-parameter description that reads nothing off the value it describes
  - A registered-secret list that stays flat across credential rotations while keeping unroled values forever
affects: [gap-closure plans 01-13 through 01-17, every later phase that logs through the redacting wrapper or adds a settings field]

actuals:
  tokens: 7300
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - "A refusal names the field and the rule; it quotes the value only when that value is not an identifier"
    - "A registered secret carries an optional role; a roled value replaces its predecessor, an unroled one is kept for the life of the logger"
    - "Each schema fact the form enforces has a matching runtime case, so the two cannot drift apart unnoticed"

key-files:
  created: []
  modified:
    - src/config.ts
    - src/platform.ts
    - src/logging.ts
    - src/runtime/accountRuntime.ts
    - config.schema.json
    - test/config.test.ts
    - test/platform.test.ts
    - test/configSchema.test.ts
    - test/logging.test.ts
    - test/runtime/accountRuntime.test.ts
    - features/configuration.feature
    - features/support/steps/configuration.ts

key-decisions:
  - "The malformed-email refusal drops the value rather than registering the email as a redactable secret: registering it would place the raw account identifier in the process-lifetime secret list and still leave a marker where a value was, and the settings form's own email format already refuses the value before it can be saved."
  - "Recording an exception to PROJECT.md's Privacy constraint was rejected: a code comment does not outrank a constraint two project documents state, and the diagnostic it would buy is small."
  - "The role on registerSecret is an optional second argument rather than a required one, so src/cloud/auth.ts and src/platform.ts keep working untouched and an existing single-argument function stays assignable to the widened member."
  - "SecretRole is a string-literal union of the three rotated AWS values rather than a free string, so a mistyped role is a compile error instead of a silently unbounded slot."
  - "Nothing is evicted by age or by count. Only an explicit role supersedes a value, because guessing which held value has expired is how a password stops being redacted."
  - "The platform name left the schema's required list rather than gaining a runtime requirement, because the validator already defaults an absent name and only a blank one is wrong."

patterns-established:
  - "Value-free refusals: a refusal about an identifier states the rule, never the value, because the refusal path runs before anything is registered as a secret"
  - "Bounded redaction: rotated credential material replaces its predecessor by role, so per-log-line scan cost and retained credential material stay flat over a months-long run"

requirements-completed: [CONF-02, CONF-03, CONF-05, AUTH-02]

coverage:
  - id: D1
    description: "A malformed account email is refused by a message naming the field and the rule, with no part of the configured value in it"
    requirement: CONF-05
    verification:
      - kind: unit
        ref: "test/config.test.ts#CONF-05 refuses an account email of \"jane.doe@company\" without quoting any part of it"
        status: pass
      - kind: unit
        ref: "test/platform.test.ts#AUTH-02 logs the malformed-email refusal without the account email it rejected"
        status: pass
      - kind: e2e
        ref: "features/configuration.feature#The plugin starts nothing when the account email is not an email address"
        status: pass
    human_judgment: false
  - id: D2
    description: "No logged line carries the configured account email on the refusal path, which runs before any secret is registered"
    requirement: AUTH-02
    verification:
      - kind: e2e
        ref: "features/support/steps/configuration.ts#no logged line contains the configured account email"
        status: pass
      - kind: e2e
        ref: "npx cucumber-js (3 consecutive full runs, exit 0 each)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The settings form and validateConfig agree on blank strings and on which fields are required"
    requirement: CONF-02
    verification:
      - kind: unit
        ref: "test/configSchema.test.ts#CONF-02 requires the account email and password, the two fields the runtime has no default for"
        status: pass
      - kind: unit
        ref: "test/configSchema.test.ts#CONF-02 gives name the non-blank rule the runtime enforces"
        status: pass
      - kind: unit
        ref: "test/config.test.ts#refuses an account password of \" \""
        status: pass
    human_judgment: true
    rationale: "The runtime side is proven by cases, but whether the Homebridge settings GUI actually refuses to save a single space for these three fields can only be seen by opening the form in a running Homebridge instance."
  - id: D4
    description: "No object a caller can construct makes a log call raise out of the logger"
    requirement: CONF-03
    verification:
      - kind: unit
        ref: "test/logging.test.ts#WR-10 describes an unserializable parameter that has no prototype rather than raising"
        status: pass
      - kind: unit
        ref: "test/logging.test.ts#describes a parameter that cannot be serialized"
        status: pass
    human_judgment: false
  - id: D5
    description: "The redacting logger holds one value per rotated credential role, while values registered with no role stay redacted for the life of the logger"
    requirement: AUTH-02
    verification:
      - kind: unit
        ref: "test/logging.test.ts#AUTH-02 holds one value per rotated role however many rotations follow"
        status: pass
      - kind: unit
        ref: "test/logging.test.ts#AUTH-02 keeps the password and the bearer token redacted however many rotations follow"
        status: pass
      - kind: unit
        ref: "test/runtime/accountRuntime.test.ts#AUTH-02 registers every temporary credential value under its own rotated role"
        status: pass
    human_judgment: false

duration: 30min
completed: 2026-08-29
status: complete
---

# Phase 1 Plan 15: Privacy, Schema Agreement, and a Bounded Logger Summary

**The malformed-email refusal no longer quotes the account identifier, the settings form and the validator agree on blank values and the required list, and the redacting logger neither raises on an odd object nor grows its secret list with uptime.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-08-29T11:39:00Z
- **Completed:** 2026-08-29T12:09:00Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments

- Closed gap 6 (WR-01). `firstRefusal` returns `the account email must be an email address.` The value is gone from the one refusal that quoted it, which is the one path that runs before any secret is registered and where none of the four credential patterns could have matched a bare email in prose.
- Added the scenario the suite never had. `features/configuration.feature` now loads the platform with a present-but-malformed email and asserts the refusal, the absent lifecycle listener, the absent vendor request, and — through a new step — that no logged line carries the configured account email. The step reads the email from the scenario's own settings, so it stays true if a scenario changes the value.
- Replaced the platform-constructor comment that justified the quoting with one that records why the value is not quoted, naming both rejected alternatives.
- Closed WR-13. The form no longer requires the platform name (the validator defaults an absent one), and the name, password, and client identifier each carry `minLength: 1` beside `pattern: "\\S"`, so a single space no longer saves in the form and then blocks startup. Cases on both sides assert the agreement.
- Closed WR-10. The unserializable-parameter fallback is a fixed description that reads nothing off the value, so an object made with `Object.create(null)` in a circular graph no longer raises a `TypeError` out of a log call made from inside a catch block.
- Closed WR-09. `registerSecret` takes an optional role. A roled value replaces the value that role held; an unroled value is kept for the life of the logger. The three values the credential refresh registers each carry a role, so the rotated count stays at three however long the bridge runs, instead of growing by three an hour.

## Task Commits

Each task followed red then green:

1. **Task 1: The refusal path carries no account identifier** — `4179775` (test), `d6278ed` (fix)
2. **Task 2: The settings form accepts exactly what the runtime accepts** — `09e5151` (test), `1f42292` (fix)
3. **Task 3: The logger cannot raise, and its secret list stops growing** — `d6bceee` (test), `43cc10f` (fix)

## Files Created/Modified

- `src/config.ts` — the malformed-email refusal names the field and the rule and quotes nothing
- `src/platform.ts` — the constructor comment records why the value is not quoted and which alternatives were rejected
- `src/logging.ts` — `SecretRole`, the optional role on `registerSecret`, the role-indexed replacement, and the value-free unserializable description
- `src/runtime/accountRuntime.ts` — each rotated credential registers under its own role; the seam forwards the role and keeps its single-argument shape for the auth client
- `config.schema.json` — required list without the name; non-blank rules on the name, password, and client identifier
- `test/config.test.ts` — malformed addresses driven as rows against one fixed refusal; single-space rows for the name, password, and client identifier
- `test/platform.test.ts` — the logged refusal carries no rejected email
- `test/configSchema.test.ts` — the required list and the non-blank rule on each of the three text fields
- `test/logging.test.ts` — the null-prototype circular case, role replacement, and the two long-run cases
- `test/runtime/accountRuntime.test.ts` — the harness records role and value, so the rotation case asserts the pairing
- `features/configuration.feature` — the malformed-email scenario
- `features/support/steps/configuration.ts` — the step asserting no logged line carries the configured account email

## Decisions Made

See `key-decisions` in the frontmatter. The two that shaped the work:

**The Privacy constraint won the policy conflict.** The comment at `platform.ts:48-49` showed the quoting was deliberate, but a code comment is not a project document. PROJECT.md's Privacy constraint and CLAUDE.md both forbid account identifiers in logs and do not conflict with each other. Two alternatives were considered and rejected, and the rejection is now recorded in the code rather than only here:

- *Register the configured email as a redactable secret before validation.* It would put the raw account identifier into the logger's own process-lifetime secret list — the very place the constraint is about — and the operator would still read `[redacted]` where a value was, so the diagnostic is not actually recovered.
- *Record an explicit exception to the Privacy constraint.* Weakening a constraint to keep one diagnostic that the settings form's `format: "email"` already provides is a bad trade.

**The role is an optional second argument, not a required one.** That single choice is what let `src/cloud/auth.ts` and `src/platform.ts` keep working untouched: an existing `(secret: string) => void` stays assignable to `(secret: string, role?: SecretRole) => void`, so the test doubles in `test/cloud/auth.test.ts` and the two seam cases in `test/runtime/accountRuntime.test.ts` that ignore the argument needed no edit.

## Deviations from Plan

**1. [Process] The red commit for task 3 carried the widened type as well as the cases**

- **Found during:** Task 3
- **Issue:** A case that calls `log.registerSecret(value, 'aws-access-key-id')` cannot compile against a single-argument signature, so a test-only red commit would not have built and could not have been committed behind the pre-commit typecheck.
- **Fix:** `d6bceee` widens `RedactingLogger.registerSecret` and `AccountRuntimeOptions.registerSecret` and adds `SecretRole`, and changes no behaviour. The four cases that needed the new behaviour failed in that commit for the right reason; `43cc10f` made them pass.
- **Files modified:** `src/logging.ts`, `src/runtime/accountRuntime.ts` (type declarations only)
- **Verification:** `node --test` on the logging and runtime pairs reported 5 failures at `d6bceee` and 0 at `43cc10f`.

**2. [Rule 1 - Bug, scope] Two existing cases became row loops**

- **Found during:** Task 2
- **Issue:** The existing platform-name and password cases used `'   '` and `''`. WR-13's disagreement is specifically about a *single* space, which `minLength: 1` accepts.
- **Fix:** Both became two-row loops over `['', ' ']`, and the client-identifier loop's `'   '` row became `' '`. Same behaviour asserted, now on the value the schema rule turns on.
- **Files modified:** `test/config.test.ts`
- **Verification:** `dist-test/src/config.js` reports 100 percent lines, branches, and functions run alone.

---

**Total deviations:** 2 (1 process, 1 in-scope test shape). No production behaviour beyond the plan's three tasks.
**Impact on plan:** None. No scope creep; no file outside `files_modified` was touched.

## Issues Encountered

**A pre-existing flake in `test/platform.test.ts`, observed once, not fixed (out of scope).**

`AUTH-02 caches the granted token under the Homebridge storage directory` reads the storage directory and expects exactly `['.basement-guardian-token.json']`. Under `--experimental-test-coverage` it failed once with `['.basement-guardian-token.json.2649555.tmp']` — the atomic write's temporary file, seen mid-rename. Three further coverage runs passed, and the plain run passes consistently. The case is timing-dependent on `settle()` draining eight event-loop turns; the token cache is owned by `src/cloud/auth.ts`, which plan 01-16 owns this wave, so nothing was changed. Worth a fixed wait or a filter on the temporary suffix in a later plan.

**`developers.homebridge.io/#/config-schema` could not be read.** It is a single-page application and serves no schema documentation in its HTML, and the `homebridge-config-ui-x` wiki page for the settings GUI now returns 404. Support for `pattern` beside `minLength` was instead confirmed against a shipped verified plugin's schema (`homebridge-resideo`, which uses `"pattern"` on a string field). Recording the difference as CLAUDE.md asks: the pinned behaviour could not be read from primary documentation, so the evidence is a published plugin rather than a doc page.

**No `.planning/WINDOWS.md` exists**, so the two ledger-eligible items above (the platform-test flake) were recorded here rather than appended to a cross-phase register.

## Verification Run

- `npm run check` — exit 0
- Unit tests — 399 pass, 0 fail (386 at plan start; the net +13 is the new cases, less the two single cases that became row loops)
- `fallow dead-code`, `fallow health`, `fallow dupes` — no issues, 0 percent duplication
- Direct coverage, each pair run alone — `src/config.ts`, `src/platform.ts`, `src/logging.ts`, and `src/runtime/accountRuntime.ts` all 100 percent lines, branches, and functions
- `npx cucumber-js` — 3 consecutive full runs, 33 scenarios / 274 steps passing, exit 0 each
- `src/cloud/auth.ts`, `src/cloud/shadow.ts`, `src/cloud/api.ts`, and `src/cloud/mqttTransport.ts` — no diff against the wave base; `auth.ts` compiles unchanged against the widened `registerSecret`

## Known Stubs

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Gap 6 is closed and covered by a scenario, so the verifier's `missing` list for that truth is satisfied without an exception being recorded anywhere.
- WR-09, WR-10, and WR-13 are closed. The `SecretRole` union is the extension point for any future rotated credential: add a member and pass it at the registration site.
- Nothing here blocks 01-13, 01-14, 01-16, or 01-17. The widened `registerSecret` is backward compatible, so a concurrent edit to `src/cloud/auth.ts` in 01-16 merges without conflict on that member.

---

*Phase: 01-secure-cloud-foundation*
*Completed: 2026-08-29*

## Self-Check: PASSED

All 12 modified files and this summary exist on disk. All six task commits (`4179775`, `d6278ed`, `09e5151`, `1f42292`, `d6bceee`, `43cc10f`) are present in the branch history.
