// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview The static gate on the one import that reaches the pinned HAP package.
 *
 * `AGENTS.md` and `src/accessories/customCharacteristics.ts` forbid this plugin from
 * importing HAP-NodeJS directly. Every HomeKit type comes from the `api.hap` namespace
 * Homebridge injects, so the plugin runs against the HAP the host bridge carries rather
 * than against a copy it pinned for itself. That is a **runtime** rule and nothing here
 * relaxes it: no module under `src/` may reach the package, and this gate does not give
 * one permission to.
 *
 * `D-17` grants one exception, and it is a test-scope exception. The Cucumber scenarios
 * run on a hand-built HAP stand-in, so the write semantics the plugin relies on are ones
 * the plugin itself authored; a green suite over that stand-in proves the stand-in agrees
 * with itself and nothing more. `test/accessories/hapWriteFidelity.test.ts` imports the
 * real pinned package and runs the same write script against both, which is the only
 * thing that holds the stand-in honest. The exception is that check, not a licence. A
 * second importer turns "reach for `api.hap`" from a rule into a convention, and a
 * convention is what the next `src/` module breaks.
 *
 * No runtime layer can see this. A module that imports the package type-checks, lints,
 * and passes every behavioural case, because the pinned package resolves and works -- it
 * is simply not the HAP the bridge is running, so a version difference between them shows
 * up in a user's home and nowhere in this repository. Reading the source text is the only
 * layer that can name that failure (SAFE-08, D-17).
 *
 * The gate enumerates three directories rather than a fixed list, so a file added later
 * is covered without anyone remembering to extend this one, and it asserts a floor on
 * what the enumeration found, because a gate that silently reads nothing reports the same
 * green as a gate that read everything.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  createPrinter,
  createSourceFile,
  forEachChild,
  isBlock,
  isCallExpression,
  isElementAccessExpression,
  isFunctionDeclaration,
  isFunctionLike,
  isIdentifier,
  isNoSubstitutionTemplateLiteral,
  isObjectBindingPattern,
  isPropertyAccessExpression,
  isStringLiteral,
  isVariableDeclaration,
  ScriptTarget,
  type Node,
  type SourceFile,
} from 'typescript';

import { importSpecifiers, typeScriptFilesUnder } from './staticGateSources.js';

/**
 * The package no module may reach except the one named below.
 *
 * Declared once and consumed by the detector, by every planted fixture, and by the
 * prose-mention control, so the rule and the controls that prove it cannot drift apart.
 */
const HAP_PACKAGE_SPECIFIER = '@homebridge/hap-nodejs';

/** The one file `D-17` permits to import it, as a repository-relative path. */
const PERMITTED_IMPORTER = 'test/accessories/hapWriteFidelity.test.ts';

/** The stand-in whose own file overview names the package in prose without importing it. */
const PROSE_MENTION_WITHOUT_IMPORT = 'features/lib/hap.ts';

// The compiled case runs from `dist-test/test/accessories`, which puts the repository
// root three levels up. The floor below is what turns a wrong count of levels into a
// named failure rather than an empty read reporting success.
const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/** Every directory holding TypeScript this repository authors. */
const SOURCE_DIRECTORIES: readonly string[] = ['src', 'test', 'features'];

// The three directories hold 134 TypeScript files. A gate that enumerated
// fewer than this read the wrong tree, and the single-importer assertion built on that
// read would pass without examining a single file.
const SOURCE_FILE_FLOOR = 134;

/** Accessory modules checked for direct HAP error, setter and UUID calls. */
const ACCESSORY_MODULES: readonly string[] = ['basementGuardian.ts', 'customCharacteristics.ts', 'customServices.ts', 'serviceCatalogue.ts'];

/** The three modules that must never construct an errored characteristic. */
const MODULES_ERRORING_NO_CHARACTERISTIC: readonly string[] = ['basementGuardian.ts', 'customCharacteristics.ts', 'customServices.ts'];

const ERRORED_CHARACTERISTIC = 'HapStatusError';
const SET_EVENT_LISTENER_METHODS = new Set(['on', 'addListener', 'once', 'prependListener', 'prependOnceListener']);

function importsHapPackage(source: string): boolean {
  return importSpecifiers(source).some((specifier) => specifier === HAP_PACKAGE_SPECIFIER || specifier.startsWith(`${HAP_PACKAGE_SPECIFIER}/`));
}

// The printer control checks that comments are removed without changing string literals.
function codeOf(source: string): string {
  return createPrinter({ removeComments: true }).printFile(createSourceFile('accessory.ts', source, ScriptTarget.Latest, true));
}

function sourceFileOf(source: string): SourceFile {
  return createSourceFile('accessory.ts', source, ScriptTarget.Latest, true);
}

function accessorySourceOf(module: string): SourceFile {
  return sourceFileOf(readFileSync(join(REPOSITORY_ROOT, 'src', 'accessories', module), 'utf8'));
}

function countIdentifiers(node: Node, name: string): number {
  let count = isIdentifier(node) && node.text === name ? 1 : 0;
  forEachChild(node, (child) => {
    count += countIdentifiers(child, name);
  });
  return count;
}

function staticMemberName(node: Node): string | undefined {
  if (isPropertyAccessExpression(node)) {
    return node.name.text;
  }

  if (isElementAccessExpression(node) && (isStringLiteral(node.argumentExpression) || isNoSubstitutionTemplateLiteral(node.argumentExpression))) {
    return node.argumentExpression.text;
  }

  return undefined;
}

function isSetEvent(node: Node, aliasOf: (name: string) => string | undefined): boolean {
  if (isIdentifier(node) && aliasOf(node.text) === 'setEvent') {
    return true;
  }

  if ((isStringLiteral(node) || isNoSubstitutionTemplateLiteral(node)) && node.text === 'set') {
    return true;
  }

  if (staticMemberName(node) !== 'SET' || (!isPropertyAccessExpression(node) && !isElementAccessExpression(node))) {
    return false;
  }

  const owner = node.expression;
  if (isIdentifier(owner)) {
    return owner.text === 'CharacteristicEventTypes';
  }

  if (staticMemberName(owner) !== 'CharacteristicEventTypes' || (!isPropertyAccessExpression(owner) && !isElementAccessExpression(owner))) {
    return false;
  }

  return (isIdentifier(owner.expression) && owner.expression.text === 'hap') || staticMemberName(owner.expression) === 'hap';
}

function hapUses(file: SourceFile): { onSet: boolean; setEvent: boolean; memberCall: boolean; destructuredCall: boolean } {
  const uses = { onSet: false, setEvent: false, memberCall: false, destructuredCall: false };
  const scopes: Map<string, string | undefined>[] = [new Map<string, string | undefined>()];

  function aliasOf(name: string): string | undefined {
    for (let index = scopes.length - 1; index >= 0; index--) {
      if (scopes[index]?.has(name)) {
        return scopes[index]?.get(name);
      }
    }

    return undefined;
  }

  function isUuidApi(node: Node): boolean {
    if (isIdentifier(node)) {
      return aliasOf(node.text) === 'uuid';
    }

    if (staticMemberName(node) !== 'uuid' || (!isPropertyAccessExpression(node) && !isElementAccessExpression(node))) {
      return false;
    }

    return (isIdentifier(node.expression) && node.expression.text === 'hap') || staticMemberName(node.expression) === 'hap';
  }

  function capabilityOf(node: Node | undefined): string | undefined {
    if (!node) {
      return undefined;
    }

    if (isUuidApi(node)) {
      return 'uuid';
    }

    if (isSetEvent(node, aliasOf)) {
      return 'setEvent';
    }

    if (isIdentifier(node) && aliasOf(node.text) === 'generate') {
      return 'generate';
    }

    if ((isPropertyAccessExpression(node) || isElementAccessExpression(node)) && staticMemberName(node) === 'generate' && isUuidApi(node.expression)) {
      return 'generate';
    }

    return undefined;
  }

  function recordAlias(node: Node): void {
    if (!isVariableDeclaration(node)) {
      return;
    }

    if (isIdentifier(node.name)) {
      scopes[scopes.length - 1]?.set(node.name.text, capabilityOf(node.initializer));
      return;
    }

    if (isObjectBindingPattern(node.name) && node.initializer && isUuidApi(node.initializer)) {
      for (const element of node.name.elements) {
        const sourceName = element.propertyName ?? element.name;
        if ((isIdentifier(sourceName) || isStringLiteral(sourceName)) && sourceName.text === 'generate' && isIdentifier(element.name)) {
          scopes[scopes.length - 1]?.set(element.name.text, 'generate');
        }
      }
    }
  }

  function recordUse(node: Node): void {
    if (staticMemberName(node) === 'onSet') {
      uses.onSet = true;
    }

    if (isCallExpression(node) && isIdentifier(node.expression) && aliasOf(node.expression.text) === 'generate') {
      uses.destructuredCall = true;
    }

    if (isCallExpression(node) && (isPropertyAccessExpression(node.expression) || isElementAccessExpression(node.expression))) {
      const member = node.expression;
      const firstArgument = node.arguments[0];
      const method = staticMemberName(member);
      if (method && SET_EVENT_LISTENER_METHODS.has(method) && firstArgument && isSetEvent(firstArgument, aliasOf)) {
        uses.setEvent = true;
      }

      if (staticMemberName(member) === 'generate' && isUuidApi(member.expression)) {
        uses.memberCall = true;
      }
    }
  }

  function visit(node: Node): void {
    const ownScope = isBlock(node) || isFunctionLike(node);
    if (ownScope) {
      const scope = new Map<string, string | undefined>();
      if (isFunctionLike(node)) {
        for (const parameter of node.parameters) {
          if (isIdentifier(parameter.name)) {
            scope.set(parameter.name.text, undefined);
          }
        }
      }

      scopes.push(scope);
    }

    recordAlias(node);
    recordUse(node);
    forEachChild(node, visit);
    if (ownScope) {
      scopes.pop();
    }
  }

  visit(file);
  return uses;
}

// One fixture per spelling the detector has to catch, each written out rather than
// generated from a list, so a change to one spelling cannot silently satisfy its own
// control. Only the package name is interpolated, from the single constant the detector
// itself reads -- and it has to be, because a fixture holding the importing spelling
// literally would make this gate report itself and the assertion below could never name
// exactly one file.
const NAMED_IMPORT = `
import { Service } from '${HAP_PACKAGE_SPECIFIER}';
`;
const DOUBLE_QUOTED_NAMED_IMPORT = `
import { Service } from "${HAP_PACKAGE_SPECIFIER}";
`;
const TYPE_ONLY_IMPORT = `
import type { CharacteristicProps } from '${HAP_PACKAGE_SPECIFIER}';
`;
const SIDE_EFFECT_IMPORT = `
import '${HAP_PACKAGE_SPECIFIER}';
`;
const DOUBLE_QUOTED_SIDE_EFFECT_IMPORT = `
import "${HAP_PACKAGE_SPECIFIER}";
`;
const DYNAMIC_IMPORT = `
const hap = await import('${HAP_PACKAGE_SPECIFIER}');
`;
const CONSTANT_DYNAMIC_IMPORT = `
const target = '${HAP_PACKAGE_SPECIFIER}';
const hap = await import(target);
`;
const UNRELATED_CONSTANT_DYNAMIC_IMPORT = `
const target = 'homebridge';
const homebridge = await import(target);
`;
const DOUBLE_QUOTED_DYNAMIC_IMPORT = `
const hap = await import("${HAP_PACKAGE_SPECIFIER}");
`;
const BACKTICK_DYNAMIC_IMPORT = 'const hap = await import(`' + HAP_PACKAGE_SPECIFIER + '`);';
const CREATE_REQUIRE_IMPORT = `
import { createRequire as makeRequire } from 'node:module';
const loadModule = makeRequire(import.meta.url);
const hap = loadModule('${HAP_PACKAGE_SPECIFIER}');
`;
const CONSTANT_CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
const target = '${HAP_PACKAGE_SPECIFIER}';
const hap = loadModule(target);
`;
const NAMESPACE_CREATE_REQUIRE_IMPORT = `
import * as module from 'node:module';
const loadModule = module.createRequire(import.meta.url);
const hap = loadModule('${HAP_PACKAGE_SPECIFIER}');
`;
const COMPUTED_CREATE_REQUIRE_IMPORT = `
import * as module from 'node:module';
const loadModule = module['createRequire'](import.meta.url);
const hap = loadModule('${HAP_PACKAGE_SPECIFIER}');
`;
const DEFAULT_CREATE_REQUIRE_IMPORT = `
import module from 'node:module';
const loadModule = module.createRequire(import.meta.url);
const hap = loadModule('${HAP_PACKAGE_SPECIFIER}');
`;
const ALIASED_CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
const makeRequire = createRequire;
const loadModule = makeRequire(import.meta.url);
const hap = loadModule('${HAP_PACKAGE_SPECIFIER}');
`;
const ALTERNATE_BASE_CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(new URL('./probe.js', import.meta.url));
const hap = loadModule('${HAP_PACKAGE_SPECIFIER}');
`;
const LOADER_ALIAS_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
const load = loadModule;
const hap = load('${HAP_PACKAGE_SPECIFIER}');
`;
const SHADOWED_CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
function run(loadModule: (name: string) => void) {
  loadModule('${HAP_PACKAGE_SPECIFIER}');
}
`;
const SHADOWED_CREATOR_ALIAS_IMPORT = `
import { createRequire } from 'node:module';
const makeRequire = createRequire;
function run(makeRequire: (url: string) => (name: string) => void) {
  const loadModule = makeRequire(import.meta.url);
  loadModule('${HAP_PACKAGE_SPECIFIER}');
}
`;
const UNRELATED_LOADER_CALL = `
function run(load: (name: string) => void) {
  load('${HAP_PACKAGE_SPECIFIER}');
}
`;
const COMMENT_INTERLEAVED_IMPORT = `
import { Characteristic } from /* a valid comment */ '${HAP_PACKAGE_SPECIFIER}';
`;
const HAP_SUBPATH_IMPORT = `
import { Characteristic } from '${HAP_PACKAGE_SPECIFIER}/dist/lib/Characteristic.js';
`;
const RE_EXPORTED_IMPORT = `
export { Characteristic } from '${HAP_PACKAGE_SPECIFIER}';
`;

// One fixture per way the detector has to stay quiet: naming the package in prose is what
// this very file and three others do, and an unrelated bare import is what most modules in
// the accessories tier legitimately carry.
const COMMENT_NAMING_THE_PACKAGE = `
// This module imports ${HAP_PACKAGE_SPECIFIER} nowhere; every HomeKit type comes from api.hap.
`;
const UNRELATED_IMPORT = `
import type { API } from 'homebridge';
`;

test('exactly one file under src, test and features imports the pinned HAP package (D-17, SAFE-08)', () => {
  // arrange
  const searched = SOURCE_DIRECTORIES.join(', ');
  const files = SOURCE_DIRECTORIES.flatMap((directory) => typeScriptFilesUnder(directory));

  // act
  const importing = files.filter((file) => importsHapPackage(readFileSync(join(REPOSITORY_ROOT, file), 'utf8'))).sort();

  // assert
  assert.ok(
    files.length >= SOURCE_FILE_FLOOR,
    `the gate enumerated ${String(files.length)} TypeScript files under ${searched}, fewer than the ${String(SOURCE_FILE_FLOOR)} this repository holds`,
  );
  assert.deepStrictEqual(importing, [PERMITTED_IMPORTER]);
});

test('reports a planted HAP import in every spelling and quote style it is meant to catch (D-17)', () => {
  // act
  const imports = {
    named: importsHapPackage(NAMED_IMPORT),
    doubleQuotedNamed: importsHapPackage(DOUBLE_QUOTED_NAMED_IMPORT),
    typeOnly: importsHapPackage(TYPE_ONLY_IMPORT),
    sideEffect: importsHapPackage(SIDE_EFFECT_IMPORT),
    doubleQuotedSideEffect: importsHapPackage(DOUBLE_QUOTED_SIDE_EFFECT_IMPORT),
    dynamic: importsHapPackage(DYNAMIC_IMPORT),
    constantDynamic: importsHapPackage(CONSTANT_DYNAMIC_IMPORT),
    doubleQuotedDynamic: importsHapPackage(DOUBLE_QUOTED_DYNAMIC_IMPORT),
    backtickDynamic: importsHapPackage(BACKTICK_DYNAMIC_IMPORT),
    createRequire: importsHapPackage(CREATE_REQUIRE_IMPORT),
    constantCreateRequire: importsHapPackage(CONSTANT_CREATE_REQUIRE_IMPORT),
    namespaceCreateRequire: importsHapPackage(NAMESPACE_CREATE_REQUIRE_IMPORT),
    computedCreateRequire: importsHapPackage(COMPUTED_CREATE_REQUIRE_IMPORT),
    defaultCreateRequire: importsHapPackage(DEFAULT_CREATE_REQUIRE_IMPORT),
    aliasedCreateRequire: importsHapPackage(ALIASED_CREATE_REQUIRE_IMPORT),
    alternateBaseCreateRequire: importsHapPackage(ALTERNATE_BASE_CREATE_REQUIRE_IMPORT),
    loaderAlias: importsHapPackage(LOADER_ALIAS_IMPORT),
    commentInterleaved: importsHapPackage(COMMENT_INTERLEAVED_IMPORT),
    subpath: importsHapPackage(HAP_SUBPATH_IMPORT),
    reExported: importsHapPackage(RE_EXPORTED_IMPORT),
  };

  // assert
  assert.deepStrictEqual(imports, {
    named: true,
    doubleQuotedNamed: true,
    typeOnly: true,
    sideEffect: true,
    doubleQuotedSideEffect: true,
    dynamic: true,
    constantDynamic: true,
    doubleQuotedDynamic: true,
    backtickDynamic: true,
    createRequire: true,
    constantCreateRequire: true,
    namespaceCreateRequire: true,
    computedCreateRequire: true,
    defaultCreateRequire: true,
    aliasedCreateRequire: true,
    alternateBaseCreateRequire: true,
    loaderAlias: true,
    commentInterleaved: true,
    subpath: true,
    reExported: true,
  });
});

test('reports neither a comment naming the package nor an unrelated import (D-17)', () => {
  // act
  const imports = {
    comment: importsHapPackage(COMMENT_NAMING_THE_PACKAGE),
    unrelatedImport: importsHapPackage(UNRELATED_IMPORT),
    shadowedCreateRequire: importsHapPackage(SHADOWED_CREATE_REQUIRE_IMPORT),
    shadowedCreatorAlias: importsHapPackage(SHADOWED_CREATOR_ALIAS_IMPORT),
    unrelatedLoaderCall: importsHapPackage(UNRELATED_LOADER_CALL),
    unrelatedConstantDynamic: importsHapPackage(UNRELATED_CONSTANT_DYNAMIC_IMPORT),
  };

  // assert
  assert.deepStrictEqual(imports, {
    comment: false,
    unrelatedImport: false,
    shadowedCreateRequire: false,
    shadowedCreatorAlias: false,
    unrelatedLoaderCall: false,
    unrelatedConstantDynamic: false,
  });
});

test('does not report the hand-built stand-in, whose own file overview names the package (D-17)', () => {
  // arrange
  const standIn = readFileSync(join(REPOSITORY_ROOT, PROSE_MENTION_WITHOUT_IMPORT), 'utf8');

  // act
  const standInImport = { namesThePackage: standIn.includes(HAP_PACKAGE_SPECIFIER), importsThePackage: importsHapPackage(standIn) };

  // assert
  assert.deepStrictEqual(standInImport, { namesThePackage: true, importsThePackage: false });
});

test('ignores a trailing HAP status comment while preserving a string literal', () => {
  // arrange
  const source = 'const status = "HapStatusError"; // HapStatusError\n';

  // act
  const code = codeOf(source);

  // assert
  assert.strictEqual(code, 'const status = "HapStatusError";\n');
});

test('does not count HAP names inside diagnostic strings', () => {
  // arrange
  const source = 'const diagnostic = "HapStatusError onSet uuid.generate( .on(\'set\', callback)";';

  // act
  const file = sourceFileOf(source);
  const uses = { erroredCharacteristic: countIdentifiers(file, ERRORED_CHARACTERISTIC), ...hapUses(file) };

  // assert
  assert.deepStrictEqual(uses, { erroredCharacteristic: 0, onSet: false, setEvent: false, memberCall: false, destructuredCall: false });
});

test('counts HAP identifiers, setter registrations and UUID uses in executable code', () => {
  // arrange
  const source = `
new hap.HapStatusError(status);
characteristic.onSet(handler);
characteristic.on('set', handler);
hap.uuid.generate(deviceId);
const { generate } = hap.uuid;
generate(deviceId);
`;

  // act
  const file = sourceFileOf(source);
  const uses = { erroredCharacteristic: countIdentifiers(file, ERRORED_CHARACTERISTIC), ...hapUses(file) };

  // assert
  assert.deepStrictEqual(uses, { erroredCharacteristic: 1, onSet: true, setEvent: true, memberCall: true, destructuredCall: true });
});

test('counts computed setters, enum set events and aliased UUID generation', () => {
  // arrange
  const computedOnSet = sourceFileOf('characteristic["onSet"](handler);');
  const enumSetEvent = sourceFileOf('characteristic.on(CharacteristicEventTypes.SET, handler);');
  const computedUuidCall = sourceFileOf('hap.uuid["generate"](deviceId);');
  const aliasedUuidCall = sourceFileOf('const { generate: makeUuid } = hap.uuid; makeUuid(deviceId);');

  // act
  const uses = {
    computedOnSet: hapUses(computedOnSet).onSet,
    enumSetEvent: hapUses(enumSetEvent).setEvent,
    computedUuidCall: hapUses(computedUuidCall).memberCall,
    aliasedUuidCall: hapUses(aliasedUuidCall).destructuredCall,
  };

  // assert
  assert.deepStrictEqual(uses, { computedOnSet: true, enumSetEvent: true, computedUuidCall: true, aliasedUuidCall: true });
});

test('counts local aliases of HAP UUID generation and set events', () => {
  // arrange
  const uuidAlias = sourceFileOf('const uuidApi = hap.uuid; uuidApi.generate(deviceId);');
  const setEventAlias = sourceFileOf('const writeEvent = hap.CharacteristicEventTypes.SET; characteristic.on(writeEvent, handler);');

  // act
  const uses = { uuidAlias: hapUses(uuidAlias).memberCall, setEventAlias: hapUses(setEventAlias).setEvent };

  // assert
  assert.deepStrictEqual(uses, { uuidAlias: true, setEventAlias: true });
});

test('counts calls through HAP UUID generate function bindings', () => {
  // arrange
  const memberBinding = sourceFileOf('const generate = hap.uuid.generate; generate(deviceId);');
  const destructuredAlias = sourceFileOf('const uuidApi = hap.uuid; const { generate } = uuidApi; generate(deviceId);');

  // act
  const uses = {
    memberBinding: hapUses(memberBinding).destructuredCall,
    destructuredAlias: hapUses(destructuredAlias).destructuredCall,
  };

  // assert
  assert.deepStrictEqual(uses, { memberBinding: true, destructuredAlias: true });
});

test('ignores unused and unrelated UUID generate bindings', () => {
  // arrange
  const unused = sourceFileOf('const { generate } = hap.uuid;');
  const unrelated = sourceFileOf('const { generate } = other.uuid; generate(deviceId);');
  const unrelatedMember = sourceFileOf('other.uuid.generate(deviceId);');

  // act
  const uses = {
    unused: hapUses(unused).destructuredCall,
    unrelated: hapUses(unrelated).destructuredCall,
    unrelatedMember: hapUses(unrelatedMember).memberCall,
  };

  // assert
  assert.deepStrictEqual(uses, { unused: false, unrelated: false, unrelatedMember: false });
});

test('counts EventEmitter methods that register set listeners', () => {
  // arrange
  const registrations = {
    addListener: sourceFileOf('characteristic.addListener("set", handler);'),
    once: sourceFileOf('characteristic.once("set", handler);'),
    prependListener: sourceFileOf('characteristic.prependListener("set", handler);'),
    prependOnceListener: sourceFileOf('characteristic.prependOnceListener("set", handler);'),
  };

  // act
  const uses = {
    addListener: hapUses(registrations.addListener).setEvent,
    once: hapUses(registrations.once).setEvent,
    prependListener: hapUses(registrations.prependListener).setEvent,
    prependOnceListener: hapUses(registrations.prependOnceListener).setEvent,
  };

  // assert
  assert.deepStrictEqual(uses, { addListener: true, once: true, prependListener: true, prependOnceListener: true });
});

test('ignores other EventEmitter events in the direct-set gate', () => {
  // arrange
  const source = `
characteristic.addListener('get', handler);
characteristic.once('get', handler);
characteristic.prependListener('get', handler);
characteristic.prependOnceListener('get', handler);
`;

  // act
  const uses = hapUses(sourceFileOf(source));

  // assert
  assert.strictEqual(uses.setEvent, false);
});

test('ignores aliases of unrelated UUID and event APIs', () => {
  // arrange
  const source =
    'const uuidApi = other.uuid; const writeEvent = other.CharacteristicEventTypes.SET; uuidApi.generate(deviceId); characteristic.on(writeEvent, handler);';

  // act
  const uses = hapUses(sourceFileOf(source));

  // assert
  assert.deepStrictEqual(uses, { onSet: false, setEvent: false, memberCall: false, destructuredCall: false });
});

test('ignores other HAP methods and uncalled UUID members', () => {
  // arrange
  const source = `
characteristic['onGet'](handler);
characteristic.on(CharacteristicEventTypes.GET, handler);
hap.uuid['generate'];
const { generator: makeUuid } = hap.uuid;
makeUuid(deviceId);
`;

  // act
  const uses = hapUses(sourceFileOf(source));

  // assert
  assert.deepStrictEqual(uses, { onSet: false, setEvent: false, memberCall: false, destructuredCall: false });
});

for (const module of MODULES_ERRORING_NO_CHARACTERISTIC) {
  test(`${module} signals no untrusted scope through an errored characteristic`, () => {
    // act
    const file = accessorySourceOf(module);

    // assert
    assert.strictEqual(countIdentifiers(file, ERRORED_CHARACTERISTIC), 0);
  });
}

// D-10 permits one persistent failure. Pin both the file count and the call's function location.
test('serviceCatalogue.ts names an errored characteristic once, inside publishPersistentFailure', () => {
  // act
  const file = accessorySourceOf('serviceCatalogue.ts');
  const persistentFailure = file.statements.find((statement) => isFunctionDeclaration(statement) && statement.name?.text === 'publishPersistentFailure');

  // assert
  assert.deepStrictEqual(
    {
      file: countIdentifiers(file, ERRORED_CHARACTERISTIC),
      insidePublishPersistentFailure: persistentFailure ? countIdentifiers(persistentFailure, ERRORED_CHARACTERISTIC) : 0,
    },
    { file: 1, insidePublishPersistentFailure: 1 },
  );
});

for (const module of ACCESSORY_MODULES) {
  // Switch `On` writes use the control binder. No accessory module registers a direct set handler.
  test(`${module} has no direct onSet or set-event registration`, () => {
    // act
    const file = accessorySourceOf(module);
    const uses = hapUses(file);

    // assert
    assert.deepStrictEqual({ onSet: uses.onSet, setEvent: uses.setEvent }, { onSet: false, setEvent: false });
  });

  test(`${module} contains no direct HAP UUID generation call`, () => {
    // act
    const file = accessorySourceOf(module);
    const uses = hapUses(file);

    // assert
    assert.deepStrictEqual({ memberCall: uses.memberCall, destructuredCall: uses.destructuredCall }, { memberCall: false, destructuredCall: false });
  });
}
