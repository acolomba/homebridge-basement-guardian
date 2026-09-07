# Release Readiness Checklist

A maintainer runs this checklist before any `npm publish`, for every prerelease and for the eventual `1.0.0`. It turns D-026's staged-release decision into a literal, step-by-step list rather than something a maintainer has to reconstruct from the ADR each time.

**No G-00X item may be checked off from this phase's own evidence.** This checklist, and the three checklists it points at (`g001-alarm-mute-checklist.md`, `g002-water-level-checklist.md`, `g003-g004-paired-home-checklist.md`), were written by a phase that performs no hardware or paired-home measurement itself. Every G-00X row below reads "pending" until a future session records a real, passed result in the checklist it names.

## Every prerelease (`0.x`, npm `next` tag)

- [ ] **Automated checks green.** `npm run check` passes locally, and every CI matrix cell (Node 22.x/24.x × Homebridge 1.8.0/1.11.4/2.4.0) is green on the commit being released.
- [ ] **Version follows 0.x SemVer.** `package.json`'s `version` is a valid `0.x.y` (or `0.x.y-suffix`) SemVer string. `1.0.0` is not used until the `1.0.0` section below is fully satisfied.
- [ ] **Publish command is `npm publish --tag next`, never a bare `npm publish`.** A bare `npm publish` on a prerelease version now fails outright (npm requires an explicit `--tag` for any prerelease), but do not rely on that failure as the only safeguard -- confirm the command used, by hand or in the publish workflow, is `npm publish --tag next` before running it. A bare `npm publish` would otherwise be the one command able to point the `latest` dist-tag at an unvalidated prerelease.
- [ ] **Corresponding GitHub release is marked prerelease.** The GitHub Release created for this version has its "Set as a pre-release" flag on, not "Set as the latest release."
- [ ] **Release notes are complete.** The release notes (GitHub Release body and/or `CHANGELOG.md`) record: user-visible changes, any configuration migration required, known limitations, and the current validation status of each gate (G-001 through G-004 -- cite whichever of the three checklists above is relevant, and state plainly that they remain open unless one has actually passed).
- [ ] **Release notes tell users to keep the vendor alarm and vendor notifications enabled.** Every prerelease is experimental; the vendor's own alarm and notification paths are the safety net this plugin does not yet replace.
- [ ] **`CHANGELOG.md`'s `[Unreleased]` section is moved under the new version heading.** Follow this project's changelog conventions (`.claude/rules/changelog.md`) for wording -- one user-visible change per entry, plain language, no internal mechanism detail.
- [ ] **G-001 (Alarm Mute) status recorded.** Read `dev/prep/g001-alarm-mute-checklist.md`. If every item there is `passed`, cite that in the release notes. Otherwise, state it remains open -- do not imply it is closed.
- [ ] **G-002 (water-level codes) status recorded.** Read `dev/prep/g002-water-level-checklist.md`. Same rule: cite `passed` only if every item there is actually `passed`; otherwise state it remains open.
- [ ] **G-003/G-004 (paired Apple Home) status recorded.** Read `dev/prep/g003-g004-paired-home-checklist.md`. Same rule: cite `passed` only if every item there is actually `passed`; otherwise state it remains open.

## Additional gates before `1.0.0` specifically (D-026)

`1.0.0` may publish only after **all** of the following, on top of every item above:

- [ ] **G-001 passed.** `dev/prep/g001-alarm-mute-checklist.md` -- all four items `passed`, with evidence recorded.
- [ ] **G-002 passed.** `dev/prep/g002-water-level-checklist.md` -- all four items `passed`, with evidence recorded.
- [ ] **G-003 passed.** `dev/prep/g003-g004-paired-home-checklist.md`, item 1 -- `passed`, with evidence recorded.
- [ ] **G-004 passed.** `dev/prep/g003-g004-paired-home-checklist.md`, item 2 -- `passed`, with evidence recorded.
- [ ] **The Phase 3 flood-automation check passed.** `dev/prep/g003-g004-paired-home-checklist.md`, item 3 -- `passed`, with evidence recorded. A failure here reopens `03-CONTEXT.md` D-05 and blocks `1.0.0` until that reopening is resolved, independent of the other gates.
- [ ] **Required automated and real-home tests pass.** The full unit and Cucumber fake-pump suite is green (`npm test`), and the opt-in `@real @read-only` Cucumber profile (`features/real-pump/`) has been run at least once against the real account with no failures.
- [ ] **Package inspection clean.** `npm pack --dry-run` produces only the allowlisted file set (`test/packedArtifact.test.ts` already gates this), and a `trufflehog filesystem` scan of the extracted tarball reports zero verified and zero unverified secrets.
- [ ] **Secret and identifier scans clean.** No raw vendor responses, account identifiers, credentials, or local-network data appear in the packed artifact, the public repository, or the release notes.

## After publishing

- [ ] Confirm the published version is installable (`npm view homebridge-basement-guardian@<version>` or an install into a scratch Homebridge instance) before announcing it anywhere.
- [ ] For `1.0.0` specifically: do not request Homebridge Verified status until after this release is out and stable (D-034) -- Verified approval is a separate, later maintainer action, not part of this checklist.
