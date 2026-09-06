# Contributing

## General

This project welcomes issues and pull requests.

## Responsible AI contributions

You can use generative AI when you meet these conditions:

- **Human ownership:** You are responsible for the content of your contribution, even when AI helps write it.
- **Human oversight and expertise:** Review and revise issues and pull requests with your own expertise so they reflect your understanding and voice.

## Development setup

Install dependencies and verify the project:

```shell
npm install
npm run lint
npm run build
```

This command runs the complete quality gate: type checking, linting, code-health analysis, format verification, a build, and the tests:

```shell
npm run check
```

Link the plugin to a local Homebridge installation:

```shell
npm link
homebridge -D
```

Use this command for automatic rebuilding and a dedicated development instance:

```shell
npm run watch
```

The development instance reads its configuration from [`test/hbConfig/config.json`](./test/hbConfig/config.json).
