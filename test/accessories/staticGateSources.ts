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
  createCompilerHost,
  createProgram,
  createSourceFile,
  forEachChild,
  isBinaryExpression,
  isCallExpression,
  isElementAccessExpression,
  isExportDeclaration,
  isIdentifier,
  isImportDeclaration,
  isNamedImports,
  isNamespaceImport,
  isNoSubstitutionTemplateLiteral,
  isParenthesizedExpression,
  isPropertyAccessExpression,
  isStringLiteral,
  isTemplateExpression,
  isVariableDeclaration,
  isVariableDeclarationList,
  NodeFlags,
  ScriptTarget,
  SyntaxKind,
  type CallExpression,
  type ImportDeclaration,
  type ImportSpecifier,
  type Node,
  type SourceFile,
  type Symbol,
  type TemplateExpression,
  type TypeChecker,
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

function addNamedCreator(element: ImportSpecifier, checker: TypeChecker, named: Set<Symbol>): void {
  if ((element.propertyName?.text ?? element.name.text) !== 'createRequire') {
    return;
  }

  const symbol = checker.getSymbolAtLocation(element.name);
  if (symbol) {
    named.add(symbol);
  }
}

function addCreatorAliases(file: SourceFile, checker: TypeChecker, named: Set<Symbol>): void {
  function visit(node: Node): void {
    if (isVariableDeclaration(node) && isIdentifier(node.name) && node.initializer && isIdentifier(node.initializer)) {
      const source = checker.getSymbolAtLocation(node.initializer);
      const alias = checker.getSymbolAtLocation(node.name);
      if (source && alias && named.has(source)) {
        named.add(alias);
      }
    }

    forEachChild(node, visit);
  }

  visit(file);
}

function addDefaultCreator(statement: ImportDeclaration, checker: TypeChecker, namespaces: Set<Symbol>): void {
  const defaultName = statement.importClause?.name;
  const symbol = defaultName ? checker.getSymbolAtLocation(defaultName) : undefined;
  if (symbol) {
    namespaces.add(symbol);
  }
}

function importedCreators(file: SourceFile, checker: TypeChecker): { named: Set<Symbol>; namespaces: Set<Symbol> } {
  const named = new Set<Symbol>();
  const namespaces = new Set<Symbol>();
  for (const statement of file.statements) {
    if (!isImportDeclaration(statement) || !isStringLiteral(statement.moduleSpecifier) || !['node:module', 'module'].includes(statement.moduleSpecifier.text)) {
      continue;
    }

    addDefaultCreator(statement, checker, namespaces);

    const bindings = statement.importClause?.namedBindings;
    if (bindings && isNamespaceImport(bindings)) {
      const symbol = checker.getSymbolAtLocation(bindings.name);
      if (symbol) {
        namespaces.add(symbol);
      }

      continue;
    }

    if (!bindings || !isNamedImports(bindings)) {
      continue;
    }

    for (const element of bindings.elements) {
      addNamedCreator(element, checker, named);
    }
  }

  addCreatorAliases(file, checker, named);
  return { named, namespaces };
}

function callsImportedCreator(call: CallExpression, checker: TypeChecker, named: ReadonlySet<Symbol>, namespaces: ReadonlySet<Symbol>): boolean {
  const callee = call.expression;
  if (isIdentifier(callee)) {
    const symbol = checker.getSymbolAtLocation(callee);
    return symbol !== undefined && named.has(symbol);
  }

  if (
    ((isPropertyAccessExpression(callee) && callee.name.text === 'createRequire') ||
      (isElementAccessExpression(callee) &&
        (isStringLiteral(callee.argumentExpression) || isNoSubstitutionTemplateLiteral(callee.argumentExpression)) &&
        callee.argumentExpression.text === 'createRequire')) &&
    isIdentifier(callee.expression)
  ) {
    const symbol = checker.getSymbolAtLocation(callee.expression);
    return symbol !== undefined && namespaces.has(symbol);
  }

  return false;
}

function requireBinding(node: Node, checker: TypeChecker, named: ReadonlySet<Symbol>, namespaces: ReadonlySet<Symbol>): Symbol | undefined {
  if (!isVariableDeclaration(node) || !isIdentifier(node.name) || !node.initializer || !isCallExpression(node.initializer)) {
    return undefined;
  }

  if (!callsImportedCreator(node.initializer, checker, named, namespaces)) {
    return undefined;
  }

  return checker.getSymbolAtLocation(node.name);
}

function fixedSpecifier(node: Node, checker: TypeChecker, seen: Set<Symbol> = new Set<Symbol>()): string | undefined {
  if (isStringLiteral(node) || isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (isParenthesizedExpression(node)) {
    return fixedSpecifier(node.expression, checker, seen);
  }

  if (isBinaryExpression(node) && node.operatorToken.kind === SyntaxKind.PlusToken) {
    const left = fixedSpecifier(node.left, checker, new Set(seen));
    const right = fixedSpecifier(node.right, checker, new Set(seen));
    return left !== undefined && right !== undefined ? left + right : undefined;
  }

  if (isTemplateExpression(node)) {
    return fixedTemplateSpecifier(node, checker, seen);
  }

  if (!isIdentifier(node)) {
    return undefined;
  }

  const symbol = checker.getSymbolAtLocation(node);
  if (!symbol || seen.has(symbol)) {
    return undefined;
  }

  const declaration = symbol.declarations?.find(isVariableDeclaration);
  if (!declaration?.initializer || !isVariableDeclarationList(declaration.parent) || !(declaration.parent.flags & NodeFlags.Const)) {
    return undefined;
  }

  seen.add(symbol);
  return fixedSpecifier(declaration.initializer, checker, seen);
}

function fixedTemplateSpecifier(node: TemplateExpression, checker: TypeChecker, seen: Set<Symbol>): string | undefined {
  let specifier = node.head.text;
  for (const span of node.templateSpans) {
    const part = fixedSpecifier(span.expression, checker, new Set(seen));
    if (part === undefined) {
      return undefined;
    }

    specifier += part + span.literal.text;
  }

  return specifier;
}

/** Lists fixed module specifiers and rejects unresolved dynamic loads. */
export function importSpecifiers(source: string): readonly string[] {
  const specifiers: string[] = [];
  const file = createSourceFile('staticGate.ts', source, ScriptTarget.Latest, true);
  // Local symbols distinguish a loader from a parameter with the same name.
  const options = { noLib: true, noResolve: true };
  const host = createCompilerHost(options);
  host.getSourceFile = (fileName) => (fileName === file.fileName ? file : undefined);
  const checker = createProgram([file.fileName], options, host).getTypeChecker();
  const { named, namespaces } = importedCreators(file, checker);
  const requireSymbols = new Set<Symbol>();
  const requireAliases: { source: Symbol; alias: Symbol }[] = [];

  function collectRequire(node: Node): void {
    const symbol = requireBinding(node, checker, named, namespaces);
    if (symbol) {
      requireSymbols.add(symbol);
    }

    if (isVariableDeclaration(node) && isIdentifier(node.name) && node.initializer && isIdentifier(node.initializer)) {
      const source = checker.getSymbolAtLocation(node.initializer);
      const alias = checker.getSymbolAtLocation(node.name);
      if (source && alias) {
        requireAliases.push({ source, alias });
      }
    }

    forEachChild(node, collectRequire);
  }

  collectRequire(file);
  let added = true;
  while (added) {
    added = false;
    for (const { source, alias } of requireAliases) {
      if (requireSymbols.has(source) && !requireSymbols.has(alias)) {
        requireSymbols.add(alias);
        added = true;
      }
    }
  }

  function recordLoad(node: CallExpression): void {
    const callee = node.expression;
    const symbol = isIdentifier(callee) ? checker.getSymbolAtLocation(callee) : undefined;
    const dynamicImport = callee.kind === SyntaxKind.ImportKeyword;
    if (!dynamicImport && !(symbol && requireSymbols.has(symbol))) {
      return;
    }

    const argument = node.arguments[0];
    const specifier = argument ? fixedSpecifier(argument, checker) : undefined;
    if (specifier === undefined) {
      throw new Error(`cannot resolve module specifier in ${dynamicImport ? 'dynamic import' : 'createRequire load'}`);
    }

    specifiers.push(specifier);
  }

  function visit(node: Node): void {
    if ((isImportDeclaration(node) || isExportDeclaration(node)) && node.moduleSpecifier && isStringLiteral(node.moduleSpecifier)) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (isCallExpression(node)) {
      recordLoad(node);
    }

    forEachChild(node, visit);
  }

  visit(file);
  return specifiers;
}
