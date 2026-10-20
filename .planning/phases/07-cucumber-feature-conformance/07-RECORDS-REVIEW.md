# RECORDS complete-file review

Round 0 is a candidate record for the `code-review-sweep` RECORDS batch. The independent reviewer read all three original owned files at `5da2dfdfcf59deb19acac0a59d9ef585b0f8c25f`. No candidate below is yet a confirmed production defect. The maintainer accepted 001 and will rule on the others one at a time. The opening accepted count remains pending complete triage. Plan 07-07 now lists `runtime.steps.ts` for the accepted late-retry assertion; its full current blob will enter the correction review without changing the historical MONITORING STOP.

## Round 0 complete-file review

| Owned path | Reviewed blob | Contiguous lines | Result |
| --- | --- | ---: | --- |
| `features/plugin/lifecycle.feature` | `213fbb977abd1a24f90a228e76c663e312a99ff4` | 1-68 | Candidates 001, 002, 006, 009. |
| `features/pump/records.feature` | `8e66b1f786fd919042aeb8dbc521ef3c8b920964` | 1-69 | Candidates 003, 007. |
| `features/lib/vendorRestApi.ts` | `ba75981e04ddd01b8bf22c3c9ad6e350196bfdd6` | 1-399 | Candidates 004, 005, 008. |

## Candidates awaiting triage

Every candidate first appeared in Round 0. Severity is the reviewer's proposed BLOCKER or WARNING, not a maintainer disposition. Locations are qualified by the reviewed revision. Focused commands and regression evidence will be added only for accepted repairs.

| ID | Requirement | Rule path and heading | Observed location | Proposed severity | Candidate and plausible wrong result |
| --- | --- | --- | --- | --- | --- |
| CR-07-RECORDS-001 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `.agents/skills/cucumber/rules/features.md` §Scenarios | `5da2dfd:features/plugin/lifecycle.feature:13-19,37-50` | BLOCKER | **Accepted by the maintainer.** The shutdown steps settle for 200 ms, while the reconnect delay begins at 500 ms. An uncanceled retry or reconnect after shutdown could escape both assertions. A focused proof must observe beyond the pending retry and check that no refused attempt, successful handshake, live connection, or rejection appears. |
| CR-07-RECORDS-002 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `.agents/skills/cucumber/rules/features.md` §Scenarios | `5da2dfd:features/plugin/lifecycle.feature:60-68` | BLOCKER | “Performs no work” compares only the immediate REST request count. An extra Auth0 token request, broker handshake, or delayed vendor request could pass. A focused proof would compare all fake-cloud work after a bounded settling window. |
| CR-07-RECORDS-003 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `.agents/skills/cucumber/rules/features.md` §Scenarios | `5da2dfd:features/pump/records.feature:58-69` | BLOCKER | Eight polls are counted cumulatively and may precede the repeated timestamp. A duplicate-count bug on the next poll could pass. A focused proof would capture the request count before the repeat, require a later poll, then check count and time. |
| CR-07-RECORDS-004 | FEAT-02 | `.agents/skills/cucumber/rules/world-and-stand-ins.md` §Fakes and drivers | `5da2dfd:features/lib/vendorRestApi.ts:219-231,265-266` | BLOCKER | The fake sends HTTP 200 before parsing command JSON. Malformed JSON could reject the detached async handler after the caller has received success. A direct malformed PUT should prove the fake does not acknowledge a body it cannot parse or leave an unhandled rejection. |
| CR-07-RECORDS-005 | FEAT-02 | `07-REVIEW-PROTOCOL.md` §Rules and acceptance source; `.agents/skills/typescript-style/rules/modules-and-data.md` §Files and modules | `5da2dfd:features/lib/vendorRestApi.ts:1-14` | WARNING | The approved SPDX line and separate copyright block are absent above the existing file overview. |
| CR-07-RECORDS-006 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Feature description | `5da2dfd:features/plugin/lifecycle.feature:1-5` | WARNING | The description omits the local fake cloud that stands in for the vendor service. |
| CR-07-RECORDS-007 | FEAT-01 | `.agents/skills/cucumber/rules/features.md` §Feature description | `5da2dfd:features/pump/records.feature:1-10` | WARNING | The description uses seven content lines in two paragraphs and omits the fake cloud; the rule requires two or three lines explaining the behavior and stand-in. |
| CR-07-RECORDS-008 | FEAT-02 | `.agents/skills/cucumber/rules/world-and-stand-ins.md` §Fakes and drivers | `5da2dfd:features/lib/vendorRestApi.ts:195-216` | WARNING | The fake compares an encoded device path segment with the raw device ID. A valid ID containing a space or slash could reach the wrong fake response even though production encodes the segment. This boundary-fidelity candidate needs triage against the vendor ID contract. |
| CR-07-RECORDS-009 | FEAT-01 | `.agents/skills/cucumber/SKILL.md` §Review; `.agents/skills/cucumber/rules/features.md` §Scenarios | `5da2dfd:features/plugin/lifecycle.feature:29-35` | BLOCKER | “Shutdown with an open shadow connection releases it” checks only one cumulative handshake before shutdown. That connection might already have closed, so the zero-live result could pass without shutdown releasing anything. A focused proof would assert a live subscription immediately before shutdown. |

## Correction rounds

Not started. No accepted opening set exists until all candidate rulings are recorded. Later rounds apply `closing = opening - fixed - rejected + new + reopened` with independent complete-file reviews and the protocol's STOP conditions.
