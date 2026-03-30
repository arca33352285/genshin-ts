# genshin-ts Structural Code Review

**Date:** 2026-03-28
**Scope:** `src/runtime/`, `src/definitions/`, `src/compiler/`, `src/injector/`, `src/cli/`, `src/shared/`, `src/index.ts`
**Excludes:** IntelliSense / type-hint issues (covered separately in `intellisense-analysis.md`)
**Total issues found:** 32 (10 high, 12 medium, 10 low)

---

## Executive Summary

genshin-ts has four structural problems that matter most:

1. **God files at every major boundary.** `gsts.ts` (CLI, 1498 lines), `core.ts` (runtime, 1018 lines), `server_globals.ts` (runtime, 979 lines), and `ts_to_gs_transform/index.ts` (compiler, 497 lines) each conflate multiple distinct responsibilities. The CLI god file is the most urgent — it embeds a full incremental TypeScript dependency graph (~150 lines) that is completely untestable in isolation.

2. **The runtime↔definitions dependency is bidirectional.** `definitions/nodes.ts` (an auto-generated file) imports `MetaCallRegistry` from `runtime/core.ts`, while `runtime/core.ts` heavily imports from `definitions/`. This creates a logical cycle that prevents either layer from being used or tested independently.

3. **Duplication of small, concrete things.** `runWithLimit`, `isRecord`, `camelToSnake`, the default graph ID (`1073741825`), GIL header magic bytes, and graph type integers are each defined in 2–3 places. None is individually blocking, but collectively they represent maintenance risk when the codebase evolves.

4. **Mislabeled modules.** `src/shared/` contains compiler-internal type inference utilities used by nothing outside `src/compiler/`. The i18n module uses a global mutable singleton that makes multi-instance library usage unreliable. `gil_resources.ts` lives in `src/cli/` but directly imports injector binary internals.

The compiler pipeline's three-stage separation is sound — Stage 1/2/3 do not import each other. The injector module's internal structure is clean and cycle-free. These are the healthiest areas of the codebase.

---

## Section 1: High Impact Issues

### H-1. `gsts.ts` — 1498-line CLI god file

**File:** `src/cli/gsts.ts`

The CLI entry point contains: argument parsing, top-level command dispatch (`main`), batch compilation (`runBatch`), dev watch mode with a homegrown TypeScript dependency graph (`runDev`, ~600 lines), single-file mode (`runSingle`), map listing (`runMaps`), backup management (`maybeBackupGil`), resource extraction orchestration (`maybeExtractResources`), injection orchestration (`injectMany`, `maybeInjectGia`), config caching (`loadGstsConfigCached`), multiple path utility functions, and file type detection.

Most critically, the dev-mode TypeScript dependency tracking (`DepGraph`, `collectModuleDeps`, `updateDepsForFile`, `removeFileFromDeps`, `collectDependents`) is a full incremental dependency graph (~150 lines embedded inside `gsts.ts`) — the most complex algorithmic logic in the CLI — entirely untestable and unseparated from the watch loop.

**Fix:** Extract `DepGraph` and all dep-tracking functions to `src/cli/dep_graph.ts`. Extract `maybeBackupGil` and related backup logic to `src/cli/backup.ts`. Move `runBatch`/`runDev`/`runSingle` implementations to separate command modules. Keep `gsts.ts` for argument parsing, command registration in `main()`, and thin wrappers.

---

### H-2. `core.ts` — 1018-line runtime god file

**File:** `src/runtime/core.ts`

`core.ts` does all of:
- Defines `GstsPublic`/`GstsCtxApi` global injection API and the `gsts` global (`ensureGsts`)
- Houses `MetaCallRegistry` — the stateful graph builder (~450 lines, the largest class)
- Defines the `server()` factory and all its overloads
- Implements the "remove unused nodes" optimization (`removeUnusedNodesFromFlow`, ~75 lines)
- Assembles the final IR (`buildServerGraphRegistriesIRDocuments`)
- Manages the `serverRegistries` module-level global

These are four distinct concerns: (a) global setup, (b) the graph-recording engine, (c) the user-facing API factory, (d) IR finalization/optimization.

**Fix:**
- Move `MetaCallRegistry` to `runtime/meta_call_registry.ts`
- Move `removeUnusedNodesFromFlow` and `buildServerGraphRegistriesIRDocuments` to `runtime/ir_pipeline.ts` (alongside `ir_builder.ts`)
- Keep `core.ts` to just the `server()` factory and `g` export
- Move `ensureGsts()` to `runtime/gsts_global.ts`

---

### H-3. Bidirectional runtime↔definitions coupling

**Files:** `src/runtime/core.ts` ↔ `src/definitions/nodes.ts`

`runtime/core.ts` imports from `definitions/events.ts`, `definitions/events-payload.ts`, `definitions/nodes.ts`, `definitions/zh_aliases.ts`, and more. This is expected — the runtime needs game metadata. The cycle comes from the other direction: `definitions/nodes.ts` imports `MetaCallRegistry` from `runtime/core.ts`. Since `nodes.ts` is auto-generated, this coupling is baked into the generation script.

The result: neither layer is independently usable. Running `definitions/nodes.ts` requires initializing the runtime. The cycle also means `import type` discipline is needed to avoid circular module loading.

**Fix:** Extract the `ServerExecutionFlowFunctions` class (currently defined in `definitions/nodes.ts` but depending on `MetaCallRegistry`) into `runtime/execution_flow_functions.ts`. The auto-generated `definitions/nodes.ts` would then only carry type declarations and parameter metadata — no dependency on `runtime/core.ts`. Dependency graph becomes unidirectional: `runtime/ → definitions/` for metadata; `definitions/ → runtime/` only for value primitive types.

---

### H-4. `server_globals.ts` — 979-line file mixing global injection with timer semantics

**File:** `src/runtime/server_globals.ts`

Two very different responsibilities in one file:
1. Installing global shims (`installServerGlobals`, `installScopedServerGlobals`) — injecting `bool()`, `int()`, `str()`, `stage`, `player`, `Math` overrides into `globalThis`
2. Implementing complex timer domain logic: timer pooling (setTimeout/setInterval → node graph nodes), type conversion chains, stage bootstrap, entity helpers wiring (~300 lines)

The timer implementation is sophisticated enough to stand alone and is conceptually unrelated to global shim installation.

**Fix:** Extract timer-related code (`TimerOptions`, `TimerCaptureSpec`, timer installation functions, `registerTimerHandlerOnce`, `attachTimerCaptureMeta`) to `runtime/timer_globals.ts`. Keep `server_globals.ts` focused on global API surface injection.

---

### H-5. `ts_to_gs_transform/index.ts` — 497-line god file mixing validation, enum injection, and the main transformer

**File:** `src/compiler/ts_to_gs_transform/index.ts`

The transform index contains: server function validation logic (`validateGstsServerUsage`), recursion detection via DFS (`detectGstsServerRecursion`), the main transformer factory (`transformToGs`), enum import injection (`ensureEnumImport`, `findEnumImportInfo`, `makeRoundingModeImport`, ~150 lines), and symbol resolution helpers. These responsibilities would each fit cleanly in their own file.

**Fix:** Extract enum import logic to `enum_import.ts`. Extract validation and recursion detection to `validate.ts`. Keep `index.ts` as the entry point that wires them together and exports `transformToGs`.

---

### H-6. `ts_to_gs_pipeline.ts` contains non-orchestration transform logic

**File:** `src/compiler/ts_to_gs_pipeline.ts`

The pipeline orchestrator contains two full AST transforms that belong in the transform layer:
- `countTimersInSourceFile` (lines 57–95): A full AST visitor traversing the TS source to count timers
- `rewriteRelativeModuleSpecifiers` (lines 97–182): A full TypeScript transformer rewriting import specifiers

Both are transform-domain logic embedded in what should be a pure orchestrator.

**Fix:** Move `countTimersInSourceFile` to `ts_to_gs_transform/` (e.g., `timer_counter.ts`). Move `rewriteRelativeModuleSpecifiers` to `ts_to_gs_transform/` (e.g., `module_specifier.ts`). Keep `ts_to_gs_pipeline.ts` as pure orchestration.

---

### H-7. `isGstsServerName` and `isFunctionInitializer` duplicated across pipeline and transform

**Files:** `src/compiler/ts_to_gs_pipeline.ts` (lines 32–39), `src/compiler/ts_to_gs_transform/index.ts` (lines 25–32)

Both functions are defined with identical implementations in both files. If the server naming convention changes, both must be updated.

**Fix:** Export from `ts_to_gs_transform/index.ts` and import in `ts_to_gs_pipeline.ts`. Alternatively, resolves automatically when `countTimersInSourceFile` is moved to the transform layer (H-6).

---

### H-8. `gil_resources.ts` breaks the CLI/injector boundary

**File:** `src/cli/gil_resources.ts`

`gil_resources.ts` lives in `src/cli/` but directly imports `findAncestorFields`, `parseMessage`, `readUint32BE`, `readVarint` from `src/injector/binary.ts` — injector binary internals. It also duplicates the GIL header validation logic (`headTag !== 0x0326 || tailTag !== 0x0679`, `payload = bytes.slice(20, -4)`) that already exists in `src/injector/index.ts`, and independently implements a protobuf field walk using raw magic path coordinates.

**Fix:** Move `extractCustomResourcesFromGil` into `src/injector/` (or a new `src/injector/resources.ts`). The GIL header validation and payload unpacking should be a single shared function called from both injector and resource extraction. This removes the CLI's dependency on injector internals.

---

### H-9. `ir_optimize_return_vars.ts` — deprecated file with a cross-layer import

**File:** `src/runtime/ir_optimize_return_vars.ts`

This file imports `IRNode` from `../compiler/ir_to_gia_transform/types.js` — the only place in `src/runtime/` that imports from `src/compiler/`. The function it exports (`optimizeReturnVars`) is explicitly commented as deprecated ("弃用的优化"). This file inverts the pipeline direction (runtime should not know about compiler internals) and is documented as unused.

**Fix:** Delete the file. If it needs to be kept for reference, archive it outside `src/` or move the `IRNode` type it needs into `runtime/IR.d.ts`.

---

### H-10. `src/i18n/` global mutable singleton breaks multi-instance library usage

**File:** `src/i18n/index.ts`

`initCliI18n` silently mutates a global i18next singleton. When multiple `Injector` instances are created with different `lang` options, each call to `injectBytes` re-calls `initCliI18n(detectLang(...))`, overwriting the global language. The last call wins, producing mixed-language output in multi-instance scenarios.

Additionally, `injector/index.ts` imports from `src/i18n/` — meaning the injector (a library module) has a runtime dependency on the CLI's i18n singleton.

**Fix:** `initCliI18n` should return a scoped `t` function bound to the specified language without mutating global state. The `t` closure already returned is the right shape — remove the global side effect. Move i18n initialization out of the injector library into the CLI entry point only.

---

## Section 2: Medium Impact Issues

### M-1. `runWithLimit` duplicated between Stage 2 and Stage 3 orchestrators

**Files:** `src/compiler/gs_to_ir_json_transform/index.ts` (lines 57–68), `src/compiler/ir_to_gia_pipeline.ts` (lines 89–107)

Two slightly different implementations of the same parallel-execution concurrency limiter. The Stage 3 version returns `R[]`; Stage 2 returns `void`.

**Fix:** Extract to `src/compiler/parallel.ts` exporting `runWithLimit<T, R>`. Both orchestrators import from there.

---

### M-2. `isRecord` duplicated between `config_loader.ts` and `ir_merge.ts`

**Files:** `src/compiler/config_loader.ts` (line 26), `src/compiler/ir_merge.ts` (line 34)

Identical implementations of `function isRecord(v: unknown): v is Record<string, unknown>`.

**Fix:** Move to `src/compiler/utils.ts` (or `src/shared/` once it is renamed per M-10).

---

### M-3. Magic number `1073741825` (default graph ID) in three files

**Files:** `src/compiler/ir_merge.ts` (line 274), `src/compiler/ir_to_gia_transform/shared.ts` (line 15), `src/compiler/ir_to_gia_transform/index.ts` (line 185)

The default graph ID appears as a raw literal three times with no explanation.

**Fix:** Define `const DEFAULT_GRAPH_ID = 1073741825` once in `ir_to_gia_transform/shared.ts` (or a new `ir_constants.ts`) and import it where needed.

---

### M-4. GIL header magic bytes and payload slice range duplicated across three files

**Files:** `src/injector/index.ts`, `src/cli/gil_resources.ts`, `src/injector/node_graph.ts`

The magic tags `0x0326`/`0x0679` and the payload slice `bytes.slice(20, -4)` are each duplicated across multiple files with no shared constants. GIL file structure constants (header size = 20, tail size = 4) are never named.

**Fix:** Define `GIL_HEAD_TAG = 0x0326`, `GIL_TAIL_TAG = 0x0679`, `GIL_HEADER_SIZE = 20`, `GIL_TAIL_SIZE = 4` in `src/injector/types.ts` or a `constants.ts`. Extract `validateAndUnwrapGil(bytes)` as a shared function.

---

### M-5. Graph type magic numbers (20000/20003/20004/20005) repeated across two files

**Files:** `src/injector/index.ts` (lines 44–59), `src/injector/folder.ts` (lines 4–8)

The graph type integers appear in `fmtGraphType` (raw switch-case numbers) and `DEFAULT_GRAPH_TYPE_VALUES` (a Map with names) without a shared constant definition.

**Fix:** Define a `GRAPH_TYPES` constant object or `const enum` in `src/injector/types.ts` and reference from both files.

---

### M-6. `timerDispatchAggregate` optimization reads a hidden env var inside `irToGia()`

**File:** `src/compiler/ir_to_gia_transform/index.ts` (lines 195–196)

```ts
const timerDispatchAggregate =
  opts.optimize?.timerDispatchAggregate ?? process.env.GSTS_OPT_TIMER_DISPATCH === '1'
```

`irToGia()` reads a hardcoded undocumented environment variable, bypassing the options object. This makes the function non-pure and difficult to test without environment mutation.

**Fix:** Remove the env var fallback from `irToGia()`. Let the CLI resolve `process.env.GSTS_OPT_TIMER_DISPATCH` and pass the flag through `IrToGiaOptions`. This keeps `irToGia()` pure and env-agnostic.

---

### M-7. Feature flag defaults not co-located with the config schema

**File:** `src/compiler/ts_to_gs_transform/types.ts` (lines 115–126)

Default values for `GstsFeatureFlags` are defined inside `buildFeatureFlags` in `types.ts`, not in `gsts_config.ts` where the schema lives. A user reading `gsts_config.ts` to understand default behavior will not find the defaults there.

**Fix:** Add a `DEFAULT_FEATURE_FLAGS` constant to `gsts_config.ts` (or `@default` JSDoc on each flag field) co-located with the type definition.

---

### M-8. `signalTypeClassMap` in `core.ts` is a partial duplicate of `buildConnValueType`

**File:** `src/runtime/core.ts` (lines 563–573)

`registerEvent` contains a local `signalTypeClassMap` mapping type strings to constructors. This is a partial version of the type-string-to-class mapping that already exists in `buildConnValueType` (in `ir_builder.ts`) and in `generic.asType()` (in `value.ts`). Three places enumerate a subset of value types by string name.

**Fix:** Export a canonical `VALUE_CLASS_MAP: Record<string, new () => value>` from `value.ts` and replace `signalTypeClassMap` and any similar local maps with a reference to this export.

---

### M-9. `variables.ts` contains extensive parser logic

**File:** `src/runtime/variables.ts` (~657 lines)

The bulk of `variables.ts` is a layered parser for variable initial values (scalar, list, dict parsing, type inference). This parser is not "variable management" — it is a compile-time validation step.

**Fix:** Extract `parseVariableDefinitions` and all its helpers to `runtime/variable_parser.ts`, keeping `variables.ts` for type declarations only (`VariablesDefinition`, `NodeGraphVariableMeta`, `NodeGraphVarApi`).

---

### M-10. `src/shared/` is misnamed — utilities are compiler-only

**Files:** `src/shared/ts_list_utils.ts`, `src/shared/ts_type_utils.ts`, `src/shared/type_string_utils.ts`

All three files work exclusively with TypeScript compiler APIs and are consumed only by `src/compiler/`. Nothing imports `src/shared/` from `src/cli/`, `src/injector/`, or `src/runtime/`. The name `shared` implies cross-module availability.

**Fix:** Rename `src/shared/` to `src/compiler/type_inference/` or `src/compiler/shared/`.

---

### M-11. `src/cli/gsts.ts` duplicates the Stage 2→3 pipeline sequence in two branches

**File:** `src/cli/gsts.ts` (lines 511–556 in `runBatch`, lines 806–851 in `runChanged`)

The sequence `emitIrJsonForEntries → mergeIrJsonFilesByGraphId → plan GIA tasks → writeGiaFromIrJsonFiles` is duplicated with minor variations between `runBatch` and the incremental `runChanged` path. If the pipeline changes, both branches must be updated.

**Fix:** Extract to a shared `runPipeline(entryOutFiles, opts)` function that accepts an optional `allowGraphIds` set for incremental mode.

---

### M-12. Output path resolution duplicated between CLI entry and pipeline module

**Files:** `src/compiler/ir_to_gia.ts` (lines 51–60), `src/compiler/ir_to_gia_transform/shared.ts` (lines 71–78)

Both independently compute whether the output path is a directory and construct `.gia` file paths. The logic is nearly identical.

**Fix:** The CLI entry `ir_to_gia.ts` should call `resolveGiaOutputPath` from `shared.ts` instead of reimplementing path resolution.

---

## Section 3: Low Impact / Naming Issues

### L-1. `camelToSnake` defined twice in `runtime/`

**Files:** `src/runtime/core.ts` (line 316), `src/runtime/ir_builder.ts` (line 35)

Near-identical implementations; variable name is the only difference.

**Fix:** Move to `src/shared/` (or a new `runtime/utils.ts`) and import from both files.

---

### L-2. `ScalarType` and `NodeGraphVariableValueType` partially duplicate `ValueType` in `IR.d.ts`

**File:** `src/runtime/variables.ts` (lines 67–79 and 636–658)

Two related but slightly different value type enumerations exist in `variables.ts`, alongside the canonical `ValueType` union in `IR.d.ts`. Three partial enumerations exist across the codebase.

**Fix:** Derive `ScalarType` and `NodeGraphVariableValueType` from `ValueType` using `Extract<ValueType, ...>` rather than duplicating string literals.

---

### L-3. `ir_optimize_return_vars.ts` name suggests relevance despite being deprecated

**File:** `src/runtime/ir_optimize_return_vars.ts`

The name looks like an active optimization module, but the file is explicitly deprecated. Risk: it could be accidentally referenced.

**Fix:** Delete (per H-9), or rename to `_deprecated_ir_optimize_return_vars.ts` until deletion.

---

### L-4. CLI entry points `ts_to_gs.ts` and `ir_to_gia.ts` naming ambiguous vs pipeline modules

**Files:** `src/compiler/ts_to_gs.ts`, `src/compiler/ir_to_gia.ts`

These call `program.parse()` (they are CLI entry points) but live next to `ts_to_gs_pipeline.ts` and `ir_to_gia_pipeline.ts` (reusable orchestrators) without a clear naming distinction.

**Fix:** Rename to `ts_to_gs_cmd.ts`/`ir_to_gia_cmd.ts`, or move CLI entry points to `src/compiler/cli/`.

---

### L-5. `list_utils.ts` and `lists.ts` naming is ambiguous

**Files:** `src/compiler/ts_to_gs_transform/lists.ts` (76 lines), `src/compiler/ts_to_gs_transform/list_utils.ts` (357 lines)

`lists.ts` handles type inference for list types; `list_utils.ts` handles detecting list-like expressions. The naming does not communicate this distinction. `list_utils.ts` is 5x larger than `lists.ts` despite having a "utils" suffix.

**Fix:** Rename `lists.ts` to `list_types.ts`.

---

### L-6. `GIA_PROTO` path duplicated between `ir_to_gia.ts` and `shared.ts`

**Files:** `src/compiler/ir_to_gia.ts` (lines 10–14), `src/compiler/ir_to_gia_transform/shared.ts` (line 4)

`ir_to_gia.ts` manually constructs the proto path from `__dirname`; `shared.ts` imports `DEFAULT_GIA_PROTO` from `injector/proto.js`. Two different mechanisms resolve the same file.

**Fix:** `ir_to_gia.ts` should import `DEFAULT_GIA_PROTO` from `injector/proto.js` and drop the manual path construction.

---

### L-7. Naming inconsistency: `injectGilBytes`/`injectGilFile` vs `Injector.injectBytes`/`Injector.injectFile`

**File:** `src/injector/index.ts`

Standalone functions include "Gil" in the name; `Injector` interface methods drop it. Both operate on GIL files.

**Fix:** Add "Gil" to the `Injector` method names (`injectGilBytes`, `injectGilFile`) for consistency with the standalone API. (Or drop "Gil" from the standalone names — but the explicit qualifier is useful since GIL is the file format name.)

---

### L-8. `processDictParam` is a hardcoded special-case in `core.ts`

**File:** `src/runtime/core.ts` (lines 324–331)

`processDictParam` has a `switch` with a single case `'purchaseItemDictionary'`, with a `default` that throws. Any new dict-typed event parameter requires a code change here.

**Fix:** Add optional `dictKeyType`/`dictValueType` fields to event parameter metadata in `definitions/events.ts` and the generation script. `processDictParam` then reads from metadata rather than hardcoding cases.

---

### L-9. Mixed comment language across runtime files

**Files:** Throughout `src/runtime/`

Comments mix Korean, Chinese, and English within the same files (e.g., `core.ts` uses Korean doc comments, Chinese inline implementation notes, and English error messages).

**Fix:** Standardize on Korean for doc comments, English for inline implementation notes and error messages. Code-generated files may retain their generated language.

---

### L-10. `unwrapGia` exported from `node_graph.ts` but only used internally

**File:** `src/injector/node_graph.ts` (line 70)

`unwrapGia` is exported but only called from within `node_graph.ts` itself. No other file references it.

**Fix:** Remove the `export` keyword unless intentionally part of the module's API.

---

## Section 4: Dependency Structure Summary

### Confirmed healthy (no cycles, clean separation)
- `src/injector/` — no cycles; `binary.ts` and `types.ts` are roots; `index.ts` is the only orchestration point
- `src/compiler/` — Stage 1/2/3 do not import each other; no cycles detected
- `src/cli/` does NOT import from `src/runtime/` directly — correctly uses the library API

### Confirmed violations
- `src/runtime/core.ts ↔ src/definitions/nodes.ts` — bidirectional logical cycle (H-3)
- `src/runtime/ir_optimize_return_vars.ts → src/compiler/ir_to_gia_transform/types.ts` — runtime importing compiler (H-9)
- `src/injector/index.ts → src/i18n/index.ts` — library module importing CLI i18n singleton (H-10)
- `src/cli/gil_resources.ts → src/injector/binary.ts` — CLI importing injector internals (H-8)

### Notable but acceptable coupling
- `src/compiler/gs_to_ir_json_transform/runner.ts → src/runtime/core.ts` — architecturally necessary (subprocess executes user code and reads IR); should be documented
- `src/compiler/ir_to_gia_transform/index.ts → src/runtime/IR`, `value`, `variables` — data type imports only, not execution coupling
- `src/compiler/ir_to_gia_transform/shared.ts → src/injector/proto.ts` — minor layering concern (compiler importing from injector for proto path); could be a shared constant instead
