---
phase: 05-degraded-operation-and-recovery
plan: 12
subsystem: runtime
tags: [credential-refusal, shadow-lifecycle, no-response, gap-closure]
status: complete
requires:
  - "05-07: the terminal halt reachable from the launch, the poll and the rotation"
  - "05-04: markServicesUnreadable applied from the credentialsRejected branch"
provides:
  - "A credential refusal that is a state the runtime stays in rather than an act it performed once"
  - "A halted runtime that holds no live broker connection and opens none afterwards"
  - "hasFinished(), the one predicate the connect path reads for both a shutdown and a halt"
affects:
  - src/runtime/accountRuntime.ts
  - features/support/steps/homekit.ts
tech-stack:
  added: []
  patterns:
    - "The halt closes the connection through the same closeQuietly helper stop() uses, written `void closeQuietly(shadow);`"
    - "A settling assertion step, so a message the plugin ignores cannot be credited to a step that ran before the message could land"
key-files:
  created: []
  modified:
    - src/runtime/accountRuntime.ts
    - test/runtime/accountRuntime.test.ts
    - features/degradedOperation.feature
    - features/support/steps/homekit.ts
    - README.md
    - .planning/REQUIREMENTS.md
    - .planning/phases/05-degraded-operation-and-recovery/05-VALIDATION.md
    - .planning/WINDOWS.md
decisions:
  - "Closed the shadow at the halt rather than guarding onReportedPatch or re-applying the marking, because it removes the cause instead of the symptom"
  - "Relocated closeQuietly above haltOnTerminalAuthFailure; the lint rule no-use-before-define rejects the new call site otherwise"
  - "Re-cited RES-04 clause 4 rather than returning it to pending, because npm run check came back green"
  - "Left the CHANGELOG credential entry alone; it is accurate as written once this plan ships"
metrics:
  duration: ~50 minutes
  completed: 2026-09-02
actuals:
  tokens: 70950
  tasks: 3
  commits: 3
---

# Phase 5 Plan 12: A Refused Credential That Stays Refused — Summary

A mid-run credential refusal now ends the live connection and refuses to open another, so the one
presentation an owner must act on survives every message that follows it.

## What shipped

`haltOnTerminalAuthFailure` closes the shadow socket, and the predicate `attemptShadow` consults at
both of its guard sites answers for a halt as well as for a shutdown. Before this, the halt stopped
all three loops and left the socket standing. The socket is signed with temporary cloud credentials
that outlive the account credentials the vendor refused, so a heartbeat kept arriving after the
plugin had stopped for good, and an ordinary `updateValue` clears a stored `statusCode`. One
heartbeat therefore returned all seventeen services to a fully vouched-for read, permanently,
because nothing ever pushes again.

| Commit | What |
|---|---|
| `918126f` | The close at the halt, the scenario that proves it, the settling step, the runtime case |
| `6434015` | `hasFinished()` at both `attemptShadow` guard sites, and the two cases that pin them |
| `da9ce31` | README, RES-04 clause 4, the validation rows, the ledger |

## The RED run

Both tiers were red before the source change, for the stated reason.

**Unit.** `D-13 closes the live connection and opens no other for a refusal that follows a healthy
start` failed on `closes: 0` against `closes: 1`, with `clients: 1` and `shadowFailures: []` already
correct — so the case discriminated the close alone and nothing else.

**End to end.** `A credential refused mid-run stays refused when the next heartbeat lands` failed at

```text
Then the broker holds no live connection
    Error: the broker kept holding a live connection within 5000 ms
```

Cucumber stops at the first failing step, so a second RED probe with that one step suppressed was
run to see whether the read-refusal half was also red. It was:

```text
Then the "Sump Pit Flood" service still answers no read for "Status Active"
    Error: the Sump Pit Flood service never refused a read for Status Active: it answered a read
```

That is the defect measured through the repository's own steps: the heartbeat returned the service
to a normal read.

## The five mutations

Every task was committed before its mutation. `git status` confirmed the mutated file was the only
changed one before each revert, and `npm run build:test` ran after each.

| # | Mutation | Result |
|---|---|---|
| A | Remove `void closeQuietly(shadow);` from `haltOnTerminalAuthFailure` | **Kills both tiers.** The scenario fails at `Then the broker holds no live connection`; with that step suppressed it fails at `Then the "Sump Pit Flood" service still answers no read for "Status Active"` with `it answered a read`. The unit case fails on `closes: 0` against `closes: 1` |
| B | Drop the settle, keep mutation A | **The plan's prediction did not hold — see below** |
| C | Mutation A against `A returning heartbeat clears the shadow silence before the next poll` | **Stays green**, 18 steps passed, while the new scenario is dead |
| D | Narrow `attemptShadow`'s entry guard back to `stopped` | Kills `D-13 opens no live connection for a credential grant that lands after a refusal has halted the runtime` on `1 !== 0`, naming the client that was built. The post-start case stays green |
| E | Narrow `attemptShadow`'s post-start check back to `stopped` | Kills `D-13 keeps no live connection that opened while a refusal was halting the runtime` on `closes: 0` against `closes: 1`. The entry-guard case stays green |

D and E each kill exactly one case and leave the other green, so the two guard sites are pinned
independently rather than by one assertion standing in for both.

### Mutation B, stated as the finding it is

The plan asked for mutation B to make the scenario **pass** against the defect, as the proof that the
settle is what lets the scenario see anything. **Run as written, it does not pass.** It still fails
at `Then the broker holds no live connection` — a step the same plan prescribed, placed before the
settling steps, and independent of the settle. The plan did not account for its own step ordering.

Suppressing that one step isolates the half the mutation is about, and there the plan is right:

| Settle | Fix | Broker step | Result |
|---|---|---|---|
| on | off | on | fails at the broker step |
| off | off | off | **passes in 0.3 s** |
| on | off | off | fails at `still answers no read` with `it answered a read` |

The middle row is the recorded proof. Without the settle, the read-refusal steps pass against a
plugin that has been returned to a fully-trusted read, because `world.until` reads its condition
before its first delay and the marking is briefly correct. Restoring the settle alone turns the same
run red. The run time tells the same story: 0.3 s against 2.5 s.

**200 ms was enough** and was not raised. Mutation A kills the scenario with the settle at that
value, which is the acceptance criterion the plan set for sizing it. The constant and its stated
reason are copied from `features/support/steps/shadow.ts`, which already solves this problem for
snapshot assertions.

## What each new branch is reachable from

- **The entry guard.** `refreshCredentials` reaches `openShadow` on the first credential grant, and
  that grant can still be in flight when the poll loop meets the refusal. The unit case arranges
  exactly that: the grant is held unresolved, the poll halts, then the grant lands.
- **The post-start check.** `attemptShadow` awaits `client.start()`, and the poll loop's timer is
  already scheduled when that await begins. The unit case ticks that timer from inside the start
  window, so the halt lands while the connection is opening and finds no client to close.

Neither branch is test-only.

## `onReportedPatch` and the latch are untouched

The 05-08 arrival-driven recovery was not edited. `git diff` over the whole plan matches no line
naming `onReportedPatch`, `reportedShadowSilent`, `applyReportedPatch` or `recordShadowMessage`:

```text
$ git diff -U3 src/runtime/accountRuntime.ts | grep -c "reportedShadowSilent\|onReportedPatch\|applyReportedPatch\|recordShadowMessage"
0
```

`A returning heartbeat clears the shadow silence before the next poll` passes, and mutation C shows
it passes for its own reason rather than because this plan's fix props it up.

## The three existing `SYNC-05` window cases

Unedited and still passing. The test-file diff is pure insertion; the only two lines in it naming
`SYNC-05` are inside comments this plan added.

## RES-04 clause 4 — the branch taken

The plan made the branch turn on the recorded `npm run check` result, not on the `grep` verify, which
passes either way.

**`npm run check` came back green.** Exit 0, 1348 unit tests passed, 96 scenarios and 1011 steps
passed, with typecheck, lint, `fallow` and `format:check` clean. **Branch: re-cite clause 4.**

The amended citation, quoted in full:

> Credential rejection: `features/degradedOperation.feature` — `A credential refused mid-run stays
> refused when the next heartbeat lands`, with `test/runtime/accountRuntime.test.ts` — `D-13 closes
> the live connection and opens no other for a refusal that follows a healthy start` beside it, and
> `test/platform.test.ts` — `leaves every restored accessory readable for a shadow silence` and its
> three siblings holding the `only` direction. **Clause 4 re-cited 2026-09-02 by plan 05-12.** It
> previously named `D-13 pushes a rejected credential and records the authentication stop for a
> refusal that follows a healthy start`, which asserts that the push happened and not that it
> survives; `persistent` is the word the clause turns on, and a live message arriving after the halt
> returned every service to a fully vouched-for read. The scenario named above publishes a changed
> heartbeat after the refusal, and again two simulated hours later, and reads a leak sensor, a
> contact sensor and a switch on each occasion.

Clauses 1-3 and their citations are untouched.

## README — sentence by sentence

Two sentences were added. Every sentence kept in the two paragraphs is listed with what holds it up.

| Sentence | Traces to |
|---|---|
| One failure is different from every other one here. | The contrast between `A transport outage leaves every service readable` and `A credential refused after a healthy start makes every service unreadable` |
| If the vendor refuses your account email or password, the plugin stops and never tries again on its own. | `D-13 leaves the poll, the rotation and the shadow retry chain nothing to do once a mid-run refusal has halted it` |
| A vendor block of this kind lifts only 30 days after the last attempt, so each retry postpones it. | **No assertion.** The figure comes from `src/cloud/auth.ts:35`. Already recorded as WINDOWS ledger entry 3; kept per the plan's instruction |
| The refusal has the same effect whenever it arrives, at the first sign-in or during a run. | `A credential refused after a healthy start makes every service unreadable` for the run, and the restart scenario above it for the sign-in |
| **NEW —** The plugin also closes the connection that carries live changes, so your system cannot send it anything more. | `Then the broker holds no live connection`; `D-13 closes the live connection and opens no other for a refusal that follows a healthy start`; `D-13 opens no live connection for a credential grant that lands after a refusal has halted the runtime`; `D-13 keeps no live connection that opened while a refusal was halting the runtime` |
| Every service then stops answering whether the plugin vouches for it. | The three `still answers no read` steps in the new scenario, on a leak sensor, a contact sensor and a switch |
| Apple Home shows the whole accessory as `No Response`, not the inactive state the other failures use. | The plugin-side half is `readOutcome` returning `refused`, which is the stored `-70402` throwing ahead of the value. **The Apple Home rendering half is the D-10 manual item**, and stays manual |
| Each service keeps the value it last published, and a controller that reads one of those values directly still gets it. | `Then the "Sump Pit Flood" service reports "Leak Detected" as "0"` after both post-refusal heartbeats, the second of which carries a flooding water level |
| **NEW —** This state does not clear itself. | The new scenario's second and third blocks: a changed heartbeat, then two simulated hours and another changed heartbeat, both still refused |
| The log names what happened. | `Then the log names how to correct the account` |
| You must correct the email and the password in the Homebridge settings and then restart the plugin. | The shipped `AUTHENTICATION_STOPPED` line, which says the same thing, plus the new scenario showing nothing else clears it |

Both new sentences are 18 and 6 words, active voice, no threshold constants, and carry no word the
README does not already use for the same thing.

**CHANGELOG: left alone.** The entry reads "When the vendor refuses your account email or password,
at the first sign-in or during a run, Apple Home shows the accessory as `No Response`. Correct the
account and restart Homebridge to clear it." It overstated before this plan and is accurate once this
plan ships, so nothing was changed. An unreleased section describes the change an owner gets, not the
order the work happened in.

## Gates, on both installed Node versions

Node 24 is not installed locally and is not claimed.

| Gate | node v26.7.0 | /usr/bin/node v22.22.2 |
|---|---|---|
| Unit tests | 1348 passed, 0 failed | 1348 passed, 0 failed |
| Cucumber | 96 scenarios, 1011 steps, all passed | 96 scenarios, 1011 steps, all passed |
| Coverage over `src/` | 100.00 / 100.00 / 100.00 | 100.00 / 100.00 / 100.00 |
| `npm run check` | exit 0 | — |
| `npm run fallow` | exit 0 | — |

Against the recorded baseline of 1345 unit tests, 95 scenarios and 986 steps: **+3 unit cases**
(the close, the entry guard, the post-start check), **+1 scenario** and **+25 steps**, which is that
scenario's own length. Nothing was lost.

`npm run fallow` reports one clone group, `features/support/steps/hap.ts:113-124` against
`168-181` — the pre-existing one this phase inherited. No dead-code finding: the `hasStopped` →
`hasFinished` rename left no orphan, because the rename replaced the function rather than adding a
second one.

## Deviations from Plan

### 1. `closeQuietly` had to move (Rule 3 — blocking issue)

**Found during:** Task 1, at the `npm run lint` verify.
**Issue:** `closeQuietly` was declared below `haltOnTerminalAuthFailure`, so the new call site
produced `'closeQuietly' was used before it was defined  @typescript-eslint/no-use-before-define`.
The plan's interface notes recorded both line numbers and did not draw the conclusion.
**Fix:** Moved the declaration above the halt's docblock, body byte-identical, with one added
sentence saying why it now sits between the two ends of the runtime's life that both close the same
connection.
**Commit:** `918126f`. **Ledger:** entry 16.

### 2. `Promise.withResolvers` needed a `lib` this plan does not own

**Found during:** Task 2, at the first `npm run build:test`.
**Issue:** `Property 'withResolvers' does not exist on type 'PromiseConstructor'. Try changing the
'lib' compiler option to 'es2024' or later.` Bumping `lib` would change every file in the project,
which is outside this plan's `files_modified`.
**Fix:** The entry-guard case captures the resolver by hand from a `new Promise` executor, with a
comment saying the placeholder exists only until that executor runs, which it does in the same
statement. No optional call and no uncovered branch.
**Commit:** `6434015`. **Ledger:** entry 16.

### 3. Mutation B did not behave as the plan predicted

Not a code deviation; a measured disagreement with the plan, recorded in full above and as **ledger
entry 15**. The finding the mutation exists to produce still stands, reached by suppressing the one
step that masked it.

## Threat Flags

None. This plan added no network endpoint, no auth path, no file access and no schema change. It
removed one exposure: `T-05-12-03`, the temporary AWS credentials on a socket a halted runtime can no
longer rotate. `package.json` and `package-lock.json` are not in the diff and no package was
installed.

## Known Stubs

None.

## Self-Check: PASSED

All eight files named above exist on disk. All four commits (`918126f`, `6434015`, `da9ce31`,
`55bc443`) are in the branch history. The four `contains` claims from the plan's artifact list are
present in their files: `void closeQuietly(shadow);` in `accountRuntime.ts`, `hasFinished` at its
declaration and both `attemptShadow` guard sites, `stays refused when the next heartbeat lands` in
`degradedOperation.feature`, and `still answers no read` in `homekit.ts`.
