// SPDX-License-Identifier: MIT

/**
 * Copyright (c) 2026 Alessandro Colomba
 */

/**
 * @fileoverview Tests the configured ESLint platform composition boundaries with typed controls.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import { ESLint } from 'eslint';
import ts from 'typescript';

import type { Linter } from 'eslint';

const ROOT = resolve(import.meta.dirname, '../../..');
const PLATFORM = 'src/platform.ts';
const TIMERS = 'src/runtime/timers.ts';
const OTHER_MODULE = 'src/config.ts';
const CONTEXT_RULE = 'platform-wiring/shared-discovery-context';
const TIMER_RULE = 'platform-wiring/system-timers-scope';

interface WiringResult {
  diagnostics: readonly string[];
  enabled: readonly string[];
  messages: readonly WiringMessage[];
}

interface WiringMessage {
  ruleId: string | null;
  messageId: string | undefined;
}

// A virtual source replaces the same file in both the compiler and ESLint. Preserve Node's module
// metadata so an import.meta or ESM setup error cannot masquerade as a rejected architecture control.
function programFor(filePath: string, source: string): ts.Program {
  const configPath = resolve(ROOT, 'tsconfig.test.json');
  const config = ts.readConfigFile(configPath, (path) => ts.sys.readFile(path));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, ROOT);
  const host = ts.createCompilerHost(parsed.options);
  const getSourceFile: ts.CompilerHost['getSourceFile'] = host.getSourceFile.bind(host);
  host.getSourceFile = (path, languageVersion, onError, shouldCreateNewSourceFile) => {
    const original = getSourceFile(path, languageVersion, onError, shouldCreateNewSourceFile);

    if (resolve(path) !== filePath || original === undefined) {
      return original;
    }

    const virtual = ts.createSourceFile(path, source, languageVersion, true);

    if (original.impliedNodeFormat !== undefined) {
      virtual.impliedNodeFormat = original.impliedNodeFormat;
    }

    return virtual;
  };

  return ts.createProgram(parsed.fileNames, parsed.options, host);
}

async function lintWiring(path: string, source: string): Promise<WiringResult> {
  const filePath = resolve(ROOT, path);
  const program = programFor(filePath, source);
  const eslint = new ESLint({ cwd: ROOT });
  // ESLint's public API types this result as any. Its documented flat configuration is the boundary
  // type; the test still uses the actual file's plugins, parser and enabled rule values.
  const configured = (await eslint.calculateConfigForFile(filePath)) as Linter.Config;
  const rules: Linter.RulesRecord = Object.fromEntries(
    Object.entries(configured.rules ?? {}).map(([name, value]) => [name, name.startsWith('platform-wiring/') ? (value ?? 'off') : 'off']),
  );
  const focused = new ESLint({
    cwd: ROOT,
    overrideConfig: { languageOptions: { parserOptions: { programs: [program], project: false } }, rules },
  });
  const results = await focused.lintText(source, { filePath });

  return {
    diagnostics: ts.getPreEmitDiagnostics(program).map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
    enabled: Object.keys(rules)
      .filter((name) => name.startsWith('platform-wiring/'))
      .sort(),
    messages: results.flatMap((result) => result.messages.map(({ ruleId, messageId }) => ({ ruleId, messageId }))),
  };
}

function secondContext(properties: string): string {
  return `
function additionalContext(context: DiscoveryContext): DiscoveryContext {
  return { ${properties} };
}
void additionalContext;
`;
}

// This changes a public callback's argument without adding another context literal. A rule that
// merely counts typed objects would miss the loss of the shared builder at this call site.
function bypassMonitoringBuilder(source: string): string {
  const file = ts.createSourceFile(PLATFORM, source, ts.ScriptTarget.Latest, true);
  let argument: ts.Expression | undefined;
  const visit: (node: ts.Node) => void = (node): void => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'applyMonitoringHealth') {
      argument = node.arguments[0];
    }

    ts.forEachChild(node, visit);
  };

  visit(file);

  if (argument === undefined) {
    throw new Error('The platform must wire the public monitoring callback.');
  }

  return source.slice(0, argument.getStart(file)) + `Object.assign({}, ${argument.getText(file)})` + source.slice(argument.end);
}

test('accepts the shared builder in all three callbacks and concrete timers in the platform', async () => {
  // arrange
  const source = readFileSync(resolve(ROOT, PLATFORM), 'utf8');

  // act
  const wiringDiagnostics = await lintWiring(PLATFORM, source);

  // assert
  assert.deepStrictEqual(wiringDiagnostics, { diagnostics: [], enabled: [CONTEXT_RULE, TIMER_RULE], messages: [] });
});

for (const { order, properties } of [
  {
    order: 'original',
    properties: `api: context.api, accessories: context.accessories, basementGuardianAccessories: context.basementGuardianAccessories,
      registry: context.registry, log: context.log, ignoredFaults: context.ignoredFaults,
      offlineConfirmationPollCount: context.offlineConfirmationPollCount, timers: context.timers, commands: context.commands`,
  },
  {
    order: 'reordered',
    properties: `commands: context.commands, timers: context.timers, offlineConfirmationPollCount: context.offlineConfirmationPollCount,
      ignoredFaults: context.ignoredFaults, log: context.log, registry: context.registry,
      basementGuardianAccessories: context.basementGuardianAccessories, accessories: context.accessories, api: context.api`,
  },
]) {
  test(`rejects a second context with ${order} properties`, async () => {
    // arrange
    const source = readFileSync(resolve(ROOT, PLATFORM), 'utf8') + secondContext(properties);

    // act
    const wiringDiagnostics = await lintWiring(PLATFORM, source);

    // assert
    assert.deepStrictEqual(wiringDiagnostics, {
      diagnostics: [],
      enabled: [CONTEXT_RULE, TIMER_RULE],
      messages: [{ ruleId: CONTEXT_RULE, messageId: 'construction' }],
    });
  });
}

test('accepts an unrelated context property read and declaration', async () => {
  // arrange
  const source =
    readFileSync(resolve(ROOT, PLATFORM), 'utf8') +
    `
function readContext(context: DiscoveryContext): unknown {
  return context.basementGuardianAccessories.get('unrelated');
}
interface Unrelated { basementGuardianAccessories: unknown; }
void readContext;
void ({} as Unrelated);
`;

  // act
  const wiringDiagnostics = await lintWiring(PLATFORM, source);

  // assert
  assert.deepStrictEqual(wiringDiagnostics, { diagnostics: [], enabled: [CONTEXT_RULE, TIMER_RULE], messages: [] });
});

test('rejects a callback that bypasses the shared builder', async () => {
  // arrange
  const source = bypassMonitoringBuilder(readFileSync(resolve(ROOT, PLATFORM), 'utf8'));

  // act
  const wiringDiagnostics = await lintWiring(PLATFORM, source);

  // assert
  assert.deepStrictEqual(wiringDiagnostics, {
    diagnostics: [],
    enabled: [CONTEXT_RULE, TIMER_RULE],
    messages: [{ ruleId: CONTEXT_RULE, messageId: 'callbacks' }],
  });
});

test('accepts concrete timers in their own module', async () => {
  // arrange
  const source = readFileSync(resolve(ROOT, TIMERS), 'utf8');

  // act
  const wiringDiagnostics = await lintWiring(TIMERS, source);

  // assert
  assert.deepStrictEqual(wiringDiagnostics, { diagnostics: [], enabled: [TIMER_RULE], messages: [] });
});

test('rejects an actual timer import and its aliased reference elsewhere', async () => {
  // arrange
  const source =
    readFileSync(resolve(ROOT, OTHER_MODULE), 'utf8') +
    `
import { systemTimers as concreteTimers } from './runtime/timers.js';
void concreteTimers;
`;

  // act
  const wiringDiagnostics = await lintWiring(OTHER_MODULE, source);

  // assert
  assert.deepStrictEqual(wiringDiagnostics, {
    diagnostics: [],
    enabled: [TIMER_RULE],
    messages: [
      { ruleId: TIMER_RULE, messageId: 'scope' },
      { ruleId: TIMER_RULE, messageId: 'scope' },
    ],
  });
});

test('rejects an actual timer reference through a namespace import', async () => {
  // arrange
  const source =
    readFileSync(resolve(ROOT, OTHER_MODULE), 'utf8') +
    `
import * as runtimeTimers from './runtime/timers.js';
void runtimeTimers.systemTimers;
`;

  // act
  const wiringDiagnostics = await lintWiring(OTHER_MODULE, source);

  // assert
  assert.deepStrictEqual(wiringDiagnostics, {
    diagnostics: [],
    enabled: [TIMER_RULE],
    messages: [{ ruleId: TIMER_RULE, messageId: 'scope' }],
  });
});

test('accepts an unrelated binding named systemTimers', async () => {
  // arrange
  const source = readFileSync(resolve(ROOT, OTHER_MODULE), 'utf8') + '\nconst systemTimers = 1; void systemTimers;\n';

  // act
  const wiringDiagnostics = await lintWiring(OTHER_MODULE, source);

  // assert
  assert.deepStrictEqual(wiringDiagnostics, { diagnostics: [], enabled: [TIMER_RULE], messages: [] });
});

test('accepts timer names in comments and strings', async () => {
  // arrange
  const source =
    readFileSync(resolve(ROOT, OTHER_MODULE), 'utf8') +
    `
// systemTimers is mentioned without a runtime dependency.
const timerDocumentation = 'systemTimers';
void timerDocumentation;
`;

  // act
  const wiringDiagnostics = await lintWiring(OTHER_MODULE, source);

  // assert
  assert.deepStrictEqual(wiringDiagnostics, { diagnostics: [], enabled: [TIMER_RULE], messages: [] });
});
