---
status: resolved
trigger: "Investigate and fix WINDOWS.md ledger entry 45 (open, unmet-truth, phase 06, src/cloud/api.ts): an uncaught InformationalError: socket idle timeout crash from an unhandled HTTP/2 'error' event, reproduced twice against the live vendor account by running the opt-in real-pump Cucumber suite."
created: 2026-09-05T16:13:34.000Z
updated: 2026-09-05T18:45:00.000Z
---

## Current Focus
<!-- OVERWRITE on each update - always reflects NOW -->

hypothesis: CONFIRMED end to end. Node 26's bundled undici 8.10.0 flipped allowH2 to true, so the
bare global fetch() in src/cloud/api.ts and src/cloud/auth.ts negotiated h2 with the vendor and
armed undici's 4s session idle timer, whose expiry destroys the pooled socket with exactly
InformationalError("socket idle timeout"). The exact upstream second-error trigger that lets the
destroy escape as UNCAUGHT was never locally reproduced and stays uncharacterized -- but the
shipped fix sidesteps that entirely by never negotiating h2 with the vendor on any Node major.

DECISION (human checkpoint, resolved): Node's own engines.node claim must widen to include ^26.
"Guard + defer" REJECTED as insufficient. Node 26 may become the CI/publish "preferred" version.
Also fix the unrelated api.ts narrow() response-body leak in the same pass.

FALSIFIED (2026-09-05T17:40Z, green-phase pre-flight): passing a userland `Agent({allowH2:false})`
as `init.dispatcher` to the BUILT-IN global fetch is BROKEN on Node 22 and 24 (ABI mismatch between
the bundled fetch's dispatch handler and a userland-major Agent). See Evidence below for the full
falsification record.

DECISION (human checkpoint, resolved 2026-09-05T18:xx): Option A approved -- route vendor HTTP
through userland undici's OWN fetch + Agent end to end, injected as a port (`httpFetch`) mirroring
the existing `connect: MqttConnect` port in AccountRuntimeDeps, rather than a dispatcher passed into
the built-in global fetch. undici major: 7, not 8 (undici 8 would narrow engines.node's floor to
^22.19.0 for no functional benefit; undici 7's own floor is >=20.18.1, compatible with the existing
^22.10.0 floor). Options B (undocumented `Symbol.for('undici.globalDispatcher.1')`, silently
undefined on a cold process) and C (version-sniffing process.versions.undici) REJECTED as
silent-failure shapes.

IMPLEMENTED (2026-09-05T18:15Z, green phase): all ordered steps from the prior next_action are
complete. src/cloud/httpDispatcher.ts created (userland `Agent({allowH2:false})` + userland
`fetch`, one shared Agent instance); `httpFetch: HttpFetch` port added to CloudApiOptions,
AuthClientOptions, and AccountRuntimeDeps; wired at both composition roots (src/platform.ts
production, and both Cucumber harnesses -- world.ts and real-pump/support/realWorld.ts -- since
those exercise the SAME createAccountRuntimeFromConfig seam production uses); api.ts narrow() now
drains/cancels response.body before throwing on a non-ok response; undici ^7.29.1 added to
package.json dependencies; engines.node widened to "^22.10.0 || ^24.0.0 || ^26.0.0" (+ matching
test/packageManifest.test.ts assertion); build.yml matrix gained 26.x, publish.yml/package-audit.yml
moved 24.x -> 26.x as preferred; dependencyAllowlist.test.ts permits ["mqtt","undici"] with a
rationale comment; RED test at test/cloud/api.test.ts is GREEN; auth.ts mirror regression case and
test/cloud/httpDispatcher.test.ts added (3 new cases, 100% coverage).

UNPLANNED FIX-FORWARD (discovered during green-phase verification, resolved without a new
checkpoint -- both are mechanical consequences of the approved design, not new forks): (1)
test/platform.test.ts's 9 `t.mock.method(globalThis, 'fetch', ...)` sites stopped intercepting
vendor calls once src/platform.ts's composition root used the real production httpFetch directly
(undici's own fetch export is provably NOT mock.method-able -- confirmed empirically, "Cannot
redefine property: fetch" -- unlike the CJS-interop `connect` from `mqtt`), causing 5 tests that
invoke the captured launch listener to hang against the real vendor and time out. Fixed by adding
an optional `PlatformDeps` 4th constructor parameter to BasementGuardianPlatform (defaults to real
production httpFetch; Homebridge itself always calls the constructor with exactly 3 args, so
production is unaffected), and passing `{ httpFetch: (input, init) => globalThis.fetch(input,
init) }` from the 5 affected tests -- this mirrors the exact "make a hidden dependency an explicit
parameter" pattern the project's own typescript-unit-testing.md rules and the pre-existing
`DiscoveryContext.timers` injection already establish, one composition layer further up. (2)
test/packaging/dependencyTelemetry.test.ts false-positived on `node_modules/undici/lib/cache/
memory-cache-store.js`: the variable name `previousEntry`, lower-cased, ends in the substring
"sentry", which the gate's naive `.includes()` match flagged. Initially fixed by switching to a
two-sided word-boundary regex (`\bsentry\b`). CORRECTED during close-out review: that form was
wrong, and its comment's justification ("`_` is a non-word character") was factually false --
regex `\w` includes `_`, so `\bsentry\b` silently missed `SENTRY_DSN`, `MY_SENTRY_KEY`, and
`sentryClient`, all real Sentry references, weakening the gate rather than merely de-noising it.
Replaced with a one-sided leading boundary `(?<![a-z0-9])sentry`, verified empirically to exclude
`previousEntry` while matching all four real spellings.

next_action: NONE -- SESSION RESOLVED. Live confirmation passed (7/7 real-pump scenarios, 41/41
steps, 32m, zero InformationalError, on the same Node 26.8.1 binary that reproduced the crash 2/2).
Close-out complete: full diff reviewed against typescript-style-guide.md and typescript-comments.md;
complete static gate re-run on the FINAL tree and green; both supply-chain gates verified directly
against undici's real lockfile entry; one defect found and fixed in this session's own
dependencyTelemetry.test.ts edit (see Resolution.verification); committed as ef58074 with all
pre-commit hooks green; WINDOWS.md ledger entry 45 marked `fixed`; STATE.md phase 6 section updated.
No follow-up work is pending in this session.
bug_class: Bohrbug for protocol selection (deterministic, 3/3 by Node version); the escape itself behaves as a Heisenbug/teardown race (0/5 locally, 2/2 live)
reasoning_checkpoint:
  hypothesis: "Node 26's bundled undici (8.10.0+) defaults allowH2 to true, so the plugin's bare
    global fetch() in src/cloud/api.ts:146 and src/cloud/auth.ts:355 negotiates HTTP/2 with the
    vendor; undici's h2 code path arms a 4s session idle timer, and undici's h2 stream teardown
    guards a released-but-still-open stream with only a ONE-SHOT stream.once('error', noop), so a
    second error on that stream has no listener left and escapes as an uncaught InformationalError.
    Forcing HTTP/1.1 via an explicit per-request dispatcher removes the plugin from undici's h2
    code path entirely, so the idle-timeout destroy this crash depends on can never fire, without
    needing the exact second-error trigger confirmed."
  confirming_evidence:
    - "alpn-probe.mjs: identical global fetch() against one local h2-capable TLS server on three
      real Node binaries -- 22.21.1 (undici 6.22.0) -> HTTP/1.1, 24.13.0 (undici 7.18.2) ->
      HTTP/1.1, 26.8.1 (undici 8.10.0) -> h2. Decisive: the crash is reachable only on Node 26+,
      and unreachable on every currently declared-supported and CI-tested Node major."
    - "Bundled undici source read (internal/deps/undici/undici, Node 26.8.1): line 3239
      `allowH2 = allowH2 != null ? allowH2 : true`; lines 8787-8797 onHttp2SessionIdleTimeout
      builds exactly `new InformationalError('socket idle timeout')` on a 4s keepAliveTimeout,
      matching the observed crash's message and stack frame verbatim."
    - "dispatcher-probe.mjs: `fetch(url, { dispatcher: new Agent({ allowH2: false }) })` from a
      separately installed userland undici 8.10.2 forces HTTP/1.1 on this same Node 26 binary
      (server reports HTTP/1.1), confirming the fix mechanism works and needs no global
      setGlobalDispatcher call (which would be unacceptable in a shared Homebridge process)."
    - "This session's new regression test (test/cloud/api.test.ts, real loopback HTTP/2-capable
      server, no mocked fetch): unmodified createCloudApi().devices() against Node 26.8.1
      negotiates 'h2', confirmed failing exactly as predicted before any fix code was written."
  falsification_test: "If, after wiring the allowH2:false dispatcher into both fetch() call
    sites, the new regression test still observes 'h2' on the wire, or the live ~16-minute run
    against the real vendor account still shows an h2 stream negotiated or the
    InformationalError recurs, the hypothesis is wrong or incomplete."
  fix_rationale: "Forcing HTTP/1.1 addresses the confirmed, decisive environmental root cause
    directly -- it removes reachability of the vulnerable undici h2 code path entirely -- rather
    than attempting to patch or paper over the unconfirmed upstream one-shot-error-guard race,
    which is undici's own defect (nodejs/undici #5586 family) and was not locally reproducible
    (0/5 attempts). This is a root-cause fix for the plugin's exposure, not a symptom patch,
    even though the exact upstream trigger stays uncharacterized."
  blind_spots: "The exact second error that consumes undici's one-shot stream.once('error', noop)
    guard was never locally reproduced, so it remains theoretically possible some OTHER
    h2-specific vendor behavior (not yet observed) could still misbehave under h2 in a way this
    fix doesn't touch -- but since the fix removes h2 reachability entirely, that residual risk
    is moot for this plugin regardless of its exact mechanism. Also unverified: whether the
    vendor's real infrastructure behaves identically to the local loopback probes over a live
    ~960s idle window (the live confirmation run in next_action step 9 is what actually closes
    this gap, not the unit-level regression test alone)."
  candidate_causes:
    - "environment: Node 26's bundled undici flips the allowH2 default from false to true,
      changing what the SAME unmodified plugin code negotiates purely as a function of the
      Node major it runs on"
    - "code: the plugin's fetch() call sites in api.ts and auth.ts pass no dispatcher at all, so
      they implicitly inherit whatever the runtime's undocumented default is, rather than
      explicitly stating the protocol the vendor integration requires"
  and_gate: "yes -- two conditions were required together for the crash to be POSSIBLE at all:
    (1) running on Node 26+ AND (2) the fetch() call sites leaving the dispatcher unconfigured.
    Resolution.root_cause already records this as an AND-gate. A third condition (the upstream
    one-shot error-guard race actually firing a second error) was required for the crash to
    become an UNCAUGHT top-level exception specifically, but that condition is not independently
    confirmed and the chosen fix sidesteps needing it to be, by removing condition (1)'s
    reachability entirely."
tdd_checkpoint:
  test_file: "test/cloud/api.test.ts"
  test_name: "never negotiates HTTP/2 with the vendor, even when the server offers it"
  status: "green"
  green_note: |
    Confirmed GREEN 2026-09-05T18:15Z after wiring the production httpFetch (userland undici,
    allowH2:false) through the port and overriding the test's own httpFetch to it explicitly
    (apiOptions()'s default stayed globalThis.fetch, for the other 32 mocked cases in this file).
    Full test:unit run: 1449/1449 passing, including this case and the new auth.ts mirror and
    httpDispatcher.test.ts cases.
  failure_output: |
    AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
    'h2' !== 'http/1.1'
      actual: 'h2'
      expected: 'http/1.1'
      operator: 'strictEqual'
  notes: |
    New test support module test/cloud/alpnServer.ts starts a real loopback HTTP/2-capable HTTPS
    server (self-signed cert generated fresh per run via `openssl` -- not committed, so no key
    material for a secret scanner to flag, and no expiry maintenance burden) and records which
    ALPN protocol the connecting client actually negotiated. The test calls the REAL, unmodified
    createCloudApi().devices() (no mocked fetch) against it, trusting the loopback cert via
    node:tls's setDefaultCACertificates (scoped, restored via t.after(); no TLS verification is
    disabled). Confirmed RED against today's unfixed src/cloud/api.ts on this Node 26.8.1
    machine: 32/33 other api.test.ts cases still pass unaffected; lint, format, and typecheck are
    clean on the new files. This is the same real-network approach as the investigation's earlier
    scratchpad probes, now committed as a permanent regression case (not a throwaway script).

## Symptoms
<!-- Written during gathering, then immutable -->

expected: the real-pump suite's heartbeat scenario ("The connection stays healthy across one heartbeat interval") should observe a quiet-but-healthy ~960-second idle window against the live vendor account with no error, matching every other passing scenario in the same suite
actual: the process throws an uncaught `InformationalError: socket idle timeout` originating from an HTTP/2 stream with no `error` listener, which either fails the scenario (second run, full 960s wait) or crashes the whole Node process after Cucumber already printed its summary (first run, where the wait was cut short to 5s by a since-fixed harness timeout bug)
errors: |
  InformationalError: socket idle timeout
      at Timeout.onHttp2SessionIdleTimeout [as _onTimeout] (node:internal/deps/undici/undici:8795:19)
      at listOnTimeout (node:internal/timers:687:11)
      at process.processTimers (node:internal/timers:618:7)
  (first run additionally showed:) Emitted 'error' event on ClientHttp2Stream instance at: ... { code: 'UND_ERR_INFO' } -- an uncaught top-level exception, not an unhandledRejection
reproduction: |
  source ~/bg.env (BG_EMAIL/BG_PASSWORD for the one-Gemini vendor test account), then
  `npm run build:test && npx cucumber-js --profile real -- features/real-pump/heartbeats.feature`
  and let the "waits 960 seconds" step run its full real duration (do not cut it short)
started: first observed 2026-09-05, the first time the opt-in real-pump suite was ever run against the live account for long enough (>5s) to reach a real idle window; unknown whether this predates today, since no automated run had ever exercised this real-account idle path before (features/real-pump/ is opt-in and read-only, per D-04)

## Eliminated
<!-- APPEND only - prevents re-investigating after /clear -->

- hypothesis: the plugin configures, or fails to configure, some undici Agent/dispatcher/keepAlive option and that misconfiguration causes the crash
  evidence: no Agent, dispatcher, setGlobalDispatcher, keepAlive or http2 configuration exists anywhere in src/. Both fetch() call sites (src/cloud/api.ts:146, src/cloud/auth.ts:355) use the bare global fetch. mqtt reaches the broker over `ws`, not undici (undici is only a devDependency of mqtt). There is nothing to misconfigure -- the defect is in undici's defaults, not in plugin configuration
  timestamp: 2026-09-05T16:22:00.000Z
- hypothesis: a plain h2 request followed by an idle window longer than undici's 4s keepAliveTimeout is enough to crash
  evidence: scratchpad h2-idle-repro.mjs (local node:http2 secure server, one fetch, body consumed, 8s idle) exits 0 on Node 26. The server observes the h2 session open and close cleanly. A generic idle destroy is handled
  timestamp: 2026-09-05T16:26:00.000Z
- hypothesis: the crash comes from api.ts narrow() leaving the response body unconsumed on a non-ok response, alone or combined with the still-armed AbortSignal.timeout deadline
  evidence: scratchpad h2-matrix.mjs, all five shapes (ok/500 x consumed/unconsumed x with/without an AbortSignal.any([signal, AbortSignal.timeout(2500)]) deadline) exit 0 across a 12s idle window. Note the first matrix run was invalid because 'unconsumed'.includes('consumed') is true, so every mode consumed the body; the corrected run still survived
  timestamp: 2026-09-05T16:31:00.000Z
- hypothesis: the crash is a race between undici's 4s idle timer and a gateway closing the pooled connection at about the same moment
  evidence: scratchpad h2-race.mjs swept a server-side close at 3900-4130ms in 10ms steps across three close styles (session.destroy, socket.destroy, goaway), 24 cycles each, 72 cycles total. All exit 0
  timestamp: 2026-09-05T16:36:00.000Z
- hypothesis: a stream left OPEN by a never-ended response body, severed by the abort deadline, then finished off by the idle timer, produces the uncaught second error
  evidence: scratchpad h2-openstream.mjs (500 with a body the server never ends, body unconsumed, with and without the abort deadline, 15s idle) exits 0 in both modes
  timestamp: 2026-09-05T16:39:00.000Z

## Evidence
<!-- APPEND only - facts discovered during investigation -->

- timestamp: 2026-09-05T15:24:00.000Z
  checked: first live run of `npx cucumber-js --profile real` (before the harness timeout fix), wall clock 15.8s
  found: scenario 1 failed with `InformationalError: socket idle timeout` inside the "waits 960 seconds" step; after Cucumber printed its 7-scenario summary, the process crashed with the same error emitted as an uncaught top-level exception on a ClientHttp2Stream (`UND_ERR_INFO`), not caught anywhere
  implication: this is not merely a step-timeout artifact -- the underlying HTTP/2 idle-timeout error is real and unhandled regardless of how long the step waits
- timestamp: 2026-09-05T15:56:00.000Z
  checked: second live run of `npx cucumber-js --profile real` (after commit 892a6c7 fixed the harness step-timeout bug), full ~16m10s wall clock
  found: 6/7 scenarios passed; scenario 1 ("The connection stays healthy across one heartbeat interval") still failed with the identical `InformationalError: socket idle timeout` stack trace, this time during a real ~960s idle window; the process itself did not crash top-level this run (Cucumber's own step-execution wrapper appears to have caught it as the step's failure this time)
  implication: reproduces 2/2 on live runs; the defect is tied to idle duration (order of production's 300s+ pollInterval), not to the harness's earlier mis-timed 5s window -- rules out "was just the timeout bug" as the sole explanation
- timestamp: 2026-09-05T16:20:00.000Z
  checked: dumped the undici bundled inside the running Node binary (internal/deps/undici/undici, 18813 lines) and read the crash site named in the stack trace
  found: line 3239 reads `allowH2 = allowH2 != null ? allowH2 : true` -- HTTP/2 is ON BY DEFAULT in undici 8.10.0, with ALPNProtocols ["http/1.1","h2"]. Line 9947 sets the h2 keepAliveTimeout default to 4000ms. Lines 8787-8797 are onHttp2SessionIdleTimeout, which builds `new InformationalError("socket idle timeout")` and calls util.destroy(socket, err)
  implication: the observed message and stack frame are undici's own idle-connection reaping, verbatim; the idle timer fires 4s after a request completes, not after 960s, so the 960s wait merely spans several such reaps
- timestamp: 2026-09-05T16:24:00.000Z
  checked: the running interpreter against package.json engines and the CI matrix
  found: the machine that produced both live failures runs Node v26.8.1 with undici 8.10.0. package.json declares `engines.node: ^22.10.0 || ^24.0.0`, and .github/workflows/build.yml tests only [22.x, 24.x] (publish and package-audit use 24.x)
  implication: both live reproductions ran on a Node major OUTSIDE the plugin's declared support range and outside everything CI exercises
- timestamp: 2026-09-05T16:44:00.000Z
  checked: scratchpad alpn-probe.mjs -- identical global fetch() against one local h2-capable TLS server, run on three real Node binaries downloaded for the comparison
  found: Node v22.21.1 (undici 6.22.0) negotiates HTTP/1.1; Node v24.13.0 (undici 7.18.2) negotiates HTTP/1.1; Node v26.8.1 (undici 8.10.0) negotiates h2
  implication: DECISIVE. On both supported and both CI-tested Node majors the plugin's fetch() never speaks HTTP/2, so onHttp2SessionIdleTimeout is unreachable and this crash cannot occur. The defect is reachable only on Node 26+
- timestamp: 2026-09-05T16:46:00.000Z
  checked: undici's own h2 stream teardown bookkeeping (severRequestStream at bundled line 8567, releaseRequestStream at 9345, removeRequestStreamListeners at 9333, completeRequestStream at 8994)
  found: when undici releases a request from an h2 stream that is still open it calls closeStreamSession (decrementing kOpenStreams, which ARMS the idle timer) and then guards the still-open stream with a ONE-SHOT `stream.once("error", noop)`. onError likewise removes itself (`stream.off("error", onError)`) on its first fire. So a stream is protected against exactly one error while the idle timer is already running against it
  implication: mechanism identified for how the idle-timeout socket destroy escapes -- any h2 stream that receives a SECOND error has no listener left and Node raises it as an uncaught exception. This is an upstream undici defect, not plugin misuse; a web search confirms the same teardown-race family (nodejs/undici issue #5586)
- timestamp: 2026-09-05T16:52:00.000Z
  checked: scratchpad dispatcher-probe.mjs -- whether a userland undici Agent can steer Node's BUILT-IN global fetch per request
  found: `fetch(url, { dispatcher: new Agent({ allowH2: false }) })` from a separately installed undici 8.10.2 forces HTTP/1.1 on Node 26 (server reports HTTP/1.1), while the same fetch without a dispatcher negotiates h2. Bundled undici accepts init.dispatcher on Request (bundled line 12890)
  implication: a per-request dispatcher is a viable fix that does NOT mutate the process-global dispatcher -- which matters because a Homebridge plugin shares its process with every other plugin, so setGlobalDispatcher would be an unacceptable side effect. Cost is a first runtime dependency beyond mqtt
- timestamp: 2026-09-05T16:54:00.000Z
  checked: src/cloud/api.ts narrow() (lines 99-111) against src/cloud/auth.ts readBody()
  found: narrow() throws on `!response.ok` WITHOUT reading or cancelling response.body, so every vendor error response leaks an unconsumed body stream. auth.ts does not have this problem: its readBody() runs before the ok check, so that body is always consumed
  implication: a genuine defect on its own merits and exactly the lingering-open-stream condition undici's one-shot guard mishandles. Worth fixing regardless of which remediation is chosen for the crash, though five local reproductions failed to prove it contributes to this specific crash

- timestamp: 2026-09-05T17:15:00.000Z
  checked: TDD red phase -- added test/cloud/alpnServer.ts (real loopback HTTP/2-capable HTTPS
    server support module, fresh self-signed cert per run via openssl, no committed key material)
    and a new case in test/cloud/api.test.ts calling the real unmodified createCloudApi().devices()
    against it with no mocked fetch; ran `node --test dist-test/test/cloud/api.test.js`
  found: the new case fails exactly as predicted -- `'h2' !== 'http/1.1'` -- against today's
    unfixed production code on this Node 26.8.1 machine; all 32 other existing api.test.ts cases
    still pass; lint, format:check, and typecheck are clean on both new files
  implication: confirms the root cause is reproducible through the REAL production code path (not
    just standalone scratchpad scripts) with a committed, permanent regression test now in place;
    this test is the RED half of the TDD checkpoint and will be re-run to confirm GREEN once the
    dispatcher fix lands in green phase

- timestamp: 2026-09-05T17:40:00.000Z
  checked: green-phase pre-flight -- scratchpad xversion-dispatcher-probe.mjs, the SAME userland
    undici 8.10.2 `new Agent({ allowH2: false })` passed as `init.dispatcher` to the BUILT-IN
    global fetch, run on all three real Node binaries rather than only on Node 26
  found: DECISIVE FALSIFICATION of the planned remediation. Node 22.21.1 (bundled undici 6.22.0)
    and Node 24.13.0 (bundled undici 7.18.2) both REJECT the userland dispatcher with
    `TypeError: fetch failed` caused by `invalid onRequestStart method`. Only Node 26.8.1
    (bundled undici 8.10.0) accepts it. The bundled fetch builds a dispatch handler in ITS OWN
    major's shape and hands it to the userland Agent, whose `dispatch()` validates for undici 8's
    handler API; undici 6/7 bundled fetch supply the older onConnect/onHeaders/onData/onComplete
    handler, which undici 8 refuses
  implication: the chosen fix as written would have broken EVERY vendor REST call and EVERY Auth0
    token exchange on both currently declared-supported, CI-tested Node majors -- converting a
    Node-26-only idle-timeout crash into a total loss of function on Node 22 and 24. The
    dispatcher handler ABI is coupled to the BUNDLED undici major, not to the userland one, so no
    single pinned userland undici version can be correct across Node majors. This was invisible to
    the earlier feasibility probe because that probe only ever ran on Node 26

- timestamp: 2026-09-05T17:52:00.000Z
  checked: scratchpad alternatives-probe.mjs -- the surviving remediation candidates, each run on
    all three real Node binaries: (A) userland undici's OWN fetch paired with a userland
    `Agent({ allowH2: false })`; (B) the bundled Agent class reached through undici's
    global-dispatcher symbol; (C) today's baseline
  found: (A) forces HTTP/1.1 on 22.21.1, 24.13.0 AND 26.8.1 -- the only candidate correct on every
    supported major, because handler and Agent then come from the SAME undici copy so no ABI
    mismatch is possible. (B) is dead: the global dispatcher's constructor is `Dispatcher1Wrapper`,
    a compat shim whose constructor takes a dispatcher argument, so `new Ctor({allowH2:false})`
    throws `Argument dispatcher must implement dispatch`. (C) reconfirms h2 on 26 only
  implication: routing vendor HTTP through userland undici end to end is the only mechanism that
    does not couple correctness to whichever undici Node happens to bundle
- timestamp: 2026-09-05T17:58:00.000Z
  checked: bundled undici source around the fetch/Agent dispatch path (lines 10488-10495,
    10613-10647, 10655-10698, 14731-14743) plus scratchpad legacy-wrapper-probe.mjs
  found: `Agent[kDispatch]` DOES honour a per-request `opts.allowH2`, pooling http1-only clients
    under a `${origin}#http1-only` key -- but bundled `fetch` never forwards `allowH2` from init
    (its `dispatchWithProtocolPreference` is only ever called with allowH2 undefined outside a
    websocket retry), so there is no supported init-level escape hatch. Separately,
    `Symbol.for('undici.globalDispatcher.1')` holds a `Dispatcher1Wrapper` whose `dispatch()`
    force-sets `allowH2:false`; passing THAT object as `init.dispatcher` does force HTTP/1.1 on all
    three majors. However it is lazily created: on a cold process the symbol is UNDEFINED on
    22.21.1, 24.13.0 and 26.8.1 alike, and it is an undocumented internal
  implication: the zero-dependency, zero-test-churn route would silently no-op on the FIRST request
    of a process -- exactly the request that matters -- and depends on an undocumented symbol whose
    disappearance would silently restore the crash. Rejected for a safety-critical plugin
- timestamp: 2026-09-05T18:04:00.000Z
  checked: the true blast radius of routing vendor HTTP through an injected port, rather than the
    19 `t.mock.method(globalThis, 'fetch', ...)` sites the earlier estimate assumed
  found: both cloud test modules build their options through ONE shared helper each
    (test/cloud/api.test.ts:81 `apiOptions()`, test/cloud/auth.test.ts:111 `authOptions()`), and
    production has exactly ONE composition root (src/runtime/accountRuntime.ts:1176 and :1190).
    `AccountRuntimeDeps` (line 1130) already injects `connect: MqttConnect`, an exactly analogous
    network port. If the shared test helpers default the new port to
    `(input, init) => globalThis.fetch(input, init)`, every one of the 19 existing mock sites keeps
    intercepting UNCHANGED
  implication: the feared "rewrite 19 mock sites" cost is avoidable. The change is ~5 production
    files plus 2 test helper defaults, and it follows the codebase's own established port-injection
    convention rather than inventing one

- timestamp: 2026-09-05T18:15:00.000Z
  checked: full green-phase implementation -- src/cloud/httpDispatcher.ts (new), httpFetch port
    added to CloudApiOptions/AuthClientOptions/AccountRuntimeDeps and wired at every composition
    root (src/platform.ts, features/support/world.ts, features/real-pump/support/realWorld.ts),
    narrow() body-drain fix, undici ^7.29.1 dependency, engines.node widened, CI matrices updated,
    dependencyAllowlist widened, RED test + new auth.ts/httpDispatcher.ts regression cases
  found: `npm run typecheck` clean; `npm run lint` clean; `npm run format:check` clean; `npm run
    fallow` exit 0 (pre-existing duplicate-code findings in unrelated files, unchanged by this
    session); `npm run build` (production) clean; `npm run test:unit` 1449/1449 passing including
    the now-GREEN RED test; `npm run test:cucumber` (default profile) 104/104 scenarios, 1156/1156
    steps passing; per-pair coverage 100% line/branch/function on httpDispatcher.ts, api.ts,
    auth.ts, platform.ts, and accountRuntime.ts (the five touched source-test pairs)
  implication: the fix is structurally complete and every existing static and unit-level gate
    confirms it, including through the real production composition path (platform.ts) and both
    Cucumber harnesses; only the live vendor confirmation (real idle window, real network) remains
- timestamp: 2026-09-05T18:16:00.000Z
  checked: two test-suite regressions surfaced by `npm run test:unit` after the initial
    implementation, both root-caused and fixed without reopening the checkpoint (see
    "UNPLANNED FIX-FORWARD" in Current Focus for the full reasoning)
  found: (1) 5 of 63 test/platform.test.ts cases timed out because platform.ts's composition root
    now calls the real production httpFetch directly, which `t.mock.method(globalThis, 'fetch',
    ...)` cannot intercept -- confirmed via a scratch probe that undici's own named `fetch` export
    is not `t.mock.method`-able either (`TypeError: Cannot redefine property: fetch`), ruling out
    the same CJS-interop trick that (would, if ever exercised) make mqtt's `connect` mockable. (2)
    test/packaging/dependencyTelemetry.test.ts flagged `node_modules/undici/lib/cache/
    memory-cache-store.js` for containing the substring "sentry" -- traced to the identifier
    `previousEntry`, whose lower-cased form ends in "sentry" with no word boundary before it
  implication: both were genuine, mechanical consequences of routing production HTTP through
    userland undici rather than the mockable global fetch -- not signs the design is wrong. Fixed
    respectively by an optional `PlatformDeps` constructor parameter (defaults to production
    httpFetch; Homebridge's own 3-arg call is unaffected) and a word-boundary regex in the
    telemetry gate's signature match

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: |
  Partially confirmed, and it is a chain of two conditions (AND-gate fired).

  1. ENVIRONMENT (confirmed, decisive): the run happened on Node v26.8.1, whose bundled
     undici 8.10.0 flipped `allowH2` from false to true. The plugin's bare global fetch()
     in src/cloud/api.ts:146 and src/cloud/auth.ts:355 therefore negotiates HTTP/2 with the
     vendor, which puts it on undici's h2 code path with a 4s session idle timer whose
     expiry destroys the pooled socket with exactly `InformationalError("socket idle
     timeout")`. Verified by running one identical probe on three real Node binaries:
     22.21.1 -> HTTP/1.1, 24.13.0 -> HTTP/1.1, 26.8.1 -> h2. package.json declares
     `^22.10.0 || ^24.0.0` and CI tests only 22.x/24.x, so the crash is unreachable on
     every currently supported and CI-tested Node major.

  2. UPSTREAM CODE (mechanism identified, not reproduced): undici guards an h2 stream it
     has released but that is still open with a ONE-SHOT `stream.once("error", noop)`,
     having already decremented kOpenStreams and armed the idle timer against that same
     stream. A second error on that stream has no listener and becomes an uncaught
     exception. This is an upstream undici teardown race (nodejs/undici #5586 family), not
     plugin misuse. Five local reproductions failed to produce the required first error, so
     the exact vendor-side trigger is NOT confirmed.

  Contributing plugin-side defect (independent, worth fixing either way): api.ts narrow()
  throws on `!response.ok` without reading or cancelling response.body, leaking an
  unconsumed body stream on every vendor error response.
fix: APPLIED. Vendor HTTP now routes through userland undici's own fetch + Agent({allowH2:false})
  end to end (src/cloud/httpDispatcher.ts), injected as an `httpFetch` port on CloudApiOptions,
  AuthClientOptions, and AccountRuntimeDeps, mirroring the existing `connect: MqttConnect` port.
  Wired at every composition root: src/platform.ts (production), features/support/world.ts and
  features/real-pump/support/realWorld.ts (both Cucumber harnesses, since they exercise the same
  createAccountRuntimeFromConfig seam). Test infrastructure defaults the port to
  `(input, init) => globalThis.fetch(input, init)` in test/cloud/api.test.ts's apiOptions() and
  test/cloud/auth.test.ts's authOptions(), so the 19 pre-existing `t.mock.method(globalThis,
  'fetch', ...)` sites in those two files kept working unchanged; test/platform.test.ts's 9 sites
  needed a new optional `PlatformDeps` constructor parameter on BasementGuardianPlatform for the
  same reason (see Evidence, "UNPLANNED FIX-FORWARD"). api.ts's narrow() now drains/cancels
  response.body before throwing on a non-ok response, fixing the independent contributing leak.
  undici ^7.29.1 added as a production dependency (not ^8, to avoid narrowing engines.node's floor
  for no functional benefit). engines.node widened to "^22.10.0 || ^24.0.0 || ^26.0.0". CI matrices,
  dependencyAllowlist.test.ts, and packageManifest.test.ts updated to match.
verification: |
  COMPLETE. Every gate green on the final committed tree, and the live gap is closed.

  Live confirmation (the gate that actually matters -- this is the exact run that failed 2/2
  before the fix): `npx cucumber-js --profile real` on the SAME Node 26.8.1 binary that
  reproduced the crash twice, against the real vendor account, exit code 0 -- 7 scenarios
  (7 passed), 41 steps (41 passed), 32m6.8s wall clock, ZERO InformationalError. The
  heartbeats scenario's full ~960s idle window ran its real duration, so the idle-reap path
  that produced the crash was genuinely exercised, not skipped.

  Static/unit gate re-run on the FINAL tree (after platform.ts, accountRuntime.ts, world.ts and
  realWorld.ts changed): typecheck 0, lint 0, fallow 0 (the 2 reported clone groups are
  pre-existing and in lines this session never touched), format:check 0, test:unit 1449/1449
  exit 0, test:cucumber default profile 104/104 scenarios and 1156/1156 steps exit 0. 100%
  line/branch/function coverage on every touched source-test pair (httpDispatcher.ts, api.ts,
  auth.ts, platform.ts, accountRuntime.ts) run alone.

  Named cases confirmed individually rather than inferred from the aggregate: the RED-turned-
  GREEN regression case in api.test.ts ("never negotiates HTTP/2 with the vendor, even when the
  server offers it"), its auth.test.ts mirror, and httpDispatcher.test.ts 3/3 -- all pass over a
  real loopback h2-capable server with no mocked fetch, so the assertion is about what actually
  went out on the wire.

  Supply-chain gates verified directly against undici's real lockfile entry rather than assumed
  unaffected: `node_modules/undici` resolves to 7.29.1, license MIT, dev:false, so
  dependencyLicenses.test.ts (non-GPL, license recorded) and dependencyTelemetry.test.ts (no
  telemetry signature across the whole installed production closure) both cover it and pass.

  One defect found and fixed during this close-out review, in this session's OWN earlier edit to
  dependencyTelemetry.test.ts: the word-boundary form `\bsentry\b` was chosen to stop
  `previousEntry` false-positiving, and its comment claimed `_` is a non-word character. It is
  not -- `\w` includes `_` -- so that form silently MISSED `SENTRY_DSN`, `MY_SENTRY_KEY`, and
  `sentryClient`, all canonical real Sentry references, weakening a supply-chain gate on a
  safety-critical plugin. Verified empirically, then replaced with a one-sided leading boundary
  `(?<![a-z0-9])sentry`, which excludes `previousEntry` while matching all four real spellings,
  and the misleading comment was corrected.
commit: ef58074 ("fix: force HTTP/1.1 for vendor HTTP to avoid Node 26 h2 crash", 21 files,
  +453/-40, on features/phase-06-validated-release-candidate; all pre-commit hooks green
  including TruffleHog and gitlint, no --no-verify, no amend)
oracle_type: derived
files_changed:
  - src/cloud/httpDispatcher.ts (new)
  - src/cloud/api.ts
  - src/cloud/auth.ts
  - src/runtime/accountRuntime.ts
  - src/platform.ts
  - test/cloud/httpDispatcher.test.ts (new)
  - test/cloud/api.test.ts
  - test/cloud/auth.test.ts
  - test/cloud/alpnServer.ts (new, added earlier this session for the RED test)
  - test/platform.test.ts
  - test/runtime/accountRuntime.test.ts
  - test/packageManifest.test.ts
  - test/packaging/dependencyAllowlist.test.ts
  - test/packaging/dependencyTelemetry.test.ts
  - features/support/world.ts
  - features/real-pump/support/realWorld.ts
  - package.json
  - package-lock.json
  - .github/workflows/build.yml
  - .github/workflows/publish.yml
  - .github/workflows/package-audit.yml
