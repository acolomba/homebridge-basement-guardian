# Examples

Part of the `changelog` skill: `.agents/skills/changelog/SKILL.md`.

Too long, at 86 words:

> The `retryDelay` option is now read as seconds, which is what the README documents and what users write. The client consumed the bare number as milliseconds, so a `retryDelay: 5` -- five seconds by the documentation -- retried after 5 ms and used up every attempt before the server could recover. Every configured delay was a thousand times shorter than written, and a request that failed that way reported only the last error, with nothing to say the retries were wasted. Thanks to @contributor for the contribution (#42).

Better, at 33 words, with the PR's other changes nested under it:

> - `retryDelay` now reads as seconds, as the README says. It read as milliseconds before, so every retry fired a thousand times early and gave up before the server recovered. Thanks to @contributor. (#42)
>   - The delay now doubles after each attempt, up to 60 s.
>   - A `retryDelay` that is not a number falls back to 1 s instead of failing at startup.
