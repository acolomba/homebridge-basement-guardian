---
phase: 260828-jaf
plan: 01
subsystem: planning
tags: [architecture, dependency-injection, testing, documentation]

provides:
  - A visible default for dependency construction in future phase plans
  - An explicit path to reconsider the default during phase discussion

actuals:
  tasks: 1
  commits: 1

key-files:
  created: []
  modified:
    - .planning/PROJECT.md
    - .planning/STATE.md

key-decisions:
  - "Manual constructor dependency injection is preferred for plugin-owned services"
  - "The preference is not ADR-locked and can change during phase discussion"

requirements-completed: []
completed: 2026-08-28
status: complete
---

# Quick Task 260828-jaf: Constructor Dependency Injection Preference Summary

## Outcome

PROJECT.md now records manual constructor dependency injection as an open
implementation preference. The preference covers production factories or defaults
and explicit test fakes.

The Homebridge platform constructor remains compatible with
`new (log, config, api)`. The text states that this preference is not ADR-locked.
Phase discussion can select another pattern when it gives a clear benefit.

## Verification

- The ADR-locked decision blocks are unchanged.
- The new text follows the project documentation style.
- `pre-commit run --files .planning/PROJECT.md` passed.

## Task Commit

- `b0543e2` — `docs(planning): record injection preference`
