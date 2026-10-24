# Commands

Part of the `local-verification` skill: `.agents/skills/local-verification/SKILL.md`.

`check:static` runs type checking, ESLint, workflow validation, Fallow, formatting, and source/test pairing in parallel. Passing steps print one status line locally; failures and CI runs print full output. A warning fails its step: ESLint runs with `--max-warnings=0`, and Prettier, Fallow, and the gate scripts fail on every finding.

`check:commit` runs static checks, unpaired unit tests (repository contracts, architecture, and fake contract tests), and direct coverage for staged source/test pairs. The selector reads staged paths only; unstaged and untracked paths do not select pairs. Shared test support, dependencies, compiler configuration, coverage tooling, or deletions select all pairs. Pre-commit stashes unstaged edits during a commit; stage or remove untracked build inputs yourself.

`check` runs static checks, unpaired unit tests, behavioral tests, and direct coverage for every source/test pair. Each pair runs alone and must reach 100% line, function, and branch coverage. The merged `coverage/direct.lcov` contains only each source's own pair coverage and supplies SonarCloud.

Compile with `npm run build:test` first. Run one test module with `node --test dist-test/test/<path>.test.js`, one source/test pair's direct coverage with `npm run test:coverage:direct -- <path>`, where `<path>` is the source or its test, one named unit test with `node --test --test-name-pattern '<title>' dist-test/test/<path>.test.js` and one scenario with `npx cucumber-js --name '<scenario title>'`.

Tests print failures locally and full reports when `CI` is set. Set `TEST_CONCURRENCY` to a positive integer to limit concurrent tests and coverage workers.

ESLint caches file content and configuration under `node_modules/.cache/eslint/`. Typed lint also reads other files' types, so cached results can become stale. CI clears this cache before checking; delete it yourself when fresh local lint is needed. TypeScript and Prettier also use native disposable caches.
