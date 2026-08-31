---
created: 2026-08-31T14:32:13.700Z
title: State the harness mDNS prerequisite
area: docs
severity: major
files:
  - dev/README.md
  - dev/hb
  - dev/compose.yaml
---

## Problem

`dev/README.md` presents `./dev/hb up` as enough to reach a paired accessory. It
is not. Pairing also needs the **host** to carry mDNS multicast, and the document
never says so.

On the `floyd` VM that condition does not hold. A PTR query for `_hap._tcp` sent
from `floyd` returns **0 distinct responders**, while another machine on the same
LAN sees **25**. Multicast fails in both directions, so no Homebridge bridge on
that host can ever be discovered, whatever the plugin or the container does.

Finding this cost most of a session on 2026-08-31. The search passed through
three wrong explanations before anyone measured the host itself:

- two `avahi` daemons sharing the network namespace under `network_mode: host`
- `bridge.advertiser` left unset, so HAP used its own mDNS stack
- `bridge.bind` not pinned to the LAN interface

A `macvlan` attempt followed and failed too: the container came up on its own IP
and could not ARP its gateway, because a KVM guest will not accept frames for a
second MAC. Each theory was plausible, each was tested, and none was the cause.
The measurement that settled it takes about eight seconds.

Two smaller obstacles cost time in the same session and belong in the same
document:

- The Config UI binds `127.0.0.1` only, so remote access needs
  `ssh -L 8581:127.0.0.1:8581`. Forwarding to the host's LAN address is refused
  by design, and `localhost` can resolve to `::1` where nothing listens.
- `firewalld` on Fedora Server blocks both `51826/tcp` and the `mdns` service by
  default, so a stock host refuses HAP and discovery until both are opened.

## Solution

Add a prerequisites section to `dev/README.md` naming host multicast as a hard
requirement for pairing, and separate what the harness can still do without it:
the plugin runs, the Config UI works, and `./dev/hb observe` reads live HAP.
Only pairing and Apple Home checks are lost.

Add a precheck that fails fast and cheaply — a short mDNS PTR query for
`_hap._tcp` that reports how many distinct responders answered. Zero means
pairing cannot work on this host, and the reader should stop rather than start
tuning advertisers. Wire it into `./dev/hb up` as a warning, or expose it as
`./dev/hb doctor`.

Record the firewall ports and the tunnel form next to it, so a reader meets all
three obstacles in one place instead of one per hour.

Record the one sequence that did work on this host, found on 2026-08-31 after
several failures: set `promisc` on the parent interface **first**, then restart
Homebridge. Order matters, because the bridge announces itself at startup and
needs the interface already in promiscuous mode. Pairing succeeded reliably that
way and failed every time the two were done in the other order or with `promisc`
off. Note it as an observation about this host, not a general rule.

Also record that a Home app "Remove Accessory" does NOT reach the bridge when the
bridge is unreachable, which leaves the pairing stale: the accessory disappears
from the home while `AccessoryInfo.*.json` still lists a paired client and the
bridge keeps advertising `sf=0`, refusing every new pairing. It happened twice.
Clearing `pairedClients` and `pairedClientsPermission` with the container stopped
restores `sf=1`, and is far lighter than `./dev/hb reset`, which wipes the whole
storage directory.

Do not document the `macvlan` attempt as a remedy. It did not work here, and
presenting it as an option would send the next reader down the same path.
