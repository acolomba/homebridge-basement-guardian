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

| Gate | Source revision and input scope | Node | Command | Exit | Duration | Result |
| --- | --- | --- | --- | ---: | --- | --- |
| Baseline pairing | Pending fresh run | Pending | `npm run --silent test:corresponding` | Pending | Pending | Pending |
| Baseline full check | Pending fresh run | Pending | `npm run check` | Pending | Pending | Pending |
