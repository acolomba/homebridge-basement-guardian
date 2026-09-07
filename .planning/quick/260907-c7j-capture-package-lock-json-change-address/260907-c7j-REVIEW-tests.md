# Test review — `features/refinements` (4 commits ahead of `origin/main`)

Reviewer: pr-test-analyzer
Date: 2026-09-07
Branch under review: `features/refinements`
Suites used as context: `test/` (1459 unit cases, node:test, reported 100%) and `features/` (Cucumber, 104 scenarios)

## Summary

The branch is small and, with one exception, genuinely behaviour-preserving, and I was able to
verify most of that claim mechanically rather than by reading. The 10 new `test/config.test.ts`
cases are a good characterization set and do pin the two deliberately-preserved oddities. The
offline-count refactor is covered at both call sites. The shared `DEFAULT_PLATFORM_DEPS` constant
is inert. The `String.raw` conversion in `src/logging.ts` is where the review lands: the
conversion itself is correct today, but the suite does not discriminate it. I confirmed by
mutation that one credential-redaction pattern can be silently broken and all 1459 unit tests
still pass.

Method note: every claim below marked "verified" was checked by running the compiled suite
(`dist-test/`, a gitignored build artifact) against a mutated copy of the compiled module. No
source or test file was modified; the build directory was rebuilt to baseline afterwards
(1459/1459 pass, `git status` clean).

---

## BLOCKING

### B1. Nothing in either suite pins the `\s` characters in `AWS_SESSION_CREDENTIAL_PATTERN`; a one-token edit silently leaks the tail of every AWS session credential (criticality 9/10)

File: `/Users/acolomba/src/homebridge-basement-guardian/src/logging.ts:20`
Tests: `/Users/acolomba/src/homebridge-basement-guardian/test/logging.test.ts:219-234`

The exact mutation that survives the suite — remove the `String.raw` tag from that one line
(nothing else):

```ts
const AWS_SESSION_CREDENTIAL_PATTERN = new RegExp(`("?(?:${AWS_SESSION_CREDENTIAL_FIELDS})"?\s*[:=]\s*"?)[^",\s}]+`, 'g');
```

In an untagged template `\s` is not a recognized escape, so it collapses to the bare letter `s`.
The compiled pattern becomes:

```
("?(?:AccessKeyId|SecretAccessKey|SessionToken)"?s*[:=]s*"?)[^",s}]+
```

The value character class now excludes the letter `s` instead of whitespace, so the match stops
at the first `s` in the credential and the rest of the value is written to the log verbatim:

| input | correct | mutated |
| --- | --- | --- |
| `{"AccessKeyId":"temporary-credential-value"}` (the test's value) | `{"AccessKeyId":"[redacted]"}` | `{"AccessKeyId":"[redacted]"}` |
| `{"SessionToken":"IQoJb3JpZ2luX2VjEBsaCXVzLXdlc3QtMiJHMEUC"}` | `{"SessionToken":"[redacted]"}` | `{"SessionToken":"[redacted]saCXVzLXdlc3QtMiJHMEUC"}` |

The three parameterized cases at `test/logging.test.ts:219-234` all use the literal
`temporary-credential-value`, which contains no `s`, no whitespace, no comma and no `}`. Every
character the mutation changes is therefore unobservable. Verified: with this single mutation
applied to the compiled `logging.js`, `node --test "dist-test/test/**/*.test.js"` reports
`pass 1459, fail 0`.

The Cucumber suite does not close the gap. Its redaction assertions
(`features/support/steps/authentication.ts:171-184`) exercise the *registered-secret* path —
`SHADOW_CREDENTIALS` values are handed to `registerSecret(..., 'aws-session-token')` and removed
by exact substring substitution, which is unaffected by the regex. Nothing in `features/`
exercises `AWS_SESSION_CREDENTIAL_PATTERN` at all.

Why this is real harm and not academic: this pattern exists specifically for "credential
material the plugin never holds as a registered string" (the module's own comment,
`src/logging.ts:9-11`) — a raw REST body or a vendor error message quoting one that reaches the
log before or outside registration. Real AWS session tokens are long base64-ish strings that
essentially always contain `s`, so the mutated pattern leaks a usable portion of a live
credential into the Homebridge log while the log still *looks* redacted. That is the exact
failure mode `[redacted]` is supposed to prevent, and it fails silently and permanently.

Required fix (test-only): change the credential value used in the three parameterized cases to
one that exercises the characters the pattern actually relies on — it must contain the letter
`s` and be followed by content that the class must not swallow. For example:

```ts
log.debug(`aws credentials {"${field}":"session/token+value=","Expiration":"2026-09-07T00:00:00Z"}`);
// expects: `aws credentials {"${field}":"[redacted]","Expiration":"[redacted-or-untouched]"}`
```

and add one case for the whitespace-separated form the two `\s*` groups exist for:

```ts
log.debug(`aws credentials AccessKeyId = AKIAIOSFODNN7EXAMPLE and nothing else`);
// expects the value substituted, the trailing words left alone
```

Together those two cases make every `\s` in the pattern load-bearing, and the mutation above
fails.

For contrast, the sibling pattern is protected — by luck, not design.
`PRESIGNED_URL_PATTERN` (`src/logging.ts:21`) survives the same mutation only because its test
value `presigned-credential-value` happens to contain an `s`; the mutated pattern truncates at
it and `test/logging.test.ts:236-251` fails. That the two patterns differ only by an accident of
the chosen literal is itself the argument for pinning them deliberately.

---

## ADVISORY

### A1. `AUTHENTICATION_BODY_PATTERN` is unpinned in the same way, but the reachable harm is speculative (criticality 4/10)

File: `src/logging.ts:22`, test `test/logging.test.ts:253-266`.

Dropping `String.raw` from this line collapses both `\s*` groups to `s*`. Verified: 1459/1459
still pass. A body written with spaces around the separator goes through completely unredacted:

- correct: `posting {"username" : "[redacted]", "password" : "[redacted]"}`
- mutated: `posting {"username" : "account@example.test", "password" : "hunter2"}`

I am keeping this advisory rather than blocking because I could not find a reachable producer of
that shape. The grant body is built with `JSON.stringify` (`src/cloud/auth.ts:258`, never logged
directly), and `describeObject` in the logger also uses `JSON.stringify`, neither of which emits
whitespace around `:`. The value class `[^",}]+` contains no `\s`, so unlike B1 no truncation
occurs. Fix it with the same one-line change as B1: add a spaced-separator case such as
`posting {"username" : "account@example.test", "password" : "account-password"}`.

### A2. The offline-count *reset* is not asserted on the unresolved-family branch (criticality 4/10)

File: `src/accessories/basementGuardian.ts:1007` and `:1038`.

The signature change (`connected: boolean` -> `connectivity: DeviceSnapshot['connectivity']`) is
safe: `ApiConnectivity` is `{ connected: boolean; timestamp: number }`
(`src/cloud/types.ts:8-12`), so there is no second boolean a future edit could read by mistake,
and both call sites pass `snapshot.connectivity` under the same `source === 'poll'` guard. The
RES-03 / D-016 invariant is covered at both:

- resolved family: `test/accessories/basementGuardian.test.ts:1371-1465` — threshold 1/2/8,
  the documented default, reset on a connected poll, no backlog after a long outage, and the
  D-016 case that the device's own `data.offline` never activates the adapter.
- unresolved family: `test/accessories/basementGuardian.test.ts:887-905` (advances on the
  configured polls while the family does not resolve) and `:906-920` (a live update leaves the
  run alone).

The gap: no case drives a **connected** poll through the unresolved-family branch. A site-local
mutation at `:1007` that ignored connectivity and always incremented would pass the suite,
because every unresolved-family case there feeds only disconnected polls. The shared helper's
reset branch is covered through the other call site, so a change to `nextOfflineCount` itself is
still caught — which is why this is advisory. One case would close it: unresolved family,
disconnected poll, connected poll, disconnected poll, assert the offline contact is still
`CONTACT_DETECTED`.

### A3. `DEFAULT_PLATFORM_DEPS` is inert today; no test can or should prove that (criticality 2/10)

File: `src/platform.ts:497-499`.

The shared-mutable-default concern does not apply here. `deps` is referenced exactly twice in the
module — the parameter default at `:531` and the read `deps.httpFetch` at `:590` — and nothing
assigns into it. `PlatformDeps` holds one function-valued field. Cross-call contamination is
therefore unreachable, and a test asserting it would be testing an impossibility. Several unit
cases already construct the platform repeatedly on the default
(`test/platform.test.ts:683, 696, 1096, 1121, 1145, 1174, 1239`). If you want a guard for future
edits rather than a test, `Object.freeze` on the constant is the cheaper instrument; I would not
add one now.

### A4. Coverage of the safety paths is assertion-backed, not just line-executed

I spot-checked the concern that 100% line coverage might be hiding executed-but-unasserted safety
code. In `test/accessories/basementGuardian.test.ts` the trust paths assert on observable
outcomes rather than on the fact that a line ran — `deepStrictEqual` over the whole `untrusted`
array including `reason` and `lastTrustedAt`, and `StatusActive` / characteristic reads per
service (for example `:1330-1368`, `:849-885`). The redaction tests use `strong-mock` with
`exactParams: true` and `verify(delegate)`, so an unexpected or differently-shaped delegate call
fails. The suites are strong; B1 is a gap in one chosen literal, not a systemic weakness.

### A5. Nothing to fix in the remaining changes

Recorded so the next reviewer does not re-derive them.

- **`src/config.ts:14` EMAIL_PATTERN.** The rewrite is provably equivalent, not merely
  untested-as-different. Old accepts iff the domain has some `.` at index >= 1 with at least one
  character after it; new accepts iff the *first* such dot has a character after it — and when
  the first one does not, no later one exists, so the two conditions coincide. Verified
  exhaustively over all 335,923 strings up to length 7 from the alphabet `{a, b, ., @, space, -}`:
  zero divergence. The 10 added cases (`test/config.test.ts:88-115`) do pin both preserved
  oddities (`user@example..test` and `user@example.test.` in the accept list, with a comment
  saying they are recorded rather than endorsed), and they discriminate the plausible mutations:
  `[^\s@.]*` -> `[^\s@.]+` fails on `a@b.c`; a trailing `[^\s@]+` -> `[^\s@.]+` fails on
  `user@example..test`; `^[^\s@]+` -> `^[^\s@]*` fails on `@example.test`.
- **`src/accessories/pumpRecords.ts`.** `countWatchedActivation` was hoisted out of the closure;
  its body reads only its two parameters, so the move is mechanical.
- **`src/index.ts`.** Arrow-to-declaration for the one permitted default export; behaviour
  identical and `test/index.test.ts` still verifies the single `registerPlatform` call.
- **`src/cloud/auth.ts:16-21`.** Comment plus `eslint-disable-next-line`; no runtime change.
- **`eslint.config.js`, `package.json`, `sonar-project.properties`, `CHANGELOG.md`,
  `package-lock.json`.** Tooling and metadata; no test impact.

---

## Positive observations

- The characterization block added in `7012d5b` is the right instrument for a regex rewrite, is
  honest about the oddities it freezes, and is written so the intent survives the next reader.
- `test/logging.test.ts` deliberately re-declares `REDACTED` locally rather than importing the
  production constant, so a change to the placeholder fails the cases instead of following them
  silently. That is the same discipline B1 asks for, applied one level up.
- The rotation cases (`test/logging.test.ts:334-373`) assert both halves of the AUTH-02 contract:
  the superseded value is no longer redacted *and* the role-less password and bearer token still
  are, after 100 rotations.
- The offline-adapter cases assert the full reading sequence per poll rather than only the final
  state, so an off-by-one in the confirmation run cannot hide.

BLOCKING_COUNT: 1
