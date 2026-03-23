# Signal

**Source**: `src/definitions/nodes.ts`, `src/runtime/core.ts`, `src/compiler/ir_to_gia_transform/mappings.ts`

## Nodes

| # | Method | nodeType | Type | Line | SPECIAL_NODE_ID |
|---|--------|----------|------|------|-----------------|
| 1 | `f.sendSignal(name, signalArgs?)` | `send_signal` | exec | nodes.ts:6810 | 300000 |
| 2 | `f.onSignal(name, handler, signalArgs?)` | `monitor_signal` | event | core.ts | 300001 |

Both nodes use `buildSignalNode` in `ir_builder.ts` to preserve `signalParams` metadata.

## Argument Types (18 total)

Defined in `SIGNAL_ARG_TYPE_MAP` (`mappings.ts:402`):

| Type | typeId | dataGroup | Element typeId | Element dataGroup |
|------|--------|-----------|----------------|-------------------|
| `entity` | 1 | 0 | — | — |
| `guid` | 2 | 1 | — | — |
| `int` | 3 | 2 | — | — |
| `bool` | 4 | 6 | — | — |
| `float` | 5 | 4 | — | — |
| `str` | 6 | 5 | — | — |
| `vec3` | 12 | 7 | — | — |
| `config_id` | 20 | 1 | — | — |
| `prefab_id` | 21 | 1 | — | — |
| `guid_list` | 7 | 10002 | 2 | 1 |
| `int_list` | 8 | 10002 | 3 | 2 |
| `bool_list` | 9 | 10002 | 4 | 6 |
| `float_list` | 10 | 10002 | 5 | 4 |
| `str_list` | 11 | 10002 | 6 | 5 |
| `entity_list` | 13 | 10002 | 1 | 0 |
| `vec3_list` | 15 | 10002 | 12 | 7 |
| `config_id_list` | 22 | 10002 | 20 | 1 |
| `prefab_id_list` | 23 | 10002 | 21 | 1 |

## Usage Examples

```typescript
// Sending a signal with args
f.sendSignal('MySignal', [
  { name: 'count', type: 'int', value: 5n },
  { name: 'positions', type: 'vec3_list', value: [[1,0,0],[0,1,0]] },
])

// Receiving (monitoring) a signal with args
f.onSignal('MySignal', (evt) => {
  const count = evt.count   // bigint
  const positions = evt.positions  // vec3[]
}, [
  { name: 'count', type: 'int' },
  { name: 'positions', type: 'vec3_list' },
])
```

## Raw Array Auto-wrap

When a `_list` type argument's `value` is a raw JS array (not produced by `assemblyList()`),
`sendSignal()` automatically wraps it via `this.assemblyList()` → an `assembly_list` node + conn reference.
This ensures GIA compatibility (listLiteral inline encoding is not supported by the vendor layer).
