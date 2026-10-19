# Phase 6 root module findings

## Finding ledger

The inventory is fixed by D-01 and D-02 at baseline source revision `4bb84f631ac806f0a8d686db9735d454ee004851`. Each row is Git tracked at that revision. The line count is `wc -l` on that file. Header status checks the complete D-03 SPDX, separate copyright, and separate `@fileoverview` form. It is not a reviewed finding or a clean-file judgment. Preserve Apache-2.0 and template attribution for `index` and `settings`.

| Batch | File | Baseline revision | Lines | Header status |
| --- | --- | --- | ---: | --- |
| CONFIG_PROTOCOL | `src/config.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 219 | Partial: SPDX only |
| CONFIG_PROTOCOL | `test/config.test.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 445 | Missing complete header |
| CONFIG_PROTOCOL | `src/protocol.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 36 | Partial: SPDX only |
| CONFIG_PROTOCOL | `test/protocol.test.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 29 | Missing complete header |
| ENTRY | `src/logging.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 180 | Partial: SPDX only |
| ENTRY | `test/logging.test.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 432 | Missing complete header |
| ENTRY | `src/settings.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 26 | Partial: Apache SPDX and attribution present |
| ENTRY | `test/settings.test.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 26 | Missing complete header |
| ENTRY | `src/index.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 13 | Partial: Apache SPDX and attribution present |
| ENTRY | `test/index.test.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 23 | Missing complete header |
| PLATFORM | `src/platform.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 673 | Complete approved form |
| PLATFORM | `test/platform.test.ts` | `4bb84f631ac806f0a8d686db9735d454ee004851` | 3781 | Complete approved form |

The maintainer removed `test/configSchema.test.ts` and `test/packageManifest.test.ts` in `9605a63`. They are absent from Git's tracked-file inventory and this review. This is twelve files in exactly six mirrored pairs.

## CONFIG_PROTOCOL stable IDs

No review has been dispatched. No findings have been accepted or rejected.

| ID | Rule | Revision-qualified location | Severity | First round | Disposition and evidence | Source / RED / fix commits |
| --- | --- | --- | --- | --- | --- | --- |

## ENTRY stable IDs

No review has been dispatched. No findings have been accepted or rejected.

| ID | Rule | Revision-qualified location | Severity | First round | Disposition and evidence | Source / RED / fix commits |
| --- | --- | --- | --- | --- | --- | --- |

## PLATFORM stable IDs

No review has been dispatched. No findings have been accepted or rejected.

| ID | Rule | Revision-qualified location | Severity | First round | Disposition and evidence | Source / RED / fix commits |
| --- | --- | --- | --- | --- | --- | --- |

## Correction rounds

No correction round has started. For each independent round, commit its report and this counter before repairs. Record repair commits here before the next round. Stop under the three predicates in `06-REVIEW-PROTOCOL.md`.

| Batch | Round | Reviewer and revision | Opening | Fixed | Rejected | New | Reopened | Closing | Open IDs | Report commit | Repair ledger commit |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |

The required equation is `closing = opening - fixed - rejected + new + reopened`.

## Evidence

Baseline fingerprint: the executable-input source revision is `4bb84f631ac806f0a8d686db9735d454ee004851`. The check ran at `9528f28d31ebe0ffc562fb09f22acdc143a0c942`, whose committed change contains only this ledger and `06-REVIEW-PROTOCOL.md`. `git diff --stat 4bb84f631ac806f0a8d686db9735d454ee004851 -- src test features scripts package.json package-lock.json config.schema.json tsconfig.json tsconfig.build.json tsconfig.test.json eslint.config.js .fallowrc.json .pre-commit-config.yaml .github/workflows` returned no changes before or after the checks. `git ls-files --others --exclude-standard` returned no untracked inputs. The only dirty paths were `.planning/STATE.md` and `.planning/state.json`, changed by `state.begin-phase`; neither is an executable check input. Pairing and full-check evidence below covers this exact tree. Any source, test, support, dependency, or tool input change requires a fresh check.

| Gate | Source revision and input scope | Node | Command | Exit | Duration | Result |
| --- | --- | --- | --- | ---: | --- | --- |
| Baseline pairing | `4bb84f631ac806f0a8d686db9735d454ee004851`, checked at `9528f28d31ebe0ffc562fb09f22acdc143a0c942` | v26.12.0 | `npm run --silent test:corresponding` | 0 | 0.5 s | `Corresponding-tests gate passed.` |
| First full-check attempt | Same inputs; restricted sandbox | v26.12.0 | `npm run check` | 1 | 34 s | Static checks passed; compiled unpaired suite had 51/53 pass. Both `packedArtifact` tests failed because child `npm pack --dry-run --json` received npm-cache `EPERM`. Cucumber and direct coverage did not run. Full output: `/private/tmp/guardian-06-01-baseline.log`. |
| Baseline full check | Same inputs; local npm-cache and socket access | v26.12.0 | `npm run check` | 0 | 61 s | Six static checks passed; compiled unpaired tests passed; 104/104 Cucumber scenarios and 1156/1156 steps passed; direct LCOV merged 43 isolated pairs. Full output: `/private/tmp/guardian-06-01-baseline-native.log`. No install or source change occurred between attempts. |
