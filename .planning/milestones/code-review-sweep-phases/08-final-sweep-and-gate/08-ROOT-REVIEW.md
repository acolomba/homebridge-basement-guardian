# Phase 08 ROOT complete-file review

**Reviewer:** `/root/phase8_plan06`. This reviewer did not edit any reviewed source, test, or fixture.
**Revision read:** `01bc3a3b8d542054bfdb98a13ee180155dd92fd2` on `features/code-review-sweep`.
**Method:** Read complete committed files with `git show HEAD:<path>`, not diffs. The 15 ROOT blobs match the live manifest. The tracked ROOT path set also matches the manifest exactly.
**Scope:** Static review only. No source or test was changed or run. The final combined gate belongs to later phase work.

## Complete-file ledger

Each row records one complete committed file. `0, clean` means zero accepted findings in that file. The shard A owner test was read in contiguous spans `1-400`, `401-800`, `801-1200`, `1201-1600`, `1601-2000`, `2001-2400`, `2401-2800`, `2801-3200`, `3201-3600`, `3601-4000`, and `4001-4272`. The display-limited overlap at `375-400` was reread with `375-800`.

| Path | Complete lines read | Full blob | Reviewer | Finding count and IDs |
| --- | --- | --- | --- | --- |
| src/platform.ts | 1-700 | e4bedd50206653eb6456a931edba97ab3bea12c1 | /root/phase8_plan06 | 1: CR-08-ROOT-001 |
| test/platform.test.ts | 1-4272 | f14616b7da2be4b8af73074914981d2f395db161 | /root/phase8_plan06 | 1: CR-08-ROOT-001 (missing privacy assertion) |
| test/platformSeeds.ts | 1-176 | ad02884ba05cadfa45959eb8c283720ca56eb27e | /root/phase8_plan06 | 0, clean |
| src/config.ts | 1-216 | 3d299fd1fe718a5ddb6835417849d01b7694f21b | /root/phase8_plan06 | 0, clean |
| src/index.ts | 1-23 | 0c901bb2b5e806a696da8edff1b15667e44eb55b | /root/phase8_plan06 | 0, clean |
| src/logging.ts | 1-227 | b63fe57face52149c687e342026e6f36c433bc64 | /root/phase8_plan06 | 0, clean |
| src/protocol.json | 1-8 | 3088e6a36d1a99d0062b2dea927508f2163a61b9 | /root/phase8_plan06 | 0, clean |
| src/protocol.ts | 1-45 | 10564e646c6a23b01402cf4be4af4fdee06faf2d | /root/phase8_plan06 | 0, clean |
| src/settings.ts | 1-36 | be017883bc3d7b1c90d3a496a77ca53c57ddae41 | /root/phase8_plan06 | 0, clean |
| test/config.test.ts | 1-503 | 33e1d51f1db305e2adb9ef4d898a3ccd27ca9e56 | /root/phase8_plan06 | 0, clean |
| test/hbConfig/config.example.json | 1-28 | 635aedd287701b420ee2a8cd705cc80cc79393e2 | /root/phase8_plan06 | 0, clean |
| test/index.test.ts | 1-33 | adaf69840bb30e98c5410c72974832c93c4c2281 | /root/phase8_plan06 | 0, clean |
| test/logging.test.ts | 1-652 | 49ff7493e93ec88f5c525f60cd7438d05c3dea6a | /root/phase8_plan06 | 0, clean |
| test/protocol.test.ts | 1-42 | 3e72b8f0a9cb2f68bfcac2b865b0eb1c5c891c04 | /root/phase8_plan06 | 0, clean |
| test/settings.test.ts | 1-54 | b805fce4df8a8d3b8fa4be75df331b752d8eaecb | /root/phase8_plan06 | 0, clean |

`src/config.ts` and `test/config.test.ts` also have clean independent tracer rows at the same blobs in `08-TRACER-REVIEW.md`. This review read them again and found no new candidate. The two JSON files were checked as data contracts only. The retired `test/configSchema.test.ts` and `test/packageManifest.test.ts` remain absent.

## Rule and boundary checks

The review applied `AGENTS.md` §General and §Project Constraints; the Phase 1 SPDX, separate copyright, and brief `@fileoverview` form; `.agents/skills/typescript-style/rules/modules-and-data.md`, `classes.md`, `functions.md`, `types.md`, `naming-and-docs.md`, `comments.md`, and `review.md`; and `.agents/skills/typescript-unit-tests/rules/pairing-and-design.md`, `tools.md`, `cases.md`, `test-doubles.md`, `boundaries.md`, and `review.md`. All reviewed TypeScript headers keep the approved form and attribution. `src/index.ts` keeps the loader-required default export. The `.bind` in the platform owner test preserves a method receiver for a test spy; it does not install a removable event handler. `Object.defineProperty` in that test creates a throwing service-list getter for a failure case.

| Bounded context read at `01bc3a3b8d542054bfdb98a13ee180155dd92fd2` | Contract traced |
| --- | --- |
| `src/runtime/accountRuntime.ts:70-95,430-470,648-710,1290-1345` | The runtime consumes platform callbacks, stores canonical snapshots, passes protocol constants to cloud adapters, and registers bearer or AWS secrets. Its documented local-log exception applies to the composite `deviceId`. |
| `src/accessories/basementGuardian.ts:940-990` | A built accessory publishes monitoring trust from the account and device result. |
| `src/device/registry.ts:70-100`; `src/device/state.ts:1-90` | `deviceTypeId` selects an adapter. The canonical snapshot carries the immutable `deviceId` separately from the vendor name. |
| `src/cloud/httpDispatcher.ts:1-31`; `src/platform.ts:620-665` | The injected HTTP transport, `api.user.storagePath()`, and Homebridge launch and shutdown listeners meet at the composition root. |
| `config.schema.json:1-100`; `package.json:1-90`; `node_modules/homebridge/dist/api.d.ts:490-505` | The plugin alias, package name, protocol import, Homebridge API calls, and development fixture agree. The installed Homebridge 2.4.0 types declare HAP registration and update calls as synchronous `void` methods. |
| `node_modules/homebridge/dist/logger.d.ts:24-34,65-78`; `node_modules/homebridge/dist/logger.js:92-126` | Homebridge accepts trailing log parameters and passes them to `util.format`, which appends the restored display name to the emitted line. |

The [Homebridge DynamicPlatformPlugin documentation](https://developers.homebridge.io/homebridge/interfaces/DynamicPlatformPlugin.html) says restored accessories are recreated from disk and passed to `configureAccessory`. The current [Homebridge API documentation](https://developers.homebridge.io/homebridge/interfaces/API.html) agrees with the installed 2.4.0 signatures for registration, update, and lifecycle listeners. No documented-versus-pinned difference affected this review. These bounded reads provide context and do not claim ownership of another batch's files.

Platform review checked UUID generation from `deviceId` at `src/platform.ts:307,517`, adapter lookup from `deviceTypeId` at `:333`, cached accessory persistence at `:166-175,279-300`, launch and shutdown at `:649-665`, and token storage at `:623-633`. The owner tests compare complete registration identities, retry behavior, trust fan-out, cache records, and control refusal. `src/protocol.json` has six public constants; `src/protocol.ts` imports the shipped JSON, and `test/protocol.test.ts` states independent expected values. The configuration fixture uses the same platform alias as `src/settings.ts` and `config.schema.json`.

## Open finding

### CR-08-ROOT-001 — Restored accessory name can disclose an account identifier

- **Requirement and rule:** `AUTH-02`; `AGENTS.md` §Project Constraints, Privacy: account identifiers cannot enter logs. `.agents/skills/typescript-unit-tests/rules/cases.md` §Assertions requires a case to assert the public result with independent expectations. `.agents/skills/typescript-unit-tests/rules/review.md` §Classifying findings marks a case that a wrong implementation passes as BLOCKER.
- **First round and severity:** Round 0, BLOCKER.
- **Initial and current location:** `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:src/platform.ts:694-698`; paired assertion gap at `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:test/platform.test.ts:79-95,1528-1585`.
- **Cause:** `configureAccessory` sends `accessory.displayName` to the Homebridge log. Homebridge restores this string from disk. The vendor `name` is accepted as an unconstrained string at `src/cloud/types.ts:125-148,170-178`, copied into the snapshot at `src/device/state.ts:198-204`, and used as an accessory name at `src/platform.ts:343-348`; an email-valued name is therefore reachable. The platform registers the account password at `src/platform.ts:595`; it never registers the account email. `src/logging.ts:72-110,175-225` therefore passes a bare email in the display name to the delegate. Installed Homebridge 2.4.0 uses `util.format(message, ...parameters)` in `node_modules/homebridge/dist/logger.js:107-112`, so the email appears in the emitted line. The owner test's `createRecordingLog` records only the first argument and drops trailing parameters, so its `messages` assertion misses this value. The scoped D-14 permission for composite `deviceId` does not cover `displayName` or email.
- **Observable failing case to add before a fix:** Restore an accessory with the synthetic display name `account@example.test`, the same synthetic email supplied to valid configuration. Capture every delegate argument. `configureAccessory` should log a fixed message without that email. The current call passes the email as a parameter. Keep the regression active and record validated RED evidence before changing production.
- **Disposition:** `open`. Plan 08-09 owns central triage; Plan 08-14 owns serial repair. No RED, GREEN, test, or fix commit is claimed by this review.

A separate read-only reviewer (`/root/phase8_root_privacy_check`) independently traced the vendor name, disk restore, redacting logger, and installed Homebridge 2.4.0 `util.format` path and confirmed this finding. That review did not establish that Home app renaming changes `displayName`, so the cause above relies on the proven vendor-name path. Removing this plugin log parameter addresses this call; Homebridge core may log accessory names on other paths, which is outside this plugin finding.

## Rejected candidates

| Candidate | Exact rule and location | Evidence-based disposition |
| --- | --- | --- |
| Repeated `deviceId` in local diagnostics | `AGENTS.md` §Project Constraints, Privacy; `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:src/platform.ts:118-123,400` | Rejected. D-14 and D-027 specifically permit the composite vendor `deviceId` in local logs. `src/runtime/accountRuntime.ts:76-85` states the opaque-key assumption and public-artifact limit. Phase 06 rejected the same cause as `CR-06-PLATFORM-009`; this review found no broader destination. |
| Default export in the plugin entry point | `.agents/skills/typescript-style/rules/modules-and-data.md` §Files and modules; `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:src/index.ts:21-23` | Rejected. The rule permits a default export when the loader requires it. The paired registration test asserts the exact platform class and name. |
| `Object.defineProperty` and `.bind` in the owner test | `.agents/skills/typescript-style/rules/review.md` §Quick scan; `01bc3a3b8d542054bfdb98a13ee180155dd92fd2:test/platform.test.ts:1260,1789-1793` | Rejected. The test uses `.bind` to preserve a real service method's receiver during a spy. It uses `Object.defineProperty` to simulate a service-list getter failure. Neither modifies a production global or installs an unremovable handler. |

## Verification and handoff

The read-only manifest comparison found 15 ROOT paths, 15 matching `HEAD:<path>` blobs and line counts, and no added or moved ROOT path. The parent should run both shard row checks from `08-06-PLAN.md` after staging this report. It should also run `fallow audit --base main` and the committing skill's `SKIP=npm-check pre-commit run --files .planning/phases/08-final-sweep-and-gate/08-ROOT-REVIEW.md .planning/phases/08-final-sweep-and-gate/08-06-SUMMARY.md` before its commits. Do not mark `GATE-02` complete from this batch: five other owner reports, central triage, serial repair, and the final combined gate remain.

## Threat Flags

`T-08-12` remains open through `CR-08-ROOT-001`: a restored display name can place the configured account email in a local log. No new network endpoint, authentication path, file access pattern, or schema change was introduced by this review-only report.
