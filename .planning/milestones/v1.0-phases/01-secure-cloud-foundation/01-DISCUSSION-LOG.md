# Phase 1: Secure Cloud Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-28
**Phase:** 1-Secure Cloud Foundation
**Areas discussed:** Template teardown scope, Cloud transport dependencies, TS test setup and test depth, Failure and retry behavior, Architecture (second round)

---

## Template teardown scope

### How much of the template scaffold does Phase 1 remove?

| Option | Description | Selected |
|--------|-------------|----------|
| Full teardown | Delete platformAccessory.ts, EXAMPLE_DEVICES, Lightbulb, motion sensors, setInterval; platform.ts becomes a composition root | ✓ |
| Strip behavior, keep the file | Remove example devices and the timer, keep platformAccessory.ts as a stub for Phase 2 | |
| Leave scaffold until Phase 2 | Build the cloud runtime alongside untouched template accessories | |

### homebridge-lib, whose only import is EveHomeKitTypes

| Option | Description | Selected |
|--------|-------------|----------|
| Remove it fully in Phase 1 | Drop import, type shim, and package.json dependency; update the STATE.md todo | ✓ |
| Drop import now, dep in Phase 6 | Remove usage but keep the declared dependency as STATE.md records | |
| Keep everything until Phase 6 | Preserve import and dependency exactly as recorded | |

**Notes:** STATE.md had deferred this to Phase 6. Full teardown orphans the only consumer, and `D-033` requires removal regardless, so the todo moves rather than the code waiting.

### What Phase 1 leaves visible in HomeKit

| Option | Description | Selected |
|--------|-------------|----------|
| Nothing; leave cache alone | Register nothing; restored accessories recorded but untouched, no unregister call | ✓ |
| Nothing, and evict template leftovers | Also unregister template-era cached accessories for a clean dev bridge | |
| Publish a status placeholder | One minimal accessory reflecting runtime health | |

### How far config.schema.json goes

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 1 fields only | strictValidation true, password disclosure, CONF-02 through CONF-05 fields; ignoredFaults to Phase 3 | ✓ |
| Write the whole schema now | Add ignoredFaults and its seven-slug enum at the same time | |

---

## Cloud transport dependencies

**Notes:** The first framing of this area was rejected. It recommended `aws-iot-device-sdk` v1 on the grounds that `aws-crt`'s install script would compile native code on Homebridge hosts. The user pushed back on both points — that a post-install compile seemed unlikely, and that a deprecated library was not acceptable. Both objections were correct. Re-research established that v1's README declares maintenance mode ("will no longer receive feature updates"), and that `aws-crt` ships prebuilt N-API binaries covering linux x64/arm64 in both glibc and musl, macOS, and win32-x64, with `install.js` exiting immediately when the matching binary is present. The question was re-asked with corrected facts.

### Which AWS IoT client

| Option | Description | Selected |
|--------|-------------|----------|
| mqtt 5.x + own SigV4 | Current deps, transformWsUrl re-signs on every reconnect, ~60 lines of signing we own and test | |
| aws-iot-device-sdk-v2 | AWS-supported, prebuilt binaries, but no JS credentials provider so rotation becomes a client rebuild | |
| aws-iot-device-sdk v1 | Has in-place updateWebSocketCredentials(), but maintenance mode and pins mqtt@4.2.8 | |
| Research it before deciding | Defer to gsd-phase-researcher with a prototype and verification directive | ✓ |

**Notes:** The deciding finding was that `aws-crt`'s `AwsCredentialsProvider` exposes only `newDefault`, `newStatic`, `newCognito`, and `newX509`, with source stating "We don't currently expose an interface for fetching credentials from Javascript." Vendor STS credentials therefore cannot be refreshed in place under v2. Rather than accept a judgment call on the most load-bearing dependency, the choice goes to research with three required outputs recorded in CONTEXT.md.

### REST client

| Option | Description | Selected |
|--------|-------------|----------|
| Built-in fetch | Global fetch with AbortSignal, zero dependencies, timeout via AbortSignal.timeout() | ✓ |
| undici explicitly | Direct dependency for Dispatcher, pooling, interceptors | |
| axios or got | Conventional client with interceptors and retry | |

### Bundled protocol constants

| Option | Description | Selected |
|--------|-------------|----------|
| JSON data file | One file via resolveJsonModule, matching the REL-04 carve-out for scanning | ✓ |
| TypeScript const module | Frozen consts in src/cloud/vendorDefaults.ts | |

### Token cache contents

| Option | Description | Selected |
|--------|-------------|----------|
| Token + expiry + account fingerprint | Salted email hash so an account change invalidates the cache | ✓ |
| Token + expiry only | Simpler file, but an email change reuses the old account's token | |
| Token only, decode exp at load | Smallest file, parses a JWT we never verify | |

---

## TS test setup and test depth

**Notes:** Verified locally before asking. Node rejects `TypeScript parameter property is not supported in strip-only mode` and `TypeScript enum is not supported in strip-only mode`. Both patterns are already in play — `src/platform.ts` uses parameter properties for constructor DI, and the intel's service-subtype example uses `const enum`.

### How unit tests run

| Option | Description | Selected |
|--------|-------------|----------|
| Compile, then test | tsc emits, node --test runs emitted JS with source maps; full TS language preserved | ✓ |
| Native type stripping | No build step, but bans parameter properties and enums across src/ | |
| tsx devDependency | Full TS with no build step, one more dependency and a transform production never uses | |

### When the Cucumber harness is built

| Option | Description | Selected |
|--------|-------------|----------|
| Build it in Phase 1 | Fake cloud is the natural companion to the cloud layer; criteria 3 and 4 need it | ✓ |
| Minimal harness now, expand in Phase 2 | Endpoints exist, only happy-path scenarios wired | |
| Defer entirely to Phase 2 | Units only in Phase 1 | |

### Where tests substitute the cloud

| Option | Description | Selected |
|--------|-------------|----------|
| Both, by layer | Interface fakes for units, transport fakes for Cucumber so they survive the SDK decision | ✓ |
| Transport level only | Highest confidence, but every unit test pays socket setup | |
| Interface level only | Fastest, but never exercises the real SDK | |

### Test script topology

| Option | Description | Selected |
|--------|-------------|----------|
| Split scripts, check runs both | npm test units only, test:features for Cucumber, check runs both | |
| npm test runs both suites | One command covers everything; nothing skipped by accident | ✓ |
| Fully separate, CI composes | Local check never runs Cucumber | |

---

## Failure and retry behavior

**Notes:** Researched before asking. Auth0 brute-force blocks persist for 30 days from the *last* failed attempt and can block the account rather than only the IP, which makes indefinite retry actively harmful.

### Auth0 credential rejection

| Option | Description | Selected |
|--------|-------------|----------|
| Stop; wait for user action | One actionable error, delete cached token, no retry until restart or config change | ✓ |
| Retry on a long interval | Roughly hourly, recovers without touching Homebridge | |
| Retry with capped backoff | Fastest recovery from a misreported outage, highest lockout risk | |

### Log volume during a sustained outage

| Option | Description | Selected |
|--------|-------------|----------|
| Warn once, then throttle | First at warn, consecutive at debug, warn reminder every 15 min, recovery at info | ✓ |
| Warn on every failure | Nothing hidden, roughly 120 warn lines per hour | |
| Warn once, then silent | Quietest, but no indication the plugin is still failing | |

### REST up, shadow down

| Option | Description | Selected |
|--------|-------------|----------|
| Run degraded on REST only | Runtime stays up, shadow retried in background, degradation logged once | ✓ |
| Abort and retry the whole start | Simpler invariant, discards working REST state | |
| Block startup until both connect | Cleanest contract, but reports nothing during a shadow outage | |

### Out-of-range hand-edited config

| Option | Description | Selected |
|--------|-------------|----------|
| Clamp into range and warn | Matches the intel's Math.max snippet; monitoring never lost to a typo | |
| Fall back to the default and warn | Honest, but silently ignores a stated preference | |
| Refuse to start | Treated like missing credentials: actionable error, start nothing | ✓ |

**Notes:** The user overrode the clamping recommendation. Strictness about configuration is the house position; recorded in CONTEXT.md as an explicit instruction not to clamp.

---

## Architecture (second round)

### Source layout

| Option | Description | Selected |
|--------|-------------|----------|
| ARCHITECTURE tree, build as needed | Fuller tree, only directories actually filled | |
| ARCHITECTURE tree, scaffold it all | Whole tree created now with placeholders | ✓ |
| Flatter PLUGIN tree | No runtime/ or persistence/ split, AccountRuntime folded into platform.ts | |

**Notes:** Scaffolding unreferenced modules conflicts with `.fallowrc.json`'s dead-code gate, which `npm run check` runs with `--fail-on-issues`. Recorded in CONTEXT.md as a conflict the planner must resolve rather than discover during execution.

### Secret redaction

| Option | Description | Selected |
|--------|-------------|----------|
| Redacting logger wrapper | One wrapper scrubs registered values and known patterns before delegating | ✓ |
| Typed error mapper only | Single toSafeError(), relies on every call site using it | |
| Both layers | Strongest guarantee, two mechanisms, wrapper can mask a mapper bug | |

### Store change notification

| Option | Description | Selected |
|--------|-------------|----------|
| Notify with a changed-keys set | (next, previous, changedKeys); relevance filtering left to Phase 3 | ✓ |
| Notify on any change | Consumers diff for themselves | |
| Narrow selectors from the start | Best long-run ergonomics, built for consumers that do not exist yet | |

### Phase 1 snapshot contents

| Option | Description | Selected |
|--------|-------------|----------|
| Typed envelope, opaque data | Type identity, connectivity, timestamps; carry reported data undecoded | ✓ |
| Pass-through family hook now | Define the seam with a no-op implementation | |
| Decode Gemini fields now | Pulls DEV-03 validation forward into Phase 1 | |

---

## Claude's Discretion

- Injectable clock shape and how it reaches retry, timeout, and heartbeat-age code.
- Whether the REST poll timer and credential rotation timer share one scheduler.
- Whether AccountRuntime exposes only start/stop or also a health projection for Phase 5.
- Internal module naming, error type hierarchy, and the typed fetch wrapper API.
- Backoff constants, within the intel's capped shape with a re-entrancy guard.

## Deferred Ideas

- `ignoredFaults` schema field and enum — Phase 3 (CONF-06).
- Conservative accessory removal policy — Phase 2 (DEV-05, D-029).
- Family registry and startup validation ladder — Phase 2 (DEV-02, DEV-03).
- Offline confirmation behavior — Phase 5 (RES-03).
- License metadata alignment and removal of `private: true` — Phase 6.
- Backup-battery fault adapter proposal — Phase 3 discussion.
