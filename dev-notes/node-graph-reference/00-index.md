# genshin-ts Node Graph Reference

- **Date**: 2026-03-23
- **Source version**: master (commit a56bb66 + uncommitted signal-args changes)
- **Primary source**: `src/definitions/nodes.ts` (`ServerExecutionFlowFunctions` class)

---

## Overview

genshin-ts is a library for writing Genshin Impact UGC node graphs in TypeScript and compiling them to GIA binaries.

**Pipeline**: `.gs.ts` → IR JSON → `.gia` binary

Node types:
- **exec**: Action nodes — run sequentially in an exec chain
- **event**: Event listeners — fire a handler when a condition occurs
- **data**: Pure data nodes — compute/query and return a value

**Source files**:
| File | Role |
|------|------|
| `src/definitions/nodes.ts` | All node method definitions (`ServerExecutionFlowFunctions`, ~15,500 lines) |
| `src/definitions/events.ts` | Event metadata (`ServerEventMetadata`, output pin definitions) |
| `src/definitions/events-payload.ts` | Event handler payload types |
| `src/definitions/node_modes.ts` | beyond / classic mode restrictions |
| `src/runtime/core.ts` | Runtime event registration (`onXxx` methods) |
| `src/runtime/ir_builder.ts` | Special IR build handling (`NODE_BUILDERS`) |
| `src/compiler/ir_to_gia_transform/mappings.ts` | GIA node ID mappings (`SPECIAL_NODE_IDS`) |

---

## Sections

| File | Category |
|------|----------|
| [01-flow-control.md](01-flow-control.md) | Flow Control |
| [02-variables.md](02-variables.md) | Variables |
| [03-data-assembly-conversion.md](03-data-assembly-conversion.md) | Data Assembly & Type Conversion |
| [04-list-operations.md](04-list-operations.md) | List Operations |
| [05-dictionary-operations.md](05-dictionary-operations.md) | Dictionary Operations |
| [06-math-vector.md](06-math-vector.md) | Math & Vector |
| [07-logic-bitwise.md](07-logic-bitwise.md) | Logic & Bitwise |
| [08-comparison.md](08-comparison.md) | Comparison |
| [09-entity-management.md](09-entity-management.md) | Entity Management |
| [10-entity-queries.md](10-entity-queries.md) | Entity Queries |
| [11-collision-physics.md](11-collision-physics.md) | Collision & Physics |
| [12-motion-pathing.md](12-motion-pathing.md) | Motion & Pathing |
| [13-combat-hp.md](13-combat-hp.md) | Combat & HP |
| [14-effects-projectiles.md](14-effects-projectiles.md) | Effects & Projectiles |
| [15-status-unit-status.md](15-status-unit-status.md) | Status & Unit Status |
| [16-timers.md](16-timers.md) | Timers |
| [17-character-class-skill.md](17-character-class-skill.md) | Character, Class & Skill |
| [18-revive-death.md](18-revive-death.md) | Revive & Death |
| [19-player-queries.md](19-player-queries.md) | Player Queries |
| [20-signal.md](20-signal.md) | Signal |
| [21-camera-ui.md](21-camera-ui.md) | Camera & UI |
| [22-audio.md](22-audio.md) | Audio |
| [23-tag-aggro.md](23-tag-aggro.md) | Tag & Aggro |
| [24-shop-inventory.md](24-shop-inventory.md) | Shop & Inventory |
| [25-equipment.md](25-equipment.md) | Equipment |
| [26-loot.md](26-loot.md) | Loot |
| [27-settlement-ranking.md](27-settlement-ranking.md) | Settlement & Ranking |
| [28-mini-map.md](28-mini-map.md) | Mini-Map |
| [29-patrol-waypoint.md](29-patrol-waypoint.md) | Patrol & Waypoint |
| [30-achievement-scan.md](30-achievement-scan.md) | Achievement & Scan |
| [31-deck-selector.md](31-deck-selector.md) | Deck Selector |
| [32-environment-time.md](32-environment-time.md) | Environment & Time |
| [33-chat-channel.md](33-chat-channel.md) | Chat & Channel |
| [34-gift-box.md](34-gift-box.md) | Gift Box |
| [35-deployment-group.md](35-deployment-group.md) | Deployment Group |
| [36-utilities.md](36-utilities.md) | Utilities |
| [37-events.md](37-events.md) | Events (all 59) |
| [38-special-nodes.md](38-special-nodes.md) | Special Node IDs & IR Builder |
| [39-mode-restrictions.md](39-mode-restrictions.md) | Mode Restrictions (beyond / classic) |

---

## Statistics

| Item | Count |
|------|-------|
| exec nodes | ~180+ |
| data nodes | ~120+ |
| event nodes | 59 |
| Special node IDs | 5 |
| IR builder special handling | 3 |
| beyond-only methods | 37+ |
| classic-only methods | 5 |
| Signal argument types | 18 |
