# Phase 07 user adjudication after batch STOPs

**Authority:** Maintainer rulings received after the ACCOUNT Round 3, ACCESSORY
Round 2, and HOMEKIT Round 3 STOP reports. **Scope:** The six findings below.
This record does not change the observed findings, round equations, or STOP
outcomes in `07-ACCOUNT-REVIEW.md`, `07-ACCESSORY-REVIEW.md`, or
`07-HOMEKIT-REVIEW.md`. Plans `07-15` and `07-16` implement the four
FIX/MOVE/ENFORCE rulings. Plan `07-14` reconciles their summaries and this
record with the original reports at the phase gate.

| Finding | User ruling | Forward disposition and evidence required |
| --- | --- | --- |
| `CR-07-ACCOUNT-015` | **FIX.** The refusal scenario must seed an expired cache for the configured account, so deletion on an account mismatch cannot satisfy the assertion. | Keep the cache present and valid before the refusal, require one tenant request and its HTTP 403 response, and assert absence afterward. Demonstrate a plausible wrong-result control in which that same-account cache remains after refusal and the absence assertion fails. |
| `CR-07-ACCOUNT-016` | **ENFORCE.** Horizontal data-table headers use lower-case words. | Change `deviceId` to `device id`, `deviceTypeId` to `device type id`, and `waterLevel` to `water level` wherever these are horizontal headers. Update the shared device-table parser and every affected feature table consistently. A two-cell settings map such as `pollInterval | 60` is not a horizontal header. |
| `CR-07-ACCESSORY-007` | **MOVE.** The strict typed device-table parser belongs under `features/lib/`. | Move parsing and validation out of `features/step_definitions/accessory.steps.ts` into the named device-table library. Keep missing/unknown-column, repeated-field, missing-cell, and numeric-water-level failures. The step module imports it through a relative `.js` path. |
| `CR-07-ACCESSORY-009` | **ACCEPT.** The production declarative catalogue is the expected source for this assertion. | No source change. `src/accessories/serviceCatalogue.ts` already has full direct coverage: **542/542 lines, 70/70 functions, 145/145 branches**; the Cucumber scenario passes. This ruling closes the forward remediation question without changing the historical reopened/open-at-STOP report. |
| `CR-07-ACCESSORY-019` | **KEEP.** The current private-context synchronization Gherkin and steps stay unchanged. | No source change. This user decision closes the forward remediation question without changing the historical open-at-STOP report. |
| `CR-07-HOMEKIT-014` | **FIX.** Compare the raw recorded request path, including its query string, with the exact expected command path. | Replace the pathname projection in the command assertion. Demonstrate that an extra-query request, for example `?dryRun=1`, fails the exact path assertion; restore the control afterward. |

## Execution boundary

These rulings authorize a bounded remediation addendum after the historical
STOPs; they do not reopen correction rounds or authorize an unbounded review
loop. No production behavior bug has been established, so Plans `07-15` and
`07-16` touch only `features/**` test material. The two tests deleted by the maintainer in
Phase 6 remain absent. The default profile uses offline stand-ins. The real
profile runs only with `--dry-run`.

## Closure accounting

The three original reports retain their exact end-of-run open sets: ACCOUNT
`015, 016`; ACCESSORY `007, 009, 019`; HOMEKIT `014`. The forward record has
two adjudicated closures (`ACCESSORY-009`, `ACCESSORY-019`) and four items
requiring verified implementation (`ACCOUNT-015`, `ACCOUNT-016`,
`ACCESSORY-007`, `HOMEKIT-014`). Plans `07-15` and `07-16` record those four
results in their summaries. Plan `07-14` must report the historical STOP states and the later
adjudicated outcomes separately, with current command and revision evidence.
