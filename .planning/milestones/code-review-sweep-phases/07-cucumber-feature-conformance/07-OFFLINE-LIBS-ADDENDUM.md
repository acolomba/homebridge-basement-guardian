# OFFLINE_LIBS post-STOP addendum

This is the user-authorized, one-review forward disposition of
`CR-07-OFFLINE_LIBS-016`. It is separate from Plan 07-08's correction
rounds. The Round 3 equation `1 - 1 - 0 + 1 + 0 = 1` and STOP in
[07-OFFLINE-LIBS-REVIEW.md](07-OFFLINE-LIBS-REVIEW.md) remain unchanged.

## Source change

Commit `e5f36015b6c30cdc8eda121f3be673f24c9d87a0` changed only the
comment before the `subscribe` listener in `features/lib/shadowBroker.ts`.
It now says that every MQTT client's subscriptions are recorded, including
scenario clients. It also says that `currentSubscriptions()` returns the
newest live client's topics. The listener and helper behavior did not
change. The complete source has 284 lines and committed blob
`a95db8b9503521e3c2bc5e60bbd70a182bf39cfe`.

## One independent review

One fresh read-only Claude Opus session read the complete current broker
module, lines 1–284, at the clean working tree after `e5f3601`. It also
read `AGENTS.md`, `07-19-PLAN.md`, `07-REVIEW-PROTOCOL.md`, the Cucumber
skill and its layout and stand-in rules, and the TypeScript style skill and
its comment, naming, and review rules. The reviewer did not run Git
commands, so it could not identify the source blob. The coordinator checked
the clean tree, line count, commit, and blob before and after review. The
reviewer listed the plan as lines 1–80; the committed file has 79
newline-terminated lines. This discrepancy does not affect the verified
284-line source read.

The reviewer found `016` **fixed**. The listener at lines 209–214 has no
client filter. The `client` and `clientDisconnect` handlers keep the map to
live clients; `currentSubscriptions()` reads its newest key at lines
236–239. The new comment matches those paths. It contains no planning
reference or removed-code narrative.

The full-file review also found two distinct, pre-existing documentation
warnings. They are outside the one-comment change authorized for this
addendum. Neither appears in the historical OFFLINE_LIBS report. They get
new stable IDs here and remain forward-open for separate maintainer rulings.

| ID | Requirement | Rule | First observed location | Severity | Forward disposition |
| --- | --- | --- | --- | --- | --- |
| `CR-07-OFFLINE_LIBS-017` | FEAT-02 | `.agents/skills/typescript-style/rules/naming-and-docs.md` §Comments and documentation, method descriptions begin with a third-person verb phrase | `e5f3601:features/lib/shadowBroker.ts:47,57` | WARNING | Open. The JSDoc for `currentSubscriptions()` starts “The topics…” and for `liveConnectionCount()` starts “How many…”. Both are method descriptions that start with noun phrases. |
| `CR-07-OFFLINE_LIBS-018` | FEAT-02 | `.agents/skills/typescript-style/rules/naming-and-docs.md` §Comments and documentation, document a member whose purpose name and type do not make obvious | `e5f3601:features/lib/shadowBroker.ts:40,225` | WARNING | Open. `handshakes: readonly string[]` does not say its entries are the handshake query strings returned by `queryStringOf(request)`. |

Forward disposition: `CR-07-OFFLINE_LIBS-016` is **closed by this
addendum**. Its historical status remains **open at Round 3 STOP**. IDs
`017` and `018` are separate forward-open documentation findings. No
correction Round 4 was run. This addendum does not claim a clean
OFFLINE_LIBS batch round.

## Verification

On Node `v26.12.1`, `npm run build:test` exited 0. The focused scenario
“The fake broker delivers a reported patch” passed 1/1 with 7/7 steps.
`./node_modules/.bin/cucumber-js --dry-run --format usage` exited 0; its
complete output contained no `UNUSED`, `UNDEFINED`, or `AMBIGUOUS` marker.
`./node_modules/.bin/cucumber-js --profile real --dry-run --format summary`
exited 0: six scenarios and 35 steps were all skipped, with no undefined or
ambiguous status. No real-profile step body or vendor request ran.

The pre-commit checks, Fallow audit, and normal hooks passed for `e5f3601`.
At that clean executable-input commit, `TEST_CONCURRENCY=1 npm run check`
exited 0: static checks, test build, unpaired tests, 130/130 offline
scenarios, 1400/1400 steps, and all 43 isolated direct coverage pairs passed.
The Cucumber portion reported 37.221 seconds. There was no tracked diff or
untracked input after the gate. Later planning-only edits can reuse this
evidence only while executable inputs remain unchanged.
