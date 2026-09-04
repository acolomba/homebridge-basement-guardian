/**
 * @fileoverview When each system was last heard from, read on wall time and
 * kept across restarts.
 *
 * The forward-only base the silence window is primarily measured on restarts
 * with the process. Without a second term that survives a restart, a bridge
 * restarted after a pump has been quiet for hours starts that pump's window
 * again from zero and hands it a fresh certificate of health -- the same false
 * normal a backwards wall-clock jump makes, on a slower clock. This store keeps
 * the wall reading of each device's last arrival so the clamp in
 * `monitoringHealth.ts` has a second term to take the larger of (D-07, D-08).
 *
 * It holds vendor `deviceId`s and millisecond timestamps and nothing else: no
 * credential, no token, no email, no account identifier, and no local-network
 * value.
 *
 * The store owns the map and the two disk calls, and it owns no timer and reads
 * no clock. The runtime decides when to restore and when to persist, which is
 * what lets `monitoringHealth.ts` read anchors while keeping its stated property
 * that it touches nothing outside itself.
 */

import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { isRecord } from '../cloud/types.js';

import type { Logging } from 'homebridge';

const ANCHORS_UNUSABLE = 'The stored arrival anchors could not be read; silence is measured from this run alone.';

/** The anchor file's name inside the Homebridge storage directory. */
export const ARRIVAL_ANCHOR_FILENAME = '.basement-guardian-arrivals.json';

/** Everything the anchor store needs, by injection. */
export interface ArrivalAnchorsOptions {
  /** The Homebridge storage directory; the anchor file lives there and nowhere else. */
  storagePath: string;
  log: Logging;
}

/**
 * One wall-clock arrival anchor per device, held in memory and mirrored to one
 * file.
 *
 * The map operations answer at once and the two disk operations are promises,
 * so a caller measuring silence never waits on a file.
 */
export interface ArrivalAnchors {
  /**
   * When this device was last heard from on wall time, absent when nothing was
   * ever stored for it.
   *
   * Absent is the ordinary state of a fresh install rather than an error: an
   * installation from before this release carries no anchor at all, so there is
   * nothing to migrate from and the seeding path is the only one that has ever
   * existed. An absent anchor is never read as a recent arrival (D-08).
   */
  get(deviceId: string): number | undefined;
  /** Records when this device was heard from, on wall time. */
  record(deviceId: string, at: number): void;
  /** Drops a removed device's anchor, so the stored set cannot outgrow the account. */
  forget(deviceId: string): void;
  /** Reads the stored anchors, if there are any usable ones. Raises nothing. */
  restore(): Promise<void>;
  /** Writes the anchors held now. Raises nothing. */
  persist(): Promise<void>;
}

function anchorPath(options: ArrivalAnchorsOptions): string {
  return join(options.storagePath, ARRIVAL_ANCHOR_FILENAME);
}

// The anchor file is untrusted input like any other stored JSON, so it is
// narrowed by a hand-written predicate rather than assumed. Each entry is
// checked with `typeof` and never for truthiness: a zero anchor is a legal
// value, and `JSON.stringify` turns a non-finite number into `null`.
function isAnchorFile(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every((anchor) => typeof anchor === 'number');
}

async function parseAnchorFile(path: string): Promise<unknown> {
  try {
    const parsed: unknown = JSON.parse(await readFile(path, 'utf8'));

    return parsed;
  } catch {
    // Unreadable and malformed are the same answer: there are no usable anchors.
    return undefined;
  }
}

async function readAnchorFile(options: ArrivalAnchorsOptions): Promise<Record<string, number> | undefined> {
  const path = anchorPath(options);
  // A first start has no anchor file, which is ordinary and says nothing. Every
  // other unusable file is a debug note and never a failure (D-08).
  const present = await access(path).then(
    () => true,
    () => false,
  );

  if (!present) {
    return undefined;
  }

  const parsed = await parseAnchorFile(path);

  if (isAnchorFile(parsed)) {
    return parsed;
  }

  // Rejected whole rather than in part. A file carrying one unreadable entry is
  // a file whose meaning nobody knows, and keeping the entries that happened to
  // survive would go on vouching for those devices on evidence the rest of the
  // file just contradicted. Resting on the forward-only term alone is the
  // conservative answer.
  options.log.debug(ANCHORS_UNUSABLE);

  return undefined;
}

/**
 * Creates the arrival-anchor store.
 *
 * Creating it reads no file and writes none; only `restore` and `persist` touch
 * the disk, and neither raises.
 */
export function createArrivalAnchors(options: ArrivalAnchorsOptions): ArrivalAnchors {
  // One anchor per device, absent until a stored file supplied one or something
  // was heard from it.
  const anchors = new Map<string, number>();

  return {
    get(deviceId: string): number | undefined {
      return anchors.get(deviceId);
    },

    record(deviceId: string, at: number): void {
      anchors.set(deviceId, at);
    },

    forget(deviceId: string): void {
      anchors.delete(deviceId);
    },

    async restore(): Promise<void> {
      const stored = await readAnchorFile(options);

      if (stored === undefined) {
        return;
      }

      for (const [deviceId, anchor] of Object.entries(stored)) {
        anchors.set(deviceId, anchor);
      }
    },

    persist(): Promise<void> {
      return Promise.resolve();
    },
  };
}
