# genshin-ts Capability Analysis & Roadmap

- **Date**: 2026-03-23
- **Scope**: Miliastra Wonderland Editor map file injection capabilities
- **Fork**: arca33352285/genshin-ts (based on josStorer/genshin-ts v0.1.7)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Current Capabilities — What Works](#2-current-capabilities)
3. [Unimplemented Features — What's Missing](#3-unimplemented-features)
4. [Feature Roadmap — Prioritized](#4-feature-roadmap)
5. [Appendix: Source Map](#appendix-source-map)

---

## 1. Architecture Overview

### Pipeline

```
TypeScript (.ts)
   ↓ ts_to_gs_transform
GenshinScript (.gs.ts)
   ↓ gs_to_ir_json_transform
IR JSON (.json)
   ↓ ir_to_gia_transform
GIA Binary (.gia)        ← compiled node graph
   ↓ injector
GIL Map File (.gil)      ← Wonderland editor map
```

### System Boundaries

```
┌─────────────────────────────────────────────────────┐
│  TypeScript DSL                                     │
│  (src/runtime/ + src/definitions/)                  │
│  380+ node methods, 59 events, 51 enums, 10+ types │
├─────────────────────────────────────────────────────┤
│  Compiler                                           │
│  (src/compiler/)                                    │
│  TS→GS→IR→GIA pipeline, optimizations, layout       │
├─────────────────────────────────────────────────────┤
│  Injector                                           │
│  (src/injector/)                                    │
│  GIA→GIL binary patching, signal resolution         │
└─────────────────────────────────────────────────────┘
```

---

## 2. Current Capabilities

### 2.1 What Can Be Injected Into Map Files

| Category | Status | Description |
|----------|--------|-------------|
| **Server node graphs** | FULL | Complete server-side node graph replacement |
| **Node connections** | FULL | Flow (exec chain) and data (parameter wiring) |
| **Literal values** | FULL | bool, int, float, str, vec3, guid, entity, config_id, prefab_id, faction |
| **Enum values** | FULL | 51 enumeration types with full serialization |
| **List values** | FULL | Typed lists of all 10 base types |
| **Dictionary values** | FULL | Key-value dictionaries with type safety |
| **Graph variables** | FULL | Node graph variables and custom variables |
| **Signal nodes** | FULL | send_signal, monitor_signal with ID resolution |
| **Signal arguments** | FULL (fork) | 18 custom argument types on signals |
| **Structure nodes** | PARTIAL | assemble/split/modify structure (special node IDs) |
| **Node positioning** | FULL | Auto-layout with collision avoidance |
| **Graph mode** | FULL | beyond / classic mode selection |
| **Graph type** | FULL | entity / status / class / item sub-types |

### 2.2 Supported Node Categories (380+ methods)

| Category | Count | Examples |
|----------|-------|---------|
| Flow control | 7 | doubleBranch, finiteLoop, listIterationLoop, multipleBranches |
| Variables | 8 | get/setCustomVariable, get/setNodeGraphVariable, initLocalVariable |
| Data assembly | 9 | assemblyList, assemblyDictionary, assembleStructure |
| List ops | 12 | insert, modify, remove, clear, sort, get, search |
| Dictionary ops | 11 | query, set, remove, clear, sort, getKeys, getValues |
| Math/Arithmetic | 18 | add, sub, mul, div, mod, pow, sqrt, log, clamp, round |
| Trigonometry | 8 | sin, cos, tan, asin, acos, atan, deg↔rad |
| 3D Vector | 20 | create, split, add, sub, dot, cross, normalize, rotate |
| Logic/Bitwise | 12 | and, or, not, xor, shift, readBit, writeBit |
| Comparison | 6 | equal, enumEqual, gt, gte, lt, lte |
| Entity management | 10 | create, destroy, remove, teleport, toggleLight |
| Entity queries | 29 | location, faction, type, attributes, filtering |
| Collision/Physics | 9 | enable/disable collision triggers, pathfinding, climbability |
| Motion/Pathing | 11 | linear, rotation, follow, fixed-point motion devices |
| Combat/HP | 4 | attack, recover, hpLoss, recoverDirectly |
| Effects/Projectiles | 5 | createProjectile, playEffects, looping effects |
| Status | 10 | preset status, unit status, stacks, queries |
| Timers | 10 | start/pause/resume/stop local + global timers |
| Character/Skill | 21 | add/delete/modify skills, class, elemental energy |
| Revive/Death | 11 | revive, defeat, revive points, allow/forbid |
| Player queries | 13 | guid, nickname, device, layout, ranking |
| Signal | 2 | sendSignal (with args), onSignal (with args) |
| Camera/UI | 8 | camera template, control groups, layout, nameplate |
| Audio | 8 | BGM, SFX player, volume, one-shot |
| Tag/Aggro | 17 | unit tags, aggro values, taunt, combat state |
| Shop/Inventory | 30 | open/close shop, add/remove items, currency, loot |
| Equipment | 11 | equip, affix management, queries |
| Loot | 7 | item/currency/equipment from loot component |
| Settlement/Ranking | 13 | settlement status, leaderboard, competitive rank |
| Mini-map | 7 | markers, zoom, tracking, status |
| Patrol/Waypoint | 6 | patrol template, preset points, global path |
| Achievement/Scan | 6 | progress tally, scan tags |
| Deck Selector | 3 | invoke, close, randomize |
| Environment/Time | 10 | env time, timestamp, timezone, day of week |
| Chat/Channel | 3 | channel switch, permission |
| Gift Box | 3 | consume, query quantity/consumption |
| Deployment Group | 2 | activate/disable, query active |
| Utilities | 3 | printString, forwardingEvent, queryGameMode |

### 2.3 Event System (59 events)

All 59 server events are fully supported, including:
- Entity lifecycle (create, destroy, faction change)
- Combat (attack, HP recovery, shield, elemental reaction)
- Character (down, revive, active change, class change)
- Collision (enter/exit trigger)
- Timer (local/global trigger)
- UI (control group, tab, text bubble, deck selector)
- Shop/Inventory (sell, buy, equip, unequip, affix change)
- Motion (device stops, patrol waypoint)
- Status (unit status change/end)
- Signal (monitor_signal with custom args)
- Skill (skill node called)
- Aggro (target change, enter/leave combat)

### 2.4 Compiler Features

| Feature | Status |
|---------|--------|
| TypeScript type checking | FULL |
| Expression compilation | FULL |
| Control flow → node graph | FULL |
| setTimeout / setInterval | FULL |
| Timer closure capture | FULL |
| Timer dispatch optimization | FULL |
| Constant folding (precompile) | FULL |
| Dead node elimination | FULL |
| Auto-layout | FULL |
| Parallel GIA compilation | FULL |
| Bilingual API (EN/ZH) | FULL |
| ESLint semantic rules | FULL |
| IR JSON debug output | FULL |
| Watch mode (`gsts dev`) | FULL |
| Auto re-inject on map save | FULL |

### 2.5 Injector Features

| Feature | Status |
|---------|--------|
| GIL binary read/write | FULL |
| NodeGraph replacement | FULL |
| Signal node ID resolution | FULL |
| Type validation | FULL |
| Safety checks (empty graph) | FULL |
| Ancestor length patching | FULL |
| Varint overflow protection | FULL (fork bugfix) |

### 2.6 Fork-Specific Additions

| Feature | Status | Description |
|---------|--------|-------------|
| Signal Arguments | DONE (uncommitted) | 18-type custom args for sendSignal/onSignal |
| Injection Hang Fix | DONE (uncommitted) | readVarint 32-bit overflow protection |
| prefabId list dict value | DONE (committed) | prefab_id_list as dictionary value type |

---

## 3. Unimplemented Features

### 3.1 Explicitly Missing (referenced in code but not built)

| # | Feature | Evidence | Complexity |
|---|---------|----------|------------|
| 1 | **Client-side graphs** | IR types define `ClientIRDocument`, `ClientGraphInfo`; `g.client()` not implemented | VERY HIGH |
| 2 | **Scene definition** | `g.scene()` mentioned in types but no implementation | HIGH |
| 3 | **Auto variable mounting** | Referenced but not built | MEDIUM |
| 4 | **`await delay()` support** | Code comment: "highly uncertain" — unclear if game supports | UNKNOWN |
| 5 | **Node limit detection** | 3000 node limit per graph — no automated check | LOW |
| 6 | **Cross-file duplicate ID detection** | Can cause silent corruption | MEDIUM |
| 7 | **Struct generic parameter passing** | Struct assembly works but generic params missing | MEDIUM |

### 3.2 Developer Tooling Gaps

| # | Feature | What it would do | Complexity |
|---|---------|-----------------|------------|
| 1 | **GIA → TypeScript decompiler** | Reverse-engineer existing GIA to TS code | VERY HIGH |
| 2 | **GIL inspector / graph viewer** | Read and display existing node graphs in map files | HIGH |
| 3 | **Visual node graph preview** | Preview compiled graph layout before injection | MEDIUM |
| 4 | **Source map generation** | Map compile errors back to original TS line | HIGH |
| 5 | **Graph diff tool** | Compare two GIA files or before/after injection | MEDIUM |
| 6 | **IR JSON schema validation** | Validate IR structure before GIA compilation | LOW |
| 7 | **Hot reload / watch mode** | Auto-recompile + inject on TS file change | MEDIUM |

### 3.3 Injection Pipeline Gaps

| # | Feature | What it would do | Complexity |
|---|---------|-----------------|------------|
| 1 | **Multi-graph batch injection** | Inject multiple GIA files into one GIL in single pass | MEDIUM |
| 2 | **Partial graph patching** | Modify specific nodes without replacing entire graph | HIGH |
| 3 | **Graph merging** | Combine nodes from multiple sources into one graph | HIGH |
| 4 | **Injection rollback** | Undo injection (restore original graph) | LOW |
| 5 | **GIL validation** | Verify map integrity after injection | MEDIUM |
| 6 | **Dry-run mode** | Preview injection changes without writing file | LOW |

### 3.4 Language / DSL Gaps

| # | Feature | Current limitation | Complexity |
|---|---------|-------------------|------------|
| 1 | **try/catch** | Explicitly unsupported — no node graph equivalent | N/A (by design) |
| 2 | **String operations** | No `.length`, `.charAt()`, etc. in server scope | N/A (game limit) |
| 3 | **async/await** | No Promise semantics in node graphs | N/A (by design) |
| 4 | **for...in loops** | Unsupported — use listIterationLoop | N/A (by design) |
| 5 | **Recursion** | `gstsServer` functions can't recurse | N/A (by design) |
| 6 | **Nullish coalescing (??)** | Explicitly blocked | LOW |

> Items marked N/A are limitations of the Genshin node graph system, not genshin-ts bugs.

---

## 4. Feature Roadmap — Prioritized

### Tier 1: High Impact, Low-Medium Effort

These are the most valuable improvements relative to effort.

#### 1.1 Node Limit Detection (LOW effort)
- **What**: Warn when a graph exceeds 3000 nodes
- **Why**: Silent overflow causes graph corruption in-game
- **Where**: Add check in `ir_to_gia_pipeline.ts` after IR generation
- **Effort**: ~20 lines of code

#### 1.2 Dry-Run / Preview Mode (LOW effort)
- **What**: `--dry-run` flag that shows what injection would change without writing
- **Why**: Safer iteration, especially for large maps
- **Where**: `src/injector/index.ts` — skip write step, print diff summary
- **Effort**: ~50 lines

#### 1.3 Injection Rollback / Backup (LOW effort)
- **What**: Auto-backup GIL file before injection
- **Why**: No undo if injection corrupts map
- **Where**: Copy original GIL to `.bak` before writing
- **Effort**: ~10 lines

#### 1.4 Multi-Graph Batch Injection (MEDIUM effort)
- **What**: Inject multiple GIA files into one GIL in single pass
- **Why**: Currently requires N sequential injections → N file reads/writes
- **Where**: Extend `injectGilFile()` to accept array of GIA inputs
- **Effort**: ~200 lines — batch all patches, single write

#### 1.5 Cross-File Duplicate ID Detection (MEDIUM effort)
- **What**: Detect duplicate node graph IDs across multiple `.gs.ts` files before compile
- **Why**: Duplicate IDs cause silent overwrite during injection
- **Where**: `ir_to_gia_pipeline.ts` — collect all IDs, check uniqueness
- **Effort**: ~100 lines

~~#### 1.6 Watch Mode~~ — **Already implemented** via `gsts dev` (chokidar-based, with auto re-inject on map save)

---

### Tier 2: High Impact, High Effort

Significant features that substantially expand capability.

#### 2.1 GIL Inspector / Graph Viewer (HIGH effort)
- **What**: CLI tool to read GIL file and display human-readable summary of all node graphs
- **Why**: Currently no way to see what's in a map file without the Wonderland editor
- **Where**: New module `src/tools/gil_inspector.ts`
- **Output**: Graph ID, name, type, node count, signal names, variable names
- **Effort**: ~500-1000 lines — leverage existing protobuf parsing from injector

#### 2.2 GIA → TypeScript Decompiler (VERY HIGH effort)
- **What**: Reverse-engineer compiled GIA back to approximate TypeScript
- **Why**: Extract logic from existing maps, understand others' graphs, migrate work
- **Where**: New module `src/decompiler/`
- **Challenges**: Node ID → method name reverse mapping, connection tracing, control flow reconstruction
- **Effort**: ~2000-5000 lines — fundamentally new system

#### 2.3 Client-Side Graph Support (VERY HIGH effort)
- **What**: Implement `g.client()` API, client events, client execution flow functions
- **Why**: Many Wonderland features require client-side logic (UI interactions, visual effects)
- **Where**: Parallel implementation of entire runtime + compiler for client scope
- **Status**: IR types already define `ClientIRDocument` — infrastructure exists but no implementation
- **Effort**: ~5000+ lines — nearly doubles the codebase
- **Note**: Requires reverse-engineering client node types and their GIA encodings

#### 2.4 Visual Node Graph Preview (MEDIUM-HIGH effort)
- **What**: Generate SVG/HTML visualization of compiled graph
- **Why**: Debug complex graphs, verify layout, documentation
- **Where**: New module `src/tools/graph_visualizer.ts`
- **Effort**: ~800 lines with SVG generation, ~1500 with interactive HTML

---

### Tier 3: Nice-to-Have / Future

#### 3.1 Source Map Generation (HIGH effort)
- **What**: Map GIA compile errors back to original TypeScript lines
- **Why**: Currently errors reference IR node IDs, not source lines
- **Effort**: ~1000+ lines — requires tracking source positions through 3-stage pipeline

#### 3.2 Graph Diff Tool (MEDIUM effort)
- **What**: Compare two GIA files or before/after injection state
- **Why**: Verify changes, code review for node graphs
- **Effort**: ~400 lines

#### 3.3 Template / Snippet System (MEDIUM effort)
- **What**: Pre-built reusable patterns (spawn system, wave spawner, timer utilities)
- **Why**: Common patterns are tedious to rewrite
- **Effort**: ~300 lines infrastructure + templates

#### 3.4 Conditional Compilation (LOW-MEDIUM effort)
- **What**: `#if DEBUG` style conditionals to include/exclude nodes
- **Why**: Include debug print nodes in dev, strip for release
- **Effort**: ~200 lines — preprocessor on GS stage

#### 3.5 IR Schema Validation (LOW effort)
- **What**: JSON Schema for IR documents, validate before GIA compile
- **Why**: Catch malformed IR early with clear error messages
- **Effort**: ~150 lines

#### 3.6 Graph Merging (HIGH effort)
- **What**: Combine nodes from multiple graphs into one (e.g., merge utility library + main logic)
- **Why**: Code reuse across graphs
- **Where**: Extend IR merge with conflict resolution
- **Effort**: ~800 lines

#### 3.7 Partial Graph Patching (HIGH effort)
- **What**: Modify specific nodes/connections without replacing entire graph
- **Why**: Preserve hand-edited nodes while injecting code-generated ones
- **Where**: Requires node-level binary patching in injector
- **Effort**: ~1500 lines — fundamentally different injection strategy

---

### Priority Matrix

```
Impact ▲
       │
  HIGH │  [1.4] Batch    [2.1] Inspector    [2.3] Client
       │  [1.5] Dup ID   [2.2] Decompiler    Graphs
       │                 [2.4] Visualizer
       │
  MED  │  [1.1] Limit    [3.2] Diff         [3.6] Merge
       │  [1.2] DryRun   [3.3] Templates    [3.7] Partial
       │  [1.3] Backup   [3.4] Conditional      Patch
       │
  LOW  │  [3.5] Schema   [3.1] SourceMap
       │
       └──────────────────────────────────────────────►
              LOW              MEDIUM             HIGH
                            Effort
```

> Note: Watch mode and auto re-inject on map save are already implemented via `gsts dev`.

### Recommended Order of Implementation

| Phase | Features | Rationale |
|-------|----------|-----------|
| **Phase 0** (now) | Commit signal-args + injection fix | Stabilize fork additions |
| **Phase 1** (quick wins) | 1.1 Node limit, 1.2 Dry-run, 1.3 Backup | Safety net, ~1 day total |
| **Phase 2** (dev workflow) | 1.5 Dup ID check | Prevent silent corruption, ~1-2 days |
| **Phase 3** (power tools) | 1.4 Batch inject, 2.1 GIL inspector | Productivity boost, ~1-2 weeks |
| **Phase 4** (deep features) | 2.4 Visual preview, 3.3 Templates | Quality of life, ~1-2 weeks |
| **Phase 5** (major) | 2.2 Decompiler OR 2.3 Client graphs | Game-changing but large, ~months |

---

## Appendix: Source Map

### Core Files by Subsystem

| Subsystem | Primary Files | Lines |
|-----------|---------------|-------|
| **Node definitions** | `src/definitions/nodes.ts` | ~15,500 |
| **Enumerations** | `src/definitions/enum.ts` | ~2,300 |
| **Events** | `src/definitions/events.ts`, `events-payload.ts` | ~2,200 |
| **Entity helpers** | `src/definitions/entity_helpers.ts` | ~6,100 |
| **Runtime core** | `src/runtime/core.ts` | ~32,000 |
| **Server globals** | `src/runtime/server_globals.ts`, `.d.ts` | ~66,000 |
| **Value types** | `src/runtime/value.ts` | ~22,000 |
| **TS→GS compiler** | `src/compiler/ts_to_gs_transform/` | ~4,500 |
| **IR→GIA compiler** | `src/compiler/ir_to_gia_transform/` | ~2,000 |
| **GIA vendor** | `src/thirdparty/.../` | external |
| **Injector** | `src/injector/` | ~1,500 |
| **Tests** | `tests/generated/` | ~20,000 |

### Fork-Modified Files (uncommitted)

| File | Change |
|------|--------|
| `src/compiler/ir_to_gia_transform/mappings.ts` | +SIGNAL_ARG_TYPE_MAP |
| `src/compiler/ir_to_gia_transform/index.ts` | Signal arg pin generation |
| `src/compiler/ir_to_gia_transform/pins.ts` | +ensureInputPinWithType |
| `src/definitions/nodes.ts` | sendSignal args, auto-wrap |
| `src/definitions/events-payload.ts` | monitorSignal + Record |
| `src/runtime/core.ts` | onSignal args, dynamic pins |
| `src/runtime/ir_builder.ts` | buildSignalNode |
| `src/runtime/IR.d.ts` | Node.signalParams |
| `src/runtime/meta_call_types.ts` | MetaCallRecord.signalParams |
| `src/runtime/server_globals.ts` | send() args forwarding |
| `src/runtime/server_globals.d.ts` | send() type signature |
| `src/injector/signal_nodes.ts` | varint overflow fix |
