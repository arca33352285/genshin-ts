import {
  configId,
  customVariableSnapshot,
  dict,
  entity,
  faction,
  generic,
  guid,
  vec3
} from '../runtime/value.js'
import {
  CauseOfBeingDown,
  ComparisonOperator,
  ElementalReactionType,
  ElementalType,
  EntityType,
  ReasonForItemChange,
  SelectCompletionReason,
  UnitStatusRemovalReason
} from './enum.js'

export type ServerEventPayloads = {
  // === AUTO-GENERATED START ===
  /**
   * 현재 노드 그래프의 그래프 변수가 변경될 때 트리거되는 이벤트. 변화 전/후 값은 제네릭 타입이므로, 올바른 타입을 지정해야 해당 타입의 그래프 변수 이벤트를 수신할 수 있다. 컨테이너 타입의 그래프 변수는 변화 전/후 값 출력 파라미터를 제공하지 않는다.
   */
  whenNodeGraphVariableChanges: {
    /**
     * 이벤트 소스 엔티티: 이 노드 그래프와 연결된 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID: 이 노드 그래프와 연결된 엔티티의 GUID
     */
    eventSourceGuid: guid
    /**
     * 변수 이름: 변경된 변수의 이름
     */
    variableName: string
    /**
     * 변화 전 값: 변수 변경 이전의 값
     */
    preChangeValue: generic
    /**
     * 변화 후 값: 변수 변경 이후의 값
     */
    postChangeValue: generic
  }
  /**
   * 현재 노드 그래프에 연결된 엔티티의 커스텀 변수가 변경될 때 트리거되는 이벤트. 변화 전/후 값은 제네릭 타입이므로, 올바른 타입을 지정해야 해당 타입의 커스텀 변수 이벤트를 수신할 수 있다. 컨테이너 타입의 커스텀 변수는 변화 전/후 값 출력 파라미터를 제공하지 않는다.
   */
  whenCustomVariableChanges: {
    /**
     * 이벤트 소스 엔티티: 이 노드 그래프와 연결된 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID: 이 노드 그래프와 연결된 엔티티의 GUID
     */
    eventSourceGuid: guid
    /**
     * 변수 이름: 변경된 변수의 이름
     */
    variableName: string
    /**
     * 변화 전 값: 변수 변경 이전의 값
     */
    preChangeValue: generic
    /**
     * 변화 후 값: 변수 변경 이후의 값
     */
    postChangeValue: generic
  }
  /**
   * 노드 그래프에 연결된 엔티티의 프리셋 상태가 변경될 때 트리거되는 이벤트
   */
  whenPresetStatusChanges: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 프리셋 상태 인덱스
     */
    presetStatusId: bigint
    /**
     * 변화 전 값
     */
    preChangeValue: bigint
    /**
     * 변화 후 값
     */
    postChangeValue: bigint
  }
  /**
   * “복잡한 피조물 프리셋 상태 값 설정” 노드를 사용해 복잡한 피조물의 프리셋 상태를 변경할 때 트리거되는 이벤트 (변경 전후 값이 달라야 트리거됨). 이 이벤트는 복잡한 피조물의 노드 그래프에서만 수신할 수 있다.
   */
  whenComplexCreationPresetStatusChanges: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 프리셋 상태 인덱스
     */
    presetStatusIndex: bigint
    /**
     * 변화 전 값
     */
    preChangeValue: bigint
    /**
     * 변화 후 값
     */
    postChangeValue: bigint
  }
  /**
   * 캐릭터 엔티티에 유닛 상태 효과 [이동 속도 모니터링]을 추가하며, 조건이 충족될 때 트리거되는 이벤트
   */
  whenCharacterMovementSpdMeetsCondition: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 유닛 상태 설정 ID
     */
    unitStatusConfigId: configId
    /**
     * 조건: 비교 타입
     */
    conditionComparisonType: ComparisonOperator
    /**
     * 조건: 비교 값
     */
    conditionComparisonValue: number
    /**
     * 현재 이동 속도
     */
    currentMovementSpd: number
  }
  /**
   * 엔티티가 생성될 때 트리거되는 이벤트. 모든 유형의 엔티티에서 이 이벤트를 트리거할 수 있다. 스테이지 엔티티, 캐릭터 엔티티, 플레이어 엔티티는 스테이지에 입장할 때 이 이벤트를 트리거한다.
   */
  whenEntityIsCreated: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
  }
  /**
   * 스테이지 내 오브젝트 및 피조물이 파괴될 때 트리거되는 이벤트. 이 이벤트는 스테이지 엔티티에서만 트리거된다.
   */
  whenEntityIsDestroyed: {
    /**
     * 이벤트 소스 엔티티: 파괴된 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 위치
     */
    location: vec3
    /**
     * 방향
     */
    orientation: vec3
    /**
     * 엔티티 타입
     */
    entityType: EntityType
    /**
     * 진영
     */
    faction: faction
    /**
     * 데미지 출처
     */
    damageSource: entity
    /**
     * 소유자 엔티티
     */
    ownerEntity: entity
    /**
     * 커스텀 변수 컴포넌트 스냅샷: 파괴 시 해당 엔티티의 커스텀 변수 컴포넌트 스냅샷. [커스텀 변수 스냅샷 조회] 노드를 사용해 커스텀 변수 값을 가져올 수 있다.
     */
    customVariableComponentSnapshot: customVariableSnapshot
  }
  /**
   * 스테이지 내 임의의 엔티티가 제거되거나 파괴될 때 트리거되는 이벤트. 스테이지 엔티티에서만 트리거된다. 엔티티가 파괴될 경우 [엔티티 파괴 시]와 [엔티티 제거/파괴 시] 이벤트가 순서대로 모두 트리거된다.
   */
  whenEntityIsRemovedDestroyed: {
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
  }
  /**
   * 엔티티의 진영이 변경될 때 트리거되는 이벤트
   */
  whenEntityFactionChanges: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 변화 전 진영
     */
    preChangeFaction: faction
    /**
     * 변화 후 진영
     */
    postChangeFaction: faction
  }
  /**
   * 캐릭터가 쓰러질 때 캐릭터 엔티티의 노드 그래프에서 트리거되는 이벤트
   */
  whenTheCharacterIsDown: {
    /**
     * 캐릭터 엔티티
     */
    characterEntity: entity
    /**
     * 원인: 노드 그래프 원인 (노드 그래프의 [엔티티 파괴] 노드로 인한 쓰러짐), 정상 쓰러짐 (HP가 0이 됨), 비정상 쓰러짐 (익사, 심연 추락 등)
     */
    reason: CauseOfBeingDown
    /**
     * 쓰러뜨린 엔티티
     */
    knockdownEntity: entity
  }
  /**
   * 캐릭터가 부활할 때 캐릭터 엔티티의 노드 그래프에서 트리거되는 이벤트
   */
  whenCharacterRevives: {
    /**
     * 캐릭터 엔티티
     */
    characterEntity: entity
  }
  /**
   * 플레이어가 텔레포트를 완료할 때 플레이어 엔티티의 노드 그래프에서 트리거되는 이벤트. 플레이어가 스테이지에 처음 입장할 때도 트리거된다.
   */
  whenPlayerTeleportCompletes: {
    /**
     * 플레이어 엔티티
     */
    playerEntity: entity
    /**
     * 플레이어 GUID
     */
    playerGuid: guid
  }
  /**
   * 플레이어의 모든 캐릭터 엔티티가 쓰러질 때 플레이어 엔티티의 노드 그래프에서 트리거되는 이벤트
   */
  whenAllPlayerSCharactersAreDown: {
    /**
     * 플레이어 엔티티
     */
    playerEntity: entity
    /**
     * 원인: 노드 그래프 원인 (노드 그래프의 [엔티티 파괴] 노드로 인한 쓰러짐), 정상 쓰러짐 (HP가 0이 됨), 비정상 쓰러짐 (익사, 심연 추락 등)
     */
    reason: CauseOfBeingDown
  }
  /**
   * 플레이어의 모든 캐릭터가 부활할 때 플레이어 엔티티의 노드 그래프에서 트리거되는 이벤트
   */
  whenAllPlayerSCharactersAreRevived: {
    /**
     * 플레이어 엔티티
     */
    playerEntity: entity
  }
  /**
   * 캐릭터가 익사, 심연 추락 등 비정상적인 원인으로 쓰러진 후 부활할 때 플레이어 엔티티에서 트리거되는 이벤트
   */
  whenPlayerIsAbnormallyDownedAndRevives: {
    /**
     * 플레이어 엔티티
     */
    playerEntity: entity
  }
  /**
   * 클래식 모드 전용. 활성 캐릭터가 변경될 때 플레이어 엔티티에서 트리거되는 이벤트
   */
  whenTheActiveCharacterChanges: {
    /**
     * 플레이어 엔티티
     */
    playerEntity: entity
    /**
     * 플레이어 GUID
     */
    playerGuid: guid
    /**
     * 교체된 이전 활성 캐릭터 엔티티
     */
    previousActiveCharacterEntity: entity
    /**
     * 현재 활성 캐릭터 엔티티
     */
    currentActiveCharacterEntity: entity
  }
  /**
   * 실행 중인 엔티티 A의 “충돌 트리거 소스” 범위가 다른 실행 중인 엔티티 B의 “충돌 트리거” 범위에 진입할 때 트리거되는 이벤트. “충돌 트리거”가 설정된 엔티티 B로 노드 그래프 이벤트가 전송된다.
   */
  whenEnteringCollisionTrigger: {
    /**
     * 진입 엔티티: 위에서 언급한 엔티티 A
     */
    enteringEntity: entity
    /**
     * 진입 엔티티 GUID
     */
    enteringEntityGuid: guid
    /**
     * 트리거 엔티티: 위에서 언급한 엔티티 B
     */
    triggerEntity: entity
    /**
     * 트리거 엔티티 GUID
     */
    triggerEntityGuid: guid
    /**
     * 트리거 번호: 엔티티 B의 충돌 트리거 컴포넌트에서 해당 번호에 대응하는 트리거
     */
    triggerId: bigint
  }
  /**
   * 실행 중인 엔티티 A의 “충돌 트리거 소스” 범위가 실행 중인 엔티티 B의 “충돌 트리거” 범위에서 벗어날 때 트리거되는 이벤트. “충돌 트리거”가 설정된 엔티티 B로 노드 그래프 이벤트가 전송된다.
   */
  whenExitingCollisionTrigger: {
    /**
     * 이탈 엔티티: 위에서 언급한 엔티티 A
     */
    exitingEntity: entity
    /**
     * 이탈 엔티티 GUID
     */
    exitingEntityGuid: guid
    /**
     * 트리거 엔티티: 위에서 언급한 엔티티 B
     */
    triggerEntity: entity
    /**
     * 트리거 엔티티 GUID
     */
    triggerEntityGuid: guid
    /**
     * 트리거 번호
     */
    triggerId: bigint
  }
  /**
   * 엔티티의 HP가 회복될 때 트리거되는 이벤트
   */
  whenHpIsRecovered: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 치료자 엔티티
     */
    healerEntity: entity
    /**
     * 회복량: 실제 회복량. 회복 전 HP 손실이 없었다면 0
     */
    recoveryAmount: number
    /**
     * 회복 태그 리스트
     */
    recoverTagList: string[]
  }
  /**
   * 엔티티가 다른 엔티티에게 HP를 회복시킬 때 발동 엔티티에서 트리거되는 이벤트
   */
  whenInitiatingHpRecovery: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 회복 대상 엔티티
     */
    recoverTargetEntity: entity
    /**
     * 회복량: 실제 회복량. 대상 엔티티가 회복 전 HP 손실이 없었다면 0
     */
    recoveryAmount: number
    /**
     * 회복 태그 리스트
     */
    recoverTagList: string[]
  }
  /**
   * 엔티티의 공격이 다른 엔티티에게 히트할 때 트리거되는 이벤트
   */
  whenAttackHits: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 피격 엔티티
     */
    hitTargetEntity: entity
    /**
     * 데미지량: 실제 가한 데미지량. 무적 등의 이유로 데미지를 주지 못했을 경우 0
     */
    damage: number
    /**
     * 공격 태그 리스트
     */
    attackTagList: string[]
    /**
     * 원소 타입
     */
    elementalType: ElementalType
    /**
     * 원소 공격 강도: 공격에 포함된 원소량
     */
    elementalAttackPotency: number
  }
  /**
   * 엔티티가 공격받을 때 트리거되는 이벤트
   */
  whenAttacked: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 공격자 엔티티
     */
    attackerEntity: entity
    /**
     * 데미지량: 실제 가한 데미지량. 무적 등의 이유로 데미지를 주지 못했을 경우 0
     */
    damage: number
    /**
     * 공격 태그 리스트
     */
    attackTagList: string[]
    /**
     * 원소 타입
     */
    elementalType: ElementalType
    /**
     * 원소 공격 강도: 공격에 포함된 원소량
     */
    elementalAttackPotency: number
  }
  /**
   * 엔티티가 공격을 받아 경직 상태에 돌입할 때 트리거되는 이벤트
   */
  whenEnteringAnInterruptibleState: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 공격자
     */
    attacker: entity
  }
  /**
   * 기본 모션 장치 컴포넌트의 특정 기본 모션 장치가 움직임을 완료하거나 비활성화될 때 컴포넌트 소유자에게 전송되는 이벤트
   */
  whenBasicMotionDeviceStops: {
    /**
     * 이벤트 소스 엔티티: 컴포넌트 소유자
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 모션 장치 이름
     */
    motionDeviceName: string
  }
  /**
   * 경로 모션 장치가 웨이포인트에 도달할 때 기본 모션 장치 컴포넌트 소유자에게 전송되는 이벤트. 웨이포인트 설정에서 “웨이포인트 도착 시 이벤트 전송”이 활성화된 경우에만 트리거된다.
   */
  whenPathReachesWaypoint: {
    /**
     * 이벤트 소스 엔티티: 컴포넌트 소유자
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 모션 장치 이름
     */
    motionDeviceName: string
    /**
     * 경로 포인트 번호
     */
    pathPointId: bigint
  }
  /**
   * 히트 감지 컴포넌트의 소유자가 다른 엔티티 또는 씬을 히트했을 때 트리거되는 이벤트
   */
  whenOnHitDetectionIsTriggered: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 허트박스 명중 여부: false이면 씬(환경)을 히트한 것이고, true이면 엔티티를 히트한 것. true일 때 [히트 엔티티] 출력 파라미터에서 값을 가져올 수 있다.
     */
    onHitHurtbox: boolean
    /**
     * 히트 엔티티: 허트박스를 히트했을 때만 유효
     */
    onHitEntity: entity
    /**
     * 히트 위치
     */
    onHitLocation: vec3
  }
  /**
   * 타이머가 지정된 시간 노드에 도달할 때 트리거되는 이벤트
   */
  whenTimerIsTriggered: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 타이머 이름
     */
    timerName: string
    /**
     * 타이머 시퀀스 번호
     */
    timerSequenceId: bigint
    /**
     * 루프 횟수
     */
    numberOfLoops: bigint
  }
  /**
   * 전역 카운트다운 타이머가 0에 도달할 때 트리거되는 이벤트. 전역 스톱워치 타이머는 이 이벤트를 트리거하지 않는다.
   */
  whenGlobalTimerIsTriggered: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 타이머 이름
     */
    timerName: string
  }
  /**
   * 인터랙티브 버튼 및 아이템 전시 타입의 UI 컨트롤만 이 이벤트를 트리거한다. 스테이지 실행 중 인터랙티브 버튼 또는 아이템 전시 UI 컨트롤로 만든 UI 컨트롤 그룹에 인터랙션이 실행되면 노드 그래프 이벤트 “UI 컨트롤 그룹 트리거 시”가 전송된다. 이 이벤트는 인터랙션을 발동한 플레이어의 노드 그래프에서만 수신할 수 있다.
   */
  whenUiControlGroupIsTriggered: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * UI 컨트롤 그룹 복합 인덱스: 이 이벤트를 트리거한 UI 컨트롤이 다른 컨트롤과 함께 다중 컨트롤 UI 컨트롤 그룹을 구성하고 있다면, 이 출력 파라미터에 해당 그룹 값이 반환된다.
     */
    uiControlGroupCompositeIndex: bigint
    /**
     * UI 컨트롤 그룹 인덱스: 트리거한 UI 컨트롤이 단일 컨트롤 그룹이면 해당 그룹의 인덱스, 다중 컨트롤 그룹이면 해당 컨트롤의 그룹 내 인덱스
     */
    uiControlGroupIndex: bigint
  }
  /**
   * 유닛 상태의 스택 수가 변경될 때 트리거되는 이벤트. 유닛 상태 효과가 적용되거나 제거될 때도 트리거된다.
   */
  whenUnitStatusChanges: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 유닛 상태 설정 ID
     */
    unitStatusConfigId: configId
    /**
     * 적용자 엔티티
     */
    applierEntity: entity
    /**
     * 지속 시간이 무한인지 여부
     */
    infiniteDuration: boolean
    /**
     * 상태 잔여 지속 시간
     */
    remainingStatusDuration: number
    /**
     * 상태 잔여 스택 수: 변경 후 스택 수
     */
    remainingStatusStacks: bigint
    /**
     * 상태 원래 스택 수: 변경 전 스택 수
     */
    originalStatusStacks: bigint
    /**
     * 슬롯 번호: 변경된 유닛 상태 슬롯의 번호
     */
    slotId: bigint
  }
  /**
   * 유닛 상태가 어떤 이유로든 제거되거나 런타임 지속 시간이 만료될 때 트리거되는 이벤트
   */
  whenUnitStatusEnds: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 유닛 상태 설정 ID
     */
    unitStatusConfigId: configId
    /**
     * 적용자 엔티티
     */
    applierEntity: entity
    /**
     * 지속 시간이 무한인지 여부
     */
    infiniteDuration: boolean
    /**
     * 상태 잔여 지속 시간
     */
    remainingStatusDuration: number
    /**
     * 상태 잔여 스택 수
     */
    remainingStatusStacks: bigint
    /**
     * 제거자 엔티티
     */
    removerEntity: entity
    /**
     * 제거 원인: 상태 대체 (다른 상태로 교체됨), 지속 시간 초과, 직접 해제, 상태 무효화 (기타 원인), 클래스 변경으로 인한 제거
     */
    removalReason: UnitStatusRemovalReason
    /**
     * 슬롯 번호: 변경된 유닛 상태 슬롯의 번호
     */
    slotId: bigint
  }
  /**
   * 엔티티에 유닛 상태 효과 [원소 반응 모니터링]을 추가하며, 조건이 충족될 때 트리거되는 이벤트
   */
  whenElementalReactionEventOccurs: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 원소 반응 타입
     */
    elementalReactionType: ElementalReactionType
    /**
     * 트리거 엔티티
     */
    triggererEntity: entity
    /**
     * 트리거 엔티티 GUID
     */
    triggererEntityGuid: guid
  }
  /**
   * 엔티티에 유닛 상태 효과 [방어막 추가]를 추가하며, 방어막이 데미지를 받을 때 트리거되는 이벤트
   */
  whenShieldIsAttacked: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 공격자 엔티티
     */
    attackerEntity: entity
    /**
     * 공격자 GUID
     */
    attackerGuid: guid
    /**
     * 유닛 상태 설정 ID
     */
    unitStatusConfigId: configId
    /**
     * 공격 전 스택 수
     */
    preAttackLayers: bigint
    /**
     * 공격 후 스택 수
     */
    postAttackLayers: bigint
    /**
     * 공격 전 이 유닛 상태의 방어막 수치
     */
    shieldValueOfThisUnitStatusBeforeAttack: number
    /**
     * 공격 후 이 유닛 상태의 방어막 수치
     */
    shieldValueOfThisUnitStatusAfterAttack: number
  }
  /**
   * 활성화된 탭이 선택되면 노드 그래프에 이벤트를 전송한다. 탭 컴포넌트가 설정된 엔티티의 노드 그래프가 이 이벤트를 수신한다
   */
  whenTabIsSelected: {
    /**
     * 이벤트 소스 엔티티: 탭 컴포넌트가 마운트된 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID: 탭 컴포넌트가 마운트된 엔티티의 GUID. 없으면 0을 출력
     */
    eventSourceGuid: guid
    /**
     * 탭 번호
     */
    tabId: bigint
    /**
     * 선택자 엔티티: 탭을 트리거한 캐릭터 엔티티
     */
    selectorEntity: entity
  }
  /**
   * 클래식 어그로 모드에서만 유효하며, 피조물이 전투에 진입할 때 트리거되는 이벤트
   */
  whenCreationEntersCombat: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
  }
  /**
   * 클래식 어그로 모드에서만 유효하며, 피조물이 전투에서 이탈할 때 트리거되는 이벤트
   */
  whenCreationLeavesCombat: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
  }
  /**
   * 플레이어의 클래스 레벨이 변경될 때 해당 플레이어에게 전송되는 이벤트. 해당 클래스의 노드 그래프에서 수신할 수 있다
   */
  whenPlayerClassLevelChanges: {
    /**
     * 이벤트 소스 엔티티: 효과가 적용된 플레이어 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 변경 전 레벨
     */
    preChangeLevel: bigint
    /**
     * 변경 후 레벨
     */
    postChangeLevel: bigint
  }
  /**
   * 플레이어의 클래스가 변경될 때 해당 플레이어에게 전송되는 이벤트. 변경된 새 클래스의 노드 그래프에서 수신할 수 있다
   */
  whenPlayerClassChanges: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 변경 전 클래스 설정 ID
     */
    preModificationClassConfigId: configId
    /**
     * 변경 후 클래스 설정 ID
     */
    postModificationConfigId: configId
  }
  /**
   * 플레이어의 클래스가 해제될 때 해당 플레이어에게 전송되는 이벤트. 이전 클래스의 노드 그래프에서 수신할 수 있다
   */
  whenPlayerClassIsRemoved: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 변경 전 클래스 설정 ID
     */
    preModificationClassConfigId: configId
    /**
     * 변경 후 클래스 설정 ID
     */
    postModificationConfigId: configId
  }
  /**
   * 스킬 노드 그래프의 [서버 노드 그래프 알림] 노드에 의해 트리거되는 이벤트. 문자열 값을 최대 3개까지 전달할 수 있다
   */
  whenSkillNodeIsCalled: {
    /**
     * 호출자 엔티티
     */
    callerEntity: entity
    /**
     * 호출자 GUID
     */
    callerGuid: guid
    /**
     * 파라미터 1
     */
    parameter1: string
    /**
     * 파라미터 2
     */
    parameter2: string
    /**
     * 파라미터 3
     */
    parameter3: string
  }
  /**
   * 커스텀 어그로 모드에서만 사용 가능하며, 어그로 대상이 변경될 때 트리거되는 이벤트. 전투 진입 및 이탈 시에도 트리거될 수 있다
   */
  whenAggroTargetChanges: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 변경 전 어그로 대상
     */
    preChangeAggroTarget: entity
    /**
     * 변경 후 어그로 대상
     */
    postChangeAggroTarget: entity
  }
  /**
   * 커스텀 어그로 모드에서만 사용 가능하며, 엔티티 자신이 전투에 진입할 때 트리거되는 이벤트
   */
  whenSelfEntersCombat: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
  }
  /**
   * 커스텀 어그로 모드에서만 사용 가능하며, 엔티티 자신이 전투에서 이탈할 때 트리거되는 이벤트
   */
  whenSelfLeavesCombat: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
  }
  /**
   * 시그널 매니저에 정의된 시그널 트리거 이벤트를 모니터링한다. 먼저 모니터링할 시그널 이름을 선택해야 한다
   */
  monitorSignal: {
    /**
     * 이벤트 소스 엔티티
     */
    eventSourceEntity: entity
    /**
     * 이벤트 소스 GUID
     */
    eventSourceGuid: guid
    /**
     * 시그널 소스 엔티티: [시그널 전송] 노드를 사용하여 이 시그널을 전송한 엔티티
     */
    signalSourceEntity: entity
  } & Record<string, any>
  /**
   * 플레이어가 덱 선택기 조작을 완료하거나 시간 제한으로 강제 닫힐 때 플레이어의 노드 그래프에서 트리거되는 이벤트. 출력 파라미터로 선택 결과와 완료 원인을 알 수 있다
   */
  whenDeckSelectorIsComplete: {
    /**
     * 대상 플레이어: 효과가 적용된 플레이어 엔티티
     */
    targetPlayer: entity
    /**
     * 선택 결과 목록: 완료 원인에 따라 유효한 선택 결과 또는 기본 선택 결과 목록이 반환된다. (플레이어 완료 / 전체 새로 고침 / 정량 새로 고침 / 시간 초과 / 수동 닫기 / 노드 그래프 닫기)
     */
    selectionResultList: bigint[]
    /**
     * 완료 원인: 6가지 열거형 — 플레이어 완료, 전체 새로 고침, 정량 새로 고침, 시간 초과 닫기, 수동 닫기, 노드 그래프 닫기
     */
    completionReason: SelectCompletionReason
    /**
     * 덱 선택기 인덱스: 참조된 덱 선택기의 인덱스
     */
    deckSelectorIndex: bigint
  }
  /**
   * 텍스트 버블 컴포넌트가 마운트된 엔티티에서만 수신 가능하며, 대화가 완료될 때 트리거되는 이벤트. 완료는 마지막 대화 줄의 재생이 끝난 시점을 의미한다
   */
  whenTextBubbleIsCompleted: {
    /**
     * 버블 소유자 엔티티: 텍스트 버블 컴포넌트가 마운트된 런타임 엔티티
     */
    bubbleOwnerEntity: entity
    /**
     * 캐릭터 엔티티: 현재 버블 대화의 대상 캐릭터
     */
    characterEntity: entity
    /**
     * 텍스트 버블 설정 ID: 현재 활성화된 텍스트 버블 설정 ID
     */
    textBubbleConfigurationId: configId
    /**
     * 텍스트 버블 완료 횟수: 현재 활성화된 텍스트 버블이 해당 대화 캐릭터에 대해 완전히 재생된 횟수
     */
    textBubbleCompletionCount: bigint
  }
  /**
   * 상점에서 인벤토리 아이템이 판매될 때 트리거되는 이벤트. 상점 컴포넌트의 소유자가 수신한다
   */
  whenSellingInventoryItemsInTheShop: {
    /**
     * 상점 소유자
     */
    shopOwner: entity
    /**
     * 상점 소유자 GUID
     */
    shopOwnerGuid: guid
    /**
     * 구매자 엔티티
     */
    buyerEntity: entity
    /**
     * 상점 번호
     */
    shopId: bigint
    /**
     * 아이템 설정 ID
     */
    itemConfigId: configId
    /**
     * 구매 수량
     */
    purchaseQuantity: bigint
  }
  /**
   * 상점에서 커스텀 아이템이 판매될 때 트리거되는 이벤트. 상점 컴포넌트의 소유자가 수신한다
   */
  whenCustomShopItemIsSold: {
    /**
     * 상점 소유자
     */
    shopOwner: entity
    /**
     * 상점 소유자 GUID
     */
    shopOwnerGuid: guid
    /**
     * 구매자 엔티티
     */
    buyerEntity: entity
    /**
     * 상점 번호
     */
    shopId: bigint
    /**
     * 상품 번호
     */
    shopItemId: bigint
    /**
     * 구매 수량
     */
    purchaseQuantity: bigint
  }
  /**
   * 상점이 아이템을 매입할 때 트리거되는 이벤트. 상점 컴포넌트의 소유자가 수신한다
   */
  whenSellingItemsToTheShop: {
    /**
     * 상점 소유자
     */
    shopOwner: entity
    /**
     * 상점 소유자 GUID
     */
    shopOwnerGuid: guid
    /**
     * 판매자 엔티티
     */
    sellerEntity: entity
    /**
     * 상점 번호
     */
    shopId: bigint
    /**
     * 매입 아이템 딕셔너리
     */
    purchaseItemDictionary: dict
  }
  /**
   * 장비가 장착될 때 트리거되는 이벤트. 장비 소유자가 수신한다. 아이템 노드 그래프에 설정해야 한다
   */
  whenEquipmentIsEquipped: {
    /**
     * 장비 소유자 엔티티
     */
    equipmentHolderEntity: entity
    /**
     * 장비 소유자 GUID
     */
    equipmentHolderGuid: guid
    /**
     * 장비 인덱스
     */
    equipmentIndex: bigint
  }
  /**
   * 장비가 해제될 때 트리거되는 이벤트. 장비 소유자가 수신한다. 아이템 노드 그래프에 설정해야 한다
   */
  whenEquipmentIsUnequipped: {
    /**
     * 장비 소유자 엔티티
     */
    equipmentOwnerEntity: entity
    /**
     * 장비 소유자 GUID
     */
    equipmentOwnerGuid: guid
    /**
     * 장비 인덱스
     */
    equipmentIndex: bigint
  }
  /**
   * 장비가 처음 획득되어 인벤토리에 들어올 때 초기화된다. 이 이벤트의 출력 파라미터로 장비 인스턴스의 고유 인덱스가 반환되며, 이 인덱스를 사용해 장비를 동적으로 수정할 수 있다. 장비 소유자가 수신한다. 아이템 노드 그래프에 설정해야 한다
   */
  whenEquipmentIsInitialized: {
    /**
     * 장비 소유자
     */
    equipmentOwner: entity
    /**
     * 장비 소유자 GUID
     */
    equipmentOwnerGuid: guid
    /**
     * 장비 인덱스
     */
    equipmentIndex: bigint
  }
  /**
   * 장비 어픽스 수치가 변경될 때 트리거되는 이벤트. 장비 소유자가 수신한다. 아이템 노드 그래프에 설정해야 한다
   */
  whenEquipmentAffixValueChanges: {
    /**
     * 장비 소유자
     */
    equipmentOwner: entity
    /**
     * 장비 소유자 GUID
     */
    equipmentOwnerGuid: guid
    /**
     * 장비 인덱스
     */
    equipmentIndex: bigint
    /**
     * 어픽스 번호: 장비 어픽스 목록에서 이 항목의 번호
     */
    affixId: bigint
    /**
     * 변경 전 수치
     */
    preChangeValue: number
    /**
     * 변경 후 수치
     */
    postChangeValue: number
  }
  /**
   * 인벤토리에서 아이템이 제거될 때 (수량이 0이 될 때) 트리거되는 이벤트. 인벤토리 컴포넌트 소유자가 수신한다
   */
  whenItemIsLostFromInventory: {
    /**
     * 아이템 소유자 엔티티
     */
    itemOwnerEntity: entity
    /**
     * 아이템 소유자 GUID
     */
    itemOwnerGuid: guid
    /**
     * 아이템 설정 ID
     */
    itemConfigId: configId
    /**
     * 잃은 수량
     */
    quantityLost: bigint
  }
  /**
   * 인벤토리의 아이템 수량이 변경될 때 트리거되는 이벤트. 인벤토리 컴포넌트 소유자가 수신한다
   */
  whenTheQuantityOfInventoryItemChanges: {
    /**
     * 아이템 소유자 엔티티
     */
    itemOwnerEntity: entity
    /**
     * 아이템 소유자 GUID
     */
    itemOwnerGuid: guid
    /**
     * 아이템 설정 ID
     */
    itemConfigId: configId
    /**
     * 변경 전 수량
     */
    preChangeQuantity: bigint
    /**
     * 변경 후 수량
     */
    postChangeQuantity: bigint
    /**
     * 변경 원인
     */
    reasonForChange: ReasonForItemChange
  }
  /**
   * 인벤토리에 새 아이템이 추가될 때 트리거되는 이벤트. 인벤토리 컴포넌트 소유자가 수신한다. 수량만 변경되는 경우에는 트리거되지 않는다
   */
  whenItemIsAddedToInventory: {
    /**
     * 아이템 소유자 엔티티
     */
    itemOwnerEntity: entity
    /**
     * 아이템 소유자 GUID
     */
    itemOwnerGuid: guid
    /**
     * 아이템 설정 ID
     */
    itemConfigId: configId
    /**
     * 획득 수량
     */
    quantityObtained: bigint
  }
  /**
   * 인벤토리 화폐 수량이 변경될 때 트리거되는 이벤트. 인벤토리 컴포넌트 소유자가 수신한다
   */
  whenTheQuantityOfInventoryCurrencyChanges: {
    /**
     * 화폐 소유자 엔티티
     */
    currencyOwnerEntity: entity
    /**
     * 화폐 소유자 GUID
     */
    currencyOwnerGuid: guid
    /**
     * 화폐 설정 ID
     */
    currencyConfigId: configId
    /**
     * 화폐 변화량
     */
    currencyChangeValue: bigint
  }
  /**
   * 인벤토리의 아이템이 사용될 때 트리거되는 이벤트. 인벤토리 컴포넌트 소유자가 수신한다
   */
  whenItemsInTheInventoryAreUsed: {
    /**
     * 아이템 소유자 엔티티
     */
    itemOwnerEntity: entity
    /**
     * 아이템 소유자 GUID
     */
    itemOwnerGuid: guid
    /**
     * 아이템 설정 ID
     */
    itemConfigId: configId
    /**
     * 사용 수량
     */
    amountToUse: bigint
  }
  /**
   * 순찰 템플릿의 웨이포인트에 [도착 시 노드 그래프 이벤트 전송] 옵션이 활성화된 경우, 조건이 충족되면 노드 그래프 이벤트가 트리거된다. 이 이벤트는 피조물의 노드 그래프에서만 수신할 수 있다
   */
  whenCreationReachesPatrolWaypoint: {
    /**
     * 피조물 엔티티: 런타임 피조물 엔티티
     */
    creationEntity: entity
    /**
     * 피조물 GUID: 피조물의 GUID. 초기 배치된 피조물이 아닌 경우 빈 값으로 출력된다
     */
    creationGuid: guid
    /**
     * 현재 순찰 템플릿 번호: 피조물에 현재 적용 중인 순찰 템플릿 번호
     */
    currentPatrolTemplateId: bigint
    /**
     * 현재 경로 인덱스: 피조물의 현재 순찰 템플릿이 참조하는 경로 인덱스
     */
    currentPathIndex: bigint
    /**
     * 현재 도착 웨이포인트 번호: 피조물이 현재 도달한 웨이포인트 번호
     */
    currentReachedWaypointId: bigint
    /**
     * 다음 웨이포인트 번호: 피조물이 다음으로 이동할 웨이포인트 번호
     */
    nextWaypointId: bigint
  }
  // === AUTO-GENERATED END ===
}
