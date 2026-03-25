# Fix: isEntityLikeType `any` → `entity` 오추론

- **날짜**: 2026-03-25
- **파일**: `src/shared/ts_type_utils.ts:28`
- **변경**: 1줄 추가 — `if (type.flags & ts.TypeFlags.Any) return false`

---

## 증상

`onSignal` 핸들러에서 시그널 인자를 중간 변수에 할당하면 컴파일 에러:

```typescript
// FAIL — "Generic parameter not matched"
const score = evt.score
f.set('count', score)

// PASS — 직접 사용은 문제 없음
f.set('count', evt.score)
```

## 원인

`evt`는 `...& Record<string, any>` 타입 → `evt.score`는 `any`.
`isEntityLikeType()`에서 `checker.isTypeAssignableTo(any, entity)` → `true` (any는 모든 타입에 assignable).
결과: `initLocalVariable("entity")` 생성 → 타입 불일치.

## 수정

```diff
 ): boolean {
+  if (type.flags & ts.TypeFlags.Any) return false
+
   const aliasName = type.aliasSymbol?.getName() ?? type.symbol?.getName()
```

## 영향받는 호출지점

- `stmt.ts:75` — `inferBasicType()`
- `stmt.ts:100` — `makeLocalVarTypeString()`
- `expr.ts:90` — `inferLocalVarTypeFromType()`
- `expr.ts:479` — spread array 추론
- `expr.ts:718` — 일반 타입 추론
- `expr.ts:682` — 자체 `any` 가드 이미 있어 무해

## 롤백

이 수정이 다른 문제를 유발할 경우 아래 줄을 삭제:

`src/shared/ts_type_utils.ts:28` → `if (type.flags & ts.TypeFlags.Any) return false`

롤백 후 시그널 인자는 `evt.argName` 직접 인라인 사용으로 우회.
