# Timers

**Source**: `src/definitions/nodes.ts`

All nodes are type `exec` unless marked **data**.

## Entity-Local Timers

| # | Method | nodeType | Line |
|---|--------|----------|------|
| 1 | `startTimer(entity, name)` | `start_timer` | 5411 |
| 2 | `pauseTimer(entity, name)` | `pause_timer` | 5441 |
| 3 | `resumeTimer(entity, name)` | `resume_timer` | 5382 |
| 4 | `stopTimer(entity, name)` | `stop_timer` | 5464 |

## Global Timers

| # | Method | nodeType | Line |
|---|--------|----------|------|
| 5 | `startGlobalTimer(entity, name)` | `start_global_timer` | 5510 |
| 6 | `modifyGlobalTimer(entity, name, change)` | `modify_global_timer` | 5536 |
| 7 | `pauseGlobalTimer(entity, name)` | `pause_global_timer` | 5560 |
| 8 | `recoverGlobalTimer(entity, name)` | `recover_global_timer` | 5487 |
| 9 | `stopGlobalTimer(entity, name)` | `stop_global_timer` | 5583 |
| 10 | `getCurrentGlobalTimerTime(entity, name)` | `get_current_global_timer_time` | 13229 | **data** |
