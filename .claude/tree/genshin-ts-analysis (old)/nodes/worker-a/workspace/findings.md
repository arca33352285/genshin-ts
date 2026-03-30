# worker-a Findings: Runtime & Definitions

## Critical Issues (high IntelliSense impact)

### 1. `any` in IR value type map (`src/runtime/IR.d.ts:185,201,205,209,218,222`)
`AdvancedValueTypeMap.entity`, `StructValueTypeMap.struct`, `DictValueTypeMap.dict`, `GenericValueTypeMap.generic`, `LocalVariableValueTypeMap.local_variable`, and `CustomVariableSnapshotValueTypeMap.custom_variable_snapshot` are all typed as `any`.

These are the IR wire-format types — the values flowing through JSON. For most of them the IR value is `null` (the wire carries only type metadata). A better shape:
```ts
entity: null        // IR entity pins carry no inline value
struct: null
dict: null          // dict metadata is in the separate `dict` field
generic: null
local_variable: null
custom_variable_snapshot: null
```
The `any` here bleeds into every downstream type that touches `ValueTypeMap`, silently widening anything derived from it.

### 2. `any` on `Variable.value` for dict type (`src/runtime/IR.d.ts:63`)
```ts
| { name: string; type: 'dict'; dict: { k: DictKeyType; v: DictValueType }; value?: any }
```
`value` here represents the initial value of a dict node-graph variable (always absent — dicts have no literal initial value). Should be `value?: never` or `value?: undefined` to prevent accidental writes.

### 3. `onSignal` handler receives `Record<string, any>` for custom signal args (`src/runtime/core.ts:179,885`, `src/definitions/events-payload.ts:987`)
```ts
evt: ServerEventPayloadsByMode<Mode>['monitorSignal'] & Record<string, any>
```
The intersection with `Record<string, any>` defeats IntelliSense for `evt`. Custom signal arg names/types are supplied at call-site via `signalArgs?: Array<{ name: string; type: string }>`. Because these names are runtime strings, a fully generic solution requires either:
- An overloaded `onSignal<Args extends SignalArgsDef>(signalName, handler, signalArgs)` with a mapped type from `Args` to the payload type, or
- At minimum, changing the intersection to `Record<string, value>` to at least narrow away primitive inference

The current `any` is the most IntelliSense-defeating choice here; every `evt.anything` succeeds silently.

### 4. `server()` implementation returns `any` (`src/runtime/core.ts:807`)
```ts
function server<Vars extends VariablesDefinition = VariablesDefinition>(
  options?: ServerGraphOptions<Vars>
): any {
```
This is the implementation overload and the return is immediately cast back, so users do not see this. However, within the function body all type discipline is lost. Should return `ServerGraphApi<Vars, ResolvedLang, ResolvedMode>` — the cast at line 899 (`return api as ServerGraphApi<...>`) already provides that.

---

## Moderate Issues

### 5. `parseValue(v: any, ...)` overloads (`src/definitions/nodes.ts:127–159`)
All 29 overloads take `v: any`. The first argument is the raw user-supplied value being parsed. It could be typed `unknown` on the implementation signature — the overloads already specify concrete types correctly for callers, and `unknown` on the implementation forces explicit narrowing inside (currently done correctly). The only practical impact is that direct calls on the implementation signature (not matched by an overload) accept anything silently.

### 6. `send(signalName, args?: Record<string, any>)` (`src/runtime/server_globals.d.ts:129`, `src/runtime/server_globals.ts:556`)
Signal send args are `Record<string, any>` but the actual runtime expects structured `{ name, type, value }` entries. The type should be:
```ts
args?: Array<{ name: string; type: string; value: RuntimeParameterValueTypeMap[keyof RuntimeParameterValueTypeMap] }>
```
Or at minimum `Array<{ name: string; type: string; value: unknown }>`. The current loose typing means the compiler won't catch wrong-shaped signal arg objects.

### 7. `sendSignal` internal `as any` casts (`src/definitions/nodes.ts:5736,5738`)
```ts
v = this.assemblyList(v, baseType as any)
const parsed = parseValue(v, arg.type as any)
```
These are forced by the `arg.type` being `string` at that point. If `sendSignal`'s arg type was narrowed (see issue 6), these casts could be eliminated. As-is they are a runtime-checked gap.

### 8. `signalTypeClassMap` in `MetaCallRegistry.registerEvent` lacks completeness (`src/runtime/core.ts:563–573`)
```ts
const signalTypeClassMap: Record<string, new () => value> = {
  entity, guid, int, bool, float, str, vec3,
  config_id: configId,
  prefab_id: prefabId
}
```
Types `faction`, `enumeration`, and list types are absent. A signal arg with `type: 'faction'` or `type: 'str_list'` will silently fail at the `new typeBase()` call (undefined). The record key type is `string` rather than a `ValueType` union.

### 9. `list<K>` default generic is too wide (`src/runtime/value.ts:611`)
```ts
export class list<K extends keyof ListableValueTypeMap = keyof ListableValueTypeMap> extends value {
```
Default generic resolves to the full union `'bool' | 'int' | 'float' | ...`. When a `list` is created without specifying `K`, `getConcreteType()` returns the union rather than a concrete key. Callers that pass an untyped list lose the element type. A narrower default (or requiring explicit instantiation via a factory) would propagate the concrete list type.

### 10. `Mathf.Abs` and `Mathf.Pow` return widened union (`src/runtime/server_globals.d.ts:165,186`)
```ts
Abs(value: FloatValue | IntValue): number | bigint
Pow(base: FloatValue | IntValue, exponent: FloatValue | IntValue): number | bigint
```
Return types are `number | bigint` regardless of the input type. These could use a conditional return type:
```ts
Abs<T extends FloatValue | IntValue>(value: T): T extends IntValue ? bigint : number
```
As-is callers always receive the wider union and must narrow manually.

### 11. `enumeration<T>` `getClassName()` loses type information (`src/runtime/value.ts:407`)
```ts
getClassName(): string {
  return this.className
}
```
Should return `T | ''` to preserve the enum class literal type for callers that need to distinguish enum types at compile time.

---

## Minor / JSDoc gaps

### 12. `src/runtime/core.ts` — exported types lack JSDoc
`IRBuildOptions`, `ServerLang`, `ServerGraphOptions`, `ServerExecutionFlowFunctionsWithVars`, `ServerGraphApi`, `GstsCtxType`, `GstsCtxApi`, `GstsPublic`, `MetaCallRegistry` — all exported but undocumented or have only Korean comments. English-speaking users of the package get no IntelliSense descriptions for these types.

### 13. `src/runtime/runtime_config.ts` — no JSDoc on exported functions
`setRuntimeOptions` and `getRuntimeOptions` have no description, parameter docs, or return docs.

### 14. `src/runtime/execution_flow_types.ts` — most fields have Chinese-only comments
`ExecutionFlow`, `ExecContext`, `IRBuildInput` fields use Chinese inline comments. Not a blocking problem but unhelpful to English users.

### 15. `src/runtime/variables.ts:44` — `VariablesDefinition` is `Record<string, unknown>`
```ts
export type VariablesDefinition = Record<string, unknown>
```
No JSDoc explains the expected shape. Users constructing `variables` objects have no guidance beyond the type. A descriptive JSDoc and/or a branded/narrowed type (e.g. `Record<string, ScalarOrListOrDictInitializer>`) would improve the experience.

### 16. `src/definitions/events-payload.ts` — JSDoc in Korean only
All event payload descriptions are in Korean (ported from Chinese). English users relying on IntelliSense tooltips in the `on(eventName, handler)` call see only Korean text. The `server_on_overloads.d.ts` is bilingual (EN+ZH) — `events-payload.ts` should follow the same pattern.

### 17. `src/runtime/meta_call_types.ts` — no JSDoc
`MetaCallRecord`, `MetaCallRecordRef`, `MetaCallRecordType` are internal but used externally (re-exported in `core.ts:51`). They have no documentation.

### 18. `src/runtime/IR.d.ts` — `Node.signalParams` field undocumented
```ts
signalParams?: Array<{ name: string; type: string }>
```
No description. Used for signal node serialization but only hinted at by field name.

---

## Summary

The biggest IntelliSense problems are concentrated in three areas. First, `IR.d.ts` uses `any` for IR wire-format values that are semantically `null`, causing silent widening throughout all types that compose `ValueTypeMap`. Second, `onSignal`/`monitorSignal` payloads are intersected with `Record<string, any>`, which completely defeats autocomplete on the `evt` argument in signal handlers — the most dynamic and user-visible API surface. Third, `parseValue` and `sendSignal` accept `any` for their value parameters, which means the compiler cannot catch type mismatches at the most important runtime boundary (user values → IR nodes). The entity helper narrowing system (`EntityOf`, `ReplaceEntityByMode`) is well-designed and does its job correctly; the main issue there is the missing `faction`/enum types in the signal arg class map.
