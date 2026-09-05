# Phase 6: Validated Release Candidate - Research

**Researched:** 2026-09-04
**Domain:** npm package release engineering for a Homebridge plugin — CI compatibility matrices, license/privacy/secret auditing of a packed artifact, GitHub release governance, and an opt-in real-hardware Cucumber suite
**Confidence:** MEDIUM-HIGH — most claims are grounded in this repository's own files (read this session) or official docs/GitHub source fetched this session; a few release-workflow conveniences (npm trusted publishing eligibility for a brand-new package) rest on unofficial sources and are flagged `[ASSUMED]`

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Publish Scope (D-01).** Phase 6 stops at "ready to publish." It flips `package.json`'s
`private: true` off, corrects the `license` field to `SEE LICENSE IN LICENSE` (per D-035), and
wires a publish-capable GitHub Actions workflow — but no step in this phase's own execution
actually runs `npm publish`. The first real `0.x` prerelease to the npm `next` dist-tag is a
deliberate action the maintainer takes afterward. Reversibility: reversible.
- Researched: npm now requires an explicit `--tag` on any prerelease publish (no more relying on
  the version string alone), so a manual or workflow-triggered `npm publish --tag next` is the
  standard shape either way — this doesn't change the decision, just confirms the mechanism.

**CI Compatibility Matrix (D-02).** Extend the existing `.github/workflows/build.yml`
Node-version matrix (`22.x`, `24.x`) with a second matrix dimension for three pinned Homebridge
versions — minimum-supported 1.8.x, latest 1.x, and current 2.x — each installed as a
matrix-selected devDependency, running the same lint/test/build steps per combination. Mirrors
how the Node dimension already works rather than adding a separate, narrower compatibility job.
Reversibility: reversible.
- Researched: no official Homebridge-provided template or documented convention exists for this;
  the project is designing its own approach. Confirmed as a relevant fact: Homebridge 2.x renamed
  the HAP dependency to `@homebridge/hap-nodejs`, which this project's `api.hap`-only rule (no
  direct HAP-NodeJS import) already avoids being broken by.

**Hardware-Gate Prep Work (D-03).** Phase 6 writes ready-to-run checklists/scripts for each open
hardware/real-home gate, even though it cannot close any of them itself:
- **G-001** (Alarm Mute): the exact measurement procedure for acknowledgement, state, duration,
  latency, and failure behavior — written but not executed.
- **G-002** (water-level codes): the checklist for the still-unvalidated codes `0`, `7`, `15`,
  `31` and the flood threshold.
- **G-003/G-004** (paired Apple Home): the Contact Sensor and Leak Sensor notification checks,
  plus Phase 3's open flood-automation check, in one combined session recipe.
A future hardware or paired-home session should be able to execute directly from these artifacts
without rediscovering context. Reversibility: reversible.

**Real-Pump Suite Depth (D-04, REL-09).** Build the full REL-09 scope this phase, not a skeleton:
an opt-in `@real @read-only` Cucumber profile under `features/real-pump/` observing discovery,
initial REST state, full shadow state, heartbeats, natural updates, restart, and shutdown against
the one real Gemini on the account. No scenario requires a natural status change to pass. All
command paths are hard-blocked in the test transport itself — not left to operator discipline.
Reversibility: reversible.

**Folded Todos:**
- **Record G-002 natural water-level evidence** — folds into D-03: becomes the concrete G-002
  checklist artifact, listing exactly which codes remain unobserved and what a future session
  needs to record.
- **Define cloud request header policy** — folds into the REL-03/REL-04 privacy/telemetry review:
  define and document the user-agent string and any additional headers for Auth0, the vendor REST
  API, and (if needed) the MQTT WebSocket handshake. Use `homebridge-adt-pulse` as comparative
  research only — do not assume its Chrome-impersonation approach fits this integration.
- **State the harness mDNS prerequisite in `dev/README.md`** — folds in as Phase 6 dev-docs work:
  document the multicast/mDNS prerequisite for pairing, the firewall ports involved, and the
  tunnel form needed on a host without multicast.

### Claude's Discretion
- Exact CI job/workflow structure for the Homebridge-version matrix (separate job vs. matrix
  expansion; how the pinned versions are installed).
- Exact tooling used for the license/secret/identifier audits (REL-04, REL-05).
- Structure and wording of the G-001/G-002/G-003/G-004 prep checklists, as long as they are
  directly executable by a future session.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. All three matched pending todos were folded into
this phase's decisions rather than deferred further.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REL-01 | Node/Homebridge compatibility matrix, no runtime `homebridge-lib`/HAP-NodeJS import | Already satisfied by existing code (verified this session); only the CI matrix dimension is new work — see Architecture Patterns § CI Matrix, Common Pitfalls § Homebridge 1.8.0 engines mismatch |
| REL-02 | Deterministic unit + Cucumber fake-pump coverage, sanitized fixtures | Test suite already exists and is comprehensive; this requirement is mostly "keep it green across the new matrix," not new test infrastructure — see Validation Architecture |
| REL-03 | No telemetry/analytics; direct dependencies pass a telemetry review | Single production dependency (`mqtt`); Don't Hand-Roll § production-dependency allowlist test gives an automatable review pattern |
| REL-04 | Secret/identifier audits across public, planning, fixture, log, packed-package surfaces | `test/packedArtifact.test.ts` already audits packed *paths*; gap is packed *content* (secrets) and the cloud request-header policy — see Common Pitfalls, Code Examples |
| REL-05 | Mixed MIT/Apache licensing, headers, notices, aligned `SEE LICENSE IN LICENSE` metadata | LICENSE today is Apache-only text; concrete template-derived vs. original file boundary identified from git history — see Architecture Patterns § License Boundary |
| REL-06 | Best-effort support via issue templates, private security advisories, Homebridge Verified readiness | Verified-plugin criteria fetched and dated; issue templates already meet most of it; SECURITY.md and private vulnerability reporting are the concrete gaps — see Code Examples |
| REL-07 | Prerelease metadata, safe-user warnings, release notes, gates recorded before `1.0.0` | D-01/D-026 already define the shape; this phase wires the mechanism, not the first publish — see Architecture Patterns § Publish Workflow |
| REL-08 | User-facing docs: plaintext password, child bridge, prerelease/vendor-alarm, battery estimates, no Critical Alerts guarantee | README.md audited line-by-line this session; two of five disclosures already present, three are missing — see Runtime State Inventory-style gap table under Common Pitfalls |
| REL-09 | Opt-in real-pump Cucumber suite, commands blocked in the transport | `cucumber.json`'s `real` profile is already scaffolded; `features/real-pump/` itself does not exist yet — see Common Pitfalls § untagged real-pump scenarios leaking into CI |
</phase_requirements>

## Summary

Phase 6 is a packaging, testing-matrix, and documentation phase, not a library-integration phase.
There is no new runtime framework to learn — the risk here is almost entirely in details that are
easy to get subtly wrong: an `engines` mismatch that produces a confusing CI warning, a Cucumber
tag filter that lets an opt-in suite slip into public CI, a license file that only tells half the
story, or a packed-artifact test that checks file *names* but not file *contents* for secrets.
Every one of those specific traps was found already latent in this repository during research (not
hypothetical) and is documented below with the exact file and line.

The good news measured this session: REL-01's substance (no `homebridge-lib`, no runtime
HAP-NodeJS import, correct `engines`) is **already done** — Phase 6 only adds the CI matrix
dimension. REL-02's test infrastructure (`node:test` unit suite + Cucumber fake-pump suite, both
wired into `npm test`) is **already comprehensive** — Phase 6's job is to keep it green across the
new matrix, not build new test infrastructure. REL-04's packed-file allowlist
(`test/packedArtifact.test.ts`, decision `D-21` from Phase 1) **already exists** and passed the
`npm pack --dry-run` audit this session with the expected file set. REL-09's Cucumber profile
wiring (`cucumber.json`'s `"real"` key) **already exists** — only the `features/real-pump/`
content and a tag-exclusion fix to the `"default"` profile are missing.

What's genuinely new work: the Homebridge-version CI matrix dimension; a real (not path-only)
secret/content scan of the packed tarball; the MIT/Apache license split with per-file headers and
a rewritten LICENSE explaining the boundary; SECURITY.md plus enabling GitHub's private
vulnerability reporting; three of five REL-08 documentation disclosures; the G-001–G-004 prep
checklists; and the full `features/real-pump/` suite content.

**Primary recommendation:** Extend, don't rebuild. Every audit this phase needs (packaging
allowlist, dependency allowlist, license headers, README disclosures) fits the same "static gate
over source text" pattern this codebase already uses for its HAP-import and packaging gates —
write one small `node:test` file per audit rather than reaching for an external license/secret
scanning package. The only external tool genuinely needed is `trufflehog` (already a project
dependency via `.pre-commit-config.yaml` and the documented filesystem-scan technique in
`CLAUDE.md`), run once against the extracted packed tarball instead of just the git tree.

## Architectural Responsibility Map

This phase has no browser/API/database tiers — it operates on the build, package, and repository
governance surfaces. Tiers are relabeled accordingly.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Node/Homebridge compatibility verification | CI Pipeline (`.github/workflows/build.yml`) | Package Manifest (`engines`) | The matrix *runs* the check; the manifest *declares* the claim the matrix verifies |
| Telemetry/dependency review | Package Manifest (`dependencies`) | Test Harness (allowlist test) | The dependency tree is the artifact under review; a test pins the allowlist so a future `npm install` can't silently widen it |
| Secret/identifier audit | Distributed Artifact (packed tarball) | Test Harness + CI Pipeline | Paths are checked in-repo (`packedArtifact.test.ts`); content secrets require inspecting the built tarball, which only exists after `npm pack` |
| License/header/notice audit | Distributed Artifact (LICENSE, per-file headers) | Test Harness | Headers live in `src/`; the packed LICENSE is the user-facing surface; a test can assert both |
| Best-effort support / Verified readiness | Repository Governance (GitHub settings, `SECURITY.md`, issue templates) | — | These are GitHub repo-level artifacts and settings, not code |
| Prerelease/publish mechanics | CI Pipeline (publish workflow) | Package Manifest (`private`, `license`, `version`) | The workflow performs the act; the manifest fields gate whether it's even legal |
| Real-pump opt-in suite | Test Harness (`features/real-pump/`, `cucumber.json`) | CI Pipeline (must stay excluded) | The suite's content lives in the test tier, but its exclusion from public CI is a CI-pipeline-level guarantee |
| User-facing safety/privacy disclosures | Documentation (`README.md`, `config.schema.json`) | — | `config.schema.json`'s `headerDisplay`/`description` fields are also user-facing (rendered in the Homebridge UI), so some REL-08 clauses may already be satisfied there |

## Standard Stack

No new runtime or build framework is needed. Every capability this phase requires is already a
devDependency or an OS-level tool already used by this project's own `.pre-commit-config.yaml`
and `CLAUDE.md`.

### Core (already present — verified this session)

| Tool | Installed version | Purpose | Why no addition needed |
|---------|---------|---------|--------------|
| `@cucumber/cucumber` | `^13.2.1` [VERIFIED: package.json:52] | Runs both the fake-pump and (new) real-pump suites | `cucumber.json` already has a `"real"` profile key (`cucumber.json:7-12`, read this session) — REL-09 needs content, not new tooling |
| `mqtt` | `^5.15.2` [VERIFIED: package.json:73] | The only production dependency; also usable by the real-pump suite's transport | `npm view mqtt version` confirms `5.15.2` is current [VERIFIED: npm registry, 2026-09-04] |
| `node:test` | Node 22/24 built-in | Unit test runner for every new audit test (packaging, dependency allowlist, license headers, README disclosures) | Project convention (`.claude/rules/typescript-unit-testing.md`) forbids adding another test runner |
| `trufflehog` | pinned via `.pre-commit-config.yaml`'s hook repo | Secret scanning | Already the project's chosen tool (`CLAUDE.md`'s documented filesystem-scan workaround); reuse it against the packed tarball's extracted contents rather than adding a second scanner |
| `gh` CLI | `2.97.0` [VERIFIED: `gh --version`, this session] | Enabling GitHub private vulnerability reporting via `gh api`, creating GitHub Releases | Already authenticated with `repo` + `workflow` scopes [VERIFIED: `gh auth status`, this session] |

### Supporting (already-installed devDependencies whose versions this phase must pin per matrix cell)

| Library | Verified current version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `homebridge` | `1.8.0` exists; `1.11.4` is latest 1.x; `2.4.0` is latest stable 2.x [VERIFIED: `npm view homebridge versions/dist-tags`, 2026-09-04] | The three pinned CI-matrix cells (D-02: minimum, latest-1.x, current-2.x) | Install each version explicitly per matrix cell — see Architecture Patterns § CI Matrix |
| `@homebridge/hap-nodejs` | `2.2.3` current vs. `2.2.2` pinned [VERIFIED: `npm view`, this session] | Devtest-only HAP import (`hapWriteFidelity.test.ts`, `hapImportScope.test.ts`, `features/support/fakeHap.ts`) | One patch behind; not blocking, note for a routine bump, not new research |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-written `node:test` audits for license headers / dependency allowlist / README phrases | `license-checker`, `licensee`, or a markdown-linting rule pack | The project already solved an identical problem (packed-file allowlist, `D-21`) with a hand-written `node:test` file rather than a library; adding a scanner package here would be the first exception to that pattern and adds a new dependency (with its own legitimacy audit) for a check that's ~20 lines of code |
| `trufflehog` filesystem scan of the extracted tarball | A hosted secret-scanning SaaS (GitGuardian, etc.) | Overkill for a single-maintainer plugin; `trufflehog` is already vetted and wired into this repo's workflow |
| `npm install homebridge@<pinned>` per matrix cell (this session's recommendation) | A separate compatibility-testing framework (e.g. `verdaccio` + fixture installs) | No such framework is Homebridge-specific or documented by the Homebridge project itself (confirmed by research — no official template exists); a plain version override is simplest and mirrors the existing Node-version matrix pattern |

**Installation:** None. No new `npm install` is required for this phase's tooling.

## Package Legitimacy Audit

**No new external packages are introduced by this phase.** Every tool this research recommends
(`node:test`, `trufflehog`, `gh` CLI, pinned versions of the already-approved `homebridge`
devDependency) is already present in the repository or its CI/pre-commit tooling. The Package
Legitimacy Gate protocol is therefore not applicable — there is nothing new to run
`gsd_run query package-legitimacy check` against.

If a planner or executor later decides a license-scanning package (e.g. `license-checker`) is
worth adding despite the Alternatives Considered guidance above, that decision must re-trigger
this gate at plan time.

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────┐
                    │   package.json (manifest)   │
                    │  private:false, license:    │
                    │  "SEE LICENSE IN LICENSE",  │
                    │  files: [...+ NOTICE?]      │
                    └──────────────┬──────────────┘
                                   │ read by
                                   ▼
   ┌───────────────────────────────────────────────────────────┐
   │            .github/workflows/build.yml (CI)                │
   │  ┌────────────────────┐   ┌───────────────────────────┐   │
   │  │ Node × Homebridge   │   │  Publish workflow          │  │
   │  │ compat matrix       │   │  (manual/tag-triggered,    │  │
   │  │ (REL-01, REL-02)    │   │  never auto-runs `publish`)│  │
   │  │ node 22.x/24.x ×    │   │  npm publish --tag next    │  │
   │  │ hb 1.8.0/1.11.4/    │   │  (REL-07, D-01/D-026)      │  │
   │  │ 2.4.0               │   └───────────────────────────┘  │
   │  └─────────┬───────────┘                                  │
   └────────────┼────────────────────────────────────────────────┘
                │ runs
                ▼
   ┌───────────────────────────────────────────────────────────┐
   │                    npm run check                           │
   │  typecheck → lint → fallow → format:check → test           │
   │  test = test:unit (node:test) + test:cucumber (default     │
   │  Cucumber profile, MUST exclude @real — see Pitfalls)      │
   └────────────┬────────────────────────────────────────────────┘
                │ on success, produces
                ▼
   ┌───────────────────────────────────────────────────────────┐
   │             npm pack --dry-run --json (artifact)           │
   │  test/packedArtifact.test.ts: path allowlist (existing)    │
   │  NEW: content secret scan (trufflehog filesystem mode      │
   │  against extracted tarball) — REL-04                       │
   │  NEW: license header + LICENSE text assertions — REL-05    │
   └────────────┬────────────────────────────────────────────────┘
                │ gates
                ▼
   ┌───────────────────────────────────────────────────────────┐
   │        G-001..G-004 checklists (written, not executed)     │
   │        + real-pump Cucumber suite (opt-in, maintainer-run) │
   │        └── 1.0.0 remains blocked until a human runs these  │
   └───────────────────────────────────────────────────────────┘
```

### Recommended Project Structure (additions only)

```
.github/
├── workflows/
│   ├── build.yml           # extend: add homebridge-version matrix dimension
│   └── publish.yml         # new: workflow_dispatch-triggered, never auto-runs
├── SECURITY.md              # new (root or .github/, both are GitHub-recognized locations)
features/
├── real-pump/               # new — see Code Examples for the transport-blocking pattern
│   ├── discovery.feature
│   ├── heartbeats.feature
│   ├── lifecycle.feature
│   └── support/
│       └── realTransport.ts # wraps the real REST/shadow transports, hard-blocks command paths
test/
├── packaging/
│   ├── dependencyAllowlist.test.ts   # new — REL-03, mirrors D-21's pattern
│   └── licenseHeaders.test.ts        # new — REL-05
├── documentation.test.ts             # new — REL-08, greps README.md for required disclosures
dev/
└── prep/
    ├── g001-alarm-mute-checklist.md  # new — D-03
    ├── g002-water-level-checklist.md # new — D-03
    └── g003-g004-paired-home-checklist.md # new — D-03
LICENSE                       # rewritten: explain boundary, include both full texts
NOTICE                        # new — third-party (template) attribution; MUST be added to
                               # package.json "files" (npm does not force-include NOTICE)
```

### Pattern 1: Static source-text gate (already established in this codebase)

**What:** A `node:test` case that reads a file's raw text (not its parsed AST or runtime
behavior) and asserts a required string/absence, exactly like the existing HAP-import scope gate.
**When to use:** REL-05 (license headers), REL-08 (README disclosures) — any audit that is
fundamentally "does this text exist," not "does this code behave correctly."
**Example — the existing pattern this phase's new gates should copy:**
```typescript
// Source: test/accessories/hapImportScope.test.ts (read this session, pattern only, not verbatim)
// Confirms only the file's IMPORT is checked, not "any mention" — the file names the forbidden
// modules in its own prose without failing itself.
```
**New gate to add, same shape (REL-08 example):**
```typescript
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readme = readFileSync('README.md', 'utf8');

test('discloses plaintext password storage (REL-08, D-023)', () => {
  // act & assert
  assert.match(readme, /plain text/i);
});
```

### Pattern 2: Version-pinned matrix cell without touching the lockfile

**What:** GitHub Actions matrix strategy with two independent dimensions (`node-version`,
`homebridge-version`), installing the matrix-selected Homebridge version with `--no-save` after
the normal `npm install` so the committed `package-lock.json` (which pins the `^2.4.0` range) is
never mutated by a CI job.
**When to use:** REL-01's CI matrix (D-02).
**Example:**
```yaml
# Source: pattern derived from existing .github/workflows/build.yml (read this session) +
# GitHub Actions matrix documentation [CITED: docs.github.com actions/using-jobs/using-a-matrix]
strategy:
  fail-fast: false
  matrix:
    node-version: [22.x, 24.x]
    homebridge-version: ['1.8.0', '1.11.4', '2.4.0']
steps:
  - uses: actions/checkout@v5
  - uses: actions/setup-node@v6
    with:
      node-version: ${{ matrix.node-version }}
  - run: npm install
  - name: Pin matrix-selected Homebridge version
    run: npm install --no-save homebridge@${{ matrix.homebridge-version }}
  - run: npm run check
```
Homebridge `1.8.0`'s own `engines.node` is `^18.15.0 || ^20.7.0` [VERIFIED: `npm view homebridge@1.8.0 engines`, 2026-09-04] — it does **not** declare Node 22/24 support. With no `.npmrc` `engine-strict` setting present in this repo [VERIFIED: no `.npmrc` file found, this session], `npm install` only prints an `EBADENGINE` warning here, it does not fail the build. Document this as an *expected, benign* warning in that matrix cell rather than treating it as a bug to chase — see Common Pitfalls.

### Pattern 3: Cucumber tag exclusion for an opt-in profile

**What:** The `"default"` Cucumber profile must exclude `@real`-tagged scenarios so that creating
`features/real-pump/*.feature` files does not silently pull them into `npm test` / CI.
**When to use:** REL-09 (D-04), immediately when the first real-pump feature file is added.
**Example:**
```json
// Source: cucumber.json (read this session) — CURRENT STATE, the gap this phase must close
{
  "default": {
    "paths": ["features/**/*.feature"],
    "import": ["dist-test/features/**/*.js"],
    "format": ["summary"]
    // MISSING: no "tags" filter — features/real-pump/**/*.feature WILL match this glob
    // and run under `npm test` the moment those files exist, once tagged @real.
  },
  "real": {
    "paths": ["features/real-pump/**/*.feature"],
    "tags": "@real and @read-only",
    "import": ["dist-test/features/**/*.js"],
    "format": ["summary"]
  }
}
```
**Required fix** (add a `tags` exclusion to `"default"`):
```json
{
  "default": {
    "paths": ["features/**/*.feature"],
    "import": ["dist-test/features/**/*.js"],
    "tags": "not @real",
    "format": ["summary"]
  }
}
```
Cucumber.js runs the `"default"` profile automatically whenever `cucumber-js` is invoked with no
`--profile`/`-p` flag [CITED: raw.githubusercontent.com/cucumber/cucumber-js/main/docs/profiles.md,
fetched this session: "if we just run `cucumber-js` with no arguments, it will pick up our
profiles and use the `default` one"]. `package.json`'s `test:cucumber` script runs bare
`cucumber-js` [VERIFIED: package.json:46, `"test:cucumber": "npm run build:test && cucumber-js"`],
so this is not a hypothetical risk — it is the exact script the CI matrix will invoke.

### License Boundary (REL-05) — concrete file classification from git history

Traced via `git show <initial-import-commit>:<path>` diffed against the current working tree
[VERIFIED: git history, this session]:

| File | Status | License |
|------|--------|---------|
| `src/index.ts` | Near-verbatim from the Homebridge plugin template (only reordered imports, one type annotation removed) [VERIFIED: `git show 6adc3c2:src/index.ts` vs. current, this session] | Apache-2.0 (template-derived, modified — mark "Changed" per Apache §4) |
| `src/settings.ts` | Near-verbatim from template (one comment reworded) [VERIFIED: same diff, this session] | Apache-2.0 (template-derived, modified) |
| `src/platform.ts` | Heavily rewritten (150 → 625 lines; 600 insertions / 125 deletions since the template) but still traces its lineage to the template file [VERIFIED: `git diff --stat 6adc3c2 -- src/platform.ts`, this session: `1 file changed, 600 insertions(+), 125 deletions(-)`] | Apache-2.0 per D-035's explicit rule: "If the implementation replaces all material from the template, reexamine the Apache preservation requirement" — it has NOT replaced all material (the file is still platform.ts, still the `DynamicPlatformPlugin` implementation the template scaffolded), so the safer reading is to keep it Apache-derived and mark it "Changed" |
| `src/platformAccessory.ts` | Deleted (replaced entirely by `src/accessories/`) | N/A — no longer exists to license |
| Everything else under `src/accessories/`, `src/cloud/`, `src/device/`, `src/persistence/`, `src/runtime/`, plus `src/config.ts`, `src/logging.ts`, `src/protocol.ts`, `src/protocol.json` | Original, post-template (no equivalent file existed in the initial import) [VERIFIED: `find src -maxdepth 1` vs. the initial-import file list, this session] | MIT (original standalone work) |

**Recommendation:** three files (`index.ts`, `settings.ts`, `platform.ts`) carry an Apache-2.0
SPDX header plus a short "Modified from the Homebridge plugin template" note; every other `.ts`
file under `src/` carries an MIT SPDX header. This gives REL-05's required "file-level license
identifiers to distinguish Apache-derived files from original MIT files" [quoting `D-035`,
`.planning/PROJECT.md:169`, read this session] a concrete, git-history-grounded answer rather than
an invented one.

### Anti-Patterns to Avoid
- **Copying `homebridge-adt-pulse`'s request-header strategy.** Its live source sets
  `Sec-Fetch-Site`, `Sec-Fetch-Dest`, `Sec-Fetch-Mode`, `Origin`, `Referer`, and a fabricated
  Dynatrace telemetry header (`generateFakeDynatracePCHeaderValue`) to make its HTTP client look
  like a real browser session [VERIFIED: fetched `raw.githubusercontent.com/mrjackyliang/homebridge-adt-pulse/main/src/lib/api.ts`, this session — no literal `User-Agent` string was found, but the Sec-Fetch/Origin/Referer/fake-telemetry set is a browser-impersonation pattern]. This project's own `04-CONTEXT.md`-adjacent CLAUDE.md guidance and the CONTEXT.md's explicit warning ("do not assume its Chrome-impersonation approach fits this integration") are both satisfied by NOT doing this — see Code Examples for the honest alternative already half-built into this codebase.
- **Adding `engine-strict` or otherwise trying to make the Homebridge 1.8.0 × Node 22/24 cell "pass cleanly."** The mismatch is a fact about the `homebridge` package's own declared `engines`, not a bug in this project. Suppressing or working around the warning would hide a real (if currently harmless) signal; documenting it is the correct response.
- **Building a second HAP stand-in or a second Cucumber `World` for the real-pump suite from scratch.** `features/support/world.ts`'s `World` type shape should be reused for its non-fake parts (clock, observations, cleanup); only the transport needs to be real instead of fake, per the existing Test Strategy section of `PROJECT.md`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| "Does the packed tarball contain a hallucinated/expanded file set" | A new packaging test from scratch | Extend `test/packedArtifact.test.ts` (already exists, already reads `npm pack --dry-run --json`) | Duplicating this logic risks the two gates drifting; the file already encodes the D-21 allowlist rationale in its own comments |
| "Does the production dependency tree stay small and vendor-scoped" | A hand-maintained prose list in a doc that goes stale | A `node:test` file asserting `Object.keys(require('../package.json').dependencies)` equals exactly `['mqtt']`, mirroring `packageManifest.test.ts`'s style | Same pattern this repo already uses for `engines`/`main`/`keywords` (`test/packageManifest.test.ts`, read this session) — a failing test on `npm install <new-runtime-dep>` is a stronger gate than a comment |
| "Are dependency licenses GPL-clean" | Adding a `license-checker` devDependency | A one-off `node -e` script (or a short `node:test`) reading `package-lock.json`'s `packages[*].license` fields, scoped to the production tree only (`npm ls --omit=dev --all` gives the exact production subtree) | Measured this session: 398 packages total, with exactly one `LGPL-3.0-only` package (`eslint-plugin-sonarjs`) — and it is dev-only, not in the `mqtt` production tree [VERIFIED: `npm ls --omit=dev mqtt` shows only `mqtt@5.15.2` and its transitive deps; `npm ls --all \| grep eslint-plugin-sonarjs` confirms it sits under the top-level devDependency, not under `mqtt`, this session]. A full `license-checker` install is unnecessary machinery for a one-package production tree. |
| "Secret scanning of the built artifact" | A custom regex secret-scanner | `trufflehog filesystem` against the tarball extracted from `npm pack` output, exactly the technique `CLAUDE.md` already documents for worktree commits | Reinventing entropy/pattern-based secret detection is a well-known "don't" — this project already has the tool wired in and a documented invocation pattern |
| "GitHub private vulnerability reporting" | Manual settings-page instructions in a checklist for the maintainer to click through | `gh api --method PUT /repos/{owner}/{repo}/private-vulnerability-reporting` [CITED: docs.github.com/en/rest, GitHub Changelog "Enable or disable private vulnerability reporting on repositories via REST API," found this session] | Automatable with the already-authenticated `gh` CLI (`repo` scope present, verified this session) rather than left as a manual step a plan can't verify |

**Key insight:** every "new" capability this phase seems to need is actually a small extension of
a pattern this codebase already committed to during Phase 1 (the `D-21` packaging allowlist) or
Phase 3 (the static source-text gate for forbidden imports). The risk in this phase is not
technical difficulty — it's forgetting that these precedents exist and reaching for an external
package or a manual checklist instead.

## Common Pitfalls

### Pitfall: the `"default"` Cucumber profile has no tag exclusion
**What goes wrong:** the moment `features/real-pump/*.feature` files exist, `npm test` (which
runs bare `cucumber-js`, i.e. the `"default"` profile) picks them up via its `features/**/*.feature`
glob and attempts to run them against a real vendor account inside CI.
**Why it happens:** `cucumber.json`'s `"default"` profile [VERIFIED: cucumber.json:2-6, read this
session] was written before the `"real"` profile existed and was never revisited when the `"real"`
key was added.
**How to avoid:** add `"tags": "not @real"` to `"default"` in the same commit that adds the first
`features/real-pump/*.feature` file — see Architecture Patterns Pattern 3.
**Warning signs:** CI suddenly requires vendor credentials, or hangs waiting on a real MQTT
connection.

### Pitfall: Homebridge 1.8.0's `engines.node` does not list Node 22 or 24
**What goes wrong:** the CI matrix cell for `homebridge-version: 1.8.0` prints `npm warn EBADENGINE`
during `npm install --no-save homebridge@1.8.0` under both Node 22.x and 24.x.
**Why it happens:** Homebridge 1.8.0's own `package.json` declares `"node": "^18.15.0 || ^20.7.0"`
[VERIFIED: `npm view homebridge@1.8.0 engines`, this session — this is a **present constraint**,
an explicit range that bounds every Node version, not a silent absence] — it predates Node 22/24
LTS and was never updated for a Homebridge-1.x release (1.11.4 does declare `^22 || ^24`, so the
gap is specific to the pinned minimum version).
**How to avoid:** treat the warning as expected and non-fatal (no `.npmrc` `engine-strict` is set
in this repo [VERIFIED: no `.npmrc` found, this session], so npm does not fail the install over
it). Document this explicitly in the workflow with a comment, so a future maintainer doesn't spend
time "fixing" a warning that reflects an upstream package's own metadata, not a bug in this
project.
**Warning signs:** a CI log that looks alarming but the job still passes — confirm build/test steps
after the warning still ran and passed before treating it as a real failure.

### Pitfall: NOTICE (if created) will not ship even though LICENSE and README always do
**What goes wrong:** npm force-includes `package.json`, `README`, and `LICENSE`/`LICENCE`
regardless of the `files` field or any ignore file [CITED: docs.npmjs.com/cli/v11/configuring-npm/
package-json/, fetched this session: "README & LICENSE can have any case and extension"; the same
page's `files` documentation lists the always-included set as `package.json`, `README`,
`LICENSE`/`LICENCE`, the `main` file, and any `bin` files — **NOTICE is not on this list**]. A
`NOTICE` file created to satisfy Apache §4(d)'s attribution-notice requirement will silently be
left out of the packed tarball unless it is added to `package.json`'s `files` array explicitly.
**Why it happens:** an earlier, unverified web search claimed NOTICE and CHANGELOG are also
force-included; the primary npm docs page, fetched directly this session, does not say this —
`CHANGELOG.md` in this repo's own packed artifact is only present because it's explicitly listed
in `package.json`'s `files` array [VERIFIED: `package.json:23-27`, and confirmed present in
`npm pack --dry-run` output, this session], not because npm force-includes it.
**How to avoid:** if REL-05's Apache-notice requirement is satisfied with a `NOTICE` file, add
`"NOTICE"` to `package.json`'s `files` array in the same change, and assert it in
`test/packedArtifact.test.ts`'s `ALLOWED_ROOT_FILES` list.
**Warning signs:** `npm pack --dry-run` output missing `NOTICE` even after the file is created and
committed.

### Pitfall: `homebridge-adt-pulse`'s comparative research is easy to mis-scope
**What goes wrong:** reading only `homebridge-adt-pulse`'s README (which says nothing about
headers) could wrongly conclude there's no Chrome-impersonation pattern to avoid.
**Why it happens:** the impersonation logic (`Sec-Fetch-*`, `Origin`, `Referer`, a fabricated
Dynatrace header) lives in the source (`src/lib/api.ts`), not the README
[VERIFIED: fetched `raw.githubusercontent.com/mrjackyliang/homebridge-adt-pulse/main/src/lib/api.ts`,
this session].
**How to avoid:** the comparative research this phase's folded todo asks for is already done (see
Anti-Patterns above) — the plan does not need to re-fetch this file, only apply the finding: build
one small, honest `USER_AGENT` constant (this project already has `COMMAND_USER_AGENT =
PLUGIN_NAME` at `src/cloud/api.ts:50`, applied only to one of several outbound calls
[VERIFIED: `src/cloud/api.ts:50,146`, read this session]) and apply it consistently to the Auth0
login request (`src/cloud/auth.ts:354`, currently sends only `Content-Type`
[VERIFIED: read this session]), the REST GET requests (`src/cloud/api.ts:143`, currently sends
only `Authorization` [VERIFIED: read this session]), and the MQTT WebSocket handshake (no headers
currently set — see Code Examples for the `wsOptions.headers` mechanism).
**Warning signs:** none currently — this is a design gap, not a runtime failure, until the vendor
starts rejecting requests without a recognizable client identity.

### Pitfall: REL-08's README audit looks done at a glance but is only 2/5 complete
**What goes wrong:** README.md already has a generic "in development... some values are
estimates" banner (line 9) and a specific battery-estimate disclosure (lines 227-231)
[VERIFIED: read this session], which could be mistaken for full REL-08 coverage.
**Why it happens:** REL-08 actually names five distinct disclosures, and README.md was searched
line-by-line for each this session:

| REL-08 clause | Present in README.md? | Where, if present |
|---|---|---|
| Homebridge stores the password in plain text | **No** in README; **Yes** in `config.schema.json`'s `headerDisplay` and the `password` field's `description` [VERIFIED: `config.schema.json:6,31`, read this session] | Arguably already satisfied since the Homebridge Settings GUI is itself user-facing documentation — plan should decide whether README needs a redundant mention for readers who only read the repo, not the GUI |
| Child bridge recommendation + pairing/re-creation warning | **No** — no mention of "bridge" anywhere in README.md [VERIFIED: grep across README.md, this session] | Not started |
| Prerelease builds marked experimental, keep vendor alarm/notifications enabled | Partially — generic "in development" banner exists; the specific "keep the vendor alarm and vendor notifications enabled" instruction does not [VERIFIED: grep, this session] | Partial |
| 25/50/75/100 battery levels are estimates | **Yes**, already present and correctly worded | `README.md:227-231` |
| No Critical Alerts guarantee | **No** mention of "Critical Alerts" anywhere in README.md [VERIFIED: grep, this session] | Not started |

**How to avoid:** treat this as a five-item checklist, not a single "add a disclaimer" task; three
items are net-new prose, one is arguably already satisfied elsewhere, one exists partially.
**Warning signs:** a plan that closes REL-08 with a single README diff and doesn't touch the child
bridge or Critical Alerts topics at all.

### Pitfall: `dev/README.md` has no mDNS/multicast prerequisite section
**What goes wrong:** a future contributor or the maintainer on a new host hits the exact
`floyd`-style "0 responders" pairing failure recorded in STATE.md's pending todos, with no
documented diagnosis path.
**Why it happens:** `dev/README.md`'s current "Networking" section explains *why* host networking
is used (mDNS + direct reachability) but does not warn that a host **lacking** multicast (no
firewall path, no bridged network) will silently fail pairing, nor does it name a tunnel-based
workaround [VERIFIED: read `dev/README.md` in full, this session — the existing "Networking"
section stops at explaining the container's own setup, not prerequisites on the host machine].
**How to avoid:** add a fail-fast precheck command (e.g. `avahi-browse` or `dns-sd -B` timing out)
and the firewall ports/tunnel guidance the folded todo asks for.
**Warning signs:** a pairing session that returns 0 responders with no diagnostic hint in the docs.

## Code Examples

### Consistent outbound header identification (REL-03/REL-04 folded todo)

The project already has the right instinct in one place; extend it rather than inventing a new
scheme:

```typescript
// Source: src/cloud/api.ts:50 (read this session) — the existing, correctly-scoped pattern
export const COMMAND_USER_AGENT = PLUGIN_NAME;
```

Currently only the command-issuing REST call attaches it (`src/cloud/api.ts:146`); the read-only
GET path (`:143`), the Auth0 login POST (`src/cloud/auth.ts:354`), and the MQTT WebSocket upgrade
have none. For MQTT, `mqtt.js`'s `connect()` accepts a `wsOptions.headers` object that is passed
through to the underlying `ws` WebSocket handshake:

```typescript
// Source: MQTT.js issue #856 / PR #512 discussion [CITED: github.com/mqttjs/MQTT.js, found this
// session] — the documented mechanism for custom WebSocket-handshake headers
connect(url, {
  wsOptions: {
    headers: { 'User-Agent': COMMAND_USER_AGENT },
  },
});
```

### GitHub Actions: enabling private vulnerability reporting without leaving the CLI

```bash
# Source: GitHub REST API endpoints for repositories [CITED: docs.github.com/en/rest, GitHub
# Changelog "Enable or disable private vulnerability reporting on repositories via REST API",
# found this session]
gh api --method PUT /repos/acolomba/homebridge-basement-guardian/private-vulnerability-reporting
```

### Extending the packed-artifact gate for license content (REL-05)

```typescript
// Pattern extension of test/packedArtifact.test.ts (read this session)
test('the shipped LICENSE explains the MIT/Apache boundary and includes both full texts (REL-05)', () => {
  // arrange
  const license = readFileSync(join(REPOSITORY_ROOT, 'LICENSE'), 'utf8');

  // act & assert
  assert.match(license, /Apache License/);
  assert.match(license, /MIT License/);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `npm publish` with a long-lived `NPM_TOKEN` GitHub Actions secret | npm Trusted Publishing via GitHub Actions OIDC (`id-token: write`, no stored token, automatic provenance attestations) | Generally available 2025-07-31 [CITED: github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available, found this session]; requires npm CLI ≥ 11.5.1 and Node ≥ 22.14.0 [CITED: docs.npmjs.com/trusted-publishers/, fetched this session] | Recommended for the *eventual* first-party publish workflow, but see the caveat below — do not block this phase on it |
| Implicit `latest` tag on any `npm publish` | npm requires an explicit `--tag` for any prerelease version (`npm publish --tag next`), enforced as of the RFC7 breaking change | [CITED: github.com/npm/cli/pull/7910 "fix!: publishing prerelease requires explicit tag", found this session] — already anticipated correctly in `06-CONTEXT.md`'s D-01 research note | Confirms D-01's existing plan is current; no change needed |
| npm-package.json `.npmignore` denylist | `files` allowlist (`D-21`, already implemented in Phase 1) | N/A to this phase — already done | Confirms Phase 6 has nothing to redo here |

**Caveat on Trusted Publishing (flagged, not asserted as fact):** community sources (a blog post,
not official npm/GitHub docs) claim a package must already exist on the npm registry — i.e. be
published at least once with a classic token — before Trusted Publishing can be configured for it
[ASSUMED — the official docs.npmjs.com Trusted Publishing page, fetched twice this session, is
silent on first-time/new-package eligibility; per the absent-evidence rule this silence does not
verify the claim in either direction]. Since D-01 already defers the actual first publish to the
maintainer outside this phase's execution, this phase's publish workflow can reasonably use a
classic `NPM_TOKEN` secret for its first invocation and note Trusted Publishing as a documented
follow-up hardening step post-first-publish, rather than betting the workflow design on an
unverified claim.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Trusted Publishing cannot be configured until a package has been published at least once with a classic token | State of the Art | Low — the recommendation already routes around this (classic token first, Trusted Publishing as a documented follow-up), so being wrong just means the follow-up step was unnecessary, not that anything breaks |
| A2 | `mqtt.js`'s production dependency tree contains no telemetry/tracking code | Standard Stack, Don't Hand-Roll | Low-medium — based on `npm audit` (0 vulnerabilities) and the well-established nature of `mqtt.js` as a widely-used open-source MQTT client, not on a line-by-line read of its ~20-package transitive tree; a plan-time task should still grep the installed tree for outbound network calls beyond the MQTT broker connection itself |
| A3 | `src/platform.ts` should stay classified Apache-derived (modified) rather than reclassified MIT, despite 600/725 lines being new | Architecture Patterns § License Boundary | Medium — this is a legal/licensing judgment call, not a technical one; D-035's own text anticipates this exact ambiguity ("if the implementation replaces all material from the template, reexamine...") and explicitly wants human reexamination, so this classification should be confirmed with the maintainer at plan or discuss time, not treated as settled by this research |

**If this table is empty:** N/A — three assumptions are logged above, all with mitigations already
built into the recommendation.

## Open Questions

1. **Does REL-08's plaintext-password disclosure need to be repeated in README.md, given it
   already appears in `config.schema.json`'s user-facing GUI text?**
   - What we know: `config.schema.json:6,31` already discloses plaintext storage in text rendered
     by the Homebridge Settings GUI, which is unambiguously "user-facing documentation."
   - What's unclear: whether REL-08's requirement is satisfied by that surface alone, or whether
     README.md (read by anyone browsing the npm/GitHub page before installing) also needs the
     disclosure for parity.
   - Recommendation: add a one-line mention to README.md's configuration section regardless — it's
     cheap, and it removes any ambiguity about whether the requirement is met, without duplicating
     the schema's full wording.

2. **Should the Homebridge-version CI matrix use `exclude:` to skip a cell, or accept the
   EBADENGINE warning on the 1.8.0 × Node-22/24 cells?**
   - What we know: the warning is non-fatal (no `engine-strict` set) and Homebridge 1.8.0's actual
     JavaScript almost certainly runs fine on Node 22/24 (Node's backward compatibility, plus
     1.11.4 declaring the same major API surface with the *narrower* fix being just the engines
     string, not a functional change).
   - What's unclear: without an executed CI run against the real matrix, whether Homebridge 1.8.0
     has any genuine runtime incompatibility with Node 22/24 beyond the metadata warning.
   - Recommendation: run the cell as planned (D-02 already locks this in); treat a passing
     `npm run check` on that cell, with only the EBADENGINE warning in the log, as success. If the
     cell genuinely fails at runtime (not just the warning), that's new information the CI run
     itself will surface — don't pre-emptively exclude it.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `gh` CLI | Enabling private vulnerability reporting, creating GitHub Releases | ✓ | 2.97.0, authenticated with `repo`+`workflow` scopes [VERIFIED, this session] | — |
| `docker` | Real-Homebridge-container smoke testing (`dev/hb`) referenced by dev docs, not required for this phase's own execution | ✓ | 29.7.2 [VERIFIED, this session] | — |
| `trufflehog` | Content-level secret scan of the packed tarball (REL-04) | ✓ | Pinned via `.pre-commit-config.yaml`'s hook environment [VERIFIED: found at `~/.cache/pre-commit/.../bin/trufflehog`, this session] | — |
| npm registry access | Verifying `homebridge` versions, `mqtt` version, license fields | ✓ | npm 11.19.0 / Node 26.8.1 locally [VERIFIED, this session — note: local Node is newer than the project's supported range; this is a known repo caveat (see MEMORY.md "verify on a CI runtime"), CI is what actually covers 22.x/24.x] | — |

**Missing dependencies with no fallback:** none.

**Missing dependencies with fallback:** none — everything this phase needs is already installed.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` (unit) [VERIFIED: package.json:47] + `@cucumber/cucumber@^13.2.1` (fake-pump integration) [VERIFIED: package.json:52, cucumber.json] |
| Config file | `cucumber.json` (profiles), `tsconfig.test.json` (build), `package.json` scripts |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm test` (= `test:unit` + `test:cucumber`, default Cucumber profile) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REL-01 | `engines` declares the correct Node/Homebridge ranges | unit | `node --test dist-test/test/packageManifest.test.js` | ✅ (`test/packageManifest.test.ts`) |
| REL-01 | Suite passes on all 6 matrix cells (2 Node × 3 Homebridge) | integration | CI matrix job (`npm run check` per cell) | ❌ Wave 0 — matrix dimension not yet added to `build.yml` |
| REL-02 | Full suite green (unit + fake-pump) | unit + integration | `npm test` | ✅ already comprehensive; no new file needed |
| REL-03 | Production `dependencies` stay exactly `["mqtt"]` | unit | `node --test dist-test/test/packaging/dependencyAllowlist.test.js` | ❌ Wave 0 |
| REL-04 | Packed tarball has no unexpected paths | unit | `node --test dist-test/test/packedArtifact.test.js` | ✅ already exists |
| REL-04 | Packed tarball content has no secrets/identifiers | manual/scripted | `trufflehog filesystem <extracted-tarball-dir> --results=verified,unknown --fail` | ❌ Wave 0 — no script yet |
| REL-05 | LICENSE contains both full texts and explains the boundary | unit | `node --test dist-test/test/packaging/licenseHeaders.test.js` (or extend `packedArtifact.test.ts`) | ❌ Wave 0 |
| REL-05 | Every `src/*.ts` file has the correct SPDX header for its classification | unit | same file as above | ❌ Wave 0 |
| REL-06 | `SECURITY.md` exists and states the no-SLA / private-advisory policy | unit | a small existence+content test, or manual review | ❌ Wave 0 (file doesn't exist) |
| REL-07 | G-001..G-004 checklists exist and are directly executable | manual | human review of the checklist artifacts | ❌ Wave 0 (D-03 deliverables) |
| REL-08 | README discloses all five required items | unit | `node --test dist-test/test/documentation.test.js` | ❌ Wave 0 — only 2/5 disclosures currently pass |
| REL-09 | `features/real-pump/*.feature` runs under the `real` profile only, never `default` | integration | `cucumber-js --profile real` (manual, opt-in) vs. `npm run test:cucumber` (must NOT pick these up) | ❌ Wave 0 — directory doesn't exist; `default` profile's tag-exclusion fix also needed |

### Sampling Rate
- **Per task commit:** `npm run test:unit` (fast) plus, for packaging/license/README changes,
  `node --test dist-test/test/packaging/*.test.js dist-test/test/documentation.test.js`.
- **Per wave merge:** `npm run check` (full local gate, matches CI's non-matrix steps).
- **Phase gate:** all 6 CI matrix cells green, plus a manually-invoked `trufflehog` content scan of
  a real `npm pack` tarball, before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `.github/workflows/build.yml` — add the `homebridge-version` matrix dimension (REL-01)
- [ ] `test/packaging/dependencyAllowlist.test.ts` — covers REL-03
- [ ] `test/packaging/licenseHeaders.test.ts` (or extend `packedArtifact.test.ts`) — covers REL-05
- [ ] `test/documentation.test.ts` — covers REL-08's five disclosures
- [ ] `cucumber.json`'s `"default"` profile — add `"tags": "not @real"` — prerequisite for REL-09
- [ ] `features/real-pump/` — does not exist yet; full suite content is this phase's REL-09 work
- [ ] `SECURITY.md` — does not exist yet
- [ ] `NOTICE` — does not exist yet (only needed if the license approach uses one; add to `files` if created)
- [ ] `dev/prep/` (or similar) — G-001 through G-004 checklists per D-03

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No — this phase touches no authentication logic | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | No new input surface introduced by this phase | — |
| V6 Cryptography | No | — |
| V14 Configuration (closest fit) | Yes — packaging/dependency/secret hygiene is squarely a V14 concern | No unnecessary files/secrets in the distributed artifact (`test/packedArtifact.test.ts` + the new content scan); dependency minimization (single production dependency, allowlist-tested) |

This phase is a supply-chain/distribution-hygiene phase, not a feature phase with new attack
surface. The relevant "threat" is accidental disclosure (secrets, private identifiers, or
overbroad file inclusion in the published package) rather than a STRIDE-style runtime threat.

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Overbroad `npm pack` including research/planning/credential artifacts | Information Disclosure | `files` allowlist (`D-21`, already implemented) + content-level secret scan (this phase's gap) |
| A malicious/typosquatted transitive dependency slipping into the production tree | Tampering / Information Disclosure | Single production dependency (`mqtt`), pinned allowlist test (REL-03 recommendation), `npm audit` in CI (already present, though currently `\|\| true`-suppressed — worth flagging to the plan as a review point, since suppressing audit failures silently is itself a minor risk) |
| A CI publish workflow accidentally running `npm publish` on every push | Elevation of Privilege (unintended release) | `workflow_dispatch`-only trigger (or tag-triggered), never on `push`/`pull_request` — mirrors D-01's explicit "no step in this phase's own execution actually runs `npm publish`" |

## Sources

### Primary (HIGH confidence — read this session, in-repo)
- `package.json`, `.github/workflows/build.yml`, `cucumber.json`, `config.schema.json`,
  `test/packedArtifact.test.ts`, `test/packageManifest.test.ts`, `README.md`, `dev/README.md`,
  `LICENSE`, `.fallowrc.json`, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`,
  `.planning/STATE.md`, `.planning/phases/06-validated-release-candidate/06-CONTEXT.md`,
  `.planning/intel/decisions.md` — all read directly this session.
- `git log`/`git show`/`git diff` against the repository's own history (initial-import commit
  `6adc3c2`) — read this session, used for the license-boundary classification.
- `npm view homebridge versions/dist-tags/engines`, `npm view @homebridge/hap-nodejs version`,
  `npm view mqtt version`, `npm audit`, `npm pack --dry-run`, `npm ls` — run this session against
  the live npm registry and this repository's own lockfile.
- `gh --version`, `gh auth status`, `docker --version` — run this session.

### Secondary (MEDIUM confidence — official docs/source fetched this session)
- [docs.npmjs.com/cli/v11/configuring-npm/package-json/](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) — `files`/`license` field semantics, fetched this session.
- [docs.npmjs.com/trusted-publishers/](https://docs.npmjs.com/trusted-publishers/) — npm Trusted Publishing requirements, fetched this session (twice, to check the new-package eligibility question, which it does not answer).
- [github.com/homebridge/plugins/wiki/Verified-Plugins](https://github.com/homebridge/plugins/wiki/Verified-Plugins) — Homebridge Verified criteria, dated 2026-05-05, fetched this session.
- [github.com/cucumber/cucumber-js/blob/main/docs/profiles.md](https://github.com/cucumber/cucumber-js/blob/main/docs/profiles.md) — Cucumber.js default-profile behavior, fetched this session.
- [raw.githubusercontent.com/mrjackyliang/homebridge-adt-pulse/main/src/lib/api.ts](https://github.com/mrjackyliang/homebridge-adt-pulse/blob/main/src/lib/api.ts) — comparative research on request-header impersonation, fetched this session.
- GitHub Changelog, "npm trusted publishing with OIDC is generally available" (2025-07-31) and "Enable or disable private vulnerability reporting on repositories via REST API" — found via search this session.
- npm/cli PR #7910, "fix!: publishing prerelease requires explicit tag" — found this session, confirms the `--tag` requirement already noted in `06-CONTEXT.md`.

### Tertiary (LOW confidence — flagged for validation)
- The claim that npm Trusted Publishing requires a package to already exist on the registry before
  it can be configured — sourced from a blog post (philna.sh), not official docs; official docs
  are silent on this. Logged as Assumption A1; the recommendation already routes around it.
- General claim that `mqtt.js` contains no telemetry — based on `npm audit` cleanliness and its
  well-known open-source status, not a line-by-line source read of the ~20-package tree. Logged as
  Assumption A2.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new tools; every recommendation reuses an already-installed,
  already-vetted tool or an already-established in-repo pattern.
- Architecture: HIGH for the license boundary and Cucumber-tag-exclusion findings (both grounded
  in files read this session with line numbers); MEDIUM for the CI matrix design (no official
  Homebridge template exists, so the two-dimension matrix is this project's own reasonable design,
  not a documented convention).
- Pitfalls: HIGH — every pitfall listed was found as a *live, current* condition in this
  repository this session (not a hypothetical), with a file and line citation.

**Research date:** 2026-09-04
**Valid until:** 2026-10-04 (30 days) — shorter validity (7-10 days) applies specifically to the
npm Trusted Publishing eligibility claim (Assumption A1) and the Homebridge-version `dist-tags`
(`latest`/`release-1.x` tags move independently of this project's release cadence).
