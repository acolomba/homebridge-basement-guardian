---
phase: 01-secure-cloud-foundation
plan: 04
subsystem: config
tags: [config-schema, homebridge-ui, validation, refuse-not-clamp, secret-redaction, logging, tdd]

requires:
  - "01-01: the second TypeScript project, typed lint over test/**, and the npm run check gate"
  - "01-02: validateConfig with its discriminated ConfigResult, and the platform composition root"
  - "01-03: the platform edit that hands a logger to the device state store"
provides:
  - "A strict `config.schema.json` with six fields, a masked password, and a plaintext-storage header"
  - "`test/configSchema.test.ts`, which asserts the shipped file and fails when a seventh field appears"
  - "`createRedactingLogger`, a callable `Logging` wrapper that redacts on all seven members"
  - "`RedactingLogger`, whose `registerSecret` accepts secrets found after construction"
  - "Range-checked `validateConfig` that refuses rather than clamps, in a fixed field order"
  - "A platform constructor that installs the wrapper first and registers the password on acceptance"
affects: [01-05, 01-06, 01-07, 01-09, 01-10, 01-11, auth-client, shadow-client, accessory-adapters]

actuals:
  tokens: 10400
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "The settings schema and the runtime validator are two copies of one contract; a test pins the schema key set"
    - "Refuse, never clamp: an out-of-range or wrongly typed value stops startup, only an absent field takes a default"
    - "Fields are checked in one fixed order and the first failure returns, so the message is deterministic"
    - "Secret redaction is structural: one wrapper is the only logger the platform exposes"
    - "The wrapper is a function carrying seven members, because `Logging` is a callable interface"
    - "A credential pattern keeps its naming part and substitutes only the value that follows it"

key-files:
  created:
    - src/logging.ts
    - test/logging.test.ts
    - test/configSchema.test.ts
  modified:
    - config.schema.json
    - src/config.ts
    - src/platform.ts
    - test/config.test.ts
    - test/platform.test.ts

key-decisions:
  - "Dropped `additionalProperties: false` from the schema, because `strictValidation: true` would then flag the `platform` key the Homebridge UI writes itself"
  - "The platform's public `log` is now the redacting wrapper, so no unwrapped logger field remains to write through by accident"
  - "The account runtime receives the wrapper rather than the raw Homebridge logger, one plan earlier than the plan text expected"
  - "A supplied but blank `name` or `clientId` is refused with a fixed sentence; only the numeric fields quote the rejected value"
  - "An authorization token match may not end on a dot, so a token ending a sentence keeps its full stop"

patterns-established:
  - "Shipped-artifact tests read the repository-root file through `import.meta.url`, not a build copy"
  - "A property key set asserted with `deepStrictEqual` is the gate against exposing a new vendor constant"
  - "Numeric refusal messages name the field, the inclusive range, and the supplied value, stringified defensively"

requirements-completed: [CONF-02, CONF-03, CONF-04, CONF-05, AUTH-02]

coverage:
  - id: D1
    description: "config.schema.json declares one strict account block with exactly six fields, a masked password, an email-validated address, and a plaintext-storage header"
    requirement: CONF-02
    verification:
      - kind: unit
        ref: "test/configSchema.test.ts#CONF-02 masks the password field and validates the email field as an address"
        status: pass
      - kind: unit
        ref: "test/configSchema.test.ts#CONF-02 states in the form header that Homebridge stores the password in plain text"
        status: pass
      - kind: unit
        ref: "test/configSchema.test.ts#CONF-04 exposes no vendor protocol constant other than the client identifier"
        status: pass
    human_judgment: false
  - id: D2
    description: "The Homebridge Plugin Settings page renders the masked password, rejects a malformed email, refuses to save an incomplete block, and offers one account block only"
    requirement: CONF-02
    verification: []
    human_judgment: true
    rationale: "The form is rendered by the Homebridge UI (ng-formworks); the repository has no harness that drives it. The plan's human-check is harvested into the phase UAT list."
  - id: D3
    description: "validateConfig refuses an out-of-range, fractional, string, or null numeric value and never clamps or substitutes a default for a supplied value"
    requirement: CONF-05
    verification:
      - kind: unit
        ref: "test/config.test.ts#CONF-05 refuses a poll interval of 299 (and 3601, 3.5, \"900\", null)"
        status: pass
      - kind: unit
        ref: "test/config.test.ts#CONF-05 refuses an offline confirmation poll count of 0 (and 9, 1.5, \"2\", null)"
        status: pass
      - kind: unit
        ref: "test/config.test.ts#CONF-05 reports the first failing field in a fixed order when several fields are wrong"
        status: pass
    human_judgment: false
  - id: D4
    description: "A refused configuration logs one actionable error, registers no listener, and starts no network, timer, or accessory work"
    requirement: CONF-03
    verification:
      - kind: unit
        ref: "test/platform.test.ts#logs one actionable refusal and registers no listener when the account email is missing"
        status: pass
      - kind: unit
        ref: "test/platform.test.ts#registers the launch and shutdown listeners once the configuration is valid"
        status: pass
    human_judgment: false
  - id: D5
    description: "clientId resolves by one precedence rule: a configured value replaces the bundled constant, an absent value takes it, and a blank value is refused"
    requirement: CONF-04
    verification:
      - kind: unit
        ref: "test/config.test.ts#CONF-04 accepts a client identifier equal to the bundled constant and yields that same value"
        status: pass
      - kind: unit
        ref: "test/config.test.ts#CONF-04 refuses a client identifier of \"\" (and \"   \")"
        status: pass
    human_judgment: false
  - id: D6
    description: "Every one of the seven Logging members substitutes registered secrets and known credential patterns before the delegate sees them"
    requirement: AUTH-02
    verification:
      - kind: unit
        ref: "test/logging.test.ts#D-18 substitutes a registered secret through the bare callable form (and debug, error, info, success, warn, log)"
        status: pass
      - kind: unit
        ref: "test/logging.test.ts#AUTH-02 substitutes an authentication request body whose password was never registered"
        status: pass
      - kind: unit
        ref: "test/platform.test.ts#AUTH-02 registers the account password as a secret once the configuration is accepted"
        status: pass
      - kind: unit
        ref: "npm run test:coverage:direct -- dist-test/src/logging.js dist-test/test/logging.test.js"
        status: pass
    human_judgment: false

duration: 29min
completed: 2026-08-28
status: complete
---

# Phase 01 Plan 04: Settings Form, Refusing Validation, and Redacting Logger Summary

**A six-field strict Homebridge settings form with a plaintext-storage disclosure, a validator that refuses instead of clamping, and a callable-interface log wrapper that scrubs secrets on all seven `Logging` members.**

## Performance

- **Duration:** 29 min
- **Started:** 2026-08-28T23:38:00Z
- **Completed:** 2026-08-29T00:07:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- `config.schema.json` now declares one strict account block: `strictValidation: true`, a markdown `headerDisplay` naming plain-text storage in `config.json` and in backups, a `widget: password` field, a `format: email` field, and exactly six properties. A test asserts the property key set, so a seventh vendor constant cannot be added silently.
- `src/logging.ts` wraps the callable `Logging` interface as a function carrying its seven members. Every path substitutes registered secrets and four credential patterns: `Bearer` tokens, the three AWS session-credential field names, the three presigned-URL query parameters, and the field names an authentication body uses. Trailing string, object, and `Error` parameters are redacted too.
- `validateConfig` now checks `name`, `email`, `password`, `clientId`, `pollInterval`, and `offlineConfirmationPollCount` in that fixed order and returns on the first failure. An absent optional field takes its documented default; a supplied value is never clamped and an explicit `null` is refused.
- The platform constructor installs the wrapper as its first statement, registers the account password the moment validation accepts, logs one actionable refusal, and returns before any listener exists.
- `npm run check` exits 0 with 170 unit tests (up from 116) and the same 10 Cucumber scenarios and 61 steps.

## Task Commits

1. **Task 1: Ship the account settings form with its plaintext-storage disclosure** - `956b001` (feat)
2. **Task 2: Build the redacting log wrapper (RED)** - `be8b68b` (test)
3. **Task 2: Build the redacting log wrapper (GREEN)** - `552a551` (feat)
4. **Task 3: Refuse invalid configuration and install the wrapper (RED)** - `f02d72a` (test)
5. **Task 3: Refuse invalid configuration and install the wrapper (GREEN)** - `39c3b47` (feat)

No REFACTOR commit was needed: both implementations landed already decomposed under the 60-line unit and 15 cognitive-complexity limits.

## Files Created/Modified

- `config.schema.json` - The Homebridge Plugin Settings form: six fields, strict validation, plaintext-storage header.
- `test/configSchema.test.ts` - Reads the shipped root file through `import.meta.url` and pins its shape and key set.
- `src/logging.ts` - `createRedactingLogger`, `RedactingLogger`, `RedactingLoggerOptions`.
- `test/logging.test.ts` - 24 cases: one per `Logging` member, one per credential pattern, plus parameter and edge cases.
- `src/config.ts` - Fixed-order, refuse-never-clamp validation with inclusive integer bounds.
- `test/config.test.ts` - Data-driven accepted and refused rows for both numeric fields, plus name, email, and clientId cases.
- `src/platform.ts` - Installs the wrapper first, registers the password on acceptance, exposes the wrapper as `log`.
- `test/platform.test.ts` - Adds the refusal-through-the-wrapper case and the registered-password case.

## Decisions Made

- **Removed `additionalProperties: false` from the schema.** The plan said to replace the file wholesale and not to declare a `platform` property, because the Homebridge UI adds it from `pluginType`. Keeping `additionalProperties: false` alongside `strictValidation: true` would have made the UI treat that self-written key as an error. The intel's reference schema also omits it.
- **The platform's public `log` is the wrapper.** Making `log` a `RedactingLogger` and taking the raw Homebridge logger as a plain constructor parameter leaves no unwrapped logger field for later code to reach for. `configureAccessory` now logs through the wrapper as a consequence.
- **`createRuntime` receives the wrapper.** The plan's interfaces note defers wiring the logger into the runtime collaborators to a later plan. Passing the wrapper instead of the raw logger costs nothing and closes the gap now; the deferred work is registering tokens and temporary credentials as secrets, which is unchanged.
- **Text fields refuse with a fixed sentence.** The plan's "name the field, the accepted range, and the supplied value" instruction is scoped to the numeric fields. Echoing a whitespace-only `clientId` back would read as a blank space, so those two refusals state the rule instead.
- **A supplied but blank `name` is refused rather than defaulted.** The interfaces table gives `name` an absent-behavior default and a non-empty constraint, and `D-16` forbids substituting a default for a supplied-but-invalid value.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The authorization pattern swallowed a sentence-ending full stop**

- **Found during:** Task 3 (the refusal-through-the-wrapper case)
- **Issue:** A token character class must contain a dot, because a JSON Web Token contains dots. The greedy match therefore also consumed the period ending the sentence, turning `... but it is Bearer leaked-token. Fix it in ...` into `... but it is Bearer [redacted] Fix it in ...`. Every refusal message quoting a token would have lost its sentence break.
- **Fix:** The match may contain a dot but may not end on one: `/(Bearer\s+)[\w+/=-](?:[\w.+/=-]*[\w+/=-])?/g`.
- **Files modified:** `src/logging.ts`, `test/logging.test.ts`
- **Verification:** New case `AUTH-02 leaves the sentence full stop after an authorization token it substitutes`; the original dotted-token case still passes; the logging pair still reports 100 percent lines, branches, and functions.
- **Committed in:** `f02d72a` (test) and `39c3b47` (implementation)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix improves message quality on the redaction path the plan exists to build. No scope creep.

## Issues Encountered

- **The RED gate for task 2 needed a compiling skeleton.** TypeScript will not compile a test importing a module that does not exist, and the pre-commit hooks run `typecheck`, `lint`, and `fallow` on every commit. The RED commit therefore carries `test/logging.test.ts` together with a pass-through `src/logging.ts` that satisfies the types and redacts nothing: 20 of 23 cases failed for the right reason. The dead-code gate also needs the pair committed together, which the plan already called for.
- **`Logging` members return `void`, which `@typescript-eslint/no-confusing-void-expression` rejects in a concise arrow.** Every `when(() => ...)` expectation uses a block body, matching the existing pattern in `test/index.test.ts`.
- **`LogLevel` is a `const enum` in the Homebridge typings.** The style guide bans declaring one, not consuming one. Because the project compiles with `tsc` rather than a strip-only loader, the member is inlined and the import is elided from the emitted test, so nothing is imported from `homebridge` at run time.
- **TruffleHog cannot run in git mode inside a linked worktree.** Every commit used the documented filesystem-scan route over the staged paths first; all scans reported `verified_secrets: 0` and `unverified_secrets: 0`.

## Known Stubs

None. No hardcoded empty value, placeholder string, or unwired component was introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The refusal path is closed: an invalid `config.json` produces one message and no listener, so later plans can add work behind `didFinishLaunching` without re-checking configuration.
- `RedactingLogger.registerSecret` is the seam the auth and shadow clients need. Plans 01-05 and 01-06 should register the ID token and the temporary AWS credentials as they are obtained; the patterns already cover the shapes those values arrive in.
- **Carried assumption (from the plan's flagged assumptions).** `config.schema.json` and `validateConfig` are two hand-maintained copies of one contract. `test/configSchema.test.ts` pins the schema side and `test/config.test.ts` pins the runtime side, but nothing mechanically proves the two agree. A change to either bound must be mirrored.
- `.fallowrc.json` was not touched, as required. No shared planning artifact (`STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md`) was modified.

## Self-Check: PASSED

All nine claimed files exist on disk. All six claimed commits exist in the branch history
(`956b001`, `be8b68b`, `552a551`, `f02d72a`, `39c3b47`, `6992032`). The working tree is clean,
no tracked file was deleted, and `npm run check` exits 0 with 170 unit tests, 10 Cucumber
scenarios, and 61 steps passing.

---

*Phase: 01-secure-cloud-foundation*
*Completed: 2026-08-28*
