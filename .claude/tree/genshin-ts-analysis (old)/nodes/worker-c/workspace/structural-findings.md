# worker-c Structural Findings: Injector, CLI, Shared & Cross-Cutting

**Date:** 2026-03-28
**Scope:** `src/injector/`, `src/cli/`, `src/shared/`, `src/index.ts`, `src/i18n/`, `src/thirdparty/`

---

## High Impact Issues

### H-1. `gsts.ts` is a 1498-line god file mixing orchestration, watch logic, dep-graph management, and I/O
**File:** `src/cli/gsts.ts`
**Problem:** The file contains: argument parsing, top-level command dispatch (`main`), batch compilation (`runBatch`), dev watch mode with a homegrown TypeScript dependency graph (`runDev` ~600 lines), single-file mode (`runSingle`), map listing (`runMaps`), backup management (`maybeBackupGil`), resource extraction orchestration (`maybeExtractResources`), injection orchestration (`injectMany`, `maybeInjectGia`), config caching (`loadGstsConfigCached`), config loading helpers, multiple path utility functions, and file type detection.

The dev-mode dependency tracking (`DepGraph`, `collectModuleDeps`, `updateDepsForFile`, `removeFileFromDeps`, `collectDependents`) is a full incremental dependency graph spanning ~150 lines, entirely embedded inside `gsts.ts`. This is the most complex internal logic in the CLI and has no tests or separation from the watch loop.

**Suggestion:** Extract the dep-graph management into `src/cli/dep_graph.ts`, the backup logic into `src/cli/backup.ts`, and `runBatch`/`runDev`/`runSingle` into separate command modules. `gsts.ts` should only contain argument parsing, command registration in `main()`, and thin wrappers that call into those modules.

---

### H-2. `gil_resources.ts` is in `src/cli/` but directly imports and re-uses `src/injector/binary.ts` parsing internals
**File:** `src/cli/gil_resources.ts:15`
**Problem:** `gil_resources.ts` imports `findAncestorFields`, `parseMessage`, `readUint32BE`, `readVarint` from `../injector/binary.ts` and duplicates the GIL header validation logic (`headTag !== 0x0326 || tailTag !== 0x0679`, `payload = bytes.slice(20, -4)`) that also exists in `src/injector/index.ts`. It independently implements a protobuf parsing walk using raw field numbers (magic path coordinates like `p0 === 4 && p1 === 1 && p2 === 6 && p3 === 11 && p4 === 1`), making it extremely fragile against GIL format changes.

The file is tightly coupled to `injector/binary.ts` internals but lives in `src/cli/` — it can't be easily tested in isolation without also pulling in the binary parsing layer.

**Suggestion:** Move `extractCustomResourcesFromGil` into `src/injector/` or a shared `src/gil/` module, alongside the existing binary parsing code. The GIL header validation and payload unpacking should be a single function called from both `injector/index.ts` and wherever resource extraction lives.

---

### H-3. `injector/index.ts` mixes I/O, orchestration, binary manipulation, and display formatting into one function
**File:** `src/injector/index.ts`
**Problem:** The `injectBytes` function (~170 lines) does all of: header parsing, magic byte validation, protobuf parsing, NodeGraph location, folder index resolution, type mismatch checking (with user-facing warnings via `console.warn`), non-empty safety check, protobuf mutation, binary replacement, and final file construction. The `fmtGraphType` helper (which formats display strings for warnings) also lives in this file rather than with the i18n layer.

The `injectFile` function reads files from disk and writes results, but is a thin wrapper. This is reasonable. The problem is `injectBytes` itself is both the orchestration entry point and the place where all the semantic decisions live.

**Suggestion:** The non-empty check logic (lines 155–166) and type mismatch warning logic (lines 134–152) are semantic policies that could be cleanly isolated as named helper functions or moved to a `checks.ts` in the injector. `fmtGraphType` belongs with i18n utilities, not in `index.ts`.

---

### H-4. `src/i18n/` is initialized with mutable global state via a module-level singleton
**File:** `src/i18n/index.ts:53–72`
**Problem:** `initCliI18n` silently mutates a global i18next singleton. When called multiple times with different `lang` values (which happens in the CLI — e.g., `runBatch` initializes it, then `injectBytes` re-initializes it, then `signal_nodes.ts` receives a pre-bound `t` closure), the language silently changes. The injector's `injectBytes` calls `initCliI18n(detectLang(...))` on every invocation, which means each injection operation may change the global i18n language.

This design means that in library usage (multiple `Injector` instances with different `lang` options), the last `initCliI18n` call wins globally, leading to mixed-language output.

**Suggestion:** `initCliI18n` should return a scoped `t` function bound to the specified language, without mutating global state. The i18next singleton is a reasonable implementation detail, but the public API should not expose the global mutation. The `t` closure already returned is the right shape — the problem is the side effect on the global instance.

---

## Medium Impact Issues

### M-1. Magic numbers for graph types repeated across two files with no shared constant definition
**Files:** `src/injector/index.ts:44–59`, `src/injector/folder.ts:4–8`
**Problem:** The graph type integers (20000, 20003, 20004, 20005) appear in both `fmtGraphType` in `index.ts` and `DEFAULT_GRAPH_TYPE_VALUES` in `folder.ts`. They represent named concepts (entity, status, class, item) but there is no shared constant or enum — `folder.ts` has the names in its Map but `index.ts` switch-cases on the raw numbers independently.

**Suggestion:** Define a `GRAPH_TYPES` constant object or `const enum` in `types.ts` and reference it from both files.

---

### M-2. GIL header magic bytes and payload slice range are duplicated across three files
**Files:** `src/injector/index.ts:89,93`, `src/cli/gil_resources.ts:189–195`, `src/injector/node_graph.ts:71`
**Problem:**
- `headTag !== 0x0326 || tailTag !== 0x0679` appears in both `injector/index.ts` and `gil_resources.ts`
- `bytes.slice(20, -4)` (payload extraction) appears in `injector/index.ts`, `injector/node_graph.ts` (`unwrapGia`), and `gil_resources.ts`
- The GIL file structure constants (header size = 20, tail size = 4, magic tags) are never defined as named constants

**Suggestion:** Define `GIL_HEAD_TAG = 0x0326`, `GIL_TAIL_TAG = 0x0679`, `GIL_HEADER_SIZE = 20`, `GIL_TAIL_SIZE = 4` in `types.ts` or a `constants.ts`. Extract `validateAndUnwrapGil(bytes)` as a shared function.

---

### M-3. `injectGilBytes` / `injectGilFile` construct a new `Injector` on every call, re-parsing the proto schema each time (without hitting the cache when `protoPath` is undefined)
**File:** `src/injector/index.ts:220–228`
**Problem:** `injectGilBytes` calls `createInjector(options)`, which calls `loadGiaProto(options?.protoPath)`. When `protoPath` is undefined, `loadGiaProto` uses `DEFAULT_GIA_PROTO` and the cache works. But `injectGilFile` passes `{ protoPath: options.protoPath }` — if `options.protoPath` is undefined, the argument is `{ protoPath: undefined }`, and `loadGiaProto(undefined)` resolves to the default path, which is cached. So the cache does work in practice, but the wrapper design creates a new `Injector` object on every call unnecessarily. The API design encourages users to call `injectGilFile` repeatedly (in a batch loop), creating unnecessary object allocations.

**Suggestion:** Document that `injectGilBytes`/`injectGilFile` are convenience wrappers that construct a single-use Injector. Or merge them so they share a proto singleton directly. The current design is not a serious performance problem (proto is cached), but the API surface has four entry points (`createInjector`, `injectGilBytes`, `injectGilFile`, plus `Injector.injectBytes`/`Injector.injectFile`) for essentially two operations.

---

### M-4. `src/cli/gsts.ts` duplicates `emitIrJsonForEntries` + `mergeIrJsonFilesByGraphId` call patterns in two separate branches
**File:** `src/cli/gsts.ts:511–556` (in `runBatch`) and `src/cli/gsts.ts:806–851` (in `runChanged`)
**Problem:** The sequence — call `emitIrJsonForEntries`, then resolve IR paths, then `mergeIrJsonFilesByGraphId`, then plan GIA tasks, then `writeGiaFromIrJsonFiles` — is duplicated with minor variations between `runBatch` and the incremental `runChanged` path inside `runDev`. The difference is that `runBatch` operates on all entry files, while `runChanged` operates on a subset. If the pipeline changes, both branches must be updated.

**Suggestion:** Extract the pipeline sequence into a shared `runPipeline(entryOutFiles, opts)` function that accepts an optional `allowGraphIds` set for incremental mode.

---

### M-5. `src/cli/checks.ts` hardcodes GitHub raw URLs directly in source code
**File:** `src/cli/checks.ts:15–24`
**Problem:** The URLs for update and notice checks are `const URLS` with GitHub raw content URLs hardcoded. This is a maintenance concern (if the URL scheme changes, the file must be updated and released), but more importantly, there is no mechanism for users to disable or redirect these checks. The checks also silently call `saveState(state)` on every invocation, modifying persistent CLI state as a side effect of showing a check.

**Suggestion:** Minor concern — the URLs could be constants in a separate `src/cli/remote_config.ts`, making them easy to locate. The "disable check" path is controlled by `streak >= 3`, which throttles but doesn't allow explicit opt-out without modifying source.

---

### M-6. `src/shared/` utilities are compiler-only; they are not general-purpose shared utilities
**Files:** `src/shared/ts_list_utils.ts`, `src/shared/ts_type_utils.ts`, `src/shared/type_string_utils.ts`
**Problem:** All three files in `src/shared/` work exclusively with TypeScript compiler APIs (`typescript` package) and are consumed only by the compiler pipeline (`src/compiler/`). They are not used by the injector, CLI, or runtime. The directory name `shared` implies utilities available to all modules, but these are actually compiler-internal helpers.

`ts_list_utils.ts` re-exports `inferConcreteTypeFromString` and `inferListTypeFromTypeString` from `type_string_utils.ts` — these are the only cross-file references within `src/shared/`. The module has a flat dependency chain with no cycles.

**Suggestion:** Rename `src/shared/` to `src/compiler/type_inference/` or `src/compiler/shared/` to accurately reflect that these utilities are scoped to the compiler. This prevents future confusion about what "shared" means in this codebase.

---

### M-7. `src/cli/gsts.ts` `runDev` contains ~150 lines of inline TypeScript dependency graph management
**File:** `src/cli/gsts.ts:326–422`
**Problem:** `collectModuleDeps`, `DepGraph`, `updateDepsForFile`, `removeFileFromDeps`, `collectDependents`, `normForMap` form a complete incremental dependency tracking system. This system calls `ts.createSourceFile` and `ts.resolveModuleName` to parse and resolve TypeScript imports, then builds a bidirectional dependency graph. This is the most complex algorithmic logic in the CLI and is entirely untestable as embedded code.

**Suggestion:** Extract to `src/cli/dep_graph.ts` as a self-contained module. The interface is clear: `buildDepGraph`, `updateDepsForFile`, `removeFileFromDeps`, `collectDependents`. This would make the watch mode's incremental logic independently testable.

---

## Low Impact / Naming

### L-1. Naming inconsistency: `injectGilBytes`/`injectGilFile` vs `Injector.injectBytes`/`Injector.injectFile`
**File:** `src/injector/index.ts:220–228`, `src/index.ts:17`
**Problem:** The standalone functions include "Gil" in the name (`injectGilBytes`, `injectGilFile`); the `Injector` interface methods drop it (`injectBytes`, `injectFile`). Since both operate on GIL files, the naming should be consistent. The public barrel exports all four names.

**Suggestion:** Either add "Gil" to the method names on `Injector` (`injectGilBytes`, `injectGilFile`), or remove "Gil" from the standalone function names. Prefer the former since "GIL" is the file format name and both the input type and the operation name benefit from the explicit qualifier.

---

### L-2. `src/injector/node_graph.ts` exports `unwrapGia` but the function is only used internally
**File:** `src/injector/node_graph.ts:70`
**Problem:** `unwrapGia` (extracts the protobuf payload from a GIA byte buffer) is exported but only called from within `node_graph.ts` itself (`loadGiaGraph`). It is not used by any other file.

**Suggestion:** Make `unwrapGia` unexported unless it is intentionally part of the injector's internal module API.

---

### L-3. `src/cli/gsts.ts` uses inline type predicates in `.filter()` callbacks instead of named guard functions
**File:** `src/cli/gsts.ts:541–548`, `src/cli/gsts.ts:997–1005`
**Problem:** The same complex inline type predicate:
```ts
.filter((t): t is { irPath: string; outFile?: string; opts?: ... } => Boolean(t))
```
appears twice in `gsts.ts`. The type is defined inline rather than being a named type alias.

**Suggestion:** Define `type GiaTask = { irPath: string; outFile?: string; opts?: ... }` and use it in both places.

---

### L-4. `src/cli/gsts.ts` `preparseArgv` partially duplicates what `commander` will parse later
**File:** `src/cli/gsts.ts:190–200`
**Problem:** `preparseArgv` manually parses `--config`/`-c` and `--lang` from `argv` to allow pre-loading the config file before Commander is set up (needed so the CLI description can be i18n-translated). This is a reasonable workaround but the `--lang=value` parsing (`a.startsWith('--lang=')`) is not equivalent to Commander's short form (`-l`) since no short form for `--lang` exists. The comment explaining why this pre-parse exists would help future maintainers.

**Suggestion:** Add a comment explaining that `preparseArgv` exists specifically to bootstrap i18n before Commander runs, so the help text can be translated. No code change required, but the comment is missing.

---

### L-5. `src/cli/gsts.ts` mixes `console.log` and `ui.*` calls inconsistently
**File:** `src/cli/gsts.ts:510`, `src/cli/gsts.ts:809`, `src/cli/gsts.ts:1414`
**Problem:** Most CLI output goes through `ui.ok`, `ui.info`, `ui.warn`, `ui.error`. But several `console.log('')` calls (blank line separators) and one `console.log` for file output bypass the `ui` abstraction. The `ui` object has no `blank()` or separator method.

**Suggestion:** Add a `ui.blank()` method (or just `ui.separator()`) to make all console output go through the same abstraction. Alternatively, use `console.log('')` consistently for blank lines and note it is intentional.

---

### L-6. `src/injector/signal_nodes.ts` defines `readFieldMessages` and `readFieldBytes` which partially duplicate `parseMessage` from `binary.ts`
**File:** `src/injector/signal_nodes.ts:41–120`
**Problem:** `readFieldMessages` and `readFieldBytes` are custom protobuf field scanners that duplicate the wire-type dispatch logic from `parseMessage` in `binary.ts` (same varint reading, same wire type branching: 0/1/2/5). The difference is that these functions operate on a single field at a specific target field number rather than collecting all fields recursively. This duplication is reasonable for performance (avoiding the full recursive parse), but the varint reading and wire-skip logic is identical and could cause divergence if the wire format handling changes.

**Suggestion:** Low priority — the performance motivation is valid. Add a comment documenting why these are separate from `parseMessage`.

---

## Dependency Map

### `src/injector/` import graph
```
index.ts
  ├── binary.ts          (pure binary utils: varint, field parser, patch builder)
  ├── folder.ts          → binary.ts (uses readVarint)
  ├── node_graph.ts      → binary.ts (uses readVarint), protobufjs
  ├── proto.ts           → protobufjs (clean wrapper, no internal deps)
  ├── signal_nodes.ts    → binary.ts (uses parseMessage, readVarint)
  └── types.ts           (no imports — shared types only)
```
No cycles. `binary.ts` and `types.ts` are the roots. `folder.ts`, `node_graph.ts`, `signal_nodes.ts` import from `binary.ts` only. `proto.ts` is isolated from the other injector files. `index.ts` imports from all others and is the only orchestration point.

**Note:** `index.ts` also imports from `src/i18n/index.ts` (for `detectLang`, `initCliI18n`) — this is the only injector file with a dependency outside `src/injector/`. This cross-module dependency means the injector cannot be used without the i18n module being available, even if the caller provides a pre-translated `t` function.

### `src/cli/` import graph
```
gsts.ts
  ├── compiler/config_loader.js, gsts_config.js, ir_merge.js, ir_to_gia_pipeline.js, ts_to_gs_pipeline.js
  ├── compiler/gs_to_ir_json_transform/index.js
  ├── i18n/index.js
  ├── injector/index.js      (uses injectGilFile)
  ├── ./checks.ts            → data.ts, markdown_render.ts, net.ts, notice_frontmatter.ts, pkg.ts, state.ts, ui.ts, update_changelog.ts
  ├── ./data.ts              (no CLI deps)
  ├── ./gil_paths.ts         → compiler/config_loader.js, compiler/gsts_config.js
  ├── ./gil_resources.ts     → definitions/prefabs.js, i18n/index.js, injector/binary.js, injector/types.js
  ├── ./state.ts             → data.ts
  ├── ./ui.ts                (no CLI deps — picocolors only)
  └── ./windows_open.ts      (no CLI deps)
```

**Cross-module coupling:** `gil_resources.ts` imports from `src/injector/binary.ts` and `src/injector/types.ts` — a CLI file reaching into injector internals. `gil_paths.ts` imports from `src/compiler/` (config types). These are the only two non-trivial cross-module edges from `src/cli/`.

**`src/cli/` does NOT import from `src/runtime/`** — it goes through the library API (`injector/index.ts`, `compiler/*.ts`). This boundary is correctly maintained.

### `src/shared/` import graph
```
ts_list_utils.ts  → ts_type_utils.ts, type_string_utils.ts
ts_type_utils.ts  → type_string_utils.ts
type_string_utils.ts  (no imports)
```
No cycles. These files are imported exclusively by `src/compiler/` modules. Nothing imports `src/shared/` from `src/cli/`, `src/injector/`, or `src/runtime/`.

### `src/thirdparty/` integration
The thirdparty directory contains a single package: `Genshin-Impact-Miliastra-Wonderland-Code-Node-Editor-Pack/` with subdirectories `gia_gen/`, `node_data/`, `protobuf/`. Only `proto.ts` (in `src/injector/`) accesses thirdparty content — it hardcodes the path to `protobuf/gia.proto` relative to `__dirname`. No thirdparty internals leak into other modules. This is clean.

### `src/index.ts` barrel
The barrel exports: compiler API (`compileTsToGs`, `compileTsToGsFromConfig`, `emitIrJsonForEntries`, `hasEntryMarker`, `resolveIrOutputPath`, `resolveGiaOutputPath`, `writeGiaFromIrJsonFile`, `writeGiaFromIrJsonFiles`), injector API (`createInjector`, `injectGilBytes`, `injectGilFile` + all injector types), and `src/definitions/prefabs.js` (via `export *`).

The `export * from './definitions/prefabs.js'` is the only wildcard re-export. This is potentially over-exposing — if `prefabs.js` adds new exports in the future, they are automatically part of the public API without an explicit decision. All other exports are explicit, which is better practice.

---

## Summary

The injector module is well-structured internally: files have focused responsibilities (`binary.ts` for wire parsing, `folder.ts` for folder navigation, `node_graph.ts` for NodeGraph location/mutation, `proto.ts` for schema loading, `signal_nodes.ts` for signal patching), and there are no cycles. The main structural problems in the injector are: (1) GIL magic constants and header validation are duplicated in three places, (2) the graph type integers are defined twice without a shared constant, and (3) `index.ts`'s `injectBytes` function is doing too much in a single body — it is both the orchestrator and the place where all semantic validation logic lives.

The CLI has a significant god-file problem: `gsts.ts` at 1498 lines combines argument parsing, all command implementations, a full incremental TypeScript dependency graph, backup management, and resource extraction. The dev-mode dependency tracker is the most complex piece of code in the CLI and is completely embedded and untestable. The CLI correctly avoids importing from `src/runtime/`, but `gil_resources.ts` breaks the injector/CLI boundary by importing directly from injector internals and duplicating GIL parsing logic.

The `src/shared/` directory is misnamed — its three files are compiler-internal type inference utilities with no connection to the injector, CLI, or runtime. The `src/i18n/` module uses a global mutable singleton that creates unexpected language switching behavior when multiple injector calls use different `lang` options. The public barrel is mostly well-scoped, but the `export *` from `prefabs.js` is a minor future-proofing concern.
