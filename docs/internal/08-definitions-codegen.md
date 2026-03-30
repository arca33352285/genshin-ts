# 08. 정의 파일 코드 생성 (scripts/generate-definitions.ts)

> 관련 문서: [10-dev-guide.md](10-dev-guide.md)

## 개요

`src/definitions/`의 TypeScript 파일들은 대부분 자동 생성된다. `scripts/generate-definitions.ts`가 `resources/node_definitions.json`을 읽어 이벤트, 함수, 열거형 타입 정의를 생성한다.

**실행 명령:** `npm run gen`

```
scripts/generate-definitions.ts
  reads: resources/node_definitions.json
         resources/node_generics.json
         resources/node_generics_summary.json
  writes: src/definitions/events.ts
          src/definitions/events-payload.ts
          src/definitions/events-payload-mode.ts
          src/definitions/nodes.ts
          src/definitions/node_modes.ts
          src/definitions/zh_aliases.ts
          src/definitions/enum.ts (부분)
```

---

## 입력 파일

### `resources/node_definitions.json`

게임 노드 그래프 시스템의 원시 데이터. 각 노드(이벤트/함수)의 정의를 담는다.

**주요 구조 (추정):**
```json
{
  "events": [
    {
      "name": "whenEntityIsCreated",
      "nameZh": "当实体被创建时",
      "outputs": [
        { "name": "eventSourceEntity", "type": "entity" },
        { "name": "eventSourceGuid", "type": "guid" }
      ]
    }
  ],
  "functions": [
    {
      "name": "printString",
      "nameZh": "打印字符串",
      "inputs": [
        { "name": "value", "type": "string" }
      ]
    }
  ]
}
```

### `resources/node_generics.json`

제네릭 타입 파라미터가 있는 함수들의 추가 정보.

### `resources/node_generics_summary.json`

제네릭 타입 요약 정보 (`GenericSummary` 배열: 각 제네릭 그룹의 사용 가능 타입 목록).

---

## 타입 문자열 → genshin-ts 타입 매핑

`TYPE_MAP` 객체가 게임의 원시 타입 문자열을 genshin-ts 타입으로 변환한다:

```typescript
const TYPE_MAP: Record<string, string> = {
  'boolean': 'bool',
  'integer': 'int',
  'float': 'float',
  'string': 'str',
  'guid': 'guid',
  'prefab id': 'prefabId',
  'config id': 'configId',
  'entity': 'entity',
  'enumeration': 'enumeration',
  'dictionary': 'dict',
  '3d vector': 'vec3',
  'local variable': 'localVariable',
  // ... 등
}
```

---

## 제네릭 타입 처리

제네릭 함수(예: `getListElement<T>`)는 별도로 처리된다.

**`GenericContext` 타입:** 제네릭 함수 하나의 코드 생성 컨텍스트:
- `typeParam`: 타입 파라미터명 (e.g. `"T"`)
- `runtimeTypeMap`: 런타임 타입 맵 문자열
- `matchArgs`: 타입 매칭에 사용되는 인자 표현식
- `genericInputNames`: 제네릭 타입의 입력 핀 이름 집합
- `genericOutputIndices`: 제네릭 타입의 출력 핀 인덱스 집합

**`normalizeGenericTypeName()`:** `"list<int>"` → `{ base: 'int', variant: 'list' }` 변환.

---

## 출력 파일별 내용

### `src/definitions/events.ts`

이벤트 메타데이터 상수를 생성한다.

```typescript
export const ServerEventMetadata = {
  whenEntityIsCreated: [
    { name: 'eventSourceEntity', typeBase: entity, typeName: 'entity', isArray: false },
    { name: 'eventSourceGuid', typeBase: guid, typeName: 'guid', isArray: false },
  ],
  // ...
}

export type ServerEventMetadataType = typeof ServerEventMetadata
export type ServerEventName = keyof ServerEventMetadataType
```

런타임에서 각 이벤트의 출력 핀 정보를 조회하는 데 사용된다.

### `src/definitions/events-payload.ts`

이벤트 핸들러의 `evt` 매개변수 타입을 생성한다.

```typescript
export type ServerEventPayloads = {
  whenEntityIsCreated: {
    eventSourceEntity: EntityValue
    eventSourceGuid: GuidValue
  }
  // ...
}
```

### `src/definitions/events-payload-mode.ts`

모드(beyond/classic)별 이벤트 페이로드 타입. beyond 모드에서만 사용 가능한 이벤트를 분리한다.

### `src/definitions/nodes.ts`

노드 함수 정의를 생성한다. 사용자가 `f.someFunction(...)` 형태로 호출하는 모든 함수.

```typescript
export type ServerExecutionFlowFunctions = {
  printString(value: StrValue): void
  teleportTo(entity: EntityValue, position: Vec3Value): void
  add(a: IntValue | FloatValue, b: IntValue | FloatValue): IntValue | FloatValue
  // ...
}
```

**제네릭 함수 오버로드:** 타입 파라미터가 있는 함수는 각 가능한 타입에 대한 오버로드로 생성된다:

```typescript
getListElement(list: BoolValue_list, index: IntValue): BoolValue
getListElement(list: IntValue_list, index: IntValue): IntValue
// ...
```

### `src/definitions/node_modes.ts`

`NODE_TYPE_BY_METHOD` 맵을 생성한다. 각 함수가 beyond 모드 전용인지 classic 모드에서도 사용 가능한지 기록.

### `src/definitions/zh_aliases.ts`

이벤트와 함수의 한국어/중국어 → 영어 별칭 맵을 생성한다.

```typescript
export const SERVER_EVENT_ZH_TO_EN = {
  '当实体被创建时': 'whenEntityIsCreated',
  // ...
} as const

export const SERVER_F_ZH_TO_EN = {
  '打印字符串': 'printString',
  // ...
} as const
```

### `src/definitions/enum.ts`

게임 열거형 타입들. 이 파일은 완전 자동 생성이 아닐 수 있으며, `generate-definitions.ts`가 일부를 추가/업데이트할 수 있다.

---

## 수동 유지 파일

자동 생성이 아닌, 직접 유지 관리하는 정의 파일들:

### `src/definitions/entity_helpers.ts`

엔티티 서브타입 헬퍼. `CharacterEntity`, `CreationEntity`, `StageEntity` 등의 엔티티 서브타입을 정의하고, 엔티티 메서드들에 서브타입 타입 힌트를 제공한다.

- `EntityKind`: `'player' | 'character' | 'stage' | 'object' | 'creation'`
- `EntityOf<K>`: 특정 kind를 가진 entity 타입
- `ENTITY_HELPER_METHODS`: 첫 번째 인자가 entity-like인 메서드 목록

### `src/definitions/prefabs.ts`

Prefab ID 상수. `extractCustomResourcesFromGil()`이 부분적으로 업데이트할 수 있다.

### `src/definitions/server_on_overloads.d.ts`

`g.server().on(eventName, handler)` 메서드 오버로드 타입. 이벤트 이름에 따라 `evt` 타입이 달라지는 것을 타입 시스템으로 표현.

---

## 코드 생성 프로세스 상세

1. `rawDef` (node_definitions.json) 로드
2. 각 노드 정의를 순회:
   - 이벤트: `ServerEventMetadata` 항목 생성
   - 함수: `ServerExecutionFlowFunctions` 메서드 시그니처 생성
3. 제네릭 노드는 `node_generics.json`에서 추가 규칙을 로드해 오버로드 생성
4. `zh_aliases.ts`에 중국어 이름 매핑 추가
5. `prettier` 자동 포맷 (`npm run gen`의 후처리)

**주의:** `npm run gen` 후에는 반드시 `prettier`가 실행되므로, 생성 결과물을 수동으로 편집하면 다음 `gen` 실행 시 덮어써진다.

---

## 노드 정의 데이터 업데이트

게임 업데이트로 새 이벤트나 함수가 추가된 경우:

1. `resources/node_definitions.json`에 새 항목 추가
2. `npm run gen` 실행
3. 생성된 파일 검토 및 필요한 경우 추가 타입 힌트 수동 편집
4. `src/definitions/entity_helpers.ts`의 `ENTITY_HELPER_METHODS` 배열에 해당 함수가 있는지 확인
