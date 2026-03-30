# worker-c Findings: Injector & Public API

## Critical Issues (high IntelliSense impact)

### 1. `NodeGraphObj = Record<string, unknown>` is too loose — loses all IntelliSense on decoded protobuf objects
**File:** `src/injector/node_graph.ts:6`
**Problem:** `NodeGraphObj` is a type alias for `Record<string, unknown>`. Every access to properties (`graph.nodes`, `graph.id`, etc.) requires inline type assertions scattered throughout `index.ts` and `node_graph.ts`. Callers get no field completion.
**Suggested fix:** Define a structural interface `NodeGraph` with the known fields (`id?: { id?: number; type?: number }`, `nodes?: NodeGraphObj[]`, `name?: string`). Use it instead of `Record<string, unknown>` for the return type of `loadGiaGraph` and `findNodeGraphTargets`.

### 2. `proto.ts` exposes `protobuf.Type` (untyped runtime schema) as the sole return type — zero static typing
**File:** `src/injector/proto.ts:13-17`
**Problem:** `GiaProto` type has `rootMessage: protobuf.Type` and `nodeGraphMessage: protobuf.Type`. The `protobuf.Type` interface has `.decode()` returning `protobuf.Message<{}>` (typed as `{}`) and `.encode()` accepting `object`. All callers must immediately cast to `as unknown as X`. There is no static schema at all; errors in field names are invisible to TypeScript.
**Suggested fix:** At minimum, document the expected shape and cast once inside `loadGiaGraph` / `findNodeGraphTargets` rather than repeating `as never` / `as unknown as ...` at every call site. Longer-term: generate typed wrappers with `protoc-gen-ts` or `ts-proto` so field access is statically checked.

### 3. `as never` cast for protobuf encode hides real type errors
**File:** `src/injector/index.ts:181`
**Problem:** `proto.nodeGraphMessage.encode(newGraph as never)` — casting to `never` is a strong suppressor that disables all type checking at the encode site. If `newGraph` is later refactored to a typed interface, this cast will silently break.
**Suggested fix:** Cast to `protobuf.Message<NodeGraphObj>` or the proper protobufjs `object` type rather than `never`.

### 4. `InjectGilResult.mode` is a single literal `'replace'` with no other union branches documented
**File:** `src/injector/types.ts:44-47`
**Problem:** The type signals "this is a discriminated union" (using a literal `mode` field) but only has one member. If future modes (`'append'`, `'create'`) are planned, this is fine, but there is no JSDoc or comment explaining what `'replace'` means semantically, and consumers cannot distinguish future branches.
**Suggested fix:** Add a JSDoc comment explaining the meaning of `'replace'` and whether other modes are planned. If no other modes are planned, consider dropping `mode` or using `readonly mode: 'replace'`.

---

## Moderate Issues

### 5. `targetId?: number` — no documented valid range or domain; could silently accept 0
**File:** `src/injector/types.ts:36`, `src/injector/index.ts:76`
**Problem:** `targetId` is an optional `number`. The runtime check (`>= 1000000000`) only applies to one branching condition, not as a validation entry point. A caller passing `targetId: 0` gets a cryptic `[error] target NodeGraph not found` rather than an early validation error.
**Suggested fix:** Add a JSDoc comment: `/** NodeGraph identifier. Must be a positive integer. IDs >= 1_000_000_000 are expected for runtime-created graphs. */`. Consider a branded type `type NodeGraphId = number & { readonly __brand: 'NodeGraphId' }` to prevent accidental passing of unrelated numeric IDs.

### 6. `gilBytes`/`giaBytes` typed as `Uint8Array` — `Buffer` is also valid but not declared
**File:** `src/injector/types.ts:33-35`
**Problem:** Node.js `Buffer` is a subclass of `Uint8Array`, so it works at runtime, but the declared type only says `Uint8Array`. The implementation uses `Buffer.from(buf)` and `.slice()` interchangeably with `Uint8Array`. Declaring `Uint8Array` is fine, but should be documented: callers who pass a `Buffer` may be confused.
**Suggested fix:** Add JSDoc: `/** Raw file bytes. Both Buffer and Uint8Array are accepted. */`. The existing type is technically correct (Buffer IS-A Uint8Array), but a brief note prevents confusion.

### 7. `injectGilBytes` top-level function re-creates the injector on every call — not obvious from the signature
**File:** `src/injector/index.ts:220-225`
**Problem:** `injectGilBytes` and `injectGilFile` create a new `Injector` (which calls `loadGiaProto`) on every invocation. `loadGiaProto` is cached, so it's not a bug, but callers don't know this. A caller doing batch processing will naturally call `createInjector()` once; callers who don't read the source will call `injectGilBytes` in a loop, not realising it still re-caches properly.
**Suggested fix:** Add JSDoc: `/** Convenience wrapper. For batch processing, prefer createInjector() to reuse the same instance. The proto is cached internally, so performance impact is minimal. */`

### 8. `skipNonEmptyCheck` has no JSDoc explaining the safety implications
**File:** `src/injector/types.ts:37`, `src/injector/index.ts:155-165`
**Problem:** `skipNonEmptyCheck?: boolean` controls whether the injector throws when a non-empty NodeGraph is about to be overwritten. This is a dangerous bypass flag, but has no documentation at all (no `@param`, no explanation of when it is safe to use).
**Suggested fix:** Add: `/** If true, skips the check that prevents overwriting a non-empty NodeGraph. Use only when you know the target is intentionally non-empty (e.g. _GSTS* named graphs). Defaults to false. */`

### 9. Internal types `LenField`, `FolderEntry`, `FolderIndex`, `FolderMetaList` are not re-exported from the barrel
**File:** `src/injector/types.ts`, `src/index.ts`
**Problem:** These internal binary parsing types are not exported from `src/index.ts`, which is correct in principle. However, `LenField` is referenced in `ParseCollectors` (exported from `binary.ts`) and `binary.ts` is not exported at all. If a consumer ever needs to work with the low-level parse result, they must import from the internal path `genshin-ts/src/injector/types.js`.
**Suggested fix:** Confirm these are intentionally internal (which they appear to be) and add a `// @internal` JSDoc tag to the types in `types.ts` to make the intent explicit.

### 10. `buildFile` return type not annotated — inferred as `Buffer`, but `Uint8Array` would be more portable
**File:** `src/injector/binary.ts:197-211`
**Problem:** `buildFile` implicitly returns `Buffer` (the function allocates with `Buffer.alloc`). The return type is inferred by TypeScript but not declared. `InjectGilResult.bytes` is typed as `Uint8Array`, and the comment in `injectFile` acknowledges "result.bytes may already be a Buffer". This implicit Buffer-as-Uint8Array widening is fine but undocumented.
**Suggested fix:** Annotate the return type explicitly: `): Buffer` (or `): Uint8Array` if you want to decouple from Node). Add a note in `InjectGilResult.bytes` JSDoc: `/** The resulting file bytes. In Node.js environments this is a Buffer (subclass of Uint8Array). */`

---

## Minor / JSDoc gaps

### 11. `createInjector` — `protoPath?` option has no JSDoc
**File:** `src/injector/index.ts:63`
**Missing:** No `@param` or `@returns`. No documentation of what `protoPath` defaults to, or what `lang` controls.
**Suggestion:** `/** @param options.protoPath - Path to gia.proto. Defaults to the bundled proto. @param options.lang - Override locale for diagnostic messages (e.g. 'zh-CN'). */`

### 12. `loadGiaProto` — `DEFAULT_GIA_PROTO` exported but undocumented
**File:** `src/injector/proto.ts:8-11`
**Missing:** No JSDoc explaining what the default proto file is or where it comes from. The path traversal to `thirdparty/...` is opaque.
**Suggestion:** Add: `/** Default path to the bundled gia.proto from the Miliastra Wonderland protobuf pack. */`

### 13. `GiaProto` type is not exported from `proto.ts` — cannot be used by external code
**File:** `src/injector/proto.ts:13`
**Missing:** `GiaProto` is defined as a local type. If consumers want to type a variable holding the proto result, they cannot do so without importing from the internal path. Since `proto.ts` is internal, this is acceptable, but the lack of export is unintentional if consumers are expected to call `loadGiaProto` directly.

### 14. `InjectGilInput.lang` and `InjectGilFileOptions.lang` — JSDoc exists but doesn't document all valid values
**File:** `src/injector/types.ts:38-41`, `src/injector/types.ts:57-59`
**Missing:** The comment says `'zh-CN' | 'en-US' | 'auto'` as examples but uses string type. Consider using a union type for supported locales.

### 15. `fmtGraphType` — magic numbers (20000, 20003, 20004, 20005) are not explained
**File:** `src/injector/index.ts:43-59`
**Missing:** The numeric constants correspond to specific Genshin Impact node graph types. No JSDoc on `fmtGraphType` explains this. The constants exist in `folder.ts:DEFAULT_GRAPH_TYPE_VALUES` but are not shared.
**Suggestion:** Extract the switch cases into a `Map<number, string>` or reference `DEFAULT_GRAPH_TYPE_VALUES` to avoid duplication and make the domain clear.

### 16. `patchSignalNodeIds` — `parsed?` parameter has a non-obvious contract
**File:** `src/injector/signal_nodes.ts:282-292`
**Missing:** The `parsed?` parameter is an optimization hint (pre-parsed payload + fields). If omitted, it re-parses from `gilBytes`. This is not documented; callers won't know that passing `parsed` avoids redundant parsing.

### 17. `export *` from prefabs potentially pollutes namespace
**File:** `src/index.ts:27`
**Problem:** `export * from './definitions/prefabs.js'` re-exports everything in `prefabs.ts` at the top-level library namespace. The prefabs file exports large `const` objects (e.g., `DynamicPrefabZh`, `DynamicPrefabEn`) containing hundreds of entries. These appear alongside the injector API in IDE autocompletion. This is intentional API surface, but consumers who only use the injector get a large noise floor.
**Suggestion:** Consider named re-exports or a `prefabs` namespace re-export to group these away from the primary API. At minimum, add a JSDoc to `prefabs.ts` explaining the namespace: `/** Prefab ID lookup tables for Genshin Impact node IDs. */`

### 18. `NodeGraphObj` not re-exported from public barrel
**File:** `src/injector/node_graph.ts:6`, `src/index.ts`
**Missing:** `NodeGraphObj` is the return type of `loadGiaGraph` and the element type of `findNodeGraphTargets`, but it is not exported from `src/index.ts`. Consumers who want to type a variable holding a decoded graph object must use `import type` from the internal path.

---

## Summary

The biggest IntelliSense problem in this area is that the protobuf layer (`proto.ts`, `node_graph.ts`) uses structurally untyped objects (`Record<string, unknown>`, `protobuf.Type`) throughout, causing widespread type assertions (`as unknown as X`, `as never`) at every call site in `index.ts`. Consumers of the public API get reasonable types for `InjectGilInput` / `InjectGilResult`, but the intermediate objects used during injection are completely opaque to the type system. Additionally, several safety-critical options (`skipNonEmptyCheck`, `targetId` domain) lack JSDoc, making the API hard to use correctly without reading the implementation source.
