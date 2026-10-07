import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Fails any workflow that installs npm packages without `--ignore-scripts`. Without the flag,
 * a dependency's install script runs arbitrary code inside the workflow job, with whatever
 * permissions and secrets that job holds.
 *
 * No off-the-shelf workflow linter carries this check, which is why this is a local script.
 */

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const workflowRoot = '.github/workflows';
const ignoreScriptsFlag = '--ignore-scripts';
// A leading `-` would make this the tail of some longer token rather than an install call.
const installCallPattern = /(^|[^-])\bnpm\s+(ci|install|i)\b/;

function workflowPaths() {
  const absoluteRoot = path.join(projectRoot, workflowRoot);

  if (!existsSync(absoluteRoot)) {
    throw new Error(`Required directory does not exist: ${workflowRoot}`);
  }

  return readdirSync(absoluteRoot, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.ya?ml$/.test(entry.name))
    .map((entry) => path.relative(projectRoot, path.join(entry.parentPath, entry.name)))
    .sort();
}

function violations() {
  const found = [];

  for (const workflowPath of workflowPaths()) {
    const lines = readFileSync(path.join(projectRoot, workflowPath), 'utf8').split('\n');

    lines.forEach((text, index) => {
      if (text.trimStart().startsWith('#') || !installCallPattern.test(text) || text.includes(ignoreScriptsFlag)) {
        return;
      }

      found.push(`${workflowPath}:${index + 1}: ${text.trim()}`);
    });
  }

  return found;
}

const missing = violations();

if (missing.length === 0) {
  console.log('Workflow install-scripts gate passed.');
} else {
  for (const violation of missing) {
    console.error(`missing ${ignoreScriptsFlag}: ${violation}`);
  }

  console.error(`Workflow install-scripts gate failed with ${missing.length} violation(s).`);
  process.exitCode = 1;
}
