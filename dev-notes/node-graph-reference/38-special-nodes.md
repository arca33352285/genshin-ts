# Special Node IDs & IR Builder

**Source**: `src/compiler/ir_to_gia_transform/mappings.ts`, `src/runtime/ir_builder.ts`

## SPECIAL_NODE_IDS (`mappings.ts:394`)

Nodes not present in the GIA vendor `NODE_ID` table are assigned their own IDs:

| nodeType | ID | Notes |
|----------|----|-------|
| `send_signal` | 300000 | Signal with custom argument support |
| `monitor_signal` | 300001 | Signal reception with custom argument support |
| `assemble_structure` | 300002 | Struct assembly |
| `split_structure` | 300003 | Struct decomposition |
| `modify_structure` | 300004 | Struct modification |

## NODE_BUILDERS (`ir_builder.ts:166`)

Nodes that require custom IR build logic instead of the default `buildDefaultNode`:

| nodeType | Builder | Description |
|----------|---------|-------------|
| `break_loop` | `buildBreakLoopNode` (line 137) | Does not connect exec output pins. Connects to the loop's break-input pin by node ID and `target_index`. |
| `send_signal` | `buildSignalNode` (line 160) | Copies `signalParams` from `MetaCallRecord` into the IR node. |
| `monitor_signal` | `buildSignalNode` (line 160) | Same as `send_signal`. |

### buildBreakLoopNode (ir_builder.ts:137)

```
IR output:
  node.next = [{ nodeId: loopNodeId, inputIndex: 0 }]
  (exec chain terminated — no further exec connection)
```

### buildSignalNode (ir_builder.ts:160)

```typescript
const buildSignalNode: NodeBuilder = (record, next) => {
  const node = buildDefaultNode(record, next)
  if (record.signalParams) node.signalParams = record.signalParams
  return node
}
```
