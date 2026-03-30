# 04. IR JSON 포맷

> 관련 문서: [03-runtime-ir-builder.md](03-runtime-ir-builder.md), [05-gia-generation.md](05-gia-generation.md)

## 개요

IR(Intermediate Representation) JSON은 Stage 2와 Stage 3 사이의 중간 표현이다. 노드 그래프의 모든 정보를 자기 기술적(self-describing)인 JSON 형식으로 담고 있으며, 디버깅과 추가 처리를 위한 핵심 결과물이다.

**타입 정의 위치:** `src/runtime/IR.d.ts`

---

## 최상위 구조: `IRDocument`

```typescript
type IRDocument = ServerIRDocument | ClientIRDocument
```

현재 genshin-ts는 서버 측 노드 그래프만 완전히 지원한다. `ClientIRDocument`는 미래를 위해 타입 정의만 존재한다.

### `ServerIRDocument`

```typescript
type ServerIRDocument = {
  ir_version: 1              // 항상 1 (버전 관리용)
  ir_type: 'node_graph'      // 항상 'node_graph'
  graph: ServerGraphInfo     // 그래프 메타 정보
  variables?: Variable[]     // 그래프 변수 선언 목록
  nodes?: ServerNode[]       // 노드 목록
}
```

---

## `ServerGraphInfo` — 그래프 메타

```typescript
interface ServerGraphInfo {
  name?: string                    // 노드 그래프 이름 (에디터 표시용)
  id?: number                      // NodeGraph ID (주입 대상 식별)
  type: 'server'                   // 항상 'server'
  mode?: 'beyond' | 'classic'      // 그래프 모드 (기본: 'beyond')
  sub_type?: 'entity' | 'status' | 'class' | 'item'  // 서브타입 (기본: 'entity')
}
```

**`id` 기본값:** 명시하지 않으면 `resolveGraphId()`가 `1073741825`를 사용한다.

**`name` 처리:** `prefix: true` 옵션(기본값)이면 `_GSTS_` 접두사가 자동으로 붙는다. 주입 안전 검사에서 이 접두사를 확인한다.

---

## `Variable` — 그래프 변수

```typescript
type Variable =
  | {
      name: string
      type: Exclude<keyof LiteralValueTypeMap, 'dict'>  // 'bool' | 'int' | 'float' | ...
      value?: ...   // 초기값 (선택)
      length?: number  // 리스트 변수의 길이
    }
  | {
      name: string
      type: 'dict'
      dict: { k: DictKeyType; v: DictValueType }  // dict 키/값 타입
      value?: any
    }
```

**예시:**
```json
{ "name": "counter", "type": "int", "value": 0 }
{ "name": "items", "type": "str_list", "length": 5 }
{ "name": "lookup", "type": "dict", "dict": { "k": "str", "v": "int" } }
```

---

## `ServerNode` — 노드

```typescript
type ServerNode = {
  id: number                    // 노드 고유 ID (파일 내에서 유일)
  type: string                  // 노드 타입 문자열
  position?: [number, number]   // 노드 에디터 위치 (Stage 3에서 계산됨)
  args?: Argument[]             // 입력 인자 목록
  next?: NextConnection[]       // 실행 출력 연결
  signalParams?: Array<{ name: string; type: string }>  // onSignal 커스텀 인자
}
```

### 노드 타입 문자열

`type`은 게임 노드의 camelCase 이름이다. `NODE_ID` 룩업 테이블(`thirdparty/.../node_data/node_id.js`)에서 실제 게임 내부 ID로 변환된다.

**예시:**
- `"whenEntityIsCreated"` — 엔티티 생성 이벤트
- `"printString"` — 문자열 출력
- `"finiteLoop"` — 유한 루프
- `"branch"` — 조건 분기
- `"equal"` — 동등 비교
- `"get_node_graph_variable"` — 그래프 변수 읽기
- `"set_node_graph_variable"` — 그래프 변수 쓰기
- `"get_local_variable"` — Local Variable 읽기
- `"set_local_variable"` — Local Variable 쓰기

---

## `Argument` — 노드 입력 인자

노드의 각 입력 핀에 해당하는 인자.

```typescript
type Argument =
  | null                        // 연결 없음 (기본값 사용)
  | { type: 'bool'; value: boolean }
  | { type: 'int'; value: number }
  | { type: 'float'; value: number }
  | { type: 'str'; value: string }
  | { type: 'vec3'; value: [number, number, number] }
  | { type: 'guid'; value: number }
  | { type: 'prefab_id'; value: number }
  | { type: 'config_id'; value: number }
  | { type: 'faction'; value: number }
  | { type: 'enum'; value: string }
  | { type: 'enumeration'; value: string }
  | { type: 'dict'; value: any; dict?: { k: DictKeyType; v: DictValueType } }
  | ConnectionArgument          // 다른 노드의 출력 핀에서 연결
```

### `ConnectionArgument` — 노드 간 데이터 연결

```typescript
interface ConnectionArgument {
  type: 'conn'
  value: {
    node_id: number    // 소스 노드 ID
    index: number      // 소스 노드의 출력 핀 인덱스 (0-based)
    type: ValueType    // 연결되는 데이터 타입
    enum?: string      // enum/enumeration 타입일 때 enum 클래스명
    dict?: { k: DictKeyType; v: DictValueType }  // dict 타입일 때
    sub_index?: number // 서브 인덱스 (일부 특수 노드)
  }
}
```

**예시:**
```json
{
  "type": "conn",
  "value": { "node_id": 3, "index": 0, "type": "int" }
}
```
→ 노드 3의 첫 번째 출력 핀(index 0)에서 int 값을 가져온다.

---

## `NextConnection` — 실행 흐름 연결

노드의 실행 출력 핀에서 다음 노드로의 연결.

```typescript
type NextConnection = number | NextConnectionDetailed

interface NextConnectionDetailed {
  node_id: number          // 다음 노드 ID
  source_index?: number    // 소스 노드의 실행 출력 인덱스 (기본 0)
  source_sub_index?: number
  target_index?: number    // 대상 노드의 실행 입력 인덱스 (기본 0)
  target_sub_index?: number
}
```

- 숫자만 쓰면 `source_index=0`에서 `node_id`로 연결 (단순 순차 흐름)
- 객체 형태는 분기(`branch`) 등 다중 실행 출력이 있는 노드에서 사용

**예시 (branch 노드):**
```json
"next": [
  { "node_id": 10, "source_index": 0 },
  { "node_id": 20, "source_index": 1 }
]
```
→ `source_index: 0` = true 분기, `source_index: 1` = false 분기

---

## 값 타입 전체 목록

`ValueType` = `keyof ValueTypeMap`:

**기본 타입:** `bool`, `int`, `float`, `str`, `vec3`

**고급 타입:** `guid`, `entity`, `prefab_id`, `config_id`, `faction`

**리스트 타입:** 위 기본/고급 타입에 `_list` 접미사: `int_list`, `str_list`, `entity_list`, ...

**특수 타입:**
- `dict` — 딕셔너리
- `struct` — 구조체
- `generic` — 제네릭 (런타임에 타입 결정)
- `enum` / `enumeration` — 열거형
- `local_variable` — Local Variable 참조
- `custom_variable_snapshot` — Custom Variable 스냅샷

---

## 배열 IR (멀티 그래프)

하나의 `.json` 파일이 `IRDocument[]` 배열을 담을 수 있다. 동일한 파일에서 여러 `g.server()`를 다른 ID로 선언한 경우 발생한다.

Stage 3는 배열 IR에서 각 문서를 별도 `.gia` 파일로 출력한다.

---

## 병합된 IR (`__gsts` 메타)

`ir_merge.ts`가 생성하는 병합 IR은 특수 메타 필드를 포함한다:

```json
{
  "__gsts": {
    "merged": true,
    "graphId": 1073741825,
    "sources": ["dist/src/a.json", "dist/src/b.json"]
  },
  "ir_version": 1,
  "ir_type": "node_graph",
  "graph": { ... },
  "nodes": [ ... ]
}
```

CLI의 `isMergedJsonFile()`이 이 메타를 감지해 병합 파일 처리 시 중복 병합을 방지한다.

---

## 실제 IR 예시

```json
{
  "ir_version": 1,
  "ir_type": "node_graph",
  "graph": {
    "name": "_GSTS_main",
    "id": 1073741825,
    "type": "server",
    "mode": "beyond",
    "sub_type": "entity"
  },
  "variables": [
    { "name": "count", "type": "int", "value": 0 }
  ],
  "nodes": [
    {
      "id": 1,
      "type": "whenEntityIsCreated",
      "args": [null, null],
      "next": [2]
    },
    {
      "id": 2,
      "type": "get_node_graph_variable",
      "args": [{ "type": "str", "value": "count" }],
      "next": []
    },
    {
      "id": 3,
      "type": "add",
      "args": [
        { "type": "conn", "value": { "node_id": 2, "index": 0, "type": "int" } },
        { "type": "int", "value": 1 }
      ]
    }
  ]
}
```
