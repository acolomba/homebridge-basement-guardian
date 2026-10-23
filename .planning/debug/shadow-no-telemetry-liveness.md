---
status: fixing
trigger: "Phase 8 CR-08-RUNTIME-004: shadow messages without telemetry can renew liveness and keep stale readings trusted"
created: 2026-10-23T00:07:24Z
updated: 2026-10-23T00:09:52Z
---

## Current Focus

hypothesis: Confirmed. AccountRuntime records every routed patch as a telemetry heartbeat; MonitoringHealth renews silence and the anchor, while the store retains an earlier shadow watermark.
test: The active named owner test compiled and failed against unchanged production at the intended deepStrictEqual assertion; its complete native TAP and patch validate as RED_EVIDENCE_OK.
expecting: The coordinator commits planning-only RED evidence before any production change. A later targeted source repair must make the same named test green and preserve same-reading heartbeats.
next_action: Hand the validated RED evidence path and active test to the coordinator; await its explicit confirmation that the planning-only evidence was committed before any production edit.
reasoning_checkpoint:
  hypothesis: AccountRuntime records a no-reading routed patch as a telemetry heartbeat, resetting MonitoringHealth silence and anchor; the existing watermark then blocks REST takeover.
  confirming_evidence:
    - accountRuntime callback records every member patch before applying it to the store.
    - monitoringHealth moves both clock bases and the persisted anchor on that call; state retains the watermark after a no-reading patch.
    - the named native test failed with stale level 2, watermark 7, false silence, and renewed anchor against a REST flood level 31 after 2,700,000 ms without telemetry.
  falsification_test: Under unchanged production, a no-reading patch followed by the two-heartbeat threshold would leave the original anchor, mark silence, release the watermark, and accept the REST flood value.
  fix_rationale: Gate the runtime's liveness stamp on a real telemetry reading while still applying metadata and ordering patches to the store; this directly prevents no-reading messages from renewing trust.
  blind_spots: The regression uses the runtime's injected shadow callback; the actual MQTT parser path and a metadata-only patch after an existing watermark remain for later adjacent verification.
  candidate_causes:
    - code: unconditional runtime arrival stamp and store watermark retention
    - data: repeated desired-only or empty-telemetry vendor messages
    - config: silence threshold length was considered and ruled out by elapsed time exceeding the configured two-heartbeat threshold
  and_gate: The false-current condition needs both an existing watermark and no-reading patches arriving before silence; the code error is the unconditional liveness stamp.
tdd_checkpoint:
  test_file: test/runtime/accountRuntime.test.ts
  test_name: hands stale shadow telemetry to the poll despite repeated messages without readings
  status: red
  failure_output: Expected water_level 31, shadowVersion undefined, shadowSilent true, anchor 1787918400000; actual water_level 2, shadowVersion 7, shadowSilent false, anchor 1787920200000.
  evidence_file: .planning/phases/08-final-sweep-and-gate/08-RUNTIME-004-RED-EVIDENCE.json
  evidence_verdict: RED_EVIDENCE_OK
bug_class: Bohrbug (deterministic state transition)
candidate_causes:
  - code: runtime records all routed patches as telemetry arrivals
  - data: vendor may send desired-only or empty-telemetry patches while telemetry is stale
  - config: silence threshold may be too long, independently of message handling
and_gate: The false-current symptom requires an existing shadow watermark and repeated no-reading patches within the silence window; the message classification error is the proposed code cause.

## Symptoms

expected: After a device stops sending telemetry, later empty or desired-only broker messages do not renew its telemetry freshness. Once the silence threshold is reached, a successful REST poll takes over and trust reflects the actual source.
actual: A prior valid shadow reading establishes ownership. The runtime calls recordShadowMessage for every later routed patch, even when it has no telemetry; that call renews per-device silence and a persisted anchor. The existing watermark blocks REST telemetry, so repeated no-reading messages can leave old values marked current.
errors: No thrown error. The observed defect is a false-current safety condition from a static control-flow trace.
reproduction: In a deterministic owner test, deliver valid shadow telemetry, advance time while delivering empty or desired-only patches before each silence deadline, return a different value from REST polls, and inspect shadow silence, stored telemetry, and the trust report.
timeline: Discovered during the independent complete-file review of Phase 8 DEVICE correction round 1 at commit bc3406df6535a8d561078735e977fa27a68a52b9 on 2026-10-22. The code path predates that correction.

## Evidence

- timestamp: 2026-10-23T00:07:24Z
  checked: Phase 8 DEVICE correction record and bounded runtime trace at commit bc3406df6535a8d561078735e977fa27a68a52b9.
  found: src/runtime/accountRuntime.ts:895-899 calls health.recordShadowMessage for every member patch; src/runtime/monitoringHealth.ts:266-274 renews silence and anchor; src/device/state.ts:250-255 retains an existing shadow watermark for a patch without readings.
  implication: A later REST poll can retain old shadow telemetry while the monitoring path reports no silence. This is CR-08-RUNTIME-004, currently open with no RED, GREEN, or complete RUNTIME correction review.

- timestamp: 2026-10-23T00:08:14Z
  checked: Knowledge base, existing owner tests, local verification rules, and Fallow guard.
  found: No matching knowledge-base resolution; owner tests cover silence after no messages and metadata-only messages, but no named case covers repeated no-reading patches after a prior shadow watermark. Fallow reports no boundary zones or rules for the candidate paths.
  implication: A public runtime regression can distinguish message classification from the existing silence and metadata cases. SBFL is skipped because the current suite has no failing test for this defect yet.

- timestamp: 2026-10-23T00:08:54Z
  checked: Complete runtime callback and monitoring implementations, device-store ownership rules, shadow routing, and adjacent owner cases.
  found: shadow.handleMessage calls onReportedPatch even for documents with no reported data; accountRuntime stamps every member patch; monitoringHealth moves both silence bases; state retains a prior watermark for an empty patch. Existing silence tests omit messages, while the metadata-only test starts after REST already owns telemetry.
  implication: The proposed test isolates the earlier-watermark condition and separates message arrival from a telemetry-bearing heartbeat. The independent expected REST level comes from the scripted vendor response, not production code.

- timestamp: 2026-10-23T00:09:32Z
  checked: npm run build:test and the named TAP run against HEAD 8a122ac215d32b2dc9bcddd711715cc89c575085 with no production diff.
  found: Compilation passed; one named case ran and failed its intended deepStrictEqual. Expected REST level 31, undefined shadow watermark, shadowSilent true, anchor 1787918400000. Actual shadow level 2, watermark 7, shadowSilent false, anchor 1787920200000. Native output is /private/tmp/shadow-liveness-red.tap.
  implication: The code-cause hypothesis is directly reproduced. The configured silence threshold is not the cause because 2,700,000 ms elapsed since the last telemetry, exceeding the 1,796,000 ms threshold.

- timestamp: 2026-10-23T00:09:52Z
  checked: Complete RED JSON and tdd-red-evidence validator.
  found: The evidence file contains the complete 72-line native TAP, exact command and exit 1, source commit and blob, active full test patch and blob, Node version, timing, expected and actual behavior, and semantic assessment. Validator returned RED_EVIDENCE_OK for exactly one failed named case. Production paths have no diff.
  implication: The RED stage is ready for a planning-only evidence commit by the coordinator; GREEN work has not started.

## Eliminated

## Resolution

root_cause: AccountRuntime treats routed shadow messages without a telemetry reading as liveness evidence. MonitoringHealth then renews its silence clock and persisted anchor while the store retains an earlier shadow watermark, so successful REST polls cannot replace stale shadow telemetry.
fix:
verification: RED only; npm run build:test passed, the named TAP run failed as intended, and tdd-red-evidence returned RED_EVIDENCE_OK. No fix or GREEN check has run.
oracle_type: specified
files_changed: [test/runtime/accountRuntime.test.ts, .planning/phases/08-final-sweep-and-gate/08-RUNTIME-004-RED-EVIDENCE.json, .planning/debug/shadow-no-telemetry-liveness.md]
