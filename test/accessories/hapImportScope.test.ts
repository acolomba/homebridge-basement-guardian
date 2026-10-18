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
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { createPrinter, createSourceFile, ScriptTarget } from 'typescript';

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

// The three directories hold 133 TypeScript files. A gate that enumerated
// fewer than this read the wrong tree, and the single-importer assertion built on that
// read would pass without examining a single file.
const SOURCE_FILE_FLOOR = 133;

/** Accessory modules checked for direct HAP error, setter and UUID calls. */
const ACCESSORY_MODULES: readonly string[] = ['basementGuardian.ts', 'customCharacteristics.ts', 'customServices.ts', 'serviceCatalogue.ts'];

/** The three modules that must never construct an errored characteristic. */
const MODULES_ERRORING_NO_CHARACTERISTIC: readonly string[] = ['basementGuardian.ts', 'customCharacteristics.ts', 'customServices.ts'];

const ERRORED_CHARACTERISTIC = 'HapStatusError';

// A comment naming a package is not an import of it, and this gate's own overview names
// the package repeatedly, so the detector reads the three spellings that actually reach a
// module -- `from '<specifier>'`, a side-effect `import '<specifier>'`, and a dynamic
// `import('<specifier>')` -- rather than the package name wherever it appears. Either
// quote character is accepted: a file that reached for the real package is already a file
// that got something wrong, so the gate does not also assume it obeyed the quote style.
// The specifier carries no regular-expression metacharacter, so it goes into the pattern
// as it is written.
function importsModule(source: string, specifier: string): boolean {
  return new RegExp(`(\\bfrom\\s+|\\bimport\\s+|\\bimport\\s*\\(\\s*)['"]${specifier}['"]`, 'u').test(source);
}

function importsHapPackage(source: string): boolean {
  return importsModule(source, HAP_PACKAGE_SPECIFIER);
}

// Repository-relative and POSIX-separated, because that path is what the failing
// assertion prints: a gate that reports `true` names nothing an author can open.
function typeScriptFilesUnder(relativeDirectory: string): readonly string[] {
  return readdirSync(join(REPOSITORY_ROOT, relativeDirectory), { withFileTypes: true }).flatMap((entry) => {
    const path = `${relativeDirectory}/${entry.name}`;

    if (entry.isDirectory()) {
      return typeScriptFilesUnder(path);
    }

    return entry.name.endsWith('.ts') ? [path] : [];
  });
}

// Module overviews explain forbidden idioms, so the HAP source checks inspect code without comments.
function codeOf(source: string): string {
  return createPrinter({ removeComments: true }).printFile(createSourceFile('accessory.ts', source, ScriptTarget.Latest, true));
}

function accessoryCodeOf(module: string): string {
  return codeOf(readFileSync(join(REPOSITORY_ROOT, 'src', 'accessories', module), 'utf8'));
}

function occurrences(code: string, needle: string): number {
  return code.split(needle).length - 1;
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
const DOUBLE_QUOTED_DYNAMIC_IMPORT = `
const hap = await import("${HAP_PACKAGE_SPECIFIER}");
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
    doubleQuotedDynamic: importsHapPackage(DOUBLE_QUOTED_DYNAMIC_IMPORT),
  };

  // assert
  assert.deepStrictEqual(imports, {
    named: true,
    doubleQuotedNamed: true,
    typeOnly: true,
    sideEffect: true,
    doubleQuotedSideEffect: true,
    dynamic: true,
    doubleQuotedDynamic: true,
  });
});

test('reports neither a comment naming the package nor an unrelated import (D-17)', () => {
  // act
  const imports = { comment: importsHapPackage(COMMENT_NAMING_THE_PACKAGE), unrelatedImport: importsHapPackage(UNRELATED_IMPORT) };

  // assert
  assert.deepStrictEqual(imports, { comment: false, unrelatedImport: false });
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

for (const module of MODULES_ERRORING_NO_CHARACTERISTIC) {
  test(`${module} signals no untrusted scope through an errored characteristic`, () => {
    // act
    const code = accessoryCodeOf(module);

    // assert
    assert.strictEqual(occurrences(code, ERRORED_CHARACTERISTIC), 0);
  });
}

// D-10 permits one persistent failure. Pin both the file count and the call's function location.
test('serviceCatalogue.ts names an errored characteristic once, inside publishPersistentFailure', () => {
  // act
  const code = accessoryCodeOf('serviceCatalogue.ts');
  const persistentFailure = /export function publishPersistentFailure\b[\s\S]*?\n\}/.exec(code)?.[0] ?? '';

  // assert
  assert.deepStrictEqual(
    { file: occurrences(code, ERRORED_CHARACTERISTIC), insidePublishPersistentFailure: occurrences(persistentFailure, ERRORED_CHARACTERISTIC) },
    { file: 1, insidePublishPersistentFailure: 1 },
  );
});

for (const module of ACCESSORY_MODULES) {
  // Switch `On` writes use the control binder. No accessory module registers a direct set handler.
  test(`${module} has no direct onSet or set-event registration`, () => {
    // act
    const code = accessoryCodeOf(module);

    // assert
    assert.deepStrictEqual({ onSet: code.includes('onSet'), setEvent: /\.on\(\s*['"`]set/i.test(code) }, { onSet: false, setEvent: false });
  });

  test(`${module} contains no direct HAP UUID generation call`, () => {
    // act
    const code = accessoryCodeOf(module);

    // assert
    assert.deepStrictEqual(
      {
        memberCall: /\buuid\s*\.\s*generate\s*\(/u.test(code),
        destructuredCall: /\{\s*generate\s*\}\s*=\s*[\w.]+\.uuid\b/u.test(code),
      },
      { memberCall: false, destructuredCall: false },
    );
  });
}
