# genshin-ts Codebase Analysis Report

## 1. Project Overview and Purpose

**genshin-ts** (CLI: `gsts`) is a TypeScript-to-NodeGraph toolchain for building server-side logic in Genshin Impact's UGC mode, *Miliastra Wonderland*. Users write game event logic in TypeScript; the toolchain compiles it into the proprietary `.gia` binary format and injects it into `.gil` map files that the game reads.

The game's native authoring tool uses a visual node graph editor. genshin-ts replaces that visual workflow with a code-first approach: TypeScript source → compiled node graph → injected into map.

**Key capabilities:**
- Full TS type hints for game events, entity APIs, enumerations, and prefab/resource IDs
- Chinese and English language aliases for all event/function names
- Compilation pipeline with intermediate representations useful for debugging
- Compile-time optimizations: constant folding, dead node removal, timer pooling
- CLI for incremental builds, map discovery, injection with safety checks, and auto-backup

---

## 2. Public API Surface (`src/index.ts`)

All public exports are grouped by domain below.

### 2.1 Compiler — Config Type

| Export | Kind | Description |
|--------|------|-------------|
| `GstsConfig` | `type` | Top-level user configuration schema. Fields: `compileRoot` (string), `entries` (string[] with glob support), `outDir` (string), `options?` (GstsTransformOptions), `lang?` (GstsLang), `inject?` (GstsInjectConfig) |

**Supporting types (not directly exported from index, but part of GstsConfig):**

- `GstsTransformOptions` — `loopMax?` (number, default 999), `features?` (Partial\<GstsFeatureFlags\>), `optimize?` (Partial\<GstsOptimizeOptions\>)
- `GstsFeatureFlags` — per-feature boolean gates: `whileCondition`, `doWhile`, `continue`, `switch`, `destructuring`, `ternary`, `nullishCoalesce`
- `GstsOptimizeOptions` — `precompileExpression?`, `removeUnusedNodes?`, `timerPool?` ({ setTimeout?, setInterval? }), `timerDispatchAggregate?`
- `GstsInjectConfig` — `gameRegion?` ('China'|'Global'), `playerId?`, `mapId?`, `nodeGraphId?`, `skipSafeCheck?`, `reinjectOnMapChange?`, `extractResources?`, `resourcesPath?`
- `GstsLang` — `'auto' | 'zh-CN' | 'en-US'`
- `GstsGameRegion` — `'China' | 'Global'`

### 2.2 Compiler — Stage 1: TS → .gs.ts

| Export | Kind | Signature | Description |
|--------|------|-----------|-------------|
| `compileTsToGs` | `function` | `(params: TsToGsCompileParams) => Promise<TsToGsCompileResult>` | Runs Stage 1: transforms user `.ts` files into `.gs.ts` files via TypeScript AST rewriting. Accepts optional incremental `emitEntries`/`programEntries` overrides. |
| `compileTsToGsFromConfig` | `function` | `(configPath: string) => Promise<{cfgAbsPath, cfgDir, cfg, ...TsToGsCompileResult}>` | Convenience wrapper: loads `gsts.config.ts` from disk, then calls `compileTsToGs`. |

**Supporting types:**
- `TsToGsCompileParams` — `cfgDir`, `cfg`, `emitEntries?`, `programEntries?`, `onWriteGs?`
- `TsToGsCompileResult` — `compileRoot`, `outDir`, `outFiles`, `entryOutFiles`

### 2.3 Compiler — Stage 2: .gs.ts → IR .json

| Export | Kind | Signature | Description |
|--------|------|-----------|-------------|
| `emitIrJsonForEntries` | `function` | `(entries: string[], opts?: GsToJsonOptions) => Promise<void>` | Runs Stage 2 for each `.gs.ts` entry. Spawns subprocess runners in parallel (controlled by `maxParallel`). Writes a `.json` IR file next to each entry. |
| `hasEntryMarker` | `function` | `(text: string) => boolean` | Returns true if the file text contains the `// @gsts:entry` comment on its first line (used to identify files that should be treated as entry points). |
| `resolveIrOutputPath` | `function` | `(entryFile: string) => string` | Converts a `.gs.ts` path to its companion `.json` IR path (replaces `.gs.ts` suffix with `.json`). |

**Supporting type:**
- `GsToJsonOptions` — `maxParallel?`, `compact?`, `cwd?`, `runtimeOptions?` ({ precompileExpression?, removeUnusedNodes? })

### 2.4 Compiler — Stage 3: IR .json → .gia

| Export | Kind | Signature | Description |
|--------|------|-----------|-------------|
| `resolveGiaOutputPath` | `function` | `(irJsonPath: string) => string` | Converts an IR `.json` path to its companion `.gia` output path. |
| `writeGiaFromIrJsonFile` | `function` | `(irPath: string, outFile?: string, opts?: WriteGiaFromIrJsonFileOptions, onWriteGia?: (res: GiaWriteResult) => void) => GiaWriteResult[]` | Synchronously reads an IR JSON, converts to `.gia` bytes, and writes to disk. Supports multi-document JSON arrays with optional `includeIndices`. |
| `writeGiaFromIrJsonFiles` | `function` | `(tasks: GiaTask[], opts?: IrToGiaParallelOptions) => Promise<GiaWriteResult[]>` | Parallel version of Stage 3: spawns subprocess runners for each task, respects `maxParallel`. |

**Supporting types:**
- `WriteGiaFromIrJsonFileOptions` — `includeIndices?` (number[]), `preserveIndices?` (boolean)
- `GiaWriteResult` — `{ irPath, giaPath, graphId, sourceIndex }`
- `IrToGiaParallelOptions` — `maxParallel?`, `cwd?`, `onOkLine?` (progress callback)

### 2.5 Injector

| Export | Kind | Signature | Description |
|--------|------|-----------|-------------|
| `createInjector` | `function` | `(options?: { protoPath?: string; lang?: string }) => Injector` | Creates a stateful injector instance with a loaded protobuf schema. The returned `Injector` has `.injectBytes()` and `.injectFile()` methods. Preferred when injecting multiple files (avoids reloading proto). |
| `injectGilBytes` | `function` | `(input: InjectGilInput, options?: { protoPath?: string }) => InjectGilResult` | Stateless convenience: creates a transient injector and injects `.gia` bytes into `.gil` bytes. Returns new file bytes in memory. |
| `injectGilFile` | `function` | `(options: InjectGilFileOptions) => InjectGilFileResult` | Stateless convenience: reads `.gil` and `.gia` from disk, injects, writes result to disk. |
| `Injector` | `type` | `{ injectBytes: (input: InjectGilInput) => InjectGilResult; injectFile: (options: InjectGilFileOptions) => InjectGilFileResult }` | Interface returned by `createInjector`. |
| `InjectGilInput` | `type` | `{ gilBytes: Uint8Array; giaBytes: Uint8Array; targetId?: number; skipNonEmptyCheck?: boolean; lang?: string }` | Input for byte-level injection. |
| `InjectGilResult` | `type` | `{ bytes: Uint8Array; mode: 'replace' }` | Result of byte-level injection. |
| `InjectGilFileOptions` | `type` | `{ gilPath: string; giaPath: string; targetId?: number; skipNonEmptyCheck?: boolean; outPath?: string; protoPath?: string; lang?: string }` | Options for file-level injection. |
| `InjectGilFileResult` | `type` | `InjectGilResult & { outPath: string }` | Result of file-level injection (includes the output path written). |

### 2.6 Definitions — Prefab Constants

Re-exported via `export * from './definitions/prefabs.js'`.

| Export | Kind | Description |
|--------|------|-------------|
| `DynamicPrefabZh` | `const` | Chinese-keyed map of dynamic prefab name → numeric ID (~355 entries) |
| `StaticPrefabZh` | `const` | Chinese-keyed map of static prefab name → numeric ID (~1100 entries) |
| `CreationPrefabZh` | `const` | Chinese-keyed map of creation (crafting) prefab name → numeric ID (~55 entries) |
| `DynamicPrefab` | `const` | English-keyed map of dynamic prefab name → numeric ID (same IDs as ZH variant) |
| `StaticPrefab` | `const` | English-keyed map of static prefab name → numeric ID |
| `CreationPrefab` | `const` | English-keyed map of creation prefab name → numeric ID |

These constants are used to look up game resource IDs when spawning or referencing prefabs in node graph logic.

---

## 3. Naming Conventions

- **Function names**: camelCase (`compileTsToGs`, `injectGilFile`, `createInjector`)
- **Type names**: PascalCase (`GstsConfig`, `InjectGilInput`, `GiaWriteResult`)
- **Const names**: PascalCase for domain objects (`DynamicPrefab`), PascalCase + `Zh` suffix for Chinese variants (`DynamicPrefabZh`)
- **Stage pipeline**: each stage has a `resolve*OutputPath` helper alongside the main function
- **Parallel variants**: single-item functions are sync/simple; multi-item functions are async with `maxParallel` option
- **Stateless vs stateful**: `create*` prefix for stateful factory (`createInjector`); `inject*` for stateless convenience wrappers
- **Config types**: `Gsts*` prefix for all user-facing configuration types
- **Bilingual support**: all prefab constants come in `*Zh` (Chinese key) and plain (English key) variants

---

## 4. Directory Structure and Key Files

```
genshin-ts/
├── src/
│   ├── index.ts                  # Public API surface (exports compiler, injector, prefabs)
│   ├── cli/
│   │   └── gsts.ts               # Main CLI entry; all `gsts` subcommands live here
│   ├── compiler/
│   │   ├── gsts_config.ts        # GstsConfig type — the user-facing configuration schema
│   │   ├── config_loader.ts      # Loads gsts.config.ts from disk
│   │   ├── ts_to_gs_pipeline.ts  # Stage 1: TS → .gs.ts (TypeScript AST transform)
│   │   ├── ts_to_gs_transform/   # AST visitors for Stage 1 (expr, stmt, loops, builtins...)
│   │   ├── gs_to_ir_json_transform/
│   │   │   ├── index.ts          # Stage 2 orchestrator: .gs.ts → IR .json (spawns runner)
│   │   │   └── runner.ts         # Subprocess runner that executes the .gs.ts file
│   │   ├── ir_merge.ts           # Merges multiple IR JSON documents sharing the same graph ID
│   │   ├── ir_to_gia_pipeline.ts # Stage 3 orchestrator: IR .json → .gia (spawns runner, parallel)
│   │   ├── ir_to_gia_transform/  # Stage 3 implementation (layout, pins, node IDs, optimizations...)
│   │   └── gia_vendor.ts         # Re-exports thirdparty GIA graph/node/pin types
│   ├── runtime/
│   │   ├── core.ts               # g.server() API — the user-facing entry point for writing logic
│   │   ├── IR.d.ts               # IRDocument type definitions (nodes, connections, value types)
│   │   ├── ir_builder.ts         # Builds IRDocument from the execution flow recorded at runtime
│   │   ├── value.ts              # Value type classes: int, float, str, bool, vec3, entity, etc.
│   │   ├── variables.ts          # Graph variable declaration and f.get/f.set API
│   │   ├── execution_flow_types.ts  # Internal types for the execution flow builder
│   │   ├── ir_optimize_return_vars.ts  # IR optimization: reuse return variables
│   │   └── server_globals.ts     # Injects global game APIs (player, stage, level, self, Math...)
│   ├── definitions/
│   │   ├── events.ts             # All game event metadata (auto-generated)
│   │   ├── events-payload.ts     # TypeScript types for event handler parameters
│   │   ├── nodes.ts              # All node graph function definitions (auto-generated)
│   │   ├── enum.ts               # Game enumeration types
│   │   ├── entity_helpers.ts     # Entity subtype helpers (CharacterEntity, CreationEntity...)
│   │   ├── prefabs.ts            # Prefab/resource ID constants (exported publicly)
│   │   └── zh_aliases.ts         # Chinese↔English alias maps for events and functions
│   ├── injector/
│   │   ├── index.ts              # Injector API: createInjector, injectGilFile, injectGilBytes
│   │   ├── binary.ts             # Low-level .gil binary parsing and patching
│   │   ├── node_graph.ts         # Locates and replaces NodeGraph entries within .gil bytes
│   │   ├── proto.ts              # Protobuf schema loader for .gia format
│   │   ├── signal_nodes.ts       # Signal node ID patching
│   │   └── folder.ts             # .gil folder/index structure navigation
│   ├── i18n/                     # CLI internationalization (zh-CN / en-US)
│   ├── shared/                   # Internal utilities (type utils, string utils, list utils)
│   └── thirdparty/
│       └── Genshin-Impact-Miliastra-Wonderland-Code-Node-Editor-Pack/
│           ├── gia_gen/          # GIA graph/node/pin builder (Graph, Node, Pin classes)
│           ├── node_data/        # NODE_ID and ENUM_ID lookup tables
│           └── protobuf/         # .gia protobuf schema and decode utilities
├── scripts/
│   ├── generate-definitions.ts   # Regenerates src/definitions/ from game data
│   └── ... (test generation, analysis, release helpers)
├── resources/
│   ├── node_definitions.json     # Raw game node definition data
│   └── node_generics.json        # Generic node parameter data
├── types/gsts/                   # Exported TypeScript declaration files
├── configs/                      # tsconfig variants and TypeScript plugin config
├── create-genshin-ts/            # `npm create genshin-ts` scaffold templates
├── gsts.config.ts                # Config used for the repo's own examples
├── tsconfig.json
└── package.json
```

---

## 5. Core Architectural Patterns

### Three-Stage Compilation Pipeline

genshin-ts compiles user TypeScript through three distinct stages, each producing an intermediate artifact:

```
Stage 1: TS → .gs.ts
Stage 2: .gs.ts → IR .json
Stage 3: IR .json → .gia
```

Each stage runs as a separate Node.js subprocess (via `spawn`), allowing parallel processing and clean process isolation.

### Stage 1: TS → .gs.ts (AST Transform)

**Files:** `src/compiler/ts_to_gs_pipeline.ts`, `src/compiler/ts_to_gs_transform/`

The TypeScript Compiler API (`ts.createProgram`, `ts.visitNode`) is used to traverse the user's source. The transform rewrites:
- `g.server(...).on('eventName', (evt, f) => { ... })` into a series of node graph function calls
- Control flow (if/while/for/switch) into graph-compatible equivalents
- `setTimeout`/`setInterval` into timer pool calls
- `gstsServer*` named functions into reusable subgraph stubs

The output `.gs.ts` files are **valid TypeScript** that call genshin-ts runtime APIs directly. They are also tagged with `// @gsts:entry` if they contain entry points.

### Stage 2: .gs.ts → IR .json (Runtime Execution)

**Files:** `src/compiler/gs_to_ir_json_transform/runner.ts`, `src/runtime/`

The runner **imports and executes** the `.gs.ts` file. During execution:
- `g.server()` returns a `ServerGraphApi` object backed by `src/runtime/core.ts`
- Each `.on(...)` call registers event handlers
- Each function call (`f.printString(...)`, `f.teleportTo(...)`, etc.) appends nodes and connections to an internal execution flow
- When the file finishes executing, `buildIRDocument()` in `src/runtime/ir_builder.ts` serializes the collected execution flow into an `IRDocument` JSON

The IR JSON is a self-describing intermediate representation:
```json
{
  "ir_version": 1,
  "ir_type": "node_graph",
  "graph": { "name": "_GSTS_main", "id": 1073741825, "type": "server" },
  "variables": [...],
  "nodes": [
    { "id": 1, "type": "whenEntityIsCreated", "args": [...], "next": [2] },
    { "id": 2, "type": "printString", "args": [...] }
  ]
}
```

### Stage 3: IR .json → .gia (GIA Generation)

**Files:** `src/compiler/ir_to_gia_transform/`, `src/thirdparty/`

The IR is converted into the game's proprietary `.gia` format using:
- Thirdparty `Graph`/`Node`/`Pin` builder classes from `src/thirdparty/`
- `NODE_ID` lookup table mapping node type strings to game-internal IDs
- Pin type resolution and layout positioning
- Protobuf serialization via `src/injector/proto.ts`

Optimizations applied at this stage include dead node removal and timer dispatch aggregation.

### IR Merge

**File:** `src/compiler/ir_merge.ts`

Multiple `.gs.ts` entry files with the same `graph.id` are merged into a single IR document before Stage 3. This supports the `g.server({ id: X }).on(...)` multi-file pattern.

### Injector

**Files:** `src/injector/`

The injector operates directly on `.gil` binary map files. It:
1. Parses the `.gil` binary structure (folder/index layout)
2. Locates the target NodeGraph by ID
3. Applies safety checks (graph must be empty or `_GSTS`-prefixed)
4. Replaces the NodeGraph bytes with the new `.gia` content
5. Writes a backup before modifying

### Definitions (Auto-Generated)

**Files:** `src/definitions/`, `scripts/generate-definitions.ts`

All type definitions for events, functions, and enums are **auto-generated** from `resources/node_definitions.json`. The generation script (`generate-definitions.ts`) reads the raw game data and emits typed TypeScript files. Chinese aliases are also generated and stored in `zh_aliases.ts`.

---

## 6. Data Flow

### Full Pipeline Data Flow

```
User source (src/main.ts)
  │
  │  [Stage 1] compileTsToGs()
  │  uses TypeScript Compiler API to AST-transform
  ▼
dist/main.gs.ts
  │
  │  [Stage 2] emitIrJsonForEntries() — spawns subprocess
  │  subprocess imports dist/main.gs.ts → executes it
  │  g.server().on() calls fill in-memory execution flow
  │  buildIRDocument() serializes to JSON
  ▼
dist/main.json  (IRDocument — nodes + connections)
  │
  │  [ir_merge] mergeIrJsonFilesByGraphId() — optional
  │  combines multiple files with same graph.id
  ▼
dist/main_merged.json
  │
  │  [Stage 3] writeGiaFromIrJsonFiles() — spawns subprocess(es)
  │  IR nodes → Graph/Node/Pin objects → protobuf bytes
  ▼
dist/main.gia
  │
  │  [injector] injectGilFile()
  │  locates NodeGraph in .gil binary, replaces with .gia bytes
  ▼
%LocalAppData%/../LocalLow/miHoYo/.../BeyondLocal/<playerId>/<mapId>.gil
```

### Value Types

The value type system (`src/runtime/value.ts`) is central to the pipeline. User code uses typed value constructors (`int(5)`, `str("hello")`, `entity(...)`) that are:
- Used in Stage 2 to record connection types in the execution flow
- Serialized into IR `Argument` objects
- Mapped to protobuf Pin types in Stage 3

---

## 7. Key Extension Points

### Adding New Game Events

1. Add event metadata to `resources/node_definitions.json` (or update it from game data)
2. Run `npm run gen` — this executes `scripts/generate-definitions.ts` which regenerates:
   - `src/definitions/events.ts` (event metadata)
   - `src/definitions/events-payload.ts` (handler parameter types)
   - `src/definitions/nodes.ts` (function definitions)
   - `src/definitions/zh_aliases.ts` (Chinese alias maps)

### Adding New Node Functions

Same process as events — the definitions are auto-generated from `resources/node_definitions.json`. The `ServerExecutionFlowFunctions` type in `src/definitions/nodes.ts` is what users see as `f.someFunction(...)`.

### Adding New Value Types

1. Add a new class extending `value` in `src/runtime/value.ts`
2. Add to the `ValueTypeMap` in `src/runtime/IR.d.ts`
3. Add serialization in `src/runtime/ir_builder.ts` (`buildConnValueType`)
4. Add pin type mapping in `src/compiler/ir_to_gia_transform/index.ts` (`valueTypeToNodeType`)

### Adding New Compile-Time Syntax Features

- New TS syntax patterns are handled in `src/compiler/ts_to_gs_transform/`
- Control flow: `src/compiler/ts_to_gs_transform/loops.ts`, `stmt.ts`
- Expressions: `src/compiler/ts_to_gs_transform/expr.ts`
- Feature flags in `GstsFeatureFlags` (in `gsts_config.ts`) gate each new syntax feature
- After adding transform logic, add the corresponding feature flag and default it to `false` until stable

### Adding New Optimizations

- Stage 1 optimizations: in `ts_to_gs_transform/` (e.g., constant folding in expressions)
- Stage 2/IR optimizations: in `src/runtime/ir_optimize_return_vars.ts` or new files, called from `ir_builder.ts`
- Stage 3 optimizations: in `src/compiler/ir_to_gia_transform/` (e.g., `optimize_timer_dispatch.ts`)
- Wire new optimizations into `GstsOptimizeOptions` in `gsts_config.ts`

### Modifying the CLI

The CLI is entirely in `src/cli/gsts.ts` using the `commander` library. Add new subcommands with `program.command(...)`. The CLI also uses `src/cli/ui.ts` for output formatting and `src/cli/state.ts` for persistent incremental build state.

### Modifying the Injector

The injector operates on `.gil` binary format. The binary parsing is in `src/injector/binary.ts` and `src/injector/folder.ts`. NodeGraph location/replacement is in `src/injector/node_graph.ts`. The `.gia` protobuf schema is loaded via `src/injector/proto.ts` from the thirdparty package.

### Custom Prefab/Resource IDs

`src/definitions/prefabs.ts` contains prefab ID constants. This file can be regenerated or extended. The CLI also auto-extracts custom prefab IDs from `.gil` files via `src/cli/gil_resources.ts`.

---

## 8. Summary Table

| Area | Location | Notes |
|------|----------|-------|
| User config schema | `src/compiler/gsts_config.ts` | `GstsConfig` type |
| User entry point API | `src/runtime/core.ts` | `g.server()` |
| Stage 1 transform | `src/compiler/ts_to_gs_transform/` | TS AST visitors |
| Stage 2 runtime | `src/runtime/` | Execution flow builder |
| IR format | `src/runtime/IR.d.ts` | JSON schema |
| Stage 3 GIA gen | `src/compiler/ir_to_gia_transform/` | Protobuf output |
| Injector | `src/injector/` | `.gil` binary patcher |
| CLI | `src/cli/gsts.ts` | `commander`-based |
| Definitions (generated) | `src/definitions/` | From `resources/node_definitions.json` |
| Thirdparty GIA builder | `src/thirdparty/` | MIT, external project |
| Public API entry | `src/index.ts` | 17 named exports |
