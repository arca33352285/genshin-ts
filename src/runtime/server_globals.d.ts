import type { PlayerEntity, StageEntity } from '../definitions/entity_helpers.js'
import type { ServerEventPayloads } from '../definitions/events-payload.js'
import type { ServerExecutionFlowFunctions } from '../definitions/nodes.js'
import type {
  BoolValue,
  configId,
  ConfigIdValue,
  DictKeyType,
  DictValueType,
  entity,
  EntityValue,
  faction,
  FactionValue,
  FloatValue,
  guid,
  GuidValue,
  IntValue,
  prefabId,
  PrefabIdValue,
  ReadonlyDict,
  RuntimeParameterValueTypeMap,
  RuntimeReturnValueTypeMap,
  StrValue,
  vec3,
  Vec3Value
} from './value.js'

declare global {
  /**
   * JS 표현식 결과를 그대로 반환한다. 컴파일러가 아무런 처리도 하지 않는다.
   * JS 시맨틱을 유지하거나 노드 그래프 변환을 우회할 때 사용한다.
   */
  function raw<T>(value: T): T

  /**
   * 노드 그래프 조건 판단을 위해 bool로 변환한다.
   */
  function bool(value: BoolValue | IntValue): boolean
  /**
   * 정수 전용 노드를 위해 int(bigint)로 변환한다.
   * bigint 리터럴 대신 명시적 정수 선언 방식으로도 사용 가능하다(예: `int(123)`). 단, 일반적으로는 bigint 사용을 권장한다.
   */
  function int(value: IntValue | BoolValue | FloatValue): bigint
  /**
   * genshin-ts는 런타임 정수 타입으로 `bigint`를 사용하지만, TypeScript 배열 인덱싱은 `number`를 요구한다.
   * bigint/int 형 인덱스는 `idx(...)`로 감싸서 TS 타입 검사를 통과시킨다:
   * `arr[idx(i)]`.
   *
   * `idx(...)`는 런타임에 영향을 주지 않으며, 타입 검사 통과 용도로만 사용된다.
   * ESLint 규칙(`gsts/bigint-index-in-server`)으로 자동 수정도 가능하다.
   *
   * 경고(오류 아님)로 표시된다면 TypeScript 플러그인이 활성화되어 있고
   * 현재 스코프에서 bigint가 이미 유효한 인덱스 타입으로 처리되는 것이다. 이 경우 `gsts/bigint-index-in-server`를 비활성화해도 된다.
   *
   * VSCode/Cursor에서 여전히 TS2538(bigint는 인덱스 타입으로 사용 불가)이 표시된다면 워크스페이스 TypeScript로 전환한다:
   * - `typescript.tsdk = “node_modules/typescript/lib”`
   * - `typescript.enablePromptUseWorkspaceTsdk = true`
   * - “Use Workspace Version” 선택
   * (genshin-ts 프로젝트 템플릿에는 이 설정이 이미 포함되어 있다.)
   */
  function idx(value: IntValue): number
  /**
   * 부동소수점 노드를 위해 float(number)로 변환한다.
   */
  function float(value: FloatValue | IntValue): number
  /**
   * 문자열로 변환한다. 로그 출력 시 주로 사용한다.
   */
  function str(
    value:
      | StrValue
      | BoolValue
      | IntValue
      | FloatValue
      | GuidValue
      | EntityValue
      | FactionValue
      | Vec3Value
  ): string
  /**
   * `[x, y, z]` 또는 기존 vec3로부터 vec3 리터럴을 생성한다.
   * 대부분의 경우 `[x, y, z]`를 직접 전달하면 자동으로 타입이 추론된다.
   * 리스트 문맥에서 타입 모호성을 제거하고 vec3 타입을 명시할 때 주로 사용한다.
   */
  function vec3(value: Vec3Value): vec3
  /**
   * 제네릭 핀(예: 커스텀 변수 설정 등)에 GUID 타입 리터럴을 명시적으로 선언한다.
   * 데이터 타입 변환 용도로는 사용할 수 없다(노드 그래프는 런타임 변환을 지원하지 않는다).
   */
  function guid(value: GuidValue): guid
  /**
   * 제네릭 핀(예: 커스텀 변수 설정 등)에 프리팹 ID 타입 리터럴을 명시적으로 선언한다.
   * 데이터 타입 변환 용도로는 사용할 수 없다(노드 그래프는 런타임 변환을 지원하지 않는다).
   */
  function prefabId(value: PrefabIdValue): prefabId
  /**
   * 제네릭 핀(예: 커스텀 변수 설정 등)에 설정 ID 타입 리터럴을 명시적으로 선언한다.
   * 데이터 타입 변환 용도로는 사용할 수 없다(노드 그래프는 런타임 변환을 지원하지 않는다).
   */
  function configId(value: ConfigIdValue): configId
  /**
   * 제네릭 핀(예: 커스텀 변수 설정 등)에 진영 타입 리터럴을 명시적으로 선언한다.
   * 데이터 타입 변환 용도로는 사용할 수 없다(노드 그래프는 런타임 변환을 지원하지 않는다).
   */
  function faction(value: FactionValue): faction
  /**
   * 다음과 같은 다양한 방식으로 엔티티를 해석한다:
   * - `entity(0)` / `entity(null)`: 플레이스홀더, 핀을 연결하지 않은 상태로 유지한다.
   * - `entity(guidNumber)`: GUID 값으로 엔티티를 조회한다.
   * - `entity(otherEntity)`: 엔티티 서브타입을 일반 엔티티 타입으로 넓힌다(서브타입 제약 우회).
   */
  function entity(guidOrEntity: GuidValue | EntityValue | null | 0): entity

  /**
   * 로그에 문자열을 출력한다. 일반적으로 로직 확인 및 디버깅에 사용한다.
   * 로그에는 해당 노드 그래프 체크 여부와 무관하게 로직이 성공적으로 실행될 때마다 출력된다.
   *
   * @param string 출력할 문자열
   */
  function print(string: StrValue): void

  /**
   * 스테이지 전역으로 커스텀 시그널을 전송한다. 사용 전에 해당 시그널 이름을 선택해야 시그널 파라미터를 올바르게 사용할 수 있다.
   *
   * GSTS Note: 에디터의 시그널 매니저에서 시그널을 별도로 등록해야 한다. 시그널 분산을 이용하면 대형 루프의 부하 한도 초과를 방지할 수 있어 성능 최적화에 활용할 수 있다.
   *
   * @param signalName 시그널 이름 (리터럴 문자열만 지원)
   */
  function send(signalName: StrValue, args?: Record<string, any>): void

  /**
   * 플레이어 번호로 플레이어 엔티티를 반환한다. 플레이어 번호는 해당 플레이어의 순서를 나타낸다.
   *
   * GSTS Note: 번호는 1부터 시작한다.
   *
   * @param playerId 플레이어 번호
   * @returns 플레이어 엔티티
   */
  function player(playerId: IntValue): PlayerEntity

  /**
   * 스테이지 엔티티
   */
  const stage: StageEntity

  /**
   * 스테이지 엔티티
   */
  const level: StageEntity

  /**
   * 이 노드 그래프에 연결된 엔티티를 반환한다.
   *
   * @returns 자기 자신 엔티티
   */
  const self: entity

  /**
   * Unity 스타일 수학 유틸리티 (server 전용)
   */
  const Mathf: {
    /**
     * 절댓값
     */
    Abs(value: FloatValue | IntValue): number | bigint
    /**
     * 내림하여 정수 반환
     */
    FloorToInt(value: FloatValue | IntValue): bigint
    /**
     * 올림하여 정수 반환
     */
    CeilToInt(value: FloatValue | IntValue): bigint
    /**
     * 반올림하여 정수 반환
     */
    RoundToInt(value: FloatValue | IntValue): bigint
    /**
     * 제곱근
     */
    Sqrt(value: FloatValue | IntValue): number
    /**
     * 거듭제곱
     */
    Pow(base: FloatValue | IntValue, exponent: FloatValue | IntValue): number | bigint
    /**
     * 로그 (base 생략 시 자연로그)
     */
    Log(value: FloatValue | IntValue, base?: FloatValue | IntValue): number
    /**
     * 사인 (라디안)
     */
    Sin(radian: FloatValue | IntValue): number
    /**
     * 코사인 (라디안)
     */
    Cos(radian: FloatValue | IntValue): number
    /**
     * 탄젠트 (라디안)
     */
    Tan(radian: FloatValue | IntValue): number
  }

  /**
   * Unity 스타일 랜덤 유틸리티 (server 전용)
   */
  const Random: {
    /**
     * 범위 내 랜덤 값 (닫힌 구간)
     */
    Range(min: FloatValue, max: FloatValue): number
    Range(min: IntValue, max: IntValue): bigint
    /**
     * [0, 1] 범위의 랜덤 값 (닫힌 구간)
     */
    readonly value: number
  }

  /**
   * Unity 스타일 Vector3 유틸리티 (server 전용)
   */
  const Vector3: {
    /** 영벡터 */
    readonly zero: vec3
    /** 전체 요소가 1인 벡터 */
    readonly one: vec3
    /** 위 방향 */
    readonly up: vec3
    /** 아래 방향 */
    readonly down: vec3
    /** 왼쪽 방향 */
    readonly left: vec3
    /** 오른쪽 방향 */
    readonly right: vec3
    /** 앞 방향 */
    readonly forward: vec3
    /** 뒤 방향 */
    readonly back: vec3
    /** 내적 */
    Dot(a: Vec3Value, b: Vec3Value): number
    /** 외적 */
    Cross(a: Vec3Value, b: Vec3Value): vec3
    /** 거리 */
    Distance(a: Vec3Value, b: Vec3Value): number
    /** 두 벡터 사이의 각도 */
    Angle(a: Vec3Value, b: Vec3Value): number
    /** 정규화 */
    Normalize(v: Vec3Value): vec3
    /** 벡터의 크기 */
    Magnitude(v: Vec3Value): number
    /** 덧셈 */
    Add(a: Vec3Value, b: Vec3Value): vec3
    /** 뺄셈 */
    Sub(a: Vec3Value, b: Vec3Value): vec3
    /** 스케일 */
    Scale(v: Vec3Value, s: FloatValue | IntValue): vec3
    /** 회전 */
    Rotation(rotate: Vec3Value, v: Vec3Value): vec3
    /** 선형 보간 */
    Lerp(a: Vec3Value, b: Vec3Value, t: FloatValue | IntValue): vec3
    /** 크기 제한 */
    ClampMagnitude(v: Vec3Value, max: FloatValue | IntValue): vec3
  }

  /**
   * Unity 스타일 GameObject 유틸리티 (server 전용)
   */
  const GameObject: {
    /**
     * GUID로 엔티티 조회
     */
    Find(guidValue: GuidValue): entity
    /**
     * 태그 인덱스로 첫 번째 엔티티 조회
     */
    FindWithTag(tag: IntValue): entity
    /**
     * 태그 인덱스로 모든 엔티티 목록 조회
     */
    FindGameObjectsWithTag(tag: IntValue): entity[]
    /**
     * 프리팹 ID로 엔티티 목록 조회
     */
    FindByPrefabId(prefab: PrefabIdValue): entity[]
  }

  /**
   * 최대 50개의 키-값 쌍을 하나의 딕셔너리로 조합한다.
   * 타입 지정 플레이스홀더는 `dict(k, v, 0)`을 사용하고(핀 미연결 유지), 타입 추론이 가능한 경우 `dict(0)` / `dict(null)`을 사용한다.
   *
   * GSTS Note: 이 방법으로 선언된 딕셔너리는 수정할 수 없다. 수정이 필요한 경우 노드 그래프 변수 딕셔너리를 선언해야 한다.
   */
  function dict(value: null | 0): ReadonlyDict<never, never>
  function dict<K extends DictKeyType, V extends DictValueType>(
    keyType: K,
    valueType: V,
    value: null | 0
  ): ReadonlyDict<K, V>
  function dict(obj: Record<string, FloatValue>): ReadonlyDict<'str', 'float'>
  function dict(obj: Record<string, IntValue>): ReadonlyDict<'str', 'int'>
  function dict(obj: Record<string, BoolValue>): ReadonlyDict<'str', 'bool'>
  function dict(obj: Record<string, ConfigIdValue>): ReadonlyDict<'str', 'config_id'>
  function dict(obj: Record<string, EntityValue>): ReadonlyDict<'str', 'entity'>
  function dict(obj: Record<string, FactionValue>): ReadonlyDict<'str', 'faction'>
  function dict(obj: Record<string, GuidValue>): ReadonlyDict<'str', 'guid'>
  function dict(obj: Record<string, PrefabIdValue>): ReadonlyDict<'str', 'prefab_id'>
  function dict(obj: Record<string, StrValue>): ReadonlyDict<'str', 'str'>
  function dict(obj: Record<string, vec3>): ReadonlyDict<'str', 'vec3'>
  function dict(obj: Record<string, FloatValue[]>): ReadonlyDict<'str', 'float_list'>
  function dict(obj: Record<string, IntValue[]>): ReadonlyDict<'str', 'int_list'>
  function dict(obj: Record<string, BoolValue[]>): ReadonlyDict<'str', 'bool_list'>
  function dict(obj: Record<string, ConfigIdValue[]>): ReadonlyDict<'str', 'config_id_list'>
  function dict(obj: Record<string, EntityValue[]>): ReadonlyDict<'str', 'entity_list'>
  function dict(obj: Record<string, FactionValue[]>): ReadonlyDict<'str', 'faction_list'>
  function dict(obj: Record<string, GuidValue[]>): ReadonlyDict<'str', 'guid_list'>
  function dict(obj: Record<string, PrefabIdValue[]>): ReadonlyDict<'str', 'prefab_id_list'>
  function dict(obj: Record<string, StrValue[]>): ReadonlyDict<'str', 'str_list'>
  function dict(obj: Record<string, Vec3Value[]>): ReadonlyDict<'str', 'vec3_list'>
  function dict<V extends DictValueType>(
    obj: Record<string, RuntimeParameterValueTypeMap[V]>
  ): ReadonlyDict<'str', V>

  function dict(pairs: { k: IntValue; v: FloatValue }[]): ReadonlyDict<'int', 'float'>
  function dict(pairs: { k: IntValue; v: IntValue }[]): ReadonlyDict<'int', 'int'>
  function dict(pairs: { k: IntValue; v: BoolValue }[]): ReadonlyDict<'int', 'bool'>
  function dict(pairs: { k: IntValue; v: ConfigIdValue }[]): ReadonlyDict<'int', 'config_id'>
  function dict(pairs: { k: IntValue; v: EntityValue }[]): ReadonlyDict<'int', 'entity'>
  function dict(pairs: { k: IntValue; v: FactionValue }[]): ReadonlyDict<'int', 'faction'>
  function dict(pairs: { k: IntValue; v: GuidValue }[]): ReadonlyDict<'int', 'guid'>
  function dict(pairs: { k: IntValue; v: PrefabIdValue }[]): ReadonlyDict<'int', 'prefab_id'>
  function dict(pairs: { k: IntValue; v: StrValue }[]): ReadonlyDict<'int', 'str'>
  function dict(pairs: { k: IntValue; v: vec3 }[]): ReadonlyDict<'int', 'vec3'>
  function dict(pairs: { k: IntValue; v: FloatValue[] }[]): ReadonlyDict<'int', 'float_list'>
  function dict(pairs: { k: IntValue; v: IntValue[] }[]): ReadonlyDict<'int', 'int_list'>
  function dict(pairs: { k: IntValue; v: BoolValue[] }[]): ReadonlyDict<'int', 'bool_list'>
  function dict(pairs: { k: IntValue; v: ConfigIdValue[] }[]): ReadonlyDict<'int', 'config_id_list'>
  function dict(pairs: { k: IntValue; v: EntityValue[] }[]): ReadonlyDict<'int', 'entity_list'>
  function dict(pairs: { k: IntValue; v: FactionValue[] }[]): ReadonlyDict<'int', 'faction_list'>
  function dict(pairs: { k: IntValue; v: GuidValue[] }[]): ReadonlyDict<'int', 'guid_list'>
  function dict(pairs: { k: IntValue; v: PrefabIdValue[] }[]): ReadonlyDict<'int', 'prefab_id_list'>
  function dict(pairs: { k: IntValue; v: StrValue[] }[]): ReadonlyDict<'int', 'str_list'>
  function dict(pairs: { k: IntValue; v: Vec3Value[] }[]): ReadonlyDict<'int', 'vec3_list'>
  function dict(pairs: { k: StrValue; v: FloatValue }[]): ReadonlyDict<'str', 'float'>
  function dict(pairs: { k: StrValue; v: IntValue }[]): ReadonlyDict<'str', 'int'>
  function dict(pairs: { k: StrValue; v: BoolValue }[]): ReadonlyDict<'str', 'bool'>
  function dict(pairs: { k: StrValue; v: ConfigIdValue }[]): ReadonlyDict<'str', 'config_id'>
  function dict(pairs: { k: StrValue; v: EntityValue }[]): ReadonlyDict<'str', 'entity'>
  function dict(pairs: { k: StrValue; v: FactionValue }[]): ReadonlyDict<'str', 'faction'>
  function dict(pairs: { k: StrValue; v: GuidValue }[]): ReadonlyDict<'str', 'guid'>
  function dict(pairs: { k: StrValue; v: PrefabIdValue }[]): ReadonlyDict<'str', 'prefab_id'>
  function dict(pairs: { k: StrValue; v: StrValue }[]): ReadonlyDict<'str', 'str'>
  function dict(pairs: { k: StrValue; v: vec3 }[]): ReadonlyDict<'str', 'vec3'>
  function dict(pairs: { k: StrValue; v: FloatValue[] }[]): ReadonlyDict<'str', 'float_list'>
  function dict(pairs: { k: StrValue; v: IntValue[] }[]): ReadonlyDict<'str', 'int_list'>
  function dict(pairs: { k: StrValue; v: BoolValue[] }[]): ReadonlyDict<'str', 'bool_list'>
  function dict(pairs: { k: StrValue; v: ConfigIdValue[] }[]): ReadonlyDict<'str', 'config_id_list'>
  function dict(pairs: { k: StrValue; v: EntityValue[] }[]): ReadonlyDict<'str', 'entity_list'>
  function dict(pairs: { k: StrValue; v: FactionValue[] }[]): ReadonlyDict<'str', 'faction_list'>
  function dict(pairs: { k: StrValue; v: GuidValue[] }[]): ReadonlyDict<'str', 'guid_list'>
  function dict(pairs: { k: StrValue; v: PrefabIdValue[] }[]): ReadonlyDict<'str', 'prefab_id_list'>
  function dict(pairs: { k: StrValue; v: StrValue[] }[]): ReadonlyDict<'str', 'str_list'>
  function dict(pairs: { k: StrValue; v: Vec3Value[] }[]): ReadonlyDict<'str', 'vec3_list'>
  function dict(pairs: { k: EntityValue; v: FloatValue }[]): ReadonlyDict<'entity', 'float'>
  function dict(pairs: { k: EntityValue; v: IntValue }[]): ReadonlyDict<'entity', 'int'>
  function dict(pairs: { k: EntityValue; v: BoolValue }[]): ReadonlyDict<'entity', 'bool'>
  function dict(pairs: { k: EntityValue; v: ConfigIdValue }[]): ReadonlyDict<'entity', 'config_id'>
  function dict(pairs: { k: EntityValue; v: EntityValue }[]): ReadonlyDict<'entity', 'entity'>
  function dict(pairs: { k: EntityValue; v: FactionValue }[]): ReadonlyDict<'entity', 'faction'>
  function dict(pairs: { k: EntityValue; v: GuidValue }[]): ReadonlyDict<'entity', 'guid'>
  function dict(pairs: { k: EntityValue; v: PrefabIdValue }[]): ReadonlyDict<'entity', 'prefab_id'>
  function dict(pairs: { k: EntityValue; v: StrValue }[]): ReadonlyDict<'entity', 'str'>
  function dict(pairs: { k: EntityValue; v: vec3 }[]): ReadonlyDict<'entity', 'vec3'>
  function dict(pairs: { k: EntityValue; v: FloatValue[] }[]): ReadonlyDict<'entity', 'float_list'>
  function dict(pairs: { k: EntityValue; v: IntValue[] }[]): ReadonlyDict<'entity', 'int_list'>
  function dict(pairs: { k: EntityValue; v: BoolValue[] }[]): ReadonlyDict<'entity', 'bool_list'>
  function dict(
    pairs: { k: EntityValue; v: ConfigIdValue[] }[]
  ): ReadonlyDict<'entity', 'config_id_list'>
  function dict(
    pairs: { k: EntityValue; v: EntityValue[] }[]
  ): ReadonlyDict<'entity', 'entity_list'>
  function dict(
    pairs: { k: EntityValue; v: FactionValue[] }[]
  ): ReadonlyDict<'entity', 'faction_list'>
  function dict(pairs: { k: EntityValue; v: GuidValue[] }[]): ReadonlyDict<'entity', 'guid_list'>
  function dict(
    pairs: { k: EntityValue; v: PrefabIdValue[] }[]
  ): ReadonlyDict<'entity', 'prefab_id_list'>
  function dict(pairs: { k: EntityValue; v: StrValue[] }[]): ReadonlyDict<'entity', 'str_list'>
  function dict(pairs: { k: EntityValue; v: Vec3Value[] }[]): ReadonlyDict<'entity', 'vec3_list'>
  function dict(pairs: { k: GuidValue; v: FloatValue }[]): ReadonlyDict<'guid', 'float'>
  function dict(pairs: { k: GuidValue; v: IntValue }[]): ReadonlyDict<'guid', 'int'>
  function dict(pairs: { k: GuidValue; v: BoolValue }[]): ReadonlyDict<'guid', 'bool'>
  function dict(pairs: { k: GuidValue; v: ConfigIdValue }[]): ReadonlyDict<'guid', 'config_id'>
  function dict(pairs: { k: GuidValue; v: EntityValue }[]): ReadonlyDict<'guid', 'entity'>
  function dict(pairs: { k: GuidValue; v: FactionValue }[]): ReadonlyDict<'guid', 'faction'>
  function dict(pairs: { k: GuidValue; v: GuidValue }[]): ReadonlyDict<'guid', 'guid'>
  function dict(pairs: { k: GuidValue; v: PrefabIdValue }[]): ReadonlyDict<'guid', 'prefab_id'>
  function dict(pairs: { k: GuidValue; v: StrValue }[]): ReadonlyDict<'guid', 'str'>
  function dict(pairs: { k: GuidValue; v: vec3 }[]): ReadonlyDict<'guid', 'vec3'>
  function dict(pairs: { k: GuidValue; v: FloatValue[] }[]): ReadonlyDict<'guid', 'float_list'>
  function dict(pairs: { k: GuidValue; v: IntValue[] }[]): ReadonlyDict<'guid', 'int_list'>
  function dict(pairs: { k: GuidValue; v: BoolValue[] }[]): ReadonlyDict<'guid', 'bool_list'>
  function dict(
    pairs: { k: GuidValue; v: ConfigIdValue[] }[]
  ): ReadonlyDict<'guid', 'config_id_list'>
  function dict(pairs: { k: GuidValue; v: EntityValue[] }[]): ReadonlyDict<'guid', 'entity_list'>
  function dict(pairs: { k: GuidValue; v: FactionValue[] }[]): ReadonlyDict<'guid', 'faction_list'>
  function dict(pairs: { k: GuidValue; v: GuidValue[] }[]): ReadonlyDict<'guid', 'guid_list'>
  function dict(
    pairs: { k: GuidValue; v: PrefabIdValue[] }[]
  ): ReadonlyDict<'guid', 'prefab_id_list'>
  function dict(pairs: { k: GuidValue; v: StrValue[] }[]): ReadonlyDict<'guid', 'str_list'>
  function dict(pairs: { k: GuidValue; v: Vec3Value[] }[]): ReadonlyDict<'guid', 'vec3_list'>
  function dict(pairs: { k: FactionValue; v: FloatValue }[]): ReadonlyDict<'faction', 'float'>
  function dict(pairs: { k: FactionValue; v: IntValue }[]): ReadonlyDict<'faction', 'int'>
  function dict(pairs: { k: FactionValue; v: BoolValue }[]): ReadonlyDict<'faction', 'bool'>
  function dict(
    pairs: { k: FactionValue; v: ConfigIdValue }[]
  ): ReadonlyDict<'faction', 'config_id'>
  function dict(pairs: { k: FactionValue; v: EntityValue }[]): ReadonlyDict<'faction', 'entity'>
  function dict(pairs: { k: FactionValue; v: FactionValue }[]): ReadonlyDict<'faction', 'faction'>
  function dict(pairs: { k: FactionValue; v: GuidValue }[]): ReadonlyDict<'faction', 'guid'>
  function dict(
    pairs: { k: FactionValue; v: PrefabIdValue }[]
  ): ReadonlyDict<'faction', 'prefab_id'>
  function dict(pairs: { k: FactionValue; v: StrValue }[]): ReadonlyDict<'faction', 'str'>
  function dict(pairs: { k: FactionValue; v: vec3 }[]): ReadonlyDict<'faction', 'vec3'>
  function dict(
    pairs: { k: FactionValue; v: FloatValue[] }[]
  ): ReadonlyDict<'faction', 'float_list'>
  function dict(pairs: { k: FactionValue; v: IntValue[] }[]): ReadonlyDict<'faction', 'int_list'>
  function dict(pairs: { k: FactionValue; v: BoolValue[] }[]): ReadonlyDict<'faction', 'bool_list'>
  function dict(
    pairs: { k: FactionValue; v: ConfigIdValue[] }[]
  ): ReadonlyDict<'faction', 'config_id_list'>
  function dict(
    pairs: { k: FactionValue; v: EntityValue[] }[]
  ): ReadonlyDict<'faction', 'entity_list'>
  function dict(
    pairs: { k: FactionValue; v: FactionValue[] }[]
  ): ReadonlyDict<'faction', 'faction_list'>
  function dict(pairs: { k: FactionValue; v: GuidValue[] }[]): ReadonlyDict<'faction', 'guid_list'>
  function dict(
    pairs: { k: FactionValue; v: PrefabIdValue[] }[]
  ): ReadonlyDict<'faction', 'prefab_id_list'>
  function dict(pairs: { k: FactionValue; v: StrValue[] }[]): ReadonlyDict<'faction', 'str_list'>
  function dict(pairs: { k: FactionValue; v: Vec3Value[] }[]): ReadonlyDict<'faction', 'vec3_list'>
  function dict(pairs: { k: ConfigIdValue; v: FloatValue }[]): ReadonlyDict<'config_id', 'float'>
  function dict(pairs: { k: ConfigIdValue; v: IntValue }[]): ReadonlyDict<'config_id', 'int'>
  function dict(pairs: { k: ConfigIdValue; v: BoolValue }[]): ReadonlyDict<'config_id', 'bool'>
  function dict(
    pairs: { k: ConfigIdValue; v: ConfigIdValue }[]
  ): ReadonlyDict<'config_id', 'config_id'>
  function dict(pairs: { k: ConfigIdValue; v: EntityValue }[]): ReadonlyDict<'config_id', 'entity'>
  function dict(
    pairs: { k: ConfigIdValue; v: FactionValue }[]
  ): ReadonlyDict<'config_id', 'faction'>
  function dict(pairs: { k: ConfigIdValue; v: GuidValue }[]): ReadonlyDict<'config_id', 'guid'>
  function dict(
    pairs: { k: ConfigIdValue; v: PrefabIdValue }[]
  ): ReadonlyDict<'config_id', 'prefab_id'>
  function dict(pairs: { k: ConfigIdValue; v: StrValue }[]): ReadonlyDict<'config_id', 'str'>
  function dict(pairs: { k: ConfigIdValue; v: vec3 }[]): ReadonlyDict<'config_id', 'vec3'>
  function dict(
    pairs: { k: ConfigIdValue; v: FloatValue[] }[]
  ): ReadonlyDict<'config_id', 'float_list'>
  function dict(pairs: { k: ConfigIdValue; v: IntValue[] }[]): ReadonlyDict<'config_id', 'int_list'>
  function dict(
    pairs: { k: ConfigIdValue; v: BoolValue[] }[]
  ): ReadonlyDict<'config_id', 'bool_list'>
  function dict(
    pairs: { k: ConfigIdValue; v: ConfigIdValue[] }[]
  ): ReadonlyDict<'config_id', 'config_id_list'>
  function dict(
    pairs: { k: ConfigIdValue; v: EntityValue[] }[]
  ): ReadonlyDict<'config_id', 'entity_list'>
  function dict(
    pairs: { k: ConfigIdValue; v: FactionValue[] }[]
  ): ReadonlyDict<'config_id', 'faction_list'>
  function dict(
    pairs: { k: ConfigIdValue; v: GuidValue[] }[]
  ): ReadonlyDict<'config_id', 'guid_list'>
  function dict(
    pairs: { k: ConfigIdValue; v: PrefabIdValue[] }[]
  ): ReadonlyDict<'config_id', 'prefab_id_list'>
  function dict(pairs: { k: ConfigIdValue; v: StrValue[] }[]): ReadonlyDict<'config_id', 'str_list'>
  function dict(
    pairs: { k: ConfigIdValue; v: Vec3Value[] }[]
  ): ReadonlyDict<'config_id', 'vec3_list'>
  function dict(pairs: { k: PrefabIdValue; v: FloatValue }[]): ReadonlyDict<'prefab_id', 'float'>
  function dict(pairs: { k: PrefabIdValue; v: IntValue }[]): ReadonlyDict<'prefab_id', 'int'>
  function dict(pairs: { k: PrefabIdValue; v: BoolValue }[]): ReadonlyDict<'prefab_id', 'bool'>
  function dict(
    pairs: { k: PrefabIdValue; v: ConfigIdValue }[]
  ): ReadonlyDict<'prefab_id', 'config_id'>
  function dict(pairs: { k: PrefabIdValue; v: EntityValue }[]): ReadonlyDict<'prefab_id', 'entity'>
  function dict(
    pairs: { k: PrefabIdValue; v: FactionValue }[]
  ): ReadonlyDict<'prefab_id', 'faction'>
  function dict(pairs: { k: PrefabIdValue; v: GuidValue }[]): ReadonlyDict<'prefab_id', 'guid'>
  function dict(
    pairs: { k: PrefabIdValue; v: PrefabIdValue }[]
  ): ReadonlyDict<'prefab_id', 'prefab_id'>
  function dict(pairs: { k: PrefabIdValue; v: StrValue }[]): ReadonlyDict<'prefab_id', 'str'>
  function dict(pairs: { k: PrefabIdValue; v: vec3 }[]): ReadonlyDict<'prefab_id', 'vec3'>
  function dict(
    pairs: { k: PrefabIdValue; v: FloatValue[] }[]
  ): ReadonlyDict<'prefab_id', 'float_list'>
  function dict(pairs: { k: PrefabIdValue; v: IntValue[] }[]): ReadonlyDict<'prefab_id', 'int_list'>
  function dict(
    pairs: { k: PrefabIdValue; v: BoolValue[] }[]
  ): ReadonlyDict<'prefab_id', 'bool_list'>
  function dict(
    pairs: { k: PrefabIdValue; v: ConfigIdValue[] }[]
  ): ReadonlyDict<'prefab_id', 'config_id_list'>
  function dict(
    pairs: { k: PrefabIdValue; v: EntityValue[] }[]
  ): ReadonlyDict<'prefab_id', 'entity_list'>
  function dict(
    pairs: { k: PrefabIdValue; v: FactionValue[] }[]
  ): ReadonlyDict<'prefab_id', 'faction_list'>
  function dict(
    pairs: { k: PrefabIdValue; v: GuidValue[] }[]
  ): ReadonlyDict<'prefab_id', 'guid_list'>
  function dict(
    pairs: { k: PrefabIdValue; v: PrefabIdValue[] }[]
  ): ReadonlyDict<'prefab_id', 'prefab_id_list'>
  function dict(pairs: { k: PrefabIdValue; v: StrValue[] }[]): ReadonlyDict<'prefab_id', 'str_list'>
  function dict(
    pairs: { k: PrefabIdValue; v: Vec3Value[] }[]
  ): ReadonlyDict<'prefab_id', 'vec3_list'>
  function dict<K extends DictKeyType, V extends DictValueType>(
    pairs: { k: RuntimeParameterValueTypeMap[K]; v: RuntimeParameterValueTypeMap[V] }[]
  ): ReadonlyDict<K, V>
  /**
   * 타입이 지정된 리스트 또는 플레이스홀더 리스트를 생성한다.
   * 리터럴은 `list(t, items)`, 빈 리스트는 `list(t, [])`, 타입 플레이스홀더는 `list(t, 0)` / `list(t, null)`을 사용한다.
   * `list(0)` / `list(null)`은 대상 핀에서 타입을 추론할 수 있는 경우에만 사용한다(핀 미연결 유지).
   */
  function list(type: null | 0): never[]
  function list<
    T extends
      | 'bool'
      | 'config_id'
      | 'entity'
      | 'faction'
      | 'float'
      | 'guid'
      | 'int'
      | 'prefab_id'
      | 'str'
      | 'vec3'
  >(
    type: T,
    items?: RuntimeParameterValueTypeMap[T][] | null | 0
  ): RuntimeReturnValueTypeMap[`${T}_list`]

  /**
   * 노드 그래프 타이머용 setTimeout (JS 스타일). 노드 그래프 스코프 밖에서는 JS 네이티브 setTimeout을 사용한다.
   *
   * GSTS Note: 노드 그래프 시스템 내부 틱이 불안정하여 딜레이를 정확하게 보장할 수 없다. 직접 효과를 테스트할 것. 딜레이는 노드 그래프 타이머에 그대로 전달된다.
   */
  function setTimeout(
    handler: (
      evt: ServerEventPayloads['whenTimerIsTriggered'],
      f: ServerExecutionFlowFunctions
    ) => void,
    delayMs?: FloatValue
  ): string
  /**
   * 노드 그래프 타이머용 setInterval (JS 스타일). 노드 그래프 스코프 밖에서는 JS 네이티브 setInterval을 사용한다.
   *
   * GSTS Note: 노드 그래프 시스템 내부 틱이 불안정하여 딜레이를 정확하게 보장할 수 없다. 직접 효과를 테스트할 것. 딜레이는 노드 그래프 타이머에 그대로 전달된다.
   */
  function setInterval(
    handler: (
      evt: ServerEventPayloads['whenTimerIsTriggered'],
      f: ServerExecutionFlowFunctions
    ) => void,
    delayMs?: FloatValue
  ): string
  /**
   * setTimeout으로 생성된 타이머를 제거한다.
   */
  function clearTimeout(timerName: StrValue): void
  /**
   * setInterval로 생성된 타이머를 제거한다.
   */
  function clearInterval(timerName: StrValue): void

  /**
   * server 스코프 내 Math는 노드 그래프 동등 구현으로 컴파일된다.
   */
  interface Math {
    /** 절댓값 */
    abs(x: number): number
    /** 내림 */
    floor(x: number): number
    /** 올림 */
    ceil(x: number): number
    /** 반올림 */
    round(x: number): number
    /** 정수 방향으로 절삭 */
    trunc(x: number): number
    /** 거듭제곱 */
    pow(x: number, y: number): number
    /** 제곱근 */
    sqrt(x: number): number
    /** 자연로그 */
    log(x: number): number
    /** 상용로그(밑 10) */
    log10(x: number): number
    /** 밑 2 로그 */
    log2(x: number): number
    /** 사인 (라디안) */
    sin(x: number): number
    /** 코사인 (라디안) */
    cos(x: number): number
    /** 탄젠트 (라디안) */
    tan(x: number): number
    /** 역사인 */
    asin(x: number): number
    /** 역코사인 */
    acos(x: number): number
    /** 역탄젠트 */
    atan(x: number): number
    /** 역탄젠트 (인자 2개) */
    atan2(y: number, x: number): number
    /** 빗변 길이 */
    hypot(x: number, y: number, z?: number): number
    /** 세제곱근 */
    cbrt(x: number): number
    /** 최솟값 */
    min(...values: number[]): number
    /** 최댓값 */
    max(...values: number[]): number
    /** 부호 */
    sign(x: number): number
    /**
     * [0, 1] 범위의 랜덤 값 (GSTS에서는 닫힌 구간)
     */
    random(): number
  }
}

export {}
