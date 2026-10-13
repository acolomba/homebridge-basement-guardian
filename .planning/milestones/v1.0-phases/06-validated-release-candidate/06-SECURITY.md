---
phase: "06"
slug: "validated-release-candidate"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-09-05"
---

# Phase 06 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

This register was built retroactively from all ten plans' `<threat_model>` blocks
(`register_authored_at_plan_time: true` for every plan in this phase), since no
`06-SECURITY.md` existed yet. Verified against the current codebase, not against the
plans' own claims, on 2026-09-05.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| CI runner -> npm registry | `publish.yml`'s authenticated `npm publish` call | npm auth token |
| CI runner -> packed tarball | `package-audit.yml` extracts and scans the real npm pack output | packaged source, no secrets expected |
| Any committer -> CI trigger surface | anyone who can push to `main` or open a PR can cause `build.yml`/`package-audit.yml` to run | none directly |
| Source file -> distributed package | license header text a downstream consumer reads to know their rights | none |
| npm install -> production dependency tree | the one path a telemetry/tracking dependency could enter the shipped package | none directly |
| Plugin -> vendor Auth0 tenant / REST API / AWS IoT endpoint | every outbound request this plugin makes | account email/password, bearer tokens, device state |
| Public GitHub issue <-> reporter's local config.json | the channel D-025 forbids leaking credentials through | account email/password (if a reporter pastes carelessly) |
| Private GitHub Security Advisory <-> vulnerability reporter | the channel D-025 requires for anything sensitive | vulnerability details |
| Plugin documentation <-> installing user | the surface where safety/privacy caveats reach a user before they configure a live account | none |
| `features/real-pump/` <-> the real vendor account | the only place in this repo's test tree that touches a live account, live credentials, and a live device | real BG_EMAIL/BG_PASSWORD, real bearer token, real device state |
| `features/real-pump/` <-> CI | must never cross — the suite is opt-in and human-run only | none (must stay none) |
| `features/real-pump/` restart scenario <-> the real token cache | the one place this phase writes a real bearer token to disk, even briefly | Auth0 bearer token |
| `dev/prep/` checklist status field <-> the actual `1.0.0` release decision | the one place a premature "passed" mark could let an unvalidated safety claim reach the release record | none directly (integrity of a status field) |
| CHANGELOG entry <-> a future reader deciding whether to upgrade | the one place an overclaim about gate status would mislead a reader | none directly (integrity of a claim) |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-06-01 | Elevation of Privilege | `.github/workflows/publish.yml` | high | mitigate | `workflow_dispatch`-only trigger, no `push`/`pull_request` key — verified directly in the workflow file | closed |
| T-06-02 | Tampering | `.github/workflows/build.yml` matrix (EBADENGINE warning) | low | accept | Documented in a workflow comment as a metadata fact about the pinned `homebridge@1.8.0` dependency, not a defect | closed |
| T-06-03 | Information Disclosure | `.github/workflows/package-audit.yml` packed tarball | high | mitigate | Real (non-dry-run) `npm pack` extracted and scanned with `trufflehog filesystem --results=verified,unknown --fail` — verified directly in the workflow file | closed |
| T-06-04 | Repudiation | `.github/workflows/publish.yml` manual dispatch | low | accept | GitHub Actions attributes `workflow_dispatch` runs to the authenticated actor and logs them in Actions run history | closed |
| T-06-05 | Repudiation | `src/*.ts` SPDX headers | medium | mitigate | `test/packaging/licenseHeaders.test.ts`'s per-file gate — file exists and is a hard gate | closed |
| T-06-06 | Tampering | `src/platform.ts` classification | medium | mitigate | Maintainer checkpoint resolved the classification; `src/platform.ts` now carries the MIT SPDX header, `LICENSE`/`NOTICE` updated to match — verified directly | closed |
| T-06-07 | Information Disclosure | production dependency tree (`mqtt`, `undici`) | medium | mitigate | `test/packaging/dependencyAllowlist.test.ts` pins the exact dependency set; `dependencyTelemetry.test.ts` scans for telemetry signatures — both exist and were updated this phase to also allow `undici` | closed |
| T-06-08 | Tampering | `package-lock.json` license fields | low | accept | Self-reported by each package's own `package.json`; the same residual risk `npm audit` already accepts | closed |
| T-06-09 | Information Disclosure | `PLUGIN_USER_AGENT` header value | low | accept | The identity string is the plugin name alone (AUTH-02) — no version, hostname, account, or device identifier, confirmed in `src/settings.ts` | closed |
| T-06-10 | Spoofing | Outbound headers mimicking a browser or the official vendor app | low | mitigate | No `Sec-Fetch-*`, `Origin`, `Referer`, or fabricated headers anywhere in `src/cloud/*.ts` — verified by direct grep, zero matches | closed |
| T-06-11 | Information Disclosure | `.github/ISSUE_TEMPLATE/bug-report.md`, `support-request.md` | high | mitigate | Both templates instruct pasting only the `platform` block with email/password removed, never the full `config.json`; `test/repositoryGovernance.test.ts` exists and gates this | closed |
| T-06-12 | Information Disclosure | `SECURITY.md` vulnerability channel | medium | mitigate | `SECURITY.md` correctly directs reports to GitHub's private Security Advisories rather than the public tracker. **However**, whether that GitHub-native feature is actually *enabled* on this repository could not be confirmed — `gh api` calls to enable/verify it returned 404, likely gated behind GitHub Advanced Security for private repos on this account tier. Tracked separately as `WINDOWS.md` ledger entry 44 (open, requires maintainer action: make the repo public, or confirm GHAS availability). | **open — below `high` block threshold (non-blocking)** |
| T-06-13 | Repudiation | `README.md` safety/privacy disclosures | medium | mitigate | `test/documentation.test.ts` exists and gates the five REL-08 disclosures | closed |
| T-06-14 | Information Disclosure | `dev/README.md` mDNS guidance | low | accept | Documentation-only change, no runtime effect | closed |
| T-06-15 | Elevation of Privilege | `features/real-pump/` command reachability | high | mitigate | No accessory/HomeKit layer is built in the harness at all; `test/realPumpCommandBlock.test.ts` exists and mechanically proves no command-issuing reference | closed |
| T-06-16 | Tampering | `cucumber.json` default profile | high | mitigate | `"tags": "not @real"` confirmed present in the default profile | closed |
| T-06-17 | Information Disclosure | real `BG_PASSWORD` / Auth0 bearer token | high | mitigate | Both registered with the redacting logger (`registerSecret`) before use; token cache lives in a per-scenario `mkdtemp` directory — verified directly in `realWorld.ts` | closed |
| T-06-18 | Information Disclosure | real device/account identifiers in scenario output | low | accept | Consistent with D-027's existing `deviceId`-in-logs precedent; no account-management fields are ever read by this suite | closed |
| T-06-19 | Information Disclosure | real token-cache file under the scratch directory | high | mitigate | Same `mkdtemp` mechanism as T-06-17, never a committed or fixed path — verified | closed |
| T-06-20 | Denial of Service | `heartbeats.feature`'s bounded wait | low | accept | A generous but finite timeout is documented; this suite never runs in CI regardless | closed |
| T-06-21 | Repudiation | `dev/prep/g00*-checklist.md` status fields | high | mitigate | All checklist items verified `pending` — no false-`passed` record exists anywhere | closed |
| T-06-22 | Elevation of Privilege | `dev/prep/release-checklist.md` tag guidance | medium | mitigate | Checklist explicitly states the `npm publish --tag next` requirement — verified directly | closed |
| T-06-23 | Repudiation | `CHANGELOG.md` / `REQUIREMENTS.md` gate claims | high | mitigate | No premature `G-00X: passed` claim or new version heading found; `CHANGELOG.md` still reads `## [Unreleased]` | closed |

*Status: open · closed · open — below `high` threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` (currently `high`) count toward `threats_open`*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-06-01 | T-06-02 | EBADENGINE warning is a metadata fact about the pinned `homebridge@1.8.0` dependency, not a defect in this project's own `engines` declaration | Phase 6 plan 01 | 2026-09-05 |
| AR-06-02 | T-06-04 | GitHub Actions' own attribution and run-history logging is sufficient audit trail for a manual, human-triggered publish dispatch | Phase 6 plan 01 | 2026-09-05 |
| AR-06-03 | T-06-08 | License strings are self-reported by each package at publish time; a lying package is a supply-chain risk outside any lockfile-scanning test's reach, and is the same residual risk `npm audit` already accepts | Phase 6 plan 03 | 2026-09-05 |
| AR-06-04 | T-06-09 | The identity string is the plugin name alone, with no version, hostname, account, or device identifier — accepted as adequately anonymous | Phase 6 plan 04 | 2026-09-05 |
| AR-06-05 | T-06-14 | Documentation-only wording change with no runtime effect | Phase 6 plan 06 | 2026-09-05 |
| AR-06-06 | T-06-18 | Consistent with D-027's already-accepted `deviceId`-in-logs precedent for the production platform | Phase 6 plan 07 | 2026-09-05 |
| AR-06-07 | T-06-20 | A generous but finite timeout is documented, and this suite never runs in CI regardless, so a hung wait can only ever fail a human-run scenario, never a pipeline | Phase 6 plan 08 | 2026-09-05 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-05 | 23 | 22 | 1 (below block threshold) | Claude (orchestrator, retroactive-from-artifacts) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed (T-06-12 is open but below the `high` block threshold, so it does not count toward `threats_open`)
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-05
