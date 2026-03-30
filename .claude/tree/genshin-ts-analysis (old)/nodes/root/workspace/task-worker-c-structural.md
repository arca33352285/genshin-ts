# Task: Structural Code Review — Injector, CLI, Shared & Cross-Cutting (worker-c)

## Context

You are performing a structural code review of the genshin-ts codebase.
**IMPORTANT: Do NOT report IntelliSense or type-hint issues.** Those were analyzed separately.
This review is about code organization, responsibility separation, coupling, duplication, error handling, and naming consistency.

Background context (project structure overview) is available at:
`.claude/tree/genshin-ts-analysis/nodes/root/workspace/report.md`

## Scope

Review these directories and files:
- `src/injector/` — all files (index.ts, binary.ts, node_graph.ts, proto.ts, signal_nodes.ts, folder.ts, and any types files)
- `src/cli/` — all files (gsts.ts main CLI, plus any supporting files like ui.ts, state.ts, gil_resources.ts, etc.)
- `src/shared/` — all files (internal utilities)
- `src/index.ts` — the public export barrel
- `src/i18n/` — CLI internationalization
- `src/thirdparty/` — third-party code (scan only — do not deeply review third-party internals, but note how it's integrated)

## What to Look For

### 1. Module Organization & File Boundaries

**Injector:**
- Is `binary.ts` clearly focused on binary parsing only?
- Is `folder.ts` clearly focused on folder/index navigation?
- Is `node_graph.ts` the right place for NodeGraph location + replacement, or is it doing too much?
- Does `signal_nodes.ts` have a clear, bounded responsibility?
- Is `proto.ts` a clean abstraction over the protobuf library?
- Does `index.ts` orchestrate cleanly, or does it mix orchestration with low-level logic?

**CLI:**
- Does `gsts.ts` do too much? Is it a god file mixing CLI parsing, business logic, and I/O?
- Are CLI subcommand implementations separated from argument parsing?
- Is CLI state management (`state.ts`) cleanly separated?
- Is UI/formatting (`ui.ts`) cleanly separated from business logic?
- Is `gil_resources.ts` (prefab extraction) well-placed in the CLI directory?

**Shared:**
- What's in `src/shared/`? Are the utilities general-purpose or tightly coupled to specific modules?
- Are shared utilities actually reused, or are they one-off helpers that only one caller uses?

**Public Barrel (`src/index.ts`):**
- Does it export only what belongs in the public API?
- Are there types that need to be imported from internal paths (missing from barrel)?
- Are there things exported that shouldn't be (implementation details)?

### 2. Responsibility Separation (Mixed Concerns)

**Injector:**
- Does `index.ts` mix I/O (reading files) with binary manipulation logic?
- Is binary parsing cleanly separated from semantic interpretation (what NodeGraph means)?
- Does any injector file mix error handling styles (throws vs returns vs callbacks)?

**CLI:**
- Does the CLI mix business logic with command-line argument parsing?
- Does the CLI duplicate logic that belongs in the compiler/injector libraries?
- Is there clear separation between "what to do" (strategy) and "how to display it" (output)?

### 3. Dependency Structure
- Map the import graph within `src/injector/`. Are there cycles?
- Does the CLI import from `src/runtime/` directly? (Should go through the library API.)
- Does `src/index.ts` pull in anything that causes unnecessary coupling at the barrel level?
- Does `src/shared/` import from specific modules (bad), or is it imported by other modules (good)?
- How is `src/thirdparty/` integrated — is it cleanly contained or do its internals leak?

### 4. Code Duplication

**Injector:**
- Is there duplication between `injectGilBytes` / `injectGilFile` / `Injector.injectBytes` / `Injector.injectFile`? Are these wrappers clean, or do they repeat logic?

**CLI:**
- Does the CLI re-implement logic that exists in the compiler/injector APIs?
- Are error display patterns consistent across all CLI subcommands?

**Cross-module:**
- Any utility functions reimplemented in multiple places (e.g., path manipulation, file reading)?

### 5. Extensibility / Hardcoded Values

**Injector:**
- Hardcoded binary offsets, magic bytes, or file format constants — are they named constants or raw numbers?
- `fmtGraphType` magic numbers (20000, 20003, 20004, 20005) — are these named?
- Is the protobuf schema path hardcoded or configurable?

**CLI:**
- Hardcoded file extensions or paths?
- Are all user-visible strings in `src/i18n/` or hardcoded?

### 6. Error Handling

**Injector:**
- How does the injector handle malformed `.gil` files? (Bad magic bytes, truncated data, missing NodeGraph)
- Is the "non-empty check" safety mechanism robust?
- Are errors thrown or returned? Consistent across the injector?
- What happens if the protobuf schema fails to load?

**CLI:**
- How does the CLI handle errors from compiler/injector calls? Is it consistent?
- Are user-facing error messages clear and actionable?
- Are errors caught at the top level or scattered throughout commands?

### 7. Naming & Conventions
- `injectGilBytes` vs `injectGilFile` vs `Injector.injectBytes` — naming consistency
- CLI command naming vs function naming — are they aligned?
- File naming in `src/injector/` — consistent with the rest of the codebase?

## How to Read the Code

Read individual files you need. For large files (gsts.ts CLI is likely large), focus on top-level command definitions, function signatures, and import sections. Check `src/shared/` fully — it's likely small. Scan `src/thirdparty/` at directory level only; note what it exports and how injector/compiler use it.

Do not re-report any issue already in:
`.claude/tree/genshin-ts-analysis/nodes/root/workspace/intellisense-analysis.md`

## Deliverable

Write findings to:
`D:/MyDrive/Repos/MiliastraWonderland/genshin-ts/.claude/tree/genshin-ts-analysis/nodes/worker-c/workspace/structural-findings.md`

Structure:
```
# worker-c Structural Findings: Injector, CLI, Shared & Cross-Cutting

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
[3-5 sentence summary of the main structural problems in injector, CLI, and shared]
```

When complete, send `[TASK_RESULT] [from:worker-c] [to:root]` message to root.
Reference file: `.claude/tree/genshin-ts-analysis/nodes/worker-c/workspace/structural-findings.md`
