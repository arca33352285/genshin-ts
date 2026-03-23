# List Operations

**Source**: `src/definitions/nodes.ts`

All list methods are overloaded for 10 element types: `float`, `int`, `bool`, `config_id`, `entity`, `faction`, `guid`, `prefab_id`, `str`, `vec3`.

## Mutating (exec)

| # | Method | nodeType | Line |
|---|--------|----------|------|
| 1 | `insertValueIntoList(list, id, value)` | `insert_value_into_list` | 3291 |
| 2 | `modifyValueInList(list, id, value)` | `modify_value_in_list` | 3360 |
| 3 | `removeValueFromList(list, id)` | `remove_value_from_list` | 3426 |
| 4 | `clearList(list)` | `clear_list` | 3576 |
| 5 | `listSorting(list, sortBy)` | `list_sorting` | 3486 |
| 6 | `concatenateList(target, input)` | `concatenate_list` | 3515 |

## Query (data)

| # | Method | nodeType | Line |
|---|--------|----------|------|
| 7 | `getCorrespondingValueFromList(list, id)` | `get_corresponding_value_from_list` | 11230 |
| 8 | `getListLength(list)` | `get_list_length` | 11294 |
| 9 | `getMaximumValueFromList(list)` | `get_maximum_value_from_list` | 11357 |
| 10 | `getMinimumValueFromList(list)` | `get_minimum_value_from_list` | 11388 |
| 11 | `listIncludesThisValue(list, value)` | `list_includes_this_value` | 11422 |
| 12 | `searchListAndReturnValueId(list, value)` | `search_list_and_return_value_id` | 11159 |
