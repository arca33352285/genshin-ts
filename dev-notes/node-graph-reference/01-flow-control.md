# Flow Control

**Source**: `src/definitions/nodes.ts` — `ServerExecutionFlowFunctions` class

| # | Method | nodeType | Type | Line | Notes |
|---|--------|----------|------|------|-------|
| 1 | `return()` | _(none)_ | control | 714 | Terminates the current branch — does not register a node |
| 2 | `continue()` | _(none)_ | control | 735 | Skips the current loop iteration — does not register a node |
| 3 | `breakLoop(...loopNodeIds)` | `break_loop` | exec | 2799 | Exits a loop |
| 4 | `doubleBranch(condition, trueBranch, falseBranch)` | `double_branch` | exec | 3204 | if/else branch |
| 5 | `finiteLoop(count, loopBody)` | `finite_loop` | exec | 2827 | Fixed-count loop |
| 6 | `listIterationLoop(list, loopBody)` | `list_iteration_loop` | exec | 2890 | Iterate over a list |
| 7 | `multipleBranches(input, branches)` | `multiple_branches` | exec | 3014 | switch/case branch |

> `break_loop` has special IR builder handling via `buildBreakLoopNode` (`ir_builder.ts:137`).
> It does not connect to exec output pins; instead it connects to the loop's break-input pin by node ID.
