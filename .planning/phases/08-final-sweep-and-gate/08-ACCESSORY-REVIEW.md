# Phase 08 ACCESSORY complete-file review

## Round 0, shard A

**Reviewer:** `/root/phase8_plan05`, an in-session reviewer who did not edit the files below.
**Committed revision read:** `157092f765fd7e8f120a272be1e32995ea1ff48b`.
**Method:** Read each assigned file from its complete committed Git blob, in contiguous line order. This report certifies shard A only. Plan 08-13 owns the remaining ACCESSORY paths.

| Path | Complete lines read | Full Git blob | Reviewer | Finding count and IDs |
| --- | --- | --- | --- | --- |
| src/accessories/basementGuardian.ts | 1-1077 | 50ffadd4c8debf42f0a566a5faa62e46bee71969 | /root/phase8_plan05 | 0, clean |
| src/accessories/controls.ts | 1-651 | a95863e48560a4bee2498e0a8611acba6ffecea9 | /root/phase8_plan05 | 0, clean |
| test/accessories/basementGuardian.test.ts | 1-3651 | 69017c4df7ac17541c268a28fa3ca2f1b1441c28 | /root/phase8_plan05 | 0, clean |
| test/accessories/controls.test.ts | 1-1649 | 9047190f9ab1678a19c9ecc690534f63a25b41b4 | /root/phase8_plan05 | 0, clean |

The review used `AGENTS.md` §§General, Project, and Build verification; the Phase 1 SPDX, copyright, and `@fileoverview` form; `.agents/skills/typescript-style/SKILL.md` and its `modules-and-data.md`, `classes.md`, `functions.md`, `types.md`, `naming-and-docs.md`, `comments.md`, and `review.md` rules; and `.agents/skills/typescript-unit-tests/SKILL.md` and its `pairing-and-design.md`, `tools.md`, `cases.md`, `test-doubles.md`, `boundaries.md`, and `review.md` rules. The files use the required header form and `.js` relative imports. The owner tests compare expected services and values independently, exercise local and vendor refusals, and check deferred status clearing. No `CR-08-ACCESSORY-NNN` ID was allocated in this shard.

## Bounded cross-boundary reads

All locations below are at `157092f765fd7e8f120a272be1e32995ea1ff48b`. They provide context; they do not certify the complete files or change ownership.

| Path and lines read | Reason |
| --- | --- |
| `src/platform.ts:135-295,300-370,415-445,630-705` | The platform injects `api.hap`, reuses one accessory instance, and calls `update()` on live changes and REST polls. It seeds the UUID with `deviceId` alone at line 307. Discovery binds the store listener after registration. Monitoring reaches the accessory at lines 422-443. Cached services are marked stale and controls receive a refusal before inventory returns at lines 668-699. |
| `src/runtime/commandPort.ts:1-48` and `src/runtime/accountRuntime.ts:1137-1159` | The command port has one `send` operation. The runtime turns an accepted result, vendor refusal, or rejected request into a typed outcome. |
| `src/cloud/api.ts:20-27,188-214` | The pinned command request has one 2,500 ms deadline. It does not retry. |
| `src/accessories/serviceCatalogue.ts:245-305,870-995` | A row with invalid or doubtful values withholds those values. `StatusActive` reports trust across all scopes read by the row. `ensureService` does not create an empty sensor. `publishValue` uses `updateCharacteristic`. |
| `node_modules/@homebridge/hap-nodejs/dist/lib/Characteristic.js:1340-1358,1590-1663,1786-1860`; `Service.js:515-527` | The installed `@homebridge/hap-nodejs@2.2.2` has one `onSet` handler slot. A rejected set stores a status and leaves its value unchanged. `updateValue` clears that status. The current [Homebridge HAP error-state guidance](https://github.com/homebridge/HAP-NodeJS/wiki/Presenting-Erroneous-Accessory-State-to-the-User) supports `StatusActive` for degraded state and warns that `HapStatusError` can leave Apple Home in No Response. The installed behavior is the authority for this pinned version. |

## Publication and control trace

`src/platform.ts:307,343-369` builds one Homebridge accessory from the immutable `deviceId` UUID seed. `src/accessories/basementGuardian.ts:478-539` uses only the injected `hap` namespace and keeps observation state per accessory. Its `update()` validates before decoding at lines 997-1035, derives distrust at lines 1036-1042, updates records only for a resolved family at lines 1062-1069, and pushes catalogue rows at line 1071. An unresolved family retains values and deactivates controller-derived rows at lines 997-1026. `publishRow` and `publishRows` set `StatusActive` from row trust at lines 628-635 and 709-750. `StatusFault` is projected by the catalogue from reported fault or power facts; a failed group leaves the previous fault value in place. The control binder is attached to both Switch rows at lines 695-707.

`src/accessories/controls.ts:245-319,364-375` accepts only the official on request and refuses missing transport, quiet live confirmation, missing reported state, confirmed offline state, duplicate active state, and a pending request. The first refusal wins. Lines 589-626 send one command after these gates and keep the request pending until a device report or a 30-second window resolves it. Lines 407-420 and 544-586 clear a refused write's stored status by a later push; they do not treat the request as device telemetry. The paired tests cover the public values, statuses, command count, and deadline behavior. Static inspection cannot establish real-home presentation or pump behavior; those remain the project release gates.

## Rejected candidates

| Candidate | Exact rule and initial location | Disposition and evidence |
| --- | --- | --- |
| An invalid first self-test field still creates a Switch with HAP's default `On = false`. | `AGENTS.md` §Project, Safety semantics; `157092f:src/accessories/basementGuardian.ts:719-746` and `157092f:test/accessories/basementGuardian.test.ts:2550-2566`. | Rejected. `.agents/skills/typescript-unit-tests/rules/review.md` requires a public discriminating assertion; the cited test checks the unpushed `On` value and `StatusActive = false`. `src/accessories/serviceCatalogue.ts:916-924` states the narrow control-row exemption. No safety sensor is created from an empty projection. |
| A timed-out command might be resent before the first request finishes. | `AGENTS.md` §Project, Safety semantics; `157092f:src/accessories/controls.ts:534-541,589-626` and `157092f:test/accessories/controls.test.ts:815-844,1351-1383`. | Rejected. The binder makes one send and retains the pending entry after its 2,500 ms cloud timeout. Its 30-second confirmation window blocks a second press. The window's expiry sends nothing. The installed command path turns the cloud timeout into a typed refusal at `src/runtime/accountRuntime.ts:1151-1157`. |
| The vendor `deviceId` in control warnings might expose an account identifier. | `AGENTS.md` §Project, Privacy; `157092f:src/accessories/controls.ts:556-565,578-586` and `157092f:src/accessories/basementGuardian.ts:833-836,881-908`. | Rejected under the maintainer's explicit ruling in `.planning/STATE.md` §Accumulated Context, Phase 2 decision (2026-08-29), and Phase 4 decision (2026-09-01). They classify vendor `deviceId` as non-sensitive and require it in per-device control lines. The ruling rests on an opaque account key and remains unconfirmed against a real inventory response; it does not authorize identifiers in public artifacts. This review does not reopen that settled decision. |
| FirmwareRevision uses the literal `unknown` when the MCU version is missing. | `AGENTS.md` §Project, Safety semantics; `157092f:src/accessories/basementGuardian.ts:265-269,450-464` and `157092f:test/accessories/basementGuardian.test.ts:1232-1269`. | Rejected. The literal says the revision is unknown; it does not claim a measurement or normal condition. If the metadata group does not decode, the code leaves the last published information unchanged. |

## Verification and handoff

The read-only live manifest check exited 0: 137 distinct tracked in-scope paths match the manifest and all committed blobs, including these four shard A blobs. `requirements.ready-ids` returned `0/1 requirement(s) ready to mark complete`; GATE-02 stays open until every owner report, triage, and the final gate finish. The plan's shard A row check is due after this file is written. No build, test, coverage, pre-commit, or full gate ran during parallel review. The orchestrator owns those serial commands and the commit.
