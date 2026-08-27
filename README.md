<p align="center">
  <img src="https://github.com/homebridge/branding/raw/latest/logos/homebridge-wordmark-logo-vertical.png" width="150" alt="Homebridge">
</p>

# Homebridge Basement Guardian

A Homebridge dynamic platform plugin for monitoring and protecting basements.

> This project currently contains the working starter accessories supplied by the official Homebridge plugin template. Basement-specific discovery, sensors, and automations still need to be implemented.

## Requirements

- Node.js 22 or later
- Homebridge 1.8 or 2.x

## Development

Install dependencies and verify the project:

```shell
npm install
npm run lint
npm run build
```

Run the complete quality gate--including type checking, linting, code-health analysis, format verification, build, and tests--with:

```shell
npm run check
```

Link the plugin to a local Homebridge installation:

```shell
npm link
homebridge -D
```

For automatic rebuilding and a dedicated development instance, use:

```shell
npm run watch
```

The development instance reads its configuration from [`test/hbConfig/config.json`](./test/hbConfig/config.json).

## Homebridge configuration

Add the platform through the Homebridge UI, or add it directly to `config.json`:

```json
{
  "platform": "BasementGuardian",
  "name": "Basement Guardian"
}
```

## Project structure

- [`src/platform.ts`](./src/platform.ts) handles discovery and accessory registration.
- [`src/platformAccessory.ts`](./src/platformAccessory.ts) handles accessory services and characteristics.
- [`config.schema.json`](./config.schema.json) defines the Homebridge UI configuration.

This project is based on the official [Homebridge plugin template](https://github.com/homebridge/homebridge-plugin-template) and should be developed alongside the [Homebridge developer documentation](https://developers.homebridge.io/).

## License

Licensed under the [Apache License 2.0](./LICENSE).
