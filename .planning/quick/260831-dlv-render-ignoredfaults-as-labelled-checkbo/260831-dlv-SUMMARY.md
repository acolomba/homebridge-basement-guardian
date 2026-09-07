---
phase: quick-260831-dlv
plan: 01
subsystem: configuration
tags: [config-schema, homebridge-ui, settings-form, CONF-06]
status: complete
requires:
  - config.schema.json
  - src/accessories/serviceCatalogue.ts
  - src/accessories/services.ts
provides:
  - "ignoredFaults renders as a labelled checkbox list in the Homebridge settings form"
affects:
  - config.schema.json
  - test/configSchema.test.ts
tech-stack:
  added: []
  patterns:
    - "items.enum plus items.enumNames: the pair the Config UI reads as one unit for a labelled checkbox array"
key-files:
  created: []
  modified:
    - config.schema.json
    - test/configSchema.test.ts
decisions:
  - "enumNames carries the labels, not titleMap: the Config UI resolver assigns enumNames only inside its /items/enum branch, and enumNames names each wire value once where titleMap would restate all seven a second time."
  - "No minItems and no maxItems under ignoredFaults: minItems would forbid the empty list, and maxItems: 1 sends the field back to the generic array renderer that produced the regression."
metrics:
  duration: 25 min
  completed: 2026-08-31
actuals:
  tokens: 3200
  tasks: 3
  commits: 2
---

# Quick Task 260831-dlv: Render ignoredFaults as Labelled Checkboxes Summary

`ignoredFaults` is a labelled checkbox list again: `items.enum` holds the seven
sensor slugs and `items.enumNames` holds the seven published service names at
matching positions, replacing the `items.oneOf` that silently turned the control
into a row of per-item dropdowns.

## What Changed

Commit `645208b` had added human-readable labels by replacing `items.enum` with
`items.oneOf`. The labels appeared, but the Config UI stopped choosing the
checkbox control: it offers a spurious "None" entry in the generic array
renderer and lets one sensor be picked twice. `ignoredFaults` is the only
settings-form control that removes a safety notification sensor, so a control an
administrator can misread is a real cost.

`config.schema.json` now declares, under `ignoredFaults.items`:

- `enum` with the seven slugs in the order `NOTIFICATION_SERVICE_KINDS` lists
  them.
- `enumNames` with the seven published service names at matching positions.

`uniqueItems: true`, `title`, `items.type` and the `description` are unchanged.
No `minItems` and no `maxItems` were added.

## Evidence the Consumer Code Behaves as the Plan Claimed

All five findings were re-read from
`/opt/homebridge/lib/node_modules/homebridge-config-ui-x/public/main-E3N63CH7.js`
in the running container `bg-dev-homebridge` (Homebridge 2.4.0) before any edit.
Each held exactly as written:

1. Widget selection: `i===\`array\`` returns
   `m$1(w.getFirst([[t,\`/items\`],[t,\`/additionalItems\`]])||{},\`enum\`)&&t.maxItems!==1?Lu(\`checkboxes\`,t,n):\`array\``.
   `items.enum` as an own property plus `maxItems !== 1` is the whole test.
2. Label resolution: the chain is
   `w.has(n,\`/items/titleMap\`)? ... :w.has(n,\`/items/enum\`)?(i.enum=n.items.enum,!m$1(i,\`enumNames\`)&&w.has(n,\`/items/enumNames\`)&&(i.enumNames=n.items.enumNames)):w.has(n,\`/items/oneOf\`)&& ...`.
   `enumNames` is assigned only inside the `/items/enum` branch.
3. The widget reads both: `this.checkboxList=Tr(this.options.titleMap||this.options.enumNames,this.options.enum,!0)`.
4. The "None" entry: `!e&&!o&&r.unshift({name:\`<em>None</em>\`,value:null})`. The
   call above passes `!0` for `e`, so the checkbox path never adds it.
5. Positional pairing: `else if(me(t[s])&&s<n.length){let a=t[s],l=n[s];r.push({name:a,value:l}) ...}`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | State the checkbox contract as failing cases | `1362a9d` | `test/configSchema.test.ts`, `260831-dlv-PLAN.md` |
| 2 | Restore `items.enum` and label it with `enumNames` | `cdb183d` | `config.schema.json` |
| 3 | Confirm the live Config UI serves the labels | none (probe only) | none |

### Task 1 — RED

`test/configSchema.test.ts` holds 16 cases (13 written out plus a three-row
loop). The three cases commit `645208b` added were rewritten to the new
representation with their invariant intact:

- `CONF-06 offers exactly the seven removable notification sensors and no other value`
  now asserts `items.type === 'string'`, `Object.hasOwn(items,'enum') === true`,
  a deep-equal against the seven slugs written out as a literal, and
  `Object.hasOwn(items,'oneOf') === false`.
- The one-value-per-option case became
  `CONF-06 gives every offered value a label to pair with`, asserting
  `items.enum.length === 7` and `items.enumNames.length === items.enum.length`.
- `CONF-06 labels each option with the name the accessory publishes that sensor under`
  now pairs `enum[i]` with `enumNames[i]` and compares each label against the
  `displayName` read from the real catalogue built with
  `createServiceCatalogue(createFakeHap() as unknown as API['hap'])`.

Two comments carry the reasoning a future reader would need to keep the
assertions: why the `Object.hasOwn(items,'enum')` check is not a duplicate of the
deep-equal below it, and what a length mismatch costs given the positional
pairing.

`SettingsFormItems` became `{ type: string; enum: string[]; enumNames: string[] }`.
`SettingsFormOption` lost its last reader and was deleted, because
`eslint --max-warnings=0` and `fallow dead-code` both run as commit hooks.

RED was confirmed real before committing: `npm run test:unit` reported exactly
three failures, all in `configSchema`, each because the shipped schema still
declared `oneOf` and no `items.enum`. `npm run typecheck`, `npm run lint` and
`npm run format:check` were clean, which is what let the RED commit through the
hooks.

### Task 2 — GREEN

All gates run separately, never through `npm run check`:

- `npm run typecheck` — clean.
- `npm run lint` — clean.
- `npm run format:check` — clean.
- `npm run test:unit` — exit 0, no failing case.
- `npm run test:cucumber` — 62 scenarios, 548 steps, all passed.
- The plan's schema guard (`enum` present, `oneOf` absent, no
  `minItems`/`maxItems`, seven values and seven labels) — `ok`.
- `git diff 86feebd -- src/ README.md` — empty.

### Task 3 — Live probe

The precondition held: `bg-dev-homebridge` was `Up About an hour`. The container
was not restarted. Against
`/api/plugins/config-schema/homebridge-basement-guardian` with a Bearer token
from `/api/auth/login`:

```
strictValidation: true
enum: ["backup-pump-activated","mains-power-lost","primary-pump-fault","backup-pump-fault","water-sensor-fault","pump-controller-link-lost","basement-guardian-offline"]
enumNames: ["Backup Pump Activated","Mains Power Lost","Primary Pump Fault","Backup Pump Fault","Water Sensor Fault","Pump Controller Link Lost","Basement Guardian Offline"]
oneOf present: false
minItems/maxItems: false false
```

`enumNames` is not a standard JSON Schema keyword, so this probe is what settles
that it survives the round trip under `strictValidation: true`. It does, in
order, alongside `enum`. The `titleMap` fallback is not needed.

## UAT Scaffold State

`dist/accessories/basementGuardian.js` carried a hand-injected `__bgUatSnapshot`
scaffold belonging to an in-flight UAT session.

- Before Task 1: `grep -c __bgUatSnapshot` answered `2`.
- The `npm fallow` pre-commit hook ran `npm run build`, which is
  `rimraf ./dist && tsc`, and erased it. The count fell to `0`. This was expected
  and is not a failure.
- After the final commit the scaffold was restored from the backup copy at
  `/tmp/claude-1000/-home-acolomba-homebridge-basement-guardian/6d35ecfb-0da8-444e-81dd-c9fc98f8d666/scratchpad/basementGuardian.patched.js`.
- **Final state: `grep -c __bgUatSnapshot dist/accessories/basementGuardian.js`
  answers `2`. No re-injection is needed.**

The restore is safe because this task modified no `src/` file, so the rebuilt
output is the same code with only the scaffold missing.

`npm run build`, `npm run check` and `npm run fallow` were never invoked
directly. The container was never restarted.

## Deviations from Plan

**1. [Rule 3 - Blocking] The scaffold backup was taken outside the planning directory**

- **Found during:** Task 1 setup
- **Issue:** The plan directed a copy to
  `.planning/quick/260831-dlv-.../basementGuardian.uat-scaffold.js`. A backup of
  the patched file already existed in the session scratchpad, verified byte-for-
  byte present with `grep -c __bgUatSnapshot` answering `2`.
- **Fix:** Used the existing scratchpad copy. Writing a second 24K build artifact
  into `.planning/` would have put compiled output into the planning directory,
  where the orchestrator's docs commit would then pick it up.
- **Files modified:** none
- **Commit:** none

No other deviation. The plan executed as written.

## Known Stubs

None.

## Threat Flags

None. The change adds seven display labels that are already the public HomeKit
service names. No credential, token, account identifier or vendor endpoint
entered `config.schema.json`.

Threat register dispositions held:

- **T-dlv-01** (positional pairing mislabels a sensor) — mitigated. The
  pairing-length case pins the count; the catalogue-sourced label case pins the
  pairing. The plan's guard rejects any count other than seven.
- **T-dlv-02** (the seven wire values move) — mitigated. The deep-equal runs
  against a literal written out in the test, not against
  `NOTIFICATION_SERVICE_KINDS`, so a runtime name that drifts fails the case
  instead of travelling with it. The served schema confirms the seven values
  unchanged.
- **T-dlv-03** (schema in the tarball) — accepted, as planned.

## What Is Still Open

The rendering check is controller-side and cannot be closed from the repository.
Deferred human-verification item 3 in `.planning/STATE.md` stays open until
someone confirms at <http://127.0.0.1:8581>, Plugins -> Basement Guardian ->
Settings, under "Notification sensors to leave out":

1. The control is a checkbox list, not a row of dropdowns.
2. Seven boxes, labelled with the service names, not slugs.
3. No "None" entry, and no sensor selectable twice.
4. Ticking two boxes and saving writes a two-element array of **slugs** to
   `dev/homebridge/config.json`, and Homebridge restarts with no configuration
   refusal.
5. The selection the harness was found with is restored.

Step 4 restarts Homebridge and loses the in-memory UAT scaffold. Whoever owns
that session should capture what they need first.

`dev/homebridge/config.json` was left exactly as found and never opened for
writing. One correction to the handoff note that came with this task: it said a
human had set
`ignoredFaults: ["backup-pump-activated","primary-pump-fault"]` there. The
`BasementGuardian` platform block declares **no `ignoredFaults` key at all**. The
file is dated `09:45`, before this task made its first edit, and it is untracked
and covered by `.gitignore:136`, so nothing here changed it. Whoever performs the
human check should expect an empty selection as the starting state, not a
two-sensor one.

## Self-Check: PASSED

- `config.schema.json` — FOUND
- `test/configSchema.test.ts` — FOUND
- `1362a9d` — FOUND
- `cdb183d` — FOUND
