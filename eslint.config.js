// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Configures lint checks and platform composition boundaries.
 */

import { resolve } from 'node:path';

import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import importX from 'eslint-plugin-import-x';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import ts from 'typescript';
import tseslint from 'typescript-eslint';

// These rules protect composition boundaries using the installed compiler's bindings. A spelling
// in a comment, an unrelated declaration, or a reordered object cannot change their answers.
function resolvedSymbol(checker, node) {
  const symbol = checker.getSymbolAtLocation(node);

  return symbol && (symbol.flags & ts.SymbolFlags.Alias) !== 0 ? checker.getAliasedSymbol(symbol) : symbol;
}

function moduleExport(program, checker, path, name) {
  const source = program.getSourceFile(resolve(import.meta.dirname, path));
  const module = source && checker.getSymbolAtLocation(source);
  const symbol = module && checker.getExportsOfModule(module).find((candidate) => candidate.name === name);

  if (!symbol) {
    throw new Error(`The platform wiring rules require ${path}'s ${name} export in the TypeScript project.`);
  }

  return symbol;
}

function typedServices(context) {
  const services = context.sourceCode.parserServices;

  if (!services.program || !services.esTreeNodeToTSNodeMap) {
    throw new Error('The platform wiring rules require the configured TypeScript project.');
  }

  return services;
}

function enclosingBuilder(checker, node) {
  for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
    if (ts.isFunctionDeclaration(ancestor)) {
      return ancestor.name && resolvedSymbol(checker, ancestor.name);
    }

    if (ts.isArrowFunction(ancestor) || ts.isFunctionExpression(ancestor)) {
      return ts.isVariableDeclaration(ancestor.parent) ? resolvedSymbol(checker, ancestor.parent.name) : undefined;
    }
  }

  return undefined;
}

function callbackUsesBuilder(checker, property, builder, consumer) {
  let calls = 0;
  let shared = false;
  const visit = (node) => {
    if (ts.isCallExpression(node) && resolvedSymbol(checker, node.expression) === consumer) {
      calls++;
      const argument = node.arguments[0];

      shared = argument !== undefined && ts.isCallExpression(argument) && resolvedSymbol(checker, argument.expression) === builder;
    }

    ts.forEachChild(node, visit);
  };

  visit(property);

  return calls === 1 && shared;
}

/** @type {import('eslint').ESLint.Plugin} */
const platformWiring = {
  rules: {
    'shared-discovery-context': {
      meta: {
        type: 'problem',
        schema: [],
        messages: {
          construction: 'Build DiscoveryContext once; found {{count}} constructions.',
          callbacks: 'Pass the shared DiscoveryContext builder to all three runtime callbacks.',
        },
      },
      create(context) {
        const services = typedServices(context);
        const checker = services.program.getTypeChecker();
        const contextSymbol = moduleExport(services.program, checker, 'src/platform.ts', 'DiscoveryContext');
        const contextType = checker.getDeclaredTypeOfSymbol(contextSymbol);
        const factory = moduleExport(services.program, checker, 'src/runtime/accountRuntime.ts', 'createAccountRuntimeFromConfig');
        const callbacks = new Map([
          ['onTrustworthyInventory', moduleExport(services.program, checker, 'src/platform.ts', 'registerDiscoveredDevices')],
          ['onMonitoringHealth', moduleExport(services.program, checker, 'src/platform.ts', 'applyMonitoringHealth')],
          ['onDeviceRemoved', moduleExport(services.program, checker, 'src/platform.ts', 'removeDiscoveredDevice')],
        ]);
        const constructions = [];
        const options = [];

        return {
          ObjectExpression(node) {
            const typed = services.esTreeNodeToTSNodeMap.get(node);

            if (checker.isTypeAssignableTo(checker.getTypeAtLocation(typed), contextType)) {
              constructions.push(typed);
            }

            if (ts.isCallExpression(typed.parent) && resolvedSymbol(checker, typed.parent.expression) === factory) {
              options.push(typed);
            }
          },
          'Program:exit'(node) {
            if (constructions.length !== 1) {
              context.report({ node, messageId: 'construction', data: { count: constructions.length } });

              return;
            }

            const builder = enclosingBuilder(checker, constructions[0]);
            const shared =
              builder &&
              options.length === 1 &&
              [...callbacks].every(([name, consumer]) => {
                const property = options[0].properties.find((candidate) => candidate.name && checker.getSymbolAtLocation(candidate.name)?.name === name);

                return property && callbackUsesBuilder(checker, property, builder, consumer);
              });

            if (!shared) {
              context.report({ node, messageId: 'callbacks' });
            }
          },
        };
      },
    },
    'system-timers-scope': {
      meta: {
        type: 'problem',
        schema: [],
        messages: { scope: 'Inject Timers here; systemTimers belongs only in src/platform.ts and src/runtime/timers.ts.' },
      },
      create(context) {
        if (['src/platform.ts', 'src/runtime/timers.ts'].some((path) => resolve(import.meta.dirname, path) === context.filename)) {
          return {};
        }

        const services = typedServices(context);
        const checker = services.program.getTypeChecker();
        const concreteTimers = moduleExport(services.program, checker, 'src/runtime/timers.ts', 'systemTimers');

        return {
          Identifier(node) {
            const typed = services.esTreeNodeToTSNodeMap.get(node);

            if (ts.isImportSpecifier(typed.parent) && typed !== typed.parent.name) {
              return;
            }

            const symbol = ts.isShorthandPropertyAssignment(typed.parent)
              ? checker.getShorthandAssignmentValueSymbol(typed.parent)
              : resolvedSymbol(checker, typed);

            if (symbol === concreteTimers) {
              context.report({ node, messageId: 'scope' });
            }
          },
        };
      },
    },
  },
};

export default tseslint.config(
  {
    ignores: [
      '.agents/**',
      '.claude/**',
      '.codex/**',
      '.opencode/**',
      '.pi/**',
      '.planning/**',
      '.worktrees/**',
      'build/**',
      'coverage/**',
      'dist/**',
      'dist-test/**',
      'docs/research/**',
      'node_modules/**',
      'tmp/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ['**/*.{js,mjs,ts}'],
    plugins: {
      '@stylistic': stylistic,
      'import-x': importX,
      sonarjs,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      quotes: ['error', 'single'],
      indent: ['error', 2, { SwitchCase: 0 }],
      'linebreak-style': ['error', 'unix'],
      semi: ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'dot-notation': 'error',
      eqeqeq: ['error', 'smart'],
      curly: ['error', 'all'],
      'brace-style': ['error'],
      'prefer-arrow-callback': 'warn',
      'max-len': ['warn', 160],
      'object-curly-spacing': ['error', 'always'],
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': ['error', { classes: false, enums: false }],
      '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none' }],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      '@stylistic/padding-line-between-statements': ['error', { blankLine: 'always', prev: 'block-like', next: '*' }],
      'no-console': 'warn',
      'prefer-object-has-own': 'error',
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-inverted-boolean-check': 'error',
      'sonarjs/no-nested-conditional': 'error',
      'sonarjs/no-nested-template-literals': 'error',
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.test.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['src/**/*.ts'],
    plugins: { 'platform-wiring': platformWiring },
    rules: { 'platform-wiring/system-timers-scope': 'error' },
  },
  {
    files: ['src/platform.ts'],
    rules: { 'platform-wiring/shared-discovery-context': 'error' },
  },
  {
    // SonarCloud analyzes src/ alone: sonar.test.exclusions drops test/ and
    // features/, so the full Sonar ruleset is scoped here to match what the
    // server actually reports. The shared block above keeps its own smaller
    // sonarjs selection repo-wide.
    //
    // Only the rules are spread: the shared block already registers the sonarjs
    // plugin, and ESLint 10 rejects a second registration of the same name.
    files: ['src/**/*.ts'],
    plugins: {
      unicorn,
    },
    rules: {
      ...sonarjs.configs.recommended.rules,
      // Sonar imports these four from the unicorn ruleset; eslint-plugin-sonarjs
      // ships no equivalent, so they come straight from the source plugin.
      'unicorn/consistent-function-scoping': 'error', // typescript:S7721
      'unicorn/no-object-as-default-parameter': 'error', // typescript:S7737
      'unicorn/no-anonymous-default-export': 'error', // typescript:S7726
      'unicorn/prefer-string-raw': 'error', // typescript:S7780
    },
  },
  {
    // The unit runner's test() returns a promise at every call site, which
    // strictTypeChecked reports as a floating promise under --max-warnings=0.
    // The exemption names the unit tree alone: the cucumber harness starts
    // servers, brokers, and clients, so a promise it abandons is a real defect.
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
  {
    files: ['**/*.{js,mjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // The local Homebridge harness is a developer CLI; printing is its purpose.
    files: ['dev/**/*.mjs'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  {
    files: ['eslint.config.js'],
    ...tseslint.configs.disableTypeChecked,
  },
);
