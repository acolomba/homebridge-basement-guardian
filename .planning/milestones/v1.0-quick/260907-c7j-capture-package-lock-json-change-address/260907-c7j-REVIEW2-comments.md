# Comment accuracy review -- round 2

Scope: `git diff 4b4b41c..HEAD` on `features/refinements` (`cac360d`, `8fadb0c`,
`2ea3c3a`), read against the code each comment sits on. Every checkable claim in a
comment the three commits added or moved was cross-read against the implementation,
against the pinned `homebridge` and `@homebridge/hap-nodejs` sources where it makes a
claim about them, and against the tests where it claims a behaviour is pinned.

`npm test` (unit): 1464 pass, 0 fail. The cucumber leg does not run on this machine's
Node (`v26.8.0-alpha`), which is unrelated to this diff.

---

## Closure verdict: round-1 BLOCKING-1 -- `src/runtime/accountRuntime.ts`

**CLOSED.**

The nine-line block now sits at `src/runtime/accountRuntime.ts:591-599`, directly above
`function reportMonitoringHealth()` (line 600):

```
  // The trust is computed once and reported from that one value, so what the
  // plugin says about its own sight and what HomeKit marks cannot disagree.
  //
  // It runs on every poll outcome rather than from the poll loop alone, because
  // `launch()` records its own first inventory outcome without going through
  // that loop, and a report wired only into the loop would arrive a whole poll
  // interval late -- an hour at the configuration maximum. A poll a shutdown
  // aborted returns before both recorders, so it advances nothing and reports
  // nothing.
  function reportMonitoringHealth(): void {
```

Every claim checks out against the function it now documents:

- *"computed once and reported from that one value"* -- `reportMonitoringHealth`
  (lines 600-633) calls `monitoringTrustNow()` once into `account`, derives `byDevice`
  from that single value, and both the log side (`options.failures.recordFailure` /
  `recordSuccess`, lines 617-623) and the HomeKit side (`options.onMonitoringHealth(account,
  byDevice)`, line 632) read that one map. This is the only function in the file that both
  *says* and *marks*, which is what the sentence is about; `pushMonitoringTrust`
  (line 585) only pushes, and `commandTransportReadyNow` does neither.
- *"runs on every poll outcome rather than from the poll loop alone"* -- called from
  `recordPollSuccess` (line 715), `recordPollFailure` (line 722) and the shadow-arrival
  callback (line 835). Nothing calls it from `runPolls` (line 973).
- *"`launch()` records its own first inventory outcome without going through that loop"*
  -- `launch()` calls `recordPollSuccess()` at line 1023 directly, and reaches
  `recordPollFailure` through `launchFailure` at line 1013; `startBackgroundWork()` runs
  after both.
- *"an hour at the configuration maximum"* -- `POLL_INTERVAL_BOUNDS` in `src/config.ts:25`
  is `{ minimum: 300, maximum: 3600 }` seconds.
- *"A poll a shutdown aborted returns before both recorders"* -- `runPoll` (lines 945-970)
  throws out of `options.api.devices(root.signal)` before `recordPollSuccess()` on line
  949, and the catch returns at line 956 on `root.signal.aborted` before reaching
  `recordPollFailure` on line 969.

**The first paragraph was correctly placed and did not belong with
`commandTransportReadyNow`.** That function (line 538) is `return !stopped && !halted &&
polling;` -- it computes no trust struct, reports nothing, and cannot "disagree" with
HomeKit; it is a term inside `monitoringTrustNow()`, not a reporter.

**`commandTransportReadyNow` still reads coherently.** Its remaining comment
(lines 520-537) now opens on the subject line -- "Whether the plugin currently has a
proven way to reach the vendor, derived from the same three flags the monitoring path is
derived from and storing nothing of its own" -- and its two following paragraphs
(the stopped/halted/polling derivation, and the one-failure-vs-two-failures contrast)
both describe the returned boolean. Nothing was left dangling and nothing was dragged
along.

---

## Closure verdict: round-1 BLOCKING-2 -- `src/device/state.ts:299-308`

**CLOSED.** Every factual claim verified, including both load-bearing ones.

```
// Compares the merged telemetry record key by key. This reports which keys
// moved and does not judge which of them matter, because the store decodes no
// telemetry field and holds no family knowledge: relevance is the accessory
// tier's to decide, downstream of here (D-19, D-20).
//
// Teaching a family adapter's notion of relevance to this function would be a
// safety regression rather than a saving. `notify` returns on an empty changed
// list, and that notification is the only path a between-poll pump run reaches
// HomeKit on, so a key the filter judged uninteresting would silently suppress
// the live update for a running pump (SAFE-03, SAFE-07).
```

Claim by claim:

1. **"the store decodes no telemetry field"** -- true. `src/device/state.ts` imports only
   `node:util`, `../cloud/types.js` (types), `../runtime/clock.js` (type) and
   `homebridge` (type). `data` is `Readonly<Record<string, unknown>>` carried opaquely
   (line 26-27), and the interface's own doc at lines 20-22 says the same.
2. **"holds no family knowledge"** -- true. `family`, `Family`, `gemini` and `registry`
   appear nowhere in the file outside this comment.
3. **"relevance is the accessory tier's to decide, downstream of here"** -- true. The
   family registry is resolved in the accessory tier:
   `src/accessories/basementGuardian.ts:59` imports `FamilyRegistry` and line 989 calls
   `registry.lookup(snapshot.identity.deviceTypeId)`. No `src/device/state.ts` consumer
   sits upstream of it.
4. **"`notify` returns on an empty changed list"** -- true, verbatim. `src/device/state.ts:318-322`:
   ```
   function notify(listeners, log, next, previous): void {
     const changed = changedKeys(previous === undefined ? {} : previous.data, next.data);

     if (changed.length === 0) {
       return;
     }
   ```
5. **"that notification is the only path a between-poll pump run reaches HomeKit on"** --
   true, and traced end to end. A between-poll shadow message enters at
   `src/runtime/accountRuntime.ts:832`, `options.store.applyReportedPatch(deviceId, patch)`,
   whose **return value is discarded** -- it is the only call site in `src/`
   (`grep -rn "applyReportedPatch" src/`). Inside the store,
   `applyReportedPatch` (line 363) reaches HomeKit only through
   `notify(...)` on line 372. `notify` fans out to the listener registered at
   `src/platform.ts:174-176`, `store.subscribe(deviceId, (next) => {
   basementGuardianAccessory.update(next, 'live'); })`. The only other
   `basementGuardianAccessory.update` call sites in the whole plugin are
   `src/platform.ts:261` and `:330`, both `'poll'`. So with `changed.length === 0` the
   between-poll patch reaches nothing.
6. **The safety consequence** -- a filter that judged a key uninteresting would produce an
   empty `changed` for exactly the case `src/platform.ts:161-167` exists to catch ("A
   backup pump runs for seven to fifteen seconds and the default poll interval is about
   fifteen minutes"). Correct.
7. **Anchors** -- `D-19` and `D-20` both exist and both fit
   (`.planning/phases/01-secure-cloud-foundation/01-RESEARCH.md:45-46`). Note the new text
   deliberately keeps `D-19` as the anchor while dropping D-19's own now-obsolete
   *reason* ("no family adapter exists yet"); that is the right call -- the decision row
   is still the contract, only its 2026 justification has expired.

The false statement that a family adapter does not exist is gone, and nothing in the
replacement reintroduces it.

---

## Audit of `cac360d`'s control-flow change: are any surrounding comments now stale?

**No stale comment found.** Checked every comment in and around `applyDevices`.

- **The doc comment that originally justified the `try`** --
  `src/runtime/accountRuntime.ts:366-371`: "The final check re-fetches the inventory once
  more, immediately before a removal commits ... Its own failure is a monitoring-path
  failure, not a device fact (D-014): it removes nothing and leaves the pending deviceIds
  for the next successful poll's own `confirmedAbsent` computation, with no separate retry
  state." Still exactly true of the narrowed `try`: the catch at lines 424-431 returns
  before any removal, and `reconciliation.observe` re-reports the deviceId on the next
  poll (`src/accessories/reconciliation.ts:90-93`, `isConfirmedAbsent(count) = count >= 2`
  with the count monotonically advancing). "Its own failure" now scopes to the fetch
  alone, which is what the code does.
- **The narrowed catch comment (lines 425-429)** -- "Deliberately silent, for the reason
  above" still resolves to that doc comment, which is still accurate. (One literal
  imprecision, ADVISORY-1 below.)
- **The accessory-first comment (lines 443-449)** -- verified in full. The four
  named mechanisms map one-to-one onto the four prunes that now follow the removal:
  absence count = `reconciliation.forget` (464), arrival stamp = `health.forgetDevice`
  (488), persisted anchor = `options.anchors.forget` (489), reporting kind =
  `options.failures.forget(liveReportingKind(...))` (490). The load-bearing claim --
  "a published accessory that nothing can ever mark untrustworthy again" -- is
  **provably true**: `silentDevices()` (`src/runtime/monitoringHealth.ts:255-268`)
  iterates `lastShadowArrival`, which `forgetDevice` (line 304) deletes from; the device
  is only re-added by `admitDevice`, which `applyDevices` calls only for devices present
  in the fresh inventory (line 403). A pruned-then-not-removed device would therefore
  never appear in `silentDevices()` again, while `monitoringTrustByDevice` (line 576)
  would keep emitting a struct for it (it walks `options.store.deviceIds()`, and the
  store still holds it because `store.remove` lives inside the failed
  `onDeviceRemoved`) -- with `shadowSilent: false`. That is literally "reads a normal
  pump forever".
- **The retry claim (lines 453-456)** -- "`observe` reports a deviceId on every call while
  it stays absent, so the retry needs no state of its own" matches both the
  implementation and `Reconciliation.observe`'s own contract doc
  (`src/accessories/reconciliation.ts:33-36`), and is pinned by the new test's second
  assertion (`[DEVICE_ID, DEVICE_ID]`).
- **The recovery-latch paragraph (lines 481-484)** -- "the removal runs before the poll
  records its outcome, so the entry is already gone by the end of this same poll" is
  unaffected: `runPoll` still awaits `applyDevices` before `recordPollSuccess()`
  (lines 948-949).
- **The new test's docstring** (`test/runtime/accountRuntime.test.ts:335-341`,
  "Homebridge answers a removal for an accessory it never bridged by throwing, which is
  the state an accessory reaches when its UUID collided with one another plugin had
  already bridged") is **accurate and well-researched**, which is worth recording.
  `node_modules/homebridge/dist/bridgeService.js:398-402` skips a UUID that collides with
  an already-bridged accessory (`log.warn(... 'Skipping duplicate.'); return undefined;`)
  while the plugin keeps it in its own map; a later unregister then reaches
  `Accessory.removeBridgedAccessory`
  (`node_modules/@homebridge/hap-nodejs/dist/lib/Accessory.js:397-402`), which throws
  `new Error("Cannot find the bridged Accessory to remove.")` when the accessory is not
  in `bridgedAccessories`.
- **The counterfactual in that same test comment** -- "Pruned ahead of the removal, the
  tile goes on reading no leak and a normal pump ..., nothing ever retries the removal,
  and nothing is said about any of it (D-014)" -- all three halves are true of the
  pre-`cac360d` code, including the third: the old `try` wrapped the whole removal loop
  and its catch was `// Deliberately silent`, so a throw from `onDeviceRemoved` never
  reached `runPoll`'s recorder. No overstatement.

---

## Re-wrapping check (`2ea3c3a`)

Both re-wrapped paragraphs were diffed word by word. **No silent meaning change.**

- `src/accessories/serviceCatalogue.ts:979-986` -- the only textual difference is the
  removal of the token `` `03-CONTEXT.md` ``. Every other word, including the whole
  `D-10` exception clause, is byte-identical after re-wrap.
- `src/persistence/accessoryContext.ts:7-10` -- "that value is **treated as
  non-sensitive here**" became "that value **is non-sensitive**". This drops a hedge, but
  it is the intended effect of round-1 ADVISORY-5: `src/accessories/controls.ts:514-516`
  ("it is a non-sensitive value") and `src/runtime/accountRuntime.ts:71-73` ("is a
  non-sensitive value") now say it the same way, all three anchored on `D-027`, with the
  public-artifact carve-out preserved verbatim in each. The three-way disagreement
  round 1 flagged is gone.

Round-1 ADVISORY-5 (`Phase 2 ruling`) and ADVISORY-7 (`03-CONTEXT.md`) are both
**CLOSED**; the forbidden tokens are gone and `.claude/rules/typescript-comments.md`
has no other violation in the diff.

---

## NEW findings

### BLOCKING

None.

### ADVISORY

#### ADVISORY-1 -- `src/runtime/accountRuntime.ts:425-429` -- "every statement below it changes state" is not literally true

```
      // Deliberately silent, for the reason above. The `try` holds the fetch
      // and nothing else: every statement below it changes state, and a
      // failure there is a different fact that has to be reported rather than
      // dropped.
```

The first statement below the `try` is `const stillPresent = new Set(freshDevices.map(...))`
(line 433), a pure local. The claim is true of everything inside the loop, which is what
the sentence is really about. Not blocking: the comment argues *against* re-widening the
`try`, which is the correct direction, so a maintainer trusting it introduces nothing.
Wording such as "every statement in the loop below it changes state" would be exact.

#### ADVISORY-2 -- `test/logging.test.ts:219-224` -- the described failure mode is not the one this fixture produces

```
// The credential value opens with an `s` and a second field follows it, so the
// whole value class is load-bearing here. A class that excluded the letter `s`
// instead of whitespace -- one dropped `String.raw` away -- would stop at the
// first letter of a real session token and write the rest of it to the log
// under a line that still reads redacted (AUTH-02).
```

Verified by running the degraded pattern (`String.raw` dropped, so both `\s*` separators
and the `\s` in the value class collapse to the literal `s`):

| input | degraded-pattern output |
| --- | --- |
| `{"SessionToken":"session/token+value=", ...}` (this test's fixture) | `{"SessionToken":"session/token+value=", ...}` -- **no match at all**, nothing reads redacted |
| `{"SessionToken":"FwoGZXIvYXdzsEXAMPLEmore"}` | `{"SessionToken":"[redacted]sEXAMPLEmore"}` -- the described failure |

Because the fixture's value *opens* with `s`, `[^",s}]+` fails at the first character and
the match dies entirely, so the whole value is written verbatim with no `[redacted]`
anywhere -- a louder failure than the one described, not the quiet partial redaction. The
second sentence is an accurate description of the danger for a *general* session token
(row 2), but the first sentence ties it to a fixture that does not produce it. The test
itself is correct and still fails loudly if `String.raw` is dropped, so nothing is
unpinned; only the explanation is off. Suggested fix: say the fixture makes the
degradation fail the match outright, and cite the partial-redaction case as the danger
being guarded against.

The other two comments this commit added are accurate:
`test/logging.test.ts:238-240` ("the value class is what hands back the words after it" --
`[^",\s}]+` stops at the space before `and nothing else`) and `test/logging.test.ts:291-293`
("without them the pattern never reaches the value and the whole body goes to the log
unredacted" -- confirmed: `[:=]` cannot match the space, so nothing matches).

#### ADVISORY-3 -- `src/runtime/accountRuntime.ts:453` and `:457` -- "stays published" is true of the plugin's bookkeeping, not of HomeKit

```
        // The system stays published, stays watched and stays distrustable,
        ...
        options.log.error(`Could not remove ${deviceId} from HomeKit; it stays published and stays watched.`, error);
```

"stays watched" and "stays distrustable" are exact (see the audit section above). "stays
published" is exact from the plugin's side -- `removeDiscoveredDevice`
(`src/platform.ts:468-486`) throws at `unregisterPlatformAccessories` before
`context.accessories.delete(uuid)` and `store.remove(deviceId)`, so the accessory and its
subscription both survive. But in the one scenario the new test documents (a UUID the
bridge refused as a duplicate), the accessory was **never bridged**, so it is not visible
in HomeKit at all -- and `handleUnregisterPlatformAccessories`
(`node_modules/homebridge/dist/bridgeService.js:430-437`) splices it out of
`cachedPlatformAccessories` before the throw. Not blocking: the actionable half of the
message ("the plugin did not drop it and keeps monitoring it") is correct, and no
maintainer decision hangs on the word. Something like "it stays registered with this
plugin and stays watched" would be precise in both scenarios.

#### ADVISORY-4 -- `src/runtime/accountRuntime.ts:591-592` now near-duplicates a comment inside the same function

The moved first paragraph, "The trust is computed once and reported from that one value,
so what the plugin says about its own sight and what HomeKit marks cannot disagree",
restates the in-body comment at lines 607-608, "Each condition is reported and pushed
from the one value, so the cause the log names and the condition HomeKit marks cannot
disagree". Both are true; they are now eight lines apart. Cosmetic, and only visible
because the move brought them together.

#### ADVISORY-5 -- `CHANGELOG.md` Unreleased entry slightly overstates the action

"If the plugin cannot remove a system that left your account, it now marks that system
untrustworthy and reports the error." The refusal path performs no marking; it *preserves*
the mechanisms (arrival stamp, anchor, absence count) that will mark the system silent
once it misses two heartbeats -- which is the outcome an owner sees, and which the new
test pins (`silence: true`). "keeps marking that system untrustworthy" would match the
code. User-facing prose, not a code comment.

---

## Round-1 findings not addressed on this branch

Recorded so a later pass does not re-derive them. All were ADVISORY in round 1 and remain
open, unchanged and still accurate as written there: ADVISORY-1 (`controls.ts:145-147`,
the false HAP double-`onSet` warning claim), ADVISORY-2 (`platform.ts:326`/`:329`,
"fifteen services" is seventeen), ADVISORY-3 (`customCharacteristics.ts:148`, "twelve" is
sixteen), ADVISORY-4 (`config.ts:11-13`, "the same shape"), ADVISORY-6
(`accountRuntime.ts:67-68`, rot-prone line-number citations), ADVISORY-8
(`reconciliation.ts:43-47`, the documented-but-unused `clock`), ADVISORY-9
(`basementGuardian.ts:172-174`), ADVISORY-10 (`index.ts:9-11`, "method").

BLOCKING_COUNT: 0
