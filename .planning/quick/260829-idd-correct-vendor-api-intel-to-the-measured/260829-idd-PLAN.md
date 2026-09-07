---
phase: quick-260829-idd
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/intel/constraints.md
  - .planning/quick/260829-idd-correct-vendor-api-intel-to-the-measured/260829-idd-SUMMARY.md
autonomous: true
requirements: [INTEL-01, INTEL-02, INTEL-03, INTEL-04, INTEL-05, INTEL-06]

estimate:
  tokens: 40000
  raw_tokens: 40000
  tasks: 2
  confidence: low

must_haves:
  truths:
    - "The REST routes table in section 4 gives a measured response envelope for each of the four routes (INTEL-01)."
    - "The `/devices` envelope is documented with the plural key and the `/devices/{deviceId}` envelope with the singular key, so a reader cannot confuse the two routes (INTEL-01)."
    - "The `{ \"success\": true }` body for PUT /devices/{deviceId}/data is marked as not verified, with the reason that no command was sent (INTEL-02)."
    - "The Gemini identity block lists the 13 measured top-level keys in returned order, and places `serialNumber` and `productLine` under `attributes` (INTEL-03)."
    - "The privacy sentence states that the vendor `deviceId` may enter accessory context and runtime logs, and keeps the D-027 placeholder rule for public artifacts (INTEL-04)."
    - "The Gemini metadata table states that the fields live in the `state` object and marks `wifi_firmware_version` and `mcu_target_version` as not observed on the tested device (INTEL-05)."
    - "The section 5 shadow sentence records that the 2026-08-29 measurement contradicts it on the tested device, and the sentence is not deleted (INTEL-05)."
    - "Every corrected passage cites the 2026-08-29 measurement date, so a later reader can tell measured facts from carried-over intel."
    - "No real account identifier, serial number, device name, or location value enters the file. Placeholders only (D-027)."
    - "The `StatusFault` conflict in context.md is recorded in the SUMMARY as an open finding for the user to rule on, and context.md is not edited (INTEL-06, D-014)."
  artifacts:
    - .planning/intel/constraints.md
    - .planning/quick/260829-idd-correct-vendor-api-intel-to-the-measured/260829-idd-SUMMARY.md
  key_links:
    - "constraints.md section 4 envelopes -> the wire guards already shipped by quick task 260829-gx6, which must keep matching the record."
    - "constraints.md Gemini identity block -> src/cloud/types.ts ApiDevice narrowing, which lifts serialNumber from attributes."
    - "constraints.md privacy sentence -> D-027 public-artifact rule -> the Phase 2 decision that deviceId may enter accessory context and logs."
    - "constraints.md Gemini metadata table -> the heartbeat partial-payload list in context.md section 4, which names mcu_target_version."
---

<objective>
Correct `.planning/intel/constraints.md` so that it records the vendor API as it was
measured, not as it was assumed.

Live structure-only probes ran against the real vendor API (`https://api.iot8020.com`)
with a real account on 2026-08-29, during Phase 1 UAT. Values were never printed. Only
structure was read. ONE device was available, a `wayneWaterGemini`.

Five passages are wrong or incomplete:

- INTEL-01: the REST routes table gives paths and purposes but no response envelopes.
  That omission is what let a fully broken REST client pass every gate in Phase 1.
- INTEL-02: the `{ "success": true }` command response is written as measured fact. It
  was not measured. No command was sent, on purpose, because a command operates a real
  sump pump.
- INTEL-03: the Gemini identity block lists `serialNumber` and `productLine` as
  top-level fields. Both are inside `attributes`.
- INTEL-04: the privacy sentence at line 175 reads "The plugin uses `deviceId` only as
  the stable physical-accessory identifier. Public logs and fixtures must replace it
  with a placeholder." The user decided on 2026-08-29 that the vendor `deviceId` is not
  sensitive and can enter accessory context and runtime logs. D-027 still governs public
  artifacts.
- INTEL-05: the Gemini metadata table does not say where the fields live, and lists two
  fields that the measurement did not find. The section 5 sentence "The shadow can
  include `mcu_target_version` and `wifi_firmware_version` when the REST snapshot omits
  them." is contradicted by the measurement on the tested device.

FRAMING RULE, applies to every correction: one device, one firmware version. Where a
field was absent, write that it was absent ON THE TESTED DEVICE. Never write that it does
not exist. Do not let a single sample become a general claim.

A sixth item is flag-only:

- INTEL-06: `.planning/intel/context.md` line 1459 says that a published device whose
  payload stops validating must "set `StatusFault` on every service". That conflicts with
  the Phase 2 decision of 2026-08-29 and with D-014. Record it in the SUMMARY. Do not
  edit `context.md`.

Purpose: the intel record is the source that later phases plan against. A wrong record
produces wrong code that passes its own tests.
Output: a corrected `constraints.md`, committed, plus a SUMMARY that carries the
`StatusFault` finding to the user.
</objective>

<execution_context>
@/home/acolomba/homebridge-basement-guardian/.claude/gsd-core/workflows/execute-plan.md
@/home/acolomba/homebridge-basement-guardian/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@.planning/intel/constraints.md
@.agents/skills/simple-english/SKILL.md
@.agents/skills/humanizer/SKILL.md
</context>

<writing_rules>
This is a prose change to a document written in plain declarative technical English.
Match that voice. Both project skills are REQUIRED, not optional.

Read `.agents/skills/simple-english/SKILL.md` and apply it in pragmatic mode. The
passages are descriptive, not procedural: simple present tense, active voice, 25 words
per sentence maximum, one new fact per sentence, no semicolons. Identifiers, code
blocks, table cells holding code, and JSON keys are untouchable (Rule 1.5, Rule 8.6).

Read `.agents/skills/humanizer/SKILL.md` and apply it. No em dashes, no en dashes, no
inflated claims, no sales language, no forced groups of three, no bold mini-headings in
lists. Keep every fact. Invent none.

Two style points specific to this file:

- Do not write about what the document used to say. Write the current fact and its
  measurement date. The one exception is INTEL-05, where the user asked for the
  contradiction itself to be on the record.
- The file body sits inside a `content: |` block and every line carries a four-space
  indent. Preserve that indent exactly, including inside fenced blocks and tables.
</writing_rules>

<tasks>

<task type="auto">
  <name>Task 1: Correct the five measured passages in constraints.md</name>
  <files>.planning/intel/constraints.md</files>
  <precondition>The working tree is clean for `.planning/intel/constraints.md`, and `pre-commit` is installed and runnable.</precondition>
  <action>
Read the whole file first. Then make five edits, all inside the first `content: |` block.
Keep the four-space indent on every line you write. Use `Edit` for each passage. Do not
rewrite the file with `Write`.

EDIT 1, INTEL-01, the REST routes table at lines 70-75. Add a fourth column with the
header `Response envelope`. Fill it row by row, each cell as inline code: the `/devices`
row gets the exact text `{ "devices": [ <device>, ... ] }`; the `/devices/{deviceId}` row
gets the exact text `{ "device": <device> }`; the `/devices/{deviceId}/data` row gets
`Not measured.`; the `/credentials/aws` row gets `{ endpoint, clientId, credentials }`.
Add the separator-row cell so the table stays valid GitHub-flavored markdown.

Then add a short descriptive paragraph directly under the table. It must carry these
facts and no others: a measurement on 2026-08-29 against the live vendor API confirmed
these envelopes; one `wayneWaterGemini` device was available; the list route wraps its
result in the plural key `devices` and the single-device route wraps its result in the
singular key `device`; neither route answers a bare array or a bare device record; the
`/credentials/aws` body that section 5 already gives was confirmed correct. The two
routes use deliberately different keys, so say that plainly. This is the fact that a
reader most needs.

EDIT 2, INTEL-02, line 99, the sentence that gives the HTTP 200 success body for the
Gemini commands. Keep the sentence, because it is the best available claim. Add
immediately after it that the response is not verified, and give the reason: the
2026-08-29 measurement sent no command, because a command operates a real sump pump. Use
the word "unverified" or "not verified" so the status is unmissable, and cite the date in
this passage.

EDIT 3, INTEL-03, the `text` fenced block in the Gemini identity section at lines
166-173. Replace the block body with exactly 15 lines, one key per line, in this order
and with these left-hand tokens: `accountId`, `deviceId`, `deviceTypeId`, `location`,
`name`, `homeId`, `roomId`, `state`, `data`, `timestamp`, `shadow`, `attributes`,
`connectivity`, then `attributes.serialNumber`, then `attributes.productLine`. The first
13 are the measured top-level keys in returned order. The last two are the nested keys.
Put no other line inside the block: no heading line, no blank line, no comment line. The
automated gate reads the leading token of every line in this block.

Give each line a placeholder value in a second column, aligned as the block already
aligns: `accountId` gets `<account-id>`; `deviceId` gets `<account-id>_<serial-number>`;
`deviceTypeId` gets `wayneWaterGemini`; `location`, `state`, `data`, `shadow`, and
`attributes` get `<object>`; `name` gets `<user-selected-name>`; `homeId` and `roomId`
get `null`; `timestamp` gets `<unix-milliseconds>`; `connectivity` keeps its existing
value `{ connected: <boolean>, timestamp: <unix-milliseconds> }`;
`attributes.serialNumber` gets `<serial-number>`; `attributes.productLine` gets
`wayneWater`.

Then write the measured facts as prose under the block, one fact per sentence: the
2026-08-29 measurement returned the 13 top-level keys in the listed order from one
`wayneWaterGemini` device; `deviceId` is the `accountId` value, then an underscore, then
the `attributes.serialNumber` value, and both segments matched byte for byte; `accountId`
is 24 lowercase hexadecimal characters; `attributes.serialNumber` was 15 characters on
the tested device; `homeId` and `roomId` were null on the tested device; `state`, `data`,
`shadow`, and `attributes` are nested objects and `timestamp` is a number;
`serialNumber` and `productLine` are inside the `attributes` object and are not
top-level fields. `deviceTypeId` and `connectivity` were already correct, so state them
without comment.

EDIT 4, INTEL-04, the two-sentence privacy passage at line 175, directly under the
identity block. It is quoted in full in this plan's objective. Rewrite it to draw one
distinction precisely. It must say: the plugin uses `deviceId` as the stable
physical-accessory identifier; the vendor `deviceId` is not sensitive, because
`<account-id>` is an opaque 24-character lowercase hexadecimal key and not an email
address; the plugin can therefore store `deviceId` in accessory context and write it to
runtime logs; D-027 still applies to public artifacts, and committed fixtures, samples,
issue reports, and published documents must replace `deviceId` with a placeholder. Name
D-027 by its identifier. Deleting or weakening the public-artifact obligation is a defect,
not a simplification. Cite the 2026-08-29 decision date in this passage.

EDIT 5a, INTEL-05, the Gemini metadata table at lines 179-184. Add a lead-in sentence
above the table stating that these fields are in the `state` object of the device record.
Add a third column to the table with the header `Observed on 2026-08-29`. Fill it with
the single word `Yes` for `wifi_signal_dbm` and for `mcu_firmware_version`, and with the
exact two words `Not observed` for `wifi_firmware_version` and for `mcu_target_version`.
Keep all four rows and keep the existing `Field` and `Type` cells unchanged. Add the
separator-row cell.

Then add a note under the table carrying these facts: the measurement did not find
`wifi_firmware_version` or `mcu_target_version` in the REST `state` object or in the
embedded `shadow.state` object; one device with one firmware version was tested; the
absence on that device does not prove that the fields never appear.

EDIT 5b, INTEL-05, line 158 in section 5, the sentence about the shadow supplying
`mcu_target_version` and `wifi_firmware_version`. Keep the sentence. Add that the
2026-08-29 measurement contradicts it on the tested device, because the embedded
`shadow.state` object omitted both fields too, and that the sentence can still hold on
other firmware. Mark the claim as unconfirmed rather than removing it.

SCOPE, all edits. Touch `.planning/intel/constraints.md` and nothing else. Do not edit
`src/`, `test/`, `features/`, `.planning/intel/context.md`, or
`.planning/phases/02-safe-gemini-discovery-and-identity/02-CONTEXT.md`.

PRIVACY, all edits. Placeholders only. Never paste a real `accountId`, `deviceId`,
`serialNumber`, device `name`, or `location` value into this file, and never paste a real
value into the commit message. The measurement read structure, not values, so you have no
real values to paste. Keep it that way.

COMMIT. Run `pre-commit run --files .planning/intel/constraints.md` BEFORE `git commit`.
Fix every failure, restage, and run it again until it is clean. Never use `--no-verify`.
If you work inside a linked worktree, the trufflehog hook aborts for a structural reason
that CLAUDE.md documents, so run the filesystem scan that CLAUDE.md gives over the changed
path, confirm zero verified and zero unverified results, and only then prefix the commit
with `SKIP=trufflehog`. Do not extend `SKIP=` to any other hook. Commit with the
Conventional Commits title `docs(intel): correct vendor API record to measured shape` and
a body whose lines are 80 characters or shorter. Do not push.
  </action>
  <verify>
  <automated>

````bash
# G1 shape. The identity block key order, including the two nested keys. Expect exactly:
# accountId,deviceId,deviceTypeId,location,name,homeId,roomId,state,data,timestamp,shadow,attributes,connectivity,attributes.serialNumber,attributes.productLine
sed -n '/### Gemini identity/,/### Gemini metadata/p' .planning/intel/constraints.md | sed -n '/```text/,/```$/p' | grep -oE '^ *[A-Za-z][A-Za-z.]*' | tr -d ' ' | paste -sd, -

# G2 old top-level claim is gone. Expect 0.
grep -c 'only as the stable physical-accessory identifier' .planning/intel/constraints.md

# G3 REST envelopes present. Expect 1 and 1.
grep -cF '{ "devices": [ <device>, ... ] }' .planning/intel/constraints.md
grep -cF '{ "device": <device> }' .planning/intel/constraints.md

# G4 metadata table shape. Expect the four rows, in order:
# |`wifi_signal_dbm`|Number.|Yes|
# |`mcu_firmware_version`|String.|Yes|
# |`wifi_firmware_version`|String.|Notobserved|
# |`mcu_target_version`|String.|Notobserved|
sed -n '/### Gemini metadata/,/### Gemini telemetry/p' .planning/intel/constraints.md | grep -E '^ *\| `' | tr -d ' '

# G5 every corrected region cites the measurement date. Each of the five must be >= 1.
sed -n '/^    ## 4. REST API/,/^    ### Gemini commands/p' .planning/intel/constraints.md | grep -c '2026-08-29'
sed -n '/^    ### Gemini commands/,/^    ## 5. AWS IoT device shadow/p' .planning/intel/constraints.md | grep -c '2026-08-29'
sed -n '/^    ## 5. AWS IoT device shadow/,/^    ## 6. Device models/p' .planning/intel/constraints.md | grep -c '2026-08-29'
sed -n '/^    ### Gemini identity/,/^    ### Gemini metadata/p' .planning/intel/constraints.md | grep -c '2026-08-29'
sed -n '/^    ### Gemini metadata/,/^    ### Gemini telemetry/p' .planning/intel/constraints.md | grep -c '2026-08-29'

# G6 the D-027 public-artifact obligation survives in the identity region. Expect >= 1.
sed -n '/^    ### Gemini identity/,/^    ### Gemini metadata/p' .planning/intel/constraints.md | grep -c 'D-027'

# G7 the PUT response is marked unverified inside the Gemini commands region. Expect >= 1.
sed -n '/^    ### Gemini commands/,/^    ## 5. AWS IoT device shadow/p' .planning/intel/constraints.md | grep -icE 'unverified|not verified'

# G8 T-idd-01 no real identifier leaked. Expect 0 and 0.
grep -cE '[0-9a-f]{20,}' .planning/intel/constraints.md
grep -cE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' .planning/intel/constraints.md

# G9 scope. Expect empty output from each.
git diff --name-only HEAD -- src test features .planning/intel/context.md
git diff --name-only HEAD -- '.planning/phases/02-safe-gemini-discovery-and-identity'

# G10 hooks pass before the commit exists. Expect exit 0.
pre-commit run --files .planning/intel/constraints.md
````

  </automated>
  <human-check>
Read the rendered diff with `git show --stat HEAD` and `git diff HEAD~1 -- .planning/intel/constraints.md`.
Confirm three things by eye, because no gate can judge prose: the four-space indent is
intact on every changed line and both tables still render; the new sentences read like the
rest of the file, with no em dashes and no sentence over 25 words; every absence is stated
as absent on the tested device, never as absent from the API.
  </human-check>
  </verify>
  <done>
`.planning/intel/constraints.md` records the measured REST envelopes for all four routes,
marks the PUT success body unverified, shows the 13 measured top-level Gemini keys in
returned order with `serialNumber` and `productLine` under `attributes`, states that
`deviceId` is non-sensitive for accessory context and runtime logs while D-027 keeps
placeholders in public artifacts, places the metadata fields in the `state` object and
marks two of them not observed on the tested device, and records the shadow contradiction
without deleting the claim. G1 through G10 pass. The phrase "only as the stable
physical-accessory identifier" no longer appears in the file. One commit exists,
`pre-commit` passed before it, and nothing outside `.planning/intel/constraints.md`
changed.
  </done>
</task>

<task type="auto">
  <name>Task 2: Record the context.md StatusFault conflict as an open finding</name>
  <files>.planning/quick/260829-idd-correct-vendor-api-intel-to-the-measured/260829-idd-SUMMARY.md</files>
  <action>
Write the SUMMARY from the template in `<execution_context>`, and give it a section named
`## Open finding: conflicting degraded-state guidance` that the user can act on without
opening any other file. INTEL-06.

State the conflict with all three positions named, so the user can rule on it directly:

- `.planning/intel/context.md` line 1459 says that when a published device's payload stops
  validating, the plugin keeps the accessory, sets `StatusFault` on every service, keeps
  last-known values, and logs once.
- The Phase 2 decision recorded on 2026-08-29 in
  `.planning/phases/02-safe-gemini-discovery-and-identity/02-CONTEXT.md` lines 103-104 sets
  `StatusActive` to false on the affected services and leaves `StatusFault` at `NO_FAULT`.
  It reserves `StatusFault` for the five vendor-reported SAFE-04 conditions.
- D-014 requires the plugin to mark only the narrowest truthful scope faulty, which forbids
  faulting every service.

Say plainly that the intel line is the outlier: two current decisions agree against it.
Do not rule on it yourself. The user rules on it. Name the decision the user has to make:
whether to correct `context.md` line 1459, or to reopen the Phase 2 decision.

DO NOT EDIT `.planning/intel/context.md` in this task. It is out of scope on purpose,
because changing it would silently resolve a conflict that the user has not ruled on. Do
not edit `02-CONTEXT.md` either.
  </action>
  <verify>
  <automated>

````bash
# G11 context.md and 02-CONTEXT.md are untouched by this task. Expect empty output.
git status --porcelain .planning/intel/context.md
git status --porcelain '.planning/phases/02-safe-gemini-discovery-and-identity/02-CONTEXT.md'

# G12 the finding is in the SUMMARY and names all three positions. Expect >= 1 each.
grep -c 'Open finding' .planning/quick/260829-idd-correct-vendor-api-intel-to-the-measured/260829-idd-SUMMARY.md
grep -c 'context.md' .planning/quick/260829-idd-correct-vendor-api-intel-to-the-measured/260829-idd-SUMMARY.md
grep -c 'StatusFault' .planning/quick/260829-idd-correct-vendor-api-intel-to-the-measured/260829-idd-SUMMARY.md
grep -c 'D-014' .planning/quick/260829-idd-correct-vendor-api-intel-to-the-measured/260829-idd-SUMMARY.md
grep -c '02-CONTEXT.md' .planning/quick/260829-idd-correct-vendor-api-intel-to-the-measured/260829-idd-SUMMARY.md
````

  </automated>
  <human-check>
Read the finding section. It must let the user decide without opening `context.md` or
`02-CONTEXT.md`, and it must not state a resolution.
  </human-check>
  </verify>
  <done>
The SUMMARY carries an open finding that names the `context.md` line 1459 guidance, the
2026-08-29 Phase 2 decision, and D-014, and asks the user to rule. `context.md` and
`02-CONTEXT.md` are unmodified in git status. G11 and G12 pass.
  </done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary | Description |
| --- | --- |
| live vendor response -> committed intel document | Structure measured from a real account with real identifiers crosses into a repository file. |
| intel document -> public artifacts | The document feeds fixtures, samples, issue reports, and published docs, which D-027 governs. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
| --- | --- | --- | --- | --- | --- |
| T-idd-01 | Information Disclosure | New text in `.planning/intel/constraints.md` | high | mitigate | Placeholders only, stated in the Task 1 action. Gate G8 rejects any run of 20 or more lowercase hexadecimal characters and any email-shaped token. `pre-commit` runs `detect-private-key` and trufflehog, with the CLAUDE.md filesystem-scan route when the executor is in a worktree. |
| T-idd-02 | Tampering | The D-027 public-artifact rule in the privacy passage | medium | mitigate | The INTEL-04 rewrite loosens `deviceId` handling only for accessory context and runtime logs. Gate G6 requires `D-027` to survive in the identity region, so the obligation cannot be dropped by accident. |
| T-idd-03 | Repudiation | The unmeasured `{ "success": true }` command response | medium | mitigate | Mark it not verified with its reason and date. Gate G7 requires the marking. This stops a later phase from treating an assumption as evidence, which is the exact failure this task repairs. |
| T-idd-04 | Tampering | Out-of-scope files: `context.md`, `02-CONTEXT.md`, `src/`, `test/`, `features/` | medium | mitigate | Scope stated in both task actions. Gates G9 and G11 fail the task if any of those paths changed. |

No package-manager install runs in this task, so no supply-chain threat row applies and no
package legitimacy checkpoint is needed.
</threat_model>

<verification>
Verification for a prose change is a read of the rendered diff plus a clean
`pre-commit run --files .planning/intel/constraints.md`. There is no test suite for a
document, and inventing one would be theater. The automated gates G1 through G12 check
structure and scope. The `human-check` blocks check what only a reader can judge: voice,
indent, and whether an absence is framed as device-specific.

Phase-level checks:

1. G1 through G10 pass on the committed `constraints.md`.
2. G11 and G12 pass on the SUMMARY.
3. The diff touches exactly one source-of-truth file, `.planning/intel/constraints.md`.
4. Every measured claim in the file names 2026-08-29 as its date.
5. No sentence generalizes a one-device sample into a statement about the vendor API.
</verification>

<success_criteria>

- All five corrections are in `.planning/intel/constraints.md` and committed with a
  Conventional Commits message. Nothing is pushed.
- The REST routes table gives an envelope for every route, and the plural and singular
  keys are documented as deliberately different.
- The unmeasured PUT response is marked unverified, with the sump-pump reason on the
  record.
- The Gemini identity block matches the measured wire shape exactly, in returned order.
- The privacy rule distinguishes runtime use from public artifacts, and D-027 survives.
- Both not-observed metadata fields are kept and marked, never deleted.
- The shadow contradiction is recorded, and the original sentence is kept.
- The `StatusFault` conflict reaches the user through the SUMMARY, and `context.md` is
  unchanged.
- `simple-english` and `humanizer` were both applied to the new prose.
</success_criteria>

<output>
Create `.planning/quick/260829-idd-correct-vendor-api-intel-to-the-measured/260829-idd-SUMMARY.md` when done.
</output>
