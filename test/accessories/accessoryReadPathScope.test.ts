// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

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
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  createSourceFile,
  forEachChild,
  isCallExpression,
  isElementAccessExpression,
  isIdentifier,
  isNoSubstitutionTemplateLiteral,
  isPropertyAccessExpression,
  isStringLiteral,
  ScriptTarget,
  type Node,
} from 'typescript';

import { importSpecifiers, typeScriptFilesUnder } from './staticGateSources.js';

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

// The accessories tier holds ten modules and the production tree forty-three. A gate that enumerated
// fewer than either read the wrong directory, and both assertions built on that read would pass
// without examining a single module.
const ACCESSORIES_MODULE_FLOOR = 10;
const SOURCE_MODULE_FLOOR = 43;

function reachesTheNetworkTier(source: string): boolean {
  return importSpecifiers(source).some((specifier) => specifier.startsWith(CLOUD_DIRECTORY_SPECIFIER) || specifier === ACCOUNT_RUNTIME_SPECIFIER);
}

function registersReadHandler(source: string): boolean {
  const file = createSourceFile('readHandler.ts', source, ScriptTarget.Latest, true);
  let registered = false;

  function literalText(node: Node | undefined): string | undefined {
    return node && (isStringLiteral(node) || isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined;
  }

  function visit(node: Node): void {
    if (isCallExpression(node)) {
      const callee = node.expression;
      let method: string | undefined;
      if (isPropertyAccessExpression(callee)) {
        method = callee.name.text;
      } else if (isElementAccessExpression(callee)) {
        method = literalText(callee.argumentExpression);
      }

      const event = node.arguments[0];
      if (
        method === READ_HANDLER_METHOD ||
        (method === 'on' &&
          event &&
          (literalText(event) === READ_HANDLER_EVENT ||
            (isPropertyAccessExpression(event) &&
              isIdentifier(event.expression) &&
              event.expression.text === EVENT_TYPES_ENUM &&
              event.name.text === EVENT_TYPES_READ_MEMBER)))
      ) {
        registered = true;
      }
    }

    forEachChild(node, visit);
  }

  visit(file);
  return registered;
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
const COMMENT_INTERLEAVED_METHOD_HANDLER = `
characteristic.${READ_HANDLER_METHOD} /* comment */ (() => false);
`;
const COMMENT_INTERLEAVED_EVENT_HANDLER = `
characteristic.on(/* comment */ '${READ_HANDLER_EVENT}', (callback) => { callback(null, false); });
`;
const COMPUTED_METHOD_HANDLER = `
characteristic['${READ_HANDLER_METHOD}'](() => false);
`;
const COMPUTED_EVENT_HANDLER = `
characteristic['on']('${READ_HANDLER_EVENT}', (callback) => { callback(null, false); });
`;
const BACKTICK_EVENT_HANDLER = 'characteristic.on(`' + READ_HANDLER_EVENT + '`, (callback) => { callback(null, false); });';
const BACKTICK_COMPUTED_METHOD_HANDLER = 'characteristic[`' + READ_HANDLER_METHOD + '`](() => false);';
const BACKTICK_COMPUTED_EVENT_HANDLER = 'characteristic[`on`](`' + READ_HANDLER_EVENT + '`, (callback) => { callback(null, false); });';
const DIAGNOSTIC_STRING = `
const diagnostic = "characteristic.${READ_HANDLER_METHOD}(() => false)";
`;

// The import an accessory module would reach the vendor through.
const CLOUD_CLIENT_IMPORT = `
import { createCloudApi } from '${CLOUD_DIRECTORY_SPECIFIER}api.js';
`;
const ACCOUNT_RUNTIME_IMPORT = `
import { createAccountRuntime } from '${ACCOUNT_RUNTIME_SPECIFIER}';
`;
const COMMENT_INTERLEAVED_CLOUD_IMPORT = `
import { createCloudApi } from /* a valid comment */ '${CLOUD_DIRECTORY_SPECIFIER}api.js';
`;
const COMMENT_INTERLEAVED_RUNTIME_IMPORT = `
import { createAccountRuntime } from /* a valid comment */ '${ACCOUNT_RUNTIME_SPECIFIER}';
`;
const BACKTICK_DYNAMIC_CLOUD_IMPORT = 'const cloud = await import(`' + CLOUD_DIRECTORY_SPECIFIER + 'api.js`);';
const CREATE_REQUIRE_CLOUD_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
const cloud = loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const NAMESPACE_CREATE_REQUIRE_CLOUD_IMPORT = `
import * as module from 'node:module';
const loadModule = module.createRequire(import.meta.url);
const cloud = loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const SHADOWED_CREATE_REQUIRE_CLOUD_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
function run(loadModule: (name: string) => void) {
  loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
}
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
  // act
  const registrations = {
    fluentMethod: registersReadHandler(FLUENT_METHOD_HANDLER),
    singleQuotedEvent: registersReadHandler(SINGLE_QUOTED_EVENT_HANDLER),
    doubleQuotedEvent: registersReadHandler(DOUBLE_QUOTED_EVENT_HANDLER),
    eventTypesMember: registersReadHandler(EVENT_TYPES_MEMBER_HANDLER),
    commentInterleavedMethod: registersReadHandler(COMMENT_INTERLEAVED_METHOD_HANDLER),
    commentInterleavedEvent: registersReadHandler(COMMENT_INTERLEAVED_EVENT_HANDLER),
    computedMethod: registersReadHandler(COMPUTED_METHOD_HANDLER),
    computedEvent: registersReadHandler(COMPUTED_EVENT_HANDLER),
    backtickEvent: registersReadHandler(BACKTICK_EVENT_HANDLER),
    backtickComputedMethod: registersReadHandler(BACKTICK_COMPUTED_METHOD_HANDLER),
    backtickComputedEvent: registersReadHandler(BACKTICK_COMPUTED_EVENT_HANDLER),
  };

  // assert
  assert.deepStrictEqual(registrations, {
    fluentMethod: true,
    singleQuotedEvent: true,
    doubleQuotedEvent: true,
    eventTypesMember: true,
    commentInterleavedMethod: true,
    commentInterleavedEvent: true,
    computedMethod: true,
    computedEvent: true,
    backtickEvent: true,
    backtickComputedMethod: true,
    backtickComputedEvent: true,
  });
});

test('ignores a read-handler spelling inside a diagnostic string', () => {
  // act
  const registration = registersReadHandler(DIAGNOSTIC_STRING);

  // assert
  assert.strictEqual(registration, false);
});

test('reports a planted import of the cloud client and of the account runtime (D-09)', () => {
  // act
  const imports = {
    cloudClient: reachesTheNetworkTier(CLOUD_CLIENT_IMPORT),
    accountRuntime: reachesTheNetworkTier(ACCOUNT_RUNTIME_IMPORT),
    commentInterleavedCloud: reachesTheNetworkTier(COMMENT_INTERLEAVED_CLOUD_IMPORT),
    commentInterleavedRuntime: reachesTheNetworkTier(COMMENT_INTERLEAVED_RUNTIME_IMPORT),
    backtickDynamicCloud: reachesTheNetworkTier(BACKTICK_DYNAMIC_CLOUD_IMPORT),
    createRequireCloud: reachesTheNetworkTier(CREATE_REQUIRE_CLOUD_IMPORT),
    namespaceCreateRequireCloud: reachesTheNetworkTier(NAMESPACE_CREATE_REQUIRE_CLOUD_IMPORT),
  };

  // assert
  assert.deepStrictEqual(imports, {
    cloudClient: true,
    accountRuntime: true,
    commentInterleavedCloud: true,
    commentInterleavedRuntime: true,
    backtickDynamicCloud: true,
    createRequireCloud: true,
    namespaceCreateRequireCloud: true,
  });
});

test('reports neither a comment naming the forbidden spellings nor an unrelated neighbouring import (D-09)', () => {
  // act
  const detections = {
    comment: registersReadHandler(COMMENT_NAMING_THE_SPELLINGS),
    unrelatedImport: reachesTheNetworkTier(UNRELATED_NEIGHBOURING_IMPORT),
    shadowedCreateRequire: reachesTheNetworkTier(SHADOWED_CREATE_REQUIRE_CLOUD_IMPORT),
  };

  // assert
  assert.deepStrictEqual(detections, { comment: false, unrelatedImport: false, shadowedCreateRequire: false });
});
