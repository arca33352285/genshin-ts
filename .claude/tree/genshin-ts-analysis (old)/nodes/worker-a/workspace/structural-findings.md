# worker-a Structural Findings: Runtime & Definitions

## High Impact Issues

### 1. Bidirectional Coupling: runtime ↔ definitions

**Files:** `src/runtime/core.ts`, `src/runtime/server_globals.ts`, `src/runtime/value.ts` ↔ `src/definitions/nodes.ts`, `src/definitions/events.ts`, etc.

**Problem:** The dependency between `runtime/` and `definitions/` flows in both directions, creating a design-level cycle.

- `runtime/core.ts` imports from `definitions/events.ts`, `definitions/events-payload.ts`, `definitions/events-payload-mode.ts`, `definitions/nodes.ts`, `definitions/node_modes.ts`, `definitions/server_on_overloads.d.ts`, `definitions/zh_aliases.ts`.
- `runtime/server_globals.ts` imports from `definitions/entity_helpers.ts`, `definitions/enum.ts`, `definitions/nodes.ts`.
- `runtime/value.ts` imports from `definitions/entity_helpers.ts` and `definitions/enum.js`.
- Going the other direction: `definitions/nodes.ts` imports `MetaCallRegistry` from `runtime/core.js`. `definitions/server_on_overloads.d.ts` imports `ServerExecutionFlowFunctionsWithVars` from `runtime/core.js`. Several `definitions/` files import from `runtime/IR.js` and `runtime/value.js`.

**Why this matters:** `runtime/` is supposed to be the execution engine; `definitions/` is supposed to be data (auto-generated game metadata). The fact that `definitions/nodes.ts` — an auto-generated file — imports `MetaCallRegistry` from the runtime core creates a tight coupling that prevents treating either layer as independently replaceable. If `definitions/` were truly pure data/type files, they would only import from `runtime/` for value types, never for `MetaCallRegistry`.

**Concrete suggestion:** Extract the `ServerExecutionFlowFunctions` class (currently defined in `definitions/nodes.ts` but using `MetaCallRegistry`) into a runtime-side file (e.g., `runtime/execution_flow_functions.ts`). The auto-generated `definitions/nodes.ts` would then only carry type declarations and parameter metadata, with no dependency on `runtime/core.ts`. This would make the dependency graph unidirectional: `runtime/ → definitions/` for metadata, `definitions/` → `runtime/` only for value primitive types.

---

### 2. `core.ts` Mixes Multiple Responsibilities

**File:** `src/runtime/core.ts` (~1018 lines)

**Problem:** `core.ts` does all of the following in a single file:
- Defines the `GstsPublic`/`GstsCtxApi` global injection API and the `gsts` global (`ensureGsts()`)
- Defines `MetaCallRegistry` — the stateful graph builder (the largest class, ~450 lines)
- Defines the `server()` factory function and all its overloads
- Defines the "unused nodes" optimization (`removeUnusedNodesFromFlow`, ~75 lines)
- Defines `buildServerGraphRegistriesIRDocuments` — the final IR assembly step
- Manages the `serverRegistries` module-level global array
- Exports type aliases for consumer use

These are at least four distinct concerns: (a) global setup, (b) the `MetaCallRegistry` graph-recording engine, (c) the `server()` user-facing API factory, (d) an optimization pass. Mixing them makes the file hard to navigate and makes unit isolation difficult.

**Concrete suggestion:**
- Move `MetaCallRegistry` to `runtime/meta_call_registry.ts`.
- Move `removeUnusedNodesFromFlow` and `buildServerGraphRegistriesIRDocuments` to `ir_builder.ts` or a new `runtime/ir_pipeline.ts` (since `ir_builder.ts` already handles IR serialization).
- Keep `core.ts` to just the `server()` factory and `g` export (the public entry point).
- Keep `ensureGsts()` in a new `runtime/gsts_global.ts`.

---

### 3. `server_globals.ts` Mixes Game Logic with Global Injection

**File:** `src/runtime/server_globals.ts` (~979 lines)

**Problem:** `server_globals.ts` has two very different responsibilities:
1. Installing global shims (`installServerGlobals`, `installScopedServerGlobals`) — injecting `bool()`, `int()`, `str()`, `raw()`, `stage`, `self`, `player`, `Math` overrides, etc. into `globalThis`.
2. Implementing complex domain logic: timer pooling (setTimeout/setInterval → node graph nodes), type conversion chains, stage bootstrap, entity helpers wiring.

The timer implementation (~300 lines) alone is sophisticated enough to warrant its own file. The global injection machinery is a separate concern from timer semantics.

**Concrete suggestion:** Extract timer-related code (`TimerOptions`, `TimerCaptureSpec`, timer installation functions, `registerTimerHandlerOnce`, `attachTimerCaptureMeta`, etc.) into `runtime/timer_globals.ts`. Keep `server_globals.ts` focused on global API surface injection.

---

### 4. `ir_optimize_return_vars.ts` Has a Cross-Layer Import

**File:** `src/runtime/ir_optimize_return_vars.ts` (line 1)

**Problem:** This file imports `IRNode` from `../compiler/ir_to_gia_transform/types.js` — a compiler-stage file. This is the only place `runtime/` imports from `compiler/`. The comment at line 13 says this optimization is deprecated ("弃用的优化"). Having a `runtime/` → `compiler/` dependency inverts the expected pipeline direction (runtime should not know about compiler internals).

**Concrete suggestion:** Since this optimization is marked as deprecated and unused (comment says it was replaced by the local variable approach), simply delete the file. If it needs to be kept for reference, move it out of `runtime/` into a `docs/` or `archive/` location, or at minimum move the `IRNode` type it needs into `runtime/IR.d.ts`.

---

## Medium Impact Issues

### 5. `processDictParam` is a Hardcoded Special-Case in Core

**File:** `src/runtime/core.ts` (lines 324–331)

**Problem:** The `processDictParam` function has a `switch` statement with a single case `'purchaseItemDictionary'`, with a `default` that throws. This means any new event parameter that uses a `dict` type requires a code change here. The function exists because `dict` types need key/value type information that the event metadata schema doesn't currently carry.

**Concrete suggestion:** Add optional `dictKeyType`/`dictValueType` fields to the event parameter metadata type in `definitions/events.ts` and the generation script. `processDictParam` can then be eliminated — the metadata itself carries the dict type. This is the same information pattern used for `enumeration` (which carries `typeName`).

---

### 6. `signalTypeClassMap` in `core.ts` is a Partial Duplicate of `buildConnValueType`

**File:** `src/runtime/core.ts` (lines 563–573)

**Problem:** `registerEvent` contains a local `signalTypeClassMap` mapping type strings to constructors. This is a partial version of the type-string-to-class mapping that already exists implicitly in `buildConnValueType` in `ir_builder.ts` and in `generic.asType()` in `value.ts`. There are now three places that enumerate a subset of value types by string name.

**Concrete suggestion:** Export a canonical `VALUE_CLASS_MAP: Record<string, new () => value>` from `value.ts` (it already has `ValueClassMap` as a type — add the runtime object). Replace `signalTypeClassMap` and any similar local maps with a reference to this export.

---

### 7. `variables.ts` Contains Extensive Parser Logic That Belongs in a Separate Module

**File:** `src/runtime/variables.ts` (~657 lines)

**Problem:** `variables.ts` exports the `NodeGraphVarApi` type and `parseVariableDefinitions` function, but the bulk of its content is a layered parser for variable initial values (scalar, list, dict parsing, type inference). This parser is not conceptually part of "variable management" — it is a compile-time validation/parsing step.

**Concrete suggestion:** Consider extracting `parseVariableDefinitions` and all its helpers into `runtime/variable_parser.ts`, keeping `variables.ts` to just the type declarations (`VariablesDefinition`, `NodeGraphVariableMeta`, `NodeGraphVarApi`). This makes `variables.ts` purely definitional and easier to read.

---

### 8. `entity_helpers.ts` is Extremely Large (6093 lines)

**File:** `src/definitions/entity_helpers.ts`

**Problem:** At 6093 lines, this file contains: the `EntityKind`/`EntityOf` type system, `ENTITY_HELPER_METHODS` array, `ReplaceEntityByMode` type machinery, the full `PlayerEntity`, `CharacterEntity`, `StageEntity`, `ObjectEntity`, `CreationEntity` class implementations, and the `installEntityHelpers` function. It is effectively a complete mini-library bundled as one file.

**Concrete suggestion:** Since this is auto-generated, the generation script (`scripts/generate-definitions.ts`) controls its structure. Consider splitting the output into `entity_types.ts` (types and kind markers), `entity_classes.ts` (the five entity classes), and `entity_install.ts` (the `installEntityHelpers` function). Or at minimum, split the type machinery from the class implementations. The file is manageable as-is given it is generated, but if hand-editing entity helpers becomes necessary, the single-file approach becomes a burden.

---

### 9. Parallel Type Enumeration in `variables.ts`: `ScalarType` and `NodeGraphVariableValueType`

**File:** `src/runtime/variables.ts` (lines 67–79 and lines 636–658)

**Problem:** `variables.ts` defines a local `ScalarType` union (lines 67–79) and separately defines `NodeGraphVariableValueType` (lines 636–658). Both enumerate overlapping sets of value type strings. These are in addition to the `ValueType` union already defined in `IR.d.ts`. Three related but slightly different enumerations of value types exist across the codebase.

**Concrete suggestion:** Derive `ScalarType` and `NodeGraphVariableValueType` from the canonical `ValueType` in `IR.d.ts` using `Extract<ValueType, ...>` rather than duplicating the string literals.

---

## Low Impact / Naming

### 10. `server_globals.d.ts` vs `server_globals.ts` Split is Unusual

**Files:** `src/runtime/server_globals.ts`, `src/runtime/server_globals.d.ts`

**Problem:** Having a `.d.ts` alongside a `.ts` of the same name is atypical for non-thirdparty code. In this case `server_globals.d.ts` declares global types for the `globalThis` injections (the shims like `bool()`, `int()`, etc.). This pattern works but is unexpected — normally `.d.ts` files are generated or live in `types/`. A developer reading `server_globals.ts` might not realize there is a companion declaration file.

**Concrete suggestion:** This is intentional (the `.d.ts` declares globally visible symbols that the `.ts` implements). Adding a comment at the top of `server_globals.ts` pointing to the `.d.ts` counterpart would reduce confusion. No structural change needed, but document the pattern.

---

### 11. `camelToSnake` Defined Twice

**Files:** `src/runtime/core.ts` (line 316) and `src/runtime/ir_builder.ts` (line 35)

**Problem:** The same `camelToSnake` utility is defined in both `core.ts` and `ir_builder.ts`, with nearly identical implementations (the only difference being variable name `str` vs `s`).

**Concrete suggestion:** Move `camelToSnake` to a shared utility (either `src/shared/` or `runtime/utils.ts`) and import it in both files.

---

### 12. Mixed Comment Language in Runtime Files

**Files:** Throughout `src/runtime/`

**Problem:** Comments mix Korean, Chinese (Simplified), and English within the same files. `core.ts` uses Korean for doc comments on exported types, Chinese inline for implementation notes (e.g., "强制允许", "默认根执行链从事件节点出发"), and English for error messages. `ir_builder.ts` uses only English. `variables.ts` mixes English doc and Chinese inline. This inconsistency makes the codebase harder to navigate for contributors who may only read one language.

**Concrete suggestion:** Since the project targets Korean users (per JSDoc patterns), consider standardizing on Korean for doc comments and English for inline implementation notes and error messages. Code-generated files (definitions/) can remain in whichever language the generator uses.

---

### 13. `ir_optimize_return_vars.ts` Naming Suggests Relevance

**File:** `src/runtime/ir_optimize_return_vars.ts`

**Problem:** The file is named as an optimization module, but its only export (`optimizeReturnVars`) is explicitly commented as deprecated (line 13: "弃用的优化"). Keeping a deprecated file under a non-deprecated-looking name risks it being referenced or re-used accidentally.

**Concrete suggestion:** Either delete the file (as noted in issue #4) or rename it to `_deprecated_ir_optimize_return_vars.ts` and add a prominent top-of-file deprecation notice.

---

## Dependency Map

### `src/runtime/` Internal Imports

```
IR.d.ts          — no internal imports (pure type definitions)
meta_call_types.ts — imports from value.ts
execution_flow_types.ts — imports from IR.d.ts, meta_call_types.ts, value.ts
runtime_config.ts — no runtime imports (standalone)
value.ts         — imports from definitions/entity_helpers.js, definitions/enum.js
ir_builder.ts    — imports from execution_flow_types.ts, IR.d.ts, meta_call_types.ts, value.ts
variables.ts     — imports from IR.d.ts, value.ts
ir_optimize_return_vars.ts — imports from compiler/ir_to_gia_transform/types.js (!) and IR.d.ts
server_globals.ts — imports from definitions/entity_helpers.js, definitions/enum.js,
                    definitions/nodes.js, value.ts, core.ts
server_globals.d.ts — imports from definitions/entity_helpers.js, definitions/events-payload.js,
                      definitions/nodes.js, value.ts
core.ts          — imports from definitions/events.js, definitions/events-payload.js,
                   definitions/events-payload-mode.js, definitions/nodes.js,
                   definitions/node_modes.js, definitions/server_on_overloads.js,
                   definitions/zh_aliases.js, definitions/enum.js,
                   execution_flow_types.ts, ir_builder.ts, IR.d.ts,
                   meta_call_types.ts, runtime_config.ts, server_globals.ts, value.ts, variables.ts
```

**Cycle:** `runtime/core.ts → definitions/nodes.ts → runtime/core.ts` (via `MetaCallRegistry` import in `nodes.ts`). This is a compile-time type cycle, resolved by TypeScript's import type, but structurally the dependency is bidirectional.

**Cross-layer violation:** `runtime/ir_optimize_return_vars.ts → compiler/ir_to_gia_transform/types.js`. Runtime should not import from compiler.

### `src/definitions/` Imports from `runtime/`

All legitimate (value types, IR types, runtime config):
- `definitions/enum.ts → runtime/value.js` (for enumeration class)
- `definitions/events.ts → runtime/value.js`
- `definitions/events-payload.ts → runtime/value.js`
- `definitions/entity_helpers.ts → runtime/value.js`, `runtime/IR.js`
- `definitions/node_modes.ts → runtime/IR.js`
- `definitions/events-payload-mode.ts → runtime/IR.js`
- `definitions/nodes.ts → runtime/core.js` (MetaCallRegistry — structural concern)
- `definitions/nodes.ts → runtime/IR.js`, `runtime/runtime_config.js`, `runtime/value.js`
- `definitions/server_on_overloads.d.ts → runtime/core.js`, `runtime/IR.js`, `runtime/variables.js`

---

## Summary

The main structural problems in `src/runtime/` and `src/definitions/` are:

1. **Bidirectional coupling between the two directories**: `definitions/nodes.ts` imports `MetaCallRegistry` from `runtime/core.ts`, while `runtime/core.ts` heavily imports from `definitions/`. This creates a logical cycle that prevents treating either layer as independently composable.

2. **`core.ts` is a god file**: At 1018 lines it conflates global setup, the `MetaCallRegistry` graph-recording engine, the `server()` user API factory, and the "remove unused nodes" optimization — four distinct responsibilities that would each benefit from their own file.

3. **`server_globals.ts` bundles dissimilar concerns**: Global API injection (the user-visible shims like `bool()`, `stage`, `Math`) is mixed with complex timer-pooling logic (~300 lines), making the file harder to reason about or test independently.

4. **`ir_optimize_return_vars.ts` is deprecated but retained with a cross-layer import**: It is the only `runtime/` file that imports from `compiler/`, inverts the pipeline direction, and is documented as obsolete — it should be removed.

5. **Multiple partial enumerations of value types**: `signalTypeClassMap`, `ScalarType`, and `NodeGraphVariableValueType` each partially duplicate the canonical `ValueType` union from `IR.d.ts`, and `camelToSnake` is defined twice. Centralizing these would reduce drift risk as new value types are added.
