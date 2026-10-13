# Comment accuracy review

Scope: every comment in `src/**/*.ts` (43 files, 10,219 lines) plus the suppression
justification in `sonar-project.properties`. Whole-codebase review, not a diff review.
The four `features/refinements` changes were verified individually against their
surrounding prose.

Method: every comment that asserts something checkable was cross-read against the code
it sits on, against the pinned `@homebridge/hap-nodejs` and `eslint-plugin-sonarjs`
sources where it makes a claim about them, and against `test/` where it claims a test
pins a behaviour.

---

## Verification of the four flagged change sites

All four were checked first, because a freshly-stale comment there is the highest risk.

### `src/logging.ts` — three regexes converted to `String.raw` — CLEAN

No comment in the file describes escaping, backslash doubling, or template-literal
syntax. The two comment blocks near the patterns are:

- lines 10-13, "Each pattern keeps the naming part of its match … and replaces only the
  value that follows it" — still true; `redactText` replaces with `` `$1${REDACTED}` ``
  (line 65) and group 1 of each pattern is the name-and-separator prefix.
- lines 17-18, "A token carries dots, so the class holds one, but the match may not end
  on a dot" — describes `AUTHORIZATION_PATTERN` (line 19), which was **not** converted
  and is still a regex literal `/(Bearer\s+)[\w+/=-](?:[\w.+/=-]*[\w+/=-])?/g`. The
  inner class holds `.`, the first and last classes do not. Still accurate.

The conversion is also semantically inert: `` `…\\s…` `` and ``String.raw`…\s…` `` both
produce the two-character sequence `\s` in the pattern string.

### `src/config.ts` — `EMAIL_PATTERN` rewritten — no BLOCKING, one ADVISORY

The comment (lines 11-13) does not describe the pattern's shape, so the rewrite from
`/^[^\s@]+@[^\s@]+\.[^\s@]+$/` to `/^[^\s@]+@[^\s@][^\s@.]*\.[^\s@]+$/` did not
invalidate any structural claim. The two deliberately preserved acceptances are pinned
and explained in `test/config.test.ts:88-92`. See ADVISORY-4 for the residual issue with
"checks the same shape again".

### `src/platform.ts` — `DEFAULT_PLATFORM_DEPS` — CLEAN

`src/platform.ts:497-498`: "the record holds one function and nothing mutates it."
`PlatformDeps` (lines 493-495) declares exactly one member, `httpFetch: HttpFetch`. The
only use of `deps` in the file is the read at line 590 (`httpFetch: deps.httpFetch`).
Both halves of the claim hold.

### `src/accessories/basementGuardian.ts` — `connected: boolean` → `connectivity` — CLEAN

`src/accessories/basementGuardian.ts:397-401`: "The count only ever reads
`connectivity.connected`, never the device's own `data.offline` report … (RES-03,
D-016)." The rewritten body at line 403 is `return connectivity.connected ? 0 :
Math.min(previous + 1, threshold);`. The comment now reads *more* literally than before
the change, and the `data.offline` half still holds — the `offline` field is decoded
only into the `connectivity` scope (`src/device/gemini.ts:192`, `:331`) and no
projection or count reads `reportedOffline`. The parallel statement in
`src/accessories/serviceCatalogue.ts:621-624` agrees.

### `src/cloud/auth.ts` — new eslint-disable justification — CLEAN

`src/cloud/auth.ts:16-21` claims three things; all three verified:

1. The disable targets `sonarjs/no-clear-text-protocols` and that rule *is*
   `typescript:S5332` — `node_modules/eslint-plugin-sonarjs/types/S5332/generated-meta.d.ts`
   declares `sonarKey = "S5332"` and the README maps it to `no-clear-text-protocols`.
2. The rule really is active on this file — `eslint.config.js:104` spreads
   `sonarjs.configs.recommended.rules` over `src/**/*.ts`, and that config sets
   `sonarjs/no-clear-text-protocols: "error"`.
3. The `e1` entry exists and matches — `sonar-project.properties:26-29` sets
   `multicriteria.e1.ruleKey=typescript:S5332` and
   `e1.resourceKey=src/cloud/auth.ts`.

The `sonar-project.properties` justification (lines 21-26) and the `auth.ts` comment
tell the same story with the same reason. No drift.

---

## BLOCKING

### BLOCKING-1 — `src/runtime/accountRuntime.ts:493-501` — rationale attached to the wrong function

Two comment blocks are merged with no blank line between them, so the first paragraph
sits as the documentation for `commandTransportReadyNow`.

The wrong claim, at lines 493-501:

```
  // The trust is computed once and reported from that one value, so what the
  // plugin says about its own sight and what HomeKit marks cannot disagree.
  //
  // It runs on every poll outcome rather than from the poll loop alone, because
  // `launch()` records its own first inventory outcome without going through
  // that loop, and a report wired only into the loop would arrive a whole poll
  // interval late -- an hour at the configuration maximum. A poll a shutdown
  // aborted returns before both recorders, so it advances nothing and reports
  // nothing.
```

The code it is attached to, at lines 520-522:

```
  function commandTransportReadyNow(): boolean {
    return !stopped && !halted && polling;
  }
```

`commandTransportReadyNow` is a pure derivation over three flags. It does not "run on
every poll outcome", it is not "wired into the loop", it records nothing, and it is
reached from exactly one place — `monitoringTrustNow()` at line 544. The paragraph
describes `reportMonitoringHealth` (line 573), which *is* called from
`recordPollSuccess` (line 688), `recordPollFailure` (line 695) and the shadow-arrival
callback (line 808), and which `launch()` reaches through `recordPollSuccess` at line
996 without passing through `runPolls`. `reportMonitoringHealth` itself carries no
leading comment at all.

Why this is blocking rather than cosmetic: that paragraph is the only place the codebase
records *why* the trust report must be driven from the poll recorders rather than from
`runPolls`. `pollIntervalSeconds` accepts up to 3600 (`src/config.ts:24`), so a report
wired only into the loop arrives up to an hour late. A maintainer who reads the
paragraph as documentation for `commandTransportReadyNow` will not find that rationale
anywhere near the code it protects, and is free to move `reportMonitoringHealth()` into
`runPolls` — reintroducing exactly the hour-late trust report the paragraph exists to
prevent. The second, correct paragraph for `commandTransportReadyNow` begins mid-block
at line 502 ("Whether the plugin currently has a proven way to reach the vendor…"),
which is where the function's own documentation actually starts.

Fix: move lines 493-501 to sit above `function reportMonitoringHealth()` (line 573), and
leave lines 502-519 where they are.

Note: this is pre-existing (present in `b19ea58`), not introduced by
`features/refinements`.

### BLOCKING-2 — `src/device/state.ts:299-301` — states that no family adapter exists

The wrong claim:

```
// Compares the merged telemetry record key by key. This reports which keys
// moved and does not judge which of them matter, because no family adapter
// exists yet to define relevance (D-19).
function changedKeys(previous: ..., next: ...): readonly string[] {
```

The code that contradicts it: `src/device/gemini.ts:394-402` exports
`geminiFamily: DeviceFamily<GeminiDomainState>` with `implemented: true`, and
`src/device/registry.ts:59` registers it in the live registry
(`new Map([[geminiFamily.deviceTypeId, geminiFamily]])`). A family adapter exists, is
wired into production, and defines per-scope relevance for all eighteen telemetry fields
(`src/device/gemini.ts:169-193`).

Why this is blocking: the comment reads as a standing invitation — "once an adapter
exists, teach this function which keys matter." Acting on it is a safety regression.
`notify` (`src/device/state.ts:311-325`) early-returns when `changed.length === 0`, and
that notification is the *only* path a between-poll pump run reaches HomeKit on:
`src/platform.ts:173-177` subscribes `basementGuardianAccessory.update(next, 'live')` to
it, for the reason spelled out at `src/platform.ts:161-167` ("A backup pump runs for
seven to fifteen seconds and the default poll interval is about fifteen minutes … an
activation would almost never be observed at all"; SAFE-03, SAFE-07). Narrowing
`changedKeys` to family-defined "relevant" keys would silently suppress live updates for
any key the filter judged uninteresting, which is precisely a false all-clear on a
running pump.

Fix: state the actual reason the store stays family-neutral — the store decodes nothing
by design (`src/device/state.ts:17-23`, D-20/D-014), and relevance is decided downstream
by the accessory, not here — rather than describing an adapter gap that closed.

---

## ADVISORY

### ADVISORY-1 — `src/accessories/controls.ts:145-147` — HAP claim is false, but harmless

```
   * Calling it again on the same service registers no second handler, because
   * the accessory walks its whole catalogue on every update and HAP keeps only
   * the last handler registered while warning about the ones before it.
```

Two problems, neither of which produces a defect if acted on:

- The pinned HAP does **not** warn when `onSet` is called twice.
  `node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:1346-1353` is
  `onSet(handler) { … this.setHandler = handler; return this; }` — a silent overwrite.
  (The warning the file describes correctly elsewhere, at `controls.ts:584-585`, is a
  different one: `Characteristic.js:1801-1803` warns only when a `setHandler` and an
  `on('set')` listener coexist.)
- The stated mechanism is not what actually prevents re-registration. `bind` guards
  explicitly at `controls.ts:579-583` with `if (bound.has(service)) { return; }`. Under
  the comment's account that guard would be redundant.

Harmless because removing the `bound` guard would re-assign an equivalent closure on
every update with no warning and no behaviour change. Still worth correcting so the
guard's purpose is not mistaken for HAP's.

### ADVISORY-2 — `src/platform.ts:326` and `:329` — "fifteen services" is now seventeen

```
  // published all fifteen services onto that orphan, and registered a fresh
  …
  // while the plugin's own state reported fifteen healthy services.
```

`createServiceCatalogue` (`src/accessories/serviceCatalogue.ts:849-864`) assembles 17
rows: 2 water + 4 pump + 2 power + 2 battery + 4 fault + 2 control + 1 connectivity. All
17 project at least one value from a fully valid Gemini snapshot, and `ignoredFaults`
defaults to empty (`src/config.ts:180`), so the full-publish count is 17. The number is
narrative rather than load-bearing, but it is checkable and wrong.

### ADVISORY-3 — `src/accessories/customCharacteristics.ts:148` — "twelve" is now sixteen

```
  // One class factory, so twelve near-identical class bodies never exist.
```

`createCustomCharacteristics` returns 16 characteristics (16 `define({…})` calls;
`CustomCharacteristics` at lines 387-420 declares 16 members). The count was presumably
right before the four pump-record characteristics were added. The sibling comment in
`src/accessories/customServices.ts:287` ("four near-identical class bodies") is correct —
4 `define({…})` calls.

### ADVISORY-4 — `src/config.ts:11-13` — "the same shape" overstates the runtime check

```
// The practical RFC-5322 shape the settings form already enforces through
// `format: "email"`. A hand-edited config.json bypasses the form, so the
// runtime checks the same shape again.
```

`config.schema.json` does declare `"format": "email"` on the email property, so the first
sentence holds. But the runtime pattern is strictly looser than `format: "email"`: it
accepts `user@example..test` and `user@example.test.`, both of which a conforming email
format check rejects. That looseness is deliberate and is pinned with an explanation in
`test/config.test.ts:88-92` ("The consecutive-dot and trailing-dot domains are accepted
today and are recorded to hold that verdict still"), but nothing in `src/config.ts` says
so. A maintainer reading "the runtime checks the same shape again" could reasonably
tighten the pattern to match the form — refusing configurations that work today.

Not blocking: the pinned tests fail loudly on such a change, so the deliberate behaviour
cannot be undone silently. Suggested fix: say the runtime check is a deliberately looser
superset of the form's, and point at the pinned verdict list.

### ADVISORY-5 — `src/runtime/accountRuntime.ts:71` — forbidden GSD planning reference

```
// The vendor `deviceId` is the Phase 2 ruling's non-sensitive value, permitted
// in logs and in accessory context, and it names no route, header, credential
// or account (D-14, D-027, AUTH-02).
```

`.claude/rules/typescript-comments.md` forbids `Phase NN` references in comments; only
decision and requirement IDs are allowed as anchors. `D-027` is already carrying the
anchor here, so the phrase can simply be dropped.

Related: the same ruling is named three different ways across the codebase — "the Phase 2
ruling" here, "the 2026-08-29 ruling" at `src/accessories/controls.ts:514`, and an
unattributed "treated as non-sensitive here" at
`src/persistence/accessoryContext.ts:8-10`. `src/accessories/controls.ts:514`'s dated
form is also close to the rule's forbidden `(… UAT decision 2026-06-11)` shape. One
wording, anchored on `D-027`, would serve all three.

### ADVISORY-6 — `src/runtime/accountRuntime.ts:67-68` — line-number citations that rot

```
// `FailureLog` rate-limits per kind string (`src/runtime/failureLog.ts:45`,
// `:50-57`).
```

The substantive claim is true — `src/runtime/failureLog.ts:57` holds
`warnedAt = new Map<string, number>()` and lines 62-64 do the per-kind comparison. But
the cited lines do not show it: line 45 is mid-sentence in the factory JSDoc about the
reminder cadence, and `:50-57` spans three lines of that JSDoc before reaching the map.
Line-number references into another file rot on the first unrelated edit; naming the
symbol (`warnedAt`) would not.

### ADVISORY-7 — `src/accessories/serviceCatalogue.ts:979` — planning-artifact reference

```
 * This is the one act `03-CONTEXT.md` D-05 otherwise forbids.
```

`03-CONTEXT.md` resolves to `.planning/phases/03-safety-monitoring-in-homekit/03-CONTEXT.md`,
which is not shipped and is phase-scoped. `D-05` already anchors the claim on its own.
Same spirit as ADVISORY-5.

### ADVISORY-8 — `src/accessories/reconciliation.ts:45` — documented dependency is unused

```
/** Everything the reconciliation state machine needs, by injection. */
export interface ReconciliationOptions {
  clock: Clock;
  log: Logging;
}
```

`createReconciliation` reads `options.log` only; `options.clock` is never touched. The
doc line asserts the interface is what the module *needs*, and the clock is not. Either
drop `clock` (and its import at line 18) or say why it is reserved.

### ADVISORY-9 — `src/accessories/basementGuardian.ts:172-174` — comment describes a different symbol

```
// `mcu_firmware_version` is the only source for `FirmwareRevision`: the MCU
// governs pump control and is the safety-relevant firmware, so it is never
// compared against or blended with `wifi_firmware_version`.
const UNKNOWN_FIRMWARE = 'unknown';
```

The claim is true of `firmwareRevisionOf` (lines 262-266), which reads
`metadata.mcuFirmwareVersion` and nothing else. But it explains nothing about the
constant it is attached to — the fallback published when that field did not decode. The
constant's own meaning goes unstated.

### ADVISORY-10 — `src/index.ts:9-11` — "method" describes a function

```
/**
 * This method registers the platform with Homebridge
 */
export default function registerPlatform(api: API): void {
```

Template-inherited wording; the arrow-to-declaration change on this branch made it a
named function, not a method. Cosmetic.

---

## Notable comments that were checked and are correct

Recorded so a future pass does not re-audit them.

- `src/cloud/httpDispatcher.ts:1-19` — the `allowH2` narrative is consistent with
  `package.json` `engines.node` (`^22.10.0 || ^24.0.0 || ^26.0.0`), which the
  `package-lock.json` regeneration on this branch brought back into agreement.
- `src/accessories/serviceCatalogue.ts:990-993` — "a search for the forbidden act
  answers exactly one production call site": `publishPersistentFailure` has exactly one
  caller in `src/`, at `src/accessories/staleMarking.ts:172`.
- `src/accessories/serviceCatalogue.ts:997-998` — `test/accessories/hapWriteFidelity.test.ts`
  exists.
- `src/cloud/api.ts:230-234` — "a unit test asserts this exact value set":
  `test/cloud/api.test.ts:203` does `assert.deepStrictEqual(ROUTES, {…})`.
- `src/accessories/serviceCatalogue.ts:216-221` — "`stale` stays outside it because
  nothing assigns it": `'stale'` appears in `src/` only in the `DistrustReason` union at
  `src/device/health.ts:37`.
- `src/device/health.ts:12-15` — "Every declaration here has a production consumer
  except `DeviceHealth`": `DeviceHealth` is referenced nowhere else in `src/`.
- `src/device/events.ts:13-14` — the `ignoreFindings` entry for `src/device/events.ts`
  is present in `.fallowrc.json`.
- `src/accessories/basementGuardian.ts:346-347` — "`TRUST_SCOPES` has eight members":
  it does (line 183).
- `src/protocol.ts:11-16` — "These six values": `ProtocolConstants` declares six.
- `src/cloud/shadow.ts:2-4` — "Nothing here logs a topic, a device identifier, a URL, or
  a payload": every log call in the file is a fixed string.
- `src/accessories/controls.ts:18-30` — both stated HAP behaviours check out against
  `Characteristic.js:1799-1832` (a rejected write sets `statusCode` and throws without
  assigning `this.value`).
- `src/device/gemini.ts:167-168` — "the only two optional telemetry fields; every other
  of the 16 is required": 18 checks, 2 optional, 16 required.

BLOCKING_COUNT: 2
