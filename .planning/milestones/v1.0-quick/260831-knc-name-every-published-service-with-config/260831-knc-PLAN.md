---
phase: quick-260831-knc
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - features/support/fakeHap.ts
  - features/support/steps/hap.ts
  - src/accessories/serviceCatalogue.ts
  - src/accessories/customServices.ts
  - src/accessories/basementGuardian.ts
  - test/accessories/serviceCatalogue.test.ts
  - test/accessories/basementGuardian.test.ts
  - test/accessories/customServices.test.ts
autonomous: false
requirements: [SAFE-04, SAFE-08]

estimate:
  tokens: 55000
  raw_tokens: 55000
  tasks: 3
  confidence: low

must_haves:
  truths:
    - "Every service the accessory publishes carries a Configured Name whose value equals the RowDefinition.displayName the catalogue publishes it under."
    - "A name a paired controller wrote survives every later update(): the plugin writes Configured Name only onto a service that does not already carry a non-empty one."
    - "Configured Name is sourced from RowDefinition.displayName alone. No second list of service names exists anywhere in src/."
    - "No ServiceKind subtype changes. Every subtype published before this change is published after it, so no automation, scene or notification is orphaned."
    - "ServiceDescriptor.name keeps reporting the catalogue display name, never the configured one."
    - "The plugin registers no set handler for Configured Name; the write path is HAP's own and reaches no vendor endpoint."
    - "The live HAP database of the running bridge reports Configured Name on the published services with the catalogue values."
  artifacts:
    - src/accessories/serviceCatalogue.ts
    - src/accessories/basementGuardian.ts
    - src/accessories/customServices.ts
    - features/support/fakeHap.ts
    - test/accessories/serviceCatalogue.test.ts
    - test/accessories/basementGuardian.test.ts
  key_links:
    - "RowDefinition.displayName -> seedConfiguredName -> hap.Characteristic.ConfiguredName on the published service."
    - "hap.Characteristic.ConfiguredName -> UUID 000000E3-0000-1000-8000-0026BB765291 in the pinned @homebridge/hap-nodejs."
    - "Characteristic.serialize -> the Homebridge accessory cache: a paired write persists across restart, which is what makes clobbering it destroy user data rather than just flicker."
    - "The seedConfiguredName call in publishRows -> the same call in republishPublishedRows, so a degraded accessory names its services too."
---

<objective>
Publish `ConfiguredName` on every service this accessory carries, seeded from
`RowDefinition.displayName`, so a controller shows "Backup Pump Fault" rather
than "Contact Sensor 4".

Purpose: Apple Home currently lists this accessory's sensors as "Contact Sensor 1"
through "Contact Sensor 8" and "Leak Sensor". `SAFE-04` requires five distinct
adapters so an owner can tell a blown backup-pump fuse from a lost mains feed.
Eight interchangeable tiles defeat that requirement in the one place it is meant
to be read.

Output: a `seedConfiguredName` helper in `serviceCatalogue.ts` with a
seed-only-when-absent rule; one call in each of the accessory's two publish
loops; `ConfiguredName` declared optional on the four vendor-defined services;
the HAP stand-in extended to carry the characteristic; and unit cases pinning
both halves of the contract — every service named from the real catalogue, and a
user's rename never overwritten.
</objective>

<context>
@.planning/STATE.md
@CLAUDE.md
@src/accessories/serviceCatalogue.ts
@src/accessories/services.ts
@src/accessories/basementGuardian.ts
@src/accessories/customServices.ts
@features/support/fakeHap.ts
@.planning/phases/03-safety-monitoring-in-homekit/03-CONTEXT.md
</context>

<evidence_established_at_plan_time>

## `ConfiguredName` is the mechanism. Here is what was actually checked.

All four findings were read on 2026-08-31 from this repository's pinned packages
and from the running container `bg-dev-homebridge` (Homebridge 2.4.0). Cite them;
do not re-derive them beyond the one re-confirmation grep Task 1 names.

**1. The characteristic exists in the pinned HAP, with the properties the defect
report quoted.**

`node_modules/@homebridge/hap-nodejs/dist/lib/definitions/CharacteristicDefinitions.js:617-628`

```js
class ConfiguredName extends Characteristic_1.Characteristic {
    static UUID = "000000E3-0000-1000-8000-0026BB765291";
    constructor() {
        super("Configured Name", ConfiguredName.UUID, {
            format: "string" /* Formats.STRING */,
            perms: ["ev" /* Perms.NOTIFY */, "pr" /* Perms.PAIRED_READ */, "pw" /* Perms.PAIRED_WRITE */],
        });
```

Display name `Configured Name`. Format string. Permissions `ev`, `pr`, `pw`.
Confirmed.

**2. A second controller in this very stack prefers `ConfiguredName` over the
`Name`-derived label.**

`homebridge-config-ui-x`'s own accessory UI, in
`/opt/homebridge/lib/node_modules/homebridge-config-ui-x/public/chunk-2Xtb3vZq.js`,
resolves a service's label as:

```js
ConfiguredName||i.service().serviceName
```

and its HAP client maps the identifier both ways in
`node_modules/@homebridge/hap-client/dist/hap-types.js:238-239`:

```js
'000000E3-0000-1000-8000-0026BB765291': 'ConfiguredName',
'ConfiguredName': '000000E3-0000-1000-8000-0026BB765291',
```

So `ConfiguredName` takes precedence over the name derived from `Name`. This is
not Apple Home, but it is an independent controller implementation choosing the
same characteristic for the same purpose, and it means the change pays off in the
Config UI and in Eve whatever Apple Home does.

**3. `ConfiguredName` is genuinely paired-write, and a write genuinely persists.**

`Characteristic.serialize` in
`node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js` writes `value`
into the serialised form, and `Service.serialize` maps every characteristic
through it. Homebridge stores that in its cached-accessories file. A rename a
user makes in the Home app therefore survives a Homebridge restart — which is
exactly why writing `ConfiguredName` on every poll would not merely flicker, it
would silently destroy something the user set and expected to keep. **This is the
load-bearing constraint of the whole task.**

**4. Apple's generated metadata does not declare `ConfiguredName` on the sensor
services, so the plugin must declare it before pushing it.**

The only services declaring it in the pinned `ServiceDefinitions.js` are
`AccessoryInformation` (optional, line 60), `InputSource` (required, 603),
`SmartSpeaker` (optional, 966), `Television` (required, 1116) and `WiFiRouter`
(required, 1284). `LeakSensor`, `ContactSensor` and `Battery` declare none.

This is not a blocker; it is the situation `publishValue` was already written
for. Its guard declares an undeclared characteristic with
`addOptionalCharacteristic` before pushing, precisely so HAP does not warn on a
restored accessory that a characteristic belongs to no section of the service.
`StatusActive` on the standard `Battery` service already takes that path in
production today.

## What could NOT be verified here, and stays a human check

**Whether Apple Home renders `ConfiguredName` for a secondary service of a
bridged accessory.** That is controller-side and unobservable from this machine.
Findings 1, 2 and 4 establish that the characteristic exists, that its
permissions are what the fix requires, that another controller reads it as the
service label, and that publishing it is safe. They do not establish Apple's
behavior. `<human_check>` below carries that, and the user has a paired test home
to answer it.

**Stop condition.** If Task 1's re-confirmation grep shows finding 1 no longer
holding — a different UUID, a non-string format, or no `pw` permission — stop and
report before writing any production code. The whole plan rests on finding 1.

</evidence_established_at_plan_time>

<decision_which_services_get_a_name>

## All fifteen rows, not only the nine Apple Home draws

The catalogue publishes fifteen rows. Nine sit on standard Apple types that Apple
Home draws as tiles: one `LeakSensor` (`Sump Pit Flood`) and eight
`ContactSensor` adapters. One is the standard `Battery` service, which Apple Home
shows under accessory Details rather than as a tile. Five are vendor-defined:
`Sump Pit Level`, `Primary Pump`, `Backup Pump`, `Sump Mains Power` and
`Backup Battery Facts`. A pending todo in `.planning/STATE.md` records, confirmed
against a real Homebridge instance on 2026-08-30, that Apple Home draws no tile
for a vendor-defined service.

**Decision: seed every row.** Three reasons, in order of weight.

1. **One rule cannot drift; two lists can.** Restricting the seed to the rendered
   services needs a predicate that answers "does Apple Home draw this one?" That
   predicate would be a second encoding of an *observation* about a controller,
   sitting in the plugin, with nothing to fail when the observation goes stale.
   The catalogue's whole design — see the `serviceCatalogue.ts` header — is that
   a fact has one place to live.
2. **A name on an undrawn service still has value.** Finding 2 above shows the
   Config UI labelling services by `ConfiguredName`; Eve and Controller for
   HomeKit read the vendor-defined services too. Those are the controllers where
   `Sump Pit Level`'s raw water code and `Backup Battery Facts`' vendor codes are
   actually read, and today they are read next to an unlabelled service.
3. **The cost of a needless one is nil.** `ConfiguredName` is declared before it
   is pushed, so no HAP warning; a controller that does not read it is
   unaffected.

**What this does NOT change.** Subtypes stay exactly as they are — `services.ts`
states that a changed subtype orphans the service and every automation, scene and
notification attached to it. `Name` stays. `Service.displayName` stays.
`ServiceDescriptor.name` keeps reporting the catalogue display name, so a user
rename never alters what the accessory reports as published.

## Why a paired-write characteristic does not breach `SAFE-08`

`SAFE-08` and the `customServices.ts` header say vendor-defined characteristics
are read-only, so that no controller can write reported safety state back onto
the device. `ConfiguredName` is Apple's own characteristic, not a vendor-defined
one, and it carries a label rather than device state. The plugin registers no set
handler for it: HAP stores the write in memory, Homebridge persists it to the
accessory cache, and nothing reaches the vendor cloud. Every vendor-defined
characteristic in `customCharacteristics.ts` stays read-only and
`customCharacteristics.test.ts` keeps proving it.

The `customServices.ts` header sentence "Every one carries only read-only
characteristics" becomes false the moment `ConfiguredName` is declared there, and
Task 2 amends it. Leaving a header that contradicts its own module is how the
next reader gets misled.

## Traceability

`03-CONTEXT.md` **D-14** fixes the thirteen display names and gives the reason
this task exists in both directions: "Apple Home already groups tiles under their
accessory and **users rename tiles freely**." The names must be published, and a
rename must be respected. The seed-only-when-absent rule is D-14's second clause
made operational.

`D-12` fixes the subtype as the `ServiceKind` slug verbatim, which is why nothing
here touches a subtype.

</decision_which_services_get_a_name>

<executor_warnings>

## Do not run `npm run build`, `npm run check`, or `npm run fallow` directly

`package.json` declares `"prefallow": "npm run build"` and
`"build": "rimraf ./dist && tsc"`. All three wipe `dist/`.

`dist/accessories/basementGuardian.js` currently carries a hand-injected
`__bgUatSnapshot` scaffold from an in-flight UAT session. Verified at plan time:
`grep -c __bgUatSnapshot dist/accessories/basementGuardian.js` answers `2`.

**There is a stale backup** at
`/tmp/claude-1000/-home-acolomba-homebridge-basement-guardian/6d35ecfb-0da8-444e-81dd-c9fc98f8d666/scratchpad/basementGuardian.patched.js`.
**Do not restore it.** This plan changes `src/accessories/basementGuardian.ts`,
so that copy is stale the moment Task 2 lands: restoring it would put pre-change
code back into `dist/` and silently un-ship the fix. After the final commit,
report that the scaffold was erased and must be **re-injected against the new
build**, and say which file the injection target is.

**Safe to run:** `npm run typecheck`, `npm run lint`, `npm run format:check`,
`npm run test:unit`, `npm run test:cucumber`, `npm run test:coverage:all`. The
test scripts rebuild `dist-test/`, never `dist/`.

**`pre-commit` is the unavoidable conflict.** `.pre-commit-config.yaml` runs four
local hooks — `npm lint`, `npm format:check`, `npm typecheck`, `npm fallow` — and
`CLAUDE.md` requires `pre-commit run --files <changed files>` before every
commit. So the first commit erases the scaffold. That is expected, not a failure.

## Do not restart or stop the container

`bg-dev-homebridge` is **paired to the user's test home right now**, and mDNS
discovery on this host is unreliable, so a lost connection may not come back.
`./dev/hb restart`, `./dev/hb down`, `./dev/hb reset` and `./dev/hb watch` are all
forbidden until the Task 3 checkpoint is answered. Read-only `docker exec` greps
and unauthenticated HAP reads on `127.0.0.1:51826` are fine.

## Git rules that apply here

Conventional Commits. Title 5-72 characters, body lines at most 80. Run
`pre-commit run --files <changed files>` **before** `git commit`; a failed hook
means no commit happened, so do not amend to recover. Never `--no-verify`, never
rebase. The branch is `features/phase-03-safety-monitoring-in-homekit`; do not
commit to `main`. Pre-task HEAD is `5ce6aa1`.

A RED commit passes these hooks: the test suite is not among the four, so a
commit holding failing but compiling tests is accepted. This is a corrected fact
recorded in `.planning/STATE.md`; two earlier plans asserted the opposite.

</executor_warnings>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Extend the HAP stand-in, then state the naming contract as failing cases</name>
  <files>features/support/fakeHap.ts, features/support/steps/hap.ts, test/accessories/serviceCatalogue.test.ts, test/accessories/basementGuardian.test.ts, test/accessories/customServices.test.ts</files>
  <read_first>
    Re-confirm finding 1 of `<evidence_established_at_plan_time>` before writing
    anything. One command:

    ```bash
    grep -A 8 "class ConfiguredName" node_modules/@homebridge/hap-nodejs/dist/lib/definitions/CharacteristicDefinitions.js
    ```

    It must show UUID `000000E3-0000-1000-8000-0026BB765291`, format `string`,
    and perms `ev`, `pr`, `pw`. If any of the three differs, stop and report; the
    plan rests on it.

    Read `features/support/fakeHap.ts` for `defineCharacteristic`, the
    `NAMED_STRING_DEFAULTS` map, and the `FakeCharacteristicNamespace` interface.
    Read `publishValue` at the foot of `src/accessories/serviceCatalogue.ts` for
    the declare-guard this task's helper reuses. Read the
    `unprojectedRequiredCharacteristics` helper and the `describe('publishValue')`
    block in `test/accessories/serviceCatalogue.test.ts` for the house assertion
    style.
  </read_first>
  <behavior>
    Stand-in first, because nothing can be asserted without it.

    In `features/support/fakeHap.ts`, define `ConfiguredName` through the existing
    `defineCharacteristic` factory: display name `Configured Name`, the UUID
    above, and a props constant carrying `FORMATS.STRING` with perms
    `[PERMS.NOTIFY, PERMS.PAIRED_READ, PERMS.PAIRED_WRITE]`. Add it to
    `FakeCharacteristicNamespace`. Do **not** add it to `NAMED_STRING_DEFAULTS`:
    the real HAP names a default for four identifiers only, and `ConfiguredName`
    is not one, so its construction default must be the empty string. That empty
    string is the sentinel the seeding rule reads, so a stand-in that answered
    something else would make the no-clobber case pass vacuously.

    In `features/support/steps/hap.ts`, add the `ConfiguredName` identifier to
    `assertStandardIdentifiers` as a third literal, written out rather than read
    back from the stand-in, matching the two already there.

    Then the failing cases.

    `test/accessories/serviceCatalogue.test.ts`, a new `describe` for
    `seedConfiguredName`. Four cases, one per branch:

    - Test 1: a service that neither carries nor declares `ConfiguredName` gets it
      declared and written. Assert the value equals the row display name **and**
      that exactly one entry for that identifier is in `optionalCharacteristics`.
    - Test 2: a service that already declares it — use a vendor-defined service
      built by `createCustomServices` — gets it written without a second
      declaration appended. Assert the value, and assert the declaration count is
      still exactly one. This is the case that would silently double if the guard
      were dropped: `addOptionalCharacteristic` is not idempotent.
    - Test 3: a service carrying `ConfiguredName` at the empty string is seeded.
      Put the characteristic on the service with `addCharacteristic` so it
      constructs at its default.
    - Test 4: a service carrying a non-empty `ConfiguredName` is left exactly as
      it is. Assert the stored value is unchanged after the call.

    `test/accessories/basementGuardian.test.ts`, three cases:

    - Test 5, the catalogue-sourced case: after one `update()` with a fully valid
      snapshot, every service the accessory published carries a `Configured Name`
      equal to the `displayName` of the catalogue row it was published under. Walk
      `CATALOGUE` and read each name from the row. Do not write a second list of
      fifteen names; a literal list is the drift this case exists to prevent.
    - Test 6, **the no-clobber case, the one the defect report requires**: run
      `update()` once; write a user rename onto one published service with
      `setCharacteristic(HAP.Characteristic.ConfiguredName, ...)`, standing for the
      paired write a controller makes; run `update()` a second time with a fresh
      snapshot; assert the renamed service still reads the user's string and that
      an untouched sibling service still reads its catalogue name. Both halves
      matter: the second is what keeps the case from passing against an
      implementation that stopped seeding altogether.
    - Test 7, the degraded path: an accessory that published while resolving, then
      receives a snapshot whose family no longer resolves, still carries its
      `Configured Name` values afterwards. This reaches the second call site, in
      `republishPublishedRows`.

    `test/accessories/customServices.test.ts`: extend the per-service optional
    declaration case so each of the four vendor-defined services declares
    `ConfiguredName` alongside `StatusActive` and `StatusFault`.

    One more case, in the `ACCESSORY_MODULES` loop at the foot of
    `test/accessories/basementGuardian.test.ts`, beside the existing get-handler
    gate: each accessory module registers no set handler either. Read the module
    through the existing `codeOf` comment stripper and assert both the method form
    and the event form are absent, mirroring the get-handler case exactly. This is
    what keeps the newly published writable characteristic from ever gaining a
    path toward the device.
  </behavior>
  <action>
    Name the helper `seedConfiguredName`. The verb is the contract: it seeds, it
    does not publish. `publishValue` writes unconditionally and must keep doing so;
    a reader who confuses the two writes the clobbering bug back in.

    Write the cases against a helper signature of
    `seedConfiguredName(hap, service, displayName)`, imported from
    `../../src/accessories/serviceCatalogue.js`. Passing the namespace rather than
    the characteristic class keeps the identity of the characteristic fixed inside
    the rule, so no call site can seed a different one.

    Each new case carries a comment saying what it costs when it fails, in the
    style the surrounding file uses. Test 6's comment states the mechanism, not
    just the rule: `ConfiguredName` is paired-write and its value is serialised
    into the Homebridge accessory cache, so a write on every poll destroys a name
    the user set and expected to keep, across restarts. Test 1 and Test 2's
    comments state that the declaration guard exists because
    `addOptionalCharacteristic` appends rather than replaces.

    Do not write the literal display names into Test 5 or Test 6. Read them from
    `CATALOGUE`.

    Confirm RED is real before committing. `npm run test:unit` must report the new
    cases failing because `seedConfiguredName` does not exist yet — that is a
    compile error in `dist-test`, not a test failure, so expect the build step to
    be what fails first. That is acceptable RED for this codebase and the reason
    the module-level import is what you write. `npm run typecheck` will also fail
    on the missing export; note it and move on rather than stubbing the function
    to make typecheck pass, because a stub would make the RED commit's hooks pass
    while proving nothing.

    If the failing typecheck blocks `pre-commit`, fold Task 1 and Task 2 into a
    single `feat(...)` commit rather than shipping a stub, and say so in the
    summary. Do not weaken a case to get a green hook.

    Otherwise commit the stand-in and the cases as
    `test(homekit): assert every service publishes a configured name`.
  </action>
  <verify>
    <automated>grep -c "000000E3-0000-1000-8000-0026BB765291" features/support/fakeHap.ts features/support/steps/hap.ts</automated>
    <automated>npm run test:unit 2>&amp;1 | tail -30</automated>
    <automated>grep -n "seedConfiguredName" test/accessories/serviceCatalogue.test.ts test/accessories/basementGuardian.test.ts | head</automated>
  </verify>
  <done>
    `features/support/fakeHap.ts` carries `ConfiguredName` with the real
    identifier, the string format, all three permissions, and an empty-string
    construction default. Seven new cases plus the set-handler gate exist and
    fail against the unimplemented helper. No case names a service display name as
    a literal. One commit exists, or Task 1 and Task 2 are recorded as folded.
  </done>
</task>

<task type="auto">
  <name>Task 2: Seed ConfiguredName from the catalogue, and never over a user's rename</name>
  <files>src/accessories/serviceCatalogue.ts, src/accessories/customServices.ts, src/accessories/basementGuardian.ts</files>
  <action>
    In `src/accessories/serviceCatalogue.ts`, first extract the declaration guard
    that `publishValue` already carries into a module-local helper — it tests
    `testCharacteristic` and scans `optionalCharacteristics` by identifier, then
    calls `addOptionalCharacteristic`. Have `publishValue` call it. Behavior is
    unchanged; the point is that the second writer must not restate the guard.
    `npm fallow` runs a duplicate check as a commit hook, and a restated
    three-line guard is exactly the shape it flags.

    Then export `seedConfiguredName(hap, service, displayName)`. Its rule, in
    order:

    - Declare the characteristic through the shared guard.
    - If the service carries the characteristic and its current value is a string
      that is not empty, return without writing.
    - Otherwise write the display name with `updateCharacteristic`.

    Ask `testCharacteristic` before reaching for `getCharacteristic`. The real HAP
    creates a declared-but-absent characteristic on `getCharacteristic`; the
    stand-in answers `undefined`. Depending on the real behavior would put a
    `TypeError` under every unit case, so the guard is load-bearing rather than
    defensive.

    Give the function a JSDoc block that carries three things a later reader
    needs. That HomeKit shows a secondary service of a bridged accessory by this
    characteristic rather than by `Name`, which is why `Name` alone left an owner
    reading "Contact Sensor 4" where `SAFE-04` promised a named cause. That the
    characteristic is paired-write and its value is serialised into the Homebridge
    accessory cache, so a write on every update would destroy a rename the user
    made and expected to keep — the same rule the plugin applies to reported
    device state, applied to a name the user is the authority on (`D-14`). And
    that the name comes from `RowDefinition.displayName` alone, so no second list
    can drift from the one `Name` already uses.

    In `src/accessories/customServices.ts`, add `hap.Characteristic.ConfiguredName`
    to the list every vendor-defined service declares optional, beside
    `StatusActive` and `StatusFault`, for the reason the module header already
    gives: HAP warns on every restored accessory when a service receives a
    characteristic its definition never declared.

    Amend that header. The sentence "Every one carries only read-only
    characteristics, so no controller can write reported safety state back onto
    the device (SAFE-08)" is now false as written. Rewrite it to say that every
    *vendor-defined* characteristic these services carry is read-only, and that
    the one writable member is Apple's own `ConfiguredName`, which names the
    service for a controller and carries no device state: no set handler is
    registered for it, and nothing written there reaches the device. State the
    subtype is untouched, since the subtype is the string that must never change.

    In `src/accessories/basementGuardian.ts`, call `seedConfiguredName` once in
    each publish loop, immediately after the service is in hand and before the
    projected values are pushed: in `publishRows` after `ensureService` answers a
    service, and in `republishPublishedRows` after `publishedService` answers one.
    Both call sites are needed — an accessory that published before its profile
    stopped resolving reaches only the second, and a service restored from the
    Homebridge cache with no name would otherwise stay unnamed forever.

    Add the import to the existing named import from `./serviceCatalogue.js`,
    keeping alphabetical order.

    Change nothing else. Do not touch any subtype. Do not change
    `ServiceDescriptor` or the `name: row.displayName` the descriptor is built
    with: what the accessory reports as published is the catalogue's name, and a
    user's rename must not alter it.

    Gates, each run on its own — `npm run check` and `npm run fallow` are
    forbidden here because they rebuild `dist/`: `npm run typecheck`,
    `npm run lint`, `npm run format:check`, `npm run test:unit`,
    `npm run test:cucumber`, then `npm run test:coverage:all` for the 100%
    line, branch and function thresholds the project holds. Every branch of
    `seedConfiguredName` has a case from Task 1; if coverage still reports a gap,
    the gap is real and needs a case, not an exception.

    Then `pre-commit run --files src/accessories/serviceCatalogue.ts src/accessories/customServices.ts src/accessories/basementGuardian.ts`
    and commit as `feat(homekit): name every published service for controllers`.

    That commit erases the `dist/` UAT scaffold. Afterwards run
    `grep -c __bgUatSnapshot dist/accessories/basementGuardian.js`. Do not restore
    the `/tmp` copy — it predates this change. Report that the scaffold is gone and
    must be re-injected into the freshly built
    `dist/accessories/basementGuardian.js`.
  </action>
  <verify>
    <automated>npm run test:unit 2>&amp;1 | tail -10</automated>
    <automated>npm run test:cucumber 2>&amp;1 | tail -10</automated>
    <automated>npm run typecheck &amp;&amp; npm run lint &amp;&amp; npm run format:check</automated>
    <automated>npm run test:coverage:all 2>&amp;1 | tail -25</automated>
    <automated>git diff 5ce6aa1 -- src/accessories/services.ts | head -1   # must print nothing: the ServiceKind union is untouched</automated>
    <automated>git diff 5ce6aa1 -- test/accessories/basementGuardian.test.ts | grep -E '^[+-][^+-]' | grep PUBLISHED_SERVICES | head -1   # must print nothing: the fifteen published descriptors are unchanged, and the suite asserts them</automated>
    <automated>grep -c __bgUatSnapshot dist/accessories/basementGuardian.js || true   # report only, not a gate; 0 is expected once the hooks rebuilt dist/</automated>
    <human-check>Whether Apple Home renders the names is controller-side and cannot be observed from this machine. See `&lt;human_check&gt;`.</human-check>
  </verify>
  <done>
    `seedConfiguredName` is exported from `serviceCatalogue.ts`, shares one
    declaration guard with `publishValue`, and writes only onto a service with no
    non-empty name. Both publish loops in `basementGuardian.ts` call it. The four
    vendor-defined services declare `ConfiguredName`, and the `customServices.ts`
    header no longer claims every characteristic is read-only. The whole unit
    suite, the Cucumber suite and the 100% coverage gate pass. No subtype changed.
    One `feat(...)` commit exists. The `dist/` scaffold state is reported, and the
    stale `/tmp` copy was not restored.
  </done>
</task>

<task type="checkpoint:decision" gate="blocking-human">
  <name>Checkpoint: restart the paired bridge to read the live HAP database</name>
  <decision>Restart `bg-dev-homebridge` now so the live HAP probe can confirm `Configured Name` on the real accessory database, or defer the probe and ship on the unit evidence alone.</decision>
  <context>
    The code is committed and the unit suite proves the contract against the
    stand-in. What is still unproven is that the real
    `@homebridge/hap-nodejs` publishes the characteristic onto the real
    accessory database with the right values. `./dev/hb observe` reads
    `http://127.0.0.1:51826/accessories` directly, which is exactly what a
    controller reads — but the running container is still executing the
    pre-change build, so the probe says nothing until Homebridge reloads the
    plugin.

    Reloading means `./dev/hb restart`, and that is the reason this is a
    checkpoint rather than a step. The container is **paired to the user's test
    home right now**, mDNS discovery on this host is unreliable, and the user has
    already lost hours to a connection that did not come back. This is not a
    decision to auto-approve.

    The restart also ends the in-flight UAT session for good: the `__bgUatSnapshot`
    scaffold in `dist/accessories/basementGuardian.js` was already erased by the
    commit hooks and the container will load the clean build.
  </context>
  <options>
    <option id="restart-and-probe">
      <name>Restart now and run the live probe</name>
      <pros>Confirms the real HAP publishes `Configured Name` with the catalogue values before anyone re-pairs. Puts the fix in front of the user's Home app, which is the only way the remaining human check can be answered. A restart is needed for that check regardless.</pros>
      <cons>Pairing must re-announce over mDNS on a host where discovery is unreliable. Ends the in-flight UAT session.</cons>
    </option>
    <option id="defer">
      <name>Defer the probe; leave the container untouched</name>
      <pros>The paired connection and the UAT session stay exactly as they are.</pros>
      <cons>The live evidence stays open, and the Apple Home check cannot be attempted at all. Both would have to be picked up in a later session that restarts anyway.</cons>
    </option>
  </options>
  <resume-signal>Answer `restart-and-probe` or `defer`.</resume-signal>
  <action>
    On `restart-and-probe`: run `./dev/hb restart`, wait for the plugin to publish
    (watch `./dev/hb logs` until the accessory is registered), then run
    `./dev/hb observe`. `observe.mjs` labels each row by `Name` and prints every
    other characteristic, so `Configured Name=...` appears in the value list of
    each row. Confirm all fifteen services report a `Configured Name` and that each
    equals the `Name` beside it. Report the full output. If a service is missing
    the characteristic, report which and stop rather than patching around it —
    that would mean the real HAP rejected something the stand-in accepted, which is
    a stand-in drift worth its own investigation. Then confirm the bridge is still
    reachable from the user's home and hand over `<human_check>`.

    On `defer`: change nothing, restart nothing. Record the live probe and the
    Apple Home check as both outstanding in the summary, and note that whoever
    picks them up gets both from one restart.

    Either way, report the `dist/` scaffold state: it was erased by Task 2's
    commit hooks, the `/tmp` copy is stale and must not be restored, and
    re-injection has to target the freshly built
    `dist/accessories/basementGuardian.js`.
  </action>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| paired controller -> accessory | A paired controller can now WRITE one characteristic on every published service. This is the first paired-write characteristic this plugin publishes. |
| accessory -> Homebridge cached-accessories file | The written value is serialised to disk by `Characteristic.serialize` and restored on the next start. |
| repository -> npm tarball | `ConfiguredName` values are the catalogue display names, which are already public. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-knc-01 | Tampering | `seedConfiguredName` writing on every publish | high | mitigate | Writing unconditionally would silently destroy a rename the user made, and `Characteristic.serialize` persists it, so the loss survives restarts and looks like the plugin fighting the user. The rule writes only onto a service carrying no non-empty name; Task 1 Test 4 and Test 6 pin it at both the helper and the accessory level, with Test 6 publishing twice across a user rename. |
| T-knc-02 | Tampering | paired controller writing an arbitrary label onto a safety sensor | medium | accept | A paired controller can rename `Mains Power Lost` to anything. That is Apple's rename mechanism, and `03-CONTEXT.md` D-14 already records that users rename tiles freely. It costs nothing structural: the subtype is untouched, so no automation, scene or notification is orphaned, and `Name`, `Service.displayName` and `ServiceDescriptor.name` keep the published name. Only an already-paired controller can write. |
| T-knc-03 | Elevation of privilege | the paired-write path on a plugin that is otherwise read-only | medium | mitigate | A writable characteristic on a safety accessory must not become a path toward the device. No set handler is registered: HAP stores the write and Homebridge persists it, and no code reads the value back into decoded state or into a command. Task 1 adds a static gate over all four accessory modules asserting no set handler exists, in either the method or the event form, mirroring the get-handler gate already there. |
| T-knc-04 | Spoofing | a renamed sensor misleading an owner about which condition fired | low | accept | A user who renames `Backup Pump Fault` to something misleading has misled only themselves, and the underlying `StatusFault` and `ContactSensorState` values are unchanged. Refusing the rename would be worse: it is the mechanism `SAFE-04` needs in the first place. |
| T-knc-05 | Information disclosure | `ConfiguredName` values on the HAP database | low | accept | The values are the fifteen catalogue display names, already public in `README.md` and `config.schema.json`. No credential, token, account identifier, `deviceId` or local-network fact is added. |

No package-manager install task exists in this plan, so the package legitimacy
gate does not apply.
</threat_model>

<verification>
- `npm run typecheck`, `npm run lint`, `npm run format:check` clean.
- `npm run test:unit` — every case passes, including the four helper cases, the
  catalogue-sourced case, the no-clobber case, the degraded-path case and the new
  set-handler gate.
- `npm run test:cucumber` passes unchanged.
- `npm run test:coverage:all` holds 100% lines, branches and functions.
- `git diff 5ce6aa1 -- src/accessories/services.ts` is empty, and no `subtype`
  line changed anywhere under `src/`.
- No display name is written as a literal in any new test case; every expected
  name is read from the catalogue.
- `npm run build`, `npm run check` and `npm run fallow` were never invoked
  directly.
- On `restart-and-probe`: `./dev/hb observe` reports a `Configured Name` on all
  fifteen services, each equal to the `Name` beside it.
</verification>

<human_check>
**This plan does not close the Apple Home check, and cannot.** Whether Apple Home
uses `ConfiguredName` to label a secondary service of a bridged accessory is
controller-side and unobservable from this machine. The evidence gathered here
establishes that the characteristic exists with the right permissions, that
`homebridge-config-ui-x` reads it as the service label in preference to `Name`,
and that publishing it is safe. It does not establish what Apple draws.

After the bridge restarts, in the paired test home:

1. Open the Basement Guardian accessory. The sensor tiles read **Sump Pit Flood,
   Primary Pump Running, Backup Pump Activated, Mains Power Lost, Primary Pump
   Fault, Backup Pump Fault, Water Sensor Fault, Pump Controller Link Lost,
   Basement Guardian Offline** — not "Contact Sensor 1" through "Contact Sensor 8"
   and "Leak Sensor". This is the whole defect.
2. If the old names persist, remove the accessory from the home and re-pair
   before concluding anything. Adding a characteristic to an already-published
   service bumps the HAP configuration number, and a controller that has cached
   the old layout may need the re-pair the user has already planned for.
3. Rename one sensor in the Home app — for example `Backup Pump Fault` to
   `Fuse Box`. Wait out at least two poll intervals, then confirm the name is
   still `Fuse Box`. **A name that snaps back means the no-clobber rule failed in
   production, and is a defect, not a cosmetic issue.**
4. Confirm the sensor renamed in step 3 still drives whatever automation was
   attached to it. The subtype did not change, so it should; a broken automation
   would mean something did change and needs reporting immediately.
5. In Eve or Controller for HomeKit, confirm the five vendor-defined services —
   `Sump Pit Level`, `Primary Pump`, `Backup Pump`, `Sump Mains Power`,
   `Backup Battery Facts` — now carry names. Apple Home draws no tile for these,
   which is what the decision above rests on.

Steps 1 and 3 are the ones that matter. Step 3 is the one that can only be
answered in a real home, because only a real controller performs the paired write.

This rides along with the `G-003` / `G-004` session already scheduled in
`.planning/STATE.md`, which needs the same paired home.
</human_check>

<success_criteria>
- Every one of the fifteen published services carries `Configured Name` equal to
  the `RowDefinition.displayName` it is published under.
- The name is sourced from `RowDefinition.displayName` alone. No second list of
  service names exists in `src/`, and none was introduced into the tests.
- A non-empty `ConfiguredName` already on a service is never overwritten, proven
  by a case that publishes twice with a user rename in between and asserts both
  that the rename survived and that an untouched sibling still reads its
  catalogue name.
- `seedConfiguredName` and `publishValue` share one declaration guard.
- Both publish loops in `basementGuardian.ts` seed, so a degraded accessory and a
  cache-restored service are named too.
- The four vendor-defined services declare `ConfiguredName`, and the
  `customServices.ts` header no longer claims every characteristic they carry is
  read-only.
- No subtype changed anywhere under `src/`.
- `ServiceDescriptor.name` still reports the catalogue display name.
- A static gate proves no accessory module registers a set handler.
- The `dist/` UAT scaffold state is reported and the stale `/tmp` copy was not
  restored.
</success_criteria>

<output>
Create `.planning/quick/260831-knc-name-every-published-service-with-config/260831-knc-SUMMARY.md` when done.
</output>
