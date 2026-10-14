# Phase 2 cloud findings ledger

Milestone: code-review-sweep. Requirement: CLOUD-01. Audited 2026-10-14 in
features/code-review-sweep, isolation none. All 55 accepted findings are fixed:
25 BLOCKER and 30 WARNING. No accepted finding is open, rejected, skipped or
reopened. Five genuine bugs have committed pre-fix evidence. This ledger
contributes audited evidence; CLOUD-01 overall and phase-end judgment remain
with the parent coordinator.

## Inventory

The original 17 cloud files and two coordinator-authorized fresh seed helpers
are all inventoried below: eight source modules, eight mirrored owners and
three helpers, 19 files total. The separate batch reviewers read the complete
files at the named final revisions, including both new helpers. This audit
inspected every actual complete header and separator, compared current owned
inputs with those revisions, and read all helper bodies. Paths below are
repository-relative. Each row passes the separate MIT SPDX / Copyright (c)
2026 Alessandro Colomba / @fileoverview form with one blank line between
sections and before the next present section.

| File | Full independent reviewed revision | Header |
| --- | --- | --- |
| src/cloud/api.ts | f34682f12200e9b5985bf79d3c2c77dc22b67838 | Inspected; conforming MIT/original attribution |
| src/cloud/auth.ts | 14c740371e8a35f8ade64b7f890c0f88269e7f03 | Inspected; conforming MIT/original attribution |
| src/cloud/errors.ts | f34682f12200e9b5985bf79d3c2c77dc22b67838 | Inspected; conforming MIT/original attribution |
| src/cloud/httpDispatcher.ts | fb3de06560c1978281bfd8ee4f97c3fd8b9d1204 | Inspected; conforming MIT/original attribution |
| src/cloud/mqttTransport.ts | fb3de06560c1978281bfd8ee4f97c3fd8b9d1204 | Inspected; conforming MIT/original attribution |
| src/cloud/shadow.ts | 8277ae16577453bd270803f09941ee74f8b2fbd7 | Inspected; conforming MIT/original attribution |
| src/cloud/sigv4.ts | fb3de06560c1978281bfd8ee4f97c3fd8b9d1204 | Inspected; conforming MIT/original attribution |
| src/cloud/types.ts | f34682f12200e9b5985bf79d3c2c77dc22b67838 | Inspected; conforming MIT/original attribution |
| test/cloud/alpnServer.ts | fb3de06560c1978281bfd8ee4f97c3fd8b9d1204 | Inspected; conforming MIT/original attribution |
| test/cloud/api.test.ts | f34682f12200e9b5985bf79d3c2c77dc22b67838 | Inspected; conforming MIT/original attribution |
| test/cloud/apiSeeds.ts | f34682f12200e9b5985bf79d3c2c77dc22b67838 | Inspected; conforming MIT/original attribution |
| test/cloud/auth.test.ts | 14c740371e8a35f8ade64b7f890c0f88269e7f03 | Inspected; conforming MIT/original attribution |
| test/cloud/errors.test.ts | f34682f12200e9b5985bf79d3c2c77dc22b67838 | Inspected; conforming MIT/original attribution |
| test/cloud/httpDispatcher.test.ts | fb3de06560c1978281bfd8ee4f97c3fd8b9d1204 | Inspected; conforming MIT/original attribution |
| test/cloud/mqttTransport.test.ts | fb3de06560c1978281bfd8ee4f97c3fd8b9d1204 | Inspected; conforming MIT/original attribution |
| test/cloud/shadow.test.ts | 8277ae16577453bd270803f09941ee74f8b2fbd7 | Inspected; conforming MIT/original attribution |
| test/cloud/sigv4.test.ts | fb3de06560c1978281bfd8ee4f97c3fd8b9d1204 | Inspected; conforming MIT/original attribution |
| test/cloud/sigv4Seeds.ts | fb3de06560c1978281bfd8ee4f97c3fd8b9d1204 | Inspected; conforming MIT/original attribution |
| test/cloud/types.test.ts | f34682f12200e9b5985bf79d3c2c77dc22b67838 | Inspected; conforming MIT/original attribution |

LICENSE and NOTICE retain Apache-2.0 for src/index.ts and src/settings.ts and
MIT for original work. No cloud file is reclassified, no attribution is lost,
and no licensing file changes. The source-only packaging gate proves neither
test nor helper header completeness; their inspection is explicit above.

Conditional auth edits are bounded to test/platform.test.ts,
features/support/steps/authentication.ts and features/real-pump/support/realWorld.ts.
Their actual header-only commit is eb5b0a0a41c1e010b26436d3dc40c9b557ed55ee.
Filename cause 516e0becf54af99c544f177eec305d778323521d updates those three plus
the auth pair, preserving the storage name. These external files received
header and filename-delta review, not an unperformed platform/Cucumber sweep.

## Findings

Rows are ordered by first round within each batch and stable ID. Every row
addresses CLOUD-01. The original rule/location is revision-qualified by the
batch baseline stated below; current locations and full detailed outcomes are
in the corresponding 02-*-REVIEW.md. The audited Git objects establish the
listed cause commits and their actual paths. Fixed means an independent
full-scope round verified the remedy, supported by named public behavior or
explicit conformance inspection. Assertion repairs are test findings, not
automatically genuine production bugs.

### AUTH findings

Original locations: bf9b4c9ff4a1d043c1f53bb4023c2b302c0ab455; introduced rows carry their own revision.
Report: .planning/phases/02-cloud-conformance/02-AUTH-REVIEW.md.

| ID | Rule / original location | Severity | First round | Disposition / observable evidence | Actual fix commits |
| --- | --- | --- | --- | --- | --- |
| CR-02-AUTH-001 | AuthClient valid-token contract; invalid input remains untrusted / src/cloud/auth.ts:147-165,364-376 at bf9b4c9 | BLOCKER | 0 | Fixed; authenticates again when the cache file carries an infinite expiry | b42d3688ddcabe7aacfb8e8d5e16bc499142e5d7 |
| CR-02-AUTH-002 | Unit Assertions / HTTP adapters / test/cloud/auth.test.ts:158-169,206-234,262-275 at bf9b4c9 | BLOCKER | 0 | Fixed; sends the password-realm grant the vendor tenant expects; complete POST request | 3b00c916f2b3212c5893377cef5c836c630cf479 |
| CR-02-AUTH-003 | Unit Assertions / complete values and bytes / test/cloud/auth.test.ts:758-771 at bf9b4c9 | BLOCKER | 0 | Fixed; AUTH-02 writes neither the account email nor the account password into the cache file; complete Buffer | dbf8db024c08668c28846f912575eced0cc99e12 |
| CR-02-AUTH-004 | Unit Assertions / byte contracts / test/cloud/auth.test.ts:435-440,617-632 at bf9b4c9 | BLOCKER | 0 | Fixed; complete cache Buffers in grant and joined-caller cases | ce3882cf82bc64473b242ebadc8d80ef0f83e805 |
| CR-02-AUTH-005 | Unit Types and hermeticity / production design / test/cloud/auth.test.ts:126-140,158-172 at bf9b4c9 | BLOCKER | 0 | Fixed; authOptions fixed throwing default; explicit offline injection in every operation | b2b2e015b6f4fd32c73b7d50fcb6c746e5b3b365 |
| CR-02-AUTH-006 | Unit Assertions / public result before interactions / test/cloud/auth.test.ts:253,269,285,300-304,319-322,624-632,752-755,765-771,820-823,905-909 at bf9b4c9 | BLOCKER | 0 | Fixed; delivered id-token-1 precedes grant/cache/interaction observations | 08956910cde762bb13250885479ab0a845223ae0 |
| CR-02-AUTH-007 | Unit Assertions / errors by class and fields / test/cloud/auth.test.ts:544-545,601,941,956,983,998,1088-1098,1110,1137,1168,1243-1244,1266-1267 at bf9b4c9 | BLOCKER | 0 | Fixed; typed auth/cloud errors with relevant structured fields | 323432ea562bdd787db7b842a044a0879fd4feb4 |
| CR-02-AUTH-008 | Unit Assertions; D-05 caller-owned cancellation / test/cloud/auth.test.ts:1276-1300 and cancellation assertions at bf9b4c9 | BLOCKER | 0 | Fixed; caller reason identity in active cancellation cases | 112e5be089402fa058afe6b54bb8da48d23f62d6 |
| CR-02-AUTH-009 | Unit Production design / test-only exports / src/cloud/auth.ts:77-78 and four exact consumers at bf9b4c9 | BLOCKER | 0 | Fixed; four independent .basement-guardian-token.json consumers; no public test export | 516e0becf54af99c544f177eec305d778323521d |
| CR-02-AUTH-010 | Google style Types / optional members / src/cloud/auth.ts:120-123,332,510 at bf9b4c9 | WARNING | 0 | Fixed; private optional policy, empty initializer and delete recovery | 83cb2a2592098b87dc684f7ec8162027b5d81804 |
| CR-02-AUTH-011 | Google style Gate on toolchain / suppression reasons / src/cloud/auth.ts:30 at bf9b4c9 | WARNING | 0 | Fixed; AUTH0_CLIENT_ID suppression carries its actual reason | fada024dbd230af6ba18bfbf43a996c2dcde7ba9 |
| CR-02-AUTH-012 | Unit Case structure / AAA / test/cloud/auth.test.ts:507-509,958-969,1090-1099,1125-1139,1156-1170,1290-1300 at bf9b4c9 | WARNING | 0 | Fixed; separate AAA observations in the listed cases | 5b6cdc72f8e1b0713016d1a9efcd28f9e723c953 |
| CR-02-AUTH-013 | Google style Functions / named declarations / test/cloud/auth.test.ts:91-93 at bf9b4c9 | WARNING | 0 | Fixed; named recorder declaration | cb47cc83a398d9094a6e2230ef4c193b54855f02 |
| CR-02-AUTH-014 | Google style Functions / discarded values / test/cloud/auth.test.ts:283,297,314 at bf9b4c9 | WARNING | 0 | Fixed; block-bodied discarded callbacks | 7a13125f7c80b962a78b1d888ee61a0dd1aaea7f |
| CR-02-AUTH-015 | D-13 typed terminal refusal; D-06 / src/cloud/auth.ts:337-338,354-359 at 7a13125 | BLOCKER | 1 | Fixed; D-13 preserves the terminal refusal when the cache path is a directory | 9edb50cf4dac1d622c36e0afd21052f6d9be31a2 |
| CR-02-AUTH-016 | Unit Data-driven cases / test/cloud/auth.test.ts:566-574 at 7a13125 | WARNING | 1 | Fixed; condition-free fresh dependencies in both cancellation scenarios | 14c740371e8a35f8ade64b7f890c0f88269e7f03 |

### SHADOW findings

Original locations: 82d6d1a32d2dd078f07691171407f4d9d3d26f7d; introduced rows carry their own revision.
Report: .planning/phases/02-cloud-conformance/02-SHADOW-REVIEW.md.

| ID | Rule / original location | Severity | First round | Disposition / observable evidence | Actual fix commits |
| --- | --- | --- | --- | --- | --- |
| CR-02-SHADOW-001 | D-01; Google Files and modules / shadow.ts:1-6; shadow.test.ts:1-5 | WARNING | 0 | Fixed; explicit inspection of both complete headers | 5db616f17da938298d4dc10cb05f462838258c49 |
| CR-02-SHADOW-002 | Comments Forbidden history narration / shadow.ts:99-105 | WARNING | 0 | Fixed; current connection ownership comments | 71ff3ee4015228345eb22b7aa66679dee4dc8c8d |
| CR-02-SHADOW-003 | Unit Assertions whole independent byte output / shadow.test.ts:399-429,683-717 | BLOCKER | 0 | Fixed; signs the handshake from the cached credentials and refreshes the client identifier; both complete URLs | 4a6954c221b4f1a1d50967cc1233fdd62a2885c7 |
| CR-02-SHADOW-004 | Unit Assertions complete promised result / shadow.test.ts:833-850 | BLOCKER | 0 | Fixed; complete sanitized disconnect lifecycle after credential-bearing error | db79085c526248965ffa004d2d669834201f9a68 |
| CR-02-SHADOW-005 | Unit Case structure exported entrypoint groups / shadow.test.ts:250,398,432,581,624 | WARNING | 0 | Fixed; flat SHADOW_TOPICS/createShadowClient groups | 5f67ac1e2a5d954a2c78ed9a6de681832ef65ccf |
| CR-02-SHADOW-006 | Unit Case structure AAA / shadow.test.ts:233-245,856-857 | WARNING | 0 | Fixed; separate operation/observation/assert phases | 4d764a1ee99aac6546ad000a1d067e0d99457cd9 |
| CR-02-SHADOW-007 | Unit Test doubles logging role / shadow.test.ts:304-321,351-369,529-539,548-558,566-576,788-830 | WARNING | 0 | Fixed; silent typed logger; public patches/state/lifecycle preserved | bb423681d0e14e19c0a9380cc7e3f8ea85ce43db |
| CR-02-SHADOW-008 | Unit Test data seed placement / shadow.test.ts:65-73,673,689 | WARNING | 0 | Fixed; fresh rotated credential literals in each named signing case | 2021fce25ed97525be8ed46a18919c95443fbcfd |
| CR-02-SHADOW-009 | Google Functions named declaration / shadow.test.ts:103 | WARNING | 0 | Fixed; named no-op declaration | 8277ae16577453bd270803f09941ee74f8b2fbd7 |
| CR-02-SHADOW-010 | Safety invalid-value semantics; bug scope; D-06 / shadow.ts:173-182,194-202 | BLOCKER | 0 | Fixed; reports an overflowing document version as absent | f1be01b2c9c28cf69b68527797ff1d1f3e047ec8 |

### API findings

Original locations: 22644f309952adadd2fbefca7bee21ef02951376; introduced rows carry their own revision.
Report: .planning/phases/02-cloud-conformance/02-API-REVIEW.md.

| ID | Rule / original location | Severity | First round | Disposition / observable evidence | Actual fix commits |
| --- | --- | --- | --- | --- | --- |
| CR-02-API-001 | D-01; Google Files and modules / all six openings | WARNING | 0 | Fixed; explicit inspection of seven complete headers | 6b801927b64f2596068f229f802533421351d860, 28a65e176df0488d13d38233391780f0ef7922bb |
| CR-02-API-002 | Unit Types and hermeticity, Production design / api.test.ts:82-89,104-185 | WARNING | 0 | Fixed; fixed fail-closed transport; every API operation injects HTTP | 60cfd6f6f4f8a1327599ad61e37039d21afa8405 |
| CR-02-API-003 | Unit Assertions / api.test.ts:243-270,294-306,498-521,595-610,678-782; types.test.ts:242-244 | BLOCKER | 0 | Fixed; authorizes the device request with the bearer token the auth client supplies; returns exactly the six fields the plugin reads; complete error fields | 517bf0d50e1b250076ecbd880f190b28bfddadf4, 82bc842b4a749b73dd1e2d3829ad98f940c64c1e, ce812b5562f80f30a94ed2ac919c244e67eb73e8 |
| CR-02-API-004 | Unit Assertions / api.test.ts:477-495,739-758; errors.test.ts:20-27 | BLOCKER | 0 | Fixed; keeps the token, the base URL, and the response body out of a failed request error; complete sanitized class/header fields | b0104000d4bebcb4dbc47037a5f7b37ded817914, 65486cad101b48ede0f1753973791a71c9e11a30 |
| CR-02-API-005 | Unit Assertions / api.test.ts:524-572,613-626 | BLOCKER | 0 | Fixed; root/read/command abort identity, one request before abort and no HTTP after expired auth | d1874c3faaeb8152dbf3a179fcda16b63eae8a49, f4df2ed19baddb3ce10cb13609184b484eb76773 |
| CR-02-API-006 | Unit Assertions independent expectations / api.test.ts:511-521 | BLOCKER | 0 | Fixed; deadlines a command with the command deadline rather than the request timeout; independent 2500 ms | d29717cb8f84f525fa216e0c151f64d204a9fcee |
| CR-02-API-007 | Unit Production design / api.ts:18,31-36; api.test.ts:5,201-214,521 | BLOCKER | 0 | Fixed; offers exactly four operations and reaches only the four declared routes (SYNC-01) | 601296f93f4c474ce4e78019f5d9bcf42f7799cc |
| CR-02-API-008 | Google Types / api.ts:62-68,170-183 | WARNING | 0 | Fixed; private optional VendorCall.body; reads omit the field | 036f9648c1ed3fb44011b40244f73c130c0139a2 |
| CR-02-API-009 | Unit Case structure AAA / types.test.ts:136-279; api.test.ts:201-214,624-626,669-675; errors.test.ts:8-72 | WARNING | 0 | Fixed; separate types/errors/API AAA phases | 896892f23a445620f89cd2e3c5edb016153220ca, 7788a4d833f1ab8d57130195b109d8485030cafe |
| CR-02-API-010 | Unit Case structure exported entrypoints / errors.test.ts:8-73 | WARNING | 0 | Fixed; four exported-error describe groups | 68b5f8f0dbc8753dc20cb17198258cd1c4dbc560 |
| CR-02-API-011 | Comments Forbidden history narration / api.test.ts:395-399,419,723-724,760-765 | WARNING | 0 | Fixed; current envelope and loopback rationale | 19edf27ea03d322744f91a0138f590a0984016f6 |
| CR-02-API-012 | Google Naming; Unit Naming / api.test.ts:126,137,140,181; types.test.ts:127-133,273-276 | WARNING | 0 | Fixed; role-named callbacks and command rows | d771bcf3567abafcd140e410fc6d32cf50d6345e, 892629a611e6642404e95aa014970630a7742a9f |
| CR-02-API-013 | Unit Test data seeds / api.test.ts:23-80; types.test.ts:16-134 | WARNING | 0 | Fixed; fresh apiSeeds factories; malformed input graphs built per case | 28a65e176df0488d13d38233391780f0ef7922bb, 925c5c1d936786a1cf3335923733682f8b792ed3, 8012ddf54d1f35385377f6de9cca3f99837f59c3 |
| CR-02-API-014 | D-038 whole-operation deadline / api.ts:89-96,150-155; accountRuntime.ts:237-242,1097-1101 | BLOCKER | 0 | Fixed; preserves the command timeout reason while its response body is pending; preserves root cancellation while a device response body is pending | 526ace58b1dd7afc56249fc0564ee621b82ef1cb |
| CR-02-API-015 | Typed sanitized HTTP error contract / api.ts:102-108; accountRuntime.ts:273-279 | BLOCKER | 0 | Fixed; retains the typed HTTP failure when response body cancellation rejects | a5196c1989d659ca69e710b569e40714d4365b4a |
| CR-02-API-016 | Comments current behavior; Google Comments and documentation / 8012ddf:api.test.ts:771-773 | WARNING | 1 | Fixed; accurate complete-header rationale without the false first-identification claim | f34682f12200e9b5985bf79d3c2c77dc22b67838 |

### TRANSPORT findings

Original locations: 5f91f1dbea4113ceaf32fbf715dcc41d489086a9; introduced rows carry their own revision.
Report: .planning/phases/02-cloud-conformance/02-TRANSPORT-REVIEW.md.

| ID | Rule / original location | Severity | First round | Disposition / observable evidence | Actual fix commits |
| --- | --- | --- | --- | --- | --- |
| CR-02-TRANSPORT-001 | D-01; Google Files and modules / all seven openings | WARNING | 0 | Fixed; explicit inspection of eight complete headers | f5d2456755a02c8508caf5f729447bf38f2067bc, 27a5df7070e843c34e9d39ca1985f0c4daaba1b5 |
| CR-02-TRANSPORT-002 | Unit Assertions complete independent bytes / sigv4.test.ts:107-119 | BLOCKER | 0 | Fixed; signs the complete URL for a different secret access key; all four independent URLs | fb3de06560c1978281bfd8ee4f97c3fd8b9d1204 |
| CR-02-TRANSPORT-003 | Unit Assertions; preserved end completion / mqttTransport.test.ts:70-73,276-297 | BLOCKER | 0 | Fixed; ends the client once and resolves both times when ended twice; callback-owned settlement | f81d3e974e1654a7f0e6ad7ef2a9b55f5963e6c9 |
| CR-02-TRANSPORT-004 | Unit Assertions complete byte values / mqttTransport.test.ts:176-188 | BLOCKER | 0 | Fixed; forwards the message notification with its topic and payload; exact non-UTF-8 Buffer | d4ce7c554cae6cb7f24c7357378f2f4e790654e3 |
| CR-02-TRANSPORT-005 | Unit Assertions errors and named behavior / httpDispatcher.test.ts:82-87 | BLOCKER | 0 | Fixed; rejects with the caller reason without sending an already-aborted request | dc6f2a169dabd9bd8cd41c67ce263915ae0bb78d |
| CR-02-TRANSPORT-006 | Unit Assertions result before interactions; tracer / httpDispatcher.test.ts:92-107 | BLOCKER | 0 | Fixed; negotiates HTTP/1.1 even when the server offers HTTP/2; complete response precedes protocol | 3c0f1b6188f7b3f9ae7fd0739dcb6ee694555c20 |
| CR-02-TRANSPORT-007 | Unit Test doubles / mqttTransport.test.ts:42-95,105-158,222-297 | WARNING | 0 | Fixed; case-owned exact promised callback/registration mocks, verified after public results | 7c80ea06aef7f4e8c30f2378b4d8af1d49bc3e2f, 992eb13babba2298ad25807d5acbc4de196e2f94 |
| CR-02-TRANSPORT-008 | Unit Case structure AAA / mqttTransport.test.ts:106,114,131; sigv4.test.ts:113-119 | WARNING | 0 | Fixed; separate MQTT/signing AAA and fresh row construction | 31c406ea69926f1aeca979feb88ce952c0a4ebd2, 1ad928514f82f0132d1ae3529ab8c6053d5419d7 |
| CR-02-TRANSPORT-009 | Unit Environment / httpDispatcher.test.ts:96-100 | WARNING | 0 | Fixed; restoration registered before CA trust mutation | e6e3f479b1d48bd24c51506dc7248b9f684c05e6 |
| CR-02-TRANSPORT-010 | Google Comments and documentation; D-06 / httpDispatcher.ts:22 | WARNING | 0 | Fixed; explicit offline HttpFetch injection documentation | a2430e3c4cfc94ab5d7fa68ddbcf3c0b14bb166d |
| CR-02-TRANSPORT-011 | Google Naming / mqttTransport.ts:167 | WARNING | 0 | Fixed; typed handshake tuple retains third client argument | 77eebb791918321ea9c5bb5347a549ff7cc5dc4d |
| CR-02-TRANSPORT-012 | Unit Naming values / sigv4.test.ts:44-45 | WARNING | 0 | Fixed; HMAC payload parameter follows its role | a4a65eda2cb9dfd76abda282b2658318b7323045 |
| CR-02-TRANSPORT-013 | Unit Test data cross-case seeds / sigv4.test.ts:58-68,74-141 | WARNING | 0 | Fixed; unchanged fresh baseInput factory in sigv4Seeds.ts | 27a5df7070e843c34e9d39ca1985f0c4daaba1b5 |

### Five auth WARNING seeds

| Category | Outcome / rationale |
| --- | --- |
| Length-only request assertions | Complete method/URL/headers/body fixed under AUTH-002; meaningful deduplication, explicit retry and no-automatic-retry counts retained because they observe that public promise. Blanket count deletion rejected with that concrete rule/contract reason. |
| Negative privacy assertions | AUTH-003 fixed with complete independent cache Buffer; token-only control fails the named privacy case. |
| Optional fields | AUTH-010 fixed only in private FailurePolicy, with absence initialization and delete recovery; no mechanical public-shape conversion. |
| Global fetch default | AUTH-005 fixed with throwing synthetic default and explicit per-case injection; no live fallback. |
| Test-only filename export | AUTH-009 fixed after complete production and test-aware consumer evidence: no production consumer and exactly four test/support consumers; stable filesystem name retained independently. |

These are category dispositions, not extra finding IDs. All accepted findings
are fixed; no accepted cause was rejected. Counts used only where request number
is the promise are retained; that is not dismissal of omitted content assertions.

## Review rounds

Triage is round 0. Count only independent full-scope evaluation after planned
repairs. Reviewer identities below are gsd-code-reviewer roles; confirmed fixes
used the separate gsd-code-fixer named in each batch report. Review counts were
reported to the parent coordinator before further repairs or records.

| Batch / round | Independent reviewer | Reviewed revision / baseline | Opening | Fixed | Rejected | New | Reopened | Closing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Auth / 1 | /root/phase2_auth/auth_rereview_1 | 7a13125f7c80b962a78b1d888ee61a0dd1aaea7f / bf9b4c9 | 14 | 14 | 0 | 2 | 0 | 2 |
| Auth / 2 | /root/phase2_auth/auth_rereview_1 | 14c740371e8a35f8ade64b7f890c0f88269e7f03 / bf9b4c9 | 2 | 2 | 0 | 0 | 0 | 0 |
| Shadow / 1 | /root/phase2_shadow/shadow_initial_review | 8277ae16577453bd270803f09941ee74f8b2fbd7 / 82d6d1a | 10 | 10 | 0 | 0 | 0 | 0 |
| API / 1 | /root/phase2_api/api_initial_review | 8012ddf54d1f35385377f6de9cca3f99837f59c3 / 22644f3 | 15 | 15 | 0 | 1 | 0 | 1 |
| API / 2 | /root/phase2_api/api_initial_review | f34682f12200e9b5985bf79d3c2c77dc22b67838 / 22644f3 | 1 | 1 | 0 | 0 | 0 | 0 |
| Transport / 1 | /root/phase2_transport/transport_review_initial | fb3de06560c1978281bfd8ee4f97c3fd8b9d1204 / 5f91f1d | 13 | 13 | 0 | 0 | 0 | 0 |

Equations: auth 14-14+2=2, then 2-2=0; shadow 10-10=0;
API 15-15+1=1, then 1-1=0; transport 13-13=0.
Initial accepted total is 52; auth introduces 015/016 and API introduces 016,
giving 55 unique accepted fixed IDs. Final accepted open total is zero.
Every final reviewer explicitly reports a clean complete batch.

No independent round leaves a non-reduced positive count, no fixed finding
returns, and none reaches round four. D-03 required no global pause.
Tracer feedback, original-code clarification of TRANSPORT-013, and executor
completion of original TRANSPORT-007 before round 1 are not formal rounds or
reopens. A future stall, reopened fix or fourth round requires an immediate
all-work pause even if that fourth round is clean; unresolved IDs must remain
visible until the maintainer chooses retry, skip or stop.

## Genuine bug provenance

The audit reran check tdd-red-evidence for each of the five complete records,
including AUTH priorEvidence[0] and API priorEvidence[0]. All returned exit 0,
RED_EVIDENCE_OK, target_test_failed and valid native TAP. The current archives'
record fields equal the original evidence-commit records. To classify extracted
prior records, the same CLI was run on unchanged temporary JSON with
--cwd /private/tmp; an initial root-containment rejection made no classification
claim. Top-level records also classify directly from their committed paths.

| ID | Source commit | Planning-only evidence commit | GREEN source/test commit | Unchanged production blob |
| --- | --- | --- | --- | --- |
| CR-02-API-014 | 6b801927b64f2596068f229f802533421351d860 | 4e97640e5f34aa7df92a413a6950ca3323cd3377 | 526ace58b1dd7afc56249fc0564ee621b82ef1cb | 9e0ac79e5baac134c45cb33f98d5aba6c2868c39 |
| CR-02-API-015 | 526ace58b1dd7afc56249fc0564ee621b82ef1cb | a88590e9bc5b8d254f5a5c95e2ce3095df19b909 | a5196c1989d659ca69e710b569e40714d4365b4a | 2e7973c8e346b4948d1bb6e6035ed8cd0c41668b |
| CR-02-AUTH-001 | bf9b4c9ff4a1d043c1f53bb4023c2b302c0ab455 | f8b8635a4f632a78a7ea023412595230f9ea31ed | b42d3688ddcabe7aacfb8e8d5e16bc499142e5d7 | 4306178be18b4e130745d7127d2b3d1f10601ded |
| CR-02-AUTH-015 | 7a13125f7c80b962a78b1d888ee61a0dd1aaea7f | 31b30839ba0779017f289b5a453e657f01405a5b | 9edb50cf4dac1d622c36e0afd21052f6d9be31a2 | ce09e40cd6987daf087293bbd7bef38e60b5e49e |
| CR-02-SHADOW-010 | 5db616f17da938298d4dc10cb05f462838258c49 | 461601dc1ce6df30e77614e6135e4cd5d7647abd | f1be01b2c9c28cf69b68527797ff1d1f3e047ec8 | 8853c0a2e0fb406867bf03935696d31cd927bbde |

git show and git merge-base --is-ancestor establish source < evidence < fix
< current HEAD for every row. Each evidence commit changes only its batch JSON;
each GREEN fix includes only the owning source/test pair. Source blobs match
between source and evidence. All recorded report commit objects are ancestors;
no audited task commit deletes tracked files. Domain-scoped Conventional
Commits follow project policy; generic GSD subject/failing-code heuristics
cannot establish this approved D-04 history.

| ID | Active target / semantic RED | Executed / pass / fail | Capture interval, Node v26.11.1 |
| --- | --- | --- | --- |
| AUTH-001 | authenticates again when the cache file carries an infinite expiry: cached-token-1 instead of id-token-1; four invalid TTL cases also fail missing expected rejection | 66 / 61 / 5 | 2026-10-13T22:44:42.176Z–22:44:44.026Z |
| AUTH-015 | D-13 preserves the terminal refusal when the cache path is a directory: intended AuthRejectedError instanceof expected true, actual false | 69 / 68 / 1 | 2026-10-13T23:04:22.700Z–23:04:24.907Z |
| SHADOW-010 | reports an overflowing document version as absent: complete patch has Infinity instead of undefined | 61 / 60 / 1 | 2026-10-14T00:06:17.865Z–00:06:22.355Z |
| API-014 | preserves the command timeout reason while its response body is pending; preserves root cancellation while a device response body is pending: CloudRequestError200 replaces both expected reason identities | 35 / 33 / 2 | 2026-10-14T00:33:32.669457Z–00:33:33.053873Z |
| API-015 | retains the typed HTTP failure when response body cancellation rejects: intended CloudRequestError class expected true, actual false | 36 / 35 / 1 | 2026-10-14T00:35:37.913862Z–00:35:38.391539Z |

All native RED exits are 1; target tests execute with zero skips/cancellations.
Auth/API command: node --test --test-reporter=tap dist-test/test/cloud/<owner>.test.js,
after successful build. Shadow's recorded command includes npm run build:test
before the same native owner. Complete unchanged native output, active patches,
commands, expected/actual values, timestamps and versions remain in the owned
RED JSON paths; no fabricated or hidden test is required.

AUTH-015 and SHADOW-010 saved patches exactly equal GREEN test diffs.
AUTH-001 and API-015 differ only in formatter wrapping/trailing commas.
API-014 also has lint-required block bodies for discarded callback results and
spacing; manual comparison confirms the same pending-body setup, signal-driven
stream errors, waits, aborts and strict reason-identity assertions. It is semantic
correspondence, not byte-identical patch correspondence. All regression titles
remain active in the current owning tests. No failing code was committed.

## Separate assertion controls

These eight experiments establish assertion discrimination only. They are
excluded from the genuine-bug count and convergence rounds. Named failures
execute on synthetic fixtures; no live account or pump data is used.

| Batch / control | Intended failure | Exact restoration / rebuilt GREEN |
| --- | --- | --- |
| Auth / POST→GET | complete password-realm request fails; incompatible GET-body adapter also fails | SHA-256 1433a95f1ae5ec9636dc855c8a5c84fa4780399b89afe123ee3de01b34d5fc02; owner 68/68 |
| Auth / token-only cache | five complete Buffer expectations fail, including AUTH-02 privacy | Same source SHA-256; rebuilt owner 68/68 and isolated 100% |
| Shadow / wrong signing secret | both complete signed URL expectations fail ERR_ASSERTION | Git blob 018f49c720f0119fb131b4f03dfbc3966a98dadc; owner 61/61 |
| API / wrong command identity header | declares exactly four headers on a command request fails ERR_ASSERTION | Git blob c3c11843113f897de2c8e4d2973ed35b475ab381; owner 33/33 |
| MQTT / premature end | ends the client once and resolves both times when ended twice fails ERR_ASSERTION | SHA-256 0e0916b1dca0c9d7f9b53fbfab1723110b90fc782d27ca4f2ce4e6a6987aa95d; owner 21/21 |
| MQTT / UTF-8 normalization | forwards the message notification with its topic and payload fails complete Buffer | Same source SHA-256; owner 21/21 |
| MQTT / duplicate registration | same message case fails unexpected second strict registration call | SHA-256 7aac52aad1aa7dd0e805fb274303fbb730c1816db4a61348e3cd2af6b99829c6; owner 21/21 |
| Signing / missing changed-secret signature | signs the complete URL for a different secret access key fails ERR_ASSERTION | SHA-256 a72e4e4ef51726b2fb081376e2dc52d5a24c819b23c5ca43a782f9ee7b697419; owner 9/9 |

Retained receipts: auth fixer manifests, SHADOW/API assertionControls fields,
and /private/tmp/guardian-transport-fixer-actuals.json negativeControls.
Before/restored byte and hash equality, native intended exits, rebuilt GREEN
and source revisions were inspected. No experiment mutation appears in current
source; no control is classified as production-bug RED.

## Checks and final-input reuse

The complete executed/reuse record is in 02-VALIDATION.md. All eight mirrored
pairs alone pass 100% lines/functions/branches. Shared ALPN, fresh seed support
and feature TS commits select all 43 pairs under the actual selector; enabled
hooks pass. Incremental hook evidence does not replace the combined gate.

Same-session full command npm run check passed at clean
e57e7d4d3a6276838a8d5024cdb0644413d28d75 on Node v26.11.1 before
2026-10-14T12:39:55Z, within the 2400-second limit. The retained log is
/private/tmp/guardian-phase2-wave4-full-check.log: all six static checks,
unpaired owners, 104 Cucumber scenarios/1156 steps and all 43 isolated pairs,
merged into coverage/direct.lcov. Reviewed transport code is fb3de06560c1978281bfd8ee4f97c3fd8b9d1204.

This audit at 0a25640291039195ce9db2f23bc939be1819888e re-proved
git diff e57e7d4d3a6276838a8d5024cdb0644413d28d75 -- . ':(exclude,glob).planning/**/*.md'
empty and no untracked inputs. Current Node remains v26.11.1. Current source,
test, helper, dependency, configuration and tool inputs are unchanged; only
planning Markdown differs. Full evidence is reused under local-verification;
no fresh full-run claim is made. A fresh npm run build:test followed by
node --test dist-test/test/packaging/licenseHeaders.test.js passed exit 0,
5/5 with no skips/cancellations. The ledger tracer emitted LEDGER_TRACER_OK
before and after its committed slice. No live vendor, hardware or installs.

## Retained concerns and judgment handoff

UNCONFIRMED API dot-only identifier concern: actual sendCommand('..') targets
/data and sendCommand('.') targets /devices/data under WHATWG URL normalization.
The public string and wire contracts permit these inputs. Vendor documentation
describes account-id_serial-number but establishes no hard precondition here;
no occurrence was established. Source api.ts device path construction and
types.ts string guard support the limitation. It is neither fixed nor dismissed.
No speculative validation/encoding safeguard is added.

UNCONFIRMED ALPN active HTTP/2 session-close concern: alpnServer.ts close calls
server.close without tracking/destroying HTTP/2 sessions. Node server close can
wait on active sessions, while the expected HTTP/1.1 owners pass. No executed
current failure establishes a finding. Keep the observed implementation and
limitation for security/verifier/maintainer assessment; no cleanup or contract
redesign is inferred.

E-02-01/CLOUD-01 remains one unclassified/unresolved fallback-taxonomy assumption;
concrete behavior coverage does not prove taxonomy completeness. P-02-01 safety
and P-02-02 truthful completion remain descriptorless, flagged-unverified
judgment prohibitions. Edge equality is 1=0 lifted+1 assumption; prohibition
equality is 2=2 authored+0 unresolved assumptions. Phase 1's bounded approval
does not approve this new scope. Phase-end maintainer judgment is pending.

No accepted finding or evidence contradiction requires a D-03 pause. This
planning-only audit adds no production surface, dependency, test hook, protocol,
deletion or unrun automated check. Parent owns independent final phase audits,
WINDOWS/state/roadmap/requirement updates and judgment; this ledger supplies
reviewable evidence without marking CLOUD-01 overall done.

## Threat Flags

None -- no security-relevant surface outside the plan's <threat_model> was introduced.
