# Task: Structural Code Review — Compiler Pipeline (worker-b)

## Context

You are performing a structural code review of the genshin-ts codebase.
**IMPORTANT: Do NOT report IntelliSense or type-hint issues.** Those were analyzed separately.
This review is about code organization, responsibility separation, coupling, duplication, error handling, and naming consistency.

Background context (project structure overview) is available at:
`.claude/tree/genshin-ts-analysis/nodes/root/workspace/report.md`

## Scope

Review these directories:
- `src/compiler/gsts_config.ts` — user-facing config schema
- `src/compiler/config_loader.ts` — config loading
- `src/compiler/ts_to_gs_pipeline.ts` — Stage 1 orchestrator
- `src/compiler/ts_to_gs_transform/` — all files (Stage 1 AST visitors)
- `src/compiler/gs_to_ir_json_transform/index.ts` + `runner.ts` — Stage 2
- `src/compiler/ir_merge.ts` — IR merge logic
- `src/compiler/ir_to_gia_pipeline.ts` — Stage 3 orchestrator
- `src/compiler/ir_to_gia_transform/` — all files (Stage 3 implementation)
- `src/compiler/gia_vendor.ts` — thirdparty re-exports

## What to Look For

### 1. Module Organization & File Boundaries
- Is the three-stage pipeline clearly reflected in the directory structure, or are concerns mixed?
- Are the `ts_to_gs_transform/` visitor files well-organized? Any god files among them?
- Is `ir_to_gia_transform/` well-organized? Are individual transform steps cleanly separated?
- Does `gia_vendor.ts` (thirdparty re-exports) fit cleanly in the compiler directory, or should it live elsewhere?
- Is the config (`gsts_config.ts`) and config loading (`config_loader.ts`) split appropriate?

### 2. Responsibility Separation (Mixed Concerns)
- Stage 1: does `ts_to_gs_pipeline.ts` orchestrate only, or does it also contain transform logic?
- Stage 2: does the runner (`runner.ts`) do more than execute the .gs.ts and emit IR?
- Stage 3: does `ir_to_gia_pipeline.ts` orchestrate cleanly, or does it mix orchestration with transform logic?
- Is IR merge logic (`ir_merge.ts`) cleanly separated from the pipeline orchestrators?
- Do pipeline files mix subprocess spawning logic with business logic?
- Is config validation mixed into the config loader or split separately?

### 3. Dependency Structure
- Map the import graph within `src/compiler/`. Are there cycles?
- Do Stage 1/2/3 depend on each other? (They should not — only the CLI should chain them.)
- Does any stage import from `src/runtime/` (this would be a coupling problem)?
- Does `config_loader.ts` import from stages, or is it standalone?

### 4. Code Duplication
- Subprocess spawning pattern: is it duplicated between Stage 2 and Stage 3 orchestrators?
- Error handling patterns in subprocess runners: consistent across stages?
- Are there shared utilities that each stage reimplements independently?
- In `ts_to_gs_transform/`, are visitor patterns duplicated across expr.ts / stmt.ts / loops.ts etc.?

### 5. Extensibility / Hardcoded Values
- Magic numbers in IR IDs, node IDs, or graph configuration
- Hardcoded paths or extension strings (`.gs.ts`, `.json`, `.gia`) — are they constants?
- Are new syntax features (feature flags in `GstsFeatureFlags`) easy to add? Is the wiring clean?
- Are new optimization passes easy to add and wire in?

### 6. Error Handling
- How do stages handle compile errors vs runtime errors?
- Are subprocess errors (non-zero exit codes) handled consistently?
- Are errors propagated, thrown, or swallowed? Is the pattern consistent?
- How does Stage 2 (subprocess execution) handle user code that throws at runtime?

### 7. Naming & Conventions
- Pipeline file naming: `ts_to_gs_pipeline.ts` vs `ir_to_gia_pipeline.ts` — consistent?
- Transform directory naming: `ts_to_gs_transform/` vs `ir_to_gia_transform/` — consistent?
- Are function names in the pipeline files consistent across stages?
- Internal vs public function naming: are internal helpers clearly marked?

## How to Read the Code

Read individual files you need. For large files, focus on top-level declarations, function signatures, and import sections. The `ts_to_gs_transform/` directory may have many files — scan all of them for size and naming, then read any that look structurally interesting.

Do not re-report any issue already in:
`.claude/tree/genshin-ts-analysis/nodes/root/workspace/intellisense-analysis.md`

## Deliverable

Write findings to:
`D:/MyDrive/Repos/MiliastraWonderland/genshin-ts/.claude/tree/genshin-ts-analysis/nodes/worker-b/workspace/structural-findings.md`

Structure:
```
# worker-b Structural Findings: Compiler Pipeline

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
[3-5 sentence summary of the main structural problems in the compiler pipeline]
```

When complete, send `[TASK_RESULT] [from:worker-b] [to:root]` message to root.
Reference file: `.claude/tree/genshin-ts-analysis/nodes/worker-b/workspace/structural-findings.md`
