---
phase: 05-degraded-operation-and-recovery
plan: 06
subsystem: api
tags: [homekit, hap, trust, projection, cucumber, node-test]

requires:
  - phase: 05-degraded-operation-and-recovery
    plan: 01
    provides: "`markMonitoring`, `monitoringDegradedScopes` and the account-wide trust fan-out this plan re-layers"
  - phase: 05-degraded-operation-and-recovery
    plan: 03
    provides: "the command gate and its two refusal causes, which this plan pins against the widened publishing predicate"
provides:
  - "`isRowPublishable` on `src/accessories/serviceCatalogue.ts` — the predicate deciding whether a row may publish what arrived, separate from the one deciding whether the plugin vouches for it"
  - "`SEEING_LESS_REASONS`, the one-member exempt set holding `unreachable` and nothing else"
  - "`distrustReasonsOf` with the monitoring cause layered above the controller-link cause"
  - "`readOutcome` on `features/support/steps/homekit.ts` — the three-way answer telling an absent characteristic from one that answers and one that refuses"
  - "`A flooded pit reaches Apple Home while the live path is silent` and `A blind plugin vouches for no controller-link verdict` in `features/degradedOperation.feature`"
  - "`.planning/REQUIREMENTS.md` RES-04 returned to pending"
affects: [05-07, 05-08, 05-09, 05-10, 06-release-quality]

actuals:
  tokens: 6343
  tasks: 3
  commits: 6
  # `estimateTokens` scale: chars/4 over the realized diff (25 374 chars of added lines across
  # 7 files, 465 insertions). The plan projected 85 000 on the read-set scale, which is the
  # same mismatch the five earlier plans of this phase recorded. It is a measurement
  # difference, not a 13x over-estimate, and a calibration pass should put both figures on one
  # footing before treating it as a ratio.

tech-stack:
  added: []
  patterns:
    - "Two predicates over one trust state: marking counts every distrust reason, withholding counts only the reasons saying the value itself is doubtful"
    - "A three-valued outcome where a two-valued predicate made an absence indistinguishable from a pass, with the met outcome named in the failure"
    - "An assertion stated as what an owner reads off the tile rather than as what the code does, so the paired mutation is one a correct implementation survives"

key-files:
  created: []
  modified:
    - src/accessories/serviceCatalogue.ts
    - src/accessories/basementGuardian.ts
    - features/support/steps/homekit.ts
    - features/degradedOperation.feature
    - test/accessories/serviceCatalogue.test.ts
    - test/accessories/basementGuardian.test.ts
    - .planning/REQUIREMENTS.md

key-decisions:
  - "`D-014` was read, not amended. Withholding is the mechanism by which retention is achieved when the arriving value is bad; against a family-valid value from a working transport it retains nothing and inverts the recovery clause. No checkpoint was raised and no ADR was touched."
  - "The exempt set holds `unreachable` alone. `stale` was excluded deliberately: nothing in `src/` assigns it, and exempting a reason nothing produces would change behaviour silently the day something starts producing it."
  - "`isRowFullyTrusted` keeps the un-narrowed predicate, so `Status Active` still counts a monitoring outage. It is the one signal carrying the doubt."
  - "The flood scenario drives a device whose live path never delivered rather than one that spoke and then went quiet. The second form cannot reach HomeKit at all, for a reason upstream of this plan — recorded in `deferred-items.md`."
  - "The write gate was left reading the withdrawn scopes directly. A monitoring outage now leaves values flowing to the tile and still leaves the plugin unable to vouch for what the device currently reports."

requirements-completed: []

coverage:
  - id: D1
    description: "A flooded pit reported on a healthy REST poll while the live path is silent reaches `Leak Detected = 1` in HomeKit, with that service's `Status Active` reading false"
    requirement: RES-03
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#A flooded pit reaches Apple Home while the live path is silent"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#publishes a flooded pit whose scope the plugin can no longer watch, and stops vouching for it"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#publishes a flood a poll delivers during a lost monitoring path, and marks it rather than dropping it"
        status: pass
    human_judgment: false
  - id: D2
    description: "A field that failed family validation, and a scope a lost controller link poisoned, still publish nothing at all"
    requirement: RES-03
    verification:
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#publishes a scope untrusted for invalid only while the value itself is not in doubt, and vouches for it either way"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#publishes nothing for a scope a lost controller link poisoned"
        status: pass
    human_judgment: false
  - id: D3
    description: "Under a total transport blackout nothing on the accessory reads trustworthy, `Pump Controller Link Lost` included, and it keeps the verdict it held"
    requirement: RES-03
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#A blind plugin vouches for no controller-link verdict"
        status: pass
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#vouches for no controller-link verdict while both transports are down, and keeps the verdict"
        status: pass
    human_judgment: false
  - id: D4
    description: "A monitoring outage activates no safety adapter: with the link present and the device not offline, neither `Pump Controller Link Lost` nor `Basement Guardian Offline` projects an activated contact"
    requirement: RES-03
    verification:
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#activates no Pump Controller Link Lost contact for a monitoring outage the last snapshot said nothing about"
        status: pass
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#activates no Basement Guardian Offline contact for a monitoring outage the last snapshot said nothing about"
        status: pass
    human_judgment: false
  - id: D5
    description: "A press is still refused while a transport is down, so the write gate did not widen with the publishing predicate"
    requirement: RES-04
    verification:
      - kind: unit
        ref: "test/accessories/basementGuardian.test.ts#RES-04 refuses a press while a monitoring outage leaves the control unvouched for, and sends nothing"
        status: pass
    human_judgment: false
  - id: D6
    description: "A step claiming a service answers a read fails when the characteristic is absent, so no scenario can pass on an absence"
    requirement: RES-04
    verification:
      - kind: e2e
        ref: "features/degradedOperation.feature#A transport outage leaves every service readable"
        status: pass
    human_judgment: false
  - id: D7
    description: "A tile whose scope is untrusted for the monitoring cause alone earns its service during the outage rather than a poll after it (WR-08)"
    requirement: RES-03
    verification:
      - kind: unit
        ref: "test/accessories/serviceCatalogue.test.ts#earns its service from the poll that arrives during the outage"
        status: pass
    human_judgment: false
  - id: D8
    description: "`REQUIREMENTS.md` no longer records RES-04 as complete, in either place"
    requirement: RES-04
    verification:
      - kind: other
        ref: "grep -n 'RES-04' .planning/REQUIREMENTS.md"
        status: pass
    human_judgment: false
  - id: D9
    description: "Apple Home renders a marked, still-published tile the way this plan assumes: the value on the tile and `Status Active - No` under Details"
    verification: []
    human_judgment: true
    rationale: "Apple Home's rendering cannot be asserted from the plugin side. This plan changes what an owner sees during an outage — values now move on a marked tile where they previously froze — and only a real paired home shows whether that reads as intended. Rides along with the open G-003 / G-004 session and with `05-VERIFICATION.md` human item 3."

duration: 47min
completed: 2026-09-02
status: complete
---

# Phase 5 Plan 06: Publishing separated from vouching Summary

**A monitoring outage now marks what the plugin can no longer watch instead of discarding what a
working transport is still delivering, and the broader cause reaches every scope first so nothing
reads trustworthy while the plugin is blind.**

## Performance

- **Duration:** 47 min
- **Started:** 2026-09-02T11:47:00Z
- **Completed:** 2026-09-02T12:34:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- `isRowPublishable` splits "the plugin must not publish this scope" from "the plugin cannot vouch
  for this scope". A flooded pit reported by a healthy REST poll while the live path is silent now
  reaches `Leak Detected = 1` on the tile, with `Status Active` alone carrying the doubt. That is
  CR-01, the defect the whole project exists to prevent, closed end to end.
- `distrustReasonsOf` applies the monitoring cause before the controller-link cause. A blackout now
  withdraws all eight scopes under `unreachable` — the cause that happened — instead of leaving seven
  under `controller-link-lost` and `Pump Controller Link Lost` reading `Status Active = true` while
  the plugin can see nothing at all. That is WR-01.
- The Cucumber read step tells an absent characteristic from one that answers, and names which of the
  three outcomes it met when it fails. No scenario in the repository can pass a read assertion on a
  characteristic that does not exist. That is WR-06.
- Two unit cases that asserted the defect's own signature now assert what an owner reads off the
  tile.
- Three load-bearing comments that stated the opposite of what the code does were corrected (WR-04,
  IN-02, and the scope count above `NON_CONNECTIVITY_SCOPES`).
- RES-04 is back to pending, so a later audit does not read a gap as shipped.

## Task Commits

1. **Task 1: Make the read step tell an absent characteristic from one that answers** — `038e775`
   (fix)
2. **Task 2: End-to-end, a flooded pit polled while the live path is silent reaches Apple Home** —
   `26072ed` (test, RED) then `f2a1e3c` (feat, GREEN)
3. **Task 3: Put the broader cause first** — `758e6da` (test, RED) then `dcaab3d` (fix, GREEN), with
   `0b94b74` (docs) for the RES-04 correction

## Files Created/Modified

- `src/accessories/serviceCatalogue.ts` — adds `SEEING_LESS_REASONS` and `isRowPublishable`; points
  `toRow.project` and `trustedGroup` at it; rewrites the two predicate doc comments, the module
  header, and the `ServiceRow.values` contract
- `src/accessories/basementGuardian.ts` — reorders `distrustReasonsOf`; corrects the
  `NON_CONNECTIVITY_SCOPES`, `republishPublishedRows` and `markMonitoring` comments
- `features/support/steps/homekit.ts` — replaces `readThrows` with `ReadOutcome` / `readOutcome` and
  `untilReadOutcome`
- `features/degradedOperation.feature` — two scenarios added
- `test/accessories/serviceCatalogue.test.ts` — new `isRowPublishable` block, 15 cases
- `test/accessories/basementGuardian.test.ts` — three cases added, two rewritten
- `.planning/REQUIREMENTS.md` — RES-04 returned to pending in both places
- `.planning/phases/05-degraded-operation-and-recovery/deferred-items.md` — created, two entries

## The `D-014` reading this plan acted on

`PROJECT.md` `D-014` is ADR-locked and reads, in full:

> **D-014 — Preserve untrusted state:** Retain the last family-valid values through invalid data or
> communication loss, mark only the truthful scope faulty/inactive, and require fresh valid input
> for recovery.

**Nothing was amended, narrowed, or reinterpreted, and no decision checkpoint was raised.** The
argument is from the clauses themselves. Withholding is the mechanism by which "retain the last
family-valid values" is achieved when the arriving value is bad, because publishing a field that
failed validation would overwrite a retained good value with a bad one. It does not serve that clause
when the arriving value is family-valid and the transport that delivered it is working: withholding
then retains nothing, because nothing was threatening the retained value, and it replaces a fresh
valid reading with a staler valid one. "Mark only the truthful scope faulty/inactive" names marking
as the whole of the response beside retention and nowhere says discard. And under the shipped
behaviour fresh valid input arrived, was validated, and was ignored, so "require fresh valid input
for recovery" was not merely unserved but inverted.

`05-CONTEXT.md` `D-02` corroborates in its own words: **"Preserve-and-mark still holds: values are
retained, only trust is withdrawn."** `D-02`'s narrowing note of 2026-09-01 had already named `toRow`
returning `[]` for an untrusted row as the obstacle — it recorded that applying `D-02` literally
"would silence `Basement Guardian Offline`" because "`toRow` returns `[]` for an untrusted row" — and
worked around it by shrinking the withdrawn scope set rather than fixing the predicate. This plan
fixed the root of a problem the locked decision had already named and routed around. `05-01-PLAN.md`
said the same in its own prohibition: "preserve-and-mark must not become preserve-and-hide".

The structural guarantee that makes the narrower predicate safe rather than merely defensible is
unchanged and was preserved: `published()` drops every `undefined` candidate, `decodedGroup()`
answers `undefined` for a group that did not decode, and `booleanOf`/`numberOf` answer `undefined`
for an absent or wrong-typed field. An absent value is omitted, never defaulted. A row can only
publish a value some transport delivered, so with both transports down nothing new arrives and every
tile holds the value the last trustworthy observation left, marked.

## Unit cases whose expectation moved

Two, both in `test/accessories/basementGuardian.test.ts`. `test/accessories/serviceCatalogue.test.ts`
contained no case over the monitoring cause at all — the string `unreachable` did not appear in it —
so nothing there had an expectation to move.

| Before | After | Why |
|---|---|---|
| `retains every published value across a lost monitoring path and moves the trust flag alone` | `publishes a flood a poll delivers during a lost monitoring path, and marks it rather than dropping it` | The old case asserted that nothing moved across `markMonitoring`, which is the defect's own signature and passes either way, because no poll had arrived for anything to move. The new one polls the family's flood code during the outage and asserts `Leak Detected = 1` with the marker false, and that the only characteristics that moved are the three the flood reading owns |
| `keeps a lost monitoring path withdrawn across the polls that arrive during it` | `keeps a lost monitoring path withdrawn across a poll that moves a value during it` | The old case polled the telemetry the accessory already held, so "withdrawn across the polls" was checked against a published surface that could not have moved whether or not the poll reached it. The new one drops mains power during the outage and asserts the contact moved, the marker is false, and the seven withdrawn scopes still say `unreachable` |

No case asserting withholding under the validation cause or the controller-link cause was touched.

## Mutations applied, watched, reverted

Every mutation `05-VALIDATION.md` names for a behaviour in this plan, with the exact assertion it
broke. Each was reverted and the suite confirmed green afterwards.

| Mutation | Assertion it broke |
|---|---|
| Assert a read for a characteristic the service does not carry (`Then the "Sump Pit Flood" service answers a read for "Water Level"` planted in `A transport outage leaves every service readable`) | That step, with `the Sump Pit Flood service never answered a read for Water Level: it carried no such characteristic` |
| Point the row projection back at the un-narrowed trust predicate | Scenario `A flooded pit reaches Apple Home while the live path is silent`, at `Then the "Sump Pit Flood" sensor is activated` — "the Sump Pit Flood sensor never activated within 2000 ms". Also four unit cases: `publishes a flooded pit whose scope the plugin can no longer watch, and stops vouching for it`, both `activates no … contact for a monitoring outage the last snapshot said nothing about` cases, and `earns its service from the poll that arrives during the outage` |
| Add `invalid` to the exempted-reason set | `publishes nothing for a scope whose own field failed family validation`, `publishes a scope untrusted for invalid only while the value itself is not in doubt, and vouches for it either way`, `publishes nothing while the value is in doubt, whatever else the same scope also lost`, `publishes the second scope group a row reads while that scope is untrusted for invalid`, plus five pre-existing catalogue cases including `publishes no controller link state at all while the link fact failed validation` |
| Add `controller-link-lost` to the exempted-reason set | `publishes nothing for a scope a lost controller link poisoned`, `publishes a scope untrusted for controller-link-lost only while the value itself is not in doubt, and vouches for it either way`, and the pre-existing `silences every other fault adapter while a lost link makes the fault scope untrusted` |
| Make `controllerLinkValues` derive its activation from the row's trust instead of from the decoded `controllerLinkPresent` | `activates no Pump Controller Link Lost contact for a monitoring outage the last snapshot said nothing about`, plus `activates one fault adapter alone for a lost controller link` and `keeps the controller link adapter publishing while a lost link makes its own scope untrusted` |
| Move the monitoring layer back below the controller-link layer in `distrustReasonsOf` | Scenario `A blind plugin vouches for no controller-link verdict`, at `Then the "Pump Controller Link Lost" service reports "Status Active" as "false"`, and the unit case `vouches for no controller-link verdict while both transports are down, and keeps the verdict` |
| Route `reportedControlValue` through the publishing predicate | `RES-04 refuses a press while a monitoring outage leaves the control unvouched for, and sends nothing` |

**One mutation could not be applied as written.** `05-VALIDATION.md` names "Make `ensureService` also
require the row to be fully trusted before it adds a service" for the WR-08 behaviour. `ensureService`
takes an accessory, a row, and the projected values, and receives no trust state at all, so the
mutation is not expressible without changing that signature — which would be a different change under
test. The equivalent mutation on the same path, un-narrowing the projection so a monitoring-degraded
row projects nothing, does break the named assertion `earns its service from the poll that arrives
during the outage`, and is recorded in the row above.

## The assertion closing WR-08

`earns its service from the poll that arrives during the outage`, in
`test/accessories/serviceCatalogue.test.ts`:

```ts
const service = ensureService(accessory, row, row.project(input));
assert.strictEqual(service?.displayName, 'Sump Pit Flood');
```

with `input` carrying `{ scope: 'water', reason: 'unreachable' }`. `ensureService` answers `undefined`
only when the row projected nothing and is not `alwaysPublish`; a row untrusted for the monitoring
cause alone now projects its retained values, so its service is added by the poll that arrives during
the outage rather than by the one after recovery. `runPoll`'s ordering is left as it is, because with
that behaviour holding it costs nothing observable.

## The two comment corrections, quoted back

**WR-04**, above `republishPublishedRows` in `src/accessories/basementGuardian.ts`:

> Two callers reach this, and the connectivity row lands differently under each. For the
> unresolved-family caller it is the row this leaves alone, because nothing about it stopped being
> knowable: it reads the accessory's own count of consecutive disconnected polls rather than anything
> an adapter decoded, so it keeps publishing its current verdict and stays active, which is what the
> wire envelope still supports. For the monitoring caller a degraded poll is exactly what stops
> sourcing that count, so `connectivity` is withdrawn with reason `unreachable` and the row goes
> inactive while keeping the verdict it had (D-014, RES-03, WR-04).

**IN-02**, inside `markMonitoring`:

> The store sits outside the early return below deliberately. The runtime reports on every poll tick,
> so republishing per tick would be noise rather than information, while the assignment itself costs
> nothing: the comparison above covers every member of `MonitoringTrust`, so an unchanged report
> stores what is already there. What the placement buys is the next member -- one added to the type
> and forgotten in the comparison still reaches the write path, which reads the stored value directly
> rather than through the row projection (IN-02, RES-04, D-07).

Neither the comparison nor the store changed. Only the stated reason did.

## Scope counts corrected

One, and it was derived from `TRUST_SCOPES` rather than from any document. The comment above
`NON_CONNECTIVITY_SCOPES` said a lost pump-controller link "poisons the same five"; the constant is
`TRUST_SCOPES.filter((scope) => scope !== 'connectivity')`, and `TRUST_SCOPES` has eight members, so
the set holds seven. Every other spelled-out number in `src/accessories/basementGuardian.ts` was read
and is about something else — the two transports, the two degradation fields, the three sets a
monitoring failure can withdraw — and each is correct.

The new comment above `distrustReasonsOf` states both counts explicitly and says where they come
from: eight members in `TRUST_SCOPES`, seven in `NON_CONNECTIVITY_SCOPES`.

## Which green-but-blind assertions can now fail

The plan projected six. Four hold as stated, and the fifth is unchanged rather than improved:

1. `retains every published value across a lost monitoring path…` — rewritten; now fails under the
   un-narrowing mutation.
2. `keeps a lost monitoring path withdrawn across the polls…` — rewritten; the poll now moves a
   value.
3. `Then the "Sump Pit Flood" service answers a read for "Leak Detected"` in `A transport outage
   leaves every service readable` — this is the assertion WR-06 named, which would have passed if
   the service never published `Leak Detected` at all. It now fails on an absence.
4. `Then the "Sump Pit Flood" service answers a read for "Status Active"` in the same scenario — same
   correction.
5. `Then the "Sump Pit Flood" service answers no read for "Status Active"` in `Credential rejection
   makes every service unreadable` already failed by name on an absence and still does. The rewrite
   did not change its verdict, only the wording of its failure.

The scenario `Shadow silence withdraws trust while polling continues` was left as it is. It polls
unchanged telemetry after a dry reading and passes whether or not the value flows, and the plan
allowed either strengthening it or adding a second scenario carrying the changed-payload claim. The
second scenario was added, so that claim is now asserted somewhere; the old scenario continues to
assert what it always did, which is that the marker moves and no adapter activates.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — missing critical correctness] Two more doc comments in `serviceCatalogue.ts` stated
the opposite of what the code now does**

- **Found during:** Task 2
- **Issue:** The plan named `isRowTrusted`'s doc comment for rewriting. Two others made the same
  claim and would have been left false: the module `@fileoverview` said "A row that cannot vouch for
  a fact projects nothing for it at all", and `ServiceRow.values` said "The values to publish, or
  nothing at all when this row cannot vouch for them" and described the per-value rule in terms of
  the vouching predicate. This repository treats comments as load-bearing, and leaving a false one
  beside the code it describes is the WR-04 defect class this round exists to close.
- **Fix:** Both scoped to the doubt case, with the monitoring case stated beside it. The
  `ServiceRow.values` contract now names `isRowPublishable` as the predicate the per-group rule runs
  on.
- **Files modified:** `src/accessories/serviceCatalogue.ts`
- **Verification:** `npm run check` on both installed Node versions; the claims were read back
  against the implementation.
- **Committed in:** `f2a1e3c`

---

**Total deviations:** 1 auto-fixed (1 × Rule 2)
**Impact on plan:** Comment-only, in the file the task already owned. No scope creep.

## Issues Encountered

**The end-to-end scenario had to be built on a device whose live path never delivered, not one that
spoke and then went quiet.** The first draft published a heartbeat, moved the clock past two missed
heartbeats, and then polled the flood code. The canonical snapshot never carried it, however many
polls ran, and the failure is upstream of everything this plan touches: `pollTelemetry`
(`src/device/state.ts:173-175`) keeps the previous snapshot's telemetry whenever `shadowVersion` is
set, and the watermark is released in one place only — `handleShadowDisconnected`. Shadow silence is
not a disconnection, so once a versioned shadow message has arrived no REST poll refreshes telemetry
for as long as the silence lasts.

Both halves matter and are separable. The accessory-layer defect CR-01 named is real and is closed:
a family-valid value arriving on a working transport now reaches the tile, proven end to end and by
three unit cases. A second gate sits upstream of it for any device whose live path spoke and then
stopped, and releasing the watermark on silence would change the reconciliation contract `D-15` and
`SYNC-03` lock. That is a decision rather than a bug fix, so deviation rule 4 applied and it was not
made here. It is recorded in `deferred-items.md` and in `.planning/WINDOWS.md`, with the question
stated as: does two missed heartbeats mean the shadow has stopped being the source, in the same sense
a closed connection does?

**One thing was briefly lost and rebuilt.** A `git checkout --` used to revert a mutation also
discarded the uncommitted implementation it sat beside. It was reapplied from the same edit and the
diff reviewed line by line before committing; no mutation reached a commit. Later mutations were
applied and reverted by targeted text replacement with an assertion on the match count.

## Review findings carried forward as deferred

**WR-05** — the nine-member `DiscoveryContext` literal written three times in `src/platform.ts`. Not
acted on, as the plan recorded. The drift it warns about has not happened; the reviewer read all
three and found them byte-identical. It wants a change that owns the composition root.

**IN-03** — shadow silence measured against a wall clock that can jump. Not acted on, as the plan
recorded, and the finding itself says "No change required for this release." It wants the next intel
refresh.

## Known Stubs

None. Every value this plan lets reach a characteristic is one a transport delivered and the family
validated; nothing was hardcoded, defaulted, or placeholdered.

## Threat Flags

None. This plan publishes no new HomeKit identity, adds no characteristic, adds no configuration key,
and installs no package. `package.json` and `package-lock.json` are unchanged.

## Verification

- `npm run check` passes: typecheck, lint, `fallow`, format check, 1313 unit tests, 91 Cucumber
  scenarios, 923 steps.
- `npm run test:coverage:direct` on both focused pairs reports 100.00 line, branch and function
  coverage for `serviceCatalogue.js` and for `basementGuardian.js`.
- `npm run test:coverage:all` reports 100.00 / 100.00 / 100.00 across every module.
- `npm run fallow` reports one clone group, the pre-existing 14-line pair on
  `features/support/steps/hap.ts:113-124` and `:168-181`. No new finding.
- The final gate ran on both installed Node versions: the default `node` v26.7.0 and `/usr/bin/node`
  v22.22.2. 1313 unit tests and 91 scenarios pass on each. Node 24.x is not installed locally.
- Suite counts moved from the verified baseline of 1295 unit tests, 89 scenarios and 894 steps to
  1313, 91 and 923. The existing scenarios grew rather than shifted.

## Next Phase Readiness

Plans 05-07 through 05-10 are unblocked and none of them depends on a decision this plan left open.
05-09 opens `src/platform.ts` at `configureAccessory` and 05-10 restores RES-04 once its two
remaining clauses hold; RES-04 is pending until then, which is the state 05-10 expects to find.

The watermark question in `deferred-items.md` is the one thing a reader of this phase should not lose.
It does not block the remaining plans, and it does bound what "the poll is the reconciliation backstop"
currently means.

## Self-Check: PASSED

- `src/accessories/serviceCatalogue.ts` — FOUND
- `src/accessories/basementGuardian.ts` — FOUND
- `features/support/steps/homekit.ts` — FOUND
- `features/degradedOperation.feature` — FOUND
- `test/accessories/serviceCatalogue.test.ts` — FOUND
- `test/accessories/basementGuardian.test.ts` — FOUND
- `.planning/REQUIREMENTS.md` — FOUND
- `.planning/phases/05-degraded-operation-and-recovery/deferred-items.md` — FOUND
- `038e775` — FOUND
- `26072ed` — FOUND
- `f2a1e3c` — FOUND
- `758e6da` — FOUND
- `dcaab3d` — FOUND
- `0b94b74` — FOUND

---

*Phase: 05-degraded-operation-and-recovery*
*Completed: 2026-09-02*
