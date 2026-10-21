# HAP complete-file review

Plan 07-09 owns the shared HAP stand-in and its contract steps. Claude Opus 5.5 performed an independent, read-only Round 0 review at `3702f87da9a81ec83eb64d99cbe21f5dd2d2de1d`. The reviewer read only the two source files and the authorized project rules. It ran no commands and made no edits. The coordinator verified the committed blobs, traced Cucumber and unit-test consumers, and compared disputed behavior with the installed `@homebridge/hap-nodejs` 2.2.2 package. Source remains unchanged at triage.

## Round 0 complete-file review

| Owned path | Reviewed blob | Contiguous lines read | Candidate IDs |
| --- | --- | ---: | --- |
| `features/lib/hap.ts` | `9663320dbac2a2e9e51ad66c0d1d0634ca61bf91` | 1-729 | 001-014 |
| `features/step_definitions/hap.steps.ts` | `47039c7ab6deffbd13686f429c5dc8d73ebdd21b` | 1-316 | 015-021 |

The reviewer read `AGENTS.md`, Plan 07-09, the Phase 7 review protocol, and the applicable Cucumber and TypeScript style skills and rules. The reviewed commit and both blobs match `HEAD` before source edits. The 21 candidates below received stable IDs at triage: 19 accepted and two rejected. An accepted ID remains open until its repair and independent correction review are recorded.

## Round 0 findings and dispositions

| ID | Requirement | Rule path and heading | Observed location | Severity | Disposition and cause |
| --- | --- | --- | --- | --- | --- |
| CR-07-HAP-001 | FEAT-02 | `.agents/skills/typescript-style/rules/comments.md` §Comments and test titles | `3702f87:features/lib/hap.ts:24` | WARNING | **Accepted; fixed.** “Now an explicit development dependency” narrated a past change instead of stating the current relationship. Removed “now”. |
| CR-07-HAP-002 | FEAT-02 | `.agents/skills/typescript-style/rules/naming-and-docs.md` §Comments and documentation | `3702f87:features/lib/hap.ts:103-116` | WARNING | **Accepted; fixed.** Two adjacent JSDoc blocks described `FakeHapStatusError`; the first attached to no declaration. Removed the stale block. |
| CR-07-HAP-003 | FEAT-02 | `.agents/skills/typescript-style/rules/classes.md` §Classes | `3702f87:features/lib/hap.ts:122,301-305` | WARNING | **Accepted; fixed.** Both constructors now declare readonly fields and assign them explicitly. |
| CR-07-HAP-004 | FEAT-02 | `.agents/skills/typescript-style/rules/naming-and-docs.md` §Naming | `3702f87:features/lib/hap.ts:149,394-398` | WARNING | **Accepted; fixed.** The property is named `BOUNDED_STRING` for its `maxLen: 64` constraint. |
| CR-07-HAP-005 | FEAT-02 | `.agents/skills/typescript-style/rules/comments.md` §Comments and test titles | `3702f87:features/lib/hap.ts:151-159` | WARNING | **Accepted; fixed.** Comments now state the specific roles of `ConfiguredName` and `On` without claiming either is the only paired-write characteristic. |
| CR-07-HAP-006 | FEAT-02 | `.agents/skills/typescript-style/rules/comments.md` §Comments and test titles | `3702f87:features/lib/hap.ts:186-194,477-479` | WARNING | **Accepted; fixed by 013.** The `pushed` documentation excludes HAP construction, but the old service-set path marked a constructor-supplied `Name` as pushed. The corrected path leaves that constructed name unpushed, as the documented safety gate requires. |
| CR-07-HAP-007 | FEAT-02 | `.agents/skills/typescript-style/rules/types.md` §Types; `naming-and-docs.md` §Comments and documentation | `3702f87:features/lib/hap.ts:216-217,348-353` | WARNING | **Accepted; fixed.** `handleGetRequest` is typed `Promise<unknown>` and its description names value resolution and status rejection. |
| CR-07-HAP-008 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/world-and-stand-ins.md` §Fakes and drivers | `3702f87:features/lib/hap.ts:281-290,333-339` | BLOCKER candidate | **Rejected.** Mapping a plain handler error to `SERVICE_COMMUNICATION_FAILURE` matches the installed HAP write path and is pinned by `test/accessories/hapWriteFidelity.test.ts`’s plain-error parity case. The rule does not require the fake to record internal programming errors separately, and no product requirement makes the HAP warning a scenario outcome. |
| CR-07-HAP-009 | FEAT-02 | `AGENTS.md` §Simplicity First | `3702f87:features/lib/hap.ts:322-326` | WARNING | **Accepted; fixed.** Removed the repeated `SUCCESS` assignment from the no-handler branch. |
| CR-07-HAP-010 | FEAT-02 | `.agents/skills/typescript-style/rules/comments.md` §Comments and test titles | `3702f87:features/lib/hap.ts:382,392-425` | WARNING | **Accepted; fixed.** The comment no longer hardcodes a count. |
| CR-07-HAP-011 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/world-and-stand-ins.md` §Fakes and drivers | `3702f87:features/lib/hap.ts:482-488` | BLOCKER | **Accepted; fixed.** The stand-in accepted duplicate characteristic UUIDs. Installed HAP refuses them, except its special FirmwareRevision case. A duplicated production declaration could pass against the fake but fail under Homebridge. A direct real/fake probe reproduced the difference. |
| CR-07-HAP-012 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/world-and-stand-ins.md` §Fakes and drivers | `3702f87:features/lib/hap.ts:490-495` | BLOCKER | **Accepted; fixed.** Installed HAP adds a missing characteristic during class-based `getCharacteristic`; the stand-in returned `undefined`. This could hide a good-news default published by an accidental production lookup. A direct real/fake probe reproduced the difference. The current `seedConfiguredName` guard deliberately calls `testCharacteristic` first. |
| CR-07-HAP-013 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/world-and-stand-ins.md` §Fakes and drivers; `.agents/skills/typescript-style/rules/comments.md` §Comments and test titles | `3702f87:features/lib/hap.ts:497-501` | BLOCKER | **Accepted; fixed.** Real `setCharacteristic` enters `onSet`; the fake silently stored through `updateCharacteristic`. A control implementation using it for a status push could pass fake-backed tests while sending a vendor command in Homebridge. An installed real/fake probe recorded one handler call versus zero. |
| CR-07-HAP-014 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `.agents/skills/typescript-style/rules/comments.md` §Comments and test titles | `3702f87:features/lib/hap.ts:629-630,666-669` | WARNING | **Accepted; fixed.** A nameless real `AccessoryInformation` requires `Name` with `Unnamed Service` and declares `ConfiguredName` optional; the fake had neither. A direct real/fake probe reproduced both differences. The repair models the plugin-relevant members and narrows the comment's claim. |
| CR-07-HAP-015 | FEAT-02 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source; `.agents/skills/typescript-style/rules/modules-and-data.md` §Files and modules | `3702f87:features/step_definitions/hap.steps.ts:1-10` | WARNING | **Accepted; fixed.** Added the approved SPDX line and separate copyright block before the overview. |
| CR-07-HAP-016 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | `3702f87:features/step_definitions/hap.steps.ts:62-71` | BLOCKER | **Accepted; fixed.** The assertion compares all declared characteristic and service UUIDs to independent literals; a wrong `StatusFault` UUID fails it. |
| CR-07-HAP-017 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | `3702f87:features/step_definitions/hap.steps.ts:75-88` | BLOCKER | **Accepted; fixed.** The assertion compares complete formats, permissions, and units; a wrong paired-write value fails it. |
| CR-07-HAP-018 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `rules/steps.md` §Steps | `3702f87:features/step_definitions/hap.steps.ts:113-127` | BLOCKER | **Accepted; fixed.** The assertion compares value, status, and pushed state together; a wrong constructed `pushed: true` fails it. |
| CR-07-HAP-019 | FEAT-02 | `.agents/skills/cucumber/rules/steps.md` §Steps | `3702f87:features/step_definitions/hap.steps.ts:162-184` | WARNING | **Accepted; fixed.** The assertion compares complete relevant optional lists for five service types; removing Switch's optional Name fails it. |
| CR-07-HAP-020 | FEAT-02 | `.agents/skills/cucumber/rules/steps.md` §Steps | `3702f87:features/step_definitions/hap.steps.ts:188-316` | WARNING candidate | **Rejected.** These are self-contained stand-in contract assertions. Each creates ephemeral local objects, calls the behavior it asserts, and leaves no scenario or external state. The step text names that behavior directly; splitting each into World-backed When/Then pairs would add state without making the contract more observable. |
| CR-07-HAP-021 | FEAT-02 | `.agents/skills/cucumber/rules/steps.md` §Steps | `3702f87:features/step_definitions/hap.steps.ts:73,90,106,129,156,186,204,224,256,285,295,316` | WARNING | **Accepted; fixed.** World-free registrations now use arrow callbacks. |

Opening accepted count: **19** (001-007, 009-019, 021). Rejected candidates: **008, 020**. No source edit preceded this triage. The exact-path Plan 07-09 addenda authorize the HAP contract scenarios and wording in `features/harness/fakes.feature`. Each accepted cause received a separate normal-hook commit and focused verification. The current repair status awaits independent correction review.

## Repair evidence

| ID | Fix commit | Focused evidence and latest gate |
| --- | --- | --- |
| 011 | `9c17da4` | The new named duplicate-characteristic scenario failed on the old fake with “Missing expected exception” and passed after repair. A real/fake probe confirmed both return the existing Firmware Revision on a repeat add. Normal hooks passed. |
| 012 | `9beeba7` | The new named lookup scenario failed on the old fake with `after: false`, `count: 0`, and missing fields. It passed after add-on-lookup, while `testCharacteristic` stayed non-mutating. The existing format-default scenario and 113/113 offline scenarios passed. The normal hook passed after removing optional chains made obsolete by the corrected return type. |
| 013 and 006 | `f0d3212` | The new named service-set scenario failed on the old fake with `received: []` and passed after the handler path was restored. A real/fake probe confirmed an asynchronously refused set preserves the prior value and stores `RESOURCE_BUSY`. A constructor-supplied `Name` is now unpushed, resolving 006. The 114/114 offline scenarios and normal hooks passed. |
| 014 | `3e4bef0` | The new named nameless-service scenario failed with missing `Name`, empty value, and missing optional `ConfiguredName`; it passed after repair. The 115/115 offline scenarios, 1238/1238 steps, and normal hooks passed. The first hook run found only a blank-line lint error; the corrected normal commit passed. |
| 016 | `271daea` | The expanded namespace scenario failed under a temporary wrong `StatusFault` UUID and passed after the fake was restored byte-for-byte. Its complete characteristic and service maps use independent literal UUIDs. Normal hooks passed. |
| 017 | `4e5b045` | A temporary wrong `PAIRED_WRITE` value failed the whole-value assertion. The restored fake passed the named scenario and normal hooks. |
| 018 | `f3ed148` | A temporary constructed `pushed: true` failed the default-state assertion. The fake was restored byte-for-byte, and the named scenario and normal hooks passed. |
| 019 | `a602bf4` | Temporarily removing Switch's optional `Name` failed the expanded five-service declaration assertion. The fake was restored byte-for-byte, and the named scenario and normal hooks passed. The feature and matching step wording changed together; scenario and step counts did not change. |
| 021 | `686d9ed` | Twelve world-free step registrations use arrow callbacks. A first normal commit hook rejected shorthand arrows that returned void; block-body callbacks then passed the normal hook. The 115-scenario dry run resolved all steps. |
| 007 | `d1bedf8` | All traced `handleGetRequest` consumers already await the result or accept a promise. The interface, implementation, and description now state its promise behavior. Normal hooks passed. |
| 015 | `92becd9` | Added SPDX and separate copyright blocks before the step module overview. Normal hooks passed. |
| 003 | `5e33367` | Both constructor parameter properties became explicit readonly fields and assignments. Normal hooks passed. |
| 004 | `e25fcc5` | Renamed only the string property object and its four consumers. Normal hooks passed. |
| 005 | `7b059a1` | Corrected the `ConfiguredName` and `On` comments to describe their actual roles. Normal hooks passed. |
| 009 | `a5b144d` | Removed only the second `SUCCESS` assignment in the no-handler branch. Normal hooks passed. |
| 010 | `d9502fc` | Removed the brittle characteristic count from its comment. Normal hooks passed. |
| 001 | `64d502c` | Removed “now” from the dependency overview. Normal hooks passed. |
| 002 | `a6534f9` | Removed the unattached JSDoc block. Normal hooks passed. |

The four named HAP scenarios add four scenarios and eight steps to the prior 111/1230 default suite. No scenario was removed. Node was v26.12.0. At `a6534f9`, `TEST_CONCURRENCY=1 npm run check` passed with 115/115 offline scenarios, 1238/1238 steps, and 43 direct coverage pairs. The default usage dry run exited zero; the real-profile dry run skipped all 7 scenarios and 41 steps. No real-profile scenario executed.

## Correction rounds

Pending independent full-file correction review after repairs.
