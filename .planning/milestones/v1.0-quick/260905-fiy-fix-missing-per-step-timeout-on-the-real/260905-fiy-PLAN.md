---
phase: quick-260905-fiy
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - features/real-pump/support/heartbeatSteps.ts
autonomous: true
requirements: [REL-09]

estimate:
  tokens: 20000
  raw_tokens: 20000
  tasks: 1
  confidence: low

must_haves:
  truths:
    - "The `the harness waits {int} seconds` step definition carries a per-step timeout comfortably longer than the 960-second wait `heartbeats.feature` asks of it, so the step is no longer killed by Cucumber's own 5000ms default before the wait can complete."
    - "No other step definition in the codebase changes behavior: no `setDefaultTimeout()` call is added, so every other step keeps failing fast on a real stall."
  artifacts:
    - "features/real-pump/support/heartbeatSteps.ts -- the `When('the harness waits {int} seconds', ...)` registration carries an explicit `{ timeout: ... }` options object, with a named, commented constant rather than a magic number."
  key_links:
    - "The `{ timeout: STEP_TIMEOUT_MS }` options object -> Cucumber's `IDefineStep` overload `(pattern, options: IDefineStepOptions, code) => void` (`node_modules/@cucumber/cucumber/lib/support_code_library_builder/types.d.ts`) -> the step's own timer, not the runner's 5000ms default. Get the argument order wrong and TypeScript itself refuses to compile it, which is what task 1's `npm run typecheck` gate catches."
---

<objective>
Give the real-pump heartbeat wait step a per-step Cucumber timeout long enough to survive its own
960-second wait, so `heartbeats.feature`'s two scenarios can actually run to completion against the
live vendor account instead of dying to Cucumber's 5000ms default step timeout.

Purpose: `npx cucumber-js --profile real` currently finishes the real-pump suite in about 16 seconds
instead of the ~960+ seconds the two heartbeat scenarios are designed to take, because
`features/real-pump/support/heartbeatSteps.ts` registers `the harness waits {int} seconds` with no
timeout override. Cucumber kills every step at 5000ms unless the step itself says otherwise
(`Error: function timed out, ensure the promise resolves within 5000 milliseconds`), so the scenarios
can never observe anything as currently written (REL-09).

Output: `features/real-pump/support/heartbeatSteps.ts` with the wait step registered under an
explicit, named, generous timeout that does not touch Cucumber's global default or any other step.
</objective>

<execution_context>
@/home/acolomba/homebridge-basement-guardian/.claude/gsd-core/workflows/execute-plan.md
@/home/acolomba/homebridge-basement-guardian/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@features/CLAUDE.md
@.claude/rules/typescript-style-guide.md
@.claude/rules/typescript-comments.md
</context>

<background>
`@cucumber/cucumber` (`^13.2.1`, installed) times every step at 5000ms unless the step itself is
registered with an `IDefineStepOptions` object (`{ timeout?: number; wrapperOptions?: any }`) as the
second argument, ahead of the handler:

    When(pattern, code)
    When(pattern, options, code)

(`node_modules/@cucumber/cucumber/lib/support_code_library_builder/types.d.ts`, `IDefineStep`.)
`heartbeats.feature`'s two scenarios both call `When the harness waits 960 seconds` -- the step's only
caller -- so a fixed ceiling above 960 seconds covers every use without computing anything from the
matched `{int}` at registration time, which Cucumber cannot do anyway (the options object is fixed
when the step is registered, not when it runs).

The codebase already has this exact pattern, once per steps file, sized to that file's own longest
real wait: `features/support/steps/controls.ts`, `runtime.ts`, `homekit.ts` and `shadow.ts` each
declare a module-local `STEP_TIMEOUT_MS` constant with a comment justifying its size, then pass
`{ timeout: STEP_TIMEOUT_MS }` to every `When`/`Then` that needs it. Follow that precedent here rather
than inventing a new shape. `setDefaultTimeout()` is exported by `@cucumber/cucumber` but is never
called anywhere in this codebase today (confirmed by search) -- it must stay that way, because it
would raise the timeout for every step in every profile, including the ones this task must keep
failing fast on a real stall.

`src/cloud/*.ts` and the separate `InformationalError: socket idle timeout` failure in the suite's
other scenario are explicitly out of scope. Do not investigate or touch them.
</background>

<tasks>

<task type="tracer">
  <name>Task 1: Give the wait step its own per-step timeout, end to end</name>
  <precondition>`grep -c "When('the harness waits {int} seconds', async" features/real-pump/support/heartbeatSteps.ts` reports `1` -- the file still has no timeout override on this step. `grep -rc 'setDefaultTimeout' features features/real-pump` reports `0` in every file -- nothing already raises the global default.</precondition>
  <files>features/real-pump/support/heartbeatSteps.ts</files>
  <read_first>
    - `features/real-pump/support/heartbeatSteps.ts` (whole file, 41 lines) -- the step to fix and the file's existing conventions (imports, ordering, `MILLISECONDS_PER_SECOND`).
    - `features/support/steps/controls.ts` lines 1-39 -- the module-local `STEP_TIMEOUT_MS` constant-plus-comment pattern and a `When(pattern, { timeout: STEP_TIMEOUT_MS }, handler)` call site to copy the shape of.
    - `node_modules/@cucumber/cucumber/lib/support_code_library_builder/types.d.ts` -- `IDefineStepOptions` (`{ timeout?: number; wrapperOptions?: any }`) and the `IDefineStep` overload that takes it as the second argument, ahead of the handler.
    - `features/real-pump/heartbeats.feature` lines 1-25 -- both scenarios calling `the harness waits 960 seconds`, and the comment explaining why 960 seconds was chosen.
  </read_first>
  <action>
Add a module-level `STEP_TIMEOUT_MS` constant to `features/real-pump/support/heartbeatSteps.ts`, set
to `1_000_000` (about 16.7 minutes) -- a fixed ceiling comfortably above the 960-second wait
`heartbeats.feature` asks for, not a value computed from the matched `{int}`. Place it after the
`MILLISECONDS_PER_SECOND` constant, with a comment stating: Cucumber's own step timeout defaults to
5000ms, this step's only caller waits up to 960 seconds, and the ceiling is fixed at registration
time because Cucumber's step-options object cannot be computed per-invocation.

Pass `{ timeout: STEP_TIMEOUT_MS }` as the second argument to the existing
`When('the harness waits {int} seconds', ...)` call, ahead of the handler function, matching the
`(pattern, options, code)` overload of `IDefineStep` and the call-site shape already used in
`features/support/steps/controls.ts`, `runtime.ts`, `homekit.ts` and `shadow.ts`. Change nothing else
in the step's body -- `delay(seconds * MILLISECONDS_PER_SECOND)` stays exactly as it is. Touch no
other step in this file or any other file, and do not raise the runner's global default step timeout
by any other means -- the fix stays scoped to this one step's own options object.
  </action>
  <verify>
    <automated>O=$(npm run typecheck 2>&1); R=$?; test $R -eq 0 &amp;&amp; echo TYPECHECK_OK || { echo "$O"; exit 1; }</automated>
    <automated>O=$(npm run build:test 2>&1); R=$?; test $R -eq 0 &amp;&amp; echo BUILD_TEST_OK || { echo "$O"; exit 1; }</automated>
    <automated>O=$(npx cucumber-js --profile real --dry-run -- features/real-pump/heartbeats.feature 2>&amp;1); R=$?; test $R -eq 0 &amp;&amp; ! printf '%s\n' "$O" | grep -qiE 'undefined|ambiguous' &amp;&amp; printf '%s\n' "$O" | grep -qE '^[0-9]+ scenarios? \([0-9]+ skipped\)$' &amp;&amp; echo DRY_RUN_OK || { echo "$O"; exit 1; }</automated>
    <automated>test "$(grep -c "{ timeout: STEP_TIMEOUT_MS }" features/real-pump/support/heartbeatSteps.ts)" -ge 1 &amp;&amp; test "$(grep -c 'setDefaultTimeout' features/real-pump/support/heartbeatSteps.ts)" -eq 0 &amp;&amp; echo TEXT_GATES_OK</automated>
  </verify>
  <done>
`features/real-pump/support/heartbeatSteps.ts` registers `the harness waits {int} seconds` with an
`{ timeout: STEP_TIMEOUT_MS }` options object ahead of the handler, `STEP_TIMEOUT_MS` is a named,
commented module-level constant set well above 960 seconds, `npm run typecheck` and
`npm run build:test` both pass, and `npx cucumber-js --profile real --dry-run` resolves
`heartbeats.feature`'s steps with no undefined or ambiguous steps reported. No `setDefaultTimeout()`
call exists anywhere in the file, and no other step's registration changed.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Cucumber runner -> step definition | The runner enforces a per-step wall-clock timeout; a step that needs longer must say so explicitly at registration, or the runner kills it regardless of whether the underlying wait is legitimate. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-fiy-01 | Denial of Service | `the harness waits {int} seconds`, `features/real-pump/support/heartbeatSteps.ts` | low | mitigate | The step's own 960-second wait is killed by Cucumber's 5000ms default, making the two heartbeat scenarios unable to ever complete. Fixed by an explicit `{ timeout: STEP_TIMEOUT_MS }` scoped to this one step only. |
| T-fiy-02 | Denial of Service | every other step definition in the codebase | medium | accept | Raising the timeout via `setDefaultTimeout()` instead of a per-step option would let every other step, including production-path steps meant to fail fast, run up to the new ceiling before a real stall is reported. Not done: the fix is scoped to this one `When()` registration, verified by a text gate that no `setDefaultTimeout()` call exists in the file. |
| T-fiy-SC | Tampering | npm/pip/cargo installs | high | accept | No package is added, removed, or upgraded. `package.json` and `package-lock.json` are not in `files_modified`, so no legitimacy gate applies. |

</threat_model>

<verification>

Run after task 1 is committed:

1. `npm run typecheck` -- passes, confirming the `{ timeout, code }` argument order matches
   `IDefineStep`'s overload.
2. `npm run build:test` -- passes, confirming the compiled step registers cleanly for Cucumber to
   import.
3. `npx cucumber-js --profile real --dry-run -- features/real-pump/heartbeats.feature` -- resolves
   with no undefined or ambiguous steps reported.
4. `git diff --stat` -- exactly `features/real-pump/support/heartbeatSteps.ts`, and no other file.
5. `grep -c 'setDefaultTimeout' features/real-pump/support/heartbeatSteps.ts` -- `0`.

</verification>

<success_criteria>

- [ ] `the harness waits {int} seconds` is registered with `{ timeout: STEP_TIMEOUT_MS }`, and
      `STEP_TIMEOUT_MS` is a named, commented constant set comfortably above 960 seconds.
- [ ] `npm run typecheck` and `npm run build:test` both pass.
- [ ] `npx cucumber-js --profile real --dry-run -- features/real-pump/heartbeats.feature` reports no
      undefined or ambiguous steps.
- [ ] No `setDefaultTimeout()` call exists anywhere in the file or the wider `features/` tree.
- [ ] `delay(seconds * MILLISECONDS_PER_SECOND)` and every other step definition in the file are
      unchanged.
- [ ] Only `features/real-pump/support/heartbeatSteps.ts` is modified.

</success_criteria>

<output>
Create `.planning/quick/260905-fiy-fix-missing-per-step-timeout-on-the-real/260905-fiy-SUMMARY.md`
when done.
</output>
