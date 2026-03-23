# Dictionary Operations

**Source**: `src/definitions/nodes.ts`

## Mutating (exec)

| # | Method | nodeType |
|---|--------|----------|
| 1 | `setOrAddKeyValuePairsToDictionary(dict, key, value)` | `set_or_add_key_value_pairs_to_dictionary` |
| 2 | `removeKeyValuePairsFromDictionaryByKey(dict, key)` | `remove_key_value_pairs_from_dictionary_by_key` |
| 3 | `clearDictionary(dict)` | `clear_dictionary` |
| 4 | `sortDictionaryByKey(dict, sortBy)` | `sort_dictionary_by_key` |
| 5 | `sortDictionaryByValue(dict, sortBy)` | `sort_dictionary_by_value` |

## Query (data)

| # | Method | nodeType |
|---|--------|----------|
| 6 | `queryDictionarySLength(dict)` | `query_dictionary_s_length` |
| 7 | `queryDictionaryValueByKey(dict, key)` | `query_dictionary_value_by_key` |
| 8 | `queryIfDictionaryContainsSpecificKey(dict, key)` | `query_if_dictionary_contains_specific_key` |
| 9 | `queryIfDictionaryContainsSpecificValue(dict, value)` | `query_if_dictionary_contains_specific_value` |
| 10 | `getListOfKeysFromDictionary(dict)` | `get_list_of_keys_from_dictionary` |
| 11 | `getListOfValuesFromDictionary(dict)` | `get_list_of_values_from_dictionary` |
