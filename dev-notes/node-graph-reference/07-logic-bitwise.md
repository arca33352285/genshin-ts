# Logic & Bitwise

**Source**: `src/definitions/nodes.ts`

All nodes are type `data`.

## Logical

| # | Method | nodeType | Line |
|---|--------|----------|------|
| 1 | `logicalAndOperation(a, b)` | `logical_and_operation` | 9732 |
| 2 | `logicalOrOperation(a, b)` | `logical_or_operation` | 9668 |
| 3 | `logicalXorOperation(a, b)` | `logical_xor_operation` | 9700 |
| 4 | `logicalNotOperation(input)` | `logical_not_operation` | 9637 |

## Bitwise (int)

| # | Method | nodeType | Line |
|---|--------|----------|------|
| 5 | `bitwiseAnd(a, b)` | `bitwise_and` | 10575 |
| 6 | `bitwiseOr(a, b)` | `bitwise_or` | 10607 |
| 7 | `xorExclusiveOr(a, b)` | `xor_exclusive_or` | 10639 |
| 8 | `bitwiseComplement(value)` | `bitwise_complement` | 10668 |
| 9 | `leftShiftOperation(val, count)` | `left_shift_operation` | 10501 |
| 10 | `rightShiftOperation(val, count)` | `right_shift_operation` | 10538 |
| 11 | `writeByBit(val, start, end, write)` | `write_by_bit` | 10705 |
| 12 | `readByBit(val, start, end)` | `read_by_bit` | 10745 |
