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
import { dirname, join, resolve, sep } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  createSourceFile,
  forEachChild,
  isBinaryExpression,
  isBlock,
  isCallExpression,
  isElementAccessExpression,
  isFunctionLike,
  isIdentifier,
  isNoSubstitutionTemplateLiteral,
  isObjectBindingPattern,
  isObjectLiteralExpression,
  isParenthesizedExpression,
  isPropertyAssignment,
  isPropertyAccessExpression,
  isStringLiteral,
  isTemplateExpression,
  isVariableDeclaration,
  NodeFlags,
  ScriptTarget,
  SyntaxKind,
  type Node,
  type ObjectBindingPattern,
} from 'typescript';

import { moduleLoads, typeScriptFilesUnder } from './staticGateSources.js';

/**
 * The cloud tier, as a module in the accessories tier would reach it.
 *
 * A directory rather than one module: every client under it talks to the vendor, so an accessory
 * module has no business importing any of them. The fixtures use this canonical spelling; the
 * detector compares resolved paths so equivalent relative spellings have the same result.
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
const READ_EVENT_LISTENER_METHODS = new Set(['on', 'addListener', 'once', 'prependListener', 'prependOnceListener']);

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
const FIXTURE_ACCESSORY_FILE = 'src/accessories/basementGuardian.ts';
const NESTED_FIXTURE_ACCESSORY_FILE = 'src/accessories/nested/fixture.ts';
const CLOUD_DIRECTORY = join(REPOSITORY_ROOT, 'src', 'cloud');
const ACCOUNT_RUNTIME_FILE = join(REPOSITORY_ROOT, 'src', 'runtime', 'accountRuntime.js');

// The accessories tier holds ten modules and the production tree forty-three. A gate that enumerated
// fewer than either read the wrong directory, and both assertions built on that read would pass
// without examining a single module.
const ACCESSORIES_MODULE_FLOOR = 10;
const SOURCE_MODULE_FLOOR = 43;

function reachesTheNetworkTier(source: string, sourceFile: string = FIXTURE_ACCESSORY_FILE): boolean {
  return moduleLoads(source).some(({ specifier, base }) => {
    if (!specifier.startsWith('.')) {
      return false;
    }

    const pathname = specifier.replace(/[?#].*$/, '');
    const target = resolve(REPOSITORY_ROOT, dirname(sourceFile), dirname(base), pathname);
    return target.startsWith(`${CLOUD_DIRECTORY}${sep}`) || target === ACCOUNT_RUNTIME_FILE;
  });
}

function registersReadHandler(source: string): boolean {
  const file = createSourceFile('readHandler.ts', source, ScriptTarget.Latest, true);
  let registered = false;
  const scopes: Map<string, boolean>[] = [new Map<string, boolean>()];
  const objectScopes: Map<string, boolean>[] = [new Map<string, boolean>()];
  const methodScopes: Map<string, string | undefined>[] = [new Map<string, string | undefined>()];
  const characteristicScopes: Map<string, boolean>[] = [new Map<string, boolean>()];

  function readAlias(name: string): boolean {
    for (let index = scopes.length - 1; index >= 0; index--) {
      if (scopes[index]?.has(name)) {
        return scopes[index]?.get(name) ?? false;
      }
    }

    return false;
  }

  function literalText(node: Node | undefined): string | undefined {
    return node && (isStringLiteral(node) || isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined;
  }

  function fixedEventText(node: Node | undefined): string | undefined {
    if (!node) {
      return undefined;
    }

    if (isParenthesizedExpression(node)) {
      return fixedEventText(node.expression);
    }

    if (isIdentifier(node)) {
      return methodAlias(node.text);
    }

    if (isBinaryExpression(node) && node.operatorToken.kind === SyntaxKind.PlusToken) {
      const left = fixedEventText(node.left);
      const right = fixedEventText(node.right);
      return left === undefined || right === undefined ? undefined : left + right;
    }

    if (isTemplateExpression(node)) {
      let text = node.head.text;
      for (const span of node.templateSpans) {
        const part = fixedEventText(span.expression);
        if (part === undefined) {
          return undefined;
        }

        text += part + span.literal.text;
      }

      return text;
    }

    return literalText(node);
  }

  function methodAlias(name: string): string | undefined {
    for (let index = methodScopes.length - 1; index >= 0; index--) {
      if (methodScopes[index]?.has(name)) {
        return methodScopes[index]?.get(name);
      }
    }

    return undefined;
  }

  function staticMember(node: Node, fixedKey = false): { receiver: Node; name: string } | undefined {
    if (isPropertyAccessExpression(node)) {
      return { receiver: node.expression, name: node.name.text };
    }

    if (isElementAccessExpression(node)) {
      const argument = node.argumentExpression;
      let name = fixedKey ? fixedEventText(argument) : literalText(argument);
      if (!fixedKey && name === undefined && isIdentifier(argument)) {
        name = methodAlias(argument.text);
      }

      return name === undefined ? undefined : { receiver: node.expression, name };
    }

    return undefined;
  }

  function isCharacteristicReceiver(node: Node): boolean {
    if (isParenthesizedExpression(node)) {
      return isCharacteristicReceiver(node.expression);
    }

    if (isIdentifier(node)) {
      for (let index = characteristicScopes.length - 1; index >= 0; index--) {
        if (characteristicScopes[index]?.has(node.text)) {
          return characteristicScopes[index]?.get(node.text) ?? false;
        }
      }

      return node.text === 'characteristic';
    }

    return isCallExpression(node) && staticMember(node.expression)?.name === 'getCharacteristic';
  }

  function isReadEvent(node: Node | undefined): boolean {
    if (!node) {
      return false;
    }

    if (isParenthesizedExpression(node)) {
      return isReadEvent(node.expression);
    }

    if (fixedEventText(node) === READ_HANDLER_EVENT) {
      return true;
    }

    if (isIdentifier(node)) {
      return readAlias(node.text);
    }

    const member = staticMember(node, true);
    if (member?.name !== EVENT_TYPES_READ_MEMBER) {
      return false;
    }

    const owner = member.receiver;
    return (isIdentifier(owner) && owner.text === EVENT_TYPES_ENUM) || isReadEventObject(owner);
  }

  function isReadEventObject(node: Node | undefined): boolean {
    if (node && isParenthesizedExpression(node)) {
      return isReadEventObject(node.expression);
    }

    if (node && isIdentifier(node)) {
      for (let index = objectScopes.length - 1; index >= 0; index--) {
        if (objectScopes[index]?.has(node.text)) {
          return objectScopes[index]?.get(node.text) ?? false;
        }
      }
    }

    const member = node && staticMember(node);
    if (member?.name === EVENT_TYPES_ENUM && isIdentifier(member.receiver) && member.receiver.text === 'hap') {
      return true;
    }

    return (
      !!node &&
      isObjectLiteralExpression(node) &&
      node.properties.some(
        (property) =>
          isPropertyAssignment(property) &&
          (isIdentifier(property.name) || isStringLiteral(property.name)) &&
          property.name.text === EVENT_TYPES_READ_MEMBER &&
          isReadEvent(property.initializer),
      )
    );
  }

  function recordObjectBinding(binding: ObjectBindingPattern, initializer: Node | undefined, fixed: boolean): void {
    const readObject = fixed && isReadEventObject(initializer);
    for (const element of binding.elements) {
      const source = element.propertyName ?? element.name;
      if (isIdentifier(element.name)) {
        const readEvent = readObject && (isIdentifier(source) || isStringLiteral(source)) && source.text === EVENT_TYPES_READ_MEMBER;
        scopes[scopes.length - 1]?.set(element.name.text, readEvent);
        methodScopes[methodScopes.length - 1]?.set(element.name.text, undefined);
        characteristicScopes[characteristicScopes.length - 1]?.set(element.name.text, false);
      }
    }
  }

  function recordAlias(node: Node): void {
    if (!isVariableDeclaration(node)) {
      return;
    }

    const fixed = (node.parent.flags & NodeFlags.Const) !== 0;
    if (isObjectBindingPattern(node.name)) {
      recordObjectBinding(node.name, node.initializer, fixed);
      return;
    }

    if (!isIdentifier(node.name)) {
      return;
    }

    methodScopes[methodScopes.length - 1]?.set(node.name.text, undefined);
    characteristicScopes[characteristicScopes.length - 1]?.set(node.name.text, fixed && !!node.initializer && isCharacteristicReceiver(node.initializer));
    scopes[scopes.length - 1]?.set(node.name.text, fixed && isReadEvent(node.initializer));
    objectScopes[objectScopes.length - 1]?.set(node.name.text, fixed && isReadEventObject(node.initializer));
    methodScopes[methodScopes.length - 1]?.set(node.name.text, fixed ? fixedEventText(node.initializer) : undefined);
  }

  function recordUse(node: Node): void {
    if (isCallExpression(node)) {
      const member = staticMember(node.expression);
      const method = member?.name;
      const event = node.arguments[0];
      if (
        member &&
        isCharacteristicReceiver(member.receiver) &&
        (method === READ_HANDLER_METHOD || (method && READ_EVENT_LISTENER_METHODS.has(method) && isReadEvent(event)))
      ) {
        registered = true;
      }
    }
  }

  function visit(node: Node): void {
    const ownScope = isBlock(node) || isFunctionLike(node);
    if (ownScope) {
      const scope = new Map<string, boolean>();
      const objectScope = new Map<string, boolean>();
      const methodScope = new Map<string, string | undefined>();
      const characteristicScope = new Map<string, boolean>();
      if (isFunctionLike(node)) {
        for (const parameter of node.parameters) {
          if (isIdentifier(parameter.name)) {
            scope.set(parameter.name.text, false);
            objectScope.set(parameter.name.text, false);
            methodScope.set(parameter.name.text, undefined);
            characteristicScope.set(parameter.name.text, parameter.name.text === 'characteristic');
          }
        }
      }

      scopes.push(scope);
      objectScopes.push(objectScope);
      methodScopes.push(methodScope);
      characteristicScopes.push(characteristicScope);
    }

    recordAlias(node);
    recordUse(node);
    forEachChild(node, visit);
    if (ownScope) {
      scopes.pop();
      objectScopes.pop();
      methodScopes.pop();
      characteristicScopes.pop();
    }
  }

  visit(file);
  return registered;
}

function offendersUnder(relativeDirectory: string, offends: (source: string, sourceFile: string) => boolean): readonly string[] {
  return typeScriptFilesUnder(relativeDirectory)
    .filter((file) => offends(readFileSync(join(REPOSITORY_ROOT, file), 'utf8'), file))
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
const QUALIFIED_EVENT_TYPES_MEMBER_HANDLER = `
characteristic.on(hap.${EVENT_TYPES_READ_REFERENCE}, (callback) => { callback(null, false); });
`;
const COMPUTED_EVENT_TYPES_MEMBER_HANDLER = `
characteristic.on(${EVENT_TYPES_ENUM}['${EVENT_TYPES_READ_MEMBER}'], (callback) => { callback(null, false); });
`;
const QUALIFIED_COMPUTED_EVENT_TYPES_MEMBER_HANDLER = `
characteristic.on(hap['${EVENT_TYPES_ENUM}']['${EVENT_TYPES_READ_MEMBER}'], (callback) => { callback(null, false); });
`;
const FIXED_READ_EVENT_HANDLER = `
const event = '${READ_HANDLER_EVENT}';
characteristic.on(event, handler);
`;
const FIXED_ENUM_READ_EVENT_HANDLER = `
const event = ${EVENT_TYPES_READ_REFERENCE};
characteristic.on(event, handler);
`;
const OTHER_FIXED_EVENT_HANDLER = `
const event = 'change';
characteristic.on(event, handler);
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
const FIXED_METHOD_HANDLER = `
const method = '${READ_HANDLER_METHOD}';
characteristic[method](() => false);
`;
const FIXED_EVENT_METHOD_HANDLER = `
const method = 'on';
characteristic[method]('${READ_HANDLER_EVENT}', handler);
`;
const FIXED_ADD_LISTENER_METHOD_HANDLER = `
const method = 'addListener';
characteristic[method]('${READ_HANDLER_EVENT}', handler);
`;
const UNRELATED_FIXED_METHOD_HANDLER = `
const method = 'emit';
characteristic[method]('${READ_HANDLER_EVENT}', handler);
`;
const BACKTICK_EVENT_HANDLER = 'characteristic.on(`' + READ_HANDLER_EVENT + '`, (callback) => { callback(null, false); });';
const BACKTICK_COMPUTED_METHOD_HANDLER = 'characteristic[`' + READ_HANDLER_METHOD + '`](() => false);';
const BACKTICK_COMPUTED_EVENT_HANDLER = 'characteristic[`on`](`' + READ_HANDLER_EVENT + '`, (callback) => { callback(null, false); });';
const ADD_LISTENER_READ_HANDLER = `characteristic.addListener('${READ_HANDLER_EVENT}', handler);`;
const ONCE_READ_HANDLER = `characteristic.once('${READ_HANDLER_EVENT}', handler);`;
const PREPEND_LISTENER_READ_HANDLER = `characteristic.prependListener('${READ_HANDLER_EVENT}', handler);`;
const PREPEND_ONCE_LISTENER_READ_HANDLER = `characteristic.prependOnceListener('${READ_HANDLER_EVENT}', handler);`;
const OTHER_EVENT_LISTENERS = `
characteristic.addListener('change', handler);
characteristic.once('change', handler);
characteristic.prependListener('change', handler);
characteristic.prependOnceListener('change', handler);
`;
const DIAGNOSTIC_STRING = `
const diagnostic = "characteristic.${READ_HANDLER_METHOD}(() => false)";
const eventDiagnostic = "characteristic.on(hap.${EVENT_TYPES_READ_REFERENCE}, handler)";
`;

// The import an accessory module would reach the vendor through.
const CLOUD_CLIENT_IMPORT = `
import { createCloudApi } from '${CLOUD_DIRECTORY_SPECIFIER}api.js';
`;
const ACCOUNT_RUNTIME_IMPORT = `
import { createAccountRuntime } from '${ACCOUNT_RUNTIME_SPECIFIER}';
`;
const QUERY_DYNAMIC_ACCOUNT_RUNTIME_IMPORT = `
const runtime = await import('${ACCOUNT_RUNTIME_SPECIFIER}?probe');
`;
const FRAGMENT_ACCOUNT_RUNTIME_IMPORT = `
import { createAccountRuntime } from '${ACCOUNT_RUNTIME_SPECIFIER}#probe';
`;
const QUERY_NEIGHBOURING_RUNTIME_IMPORT = `
const timers = await import('../runtime/timers.js?probe');
`;
const ALTERNATE_CLOUD_CLIENT_IMPORT = `
import { createCloudApi } from '../../src/cloud/api.js';
`;
const ALTERNATE_ACCOUNT_RUNTIME_IMPORT = `
import { createAccountRuntime } from '../../src/runtime/accountRuntime.js';
`;
const NESTED_CLOUD_CLIENT_IMPORT = `
import { createCloudApi } from '../../cloud/api.js';
`;
const COMMENT_INTERLEAVED_CLOUD_IMPORT = `
import { createCloudApi } from /* a valid comment */ '${CLOUD_DIRECTORY_SPECIFIER}api.js';
`;
const COMMENT_INTERLEAVED_RUNTIME_IMPORT = `
import { createAccountRuntime } from /* a valid comment */ '${ACCOUNT_RUNTIME_SPECIFIER}';
`;
const BACKTICK_DYNAMIC_CLOUD_IMPORT = 'const cloud = await import(`' + CLOUD_DIRECTORY_SPECIFIER + 'api.js`);';
const CONSTANT_DYNAMIC_CLOUD_IMPORT = `
const target = '${CLOUD_DIRECTORY_SPECIFIER}api.js';
const cloud = await import(target);
`;
const COMPUTED_DYNAMIC_CLOUD_IMPORT = `
const cloud = await import('../cloud/' + 'api.js');
`;
const COMPUTED_CONSTANT_DYNAMIC_CLOUD_IMPORT = `
const target = '../cloud/' + 'api.js';
const cloud = await import(target);
`;
const FIXED_TEMPLATE_DYNAMIC_CLOUD_IMPORT = 'const cloud = await import(`../cloud/${"api.js"}`);';
const UNRESOLVED_DYNAMIC_IMPORT = 'const cloud = await import(process.env.MODULE);';
const UNRESOLVED_CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
const cloud = loadModule(process.env.MODULE);
`;
const UNRELATED_CONSTANT_DYNAMIC_IMPORT = `
const target = '../runtime/timers.js';
const timers = await import(target);
`;
const UNRELATED_COMPUTED_DYNAMIC_IMPORT = `
const timers = await import('../runtime/' + 'timers.js');
`;
const UNRELATED_FIXED_TEMPLATE_DYNAMIC_IMPORT = 'const timers = await import(`../runtime/${"timers.js"}`);';
const CREATE_REQUIRE_CLOUD_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
const cloud = loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const IMMEDIATE_CREATE_REQUIRE_CLOUD_IMPORT = `
import { createRequire } from 'node:module';
const cloud = createRequire(import.meta.url)('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const UNRESOLVED_IMMEDIATE_CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
const cloud = createRequire(import.meta.url)(process.env.MODULE);
`;
const CONSTANT_CREATE_REQUIRE_CLOUD_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
const target = '${CLOUD_DIRECTORY_SPECIFIER}api.js';
const cloud = loadModule(target);
`;
const COMPUTED_CREATE_REQUIRE_CLOUD_SPECIFIER = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
const cloud = loadModule('../cloud/' + 'api.js');
`;
const NAMESPACE_CREATE_REQUIRE_CLOUD_IMPORT = `
import * as module from 'node:module';
const loadModule = module.createRequire(import.meta.url);
const cloud = loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const ALIASED_NAMESPACE_CREATE_REQUIRE_CLOUD_IMPORT = `
import * as module from 'node:module';
const moduleAlias = module;
const loadModule = moduleAlias.createRequire(import.meta.url);
const cloud = loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const DESTRUCTURED_CREATE_REQUIRE_CLOUD_IMPORT = `
import * as module from 'node:module';
const { createRequire } = module;
const loadModule = createRequire(import.meta.url);
const cloud = loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const DYNAMIC_DESTRUCTURED_CREATE_REQUIRE_CLOUD_IMPORT = `
const { createRequire } = await import('node:module');
const loadModule = createRequire(import.meta.url);
const cloud = loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const DYNAMIC_NAMESPACE_CREATE_REQUIRE_CLOUD_IMPORT = `
const module = await import('node:module');
const loadModule = module.createRequire(import.meta.url);
const cloud = loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const ALIASED_DYNAMIC_NAMESPACE_CREATE_REQUIRE_CLOUD_IMPORT = `
const module = await import('node:module');
const moduleAlias = module;
const loadModule = moduleAlias.createRequire(import.meta.url);
const cloud = loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const RENAMED_DESTRUCTURED_CREATE_REQUIRE_CLOUD_IMPORT = `
import * as module from 'node:module';
const { createRequire: makeRequire } = module;
const loadModule = makeRequire(import.meta.url);
const cloud = loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const COMPUTED_CREATE_REQUIRE_CLOUD_IMPORT = `
import * as module from 'node:module';
const loadModule = module['createRequire'](import.meta.url);
const cloud = loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const DEFAULT_CREATE_REQUIRE_CLOUD_IMPORT = `
import module from 'node:module';
const loadModule = module.createRequire(import.meta.url);
const cloud = loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const ALIASED_CREATE_REQUIRE_CLOUD_IMPORT = `
import { createRequire } from 'node:module';
const makeRequire = createRequire;
const loadModule = makeRequire(import.meta.url);
const cloud = loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const ALTERNATE_BASE_CREATE_REQUIRE_CLOUD_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(new URL('./probe.js', import.meta.url));
const cloud = loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const PARENT_BASE_CREATE_REQUIRE_CLOUD_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(new URL('../probe.js', import.meta.url));
const cloud = loadModule('./cloud/api.js');
`;
const PARENT_BASE_CREATE_REQUIRE_NEIGHBOUR_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(new URL('../probe.js', import.meta.url));
const timers = loadModule('./runtime/timers.js');
`;
const UNRESOLVED_BASE_CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(process.env.BASE);
const cloud = loadModule('./cloud/api.js');
`;
const LOADER_ALIAS_CLOUD_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
const load = loadModule;
const cloud = load('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const SHADOWED_CREATE_REQUIRE_CLOUD_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
function run(loadModule: (name: string) => void) {
  loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
}
`;
const SHADOWED_CREATOR_ALIAS_CLOUD_IMPORT = `
import { createRequire } from 'node:module';
const makeRequire = createRequire;
function run(makeRequire: (url: string) => (name: string) => void) {
  const loadModule = makeRequire(import.meta.url);
  loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
}
`;
const UNRELATED_LOADER_CALL = `
function run(load: (name: string) => void) {
  load('${CLOUD_DIRECTORY_SPECIFIER}api.js');
}
`;
const UNRELATED_NESTED_CALL = `
const other = () => (name: string) => name;
const cloud = other()('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const UNRELATED_NAMESPACE_ALIAS = `
const other = { createRequire: () => (name: string) => name };
const moduleAlias = other;
const loadModule = moduleAlias.createRequire(import.meta.url);
const cloud = loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const UNRELATED_DESTRUCTURED_CREATE_REQUIRE_CLOUD_IMPORT = `
const other = { createRequire: () => (name: string) => name };
const { createRequire: makeRequire } = other;
const loadModule = makeRequire(import.meta.url);
const cloud = loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const UNRELATED_DYNAMIC_DESTRUCTURE = `
const { createRequire } = await import('other-module');
const loadModule = createRequire(import.meta.url);
const cloud = loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
`;
const UNRELATED_DYNAMIC_NAMESPACE = `
const module = await import('other-module');
const loadModule = module.createRequire(import.meta.url);
const cloud = loadModule('${CLOUD_DIRECTORY_SPECIFIER}api.js');
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
    qualifiedEventTypesMember: registersReadHandler(QUALIFIED_EVENT_TYPES_MEMBER_HANDLER),
    computedEventTypesMember: registersReadHandler(COMPUTED_EVENT_TYPES_MEMBER_HANDLER),
    qualifiedComputedEventTypesMember: registersReadHandler(QUALIFIED_COMPUTED_EVENT_TYPES_MEMBER_HANDLER),
    fixedReadEvent: registersReadHandler(FIXED_READ_EVENT_HANDLER),
    fixedEnumReadEvent: registersReadHandler(FIXED_ENUM_READ_EVENT_HANDLER),
    commentInterleavedMethod: registersReadHandler(COMMENT_INTERLEAVED_METHOD_HANDLER),
    commentInterleavedEvent: registersReadHandler(COMMENT_INTERLEAVED_EVENT_HANDLER),
    computedMethod: registersReadHandler(COMPUTED_METHOD_HANDLER),
    computedEvent: registersReadHandler(COMPUTED_EVENT_HANDLER),
    fixedMethod: registersReadHandler(FIXED_METHOD_HANDLER),
    fixedEventMethod: registersReadHandler(FIXED_EVENT_METHOD_HANDLER),
    fixedAddListenerMethod: registersReadHandler(FIXED_ADD_LISTENER_METHOD_HANDLER),
    backtickEvent: registersReadHandler(BACKTICK_EVENT_HANDLER),
    backtickComputedMethod: registersReadHandler(BACKTICK_COMPUTED_METHOD_HANDLER),
    backtickComputedEvent: registersReadHandler(BACKTICK_COMPUTED_EVENT_HANDLER),
    addListener: registersReadHandler(ADD_LISTENER_READ_HANDLER),
    once: registersReadHandler(ONCE_READ_HANDLER),
    prependListener: registersReadHandler(PREPEND_LISTENER_READ_HANDLER),
    prependOnceListener: registersReadHandler(PREPEND_ONCE_LISTENER_READ_HANDLER),
  };

  // assert
  assert.deepStrictEqual(registrations, {
    fluentMethod: true,
    singleQuotedEvent: true,
    doubleQuotedEvent: true,
    eventTypesMember: true,
    qualifiedEventTypesMember: true,
    computedEventTypesMember: true,
    qualifiedComputedEventTypesMember: true,
    fixedReadEvent: true,
    fixedEnumReadEvent: true,
    commentInterleavedMethod: true,
    commentInterleavedEvent: true,
    computedMethod: true,
    computedEvent: true,
    fixedMethod: true,
    fixedEventMethod: true,
    fixedAddListenerMethod: true,
    backtickEvent: true,
    backtickComputedMethod: true,
    backtickComputedEvent: true,
    addListener: true,
    once: true,
    prependListener: true,
    prependOnceListener: true,
  });
});

test('ignores other EventEmitter events in the read-handler gate', () => {
  // act
  const registrations = {
    direct: registersReadHandler(OTHER_EVENT_LISTENERS),
    fixed: registersReadHandler(OTHER_FIXED_EVENT_HANDLER),
    unrelatedMethod: registersReadHandler(UNRELATED_FIXED_METHOD_HANDLER),
  };

  // assert
  assert.deepStrictEqual(registrations, { direct: false, fixed: false, unrelatedMethod: false });
});

test('counts read handlers on characteristic aliases without counting unrelated emitters', () => {
  // arrange
  const aliasedMethod = 'const control = service.getCharacteristic(hap.Characteristic.On); const alias = control; alias.onGet(handler);';
  const aliasedEvent = 'const control = service.getCharacteristic(hap.Characteristic.On); control.on("get", handler);';
  const unrelatedMethod = 'other.onGet(handler);';
  const unrelatedEvent = 'emitter.on("get", handler);';
  const unrelatedAlias = 'const control = emitter; control.on("get", handler);';

  // act
  const registrations = {
    aliasedMethod: registersReadHandler(aliasedMethod),
    aliasedEvent: registersReadHandler(aliasedEvent),
    unrelatedMethod: registersReadHandler(unrelatedMethod),
    unrelatedEvent: registersReadHandler(unrelatedEvent),
    unrelatedAlias: registersReadHandler(unrelatedAlias),
  };

  // assert
  assert.deepStrictEqual(registrations, { aliasedMethod: true, aliasedEvent: true, unrelatedMethod: false, unrelatedEvent: false, unrelatedAlias: false });
});

test('resolves fixed read events through object bindings without following unrelated or shadowed names', () => {
  // arrange
  const direct = `const events = { GET: hap.${EVENT_TYPES_READ_REFERENCE} }; const { GET } = events; characteristic.on(GET, handler);`;
  const renamed = `const events = { GET: hap.${EVENT_TYPES_READ_REFERENCE} }; const { GET: readEvent } = events; characteristic.on(readEvent, handler);`;
  const unrelated = 'const events = { GET: other.GET }; const { GET } = events; characteristic.on(GET, handler);';
  const shadowedObject = `
const events = { GET: hap.${EVENT_TYPES_READ_REFERENCE} };
function run(events: Events) { const { GET } = events; characteristic.on(GET, handler); }
`;
  const shadowedEvent = `
const events = { GET: hap.${EVENT_TYPES_READ_REFERENCE} };
const { GET } = events;
function run(GET: string) { characteristic.on(GET, handler); }
`;

  // act
  const registrations = {
    direct: registersReadHandler(direct),
    renamed: registersReadHandler(renamed),
    unrelated: registersReadHandler(unrelated),
    shadowedObject: registersReadHandler(shadowedObject),
    shadowedEvent: registersReadHandler(shadowedEvent),
  };

  // assert
  assert.deepStrictEqual(registrations, { direct: true, renamed: true, unrelated: false, shadowedObject: false, shadowedEvent: false });
});

test('resolves HAP read event enum aliases and destructuring without following shadowed names', () => {
  // arrange
  const alias = `const events = hap.${EVENT_TYPES_ENUM}; characteristic.on(events.GET, handler);`;
  const forwarded = `const events = hap.${EVENT_TYPES_ENUM}; const next = events; characteristic.on(next.GET, handler);`;
  const direct = `const { GET } = hap.${EVENT_TYPES_ENUM}; characteristic.on(GET, handler);`;
  const renamed = `const { GET: readEvent } = hap.${EVENT_TYPES_ENUM}; characteristic.on(readEvent, handler);`;
  const unrelated = 'const events = other.CharacteristicEventTypes; characteristic.on(events.GET, handler);';
  const shadowedObject = `const events = hap.${EVENT_TYPES_ENUM}; function run(events: Events) { characteristic.on(events.GET, handler); }`;
  const shadowedEvent = `const { GET } = hap.${EVENT_TYPES_ENUM}; function run(GET: string) { characteristic.on(GET, handler); }`;

  // act
  const registrations = {
    alias: registersReadHandler(alias),
    forwarded: registersReadHandler(forwarded),
    direct: registersReadHandler(direct),
    renamed: registersReadHandler(renamed),
    unrelated: registersReadHandler(unrelated),
    shadowedObject: registersReadHandler(shadowedObject),
    shadowedEvent: registersReadHandler(shadowedEvent),
  };

  // assert
  assert.deepStrictEqual(registrations, {
    alias: true,
    forwarded: true,
    direct: true,
    renamed: true,
    unrelated: false,
    shadowedObject: false,
    shadowedEvent: false,
  });
});

test('resolves fixed computed read event names without following unrelated names', () => {
  // arrange
  const concatenated = `
const event = 'g' + 'et'; characteristic.on(event, handler);
`;
  const direct = `
characteristic.on('g' + 'et', handler);
`;
  const template = 'const event = `g${"e"}t`; characteristic.on(event, handler);';
  const unrelated = `
const event = 'ch' + 'ange'; characteristic.on(event, handler);
`;
  const unresolved = 'const event = prefix + "et"; characteristic.on(event, handler);';

  // act
  const registrations = {
    concatenated: registersReadHandler(concatenated),
    direct: registersReadHandler(direct),
    template: registersReadHandler(template),
    unrelated: registersReadHandler(unrelated),
    unresolved: registersReadHandler(unresolved),
  };

  // assert
  assert.deepStrictEqual(registrations, { concatenated: true, direct: true, template: true, unrelated: false, unresolved: false });
});

test('resolves constant operands in read event names without following shadowed names', () => {
  // arrange
  const concatenated = `
const prefix = 'g'; const event = prefix + 'et'; characteristic.on(event, handler);
`;
  const forwarded = `
const prefix = 'g'; const next = prefix; characteristic.on(next + 'et', handler);
`;
  const template = 'const prefix = "g"; characteristic.on(`${prefix}et`, handler);';
  const unrelated = `
const prefix = 's'; characteristic.on(prefix + 'et', handler);
`;
  const shadowed = `
const prefix = 'g'; function run(prefix: string) { characteristic.on(prefix + 'et', handler); }
`;
  const mutable = `
let prefix = 'g'; characteristic.on(prefix + 'et', handler);
`;
  const cyclic = `
const prefix = prefix + 'g'; characteristic.on(prefix + 'et', handler);
`;

  // act
  const registrations = {
    concatenated: registersReadHandler(concatenated),
    forwarded: registersReadHandler(forwarded),
    template: registersReadHandler(template),
    unrelated: registersReadHandler(unrelated),
    shadowed: registersReadHandler(shadowed),
    mutable: registersReadHandler(mutable),
    cyclic: registersReadHandler(cyclic),
  };

  // assert
  assert.deepStrictEqual(registrations, {
    concatenated: true,
    forwarded: true,
    template: true,
    unrelated: false,
    shadowed: false,
    mutable: false,
    cyclic: false,
  });
});

test('resolves computed HAP read event keys without following unrelated keys', () => {
  // arrange
  const expression = `
characteristic.on(hap.CharacteristicEventTypes['G' + 'ET'], handler);
`;
  const alias = `
const key = 'G' + 'ET'; characteristic.on(hap.CharacteristicEventTypes[key], handler);
`;
  const enumAlias = `
const events = hap.CharacteristicEventTypes; const key = 'GET'; characteristic.on(events[key], handler);
`;
  const unrelatedKey = `
characteristic.on(hap.CharacteristicEventTypes['S' + 'ET'], handler);
`;
  const unrelatedObject = `
characteristic.on(other.CharacteristicEventTypes['G' + 'ET'], handler);
`;
  const shadowedKey = `
const key = 'GET'; function run(key: string) { characteristic.on(hap.CharacteristicEventTypes[key], handler); }
`;

  // act
  const registrations = {
    expression: registersReadHandler(expression),
    alias: registersReadHandler(alias),
    enumAlias: registersReadHandler(enumAlias),
    unrelatedKey: registersReadHandler(unrelatedKey),
    unrelatedObject: registersReadHandler(unrelatedObject),
    shadowedKey: registersReadHandler(shadowedKey),
  };

  // assert
  assert.deepStrictEqual(registrations, {
    expression: true,
    alias: true,
    enumAlias: true,
    unrelatedKey: false,
    unrelatedObject: false,
    shadowedKey: false,
  });
});

test('detects parenthesized HAP get events without following other events', () => {
  // act
  const registrations = {
    member: registersReadHandler('characteristic.on((hap.CharacteristicEventTypes.GET), handler);'),
    enumOwner: registersReadHandler('characteristic.on((hap.CharacteristicEventTypes)["GET"], handler);'),
    computedMember: registersReadHandler('characteristic.on((hap.CharacteristicEventTypes["GET"]), handler);'),
    unrelatedEvent: registersReadHandler('characteristic.on((hap.CharacteristicEventTypes.SET), handler);'),
    unrelatedObject: registersReadHandler('characteristic.on((other.CharacteristicEventTypes)["GET"], handler);'),
  };

  // assert
  assert.deepStrictEqual(registrations, { member: true, enumOwner: true, computedMember: true, unrelatedEvent: false, unrelatedObject: false });
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
    queryDynamicAccountRuntime: reachesTheNetworkTier(QUERY_DYNAMIC_ACCOUNT_RUNTIME_IMPORT),
    fragmentAccountRuntime: reachesTheNetworkTier(FRAGMENT_ACCOUNT_RUNTIME_IMPORT),
    alternateCloudClient: reachesTheNetworkTier(ALTERNATE_CLOUD_CLIENT_IMPORT),
    alternateAccountRuntime: reachesTheNetworkTier(ALTERNATE_ACCOUNT_RUNTIME_IMPORT),
    nestedCloudClient: reachesTheNetworkTier(NESTED_CLOUD_CLIENT_IMPORT, NESTED_FIXTURE_ACCESSORY_FILE),
    commentInterleavedCloud: reachesTheNetworkTier(COMMENT_INTERLEAVED_CLOUD_IMPORT),
    commentInterleavedRuntime: reachesTheNetworkTier(COMMENT_INTERLEAVED_RUNTIME_IMPORT),
    backtickDynamicCloud: reachesTheNetworkTier(BACKTICK_DYNAMIC_CLOUD_IMPORT),
    constantDynamicCloud: reachesTheNetworkTier(CONSTANT_DYNAMIC_CLOUD_IMPORT),
    computedDynamicCloud: reachesTheNetworkTier(COMPUTED_DYNAMIC_CLOUD_IMPORT),
    computedConstantDynamicCloud: reachesTheNetworkTier(COMPUTED_CONSTANT_DYNAMIC_CLOUD_IMPORT),
    fixedTemplateDynamicCloud: reachesTheNetworkTier(FIXED_TEMPLATE_DYNAMIC_CLOUD_IMPORT),
    createRequireCloud: reachesTheNetworkTier(CREATE_REQUIRE_CLOUD_IMPORT),
    immediateCreateRequireCloud: reachesTheNetworkTier(IMMEDIATE_CREATE_REQUIRE_CLOUD_IMPORT),
    constantCreateRequireCloud: reachesTheNetworkTier(CONSTANT_CREATE_REQUIRE_CLOUD_IMPORT),
    computedCreateRequireCloudSpecifier: reachesTheNetworkTier(COMPUTED_CREATE_REQUIRE_CLOUD_SPECIFIER),
    namespaceCreateRequireCloud: reachesTheNetworkTier(NAMESPACE_CREATE_REQUIRE_CLOUD_IMPORT),
    aliasedNamespaceCreateRequireCloud: reachesTheNetworkTier(ALIASED_NAMESPACE_CREATE_REQUIRE_CLOUD_IMPORT),
    destructuredCreateRequireCloud: reachesTheNetworkTier(DESTRUCTURED_CREATE_REQUIRE_CLOUD_IMPORT),
    dynamicDestructuredCreateRequireCloud: reachesTheNetworkTier(DYNAMIC_DESTRUCTURED_CREATE_REQUIRE_CLOUD_IMPORT),
    dynamicNamespaceCreateRequireCloud: reachesTheNetworkTier(DYNAMIC_NAMESPACE_CREATE_REQUIRE_CLOUD_IMPORT),
    aliasedDynamicNamespaceCreateRequireCloud: reachesTheNetworkTier(ALIASED_DYNAMIC_NAMESPACE_CREATE_REQUIRE_CLOUD_IMPORT),
    renamedDestructuredCreateRequireCloud: reachesTheNetworkTier(RENAMED_DESTRUCTURED_CREATE_REQUIRE_CLOUD_IMPORT),
    computedCreateRequireCloud: reachesTheNetworkTier(COMPUTED_CREATE_REQUIRE_CLOUD_IMPORT),
    defaultCreateRequireCloud: reachesTheNetworkTier(DEFAULT_CREATE_REQUIRE_CLOUD_IMPORT),
    aliasedCreateRequireCloud: reachesTheNetworkTier(ALIASED_CREATE_REQUIRE_CLOUD_IMPORT),
    alternateBaseCreateRequireCloud: reachesTheNetworkTier(ALTERNATE_BASE_CREATE_REQUIRE_CLOUD_IMPORT),
    parentBaseCreateRequireCloud: reachesTheNetworkTier(PARENT_BASE_CREATE_REQUIRE_CLOUD_IMPORT),
    loaderAliasCloud: reachesTheNetworkTier(LOADER_ALIAS_CLOUD_IMPORT),
  };

  // assert
  assert.deepStrictEqual(imports, {
    cloudClient: true,
    accountRuntime: true,
    queryDynamicAccountRuntime: true,
    fragmentAccountRuntime: true,
    alternateCloudClient: true,
    alternateAccountRuntime: true,
    nestedCloudClient: true,
    commentInterleavedCloud: true,
    commentInterleavedRuntime: true,
    backtickDynamicCloud: true,
    constantDynamicCloud: true,
    computedDynamicCloud: true,
    computedConstantDynamicCloud: true,
    fixedTemplateDynamicCloud: true,
    createRequireCloud: true,
    immediateCreateRequireCloud: true,
    constantCreateRequireCloud: true,
    computedCreateRequireCloudSpecifier: true,
    namespaceCreateRequireCloud: true,
    aliasedNamespaceCreateRequireCloud: true,
    destructuredCreateRequireCloud: true,
    dynamicDestructuredCreateRequireCloud: true,
    dynamicNamespaceCreateRequireCloud: true,
    aliasedDynamicNamespaceCreateRequireCloud: true,
    renamedDestructuredCreateRequireCloud: true,
    computedCreateRequireCloud: true,
    defaultCreateRequireCloud: true,
    aliasedCreateRequireCloud: true,
    alternateBaseCreateRequireCloud: true,
    parentBaseCreateRequireCloud: true,
    loaderAliasCloud: true,
  });
});

test('reports neither a comment naming the forbidden spellings nor an unrelated neighbouring import (D-09)', () => {
  // act
  const detections = {
    comment: registersReadHandler(COMMENT_NAMING_THE_SPELLINGS),
    unrelatedImport: reachesTheNetworkTier(UNRELATED_NEIGHBOURING_IMPORT),
    queryNeighbouringRuntime: reachesTheNetworkTier(QUERY_NEIGHBOURING_RUNTIME_IMPORT),
    shadowedCreateRequire: reachesTheNetworkTier(SHADOWED_CREATE_REQUIRE_CLOUD_IMPORT),
    shadowedCreatorAlias: reachesTheNetworkTier(SHADOWED_CREATOR_ALIAS_CLOUD_IMPORT),
    unrelatedLoaderCall: reachesTheNetworkTier(UNRELATED_LOADER_CALL),
    unrelatedNestedCall: reachesTheNetworkTier(UNRELATED_NESTED_CALL),
    unrelatedNamespaceAlias: reachesTheNetworkTier(UNRELATED_NAMESPACE_ALIAS),
    unrelatedDestructuredCreateRequire: reachesTheNetworkTier(UNRELATED_DESTRUCTURED_CREATE_REQUIRE_CLOUD_IMPORT),
    unrelatedDynamicDestructure: reachesTheNetworkTier(UNRELATED_DYNAMIC_DESTRUCTURE),
    unrelatedDynamicNamespace: reachesTheNetworkTier(UNRELATED_DYNAMIC_NAMESPACE),
    unrelatedConstantDynamic: reachesTheNetworkTier(UNRELATED_CONSTANT_DYNAMIC_IMPORT),
    unrelatedComputedDynamic: reachesTheNetworkTier(UNRELATED_COMPUTED_DYNAMIC_IMPORT),
    unrelatedFixedTemplateDynamic: reachesTheNetworkTier(UNRELATED_FIXED_TEMPLATE_DYNAMIC_IMPORT),
    parentBaseNeighbour: reachesTheNetworkTier(PARENT_BASE_CREATE_REQUIRE_NEIGHBOUR_IMPORT),
  };

  // assert
  assert.deepStrictEqual(detections, {
    comment: false,
    unrelatedImport: false,
    queryNeighbouringRuntime: false,
    shadowedCreateRequire: false,
    shadowedCreatorAlias: false,
    unrelatedLoaderCall: false,
    unrelatedNestedCall: false,
    unrelatedNamespaceAlias: false,
    unrelatedDestructuredCreateRequire: false,
    unrelatedDynamicDestructure: false,
    unrelatedDynamicNamespace: false,
    unrelatedConstantDynamic: false,
    unrelatedComputedDynamic: false,
    unrelatedFixedTemplateDynamic: false,
    parentBaseNeighbour: false,
  });
});

test('rejects an accessory network import with an unresolved target', () => {
  // act & assert
  assert.throws(() => reachesTheNetworkTier(UNRESOLVED_DYNAMIC_IMPORT), { message: 'cannot resolve module specifier in dynamic import' });
});

test('rejects an accessory network loader call with an unresolved target', () => {
  // act & assert
  assert.throws(() => reachesTheNetworkTier(UNRESOLVED_CREATE_REQUIRE_IMPORT), { message: 'cannot resolve module specifier in createRequire load' });
});

test('rejects an immediate accessory network loader call with an unresolved target', () => {
  // act & assert
  assert.throws(() => reachesTheNetworkTier(UNRESOLVED_IMMEDIATE_CREATE_REQUIRE_IMPORT), { message: 'cannot resolve module specifier in createRequire load' });
});

test('detects a network loader made from an awaited module expression', () => {
  // act
  const detections = {
    module: reachesTheNetworkTier(`
const load = (await import('node:module')).createRequire(import.meta.url);
load('../cloud/api.js');
`),
    unrelated: reachesTheNetworkTier(`
const load = (await import('node:fs')).createRequire(import.meta.url);
load('../cloud/api.js');
`),
  };

  // assert
  assert.deepStrictEqual(detections, { module: true, unrelated: false });
});

test('detects copied createRequire members reaching the network from static and dynamic module namespaces', () => {
  // act
  const detections = {
    staticMember: reachesTheNetworkTier(`
import * as module from 'node:module';
const makeRequire = module.createRequire;
const alias = makeRequire;
const load = alias(import.meta.url);
load('../cloud/api.js');
`),
    staticComputed: reachesTheNetworkTier(`
import * as module from 'node:module';
const makeRequire = module['createRequire'];
const load = makeRequire(import.meta.url);
load('../cloud/api.js');
`),
    dynamicMember: reachesTheNetworkTier(`
const module = await import('node:module');
const makeRequire = module.createRequire;
const load = makeRequire(import.meta.url);
load('../cloud/api.js');
`),
    dynamicComputed: reachesTheNetworkTier(`
const module = await import('node:module');
const makeRequire = module['createRequire'];
const load = makeRequire(import.meta.url);
load('../cloud/api.js');
`),
    unrelated: reachesTheNetworkTier(`
const module = { createRequire: () => (name: string) => name };
const makeRequire = module.createRequire;
const load = makeRequire(import.meta.url);
load('../cloud/api.js');
`),
  };

  // assert
  assert.deepStrictEqual(detections, { staticMember: true, staticComputed: true, dynamicMember: true, dynamicComputed: true, unrelated: false });
});

test('detects parenthesized creator members, calls and loader initializers reaching the network', () => {
  // act
  const detections = {
    member: reachesTheNetworkTier(
      `
import * as module from 'node:module';
const make = (module.createRequire);
const load = make(import.meta.url);
load('../cloud/api.js');
`,
    ),
    initializer: reachesTheNetworkTier(`
import { createRequire } from 'node:module';
const load = (createRequire(import.meta.url));
load('../cloud/api.js');
`),
    call: reachesTheNetworkTier(`
import { createRequire } from 'node:module';
(createRequire)(import.meta.url)('../cloud/api.js');
`),
    unrelatedMember: reachesTheNetworkTier(
      `
const other = { createRequire: () => (name: string) => name };
const make = (other.createRequire);
const load = make(import.meta.url);
load('../cloud/api.js');
`,
    ),
    unrelatedInitializer: reachesTheNetworkTier(
      `
const createRequire = () => (name: string) => name;
const load = (createRequire(import.meta.url));
load('../cloud/api.js');
`,
    ),
    unrelatedCall: reachesTheNetworkTier(`
const createRequire = () => (name: string) => name;
(createRequire)(import.meta.url)('../cloud/api.js');
`),
  };

  // assert
  assert.deepStrictEqual(detections, {
    member: true,
    initializer: true,
    call: true,
    unrelatedMember: false,
    unrelatedInitializer: false,
    unrelatedCall: false,
  });
});

test('detects parenthesized module namespaces without following unrelated objects', () => {
  // act
  const detections = {
    alias: reachesTheNetworkTier(`
import * as module from 'node:module';
const alias = (module);
const load = alias.createRequire(import.meta.url);
load('../cloud/api.js');
`),
    member: reachesTheNetworkTier(`
import * as module from 'node:module';
const load = (module).createRequire(import.meta.url);
load('../cloud/api.js');
`),
    destructured: reachesTheNetworkTier(`
import * as module from 'node:module';
const { createRequire } = (module);
const load = createRequire(import.meta.url);
load('../cloud/api.js');
`),
    awaited: reachesTheNetworkTier(`
const module = await (import('node:module'));
const load = module.createRequire(import.meta.url);
load('../cloud/api.js');
`),
    unrelatedObject: reachesTheNetworkTier(`
const module = { createRequire: () => (name: string) => name };
const alias = (module);
const load = alias.createRequire(import.meta.url);
load('../cloud/api.js');
`),
    unrelatedAwaited: reachesTheNetworkTier(`
const module = await (import('node:fs'));
const load = module.createRequire(import.meta.url);
load('../cloud/api.js');
`),
  };

  // assert
  assert.deepStrictEqual(detections, { alias: true, member: true, destructured: true, awaited: true, unrelatedObject: false, unrelatedAwaited: false });
});

test('detects direct createRequire calls with fixed computed keys reaching the network', () => {
  // act
  const detections = {
    staticExpression: reachesTheNetworkTier(`
import * as module from 'node:module';
const load = module['create' + 'Require'](import.meta.url);
load('../cloud/api.js');
`),
    staticAlias: reachesTheNetworkTier(`
import * as module from 'node:module';
const member = 'createRequire';
const load = module[member](import.meta.url);
load('../cloud/api.js');
`),
    dynamicExpression: reachesTheNetworkTier(`
const module = await import('node:module');
const load = module['create' + 'Require'](import.meta.url);
load('../cloud/api.js');
`),
    dynamicAlias: reachesTheNetworkTier(`
const module = await import('node:module');
const member = 'createRequire';
const load = module[member](import.meta.url);
load('../cloud/api.js');
`),
    unrelatedKey: reachesTheNetworkTier(`
import * as module from 'node:module';
const load = module['other' + 'Require'](import.meta.url);
load('../cloud/api.js');
`),
    unrelatedObject: reachesTheNetworkTier(`
const module = { createRequire: () => (name: string) => name };
const member = 'createRequire';
const load = module[member](import.meta.url);
load('../cloud/api.js');
`),
  };

  // assert
  assert.deepStrictEqual(detections, {
    staticExpression: true,
    staticAlias: true,
    dynamicExpression: true,
    dynamicAlias: true,
    unrelatedKey: false,
    unrelatedObject: false,
  });
});

test('detects fixed computed createRequire destructuring reaching the network without following unrelated keys', () => {
  // act
  const detections = {
    computed: reachesTheNetworkTier(`
import * as module from 'node:module';
const { ['create' + 'Require']: make } = module;
const load = make(import.meta.url);
load('../cloud/api.js');
`),
    unrelatedKey: reachesTheNetworkTier(`
import * as module from 'node:module';
const { ['other' + 'Require']: make } = module;
const load = make(import.meta.url);
load('../cloud/api.js');
`),
  };

  // assert
  assert.deepStrictEqual(detections, { computed: true, unrelatedKey: false });
});

test('rejects an accessory network loader call with an unresolved base', () => {
  // act & assert
  assert.throws(() => reachesTheNetworkTier(UNRESOLVED_BASE_CREATE_REQUIRE_IMPORT), { message: 'cannot resolve base in createRequire load' });
});
