# Phase 08 ACCESSORY complete-file review

## Round 0, shard A

**Reviewer:** `/root/phase8_plan05`, an in-session reviewer who did not edit the files below.
**Committed revision read:** `157092f765fd7e8f120a272be1e32995ea1ff48b`.
**Method:** Read each assigned file from its complete committed Git blob, in contiguous line order. This section certifies shard A. Plan 08-13 records shard B below.

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

## Round 0, shard B

**Reviewer:** `/root/phase8_plan13`, an in-session reviewer who did not edit the product or test files below.
**Committed revision read:** `217fa2cddfbbe6e38c2bf5030593c9d52f7af6c7`.
**Method:** Read every line of each shard B file from its complete committed Git blob, in contiguous line order. The 17 blobs match the live manifest. Together with the four shard A rows, this covers all 21 current ACCESSORY paths. No ACCESSORY path was added, moved, or reassigned.

| Path | Complete lines read | Full Git blob | Reviewer | Finding count and IDs |
| --- | --- | --- | --- | --- |
| src/accessories/alarmMute.ts | 1-37 | d635ddde5e0ad1396941ba54e078b37a511697a0 | /root/phase8_plan13 | 0, clean |
| src/accessories/customCharacteristics.ts | 1-230 | f9da27e6e8e9cf1ddd8931b6e087a488122df7b6 | /root/phase8_plan13 | 0, clean |
| src/accessories/customServices.ts | 1-172 | 43e5ab42eb2535527d0e5eda6e6fea1aaf7815bf | /root/phase8_plan13 | 0, clean |
| src/accessories/pumpRecords.ts | 1-429 | 76abe8b8b4c3796dea74e4f029bb86235d637012 | /root/phase8_plan13 | 0, clean |
| src/accessories/reconciliation.ts | 1-111 | 532a0ea5a1455d2189511a7eb27162e7bd5cbbd1 | /root/phase8_plan13 | 0, clean |
| src/accessories/serviceCatalogue.ts | 1-1050 | cef0ebf54fdb34c06e069609b325db919e591718 | /root/phase8_plan13 | 0, clean |
| src/accessories/services.ts | 1-112 | ba5026ce7e6604d63f153a99fc6e2b8f68e19506 | /root/phase8_plan13 | 0, clean |
| src/accessories/staleMarking.ts | 1-190 | 8fb283c51bd3837f769f5cb68966f3a213634313 | /root/phase8_plan13 | 0, clean |
| test/accessories/alarmMute.test.ts | 1-101 | d176f662bb8b7eeedf918ab5dece92dd4c1fd075 | /root/phase8_plan13 | 0, clean |
| test/accessories/customCharacteristics.test.ts | 1-458 | d444c1b6d08201f1d997e997112782f613a3ddf9 | /root/phase8_plan13 | 0, clean |
| test/accessories/customServices.test.ts | 1-287 | c62854d82b2619db4253b6257b97ddde75e3724c | /root/phase8_plan13 | 0, clean |
| test/accessories/hapWriteFidelity.test.ts | 1-706 | dd1c42ab2a98cb049a2a60871e3f2e82720f315e | /root/phase8_plan13 | 0, clean |
| test/accessories/pumpRecords.test.ts | 1-977 | 15c805f23f66080f76e86815f79c23c47887b42a | /root/phase8_plan13 | 0, clean |
| test/accessories/reconciliation.test.ts | 1-240 | 4994257990a1a8fa276d7f4a2af5a18d6fc543a6 | /root/phase8_plan13 | 0, clean |
| test/accessories/serviceCatalogue.test.ts | 1-2867 | cb5acdb162ba5fd062525207d04524d8e9a5bb99 | /root/phase8_plan13 | 0, clean |
| test/accessories/services.test.ts | 1-88 | 74f2f3ac302b1c717f70cffcf34341fbc4ea4fbe | /root/phase8_plan13 | 0, clean |
| test/accessories/staleMarking.test.ts | 1-661 | e1633c272c0753cc8bff4b620689399c8ea4565e | /root/phase8_plan13 | 0, clean |

The review applied `AGENTS.md` §§General, Project, and Build verification; the Phase 1 SPDX, copyright, and `@fileoverview` form; `.agents/skills/typescript-style/SKILL.md` and its seven applicable rule files; and `.agents/skills/typescript-unit-tests/SKILL.md` and its six applicable rule files. Source and test pairs use the required headers and `.js` relative imports. The HAP fidelity test is the documented test-only exception to the runtime HAP import rule. No `CR-08-ACCESSORY-NNN` ID was allocated in shard B.

## Shard B bounded cross-boundary reads

All locations in this section are at `217fa2cddfbbe6e38c2bf5030593c9d52f7af6c7`. They explain publication and input contracts; they do not certify the complete files or change their manifest owners.

| Path and lines read | Reason |
| --- | --- |
| `src/platform.ts:140-175,280-370,422-475,684-699` | The platform injects `api.hap`, publishes one device under its `deviceId` UUID, updates the accessory on a snapshot, marks cached services stale, refuses restored controls, and applies persistent credential failure after ordinary trust publication. |
| `src/accessories/basementGuardian.ts:450-464,478-539,612-750,997-1077` | The accessory owns records per cached accessory, observes once before publication, projects catalogue rows, pushes `StatusActive` from every row's read scopes, and binds controls to the services it publishes. |
| `src/device/gemini.ts:269-375` and `src/device/family.ts:104-115,160-180` | A battery group decodes with all required fields only after validation; a failed scope becomes `undefined`. This bounds the required-characteristic catalogue precondition. |
| `node_modules/@homebridge/hap-nodejs/dist/lib/Service.d.ts:486-512` and `Accessory.d.ts:368` | Installed `@homebridge/hap-nodejs@2.2.2` declares `updateCharacteristic`, `addOptionalCharacteristic`, and type-plus-subtype lookup. Installed Homebridge is `2.4.0`. Current [Homebridge Service API](https://developers.homebridge.io/HAP-NodeJS/classes/Service.html), [PlatformAccessory API](https://developers.homebridge.io/homebridge/interfaces/PlatformAccessory.html), and [HAP error-state guidance](https://github.com/homebridge/HAP-NodeJS/wiki/Presenting-Erroneous-Accessory-State-to-the-User) agree on the relevant surfaces; the installed implementation governs pinned behavior. |

## Shard B publication, records, and HAP trace

`src/accessories/customCharacteristics.ts:137-230` builds 16 fixed-UUID, read-only vendor characteristic classes from injected HAP. `src/accessories/customServices.ts:107-172` declares four fixed-UUID custom service classes. `src/accessories/services.ts:33-112` defines stable kind slugs and the seven removable notification names. `src/accessories/serviceCatalogue.ts:653-869` maps them to 17 ordered rows; its type and subtype lookup at lines 885-934 reuses cached services and avoids creating empty sensor services. `src/accessories/basementGuardian.ts:722-750` publishes that catalogue through `api.hap` injected at `src/platform.ts:144-149`. The paired declaration and catalogue tests pin UUIDs, service types, subtype keys, required and optional characteristics, raw codes, and projected values independently.

`src/accessories/pumpRecords.ts:258-429` resumes only a structurally valid complete record. It seeds from the first snapshot receipt, counts watched false-to-true edges, reconciles backup device timestamps in seconds, and persists changed context or retries a failed write. The record never substitutes for live pump state: `src/accessories/serviceCatalogue.ts:466-513` publishes record values only while the reported running fact exists. The pump tests cover baseline, missed run, restart, self-test label, damaged stored context, and failed persistence. `src/accessories/reconciliation.ts:74-110` counts two trustworthy inventory omissions per `deviceId`; the platform supplies only successful, schema-valid inventory responses.

`src/accessories/staleMarking.ts:73-190` marks restored services inactive, refuses restored control writes, and limits persistent credential errors to carried `StatusActive` characteristics. `src/platform.ts:684-699` runs the restart passes before fresh inventory. The HAP fidelity test compares the feature stand-in with the installed real package for accepted and rejected writes, read status, error pushes, clearing pushes, and numeric clamping. The [HAP error-state guidance](https://github.com/homebridge/HAP-NodeJS/wiki/Presenting-Erroneous-Accessory-State-to-the-User) supports using `StatusActive` for recoverable doubt and reserves a persistent error status for a condition requiring user action. The real-home presentation and pump gates remain separate release work.

## Shard B rejected candidates

| Candidate | Exact rule and initial location | Disposition and evidence |
| --- | --- | --- |
| A battery facts service could be created with one required characteristic still at a format default. | `AGENTS.md` §Project, Safety semantics; `217fa2c:src/accessories/customServices.ts:167-170`, `217fa2c:src/accessories/serviceCatalogue.ts:583-591,926-934`. | Rejected. The group entering this row is complete or absent: `217fa2c:src/device/gemini.ts:300-312,363-372` decodes all battery facts only after scope validation. The direct catalogue test at `217fa2c:test/accessories/serviceCatalogue.test.ts:1821-1848` checks required characteristic alignment in every represented trust state and has a negative control. |
| A pump record could publish a count while the pump running fact is absent, constructing a quiet required `PumpRunning` value. | `AGENTS.md` §Project, Safety semantics; `217fa2c:src/accessories/serviceCatalogue.ts:466-513`, `217fa2c:test/accessories/serviceCatalogue.test.ts:1011-1039`. | Rejected. `recordCandidates` withholds the record when `running` is absent. A malformed `pump: {}` in the cited unit case is not a trusted family output: `217fa2c:src/device/gemini.ts:288-294,363-370` emits a complete pump group or `undefined` with invalid scope distrust. The unit case checks record omission; it does not claim that malformed groups are family-valid. |
| Restored services with no `StatusActive` row would remain readable after the stale pass. | `AGENTS.md` §Project, Safety semantics; `217fa2c:src/accessories/staleMarking.ts:68-115`, `217fa2c:test/accessories/staleMarking.test.ts:282-295`. | Rejected as a current-code cause. The pass reaches previously published trust reports and leaves an older cache's missing characteristic absent; it cannot change a service that never carried the report. The paired test pins this boundary, while `refuseRestoredControls` still binds any carried `On` at `217fa2c:src/accessories/staleMarking.ts:134-137`. The known older-cache presentation limit remains visible at `217fa2c:src/accessories/staleMarking.ts:165-170` and is not counted as a verified current false-normal regression. |
| A refused write might erase the last reported value or a normal push might leave its error status stuck. | `AGENTS.md` §Project, Safety semantics; `217fa2c:test/accessories/hapWriteFidelity.test.ts:420-435,505-519,570-608`, `217fa2c:src/accessories/serviceCatalogue.ts:974-1009`. | Rejected. The test drives the same script through installed HAP and the stand-in, checks the retained value and status after refusal, and checks that an ordinary push clears status. No source under `src/` imports HAP directly. |

## Shard B verification and handoff

The read-only manifest comparison returned exit 0 for all 21 ACCESSORY paths: each current HEAD blob and line count matches its manifest entry. The inventory still has 137 unique assigned paths and ten documented repository gate test exclusions. Plan 08-13's two row checks returned exit 0 after this append. No build, owner test, coverage, pre-commit, or full gate ran during concurrent review. The parent owns serial checks and commits. Plan 08-09 owns central candidate triage; Plan 08-14 owns any serial cause repair. GATE-02 remains incomplete until all owner reports, triage, and the final gate finish.
