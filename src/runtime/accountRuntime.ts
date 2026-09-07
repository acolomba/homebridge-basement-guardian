// SPDX-License-Identifier: MIT
import timers from 'node:timers/promises';

import { createReconciliation } from '../accessories/reconciliation.js';
import { createCloudApi } from '../cloud/api.js';
import { createAuthClient } from '../cloud/auth.js';
import { AuthHaltedError, AuthRejectedError, AuthThrottledError, CloudRequestError } from '../cloud/errors.js';
import { createMqttTransport } from '../cloud/mqttTransport.js';
import { createShadowClient } from '../cloud/shadow.js';
import { createDeviceStateStore } from '../device/state.js';
import { PLUGIN_USER_AGENT } from '../settings.js';

import { createArrivalAnchors } from './arrivalAnchors.js';
import { createFailureLog, FAILURE_REMINDER_MS } from './failureLog.js';
import { createMonitoringHealth } from './monitoringHealth.js';
import { createRetryPolicy, MAX_BACKOFF_MS } from './retryPolicy.js';

import type { ArrivalAnchors } from './arrivalAnchors.js';
import type { Clock } from './clock.js';
import type { CommandFailure, CommandOutcome, CommandPort } from './commandPort.js';
import type { FailureLog } from './failureLog.js';
import type { MonitoringTrust } from './monitoringHealth.js';
import type { MonotonicClock } from './monotonicClock.js';
import type { RetryPolicy } from './retryPolicy.js';
import type { CloudApi } from '../cloud/api.js';
import type { HttpFetch } from '../cloud/httpDispatcher.js';
import type { MqttConnect } from '../cloud/mqttTransport.js';
import type { CredentialCache, ShadowClient, ShadowCredentials, ShadowDisconnectReason } from '../cloud/shadow.js';
import type { ApiDevice, AwsCredentialsResponse, DeviceCommand } from '../cloud/types.js';
import type { BgConfig } from '../config.js';
import type { DeviceCapability } from '../device/family.js';
import type { MonitoringPath } from '../device/health.js';
import type { FamilyRegistry } from '../device/registry.js';
import type { DeviceStateStore, ReportedPatch } from '../device/state.js';
import type { RedactingLogger, SecretRole } from '../logging.js';
import type { ProtocolConstants } from '../protocol.js';
import type { Logging } from 'homebridge';

/** Deadline applied to each vendor request. */
const REQUEST_TIMEOUT_MS = 10_000;

const MILLISECONDS_PER_SECOND = 1_000;

/** How long before a credential expiry a bundled runtime refreshes the cache. */
export const ROTATION_LEAD_MS = 600_000;

/** The floor a bundled rotation delay is held at, so a response already inside the lead window still waits. */
export const MIN_ROTATION_DELAY_MS = 30_000;

// What one failing activity is called. The name reads as the subject of the
// recovery sentence the failure log writes, and each one carries its own
// warning cadence.
const POLLING = 'Device polling';
const ROTATION = 'Credential rotation';
const SHADOW = 'The shadow connection';
const AUTHENTICATION = 'Authentication';

const ROTATION_FAILED = 'The temporary shadow credentials could not be refreshed; the plugin will try again.';
const SHADOW_DEGRADED = 'The shadow connection is unavailable, so device state is coming from polling alone until it returns.';
const THROTTLED = 'Authentication is being throttled, so the plugin is waiting before it tries again.';
const AUTHENTICATION_STOPPED =
  'Monitoring has stopped because the vendor refused the account credentials. Correct the account in Homebridge to start the plugin again.';

// One system's live reporting, named as its own failing activity.
//
// The `deviceId` is part of the kind and not only part of the sentence, because
// `FailureLog` rate-limits per kind string (`src/runtime/failureLog.ts:45`,
// `:50-57`). One kind per device therefore gives each pump its own warning
// cadence with no change to the limiter, and a pump that has been quiet all
// afternoon can no longer hold back the first warning about the pump beside it.
// The vendor `deviceId` is a non-sensitive value, permitted in logs and in
// accessory context, and it names no route, header, credential or account
// (D-14, D-027, AUTH-02).
function liveReportingKind(deviceId: string): string {
  return `Live device reporting for ${deviceId}`;
}

// The line one system's silent live path records. It names the controller,
// because on a two-pump account the sentence without it does not say which
// basement the plugin stopped watching.
function liveReportingSilent(deviceId: string): string {
  return (
    `No device message has arrived on the live connection from ${deviceId} for two heartbeat intervals, ` +
    'so HomeKit is marking what it shows untrustworthy until one does.'
  );
}

// One system's removal from HomeKit, named as its own failing activity.
//
// The `deviceId` is part of the kind for the reason it is part of
// `liveReportingKind`: `FailureLog` rate-limits per kind string, so one kind per
// device gives each refused removal its own cadence, and a pump Homebridge has
// been refusing all afternoon can no longer hold back the first report about the
// pump beside it, whose accessory is stranded just as badly (D-14).
function removalKind(deviceId: string): string {
  return `HomeKit removal of ${deviceId}`;
}

// The line one refused removal records. It names the controller and says what
// the refusal left standing, because that is what an owner acts on.
function removalRefused(deviceId: string): string {
  return `Could not remove ${deviceId} from HomeKit; it stays published and stays watched.`;
}

/**
 * The half of the shadow client's options the runtime owns.
 *
 * The scheme, the region, the transport, and the connect function belong to the
 * composition seam, which closes over them. What is left is what the runtime
 * itself supplies: the cache its rotation keeps fresh, the reconnect policy
 * built for that client alone, and where the connection reports to.
 */
export interface ShadowRuntimeOptions {
  credentials: CredentialCache;
  retry: RetryPolicy;
  onReportedPatch: (deviceId: string, patch: ReportedPatch) => void;
  onConnected: () => void;
  onDisconnected: (reason: ShadowDisconnectReason) => void;
}

/** Every deviceId a trustworthy inventory response named, for a discovery-time listener. */
export type TrustworthyInventoryListener = (deviceIds: readonly string[]) => void;

/** Everything the account runtime needs, by injection. */
export interface AccountRuntimeOptions {
  api: CloudApi;
  store: DeviceStateStore;
  /**
   * The family lookup a command body is built through.
   *
   * The runtime holds it because it is the only object holding the cloud client
   * and the root abort controller as well, and the wire body for one intent
   * differs per family (CTRL-05).
   */
  registry: FamilyRegistry;
  createShadow: (options: ShadowRuntimeOptions) => ShadowClient;
  /**
   * Builds one reconnect policy over the root signal.
   *
   * The runtime builds two and never shares one, because a policy's pending
   * guard covers the whole policy: a single instance would let the shadow
   * client's reconnect swallow the runtime's own retry, or the reverse
   * (SYNC-04).
   */
  createRetry: (signal: AbortSignal) => RetryPolicy;
  pollIntervalMs: number;
  /** How long before a credential expiry the rotation refreshes the cache. */
  rotationLeadMs: number;
  /** The floor a rotation delay is held at, so a response already inside the lead window still waits. */
  minRotationDelayMs: number;
  failures: FailureLog;
  /**
   * Registers credential material with the redacting logger as it arrives.
   *
   * A rotated value carries its role, so it replaces the value that role held
   * rather than joining it (AUTH-02).
   */
  registerSecret: (secret: string, role?: SecretRole) => void;
  /**
   * Reports every deviceId a trustworthy inventory response named, right after
   * each one has been applied to the store.
   *
   * A trustworthy response is HTTP 200 with a schema-valid envelope, including
   * a valid empty list; a failed or malformed response never reaches this
   * listener (D-029).
   */
  onTrustworthyInventory: TrustworthyInventoryListener;
  /**
   * Reports a deviceId confirmed absent by two consecutive trustworthy
   * inventory responses and by one further out-of-band final-check fetch run
   * immediately before this call (D-029).
   */
  onDeviceRemoved: (deviceId: string) => void;
  /**
   * Reports what the plugin can currently say about its own ability to observe
   * this account and each of its systems, on every poll outcome.
   *
   * This is the trust decision; `monitoringPath` stays the diagnostic. The path
   * names which sources are feeding state and collapses a failing poll with a
   * lost shadow into one value, while these facts are what the HomeKit tier
   * needs kept apart: a shadow that has gone quiet while polls still succeed is
   * the expensive case, because a pump run lasts seconds and begins and ends
   * between two polls, and it reads as the healthier value on the path (D-04).
   *
   * Two values travel rather than one map, and the reason is the launch the
   * vendor refused before the first inventory: that run discovers no device, so
   * the map is empty, and `credentialsRejected` -- which is what makes the
   * restored accessories unreadable -- would have nowhere left to be read from.
   * The account struct carries the facts that are genuinely account-wide; the
   * map carries the one that is not (D-01, RES-04).
   */
  onMonitoringHealth: (account: MonitoringTrust, byDevice: ReadonlyMap<string, MonitoringTrust>) => void;
  clock: Clock;
  /**
   * Forward-only elapsed time, threaded to the silence measurement exactly as
   * `clock` is threaded to everything that wants wall time. It travels beside
   * the wall clock rather than replacing it, because both terms are needed
   * (D-06).
   */
  monotonic: MonotonicClock;
  /**
   * The wall-clock arrival anchors, restored before the launch and written back
   * on the reporting tick.
   *
   * The runtime holds it because it is the one object that knows when a launch
   * begins and when a poll has reported, and because the silence measurement it
   * feeds owns no I/O of its own (D-07, D-08).
   */
  anchors: ArrivalAnchors;
  log: Logging;
}

/** One account's cloud work, started and stopped by the Homebridge lifecycle. */
export interface AccountRuntime {
  readonly monitoringPath: MonitoringPath;
  /**
   * The canonical device state both sources land in.
   *
   * The runtime owns the single store, so whatever renders device state reads
   * and subscribes here rather than keeping a second copy that can disagree.
   */
  readonly store: DeviceStateStore;
  /**
   * The command surface a HomeKit control reaches the vendor through.
   *
   * The runtime owns it because it holds both the cloud client and the root
   * abort controller, so a shutdown cancels a command in flight through the one
   * mechanism every other wait and request already ends on (CTRL-05, SYNC-05).
   */
  readonly commands: CommandPort;
  start(): Promise<void>;
  stop(): Promise<void>;
}

// The vendor deadline aborts with a `TimeoutError`; every other rejection -- a
// non-2xx answer, an unreadable body, a shutdown -- is a vendor error. The two
// are told apart here, at the only place that can still see which happened,
// because the HomeKit tier answers a different HAP status for each (D-04,
// D-038).
function commandFailureOf(error: unknown): CommandFailure {
  return error instanceof Error && error.name === 'TimeoutError' ? 'timed-out' : 'vendor-error';
}

// The wire body for one intent differs per family and the wrong shape is
// accepted and ignored rather than refused, so the family the device's own
// `deviceTypeId` selects is what builds it. A device the store never held, or
// one whose family this version cannot drive, yields no body at all rather than
// a guessed one.
function commandBodyOf(options: AccountRuntimeOptions, deviceId: string, capability: DeviceCapability, requested: boolean): DeviceCommand | undefined {
  const deviceTypeId = options.store.snapshot(deviceId)?.identity.deviceTypeId;

  if (deviceTypeId === undefined) {
    return undefined;
  }

  const outcome = options.registry.lookup(deviceTypeId);

  return outcome.kind === 'implemented' ? outcome.family.command(capability, requested) : undefined;
}

// The cache the signing hook reads, plus the one write the rotation makes.
// Replacing the held value is the whole of rotating in place: the next
// handshake reads it, and nothing re-signs an established socket (SYNC-04).
interface MutableCredentialCache extends CredentialCache {
  replace(next: ShadowCredentials): void;
}

// Failure reporting stays a fixed message plus an HTTP status. An arbitrary
// error's message can name a URL, so it is never repeated into the log.
function describeFailure(error: unknown): string {
  if (error instanceof CloudRequestError) {
    return `Device discovery failed on ${error.route} with HTTP ${String(error.status)}.`;
  }

  return 'Device discovery failed.';
}

function createCredentialCache(initial: ShadowCredentials): MutableCredentialCache {
  let held = initial;

  return {
    current: () => held,
    replace: (next: ShadowCredentials): void => {
      held = next;
    },
  };
}

// The vendor's capitalized field names are kept as they arrive elsewhere; the
// connection needs them under its own.
function toShadowCredentials(response: AwsCredentialsResponse): ShadowCredentials {
  return {
    endpoint: response.endpoint,
    clientId: response.clientId,
    accessKeyId: response.credentials.AccessKeyId,
    secretAccessKey: response.credentials.SecretAccessKey,
    sessionToken: response.credentials.SessionToken,
  };
}

// The expiry is an untyped vendor string, so one that does not parse must not
// become a NaN delay: a timer armed with NaN fires at once and spins.
function rotationDelayMs(expiration: string, now: number, options: AccountRuntimeOptions): number {
  const expiresAt = Date.parse(expiration);

  if (!Number.isFinite(expiresAt)) {
    return options.minRotationDelayMs;
  }

  return Math.max(options.minRotationDelayMs, expiresAt - now - options.rotationLeadMs);
}

/**
 * Creates the account runtime.
 *
 * One root `AbortController` owns every wait, request, and connection, so a
 * shutdown cancels them all through one mechanism and leaves no timer holding
 * the process open (SYNC-05). Creating the runtime opens no connection, reads
 * no file, and starts no timer; only `start` does any work.
 *
 * Both long-running activities are loops rather than self-rearming callbacks.
 * A loop keeps the next attempt scheduled no matter how the last one ended,
 * which is the property a failed credential refresh most needs: the surveyed
 * defect is a plugin that logs and returns, leaving its push channel dead until
 * the bridge restarts.
 */
export function createAccountRuntime(options: AccountRuntimeOptions): AccountRuntime {
  const root = new AbortController();
  const connectRetry = options.createRetry(root.signal);
  const shadowRetry = options.createRetry(root.signal);
  const reconciliation = createReconciliation({ clock: options.clock, log: options.log });
  const health = createMonitoringHealth({ clock: options.clock, monotonic: options.monotonic, anchors: options.anchors });
  let credentials: MutableCredentialCache | undefined;
  let shadow: ShadowClient | undefined;
  // The three facts the monitoring path is derived from. Holding them, rather
  // than the answer, is what keeps the derivation from depending on which
  // assignment ran last.
  let polling = false;
  let shadowConnected = false;
  let halted = false;
  let started = false;
  let stopped = false;
  let retryingShadow = false;
  // The systems this runtime last actually reported silent, which is what lets
  // an arriving message report a recovery once rather than once per heartbeat.
  // It records what was pushed rather than what is true now, because the
  // question it answers is whether the tier is still holding a silence that has
  // ended (D-05, D-11).
  //
  // It is a set rather than a boolean because the silence it latches is per
  // device. A single flag over a multi-pump account answers the arrival of a
  // message from the wrong controller: one noisy pump would keep re-reporting
  // on a quiet neighbour's behalf, or a quiet neighbour would hold the flag up
  // and swallow the noisy pump's own recovery (D-14).
  let reportedSilentDevices: ReadonlySet<string> = new Set<string>();

  // Every wait ends on the root signal. A rejection here means a shutdown
  // cancelled the wait, which is reported as a false rather than raised: an
  // escaping rejection would surface as an unhandled exception in the
  // Homebridge process (D-20).
  async function waitFor(delayMs: number): Promise<boolean> {
    try {
      await timers.setTimeout(delayMs, undefined, { signal: root.signal });

      return true;
    } catch {
      return false;
    }
  }

  // Whether a loop that has just waited may run again. Both ends are asked
  // because the halt can be raised by this loop's own body and by another loop
  // while this one is waiting, and only the second read sees the latter.
  //
  // This is not tidiness. The auth client throws before any request leaves once
  // it holds a terminal reason, so a waking loop sends nothing and does not
  // extend the vendor's thirty-day block -- but a runtime that will never
  // attempt anything again must not look like one that is still trying
  // (D-13, D-10).
  async function waitWhileRunning(delayMs: number): Promise<boolean> {
    return !halted && (await waitFor(delayMs)) && !halted;
  }

  // The final check re-fetches the inventory once more, immediately before a
  // removal commits, closing the race where a device reappears between the
  // second confirming poll and the removal decision (D-029). Its own failure
  // is a monitoring-path failure, not a device fact (D-014): it removes
  // nothing and leaves the pending deviceIds for the next successful poll's
  // own confirmedAbsent computation, with no separate retry state.
  async function applyDevices(devices: readonly ApiDevice[]): Promise<void> {
    // A shadow that has missed two heartbeats has stopped being the source of
    // telemetry, so the poll takes it back before this poll's bodies are
    // written. Reading the silence predicate here rather than where the trust
    // report reads it is the whole design: `runPoll` awaits this function and
    // only then records the poll outcome, so a handover placed at the report
    // would arrive after every `applyDiscovery` below had already kept the
    // shadow's telemetry, and would take effect one poll interval late --
    // `pollIntervalSeconds` accepts up to an hour. This is also the only place
    // a poll's telemetry enters the store, from both the launch and the loop,
    // so the ordering holds by construction rather than by two calls happening
    // to sit in the right order (D-13, D-05).
    //
    // A failed poll is deliberately not a release site: it writes no telemetry,
    // so there is nothing to hand over.
    //
    // The release names the devices it releases, so a fact about one quiet
    // controller is not spent on its neighbours: a pump whose live path is
    // working keeps the readings that path delivered instead of having every
    // poll of the silence next door overwrite them (SYNC-03). A device admitted
    // by the loop below is therefore never released on the same poll, because
    // the loop runs after this one and the device holds no watermark yet.
    for (const deviceId of health.silentDevices()) {
      options.store.releaseShadowSource(deviceId);
    }

    for (const device of devices) {
      // Admission starts the device's silence window, so a pump the account
      // gained an hour into the run is judged from when the plugin first knew
      // about it rather than from when the runtime was built (D-05).
      health.admitDevice(device.deviceId);
      options.store.applyDiscovery(device);
    }

    const deviceIds = devices.map((device) => device.deviceId);
    options.onTrustworthyInventory(deviceIds);

    const confirmedAbsent = reconciliation.observe(deviceIds);

    if (confirmedAbsent.length === 0) {
      return;
    }

    let freshDevices: readonly ApiDevice[];

    try {
      freshDevices = await options.api.devices(root.signal);
    } catch {
      // Deliberately silent, for the reason above. The `try` holds the fetch
      // and nothing else: every statement below it changes state, and a
      // failure there is a different fact that has to be reported rather than
      // dropped.
      return;
    }

    const stillPresent = new Set(freshDevices.map((device) => device.deviceId));

    // Only the deviceIds actually under confirmation are re-observed here
    // (CR-01): replaying the whole fleet through `reconciliation.observe()`
    // let a transient omission on this extra request advance an unrelated,
    // otherwise-healthy deviceId's absence count.
    for (const deviceId of confirmedAbsent) {
      if (stillPresent.has(deviceId)) {
        // Reappeared since the confirming poll: forget it so a future absence
        // starts a fresh epoch.
        reconciliation.forget(deviceId);

        continue;
      }

      // The accessory goes first and every prune below waits on it, because
      // each prune drops a mechanism that can still distrust this system: its
      // absence count, its arrival stamp, its persisted anchor, its reporting
      // kind. Pruning ahead of a removal that then failed would leave a
      // published accessory that nothing can ever mark untrustworthy again,
      // reading no leak and a normal pump for a system the account no longer
      // holds -- the false normal this plugin refuses (D-014).
      try {
        options.onDeviceRemoved(deviceId);
      } catch {
        // The system stays published, stays watched and stays distrustable,
        // and the next poll tries the removal again: `observe` reports a
        // deviceId on every call while it stays absent, so the retry needs no
        // state of its own (D-029).
        //
        // The reporting is rate-limited and the attempt above never is. The
        // documented refusal is a UUID another plugin had already bridged,
        // which no poll clears, so the removal is refused again on every poll
        // for the life of the process; an unlimited line would write the same
        // sentence 288 times a day at the shortest interval the configuration
        // allows. It goes through the failure log for the reason a failing
        // poll and a lost shadow do: said once, then on the reminder cadence,
        // per kind, with no warn-once flag of its own (D-14).
        //
        // The refusal itself is not repeated into the line, for the reason
        // `describeFailure` states: an arbitrary error's message is not this
        // plugin's to quote, and a `reason` is the complete line to log.
        options.failures.recordFailure(removalKind(deviceId), removalRefused(deviceId));

        continue;
      }

      // Confirmed and now removed: stop tracking it so it can never
      // re-trigger this final check again once it is gone.
      reconciliation.forget(deviceId);
      // Everything keyed by this device is pruned here and nowhere else. A
      // device missing from one inventory is not a removed device -- that is
      // what these two confirming polls decide -- and dropping its state on
      // every poll that omitted it would re-admit it on the next one and
      // reset the silence window of a pump that is genuinely quiet, forever.
      //
      // Its arrival stamp goes, its persisted arrival anchor goes with it,
      // and so do both of the failure-log kinds it owns. The anchor is
      // written back to disk, so a store that only ever grew would carry an
      // entry for every system the account has ever held; dropping it here is
      // what keeps the stored set no larger than the account.
      // The failure log rate-limits per kind, and neither kind of a system
      // that has left the account can ever report again, so leaving either
      // would hold an entry for the life of the process and rate-limit
      // whatever identifier came back next. Both are forgotten rather than
      // recorded successful: this system's reporting did not come back, the
      // system went away, and a removal that finally landed is that departure
      // rather than a recovery an owner wants announced (D-14).
      //
      // The recovery latch needs nothing here. `reportMonitoringHealth`
      // rebuilds it wholesale from the map it is about to push, and the
      // removal runs before the poll records its outcome, so the entry is
      // already gone by the end of this same poll.
      health.forgetDevice(deviceId);
      options.anchors.forget(deviceId);
      options.failures.forget(liveReportingKind(deviceId));
      options.failures.forget(removalKind(deviceId));
    }
  }

  // Which sources are feeding canonical state, derived from what is working
  // rather than assigned wherever something changed.
  //
  // A halted runtime is unavailable whatever else once held, because nothing
  // will be attempted again (D-13). A stopped one is unavailable for the same
  // reason and no other: the value names which sources are feeding state, not
  // whether something went wrong, and a shutdown that has aborted every wait
  // and request is feeding nothing. Reporting the path the runtime last held
  // would be the false normal this plugin refuses, from the one direction the
  // runtime cannot correct afterwards.
  //
  // Polling is the floor below both: it is the reconciliation backstop, so a
  // poll that is not succeeding means the plugin cannot vouch for what it holds
  // even while the shadow is live, and naming the combined path there would be
  // the same false normal.
  //
  // A degraded path is not a device condition: it says the plugin is seeing
  // less, never that a device reported itself disconnected (D-15).
  function monitoringPathNow(): MonitoringPath {
    if (stopped || halted || !polling) {
      return 'unavailable';
    }

    return shadowConnected ? 'shadow-and-poll' : 'poll-only';
  }

  // Whether the plugin currently has a proven way to reach the vendor, derived
  // from the same three flags the monitoring path is derived from and storing
  // nothing of its own.
  //
  // A stopped runtime has aborted every request, and a halted one will never
  // attempt another, so neither can send. Below both sits the poll: it is what
  // a command travels on, so a runtime whose last poll did not succeed has no
  // proven route -- which is also why this is false before the first inventory
  // has landed, when nothing has yet reached the vendor at all.
  //
  // One failed poll is enough here while two are needed to withdraw trust,
  // because the two thresholds answer different questions. Withdrawing trust
  // says a displayed value may be stale, and a blip must not flap a tile.
  // Refusing a press says the plugin has no way to reach the vendor right now,
  // and sending into a route that has just failed buys a round trip that ends
  // as a vendor error -- which is exactly the blur between a vendor refusal and
  // a local one that the per-cause status table exists to prevent (RES-04,
  // D-07).
  function commandTransportReadyNow(): boolean {
    return !stopped && !halted && polling;
  }

  // What the runtime pushes: the two facts the projection tracks, plus the two
  // it cannot answer because it sees neither the lifecycle nor authentication.
  //
  // `credentialsRejected` is `halted` and nothing else. `halted` is assigned in
  // exactly one function -- `haltOnTerminalAuthFailure`, which the launch, the
  // poll loop and the rotation loop all route through -- so reading it here
  // rather than raising a second flag beside it is what keeps the fact HomeKit
  // presents and the fact the runtime acts on from ever drifting apart
  // (D-13, D-10).
  function monitoringTrustNow(): MonitoringTrust {
    return {
      ...health.trustNow(),
      // There is no account-wide answer to a per-device question, so this base
      // carries the value that declines to vouch and every real per-device
      // answer overrides it below. It is deliberately not `false`: a struct that
      // vouched by default would make a system nobody answered for read as
      // watched, which is the false normal this plugin refuses. Reading this
      // member off the account struct is therefore always wrong; the map is
      // where the answer lives (D-02, D-04).
      shadowSilent: true,
      commandTransportReady: commandTransportReadyNow(),
      credentialsRejected: halted,
    };
  }

  // One trust struct per system the account currently holds, built from the
  // account-wide facts plus this device's own silence.
  //
  // Neither input is new. `store.deviceIds()` is the inventory the runtime
  // already keeps, and `health.silentDevices()` has answered per device since
  // it began stamping arrivals per device, so nothing here tracks anything the
  // runtime was not already tracking -- the flatten that collapsed the second
  // list into one boolean is simply gone (D-01, D-03).
  function monitoringTrustByDevice(account: MonitoringTrust): ReadonlyMap<string, MonitoringTrust> {
    const silent = new Set(health.silentDevices());

    return new Map(options.store.deviceIds().map((deviceId) => [deviceId, { ...account, shadowSilent: silent.has(deviceId) }]));
  }

  // The push on its own, for the two acts that change the trust without having
  // observed anything: the terminal authentication answer and the shutdown.
  // Neither writes a live-reporting outcome, because neither watched a live
  // path, and neither moves the latch, because neither resolved a silence.
  function pushMonitoringTrust(): void {
    const account = monitoringTrustNow();

    options.onMonitoringHealth(account, monitoringTrustByDevice(account));
  }

  // The trust is computed once and reported from that one value, so what the
  // plugin says about its own sight and what HomeKit marks cannot disagree.
  //
  // It runs on every poll outcome rather than from the poll loop alone, because
  // `launch()` records its own first inventory outcome without going through
  // that loop, and a report wired only into the loop would arrive a whole poll
  // interval late -- an hour at the configuration maximum. A poll a shutdown
  // aborted returns before both recorders, so it advances nothing and reports
  // nothing.
  function reportMonitoringHealth(): void {
    const account = monitoringTrustNow();
    const byDevice = monitoringTrustByDevice(account);
    // Assigned from the map about to be pushed, so the latch and the facts the
    // accessory tier holds cannot drift apart.
    reportedSilentDevices = new Set([...byDevice].filter(([, trust]) => trust.shadowSilent).map(([deviceId]) => deviceId));

    // Each condition is reported and pushed from the one value, so the cause the
    // log names and the condition HomeKit marks cannot disagree. The walk is
    // over the same map, one outcome per system, because the question "has this
    // controller stopped speaking" has one answer per controller and a single
    // account-wide branch would record a failure for a pump that is reporting.
    //
    // The rate limiting is the failure log's own, and it is per kind, so each
    // system's silence says so once and then on the reminder cadence with no
    // second warn-once flag beside it. A failing poll is not reported here,
    // because `Device polling` already owns that line (D-03, D-14).
    for (const [deviceId, trust] of byDevice) {
      if (trust.shadowSilent) {
        options.failures.recordFailure(liveReportingKind(deviceId), liveReportingSilent(deviceId));
      } else {
        options.failures.recordSuccess(liveReportingKind(deviceId));
      }
    }

    // Fired and not awaited, for the reason the terminal-act write is: the
    // report must not wait on a disk write, and a failed one must not stop it.
    // The reporting tick is a coarse cadence for an anchor -- a poll interval
    // may be an hour -- and that is sound in the one direction that matters: the
    // clamp takes the larger elapsed term, so an anchor left behind by a missed
    // write can only make the plugin report silence sooner, never later.
    void options.anchors.persist();

    options.onMonitoringHealth(account, byDevice);
  }

  // Closing reports nothing. A connection that fails while it is being closed
  // has still stopped being used, and an escaping rejection during shutdown
  // would surface as an unhandled exception in the Homebridge process (D-20).
  //
  // It sits above the terminal act rather than beside the shutdown it also
  // serves, because both ends of the runtime's life close the same connection.
  async function closeQuietly(client: ShadowClient | undefined): Promise<void> {
    try {
      await client?.close();
    } catch {
      // Deliberately silent, for the reason above.
    }
  }

  /**
   * Answers whether this error was the one failure the project treats as final,
   * and performs the whole terminal act when it was.
   *
   * A refused credential does not only arrive at launch. A password changed at
   * the vendor, or a block applied to the account, arrives at whichever loop
   * asks next, so the act lives here and each caller reads as one guard clause
   * rather than as a copy of it.
   *
   * Nothing polls, refreshes, or connects after this, so the runtime says
   * monitoring has stopped rather than leaving a working degraded path
   * standing, and records the stop so the recovery discipline learns of it. The
   * trust is pushed rather than reported, because the live-reporting line
   * describes an observation this act never made.
   *
   * Ending the live connection is part of that act rather than a tidy-up after
   * it. The socket is signed with temporary credentials this runtime will never
   * rotate again, and it outlives the account credentials the vendor refused, so
   * it keeps delivering values that would overwrite the one presentation an
   * owner has to act on.
   *
   * Meeting it a second time performs nothing further and still answers `true`.
   * Two loops can be in flight against a tenant that has already said no, and
   * the owner must not be told twice nor the accessory tier pushed twice
   * (D-13, D-10, D-07).
   */
  function haltOnTerminalAuthFailure(error: unknown): boolean {
    if (!(error instanceof AuthRejectedError || error instanceof AuthHaltedError)) {
      return false;
    }

    if (halted) {
      return true;
    }

    halted = true;
    options.failures.recordFailure(AUTHENTICATION, AUTHENTICATION_STOPPED);
    pushMonitoringTrust();
    // Nothing is awaited: three callers read this function as a guard clause
    // answering a boolean, and the close needs no await to shut the arrival
    // path. `close()` sets the client's own closing flag before it ends the
    // transport, and every notification the client delivers is gated on that
    // flag, so no message reaches the reported-patch callback after this line.
    //
    // The binding stays assigned, so a later `stop()` awaits the same memoized
    // ending and the connect path keeps finding a connection here. Nothing
    // releases the store's shadow source, for the reason `stop()` records
    // (D-10, SYNC-05).
    void closeQuietly(shadow);

    return true;
  }

  // Whether the poll is succeeding is one of the facts the path is derived
  // from, so the fact and the report move together and cannot disagree.
  //
  // `polling` keeps its single-failure meaning, because the monitoring path is
  // derived from it and answers a different question: which sources are feeding
  // state. The run of consecutive failures the trust projection counts is a
  // separate fact for a separate projection, so one blip cannot withdraw trust
  // while the path still reports it honestly (D-04, D-05).
  function recordPollSuccess(): void {
    polling = true;
    options.failures.recordSuccess(POLLING);
    health.recordRestSuccess();
    reportMonitoringHealth();
  }

  function recordPollFailure(error: unknown): void {
    polling = false;
    options.failures.recordFailure(POLLING, describeFailure(error));
    health.recordRestFailure();
    reportMonitoringHealth();
  }

  function handleShadowConnected(): void {
    shadowConnected = true;
    connectRetry.reset();
    options.failures.recordSuccess(SHADOW);
  }

  // A clean close is not a fault. The provider closes a signed connection at a
  // ceiling it publishes no knob for, so at least one reconnect a day is
  // ordinary, and the client's own guarded retry owns getting back. Only the
  // path changes, and it changes because the plugin is seeing less, not because
  // a device said anything.
  //
  // A failed connection and a refused subscription are the degraded path, and
  // this is the one place that sees the whole stream of them, so the reader is
  // told once and then on the reminder cadence rather than on every
  // capped-backoff attempt (D-14, D-15).
  function handleShadowDisconnected(reason: ShadowDisconnectReason): void {
    shadowConnected = false;
    // A connection ending is one of the two ways the shadow stops being the
    // source of telemetry, and this handler owns that one: whatever ended it,
    // the poll takes over until the reconnect's complete-shadow request
    // re-establishes ownership. Two missed heartbeats are the other way, and
    // `applyDevices` owns it, because a socket that is still open says nothing
    // about a device that has stopped speaking (D-15, D-13, SYNC-03).
    //
    // The two now differ in signature as well as in cause, and this one is
    // fleet-wide on purpose: the connection that ended carried every device, so
    // no device still has a live path. The silence one names its device,
    // because silence is a fact about one controller.
    for (const deviceId of options.store.deviceIds()) {
      options.store.releaseShadowSource(deviceId);
    }

    if (reason !== 'transport-closed') {
      options.failures.recordFailure(SHADOW, SHADOW_DEGRADED);
    }
  }

  // Whether the runtime will ever open a connection again. A shutdown has
  // begun, or a refused credential has halted it for good. Neither ends, so a
  // connection opened after either is one nothing will use and nothing will
  // close, and one answer covers both because the question the connect path
  // asks is the same either way.
  //
  // It is asked through a function so that a check after an await asks again
  // rather than reusing the answer from before it, which is the whole point of
  // checking twice (SYNC-05, D-13).
  function hasFinished(): boolean {
    return stopped || halted;
  }

  // Opens the connection once there is both a credential cache to sign from and
  // a device to subscribe for, and reports whether it was refused so the caller
  // can decide whether a retry chain needs starting.
  async function attemptShadow(): Promise<boolean> {
    const cache = credentials;
    const deviceIds = options.store.deviceIds();

    if (hasFinished() || shadow !== undefined || cache === undefined || deviceIds.length === 0) {
      return false;
    }

    try {
      const client = options.createShadow({
        credentials: cache,
        retry: shadowRetry,
        onReportedPatch: (deviceId: string, patch: ReportedPatch) => {
          // This callback fires for every routed message, upstream of the
          // store's change filter, which is why it and not a snapshot listener
          // is the arrival signal: a heartbeat carrying values identical to the
          // last one notifies no subscriber and still proves the live path is
          // carrying messages (D-05, D-11).
          //
          // The three steps are in this order deliberately. Stamping first is
          // what makes the recomputed trust see this arrival. Applying the patch
          // before the report is what puts the new value on the tile before the
          // marker says the plugin vouches for it again, so there is no instant
          // in which the accessory claims to vouch for a value it has not yet
          // published.
          //
          // Reporting here is what makes the recovery arrive with the evidence
          // rather than at the next poll tick, which the configuration lets run
          // an hour long. The latch is what keeps it to one report per recovery:
          // a working live path delivers a heartbeat every fifteen minutes, and
          // a report on each one would push a trust fan-out across every
          // accessory for no new information.
          //
          // No timer and no loop is introduced. The arrival is an event the
          // shadow client already delivers, so detection stays as lazy as it was
          // and the whole projection stays drivable from the injected clock and
          // the injected timers -- which is the constraint the lazy evaluation
          // was chosen for (D-05, D-11).
          // The stamp belongs to the device the message came from. An account
          // stamp is re-armed by whichever pump spoke last, so on a multi-pump
          // account one heartbeat vouches for a neighbour that has stopped
          // speaking, and that controller's silence is never noticed at all.
          //
          // Guarded on store membership because the shadow client stays
          // subscribed to a removed device's topics until the connection is
          // rebuilt, so a stray message can still arrive after removal. Left
          // unguarded, it would resurrect the in-memory arrival stamp and the
          // persisted anchor the removal branch already dropped for a system
          // that has left the account (D-14).
          if (options.store.deviceIds().includes(deviceId)) {
            health.recordShadowMessage(deviceId);
          }

          options.store.applyReportedPatch(deviceId, patch);

          if (reportedSilentDevices.has(deviceId)) {
            reportMonitoringHealth();
          }
        },
        onConnected: handleShadowConnected,
        onDisconnected: handleShadowDisconnected,
      });
      await client.start(deviceIds);

      // The start has already opened the socket, so a shutdown or a refusal
      // that landed while it was resolving found no client to close and would
      // leave that socket with nothing to close it. It is closed here and never
      // recorded (SYNC-05).
      //
      // The guard above the try is not enough on its own. Another loop can meet
      // the refusal during the start, and a connection opened into a runtime
      // that has stopped for good is the same defect the halt's own close
      // exists to prevent, arrived at one function later (D-13).
      if (hasFinished()) {
        await closeQuietly(client);

        return false;
      }

      shadow = client;

      return false;
    } catch {
      // The polling path is already the reconciliation backstop, so a shadow
      // outage costs latency rather than correctness. The runtime stays up and
      // says so once (D-15).
      options.failures.recordFailure(SHADOW, SHADOW_DEGRADED);

      return true;
    }
  }

  // The chain is its own schedule rather than work handed back to the policy:
  // the policy clears its pending guard only after the work it is running
  // settles, so a retry scheduled from inside that work would be dropped and
  // the chain would stop after one attempt. The policy still owns the capped
  // shape of the delays.
  async function retryShadow(): Promise<void> {
    retryingShadow = true;

    while (shadow === undefined && !stopped && (await waitWhileRunning(connectRetry.nextDelayMs()))) {
      await attemptShadow();
    }

    retryingShadow = false;
  }

  // A pending chain owns reconnecting, so a poll landing in the middle of one
  // neither opens a competing attempt nor starts a second chain.
  async function openShadow(): Promise<void> {
    if (retryingShadow) {
      return;
    }

    if (await attemptShadow()) {
      void retryShadow();
    }
  }

  async function refreshCredentials(): Promise<number> {
    try {
      const response = await options.api.awsCredentials(root.signal);
      // Every one of the three values is credential material the moment it
      // arrives, so each is registered before anything can quote it. Each
      // carries its role, so this set replaces the one the previous rotation
      // registered instead of adding to it (AUTH-02).
      options.registerSecret(response.credentials.AccessKeyId, 'aws-access-key-id');
      options.registerSecret(response.credentials.SecretAccessKey, 'aws-secret-access-key');
      options.registerSecret(response.credentials.SessionToken, 'aws-session-token');

      const cache = credentials;

      if (cache === undefined) {
        credentials = createCredentialCache(toShadowCredentials(response));
        await openShadow();
      } else {
        cache.replace(toShadowCredentials(response));
      }

      options.failures.recordSuccess(ROTATION);

      return rotationDelayMs(response.credentials.Expiration, options.clock.now(), options);
    } catch (error: unknown) {
      // A terminal authentication answer is not a rotation failure. Recorded as
      // one it would promise another attempt, for the one failure that must
      // never be attempted again (D-13, D-03).
      if (!root.signal.aborted && !haltOnTerminalAuthFailure(error)) {
        options.failures.recordFailure(ROTATION, ROTATION_FAILED);
      }

      return options.minRotationDelayMs;
    }
  }

  // The first pass fills the cache and opens the connection; every later one
  // refreshes ahead of the expiry the previous response carried.
  async function runCredentials(): Promise<void> {
    let delayMs = await refreshCredentials();

    while (await waitWhileRunning(delayMs)) {
      delayMs = await refreshCredentials();
    }
  }

  // The shadow synchronizes current state rather than replaying what was
  // missed, so the poll is what reconciles anything the socket did not carry
  // (SYNC-03).
  async function runPoll(): Promise<void> {
    try {
      await applyDevices(await options.api.devices(root.signal));
      recordPollSuccess();
      await openShadow();
    } catch (error: unknown) {
      // A shutdown aborted the request. That is not a monitoring failure, so
      // nothing is recorded and the poll keeps whichever answer it last gave
      // (SYNC-05).
      if (root.signal.aborted) {
        return;
      }

      // A terminal authentication answer is not a poll failure. Reaching the
      // generic device-discovery line below would name a cause that did not
      // happen, and an owner acts on a diagnostic (D-13, D-03).
      if (haltOnTerminalAuthFailure(error)) {
        return;
      }

      // A failed request changes no stored snapshot and marks nothing
      // disconnected: a monitoring-path failure and a device-reported
      // disconnection are separate conditions (D-014).
      recordPollFailure(error);
    }
  }

  async function runPolls(): Promise<void> {
    while (await waitWhileRunning(options.pollIntervalMs)) {
      await runPoll();
    }
  }

  function startBackgroundWork(): void {
    void runPolls();
    void runCredentials();
  }

  // Returns how long to wait before launching again, or undefined when the
  // runtime is up or has stopped trying.
  //
  // The two terminal authentication answers are routed apart. A refused
  // credential stops the runtime for good, because the vendor's block lifts
  // only thirty days after the last attempt and saving the configuration in the
  // Homebridge UI already restarts the bridge (D-13). A throttling response is
  // retried on the long interval the error carries rather than on the capped
  // backoff (D-22).
  function launchFailure(error: unknown): number | undefined {
    if (root.signal.aborted) {
      return undefined;
    }

    // A run that halted at its first grant reaches discovery with nothing built,
    // so the push the terminal act makes is the only one the accessory tier
    // will ever get from it, and nothing is scheduled behind it (D-13).
    if (haltOnTerminalAuthFailure(error)) {
      return undefined;
    }

    // The runtime is waiting rather than finished, so nothing is marked
    // terminal here (D-22).
    if (error instanceof AuthThrottledError) {
      options.failures.recordFailure(AUTHENTICATION, THROTTLED);

      return error.retryAfterMs;
    }

    recordPollFailure(error);
    startBackgroundWork();

    return undefined;
  }

  async function launch(): Promise<number | undefined> {
    try {
      const devices = await options.api.devices(root.signal);
      await applyDevices(devices);
      recordPollSuccess();
      options.log.info(`Discovered ${String(devices.length)} device(s).`);
    } catch (error: unknown) {
      return launchFailure(error);
    }

    startBackgroundWork();

    return undefined;
  }

  async function relaunch(firstDelayMs: number): Promise<void> {
    let delayMs = firstDelayMs;

    while (await waitFor(delayMs)) {
      const next = await launch();

      if (next === undefined) {
        return;
      }

      delayMs = next;
    }
  }

  // Exactly one attempt, under the root signal, with no retry anywhere: a
  // command that outlived its deadline may already have reached the device, and
  // a second attempt would operate a real sump pump twice (D-038). A resolved
  // body carrying `success: false` is the vendor refusing the command, not the
  // route failing, so it is answered as a refusal rather than falling out of the
  // rejection path.
  const commands: CommandPort = {
    async send(deviceId: string, capability: DeviceCapability, requested: boolean): Promise<CommandOutcome> {
      const command = commandBodyOf(options, deviceId, capability, requested);

      if (command === undefined) {
        return { accepted: false, failure: 'vendor-error' };
      }

      try {
        const result = await options.api.sendCommand(deviceId, command, root.signal);

        return result.success ? { accepted: true } : { accepted: false, failure: 'vendor-error' };
      } catch (error: unknown) {
        return { accepted: false, failure: commandFailureOf(error) };
      }
    },
  };

  return {
    get monitoringPath(): MonitoringPath {
      return monitoringPathNow();
    },

    store: options.store,

    commands,

    // Resolves once the first attempt has been made. A launch that must be
    // tried again waits in the background, so the Homebridge launch event is
    // never held open by a vendor that is not answering.
    async start(): Promise<void> {
      if (started || stopped) {
        return;
      }

      started = true;

      // Awaited before the launch, and the order is the behaviour. The admission
      // loop inside `launch` consults the store for every device it finds, so a
      // restore that ran after it would arrive to find every device already
      // anchored at this instant -- and a bridge restarted after a pump had been
      // quiet for hours would vouch for it (D-07).
      await options.anchors.restore();

      const retryInMs = await launch();

      if (retryInMs !== undefined) {
        void relaunch(retryInMs);
      }
    },

    // Aborting first cancels every wait and request before anything else is
    // released; the socket is closed last (SYNC-05). Calling this twice, or
    // after a partial start, resolves and raises nothing.
    //
    // Nothing releases the store's shadow source here, and nothing needs to.
    // Closing raises no disconnection, so the store keeps the shadow as the
    // owner of telemetry, but the abort above has already ended every wait and
    // request: no poll follows that the ownership could hold off, and the store
    // is discarded with the runtime. A start after a stop performs no work
    // either, so the held ownership is unobservable (SYNC-03).
    async stop(): Promise<void> {
      if (stopped) {
        return;
      }

      stopped = true;
      // The accessory tier decides whether a press may leave the plugin from
      // this fact, and it holds whatever the last poll left until something
      // else arrives. A tier still reporting a ready transport against a
      // runtime that has aborted every request sends a press into a route that
      // answers a vendor error, which reports a vendor failure for a refusal
      // that was entirely local (RES-04, D-07).
      //
      // It is pushed here rather than reported, because the reporting helper
      // also writes a live-reporting observation to the failure log and a
      // shutdown made no observation. It sits above the abort so the trust
      // carries the fact the runtime is about to act on rather than the one it
      // held.
      //
      // The push moves the command-transport member and no other. Homebridge
      // restarts routinely, and a shutdown that withdrew value trust would mark
      // a whole home of tiles for a condition that is over the moment the
      // process ends (D-014, D-01).
      pushMonitoringTrust();
      root.abort();
      await closeQuietly(shadow);
    },
  };
}

/**
 * Everything the composition seam builds the runtime from.
 *
 * `constants` is an injected dependency rather than an import inside the seam:
 * production passes the bundled values, and the transport-level harness passes
 * its own so it can point the runtime at a local fake cloud. That is a genuine
 * dependency made explicit, not a hook added for testing, and it is what keeps
 * the harness from needing a production escape hatch.
 *
 * The rotation lead and floor travel the same way. The seam is where the
 * bundled numbers are chosen, so a caller that omits them gets production
 * timing and a caller that states them drives the schedule itself.
 */
export interface AccountRuntimeDeps {
  config: BgConfig;
  constants: ProtocolConstants;
  /**
   * The one family registry this plugin run holds.
   *
   * The composition root passes the same instance the discovery path uses, so a
   * command and the accessory it came from can never resolve two different
   * families for one device.
   */
  registry: FamilyRegistry;
  /** The Homebridge storage directory; the token cache lives there and nowhere else. */
  storagePath: string;
  clock: Clock;
  /** Forward-only elapsed time for the silence measurement. Wall time for everything else. */
  monotonic: MonotonicClock;
  log: RedactingLogger;
  connect: MqttConnect;
  /** Never Node's built-in global `fetch`; see cloud/httpDispatcher.ts for why. */
  httpFetch: HttpFetch;
  createSalt: () => string;
  /** How long before a credential expiry the rotation refreshes the cache. Bundled lead when absent. */
  rotationLeadMs?: number;
  /** The floor a rotation delay is held at. Bundled floor when absent. */
  minRotationDelayMs?: number;
  /** Reports every deviceId a trustworthy inventory response named. A no-op when absent. */
  onTrustworthyInventory?: TrustworthyInventoryListener;
  /** Reports a deviceId confirmed absent by DEV-05's removal protocol. A no-op when absent. */
  onDeviceRemoved?: (deviceId: string) => void;
  /** Reports the account-wide trust and the per-system trust on every poll outcome. A no-op when absent. */
  onMonitoringHealth?: (account: MonitoringTrust, byDevice: ReadonlyMap<string, MonitoringTrust>) => void;
}

/**
 * Builds one account's runtime and every collaborator it needs.
 *
 * This is the only place the real adapters are wired together. None of these
 * factories opens a connection, reads a file, or starts a timer, so building
 * them costs nothing until the runtime starts.
 */
export function createAccountRuntimeFromConfig(deps: AccountRuntimeDeps): AccountRuntime {
  // The auth client registers one value that must be kept for the life of the
  // process, so it calls this with no role and keeps its own single-argument
  // signature.
  const registerSecret = (secret: string, role?: SecretRole): void => {
    deps.log.registerSecret(secret, role);
  };

  const auth = createAuthClient({
    constants: deps.constants,
    clientId: deps.config.clientId,
    email: deps.config.email,
    password: deps.config.password,
    storagePath: deps.storagePath,
    requestTimeoutMs: REQUEST_TIMEOUT_MS,
    httpFetch: deps.httpFetch,
    clock: deps.clock,
    createSalt: deps.createSalt,
    registerSecret,
    log: deps.log,
  });

  return createAccountRuntime({
    api: createCloudApi({ baseUrl: deps.constants.apiUrl, auth, requestTimeoutMs: REQUEST_TIMEOUT_MS, httpFetch: deps.httpFetch }),
    store: createDeviceStateStore({ clock: deps.clock, log: deps.log }),
    registry: deps.registry,
    createShadow: (shadowOptions: ShadowRuntimeOptions) =>
      createShadowClient({
        ...shadowOptions,
        scheme: deps.constants.protocol,
        region: deps.constants.awsRegion,
        createTransport: createMqttTransport,
        connect: deps.connect,
        userAgent: PLUGIN_USER_AGENT,
        clock: deps.clock,
        log: deps.log,
      }),
    createRetry: (signal: AbortSignal) => createRetryPolicy({ signal, maxDelayMs: MAX_BACKOFF_MS, log: deps.log }),
    pollIntervalMs: deps.config.pollIntervalSeconds * MILLISECONDS_PER_SECOND,
    rotationLeadMs: deps.rotationLeadMs ?? ROTATION_LEAD_MS,
    minRotationDelayMs: deps.minRotationDelayMs ?? MIN_ROTATION_DELAY_MS,
    failures: createFailureLog({ clock: deps.clock, log: deps.log, reminderIntervalMs: FAILURE_REMINDER_MS }),
    registerSecret,
    onTrustworthyInventory: deps.onTrustworthyInventory ?? (() => undefined),
    onDeviceRemoved: deps.onDeviceRemoved ?? (() => undefined),
    onMonitoringHealth: deps.onMonitoringHealth ?? (() => undefined),
    clock: deps.clock,
    monotonic: deps.monotonic,
    anchors: createArrivalAnchors({ storagePath: deps.storagePath, log: deps.log }),
    log: deps.log,
  });
}
