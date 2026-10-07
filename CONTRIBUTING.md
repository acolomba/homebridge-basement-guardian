# Contributing

## General

This project welcomes issues and pull requests.

## Responsible AI contributions

You can use generative AI when you meet these conditions:

- **Human ownership:** You are responsible for the content of your contribution, even when AI helps write it.
- **Human oversight and expertise:** Review and revise issues and pull requests with your own expertise so they reflect your understanding and voice.

## Development setup

Install dependencies and verify the project:

```shell
npm ci --ignore-scripts
npm run check
```

Install the git hooks:

```shell
pre-commit install --install-hooks
```

The hooks run the linters, the formatters, and a secret scan before each commit, and they check the commit message against the Conventional Commits rules. Do not use `--no-verify` to skip them. A hook that fails stops the commit, so fix the report, stage the fix, and commit again.

This command runs the complete quality gate: type checking, linting, code-health analysis, format verification, a build, and the tests:

```shell
npm run check
```

The blueprint provides these additional checks:

```shell
npm run check:static
npm run check:commit
npm run test:coverage:direct -- src/settings.ts
```

`check:static` runs independent static checks in parallel. `check:commit` adds repository tests and isolated coverage for staged source/test pairs. Shared test support, dependencies, compiler configuration, coverage scripts, and deletions select every pair. If a commit only deletes build inputs, run `npm run check` manually because pre-commit does not select deleted files.

Unit tests stay under `test/` and compile to `dist-test/`. Each source module must reach 100% line, function, and branch coverage in its paired test alone. The coverage script maps accepted JavaScript coverage to TypeScript lines for SonarCloud. The full check also runs the Cucumber scenarios that exclude `@real`.

Set `TEST_CONCURRENCY` to limit coverage workers, for example `TEST_CONCURRENCY=4 npm run check`. TypeScript, ESLint, and Prettier keep disposable caches under `node_modules/.cache/`. If shared types change, clear `node_modules/.cache/eslint/` for fresh typed lint results. CI always clears this cache. Fallow retains the project's 3% duplication limit. Dead-code and health findings still fail their checks.

The secret hook scans file contents and works in linked worktrees. Run all hooks without `SKIP` overrides.

## Blueprint maintenance

`.copier-answers.yml` records the selected options and exact revision from [blueprint-typescript PR #5](https://github.com/acolomba/blueprint-typescript/pull/5). The adoption preserves the Homebridge compatibility matrix, package metadata, mixed license, product documentation, and compiled-test layout. Claude Code, Codex, and Pi remain configured. GSD configuration stays project-owned; CodeGraph and the separate Node integration suite are disabled.

To preview an update from a specific revision:

```shell
copier update --trust --skip-tasks --vcs-ref <revision> --pretend
```

Apply the same command without `--pretend`, resolve conflicts, and run `npm run check` and the pre-commit hooks. Review the retained customizations before accepting generated changes.

`scripts/init.sh` installs dependencies and hooks and registers Fallow with Claude Code and Codex. It preserves existing GSD installations and third-party skills.

## Local Homebridge

Link the plugin to a local Homebridge installation:

```shell
npm link
homebridge -D
```

Use this command for automatic rebuilding and a dedicated development instance:

```shell
npm run watch
```

The development instance reads its configuration from [`test/hbConfig/config.json`](./test/hbConfig/config.json).
