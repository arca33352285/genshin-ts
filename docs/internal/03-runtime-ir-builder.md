# 03. 런타임 및 IR 빌더 (src/runtime/)

> 관련 문서: [02-ast-transform.md](02-ast-transform.md), [04-ir-format.md](04-ir-format.md)

## 개요

`src/runtime/`은 Stage 2의 핵심이다. `.gs.ts` 파일이 실행될 때 임포트되어 사용되는 모듈들로, 사용자가 작성한 `g.server().on(...)` 호출을 실행 플로우로 기록하고 최종적으로 IR JSON으로 직렬화한다.

**핵심 개념:** Stage 2는 `.gs.ts` 파일을 **실제로 실행**한다. 런타임 모듈들은 실행 중에 호출되어 "무엇을 해야 하는가"를 기록(record)한다. 실행이 끝나면 그 기록이 IR JSON으로 출력된다.

---

## `core.ts` — g.server() API

**진입점:** `src/runtime/core.ts`

사용자 코드의 `g.server(opts)` 호출이 반환하는 `ServerGraphApi` 객체를 생성한다.

### g.server() 옵션 (`ServerGraphOptions`)

| 옵션 | 타입 | 설명 |
|------|------|------|
| `id` | `number` | 대상 NodeGraph ID (기본 `1073741825`) |
| `name` | `string` | 그래프 표시 이름 (기본: 파일명) |
| `prefix` | `boolean` | `_GSTS_` 접두사 자동 추가 여부 (기본 `true`) |
| `mode` | `'beyond' \| 'classic'` | 노드 그래프 모드 (기본 `'beyond'`) |
| `type` | `ServerGraphSubType` | 서브타입: `entity`, `status`, `class`, `item` (기본 `entity`) |
| `variables` | `VariablesDefinition` | 그래프 변수 선언 |
| `lang` | `'en' \| 'zh'` | 한국어/영어 별칭 설정 |

### .on() 체인

`g.server(opts).on('eventName', (evt, f) => { ... })` 호출은 내부적으로:

1. 이벤트 이름을 영어로 정규화 (`zh_aliases.ts` 참조)
2. 이벤트 메타데이터를 `ServerEventMetadata`에서 조회 (`events.ts`)
3. `installScopedServerGlobals()`로 핸들러 실행에 필요한 전역 컨텍스트 설정
4. 핸들러 함수를 실행 — 이 실행이 실제 노드와 연결을 누적시킴
5. `ExecutionFlow` 객체에 결과 수집

`.on()` 은 체인 가능하며 동일 `ServerGraphApi` 인스턴스를 반환한다.

### .onSignal()

시그널 이벤트용 특수 메서드. `monitorSignal` 이벤트 타입을 사용하며 커스텀 시그널 인자(`signalArgs`) 배열을 선택적으로 받는다.

---

## `value.ts` — 값 타입 시스템

모든 노드 인자는 `value` 클래스의 인스턴스다.

### 값 타입 계층

```
value (base class)
├── bool
├── int
├── float
├── str
├── vec3
├── guid
├── entity
├── prefabId
├── configId
├── faction
├── struct
├── generic
├── list
├── dict / dictLiteral / ReadonlyDict
├── localVariable
├── customVariableSnapshot
└── enumeration
```

### 값 인스턴스의 이중 역할

각 `value` 인스턴스는 두 가지 방식으로 사용된다:

1. **리터럴 값:** `int(5)`, `str("hello")` — IR의 `Argument`로 직렬화
2. **연결 참조:** 노드 함수의 반환값 — IR의 `ConnectionArgument`로 직렬화

연결 참조는 `MetaCallRecord`와 연결되어, 어떤 노드의 몇 번째 출력 핀에서 값이 왔는지를 추적한다.

### 주요 타입 별칭

```typescript
type RuntimeParameterValueTypeMap  // 노드 입력 핀 타입 매핑
type RuntimeReturnValueTypeMap     // 노드 출력 핀 타입 매핑
type ValueClassMap                 // 타입 문자열 → 클래스 매핑
```

---

## `execution_flow_types.ts` — 실행 플로우 타입

### `ExecutionFlow`

핸들러 하나의 실행 플로우를 표현하는 핵심 자료 구조:

```typescript
interface ExecutionFlow {
  eventNode: MetaCallRecord     // 이벤트 노드 (e.g. whenEntityIsCreated)
  eventArgs: value[]            // 이벤트 노드 인자
  execNodes: MetaCallRecord[]   // 실행 노드 목록 (순서 있음)
  dataNodes: MetaCallRecord[]   // 데이터 노드 목록
  edges: Record<number, NextConnection[]>  // 실행 연결 (nodeId → 다음 노드들)
  execContextStack: ExecContext[]          // 분기 컨텍스트 스택
  returnGateLocalVariable?: value
  returnGateValue?: value
}
```

### `ExecContext`

분기(if/loop)가 있을 때 현재 실행 체인의 "꼬리(tail)"를 추적한다:

```typescript
type ExecContext = {
  tailEndpoints: ExecTailEndpoint[]  // 현재 실행 체인의 끝 노드들
  pendingSourceIndex?: number         // 다음 연결에 사용할 소스 출력 핀 인덱스
  headNodeId?: number                 // 이 컨텍스트의 첫 번째 노드
  terminatedByReturn?: boolean        // return이 호출됐는지 여부
}
```

**핵심 메커니즘:** 새 실행 노드가 추가될 때, 현재 컨텍스트 스택의 최상단 컨텍스트에 있는 `tailEndpoints`에서 새 노드로 연결이 생성된다. 그 후 `tailEndpoints`가 새 노드로 업데이트된다.

---

## `ir_builder.ts` — IR 문서 생성

**진입점:** `buildIRDocument(input: IRBuildInput): IRDocument`

여러 `ExecutionFlow`를 하나의 `IRDocument`로 조립한다.

### 빌드 과정

1. 각 `ExecutionFlow`의 이벤트 노드, 실행 노드, 데이터 노드를 수집
2. 노드 ID 충돌이 없도록 검증
3. `MetaCallRecord`의 인자들을 `Argument` 타입으로 변환:
   - 리터럴 값 → `{ type: 'int', value: 5 }` 형태
   - 연결 참조 → `{ type: 'conn', value: { node_id: N, index: I, type: '...' } }` 형태
4. 실행 연결(`edges`)을 `NextConnection` 형태로 변환
5. 변수 선언을 `Variable[]`로 수집
6. `IRDocument` 조립

### `buildConnValueType()` — 값 타입 → IR 연결 타입 변환

```typescript
// value 클래스 인스턴스를 보고 연결 타입 정보를 반환
if (arg instanceof bool) return { type: 'bool' }
if (arg instanceof int) return { type: 'int' }
if (arg instanceof enumeration) return { type: 'enum', enum: camelToSnake(arg.getClassName()) }
// ...
```

---

## `meta_call_types.ts` — 메타 콜 레코드

노드 함수 호출을 기록하는 자료 구조.

```typescript
type MetaCallRecord = {
  nodeId: number          // IR 노드 ID
  callType: string        // 노드 타입 문자열 (e.g. 'whenEntityIsCreated', 'printString')
  args: (value | null)[]  // 인자 목록
  returnValues: value[]   // 반환값 (연결 참조로 사용)
}
```

**노드 함수 실행 시:** `nodes.ts`의 각 함수는 `MetaCallRecord`를 생성하고 현재 `ExecutionFlow`에 등록한다. 반환값은 `value` 인스턴스로, 다른 노드의 인자로 사용될 수 있다.

---

## `variables.ts` — 그래프 변수 시스템

`g.server({ variables: { myVar: int(0) } })` 선언을 처리한다.

### VariablesDefinition

사용자가 선언하는 변수 맵:

```typescript
type VariablesDefinition = Record<string, unknown>
// 예시:
{
  counter: int(0),
  name: str(""),
  items: { type: 'int_list', length: 10 }
}
```

### NodeGraphVarApi

`variables` 선언이 있으면 `f` 객체에 타입 안전한 `get`/`set` 메서드가 추가된다:

```typescript
f.get('counter')  // → IntValue 반환 (타입 추론됨)
f.set('counter', int(5))
```

내부적으로 `get_node_graph_variable` / `set_node_graph_variable` 노드를 생성한다.

---

## `server_globals.ts` — 전역 게임 API

Stage 2 실행 시 전역 스코프에 게임 API를 설치한다.

**`installServerGlobals()`:** 전역 네임스페이스에 주입되는 것들:
- `player(n)` — 플레이어 entity 참조
- `stage`, `level`, `self` — 특수 entity
- `Math`, `Mathf`, `Vector3`, `Random` — 수학 API
- `GameObject` — Unity 스타일 API
- `int`, `float`, `str`, `bool`, `vec3`, `entity`, `guid`, ... — 값 생성자
- `list(type, [...])`, `dict(...)` — 컬렉션 생성자

**`installScopedServerGlobals()`:** 각 `.on()` 핸들러 실행 전에 이벤트별 컨텍스트를 설정한다 (`evt` 출력 핀 접근 설정 등).

---

## `runtime_config.ts` — 런타임 옵션

Stage 2 서브프로세스가 환경 변수에서 최적화 설정을 읽는다:

```typescript
// 환경 변수 → 런타임 옵션
GSTS_PRECOMPILE_EXPR   → precompileExpression
GSTS_REMOVE_UNUSED_NODES → removeUnusedNodes
```

`getRuntimeOptions()` 함수로 접근한다.

---

## `ir_optimize_return_vars.ts` — 사용 안 함 (참고용)

이전에 사용했던 `_gsts_return_*` 변수 최적화 코드. 현재는 Local Variable 기반 return 구현으로 교체되어 사용되지 않는다. 향후 유사한 최적화 코드 작성 시 참고할 수 있다.
