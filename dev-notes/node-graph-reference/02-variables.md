# Variables

**Source**: `src/definitions/nodes.ts`

| # | Method | nodeType | Type | Line | Notes |
|---|--------|----------|------|------|-------|
| 1 | `getCustomVariable(entity, name)` | `get_custom_variable` | data | 1612 | Read entity custom variable |
| 2 | `setCustomVariable(entity, name, value)` | `set_custom_variable` | exec | — | Write entity custom variable |
| 3 | `getNodeGraphVariable(name)` | `get_node_graph_variable` | data | 1921 | Read node graph variable |
| 4 | `setNodeGraphVariable(name, value)` | `set_node_graph_variable` | exec | — | Write node graph variable |
| 5 | `initLocalVariable(type, init?)` | `init_local_variable` | data | 2012 | Initialize local variable (10+ type overloads) |
| 6 | `getLocalVariable(initialValue)` | `get_local_variable` | data | 2219 | Read local variable (10+ type overloads) |
| 7 | `setLocalVariable(var, value)` | `set_local_variable` | exec | — | Write local variable |
| 8 | `queryCustomVariableSnapshot(entity, name)` | `query_custom_variable_snapshot` | data | 2348 | Get a snapshot of a custom variable |
