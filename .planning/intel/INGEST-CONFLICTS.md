## Conflict Detection Report

### BLOCKERS (0)

None.

### WARNINGS (0)

None.

### INFO (3)

[INFO] Auto-resolved: specific fault adapters override aggregate adapter guidance
  Found: [plugin implementation guidance](context.md) section 7 describes one aggregate fault contact sensor for Apple Home visibility.
  Note: [decision D-008](decisions.md) requires separate subsystem adapters and forbids one generic System Fault adapter; precedence 0 overrides precedence 50.

[INFO] Auto-resolved: confirmed removal overrides immediate successful-inventory removal
  Found: [plugin implementation guidance](context.md) section 4 unregisters cached accessories absent from one successful discovery result.
  Note: [decision D-029](decisions.md) requires absence from two consecutive successful inventories and a final current-inventory check; precedence 0 overrides precedence 50.

[INFO] Auto-resolved: dual license boundary overrides Apache-only package metadata
  Found: [plugin implementation guidance](context.md) section 2 shows package metadata declaring only the Apache 2.0 license.
  Note: [decision D-035](decisions.md) requires MIT for original work, Apache 2.0 for template-derived material, and package metadata that points to the license file while both remain; precedence 0 overrides precedence 50.
