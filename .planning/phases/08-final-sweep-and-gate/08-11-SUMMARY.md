---
phase: 08-final-sweep-and-gate
plan: "11"
status: blocked
subsystem: milestone-signoff
provides:
  - current full-gate and dry-run evidence
  - audited windows and prior-phase statuses
  - honest blocked signoff
affects: [GATE-01, GATE-02, BUG-01]
---

# Plan 08-11: Final gate and signoff

The full combined gate at `499659b` passed 130/130 offline Cucumber
scenarios, 1401/1401 steps, and all 43 direct coverage pairs. Executable
inputs are unchanged through planning revision `51ffc50`. The default
Cucumber usage dry run has no unused, undefined, or ambiguous definition.
The real profile dry run bound 6 scenarios and 35 steps, all skipped.

All 137 current in-scope files have complete independent review evidence and
the current forward-open Phase 8 set is empty. Both no-progress STOP records
remain historical. The 58 Broken Windows rows reconcile to 17 open, 19
waived with reasons, and 22 fixed after Window 36's documented correction.

[08-SIGNOFF.md](08-SIGNOFF.md) records **Decision: BLOCKED**. Phase 3 has three
current maintainer judgments, Phase 6 needs a real Homebridge failed-write
check that the maintainer cannot run now, and BUG-01 has three historical
debug-only evidence limits. No source failure is inferred from these limits.
The Phase 8 verifier judged this state `human_needed`; roadmap completion
waits for the listed human checks and evidence decisions.

## Threat Flags

The unresolved human checks and debug-only evidence limits block a complete
milestone claim. The current logging disclosure is repaired and independently
reviewed; historical STOPs remain visible.
