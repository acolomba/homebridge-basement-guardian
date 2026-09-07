---
phase: 01-secure-cloud-foundation
verified: 2026-08-29T19:53:19Z
status: passed
score: 22/22 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 22/22
  scope: "Fourth run. Closes W10 against a real shadow-document observation, and re-checks the phase against a delta of three test-only changes plus a CI workflow change."
  gaps_closed: []
  gaps_remaining: []
  regressions: []
  human_items_closed:
    - "Confirm a real vendor shadow message actually merges into the canonical snapshot — closed by auditing the probe against the source rather than by accepting its summary. See 'Ruling on W10'."
  warnings_closed:
    - "W10 — the shadow document shape is no longer fixture-rested. A real get/accepted document established the shadow watermark from undefined, which is reachable only with carriesObservation true, so neither silent failure path fired. Closed on that line, not on the heartbeat line the brief cited — see W10-R."
  warnings_opened:
    - "W10-R — the partial merge itself is inferred from the confirmed document shape plus a proved pure spread, not observed. The probe output is byte-identical for a correct merge and a silently dropped patch."
    - "W12 — this phase's code was never gated by CI through five certifications, and when it finally ran it was red. Three timing-dependent test defects had survived every green local gate."
    - "W13 — the `features/phase-01-secure-cloud-foundation` branch head is still the red commit. The three fixes live only on the phase-02 lineage."
  human_items_opened: []
deferred:
  - truth: "A user can tell a dead monitoring path apart from a working degraded one"
    addressed_in: "Phase 5"
    evidence: "Phase 5 SC-2: 'Users can distinguish pump-controller link loss, vendor-confirmed device offline, and a degraded REST/MQTT monitoring path'. The representable runtime state and the type contract are delivered in this phase; only the user-facing surfacing defers."
  - truth: "A heartbeat-only telemetry key survives the first poll after shadow ownership is released, marked stale rather than dropped"
    addressed_in: "Phase 3"
    evidence: "Phase 3 SC-6. `pollTelemetry` (src/device/state.ts:164-166) still replaces telemetry wholesale when no watermark is held. Unchanged by this delta."
  - truth: "A rejected complete-shadow request marks the affected device scope untrustworthy"
    addressed_in: "Phase 3"
    evidence: "Phase 3 SC-6. `src/cloud/shadow.ts:257-261` warns and returns. Unchanged by this delta."
human_verification: []
---

# Phase 1: Secure Cloud Foundation Verification Report

**Phase Goal:** Administrator can securely connect one Basement Guardian account and the plugin can maintain trustworthy current cloud state over a long-running Homebridge lifecycle.
**Verified:** 2026-08-29T19:53:19Z
**Status:** passed
**Re-verification:** Yes — fourth run. Previous: `human_needed`, 22/22, with W10 open.

## Scope and method of this run

Three things changed since the previous run: a real shadow observation that speaks to W10, three
test defects the CI runner found and someone fixed, and a CI workflow rewrite.

I re-derived the delta myself rather than reading it. `git diff --stat 6d8a02a..HEAD` reports
**three files, none under `src/`**: `test/cloud/api.test.ts` (+16/-3), `test/platform.test.ts`
(+25/-2), `.github/workflows/build.yml` (+18/-2). `git diff --stat 6d8a02a..HEAD -- src/` is empty.
So every truth about production behaviour rests on code this delta did not reach, and the only
question the delta raises is whether the evidence for those truths got weaker.

I ran the phase gate (exit 0), the coverage gate (exit 0), mutation-tested both repaired cases
against the production code they name, read the CI run logs directly rather than accepting the
summary, and judged the shadow evidence on its own terms.

**On the standing instruction to distrust this phase's history.** The instruction was well aimed
again. This run found that CI had been **red on this phase's code at the moment my previous report
declared it green** — run 33267115276 failed at 18:00:51Z on the phase-01 branch; my report is
stamped 18:43:21Z. That is now fixed and verified green, but it is the second time in two runs that
a green local gate certified something a second machine would have refused. It is recorded as W12
rather than waved through, because the pattern is the point.

## Ruling on W10

**W10 is closed** — but not on the reading the brief offered, and the difference matters enough to
set out. I found the probe itself (`w10-probe.mjs`, 217 lines) and its raw output (`w10-watch.log`)
rather than working from the summary, and read the probe's method against the source it exercises.

### What the probe actually is

It imports `createAccountRuntimeFromConfig` from `dist/runtime/accountRuntime.js` — the production
composition root, compiled, not a re-implementation — and passes a `connect` that wraps the real
`mqtt.connect` and only observes. So the claim that it drove production code is true. On each
message it records `JSON.stringify(runtime.store.snapshot(id))` before, and again 1200 ms after, and
reports "MOVED" on string inequality plus the snapshot's `data` key count, `metadata` key count,
`shadowVersion`, and `deviceTimestamp`.

### The raw observation

```
18:50:00.694 INFO  Discovered 1 device(s).
18:50:00.697 INFO  started; monitoringPath=poll-only
18:50:00.982 CONN  handshake #1 ESTABLISHED
18:50:01.052 MSG   +    1s .../shadow/get/accepted    bytes=1800  keys=[data, state]
         payload.state.reported present=true keys=[data, state]
         SNAPSHOT MOVED  data=19k metadata=3k shadowVersion=393614 deviceTs=1787077555329
18:55:34.225 MSG   +  335s .../shadow/update/accepted bytes=584   keys=[data, state]
         payload.state.reported present=true keys=[data, state]
         SNAPSHOT MOVED  data=19k metadata=3k shadowVersion=393615 deviceTs=1787077555329
19:10:00.749 CONN  socket closed
```

### The decisive line is the first one, not the second

The brief presents the partial heartbeat as "the decisive one for SC-3a". Reading the source, it is
the other way round.

**`get/accepted` is decisive, and it is confound-free.** Trace `shadowVersion`. The poll path,
`toSnapshot` (state.ts:173-186), sets `shadowVersion: previous?.shadowVersion` — it preserves a
watermark and can never establish one. `nextSnapshot` (state.ts:218), the only place a watermark is
established, is called from exactly one site: `applyReportedPatch` (state.ts:304). And
`nextShadowVersion` (state.ts:205-211) opens with

```js
if (!observed && previous.shadowVersion === undefined) { return undefined; }
```

Before this message the snapshot came from the startup poll, so `shadowVersion` was `undefined`. It
came out `393614`. That is only reachable with `observed === true`, and `observed` is
`carriesObservation(patch)`, which is true only when `patch.data` or `patch.state` is defined — which
`toReportedPatch` (shadow.ts:185-192) produces only when `document.state.reported.data` or
`.state` satisfies `isRecord`.

So the first message proves, without relying on the MOVED heuristic at all: a real vendor document
narrowed through `readShadowDocument`, carried `state.reported` nested exactly where the code reads
it, held a real record there, reached `applyReportedPatch`, and established the watermark. The
discard-with-`debug` path at shadow.ts:263-268 did not fire. The no-log `carriesObservation` drop at
state.ts:195-197 did not fire. **That is the whole of W10, answered.**

This also disposes of the one confound worth raising against "MOVED" on a message arriving 358 ms
after discovery: a still-settling startup poll could have moved the snapshot string. It could not
have set `shadowVersion`.

### The heartbeat line does not carry what the brief assigns to it

The brief argues that `shadowVersion` advancing 393614 → 393615 while `data` stayed at 19 keys shows
"the partial patch merged WITHOUT removing the fields it omits". That inference does not hold on this
output, for two independent reasons.

**One: `shadowVersion` advances whether or not the patch observed anything.** Once a watermark
exists, `nextShadowVersion` returns `patch.version ?? previous.shadowVersion` — the `observed` guard
only governs *establishing* a watermark, never advancing one. A patch whose `data` and `state` were
both dropped, but which carried `version: 393615`, produces `shadowVersion=393615` and a changed
JSON string, so it prints `SNAPSHOT MOVED` exactly like a correct merge.

**Two: `data` stays at 19 keys under both hypotheses.** If the heartbeat's seven fields merged, the
result is 19 keys. If the heartbeat's patch was dropped entirely, `previous.data` survives at 19
keys. And once a watermark exists the poll stops rewriting telemetry too — `nextTelemetry`
(state.ts:165) returns `previous.data` whenever `previous.shadowVersion !== undefined` — so the count
is pinned at 19 by three different mechanisms. It cannot discriminate.

The probe printed `shadowVersion` and `deviceTimestamp` but not `receivedAt`, which is the one field
that would have settled it: `nextSnapshot` sets `receivedAt: observed ? receivedAt : previous.receivedAt`,
so a moving `receivedAt` is exactly the signal that the heartbeat observed something. One more field
in the same `console.log` and there would be nothing left to argue about.

So, answering the question as asked: **no, an unchanged key count plus an advanced `shadowVersion`
does not establish SC-3a.** There is a reading where it does not, and it is not a contrived one — a
silently dropped patch carrying a version number produces byte-identical probe output.

### Why W10 still closes, and why SC-3a still holds

W10 was never a doubt about `mergeRecord`. It was the doubt that a real vendor document reaches it,
and that a mismatch would be invisible. The `get/accepted` observation settles that on its own terms,
by a route the poll cannot fake.

SC-3a then follows deductively rather than observationally, and the deduction is short:

- The vendor's document shape is now confirmed: `state.reported` is present at the read nesting and
  `data` is a record.
- `handleMessage` (shadow.ts:255-271) branches on topic only to reject `rejected` leaves. `get` and
  `update` accepted messages go through the same `readShadowDocument` and the same `toReportedPatch`.
  There is no per-topic parsing, so a confirmed shape on one is a confirmed shape on the other — and
  the probe logged `payload.state.reported present=true keys=[data, state]` on the heartbeat too.
- `mergeRecord` (state.ts:119-121) is `{ ...base, ...patch }`: a pure spread over a plain record,
  proved by five unit cases and `features/shadowMerge.feature`. Its behaviour cannot depend on where
  its input came from. There is no failure mode in which a spread preserves omitted keys on synthetic
  records and drops them on vendor records.

That chain is sound, and it is what SC-3a rests on. It is weaker than a direct observation would have
been, and I would rather say so than dress the count up as one. Recorded as **W10-R**: the residual is
that the partial merge is inferred, not seen, and one extra field in the probe would see it.

### A process note

The probe and its log live in a session scratchpad, not in the repository, and nothing in
`.planning/` records this observation (`grep -rl "393614\|SNAPSHOT MOVED" .planning/` finds nothing).
`01-UAT.md` item 2 still carries only its original topic, byte-count, and interval evidence, and its
stated expectation was "arrives on update/accepted **and merges into the canonical snapshot**". This
report is currently the only place the second clause has evidence behind it. It belongs appended to
that item, together with the caveat above about which of the two messages carries the weight.

## The test delta: what I checked

**No source file moved.** Confirmed from the diff, not from the brief:
`git diff --stat 6d8a02a..HEAD -- src/` produces no output. The changed files are two test files and
one workflow file. `git diff 6d8a02a..HEAD -- test/ | grep -cE "^-\s*(test|it|describe)\("` returns
**0** — no test declaration was removed.

**`test/cloud/api.test.ts` — does the repaired case still constrain what it names?** The case
`aborts a device request on its own deadline while the root signal stays open` no longer sets
`requestTimeoutMs: 10` and wait for a real `AbortSignal.timeout`; it stubs the deadline and expires
it. That could easily have turned the case into a test of the stub. I checked with two mutations of
the compiled artifact:

1. Replacing the composition with the bare root signal (`const deadline = signal`) — caught: two
   other cases fail on assertion, and this case never settles.
2. The surgical one, which only this case can catch: keep `AbortSignal.timeout(call.deadlineMs)`
   being called, but do not compose it into the request
   (`AbortSignal.timeout(call.deadlineMs); const deadline = signal;`). Under this mutation the two
   `deadlines a ... route` cases still pass, and the suite goes non-green **solely** through this
   case, at `cancelled 1` with `'Promise resolution is still pending but the event loop has already
   resolved'`.

So the case does constrain the composed deadline. **But it catches a break by hanging, not by
failing.** Run alone under mutation 2 it did not terminate within 60 s. That is the same mechanism
that produced the original CI failure, and the workflow sets no `timeout-minutes`, so a future break
of this kind would occupy a runner until GitHub's six-hour default. Recorded as W12-b. It is not a
regression — before the fix the case behaved this way with *correct* production code — but the
repair moved the hang from "always" to "only when the deadline is broken" rather than removing it.

**`test/platform.test.ts` — does `until` weaken the assertion?** No; it strengthens the diagnostic. I
mutated the compiled token-cache write to skip the `rename` (src/cloud/auth.js:121) and ran the
AUTH-02 case. It failed in 5.03 s with `Error: timed out waiting for the token cache file to be
written`, naming the condition, instead of failing on a downstream `readdir` comparison. The
assertion that follows the wait is still stronger than the wait: `until` waits for the cache file to
be *present*, the assertion requires the directory to hold *exactly* that one entry, so the
temporary-file cleanup is still asserted.

The other repaired case waits for `requestSpy.mock.callCount() >= 2` and then asserts
`requestsAfterLaunch === 2` with `requestsAfterShutdown === 0`. The wait is a weaker form of the
assertion, which is the usual tautology risk, but a third request would land in the
post-shutdown count and fail the case. Nothing was weakened.

**The rule the fix articulated is not enforced anywhere else.** "A fixed drain is sound only for a
negative assertion" is right, and `test/runtime/accountRuntime.test.ts` still has its own 8-turn
`settle()` used **57 times**, many of them before positive assertions
(`assert.deepStrictEqual(logged, ['info Discovered 1 device(s).'])`, connection counts, credential
registrations). I checked whether that is the same latent defect rather than assuming either way:
that harness enables `t.mock.timers`, serves `CloudApi` from an in-process object returning
already-resolved promises, uses a socket-free fake shadow and a synthetic clock, and touches no
filesystem. Its chains are bounded microtask chains, which resolve in a fixed number of turns
regardless of machine speed — unlike the real `fs` write that broke the platform case. Sound today,
and CI now confirms it on two Node versions on a foreign runner. But the invariant that makes it
sound is unstated, so a future `await` on real I/O anywhere in that path turns 8 back into a guess.
Recorded as W12-c.

## The CI discovery

This warrants its own record, and it is the reason `passed` here means something different from
`passed` last time.

**What I verified directly, from `gh run list` and `gh run view --log`, not from the brief:**

| Run | Branch / commit | Trigger | Result | What it says |
|---|---|---|---|---|
| 33267115276 | `features/phase-01-secure-cloud-foundation` @ c269a23 | push | **failure** at 18:00:51Z | On Node 22: `not ok 20 - aborts a device request on its own deadline...` with `failureType: 'cancelledByParent'`, and **seven cases cancelled behind it** — including all three SYNC-01 prohibition cases. On both 22 and 24: `AUTH-02 caches the granted token...` AssertionError. `# cancelled 8`. |
| 33267116120 | `features/phase-02-...` | push | failure at 18:00:51Z | Same defects, same code. |
| 33270739587 | `features/phase-02-...` | workflow_dispatch | failure at 19:23:12Z | After the api.test.ts fix: `tests 497 / pass 496 / fail 1 / cancelled 0`. The remaining failure is the AUTH-02 token cache case. |
| **33271243443** | `features/phase-02-...` | workflow_dispatch | **success** at 19:35:04Z | `build (22.x)` and `build (24.x)` both green. `ℹ tests 497 / pass 497 / fail 0 / cancelled 0 / skipped 0`, `35 scenarios (35 passed)`, `299 steps (299 passed)`. |

Three things follow.

**First, the timing.** My previous report is stamped 18:43:21Z. Run 33267115276 failed at 18:00:51Z,
42 minutes earlier, on the exact branch that report was certifying. So this phase's most recent
certification was issued while a public CI record of its failure already existed. Nobody looked.

**Second, what was cancelled matters.** Truth 17 (SYNC-01, "exactly four typed routes exist and no
excluded route is constructible") was certified in three consecutive reports on the strength of three
prohibition cases. On Node 22 in that failing run, all three were `cancelledByParent` — they did not
execute. The evidence for a prohibition was, on that runner, not obtained. It is obtained now: run
33271243443 shows 497 pass / 0 cancelled on both Node versions. Truth 17 is materially better
supported than it was, and it is worth being explicit that it was worse supported than claimed.

**Third, a count correction.** The brief states "Node 22 and 24 in Docker: 496 pass" and commit
65c9cb9's message says "Green on Node 22 and 24 at 496 tests". 496 is the pass count of the *failing*
19:23 run (`pass 496 / fail 1`). The green run and my local gate both report **497 pass / 0 fail /
0 cancelled / 0 skipped**. Immaterial to the verdict; recorded because the whole point of this run is
not to take counts on trust.

**On the workflow rewrite.** Scoping to `main` pushes, PRs into `main`, and `workflow_dispatch` is a
defensible cost decision, and the Node matrix change implements D-032's own instruction correctly —
`engines.node` is `^22.10.0 || ^24.0.0` and Homebridge 1.8 accepts `^22`, so no Homebridge 1.x
coverage is lost. But note what it does to the mechanism that caught these defects: run 33267115276
was a **push-triggered run on a feature branch**, and that trigger no longer exists. Under the new
configuration the same three defects would have survived until a PR into `main` was opened. The PR
gate is real and merges go through PRs, so nothing reaches `main` ungated — the exposure is the
length of a feature branch's life, which for this phase was 174 commits and five certifications.
Recorded as W12-a, not as a defect.

## Goal Achievement

### Observable Truths

Rows unchanged in substance from the previous run carry their evidence forward; the **Status** and
**Evidence** columns say where this run added, corrected, or re-derived something.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | **SC-1** Administrator can install the dynamic platform and save one valid account through the settings form, with the password-storage warning visible | ✓ VERIFIED | Carried. `01-UAT.md` item 1: Homebridge 2.4.0 container, UI v5.28.0, packed 0.1.0 tarball, five behaviours read off the rendered form. `config.schema.json` unchanged since `1f42292` and not in this delta. |
| 2 | **SC-2a** Missing configuration leaves the plugin idle with a clear log message | ✓ VERIFIED | `src/platform.ts:62-66`; four `features/configuration.feature` scenarios. Green in this run's gate and in CI 33271243443. |
| 3 | **SC-2b** Valid configuration authenticates without exposing credentials or tokens | ✓ VERIFIED | `features/authentication.feature`; `src/logging.ts` wraps all seven `Logging` members. |
| 4 | No account identifier reaches the log (PROJECT.md Privacy) | ✓ VERIFIED — re-derived this run | Not carried. `grep -rnE "log\.(info\|warn\|error\|debug)\(" src/ \| grep -E '\$\{\|\+ '` returns exactly **three** hits: `platform.ts:63` (a validation reason, which `src/config.ts:107-109` returns without interpolating the address), `runtime/failureLog.ts:66` (a failure kind), `runtime/accountRuntime.ts:493` (a device count). None can carry an email or an account identifier. |
| 5 | **SC-3a** A partial shadow `reported` patch merges and removes no field it omits | ✓ VERIFIED — **W10 closed** | `mergeRecord` at `state.ts:119-121`; `features/shadowMerge.feature` 'A partial heartbeat keeps the fields it omits'. **New:** the vendor's document shape is now confirmed on real traffic — a real `get/accepted` document established the watermark from `undefined` to 393614, which `nextShadowVersion` (state.ts:205-211) reaches only with `carriesObservation` true. SC-3a follows from that confirmed shape plus `mergeRecord` being a proved pure spread. The partial merge itself is inferred, not observed: see "The heartbeat line does not carry what the brief assigns to it" and W10-R. |
| 6 | **SC-3b** A `desired`/requested value never becomes reported device state | ✓ VERIFIED | Structural. `ReportedPatch` (`state.ts:52-58`) has no member able to hold it; `toReportedPatch` (`shadow.ts:185-192`) reads only `document.state.reported`; `SHADOW_TOPICS` carries no delta or wildcard topic. |
| 7 | **SC-3c** An omitted-field document cannot corrupt a previously accepted value | ✓ VERIFIED — **W10 closed** | `carriesObservation` (state.ts:195-197), `nextShadowVersion` (205-211), `nextSnapshot` (218-230) unchanged and green. The `get/accepted` observation proves `carriesObservation` returned true on a real vendor document rather than dropping it with no log — the watermark could not otherwise have been established. |
| 8 | **SC-3d** REST snapshots and shadow updates produce one current state per device, neither reverting the other | ✓ VERIFIED — **both halves now live-confirmed** | `pollTelemetry` (state.ts:164-166) and the four-reason `releaseShadowSource` loop unchanged and green. REST half confirmed by `01-UAT.md` items 1 and 3; shadow half confirmed by the W10 observation. Neither half is fixture-only any more. |
| 9 | **SC-4a** A complete shadow is requested on the first connection and again after every reconnect | ✓ VERIFIED | `requestEveryShadow` (shadow.ts:340-363); two `shadowLifecycle.feature` scenarios assert 1 then 2 requests across a forced reconnect. Reconnect is our own path, so no vendor assumption is involved. |
| 10 | **SC-4b** Credential rotation refreshes the cache in place without disturbing the live connection | ✓ VERIFIED | `signHandshake` (shadow.ts:232-248) re-reads the cache per handshake; `features/credentialRotation.feature` asserts 1 handshake across rotation. |
| 11 | **SC-4c** Reconnect backoff is capped and a single transport failure produces exactly one retry chain | ✓ VERIFIED | `retryPolicy.ts` pending guard plus `Math.min(maxDelayMs, ...)`; all nine backoff cases and the duplicate-notification case green in this run's gate and in CI. |
| 12 | **SC-4d** Shutdown during an in-flight retry wait, an in-flight request, and an open shadow connection produces no unhandled rejection; `stop()` is idempotent | ✓ VERIFIED | `accountRuntime.ts:551-559`; six `features/lifecycle.feature` scenarios. |
| 13 | **SC-4e** Repeated connection cycles leave no superseded connection driving live state and no connection nothing will close | ✓ VERIFIED | `src/cloud/shadow.ts` not in this delta. Re-read: `get connected() { return !closing && (connection?.live ?? false); }` at shadow.ts:443-444. |
| 14 | The runtime can express that monitoring has stopped, and its monitoring-path contract matches its declared consumer's | ✓ VERIFIED | `accountRuntime.ts:233-239`; one `MonitoringPath` declaration (`src/device/health.ts:23`). Observed live reading both `shadow-and-poll` and `unavailable` (`01-UAT.md` item 3). |
| 15 | `npm run check` passes typecheck, lint, all three fallow sub-commands, format:check, and both suites | ✓ VERIFIED — **now on a second machine** | Exit 0 in this run: 497 unit tests, 0 fail, 0 cancelled, 0 skipped, 0 todo, 30 suites; 35 scenarios / 299 steps; fallow 0 issues, 0 above threshold, maintainability 92.9, duplication 0.0%. `npm run test:coverage:all` exit 0 at 100.00 / 100.00 / 100.00 on every file. **The material change:** CI run 33271243443 reproduces the same 497/497 and 35/299 on Node 22.x and 24.x on a foreign runner. Until 19:35Z today, every green gate this phase ever cited came from one machine. |
| 16 | `npm pack --dry-run` lists only the allowlisted files (D-21) | ✓ VERIFIED | `test/packedArtifact.test.ts` green inside the gate against a real `npm pack --dry-run --json`; the packed 0.1.0 tarball was installed into a Homebridge 2.4.0 container and ran. |
| 17 | Exactly four typed REST routes exist and no excluded route is constructible (SYNC-01) | ✓ VERIFIED — **evidence now actually obtained on both Node versions** | `ROUTES` (api.ts:27-32) holds exactly four; `devicePath` is the only builder; `Record<keyof CloudApi, …>` at api.test.ts:599 and :610 is the type-level door. The three prohibition cases at `api.test.ts:635-670` are intact. Correction on the record: in the red CI run all three were `cancelledByParent` on Node 22 and did not execute. They execute and pass in 33271243443. |
| 18 | The token cache lives under the Homebridge storage path with owner-only mode and a salted email fingerprint (AUTH-02, D-08) | ✓ VERIFIED — **its proving test repaired and mutation-checked** | Exclusive create at `0o600` (`flag: 'wx'`), random temporary suffix, cleanup on failed rename — unchanged. The case that proves the file lands is the one CI failed on; it now waits on the condition and, with the `rename` mutated out, fails in 5.03 s naming what it waited for. 01-SECURITY finding 2 qualification carried: the cached `id_token` payload carries an `email` claim. |
| 19 | Every module of the adopted tree exists, not-yet-wired modules are declaration-only, and the dead-code gate passes on reachability (D-17) | ✓ VERIFIED | `fallow dead-code --fail-on-issues` clean; `.fallowrc.json` not in this delta and `ignoreFindings` still holds exactly 8 entries. |
| 20 | The deterministic suite runs offline against transport-level fakes naming no client library (D-10, D-11) | ✓ VERIFIED | 35 scenarios green offline, locally and on the CI runner. W11 residual on the REST fake carried. |
| 21 | The REST client reads the vendor device routes as the vendor actually sends them (WIRE-01/02/03) | ✓ VERIFIED | Carried, with the three mutations from the previous run standing (`src/cloud/types.ts` and `api.ts` are not in this delta). Live-confirmed by `01-UAT.md` items 1 and 3. |
| 22 | No vendor field the plugin does not read crosses the REST boundary (AUTH-02, T-GX6-01) | ✓ VERIFIED | Carried. `toApiDevice` (types.ts:158-167) builds field by field and never spreads; `toSnapshot` (state.ts:173-190) rebuilds field by field downstream. Asserted at `api.test.ts:234-247` against a 13-key fixture; mutation-proved in the previous run and the file is unchanged. |

**Score:** 22/22 truths verified (0 present, behavior-unverified). No overrides applied.

### Where each must-have rests

The table the previous run introduced, updated. Row 5 is the one that changed, and it is why the
status changed.

| Must-have group | What supports it inside the suite | What supports it outside the suite |
|---|---|---|
| 1 — settings form (SC-1) | `config.schema.json` values, `test/packageManifest.test.ts` | A human read the rendered form in Homebridge 2.4.0 / UI 5.28.0 from the packed tarball. |
| 17, 21, 22 — REST wire shape and boundary privacy | 29 `api.test.ts` cases, 77 `types.test.ts` cases, mutation-proved | A live vendor measurement (`.planning/intel/constraints.md` §6) and two live runs where discovery succeeded. |
| 9-14 — connection lifecycle, rotation, backoff, shutdown (SC-4) | 57 `shadow.test.ts` cases, `features/lifecycle.feature`, `credentialRotation.feature` | A real SigV4 handshake against the real AWS IoT endpoint through the shipped presigner: ESTABLISHED, 0 errors, no 403, live `monitoringPath` observed. |
| 2-4, 18-20 — refusal, redaction, token cache, tooling | Cucumber scenarios and unit cases | Structural, local, and observable in the repository. Now also green on two Node versions on a runner nobody controls. |
| **5, 7, 8 (shadow half) — shadow document → canonical snapshot (SC-3)** | `shadowMerge.feature`, `state.test.ts`, `shadow.test.ts` | **Two real vendor documents**, on `get/accepted` and `update/accepted`, observed reaching `applyReportedPatch` and moving the snapshot. Was "Nothing" in the previous run. |
| 15 — the gate itself | `npm run check` on a developer machine | CI 33271243443, Node 22.x and 24.x, 497/497 and 35/299. Was single-machine through five certifications. |

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | A user can tell a dead monitoring path apart from a working degraded one | Phase 5 | Phase 5 SC-2. Representable state and type contract delivered here; only the surfacing defers. |
| 2 | A heartbeat-only telemetry key survives the first poll after ownership release, marked stale rather than dropped | Phase 3 | Phase 3 SC-6. `state.ts:164-166` unchanged by this delta. |
| 3 | A rejected complete-shadow request marks the affected device scope untrustworthy | Phase 3 | Phase 3 SC-6. `shadow.ts:257-261` unchanged by this delta. |

### Required Artifacts

Only artifacts this delta touched carry new detail. Everything else is carried forward and was
re-confirmed present, substantive, wired, and green under this run's gate and under CI 33271243443.

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `test/cloud/api.test.ts` | Client-level coverage on the measured shape, the SYNC-01 doors, and deadline behaviour | ✓ VERIFIED — repaired, not weakened | +16/-3. The abort case now owns and expires its deadline via `stubDeadlines`. Mutation-checked twice; the surgical mutation is caught by this case alone. No test declaration removed; 29 cases as before. Both SYNC-01 doors unchanged at :599, :610, :635-670. |
| `test/platform.test.ts` | Platform lifecycle, listener registration, token cache landing | ✓ VERIFIED — repaired, and the diagnostic improved | +25/-2. Adds `until(reached, what)` with a 5 s wall-clock deadline; replaces `settle()` at the two positive assertions only. `settle()` is deliberately kept at the three post-shutdown negative assertions, which is the correct application of the rule. Mutation-checked against `auth.js` `rename`. |
| `.github/workflows/build.yml` | The project's only automated gate | ✓ VERIFIED — with W12 | Triggers `push:[main]`, `pull_request:[main]`, `workflow_dispatch`. Matrix `[22.x, 24.x]`, correct against `engines.node` `^22.10.0 \|\| ^24.0.0` and D-032. Steps run lint, format:check, typecheck, fallow, `npm test`, build — the same commands as `npm run check`. It does **not** run `test:coverage:all`, so the 100% gate stays developer-machine-only (pre-existing). No `timeout-minutes` on the job. |
| `src/**` (all) | As previously verified | ✓ VERIFIED (carried forward, delta-confirmed) | `git diff --stat 6d8a02a..HEAD -- src/` is empty. Every production truth rests on code this delta did not reach. Spot re-reads: shadow.ts:443-444, accountRuntime.ts:233-239, state.ts:119-121, shadow.ts:185-192, api.ts:130. |
| `src/cloud/types.ts`, `src/cloud/api.ts` | Wire types, envelope guards, boundary normalizer | ✓ VERIFIED | Unchanged since the previous run's mutation proofs. 100% lines / branches / functions on both. |
| `config.schema.json`, `.fallowrc.json`, `features/**`, all other `test/**` | As previously verified | ✓ VERIFIED (carried forward) | Not in this delta. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/cloud/shadow.ts` `handleMessage` | `src/device/state.ts` `applyReportedPatch` | `options.onReportedPatch(route.deviceId, toReportedPatch(document))` | ✓ WIRED — **now confirmed on real vendor traffic** | shadow.ts:271. Previously the one link proved only against harness-built documents. Two real documents traversed it and moved the snapshot. |
| `src/cloud/api.ts` | `src/cloud/types.ts` | `accepts: isWireDeviceListResponse` / `isWireDeviceResponse` | ✓ WIRED | api.ts:152, :157. Unchanged. |
| `src/cloud/api.ts` `send` | the composed request deadline | `AbortSignal.any([signal, AbortSignal.timeout(call.deadlineMs)])` | ✓ WIRED — mutation-proved this run | api.ts:130. Breaking the composition while leaving `AbortSignal.timeout` called is caught by exactly one case. |
| `src/cloud/auth.ts` | the Homebridge storage path | `writeFile(temporary, …, { mode: 0o600, flag: 'wx' })` then `rename` | ✓ WIRED — mutation-proved this run | auth.ts:213, :216. Removing the rename fails AUTH-02 in 5.03 s with a named condition. |
| `src/cloud/types.ts` `toApiDevice` | `src/device/state.ts` `toSnapshot` | `ApiDevice` | ✓ WIRED | Unchanged; typecheck clean. |
| `features/support/fakeRestApi.ts` | the production narrowing path | Cucumber discovery scenarios | ✓ WIRED | Unchanged. W11 residual carried. |
| `src/cloud/shadow.ts` | `src/runtime/retryPolicy.ts` | `options.retry.schedule` | ✓ WIRED | shadow.ts:287. `gsd query verify.key-links` still reports 1/2 for 01-14-PLAN.md — the W7 double-escaped pattern, a planning-artifact defect. |
| `src/runtime/accountRuntime.ts` | `src/device/health.ts` | `MonitoringPath` contract | ✓ WIRED | `import type` at line 21; one declaration in the repo. |
| `src/runtime/accountRuntime.ts` | `src/device/state.ts` | `handleShadowDisconnected` → `store.releaseShadowSource()` | ✓ WIRED | accountRuntime.ts:274; four unit cases, one per disconnect reason. |
| `test/cloud/api.test.ts` | `src/cloud/api.ts` | `Record<keyof CloudApi, …>` breaks the build on a fifth operation | ✓ WIRED | :599, :610. `npm test` runs `build:test` first, so the door sits inside the gate — and now inside CI. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `shadow.ts toReportedPatch` | `data`, `state`, `version` | `document.state.reported.*` from a real MQTT payload | **Yes — observed** | ✓ FLOWING. Was the one ⚠️ row. Real `get/accepted` and `update/accepted` payloads carried `state.reported` with `[data, state]` and produced a snapshot with 19 data keys, 3 metadata keys, and `shadowVersion` 393614 then 393615. |
| `api.ts devices()` | `body.devices` | live `fetch` → `readBody` → `narrow` → `.map(toApiDevice)` | Yes | ✓ FLOWING — confirmed against the live vendor. |
| `api.ts device()` | `body.device` | live `fetch` → `readBody` → `narrow` → `toApiDevice` | Yes | ✓ FLOWING |
| `toApiDevice` | `serialNumber` | `device.attributes.serialNumber` | Yes | ✓ FLOWING — no `??` fallback, so a missing serial is refused at the guard rather than defaulted. |
| `state.ts toSnapshot` | `identity`, `connectivity`, `data` | field-by-field copy from `ApiDevice` | Yes | ✓ FLOWING |
| `state.ts nextSnapshot` | `data`, `metadata` | `mergeRecord(previous, patch)` | Yes | ✓ FLOWING — merged real vendor keys this run. |
| `shadow.ts` | `connected` | `closing` and `connection.live` | Yes | ✓ FLOWING (carried forward) |
| `accountRuntime.ts` | `monitoringPath` | four held facts | Yes | ✓ FLOWING — observed live reading both values. |

### Behavioral Spot-Checks

Every mutation below was applied to the compiled `dist-test/` artifact (a gitignored build output),
run, and reverted. `git status --porcelain` is empty at the end of this run, `dist-test/` holds the
unmutated lines (`api.js:88` and `auth.js:121` re-read and confirmed), and no `MUTATED` marker
survives anywhere.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full phase gate | `npm run check` | exit 0 | ✓ PASS |
| Unit suite | inside `check` | 497 tests, 497 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo, 30 suites | ✓ PASS |
| Acceptance suite | inside `check` | 35 scenarios, 299 steps, all pass | ✓ PASS |
| Whole-project coverage | `npm run test:coverage:all` | exit 0; 100.00 / 100.00 / 100.00 on all files, `api.js`, `types.js`, `state.js`, `shadow.js`, `auth.js`, `platform.js` each 100/100/100 | ✓ PASS |
| Dead-code / health / dupes | `fallow` inside `check` | 0 issues; 0 above threshold; maintainability 92.9; duplication 0.0% | ✓ PASS |
| **CI on a foreign runner** | `gh run view 33271243443 --log` | `build (22.x)` and `build (24.x)` both green; `tests 497 / pass 497 / fail 0 / cancelled 0 / skipped 0`; `35 scenarios (35 passed)`; `299 steps (299 passed)` | ✓ PASS — read from the run log, not from the summary |
| **Deadline door (truth 18 / api.ts:130), coarse** | replaced the composed deadline with the bare root signal in compiled `api.js`, reran `api.test.js` | ✖ 2 assertion failures + `cancelled 1` | ✓ PASS |
| **Deadline door, surgical** | kept `AbortSignal.timeout` called but uncomposed, reran `api.test.js` | only the repaired abort case goes non-green — `cancelled 1`, `'Promise resolution is still pending…'` | ✓ PASS — the case constrains what it names (see W12-b on the failure *mode*) |
| **Token-cache door (truth 18)** | removed `await rename(temporary, target)` from compiled `auth.js:121`, reran the AUTH-02 case | ✖ `Error: timed out waiting for the token cache file to be written` after 5.03 s | ✓ PASS — `until` fails naming its condition |
| Truth 4 re-derivation | `grep -rnE "log\.(info\|warn\|error\|debug)\(" src/ \| grep -E '\$\{\|\+ '` | exactly 3 hits: a validation reason, a failure kind, a device count | ✓ PASS |
| No removed tests | `git diff 6d8a02a..HEAD -- test/ \| grep -cE "^-\s*(test\|it\|describe)\("` | 0 | ✓ PASS |
| No source change | `git diff --stat 6d8a02a..HEAD -- src/` | empty | ✓ PASS |
| Anti-pattern scan, 3 changed files | `grep -nE "TBD\|FIXME\|XXX\|TODO\|HACK\|PLACEHOLDER\|not yet implemented\|coming soon"` | 0 debt markers | ✓ PASS |
| Secret scan, 3 changed files | `grep -nE "AKIA\|eyJ[A-Za-z0-9]\|[a-f0-9]{32}"` | 0 matches | ✓ PASS |
| Working tree | `git status --porcelain` | empty | ✓ PASS |

### Probe Execution

No `scripts/*/tests/probe-*.sh` exist in this repository and no plan or summary declares one, so the
conventional probe contract is N/A.

One ad-hoc probe governs a must-have and is therefore treated as evidence rather than narration:
`w10-probe.mjs` (217 lines) with its output `w10-watch.log`, both in a session scratchpad rather than
the repository. I could not re-run it — it needs the real account and real hardware — so I audited it
instead of executing it: I read what it imports (`createAccountRuntimeFromConfig` from `dist/`, the
production composition root), what it substitutes (nothing; `connect` wraps the real `mqtt.connect`
and only observes), and what each printed field can and cannot mean, checked against `src/device/state.ts`
and `src/cloud/shadow.ts`. That audit is the "Ruling on W10" section, and it changed the reading: the
line the brief called decisive is not, and a different line is.

| Probe | Command | Result | Status |
|-------|---------|--------|--------|
| `w10-probe.mjs` (scratchpad, not in repo) | not re-runnable — requires the live account and device | `get/accepted` established `shadowVersion` from `undefined` to 393614; `update/accepted` advanced it to 393615; both moved the snapshot | ✓ AUDITED — accepted for W10's core proposition, not for the partial-merge inference (W10-R) |

Other behavioural evidence came from the three mutations above, from `npm run check` and
`npm run test:coverage:all` run by this verifier, from CI run 33271243443 read from its log, and from
the live runs recorded in `01-UAT.md`.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CONF-01 | 01-01, 01-02 | Dynamic-platform package, TypeScript ESM, supported runtimes, child bridge | ✓ SATISFIED | `test/packageManifest.test.ts` pins `engines`, `type`, `main`, name, keywords. Both bridge modes exercised on Homebridge 2.4.0. The CI matrix now matches `engines.node` exactly, which it did not before (it tested Node 20, which `engines` refuses). |
| CONF-02 | 01-04, 01-15 | Settings GUI, strict validation, masked password, plaintext disclosure | ✓ SATISFIED | `01-UAT.md` item 1, five behaviours read off the rendered form. |
| CONF-03 | 01-02, 01-04, 01-11, 01-15 | Absent or invalid credentials → clear error, no network/timer/accessory work | ✓ SATISFIED | Four `configuration.feature` scenarios, each asserting no listener and no request. |
| CONF-04 | 01-02, 01-04 | Optional `clientId` override, no other constant exposed | ✓ SATISFIED | Single precedence rule against `PROTOCOL.clientId`. |
| CONF-05 | 01-04, 01-10 | `pollInterval` 300-3600 default ~900; `offlineConfirmationPollCount` 1-8 default 2 | ✓ SATISFIED | Bounds in `config.ts` and the schema. The 898-second measured heartbeat cadence (`01-UAT.md` item 2) sits under the ~900 default. |
| AUTH-01 | 01-02, 01-05, 01-08, 01-10, 01-11, 01-16 | Unattended password-realm grant, cached token reuse, reauthentication | ✓ SATISFIED | Plus a live end-to-end run: the grant fed a real `GET /credentials/aws` and a real IoT handshake. |
| AUTH-02 | 01-04, 01-05, 01-11, 01-15, 01-16 | Token under storage path, owner-only, no secret in logs or context | ✓ SATISFIED — **its proving case now genuinely runs everywhere** | Truth 18. The case that asserts the cache file lands was failing on both CI Node versions until 19:35Z; it is repaired, mutation-checked, and green on both. Qualified by 01-SECURITY finding 2. |
| SYNC-01 | 01-02, 01-06, 01-08, 01-16 | Four typed routes, no excluded route | ✓ SATISFIED — with the record corrected | Truth 17. Both prohibition doors intact; all three prohibition cases now execute and pass on Node 22 and 24, having been cancelled on Node 22 in the red run. |
| SYNC-02 | 01-02, 01-03, 01-09, 01-11, 01-13 | One canonical snapshot per device, ignore `desired`, preserve omitted | ✓ SATISFIED | **Was ⚠️ SATISFIED WITH RESIDUAL.** The residual was W10. A real vendor document now parses into a patch and merges. `desired` remains structurally unrepresentable. |
| SYNC-03 | 01-09, 01-10, 01-11, 01-13 | Complete shadow after startup and reconnect; poll as backstop; no replay | ✓ SATISFIED | `releaseShadowSource` on every disconnect reason; four-reason loop green. The real `get/accepted` observed at +3 s is the startup complete-shadow request working end to end. |
| SYNC-04 | 01-07..01-12, 01-14, 01-18 | Rotate in place, failed refresh stays scheduled, capped retries free of duplicate loops | ✓ SATISFIED | The presigner produces a URL the real AWS IoT broker accepts. Rotation and reconnect remain fake-exercised, which is appropriate: those are local paths with no vendor-shape dependency. |
| SYNC-05 | 01-02, 01-06, 01-07, 01-10, 01-11, 01-14, 01-17, 01-18 | Idempotent abortable lifecycle, no unhandled rejection, no leaked work | ✓ SATISFIED | Six `lifecycle.feature` scenarios plus a live observation of `monitoringPath` moving to `unavailable` after a clean stop. |
| WIRE-01..04 | quick 260829-gx6 | Vendor device-route envelopes and nested serial number | ✓ SATISFIED | Truths 21 and 22. Task-local IDs; not Phase 1 roadmap requirements, so they raise no orphan. |
| REL-04 | 01-19 (early) | Packed-package checks exclude secrets and identifiers | ℹ EARLY COVERAGE | REQUIREMENTS.md maps REL-04 to Phase 6. Noted so Phase 6 knows the assertion exists. |

**Orphaned requirements:** none. All twelve IDs the roadmap assigns to Phase 1 (CONF-01..05,
AUTH-01, AUTH-02, SYNC-01..05) appear in at least one plan's `requirements` field and each resolves
above.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | `TBD` / `FIXME` / `XXX` / `TODO` / `HACK` across `src/`, `test/`, `features/`, and the three delta files | none | 0 found. |
| — | — | Skipped or todo tests | none | 0 across 497, locally and in CI. |
| `.github/workflows/build.yml` | 3-13 | **This phase's code was never gated by CI until after five certifications, and when it finally ran it was red** | ⚠️ **W12 (new)** | 174 commits, five certifications, all citing `npm run check` green on one machine. Run 33267115276 failed on Node 22 with 8 cancelled cases, including all three SYNC-01 prohibition cases, plus an AUTH-02 assertion failure on both Node versions. Now green (33271243443). Three sub-notes below. |
| `.github/workflows/build.yml` | 6-9 | The trigger that caught these defects no longer exists | ℹ **W12-a** | The failing run was push-triggered on a feature branch. Triggers are now `main` push, PR into `main`, and `workflow_dispatch`. Nothing reaches `main` ungated, so the exposure is bounded by a branch's life — which here was 174 commits. `workflow_dispatch` is the mitigation and it was used correctly today. |
| `.github/workflows/build.yml` | 16-18 | No `timeout-minutes`, and a hang is a reachable failure mode | ℹ **W12-b** | Mutation 2 showed the repaired api.test.ts case detects a broken composed deadline by never settling. Node's runner does not self-terminate; under mutation it ran past 60 s alone. In CI that becomes GitHub's six-hour default. A `timeout-minutes: 15` on the job costs nothing. |
| `test/runtime/accountRuntime.test.ts` | 252-256 | 57 fixed 8-turn `settle()` drains, many before positive assertions | ℹ **W12-c** | The rule the fix articulated ("a fixed drain is sound only for a negative assertion") is not applied here and is not enforced anywhere. Checked rather than assumed: this harness uses `t.mock.timers`, an in-process `CloudApi`, a socket-free shadow, and a synthetic clock, so its chains are bounded microtask chains that resolve in a fixed number of turns on any machine. Sound today and green on the runner. A future `await` on real I/O in that path turns 8 back into a guess. |
| `features/phase-01-secure-cloud-foundation` | head c269a23 | The Phase 1 branch head is the commit CI refused | ⚠️ **W13 (new)** | The three fixes are on the phase-02 lineage only; c269a23 is an ancestor of `HEAD`, so shipping from `HEAD` is green. But a PR opened from the phase-01 branch would fail CI, and under the new triggers a re-push would not even re-run it. Merge the fixes forward into that branch or delete it. |
| — | — | The partial merge is inferred from the confirmed shape, not observed | ⚠️ **W10-R (new)** | W10's core proposition is closed by the `get/accepted` line. The heartbeat line does not add what it appears to: `nextShadowVersion` advances an existing watermark via `patch.version ?? previous.shadowVersion` regardless of `observed`, and `data` is pinned at 19 keys under both a correct merge and a silently dropped patch, so 393614→393615 with `data=19k` is byte-identical output for either. SC-3a therefore rests on the confirmed document shape plus `mergeRecord` being a proved pure spread. Sound, but deductive. The probe prints `shadowVersion` and `deviceTimestamp`; adding `receivedAt` — which `nextSnapshot` moves only when `observed` — would settle it outright, since `state.ts:165` also pins `data` once a watermark exists. |
| `features/support/fakeRestApi.ts` | 84-96 | The REST fake serves 7 of the 13 measured top-level keys | ⚠️ W11 | Unchanged. `location`, `homeId`, `roomId`, `state`, `timestamp`, and `shadow` are absent, so the acceptance layer does not exercise the drop of the six keys most worth dropping. The 13-key unit fixture covers that; the fake should not be cited for it. |
| `src/cloud/shadow.ts` | 91, 443 | `ShadowClient.connected` still has no production consumer | ℹ W1 (reduced) | Unchanged. Phase 3 or 5 will read it or it should go. |
| `src/runtime/accountRuntime.ts` | 237 | A failing poll reports `unavailable` even while the shadow is live and delivering | ⚠️ W3 | Unchanged and deliberate. Errs toward degraded rather than toward a false normal. Phase 5 inherits it as a contract. |
| `src/cloud/auth.ts` | `sharedGrant` | A joining caller inherits the opening caller's cancellation | ⚠️ W4 | Unchanged, bounded, self-correcting, unreachable this phase. Phase 4 note carried. |
| `src/device/state.ts` | 164-166 | The first poll after ownership release drops heartbeat-only telemetry keys | ⚠️ W5 | Deferred to Phase 3 (SC-6). |
| `src/cloud/shadow.ts` | 257-261 | A rejected complete-shadow request leaves a per-device blind spot | ⚠️ W6 | Deferred to Phase 3 (SC-6). |
| `01-14-PLAN.md` | 45 | Key-link pattern is double-escaped (`retry\\.schedule`) | ⚠️ W7 | Re-confirmed open. Planning-artifact defect; the wiring is real at shadow.ts:287. |

**W10 is closed** — see "Ruling on W10". **W9 remains closed**, unchanged since `b35e322`.

### Test Quality Audit

Only rows that changed. The rest carry forward.

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `test/cloud/api.test.ts` | SYNC-01, WIRE-*, AUTH-02 | yes | 0 | No | Behavioral + type-level | ✓ Strong, and stronger than before on the runner. The abort case now settles deterministically instead of racing an unref'd timer, so the seven cases behind it — including all three SYNC-01 doors — actually execute on CI. Mutation-checked that the repair did not turn it into a test of its own stub. One residual: it signals a break by hanging (W12-b). |
| `test/platform.test.ts` | CONF-01, CONF-03, AUTH-02, SYNC-05 | yes | 0 | No | Behavioral | ✓ Strong. `until` replaces a guessed turn count with the condition itself and fails naming what it waited for — verified by mutation, 5.03 s, clear message. The fixed drain is correctly retained at the three post-shutdown negative assertions, where waiting longer can only make the case stricter. |
| `test/runtime/accountRuntime.test.ts` | SYNC-05, AUTH-01, D-13 | yes | 0 | No | Behavioral | ✓ Strong, with W12-c noted. Not in this delta. Its 57 fixed drains are sound because the harness is pure microtask, which I confirmed by reading it. |
| `features/support/fakeShadowBroker.ts` | SYNC-04 | n/a | 0 | No | n/a | ℹ `verifyClient: () => !refusing` still accepts every signature. Does not matter for SYNC-04 — a real handshake closed that. It still means the acceptance layer proves nothing about signing. |
| `features/support/*` shadow fakes | SYNC-02, SC-3 | n/a | 0 | No | n/a | ✓ Adequate — **upgraded**. The harness still builds the documents it parses, so it cannot falsify the shape. It no longer needs to: the shape is now measured. Previously ⚠️ under W10. |
| `features/support/fakeRestApi.ts` | SYNC-01, D-10 | n/a | 0 | No | n/a | ⚠️ Adequate. Serves a 7-key subset — W11. |
| all other `test/**` and `features/**` | mixed | yes | 0 | No | Value / Behavioral | ✓ 497 unit tests, 35 scenarios, none skipped, 100% branch coverage — on two machines now. |

**Disabled tests on requirements:** 0. **Circular patterns:** 0. **Tests asserting a defect as
correct:** 0. **Insufficient assertions:** 0.

### Human Verification Required

None. The previous run's single item — confirm a real vendor shadow message merges into the
canonical snapshot — is closed by direct observation, judged above rather than accepted.

No new human item is opened, and W10-R is the one worth explaining rather than asserting. It is not a
gap in the code and not a proposition a human must go and test: SC-3a rests on a document shape that
is now confirmed on real traffic plus `mergeRecord`, a pure spread whose behaviour cannot vary with
the origin of its input. Opening a human item for it would ask someone to re-observe a pure function.
What it warrants instead is one more printed field the next time that probe runs — `receivedAt` — and
that is recorded in W10-R where whoever runs it will find it.

The other residuals (W12, W13) are likewise actionable straight from this report: add a job timeout,
decide the CI trigger tradeoff, and clean up a stale branch pointer.

### Gaps Summary

**No gaps. 22/22 truths verified. Phase 1 can be marked COMPLETE.**

**W10 is closed, and the reason is not the one the brief gave.** I found the probe and its raw log
rather than working from the summary, and audited its method against `src/device/state.ts` and
`src/cloud/shadow.ts`. The audit moved the weight from one line to the other. The decisive
observation is `get/accepted`: the snapshot's `shadowVersion` went from `undefined` to 393614, and
`nextShadowVersion` (state.ts:205-211) refuses to establish a watermark unless `carriesObservation`
is true, while the poll path (`toSnapshot`, state.ts:186) can only ever preserve one. So a real
vendor document narrowed, carried `state.reported` at exactly the nesting `toReportedPatch` reads,
held a record there, and reached `applyReportedPatch`. The discard-with-`debug` path and the no-log
`carriesObservation` drop are both falsified, by a route a still-settling startup poll cannot fake.
That is the whole of what W10 asserted, and it is now answered.

**The heartbeat line does not carry what was assigned to it, and I am recording that rather than
letting it pass.** The brief called the 584-byte `update/accepted` decisive for SC-3a on the ground
that `shadowVersion` advanced while `data` stayed at 19 keys. It does not establish that. Once a
watermark exists, `nextShadowVersion` returns `patch.version ?? previous.shadowVersion` with no
reference to `observed`, so a patch whose sections were both dropped still advances the version and
still changes the snapshot string. And `data` is pinned at 19 keys three ways over — a correct merge
of seven fields yields 19, a dropped patch leaves 19, and `nextTelemetry` (state.ts:165) stops the
poll rewriting telemetry once a watermark exists. The probe's output is byte-identical under both
hypotheses. SC-3a therefore rests on the confirmed document shape plus `mergeRecord` being a proved
pure spread over a plain record, which is sound but deductive. That is W10-R, and the fix is one more
printed field: `receivedAt` moves only when `observed`, so printing it settles the question outright.

**The three test fixes touched no production code, and I confirmed that from the diff.**
`git diff --stat 6d8a02a..HEAD -- src/` is empty; the delta is `test/cloud/api.test.ts`,
`test/platform.test.ts`, and `.github/workflows/build.yml`. No test declaration was removed. Neither
repair weakened what it replaced: the api.test.ts abort case still fails when the composed deadline
is broken while `AbortSignal.timeout` is still called — a mutation only that case can catch — and the
platform.ts `until` helper fails in 5 s naming its own condition when the token-cache `rename` is
removed, which is a better failure than the one it replaced. The fixed drain was correctly kept where
the assertion is negative.

**The CI discovery is worth a warning of its own, and it is W12.** Not because the code was wrong —
it was not — but because of what the phase's verification history now looks like from outside. This
phase accumulated 174 commits and five certifications, every one of them resting on `npm run check`
green on a single developer machine. When the work finally reached a runner it was red: eight
cancelled cases on Node 22, including all three SYNC-01 prohibition cases, plus an AUTH-02 assertion
failure on both Node versions. Two facts follow that a future reader should have. The first is
timing: that failure was recorded at 18:00:51Z and my previous report was stamped 18:43:21Z, so this
phase's most recent certification was issued 42 minutes after a public record of its failure existed.
The second is scope: truth 17's evidence is three prohibition cases, and on that runner all three
were cancelled rather than run — the prohibition was asserted in three consecutive reports on
evidence that, on one of two supported Node versions, had not actually been obtained. Both are fixed.
Run 33271243443 is green on 22.x and 24.x at 497/497 and 35/299, and I read that from the run log
rather than from anyone's summary. Truth 15 is materially better supported than it has ever been.
Three smaller notes ride along: the push trigger that caught this no longer exists (W12-a), the job
has no timeout while a hang is a reachable failure (W12-b), and 57 fixed-turn drains remain in
`accountRuntime.test.ts` — sound today because that harness is pure microtask, which I read rather
than assumed (W12-c).

**Two things to tidy that do not block completion.** The Phase 1 branch head, c269a23, is still the
commit CI refused; the fixes live on the phase-02 lineage, which contains c269a23 as an ancestor, so
shipping from `HEAD` is green but a PR from the phase-01 branch would not be (W13). And the shadow
probe output that closes W10 is not recorded anywhere in `.planning/` — this report is currently its
only home, and it belongs appended to `01-UAT.md` item 2, whose stated expectation included the
merge clause it now finally evidences.

**Can Phase 1 be marked COMPLETE? Yes.** Every must-have is verified. Every human item is closed on
evidence I judged rather than accepted. The phase gate and the 100% coverage gate are exit 0 here,
and — for the first time in this phase's life — the same suite is green on hardware nobody involved
controls, on both supported Node versions. Every boundary this phase touches now has something
outside its own fixtures under it: a human read the settings form, the REST shape was measured and
re-measured live, the SigV4 signature was accepted by the real broker, the packed tarball was
installed and ran, and a real shadow document reached the canonical snapshot and established the
watermark. That last one was the only entry left on the list, and it is now off it — on a narrower
and better-founded reading than the one offered, with the part that is still deductive named as
W10-R rather than absorbed into the pass.

---

_Verified: 2026-08-29T19:53:19Z_
_Verifier: Claude (gsd-verifier)_
