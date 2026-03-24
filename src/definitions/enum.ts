import { SimplifyDeep } from 'type-fest'

import { enumeration } from '../runtime/value.js'

export type EnumerationType = SimplifyDeep<keyof EnumerationTypeMap>
export type EnumerationTypeMap = {
  ComparisonOperator: ComparisonOperator
  SortBy: SortBy
  DamagePopUpType: DamagePopUpType
  MovementMode: MovementMode
  FixedMotionParameterType: FixedMotionParameterType
  FollowCoordinateSystem: FollowCoordinateSystem
  FollowLocationType: FollowLocationType
  RemovalMethod: RemovalMethod
  UIControlGroupStatus: UIControlGroupStatus
  DisruptorDeviceType: DisruptorDeviceType
  DisruptorDeviceOrientation: DisruptorDeviceOrientation
  CharacterSkillSlot: CharacterSkillSlot
  SoundAttenuationMode: SoundAttenuationMode
  LogicalOperator: LogicalOperator
  MathematicalOperator: MathematicalOperator
  TrigonometricFunction: TrigonometricFunction
  AttackShape: AttackShape
  SurvivalStatus: SurvivalStatus
  TypeConversion: TypeConversion
  MotionPathPointType: MotionPathPointType
  MotionType: MotionType
  DecisionRefreshMode: DecisionRefreshMode
  SettlementStatus: SettlementStatus
  ItemLootType: ItemLootType
  ScanRuleType: ScanRuleType
  RoundingMode: RoundingMode
  EntityType: EntityType
  CauseOfBeingDown: CauseOfBeingDown
  ElementalType: ElementalType
  TargetType: TargetType
  TriggerRestriction: TriggerRestriction
  HitType: HitType
  AttackType: AttackType
  HitPerformanceLevel: HitPerformanceLevel
  UnitStatusAdditionResult: UnitStatusAdditionResult
  UnitStatusRemovalStrategy: UnitStatusRemovalStrategy
  RevivePointSelectionStrategy: RevivePointSelectionStrategy
  InterruptStatus: InterruptStatus
  GameplayMode: GameplayMode
  InputDeviceType: InputDeviceType
  UnitStatusRemovalReason: UnitStatusRemovalReason
  ElementalReactionType: ElementalReactionType
  SelectCompletionReason: SelectCompletionReason
  ReasonForItemChange: ReasonForItemChange
}

/** 정렬 기준 */
export class SortBy extends enumeration {
  declare private readonly __brandSortBy: 'SortBy'
  private constructor() {
    super('')
    // 防止用户通过字符串传参构造枚举导致的意外行为
    throw new Error('you should not create an enum instance')
  }

  /**
   * 오름차순 (작은 값에서 큰 값 순)
   */
  static readonly Ascending = new enumeration('SortBy', 'sort_by_ascending') as SortBy
  /**
   * 내림차순 (큰 값에서 작은 값 순)
   */
  static readonly Descending = new enumeration('SortBy', 'sort_by_descending') as SortBy
}

/** 데미지 팝업 타입 */
export class DamagePopUpType extends enumeration {
  declare private readonly __brandDamagePopUpType: 'DamagePopUpType'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 팝업 없음
   */
  static readonly NoPopUp = new enumeration(
    'DamagePopUpType',
    'damage_pop_up_type_no_pop_up'
  ) as DamagePopUpType
  /**
   * 일반 팝업
   */
  static readonly NormalPopUp = new enumeration(
    'DamagePopUpType',
    'damage_pop_up_type_normal_pop_up'
  ) as DamagePopUpType
  /**
   * 치명타 팝업
   */
  static readonly CritHitPopUp = new enumeration(
    'DamagePopUpType',
    'damage_pop_up_type_crit_hit_pop_up'
  ) as DamagePopUpType
}

/** 이동 방식 */
export class MovementMode extends enumeration {
  declare private readonly __brandMovementMode: 'MovementMode'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 순간 이동
   */
  static readonly InstantMovement = new enumeration(
    'MovementMode',
    'movement_mode_instant_movement'
  ) as MovementMode
  /**
   * 등속 직선 운동
   */
  static readonly UniformLinearMotion = new enumeration(
    'MovementMode',
    'movement_mode_uniform_linear_motion'
  ) as MovementMode
}

/** 고정 모션 파라미터 타입 */
export class FixedMotionParameterType extends enumeration {
  declare private readonly __brandFixedMotionParameterType: 'FixedMotionParameterType'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 고정 속도
   */
  static readonly FixedSpeed = new enumeration(
    'FixedMotionParameterType',
    'fixed_motion_parameter_type_fixed_speed'
  ) as FixedMotionParameterType
  /**
   * 고정 시간
   */
  static readonly FixedTime = new enumeration(
    'FixedMotionParameterType',
    'fixed_motion_parameter_type_fixed_time'
  ) as FixedMotionParameterType
}

/** 추적 좌표계 */
export class FollowCoordinateSystem extends enumeration {
  declare private readonly __brandFollowCoordinateSystem: 'FollowCoordinateSystem'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 상대 좌표계
   */
  static readonly RelativeCoordinateSystem = new enumeration(
    'FollowCoordinateSystem',
    'follow_coordinate_system_relative_coordinate_system'
  ) as FollowCoordinateSystem
  /**
   * 월드 좌표계
   */
  static readonly WorldCoordinateSystem = new enumeration(
    'FollowCoordinateSystem',
    'follow_coordinate_system_world_coordinate_system'
  ) as FollowCoordinateSystem
}

/** 추적 타입 */
export class FollowLocationType extends enumeration {
  declare private readonly __brandFollowLocationType: 'FollowLocationType'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 완전 추적
   */
  static readonly CompletelyFollow = new enumeration(
    'FollowLocationType',
    'follow_location_type_completely_follow'
  ) as FollowLocationType
  /**
   * 위치 추적
   */
  static readonly FollowLocation = new enumeration(
    'FollowLocationType',
    'follow_location_type_follow_location'
  ) as FollowLocationType
  /**
   * 회전 추적
   */
  static readonly FollowRotation = new enumeration(
    'FollowLocationType',
    'follow_location_type_follow_rotation'
  ) as FollowLocationType
}

/** 제거 방식 */
export class RemovalMethod extends enumeration {
  declare private readonly __brandRemovalMethod: 'RemovalMethod'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 동일 이름의 모든 공존 상태
   */
  static readonly AllCoexistingStatusesWithTheSameName = new enumeration(
    'RemovalMethod',
    'removal_method_all_coexisting_statuses_with_the_same_name'
  ) as RemovalMethod
  /**
   * 가장 빨리 스택을 잃는 상태
   */
  static readonly StatusWithFastestStackLoss = new enumeration(
    'RemovalMethod',
    'removal_method_status_with_fastest_stack_loss'
  ) as RemovalMethod
}

/** UI 컨트롤 그룹 상태 */
export class UIControlGroupStatus extends enumeration {
  declare private readonly __brandUIControlGroupStatus: 'UIControlGroupStatus'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 꺼짐: 보이지 않으며 로직도 실행되지 않음
   */
  static readonly Off = new enumeration(
    'UIControlGroupStatus',
    'ui_control_group_status_off'
  ) as UIControlGroupStatus
  /**
   * 켜짐: 표시되며 로직도 정상 실행됨
   */
  static readonly On = new enumeration(
    'UIControlGroupStatus',
    'ui_control_group_status_on'
  ) as UIControlGroupStatus
  /**
   * 숨김: 보이지 않지만 로직은 정상 실행됨
   */
  static readonly Hidden = new enumeration(
    'UIControlGroupStatus',
    'ui_control_group_status_hidden'
  ) as UIControlGroupStatus
}

/** 방해 장치 타입 */
export class DisruptorDeviceType extends enumeration {
  declare private readonly __brandDisruptorDeviceType: 'DisruptorDeviceType'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 포스 필드 장치
   */
  static readonly ForceFieldDevice = new enumeration(
    'DisruptorDeviceType',
    'disruptor_device_type_force_field_device'
  ) as DisruptorDeviceType
  /**
   * 발사 장치
   */
  static readonly Ejector = new enumeration(
    'DisruptorDeviceType',
    'disruptor_device_type_ejector'
  ) as DisruptorDeviceType
  /**
   * 견인 장치
   */
  static readonly TractorDevice = new enumeration(
    'DisruptorDeviceType',
    'disruptor_device_type_tractor_device'
  ) as DisruptorDeviceType
}

/** 방해 장치 방향 */
export class DisruptorDeviceOrientation extends enumeration {
  declare private readonly __brandDisruptorDeviceOrientation: 'DisruptorDeviceOrientation'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 연결된 캐릭터 방향을 따름
   */
  static readonly AssociateCharacterOrientation = new enumeration(
    'DisruptorDeviceOrientation',
    'disruptor_device_orientation_associate_character_orientation'
  ) as DisruptorDeviceOrientation
  /**
   * 고정 단방향
   */
  static readonly FixedUnidirectional = new enumeration(
    'DisruptorDeviceOrientation',
    'disruptor_device_orientation_fixed_unidirectional'
  ) as DisruptorDeviceOrientation
}

/** 스킬 슬롯 */
export class CharacterSkillSlot extends enumeration {
  declare private readonly __brandCharacterSkillSlot: 'CharacterSkillSlot'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 일반 공격
   */
  static readonly NormalAttack = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_normal_attack'
  ) as CharacterSkillSlot
  /**
   * 스킬 1 (E)
   */
  static readonly Skill1E = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_skill_1_e'
  ) as CharacterSkillSlot
  /**
   * 스킬 2 (Q)
   */
  static readonly Skill2Q = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_skill_2_q'
  ) as CharacterSkillSlot
  /**
   * 스킬 3 (R)
   */
  static readonly Skill3R = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_skill_3_r'
  ) as CharacterSkillSlot
  /**
   * 스킬 4 (T)
   */
  static readonly Skill4T = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_skill_4_t'
  ) as CharacterSkillSlot
  /**
   * 커스텀 스킬 슬롯 1
   */
  static readonly CustomSkillSlot1 = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_custom_skill_slot_1'
  ) as CharacterSkillSlot
  /**
   * 커스텀 스킬 슬롯 2
   */
  static readonly CustomSkillSlot2 = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_custom_skill_slot_2'
  ) as CharacterSkillSlot
  /**
   * 커스텀 스킬 슬롯 3
   */
  static readonly CustomSkillSlot3 = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_custom_skill_slot_3'
  ) as CharacterSkillSlot
  /**
   * 커스텀 스킬 슬롯 4
   */
  static readonly CustomSkillSlot4 = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_custom_skill_slot_4'
  ) as CharacterSkillSlot
  /**
   * 커스텀 스킬 슬롯 5
   */
  static readonly CustomSkillSlot5 = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_custom_skill_slot_5'
  ) as CharacterSkillSlot
  /**
   * 커스텀 스킬 슬롯 6
   */
  static readonly CustomSkillSlot6 = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_custom_skill_slot_6'
  ) as CharacterSkillSlot
  /**
   * 커스텀 스킬 슬롯 7
   */
  static readonly CustomSkillSlot7 = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_custom_skill_slot_7'
  ) as CharacterSkillSlot
  /**
   * 커스텀 스킬 슬롯 8
   */
  static readonly CustomSkillSlot8 = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_custom_skill_slot_8'
  ) as CharacterSkillSlot
  /**
   * 커스텀 스킬 슬롯 9
   */
  static readonly CustomSkillSlot9 = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_custom_skill_slot_9'
  ) as CharacterSkillSlot
  /**
   * 커스텀 스킬 슬롯 10
   */
  static readonly CustomSkillSlot10 = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_custom_skill_slot_10'
  ) as CharacterSkillSlot
  /**
   * 커스텀 스킬 슬롯 11
   */
  static readonly CustomSkillSlot11 = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_custom_skill_slot_11'
  ) as CharacterSkillSlot
  /**
   * 커스텀 스킬 슬롯 12
   */
  static readonly CustomSkillSlot12 = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_custom_skill_slot_12'
  ) as CharacterSkillSlot
  /**
   * 커스텀 스킬 슬롯 13
   */
  static readonly CustomSkillSlot13 = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_custom_skill_slot_13'
  ) as CharacterSkillSlot
  /**
   * 커스텀 스킬 슬롯 14
   */
  static readonly CustomSkillSlot14 = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_custom_skill_slot_14'
  ) as CharacterSkillSlot
  /**
   * 커스텀 스킬 슬롯 15
   */
  static readonly CustomSkillSlot15 = new enumeration(
    'CharacterSkillSlot',
    'character_skill_slot_custom_skill_slot_15'
  ) as CharacterSkillSlot
}

/** 사운드 감쇠 방식 */
export class SoundAttenuationMode extends enumeration {
  declare private readonly __brandSoundAttenuationMode: 'SoundAttenuationMode'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 선형 감쇠
   */
  static readonly LinearAttenuation = new enumeration(
    'SoundAttenuationMode',
    'sound_attenuation_mode_linear_attenuation'
  ) as SoundAttenuationMode
  /**
   * 빠르다가 느려짐
   */
  static readonly FastThenSlow = new enumeration(
    'SoundAttenuationMode',
    'sound_attenuation_mode_fast_then_slow'
  ) as SoundAttenuationMode
  /**
   * 느리다가 빨라짐
   */
  static readonly SlowThenFast = new enumeration(
    'SoundAttenuationMode',
    'sound_attenuation_mode_slow_then_fast'
  ) as SoundAttenuationMode
}

/** 논리 연산자 */
export class LogicalOperator extends enumeration {
  declare private readonly __brandLogicalOperator: 'LogicalOperator'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * AND (논리곱)
   */
  static readonly AND = new enumeration(
    'LogicalOperator',
    'logical_operator_and'
  ) as LogicalOperator
  /**
   * OR (논리합)
   */
  static readonly OR = new enumeration('LogicalOperator', 'logical_operator_or') as LogicalOperator
  /**
   * XOR (배타적 논리합)
   */
  static readonly XOR = new enumeration(
    'LogicalOperator',
    'logical_operator_xor'
  ) as LogicalOperator
  /**
   * NOT (논리 부정)
   */
  static readonly NOT = new enumeration(
    'LogicalOperator',
    'logical_operator_not'
  ) as LogicalOperator
}

/** 수학 연산자 */
export class MathematicalOperator extends enumeration {
  declare private readonly __brandMathematicalOperator: 'MathematicalOperator'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 덧셈
   */
  static readonly Addition = new enumeration(
    'MathematicalOperator',
    'mathematical_operator_addition'
  ) as MathematicalOperator
  /**
   * 뺄셈
   */
  static readonly Subtraction = new enumeration(
    'MathematicalOperator',
    'mathematical_operator_subtraction'
  ) as MathematicalOperator
  /**
   * 곱셈
   */
  static readonly Multiplication = new enumeration(
    'MathematicalOperator',
    'mathematical_operator_multiplication'
  ) as MathematicalOperator
  /**
   * 나눗셈
   */
  static readonly Division = new enumeration(
    'MathematicalOperator',
    'mathematical_operator_division'
  ) as MathematicalOperator
  /**
   * 나머지 연산
   */
  static readonly ModuloOperation = new enumeration(
    'MathematicalOperator',
    'mathematical_operator_modulo_operation'
  ) as MathematicalOperator
  /**
   * 거듭제곱
   */
  static readonly Exponentiation = new enumeration(
    'MathematicalOperator',
    'mathematical_operator_exponentiation'
  ) as MathematicalOperator
  /**
   * 최대값 반환
   */
  static readonly GetMaximumValue = new enumeration(
    'MathematicalOperator',
    'mathematical_operator_get_maximum_value'
  ) as MathematicalOperator
  /**
   * 최소값 반환
   */
  static readonly GetMinimumValue = new enumeration(
    'MathematicalOperator',
    'mathematical_operator_get_minimum_value'
  ) as MathematicalOperator
  /**
   * 로그
   */
  static readonly Logarithm = new enumeration(
    'MathematicalOperator',
    'mathematical_operator_logarithm'
  ) as MathematicalOperator
}

/** 삼각 함수 */
export class TrigonometricFunction extends enumeration {
  declare private readonly __brandTrigonometricFunction: 'TrigonometricFunction'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 코사인
   */
  static readonly Cos = new enumeration(
    'TrigonometricFunction',
    'trigonometric_function_cos'
  ) as TrigonometricFunction
  /**
   * 사인
   */
  static readonly Sin = new enumeration(
    'TrigonometricFunction',
    'trigonometric_function_sin'
  ) as TrigonometricFunction
  /**
   * 탄젠트
   */
  static readonly Tan = new enumeration(
    'TrigonometricFunction',
    'trigonometric_function_tan'
  ) as TrigonometricFunction
  /**
   * 아크코사인
   */
  static readonly Arccos = new enumeration(
    'TrigonometricFunction',
    'trigonometric_function_arccos'
  ) as TrigonometricFunction
  /**
   * 아크사인
   */
  static readonly Arcsin = new enumeration(
    'TrigonometricFunction',
    'trigonometric_function_arcsin'
  ) as TrigonometricFunction
  /**
   * 아크탄젠트
   */
  static readonly Arctan = new enumeration(
    'TrigonometricFunction',
    'trigonometric_function_arctan'
  ) as TrigonometricFunction
  /**
   * 라디안을 도(degree)로 변환
   */
  static readonly RadiansToDegrees = new enumeration(
    'TrigonometricFunction',
    'trigonometric_function_radians_to_degrees'
  ) as TrigonometricFunction
  /**
   * 도(degree)를 라디안으로 변환
   */
  static readonly DegreesToRadians = new enumeration(
    'TrigonometricFunction',
    'trigonometric_function_degrees_to_radians'
  ) as TrigonometricFunction
}

/** 공격 범위 형태 */
export class AttackShape extends enumeration {
  declare private readonly __brandAttackShape: 'AttackShape'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 직사각형
   */
  static readonly Rectangle = new enumeration(
    'AttackShape',
    'attack_shape_rectangle'
  ) as AttackShape
  /**
   * 구체
   */
  static readonly Sphere = new enumeration('AttackShape', 'attack_shape_sphere') as AttackShape
  /**
   * 부채꼴
   */
  static readonly Sector = new enumeration('AttackShape', 'attack_shape_sector') as AttackShape
}

/** 생존 상태 */
export class SurvivalStatus extends enumeration {
  declare private readonly __brandSurvivalStatus: 'SurvivalStatus'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 생존
   */
  static readonly Alive = new enumeration(
    'SurvivalStatus',
    'survival_status_alive'
  ) as SurvivalStatus
  /**
   * 쓰러짐
   */
  static readonly Down = new enumeration('SurvivalStatus', 'survival_status_down') as SurvivalStatus
}

/** 타입 변환 */
export class TypeConversion extends enumeration {
  declare private readonly __brandTypeConversion: 'TypeConversion'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 정수 → 불리언
   */
  static readonly IntegerToBoolean = new enumeration(
    'TypeConversion',
    'type_conversion_integer_to_boolean'
  ) as TypeConversion
  /**
   * 정수 → 부동소수점
   */
  static readonly IntegerToFloatingPoint = new enumeration(
    'TypeConversion',
    'type_conversion_integer_to_floating_point'
  ) as TypeConversion
  /**
   * 정수 → 문자열
   */
  static readonly IntegerToString = new enumeration(
    'TypeConversion',
    'type_conversion_integer_to_string'
  ) as TypeConversion
  /**
   * 엔티티 → 문자열
   */
  static readonly EntityToString = new enumeration(
    'TypeConversion',
    'type_conversion_entity_to_string'
  ) as TypeConversion
  /**
   * GUID → 문자열
   */
  static readonly GuidToString = new enumeration(
    'TypeConversion',
    'type_conversion_guid_to_string'
  ) as TypeConversion
  /**
   * 불리언 → 정수
   */
  static readonly BooleanToInteger = new enumeration(
    'TypeConversion',
    'type_conversion_boolean_to_integer'
  ) as TypeConversion
  /**
   * 불리언 → 문자열
   */
  static readonly BooleanToString = new enumeration(
    'TypeConversion',
    'type_conversion_boolean_to_string'
  ) as TypeConversion
  /**
   * 부동소수점 → 정수
   */
  static readonly FloatingPointToInteger = new enumeration(
    'TypeConversion',
    'type_conversion_floating_point_to_integer'
  ) as TypeConversion
  /**
   * 부동소수점 → 문자열
   */
  static readonly FloatingPointToString = new enumeration(
    'TypeConversion',
    'type_conversion_floating_point_to_string'
  ) as TypeConversion
  /**
   * Vector3 → 문자열
   */
  static readonly Vector3ToString = new enumeration(
    'TypeConversion',
    'type_conversion_vector_3_to_string'
  ) as TypeConversion
  /**
   * 진영 → 문자열
   */
  static readonly FactionToString = new enumeration(
    'TypeConversion',
    'type_conversion_faction_to_string'
  ) as TypeConversion
}

/** 모션 경로 포인트 타입 */
export class MotionPathPointType extends enumeration {
  declare private readonly __brandMotionPathPointType: 'MotionPathPointType'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 직선 포인트
   */
  static readonly StraightLine = new enumeration(
    'MotionPathPointType',
    'motion_path_point_type_straight_line'
  ) as MotionPathPointType
  /**
   * 곡선 포인트
   */
  static readonly Curve = new enumeration(
    'MotionPathPointType',
    'motion_path_point_type_curve'
  ) as MotionPathPointType
}

/** 모션 타입 */
export class MotionType extends enumeration {
  declare private readonly __brandMotionType: 'MotionType'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 단방향
   */
  static readonly OneWay = new enumeration('MotionType', 'motion_type_one_way') as MotionType
  /**
   * 왕복
   */
  static readonly BackAndForth = new enumeration(
    'MotionType',
    'motion_type_back_and_forth'
  ) as MotionType
  /**
   * 순환 이동
   */
  static readonly CyclicMovement = new enumeration(
    'MotionType',
    'motion_type_cyclic_movement'
  ) as MotionType
}

/** 결정 갱신 방식 */
export class DecisionRefreshMode extends enumeration {
  declare private readonly __brandDecisionRefreshMode: 'DecisionRefreshMode'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 갱신 불가
   */
  static readonly CannotRefresh = new enumeration(
    'DecisionRefreshMode',
    'decision_refresh_mode_cannot_refresh'
  ) as DecisionRefreshMode
  /**
   * 부분 갱신
   */
  static readonly PartialRefresh = new enumeration(
    'DecisionRefreshMode',
    'decision_refresh_mode_partial_refresh'
  ) as DecisionRefreshMode
  /**
   * 전체 갱신
   */
  static readonly RefreshAll = new enumeration(
    'DecisionRefreshMode',
    'decision_refresh_mode_refresh_all'
  ) as DecisionRefreshMode
}

/** 정산 상태 */
export class SettlementStatus extends enumeration {
  declare private readonly __brandSettlementStatus: 'SettlementStatus'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 미정
   */
  static readonly Undefined = new enumeration(
    'SettlementStatus',
    'settlement_status_undefined'
  ) as SettlementStatus
  /**
   * 승리
   */
  static readonly Victory = new enumeration(
    'SettlementStatus',
    'settlement_status_victory'
  ) as SettlementStatus
  /**
   * 패배
   */
  static readonly Defeat = new enumeration(
    'SettlementStatus',
    'settlement_status_defeat'
  ) as SettlementStatus
}

/** 아이템 드롭 타입 */
export class ItemLootType extends enumeration {
  declare private readonly __brandItemLootType: 'ItemLootType'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 모든 플레이어 공유 보상
   */
  static readonly SharedReward = new enumeration(
    'ItemLootType',
    'item_loot_type_shared_reward'
  ) as ItemLootType
  /**
   * 플레이어별 개별 보상
   */
  static readonly IndividualizedReward = new enumeration(
    'ItemLootType',
    'item_loot_type_individualized_reward'
  ) as ItemLootType
}

/** 스캔 규칙 타입 */
export class ScanRuleType extends enumeration {
  declare private readonly __brandScanRuleType: 'ScanRuleType'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 시야 우선
   */
  static readonly PrioritizeView = new enumeration(
    'ScanRuleType',
    'scan_rule_type_prioritize_view'
  ) as ScanRuleType
  /**
   * 거리 우선
   */
  static readonly PrioritizeDistance = new enumeration(
    'ScanRuleType',
    'scan_rule_type_prioritize_distance'
  ) as ScanRuleType
}

/** 반올림 방식 */
export class RoundingMode extends enumeration {
  declare private readonly __brandRoundingMode: 'RoundingMode'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 반올림: 표준 규칙에 따라 가장 가까운 정수로 반올림
   */
  static readonly RoundToNearest = new enumeration(
    'RoundingMode',
    'rounding_mode_round_to_nearest'
  ) as RoundingMode
  /**
   * 올림: 입력값보다 크면서 가장 가까운 정수를 반환. 예: 1.2 → 2, −2.3 → −2
   */
  static readonly RoundUp = new enumeration(
    'RoundingMode',
    'rounding_mode_round_up'
  ) as RoundingMode
  /**
   * 내림: 입력값보다 작으면서 가장 가까운 정수를 반환. 예: 1.2 → 1, −2.3 → −3
   */
  static readonly RoundDown = new enumeration(
    'RoundingMode',
    'rounding_mode_round_down'
  ) as RoundingMode
  /**
   * 버림: 소수 부분을 제거 (0 방향으로 반올림). 예: 1.2 → 1, −2.3 → −2
   */
  static readonly Truncate = new enumeration(
    'RoundingMode',
    'rounding_mode_truncate'
  ) as RoundingMode
}

/** 엔티티 타입 */
export class EntityType extends enumeration {
  declare private readonly __brandEntityType: 'EntityType'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 스테이지
   */
  static readonly Stage = new enumeration('EntityType', 'entity_type_stage') as EntityType
  /**
   * 오브젝트
   */
  static readonly Object = new enumeration('EntityType', 'entity_type_object') as EntityType
  /**
   * 플레이어
   */
  static readonly Player = new enumeration('EntityType', 'entity_type_player') as EntityType
  /**
   * 캐릭터
   */
  static readonly Character = new enumeration('EntityType', 'entity_type_character') as EntityType
  /**
   * 피조물
   */
  static readonly Creation = new enumeration('EntityType', 'entity_type_creation') as EntityType
}

/** 비교 연산자 */
export class ComparisonOperator extends enumeration {
  declare private readonly __brandComparisonOperator: 'ComparisonOperator'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * == (같음)
   */
  static readonly EqualTo = new enumeration(
    'ComparisonOperator',
    'comparison_operator_equal_to'
  ) as ComparisonOperator
  /**
   * < (미만)
   */
  static readonly LessThan = new enumeration(
    'ComparisonOperator',
    'comparison_operator_less_than'
  ) as ComparisonOperator
  /**
   * <= (이하)
   */
  static readonly LessThanOrEqualTo = new enumeration(
    'ComparisonOperator',
    'comparison_operator_less_than_or_equal_to'
  ) as ComparisonOperator
  /**
   * > (초과)
   */
  static readonly GreaterThan = new enumeration(
    'ComparisonOperator',
    'comparison_operator_greater_than'
  ) as ComparisonOperator
  /**
   * >= (이상)
   */
  static readonly GreaterThanOrEqualTo = new enumeration(
    'ComparisonOperator',
    'comparison_operator_greater_than_or_equal_to'
  ) as ComparisonOperator
}

/** 쓰러진 원인 */
export class CauseOfBeingDown extends enumeration {
  declare private readonly __brandCauseOfBeingDown: 'CauseOfBeingDown'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 노드 그래프에 의해 발생: 노드 그래프의 [엔티티 제거] 노드로 인한 쓰러짐
   */
  static readonly NodeGraphTriggered = new enumeration(
    'CauseOfBeingDown',
    'cause_of_being_down_node_graph_triggered'
  ) as CauseOfBeingDown
  /**
   * 일반 쓰러짐: HP가 0이 되어 쓰러짐
   */
  static readonly NormalDefeat = new enumeration(
    'CauseOfBeingDown',
    'cause_of_being_down_normal_defeat'
  ) as CauseOfBeingDown
  /**
   * 비정상 쓰러짐: 익사, 낙하 등 특수 원인
   */
  static readonly AbnormalDefeat = new enumeration(
    'CauseOfBeingDown',
    'cause_of_being_down_abnormal_defeat'
  ) as CauseOfBeingDown
}

/** 원소 타입 */
export class ElementalType extends enumeration {
  declare private readonly __brandElementalType: 'ElementalType'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 원소 없음
   */
  static readonly None = new enumeration('ElementalType', 'elemental_type_none') as ElementalType
  /**
   * 불 (화)
   */
  static readonly Pyro = new enumeration('ElementalType', 'elemental_type_pyro') as ElementalType
  /**
   * 물 (수)
   */
  static readonly Hydro = new enumeration('ElementalType', 'elemental_type_hydro') as ElementalType
  /**
   * 바람 (풍)
   */
  static readonly Anemo = new enumeration('ElementalType', 'elemental_type_anemo') as ElementalType
  /**
   * 번개 (뇌)
   */
  static readonly Electro = new enumeration(
    'ElementalType',
    'elemental_type_electro'
  ) as ElementalType
  /**
   * 풀 (초)
   */
  static readonly Dendro = new enumeration(
    'ElementalType',
    'elemental_type_dendro'
  ) as ElementalType
  /**
   * 얼음 (빙)
   */
  static readonly Cryo = new enumeration('ElementalType', 'elemental_type_cryo') as ElementalType
  /**
   * 바위 (암)
   */
  static readonly Geo = new enumeration('ElementalType', 'elemental_type_geo') as ElementalType
}

/** 유닛 상태 제거 원인 */
export class UnitStatusRemovalReason extends enumeration {
  declare private readonly __brandUnitStatusRemovalReason: 'UnitStatusRemovalReason'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 상태 교체: 다른 상태에 의해 교체되어 제거됨
   */
  static readonly ReplacedByOtherUnitStatus = new enumeration(
    'UnitStatusRemovalReason',
    'unit_status_removal_reason_replaced_by_other_unit_status'
  ) as UnitStatusRemovalReason
  /**
   * 지속 시간 초과: 유닛 상태의 런타임 지속 시간이 초과됨
   */
  static readonly DurationExceeded = new enumeration(
    'UnitStatusRemovalReason',
    'unit_status_removal_reason_duration_exceeded'
  ) as UnitStatusRemovalReason
  /**
   * 해제: 유닛 상태가 직접 제거됨
   */
  static readonly Dispelled = new enumeration(
    'UnitStatusRemovalReason',
    'unit_status_removal_reason_dispelled'
  ) as UnitStatusRemovalReason
  /**
   * 상태 만료: 기타 원인으로 유닛 상태가 무효화됨
   */
  static readonly StatusExpired = new enumeration(
    'UnitStatusRemovalReason',
    'unit_status_removal_reason_status_expired'
  ) as UnitStatusRemovalReason
  /**
   * 클래스 변경: 클래스 변경으로 인해 유닛 상태가 제거됨
   */
  static readonly ClassChanged = new enumeration(
    'UnitStatusRemovalReason',
    'unit_status_removal_reason_class_changed'
  ) as UnitStatusRemovalReason
}

/** 원소 반응 타입 */
export class ElementalReactionType extends enumeration {
  declare private readonly __brandElementalReactionType: 'ElementalReactionType'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 과부하
   */
  static readonly Overloaded = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_overloaded'
  ) as ElementalReactionType
  /**
   * 증발
   */
  static readonly Vaporize = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_vaporize'
  ) as ElementalReactionType
  /**
   * 연소
   */
  static readonly Burning = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_burning'
  ) as ElementalReactionType
  /**
   * 습윤
   */
  static readonly Wet = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_wet'
  ) as ElementalReactionType
  /**
   * 개화
   */
  static readonly Bloom = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_bloom'
  ) as ElementalReactionType
  /**
   * 용해
   */
  static readonly Melt = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_melt'
  ) as ElementalReactionType
  /**
   * 빙결
   */
  static readonly Frozen = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_frozen'
  ) as ElementalReactionType
  /**
   * 감전
   */
  static readonly ElectroCharged = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_electro_charged'
  ) as ElementalReactionType
  /**
   * 초전도
   */
  static readonly Superconduct = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_superconduct'
  ) as ElementalReactionType
  /**
   * 확산 (불)
   */
  static readonly SwirlPyro = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_swirl_pyro'
  ) as ElementalReactionType
  /**
   * 확산 (물)
   */
  static readonly SwirlHydro = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_swirl_hydro'
  ) as ElementalReactionType
  /**
   * 확산 (번개)
   */
  static readonly SwirlElectro = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_swirl_electro'
  ) as ElementalReactionType
  /**
   * 확산 (얼음)
   */
  static readonly SwirlCryo = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_swirl_cryo'
  ) as ElementalReactionType
  /**
   * 결정화 (불)
   */
  static readonly CrystallizePyro = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_crystallize_pyro'
  ) as ElementalReactionType
  /**
   * 결정화 (물)
   */
  static readonly CrystallizeHydro = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_crystallize_hydro'
  ) as ElementalReactionType
  /**
   * 결정화 (번개)
   */
  static readonly CrystallizeElectro = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_crystallize_electro'
  ) as ElementalReactionType
  /**
   * 결정화 (얼음)
   */
  static readonly CrystallizeCryo = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_crystallize_cryo'
  ) as ElementalReactionType
  /**
   * 격화
   */
  static readonly Catalyze = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_catalyze'
  ) as ElementalReactionType
  /**
   * 초격화
   */
  static readonly Aggravate = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_aggravate'
  ) as ElementalReactionType
  /**
   * 만개격화
   */
  static readonly Spread = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_spread'
  ) as ElementalReactionType
  /**
   * 열개화
   */
  static readonly Burgeon = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_burgeon'
  ) as ElementalReactionType
  /**
   * 초개화
   */
  static readonly Hyperbloom = new enumeration(
    'ElementalReactionType',
    'elemental_reaction_type_hyperbloom'
  ) as ElementalReactionType
}

/** 선택 완료 원인 */
export class SelectCompletionReason extends enumeration {
  declare private readonly __brandSelectCompletionReason: 'SelectCompletionReason'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 플레이어가 정상적으로 선택 완료
   */
  static readonly CompletedByPlayer = new enumeration(
    'SelectCompletionReason',
    'select_completion_reason_completed_by_player'
  ) as SelectCompletionReason
  /**
   * 타임아웃: 상호작용 없이 시간 초과 후 기본값 반환
   */
  static readonly Timeout = new enumeration(
    'SelectCompletionReason',
    'select_completion_reason_timeout'
  ) as SelectCompletionReason
  /**
   * 정량 갱신: 정량 갱신 팝업에서 선택 완료
   */
  static readonly FixedQuantityRefresh = new enumeration(
    'SelectCompletionReason',
    'select_completion_reason_fixed_quantity_refresh'
  ) as SelectCompletionReason
  /**
   * 전량 갱신: 전량 갱신 팝업에서 선택 완료
   */
  static readonly RefreshAll = new enumeration(
    'SelectCompletionReason',
    'select_completion_reason_refresh_all'
  ) as SelectCompletionReason
  /**
   * 수동 닫기: 플레이어가 직접 닫음 (선택 포기 허용 시)
   */
  static readonly ClosedManually = new enumeration(
    'SelectCompletionReason',
    'select_completion_reason_closed_manually'
  ) as SelectCompletionReason
  /**
   * 노드 그래프에 의해 강제 닫기
   */
  static readonly ClosedByNodeGraph = new enumeration(
    'SelectCompletionReason',
    'select_completion_reason_closed_by_node_graph'
  ) as SelectCompletionReason
}

/** 아이템 변화 원인 */
export class ReasonForItemChange extends enumeration {
  declare private readonly __brandReasonForItemChange: 'ReasonForItemChange'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 제거: 아이템이 직접 제거됨
   */
  static readonly Destroy = new enumeration(
    'ReasonForItemChange',
    'reason_for_item_change_destroy'
  ) as ReasonForItemChange
  /**
   * 버리기
   */
  static readonly Discard = new enumeration(
    'ReasonForItemChange',
    'reason_for_item_change_discard'
  ) as ReasonForItemChange
  /**
   * 사용: 아이템 사용으로 인한 수량 변화
   */
  static readonly Use = new enumeration(
    'ReasonForItemChange',
    'reason_for_item_change_use'
  ) as ReasonForItemChange
  /**
   * 처치 드롭: 적 처치 후 획득/소실
   */
  static readonly DefeatDrops = new enumeration(
    'ReasonForItemChange',
    'reason_for_item_change_defeat_drops'
  ) as ReasonForItemChange
  /**
   * 상점 거래: 상점 구매/판매로 인한 변동
   */
  static readonly ShopTrade = new enumeration(
    'ReasonForItemChange',
    'reason_for_item_change_shop_trade'
  ) as ReasonForItemChange
  /**
   * 노드 그래프 조작: 노드 그래프 로직에 의한 변동
   */
  static readonly NodeGraphOperation = new enumeration(
    'ReasonForItemChange',
    'reason_for_item_change_node_graph_operation'
  ) as ReasonForItemChange
  /**
   * 줍기: 아이템 습득
   */
  static readonly PickUp = new enumeration(
    'ReasonForItemChange',
    'reason_for_item_change_pick_up'
  ) as ReasonForItemChange
}

/** 대상 타입 */
export class TargetType extends enumeration {
  declare private readonly __brandTargetType: 'TargetType'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 대상 없음
   */
  static readonly None = new enumeration('TargetType', 'target_type_none') as TargetType
  /**
   * 아군 진영
   */
  static readonly AlliedFaction = new enumeration(
    'TargetType',
    'target_type_allied_faction'
  ) as TargetType
  /**
   * 적대 진영
   */
  static readonly HostileFaction = new enumeration(
    'TargetType',
    'target_type_hostile_faction'
  ) as TargetType
  /**
   * 자기 자신
   */
  static readonly Self = new enumeration('TargetType', 'target_type_self') as TargetType
  /**
   * 자기 진영
   */
  static readonly OwnFaction = new enumeration(
    'TargetType',
    'target_type_own_faction'
  ) as TargetType
  /**
   * 전체
   */
  static readonly All = new enumeration('TargetType', 'target_type_all') as TargetType
  /**
   * 자기 자신을 제외한 전체
   */
  static readonly AllExceptSelf = new enumeration(
    'TargetType',
    'target_type_all_except_self'
  ) as TargetType
  /**
   * 아군 진영 (자기 자신 포함)
   */
  static readonly AlliedFactionSelfIncluded = new enumeration(
    'TargetType',
    'target_type_allied_faction_self_included'
  ) as TargetType
}

/** 트리거 제한 */
export class TriggerRestriction extends enumeration {
  declare private readonly __brandTriggerRestriction: 'TriggerRestriction'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 한 번만 트리거
   */
  static readonly TriggerOnlyOnce = new enumeration(
    'TriggerRestriction',
    'trigger_restriction_trigger_only_once'
  ) as TriggerRestriction
  /**
   * 엔티티당 한 번만 트리거
   */
  static readonly TriggerOnlyOncePerEntity = new enumeration(
    'TriggerRestriction',
    'trigger_restriction_trigger_only_once_per_entity'
  ) as TriggerRestriction
}

/** 히트 타입 */
export class HitType extends enumeration {
  declare private readonly __brandHitType: 'HitType'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 히트 타입 없음
   */
  static readonly None = new enumeration('HitType', 'hit_type_none') as HitType
  /**
   * 기본
   */
  static readonly Default = new enumeration('HitType', 'hit_type_default') as HitType
  /**
   * 베기
   */
  static readonly Slash = new enumeration('HitType', 'hit_type_slash') as HitType
  /**
   * 강타
   */
  static readonly Smash = new enumeration('HitType', 'hit_type_smash') as HitType
  /**
   * 투사체
   */
  static readonly Projectile = new enumeration('HitType', 'hit_type_projectile') as HitType
  /**
   * 관통 공격
   */
  static readonly PiercingAttack = new enumeration('HitType', 'hit_type_piercing_attack') as HitType
}

/** 공격 타입 */
export class AttackType extends enumeration {
  declare private readonly __brandAttackType: 'AttackType'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 공격 타입 없음
   */
  static readonly None = new enumeration('AttackType', 'attack_type_none') as AttackType
  /**
   * 근접 공격
   */
  static readonly MeleeAttack = new enumeration(
    'AttackType',
    'attack_type_melee_attack'
  ) as AttackType
  /**
   * 원거리 공격
   */
  static readonly RangedAttack = new enumeration(
    'AttackType',
    'attack_type_ranged_attack'
  ) as AttackType
  /**
   * 기본
   */
  static readonly Default = new enumeration('AttackType', 'attack_type_default') as AttackType
}

/** 피격 연출 등급 */
export class HitPerformanceLevel extends enumeration {
  declare private readonly __brandHitPerformanceLevel: 'HitPerformanceLevel'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 기본 연출
   */
  static readonly Default = new enumeration(
    'HitPerformanceLevel',
    'hit_performance_level_default'
  ) as HitPerformanceLevel
  /**
   * 연출 없음
   */
  static readonly NoHitPerformance = new enumeration(
    'HitPerformanceLevel',
    'hit_performance_level_no_hit_performance'
  ) as HitPerformanceLevel
  /**
   * 차지 없는 일반 화살 명중
   */
  static readonly HitByNormalArrowWithoutCharging = new enumeration(
    'HitPerformanceLevel',
    'hit_performance_level_hit_by_normal_arrow_without_charging'
  ) as HitPerformanceLevel
  /**
   * 연속 히트
   */
  static readonly ComboHit = new enumeration(
    'HitPerformanceLevel',
    'hit_performance_level_combo_hit'
  ) as HitPerformanceLevel
  /**
   * 일반 명중
   */
  static readonly NormalHit = new enumeration(
    'HitPerformanceLevel',
    'hit_performance_level_normal_hit'
  ) as HitPerformanceLevel
  /**
   * 강타
   */
  static readonly HeavyHit = new enumeration(
    'HitPerformanceLevel',
    'hit_performance_level_heavy_hit'
  ) as HitPerformanceLevel
  /**
   * 강력 충격
   */
  static readonly StrongImpact = new enumeration(
    'HitPerformanceLevel',
    'hit_performance_level_strong_impact'
  ) as HitPerformanceLevel
  /**
   * 궁극 충격
   */
  static readonly UltimateImpact = new enumeration(
    'HitPerformanceLevel',
    'hit_performance_level_ultimate_impact'
  ) as HitPerformanceLevel
  /**
   * 수직 날려보내기
   */
  static readonly VerticalLaunch = new enumeration(
    'HitPerformanceLevel',
    'hit_performance_level_vertical_launch'
  ) as HitPerformanceLevel
  /**
   * 강력 날려보내기
   */
  static readonly SuperLaunch = new enumeration(
    'HitPerformanceLevel',
    'hit_performance_level_super_launch'
  ) as HitPerformanceLevel
  /**
   * 원거리 투척
   */
  static readonly LongRangeThrow = new enumeration(
    'HitPerformanceLevel',
    'hit_performance_level_long_range_throw'
  ) as HitPerformanceLevel
}

/** 유닛 상태 추가 결과 */
export class UnitStatusAdditionResult extends enumeration {
  declare private readonly __brandUnitStatusAdditionResult: 'UnitStatusAdditionResult'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 실패: 예기치 않은 오류
   */
  static readonly FailedUnexpectedError = new enumeration(
    'UnitStatusAdditionResult',
    'unit_status_addition_result_failed_unexpected_error'
  ) as UnitStatusAdditionResult
  /**
   * 실패: 다른 프로세스에 의해 작업이 중단됨
   */
  static readonly FailedOperationPausedForAnotherProcess = new enumeration(
    'UnitStatusAdditionResult',
    'unit_status_addition_result_failed_operation_paused_for_another_process'
  ) as UnitStatusAdditionResult
  /**
   * 실패: 최대 공존 한도에 도달
   */
  static readonly FailedMaximumCoexistenceLimitReached = new enumeration(
    'UnitStatusAdditionResult',
    'unit_status_addition_result_failed_maximum_coexistence_limit_reached'
  ) as UnitStatusAdditionResult
  /**
   * 실패: 스택 추가 불가
   */
  static readonly FailedUnableToAddAdditionalStack = new enumeration(
    'UnitStatusAdditionResult',
    'unit_status_addition_result_failed_unable_to_add_additional_stack'
  ) as UnitStatusAdditionResult
  /**
   * 성공: 새 상태 적용
   */
  static readonly SuccessNewStatusApplied = new enumeration(
    'UnitStatusAdditionResult',
    'unit_status_addition_result_success_new_status_applied'
  ) as UnitStatusAdditionResult
  /**
   * 성공: 슬롯 스택 추가
   */
  static readonly SuccessSlotStacking = new enumeration(
    'UnitStatusAdditionResult',
    'unit_status_addition_result_success_slot_stacking'
  ) as UnitStatusAdditionResult
}

/** 유닛 상태 제거 전략 */
export class UnitStatusRemovalStrategy extends enumeration {
  declare private readonly __brandUnitStatusRemovalStrategy: 'UnitStatusRemovalStrategy'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 동일 이름의 모든 공존 상태
   */
  static readonly AllCoexistingStatusesWithTheSameName = new enumeration(
    'UnitStatusRemovalStrategy',
    'unit_status_removal_strategy_all_coexisting_statuses_with_the_same_name'
  ) as UnitStatusRemovalStrategy
  /**
   * 가장 빨리 스택을 잃는 상태
   */
  static readonly StatusWithFastestStackLoss = new enumeration(
    'UnitStatusRemovalStrategy',
    'unit_status_removal_strategy_status_with_fastest_stack_loss'
  ) as UnitStatusRemovalStrategy
}

/** 부활 지점 선택 전략 */
export class RevivePointSelectionStrategy extends enumeration {
  declare private readonly __brandRevivePointSelectionStrategy: 'RevivePointSelectionStrategy'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  static readonly Nearest = new enumeration(
    'RevivePointSelectionStrategy',
    'revive_point_selection_strategy_nearest'
  ) as RevivePointSelectionStrategy
  /**
   * 가장 최근에 활성화된 지점
   */
  static readonly MostRecentlyActivated = new enumeration(
    'RevivePointSelectionStrategy',
    'revive_point_selection_strategy_most_recently_activated'
  ) as RevivePointSelectionStrategy
  /**
   * 우선순위가 가장 높은 지점
   */
  static readonly HighestPriority = new enumeration(
    'RevivePointSelectionStrategy',
    'revive_point_selection_strategy_highest_priority'
  ) as RevivePointSelectionStrategy
  /**
   * 무작위 지점
   */
  static readonly Random = new enumeration(
    'RevivePointSelectionStrategy',
    'revive_point_selection_strategy_random'
  ) as RevivePointSelectionStrategy
}

/** 경직 상태 */
export class InterruptStatus extends enumeration {
  declare private readonly __brandInterruptStatus: 'InterruptStatus'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 경직 저항 상태
   */
  static readonly InterruptResistanceStatus = new enumeration(
    'InterruptStatus',
    'interrupt_status_interrupt_resistance_status'
  ) as InterruptStatus
  /**
   * 경직 취약 상태
   */
  static readonly InterruptVulnerabilityStatus = new enumeration(
    'InterruptStatus',
    'interrupt_status_interrupt_vulnerability_status'
  ) as InterruptStatus
  /**
   * 보호 상태
   */
  static readonly ProtectedStatus = new enumeration(
    'InterruptStatus',
    'interrupt_status_protected_status'
  ) as InterruptStatus
}

/** 게임플레이 모드 */
export class GameplayMode extends enumeration {
  declare private readonly __brandGameplayMode: 'GameplayMode'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 일반 플레이
   */
  static readonly Play = new enumeration('GameplayMode', 'gameplay_mode_play') as GameplayMode
  /**
   * 방 플레이
   */
  static readonly RoomPlay = new enumeration(
    'GameplayMode',
    'gameplay_mode_room_play'
  ) as GameplayMode
  /**
   * 대전 플레이
   */
  static readonly MatchPlay = new enumeration(
    'GameplayMode',
    'gameplay_mode_match_play'
  ) as GameplayMode
}

/** 입력 장치 타입 */
export class InputDeviceType extends enumeration {
  declare private readonly __brandInputDeviceType: 'InputDeviceType'
  private constructor() {
    super('')
    throw new Error('you should not create an enum instance')
  }

  /**
   * 키보드 & 마우스
   */
  static readonly KeyboardAndMouse = new enumeration(
    'InputDeviceType',
    'input_device_type_keyboard_and_mouse'
  ) as InputDeviceType
  /**
   * 컨트롤러
   */
  static readonly Controller = new enumeration(
    'InputDeviceType',
    'input_device_type_controller'
  ) as InputDeviceType
  /**
   * 터치스크린
   */
  static readonly Touchscreen = new enumeration(
    'InputDeviceType',
    'input_device_type_touchscreen'
  ) as InputDeviceType
}
