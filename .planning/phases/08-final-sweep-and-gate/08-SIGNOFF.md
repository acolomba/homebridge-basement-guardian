# Phase 8 execution signoff

**Decision: BLOCKED.** The current code and complete-file review gates pass.
Final milestone acceptance still needs the Phase 3 and Phase 6 human checks
and a decision on three historical BUG-01 debug-evidence limits. This is an
execution evidence report, not Phase 8 verification or roadmap completion.

## Requirement evidence

| Requirement | Current result | Evidence and limit |
| --- | --- | --- |
| GATE-01 | Automated pass | `NPM_CONFIG_CACHE=/private/tmp/guardian-phase8-plan21-npm-cache TEST_CONCURRENCY=1 npm run check` exited 0 at source revision `499659b` on Node `v26.12.1`, npm `11.20.0`: static and unpaired checks, 130/130 offline Cucumber scenarios, 1401/1401 steps, and all 43 isolated direct source/test coverage pairs. No executable input changed through planning revision `51ffc50`. Default usage dry run exited 0 with no unused, undefined, or ambiguous step. The real profile dry run exited 0 with 6 scenarios and 35 steps all skipped. The real profile provides binding evidence only. |
| GATE-02 | Complete-file review pass | The [manifest](08-MANIFEST.json) lists 137 current in-scope paths, one owner each. Six batch reports cover the opening inventory. Subsequent correction and supplemental reviews cover changed blobs; the final three changes have independent complete-file owner rows in the [stopped continuation](08-STOP-CONTINUATION.json) and [separate ROOT-003 continuation](08-ROOT-003-CONTINUATION.json). The one-off seal audit checked all 137 current Git blobs and line counts, complete read spans, reviewer/editor separation, and zero current forward-open IDs; exit 0. The original DEVICE round-one STOP and ROOT round-two STOP remain active as historical records, with their opening and closing counts unchanged. |
| BUG-01 | **Human decision required** | The [bug ledger](08-BUG-LEDGER.md) has 51 accepted Phase 1–7 behavior claims: 48 complete planning-only RED archives and three debug-only records (B-08-042, B-08-043, B-08-050). It has 11 Phase 8 behavior bugs; all 11 current RED archives returned `RED_EVIDENCE_OK`, including ROOT-003's source `4093bad` → evidence `eff1a58` → fix `499659b`. The three historical debug-only records lack the same complete pre-fix native archive. Current GREEN and maintainer's prior workflow responses do not recreate that missing evidence. Do not count them as archive-proven without an explicit bounded acceptance. |

## Current prior-phase verification

| Phase | GSD status | Boundary |
| --- | --- | --- |
| Phase 1 | passed, 14/14 | D-06 custom RED path documented; standard TDD checkpoint skips. |
| Phase 2 | passed, 18/18 | No current gap. |
| Phase 3 | **human_needed, 19/22** | E-03-01 and P-03-01/02 need current maintainer rulings. |
| Phase 4 | passed, 27/27 | Current runtime and repaired Phase 8 findings checked. |
| Phase 5 | passed, 12/12 | Historical GATES STOP and two retired scanner findings retained. |
| Phase 6 | **human_needed, 5/5 concrete truths** | Real Homebridge trust publication after a failed write remains unverified; maintainer said “Cannot verify now.” |
| Phase 7 | passed, 5/5 | Historical batch STOPs retained. |

All seven GSD status queries are current. The two `human_needed` reports are
not treated as passes. Their exact judgments are in the respective
`03-VERIFICATION.md` and `06-VERIFICATION.md` reports.

## Historical stops and windows

The original Phase 8 DEVICE round-one STOP retains its seven-ID snapshot.
The first separate continuation's ROOT round 2 opened with one ID, fixed one,
found one, and closed with one: a second no-progress STOP. The newly
authorized ROOT-003 continuation opened with one, fixed it, found none, and
closed empty. None of the earlier STOP counts was rewritten. Earlier Phase 5
GATES round 15, Phase 6 ENTRY round 4, and Phase 7 batch STOPs remain in
their phase ledgers.

The Broken Windows baseline was 18 open, 19 waived, 21 fixed of 58. Window
36's stale STATE text had already been corrected and was marked fixed through
`gsd-tools windows fixed 36`. Current counts are **17 open, 19 waived, 22
fixed**. All waivers have reasons. [The validation audit](08-VALIDATION.md#final-profile-and-window-audit)
accounts for every remaining open ID. Historical process gaps are not
recast as new Phase 8 code defects.

## Residual assumptions and threat policy

The seven unresolved spec-less probe rows remain flagged: BUG-01 adjacency, empty, and
ordering; GATE-01 adjacency, empty, and ordering; and GATE-02 unclassified.
No row is lifted as a proven edge predicate: **seven surfaced = zero lifted +
seven flagged**. The two descriptorless prohibitions in Plan 08-11 remain
for independent judgment. The repaired logging disclosure has active RED,
GREEN, full-gate, and complete-file review evidence. No current open Phase 8
finding or unmitigated high/critical repair threat is claimed. The real
Homebridge result remains a separate human limit.

The independent verifier found these limits unresolved. Phase 8 stays open
until the required human judgments and real Homebridge check are complete.
