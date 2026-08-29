---
phase: 1
slug: secure-cloud-foundation
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-29
---

# Phase 1 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Register origin: authored at plan time. All 17 PLAN.md files carry a `<threat_model>`
block; 103 distinct threat identifiers were declared and every one was verified against
the implementation, not against the plan's intent or the summary's claim.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Homebridge config → plugin | Administrator supplies account credentials in `config.json` | Account email, password, optional `clientId` |
| Plugin → Auth0 tenant | Password-realm grant over TLS | Email, password, public client id; returns `id_token` |
| Plugin → vendor REST API | Four typed operations over TLS, bearer authenticated | `id_token`, device inventory, snapshots, commands, temporary AWS credentials |
| Plugin → AWS IoT shadow | MQTT over WebSocket, SigV4-presigned handshake | Temporary AWS credentials in the signed URL; shadow documents |
| Plugin → local disk | Token cache under `api.user.storagePath()` | `id_token`, expiry, salted email fingerprint, salt |
| Plugin → Homebridge log | Redacting logger wraps every log call | Fixed messages, statuses, counts — no credential material |
| Repository → npm registry | Packed artifact governed by the `files` allowlist | Compiled output and five named root files only |

---

## Threat Register

103 declared threats across 17 plans. Verified 2026-08-29: **99 closed by implemented
control, 3 accepted (below the `high` block threshold), 1 opened by audit and
subsequently closed.** Full per-threat detail lives in the plan `<threat_model>` blocks
and the audit trail below; this table records the register by component.

| Component (plan) | Threat IDs | Severity band | Disposition | Status |
|-----------|----------|----------|-------------|------------|--------|
| Packaging and repository hygiene (01, 11) | T-01-01, 02, 03, 60, T-01-SC | high–low | mitigate | closed |
| Homebridge accessory cache (01) | T-01-04 | low | accept | closed — see AR-01 |
| Cloud client foundations (02) | T-01-05, 06, 07, 08 | medium–low | mitigate | closed |
| Bundled protocol constants (02) | T-01-09 | low | accept | closed — see AR-02 |
| State store (03) | T-01-10, 11, 12, 13, 14 | medium–low | mitigate | closed |
| Config and redacting logger (04) | T-01-15, 16, 17, 18, 19, 20 | high–low | mitigate / transfer | closed |
| Auth client and token cache (05, 16) | T-01-21, 22, 23, 24, 26, 87, 88, 89, 90, 91, 92 | high–low | mitigate | closed |
| Auth throttling policy (05) | T-01-25 | medium | accept | closed — see AR-03 |
| REST client (06) | T-01-27, 28, 29, 30, 31, 32 | medium–low | mitigate | closed |
| SigV4 signer and retry policy (07) | T-01-33, 34, 35, 36, 37, 38, 39 | high–low | mitigate | closed |
| Cucumber harness (08) | T-01-40, 41, 42, 43, 44 | medium–low | mitigate | closed |
| Shadow client (09) | T-01-45, 46, 47, 48, 49, 50, 51 | high–low | mitigate | closed |
| Account runtime (10, 17) | T-01-52 … 58, 93 … 99 | high–low | mitigate | closed |
| Scenario suite (11) | T-01-59, 61, 62, 63 | medium–low | mitigate | closed |
| Determinism seal (12) | T-01-64, 65, 66, 67, 68 | medium–low | mitigate | closed |
| Freshness and source ownership (13) | T-01-69, 70, 70a, 71, 72, 73, 74 | high–low | mitigate | closed |
| Connection identity (14) | T-01-75 … 81 | high–low | mitigate | closed |
| Privacy, schema, logger bounds (15) | T-01-82 … 86, 85a, 85b | high–low | mitigate | closed |

*Status: open · closed · open — below `high` threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `high` count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

### T-01-60 — opened by audit, closed by remediation

The 2026-08-29 audit found T-01-60 (information disclosure, high) open. Its declared
mitigation was a positive assertion over the complete packed file list. No such assertion
existed in any test module, in `npm run check`, or in CI; plan 01-11 ran the check once by
hand and its summary then described the result as asserted. The exposure was closed at the
time by the `files` allowlist, but nothing prevented a regression.

Closed by `test/packedArtifact.test.ts`: two cases over `npm pack --dry-run --json` that
assert every packed path is under `dist/` or one of five named root files, and that all
five root files are present. Proved to fail on a widened allowlist, on a narrowed one, and
on an unbuilt `dist/` — the last case throws rather than passing vacuously.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-01-04 | A developer instance may still hold example accessories from a pre-phase `npm run watch`. D-03 forbids the plugin from removing cached accessories, so they persist until that instance's cache is cleared by hand. The alternative is a removal path this phase is explicitly not permitted to build. Verified: `test/platform.test.ts` asserts zero register and unregister calls across the whole lifecycle. | acolomba | 2026-08-29 |
| AR-02 | T-01-09 | `src/protocol.json` holds six public vendor protocol constants. REL-04 names the bundled data file as the single permitted location, giving secret scans one known allowlist path. The `clientId` is a public Auth0 SPA client id; the `connectsense-staging` hostname is the vendor's own production tenant name, annotated as such in vendor documentation. TruffleHog reports 0 verified and 0 unverified secrets. | acolomba | 2026-08-29 |
| AR-03 | T-01-25 | D-22 retries HTTP 429 on a 30-minute interval rather than halting, because a 429 can arise from shared-IP throttling unrelated to this account, and permanently halting a basement flood monitor on a throttling response is the worse outcome. Accepted: a genuine vendor block has its 30-day window refreshed. | acolomba | 2026-08-29 |
| AR-04 | none — unregistered | `test/hbConfig/auth.json` was deleted from the working tree during this phase, together with its `.gitignore` force-include. It remains in published history: the file held a `homebridge-config-ui-x` record with a salted password hash for a throwaway local dev admin account. Accepted rather than rewritten — it is a salted hash, not a plaintext secret, the account exists on no reachable host, and a history rewrite on a pushed public branch breaks every clone and fork and violates the project's own no-rewrite rule. Residual action: treat that dev password as burned and do not reuse it. | acolomba | 2026-08-29 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-29 | 103 | 99 | 1 (T-01-60, high) | gsd-security-auditor |
| 2026-08-29 | 103 | 103 | 0 | orchestrator — after T-01-60 remediation |

---

## Findings Recorded Without a Register Row

Surfaced by the audit; none is an open threat this phase.

1. **`src/persistence/accessoryContext.ts` and the Privacy constraint.** The module is
   declaration-only and nothing writes it this phase. Its fileoverview states the record
   holds no account identifier, yet it declares `deviceId`, and the vendor `deviceId`
   embeds the account identifier. Homebridge writes accessory context to disk in plaintext
   and includes it in backups. The Identity constraint (`deviceId` is the immutable UUID
   seed) and the Privacy constraint (no account identifiers in accessory context) collide
   here. Resolve before Phase 3 writes that record.
2. **The token cache does contain the raw account email.** Not in the metadata — the
   fingerprint keeps it out of there as designed — but inside the stored `id_token`. The
   grant requests `openid profile email`, so the JWT payload carries an `email` claim in
   base64url. The comment in `src/cloud/auth.ts` claiming the file never holds the email is
   inaccurate. Impact is low: the file is `0o600` and already holds a live bearer token.
   Making the claim true means dropping `profile email` from the grant scope, which needs
   confirmation that the vendor tenant accepts `openid` alone.
3. **Cache removal is narrower than "deleted on refusal" suggests.** `deleteCachedToken`
   runs only on the 4xx refusal branch. On an email fingerprint mismatch the previous
   account's token is overwritten by the next successful grant rather than removed.
4. **The SigV4 test mirrors the implementation's reading of the spec.** The crypto chain is
   independently derived, but the canonical query and canonical request are hand-written
   from the same specification reading as the signer. Combined with the fake broker's
   `verifyClient: () => !refusing`, the suite would pass against a broken signer. A real
   handshake against the AWS IoT endpoint is on the phase's human-verification list.
5. **The default Cucumber profile has no tag fence.** `cucumber.json`'s `default` globs all
   features with no `tags` key, while `real` targets `features/real-pump/**`. That directory
   does not exist today. Adding `"tags": "not @real"` to the default profile would close it
   pre-emptively.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
