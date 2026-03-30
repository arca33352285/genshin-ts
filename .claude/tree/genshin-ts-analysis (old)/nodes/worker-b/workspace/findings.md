# worker-b Findings: Compiler Pipeline

## Critical Issues (high IntelliSense impact)

### 1. `compileTsToGsFromConfig` — untyped return
**File:** `src/compiler/ts_to_gs_pipeline.ts:367`
**Problem:** The function has no explicit return type annotation. TypeScript infers `Promise<{ cfgAbsPath: string; cfgDir: string; cfg: GstsConfig; compileRoot: string; outDir: string; outFiles: string[]; entryOutFiles: string[] }>`, but consumers see no named type. IntelliSense shows a long anonymous object — no way to reference it externally.
**Suggested fix:** Extract and export a named type `TsToGsCompileFromConfigResult` (intersection or explicit type) and annotate the return.

### 2. `emitIrJsonForEntries` — implicit `Promise<void>` hides nothing returned on early exit
**File:** `src/compiler/gs_to_ir_json_transform/index.ts:70`
**Problem:** Returns `Promise<void>`. When `entries` is empty the function returns `undefined` (which is fine for `void`), but there is no way for a caller to know how many files were processed or whether anything happened. The parallel-result data is entirely invisible.
**Suggested fix:** Return `Promise<{ processed: number }>` or at minimum document that void means "all succeeded or threw". Low priority if this is intentionally fire-and-forget, but currently callers cannot distinguish "nothing to do" from "did work".

### 3. `GsToJsonOptions.runtimeOptions` — undocumented sub-object, no JSDoc
**File:** `src/compiler/gs_to_ir_json_transform/index.ts:16-19`
**Problem:** `GsToJsonOptions` has no JSDoc at all. The `runtimeOptions` sub-object maps to env-var flags sent to a subprocess (`GSTS_PRECOMPILE_EXPR`, `GSTS_REMOVE_UNUSED_NODES`) — this is completely invisible to IntelliSense users.
**Suggested fix:** Add JSDoc to `GsToJsonOptions` and each field, especially `runtimeOptions`.

---

## Moderate Issues

### 4. `GstsConfig.options` — missing JSDoc
**File:** `src/compiler/gsts_config.ts:206`
**Problem:** The `options?: GstsTransformOptions` field in `GstsConfig` has no JSDoc comment, while all surrounding fields do. A consumer hovering over `options` in their config object sees nothing.
**Suggested fix:** Add a brief JSDoc: e.g., `/** Transform and optimization options. */`.

### 5. `TsToGsCompileResult` — fields not documented
**File:** `src/compiler/ts_to_gs_pipeline.ts:225-230`
**Problem:** `TsToGsCompileResult` exports four fields (`compileRoot`, `outDir`, `outFiles`, `entryOutFiles`) with no JSDoc. The distinction between `outFiles` (all emitted `.gs.ts`) and `entryOutFiles` (only those with `@gsts:entry` marker) is important for downstream pipeline stages but is not documented.
**Suggested fix:** Add per-field JSDoc clarifying the `entryOutFiles` subset semantics.

### 6. `TsToGsCompileParams.onWriteGs` callback — `isEntry` parameter undocumented
**File:** `src/compiler/ts_to_gs_pipeline.ts:219-222`
**Problem:** The callback signature `(outFile: string, isEntry: boolean) => void` has a comment for `onWriteGs` but does not document what `isEntry` means.
**Suggested fix:** Expand JSDoc: `@param isEntry - true when the file carries a \`@gsts:entry\` marker and will be fed to Stage 2`.

### 7. `IrToGiaParallelOptions` — `cwd` undocumented
**File:** `src/compiler/ir_to_gia_pipeline.ts:22-29`
**Problem:** `IrToGiaParallelOptions.cwd` has no JSDoc. It is passed as the working directory for spawned runner subprocesses — non-obvious behaviour.
**Suggested fix:** Add `/** Working directory for spawned runner processes. Defaults to process.cwd(). */`.

### 8. `WriteGiaFromIrJsonFileOptions.preserveIndices` — JSDoc references `includeIndices` but doesn't explain the default
**File:** `src/compiler/ir_to_gia_transform/shared.ts:26-28`
**Problem:** The JSDoc says "keep original index in output file names" but doesn't state what happens when this is `false`/omitted (re-numbered from 0). Minor ambiguity, moderate impact on usability.
**Suggested fix:** Append `Defaults to false (indices are re-numbered starting from 0).`

### 9. `GstsFeatureFlags` — no JSDoc on any field
**File:** `src/compiler/gsts_config.ts:1-9`
**Problem:** All boolean flags (`whileCondition`, `doWhile`, `continue`, `switch`, `destructuring`, `ternary`, `nullishCoalesce`) lack JSDoc. Consumers enabling these flags get no hints about what they control or their risk level.
**Suggested fix:** Add a one-line JSDoc per flag describing what language feature it enables.

### 10. `ir_to_gia_pipeline.ts` — internal `GiaTask` type not exported despite being the parameter type of public API
**File:** `src/compiler/ir_to_gia_pipeline.ts:31`
**Problem:** `GiaTask = { irPath: string; outFile?: string; opts?: WriteGiaFromIrJsonFileOptions }` is used as the element type of the `tasks` parameter of the exported `writeGiaFromIrJsonFiles`. Because it is not exported, consumers must write the shape inline or infer it — IntelliSense shows the structural type rather than a named type.
**Suggested fix:** Export `GiaTask` (or rename it `IrToGiaTask` to match the naming convention).

---

## Minor / JSDoc gaps

### 11. `src/compiler/gsts_config.ts` — `GstsLang` and `GstsGameRegion` have no JSDoc
Lines 86-88: Both string literal union types are self-explanatory but lack any description. Adding a one-liner each would help IntelliSense tooltip display.

### 12. `src/compiler/ts_to_gs_pipeline.ts:208` — `TsToGsCompileParams.cfgDir` undocumented
The `cfgDir` field (directory of the config file, used as base for resolving `compileRoot` / `outDir`) has no JSDoc. Only the more complex fields have comments.

### 13. `src/compiler/ts_to_gs_pipeline.ts:208` — `TsToGsCompileParams.emitEntries` / `programEntries` JSDoc is present but doesn't explain the incremental use case clearly
The comments say "Optional entries used only for … (dev incremental)" but don't explain the relationship: `programEntries` governs the full TypeScript program (type-checking scope), `emitEntries` controls which files are actually written to disk. Worth expanding slightly.

### 14. `src/compiler/ir_to_gia_transform/types.ts` — all three exported types lack JSDoc
`Position`, `NodeId`, `IRNode` (lines 3-6) are exported but entirely undocumented. These are internal-facing but appear in the public `ir_to_gia_transform` surface.

### 15. `src/compiler/ts_to_gs_transform/types.ts` — several `Env` fields lack JSDoc
`Env` (line 44) is a large internal context struct. Fields like `gstsIdent`, `returnMode`, `returnDepth`, `breakName`, `breakKind`, `localNames`, `localVarNames`, `localSymbols`, `localVarSymbols`, `shadowedNames` lack any comments. Low impact (internal type), but consistent documentation would help contributors.

### 16. `src/compiler/ir_merge.ts:248` — `MergeGroupResult.merged` field undocumented
`merged: IRDocument` inside `MergeGroupResult` has no JSDoc. Not immediately obvious whether this is the in-memory merged document (yes) or a path.

---

## Summary

The most impactful issue is that `compileTsToGsFromConfig` (the top-level entry point for Stage 1) returns an anonymous inferred type — consumers cannot name or import the result shape. Across all three pipeline stages the callback and parallel-options types (`onWriteGs`, `GsToJsonOptions`, `IrToGiaParallelOptions`, `GiaTask`) are either undocumented or not exported, making the API surface harder to use without reading the source. The `GstsConfig` type itself is well-documented except for the `options` field and the entire `GstsFeatureFlags` block, which is the area most likely to confuse end users customizing their config.
