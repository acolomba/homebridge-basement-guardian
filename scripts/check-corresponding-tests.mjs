import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

/**
 * Fails when a source module has no paired test module that imports it, or a test module has no
 * source module. Every `src/<path>.ts` pairs with `test/<path>.test.ts`; test support
 * files (fakes, seeds, contracts) are not `.test.ts` and are not checked. The roots listed in
 * `nonCorrespondingRoots` hold suites that are not paired with one module.
 *
 * A fake's own test, `test/<path>-fake.test.ts`, has no source module. It passes when
 * `<path>-fake.ts` and `<path>-contract.ts` exist beside it and it imports both, since it runs
 * the shared contract against the fake.
 */

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const productionRoot = 'src';
const testRoot = 'test';
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
const nonCorrespondingRoots = new Set(['architecture', 'integration']);

function toProjectPath(absolutePath) {
  return path.relative(projectRoot, absolutePath).split(path.sep).join('/');
}

function filesBelow(relativeRoot, predicate) {
  const absoluteRoot = path.join(projectRoot, relativeRoot);

  if (!existsSync(absoluteRoot)) {
    throw new Error(`Required directory does not exist: ${relativeRoot}`);
  }

  return readdirSync(absoluteRoot, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && predicate(entry.name))
    .map((entry) => toProjectPath(path.join(entry.parentPath, entry.name)))
    .sort();
}

function expectedTestPath(sourcePath) {
  const relativePath = sourcePath.slice(productionRoot.length + 1, -'.ts'.length);
  return `${testRoot}/${relativePath}.test.ts`;
}

function expectedSourcePath(testPath) {
  const relativePath = testPath.slice(testRoot.length + 1, -'.test.ts'.length);
  return `${productionRoot}/${relativePath}.ts`;
}

function isCorrespondingTest(testPath) {
  const firstSegment = testPath.slice(testRoot.length + 1).split('/', 1)[0];
  return !repositoryTests.has(testPath) && !nonCorrespondingRoots.has(firstSegment);
}

/** The project paths of the relative modules a file imports or re-exports. */
function importedPaths(filePath) {
  const absolutePath = path.join(projectRoot, filePath);
  const sourceFile = ts.createSourceFile(filePath, readFileSync(absolutePath, 'utf8'), ts.ScriptTarget.ESNext, false, ts.ScriptKind.TS);
  const paths = [];

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) {
      continue;
    }

    if (statement.moduleSpecifier === undefined || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }

    const specifier = statement.moduleSpecifier.text;

    if (specifier.startsWith('.')) {
      paths.push(toProjectPath(path.resolve(path.dirname(absolutePath), specifier.replace(/\.js$/, '.ts'))));
    }
  }

  return paths;
}

/**
 * Whether the module at importedPath itself imports or re-exports sourcePath, which makes it a
 * proxy the test reaches its pair through instead of importing it directly. The lookup goes one
 * level only. A path that is absent, a directory, or not TypeScript is not a proxy.
 */
function reachesPairThrough(importedPath, sourcePath) {
  if (!importedPath.endsWith('.ts')) {
    return false;
  }

  const stats = statSync(path.join(projectRoot, importedPath), { throwIfNoEntry: false });
  return stats?.isFile() === true && importedPaths(importedPath).includes(sourcePath);
}

function isFakeContractTest(testPath) {
  if (!testPath.endsWith('-fake.test.ts')) {
    return false;
  }

  const prefix = testPath.slice(0, -'-fake.test.ts'.length);
  const companions = [`${prefix}-fake.ts`, `${prefix}-contract.ts`];
  const imports = importedPaths(testPath);
  return companions.every((companion) => existsSync(path.join(projectRoot, companion)) && imports.includes(companion));
}

const sources = filesBelow(productionRoot, (name) => name.endsWith('.ts'));
const tests = filesBelow(testRoot, (name) => name.endsWith('.test.ts'));
const testSet = new Set(tests);
const problems = [];

for (const sourcePath of sources) {
  const testPath = expectedTestPath(sourcePath);

  if (!testSet.has(testPath)) {
    problems.push(`missing test ${testPath} for ${sourcePath}`);
    continue;
  }

  const imports = importedPaths(testPath);

  if (!imports.includes(sourcePath)) {
    problems.push(
      imports.some((importedPath) => reachesPairThrough(importedPath, sourcePath))
        ? `${testPath} reaches ${sourcePath} through another module instead of importing it`
        : `${testPath} does not import ${sourcePath}`,
    );
  }
}

for (const testPath of tests.filter(isCorrespondingTest)) {
  if (!existsSync(path.join(projectRoot, expectedSourcePath(testPath))) && !isFakeContractTest(testPath)) {
    problems.push(`missing source ${expectedSourcePath(testPath)} for ${testPath}`);
  }
}

if (problems.length === 0) {
  console.log('Corresponding-tests gate passed.');
} else {
  for (const problem of problems) {
    console.error(problem);
  }

  console.error(`Corresponding-tests gate failed with ${problems.length} problem(s).`);
  process.exitCode = 1;
}
