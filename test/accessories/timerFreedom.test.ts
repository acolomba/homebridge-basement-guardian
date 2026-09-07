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
 * Three modules in this repository already import that form, so it is the
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
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

/**
 * Every Node standard-library module that hands a caller deferred execution.
 *
 * Declared once and consumed by the real case and both negative controls, so the
 * two spellings cannot drift apart between what the gate forbids and what it was
 * shown to catch.
 */
const DEFERRED_EXECUTION_MODULES: readonly string[] = ['node:timers', 'node:timers/promises'];

// The compiled case runs from `dist-test/test/accessories`, which puts the
// repository root three levels up. The floor below is what turns a wrong count
// of levels into a named failure rather than an empty read reporting success.
const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const ACCESSORIES_DIRECTORY = join(REPOSITORY_ROOT, 'src', 'accessories');

// The accessories tier holds ten modules. A gate that enumerated fewer than
// this read the wrong directory, and every assertion built on that read would
// pass without examining a single accessory module.
const ACCESSORIES_MODULE_FLOOR = 10;

// A comment naming a module is not an import of it, and this gate's whole
// content is that something does not exist, so the detector reads the three
// spellings that actually reach a module -- `from '<specifier>'`, a side-effect
// `import '<specifier>'`, and a dynamic `import('<specifier>')` -- rather than
// the module name wherever it appears. Either quote character is accepted: a
// module that reached for deferred execution is already a module that got
// something wrong, so the gate does not also assume it obeyed the quote style.
// Neither specifier carries a regular-expression metacharacter, so each goes
// into the pattern as it is written.
function importsModule(source: string, specifier: string): boolean {
  return new RegExp(`(\\bfrom\\s+|\\bimport\\s+|\\bimport\\s*\\(\\s*)['"]${specifier}['"]`, 'u').test(source);
}

function importsDeferredExecution(source: string): boolean {
  return DEFERRED_EXECUTION_MODULES.some((specifier) => importsModule(source, specifier));
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
const DOUBLE_QUOTED_IMPORT = `
import { setTimeout } from "node:timers/promises";
`;
const SIDE_EFFECT_IMPORT = `
import 'node:timers';
`;
const DYNAMIC_PROMISES_IMPORT = `
const timers = await import('node:timers/promises');
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
  // arrange
  const modules = readdirSync(ACCESSORIES_DIRECTORY).filter((entry) => entry.endsWith('.ts'));

  // act
  const importing = modules.filter((module) => importsDeferredExecution(readFileSync(join(ACCESSORIES_DIRECTORY, module), 'utf8')));

  // assert
  assert.ok(
    modules.length >= ACCESSORIES_MODULE_FLOOR,
    `the gate enumerated ${String(modules.length)} modules under ${ACCESSORIES_DIRECTORY}, fewer than the ${String(ACCESSORIES_MODULE_FLOOR)} that tier holds`,
  );
  assert.deepStrictEqual(importing, []);
});

test('reports a planted deferred-execution import in every spelling it is meant to catch (SAFE-07)', () => {
  // act & assert
  assert.deepStrictEqual(
    {
      namedPromises: importsDeferredExecution(NAMED_PROMISES_IMPORT),
      namedBare: importsDeferredExecution(NAMED_BARE_IMPORT),
      doubleQuoted: importsDeferredExecution(DOUBLE_QUOTED_IMPORT),
      sideEffect: importsDeferredExecution(SIDE_EFFECT_IMPORT),
      dynamic: importsDeferredExecution(DYNAMIC_PROMISES_IMPORT),
    },
    { namedPromises: true, namedBare: true, doubleQuoted: true, sideEffect: true, dynamic: true },
  );
});

test('reports neither a comment naming the modules nor an unrelated node import (SAFE-07)', () => {
  // act & assert
  assert.deepStrictEqual(
    {
      comment: importsDeferredExecution(COMMENT_NAMING_THE_MODULES),
      unrelatedImport: importsDeferredExecution(UNRELATED_NODE_IMPORT),
    },
    { comment: false, unrelatedImport: false },
  );
});
