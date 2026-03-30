# genshin-ts Structural Refactoring Plan

**Date:** 2026-03-28
**Companion document:** `structural-review.md` (full findings with file references)

---

## Overview

Issues are organized into three phases by impact and risk. Each phase is safe to execute independently — no phase requires another to be complete first, though Phase 1 reduces the surface area for Phase 2.

| Phase | Focus | Risk | # Changes |
|-------|-------|------|-----------|
| 1 | Deduplication & constants | Low — no API changes | 8 |
| 2 | Module boundary cleanup | Medium — file moves, internal refactoring | 8 |
| 3 | God file decomposition | High — large restructuring | 4 |

---

## Phase 1 — Deduplication & Constants (Low Risk)

These are surgical changes: extract a constant, deduplicate a function, delete a file. No external API changes. Each item can be done in a single focused commit.

### P1-1. Delete `ir_optimize_return_vars.ts`

**Issue:** H-9
**Files:** `src/runtime/ir_optimize_return_vars.ts`
**Action:** Delete the file. It is explicitly deprecated, unused, and the only place in `src/runtime/` that imports from `src/compiler/`.
**Risk:** Low — verify no callers with `grep -r 'ir_optimize_return_vars'` before deleting.

---

### P1-2. Define `DEFAULT_GRAPH_ID` constant

**Issue:** M-3
**Files:** `src/compiler/ir_to_gia_transform/shared.ts` (define), `src/compiler/ir_merge.ts`, `src/compiler/ir_to_gia_transform/index.ts` (import)
**Action:** Add `export const DEFAULT_GRAPH_ID = 1073741825` to `shared.ts`. Replace the two raw literals in `ir_merge.ts` and `index.ts` with the imported constant.
**Risk:** Zero — pure refactor, same value.

---

### P1-3. Define GIL header constants and extract `validateAndUnwrapGil`

**Issue:** M-4
**Files:** `src/injector/types.ts` (define constants), `src/injector/index.ts`, `src/injector/node_graph.ts`, `src/cli/gil_resources.ts` (use constants)
**Action:** Define `GIL_HEAD_TAG = 0x0326`, `GIL_TAIL_TAG = 0x0679`, `GIL_HEADER_SIZE = 20`, `GIL_TAIL_SIZE = 4` in `types.ts`. Extract `validateAndUnwrapGil(bytes: Uint8Array)` to `src/injector/binary.ts` or a new `src/injector/gil_format.ts`. Replace all three inline duplications.
**Risk:** Low — replace identical logic with one function, verify all three call sites.

---

### P1-4. Define `GRAPH_TYPES` constant for graph type integers

**Issue:** M-5
**Files:** `src/injector/types.ts` (define), `src/injector/index.ts`, `src/injector/folder.ts` (use)
**Action:** Define `const GRAPH_TYPES = { entity: 20000, status: 20003, class: 20004, item: 20005 } as const` in `types.ts`. Update `fmtGraphType` in `index.ts` to use named keys and align with `DEFAULT_GRAPH_TYPE_VALUES` in `folder.ts`.
**Risk:** Zero — pure rename of constants.

---

### P1-5. Deduplicate `runWithLimit`, `isRecord`, `camelToSnake`

**Issue:** M-1, M-2, L-1
**Files:** New `src/compiler/utils.ts` (or `src/compiler/parallel.ts` for `runWithLimit`), callers in `gs_to_ir_json_transform/index.ts`, `ir_to_gia_pipeline.ts`, `config_loader.ts`, `ir_merge.ts`, `runtime/core.ts`, `runtime/ir_builder.ts`
**Action:**
- Extract `runWithLimit<T, R>` (the Stage 3 more general version) to `src/compiler/parallel.ts`; update Stage 2 caller to use the same signature
- Extract `isRecord` to `src/compiler/utils.ts`; update `config_loader.ts` and `ir_merge.ts`
- Move `camelToSnake` to `src/runtime/utils.ts`; update `core.ts` and `ir_builder.ts`
**Risk:** Low — pure extraction, identical logic.

---

### P1-6. Deduplicate `isGstsServerName` and `isFunctionInitializer`

**Issue:** H-7
**Files:** `src/compiler/ts_to_gs_pipeline.ts`, `src/compiler/ts_to_gs_transform/index.ts`
**Action:** Export both from `ts_to_gs_transform/index.ts` (where they already live). Remove the duplicate definitions from `ts_to_gs_pipeline.ts` and add the import.
**Risk:** Zero — no behavior change.

---

### P1-7. Fix `ir_to_gia.ts` to use `DEFAULT_GIA_PROTO`

**Issue:** L-6
**Files:** `src/compiler/ir_to_gia.ts`
**Action:** Replace the manual `path.resolve(__dirname, '../thirdparty/...')` with `import { DEFAULT_GIA_PROTO } from '../../injector/proto.js'`.
**Risk:** Low — same path, just via the canonical constant.

---

### P1-8. Remove env var fallback from `irToGia()`

**Issue:** M-6
**Files:** `src/compiler/ir_to_gia_transform/index.ts`, `src/cli/gsts.ts`
**Action:** Remove `?? process.env.GSTS_OPT_TIMER_DISPATCH === '1'` from `irToGia()`. In `gsts.ts`, read `process.env.GSTS_OPT_TIMER_DISPATCH` and pass the boolean through `IrToGiaOptions`. `irToGia()` becomes env-agnostic and pure.
**Risk:** Low — behavior unchanged, but the env var must now be resolved by the CLI before calling `irToGia()`. Verify CLI sets this correctly.

---

## Phase 2 — Module Boundary Cleanup (Medium Risk)

These involve moving files, changing import graphs, and occasionally touching auto-generated code or build config. No changes to the external public API (`src/index.ts`).

### P2-1. Move `extractCustomResourcesFromGil` into `src/injector/`

**Issue:** H-8
**Files:** `src/cli/gil_resources.ts` → `src/injector/resources.ts` (new file)
**Action:** Create `src/injector/resources.ts` containing `extractCustomResourcesFromGil` and any supporting functions. Share `validateAndUnwrapGil` from P1-3. Update `src/cli/gsts.ts` to import from `src/injector/resources.ts` (not binary internals). Remove `src/cli/gil_resources.ts` or reduce it to a thin CLI wrapper.
**Risk:** Medium — changes the import graph; ensures CLI no longer reaches into injector internals. Verify all callers of `extractCustomResourcesFromGil`.

---

### P2-2. Rename `src/shared/` to `src/compiler/type_inference/`

**Issue:** M-10
**Files:** `src/shared/*.ts` → `src/compiler/type_inference/*.ts`, all importers (exclusively in `src/compiler/`)
**Action:** Move the three files. Update all import paths in `src/compiler/`. The directory rename correctly signals that these utilities are compiler-scoped.
**Risk:** Low — pure file move within a single module boundary. No external API impact.

---

### P2-3. Move `countTimersInSourceFile` and `rewriteRelativeModuleSpecifiers` to transform layer

**Issue:** H-6
**Files:** `src/compiler/ts_to_gs_pipeline.ts` → `src/compiler/ts_to_gs_transform/timer_counter.ts` and `src/compiler/ts_to_gs_transform/module_specifier.ts` (new files)
**Action:** Create two new files in `ts_to_gs_transform/`. Move the functions. Update `ts_to_gs_pipeline.ts` to import them. This completes the orchestrator/transform separation.
**Risk:** Medium — verify no other callers; the functions are currently not exported, so impact is local to `ts_to_gs_pipeline.ts`.

---

### P2-4. Extract enum import injection into `ts_to_gs_transform/enum_import.ts`

**Issue:** H-5
**Files:** `src/compiler/ts_to_gs_transform/index.ts` → `src/compiler/ts_to_gs_transform/enum_import.ts` (new file)
**Action:** Move `ensureEnumImport`, `findEnumImportInfo`, `makeRoundingModeImport`, and related helpers (~150 lines) to `enum_import.ts`. Re-export from `index.ts` or import directly in `transformToGs`.
**Risk:** Medium — careful about shared symbols referenced by both enum injection and the main transformer.

---

### P2-5. Extract validation and recursion detection to `ts_to_gs_transform/validate.ts`

**Issue:** H-5
**Files:** `src/compiler/ts_to_gs_transform/index.ts` → `src/compiler/ts_to_gs_transform/validate.ts` (new file)
**Action:** Move `validateGstsServerUsage`, `detectGstsServerRecursion`, and their helpers to `validate.ts`. Re-export from `index.ts` or call directly from the pipeline.
**Risk:** Medium — ensure the `Env` context type is shared correctly.

---

### P2-6. Make i18n scoped, remove global mutable singleton from injector

**Issue:** H-10
**Files:** `src/i18n/index.ts`, `src/injector/index.ts`
**Action:** Change `initCliI18n` to return a scoped `t` function without mutating global state (use i18next's `createInstance` pattern). Update `injector/index.ts` to accept a pre-bound `t` function (or resolve language internally without the global side effect). CLI entry point initializes i18n once and passes it through.
**Risk:** Medium — requires threading the `t` function through or adopting a different i18n pattern. Library consumers using `createInjector` with `lang` are affected.

---

### P2-7. Update code generation to remove `MetaCallRegistry` import from `definitions/nodes.ts`

**Issue:** H-3 (partial — preparation)
**Files:** `scripts/generate-definitions.ts`, `src/definitions/nodes.ts` (generated)
**Action:** Identify which part of the generated `nodes.ts` depends on `MetaCallRegistry`. Extract `ServerExecutionFlowFunctions` class (or its equivalent) into a new `runtime/execution_flow_functions.ts`. Update the generator to import from there instead of `runtime/core.ts`. The generated `nodes.ts` should only contain type declarations and parameter metadata.
**Risk:** High for this item alone — requires understanding the generator and the structure of `ServerExecutionFlowFunctions`. Worth doing in a focused branch. Mark as the Phase 2 stretch goal.

---

### P2-8. Co-locate feature flag defaults in `gsts_config.ts`

**Issue:** M-7
**Files:** `src/compiler/ts_to_gs_transform/types.ts`, `src/compiler/gsts_config.ts`
**Action:** Define `export const DEFAULT_FEATURE_FLAGS: GstsFeatureFlags = { ... }` in `gsts_config.ts`. Update `buildFeatureFlags` in `types.ts` to import and spread it.
**Risk:** Low — no behavior change, additive export.

---

## Phase 3 — God File Decomposition (High Risk)

These are the largest restructurings. Each should be a separate branch with thorough integration testing before merge.

### P3-1. Decompose `src/cli/gsts.ts`

**Issue:** H-1
**Target structure:**
```
src/cli/
├── gsts.ts               # argument parsing + command registration only (~200 lines)
├── dep_graph.ts          # DepGraph, collectModuleDeps, updateDepsForFile, collectDependents
├── backup.ts             # maybeBackupGil + backup path logic
├── commands/
│   ├── batch.ts          # runBatch implementation
│   ├── dev.ts            # runDev (watch loop, calls dep_graph.ts)
│   ├── single.ts         # runSingle
│   └── maps.ts           # runMaps
└── pipeline_runner.ts    # shared runPipeline(entryOutFiles, opts) function (M-11)
```
**Risk:** High — `gsts.ts` is the critical path for all CLI operations. Decomposition must preserve exact behavior. Start with `dep_graph.ts` extraction (most isolated, most testable) and `pipeline_runner.ts` (eliminates duplication), then tackle command modules.

---

### P3-2. Decompose `src/runtime/core.ts`

**Issue:** H-2
**Target structure:**
```
src/runtime/
├── core.ts               # server() factory + g export only (~150 lines)
├── gsts_global.ts        # ensureGsts(), GstsPublic, GstsCtxApi, gsts global
├── meta_call_registry.ts # MetaCallRegistry class (~450 lines)
├── ir_pipeline.ts        # removeUnusedNodesFromFlow + buildServerGraphRegistriesIRDocuments
└── (ir_builder.ts unchanged)
```
**Risk:** High — `MetaCallRegistry` is the central stateful engine. Moving it requires carefully tracking all imports; `core.ts` is transitively imported by much of the runtime. Do in a dedicated branch, run full build + end-to-end tests after.

---

### P3-3. Decompose `src/runtime/server_globals.ts`

**Issue:** H-4
**Target structure:**
```
src/runtime/
├── server_globals.ts     # Global API shim injection only
└── timer_globals.ts      # TimerOptions, TimerCaptureSpec, timer installation (~300 lines)
```
**Risk:** Medium-High — `server_globals.ts` and `timer_globals.ts` share context. The timer code interacts with the global shims. Carefully verify that timer capture metadata is still registered in the right execution order after the split.

---

### P3-4. Resolve bidirectional runtime↔definitions coupling (full fix)

**Issue:** H-3
**Target:** `definitions/nodes.ts` imports only from `runtime/value.ts`, `runtime/IR.d.ts`, `runtime/runtime_config.ts` — never from `runtime/core.ts`.
**Action:** Move `ServerExecutionFlowFunctions` to `runtime/execution_flow_functions.ts` (per P2-7). Update the code generator. Regenerate `definitions/nodes.ts`. Verify the import graph is now unidirectional.
**Risk:** High — requires generator changes + regeneration. The generated file is large (~10k lines). Test against real compilation of user code end-to-end after regeneration.

---

## Priority Recommendation

**Do first (Phase 1):** All 8 items are low-risk and can be batched into 2–3 PRs. Start with P1-1 (delete deprecated file) and P1-2–P1-5 (constants + deduplication) in one PR. Then P1-6–P1-8 in another.

**Do second (Phase 2):** P2-1 (`gil_resources` → injector), P2-2 (rename `shared/`), P2-8 (feature flag defaults) are the easiest. P2-3–P2-5 (compiler transform extraction) form a natural group. P2-6 (i18n) and P2-7 (definitions decoupling) are the hardest and should be planned separately.

**Plan separately (Phase 3):** These are restructurings that touch critical-path code. Each warrants its own branch and integration testing cycle. P3-1 (CLI god file) has the highest urgency for testability; P3-2 and P3-3 (runtime god files) have the highest structural value. P3-4 (definitions decoupling) is the correct endgame for the bidirectional dependency but is the most complex.

---

## Issue Cross-Reference

| Issue | Phase | Item | Severity |
|-------|-------|------|----------|
| H-1: gsts.ts god file | 3 | P3-1 | High |
| H-2: core.ts god file | 3 | P3-2 | High |
| H-3: runtime↔definitions cycle | 2+3 | P2-7, P3-4 | High |
| H-4: server_globals.ts mixed concerns | 3 | P3-3 | High |
| H-5: ts_to_gs_transform/index.ts | 2 | P2-4, P2-5 | High |
| H-6: pipeline.ts non-orchestration logic | 2 | P2-3 | High |
| H-7: isGstsServerName duplication | 1 | P1-6 | High |
| H-8: gil_resources CLI/injector boundary | 2 | P2-1 | High |
| H-9: ir_optimize_return_vars.ts | 1 | P1-1 | High |
| H-10: i18n global singleton | 2 | P2-6 | High |
| M-1: runWithLimit duplication | 1 | P1-5 | Medium |
| M-2: isRecord duplication | 1 | P1-5 | Medium |
| M-3: DEFAULT_GRAPH_ID | 1 | P1-2 | Medium |
| M-4: GIL header constants | 1 | P1-3 | Medium |
| M-5: graph type integers | 1 | P1-4 | Medium |
| M-6: env var in irToGia | 1 | P1-8 | Medium |
| M-7: feature flag defaults | 2 | P2-8 | Medium |
| M-8: signalTypeClassMap duplication | 2 | (within P3-2 scope) | Medium |
| M-9: variables.ts parser logic | 2 | (within P3-2 scope) | Medium |
| M-10: src/shared/ misnamed | 2 | P2-2 | Medium |
| M-11: pipeline sequence duplication in CLI | 3 | P3-1 | Medium |
| M-12: output path duplication | 1 | P1-7 (adjacent) | Medium |
| L-1: camelToSnake duplication | 1 | P1-5 | Low |
| L-2: ScalarType/NodeGraphVariableValueType | 2 | (within P3-4 scope) | Low |
| L-3: ir_optimize_return_vars naming | 1 | P1-1 | Low |
| L-4: CLI entry point naming | 2 | rename only | Low |
| L-5: list_utils/lists naming | 1 | rename only | Low |
| L-6: GIA_PROTO path duplication | 1 | P1-7 | Low |
| L-7: injectGil naming inconsistency | 2 | within P2-1 | Low |
| L-8: processDictParam hardcoded | 3 | within P3-4 | Low |
| L-9: mixed comment language | — | editorial | Low |
| L-10: unwrapGia exported unnecessarily | 1 | remove export | Low |
