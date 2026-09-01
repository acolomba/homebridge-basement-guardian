# Phase 5: Degraded Operation and Recovery - Context

**Gathered:** 2026-09-01
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers `RES-04` in full, and the one remaining sentence of `RES-03` that Phase 3
deliberately left behind (`03-CONTEXT.md` D-09): separating a lost monitoring path from a
vendor-confirmed offline device, without raising a false physical-device alert.

**Phase 3 already shipped, and this phase does not rebuild:** the offline-confirmation counter and
the `Basement Guardian Offline` adapter; `Pump Controller Link Lost` on
`serial_communications === false`; the per-scope preserve-and-mark invariant (`D-014`); and
`StatusActive = false` as the degradation signal, whose Apple Home rendering was confirmed against a
real paired home on 2026-08-31.

**This phase adds:** a degraded-monitoring-path state distinct from device offline; cached-state
operation across a restart with no fresh cloud data; command gating until state and command
transport both return; a distinct persistent presentation for credential rejection; and the clearing
rules for all of it.

**Out of scope:** anything that changes what `Basement Guardian Offline` or `Pump Controller Link
Lost` mean. Those two adapters assert facts about the *device*. Everything this phase adds asserts a
fact about *the plugin's ability to observe*, and success criterion 2 requires the two to stay
distinguishable.

</domain>

<decisions>
## Implementation Decisions

### Degraded monitoring path — how it becomes visible

- **D-01 — The signal is `StatusActive = false`, not a new adapter and not a new characteristic:**
  Success criterion 2 forbids using `Basement Guardian Offline` or `Pump Controller Link Lost` for a
  monitoring-path failure, because those assert something about the device while this asserts
  something about us. `StatusActive` already carries exactly the claim needed — "do not trust this
  reading right now" — and Phase 3 confirmed against a real paired Apple Home that it draws a
  `Status Active — No` row under Details, keeps the tile present, and retains the last value. No new
  HomeKit surface is introduced.

- **D-02 — A monitoring-path degradation marks every scope on every accessory:** A transport outage
  is global — one REST poll and one MQTT connection per account, not per field — so the per-scope
  shape `D-014` uses for field validation does not fit it. If the plugin cannot see the device,
  nothing it displays is fresh, so nothing may read as trustworthy. Preserve-and-mark still holds:
  values are retained, only trust is withdrawn. The accepted cost is that a whole home of
  accessories goes `Status Active — No` at once, which is the truthful reading.

- **D-03 — The resulting double meaning is accepted and resolved outside HomeKit:** `StatusActive`
  now means both "this field failed validation" (Phase 3) and "we cannot see the device at all"
  (this phase). `03-CONTEXT.md` D-06 refused to overload `StatusActive` for the pending window on
  exactly this ground, and the distinction here is different in kind: the two are not rival
  explanations, because when the monitoring path is down every field is untrustworthy anyway. The
  distinction matters for diagnosis, not for safety. HomeKit therefore carries one signal with one
  meaning — untrustworthy — while the `FailureLog` line and the existing
  `ControllerDataLastTrustedAt` characteristic tell a diagnosing user which cause it was.

- **D-04 — REST and shadow are distinguished, and only shadow loss withdraws trust:** The two
  transports fail independently and cost different things.
  - *REST down, shadow alive:* live pushes still arrive, so state is current and only the
    reconciliation backstop is missing. Reported in logs and diagnostics; **does not** mark HomeKit.
  - *Shadow down, REST alive:* polls still arrive about every fifteen minutes, but a pump run lasts
    7–15 seconds and can begin and end entirely between two polls. `Primary Pump Running` would
    never fire and the primary activation count would silently stop advancing, with nothing looking
    wrong. **This marks scopes untrustworthy.** It is the false-normal case this project exists to
    prevent, and Phase 4's README already records that live shadow delivery is what makes primary
    counting work at all.
  - *Both down:* everything is marked.

- **D-05 — The threshold mirrors the shapes already ratified, rather than inventing a number:** Two
  consecutive failed REST polls, or two missed heartbeats of shadow silence, marks the path
  degraded. `RES-01` already fixes the shadow half — the device heartbeat is approximately 898
  seconds, roughly fifteen minutes of silence is normal, silence is a secondary staleness signal
  only after two missed heartbeats, and one missed heartbeat is never evidence of anything. Two is
  also `offlineConfirmationPollCount`'s default. One transient blip never trips it.
  `offlineConfirmationPollCount` itself is **not** reused for REST failures: it counts *successful*
  snapshots reporting disconnected, a failed request is explicitly not a snapshot (`D-016`), and
  raising it to 8 for offline confirmation must not silently slow degradation reporting.

### Restart on cached state

- **D-06 — Cached values publish with `StatusActive = false` immediately, from the first update:**
  `RES-04` requires accessories to stay present and visibly stale. There is no unmarked window: a
  restart before the first poll means the plugin has never had current data this run, and a stale
  value that reads as trustworthy is the false normal the project forbids. A restart is usually
  seconds from its first poll, so the marked window is short in practice — and when it is not short,
  that is precisely when a user should see it.

- **D-07 — Commands gate on two separate predicates, refused separately:** Success criterion 3 says
  commands stay disabled until valid state **and** command transport return, and those can differ —
  a fresh shadow snapshot can arrive while REST authentication has not completed, or the reverse.
  The binder consults two distinct predicates, each with its own log line naming which one blocked,
  so a user diagnosing a refused press learns whether the plugin lacks state or lacks a way to send.
  Phase 4's binder already takes `offlineConfirmed` as an injected predicate, so this is a known
  shape rather than a new one.

- **D-08 — The new refusal cause answers `NOT_ALLOWED_IN_CURRENT_STATE` (-70412):** It reuses the
  status the offline refusal already answers, because the condition is the same shape — the plugin
  will not act because the device's current state is unknown. `RESOURCE_BUSY` reads as contention
  and is already taken by duplicate-while-active; `SERVICE_COMMUNICATION_FAILURE` is already taken
  by a vendor-answered error and reusing it would blur a vendor refusal with a local one, which is
  the distinction `04-CONTEXT.md` D-04's per-cause table exists to preserve. Both new predicates
  answer -70412; the log line carries the distinction.

  `04-CONTEXT.md` D-04's residual applies unchanged: a refused press leaves the characteristic
  answering that status to every read until the macrotask clearing push lands.

- **D-09 — "Getters return cached values without network calls" is proven structurally, not built:**
  Phase 3 built the accessory to publish state rather than answer pull-style getters — values are
  pushed on `update()` and HAP serves the last pushed value — so this is very likely already true by
  construction. Treat it as an invariant to assert rather than a feature to add: a static gate in
  the spirit of Phase 3's import gate and the `update()` timer-freedom assertion, proving no
  accessory read path can reach the cloud client. Cheap, and it stays true as later code lands.

  The gate must be proven non-vacuous the way Phase 3 proved its own — plant a violating read path,
  watch the gate fail, remove it. An unlisted module and a clean module produce the identical green.

### Credential rejection

- **D-10 — Credential rejection alone may use `HapStatusError`, amending `03-CONTEXT.md` D-05:**
  This is a deliberate, narrow exception to a locked Phase 3 decision, not a bypass. D-05 forbids
  `HapStatusError` because it produces "No Response", and that decision governs degradation
  reporting — which is what credential rejection is. Phase 4 could use `HapStatusError` only because
  `04-CONTEXT.md` D-04 governs *command refusal*, a different act; no such gap exists here.

  The exception is granted because credential rejection is unlike every other failure in this phase:
  it never self-clears, and `D-13` records that the vendor lifts a brute-force block only **thirty
  days after the last attempt**, so an automatic retry does not merely fail — it extends the
  lockout. `src/cloud/auth.ts` already stops the client for good on a refusal. "Requiring user
  action" is literal, and a `Status Active — No` row under Details is too easy to miss for a failure
  only the user can resolve.

  **This carries a measured risk and a real-home check.** A No Response accessory is greyed out in
  Apple Home, which sits in tension with `RES-04`'s own "accessories remain present and visibly
  stale" — preserve-and-mark risks becoming preserve-and-hide. Phase 3's still-open check 1 is
  already testing whether a *degraded* scope still fires automations; No Response is a stronger form
  of the same question and nobody has tested it. This phase must raise a human-verification item:
  confirm a No Response accessory still lets a user reach cached values, and confirm what happens to
  automations built on it. A negative finding reopens D-10, not `RES-04`.
  — **Reversibility:** costly — the amendment is one narrow branch, but it edits a locked Phase 3
  decision that the whole degradation design rests on, so reversing it means revisiting D-05's text
  as well as the code.

### Clearing

- **D-11 — One valid observation clears its own cause; the asymmetry is deliberate:** Two failures
  withdraw trust so a blip cannot flap it, but a single good observation restores it, because a good
  observation is direct evidence and Phase 3 established that recovery is immediate on valid data
  rather than delayed by a confirmation count. Clearing is **matched to cause**: a successful REST
  poll clears the REST degradation, a shadow message clears the shadow one, and a family-valid field
  clears its own scope's validation failure. A REST poll must not clear a shadow-silence
  degradation — shadow silence is precisely the case where REST still works while live signals go
  unobserved, so that would restore trust the plugin has not earned.

### Claude's Discretion

- Module layout and file names behind every decision above, and whether the degraded-path state
  lives in a new module or extends an existing one.
- How the two command-gating predicates are represented on the binder's options — two functions, a
  small readiness object, or a discriminated union — provided each refusal can name which one
  blocked.
- Exact wording of every log line, subject to `AUTH-02` (no URL, header value, token, or response
  body) and to the 2026-08-29 ruling that a vendor `deviceId` **is** admitted to logs.
- Whether the REST-failure counter reuses `reconciliation.ts`'s existing counting shape or gets its
  own.
- The `FailureLog` `kind` strings, subject to that module's existing convention: a capitalized noun
  phrase reading as the subject of the recovery sentence.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The requirements this phase delivers
- `.planning/REQUIREMENTS.md` RES-03 — the delivery split is recorded inline: Phase 3 delivered the
  counter and the adapter, Phase 5 delivers the remaining sentence.
- `.planning/REQUIREMENTS.md` RES-04 — the whole of it, and the only requirement still `Pending`
  after Phase 4.
- `.planning/REQUIREMENTS.md` RES-01 — **not** delivered here, but it fixes the heartbeat and
  shadow-silence rules D-05 mirrors. Do not contradict it.
- `.planning/REQUIREMENTS.md` CONF-05 — `offlineConfirmationPollCount` bounds and the worst-case
  confirmation arithmetic.

### Locked decisions this phase depends on or amends
- `.planning/phases/03-safety-monitoring-in-homekit/03-CONTEXT.md` D-05 — forbids `HapStatusError`
  for degradation reporting. **D-10 amends it, narrowly.** Read D-05's own reasoning before acting.
- `.planning/phases/03-safety-monitoring-in-homekit/03-CONTEXT.md` D-06 — refused to overload
  `StatusActive` for the pending window. D-03 accepts a different overload and says why.
- `.planning/phases/03-safety-monitoring-in-homekit/03-CONTEXT.md` D-09 — the Phase 3 / Phase 5
  delivery split for the offline counter.
- `.planning/phases/04-pump-records-and-official-controls/04-CONTEXT.md` D-04 — the per-cause HAP
  status table D-08 extends, and the macrotask clearing push whose residual still applies.
- `.planning/PROJECT.md` D-014 — preserve-and-mark: keep the last valid value, fault the narrowest
  owning scope. D-02 widens the scope to global for a global cause without weakening the invariant.
- `.planning/PROJECT.md` D-016 — `data.offline` is corroboration only; a failed REST request is not
  a snapshot.
- `.planning/PROJECT.md` D-13 — the thirty-day brute-force block that makes credential retry
  harmful.

### Protocol facts
- `.planning/intel/constraints.md` — the measured wire shapes. The heartbeat interval, the shadow
  silence window, and the REST snapshot shape all live here. Never invent a value this file can
  supply.

### Prior phase context
- `.planning/phases/04-pump-records-and-official-controls/04-VERIFICATION.md` — read the carried
  warning: mutating away the pending-window withholding leaves all 78 Cucumber scenarios green. This
  phase touches the same projection path.
- `.planning/phases/04-pump-records-and-official-controls/04-UAT.md` — the open human items. D-10's
  new check joins this session.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/runtime/failureLog.ts` — rate-limited reporting keyed by a `kind` noun phrase, with
  `recordFailure` / `recordSuccess` and a 900-second reminder cadence. This is the established home
  for transient runtime failure reporting and is where D-03's diagnostic distinction lives.
- `src/accessories/serviceCatalogue.ts` — `offlineConfirmed` is already a `ProjectionInput` member
  and `published()` already drops `undefined` candidates, which is the whole withholding mechanism.
- `src/accessories/controls.ts` — the binder already takes `offlineConfirmed` as an injected
  predicate and already owns the six-cause local refusal table D-08 extends.
- `src/runtime/reconciliation.ts` — an existing consecutive-observation counter with confirmation
  semantics, the closest analog to D-05's REST failure counter.
- `src/cloud/auth.ts` — `AuthRejectedError`, the `HALTED` message and the rejection advice already
  exist; D-10 changes how that state reaches HomeKit, not how it is detected.
- `src/persistence/accessoryContext.ts` — the typed accessory context Phase 4 widened; the cached
  state D-06 publishes from.

### Established Patterns
- Every port is one interface plus a `system*` const, wired at the composition root only
  (`src/runtime/clock.ts` is the 15-line template).
- Degradation is expressed by withholding or by `StatusActive`, never by throwing — except for the
  one amendment D-10 records.
- A defensive guard behind a validation gate is covered by constructing the broken contract it
  names, never by a coverage exception or a silent default.

### Integration Points
- `src/platform.ts` — `configureAccessory` restores cached accessories; D-06's first-update
  behaviour is decided here or immediately downstream.
- `src/runtime/accountRuntime.ts` — owns the REST poll loop and the shadow subscription, so both
  halves of D-04's transport distinction are observable from here.
- `src/accessories/basementGuardian.ts` — where a global trust withdrawal (D-02) has to reach every
  published scope.

</code_context>

<specifics>
## Specific Ideas

- The shadow-loss case (D-04) is the one the maintainer singled out as mattering most, because it is
  invisible: REST keeps working, every tile looks normal, and the plugin simply stops seeing short
  pump runs. Any plan that treats the two transports as interchangeable has missed the point of this
  phase.
- D-05's thresholds were chosen to reuse reasoning already ratified rather than to introduce a new
  tunable. Resist adding a config knob for them without asking.

</specifics>

<deferred>
## Deferred Ideas

- **A vendor characteristic naming the degradation cause** — considered for D-03 and declined,
  because Apple Home draws no tile for vendor-defined services, so the user most likely to need it
  would not see it. If a later phase adds a diagnostics surface, this belongs there.
- **A longer secondary threshold after which REST-only loss also withdraws trust** — considered for
  D-04 and declined as a third threshold to specify, justify and test. Revisit if real use shows the
  missing backstop matters more than expected.
- **A distinct HomeKit marker for "never observed this run" versus "observed and lost"** —
  considered for D-06 and declined to keep one signal with one meaning. The distinction survives in
  logs.

</deferred>

---

*Phase: 5-Degraded Operation and Recovery*
*Context gathered: 2026-09-01*
