# Phase 6: Root Module Conformance - Pattern Map

**Mapped:** 2026-10-19
**Files analyzed:** 12 existing files in six mirrored pairs; conditional review ledger, batch records, and RED evidence
**Analogs found:** 12 / 12

All analogs named here are Git tracked (`git ls-files` verified). Existing owner files are the closest behavior analogs: this phase reviews them in full and changes only confirmed findings. No new source or test owner is planned. `test/configSchema.test.ts` and `test/packageManifest.test.ts` were deleted by maintainer request and are excluded.

## File Classification

| Existing file under review | Role | Data flow | Closest analog | Match quality |
| --- | --- | --- | --- | --- |
| `src/config.ts` | config / validator | transform | same file; `src/platform.ts` consumer | exact |
| `test/config.test.ts` | test | request-response | same file | exact |
| `src/protocol.ts` | model / config | file-I/O | same file; `src/protocol.json` data | exact |
| `test/protocol.test.ts` | test | transform | same file | exact |
| `src/logging.ts` | utility / privacy middleware | transform | same file | exact |
| `test/logging.test.ts` | test | request-response | same file | exact |
| `src/settings.ts` | config | transform | same file; `src/index.ts` consumer | exact |
| `test/settings.test.ts` | test | transform | same file | exact |
| `src/index.ts` | provider / entry point | request-response | same file | exact |
| `test/index.test.ts` | test | request-response | same file | exact |
| `src/platform.ts` | provider / composition | event-driven | same file; `src/index.ts` registration consumer | exact |
| `test/platform.test.ts` | test | event-driven | same file; `test/platformSeeds.ts` support | exact |
| `06-REVIEW-PROTOCOL.md` (planned) | process contract | batch | `.planning/phases/01-known-findings-and-loop-proof/01-REVIEW-PROTOCOL.md` | exact |
| `06-FINDINGS.md` (planned) | ledger | batch | `.planning/phases/04-runtime-conformance/04-FINDINGS.md` | exact |
| `06-<BATCH>-REVIEW.md` (planned) | review report | batch | `.planning/phases/04-runtime-conformance/04-PORTS-REVIEW.md` | exact |
| `06-<BATCH>-RED-EVIDENCE.json` (conditional) | test evidence | file-I/O | `.planning/phases/04-runtime-conformance/04-PLATFORM-RED-EVIDENCE.json` | exact |

## Pattern Assignments

### Config and protocol pair

- `src/config.ts:47-60` declares a discriminated `ConfigResult`; `src/config.ts:153-184` returns the first fixed-order refusal; `src/config.ts:194-219` narrows `PlatformConfig` fields from `unknown`, returns `{ok:false, reason}`, and resolves defaults only after validation. Preserve that flow, including password and email privacy. The consumer is `src/platform.ts:558-572`, which logs a refusal and registers the password only after acceptance.
- `test/config.test.ts:34-51` builds synthetic input and independently expected accepted output. `test/config.test.ts:53-61` shows a named refusal test with arrange/act/assert and whole-result `deepStrictEqual`; `test/config.test.ts:73-86` shows a table of malformed inputs with a fixed privacy-safe expected refusal. Add a regression to this owner if a config bug is confirmed.
- `src/protocol.ts:1-6` imports bundled JSON using `with { type: 'json' }`; `src/protocol.ts:13-36` declares the public six-field contract and exports the typed `PROTOCOL` constant. `test/protocol.test.ts:8-29` checks exact key names and nonempty values through that public export. Preserve the JSON import form and public constant boundary.

```typescript
// src/config.ts:194-204
export function validateConfig(raw: PlatformConfig): ConfigResult {
  const fields: Record<string, unknown> = raw;
  const reason = firstRefusal(fields);

  if (reason !== undefined) {
    return { ok: false, reason };
  }
```

### Logging pair

`src/logging.ts:55-69` substitutes registered and pattern-matched credential text. `src/logging.ts:74-98` safely describes circular objects and errors before delegation. `src/logging.ts:106-111` wraps named delegate methods without losing the delegate's `this`. `src/logging.ts:128-180` owns secret rotation and all seven callable/member routes. A fix must preserve that single redaction boundary; `src/platform.ts:558-572` installs it before diagnostics. `test/logging.test.ts:34-39` creates a strict delegate; `test/logging.test.ts:62-72` gives the exact expected redacted call and verifies it. The tests keep `[redacted]` independent of the production constant (`test/logging.test.ts:14-17`).

```typescript
// src/logging.ts:106-110
function wrapMember(delegate: Logging, member: LevelledMember, secrets: readonly string[]): Logging[LevelledMember] {
  return (message: string, ...parameters: unknown[]): void => {
    delegate[member](redactText(message, secrets), ...redactParameters(parameters, secrets));
  };
}
```

### Settings and entry pair

`src/settings.ts:1-26` supplies the platform name, plugin name, and privacy-safe user agent; `src/index.ts:3-12` imports the platform and name with `.js` extensions and registers exactly one dynamic platform. Preserve the Apache SPDX classification and Homebridge template attribution on both files. `test/settings.test.ts:8-26` asserts schema/package identity and user-agent shape independently of source literals. `test/index.test.ts:10-23` uses a strict `API` mock and `verify(api)` to reject extra host calls.

```typescript
// src/index.ts:8-12
export default function registerPlatform(api: API): void {
  api.registerPlatform(PLATFORM_NAME, BasementGuardianPlatform);
}
```

### Platform pair

`src/platform.ts:1-40` and `test/platform.test.ts:1-18` already have the approved SPDX, copyright, and overview header layout. `src/platform.ts:296-361` dispatches one discovered device, seeds UUID from `deviceId`, and treats registration throws as uncertain. `src/platform.ts:552-610` installs redaction, validates configuration, and builds runtime collaborators. `test/platform.test.ts:20-60` imports local HAP/Homebridge stand-ins and nearby seeds; `test/platform.test.ts:68-95` builds a callable offline logging stub. Review all 673 source lines and all 3,781 test lines; do not treat a diff or old roadmap line count as complete coverage. A platform regression stays in the full owner test and uses its existing stand-ins. `test/platformSeeds.ts` is a bounded support file only if a confirmed owner finding requires it.

```typescript
// src/platform.ts:313-321
  if (existing !== undefined) {
    updateDiscoveredDevice(context, uuid, existing, snapshot, store);

    return;
  }
```

## Shared Patterns

### Header and review rules

Use `src/platform.ts:1-11` and `test/platform.test.ts:1-11` for the approved header: SPDX line, blank line, copyright JSDoc, blank line, `@fileoverview` JSDoc, blank line, imports. Keep Apache-2.0 and template attribution in `settings` and `index`. The authoritative rulebooks are `.agents/skills/typescript-style/SKILL.md` and `.agents/skills/typescript-unit-tests/SKILL.md` plus their relevant `rules/*.md`. Header deficiencies in the other five pairs are review candidates, not preaccepted findings. Keep style-only header commits separate from functional fixes per `.planning/phases/01-known-findings-and-loop-proof/01-REVIEW-PROTOCOL.md:121-131`.

### Ledger and correction rounds

Copy the stable-ID and count process from `.planning/phases/01-known-findings-and-loop-proof/01-REVIEW-PROTOCOL.md:49-83`. Use Phase 6 IDs, revision-qualified exact locations, rule, severity, disposition or concrete rejection, native command/exit, and source/evidence/fix commit paths. Each independent correction round records `closing = opening - fixed - rejected + new + reopened`. Stop on an open no-progress round, a reopened fixed finding, or round four. The Phase 5 GATES extension is not a Phase 6 pattern. The table and counters in `.planning/phases/04-runtime-conformance/04-FINDINGS.md:56-90` are the ledger shape; `.planning/phases/04-runtime-conformance/04-PORTS-REVIEW.md:1-27` is the batch report frontmatter shape.

### RED before GREEN for genuine bugs

Follow `.planning/phases/01-known-findings-and-loop-proof/01-REVIEW-PROTOCOL.md:88-119`. Add an active owner regression, compile, and observe its named intended assertion fail against unchanged production. Preserve complete native TAP output, command, exit, source commit, full regression patch, expected/actual, semantic assessment, Node version, and timestamps. Validate with `node .codex/gsd-core/bin/gsd-tools.cjs check tdd-red-evidence <record.json> --raw` and require `RED_EVIDENCE_OK`. Commit only planning evidence before the minimum GREEN source/test fix; keep the active test. `.planning/phases/04-runtime-conformance/04-PLATFORM-RED-EVIDENCE.json` is a tracked schema example, but its bug-specific content and huge patch are not a template to copy. A temporary negative control for an assertion repair is separate from genuine bug RED proof, and source bytes must be restored.

### Verification

Commands are from `.agents/skills/local-verification/rules/commands.md` and `rules/gates.md`:

```bash
npm run build:test
node --test dist-test/test/<owner>.test.js
npm run test:coverage:direct -- src/<owner>.ts
npm run --silent test:corresponding
npm run check
```

Run the focused owner and its direct line/function/branch coverage for each modified pair. Each pair must reach 100% alone. Use a fresh full `npm run check` on the combined wave and final phase tree; it includes Cucumber and all direct pairs. The prior post-deletion pass is baseline evidence only. Serialize shared `dist-test`, Git index, temporary mutations, and full checks if batches share a checkout (`01-REVIEW-PROTOCOL.md:35-46`).

## No Analog Found

None. All 12 owner files exist and have their own direct patterns. Conditional review artifacts have tracked prior-phase analogs.

## Metadata

**Search scope:** root `src/*.ts`, mirrored `test/*.test.ts`, Phase 1/4/5 review artifacts, and project rulebooks.
**Pattern extraction date:** 2026-10-19.
**Boundary:** Other repository gates and earlier subsystem owners are bounded consumers only. Do not recreate either deleted repository-level test.
