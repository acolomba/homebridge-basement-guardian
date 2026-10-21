# OFFLINE_LIBS complete-file review

Plan 07-08 reviews the four offline Auth0, loopback, timer, and shadow-broker helpers. Claude Opus 5.5 performed an independent, read-only Round 0 review at `338bdf0b5256b64c8bb9959b15514b87bb7ae0f0`. The maintainer's instruction to continue autonomously delegates triage of this batch. All eleven rule-backed candidates were accepted and repaired. They are harness findings, not confirmed production plugin bugs. Independent correction review is pending.

## Round 0 complete-file review

| Owned path | Reviewed blob | Contiguous lines read | Result |
| --- | --- | ---: | --- |
| `features/lib/auth0.ts` | `2513ab6eb09fb42a55a4808dc6df2a1beed5a11f` | 1-149 | 001, 007, 008, 010. |
| `features/lib/loopbackServer.ts` | `359d5e87e51f4dfc15ed761bea489adc0038b86b` | 1-76 | 002, 009. |
| `features/lib/timers.ts` | `97e6d1300ed774df7adfa2458242288817e062e3` | 1-83 | 003, 005, 011. |
| `features/lib/shadowBroker.ts` | `e1871ccafb0ca39c97a2684fce46b9fa287542bd` | 1-273 | 004, 006. |

The reviewer also read Plan 07-08, the Phase 7 and Phase 1 review protocols, the Cucumber and TypeScript style skills and their applicable rules, and related world, step, fake, feature, and runtime timer files. It did not run commands or verify blobs. The coordinator matched these blob IDs to the reviewed HEAD and checked the current callers and project rules. The last full gate passed at `71d4667` on unchanged executable inputs: 106/106 offline scenarios, 1208/1208 steps, and 43 direct coverage pairs. No file in this batch has changed since that gate.

## Round 0 findings and dispositions

Each candidate first appeared in Round 0. The observed location remains qualified by the reviewed revision. Each accepted repair needs a separate commit and current verification evidence. Additional test or shared-step paths require an exact-path plan addendum before editing.

| ID | Requirement | Rule path and heading | Observed location | Severity | Disposition and plausible wrong result |
| --- | --- | --- | --- | --- | --- |
| CR-07-OFFLINE_LIBS-001 | FEAT-02 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source; `.agents/skills/typescript-style/rules/modules-and-data.md` §Files and modules | `338bdf0:features/lib/auth0.ts:1-7` | WARNING | **Accepted; open.** Add the required SPDX line and separate copyright JSDoc before the existing overview. The current file lacks the approved license and attribution header. |
| CR-07-OFFLINE_LIBS-002 | FEAT-02 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source; `.agents/skills/typescript-style/rules/modules-and-data.md` §Files and modules | `338bdf0:features/lib/loopbackServer.ts:1-7` | WARNING | **Accepted; open.** The same required header is missing from this file. |
| CR-07-OFFLINE_LIBS-003 | FEAT-02 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source; `.agents/skills/typescript-style/rules/modules-and-data.md` §Files and modules | `338bdf0:features/lib/timers.ts:1-21` | WARNING | **Accepted; open.** The same required header is missing from this file. |
| CR-07-OFFLINE_LIBS-004 | FEAT-02 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source; `.agents/skills/typescript-style/rules/modules-and-data.md` §Files and modules | `338bdf0:features/lib/shadowBroker.ts:1-14` | WARNING | **Accepted; open.** The same required header is missing from this file. |
| CR-07-OFFLINE_LIBS-005 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `src/runtime/timers.ts` `Timers.clearTimeout` contract | `338bdf0:features/lib/timers.ts:68-81` | BLOCKER | **Accepted; open.** `runDue()` snapshots due entries. If one handler clears another due handle, the cleared handler still runs; a cleared interval can also be rearmed. This can give a false harness result for cancellation. Add an active regression and repair the fake. |
| CR-07-OFFLINE_LIBS-006 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `.agents/skills/typescript-style/rules/comments.md` §Comments and test titles | `338bdf0:features/lib/shadowBroker.ts:39-47,187-194,225-229` | WARNING | **Accepted; open.** `currentSubscriptions()` can return the ended connection's topics until another MQTT CONNECT arrives, despite promising the connection now open. A wait could pass on stale subscriptions. Repair the fake and the disconnected-publication scenario's step path without weakening connected-publication checks. |
| CR-07-OFFLINE_LIBS-007 | FEAT-02 | `.agents/skills/cucumber/rules/world-and-stand-ins.md` §Fakes and drivers | `338bdf0:features/lib/auth0.ts:92-106` | WARNING | **Accepted; open.** Wrong-route requests get a 404 without a request record; malformed JSON rejects before recording or responding. The latter can leave a request hanging and report an unhandled rejection instead of the received bad grant. Add an active regression and repair the fake. |
| CR-07-OFFLINE_LIBS-008 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Cucumber behavioral tests; `.agents/skills/cucumber/rules/world-and-stand-ins.md` §Fakes and drivers | `338bdf0:features/lib/auth0.ts:75-90` | WARNING | **Accepted; open.** The fake records a six-field projection, so the whole-value grant assertion cannot see extra fields or changed value types in the actual JSON request. A plugin could send an extra credential or `audience` and the assertion would pass. Add an active regression and preserve the received grant for exact comparison. |
| CR-07-OFFLINE_LIBS-009 | FEAT-02 | `.agents/skills/typescript-style/rules/comments.md` §Comments and test titles | `338bdf0:features/lib/loopbackServer.ts:16,46-48` | WARNING | **Accepted; open.** The comment says handler errors bubble with a stack trace. The `void handle(...)` call instead creates an unhandled rejection, while the response remains open. State the actual contract after the bad-request handling is repaired. |
| CR-07-OFFLINE_LIBS-010 | FEAT-02 | `.agents/skills/typescript-style/rules/types.md` §Types | `338bdf0:features/lib/auth0.ts:68` | WARNING | **Accepted; open.** `armedFailure` uses `ArmedFailure \| undefined` where the rule prefers an optional field. This is a type-style issue only. |
| CR-07-OFFLINE_LIBS-011 | FEAT-02 | `.agents/skills/typescript-style/rules/types.md` §Types | `338bdf0:features/lib/timers.ts:39` | WARNING | **Accepted; open.** `intervalMs` uses `number \| undefined` where the rule prefers an optional field. This is a type-style issue only. |

Opening accepted count: 11. No rejected IDs. The first correction review has not run.

## Repair evidence

| ID | Fix commit | Verification |
| --- | --- | --- |
| 001 | `8f14085` | `SKIP=npm-check pre-commit run --files features/lib/auth0.ts`, Fallow audit, and normal commit hooks passed. |
| 002 | `67baa34` | The same checks passed for `features/lib/loopbackServer.ts`. |
| 003 | `fcd99e4` | The same checks passed for `features/lib/timers.ts`. |
| 004 | `afa911d` | The same checks passed for `features/lib/shadowBroker.ts`. |
| 005 | `18340fa` | Two active timer scenarios failed on the old fake with an extra `second` observation, then passed 2/2 after the dispatch check. Normal hooks passed. |
| 006 | `5d5cde2` | The broker-close scenario failed on stale subscriptions before repair, then passed. The affected credential-refusal scenario passed with a distinct publication step that requires no live subscriber. Normal hooks passed. |
| 007 | `19d536b` | Unknown-route recording failed and malformed JSON timed out before repair. Both active scenarios then passed 2/2; normal hooks passed. |
| 008 | `224a94f` | The extra-credential and numeric-scope scenario failed on the six-field projection, then passed. The original grant and real account sign-in scenarios also passed; normal hooks passed. |
| 009 | `4a66a39` | The loopback handler comment now names the expected bad-input contract. The normal hook passed on retry after an unrelated temporary-directory cleanup race in `accountRuntime.test.ts`; that test passed 169/169 on direct rerun. |
| 010 | `a74110d` | The armed-failure scenario passed after the optional-field change; normal hooks passed. |
| 011 | `60cd834` | Both timer cancellation scenarios passed after the optional-field change; normal hooks passed. |

The combined-tree `npm run check` passed at `60cd834f31d4d50f23174601e041c5500da3b167` on Node v26.12.0: 111/111 offline scenarios, 1230/1230 steps, and 43 direct coverage pairs. The prior 106/1208 count rose by five named harness scenarios and 22 steps; no default scenario was removed. `cucumber-js --dry-run --format usage` exited zero and listed zero UNUSED definitions. The real profile dry run exited zero with 7 skipped scenarios and 41 skipped steps. All fix commits passed normal hooks. The independent correction review follows.

## Correction round 1

Claude Opus 5.5 independently read the full current files at `60cd834f31d4d50f23174601e041c5500da3b167` using only read access. The reviewer ran no commands or tests; the coordinator verified the committed blobs below. It also read the Phase 7 review protocol, applicable Cucumber and TypeScript rules, the batch report, and `features/support/world.ts` for subscriber teardown behavior.

| Reviewed path | Blob | Contiguous lines read |
| --- | --- | ---: |
| `features/lib/auth0.ts` | `178ee516e30b514c9024e0f1a66a6a076ad897ba` | 1-155 |
| `features/lib/loopbackServer.ts` | `a94eed084485bdc615d1f4c6d3716c2032688d47` | 1-82 |
| `features/lib/timers.ts` | `7f576b84a33d77806c2d8b3336da33186e0e2d30` | 1-99 |
| `features/lib/shadowBroker.ts` | `aa2b3a8f780ffcbdae2a96176edad2968f034bb9` | 1-284 |
| `features/harness/fakes.feature` | `775d6cf3928c741f4ed2ac405bd8ced47a7fa4c8` | 1-143 |
| `features/step_definitions/harness.steps.ts` | `7719ad497a907da1246675b338c31bcc6e0f1d91` | 1-526 |
| `features/step_definitions/account.steps.ts` | `e443e05a2c322995084e129f18189a823cc8aa2d` | 1-238 |
| `features/monitoring/degradation.feature` | `ab504476d5ff5fd81374d10fc0d634b9c0f8399d` | 1-730 |
| `features/step_definitions/shadow.steps.ts` | `368f0c8ce5869ded3b1e18858b17641b2fbcf836` | 1-498 |

The reviewer found 001-011 fixed in code. It raised the following new findings, all accepted. The first review count fell, so this round did not trigger STOP.

| ID | Requirement | Rule path and heading | Observed location | Severity | Disposition and plausible wrong result |
| --- | --- | --- | --- | --- | --- |
| CR-07-OFFLINE_LIBS-012 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Cucumber behavioral tests and §Review | `60cd834:features/harness/fakes.feature:108-110`; `60cd834:features/step_definitions/harness.steps.ts:337-339` | BLOCKER | **Accepted; open.** The cancelled-interval scenario says “or repeat,” but the clock remains at 2 while a wrongly rearmed interval would be due at 4. Advancing past 4 must still leave only the first observation. |
| CR-07-OFFLINE_LIBS-013 | FEAT-02 | `.agents/skills/typescript-style/rules/types.md` §Types | `60cd834:features/lib/timers.ts:54` | WARNING | **Accepted; open.** The private `arm` parameter still requires explicit `undefined`; use an optional parameter and omit it from the timeout call. |
| CR-07-OFFLINE_LIBS-014 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review | `60cd834:features/step_definitions/harness.steps.ts:487-491` | WARNING | **Accepted; open.** The subscriber can observe close before the broker has removed its subscription record. A single immediate read may fail at random; poll until cleanup completes within the named deadline. |

| Opening IDs | Fixed | Rejected | New | Reopened | Closing IDs |
| --- | ---: | ---: | ---: | ---: | --- |
| 001-011 (11) | 001-011 (11) | 0 | 012-014 (3) | 0 | 012-014 (3) |

Closing = 11 - 11 - 0 + 3 + 0 = 3. Correction round 2 may follow the three separate repairs.

## Correction round 1 repair evidence

| ID | Fix commit | Verification |
| --- | --- | --- |
| 012 | `fe59b67` | The interval scenario passed after advancing past its next deadline. A temporary wrong fake that rearmed a cancelled interval failed the active scenario with `['first', 'second']` instead of `['first']`; the fake source was restored exactly before commit. Normal hooks passed. |
| 013 | `5dc312d` | Both timer cancellation scenarios passed after making the private parameter optional; normal hooks passed. |
| 014 | `ddb0f91` | The broker-close scenario passed with bounded polling for subscription cleanup. The normal hook passed with `TEST_CONCURRENCY=1` after the unrelated account-runtime temporary-directory cleanup race recurred under concurrent execution; the account test passed directly on rerun. |

The combined-tree `TEST_CONCURRENCY=1 npm run check` passed at `ddb0f916bfb29e1ab029bdb7bec9829f00d754c1` on Node v26.12.0: 111/111 offline scenarios, 1230/1230 steps, and 43 direct coverage pairs. The default usage check exited zero with zero UNUSED definitions. The real profile dry run exited zero with 7 skipped scenarios and 41 skipped steps. Correction round 2 follows.

## Correction round 2

A new Claude Sonnet reviewer independently read the complete nine current files at source revision `ddb0f916bfb29e1ab029bdb7bec9829f00d754c1` using only read access. It read the Phase 7 protocol and applicable Cucumber and TypeScript rules, this report, and the runtime timer port. It ran no command or test. The coordinator checked the committed blobs.

| Reviewed path | Blob | Contiguous lines read |
| --- | --- | ---: |
| `features/lib/auth0.ts` | `178ee516e30b514c9024e0f1a66a6a076ad897ba` | 1-155 |
| `features/lib/loopbackServer.ts` | `a94eed084485bdc615d1f4c6d3716c2032688d47` | 1-82 |
| `features/lib/timers.ts` | `2d28246cbd0802b8c42bb02eff6a2be0a855b89d` | 1-99 |
| `features/lib/shadowBroker.ts` | `aa2b3a8f780ffcbdae2a96176edad2968f034bb9` | 1-284 |
| `features/harness/fakes.feature` | `775d6cf3928c741f4ed2ac405bd8ced47a7fa4c8` | 1-143 |
| `features/step_definitions/harness.steps.ts` | `b7760a036f102f0882c5e38da352d267d92fccf2` | 1-529 |
| `features/step_definitions/account.steps.ts` | `e443e05a2c322995084e129f18189a823cc8aa2d` | 1-238 |
| `features/monitoring/degradation.feature` | `ab504476d5ff5fd81374d10fc0d634b9c0f8399d` | 1-730 |
| `features/step_definitions/shadow.steps.ts` | `368f0c8ce5869ded3b1e18858b17641b2fbcf836` | 1-498 |

The reviewer found 012-014 fixed and 001-011 still fixed. It raised one new accepted finding:

| ID | Requirement | Rule path and heading | Observed location | Severity | Disposition and plausible wrong result |
| --- | --- | --- | --- | --- | --- |
| CR-07-OFFLINE_LIBS-015 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Cucumber behavioral tests and §Review; `src/runtime/timers.ts` `Timers.clearInterval` contract | `ddb0f91:features/step_definitions/harness.steps.ts:330-335`; `ddb0f91:features/lib/timers.ts:78` | BLOCKER | **Accepted; open.** The interval scenario calls `clearTimeout` for its interval handle. A no-op `clearInterval` can pass the suite, so the scenario must use `clearInterval` for that variant. |

| Opening IDs | Fixed | Rejected | New | Reopened | Closing IDs |
| --- | ---: | ---: | ---: | ---: | --- |
| 012-014 (3) | 012-014 (3) | 0 | 015 (1) | 0 | 015 (1) |

Closing = 3 - 3 - 0 + 1 + 0 = 1. The count fell and no fixed ID reopened, so correction round 3 may follow repair 015.
