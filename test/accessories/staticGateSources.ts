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
  isIdentifier,
  isImportDeclaration,
  isMetaProperty,
  isNamedImports,
  isNoSubstitutionTemplateLiteral,
  isPropertyAccessExpression,
  isStringLiteral,
  isVariableDeclaration,
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

/** Lists fixed module specifiers loaded by imports and createRequire bindings. */
export function importSpecifiers(source: string): readonly string[] {
  const specifiers: string[] = [];
  const file = createSourceFile('staticGate.ts', source, ScriptTarget.Latest, true);
  const createRequireNames = new Set<string>();
  const requireNames = new Set<string>();

  for (const statement of file.statements) {
    if (
      isImportDeclaration(statement) &&
      isStringLiteral(statement.moduleSpecifier) &&
      ['node:module', 'module'].includes(statement.moduleSpecifier.text) &&
      statement.importClause?.namedBindings &&
      isNamedImports(statement.importClause.namedBindings)
    ) {
      for (const element of statement.importClause.namedBindings.elements) {
        if ((element.propertyName?.text ?? element.name.text) === 'createRequire') {
          createRequireNames.add(element.name.text);
        }
      }
    }
  }

  function collectRequire(node: Node): void {
    if (
      isVariableDeclaration(node) &&
      isIdentifier(node.name) &&
      node.initializer &&
      isCallExpression(node.initializer) &&
      isIdentifier(node.initializer.expression) &&
      createRequireNames.has(node.initializer.expression.text)
    ) {
      const argument = node.initializer.arguments[0];
      if (
        argument &&
        isPropertyAccessExpression(argument) &&
        argument.name.text === 'url' &&
        isMetaProperty(argument.expression) &&
        argument.expression.keywordToken === SyntaxKind.ImportKeyword &&
        argument.expression.name.text === 'meta'
      ) {
        requireNames.add(node.name.text);
      }
    }

    forEachChild(node, collectRequire);
  }

  collectRequire(file);

  function visit(node: Node): void {
    if ((isImportDeclaration(node) || isExportDeclaration(node)) && node.moduleSpecifier && isStringLiteral(node.moduleSpecifier)) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      isCallExpression(node) &&
      (node.expression.kind === SyntaxKind.ImportKeyword || (isIdentifier(node.expression) && requireNames.has(node.expression.text)))
    ) {
      const argument = node.arguments[0];
      if (argument && (isStringLiteral(argument) || isNoSubstitutionTemplateLiteral(argument))) {
        specifiers.push(argument.text);
      }
    }

    forEachChild(node, visit);
  }

  visit(file);
  return specifiers;
}
