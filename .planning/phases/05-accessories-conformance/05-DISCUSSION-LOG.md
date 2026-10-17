# Phase 5: Accessories Conformance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-16
**Phase:** 05-accessories-conformance
**Areas discussed:** Earlier reviews and fixes, HAP test doubles and casts, Static and fidelity tests

---

## Earlier reviews and fixes

| Option | Description | Selected |
|--------|-------------|----------|
| Full fresh review | Re-review whole files; earlier fixes are regression anchors | ✓ |
| Review untouched parts only | Skip lines Phase 1/4 already repaired | |

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-assign IDs, re-verify | Stable IDs for the seed warnings up front | ✓ |
| Let reviewers rediscover | Seeds as hints only | |

| Option | Description | Selected |
|--------|-------------|----------|
| New Phase 5 finding | Cite earlier ID; stop only if the same defect returns | ✓ |
| Always stop | Any finding on earlier-fixed lines triggers D-03 | |

---

## HAP test doubles and casts

| Option | Description | Selected |
|--------|-------------|----------|
| One typed helper per file | One named, commented widening per file | ✓ |
| Comment each cast in place | Keep casts, add reasons | |
| Shared typed adapter in fakeHap | Edit features/support/fakeHap.ts | |

| Option | Description | Selected |
|--------|-------------|----------|
| Only narrow, bounded edits | fakeHap edits only when a finding requires it | ✓ |
| Full review in Phase 5 | Bring fakeHap into scope | |
| Do not touch | Freeze fakeHap | |

| Option | Description | Selected |
|--------|-------------|----------|
| Move or remove | Fake-only cases go to hapWriteFidelity or are removed | ✓ |
| Rewrite in place | Assert module behavior in the same file | |

---

## Static and fidelity tests

| Option | Description | Selected |
|--------|-------------|----------|
| Keep floors as designed | Documented floors; whole-value rule N/A with reason | ✓ |
| Exact sorted file list | deepStrictEqual on the list | |
| Floor plus exact snapshot | Both | |

| Option | Description | Selected |
|--------|-------------|----------|
| Extract only if flagged | Shared helper only on a confirmed finding | ✓ |
| Extract a shared helper now | Plan it up front | |
| Keep them separate | Reject even if flagged | |

| Option | Description | Selected |
|--------|-------------|----------|
| Fix findings only | Confirmed findings and undetected-disagreement gaps | ✓ |
| Add parity for every used member | Larger scope | |

| Option | Description | Selected |
|--------|-------------|----------|
| Record N/A with reason | Ledger marks non-fitting rules N/A | ✓ |
| Adapt the rule | One describe() per gated invariant | |

---

## Claude's Discretion

Batch grouping and wave order; widening-helper names; header findings.

## Deferred Ideas

Full review of `features/support/fakeHap.ts` belongs to the `features/**` phase.

---

## Correction round cap (raised during plan-phase, 2026-10-16)

The planner read D-03 as "stop when correction round 3 leaves open findings";
the plan checker flagged it as stricter than the Phase 4 protocol.

| Option | Description | Selected |
|--------|-------------|----------|
| Run round 4, then stop | Locked Phase 4 rule: stop on round 4's result even if clean | |
| Stop after round 3 | Planner's stricter reading | |

**User's choice (free text):** "continue doing repairs", then, asked whether the
cap stays: "let's max at 10 rounds".
**Recorded as:** D-18 — up to ten correction rounds per Phase 5 batch; stop on a
no-progress round, a reopened fix, or open findings after round 10. Phase 5
only; Phases 6-8 keep the four-round cap unless the maintainer extends it.
