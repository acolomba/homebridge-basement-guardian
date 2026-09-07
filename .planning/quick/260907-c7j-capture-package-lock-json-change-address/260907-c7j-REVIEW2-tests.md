# Test review, round 2 — `features/refinements`

Reviewer: pr-test-analyzer
Date: 2026-09-07
Range reviewed: `git diff 4b4b41c..HEAD` (`cac360d`, `8fadb0c`, `2ea3c3a`)
Baseline: unit 1464/1464 pass, Cucumber 104 scenarios / 1156 steps pass.

Method: every verdict below was produced by mutating the **compiled** module under
`dist-test/` (a gitignored build artifact) and running the suite against it. No source or
test file was modified. The tree was rebuilt from untouched sources afterwards and both
suites re-run green; `git status` shows only this untracked planning directory, and the
three `String.raw` tags stand intact at `src/logging.ts:20-22`.

---

## CLOSURE VERDICT on round-1 B1: **CLOSED**

The reported mutation proof reproduces exactly. I did not take it on trust.

### Mutation 1 — `String.raw` removed from `AWS_SESSION_CREDENTIAL_PATTERN`

Compiled line 14 after mutation:

```js
const AWS_SESSION_CREDENTIAL_PATTERN = new RegExp(`("?(?:${AWS_SESSION_CREDENTIAL_FIELDS})"?\s*[:=]\s*"?)[^",\s}]+`, 'g');
```

```
ℹ tests 1464
ℹ pass 1458
ℹ fail 6
```

```
✖ AUTH-02 substitutes the temporary credential field AccessKeyId and leaves the field beside it whole (1.835625ms)
✖ AUTH-02 substitutes the temporary credential field AccessKeyId written unquoted around spaces (0.2355ms)
✖ AUTH-02 substitutes the temporary credential field SecretAccessKey and leaves the field beside it whole (0.1745ms)
✖ AUTH-02 substitutes the temporary credential field SecretAccessKey written unquoted around spaces (0.130167ms)
✖ AUTH-02 substitutes the temporary credential field SessionToken and leaves the field beside it whole (0.123625ms)
✖ AUTH-02 substitutes the temporary credential field SessionToken written unquoted around spaces (0.107917ms)
```

6 failures, as reported. Both new fixture shapes contribute: the quoted-with-sibling case
and the unquoted-spaced case each kill it independently.

### Mutation 2 — `String.raw` removed from `AUTHENTICATION_BODY_PATTERN`

```
✖ AUTH-02 substitutes an authentication request body written with spaces around its separators (1.785958ms)
ℹ tests 1464
ℹ pass 1463
ℹ fail 1
```

1 failure, as reported.

### Restore

```
restored
ℹ tests 1464
ℹ pass 1464
ℹ fail 0
```

The exact edit named in round 1 as silently survivable is now caught. B1 is closed, and the
fix is test-only — `src/logging.ts` is byte-identical to its pre-fix state, so no new
production behaviour was introduced.

---

## Going further: full single-mutation sweep of the three patterns

Reported mutations only cover the `String.raw` tag as a whole. I enumerated 34 single-token
mutations across all three patterns — every `\s`, every optional-quote `?`, every
character-class member, every value quantifier, and the `i` flag — and ran the whole suite
against each. 20 were killed, 14 survived.

Legend: **fail-safe** = the mutation redacts *more* than the correct pattern (never a leak);
**leak** = the mutation redacts *less*, letting credential material reach the log.

### `AWS_SESSION_CREDENTIAL_PATTERN` — 12 of 15 killed, 0 leaking survivors

| id | mutation | result |
| --- | --- | --- |
| W1 | `("?` -> `("` (opening quote mandatory) | killed (3) |
| W2 | `)"?` -> `)"` (field-closing quote mandatory) | killed (3) |
| W3 | 1st `\s*` -> `\s+` | killed (3) |
| W4 | 1st `\s*` deleted | killed (3) |
| W5 | 2nd `\s*` -> `\s+` | killed (3) |
| W6 | 2nd `\s*` deleted | killed (4) |
| W7 | `[:=]` -> `[:]` | killed (3) |
| W8 | `[:=]` -> `[=]` | killed (3) |
| W9 | value-opening `"?` -> `"` | killed (3) |
| W10 | value class drops `"` | killed (3) |
| W11 | value class drops `,` | **survived** — fail-safe |
| W12 | value class drops `\s` | killed (3) |
| W13 | value class drops `}` | **survived** — fail-safe |
| W14 | value `+` -> `*` | **survived** — fail-safe |
| W15 | 1st `\s` -> `\S` | killed (6) |

This is the pattern round-1 B1 was about, and it is now comprehensively pinned. Both
separator groups, both optional quotes, the separator class, and the two load-bearing value-class
members (`"` and `\s`) are all discriminated. The three survivors were checked
against a realistic session-token body and none of them reduces redaction:

```
BASE                     | {"SessionToken":"[redacted],MiJHMEUC","Expiration":"2026-09-07T00:00:00Z"}
W11 class drops ,        | {"SessionToken":"[redacted]","Expiration":"2026-09-07T00:00:00Z"}
W13 class drops }        | {"SessionToken":"[redacted],MiJHMEUC","Expiration":"2026-09-07T00:00:00Z"}
W14 + -> *               | {"SessionToken":"[redacted],MiJHMEUC","Expiration":"2026-09-07T00:00:00Z"}
```

W11 in fact redacts *better* than the shipped pattern (see A6 below). W13 eats a closing
brace on an unquoted value; W14 permits an empty match. Neither can leak.

### `PRESIGNED_URL_PATTERN` — 2 of 5 killed, 3 fail-safe survivors

| id | mutation | result |
| --- | --- | --- |
| P1 | `String.raw` tag removed | killed (3) |
| P2 | value class drops `&` | killed (3) |
| P3 | value class drops `\s` | **survived** — fail-safe |
| P4 | value class drops `"` | **survived** — fail-safe |
| P5 | value `+` -> `*` | **survived** — fail-safe |

P1 was the one round 1 flagged as protected "by luck, not design" (its literal
`presigned-credential-value` happens to contain an `s`). It remains killed. The three
survivors only ever extend the match, so a signature can never be truncated back into the log.

### `AUTHENTICATION_BODY_PATTERN` — 6 of 14 killed, 5 leak-direction survivors

| id | mutation | result |
| --- | --- | --- |
| D1 | `("?` -> `("` (opening quote mandatory) | **survived** — leak direction |
| D2 | `)"?` -> `)"` (field-closing quote mandatory) | **survived** — leak direction |
| D3 | 1st `\s*` -> `\s+` | killed (1) |
| D4 | 1st `\s*` deleted | killed (1) |
| D5 | 2nd `\s*` -> `\s+` | killed (1) |
| D6 | 2nd `\s*` deleted | killed (4) |
| D7 | `[:=]` -> `[:]` | **survived** — leak direction |
| D8 | `[:=]` -> `[=]` | killed (2) |
| D9 | value-opening `"?` -> `"` | **survived** — leak direction |
| D10 | value class drops `"` | killed (2) |
| D11 | value class drops `,` | **survived** — fail-safe |
| D12 | value class drops `}` | **survived** — fail-safe |
| D13 | value `+` -> `*` | **survived** — fail-safe |
| D14 | flags `'gi'` -> `'g'` | **survived** — leak direction |

The five leak-direction survivors do leak on a constructed input:

```
BASE                     | posting password=[redacted]
D1 open quote required   | posting password=hunter2&realm=x
D2 close quote required  | posting password=hunter2&realm=x
D7 sep loses =           | posting password=hunter2&realm=x
D9 value quote required  | posting {"password": hunter2}
D14 no i flag            | posting {"Password":"hunter2"}
```

They are nonetheless **advisory, not blocking**, on two independent grounds, both checked
rather than assumed:

1. **No reachable producer.** The only shape this codebase can emit is `JSON.stringify`
   output — `{"username":"...","password":"..."}` — from `grantBody`
   (`/Users/acolomba/src/homebridge-basement-guardian/src/cloud/auth.ts:257-266`) and from
   `describeObject` in the logger. That shape is still fully redacted under **all five**
   survivors. `grep -rnE '"(Password|Username)"|password=|username=' src features test`
   returns nothing: there is no form-encoding, no `URLSearchParams`, and no capitalized
   credential field anywhere in the repo.
2. **The password is already a registered secret.**
   `/Users/acolomba/src/homebridge-basement-guardian/src/platform.ts:553` calls
   `this.log.registerSecret(validated.config.password)`, so the exact-substring pass removes
   it regardless of this regex. The pattern is a second net over an already-covered value.
   (The `username`/email is not registered, which is why this is recorded at all rather than
   dismissed.)

This is the same standing as round-1 advisory A1, and the specific mutation A1 named — the
spaced-separator form — is now killed (D3–D6). The advisory was addressed to the extent
requested; the residue below is new information, not a regression.

---

## Audit of the F1 regression test (`test/runtime/accountRuntime.test.ts:2640-2676`)

**It discriminates, and it asserts the right things.**

To check discrimination properly I reconstructed the pre-fix removal loop in the compiled
output (post-fix file spliced with the `4b4b41c` body of the same function) rather than
reasoning about it. The pre-fix order is confirmed: `health.forgetDevice`,
`options.anchors.forget`, `options.failures.forget` and `reconciliation.forget` all ran
**before** `options.onDeviceRemoved`, inside a `try` whose `catch` was silent.

Against that pre-fix loop the new test is the **only** failure in the whole suite:

```
ℹ tests 1464
ℹ pass 1463
ℹ fail 1
✖ keeps a pump whose removal was refused watched, distrusted and reported, and tries the removal again (2.033916ms)
```

```
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

    {
      attempts: [
        'account-1_serial-1'
      ],
  +   errors: 0,
  +   keepsItsAnchor: false,
  +   silence: false,
  -   errors: 1,
  -   keepsItsAnchor: true,
  -   silence: true,
      stillStored: true
    }
```

That diff is precisely the round-1 F1 harm: pre-fix the anchor was dropped
(`keepsItsAnchor: false`), the system was left trusted (`silence: false`), and nothing was
said (`errors: 0`) — a published accessory nothing could ever mark untrustworthy again.

The first assertion aborts before the retry check, so I verified the retry leg separately by
neutering only the first `deepStrictEqual` in the compiled test. It discriminates on its own:

```
    [
      'account-1_serial-1',
  -   'account-1_serial-1'
    ]
```

Pre-fix, no second removal is attempted on the following poll, because `reconciliation.forget`
had already run and reset the absence epoch. Post-fix the removal is retried. Good: the D-029
"the retry needs no state of its own" claim in the source comment is the thing actually
asserted, not just narrated.

On the four properties the task asked about:

- **stays watched** — asserted via `stillStored`. Note this field is the one part of the
  assertion that does *not* discriminate (it reads `true` both pre- and post-fix, because the
  harness throws before `store.remove`). It is still correct to assert, and the harness
  throwing *before* `store.remove` is the right model of the real failure: Homebridge's
  unregister throws and the platform's own store removal never happens. Not a defect.
- **keeps its anchor** — asserted and discriminating.
- **stays distrusted** — asserted via `silenceOf(...).at(-1)`, and discriminating. The helper
  reads the per-device map rather than the account struct, which the helper's own comment
  explains is the only place the answer actually lives (D-02).
- **is retried** — asserted and independently discriminating.

The error message is pinned by exact whole-line equality (`countOfLine`), so a reworded log
fails rather than silently passing a `startsWith` check. The `removalFails` flag throws the
real HAP string `Cannot find the bridged Accessory to remove.`, which keeps the fixture
honest about what Homebridge actually does.

One note on the test as written, not a finding: it is a single test carrying two act/assert
pairs, so a failure in the first pair masks the second. That is a readability trade-off the
file makes elsewhere too, and splitting it would duplicate a fairly long arrange block.

---

## Findings

### BLOCKING

None. No surviving mutation of any of the three patterns causes a leak that any reachable
producer in this codebase can trigger, and the F1 regression test genuinely discriminates the
pre-fix behaviour.

### ADVISORY

#### A6. `AWS_SESSION_CREDENTIAL_PATTERN` truncates a value at a comma (criticality 3/10)

Not introduced by this branch, but surfaced by the sweep. The value class `[^",\s}]+`
excludes `,`, so a credential containing a comma is only partly redacted:

```
{"SessionToken":"IQoJb3JpZ2luX2VjEBsaCXVzLXdlc3Qt,MiJHMEUC"}
  ->  {"SessionToken":"[redacted],MiJHMEUC"}
```

Mutation W11 — dropping `,` from the class — produces the *correct* output here, which is why
it survives the suite. Real AWS session tokens are base64url (`A-Za-z0-9+/=`) and so do not
contain commas, which is why this is low and not a blocker. If you want it airtight, the `"`
and `}` members already terminate every JSON shape; `,` is only load-bearing for an unquoted
comma-separated form that nothing produces. I would leave `src/logging.ts` alone and not
churn a safety-critical regex for a case that cannot arise.

#### A7. Five `AUTHENTICATION_BODY_PATTERN` mutations survive in the leak direction (criticality 3/10)

D1, D2, D7, D9 and D14 above. Unreachable today for the two reasons given, and the password
is separately covered by `registerSecret`. If you want them pinned cheaply, two more cases in
the existing parameterized style would kill all five at once:

```ts
log.debug('posting password=account-password&realm=Username-Password-Authentication');
// expects: posting password=[redacted]

log.debug('posting {"Password" : "account-password"}');
// expects: posting {"Password" : "[redacted]"}
```

The first kills D1, D2, D7 and D9; the second kills D14. Worth doing only if you consider the
pattern a genuine net for vendor-authored text rather than a backstop for a value that is
already a registered secret — that is a product call, not a test defect.

#### A8. Round-1 A2 and A3 are unchanged

Neither was touched by these three commits and neither was expected to be. A2 (no connected
poll through the unresolved-family branch) and A3 (`DEFAULT_PLATFORM_DEPS` inert) stand as
written in round 1. No action needed for this round.

---

## Positive observations

- The B1 fix is test-only. `src/logging.ts` is unchanged, so closing the gap could not itself
  introduce a behavioural regression — the right shape for a coverage fix.
- The two new AWS fixtures are complementary rather than redundant: the quoted case pins the
  value-class terminators, the unquoted-spaced case pins both `\s*` separator groups. Each
  kills the reported mutation on its own, and together they took the AWS pattern from one
  discriminated mutation to twelve.
- The comments added above the new fixtures say *why* the literal was chosen (`the credential
  value opens with an s and a second field follows it`). That is exactly what stops a future
  editor from "tidying" the literal back into something inert — the failure mode that created
  B1 in the first place.
- The F1 regression test asserts a five-field object in one `deepStrictEqual` rather than five
  separate assertions, so the failure output shows the whole post-refusal state at once. The
  pre-fix diff above is legible precisely because of that choice.
- `countOfLine` (whole-line equality) rather than a substring check means the new error message
  is pinned as a contract, not merely detected.

BLOCKING_COUNT: 0
