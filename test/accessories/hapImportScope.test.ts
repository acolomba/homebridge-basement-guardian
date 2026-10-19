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
  isBinaryExpression,
  isBlock,
  isCallExpression,
  isElementAccessExpression,
  isFunctionDeclaration,
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

/** Accessory modules checked for direct HAP calls. */
const ACCESSORY_MODULES = typeScriptFilesUnder('src/accessories').map((file) => file.slice('src/accessories/'.length));

/** The control binder owns the approved setter registrations. */
const SET_HANDLER_MODULES = ACCESSORY_MODULES.filter((module) => module !== 'controls.ts');

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

function fixedEventText(node: Node, fixedAlias: (name: string) => string | undefined): string | undefined {
  if (isParenthesizedExpression(node)) {
    return fixedEventText(node.expression, fixedAlias);
  }

  if (isIdentifier(node)) {
    return fixedAlias(node.text);
  }

  if (isBinaryExpression(node) && node.operatorToken.kind === SyntaxKind.PlusToken) {
    const left = fixedEventText(node.left, fixedAlias);
    const right = fixedEventText(node.right, fixedAlias);
    return left === undefined || right === undefined ? undefined : left + right;
  }

  if (isTemplateExpression(node)) {
    let text = node.head.text;
    for (const span of node.templateSpans) {
      const part = fixedEventText(span.expression, fixedAlias);
      if (part === undefined) {
        return undefined;
      }

      text += part + span.literal.text;
    }

    return text;
  }

  return isStringLiteral(node) || isNoSubstitutionTemplateLiteral(node) ? node.text : undefined;
}

function isSetEvent(
  node: Node,
  aliasOf: (name: string) => string | undefined,
  fixedAlias: (name: string) => string | undefined,
  isHapNamespace: (node: Node) => boolean,
): boolean {
  if (isIdentifier(node) && aliasOf(node.text) === 'setEvent') {
    return true;
  }

  if (fixedEventText(node, fixedAlias) === 'set') {
    return true;
  }

  const eventMember = isElementAccessExpression(node) ? fixedEventText(node.argumentExpression, fixedAlias) : staticMemberName(node);
  if (eventMember !== 'SET' || (!isPropertyAccessExpression(node) && !isElementAccessExpression(node))) {
    return false;
  }

  const owner = node.expression;
  if (isIdentifier(owner)) {
    return owner.text === 'CharacteristicEventTypes' || aliasOf(owner.text) === 'setEventObject';
  }

  if (staticMemberName(owner) !== 'CharacteristicEventTypes' || (!isPropertyAccessExpression(owner) && !isElementAccessExpression(owner))) {
    return false;
  }

  return isHapNamespace(owner.expression);
}

function hapUses(file: SourceFile): { onSet: boolean; setEvent: boolean; memberCall: boolean; destructuredCall: boolean } {
  const uses = { onSet: false, setEvent: false, memberCall: false, destructuredCall: false };
  const scopes: Map<string, string | undefined>[] = [new Map<string, string | undefined>()];
  const fixedScopes: Map<string, string | undefined>[] = [new Map<string, string | undefined>()];

  function aliasOf(name: string): string | undefined {
    for (let index = scopes.length - 1; index >= 0; index--) {
      if (scopes[index]?.has(name)) {
        return scopes[index]?.get(name);
      }
    }

    return undefined;
  }

  function fixedAlias(name: string): string | undefined {
    for (let index = fixedScopes.length - 1; index >= 0; index--) {
      if (fixedScopes[index]?.has(name)) {
        return fixedScopes[index]?.get(name);
      }
    }

    return undefined;
  }

  function hasBinding(name: string): boolean {
    return scopes.some((scope) => scope.has(name));
  }

  function isHapNamespace(node: Node): boolean {
    if (isIdentifier(node)) {
      return aliasOf(node.text) === 'hapNamespace' || (node.text === 'hap' && !hasBinding(node.text));
    }

    return staticMemberName(node) === 'hap';
  }

  function isUuidApi(node: Node): boolean {
    if (isIdentifier(node)) {
      return aliasOf(node.text) === 'uuid';
    }

    if (staticMemberName(node) !== 'uuid' || (!isPropertyAccessExpression(node) && !isElementAccessExpression(node))) {
      return false;
    }

    return isHapNamespace(node.expression);
  }

  function isSetEventObject(node: Node): boolean {
    if (isIdentifier(node) && aliasOf(node.text) === 'setEventObject') {
      return true;
    }

    if (
      (isPropertyAccessExpression(node) || isElementAccessExpression(node)) &&
      staticMemberName(node) === 'CharacteristicEventTypes' &&
      isHapNamespace(node.expression)
    ) {
      return true;
    }

    return (
      isObjectLiteralExpression(node) &&
      node.properties.some(
        (property) =>
          isPropertyAssignment(property) &&
          (isIdentifier(property.name) || isStringLiteral(property.name)) &&
          property.name.text === 'SET' &&
          isSetEvent(property.initializer, aliasOf, fixedAlias, isHapNamespace),
      )
    );
  }

  function capabilityOf(node: Node | undefined): string | undefined {
    if (!node) {
      return undefined;
    }

    if (isUuidApi(node)) {
      return 'uuid';
    }

    if (isHapNamespace(node)) {
      return 'hapNamespace';
    }

    if (isSetEvent(node, aliasOf, fixedAlias, isHapNamespace)) {
      return 'setEvent';
    }

    if (isSetEventObject(node)) {
      return 'setEventObject';
    }

    if (isIdentifier(node) && aliasOf(node.text) === 'generate') {
      return 'generate';
    }

    if ((isPropertyAccessExpression(node) || isElementAccessExpression(node)) && staticMemberName(node) === 'generate' && isUuidApi(node.expression)) {
      return 'generate';
    }

    return undefined;
  }

  function recordDestructuredAlias(binding: ObjectBindingPattern, initializer: Node): void {
    let capability: string | undefined;
    let sourceProperty: string | undefined;
    if (isUuidApi(initializer)) {
      capability = 'generate';
      sourceProperty = 'generate';
    } else if (isHapNamespace(initializer)) {
      capability = 'uuid';
      sourceProperty = 'uuid';
    } else if (isPropertyAccessExpression(initializer) && initializer.name.text === 'api' && initializer.expression.kind === SyntaxKind.ThisKeyword) {
      capability = 'hapNamespace';
      sourceProperty = 'hap';
    } else if (capabilityOf(initializer) === 'setEventObject') {
      capability = 'setEvent';
      sourceProperty = 'SET';
    }

    for (const element of binding.elements) {
      const sourceName = element.propertyName ?? element.name;
      if (isIdentifier(element.name)) {
        const matched = sourceProperty && (isIdentifier(sourceName) || isStringLiteral(sourceName)) && sourceName.text === sourceProperty;
        scopes[scopes.length - 1]?.set(element.name.text, matched ? capability : undefined);
      }
    }
  }

  function recordAlias(node: Node): void {
    if (!isVariableDeclaration(node)) {
      return;
    }

    if (isIdentifier(node.name)) {
      const fixed = (node.parent.flags & NodeFlags.Const) !== 0;
      fixedScopes[fixedScopes.length - 1]?.set(node.name.text, undefined);
      fixedScopes[fixedScopes.length - 1]?.set(node.name.text, fixed && node.initializer ? fixedEventText(node.initializer, fixedAlias) : undefined);
      scopes[scopes.length - 1]?.set(node.name.text, capabilityOf(node.initializer));
    } else if (isObjectBindingPattern(node.name) && node.initializer) {
      recordDestructuredAlias(node.name, node.initializer);
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
      if (method && SET_EVENT_LISTENER_METHODS.has(method) && firstArgument && isSetEvent(firstArgument, aliasOf, fixedAlias, isHapNamespace)) {
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
      const fixedScope = new Map<string, string | undefined>();
      if (isFunctionLike(node)) {
        for (const parameter of node.parameters) {
          if (isIdentifier(parameter.name)) {
            scope.set(parameter.name.text, undefined);
            fixedScope.set(parameter.name.text, undefined);
          }
        }
      }

      scopes.push(scope);
      fixedScopes.push(fixedScope);
    }

    recordAlias(node);
    recordUse(node);
    forEachChild(node, visit);
    if (ownScope) {
      scopes.pop();
      fixedScopes.pop();
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
const COMPUTED_DYNAMIC_IMPORT = `
const hap = await import('@homebridge/' + 'hap-nodejs');
`;
const COMPUTED_CONSTANT_DYNAMIC_IMPORT = `
const target = '@homebridge/' + 'hap-nodejs';
const hap = await import(target);
`;
const FIXED_TEMPLATE_DYNAMIC_IMPORT = 'const hap = await import(`@homebridge/${"hap-nodejs"}`);';
const UNRESOLVED_DYNAMIC_IMPORT = 'const hap = await import(process.env.MODULE);';
const UNRESOLVED_CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
const hap = loadModule(process.env.MODULE);
`;
const UNRELATED_CONSTANT_DYNAMIC_IMPORT = `
const target = 'homebridge';
const homebridge = await import(target);
`;
const UNRELATED_COMPUTED_DYNAMIC_IMPORT = `
const homebridge = await import('home' + 'bridge');
`;
const UNRELATED_FIXED_TEMPLATE_DYNAMIC_IMPORT = 'const homebridge = await import(`home${"bridge"}`);';
const DOUBLE_QUOTED_DYNAMIC_IMPORT = `
const hap = await import("${HAP_PACKAGE_SPECIFIER}");
`;
const BACKTICK_DYNAMIC_IMPORT = 'const hap = await import(`' + HAP_PACKAGE_SPECIFIER + '`);';
const CREATE_REQUIRE_IMPORT = `
import { createRequire as makeRequire } from 'node:module';
const loadModule = makeRequire(import.meta.url);
const hap = loadModule('${HAP_PACKAGE_SPECIFIER}');
`;
const IMMEDIATE_CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
const hap = createRequire(import.meta.url)('${HAP_PACKAGE_SPECIFIER}');
`;
const UNRESOLVED_IMMEDIATE_CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
const hap = createRequire(import.meta.url)(process.env.MODULE);
`;
const CONSTANT_CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
const target = '${HAP_PACKAGE_SPECIFIER}';
const hap = loadModule(target);
`;
const COMPUTED_CREATE_REQUIRE_SPECIFIER = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
const hap = loadModule('@homebridge/' + 'hap-nodejs');
`;
const NAMESPACE_CREATE_REQUIRE_IMPORT = `
import * as module from 'node:module';
const loadModule = module.createRequire(import.meta.url);
const hap = loadModule('${HAP_PACKAGE_SPECIFIER}');
`;
const ALIASED_NAMESPACE_CREATE_REQUIRE_IMPORT = `
import * as module from 'node:module';
const moduleAlias = module;
const loadModule = moduleAlias.createRequire(import.meta.url);
const hap = loadModule('${HAP_PACKAGE_SPECIFIER}');
`;
const DESTRUCTURED_CREATE_REQUIRE_IMPORT = `
import * as module from 'node:module';
const { createRequire } = module;
const loadModule = createRequire(import.meta.url);
const hap = loadModule('${HAP_PACKAGE_SPECIFIER}');
`;
const DYNAMIC_DESTRUCTURED_CREATE_REQUIRE_IMPORT = `
const { createRequire } = await import('node:module');
const loadModule = createRequire(import.meta.url);
const hap = loadModule('${HAP_PACKAGE_SPECIFIER}');
`;
const DYNAMIC_NAMESPACE_CREATE_REQUIRE_IMPORT = `
const module = await import('node:module');
const loadModule = module.createRequire(import.meta.url);
const hap = loadModule('${HAP_PACKAGE_SPECIFIER}');
`;
const ALIASED_DYNAMIC_NAMESPACE_CREATE_REQUIRE_IMPORT = `
const module = await import('node:module');
const moduleAlias = module;
const loadModule = moduleAlias.createRequire(import.meta.url);
const hap = loadModule('${HAP_PACKAGE_SPECIFIER}');
`;
const RENAMED_DESTRUCTURED_CREATE_REQUIRE_IMPORT = `
import * as module from 'node:module';
const { createRequire: makeRequire } = module;
const loadModule = makeRequire(import.meta.url);
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
const UNRELATED_NESTED_CALL = `
const other = () => (name: string) => name;
const hap = other()('${HAP_PACKAGE_SPECIFIER}');
`;
const UNRELATED_NAMESPACE_ALIAS = `
const other = { createRequire: () => (name: string) => name };
const moduleAlias = other;
const loadModule = moduleAlias.createRequire(import.meta.url);
const hap = loadModule('${HAP_PACKAGE_SPECIFIER}');
`;
const UNRELATED_DESTRUCTURED_CREATE_REQUIRE_IMPORT = `
const other = { createRequire: () => (name: string) => name };
const { createRequire: makeRequire } = other;
const loadModule = makeRequire(import.meta.url);
const hap = loadModule('${HAP_PACKAGE_SPECIFIER}');
`;
const UNRELATED_DYNAMIC_DESTRUCTURE = `
const { createRequire } = await import('other-module');
const loadModule = createRequire(import.meta.url);
const hap = loadModule('${HAP_PACKAGE_SPECIFIER}');
`;
const UNRELATED_DYNAMIC_NAMESPACE = `
const module = await import('other-module');
const loadModule = module.createRequire(import.meta.url);
const hap = loadModule('${HAP_PACKAGE_SPECIFIER}');
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
    computedDynamic: importsHapPackage(COMPUTED_DYNAMIC_IMPORT),
    computedConstantDynamic: importsHapPackage(COMPUTED_CONSTANT_DYNAMIC_IMPORT),
    fixedTemplateDynamic: importsHapPackage(FIXED_TEMPLATE_DYNAMIC_IMPORT),
    doubleQuotedDynamic: importsHapPackage(DOUBLE_QUOTED_DYNAMIC_IMPORT),
    backtickDynamic: importsHapPackage(BACKTICK_DYNAMIC_IMPORT),
    createRequire: importsHapPackage(CREATE_REQUIRE_IMPORT),
    immediateCreateRequire: importsHapPackage(IMMEDIATE_CREATE_REQUIRE_IMPORT),
    constantCreateRequire: importsHapPackage(CONSTANT_CREATE_REQUIRE_IMPORT),
    computedCreateRequireSpecifier: importsHapPackage(COMPUTED_CREATE_REQUIRE_SPECIFIER),
    namespaceCreateRequire: importsHapPackage(NAMESPACE_CREATE_REQUIRE_IMPORT),
    aliasedNamespaceCreateRequire: importsHapPackage(ALIASED_NAMESPACE_CREATE_REQUIRE_IMPORT),
    destructuredCreateRequire: importsHapPackage(DESTRUCTURED_CREATE_REQUIRE_IMPORT),
    dynamicDestructuredCreateRequire: importsHapPackage(DYNAMIC_DESTRUCTURED_CREATE_REQUIRE_IMPORT),
    dynamicNamespaceCreateRequire: importsHapPackage(DYNAMIC_NAMESPACE_CREATE_REQUIRE_IMPORT),
    aliasedDynamicNamespaceCreateRequire: importsHapPackage(ALIASED_DYNAMIC_NAMESPACE_CREATE_REQUIRE_IMPORT),
    renamedDestructuredCreateRequire: importsHapPackage(RENAMED_DESTRUCTURED_CREATE_REQUIRE_IMPORT),
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
    computedDynamic: true,
    computedConstantDynamic: true,
    fixedTemplateDynamic: true,
    doubleQuotedDynamic: true,
    backtickDynamic: true,
    createRequire: true,
    immediateCreateRequire: true,
    constantCreateRequire: true,
    computedCreateRequireSpecifier: true,
    namespaceCreateRequire: true,
    aliasedNamespaceCreateRequire: true,
    destructuredCreateRequire: true,
    dynamicDestructuredCreateRequire: true,
    dynamicNamespaceCreateRequire: true,
    aliasedDynamicNamespaceCreateRequire: true,
    renamedDestructuredCreateRequire: true,
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
    unrelatedNestedCall: importsHapPackage(UNRELATED_NESTED_CALL),
    unrelatedNamespaceAlias: importsHapPackage(UNRELATED_NAMESPACE_ALIAS),
    unrelatedDestructuredCreateRequire: importsHapPackage(UNRELATED_DESTRUCTURED_CREATE_REQUIRE_IMPORT),
    unrelatedDynamicDestructure: importsHapPackage(UNRELATED_DYNAMIC_DESTRUCTURE),
    unrelatedDynamicNamespace: importsHapPackage(UNRELATED_DYNAMIC_NAMESPACE),
    unrelatedConstantDynamic: importsHapPackage(UNRELATED_CONSTANT_DYNAMIC_IMPORT),
    unrelatedComputedDynamic: importsHapPackage(UNRELATED_COMPUTED_DYNAMIC_IMPORT),
    unrelatedFixedTemplateDynamic: importsHapPackage(UNRELATED_FIXED_TEMPLATE_DYNAMIC_IMPORT),
  };

  // assert
  assert.deepStrictEqual(imports, {
    comment: false,
    unrelatedImport: false,
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
  });
});

test('rejects a HAP import with an unresolved target', () => {
  // act & assert
  assert.throws(() => importsHapPackage(UNRESOLVED_DYNAMIC_IMPORT), { message: 'cannot resolve module specifier in dynamic import' });
});

test('rejects a HAP loader call with an unresolved target', () => {
  // act & assert
  assert.throws(() => importsHapPackage(UNRESOLVED_CREATE_REQUIRE_IMPORT), { message: 'cannot resolve module specifier in createRequire load' });
});

test('rejects an immediate HAP loader call with an unresolved target', () => {
  // act & assert
  assert.throws(() => importsHapPackage(UNRESOLVED_IMMEDIATE_CREATE_REQUIRE_IMPORT), { message: 'cannot resolve module specifier in createRequire load' });
});

test('detects a HAP loader made from an awaited module expression', () => {
  // act
  const detections = {
    module: importsHapPackage(`
const load = (await import('node:module')).createRequire(import.meta.url);
load('@homebridge/hap-nodejs');
`),
    unrelated: importsHapPackage(`
const load = (await import('node:fs')).createRequire(import.meta.url);
load('@homebridge/hap-nodejs');
`),
  };

  // assert
  assert.deepStrictEqual(detections, { module: true, unrelated: false });
});

test('detects copied createRequire members loading HAP from static and dynamic module namespaces', () => {
  // act
  const detections = {
    staticMember: importsHapPackage(`
import * as module from 'node:module';
const makeRequire = module.createRequire;
const alias = makeRequire;
const load = alias(import.meta.url);
load('@homebridge/hap-nodejs');
`),
    staticComputed: importsHapPackage(`
import * as module from 'node:module';
const makeRequire = module['createRequire'];
const load = makeRequire(import.meta.url);
load('@homebridge/hap-nodejs');
`),
    dynamicMember: importsHapPackage(`
const module = await import('node:module');
const makeRequire = module.createRequire;
const load = makeRequire(import.meta.url);
load('@homebridge/hap-nodejs');
`),
    dynamicComputed: importsHapPackage(`
const module = await import('node:module');
const makeRequire = module['createRequire'];
const load = makeRequire(import.meta.url);
load('@homebridge/hap-nodejs');
`),
    unrelated: importsHapPackage(`
const module = { createRequire: () => (name: string) => name };
const makeRequire = module.createRequire;
const load = makeRequire(import.meta.url);
load('@homebridge/hap-nodejs');
`),
  };

  // assert
  assert.deepStrictEqual(detections, { staticMember: true, staticComputed: true, dynamicMember: true, dynamicComputed: true, unrelated: false });
});

test('detects parenthesized creator members, calls and loader initializers loading HAP', () => {
  // act
  const detections = {
    member: importsHapPackage(
      `
import * as module from 'node:module';
const make = (module.createRequire);
const load = make(import.meta.url);
load('@homebridge/hap-nodejs');
`,
    ),
    initializer: importsHapPackage(
      `
import { createRequire } from 'node:module';
const load = (createRequire(import.meta.url));
load('@homebridge/hap-nodejs');
`,
    ),
    call: importsHapPackage(`
import { createRequire } from 'node:module';
(createRequire)(import.meta.url)('@homebridge/hap-nodejs');
`),
    unrelatedMember: importsHapPackage(
      `
const other = { createRequire: () => (name: string) => name };
const make = (other.createRequire);
const load = make(import.meta.url);
load('@homebridge/hap-nodejs');
`,
    ),
    unrelatedInitializer: importsHapPackage(
      `
const createRequire = () => (name: string) => name;
const load = (createRequire(import.meta.url));
load('@homebridge/hap-nodejs');
`,
    ),
    unrelatedCall: importsHapPackage(`
const createRequire = () => (name: string) => name;
(createRequire)(import.meta.url)('@homebridge/hap-nodejs');
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

test('detects direct createRequire calls with fixed computed keys loading HAP', () => {
  // act
  const detections = {
    staticExpression: importsHapPackage(`
import * as module from 'node:module';
const load = module['create' + 'Require'](import.meta.url);
load('@homebridge/hap-nodejs');
`),
    staticAlias: importsHapPackage(`
import * as module from 'node:module';
const member = 'createRequire';
const load = module[member](import.meta.url);
load('@homebridge/hap-nodejs');
`),
    dynamicExpression: importsHapPackage(`
const module = await import('node:module');
const load = module['create' + 'Require'](import.meta.url);
load('@homebridge/hap-nodejs');
`),
    dynamicAlias: importsHapPackage(`
const module = await import('node:module');
const member = 'createRequire';
const load = module[member](import.meta.url);
load('@homebridge/hap-nodejs');
`),
    unrelatedKey: importsHapPackage(`
import * as module from 'node:module';
const load = module['other' + 'Require'](import.meta.url);
load('@homebridge/hap-nodejs');
`),
    unrelatedObject: importsHapPackage(`
const module = { createRequire: () => (name: string) => name };
const member = 'createRequire';
const load = module[member](import.meta.url);
load('@homebridge/hap-nodejs');
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

test('detects fixed computed createRequire destructuring loading HAP without following unrelated keys', () => {
  // act
  const detections = {
    computed: importsHapPackage(`
import * as module from 'node:module';
const { ['create' + 'Require']: make } = module;
const load = make(import.meta.url);
load('@homebridge/hap-nodejs');
`),
    unrelatedKey: importsHapPackage(`
import * as module from 'node:module';
const { ['other' + 'Require']: make } = module;
const load = make(import.meta.url);
load('@homebridge/hap-nodejs');
`),
  };

  // assert
  assert.deepStrictEqual(detections, { computed: true, unrelatedKey: false });
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
  const destructuredUuid = sourceFileOf('const { uuid } = hap; uuid.generate(deviceId);');
  const renamedUuid = sourceFileOf('const { uuid: ids } = this.api.hap; ids.generate(deviceId);');
  const setEventAlias = sourceFileOf('const writeEvent = hap.CharacteristicEventTypes.SET; characteristic.on(writeEvent, handler);');

  // act
  const uses = {
    uuidAlias: hapUses(uuidAlias).memberCall,
    destructuredUuid: hapUses(destructuredUuid).memberCall,
    renamedUuid: hapUses(renamedUuid).memberCall,
    setEventAlias: hapUses(setEventAlias).setEvent,
  };

  // assert
  assert.deepStrictEqual(uses, { uuidAlias: true, destructuredUuid: true, renamedUuid: true, setEventAlias: true });
});

test('counts set-event registration through an injected HAP namespace alias', () => {
  // arrange
  const injectedHap = sourceFileOf('const hapApi = this.api.hap; characteristic.on(hapApi.CharacteristicEventTypes.SET, handler);');
  const unrelatedEnum = sourceFileOf('const hapApi = other; characteristic.on(hapApi.CharacteristicEventTypes.SET, handler);');
  const shadowedHap = sourceFileOf(
    'const hapApi = this.api.hap; function run(hapApi: API) { characteristic.on(hapApi.CharacteristicEventTypes.SET, handler); }',
  );

  // act
  const uses = {
    injectedHap: hapUses(injectedHap).setEvent,
    unrelatedEnum: hapUses(unrelatedEnum).setEvent,
    shadowedHap: hapUses(shadowedHap).setEvent,
  };

  // assert
  assert.deepStrictEqual(uses, { injectedHap: true, unrelatedEnum: false, shadowedHap: false });
});

test('resolves fixed set events through object bindings without following unrelated or shadowed names', () => {
  // arrange
  const direct = sourceFileOf('const events = { SET: hap.CharacteristicEventTypes.SET }; const { SET } = events; characteristic.on(SET, handler);');
  const renamed = sourceFileOf(
    'const events = { SET: hap.CharacteristicEventTypes.SET }; const { SET: writeEvent } = events; characteristic.on(writeEvent, handler);',
  );
  const unrelated = sourceFileOf('const events = { SET: other.SET }; const { SET } = events; characteristic.on(SET, handler);');
  const shadowedObject = sourceFileOf(
    'const events = { SET: hap.CharacteristicEventTypes.SET }; function run(events: Events) { const { SET } = events; characteristic.on(SET, handler); }',
  );
  const shadowedEvent = sourceFileOf(
    'const events = { SET: hap.CharacteristicEventTypes.SET }; const { SET } = events; function run(SET: string) { characteristic.on(SET, handler); }',
  );

  // act
  const uses = {
    direct: hapUses(direct).setEvent,
    renamed: hapUses(renamed).setEvent,
    unrelated: hapUses(unrelated).setEvent,
    shadowedObject: hapUses(shadowedObject).setEvent,
    shadowedEvent: hapUses(shadowedEvent).setEvent,
  };

  // assert
  assert.deepStrictEqual(uses, { direct: true, renamed: true, unrelated: false, shadowedObject: false, shadowedEvent: false });
});

test('counts HAP set event enum aliases and destructuring without following shadowed names', () => {
  // arrange
  const alias = sourceFileOf('const events = hap.CharacteristicEventTypes; characteristic.on(events.SET, handler);');
  const forwarded = sourceFileOf('const events = hap.CharacteristicEventTypes; const next = events; characteristic.on(next.SET, handler);');
  const direct = sourceFileOf('const { SET } = hap.CharacteristicEventTypes; characteristic.on(SET, handler);');
  const renamed = sourceFileOf('const { SET: writeEvent } = hap.CharacteristicEventTypes; characteristic.on(writeEvent, handler);');
  const unrelated = sourceFileOf('const events = other.CharacteristicEventTypes; characteristic.on(events.SET, handler);');
  const shadowedObject = sourceFileOf('const events = hap.CharacteristicEventTypes; function run(events: Events) { characteristic.on(events.SET, handler); }');
  const shadowedEvent = sourceFileOf('const { SET } = hap.CharacteristicEventTypes; function run(SET: string) { characteristic.on(SET, handler); }');

  // act
  const uses = {
    alias: hapUses(alias).setEvent,
    forwarded: hapUses(forwarded).setEvent,
    direct: hapUses(direct).setEvent,
    renamed: hapUses(renamed).setEvent,
    unrelated: hapUses(unrelated).setEvent,
    shadowedObject: hapUses(shadowedObject).setEvent,
    shadowedEvent: hapUses(shadowedEvent).setEvent,
  };

  // assert
  assert.deepStrictEqual(uses, {
    alias: true,
    forwarded: true,
    direct: true,
    renamed: true,
    unrelated: false,
    shadowedObject: false,
    shadowedEvent: false,
  });
});

test('counts fixed computed set event names without following unrelated names', () => {
  // arrange
  const concatenated = sourceFileOf(`
const event = 's' + 'et'; characteristic.on(event, handler);
`);
  const direct = sourceFileOf(`
characteristic.on('s' + 'et', handler);
`);
  const template = sourceFileOf('const event = `s${"e"}t`; characteristic.on(event, handler);');
  const unrelated = sourceFileOf(`
const event = 'ch' + 'ange'; characteristic.on(event, handler);
`);
  const unresolved = sourceFileOf('const event = prefix + "et"; characteristic.on(event, handler);');

  // act
  const uses = {
    concatenated: hapUses(concatenated).setEvent,
    direct: hapUses(direct).setEvent,
    template: hapUses(template).setEvent,
    unrelated: hapUses(unrelated).setEvent,
    unresolved: hapUses(unresolved).setEvent,
  };

  // assert
  assert.deepStrictEqual(uses, { concatenated: true, direct: true, template: true, unrelated: false, unresolved: false });
});

test('resolves constant operands in set event names without following shadowed names', () => {
  // arrange
  const concatenated = sourceFileOf(`
const prefix = 's'; const event = prefix + 'et'; characteristic.on(event, handler);
`);
  const forwarded = sourceFileOf(`
const prefix = 's'; const next = prefix; characteristic.on(next + 'et', handler);
`);
  const template = sourceFileOf('const prefix = "s"; characteristic.on(`${prefix}et`, handler);');
  const unrelated = sourceFileOf(`
const prefix = 'g'; characteristic.on(prefix + 'et', handler);
`);
  const shadowed = sourceFileOf(`
const prefix = 's'; function run(prefix: string) { characteristic.on(prefix + 'et', handler); }
`);
  const mutable = sourceFileOf(`
let prefix = 's'; characteristic.on(prefix + 'et', handler);
`);
  const cyclic = sourceFileOf(`
const prefix = prefix + 's'; characteristic.on(prefix + 'et', handler);
`);

  // act
  const uses = {
    concatenated: hapUses(concatenated).setEvent,
    forwarded: hapUses(forwarded).setEvent,
    template: hapUses(template).setEvent,
    unrelated: hapUses(unrelated).setEvent,
    shadowed: hapUses(shadowed).setEvent,
    mutable: hapUses(mutable).setEvent,
    cyclic: hapUses(cyclic).setEvent,
  };

  // assert
  assert.deepStrictEqual(uses, {
    concatenated: true,
    forwarded: true,
    template: true,
    unrelated: false,
    shadowed: false,
    mutable: false,
    cyclic: false,
  });
});

test('resolves computed HAP set event keys without following unrelated keys', () => {
  // arrange
  const expression = sourceFileOf(`
characteristic.on(hap.CharacteristicEventTypes['S' + 'ET'], handler);
`);
  const alias = sourceFileOf(`
const key = 'S' + 'ET'; characteristic.on(hap.CharacteristicEventTypes[key], handler);
`);
  const enumAlias = sourceFileOf(`
const events = hap.CharacteristicEventTypes; const key = 'SET'; characteristic.on(events[key], handler);
`);
  const unrelatedKey = sourceFileOf(`
characteristic.on(hap.CharacteristicEventTypes['G' + 'ET'], handler);
`);
  const unrelatedObject = sourceFileOf(`
characteristic.on(other.CharacteristicEventTypes['S' + 'ET'], handler);
`);
  const shadowedKey = sourceFileOf(`
const key = 'SET'; function run(key: string) { characteristic.on(hap.CharacteristicEventTypes[key], handler); }
`);

  // act
  const uses = {
    expression: hapUses(expression).setEvent,
    alias: hapUses(alias).setEvent,
    enumAlias: hapUses(enumAlias).setEvent,
    unrelatedKey: hapUses(unrelatedKey).setEvent,
    unrelatedObject: hapUses(unrelatedObject).setEvent,
    shadowedKey: hapUses(shadowedKey).setEvent,
  };

  // assert
  assert.deepStrictEqual(uses, {
    expression: true,
    alias: true,
    enumAlias: true,
    unrelatedKey: false,
    unrelatedObject: false,
    shadowedKey: false,
  });
});

test('counts UUID calls through aliases of the injected HAP namespace', () => {
  // arrange
  const namespaceAlias = sourceFileOf('const hapApi = this.api.hap; hapApi.uuid.generate(deviceId);');
  const forwardedAlias = sourceFileOf('const hapApi = this.api.hap; const forwarded = hapApi; forwarded.uuid.generate(deviceId);');
  const destructuredAlias = sourceFileOf('const hapApi = this.api.hap; const { uuid } = hapApi; uuid.generate(deviceId);');

  // act
  const uses = {
    namespaceAlias: hapUses(namespaceAlias).memberCall,
    forwardedAlias: hapUses(forwardedAlias).memberCall,
    destructuredAlias: hapUses(destructuredAlias).memberCall,
  };

  // assert
  assert.deepStrictEqual(uses, { namespaceAlias: true, forwardedAlias: true, destructuredAlias: true });
});

test('counts UUID calls through a renamed HAP namespace destructured from the injected API', () => {
  // arrange
  const injectedHap = sourceFileOf('const { hap: h } = this.api; h.uuid.generate(deviceId);');
  const unrelatedHap = sourceFileOf('const { hap: h } = other; h.uuid.generate(deviceId);');
  const shadowedHap = sourceFileOf('const { hap: h } = this.api; function run(h: API) { h.uuid.generate(deviceId); }');

  // act
  const uses = {
    injectedHap: hapUses(injectedHap).memberCall,
    unrelatedHap: hapUses(unrelatedHap).memberCall,
    shadowedHap: hapUses(shadowedHap).memberCall,
  };

  // assert
  assert.deepStrictEqual(uses, { injectedHap: true, unrelatedHap: false, shadowedHap: false });
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
  const unrelatedUuidObject = sourceFileOf('const { uuid } = other; uuid.generate(deviceId);');
  const unrelatedNamespace = sourceFileOf('const hapApi = other; hapApi.uuid.generate(deviceId);');
  const shadowedNamespace = sourceFileOf('const hapApi = this.api.hap; function run(hapApi: API) { hapApi.uuid.generate(deviceId); }');
  const shadowedHap = sourceFileOf('const hap = other; hap.uuid.generate(deviceId);');

  // act
  const uses = {
    unused: hapUses(unused).destructuredCall,
    unrelated: hapUses(unrelated).destructuredCall,
    unrelatedMember: hapUses(unrelatedMember).memberCall,
    unrelatedUuidObject: hapUses(unrelatedUuidObject).memberCall,
    unrelatedNamespace: hapUses(unrelatedNamespace).memberCall,
    shadowedNamespace: hapUses(shadowedNamespace).memberCall,
    shadowedHap: hapUses(shadowedHap).memberCall,
  };

  // assert
  assert.deepStrictEqual(uses, {
    unused: false,
    unrelated: false,
    unrelatedMember: false,
    unrelatedUuidObject: false,
    unrelatedNamespace: false,
    shadowedNamespace: false,
    shadowedHap: false,
  });
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

test('direct HAP-use cases include accessory modules outside the control binder', () => {
  // act
  const covered = {
    alarmMute: SET_HANDLER_MODULES.includes('alarmMute.ts'),
    pumpRecords: SET_HANDLER_MODULES.includes('pumpRecords.ts'),
    reconciliation: SET_HANDLER_MODULES.includes('reconciliation.ts'),
    services: SET_HANDLER_MODULES.includes('services.ts'),
    staleMarking: SET_HANDLER_MODULES.includes('staleMarking.ts'),
    controlBinderExcluded: !SET_HANDLER_MODULES.includes('controls.ts'),
    controlBinderUuidChecked: ACCESSORY_MODULES.includes('controls.ts'),
  };

  // assert
  assert.ok(ACCESSORY_MODULES.length >= 10);
  assert.deepStrictEqual(covered, {
    alarmMute: true,
    pumpRecords: true,
    reconciliation: true,
    services: true,
    staleMarking: true,
    controlBinderExcluded: true,
    controlBinderUuidChecked: true,
  });
});

for (const module of SET_HANDLER_MODULES) {
  // The control binder owns Switch `On` writes. Other modules register no direct set handler.
  test(`${module} has no direct onSet or set-event registration`, () => {
    // act
    const file = accessorySourceOf(module);
    const uses = hapUses(file);

    // assert
    assert.deepStrictEqual({ onSet: uses.onSet, setEvent: uses.setEvent }, { onSet: false, setEvent: false });
  });
}

for (const module of ACCESSORY_MODULES) {
  test(`${module} contains no direct HAP UUID generation call`, () => {
    // act
    const file = accessorySourceOf(module);
    const uses = hapUses(file);

    // assert
    assert.deepStrictEqual({ memberCall: uses.memberCall, destructuredCall: uses.destructuredCall }, { memberCall: false, destructuredCall: false });
  });
}
