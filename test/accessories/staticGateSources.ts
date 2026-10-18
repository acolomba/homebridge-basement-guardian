// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Lists repository-relative TypeScript paths for accessory static gates.
 */

import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createSourceFile,
  forEachChild,
  isCallExpression,
  isExportDeclaration,
  isImportDeclaration,
  isStringLiteral,
  ScriptTarget,
  SyntaxKind,
  type Node,
} from 'typescript';

const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/** Lists TypeScript files below a repository-relative directory. */
export function typeScriptFilesUnder(relativeDirectory: string): readonly string[] {
  return readdirSync(join(REPOSITORY_ROOT, relativeDirectory), { withFileTypes: true }).flatMap((entry) => {
    const path = `${relativeDirectory}/${entry.name}`;

    if (entry.isDirectory()) {
      return typeScriptFilesUnder(path);
    }

    return entry.name.endsWith('.ts') ? [path] : [];
  });
}

/** Lists literal module specifiers in static imports, re-exports and dynamic imports. */
export function importSpecifiers(source: string): readonly string[] {
  const specifiers: string[] = [];
  const file = createSourceFile('staticGate.ts', source, ScriptTarget.Latest, true);

  function visit(node: Node): void {
    if ((isImportDeclaration(node) || isExportDeclaration(node)) && node.moduleSpecifier && isStringLiteral(node.moduleSpecifier)) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (isCallExpression(node) && node.expression.kind === SyntaxKind.ImportKeyword) {
      const argument = node.arguments[0];
      if (argument && isStringLiteral(argument)) {
        specifiers.push(argument.text);
      }
    }

    forEachChild(node, visit);
  }

  visit(file);
  return specifiers;
}
