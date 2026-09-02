---
gsd_state_version: 1.0
current_phase: 05
current_phase_name: Degraded Operation and Recovery
status: verifying
stopped_at: Completed 05-16-PLAN.md
last_updated: "2026-09-02T22:39:39.593Z"
last_activity: 2026-09-02
last_activity_desc: Phase 05 gap-closure round complete; plan 05-10 closed the phase out
state_head: 2bbf0c4ab30864dd676083e196119e6cc80dc594
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 56
  completed_plans: 53
  percent: 33
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-29)

**Core value:** HomeKit must promptly show trustworthy basement-protection conditions while clearly marking stale or invalid telemetry instead of reporting a false normal state.
**Current focus:** Phase 05 — Degraded Operation and Recovery

## Current Position

Phase: 05 (Degraded Operation and Recovery) — EXECUTING
Plan: 11 of 11
Status: Phase complete — ready for verification
Last activity: 2026-09-02 — Completed quick task 260902-jou: fix accessory registration voided by pre-registration persist

**The plan counter above read `5 of 5` until 2026-09-02 and was wrong.** Phase 05 carries eleven
`05-NN-PLAN.md` files, not five: the first five, and six more planned after `05-VERIFICATION.md`
returned `gaps_found` on 2026-09-02. `state.advance-plan` had nothing to advance into because it
reads a per-phase total that was never widened, so the counter is reconciled here by hand and
`state.update-progress` recomputed the project totals from disk (48 of 48).

Phase 05 has `05-CONTEXT.md`, `05-RESEARCH.md`, `05-PATTERNS.md`, `05-VALIDATION.md`,
`05-VERIFICATION.md`, `05-REVIEW.md` and eleven `05-NN-PLAN.md` files, all committed. Waves are
sequential (01 → 02 → 03 → 04 → 05, then 06 → 07 → 08 → 09 → 11 → 10) because the plans touch
`platform.ts`, `basementGuardian.ts`, `accountRuntime.ts` or `degradedOperation.feature`, which
matches the constraint that executors run on the main working tree rather than in worktrees.

The gap-closure round closed all three critical review findings, the two partial roadmap success
criteria, and all seven plan truths the verifier recorded as not done. The ledger of the seven is in
`05-10-SUMMARY.md`. RES-04 is complete on clause-by-clause evidence; RES-01 and RES-03 stand;
SYNC-03 stays pending with its reason recorded.

**Plan 05-01 opens with a `checkpoint:decision` task and is therefore `autonomous: false`.** It asks
which of two locked decisions governs a REST-only degradation: `D-02` (narrowed) has it withdraw the
`connectivity` scope, so `Basement Guardian Offline` reads `Status Active = false`; `D-04` says a
REST-only degradation does not mark HomeKit at all. The plans implement `D-02` and resolve that way
unattended. The checkpoint names the six artifacts that change under `D-04`.

Phase 04 (Pump Records and Official Controls) is implementation-complete on branch
`features/phase-04-pump-records-and-official-controls`, verified 17/17 must-haves, with six human
items deferred to `/gsd-verify-work 4`. Phase 5 continues on the same branch.

Phase 03 check 1 (flood automation survives a degraded `water` scope) remains OPEN and
gates the `1.0.0` release, not Phase 05.

Phase 01 is COMPLETE as of 2026-08-29. Verification is `passed` at 22/22, with all
three UAT items passed against real hardware.

Phase 02 is COMPLETE as of 2026-08-29. Verification is `passed` at 25/27, with both
backstop-tagged UAT items accepted on structural evidence and no defects found.

Progress: [███░░░░░░░] 2 of 6 phases verified ([███░░░░░░░] 33%) — 48/48 plans complete; Phases 3, 4 and 5 are implementation-complete with human verification deferred. The `37/42` figure this line carried until 2026-09-02 predated phase 05's six gap-closure plans; `state.update-progress` recomputed both counts from disk.

## Performance Metrics

**Velocity:**

- Total plans completed: 6
- Average duration: -
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 02 | 6 | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: Not available

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 03 P01 | 39 min | 3 tasks | 6 files |
| Phase 03 P02 | 42 min | 3 tasks | 7 files |
| Phase 03 P03 | 31 min | 3 tasks | 8 files |
| Phase 03 P04 | 60 min | 1 tasks | 12 files |
| Phase 03 P05 | 60 min | 3 tasks | 7 files |
| Phase 03 P06 | 45 min | 3 tasks | 7 files |
| Phase 03 P07 | 45 min | 2 tasks | 5 files |
| Phase 03 P08 | 38 min | 2 tasks | 4 files |
| Phase 05 P01 | 47min | 3 tasks | 13 files |
| Phase 05 P02 | 14min | 2 tasks | 9 files |
| Phase 05 P03 | 23min | 2 tasks | 12 files |
| Phase 05 P04 | 28min | 2 tasks | 15 files |
| Phase 05 P05 | 20min | 2 tasks | 4 files |
| Phase 05 P06 | 47min | 3 tasks | 9 files |
| Phase 05 P07 | 25min | 3 tasks | 6 files |
| Phase 05 P08 | 78min | 2 tasks | 5 files |
| Phase 05 P09 | 39min | 2 tasks | 8 files |
| Phase 05 P11 | 43min | 3 tasks | 7 files |
| Phase 05 P10 | 46min | 2 tasks | 6 files |
| Phase 05 P12 | ~50 minutes | 3 tasks | 9 files |
| Phase 05 P13 | 26 min | 2 tasks | 6 files |
| Phase 05 P14 | 50 min | 3 tasks | 9 files |
| Phase 05 P15 | 38min | 2 tasks | 7 files |
| Phase 05 P16 | 32 min | 3 tasks | 5 files |

## Accumulated Context

### Decisions

All 40 ADR-locked decisions are preserved in PROJECT.md `<decisions>` blocks. Current planning anchors:

- [Phase 1]: One singular account; bundled Auth0 client ID; typed REST/shadow state; secrets stay in Homebridge-owned storage.
- [Phase 2]: Gemini only in v1; family validation fails closed; `deviceId` preserves physical identity.
- [Phase 2, decided 2026-08-29]: The vendor `deviceId` is treated as non-sensitive and may enter
  accessory context and logs. `D-027` still keeps it out of public artifacts. Rests on
  `<account-id>` being an opaque key, unconfirmed against a real inventory response.

- [Phase 2, decided 2026-08-29]: A valid empty inventory list counts toward confirmed removal,
  keeping `D-029` as locked. Accepted risk: a sustained account glitch could remove every
  accessory, bounded by two confirmations plus a final check.

- [Phase 2, decided 2026-08-29]: Build the full capability-descriptor family registry per `DEV-02`,
  not a minimal interface. Gemini is the only complete implementation this milestone.

- [Phase 2, decided 2026-08-29]: Degraded accessories set `StatusActive` false and leave
  `StatusFault` at `NO_FAULT`. `StatusFault` stays reserved for the five vendor-reported
  `SAFE-04` conditions. Apple Home visibility of that state is a recorded Phase 3 concern.

- [Phase 3]: Truthful standards-first HomeKit mapping with separate actionable fault adapters; the `D-014` preserve-and-mark invariant keeps the last valid value and faults only the narrowest owning scope.
- [Phase 4]: Only self-test and boolean alarm mute are writable; reported state remains authoritative. Validation gates no longer block phase completion; they block only the `1.0.0` release.

- [Phase 4, decided 2026-08-31]: Phase 4 is built and verified against the existing Cucumber
  fake-pump harness, extended for commands. No command is ever sent to a live pump during
  development. `features/support/fakeShadowBroker.ts` is read-only today — it publishes
  `get/accepted`, `get/rejected` and `update/accepted` and handles no desired state — so the
  phase adds ~~`update/rejected`, handling of the plugin's `{"desiredData": ...}` publish, and~~
  the five `CTRL-05` outcomes: accepted, rejected, timed out, late, and externally initiated.

  **Struck text superseded on 2026-09-01** — see the narrowing ruling below. The plugin never
  sends a shadow update and never subscribes to `update/rejected`, so neither struck clause has a
  real counterpart. Everything else in this entry still stands.

  The fake must be built from the measured wire shapes in `.planning/intel/constraints.md`,
  never from invention. A fake we author answers our own design, so anything not grounded in a
  real observation is an assumption wearing a passing test.

  Consequence, and the reason this is written down: **self-test has real hardware evidence
  behind its wire shape; alarm mute has none.** Nobody has observed a real Gemini's
  acknowledgement, state change, duration, latency, or failure behaviour for mute — which is
  what `G-001` exists for. Mute constants therefore ship named `PROVISIONAL_`, exactly as the
  Phase 3 water ladder did under `G-002`, and `G-001` stays open and blocks `1.0.0`. Phase 4
  completion is not blocked by it.

- [Phase 4, decided 2026-09-01 by the maintainer]: **All six open decisions were ruled on, every
  one accepting the research recommendation.** They are recorded in
  `04-CONTEXT.md`, which is the binding text and the file the planner reads; this entry is the
  mirror. `04-VALIDATION.md` was updated to match.

  1. **`D-15` narrowed** (`04-CONTEXT.md` D-15). The fake shadow broker gains **no**
     `update/rejected` leaf and handles no `{"desiredData": ...}` publish. The plugin's only MQTT
     publish is a shadow `get` with an empty payload (`src/cloud/shadow.ts:345`); it does not
     subscribe to that leaf (`:151-158`); the `desiredData` body is the REST body
     (`src/cloud/api.ts:169`). The broker instead gains the fake pump's reaction — an accepted
     command flips `test_running` and reports on `update/accepted`. Rejected, timed out and late
     are driven from `fakeRestApi`, where the wire shapes are measured.
  2. **One test-only HAP import allowed** (new `D-17`). `test/accessories/hapWriteFidelity.test.ts`
     alone may import `@homebridge/hap-nodejs`, running four write cases against real HAP and the
     fake and asserting they agree. First test-scope exception to the rule, which is scoped to
     runtime in `CLAUDE.md` and `src/accessories/customCharacteristics.ts:21-25`. Without it the
     five `CTRL-05` scenarios validate semantics the phase invented for its own fake.
  3. **Clearing push accepted** (`D-04`, with `D-10`'s prose corrected). After a refusal the binder
     pushes the reported `On` back through the injected `Timers` port at delay 0, as a
     **macrotask** — a microtask runs before HAP assigns the status. Without it a refused press
     leaves the Switch answering an error to every read until the next poll, up to ~15 minutes
     (`Characteristic.js:1729`). The zero-timer assertion at
     `test/accessories/basementGuardian.test.ts:1482-1517` is scoped to `update()` and still holds,
     but the accessories tier is no longer timer-free as a whole. A real-home check rides along
     with `D-03`: press a refused control and watch the tile.
  4. **`uint32` added** (`D-12`). `define()` allowed only `bool | uint8 | string`
     (`customCharacteristics.ts:91`). `uint8` caps at 255 and HAP **clamps** rather than rejects, so
     an activation count would silently stop advancing and keep reading as fact.
  5. **Timestamp unit reconciled** (`D-11`). Device sends Unix seconds
     (`constraints.md:231`, `:241`); `lastActivationAt` documents local milliseconds
     (`accessoryContext.ts:31-32`). Convert at the record boundary and reword the docblock.
     `constraints.md:503` forbids *comparing* device and local time; a unit conversion compares
     nothing.
  6. **Pending window is per capability per accessory** (`D-05`, `D-06`), so one accessory's
     pending self-test cannot block another's mute.

  Planning is unblocked. Do not re-run research — `04-RESEARCH.md` is complete and traced to
  quoted source lines.

- [Phase 4, decided 2026-09-01 by the maintainer, mid-execution]: Two rulings taken while Phase 4
  was executing, both reversing what a subagent had done or a plan had specified.

  1. **The vendor `deviceId` stays in control log lines.** The 04-02 executor removed it on its own
     reading of the privacy rule, which reversed the ratified 2026-08-29 decision above and left
     `platform.ts:82` and `reconciliation.ts:91` logging it inconsistently. Restored in `263cae0`,
     and extended to all three lines the binder writes. Without it a multi-pump account cannot tell
     which pump refused a control or which never confirmed a request. The privacy test now asserts
     the identifier is PRESENT and that no token or base URL appears; removing it fails by name.

  2. **The first device timestamp seeds the watermark instead of being counted.** On a fresh install
     the recovery rule read an absent watermark as "anything reported is newer", so the first
     snapshot carrying a `backup_pump_timestamp` recovered an activation dated before the
     observation start that same snapshot seeded. `CTRL-01` says the record never claims a lifetime
     total, and a count an owner reads must describe runs the plugin watched. Fixed in `69c203d`.
     The plan had specified the counting behaviour in its behaviour list, truth statements and an
     acceptance criterion, so this is a deliberate deviation from a checked plan, recorded in
     `04-03-SUMMARY.md`.

- [Phase 6]: `1.0.0` remains blocked by G-001, G-002, G-003, G-004, automated checks, read-only real-pump tests, and real-home validation.
- [Cross-phase tests]: Unit tests mirror `src/` under `test/`. Cucumber fake-pump tests run in CI. Real-pump tests are opt-in and read-only.
- [Cross-phase architecture]: Manual constructor dependency injection is preferred for plugin-owned services. This preference is not ADR-locked and can change during phase discussion.
- [Phase 03]: The Cucumber harness has one hand-built HAP stand-in, features/support/fakeHap.ts, whose Service and Characteristic are constructible base classes. — Every module this phase adds declares its HomeKit types by subclassing the injected api.hap namespace, so a stand-in of identifier constants cannot exercise any of them.
- [Phase 03]: FakeHomebridgeApi exposes a hap member typed as the stand-in namespace, beside the deliberately widened api member. — api is widened to Homebridge own API type, which types hap as the real HAP-NodeJS namespace, so a step reaching a service class through api.hap would hand a real HAP class to a stand-in accessory.
- [Phase 03]: Phase 3: the provisional water-level ladder and flood threshold live in src/device/waterLevel.ts alone, named PROVISIONAL_*, so closing G-002 is one reviewable edit.
- [Phase 03]: Phase 3: FieldViolation carries the TrustScope its field owns, and decode() omits only the scopes that did not validate. undefined means the scope did not validate, never that it reported nothing.

- [Phase 03, corrected 2026-08-30]: **A RED commit CAN pass the pre-commit hooks.**
  `.pre-commit-config.yaml` runs exactly four local hooks — `npm lint`, `npm format:check`,
  `npm typecheck`, `npm fallow`. The test suite is **not** among them, so a commit holding failing
  (but compiling) tests passes. Plans 03-04 and 03-05 each recorded the opposite as fact and used it
  to justify combining RED and GREEN into one commit; each had inherited the claim from the prior
  summary rather than reading the config. Plan 03-06 checked and produced real `test(...)` →
  `feat(...)` pairs. Any remaining plan should do the same; a RED commit only fails when its tests
  reference a module that does not exist yet, which is a compile error, not a test failure.
- [Phase 03]: Phase 3: the six Gemini group interfaces were not declared. The family-neutral groups already carry Gemini's exact members, so GeminiDomainState aliases ScopedDomainState; empty extending interfaces fail lint and re-declaration would duplicate them.
- [Phase 03]: Phase 3: a defensive guard behind a validation gate is covered by constructing the broken contract it names, never by a coverage exception or a silent default.
- [Phase 03]: D-12 confirmed: a HomeKit service subtype is its ServiceKind slug verbatim, and custom service and characteristic UUIDs are hard-coded random v4 literals outside Apple's base namespace — A seed-derived identifier would silently orphan every custom service on every installed accessory if the seed were later edited, with a green test suite. A literal cannot drift.
- [Phase 03]: The accessory logs its degradation warning on any transition into a degraded state, not only when no adapter resolves — A per-field validation failure now narrows distrust to one scope, but the owner still needs the diagnostic; scoping the log to the unresolved-family branch would have removed a passing discovery scenario's assertion.
- [Phase 03]: Both battery services publish under the single backup-battery kind and subtype, named Backup Battery and Backup Battery Facts
- [Phase 03]: A row's trust gate is applied per decoded scope group rather than per row, so Sump Pit Level keeps publishing water while the fault scope is untrusted
- [Phase 03]: A merged backup-pump verdict is withheld unless both raw causes decoded, rather than defaulting the missing one to false
- [Phase 03]: hap.Service.Battery is used; the Service.BatteryService alias does not exist on the Homebridge 2.x HAP line
- [Phase 03]: Both alarm characteristics activate at 1 and rest at 0, so one pair of sensor steps covers the leak sensor and the seven contact adapters
- [Phase 03]: The static gate reads an import rather than a mention, so the gate's own prose naming the forbidden modules does not report itself
- [Phase 03]: Every commit in this plan is typed test, because it ships no production code and a feat commit would claim a feature that does not exist
- [Phase 03]: src/device/health.ts left .fallowrc.json ignoreFindings after measurement, not because DeviceHealth gained a production consumer — production: false makes fallow count test files as consumers, so DeviceHealth's test-only importer keeps the gate green. Three of the other four declarations gained real production consumers this phase.
- [Phase 03]: An exemption removal is proven by planting a dead export in the newly checked module, because an unlisted module and a clean module produce the identical green
- [Phase 03]: The src/device/events.ts exemption stays although it no longer suppresses a finding; every declaration in the module still has no production consumer
- [Phase 05]: 05-01: a REST-only degradation withdraws connectivity and only connectivity (D-02 over D-04)
- [Phase 05]: 05-01: the trust decision is a second projection; monitoringPathNow() stays byte-identical
- [Phase 05]: 05-01: shadow silence is measured from arrival at onReportedPatch, seeded at construction, never from the socket flag or receivedAt
- [Phase 05]: The Cucumber harness carries the pushed flag through the accessory cache rather than forcing it true on restore, so a value nothing wrote still reads as unwritten after a restart
- [Phase 05]: The restart marking pass is one exported function; deleting the platform call site leaves every scenario green, so test/platform.test.ts is the only gate on that half
- [Phase 05]: RES-04 stays Pending: plans 05-03, 05-04 and 05-05 each still owe part of it, and requirement rows reconcile at phase close-out
- [Phase 05]: 05-03: the transport refusal is evaluated before the no-fresh-state one, so a user with no route is told that rather than told a reading is stale (PA-05, D-07)
- [Phase 05]: 05-03: markMonitoring stores unconditionally AND compares every MonitoringTrust member; a two-field comparison swallows the runtime's first healthy push and refuses every press for the life of the process
- [Phase 05]: 05-03: the accessory's stored trust starts with commandTransportReady false while both degradation fields start false, because a safety fact defaults to the refusing value
- [Phase 05]: Phase 5 plan 04: the HAP stand-in modelled the inverse of the real updateValue on the push-an-error path; corrected and pinned by four fidelity cases watched to fail against it.
- [Phase 05]: Phase 5 plan 04: the Phase 3 gate forbidding HapStatusError under src/accessories/ was narrowed to a counted, located exception rather than relaxed; serviceCatalogue.ts may name it exactly once, inside publishPersistentFailure.
- [Phase 05]: Phase 5 plan 04: the credential scenario needed a foreign cached token, or the restart reuses the cached one and never meets the refusal it claims to assert.
- [Phase 05]: The config key-set mutation split 61 pass to 1 fail: every fixture-derived expectation widened silently, so the inline literal is the whole of the evidence
- [Phase 05]: RES-01 and RES-03 were left Complete unchanged; their contradiction was resolved by this phase shipping the owed halves, not by an edit. Only RES-04 moved to Complete
- [Phase 05]: The shadow-silence threshold is deliberately not published in the README; the reader needs the state, not the constant
- [Phase 05]: D-014 was read, not amended: withholding is how retention is achieved when the arriving value is bad, and against a family-valid value from a working transport it retains nothing
- [Phase 05]: The exempt set holds unreachable alone; stale was excluded because nothing in src/ assigns it
- [Phase 05]: The write gate keeps reading the withdrawn scopes directly, so a press is still refused while values flow to the tile
- [Phase 05]: Phase 5 plan 07: the halt flag keeps one assignment site — it moved into haltOnTerminalAuthFailure, which the launch, the poll loop and the rotation loop all route through, so no second flag was raised beside it.
- [Phase 05]: Phase 5 plan 07: waitWhileRunning reads the halt flag before and after every loop wait; one read alone either lets a sleeping loop wake and call once more, or arms a timer the halting loop will never use.
- [Phase 05]: Phase 5 plan 07: stop() pushes the final monitoring trust directly rather than through reportMonitoringHealth, and moves commandTransportReady alone, so a shutdown marks no scope and writes no live-reporting observation.
- [Phase 05]: The arrival callback reports the monitoring trust, guarded by the silence state last reported, so a returning live path is vouched for at the message and once per recovery (CR-02, D-11)
- [Phase 05]: The recovery scenario parks device polling at the vendor instead of lengthening the poll interval: a long interval removes the defect's cover and the test's setup together
- [Phase 05]: WR-02 is inside RES-04: the clause opens 'After a failed restart', so a press on a restored control is refused by name rather than silently accepted. This reverses 05-04's PA-08 deferral.
- [Phase 05]: The restored-control refusal reuses the transport rule's status (-70412) and its exact cause text through one shared constant, so one condition answers one status with one wording (D-08).
- [Phase 05]: Measured: three near-copies of the accessory walk do NOT fail this repository's duplication gate. The shared walk stands on IN-01's drift argument, not on the gate.
- [Phase 05]: Shadow silence releases the shadow's ownership of telemetry at the head of applyDevices, so the poll that notices the silence is the one whose flood reaches HomeKit (05-CONTEXT D-13)
- [Phase 05]: The Cucumber tier cannot detect a one-poll delay, so the timing property is asserted in the unit suite and the gap is recorded rather than papered over
- [Phase 05]: 05-11's prescribed scenario repair was wrong twice over; the working repair fixes the second heartbeat so it is identical from the store's point of view again
- [Phase 05]: RES-04 moved to complete on one named passing assertion per clause, not on schedule; the assertion is recorded in the row itself
- [Phase 05]: SYNC-03 stays pending because its row sits in a Phase 1 block where no requirement is marked complete; closing one row of that block on Phase 5 evidence would misreport which phase delivered it
- [Phase 05]: The seven plan truths 05-VERIFICATION.md found false are recorded once in 05-10-SUMMARY.md rather than corrected in the plans that got them wrong, because those plans are the evidence that the gap-closure round happened
- [Phase 05]: The first-round Per-Task Verification Map was left untouched: three of its rows are the ones the verifier found green but blind, so marking them shipped would assert the opposite of what was measured
- [Phase 05]: A refused credential closes the live connection at the halt, rather than guarding the arrival callback or re-applying the marking; that removes the cause instead of the symptom
- [Phase 05]: The connect path reads one predicate, hasFinished(), that answers for both a shutdown and a halt, so the halt is a state rather than an act performed once
- [Phase 05]: RES-04 clause 4 re-cited to the persistence scenario after npm run check came back green; the CHANGELOG credential entry needed no change
- [Phase 05]: accessoryNamed stays module-local: fallow dead-code fails on an export with no consumer outside its module
- [Phase 05]: The polled half of a two-pump scenario is asserted before any heartbeat, because a live document takes ownership and a poll body is then discarded
- [Phase 05]: Each two-pump assertion pair states the moved side before the not-moved side, so the delivery has landed before the second read
- [Phase 05]: Shadow silence is measured per device from that device's own last message, seeded at discovery admission rather than at runtime construction — One account-wide arrival stamp is re-armed by whichever pump spoke last, so a permanently quiet controller on a two-pump account never trips shadowSilent, is never released, and has every poll body discarded
- [Phase 05]: releaseShadowSource takes the deviceId it releases; a disconnection releases the fleet as an explicit loop — An account-wide release strips ownership from healthy devices and has every poll of a neighbour's silence overwrite the fresher readings their own live path just delivered (WR-05)
- [Phase 05]: Shadow-silence marking stays account-wide: any silent device makes every accessory stop vouching — No requirement asks for per-device marking, over-marking cannot produce a false normal, and a per-device MonitoringTrust would be a second design change riding on a blocker fix
- [Phase 05]: Telemetry ownership reads the telemetry section alone; the wider observation test stays wide for the receipt time, so a metadata-only report may order but may not own (CR-03)
- [Phase 05]: The suite gained its first step that reads snapshot.metadata, so a scenario publishing a shadow document proves the document arrived instead of assuming it
- [Phase 05]: Guarded the republish callback the control binder holds, not clearRefusal: the request-expiry path calls the callback directly, so guarding the function above would close two of three refusal paths while reading as three
- [Phase 05]: Refused the review's option of teaching publishRow to push the persistent failure; it would add a second production call site of the act 03-CONTEXT D-05 forbids. The count is still one

### Pending Todos

4 captured todos in `.planning/todos/pending/` — `/gsd-capture --list` to review:

- [major, docs] Document which services Apple Home renders. The README implies `Sump Pit
  Level` and the pump, mains-power, and battery-facts services are visible in a user's home.
  They are vendor-defined services, so Apple Home draws no tile for any of them. Confirmed
  against a real Homebridge instance on 2026-08-30.
- [minor, api] Define the user-agent string and additional headers for Auth0, vendor REST,
  and, if necessary, the MQTT WebSocket handshake. Use `homebridge-adt-pulse` as comparative
  research without assuming its Chrome browser impersonation fits this API integration.
- [major, general] Record the G-002 natural water-level evidence. A real unforced `1` to `3`
  transition was observed on live hardware on 2026-08-31 and mapped 20% to 40%. It exists only
  in a session transcript. Codes `0`, `7`, `15`, `31` and the flood threshold stay unvalidated.
- [major, docs] State the harness mDNS prerequisite in `dev/README.md`. Pairing needs the host
  to carry multicast; `floyd` sees 0 responders where the LAN shows 25, so pairing there is
  impossible. Add a fail-fast precheck, the firewall ports, and the tunnel form.

Carried inline below (not files):

- Backup-battery fault adapter: RESOLVED in the Phase 3 discussion (2026-08-30) against a sixth
  adapter. `D-008` stays locked at five; `battery_health == 32` surfaces through the standard
  Battery service's `StatusLowBattery`. Remove the open proposal from PROJECT.md when Phase 3
  completes.
- `package.json` keeps `private: true` as an accidental-publish guard. Remove it in Phase 6 when the first `0.x` prerelease goes to the npm `next` tag under `D-026`. The version now reads `0.1.0`.
- `package.json` declares `license: "Apache-2.0"`, which contradicts the `D-035` `SEE LICENSE IN LICENSE` metadata rule. Resolve in Phase 6.
- `homebridge-lib` is still a runtime dependency and `config.schema.json` still carries `strictValidation: false`. Resolve the schema flag in Phase 1 and the dependency removal in Phase 6.

### Blockers/Concerns

**TOOLING HAZARD — `gsd-tools query commit` can report success while committing nothing.**
Observed three times on 2026-08-31/09-01 (orchestrator twice, research subagent once). The
handler commits with a pathspec — `git commit -m <msg> -- <paths>` at
`.claude/gsd-core/bin/lib/commands.cjs:1831` — which breaks against this repository's
file-modifying pre-commit hooks. Two failure shapes were seen: an **empty commit returned as
`{"committed": true, "hash": ...}`** (`70b99e1`, `02bdbc9` are both empty), and a spurious
TruffleHog `files were modified by this hook` failure whose own scan reported
`verified_secrets: 0, unverified_secrets: 0`.

The pathspec form is not broken on its own — reproduced against a scratch repository with a
trivial hook and both forms committed correctly, so the trigger needs this repo's real
hook set. Which hook has not been isolated.

**Workaround, proven four times:** `git add <paths>` then a plain `git commit -m <msg>` with
no pathspec. Never rely on the handler's return value — verify with
`git show --name-only --format="" HEAD` and re-commit if the list is empty.

**This matters most for `/gsd-execute-phase`,** whose executors commit through the same
handler once per task. An empty commit is silent: the work stays in the working tree and
looks committed.

---

The remainder are `1.0.0` release gates, not phase blockers. Each phase delivers its implementation and marks any unvalidated constant provisional.

- G-001: Validate Gemini alarm-mute acknowledgement, state changes, duration, latency, and failure behavior before the `1.0.0` release.
- G-002: Validate all Gemini water-level codes and the flood threshold during a natural cycle.
- G-003: Validate both pump Contact Sensors in an eligible real Apple home before release.
- G-004: Validate `Sump Pit Flood` Leak Sensor notification delivery in a real eligible Apple home with a current home hub and the current Home architecture, and confirm that no documentation claims a Critical Alerts guarantee.

Carried forward from Phase 2:

- [Phase 2 → Phase 3]: RESOLVED in the Phase 3 discussion (2026-08-30). Degraded state is marked
  with `StatusActive = false` plus README guidance, with no new adapter and no ADR revision
  (`03-CONTEXT.md` D-05). Apple Home shows it under accessory Details as "Status Active — No".

Opened by the Phase 3 discussion, resolved by Phase 3 research:

- [Phase 3]: The claim that `StatusActive = false` drops a sensor out of Apple Home automations was
  REFUTED at its source (2026-08-30). The cited issue is a 2017 thread on a different subject, and
  its one relevant comment contradicts the claim. `D-05` stands. Residual: nobody could confirm
  Apple Home's behavior on current iOS, so a real-home check rides along with `G-003`/`G-004` —
  build an automation on `Sump Pit Flood`, force a degraded scope, confirm it still fires. Only a
  positive finding there reopens `D-05`.
- Phase 3: test/accessories/basementGuardian.test.ts still carries a second hand-built HAP stand-in. Migrating it now would weaken one assertion from undefined to the empty string and drop a branch the pair 100% coverage needs. Migrate when 03-04 or 03-06 reworks its AccessoryInformation assertions; new accessories unit tests must import features/support/fakeHap.ts rather than grow their own.
- A shadow that goes silent never releases the telemetry watermark (src/device/state.ts pollTelemetry), so no REST poll refreshes telemetry for a device whose live path spoke and then stopped; releasing it on silence changes D-15/SYNC-03 and needs a decision

## Deferred Verification

| Phase | State | Resume |
|-------|-------|--------|
| 3 | verification_deferred_human (1 of 3 checks open) | /gsd-verify-work 3 |
| 4 | verification_deferred_human (6 human items, 17/17 must-haves verified) | /gsd-verify-work 4 |

Phase 4 is implementation-complete. `04-VERIFICATION.md` verified 17/17 must-haves **by executing
the shipped code** — 100 behavioural probe checks against the compiled modules, a loopback HTTP
server driving the real command path, a probe against the real pinned HAP, and six live mutations of
shipped source proving the load-bearing assertions are not vacuous. Deferred by the maintainer on
2026-09-01 so Phase 5 could start; the six items are enumerated in `04-UAT.md`.

The load-bearing one is item 1: whether a `PumpService` cached BEFORE this release adopts the four
new record characteristics on upgrade. Nothing in this phase has met a real Homebridge cache — the
harness restores context through a JSON round trip but restores no services, so a real restored
Service carrying cached characteristics is a shape no test has produced. Items 2-4 join Phase 3's
open flood-automation check and the `G-003`/`G-004` gates in one real-paired-home session. Item 5 is
a desk task. Item 6 is `G-001`, which blocks `1.0.0` only.

**Carried warning from `04-VERIFICATION.md`:** mutating away the pending-window withholding kills 2
unit cases but leaves all 78 Cucumber scenarios green. The behaviour is real and the accessory probe
catches it, but the end-to-end tier is blind to it. Phase 5 touches the same projection path.

Phase 3's row previously read "2 of 3 checks open"; that label was stale — checks 2 and 3 closed on
2026-08-31 and only the flood-automation check remains. Corrected here.

Phase 3 is implementation-complete and gate-complete. `03-VERIFICATION.md` verified all six success
criteria and 6/6 must-haves **by executing the shipped code** — a 36-check behavioural probe against
the real accessory factory, registry and Gemini adapter; a 7-check backstop probe; and two live
mutation tests confirming the static import gate and the suppression fix are not vacuous. No gaps,
no Phase 5 over-reach, 109 plan truths and 30 prohibitions hold.

Checks 2 and 3 are CLOSED as of 2026-08-31, both verified against a real paired Apple Home. One
human-verification item remains — check 1, the load-bearing one — still scheduled to ride along
with the `G-003` / `G-004` session before `1.0.0`:

1. **A flood automation survives a degraded `water` scope.** Build an automation on the
   `Sump Pit Flood` Leak Sensor, force a degraded scope (send an out-of-domain `water_level`),
   confirm the automation still exists and still fires. **A failure here reopens `03-CONTEXT.md`
   D-05**, which the whole degradation design rests on — this is the load-bearing one.
2. ~~**Apple Home renders `StatusActive = false`**~~ — **CLOSED 2026-08-31.** Confirmed in a real
   paired Apple Home: a degraded `water` scope drew a `Status Active` row reading `No` under the
   sensor's Details, the tile stayed present rather than hidden, and recovery flipped the same row
   back. `README.md:80` is accurate as written. Preserve-and-mark held throughout — the retained
   `Leak Detected` value was never blanked.
3. ~~**The `ignoredFaults` array renders acceptably in the Homebridge Plugin Settings GUI**~~ —
   **CLOSED 2026-08-31.** A human drove the generated form under `strictValidation: true`. Ticking
   one box wrote `["backup-pump-activated"]` as a 1-element array and dropped the Gemini service
   count 15 to 14, removing exactly the named sensor; unticking it dropped the key entirely and
   restored all 15 with 8 of 8 contact sensors. The form was found rendering raw slugs, which the
   `260831-c7f`, `260831-dlv` and `c268b34` changes corrected to seven alphabetised, human-named
   checkboxes with no `None` option and duplicates structurally impossible.

### Quick Tasks Completed

| # | Description | Date | Commit | Status | Directory |
|---|-------------|------|--------|--------|-----------|
| 260902-jou | Fix accessory registration being voided by pre-registration persist | 2026-09-02 | 67a3ee5 |  | [260902-jou-fix-accessory-registration-voided-by-pre](./quick/260902-jou-fix-accessory-registration-voided-by-pre/) |
| 260831-knc | Name every published service with ConfiguredName so Apple Home shows it | 2026-08-31 | 39560ac |  | [260831-knc-name-every-published-service-with-config](./quick/260831-knc-name-every-published-service-with-config/) |
| 260831-dlv | Render ignoredFaults as labelled checkboxes in the settings form | 2026-08-31 | cdb183d |  | [260831-dlv-render-ignoredfaults-as-labelled-checkbo](./quick/260831-dlv-render-ignoredfaults-as-labelled-checkbo/) |
| 260831-c7f | Render ignoredFaults options as human-readable names in the plugin settings GUI | 2026-08-31 | 645208b |  | [260831-c7f-render-ignoredfaults-options-as-human-re](./quick/260831-c7f-render-ignoredfaults-options-as-human-re/) |
| 260829-idd | Correct vendor API intel to the measured wire shape | 2026-08-29 | cd7c651 |  | [260829-idd-correct-vendor-api-intel-to-the-measured](./quick/260829-idd-correct-vendor-api-intel-to-the-measured/) |
| 260829-gx6 | Fix vendor REST wire-shape defects in device discovery | 2026-08-29 | 6826afd | Verified | [260829-gx6-fix-vendor-rest-wire-shape-defects-in-de](./quick/260829-gx6-fix-vendor-rest-wire-shape-defects-in-de/) |
| 260828-bq0 | Refine planning artifacts against ingested intel | 2026-08-28 | 76b3edd |  | [260828-bq0-refine-planning-artifacts-against-ingest](./quick/260828-bq0-refine-planning-artifacts-against-ingest/) |
| 2 | Set the package version to 0.1.0 | 2026-08-28 | 4e46bd1 |  | — |
| 260828-jaf | Record constructor dependency injection as a revisitable preference | 2026-08-28 | b0543e2 |  | [260828-jaf-record-constructor-dependency-injection-](./quick/260828-jaf-record-constructor-dependency-injection-/) |
| 260828-jkw | Add agent reference documentation links | 2026-08-28 | 91c21a1 |  | [260828-jkw-add-agent-reference-documentation-links](./quick/260828-jkw-add-agent-reference-documentation-links/) |
| 9 | Sort the ignoredFaults options alphabetically by their label | 2026-08-31 | c268b34 | — | — |

## Deferred Items

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| Device family | HALO adapter implementation | Deferred | Initialization | v2 |
| Setup | Custom setup interface | Deferred | Initialization | v2 |

## Session Continuity

Last session: 2026-09-02T22:39:37.178Z
Stopped at: Completed 05-16-PLAN.md
Resume file: None

**Read the resume file before doing anything.** It carries one operational fact that costs an hour
to rediscover: executor dispatch is blocked by an isolation guard, and the obvious fix is dangerous.
`dispatch-isolation` reports the host *capability* (`harness-worktree`) while `worktree base-check`
returns `shouldDegrade: true`, because a harness worktree would fork from `origin/HEAD` — which is
`origin/main`, where Phase 3 does not exist. Force the sentinel to `none` before every dispatch, and
verify by reading `.gsd/dispatch-isolation-sentinel.json` rather than re-querying, because a bare
query re-persists the capability and silently undoes the force.

Phase 5 is planned. `05-CONTEXT.md` (12 decisions), `05-RESEARCH.md`, `05-PATTERNS.md`,
`05-VALIDATION.md` and five `05-NN-PLAN.md` files are committed. Do not re-run discuss, research or
plan.

**Plan 05-01 starts with a `checkpoint:decision` and is `autonomous: false`.** Two locked decisions
disagree about one scope: `D-02` (narrowed) has a REST-only degradation additionally withdraw
`connectivity`, so `Basement Guardian Offline` reads `Status Active = false`; `D-04` says a REST-only
degradation does not mark HomeKit. The plans implement `D-02` and an unattended run resolves that
way. The checkpoint lists the six artifacts that change under `D-04`, and `05-VALIDATION.md` names
the two rows that revert with them.

**Two findings from planning that no earlier document carries.** `features/support/fakeHap.ts`
stores an error as the characteristic's value and clears the status, while the pinned real
`Characteristic.js` short-circuits on an `Error` and returns before touching `value` — the inverse.
Nothing in the suite has ever pushed an error, so no assertion noticed. Fixing the stand-in is plan
05-04's first task. Separately, on a halted restart a press on a restored switch silently appears to
succeed, because no binder is ever attached; that gap predates this phase and is recorded, not
closed.

`D-12` remains the item a reader will under-weight: the Cucumber harness drops services on restart,
which would make every `D-06` scenario pass vacuously. Plan 05-02 restores services, their last
values and the `pushed` flag, and re-runs all 78 existing scenarios in the same task.

**Pushed through `c63469a`.** Everything after it — the Phase 5 context, research, patterns,
validation and plans — is unpushed until someone pushes it.
