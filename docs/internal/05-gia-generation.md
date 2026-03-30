# 05. GIA 생성 (Stage 3)

> 관련 문서: [04-ir-format.md](04-ir-format.md), [06-injector.md](06-injector.md)

## 개요

Stage 3는 IR JSON을 게임의 `.gia` 프로토버프 바이너리로 변환한다. 이 단계는 `src/compiler/ir_to_gia_transform/`에서 구현되며, thirdparty 패키지의 `Graph`/`Node`/`Pin` 빌더 클래스를 활용한다.

---

## 파일별 역할

### `index.ts` — 변환 핵심 로직

**핵심 함수:** `irToGia(ir: IRDocument, opts: IrToGiaOptions): Uint8Array`

IR → GIA 변환의 전체 흐름을 조율한다:

1. IR 노드 목록을 `IRNode[]` 형태로 정규화
2. `expandListLiterals()` 호출 (preprocess)
3. `optimizeTimerDispatchAggregate()` 조건부 실행
4. `buildConnTypeIndex()` — 연결 타입 인덱스 빌드
5. `layoutPositions()` — 에디터 내 노드 위치 계산
6. `Graph` 객체 생성 및 각 노드/핀 추가
7. `wrap_gia()` → 프로토버프 직렬화 → `Uint8Array` 반환

### `shared.ts` — 파일 I/O 래퍼

**`writeGiaFromIrJsonFile(irPath, outFile?, opts?)`:** IR JSON 파일을 읽어 `.gia` 파일로 저장하는 편의 함수. `irToGia()`를 래핑한다.

**배열 IR 처리:** IR JSON이 배열인 경우, 인덱스를 접미사로 붙여 각각 저장한다:
- `main.json` (배열) → `main_0.gia`, `main_1.gia`, ...
- `includeIndices` 옵션으로 특정 인덱스만 처리 가능
- `preserveIndices: true`이면 원본 인덱스 번호 유지

### `types.ts` — 내부 타입

```typescript
type IRNode = {
  id: NodeId
  type: string
  args?: Argument[]
  next?: NextConnection | NextConnection[]
  position?: [number, number]
  signalParams?: ...
}
type NodeId = number
type Position = { x: number; y: number }
```

---

## 노드 ID 해석 (`node_id.ts`)

**`resolveGiaNodeId(nodeType: string): NodeIdFor<...>`**

노드 타입 문자열을 게임 내부 숫자 ID로 변환한다.

```typescript
// thirdparty/.../node_data/node_id.js 의 NODE_ID 룩업 테이블 사용
NODE_ID.whenEntityIsCreated  // → 게임 내부 이벤트 노드 ID
NODE_ID.printString           // → 게임 내부 함수 노드 ID
```

**camelCase → snake_case 변환:** `camelToSnake()` 헬퍼로 타입 문자열을 변환해 룩업한다.

**`buildConnTypeIndex(irNodes)`:** 모든 `ConnectionArgument`를 스캔해 `(nodeId, outputIndex) → ValueType` 매핑을 구축한다. Pin 타입 결정에 사용된다.

**`isConnectionArgument(arg)`:** `arg.type === 'conn'`인지 확인하는 타입 가드.

---

## Pin 타입 매핑 (`pins.ts`)

**`ensureInputPinWithType(node, pinIndex, type, ...)`**

IR의 `Argument` 타입 정보를 GIA `Pin` 객체로 변환한다.

### 스칼라 타입 → NodeType 매핑

```typescript
function baseNodeType(type: ScalarType): NodeType {
  switch (type) {
    case 'bool':      return { t: 'b', b: 'Bol' }
    case 'int':       return { t: 'b', b: 'Int' }
    case 'float':     return { t: 'b', b: 'Flt' }
    case 'str':       return { t: 'b', b: 'Str' }
    case 'vec3':      return { t: 'b', b: 'Vec' }
    case 'guid':      return { t: 'b', b: 'Gid' }
    case 'entity':    return { t: 'b', b: 'Ety' }
    case 'prefab_id': return { t: 'b', b: 'Pfb' }
    case 'config_id': return { t: 'b', b: 'Cfg' }
    case 'faction':   return { t: 'b', b: 'Fct' }
  }
}
```

### 컨테이너 타입

- `xxx_list` → `{ t: 'l', i: baseNodeType(xxx) }` (리스트)
- `dict` → `{ t: 'd', k: keyType, v: valueType }` (딕셔너리)
- `enum` / `enumeration` → `{ t: 'e', e: ENUM_ID[enumName] }` (열거형)
- `local_variable` → Local Variable Pin 타입
- `generic` → 제네릭 Pin 타입

**`setLiteralArgValue(pin, arg)`:** 리터럴 값을 Pin에 직접 설정한다.

**`setEnumArgValue(pin, arg)`:** enum 값을 `ENUM_VALUE[enumClass][valueName]`으로 변환해 설정한다.

---

## 레이아웃 계산 (`layout.ts`)

`.gia`에는 에디터 내 노드 위치 정보가 포함된다. genshin-ts는 자동으로 위치를 계산한다.

**`buildExecutionGraph(irNodes)`**

IR 노드들의 실행 의존성 그래프를 분석한다:
- 실행 연결 (next): 실행 흐름 순서 파악
- 데이터 연결 (args의 conn): 데이터 의존성 파악

내부 자료 구조:
- `execEdges`: 실행 연결 쌍 `[fromId, toId]`
- `execChildrenMap`: 노드 ID → 실행 자식 노드 목록
- `dataConsumersMap`: 데이터 노드 ID → 소비자 노드 목록
- `incoming`: 노드 ID → 인입 실행 연결 수 (루트 노드 판별용)

**`layoutPositions(irNodes)`**

그래프 분석 결과를 바탕으로 각 노드에 `(x, y)` 위치를 할당한다.

레이아웃 설정값 (`LayoutConfig`):
```typescript
{
  columnWidth: 300,   // 열 간격
  rowHeight: 150,     // 행 간격
  maxColumns: 10,     // 열이 이 수를 초과하면 다음 줄로 감기
  wrapHeight: 2000,   // 감기 시 y 오프셋
  eventGap: 500       // 이벤트 노드 그룹 간 y 간격
}
```

알고리즘: BFS 기반 토폴로지 정렬 → 이벤트 노드는 맨 왼쪽, 실행 흐름은 오른쪽으로, 데이터 노드는 소비자 노드 위에 배치.

---

## 전처리 (`preprocess.ts`)

**`expandListLiterals(ir)`**

IR의 리스트 리터럴 인자를 GIA가 처리할 수 있는 형태로 변환한다.

---

## 최적화 1: 타이머 분산 집계 (`optimize_timer_dispatch.ts`)

**`optimizeTimerDispatchAggregate(ir, nodesById)`**

`GSTS_OPT_TIMER_DISPATCH=1` 환경 변수가 설정된 경우(기본값 활성화) 실행된다.

### 문제 상황

여러 `setTimeout` / `setInterval` 타이머가 있을 경우, 각 타이머는 자신의 `whenTimerIsTriggered` → 타이머 이름 비교 → 실제 처리 체인을 갖는다. 이는 다음과 같은 패턴을 만든다:

```
when_timer_is_triggered → equal(timerName, "pool_0") → branch
                                                          ↳ true: 처리A
                                                          ↳ false: equal(timerName, "pool_1") → branch
                                                                                                  ↳ true: 처리B
                                                                                                  ...
```

### 최적화 후

모든 타이머 분산 로직을 하나의 switch 노드로 집약한다:

```
when_timer_is_triggered → switch(timerName)
                            case "pool_0": 처리A
                            case "pool_1": 처리B
                            ...
```

**제약:** 게임의 switch 노드는 최대 10개 case를 지원하므로, `MAX_TIMER_DISPATCH_CASES = 10` 초과 시 집약하지 않는다.

---

## 최적화 2: 데드 노드 제거

`GSTS_REMOVE_UNUSED_NODES=1` (기본값 활성화)이면 Stage 2 서브프로세스 내에서:
- 어떤 이벤트에도 연결되지 않은 실행 노드 제거
- 어떤 유효 실행 노드도 소비하지 않는 데이터 노드 제거

---

## Thirdparty 패키지 활용

**`src/thirdparty/Genshin-Impact-Miliastra-Wonderland-Code-Node-Editor-Pack/`**

MIT 라이선스의 외부 모듈. genshin-ts가 직접 통합한 것.

| 파일/디렉터리 | 역할 |
|--------------|------|
| `gia_gen/graph.js` | `Graph`, `Node`, `Pin` 빌더 클래스 |
| `node_data/node_id.js` | `NODE_ID` — 노드 타입 → 게임 내부 ID 룩업 |
| `node_data/enum_id.js` | `ENUM_ID`, `ENUM_VALUE` — 열거형 ID 룩업 |
| `protobuf/decode.js` | `wrap_gia()` — GIA 프로토버프 직렬화 |
| `protobuf/gia.proto.js` | `Root` 타입 — GIA 프로토버프 스키마 |

`src/compiler/gia_vendor.ts`는 이들을 re-export하는 얇은 래퍼다.

---

## GIA 파일 구조

`.gia`는 프로토버프로 인코딩된 NodeGraph 바이너리다. 20바이트 헤더와 4바이트 푸터로 감싸진다:

```
[20 bytes header] [protobuf NodeGraph bytes] [4 bytes footer]
```

`node_graph.ts`의 `unwrapGia()` 함수가 헤더/푸터를 제거한다:
```typescript
return bytes.slice(20, -4)
```
