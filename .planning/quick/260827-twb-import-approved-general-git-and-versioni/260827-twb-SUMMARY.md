---
quick_id: 260827-twb
status: complete
completed: 2026-08-27
commit: 6bc27e2
---

# Quick Task Summary

Added the approved `General`, `Git`, and `Versioning` guidelines to the root `CLAUDE.md` outside the GSD-managed markers. The versioning guidance retains the future `sonar-project.properties` requirement.

## Verification

- Confirmed that the imported non-GSD block matches `../pi-claude-marketplace/CLAUDE.md` exactly.
- Confirmed that all six generated GSD blocks and the developer-profile block remain present.
- Ran `pre-commit run --files CLAUDE.md .planning/quick/260827-twb-import-approved-general-git-and-versioni/260827-twb-PLAN.md`; all applicable hooks passed.

## Commit

- `6bc27e2 docs: add project instructions`
