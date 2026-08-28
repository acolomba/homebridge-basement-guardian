## Conflict Detection Report

### BLOCKERS (0)

None.

### WARNINGS (0)

None.

### INFO (3)

[INFO] Auto-resolved: specific fault adapters override aggregate adapter guidance
  Found: docs/research/PLUGIN.md section 7 describes one aggregate fault contact sensor for Apple Home visibility (source: docs/research/PLUGIN.md)
  Note: docs/research/DECISIONS.md D-008 requires separate subsystem adapters and forbids one generic System Fault adapter; precedence 0 overrides precedence 50 (source: docs/research/DECISIONS.md; source: docs/research/PLUGIN.md)

[INFO] Auto-resolved: confirmed removal overrides immediate successful-inventory removal
  Found: docs/research/PLUGIN.md section 4 unregisters cached accessories absent from one successful discovery result (source: docs/research/PLUGIN.md)
  Note: docs/research/DECISIONS.md D-029 requires absence from two consecutive successful inventories and a final current-inventory check; precedence 0 overrides precedence 50 (source: docs/research/DECISIONS.md; source: docs/research/PLUGIN.md)

[INFO] Auto-resolved: dual license boundary overrides Apache-only package metadata
  Found: docs/research/PLUGIN.md section 2 shows package metadata declaring only the Apache 2.0 license (source: docs/research/PLUGIN.md)
  Note: docs/research/DECISIONS.md D-035 requires MIT for original work, Apache 2.0 for template-derived material, and package metadata that points to the license file while both remain; precedence 0 overrides precedence 50 (source: docs/research/DECISIONS.md; source: docs/research/PLUGIN.md)
