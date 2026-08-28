---
phase: 260828-jaf
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/PROJECT.md
  - .planning/STATE.md
autonomous: true
requirements: []
---

<objective>
Record manual constructor dependency injection as a preferred implementation
pattern. Keep the preference outside the ADR-locked decision blocks and make its
reconsideration path explicit.

Purpose: future phase planning needs a visible default for service construction
without treating that default as a permanent architecture constraint.

Output: one open implementation preference in PROJECT.md and an updated quick-task
record in STATE.md.
</objective>

<constraints>
- Stay on `features/planning-refinement`.
- Do not change an ADR-locked decision block.
- Describe constructor dependency injection as a preference, not a requirement.
- State that phase discussion can select a different pattern when it gives a clear
  benefit.
- Preserve unrelated untracked files.
</constraints>

<tasks>

<task type="auto">
  <name>Record the open dependency-injection preference</name>
  <files>.planning/PROJECT.md, .planning/STATE.md</files>
  <action>Add a concise Open Implementation Preferences section under Evolution.
  Record manual constructor injection, the fixed Homebridge platform constructor,
  production factories or defaults, and explicit test fakes. Update STATE.md with
  the completed quick task.</action>
  <verify>Make sure that the new text says that the preference is not ADR-locked.
  Make sure that all locked decision blocks are unchanged.</verify>
  <done>Future planning can find the preferred pattern and its reconsideration
  condition in PROJECT.md.</done>
</task>

</tasks>
