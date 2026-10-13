# API Coverage — Phase 1: Secure Cloud Foundation

> Full coverage by default. Opt-outs are explicit, reasoned decisions.

Phase 1 integrates three external services: the vendor Auth0 tenant, the vendor REST API, and AWS IoT
Core. The vendor's full REST route surface is enumerated below because `SYNC-01` requires the runtime
to use exactly four routes "without using excluded account-management routes" — the subtraction is
part of the requirement, so it is recorded rather than left implicit.

Source for the vendor surface: `.planning/intel/constraints.md` §4 (the four routes this version uses
and the route families it does not) and §5 (the temporary-credentials response and shadow contract).

---

# API Coverage — vendor REST API

| capability | decision | reason |
|---|---|---|
| devices.list | INTEGRATE | |
| devices.get | INTEGRATE | |
| devices.sendCommand | INTEGRATE | `SYNC-01` names commands; the typed operation ships in this phase and the self-test and alarm-mute commands that use it belong to the controls phase |
| credentials.aws | INTEGRATE | |
| account.management | OPT-OUT | out of scope — vendor account administration is not required for safety monitoring (`PROJECT.md` Out of Scope, `D-004`) |
| account.profile | OPT-OUT | same reason as account.management |
| device.provisioning | OPT-OUT | out of scope — provisioning and claiming are excluded from v1 (`D-004`) |
| device.claiming | OPT-OUT | out of scope — same as device.provisioning |
| device.rename | OPT-OUT | out of scope — a vendor rename is observed through discovery, never issued (`D-004`, `DEV-06`) |
| device.delete | OPT-OUT | out of scope — the plugin never removes a device from the vendor account |
| firmware.list | OPT-OUT | out of scope — firmware versions are read from device metadata, never managed |
| firmware.update | OPT-OUT | out of scope — the plugin issues no firmware operation |
| location.list | OPT-OUT | out of scope — the plugin has no location concept; HomeKit owns rooms |
| location.management | OPT-OUT | same reason as location.list |
| rules.list | OPT-OUT | out of scope — vendor alert rules are the vendor's notification path, which users keep enabled independently (`REL-08`) |
| rules.management | OPT-OUT | out of scope — the plugin never edits vendor alert rules |
| contacts.list | OPT-OUT | out of scope — notification-contact administration is excluded (`D-004`) |
| contacts.management | OPT-OUT | same reason as contacts.list |
| email.rules | OPT-OUT | out of scope — email-rule administration is excluded (`D-004`) |

**Enforcement.** `src/cloud/api.ts` exports `ROUTES` as a closed constant object and a unit test
asserts its exact value set, so a fifth route cannot be added without failing the suite and revisiting
this matrix.

---

# API Coverage — vendor Auth0 tenant

| capability | decision | reason |
|---|---|---|
| oauth.token.passwordRealm | INTEGRATE | |
| oauth.token.refreshToken | OPT-OUT | no validated refresh-token flow was found for this tenant; the observed identity-token lifetime is thirty days and reauthentication uses the same password-realm grant (`AUTH-01`) |
| oauth.token.clientCredentials | OPT-OUT | not applicable — the account is a user identity, not a machine identity |
| oauth.authorize (interactive) | OPT-OUT | out of scope — v1 requires unattended authentication; an interactive flow can require a manual login after token expiry (`D-023`) |
| oauth.revoke | OPT-OUT | out of scope — the plugin deletes its local cache instead; revoking a shared public client's token is not the plugin's authority |
| userinfo | OPT-OUT | out of scope — nothing in v1 needs profile data, and fetching it would pull an account identifier the privacy rules keep out of logs and artifacts (`D-027`) |
| mfa endpoints | OPT-OUT | not offered by the vendor tenant for this public client; no evidence of an MFA-enabled path exists |

---

# API Coverage — AWS IoT Core

| capability | decision | reason |
|---|---|---|
| mqtt.connect (SigV4 over WebSocket) | INTEGRATE | |
| shadow.get (publish) | INTEGRATE | |
| shadow.get/accepted (subscribe) | INTEGRATE | |
| shadow.get/rejected (subscribe) | INTEGRATE | |
| shadow.update/accepted (subscribe) | INTEGRATE | |
| shadow.update (publish) | OPT-OUT | the plugin never writes the shadow; device commands travel over `PUT /devices/{deviceId}/data` (`SYNC-02`) |
| shadow.update/delta (subscribe) | OPT-OUT | delta messages carry `desired` values, which `SYNC-02` ignores entirely; subscribing would put requested state on the path into canonical safety state |
| shadow.update/documents (subscribe) | OPT-OUT | redundant with update/accepted for this phase's needs; recorded as research assumption A2, since only real hardware can confirm which topic the device's partial reports arrive on |
| shadow.delete | OPT-OUT | out of scope — the plugin never deletes a shadow |
| named shadows | OPT-OUT | the vendor uses the classic unnamed shadow; no named shadow is referenced anywhere in the protocol record |
| wildcard shadow subscription | OPT-OUT | the provider discourages it, the topic set grows over time, and it would deliver the `desired` deltas this phase excludes |
| jobs, fleet provisioning, device defender | OPT-OUT | out of scope — the vendor's temporary credentials scope the plugin to shadow access; none of these is part of the integration |

---

*Recorded during Phase 1 planning, 2026-08-28.*
