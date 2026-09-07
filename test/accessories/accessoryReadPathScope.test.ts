/**
 * @fileoverview The static gate on the accessory read path: a HomeKit read is answered from
 * memory, and nothing in this plugin can turn one into vendor traffic.
 *
 * `RES-04` asks that getters return cached values without network calls. That is already true, and
 * it is true by construction rather than by a feature: the accessory tier publishes state, pushing
 * every value on `update()`, and HAP serves the last pushed value to a read with no handler
 * registered. So there is nothing to build here. What there is to do is keep it true as later code
 * lands, which is what this gate does (D-09).
 *
 * Two failures follow from a read that reaches the network, and neither shows up in a behavioural
 * test. A paired controller polls, so every poll would become a vendor request; and a read would
 * fail whenever the vendor is unreachable, which is the exact moment a cached, visibly stale value
 * exists to serve. The plugin would answer "no response" for a value it is holding.
 *
 * The read-handler half walks `src/` alone, and the confinement is load-bearing twice over. The
 * invariant is a claim about production code, so the production tree is what has to satisfy it --
 * and this file necessarily contains every spelling it searches for, so a walk that reached the
 * test tree would report the gate itself and could never assert an empty list.
 *
 * Each half enumerates a directory rather than a fixed list, so a module added later is covered
 * without anyone remembering to extend this file, and each asserts a floor on what the enumeration
 * found, because a gate that silently reads nothing reports the same green as a gate that read
 * everything.
 */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

/**
 * The cloud tier, as a module in the accessories tier would reach it.
 *
 * A directory rather than one module: every client under it talks to the vendor, so an accessory
 * module has no business importing any of them. Declared once and consumed by the detector and by
 * the planted fixture, so the rule and the control that proves it cannot drift apart.
 */
const CLOUD_DIRECTORY_SPECIFIER = '../cloud/';

/**
 * The account runtime, as a module in the accessories tier would reach it.
 *
 * It is named on its own because the rest of `../runtime/` is legitimately imported here -- the
 * timer port, the command port, the monitoring-trust type -- while this one module holds the cloud
 * client and the poll loop.
 */
const ACCOUNT_RUNTIME_SPECIFIER = '../runtime/accountRuntime.js';

/** The fluent method a read handler is registered through. */
const READ_HANDLER_METHOD = 'onGet';

/** The event name the same registration carries when it goes through the event emitter. */
const READ_HANDLER_EVENT = 'get';

/** The enumeration naming that event, and the member of it that is the read. */
const EVENT_TYPES_ENUM = 'CharacteristicEventTypes';
const EVENT_TYPES_READ_MEMBER = 'GET';

/** The two above as a reader writes them, which is what both the detector and its fixture consume. */
const EVENT_TYPES_READ_REFERENCE = `${EVENT_TYPES_ENUM}.${EVENT_TYPES_READ_MEMBER}`;

// The compiled case runs from `dist-test/test/accessories`, which puts the repository root three
// levels up. The floors below are what turn a wrong count of levels into a named failure rather
// than an empty read reporting success.
const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const ACCESSORIES_DIRECTORY = 'src/accessories';
const SOURCE_DIRECTORY = 'src';

// The accessories tier holds ten modules and the production tree forty. A gate that enumerated
// fewer than either read the wrong directory, and both assertions built on that read would pass
// without examining a single module.
const ACCESSORIES_MODULE_FLOOR = 10;
const SOURCE_MODULE_FLOOR = 40;

// A module specifier and a dotted enumeration member both carry `.`, which is the one
// regular-expression metacharacter either of them holds, so it is escaped on the way into a
// pattern. That keeps each spelling declared exactly once, above, rather than written a second
// time inside a regular expression where it could drift from the constant the fixtures use.
function asPattern(literal: string): string {
  return literal.replaceAll('.', '\\.');
}

// Matched by prefix, so an import of anything under the cloud directory is caught rather than only
// the one client this repository happens to hold today. The three spellings that actually reach a
// module are read -- `from '<specifier>'`, a side-effect `import '<specifier>'`, and a dynamic
// `import('<specifier>')` -- rather than the path wherever it appears, because a comment naming a
// directory is not an import of it. Either quote character is accepted: a module that reached for
// the cloud is already a module that got something wrong, so the gate does not also assume it
// obeyed the quote style.
function importsFrom(source: string, specifierPrefix: string): boolean {
  return new RegExp(`(\\bfrom\\s+|\\bimport\\s+|\\bimport\\s*\\(\\s*)['"]${asPattern(specifierPrefix)}`, 'u').test(source);
}

function reachesTheNetworkTier(source: string): boolean {
  return importsFrom(source, CLOUD_DIRECTORY_SPECIFIER) || importsFrom(source, ACCOUNT_RUNTIME_SPECIFIER);
}

// The four spellings that register a read handler: the fluent method, the event name in either
// quote style, and the enumeration member naming the same event. Every one requires the call that
// performs the registration, because this gate's own overview names all four in prose and a module
// that documents having no read handler is not a module that registered one. The write handler in
// `src/accessories/controls.ts` is deliberately not among them: `RES-04` governs reads, and the one
// path from HomeKit to the vendor is a write.
const READ_HANDLER_PATTERNS: readonly string[] = [
  `\\.${READ_HANDLER_METHOD}\\s*\\(`,
  `\\.on\\s*\\(\\s*'${READ_HANDLER_EVENT}'`,
  `\\.on\\s*\\(\\s*"${READ_HANDLER_EVENT}"`,
  `\\.on\\s*\\(\\s*${asPattern(EVENT_TYPES_READ_REFERENCE)}\\b`,
];

function registersReadHandler(source: string): boolean {
  return READ_HANDLER_PATTERNS.some((pattern) => new RegExp(pattern, 'u').test(source));
}

// Repository-relative and POSIX-separated, because that path is what the failing assertion prints:
// a gate that reports `true` names nothing an author can open.
function typeScriptFilesUnder(relativeDirectory: string): readonly string[] {
  return readdirSync(join(REPOSITORY_ROOT, relativeDirectory), { withFileTypes: true }).flatMap((entry) => {
    const path = `${relativeDirectory}/${entry.name}`;

    if (entry.isDirectory()) {
      return typeScriptFilesUnder(path);
    }

    return entry.name.endsWith('.ts') ? [path] : [];
  });
}

function offendersUnder(relativeDirectory: string, offends: (source: string) => boolean): readonly string[] {
  return typeScriptFilesUnder(relativeDirectory)
    .filter((file) => offends(readFileSync(join(REPOSITORY_ROOT, file), 'utf8')))
    .sort();
}

// One fixture per spelling the detector has to catch, each written out rather than generated from
// the table above, so a change to one spelling cannot silently satisfy its own control. Only the
// declared constants are interpolated, and they have to be: a fixture holding a spelling literally
// would make this gate report itself, and the real cases below could never assert an empty list.
const FLUENT_METHOD_HANDLER = `
service.getCharacteristic(hap.Characteristic.On).${READ_HANDLER_METHOD}(() => false);
`;
const SINGLE_QUOTED_EVENT_HANDLER = `
characteristic.on('${READ_HANDLER_EVENT}', (callback) => { callback(null, false); });
`;
const DOUBLE_QUOTED_EVENT_HANDLER = `
characteristic.on("${READ_HANDLER_EVENT}", (callback) => { callback(null, false); });
`;
const EVENT_TYPES_MEMBER_HANDLER = `
characteristic.on(${EVENT_TYPES_READ_REFERENCE}, (callback) => { callback(null, false); });
`;

// The import an accessory module would reach the vendor through.
const CLOUD_CLIENT_IMPORT = `
import { createCloudApi } from '${CLOUD_DIRECTORY_SPECIFIER}api.js';
`;
const ACCOUNT_RUNTIME_IMPORT = `
import { createAccountRuntime } from '${ACCOUNT_RUNTIME_SPECIFIER}';
`;

// One fixture per way the detector has to stay quiet: naming a forbidden spelling in prose is what
// this file and `src/accessories/basementGuardian.ts` both do, and an unrelated import from a
// neighbouring directory is what most modules in the accessories tier legitimately carry.
const COMMENT_NAMING_THE_SPELLINGS = `
// This module registers no ${READ_HANDLER_METHOD} handler, no '${READ_HANDLER_EVENT}' listener,
// and no ${EVENT_TYPES_READ_REFERENCE} listener; HAP serves the last pushed value.
`;
const UNRELATED_NEIGHBOURING_IMPORT = `
import type { Timers } from '../runtime/timers.js';
`;

test('no module in the accessories tier can reach the vendor (RES-04, D-09)', () => {
  // arrange
  const modules = typeScriptFilesUnder(ACCESSORIES_DIRECTORY);

  // act
  const reaching = offendersUnder(ACCESSORIES_DIRECTORY, reachesTheNetworkTier);

  // assert
  assert.ok(
    modules.length >= ACCESSORIES_MODULE_FLOOR,
    `the gate enumerated ${String(modules.length)} TypeScript modules under ${ACCESSORIES_DIRECTORY}, ` +
      `fewer than the ${String(ACCESSORIES_MODULE_FLOOR)} this repository holds`,
  );
  assert.deepStrictEqual(reaching, []);
});

test('no module under src registers a HomeKit read handler in any spelling that reaches one (RES-04, D-09)', () => {
  // arrange
  const modules = typeScriptFilesUnder(SOURCE_DIRECTORY);

  // act
  const registering = offendersUnder(SOURCE_DIRECTORY, registersReadHandler);

  // assert
  assert.ok(
    modules.length >= SOURCE_MODULE_FLOOR,
    `the gate enumerated ${String(modules.length)} TypeScript modules under ${SOURCE_DIRECTORY}, ` +
      `fewer than the ${String(SOURCE_MODULE_FLOOR)} this repository holds`,
  );
  assert.deepStrictEqual(registering, []);
});

test('reports a planted read handler in every spelling it is meant to catch (D-09)', () => {
  // act & assert
  assert.deepStrictEqual(
    {
      fluentMethod: registersReadHandler(FLUENT_METHOD_HANDLER),
      singleQuotedEvent: registersReadHandler(SINGLE_QUOTED_EVENT_HANDLER),
      doubleQuotedEvent: registersReadHandler(DOUBLE_QUOTED_EVENT_HANDLER),
      eventTypesMember: registersReadHandler(EVENT_TYPES_MEMBER_HANDLER),
    },
    { fluentMethod: true, singleQuotedEvent: true, doubleQuotedEvent: true, eventTypesMember: true },
  );
});

test('reports a planted import of the cloud client and of the account runtime (D-09)', () => {
  // act & assert
  assert.deepStrictEqual(
    { cloudClient: reachesTheNetworkTier(CLOUD_CLIENT_IMPORT), accountRuntime: reachesTheNetworkTier(ACCOUNT_RUNTIME_IMPORT) },
    { cloudClient: true, accountRuntime: true },
  );
});

test('reports neither a comment naming the forbidden spellings nor an unrelated neighbouring import (D-09)', () => {
  // act & assert
  assert.deepStrictEqual(
    {
      comment: registersReadHandler(COMMENT_NAMING_THE_SPELLINGS),
      unrelatedImport: reachesTheNetworkTier(UNRELATED_NEIGHBOURING_IMPORT),
    },
    { comment: false, unrelatedImport: false },
  );
});
