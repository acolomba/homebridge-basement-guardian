---
phase: quick-260905-whi
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .github/workflows/publish.yml
  - package.json
autonomous: true
requirements: [REL-07]

user_setup:
  - service: npm
    why: "OIDC Trusted Publishing needs a trusted publisher registered on the package's own npm settings before this workflow's next run can authenticate with no stored token. npm has no CLI for this step; it is dashboard-only."
    dashboard_config:
      - task: "Add a trusted publisher linking GitHub repo acolomba/homebridge-basement-guardian, workflow file publish.yml, and environment npm."
        location: "https://www.npmjs.com/package/homebridge-basement-guardian -> Settings -> Trusted Publisher"

estimate:
  tokens: 25000
  raw_tokens: 25000
  tasks: 2
  confidence: low

must_haves:
  truths:
    - "`.github/workflows/publish.yml`'s `publish` job requests `id-token: write` and its final step runs `npm publish --access public --provenance`, with no classic-secret env block feeding the publish command anywhere in the file."
    - "The `publish` job's `environment` block names this project's own live npm package URL (`homebridge-basement-guardian`), not the reference repo's package."
    - "`workflow_dispatch:` remains the file's sole top-level trigger; the D-01 rationale comment and the `on:` block above the `jobs:` key are untouched."
    - "`package.json`'s `repository.url` reads `git+https://github.com/acolomba/homebridge-basement-guardian.git`, matching what `npm publish` itself already normalizes the field to at pack time."
  artifacts:
    - ".github/workflows/publish.yml -- `publish` job carries a job-level `permissions: {contents: read, id-token: write}` and `environment: {name: npm, url: https://www.npmjs.com/package/homebridge-basement-guardian}`, and its last step is `run: npm publish --access public --provenance` with a comment describing the OIDC/trusted-publisher setup."
    - "package.json -- `repository.url` carries the `git+` prefix."
  key_links:
    - "`permissions.id-token: write` -> the `npm publish --access public --provenance` OIDC handshake -> the trusted-publisher entry on npmjs.com naming this exact repo, workflow file, and environment (this plan's `user_setup`). Skip the dashboard step and the next real run fails auth instead of silently falling back to a stored token, because none remains in the file."
---

<objective>
Switch `.github/workflows/publish.yml`'s `publish` job from a classic npm auth secret to npm Trusted
Publishing (OIDC), now that `homebridge-basement-guardian@0.1.0` is confirmed live on the registry
(`npm view homebridge-basement-guardian version` -> `0.1.0`, `dist-tags.latest` -> `0.1.0`) and OIDC no
longer needs to bootstrap a brand-new package's first version. `/home/acolomba/pi-claude-marketplace/.github/workflows/publish.yml`
already runs this exact pattern for its own package and is the reference this plan follows.

Purpose: the classic secret this workflow used for the first publish is a standing, long-lived
credential; Trusted Publishing removes it entirely and ties every future publish to a signed,
short-lived token scoped to this one workflow run, with build provenance attached to the package.

Output: `.github/workflows/publish.yml` publishes with `id-token: write` and no stored npm secret;
`package.json`'s `repository.url` carries the `git+` prefix `npm publish` already normalizes it to.
</objective>

<execution_context>
@/home/acolomba/homebridge-basement-guardian/.claude/gsd-core/workflows/execute-plan.md
@/home/acolomba/homebridge-basement-guardian/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
</context>

<background>
**This file has one job, `publish`, unlike the reference repo's `ci`+`publish`+`release` three-job
file.** Only the `publish` job's `permissions`, `environment`, and final step change. The top-of-file
`name:`, the `on: workflow_dispatch:` trigger, and the D-01 comment explaining why `workflow_dispatch`
is the sole trigger stay exactly as they are -- this plan does not touch trigger behavior.

**Confirmed live before this plan was written:** `npm view homebridge-basement-guardian version` ->
`0.1.0`; `dist-tags.latest` -> `0.1.0`. Trusted Publishing cannot configure a package's first-ever
publish (confirmed via https://github.com/npm/cli/issues/8544 and by pi-claude-marketplace's own
bootstrap history, which used a stored secret for its first release too) -- that constraint no longer
applies here, which is exactly why this plan exists now and not before the first publish.

**`package.json`'s `repository.url` today** reads `https://github.com/acolomba/homebridge-basement-guardian.git`
(no `git+` prefix). The real `npm publish` run that shipped 0.1.0 already auto-corrected this to
`git+https://github.com/acolomba/homebridge-basement-guardian.git` inside the published tarball, with a
warning on stderr. `package-lock.json`'s root package entry carries no `repository` key (confirmed
during planning), so fixing this in `package.json` alone needs no lockfile change.
</background>

<tasks>

<task type="auto">
  <name>Task 1: Switch publish.yml's publish job to npm Trusted Publishing (OIDC)</name>
  <precondition>`grep -c 'id-token: write' .github/workflows/publish.yml` reports `0` -- the job has not
  already been switched.</precondition>
  <files>.github/workflows/publish.yml</files>
  <read_first>
    - `.github/workflows/publish.yml` (full, 37 lines, already read in full during planning) -- the
      exact `publish:` job to edit; everything above `jobs:` (the `name:`, D-01 comment, and `on:` block)
      is out of scope.
    - `/home/acolomba/pi-claude-marketplace/.github/workflows/publish.yml` lines 28-50 (already read in
      full during planning) -- its `publish` job is the exact shape to match: job-level `permissions:
      {contents: read, id-token: write}`, `environment: {name: npm, url: <package URL>}`, and a final
      step reading `run: npm publish --access public --provenance` with no `env:` block.
  </read_first>
  <action>
Add two job-level keys to the `publish:` job, directly after `runs-on: ubuntu-latest` and before the
blank line preceding `steps:`: a `permissions:` map with `contents: read` and `id-token: write`, and an
`environment:` map with `name: npm` and `url: https://www.npmjs.com/package/homebridge-basement-guardian`
(this project's own package page, not the reference repo's). Leave the `checkout`, `setup-node`,
`npm install`, and `npm run build` steps byte-identical -- do not change action versions, the Node
version, or the install/build commands.

Rewrite only the final "Publish to npm" step. Delete its existing multi-line comment (the one
explaining that a stored credential is used because a package with no prior registry publish could
not yet be configured for Trusted Publishing) and delete the `env:` block beneath the `run:` line that
supplies that stored credential to the publish command -- 0.1.0's confirmed live registry presence
(this plan's objective) removes the reason that comment gave. Change the `run:` line itself to
`npm publish --access public --provenance`.

Write a new comment above the rewritten `run:` line explaining: this now authenticates via npm Trusted
Publishing (OIDC), so no stored secret exists in this file; a trusted publisher must be configured on
npmjs.com's package settings (naming this repo, this workflow file, and the `npm` environment) linking
this workflow before the next run can succeed, set up once now that the package has a first published
version (Trusted Publishing cannot bootstrap a brand-new package -- cite
https://github.com/npm/cli/issues/8544 and note pi-claude-marketplace's own bootstrap history followed
the identical path); and that every release from here on carries build provenance and needs no
long-lived credential.
  </action>
  <verify>
    <automated>pre-commit run check-yaml --files .github/workflows/publish.yml | grep -q Passed &amp;&amp; pre-commit run yamllint --files .github/workflows/publish.yml | grep -q Passed &amp;&amp; echo YAML_OK</automated>
    <automated>test "$(grep -c 'NPM_TOKEN' .github/workflows/publish.yml)" -eq 0 &amp;&amp; echo STORED_SECRET_GONE</automated>
    <automated>test "$(grep -c 'id-token: write' .github/workflows/publish.yml)" -eq 1 &amp;&amp; test "$(grep -c 'npm publish --access public --provenance' .github/workflows/publish.yml)" -eq 1 &amp;&amp; test "$(grep -c 'environment:' .github/workflows/publish.yml)" -eq 1 &amp;&amp; test "$(grep -c 'name: npm' .github/workflows/publish.yml)" -eq 1 &amp;&amp; test "$(grep -c 'homebridge-basement-guardian$' .github/workflows/publish.yml)" -eq 1 &amp;&amp; echo OIDC_WIRED</automated>
    <automated>test "$(grep -c 'actions/checkout@v5' .github/workflows/publish.yml)" -eq 1 &amp;&amp; test "$(grep -c 'actions/setup-node@v6' .github/workflows/publish.yml)" -eq 1 &amp;&amp; test "$(grep -c 'npm install' .github/workflows/publish.yml)" -eq 1 &amp;&amp; test "$(grep -c 'npm run build' .github/workflows/publish.yml)" -eq 1 &amp;&amp; test "$(grep -c 'D-01' .github/workflows/publish.yml)" -eq 1 &amp;&amp; test "$(grep -c 'workflow_dispatch:' .github/workflows/publish.yml)" -eq 1 &amp;&amp; test "$(grep -c '^  push:' .github/workflows/publish.yml)" -eq 0 &amp;&amp; echo UNTOUCHED_REGIONS_OK</automated>
  </verify>
  <done>
`.github/workflows/publish.yml`'s `publish` job carries `permissions: {contents: read, id-token:
write}` and an `environment` block pointing at this project's own npm package page. Its final step
runs `npm publish --access public --provenance` with a new comment describing the OIDC/trusted-publisher
setup; no line in the file references the removed stored secret. The `name:`, D-01 comment, `on:` block,
and the checkout/setup-node/install/build steps are byte-identical to before.
  </done>
</task>

<task type="auto">
  <name>Task 2: Normalize package.json's repository.url to match npm's own publish-time correction</name>
  <precondition>`grep -c '"url": "https://github.com/acolomba/homebridge-basement-guardian.git"' package.json`
  reports `1` -- the field has not already been prefixed.</precondition>
  <files>package.json</files>
  <read_first>
    - `package.json` lines 11-14 -- the `repository` block holding the single field to edit.
  </read_first>
  <action>
Edit `package.json`'s `repository.url` field, prefixing its existing value with `git+` so it reads
`git+https://github.com/acolomba/homebridge-basement-guardian.git`. This is the exact value the real
`npm publish` run that shipped 0.1.0 already normalized the field to inside the published tarball
(with a warning on stderr), so this brings the source file in line with what is already live on the
registry. Change nothing else in the file -- no other field, no whitespace, no key reordering.
  </action>
  <verify>
    <automated>grep -c '"url": "git+https://github.com/acolomba/homebridge-basement-guardian.git"' package.json | grep -qx 1 &amp;&amp; echo URL_PREFIXED</automated>
    <automated>git diff --stat -- package.json | grep -Eq '1 file changed, 1 insertion.*1 deletion' &amp;&amp; echo SINGLE_LINE_DIFF</automated>
    <automated>git diff --quiet -- package-lock.json &amp;&amp; echo LOCKFILE_UNCHANGED</automated>
  </verify>
  <done>
`package.json`'s `repository.url` reads `git+https://github.com/acolomba/homebridge-basement-guardian.git`,
the only line the diff touches, and `package-lock.json` is unchanged.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| GitHub Actions runner -> npm registry | The `publish` job's runner requests a short-lived OIDC token and exchanges it with npm for permission to publish this exact package under this exact workflow/environment identity. |
| `publish.yml`'s `workflow_dispatch` -> npm's public registry | Running this workflow is still a one-way publish to every `npm install homebridge-basement-guardian` user's default `latest` tag; this plan changes only how the runner authenticates, not when or what it publishes. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-whi-01 | Spoofing / Elevation of Privilege | `.github/workflows/publish.yml`'s `publish` job | high | mitigate | `id-token: write` is scoped to this one job, which still runs only on a maintainer-triggered `workflow_dispatch` (no `push`/`pull_request` trigger exists in this file, unchanged by this plan) and only after the unchanged checkout/install/build steps. The OIDC exchange yields a token valid for this single run rather than a long-lived credential a leaked secret would have given indefinitely. |
| T-whi-02 | Information Disclosure | Removal of the stored npm secret | low | mitigate | Deleting the secret-bearing `env:` block removes a standing credential from the repository's secret store entirely; there is no longer a long-lived npm-publish credential to leak from this workflow. Residual risk (a compromised dependency reached during `npm install`/`npm run build` requesting a token mid-run) is bounded by the same job-scoped, short-lived OIDC token, not eliminated. |
| T-whi-03 | Repudiation | Published package provenance | low | mitigate | `--provenance` attaches a signed attestation linking the published artifact to this exact commit, workflow file, and run, improving auditability over the prior unattested `npm publish`. |
| T-whi-SC | Tampering | npm/pip/cargo installs | high | accept | No task in this plan adds, removes, or upgrades a package; `package.json`'s `dependencies`/`devDependencies` are untouched (only `repository.url` changes), and `package-lock.json` is verified unchanged by Task 2. The package-legitimacy gate does not apply. |

</threat_model>

<verification>

Run after both tasks are committed:

1. `pre-commit run check-yaml yamllint --files .github/workflows/publish.yml` -- passes.
2. `grep -c 'NPM_TOKEN' .github/workflows/publish.yml` -- `0`.
3. `grep -c 'id-token: write' .github/workflows/publish.yml` -- `1`.
4. `grep -c 'npm publish --access public --provenance' .github/workflows/publish.yml` -- `1`.
5. `grep -c '"url": "git+https://github.com/acolomba/homebridge-basement-guardian.git"' package.json` -- `1`.
6. `git diff --stat` -- exactly the two files in this plan's `files_modified`, nothing else (no
   `package-lock.json`, no version bump).

</verification>

<success_criteria>

- [ ] `.github/workflows/publish.yml`'s `publish` job requests `id-token: write` and its final step
      runs `npm publish --access public --provenance` with no stored npm secret anywhere in the file.
- [ ] The job's `environment` block names `homebridge-basement-guardian`'s own npm package page.
- [ ] `workflow_dispatch:` remains the file's sole trigger; D-01 comment, `on:` block, and the
      checkout/setup-node/install/build steps are byte-identical to before.
- [ ] `package.json`'s `repository.url` carries the `git+` prefix; `package-lock.json` is untouched.
- [ ] No actual `npm publish` run happens as part of this plan; no version bump.

</success_criteria>

<output>
Create `.planning/quick/260905-whi-switch-publish-yml-to-npm-trusted-publis/260905-whi-SUMMARY.md`
when done.
</output>
