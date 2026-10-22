# REAL_WORLD review

## Round 0 complete-file review

Independent reviewer: Claude Opus 5.5, read-only, 2026-10-22. It read the
complete current `features/real-pump/support/realWorld.ts` at committed HEAD
`649f92b8fb628680e6ad47a865d905509abafaf6`, contiguous lines 1-339,
blob `2c5053493c85e32e13259856318ff98895a0ff48`. The coordinator confirmed
the blob and locally inspected the current real step callers, runtime stop,
and installed Cucumber 13.2.1 runner. The reviewer read the applicable
Cucumber, TypeScript, plan, and project rules, and no other source files.
No real-profile step was run.

The reviewer reported a cleanup BLOCKER and nine numbered WARNING candidates,
despite a heading that counted eight. The coordinator added five candidates
after tracing the external behavior the reviewer could not inspect. Fourteen
IDs are accepted and one rejected; opening open count is **14**. The real
profile baseline is six skipped scenarios and 35 skipped steps.

| ID | Severity | Observed location | Rule | Disposition and reason |
| --- | --- | --- | --- | --- |
| CR-07-REAL_WORLD-001 | BLOCKER | `649f92b:features/real-pump/support/realWorld.ts:241-248` | `cucumber/rules/world-and-stand-ins.md`, The world; `cucumber/SKILL.md`, Review | Open. If runtime stop rejects, the scratch directory holding the token cache is not removed. Release all resources and report failures without raw vendor text. |
| CR-07-REAL_WORLD-002 | WARNING | `649f92b:features/real-pump/support/realWorld.ts:137` | `typescript-style/rules/classes.md`, Classes | Open. Constructor parameter property violates the explicit field rule. The field has no reader; keep only the constructor parameter passed to `super`. |
| CR-07-REAL_WORLD-003 | WARNING | `649f92b:features/real-pump/support/realWorld.ts:251` | `typescript-style/rules/functions.md`, Functions | Open. The logging callback returns a discarded `push` result. Use a block body. |
| CR-07-REAL_WORLD-004 | WARNING | `649f92b:features/real-pump/support/realWorld.ts:83-85` | `typescript-style/rules/functions.md`, Functions | Open. The named `info` function is an arrow without an explicit function type or captured outer `this`. Use a declaration. |
| CR-07-REAL_WORLD-005 | WARNING | `649f92b:features/real-pump/support/realWorld.ts:142,147,152,157,162,172,182` | `typescript-style/rules/naming-and-docs.md`, Comments and documentation | Open. Method descriptions start with noun phrases. Make them third-person verb phrases without changing semantics. |
| CR-07-REAL_WORLD-006 | WARNING | `649f92b:features/real-pump/support/realWorld.ts:108` | `typescript-style/rules/naming-and-docs.md`, Comments and documentation | Open. The class comment omits when and how Cucumber uses this World. Add that context. |
| CR-07-REAL_WORLD-007 | WARNING | `649f92b:features/real-pump/support/realWorld.ts:42-49` | `typescript-style/rules/comments.md`, Comments | Open. A five-minute poll interval cannot provide a second poll in a two-minute scenario. Correct the comment without changing the configured interval. |
| CR-07-REAL_WORLD-008 | WARNING | `649f92b:features/real-pump/support/realWorld.ts:225-227,276` | `typescript-style/rules/comments.md`, Comments | Open. The initialize and first-start rationales do not match the file. State the actual hook and restart flow. |
| CR-07-REAL_WORLD-009 | WARNING | `649f92b:features/real-pump/support/realWorld.ts:181-199` | `typescript-style/rules/functions.md`, Errors; `rules/comments.md`, Comments | Open. The cache reader turns every I/O error into an absent file. Return undefined only for `ENOENT`; propagate other errors. |
| CR-07-REAL_WORLD-010 | WARNING | `649f92b:features/real-pump/support/realWorld.ts:108,331-339` | `cucumber/rules/layout.md`, Vertical functions; `rules/world-and-stand-ins.md`, The world | Rejected for this batch. The separate real-profile World and glob are an explicit safety boundary. Moving this file into the default `features/support` import would register a vendor-backed World in the offline suite. The project plan explicitly retains isolation; Plan 07-13 moves step registrations within that isolated profile. |
| CR-07-REAL_WORLD-011 | BLOCKER | `649f92b:features/real-pump/support/realWorld.ts:123-139,241-248` | `cucumber/SKILL.md`, Review; `rules/world-and-stand-ins.md`, The world | Open. Node's installed `unhandledRejection` listener prevents its default fatal behavior, while four of the six real scenarios do not assert the rejection array. Fail every scenario at cleanup when any rejection was observed, after resource release. |
| CR-07-REAL_WORLD-012 | BLOCKER | `649f92b:features/real-pump/support/realWorld.ts:137-139,333-339` | `cucumber/SKILL.md`, Review; `rules/world-and-stand-ins.md`, The world | Open. Installed Cucumber 13.2.1 constructs a World during `--dry-run` but skips Before and After hooks; the constructor installs a process listener that no hook releases. Install it in the live `Before` initialization path instead. |
| CR-07-REAL_WORLD-013 | BLOCKER | `649f92b:features/real-pump/support/realWorld.ts:143-145,216-220` | `cucumber/SKILL.md`, Review | Open. Restart retains the first runtime's discovered IDs, so the post-restart discovery step can pass before the new runtime discovers anything. Clear the ID list at restart. Returning live arrays is not independently a defect for current callers, which read their values immediately. |
| CR-07-REAL_WORLD-014 | WARNING | `649f92b:features/real-pump/support/realWorld.ts:230-237` | `AGENTS.md`, Privacy | Open. The account email is a private identifier but only the password is registered with the logger. Register the email too, without logging it. No actual email log was found in the locally inspected code. |
| CR-07-REAL_WORLD-015 | BLOCKER | `649f92b:features/real-pump/support/realWorld.ts:123-125,163-165` | `AGENTS.md`, Privacy; `cucumber/SKILL.md`, Review | Open. `String(reason)` stores raw rejection content, and the real step assertions include the array as an assertion's actual value on failure. Record a fixed, non-sensitive marker instead of rejection text. |

Other reviewer hypotheses were checked and not given open IDs: the production
runtime's second `stop()` is explicitly idempotent, though its first stop can
still reject; current step consumers do not retain `deviceIds()` or
`observations()` arrays; Cucumber's default step timeout already bounds
unqualified start and restart steps. The World header has the approved SPDX,
copyright, and overview blocks. Source edits follow this triage record.
