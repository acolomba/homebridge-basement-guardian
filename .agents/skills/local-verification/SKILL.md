---
name: local-verification
description: Select and schedule this repository's build checks when planning, implementing, debugging, or verifying changes through GSD.
---

# Local verification

A commit runs `npm run check:commit` when staged files match the `npm-check` hook's build-input pattern. A GSD gate or PR/release handoff runs `npm run check` on the whole tree. CI runs the full check from a clean installation. Keep the hook's build-input pattern and the CI workflow's build inputs in sync when adding inputs.

This scheduling policy takes precedence over generic instructions to run the whole suite after every task. It does not permit skipping a required combined-tree or handoff gate or accepting a failed or timed-out check.

## Read before you act

| When you                                                             | Read                                                  |
| -------------------------------------------------------------------- | ----------------------------------------------------- |
| run a check, one test module, one pair's coverage, or one named test | `.agents/skills/local-verification/rules/commands.md` |
| finish a task, pass a gate, or reuse a passing result                | `.agents/skills/local-verification/rules/gates.md`    |
| commit                                                               | `.agents/skills/committing/SKILL.md`                  |
