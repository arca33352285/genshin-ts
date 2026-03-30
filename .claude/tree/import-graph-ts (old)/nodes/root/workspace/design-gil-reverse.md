# Design: GIL Reverse Tool — `gsts inspect` and `gsts scaffold`

**Date:** 2026-03-28
**Status:** Awaiting review before implementation

---

## 1. Problem Statement

The existing pipeline is TS → GIL. There is currently no way to go the other direction: given an existing `.gil` map file, understand what node graphs are inside it, or generate a TypeScript starting point from one. This design document covers both:

- `gsts inspect <file.gil> [--id <graphId>]` — human-readable inspection of the node graph structure
- `gsts scaffold <file.gil> --id <graphId> [--out <file.ts>]` — generate a TypeScript scaffold from the graph

---

## 2. What the Injector Already Provides (Reusable Parts)

The injector module in `src/injector/` already contains all the binary parsing and protobuf decoding needed. The reverse tool does not need to duplicate any of this.

### Directly reusable from `src/injector/`

| File | What it provides |
|------|-----------------|
| `binary.ts` | `parseMessage()` — full protobuf field tree walk; `readUint32BE()` — GIL header parsing |
| `node_graph.ts` | `loadGiaGraph()` — given GIA bytes + proto messages, returns a decoded `NodeGraphObj`; `findNodeGraphTargets()` — locates a NodeGraph by ID inside the parsed fields; `buildGraphTypeMap()` — scans all NodeGraphs in the file to build an id→type map; `getGraphId()` / `extractGraphType()` |
| `folder.ts` | `collectFolderIndexes()` — parses the GIL folder/content structure; `findFolderEntryField()` — locates a folder entry by graph ID; `resolveGraphTypeForTypeValue()` — resolves the graph category (entity/status/class/item) |
| `proto.ts` | `loadGiaProto()` — loads the `.gia` protobuf schema (cached) |

### What does NOT exist yet (new work)

The injector only ever reads one specific graph by ID and replaces it. It does not:
- Enumerate all NodeGraph IDs in a GIL file
- Decode a `NodeGraphObj` into a human-readable structure
- Map `nodeId` integers back to human-readable node type names
- Reverse-map GIL graph contents to TypeScript source patterns

---

## 3. GIL Binary Structure (Summary)

```
[4 bytes: leftSize] [4 bytes: schema] [4 bytes: headTag=0x0326] [4 bytes: fileType]
[4 bytes: protoSize] [payload bytes] [4 bytes: tailTag=0x0679]
```

The `payload` is a nested protobuf binary. The relevant structure for node graphs lives at protobuf path `10.1.1` (depth=3, p0=10, p1=1, p2=1) — each blob at that path is a `NodeGraph` message. The folder/index structure lives at path `6.1` and its subtrees.

The `NodeGraph` protobuf message (from `gia.proto`) contains:
- `id` — `NodeGraph.Id` with `type` (e.g. `BasicNode=20000`) and `id` (int64 graph ID)
- `name` — string graph name (e.g. `_GSTS_main`)
- `nodes` — array of `GraphNode`
- `graphValues` — array of `GraphVariable` (graph-level variables)
- `comments` — array of comments

Each `GraphNode` contains:
- `nodeIndex` — int
- `genericId` — `NodeProperty` with `nodeId` (int) that maps to `NODE_ID` keys
- `concreteId` — optional, same shape
- `pins` — array of `NodePin` (data connections between nodes)
- `x`, `y` — float position

Each `GraphVariable` contains:
- `name` — string
- `type` — `VarType` enum (Entity=1, Integer=3, Boolean=4, Float=5, String=6, etc.)
- `values` — `VarBase` with initial value

---

## 4. Key Data for Reverse Mapping

### 4.1 nodeId → node type name

`src/thirdparty/.../node_data/node_id.ts` exports `NODE_ID` — a flat object mapping human-readable names to integers (e.g. `Print_String: 1`). To reverse lookup:

```ts
// Build once on startup
const NODE_ID_BY_INT = new Map<number, string>(
  Object.entries(NODE_ID).map(([name, id]) => [id as number, name])
)
```

Note: many names share the same ID (generic + typed variants, e.g. `Print_String` and `Print_String__Generic` both = 1). When reversing, prefer the `__Generic` suffix entry filtered out, or just use the first unique match.

### 4.2 VarType → IR/TS type name

The `VarType` enum from `gia.proto` maps directly to IR value type strings:

| VarType int | Name | IR/TS type |
|-------------|------|------------|
| 1 | Entity | `entity` |
| 2 | GUID | `guid` |
| 3 | Integer | `int` |
| 4 | Boolean | `bool` |
| 5 | Float | `float` |
| 6 | String | `str` |
| 7 | GUIDList | `guid_list` |
| 8 | IntegerList | `int_list` |
| 9 | BooleanList | `bool_list` |
| 10 | FloatList | `float_list` |
| 11 | StringList | `str_list` |
| 12 | Vector | `vec3` |
| 13 | EntityList | `entity_list` |
| 17 | Faction | `faction` |
| 20 | Configuration | `config_id` |
| 21 | Prefab | `prefab_id` |
| 27 | Dictionary | `dict` |

### 4.3 Graph type → sub_type

`NodeGraph.Id.Type` (from proto) maps to IR `ServerGraphSubType`:

| int | Proto name | IR sub_type |
|-----|-----------|-------------|
| 20000 | BasicNode | `entity` |
| 20003 | StatusNode | `status` |
| 20004 | ClassNode | `class` |
| 20005 | ItemNode | `item` |

### 4.4 Event node identification

"Event handler" nodes (i.e. the `.on('eventName', ...)` entry points in TS) correspond to specific nodeId values in the game. These are the nodes that have no inflow control pins and represent when-event-happens triggers. They can be identified by:
- Having no inflow `NodePin` (kind=InFlow=1)
- `nodeId` matching known event node IDs in the `NODE_ID` table

The `src/definitions/events.ts` file contains the canonical list of event names. The mapping from event name to node ID is available via `NODE_ID` (e.g. `When_Entity_Is_Created`, `When_Entity_Is_Destroyed`, etc.).

---

## 5. New Module: `src/injector/reader.ts`

To keep concerns clean, the reverse tool's core logic lives in a new module `src/injector/reader.ts`. This module:
- Does NOT modify any files
- Exposes a `readGilNodeGraphs(gilBytes, protoPath?)` function that returns a list of parsed NodeGraph summaries
- Exposes a `readGilNodeGraph(gilBytes, targetId, protoPath?)` function for a single graph
- Reuses `loadGiaProto`, `parseMessage`, `buildGraphTypeMap`, `findNodeGraphTargets`, `collectFolderIndexes` directly

```ts
// src/injector/reader.ts

export type NodeGraphSummary = {
  id: number
  name: string
  graphType: number       // NodeGraph.Id.Type int
  graphTypeName: string   // 'entity'|'status'|'class'|'item'|'unknown'
  nodeCount: number
  variableCount: number
}

export type NodeGraphDetail = NodeGraphSummary & {
  variables: VariableDetail[]
  nodes: NodeDetail[]
}

export type VariableDetail = {
  name: string
  varType: number         // VarType int
  typeName: string        // IR type string ('int', 'str', etc.)
  initialValue?: unknown  // decoded from VarBase
}

export type NodeDetail = {
  index: number
  nodeId: number
  typeName: string        // from NODE_ID reverse lookup
  x: number
  y: number
  pinCount: number
  outflowTargets: number[] // nodeIndex values this node connects to via OutFlow pins
}

export function readGilNodeGraphs(gilBytes: Uint8Array, protoPath?: string): NodeGraphSummary[]
export function readGilNodeGraph(gilBytes: Uint8Array, targetId: number, protoPath?: string): NodeGraphDetail
```

---

## 6. `gsts inspect` Command Design

### Usage

```
gsts inspect <file.gil> [--id <graphId>] [--json]
```

Options:
- `<file.gil>` — required path to the GIL file
- `--id <graphId>` — optional; if omitted, lists all graphs in the file
- `--json` — optional; output raw JSON instead of formatted text

### Output (no `--id`, listing mode)

```
Found 3 node graphs in map.gil:

  ID          Name              Type     Nodes  Variables
  1073741825  _GSTS_main        entity   12     3
  1073741826  _GSTS_combat      entity   7      1
  20000       (empty)           entity   0      0
```

### Output (with `--id`, detail mode)

```
NodeGraph: _GSTS_main (id=1073741825, type=entity)

Variables (3):
  score    int     = 0
  running  bool    = false
  name     str     = ""

Nodes (12):
  #1   whenEntityIsCreated       (event entry)
  #2   printString
  #3   teleportTo
  #4   doubleBranch
  ...
  Connections: #1 -> #2 -> #3; #4 -> #5 (branch A) -> #6, #4 (branch B) -> #7
```

### Implementation location

`src/cli/gil_inspect.ts` — a new file in `src/cli/`. It imports from `src/injector/reader.ts` and formats output using the existing `ui` helper pattern from `src/cli/ui.ts`.

---

## 7. `gsts scaffold` Command Design

### Usage

```
gsts scaffold <file.gil> --id <graphId> [--out <file.ts>] [--force]
```

Options:
- `<file.gil>` — required
- `--id <graphId>` — required; which node graph to scaffold
- `--out <file.ts>` — output path; defaults to `./<graphName>.scaffold.ts`
- `--force` — overwrite if file exists

### Output TypeScript shape

The generated file is a valid starting point for editing — it will not compile or run as-is without the user filling in logic, but all the structure is in place. This mirrors the intent of genshin-ts: the user writes logic, not boilerplate.

```ts
// Auto-generated scaffold from: map.gil (id=1073741825)
// Graph: _GSTS_main (type: entity)
// Generated by: gsts scaffold

import { g, int, str, bool, entity, vec3 } from 'genshin-ts'

export default g.server({ id: 1073741825 })
  // Variables: declared below as graph variables
  .var('score', int(0))
  .var('running', bool(false))
  .var('name', str(''))
  // Event handlers detected in graph:
  .on('whenEntityIsCreated', (evt, f) => {
    // TODO: implement handler
    // Nodes in original: printString, teleportTo, doubleBranch, ...
  })
  .on('whenEntityIsDestroyed', (evt, f) => {
    // TODO: implement handler
  })
```

### Scaffold generation rules

1. **Graph variables** → `.var('name', type(defaultValue))` call for each `GraphVariable`
2. **Event handler nodes** → `.on('eventName', (evt, f) => { ... })` stubs
   Detection: nodes whose `nodeId` maps to a known event node name (matched against `src/definitions/events.ts` event list)
3. **Non-event nodes** → listed as TODO comments inside the relevant handler stub
4. **Import line** — auto-generated based on which value types appear in the graph variables; always includes `g`

### Node name → TS function name mapping

`NODE_ID` keys use `Title_Case_With_Underscores`. The existing IR pipeline uses `camelCase`. The scaffold generator uses the same lower-case-then-camelCase transformation already present in the codebase:

```ts
// 'Print_String' → 'printString'
function nodeIdKeyToFunctionName(key: string): string {
  return key
    .replace(/__.*$/, '')           // strip __Generic etc.
    .toLowerCase()
    .replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}
```

This matches the names users write as `f.printString(...)`.

### Implementation location

`src/cli/gil_scaffold.ts` — a new file in `src/cli/`. Imports from `src/injector/reader.ts` for the parsed graph data.

---

## 8. CLI Registration

In `src/cli/gsts.ts`, two new commands are added in `main()`:

```ts
program
  .command('inspect')
  .description(t('cmdInspect'))
  .argument('<file>', t('inspectArgFile'))
  .option('--id <id>', t('inspectOptId'))
  .option('--json', t('inspectOptJson'))
  .action(async (file: string, cmdOpts: { id?: string; json?: boolean }) => {
    const opts = program.opts<GlobalOptions>()
    await runInspect(file, cmdOpts, opts)
  })

program
  .command('scaffold')
  .description(t('cmdScaffold'))
  .argument('<file>', t('scaffoldArgFile'))
  .requiredOption('--id <id>', t('scaffoldOptId'))
  .option('--out <file>', t('scaffoldOptOut'))
  .option('--force', t('scaffoldOptForce'))
  .action(async (file: string, cmdOpts: { id: string; out?: string; force?: boolean }) => {
    const opts = program.opts<GlobalOptions>()
    await runScaffold(file, cmdOpts, opts)
  })
```

The `runInspect` and `runScaffold` functions live in their respective files (`gil_inspect.ts`, `gil_scaffold.ts`) and are imported into `gsts.ts`.

---

## 9. File Structure Summary (New Files Only)

```
src/
  injector/
    reader.ts          ← NEW: GIL reading API (no modification, only parsing/decoding)
  cli/
    gil_inspect.ts     ← NEW: inspect command logic
    gil_scaffold.ts    ← NEW: scaffold command logic
  i18n/locales/
    en-US/main.json    ← ADD: new i18n keys for inspect/scaffold
    zh-CN/main.json    ← ADD: same keys in Chinese
```

No existing files are modified except `src/cli/gsts.ts` (add two command registrations + imports) and the two i18n JSON files.

---

## 10. Design Decisions and Tradeoffs

### Why `src/injector/reader.ts` and not `src/cli/`?

The reader is pure data access (no CLI formatting, no file writing). Placing it in `src/injector/` keeps it consistent with the injector module's role as the binary-level interface to GIL files. It could later be exported from `src/index.ts` as a public API if useful.

### Why not reuse the existing `extractGraphType` in `node_graph.ts` for listing?

`extractGraphType` decodes a single already-decoded `NodeGraphObj`. The listing mode needs to scan all NodeGraph blobs efficiently. The reader module will use `buildGraphTypeMap()` (already in `node_graph.ts`) to scan IDs and types in one pass via the fast varint path, which avoids full protobuf decode for every graph.

### Why is `--id` required for `scaffold` but optional for `inspect`?

`inspect` without `--id` provides discovery — you need to see what's in the file before you can pick a graph to scaffold. `scaffold` without knowing which graph would be ambiguous (a file can have dozens of graphs, most empty).

### Scaffold accuracy limitations

The scaffold makes a best-effort reverse mapping. Some information is permanently lost in GIL vs. original TS source:
- The exact TS control flow (if/while/switch) that was compiled away into graph nodes
- Variable names for intermediate values (they become anonymous connection wires)
- Comments and code structure

The scaffold is a **starting point**, not a faithful reconstruction. The generated handler stubs list the original nodes as comments so the user knows what logic was there.

### Node type name resolution for unknown nodeIds

Some `nodeId` values may not appear in `NODE_ID` (e.g., custom/newer game nodes). These are rendered as `node_<id>` in both inspect output and scaffold comments.

---

## 11. Out of Scope (Deferred)

- Full decompilation of node logic into compilable TypeScript (the connection topology is complex and would require understanding every node's semantics)
- Support for client graphs (`type: 'client'`)
- Signal node scaffolding (signal send/monitor nodes have dynamic IDs that are patched at inject time; the scaffold would need to include signal name wiring)
- Composite graph scaffolding (the thirdparty `CompositeDef` structure is more complex)

---

## 12. Open Questions for Review

1. **Should `inspect --json` output the raw decoded protobuf object, or a cleaned summary?** The raw object is very large and mostly unreadable; the summary is more useful but loses detail. Suggested: summary by default, add `--raw` for the full object.

2. **Should the scaffold import from `'genshin-ts'` or from a relative path?** Users in a standard `npm create genshin-ts` project import from `'genshin-ts'`. This seems correct.

3. **Should `.var()` calls in the scaffold use `.graphVar()` or `.var()`?** The runtime API uses `.var()` for graph variables. Confirm this is the correct method name before implementation.

4. **i18n scope**: Should the inspect/scaffold commands support `--lang` for their output messages? The existing commands all support this. Suggested: yes, consistent with existing commands.
