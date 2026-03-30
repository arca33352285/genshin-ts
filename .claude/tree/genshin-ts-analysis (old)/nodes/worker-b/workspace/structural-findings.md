# worker-b Structural Findings: Compiler Pipeline

## High Impact Issues

### 1. `ts_to_gs_pipeline.ts` contains non-pipeline transform logic
**File:** `src/compiler/ts_to_gs_pipeline.ts`

The pipeline file (`ts_to_gs_pipeline.ts`) is supposed to be the Stage 1 orchestrator, but it contains substantial AST analysis and transform logic that belongs in the transform layer:
- `countTimersInSourceFile` (lines 57–95): A full AST visitor that traverses the TS source tree to count timers. This is transform-domain logic. It belongs in `ts_to_gs_transform/`.
- `rewriteRelativeModuleSpecifiers` (lines 97–182): A full TypeScript transformer that rewrites import specifiers. This is another AST transform step, not orchestration.
- `loadTsConfig` (lines 184–206): Could be argued as setup, but the duplication concern is less severe here.

**Suggestion:** Move `countTimersInSourceFile` into `ts_to_gs_transform/` (a new file like `timer_counter.ts` or into `index.ts`). Move `rewriteRelativeModuleSpecifiers` into `ts_to_gs_transform/` as well (e.g., `module_specifier.ts`). Keep `ts_to_gs_pipeline.ts` as pure orchestration.

---

### 2. `ts_to_gs_transform/index.ts` is a god file with mixed responsibilities
**File:** `src/compiler/ts_to_gs_transform/index.ts` (497 lines)

The transform index handles far more than just being an entry point. It contains:
- Server function validation logic (`validateGstsServerUsage`, lines ~302–358)
- Recursion detection via DFS (`detectGstsServerRecursion`, lines ~360–409)
- The main transformer factory (`transformToGs`, lines 232–483)
- Enum import injection (`ensureEnumImport`, `findEnumImportInfo`, `makeRoundingModeImport`, lines 81–230)
- Symbol resolution helpers (`getCallSymbol`, `resolveAliasedSymbol`, `isGstsServerCall`, etc.)

Most of this logic is substantial enough to warrant its own files. The enum injection alone (150 lines) would fit in `enum_import.ts`. Validation and recursion detection would fit in `validate.ts`.

**Suggestion:** Extract enum import logic to `enum_import.ts` and validation/recursion detection to `validate.ts`. Keep `index.ts` as the entry that wires them together.

---

### 3. `isGstsServerName` and `isFunctionInitializer` duplicated across module boundary
**Files:** `src/compiler/ts_to_gs_pipeline.ts` (lines 32–39), `src/compiler/ts_to_gs_transform/index.ts` (lines 25–32)

Both `isGstsServerName` and `isFunctionInitializer` are independently defined with identical implementations in the pipeline orchestrator and the transform index. The pipeline needs them to pre-scan for timer counting, but since the same logic lives in the transform layer, it creates a maintenance coupling: if the server naming convention changes, both files must be updated.

**Suggestion:** Export `isGstsServerName` and `isFunctionInitializer` from `ts_to_gs_transform/index.ts` and import them into `ts_to_gs_pipeline.ts`. Alternatively, move the timer-counting logic fully into the transform layer and export a helper.

---

### 4. `gs_to_ir_json_transform/runner.ts` imports directly from `src/runtime/`
**File:** `src/compiler/gs_to_ir_json_transform/runner.ts` (lines 5–6)

```ts
import { buildServerGraphRegistriesIRDocuments } from '../../runtime/core.js'
import { setRuntimeOptions } from '../../runtime/runtime_config.js'
```

The runner is executed as a subprocess to run user-authored `.gs.ts` code and produce IR. Its direct coupling to `runtime/` is intentional — it calls into the runtime to collect the emitted IR. However, this means Stage 2 is structurally coupled to the runtime layer. This is architecturally necessary but should be explicitly documented. The current comment says nothing about why Stage 2 must invoke the runtime.

**Suggestion:** Add a brief comment in `runner.ts` explaining that this subprocess intentionally invokes the runtime to execute user code and collect IR output, distinguishing it from the compiler stages which should not depend on runtime.

---

## Medium Impact Issues

### 5. `runWithLimit` duplicated between Stage 2 and Stage 3 orchestrators
**Files:**
- `src/compiler/gs_to_ir_json_transform/index.ts` (lines 57–68): `async function runWithLimit<T>(items, limit, worker)`
- `src/compiler/ir_to_gia_pipeline.ts` (lines 89–107): `async function runWithLimit<T, R>(items, limit, worker)`

Two slightly different versions of the same parallel-execution concurrency limiter are defined in isolation. The Stage 3 version is more general (returns `R[]`), while Stage 2 returns `void`. This is unnecessary duplication.

**Suggestion:** Extract to a shared utility, e.g., `src/compiler/parallel.ts` exporting `runWithLimit<T, R>`. Both orchestrators import from there.

---

### 6. `isRecord` duplicated between `config_loader.ts` and `ir_merge.ts`
**Files:**
- `src/compiler/config_loader.ts` (line 26)
- `src/compiler/ir_merge.ts` (line 34)

Both define `function isRecord(v: unknown): v is Record<string, unknown>` with identical implementations.

**Suggestion:** Move to a shared utility in `src/compiler/utils.ts` or `src/shared/`.

---

### 7. Magic number `1073741825` repeated across three files without a named constant
**Files:**
- `src/compiler/ir_merge.ts` (line 274)
- `src/compiler/ir_to_gia_transform/shared.ts` (line 15)
- `src/compiler/ir_to_gia_transform/index.ts` (line 185)

The value `1073741825` is the default graph ID used when none is specified. It appears as a raw literal three times with no named constant.

**Suggestion:** Define `const DEFAULT_GRAPH_ID = 1073741825` once (e.g., in `ir_to_gia_transform/shared.ts` or a new `ir_constants.ts`) and import it where needed.

---

### 8. Magic number `100000001` for `uid` in `ir_to_gia_transform/index.ts`
**File:** `src/compiler/ir_to_gia_transform/index.ts` (line 187)

```ts
const uid = opts.uid ?? 100000001
```

No comment explains what `uid` represents or why this default value is correct. The concept is not surfaced in `IrToGiaOptions` documentation either.

**Suggestion:** Add a comment explaining that `uid` is the player/user ID field in the GIA format and that `100000001` is a conventionally safe placeholder. If it's a game-engine constant, name it `GIA_DEFAULT_UID`.

---

### 9. `timerDispatchAggregate` optimization wired via environment variable bypass
**File:** `src/compiler/ir_to_gia_transform/index.ts` (line 195–196)

```ts
const timerDispatchAggregate =
  opts.optimize?.timerDispatchAggregate ?? process.env.GSTS_OPT_TIMER_DISPATCH === '1'
```

The optimization flag is read from both the config options object and a hardcoded environment variable name. The env var is set by the CLI (`src/cli/gsts.ts`). This means `irToGia()` has a hidden runtime dependency on an undocumented env var that bypasses the options object — making it harder to unit-test or compose without env mutation.

**Suggestion:** Remove the env var fallback from `irToGia()`. Let the CLI resolve the env var and pass the flag explicitly through `IrToGiaOptions`. This keeps `irToGia()` pure.

---

### 10. Feature flag defaults hardcoded in `buildFeatureFlags`, not in `gsts_config.ts`
**File:** `src/compiler/ts_to_gs_transform/types.ts` (lines 115–126)

Default feature flag values are defined inside `buildFeatureFlags` in `types.ts`, separate from the config schema definitions in `gsts_config.ts`. A user reading `gsts_config.ts` to understand which flags are enabled by default will not find the defaults there.

**Suggestion:** Co-locate the defaults either in `gsts_config.ts` (as a `DEFAULT_FEATURE_FLAGS` constant) or in a JSDoc `@default` annotation on each flag field in `GstsFeatureFlags`.

---

### 11. Output path resolution duplicated between `ir_to_gia.ts` (CLI) and `ir_to_gia_transform/shared.ts`
**Files:**
- `src/compiler/ir_to_gia.ts` (lines 51–60): Determines output path, handles single vs. multi-document.
- `src/compiler/ir_to_gia_transform/shared.ts` (lines 71–78): Same logic again.

Both files independently compute whether the output path is a directory and construct `.gia` file paths. The logic is nearly identical.

**Suggestion:** The CLI entry `ir_to_gia.ts` could call `writeGiaFromIrJsonFile` from `shared.ts` instead of reimplementing path resolution. However, since `ir_to_gia.ts` reads raw bytes separately, refactoring would require a small interface adjustment — worth doing for deduplication.

---

## Low Impact / Naming

### 12. `ts_to_gs.ts` and `ir_to_gia.ts` are CLI entry points, not pipeline modules
**Files:** `src/compiler/ts_to_gs.ts`, `src/compiler/ir_to_gia.ts`

These two files are CLI entry points (they call `program.parse()`), but they live next to the pipeline orchestrators `ts_to_gs_pipeline.ts` and `ir_to_gia_pipeline.ts`. The naming convention does not distinguish entry points from reusable pipeline modules. `ts_to_gs_pipeline.ts` has an explicit `_pipeline` suffix; the entry point lacks a corresponding suffix like `_cli` or `_cmd`.

**Suggestion:** Rename to `ts_to_gs_cmd.ts` / `ir_to_gia_cmd.ts`, or move CLI entry points to a dedicated `src/compiler/cli/` subdirectory to separate them from the reusable pipeline modules.

---

### 13. `list_utils.ts` and `lists.ts` naming is ambiguous
**Files:** `src/compiler/ts_to_gs_transform/lists.ts` (76 lines), `src/compiler/ts_to_gs_transform/list_utils.ts` (357 lines)

Both files relate to list/collection handling. `lists.ts` handles type inference for list types; `list_utils.ts` handles detecting list-like expressions. The naming does not communicate the distinction well — `list_utils.ts` has a suffix suggesting it is the helper, but it is almost 5x larger than `lists.ts`.

**Suggestion:** Rename `lists.ts` to `list_types.ts` (it deals with type inference for list types) to clarify the distinction.

---

### 14. Internal helpers in `ts_to_gs_transform/index.ts` not clearly marked
**File:** `src/compiler/ts_to_gs_transform/index.ts`

Functions like `getCallSymbol`, `resolveAliasedSymbol`, `isGstsServerCall`, `isGstsServerFunctionDecl`, `isTopLevelVarDeclaration` are unexported module-internal helpers. They are not clearly grouped or separated from the exported API (`transformToGs`, `hasServerEntryCall`). In a 497-line file, this makes the public API harder to identify quickly.

**Suggestion:** Group and co-locate the exported functions at the bottom or top of the file with a clear comment block, or use the extraction suggested in issue #2.

---

### 15. `GIA_PROTO` path construction in `ir_to_gia.ts` vs `DEFAULT_GIA_PROTO` in `proto.js`
**Files:** `src/compiler/ir_to_gia.ts` (lines 10–14), `src/compiler/ir_to_gia_transform/shared.ts` (line 4)

`ir_to_gia.ts` manually constructs the proto path relative to `__dirname`:
```ts
const GIA_PROTO = path.resolve(__dirname, '../thirdparty/...')
```
while `shared.ts` imports `DEFAULT_GIA_PROTO` from `../../injector/proto.js`. This means two different mechanisms resolve the same proto file path.

**Suggestion:** `ir_to_gia.ts` should also import `DEFAULT_GIA_PROTO` from `injector/proto.js` and drop the manual path construction.

---

## Dependency Map

```
config_loader.ts         <- gsts_config.ts (types)
ts_to_gs_pipeline.ts     <- config_loader, gsts_config, ts_to_gs_transform/index, ts_to_gs_transform/matcher
gs_to_ir_json_transform/index.ts  <- (no compiler deps — runs subprocess)
gs_to_ir_json_transform/runner.ts <- runtime/core, runtime/runtime_config  [subprocess entry]
ir_merge.ts              <- runtime/IR (types only), i18n
ir_to_gia_pipeline.ts    <- ir_to_gia_transform/shared
ir_to_gia_transform/index.ts   <- runtime/IR, runtime/value, runtime/variables, gia_vendor, layout, node_id, optimize_timer_dispatch, pins, preprocess, types
ir_to_gia_transform/shared.ts  <- injector/proto, runtime/IR, ir_to_gia_transform/index
ir_to_gia_transform/runner.ts  <- ir_to_gia_transform/shared  [subprocess entry]

CLI entries:
ts_to_gs.ts              <- config_loader, gs_to_ir_json_transform/index, ts_to_gs_pipeline
ir_to_gia.ts             <- runtime/IR (type), ir_to_gia_transform/index
```

**Inter-stage dependencies:**
- Stage 1 does NOT import Stage 2 or Stage 3 at the pipeline level. (Clean)
- Stage 2 does NOT import Stage 1 or Stage 3. (Clean)
- Stage 3 does NOT import Stage 1 or Stage 2. (Clean)
- The CLI entry `ts_to_gs.ts` chains Stage 1 and then calls Stage 2 — this is the intended chaining point. (Acceptable)

**No cycles detected** in the compiler module graph.

**Notable cross-layer coupling:**
- `gs_to_ir_json_transform/runner.ts` imports `runtime/core` and `runtime/runtime_config`. This is architecturally necessary (it executes user `.gs.ts` code and reads IR from the runtime), not a structural mistake, but it is undocumented.
- `ir_to_gia_transform/index.ts` imports `runtime/IR`, `runtime/value`, `runtime/variables`. These are data type/schema imports only (no execution-time runtime coupling), which is acceptable.
- `ir_to_gia_transform/shared.ts` imports `injector/proto.js`. This creates a dependency from the compiler stage into the injector subsystem for the proto path. This is arguably a layering violation — the proto path resolution could live in a shared constants module instead.

---

## Summary

The compiler pipeline has a clean three-stage separation at the top level (Stage 1/2/3 do not import each other), and the directory structure clearly reflects the pipeline steps. The primary structural problems are: `ts_to_gs_pipeline.ts` mixes orchestration with two substantial AST transform steps that belong in the transform layer; `ts_to_gs_transform/index.ts` has grown into a god file mixing validation, recursion detection, enum injection, and the main transform; and two small but concrete duplications (`runWithLimit`, `isRecord`, default graph ID) exist across the codebase without extraction. The naming of CLI entry points (`ts_to_gs.ts`, `ir_to_gia.ts`) is ambiguous relative to the pipeline modules they sit next to, and the `list_utils.ts`/`lists.ts` pair has confusingly symmetric names for distinct responsibilities. None of these issues are blockers, but the god-file and misplaced transform logic represent the highest-priority structural debt.
