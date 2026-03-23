# Data Assembly & Type Conversion

**Source**: `src/definitions/nodes.ts`

## Assembly / Construction

| # | Method | nodeType | Type | Line | Notes |
|---|--------|----------|------|------|-------|
| 1 | `assemblyList(items, type?)` | `assembly_list` | data | 1007 | Assemble a typed list (10 element types) |
| 2 | `emptyList(type)` | `empty_list` | data | 1101 | Create an empty list |
| 3 | `emptyLocalVariableList(type)` | _(local var + empty list)_ | data | 1145 | Empty list as local variable |
| 4 | `assemblyDictionary(pairs)` | `assembly_dictionary` | data | 1189 | Assemble a dictionary from key-value pairs |
| 5 | `createDictionary(keyList, valueList)` | `create_dictionary` | data | 2428 | Build a dictionary from two parallel lists |
| 6 | `assembleStructure()` | `assemble_structure` | data | 10779 | Assemble a structure — SPECIAL_NODE_ID: 300002 |
| 7 | `splitStructure()` | `split_structure` | data | 10765 | Decompose a structure — SPECIAL_NODE_ID: 300003 |
| 8 | `modifyStructure()` | `modify_structure` | exec | 7281 | Modify a structure — SPECIAL_NODE_ID: 300004 |

## Type Conversion

| # | Method | nodeType | Type | Notes |
|---|--------|----------|------|-------|
| 1 | `dataTypeConversion(input, type)` | `data_type_conversion_{type}` | data | nodeType is dynamic, e.g. `data_type_conversion_str` |

**Supported conversion pairs** (`DataTypeConversionMap` in `nodes.ts`):

| From | To |
|------|----|
| `bool` | `int`, `str` |
| `entity` | `str` |
| `faction` | `str` |
| `float` | `int`, `str` |
| `guid` | `str` |
| `int` | `bool`, `float`, `str` |
| `vec3` | `str` |
