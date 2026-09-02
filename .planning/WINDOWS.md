---
schema_version: 1
open_count: 0
waived_count: 1
fixed_count: 0
total_count: 1
last_updated: 2026-09-02T01:47:10.458Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 05 | unrun-verify | test/platform.test.ts |  | Deleting the configureAccessory marking call leaves all 85 Cucumber scenarios green; only the platform unit case gates that call site | waived | Not an open defect: the mutation is caught by test/platform.test.ts, which fails on it. Recorded so a later author who moves that gate knows the Cucumber tier cannot replace it, because features/support/world.ts stands in for configureAccessory. | 2026-09-02T01:46:49.765Z | 2026-09-02T01:47:10.458Z |

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
  }
]
````
