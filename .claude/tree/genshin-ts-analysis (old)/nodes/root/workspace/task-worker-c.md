# Task: IntelliSense Review — Injector & Public API (worker-c)

## Scope

Analyze these files for IntelliSense/type-hint quality issues:

- `src/injector/index.ts` — public injector API
- `src/injector/binary.ts`
- `src/injector/node_graph.ts`
- `src/injector/proto.ts`
- `src/injector/signal_nodes.ts`
- `src/injector/folder.ts`
- `src/index.ts` — the library's public export barrel

## What to Look For

### 1. `any` usage
Find all explicit `any` annotations and implicit `any` inferences. For each:
- Note the file:line
- Explain what the value actually represents
- Suggest a concrete replacement type

### 2. Injector API types
- `InjectGilInput` — is `Uint8Array` the right type for `gilBytes`/`giaBytes`? Should it be `Buffer | Uint8Array`?
- `InjectGilResult` — `mode: 'replace'` is a literal type, good. Are there other union branches missing?
- `Injector` interface — is the interface fully typed or are methods typed loosely?
- `createInjector` options — is `protoPath?` documented? What happens if omitted?
- `targetId?` — what is the valid range or domain of this number? Could it be branded?

### 3. Public barrel (`src/index.ts`)
- Are there types that *should* be exported but aren't (forcing consumers to import from internal paths)?
- Are there types exported that expose implementation details unnecessarily?
- Is the `export *` from prefabs appropriate, or does it pollute the namespace?

### 4. Binary internals leaking
- Do any internal binary parsing types (`binary.ts`, `folder.ts`) leak into the public API?
- Are `Uint8Array` return types sufficiently documented (what do the bytes represent)?

### 5. JSDoc gaps
- All exported functions: missing `@param` / `@returns`
- All exported types: missing field-level comments
- Especially: safety check behavior (`skipNonEmptyCheck`), backup behavior

### 6. Proto/protobuf types
- Does `proto.ts` expose a typed schema or return `any`?
- Is the loaded protobuf root typed or `unknown`?

## Deliverable

Write findings to: `.claude/tree/genshin-ts-analysis/nodes/worker-c/workspace/findings.md`

Structure:
```
# worker-c Findings: Injector & Public API

## Critical Issues (high IntelliSense impact)
[list with file:line, problem, suggested fix]

## Moderate Issues
[list with file:line, problem, suggested fix]

## Minor / JSDoc gaps
[list with file:line, what's missing]

## Summary
[2-3 sentence summary of the biggest problems in this area]
```

When complete, send TASK_RESULT to root node.
