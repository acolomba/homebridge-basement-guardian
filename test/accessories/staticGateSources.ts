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
  isAwaitExpression,
  isBinaryExpression,
  isCallExpression,
  isElementAccessExpression,
  isExportDeclaration,
  isIdentifier,
  isImportDeclaration,
  isMetaProperty,
  isNamedImports,
  isNamespaceImport,
  isNewExpression,
  isNoSubstitutionTemplateLiteral,
  isObjectBindingPattern,
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
  type Expression,
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

function isDynamicModuleNamespace(initializer: Expression, checker: TypeChecker): boolean {
  if (isParenthesizedExpression(initializer)) {
    return isDynamicModuleNamespace(initializer.expression, checker);
  }

  if (!isAwaitExpression(initializer) || !isCallExpression(initializer.expression) || initializer.expression.expression.kind !== SyntaxKind.ImportKeyword) {
    return false;
  }

  const specifier = initializer.expression.arguments[0];
  return specifier !== undefined && ['node:module', 'module'].includes(fixedSpecifier(specifier, checker) ?? '');
}

function addDestructuredCreator(node: Node, checker: TypeChecker, named: Set<Symbol>, namespaces: ReadonlySet<Symbol>): void {
  if (!isVariableDeclaration(node) || !isObjectBindingPattern(node.name) || !node.initializer) {
    return;
  }

  const initializer = node.initializer;
  const source = isIdentifier(initializer) ? checker.getSymbolAtLocation(initializer) : undefined;
  if (!(source && namespaces.has(source)) && !isDynamicModuleNamespace(initializer, checker)) {
    return;
  }

  for (const element of node.name.elements) {
    const property = element.propertyName ?? element.name;
    if ((isIdentifier(property) || isStringLiteral(property)) && property.text === 'createRequire' && isIdentifier(element.name)) {
      const symbol = checker.getSymbolAtLocation(element.name);
      if (symbol) {
        named.add(symbol);
      }
    }
  }
}

function addDestructuredCreators(file: SourceFile, checker: TypeChecker, named: Set<Symbol>, namespaces: ReadonlySet<Symbol>): void {
  function visit(node: Node): void {
    addDestructuredCreator(node, checker, named, namespaces);
    forEachChild(node, visit);
  }

  visit(file);
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

function addNamespaceAliases(file: SourceFile, checker: TypeChecker, namespaces: Set<Symbol>): void {
  const aliases: { source: Symbol; alias: Symbol }[] = [];
  function visit(node: Node): void {
    if (
      isVariableDeclaration(node) &&
      isIdentifier(node.name) &&
      node.initializer &&
      isVariableDeclarationList(node.parent) &&
      node.parent.flags & NodeFlags.Const
    ) {
      const alias = checker.getSymbolAtLocation(node.name);
      if (alias && isDynamicModuleNamespace(node.initializer, checker)) {
        namespaces.add(alias);
      } else if (alias && isIdentifier(node.initializer)) {
        const source = checker.getSymbolAtLocation(node.initializer);
        if (source) {
          aliases.push({ source, alias });
        }
      }
    }

    forEachChild(node, visit);
  }

  visit(file);
  let added = true;
  while (added) {
    added = false;
    for (const { source, alias } of aliases) {
      if (namespaces.has(source) && !namespaces.has(alias)) {
        namespaces.add(alias);
        added = true;
      }
    }
  }
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

  addNamespaceAliases(file, checker, namespaces);
  addDestructuredCreators(file, checker, named, namespaces);
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
    (isIdentifier(callee.expression) || isDynamicModuleNamespace(callee.expression, checker))
  ) {
    if (isDynamicModuleNamespace(callee.expression, checker)) {
      return true;
    }

    const symbol = checker.getSymbolAtLocation(callee.expression);
    return symbol !== undefined && namespaces.has(symbol);
  }

  return false;
}

function isImportMetaUrl(node: Node): boolean {
  return (
    isPropertyAccessExpression(node) &&
    node.name.text === 'url' &&
    isMetaProperty(node.expression) &&
    node.expression.keywordToken === SyntaxKind.ImportKeyword &&
    node.expression.name.text === 'meta'
  );
}

function requireBase(call: CallExpression, checker: TypeChecker): string | undefined {
  const argument = call.arguments[0];
  if (argument && isImportMetaUrl(argument)) {
    return '';
  }

  if (argument && isNewExpression(argument) && isIdentifier(argument.expression) && argument.expression.text === 'URL') {
    const [pathname, parent] = argument.arguments ?? [];
    const fixed = pathname ? fixedSpecifier(pathname, checker) : undefined;
    if (fixed?.startsWith('.') && parent && isImportMetaUrl(parent)) {
      return fixed;
    }
  }

  return undefined;
}

function requireBinding(
  node: Node,
  checker: TypeChecker,
  named: ReadonlySet<Symbol>,
  namespaces: ReadonlySet<Symbol>,
): { symbol: Symbol; base: string | undefined } | undefined {
  if (!isVariableDeclaration(node) || !isIdentifier(node.name) || !node.initializer || !isCallExpression(node.initializer)) {
    return undefined;
  }

  if (!callsImportedCreator(node.initializer, checker, named, namespaces)) {
    return undefined;
  }

  const symbol = checker.getSymbolAtLocation(node.name);
  return symbol ? { symbol, base: requireBase(node.initializer, checker) } : undefined;
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

function loadBase(
  call: CallExpression,
  checker: TypeChecker,
  named: ReadonlySet<Symbol>,
  namespaces: ReadonlySet<Symbol>,
  requireBases: ReadonlyMap<Symbol, string | undefined>,
): { base: string | undefined } | undefined {
  const callee = call.expression;
  if (callee.kind === SyntaxKind.ImportKeyword) {
    return { base: '' };
  }

  if (isCallExpression(callee) && callsImportedCreator(callee, checker, named, namespaces)) {
    return { base: requireBase(callee, checker) };
  }

  const symbol = isIdentifier(callee) ? checker.getSymbolAtLocation(callee) : undefined;
  return symbol && requireBases.has(symbol) ? { base: requireBases.get(symbol) } : undefined;
}

function collectModuleLoads(source: string, resolveBases: boolean): readonly { specifier: string; base: string }[] {
  const loads: { specifier: string; base: string }[] = [];
  const file = createSourceFile('staticGate.ts', source, ScriptTarget.Latest, true);
  // Local symbols distinguish a loader from a parameter with the same name.
  const options = { noLib: true, noResolve: true };
  const host = createCompilerHost(options);
  host.getSourceFile = (fileName) => (fileName === file.fileName ? file : undefined);
  const checker = createProgram([file.fileName], options, host).getTypeChecker();
  const { named, namespaces } = importedCreators(file, checker);
  const requireBases = new Map<Symbol, string | undefined>();
  const requireAliases: { source: Symbol; alias: Symbol }[] = [];

  function collectRequire(node: Node): void {
    const binding = requireBinding(node, checker, named, namespaces);
    if (binding) {
      requireBases.set(binding.symbol, binding.base);
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
      const base = requireBases.get(source);
      if (requireBases.has(source) && !requireBases.has(alias)) {
        requireBases.set(alias, base);
        added = true;
      }
    }
  }

  function recordLoad(node: CallExpression): void {
    const load = loadBase(node, checker, named, namespaces, requireBases);
    if (!load) {
      return;
    }

    const argument = node.arguments[0];
    const specifier = argument ? fixedSpecifier(argument, checker) : undefined;
    if (specifier === undefined) {
      const dynamicImport = node.expression.kind === SyntaxKind.ImportKeyword;
      throw new Error(`cannot resolve module specifier in ${dynamicImport ? 'dynamic import' : 'createRequire load'}`);
    }

    if (load.base === undefined && resolveBases) {
      throw new Error('cannot resolve base in createRequire load');
    }

    loads.push({ specifier, base: load.base ?? '' });
  }

  function visit(node: Node): void {
    if ((isImportDeclaration(node) || isExportDeclaration(node)) && node.moduleSpecifier && isStringLiteral(node.moduleSpecifier)) {
      loads.push({ specifier: node.moduleSpecifier.text, base: '' });
    }

    if (isCallExpression(node)) {
      recordLoad(node);
    }

    forEachChild(node, visit);
  }

  visit(file);
  return loads;
}

/** Lists fixed module loads with their bases and rejects unresolved dynamic loads. */
export function moduleLoads(source: string): readonly { specifier: string; base: string }[] {
  return collectModuleLoads(source, true);
}

/** Lists fixed module specifiers and rejects unresolved dynamic loads. */
export function importSpecifiers(source: string): readonly string[] {
  return collectModuleLoads(source, false).map((load) => load.specifier);
}
