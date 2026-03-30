# Task: Structural Code Review — Runtime & Definitions (worker-a)

## Context

You are performing a structural code review of the genshin-ts codebase.
**IMPORTANT: Do NOT report IntelliSense or type-hint issues.** Those were analyzed separately.
This review is about code organization, responsibility separation, coupling, duplication, error handling, and naming consistency.

Background context (project structure overview) is available at:
`.claude/tree/genshin-ts-analysis/nodes/root/workspace/report.md`

## Scope

Review these directories:
- `src/runtime/` — all files (core.ts, ir_builder.ts, value.ts, variables.ts, server_globals.ts, server_globals.d.ts, ir_optimize_return_vars.ts, execution_flow_types.ts, meta_call_types.ts, runtime_config.ts, IR.d.ts)
- `src/definitions/` — all files (events.ts, events-payload.ts, nodes.ts, enum.ts, entity_helpers.ts, prefabs.ts, zh_aliases.ts, and any others)

## What to Look For

### 1. Module Organization & File Boundaries
- Are files too large / doing too many things? (god files)
- Are there files that are too small and should be merged?
- Is the split between `runtime/` and `definitions/` logical? Do they stay in their lane?
- Does `core.ts` have clearly separated concerns, or does it mix multiple responsibilities?
- Does `server_globals.ts` vs `server_globals.d.ts` split make sense? Is this pattern consistent with the rest?

### 2. Responsibility Separation (Mixed Concerns)
- Does any file mix I/O with logic?
- Does any file mix configuration/setup with execution?
- Is the boundary between "what the user writes" (public API) and "what the runtime does" (internals) clear?
- Does `ir_builder.ts` stay focused on IR construction, or does it do other things?
- Does `variables.ts` stay focused on variable management?

### 3. Dependency Structure
- Map out the import graph for `src/runtime/`. Are there cycles?
- Does `core.ts` import from `definitions/`? Is this appropriate?
- Do `definitions/` files import from `runtime/`? Is this appropriate?
- Any surprising or circular imports?

### 4. Code Duplication
- Repeated patterns across the auto-generated `events.ts`, `nodes.ts` — is the generation well-structured or does it produce redundant code?
- Any repeated logic in `value.ts` across different value type classes?
- `zh_aliases.ts` vs the English names in `events.ts`/`nodes.ts` — is aliasing handled consistently?

### 5. Extensibility / Hardcoded Values
- Magic numbers or hardcoded strings in runtime logic
- Patterns that make adding new value types, event types, or node types difficult
- Is the `signalTypeClassMap` in `core.ts` the right pattern? Is it maintained/extensible?

### 6. Error Handling
- How does the runtime handle errors (malformed user code, invalid arguments)?
- Are errors thrown or returned? Is the pattern consistent?
- Are error messages useful and consistent in format?
- Does `ir_builder.ts` validate its inputs?

### 7. Naming & Conventions
- Inconsistent naming between files (e.g., camelCase vs PascalCase for similar things)
- Are internal vs public names clearly distinguished?
- File naming conventions — are they consistent across the directory?

## How to Read the Code

Read individual files you need. Focus on structure, not line-by-line code correctness. For large files (core.ts is large), read key sections — top of file (imports, major declarations), key function signatures, and any sections that look complex.

Do not re-report any issue already in:
`.claude/tree/genshin-ts-analysis/nodes/root/workspace/intellisense-analysis.md`

## Deliverable

Write findings to:
`D:/MyDrive/Repos/MiliastraWonderland/genshin-ts/.claude/tree/genshin-ts-analysis/nodes/worker-a/workspace/structural-findings.md`

Structure:
```
# worker-a Structural Findings: Runtime & Definitions

## High Impact Issues
[Significant structural problems — mixed concerns, god files, bad coupling]
For each: file path, problem description, concrete suggestion

## Medium Impact Issues
[Duplication, missing patterns, hardcoded values, extensibility concerns]
For each: file path, problem description, concrete suggestion

## Low Impact / Naming
[Naming inconsistencies, minor organizational issues]
For each: file path, problem description, concrete suggestion

## Dependency Map
[Brief description of the import graph — what imports what, any cycles]

## Summary
[3-5 sentence summary of the main structural problems in runtime/ and definitions/]
```

When complete, send `[TASK_RESULT] [from:worker-a] [to:root]` message to root.
Reference file: `.claude/tree/genshin-ts-analysis/nodes/worker-a/workspace/structural-findings.md`
