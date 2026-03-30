# Signal API Type Safety: Feasibility Memo

**Date:** 2026-03-28

---

## 1. Current API Shape

`onSignal` sits on `ServerGraphApi` and is defined separately from the main `.on()` overloads:

```ts
// src/runtime/core.ts:176
onSignal(
  signalName: string,
  handler: (
    evt: ServerEventPayloadsByMode<Mode>['monitorSignal'] & Record<string, any>,
    f: ServerExecutionFlowFunctionsForLang<Vars, Lang, Mode>
  ) => void,
  signalArgs?: Array<{ name: string; type: string }>
): ServerGraphApi<Vars, Lang, Mode>
```

The fixed `monitorSignal` payload (from `events-payload.ts:974`) is:
```ts
monitorSignal: {
  eventSourceEntity: entity
  eventSourceGuid: guid
  signalSourceEntity: entity
} & Record<string, any>   // <-- also has this intersection at the type level
```

So the `Record<string, any>` intersection exists **in two places**:
1. In `events-payload.ts` on the `monitorSignal` type itself
2. On the handler `evt` type in `onSignal`

`sendSignal` (in `definitions/nodes.ts:5723`) takes:
```ts
sendSignal(
  signalName: StrValue,
  signalArgs?: Array<{ name: string; type: string; value: any }>
): void
```

---

## 2. Why `Record<string, any>` Exists

The `& Record<string, any>` intersection is a **deliberate escape hatch** for custom signal args. Signal arg names and types are user-defined at runtime — they are not known at the type level. When a user writes:

```ts
.onSignal('DamageSignal', (evt, f) => {
  const target = evt.targetEntity    // not in monitorSignal's fixed fields
  const amount = evt.damageAmount    // not in monitorSignal's fixed fields
}, [
  { name: 'targetEntity', type: 'entity' },
  { name: 'damageAmount', type: 'int' }
])
```

TypeScript would error on `evt.targetEntity` without the intersection, because `targetEntity` is not a property of the base `monitorSignal` type. The `Record<string, any>` suppresses those errors.

The underlying reason is that `signalArgs` is `Array<{ name: string; type: string }>` — the `name` is a plain `string`, not a string literal, so TypeScript cannot derive `{ targetEntity: entity; damageAmount: int }` from it. The `& Record<string, any>` is the workaround.

---

## 3. Feasibility Assessment

**Yes, this is feasible** — TypeScript has exactly the right machinery for this pattern. The key technique is a generic `signalArgs` parameter with `const` literal inference.

### The type machinery needed

```ts
// Step 1: Define a type for a single signal arg definition
type SignalArgDef = { name: string; type: keyof RuntimeValueTypeMap }

// Step 2: Map an array of arg defs to a payload shape
type SignalArgsToPayload<Args extends readonly SignalArgDef[]> = {
  [K in Args[number] as K['name']]: RuntimeValueTypeMap[K['type']]
}

// Step 3: The fixed base payload
type MonitorSignalBase = {
  eventSourceEntity: entity
  eventSourceGuid: guid
  signalSourceEntity: entity
}
```

`RuntimeValueTypeMap` already exists in `src/runtime/value.ts` — it maps `'int' → int`, `'entity' → entity`, etc. No new mapping needed.

### The generic overload

```ts
onSignal<const Args extends readonly SignalArgDef[]>(
  signalName: string,
  handler: (
    evt: MonitorSignalBase & SignalArgsToPayload<Args>,
    f: ServerExecutionFlowFunctionsForLang<Vars, Lang, Mode>
  ) => void,
  signalArgs: Args
): ServerGraphApi<Vars, Lang, Mode>

// Fallback when signalArgs is omitted
onSignal(
  signalName: string,
  handler: (
    evt: MonitorSignalBase & Record<string, value>,  // value not any
    f: ServerExecutionFlowFunctionsForLang<Vars, Lang, Mode>
  ) => void,
  signalArgs?: undefined
): ServerGraphApi<Vars, Lang, Mode>
```

The `const` modifier on `Args` forces TypeScript to infer `[{ name: 'targetEntity', type: 'entity' }, { name: 'damageAmount', type: 'int' }]` as a **readonly tuple of literals** rather than widening to `Array<{ name: string; type: string }>`.

### What TypeScript infers

Given:
```ts
.onSignal('DamageSignal', (evt, f) => { ... }, [
  { name: 'targetEntity', type: 'entity' },
  { name: 'damageAmount', type: 'int' }
] as const)
```

TypeScript infers `Args = [{ name: 'targetEntity', type: 'entity' }, { name: 'damageAmount', type: 'int' }]`.
`SignalArgsToPayload<Args>` resolves to `{ targetEntity: entity; damageAmount: int }`.
`evt` gets type `MonitorSignalBase & { targetEntity: entity; damageAmount: int }`.

### The `type` field constraint

`type: keyof RuntimeValueTypeMap` — the type string is constrained to the known value types (`'int'`, `'entity'`, `'str'`, etc.). If a user passes an unknown type string, TypeScript errors at the `signalArgs` argument, not silently at the handler. This is a real improvement over the current `type: string`.

---

## 4. Breaking Change Assessment

**Zero breaking changes.** The approach adds a new generic overload *above* the existing fallback. Call sites that already pass `signalArgs` keep working — TypeScript picks the more specific overload. Call sites that omit `signalArgs` fall through to the fallback overload. The only visible change to existing users is that `evt` becomes more precisely typed when they already pass `signalArgs`.

The one minor user-visible change: the `type` fields in `signalArgs` now get autocomplete (`'int' | 'entity' | 'str' | ...` instead of bare `string`). This is strictly additive.

**One caveat:** The `monitorSignal` type in `events-payload.ts` also has `& Record<string, any>`. This should be changed to `& Record<string, value>` (a separate, independent fix). The `& Record<string, any>` there widens the base type for all `monitorSignal` usages in the regular `.on()` handler too, not just `onSignal`. Fixing that is strictly additive (narrows an `any`).

---

## 5. Before / After

### Before (current)

```ts
g.server().onSignal(
  'DamageSignal',
  (evt, f) => {
    const target = evt.targetEntity   // type: any  ← no autocomplete, no error checking
    const amount = evt.damageAmount   // type: any  ← same
    const source = evt.eventSourceEntity  // type: any  ← even the fixed fields are any
    const typo = evt.damageAmountt   // type: any  ← typo silently accepted
  },
  [
    { name: 'targetEntity', type: 'entity' },
    { name: 'damageAmount', type: 'int' },
    { name: 'badType', type: 'xyz' }  // type: string  ← no error for unknown type
  ]
)
```

### After (with generic overload)

```ts
g.server().onSignal(
  'DamageSignal',
  (evt, f) => {
    const target = evt.targetEntity   // type: entity  ✓ autocomplete works
    const amount = evt.damageAmount   // type: int  ✓ (bigint in practice)
    const source = evt.eventSourceEntity  // type: entity  ✓ fixed field preserved
    const typo = evt.damageAmountt   // Error: Property 'damageAmountt' does not exist  ✓
  },
  [
    { name: 'targetEntity', type: 'entity' },
    { name: 'damageAmount', type: 'int' },
    { name: 'badType', type: 'xyz' }  // Error: Type '"xyz"' is not assignable to...  ✓
  ] as const
)
```

**The only user friction:** `as const` on the `signalArgs` array. Without it, TypeScript widens the literals and the generic overload falls back to the fallback. This can be documented. It is idiomatic TypeScript for this pattern.

Alternatively, the `as const` requirement can be avoided by accepting `signalArgs` as a rest parameter (though that changes the call signature) or by using a helper function:
```ts
function signal<const Args extends readonly SignalArgDef[]>(args: Args): Args { return args }

// Usage — no as const needed:
.onSignal('DamageSignal', (evt, f) => { ... }, signal([
  { name: 'targetEntity', type: 'entity' },
  { name: 'damageAmount', type: 'int' }
]))
```

---

## 6. Summary

| Question | Answer |
|----------|--------|
| Why is `Record<string, any>` there? | Signal arg names are runtime strings; without an intersection, `evt.anyCustomArg` errors |
| Can generics fix it? | Yes — `const` generic + `SignalArgsToPayload<Args>` mapped type |
| Breaking change? | None — pure overload addition above the fallback |
| User friction? | `as const` on signalArgs array (or an optional `signal()` helper) |
| Type string validation? | Free — constraining to `keyof RuntimeValueTypeMap` catches bad type strings at call site |
| Implementation size? | Small — ~20 lines of type machinery, two overload signatures |

This is one of the highest-ROI type improvements available in the codebase. The type infrastructure (`RuntimeValueTypeMap`) already exists; only the overload and the mapped type are new.
