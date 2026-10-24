---
phase: 260828-jkw
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - CLAUDE.md
  - .planning/STATE.md
autonomous: true
requirements: []
---

<objective>
Add primary Homebridge and Cucumber.js documentation links to the durable agent
instructions.

Purpose: agents need clear source routing when a task depends on framework behavior.

Output: one external-reference section in CLAUDE.md and an updated quick-task record
in STATE.md.
</objective>

<constraints>
- Stay on `features/planning-refinement`.
- Put the section outside the GSD-managed blocks in CLAUDE.md.
- Tell agents to read only the relevant pages.
- Reconcile current documentation with pinned package versions and installed types.
- Preserve unrelated untracked files.
</constraints>

<tasks>

<task type="auto">
  <name>Add external reference documentation</name>
  <files>CLAUDE.md, .planning/STATE.md</files>
  <action>Add the official Homebridge plugin documentation and the Cucumber.js
  documentation directory to CLAUDE.md. Describe when to consult each source. Update
  STATE.md with the completed quick task.</action>
  <verify>Make sure that both links resolve. Make sure that the new section is outside
  all GSD-managed blocks.</verify>
  <done>Future agents can find and apply the relevant primary documentation.</done>
</task>

</tasks>
