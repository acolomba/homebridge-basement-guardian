# Type design review -- whole codebase

Scope: every type declared under `src/**/*.ts` (43 files), read in full. Compiler
settings were read too, because they change what the declarations actually buy:
`strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`,
`noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`,
`noUnusedParameters`. `npx tsc --noEmit` is clean.

The whole review is aimed at one question: can the type system tell "unknown"
apart from "normal"? The short answer is yes, and the design does it in more
places than most safety codebases manage. The findings below are the seams where
it stops doing it by construction and starts doing it by convention.

Only four `as` assertions exist in production code
(`src/accessories/pumpRecords.ts:115`, `:131`, `src/runtime/timers.ts:31`,
`src/cloud/httpDispatcher.ts:39`), each with a stated reason. No `any`, no
`@ts-ignore`, no `@ts-expect-error` outside tests.

---

## Verdict

**BLOCKING: 0.**

I could not construct a reachable illegal state from the public surface of any
declared type. Every candidate I chased ended at a runtime guard, a discriminated
union, or a `| undefined` that the consumer is forced to handle. The findings
below are all ADVISORY: they are places where a correct invariant is held by a
comment or by two parallel computations agreeing, rather than by the type.

---

## Type: `ScopedDomainState` (`src/device/family.ts:152`)

This is the load-bearing type for the core invariant, so it gets the full
treatment.

### Invariants identified

- Every trust scope a published service reads has exactly one member.
- `undefined` means "this scope did not validate", never "the device reported
  nothing" -- the file says so explicitly and the decoder honours it.
- A family that forgets a scope fails to compile, because every member is
  `T | undefined` rather than `T?`.
- The two control scopes are keyed by the `DeviceCapability` string itself, so
  capability, trust scope, and decoded group are one token with no mapping table.

### Ratings

- **Encapsulation**: 6/10
  The shape is a plain data interface with no behaviour, which is right for a
  decode result. It loses points only because it is immediately widened to
  `unknown` at the module boundary (`DeviceFamily<TDomainState>.decode` is
  generic and the registry hands out `FamilyOutcome<unknown>`), so no consumer
  ever sees this type. See ADVISORY-1.

- **Invariant Expression**: 9/10
  `T | undefined` instead of `T?` is the single best decision in this file:
  it converts "forgot a scope" from a silent omission into a compile error, and
  `exactOptionalPropertyTypes` keeps that honest. The comment stating what
  `undefined` means is doing real work, and the code matches it.

- **Invariant Usefulness**: 10/10
  This is precisely the invariant the product exists to hold. A partly-invalid
  payload costs one scope, not the device, and the accessory retains the last
  valid value for the rest.

- **Invariant Enforcement**: 8/10
  Enforced by construction inside `src/device/gemini.ts`: `decode()` computes
  `untrustedScopesOf(data)` from the same `TELEMETRY_CHECKS` table that
  `validate()` uses, and every per-scope decoder throws a `TypeError` if a field
  it was promised is not there. The one gap is that scope-violated and
  group-absent agree because two separate call sites walk the same table, not
  because the type ties them together (ADVISORY-4).

### Strengths

The absence of a `null`, a sentinel, and a default anywhere in the decode path.
`waterLevelPercentage` throws rather than guessing; `protectionHoursPercentage`
throws rather than guessing; `optionalNumberField` returns `undefined` rather
than `0`. `PROVISIONAL_*` names carry their own epistemic status.

### Concerns

Only the erasure to `unknown` at the boundary (below).

### Recommended improvements

None that are worth the complexity. See ADVISORY-1 for the one idea that would
be, if a second family ever lands.

---

## Type: `MonitoringTrust` (`src/runtime/monitoringHealth.ts:77`)

### Invariants identified

- `restDegraded`, `commandTransportReady`, `credentialsRejected` are
  account-wide facts.
- `shadowSilent` is a per-device fact and has **no** meaningful account-wide
  value.
- The safe default for every member is the one that declines to vouch.

### Ratings

- **Encapsulation**: 5/10 -- a bare struct, deliberately.
- **Invariant Expression**: 4/10 -- see the concern below; the type says four
  booleans travel together, the code says one of them is only valid in one of
  the two positions it travels in.
- **Invariant Usefulness**: 9/10 -- the account/device split is exactly the
  distinction that stops one quiet pump's silence being spent on its neighbour.
- **Invariant Enforcement**: 7/10 -- the *value* is enforced safely (`true`,
  declines to vouch); the *position* is enforced only by comment.

### Concerns

`MonitoringTrust` is used for two different things:

- the account-wide struct returned by `monitoringTrustNow()`
  (`src/runtime/accountRuntime.ts:533`), where `shadowSilent` is hard-coded to
  `true` with the comment "Reading this member off the account struct is
  therefore always wrong; the map is where the answer lives";
- the per-device struct in the `byDevice` map, where it is the real answer.

`onMonitoringHealth(account: MonitoringTrust, byDevice: ReadonlyMap<string,
MonitoringTrust>)` gives both the same type, so nothing stops a future consumer
reading `account.shadowSilent` and getting a legal-looking `true`.

This is **not** BLOCKING. I checked both consumers:
`src/platform.ts:401` writes `{ ...account, shadowSilent: true }` (the spread
value is overwritten) and never reads the account member; the Cucumber harness
goes through the same exported `applyMonitoringHealth`. And the chosen constant
is the safe direction -- a wrong read produces "cannot vouch", never a false
normal. So the illegal state is representable but its only reachable
manifestation is conservative.

See ADVISORY-2 for the fix.

---

## Type: `AccessoryContext` (`src/persistence/accessoryContext.ts:86`)

### Ratings

- **Encapsulation**: 4/10
- **Invariant Expression**: 5/10
- **Invariant Usefulness**: 3/10 -- as written, three of its seven members
  describe a record the plugin does not write.
- **Invariant Enforcement**: 2/10 -- nothing is typed as `AccessoryContext`.

See ADVISORY-3, which is the finding I would act on first.

---

# Findings

## ADVISORY-1 -- decoded domain state is erased to `unknown` and re-narrowed by string key

`DeviceFamily<TDomainState>.decode()` is generic, the registry returns
`FamilyOutcome<unknown>` (`src/device/registry.ts:26`), so the decoded value
reaches the accessory tier as `unknown` and every field is recovered by string
lookup:

- `decodedGroup(decoded, scope)` -- `src/accessories/serviceCatalogue.ts:293`
- `booleanOf(group, 'primaryRunning')` -- `:303`
- `numberOf(group, 'levelPercent')` -- `:313`
- `decodedControlValue()` in `src/accessories/basementGuardian.ts:549`
- `isControllerLinkLost()` in `src/accessories/basementGuardian.ts:300`

The design reason is sound and stated (D-003: the accessory must stay ignorant of
any one family's shape) and the narrowing is done in exactly one place per group,
which is the right mitigation. But the string keys are unchecked. A renamed field
in `ScopedDomainState` -- or a typo -- compiles, `booleanOf` answers `undefined`,
`published()` drops the candidate, and the service keeps serving its previous
value while `StatusActive` is pushed `true`, because `isRowFullyTrusted` is
computed from the untrusted-scope list and not from whether anything was actually
projected. That is the exact shape of a false normal.

It is ADVISORY, not BLOCKING, because no *data* can reach it: within a scope that
validated, `decode()` is guaranteed by its own guards to produce every field with
the right type. Only a source edit gets you there.

Two cheap ways to close it without importing Gemini into the accessory tier:

- type the projection helpers' `field` parameter against the family-neutral
  shapes rather than `string` -- e.g.
  `booleanOf<G>(group: G | undefined, field: KeysMatching<G, boolean>)`, with the
  group types (`PumpState`, `FaultState`, ...) already family-neutral and already
  exported from `src/device/family.ts`;
- or, smaller and probably better value: make `decodedGroup` return a typed group
  by keying `ScopedDomainState` -- `decodedGroup<S extends TrustScope>(decoded:
  unknown, scope: S): ScopedDomainState[S] | undefined` -- which costs one import
  of a family-*neutral* type and turns every field name into a checked key.

## ADVISORY-2 -- `MonitoringTrust` lets an account-wide struct carry a per-device member

Detailed above. The fix is one line of type surgery and no runtime change:

```ts
// account-wide facts only
export interface AccountTrust extends TransportTrust {
  commandTransportReady: boolean;
  credentialsRejected: boolean;
}

// the per-device answer
export interface MonitoringTrust extends AccountTrust {
  shadowSilent: boolean;
}
```

`onMonitoringHealth(account: AccountTrust, byDevice: ReadonlyMap<string,
MonitoringTrust>)` then makes `account.shadowSilent` a compile error,
`monitoringTrustNow()` stops needing its `shadowSilent: true` placeholder and its
paragraph of comment defending it, and `src/platform.ts:401`'s
`{ ...account, shadowSilent: true }` becomes the only place the per-device
default is stated -- which is where it belongs. `markMonitoring`'s four-member
comparison is unaffected.

## ADVISORY-3 -- the declared persistence type does not describe the persisted record

The project constraint says accessory-scoped observation data lives in *typed*
`accessory.context`. Two types claim that role and they disagree:

- `AccessoryContext` (`src/persistence/accessoryContext.ts:86`) declares
  `deviceId: string`, `deviceTypeId: string`, `serialNumber: string` as
  **required top-level** members, plus `lastVendorName`, `primaryPump?`,
  `backupPump?`, `watermarks?`.
- `BasementGuardianAccessoryContext` (`src/platform.ts:48`) is what the runtime
  actually writes: `device?: { deviceId; deviceTypeId }` (nested), plus
  `lastVendorName?`, `primaryPump?`, `backupPump?`, `watermarks?`. No
  `serialNumber` anywhere.

`AccessoryContext` is referenced only as an indexed-access source for four member
types and by a `satisfies` documentation test
(`test/persistence/accessoryContext.test.ts`). Nothing is ever *typed* as it. So
the file that the codebase presents as the source of truth for what is on disk
describes a flat layout with a required `serialNumber` that the plugin has never
written. `grep -rn "context\.device\|\.context\." src/` confirms it: the identity
is only ever read from `context.device`.

Not BLOCKING -- no code reads those three members, so nothing observes the
mismatch. But it is the one place a reader goes to answer "what is persisted",
and today it answers wrong.

Fix: make `AccessoryContext` the shape that is written, and have
`BasementGuardianAccessoryContext` be `AccessoryContext & UnknownContext` (or
derive it), so one declaration stays the source of what is stored -- which is
what the comment at `src/platform.ts:44-46` already claims is happening.

## ADVISORY-4 -- the accessory factory has no compile-time link to the persisted context type

`BasementGuardianAccessoryOptions.accessory` is `PlatformAccessory`
(`src/accessories/basementGuardian.ts:121`), i.e. the default
`UnknownContext = Record<string, any>`. Two consequences:

- `createPumpRecords({ context: accessory.context, ... })`
  (`src/accessories/basementGuardian.ts:536`) type-checks against
  `PumpRecordsContext` only because `Record<string, any>` is assignable to
  anything. Rename `primaryPump` in `PumpRecordsContext` and nothing fails.
- `deviceIdOf` (`:239`) has to re-narrow `accessory.context` from `unknown` by
  hand, and throws at runtime for the shape a pre-release cache carries.

The runtime guards (`isPumpObservation`, `isActivationWatermarks`,
`isDeviceContext`) do catch a mismatch, and the failure mode is "observation
record resets and logs a warning", not a false normal -- hence ADVISORY. But
typing the parameter as `BasementGuardianPlatformAccessory` (already exported
from `src/platform.ts:61`) would make the seam checked at no cost. That would
also mean the platform and the accessory could no longer drift on where the
device identity lives, which is the mismatch ADVISORY-3 describes.

## ADVISORY-5 -- `readScopes` and what `values()` actually reads are held together by convention

`ServiceRow.readScopes` drives `StatusActive` via `isRowFullyTrusted`
(`src/accessories/serviceCatalogue.ts:275`), while the values a row publishes come
from whatever scopes its `values` closure passes to `trustedGroup`. Nothing ties
the two.

I checked all sixteen row definitions. Every one is correct today: the three rows
that read a second group (`sump-pit-level`, `primary-pump`, `backup-pump`) all
declare `readScopes: [own, 'fault']`, and the two rows that read
accessory-derived facts (`pump-controller-link-lost` reading
`controllerDataLastTrustedAt`, `basement-guardian-offline` reading
`offlineConfirmed`) source those from the scope they are filed under.

The hazard is a future row that reads a second group and forgets to list it: the
value would be correctly withheld by `trustedGroup`, and `StatusActive` would be
pushed `true`, so the tile would show a retained value marked trustworthy. This
is the same false-normal shape as ADVISORY-1, from the other direction.

A cheap tightening: have `trustedGroup` take the row and assert membership --
or, better, derive `readScopes` by making `values` declare the groups it wants
(`values: (groups, input) => ...` where `groups` is built from a declared scope
list) so the two cannot disagree. That is a real refactor, so I would weigh it
against the fact that the catalogue is closed and small.

## ADVISORY-6 -- the `ensureService` soundness precondition is stated, not typed

`ensureService` (`src/accessories/serviceCatalogue.ts:921`) gates service creation
on `projected.length > 0`, and its doc says this is sound "only while every
*required* characteristic of a row's service class comes from a scope that row is
still publishing from", calling that "a precondition rather than a coincidence".

I verified it holds for all four custom services:
`SumpPitService` requires `WaterLevel` + `RawWaterLevelCode` (both `water`);
`PumpService` requires `PumpRunning` (`pump`), with the four record
characteristics correctly optional; `SumpMainsPowerService` requires
`MainsPowerPresent` (`power`); `BackupBatteryService` requires four `battery`
characteristics. And `toRow`'s `project` short-circuits to `[]` whenever the row's
own scope is unpublishable, so the "own scope withheld, second scope publishes,
service created with required characteristics at HAP defaults" path is not
reachable.

The precondition is genuinely enforced -- just not by a type. `ServiceDefinition`
(`src/accessories/customServices.ts:88`) has `required` and `optional` arrays of
`CharacteristicClass`, and `ServiceRow` has `scope`; nothing relates them. A
characteristic moved from `optional` to `required`, or a row's `values` changed to
source a required characteristic from a second group, would break the gate
silently. Worth a comment cross-reference at minimum; the reviewer's honest
assessment is that a type encoding this would cost more than it saves.

## ADVISORY-7 -- commit `7012d5b`: `connected: boolean` to `connectivity: DeviceSnapshot['connectivity']`

Asked specifically. My read: **a genuine type-design improvement that happens to
also satisfy the rule**, not rule-satisfaction dressed up.

The function's own comment (unchanged by the commit) asserts an invariant:

> The count only ever reads `connectivity.connected`, never the device's own
> `data.offline` report, because an alert raised from a transport hiccup teaches
> the owner to ignore it (RES-03, D-016).

With `connected: boolean`, that assertion was unenforceable. Every boolean in
scope at both call sites was a legal argument -- `snapshot.data.offline` narrowed
to a boolean, a `reportedOffline` from the decoded connectivity group, an
accidental `!connected`. The parameter type could not tell any of them apart from
the right one. After the change, only a value whose type is the snapshot's
connectivity record satisfies it, and the one place that reads `.connected` is
inside the function. The comment became a compile-time fact.

Two smaller things I like about how it was done:

- it uses the indexed access `DeviceSnapshot['connectivity']` rather than
  importing `ApiConnectivity` from `src/cloud/types.ts`, so the accessory tier
  gains no new dependency on the cloud tier and the parameter reads as "whatever
  a snapshot's connectivity is";
- it does not overshoot into passing the whole `DeviceSnapshot`, which would have
  widened what the function can see for no benefit.

Limits worth naming, none of them a defect: `ApiConnectivity` is a structural
record, so another `{ connected: boolean; timestamp: number }` would still
satisfy it (in practice there is no such other type); and it does not stop the
*wrong device's* connectivity being passed -- but both call sites read
`snapshot.connectivity` from the snapshot they are updating from, one function
above.

Sonar's boolean-selector-parameter rule is a blunt instrument and often produces
worse code than it replaces. This is one of the cases where following it landed on
the design the codebase's own comment had been asking for.

---

# What the codebase does well, for the record

Worth writing down because it is the reason the BLOCKING list is empty:

- **Discriminated unions wherever a verdict is returned.** `FamilyValidation`,
  `FamilyOutcome<T>`, `CommandOutcome`, `ConfigResult`. Every one forces the
  caller through the failure arm.
- **`T | undefined` instead of `T?` where forgetting must not compile.**
  `ScopedDomainState` and `ReportedPatch` both do this deliberately, and the
  files say why.
- **Absence distinguished from a value, three levels deep.**
  `PumpObservation.lastActivationWasTestActivity?: boolean` where absent means
  "the label was never earned" and `false` means "the last activation was
  asserted not to be a test"; `PumpRecordProjection.lastActivationAt: string`
  where `''` means "none observed" rather than a fabricated epoch;
  `UntrustedScope.lastTrustedAt: number | undefined`.
- **Two clock ports rather than two methods.** `Clock` and `MonotonicClock`
  (`src/runtime/monotonicClock.ts:12`) are separate interfaces precisely because
  a call site reading `now()` could not tell which base it holds. That is the
  correct answer and it is rare to see it taken.
- **`ReportedPatch` has no member a requested-state section could land in.**
  Requested control state is structurally incapable of becoming canonical safety
  state (SYNC-02) -- an invariant enforced by the *absence* of a field.
- **Untrusted JSON is `unknown` at every boundary** and narrowed by hand-written
  predicates (`src/cloud/types.ts`, `src/cloud/auth.ts:118`,
  `src/runtime/arrivalAnchors.ts:85`, `src/accessories/pumpRecords.ts:110`). The
  two `as Partial<T>` assertions in `pumpRecords` are immediately followed by a
  `typeof` on every member they reach.
- **`Timers` handles are `unknown`**, so no consumer can depend on
  `NodeJS.Timeout` and a stand-in can be a plain object.
- **`noUncheckedIndexedAccess` is on**, which is what makes the many
  `Record<string, unknown>` reads safe rather than merely conventional.

---

BLOCKING_COUNT: 0
