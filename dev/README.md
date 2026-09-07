# Local Homebridge container

Runs this plugin against the real vendor cloud inside the official Homebridge image, so you can see what a controller actually sees.

## Setup

```bash
cp .env.example .env      # then fill in BG_EMAIL and BG_PASSWORD
./dev/hb up
```

`.env` is gitignored. `dev/homebridge/` -- the container's storage, including the generated `config.json` that holds your account password -- is gitignored too.

The Config UI is at <http://127.0.0.1:8581>, seeded with **admin/admin**. It is bound to the loopback address, so it is not reachable from the network.

## Commands

| Command            | Does                                                   |
| ------------------ | ------------------------------------------------------ |
| `./dev/hb up`      | Build, render config from `.env`, start the container  |
| `./dev/hb down`    | Stop and remove it                                     |
| `./dev/hb restart` | Rebuild and restart -- picks up source changes         |
| `./dev/hb watch`   | Rebuild and restart automatically on any `src/` change |
| `./dev/hb logs`    | Follow container logs                                  |
| `./dev/hb observe` | Dump live HAP services and characteristic values       |
| `./dev/hb shell`   | Bash inside the container                              |
| `./dev/hb reset`   | Wipe storage; forces re-pairing                        |

## Seeing a change

`./dev/hb watch` rebuilds and restarts on every source edit. Homebridge loads a plugin once at startup, so a restart is what makes new code take effect -- editing `src/` alone changes nothing in the running bridge.

## Seeing state

`./dev/hb observe` reads the live HAP accessory database and prints every service with its characteristic values:

```
Sump Pit Flood             Leak Detected=0  Status Active=1
Sump Pit Level             Water Level=20  Raw Water Level Code=1  ...
```

This is worth knowing about because `StatusActive` is how this plugin marks a value it cannot vouch for, and Apple Home only shows it under accessory Details. `observe` shows it directly, and flags any inactive service.

It needs `BG_INSECURE=1` (the default), which also allows unauthenticated HAP reads from the local network. Every characteristic this plugin publishes is read-only, so what that exposes is telemetry, not control.

## Networking

The container uses host networking because HAP pairing needs mDNS and direct reachability from the phone. Only the bridge itself is exposed to the network; the UI stays on loopback.

Pairing also needs the host itself to carry multicast. A host with no firewall path for mDNS and no bridged network fails pairing silently: it discovers zero responders even when the LAN has plenty (one host here, `floyd`, saw 0 responders where the LAN showed 25). Before you attempt to pair on a new host, check that it can see mDNS traffic at all:

```bash
avahi-browse -a -t     # Linux hosts running Avahi
dns-sd -B _hap._tcp    # macOS hosts
```

If the command returns nothing within a few seconds, the host cannot receive mDNS, and pairing will fail no matter how the container is configured. mDNS needs UDP port 5353 open on the host, plus the HAP TCP port range Homebridge listens on.

On a host without multicast, either run the container's network stack on a host that does have multicast reachability, or place an mDNS reflector/relay between the host and the rest of the network.
