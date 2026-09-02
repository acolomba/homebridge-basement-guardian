---
schema_version: 1
open_count: 1
waived_count: 1
fixed_count: 0
total_count: 2
last_updated: 2026-09-02T02:30:06.953Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 05 | unrun-verify | test/platform.test.ts |  | Deleting the configureAccessory marking call leaves all 85 Cucumber scenarios green; only the platform unit case gates that call site | waived | Not an open defect: the mutation is caught by test/platform.test.ts, which fails on it. Recorded so a later author who moves that gate knows the Cucumber tier cannot replace it, because features/support/world.ts stands in for configureAccessory. | 2026-09-02T01:46:49.765Z | 2026-09-02T01:47:10.458Z |
| 2 | 05 | unrun-verify | src/runtime/accountRuntime.ts |  | commandTransportReadyNow()'s !halted term is redundant given polling and no test fails when it is removed; kept as deliberate defence, recorded in 05-03-SUMMARY mutation 4 | open |  | 2026-09-02T02:30:06.953Z |  |

````json
[
  {
    "id": 1,
    "kind": "unrun-verify",
    "phase": "05",
    "file": "test/platform.test.ts",
    "line": null,
    "description": "Deleting the configureAccessory marking call leaves all 85 Cucumber scenarios green; only the platform unit case gates that call site",
    "status": "waived",
    "reason": "Not an open defect: the mutation is caught by test/platform.test.ts, which fails on it. Recorded so a later author who moves that gate knows the Cucumber tier cannot replace it, because features/support/world.ts stands in for configureAccessory.",
    "recorded_at": "2026-09-02T01:46:49.765Z",
    "resolved_at": "2026-09-02T01:47:10.458Z"
  },
  {
    "id": 2,
    "kind": "unrun-verify",
    "phase": "05",
    "file": "src/runtime/accountRuntime.ts",
    "line": null,
    "description": "commandTransportReadyNow()'s !halted term is redundant given polling and no test fails when it is removed; kept as deliberate defence, recorded in 05-03-SUMMARY mutation 4",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T02:30:06.953Z",
    "resolved_at": null
  }
]
````
