---
name: cucumber-behavioral-testing
description: Rules for cucumber-js behavioral tests -- Gherkin wording, step definition organization, the per-scenario world, and fakes for external services. Apply when writing or changing features/**.
---

# Cucumber behavioral testing rules

Behavioral tests under `features/` describe the project from the outside: each scenario drives the real code through its public surface against local stand-ins for every external service. No scenario needs an account, hardware, or the public network.

## Tools

Use `@cucumber/cucumber` for the runner, `node:assert/strict` for assertions, and the world for scenario state. Compile support files with `npm run build:test`; `cucumber.json` imports the JavaScript under `dist-test/features/`.

```bash
npm run test:cucumber
```

## Gherkin

- Be concise and use active verbs; avoid the passive voice unless the subject is unknown.
- Use sentence casing for scenario titles.
- Use exclusively lower case for steps.
- Do not use `And`. Repeat `Given`, `When`, or `Then`.
- Avoid "should". Use the present tense: `Then the greeting is "Hello, World!"`.
- Use "these" when referencing a data table: `Given these devices:`.
- Use the definite article when something is specific: `the broker`, `the greeting`.
- Prefer a feature-level description of two or three lines that states what the feature protects and what the scenarios stand in for.

## Step definitions

- Organize step definitions under `features/support/steps/` by their function, not by the feature files they were created for. A step that checks an exit status goes in a general steps module.
- Order the definitions in each module `Given()`, then `When()`, then `Then()`.
- Keep each step short: `Given` records the thing that is given, `When` performs the action, `Then` asserts the condition.
- Write steps as `function (this: <World>, ...)` so cucumber binds the world; do not use arrow functions for steps.
- Assert with `node:assert/strict`, comparing whole values.

## The world

- `features/support/world.ts` declares the world class and registers it with `setWorldConstructor()`. Every scenario gets a fresh world.
- The world owns the lifetime of each fake it hands out and tears everything down, in reverse order, in an `After()` hook, so no scenario leaks a listening socket, an open connection, or a temporary directory into the next one.
- Keep scenario state on the world as initialized fields; do not use module-level mutable state.

## Fakes

- Fake every external service the code talks to (HTTP APIs, brokers, identity providers) with a loopback-only stand-in owned by the world; put each one in its own module under `features/support/`.
- A fake records what it receives and can be armed to fail the next request, so scenarios cover error paths.
- Do not catch exceptions defensively in test code. Let them bubble up: the stack trace is more useful than a log with fewer details.
