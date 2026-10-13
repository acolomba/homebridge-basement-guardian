# Code quality review, round 2 — `homebridge-basement-guardian`

Scope: `git diff 4b4b41c..HEAD` on `features/refinements` — commits `cac360d`,
`8fadb0c`, `2ea3c3a` — with a repo-wide re-check of the comment rule.

Reviewed against `.claude/rules/typescript-comments.md`,
`.claude/rules/typescript-style-guide.md`, `.claude/rules/changelog.md`,
project `CLAUDE.md`, and `~/.claude/CLAUDE.md`.

Verification performed:

- `npm run typecheck` — clean.
- `npx eslint src test --max-warnings=0` — clean.
- `npm test` (node:test) — 1464 pass, 0 fail. The Cucumber leg refuses to start
  on this host (`Cucumber can only run on Node.js versions 22 || 24 || >=26`
  against `v26.8.0-alpha.0.0.0`); environmental and pre-existing, not a branch
  regression.
- Resolved every decision/requirement ID cited by the changed comments against
  `.planning/` to confirm the surviving anchors actually carry the claims.
- Traced `applyDevices` -> `runPoll`/`launch` error paths, `reconciliation.observe`
  semantics, and `removeDiscoveredDevice`'s partial-failure behaviour.

## CLOSURE VERDICT on B1 — **CLOSED**

`src/runtime/accountRuntime.ts:69-71` now reads:

```ts
// The vendor `deviceId` is a non-sensitive value, permitted in logs and in
// accessory context, and it names no route, header, credential or account
// (D-14, D-027, AUTH-02).
```

This is not a reword around the banned token. The forbidden construct is gone
and nothing replaced it that points at a planning artifact.

**Evidence the anchors still carry the WHY** — the risk flagged as the one to
check hardest. They do, and the comment is now *more* self-sufficient than
before:

1. The claim itself is stated inline. A maintainer reading only the comment
   learns that the `deviceId` is non-sensitive and where it may go. Under the
   old text the substantive claim was outsourced to "the Phase 2 ruling"; a
   reader who could not find that artifact had a bare assertion with no
   content. The new text loses no information because the information was
   never in the removed words — only the citation was.
2. The surviving anchors resolve, and they resolve to the right things.
   `D-027` (`.planning/PROJECT.md:165`, "Sanitized artifacts") is what keeps
   the value out of public artifacts. `AUTH-02`
   (`.planning/REQUIREMENTS.md:20`) is what excludes passwords, tokens,
   temporary AWS credentials, authorization headers and authentication bodies
   from logs. `D-14` is the decision that granted the per-device permission,
   and `.planning/WINDOWS.md:59` records it in prose that survives phase
   archival: "the vendor deviceId is treated as non-sensitive and may enter
   logs and accessory context, with D-027 keeping it out of public artifacts
   only. D-14 ... is the decision that made this per-device change and states
   the same permission."
3. `WINDOWS.md` is a durable ledger, not a per-phase directory, so the trail
   the removed token used to point at is still reachable — through the ID that
   the rule endorses rather than through the token it forbids. This is exactly
   the substitution the rule asks for.

**The other three sites in the same commit are also genuinely fixed, not
laundered:**

- `src/accessories/controls.ts:513-518` — "the 2026-08-29 ruling" became "it
  is a non-sensitive value", and the trailing "the residual the ruling already
  weighed" became "the residual `D-027` already weighed". No dated-artifact
  pointer survives; the sentence carries its own content.
- `src/accessories/serviceCatalogue.ts:979` — the `03-CONTEXT.md` filename is
  gone and `D-05` alone carries it, which is the form the rule's "Allowed"
  section endorses.
- `src/persistence/accessoryContext.ts:8` — "is treated as non-sensitive here"
  became "is non-sensitive". Cosmetic on its face, but it removes the
  passive-with-no-agent construction that implicitly pointed at an unnamed
  decision-maker; `D-01, D-027` still follow it.

**Independent grep — the executor's claim is true for `src/`, and the pattern
set is not complete.** Running the executor's own pattern over `src/` returns
nothing, confirmed. Two gaps are noted under ADVISORY below (A1, A2): the
pattern misses a paraphrased planning reference in `src/`, and it was scoped to
`src/` when the rule's own frontmatter declares `paths: **/*.ts`.

Neither gap is a regression and neither reopens B1 at its site.

## New findings

None BLOCKING. `BLOCKING_COUNT: 0`.

### Assessment of the F1 behavioural change (`cac360d`) — no finding

`src/runtime/accountRuntime.ts:396-490`. Verified against the three things it
claims:

- **The `try` really does hold only the fetch.** Every statement below it is a
  `Map` delete (`health.forgetDevice`, `options.anchors.forget`
  (`arrivalAnchors.ts:181` — `anchors.delete`), `options.failures.forget`,
  `reconciliation.forget`) plus the one call that can throw, which is now
  caught. So no reachable throw is being silently promoted into
  `runPoll`'s generic `recordPollFailure`. The narrowing is safe.
- **The ordering claim holds.** `removeDiscoveredDevice` (`platform.ts:468-485`)
  calls `unregisterPlatformAccessories` *before* deleting from
  `context.accessories`, `basementGuardianAccessories`, and the store. A throw
  there leaves the accessory in every map, so "stays published, stays watched
  and stays distrustable" is literally true, and the runtime-side prunes are
  now correctly gated behind it. This is the safety-relevant half and it is
  right: the old order pruned first and then swallowed the throw, which is
  precisely the false-normal path `D-014` forbids.
- **The retry claim holds with no new state.** `reconciliation.observe`'s
  contract (`src/accessories/reconciliation.ts:28-38`) says a confirmed-absent
  deviceId is reported "on every later call while it stays absent, so a caller
  whose out-of-band final check fails once can retry on the next successful
  poll without extra state". Skipping `forget` on the refusal path is therefore
  the correct way to arm the retry. The test at
  `test/runtime/accountRuntime.test.ts:2646-2676` exercises exactly this and
  asserts the second attempt.

The old code also aborted the whole `confirmedAbsent` loop on the first throw,
so a second confirmed-absent pump was silently skipped. The `continue` closes
that too. `D-014` and `D-029` are both correctly cited
(`.planning/PROJECT.md:148`, `:152`).

**Error handling and logging conventions.** `catch (error: unknown)` with the
error passed as a log parameter rather than interpolated matches the file-local
precedent at `src/platform.ts:359-365`, whose own comment states the reason
("The error travels as a parameter so the redacting logger describes it rather
than a message built here"). `options.log` is the redacting logger
(`platform.ts:543`, wired at `:571`/`:588`), and the interpolated `deviceId` is
the value D-14/D-027 permit in logs. Level `error` is right: this is an
operator-actionable condition that will not self-clear.

**`CHANGELOG.md` entry** — compliant. One user-visible change, one sentence,
21 words (limits are 25 per sentence and 40 per bullet), active voice, simple
tense, leads with the reader's symptom rather than the mechanism, no internals
or rationale. It correctly describes the net user-visible delta: before the
fix the prunes ran first, so the stranded accessory could *not* be marked
untrustworthy; now it is.

### A1 (ADVISORY) — the completeness grep misses a paraphrased planning reference in `src/`

`src/runtime/monotonicClock.ts:36`

> `* a Linux time-namespace probe run during this phase's research offset`

"this phase's research" is a planning-artifact pointer that no token in the
executor's pattern set matches — it contains neither `phase [0-9]` nor
`RESEARCH.md`. It is the weakest of the cases (the phrase attributes an
empirical measurement, which is legitimate WHY, rather than recording
authorship), so I am not calling it a violation. It is here because it is
proof that the pattern set is keyed to the literal shapes the rule's Examples
section lists and will not catch paraphrase. Pre-existing on `b19ea58`, not
introduced by this branch.

### A2 (ADVISORY) — the rule's glob is `**/*.ts`; the sweep covered `src/` only

`.claude/rules/typescript-comments.md` declares `paths: - "**/*.ts"` and its
body opens "Comments **and test/describe titles**". `test/` is in scope, and
five instances survive there, all pre-existing on `b19ea58` and none touched by
this branch:

- `test/runtime/accountRuntime.test.ts:2240` — "identifier a Phase 2 ruling
  admits to logs". This is the verbatim Forbidden `Phase NN` form, and it is
  the same claim B1 was about, in the test file paired with the file B1 fixed.
- `test/accessories/controls.test.ts:587` — "the 2026-08-29 ruling", the twin
  of what `controls.ts:514` just dropped.
- `test/platform.test.ts:2250` — "the drift `05-CONTEXT.md` D-12 exists to
  prevent".
- `test/packaging/dependencyTelemetry.test.ts:13` — "recorded in
  `06-RESEARCH.md`".
- `test/packaging/licenseHeaders.test.ts:48` — "the RESEARCH.md-recommended
  default".

Not blocking: pre-existing, outside the reviewed diff, and outside the `src/`
scope round 1 set. But the branch now has `controls.ts` saying the value is
non-sensitive on its own authority while its own test file still attributes the
same fact to "the 2026-08-29 ruling", and `accountRuntime.ts` clean while
`accountRuntime.test.ts` still says "a Phase 2 ruling". The fix is asymmetric
across the pair. Worth one follow-up commit over `test/` with the same
treatment, and worth widening the grep to `**/*.ts`.

### A3 (ADVISORY) — `accountRuntime.ts:70` asserts the `deviceId` "names no ... account", which two sibling files contradict

The commit under audit rewrote this sentence and left the clause in place:

- `src/runtime/accountRuntime.ts:70` — "it names no route, header, credential
  or account".
- `src/accessories/controls.ts:514` — "It reads `<account-id>_<serial-number>`".
- `src/persistence/accessoryContext.ts:7` — "the vendor `deviceId`, which
  embeds the account identifier".

The fixtures agree with the latter two (`test/platform.test.ts:142`:
`'account-1_serial-1'`, alongside `accountId: 'account-1'`).

There is a defensible reading in which "account" here means the account
*login*, matching AUTH-02's list of credential-shaped things — which is why
this is advisory and not a finding. But the commit was titled "correct three
inaccurate or forbidden source comments", and this is the one privacy-exemption
comment in the branch that a reader could take literally in the wrong
direction: concluding that the `deviceId` carries no account data and therefore
belongs in a support bundle or a committed fixture, which is exactly what
`D-027` forbids. One clause would settle it, e.g. "it embeds the vendor account
id but names no route, header, credential, or account login".

### A4 (ADVISORY) — a permanently refused removal logs unthrottled and doubles the REST poll rate forever

`src/runtime/accountRuntime.ts:448-459`

The documented trigger for the refusal (`test/runtime/accountRuntime.test.ts:337-342`)
is a UUID collision with an accessory another plugin already bridged. That
condition never self-clears. Because the refusal path deliberately skips
`reconciliation.forget`, `confirmedAbsent` stays non-empty on every subsequent
poll, which means:

- the extra final-check `options.api.devices()` at `:418` runs on every poll
  indefinitely, doubling the plugin's inventory request rate against the vendor
  for the life of the process; and
- `options.log.error` at `:457` writes the same line every poll, forever — at
  the 900 s documented default (`src/config.ts:25`), 96 identical error lines a
  day, and 288 at the 300 s minimum.

The retry itself is required and correct, so this is a cost of the fix rather
than a mistake in it. What stands out is that the file already owns the
mechanism for exactly this shape of problem: `options.failures` rate-limits per
kind and `liveReportingKind(deviceId)` two lines above is the established
pattern for a per-device recurring condition. Routing the refusal through
`options.failures.recordFailure` with its own kind would keep the operator
signal, add the recovery sentence when the removal finally lands, and stop the
repetition, at no cost to the retry. Gating the final-check fetch is a separate
and larger question; the log is the cheap half.

### A5 (ADVISORY) — the decision-ID namespace has colliding padded and unpadded forms

The branch's new comments cite `D-014`, `D-029`, `D-19` and `D-20`; existing
comments in the same files cite `D-14`, `D-027`, `D-01`, `D-05`. Both forms are
live and they are **different decisions**:

| Cited | Resolves to |
| --- | --- |
| `D-014` | `.planning/PROJECT.md:148` — Preserve untrusted state |
| `D-14` | a per-device decision recorded in `.planning/WINDOWS.md:59` |
| `D-20` | `.planning/phases/01-secure-cloud-foundation/01-RESEARCH.md:46` — snapshot carries opaque data, no field decoding |
| `D-020` | `.planning/PROJECT.md:151` — Counter lifecycle |
| `D-19` | `04-CONTEXT.md` decision, per `04-02-PLAN.md:269` |
| `D-019` | `.planning/PROJECT.md:150` — Alarm Mute Switch |

Every anchor the branch added is correct as written — I resolved all of them,
including the `(D-19, D-20)` pair newly added to `src/device/state.ts:300-308`,
where `D-20`'s "no field decoding" is precisely the claim the comment makes.
The hazard is that `accountRuntime.ts` now cites `D-14` at line 71 and `D-014`
at line 448, forty lines apart, meaning two unrelated decisions. A reader who
normalises the zero-padding lands on the wrong row. Since the comment rule's
whole premise is that decision IDs are the durable anchor, an index or a single
padding convention would be worth having before more comments accumulate.

## Round-1 advisories, re-checked

- **A1, A2** (`controls.ts`, `serviceCatalogue.ts` planning references) —
  addressed in `2ea3c3a`. See the closure section.
- **A3** (`AccessoryContext` drift), **A4** (`DEFAULT_PLATFORM_DEPS` not
  `readonly`, `platform.ts:493-495`), **A5** (`within()` deadline on a
  synchronous `begin` throw), **A6** (shared grant inherits the first caller's
  deadline), **A7** (`deviceIds().includes`), **A8**, **A9** (`CLAUDE.md`
  Node range vs `package.json`) — unchanged, all still advisory, none touched
  by this branch.

## Other changes in the diff — no findings

- **`8fadb0c` `test/logging.test.ts`** — the added cases pin the two things the
  round-1 `String.raw` change could have silently broken: a credential value
  that begins with `s` and is followed by a second field (catches a value class
  narrowed from `\S` to a literal `s`), and the space-around-separator form
  (catches the separator groups). Both are real regression guards, not coverage
  padding. The rewritten first case still asserts the original substitution.
- **`2ea3c3a` `src/device/state.ts:299-308`** — the comment's old reason ("no
  family adapter exists yet") was stale; the replacement states the durable
  reason and adds the safety consequence. I verified the mechanism it asserts:
  `notify` (`state.ts:318-323`) does return on an empty `changed` list before
  reaching any listener, so a relevance filter here would in fact suppress the
  between-poll live update. `SAFE-03` and `SAFE-07`
  (`.planning/REQUIREMENTS.md:47`, `:51`) are the right requirements for that
  claim.
- **`2ea3c3a` `accountRuntime.ts:591-599`** — the "trust is computed once"
  block was moved from above `monitoringPathNow` to above
  `reportMonitoringHealth`, which is the function whose behaviour it actually
  describes ("It runs on every poll outcome ... `launch()` records its own
  first inventory outcome"). Correct reattachment.
- **`cac360d` `test/runtime/accountRuntime.test.ts`** — the new
  `removalFails` script member and its test assert the full safety set in one
  `deepStrictEqual`: still stored, keeps its anchor, still reported silent, one
  error line, and a second removal attempt on the following poll. That is the
  right assertion shape for this fix.

BLOCKING_COUNT: 0
