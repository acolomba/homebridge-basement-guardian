---
phase: quick-260904-mkz
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/runtime/accountRuntime.ts
  - test/runtime/accountRuntime.test.ts
  - .planning/WINDOWS.md
autonomous: true
requirements: [RES-01]

estimate:
  tokens: 48000
  raw_tokens: 48000
  tasks: 2
  confidence: low

must_haves:
  truths:
    - "A stray shadow message for a deviceId the account has already confirmed removed does not re-arm that device's dropped arrival stamp in MonitoringHealth's in-memory map or in the persisted ArrivalAnchors entry."
    - "A message for a deviceId the store still holds continues to record its arrival exactly as before; no shipped case regresses."
    - "WINDOWS.md ledger entry 43 reads status fixed with a populated resolved_at, matching the format every other fixed entry in the file already has."
  artifacts:
    - "test/runtime/accountRuntime.test.ts holds a new case pinning the anchor non-re-arm, modeled on the existing 'reports nothing for a message from a pump the account has already removed' case."
    - "src/runtime/accountRuntime.ts guards the health.recordShadowMessage(deviceId) call inside attemptShadow()'s onReportedPatch callback with an options.store.deviceIds().includes(deviceId) check."
    - ".planning/WINDOWS.md entry 43's status is fixed and its resolved_at is populated."
  key_links:
    - "The new guard reads options.store.deviceIds(), the same store-membership source the confirmed-removal branch (around accountRuntime.ts:404) and the shadow-disconnect handler (around accountRuntime.ts:724-726) already use elsewhere in the same file."
    - "health.recordShadowMessage -> createMonitoringHealth's lastShadowArrival map AND options.anchors.record (src/runtime/monitoringHealth.ts:278-283) -> the persisted arrival-anchor file, which is why the re-arm outlives the process and not just the request."
---

<objective>
Close WINDOWS.md ledger entry 43: a stray shadow message for a device the account has already
confirmed removed still calls `health.recordShadowMessage(deviceId)`, which re-creates that device's
arrival stamp in `MonitoringHealth`'s in-memory map and re-persists it into `ArrivalAnchors` — both of
which the confirmed-removal branch had already dropped moments earlier via `health.forgetDevice(deviceId)`
and `options.anchors.forget(deviceId)`. Write a failing test that pins this against the persisted anchor,
then add the one guard that closes it at the arrival callback. Then mark ledger entry 43 fixed.

Purpose: `src/runtime/arrivalAnchors.ts` is written back to disk on every reporting tick and lives for the
life of the process. Left unguarded, every stray message the shadow client's lingering per-device
subscription still delivers after a removal writes one more entry an owner's account no longer holds,
which is exactly the "keyed state outlives the device" pattern this phase's own threat register
(`T-05.1-04`) already names and mitigated at the removal site — this is the one growth surface
`05.1-03-SUMMARY.md` measured and explicitly carried out of scope rather than closing.

Output: one new unit case in `test/runtime/accountRuntime.test.ts`, a one-line guard in
`src/runtime/accountRuntime.ts`, and WINDOWS.md ledger entry 43 marked fixed.
</objective>

<execution_context>
@/home/acolomba/homebridge-basement-guardian/.claude/gsd-core/workflows/execute-plan.md
@/home/acolomba/homebridge-basement-guardian/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@.claude/rules/typescript-comments.md
@.claude/rules/typescript-style-guide.md
@.claude/rules/typescript-unit-testing.md
@.planning/phases/05.1-per-pump-trust-and-monotonic-silence/05.1-03-SUMMARY.md
</context>

<investigation_findings>

Read in full during planning, so the two tasks below do not need to re-derive it:

- **The removal site (`src/runtime/accountRuntime.ts:396-462`) already prunes three things** at the
  single confirmed-removal branch: `health.forgetDevice(deviceId)` (drops the in-memory arrival stamp),
  `options.anchors.forget(deviceId)` (drops the persisted wall-clock anchor), and
  `options.failures.forget(liveReportingKind(deviceId))` (drops the failure-log rate-limiter entry).
  **This removal-time pruning is not what is missing** — it already runs and already works. The defect
  is that a *later* stray message re-creates the first two after removal, because the shadow client has
  no per-device unsubscribe (`src/cloud/shadow.ts`'s `ShadowClient` interface only has `start()` and
  `stop()`) and stays subscribed to a removed device's topics until the whole connection is rebuilt —
  which the comment above the sibling test at `test/runtime/accountRuntime.test.ts:2696-2703` already
  states as the reason a stray message can arrive at all.
- **The fix therefore belongs at the arrival callback, not at the removal branch.** Inside
  `attemptShadow()`'s `onReportedPatch` callback (`src/runtime/accountRuntime.ts`, currently around
  line 791), `health.recordShadowMessage(deviceId)` runs unconditionally for every routed message. That
  one call is the whole defect: it writes `lastShadowArrival.set(deviceId, ...)` in
  `src/runtime/monitoringHealth.ts` and, inside the same call, `options.anchors.record(deviceId,
  options.clock.now())` — re-persisting the anchor the removal branch just dropped.
- **The two statements beside it need no change.** `options.store.applyReportedPatch(deviceId, patch)`
  is already a documented no-op for a `deviceId` the store does not hold
  (`src/device/state.ts:88-90`: "Reports nothing for a device REST discovery has not returned, because
  a device enters the store through discovery alone"). And `reportedSilentDevices.has(deviceId)` can
  never be true for a removed device, because `reportMonitoringHealth` rebuilds that latch wholesale
  from `store.deviceIds()` on every report (`05.1-03-SUMMARY.md`, "The latch drop — a measured null
  result").
- **This was already measured, named, and explicitly deferred** in `05.1-03-SUMMARY.md` under "An
  Observation Left Out of Scope": "A message arriving from an already-removed device still runs
  `health.recordShadowMessage(deviceId)` in the arrival callback, which re-arms a stamp ... that
  `health.forgetDevice` had just dropped. Nothing reads it ... so it is inert, but it is one number per
  removed-then-stray device that nothing releases." That "inert" reading is about the in-memory stamp
  feeding `silentDevices()` (whose only consumers are a no-op `releaseShadowSource` call and a
  per-device map keyed by `store.deviceIds()`, which a removed device is never in). The persisted
  anchor is the more durable half — it survives a restart — and is what this plan's test pins directly.
- **WINDOWS.md's `windows fixed <id>` verb takes no reason.** `markFixed` in
  `.claude/gsd-core/bin/lib/broken-windows.cjs:275-283` sets only `status` and `resolved_at`; only
  `markWaived` accepts (and requires) a `reason`. Every one of the ledger's 15 `fixed` rows today
  carries an empty `reason` — entry 34, one of the two rows this task's own instructions cite, is one
  of them. Quick task `260903-q06` closed that same entry 34 the same way: `windows fixed 34` alone, no
  hand-edited reason. This plan follows that precedent rather than hand-editing the ledger's fenced
  JSON block for a field the tool and every existing `fixed` row agree a fix does not carry — see Task
  2 for the full reasoning.
</investigation_findings>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Guard the shadow arrival callback against a message from an already-removed pump</name>

  <files>src/runtime/accountRuntime.ts, test/runtime/accountRuntime.test.ts</files>

  <precondition>`grep -c 'options.store.deviceIds().includes(deviceId)' src/runtime/accountRuntime.ts` returns 0 (the guard does not already exist) AND `grep -c "reports nothing for a message from a pump the account has already removed" test/runtime/accountRuntime.test.ts` returns 1 (the sibling case this new one is modeled on is still present) — if either is false, stop and report rather than assuming this plan's references still apply.</precondition>

  <read_first>
    - `src/runtime/accountRuntime.ts:396-462` — the confirmed-removal branch and its three prune calls
      (`health.forgetDevice`, `options.anchors.forget`, `options.failures.forget`), and the comment
      explaining why this is the one pruning site.
    - `src/runtime/accountRuntime.ts:749-800` — `attemptShadow()`'s `createShadow({ ... })` call, in
      particular the `onReportedPatch` callback holding `health.recordShadowMessage(deviceId);` and
      `options.store.applyReportedPatch(deviceId, patch);`.
    - `src/runtime/monitoringHealth.ts:244-320` — `createMonitoringHealth`, in particular
      `recordShadowMessage` (sets `lastShadowArrival` AND calls `options.anchors.record`) and
      `forgetDevice` (drops only the in-memory map entry).
    - `src/device/state.ts:82-100` — `DeviceStateStore`'s `deviceIds()` and `applyReportedPatch()`
      docblocks, establishing both are already safe for a `deviceId` the store does not hold.
    - `test/runtime/accountRuntime.test.ts:349-427` — the `Harness`/`RecordingAnchors` shapes, in
      particular `anchors: RecordingAnchors` and `recordingAnchors()`'s `stored` map.
    - `test/runtime/accountRuntime.test.ts:2676-2721` — the two sibling removal cases: `'drops the
      arrival anchor of a removed pump...'` (reads `anchors.stored`) and `'reports nothing for a
      message from a pump the account has already removed'` (the exact harness script, `advance`
      sequence, and stray-message call this new case is modeled on).
    - `.planning/phases/05.1-per-pump-trust-and-monotonic-silence/05.1-03-SUMMARY.md`, section "An
      Observation Left Out of Scope" — where this defect was first measured and named.
  </read_first>

  <behavior>
    - A stray `onReportedPatch(deviceId, patch)` call for a `deviceId` the store no longer holds (i.e.
      already confirmed removed) must not re-arm that device's entry in the injected `RecordingAnchors`
      test double — before and after the stray message, `anchors.stored.has(deviceId)` stays `false`.
    - A message for a `deviceId` the store still holds continues to record its arrival exactly as
      before; every shipped case in the file keeps passing unchanged.
  </behavior>

  <action>
    RED — add the test first. In `test/runtime/accountRuntime.test.ts`, inside `describe('DEV-05
    removal reconciliation', ...)`, add a new `test()` immediately after the existing `'reports nothing
    for a message from a pump the account has already removed'` case, before that `describe` block's
    closing brace. Name it `'does not re-arm the arrival anchor when a stray message arrives after a
    pump is removed'`. Build the harness with the identical `devices` script and `pollIntervalMs:
    TWO_MISSED_HEARTBEATS_MS` the sibling case uses, destructuring `{ runtime, shadows, anchors,
    removed, advance }`. After `await runtime.start()` and the same two `await
    advance(TWO_MISSED_HEARTBEATS_MS)` calls the sibling case makes (this is what makes `removed` read
    `[DEVICE_ID]`), capture a value naming what is known at that point — the removal list and whether
    the anchor is still carried. Act by calling `shadowOptionsOf(shadows).onReportedPatch(DEVICE_ID,
    heartbeatPatch())`, the same stray-message call the sibling case makes. Assert, in one
    `assert.deepStrictEqual`, that the state captured right after removal already shows `removed:
    [DEVICE_ID]` and `hasAnchor: false`, and that a second read of `anchors.stored.has(DEVICE_ID)` taken
    after the stray message is also `false`. `anchors` is the `RecordingAnchors` the harness already
    returns; no new test support is needed.

    Run the focused test file and confirm this new case is the only failure. Against the unmodified
    source, `onReportedPatch` calls `health.recordShadowMessage(deviceId)` unconditionally, which calls
    `options.anchors.record(deviceId, options.clock.now())` inside `createMonitoringHealth`
    (`src/runtime/monitoringHealth.ts:278-283`), so the post-stray-message read comes back `true`
    instead of the expected `false`.

    GREEN — close the gap at its real site. In `src/runtime/accountRuntime.ts`, inside
    `attemptShadow()`'s `createShadow({ ... onReportedPatch: (deviceId, patch) => { ... } })` callback,
    the statement `health.recordShadowMessage(deviceId);` (immediately before
    `options.store.applyReportedPatch(deviceId, patch);`) currently runs for every routed message with
    no check that the account still holds `deviceId`. Wrap only that one statement in `if
    (options.store.deviceIds().includes(deviceId))` — the same store-membership source the
    confirmed-removal branch and the shadow-disconnect handler already use elsewhere in this file. Do
    not touch `options.store.applyReportedPatch(deviceId, patch);` or the `if
    (reportedSilentDevices.has(deviceId)) { reportMonitoringHealth(); }` block below it: both are
    already safe for a removed `deviceId`, as established in `<investigation_findings>` above, and
    wrapping them too would widen the diff past the one real gap.

    Add a short comment beside the new guard, in the surrounding block's own documentation voice,
    stating why: a message routed for a `deviceId` the account has already confirmed removed must not
    resurrect the arrival stamp that `health.forgetDevice` and `options.anchors.forget` already dropped
    at the removal site. Check which decision ID the surrounding comments already cite for that removal
    invariant before picking one to anchor the new sentence to; do not invent a new one, and do not name
    a phase, plan, wave, task, or WINDOWS.md ledger entry in the comment
    (`.claude/rules/typescript-comments.md`).

    Rebuild and re-run the focused test file; the new case must now pass and every other case in the
    file must still pass unchanged.
  </action>

  <verify>
    <automated>O=$(npm run build:test 2>&amp;1 &amp;&amp; node --test 'dist-test/test/runtime/accountRuntime.test.js' 2>&amp;1); R=$?; test $R -eq 0 &amp;&amp; printf '%s\n' "$O" | grep -qE '^ℹ tests 124$' &amp;&amp; printf '%s\n' "$O" | grep -qE '^ℹ pass 124$' &amp;&amp; printf '%s\n' "$O" | grep -qE '^ℹ fail 0$'</automated>
    <fails_when>The command exits non-zero, or the counts are not exactly 124 tests / 124 pass / 0 fail — 123 means the new case was never added; any fail above 0 means the new case or a shipped one broke.</fails_when>
  </verify>

  <verify>
    <automated>O=$(npm run test:coverage:direct -- dist-test/src/runtime/accountRuntime.js 'dist-test/test/runtime/accountRuntime.test.js' 2>&amp;1); R=$?; test $R -eq 0 &amp;&amp; printf '%s\n' "$O" | grep -qE 'accountRuntime\.js *\| *100\.00 *\| *100\.00 *\| *100\.00'</automated>
    <fails_when>The command exits non-zero, or the coverage table names accountRuntime.js below 100 on lines, branches or functions.</fails_when>
  </verify>

  <verify>
    <automated>O=$(npm run test:unit 2>&amp;1); R=$?; test $R -eq 0 &amp;&amp; printf '%s\n' "$O" | grep -qE '^ℹ tests 1424$' &amp;&amp; printf '%s\n' "$O" | grep -qE '^ℹ fail 0$'</automated>
    <fails_when>The command exits non-zero, or the whole-tree unit count is not exactly 1424 (1423 measured before this task, plus exactly the one new case) with 0 failures.</fails_when>
  </verify>

  <verify>
    <automated>O=$(npm test 2>&amp;1); R=$?; test $R -eq 0 &amp;&amp; printf '%s\n' "$O" | grep -qE '^ℹ fail 0$' &amp;&amp; printf '%s\n' "$O" | grep -qE '104 scenarios \(104 passed\)' &amp;&amp; printf '%s\n' "$O" | grep -qE '1156 steps \(1156 passed\)'</automated>
    <fails_when>The command exits non-zero, or the scenario/step counts drop below the 104/1156 baseline measured at the close of phase 05.1 — this task adds no scenario and touches no feature file, so neither count should move. Run alone; a concurrent suite run on this tree has produced false reds before.</fails_when>
  </verify>

  <acceptance_criteria>
    - The new case fails against the unmodified source (the stray message re-arms `anchors.stored`) and passes once the guard is added.
    - No shipped case in `test/runtime/accountRuntime.test.ts` regresses; the focused file reports 124/124/0.
    - `src/runtime/accountRuntime.js` stays at 100/100/100 direct coverage.
    - The whole unit tree reports 1424/1424/0 and `npm test` reports 104 scenarios (104 passed), 1156 steps (1156 passed), `fail 0` — unchanged from the pre-task baseline, confirming the guard touches only the stray-message path.
  </acceptance_criteria>

  <done>A message from an already-removed pump no longer re-arms its dropped arrival stamp in memory or on disk, pinned by a case that fails without the guard and passes with it; nothing else in the suite moved.</done>
</task>

<task type="auto">
  <name>Task 2: Close WINDOWS.md ledger entry 43</name>

  <files>.planning/WINDOWS.md</files>

  <precondition>Task 1 is committed — `git log -1 --format=%s` names this fix, and `grep -c 'options.store.deviceIds().includes(deviceId)' src/runtime/accountRuntime.ts` returns at least 1 — so the ledger entry closes against real, tested code rather than a claim ahead of it.</precondition>

  <read_first>
    - `.planning/WINDOWS.md` entry 43 — the row and its JSON twin (`"id": 43`), the defect this task closes.
    - `.planning/WINDOWS.md` entries 34 and 2 — worked examples of a `fixed` row: `resolved_at`
      populated, `reason` left empty. Every one of the ledger's 15 `fixed` rows today carries an empty
      `reason`; only `waived` rows carry one.
    - `.claude/gsd-core/bin/lib/broken-windows.cjs:263-283` — `markWaived` requires a non-empty
      `reason` and throws otherwise; `markFixed` takes no `reason` parameter at all and only ever sets
      `status` and `resolved_at`.
    - `.planning/quick/260903-q06-correct-the-telemetry-ownership-guard-s-/260903-q06-PLAN.md`, task
      3.D.1 — the precedent: `node .claude/gsd-core/bin/gsd-tools.cjs windows fixed 34` alone closed
      that entry, no reason attached.
  </read_first>

  <action>
    Run `node .claude/gsd-core/bin/gsd-tools.cjs windows fixed 43` from the repository root. This is
    the tool-supported way to close the entry: it sets `status: "fixed"` and `resolved_at` to the
    current time in both the markdown table row and its JSON twin, and recomputes the frontmatter
    counts, without a hand edit of the ledger's fenced JSON block.

    Do not hand-edit a `reason` into row 43. Every `fixed` row in this file — 15 of them before this
    task, matching `markFixed`'s own implementation, which accepts no `reason` argument — carries an
    empty `reason`; only `waived` rows do, because a waiver needs a stated justification for *not*
    fixing something and `markWaived` enforces that at the tool level. This is a genuine fix with a
    passing test, not a waiver, so it takes the `fixed` verb and the shape every other `fixed` row in
    this file already has. The description cell already states what was wrong, and this task's own
    commit is the record of what closed it; hand-editing a `reason` into the fenced JSON block for a
    field the tool and its own precedent (`260903-q06`, closing entry 34 the identical way) say a
    `fixed` row does not carry is the wrong kind of change to make by hand here.

    Commit discipline: `pre-commit run --files .planning/WINDOWS.md`, fix anything it flags, restage,
    re-run until clean, then `git add .planning/WINDOWS.md` and a plain `git commit -m &lt;msg&gt;` with no
    pathspec — never `gsd-tools query commit`, which can report success while committing nothing. Then
    `git show --name-only --format="" HEAD` and confirm the file list is not empty. Stay on the current
    branch; never `--no-verify`; never rebase.
  </action>

  <verify>
    <automated>node .claude/gsd-core/bin/gsd-tools.cjs windows status --raw | node -e 'let s="";process.stdin.on("data",d=&gt;s+=d).on("end",()=&gt;{const l=JSON.parse(s).ledger;const e43=l.entries.find((e)=&gt;e.id===43);const ok=l.open_count===9&amp;&amp;l.fixed_count===16&amp;&amp;l.total_count===43&amp;&amp;e43&amp;&amp;e43.status==="fixed"&amp;&amp;typeof e43.resolved_at==="string"&amp;&amp;e43.resolved_at.length&gt;0&amp;&amp;e43.reason==="";console.log(ok?"LEDGER_OK":"LEDGER_FAIL "+JSON.stringify({open:l.open_count,fixed:l.fixed_count,e43}));process.exit(ok?0:1);});'</automated>
    <fails_when>Entry 43 is not `status: "fixed"` with a populated `resolved_at`, or `open_count`/`fixed_count`/`total_count` do not read 9/16/43, or a non-empty `reason` was hand-added where every other `fixed` row has none.</fails_when>
  </verify>

  <acceptance_criteria>
    - Entry 43 reads `status: "fixed"` with a populated `resolved_at`, matching entries 34 and every other `fixed` row's shape (empty `reason`).
    - `open_count` is 9, `fixed_count` is 16, `total_count` stays 43.
    - The commit touches only `.planning/WINDOWS.md` and is verified by content, not by the commit tool's return value.
  </acceptance_criteria>

  <done>WINDOWS.md ledger entry 43 is closed as fixed, in the same shape every other fixed entry in the file already has.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| vendor MQTT shadow broker → `onReportedPatch` | Untrusted routed messages cross here for any `deviceId` the broker's live subscription still names, including one the account has already confirmed removed — the shadow client has no per-device unsubscribe. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-mkz-01 | Denial of service | `src/runtime/monitoringHealth.ts` `recordShadowMessage`/`lastShadowArrival`, and `src/runtime/arrivalAnchors.ts`'s persisted map, reached via `src/runtime/accountRuntime.ts`'s `onReportedPatch` callback | low | mitigate | A stray message from an already-removed pump no longer re-arms the in-memory arrival stamp or re-persists the wall-clock anchor; the guard checks `options.store.deviceIds()` before calling `recordShadowMessage`, pinned by the new test against the persisted anchor. Severity is low: growth is bounded by however many previously-removed deviceIds the shadow client happens to still be subscribed to, and every reconnect resets that subscription set — but the persisted half survives a restart until this fix, which is why it is mitigated rather than accepted. |
| T-mkz-SC | Tampering | npm/pip/cargo installs | n/a | accept | No package is installed, removed, or upgraded by this task. |
</threat_model>

<verification>
- `npm run test:unit`, run alone, reports `ℹ tests 1424`, `ℹ pass 1424`, `ℹ fail 0`.
- `npm test`, run alone, reports `ℹ fail 0`, `104 scenarios (104 passed)`, `1156 steps (1156 passed)` — the pre-task baseline, unmoved.
- `dist-test/src/runtime/accountRuntime.js` stays at 100/100/100 direct coverage.
- `npm run typecheck`, `npm run lint`, `npm run fallow`, `npm run format:check` all exit 0.
- `node .claude/gsd-core/bin/gsd-tools.cjs windows status --raw` shows entry 43 `fixed`, `open_count` 9, `fixed_count` 16, `total_count` 43.
</verification>

<success_criteria>
A stray shadow message for an already-removed pump no longer re-arms its dropped arrival stamp, in memory or on disk, proven by a test that fails without the fix and passes with it; nothing else in the suite moved; and WINDOWS.md ledger entry 43 is closed as fixed.
</success_criteria>

<output>
Create `.planning/quick/260904-mkz-close-windows-md-ledger-entry-43-open-ph/260904-mkz-SUMMARY.md` when
done. Record: the RED and GREEN commits with their hashes, the decision-ID citation chosen for the new
comment and why, confirmation that the four suite baselines (124/124/0 focused, 100/100/100 coverage,
1424/1424/0 unit, 104 scenarios/1156 steps/fail 0 full) reproduced, and the ledger's post-task counts.
</output>
