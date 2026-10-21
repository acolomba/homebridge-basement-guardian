# OFFLINE_LIBS complete-file review

Plan 07-08 reviews the four offline Auth0, loopback, timer, and shadow-broker helpers. Claude Opus 5.5 performed an independent, read-only Round 0 review at `338bdf0b5256b64c8bb9959b15514b87bb7ae0f0`. The maintainer's instruction to continue autonomously delegates triage of this batch. All eleven rule-backed candidates are accepted for repair. They are harness findings, not confirmed production plugin bugs. Verification and fix commits are pending.

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
