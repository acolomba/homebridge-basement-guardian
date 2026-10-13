---
phase: quick-260902-jou
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/platform.ts
  - test/platform.test.ts
autonomous: true
requirements: [DEV-01, CTRL-01]
must_haves:
  truths:
    - "A newly discovered device registers with Homebridge and no updatePlatformAccessories call precedes its registerPlatformAccessories call (DEV-01)"
    - "A pump-record change on an already-registered accessory still reaches Homebridge through updatePlatformAccessories (CTRL-01)"
    - "dispatchDiscoveredDevice still runs update() before registerPlatformAccessories — the throw-safety ordering is untouched"
  artifacts:
    - "src/platform.ts — persist port guarded by platform-map identity, comment stating the real constraint"
    - "test/platform.test.ts — regression case for the never-registered path; corrected expectation for the seed persists"
  key_links:
    - "persist closure -> context.accessories.get(accessory.UUID) identity check -> updatePlatformAccessories"
    - "registerPlatformAccessories -> Homebridge's own cache save carries the pre-registration context mutations to disk"
---

<objective>
Fix accessory registration being voided by a pre-registration persist.

On every fresh install, `dispatchDiscoveredDevice` deliberately runs the first
`update(snapshot, 'poll')` BEFORE `registerPlatformAccessories` (throw-safety,
documented at src/platform.ts:304-316 — that ordering stays). Since the pump
records module seeds its stored record on the first observation it ever sees
(src/accessories/pumpRecords.ts:322-325 → `persist()` at :347-349), that first
update always fires the persist port, whose only implementation
(src/platform.ts:139-143) calls `context.api.updatePlatformAccessories` on an
accessory that has not been registered yet. Real Homebridge
(node_modules/homebridge/dist/bridgeService.js:420-429) unconditionally merges
that accessory into `cachedPlatformAccessories`; the save then throws
("missing associated plugin") because only registration sets
`_associatedPlugin`, and the subsequent `registerPlatformAccessories` hits the
UUID-collision guard (bridgeService.js:388-392) against the poisoned cache
entry and skips the accessory. It never publishes to HomeKit, deterministically,
on every fresh install — and since the cache save always fails, every restart
is a fresh install. Confirmed live in the dev Homebridge 2.4.0 container.

Purpose: a brand-new device must actually reach HomeKit (DEV-01) while counted
activations still reach disk (CTRL-01).
Output: a guarded persist port in src/platform.ts, a corrected comment, and
regression coverage in test/platform.test.ts. `npm run check` green.
</objective>

<context>
@src/platform.ts                      (createBasementGuardianAccessoryFor :122-146, dispatchDiscoveredDevice :269-323)
@src/accessories/pumpRecords.ts       (observe() seeds on first observation, :317-350)
@src/runtime/accessoryStore.ts        (the port's contract and the recorder-style test rationale, D-10)
@test/platform.test.ts                (fakeDiscoveryApi :358-374, discoveryContext :395-407, powerRegistry :341, geminiDevice :203, registeredDevice :539-548, the seed-count case :1713-1737)
@.claude/rules/typescript-style-guide.md
@.claude/rules/typescript-comments.md
@.claude/rules/typescript-unit-testing.md

Read-only evidence (do not modify): node_modules/homebridge/dist/bridgeService.js:388-429.

Facts the executor must not rediscover:
- Tests run from compiled output: `npm run build:test && node --test dist-test/test/platform.test.js`.
- The four pre-commit hooks are lint, format:check, typecheck, fallow — the
  test suite is NOT among them, so a RED commit whose tests compile passes the
  hooks (recorded in .planning/STATE.md).
- `gsd-tools query commit` can report success while committing nothing in this
  repo. Use plain `git add` + `git commit` and verify each commit with
  `git show --name-only --format="" HEAD` (STATE.md tooling hazard).
- No Cucumber step reads the fake API's `updatePlatformAccessoryCalls`, and the
  fake's `registerPlatformAccessories` also calls `writeToCache`, so the
  scenario tier is unaffected by suppressing the pre-registration persist.
- The case at test/platform.test.ts:1690 uses the `registeredDevice` helper,
  which puts the accessory into the map BEFORE dispatch (existing-accessory
  path); it is unaffected by the fix and its `afterFirstPoll: 2` stays.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Pin the registration-safe persist contract with failing tests</name>
  <files>test/platform.test.ts</files>
  <behavior>
    - New case in the `registerDiscoveredDevices` describe block, beside the
      existing update-call cases (~line 1408): a brand-new device (empty
      accessories map, `powerRegistry()`, `store.applyDiscovery(geminiDevice())`,
      one `registerDiscoveredDevices` call) is registered exactly once and
      `updateCalls` stays empty — the record seeded during the pre-registration
      update must NOT reach `updatePlatformAccessories`. Assert one whole value
      via `assert.deepStrictEqual`, e.g. `{ registered: registerCalls.map((call) =>
      call.accessories.map((a) => a.UUID)), updated: updateCalls }` equals
      `{ registered: [[ACCESSORY_UUID]], updated: [] }`. Title it as public
      behavior, e.g. 'registers a newly discovered device without asking
      Homebridge to update a never-registered accessory'.
    - Existing case at :1713 ('asks Homebridge to store the accessory whose
      snapshot counted an activation, and no other'): change the expectation
      `{ seeds: 2, ... }` to `{ seeds: 0, ... }` — the two counted calls were
      the pre-registration seed persists, i.e. the bug itself. Keep
      `sinceTheSeeds: [[SECOND_ACCESSORY_UUID]]` unchanged; that half proves a
      post-registration persist still calls the API. Reword the `afterTheSeeds`
      narration: the seeds now mutate only the context, and registration's own
      cache write is what carries them to disk.
  </behavior>
  <action>
    Add the new case and adjust the :1713 expectation exactly as in the
    behavior list. Follow the file's own conventions: `// arrange` / `// act` /
    `// assert` markers, fresh state per case, values named for their
    production role, whole-value `deepStrictEqual`, no phase or plan references
    in titles or comments (typescript-comments rule). Reuse the existing
    helpers (`fakeDiscoveryApi`, `discoveryContext`, `powerRegistry`,
    `geminiDevice`, `ACCESSORY_UUID`) — add no new helper.

    Run the focused suite and WATCH both cases fail against current code (the
    new case fails on a premature update call; :1713 fails on `seeds`): this is
    the RED evidence that the tests discriminate the defect. Then commit with a
    plain `git add test/platform.test.ts` + `git commit` (message like
    `test(platform): expect no accessory update before registration`, body
    lines <= 80 chars, Conventional Commits, no GSD process mentions). Run
    `pre-commit run --files test/platform.test.ts` first; the hooks do not run
    the test suite, so the RED state commits cleanly. Verify the commit is
    non-empty with `git show --name-only --format="" HEAD`.
  </action>
  <verify>
    <automated>npm run build:test && node --test dist-test/test/platform.test.js; test $? -ne 0</automated>
  </verify>
  <done>
    The focused run fails on exactly the new case and the updated :1713 case,
    every other case stays green, and the RED commit exists and is non-empty.
  </done>
</task>

<task type="auto">
  <name>Task 2: Make the persist port a no-op for a never-registered accessory</name>
  <files>src/platform.ts</files>
  <action>
    In `createBasementGuardianAccessoryFor` (src/platform.ts:122-146), guard the
    persist closure: return without calling
    `context.api.updatePlatformAccessories` unless
    `context.accessories.get(accessory.UUID) === accessory` (identity, not
    truthiness — `context.accessories` is the platform-lifetime map, and the
    new-device path inserts the accessory at :321 immediately before
    registering at :322, so the guard opens the moment the accessory is the
    map's own entry).

    Rewrite the comment block above the closure (:131-138). The claim that two
    callers are safe because the API is idempotent is false for a
    never-registered accessory and is what hid this defect. The new comment
    must state: (a) the port persists only an accessory this platform has
    recorded as its own; (b) why — calling the update API on a never-registered
    accessory merges it into Homebridge's cached-accessory list with no
    associated plugin, the cache save then throws, and the upcoming
    registration is skipped as a UUID duplicate, so the accessory never reaches
    HomeKit; (c) nothing is lost by skipping — registration itself saves the
    cache, so the context mutations from the pre-registration update reach disk
    then; (d) keep the existing sentence explaining that the record members are
    absent from `updateDiscoveredDevice`'s change comparison (CTRL-01, D-008,
    D-010 anchors are allowed and encouraged).

    Do NOT touch `dispatchDiscoveredDevice` (:269-323): the update-before-
    register ordering and its comment block (:304-316) are load-bearing and
    stay byte-identical. Touch no other function.

    Verify in three steps: the focused pair goes green
    (`npm run build:test && node --test dist-test/test/platform.test.js`); the
    pair keeps 100% direct coverage — the guard's refuse branch is covered by
    the new case and :1713's arrange, the allow branch by :1713's act and the
    :1690 case (`npm run test:coverage:direct -- "dist-test/src/platform.js"
    "dist-test/test/platform.test.js"`); then the full gate. Commit with plain
    `git add src/platform.ts` + `git commit` (message like `fix(platform): skip
    persist for a never-registered accessory`; body may explain the Homebridge
    cache poisoning in <= 80-char lines). Run `pre-commit run --files
    src/platform.ts` before committing; verify the commit is non-empty.
  </action>
  <verify>
    <automated>npm run check</automated>
  </verify>
  <done>
    `npm run check` passes (typecheck, lint, fallow, format:check, unit +
    cucumber). The GREEN commit exists, is non-empty, and touches only
    src/platform.ts. `git log --oneline -2` shows the test(...) then fix(...)
    pair.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| none new | The change gates an internal call from plugin code into the Homebridge API; no untrusted input crosses it. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-quick-260902-01 | DoS | Homebridge cached-accessory list | high | mitigate | This plan IS the mitigation: the poisoned cache entry currently denies the accessory to HomeKit on every fresh install; the guard prevents the poisoning. |

No package installs; the package-legitimacy gate does not apply.
</threat_model>

<verification>
- `npm run check` green on the branch.
- Both commits present and non-empty (`git show --name-only --format="" HEAD~1..HEAD`).
- src/platform.ts:304-316 and the statement order at :317-322 unchanged
  (`git diff HEAD~2 -- src/platform.ts` shows edits only inside
  `createBasementGuardianAccessoryFor`).
</verification>

<success_criteria>
- The regression case proves a persist before registration makes no
  `updatePlatformAccessories` call, and the :1713 case proves one after
  registration still does.
- The persist port refuses until `context.accessories` owns the accessory;
  the comment above it states the real constraint instead of the idempotency
  claim.
- The update-before-register throw-safety ordering in
  `dispatchDiscoveredDevice` is untouched.
</success_criteria>

<output>
Create `.planning/quick/260902-jou-fix-accessory-registration-voided-by-pre/260902-jou-SUMMARY.md` when done.
Note for the human follow-up (not a task): re-run the fresh-storage dev
Homebridge container check that diagnosed this — the accessory must publish and
survive a restart. CHANGELOG entry and version bump happen at PR time per
CLAUDE.md.
</output>
