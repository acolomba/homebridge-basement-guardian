---
phase: 02-safe-gemini-discovery-and-identity
reviewed: 2026-08-30T01:50:06Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - .fallowrc.json
  - features/discovery.feature
  - features/support/fakeHomebridgeApi.ts
  - features/support/fakeRestApi.ts
  - features/support/steps/harness.ts
  - features/support/world.ts
  - src/accessories/basementGuardian.ts
  - src/accessories/reconciliation.ts
  - src/device/gemini.ts
  - src/device/halo.ts
  - src/device/registry.ts
  - src/device/state.ts
  - src/persistence/accessoryContext.ts
  - src/platform.ts
  - src/runtime/accountRuntime.ts
  - test/accessories/basementGuardian.test.ts
  - test/accessories/reconciliation.test.ts
  - test/device/gemini.test.ts
  - test/device/halo.test.ts
  - test/device/registry.test.ts
  - test/device/state.test.ts
  - test/persistence/accessoryContext.test.ts
  - test/platform.test.ts
  - test/runtime/accountRuntime.test.ts
findings:
  critical: 1
  warning: 2
  info: 1
  total: 4
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-08-30T01:50:06Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

`tsc --noEmit` (both `tsconfig.json` and `tsconfig.test.json`), `eslint . --max-warnings=0`, the
full unit suite, per-pair direct coverage for every source-test pair in scope, and
`cucumber-js features/discovery.feature` all pass clean (219 unit tests, 100% direct line/branch/
function coverage on every pair; 44/44 Cucumber scenarios). Style discipline (no `any`, no unsafe
casts, no stray block comments, consistent naming, documented catch blocks) is solid throughout
the reviewed files, and the test suites generally follow the project's testing rules (independent
`test()` cases, `// arrange`/`// act`/`// assert`, whole-value assertions, `strong-mock` used
correctly with `exactParams` and `verify()`).

Despite the green toolchain, tracing `src/runtime/accountRuntime.ts`'s DEV-05 removal path against
its own reconciliation module (`src/accessories/reconciliation.ts`) turned up a real defect: the
out-of-band final-check fetch that DEV-05/D-029 requires before a device is unregistered shares one
un-scoped `Reconciliation` instance with the regular poll, and that instance is never told when a
device has actually been removed. Both problems are proven below with a standalone repro against
the built module (not merely asserted). This directly undermines a decision the project's own
`02-CONTEXT.md`/`02-RESEARCH.md` treat as load-bearing: "Two consecutive confirmations are
required, not one" and "roughly 30 minutes of sustained emptiness, not a transient blip." No
existing unit or feature test exercises the sequence needed to observe it, which is why the gate
stayed green.

## Critical Issues

### CR-01: The DEV-05 final-check fetch can confirm an unrelated device absent early, and does so permanently once any device has ever been removed

**File:** `src/runtime/accountRuntime.ts:235-264` (root cause on line 252; compounded by the
absence of any `reconciliation.forget()` call anywhere in the file)

**Issue:**

`applyDevices()` uses one shared `Reconciliation` instance (`const reconciliation =
createReconciliation(...)`, line 202) across every poll. `Reconciliation.observe()` (in
`src/accessories/reconciliation.ts`) is not scoped to a caller-chosen set of deviceIds: every call
advances or resets the absence count of **every currently tracked deviceId**, because it iterates
the whole internal `Map`.

`applyDevices()` calls `observe()` twice within a single poll cycle whenever *any* device reaches
the two-poll threshold:

```ts
const confirmedAbsent = reconciliation.observe(deviceIds);        // line 243, the regular poll
...
const freshDevices = await options.api.devices(root.signal);      // line 250, the out-of-band final check
const freshDeviceIds = freshDevices.map((device) => device.deviceId);
reconciliation.observe(freshDeviceIds);                            // line 252 -- BUG: touches every tracked device, not just confirmedAbsent
```

Two compounding defects follow from this:

1. **Cross-device pollution.** The final-check fetch is a second, independent HTTP round trip. If
   it happens to omit a device `D` that is otherwise healthy and present in every real poll (a
   transient hiccup on just that one extra request, unrelated to whatever triggered the check),
   `D`'s absence count silently advances by one -- an observation that did not come from a real
   poll-interval-spaced inventory response. If `D` is then absent from the very next regular poll,
   it reaches the confirmed-absent threshold and is unregistered after only **one** real missed
   poll instead of the two the design requires.

2. **Permanent recurrence.** Nothing in `accountRuntime.ts` ever calls the reconciliation module's
   own `forget(deviceId)` (which exists in `src/accessories/reconciliation.ts` for exactly this
   purpose -- "Stops tracking `deviceId`, as if this module had never seen it") after
   `options.onDeviceRemoved(deviceId)` fires. Once a deviceId is confirmed absent, it can never
   reappear in a future poll's `deviceIds` (the vendor no longer reports it), so its absence count
   keeps growing and `confirmedAbsent` keeps including it on **every subsequent poll for the
   remaining life of the process**. That means defect (1)'s window -- which would otherwise be a
   rare coincidence -- becomes permanently open: after the very first device removal on an
   account, every future poll performs the extra final-check fetch and the extra whole-fleet
   `observe()` call, forever.

I proved both mechanisms against the built module directly (not by inspection alone):

```
$ node repro.mjs        # cross-device pollution
Poll 3 (A, B absent from main poll; D present in main poll, but D is transiently
missing from the final-check-only fetch):
  main poll: [ 'D' ] -> confirmedAbsent: [ 'A', 'B' ]
  final check: [] (ran because confirmedAbsent.length > 0)
Poll 4 (D absent from main poll for the first real time):
  main poll: [] -> confirmedAbsent: [ 'A', 'B', 'D' ]
D confirmed absent after only ONE real missed main poll: true

$ node repro2.mjs       # permanent recurrence after one removal, no forget() ever called
Poll 3: main=[] confirmedAbsent=["X"] finalCheckFired=true   <- X confirmed absent, removed
Poll 4: main=[] confirmedAbsent=["X"] finalCheckFired=true   <- X still "absent" forever after
Poll 5: main=[] confirmedAbsent=["X"] finalCheckFired=true
Poll 6: main=[] confirmedAbsent=["X"] finalCheckFired=true
Poll 7: main=[] confirmedAbsent=["X"] finalCheckFired=true
```

This is not a theoretical concern for this project: `.planning/phases/02-safe-gemini-discovery-
and-identity/02-CONTEXT.md` and `02-RESEARCH.md` record the removal protocol as a deliberately
bounded, locked decision specifically to prevent "over-deleting accessories and their persisted
pump-observation history" ("Removal logic that trusts a single ambiguous signal... as evidence of
a genuinely absent device"). This defect breaks exactly that bound for any device unrelated to the
one actually being confirmed, and it does so on a permanent, recurring basis after the first real
removal on the account -- for a safety-first plugin, a spuriously vanished sump-pump accessory is
the "false normal" the project's core constraints explicitly forbid.

No existing test (unit or Cucumber) exercises more than one tracked device inside a
`confirmedAbsent` cycle together with an unrelated third device, or polls past the point where a
device has already been removed, which is why 100% branch coverage on `accountRuntime.ts` and
`reconciliation.ts` did not catch this.

**Fix:** Scope the final-check re-observation to the deviceIds actually under confirmation instead
of replaying the whole fleet through `observe()`, and tell the reconciliation module when a device
has actually left, e.g.:

```ts
const freshDevices = await options.api.devices(root.signal);
const stillPresent = new Set(freshDevices.map((device) => device.deviceId));

for (const deviceId of confirmedAbsent) {
  if (stillPresent.has(deviceId)) {
    reconciliation.forget(deviceId); // reappeared: start a fresh epoch, touch nothing else
  } else {
    reconciliation.forget(deviceId); // confirmed and about to be removed: stop tracking it
    options.onDeviceRemoved(deviceId);
  }
}
```

This removes the blanket `reconciliation.observe(freshDeviceIds)` call entirely, so the final
check can no longer advance or reset any deviceId's count except the ones it was actually run for,
and a removed device stops permanently re-triggering the extra fetch on every later poll.

## Warnings

### WR-01: The Cucumber world only ever watches the devices present at launch, silently missing a device discovered on a later poll

**File:** `features/support/world.ts:518-532`

**Issue:** `watchDevices()` is called exactly once, right after `await runtime.start()` resolves
(line 514), and only subscribes to `runtime.store.deviceIds()` as they exist at that moment:

```ts
private watchDevices(runtime: AccountRuntime): void {
  for (const deviceId of runtime.store.deviceIds()) {
    const unsubscribe = runtime.store.subscribe(deviceId, (_next, _previous, changedKeys) => {
      this.changes.push(`${deviceId} ${changedKeys.join(' ')}`);
    });
    ...
  }
}
```

If a future scenario discovers a device only on a *later* poll (rather than in the Background's
initial `these devices:` table) and then asserts against `world.changes` for that device, the
world silently records nothing for it -- there is no subscription to miss the notifications on.
The failure mode is a test that passes vacuously (an empty-array assertion looks identical to "no
change happened" and "no listener was ever registered") rather than one that fails loudly, which
is exactly the kind of weak-harness gap the project's own testing guidance warns against.

**Fix:** Subscribe lazily, e.g. have `watchDevices` re-scan `runtime.store.deviceIds()` after each
`onTrustworthyInventory` callback and add a listener for any deviceId not already watched, or
expose a store-level "device added" hook the world can subscribe to once.

### WR-02: `Reconciliation.forget()` is production API with no production caller

**File:** `src/accessories/reconciliation.ts:38-40`, `src/runtime/accountRuntime.ts` (whole file)

**Issue:** `forget()` is part of the module's public contract and is exercised by
`test/accessories/reconciliation.test.ts`, but nothing in `src/` ever calls it -- the only caller
in the whole reviewed file set is the test module. This is the same root cause as CR-01: the
runtime never tells the reconciliation tracker that a deviceId's lifecycle ended. Per the Google
TypeScript style rule this repo adopted ("Export only symbols used outside the module"), an export
with no production consumer is a signal that a wiring step was missed, not that the method is
unnecessary -- confirmed here because its absence is directly responsible for CR-01.

**Fix:** Resolved by the CR-01 fix above; call `reconciliation.forget(deviceId)` from
`applyDevices()` once a deviceId is confirmed absent or observed to have reappeared.

## Info

### IN-01: `BasementGuardianAccessory.services` is a permanent empty literal this phase

**File:** `src/accessories/basementGuardian.ts:161`

**Issue:** `services: []` is hard-coded in the object literal returned by
`createBasementGuardianAccessory()`, even though the interface documents it as "Every service this
accessory publishes, in a stable order." This is intentional and explicitly tested
(`test/accessories/basementGuardian.test.ts`: "publishes no ServiceDescriptor-based service this
phase"), so it is not a defect -- flagged only so it is not mistaken for an oversight when the next
phase starts publishing real services from this same factory.

**Fix:** None needed now; worth a `// TODO`-free reminder in the phase handoff that this literal
must become a real derivation once a family starts reporting `ServiceDescriptor`s.

---

_Reviewed: 2026-08-30T01:50:06Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
