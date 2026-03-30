# Task: IntelliSense Review — Compiler Pipeline (worker-b)

## Scope

Analyze these directories for IntelliSense/type-hint quality issues:

- `src/compiler/gsts_config.ts` — user-facing config schema
- `src/compiler/ts_to_gs_pipeline.ts` — Stage 1 public API
- `src/compiler/gs_to_ir_json_transform/index.ts` — Stage 2 public API
- `src/compiler/ir_to_gia_pipeline.ts` — Stage 3 public API
- `src/compiler/ir_to_gia_transform/types.ts` — Stage 3 internal types
- `src/compiler/ir_merge.ts`
- `src/compiler/ts_to_gs_transform/types.ts`

Focus only on the types/interfaces that are either exported or that shape the API surface seen by consumers.

## What to Look For

### 1. `any` usage
Find all explicit `any` annotations and implicit `any` inferences. For each:
- Note the file:line
- Explain what the value actually represents
- Suggest a concrete replacement type

### 2. Config type completeness (`GstsConfig`)
- Are all fields documented with JSDoc?
- Are string fields that have a fixed set of valid values typed as string literal unions?
- Are optional fields clearly marked and their defaults documented?
- Does IntelliSense autocomplete the config object usefully?

### 3. Compiler stage result types
- `TsToGsCompileResult` — are all fields well-typed and documented?
- `GsToJsonOptions` — same
- `GiaWriteResult` — same
- `IrToGiaParallelOptions` — same
- Are callback types (`onWriteGs?`, `onWriteGia?`, `onOkLine?`) fully typed?

### 4. Missing generics / type narrowing
- Do compiler functions use generics where they could provide better return type inference?
- Any places where the return type is wider than necessary (e.g. `Promise<any>` or `Promise<void>` when structured data is returned)?

### 5. JSDoc gaps
- All exported function signatures: missing `@param` / `@returns`
- GstsConfig fields: missing inline comments or JSDoc

## Deliverable

Write findings to: `.claude/tree/genshin-ts-analysis/nodes/worker-b/workspace/findings.md`

Structure:
```
# worker-b Findings: Compiler Pipeline

## Critical Issues (high IntelliSense impact)
[list with file:line, problem, suggested fix]

## Moderate Issues
[list with file:line, problem, suggested fix]

## Minor / JSDoc gaps
[list with file:line, what's missing]

## Summary
[2-3 sentence summary of the biggest problems in this area]
```

When complete, send TASK_RESULT to root node.
