---
phase: 01-secure-cloud-foundation
plan: 08
subsystem: test-harness
tags: [cucumber, aedes, mqtt, websocket, loopback, homebridge, test-double]

requires:
  - "01-01: tsconfig.test.json, cucumber.json, the build:test and test:cucumber scripts, and the corrected pre-commit file patterns"
provides:
  - "`createFakeAuth0`: a loopback Auth0 tenant answering the password-realm grant, recording every grant, and armable to fail"
  - "`createFakeRestApi`: a loopback vendor REST service answering the four routes, recording method, path, authorization, and body"
  - "`createFakeShadowBroker`: an in-process MQTT broker reachable over a WebSocket, with the coalescing stream bridge"
  - "`createFakeHomebridgeApi`: a minimal Homebridge API stand-in with hap, user.storagePath, on, and platformAccessory"
  - "`BasementGuardianWorld`: a typed per-scenario world owning every fake's lifetime and tearing down in reverse order"
  - "`startLoopbackServer`: shared ephemeral-loopback plumbing for both HTTP stand-ins"
  - "`features/harness.feature`: ten smoke scenarios proving each fake answers its contract"
affects: [01-09, 01-10, 01-11, cucumber-harness]

actuals:
  tokens: 11300
  tasks: 3
  commits: 3

tech-stack:
  added: [aedes, ws, mqtt]
  patterns:
    - "Lazy per-scenario resources: the world starts a fake on first use and registers its teardown in the same step"
    - "Transport-level fakes that name no client library, so scenarios survive a change of transport implementation"
    - "A typed topic-leaf union that makes the unsupported shadow topics unwritable rather than merely undocumented"

key-files:
  created:
    - features/support/loopbackServer.ts
    - features/support/fakeAuth0.ts
    - features/support/fakeRestApi.ts
    - features/support/fakeShadowBroker.ts
    - features/support/fakeHomebridgeApi.ts
    - features/support/world.ts
    - features/support/steps/harness.ts
    - features/harness.feature
  modified: []

key-decisions:
  - "The shared loopback plumbing became its own module, because the duplication gate rejected the two hand-written copies and named extraction as the fix"
  - "Each task commit lands its own consumer, because the dead-code gate runs on every `features/**` commit and rejects an unconsumed factory"
  - "The vendor wire shapes are declared inside the REST fake, because the shared wire-type module is written by a sibling plan in this same wave and is not reachable from this tree"
  - "The Homebridge stand-in carries one documented assertion, because the real API type cannot be satisfied without importing HAP-NodeJS, which is not a declared dependency"
  - "The harness subscriber lives on the world rather than in the step module, because per-scenario transport state needs the world's teardown"

requirements-completed: [AUTH-01, SYNC-01, SYNC-04]

coverage:
  - id: D1
    description: "The fake Auth0 tenant answers the password-realm grant on an ephemeral loopback port and records the six grant fields"
    requirement: AUTH-01
    verification:
      - kind: integration
        ref: "features/harness.feature#The fake tenant records the grant it receives"
        status: pass
    human_judgment: false
  - id: D2
    description: "The tenant can be armed to answer the next grant with a status and an error code"
    requirement: AUTH-01
    verification:
      - kind: integration
        ref: "features/harness.feature#The fake tenant answers an armed failure"
        status: pass
    human_judgment: false
  - id: D3
    description: "The fake REST service answers the device list and records the authorization header of every request"
    requirement: SYNC-01
    verification:
      - kind: integration
        ref: "features/harness.feature#The fake service answers the device list"
        status: pass
    human_judgment: false
  - id: D4
    description: "The fake REST service answers the temporary-credentials route with the endpoint, client identifier, and credentials"
    requirement: SYNC-01
    verification:
      - kind: integration
        ref: "features/harness.feature#The fake service answers the temporary credentials"
        status: pass
    human_judgment: false
  - id: D5
    description: "`failNextWith` affects exactly one subsequent request"
    verification:
      - kind: integration
        ref: "features/harness.feature#The fake service fails one armed request"
        status: pass
    human_judgment: false
  - id: D6
    description: "A real MQTT handshake completes over a WebSocket and a shadow-topic message round trip succeeds"
    requirement: SYNC-01
    verification:
      - kind: integration
        ref: "features/harness.feature#The fake broker delivers a reported patch"
        status: pass
      - kind: other
        ref: "isolated probe pairing the broker with the WebSocket library's own stream helper: broker saw a ready client: false, client reports connected: false"
        status: pass
    human_judgment: false
  - id: D7
    description: "Publish helpers cover the get-accepted, get-rejected, and update-accepted topics and no others"
    verification:
      - kind: integration
        ref: "features/harness.feature#The fake broker delivers the full shadow document"
        status: pass
      - kind: integration
        ref: "features/harness.feature#The fake broker rejects the shadow request"
        status: pass
      - kind: other
        ref: "grep for `shadow/` in features/support/fakeShadowBroker.ts: one builder, restricted by the ShadowTopicLeaf union"
        status: pass
    human_judgment: false
  - id: D8
    description: "`disconnectAll` closes every live connection, which is how a scenario drives the reconnect path"
    requirement: SYNC-04
    verification:
      - kind: integration
        ref: "features/harness.feature#The fake broker closes every live connection"
        status: pass
    human_judgment: false
  - id: D9
    description: "The Homebridge stand-in exposes the HAP namespace, a per-scenario storage path, the two lifecycle events, and the accessory constructor"
    verification:
      - kind: integration
        ref: "features/harness.feature#The fake homebridge api answers the surface this version needs"
        status: pass
    human_judgment: false
  - id: D10
    description: "Every scenario gets a fresh world and leaves no listening socket, open connection, or temporary directory behind"
    verification:
      - kind: other
        ref: "npm run test:cucumber: 10 scenarios, 61 steps, all passing, and the process exits on its own"
        status: pass
    human_judgment: false
  - id: D11
    description: "The deterministic suite runs offline with no account, no hardware, and no public network access"
    verification:
      - kind: other
        ref: "grep for `rejectUnauthorized` and for any non-loopback host in features/support: no hits; every service binds 127.0.0.1 on an ephemeral port"
        status: pass
      - kind: other
        ref: "trufflehog filesystem scan over every committed file: verified_secrets 0, unverified_secrets 0"
        status: pass
    human_judgment: false
  - id: D12
    description: "The harness passes the repository's whole quality gate"
    verification:
      - kind: other
        ref: "npm run check (typecheck, lint, three fallow sub-commands, format:check, both test suites) exits 0"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-08-28
status: complete
---

# Phase 1 Plan 08: Fake Vendor Cloud Harness Summary

**A loopback Auth0 tenant, a loopback vendor REST service, an in-process MQTT broker reachable over a WebSocket, and a minimal Homebridge stand-in, all owned by a typed per-scenario world.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-08-28T22:33:00Z
- **Completed:** 2026-08-28T22:58:04Z
- **Tasks:** 3
- **Files created:** 8

## Accomplishments

- The three vendor services now have local stand-ins. Every one binds `127.0.0.1` on an ephemeral port, so scenarios never collide on a fixed port and the suite runs with no account, no hardware, and no public network.
- The MQTT broker completes a real handshake over a WebSocket. The bridge that makes this work batches every frame arriving in one tick into a single chunk. An isolated probe confirmed the obvious alternative fails silently: paired with the WebSocket library's own stream helper, the broker never sees a ready client and the client never reports connected, with no error on either side.
- The shadow topic builder takes a three-value union, so the delta topic and the plugin-side update topic are not merely undocumented — they cannot be typed.
- Each scenario gets a fresh world. Ten scenarios run and the Cucumber process exits on its own, which is the evidence that no listening socket, broker connection, or temporary directory survives a scenario.
- No fixture holds a real credential. The device identifier, the serial number, the tokens, and the AWS credentials are all self-describing placeholders, and the filesystem secret scan reports zero verified and zero unverified findings across every committed file.

## Task Commits

1. **Task 1: the loopback Auth0 tenant and the loopback vendor REST service** - `69f6ca0` (test)
2. **Task 2: the MQTT broker over a WebSocket with the coalescing stream bridge** - `b70a5db` (test)
3. **Task 3: the Homebridge stand-in** - `2e153ed` (test)

Each commit carries the fakes it adds plus the world wiring, step definitions, and scenarios that consume them. The reason is in the deviations below.

## Files Created

- `features/support/loopbackServer.ts` - Ephemeral loopback listening, JSON responses, body reading, and a close that destroys every connection
- `features/support/fakeAuth0.ts` - The password-realm grant, the recorded grant fields, and the armed failure
- `features/support/fakeRestApi.ts` - The four vendor routes, the recorded requests, the one-shot failure, and the vendor wire shapes
- `features/support/fakeShadowBroker.ts` - The broker, the WebSocket service, the coalescing bridge, the three publish helpers, and the forced disconnect
- `features/support/fakeHomebridgeApi.ts` - The HAP namespace, the per-scenario storage path, the two lifecycle events, and the accessory constructor
- `features/support/world.ts` - The per-scenario world: the four fakes, the scenario clock, the observation log, the subscriber, and reverse-order teardown
- `features/support/steps/harness.ts` - Step definitions grouped Given, When, Then, with Then names reading `assert` plus the condition
- `features/harness.feature` - Ten smoke scenarios

## Decisions Made

- **The shared loopback plumbing became `features/support/loopbackServer.ts`.** The two HTTP fakes started as independent modules, exactly as the plan lists them. `fallow dupes` rejected that shape: 10.6 percent duplication against a 3 percent threshold, in two clone groups, with the tool's own recommendation being to extract them into `features/support`. Writing two deliberately different implementations of the same eight lines would have satisfied the gate while making the code worse. The extraction is the honest fix and it is the one the gate asked for.
- **Each task commit carries its own consumer.** The plan expected no local hook to fire on a `features/`-only commit, so it split the tasks by file. The pre-commit patterns were corrected in the prior plan and now match `features/**`, so `npm run fallow` runs on every commit here and rejects an exported factory that nothing imports. Splitting by file would have made commits one and two unlandable. Each commit now lands a fake together with the world wiring, steps, and scenarios that consume it, which keeps three atomic commits and makes every one of them independently green.
- **The vendor wire shapes are declared in the REST fake.** `src/cloud/types.ts` is written by a sibling plan in this same wave and does not exist in this tree, so importing it would have made every gate in this plan unrunnable. The shapes match the published contract field for field, and the module records that the harness should read them from the shared module once it is reachable.
- **The Homebridge stand-in carries one documented assertion.** Homebridge's `API` type requires a real HAP namespace, and HAP-NodeJS is not a declared dependency of this project, so no structural value can satisfy the type. The assertion is stated with its reason: the stand-in answers the four members the plugin reads, and reading any other member surfaces as a TypeError that names it.
- **The harness subscriber lives on the world.** It stands in for the plugin's shadow client until the composition seam exists. It needs per-scenario teardown, and the world is what owns lifetimes; a step module would have leaked it across scenarios.
- **`disconnectAll` closes rather than terminates.** The provider closes a signed WebSocket at its ceiling as normal operation, so the scenario that drives the reconnect path should reproduce a close, not a broken socket. `close()` still terminates, because teardown wants the socket gone immediately.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The duplication gate rejected the two independent HTTP fakes**

- **Found during:** Task 1
- **Issue:** `fallow dupes --fail-on-issues` reported two clone groups across `fakeAuth0.ts` and `fakeRestApi.ts` totalling 10.6 percent duplication against the configured 3 percent threshold. The `npm-fallow` pre-commit hook runs on any `features/**/*.ts` commit, so the task could not be committed.
- **Fix:** Extracted `features/support/loopbackServer.ts` with the ephemeral-loopback listen, the JSON response writer, the body reader, and the close that destroys every connection. Both fakes consume it. This is a file the plan does not list.
- **Files modified:** `features/support/loopbackServer.ts` (new), `features/support/fakeAuth0.ts`, `features/support/fakeRestApi.ts`
- **Verification:** `npm run fallow` reports no duplication and no dead code.
- **Committed in:** `69f6ca0`

**2. [Rule 3 - Blocking] The dead-code gate rejected a commit whose fakes had no consumer**

- **Found during:** Task 1
- **Issue:** The plan states that no local pre-commit hook fires on a `features/`-only commit, and therefore that tasks 1 and 2 may commit fakes whose only consumer arrives in task 3. That is no longer true: the prior plan corrected the four local hooks to match `features/**`. `fallow dead-code` reported `createFakeAuth0` and `createFakeRestApi` as unused exports and failed the commit.
- **Fix:** Moved the consumer wiring into each task's own commit. Task 1 lands the two HTTP fakes with the world, the step definitions, and five scenarios; task 2 lands the broker with its world accessor, steps, and four scenarios; task 3 lands the Homebridge stand-in with its accessor, steps, and one scenario. The task boundaries and their content are unchanged; only the commit contents moved.
- **Files modified:** `features/support/world.ts`, `features/support/steps/harness.ts`, `features/harness.feature`
- **Verification:** All three commits pass `npm run fallow` at the moment they are made.
- **Committed in:** `69f6ca0`, `b70a5db`, `2e153ed`

**3. [Rule 3 - Blocking] The shared wire-type module is not reachable from this tree**

- **Found during:** Task 1
- **Issue:** The plan directs the fakes to produce the wire types from `src/cloud/types.ts`. A sibling plan creates that file in this same wave, in its own worktree, so it does not exist here. Importing it would have failed the type check, the build, and the Cucumber run.
- **Fix:** Declared `ApiConnectivity`, `ApiDevice`, `AwsCredentials`, and `AwsCredentialsResponse` in `features/support/fakeRestApi.ts`, matching the sibling plan's published contract field for field, with a module note that the harness should read them from the shared module once it is reachable.
- **Files modified:** `features/support/fakeRestApi.ts`
- **Verification:** `npx tsc -p tsconfig.test.json --noEmit` is clean and the device-list scenario round-trips a device through the fake.
- **Committed in:** `69f6ca0`

**4. [Rule 2 - Missing critical] Five scenarios beyond the three the plan lists**

- **Found during:** Task 3
- **Issue:** The plan lists three smoke scenarios, but its acceptance criteria require evidence for the armed Auth0 failure, the one-shot REST failure, the temporary-credentials route, the get-accepted and get-rejected publish helpers, `disconnectAll`, and the whole Homebridge surface. Three scenarios cannot carry that evidence.
- **Fix:** Wrote ten scenarios, one per acceptance criterion that a scenario can prove. Every step is reused across scenarios, so the feature file stays short.
- **Files modified:** `features/harness.feature`, `features/support/steps/harness.ts`
- **Verification:** `npm run test:cucumber` reports 10 scenarios and 61 steps, all passing.
- **Committed in:** `69f6ca0`, `b70a5db`, `2e153ed`

**5. [Rule 1 - Bug] The stream bridge failed the compiler on an unused stream parameter**

- **Found during:** Task 2
- **Issue:** The stream contract fixes the position of the encoding parameter, which this bridge has no use for. `noUnusedParameters` rejected it.
- **Fix:** Used the compiler's own marker for a deliberately unused parameter, with a comment stating why the parameter cannot simply be dropped. This matches the verified reference implementation.
- **Files modified:** `features/support/fakeShadowBroker.ts`
- **Verification:** `npx tsc -p tsconfig.test.json --noEmit` and `npx eslint features --max-warnings=0` are both clean.
- **Committed in:** `b70a5db`

---

**Total deviations:** 5 auto-fixed (3 blocking, 1 missing critical, 1 bug)
**Impact on plan:** Every fix was required to make a gate that the plan itself asks for. Three came from the plan's belief that no pre-commit hook fires on a `features/` commit, which the prior plan had already changed. One file exists that the plan does not list, and it exists because the duplication gate named the extraction as the fix. No acceptance criterion was weakened, and nothing outside `features/**` was touched.

## Threat Flags

None. No file in this plan opens a network path outside loopback, disables certificate verification, or reads a real credential.

## Known Stubs

- The HAP namespace in `features/support/fakeHomebridgeApi.ts` is an empty object. This version registers no accessory, so nothing reads a HAP member; the accessory adapters grow the stand-in when they arrive, and the module records that boundary. This does not block the plan's goal, which is a harness for the cloud layer.

## Issues Encountered

- **The plan's pre-commit assumption is stale.** The plan states that none of the four local hooks fires on a `features/`-only commit and builds its task-to-commit mapping on that. The prior plan corrected those patterns. Two of the three blocking deviations trace to this one stale sentence.
- **The trufflehog hook cannot run in a linked worktree.** It aborts with `failed to read index file`, exactly as the repository instructions describe. Each commit was preceded by a filesystem scan over the files being committed, with `--results=verified,unknown`, all clean.
- **The `ws` package ships no types of its own.** `@types/ws` 8.18.1 is present transitively and resolves the import, so no manifest change was needed — which matters, because this plan may not edit `package.json`.

## Deferred Items

- **Re-point the harness wire types at the shared module.** Once `src/cloud/types.ts` is merged, `features/support/fakeRestApi.ts` should import `ApiConnectivity`, `ApiDevice`, `AwsCredentials`, and `AwsCredentialsResponse` from it and delete the local declarations. Until then the two declarations coexist. They are far below the clone detector's fifty-token floor individually, but the phase gate should confirm `fallow dupes` stays green after the merge.
- **Retire the `aedes`, `mqtt`, and `ws` entries from `.fallowrc.json`.** All three now have a consumer under `features/`, so the exemptions have stopped earning their place. This plan may not edit that file; the phase gate owns the removal.
- **Grow the Homebridge stand-in.** The HAP namespace, the accessory services, and accessory registration all arrive with the accessory adapters.

## User Setup Required

None.

## Next Phase Readiness

Ready. The scenarios that follow can point the plugin at a fake cloud with no further harness work:

- A scenario reaches a local broker through a `ws` scheme the shadow client accepts as a constructor parameter. No certificate-verification bypass exists anywhere in this tree.
- The endpoint and the client identifier reach the plugin as data, through the fake credentials route, so neither needs an override.
- The world satisfies a `{ now(): number }` clock port directly, so a scenario can hand it to the code under test.
- `npm run check` exits 0 across type check, lint, all three `fallow` sub-commands, the format check, and both test suites.

## Self-Check: PASSED

- All eight created files exist on disk.
- All three commits are present in `git log`.
- Every task `<acceptance_criteria>` was re-run and passes, including the negative check that the naive WebSocket bridge leaves the handshake silently unfinished.
- The plan-level `<verification>` block was re-run: `npm run test:cucumber` passes with the process exiting on its own, `npm run test:unit` passes, `npm run typecheck` is clean, and the feature directory passes `npx eslint --max-warnings=0` and `npx prettier --check`.
- No skipped test and no unrun verification step remains. One known stub is recorded above, with the reason it is intentional.

---

*Phase: 01-secure-cloud-foundation*
*Completed: 2026-08-28*
