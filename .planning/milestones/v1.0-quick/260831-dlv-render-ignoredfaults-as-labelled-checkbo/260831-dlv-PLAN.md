---
phase: quick-260831-dlv
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - config.schema.json
  - test/configSchema.test.ts
autonomous: true
requirements: [CONF-06]

estimate:
  tokens: 45000
  raw_tokens: 30000
  tasks: 3
  confidence: low

must_haves:
  truths:
    - "config.schema.json declares ignoredFaults.items.enum holding the seven slugs in their original order."
    - "config.schema.json declares no oneOf, no minItems and no maxItems anywhere under ignoredFaults."
    - "Each label the form offers equals the displayName the shipped service catalogue publishes for that slug."
    - "The running Config UI serves the labels under strictValidation: true."
    - "src/config.ts and README.md are byte-identical to their state before this task."
  artifacts:
    - config.schema.json
    - test/configSchema.test.ts
  key_links:
    - "items.enum -> the Config UI widget selector, which reads Object.hasOwn(items,'enum') to choose the checkboxes control."
    - "items.enumNames[i] -> items.enum[i], paired by position by the shipped buildTitleMap."
    - "items.enumNames[i] -> RowDefinition.displayName for that kind in src/accessories/serviceCatalogue.ts."
---

<objective>
Restore the checkbox control for `ignoredFaults` while keeping the human-readable
labels commit `645208b` added.

Commit `645208b` replaced `items.enum` with `items.oneOf`. The labels appeared,
but the control silently changed from a checkbox list to a row of per-item
dropdowns that offer a spurious "None" and let one sensor be picked twice.

Purpose: `ignoredFaults` is the only settings-form control that removes a safety
notification sensor. A control that can pick the same sensor twice, or write
`null`, is a control an administrator can misread.

Output: `items.enum` restored with all seven slugs in order, plus `items.enumNames`
carrying the seven published service names; the three assertions `645208b` added
rewritten to the new representation with their invariant intact.
</objective>

<context>
@.planning/STATE.md
@CLAUDE.md
@config.schema.json
@test/configSchema.test.ts
@.planning/quick/260831-c7f-render-ignoredfaults-options-as-human-re/260831-c7f-SUMMARY.md
@src/accessories/serviceCatalogue.ts
@src/accessories/services.ts
</context>

<decision_the_labels_ride_on>

## Why `enumNames` and not `titleMap`

Both keywords are undocumented for Homebridge. `developers.homebridge.io/docs/config-screen/schema.md`
documents a bare `enum` inside `items` for checkbox arrays and `oneOf` on a
*property* for dropdowns. It names neither `titleMap` nor `enumNames`. So the
choice rests on the code that consumes the schema, which is the pattern task
`260831-c7f` established.

All four findings below were read from
`/opt/homebridge/lib/node_modules/homebridge-config-ui-x/public/main-E3N63CH7.js`
in the running container `bg-dev-homebridge` (Homebridge 2.4.0), on 2026-08-31.
Task 1 re-reads them before changing anything.

**1. Widget selection keys on `items.enum` and nothing else.**

```js
if (i === `array`) return m$1(w.getFirst([[t,`/items`],[t,`/additionalItems`]]) || {}, `enum`) && t.maxItems !== 1 ? Lu(`checkboxes`, t, n) : `array`
```

`items.enum` present as an own property and `maxItems !== 1` gives `checkboxes`.
Anything else falls through to the generic `array` renderer. `oneOf` does not
qualify. That single test is the whole regression.

**2. The label resolver's three branches are mutually exclusive, and `enumNames`
lives inside the `enum` branch.**

```js
!m$1(i,`titleMap`) && !m$1(i,`enum`) && m$1(n,`items`) && (
  w.has(n,`/items/titleMap`) ? i.titleMap = n.items.titleMap
  : w.has(n,`/items/enum`)   ? (i.enum = n.items.enum,
                                !m$1(i,`enumNames`) && w.has(n,`/items/enumNames`) && (i.enumNames = n.items.enumNames))
  : w.has(n,`/items/oneOf`)  && (o = zu(n.items, i.flatList), o && (i.titleMap = o)))
```

`/items/titleMap` wins the chain and never assigns `i.enum`. A `titleMap` plan
would need the enum to arrive later, through the second pass
`a.type === 'checkboxes' && m$1(l,'items') ? Or(a, l.items, t) : ...`, which
copies item keys generically. That path does work, but it is incidental.
`enumNames` sits *inside* the `/items/enum` branch, guarded by
`!m$1(i,'enumNames')`: the resolver's authors wrote `enum` and `enumNames` as one
unit, and that unit is exactly "a checkbox list with labels".

**3. Both keywords reach the widget, so nothing is given up.**

```js
this.checkboxList = Tr(this.options.titleMap || this.options.enumNames, this.options.enum, !0)
```

**4. The checkbox path never adds "None".**

```js
function Tr(t, n, e = !0, i = !0) { ... !e && !o && r.unshift({name:`<em>None</em>`, value:null}), r }
```

The call above passes `!0` for `e`, so `!e` is false and the `None` entry is
never unshifted on this path. The `None` visible today comes from the generic
`array` renderer's per-item select, which is what `items.oneOf` fell through to.
**Do not add `minItems`.** It is not the fix, and it would forbid the empty list
the field must allow.

**5. `enumNames` writes each wire value exactly once.**

`Tr` pairs a string label with its value by position:
`else if (me(t[s]) && s < n.length) { r.push({ name: t[s], value: n[s] }) }`.
A `titleMap` would instead restate all seven slugs a second time as `value`
fields, giving a slug a second place to drift from the one that widget selection
reads. The hard constraint is that the seven wire values must not move, so the
representation that names each of them once is the safer one.

**The residual risk `enumNames` carries** is that positional pairing mislabels
silently: a reordered or short `enumNames` produces a wrong label, or drops a
checkbox entirely once `s < n.length` fails. Task 1 pins both with cases.

**On `strictValidation`.** In the shipped bundle `strictValidation` only decides
whether an invalid *form* blocks the save — it drives the red/orange indicator and
the `form.label_invalid_strict` tooltip. It is not a meta-schema check over the
schema document. That is a reason to expect an unknown keyword to survive, not a
reason to assume it. Task 3 confirms it against the live UI.

</decision_the_labels_ride_on>

<executor_warnings>

## Do not run `npm run build`, `npm run check`, or `npm run fallow`

`package.json` declares `"prefallow": "npm run build"` and `"build": "rimraf ./dist && tsc"`.
Any of those three commands wipes `dist/`.

`dist/accessories/basementGuardian.js` currently carries a hand-injected
`__bgUatSnapshot` scaffold belonging to an in-flight UAT session. Verified at
plan time: the file is dated `09:11` and
`grep -c __bgUatSnapshot dist/accessories/basementGuardian.js` answers `2`.
Task `260831-c7f` already destroyed this scaffold once and could not recover it,
because no copy existed.

**Safe to run:** `npm run typecheck` (`tsc --noEmit`), `npm run lint`,
`npm run format:check`, `npm run test:unit` and `npm run test:cucumber` — the two
test scripts rebuild `dist-test/`, not `dist/`.

**`pre-commit` is the unavoidable conflict.** `.pre-commit-config.yaml` runs a
local `npm fallow` hook, and `CLAUDE.md` requires `pre-commit run --files <changed files>`
before every commit. So committing this change will erase the scaffold again.
That is expected, not a failure. Before the first `pre-commit` run:

```bash
cp dist/accessories/basementGuardian.js \
   .planning/quick/260831-dlv-render-ignoredfaults-as-labelled-checkbo/basementGuardian.uat-scaffold.js
```

After the final commit, if `grep -c __bgUatSnapshot dist/accessories/basementGuardian.js`
answers `0`, restore that copy over the rebuilt file. This task modifies no
`src/` file, so the rebuilt output is the same code with the scaffold missing;
restoring it is safe. Report the erasure and the restore either way — do not
leave it to be discovered.

## Git rules that apply here

Conventional Commits. Title 5-72 characters, body lines at most 80. Run
`pre-commit run --files <changed files>` **before** `git commit`; a failed hook
means no commit happened, so do not amend to recover. Never `--no-verify`, never
rebase. The branch is `features/phase-03-safety-monitoring-in-homekit`; do not
commit to `main`.

A RED commit passes these hooks. The four local hooks are `npm lint`,
`npm format:check`, `npm typecheck` and `npm fallow`; the test suite is not among
them, so a commit holding failing but compiling tests is accepted.

</executor_warnings>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Re-read the consumer code, then state the checkbox contract as failing cases</name>
  <files>test/configSchema.test.ts</files>
  <read_first>
    Re-verify findings 1, 2 and 4 of `<decision_the_labels_ride_on>` yourself before
    editing. Do not take them on trust. Each is one grep against the shipped bundle:

    ```bash
    docker exec bg-dev-homebridge sh -c "grep -o '.\{600\}checkboxes\`,t,n):\`array\`.\{100\}' /opt/homebridge/lib/node_modules/homebridge-config-ui-x/public/main-E3N63CH7.js"
    docker exec bg-dev-homebridge sh -c "grep -o '.\{500\}/items/titleMap.\{700\}' /opt/homebridge/lib/node_modules/homebridge-config-ui-x/public/main-E3N63CH7.js"
    docker exec bg-dev-homebridge sh -c "grep -o 'function Tr(.\{0,400\}' /opt/homebridge/lib/node_modules/homebridge-config-ui-x/public/main-E3N63CH7.js | head -1"
    ```

    If any finding does not hold as written, stop and report before editing. The
    choice of `enumNames` over `titleMap` rests entirely on finding 2.

    Also read `NOTIFICATION_SERVICE_KINDS` in `src/accessories/services.ts` for the
    seven slugs and their order, and the `RowDefinition.displayName` entries in
    `src/accessories/serviceCatalogue.ts` for the names those kinds publish under.
  </read_first>
  <behavior>
    Rewrite the three cases commit `645208b` added. Their invariant survives
    verbatim — the same seven slugs, the same order, labels equal to the published
    service names. Only the representation the cases read changes.

    - `CONF-06 offers exactly the seven removable notification sensors and no other value`:
      assert `items.type === 'string'`; assert `Object.hasOwn(items, 'enum')` is
      `true`; assert `items.enum` deep-equals the seven slugs in order; assert
      `Object.hasOwn(items, 'oneOf')` is `false`.
    - The one-value case becomes a pairing-length case: assert
      `items.enumNames.length === items.enum.length`, both being 7.
    - `CONF-06 labels each option with the name the accessory publishes that sensor under`:
      build the real catalogue with
      `createServiceCatalogue(createFakeHap() as unknown as API['hap'])`, then pair
      `items.enum[i]` with `items.enumNames[i]` and compare each label against the
      `displayName` the catalogue publishes for that `kind`. Read the names from the
      catalogue; do not type them a second time as literals.
    - No case may add an assertion about `minItems` or `maxItems` existing.
  </behavior>
  <action>
    Keep the seven slugs written out as a literal in the first case rather than
    imported from `NOTIFICATION_SERVICE_KINDS`, matching the decision `260831-c7f`
    recorded: a runtime list that drifts must fail the case instead of travelling
    with it.

    The first case carries a comment stating why the `Object.hasOwn(items, 'enum')`
    assertion is load-bearing rather than redundant: the Config UI chooses the
    checkbox control by testing `Object.hasOwn(items, 'enum')` on the item schema,
    so `enum` being an own property is the precondition for checkbox rendering, and
    its absence is exactly what regressed. Write the comment so a future reader
    cannot mistake the assertion for a duplicate of the deep-equal below it and
    remove it. Per finding 5, the pairing-length case likewise carries a comment
    naming what a mismatch costs: `buildTitleMap` pairs `enumNames[i]` with
    `enum[i]` by position and stops at `s < n.length`, so a short list drops
    checkboxes and a reordered list mislabels them, both silently.

    Do not put the phrases those comments explain into `config.schema.json`.

    Update the `SettingsFormItems` interface to `{ type: string; enum: string[]; enumNames: string[] }`.
    The `SettingsFormOption` interface then has no reader — delete it, because
    `eslint --max-warnings=0` and `fallow dead-code` both run as commit hooks.
    Change nothing else in the file: the other thirteen cases and the
    `readSettingsSchema` / `readIgnoredFaultItems` helpers stay as they are.

    Confirm RED is real before committing: `npm run test:unit` must report exactly
    these three cases failing, each because the shipped schema still declares
    `oneOf`, with every other case passing. `npm run typecheck` must be clean, which
    is what lets the RED commit through the hooks.

    Then `pre-commit run --files test/configSchema.test.ts` — take the `dist/`
    scaffold copy named in `<executor_warnings>` first — and commit as
    `test(config): assert ignoredFaults renders as labelled checkboxes`.
  </action>
  <verify>
    <automated>npm run test:unit 2>&amp;1 | tail -20   # expect exactly 3 failures, all in configSchema, all naming the missing items.enum</automated>
    <automated>npm run typecheck</automated>
    <automated>grep -n "hasOwn" test/configSchema.test.ts   # the items.enum existence assertion is present</automated>
  </verify>
  <done>
    `test/configSchema.test.ts` holds 16 cases. Three fail against the shipped
    `oneOf` schema and thirteen pass. `SettingsFormOption` is gone.
    `npm run typecheck` and `npm run lint` are clean. One `test(...)` commit exists.
  </done>
</task>

<task type="auto">
  <name>Task 2: Restore items.enum and label it with enumNames</name>
  <files>config.schema.json</files>
  <action>
    In `ignoredFaults.items`, replace the `oneOf` array with two sibling arrays:

    - `enum` holding the seven slugs, in the order they appear in the current
      `oneOf` entries and in `NOTIFICATION_SERVICE_KINDS`: `backup-pump-activated`,
      `mains-power-lost`, `primary-pump-fault`, `backup-pump-fault`,
      `water-sensor-fault`, `pump-controller-link-lost`, `basement-guardian-offline`.
    - `enumNames` holding the seven published service names at matching positions,
      copied from the `title` fields the `oneOf` entries already carry, which Task 1
      has just re-confirmed against `serviceCatalogue.ts`.

    Keep `items.type: "string"`, `uniqueItems: true`, `title`, and the `description`
    exactly as they are. Add no `minItems` and no `maxItems`: `minItems` would forbid
    the empty list, and `maxItems: 1` would send the field back to the generic array
    renderer, per findings 1 and 4.

    Do not touch `src/config.ts` or `README.md`. Neither references any of these
    keywords, so there is nothing in either to keep in step.

    Gates, each run separately — `npm run check` is forbidden here because it calls
    `fallow`, which rebuilds `dist/`: `npm run typecheck`, `npm run lint`,
    `npm run format:check`, `npm run test:unit`, `npm run test:cucumber`.

    Then `pre-commit run --files config.schema.json` and commit as
    `fix(config): render ignored faults as labelled checkboxes`. The type is `fix`,
    not `feat`: this restores a control `645208b` broke.
  </action>
  <verify>
    <automated>npm run test:unit 2>&amp;1 | tail -5   # all cases pass, none fail</automated>
    <automated>node -e "const s=require('./config.schema.json').schema.properties.ignoredFaults; const i=s.items; if(!Object.hasOwn(i,'enum')) throw new Error('items.enum absent — the checkbox control will not be chosen'); if(Object.hasOwn(i,'oneOf')) throw new Error('items.oneOf still present'); if(Object.hasOwn(i,'minItems')||Object.hasOwn(i,'maxItems')||Object.hasOwn(s,'minItems')||Object.hasOwn(s,'maxItems')) throw new Error('minItems/maxItems must not be declared'); if(i.enum.length!==7||i.enumNames.length!==7) throw new Error('expected seven values and seven labels'); console.log('ok');"</automated>
    <automated>git diff 86feebd -- src/ README.md | head -1   # 86feebd is the pre-task HEAD; must print nothing</automated>
    <automated>npm run typecheck &amp;&amp; npm run lint &amp;&amp; npm run format:check</automated>
  </verify>
  <done>
    `ignoredFaults.items` declares `enum` with the seven slugs in the original order
    and `enumNames` with the seven published names at matching positions, and no
    `oneOf`, `minItems` or `maxItems`. The whole unit suite and the Cucumber suite
    pass. `git diff` over `src/` and `README.md` is empty. One `fix(...)` commit
    exists.
  </done>
</task>

<task type="auto">
  <name>Task 3: Confirm the live Config UI serves the labels under strictValidation</name>
  <files>none — probe only, no commit</files>
  <precondition>The container `bg-dev-homebridge` is running and the Config UI answers on http://127.0.0.1:8581. Check with `docker ps --format '{{.Names}}\t{{.Status}}'`. If it is not up, stop and report rather than starting it: a restart loads a scaffold-free build and ends the in-flight UAT session.</precondition>
  <action>
    Do not restart the container. `homebridge-config-ui-x` re-reads
    `config.schema.json` from disk on each schema request, which task `260831-c7f`
    confirmed against a container that had been up for 32 minutes.

    The endpoint refuses an unauthenticated request with 401, so take a token first:

    ```bash
    TOKEN=$(curl -s -X POST http://127.0.0.1:8581/api/auth/login \
      -H 'Content-Type: application/json' \
      -d '{"username":"admin","password":"admin"}' \
      | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).access_token))")

    curl -s -H "Authorization: Bearer $TOKEN" \
      http://127.0.0.1:8581/api/plugins/config-schema/homebridge-basement-guardian \
      | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const s=JSON.parse(d);const i=s.schema.properties.ignoredFaults.items;console.log('strictValidation:',s.strictValidation);console.log('enum:',JSON.stringify(i.enum));console.log('enumNames:',JSON.stringify(i.enumNames));console.log('oneOf present:',Object.hasOwn(i,'oneOf'));})"
    ```

    The served schema must report `strictValidation: true`, the seven slugs in
    order, the seven labels in order, and no `oneOf`. `enumNames` is not a standard
    JSON Schema keyword, so this probe is what settles whether it survives the
    round trip — it is not something to assume from the file on disk. If `enumNames`
    is missing from the served schema while `enum` is present, stop and report: the
    labels have been stripped server-side and `titleMap` becomes the fallback to
    evaluate, per finding 2.

    Then handle the `dist/` scaffold as `<executor_warnings>` directs: check
    `grep -c __bgUatSnapshot dist/accessories/basementGuardian.js`, restore the copy
    if it answers `0`, and report what happened.
  </action>
  <verify>
    <automated>docker ps --format '{{.Names}}' | grep -x bg-dev-homebridge</automated>
    <automated>TOKEN=$(curl -s -X POST http://127.0.0.1:8581/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin"}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).access_token))"); curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8581/api/plugins/config-schema/homebridge-basement-guardian | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const s=JSON.parse(d);const i=s.schema.properties.ignoredFaults.items;if(s.strictValidation!==true)throw new Error('strictValidation is not true');if(Object.hasOwn(i,'oneOf'))throw new Error('served schema still carries oneOf');if(!Array.isArray(i.enum)||i.enum.length!==7)throw new Error('served schema lost items.enum');if(!Array.isArray(i.enumNames)||i.enumNames.length!==7)throw new Error('served schema stripped items.enumNames — the labels did not survive the round trip');console.log('served ok');})"</automated>
    <automated>grep -c __bgUatSnapshot dist/accessories/basementGuardian.js   # report the count; 0 means the scaffold was erased and the copy must be restored</automated>
  </verify>
  <done>
    The served schema reports `strictValidation: true`, seven slugs in order, seven
    labels in order, and no `oneOf`. The `dist/` scaffold state is checked, restored
    if it was erased, and reported.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| settings form -> `config.json` | What the form writes becomes the configuration `validateConfig` reads. A label is display-only; the value behind it is the wire value. |
| repository -> npm tarball | `config.schema.json` ships in the published package, so anything added to it is public. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-dlv-01 | Tampering | `ignoredFaults.items.enumNames` positional pairing | medium | mitigate | `enumNames` pairs with `enum` by index, so a reordered or short list silently mislabels a safety sensor or drops its checkbox. Task 1's pairing-length case and the catalogue-sourced label case pin both; Task 2's guard rejects any count other than seven. |
| T-dlv-02 | Tampering | the seven wire values | high | mitigate | The slugs reach `validateConfig`, and an unrecognised name stops the plugin from starting. Task 1 asserts `items.enum` deep-equals the seven slugs in order against a literal, and Task 2's guard re-checks it. `enumNames` was chosen partly because it restates no slug. |
| T-dlv-03 | Information disclosure | `config.schema.json` in the tarball | low | accept | The change adds seven display labels that are already the public HomeKit service names. No credential, token, account identifier or vendor endpoint is added. |

No package-manager install task exists in this plan, so the package legitimacy gate does not apply.
</threat_model>

<verification>
- `npm run typecheck`, `npm run lint`, `npm run format:check` clean.
- `npm run test:unit` — every case passes, including the three rewritten ones.
- `npm run test:cucumber` — unchanged and passing.
- `git diff` over `src/` and `README.md` across both commits is empty.
- The live Config UI serves `items.enum` and `items.enumNames`, no `oneOf`, with
  `strictValidation: true`.
- `npm run build`, `npm run check` and `npm run fallow` were never invoked directly.
</verification>

<human_check>
**This plan does not close the rendering check.** What the settings form draws is
controller-side and unobservable from the repository. The file on disk, the
served schema, and the widget-selection and label-resolution code are all things
automation can reach; the rendered control is not.

At <http://127.0.0.1:8581> (admin/admin, loopback only), Plugins -> Basement
Guardian -> Settings, under "Notification sensors to leave out":

1. The control is a **checkbox list**, not a row of dropdowns.
2. It offers exactly seven boxes, labelled **Backup Pump Activated, Mains Power
   Lost, Primary Pump Fault, Backup Pump Fault, Water Sensor Fault, Pump
   Controller Link Lost, Basement Guardian Offline** — not slugs.
3. There is **no "None" entry**, and the same sensor cannot be selected twice.
4. Tick two boxes and save. `dev/homebridge/config.json` then holds a two-element
   `ignoredFaults` array of **slugs**, and `./dev/hb logs` shows Homebridge
   restarting with no configuration refusal. This step proves the labels are
   display-only and the wire values did not move.
5. Restore the selection the harness was found with.

Step 4 restarts Homebridge, which loses the in-memory UAT scaffold. Whoever owns
that session should capture what they need first.

Performing this answers deferred human-verification item 3 in `.planning/STATE.md`.
</human_check>

<success_criteria>
- `ignoredFaults.items` declares `enum` with the seven original slugs in the
  original order, and `enumNames` with the seven published service names at
  matching positions.
- No `oneOf`, `minItems` or `maxItems` under `ignoredFaults`.
- `uniqueItems: true` and the existing `description` are unchanged.
- `test/configSchema.test.ts` asserts `items.enum` exists, holds the seven slugs
  in order, and carries a comment explaining why that existence assertion is the
  precondition for checkbox rendering.
- Each label is compared against `RowDefinition.displayName` read from the real
  catalogue built with `createFakeHap()`, not against a second set of literals.
- `src/config.ts` and `README.md` are unchanged.
- The `dist/` UAT scaffold state is reported.
</success_criteria>

<output>
Create `.planning/quick/260831-dlv-render-ignoredfaults-as-labelled-checkbo/260831-dlv-SUMMARY.md` when done.
</output>
