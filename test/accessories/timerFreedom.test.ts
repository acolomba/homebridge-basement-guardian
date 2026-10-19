// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview The static half of the immediacy gate: no module in the
 * accessories tier can reach for deferred execution at all.
 *
 * `SAFE-07` forbids the plugin adding any delay of its own between a reported
 * safety condition and the characteristic that carries it. The runtime layers
 * that gate it -- the injected timer port `D-18` names, the global scheduling
 * spies, and the synchronous-visibility read -- all watch one accessory while it
 * runs. None of them can see a deferral written through the promises form of the
 * Node timers module: awaiting it schedules nothing on `globalThis`, so a global
 * timer spy records zero calls while the publish is genuinely deferred.
 *
 * Three production modules under `src/` already import that form, so it is the
 * spelling a future author would reach for without thinking about it. Reading
 * the source text is the only layer that can name that failure, and it names it
 * cheaply: an accessories module either imports deferred execution or it does
 * not.
 *
 * The gate enumerates the directory rather than a fixed list, so a module added
 * later is covered without anyone remembering to extend this file, and it
 * asserts a floor on what the enumeration found, because a gate that silently
 * reads nothing reports the same green as a gate that read everything.
 */

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { importSpecifiers, typeScriptFilesUnder } from './staticGateSources.js';

/**
 * Every Node standard-library module that hands a caller deferred execution.
 *
 * Node accepts both `node:` and bare names. This list covers each name that
 * gives accessory code a way to defer a safety publish.
 */
const DEFERRED_EXECUTION_MODULES: readonly string[] = ['node:timers', 'node:timers/promises', 'timers', 'timers/promises'];

// The compiled case runs from `dist-test/test/accessories`, which puts the
// repository root three levels up. The floor below is what turns a wrong count
// of levels into a named failure rather than an empty read reporting success.
const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const ACCESSORIES_DIRECTORY = join(REPOSITORY_ROOT, 'src', 'accessories');

// The accessories tier holds ten modules. A gate that enumerated fewer than
// this read the wrong directory, and every assertion built on that read would
// pass without examining a single accessory module.
const ACCESSORIES_MODULE_FLOOR = 10;

function importsDeferredExecution(source: string): boolean {
  return importSpecifiers(source).some((specifier) => DEFERRED_EXECUTION_MODULES.includes(specifier));
}

function deferredExecutionImportsIn(relativeDirectory: string): { modules: readonly string[]; importing: readonly string[] } {
  const modules = typeScriptFilesUnder(relativeDirectory);
  const importing = modules.filter((module) => importsDeferredExecution(readFileSync(join(REPOSITORY_ROOT, module), 'utf8')));
  return { modules, importing };
}

function assertAccessoryModuleFloor(modules: readonly string[], directory: string): void {
  assert.ok(
    modules.length >= ACCESSORIES_MODULE_FLOOR,
    `the gate enumerated ${String(modules.length)} modules under ${directory}, fewer than the ${String(ACCESSORIES_MODULE_FLOOR)} that tier holds`,
  );
}

// One fixture per spelling the detector has to catch, written out rather than
// generated from the table above, so a change to the table cannot silently
// satisfy its own negative control. Each is a line of source text with its own
// line breaks, which is the shape the detector reads a real module in.
const NAMED_PROMISES_IMPORT = `
import { setTimeout as delay } from 'node:timers/promises';
`;
const NAMED_BARE_IMPORT = `
import { setTimeout } from 'node:timers';
`;
const BARE_TIMERS_IMPORT = `
import { setTimeout } from 'timers';
`;
const DOUBLE_QUOTED_IMPORT = `
import { setTimeout } from "node:timers/promises";
`;
const SIDE_EFFECT_IMPORT = `
import 'node:timers';
`;
const DYNAMIC_PROMISES_IMPORT = `
const timers = await import('node:timers/promises');
`;
const DYNAMIC_BARE_PROMISES_IMPORT = `
const timers = await import('timers/promises');
`;
const CONSTANT_DYNAMIC_IMPORT = `
const target = 'node:timers/promises';
const timers = await import(target);
`;
const COMPUTED_DYNAMIC_IMPORT = `
const timers = await import('node:timers/' + 'promises');
`;
const COMPUTED_CONSTANT_DYNAMIC_IMPORT = `
const target = 'node:timers/' + 'promises';
const timers = await import(target);
`;
const FIXED_TEMPLATE_DYNAMIC_IMPORT = 'const timers = await import(`node:timers/${"promises"}`);';
const UNRESOLVED_DYNAMIC_IMPORT = 'const timers = await import(process.env.MODULE);';
const UNRESOLVED_CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
const timers = loadModule(process.env.MODULE);
`;
const UNRELATED_CONSTANT_DYNAMIC_IMPORT = `
const target = 'node:fs';
const files = await import(target);
`;
const UNRELATED_COMPUTED_DYNAMIC_IMPORT = `
const files = await import('node:' + 'fs');
`;
const UNRELATED_FIXED_TEMPLATE_DYNAMIC_IMPORT = 'const files = await import(`node:${"fs"}`);';
const BACKTICK_DYNAMIC_IMPORT = 'const timers = await import(`node:timers`);';
const CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
const timers = loadModule('node:timers/promises');
`;
const IMMEDIATE_CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
const timers = createRequire(import.meta.url)('node:timers/promises');
`;
const UNRESOLVED_IMMEDIATE_CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
const timers = createRequire(import.meta.url)(process.env.MODULE);
`;
const CONSTANT_CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
const target = 'node:timers/promises';
const timers = loadModule(target);
`;
const COMPUTED_CREATE_REQUIRE_SPECIFIER = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
const timers = loadModule('node:timers/' + 'promises');
`;
const NAMESPACE_CREATE_REQUIRE_IMPORT = `
import * as module from 'node:module';
const loadModule = module.createRequire(import.meta.url);
const timers = loadModule('node:timers/promises');
`;
const ALIASED_NAMESPACE_CREATE_REQUIRE_IMPORT = `
import * as module from 'node:module';
const moduleAlias = module;
const loadModule = moduleAlias.createRequire(import.meta.url);
const timers = loadModule('node:timers/promises');
`;
const DESTRUCTURED_CREATE_REQUIRE_IMPORT = `
import * as module from 'node:module';
const { createRequire } = module;
const loadModule = createRequire(import.meta.url);
const timers = loadModule('node:timers/promises');
`;
const DYNAMIC_DESTRUCTURED_CREATE_REQUIRE_IMPORT = `
const { createRequire } = await import('node:module');
const loadModule = createRequire(import.meta.url);
const timers = loadModule('node:timers/promises');
`;
const DYNAMIC_NAMESPACE_CREATE_REQUIRE_IMPORT = `
const module = await import('node:module');
const loadModule = module.createRequire(import.meta.url);
const timers = loadModule('node:timers/promises');
`;
const ALIASED_DYNAMIC_NAMESPACE_CREATE_REQUIRE_IMPORT = `
const module = await import('node:module');
const moduleAlias = module;
const loadModule = moduleAlias.createRequire(import.meta.url);
const timers = loadModule('node:timers/promises');
`;
const RENAMED_DESTRUCTURED_CREATE_REQUIRE_IMPORT = `
import * as module from 'node:module';
const { createRequire: makeRequire } = module;
const loadModule = makeRequire(import.meta.url);
const timers = loadModule('node:timers/promises');
`;
const COMPUTED_CREATE_REQUIRE_IMPORT = `
import * as module from 'node:module';
const loadModule = module['createRequire'](import.meta.url);
const timers = loadModule('node:timers/promises');
`;
const DEFAULT_CREATE_REQUIRE_IMPORT = `
import module from 'node:module';
const loadModule = module.createRequire(import.meta.url);
const timers = loadModule('node:timers/promises');
`;
const ALIASED_CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
const makeRequire = createRequire;
const loadModule = makeRequire(import.meta.url);
const timers = loadModule('node:timers/promises');
`;
const ALTERNATE_BASE_CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(new URL('./probe.js', import.meta.url));
const timers = loadModule('node:timers/promises');
`;
const PATH_BASE_CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
import { join } from 'node:path';
const loadModule = createRequire(join(process.cwd(), 'probe.js'));
const timers = loadModule('node:timers/promises');
`;
const LOADER_ALIAS_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
const load = loadModule;
const timers = load('node:timers/promises');
`;
const SHADOWED_CREATE_REQUIRE_IMPORT = `
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
function run(loadModule: (name: string) => void) {
  loadModule('node:timers/promises');
}
`;
const SHADOWED_CREATOR_ALIAS_IMPORT = `
import { createRequire } from 'node:module';
const makeRequire = createRequire;
function run(makeRequire: (url: string) => (name: string) => void) {
  const loadModule = makeRequire(import.meta.url);
  loadModule('node:timers/promises');
}
`;
const UNRELATED_LOADER_CALL = `
function run(load: (name: string) => void) {
  load('node:timers/promises');
}
`;
const UNRELATED_NESTED_CALL = `
const other = () => (name: string) => name;
const timers = other()('node:timers/promises');
`;
const UNRELATED_NAMESPACE_ALIAS = `
const other = { createRequire: () => (name: string) => name };
const moduleAlias = other;
const loadModule = moduleAlias.createRequire(import.meta.url);
const timers = loadModule('node:timers/promises');
`;
const UNRELATED_DESTRUCTURED_CREATE_REQUIRE_IMPORT = `
const other = { createRequire: () => (name: string) => name };
const { createRequire: makeRequire } = other;
const loadModule = makeRequire(import.meta.url);
const timers = loadModule('node:timers/promises');
`;
const UNRELATED_DYNAMIC_DESTRUCTURE = `
const { createRequire } = await import('other-module');
const loadModule = createRequire(import.meta.url);
const timers = loadModule('node:timers/promises');
`;
const UNRELATED_DYNAMIC_NAMESPACE = `
const module = await import('other-module');
const loadModule = module.createRequire(import.meta.url);
const timers = loadModule('node:timers/promises');
`;
const COMMENT_INTERLEAVED_IMPORT = `
import { setTimeout } from /* a valid comment */ 'node:timers/promises';
`;
const RE_EXPORTED_IMPORT = `
export { setTimeout } from 'node:timers';
`;

// One fixture per way the detector has to stay quiet: naming the modules in
// prose is what this very file does, and an unrelated Node import is what most
// accessories modules legitimately carry.
const COMMENT_NAMING_THE_MODULES = `
// A publish deferred through node:timers or node:timers/promises defeats a global timer spy.
`;
const UNRELATED_NODE_IMPORT = `
import { readFileSync } from 'node:fs';
`;

test('no module in the accessories tier imports deferred execution from the node standard library (SAFE-07, D-18)', () => {
  // act
  const { modules, importing } = deferredExecutionImportsIn('src/accessories');

  // assert
  assertAccessoryModuleFloor(modules, ACCESSORIES_DIRECTORY);
  assert.deepStrictEqual(importing, []);
});

test('reads a nested accessory module that imports deferred execution (SAFE-07)', () => {
  // arrange
  const directory = mkdtempSync(join(tmpdir(), 'guardian-timer-gate-'));
  const nestedDirectory = join(directory, 'nested');
  const relativeDirectory = relative(REPOSITORY_ROOT, directory);
  const nestedModule = `${relativeDirectory}/nested/monitor.ts`;

  try {
    mkdirSync(nestedDirectory);
    writeFileSync(join(nestedDirectory, 'monitor.ts'), NAMED_PROMISES_IMPORT);

    // act
    const imports = deferredExecutionImportsIn(relativeDirectory);

    // assert
    assert.deepStrictEqual(imports, { modules: [nestedModule], importing: [nestedModule] });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('rejects a missing accessory tree and an enumeration below the module floor (SAFE-07)', () => {
  // arrange
  const directory = mkdtempSync(join(tmpdir(), 'guardian-timer-gate-'));
  const relativeDirectory = relative(REPOSITORY_ROOT, directory);

  try {
    // act
    const readMissingTree = () => deferredExecutionImportsIn(`${relativeDirectory}/missing`);
    const checkEmptyTree = () => {
      assertAccessoryModuleFloor([], directory);
    };

    // assert
    assert.throws(readMissingTree, { code: 'ENOENT' });
    assert.throws(checkEmptyTree, { message: `the gate enumerated 0 modules under ${directory}, fewer than the 10 that tier holds` });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('reports a planted deferred-execution import in every spelling it is meant to catch (SAFE-07)', () => {
  // act
  const imports = {
    namedPromises: importsDeferredExecution(NAMED_PROMISES_IMPORT),
    namedBare: importsDeferredExecution(NAMED_BARE_IMPORT),
    bareTimers: importsDeferredExecution(BARE_TIMERS_IMPORT),
    doubleQuoted: importsDeferredExecution(DOUBLE_QUOTED_IMPORT),
    sideEffect: importsDeferredExecution(SIDE_EFFECT_IMPORT),
    dynamic: importsDeferredExecution(DYNAMIC_PROMISES_IMPORT),
    dynamicBarePromises: importsDeferredExecution(DYNAMIC_BARE_PROMISES_IMPORT),
    constantDynamic: importsDeferredExecution(CONSTANT_DYNAMIC_IMPORT),
    computedDynamic: importsDeferredExecution(COMPUTED_DYNAMIC_IMPORT),
    computedConstantDynamic: importsDeferredExecution(COMPUTED_CONSTANT_DYNAMIC_IMPORT),
    fixedTemplateDynamic: importsDeferredExecution(FIXED_TEMPLATE_DYNAMIC_IMPORT),
    backtickDynamic: importsDeferredExecution(BACKTICK_DYNAMIC_IMPORT),
    createRequire: importsDeferredExecution(CREATE_REQUIRE_IMPORT),
    immediateCreateRequire: importsDeferredExecution(IMMEDIATE_CREATE_REQUIRE_IMPORT),
    constantCreateRequire: importsDeferredExecution(CONSTANT_CREATE_REQUIRE_IMPORT),
    computedCreateRequireSpecifier: importsDeferredExecution(COMPUTED_CREATE_REQUIRE_SPECIFIER),
    namespaceCreateRequire: importsDeferredExecution(NAMESPACE_CREATE_REQUIRE_IMPORT),
    aliasedNamespaceCreateRequire: importsDeferredExecution(ALIASED_NAMESPACE_CREATE_REQUIRE_IMPORT),
    destructuredCreateRequire: importsDeferredExecution(DESTRUCTURED_CREATE_REQUIRE_IMPORT),
    dynamicDestructuredCreateRequire: importsDeferredExecution(DYNAMIC_DESTRUCTURED_CREATE_REQUIRE_IMPORT),
    dynamicNamespaceCreateRequire: importsDeferredExecution(DYNAMIC_NAMESPACE_CREATE_REQUIRE_IMPORT),
    aliasedDynamicNamespaceCreateRequire: importsDeferredExecution(ALIASED_DYNAMIC_NAMESPACE_CREATE_REQUIRE_IMPORT),
    renamedDestructuredCreateRequire: importsDeferredExecution(RENAMED_DESTRUCTURED_CREATE_REQUIRE_IMPORT),
    computedCreateRequire: importsDeferredExecution(COMPUTED_CREATE_REQUIRE_IMPORT),
    defaultCreateRequire: importsDeferredExecution(DEFAULT_CREATE_REQUIRE_IMPORT),
    aliasedCreateRequire: importsDeferredExecution(ALIASED_CREATE_REQUIRE_IMPORT),
    alternateBaseCreateRequire: importsDeferredExecution(ALTERNATE_BASE_CREATE_REQUIRE_IMPORT),
    pathBaseCreateRequire: importsDeferredExecution(PATH_BASE_CREATE_REQUIRE_IMPORT),
    loaderAlias: importsDeferredExecution(LOADER_ALIAS_IMPORT),
    commentInterleaved: importsDeferredExecution(COMMENT_INTERLEAVED_IMPORT),
    reExported: importsDeferredExecution(RE_EXPORTED_IMPORT),
  };

  // assert
  assert.deepStrictEqual(imports, {
    namedPromises: true,
    namedBare: true,
    bareTimers: true,
    doubleQuoted: true,
    sideEffect: true,
    dynamic: true,
    dynamicBarePromises: true,
    constantDynamic: true,
    computedDynamic: true,
    computedConstantDynamic: true,
    fixedTemplateDynamic: true,
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
    pathBaseCreateRequire: true,
    loaderAlias: true,
    commentInterleaved: true,
    reExported: true,
  });
});

test('reports neither a comment naming the modules nor an unrelated node import (SAFE-07)', () => {
  // act
  const imports = {
    comment: importsDeferredExecution(COMMENT_NAMING_THE_MODULES),
    unrelatedImport: importsDeferredExecution(UNRELATED_NODE_IMPORT),
    shadowedCreateRequire: importsDeferredExecution(SHADOWED_CREATE_REQUIRE_IMPORT),
    shadowedCreatorAlias: importsDeferredExecution(SHADOWED_CREATOR_ALIAS_IMPORT),
    unrelatedLoaderCall: importsDeferredExecution(UNRELATED_LOADER_CALL),
    unrelatedNestedCall: importsDeferredExecution(UNRELATED_NESTED_CALL),
    unrelatedNamespaceAlias: importsDeferredExecution(UNRELATED_NAMESPACE_ALIAS),
    unrelatedDestructuredCreateRequire: importsDeferredExecution(UNRELATED_DESTRUCTURED_CREATE_REQUIRE_IMPORT),
    unrelatedDynamicDestructure: importsDeferredExecution(UNRELATED_DYNAMIC_DESTRUCTURE),
    unrelatedDynamicNamespace: importsDeferredExecution(UNRELATED_DYNAMIC_NAMESPACE),
    unrelatedConstantDynamic: importsDeferredExecution(UNRELATED_CONSTANT_DYNAMIC_IMPORT),
    unrelatedComputedDynamic: importsDeferredExecution(UNRELATED_COMPUTED_DYNAMIC_IMPORT),
    unrelatedFixedTemplateDynamic: importsDeferredExecution(UNRELATED_FIXED_TEMPLATE_DYNAMIC_IMPORT),
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

test('rejects a deferred-execution import with an unresolved target', () => {
  // act & assert
  assert.throws(() => importsDeferredExecution(UNRESOLVED_DYNAMIC_IMPORT), { message: 'cannot resolve module specifier in dynamic import' });
});

test('rejects a deferred-execution loader call with an unresolved target', () => {
  // act & assert
  assert.throws(() => importsDeferredExecution(UNRESOLVED_CREATE_REQUIRE_IMPORT), { message: 'cannot resolve module specifier in createRequire load' });
});

test('rejects an immediate deferred-execution loader call with an unresolved target', () => {
  // act & assert
  assert.throws(() => importsDeferredExecution(UNRESOLVED_IMMEDIATE_CREATE_REQUIRE_IMPORT), {
    message: 'cannot resolve module specifier in createRequire load',
  });
});

test('detects a loader made from an awaited module expression', () => {
  // act
  const detections = {
    module: importsDeferredExecution(`
const load = (await import('node:module')).createRequire(import.meta.url);
load('node:timers/promises');
`),
    unrelated: importsDeferredExecution(`
const load = (await import('node:fs')).createRequire(import.meta.url);
load('node:timers/promises');
`),
  };

  // assert
  assert.deepStrictEqual(detections, { module: true, unrelated: false });
});

test('detects copied createRequire members from static and dynamic module namespaces', () => {
  // act
  const detections = {
    staticMember: importsDeferredExecution(`
import * as module from 'node:module';
const makeRequire = module.createRequire;
const alias = makeRequire;
const load = alias(import.meta.url);
load('node:timers/promises');
`),
    staticComputed: importsDeferredExecution(`
import * as module from 'node:module';
const makeRequire = module['createRequire'];
const load = makeRequire(import.meta.url);
load('node:timers/promises');
`),
    dynamicMember: importsDeferredExecution(`
const module = await import('node:module');
const makeRequire = module.createRequire;
const load = makeRequire(import.meta.url);
load('node:timers/promises');
`),
    dynamicComputed: importsDeferredExecution(`
const module = await import('node:module');
const makeRequire = module['createRequire'];
const load = makeRequire(import.meta.url);
load('node:timers/promises');
`),
    unrelated: importsDeferredExecution(`
const module = { createRequire: () => (name: string) => name };
const makeRequire = module.createRequire;
const load = makeRequire(import.meta.url);
load('node:timers/promises');
`),
  };

  // assert
  assert.deepStrictEqual(detections, { staticMember: true, staticComputed: true, dynamicMember: true, dynamicComputed: true, unrelated: false });
});

test('detects parenthesized creator members, calls and loader initializers', () => {
  // act
  const detections = {
    member: importsDeferredExecution(
      `
import * as module from 'node:module';
const make = (module.createRequire);
const load = make(import.meta.url);
load('node:timers/promises');
`,
    ),
    initializer: importsDeferredExecution(
      `
import { createRequire } from 'node:module';
const load = (createRequire(import.meta.url));
load('node:timers/promises');
`,
    ),
    call: importsDeferredExecution(`
import { createRequire } from 'node:module';
(createRequire)(import.meta.url)('node:timers/promises');
`),
    unrelatedMember: importsDeferredExecution(
      `
const other = { createRequire: () => (name: string) => name };
const make = (other.createRequire);
const load = make(import.meta.url);
load('node:timers/promises');
`,
    ),
    unrelatedInitializer: importsDeferredExecution(
      `
const createRequire = () => (name: string) => name;
const load = (createRequire(import.meta.url));
load('node:timers/promises');
`,
    ),
    unrelatedCall: importsDeferredExecution(`
const createRequire = () => (name: string) => name;
(createRequire)(import.meta.url)('node:timers/promises');
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
