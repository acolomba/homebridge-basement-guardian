---
phase: 06-validated-release-candidate
plan: 05
subsystem: docs
tags: [security, github, issue-templates, governance]

# Dependency graph
requires: []
provides:
  - SECURITY.md — best-effort support policy and private vulnerability reporting pointer
  - test/repositoryGovernance.test.ts — static gate on SECURITY.md and issue template content
affects: [ship]

# Actuals (#2632)
actuals:
  tokens: 1500
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static source-text gate over GitHub repo-governance files (SECURITY.md, issue templates), same read-raw-text-and-assert.match shape as test/packageManifest.test.ts and test/packaging/licenseHeaders.test.ts"

key-files:
  created:
    - SECURITY.md
    - test/repositoryGovernance.test.ts
  modified:
    - .github/ISSUE_TEMPLATE/bug-report.md
    - .github/ISSUE_TEMPLATE/support-request.md

key-decisions:
  - "test/repositoryGovernance.test.ts's REPOSITORY_ROOT uses two '..' segments, matching test/packageManifest.test.ts's precedent — this file sits directly under test/, not one level deeper like test/packaging/*.test.ts (06-01/06-03's three-segment precedent does not apply here)."
  - "Private vulnerability reporting could not be enabled via gh api — see Known Gaps below. SECURITY.md still documents the private-advisory channel as the correct policy; the GitHub-side toggle is a separate, currently-blocked action."

patterns-established: []

requirements-completed: [REL-06]

coverage:
  - id: D1
    description: "SECURITY.md exists, states best-effort support with no SLA, and directs vulnerability reports to private Security Advisories"
    requirement: "REL-06"
    verification:
      - kind: unit
        ref: "test/repositoryGovernance.test.ts#SECURITY.md states support is best-effort (REL-06)"
        status: pass
      - kind: unit
        ref: "test/repositoryGovernance.test.ts#SECURITY.md directs vulnerability reports to private Security Advisories (REL-06)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Neither bug-report.md nor support-request.md instructs pasting a complete config.json; both explicitly call out removing email and password"
    requirement: "REL-06"
    verification:
      - kind: unit
        ref: "test/repositoryGovernance.test.ts#.github/ISSUE_TEMPLATE/bug-report.md does not ask for a complete config.json (REL-06, D-025)"
        status: pass
      - kind: unit
        ref: "test/repositoryGovernance.test.ts#.github/ISSUE_TEMPLATE/support-request.md does not ask for a complete config.json (REL-06, D-025)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Private vulnerability reporting is enabled on the GitHub repository via the GitHub API"
    requirement: "REL-06"
    verification:
      - kind: other
        ref: "gh api --method PUT /repos/acolomba/homebridge-basement-guardian/private-vulnerability-reporting"
        status: fail
    human_judgment: true
    rationale: "The PUT call returned 404 Not Found on every attempt (also retried after enabling vulnerability-alerts, and with explicit API-version headers). GET on the same endpoint also 404s. The repository is private and security_and_analysis is null on the repo object, consistent with GitHub gating private vulnerability reporting behind GitHub Advanced Security for private repositories on this account tier. This is an external service/entitlement constraint, not a code defect — see Known Gaps."

duration: 12min
completed: 2026-09-05
status: complete
---

# Phase 6 Plan 05: Support Policy and Vulnerability Disclosure Summary

**SECURITY.md gives the repository a best-effort, no-SLA support policy and a private
vulnerability-disclosure channel; both issue templates stop asking reporters to paste a complete
`config.json` and instead name exactly what to redact.**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-09-05
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- `SECURITY.md` states, in D-025's own terms, that support is best-effort through the public
  GitHub Issues tracker for the current stable release only, with no response-time, resolution-
  time, continued-compatibility, or SLA promise, and no backporting to older release lines.
- `SECURITY.md`'s "Reporting a Vulnerability" section points to GitHub's private Security
  Advisories feature and explicitly repeats that a report should never include a password, a
  token, or a complete `config.json`.
- Both `.github/ISSUE_TEMPLATE/bug-report.md` and `.github/ISSUE_TEMPLATE/support-request.md`
  replaced "Show your Homebridge config.json here, remove any sensitive information." — which
  left redaction entirely to the reporter's judgment — with a narrower instruction: paste only the
  `"platform": "BasementGuardian"` block, with the email and password fields named for removal.
- `test/repositoryGovernance.test.ts` gates both files' content: two tests on `SECURITY.md`
  (best-effort wording, private-advisories pointer) and one test per template asserting the exact
  prior instruction is gone while `email`/`password` wording is present.

## Task Commits

Each task was committed atomically:

1. **Task 1: SECURITY.md and private vulnerability reporting** — `69a5a01` (feat)
2. **Task 2: Stop asking for the complete config.json in issue templates** — `98d768a` (fix)

## Files Created/Modified

- `SECURITY.md` — new: best-effort support policy, private-advisory vulnerability channel
- `.github/ISSUE_TEMPLATE/bug-report.md` — narrowed the Plugin Config instruction
- `.github/ISSUE_TEMPLATE/support-request.md` — narrowed the Plugin Config instruction
- `test/repositoryGovernance.test.ts` — new: static content gate for both of the above

## Decisions Made

- **`REPOSITORY_ROOT` uses two `'..'` segments, not three.** `test/repositoryGovernance.test.ts`
  sits directly under `test/`, at the same depth as `test/packageManifest.test.ts`, which already
  uses two segments. The three-segment precedent from `test/packaging/licenseHeaders.test.ts`
  (06-01) and `test/packaging/dependencyAllowlist.test.ts` etc. (06-03) applies to files one level
  deeper, under `test/packaging/` — this file is not in that directory, so the plan's stated
  location (alongside `test/packageManifest.test.ts`, not under `test/packaging/`) called for the
  original two-segment form. Verified: the test reads the real `SECURITY.md` and template files
  and all four cases pass; a wrong path would throw `ENOENT`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Markdownlint bare-URL failure in SECURITY.md**
- **Found during:** Task 1, running `pre-commit run --files SECURITY.md` before commit
- **Issue:** `markdownlint-cli2`'s `MD034/no-bare-urls` rule rejected the plain
  `https://github.com/.../security/advisories/new` URL in the Reporting a Vulnerability section.
- **Fix:** Wrapped the URL in angle brackets (`<https://...>`), the standard Markdown
  autolink form, which satisfies the rule without changing the rendered link.
- **Files modified:** `SECURITY.md`
- **Verification:** `pre-commit run --files SECURITY.md` passes clean.
- **Committed in:** `69a5a01` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (a lint-only formatting fix, caught before commit).

## Known Gaps

**Private vulnerability reporting could not be enabled via the GitHub API.** The plan's Task 1
specified `gh api --method PUT /repos/acolomba/homebridge-basement-guardian/private-vulnerability-reporting`.
Every attempt returned `404 Not Found`:

- The initial PUT: 404.
- `GET` on the same endpoint (to check current state): 404 (GitHub returns 404 for "not enabled
  and not available," not just "not yet enabled").
- Retried after first enabling `vulnerability-alerts` (Dependabot alerts) on the repository via
  `gh api -X PUT /repos/.../vulnerability-alerts`, which itself succeeded (204) — in case private
  vulnerability reporting required Dependabot alerts as a prerequisite: still 404.
- Retried with explicit `Accept: application/vnd.github+json` and `X-GitHub-Api-Version: 2022-11-28`
  headers: still 404.
- Confirmed `gh auth status` shows the `repo` scope is present (the plan's precondition), so this
  is not an authentication or scope problem.
- `gh api /repos/acolomba/homebridge-basement-guardian` shows `"security_and_analysis": null` and
  `"visibility": "private"`. GitHub's private vulnerability reporting for **private** repositories
  is gated behind GitHub Advanced Security, which is not available on this repository's current
  account/plan tier — public repositories get this feature for free, private repositories on a
  personal account without GHAS do not.

**This is an external service-entitlement constraint, not a defect in this plan's code or
`SECURITY.md`'s content.** `SECURITY.md` is written and correct regardless of whether the toggle
can be flipped today — it documents the intended policy so the channel is ready the moment the
constraint is lifted (e.g., if the repository is made public before the `1.0.0` release, or if the
account gains GHAS). No task in this plan can resolve this without a maintainer decision (make the
repository public, or acquire GHAS), and this executor does not have standing to make that call.

**Recorded here rather than silently marked done.** The plan's `must_haves.truths` list states
"Private vulnerability reporting is enabled on the repository via the GitHub API" as a completion
criterion; that specific clause is **not met**. Everything else in the plan (the file content, the
test gate, the template fix) is met and verified.

**Follow-up required:** before `1.0.0` (D-026's staged-release gate implies the repository's
visibility will be revisited), a maintainer should either (a) make the repository public, at which
point re-running the same `gh api --method PUT .../private-vulnerability-reporting` call should
succeed, or (b) confirm via the GitHub web UI (Settings → Code security → Private vulnerability
reporting) whether a UI-only path exists that the API does not expose for this tier.

## Issues Encountered

See Known Gaps above — the private-vulnerability-reporting API call is blocked by account/repo
tier, not by anything this plan's code changed.

## User Setup Required

**A maintainer action is needed to close the Known Gap above:** either make the GitHub repository
public, or confirm GitHub Advanced Security availability, then re-run
`gh api --method PUT /repos/acolomba/homebridge-basement-guardian/private-vulnerability-reporting`
and confirm a `204` (or no-error) response.

## Next Phase Readiness

- `SECURITY.md` and the corrected issue templates are in place and gated by
  `test/repositoryGovernance.test.ts`; `npm run check` passes: 1435/1435 unit tests, 104/104
  Cucumber scenarios.
- REL-06 is marked complete for this plan's file-content scope (verified via
  `requirements.ready-ids` before marking). The private-vulnerability-reporting API toggle remains
  open per Known Gaps and does not block this plan's other must-haves.
- No blockers for the remaining Phase 6 plans.

## Self-Check: PASSED

All created/modified files exist on disk with the expected content (`SECURITY.md`,
`test/repositoryGovernance.test.ts`, both issue templates, this SUMMARY). Both commits (`69a5a01`,
`98d768a`) are present in `git log --oneline --all`.

---
*Phase: 06-validated-release-candidate*
*Completed: 2026-09-05*
