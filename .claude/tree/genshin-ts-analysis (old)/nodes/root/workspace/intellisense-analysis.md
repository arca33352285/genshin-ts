# genshin-ts IntelliSense & Type Quality Analysis

**Date:** 2026-03-28
**Scope:** `src/runtime/`, `src/definitions/`, `src/compiler/`, `src/injector/`, `src/index.ts`, `types/gsts/`
**Total issues found:** 52 (9 critical, 18 moderate, 25 minor/JSDoc)

---

## Executive Summary

genshin-ts has three structural IntelliSense problems that affect every library consumer:

1. **The protobuf layer is untyped.** `proto.ts` and `node_graph.ts` use `Record<string, unknown>` and `protobuf.Type` throughout, forcing `as unknown as X` and `as never` casts at every call site in `index.ts`. This is a foundational issue — fixing it cleanly requires either generating typed protobuf wrappers or defining a structural interface for the decoded graph shape.

2. **The signal API defeats autocomplete.** `onSignal`/`monitorSignal` handlers receive `evt` typed as `... & Record<string, any>`. Every `evt.anything` succeeds silently. This is the most user-visible API surface (signal handlers are the primary game-logic authoring point) and the worst IntelliSense experience in the codebase.

3. **IR wire-format types use `any` for semantically `null` values.** Six entries in `AdvancedValueTypeMap`, `StructValueTypeMap`, `DictValueTypeMap` etc. are typed `any` when the correct wire value is `null`. This silently widens every type that composes `ValueTypeMap`.

Beyond these three, the main issue pattern is **missing exports** (types used in public API signatures that are not exported from the barrel) and **missing JSDoc** (especially on `GstsConfig` fields and compiler stage option types).

---

## Section 1: Critical Issues

*Issues that cause incorrect, missing, or actively misleading IntelliSense for library consumers.*

### C-1. Signal handler `evt` typed as `Record<string, any>` — autocomplete completely defeated
**File:** `src/runtime/core.ts:179,885`, `src/definitions/events-payload.ts:987`
**Problem:** `onSignal` handlers receive:
```ts
evt: ServerEventPayloadsByMode<Mode>['monitorSignal'] & Record<string, any>
```
The `& Record<string, any>` intersection means every property access on `evt` succeeds without error. Custom signal arg names/types are supplied at call-site via `signalArgs?: Array<{ name: string; type: string }>` — because these are runtime strings, a fully generic solution requires an overloaded generic form:
```ts
onSignal<Args extends SignalArgsDef>(
  signalName: string,
  handler: (evt: SignalPayload<Args>) => void,
  signalArgs: Args
): this
```
At minimum, replace `Record<string, any>` with `Record<string, value>` to restrict values to known value types rather than accepting anything.

### C-2. `IR.d.ts` — 6 IR wire-format values typed `any` instead of `null`
**File:** `src/runtime/IR.d.ts:185,201,205,209,218,222`
**Problem:** `AdvancedValueTypeMap.entity`, `StructValueTypeMap.struct`, `DictValueTypeMap.dict`, `GenericValueTypeMap.generic`, `LocalVariableValueTypeMap.local_variable`, `CustomVariableSnapshotValueTypeMap.custom_variable_snapshot` are all `any`. The correct wire value is `null` (these types carry no inline value — only type metadata). This `any` bleeds into every downstream type that composes `ValueTypeMap`.
**Fix:**
```ts
entity: null
struct: null
dict: null
generic: null
local_variable: null
custom_variable_snapshot: null
```

### C-3. `IR.d.ts` — `Variable.value` for dict type is `any`
**File:** `src/runtime/IR.d.ts:63`
**Problem:** `{ name: string; type: 'dict'; dict: {...}; value?: any }` — dict variables have no literal initial value. `value` should be `value?: never` or `value?: undefined` to prevent accidental writes.

### C-4. `server()` implementation return type is `any`
**File:** `src/runtime/core.ts:807`
**Problem:** The implementation overload signature returns `any`. Within the function body all type discipline is lost. The cast at line 899 already produces the correct type — the `any` return should be replaced with the full return type annotation `ServerGraphApi<Vars, ResolvedLang, ResolvedMode>`.

### C-5. `NodeGraphObj = Record<string, unknown>` — decoded protobuf objects have no IntelliSense
**File:** `src/injector/node_graph.ts:6`
**Problem:** Every property access on decoded graph objects requires scattered inline casts. No field completion is possible.
**Fix:** Define a structural interface:
```ts
interface NodeGraphShape {
  id?: { id?: number; type?: number }
  name?: string
  nodes?: NodeGraphObj[]
}
```
Use `NodeGraphShape` as the return type of `loadGiaGraph` and `findNodeGraphTargets`.

### C-6. `proto.ts` — `protobuf.Type` return means zero static field checking
**File:** `src/injector/proto.ts:13-17`
**Problem:** `GiaProto` holds `rootMessage: protobuf.Type` and `nodeGraphMessage: protobuf.Type`. `.decode()` returns `protobuf.Message<{}>`. All callers cast with `as unknown as X` or `as never`. Errors in field names are invisible to TypeScript.
**Fix (pragmatic):** Cast once inside the decode/encode wrappers in `node_graph.ts` rather than at every call site. Cast to a documented structural type rather than `never`.
**Fix (proper, longer-term):** Generate typed wrappers with `ts-proto` or `protoc-gen-ts`.

### C-7. `as never` cast at protobuf encode site
**File:** `src/injector/index.ts:181`
**Problem:** `proto.nodeGraphMessage.encode(newGraph as never)` — casting to `never` is the strongest type-system suppressor available; it will silently break if `newGraph` is later typed.
**Fix:** Cast to `protobuf.Message<NodeGraphObj>` or `object` (the type `protobuf.encode` actually requires).

### C-8. `compileTsToGsFromConfig` has no named return type
**File:** `src/compiler/ts_to_gs_pipeline.ts:367`
**Problem:** Returns an anonymous inferred object. Consumers see a long structural type in IntelliSense and cannot import or reference the result type externally.
**Fix:** Extract and export:
```ts
export type TsToGsCompileFromConfigResult = TsToGsCompileResult & {
  cfgAbsPath: string
  cfgDir: string
  cfg: GstsConfig
}
```
Annotate the function return accordingly.

### C-9. `GiaTask` used in public API but not exported
**File:** `src/compiler/ir_to_gia_pipeline.ts:31`
**Problem:** `GiaTask = { irPath: string; outFile?: string; opts?: WriteGiaFromIrJsonFileOptions }` is the element type of `tasks` in `writeGiaFromIrJsonFiles`. Not exported — consumers see the structural type inline rather than a named type.
**Fix:** Export as `GiaTask` or rename `IrToGiaTask` to match naming conventions, and add to `src/index.ts` exports.

---

## Section 2: Moderate Issues

*Issues that degrade the developer experience or make the API harder to use correctly, but don't cause outright incorrect types.*

### M-1. `send()` / `sendSignal` args typed as `Record<string, any>`
**File:** `src/runtime/server_globals.d.ts:129`, `src/runtime/server_globals.ts:556`
The runtime expects `Array<{ name, type, value }>` entries. The loose type allows wrong-shaped objects without compiler errors.
**Fix:** Type as `Array<{ name: string; type: string; value: unknown }>` (or the full value union).

### M-2. `sendSignal` internal `as any` casts
**File:** `src/definitions/nodes.ts:5736,5738`
Forced by `arg.type` being `string` — downstream consequence of M-1. Fixing M-1 eliminates these.

### M-3. `signalTypeClassMap` missing `faction`, `enumeration`, list types
**File:** `src/runtime/core.ts:563-573`
Missing types cause silent runtime failure (undefined constructor) for signal args with `type: 'faction'` etc. The map key type is `string` rather than a `ValueType` union — should be `Partial<Record<ValueType, new () => value>>`.

### M-4. `parseValue` overloads — implementation signature accepts `v: any`
**File:** `src/definitions/nodes.ts:127-159`
Callers matched by the overload signatures are fine. The implementation's `any` means direct calls outside the overload set pass anything silently. Should use `v: unknown` on the implementation signature.

### M-5. `list<K>` default generic is the full union
**File:** `src/runtime/value.ts:611`
`list<K extends keyof ListableValueTypeMap = keyof ListableValueTypeMap>` — untyped `list` instances carry the full union as element type, losing concrete type information downstream. Consider a factory function requiring explicit `K`, or at least document the behavior.

### M-6. `Mathf.Abs` / `Mathf.Pow` return widened `number | bigint`
**File:** `src/runtime/server_globals.d.ts:165,186`
Could use conditional return types:
```ts
Abs<T extends FloatValue | IntValue>(value: T): T extends IntValue ? bigint : number
```

### M-7. `enumeration<T>.getClassName()` returns `string` instead of `T | ''`
**File:** `src/runtime/value.ts:407`
Loses the enum class literal type for downstream callers.

### M-8. `emitIrJsonForEntries` returns `Promise<void>` — hides processing outcome
**File:** `src/compiler/gs_to_ir_json_transform/index.ts:70`
Callers cannot distinguish "nothing to do" from "did work". If intentionally fire-and-forget, document that explicitly; otherwise return `Promise<{ processed: number }>`.

### M-9. `GsToJsonOptions` and `runtimeOptions` entirely undocumented
**File:** `src/compiler/gs_to_ir_json_transform/index.ts:16-19`
`runtimeOptions` maps to env-var flags passed to a subprocess — completely invisible without reading source.

### M-10. `GstsFeatureFlags` — all 7 boolean fields lack JSDoc
**File:** `src/compiler/gsts_config.ts:1-9`
Users enabling experimental features have no hints about what each flag controls or its stability status.

### M-11. `TsToGsCompileResult` — `outFiles` vs `entryOutFiles` distinction undocumented
**File:** `src/compiler/ts_to_gs_pipeline.ts:225-230`
The difference between all emitted files vs. only those with `@gsts:entry` is critical for pipeline consumers but undocumented.

### M-12. `targetId?: number` — no documented domain; silently accepts invalid values
**File:** `src/injector/types.ts:36`
Add JSDoc: `/** NodeGraph identifier. IDs >= 1_000_000_000 are expected for runtime-created graphs. */` Consider a branded type.

### M-13. `skipNonEmptyCheck` — dangerous bypass flag with no JSDoc
**File:** `src/injector/types.ts:37`
No documentation of when it is safe to use, what it bypasses, or the default.

### M-14. `InjectGilResult.mode: 'replace'` — single-member discriminated union lacks explanation
**File:** `src/injector/types.ts:44-47`
If more modes are planned, document them. If not, consider dropping `mode` or adding a comment that this is reserved for future use.

### M-15. `buildFile` return type unannotated — implicit `Buffer`
**File:** `src/injector/binary.ts:197-211`
Should be explicitly annotated as `Buffer` or `Uint8Array`.

### M-16. `IrToGiaParallelOptions.cwd` undocumented
**File:** `src/compiler/ir_to_gia_pipeline.ts:22-29`
Passed as working directory to spawned subprocesses — non-obvious behavior.

### M-17. `TsToGsCompileParams.onWriteGs` — `isEntry` parameter undocumented
**File:** `src/compiler/ts_to_gs_pipeline.ts:219-222`
`(outFile: string, isEntry: boolean) => void` — `isEntry` semantics not explained.

### M-18. `WriteGiaFromIrJsonFileOptions.preserveIndices` — default behavior undocumented
**File:** `src/compiler/ir_to_gia_transform/shared.ts:26-28`
Does not state that `false`/omitted means indices are re-numbered from 0.

---

## Section 3: Minor Issues & JSDoc Gaps

*Missing documentation that reduces tooltip quality but does not affect type correctness.*

| # | File | What's missing |
|---|------|----------------|
| J-1 | `src/runtime/core.ts` | `IRBuildOptions`, `ServerLang`, `ServerGraphOptions`, `ServerGraphApi`, `GstsCtxType`, `GstsCtxApi`, `GstsPublic`, `MetaCallRegistry` — no English JSDoc |
| J-2 | `src/runtime/runtime_config.ts` | `setRuntimeOptions`, `getRuntimeOptions` — no description, no `@param`/`@returns` |
| J-3 | `src/runtime/execution_flow_types.ts` | All fields use Chinese-only inline comments |
| J-4 | `src/runtime/variables.ts:44` | `VariablesDefinition = Record<string, unknown>` — no JSDoc on expected shape |
| J-5 | `src/definitions/events-payload.ts` | JSDoc in Korean only; `server_on_overloads.d.ts` is bilingual — should match |
| J-6 | `src/runtime/meta_call_types.ts` | `MetaCallRecord`, `MetaCallRecordRef`, `MetaCallRecordType` — no JSDoc |
| J-7 | `src/runtime/IR.d.ts` | `Node.signalParams` field undocumented |
| J-8 | `src/compiler/gsts_config.ts` | `GstsConfig.options` field has no JSDoc (all other fields do) |
| J-9 | `src/compiler/gsts_config.ts:86-88` | `GstsLang`, `GstsGameRegion` — no description |
| J-10 | `src/compiler/ts_to_gs_pipeline.ts:208` | `TsToGsCompileParams.cfgDir` undocumented |
| J-11 | `src/compiler/ts_to_gs_pipeline.ts:208` | `emitEntries`/`programEntries` JSDoc doesn't explain the incremental relationship |
| J-12 | `src/compiler/ir_to_gia_transform/types.ts` | `Position`, `NodeId`, `IRNode` — exported but entirely undocumented |
| J-13 | `src/compiler/ir_merge.ts:248` | `MergeGroupResult.merged` field — ambiguous (in-memory doc vs path) |
| J-14 | `src/injector/index.ts:63` | `createInjector` options — `protoPath` default and `lang` values undocumented |
| J-15 | `src/injector/proto.ts:8-11` | `DEFAULT_GIA_PROTO` — no description of where the bundled proto comes from |
| J-16 | `src/injector/types.ts:57-59` | `InjectGilInput.lang` and `InjectGilFileOptions.lang` — valid values not typed as union |
| J-17 | `src/injector/index.ts:43-59` | `fmtGraphType` — magic numbers (20000, 20003, 20004, 20005) unexplained |
| J-18 | `src/injector/signal_nodes.ts:282-292` | `patchSignalNodeIds` — `parsed?` optimization parameter undocumented |
| J-19 | `src/index.ts:27` | `export *` from prefabs: large namespace pollution; consider grouping under a `prefabs` namespace export |
| J-20 | `src/injector/node_graph.ts:6` | `NodeGraphObj` not exported from public barrel — consumers must import from internal path |
| J-21 | `src/injector/proto.ts:13` | `GiaProto` type not exported — consumers cannot type a variable holding the proto result |
| J-22 | `src/injector/types.ts` | `LenField`, `FolderEntry`, `FolderIndex`, `FolderMetaList` — should carry `@internal` JSDoc tags |
| J-23 | `src/injector/index.ts:220-225` | `injectGilBytes`/`injectGilFile` — no note that proto is cached; batch users should use `createInjector` |
| J-24 | `src/compiler/ts_to_gs_transform/types.ts` | `Env` — large internal context struct, most fields uncommented |
| J-25 | `src/definitions/gilBytes/giaBytes` | Buffer vs Uint8Array relationship undocumented in `InjectGilInput` JSDoc |

---

## Section 4: Root Cause Analysis

### 4.1 Loose type definitions
The primary driver. `any` in `IR.d.ts` and `Record<string, any>` in the signal API are not accidental — they reflect genuine dynamic-ness at runtime (signal arg names are user-defined strings, IR wire values are heterogeneous). The challenge is threading generic type parameters through the call chain to let TypeScript track what's known at each step.

### 4.2 Structural issues
- `GiaTask` not exported is a simple oversight.
- `export * from './definitions/prefabs.js'` in the barrel is an intentional design choice but pollutes the top-level namespace — a structural issue that affects all consumers.
- `NodeGraphObj` not exported forces internal path imports.

### 4.3 Missing JSDoc
The most pervasive pattern. About 40% of issues are documentation gaps that reduce tooltip quality without affecting type correctness. The codebase has Korean- and Chinese-language JSDoc in several files (evidence of localization work in progress) but English coverage is uneven.

### 4.4 API design patterns defeating type narrowing
- The `onSignal` `Record<string, any>` intersection is the clearest case — the API shape (runtime-defined signal arg names) makes static typing genuinely difficult, not just neglected.
- `protobuf.Type` from protobufjs has no static schema by design — the library relies on runtime reflection. The only fix is code generation.
- `server()` returning `any` in the implementation overload is a TypeScript limitation workaround (implementation signatures are not checked against public overloads the same way), not a design mistake.

---

## Section 5: Phased Refactoring Plan

### Phase 1 — High Impact, Low Risk (no API breaking changes)

These changes improve IntelliSense immediately and can be done file-by-file without touching callers.

| # | Change | Files | Effort |
|---|--------|-------|--------|
| P1-1 | Replace 6 `any` entries in `AdvancedValueTypeMap` etc. with `null` | `src/runtime/IR.d.ts` | S |
| P1-2 | Change `Variable.value` dict branch from `any` to `never` | `src/runtime/IR.d.ts` | S |
| P1-3 | Export `GiaTask` (or `IrToGiaTask`) from compiler pipeline and barrel | `src/compiler/ir_to_gia_pipeline.ts`, `src/index.ts` | S |
| P1-4 | Add `TsToGsCompileFromConfigResult` named type and annotate return | `src/compiler/ts_to_gs_pipeline.ts` | S |
| P1-5 | Change `as never` cast to `as object` at protobuf encode site | `src/injector/index.ts:181` | S |
| P1-6 | Add `NodeGraphShape` interface; replace `Record<string, unknown>` | `src/injector/node_graph.ts` | M |
| P1-7 | Define `NodeGraphShape` cast once in decode wrapper; remove scattered casts | `src/injector/node_graph.ts`, `src/injector/index.ts` | M |
| P1-8 | JSDoc pass on all `GstsFeatureFlags` fields | `src/compiler/gsts_config.ts` | S |
| P1-9 | JSDoc pass on `GsToJsonOptions` and `runtimeOptions` | `src/compiler/gs_to_ir_json_transform/index.ts` | S |
| P1-10 | Document `TsToGsCompileResult` fields (outFiles vs entryOutFiles) | `src/compiler/ts_to_gs_pipeline.ts` | S |
| P1-11 | Document `skipNonEmptyCheck` safety implications | `src/injector/types.ts` | S |
| P1-12 | Document `targetId` valid domain | `src/injector/types.ts` | S |
| P1-13 | Add English JSDoc to all exported types in `src/runtime/core.ts` | `src/runtime/core.ts` | M |
| P1-14 | Add `lang` valid union type to `InjectGilInput` / `InjectGilFileOptions` | `src/injector/types.ts` | S |

### Phase 2 — Medium Impact, Moderate Risk (additive API changes)

These add new exports or overloads — source compatible but require updating `src/index.ts`.

| # | Change | Files | Effort |
|---|--------|-------|--------|
| P2-1 | Export `NodeGraphObj` / `NodeGraphShape` from public barrel | `src/index.ts` | S |
| P2-2 | Replace `send()/sendSignal` `Record<string, any>` with typed array | `src/runtime/server_globals.d.ts`, `src/runtime/server_globals.ts` | M |
| P2-3 | Add `signalTypeClassMap` completeness (faction, enumeration, list types) | `src/runtime/core.ts` | M |
| P2-4 | Change `parseValue` implementation signature from `any` to `unknown` | `src/definitions/nodes.ts` | S |
| P2-5 | Add conditional return types to `Mathf.Abs` and `Mathf.Pow` | `src/runtime/server_globals.d.ts` | S |
| P2-6 | Change `enumeration.getClassName()` return from `string` to `T \| ''` | `src/runtime/value.ts` | S |
| P2-7 | Annotate `buildFile` return type explicitly | `src/injector/binary.ts` | S |
| P2-8 | Update `emitIrJsonForEntries` to return `Promise<{ processed: number }>` | `src/compiler/gs_to_ir_json_transform/index.ts` | S |
| P2-9 | Add `@internal` tags to `LenField`, `FolderEntry`, etc. | `src/injector/types.ts` | S |
| P2-10 | Group prefab exports under a namespace or add barrel note | `src/index.ts`, `src/definitions/prefabs.ts` | M |

### Phase 3 — High Complexity, High Payoff (requires design work)

These require new API surface or code generation — should be planned separately.

| # | Change | Files | Effort |
|---|--------|-------|--------|
| P3-1 | `onSignal` generic overload with mapped `SignalArgsDef → payload type` | `src/runtime/core.ts`, `src/definitions/server_on_overloads.d.ts` | L |
| P3-2 | Typed protobuf wrappers via `ts-proto` or `protoc-gen-ts` | `src/injector/proto.ts`, build scripts | XL |
| P3-3 | `server()` implementation return typed as `ServerGraphApi<Vars, ...>` | `src/runtime/core.ts` | M |
| P3-4 | `list<K>` factory function requiring explicit `K` or narrow default | `src/runtime/value.ts` | M |

---

## Section 6: Priority Summary

**Do first (Phase 1, quick wins):**
- Fix `IR.d.ts` `any` → `null` (C-2, C-3) — cascading positive effect on all ValueTypeMap consumers
- Fix `as never` cast (C-7) — low-risk safety improvement
- Export `GiaTask` and add `TsToGsCompileFromConfigResult` (C-8, C-9) — pure additive changes
- JSDoc blitz on `GstsFeatureFlags`, `GsToJsonOptions`, `skipNonEmptyCheck`, `targetId` — high user-visible value, zero risk

**Do second (Phase 2, additive):**
- `NodeGraphShape` interface (C-5, C-6) — consolidates ~6 scattered casts into one
- Fix `send()`/`sendSignal` arg types (M-1, M-2) — prevents silent wrong-shaped signal args
- Complete `signalTypeClassMap` (M-3) — prevents silent runtime failures

**Design and plan separately (Phase 3):**
- `onSignal` generic payload narrowing (C-1) — this is the biggest single IntelliSense improvement but requires careful overload design to avoid breaking existing `on()` call-sites
- Typed protobuf generation (C-6) — large infrastructure change, warrants its own branch
