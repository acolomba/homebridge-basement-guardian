---
phase: 1
slug: secure-cloud-foundation
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-28
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `01-RESEARCH.md` § Validation Architecture. Task IDs are filled in once plans exist.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` (Node ≥ 22 built-in) + `node:assert/strict` + `strong-mock` ^9.2.2 for unit tests; `@cucumber/cucumber` ^13.2.1 for transport-level tests |
| **Config file** | `tsconfig.test.json` — none yet, Wave 0 creates it. `cucumber.json` — none yet, Wave 0 creates it |
| **Quick run command** | `npm run build:test && node --test dist-test/test/<path>.test.js` |
| **Full suite command** | `npm test` → `npm run test:unit && npm run test:cucumber` (`D-12`) |
| **Estimated runtime** | Unit suite seconds; Cucumber suite tens of seconds (in-process broker, ephemeral ports, no network) |

**Coverage enforcement** (verified during research): `node --test --experimental-test-coverage --test-coverage-lines=100 --test-coverage-branches=100 --test-coverage-functions=100 --test-coverage-include='<emitted file>' <emitted test>` exits `1` below threshold and `0` at or above it. This is the mechanism behind the `test:coverage:direct` script the project test rules reference.

---

## Sampling Rate

- **After every task commit:** `npm run build:test && node --test dist-test/test/<module touched>.test.js`, plus `npx eslint <changed files> --max-warnings=0`
- **After every plan wave:** `npm test` (both suites, per `D-12`)
- **Before `/gsd-verify-work`:** `npm run check` fully green — `typecheck`, `lint`, `fallow` (all three sub-commands), `format:check`, `test` — plus an `npm pack --dry-run` inspection confirming the `D-21` allowlist holds: `dist/` (including the `D-07` JSON constants file) and `config.schema.json` present; `features/`, `.claude/`, `.pi/`, and `research.tar.gz` absent
- **Max feedback latency:** under 30 seconds for the per-task quick run

---

## Per-Task Verification Map

Task IDs are assigned when plans are written; this map is seeded by requirement so no requirement can be planned without a verification.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | CONF-01 | — | N/A | unit | `node --test dist-test/test/index.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | CONF-02 | — | Password field masked; plaintext disclosure present | unit | `node --test dist-test/test/configSchema.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | CONF-03 | — | No lifecycle listener registered without credentials | unit | `node --test dist-test/test/platform.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | CONF-03 | — | Nothing starts when credentials absent | cucumber | `cucumber-js features/configuration.feature` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | CONF-04 | — | Only `clientId` overridable; other constants internal | unit | `node --test dist-test/test/config.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | CONF-05 | — | Out-of-range values refuse startup (`D-16`) | unit (data-driven) | `node --test dist-test/test/config.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AUTH-01 | — | Valid cached token reused without network call | unit | `node --test dist-test/test/cloud/auth.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AUTH-01 | — | Cache miss performs password-realm grant and caches | cucumber | `cucumber-js features/authentication.feature` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AUTH-01 | — | Changed configured email invalidates cache (`D-08`) | unit | `node --test dist-test/test/cloud/auth.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AUTH-01 | — | `invalid_grant` stops auth, deletes cache, no retry (`D-13`) | cucumber | `cucumber-js features/authentication.feature` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AUTH-01 | — | HTTP 429 retries on long backoff, not the stop path (`D-22`) | unit (fake clock) | `node --test dist-test/test/cloud/auth.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AUTH-02 | T-1-01 | Token cache under `api.user.storagePath()` at mode `0600` **after a second write** | unit | `node --test dist-test/test/cloud/auth.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AUTH-02 | T-1-02 | Redacting logger scrubs passwords, `Bearer` tokens, `AccessKeyId`, `SecretAccessKey`, `SessionToken`, and auth bodies across all seven `Logging` members (`D-18`) | unit | `node --test dist-test/test/logging.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SYNC-01 | — | Four routes only; correct method, path, `Authorization`; no excluded route touched | unit | `node --test dist-test/test/cloud/api.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SYNC-01 | — | Request aborts on root signal and on its own deadline | unit | `node --test dist-test/test/cloud/api.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SYNC-02 | — | Partial `reported` patch merges without removing omitted fields | unit | `node --test dist-test/test/device/state.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SYNC-02 | — | `desired` never becomes reported state; `desired: null` is acknowledgement | unit | `node --test dist-test/test/device/state.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SYNC-02 | — | Repeated identical patch produces no spurious `changedKeys` (`D-19`) | unit | `node --test dist-test/test/device/state.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SYNC-02 | — | Out-of-order (older `version`) shadow message discarded | unit | `node --test dist-test/test/cloud/shadow.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SYNC-02 | — | Real partial heartbeat over fake broker preserves pump and power fields | cucumber | `cucumber-js features/shadowMerge.feature` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SYNC-03 | — | Full-shadow `get` published on connect and on every reconnect | cucumber | `cucumber-js features/shadowLifecycle.feature` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SYNC-03 | — | REST poll reconciles state missed while disconnected | cucumber | `cucumber-js features/shadowLifecycle.feature` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SYNC-04 | — | Rotation timer fires ~10 min before `Expiration`, reschedules from new expiry | unit (fake clock) | `node --test dist-test/test/runtime/accountRuntime.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SYNC-04 | — | Failed refresh still reschedules (the `finally`) | unit (fake clock) | `node --test dist-test/test/runtime/accountRuntime.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SYNC-04 | — | Rotation does not disconnect the live socket; next handshake carries rotated credentials and new client ID | cucumber | `cucumber-js features/credentialRotation.feature` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SYNC-04 | T-1-03 | SigV4 presigner reproduces fixed golden vectors under a fixed clock | unit | `node --test dist-test/test/cloud/shadow.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SYNC-04 | — | Reconnect backoff capped; duplicate `error` + `close` yields one retry | unit (fake clock) | `node --test dist-test/test/runtime/retryPolicy.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SYNC-05 | — | `stop()` idempotent: twice, and after partial startup, leaves no timers and raises nothing | unit | `node --test dist-test/test/runtime/accountRuntime.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SYNC-05 | — | Shutdown during in-flight retry wait, in-flight fetch, and open socket produces no unhandled rejection | cucumber | `cucumber-js features/lifecycle.feature` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | D-15 | — | Shadow connect failure leaves runtime up on REST only, logs degraded path once | cucumber | `cucumber-js features/degradedOperation.feature` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | D-14 | — | Sustained transient failure warns once, drops to debug, reminds every 15 min, logs recovery at info | unit (fake clock) | `node --test dist-test/test/runtime/accountRuntime.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | D-21 | — | `npm pack --dry-run` lists only allowlisted files; `.claude/`, `.pi/`, `features/`, `research.tar.gz` absent | unit (script assertion) | `npm pack --dry-run --json` inspection | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tsconfig.test.json` — the `D-09` second build config; also the fix for the typed-ESLint parsing failure
- [ ] `eslint.config.js` — change `projectService: true` to `project: ['./tsconfig.json', './tsconfig.test.json']`
- [ ] `eslint.config.js` — scoped override or a `void` convention for `@typescript-eslint/no-floating-promises` in `test/**/*.ts`
- [ ] `cucumber.json` — `default` and `real` profiles
- [ ] `package.json` scripts — `build:test`, `test:unit`, `test:cucumber`, `test`, `test:coverage:direct`, `test:coverage:all`
- [ ] Framework install: `npm install --save-dev @cucumber/cucumber aedes ws strong-mock`
- [ ] Runtime install: `npm install mqtt`
- [ ] `features/support/world.ts` — typed `World` with fake cloud, plugin harness, injectable clock, observations, cleanup
- [ ] `features/support/fakeAuth0.ts`, `features/support/fakeRestApi.ts` — `node:http` servers on ephemeral ports
- [ ] `features/support/fakeShadowBroker.ts` — `aedes` + `ws` + the coalescing `Duplex` bridge (mqtt.js writes CONNECT as nine WebSocket frames; aedes reads one chunk per `readable` event, so the naive `ws.createWebSocketStream` pairing hangs with no error)
- [ ] `features/support/fakeHomebridgeApi.ts` — minimal `API` with `hap`, `user.storagePath()`, `on`, `platformAccessory`
- [ ] Delete `test/plugin.test.mjs` once the mirrored `test/**/*.test.ts` suite exists
- [ ] `.gitignore`, `.prettierignore`, `eslint.config.js` ignores, and the `D-21` packaging allowlist all account for `dist-test/`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The Homebridge Plugin Settings form renders the account fields, masks the password, and shows the plaintext-storage disclosure | CONF-02, success criterion 1 | The form is rendered by ng-formworks inside Homebridge UI; no automated harness renders it | Run `npm run watch`, open the Homebridge UI, open Basement Guardian settings, confirm the header disclosure text, the masked password input, and that saving with an empty required field is refused |
| Real vendor cloud discovery, initial REST state, heartbeats, and shutdown | REL-09 | Requires live credentials and real hardware; must never run in CI | Opt-in `@real @read-only` Cucumber profile, Phase 6 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
