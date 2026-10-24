# homebridge-basement-guardian

A Homebridge plugin for monitoring and protecting basements.

This project is on GitHub: <https://github.com/acolomba/homebridge-basement-guardian>

## Guidelines

### General

Before editing any file, read it first. Before modifying a function, trace its callers. Research before you edit.

### External Reference Documentation

Consult these primary sources when a task depends on Homebridge or Cucumber.js behavior:

- [Homebridge Plugin Documentation](https://developers.homebridge.io/#/) -- Homebridge APIs, plugin lifecycle, configuration schemas, and HAP services and characteristics.
- [Cucumber.js Documentation](https://github.com/cucumber/cucumber-js/tree/main/docs) -- Configuration, profiles, ESM and TypeScript support, hooks, World objects, step definitions, and CLI behavior.

Read only the pages that apply to the task. Compare current documentation with the pinned package versions and installed TypeScript definitions. If they differ, follow the pinned version and record the difference.

### Git

- NEVER commit to the main branch.
- Branch names: `main`, `features/*`, `releases/*`. New feature branches use `features/<name>`.
- Worktrees are preferred for new feature work; create them under `.worktrees/`.
- Commit as `.agents/skills/committing/SKILL.md` describes: its message format also applies to PR titles. NEVER use `--no-verify` to skip the hooks.
- NEVER rebase, never rewrite history. Update branches by merging.
- The secret hook scans staged file paths in filesystem mode, including linked worktrees. Outside the committing skill's pre-commit step, run all hooks without `SKIP` overrides.
- When writing PR descriptions, use the `simple-english` skill in Plain mode and the `humanizer` skill, if available.
- Always use `--squash` when merging PRs (`gh pr merge --squash`). The repository does not allow merge commits or rebase merges.
- Before merging a PR that ships a GSD milestone, audit and close the milestone (`/gsd-audit-milestone`, then `/gsd-complete-milestone`) on the PR branch, so the archive lands in the same squash.

### GSD records

- Prefix each `gsd-tools windows append --description` with the milestone, such as `[<milestone>]`. Phase numbers can repeat across milestones. Do not put the milestone in `--phase` or hand-edit `.planning/WINDOWS.md`.
- Include `## Threat Flags` in every plan `SUMMARY.md`, even when the answer is "None":

```markdown
## Threat Flags

None -- no security-relevant surface outside the plan's `<threat_model>` was introduced.
```

### Build verification

Read `.agents/skills/local-verification/SKILL.md` when planning or running checks. Commit hooks run incremental `check:commit` checks on build inputs. Full `npm run check` remains required for post-merge wave, phase, and merge gates, quick tasks after executor worktree merges, and final PR/release handoff. A passing commit hook does not replace a full gate. Reuse evidence only for unchanged inputs as defined in the skill. The complete gate includes Cucumber and isolated coverage for every source module.

### Versioning

Before creating a PR, offer to bump the version in `package.json` and `sonar-project.properties` and update `package-lock.json`. Concisely record changes in `CHANGELOG.md`.

<!-- GSD:project-start source:PROJECT.md -->

## Project

**Basement Guardian**

Basement Guardian is a safety-first Homebridge dynamic-platform plugin for owners of Basement Guardian Gemini sump-pump systems. It connects one vendor account to HomeKit, publishes every supported physical system as one stable multi-service accessory, and surfaces trustworthy flood, pump, power, battery, fault, connectivity, and official-control state without inventing unsupported meaning.

**Core Value:** HomeKit must promptly show trustworthy basement-protection conditions while clearly marking stale or invalid telemetry instead of reporting a false normal state.

### Constraints

- **Runtime**: TypeScript ESM on Node.js `^22.10.0 || ^24.0.0`; relative ESM imports use `.js` extensions.
- **Homebridge compatibility**: Support `^1.8.0 || ^2.0.0`, validate against current Homebridge 2.x, and use only HAP objects supplied by `api.hap`; do not import HAP-NodeJS directly at runtime.
- **Cloud dependency**: Discovery, state, credentials, and commands require the vendor Auth0, REST, and AWS IoT endpoints; no supported local API exists during normal operation.
- **Safety semantics**: Unknown, stale, omitted, or invalid values never become guessed measurements or normal defaults. Preserve the last valid value and mark the narrowest affected scope untrustworthy.
- **Identity**: Vendor `deviceId` is the immutable Homebridge UUID seed; `deviceTypeId` selects an adapter and never changes physical identity.
- **Privacy**: Credentials, tokens, temporary AWS credentials, raw responses, account identifiers, and local-network data cannot enter public artifacts, accessory context, or logs.
- **Persistence**: Auth0 tokens live under `api.user.storagePath()`; accessory-scoped observation data lives in typed `accessory.context` and is explicitly persisted.
- **Release**: `1.0.0` is blocked until G-001, G-002, G-003, G-004, automated tests, real-home tests, package inspection, secret scans, and compatibility checks pass.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->

## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

| Skill          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Path                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| humanizer      | \| Rewrite AI-sounding text so it reads naturally without changing what it says. Use when editing or reviewing prose for inflated claims, sales language, vague sources, repetitive structure, stock AI words, passive voice, filler, or chatbot artifacts. Based on Wikipedia's "Signs of AI writing."                                                                                                                                                                                                                                                                                                  | `.agents/skills/humanizer/SKILL.md`      |
| simple-english | \| Write or rewrite technical text with the rules of ASD-STE100 Simplified Technical English so it is clear, unambiguous, and free of AI slop. Use for documentation, READMEs, runbooks, procedures, error messages, release notes, incident reports, and API guides. Also use when the user says "STE", "Simplified Technical English", "ASD-STE100", "de-slop", "make this readable", "write for non-native readers", or asks for docs that translate well. Enforces the standard's 53 rules: 20/25-word sentence limits, one word one meaning, simple tenses, active voice, condition before command. | `.agents/skills/simple-english/SKILL.md` |

<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.

<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile. This section is managed by `generate-claude-profile` -- do not edit manually.

<!-- GSD:profile-end -->

______________________________________________________________________

<!-- fallow:setup-hooks:start -->

## Fallow task map

| When the agent is about to...                                     | Run                                                                                                                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| delete an "unused" export or file                                 | `fallow dead-code --trace <file>:<export>`                                                                                                              |
| prove a TypeScript symbol's exact consumers before refactoring    | `fallow dead-code --type-aware --symbol-impact <file>:<export-or-class.method>`                                                                         |
| find how one module reaches another                               | `fallow trace --path <from> <to>` (Reports `reachable: false` instead of failing when no import path exists; type-only hops are reported, not skipped.) |
| delete an "unused" dependency                                     | `fallow dead-code --trace-dependency <name>`                                                                                                            |
| commit or open a PR                                               | `fallow audit --base <ref>`                                                                                                                             |
| read a diff before approving it                                   | `fallow review --base <ref> --brief` (orientation, never gates: deterministic and always exit 0, unlike the audit row)                                  |
| prioritize refactoring                                            | `fallow health --hotspots --targets`                                                                                                                    |
| ask who owns code                                                 | `fallow health --ownership`                                                                                                                             |
| check untested-but-reachable code                                 | `fallow health --coverage-gaps`                                                                                                                         |
| consolidate duplication                                           | `fallow dupes --trace dup:<fingerprint>`                                                                                                                |
| find feature flags                                                | `fallow flags`                                                                                                                                          |
| check which architecture rules apply to a file before changing it | `fallow guard <files>`                                                                                                                                  |
| surface security candidates                                       | `fallow security`                                                                                                                                       |
| understand a finding                                              | `fallow explain <issue-type>`                                                                                                                           |
| scope a monorepo                                                  | `--workspace <glob> / --changed-workspaces <ref>` (global flags, prefix any command)                                                                    |

<!-- fallow:setup-hooks:end -->
