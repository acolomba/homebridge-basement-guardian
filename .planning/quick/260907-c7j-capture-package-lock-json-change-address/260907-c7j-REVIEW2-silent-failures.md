# Silent-failure review, round 2 -- `homebridge-basement-guardian`

Scope: `git diff 4b4b41c..HEAD` on `features/refinements` -- commits `cac360d`,
`8fadb0c`, `2ea3c3a`. Audited adversarially against the round-1 finding and for
new silent failures introduced by the three commits.

---

## CLOSURE VERDICT on B-1: **CLOSED**

`src/runtime/accountRuntime.ts:416-491` now holds the shape the round-1 fix
asked for, and every claim it rests on checks out against the code.

### Evidence checked

**1. The `try` covers the fetch alone.**
`accountRuntime.ts:418-426` wraps `await options.api.devices(root.signal)` and
nothing else, and the catch `return`s. The documented justification at
`:367-372` ("it removes nothing and leaves the pending deviceIds for the next
successful poll") now covers exactly the statement it was written for. This
satisfies `.claude/rules/typescript-style-guide.md`, *Errors*: "Keep a `try`
block to the statements that can throw; move the rest out."

**2. Ordering is inverted as claimed, and the ordering is the safe one.**
`options.onDeviceRemoved(deviceId)` runs first, in its own `try`
(`:450-460`). The four prunes -- `reconciliation.forget`, `health.forgetDevice`,
`options.anchors.forget`, `options.failures.forget` -- are at `:464-490`, after
it, reached only when the removal returned normally. A throw logs at `error` and
`continue`s, pruning nothing.

**3. No new partial-success window. `onDeviceRemoved` cannot unpublish and then
throw.**
This was the sharpest question and it is answered by the call chain, not by
hope.

- `src/platform.ts:468-485` `removeDiscoveredDevice`: the only statement that
  can throw is the **first** one after the `undefined` guard,
  `api.unregisterPlatformAccessories(...)`. The three that follow --
  `accessories.delete`, `basementGuardianAccessories.delete`, `store.remove` --
  are Map deletes and a store delete, reached only after it returned.
- `node_modules/homebridge/dist/api.js:232-240`: the `TypeError` for a
  non-`PlatformAccessory` is raised in a pre-pass, before the emit -- a clean
  no-op.
- `node_modules/homebridge/dist/bridgeService.js:430-440`
  `handleUnregisterPlatformAccessories`: the only throw comes out of
  `bridge.removeBridgedAccessories`, i.e. HAP's
  `removeBridgedAccessory` -> `Cannot find the bridged Accessory to remove.`
  (`@homebridge/hap-nodejs/dist/lib/Accessory.js:397-401`) -- the never-bridged
  case, where the accessory was **never** in HomeKit to begin with. The array
  is always single-element (`[accessory]`), so there is no partial-across-devices
  loop.
- `saveCachedPlatformAccessoriesOnDisk` (`bridgeService.js:344-357`) swallows its
  own errors internally, so the one statement that runs *after* a successful
  unbridge cannot throw back out.

The one residual mutation on the throwing path is
`cachedPlatformAccessories.splice` at `bridgeService.js:432-434`, which runs
before the throw. It only drops the entry from Homebridge's in-memory cache
list; the accessory it drops is, by construction of this throw, one the bridge
never bridged, so no HomeKit tile exists for it and no false normal can be
shown. **There is no reachable state where the accessory is genuinely unpublished
and the prunes are skipped.**

**4. "Nothing pruned, so it stays watched and distrustable" is TRUE in the code.
No other path prunes independently.**
`grep -rn "forget" src/` returns exactly the four call sites in this loop and
their definitions. No other module calls them.

- `reconciliation.forget` -> `absenceCounts.delete` (`reconciliation.ts:99-101`)
- `health.forgetDevice` -> `lastShadowArrival.delete`
  (`monitoringHealth.ts:304-306`)
- `anchors.forget` -> `anchors.delete` (`arrivalAnchors.ts:181-183`)
- `failures.forget` -> `warnedAt.delete` (`failureLog.ts:82-84`)

`store.remove(deviceId)` is called only from `removeDiscoveredDevice`
(`platform.ts:484`), which did not reach it.
`registerDiscoveredDevices` (`platform.ts:355-368`) only registers and updates
the deviceIds it is handed; it never unregisters one the inventory omitted. So a
refused removal leaves the device in `store.deviceIds()`, therefore inside
`monitoringTrustByDevice`'s map (`accountRuntime.ts:575-579`), and its
`lastShadowArrival` stamp is intact, so `health.silentDevices()` reports it once
the heartbeats lapse. `applyMonitoringHealth` (`platform.ts:397-405`) then
pushes `shadowSilent: true` to the still-cached accessory and the tile reads
untrustworthy. That is exactly the opposite of the round-1 outcome.

**5. The retry is genuinely stateless.**
`reconciliation.ts:59-61` `isConfirmedAbsent` is `count >= CONFIRMATION_THRESHOLD`,
and `observe` (`:82-94`) increments and re-reports on *every* call while the
deviceId stays absent -- documented at `:33-36` and now load-bearing. The new
test's second `advance` asserting `removed == [DEVICE_ID, DEVICE_ID]` proves it
empirically.

**6. The `log.error` is reachable and carries the cause.**
`options.log` is the redacting logger (`platform.ts:543`, passed at `:571`/`:588`).
`redactParameter` (`logging.ts:83-97`) renders an `Error` parameter as
`"<ConstructorName>: <redacted message>"`, so the line carries the error class and
message. The new test asserts the line is emitted exactly once
(`test/runtime/accountRuntime.test.ts:2646-2678`) and the harness throws the real
Homebridge sentence. The stack is dropped, which is the project's existing
redaction policy, not a regression.

**7. Narrowing the `try` exposed no newly-escaping throw.**
Everything now outside the `try` is non-throwing: `new Set(freshDevices.map(...))`
over a validated array, and four Map deletes. The only remaining thrower in the
loop is `options.log.error` itself, and if a Homebridge delegate logger threw,
it would surface in `runPoll`'s catch (`:947-969`) as a recorded poll failure --
reported, not swallowed.

**8. Suite is green.** 1464 unit tests pass, 0 fail. (`npm run test:cucumber`
cannot run here: Cucumber refuses Node v26.8.0-alpha -- environmental, not a
code fact.)

---

## NEW FINDINGS

**None blocking.**

### ADVISORY (carryover, unchanged by this fix)

**C-1 -- The final-check fetch still swallows a terminal auth answer.**
`accountRuntime.ts:418-426`. If `options.api.devices()` rejects here with
`AuthRejectedError` / `AuthHaltedError`, the catch swallows it and `runPoll`
proceeds to `recordPollSuccess()` (`:948-949`), so `credentialsRejected` is not
raised until the next poll's main inventory -- up to `pollIntervalSeconds`
(max 3600) later. This is the "second, milder consequence" named in round-1 B-1;
the round-1 fix snippet kept the bare `catch { return; }` too, so the
implementation matches what was proposed and this is not a regression. It is
bounded: the main inventory of the *same* poll succeeded seconds earlier, so the
telemetry behind the vouched state is genuinely fresh, and the next poll halts
the runtime. Recording it so it is not re-litigated. If it is ever tightened,
the narrow form is `catch (error: unknown) { if (haltOnTerminalAuthFailure(error))
{ return; } return; }`.

Round-1 A-1 through A-5 are untouched by these commits and stand as written.

---

## Also checked and deliberately not reported

- **Retry cadence.** A permanently refused removal now emits one `error` line and
  one extra `devices()` request per poll, forever, where the old code pruned once
  and went quiet. That repetition is the point of the fix -- the alternative is
  the silence B-1 was raised for -- and the condition needs owner action. Not a
  finding.
- **Reappearance during a refused-removal loop.** If the device returns to the
  inventory, `observe` resets its count to 0 and never reports it, so no removal
  is attempted and `registerDiscoveredDevices` updates the still-cached accessory
  in place. Consistent.
- **Double removal.** A retry after a throw re-enters `removeDiscoveredDevice`
  with the accessory still in `context.accessories`, so the `undefined` guard does
  not short-circuit and the prunes are not reached on a false success.
- **`8fadb0c` (tests only).** The three added cases pin real behaviour, not an
  assumption. `AWS_SESSION_CREDENTIAL_PATTERN` (`logging.ts:20`) uses
  `String.raw` so its value class is `[^",\s}]+`; without it the class would read
  `[^",s}]+` and the fixture value `session/token+value=`, which opens with `s`,
  would fail to match at all and reach the log unredacted. The unquoted and
  spaced-separator cases likewise exercise the `\s*[:=]\s*` groups. The
  assertions match the patterns as written.
- **`2ea3c3a` (comments only).** Verified mechanically: `git diff 8fadb0c..2ea3c3a
  -- src/` filtered to non-comment lines is empty. The one apparent code motion in
  `accountRuntime.ts` is a comment block moved from above `commandTransportReadyNow`
  to above `reportMonitoringHealth`, the function it actually describes. The
  `state.ts` comment's factual claim ("`notify` returns on an empty changed list")
  matches `state.ts:321-323`.

BLOCKING_COUNT: 0
