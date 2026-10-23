// Checks the Phase 5 findings ledger mechanically, so that no batch can be reported clean on prose
// alone: the table shapes, the 24-path review scope, the finding IDs and dispositions, the D-03 and
// D-18 counter arithmetic and stop rule, and the scope each round report claims. `--headers` checks
// the D-01 file header instead. The script reads files and asks git; it writes nothing.
//
// Usage:
//   node 05-ledger-tracer.mjs [--ledger <path>] [--require-clean <BATCH|all>]
//   node 05-ledger-tracer.mjs --headers [--ledger <path>] [--batch <BATCH> | --paths <path>...]

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const PHASE_DIR = '.planning/phases/05-accessories-conformance';
const DEFAULT_LEDGER = `${PHASE_DIR}/05-FINDINGS.md`;

// The review scope fixed at Wave 0: ten accessory sources, their ten owners and the four gates.
const CORE_PATHS = [
  'src/accessories/alarmMute.ts',
  'test/accessories/alarmMute.test.ts',
  'src/accessories/services.ts',
  'test/accessories/services.test.ts',
  'src/accessories/customCharacteristics.ts',
  'test/accessories/customCharacteristics.test.ts',
  'src/accessories/customServices.ts',
  'test/accessories/customServices.test.ts',
  'src/accessories/serviceCatalogue.ts',
  'test/accessories/serviceCatalogue.test.ts',
  'src/accessories/controls.ts',
  'test/accessories/controls.test.ts',
  'src/accessories/pumpRecords.ts',
  'test/accessories/pumpRecords.test.ts',
  'src/accessories/reconciliation.ts',
  'test/accessories/reconciliation.test.ts',
  'src/accessories/staleMarking.ts',
  'test/accessories/staleMarking.test.ts',
  'src/accessories/basementGuardian.ts',
  'test/accessories/basementGuardian.test.ts',
  'test/accessories/timerFreedom.test.ts',
  'test/accessories/hapImportScope.test.ts',
  'test/accessories/accessoryReadPathScope.test.ts',
  'test/accessories/hapWriteFidelity.test.ts',
];

// These GATES inputs were reviewed at round 15, then retired by the maintainer.
// Keep their historical inventory rows without claiming they exist in the current tree.
const RETIRED_PATHS = new Set([
  'test/accessories/timerFreedom.test.ts',
  'test/accessories/hapImportScope.test.ts',
  'test/accessories/accessoryReadPathScope.test.ts',
  'test/accessories/staticGateSources.ts',
]);
const RETIRED_BASE = '43c0e4a3a1b22aaba3c0e9aeece5b685412daff7';
const RETIRE_COMMIT = '3299b7e0e2e5c4887907dc94cb88219af0b69b1d';

const BATCHES = ['DECLARATIONS', 'CATALOGUE', 'CONTROLS', 'RECORDS', 'ACCESSORY', 'GATES'];

// Only CONTROLS opens with findings: the seven Phase 1 seeds pre-allocated before its first round (D-09).
const SEED_COUNTS = new Map([
  ['DECLARATIONS', 0],
  ['CATALOGUE', 0],
  ['CONTROLS', 7],
  ['RECORDS', 0],
  ['ACCESSORY', 0],
  ['GATES', 0],
]);

// D-18: the maintainer extended GATES alone from ten to fifteen correction rounds.
const ROUND_CAPS = new Map(BATCHES.map((batch) => [batch, batch === 'GATES' ? 15 : 10]));

const KINDS = new Set(['core', 'addition', 'adaptation']);
const DISPOSITIONS = new Set(['pending', 'open', 'fixed', 'rejected']);
const SEVERITIES = new Set(['BLOCKER', 'WARNING']);
const FINDING_ID = /^CR-05-(DECLARATIONS|CATALOGUE|CONTROLS|RECORDS|ACCESSORY|GATES)-[0-9]{3}$/;
const COMMIT_HASH = /\b[0-9a-f]{7,40}\b/g;
const FULL_COMMIT_HASH = /^[0-9a-f]{40}$/;

const TITLE = '# Phase 5 findings ledger';
const INVENTORY = {
  heading: '## Scope inventory',
  header: '| # | Path | Kind | Batch | First round | Lines at base | Header at base |',
};
const COUNTERS = {
  heading: '## Batch counters',
  header: '| Batch | Round | Report | Revision | Opening | Fixed | Rejected | New | Reopened | Closing | Open IDs | D-03 result |',
};
const FINDINGS = {
  heading: '## Findings',
  header: '| ID | Batch | Severity | Rule | Initial location | Current location | First reviewer | Disposition | Reason | Fix commits | Checks |',
};
const LEADS = {
  heading: '## Candidate leads',
  header: '| Lead | Owning batch | Location at base | Observation | Likely rule | Disposition |',
};
const APPLICABILITY = {
  heading: '## Rule applicability (D-14, D-17)',
  header: '| Gate | Rule | Applicability | Reason |',
};
const BUG_HISTORIES = {
  heading: '## Genuine bug histories',
  header: '| Finding | Owner test | RED evidence | Evidence commit | Fix commit | Classifier | Ancestry |',
};
const EVIDENCE_HEADING = '## Coordinator evidence';
const TABLES = [INVENTORY, COUNTERS, FINDINGS, LEADS, APPLICABILITY, BUG_HISTORIES];

// The D-01 layout: SPDX line, copyright block and overview block, one empty line between sections.
const HEADER_LINES = [
  { text: '// SPDX-License-Identifier: MIT', expectation: 'expected "// SPDX-License-Identifier: MIT"' },
  { text: '', expectation: 'expected an empty line after the SPDX line' },
  { text: '/**', expectation: 'expected "/**" opening the copyright block' },
  { text: ' * Copyright (c) 2026 Alessandro Colomba', expectation: 'expected " * Copyright (c) 2026 Alessandro Colomba"' },
  { text: ' */', expectation: 'expected " */" closing the copyright block' },
  { text: '', expectation: 'expected an empty line after the copyright block' },
  { text: '/**', expectation: 'expected "/**" opening the overview block' },
];
const OVERVIEW_PREFIX = ' * @fileoverview ';

class UsageError extends Error {}

function readRepositoryRoot() {
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  if (result.error !== undefined || result.status !== 0) {
    console.error('usage error: run inside the repository checkout; git rev-parse --show-toplevel failed');
    process.exit(2);
  }

  return result.stdout.trim();
}

const ROOT = readRepositoryRoot();

function git(args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  if (result.error !== undefined) {
    throw result.error;
  }

  return result;
}

function isTracked(repositoryPath) {
  return git(['ls-files', '--error-unmatch', '--', repositoryPath]).status === 0;
}

function resolvesToCommit(hash) {
  return git(['cat-file', '-e', `${hash}^{commit}`]).status === 0;
}

function isAncestorOfHead(hash) {
  return git(['merge-base', '--is-ancestor', hash, 'HEAD']).status === 0;
}

function valueAfter(argv, index, flag) {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new UsageError(`${flag} needs a value`);
  }

  return value;
}

function parseArguments(argv) {
  const options = { ledger: DEFAULT_LEDGER, requireClean: undefined, headers: false, batch: undefined, paths: undefined };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--ledger') {
      options.ledger = valueAfter(argv, index, flag);
      index += 1;
    } else if (flag === '--require-clean') {
      options.requireClean = valueAfter(argv, index, flag);
      index += 1;
    } else if (flag === '--headers') {
      options.headers = true;
    } else if (flag === '--batch') {
      options.batch = valueAfter(argv, index, flag);
      index += 1;
    } else if (flag === '--paths') {
      const paths = [];
      while (index + 1 < argv.length && !argv[index + 1].startsWith('--')) {
        paths.push(argv[index + 1]);
        index += 1;
      }
      if (paths.length === 0) {
        throw new UsageError('--paths needs at least one path');
      }
      options.paths = paths;
    } else {
      throw new UsageError(`unknown argument ${flag}`);
    }
  }

  if (options.requireClean !== undefined && options.requireClean !== 'all' && !BATCHES.includes(options.requireClean)) {
    throw new UsageError(`--require-clean takes all or one of ${BATCHES.join(', ')}`);
  }
  if (options.batch !== undefined && !BATCHES.includes(options.batch)) {
    throw new UsageError(`--batch takes one of ${BATCHES.join(', ')}`);
  }
  if (!options.headers && (options.batch !== undefined || options.paths !== undefined)) {
    throw new UsageError('--batch and --paths select files for --headers only');
  }
  if (options.headers && options.requireClean !== undefined) {
    throw new UsageError('--require-clean is a ledger-mode check; it does not combine with --headers');
  }
  if (options.batch !== undefined && options.paths !== undefined) {
    throw new UsageError('use --batch or --paths, not both');
  }

  return options;
}

// Splits a table row on pipes that are not escaped, so a `\|` inside a cell stays in that cell.
function splitRow(line) {
  const cells = [];
  let cell = '';
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '|' && line[index - 1] !== '\\') {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += character;
    }
  }
  cells.push(cell.trim());

  // The leading and trailing pipes leave an empty first and last cell.
  return cells.slice(1, -1);
}

function stripBackticks(cell) {
  return cell.replaceAll('`', '');
}

// The lines of one `## ` section, from the line after its heading to the next `## ` or `# ` heading.
function sectionLines(lines, heading) {
  const start = lines.indexOf(heading);
  if (start === -1) {
    return undefined;
  }

  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('## ') || line.startsWith('# ')) {
      break;
    }
    body.push(line);
  }

  return body;
}

function readTable(lines, table, violate) {
  const body = sectionLines(lines, table.heading);
  if (body === undefined) {
    violate('L1', `section heading "${table.heading}" is missing`);

    return [];
  }

  const headerIndex = body.findIndex((line) => line.trimEnd() === table.header);
  if (headerIndex === -1) {
    violate('L1', `the header row of "${table.heading}" is missing or changed; expected ${table.header}`);

    return [];
  }

  const columns = splitRow(table.header);
  const separator = body[headerIndex + 1] ?? '';
  const separatorCells = separator.startsWith('|') ? splitRow(separator.trimEnd()) : [];
  if (separatorCells.length !== columns.length || !separatorCells.every((cell) => /^:?-{3,}:?$/.test(cell))) {
    violate('L1', `"${table.heading}" needs a separator row of ${String(columns.length)} cells under its header row`);

    return [];
  }

  const rows = [];
  for (const line of body.slice(headerIndex + 2)) {
    if (!line.startsWith('|')) {
      break;
    }
    const cells = line.trimEnd().endsWith('|') ? splitRow(line.trimEnd()) : [];
    if (cells.length !== columns.length) {
      violate('L1', `"${table.heading}" row "${line.slice(0, 60)}" has ${String(cells.length)} cells, expected ${String(columns.length)}`);
      continue;
    }
    rows.push(Object.fromEntries(columns.map((column, index) => [column, cells[index]])));
  }

  return rows;
}

function readLedger(ledgerPath, violate) {
  if (!existsSync(ledgerPath)) {
    violate('L1', `ledger ${ledgerPath} does not exist`);

    return undefined;
  }

  const lines = readFileSync(ledgerPath, 'utf8').split('\n');
  if (lines[0] !== TITLE) {
    violate('L1', `the ledger must open with "${TITLE}"`);
  }
  if (!lines.includes(EVIDENCE_HEADING)) {
    violate('L1', `section heading "${EVIDENCE_HEADING}" is missing`);
  }

  const [inventory, counters, findings, leads, applicability, bugHistories] = TABLES.map((table) => readTable(lines, table, violate));

  return { inventory, counters, findings, leads, applicability, bugHistories };
}

function checkInventory(inventory, violate) {
  const seen = new Set();
  for (const row of inventory) {
    const rowPath = stripBackticks(row.Path);
    if (seen.has(rowPath)) {
      violate('L2', `inventory path ${rowPath} appears more than once`);
    }
    seen.add(rowPath);
    if (!KINDS.has(row.Kind)) {
      violate('L2', `${rowPath}: Kind ${row.Kind} is not core, addition or adaptation`);
    }
    if (!BATCHES.includes(row.Batch)) {
      violate('L2', `${rowPath}: Batch ${row.Batch} is not one of ${BATCHES.join(', ')}`);
    }
    if (!/^[0-9]+$/.test(row['First round'])) {
      violate('L2', `${rowPath}: First round ${row['First round']} is not an integer`);
    } else if (row.Kind === 'core' && Number(row['First round']) !== 0) {
      violate('L2', `${rowPath}: a core row has First round 0, not ${row['First round']}`);
    }
    if (RETIRED_PATHS.has(rowPath)) {
      if (isTracked(rowPath) || git(['cat-file', '-e', `${RETIRED_BASE}:${rowPath}`]).status !== 0 || git(['cat-file', '-e', `${RETIRE_COMMIT}:${rowPath}`]).status === 0) {
        violate('L2', `${rowPath} does not match the recorded retirement history`);
      }
    } else if (!isTracked(rowPath)) {
      violate('L2', `${rowPath} is not tracked by git`);
    }
  }

  const corePaths = new Set(inventory.filter((row) => row.Kind === 'core').map((row) => stripBackticks(row.Path)));
  for (const corePath of CORE_PATHS) {
    if (!corePaths.has(corePath)) {
      violate('L2', `the core inventory row for ${corePath} is missing`);
    }
  }
  for (const corePath of corePaths) {
    if (!CORE_PATHS.includes(corePath)) {
      violate('L2', `${corePath} is marked core but is not one of the 24 core paths`);
    }
  }

  const tracked = git(['ls-files', '--', 'src/accessories', 'test/accessories']).stdout.split('\n').filter((line) => line !== '');
  for (const trackedPath of tracked) {
    if (!seen.has(trackedPath)) {
      violate('L2', `${trackedPath} is tracked under src/accessories or test/accessories but has no inventory row`);
    }
  }
}

function checkFindings(findings, countersByBatch, violate) {
  const seen = new Set();
  for (const finding of findings) {
    const id = stripBackticks(finding.ID);
    const match = FINDING_ID.exec(id);
    if (match === null) {
      violate('L3', `finding ID ${id} does not match CR-05-<BATCH>-NNN`);
    } else if (match[1] !== finding.Batch) {
      violate('L3', `${id}: Batch cell ${finding.Batch} differs from the batch its ID names`);
    }
    if (seen.has(id)) {
      violate('L3', `finding ID ${id} appears more than once`);
    }
    seen.add(id);

    const { Severity: severity, Disposition: disposition } = finding;
    if (!DISPOSITIONS.has(disposition)) {
      violate('L3', `${id}: Disposition ${disposition} is not pending, open, fixed or rejected`);
    }
    if (severity === 'pending') {
      if (disposition !== 'pending') {
        violate('L3', `${id}: Severity pending is allowed only with Disposition pending`);
      }
    } else if (!SEVERITIES.has(severity)) {
      violate('L3', `${id}: Severity ${severity} is not BLOCKER or WARNING`);
    }
    if (disposition === 'pending' && (countersByBatch.get(finding.Batch)?.length ?? 0) > 0) {
      violate('L3', `${id}: Disposition pending after batch ${finding.Batch} has a counter row`);
    }
    if (disposition === 'rejected' && finding.Reason === '') {
      violate('L3', `${id}: a rejected finding needs a Reason`);
    }
    if (disposition === 'fixed') {
      const hashes = finding['Fix commits'].match(COMMIT_HASH) ?? [];
      if (hashes.length === 0) {
        violate('L3', `${id}: a fixed finding needs at least one fix commit`);
      }
      for (const hash of hashes) {
        if (!resolvesToCommit(hash)) {
          violate('L3', `${id}: fix commit ${hash} does not resolve to a commit`);
        } else if (!isAncestorOfHead(hash)) {
          violate('L3', `${id}: fix commit ${hash} is not an ancestor of HEAD`);
        }
      }
    }
  }

  for (let seed = 1; seed <= SEED_COUNTS.get('CONTROLS'); seed += 1) {
    const id = `CR-05-CONTROLS-${String(seed).padStart(3, '0')}`;
    if (!seen.has(id)) {
      violate('L3', `seed finding ${id} is missing`);
    }
  }
}

// What D-03 as amended and D-18 make a round's result, from that round's own counts.
function expectedResult(batch, round, opening, closing, reopened) {
  if (round === 0) {
    return closing > 0 ? 'initial' : 'clean';
  }
  if (reopened > 0 || (closing > 0 && closing >= opening) || (round >= ROUND_CAPS.get(batch) && closing > 0)) {
    return 'STOP';
  }

  return closing === 0 ? 'clean' : 'continue';
}

const COUNT_COLUMNS = ['Round', 'Opening', 'Fixed', 'Rejected', 'New', 'Reopened', 'Closing'];

function readCounts(row) {
  const counts = {};
  for (const column of COUNT_COLUMNS) {
    if (!/^[0-9]+$/.test(row[column])) {
      return undefined;
    }
    counts[column] = Number(row[column]);
  }

  return counts;
}

function checkCounters(countersByBatch, violate) {
  for (const [batch, rows] of countersByBatch) {
    let previous;
    for (const [index, row] of rows.entries()) {
      const name = `${batch} round ${row.Round}`;
      if (!BATCHES.includes(batch)) {
        violate('L4-sequence', `${name}: Batch is not one of ${BATCHES.join(', ')}`);
        continue;
      }
      const counts = readCounts(row);
      if (counts === undefined) {
        violate('L4-sequence', `${name}: Round and every count must be a non-negative integer`);
        previous = undefined;
        continue;
      }

      const { Round: round, Opening: opening, Fixed: fixed, Rejected: rejected, New: added, Reopened: reopened, Closing: closing } = counts;
      if (round !== index) {
        violate('L4-sequence', `${name}: rounds run 0, 1, 2 and so on with no gap; this row should be round ${String(index)}`);
      }
      if (index === 0) {
        if (opening !== SEED_COUNTS.get(batch)) {
          violate('L4-sequence', `${name}: round 0 Opening must equal the batch's ${String(SEED_COUNTS.get(batch))} pre-allocated seed IDs`);
        }
        if (fixed !== 0 || reopened !== 0) {
          violate('L4-sequence', `${name}: round 0 has Fixed 0 and Reopened 0`);
        }
      } else if (previous !== undefined && opening !== previous.closing) {
        violate('L4-sequence', `${name}: Opening ${String(opening)} differs from round ${String(previous.round)} Closing ${String(previous.closing)}`);
      }

      const sum = opening - fixed - rejected + added + reopened;
      if (closing !== sum) {
        violate('L4-sum', `${name}: Closing ${String(closing)} differs from Opening - Fixed - Rejected + New + Reopened = ${String(sum)}`);
      }
      if (round > ROUND_CAPS.get(batch)) {
        violate('L4-cap', `${name}: ${batch} records no round above ${String(ROUND_CAPS.get(batch))} (D-18)`);
      }

      const result = row['D-03 result'];
      if (previous !== undefined && previous.result.startsWith('STOP') && !previous.result.includes('resolved by maintainer')) {
        violate('L4-stop', `${name}: follows the STOP at round ${String(previous.round)}, which no maintainer resolution releases`);
      }
      const expected = expectedResult(batch, round, opening, closing, reopened);
      if (expected === 'STOP' ? !result.startsWith('STOP') : result !== expected) {
        violate('L4-stop', `${name}: D-03 result "${result}" should be ${expected === 'STOP' ? '"STOP: <reason>"' : `"${expected}"`}`);
      }

      previous = { round, closing, result };
    }
  }
}

function checkOpenSets(countersByBatch, findings, violate) {
  for (const [batch, rows] of countersByBatch) {
    const last = rows.at(-1);
    const openIds = findings
      .filter((finding) => finding.Batch === batch && finding.Disposition === 'open')
      .map((finding) => stripBackticks(finding.ID))
      .sort();
    const name = `${batch} round ${last.Round}`;
    if (last.Closing !== String(openIds.length)) {
      violate('L5', `${name}: Closing ${last.Closing} differs from the ${String(openIds.length)} findings with Disposition open`);
    }

    const listedCell = stripBackticks(last['Open IDs']);
    const expectedCell = openIds.length === 0 ? 'None' : openIds.join(', ');
    const listed = listedCell === 'None' ? [] : listedCell.split(',').map((id) => id.trim()).sort();
    const matches = openIds.length === 0 ? listedCell === 'None' : listed.join(',') === openIds.join(',');
    if (!matches) {
      violate('L5', `${name}: Open IDs "${listedCell}" should be "${expectedCell}"`);
    }
  }
}

function unquote(value) {
  return value.replace(/^(['"])(.*)\1$/, '$2');
}

// Reads the flat keys and the list keys of a report's YAML frontmatter; nested maps are skipped.
function readFrontmatter(reportPath) {
  const lines = readFileSync(reportPath, 'utf8').split('\n');
  if (lines[0] !== '---') {
    return undefined;
  }
  const end = lines.indexOf('---', 1);
  if (end === -1) {
    return undefined;
  }

  const fields = {};
  let listKey;
  for (const line of lines.slice(1, end)) {
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item !== null && listKey !== undefined) {
      fields[listKey].push(unquote(item[1].trim()));
      continue;
    }
    const field = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(line);
    listKey = undefined;
    if (field === null) {
      continue;
    }
    const [, key, value] = field;
    if (value === '') {
      fields[key] = [];
      listKey = key;
    } else if (value.startsWith('[') && value.endsWith(']')) {
      fields[key] = value
        .slice(1, -1)
        .split(',')
        .map((entry) => unquote(entry.trim()))
        .filter((entry) => entry !== '');
    } else {
      fields[key] = unquote(value.trim());
    }
  }

  return fields;
}

function checkReports(countersByBatch, inventory, violate) {
  for (const [batch, rows] of countersByBatch) {
    for (const row of rows) {
      const name = `${batch} round ${row.Round}`;
      const revision = stripBackticks(row.Revision);
      if (!FULL_COMMIT_HASH.test(revision)) {
        violate('L6', `${name}: Revision ${revision} is not a 40-hex commit`);
      } else if (!resolvesToCommit(revision)) {
        violate('L6', `${name}: Revision ${revision} does not resolve to a commit`);
      } else if (!isAncestorOfHead(revision)) {
        violate('L6', `${name}: Revision ${revision} is not an ancestor of HEAD`);
      }

      const report = stripBackticks(row.Report);
      const reportPath = path.join(ROOT, PHASE_DIR, report);
      if (!existsSync(reportPath)) {
        violate('L6', `${name}: report ${report} does not exist under ${PHASE_DIR}`);
        continue;
      }
      const frontmatter = readFrontmatter(reportPath);
      if (frontmatter === undefined) {
        violate('L6', `${name}: report ${report} has no YAML frontmatter`);
        continue;
      }
      if (frontmatter.batch !== batch) {
        violate('L6', `${name}: report ${report} names batch ${String(frontmatter.batch)}`);
      }
      if (frontmatter.review_round === undefined || !/^[0-9]+$/.test(frontmatter.review_round) || Number(frontmatter.review_round) !== Number(row.Round)) {
        violate('L6', `${name}: report ${report} names review_round ${String(frontmatter.review_round)}`);
      }
      if (frontmatter.source_revision !== revision) {
        violate('L6', `${name}: report ${report} names source_revision ${String(frontmatter.source_revision)}`);
      }

      const expected = inventory
        .filter((entry) => entry.Batch === batch && /^[0-9]+$/.test(entry['First round']) && Number(entry['First round']) <= Number(row.Round))
        .map((entry) => stripBackticks(entry.Path))
        .sort();
      const reviewed = Array.isArray(frontmatter.files_reviewed_list) ? [...frontmatter.files_reviewed_list].sort() : [];
      const missing = expected.filter((entry) => !reviewed.includes(entry));
      const extra = reviewed.filter((entry) => !expected.includes(entry));
      if (missing.length > 0 || extra.length > 0) {
        violate('L6', `${name}: files_reviewed_list of ${report} differs from the batch scope (missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'})`);
      }
    }
  }
}

function evidencePaths(cell) {
  return (stripBackticks(cell).match(/[\w./-]*RED-EVIDENCE\.json/g) ?? []).map((name) => (name.includes('/') ? name : `${PHASE_DIR}/${name}`));
}

function checkClean(target, ledger, countersByBatch, violate) {
  const batches = target === 'all' ? BATCHES : [target];
  const named = new Set();
  for (const batch of batches) {
    const rows = countersByBatch.get(batch) ?? [];
    if (rows.length === 0) {
      violate('CLEAN', `${batch} has no counter row`);
    } else if (rows.at(-1)['D-03 result'] !== 'clean') {
      violate('CLEAN', `${batch} round ${rows.at(-1).Round}: the last result is "${rows.at(-1)['D-03 result']}", not "clean"`);
    }
    for (const row of rows) {
      named.add(`${PHASE_DIR}/${stripBackticks(row.Report)}`);
    }
    for (const finding of ledger.findings) {
      if (finding.Batch === batch && (finding.Disposition === 'pending' || finding.Disposition === 'open')) {
        violate('CLEAN', `${stripBackticks(finding.ID)} is still ${finding.Disposition}`);
      }
    }
  }

  for (const history of ledger.bugHistories) {
    const id = stripBackticks(history.Finding);
    const finding = ledger.findings.find((entry) => stripBackticks(entry.ID) === id);
    if (target === 'all' || finding?.Batch === target) {
      for (const evidence of evidencePaths(history['RED evidence'])) {
        named.add(evidence);
      }
    }
  }

  for (const record of named) {
    if (!isTracked(record)) {
      violate('CLEAN', `${record} is not tracked by git`);
    } else if (git(['status', '--porcelain', '--', record]).stdout.trim() !== '') {
      violate('CLEAN', `${record} has uncommitted changes`);
    }
  }
}

function groupCounters(counters) {
  const byBatch = new Map();
  for (const row of counters) {
    const rows = byBatch.get(row.Batch) ?? [];
    rows.push(row);
    byBatch.set(row.Batch, rows);
  }

  return byBatch;
}

function runLedger(options) {
  const violations = [];
  const violate = (code, detail) => violations.push(`LEDGER_VIOLATION ${code}: ${detail}`);
  const ledger = readLedger(path.resolve(options.ledger), violate);
  if (ledger !== undefined) {
    const countersByBatch = groupCounters(ledger.counters);
    checkInventory(ledger.inventory, violate);
    checkFindings(ledger.findings, countersByBatch, violate);
    checkCounters(countersByBatch, violate);
    checkOpenSets(countersByBatch, ledger.findings, violate);
    checkReports(countersByBatch, ledger.inventory, violate);
    if (options.requireClean !== undefined) {
      checkClean(options.requireClean, ledger, countersByBatch, violate);
    }
  }

  if (violations.length > 0) {
    for (const violation of violations) {
      console.error(violation);
    }

    return 1;
  }

  const open = ledger.findings.filter((finding) => finding.Disposition === 'open').length;
  const clean = options.requireClean === undefined ? '' : ` clean=${options.requireClean}`;
  console.log(
    `ACCESSORIES_LEDGER_TRACER_OK inventory=${String(ledger.inventory.length)} findings=${String(ledger.findings.length)} open=${String(open)} rounds=${String(ledger.counters.length)}${clean}`,
  );

  return 0;
}

// The first place a file departs from the D-01 layout, as "<line> <expectation>", or undefined.
function headerProblem(lines) {
  for (const [index, expected] of HEADER_LINES.entries()) {
    if (lines[index] !== expected.text) {
      return `${String(index + 1)} ${expected.expectation}`;
    }
  }
  if (!(lines[7] ?? '').startsWith(OVERVIEW_PREFIX)) {
    return `8 expected a line starting with "${OVERVIEW_PREFIX}"`;
  }

  const close = lines.findIndex((line, index) => index > 6 && line === ' */');
  if (close === -1) {
    return '8 expected the overview block to close with " */"';
  }
  if (lines[close + 1] !== '') {
    return `${String(close + 2)} expected one empty line after the overview block`;
  }
  if ((lines[close + 2] ?? '') === '') {
    return `${String(close + 3)} expected a non-empty line after the single empty line`;
  }

  return undefined;
}

function runHeaders(options) {
  let selected = options.paths;
  if (selected === undefined) {
    const violations = [];
    const ledger = readLedger(path.resolve(options.ledger), (code, detail) => violations.push(`LEDGER_VIOLATION ${code}: ${detail}`));
    if (ledger === undefined || ledger.inventory.length === 0) {
      for (const violation of violations) {
        console.error(violation);
      }
      console.error('LEDGER_VIOLATION L1: --headers needs the ledger inventory to select files');

      return 1;
    }
    selected = ledger.inventory.filter((row) => options.batch === undefined || row.Batch === options.batch).map((row) => stripBackticks(row.Path));
  }

  const failures = [];
  for (const selectedPath of selected) {
    const filePath = path.join(ROOT, selectedPath);
    const problem = existsSync(filePath) ? headerProblem(readFileSync(filePath, 'utf8').split('\n')) : '1 expected the file to exist';
    if (problem !== undefined) {
      failures.push(`HEADER_VIOLATION ${selectedPath}: ${problem}`);
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(failure);
    }

    return 1;
  }

  console.log(`ACCESSORIES_HEADERS_OK files=${String(selected.length)}`);

  return 0;
}

function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(`usage error: ${error.message}`);

      return 2;
    }
    throw error;
  }

  return options.headers ? runHeaders(options) : runLedger(options);
}

process.exitCode = main();
