# 02. AST 변환 (ts_to_gs_transform)

> 관련 문서: [01-compilation-pipeline.md](01-compilation-pipeline.md), [03-runtime-ir-builder.md](03-runtime-ir-builder.md)

## 개요

`src/compiler/ts_to_gs_transform/`은 Stage 1의 핵심이다. TypeScript Compiler API(`ts.visitNode`, `ts.visitEachChild`)를 사용해 사용자의 `.ts` 소스를 `.gs.ts`로 변환한다. `.gs.ts`는 genshin-ts 런타임 API를 직접 호출하는 유효한 TypeScript 파일이다.

**변환 대상 범위:** `g.server().on(...)` 콜백 내부와 `gstsServer*` 함수 내부만 변환된다. 최상위 스코프(top-level)의 코드는 변환되지 않고 그대로 유지된다.

---

## 파일별 역할

### `index.ts` — 진입점 및 최상위 방문자

**핵심 함수:**
- `transformToGs(sf, ctx)`: 단일 소스파일 변환 진입점
- `hasServerEntryCall(sf, checker)`: 파일에 `g.server().on()` 호출이 있는지 확인
- `transformHandler()` 위임: `g.server().on(cb)` 콜백 본문을 `stmt.ts`에 위임

최상위에서 다음 두 가지를 찾는다:
1. `g.server(...).on('eventName', (evt, f) => { ... })` — 이벤트 핸들러
2. `gstsServer*` 이름의 함수 선언/화살표 함수 — 재사용 서브그래프 함수

### `types.ts` — 변환 컨텍스트 타입

**`Env` 타입:** 변환 과정 전체에 걸쳐 전달되는 컨텍스트 객체.

주요 필드:

| 필드 | 역할 |
|------|------|
| `checker` | TypeScript 타입 체커 (타입 추론에 사용) |
| `serverCtx` | 현재 노드 그래프 스코프 내부인지 여부 |
| `returnMode` | `'handler'` (이벤트 핸들러) 또는 `'value'` (gstsServer 함수) |
| `evtIdent` | 이벤트 핸들러의 첫 번째 매개변수명 (보통 `evt`) |
| `fIdent` | 핸들러의 두 번째 매개변수명 (보통 `f`) |
| `loopMax` | 무한루프 최대 반복 수 |
| `varPlan` | 각 변수의 처리 방식 (`needsLocalVar`, `isCollection`) |
| `timerCounterRef` | 파일 간 공유되는 타이머 인덱스 카운터 |
| `features` | `GstsFeatureFlags` — 기능 플래그 |

**`VarPlanEntry` 타입:**
- `needsLocalVar: boolean` — 변수가 Local Variable 노드로 변환될지 여부
- `isCollection: boolean` — list/dict 타입인지 여부

**`buildFeatureFlags(cfg)` 함수:** 기본값은 다음과 같다:

```typescript
{
  whileCondition: true,   // while(condition) 루프 허용
  doWhile: true,          // do-while 루프 허용
  continue: false,        // continue 문 비활성화 (기본)
  switch: false,          // switch 문 비활성화 (기본)
  destructuring: false,   // 구조 분해 비활성화 (기본)
  ternary: false,         // 삼항 연산자 비활성화 (기본)
  nullishCoalesce: false  // ?? 연산자 비활성화 (기본)
}
```

### `stmt.ts` — 구문(Statement) 변환

함수 본문의 구문 목록을 순회하며 각 구문을 변환한다.

**핵심 함수:**
- `transformHandler(body, env, context)`: 이벤트 핸들러 함수 본문 변환
- `transformGstsServerFunction(body, env, context)`: `gstsServer*` 함수 본문 변환

**변환 규칙:**

| TypeScript 구문 | 변환 결과 |
|----------------|-----------|
| `const x = expr` | 단순 대입 또는 `localVariable` 노드 |
| `let x = expr` | `localVariable` 초기화 + `setLocalVariable` 노드 |
| `x = expr` | `setLocalVariable` 호출 |
| `if (cond) {...} else {...}` | `f.branch(cond, trueHandler, falseHandler)` |
| `return expr` | `f.setLocalVariable('_gsts_return_...', expr)` + 리턴 게이트 처리 |
| `for (const x of list) {...}` | `f.forList(list, (x) => {...})` |
| `for (let i=0; i<n; i++) {...}` | `f.finiteLoop(start, end, (i) => {...})` |

**VarPlan 결정 로직:**

변환 전, `stmt.ts`는 함수 본문의 모든 변수 선언을 스캔해 `varPlan`을 구성한다:
- 재할당이 있는 변수 → `needsLocalVar: true` → Local Variable 노드로 변환
- list/dict 타입 → `isCollection: true`

### `expr.ts` — 표현식(Expression) 변환

**핵심 함수:** `transformExpression(env, context, expr)` — 재귀적으로 표현식 변환

**주요 변환:**

| TypeScript 표현식 | 변환 결과 |
|------------------|-----------|
| `evt.someField` | `f.__gstsEvt(index)` 형태의 런타임 이벤트 출력 접근 |
| `x + y` | `f.add(x, y)` 또는 `f.stringConcat(x, y)` |
| `x === y` | `f.equal(x, y)` |
| `x > y` | `f.greaterThan(x, y)` |
| `!x` | `f.not(x)` |
| `x && y` | `f.and(x, y)` |
| `number literal` | `float(n)` 또는 `int(n)` (bigint 리터럴은 int) |
| `string literal` | `str("...")` |
| `true / false` | `bool(true/false)` |
| `f.someMethod(args)` | 그대로 통과 (런타임 노드 API 직접 호출) |
| `localVar` | `f.getLocalVariable('varName')` |

**타입 추론:** `checker.getTypeAtLocation()`으로 변수 타입을 추론해 적절한 value 타입을 선택한다.

### `loops.ts` — 루프 변환

**변환 대상:**
- `for (let i = 0; i < n; i++)` → `finiteLoop(start, n-1, (i, breakLoop) => body)`
- `for (const x of list)` → `forList(list, (x, breakLoop) => body)`
- `while (cond)` → `whileCondition(cond, body)` (feature flag 필요)
- `do { } while (cond)` → `doWhile` 구조 (feature flag 필요)
- `for(;;)` / `while(true)` → `finiteLoop(0, loopMax, ...)` (무한루프 안전장치)

**`breakLoop`** 매개변수: 루프 본문 변환 시 자동으로 `breakLoop` 인자를 추가한다. `break` 구문은 `breakLoop()` 호출로 변환된다.

### `builtins.ts` — 빌트인 API 변환

JavaScript/TypeScript 내장 API를 게임 노드 그래프 API로 변환한다.

**주요 변환 패턴:**

| 원본 | 변환 |
|------|------|
| `Math.abs(x)` | `f.abs(x)` |
| `Math.floor(x)` | `f.round(x, RoundingMode.RoundDown)` |
| `Math.ceil(x)` | `f.round(x, RoundingMode.RoundUp)` |
| `Math.round(x)` | `f.round(x, RoundingMode.RoundToNearest)` |
| `Math.max(a, b)` | `f.max(a, b)` |
| `Math.min(a, b)` | `f.min(a, b)` |
| `Math.sqrt(x)` | `f.sqrt(x)` |
| `Math.PI` | `float(3.141592653589793)` (리터럴 인라인) |
| `console.log(x)` | `f.printString(f.toString(x))` |
| `Vector3.new(x,y,z)` | `f.vec3(x, y, z)` |

### `list_methods.ts` — 리스트 메서드 변환

배열 메서드를 게임 리스트 노드 API로 변환한다.

| 원본 | 변환 |
|------|------|
| `arr.push(x)` | `f.appendToList(arr, x)` |
| `arr.length` | `f.getListLength(arr)` |
| `arr[i]` | `f.getListElement(arr, i)` |
| `arr.includes(x)` | `f.listContainsElement(arr, x)` |

### `matcher.ts` — 특정 패턴 식별

`g.server(...).on(...)` 호출 패턴을 TypeScript AST에서 식별하는 헬퍼들.

- `isServerOnCall(node, checker)`: `g.server(...).on(...)` 체인인지 확인
- TypeScript 타입 시스템을 활용해 `g`의 타입이 올바른지 검증

### `ops.ts` — 연산자 분류

이항 연산자를 분류하고 매핑한다.

- `isAssignmentLikeOperator()`: `=`, `+=`, `-=` 등 대입 연산자 판별
- `getBinaryOpInfo()`: 연산자를 런타임 함수명으로 매핑 (e.g. `+` → `add`, `-` → `subtract`)

---

## 변환 불가 문법 및 에러 처리

변환 중 지원하지 않는 문법을 만나면 `fail()` 함수가 호출된다:

```typescript
// errors.ts
export function fail(node: ts.Node, msg: string): never {
  // TypeScript Diagnostic 형식으로 파일 경로와 라인 번호를 포함한 에러 출력
}
```

**주요 제약 사항:**
- `async/await`, `Promise` — 미지원
- 재귀 함수 — 미지원
- `Object.*` / `JSON.*` — 노드 그래프 스코프에서 미지원 (최상위 스코프에서는 사용 가능)
- 조건식은 반드시 `boolean` 타입이어야 함
- `gstsServer*` 함수는 단일 trailing `return`만 허용

---

## 타이머 변환

`setTimeout(callback, ms)` / `setInterval(callback, ms)` → 타이머 풀 시스템으로 변환

**변환 과정:**
1. Stage 1 시작 전, 각 파일의 타이머 수를 카운트해 파일별 인덱스 오프셋 할당
2. 각 타이머는 `timerPool_<index>` 이름을 갖는 그래프 변수로 표현됨
3. 콜백 내 클로저 캡처 변수는 dict 타입의 그래프 변수를 통해 전달됨
4. `timerCaptureMap`이 `Env`에 포함되어 콜백 내 변수 접근을 dict 읽기/쓰기로 변환

**캡처 변수 한계:** dict 타입 변수는 캡처 불가 (`TimerCaptureDictMeta` 참고)
