---
status: testing
phase: 06-validated-release-candidate
source: [06-VERIFICATION.md]
started: 2026-09-05T15:30:00Z
updated: 2026-09-05T15:30:00Z
---

## Current Test

number: 1
name: GitHub Actions compatibility matrix has never run
expected: |
  All 6 cells (2 Node versions x 3 Homebridge versions) pass lint, typecheck, fallow,
  format:check, the full test suite, and the build.
awaiting: pushing this branch (or opening the PR)

All five items below are deferred by the maintainer on 2026-09-05 so the milestone could close.
None is a code defect; all five require either pushing this branch to trigger real CI, a
maintainer GitHub-account-tier decision, or a maintainer hardware/paired-home session. See
`06-VERIFICATION.md`'s Human Verification Required section for full test/expected/why-human
detail on each.

## Tests

### 1. GitHub Actions compatibility matrix has never run

test: Push this branch (or open the PR) and let `.github/workflows/build.yml`'s 6-cell matrix
run to completion.
expected: All 6 cells (2 Node versions x 3 Homebridge versions) pass lint, typecheck, fallow,
format:check, the full test suite, and the build.
result: pending

### 2. The real packed-tarball secret scan has never run

test: Same push/PR action lets `.github/workflows/package-audit.yml` run its real (non-dry-run)
`npm pack` + trufflehog filesystem scan.
expected: trufflehog reports `verified_secrets: 0`, `unverified_secrets: 0` against the real
tarball contents.
result: pending

### 3. Private vulnerability reporting is not enabled on GitHub

test: Either make the repository public, or confirm GitHub Advanced Security entitlement, then
re-run `gh api --method PUT /repos/acolomba/homebridge-basement-guardian/private-vulnerability-reporting`.
expected: The call succeeds and a report submitted through SECURITY.md's linked path reaches a
real private advisory.
result: pending (external account-tier constraint, not a code gap)

### 4. G-001 through G-004 hardware/paired-home gates remain unexecuted

test: Run `dev/prep/g001-alarm-mute-checklist.md`, `g002-water-level-checklist.md`, and
`g003-g004-paired-home-checklist.md` against real hardware and a paired Apple Home.
expected: Each item records a real observation and an evidence block; the phase's own
checklists become the record of G-00X closure.
result: pending (blocks `1.0.0` publication only, not this phase)

### 5. The real-pump suite has never run against the live Gemini

test: With `BG_EMAIL`/`BG_PASSWORD` set, run `npx cucumber-js --profile real` (not `--dry-run`).
expected: All 7 scenarios pass against the real account: discovery, initial REST/shadow state,
a quiet-but-healthy or updated connection over one heartbeat interval, a restart that reuses the
cached Auth0 token, and a clean shutdown with no unhandled rejection.
result: pending
