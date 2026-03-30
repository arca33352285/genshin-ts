# Task: IntelliSense Review — Runtime & Definitions (worker-a)

## Scope

Analyze these directories for IntelliSense/type-hint quality issues:

- `src/runtime/` — all files
- `src/definitions/` — all files
- `types/gsts/index.d.ts` — the exported declaration file

## What to Look For

### 1. `any` usage
Find all explicit `any` annotations and implicit `any` inferences. For each:
- Note the file:line
- Explain what the value actually represents
- Suggest a concrete replacement type

### 2. Overly broad unions / widened types
- `string` where a string literal union would be appropriate
- `number` where a numeric literal union or branded type would help
- `object` or `{}` or `Record<string, any>` where a specific shape is known
- Return types inferred as `unknown` or too wide

### 3. Missing generics
- Functions that accept or return typed containers but lack generic parameters
- Places where the caller loses type information due to missing generic propagation
- e.g. `g.server().on(eventName, handler)` — does `handler`'s parameter type narrow based on `eventName`?

### 4. JSDoc gaps
- Exported symbols with no JSDoc or only a Chinese-language comment (unhelpful to English users)
- Parameters with no `@param` description
- Return values with no `@returns`

### 5. IntelliSense-defeating patterns
- Overload signatures that are too general vs too specific
- `server_on_overloads.d.ts` — does the overload set correctly narrow event handler payload types?
- `events-payload.ts` / `events-payload-mode.ts` — are payload types tight?
- `entity_helpers.ts` — are entity subtype narrowing helpers typed well?
- `value.ts` — do value type classes carry their type information through TypeScript (branded types, discriminated unions)?

## Deliverable

Write findings to: `.claude/tree/genshin-ts-analysis/nodes/worker-a/workspace/findings.md`

Structure:
```
# worker-a Findings: Runtime & Definitions

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
