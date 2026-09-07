# Phase 6: Validated Release Candidate - Pattern Map

**Mapped:** 2026-09-04
**Files analyzed:** 16
**Analogs found:** 13 / 16

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `.github/workflows/build.yml` (modify) | config | batch (CI) | itself (existing matrix job) | exact |
| `.github/workflows/publish.yml` (new) | config | event-driven (workflow_dispatch) | `.github/workflows/build.yml` | role-match |
| `test/packaging/dependencyAllowlist.test.ts` (new) | test | transform (static assertion) | `test/packageManifest.test.ts` | exact |
| `test/packaging/licenseHeaders.test.ts` (new) | test | transform (static text gate) | `test/packedArtifact.test.ts` + `test/accessories/hapImportScope.test.ts` | exact |
| `test/documentation.test.ts` (new) | test | transform (static text gate) | `test/accessories/hapImportScope.test.ts` | role-match |
| `cucumber.json` (modify) | config | request-response (test runner profiles) | itself (existing `"real"` key) | exact |
| `features/real-pump/*.feature` (new) | test | event-driven (BDD scenarios) | `features/discovery.feature`, `features/degradedOperation.feature` | exact |
| `features/real-pump/support/realTransport.ts` (new) | service | streaming/CRUD (real transport wrapper) | `features/support/world.ts`, `features/support/fakeShadowBroker.ts`, `features/support/fakeRestApi.ts` | role-match |
| `SECURITY.md` (new) | config (repo governance) | request-response (docs) | `.github/ISSUE_TEMPLATE/*.md` | role-match |
| `NOTICE` (new) | config | file-I/O | `LICENSE` | role-match |
| `dev/prep/g001-alarm-mute-checklist.md` (new) | config (runbook) | batch | `.planning/phases/04-pump-records-and-official-controls/04-UAT.md` | exact |
| `dev/prep/g002-water-level-checklist.md` (new) | config (runbook) | batch | `04-UAT.md` | exact |
| `dev/prep/g003-g004-paired-home-checklist.md` (new) | config (runbook) | batch | `04-UAT.md` "Deferred session, 2026-09-04" | exact |
| `LICENSE` (rewrite) | config | file-I/O | itself (current Apache-only text) | partial |
| `package.json` (modify: `private`, `license`, `files`) | config | file-I/O | itself | exact |
| `README.md` (modify: 3 new disclosures) | config (docs) | file-I/O | itself (existing "Values that are estimates" section) | exact |
| `dev/README.md` (modify: mDNS prerequisite) | config (docs) | file-I/O | itself (existing "Networking" section) | exact |
| `src/*.ts` (modify: SPDX headers) | source (cross-cutting) | file-I/O | none — new convention | no analog |

## Pattern Assignments

### `.github/workflows/build.yml` (config, batch CI)

**Analog:** itself — extend the existing single-dimension matrix, do not replace it.

**Current matrix pattern** (read this session, full file):
```yaml
strategy:
  fail-fast: false
  matrix:
    # D-032: Node 20 left Homebridge support in April 2026, and
    # `engines.node` is `^22.10.0 || ^24.0.0`. Node 22 is also the version
    # Homebridge 1.8 and 2.x both accept, so dropping 20 costs no
    # Homebridge 1.x coverage.
    node-version: [22.x, 24.x]

steps:
  - uses: actions/checkout@v5
  - name: Use Node.js ${{ matrix.node-version }}
    uses: actions/setup-node@v6
    with:
      node-version: ${{ matrix.node-version }}
  - name: Install dependencies
    run: npm install
  - name: Lint the project
    run: npm run lint
  - name: Check formatting
    run: npm run format:check
  - name: Check types
    run: npm run typecheck
  - name: Check code health
    run: npm run fallow
  - name: Run tests
    run: npm test
  - name: Build the project
    run: npm run build
```

**Second matrix dimension to add** (RESEARCH.md Pattern 2, matches this file's own comment style — a `#`-prefixed rationale comment above the array, matching the existing `node-version` comment):
```yaml
matrix:
  node-version: [22.x, 24.x]
  homebridge-version: ['1.8.0', '1.11.4', '2.4.0']
steps:
  # ...existing steps through `npm install`...
  - name: Pin matrix-selected Homebridge version
    run: npm install --no-save homebridge@${{ matrix.homebridge-version }}
  # ...existing lint/format/typecheck/fallow/test/build steps unchanged...
```
Add a comment above the `homebridge-version` array in the same voice as the existing `node-version` comment, documenting the expected benign `EBADENGINE` warning on the `1.8.0` cell (see RESEARCH.md Common Pitfalls).

---

### `.github/workflows/publish.yml` (new, config)

**Analog:** `.github/workflows/build.yml` — reuse its `on:`/`jobs:`/`steps:` shape, checkout/setup-node actions, and inline comment style; do not invent new conventions.

**Trigger pattern to copy** (adapt the `on:` block's structure, not its branches):
```yaml
on:
  workflow_dispatch:
```
Per D-01/D-025 in Security Domain, this workflow must never trigger on `push`/`pull_request` — `workflow_dispatch`-only (or tag-triggered) is the required shape, mirroring the Security Domain table's "Elevation of Privilege" mitigation note in RESEARCH.md.

**Steps to copy verbatim in structure:** `actions/checkout@v5`, `actions/setup-node@v6` (from `build.yml`), then `npm install`, `npm run build`, `npm publish --tag next` gated behind a `NPM_TOKEN` secret (RESEARCH.md State of the Art: classic token first, Trusted Publishing as a documented follow-up — do not implement OIDC Trusted Publishing this phase).

---

### `test/packaging/dependencyAllowlist.test.ts` (new, test)

**Analog:** `test/packageManifest.test.ts` (full file read this session — reproduced above under File Classification's source excerpt).

**Imports pattern to copy exactly:**
```typescript
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
```

**Root-resolution pattern to copy exactly** (note: `test/packageManifest.test.ts` lives one level deeper than `test/packaging/` will — recompute the `..` count for the new path, `test/packaging/*.test.ts` compiles to `dist-test/test/packaging/*.test.js`, same depth as `test/packageManifest.test.ts` → `dist-test/test/packageManifest.test.js`, so the existing two `..`-segments are correct unchanged):
```typescript
const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
```

**Core assertion pattern** (mirror this shape, applied to `dependencies` instead of `engines`):
```typescript
function packageManifest(): PackageManifest {
  const manifest: unknown = JSON.parse(readFileSync(join(REPOSITORY_ROOT, 'package.json'), 'utf8'));
  return manifest as PackageManifest;
}

test('keeps the production dependency tree exactly the vetted set (REL-03)', () => {
  // act
  const manifest = packageManifest();

  // assert
  assert.deepStrictEqual(Object.keys(manifest.dependencies).sort(), ['mqtt']);
});
```
Requirement ID convention: every `test()` title ends with a parenthesized requirement/decision ID, e.g. `(CONF-01)`, `(REL-04)`, `(D-17, SAFE-08)` — always include this for every new test in this phase.

---

### `test/packaging/licenseHeaders.test.ts` (new, test)

**Analog:** `test/packedArtifact.test.ts` (full file read — see excerpt above) for the tarball-reading mechanics; `test/accessories/hapImportScope.test.ts` (full file read) for the "read source text, assert a required/forbidden string" gate shape.

**Tarball-reading pattern to copy exactly** (`packedPaths()`/`PackReport` shape):
```typescript
interface PackReport {
  files: { path: string }[];
}

function packedPaths(): string[] {
  const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const [tarball] = JSON.parse(output) as [PackReport];
  return tarball.files.map((file) => file.path);
}
```

**License-content assertion** (RESEARCH.md Code Examples, extend directly):
```typescript
test('the shipped LICENSE explains the MIT/Apache boundary and includes both full texts (REL-05)', () => {
  const license = readFileSync(join(REPOSITORY_ROOT, 'LICENSE'), 'utf8');
  assert.match(license, /Apache License/);
  assert.match(license, /MIT License/);
});
```

**Per-file SPDX header gate — reuse `hapImportScope.test.ts`'s enumeration + floor pattern:**
```typescript
// Mirror hapImportScope.test.ts's typeScriptFilesUnder() recursion and SOURCE_FILE_FLOOR guard,
// but classify src/index.ts, src/settings.ts, src/platform.ts as Apache-derived (per RESEARCH.md's
// License Boundary table) and every other src/*.ts file as MIT, asserting each carries the
// matching SPDX header line.
const APACHE_DERIVED_FILES: readonly string[] = ['src/index.ts', 'src/settings.ts', 'src/platform.ts'];
```
Do not invent a new recursion helper — copy `typeScriptFilesUnder()` from `hapImportScope.test.ts` verbatim (adjusting only the directory list to `['src']`) rather than writing a second implementation.

---

### `test/documentation.test.ts` (new, test)

**Analog:** RESEARCH.md's own worked example under "Pattern 1: Static source-text gate," directly reusing `hapImportScope.test.ts`'s "read raw text, `assert.match`" shape but against `README.md` instead of TypeScript source.

**Pattern to copy exactly** (five separate `test()` blocks, one per REL-08 clause, per the RESEARCH.md gap table):
```typescript
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readme = readFileSync(join(REPOSITORY_ROOT, 'README.md'), 'utf8');

test('discloses that Homebridge stores the password in plain text (REL-08, D-023)', () => {
  assert.match(readme, /plain text/i);
});

test('recommends a child bridge and warns about pairing loss on re-creation (REL-08, D-036)', () => {
  assert.match(readme, /child bridge/i);
});

test('warns to keep the vendor alarm and notifications enabled during prerelease use (REL-08)', () => {
  assert.match(readme, /vendor alarm/i);
});

test('discloses that battery levels are estimates (REL-08)', () => {
  assert.match(readme, /estimate/i);
});

test('states there is no guarantee of Critical Alerts delivery (REL-08)', () => {
  assert.match(readme, /Critical Alerts/i);
});
```
Two of these five already pass against current README.md text (battery estimate at `README.md:227-231`, generic prerelease banner at `README.md:9`) — write all five regardless so the test file is the complete REL-08 checklist, not a partial one.

---

### `cucumber.json` (modify)

**Analog:** itself — the existing `"real"` profile is the model; the required fix is additive to `"default"` only.

**Current state** (full file read):
```json
{
  "default": {
    "paths": ["features/**/*.feature"],
    "import": ["dist-test/features/**/*.js"],
    "format": ["summary"]
  },
  "real": {
    "paths": ["features/real-pump/**/*.feature"],
    "import": ["dist-test/features/**/*.js"],
    "tags": "@real and @read-only",
    "format": ["summary"]
  }
}
```

**Required change** — add `"tags": "not @real"` to `"default"` in the same commit that adds the first `features/real-pump/*.feature` file (RESEARCH.md Pattern 3, confirmed as a live gap, not hypothetical):
```json
"default": {
  "paths": ["features/**/*.feature"],
  "import": ["dist-test/features/**/*.js"],
  "tags": "not @real",
  "format": ["summary"]
}
```

---

### `features/real-pump/*.feature` (new)

**Analog:** any existing top-level `.feature` file, e.g. `features/discovery.feature` or `features/degradedOperation.feature` — copy the `Feature:`/prose-paragraph/`Background:`/`Scenario:` structure and step-phrasing register (declarative, present-tense, no implementation detail in step text).

**Structure to copy** (from `features/authentication.feature`, full file read):
```gherkin
Feature: <capability under observation>

  <One or two prose paragraphs stating what the feature guarantees and why, in the project's
  established declarative voice — no "given/when/then" leakage into prose.>

  Background:
    Given <shared setup>

  Scenario: <behavior, stated as an outcome>
    Given <precondition>
    When <action>
    Then <observable result>
```

**Tagging requirement (D-04, mandatory, not a style choice):** every scenario file under `features/real-pump/` must carry `@real @read-only` at the `Feature:` level (or repeated per-scenario), matching `cucumber.json`'s `"real"` profile's `"tags": "@real and @read-only"` filter exactly, or the scenario silently never runs under either profile.

---

### `features/real-pump/support/realTransport.ts` (new)

**Analog:** `features/support/world.ts` (imports/composition-seam pattern, read this session — excerpt above) and `features/support/fakeShadowBroker.ts` / `features/support/fakeRestApi.ts` for the fake-vs-real transport shape being replaced.

**Composition-seam reuse pattern** (from `world.ts`, read this session): the plugin's account runtime is built through `createAccountRuntimeFromConfig` in `src/runtime/accountRuntime.js`, taking `ProtocolConstants` as an injected dependency — this is the seam `realTransport.ts` must also go through, pointing `ProtocolConstants` at the real vendor endpoints instead of the loopback ones `world.ts` uses:
```typescript
import { createAccountRuntimeFromConfig } from '../../../src/runtime/accountRuntime.js';
import type { ProtocolConstants } from '../../../src/protocol.js';
```

**Command-blocking requirement (D-04, hard requirement, not operator discipline):** wrap whatever `CommandPort` (`src/runtime/commandPort.js`, imported by `world.ts`) the real transport would otherwise expose so every command-issuing call throws before any network request is made — do not rely on scenarios simply not calling it. Structure this the same way `world.ts` composes fakes: a factory function returning an object satisfying the port's interface, where the command methods are the only ones overridden to throw.

**Do not build a second `World` type** — reuse `features/support/world.ts`'s `World` shape for its non-fake parts (scenario clock, observation log, cleanup ordering via `After` hooks) per RESEARCH.md's explicit Anti-Pattern warning; only the transport composition differs.

---

### `SECURITY.md` (new)

**Analog:** `.github/ISSUE_TEMPLATE/*.md` for the plain-Markdown, no-frontmatter-beyond-what's-required prose style GitHub recognizes at these repo-root/`​.github/` conventional paths. No direct content analog exists in this repo (best-effort-support policy is new prose) — write from RESEARCH.md's REL-06 requirement (best-effort support, private security-advisory reporting) plus D-025's locked decision text in `.planning/intel/decisions.md`.

**Automation to pair with it** (RESEARCH.md Code Examples, `gh` CLI already authenticated):
```bash
gh api --method PUT /repos/acolomba/homebridge-basement-guardian/private-vulnerability-reporting
```

---

### `dev/prep/g00{1,2}-*-checklist.md` and `dev/prep/g003-g004-paired-home-checklist.md` (new)

**Analog:** `.planning/phases/04-pump-records-and-official-controls/04-UAT.md` — specifically its per-test structure (`test:` / `expected:` / `why_human:` / `status:` / `verified:` / `evidence:`) and its "Deferred session, 2026-09-04" section, which is explicitly named in CONTEXT.md as "the model for how the G-003/G-004 prep checklist should be structured."

**Structure to copy** (from `04-UAT.md`, read this session):
```markdown
### <n>. <short title of what is being measured>

test: <exact procedure a future session runs, stated as an instruction>

expected: <the specific, falsifiable outcome that constitutes a pass>

why_human: <why no automated test or fake can answer this — ties back to the real-hardware or
real-paired-home constraint>

status: pending
```

**Forcing-harness precedent to reference, not repeat wholesale** (from `04-UAT.md`'s "Deferred session" section, read this session): the "build it, verify it, use it, revert it, never commit it" discipline for any temporary measurement tooling — cite this discipline explicitly in the G-001/G-002 checklists if they recommend a similar forcing harness (e.g., for G-002's still-unvalidated water-level codes `0`, `7`, `15`, `31`), rather than restating the whole mechanism.

**G-002 specific content requirement:** the checklist must enumerate exactly the four unvalidated codes (`0`, `7`, `15`, `31`) and the flood threshold, and note the one already-measured data point (the `1`→`3` transition observed 2026-08-31) as the sole existing evidence, per CONTEXT.md D-03.

---

### `LICENSE` (rewrite)

**Analog:** itself — current file is Apache-2.0 text only (full boilerplate, read this session, excerpt above).

**Required content** (RESEARCH.md License Boundary table + Code Examples' test assertions): keep the full Apache-2.0 text, append the full MIT text, and add prose explaining the file-level boundary — `src/index.ts`, `src/settings.ts`, `src/platform.ts` are Apache-derived (template-modified); everything else under `src/` is original MIT work. This must satisfy both `assert.match(license, /Apache License/)` and `assert.match(license, /MIT License/)` from `test/packaging/licenseHeaders.test.ts`.

---

### `package.json` (modify)

**Analog:** itself (full file read this session, reproduced above).

**Exact fields to change** (D-01, D-035):
```jsonc
"private": false,        // was: true
"license": "SEE LICENSE IN LICENSE",  // was: "Apache-2.0"
```
If a `NOTICE` file is added, also add it to `files`:
```jsonc
"files": [
  "dist",
  "config.schema.json",
  "CHANGELOG.md",
  "NOTICE"
]
```
Any `files` change must be mirrored into `test/packedArtifact.test.ts`'s `ALLOWED_ROOT_FILES` array (currently `['CHANGELOG.md', 'LICENSE', 'README.md', 'config.schema.json', 'package.json']`) or that existing test starts failing — this is a modification to an existing analog file, not a new one, and is in scope for this phase's REL-05 work.

---

### `README.md` (modify)

**Analog:** itself — the existing "Values that are estimates" section (`README.md:220-235`, read this session, excerpt above) is the register/tone/structure to match for new prose: short declarative paragraphs, one topic per paragraph, concrete numbers over vague qualifiers.

**Gap table to close** (RESEARCH.md, copied verbatim as the authoritative to-do list):

| REL-08 clause | Action |
|---|---|
| Plaintext password storage | Already in `config.schema.json`; add a one-line parity mention in README's configuration section regardless |
| Child bridge recommendation + pairing-loss warning | New section — no existing "bridge" mention anywhere in README.md |
| Prerelease: keep vendor alarm/notifications enabled | Extend the existing "in development" banner (`README.md:9`) with the specific instruction |
| Battery levels are estimates | Already present and correct (`README.md:227-231`) — no change needed |
| No Critical Alerts guarantee | New section — no existing mention |

---

### `dev/README.md` (modify)

**Analog:** itself — the existing "Networking" section (`dev/README.md:46-48`, read this session, full text: "The container uses host networking because HAP pairing needs mDNS and direct reachability from the phone. Only the bridge itself is exposed to the network; the UI stays on loopback.").

**Addition needed:** extend this section (same heading, same paragraph style) with the host-machine prerequisite — a note that a host lacking multicast (no firewall path, no bridged network) will silently fail pairing with 0 responders, a suggested fail-fast precheck (`avahi-browse` or `dns-sd -B`), and the tunnel-based workaround for a host without multicast, per the folded todo in CONTEXT.md.

---

### `src/*.ts` SPDX headers (modify, cross-cutting)

**No analog exists** — this is a new convention this phase introduces. Apply the two-tier scheme from RESEARCH.md's License Boundary table directly: `src/index.ts`, `src/settings.ts`, `src/platform.ts` get an Apache-2.0 SPDX header plus a one-line "Modified from the Homebridge plugin template" note; every other `.ts` file under `src/` gets an MIT SPDX header. `test/packaging/licenseHeaders.test.ts` (above) is the gate that enforces this — write the header convention and the test together.

## Shared Patterns

### Static source-text gate (the dominant pattern for this entire phase)
**Source:** `test/accessories/hapImportScope.test.ts` (full file read this session)
**Apply to:** `test/packaging/licenseHeaders.test.ts`, `test/documentation.test.ts`, and any other "does this text exist" check this phase needs.
```typescript
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
```
The project's established convention: read raw file text with `readFileSync`, assert with `assert.match`/`assert.deepStrictEqual` on strings or derived arrays — never parse an AST, never execute the code under test, for these documentation/packaging/licensing gates.

### Requirement-ID test-title convention
**Source:** every existing `test/*.test.ts` file read this session
**Apply to:** every new `test()` in this phase
Every test title ends with a parenthesized ID: `(CONF-01)`, `(REL-04)`, `(D-17, SAFE-08)`. New tests must cite the REL-xx requirement (and a D-xx decision where one applies) they satisfy.

### `REPOSITORY_ROOT` resolution
**Source:** `test/packageManifest.test.ts`, `test/packedArtifact.test.ts`, `test/accessories/hapImportScope.test.ts` (all read this session)
**Apply to:** every new `test/**/*.test.ts` file
```typescript
const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..' /* , '..' if one level deeper */);
```
Count `..` segments to match the compiled file's actual depth under `dist-test/` — `test/packageManifest.test.ts` and `test/packedArtifact.test.ts` use two; `test/accessories/hapImportScope.test.ts` uses three because it's one directory deeper. `test/packaging/*.test.ts` and `test/documentation.test.ts` are at the same depth as `test/packageManifest.test.ts`, so two `..` segments is correct.

### CI matrix: version-pinned cell without touching the lockfile
**Source:** `.github/workflows/build.yml` (existing `node-version` dimension) + RESEARCH.md Pattern 2
**Apply to:** `.github/workflows/build.yml`'s new `homebridge-version` dimension
```yaml
- run: npm install
- name: Pin matrix-selected Homebridge version
  run: npm install --no-save homebridge@${{ matrix.homebridge-version }}
```
`--no-save` is load-bearing: it keeps `package-lock.json` (pinned to `^2.4.0`) untouched by the CI job.

### "Build it, verify it, use it, revert it, never commit it" harness discipline
**Source:** `.planning/phases/04-pump-records-and-official-controls/04-UAT.md`, "Deferred session, 2026-09-04" section (read this session)
**Apply to:** any temporary measurement tooling the G-001/G-002 checklists recommend for a future session

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/*.ts` SPDX headers | source (cross-cutting) | file-I/O | New convention this phase introduces; no prior file-header pattern exists in this codebase to copy — RESEARCH.md's License Boundary table is the authoritative source of the classification instead |
| `SECURITY.md` content | config (repo governance) | request-response (docs) | No existing best-effort-support/security-policy prose in this repo; only structural analog (`.github/ISSUE_TEMPLATE/*.md`'s plain-Markdown convention) applies, not content |
| `.github/workflows/publish.yml` | config | event-driven | No existing publish workflow in this repo; `build.yml` supplies structure (checkout/setup-node/steps) but not publish-specific content (npm token, `--tag next`) |

## Metadata

**Analog search scope:** `.github/workflows/`, `test/`, `test/accessories/`, `features/`, `features/support/`, repo root (`package.json`, `LICENSE`, `README.md`, `dev/README.md`, `cucumber.json`), `.planning/phases/04-pump-records-and-official-controls/`
**Files scanned:** ~20 read in full or in targeted excerpt this session
**Pattern extraction date:** 2026-09-04
