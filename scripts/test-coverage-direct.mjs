import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { mkdtemp, open, rm } from 'node:fs/promises';
import { SourceMap } from 'node:module';
import { availableParallelism, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import ts from 'typescript';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const productionRoot = 'src';
const reporterPath = fileURLToPath(new URL('./test-reporter.mjs', import.meta.url));
// Repository-wide contracts do not belong to a single production module.
const repositoryTests = new Set([
  'test/accessories/accessoryReadPathScope.test.ts',
  'test/accessories/hapImportScope.test.ts',
  'test/accessories/hapWriteFidelity.test.ts',
  'test/accessories/timerFreedom.test.ts',
  'test/configSchema.test.ts',
  'test/documentation.test.ts',
  'test/packageManifest.test.ts',
  'test/packaging/dependencyAllowlist.test.ts',
  'test/packaging/dependencyLicenses.test.ts',
  'test/packaging/dependencyTelemetry.test.ts',
  'test/packaging/licenseHeaders.test.ts',
  'test/packedArtifact.test.ts',
  'test/realPumpCommandBlock.test.ts',
  'test/repositoryGovernance.test.ts',
]);
const unpairedRoots = new Set(['architecture', 'integration']);

function compiledPath(file) {
  return `dist-test/${file.slice(0, -3)}.js`;
}

function filesBelow(root, suffix) {
  return readdirSync(path.join(projectRoot, root), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
    .map((entry) => path.relative(projectRoot, path.join(entry.parentPath, entry.name)))
    .map((file) => file.split(path.sep).join('/'))
    .sort();
}

function sourceForTest(test) {
  return `${productionRoot}/${test.slice('test/'.length, -'.test.ts'.length)}.ts`;
}

function isUnpaired(test) {
  if (repositoryTests.has(test) || unpairedRoots.has(test.split('/')[1])) {
    return true;
  }

  const prefix = test.slice(0, -'-fake.test.ts'.length);
  return (
    test.endsWith('-fake.test.ts') &&
    !existsSync(path.join(projectRoot, sourceForTest(test))) &&
    [`${prefix}-fake.ts`, `${prefix}-contract.ts`].every((file) => existsSync(path.join(projectRoot, file)))
  );
}

function pairForPath(input) {
  const file = path.relative(projectRoot, path.resolve(projectRoot, input)).split(path.sep).join('/');
  let source;
  if (file.startsWith(`${productionRoot}/`) && file.endsWith('.ts')) {
    source = file;
  } else if (file.startsWith('test/') && file.endsWith('.test.ts') && !isUnpaired(file)) {
    source = sourceForTest(file);
  }

  if (source === undefined) {
    throw new Error(`Not a source-test pair member: ${input}`);
  }

  const test = `test/${source.slice(productionRoot.length + 1, -3)}.test.ts`;
  for (const member of [source, test]) {
    if (!existsSync(path.join(projectRoot, member))) {
      throw new Error(`Missing source-test pair member: ${member}`);
    }
  }

  return { source, test };
}

function allPairs() {
  return filesBelow(productionRoot, '.ts').map(pairForPath);
}

function stagedPairs() {
  const result = spawnSync('git', ['diff', '--cached', '--name-only', '--no-renames', '-z'], {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Staged-pair selection failed: ${result.error?.message ?? result.stderr}`);
  }

  const files = result.stdout.split('\0').filter(Boolean);
  const sharedInputs = new Set([
    'package.json',
    'package-lock.json',
    'config.schema.json',
    'tsconfig.json',
    'tsconfig.build.json',
    'tsconfig.test.json',
    'scripts/check-corresponding-tests.mjs',
    'scripts/test-coverage-direct.mjs',
    'scripts/test-reporter.mjs',
  ]);
  if (
    files.some(
      (file) =>
        sharedInputs.has(file) ||
        (file.startsWith('test/') && !file.endsWith('.test.ts')) ||
        (file.startsWith('features/') && file.endsWith('.ts')) ||
        !existsSync(path.join(projectRoot, file)),
    )
  ) {
    return allPairs();
  }

  const members = files.filter(
    (file) => (file.startsWith(`${productionRoot}/`) && file.endsWith('.ts')) || (file.startsWith('test/') && file.endsWith('.test.ts') && !isUnpaired(file)),
  );
  return [
    ...new Map(
      members.map((file) => {
        const pair = pairForPath(file);
        return [pair.source, pair];
      }),
    ).values(),
  ];
}

function isTypeOnly(source) {
  const { outputText } = ts.transpileModule(readFileSync(path.join(projectRoot, source), 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      removeComments: true,
    },
    fileName: source,
  });
  const output = ts.createSourceFile('output.js', outputText, ts.ScriptTarget.ESNext, false, ts.ScriptKind.JS);
  return output.statements.every(
    (statement) =>
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier === undefined &&
      statement.exportClause !== undefined &&
      ts.isNamedExports(statement.exportClause) &&
      statement.exportClause.elements.length === 0,
  );
}

/** Missing executable sources and partial coverage fail, even when the test itself passes. */
function assertCoverage(source, lcov) {
  const records = lcov.split('end_of_record').filter((record) => /^SF:/m.test(record));
  if (records.length === 0 && isTypeOnly(source)) {
    return;
  }

  if (records.length !== 1) {
    throw new Error(`Expected one LCOV record for ${source}, found ${records.length}`);
  }

  const fields = new Map(
    records[0]
      .trim()
      .split('\n')
      .map((line) => {
        const separator = line.indexOf(':');
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
  if (path.resolve(projectRoot, fields.get('SF')) !== path.join(projectRoot, compiledPath(source))) {
    throw new Error(`Unexpected LCOV source in the run for ${source}`);
  }

  for (const [found, hit] of [
    ['LF', 'LH'],
    ['FNF', 'FNH'],
    ['BRF', 'BRH'],
  ]) {
    const total = Number(fields.get(found));
    const covered = Number(fields.get(hit));
    if (!Number.isSafeInteger(total) || total < 0 || covered !== total) {
      throw new Error(`Incomplete direct coverage for ${source}: ${hit}/${found} ${covered}/${total}`);
    }
  }
}

// Enforce coverage on executed JavaScript, then map accepted records to TypeScript.
// Merely changing SF would report JavaScript line numbers against TypeScript files.
function sourceLcov(source, lcov) {
  if (!/^SF:/m.test(lcov)) {
    return lcov;
  }

  const compiled = path.join(projectRoot, compiledPath(source));
  const codeLines = readFileSync(compiled, 'utf8').split('\n');
  const map = new SourceMap(JSON.parse(readFileSync(`${compiled}.map`, 'utf8')));
  function originalLine(line) {
    const index = Number(line) - 1;
    const entry = map.findEntry(index, Math.max(0, codeLines[index]?.search(/\S/) ?? 0));
    return entry.generatedLine === index ? entry.originalLine + 1 : undefined;
  }

  const lines = new Map();
  const records = [];
  for (const record of lcov.trim().split('\n')) {
    if (record.startsWith('DA:')) {
      const [line, count] = record.slice(3).split(',');
      const mapped = originalLine(line);
      if (mapped !== undefined) {
        lines.set(mapped, Math.max(lines.get(mapped) ?? 0, Number(count)));
      }
    } else if (record.startsWith('FN:') || record.startsWith('BRDA:')) {
      const separator = record.indexOf(':') + 1;
      const comma = record.indexOf(',');
      records.push(`${record.slice(0, separator)}${originalLine(record.slice(separator, comma)) ?? 1}${record.slice(comma)}`);
    } else if (record.startsWith('SF:')) {
      records.push(`SF:${source}`);
    } else if (!/^(LF:|LH:|end_of_record)/.test(record)) {
      records.push(record);
    }
  }

  for (const [line, count] of [...lines].sort(([left], [right]) => left - right)) {
    records.push(`DA:${line},${count}`);
  }

  records.push(`LF:${lines.size}`, `LH:${[...lines.values()].filter((count) => count > 0).length}`, 'end_of_record');
  return `${records.join('\n')}\n`;
}

async function runPair({ source, test }) {
  const directory = await mkdtemp(path.join(tmpdir(), 'direct-coverage-'));
  try {
    const lcovPath = path.join(directory, 'pair.lcov');
    const logPath = path.join(directory, 'test.log');
    const log = await open(logPath, 'w');
    let code;
    try {
      const child = spawn(
        process.execPath,
        [
          '--test',
          '--experimental-test-coverage',
          `--test-coverage-include=${compiledPath(source)}`,
          `--test-reporter=${reporterPath}`,
          '--test-reporter-destination=stdout',
          '--test-reporter=lcov',
          `--test-reporter-destination=${lcovPath}`,
          compiledPath(test),
        ],
        { cwd: projectRoot, stdio: ['ignore', log.fd, log.fd] },
      );
      [code] = await once(child, 'close');
    } finally {
      await log.close();
    }

    process.stdout.write(readFileSync(logPath, 'utf8'));
    if (code !== 0) {
      throw new Error(`Focused test failed: ${test}`);
    }

    const lcov = readFileSync(lcovPath, 'utf8');
    assertCoverage(source, lcov);
    if (process.env.CI) {
      process.stdout.write(`Direct coverage passed: ${source}\n`);
    }

    return sourceLcov(source, lcov);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}

/** Independent pairs run in isolated processes; all started workers drain on failure. */
async function runPairs(pairs) {
  const limit = Number(process.env.TEST_CONCURRENCY || availableParallelism());
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error('TEST_CONCURRENCY must be a positive safe integer');
  }

  const reports = new Array(pairs.length);
  let next = 0;
  let stopped = false;
  async function worker() {
    while (!stopped && next < pairs.length) {
      const index = next++;
      try {
        reports[index] = await runPair(pairs[index]);
      } catch (error) {
        stopped = true;
        throw error;
      }
    }
  }

  const results = await Promise.allSettled(Array.from({ length: Math.min(limit, pairs.length) }, () => worker()));
  const failure = results.find((result) => result.status === 'rejected');
  if (failure) {
    throw failure.reason;
  }

  return reports;
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      all: { type: 'boolean' },
      staged: { type: 'boolean' },
      unpaired: { type: 'boolean' },
      lcov: { type: 'string' },
    },
  });
  const modes = [values.all, values.staged, values.unpaired, positionals.length > 0].filter(Boolean);
  if (modes.length !== 1 || (values.lcov && !values.all)) {
    throw new Error('Pass source/test paths, --all [--lcov <path>], --staged, or --unpaired');
  }

  if (values.unpaired) {
    const tests = filesBelow('test', '.test.ts').filter((test) => !test.startsWith('test/integration/') && isUnpaired(test));
    if (tests.length > 0) {
      const concurrency = process.env.TEST_CONCURRENCY ? [`--test-concurrency=${process.env.TEST_CONCURRENCY}`] : [];
      const child = spawn(process.execPath, ['--test', `--test-reporter=${reporterPath}`, ...concurrency, ...tests.map(compiledPath)], {
        cwd: projectRoot,
        stdio: 'inherit',
      });
      const [code] = await once(child, 'close');
      process.exitCode = code ?? 1;
    }

    return;
  }

  let pairs;
  if (values.all) {
    pairs = allPairs();
  } else if (values.staged) {
    pairs = stagedPairs();
  } else {
    pairs = [
      ...new Map(
        positionals.map((file) => {
          const pair = pairForPath(file);
          return [pair.source, pair];
        }),
      ).values(),
    ];
  }

  const reports = await runPairs(pairs);
  if (values.lcov) {
    const target = path.resolve(projectRoot, values.lcov);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, reports.join(''));
    process.stdout.write(`Merged LCOV: ${values.lcov} (${pairs.length} pairs)\n`);
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
