---
phase: quick-260905-whi
plan: 01
subsystem: release-infrastructure
tags: [npm, oidc, trusted-publishing, github-actions, ci]
status: complete
dependency-graph:
  requires:
    - phase: quick-260905-t6o
      provides: homebridge-basement-guardian@0.1.0 confirmed live on npm's `latest` tag
  provides:
    - .github/workflows/publish.yml publishing via npm Trusted Publishing (OIDC), no stored secret
    - package.json repository.url matching npm's own publish-time normalization
  affects: []
tech-stack:
  added: []
  patterns:
    - "npm Trusted Publishing (OIDC): job-level permissions.id-token: write + environment block naming the package URL, final step runs `npm publish --access public --provenance` with no env-supplied token"
key-files:
  created: []
  modified:
    - .github/workflows/publish.yml
    - package.json
decisions:
  - "No architectural deviations; plan executed exactly as written."
metrics:
  duration: ~10 min
  completed: 2026-09-06
actuals:
  tokens: 596
  tasks: 2
  commits: 2
---

# Phase quick-260905-whi Plan 01: Switch publish.yml to npm Trusted Publishing Summary

Switched `.github/workflows/publish.yml`'s `publish` job from a classic `NPM_TOKEN` secret to npm
Trusted Publishing (OIDC), now that `homebridge-basement-guardian@0.1.0` is confirmed live on the
registry, and normalized `package.json`'s `repository.url` to the `git+`-prefixed form npm's own
`publish` step already wrote into the shipped tarball.

## What was built

1. **`.github/workflows/publish.yml`** — the `publish` job gained job-level `permissions: {contents:
   read, id-token: write}` and `environment: {name: npm, url:
   https://www.npmjs.com/package/homebridge-basement-guardian}`. The final "Publish to npm" step's
   old multi-line comment and `env: {NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}}` block were removed;
   `run:` now reads `npm publish --access public --provenance`, with a new comment describing the
   OIDC handshake, the one-time npmjs.com trusted-publisher setup this plan's `user_setup` calls out,
   and citing https://github.com/npm/cli/issues/8544 for why Trusted Publishing could not have been
   used for the first (bootstrap) publish. The `name:`, D-01 comment, `on: workflow_dispatch:`
   trigger, and the checkout/setup-node/install/build steps are byte-identical to before.
2. **`package.json`** — `repository.url` changed from `https://github.com/acolomba/homebridge-basement-guardian.git`
   to `git+https://github.com/acolomba/homebridge-basement-guardian.git`, matching what the real
   `npm publish` run that shipped 0.1.0 already normalized the field to (with a stderr warning) inside
   the published tarball. No other field, whitespace, or key order changed; `package-lock.json` is
   untouched.

## Verification

- `pre-commit run check-yaml yamllint --files .github/workflows/publish.yml` — both pass.
- `grep -c 'NPM_TOKEN' .github/workflows/publish.yml` — `0`.
- `grep -c 'id-token: write' .github/workflows/publish.yml` — `1`.
- `grep -c 'npm publish --access public --provenance' .github/workflows/publish.yml` — `1`.
- `grep -c 'environment:'` / `grep -c 'name: npm'` / `grep -c 'homebridge-basement-guardian$'` in
  `publish.yml` — all `1`.
- Untouched-region check: `actions/checkout@v5`, `actions/setup-node@v6`, `npm install`, `npm run
  build`, `D-01`, and `workflow_dispatch:` each still appear exactly once; no `push:` trigger was
  added.
- `grep -c '"url": "git+https://github.com/acolomba/homebridge-basement-guardian.git"' package.json`
  — `1`.
- `git diff --stat` for the `package.json` commit — exactly 1 insertion, 1 deletion.
- `git diff --quiet -- package-lock.json` — clean (no lockfile change).
- `git diff --stat` across both commits touches exactly the two files in this plan's
  `files_modified`: `.github/workflows/publish.yml` and `package.json`. No `npm publish` run
  happened as part of this plan; no version bump.

## Deviations from Plan

None — plan executed exactly as written, task by task.

## Known Stubs

None. This plan only rewires CI authentication and normalizes a metadata field; no runtime code
path changed.

## Threat Flags

None beyond what the plan's own `<threat_model>` already documents (T-whi-01, T-whi-02, T-whi-03,
T-whi-SC) — no new trust boundary or surface was introduced outside that register.

## User Setup Required

**External service requires manual, dashboard-only configuration before the next `publish.yml` run
can succeed.** Per this plan's `user_setup`: add a trusted publisher on
https://www.npmjs.com/package/homebridge-basement-guardian → Settings → Trusted Publisher, linking
GitHub repo `acolomba/homebridge-basement-guardian`, workflow file `publish.yml`, and environment
`npm`. npm has no CLI for this step. Until it is done, the next `workflow_dispatch` run of
`publish.yml` will fail the OIDC handshake — there is no fallback stored secret left in the file.

## Self-Check: PASSED

- `.github/workflows/publish.yml` — FOUND, contains `id-token: write`, `environment:`, and
  `npm publish --access public --provenance`.
- `package.json` — FOUND, `repository.url` reads
  `git+https://github.com/acolomba/homebridge-basement-guardian.git`.
- Both commit hashes verified present in `git log --oneline`:
  - `1d6853c` feat(publish): switch npm publish to Trusted Publishing (OIDC)
  - `7aae39e` fix(package): prefix repository.url with git+
