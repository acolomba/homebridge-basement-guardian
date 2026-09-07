completed: 2026-09-05
---
created: 2026-08-31T10:17:18.801Z
title: Define cloud request header policy
area: api
severity: minor
files:

  - src/cloud/api.ts:112-117
  - src/cloud/auth.ts:350-358
  - src/settings.ts:1-9
  - package.json:2-12

---

## Resolved

Closed 2026-09-05 during the v1.0 milestone audit. Phase 6 plan 06-04 defined and applied
`PLUGIN_USER_AGENT` (`src/settings.ts:26`, an honest `homebridge-basement-guardian` product
identifier with no version/hostname/account data) across all outbound calls: vendor REST reads
and commands (`src/cloud/api.ts`), the Auth0 grant (`src/cloud/auth.ts:357`), and the AWS IoT
MQTT WebSocket handshake (`src/cloud/mqttTransport.ts`, via `wsOptions.headers`, confirmed not
to interfere with the SigV4-signed query string). Covered by `test/cloud/api.test.ts`,
`test/cloud/auth.test.ts`, and `test/cloud/mqttTransport.test.ts`.

## Problem

The vendor REST client and Auth0 token exchange do not set an application-specific
`User-Agent`. Node's `fetch` implementation supplies its runtime default instead,
so the requests do not identify Basement Guardian consistently across supported
Node versions. The REST client also sends only `Authorization` for reads and adds
`Content-Type: application/json` for requests with bodies. The Auth0 request sends
only `Content-Type: application/json`.

Before real-home testing and release, decide which headers the plugin must send,
which request paths receive them, and which values are safe and useful. At minimum,
this includes the exact user-agent string and whether JSON requests should declare
`Accept: application/json`. Consider Auth0, vendor REST, and the AWS IoT MQTT
WebSocket handshake separately; do not assume an HTTP header suitable for REST is
also necessary or compatible with the signed WebSocket connection.

Use `homebridge-adt-pulse` v3.4.20 as comparative research. Its normal ADT portal
authentication, polling, and control requests impersonate Chrome 126 on macOS and
send matching browser client-hint and `Sec-Fetch-*` headers because that integration
automates a browser portal. Its separate anomaly-report requests identify as
`homebridge-adt-pulse`. This is useful evidence that headers should be deliberate,
but it is not evidence that Basement Guardian should imitate Chrome.

The selected policy must not expose credentials, account or device identifiers,
hostnames, operating-system details, bridge names, or other installation-specific
data. It must not pretend to be the official Basement Guardian application without
a demonstrated compatibility requirement.

## Solution

Research the headers sent by the vendor web application and accepted by each cloud
endpoint. Choose and document a minimal, stable policy. The leading candidate is an
honest product identifier such as `homebridge-basement-guardian/<version>`, possibly
with a public project URL, for Auth0 and vendor REST calls. Decide how the version is
sourced without creating package-version drift.

Keep runtime-managed transport headers runtime-managed unless evidence requires an
override. Evaluate the MQTT WebSocket handshake independently and preserve its AWS
SigV4 behavior. Add focused tests that assert the approved headers on Auth0 and REST
requests, and add a WebSocket-handshake assertion only if that transport receives a
custom header. Verify the chosen policy against the live vendor endpoints without
logging header values that could contain secrets.
