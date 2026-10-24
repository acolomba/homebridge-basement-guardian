---
phase: quick-261016-wbo
plan: "01"
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/phases/05-accessories-conformance/05-01-PLAN.md
  - .planning/phases/05-accessories-conformance/05-02-PLAN.md
  - .planning/phases/05-accessories-conformance/05-03-PLAN.md
  - .planning/phases/05-accessories-conformance/05-04-PLAN.md
  - .planning/phases/05-accessories-conformance/05-05-PLAN.md
  - .planning/phases/05-accessories-conformance/05-06-PLAN.md
  - .planning/phases/05-accessories-conformance/05-07-PLAN.md
  - .planning/phases/05-accessories-conformance/05-08-PLAN.md
  - .planning/phases/05-accessories-conformance/05-09-PLAN.md
  - .planning/phases/05-accessories-conformance/05-CONTEXT.md
  - .planning/phases/05-accessories-conformance/05-PATTERNS.md
  - .planning/phases/05-accessories-conformance/05-RESEARCH.md
  - .planning/phases/05-accessories-conformance/05-VALIDATION.md
autonomous: true
requirements: []
estimate:
  tokens: 100000
  raw_tokens: 100000
  tasks: 3
  confidence: low
must_haves:
  truths:
    - "No line in the 13 Phase 5 planning files names a removed rulebook path or a moved Cucumber path: the orchestrator's grep and the extended stale-token grep, run over exactly those 13 files, print nothing. 05-DISCUSSION-LOG.md is an audit trail, is excluded, and stays unchanged."
    - "Every .agents/skills/ and features/{lib,step_definitions,support}/ path the 13 files name exists in the tree; a .js import specifier is checked against its .ts source."
    - "Plans 05-01 to 05-08 each have exactly three skill lines in their context block (typescript-style, typescript-unit-tests, local-verification), 05-09 has only local-verification, and 05-CONTEXT.md lists the same three rulebooks once each."
    - "05-01-PLAN.md names .agents/skills/typescript-unit-tests/rules/cases.md identically in its key_link to and pattern, in the Scope-and-authority action and in the first 05-01-02 acceptance literal, and its reviewer and fixer contracts require each new SKILL.md with every file in its rules/ directory, so Phase 5 D-02 (complete rulebooks) still reaches reviewers and fixers."
    - "Every line that names the deleted .claude/rules/typescript-unit-testing.md, or calls it the .claude unit-testing copy, says deleted in f68df73, except the literal in 05-01's acceptance criterion; the 05-01-02 read_first entry reads the file with git show f68df73^:."
    - "Only the mapped references changed: per-file counts of D-NN tokens, task, acceptance-criteria, verify and automated elements, and ## and ### headings match ea0a71e; every removed diff line carried a stale token; and each file's SHA-256 equals the dry-run value in this plan."
    - "One commit on features/code-review-sweep, titled docs: point accessories planning at the new skills and step files, contains exactly the 13 files and no file outside .planning/**/*.md."
  artifacts:
    - path: ".planning/phases/05-accessories-conformance/05-01-PLAN.md"
      provides: "Wave 0 plan whose review protocol, dispatch contracts and ledger rule citations name the new rulebook files"
      contains: 'pattern: ".agents/skills/typescript-unit-tests/rules/cases.md"'
    - path: ".planning/phases/05-accessories-conformance/05-02-PLAN.md"
      provides: "DECLARATIONS batch plan on the new skills and step files"
      contains: "@.agents/skills/typescript-unit-tests/SKILL.md"
    - path: ".planning/phases/05-accessories-conformance/05-03-PLAN.md"
      provides: "CATALOGUE batch plan on the new skills and harness files"
      contains: "features/step_definitions/homekit.steps.ts"
    - path: ".planning/phases/05-accessories-conformance/05-04-PLAN.md"
      provides: "CONTROLS batch plan on the new skills and stand-in path"
      contains: "features/lib/hap.ts (lines 280-340"
    - path: ".planning/phases/05-accessories-conformance/05-05-PLAN.md"
      provides: "RECORDS batch plan on the new skills"
      contains: "@.agents/skills/typescript-style/SKILL.md"
    - path: ".planning/phases/05-accessories-conformance/05-06-PLAN.md"
      provides: "ACCESSORY round-0 plan on the new skills"
      contains: "@.agents/skills/local-verification/SKILL.md"
    - path: ".planning/phases/05-accessories-conformance/05-07-PLAN.md"
      provides: "ACCESSORY correction plan on the new skills and harness files"
      contains: "features/lib/homebridgeApi.ts"
    - path: ".planning/phases/05-accessories-conformance/05-08-PLAN.md"
      provides: "GATES batch plan on the moved HAP stand-in"
      contains: "header to features/lib/hap.ts in its own"
    - path: ".planning/phases/05-accessories-conformance/05-09-PLAN.md"
      provides: "Closeout plan on the new local-verification skill"
      contains: "@.agents/skills/local-verification/SKILL.md"
    - path: ".planning/phases/05-accessories-conformance/05-CONTEXT.md"
      provides: "Decisions and canonical rulebook list"
      contains: "- `.agents/skills/typescript-unit-tests/SKILL.md`"
    - path: ".planning/phases/05-accessories-conformance/05-PATTERNS.md"
      provides: "Pattern map citing the rule file that holds the act-and-assert rule"
      contains: "`.agents/skills/typescript-unit-tests/rules/cases.md:15`"
    - path: ".planning/phases/05-accessories-conformance/05-RESEARCH.md"
      provides: "Research record with current paths"
      contains: "Read `typescript-style` for every `.ts` file"
    - path: ".planning/phases/05-accessories-conformance/05-VALIDATION.md"
      provides: "Validation contract with current paths"
      contains: "(`.agents/skills/` over `.claude/rules/`)"
  key_links:
    - from: ".planning/phases/05-accessories-conformance/05-01-PLAN.md"
      to: ".agents/skills/typescript-unit-tests/rules/cases.md"
      via: "key_link, Scope-and-authority action and first acceptance literal share one path for the act-and-assert rule; cases.md:15 carries the removed skill's line-42 text unchanged"
      pattern: "typescript-unit-tests/rules/cases.md"
    - from: ".planning/phases/05-accessories-conformance/05-08-PLAN.md"
      to: "features/lib/hap.ts"
      via: "files_modified, task files, key_link and the stand-in-defect branch name the moved stand-in; content is identical, so line citations stay valid"
      pattern: "features/lib/hap.ts"
    - from: ".planning/phases/05-accessories-conformance/05-03-PLAN.md"
      to: "features/step_definitions/homekit.steps.ts"
      via: "serviceCatalogue consumer list names the renamed step file"
      pattern: "features/step_definitions/homekit.steps.ts"
    - from: ".planning/phases/05-accessories-conformance/05-CONTEXT.md"
      to: ".agents/skills/typescript-style/SKILL.md"
      via: "The Rulebooks list that every Phase 5 plan inherits names each new skill once"
      pattern: ".agents/skills/typescript-style/SKILL.md"
---

<objective>
Point the Phase 5 (accessories conformance) planning records at the paths that exist after
commits f68df73 (TypeScript blueprint update: rulebooks became registered skills under
`.agents/skills/`) and ea0a71e (Cucumber layout: step files and stand-ins moved). Change only
paths, skill names, the count of books that collapse, one renamed section name, and the words
that mark a deleted file as deleted. Change no plan scope, task, decision, verify command or
acceptance criterion beyond the literal paths they carry.

Purpose: plans 05-01 to 05-09 are prompts. Each stale path makes a read_first fail, loads an
empty context line, or sends a reviewer to a rulebook that no longer exists. Phase 5 is ready to
execute, so the records must resolve before it starts.

Output: 13 edited files under `.planning/phases/05-accessories-conformance/`, committed once on
`features/code-review-sweep`.
</objective>

<execution_context>
@.claude/gsd-core/workflows/execute-plan.md
@.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.agents/skills/typescript-style/SKILL.md
@.agents/skills/typescript-unit-tests/SKILL.md
@.agents/skills/local-verification/SKILL.md
@.agents/skills/cucumber/SKILL.md
@.agents/skills/committing/SKILL.md
</context>

## Execution notes

- Work from the repository root on `features/code-review-sweep`, in the existing checkout. Create
  no branch and no worktree.
- Tasks 1 and 2 make no commit. Task 3 makes the plan's single commit. This overrides any
  per-task commit default of the execute workflow.
- Never commit through `gsd-tools query commit`. STATE.md (Blockers/Concerns) records that it
  returns success for an empty commit in this repository. Use `git add <paths>` and a plain
  foreground `git commit`.
- Do not read the 13 files whole. Locate each site with `grep -n`, view a small window with
  `sed -n`, and edit in place. Line numbers in this plan are at ea0a71e. S1 removes two lines
  from each of 05-01 to 05-08, so later line numbers in those files shift. Match by text.
- Keep every line break. A line may grow longer. Never reflow a paragraph. mdformat and
  markdownlint exclude `.planning/`, so no hook reflows these files.
- The checks are unfiltered on purpose. In these files every occurrence of a stale token is a
  reference, so no comment exception applies.
- The `typescript-unit-tests` SKILL.md index and its `rules/review.md` name a singular
  `typescript-unit-test/` directory that does not exist. Never copy a path from those lines. The
  real directory is `.agents/skills/typescript-unit-tests/`.

## Path facts (verified at ea0a71e)

| Removed in f68df73 | Content now in |
|---|---|
| skills/typescript-google-style-review/SKILL.md | .agents/skills/typescript-style/SKILL.md and its rules/ (modules-and-data, classes, functions, types, naming-and-docs, review) |
| skills/typescript-comments/SKILL.md | .agents/skills/typescript-style/rules/comments.md (renamed, 73% similar) |
| skills/typescript-unit-testing/SKILL.md | .agents/skills/typescript-unit-tests/SKILL.md and its rules/ (pairing-and-design, tools, cases, test-doubles, boundaries) |
| skills/typescript-unit-testing-review/SKILL.md | .agents/skills/typescript-unit-tests/rules/review.md |
| skills/local-verification/SKILL.md | .agents/skills/local-verification/SKILL.md and its rules/ (commands, gates) |
| skills/cucumber-behavioral-testing/SKILL.md | .agents/skills/cucumber/SKILL.md and its rules/ (layout, features, steps, world-and-stand-ins) |
| .claude/rules/typescript-unit-testing.md | no successor: the divergent copy that also allowed the combined marker for a data row |
| features/CLAUDE.md | no successor: the commit message says the cucumber skill now covers it |

- Rule locations: the act-and-assert rule at `.agents/skills/typescript-unit-tests/rules/cases.md:15`
  has the same text as the removed `skills/typescript-unit-testing/SKILL.md:42`. Whole-value
  comparison is in cases.md "Assertions" (line 67). "Data-driven cases" is at cases.md line 93.
  The old "Types and hermeticity" section is now cases.md "Types and isolation" (line 115). The
  narration rule is at `.agents/skills/typescript-style/rules/comments.md` lines 23-25.
- Still tracked under `.claude/rules/`: `typescript-comments.md` and `typescript-style-guide.md`.
  The authority statements over `.claude/rules/*.md` therefore stay meaningful.
- ea0a71e moves (git similarity 93-100%): `features/support/fakeHap.ts` to `features/lib/hap.ts`
  (identical content, still 722 lines and 14 importers; cited lines 280-340, 286, 303-307 and
  309-334 are unchanged); `features/support/fakeHomebridgeApi.ts` to
  `features/lib/homebridgeApi.ts` (`FakeAccessory` still at lines 32-42);
  `features/support/publishedServices.ts` to `features/lib/publishedServices.ts`;
  `features/support/steps/configuration.ts` to `features/step_definitions/configuration.steps.ts`;
  `features/support/steps/homekit.ts` to `features/step_definitions/homekit.steps.ts`.
  `features/support/world.ts` did not move. The `src/accessories` consumers under `features/`
  are the same files at the new paths.
- `.planning/config.json` `agent_skills` no longer lists the gsd-code-reviewer, gsd-code-fixer or
  gsd-executor roles. 05-01-02's dispatch prompts therefore carry no injected skill block for
  those roles, and the Required-reading lists that S3 and S4 rewrite are what deliver the
  rulebooks.

## Mapping

Order: in each file, apply its S rows first. Their Old text is the text at ea0a71e. Then apply
its M rows. Apply a row only to the files the Site index lists for the current task. A dry run
of exactly this mapping on copies of the ea0a71e files passed every check in this plan and
produced the hashes under Expected results.

Format of the one-line rows: the text after `OLD: ` or `NEW: ` up to the end of the line is the
exact string. A line without that prefix is a label.

### S rows: site edits (exact replacements, use the Edit tool)

**S1. Context block, 05-01 to 05-08.** In each of the eight plans, replace these four
consecutive lines:

```text
@skills/typescript-google-style-review/SKILL.md
@skills/typescript-comments/SKILL.md
@skills/typescript-unit-testing/SKILL.md
@skills/typescript-unit-testing-review/SKILL.md
```

with these two lines:

```text
@.agents/skills/typescript-style/SKILL.md
@.agents/skills/typescript-unit-tests/SKILL.md
```

The next line, the local-verification skill, becomes `@.agents/skills/local-verification/SKILL.md`
through M7, so each block ends as three lines. 05-09 has only the local-verification line, which
M7 handles.

**S2. 05-CONTEXT.md, `### Rulebooks`.** Replace these four bullets:

```text
- `skills/typescript-google-style-review/SKILL.md`
- `skills/typescript-comments/SKILL.md`
- `skills/typescript-unit-testing/SKILL.md`
- `skills/typescript-unit-testing-review/SKILL.md`
```

with these two:

```text
- `.agents/skills/typescript-style/SKILL.md`
- `.agents/skills/typescript-unit-tests/SKILL.md`
```

The fifth bullet becomes the local-verification path through M7.

**S3. 05-01-PLAN.md, task 05-01-02, `## Reviewer dispatch contract` (lines 387-389).** Replace
this span, which starts after "Required reading: AGENTS.md; " and ends before " 05-CONTEXT.md;
this protocol;":

```text
the five books
(skills/typescript-google-style-review, typescript-comments, typescript-unit-testing,
typescript-unit-testing-review, local-verification, each SKILL.md);
```

with:

```text
the three books
(.agents/skills/typescript-style, typescript-unit-tests and local-verification, each SKILL.md
with every file in its rules/ directory);
```

Why: Phase 5 D-02 says full-file reviewers and cause fixers use the complete rulebooks. Each new
SKILL.md is only an index into its rules/ directory.

**S4. 05-01-PLAN.md, `## Fixer dispatch contract` (lines 419-420).** Replace this span, which
starts after "sections, every file it edits, " and ends before " Overrides of the":

```text
plus features/CLAUDE.md and
skills/cucumber-behavioral-testing/SKILL.md for any path under `features/`.
```

with:

```text
plus .agents/skills/cucumber/SKILL.md with every file in its
rules/ directory for any path under `features/`.
```

Why: f68df73 deleted the features notes file, and the cucumber skill now covers it. D-02 applies
as in S3.

**S5. 05-RESEARCH.md, Project Constraints (line 145).** Replace the whole line:

```text
- TypeScript rules are under `skills/`. Read `typescript-google-style-review` and `typescript-comments` for every `.ts` file. Read `typescript-unit-testing` (write) and `typescript-unit-testing-review` (check) for `test/**/*.ts`. Preserve `.js` imports and the compiled test layout.
```

with:

```text
- TypeScript rules are under `.agents/skills/`. Read `typescript-style` for every `.ts` file. Read `typescript-unit-tests` (write and check) for `test/**/*.ts`. Preserve `.js` imports and the compiled test layout.
```

**S6. 05-RESEARCH.md, `## Sources` (line 665).** Replace the whole line:

```text
- All five `skills/*/SKILL.md` rulebooks. `.claude/rules/typescript-unit-testing.md` (for the divergence).
```

with the line below. "five" stays because it records what the research read.

```text
- All five rulebooks (now under `.agents/skills/`). `.claude/rules/typescript-unit-testing.md` (for the divergence; deleted in `f68df73`).
```

**S7 to S14. One-line substring replacements.**

```text
S7, 05-01-PLAN.md, the act-and-assert authority: four sites, one path
line 44, key_link to
OLD: to: "skills/typescript-unit-testing/SKILL.md"
NEW: to: ".agents/skills/typescript-unit-tests/rules/cases.md"
line 46, key_link pattern
OLD: pattern: "skills/typescript-unit-testing/SKILL.md"
NEW: pattern: ".agents/skills/typescript-unit-tests/rules/cases.md"
line 359, Scope and authority
OLD: `skills/typescript-unit-testing/SKILL.md` allows it only for
NEW: `.agents/skills/typescript-unit-tests/rules/cases.md` allows it only for
line 628, first 05-01-02 acceptance criterion
OLD: literal strings `skills/typescript-unit-testing/SKILL.md`
NEW: literal strings `.agents/skills/typescript-unit-tests/rules/cases.md`

S8, 05-RESEARCH.md line 488
OLD: // Pattern: skills/typescript-unit-testing/SKILL.md "Data-driven cases"
NEW: // Pattern: .agents/skills/typescript-unit-tests/rules/cases.md "Data-driven cases"

S9, 05-01-PLAN.md line 195, seed (a) rule (the next line keeps "Assertions,")
OLD: rule skills/typescript-unit-testing/SKILL.md
NEW: rule .agents/skills/typescript-unit-tests/rules/cases.md

S10, comment-rule citations
05-01-PLAN.md line 213, seed (g)
OLD: and skills/typescript-comments/SKILL.md,
NEW: and .agents/skills/typescript-style/rules/comments.md,
05-07-PLAN.md line 245
OLD: (skills/typescript-comments/SKILL.md)
NEW: (.agents/skills/typescript-style/rules/comments.md)

S11, the deleted copy: add "deleted in f68df73" on the same line, no other word changes
05-PATTERNS.md line 9
OLD: `.claude/rules/typescript-unit-testing.md` and the
NEW: `.claude/rules/typescript-unit-testing.md` (deleted in `f68df73`) and the
05-PATTERNS.md line 11
OLD: unit-testing copy also allows
NEW: unit-testing copy (deleted in `f68df73`) also allows
05-PATTERNS.md line 72
OLD: `.claude/rules/typescript-unit-testing.md` for `// act & assert`
NEW: `.claude/rules/typescript-unit-testing.md` (deleted in `f68df73`) for `// act & assert`
05-CONTEXT.md line 161
OLD: copy also allows
NEW: copy (deleted in `f68df73`) also allows
05-RESEARCH.md line 272
OLD: (last changed in `04ab77d`)
NEW: (last changed in `04ab77d`; deleted in `f68df73`)
05-RESEARCH.md line 427
OLD: ("a data row" may use the combined marker)
NEW: (deleted in `f68df73`; "a data row" may use the combined marker)
05-01-PLAN.md line 45, YAML string, no backticks
OLD: typescript-unit-testing.md for the act-and-assert marker
NEW: typescript-unit-testing.md (deleted in f68df73) for the act-and-assert marker
05-01-PLAN.md line 358
OLD: (the `.claude` unit-testing copy allows
NEW: (the `.claude` unit-testing copy, deleted in `f68df73`, allows

S12, 05-01-PLAN.md line 337, task 05-01-02 read_first entry (keep its four-space indent)
OLD: .claude/rules/typescript-unit-testing.md (the divergent tracked copy; read only, never edit)
NEW: git show f68df73^:.claude/rules/typescript-unit-testing.md (the divergent copy, deleted in f68df73; read only)

S13, the stand-in named by bare file name
05-PATTERNS.md line 340
OLD: Do not edit `fakeHap.ts` unless
NEW: Do not edit `features/lib/hap.ts` unless
05-08-PLAN.md line 322
OLD: header to fakeHap.ts in its own
NEW: header to features/lib/hap.ts in its own

S14, 05-RESEARCH.md line 120, evidence tag (re-measured at ea0a71e: 14 files, so "= 14 files" stays true)
OLD: grep -rln "fakeHap.js" src test features
NEW: grep -rln "hap.js" src test features
```

### M rows: literal, global, in-place substitutions (a scripted pass)

```text
M1  OLD: features/support/fakeHap.ts
M1  NEW: features/lib/hap.ts
M2  OLD: features/support/fakeHap.js
M2  NEW: features/lib/hap.js
M3  OLD: features/support/fakeHomebridgeApi.ts
M3  NEW: features/lib/homebridgeApi.ts
M4  OLD: features/support/publishedServices.ts
M4  NEW: features/lib/publishedServices.ts
M5  OLD: features/support/steps/configuration.ts
M5  NEW: features/step_definitions/configuration.steps.ts
M6  OLD: features/support/steps/homekit.ts
M6  NEW: features/step_definitions/homekit.steps.ts
M7  OLD: skills/local-verification/SKILL.md
M7  NEW: .agents/skills/local-verification/SKILL.md
M8  OLD: skills/*/SKILL.md
M8  NEW: .agents/skills/*/SKILL.md
M9  OLD: `skills/`
M9  NEW: `.agents/skills/`
M10 OLD: (skills/ over
M10 NEW: (.agents/skills/ over
M11 OLD: skills/typescript-unit-testing/SKILL.md:42
M11 NEW: .agents/skills/typescript-unit-tests/rules/cases.md:15
M12 OLD: the five books
M12 NEW: the three books
M13 OLD: Types and hermeticity
M13 NEW: Types and isolation
```

Guard for M7, M8 and M11: replace only where the character before `skills/` is not `/`, a letter,
a digit, `_`, `.` or `-`. In Perl terms this is the lookbehind `(?<![/\w.-])`. The guard keeps
`@` lines and backticked paths in scope and never prefixes a path twice. In M8 the `*` is a
literal character. M9 includes its two backticks. M12 collapses five old books into three skills.
M13 follows the section rename in cases.md.

### Leave unchanged

- L1. 05-DISCUSSION-LOG.md. It is an audit trail marked "Do not use as input to planning,
  research, or execution agents". Its two old stand-in paths at lines 37 and 84 stay.
- L2. `features/support/world.ts` everywhere (it did not move).
- L3. 05-08-PLAN.md commit scopes `style(fakeHap)` and `fix(fakeHap)`, and the `fakeHap`
  alternative in its commit-title regex (lines 323, 328 and 357). They are commit scopes, not
  paths.
- L4. The `.claude/rules/*.md`, `.claude/rules/*` and `.claude/rules/` globs. Two tracked copies
  remain there.
- L5. Generic phrases ("unit-testing rules", "style, comment and unit-testing rulebooks", "each
  book's Classifying findings section"), the "(AGENTS.md)" authority citations, and every number
  except M12's: token estimates, "722 lines", "14 importers", "about 75K".
- L6. Line-number citations into `features/lib/hap.ts` and `features/lib/homebridgeApi.ts`. The
  content at those lines is unchanged.
- L7. Decision IDs and wording, tasks, verify commands and acceptance criteria, apart from the
  literal paths that the S and M rows change and the annotations that S11 adds. Leave the deleted
  copy's backticked literal in the first 05-01-02 acceptance criterion (line 628) as it is.
- L8. Line breaks, as stated in the execution notes.

## Site index (lines at ea0a71e)

Numstat is the expected `git diff --numstat` (added, removed) for the file after its task.

| File | Task | S rows (lines) | M rows (lines) | Numstat |
|---|---|---|---|---|
| 05-PATTERNS.md | 1 | S11 9, 11, 72; S13 340 | M1 338; M2 201; M8 10; M9 12, 71; M11 343 | 10, 10 |
| 05-VALIDATION.md | 1 | none | M7 39; M9 65 | 2, 2 |
| 05-07-PLAN.md | 1 | S1 84-87; S10 245 | M3 51, 165; M7 88; M8 102; M12 142 | 8, 10 |
| 05-CONTEXT.md | 2 | S2 155-158; S11 161 | M1 84, 171, 207; M7 159; M9 160, 162, 163 | 10, 12 |
| 05-RESEARCH.md | 2 | S5 145; S6 665; S8 488; S11 272, 427; S14 120 | M1 75, 110, 120, 242, 264, 667; M4 369; M5 366; M6 369; M7 146; M8 428; M9 272 (twice); M10 626; M11 272; M13 228 | 17, 17 |
| 05-01-PLAN.md | 2 | S1 77-80; S3 387-389; S4 419-420; S7 44, 46, 359, 628; S9 195; S10 213; S11 45, 358; S12 337 | M1 101, 390, 478, 502, 581; M7 81, 605, 643; M8 25, 357; M9 358, 361; M12 116, 418; M13 210 | 30, 32 |
| 05-02-PLAN.md | 2 | S1 99-102 | M5 148; M7 103; M8 117, 209; M12 138, 164 | 8, 10 |
| 05-09-PLAN.md | 2 | none | M7 76, 178 | 2, 2 |
| 05-03-PLAN.md | 3 | S1 87-90 | M1 196; M4 56, 135; M6 135; M7 91; M8 105, 197; M12 122, 151 | 10, 12 |
| 05-04-PLAN.md | 3 | S1 91-94 | M1 216, 273; M7 95; M8 109, 219; M12 143, 167 | 9, 11 |
| 05-05-PLAN.md | 3 | S1 97-100 | M1 214; M7 101; M8 115, 215; M12 135, 167 | 8, 10 |
| 05-06-PLAN.md | 3 | S1 74-77 | M1 168; M7 78; M8 92, 168; M12 116 | 6, 8 |
| 05-08-PLAN.md | 3 | S1 94-97; S13 322 | M1 12, 41, 56, 144, 155, 171, 229, 276, 285, 321, 360, 369, 447, 471; M7 98; M8 111, 230; M12 178 | 21, 23 |

## Expected results (SHA-256 after each file's task, from the dry run)

```text
004b9bab7ea5cda7f56b23e961cabcdbfb251f25b68350f7b10f0985c20dec08  .planning/phases/05-accessories-conformance/05-01-PLAN.md
d5fa197f1d0a2aaf1ea19817b4537740e0ae2a4dbeffb2458d8b839c0f5702b0  .planning/phases/05-accessories-conformance/05-02-PLAN.md
a0c9caaed2a4ada7a293a7dfae42975baa0cec44a0379c5a439248a94a931ce1  .planning/phases/05-accessories-conformance/05-03-PLAN.md
aba33f36852c44a978f4ee359b17856b317a2ef3673b79129bd45a31e9938d55  .planning/phases/05-accessories-conformance/05-04-PLAN.md
12443b60a051ccc588212e0504badb2f7a1eaa162fcc3a71b3edc5ff8264ba98  .planning/phases/05-accessories-conformance/05-05-PLAN.md
c9a1d1b0b3c059753f8018c5701d98ff26dde0db17c22b2557f7c88704b8a472  .planning/phases/05-accessories-conformance/05-06-PLAN.md
a95f6e28d6d4d45300a57705c23cdc7fc3aabf28d1f04d2286f2939f6ccaeca5  .planning/phases/05-accessories-conformance/05-07-PLAN.md
9661903222a62e2e1cc38016914ca9ba6cea83161def2de46135bfd16c968494  .planning/phases/05-accessories-conformance/05-08-PLAN.md
6dd328183dca6489a4dba518ee740c0f6468e403a2f88fc9b6f942ae2c9dbe99  .planning/phases/05-accessories-conformance/05-09-PLAN.md
036f283aa3a0cc99dcecb040952611e9c9426f7a791bdddb53fd10cc8943587f  .planning/phases/05-accessories-conformance/05-CONTEXT.md
d9aa847d77878db3f15a7117564eac78605b7bca976667aabd0be9bcebef5218  .planning/phases/05-accessories-conformance/05-PATTERNS.md
b3f974082d9810bcf55909f6715090a84fba9c614f8a9225300220f2847857e1  .planning/phases/05-accessories-conformance/05-RESEARCH.md
87141b2c2f732c3a252dbf02ddeaf7086b43c8afa45a032e0f048d6cc2234d14  .planning/phases/05-accessories-conformance/05-VALIDATION.md
```

A hash mismatch means an edit differs from the Mapping. Compare the file's numstat with the Site
index, re-read the rows for that file, and fix the edit. Never change an expected value. If the
Mapping itself is wrong, stop and report it instead.

## Checks used in every task

- Stale: the orchestrator's grep, then an extended grep for the removed skills directory (in any
  position not under `.agents/` or `.claude/`), the bare stand-in file names, the deleted notes
  file, old skill names, the old section name and the old book count, then any line that names
  the deleted copy without "deleted in". The only exception is 05-01's acceptance literal.
- Paths: every `.agents/skills/` and `features/{lib,step_definitions,support}/` token exists.
- Structure: per-file element and decision-token counts match ea0a71e (the precondition makes it
  the pre-edit state, which pins the base instead of a relative HEAD anchor), the diff against it
  is not empty, and every removed diff line carried a stale token.
- Lists: the skill lines in each context block, and in 05-CONTEXT.md, are exactly the expected
  lines in the expected order.
- Coupling: the 05-01 strings that must agree are present.
- Hash: the Expected results.

<tasks>

<task type="tracer">
  <name>Task 1: Tracer: retarget 05-PATTERNS.md, 05-VALIDATION.md and plan 05-07 and prove the full check set on them</name>
  <files>.planning/phases/05-accessories-conformance/05-PATTERNS.md, .planning/phases/05-accessories-conformance/05-VALIDATION.md, .planning/phases/05-accessories-conformance/05-07-PLAN.md</files>
  <precondition>`git branch --show-current` prints features/code-review-sweep, `git merge-base --is-ancestor ea0a71e HEAD` exits 0, and `git diff --quiet ea0a71e -- .planning/phases/05-accessories-conformance` exits 0 (the inputs are byte-identical to ea0a71e, which the expected hashes assume); otherwise stop and report.</precondition>
  <read_first>
    This plan's Path facts, Mapping, Site index and Expected results sections
    .agents/skills/typescript-unit-tests/rules/cases.md (lines 7-16, 64-70, 93-95 and 115-119; confirms the S7, S9 and M13 targets)
    .agents/skills/typescript-style/rules/comments.md (lines 20-26; confirms the S10 target)
    The Site index lines of the three files, viewed with sed -n
  </read_first>
  <action>
This slice touches every kind of reference the plan changes: the collapse of a context block,
book counts, a rule citation with a translated line number, the comment-rule citation, authority
statements over the rulebook directory, annotations for the deleted copy, moved stand-in paths, an
import specifier, a bare stand-in file name and the local-verification path.

Start red. Before any edit, run this task's first two verify commands and confirm that they print
stale lines and MISSING paths for the three files. This shows that the checks can fail.

Edit only 05-PATTERNS.md, 05-VALIDATION.md and 05-07-PLAN.md. First apply their S rows from the
Site index as exact Old-to-New replacements with the Edit tool: S1 and S10 in 05-07-PLAN.md, and
S11 (three sites) and S13 in 05-PATTERNS.md. Then apply their M rows (M1, M2, M3, M7, M8, M9, M11,
M12) as literal, global, in-place substitutions with the guard for M7, M8 and M11. Use a scripted
pass, for example `perl -pi -e` with `\Q...\E` quoting. Change no other character, keep every line
break, and do not reflow.

Run the verify commands. If a check fails, fix the edit (see Expected results). Make no commit.
  </action>
  <verify>
    <automated>D=.planning/phases/05-accessories-conformance; grep -nE 'skills/(typescript-|local-verification|cucumber-behavioral)|features/support/(steps/|fake|loopbackServer|publishedServices)' $D/05-{PATTERNS,VALIDATION,07-PLAN}.md | grep -v '\.agents/skills/'; grep -nE '(^|[^/A-Za-z_-])skills/|fakeHap\.(ts|js)|features/CLAUDE\.md|typescript-google-style-review|typescript-comments|typescript-unit-testing-review|cucumber-behavioral-testing|typescript-unit-testing([^.]|$)|Types and hermeticity|the five books' $D/05-{PATTERNS,VALIDATION,07-PLAN}.md; grep -nE 'unit-testing\.md|unit-testing copy' $D/05-{PATTERNS,VALIDATION,07-PLAN}.md | grep -v 'deleted in' | grep -v 'The protocol contains the literal strings'; echo STALE_CHECK_DONE</automated>
    <fails_when>any output line before STALE_CHECK_DONE</fails_when>
    <automated>D=.planning/phases/05-accessories-conformance; grep -ohE '(\.agents/skills|features/(lib|step_definitions|support))/[A-Za-z0-9_./-]*' $D/05-{PATTERNS,VALIDATION,07-PLAN}.md | sed -E 's/[.,]+$//' | sort -u | while read -r p; do q="$p"; case "$q" in features/*.js) q="${q%.js}.ts";; esac; [ -e "$q" ] || echo "MISSING $p"; done; echo PATHS_CHECK_DONE</automated>
    <fails_when>any line starting with MISSING</fails_when>
    <automated>D=.planning/phases/05-accessories-conformance; if ! git cat-file -e 'ea0a71e^{commit}'; then echo "STRUCT missing base ea0a71e"; fi; X=$(git diff -U0 ea0a71e -- $D/05-{PATTERNS,VALIDATION,07-PLAN}.md) || echo "STRUCT diff read failed"; [ -n "$X" ] || echo "STRUCT empty diff"; for f in $D/05-{PATTERNS,VALIDATION,07-PLAN}.md; do h=$(git show "ea0a71e:$f") || echo "STRUCT base read failed $f"; for t in 'D-[0-9][0-9]' '[<]task ' '[<]acceptance_criteria[>]' '[<]verify[>]' '[<]automated[>]' '^## ' '^### '; do a=$(printf '%s\n' "$h" | grep -oE "$t" | wc -l | tr -d ' '); b=$(grep -oE "$t" "$f" | wc -l | tr -d ' '); [ "$a" = "$b" ] || echo "DRIFT $f $t $a to $b"; done; done; printf '%s\n' "$X" | grep -E '^-' | grep -vE '^--- (a/|/dev/null)' | grep -vE 'skills/|features/support/|fakeHap\.|features/CLAUDE\.md|typescript-unit-testing|unit-testing copy|unit-testing\.md|five books|hermeticity|typescript-(google-style-review|comments)'; echo STRUCT_CHECK_DONE</automated>
    <fails_when>any output line before STRUCT_CHECK_DONE (a STRUCT or DRIFT line, or a removed diff line that carried no stale token)</fails_when>
    <automated>f=.planning/phases/05-accessories-conformance/05-07-PLAN.md; [ "$(grep -E '^@\.agents/skills/' $f | tr '\n' ' ')" = '@.agents/skills/typescript-style/SKILL.md @.agents/skills/typescript-unit-tests/SKILL.md @.agents/skills/local-verification/SKILL.md ' ] || echo "BLOCK $f"; echo LIST_CHECK_DONE</automated>
    <fails_when>any line starting with BLOCK</fails_when>
    <automated>D=.planning/phases/05-accessories-conformance; printf '%s  %s\n' d9aa847d77878db3f15a7117564eac78605b7bca976667aabd0be9bcebef5218 $D/05-PATTERNS.md 87141b2c2f732c3a252dbf02ddeaf7086b43c8afa45a032e0f048d6cc2234d14 $D/05-VALIDATION.md a95f6e28d6d4d45300a57705c23cdc7fc3aabf28d1f04d2286f2939f6ccaeca5 $D/05-07-PLAN.md | shasum -a 256 -c -</automated>
    <fails_when>non-zero exit, or any line ending in FAILED</fails_when>
    <automated>D=.planning/phases/05-accessories-conformance; SKIP=npm-check pre-commit run --files $D/05-{PATTERNS,VALIDATION,07-PLAN}.md</automated>
    <fails_when>non-zero exit, or a hook reports that it modified a file</fails_when>
  </verify>
  <done>The three files carry exactly the mapped edits (hashes match), every path they name exists, the structure is unchanged, the hooks pass, and nothing is committed yet.</done>
</task>

<task type="auto">
  <name>Task 2: Retarget the shared context and research records, the Wave 0 plan 05-01, plan 05-02 and the closeout plan 05-09</name>
  <files>.planning/phases/05-accessories-conformance/05-CONTEXT.md, .planning/phases/05-accessories-conformance/05-RESEARCH.md, .planning/phases/05-accessories-conformance/05-01-PLAN.md, .planning/phases/05-accessories-conformance/05-02-PLAN.md, .planning/phases/05-accessories-conformance/05-09-PLAN.md</files>
  <read_first>
    This plan's Path facts, Mapping, Site index and Expected results sections
    .planning/phases/05-accessories-conformance/05-01-PLAN.md lines 19-47, 75-82, 99-102, 112-118, 192-214, 326-342, 352-362, 385-392, 415-421, 476-479, 500-503, 579-582, 600-606 and 626-645, with sed -n
    .planning/phases/05-accessories-conformance/05-RESEARCH.md lines 73-76, 108-111, 118-121, 143-147, 226-229, 240-243, 262-265, 270-273, 364-370, 425-429, 486-489, 624-627 and 663-668
    .planning/phases/05-accessories-conformance/05-CONTEXT.md lines 82-86, 152-164, 168-173 and 205-208
    .planning/phases/05-accessories-conformance/05-02-PLAN.md lines 96-118, 136-149, 162-166 and 205-211; 05-09-PLAN.md lines 74-77 and 176-179
  </read_first>
  <action>
After this task, every shared Phase 5 input and the plans that open and close the phase name
current paths.

Edit only the five files. First apply their S rows from the Site index as exact Old-to-New
replacements:

- S1 in 05-01-PLAN.md and 05-02-PLAN.md.
- S2 in 05-CONTEXT.md.
- S3 and S4 in 05-01-PLAN.md. They keep Phase 5 D-02 true: full-file reviewers and cause fixers
  use the complete rulebooks. Each skill index now points into its rules/ directory, and
  `.planning/config.json` injects no skills for the reviewer or fixer roles.
- S5, S6, S8 and S14 in 05-RESEARCH.md.
- S7 at its four 05-01-PLAN.md sites. All four must end as one identical path, so that the
  key_link pattern, the action that writes the protocol and the acceptance criterion that checks
  the protocol agree.
- S9, S10 and S12 in 05-01-PLAN.md.
- S11 at its two sites in 05-RESEARCH.md, its one site in 05-CONTEXT.md and its two sites in
  05-01-PLAN.md.

Leave the deleted copy's backticked literal in 05-01-PLAN.md's first 05-01-02 acceptance
criterion as it is (rule L7). The protocol can still name the deleted file.

Then apply the M rows that the Site index lists for these files (M1, M4, M5, M6, M7, M8, M9, M10,
M11, M12, M13) as in Task 1. The discipline of Task 1 applies: change no other character, do not
reflow, fix edits and never expected values, and make no commit.
  </action>
  <verify>
    <automated>D=.planning/phases/05-accessories-conformance; grep -nE 'skills/(typescript-|local-verification|cucumber-behavioral)|features/support/(steps/|fake|loopbackServer|publishedServices)' $D/05-{CONTEXT,RESEARCH,01-PLAN,02-PLAN,09-PLAN}.md | grep -v '\.agents/skills/'; grep -nE '(^|[^/A-Za-z_-])skills/|fakeHap\.(ts|js)|features/CLAUDE\.md|typescript-google-style-review|typescript-comments|typescript-unit-testing-review|cucumber-behavioral-testing|typescript-unit-testing([^.]|$)|Types and hermeticity|the five books' $D/05-{CONTEXT,RESEARCH,01-PLAN,02-PLAN,09-PLAN}.md; grep -nE 'unit-testing\.md|unit-testing copy' $D/05-{CONTEXT,RESEARCH,01-PLAN,02-PLAN,09-PLAN}.md | grep -v 'deleted in' | grep -v 'The protocol contains the literal strings'; echo STALE_CHECK_DONE</automated>
    <fails_when>any output line before STALE_CHECK_DONE</fails_when>
    <automated>D=.planning/phases/05-accessories-conformance; grep -ohE '(\.agents/skills|features/(lib|step_definitions|support))/[A-Za-z0-9_./-]*' $D/05-{CONTEXT,RESEARCH,01-PLAN,02-PLAN,09-PLAN}.md | sed -E 's/[.,]+$//' | sort -u | while read -r p; do q="$p"; case "$q" in features/*.js) q="${q%.js}.ts";; esac; [ -e "$q" ] || echo "MISSING $p"; done; echo PATHS_CHECK_DONE</automated>
    <fails_when>any line starting with MISSING</fails_when>
    <automated>D=.planning/phases/05-accessories-conformance; if ! git cat-file -e 'ea0a71e^{commit}'; then echo "STRUCT missing base ea0a71e"; fi; X=$(git diff -U0 ea0a71e -- $D/05-{CONTEXT,RESEARCH,01-PLAN,02-PLAN,09-PLAN}.md) || echo "STRUCT diff read failed"; [ -n "$X" ] || echo "STRUCT empty diff"; for f in $D/05-{CONTEXT,RESEARCH,01-PLAN,02-PLAN,09-PLAN}.md; do h=$(git show "ea0a71e:$f") || echo "STRUCT base read failed $f"; for t in 'D-[0-9][0-9]' '[<]task ' '[<]acceptance_criteria[>]' '[<]verify[>]' '[<]automated[>]' '^## ' '^### '; do a=$(printf '%s\n' "$h" | grep -oE "$t" | wc -l | tr -d ' '); b=$(grep -oE "$t" "$f" | wc -l | tr -d ' '); [ "$a" = "$b" ] || echo "DRIFT $f $t $a to $b"; done; done; printf '%s\n' "$X" | grep -E '^-' | grep -vE '^--- (a/|/dev/null)' | grep -vE 'skills/|features/support/|fakeHap\.|features/CLAUDE\.md|typescript-unit-testing|unit-testing copy|unit-testing\.md|five books|hermeticity|typescript-(google-style-review|comments)'; echo STRUCT_CHECK_DONE</automated>
    <fails_when>any output line before STRUCT_CHECK_DONE (a STRUCT or DRIFT line, or a removed diff line that carried no stale token)</fails_when>
    <automated>D=.planning/phases/05-accessories-conformance; B='@.agents/skills/typescript-style/SKILL.md @.agents/skills/typescript-unit-tests/SKILL.md @.agents/skills/local-verification/SKILL.md '; for n in 1 2; do f=$D/05-0$n-PLAN.md; [ "$(grep -E '^@\.agents/skills/' $f | tr '\n' ' ')" = "$B" ] || echo "BLOCK $f"; done; f=$D/05-09-PLAN.md; [ "$(grep -E '^@\.agents/skills/' $f | tr '\n' ' ')" = '@.agents/skills/local-verification/SKILL.md ' ] || echo "BLOCK $f"; f=$D/05-CONTEXT.md; [ "$(grep -E '^- `\.agents/skills/' $f | tr '\n' ' ')" = '- `.agents/skills/typescript-style/SKILL.md` - `.agents/skills/typescript-unit-tests/SKILL.md` - `.agents/skills/local-verification/SKILL.md` ' ] || echo "BLOCK $f rulebooks"; echo LIST_CHECK_DONE</automated>
    <fails_when>any line starting with BLOCK</fails_when>
    <automated>f=.planning/phases/05-accessories-conformance/05-01-PLAN.md; J=$(cat "$f" | tr '\n' ' ' | tr -s ' '); for s in 'to: ".agents/skills/typescript-unit-tests/rules/cases.md"' 'pattern: ".agents/skills/typescript-unit-tests/rules/cases.md"' '`.agents/skills/typescript-unit-tests/rules/cases.md` allows it only for' 'literal strings `.agents/skills/typescript-unit-tests/rules/cases.md`, `.claude/rules/typescript-unit-testing.md`' 'show f68df73^:.claude/rules/typescript-unit-testing.md' 'the three books (.agents/skills/typescript-style, typescript-unit-tests and local-verification, each SKILL.md with every file in its rules/ directory)' 'plus .agents/skills/cucumber/SKILL.md with every file in its rules/ directory for any path under `features/`' 'rule .agents/skills/typescript-unit-tests/rules/cases.md Assertions' 'and .agents/skills/typescript-style/rules/comments.md'; do printf '%s' "$J" | grep -qF -- "$s" || echo "COUPLING missing: $s"; done; echo COUPLING_CHECK_DONE</automated>
    <fails_when>any line starting with COUPLING missing</fails_when>
    <automated>D=.planning/phases/05-accessories-conformance; printf '%s  %s\n' 036f283aa3a0cc99dcecb040952611e9c9426f7a791bdddb53fd10cc8943587f $D/05-CONTEXT.md b3f974082d9810bcf55909f6715090a84fba9c614f8a9225300220f2847857e1 $D/05-RESEARCH.md 004b9bab7ea5cda7f56b23e961cabcdbfb251f25b68350f7b10f0985c20dec08 $D/05-01-PLAN.md d5fa197f1d0a2aaf1ea19817b4537740e0ae2a4dbeffb2458d8b839c0f5702b0 $D/05-02-PLAN.md 6dd328183dca6489a4dba518ee740c0f6468e403a2f88fc9b6f942ae2c9dbe99 $D/05-09-PLAN.md | shasum -a 256 -c -</automated>
    <fails_when>non-zero exit, or any line ending in FAILED</fails_when>
    <automated>D=.planning/phases/05-accessories-conformance; SKIP=npm-check pre-commit run --files $D/05-{CONTEXT,RESEARCH,01-PLAN,02-PLAN,09-PLAN}.md</automated>
    <fails_when>non-zero exit, or a hook reports that it modified a file</fails_when>
  </verify>
  <done>The five files carry exactly the mapped edits (hashes match). 05-01's four act-and-assert sites name one path. Its reviewer and fixer contracts name each skill with its rules/ directory. Every deleted-copy mention is marked. The hooks pass, and nothing is committed yet.</done>
</task>

<task type="auto">
  <name>Task 3: Retarget batch plans 05-03, 05-04, 05-05, 05-06 and 05-08, check all thirteen files, and commit once</name>
  <files>.planning/phases/05-accessories-conformance/05-03-PLAN.md, .planning/phases/05-accessories-conformance/05-04-PLAN.md, .planning/phases/05-accessories-conformance/05-05-PLAN.md, .planning/phases/05-accessories-conformance/05-06-PLAN.md, .planning/phases/05-accessories-conformance/05-08-PLAN.md</files>
  <read_first>
    .agents/skills/committing/SKILL.md
    .agents/skills/local-verification/rules/gates.md (a planning-only Markdown commit needs no npm run check)
    This plan's Mapping, Site index and Expected results sections
    .planning/phases/05-accessories-conformance/05-08-PLAN.md lines 10-14, 39-42, 54-57, 92-99, 109-112, 142-156, 169-172, 176-179, 227-231, 274-286, 318-330, 355-361, 367-370, 445-448 and 469-472, with sed -n
    The S1 and M-row lines that the Site index lists for 05-03 to 05-06, with sed -n
  </read_first>
  <action>
After this task, every Phase 5 plan resolves against the current tree and the change is in one
commit.

Edit only the five files. Apply S1 in each and S13 in 05-08-PLAN.md. Then apply M1, M4, M6, M7, M8
and M12 where the Site index lists them, as in Task 1. In 05-08-PLAN.md, leave the commit-scope
tokens and the scope alternative in the commit-title regex as they are (rule L3). They name commit
scopes, not files.

Gate all thirteen files before staging. Run this task's verify commands except the last one (the
commit check). Each must pass. Run
`node_modules/.bin/fallow audit --base HEAD` (the AGENTS.md task map) and require exit 0, as no
TypeScript changes. Run `SKIP=npm-check pre-commit run --files` on the 13 paths. Repeat until it
exits 0 and modifies no file. If a hook modified a file, run the hash check again. Do not run
`npm run check`: the commit holds only planning Markdown and no build input
(`.agents/skills/local-verification/rules/gates.md`).

Stage exactly the 13 paths with `git add`. Never use `-A` or `-a`. Confirm that
`git diff --cached --name-only` lists exactly those paths. Then commit in the foreground with a
plain `git commit`. Never use `gsd-tools query commit`.

- Title: `docs: point accessories planning at the new skills and step files`. It drops the
  request's "phase 5" wording, because the committing skill forbids naming a GSD phase in a
  message.
- Body, four lines of at most 80 characters: "The rulebooks moved into registered skills under
  .agents/skills/, and the" / "Cucumber suite moved its step files and stand-ins. Point the
  accessories" / "review records at the new paths, and mark the deleted unit-testing rules" /
  "copy as deleted where those records cite it."
- End the message with the attribution line that the executing session supplies.

If the commit hook fails, no commit happened. Fix the cause, restage and commit again. Never use
`--amend` or `--no-verify`. After the commit, run this task's verify block as written.

Write the SUMMARY at the output path. Record:

- The commit hash and each check with its raw exit status.
- The deliberate choices: L1 (the discussion log stays, so the orchestrator's grep is scoped to the
  13 files); L3 (commit scopes stay); S11 and S12 (the deleted copy is annotated, not removed);
  S3 and S4 (D-02); the commit title.
- The two observations outside this plan's files: the singular `typescript-unit-test/` links in
  the unit-tests skill index, and the `agent_skills` roles that `.planning/config.json` no longer
  lists.
- A `## Threat Flags` section with the exact None text from AGENTS.md, unless something
  security-relevant arose.

Leave STATE.md and the quick-task table to the quick workflow's own docs step.
  </action>
  <verify>
    <automated>D=.planning/phases/05-accessories-conformance; grep -nE 'skills/(typescript-|local-verification|cucumber-behavioral)|features/support/(steps/|fake|loopbackServer|publishedServices)' $D/05-{0{1,2,3,4,5,6,7,8,9}-PLAN,CONTEXT,PATTERNS,RESEARCH,VALIDATION}.md | grep -v '\.agents/skills/'; grep -nE '(^|[^/A-Za-z_-])skills/|fakeHap\.(ts|js)|features/CLAUDE\.md|typescript-google-style-review|typescript-comments|typescript-unit-testing-review|cucumber-behavioral-testing|typescript-unit-testing([^.]|$)|Types and hermeticity|the five books' $D/05-{0{1,2,3,4,5,6,7,8,9}-PLAN,CONTEXT,PATTERNS,RESEARCH,VALIDATION}.md; grep -nE 'unit-testing\.md|unit-testing copy' $D/05-{0{1,2,3,4,5,6,7,8,9}-PLAN,CONTEXT,PATTERNS,RESEARCH,VALIDATION}.md | grep -v 'deleted in' | grep -v 'The protocol contains the literal strings'; echo STALE_CHECK_DONE</automated>
    <fails_when>any output line before STALE_CHECK_DONE</fails_when>
    <automated>D=.planning/phases/05-accessories-conformance; grep -ohE '(\.agents/skills|features/(lib|step_definitions|support))/[A-Za-z0-9_./-]*' $D/05-{0{1,2,3,4,5,6,7,8,9}-PLAN,CONTEXT,PATTERNS,RESEARCH,VALIDATION}.md | sed -E 's/[.,]+$//' | sort -u | while read -r p; do q="$p"; case "$q" in features/*.js) q="${q%.js}.ts";; esac; [ -e "$q" ] || echo "MISSING $p"; done; echo PATHS_CHECK_DONE</automated>
    <fails_when>any line starting with MISSING</fails_when>
    <automated>D=.planning/phases/05-accessories-conformance; if ! git cat-file -e 'ea0a71e^{commit}'; then echo "STRUCT missing base ea0a71e"; fi; X=$(git diff -U0 ea0a71e -- $D/05-{0{1,2,3,4,5,6,7,8,9}-PLAN,CONTEXT,PATTERNS,RESEARCH,VALIDATION}.md) || echo "STRUCT diff read failed"; [ -n "$X" ] || echo "STRUCT empty diff"; for f in $D/05-{0{1,2,3,4,5,6,7,8,9}-PLAN,CONTEXT,PATTERNS,RESEARCH,VALIDATION}.md; do h=$(git show "ea0a71e:$f") || echo "STRUCT base read failed $f"; for t in 'D-[0-9][0-9]' '[<]task ' '[<]acceptance_criteria[>]' '[<]verify[>]' '[<]automated[>]' '^## ' '^### '; do a=$(printf '%s\n' "$h" | grep -oE "$t" | wc -l | tr -d ' '); b=$(grep -oE "$t" "$f" | wc -l | tr -d ' '); [ "$a" = "$b" ] || echo "DRIFT $f $t $a to $b"; done; done; printf '%s\n' "$X" | grep -E '^-' | grep -vE '^--- (a/|/dev/null)' | grep -vE 'skills/|features/support/|fakeHap\.|features/CLAUDE\.md|typescript-unit-testing|unit-testing copy|unit-testing\.md|five books|hermeticity|typescript-(google-style-review|comments)'; echo STRUCT_CHECK_DONE</automated>
    <fails_when>any output line before STRUCT_CHECK_DONE (a STRUCT or DRIFT line, or a removed diff line that carried no stale token)</fails_when>
    <automated>D=.planning/phases/05-accessories-conformance; B='@.agents/skills/typescript-style/SKILL.md @.agents/skills/typescript-unit-tests/SKILL.md @.agents/skills/local-verification/SKILL.md '; for n in 1 2 3 4 5 6 7 8; do f=$D/05-0$n-PLAN.md; [ "$(grep -E '^@\.agents/skills/' $f | tr '\n' ' ')" = "$B" ] || echo "BLOCK $f"; done; f=$D/05-09-PLAN.md; [ "$(grep -E '^@\.agents/skills/' $f | tr '\n' ' ')" = '@.agents/skills/local-verification/SKILL.md ' ] || echo "BLOCK $f"; f=$D/05-CONTEXT.md; [ "$(grep -E '^- `\.agents/skills/' $f | tr '\n' ' ')" = '- `.agents/skills/typescript-style/SKILL.md` - `.agents/skills/typescript-unit-tests/SKILL.md` - `.agents/skills/local-verification/SKILL.md` ' ] || echo "BLOCK $f rulebooks"; echo LIST_CHECK_DONE</automated>
    <fails_when>any line starting with BLOCK</fails_when>
    <automated>f=.planning/phases/05-accessories-conformance/05-01-PLAN.md; J=$(cat "$f" | tr '\n' ' ' | tr -s ' '); for s in 'to: ".agents/skills/typescript-unit-tests/rules/cases.md"' 'pattern: ".agents/skills/typescript-unit-tests/rules/cases.md"' '`.agents/skills/typescript-unit-tests/rules/cases.md` allows it only for' 'literal strings `.agents/skills/typescript-unit-tests/rules/cases.md`, `.claude/rules/typescript-unit-testing.md`' 'show f68df73^:.claude/rules/typescript-unit-testing.md' 'the three books (.agents/skills/typescript-style, typescript-unit-tests and local-verification, each SKILL.md with every file in its rules/ directory)' 'plus .agents/skills/cucumber/SKILL.md with every file in its rules/ directory for any path under `features/`' 'rule .agents/skills/typescript-unit-tests/rules/cases.md Assertions' 'and .agents/skills/typescript-style/rules/comments.md'; do printf '%s' "$J" | grep -qF -- "$s" || echo "COUPLING missing: $s"; done; echo COUPLING_CHECK_DONE</automated>
    <fails_when>any line starting with COUPLING missing</fails_when>
    <automated>D=.planning/phases/05-accessories-conformance; printf '%s  %s\n' 004b9bab7ea5cda7f56b23e961cabcdbfb251f25b68350f7b10f0985c20dec08 $D/05-01-PLAN.md d5fa197f1d0a2aaf1ea19817b4537740e0ae2a4dbeffb2458d8b839c0f5702b0 $D/05-02-PLAN.md a0c9caaed2a4ada7a293a7dfae42975baa0cec44a0379c5a439248a94a931ce1 $D/05-03-PLAN.md aba33f36852c44a978f4ee359b17856b317a2ef3673b79129bd45a31e9938d55 $D/05-04-PLAN.md 12443b60a051ccc588212e0504badb2f7a1eaa162fcc3a71b3edc5ff8264ba98 $D/05-05-PLAN.md c9a1d1b0b3c059753f8018c5701d98ff26dde0db17c22b2557f7c88704b8a472 $D/05-06-PLAN.md a95f6e28d6d4d45300a57705c23cdc7fc3aabf28d1f04d2286f2939f6ccaeca5 $D/05-07-PLAN.md 9661903222a62e2e1cc38016914ca9ba6cea83161def2de46135bfd16c968494 $D/05-08-PLAN.md 6dd328183dca6489a4dba518ee740c0f6468e403a2f88fc9b6f942ae2c9dbe99 $D/05-09-PLAN.md 036f283aa3a0cc99dcecb040952611e9c9426f7a791bdddb53fd10cc8943587f $D/05-CONTEXT.md d9aa847d77878db3f15a7117564eac78605b7bca976667aabd0be9bcebef5218 $D/05-PATTERNS.md b3f974082d9810bcf55909f6715090a84fba9c614f8a9225300220f2847857e1 $D/05-RESEARCH.md 87141b2c2f732c3a252dbf02ddeaf7086b43c8afa45a032e0f048d6cc2234d14 $D/05-VALIDATION.md | shasum -a 256 -c -</automated>
    <fails_when>non-zero exit, or any line ending in FAILED</fails_when>
    <automated>D=.planning/phases/05-accessories-conformance; C=$(git log -1 --format=%H --fixed-strings --grep='docs: point accessories planning at the new skills and step files'); [ -n "$C" ] || echo "COMMIT not found"; [ "$(git log -1 --format=%s "$C")" = 'docs: point accessories planning at the new skills and step files' ] || echo "COMMIT title"; if ! git merge-base --is-ancestor "$C" HEAD; then echo "COMMIT not reachable from HEAD"; fi; [ "$(git branch --show-current)" = features/code-review-sweep ] || echo "COMMIT branch"; N=$(git show --name-only --format= "$C") || echo "COMMIT file list read failed"; [ "$(printf '%s\n' "$N" | sort | tr '\n' ' ')" = "$(printf '%s\n' $D/05-{0{1,2,3,4,5,6,7,8,9}-PLAN,CONTEXT,PATTERNS,RESEARCH,VALIDATION}.md | sort | tr '\n' ' ')" ] || echo "COMMIT file set differs from the 13 paths"; E=$(git diff --name-only "$C^" "$C" -- . ':(exclude,glob).planning/**/*.md') || echo "COMMIT diff read failed"; [ -z "$E" ] || echo "COMMIT non-planning file"; S=$(git status --porcelain -- $D) || echo "COMMIT status read failed"; [ -z "$S" ] || echo "COMMIT phase dir not clean"; echo COMMIT_CHECK_DONE</automated>
    <fails_when>any line starting with COMMIT before COMMIT_CHECK_DONE</fails_when>
  </verify>
  <done>All 13 files match the expected hashes. The orchestrator's grep and the extended checks print nothing for them. Every named path exists. One commit on features/code-review-sweep holds exactly the 13 files. 05-DISCUSSION-LOG.md is untouched. The SUMMARY records the checks, the deliberate choices and the Threat Flags section.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| planning records to later executor agents | Phase 5 plans, context and research are run as instructions by later agents. A wrong path or a silently changed rule carries into Phase 5 execution. |
| working tree to branch history | The single commit lands on features/code-review-sweep, which a later PR squash-merges. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-wbo-01 | Tampering | Decisions, tasks and acceptance criteria in the 13 files | medium | mitigate | The structure check matches per-file counts of D-NN tokens, task, acceptance-criteria, verify and automated elements, and ## and ### headings against ea0a71e. Every removed diff line must carry a stale token. No reflow. The SHA-256 of each file must equal the dry-run value. |
| T-wbo-02 | Tampering | Retargeted paths | medium | mitigate | The paths check runs `test -e` on every `.agents/skills/` and `features/{lib,step_definitions,support}/` token, with `.js` checked as `.ts`. It catches the singular `typescript-unit-test/` directory that the unit-tests skill index names. |
| T-wbo-03 | Tampering | Phase 5 D-02 (complete rulebooks) weakened by a collapse into index-only skill files | medium | mitigate | S3 and S4 require each SKILL.md with every file in its rules/ directory. The coupling check asserts both phrases in 05-01. |
| T-wbo-04 | Repudiation | 05-DISCUSSION-LOG.md audit trail | low | mitigate | It is excluded from every edit (L1). The commit check fails on any file outside the 13 and on a phase directory left dirty. |
| T-wbo-05 | Repudiation | Commit evidence | medium | mitigate | Stage the 13 paths by name and commit with a plain foreground commit, never through `gsd-tools query commit` (the empty-commit hazard in STATE.md). The commit check asserts the title, the branch and exactly the 13 files. |
| T-wbo-06 | Information disclosure | Commit contents | low | mitigate | Only planning Markdown changes. The edits only swap repository paths and add commit IDs. No credential, token, account identifier or vendor data enters. The trufflehog pre-commit hook scans the staged files. |
| T-wbo-SC | Tampering | npm/pip/cargo installs | low | accept | No package is installed. The plan edits Markdown only. |
</threat_model>

<verification>
- Task 3's verify block, run after the commit, passes in full: stale, paths, structure against
  ea0a71e, lists, coupling, hashes and commit checks. The commit check finds the commit by its
  title, so it does not depend on what lands after it.
- The orchestrator's grep over the 13 files prints nothing:
  `grep -rnE 'skills/(typescript-|local-verification|cucumber-behavioral)|features/support/(steps/|fake|loopbackServer|publishedServices)' .planning/phases/05-accessories-conformance/ --exclude=05-DISCUSSION-LOG.md | grep -v '\.agents/skills/'`.
  Run over the whole directory, it prints only the discussion log's lines 37 and 84 (L1).
- `SKIP=npm-check pre-commit run --files` on the 13 paths exits 0, and the commit hook passed.
</verification>

<success_criteria>
- All 13 Phase 5 planning files name only paths that exist after f68df73 and ea0a71e.
- Each plan names each new skill once, and the Phase 5 decisions, tasks and acceptance criteria
  are unchanged apart from their literal paths.
- One commit on features/code-review-sweep, `docs: point accessories planning at the new skills
  and step files`, contains exactly the 13 files.
</success_criteria>

<output>
Create `.planning/quick/261016-wbo-update-phase-5-planning-files-to-the-new/261016-wbo-SUMMARY.md`
when done. Include `## Threat Flags`.
</output>

## Source audit

| Source | Item | Covered by | Status |
|---|---|---|---|
| GOAL | Update Phase 5 planning files to the new skill and step paths | Tasks 1-3 | COVERED |
| CONTEXT (orchestrator) | f68df73 skill removals mapped to the right new file or rules file | S1-S10, M7-M11, M13; Tasks 1-3 | COVERED |
| CONTEXT (orchestrator) | ea0a71e step and stand-in moves | M1-M6, S13, S14; Tasks 1-3 | COVERED |
| CONTEXT (orchestrator) | Files: 05-01 to 05-09, CONTEXT, PATTERNS, VALIDATION, RESEARCH | Task 1 (3 files), Task 2 (5), Task 3 (5) | COVERED |
| CONTEXT (orchestrator) | Skill names in prose; context-block lists name each new skill once | S1, S2, S3, S5, M12; lists check | COVERED |
| CONTEXT (orchestrator) | Only paths and skill names; no scope, task or decision change | Leave rules L1-L8; structure and hash checks | COVERED |
| CONTEXT (orchestrator) | Do not touch other phases or archived files | Commit check (exactly 13 files) | COVERED |
| CONTEXT (orchestrator) | Verification: grep empty, new paths exist, pre-commit passes | Stale, paths and pre-commit checks in every task | COVERED (grep scoped to the 13 files; see L1) |
| CONTEXT (orchestrator) | One commit on features/code-review-sweep, no new branch | Task 3 | COVERED (title drops "phase 5" per the committing skill) |
| Discovered | `.claude/rules/typescript-unit-testing.md` deleted in f68df73 (11 lines) | S6, S11, S12 | COVERED |
| Discovered | `features/CLAUDE.md` deleted in f68df73 | S4 | COVERED |
| Discovered | Bare `skills/` and `skills/*/SKILL.md` authority statements, "the five books", the renamed section, bare stand-in names | M8-M10, M12, M13, S13, S14 | COVERED |
