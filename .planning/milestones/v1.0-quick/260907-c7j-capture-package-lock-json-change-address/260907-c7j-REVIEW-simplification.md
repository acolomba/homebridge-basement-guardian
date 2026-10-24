# Codebase review: simplification and duplication

Dimension: reuse, duplication, dead code, clarity.
Scope: whole codebase, `src/**/*.ts` (43 files, ~11,300 lines). Read in full.
Mode: report only. No source file was modified.

## Verdict

**BLOCKING_COUNT: 0.**

I found no duplicated logic that has already diverged, and no dead or unreachable
code that would mislead a maintainer into an incorrect change. Every finding
below is ADVISORY.

That is the honest result for this codebase. It is unusually disciplined:
almost every branch that looks redundant carries a comment saying which failure
it prevents, and in every case I checked the branch was load-bearing.

## Method, and what I deliberately did not propose

The task warned that apparent redundancy here is often load-bearing. It is. I
traced these before deciding not to propose collapsing them:

- **`isRowTrusted` vs. `isRowPublishable`**
  (`src/accessories/serviceCatalogue.ts:239`, `:257`). They differ by exactly
  one term, `SEEING_LESS_REASONS`. Merging them would either withhold a fresh
  valid reading during a transport outage, or mark a doubtful value active. Both
  answers are wrong in different directions. Left alone.
- **`isRowFullyTrusted` vs. `isRowTrusted`** (`:275`). The first quantifies over
  `readScopes`, the second over the filed scope alone. A row reading a second
  scope group needs both. Left alone.
- **The five `undefined` guards in the HAP mappers** (`contactState`,
  `faultState`, `lowBatteryState`, `chargingState`, `leakState`,
  `serviceCatalogue.ts:350-401`). Each returns `undefined` for an absent fact so
  `published()` drops it. Collapsing the `undefined` case into a default is the
  false-normal failure the plugin exists to prevent. See A4 for what *can*
  safely be shared.
- **`monitoringDegradedScopes`** (`src/accessories/basementGuardian.ts:325`).
  Three branches returning three different scope sets. `EVERY_SCOPE` appears
  twice, but under two different causes with different recovery semantics. Not
  equivalent. Left alone.
- **`distrustReasonsOf` layer order** (`basementGuardian.ts:355`). The
  `!reasons.has(scope)` guards look like defensive no-ops; they are the
  precedence rule that keeps `invalid` from being overwritten by `unreachable`.
  Left alone.
- **`nextShadowVersion`'s split between `patch.data` and `carriesObservation`**
  (`src/device/state.ts:264`). These read genuinely different questions and the
  comment explains why. Left alone.
- **`silenceElapsedMs`'s `Math.max`** (`src/runtime/monitoringHealth.ts:209`).
  Each term covers a failure the other does not. Left alone.
- **`gemini.ts` `booleanField` / `numberField` throw guards** (`:228-274`).
  They look unreachable given `validate()` runs first, but `decode()`'s
  documented contract is that it is self-guarding on a partly-invalid snapshot.
  Removing them would turn a broken gate into a confidently wrong reading. Left
  alone.
- **`waterLevelPercentage`'s throw** (`src/device/waterLevel.ts:54`). Same
  reasoning. Left alone.

---

## ADVISORY findings

Ordered by value, highest first.

### A1. The Gemini value domains are written out in three modules

**Where**

| Domain | Sources |
| --- | --- |
| Legal `water_level` codes | `src/device/gemini.ts:80` (`WATER_LEVEL_VALUES`), `src/device/waterLevel.ts:27` (`PROVISIONAL_WATER_LEVEL_PERCENTAGES` keys), `src/accessories/customCharacteristics.ts:168` (`validValues`) |
| Legal `battery_health` codes | `gemini.ts:81` (`BATTERY_HEALTH_VALUES`), `customCharacteristics.ts:183` (`validValues`) |
| Legal `hours_of_protection` codes | `gemini.ts:86` (`PROTECTION_HOURS_PERCENTAGES` keys), `customCharacteristics.ts:189` (`validValues`) |

**Status today: all three agree.** I compared them element by element. Nothing
has diverged, which is why this is ADVISORY rather than BLOCKING.

**Why it is still the most valuable finding.** The third copy is enforced by
HAP, not by this code. A `validValues` list that fell behind the family
adapter's accepted domain would mean the plugin validated a code, decoded it,
projected it — and then HAP refused or reshaped the push of
`RawWaterLevelCode`. The characteristic exists specifically so a provisional
ladder can be checked against a real pit (D-015), so a silently dropped raw code
defeats its only purpose. `G-002` is an open gate that will edit exactly these
values, so the edit that could diverge them is a scheduled one, not a
hypothetical.

**The pattern is already established one level down.** `gemini.ts:95` derives
`HOURS_OF_PROTECTION_VALUES` from `PROTECTION_HOURS_PERCENTAGES.keys()` for
precisely this reason. What is missing is the same derivation across the module
boundary.

**The fix is not trivial and I am not proposing a specific one.**
`customCharacteristics.ts` importing from `device/gemini.ts` would make the
accessories tier family-aware, which D-003 forbids and which
`serviceCatalogue.ts:293` pays a structural narrowing to avoid. Two options that
respect the layering:

1. Move the three domain sets into a family-neutral module the accessories tier
   may import (a published-domain module), and have `gemini.ts` import them.
2. Leave the duplication and add a unit test that asserts the three lists are
   equal, so a `G-002` edit that touches one fails the build. This is what
   `test/configSchema.test.ts` already does for the `ignoredFaults` enum, so the
   project has precedent for the cheaper answer.

Option 2 is the smaller change and matches the codebase's own habit.

### A2. Atomic JSON file writing is duplicated between `cloud/auth.ts` and `runtime/arrivalAnchors.ts`

Four near-identical function pairs, roughly 60 lines:

| `src/cloud/auth.ts` | `src/runtime/arrivalAnchors.ts` |
| --- | --- |
| `temporaryPath` (`:211`) | `temporaryPath` (`:133`) — byte-identical |
| `storeCache` (`:224`) | `storeAnchors` (`:149`) — identical but for one option |
| `parseCacheFile` (`:150`) | `parseAnchorFile` (`:89`) — identical but for the comment |
| `readCacheFile` (`:161`) | `readAnchorFile` (`:100`) — same `access` probe, same shape |
| `TEMPORARY_SUFFIX_BYTES = 8` (`:57`) | `TEMPORARY_SUFFIX_BYTES = 8` (`:34`) |

The one real difference is the write mode: `storeCache` passes
`{ mode: OWNER_ONLY_MODE, flag: 'wx' }`, `storeAnchors` passes `{ flag: 'wx' }`.
`arrivalAnchors.ts:143-148` explains that omission deliberately and well.

**Why ADVISORY, not BLOCKING.** The divergence is intentional and documented,
and both copies are correct. But the shared half is the part that is easy to get
wrong — exclusive create, rename-or-unlink, silent failure — and a fix applied to
one copy would not reach the other.

**Suggested shape.** A small `persistence/atomicJsonFile.ts` exporting
`writeAtomically(target, contents, options?)` and `readJsonIfPresent(path)`,
with the file mode as an explicit parameter so the difference stays visible at
both call sites rather than disappearing into a default.

### A3. `isRecord` exists in three copies; `isUnknownArray` in two

- `isRecord`: `src/cloud/types.ts:105` (exported), `src/accessories/serviceCatalogue.ts:206`,
  `src/accessories/basementGuardian.ts:231`. All three bodies are identical.
  `src/runtime/arrivalAnchors.ts:28` already imports the exported one.
- `isUnknownArray`: `src/cloud/types.ts:111`, `src/config.ts:66`.

Three lines each, so the cost is low. The reason to note it: the accessories
tier importing a predicate from the cloud tier is a layering question, not a
correctness one, and the answer is probably a neutral `typeGuards.ts` rather than
either tier importing the other. Worth one deliberate decision rather than three
independent copies that happen to match.

### A4. Five near-identical two-state HAP mappers

`src/accessories/serviceCatalogue.ts:350-401` — `contactState`, `faultState`,
`lowBatteryState`, `chargingState`, `leakState`. Each is the same six lines:
destructure the characteristic, return `undefined` for an absent fact, otherwise
pick one of two declared constants.

**Constraint that any consolidation must respect.** The `undefined` branch is
load-bearing in all five — it is what stops an undecoded fact from becoming a
normal-looking default. A shared helper must keep the absent case as its own
branch, not fold it into a falsy check:

```ts
function twoState(fact: boolean | undefined, whenTrue: CharacteristicValue, whenFalse: CharacteristicValue): CharacteristicValue | undefined {
  return fact === undefined ? undefined : (fact ? whenTrue : whenFalse);
}
```

Each named wrapper then becomes one line and still carries its domain name and
its comment. I checked all five call sites; the mapping is uniform and no caller
depends on a difference between them.

Judgment call: the current form is explicit and readable, and the project's own
style rules prefer clarity over brevity. This is a genuine but modest win, and
reasonable people could leave it.

### A5. `publishRows` inlines the body of `publishRow`

`src/accessories/basementGuardian.ts:741-745` repeats `publishRow`'s two
statements (`:630-634`) verbatim. They have **not** diverged — I compared them.

The reason for the copy is visible: `publishRows` already holds `projected` for
`ensureService` and calling `publishRow` would re-run `row.project(input)`. That
is avoidable by giving `publishRow` the projection:

```ts
function publishRow(row: ServiceRow, service: Service, input: ProjectionInput, projected = row.project(input)): void
```

Low risk, and it removes the one place where the two publish paths could drift
apart in what they push.

### A6. Two consecutive `if` blocks with identical bodies

`src/accessories/pumpRecords.ts:284-294`:

```ts
if (seedingTheFirstWatermark) {
  backupEdgeAwaitingItsTimestamp = false;
  return true;
}

if (backupEdgeAwaitingItsTimestamp) {
  backupEdgeAwaitingItsTimestamp = false;
  return true;
}
```

Genuinely equivalent to a single `||`. I traced both conditions through
`observe()` and confirmed no third path distinguishes them.

**Argument against changing it.** The two blocks carry different comments
explaining two different reasons for the same act, and merging them would make
one of the two rationales homeless. If merged, both comments must survive above
the joined condition. This is a case where the duplication buys documentation.
Optional.

### A7. `Reconciliation` takes a clock it never reads

`src/accessories/reconciliation.ts:45` declares `clock: Clock` on
`ReconciliationOptions`. I grepped the whole module: `clock` appears only in the
import (`:18`) and the field (`:45`). Nothing in `observe` or `forget` reads it.

Consequence: `accountRuntime.ts:314` and every test must construct and supply a
clock the module cannot use. More importantly, a maintainer reading the interface
would reasonably infer that absence confirmation is time-based. It is not — it is
purely a count of consecutive responses, which is the module's whole point.

Removing the field is a small, safe clarity win. It would touch
`accountRuntime.ts:314` and `test/accessories/reconciliation.test.ts`.

Related, same file: `nextAbsenceCount(previousCount)` (`:52`) is a named function
whose entire body is `previousCount + 1`. The comment beside it carries the D-029
rationale, which is worth keeping; the function wrapper is not. Inlining and
keeping the comment on the call site would read the same.

### A8. Two declaration-only modules with no production consumer

- `src/device/events.ts` — four interfaces and the `DeviceEvent` union. Zero
  references anywhere in `src/`. The file says so itself (`:13-15`) and it is
  listed in `.fallowrc.json`'s `ignoreFindings`.
- `src/device/health.ts:48` — `DeviceHealth`, described at `:12` as "the
  aggregate projection nothing assembles yet". Zero references in `src/`.

Both are type-only, both have type-only tests (`test/device/events.test.ts`,
`test/device/health.test.ts`), and both are honestly labelled. They emit no
runtime code and cannot cause a wrong value.

Not BLOCKING, because a maintainer cannot be misled into an incorrect change by
a type nothing uses, and the files say plainly that nothing uses them. Worth a
decision before `1.0.0` all the same: a shipped declaration with no consumer is a
contract the project has not yet had to honour.

### A9. `AccountRuntime.monitoringPath` has no production consumer

`src/runtime/accountRuntime.ts:198`, `:485`, `:1046`. `platform.ts` never reads
it; nothing else in `src/` does either. It is exercised only by
`test/runtime/accountRuntime.test.ts` (19 assertions).

`monitoringPathNow()` is real logic — the `stopped || halted || !polling` ladder
— that is computed on demand for a caller that does not exist outside tests. Its
own doc comment (`:161`) calls it "the diagnostic" and says the trust decision
lives elsewhere, which is accurate.

Two honest options: expose it (a debug log line on each poll outcome would make
it earn its keep), or drop it and the member from `AccountRuntime`. Either is
better than a public interface member whose only reader is its own test suite.

### A10. Small constants duplicated across modules

- `MILLISECONDS_PER_SECOND`: `src/cloud/auth.ts:28`, `src/runtime/accountRuntime.ts:42`
  (both `1_000`), `src/accessories/pumpRecords.ts:36` (`1000`, without the
  separator). Three declarations of the same physical fact, and the third does
  not even match the other two typographically.
- `TEMPORARY_SUFFIX_BYTES = 8`: `auth.ts:57`, `arrivalAnchors.ts:34`. Would
  disappear with A2.

These cannot cause a bug — the value of a second will not change. The cost is
purely that a reader meets the same constant three times and has to check
whether the third one is different for a reason. It is not.

### A11. The offline-confirmation default is stated twice

`src/accessories/basementGuardian.ts:180` declares
`DEFAULT_OFFLINE_CONFIRMATION_POLL_COUNT = 2`, and the comment above it says it
repeats what `src/config.ts` resolves. `src/config.ts:32` holds the same value as
`POLL_COUNT_BOUNDS.documentedDefault`.

I traced whether a divergence could produce a wrong value in production. It
cannot: `platform.ts:573` always passes the validated
`offlineConfirmationPollCount`, so the accessory's own default is only ever used
by a direct caller of the factory — tests and the Cucumber harness. A divergence
would therefore make the harness disagree with production about the threshold,
which is a test-fidelity problem rather than a user-visible one.

Cheapest fix: export the resolved default from `config.ts` and import it, or add
a unit assertion that the two are equal.

### A12. `handleClose` repeats its release-and-reschedule shape

`src/cloud/shadow.ts:326-336`. Both branches do `log.debug(...)` then
`release(target, <reason>)`, and both fall through to the same
`scheduleReconnect(reopen)`.

The two messages and the two reasons are genuinely different and must stay
different — an established connection closing is routine, a handshake refused
before establishment is not, and D-15 turns on telling them apart. Only the
shared act could be lifted:

```ts
const routine = target.established;
options.log.debug(routine ? '…routine' : '…refused before established');
release(target, routine ? 'transport-closed' : 'handshake-refused');
scheduleReconnect(reopen);
```

That is a wash on line count and arguably less readable than the current
if/else, which the project's style rules prefer over conditional expressions.
Noted for completeness; I would leave it.

### A13. Two log-once helpers share a shape

`reportDegradation` (`basementGuardian.ts:807`) and `reportControllerLink`
(`:871`) both implement: clear the flag when the condition ends, return early
when the flag is already set, otherwise warn and set. Three states, same
structure, different conditions and different messages.

A shared `logOnce(flag, condition, message)` helper is possible but would need to
own the mutable flag, which means either a closure per condition or an object,
and the call sites would get no shorter. Low value. Noted because it is the third
instance of the pattern in the codebase (`registry.shouldLog`,
`auth.reportTransient`) and a fourth would be worth consolidating.

### A14. The Gemini check tables run twice per snapshot

`basementGuardian.update()` calls `family.validate(snapshot)` (`:1022`) then
`family.decode(snapshot)` (`:1023`). `validate` runs
`violationsOf(TELEMETRY_CHECKS, …)` and `violationsOf(METADATA_CHECKS, …)`
(`gemini.ts:220`); `decode` runs both again through `untrustedScopesOf`
(`:347`) and `isMetadataTrustworthy` (`:353`). That is 22 field checks executed
twice per snapshot, per device, per poll and per live message.

**Do not "fix" this by making `decode` trust `validate`'s output.** The family
contract (`src/device/family.ts:186-193`) states explicitly that `decode()` runs
on snapshots that did not fully validate and must check each scope's own fields
itself. That self-guarding property is what stops a vendor schema change from
becoming a confidently wrong reading.

The cost is negligible — 44 `typeof` checks against a poll interval measured in
minutes — so the only reason to act would be readability, and I do not think it
improves. Recorded so a future reader does not "discover" the double work and
remove the guard.

### A15. `createRedactingLogger` writes its `log` member inline

`src/logging.ts:176-178` writes out the `log(level, message, …)` member by hand
while the other five go through `wrapMember` (`:106`). The difference is real —
`log` takes a level as its first argument — so `wrapMember` cannot serve it as
written. A second small helper would remove the asymmetry, at the price of a
helper used once. Marginal; noted only because the file's own doc comment
(`:117`) claims all seven paths redact, and a reader checking that claim has to
verify one path by eye rather than by the shared helper.

### A16. One doc comment overstates a coupling

`src/accessories/services.ts:56-59` says `NOTIFICATION_SERVICE_KINDS` is "the one
runtime source the configuration refusal and the shipped settings-form enum both
trace to". The configuration refusal does trace to it (`config.ts:2`). The
settings-form enum does not — `config.schema.json:62-70` is a hand-written list.

The lists do match today, and `test/configSchema.test.ts:173-176` deliberately
writes the seven names out again so a change to either fails the build, with a
comment explaining why. So the *guarantee* holds; only the sentence describing
how it holds is wrong. Adjusting the comment to say the schema is pinned by a
test rather than derived from the constant would save a future reader the
five minutes I spent checking.

---

## Note on the change under review

The working tree carries only a `package-lock.json` modification. Nothing under
`src/` is modified, so every finding above is pre-existing and none of it is a
consequence of that change.

BLOCKING_COUNT: 0
