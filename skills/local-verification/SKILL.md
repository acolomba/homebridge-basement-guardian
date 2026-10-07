---
name: local-verification
description: Select and schedule this repository's build checks when planning, implementing, debugging, or verifying changes.
---

# Local verification

A commit runs `npm run check:commit` when staged files match the `npm-check` hook's build-input pattern. A PR/release handoff runs `npm run check` on the whole tree. CI runs the full check from a clean installation. Keep the hook's build-input pattern and the CI workflow's build inputs in sync when adding inputs.

## Commands

`check:static` runs type checking, ESLint, workflow validation, Fallow, formatting, and source/test pairing in parallel. Passing steps print one status line locally; failures and CI runs print full output.

`check:commit` runs static checks, unpaired unit tests (repository contracts, architecture, and fake contract tests), and direct coverage for staged source/test pairs. The selector reads staged paths only; unstaged and untracked paths do not select pairs. Shared test support, dependencies, compiler configuration, coverage tooling, or deletions select all pairs. Pre-commit stashes unstaged edits during a commit; stage or remove untracked build inputs yourself.

`check` runs static checks, unpaired unit tests, behavioral tests, and direct coverage for every source/test pair. Each pair runs alone and must reach 100% line, function, and branch coverage. The merged `coverage/direct.lcov` contains only each source's own pair coverage and supplies SonarCloud.

Tests print failures locally and full reports when `CI` is set. Set `TEST_CONCURRENCY` to a positive integer to limit concurrent tests and coverage workers.

## Committing

Compile with `npm run build:test`, then use owner tests (`node --test dist-test/test/<path>.test.js`) or `npm run test:coverage:direct -- <source-path> <test-path>` while editing. Before committing, run `pre-commit run --files <changed files>` to apply fixers and linters. Restage fixes and repeat until clean, then run `git commit` in the foreground. The commit hook repeats the checks against the staged tree. A failed hook means no commit happened: fix, restage, and commit again, without `--amend` or `--no-verify`.

Pre-commit passes no deleted file to a hook and applies its top-level exclusions first. Run `npm run check` yourself before a commit that only deletes build inputs or changes only excluded build inputs.

ESLint caches file content and configuration under `node_modules/.cache/eslint/`. Typed lint also reads other files' types, so cached results can become stale. CI clears this cache before checking; delete it yourself when fresh local lint is needed. TypeScript and Prettier also use native disposable caches.

## Completion gates

A passing commit hook is incremental evidence, not full verification. Final PR/release handoff requires the full check.

Reuse passing evidence only from this session and for unchanged inputs. Record the command, exit status, commit, Node version, and scope. Use a clean verified commit as the reference; for a dirty tree, retain its exact diff and untracked contents for comparison. A path list is insufficient. Never reuse after source, test support, dependency, configuration, runtime, or tool changes. Rerun when uncertain. No persistent success marker replaces this comparison.

This scheduling policy takes precedence over generic instructions to run the whole suite after every task. It does not permit skipping a required handoff gate or accepting a failed or timed-out check.
