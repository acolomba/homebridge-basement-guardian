---
phase: quick-260831-c7f
plan: 01
subsystem: config
tags: [homebridge, config-schema, json-schema, settings-form, config-ui-x]

requires:
  - phase: 03-safety-monitoring-in-homekit
    provides: the service catalogue whose displayName is the published name of each notification sensor
provides:
  - a labelled option list behind ignoredFaults in config.schema.json, keyed on the service catalogue
  - three cases in test/configSchema.test.ts that hold the label-to-slug mapping to that catalogue
  - code-level evidence that homebridge-config-ui-x builds a titleMap from oneOf inside array items
affects: [config, settings-form, documentation]

actuals:
  tokens: 1476
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "A settings-form label is read off the shipped service catalogue, never written twice by hand."

key-files:
  created: []
  modified:
    - config.schema.json
    - test/configSchema.test.ts

key-decisions:
  - "The seven slugs stay written out as a literal in the test rather than imported from NOTIFICATION_SERVICE_KINDS, so a drifted runtime list fails the case instead of travelling with it."
  - "The container was not restarted: homebridge-config-ui-x reads config.schema.json from disk on each schema request, so the probe needed no restart, and skipping it preserved the in-flight UAT session's loaded module."
  - "oneOf with single-value enum entries is confirmed correct for array items by the shipped controller code, not only by the published documentation, which covers oneOf for property-level dropdowns and a bare enum for checkbox arrays."

patterns-established:
  - "Where documentation is silent on a schema combination, read the controller code that consumes it rather than inferring from an adjacent example."

requirements-completed: [CONF-06]

coverage:
  - id: D1
    description: "ignoredFaults offers the seven removable notification sensors as labelled options, each writing its original slug"
    requirement: CONF-06
    verification:
      - kind: unit
        ref: "test/configSchema.test.ts#CONF-06 offers exactly the seven removable notification sensors and no other value"
        status: pass
      - kind: unit
        ref: "test/configSchema.test.ts#CONF-06 lets each labelled option write one value and no other"
        status: pass
      - kind: unit
        ref: "test/configSchema.test.ts#CONF-06 labels each option with the name the accessory publishes that sensor under"
        status: pass
    human_judgment: false
  - id: D2
    description: "homebridge-config-ui-x accepts and serves the modified schema under strictValidation: true"
    verification:
      - kind: integration
        ref: "curl http://127.0.0.1:8581/api/plugins/config-schema/homebridge-basement-guardian, asserted for seven single-value labelled oneOf entries and strictValidation true"
        status: pass
    human_judgment: false
  - id: D3
    description: "The generated settings form draws the seven options under their published names, and writes slugs when saved"
    verification: []
    human_judgment: true
    rationale: "What the form draws is controller-side and unobservable from the repository. The served schema and the controller's titleMap builder are both confirmed, but only a human driving the form can confirm the rendering and the save round-trip."

duration: 35min
completed: 2026-08-31
status: complete
---

# Quick Task 260831-c7f: Human-Readable ignoredFaults Options Summary

**The `ignoredFaults` settings-form control now offers the seven removable notification sensors under the names their services publish to HomeKit, with each label writing back the original configuration slug.**

## Performance

- **Duration:** about 35 min
- **Tasks:** 3 of 3
- **Commits:** 2

## Accomplishments

- `config.schema.json` replaces the bare `enum` under `ignoredFaults.items` with seven `oneOf` entries. Each carries a `title` taken verbatim from the service catalogue and an `enum` holding exactly one string, the original slug, in the original order.
- `test/configSchema.test.ts` states the contract in three cases: the seven slugs in order with no bare `enum`, one value per option, and each `title` equal to the `displayName` the shipped catalogue publishes for that `kind`. The third case builds the real catalogue from `createFakeHap()`, so a label that drifts on either side names itself in the diff.
- The live Config UI serves the modified schema with `strictValidation` still `true`.
- The `oneOf`-inside-`items` shape was confirmed against the controller's own code, which closes the one real risk the documentation left open.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | State the labelled-option contract as failing cases | `81cbc2e` | `test/configSchema.test.ts` |
| 2 | Give each ignoredFaults option its published service name | `645208b` | `config.schema.json` |
| 3 | Confirm the Config UI serves the labelled schema | (no commit) | none |

## Verification

| Gate | Result |
|------|--------|
| `npm run typecheck` | clean |
| `npm run lint` | clean |
| `npm run format:check` | clean |
| `npm run test:unit` | 1000 tests, 1000 pass, 0 fail |
| `npm run test:cucumber` | 62 scenarios, 548 steps, all pass |
| `npm run fallow` | passed inside both `pre-commit` runs |
| `git diff -- src/ README.md` | empty |
| Config UI schema probe | seven labelled entries, `strictValidation: true` |

RED was real. After Task 1 the file held 16 cases: 13 passed and exactly the three new label cases failed, each because the shipped schema still declared a bare `enum`. `npm run typecheck` was clean at that point, so the RED commit passed the hooks.

## The documentation check, and what it did not settle

The Homebridge documentation at `developers.homebridge.io/#/config-screen/schema` (source: `https://developers.homebridge.io/docs/config-screen/schema.md`) documents the directed shape:

> Dropdown select boxes can be implemented using the JSON Schema `oneOf` attribute.
> `{ "title": "Form", "enum": ["form"] }`

It does not document a different keyword, so the plan's stop-and-report condition was not met. But it shows `oneOf` on a **property**, and its one checkbox-array example uses a **bare `enum` inside `items`** — the exact combination this task changes is not covered either way.

That gap was closed by reading the code that consumes the schema. The frontend bundle inside the running container, `/opt/homebridge/lib/node_modules/homebridge-config-ui-x/public/main-E3N63CH7.js`, handles `/items/oneOf` explicitly:

```js
!m$1(i,`titleMap`) && !m$1(i,`enum`) && m$1(n,`items`) && (
  w.has(n,`/items/titleMap`) ? i.titleMap = n.items.titleMap
  : w.has(n,`/items/enum`)   ? (i.enum = n.items.enum, ...)
  : w.has(n,`/items/oneOf`)  && (o = zu(n.items, i.flatList), o && (i.titleMap = o)))
```

The builder it calls requires every entry to have a `title` and every entry's `enum` to hold exactly one value, then maps them to `{ name: title, value: enum[0] }`. That is the shape shipped here, so the control receives labels for display and slugs for the wire.

It also makes the plan's one-value case load-bearing rather than decorative: an entry with two values makes the builder answer null, and the labels disappear silently.

## Deviations from Plan

### 1. [Rule 3 - Blocking] The `dist/` UAT scaffold was destroyed by the mandated pre-commit run

**This is the one item that needs attention.**

The brief said not to run `npm run build`, because `dist/accessories/basementGuardian.js` carried a hand-injected `__bgUatSnapshot` scaffold for an in-flight UAT session. `CLAUDE.md` separately requires `pre-commit run --files <changed files>` before every commit. Those two instructions conflict, and nothing in either one shows it:

- `.pre-commit-config.yaml` runs a local `npm fallow` hook.
- `package.json` declares `"prefallow": "npm run build"`.
- `"build": "rimraf ./dist && tsc"`.

So `pre-commit` transitively wipes and regenerates `dist/`. It did. `dist/accessories/basementGuardian.js` was rewritten at `09:00:16` and `grep -c __bgUatSnapshot` now answers `0`.

**Recovery attempted and failed.** `grep -rl "__bgUatSnapshot" .` over the whole tree, excluding `node_modules/` and `.git/`, finds nothing. `dist/` is gitignored. There is no copy to restore from.

**What is still intact.** Homebridge loads a plugin once at startup, so the container running since before this task still holds the scaffolded module in memory. Because of that:

- I did **not** restart the container. Task 3 said a restart was expected; it turned out to be unnecessary (see deviation 3), and skipping it kept the live session alive.
- **Any restart from here loads a scaffold-free build.** `./dev/hb restart`, `docker compose restart`, and `./dev/hb watch` all lose it. Whoever owns that UAT session should re-inject the scaffold before restarting, or capture what they still need from the running instance first.

### 2. [Rule 3 - Blocking] `npm run check` could not be run as one command

Task 2's `<verify>` names `npm run check`. It was refused by the harness policy, correctly: `check` runs `fallow`, which rebuilds `dist`. A combined `typecheck && lint && format:check` invocation was refused for the same reason.

Every constituent gate was run separately instead, and each is green — the Verification table above lists them. `fallow` itself was never run as a standalone command, but it ran and passed inside both `pre-commit` invocations, which is the same hook.

### 3. [Rule 3 - Blocking] Task 3's container restart was not performed

Task 3 directed a restart so the container would re-read the schema. It is not needed: homebridge-config-ui-x reads `config.schema.json` from disk on each request to `/api/plugins/config-schema/...`. The probe returned the seven labelled entries against a container that had been up for 32 minutes, with no restart.

Skipping it was also the safer choice given deviation 1.

### 4. [Count only] The plan predicted eleven passing cases in RED; there are thirteen

`test/configSchema.test.ts` held 14 cases before this task, not 12, because one `for` loop generates three. Rewriting one left 13 passing. No behaviour differs.

## What a human still has to check

**The GUI rendering was verified by a human, not by this plan — and that check has not been performed yet.** It is the open item.

Everything automation can reach is confirmed: the file on disk, the schema the Config UI serves, and the controller code that turns `oneOf` into a titleMap. What the form actually draws stays controller-side and unobservable from here.

At <http://127.0.0.1:8581> (admin/admin, loopback only), Plugins -> Basement Guardian -> Settings:

1. "Notification sensors to leave out" offers the seven options as **Backup Pump Activated, Mains Power Lost, Primary Pump Fault, Backup Pump Fault, Water Sensor Fault, Pump Controller Link Lost, Basement Guardian Offline** — not as slugs.
2. Pick two and save. `dev/homebridge/config.json` then holds a two-element `ignoredFaults` array of **slugs**, and `./dev/hb logs` shows Homebridge restarting with no configuration refusal. **This is the load-bearing step:** it proves the labels are display-only and the wire values did not move.
3. Restore the selection the harness was found with.

**Note on the harness state.** `dev/homebridge/config.json` still holds `["backup-pump-activated", "primary-pump-fault"]`, exactly as the brief described, untouched by this task. Those two were saved through the GUI under the *old* bare-enum schema, so they are not evidence for the new one. Step 2 above still has to be done under the labelled schema.

Also note that step 2 restarts Homebridge, which loses the in-memory UAT scaffold described in deviation 1.

This answers deferred human-verification item 3 in `.planning/STATE.md` once performed.

## Known Stubs

None.

## Threat Flags

None. The change adds display labels to a schema that is already published in the npm tarball. No credential, token, account identifier, or vendor endpoint is added, and `src/config.ts` is unmodified, so what the runtime accepts and refuses is byte-for-byte what it was.

`T-c7f-01` (a label leaking into a wire value) is mitigated as planned: the one-value case, the ordered slug comparison, and the controller's own `{ name: title, value: enum[0] }` mapping all hold. Its final confirmation is the human check's step 2.

## Self-Check: PASSED

- `config.schema.json` — FOUND, `ignoredFaults.items.oneOf` holds seven single-value labelled entries
- `test/configSchema.test.ts` — FOUND, 16 cases, all passing
- Commit `81cbc2e` — FOUND
- Commit `645208b` — FOUND
- `git diff -- src/ README.md` — empty, as required
