---
phase: 260828-jkw
plan: 01
subsystem: documentation
tags: [agents, homebridge, cucumber, references]

provides:
  - Durable source routing for Homebridge plugin work
  - Durable source routing for Cucumber.js test work

actuals:
  tasks: 1
  commits: 1

key-files:
  created: []
  modified:
    - CLAUDE.md
    - .planning/STATE.md

key-decisions:
  - "External reference links live in CLAUDE.md outside the GSD-managed blocks"
  - "Agents compare current documentation with pinned versions and installed types"

requirements-completed: []
completed: 2026-08-28
status: complete
---

# Quick Task 260828-jkw: Agent Reference Documentation Summary

## Outcome

CLAUDE.md now routes agents to the primary Homebridge plugin documentation and the
Cucumber.js documentation directory. The section identifies the relevant topics for
each source.

Agents read only the pages that apply to a task. They compare current documentation
with pinned package versions and installed TypeScript definitions.

## Verification

- Both reference URLs returned HTTP 200.
- The new section is outside all GSD-managed blocks.
- `pre-commit run --files CLAUDE.md` passed after dash normalization.

## Task Commit

- `91c21a1` -- `docs: add agent reference links`
