---
phase: "04"
slug: "pump-records-and-official-controls"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-01"
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `04-RESEARCH.md` `## Validation Architecture`. Task IDs fill in once plans exist.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` (Node 22.x / 24.x) for unit; `@cucumber/cucumber@^13.2.1` for the fake-pump suite |
| **Config file** | `cucumber.json` (profiles `default` and `real`); `tsconfig.test.json` for the test build |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm test` (= `test:unit` then `test:cucumber`) |
| **Coverage gate** | `npm run test:coverage:all` — 100% lines, branches, functions over `dist-test/src/**/*.js` |
| **Estimated runtime** | unit seconds; full suite ~1–2 minutes |

**The coverage gate does not run in CI.** `.github/workflows/build.yml` runs `lint`,
`format:check`, `typecheck`, `fallow`, `npm test`, and `build` — there is no coverage step.
The 100% gate is local discipline only. A plan that relies on CI to catch an uncovered branch
will not be caught. Every task that adds a branch must name the test covering it, and the
phase gate must run `npm run test:coverage:all` explicitly.

---

## Sampling Rate

- **After every task commit:** `npm run test:unit`, plus `pre-commit run --files <changed files>` per CLAUDE.md.
- **After every plan wave:** `npm test` (unit + cucumber).
- **Before `/gsd-verify-work`:** `npm run check` **and** `npm run test:coverage:all` green.
- **Max feedback latency:** unit suite, single-digit seconds.

---

## Per-Task Verification Map

Task and plan columns fill in when plans are authored. Requirement rows are fixed now so no
requirement can be dropped during planning.

| Task ID | Plan | Wave | Requirement | Behavior | Test Type | Automated Command | File Exists |
|---------|------|------|-------------|----------|-----------|-------------------|-------------|
| TBD | TBD | TBD | CTRL-01 | Epoch seeded on first observation; count advances on a watched rising edge only | unit | `node --test dist-test/test/accessories/pumpRecords.test.js` | ❌ W0 |
| TBD | TBD | TBD | CTRL-01 | Record survives restart — a rebuilt accessory over the same context resumes epoch and count | unit | `node --test dist-test/test/accessories/pumpRecords.test.js` | ❌ W0 |
| TBD | TBD | TBD | CTRL-01 | `persist()` called on a counted edge, not called on an unchanged update (D-10) | unit | `node --test dist-test/test/accessories/pumpRecords.test.js` | ❌ W0 |
| TBD | TBD | TBD | CTRL-01 | A run already true at the first snapshot is not counted (D-09) | unit | `node --test dist-test/test/accessories/pumpRecords.test.js` | ❌ W0 |
| TBD | TBD | TBD | CTRL-01 | A newer `backup_pump_timestamp` recovers exactly one activation; a repeated identical one recovers none (D-11) | unit | `node --test dist-test/test/accessories/pumpRecords.test.js` | ❌ W0 |
| TBD | TBD | TBD | CTRL-01 | The record characteristics publish on `PumpService` under an unchanged subtype | unit | `node --test dist-test/test/accessories/serviceCatalogue.test.js` | ✅ extend |
| TBD | TBD | TBD | CTRL-01 | The record survives a full plugin restart end to end | cucumber | `npx cucumber-js --name "observation record"` | ❌ W0 |
| TBD | TBD | TBD | CTRL-02 | README states Activity History is controller-owned, not safety delivery, no configurable retention, not backfill | manual-only | *(documentation; verified by review)* | n/a |
| TBD | TBD | TBD | CTRL-03 | `On` follows reported `test_running`, including a test started outside HomeKit | cucumber | `npx cucumber-js --name "self-test"` | ❌ W0 |
| TBD | TBD | TBD | CTRL-03 | An off write during a running test throws `-70412` and sends no request | unit + cucumber | `node --test dist-test/test/accessories/controls.test.js` | ❌ W0 |
| TBD | TBD | TBD | CTRL-03 | A duplicate on write throws `-70403` and sends no request | unit + cucumber | `node --test dist-test/test/accessories/controls.test.js` | ❌ W0 |
| TBD | TBD | TBD | CTRL-03 | A test is permitted while equipment faults are present | unit | `node --test dist-test/test/accessories/controls.test.js` | ❌ W0 |
| TBD | TBD | TBD | CTRL-04 | `On` follows reported `alarm_audio_muted`; only `{"alarm_audio_muted": true}` is ever sent | unit + cucumber | `node --test dist-test/test/accessories/controls.test.js` | ❌ W0 |
| TBD | TBD | TBD | CTRL-04 | An off write while mute is active throws `-70412` and sends no request | unit | `node --test dist-test/test/accessories/controls.test.js` | ❌ W0 |
| TBD | TBD | TBD | CTRL-04 | Every mute constant is named `PROVISIONAL_` and lives in one module | unit | `node --test dist-test/test/accessories/controls.test.js` | ❌ W0 |
| TBD | TBD | TBD | CTRL-05 | Accepted: HAP retains the requested value while pending; no push occurs | unit | `node --test dist-test/test/accessories/controls.test.js` | ❌ W0 |
| TBD | TBD | TBD | CTRL-05 | Rejected (non-2xx) and rejected (`success:false`): both throw `-70402` | unit + cucumber | `node --test dist-test/test/accessories/controls.test.js` | ❌ W0 |
| TBD | TBD | TBD | CTRL-05 | Timed out: throws `-70408` after the 2.5s deadline and issues exactly one request | cucumber | `npx cucumber-js --name "vendor never answers"` | ❌ W0 |
| TBD | TBD | TBD | CTRL-05 | Late: window closes, one warning logged, Switch follows reported state, late report then followed | unit + cucumber | `node --test dist-test/test/accessories/controls.test.js` | ❌ W0 |
| TBD | TBD | TBD | CTRL-05 | Externally initiated: the Switch follows with no pending state and no `PUT` | cucumber | `npx cucumber-js --name "started outside HomeKit"` | ❌ W0 |
| TBD | TBD | TBD | CTRL-05 | Requested state never reaches canonical safety state | cucumber | `npx cucumber-js --name "requested"` | ✅ extend |
| TBD | TBD | TBD | CTRL-05 | After any rejection the characteristic's stored status returns to `0` | unit | `node --test dist-test/test/accessories/controls.test.js` | ❌ W0 |
| TBD | TBD | TBD | — | `TRUST_SCOPES` lists every `TrustScope` member | unit | `node --test dist-test/test/accessories/basementGuardian.test.js` | ✅ extend |
| TBD | TBD | TBD | — | The fake HAP's write path agrees with the real pinned HAP | unit | `node --test dist-test/test/accessories/hapWriteFidelity.test.js` | ❌ W0 — **conditional, see below** |

*Status legend: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky. Status column added once tasks exist.*

---

## Wave 0 Requirements

- [ ] `test/accessories/pumpRecords.test.ts` — CTRL-01
- [ ] `test/accessories/controls.test.ts` — CTRL-03, CTRL-04, CTRL-05
- [ ] `test/runtime/accessoryStore.test.ts` — the D-08 persist port
- [ ] `features/officialControls.feature` + `features/support/steps/controls.ts` — the five CTRL-05 outcomes
- [ ] `features/pumpRecords.feature` — record survival across restart
- [ ] `features/support/fakeHap.ts` extension — `Switch`, `On`, `onSet`, `handleSetRequest`, `statusCode`, `HAPStatus`, `HapStatusError`
- [ ] `features/support/fakeTimers.ts` — a controllable `Timers` driven from `World.advanceClock`, wired into `World.discoveryContext()` in place of `systemTimers`
- [ ] `features/support/fakeRestApi.ts` extension — command-scoped arming (`holdNextCommand`, `rejectNextCommand`, `answerNextCommandWith`) and a device reaction flipping `test_running` on acceptance
- [ ] Framework install: none — every framework is already present.

### Rows blocked on unratified decisions

Two Wave 0 items depend on decisions the maintainer has **not** ruled on. Neither may be
planned as settled.

- [ ] `test/accessories/hapWriteFidelity.test.ts` — **requires a test-only import of
  `@homebridge/hap-nodejs`.** CLAUDE.md scopes the ban to runtime, but this would be the
  first test-scope exception and it is the maintainer's rule. If refused, every CTRL-05
  scenario validates semantics this phase invented for its own fake, and the row above is
  dropped.
- [ ] `features/support/fakeShadowBroker.ts` extension — the fake pump's *reaction*: an
  accepted command flips `test_running` and the broker reports it on `update/accepted`.
  Whether an `update/rejected` leaf is also added depends on the D-15 narrowing, which is
  **proposed, not ratified**. `D-15` in `04-CONTEXT.md` binds until the maintainer rules.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| README states Activity History is controller-owned, is not safety delivery, has no configurable retention, and is not backfill | CTRL-02 | Documentation content; no assertion can judge prose meaning | Review the README section against `constraints.md:391` and Apple's Activity History requirements |
| A `Switch` carrying `StatusActive = false` still renders in Apple Home and still accepts a press | D-03 | Only a real paired Apple Home can answer; HAP-side mechanism already probed clean | Publish both control Switches with an undecoded reported field; confirm each tile renders and a press reaches the plugin |
| A refused control's tile behaviour between HAP's write error and the next macrotask push | D-04 residual | No hook exists earlier than HAP's catch; a controller re-read in that window is unobservable locally | Press a refused control (duplicate on during a running test) and watch what the tile does |
| Tile-visibility list for every published service | folded todo | Controllers render only recognised service types; not locally observable | Confirm which of the 17 services Apple Home draws; fold into the same session as the two above |

The three real-home rows above belong to **one** session, together with Phase 3's open
flood-automation check and the `G-003` / `G-004` gates.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] `npm run test:coverage:all` run explicitly — CI does not run it
- [ ] For every safety-bearing row, the defect was reintroduced and the specific test watched to fail
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
