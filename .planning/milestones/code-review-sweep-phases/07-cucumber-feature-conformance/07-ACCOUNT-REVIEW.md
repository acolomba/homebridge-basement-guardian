# ACCOUNT complete-file review

This report covers the `code-review-sweep` ACCOUNT owner batch. The independent
reviewer was `/root/phase7_plan02/account_review`. The reviewer read every line
of each committed file at `e3af8dda5294a5933b55c097e3d8e749ee70725a`,
including comments, step registrations, assertions, and scenario text. The
review used the Cucumber feature, step, layout, and stand-in rules; the
TypeScript style rules; and the approved header form in `07-REVIEW-PROTOCOL.md`.

## Round 0 complete-file review

| Owned path | Reviewed blob | Contiguous lines | Result |
| --- | --- | ---: | --- |
| `features/account/configuration.feature` | `631f8aaa331fa0a515f60d6f98c00cbdf83f0688` | 1-45 | Finding 008. |
| `features/account/sign-in.feature` | `7976acdf1a3d74ec152a45c14f7225d2a4c4acb0` | 1-48 | Findings 001-004 and 006-007. |
| `features/step_definitions/account.steps.ts` | `0f7922e51215818ae7a30b62239071332a8441f2` | 1-188 | Findings 001-004 and 006-007. Header and remaining TypeScript rules clean. |
| `features/step_definitions/configuration.steps.ts` | `e033c7c4049ab64cb8c92ed80613033814218b9e` | 1-88 | Finding 005; candidate 009 rejected. |

The reviewer compared scenario claims with the local Auth0 and REST stand-ins,
the per-scenario world, registered step text, and the current production
contract. No live account or real profile step ran. The default baseline is
104 scenarios and 1,156 steps at `e3af8dd`.

## Findings and triage

`B` means BLOCKER and `W` means WARNING. Every location includes the observed
commit. The opening accepted set is 001-008 (8 IDs); 009 is a rejected review
candidate and is not counted open. A scenario assertion gap is a review finding,
not an observed production bug. No production RED/GREEN pair is claimed here.
The dispositions in this first table describe Round 0 only. The correction
rounds and final status below supersede its pending entries.

| ID | Requirement | Rule path and section | First round | Observed location | Severity | Disposition and reason | Regression / fix / verification |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| CR-07-ACCOUNT-001 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review, plausible wrong implementation | 0 | `e3af8dd:features/account/sign-in.feature:26`; `e3af8dd:features/step_definitions/account.steps.ts:162` | B | open: one observed refusal does not establish that authentication stays stopped; a later retry could extend the vendor block. | Pending controlled retry proof; no production bug established. |
| CR-07-ACCOUNT-002 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review, plausible wrong implementation | 0 | `e3af8dd:features/account/sign-in.feature:35`; `e3af8dd:features/step_definitions/account.steps.ts:168` | B | open: one 429 and its warning do not establish that authentication waits and retries; a permanent stop passes. | Pending controlled retry proof; no production bug established. |
| CR-07-ACCOUNT-003 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review, plausible wrong implementation; `rules/steps.md` §Steps | 0 | `e3af8dd:features/account/sign-in.feature:19`; `e3af8dd:features/step_definitions/account.steps.ts:127` | B | open: a restart that does no discovery can keep the cumulative token count at one. | Pending restart REST and authorization assertion. |
| CR-07-ACCOUNT-004 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review, suite must not leak; `AGENTS.md` §Project privacy | 0 | `e3af8dd:features/account/sign-in.feature:26`; `e3af8dd:features/step_definitions/account.steps.ts:162` | B | open: refusal and throttle scenarios accept the expected log line even if other lines leak credentials. | Pending failure-path privacy steps. |
| CR-07-ACCOUNT-005 | FEAT-01 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source; `.agents/skills/typescript-style/rules/modules-and-data.md` §Files and modules | 0 | `e3af8dd:features/step_definitions/configuration.steps.ts:1` | W | open: missing SPDX line and separate copyright block. | Pending style-only header commit. |
| CR-07-ACCOUNT-006 | FEAT-02 | `.agents/skills/cucumber/rules/features.md` §Steps, describe the actual precondition | 0 | `e3af8dd:features/account/sign-in.feature:16`; `e3af8dd:features/step_definitions/account.steps.ts:148` | W | open: the scenario never configures an account; the world supplies the fixture account. | Pending wording and registered-step alignment. |
| CR-07-ACCOUNT-007 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review, suite must not leak; `AGENTS.md` §Project privacy | 0 | `e3af8dd:features/account/sign-in.feature:42`; `e3af8dd:features/step_definitions/account.steps.ts:174` | B | open: the no-credential assertion omits the account email identifier. | Pending whole-value privacy assertion. |
| CR-07-ACCOUNT-008 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review, plausible wrong implementation | 0 | `e3af8dd:features/account/configuration.feature:16` | B | open: three invalid-config cases omit the existing no-accessory assertion although each says the plugin starts nothing. | Pending three scenario assertions. |
| CR-07-ACCOUNT-009 | FEAT-01 | `.agents/skills/cucumber/rules/steps.md` §Steps, typed data-table parser | 0 | `e3af8dd:features/step_definitions/configuration.steps.ts:27` | W | rejected: this is a two-cell settings map, not a table with field columns. Omitted keys are intentional test input for configuration rejection. The cited unknown-column rule does not apply. | No change. |

## Correction rounds

Round 0 opening accepted count: **8**. Corrections and independent full-file
rounds follow below. For each correction round:
`closing = opening - fixed - rejected + new + reopened`.

### Round 1

Reviewer `/root/phase7_plan02/account_round1_review` read every line at
`5d6adcd92e83c2d2e017ffef89e3d0506c49b054` after six one-cause commits.

| Owned path | Reviewed blob | Contiguous lines |
| --- | --- | ---: |
| `features/account/configuration.feature` | `ec61f2c3a730cfc1d4f0a64db8e796d80738d8c3` | 1-48 |
| `features/account/sign-in.feature` | `3c03bda49c16c2decfaf821ba72d1bf0d0d105d3` | 1-51 |
| `features/step_definitions/account.steps.ts` | `a34dff7daad90abac656bfac3aa6e0b86a105cd9` | 1-202 |
| `features/step_definitions/configuration.steps.ts` | `29d20e0b06c1a6abd39e0e4bc77e9ba7a3644499` | 1-94 |

Opening **8**; fixed **5** (003, 005, 006, 007, 008); rejected **0**;
new **3** (010, 011, 012); reopened **0**; closing **6**
(001, 002, 004, 010, 011, 012). Equation: `8 - 5 - 0 + 3 + 0 = 6`.
The privacy repair for 004 still omitted the foreign cached token. The
independent reviewer accepted the configured-account wording for 006.

| New ID | Requirement | Rule path and section | Observed location | Severity | Finding at Round 1 |
| --- | --- | --- | --- | --- | --- |
| CR-07-ACCOUNT-010 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Feature description | `5d6adcd:features/account/configuration.feature:1-3` | W | The description did not name the local fake cloud stand-in. |
| CR-07-ACCOUNT-011 | FEAT-02 | `.agents/skills/cucumber/rules/features.md` §Feature description | `5d6adcd:features/account/sign-in.feature:1-3` | W | The description did not name the local fake cloud stand-in. |
| CR-07-ACCOUNT-012 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review; `.agents/skills/cucumber/rules/steps.md` §Steps | `5d6adcd:features/step_definitions/account.steps.ts:137-141` | B | First-start cache assertion checked only file presence; an empty or wrong cache passed. |

### Round 2

Reviewer `/root/phase7_plan02/account_round2_review` read every line at
`86ffd2305548393471641d797c291941a8e9dcb6` after the second correction
set. The worktree was clean at review time.

| Owned path | Reviewed blob | Contiguous lines |
| --- | --- | ---: |
| `features/account/configuration.feature` | `7e35c417f02a3a8b021e0f6b717b2c724874864b` | 1-48 |
| `features/account/sign-in.feature` | `95fb52604c693d182dd26bd36fb6f084388380f2` | 1-51 |
| `features/step_definitions/account.steps.ts` | `bf1146683e660a4dc7c6f83d5c549fd89c05053e` | 1-221 |
| `features/step_definitions/configuration.steps.ts` | `29d20e0b06c1a6abd39e0e4bc77e9ba7a3644499` | 1-94 |

Opening **6**; fixed **6** (001, 002, 004, 010, 011, 012); rejected **0**;
new **2** (013, 014); reopened **0**; closing **2** (013, 014).
Equation: `6 - 6 - 0 + 2 + 0 = 2`. The count fell and no ID reopened, so
the bounded loop permits Round 3.

| New ID | Requirement | Rule path and section | Observed location | Severity | Finding at Round 2 |
| --- | --- | --- | --- | --- | --- |
| CR-07-ACCOUNT-013 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review, plausible wrong implementation; `.agents/skills/cucumber/rules/steps.md` §Steps, Given setup | `86ffd23:features/step_definitions/account.steps.ts:62-67,110-114` | B | The another-account cache used a literal non-SHA-256 fingerprint. A client that rejected malformed fingerprints but trusted a well-formed foreign one could pass. |
| CR-07-ACCOUNT-014 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review, scenario-title coverage; `.agents/skills/cucumber/rules/steps.md` §Steps, whole behavior | `86ffd23:features/account/sign-in.feature:45-51`; `86ffd23:features/step_definitions/account.steps.ts:41-48,122-128,215-221` | B | The broad no-credential log claim exceeded the deliberate injection, which omitted the account password. The Cucumber world bypasses platform password registration. |

### Round 3 — STOP

Reviewer `/root/phase7_plan02/account_round2_review` made a new contiguous
complete-file read at `29f0d028f6bc6baf78fcf97818cfc1e73cf5f0cb` after
the third correction set. Only this report was uncommitted during review.

| Owned path | Reviewed blob | Contiguous lines |
| --- | --- | ---: |
| `features/account/configuration.feature` | `7e35c417f02a3a8b021e0f6b717b2c724874864b` | 1-48 |
| `features/account/sign-in.feature` | `ad3a41c45530e22265a8b625d80c405b720e3331` | 1-51 |
| `features/step_definitions/account.steps.ts` | `b4a733fb3881391206e923603bcde1a64cef70d7` | 1-222 |
| `features/step_definitions/configuration.steps.ts` | `29d20e0b06c1a6abd39e0e4bc77e9ba7a3644499` | 1-94 |

Opening **2** (013, 014); fixed **2** (013, 014); rejected **0**;
new **2** (015, 016); reopened **0**; closing **2** (015, 016).
Equation: `2 - 2 - 0 + 2 + 0 = 2`. The positive open count did not fall.
The protocol requires **STOP** now. No Round 4 or further ACCOUNT source
repair is allowed under this run.

| New ID | Requirement | Rule path and section | Observed location | Severity | Final disposition |
| --- | --- | --- | --- | --- | --- |
| CR-07-ACCOUNT-015 | FEAT-02 | `.agents/skills/cucumber/SKILL.md` §Review, plausible wrong implementation; `.agents/skills/cucumber/rules/steps.md` §Steps, Given/Then | `29f0d02:features/account/sign-in.feature:27-35`; `29f0d02:features/step_definitions/account.steps.ts:63-68,111-115,188-192` | B | **open at STOP**: the refusal scenario seeds a foreign-account cache. A client could delete it on account mismatch, then fail to delete on HTTP 403; the absent-cache assertion still passes. A same-account expired cache, as in `test/cloud/auth.test.ts:1119-1136`, would isolate refusal deletion. |
| CR-07-ACCOUNT-016 | FEAT-02 | `.agents/skills/cucumber/rules/features.md` §Data tables | `29f0d02:features/account/sign-in.feature:9` | W | **open at STOP**: `deviceId` uses camelCase instead of lower-case words. The shared `features/step_definitions/shadow.steps.ts:65-73,128-135` parser reads `row.deviceId`; fixing the header needs cross-owner parser coordination. The rule has no schema-field exception. |

## Repair and verification ledger

| Finding | Fix commit | Focused evidence and outcome |
| --- | --- | --- |
| 001 | `cc3e0e2` | Refusal title now claims only observed cache absence and correction advice. Refusal scenario 1/1, 11 steps. No Cucumber claim of terminal retry suppression; direct unit proof remains in `test/cloud/auth.test.ts:1138-1161` and `test/runtime/accountRuntime.test.ts:3066-3096`. |
| 002 | `86ffd23` | Throttle title now claims the warning and stop advice it observes. Throttle scenario 1/1, 9 steps. No Cucumber claim of delayed retry; direct unit proof remains in `test/cloud/auth.test.ts:1274-1296` and `test/runtime/accountRuntime.test.ts:3098-3136`. |
| 003 | `7a37b78` | Restart step compares both complete `/devices` GET request records, including the cached-token authorization. A temporary no-op restart made the new assertion fail, then the restored scenario passed. |
| 004 | `5d4c5cb`, `3cc1f2d` | Refusal and throttle scenarios check credential-free logs, including the foreign cached token. Temporary logged-password and logged-foreign-token injections failed the intended privacy assertion, then restored scenarios passed. |
| 005 | `40ea9a8` | Added the approved SPDX and separate copyright header to `configuration.steps.ts`. Configuration scenarios passed. |
| 006 | `5d6adcd` | Feature and registered step say “configured account,” matching the fixture. Sign-in scenarios passed; usage found no unused binding. |
| 007 | `25fe450` | Whole account email is included in no-credential log checks. Temporary email logging failed the privacy scenario, then the restored run passed. |
| 008 | `b7f7eaa` | Three invalid-configuration cases now assert no accessory. A temporary held accessory made all three fail, then the restored cases passed. |
| 010 | `431542a` | Configuration feature description names the local fake cloud; configuration scenarios passed. |
| 011 | `9ee6d05` | Sign-in feature description names the local fake cloud; sign-in scenarios passed. |
| 012 | `5402e64` | First-start step compares the complete cached token record. A temporary `{}` cache failed the assertion, then the restored scenario passed. |
| 013 | `53bd4bb` | Foreign-cache fingerprint now hashes a distinct fixture email and cache salt. Both foreign-cache scenarios passed (2/2, 25 steps); a temporary wrong-email digest failed both fixture checks, then the restored run passed. |
| 014 | `29f0d02` | Scenario and action name the granted token and issued AWS credentials actually written. Focused scenario passed (1/1, 9 steps); a temporary raw session-token log failed the redaction assertion, then the restored run passed. `test/platform.test.ts:876-895` separately proves password registration. |

Finding 009 remains rejected for the stated two-cell settings-map reason.
The two Round 3 findings remain open under the exact STOP rule; they have no
repair commit. All negative controls used temporary test-only hooks or fixture
injections and were removed before commits. No production file changed, so
there is no production behavior bug or planning-only active RED/GREEN pair.

At `29f0d02`, `npm run test:cucumber` exited 0 with **104/104 scenarios** and
**1,162/1,162 steps**. The default baseline at `e3af8dd` was 104 scenarios
and 1,156 steps. The exact **+6 step** delta is three no-accessory assertions
for 008, two failure-path privacy assertions for 004, and one restart request
assertion for 003. Scenario count stayed 104. After compilation,
`./node_modules/.bin/cucumber-js --dry-run --format usage` exited 0 and
reported no `UNUSED`, undefined, or ambiguous binding. It emitted a
non-failing `MaxListenersExceededWarning`. Named cloud-auth and runtime
timing unit tests passed (2/2 each) on the final source revision. Node was
v26.12.0. Every source-fix commit ran Fallow audit, the focused pre-commit
fixer, and normal hooks without bypass. The first `29f0d02` hook attempt
failed on an unrelated temporary-directory `ENOTEMPTY` cleanup; the normal
retry passed. The coordinator owns the combined-wave full `npm run check`.
No real profile or live vendor account was used.
