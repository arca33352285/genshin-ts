import * as z from 'zod'

import { t } from '../i18n/index.js'
import type { MetaCallRegistry } from '../runtime/core.js'
import {
  CommonLiteralValueListTypeMap,
  CommonLiteralValueTypeMap,
  ListableValueTypeMap,
  LiteralValueListTypeMap,
  LiteralValueType,
  SpecialValueTypeMap,
  ValueType,
  Variable,
  type ServerGraphMode
} from '../runtime/IR.js'
import { getRuntimeOptions } from '../runtime/runtime_config.js'
import {
  bool,
  BoolValue,
  configId,
  ConfigIdValue,
  customVariableSnapshot,
  CustomVariableSnapshotValue,
  dict,
  DictKeyType,
  DictValue,
  DictValueType,
  ensureLiteralStr,
  entity,
  EntityValue,
  enumeration,
  faction,
  FactionValue,
  float,
  FloatValue,
  generic,
  guid,
  GuidValue,
  int,
  IntValue,
  list,
  listLiteral,
  localVariable,
  LocalVariableValue,
  prefabId,
  PrefabIdValue,
  ReadonlyDict,
  RuntimeParameterValueTypeMap,
  RuntimeReturnValueTypeMap,
  str,
  struct,
  StrValue,
  value,
  ValueClassMap,
  vec3,
  Vec3Value
} from '../runtime/value.js'
import type {
  CharacterEntity,
  CreationEntity,
  EntityOf,
  ObjectEntity,
  PlayerEntity,
  StageEntity
} from './entity_helpers.js'
import {
  AttackShape,
  AttackType,
  CauseOfBeingDown,
  CharacterSkillSlot,
  ComparisonOperator,
  DamagePopUpType,
  DecisionRefreshMode,
  DisruptorDeviceOrientation,
  DisruptorDeviceType,
  ElementalReactionType,
  ElementalType,
  EntityType,
  EnumerationType,
  EnumerationTypeMap,
  FixedMotionParameterType,
  FollowCoordinateSystem,
  FollowLocationType,
  GameplayMode,
  HitPerformanceLevel,
  HitType,
  InputDeviceType,
  InterruptStatus,
  ItemLootType,
  LogicalOperator,
  MathematicalOperator,
  MotionPathPointType,
  MotionType,
  MovementMode,
  ReasonForItemChange,
  RemovalMethod,
  RevivePointSelectionStrategy,
  RoundingMode,
  ScanRuleType,
  SelectCompletionReason,
  SettlementStatus,
  SortBy,
  SoundAttenuationMode,
  SurvivalStatus,
  TargetType,
  TriggerRestriction,
  TrigonometricFunction,
  TypeConversion,
  UIControlGroupStatus,
  UnitStatusAdditionResult,
  UnitStatusRemovalReason,
  UnitStatusRemovalStrategy
} from './enum.js'
import type { ServerEventPayloads } from './events-payload.js'
import type { NODE_TYPE_BY_METHOD } from './node_modes.js'

export type {
  CharacterEntity,
  CreationEntity,
  EntityKind,
  EntityOf,
  ObjectEntity,
  PlayerEntity,
  StageEntity
} from './entity_helpers.js'

export function parseValue(v: any, type: 'bool'): bool
export function parseValue(v: any, type: 'int'): int
export function parseValue(v: any, type: 'float'): float
export function parseValue(v: any, type: 'str'): str
export function parseValue(v: any, type: 'vec3'): vec3
export function parseValue(v: any, type: 'guid'): guid
export function parseValue(v: any, type: 'entity'): entity
export function parseValue(v: any, type: 'prefab_id'): prefabId
export function parseValue(v: any, type: 'config_id'): configId
export function parseValue(v: any, type: 'faction'): faction
export function parseValue(v: any, type: 'struct'): struct
export function parseValue(v: any, type: 'dict'): dict
export function parseValue(v: any, type: 'enum'): enumeration
export function parseValue(v: any, type: 'enumeration'): enumeration
export function parseValue(v: any, type: 'generic'): generic
export function parseValue(v: any, type: 'custom_variable_snapshot'): customVariableSnapshot
export function parseValue(v: any, type: 'local_variable'): localVariable
export function parseValue(v: any, type: 'bool_list'): list<'bool'>
export function parseValue(v: any, type: 'int_list'): list<'int'>
export function parseValue(v: any, type: 'float_list'): list<'float'>
export function parseValue(v: any, type: 'str_list'): list<'str'>
export function parseValue(v: any, type: 'vec3_list'): list<'vec3'>
export function parseValue(v: any, type: 'guid_list'): list<'guid'>
export function parseValue(v: any, type: 'entity_list'): list<'entity'>
export function parseValue(v: any, type: 'prefab_id_list'): list<'prefab_id'>
export function parseValue(v: any, type: 'config_id_list'): list<'config_id'>
export function parseValue(v: any, type: 'faction_list'): list<'faction'>
export function parseValue(v: any, type: 'struct_list'): list<'struct'>
export function parseValue(v: any, type: DictValueType): value
export function parseValue(v: any, type: keyof (ListableValueTypeMap & SpecialValueTypeMap)): value
// @ts-ignore allow
export function parseValue(v: any, type: keyof LiteralValueListTypeMap): list
export function parseValue(v: any, type: ValueType) {
  if (z.instanceof(generic).safeParse(v).success) {
    const metadata = (v as value).getMetadata()
    if (metadata?.kind === 'literal') {
      if (type === 'dict' || type.endsWith('_list')) return v as value
    }
  }
  switch (type) {
    case 'bool': {
      if (z.instanceof(bool).safeParse(v).success) {
        return v as bool
      }
      const result = z.boolean().safeParse(v)
      if (result.success) {
        return new bool(result.data)
      }
      break
    }
    case 'float': {
      if (z.instanceof(float).safeParse(v).success) {
        return v as float
      }
      const result = z.number().safeParse(v)
      if (result.success) {
        return new float(result.data)
      }
      break
    }
    // 必须将int放置于float之后, 这样允许字面量传值时强制传bigint指定为int类型
    // 否则如果希望是浮点类型, 但具体值都为整数浮点时, 会导致永远被推测为int, 而无法被解析为float
    case 'int': {
      if (z.instanceof(int).safeParse(v).success) {
        return v as int
      }
      const result = z.union([z.int(), z.bigint()]).safeParse(v)
      if (result.success) {
        return new int(result.data)
      }
      break
    }
    case 'str': {
      if (z.instanceof(str).safeParse(v).success) {
        return v as str
      }
      const result = z.string().safeParse(v)
      if (result.success) {
        return new str(result.data)
      }
      break
    }
    case 'vec3': {
      if (z.instanceof(vec3).safeParse(v).success) {
        return v as vec3
      }
      const tuple3 = z.tuple([z.number(), z.number(), z.number()])
      if (z.instanceof(list).safeParse(v).success) {
        const vec3Value = (v as list).getVec3Value()
        const result = tuple3.safeParse(vec3Value)
        if (result.success) return new vec3(result.data)
        throw new Error(`Invalid vec3 value: ${JSON.stringify(v)}`)
      }
      const result = tuple3.safeParse(v)
      if (result.success) {
        return new vec3(result.data)
      }
      break
    }
    case 'guid': {
      if (z.instanceof(guid).safeParse(v).success) {
        return v as guid
      }
      const result = z.union([z.int(), z.bigint()]).safeParse(v)
      if (result.success) {
        return new guid(result.data)
      }
      break
    }
    case 'entity': {
      if (z.instanceof(entity).safeParse(v).success) {
        return v as entity
      }
      break
    }
    case 'prefab_id': {
      if (z.instanceof(prefabId).safeParse(v).success) {
        return v as prefabId
      }
      const result = z.union([z.int(), z.bigint()]).safeParse(v)
      if (result.success) {
        return new prefabId(result.data)
      }
      break
    }
    case 'config_id': {
      if (z.instanceof(configId).safeParse(v).success) {
        return v as configId
      }
      const result = z.union([z.int(), z.bigint()]).safeParse(v)
      if (result.success) {
        return new configId(result.data)
      }
      break
    }
    case 'faction': {
      if (z.instanceof(faction).safeParse(v).success) {
        return v as faction
      }
      const result = z.union([z.int(), z.bigint()]).safeParse(v)
      if (result.success) {
        return new faction(result.data)
      }
      break
    }
    case 'struct': {
      if (z.instanceof(struct).safeParse(v).success) {
        return v as struct
      }
      break
    }
    case 'dict': {
      if (z.instanceof(dict).safeParse(v).success) {
        return v as dict
      }
      break
    }
    case 'enum':
    case 'enumeration': {
      if (z.instanceof(enumeration).safeParse(v).success) {
        return v as enumeration
      }
      break
    }
    case 'generic': {
      if (z.instanceof(generic).safeParse(v).success) {
        return v as generic
      }
      break
    }
    case 'custom_variable_snapshot': {
      if (z.instanceof(customVariableSnapshot).safeParse(v).success) {
        return v as customVariableSnapshot
      }
      break
    }
    case 'local_variable': {
      if (z.instanceof(localVariable).safeParse(v).success) {
        return v as localVariable
      }
      break
    }
    case 'bool_list': {
      if (z.instanceof(list).safeParse(v).success && (v as list).getConcreteType() === 'bool') {
        return v as list<'bool'>
      }
      break
    }
    // 理论上可以通过Array.isArray → gsts.f.assemblyList处理, 避免编译器阶段包装assemblyList处理
    // 但会引入隐式副作用, 目前暂时维持现状
    case 'int_list': {
      if (z.instanceof(list).safeParse(v).success && (v as list).getConcreteType() === 'int') {
        return v as list<'int'>
      }
      break
    }
    case 'float_list': {
      if (z.instanceof(list).safeParse(v).success && (v as list).getConcreteType() === 'float') {
        return v as list<'float'>
      }
      break
    }
    case 'str_list': {
      if (z.instanceof(list).safeParse(v).success && (v as list).getConcreteType() === 'str') {
        return v as list<'str'>
      }
      break
    }
    case 'vec3_list': {
      if (z.instanceof(list).safeParse(v).success) {
        const concreteType = (v as list).getConcreteType()
        if (concreteType === 'vec3') {
          return v as list<'vec3'>
        } else if (concreteType === 'float') {
          const vec3Value = (v as list).getVec3Value()
          if (vec3Value) {
            return new vec3(vec3Value)
          }
        }
      }
      break
    }
    case 'guid_list': {
      if (z.instanceof(list).safeParse(v).success && (v as list).getConcreteType() === 'guid') {
        return v as list<'guid'>
      }
      break
    }
    case 'entity_list': {
      if (z.instanceof(list).safeParse(v).success && (v as list).getConcreteType() === 'entity') {
        return v as list<'entity'>
      }
      break
    }
    case 'prefab_id_list': {
      if (
        z.instanceof(list).safeParse(v).success &&
        (v as list).getConcreteType() === 'prefab_id'
      ) {
        return v as list<'prefab_id'>
      }
      break
    }
    case 'config_id_list': {
      if (
        z.instanceof(list).safeParse(v).success &&
        (v as list).getConcreteType() === 'config_id'
      ) {
        return v as list<'config_id'>
      }
      break
    }
    case 'faction_list': {
      if (z.instanceof(list).safeParse(v).success && (v as list).getConcreteType() === 'faction') {
        return v as list<'faction'>
      }
      break
    }
    case 'struct_list': {
      if (z.instanceof(list).safeParse(v).success && (v as list).getConcreteType() === 'struct') {
        return v as list<'struct'>
      }
      break
    }
  }
  if (type === 'int_list') {
    if (z.instanceof(list).safeParse(v).success) {
      const concreteType = (v as list).getConcreteType()
      if (concreteType === 'float') {
        throw new Error(t('err_intListLikelyFloatList', { actual: 'float_list' }))
      }
    }
  }
  throw new Error(t('err_invalidValueType', { type }))
}

const noListType: Set<string> = new Set([
  'dict',
  'generic',
  'enum',
  'enumeration',
  'local_variable',
  'custom_variable_snapshot'
]) satisfies Set<keyof SpecialValueTypeMap>

function isListableType(
  type: keyof (ListableValueTypeMap & SpecialValueTypeMap)
): type is keyof ListableValueTypeMap {
  return !noListType.has(type)
}

function isListType(type: DictValueType): type is keyof CommonLiteralValueListTypeMap {
  return type.endsWith('_list')
}

function getBaseValueType(
  type: keyof CommonLiteralValueListTypeMap
): keyof CommonLiteralValueTypeMap {
  return type.replace('_list', '') as keyof CommonLiteralValueTypeMap
}

function matchType(
  type: keyof (ListableValueTypeMap & SpecialValueTypeMap),
  ...values: readonly unknown[]
) {
  for (const v of values) {
    if (z.instanceof(list).safeParse(v).success) {
      if (!isListableType(type)) {
        throw new Error(`Invalid value type: ${type}_list`)
      }
      parseValue(v, `${type}_list`)
    } else {
      parseValue(v, type)
    }
  }
}

function matchTypes<T extends keyof (ListableValueTypeMap & SpecialValueTypeMap)>(
  types: T[],
  ...values: readonly unknown[]
): T {
  for (const type of types) {
    try {
      matchType(type, ...values)
      return type
    } catch {
      // ignore
    }
  }
  const formatValue = (v: unknown) => {
    if (z.instanceof(value).safeParse(v).success) {
      const metadata = (v as value).getMetadata()
      if (!metadata) return JSON.stringify(v)

      if (metadata.kind === 'literal') {
        if (z.instanceof(generic).safeParse(v).success) {
          const genericValue = v as generic
          const concreteType = genericValue.getConcreteType()
          if (!concreteType) return '<untyped placeholder>'
          if (concreteType === 'dict') {
            const keyType = genericValue.getDictKeyType()
            const valueType = genericValue.getDictValueType()
            if (keyType && valueType) return `dict<${keyType}, ${valueType}> placeholder`
          }
          return `${concreteType} placeholder`
        }
        return JSON.stringify((v as value).toIRLiteral())
      }
      return JSON.stringify({
        ...metadata,
        record: {
          ...metadata.record,
          args: undefined
        }
      })
    }
    return JSON.stringify(v)
  }
  const hasUntypedPlaceholder = values.some(
    (v) =>
      z.instanceof(generic).safeParse(v).success &&
      (v as generic).getMetadata()?.kind === 'literal' &&
      !(v as generic).getConcreteType()
  )
  const hint = hasUntypedPlaceholder
    ? " Hint: use list('type', 0) or dict('k', 'v', 0) to declare a typed placeholder."
    : ''
  throw new Error(`Generic parameter not matched: ${values.map(formatValue).join(', ')}${hint}`)
}

function isPrecomputeEnabled(): boolean {
  return getRuntimeOptions().optimize.precompileExpression === true
}

function isLiteralValue(v: value): boolean {
  return v.getMetadata()?.kind === 'literal'
}

function readLiteralBool(v: value): boolean | null {
  if (!isLiteralValue(v) || !(v instanceof bool)) return null
  return v.value ?? null
}

function readLiteralInt(v: value): bigint | null {
  if (!isLiteralValue(v) || !(v instanceof int)) return null
  return v.value ?? null
}

function readLiteralFloat(v: value): number | null {
  if (!isLiteralValue(v) || !(v instanceof float)) return null
  const value = v.value
  if (value === undefined) return null
  return Number.isFinite(value) ? value : null
}

function readLiteralStr(v: value): string | null {
  if (!isLiteralValue(v) || !(v instanceof str)) return null
  return v.value ?? null
}

function readLiteralVec3(v: value): [number, number, number] | null {
  if (!isLiteralValue(v) || !(v instanceof vec3)) return null
  const value = v.value
  if (!value || value.length !== 3) return null
  if (!value.every((n) => Number.isFinite(n))) return null
  return value
}

function tryPrecomputeFloatUnary(v: value, op: (a: number) => number): float | null {
  if (!isPrecomputeEnabled()) return null
  const raw = readLiteralFloat(v)
  if (raw === null) return null
  const result = op(raw)
  if (!Number.isFinite(result)) return null
  return new float(result)
}

function tryPrecomputeFloatBinary(
  a: value,
  b: value,
  op: (x: number, y: number) => number
): float | null {
  if (!isPrecomputeEnabled()) return null
  const av = readLiteralFloat(a)
  const bv = readLiteralFloat(b)
  if (av === null || bv === null) return null
  const result = op(av, bv)
  if (!Number.isFinite(result)) return null
  return new float(result)
}

function tryPrecomputeIntUnary(v: value, op: (a: bigint) => bigint): int | null {
  if (!isPrecomputeEnabled()) return null
  const raw = readLiteralInt(v)
  if (raw === null) return null
  return new int(op(raw))
}

function tryPrecomputeIntBinary(
  a: value,
  b: value,
  op: (x: bigint, y: bigint) => bigint
): int | null {
  if (!isPrecomputeEnabled()) return null
  const av = readLiteralInt(a)
  const bv = readLiteralInt(b)
  if (av === null || bv === null) return null
  return new int(op(av, bv))
}

function tryPrecomputeBoolUnary(v: value, op: (a: boolean) => boolean): bool | null {
  if (!isPrecomputeEnabled()) return null
  const raw = readLiteralBool(v)
  if (raw === null) return null
  return new bool(op(raw))
}

function tryPrecomputeBoolBinary(
  a: value,
  b: value,
  op: (x: boolean, y: boolean) => boolean
): bool | null {
  if (!isPrecomputeEnabled()) return null
  const av = readLiteralBool(a)
  const bv = readLiteralBool(b)
  if (av === null || bv === null) return null
  return new bool(op(av, bv))
}

function tryPrecomputeCompare(
  type: 'float' | 'int',
  a: value,
  b: value,
  op: (x: number | bigint, y: number | bigint) => boolean
): bool | null {
  if (!isPrecomputeEnabled()) return null
  if (type === 'float') {
    const av = readLiteralFloat(a)
    const bv = readLiteralFloat(b)
    if (av === null || bv === null) return null
    return new bool(op(av, bv))
  }
  const av = readLiteralInt(a)
  const bv = readLiteralInt(b)
  if (av === null || bv === null) return null
  return new bool(op(av, bv))
}

function tryPrecomputeEquality(a: value, b: value): bool | null {
  if (!isPrecomputeEnabled()) return null
  const boolA = readLiteralBool(a)
  const boolB = readLiteralBool(b)
  if (boolA !== null && boolB !== null) return new bool(boolA === boolB)

  const intA = readLiteralInt(a)
  const intB = readLiteralInt(b)
  if (intA !== null && intB !== null) return new bool(intA === intB)

  const floatA = readLiteralFloat(a)
  const floatB = readLiteralFloat(b)
  if (floatA !== null && floatB !== null) return new bool(floatA === floatB)

  const strA = readLiteralStr(a)
  const strB = readLiteralStr(b)
  if (strA !== null && strB !== null) return new bool(strA === strB)

  const vecA = readLiteralVec3(a)
  const vecB = readLiteralVec3(b)
  if (vecA && vecB) {
    return new bool(vecA[0] === vecB[0] && vecA[1] === vecB[1] && vecA[2] === vecB[2])
  }
  return null
}

function tryPrecomputeVec3Binary(
  a: value,
  b: value,
  op: (x: [number, number, number], y: [number, number, number]) => [number, number, number]
): vec3 | null {
  if (!isPrecomputeEnabled()) return null
  const av = readLiteralVec3(a)
  const bv = readLiteralVec3(b)
  if (!av || !bv) return null
  const result = op(av, bv)
  if (!result.every((n) => Number.isFinite(n))) return null
  return new vec3(result)
}

function tryPrecomputeVec3ToFloat(
  v: value,
  op: (a: [number, number, number]) => number
): float | null {
  if (!isPrecomputeEnabled()) return null
  const raw = readLiteralVec3(v)
  if (!raw) return null
  const result = op(raw)
  if (!Number.isFinite(result)) return null
  return new float(result)
}

function tryPrecomputeVec3BinaryToFloat(
  a: value,
  b: value,
  op: (x: [number, number, number], y: [number, number, number]) => number
): float | null {
  if (!isPrecomputeEnabled()) return null
  const av = readLiteralVec3(a)
  const bv = readLiteralVec3(b)
  if (!av || !bv) return null
  const result = op(av, bv)
  if (!Number.isFinite(result)) return null
  return new float(result)
}

export type DataTypeConversionMap = {
  bool: 'int' | 'str'
  entity: 'str'
  faction: 'str'
  float: 'int' | 'str'
  guid: 'str'
  int: 'bool' | 'float' | 'str'
  vec3: 'str'
}

export class ServerExecutionFlowFunctions {
  constructor(private registry: MetaCallRegistry) {}

  private resolveLiteralVarName(input: StrValue): string | null {
    if (typeof input === 'string') return input
    if (input instanceof str) {
      const meta = input.getMetadata()
      if (meta?.kind === 'literal') return input.value ?? null
    }
    return null
  }

  /**
   * @gsts
   *
   * 현재 실행 경로에서 반환한다
   *
   * 참고: 특정 노드에 대응하지 않으며, 현재 브랜치가 후속 노드에 연결되지 않도록 한다
   */
  return(): void {
    const { localVariable } = this.registry.getOrCreateReturnGateLocalVariable()
    // 运行时标记 return 已发生
    this.setLocalVariable(localVariable, true)
    // 如处在循环体中，逐层 break（支持嵌套循环）
    const loops = this.registry.getActiveLoopNodeIds()
    if (loops.length) this.breakLoop(...loops.slice().reverse())
    this.registry.returnFromCurrentExecPath()
  }

  /**
   * @gsts
   *
   * 현재 루프 이터레이션을 계속한다
   *
   * 참고: 특정 노드에 대응하지 않으며, 현재 브랜치가 후속 노드에 연결되지 않도록 한다
   */
  continue(): void {
    if (!this.registry.getActiveLoopNodeIds().length) {
      throw new Error('continue is only supported inside loop bodies')
    }
    this.registry.returnFromCurrentExecPath({ countReturn: false })
  }

  /**
   * 입력 파라미터의 타입을 다른 타입으로 변환하여 출력한다. 세부 규칙은 기본 개념 - [기본 데이터 타입 간 변환 규칙] 참조
   *
   * @param input 입력
   * @returns 출력
   */
  dataTypeConversion<T extends keyof DataTypeConversionMap, U extends DataTypeConversionMap[T]>(
    input: RuntimeParameterValueTypeMap[T],
    type: U
  ): RuntimeReturnValueTypeMap[U] {
    const inputType = matchTypes(
      [
        'float',
        'int',
        // 以上浮点和整数必须前置, 以便字面量匹配到正确类型
        'bool',
        'entity',
        'faction',
        'guid',
        'vec3'
      ],
      input
    )
    const inputObj = parseValue(input, inputType)
    if (inputType === 'faction') {
      const metadata = inputObj.getMetadata()
      if (!metadata || metadata.kind !== 'pin') {
        throw new Error(t('err_dataTypeConversionFactionMustBeWired'))
      }
    }
    if (isPrecomputeEnabled()) {
      if (type === 'str') {
        if (inputType === 'int') {
          const raw = readLiteralInt(inputObj)
          if (raw !== null)
            return new str(raw.toString()) as unknown as RuntimeReturnValueTypeMap[U]
        }
        if (inputType === 'float') {
          const raw = readLiteralFloat(inputObj)
          if (raw !== null) return new str(String(raw)) as unknown as RuntimeReturnValueTypeMap[U]
        }
      }
      if (type === 'float' && inputType === 'int') {
        const raw = readLiteralInt(inputObj)
        if (raw !== null) return new float(Number(raw)) as unknown as RuntimeReturnValueTypeMap[U]
      }
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: `data_type_conversion_${String(type)}`,
      args: [inputObj]
    })
    const ret = new ValueClassMap[type]()
    ret.markPin(ref, 'output', 0)
    return ret as unknown as RuntimeReturnValueTypeMap[U]
  }

  /**
   * 두 입력이 같은지 판단한다. 일부 파라미터 타입은 특수한 판정 규칙을 따른다: 부동소수점은 근사 비교를 사용하여, 차이가 극소값 미만이면 같다고 판단한다 (예: 2.0000001과 2.0은 같음); Vec3는 x, y, z 각각 부동소수점 근사 비교를 사용한다
   *
   * @param input1 입력1
   * @param input2 입력2
   * @returns 결과: 같으면 True, 다르면 False
   */
  equal(input1: FloatValue, input2: FloatValue): boolean
  equal(input1: IntValue, input2: IntValue): boolean
  equal(input1: BoolValue, input2: BoolValue): boolean
  equal(input1: ConfigIdValue, input2: ConfigIdValue): boolean
  equal(input1: EntityValue, input2: EntityValue): boolean
  equal(input1: FactionValue, input2: FactionValue): boolean
  equal(input1: GuidValue, input2: GuidValue): boolean
  equal(input1: PrefabIdValue, input2: PrefabIdValue): boolean
  equal(input1: StrValue, input2: StrValue): boolean
  equal(input1: Vec3Value, input2: Vec3Value): boolean
  equal<
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
  >(input1: RuntimeParameterValueTypeMap[T], input2: RuntimeParameterValueTypeMap[T]): boolean {
    let genericType = matchTypes(
      [
        'float',
        'int',
        'bool',
        'config_id',
        'entity',
        'faction',
        'guid',
        'prefab_id',
        'str',
        'vec3'
      ],
      input1,
      input2
    )

    // 预处理器可能意外包裹三维向量为列表, 此处特殊处理
    if (
      z.instanceof(list).safeParse(input1).success &&
      z.instanceof(list).safeParse(input2).success
    ) {
      const concreteType1 = (input1 as unknown as list).getConcreteType()
      const concreteType2 = (input2 as unknown as list).getConcreteType()
      if (concreteType1 === 'float' && concreteType2 === 'float') {
        genericType = 'vec3'
      }
    }

    const input1Obj = parseValue(input1, genericType)
    const input2Obj = parseValue(input2, genericType)
    const pre = tryPrecomputeEquality(input1Obj, input2Obj)
    if (pre) return pre as unknown as boolean
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'equal',
      args: [input1Obj, input2Obj]
    })
    const ret = new bool()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as boolean
  }

  /**
   * 열거형 타입을 확인한 후 두 입력값이 같은지 판단한다
   *
   * @param enumeration1 열거형1
   * @param enumeration2 열거형2
   * @returns 결과: 같으면 True, 다르면 False
   */
  enumerationsEqual(enumeration1: ComparisonOperator, enumeration2: ComparisonOperator): boolean
  enumerationsEqual(enumeration1: LogicalOperator, enumeration2: LogicalOperator): boolean
  enumerationsEqual(enumeration1: MathematicalOperator, enumeration2: MathematicalOperator): boolean
  enumerationsEqual(enumeration1: AttackShape, enumeration2: AttackShape): boolean
  enumerationsEqual(enumeration1: SurvivalStatus, enumeration2: SurvivalStatus): boolean
  enumerationsEqual(enumeration1: SortBy, enumeration2: SortBy): boolean
  enumerationsEqual(enumeration1: RoundingMode, enumeration2: RoundingMode): boolean
  enumerationsEqual(enumeration1: TypeConversion, enumeration2: TypeConversion): boolean
  enumerationsEqual(enumeration1: MotionPathPointType, enumeration2: MotionPathPointType): boolean
  enumerationsEqual(enumeration1: MotionType, enumeration2: MotionType): boolean
  enumerationsEqual(enumeration1: FollowLocationType, enumeration2: FollowLocationType): boolean
  enumerationsEqual(
    enumeration1: FollowCoordinateSystem,
    enumeration2: FollowCoordinateSystem
  ): boolean
  enumerationsEqual(enumeration1: ElementalType, enumeration2: ElementalType): boolean
  enumerationsEqual(enumeration1: EntityType, enumeration2: EntityType): boolean
  enumerationsEqual(
    enumeration1: UnitStatusAdditionResult,
    enumeration2: UnitStatusAdditionResult
  ): boolean
  enumerationsEqual(
    enumeration1: UnitStatusRemovalReason,
    enumeration2: UnitStatusRemovalReason
  ): boolean
  enumerationsEqual(
    enumeration1: UnitStatusRemovalStrategy,
    enumeration2: UnitStatusRemovalStrategy
  ): boolean
  enumerationsEqual(
    enumeration1: RevivePointSelectionStrategy,
    enumeration2: RevivePointSelectionStrategy
  ): boolean
  enumerationsEqual(enumeration1: CauseOfBeingDown, enumeration2: CauseOfBeingDown): boolean
  enumerationsEqual(
    enumeration1: TrigonometricFunction,
    enumeration2: TrigonometricFunction
  ): boolean
  enumerationsEqual(enumeration1: DisruptorDeviceType, enumeration2: DisruptorDeviceType): boolean
  enumerationsEqual(
    enumeration1: DisruptorDeviceOrientation,
    enumeration2: DisruptorDeviceOrientation
  ): boolean
  enumerationsEqual(enumeration1: UIControlGroupStatus, enumeration2: UIControlGroupStatus): boolean
  enumerationsEqual(enumeration1: TargetType, enumeration2: TargetType): boolean
  enumerationsEqual(enumeration1: TriggerRestriction, enumeration2: TriggerRestriction): boolean
  enumerationsEqual(enumeration1: HitType, enumeration2: HitType): boolean
  enumerationsEqual(enumeration1: AttackType, enumeration2: AttackType): boolean
  enumerationsEqual(enumeration1: HitPerformanceLevel, enumeration2: HitPerformanceLevel): boolean
  enumerationsEqual(enumeration1: CharacterSkillSlot, enumeration2: CharacterSkillSlot): boolean
  enumerationsEqual(enumeration1: SoundAttenuationMode, enumeration2: SoundAttenuationMode): boolean
  enumerationsEqual(
    enumeration1: SelectCompletionReason,
    enumeration2: SelectCompletionReason
  ): boolean
  enumerationsEqual(enumeration1: SettlementStatus, enumeration2: SettlementStatus): boolean
  enumerationsEqual(enumeration1: ReasonForItemChange, enumeration2: ReasonForItemChange): boolean
  enumerationsEqual(enumeration1: ItemLootType, enumeration2: ItemLootType): boolean
  enumerationsEqual(enumeration1: DecisionRefreshMode, enumeration2: DecisionRefreshMode): boolean
  enumerationsEqual(
    enumeration1: ElementalReactionType,
    enumeration2: ElementalReactionType
  ): boolean
  enumerationsEqual(enumeration1: InterruptStatus, enumeration2: InterruptStatus): boolean
  enumerationsEqual(enumeration1: GameplayMode, enumeration2: GameplayMode): boolean
  enumerationsEqual(enumeration1: InputDeviceType, enumeration2: InputDeviceType): boolean
  enumerationsEqual<T extends EnumerationType>(
    enumeration1: EnumerationTypeMap[T],
    enumeration2: EnumerationTypeMap[T]
  ): boolean {
    const enumeration1Obj = parseValue(enumeration1, 'enum')
    const enumeration2Obj = parseValue(enumeration2, 'enum')

    if (enumeration1Obj.getClassName() !== enumeration2Obj.getClassName()) {
      throw new Error('enumeration type mismatch')
    }

    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'enumerations_equal',
      args: [enumeration1Obj, enumeration2Obj]
    })
    const ret = new bool()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as boolean
  }

  /**
   * 같은 타입의 입력 파라미터를 최대 100개까지 하나의 리스트로 조합한다
   *
   * @param _0to99 리스트로 조합할 파라미터 (최대 100개)
   * @returns 조합된 리스트
   */
  assemblyList(_0to99: FloatValue[]): number[]
  assemblyList(_0to99: FloatValue[], type: 'float'): number[]
  assemblyList(_0to99: IntValue[]): bigint[]
  assemblyList(_0to99: IntValue[], type: 'int'): bigint[]
  assemblyList(_0to99: BoolValue[]): boolean[]
  assemblyList(_0to99: BoolValue[], type: 'bool'): boolean[]
  assemblyList(_0to99: ConfigIdValue[], type: 'config_id'): configId[]
  assemblyList(_0to99: EntityValue[]): entity[]
  assemblyList(_0to99: EntityValue[], type: 'entity'): entity[]
  assemblyList(_0to99: FactionValue[], type: 'faction'): faction[]
  assemblyList(_0to99: GuidValue[], type: 'guid'): guid[]
  assemblyList(_0to99: PrefabIdValue[], type: 'prefab_id'): prefabId[]
  assemblyList(_0to99: StrValue[]): string[]
  assemblyList(_0to99: StrValue[], type: 'str'): string[]
  assemblyList(_0to99: Vec3Value[]): vec3[]
  assemblyList(_0to99: Vec3Value[], type: 'vec3'): vec3[]
  assemblyList<
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
  >(_0to99: RuntimeParameterValueTypeMap[T][], type?: T): RuntimeReturnValueTypeMap[`${T}_list`] {
    // 支持无限嵌套, 以便预处理器处理
    if (z.instanceof(list).safeParse(_0to99).success) {
      return _0to99 as unknown as RuntimeReturnValueTypeMap[`${T}_list`]
    }

    if (_0to99.length === 0) throw new Error('Parameters cannot be empty')

    // @ts-ignore 针对 assemblyDictionary 的特殊处理
    if (typeof _0to99[0] === 'object' && 'k' in _0to99[0] && 'v' in _0to99[0])
      return _0to99 as unknown as RuntimeReturnValueTypeMap[`${T}_list`]

    if (_0to99.length > 100) throw new Error('Parameters cannot be more than 100')

    const isValueTypeList = z.instanceof(list).safeParse(_0to99[0]).success
    if (isValueTypeList) {
      // 列表嵌套只可能是三维向量列表
      _0to99 = _0to99.map((item) =>
        (item as unknown as list).getVec3Value()
      ) as RuntimeParameterValueTypeMap[T][]
    }

    let genericType = matchTypes(
      [
        'float',
        'int',
        // 以上浮点和整数必须前置, 以便字面量匹配到正确类型
        'bool',
        'config_id',
        'entity',
        'faction',
        'guid',
        'prefab_id',
        'str',
        'vec3'
      ],
      ..._0to99
    )
    if (type) genericType = type
    const _0to99Obj = _0to99.map((v) => parseValue(v, genericType))
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'assembly_list',
      args: _0to99Obj
    })
    const ret = new list(genericType)
    ret.markPin(ref, 'list', 0)

    // 预处理自动包裹列表可能误将三维向量处理为列表, 此处保留原值以便还原
    // 当后续被用作三维向量时, 先前注册的assembly_list节点由于未被引用, 会被自动剔除
    // 此处特殊处理以便复杂情况下的参数传递更加可靠, 避免过度依赖编译器检测类型
    if (_0to99.length === 3 && genericType === 'float') {
      ret.setVec3Value([..._0to99] as unknown as [number, number, number])
    }

    return ret as unknown as RuntimeReturnValueTypeMap[`${T}_list`]
  }

  /**
   * @gsts
   *
   * 지정한 타입의 빈 리스트를 생성한다.
   */
  emptyList(type: 'bool'): boolean[]
  emptyList(type: 'int'): bigint[]
  emptyList(type: 'float'): number[]
  emptyList(type: 'str'): string[]
  emptyList(type: 'vec3'): vec3[]
  emptyList(type: 'guid'): guid[]
  emptyList(type: 'entity'): entity[]
  emptyList(type: 'prefab_id'): prefabId[]
  emptyList(type: 'config_id'): configId[]
  emptyList(type: 'faction'): faction[]
  emptyList(
    type:
      | 'bool'
      | 'int'
      | 'float'
      | 'str'
      | 'vec3'
      | 'guid'
      | 'entity'
      | 'prefab_id'
      | 'config_id'
      | 'faction'
  ):
    | boolean[]
    | bigint[]
    | number[]
    | string[]
    | vec3[]
    | guid[]
    | entity[]
    | prefabId[]
    | configId[]
    | faction[] {
    // @ts-ignore 针对 emptyList 的特殊处理
    return this.emptyLocalVariableList(type).value
  }

  /**
   * @gsts
   *
   * 빈 리스트 로컬 변수를 선언하고 localVariable/value를 반환한다.
   */
  emptyLocalVariableList(type: 'bool'): { localVariable: localVariable; value: boolean[] }
  emptyLocalVariableList(type: 'int'): { localVariable: localVariable; value: bigint[] }
  emptyLocalVariableList(type: 'float'): { localVariable: localVariable; value: number[] }
  emptyLocalVariableList(type: 'str'): { localVariable: localVariable; value: string[] }
  emptyLocalVariableList(type: 'vec3'): { localVariable: localVariable; value: vec3[] }
  emptyLocalVariableList(type: 'guid'): { localVariable: localVariable; value: guid[] }
  emptyLocalVariableList(type: 'entity'): { localVariable: localVariable; value: entity[] }
  emptyLocalVariableList(type: 'prefab_id'): { localVariable: localVariable; value: prefabId[] }
  emptyLocalVariableList(type: 'config_id'): { localVariable: localVariable; value: configId[] }
  emptyLocalVariableList(type: 'faction'): { localVariable: localVariable; value: faction[] }
  emptyLocalVariableList(
    type:
      | 'bool'
      | 'int'
      | 'float'
      | 'str'
      | 'vec3'
      | 'guid'
      | 'entity'
      | 'prefab_id'
      | 'config_id'
      | 'faction'
  ) {
    const init = new listLiteral(type)
    // @ts-ignore allow
    return this.getLocalVariable(init) as {
      localVariable: localVariable
      value: RuntimeReturnValueTypeMap[`${typeof type}_list`]
    }
  }

  /**
   * 최대 50개의 키-값 쌍을 하나의 딕셔너리로 조합한다
   *
   * GSTS 참고: 이 메서드로 선언된 딕셔너리는 수정할 수 없으며, 수정이 필요한 경우 노드 그래프 변수 딕셔너리를 선언해야 한다
   *
   * @returns 딕셔너리
   */
  assemblyDictionary(pairs: { k: IntValue; v: FloatValue }[]): ReadonlyDict<'int', 'float'>
  assemblyDictionary(pairs: { k: IntValue; v: IntValue }[]): ReadonlyDict<'int', 'int'>
  assemblyDictionary(pairs: { k: IntValue; v: BoolValue }[]): ReadonlyDict<'int', 'bool'>
  assemblyDictionary(pairs: { k: IntValue; v: ConfigIdValue }[]): ReadonlyDict<'int', 'config_id'>
  assemblyDictionary(pairs: { k: IntValue; v: EntityValue }[]): ReadonlyDict<'int', 'entity'>
  assemblyDictionary(pairs: { k: IntValue; v: FactionValue }[]): ReadonlyDict<'int', 'faction'>
  assemblyDictionary(pairs: { k: IntValue; v: GuidValue }[]): ReadonlyDict<'int', 'guid'>
  assemblyDictionary(pairs: { k: IntValue; v: PrefabIdValue }[]): ReadonlyDict<'int', 'prefab_id'>
  assemblyDictionary(pairs: { k: IntValue; v: StrValue }[]): ReadonlyDict<'int', 'str'>
  assemblyDictionary(pairs: { k: IntValue; v: vec3 }[]): ReadonlyDict<'int', 'vec3'>
  assemblyDictionary(pairs: { k: IntValue; v: FloatValue[] }[]): ReadonlyDict<'int', 'float_list'>
  assemblyDictionary(pairs: { k: IntValue; v: IntValue[] }[]): ReadonlyDict<'int', 'int_list'>
  assemblyDictionary(pairs: { k: IntValue; v: BoolValue[] }[]): ReadonlyDict<'int', 'bool_list'>
  assemblyDictionary(
    pairs: { k: IntValue; v: ConfigIdValue[] }[]
  ): ReadonlyDict<'int', 'config_id_list'>
  assemblyDictionary(pairs: { k: IntValue; v: EntityValue[] }[]): ReadonlyDict<'int', 'entity_list'>
  assemblyDictionary(
    pairs: { k: IntValue; v: FactionValue[] }[]
  ): ReadonlyDict<'int', 'faction_list'>
  assemblyDictionary(pairs: { k: IntValue; v: GuidValue[] }[]): ReadonlyDict<'int', 'guid_list'>
  assemblyDictionary(
    pairs: { k: IntValue; v: PrefabIdValue[] }[]
  ): ReadonlyDict<'int', 'prefab_id_list'>
  assemblyDictionary(pairs: { k: IntValue; v: StrValue[] }[]): ReadonlyDict<'int', 'str_list'>
  assemblyDictionary(pairs: { k: IntValue; v: Vec3Value[] }[]): ReadonlyDict<'int', 'vec3_list'>
  assemblyDictionary(pairs: { k: StrValue; v: FloatValue }[]): ReadonlyDict<'str', 'float'>
  assemblyDictionary(pairs: { k: StrValue; v: IntValue }[]): ReadonlyDict<'str', 'int'>
  assemblyDictionary(pairs: { k: StrValue; v: BoolValue }[]): ReadonlyDict<'str', 'bool'>
  assemblyDictionary(pairs: { k: StrValue; v: ConfigIdValue }[]): ReadonlyDict<'str', 'config_id'>
  assemblyDictionary(pairs: { k: StrValue; v: EntityValue }[]): ReadonlyDict<'str', 'entity'>
  assemblyDictionary(pairs: { k: StrValue; v: FactionValue }[]): ReadonlyDict<'str', 'faction'>
  assemblyDictionary(pairs: { k: StrValue; v: GuidValue }[]): ReadonlyDict<'str', 'guid'>
  assemblyDictionary(pairs: { k: StrValue; v: PrefabIdValue }[]): ReadonlyDict<'str', 'prefab_id'>
  assemblyDictionary(pairs: { k: StrValue; v: StrValue }[]): ReadonlyDict<'str', 'str'>
  assemblyDictionary(pairs: { k: StrValue; v: vec3 }[]): ReadonlyDict<'str', 'vec3'>
  assemblyDictionary(pairs: { k: StrValue; v: FloatValue[] }[]): ReadonlyDict<'str', 'float_list'>
  assemblyDictionary(pairs: { k: StrValue; v: IntValue[] }[]): ReadonlyDict<'str', 'int_list'>
  assemblyDictionary(pairs: { k: StrValue; v: BoolValue[] }[]): ReadonlyDict<'str', 'bool_list'>
  assemblyDictionary(
    pairs: { k: StrValue; v: ConfigIdValue[] }[]
  ): ReadonlyDict<'str', 'config_id_list'>
  assemblyDictionary(pairs: { k: StrValue; v: EntityValue[] }[]): ReadonlyDict<'str', 'entity_list'>
  assemblyDictionary(
    pairs: { k: StrValue; v: FactionValue[] }[]
  ): ReadonlyDict<'str', 'faction_list'>
  assemblyDictionary(pairs: { k: StrValue; v: GuidValue[] }[]): ReadonlyDict<'str', 'guid_list'>
  assemblyDictionary(
    pairs: { k: StrValue; v: PrefabIdValue[] }[]
  ): ReadonlyDict<'str', 'prefab_id_list'>
  assemblyDictionary(pairs: { k: StrValue; v: StrValue[] }[]): ReadonlyDict<'str', 'str_list'>
  assemblyDictionary(pairs: { k: StrValue; v: Vec3Value[] }[]): ReadonlyDict<'str', 'vec3_list'>
  assemblyDictionary(pairs: { k: EntityValue; v: FloatValue }[]): ReadonlyDict<'entity', 'float'>
  assemblyDictionary(pairs: { k: EntityValue; v: IntValue }[]): ReadonlyDict<'entity', 'int'>
  assemblyDictionary(pairs: { k: EntityValue; v: BoolValue }[]): ReadonlyDict<'entity', 'bool'>
  assemblyDictionary(
    pairs: { k: EntityValue; v: ConfigIdValue }[]
  ): ReadonlyDict<'entity', 'config_id'>
  assemblyDictionary(pairs: { k: EntityValue; v: EntityValue }[]): ReadonlyDict<'entity', 'entity'>
  assemblyDictionary(
    pairs: { k: EntityValue; v: FactionValue }[]
  ): ReadonlyDict<'entity', 'faction'>
  assemblyDictionary(pairs: { k: EntityValue; v: GuidValue }[]): ReadonlyDict<'entity', 'guid'>
  assemblyDictionary(
    pairs: { k: EntityValue; v: PrefabIdValue }[]
  ): ReadonlyDict<'entity', 'prefab_id'>
  assemblyDictionary(pairs: { k: EntityValue; v: StrValue }[]): ReadonlyDict<'entity', 'str'>
  assemblyDictionary(pairs: { k: EntityValue; v: vec3 }[]): ReadonlyDict<'entity', 'vec3'>
  assemblyDictionary(
    pairs: { k: EntityValue; v: FloatValue[] }[]
  ): ReadonlyDict<'entity', 'float_list'>
  assemblyDictionary(pairs: { k: EntityValue; v: IntValue[] }[]): ReadonlyDict<'entity', 'int_list'>
  assemblyDictionary(
    pairs: { k: EntityValue; v: BoolValue[] }[]
  ): ReadonlyDict<'entity', 'bool_list'>
  assemblyDictionary(
    pairs: { k: EntityValue; v: ConfigIdValue[] }[]
  ): ReadonlyDict<'entity', 'config_id_list'>
  assemblyDictionary(
    pairs: { k: EntityValue; v: EntityValue[] }[]
  ): ReadonlyDict<'entity', 'entity_list'>
  assemblyDictionary(
    pairs: { k: EntityValue; v: FactionValue[] }[]
  ): ReadonlyDict<'entity', 'faction_list'>
  assemblyDictionary(
    pairs: { k: EntityValue; v: GuidValue[] }[]
  ): ReadonlyDict<'entity', 'guid_list'>
  assemblyDictionary(
    pairs: { k: EntityValue; v: PrefabIdValue[] }[]
  ): ReadonlyDict<'entity', 'prefab_id_list'>
  assemblyDictionary(pairs: { k: EntityValue; v: StrValue[] }[]): ReadonlyDict<'entity', 'str_list'>
  assemblyDictionary(
    pairs: { k: EntityValue; v: Vec3Value[] }[]
  ): ReadonlyDict<'entity', 'vec3_list'>
  assemblyDictionary(pairs: { k: GuidValue; v: FloatValue }[]): ReadonlyDict<'guid', 'float'>
  assemblyDictionary(pairs: { k: GuidValue; v: IntValue }[]): ReadonlyDict<'guid', 'int'>
  assemblyDictionary(pairs: { k: GuidValue; v: BoolValue }[]): ReadonlyDict<'guid', 'bool'>
  assemblyDictionary(pairs: { k: GuidValue; v: ConfigIdValue }[]): ReadonlyDict<'guid', 'config_id'>
  assemblyDictionary(pairs: { k: GuidValue; v: EntityValue }[]): ReadonlyDict<'guid', 'entity'>
  assemblyDictionary(pairs: { k: GuidValue; v: FactionValue }[]): ReadonlyDict<'guid', 'faction'>
  assemblyDictionary(pairs: { k: GuidValue; v: GuidValue }[]): ReadonlyDict<'guid', 'guid'>
  assemblyDictionary(pairs: { k: GuidValue; v: PrefabIdValue }[]): ReadonlyDict<'guid', 'prefab_id'>
  assemblyDictionary(pairs: { k: GuidValue; v: StrValue }[]): ReadonlyDict<'guid', 'str'>
  assemblyDictionary(pairs: { k: GuidValue; v: vec3 }[]): ReadonlyDict<'guid', 'vec3'>
  assemblyDictionary(pairs: { k: GuidValue; v: FloatValue[] }[]): ReadonlyDict<'guid', 'float_list'>
  assemblyDictionary(pairs: { k: GuidValue; v: IntValue[] }[]): ReadonlyDict<'guid', 'int_list'>
  assemblyDictionary(pairs: { k: GuidValue; v: BoolValue[] }[]): ReadonlyDict<'guid', 'bool_list'>
  assemblyDictionary(
    pairs: { k: GuidValue; v: ConfigIdValue[] }[]
  ): ReadonlyDict<'guid', 'config_id_list'>
  assemblyDictionary(
    pairs: { k: GuidValue; v: EntityValue[] }[]
  ): ReadonlyDict<'guid', 'entity_list'>
  assemblyDictionary(
    pairs: { k: GuidValue; v: FactionValue[] }[]
  ): ReadonlyDict<'guid', 'faction_list'>
  assemblyDictionary(pairs: { k: GuidValue; v: GuidValue[] }[]): ReadonlyDict<'guid', 'guid_list'>
  assemblyDictionary(
    pairs: { k: GuidValue; v: PrefabIdValue[] }[]
  ): ReadonlyDict<'guid', 'prefab_id_list'>
  assemblyDictionary(pairs: { k: GuidValue; v: StrValue[] }[]): ReadonlyDict<'guid', 'str_list'>
  assemblyDictionary(pairs: { k: GuidValue; v: Vec3Value[] }[]): ReadonlyDict<'guid', 'vec3_list'>
  assemblyDictionary(pairs: { k: FactionValue; v: FloatValue }[]): ReadonlyDict<'faction', 'float'>
  assemblyDictionary(pairs: { k: FactionValue; v: IntValue }[]): ReadonlyDict<'faction', 'int'>
  assemblyDictionary(pairs: { k: FactionValue; v: BoolValue }[]): ReadonlyDict<'faction', 'bool'>
  assemblyDictionary(
    pairs: { k: FactionValue; v: ConfigIdValue }[]
  ): ReadonlyDict<'faction', 'config_id'>
  assemblyDictionary(
    pairs: { k: FactionValue; v: EntityValue }[]
  ): ReadonlyDict<'faction', 'entity'>
  assemblyDictionary(
    pairs: { k: FactionValue; v: FactionValue }[]
  ): ReadonlyDict<'faction', 'faction'>
  assemblyDictionary(pairs: { k: FactionValue; v: GuidValue }[]): ReadonlyDict<'faction', 'guid'>
  assemblyDictionary(
    pairs: { k: FactionValue; v: PrefabIdValue }[]
  ): ReadonlyDict<'faction', 'prefab_id'>
  assemblyDictionary(pairs: { k: FactionValue; v: StrValue }[]): ReadonlyDict<'faction', 'str'>
  assemblyDictionary(pairs: { k: FactionValue; v: vec3 }[]): ReadonlyDict<'faction', 'vec3'>
  assemblyDictionary(
    pairs: { k: FactionValue; v: FloatValue[] }[]
  ): ReadonlyDict<'faction', 'float_list'>
  assemblyDictionary(
    pairs: { k: FactionValue; v: IntValue[] }[]
  ): ReadonlyDict<'faction', 'int_list'>
  assemblyDictionary(
    pairs: { k: FactionValue; v: BoolValue[] }[]
  ): ReadonlyDict<'faction', 'bool_list'>
  assemblyDictionary(
    pairs: { k: FactionValue; v: ConfigIdValue[] }[]
  ): ReadonlyDict<'faction', 'config_id_list'>
  assemblyDictionary(
    pairs: { k: FactionValue; v: EntityValue[] }[]
  ): ReadonlyDict<'faction', 'entity_list'>
  assemblyDictionary(
    pairs: { k: FactionValue; v: FactionValue[] }[]
  ): ReadonlyDict<'faction', 'faction_list'>
  assemblyDictionary(
    pairs: { k: FactionValue; v: GuidValue[] }[]
  ): ReadonlyDict<'faction', 'guid_list'>
  assemblyDictionary(
    pairs: { k: FactionValue; v: PrefabIdValue[] }[]
  ): ReadonlyDict<'faction', 'prefab_id_list'>
  assemblyDictionary(
    pairs: { k: FactionValue; v: StrValue[] }[]
  ): ReadonlyDict<'faction', 'str_list'>
  assemblyDictionary(
    pairs: { k: FactionValue; v: Vec3Value[] }[]
  ): ReadonlyDict<'faction', 'vec3_list'>
  assemblyDictionary(
    pairs: { k: ConfigIdValue; v: FloatValue }[]
  ): ReadonlyDict<'config_id', 'float'>
  assemblyDictionary(pairs: { k: ConfigIdValue; v: IntValue }[]): ReadonlyDict<'config_id', 'int'>
  assemblyDictionary(pairs: { k: ConfigIdValue; v: BoolValue }[]): ReadonlyDict<'config_id', 'bool'>
  assemblyDictionary(
    pairs: { k: ConfigIdValue; v: ConfigIdValue }[]
  ): ReadonlyDict<'config_id', 'config_id'>
  assemblyDictionary(
    pairs: { k: ConfigIdValue; v: EntityValue }[]
  ): ReadonlyDict<'config_id', 'entity'>
  assemblyDictionary(
    pairs: { k: ConfigIdValue; v: FactionValue }[]
  ): ReadonlyDict<'config_id', 'faction'>
  assemblyDictionary(pairs: { k: ConfigIdValue; v: GuidValue }[]): ReadonlyDict<'config_id', 'guid'>
  assemblyDictionary(
    pairs: { k: ConfigIdValue; v: PrefabIdValue }[]
  ): ReadonlyDict<'config_id', 'prefab_id'>
  assemblyDictionary(pairs: { k: ConfigIdValue; v: StrValue }[]): ReadonlyDict<'config_id', 'str'>
  assemblyDictionary(pairs: { k: ConfigIdValue; v: vec3 }[]): ReadonlyDict<'config_id', 'vec3'>
  assemblyDictionary(
    pairs: { k: ConfigIdValue; v: FloatValue[] }[]
  ): ReadonlyDict<'config_id', 'float_list'>
  assemblyDictionary(
    pairs: { k: ConfigIdValue; v: IntValue[] }[]
  ): ReadonlyDict<'config_id', 'int_list'>
  assemblyDictionary(
    pairs: { k: ConfigIdValue; v: BoolValue[] }[]
  ): ReadonlyDict<'config_id', 'bool_list'>
  assemblyDictionary(
    pairs: { k: ConfigIdValue; v: ConfigIdValue[] }[]
  ): ReadonlyDict<'config_id', 'config_id_list'>
  assemblyDictionary(
    pairs: { k: ConfigIdValue; v: EntityValue[] }[]
  ): ReadonlyDict<'config_id', 'entity_list'>
  assemblyDictionary(
    pairs: { k: ConfigIdValue; v: FactionValue[] }[]
  ): ReadonlyDict<'config_id', 'faction_list'>
  assemblyDictionary(
    pairs: { k: ConfigIdValue; v: GuidValue[] }[]
  ): ReadonlyDict<'config_id', 'guid_list'>
  assemblyDictionary(
    pairs: { k: ConfigIdValue; v: PrefabIdValue[] }[]
  ): ReadonlyDict<'config_id', 'prefab_id_list'>
  assemblyDictionary(
    pairs: { k: ConfigIdValue; v: StrValue[] }[]
  ): ReadonlyDict<'config_id', 'str_list'>
  assemblyDictionary(
    pairs: { k: ConfigIdValue; v: Vec3Value[] }[]
  ): ReadonlyDict<'config_id', 'vec3_list'>
  assemblyDictionary(
    pairs: { k: PrefabIdValue; v: FloatValue }[]
  ): ReadonlyDict<'prefab_id', 'float'>
  assemblyDictionary(pairs: { k: PrefabIdValue; v: IntValue }[]): ReadonlyDict<'prefab_id', 'int'>
  assemblyDictionary(pairs: { k: PrefabIdValue; v: BoolValue }[]): ReadonlyDict<'prefab_id', 'bool'>
  assemblyDictionary(
    pairs: { k: PrefabIdValue; v: ConfigIdValue }[]
  ): ReadonlyDict<'prefab_id', 'config_id'>
  assemblyDictionary(
    pairs: { k: PrefabIdValue; v: EntityValue }[]
  ): ReadonlyDict<'prefab_id', 'entity'>
  assemblyDictionary(
    pairs: { k: PrefabIdValue; v: FactionValue }[]
  ): ReadonlyDict<'prefab_id', 'faction'>
  assemblyDictionary(pairs: { k: PrefabIdValue; v: GuidValue }[]): ReadonlyDict<'prefab_id', 'guid'>
  assemblyDictionary(
    pairs: { k: PrefabIdValue; v: PrefabIdValue }[]
  ): ReadonlyDict<'prefab_id', 'prefab_id'>
  assemblyDictionary(pairs: { k: PrefabIdValue; v: StrValue }[]): ReadonlyDict<'prefab_id', 'str'>
  assemblyDictionary(pairs: { k: PrefabIdValue; v: vec3 }[]): ReadonlyDict<'prefab_id', 'vec3'>
  assemblyDictionary(
    pairs: { k: PrefabIdValue; v: FloatValue[] }[]
  ): ReadonlyDict<'prefab_id', 'float_list'>
  assemblyDictionary(
    pairs: { k: PrefabIdValue; v: IntValue[] }[]
  ): ReadonlyDict<'prefab_id', 'int_list'>
  assemblyDictionary(
    pairs: { k: PrefabIdValue; v: BoolValue[] }[]
  ): ReadonlyDict<'prefab_id', 'bool_list'>
  assemblyDictionary(
    pairs: { k: PrefabIdValue; v: ConfigIdValue[] }[]
  ): ReadonlyDict<'prefab_id', 'config_id_list'>
  assemblyDictionary(
    pairs: { k: PrefabIdValue; v: EntityValue[] }[]
  ): ReadonlyDict<'prefab_id', 'entity_list'>
  assemblyDictionary(
    pairs: { k: PrefabIdValue; v: FactionValue[] }[]
  ): ReadonlyDict<'prefab_id', 'faction_list'>
  assemblyDictionary(
    pairs: { k: PrefabIdValue; v: GuidValue[] }[]
  ): ReadonlyDict<'prefab_id', 'guid_list'>
  assemblyDictionary(
    pairs: { k: PrefabIdValue; v: PrefabIdValue[] }[]
  ): ReadonlyDict<'prefab_id', 'prefab_id_list'>
  assemblyDictionary(
    pairs: { k: PrefabIdValue; v: StrValue[] }[]
  ): ReadonlyDict<'prefab_id', 'str_list'>
  assemblyDictionary(
    pairs: { k: PrefabIdValue; v: Vec3Value[] }[]
  ): ReadonlyDict<'prefab_id', 'vec3_list'>
  assemblyDictionary<K extends DictKeyType, V extends DictValueType>(
    pairs: {
      k: RuntimeParameterValueTypeMap[K]
      v: RuntimeParameterValueTypeMap[V]
    }[]
  ): ReadonlyDict<K, V> {
    if (pairs.length === 0) throw new Error('Pairs cannot be empty')

    if (pairs.length > 50) throw new Error('Pairs cannot be more than 50')

    const keys = pairs.map((p) => p.k)
    const keyType = matchTypes(
      ['int', 'str', 'entity', 'guid', 'faction', 'config_id', 'prefab_id'],
      ...keys
    )
    const values = pairs.map((p) => p.v)
    const valueType = matchTypes(
      [
        'float',
        'int',
        'bool',
        'config_id',
        'entity',
        'faction',
        'guid',
        'prefab_id',
        'str',
        'vec3'
      ],
      ...values
    )

    const key0to49Obj = keys.map((k) => parseValue(k, keyType))

    const isValueTypeList = z.instanceof(list).safeParse(values[0]).success
    const value0to49Obj = isValueTypeList
      ? values.map((v) => parseValue(v, (valueType + '_list') as keyof LiteralValueListTypeMap))
      : values.map((v) => parseValue(v, valueType))

    const kv0to49Args = key0to49Obj.flatMap((k, i) => [k, value0to49Obj[i]])

    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'assembly_dictionary',
      args: kv0to49Args
    })
    const retValueType = isValueTypeList ? ((valueType + '_list') as DictValueType) : valueType
    const ret = new dict(keyType, retValueType) as dict<K, V>
    ret.markPin(ref, 'dictionary', 0)
    return ret
  }

  /**
   * 대상 엔티티에 있는 지정한 커스텀 변수의 값을 설정한다
   *
   * @param targetEntity 대상 엔티티: 해당 변수가 마운트된 엔티티
   * @param variableName 변수명: 커스텀 변수의 이름, 중복 불가
   * @param variableValue 변수값: 이 변수에 할당할 값
   * @param triggerEvent 이벤트 트리거 여부: 기본값 False. False로 설정하면 이번 커스텀 변수 수정이 커스텀 변수 변경 이벤트를 발생시키지 않는다
   */
  setCustomVariable<
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
      | 'bool_list'
      | 'config_id_list'
      | 'entity_list'
      | 'faction_list'
      | 'float_list'
      | 'guid_list'
      | 'int_list'
      | 'prefab_id_list'
      | 'str_list'
      | 'vec3_list'
      | 'dict'
  >(
    targetEntity: EntityValue,
    variableName: StrValue,
    variableValue: RuntimeParameterValueTypeMap[T],
    triggerEvent: BoolValue = false
  ) {
    const genericType = matchTypes(
      [
        'float',
        'int',
        'bool',
        'config_id',
        'entity',
        'faction',
        'guid',
        'prefab_id',
        'str',
        'vec3',
        'dict'
      ],
      variableValue
    )
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const variableNameObj = parseValue(variableName, 'str')
    const isVariableValueList = z.instanceof(list).safeParse(variableValue).success
    let variableValueObj: value
    if (isVariableValueList) {
      variableValueObj = parseValue(
        variableValue,
        (genericType + '_list') as keyof LiteralValueListTypeMap
      )
    } else {
      variableValueObj = parseValue(variableValue, genericType)
    }
    const triggerEventObj = parseValue(triggerEvent, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_custom_variable',
      args: [targetEntityObj, variableNameObj, variableValueObj, triggerEventObj]
    })
  }

  /**
   * 대상 엔티티에서 지정한 커스텀 변수의 값을 반환한다. 변수가 존재하지 않으면 해당 타입의 기본값을 반환한다
   *
   * @param targetEntity 대상 엔티티
   * @param variableName 변수명
   * @returns 변수값
   */
  getCustomVariable(targetEntity: EntityValue, variableName: StrValue): generic {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const variableNameObj = parseValue(variableName, 'str')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_custom_variable',
      args: [targetEntityObj, variableNameObj]
    })
    const ret = new generic()
    ret.markPin(ref, 'variableValue', 0)
    return ret as unknown as generic
  }

  /**
   * 현재 노드 그래프 내 지정한 노드 그래프 변수의 값을 설정한다
   *
   * @param variableName 변수명: 노드 그래프 변수의 이름, 같은 노드 그래프 내 중복 불가
   * @param variableValue 변수값: 이 변수에 할당할 값
   * @param triggerEvent 이벤트 트리거 여부: 기본값 False. False로 설정하면 이번 노드 그래프 변수 수정이 변수 변경 이벤트를 발생시키지 않는다
   */
  setNodeGraphVariable<
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
      | 'bool_list'
      | 'config_id_list'
      | 'entity_list'
      | 'faction_list'
      | 'float_list'
      | 'guid_list'
      | 'int_list'
      | 'prefab_id_list'
      | 'str_list'
      | 'vec3_list'
      | 'dict'
  >(
    variableName: StrValue,
    variableValue: RuntimeParameterValueTypeMap[T],
    triggerEvent: BoolValue = false
  ) {
    const genericType = matchTypes(
      [
        'float',
        'int',
        'bool',
        'config_id',
        'entity',
        'faction',
        'guid',
        'prefab_id',
        'str',
        'vec3',
        'dict'
      ],
      variableValue
    )
    const variableNameObj = parseValue(variableName, 'str')
    const isVariableValueList = z.instanceof(list).safeParse(variableValue).success
    let variableValueObj: value
    if (isVariableValueList) {
      variableValueObj = parseValue(
        variableValue,
        (genericType + '_list') as keyof LiteralValueListTypeMap
      )
    } else {
      variableValueObj = parseValue(variableValue, genericType)
    }
    const triggerEventObj = parseValue(triggerEvent, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_node_graph_variable',
      args: [variableNameObj, variableValueObj, triggerEventObj]
    })
  }

  /**
   * @gsts
   *
   * 타입 추론이 포함된 getNodeGraphVariable의 별칭이다. 현재 노드 그래프에서 지정한 노드 그래프 변수의 값을 반환하며, 변수가 존재하지 않으면 해당 타입의 기본값을 반환한다
   *
   * @param variableName 변수명
   * @returns 변수값
   */
  get(variableName: StrValue): generic {
    const name = this.resolveLiteralVarName(variableName)
    const meta = name ? this.registry.getVariableMeta(name) : undefined
    const ret = this.getNodeGraphVariable(variableName)
    if (!meta) return ret
    if (meta.type === 'dict') {
      if (!meta.dict) return ret
      return ret.asDict(meta.dict.k, meta.dict.v) as unknown as generic
    }
    return ret.asType(meta.type as never) as unknown as generic
  }

  /**
   * @gsts
   *
   * 타입 추론이 포함된 setNodeGraphVariable의 별칭이다. 현재 노드 그래프 내 지정한 노드 그래프 변수의 값을 설정한다
   *
   * @param variableName 변수명: 노드 그래프 변수의 이름. 같은 노드 그래프 내에서 중복 불가
   * @param variableValue 변수값: 해당 변수에 대입할 값
   * @param triggerEvent 이벤트 발생 여부: 기본값 False. False로 설정하면 이번 노드 그래프 변수 수정이 변수 변경 이벤트를 발생시키지 않는다
   */
  set<
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
      | 'bool_list'
      | 'config_id_list'
      | 'entity_list'
      | 'faction_list'
      | 'float_list'
      | 'guid_list'
      | 'int_list'
      | 'prefab_id_list'
      | 'str_list'
      | 'vec3_list'
      | 'dict'
  >(
    variableName: StrValue,
    variableValue: RuntimeParameterValueTypeMap[T],
    triggerEvent: BoolValue = false
  ) {
    const name = this.resolveLiteralVarName(variableName)
    const meta = name ? this.registry.getVariableMeta(name) : undefined
    if (!meta) {
      this.setNodeGraphVariable(variableName, variableValue as never, triggerEvent)
      return
    }

    const variableNameObj = parseValue(variableName, 'str')
    const triggerEventObj = parseValue(triggerEvent, 'bool')
    let variableValueObj: value

    if (meta.type === 'dict') {
      if (!meta.dict) {
        throw new Error(`[error] dict variable "${name}" missing key/value types`)
      }
      const dictValue = parseValue(variableValue, 'dict')
      if (dictValue.getKeyType() !== meta.dict.k || dictValue.getValueType() !== meta.dict.v) {
        throw new Error(`[error] dict value type mismatch for "${name}"`)
      }
      variableValueObj = dictValue
    } else {
      variableValueObj = parseValue(variableValue, meta.type as never)
    }

    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_node_graph_variable',
      args: [variableNameObj, variableValueObj, triggerEventObj]
    })
  }

  /**
   * @gsts internal
   *
   * 노드 그래프 변수가 존재하는지 확인한다 (내부 런타임 헬퍼에서 사용).
   */
  __gstsEnsureVariable(
    name: string,
    type: LiteralValueType,
    opts?: { dict?: { k: DictKeyType; v: DictValueType }; value?: unknown; length?: number }
  ) {
    if (type === 'dict' && !opts?.dict) {
      throw new Error(`[error] dict variable "${name}" missing key/value types`)
    }
    const variable: Variable =
      type === 'dict'
        ? {
            name,
            type: 'dict',
            dict: opts?.dict as { k: DictKeyType; v: DictValueType }
          }
        : {
            name,
            type
          }
    if (opts?.value !== undefined) {
      variable.value = opts.value as never
    }
    if (opts?.length !== undefined && type !== 'dict') {
      ;(variable as Extract<Variable, { type: Exclude<LiteralValueType, 'dict'> }>).length =
        opts.length
    }
    this.registry.ensureVariable(variable, {
      type,
      dict: opts?.dict
    })
  }

  /**
   * @gsts internal
   *
   * 타이머용 캡처 딕셔너리를 등록한다.
   */
  __gstsRegisterTimerCaptureDict(name: string, valueType: DictValueType) {
    this.registry.registerTimerCaptureDict(name, valueType)
  }

  /**
   * @gsts internal
   *
   * 타이머 캡처 메타데이터를 핸들에 연결한다.
   */
  __gstsAttachTimerHandle(
    timerName: StrValue,
    dicts: { name: string; valueType: DictValueType }[]
  ): string {
    const handle = typeof timerName === 'string' ? new str(timerName) : timerName
    ;(handle as unknown as Record<string, unknown>).__gstsTimerCaptureDicts = dicts
    return handle as unknown as string
  }

  /**
   * @gsts internal
   *
   * 타이머 이름을 기준으로 등록된 모든 캡처 딕셔너리에서 타이머 캡처 항목을 삭제한다.
   */
  __gstsClearTimerCaptures(
    timerName: StrValue,
    dicts: { name: string; valueType: DictValueType }[]
  ) {
    if (!dicts.length) return
    const nameObj = parseValue(timerName, 'str')
    for (const dictInfo of dicts) {
      const dictObj = this.getNodeGraphVariable(dictInfo.name).asDict('str', dictInfo.valueType)
      this.removeKeyValuePairsFromDictionaryByKey(dictObj, nameObj)
    }
  }

  /**
   * @gsts internal
   *
   * 타이머 트리거 이벤트 핸들러를 등록한다.
   */
  __gstsRegisterTimerHandler(
    handler: (
      evt: ServerEventPayloads['whenTimerIsTriggered'],
      f: ServerExecutionFlowFunctions
    ) => void
  ) {
    this.registry.runServerHandler('whenTimerIsTriggered', handler as never)
  }

  /**
   * 현재 노드 그래프에서 지정한 노드 그래프 변수의 값을 반환한다. 변수가 존재하지 않으면 해당 타입의 기본값을 반환한다
   *
   * @param variableName 변수명
   * @returns 변수값
   */
  getNodeGraphVariable(variableName: StrValue): generic {
    const variableNameObj = parseValue(variableName, 'str')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_node_graph_variable',
      args: [variableNameObj]
    })
    const ret = new generic()
    ret.markPin(ref, 'variableValue', 0)
    return ret as unknown as generic
  }

  /**
   * 쿼리 노드 [로컬 변수 가져오기]에 연결되면 해당 로컬 변수의 값을 덮어쓴다
   *
   * @param localVariable 로컬 변수: 데이터를 저장하는 컨테이너
   * @param value 값: 이 로컬 변수를 덮어쓸 값
   */
  setLocalVariable<
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
      | 'bool_list'
      | 'config_id_list'
      | 'entity_list'
      | 'faction_list'
      | 'float_list'
      | 'guid_list'
      | 'int_list'
      | 'prefab_id_list'
      | 'str_list'
      | 'vec3_list'
  >(localVariable: LocalVariableValue, value: RuntimeParameterValueTypeMap[T]) {
    const genericType = matchTypes(
      [
        'float',
        'int',
        'bool',
        'config_id',
        'entity',
        'faction',
        'guid',
        'prefab_id',
        'str',
        'vec3'
      ],
      value
    )
    const localVariableObj = parseValue(localVariable, 'local_variable')
    const isValueObjList = z.instanceof(list).safeParse(value).success
    let valueObj: value
    if (isValueObjList) {
      valueObj = parseValue(value, (genericType + '_list') as keyof LiteralValueListTypeMap)
    } else {
      valueObj = parseValue(value, genericType)
    }
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_local_variable',
      args: [localVariableObj, valueObj]
    })
  }

  /**
   * @gsts
   *
   * 로컬 변수를 "빈" 기본값으로 선언하고, 선택적으로 Set Local Variable을 통해 초기값을 설정한다.
   *
   * 목적: init을 Get Local Variable의 initialValue로 직접 사용하면 노드 그래프가 반복 평가하는 문제를 방지하기 위해, get(empty) + set(init) 패턴을 사용한다
   */
  initLocalVariable(
    type: 'bool',
    init?: BoolValue
  ): { localVariable: localVariable; value: boolean }
  initLocalVariable(type: 'int', init?: IntValue): { localVariable: localVariable; value: bigint }
  initLocalVariable(
    type: 'float',
    init?: FloatValue
  ): { localVariable: localVariable; value: number }
  initLocalVariable(type: 'str', init?: StrValue): { localVariable: localVariable; value: string }
  // @ts-ignore allow
  initLocalVariable(type: 'vec3', init?: Vec3Value): { localVariable: localVariable; value: vec3 }
  initLocalVariable(type: 'guid', init?: GuidValue): { localVariable: localVariable; value: guid }
  initLocalVariable(
    type: 'entity',
    init?: EntityValue
  ): { localVariable: localVariable; value: entity }
  initLocalVariable(
    type: 'prefab_id',
    init?: PrefabIdValue
  ): { localVariable: localVariable; value: prefabId }
  initLocalVariable(
    type: 'config_id',
    init?: ConfigIdValue
  ): { localVariable: localVariable; value: configId }
  initLocalVariable(
    type: 'faction',
    init?: FactionValue
  ): { localVariable: localVariable; value: faction }
  initLocalVariable(
    type: 'bool_list',
    init?: BoolValue[]
  ): { localVariable: localVariable; value: boolean[] }
  initLocalVariable(
    type: 'int_list',
    init?: IntValue[]
  ): { localVariable: localVariable; value: bigint[] }
  initLocalVariable(
    type: 'float_list',
    init?: FloatValue[]
  ): { localVariable: localVariable; value: number[] }
  initLocalVariable(
    type: 'str_list',
    init?: StrValue[]
  ): { localVariable: localVariable; value: string[] }
  initLocalVariable(
    type: 'vec3_list',
    init?: Vec3Value[]
  ): { localVariable: localVariable; value: vec3[] }
  initLocalVariable(
    type: 'guid_list',
    init?: GuidValue[]
  ): { localVariable: localVariable; value: guid[] }
  initLocalVariable(
    type: 'entity_list',
    init?: EntityValue[]
  ): { localVariable: localVariable; value: entity[] }
  initLocalVariable(
    type: 'prefab_id_list',
    init?: PrefabIdValue[]
  ): { localVariable: localVariable; value: prefabId[] }
  initLocalVariable(
    type: 'config_id_list',
    init?: ConfigIdValue[]
  ): { localVariable: localVariable; value: configId[] }
  initLocalVariable(
    type: 'faction_list',
    init?: FactionValue[]
  ): { localVariable: localVariable; value: faction[] }
  initLocalVariable<
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
      | 'bool_list'
      | 'config_id_list'
      | 'entity_list'
      | 'faction_list'
      | 'float_list'
      | 'guid_list'
      | 'int_list'
      | 'prefab_id_list'
      | 'str_list'
      | 'vec3_list'
  >(type: T, init?: RuntimeParameterValueTypeMap[T]) {
    switch (type) {
      case 'bool': {
        const v = this.getLocalVariable(false)
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
      case 'int': {
        const v = this.getLocalVariable(0n)
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
      case 'float': {
        const v = this.getLocalVariable(0)
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
      case 'str': {
        const v = this.getLocalVariable('')
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
      case 'vec3': {
        const v = this.getLocalVariable([0, 0, 0])
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
      case 'guid': {
        const v = this.getLocalVariable(new guid(0))
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
      case 'entity': {
        const e = new entity()
        e.markLiteral()
        const v = this.getLocalVariable(e)
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
      case 'prefab_id': {
        const v = this.getLocalVariable(new prefabId(0))
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
      case 'config_id': {
        const v = this.getLocalVariable(new configId(0))
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
      case 'faction': {
        const v = this.getLocalVariable(new faction(0))
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
      case 'bool_list': {
        const v = this.emptyLocalVariableList('bool')
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
      case 'int_list': {
        const v = this.emptyLocalVariableList('int')
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
      case 'float_list': {
        const v = this.emptyLocalVariableList('float')
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
      case 'str_list': {
        const v = this.emptyLocalVariableList('str')
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
      case 'vec3_list': {
        const v = this.emptyLocalVariableList('vec3')
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
      case 'guid_list': {
        const v = this.emptyLocalVariableList('guid')
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
      case 'entity_list': {
        const v = this.emptyLocalVariableList('entity')
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
      case 'prefab_id_list': {
        const v = this.emptyLocalVariableList('prefab_id')
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
      case 'config_id_list': {
        const v = this.emptyLocalVariableList('config_id')
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
      case 'faction_list': {
        const v = this.emptyLocalVariableList('faction')
        if (init !== undefined) this.setLocalVariable(v.localVariable, init)
        return v
      }
    }
  }

  /**
   * 로컬 변수를 가져오고 선택적으로 [초기값]을 설정한다. [초기값]을 설정하면 출력 파라미터 [값]은 입력한 [초기값]과 같아진다. 출력 [로컬 변수]가 실행 노드 [로컬 변수 설정]의 입력 [로컬 변수]에 연결되면, [로컬 변수 설정]의 입력 [값]이 이 쿼리 노드의 출력 [값]을 덮어쓴다. 이후 [로컬 변수 가져오기]를 사용하면 출력 [값]은 덮어쓴 값이 된다
   *
   * @param initialValue 초기값: 로컬 변수의 초기 기본값을 설정할 수 있다
   */
  getLocalVariable(initialValue: FloatValue): { localVariable: localVariable; value: number }
  getLocalVariable(initialValue: IntValue): { localVariable: localVariable; value: bigint }
  getLocalVariable(initialValue: BoolValue): { localVariable: localVariable; value: boolean }
  getLocalVariable(initialValue: ConfigIdValue): { localVariable: localVariable; value: configId }
  getLocalVariable(initialValue: EntityValue): { localVariable: localVariable; value: entity }
  getLocalVariable(initialValue: FactionValue): { localVariable: localVariable; value: faction }
  getLocalVariable(initialValue: GuidValue): { localVariable: localVariable; value: guid }
  getLocalVariable(initialValue: PrefabIdValue): { localVariable: localVariable; value: prefabId }
  getLocalVariable(initialValue: StrValue): { localVariable: localVariable; value: string }
  getLocalVariable(initialValue: vec3): {
    localVariable: localVariable
    value: vec3
  }
  getLocalVariable(initialValue: FloatValue[]): { localVariable: localVariable; value: number[] }
  getLocalVariable(initialValue: IntValue[]): { localVariable: localVariable; value: bigint[] }
  getLocalVariable(initialValue: BoolValue[]): { localVariable: localVariable; value: boolean[] }
  getLocalVariable(initialValue: ConfigIdValue[]): {
    localVariable: localVariable
    value: configId[]
  }
  getLocalVariable(initialValue: EntityValue[]): { localVariable: localVariable; value: entity[] }
  getLocalVariable(initialValue: FactionValue[]): {
    localVariable: localVariable
    value: faction[]
  }
  getLocalVariable(initialValue: GuidValue[]): { localVariable: localVariable; value: guid[] }
  getLocalVariable(initialValue: PrefabIdValue[]): {
    localVariable: localVariable
    value: prefabId[]
  }
  getLocalVariable(initialValue: StrValue[]): { localVariable: localVariable; value: string[] }
  getLocalVariable(initialValue: Vec3Value[]): {
    localVariable: localVariable
    value: vec3[]
  }
  getLocalVariable<
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
      | 'bool_list'
      | 'config_id_list'
      | 'entity_list'
      | 'faction_list'
      | 'float_list'
      | 'guid_list'
      | 'int_list'
      | 'prefab_id_list'
      | 'str_list'
      | 'vec3_list'
  >(
    initialValue: RuntimeParameterValueTypeMap[T]
  ): {
    localVariable: localVariable
    value: RuntimeReturnValueTypeMap[T]
  } {
    const genericType = matchTypes(
      [
        'float',
        'int',
        'bool',
        'config_id',
        'entity',
        'faction',
        'guid',
        'prefab_id',
        'str',
        'vec3'
      ],
      initialValue
    )
    const isInitialValueList = z.instanceof(list).safeParse(initialValue).success
    let initialValueObj: value
    if (isInitialValueList) {
      initialValueObj = parseValue(
        initialValue,
        (genericType + '_list') as keyof LiteralValueListTypeMap
      )
    } else {
      initialValueObj = parseValue(initialValue, genericType)
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_local_variable',
      args: [initialValueObj]
    })
    return {
      localVariable: (() => {
        const ret = new localVariable()
        ret.markPin(ref, 'localVariable', 0)
        return ret
      })(),
      value: (() => {
        if (isInitialValueList) {
          const ret = new list(genericType)
          ret.markPin(ref, 'value', 1)
          return ret as unknown as RuntimeReturnValueTypeMap[T]
        }
        const ret = new ValueClassMap[genericType]()
        ret.markPin(ref, 'value', 1)
        return ret as unknown as RuntimeReturnValueTypeMap[T]
      })()
    }
  }

  /**
   * 커스텀 변수 컴포넌트 스냅샷에서 지정한 변수명의 값을 조회한다. [엔티티 파괴 시] 이벤트에서만 사용 가능하다
   *
   * @param customVariableComponentSnapshot 커스텀 변수 컴포넌트 스냅샷
   * @param variableName 변수명
   * @returns 변수값
   */
  queryCustomVariableSnapshot(
    customVariableComponentSnapshot: CustomVariableSnapshotValue,
    variableName: StrValue
  ): generic {
    const customVariableComponentSnapshotObj = parseValue(
      customVariableComponentSnapshot,
      'custom_variable_snapshot'
    )
    const variableNameObj = parseValue(variableName, 'str')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_custom_variable_snapshot',
      args: [customVariableComponentSnapshotObj, variableNameObj]
    })
    const ret = new generic()
    ret.markPin(ref, 'variableValue', 0)
    return ret as unknown as generic
  }

  /**
   * 키를 기준으로 딕셔너리에서 대응하는 값을 조회한다. 키가 존재하지 않으면 해당 타입의 기본값을 반환한다
   *
   * @param dictionary 딕셔너리
   * @param key 키
   * @returns 값
   */
  queryDictionaryValueByKey<K extends DictKeyType, V extends DictValueType>(
    dictionary: dict<K, V>,
    key: RuntimeParameterValueTypeMap[K]
  ): RuntimeReturnValueTypeMap[V] {
    const dictionaryObj = parseValue(dictionary, 'dict')
    const keyObj = parseValue(key, dictionaryObj.getKeyType())
    const valueType = dictionaryObj.getValueType()
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_dictionary_value_by_key',
      args: [dictionaryObj, keyObj]
    })
    if (isListType(valueType)) {
      const base = getBaseValueType(valueType)
      const ret = new list(base)
      ret.markPin(ref, 'value', 0)
      return ret as unknown as RuntimeReturnValueTypeMap[V]
    }
    const ret = new ValueClassMap[valueType]()
    ret.markPin(ref, 'value', 0)
    return ret as unknown as RuntimeReturnValueTypeMap[V]
  }

  /**
   * 입력한 키 리스트와 값 리스트의 순서대로 키-값 쌍을 만들어 딕셔너리를 생성한다. 키 리스트와 값 리스트 중 짧은 쪽을 기준으로 생성하며, 초과분은 잘린다. 키 리스트에 중복 키가 있으면 생성에 실패하고 빈 딕셔너리를 반환한다
   *
   * GSTS 참고: 이 메서드로 선언한 딕셔너리는 수정할 수 없다. 수정이 필요한 경우 노드 그래프 변수 딕셔너리를 선언해야 한다
   *
   * @param keyList 키 리스트
   * @param valueList 값 리스트
   * @returns 딕셔너리
   */
  createDictionary(keyList: IntValue[], valueList: FloatValue[]): ReadonlyDict<'int', 'float'>
  createDictionary(keyList: IntValue[], valueList: IntValue[]): ReadonlyDict<'int', 'int'>
  createDictionary(keyList: IntValue[], valueList: BoolValue[]): ReadonlyDict<'int', 'bool'>
  createDictionary(
    keyList: IntValue[],
    valueList: ConfigIdValue[]
  ): ReadonlyDict<'int', 'config_id'>
  createDictionary(keyList: IntValue[], valueList: EntityValue[]): ReadonlyDict<'int', 'entity'>
  createDictionary(keyList: IntValue[], valueList: FactionValue[]): ReadonlyDict<'int', 'faction'>
  createDictionary(keyList: IntValue[], valueList: GuidValue[]): ReadonlyDict<'int', 'guid'>
  createDictionary(
    keyList: IntValue[],
    valueList: PrefabIdValue[]
  ): ReadonlyDict<'int', 'prefab_id'>
  createDictionary(keyList: IntValue[], valueList: StrValue[]): ReadonlyDict<'int', 'str'>
  createDictionary(keyList: IntValue[], valueList: Vec3Value[]): ReadonlyDict<'int', 'vec3'>
  createDictionary(keyList: StrValue[], valueList: FloatValue[]): ReadonlyDict<'str', 'float'>
  createDictionary(keyList: StrValue[], valueList: IntValue[]): ReadonlyDict<'str', 'int'>
  createDictionary(keyList: StrValue[], valueList: BoolValue[]): ReadonlyDict<'str', 'bool'>
  createDictionary(
    keyList: StrValue[],
    valueList: ConfigIdValue[]
  ): ReadonlyDict<'str', 'config_id'>
  createDictionary(keyList: StrValue[], valueList: EntityValue[]): ReadonlyDict<'str', 'entity'>
  createDictionary(keyList: StrValue[], valueList: FactionValue[]): ReadonlyDict<'str', 'faction'>
  createDictionary(keyList: StrValue[], valueList: GuidValue[]): ReadonlyDict<'str', 'guid'>
  createDictionary(
    keyList: StrValue[],
    valueList: PrefabIdValue[]
  ): ReadonlyDict<'str', 'prefab_id'>
  createDictionary(keyList: StrValue[], valueList: StrValue[]): ReadonlyDict<'str', 'str'>
  createDictionary(keyList: StrValue[], valueList: Vec3Value[]): ReadonlyDict<'str', 'vec3'>
  createDictionary(keyList: EntityValue[], valueList: FloatValue[]): ReadonlyDict<'entity', 'float'>
  createDictionary(keyList: EntityValue[], valueList: IntValue[]): ReadonlyDict<'entity', 'int'>
  createDictionary(keyList: EntityValue[], valueList: BoolValue[]): ReadonlyDict<'entity', 'bool'>
  createDictionary(
    keyList: EntityValue[],
    valueList: ConfigIdValue[]
  ): ReadonlyDict<'entity', 'config_id'>
  createDictionary(
    keyList: EntityValue[],
    valueList: EntityValue[]
  ): ReadonlyDict<'entity', 'entity'>
  createDictionary(
    keyList: EntityValue[],
    valueList: FactionValue[]
  ): ReadonlyDict<'entity', 'faction'>
  createDictionary(keyList: EntityValue[], valueList: GuidValue[]): ReadonlyDict<'entity', 'guid'>
  createDictionary(
    keyList: EntityValue[],
    valueList: PrefabIdValue[]
  ): ReadonlyDict<'entity', 'prefab_id'>
  createDictionary(keyList: EntityValue[], valueList: StrValue[]): ReadonlyDict<'entity', 'str'>
  createDictionary(keyList: EntityValue[], valueList: Vec3Value[]): ReadonlyDict<'entity', 'vec3'>
  createDictionary(keyList: GuidValue[], valueList: FloatValue[]): ReadonlyDict<'guid', 'float'>
  createDictionary(keyList: GuidValue[], valueList: IntValue[]): ReadonlyDict<'guid', 'int'>
  createDictionary(keyList: GuidValue[], valueList: BoolValue[]): ReadonlyDict<'guid', 'bool'>
  createDictionary(
    keyList: GuidValue[],
    valueList: ConfigIdValue[]
  ): ReadonlyDict<'guid', 'config_id'>
  createDictionary(keyList: GuidValue[], valueList: EntityValue[]): ReadonlyDict<'guid', 'entity'>
  createDictionary(keyList: GuidValue[], valueList: FactionValue[]): ReadonlyDict<'guid', 'faction'>
  createDictionary(keyList: GuidValue[], valueList: GuidValue[]): ReadonlyDict<'guid', 'guid'>
  createDictionary(
    keyList: GuidValue[],
    valueList: PrefabIdValue[]
  ): ReadonlyDict<'guid', 'prefab_id'>
  createDictionary(keyList: GuidValue[], valueList: StrValue[]): ReadonlyDict<'guid', 'str'>
  createDictionary(keyList: GuidValue[], valueList: Vec3Value[]): ReadonlyDict<'guid', 'vec3'>
  createDictionary(
    keyList: FactionValue[],
    valueList: FloatValue[]
  ): ReadonlyDict<'faction', 'float'>
  createDictionary(keyList: FactionValue[], valueList: IntValue[]): ReadonlyDict<'faction', 'int'>
  createDictionary(keyList: FactionValue[], valueList: BoolValue[]): ReadonlyDict<'faction', 'bool'>
  createDictionary(
    keyList: FactionValue[],
    valueList: ConfigIdValue[]
  ): ReadonlyDict<'faction', 'config_id'>
  createDictionary(
    keyList: FactionValue[],
    valueList: EntityValue[]
  ): ReadonlyDict<'faction', 'entity'>
  createDictionary(
    keyList: FactionValue[],
    valueList: FactionValue[]
  ): ReadonlyDict<'faction', 'faction'>
  createDictionary(keyList: FactionValue[], valueList: GuidValue[]): ReadonlyDict<'faction', 'guid'>
  createDictionary(
    keyList: FactionValue[],
    valueList: PrefabIdValue[]
  ): ReadonlyDict<'faction', 'prefab_id'>
  createDictionary(keyList: FactionValue[], valueList: StrValue[]): ReadonlyDict<'faction', 'str'>
  createDictionary(keyList: FactionValue[], valueList: Vec3Value[]): ReadonlyDict<'faction', 'vec3'>
  createDictionary(
    keyList: ConfigIdValue[],
    valueList: FloatValue[]
  ): ReadonlyDict<'config_id', 'float'>
  createDictionary(
    keyList: ConfigIdValue[],
    valueList: IntValue[]
  ): ReadonlyDict<'config_id', 'int'>
  createDictionary(
    keyList: ConfigIdValue[],
    valueList: BoolValue[]
  ): ReadonlyDict<'config_id', 'bool'>
  createDictionary(
    keyList: ConfigIdValue[],
    valueList: ConfigIdValue[]
  ): ReadonlyDict<'config_id', 'config_id'>
  createDictionary(
    keyList: ConfigIdValue[],
    valueList: EntityValue[]
  ): ReadonlyDict<'config_id', 'entity'>
  createDictionary(
    keyList: ConfigIdValue[],
    valueList: FactionValue[]
  ): ReadonlyDict<'config_id', 'faction'>
  createDictionary(
    keyList: ConfigIdValue[],
    valueList: GuidValue[]
  ): ReadonlyDict<'config_id', 'guid'>
  createDictionary(
    keyList: ConfigIdValue[],
    valueList: PrefabIdValue[]
  ): ReadonlyDict<'config_id', 'prefab_id'>
  createDictionary(
    keyList: ConfigIdValue[],
    valueList: StrValue[]
  ): ReadonlyDict<'config_id', 'str'>
  createDictionary(
    keyList: ConfigIdValue[],
    valueList: Vec3Value[]
  ): ReadonlyDict<'config_id', 'vec3'>
  createDictionary(
    keyList: PrefabIdValue[],
    valueList: FloatValue[]
  ): ReadonlyDict<'prefab_id', 'float'>
  createDictionary(
    keyList: PrefabIdValue[],
    valueList: IntValue[]
  ): ReadonlyDict<'prefab_id', 'int'>
  createDictionary(
    keyList: PrefabIdValue[],
    valueList: BoolValue[]
  ): ReadonlyDict<'prefab_id', 'bool'>
  createDictionary(
    keyList: PrefabIdValue[],
    valueList: ConfigIdValue[]
  ): ReadonlyDict<'prefab_id', 'config_id'>
  createDictionary(
    keyList: PrefabIdValue[],
    valueList: EntityValue[]
  ): ReadonlyDict<'prefab_id', 'entity'>
  createDictionary(
    keyList: PrefabIdValue[],
    valueList: FactionValue[]
  ): ReadonlyDict<'prefab_id', 'faction'>
  createDictionary(
    keyList: PrefabIdValue[],
    valueList: GuidValue[]
  ): ReadonlyDict<'prefab_id', 'guid'>
  createDictionary(
    keyList: PrefabIdValue[],
    valueList: PrefabIdValue[]
  ): ReadonlyDict<'prefab_id', 'prefab_id'>
  createDictionary(
    keyList: PrefabIdValue[],
    valueList: StrValue[]
  ): ReadonlyDict<'prefab_id', 'str'>
  createDictionary(
    keyList: PrefabIdValue[],
    valueList: Vec3Value[]
  ): ReadonlyDict<'prefab_id', 'vec3'>
  createDictionary<K extends DictKeyType, V extends keyof CommonLiteralValueTypeMap>(
    keyList: RuntimeParameterValueTypeMap[K][],
    valueList: RuntimeParameterValueTypeMap[V][]
  ): ReadonlyDict<K, V> {
    const keyListConcreteType = (keyList as unknown as list<K>).getConcreteType()
    if (!keyListConcreteType) {
      throw new Error("[error] createDictionary(): keyList must be typed, use list('type', 0)")
    }
    const keyListObj = parseValue(
      keyList,
      (keyListConcreteType + '_list') as keyof LiteralValueListTypeMap
    )
    const valueListConcreteType = (valueList as unknown as list<V>).getConcreteType()
    if (!valueListConcreteType) {
      throw new Error("[error] createDictionary(): valueList must be typed, use list('type', 0)")
    }
    const valueListObj = parseValue(
      valueList,
      (valueListConcreteType + '_list') as keyof LiteralValueListTypeMap
    )
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'create_dictionary',
      args: [keyListObj, valueListObj]
    })
    const ret = new dict(keyListConcreteType, valueListConcreteType)
    ret.markPin(ref, 'dictionary', 0)
    return ret
  }

  /**
   * 지정된 딕셔너리에 특정 값이 포함되어 있는지 조회한다
   *
   * @param dictionary 딕셔너리
   * @param value 값
   * @returns 포함 여부
   */
  queryIfDictionaryContainsSpecificValue<
    K extends DictKeyType,
    V extends keyof CommonLiteralValueTypeMap
  >(dictionary: dict<K, V>, value: RuntimeParameterValueTypeMap[V]): boolean {
    const dictionaryObj = parseValue(dictionary, 'dict')
    const valueObj = parseValue(value, dictionaryObj.getValueType())
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_if_dictionary_contains_specific_value',
      args: [dictionaryObj, valueObj]
    })
    const ret = new bool()
    ret.markPin(ref, 'include', 0)
    return ret as unknown as boolean
  }

  /**
   * 딕셔너리의 모든 값으로 구성된 리스트를 반환한다. 딕셔너리의 키-값 쌍은 순서가 없으므로, 반환되는 값 리스트의 순서는 삽입 순서와 다를 수 있다
   *
   * @param dictionary 딕셔너리
   * @returns 값 리스트
   */
  getListOfValuesFromDictionary<K extends DictKeyType, V extends keyof CommonLiteralValueTypeMap>(
    dictionary: dict<K, V>
  ): RuntimeReturnValueTypeMap[`${V}_list`] {
    const dictionaryObj = parseValue(dictionary, 'dict')
    const valueType = dictionaryObj.getValueType() as V
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_list_of_values_from_dictionary',
      args: [dictionaryObj]
    })
    const ret = new list(valueType)
    ret.markPin(ref, 'valueList', 0)
    return ret as unknown as RuntimeReturnValueTypeMap[`${V}_list`]
  }

  /**
   * 지정된 딕셔너리를 키 기준으로 오름차순 또는 내림차순 정렬하여 출력한다
   *
   * @param dictionary 딕셔너리
   * @param sortBy 정렬 방식
   */
  sortDictionaryByKey<V extends keyof CommonLiteralValueTypeMap>(
    dictionary: dict<'int', V>,
    sortBy: SortBy
  ): {
    /**
     * 키 리스트
     */
    keyList: RuntimeReturnValueTypeMap['int_list']
    /**
     * 값 리스트
     */
    valueList: RuntimeReturnValueTypeMap[`${V}_list`]
  } {
    const dictionaryObj = parseValue(dictionary, 'dict')
    const sortByObj = parseValue(sortBy, 'enumeration')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'sort_dictionary_by_key',
      args: [dictionaryObj, sortByObj]
    })
    return {
      keyList: (() => {
        const ret = new list('int')
        ret.markPin(ref, 'keyList', 0)
        return ret as unknown as RuntimeReturnValueTypeMap['int_list']
      })(),
      valueList: (() => {
        const ret = new list(dictionaryObj.getValueType() as V)
        ret.markPin(ref, 'valueList', 1)
        return ret as unknown as RuntimeReturnValueTypeMap[`${V}_list`]
      })()
    }
  }

  /**
   * 지정된 딕셔너리를 값 기준으로 오름차순 또는 내림차순 정렬하여 출력한다
   *
   * @param dictionary 딕셔너리
   * @param sortBy 정렬 방식
   */
  sortDictionaryByValue<K extends DictKeyType, V extends 'int' | 'float'>(
    dictionary: dict<K, V>,
    sortBy: SortBy
  ): {
    /**
     * 키 리스트
     */
    keyList: RuntimeReturnValueTypeMap[`${K}_list`]
    /**
     * 값 리스트
     */
    valueList: RuntimeReturnValueTypeMap[`${V}_list`]
  } {
    const dictionaryObj = parseValue(dictionary, 'dict')
    const sortByObj = parseValue(sortBy, 'enumeration')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'sort_dictionary_by_value',
      args: [dictionaryObj, sortByObj]
    })
    return {
      keyList: (() => {
        const ret = new list(dictionaryObj.getKeyType() as K)
        ret.markPin(ref, 'keyList', 0)
        return ret as unknown as RuntimeReturnValueTypeMap[`${K}_list`]
      })(),
      valueList: (() => {
        const ret = new list(dictionaryObj.getValueType() as V)
        ret.markPin(ref, 'valueList', 1)
        return ret as unknown as RuntimeReturnValueTypeMap[`${V}_list`]
      })()
    }
  }

  /**
   * 유한 루프에서 탈출한다. 출력 핀은 [유한 루프] 노드의 [루프 중단] 입력 파라미터에 연결해야 한다
   */
  breakLoop(...loopNodeIds: IntValue[]): void {
    const loopNodeIdObjs = loopNodeIds.map((id) => parseValue(id, 'int'))
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'break_loop',
      args: loopNodeIdObjs
    })
    // break_loop has no exec output; terminate the current path to avoid invalid chaining.
    this.registry.returnFromCurrentExecPath({ countReturn: false })
  }

  /**
   * [루프 시작값]부터 [루프 종료값]까지 정수를 1씩 증가시키며 반복한다. 매 반복마다 [루프 바디]에 연결된 노드 로직을 실행하고, 전체 반복이 완료되면 [루프 완료]에 연결된 노드 로직을 실행한다. [루프 중단]을 사용해 반복을 조기에 종료할 수 있으며, 루프 탈출 후에도 [루프 완료]의 로직은 실행된다
   *
   * @param loopStartValue 루프 시작값: 반복을 시작하는 정수값
   * @param loopEndValue 루프 종료값: 반복이 끝나는 정수값
   * @returns 현재 루프값: 현재 실행 중인 반복의 정수값
   */
  finiteLoop(
    loopStartValue: IntValue,
    loopEndValue: IntValue,
    loopBody: (loopValue: bigint, breakLoop: () => void) => void
  ): void {
    const LOOP_BODY_SOURCE_INDEX = 0
    const LOOP_COMPLETE_SOURCE_INDEX = 1

    const loopStartValueObj = parseValue(loopStartValue, 'int')
    const loopEndValueObj = parseValue(loopEndValue, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'finite_loop',
      args: [loopStartValueObj, loopEndValueObj]
    })
    const ret = new int()
    ret.markPin(ref, 'currentLoopValue', 0)

    const returnMarkBefore = this.registry.getReturnCallCounter()
    this.registry.withExecBranch(ref.id, LOOP_BODY_SOURCE_INDEX, () => {
      this.registry.withLoop(ref.id, () => {
        globalThis.gsts.ctx.withCtx('server_loop', () =>
          loopBody(ret as unknown as bigint, () => this.breakLoop(ref.id))
        )
      })
    })
    const hasReturnInBody = this.registry.getReturnCallCounter() !== returnMarkBefore

    if (!hasReturnInBody) {
      this.registry.markLinkNextExecFrom(ref.id, LOOP_COMPLETE_SOURCE_INDEX)
      return
    }

    // loop body 存在 return（可能是运行时条件触发）：在 loop complete 处插入 return gate
    this.registry.setCurrentExecTailEndpoints([
      { nodeId: ref.id, sourceIndex: LOOP_COMPLETE_SOURCE_INDEX }
    ])
    const returned = this.registry.getOrCreateReturnGateLocalVariable().value
    const returnedObj = parseValue(returned, 'bool')
    const gate = this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'double_branch',
      args: [returnedObj]
    })
    // false 分支（未 return）才继续
    this.registry.setCurrentExecTailEndpoints([{ nodeId: gate.id, sourceIndex: 1 }])
  }

  /**
   * 지정된 리스트를 순서대로 순회한다
   *
   * @param iterationList 반복 리스트: 순회할 리스트
   * @returns 반복값: 리스트의 각 값
   */
  listIterationLoop(
    iterationList: FloatValue[],
    loopBody: (iterationValue: number, breakLoop: () => void) => void
  ): void
  listIterationLoop(
    iterationList: IntValue[],
    loopBody: (iterationValue: bigint, breakLoop: () => void) => void
  ): void
  listIterationLoop(
    iterationList: BoolValue[],
    loopBody: (iterationValue: boolean, breakLoop: () => void) => void
  ): void
  listIterationLoop(
    iterationList: ConfigIdValue[],
    loopBody: (iterationValue: configId, breakLoop: () => void) => void
  ): void
  listIterationLoop(
    iterationList: EntityValue[],
    loopBody: (iterationValue: entity, breakLoop: () => void) => void
  ): void
  listIterationLoop(
    iterationList: FactionValue[],
    loopBody: (iterationValue: faction, breakLoop: () => void) => void
  ): void
  listIterationLoop(
    iterationList: GuidValue[],
    loopBody: (iterationValue: guid, breakLoop: () => void) => void
  ): void
  listIterationLoop(
    iterationList: PrefabIdValue[],
    loopBody: (iterationValue: prefabId, breakLoop: () => void) => void
  ): void
  listIterationLoop(
    iterationList: StrValue[],
    loopBody: (iterationValue: string, breakLoop: () => void) => void
  ): void
  listIterationLoop(
    iterationList: Vec3Value[],
    loopBody: (iterationValue: vec3, breakLoop: () => void) => void
  ): void
  listIterationLoop<
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
    iterationList: RuntimeParameterValueTypeMap[T][],
    loopBody: (iterationValue: RuntimeReturnValueTypeMap[T], breakLoop: () => void) => void
  ): void {
    const LOOP_BODY_SOURCE_INDEX = 0
    const LOOP_COMPLETE_SOURCE_INDEX = 1

    const genericType = matchTypes(
      [
        'float',
        'int',
        'bool',
        'config_id',
        'entity',
        'faction',
        'guid',
        'prefab_id',
        'str',
        'vec3'
      ],
      iterationList
    )
    const iterationListObj = parseValue(iterationList, `${genericType}_list`)
    const ref = this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'list_iteration_loop',
      args: [iterationListObj]
    })
    const ret = new ValueClassMap[genericType]()
    ret.markPin(ref, 'iterationValue', 0)

    const returnMarkBefore = this.registry.getReturnCallCounter()
    this.registry.withExecBranch(ref.id, LOOP_BODY_SOURCE_INDEX, () => {
      this.registry.withLoop(ref.id, () => {
        globalThis.gsts.ctx.withCtx('server_loop', () =>
          loopBody(ret as unknown as RuntimeReturnValueTypeMap[T], () => this.breakLoop(ref.id))
        )
      })
    })
    const hasReturnInBody = this.registry.getReturnCallCounter() !== returnMarkBefore

    if (!hasReturnInBody) {
      this.registry.markLinkNextExecFrom(ref.id, LOOP_COMPLETE_SOURCE_INDEX)
      return
    }

    // loop body 存在 return（可能是运行时条件触发）：在 loop complete 处插入 return gate
    this.registry.setCurrentExecTailEndpoints([
      { nodeId: ref.id, sourceIndex: LOOP_COMPLETE_SOURCE_INDEX }
    ])
    const returned = this.registry.getOrCreateReturnGateLocalVariable().value
    const returnedObj = parseValue(returned, 'bool')
    const gate = this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'double_branch',
      args: [returnedObj]
    })
    // false 分支（未 return）才继续
    this.registry.setCurrentExecTailEndpoints([{ nodeId: gate.id, sourceIndex: 1 }])
  }

  /**
   * 하나의 입력 파라미터를 제어 표현식(정수 또는 문자열 지원)으로 받아 값에 따라 여러 브랜치로 분기한다. 출력 핀의 값이 제어 표현식과 일치하면 해당 핀을 따라 실행이 계속되며, 일치하는 핀이 없으면 [기본] 핀이 실행된다
   *
   * @param controlExpression 제어 표현식: 정수 또는 문자열만 지원
   */
  multipleBranches(
    controlExpression: IntValue,
    branches: Record<number, (() => void) | number> & { default?: (() => void) | number }
  ): void
  multipleBranches(
    controlExpression: StrValue,
    branches: Record<string, (() => void) | string> & { default?: (() => void) | string }
  ): void
  multipleBranches<T extends 'int' | 'str'>(
    controlExpression: RuntimeParameterValueTypeMap[T],
    branches:
      | (Record<number, (() => void) | number> & { default?: (() => void) | number })
      | (Record<string, (() => void) | string> & { default?: (() => void) | string })
  ): void {
    const genericType = matchTypes(['int', 'str'], controlExpression)
    const controlExpressionObj = parseValue(controlExpression, genericType)

    const rawBranches = branches as Record<string, unknown>
    const caseKeys = Object.keys(rawBranches).filter((k) => k !== 'default')
    const caseArgs: value[] =
      genericType === 'int'
        ? caseKeys.map((k) => new int(Number(k)))
        : caseKeys.map((k) => new str(String(k)))

    const ref = this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'multiple_branches',
      args: [controlExpressionObj, ...caseArgs]
    })

    // 分支执行：按约定 default 的 source_index 固定为 0；其它分支按顺序从 1 开始递增
    const branchResults: Array<{
      sourceIndex: number
      terminatedByReturn?: boolean
      tailEndpoints: Array<{ nodeId: number; sourceIndex?: number }>
      headNodeId?: number
    }> = []

    const defaultVal = rawBranches.default
    let defaultResult:
      | {
          terminatedByReturn?: boolean
          tailEndpoints: Array<{ nodeId: number; sourceIndex?: number }>
          headNodeId?: number
        }
      | undefined

    const emptyDefault = {
      terminatedByReturn: false,
      tailEndpoints: [],
      headNodeId: undefined
    }

    if (typeof defaultVal === 'function') {
      const r = this.registry.withExecBranch(ref.id, 0, () =>
        globalThis.gsts.ctx.withCtx('server_switch', defaultVal as () => void)
      )
      defaultResult = r
      branchResults.push({ sourceIndex: 0, ...r })
    } else if (defaultVal === undefined) {
      // 空默认分支视为“未 return 且无节点”，join 时需要从分支节点对应输出直接连出
      branchResults.push({ sourceIndex: 0, ...emptyDefault })
    }

    const branchResultsByKey = new Map<
      string,
      {
        terminatedByReturn?: boolean
        tailEndpoints: Array<{ nodeId: number; sourceIndex?: number }>
        headNodeId?: number
      }
    >()

    caseKeys.forEach((k, i) => {
      const v = rawBranches[k]
      if (typeof v !== 'function') return
      const sourceIndex = i + 1
      const r = this.registry.withExecBranch(ref.id, sourceIndex, () =>
        globalThis.gsts.ctx.withCtx('server_switch', v as () => void)
      )
      branchResultsByKey.set(k, r)
      branchResults.push({ sourceIndex, ...r })
    })

    const resolveAliasKey = (input: unknown): string | null => {
      if (typeof input === 'string') return input
      if (typeof input === 'number') return String(input)
      return null
    }

    const ensureCaseKey = (key: string, origin: string) => {
      if (!caseKeys.includes(key)) {
        throw new Error(`[error] multipleBranches: "${origin}" refers to missing case "${key}"`)
      }
    }

    const resolveTarget = (
      key: string,
      stack: string[]
    ): { kind: 'case'; key: string } | { kind: 'default' } => {
      if (stack.includes(key)) {
        throw new Error(
          `[error] multipleBranches: circular case alias "${stack.join(' -> ')} -> ${key}"`
        )
      }
      const value = rawBranches[key]
      if (typeof value === 'function') return { kind: 'case', key }
      const alias = resolveAliasKey(value)
      if (!alias) {
        throw new Error(`[error] multipleBranches: "${key}" must be a function or case alias`)
      }
      if (alias === 'default') return { kind: 'default' }
      ensureCaseKey(alias, key)
      return resolveTarget(alias, [...stack, key])
    }

    const resolveDefault = (): { kind: 'case'; key: string } | { kind: 'default' } => {
      if (typeof defaultVal === 'function') return { kind: 'default' }
      const alias = resolveAliasKey(defaultVal)
      if (!alias) {
        throw new Error('[error] multipleBranches: default must be a function or case alias')
      }
      if (alias === 'default') {
        throw new Error('[error] multipleBranches: default alias cannot refer to itself')
      }
      ensureCaseKey(alias, 'default')
      return resolveTarget(alias, ['default'])
    }

    const attachAlias = (
      sourceIndex: number,
      target:
        | {
            terminatedByReturn?: boolean
            tailEndpoints: Array<{ nodeId: number; sourceIndex?: number }>
            headNodeId?: number
          }
        | undefined
    ) => {
      const resolved = target ?? emptyDefault
      if (resolved.headNodeId !== undefined) {
        this.registry.connectExecBranchOutput(ref.id, sourceIndex, resolved.headNodeId)
        return
      }
      branchResults.push({ sourceIndex, ...resolved })
    }

    caseKeys.forEach((k, i) => {
      const v = rawBranches[k]
      if (typeof v === 'function') return
      const target = resolveTarget(k, [])
      if (target.kind === 'default') {
        attachAlias(i + 1, defaultResult)
      } else {
        attachAlias(i + 1, branchResultsByKey.get(target.key))
      }
    })

    if (defaultVal !== undefined && typeof defaultVal !== 'function') {
      const target = resolveDefault()
      if (target.kind === 'default') {
        attachAlias(0, defaultResult)
      } else {
        attachAlias(0, branchResultsByKey.get(target.key))
      }
    }

    // 启用 join：后续顺序代码连接到所有未 return 的分支尾部（空分支则从分支节点输出直接连出）
    const joinEndpoints: Array<{ nodeId: number; sourceIndex?: number }> = []
    branchResults.forEach((r) => {
      if (r.terminatedByReturn) return
      if (r.tailEndpoints.length) {
        joinEndpoints.push(...r.tailEndpoints)
      } else {
        joinEndpoints.push({ nodeId: ref.id, sourceIndex: r.sourceIndex })
      }
    })
    this.registry.setCurrentExecTailEndpoints(joinEndpoints)
  }

  /**
   * 조건의 평가 결과에 따라 True 또는 False 브랜치로 분기한다. 불리언이 True이면 [True] 실행 흐름이, False이면 [False] 실행 흐름이 실행된다
   *
   * @param condition 조건
   */
  doubleBranch(condition: BoolValue, trueBranch: () => void, falseBranch: () => void): void {
    const TRUE_SOURCE_INDEX = 0
    const FALSE_SOURCE_INDEX = 1

    const conditionObj = parseValue(condition, 'bool')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'double_branch',
      args: [conditionObj]
    })

    const t = this.registry.withExecBranch(ref.id, TRUE_SOURCE_INDEX, () =>
      globalThis.gsts.ctx.withCtx('server_if', trueBranch)
    )
    const f = this.registry.withExecBranch(ref.id, FALSE_SOURCE_INDEX, () =>
      globalThis.gsts.ctx.withCtx('server_if', falseBranch)
    )

    // 启用 join：未 return 的分支尾部连到后续；空分支从分支节点输出直接连出
    const joinEndpoints: Array<{ nodeId: number; sourceIndex?: number }> = []
    ;[
      { sourceIndex: TRUE_SOURCE_INDEX, ...t },
      { sourceIndex: FALSE_SOURCE_INDEX, ...f }
    ].forEach((r) => {
      if (r.terminatedByReturn) return
      if (r.tailEndpoints.length) joinEndpoints.push(...r.tailEndpoints)
      else joinEndpoints.push({ nodeId: ref.id, sourceIndex: r.sourceIndex })
    })
    this.registry.setCurrentExecTailEndpoints(joinEndpoints)
  }

  // === AUTO-GENERATED START ===

  /**
   * 로그에 문자열을 출력한다. 주로 로직 확인 및 디버깅에 사용한다. 노드 그래프의 활성화 여부와 관계없이 로직이 성공적으로 실행될 때마다 출력된다
   *
   * @param string 문자열: 출력할 문자열
   */
  printString(string: StrValue): void {
    const stringObj = parseValue(string, 'str')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'print_string',
      args: [stringObj]
    })
  }

  /**
   * 이 노드의 실행 흐름 원본 이벤트를 지정된 대상 엔티티로 전달한다. 대상 엔티티의 노드 그래프에서 동일한 이름의 이벤트가 트리거된다
   *
   * @param targetEntity 대상 엔티티: 이벤트를 전달받을 엔티티
   */
  forwardingEvent(targetEntity: EntityValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'forwarding_event',
      args: [targetEntityObj]
    })
  }

  /**
   * 지정된 리스트의 지정된 인덱스 위치에 값을 삽입한다. 삽입된 값은 삽입 후 해당 인덱스에 위치한다. 예: 리스트 [1, 2, 3, 4]의 인덱스 2에 5를 삽입하면 [1, 2, 5, 3, 4]가 된다
   *
   * @param list 리스트: 삽입 대상 리스트의 참조
   * @param insertId 삽입 인덱스: 삽입 후 값이 위치할 인덱스
   * @param insertValue 삽입값: 삽입할 값
   */
  insertValueIntoList(list: FloatValue[], insertId: IntValue, insertValue: FloatValue): void
  insertValueIntoList(list: IntValue[], insertId: IntValue, insertValue: IntValue): void
  insertValueIntoList(list: BoolValue[], insertId: IntValue, insertValue: BoolValue): void
  insertValueIntoList(list: ConfigIdValue[], insertId: IntValue, insertValue: ConfigIdValue): void
  insertValueIntoList(list: EntityValue[], insertId: IntValue, insertValue: EntityValue): void
  insertValueIntoList(list: FactionValue[], insertId: IntValue, insertValue: FactionValue): void
  insertValueIntoList(list: GuidValue[], insertId: IntValue, insertValue: GuidValue): void
  insertValueIntoList(list: PrefabIdValue[], insertId: IntValue, insertValue: PrefabIdValue): void
  insertValueIntoList(list: StrValue[], insertId: IntValue, insertValue: StrValue): void
  insertValueIntoList(list: Vec3Value[], insertId: IntValue, insertValue: Vec3Value): void
  insertValueIntoList<
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
    list: RuntimeParameterValueTypeMap[T][],
    insertId: IntValue,
    insertValue: RuntimeParameterValueTypeMap[T]
  ): void {
    const genericType = matchTypes(
      [
        'float',
        'int',
        'bool',
        'config_id',
        'entity',
        'faction',
        'guid',
        'prefab_id',
        'str',
        'vec3'
      ],
      list,
      insertValue
    )
    const listObj = parseValue(list, `${genericType}_list`)
    const insertIdObj = parseValue(insertId, 'int')
    const insertValueObj = parseValue(insertValue, genericType)
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'insert_value_into_list',
      args: [listObj, insertIdObj, insertValueObj]
    })
  }

  /**
   * 지정된 리스트의 지정된 인덱스 위치의 값을 수정한다
   *
   * @param list 리스트: 수정 대상 리스트의 참조
   * @param id 인덱스: 수정할 값의 인덱스
   * @param value 값: 수정할 값
   */
  modifyValueInList(list: FloatValue[], id: IntValue, value: FloatValue): void
  modifyValueInList(list: IntValue[], id: IntValue, value: IntValue): void
  modifyValueInList(list: BoolValue[], id: IntValue, value: BoolValue): void
  modifyValueInList(list: ConfigIdValue[], id: IntValue, value: ConfigIdValue): void
  modifyValueInList(list: EntityValue[], id: IntValue, value: EntityValue): void
  modifyValueInList(list: FactionValue[], id: IntValue, value: FactionValue): void
  modifyValueInList(list: GuidValue[], id: IntValue, value: GuidValue): void
  modifyValueInList(list: PrefabIdValue[], id: IntValue, value: PrefabIdValue): void
  modifyValueInList(list: StrValue[], id: IntValue, value: StrValue): void
  modifyValueInList(list: Vec3Value[], id: IntValue, value: Vec3Value): void
  modifyValueInList<
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
    list: RuntimeParameterValueTypeMap[T][],
    id: IntValue,
    value: RuntimeParameterValueTypeMap[T]
  ): void {
    const genericType = matchTypes(
      [
        'float',
        'int',
        'bool',
        'config_id',
        'entity',
        'faction',
        'guid',
        'prefab_id',
        'str',
        'vec3'
      ],
      list,
      value
    )
    const listObj = parseValue(list, `${genericType}_list`)
    const idObj = parseValue(id, 'int')
    const valueObj = parseValue(value, genericType)
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_value_in_list',
      args: [listObj, idObj, valueObj]
    })
  }

  /**
   * 지정된 리스트의 지정된 인덱스 위치의 값을 제거한다. 제거 후 해당 인덱스 이후의 모든 값이 한 칸씩 앞으로 이동한다
   *
   * @param list 리스트: 값을 제거할 리스트의 참조
   * @param removeId 제거 인덱스: 제거할 값의 인덱스
   */
  removeValueFromList(list: FloatValue[], removeId: IntValue): void
  removeValueFromList(list: IntValue[], removeId: IntValue): void
  removeValueFromList(list: BoolValue[], removeId: IntValue): void
  removeValueFromList(list: ConfigIdValue[], removeId: IntValue): void
  removeValueFromList(list: EntityValue[], removeId: IntValue): void
  removeValueFromList(list: FactionValue[], removeId: IntValue): void
  removeValueFromList(list: GuidValue[], removeId: IntValue): void
  removeValueFromList(list: PrefabIdValue[], removeId: IntValue): void
  removeValueFromList(list: StrValue[], removeId: IntValue): void
  removeValueFromList(list: Vec3Value[], removeId: IntValue): void
  removeValueFromList<
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
  >(list: RuntimeParameterValueTypeMap[T][], removeId: IntValue): void {
    const genericType = matchTypes(
      [
        'float',
        'int',
        'bool',
        'config_id',
        'entity',
        'faction',
        'guid',
        'prefab_id',
        'str',
        'vec3'
      ],
      list
    )
    const listObj = parseValue(list, `${genericType}_list`)
    const removeIdObj = parseValue(removeId, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'remove_value_from_list',
      args: [listObj, removeIdObj]
    })
  }

  /**
   * 지정된 리스트를 선택한 정렬 방식으로 정렬한다
   *
   * @param list 리스트: 정수 리스트 또는 부동소수점 리스트
   * @param sortBy 정렬 방식: 오름차순(작은 값 → 큰 값) 또는 내림차순(큰 값 → 작은 값)
   */
  listSorting(list: FloatValue[], sortBy: SortBy): void
  listSorting(list: IntValue[], sortBy: SortBy): void
  listSorting<T extends 'float' | 'int'>(
    list: RuntimeParameterValueTypeMap[T][],
    sortBy: SortBy
  ): void {
    const genericType = matchTypes(['float', 'int'], list)
    const listObj = parseValue(list, `${genericType}_list`)
    const sortByObj = parseValue(sortBy, 'enumeration')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'list_sorting',
      args: [listObj, sortByObj]
    })
  }

  /**
   * 입력 리스트를 대상 리스트의 끝에 이어붙인다. 예: 대상 리스트 [1, 2, 3]에 [4, 5]를 이어붙이면 [1, 2, 3, 4, 5]가 된다
   *
   * @param targetList 대상 리스트: 이어붙임의 대상이 되는 리스트
   * @param inputList 입력 리스트: 대상 리스트의 끝에 추가될 리스트
   */
  concatenateList(targetList: FloatValue[], inputList: FloatValue[]): void
  concatenateList(targetList: IntValue[], inputList: IntValue[]): void
  concatenateList(targetList: BoolValue[], inputList: BoolValue[]): void
  concatenateList(targetList: ConfigIdValue[], inputList: ConfigIdValue[]): void
  concatenateList(targetList: EntityValue[], inputList: EntityValue[]): void
  concatenateList(targetList: FactionValue[], inputList: FactionValue[]): void
  concatenateList(targetList: GuidValue[], inputList: GuidValue[]): void
  concatenateList(targetList: PrefabIdValue[], inputList: PrefabIdValue[]): void
  concatenateList(targetList: StrValue[], inputList: StrValue[]): void
  concatenateList(targetList: Vec3Value[], inputList: Vec3Value[]): void
  concatenateList<
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
    targetList: RuntimeParameterValueTypeMap[T][],
    inputList: RuntimeParameterValueTypeMap[T][]
  ): void {
    const genericType = matchTypes(
      [
        'float',
        'int',
        'bool',
        'config_id',
        'entity',
        'faction',
        'guid',
        'prefab_id',
        'str',
        'vec3'
      ],
      targetList,
      inputList
    )
    const targetListObj = parseValue(targetList, `${genericType}_list`)
    const inputListObj = parseValue(inputList, `${genericType}_list`)
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'concatenate_list',
      args: [targetListObj, inputListObj]
    })
  }

  /**
   * 지정된 리스트를 비운다
   *
   * @param list 리스트: 비울 리스트
   */
  clearList(list: FloatValue[]): void
  clearList(list: IntValue[]): void
  clearList(list: BoolValue[]): void
  clearList(list: ConfigIdValue[]): void
  clearList(list: EntityValue[]): void
  clearList(list: FactionValue[]): void
  clearList(list: GuidValue[]): void
  clearList(list: PrefabIdValue[]): void
  clearList(list: StrValue[]): void
  clearList(list: Vec3Value[]): void
  clearList<
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
  >(list: RuntimeParameterValueTypeMap[T][]): void {
    const genericType = matchTypes(
      [
        'float',
        'int',
        'bool',
        'config_id',
        'entity',
        'faction',
        'guid',
        'prefab_id',
        'str',
        'vec3'
      ],
      list
    )
    const listObj = parseValue(list, `${genericType}_list`)
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'clear_list',
      args: [listObj]
    })
  }

  /**
   * 지정된 대상 엔티티의 프리셋 상태를 설정한다
   *
   * @param targetEntity 대상 엔티티: 프리셋 상태를 설정할 엔티티
   * @param presetStatusIndex 프리셋 상태 인덱스: 프리셋 상태의 고유 식별자
   * @param presetStatusValue 프리셋 상태값: 일반적으로 “0”은 비활성, “1”은 활성
   */
  setPresetStatus(
    targetEntity: EntityValue,
    presetStatusIndex: IntValue,
    presetStatusValue: IntValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const presetStatusIndexObj = parseValue(presetStatusIndex, 'int')
    const presetStatusValueObj = parseValue(presetStatusValue, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_preset_status',
      args: [targetEntityObj, presetStatusIndexObj, presetStatusValueObj]
    })
  }

  /**
   * 복합 피조물의 지정된 프리셋 상태 인덱스에 해당하는 값을 설정한다
   *
   * @param targetEntity 대상 엔티티: 복합 피조물에만 적용된다
   * @param presetStatusIndex 프리셋 상태 인덱스
   * @param presetStatusValue 프리셋 상태값
   */
  setThePresetStatusValueOfTheComplexCreation(
    targetEntity: CreationEntity,
    presetStatusIndex: IntValue,
    presetStatusValue: IntValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const presetStatusIndexObj = parseValue(presetStatusIndex, 'int')
    const presetStatusValueObj = parseValue(presetStatusValue, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_the_preset_status_value_of_the_complex_creation',
      args: [targetEntityObj, presetStatusIndexObj, presetStatusValueObj]
    })
  }

  /**
   * GUID로 엔티티를 생성한다. 엔티티는 사전에 씬에 배치되어 있어야 한다
   *
   * @param targetGuid 대상 GUID: 해당 엔티티의 식별자
   * @param unitTagIndexList 유닛 태그 인덱스 리스트: 엔티티 생성 시 부여할 유닛 태그를 결정한다
   */
  createEntity(targetGuid: GuidValue, unitTagIndexList: IntValue[]): void {
    const targetGuidObj = parseValue(targetGuid, 'guid')
    const unitTagIndexListObj = parseValue(unitTagIndexList, 'int_list')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'create_entity',
      args: [targetGuidObj, unitTagIndexListObj]
    })
  }

  /**
   * 프리팹 ID로 엔티티를 생성한다
   *
   * @param prefabId 프리팹 ID: 해당 프리팹의 식별자
   * @param location 위치: 절대 위치
   * @param rotate 회전: 절대 회전
   * @param ownerEntity 소유자 엔티티: 생성된 엔티티가 다른 엔티티에 귀속될지 결정한다
   * @param overwriteLevel 레벨 덮어쓰기 여부: False이면 [레벨] 파라미터가 적용되지 않는다
   * @param level 레벨: 엔티티 생성 시의 레벨을 결정한다
   * @param unitTagIndexList 유닛 태그 인덱스 리스트: 엔티티 생성 시 부여할 유닛 태그를 결정한다
   * @returns 생성된 엔티티: 이 방식으로 생성된 엔티티는 GUID를 갖지 않는다
   */
  createPrefab(
    prefabId: PrefabIdValue,
    location: Vec3Value,
    rotate: Vec3Value,
    ownerEntity: EntityValue,
    overwriteLevel: BoolValue,
    level: IntValue,
    unitTagIndexList: IntValue[]
  ): entity {
    const prefabIdObj = parseValue(prefabId, 'prefab_id')
    const locationObj = parseValue(location, 'vec3')
    const rotateObj = parseValue(rotate, 'vec3')
    const ownerEntityObj = parseValue(ownerEntity, 'entity')
    const overwriteLevelObj = parseValue(overwriteLevel, 'bool')
    const levelObj = parseValue(level, 'int')
    const unitTagIndexListObj = parseValue(unitTagIndexList, 'int_list')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'create_prefab',
      args: [
        prefabIdObj,
        locationObj,
        rotateObj,
        ownerEntityObj,
        overwriteLevelObj,
        levelObj,
        unitTagIndexListObj
      ]
    })
    const ret = new entity()
    ret.markPin(ref, 'createdEntity', 0)
    return ret as unknown as entity
  }

  /**
   * 프리팹 그룹 ID로 해당 프리팹 그룹에 포함된 엔티티들을 생성한다
   *
   * @param prefabGroupId 프리팹 그룹 인덱스: 해당 프리팹 그룹의 식별자
   * @param location 위치: 프리팹 그룹 중심의 절대 위치
   * @param rotate 회전: 프리팹 그룹 중심의 절대 회전
   * @param ownerEntity 귀속 엔티티: 생성된 엔티티가 다른 엔티티에 귀속될지 결정한다
   * @param level 레벨: 엔티티 생성 시의 레벨을 결정한다
   * @param unitTagIndexList 유닛 태그 인덱스 리스트: 엔티티 생성 시 부여할 유닛 태그를 결정한다
   * @param overwriteLevel 레벨 덮어쓰기 여부: False이면 [레벨] 파라미터가 적용되지 않는다
   * @returns 생성된 엔티티 리스트: 이 방식으로 생성된 엔티티는 GUID를 갖지 않는다
   */
  createPrefabGroup(
    prefabGroupId: IntValue,
    location: Vec3Value,
    rotate: Vec3Value,
    ownerEntity: EntityValue,
    level: IntValue,
    unitTagIndexList: IntValue[],
    overwriteLevel: BoolValue
  ): entity[] {
    const prefabGroupIdObj = parseValue(prefabGroupId, 'int')
    const locationObj = parseValue(location, 'vec3')
    const rotateObj = parseValue(rotate, 'vec3')
    const ownerEntityObj = parseValue(ownerEntity, 'entity')
    const levelObj = parseValue(level, 'int')
    const unitTagIndexListObj = parseValue(unitTagIndexList, 'int_list')
    const overwriteLevelObj = parseValue(overwriteLevel, 'bool')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'create_prefab_group',
      args: [
        prefabGroupIdObj,
        locationObj,
        rotateObj,
        ownerEntityObj,
        levelObj,
        unitTagIndexListObj,
        overwriteLevelObj
      ]
    })
    const ret = new list('entity')
    ret.markPin(ref, 'createdEntityList', 0)
    return ret as unknown as entity[]
  }

  /**
   * 엔티티의 모델 가시성 속성을 수정하여 모델을 표시하거나 숨긴다
   *
   * @param targetEntity 대상 엔티티: 수정할 엔티티
   * @param activate 활성화 여부: True이면 모델을 표시한다
   */
  activateDisableModelDisplay(targetEntity: EntityValue, activate: BoolValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const activateObj = parseValue(activate, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'activate_disable_model_display',
      args: [targetEntityObj, activateObj]
    })
  }

  /**
   * 지정한 엔티티를 파괴 연출과 함께 소멸시킨다. 로컬 투사체의 수명 종료 시 동작 등 파괴 후에만 실행되는 로직을 트리거할 수 있다. 스테이지 엔티티에서는 [엔티티 파괴 시] 및 [엔티티 제거/파괴 시] 이벤트를 감지할 수 있다
   *
   * @param targetEntity 대상 엔티티: 파괴할 엔티티
   */
  destroyEntity(targetEntity: EntityValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'destroy_entity',
      args: [targetEntityObj]
    })
  }

  /**
   * 지정한 엔티티를 제거한다. 파괴와 달리 파괴 연출이 없으며, 파괴 후에만 실행되는 로직도 트리거되지 않는다. [엔티티 파괴 시] 이벤트는 발생하지 않지만 [엔티티 제거/파괴 시] 이벤트는 발생할 수 있다
   *
   * @param targetEntity 대상 엔티티: 제거할 엔티티
   */
  removeEntity(targetEntity: EntityValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'remove_entity',
      args: [targetEntityObj]
    })
  }

  /**
   * 스테이지 정산 프로세스를 트리거한다. 스테이지 정산에 정의된 로직에 따라 외부 로직 정산을 실행한다
   */
  settleStage(): void {
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'settle_stage',
      args: []
    })
  }

  /**
   * 환경 시간을 즉시 지정한 시간으로 전환한다. 파라미터는 0~24 사이의 부동소수점 값이어야 한다. 목표 시각이 현재 시각보다 이른 경우 다음 날(+1일)로 처리된다
   *
   * @param environmentTime 환경 시간: 0~24 사이의 부동소수점 값이어야 하며, 범위를 벗어나면 노드가 적용되지 않는다
   */
  setCurrentEnvironmentTime(environmentTime: FloatValue): void {
    const environmentTimeObj = parseValue(environmentTime, 'float')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_current_environment_time',
      args: [environmentTimeObj]
    })
  }

  /**
   * 초당 경과 분(환경 시간 흐름 속도)을 설정한다. 0~60 범위로 제한된다 (티바트 기본값은 1)
   *
   * @param environmentTimePassageSpeed 환경 시간 흐름 속도: 0~60 범위로 제한되며, 범위를 벗어나면 0 또는 60으로 적용된다
   */
  setEnvironmentTimePassageSpeed(environmentTimePassageSpeed: FloatValue): void {
    const environmentTimePassageSpeedObj = parseValue(environmentTimePassageSpeed, 'float')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_environment_time_passage_speed',
      args: [environmentTimePassageSpeedObj]
    })
  }

  /**
   * 지정한 대상 엔티티의 진영을 수정한다
   *
   * @param targetEntity 대상 엔티티: 진영을 수정할 엔티티
   * @param faction 진영: 수정 후 적용할 진영
   */
  modifyEntityFaction(targetEntity: EntityValue, faction: FactionValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const factionObj = parseValue(faction, 'faction')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_entity_faction',
      args: [targetEntityObj, factionObj]
    })
  }

  /**
   * 지정한 플레이어 엔티티를 텔레포트한다. 이동 거리에 따라 로딩 화면이 표시될 수 있다
   *
   * GSTS 참고: 내부 쿨다운이 있으므로 좌표를 빈번하게 변경하는 용도로는 사용할 수 없다
   *
   * @param playerEntity 플레이어 엔티티: 효과가 적용될 플레이어
   * @param targetLocation 목표 위치: 절대 위치
   * @param targetRotation 목표 회전: 절대 회전
   */
  teleportPlayer(
    playerEntity: PlayerEntity,
    targetLocation: Vec3Value,
    targetRotation: Vec3Value
  ): void {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const targetLocationObj = parseValue(targetLocation, 'vec3')
    const targetRotationObj = parseValue(targetRotation, 'vec3')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'teleport_player',
      args: [playerEntityObj, targetLocationObj, targetRotationObj]
    })
  }

  /**
   * 지정한 캐릭터 엔티티를 부활시킨다
   *
   * @param characterEntity 캐릭터 엔티티: 부활시킬 캐릭터 엔티티
   */
  reviveCharacter(characterEntity: CharacterEntity): void {
    const characterEntityObj = parseValue(characterEntity, 'entity')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'revive_character',
      args: [characterEntityObj]
    })
  }

  /**
   * 지정한 플레이어의 모든 캐릭터 엔티티를 부활시킨다. 비욘드 모드에서는 플레이어당 캐릭터가 하나뿐이므로 [캐릭터 부활]과 동일한 효과를 갖는다
   *
   * @param playerEntity 플레이어 엔티티: 캐릭터가 귀속된 플레이어 엔티티
   * @param deductRevives 부활 횟수 차감 여부: False이면 부활 횟수를 차감하지 않는다
   */
  reviveAllPlayerSCharacters(playerEntity: PlayerEntity, deductRevives: BoolValue): void {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const deductRevivesObj = parseValue(deductRevives, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'revive_all_player_s_characters',
      args: [playerEntityObj, deductRevivesObj]
    })
  }

  /**
   * 지정한 플레이어의 현재 출전 캐릭터를 부활시킨다
   *
   * 클래식 모드 전용.
   *
   * @param playerEntity 플레이어 엔티티: 현재 출전 캐릭터가 귀속된 플레이어 엔티티
   */
  reviveActiveCharacter(playerEntity: PlayerEntity): void {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'revive_active_character',
      args: [playerEntityObj]
    })
  }

  /**
   * 지정한 플레이어의 모든 캐릭터를 쓰러뜨려 전원 다운 상태로 만든다
   *
   * @param playerEntity 플레이어 엔티티: 캐릭터가 귀속된 플레이어 엔티티
   */
  defeatAllPlayerSCharacters(playerEntity: PlayerEntity): void {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'defeat_all_player_s_characters',
      args: [playerEntityObj]
    })
  }

  /**
   * 플레이어에게 지정한 번호의 부활 지점을 활성화한다. 이후 플레이어가 부활 로직을 발동하면 해당 지점에서 부활할 수 있다
   *
   * @param playerEntity 플레이어 엔티티: 효과가 적용될 플레이어
   * @param revivePointId 부활 지점 번호: 해당 부활 지점의 식별자
   */
  activateRevivePoint(playerEntity: PlayerEntity, revivePointId: IntValue): void {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const revivePointIdObj = parseValue(revivePointId, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'activate_revive_point',
      args: [playerEntityObj, revivePointIdObj]
    })
  }

  /**
   * 지정한 플레이어의 다음 부활 소요 시간을 설정한다. 현재 부활 중인 경우 진행 중인 부활에는 영향을 주지 않는다
   *
   * @param playerEntity 플레이어 엔티티: 효과가 적용될 플레이어
   * @param duration 시간: 단위는 초
   */
  setPlayerReviveTime(playerEntity: PlayerEntity, duration: IntValue): void {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const durationObj = parseValue(duration, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_player_revive_time',
      args: [playerEntityObj, durationObj]
    })
  }

  /**
   * 지정한 플레이어의 남은 부활 횟수를 설정한다. 0으로 설정하면 해당 플레이어는 부활할 수 없다
   *
   * @param playerEntity 플레이어 엔티티: 효과가 적용될 플레이어
   * @param remainingTimes 남은 횟수: 0으로 설정하면 해당 플레이어는 부활할 수 없다
   */
  setPlayerRemainingRevives(playerEntity: PlayerEntity, remainingTimes: IntValue): void {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const remainingTimesObj = parseValue(remainingTimes, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_player_remaining_revives',
      args: [playerEntityObj, remainingTimesObj]
    })
  }

  /**
   * 지정한 플레이어에게 환경 설정을 적용한다. 실행 즉시 효과가 발생한다
   *
   * @param environmentConfigIndex 환경 설정 인덱스: 환경 설정의 식별자
   * @param targetPlayerList 대상 플레이어 리스트: 지정된 리스트에 포함된 플레이어에게만 적용된다
   * @param enableWeatherConfig 날씨 설정 활성화 여부: True이면 활성화한다
   * @param weatherConfigIndex 날씨 설정 번호: 해당 번호의 날씨 설정을 적용하며, 번호가 존재하지 않으면 적용되지 않는다
   */
  modifyEnvironmentSettings(
    environmentConfigIndex: IntValue,
    targetPlayerList: PlayerEntity[],
    enableWeatherConfig: BoolValue,
    weatherConfigIndex: IntValue
  ): void {
    const environmentConfigIndexObj = parseValue(environmentConfigIndex, 'int')
    const targetPlayerListObj = parseValue(targetPlayerList, 'entity_list')
    const enableWeatherConfigObj = parseValue(enableWeatherConfig, 'bool')
    const weatherConfigIndexObj = parseValue(weatherConfigIndex, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_environment_settings',
      args: [
        environmentConfigIndexObj,
        targetPlayerListObj,
        enableWeatherConfigObj,
        weatherConfigIndexObj
      ]
    })
  }

  /**
   * 지정한 플레이어의 부활 허용 여부를 설정한다
   *
   * @param playerEntity 플레이어 엔티티: 효과가 적용될 플레이어
   * @param allow 허용 여부: True이면 부활을 허용한다
   */
  allowForbidPlayerToRevive(playerEntity: PlayerEntity, allow: BoolValue): void {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const allowObj = parseValue(allow, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'allow_forbid_player_to_revive',
      args: [playerEntityObj, allowObj]
    })
  }

  /**
   * 플레이어에게 지정한 번호의 부활 지점을 비활성화한다. 이후 해당 플레이어가 부활할 때 해당 지점은 사용되지 않는다
   *
   * @param playerEntity 플레이어 엔티티: 효과가 적용될 플레이어
   * @param revivePointId 부활 지점 번호: 해당 부활 지점의 식별자
   */
  deactivateRevivePoint(playerEntity: PlayerEntity, revivePointId: IntValue): void {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const revivePointIdObj = parseValue(revivePointId, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'deactivate_revive_point',
      args: [playerEntityObj, revivePointIdObj]
    })
  }

  /**
   * 엔티티의 추가 콜리전 컴포넌트 데이터를 수정하여 추가 콜리전을 활성화하거나 비활성화한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param extraCollisionId 추가 콜리전 번호: 해당 추가 콜리전의 식별자
   * @param activate 활성화 여부: True이면 활성화한다
   */
  activateDisableExtraCollision(
    targetEntity: EntityValue,
    extraCollisionId: IntValue,
    activate: BoolValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const extraCollisionIdObj = parseValue(extraCollisionId, 'int')
    const activateObj = parseValue(activate, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'activate_disable_extra_collision',
      args: [targetEntityObj, extraCollisionIdObj, activateObj]
    })
  }

  /**
   * 엔티티의 추가 콜리전 컴포넌트에서 해당 콜리전의 등반 가능 여부를 수정한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param extraCollisionId 추가 콜리전 번호: 해당 추가 콜리전의 식별자
   * @param activate 활성화 여부: True이면 활성화한다
   */
  activateDisableExtraCollisionClimbability(
    targetEntity: EntityValue,
    extraCollisionId: IntValue,
    activate: BoolValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const extraCollisionIdObj = parseValue(extraCollisionId, 'int')
    const activateObj = parseValue(activate, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'activate_disable_extra_collision_climbability',
      args: [targetEntityObj, extraCollisionIdObj, activateObj]
    })
  }

  /**
   * 엔티티의 기본 콜리전을 활성화하거나 비활성화한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param activate 활성화 여부: True이면 활성화한다
   */
  activateDisableNativeCollision(targetEntity: EntityValue, activate: BoolValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const activateObj = parseValue(activate, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'activate_disable_native_collision',
      args: [targetEntityObj, activateObj]
    })
  }

  /**
   * 엔티티의 기본 콜리전에 대한 등반 가능 여부를 수정한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param activate 활성화 여부: True이면 활성화한다
   */
  activateDisableNativeCollisionClimbability(targetEntity: EntityValue, activate: BoolValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const activateObj = parseValue(activate, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'activate_disable_native_collision_climbability',
      args: [targetEntityObj, activateObj]
    })
  }

  /**
   * 콜리전 트리거 컴포넌트 데이터를 수정하여 지정한 번호의 트리거를 활성화하거나 비활성화한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param triggerId 트리거 번호: 해당 콜리전 트리거의 식별자
   * @param activate 활성화 여부: True이면 활성화한다
   */
  activateDisableCollisionTrigger(
    targetEntity: EntityValue,
    triggerId: IntValue,
    activate: BoolValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const triggerIdObj = parseValue(triggerId, 'int')
    const activateObj = parseValue(activate, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'activate_disable_collision_trigger',
      args: [targetEntityObj, triggerIdObj, activateObj]
    })
  }

  /**
   * 대상 엔티티의 길찾기 장애물 컴포넌트에서 지정한 번호의 활성화 상태를 수정한다
   *
   * @param targetEntity 대상 엔티티: 오브젝트에만 적용된다
   * @param pathfindingObstacleId 길찾기 장애물 번호: 해당 장애물의 식별자
   * @param activate 활성화 여부
   */
  activateDisablePathfindingObstacle(
    targetEntity: EntityValue,
    pathfindingObstacleId: IntValue,
    activate: BoolValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const pathfindingObstacleIdObj = parseValue(pathfindingObstacleId, 'int')
    const activateObj = parseValue(activate, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'activate_disable_pathfinding_obstacle',
      args: [targetEntityObj, pathfindingObstacleIdObj, activateObj]
    })
  }

  /**
   * 대상 엔티티의 길찾기 장애물 기능 활성화 여부를 수정한다
   *
   * @param targetEntity 대상 엔티티: 오브젝트에만 적용된다
   * @param activate 활성화 여부
   */
  activateDisablePathfindingObstacleFeature(targetEntity: EntityValue, activate: BoolValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const activateObj = parseValue(activate, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'activate_disable_pathfinding_obstacle_feature',
      args: [targetEntityObj, activateObj]
    })
  }

  /**
   * 지정한 엔티티가 공격을 발동하게 한다. 이 노드를 사용하는 엔티티에는 대응하는 어빌리티 유닛이 구성되어 있어야 한다. 어빌리티 유닛이 [히트박스 공격]이면 대상 엔티티 위치를 기준으로 히트박스 공격을 수행하고, [직접 공격]이면 대상 엔티티를 직접 공격한다
   *
   * @param targetEntity 대상 엔티티: 어빌리티 유닛에 따라 히트박스 위치 기준 대상 또는 공격 대상으로 사용된다
   * @param damageCoefficient 데미지 계수: 이번 공격에 적용되는 데미지 계수
   * @param damageIncrement 데미지 증가량: 이번 공격에 적용되는 데미지 증가량
   * @param locationOffset 위치 오프셋: [히트박스 공격] 시 히트박스 오프셋을 결정하며, [직접 공격] 시 판정 위치(피격 이펙트 생성 위치 등)를 결정한다
   * @param rotationOffset 회전 오프셋: [히트박스 공격] 시 히트박스 회전을 결정하며, [직접 공격] 시 판정 위치의 회전(피격 이펙트 등)을 결정한다
   * @param abilityUnit 어빌리티 유닛: 참조할 어빌리티 유닛. 이 노드 그래프와 연결된 엔티티에 구성되어 있어야 한다
   * @param overwriteAbilityUnitConfig 어빌리티 유닛 설정 덮어쓰기 여부: True이면 데미지 계수·데미지 증가량·위치 오프셋·회전 오프셋이 어빌리티 유닛의 동명 설정을 덮어쓴다. False이면 어빌리티 유닛의 설정이 사용된다
   * @param initiatorEntity 발동자 엔티티: 이번 공격의 발동자 엔티티를 결정한다. 기본값은 이 노드 그래프와 연결된 엔티티이다. [공격 히트 시], [공격받을 때] 등 이벤트에서 공격자 판정에 영향을 준다
   */
  initiateAttack(
    targetEntity: EntityValue,
    damageCoefficient: FloatValue,
    damageIncrement: FloatValue,
    locationOffset: Vec3Value,
    rotationOffset: Vec3Value,
    abilityUnit: StrValue,
    overwriteAbilityUnitConfig: BoolValue,
    initiatorEntity: EntityValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const damageCoefficientObj = parseValue(damageCoefficient, 'float')
    const damageIncrementObj = parseValue(damageIncrement, 'float')
    const locationOffsetObj = parseValue(locationOffset, 'vec3')
    const rotationOffsetObj = parseValue(rotationOffset, 'vec3')
    const abilityUnitObj = parseValue(abilityUnit, 'str')
    const overwriteAbilityUnitConfigObj = parseValue(overwriteAbilityUnitConfig, 'bool')
    const initiatorEntityObj = parseValue(initiatorEntity, 'entity')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'initiate_attack',
      args: [
        targetEntityObj,
        damageCoefficientObj,
        damageIncrementObj,
        locationOffsetObj,
        rotationOffsetObj,
        abilityUnitObj,
        overwriteAbilityUnitConfigObj,
        initiatorEntityObj
      ]
    })
  }

  /**
   * 어빌리티 유닛을 통해 지정한 대상 엔티티의 HP를 회복시킨다
   *
   * @param targetEntity 대상 엔티티: HP 회복 대상
   * @param recoveryAmount 회복량: 이번 HP 회복의 회복량
   * @param abilityUnit 어빌리티 유닛: 참조할 어빌리티 유닛. 이 노드 그래프와 연결된 엔티티에 구성되어 있어야 한다
   * @param overwriteAbilityUnitConfig 어빌리티 유닛 설정 덮어쓰기 여부: True이면 회복량이 어빌리티 유닛의 동명 설정을 덮어쓴다. False이면 어빌리티 유닛의 설정이 사용된다
   * @param recoverInitiatorEntity 회복 발동자 엔티티: 이번 회복 행동의 발동자 엔티티를 결정한다. 기본값은 이 노드 그래프와 연결된 엔티티이다. [HP 회복받을 때], [HP 회복 발동 시] 등 이벤트에서 회복자 판정에 영향을 준다
   */
  recoverHp(
    targetEntity: EntityValue,
    recoveryAmount: FloatValue,
    abilityUnit: StrValue,
    overwriteAbilityUnitConfig: BoolValue,
    recoverInitiatorEntity: EntityValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const recoveryAmountObj = parseValue(recoveryAmount, 'float')
    const abilityUnitObj = parseValue(abilityUnit, 'str')
    const overwriteAbilityUnitConfigObj = parseValue(overwriteAbilityUnitConfig, 'bool')
    const recoverInitiatorEntityObj = parseValue(recoverInitiatorEntity, 'entity')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'recover_hp',
      args: [
        targetEntityObj,
        recoveryAmountObj,
        abilityUnitObj,
        overwriteAbilityUnitConfigObj,
        recoverInitiatorEntityObj
      ]
    })
  }

  /**
   * 지정한 대상이 직접 HP를 잃게 한다. HP 손실은 공격이 아니므로 공격 관련 이벤트를 트리거하지 않는다
   *
   * @param targetEntity 대상 엔티티: HP를 잃을 대상
   * @param hpLoss HP 손실량: 이번 HP 손실의 손실량
   * @param lethal 치명 여부: False이면 이번 HP 손실로 대상의 HP가 최소 1 이상 남는다
   * @param canBeBlockedByInvincibility 무적으로 차단 가능 여부: True이면, 대상이 유닛 상태로 무적 상태일 경우 HP 손실이 적용되지 않는다
   * @param canBeBlockedByLockedHp HP 고정으로 차단 가능 여부: True이면, 대상이 유닛 상태로 HP 고정 상태일 경우 HP 손실이 적용되지 않는다
   * @param damagePopUpType 데미지 팝업 유형: 팝업 없음 / 일반 팝업 / 치명타 팝업
   */
  hpLoss(
    targetEntity: EntityValue,
    hpLoss: FloatValue,
    lethal: BoolValue,
    canBeBlockedByInvincibility: BoolValue,
    canBeBlockedByLockedHp: BoolValue,
    damagePopUpType: DamagePopUpType
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const hpLossObj = parseValue(hpLoss, 'float')
    const lethalObj = parseValue(lethal, 'bool')
    const canBeBlockedByInvincibilityObj = parseValue(canBeBlockedByInvincibility, 'bool')
    const canBeBlockedByLockedHpObj = parseValue(canBeBlockedByLockedHp, 'bool')
    const damagePopUpTypeObj = parseValue(damagePopUpType, 'enumeration')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'hp_loss',
      args: [
        targetEntityObj,
        hpLossObj,
        lethalObj,
        canBeBlockedByInvincibilityObj,
        canBeBlockedByLockedHpObj,
        damagePopUpTypeObj
      ]
    })
  }

  /**
   * 지정한 대상 엔티티의 HP를 직접 회복시킨다. [HP 회복]과 달리 어빌리티 유닛이 필요하지 않다
   *
   * @param recoverInitiatorEntity 회복 발동 엔티티: 회복을 발동하는 엔티티
   * @param recoverTargetEntity 회복 대상 엔티티: HP를 회복받을 대상 엔티티
   * @param recoveryAmount 회복량: 이번 HP 회복의 회복량
   * @param ignoreRecoveryAmountAdjustment 회복량 조정 무시 여부: True이면 대상의 회복량 조정 유닛 상태의 영향을 받지 않는다
   * @param aggroGenerationMultiplier 어그로 발생 배율: 이번 회복으로 발생하는 어그로 배율. 커스텀 어그로 모드 사용 시에만 의미가 있다
   * @param aggroGenerationIncrement 어그로 발생 증가량: 이번 회복으로 발생하는 어그로 증가량. 커스텀 어그로 모드 사용 시에만 의미가 있다
   * @param healingTagList 힐링 태그 리스트: 이번 회복 행동의 태그 리스트. [HP 회복 발동 시] 및 [HP 회복받을 때] 이벤트에서 꺼내어 특정 회복 행동을 식별하는 데 사용할 수 있다
   */
  recoverHpDirectly(
    recoverInitiatorEntity: EntityValue,
    recoverTargetEntity: EntityValue,
    recoveryAmount: FloatValue,
    ignoreRecoveryAmountAdjustment: BoolValue,
    aggroGenerationMultiplier: FloatValue,
    aggroGenerationIncrement: FloatValue,
    healingTagList: StrValue[]
  ): void {
    const recoverInitiatorEntityObj = parseValue(recoverInitiatorEntity, 'entity')
    const recoverTargetEntityObj = parseValue(recoverTargetEntity, 'entity')
    const recoveryAmountObj = parseValue(recoveryAmount, 'float')
    const ignoreRecoveryAmountAdjustmentObj = parseValue(ignoreRecoveryAmountAdjustment, 'bool')
    const aggroGenerationMultiplierObj = parseValue(aggroGenerationMultiplier, 'float')
    const aggroGenerationIncrementObj = parseValue(aggroGenerationIncrement, 'float')
    const healingTagListObj = parseValue(healingTagList, 'str_list')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'recover_hp_directly',
      args: [
        recoverInitiatorEntityObj,
        recoverTargetEntityObj,
        recoveryAmountObj,
        ignoreRecoveryAmountAdjustmentObj,
        aggroGenerationMultiplierObj,
        aggroGenerationIncrementObj,
        healingTagListObj
      ]
    })
  }

  /**
   * 대상 엔티티에서 일시정지된 기초 모션 장치를 재개한다. 대상 엔티티는 기초 모션 장치 컴포넌트를 보유해야 한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param motionDeviceName 모션 장치 이름: 해당 모션 장치의 식별자
   */
  recoverBasicMotionDevice(targetEntity: EntityValue, motionDeviceName: StrValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const motionDeviceNameObj = parseValue(motionDeviceName, 'str')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'recover_basic_motion_device',
      args: [targetEntityObj, motionDeviceNameObj]
    })
  }

  /**
   * 스테이지 런타임 중 대상 엔티티에 정점 이동형 기초 모션 장치를 동적으로 추가한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param motionDeviceName 모션 장치 이름: 해당 모션 장치의 식별자
   * @param movementMode 이동 방식
   * @param movementSpd 이동 속도
   * @param targetLocation 목표 위치: 절대 위치
   * @param targetRotation 목표 회전: 절대 회전
   * @param lockRotation 회전 잠금 여부
   * @param parameterType 파라미터 유형: 고정 속도 또는 고정 시간
   * @param movementTime 이동 시간
   */
  activateFixedPointMotionDevice(
    targetEntity: EntityValue,
    motionDeviceName: StrValue,
    movementMode: MovementMode,
    movementSpd: FloatValue,
    targetLocation: Vec3Value,
    targetRotation: Vec3Value,
    lockRotation: BoolValue,
    parameterType: FixedMotionParameterType,
    movementTime: FloatValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const motionDeviceNameObj = parseValue(motionDeviceName, 'str')
    const movementModeObj = parseValue(movementMode, 'enumeration')
    const movementSpdObj = parseValue(movementSpd, 'float')
    const targetLocationObj = parseValue(targetLocation, 'vec3')
    const targetRotationObj = parseValue(targetRotation, 'vec3')
    const lockRotationObj = parseValue(lockRotation, 'bool')
    const parameterTypeObj = parseValue(parameterType, 'enumeration')
    const movementTimeObj = parseValue(movementTime, 'float')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'activate_fixed_point_motion_device',
      args: [
        targetEntityObj,
        motionDeviceNameObj,
        movementModeObj,
        movementSpdObj,
        targetLocationObj,
        targetRotationObj,
        lockRotationObj,
        parameterTypeObj,
        movementTimeObj
      ]
    })
  }

  /**
   * 대상 엔티티의 기초 모션 장치 컴포넌트에 설정된 모션 장치를 활성화한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param motionDeviceName 모션 장치 이름: 해당 모션 장치의 식별자
   */
  activateBasicMotionDevice(targetEntity: EntityValue, motionDeviceName: StrValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const motionDeviceNameObj = parseValue(motionDeviceName, 'str')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'activate_basic_motion_device',
      args: [targetEntityObj, motionDeviceNameObj]
    })
  }

  /**
   * 스테이지 런타임 중 대상 엔티티에 목표 방향 회전형 기초 모션 장치를 동적으로 추가한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param motionDeviceName 모션 장치 이름: 해당 모션 장치의 식별자
   * @param motionDeviceDuration 모션 장치 지속 시간: 해당 모션 장치가 유효한 시간
   * @param targetAngle 목표 각도: 절대 각도
   */
  addTargetOrientedRotationBasedMotionDevice(
    targetEntity: EntityValue,
    motionDeviceName: StrValue,
    motionDeviceDuration: FloatValue,
    targetAngle: Vec3Value
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const motionDeviceNameObj = parseValue(motionDeviceName, 'str')
    const motionDeviceDurationObj = parseValue(motionDeviceDuration, 'float')
    const targetAngleObj = parseValue(targetAngle, 'vec3')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'add_target_oriented_rotation_based_motion_device',
      args: [targetEntityObj, motionDeviceNameObj, motionDeviceDurationObj, targetAngleObj]
    })
  }

  /**
   * 런타임 중 등속 직선형 기초 모션 장치를 동적으로 추가한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param motionDeviceName 모션 장치 이름: 해당 모션 장치의 식별자
   * @param motionDeviceDuration 모션 장치 지속 시간: 해당 모션 장치가 유효한 시간
   * @param velocityVector 속도 벡터: 속도의 크기와 방향을 결정한다
   */
  addUniformBasicLinearMotionDevice(
    targetEntity: EntityValue,
    motionDeviceName: StrValue,
    motionDeviceDuration: FloatValue,
    velocityVector: Vec3Value
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const motionDeviceNameObj = parseValue(motionDeviceName, 'str')
    const motionDeviceDurationObj = parseValue(motionDeviceDuration, 'float')
    const velocityVectorObj = parseValue(velocityVector, 'vec3')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'add_uniform_basic_linear_motion_device',
      args: [targetEntityObj, motionDeviceNameObj, motionDeviceDurationObj, velocityVectorObj]
    })
  }

  /**
   * 런타임 중 등속 회전형 기초 모션 장치를 동적으로 추가한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param motionDeviceName 모션 장치 이름: 해당 모션 장치의 식별자
   * @param motionDeviceDuration 모션 장치 지속 시간: 해당 모션 장치가 유효한 시간
   * @param angularVelocityS 각속도(도/초): 각속도의 크기
   * @param rotationAxisOrientation 회전축 방향: 상대 방향
   */
  addUniformBasicRotationBasedMotionDevice(
    targetEntity: EntityValue,
    motionDeviceName: StrValue,
    motionDeviceDuration: FloatValue,
    angularVelocityS: FloatValue,
    rotationAxisOrientation: Vec3Value
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const motionDeviceNameObj = parseValue(motionDeviceName, 'str')
    const motionDeviceDurationObj = parseValue(motionDeviceDuration, 'float')
    const angularVelocitySObj = parseValue(angularVelocityS, 'float')
    const rotationAxisOrientationObj = parseValue(rotationAxisOrientation, 'vec3')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'add_uniform_basic_rotation_based_motion_device',
      args: [
        targetEntityObj,
        motionDeviceNameObj,
        motionDeviceDurationObj,
        angularVelocitySObj,
        rotationAxisOrientationObj
      ]
    })
  }

  /**
   * 실행 중인 모션 장치를 중지하고 삭제한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param motionDeviceName 모션 장치 이름: 해당 모션 장치의 식별자
   * @param stopAllBasicMotionDevices 모든 기초 모션 장치 중지 여부: True이면 해당 엔티티의 모든 기초 모션 장치를 중지하고, False이면 지정한 이름의 모션 장치만 중지한다
   */
  stopAndDeleteBasicMotionDevice(
    targetEntity: EntityValue,
    motionDeviceName: StrValue,
    stopAllBasicMotionDevices: BoolValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const motionDeviceNameObj = parseValue(motionDeviceName, 'str')
    const stopAllBasicMotionDevicesObj = parseValue(stopAllBasicMotionDevices, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'stop_and_delete_basic_motion_device',
      args: [targetEntityObj, motionDeviceNameObj, stopAllBasicMotionDevicesObj]
    })
  }

  /**
   * 실행 중인 모션 장치를 일시 정지한다. 이후 모션 장치 재개 노드로 재개할 수 있다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param motionDeviceName 모션 장치 이름: 해당 모션 장치의 식별자
   */
  pauseBasicMotionDevice(targetEntity: EntityValue, motionDeviceName: StrValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const motionDeviceNameObj = parseValue(motionDeviceName, 'str')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'pause_basic_motion_device',
      args: [targetEntityObj, motionDeviceNameObj]
    })
  }

  /**
   * 대상 엔티티의 추적 모션 장치 컴포넌트 로직을 활성화/비활성화한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param activate 활성화 여부: True이면 활성화
   */
  activateDisableFollowMotionDevice(targetEntity: EntityValue, activate: BoolValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const activateObj = parseValue(activate, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'activate_disable_follow_motion_device',
      args: [targetEntityObj, activateObj]
    })
  }

  /**
   * GUID를 사용해 추적 모션 장치의 추적 대상을 전환한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param followTargetGuid 추적 대상 GUID: 추적 대상의 식별자
   * @param followTargetAttachmentPointName 추적 대상 어태치먼트 포인트 이름: 추적할 어태치먼트 포인트 이름
   * @param locationOffset 위치 오프셋: 추적 좌표계를 기준으로 한 위치 오프셋
   * @param rotationOffset 회전 오프셋: 추적 좌표계를 기준으로 한 회전 오프셋
   * @param followCoordinateSystem 추적 좌표계: 상대 좌표계 또는 월드 좌표계 선택
   * @param followType 추적 유형: 완전 추적, 위치 추적, 회전 추적 중 선택
   */
  switchFollowMotionDeviceTargetByGuid(
    targetEntity: EntityValue,
    followTargetGuid: GuidValue,
    followTargetAttachmentPointName: StrValue,
    locationOffset: Vec3Value,
    rotationOffset: Vec3Value,
    followCoordinateSystem: FollowCoordinateSystem,
    followType: FollowLocationType
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const followTargetGuidObj = parseValue(followTargetGuid, 'guid')
    const followTargetAttachmentPointNameObj = parseValue(followTargetAttachmentPointName, 'str')
    const locationOffsetObj = parseValue(locationOffset, 'vec3')
    const rotationOffsetObj = parseValue(rotationOffset, 'vec3')
    const followCoordinateSystemObj = parseValue(followCoordinateSystem, 'enumeration')
    const followTypeObj = parseValue(followType, 'enumeration')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'switch_follow_motion_device_target_by_guid',
      args: [
        targetEntityObj,
        followTargetGuidObj,
        followTargetAttachmentPointNameObj,
        locationOffsetObj,
        rotationOffsetObj,
        followCoordinateSystemObj,
        followTypeObj
      ]
    })
  }

  /**
   * 엔티티를 사용해 추적 모션 장치의 추적 대상을 전환한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param followTargetEntity 추적 대상 엔티티: 추적 대상의 엔티티
   * @param followTargetAttachmentPointName 추적 대상 어태치먼트 포인트 이름: 추적할 어태치먼트 포인트 이름
   * @param locationOffset 위치 오프셋: 추적 좌표계를 기준으로 한 위치 오프셋
   * @param rotationOffset 회전 오프셋: 추적 좌표계를 기준으로 한 회전 오프셋
   * @param followCoordinateSystem 추적 좌표계: 상대 좌표계 또는 월드 좌표계 선택
   * @param followType 추적 유형: 완전 추적, 위치 추적, 회전 추적 중 선택
   */
  switchFollowMotionDeviceTargetByEntity(
    targetEntity: EntityValue,
    followTargetEntity: EntityValue,
    followTargetAttachmentPointName: StrValue,
    locationOffset: Vec3Value,
    rotationOffset: Vec3Value,
    followCoordinateSystem: FollowCoordinateSystem,
    followType: FollowLocationType
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const followTargetEntityObj = parseValue(followTargetEntity, 'entity')
    const followTargetAttachmentPointNameObj = parseValue(followTargetAttachmentPointName, 'str')
    const locationOffsetObj = parseValue(locationOffset, 'vec3')
    const rotationOffsetObj = parseValue(rotationOffset, 'vec3')
    const followCoordinateSystemObj = parseValue(followCoordinateSystem, 'enumeration')
    const followTypeObj = parseValue(followType, 'enumeration')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'switch_follow_motion_device_target_by_entity',
      args: [
        targetEntityObj,
        followTargetEntityObj,
        followTargetAttachmentPointNameObj,
        locationOffsetObj,
        rotationOffsetObj,
        followCoordinateSystemObj,
        followTypeObj
      ]
    })
  }

  /**
   * 프리팹 ID를 사용해 투사체 엔티티를 생성한다. [프리팹 생성]과 유사하지만, 생성된 엔티티의 투사 모션 장치 컴포넌트에서 추적 투사 유형에 추적 대상을 설정하는 [추적 대상] 파라미터가 추가된다
   *
   * @param prefabId 프리팹 ID: 해당 투사체 프리팹의 식별자
   * @param location 위치: 절대 위치
   * @param rotate 회전: 절대 회전
   * @param ownerEntity 소유자 엔티티: 생성된 엔티티가 특정 엔티티에 귀속될지 결정한다
   * @param trackTarget 추적 대상: 투사 모션 장치 컴포넌트의 추적 투사 유형에 설정하는 추적 대상
   * @param overwriteLevel 레벨 덮어쓰기 여부: False이면 [레벨] 파라미터가 적용되지 않는다
   * @param level 레벨: 엔티티 생성 시의 레벨을 결정한다
   * @param unitTagIndexList 유닛 태그 인덱스 리스트: 엔티티 생성 시 부여할 유닛 태그를 결정한다
   * @returns 생성된 엔티티: 해당 투사체 프리팹의 속성을 상속한다
   */
  createProjectile(
    prefabId: PrefabIdValue,
    location: Vec3Value,
    rotate: Vec3Value,
    ownerEntity: EntityValue,
    trackTarget: EntityValue,
    overwriteLevel: BoolValue,
    level: IntValue,
    unitTagIndexList: IntValue[]
  ): entity {
    const prefabIdObj = parseValue(prefabId, 'prefab_id')
    const locationObj = parseValue(location, 'vec3')
    const rotateObj = parseValue(rotate, 'vec3')
    const ownerEntityObj = parseValue(ownerEntity, 'entity')
    const trackTargetObj = parseValue(trackTarget, 'entity')
    const overwriteLevelObj = parseValue(overwriteLevel, 'bool')
    const levelObj = parseValue(level, 'int')
    const unitTagIndexListObj = parseValue(unitTagIndexList, 'int_list')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'create_projectile',
      args: [
        prefabIdObj,
        locationObj,
        rotateObj,
        ownerEntityObj,
        trackTargetObj,
        overwriteLevelObj,
        levelObj,
        unitTagIndexListObj
      ]
    })
    const ret = new entity()
    ret.markPin(ref, 'createdEntity', 0)
    return ret as unknown as entity
  }

  /**
   * 대상 엔티티를 기준으로 시간 제한 이펙트를 재생한다. 유효한 대상 엔티티와 어태치먼트 포인트가 필요하다
   *
   * @param specialEffectsAsset 이펙트 에셋: 해당 이펙트의 식별자
   * @param targetEntity 대상 엔티티: 엔티티가 없으면 이펙트가 재생되지 않는다
   * @param attachmentPointName 어태치먼트 포인트 이름: 어태치먼트 포인트 이름이 없으면 이펙트가 재생되지 않는다
   * @param moveWithTheTarget 대상 이동 추적 여부: True이면 대상 엔티티의 이동을 따른다
   * @param rotateWithTheTarget 대상 회전 추적 여부: True이면 대상 엔티티의 회전을 따른다
   * @param locationOffset 위치 오프셋: 대상 엔티티의 지정 어태치먼트 포인트를 기준으로 한 위치 오프셋
   * @param rotationOffset 회전 오프셋: 대상 엔티티의 지정 어태치먼트 포인트를 기준으로 한 회전 오프셋
   * @param zoomMultiplier 배율: 해당 이펙트의 배율
   * @param playBuiltInSoundEffect 내장 음향 효과 재생 여부: True이면 내장 음향 효과도 함께 재생된다
   */
  playTimedEffects(
    specialEffectsAsset: ConfigIdValue,
    targetEntity: EntityValue,
    attachmentPointName: StrValue,
    moveWithTheTarget: BoolValue,
    rotateWithTheTarget: BoolValue,
    locationOffset: Vec3Value,
    rotationOffset: Vec3Value,
    zoomMultiplier: FloatValue,
    playBuiltInSoundEffect: BoolValue
  ): void {
    const specialEffectsAssetObj = parseValue(specialEffectsAsset, 'config_id')
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const attachmentPointNameObj = parseValue(attachmentPointName, 'str')
    const moveWithTheTargetObj = parseValue(moveWithTheTarget, 'bool')
    const rotateWithTheTargetObj = parseValue(rotateWithTheTarget, 'bool')
    const locationOffsetObj = parseValue(locationOffset, 'vec3')
    const rotationOffsetObj = parseValue(rotationOffset, 'vec3')
    const zoomMultiplierObj = parseValue(zoomMultiplier, 'float')
    const playBuiltInSoundEffectObj = parseValue(playBuiltInSoundEffect, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'play_timed_effects',
      args: [
        specialEffectsAssetObj,
        targetEntityObj,
        attachmentPointNameObj,
        moveWithTheTargetObj,
        rotateWithTheTargetObj,
        locationOffsetObj,
        rotationOffsetObj,
        zoomMultiplierObj,
        playBuiltInSoundEffectObj
      ]
    })
  }

  /**
   * 지정한 이펙트 에셋을 사용하는 모든 이펙트를 대상 엔티티에서 제거한다. 루프 이펙트에만 적용된다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param specialEffectsAsset 이펙트 에셋: 해당 이펙트의 식별자
   */
  clearSpecialEffectsBasedOnSpecialEffectAssets(
    targetEntity: EntityValue,
    specialEffectsAsset: ConfigIdValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const specialEffectsAssetObj = parseValue(specialEffectsAsset, 'config_id')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'clear_special_effects_based_on_special_effect_assets',
      args: [targetEntityObj, specialEffectsAssetObj]
    })
  }

  /**
   * 대상 엔티티를 기준으로 루프 이펙트를 마운트한다. 유효한 대상 엔티티와 어태치먼트 포인트가 필요하다. 이 노드는 저장 가능한 이펙트 인스턴스 ID를 반환하며, 이후 [루프 이펙트 제거] 노드 사용 시 이 ID로 지정 이펙트를 제거할 수 있다
   *
   * @param specialEffectsAsset 이펙트 에셋: 해당 이펙트의 식별자
   * @param targetEntity 대상 엔티티: 엔티티가 없으면 이펙트가 재생되지 않는다
   * @param attachmentPointName 어태치먼트 포인트 이름: 어태치먼트 포인트 이름이 없으면 이펙트가 재생되지 않는다
   * @param moveWithTheTarget 대상 이동 추적 여부: True이면 대상 엔티티의 이동을 따른다
   * @param rotateWithTheTarget 대상 회전 추적 여부: True이면 대상 엔티티의 회전을 따른다
   * @param locationOffset 위치 오프셋: 대상 엔티티의 지정 어태치먼트 포인트를 기준으로 한 위치 오프셋
   * @param rotationOffset 회전 오프셋: 대상 엔티티의 지정 어태치먼트 포인트를 기준으로 한 회전 오프셋
   * @param zoomMultiplier 배율: 해당 이펙트의 배율
   * @param playBuiltInSoundEffect 내장 음향 효과 재생 여부: True이면 내장 음향 효과도 함께 재생된다
   * @returns 이펙트 인스턴스 ID: 이펙트 마운트 시 자동 생성되는 인스턴스 ID
   */
  mountLoopingSpecialEffect(
    specialEffectsAsset: ConfigIdValue,
    targetEntity: EntityValue,
    attachmentPointName: StrValue,
    moveWithTheTarget: BoolValue,
    rotateWithTheTarget: BoolValue,
    locationOffset: Vec3Value,
    rotationOffset: Vec3Value,
    zoomMultiplier: FloatValue,
    playBuiltInSoundEffect: BoolValue
  ): bigint {
    const specialEffectsAssetObj = parseValue(specialEffectsAsset, 'config_id')
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const attachmentPointNameObj = parseValue(attachmentPointName, 'str')
    const moveWithTheTargetObj = parseValue(moveWithTheTarget, 'bool')
    const rotateWithTheTargetObj = parseValue(rotateWithTheTarget, 'bool')
    const locationOffsetObj = parseValue(locationOffset, 'vec3')
    const rotationOffsetObj = parseValue(rotationOffset, 'vec3')
    const zoomMultiplierObj = parseValue(zoomMultiplier, 'float')
    const playBuiltInSoundEffectObj = parseValue(playBuiltInSoundEffect, 'bool')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'mount_looping_special_effect',
      args: [
        specialEffectsAssetObj,
        targetEntityObj,
        attachmentPointNameObj,
        moveWithTheTargetObj,
        rotateWithTheTargetObj,
        locationOffsetObj,
        rotationOffsetObj,
        zoomMultiplierObj,
        playBuiltInSoundEffectObj
      ]
    })
    const ret = new int()
    ret.markPin(ref, 'specialEffectInstanceId', 0)
    return ret as unknown as bigint
  }

  /**
   * 이펙트 인스턴스 ID를 사용해 대상 엔티티의 지정 루프 이펙트를 제거한다. 마운트 성공 후 [루프 이펙트 마운트] 노드가 이펙트 인스턴스 ID를 생성한다
   *
   * @param specialEffectInstanceId 이펙트 인스턴스 ID: [루프 이펙트 마운트] 노드에서 자동 생성된 인스턴스 ID
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   */
  clearLoopingSpecialEffect(specialEffectInstanceId: IntValue, targetEntity: EntityValue): void {
    const specialEffectInstanceIdObj = parseValue(specialEffectInstanceId, 'int')
    const targetEntityObj = parseValue(targetEntity, 'entity')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'clear_looping_special_effect',
      args: [specialEffectInstanceIdObj, targetEntityObj]
    })
  }

  /**
   * 대상 엔티티에서 일시 정지된 타이머를 재개한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param timerName 타이머 이름: 해당 타이머의 식별자
   */
  resumeTimer(targetEntity: EntityValue, timerName: StrValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const timerNameObj = parseValue(timerName, 'str')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'resume_timer',
      args: [targetEntityObj, timerNameObj]
    })
  }

  /**
   * 대상 엔티티에서 타이머를 시작한다. 타이머는 이름으로 고유 식별된다. 타이머는 루프 또는 비루프 타이머 시퀀스로 구성되며, 시퀀스는 오름차순으로 정렬된 초 단위 시간 지점 목록이다. 타이머가 해당 지점에 도달하면 [타이머 트리거 시] 이벤트가 발생한다. 최대 시퀀스 길이는 100이다. 예를 들어 [1, 3, 5, 7]을 입력하면 1초, 3초, 5초, 7초에 이벤트가 발생한다. 루프가 True이면 마지막 시간 지점 도달 후 0초부터 다시 시작한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param timerName 타이머 이름: 해당 타이머의 식별자
   * @param loop 루프 여부: True이면 타이머 시퀀스를 반복 실행한다
   * @param timerSequence 타이머 시퀀스: 오름차순으로 정렬된 목록을 전달해야 한다. 목록이 유효하지 않으면(엄격한 오름차순이 아니거나 음수가 포함된 경우 등) 타이머가 실행되지 않는다
   */
  startTimer(
    targetEntity: EntityValue,
    timerName: StrValue,
    loop: BoolValue,
    timerSequence: FloatValue[]
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const timerNameObj = parseValue(timerName, 'str')
    const loopObj = parseValue(loop, 'bool')
    const timerSequenceObj = parseValue(timerSequence, 'float_list')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'start_timer',
      args: [targetEntityObj, timerNameObj, loopObj, timerSequenceObj]
    })
  }

  /**
   * 대상 엔티티에서 지정한 타이머를 일시 정지한다. 이후 [타이머 재개] 노드로 재개할 수 있다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param timerName 타이머 이름: 해당 타이머의 식별자
   */
  pauseTimer(targetEntity: EntityValue, timerName: StrValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const timerNameObj = parseValue(timerName, 'str')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'pause_timer',
      args: [targetEntityObj, timerNameObj]
    })
  }

  /**
   * 대상 엔티티에서 지정한 타이머를 완전히 종료한다. 재개할 수 없다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param timerName 타이머 이름: 해당 타이머의 식별자
   */
  stopTimer(targetEntity: EntityValue, timerName: StrValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const timerNameObj = parseValue(timerName, 'str')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'stop_timer',
      args: [targetEntityObj, timerNameObj]
    })
  }

  /**
   * 대상 엔티티에서 일시 정지된 글로벌 타이머를 재개한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param timerName 타이머 이름: 해당 타이머의 식별자. 타이머 관리에 설정된 타이머 이름만 참조할 수 있다
   */
  recoverGlobalTimer(targetEntity: EntityValue, timerName: StrValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const timerNameObj = parseValue(timerName, 'str')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'recover_global_timer',
      args: [targetEntityObj, timerNameObj]
    })
  }

  /**
   * 대상 엔티티에서 글로벌 타이머를 시작한다. 타이머는 이름으로 고유 식별된다. 타이머 관리 설정에 따라 카운트다운 또는 스톱워치 타이머가 생성된다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param timerName 타이머 이름: 해당 타이머의 식별자. 타이머 관리에 설정된 타이머 이름만 참조할 수 있다
   */
  startGlobalTimer(targetEntity: EntityValue, timerName: StrValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const timerNameObj = parseValue(timerName, 'str')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'start_global_timer',
      args: [targetEntityObj, timerNameObj]
    })
  }

  /**
   * 노드 그래프를 통해 실행 중인 글로벌 타이머의 시간을 조정한다. 타이머를 먼저 일시 정지한 후 시간을 줄이면 최솟값은 0초다. 카운트다운 타이머를 일시 정지 후 0초로 수정하고 재개하면 [글로벌 타이머 트리거 시] 이벤트가 발생한다. 일시 정지 후 0초로 수정한 다음 다시 늘리고 재개하면 해당 이벤트가 발생하지 않는다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param timerName 타이머 이름: 해당 타이머의 식별자. 타이머 관리에 설정된 타이머 이름만 참조할 수 있다
   * @param changeValue 변화값: 카운트다운 타이머의 경우 양수는 남은 시간 증가, 음수는 감소. 스톱워치 타이머의 경우 양수는 누적 시간 증가, 음수는 감소
   */
  modifyGlobalTimer(targetEntity: EntityValue, timerName: StrValue, changeValue: FloatValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const timerNameObj = parseValue(timerName, 'str')
    const changeValueObj = parseValue(changeValue, 'float')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_global_timer',
      args: [targetEntityObj, timerNameObj, changeValueObj]
    })
  }

  /**
   * 노드 그래프를 통해 실행 중인 글로벌 타이머를 일시 정지한다. 일시 정지 시 해당 타이머를 참조하는 UI 컨트롤의 표시도 함께 정지된다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param timerName 타이머 이름: 해당 타이머의 식별자. 타이머 관리에 설정된 타이머 이름만 참조할 수 있다
   */
  pauseGlobalTimer(targetEntity: EntityValue, timerName: StrValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const timerNameObj = parseValue(timerName, 'str')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'pause_global_timer',
      args: [targetEntityObj, timerNameObj]
    })
  }

  /**
   * 노드 그래프를 통해 실행 중인 글로벌 타이머를 조기 종료한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param timerName 타이머 이름: 해당 타이머의 식별자. 타이머 관리에 설정된 타이머 이름만 참조할 수 있다
   */
  stopGlobalTimer(targetEntity: EntityValue, timerName: StrValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const timerNameObj = parseValue(timerName, 'str')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'stop_global_timer',
      args: [targetEntityObj, timerNameObj]
    })
  }

  /**
   * 대상 플레이어 리스트의 메인 카메라 템플릿을 지정한 템플릿으로 전환한다
   *
   * @param targetPlayerList 대상 플레이어 리스트: 효과가 적용될 플레이어 리스트
   * @param cameraTemplateName 카메라 템플릿 이름: 카메라 템플릿의 식별자
   */
  switchMainCameraTemplate(targetPlayerList: PlayerEntity[], cameraTemplateName: StrValue): void {
    const targetPlayerListObj = parseValue(targetPlayerList, 'entity_list')
    const cameraTemplateNameObj = parseValue(cameraTemplateName, 'str')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'switch_main_camera_template',
      args: [targetPlayerListObj, cameraTemplateNameObj]
    })
  }

  /**
   * ID를 사용해 대상 엔티티에서 활성화된 캐릭터 방해 장치를 수정한다. ID가 없으면 변경이 적용되지 않는다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param deviceId 장치 ID: 캐릭터 방해 장치의 식별자
   */
  modifyingCharacterDisruptorDevice(targetEntity: EntityValue, deviceId: IntValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const deviceIdObj = parseValue(deviceId, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modifying_character_disruptor_device',
      args: [targetEntityObj, deviceIdObj]
    })
  }

  /**
   * 대상 엔티티에 지정한 스택 수의 유닛 상태를 추가한다
   *
   * @param applierEntity 적용자 엔티티: 이 행동의 적용자 엔티티를 결정한다. 기본값은 이 노드 그래프에 연결된 엔티티
   * @param applicationTargetEntity 적용 대상 엔티티: 실제로 해당 유닛 상태가 추가될 엔티티
   * @param unitStatusConfigId 유닛 상태 설정 ID: 해당 유닛 상태의 식별자
   * @param appliedStacks 적용 스택 수: 해당 유닛 상태의 스택 수
   * @param unitStatusParameterDictionary 유닛 상태 파라미터 딕셔너리: 유닛 상태에 정의된 파라미터를 덮어쓸 파라미터 세트를 전달할 수 있다. 현재는 보호막 템플릿 내 파라미터 덮어쓰기만 지원된다
   */
  addUnitStatus(
    applierEntity: EntityValue,
    applicationTargetEntity: EntityValue,
    unitStatusConfigId: ConfigIdValue,
    appliedStacks: IntValue,
    unitStatusParameterDictionary: dict<'str', 'float'>
  ): {
    /**
     * 적용 결과: 실패(기타 예외) / 실패(다른 상태에 양보): 대상의 현재 유닛 상태와 적용 중인 상태 사이에 양보 관계 존재 / 실패(병존 상한 초과): 대상 엔티티의 해당 유닛 상태가 병존 상한에 도달 / 실패(스택 추가 불가): 스택 추가 실패 / 성공(신규 상태 적용): 새 유닛 상태 적용 성공 / 성공(슬롯 스택): 대상에 이미 해당 유닛 상태가 있어 스택 적용
     */
    applicationResult: UnitStatusAdditionResult
    /**
     * 슬롯 ID: 적용 성공 시 해당 유닛 상태 인스턴스가 위치한 유닛 상태 슬롯 ID를 반환한다
     */
    slotId: bigint
  } {
    const applierEntityObj = parseValue(applierEntity, 'entity')
    const applicationTargetEntityObj = parseValue(applicationTargetEntity, 'entity')
    const unitStatusConfigIdObj = parseValue(unitStatusConfigId, 'config_id')
    const appliedStacksObj = parseValue(appliedStacks, 'int')
    const unitStatusParameterDictionaryObj = parseValue(unitStatusParameterDictionary, 'dict')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'add_unit_status',
      args: [
        applierEntityObj,
        applicationTargetEntityObj,
        unitStatusConfigIdObj,
        appliedStacksObj,
        unitStatusParameterDictionaryObj
      ]
    })
    return {
      applicationResult: (() => {
        const ret = new enumeration('UnitStatusAdditionResult')
        ret.markPin(ref, 'applicationResult', 0)
        return ret as unknown as UnitStatusAdditionResult
      })(),
      slotId: (() => {
        const ret = new int()
        ret.markPin(ref, 'slotId', 1)
        return ret as unknown as bigint
      })()
    }
  }

  /**
   * 대상 엔티티에서 지정된 유닛 상태를 제거한다. 모든 스택을 제거하거나 단일 스택만 제거하는 것을 선택할 수 있다
   *
   * @param removeTargetEntity 제거 대상 엔티티: 해당 유닛 상태가 제거될 엔티티
   * @param unitStatusConfigId 유닛 상태 설정 ID: 해당 유닛 상태의 식별자
   * @param removalMethod 제거 방식: 동일 이름의 모든 병존 상태 — 해당 설정 ID로 적용된 동명 상태를 모두 제거 / 스택 소실 속도가 가장 빠른 상태 — 가장 빠르게 스택을 잃는 상태에서 스택 하나를 제거
   * @param removerEntity 제거자 엔티티: 이 행동의 제거자 엔티티를 결정한다. 기본값은 이 노드 그래프에 연결된 엔티티
   */
  removeUnitStatus(
    removeTargetEntity: EntityValue,
    unitStatusConfigId: ConfigIdValue,
    removalMethod: RemovalMethod,
    removerEntity: EntityValue
  ): void {
    const removeTargetEntityObj = parseValue(removeTargetEntity, 'entity')
    const unitStatusConfigIdObj = parseValue(unitStatusConfigId, 'config_id')
    const removalMethodObj = parseValue(removalMethod, 'enumeration')
    const removerEntityObj = parseValue(removerEntity, 'entity')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'remove_unit_status',
      args: [removeTargetEntityObj, unitStatusConfigIdObj, removalMethodObj, removerEntityObj]
    })
  }

  /**
   * 대상 엔티티의 탭 컴포넌트에서 지정 ID에 해당하는 탭 상태를 수정한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param tabId 탭 ID: 탭의 식별자
   * @param activate 활성화 여부: True이면 활성화되어 선택 가능
   */
  activateDisableTab(targetEntity: EntityValue, tabId: IntValue, activate: BoolValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const tabIdObj = parseValue(tabId, 'int')
    const activateObj = parseValue(activate, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'activate_disable_tab',
      args: [targetEntityObj, tabIdObj, activateObj]
    })
  }

  /**
   * 대상 엔티티의 충돌 트리거 소스 컴포넌트 상태를 수정한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 엔티티
   * @param activate 활성화 여부: True이면 충돌 트리거 컴포넌트를 가진 엔티티와 충돌이 활성화됨
   */
  activateDisableCollisionTriggerSource(targetEntity: EntityValue, activate: BoolValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const activateObj = parseValue(activate, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'activate_disable_collision_trigger_source',
      args: [targetEntityObj, activateObj]
    })
  }

  /**
   * 플레이어의 현재 클래스 레벨을 설정한다. 정의된 범위를 초과하면 변경이 적용되지 않는다
   *
   * @param targetPlayer 대상 플레이어: 효과가 적용될 플레이어 엔티티
   * @param level 레벨: 변경 후의 레벨
   */
  changePlayerSCurrentClassLevel(targetPlayer: PlayerEntity, level: IntValue): void {
    const targetPlayerObj = parseValue(targetPlayer, 'entity')
    const levelObj = parseValue(level, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'change_player_s_current_class_level',
      args: [targetPlayerObj, levelObj]
    })
  }

  /**
   * 플레이어의 현재 클래스를 설정 ID가 참조하는 클래스로 변경한다
   *
   * @param targetPlayer 대상 플레이어: 효과가 적용될 플레이어 엔티티
   * @param classConfigId 클래스 설정 ID: 해당 클래스의 식별자
   */
  changePlayerClass(targetPlayer: PlayerEntity, classConfigId: ConfigIdValue): void {
    const targetPlayerObj = parseValue(targetPlayer, 'entity')
    const classConfigIdObj = parseValue(classConfigId, 'config_id')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'change_player_class',
      args: [targetPlayerObj, classConfigIdObj]
    })
  }

  /**
   * 플레이어의 현재 클래스 EXP를 증가시킨다. 최대 레벨을 초과하는 부분은 적용되지 않는다
   *
   * @param targetPlayer 대상 플레이어: 효과가 적용될 플레이어 엔티티
   * @param exp 경험치: 증가시킬 경험치 수치
   */
  increasePlayerSCurrentClassExp(targetPlayer: PlayerEntity, exp: IntValue): void {
    const targetPlayerObj = parseValue(targetPlayer, 'entity')
    const expObj = parseValue(exp, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'increase_player_s_current_class_exp',
      args: [targetPlayerObj, expObj]
    })
  }

  /**
   * 대상 플레이어의 인터페이스 레이아웃에서 UI 컨트롤 그룹 라이브러리에 저장된 커스텀 템플릿 형태의 UI 컨트롤 그룹을 활성화한다
   *
   * @param targetPlayer 대상 플레이어: 효과가 적용될 플레이어 엔티티
   * @param uiControlGroupIndex UI 컨트롤 그룹 인덱스: UI 컨트롤 그룹의 식별자
   */
  activateUiControlGroupInControlGroupLibrary(
    targetPlayer: PlayerEntity,
    uiControlGroupIndex: IntValue
  ): void {
    const targetPlayerObj = parseValue(targetPlayer, 'entity')
    const uiControlGroupIndexObj = parseValue(uiControlGroupIndex, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'activate_ui_control_group_in_control_group_library',
      args: [targetPlayerObj, uiControlGroupIndexObj]
    })
  }

  /**
   * 레이아웃 ID를 통해 대상 플레이어의 현재 인터페이스 레이아웃을 전환한다
   *
   * @param targetPlayer 대상 플레이어: 효과가 적용될 플레이어 엔티티
   * @param layoutIndex 레이아웃 인덱스: UI 레이아웃의 식별자
   */
  switchCurrentInterfaceLayout(targetPlayer: PlayerEntity, layoutIndex: IntValue): void {
    const targetPlayerObj = parseValue(targetPlayer, 'entity')
    const layoutIndexObj = parseValue(layoutIndex, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'switch_current_interface_layout',
      args: [targetPlayerObj, layoutIndexObj]
    })
  }

  /**
   * UI 컨트롤 ID를 통해 대상 플레이어의 인터페이스 레이아웃 내 UI 컨트롤 상태를 수정한다
   *
   * @param targetPlayer 대상 플레이어: 효과가 적용될 플레이어 엔티티
   * @param uiControlIndex UI 컨트롤 인덱스: UI 컨트롤의 식별자
   * @param displayStatus 표시 상태: 꺼짐 — 보이지 않으며 로직 미실행 / 켜짐 — 보이며 로직 정상 실행 / 숨김 — 보이지 않으나 로직 정상 실행
   */
  modifyUiControlStatusWithinTheInterfaceLayout(
    targetPlayer: PlayerEntity,
    uiControlIndex: IntValue,
    displayStatus: UIControlGroupStatus
  ): void {
    const targetPlayerObj = parseValue(targetPlayer, 'entity')
    const uiControlIndexObj = parseValue(uiControlIndex, 'int')
    const displayStatusObj = parseValue(displayStatus, 'enumeration')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_ui_control_status_within_the_interface_layout',
      args: [targetPlayerObj, uiControlIndexObj, displayStatusObj]
    })
  }

  /**
   * 대상 플레이어의 인터페이스 레이아웃에서 [UI 컨트롤 그룹 라이브러리 내 UI 컨트롤 그룹 활성화] 노드로 활성화된 UI 컨트롤 그룹을 제거한다
   *
   * @param targetPlayer 대상 플레이어: 효과가 적용될 플레이어 엔티티
   * @param uiControlGroupIndex UI 컨트롤 그룹 인덱스: UI 컨트롤 그룹의 식별자
   */
  removeInterfaceControlGroupFromControlGroupLibrary(
    targetPlayer: PlayerEntity,
    uiControlGroupIndex: IntValue
  ): void {
    const targetPlayerObj = parseValue(targetPlayer, 'entity')
    const uiControlGroupIndexObj = parseValue(uiControlGroupIndex, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'remove_interface_control_group_from_control_group_library',
      args: [targetPlayerObj, uiControlGroupIndexObj]
    })
  }

  /**
   * 최대 쿨다운 대비 비율로 캐릭터 스킬 슬롯의 스킬 쿨다운 퍼센트를 수정한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 캐릭터 엔티티
   * @param characterSkillSlot 스킬 슬롯: 수정할 스킬이 위치한 슬롯 (일반 공격, 스킬1-E, 스킬2-Q, 스킬3-R, 스킬4-T, 커스텀 스킬)
   * @param cooldownRatioModifier 쿨다운 비율 수정값: 수정 후 실제 쿨다운 = 원래 쿨다운 × 쿨다운 비율 수정값
   * @param limitMaximumCdTime 최대 쿨다운 제한 여부: True이면 수정 후 쿨다운이 지정된 최솟값 미만이 되지 않도록 제한
   */
  modifySkillCdPercentageBasedOnMaxCd(
    targetEntity: CharacterEntity,
    characterSkillSlot: CharacterSkillSlot,
    cooldownRatioModifier: FloatValue,
    limitMaximumCdTime: BoolValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const characterSkillSlotObj = parseValue(characterSkillSlot, 'enumeration')
    const cooldownRatioModifierObj = parseValue(cooldownRatioModifier, 'float')
    const limitMaximumCdTimeObj = parseValue(limitMaximumCdTime, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_skill_cd_percentage_based_on_max_cd',
      args: [
        targetEntityObj,
        characterSkillSlotObj,
        cooldownRatioModifierObj,
        limitMaximumCdTimeObj
      ]
    })
  }

  /**
   * 대상 캐릭터의 스킬을 클래스 템플릿에 정의된 스킬로 초기화한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 캐릭터 엔티티
   * @param characterSkillSlot 스킬 슬롯: 초기화할 스킬이 위치한 슬롯 (일반 공격, 스킬1-E, 스킬2-Q, 스킬3-R, 스킬4-T, 커스텀 스킬)
   */
  initializeCharacterSkill(
    targetEntity: CharacterEntity,
    characterSkillSlot: CharacterSkillSlot
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const characterSkillSlotObj = parseValue(characterSkillSlot, 'enumeration')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'initialize_character_skill',
      args: [targetEntityObj, characterSkillSlotObj]
    })
  }

  /**
   * 캐릭터의 스킬 자원량을 설정한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 캐릭터 엔티티
   * @param skillResourceConfigId 스킬 자원 설정 ID: 스킬 자원의 식별자
   * @param targetValue 목표값: 수정 후의 값이 이 입력값으로 설정됨
   */
  setSkillResourceAmount(
    targetEntity: CharacterEntity,
    skillResourceConfigId: ConfigIdValue,
    targetValue: FloatValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const skillResourceConfigIdObj = parseValue(skillResourceConfigId, 'config_id')
    const targetValueObj = parseValue(targetValue, 'float')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_skill_resource_amount',
      args: [targetEntityObj, skillResourceConfigIdObj, targetValueObj]
    })
  }

  /**
   * 대상 캐릭터의 특정 스킬 슬롯 쿨다운을 지정값으로 직접 설정한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 캐릭터 엔티티
   * @param characterSkillSlot 스킬 슬롯: 수정할 스킬이 위치한 슬롯 (일반 공격, 스킬1-E, 스킬2-Q, 스킬3-R, 스킬4-T, 커스텀 스킬)
   * @param remainingCdTime 쿨다운 잔여 시간: 수정 후 쿨다운이 이 입력값으로 설정됨
   * @param limitMaximumCdTime 최대 쿨다운 제한 여부: True이면 수정 후 쿨다운이 지정된 최솟값 미만이 되지 않도록 제한
   */
  setCharacterSkillCd(
    targetEntity: CharacterEntity,
    characterSkillSlot: CharacterSkillSlot,
    remainingCdTime: FloatValue,
    limitMaximumCdTime: BoolValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const characterSkillSlotObj = parseValue(characterSkillSlot, 'enumeration')
    const remainingCdTimeObj = parseValue(remainingCdTime, 'float')
    const limitMaximumCdTimeObj = parseValue(limitMaximumCdTime, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_character_skill_cd',
      args: [targetEntityObj, characterSkillSlotObj, remainingCdTimeObj, limitMaximumCdTimeObj]
    })
  }

  /**
   * 지정된 대상 캐릭터의 스킬 슬롯에 스킬을 추가한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 캐릭터 엔티티
   * @param skillConfigId 스킬 설정 ID: 스킬의 식별자
   * @param skillSlot 스킬 슬롯: 추가할 스킬이 위치할 슬롯 (일반 공격, 스킬1-E, 스킬2-Q, 스킬3-R, 스킬4-T, 커스텀 스킬)
   */
  addCharacterSkill(
    targetEntity: CharacterEntity,
    skillConfigId: ConfigIdValue,
    skillSlot: CharacterSkillSlot
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const skillConfigIdObj = parseValue(skillConfigId, 'config_id')
    const skillSlotObj = parseValue(skillSlot, 'enumeration')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'add_character_skill',
      args: [targetEntityObj, skillConfigIdObj, skillSlotObj]
    })
  }

  /**
   * 변경값을 현재값에 더해 스킬 자원량을 수정한다. 변경값은 음수일 수 있다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 캐릭터 엔티티
   * @param skillResourceConfigId 스킬 자원 설정 ID: 스킬 자원의 식별자
   * @param changeValue 변경값: 수정 후 값 = 원래 값 + 변경값
   */
  modifySkillResourceAmount(
    targetEntity: CharacterEntity,
    skillResourceConfigId: ConfigIdValue,
    changeValue: FloatValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const skillResourceConfigIdObj = parseValue(skillResourceConfigId, 'config_id')
    const changeValueObj = parseValue(changeValue, 'float')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_skill_resource_amount',
      args: [targetEntityObj, skillResourceConfigIdObj, changeValueObj]
    })
  }

  /**
   * 클래식 모드에서만 사용 가능; 지정된 캐릭터의 원소 에너지를 설정한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 캐릭터 엔티티
   * @param elementalEnergy 원소 에너지
   */
  setCharacterSElementalEnergy(targetEntity: CharacterEntity, elementalEnergy: FloatValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const elementalEnergyObj = parseValue(elementalEnergy, 'float')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_character_s_elemental_energy',
      args: [targetEntityObj, elementalEnergyObj]
    })
  }

  /**
   * 클래식 모드에서만 사용 가능; 지정된 캐릭터의 원소 에너지를 증가시킨다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 캐릭터 엔티티
   * @param increaseValue 증가값
   */
  increasesCharacterSElementalEnergy(
    targetEntity: CharacterEntity,
    increaseValue: FloatValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const increaseValueObj = parseValue(increaseValue, 'float')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'increases_character_s_elemental_energy',
      args: [targetEntityObj, increaseValueObj]
    })
  }

  /**
   * 대상 캐릭터의 특정 스킬 슬롯 쿨다운을 수정한다. 수정값을 현재 쿨다운에 더하며, 수정값은 음수일 수 있다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 캐릭터 엔티티
   * @param characterSkillSlot 스킬 슬롯: 수정할 스킬이 위치한 슬롯 (일반 공격, 스킬1-E, 스킬2-Q, 스킬3-R, 스킬4-T, 커스텀 스킬)
   * @param cdModifier 쿨다운 수정값: 수정 후 값 = 원래 값 + 수정값
   * @param limitMaximumCdTime 최대 쿨다운 제한 여부: True이면 수정 후 쿨다운이 지정된 최솟값 미만이 되지 않도록 제한
   */
  modifyCharacterSkillCd(
    targetEntity: CharacterEntity,
    characterSkillSlot: CharacterSkillSlot,
    cdModifier: FloatValue,
    limitMaximumCdTime: BoolValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const characterSkillSlotObj = parseValue(characterSkillSlot, 'enumeration')
    const cdModifierObj = parseValue(cdModifier, 'float')
    const limitMaximumCdTimeObj = parseValue(limitMaximumCdTime, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_character_skill_cd',
      args: [targetEntityObj, characterSkillSlotObj, cdModifierObj, limitMaximumCdTimeObj]
    })
  }

  /**
   * 대상 캐릭터의 지정 슬롯에 있는 스킬을 삭제한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 캐릭터 엔티티
   * @param characterSkillSlot 스킬 슬롯: 삭제할 스킬이 위치한 슬롯 (일반 공격, 스킬1-E, 스킬2-Q, 스킬3-R, 스킬4-T, 커스텀 스킬)
   */
  deleteCharacterSkillBySlot(
    targetEntity: CharacterEntity,
    characterSkillSlot: CharacterSkillSlot
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const characterSkillSlotObj = parseValue(characterSkillSlot, 'enumeration')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'delete_character_skill_by_slot',
      args: [targetEntityObj, characterSkillSlotObj]
    })
  }

  /**
   * 캐릭터의 모든 슬롯을 순회하여 지정된 설정 ID를 가진 모든 스킬을 삭제한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 캐릭터 엔티티
   * @param skillConfigId 스킬 설정 ID: 스킬의 식별자
   */
  deleteCharacterSkillById(targetEntity: CharacterEntity, skillConfigId: ConfigIdValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const skillConfigIdObj = parseValue(skillConfigId, 'config_id')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'delete_character_skill_by_id',
      args: [targetEntityObj, skillConfigIdObj]
    })
  }

  /**
   * 플레이어의 배경음악 볼륨을 조정한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 플레이어 엔티티
   * @param volume 볼륨
   */
  adjustPlayerBackgroundMusicVolume(targetEntity: PlayerEntity, volume: IntValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const volumeObj = parseValue(volume, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'adjust_player_background_music_volume',
      args: [targetEntityObj, volumeObj]
    })
  }

  /**
   * 대상 엔티티의 음향 효과 플레이어 컴포넌트에서 지정 ID의 음향 효과 플레이어 볼륨과 재생 속도를 조정한다
   *
   * @param targetEntity 대상 엔티티
   * @param sfxPlayerId 음향 효과 플레이어 ID
   * @param volume 볼륨
   * @param playbackSpeed 재생 속도
   */
  adjustSpecifiedSoundEffectPlayer(
    targetEntity: EntityValue,
    sfxPlayerId: IntValue,
    volume: IntValue,
    playbackSpeed: FloatValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const sfxPlayerIdObj = parseValue(sfxPlayerId, 'int')
    const volumeObj = parseValue(volume, 'int')
    const playbackSpeedObj = parseValue(playbackSpeed, 'float')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'adjust_specified_sound_effect_player',
      args: [targetEntityObj, sfxPlayerIdObj, volumeObj, playbackSpeedObj]
    })
  }

  /**
   * 지정된 대상 엔티티의 음향 효과 플레이어 컴포넌트에서 지정 ID의 음향 효과 플레이어를 비활성화한다
   *
   * @param targetEntity 대상 엔티티
   * @param sfxPlayerId 음향 효과 플레이어 ID
   */
  closeSpecifiedSoundEffectPlayer(targetEntity: EntityValue, sfxPlayerId: IntValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const sfxPlayerIdObj = parseValue(sfxPlayerId, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'close_specified_sound_effect_player',
      args: [targetEntityObj, sfxPlayerIdObj]
    })
  }

  /**
   * 지정된 플레이어의 배경음악 상태를 수정한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 플레이어 엔티티
   * @param recover 재개 여부
   */
  startPausePlayerBackgroundMusic(targetEntity: PlayerEntity, recover: BoolValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const recoverObj = parseValue(recover, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'start_pause_player_background_music',
      args: [targetEntityObj, recoverObj]
    })
  }

  /**
   * 대상 엔티티의 음향 효과 플레이어 컴포넌트에서 지정 ID의 음향 효과 플레이어 상태를 수정한다. 루프 재생으로 설정된 음향 효과에만 유효하며, 단회 재생 음향 효과에는 적용되지 않는다
   *
   * @param targetEntity 대상 엔티티
   * @param sfxPlayerId 음향 효과 플레이어 ID
   * @param recover 재개 여부
   */
  startPauseSpecifiedSoundEffectPlayer(
    targetEntity: EntityValue,
    sfxPlayerId: IntValue,
    recover: BoolValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const sfxPlayerIdObj = parseValue(sfxPlayerId, 'int')
    const recoverObj = parseValue(recover, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'start_pause_specified_sound_effect_player',
      args: [targetEntityObj, sfxPlayerIdObj, recoverObj]
    })
  }

  /**
   * 음향 효과 플레이어를 동적으로 추가한다. 유닛이 음향 효과 플레이어 컴포넌트를 보유해야 한다
   *
   * @param targetEntity 대상 엔티티
   * @param soundEffectAssetIndex 음향 효과 에셋 인덱스
   * @param volume 볼륨
   * @param playbackSpeed 재생 속도
   * @param loopPlayback 루프 재생 여부
   * @param loopIntervalTime 루프 간격 시간
   * @param _3dSoundEffect 3D 음향 효과 여부
   * @param rangeRadius 범위 반경
   * @param attenuationMode 감쇠 방식
   * @param attachmentPointName 부착 지점 이름
   * @param attachmentPointOffset 부착 지점 오프셋
   * @returns 음향 효과 플레이어 ID
   */
  addSoundEffectPlayer(
    targetEntity: EntityValue,
    soundEffectAssetIndex: IntValue,
    volume: IntValue,
    playbackSpeed: FloatValue,
    loopPlayback: BoolValue,
    loopIntervalTime: FloatValue,
    _3dSoundEffect: BoolValue,
    rangeRadius: FloatValue,
    attenuationMode: SoundAttenuationMode,
    attachmentPointName: StrValue,
    attachmentPointOffset: Vec3Value
  ): bigint {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const soundEffectAssetIndexObj = parseValue(soundEffectAssetIndex, 'int')
    const volumeObj = parseValue(volume, 'int')
    const playbackSpeedObj = parseValue(playbackSpeed, 'float')
    const loopPlaybackObj = parseValue(loopPlayback, 'bool')
    const loopIntervalTimeObj = parseValue(loopIntervalTime, 'float')
    const _3dSoundEffectObj = parseValue(_3dSoundEffect, 'bool')
    const rangeRadiusObj = parseValue(rangeRadius, 'float')
    const attenuationModeObj = parseValue(attenuationMode, 'enumeration')
    const attachmentPointNameObj = parseValue(attachmentPointName, 'str')
    const attachmentPointOffsetObj = parseValue(attachmentPointOffset, 'vec3')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'add_sound_effect_player',
      args: [
        targetEntityObj,
        soundEffectAssetIndexObj,
        volumeObj,
        playbackSpeedObj,
        loopPlaybackObj,
        loopIntervalTimeObj,
        _3dSoundEffectObj,
        rangeRadiusObj,
        attenuationModeObj,
        attachmentPointNameObj,
        attachmentPointOffsetObj
      ]
    })
    const ret = new int()
    ret.markPin(ref, 'sfxPlayerId', 0)
    return ret as unknown as bigint
  }

  /**
   * 플레이어가 단회 2D 음향 효과를 재생한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 플레이어 엔티티
   * @param soundEffectAssetIndex 음향 효과 에셋 인덱스
   * @param volume 볼륨
   * @param playbackSpeed 재생 속도
   */
  playerPlaysOneShot2dSoundEffect(
    targetEntity: PlayerEntity,
    soundEffectAssetIndex: IntValue,
    volume: IntValue,
    playbackSpeed: FloatValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const soundEffectAssetIndexObj = parseValue(soundEffectAssetIndex, 'int')
    const volumeObj = parseValue(volume, 'int')
    const playbackSpeedObj = parseValue(playbackSpeed, 'float')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'player_plays_one_shot2d_sound_effect',
      args: [targetEntityObj, soundEffectAssetIndexObj, volumeObj, playbackSpeedObj]
    })
  }

  /**
   * 플레이어의 배경음악 관련 파라미터를 수정한다
   *
   * @param targetEntity 대상 엔티티: 효과가 적용될 플레이어 엔티티
   * @param backgroundMusicIndex 배경음악 인덱스
   * @param startTime 시작 시간
   * @param endTime 종료 시간
   * @param volume 볼륨
   * @param loopPlayback 루프 재생 여부
   * @param loopInterval 루프 재생 간격
   * @param playbackSpeed 재생 속도
   * @param enableFadeInOut 페이드 인/아웃 허용 여부
   */
  modifyPlayerBackgroundMusic(
    targetEntity: PlayerEntity,
    backgroundMusicIndex: IntValue,
    startTime: FloatValue,
    endTime: FloatValue,
    volume: IntValue,
    loopPlayback: BoolValue,
    loopInterval: FloatValue,
    playbackSpeed: FloatValue,
    enableFadeInOut: BoolValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const backgroundMusicIndexObj = parseValue(backgroundMusicIndex, 'int')
    const startTimeObj = parseValue(startTime, 'float')
    const endTimeObj = parseValue(endTime, 'float')
    const volumeObj = parseValue(volume, 'int')
    const loopPlaybackObj = parseValue(loopPlayback, 'bool')
    const loopIntervalObj = parseValue(loopInterval, 'float')
    const playbackSpeedObj = parseValue(playbackSpeed, 'float')
    const enableFadeInOutObj = parseValue(enableFadeInOut, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_player_background_music',
      args: [
        targetEntityObj,
        backgroundMusicIndexObj,
        startTimeObj,
        endTimeObj,
        volumeObj,
        loopPlaybackObj,
        loopIntervalObj,
        playbackSpeedObj,
        enableFadeInOutObj
      ]
    })
  }

  /**
   * 지정된 엔티티의 유닛 태그를 모두 지운다
   *
   * @param targetEntity 대상 엔티티
   */
  clearUnitTagsFromEntity(targetEntity: EntityValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'clear_unit_tags_from_entity',
      args: [targetEntityObj]
    })
  }

  /**
   * 지정된 엔티티에 유닛 태그를 추가한다
   *
   * @param targetEntity 대상 엔티티
   * @param unitTagIndex 유닛 태그 인덱스
   */
  addUnitTagToEntity(targetEntity: EntityValue, unitTagIndex: IntValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const unitTagIndexObj = parseValue(unitTagIndex, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'add_unit_tag_to_entity',
      args: [targetEntityObj, unitTagIndexObj]
    })
  }

  /**
   * 지정된 엔티티에서 유닛 태그를 제거한다
   *
   * @param targetEntity 대상 엔티티
   * @param unitTagIndex 유닛 태그 인덱스
   */
  removeUnitTagFromEntity(targetEntity: EntityValue, unitTagIndex: IntValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const unitTagIndexObj = parseValue(unitTagIndex, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'remove_unit_tag_from_entity',
      args: [targetEntityObj, unitTagIndexObj]
    })
  }

  /**
   * 커스텀 어그로 모드에서만 사용 가능; 도발자 엔티티가 지정된 대상 엔티티를 도발하게 한다
   *
   * @param taunterEntity 도발자 엔티티
   * @param targetEntity 대상 엔티티
   */
  tauntTarget(taunterEntity: EntityValue, targetEntity: EntityValue): void {
    const taunterEntityObj = parseValue(taunterEntity, 'entity')
    const targetEntityObj = parseValue(targetEntity, 'entity')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'taunt_target',
      args: [taunterEntityObj, targetEntityObj]
    })
  }

  /**
   * 커스텀 어그로 모드에서만 사용 가능; 어그로 소유자의 어그로 리스트에서 대상 엔티티를 제거한다. 대상이 전투에서 이탈할 수 있다
   *
   * @param targetEntity 대상 엔티티
   * @param aggroOwnerEntity 어그로 소유자 엔티티
   */
  removeTargetEntityFromAggroList(targetEntity: EntityValue, aggroOwnerEntity: EntityValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const aggroOwnerEntityObj = parseValue(aggroOwnerEntity, 'entity')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'remove_target_entity_from_aggro_list',
      args: [targetEntityObj, aggroOwnerEntityObj]
    })
  }

  /**
   * 커스텀 어그로 모드에서만 사용 가능; 어그로 소유자의 어그로 리스트를 초기화한다. 전투 이탈로 이어질 수 있다
   *
   * @param aggroOwner 어그로 소유자
   */
  clearSpecifiedTargetSAggroList(aggroOwner: EntityValue): void {
    const aggroOwnerObj = parseValue(aggroOwner, 'entity')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'clear_specified_target_s_aggro_list',
      args: [aggroOwnerObj]
    })
  }

  /**
   * 커스텀 어그로 모드에서만 사용 가능; 지정된 어그로 소유자에 대한 지정된 대상 엔티티의 어그로 수치를 설정한다
   *
   * @param targetEntity 대상 엔티티
   * @param aggroOwnerEntity 어그로 소유자 엔티티
   * @param aggroValue 어그로 수치
   */
  setTheAggroValueOfSpecifiedEntity(
    targetEntity: EntityValue,
    aggroOwnerEntity: EntityValue,
    aggroValue: IntValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const aggroOwnerEntityObj = parseValue(aggroOwnerEntity, 'entity')
    const aggroValueObj = parseValue(aggroValue, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_the_aggro_value_of_specified_entity',
      args: [targetEntityObj, aggroOwnerEntityObj, aggroValueObj]
    })
  }

  /**
   * 스테이지 전역에 커스텀 시그널을 전송한다. 사용 전에 해당 시그널 이름을 먼저 선택해야 파라미터를 올바르게 사용할 수 있다
   *
   * GSTS 참고: 에디터의 시그널 관리자에 시그널을 등록해야 한다. 시그널 분배를 사용하면 대형 루프로 인한 부하 제한을 피할 수 있어 성능 최적화에 활용 가능하다
   *
   * @param signalName 시그널 이름 (리터럴 문자열만 지원)
   * @param signalArgs 시그널 커스텀 인자 배열 (선택). 각 항목은 `name`, `type`, `value`로 구성. 인자의 이름, 타입, 순서는 에디터의 시그널 관리자에 등록된 시그널 정의와 반드시 일치해야 함. 배열 값은 raw JS 배열(자동 래핑) 또는 `list()` 헬퍼로 전달 가능. 지원 타입: entity, guid, int, bool, float, str, vec3, config_id, prefab_id 및 `_list` 변형 (총 18종)
   *
   * @example
   * ```ts
   * f.sendSignal('DamageSignal', [
   *   { name: 'target', type: 'entity', value: evt.eventSourceEntity },
   *   { name: 'amount', type: 'int', value: 100n },
   *   { name: 'ids', type: 'int_list', value: [1n, 2n, 3n] }
   * ])
   * ```
   */
  sendSignal(
    signalName: StrValue,
    signalArgs?: Array<{ name: string; type: string; value: any }>
  ): void {
    const signalNameObj = ensureLiteralStr(signalName, 'signalName')
    const args: value[] = [signalNameObj]
    let signalParams: Array<{ name: string; type: string }> | undefined
    if (signalArgs && signalArgs.length > 0) {
      signalParams = signalArgs.map((arg) => {
        let v = arg.value
        // Auto-wrap raw JS arrays into assembly_list node (conn) for _list types
        if (arg.type.endsWith('_list') && Array.isArray(v)) {
          const baseType = arg.type.slice(0, -5)
          v = this.assemblyList(v, baseType as any)
        }
        const parsed = parseValue(v, arg.type as any)
        args.push(parsed)
        return { name: arg.name, type: arg.type }
      })
    }
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'send_signal',
      args,
      ...(signalParams ? { signalParams } : {})
    })
  }

  /**
   * 지정된 대상의 활성 명판 리스트를 직접 설정한다. 입력 리스트에 포함된 명판은 활성화되고, 포함되지 않은 명판은 비활성화된다
   *
   * @param targetEntity 대상 엔티티
   * @param nameplateConfigIdList 명판 설정 ID 리스트
   */
  setEntityActiveNameplate(
    targetEntity: EntityValue,
    nameplateConfigIdList: ConfigIdValue[]
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const nameplateConfigIdListObj = parseValue(nameplateConfigIdList, 'config_id_list')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_entity_active_nameplate',
      args: [targetEntityObj, nameplateConfigIdListObj]
    })
  }

  /**
   * 대상 엔티티의 텍스트 버블 컴포넌트에서 현재 활성화된 텍스트 버블을 설정 ID에 해당하는 것으로 교체한다
   *
   * @param targetEntity 대상 엔티티
   * @param textBubbleConfigurationId 텍스트 버블 설정 ID
   */
  switchActiveTextBubble(
    targetEntity: EntityValue,
    textBubbleConfigurationId: ConfigIdValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const textBubbleConfigurationIdObj = parseValue(textBubbleConfigurationId, 'config_id')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'switch_active_text_bubble',
      args: [targetEntityObj, textBubbleConfigurationIdObj]
    })
  }

  /**
   * 지정된 플레이어의 현재 활성화된 덱 선택기를 닫는다
   *
   * @param targetPlayer 대상 플레이어: 효과가 적용될 플레이어 엔티티
   * @param deckSelectorIndex 덱 선택기 인덱스
   */
  closeDeckSelector(targetPlayer: PlayerEntity, deckSelectorIndex: IntValue): void {
    const targetPlayerObj = parseValue(targetPlayer, 'entity')
    const deckSelectorIndexObj = parseValue(deckSelectorIndex, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'close_deck_selector',
      args: [targetPlayerObj, deckSelectorIndexObj]
    })
  }

  /**
   * 대상 플레이어에게 미리 제작된 덱 선택기를 열어준다
   *
   * @param targetPlayer 대상 플레이어: 덱 선택기를 호출할 런타임 플레이어를 지정
   * @param deckSelectorId 덱 선택기 인덱스: 참조하는 UI 컨트롤 그룹 인덱스
   * @param selectDuration 선택 시간: 비어 있으면 덱 선택기의 기본 설정을 사용하고, 값이 있으면 해당 시간(초)이 실제 유효 지속 시간으로 사용됨
   * @param selectResultCorrespondingList 선택 결과 대응 리스트: 표시 항목과 일대일로 대응하며, 덱 선택기가 반환하는 실제 결과는 각 표시 항목에 대응하는 결과 값. 권장 설정: 1 ~ X
   * @param selectDisplayCorrespondingList 선택 표시 대응 리스트: 덱 라이브러리의 설정 참조
   * @param selectMinimumQuantity 선택 수량 하한: 유효한 선택 상호작용을 위해 선택해야 하는 카드의 최소 수량
   * @param selectMaximumQuantity 선택 수량 상한: 유효한 선택 상호작용이 가능한 카드의 최대 수량
   * @param refreshMode 새로고침 방식: 새로고침 불가
   * @param refreshMinimumQuantity 새로고침 수량 하한: 유효한 새로고침 상호작용을 위해 선택해야 하는 카드의 최소 수량
   * @param refreshMaximumQuantity 새로고침 수량 상한: 유효한 새로고침 상호작용이 가능한 카드의 최대 수량
   * @param defaultReturnSelection 기본 반환 선택: 덱 선택기 타임아웃/미상호작용/비정상 종료 시 강제로 할당되는 결과. 결과 리스트 길이는 유효한 카드 선택 수량과 일치해야 함
   */
  invokeDeckSelector(
    targetPlayer: PlayerEntity,
    deckSelectorId: IntValue,
    selectDuration: FloatValue,
    selectResultCorrespondingList: IntValue[],
    selectDisplayCorrespondingList: IntValue[],
    selectMinimumQuantity: IntValue,
    selectMaximumQuantity: IntValue,
    refreshMode: DecisionRefreshMode,
    refreshMinimumQuantity: IntValue,
    refreshMaximumQuantity: IntValue,
    defaultReturnSelection: IntValue[]
  ): void {
    const targetPlayerObj = parseValue(targetPlayer, 'entity')
    const deckSelectorIdObj = parseValue(deckSelectorId, 'int')
    const selectDurationObj = parseValue(selectDuration, 'float')
    const selectResultCorrespondingListObj = parseValue(selectResultCorrespondingList, 'int_list')
    const selectDisplayCorrespondingListObj = parseValue(selectDisplayCorrespondingList, 'int_list')
    const selectMinimumQuantityObj = parseValue(selectMinimumQuantity, 'int')
    const selectMaximumQuantityObj = parseValue(selectMaximumQuantity, 'int')
    const refreshModeObj = parseValue(refreshMode, 'enumeration')
    const refreshMinimumQuantityObj = parseValue(refreshMinimumQuantity, 'int')
    const refreshMaximumQuantityObj = parseValue(refreshMaximumQuantity, 'int')
    const defaultReturnSelectionObj = parseValue(defaultReturnSelection, 'int_list')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'invoke_deck_selector',
      args: [
        targetPlayerObj,
        deckSelectorIdObj,
        selectDurationObj,
        selectResultCorrespondingListObj,
        selectDisplayCorrespondingListObj,
        selectMinimumQuantityObj,
        selectMaximumQuantityObj,
        refreshModeObj,
        refreshMinimumQuantityObj,
        refreshMaximumQuantityObj,
        defaultReturnSelectionObj
      ]
    })
  }

  /**
   * 입력된 리스트를 무작위로 정렬한다
   *
   * @param list 리스트
   */
  randomDeckSelectorSelectionList(list: IntValue[]): void {
    const listObj = parseValue(list, 'int_list')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'random_deck_selector_selection_list',
      args: [listObj]
    })
  }

  /**
   * 플레이어의 정산 성공 상태를 설정한다
   *
   * @param playerEntity 플레이어 엔티티
   * @param settlementStatus 정산 상태: 미정, 승리, 패배의 세 가지 유형
   */
  setPlayerSettlementSuccessStatus(
    playerEntity: PlayerEntity,
    settlementStatus: SettlementStatus
  ): void {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const settlementStatusObj = parseValue(settlementStatus, 'enumeration')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_player_settlement_success_status',
      args: [playerEntityObj, settlementStatusObj]
    })
  }

  /**
   * 플레이어의 정산 스코어보드 표시 데이터를 설정한다. 스테이지 정산 후 표시되는 스코어보드에 나타난다. 이 노드는 외부 기능 표시와 관련되므로 [데이터 값]과 [데이터 이름]은 현재 텍스트를 직접 입력할 때만 다국어 번역을 지원하며, 와이어 연결로 입력 시에는 지원되지 않는다
   *
   * @param setEntity 설정 엔티티: 효과가 적용될 플레이어 엔티티
   * @param dataOrder 데이터 순서: 해당 데이터의 정렬 순서
   * @param dataName 데이터 이름: 해당 데이터의 이름
   * @param dataValue 데이터 값: 해당 데이터의 값. 정수, 부동소수점, 문자열을 지원
   */
  setPlayerSettlementScoreboardDataDisplay(
    setEntity: PlayerEntity,
    dataOrder: IntValue,
    dataName: StrValue,
    dataValue: FloatValue
  ): void
  setPlayerSettlementScoreboardDataDisplay(
    setEntity: PlayerEntity,
    dataOrder: IntValue,
    dataName: StrValue,
    dataValue: IntValue
  ): void
  setPlayerSettlementScoreboardDataDisplay(
    setEntity: PlayerEntity,
    dataOrder: IntValue,
    dataName: StrValue,
    dataValue: StrValue
  ): void
  setPlayerSettlementScoreboardDataDisplay<T extends 'float' | 'int' | 'str'>(
    setEntity: PlayerEntity,
    dataOrder: IntValue,
    dataName: StrValue,
    dataValue: RuntimeParameterValueTypeMap[T]
  ): void {
    const genericType = matchTypes(['float', 'int', 'str'], dataValue)
    const setEntityObj = parseValue(setEntity, 'entity')
    const dataOrderObj = parseValue(dataOrder, 'int')
    const dataNameObj = parseValue(dataName, 'str')
    const dataValueObj = parseValue(dataValue, genericType)
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_player_settlement_scoreboard_data_display',
      args: [setEntityObj, dataOrderObj, dataNameObj, dataValueObj]
    })
  }

  /**
   * 플레이어의 정산 후 순위 수치를 설정한다. 최종 순위는 [스테이지 설정] - [정산]의 [순위 수치 비교 순서] 설정에 따라 결정된다
   *
   * @param playerEntity 플레이어 엔티티
   * @param rankingValue 순위 수치
   */
  setPlayerSettlementRankingValue(playerEntity: PlayerEntity, rankingValue: IntValue): void {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const rankingValueObj = parseValue(rankingValue, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_player_settlement_ranking_value',
      args: [playerEntityObj, rankingValueObj]
    })
  }

  /**
   * 진영의 정산 성공 상태를 설정한다
   *
   * @param faction 진영: 효과가 적용될 진영 엔티티
   * @param settlementStatus 정산 상태: 미정, 승리, 패배의 세 가지 유형
   */
  setFactionSettlementSuccessStatus(
    faction: FactionValue,
    settlementStatus: SettlementStatus
  ): void {
    const factionObj = parseValue(faction, 'faction')
    const settlementStatusObj = parseValue(settlementStatus, 'enumeration')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_faction_settlement_success_status',
      args: [factionObj, settlementStatusObj]
    })
  }

  /**
   * 진영의 정산 후 순위 수치를 설정한다. 최종 순위는 [스테이지 설정] - [정산]의 [순위 수치 비교 순서] 설정에 따라 결정된다
   *
   * @param faction 진영: 효과가 적용될 진영 엔티티
   * @param rankingValue 순위 수치
   */
  setFactionSettlementRankingValue(faction: FactionValue, rankingValue: IntValue): void {
    const factionObj = parseValue(faction, 'faction')
    const rankingValueObj = parseValue(rankingValue, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_faction_settlement_ranking_value',
      args: [factionObj, rankingValueObj]
    })
  }

  /**
   * 대상 엔티티의 광원 컴포넌트에서 지정된 번호의 광원 상태를 조정한다
   *
   * @param targetEntity 대상 엔티티
   * @param lightSourceId 광원 번호
   * @param enableOrDisable 켜기/끄기: True이면 켜기
   */
  toggleEntityLightSource(
    targetEntity: EntityValue,
    lightSourceId: IntValue,
    enableOrDisable: BoolValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const lightSourceIdObj = parseValue(lightSourceId, 'int')
    const enableOrDisableObj = parseValue(enableOrDisable, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'toggle_entity_light_source',
      args: [targetEntityObj, lightSourceIdObj, enableOrDisableObj]
    })
  }

  /**
   * 지정된 딕셔너리에 키-값 쌍을 추가하거나 설정한다
   *
   * @param dictionary 딕셔너리
   * @param key 키
   * @param value 값
   */
  setOrAddKeyValuePairsToDictionary<K extends DictKeyType, V extends DictValueType>(
    dictionary: dict<K, V>,
    key: RuntimeParameterValueTypeMap[K],
    value: RuntimeParameterValueTypeMap[V]
  ) {
    const dictionaryObj = parseValue(dictionary, 'dict')
    const keyObj = parseValue(key, dictionaryObj.getKeyType())
    const valueObj = parseValue(value, dictionaryObj.getValueType())
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_or_add_key_value_pairs_to_dictionary',
      args: [dictionaryObj, keyObj, valueObj]
    })
  }

  /**
   * 지정된 딕셔너리의 모든 키-값 쌍을 초기화한다
   *
   * @param dictionary 딕셔너리
   */
  clearDictionary<K extends DictKeyType, V extends DictValueType>(dictionary: dict<K, V>) {
    const dictionaryObj = parseValue(dictionary, 'dict')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'clear_dictionary',
      args: [dictionaryObj]
    })
  }

  /**
   * 키를 기준으로 지정된 딕셔너리에서 키-값 쌍을 제거한다
   *
   * @param dictionary 딕셔너리
   * @param key 키
   */
  removeKeyValuePairsFromDictionaryByKey<K extends DictKeyType, V extends DictValueType>(
    dictionary: dict<K, V>,
    key: RuntimeParameterValueTypeMap[K]
  ) {
    const dictionaryObj = parseValue(dictionary, 'dict')
    const keyObj = parseValue(key, dictionaryObj.getKeyType())
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'remove_key_value_pairs_from_dictionary_by_key',
      args: [dictionaryObj, keyObj]
    })
  }

  /**
   * 구조체를 선택한 후 해당 구조체의 각 파라미터를 수정할 수 있다
   */
  modifyStructure(): void {
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_structure',
      args: []
    })
  }

  /**
   * 인벤토리 상점의 판매 목록에서 아이템을 제거한다
   *
   * @param shopOwnerEntity 상점 소유자 엔티티
   * @param shopId 상점 번호: 상점 소유자 엔티티의 상점 컴포넌트에 대응하는 상점 번호
   * @param itemConfigId 아이템 설정 ID
   */
  removeItemFromInventoryShopSalesList(
    shopOwnerEntity: EntityValue,
    shopId: IntValue,
    itemConfigId: ConfigIdValue
  ): void {
    const shopOwnerEntityObj = parseValue(shopOwnerEntity, 'entity')
    const shopIdObj = parseValue(shopId, 'int')
    const itemConfigIdObj = parseValue(itemConfigId, 'config_id')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'remove_item_from_inventory_shop_sales_list',
      args: [shopOwnerEntityObj, shopIdObj, itemConfigIdObj]
    })
  }

  /**
   * 수거 목록에서 아이템을 제거한다
   *
   * @param shopOwnerEntity 상점 소유자 엔티티
   * @param shopId 상점 번호: 상점 소유자 엔티티의 상점 컴포넌트에 대응하는 상점 번호
   * @param shopItemConfigId 상품 아이템 설정 ID
   */
  removeItemFromPurchaseList(
    shopOwnerEntity: EntityValue,
    shopId: IntValue,
    shopItemConfigId: ConfigIdValue
  ): void {
    const shopOwnerEntityObj = parseValue(shopOwnerEntity, 'entity')
    const shopIdObj = parseValue(shopId, 'int')
    const shopItemConfigIdObj = parseValue(shopItemConfigId, 'config_id')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'remove_item_from_purchase_list',
      args: [shopOwnerEntityObj, shopIdObj, shopItemConfigIdObj]
    })
  }

  /**
   * 커스텀 상점의 판매 목록에서 아이템을 제거한다
   *
   * @param shopOwnerEntity 상점 소유자 엔티티
   * @param shopId 상점 번호: 상점 소유자 엔티티의 상점 컴포넌트에 대응하는 상점 번호
   * @param shopItemId 상품 번호
   */
  removeItemFromCustomShopSalesList(
    shopOwnerEntity: EntityValue,
    shopId: IntValue,
    shopItemId: IntValue
  ): void {
    const shopOwnerEntityObj = parseValue(shopOwnerEntity, 'entity')
    const shopIdObj = parseValue(shopId, 'int')
    const shopItemIdObj = parseValue(shopItemId, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'remove_item_from_custom_shop_sales_list',
      args: [shopOwnerEntityObj, shopIdObj, shopItemIdObj]
    })
  }

  /**
   * 게임 실행 중 플레이어 엔티티의 시점에서 상점을 연다
   *
   * @param playerEntity 플레이어 엔티티
   * @param shopOwnerEntity 상점 소유자 엔티티
   * @param shopId 상점 번호
   */
  openShop(playerEntity: PlayerEntity, shopOwnerEntity: EntityValue, shopId: IntValue): void {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const shopOwnerEntityObj = parseValue(shopOwnerEntity, 'entity')
    const shopIdObj = parseValue(shopId, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'open_shop',
      args: [playerEntityObj, shopOwnerEntityObj, shopIdObj]
    })
  }

  /**
   * 게임 실행 중 플레이어 엔티티의 시점에서 열려 있는 모든 상점을 닫는다
   *
   * @param playerEntity 플레이어 엔티티
   */
  closeShop(playerEntity: PlayerEntity): void {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'close_shop',
      args: [playerEntityObj]
    })
  }

  /**
   * 인벤토리 상점의 판매 목록에 새 아이템을 추가한다
   *
   * @param shopOwnerEntity 상점 소유자 엔티티
   * @param shopId 상점 번호: 상점 소유자 엔티티의 상점 컴포넌트에 대응하는 상점 번호
   * @param shopItemConfigId 상품 아이템 설정 ID
   * @param sellCurrencyDictionary 판매 화폐 딕셔너리
   * @param affiliatedTabId 소속 탭 번호: 1 장비, 2 소모품, 3 재료, 4 귀중품
   * @param sortPriority 정렬 우선순위
   * @param canBeSold 판매 가능 여부
   */
  addNewItemToInventoryShopSalesList(
    shopOwnerEntity: EntityValue,
    shopId: IntValue,
    shopItemConfigId: ConfigIdValue,
    sellCurrencyDictionary: dict<'config_id', 'int'>,
    affiliatedTabId: IntValue,
    sortPriority: IntValue,
    canBeSold: BoolValue
  ): void {
    const shopOwnerEntityObj = parseValue(shopOwnerEntity, 'entity')
    const shopIdObj = parseValue(shopId, 'int')
    const shopItemConfigIdObj = parseValue(shopItemConfigId, 'config_id')
    const sellCurrencyDictionaryObj = parseValue(sellCurrencyDictionary, 'dict')
    const affiliatedTabIdObj = parseValue(affiliatedTabId, 'int')
    const sortPriorityObj = parseValue(sortPriority, 'int')
    const canBeSoldObj = parseValue(canBeSold, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'add_new_item_to_inventory_shop_sales_list',
      args: [
        shopOwnerEntityObj,
        shopIdObj,
        shopItemConfigIdObj,
        sellCurrencyDictionaryObj,
        affiliatedTabIdObj,
        sortPriorityObj,
        canBeSoldObj
      ]
    })
  }

  /**
   * 아이템 수거 목록에 새 아이템을 추가한다
   *
   * @param shopOwnerEntity 상점 소유자 엔티티
   * @param shopId 상점 번호: 상점 소유자 엔티티의 상점 컴포넌트에 대응하는 상점 번호
   * @param shopItemConfigId 상품 아이템 설정 ID
   * @param purchaseCurrencyDictionary 수거 화폐 딕셔너리
   * @param purchasable 수거 가능 여부
   */
  addItemsToThePurchaseList(
    shopOwnerEntity: EntityValue,
    shopId: IntValue,
    shopItemConfigId: ConfigIdValue,
    purchaseCurrencyDictionary: dict<'config_id', 'int'>,
    purchasable: BoolValue
  ): void {
    const shopOwnerEntityObj = parseValue(shopOwnerEntity, 'entity')
    const shopIdObj = parseValue(shopId, 'int')
    const shopItemConfigIdObj = parseValue(shopItemConfigId, 'config_id')
    const purchaseCurrencyDictionaryObj = parseValue(purchaseCurrencyDictionary, 'dict')
    const purchasableObj = parseValue(purchasable, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'add_items_to_the_purchase_list',
      args: [
        shopOwnerEntityObj,
        shopIdObj,
        shopItemConfigIdObj,
        purchaseCurrencyDictionaryObj,
        purchasableObj
      ]
    })
  }

  /**
   * 커스텀 상점의 판매 목록에 아이템을 추가한다. 추가 성공 시 출력 파라미터에 정수형 인덱스가 해당 상품의 식별자로 생성된다
   *
   * @param shopOwnerEntity 상점 소유자 엔티티
   * @param shopId 상점 번호: 상점 소유자 엔티티의 상점 컴포넌트에 대응하는 상점 번호
   * @param shopItemConfigId 상품 아이템 설정 ID
   * @param sellCurrencyDictionary 판매 화폐 딕셔너리
   * @param affiliatedTabId 소속 탭 번호: 1 장비, 2 소모품, 3 재료, 4 귀중품
   * @param limitPurchase 구매 수량 제한 여부
   * @param purchaseLimit 구매 수량 상한
   * @param sortPriority 정렬 우선순위
   * @param canBeSold 판매 가능 여부
   * @returns 상품 인덱스
   */
  addNewItemToCustomShopSalesList(
    shopOwnerEntity: EntityValue,
    shopId: IntValue,
    shopItemConfigId: ConfigIdValue,
    sellCurrencyDictionary: dict<'config_id', 'int'>,
    affiliatedTabId: IntValue,
    limitPurchase: BoolValue,
    purchaseLimit: IntValue,
    sortPriority: IntValue,
    canBeSold: BoolValue
  ): bigint {
    const shopOwnerEntityObj = parseValue(shopOwnerEntity, 'entity')
    const shopIdObj = parseValue(shopId, 'int')
    const shopItemConfigIdObj = parseValue(shopItemConfigId, 'config_id')
    const sellCurrencyDictionaryObj = parseValue(sellCurrencyDictionary, 'dict')
    const affiliatedTabIdObj = parseValue(affiliatedTabId, 'int')
    const limitPurchaseObj = parseValue(limitPurchase, 'bool')
    const purchaseLimitObj = parseValue(purchaseLimit, 'int')
    const sortPriorityObj = parseValue(sortPriority, 'int')
    const canBeSoldObj = parseValue(canBeSold, 'bool')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'add_new_item_to_custom_shop_sales_list',
      args: [
        shopOwnerEntityObj,
        shopIdObj,
        shopItemConfigIdObj,
        sellCurrencyDictionaryObj,
        affiliatedTabIdObj,
        limitPurchaseObj,
        purchaseLimitObj,
        sortPriorityObj,
        canBeSoldObj
      ]
    })
    const ret = new int()
    ret.markPin(ref, 'itemIndex', 0)
    return ret as unknown as bigint
  }

  /**
   * 인벤토리 상점 아이템의 판매 정보를 수정한다
   *
   * @param shopOwnerEntity 상점 소유자 엔티티
   * @param shopId 상점 번호: 상점 소유자 엔티티의 상점 컴포넌트에 대응하는 상점 번호
   * @param itemConfigId 아이템 설정 ID
   * @param sellCurrencyDictionary 판매 화폐 딕셔너리
   * @param affiliatedTabId 소속 탭 번호
   * @param sortPriority 정렬 우선순위
   * @param canBeSold 판매 가능 여부
   */
  modifyInventoryShopItemSalesInfo(
    shopOwnerEntity: EntityValue,
    shopId: IntValue,
    itemConfigId: ConfigIdValue,
    sellCurrencyDictionary: dict<'config_id', 'int'>,
    affiliatedTabId: IntValue,
    sortPriority: IntValue,
    canBeSold: BoolValue
  ): void {
    const shopOwnerEntityObj = parseValue(shopOwnerEntity, 'entity')
    const shopIdObj = parseValue(shopId, 'int')
    const itemConfigIdObj = parseValue(itemConfigId, 'config_id')
    const sellCurrencyDictionaryObj = parseValue(sellCurrencyDictionary, 'dict')
    const affiliatedTabIdObj = parseValue(affiliatedTabId, 'int')
    const sortPriorityObj = parseValue(sortPriority, 'int')
    const canBeSoldObj = parseValue(canBeSold, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_inventory_shop_item_sales_info',
      args: [
        shopOwnerEntityObj,
        shopIdObj,
        itemConfigIdObj,
        sellCurrencyDictionaryObj,
        affiliatedTabIdObj,
        sortPriorityObj,
        canBeSoldObj
      ]
    })
  }

  /**
   * 물품 수거 목록에서 아이템 수거 정보를 수정한다
   *
   * @param shopOwnerEntity 상점 소유자 엔티티
   * @param shopId 상점 번호: 상점 소유자 엔티티의 상점 컴포넌트에 대응하는 상점 번호
   * @param shopItemConfigId 상품 아이템 설정 ID
   * @param purchaseCurrencyDictionary 수거 화폐 딕셔너리
   * @param purchasable 수거 가능 여부
   */
  modifyItemPurchaseInfoInThePurchaseList(
    shopOwnerEntity: EntityValue,
    shopId: IntValue,
    shopItemConfigId: ConfigIdValue,
    purchaseCurrencyDictionary: dict<'config_id', 'int'>,
    purchasable: BoolValue
  ): void {
    const shopOwnerEntityObj = parseValue(shopOwnerEntity, 'entity')
    const shopIdObj = parseValue(shopId, 'int')
    const shopItemConfigIdObj = parseValue(shopItemConfigId, 'config_id')
    const purchaseCurrencyDictionaryObj = parseValue(purchaseCurrencyDictionary, 'dict')
    const purchasableObj = parseValue(purchasable, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_item_purchase_info_in_the_purchase_list',
      args: [
        shopOwnerEntityObj,
        shopIdObj,
        shopItemConfigIdObj,
        purchaseCurrencyDictionaryObj,
        purchasableObj
      ]
    })
  }

  /**
   * 커스텀 상점 상품의 판매 정보를 수정한다
   *
   * @param shopOwnerEntity 상점 소유자 엔티티
   * @param shopId 상점 번호: 상점 소유자 엔티티의 상점 컴포넌트에 대응하는 상점 번호
   * @param shopItemId 상품 번호
   * @param itemConfigId 아이템 설정 ID
   * @param sellCurrencyDictionary 판매 화폐 딕셔너리
   * @param affiliatedTabId 소속 탭 번호: 1 장비, 2 소모품, 3 재료, 4 귀중품
   * @param limitPurchase 구매 제한 여부
   * @param purchaseLimit 구매 제한 수량
   * @param sortPriority 정렬 우선순위
   * @param canBeSold 판매 가능 여부
   */
  modifyCustomShopItemSalesInfo(
    shopOwnerEntity: EntityValue,
    shopId: IntValue,
    shopItemId: IntValue,
    itemConfigId: ConfigIdValue,
    sellCurrencyDictionary: dict<'config_id', 'int'>,
    affiliatedTabId: IntValue,
    limitPurchase: BoolValue,
    purchaseLimit: IntValue,
    sortPriority: IntValue,
    canBeSold: BoolValue
  ): void {
    const shopOwnerEntityObj = parseValue(shopOwnerEntity, 'entity')
    const shopIdObj = parseValue(shopId, 'int')
    const shopItemIdObj = parseValue(shopItemId, 'int')
    const itemConfigIdObj = parseValue(itemConfigId, 'config_id')
    const sellCurrencyDictionaryObj = parseValue(sellCurrencyDictionary, 'dict')
    const affiliatedTabIdObj = parseValue(affiliatedTabId, 'int')
    const limitPurchaseObj = parseValue(limitPurchase, 'bool')
    const purchaseLimitObj = parseValue(purchaseLimit, 'int')
    const sortPriorityObj = parseValue(sortPriority, 'int')
    const canBeSoldObj = parseValue(canBeSold, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_custom_shop_item_sales_info',
      args: [
        shopOwnerEntityObj,
        shopIdObj,
        shopItemIdObj,
        itemConfigIdObj,
        sellCurrencyDictionaryObj,
        affiliatedTabIdObj,
        limitPurchaseObj,
        purchaseLimitObj,
        sortPriorityObj,
        canBeSoldObj
      ]
    })
  }

  /**
   * 장비 인스턴스의 지정된 어픽스 값을 수정한다
   *
   * @param equipmentIndex 장비 인덱스: 장비 초기화 시 생성된 정수형 인덱스로 장비 인스턴스를 식별
   * @param affixId 어픽스 번호
   * @param affixValue 어픽스 수치
   */
  modifyEquipmentAffixValue(
    equipmentIndex: IntValue,
    affixId: IntValue,
    affixValue: FloatValue
  ): void {
    const equipmentIndexObj = parseValue(equipmentIndex, 'int')
    const affixIdObj = parseValue(affixId, 'int')
    const affixValueObj = parseValue(affixValue, 'float')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_equipment_affix_value',
      args: [equipmentIndexObj, affixIdObj, affixValueObj]
    })
  }

  /**
   * 장비 인스턴스에서 지정된 어픽스를 제거한다
   *
   * @param equipmentId 장비 인덱스: 장비 초기화 시 생성된 정수형 인덱스로 장비 인스턴스를 식별
   * @param affixId 어픽스 번호
   */
  removeEquipmentAffix(equipmentId: IntValue, affixId: IntValue): void {
    const equipmentIdObj = parseValue(equipmentId, 'int')
    const affixIdObj = parseValue(affixId, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'remove_equipment_affix',
      args: [equipmentIdObj, affixIdObj]
    })
  }

  /**
   * 지정된 장비 인스턴스에 사전 설정된 어픽스를 추가한다. 어픽스 수치를 덮어쓸 수 있다
   *
   * @param equipmentId 장비 인덱스: 장비 초기화 시 생성된 정수형 인덱스로 장비 인스턴스를 식별
   * @param affixConfigId 어픽스 설정 ID: 장비 데이터 관리에서 사전 설정된 어픽스의 설정 ID
   * @param overwriteAffixValue 어픽스 수치 덮어쓰기 여부
   * @param affixValue 어픽스 수치: 사전 설정된 어픽스의 수치를 덮어쓸 수 있음
   */
  addAffixToEquipment(
    equipmentId: IntValue,
    affixConfigId: ConfigIdValue,
    overwriteAffixValue: BoolValue,
    affixValue: FloatValue
  ): void {
    const equipmentIdObj = parseValue(equipmentId, 'int')
    const affixConfigIdObj = parseValue(affixConfigId, 'config_id')
    const overwriteAffixValueObj = parseValue(overwriteAffixValue, 'bool')
    const affixValueObj = parseValue(affixValue, 'float')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'add_affix_to_equipment',
      args: [equipmentIdObj, affixConfigIdObj, overwriteAffixValueObj, affixValueObj]
    })
  }

  /**
   * 지정된 어픽스 번호 위치에 사전 설정된 어픽스를 추가한다. 어픽스 수치를 덮어쓸 수 있다
   *
   * @param equipmentId 장비 인덱스: 장비 초기화 시 생성된 정수형 인덱스로 장비 인스턴스를 식별
   * @param affixConfigId 어픽스 설정 ID: 장비 데이터 관리에서 사전 설정된 어픽스의 설정 ID
   * @param insertId 삽입 번호
   * @param overwriteAffixValue 어픽스 수치 덮어쓰기 여부
   * @param affixValue 어픽스 수치: 사전 설정된 어픽스의 수치를 덮어쓸 수 있음
   */
  addAffixToEquipmentAtSpecifiedId(
    equipmentId: IntValue,
    affixConfigId: ConfigIdValue,
    insertId: IntValue,
    overwriteAffixValue: BoolValue,
    affixValue: FloatValue
  ): void {
    const equipmentIdObj = parseValue(equipmentId, 'int')
    const affixConfigIdObj = parseValue(affixConfigId, 'config_id')
    const insertIdObj = parseValue(insertId, 'int')
    const overwriteAffixValueObj = parseValue(overwriteAffixValue, 'bool')
    const affixValueObj = parseValue(affixValue, 'float')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'add_affix_to_equipment_at_specified_id',
      args: [equipmentIdObj, affixConfigIdObj, insertIdObj, overwriteAffixValueObj, affixValueObj]
    })
  }

  /**
   * 지정된 장비를 대상 엔티티의 해당 장비 슬롯으로 교체한다. 해당 장비가 이미 그 슬롯에 있으면 적용되지 않으며, 슬롯에 다른 장비가 있으면 교체된다
   *
   * @param targetEntity 대상 엔티티
   * @param equipmentRow 장비 슬롯 행
   * @param equipmentColumn 장비 슬롯 열
   * @param equipmentIndex 장비 인덱스: 장비 초기화 시 생성된 정수형 인덱스로 장비 인스턴스를 식별
   */
  replaceEquipmentToTheSpecifiedSlot(
    targetEntity: EntityValue,
    equipmentRow: IntValue,
    equipmentColumn: IntValue,
    equipmentIndex: IntValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const equipmentRowObj = parseValue(equipmentRow, 'int')
    const equipmentColumnObj = parseValue(equipmentColumn, 'int')
    const equipmentIndexObj = parseValue(equipmentIndex, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'replace_equipment_to_the_specified_slot',
      args: [targetEntityObj, equipmentRowObj, equipmentColumnObj, equipmentIndexObj]
    })
  }

  /**
   * 인벤토리 아이템 드롭 내용을 딕셔너리 형식으로 설정하고, 드롭 타입을 지정한다
   *
   * @param inventoryOwnerEntity 인벤토리 소유자 엔티티
   * @param itemDropDictionary 아이템 드롭 딕셔너리
   * @param lootType 드롭 타입: 전원 공유(1인분), 개인별(1인분씩)
   */
  setInventoryItemDropContents(
    inventoryOwnerEntity: EntityValue,
    itemDropDictionary: dict<'config_id', 'int'>,
    lootType: ItemLootType
  ): void {
    const inventoryOwnerEntityObj = parseValue(inventoryOwnerEntity, 'entity')
    const itemDropDictionaryObj = parseValue(itemDropDictionary, 'dict')
    const lootTypeObj = parseValue(lootType, 'enumeration')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_inventory_item_drop_contents',
      args: [inventoryOwnerEntityObj, itemDropDictionaryObj, lootTypeObj]
    })
  }

  /**
   * 인벤토리 드롭 아이템/화폐의 타입과 수량을 설정한다
   *
   * @param inventoryOwnerEntity 인벤토리 소유자 엔티티
   * @param itemCurrencyConfigId 아이템/화폐 설정 ID
   * @param quantityDropped 드롭 수량
   * @param lootType 드롭 타입: 전원 공유(1인분), 개인별(1인분씩)
   */
  setInventoryDropItemsCurrencyAmount(
    inventoryOwnerEntity: EntityValue,
    itemCurrencyConfigId: ConfigIdValue,
    quantityDropped: IntValue,
    lootType: ItemLootType
  ): void {
    const inventoryOwnerEntityObj = parseValue(inventoryOwnerEntity, 'entity')
    const itemCurrencyConfigIdObj = parseValue(itemCurrencyConfigId, 'config_id')
    const quantityDroppedObj = parseValue(quantityDropped, 'int')
    const lootTypeObj = parseValue(lootType, 'enumeration')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_inventory_drop_items_currency_amount',
      args: [inventoryOwnerEntityObj, itemCurrencyConfigIdObj, quantityDroppedObj, lootTypeObj]
    })
  }

  /**
   * 드롭 엔티티에 대해 전리품 드롭을 트리거한다. 드롭 타입을 설정할 수 있다
   *
   * @param dropperEntity 드롭 엔티티
   * @param lootType 드롭 타입: 전원 공유(1인분), 개인별(1인분씩)
   */
  triggerLootDrop(dropperEntity: EntityValue, lootType: ItemLootType): void {
    const dropperEntityObj = parseValue(dropperEntity, 'entity')
    const lootTypeObj = parseValue(lootType, 'enumeration')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'trigger_loot_drop',
      args: [dropperEntityObj, lootTypeObj]
    })
  }

  /**
   * 드롭 엔티티의 전리품 컴포넌트에 전리품 드롭 내용을 딕셔너리 형식으로 설정한다
   *
   * @param dropperEntity 드롭 엔티티
   * @param lootDropDictionary 전리품 드롭 딕셔너리
   */
  setLootDropContent(
    dropperEntity: EntityValue,
    lootDropDictionary: dict<'config_id', 'int'>
  ): void {
    const dropperEntityObj = parseValue(dropperEntity, 'entity')
    const lootDropDictionaryObj = parseValue(lootDropDictionary, 'dict')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_loot_drop_content',
      args: [dropperEntityObj, lootDropDictionaryObj]
    })
  }

  /**
   * 인벤토리 내 지정된 아이템의 수량을 수정한다
   *
   * @param inventoryOwnerEntity 인벤토리 소유자 엔티티
   * @param itemConfigId 아이템 설정 ID
   * @param changeValue 변경값: 변경 후 값 = 변경 전 값 + 변경값
   */
  modifyInventoryItemQuantity(
    inventoryOwnerEntity: EntityValue,
    itemConfigId: ConfigIdValue,
    changeValue: IntValue
  ): void {
    const inventoryOwnerEntityObj = parseValue(inventoryOwnerEntity, 'entity')
    const itemConfigIdObj = parseValue(itemConfigId, 'config_id')
    const changeValueObj = parseValue(changeValue, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_inventory_item_quantity',
      args: [inventoryOwnerEntityObj, itemConfigIdObj, changeValueObj]
    })
  }

  /**
   * 인벤토리 내 지정된 화폐의 수량을 수정한다
   *
   * @param inventoryOwnerEntity 인벤토리 소유자 엔티티
   * @param currencyConfigId 화폐 설정 ID
   * @param changeValue 변경값: 변경 후 값 = 변경 전 값 + 변경값
   */
  modifyInventoryCurrencyQuantity(
    inventoryOwnerEntity: EntityValue,
    currencyConfigId: ConfigIdValue,
    changeValue: IntValue
  ): void {
    const inventoryOwnerEntityObj = parseValue(inventoryOwnerEntity, 'entity')
    const currencyConfigIdObj = parseValue(currencyConfigId, 'config_id')
    const changeValueObj = parseValue(changeValue, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_inventory_currency_quantity',
      args: [inventoryOwnerEntityObj, currencyConfigIdObj, changeValueObj]
    })
  }

  /**
   * 드롭 프리팹의 드롭 컴포넌트에서 지정된 아이템의 수량을 수정한다
   *
   * @param lootEntity 드롭 엔티티
   * @param itemConfigId 아이템 설정 ID
   * @param changeValue 변경값: 변경 후 값 = 변경 전 값 + 변경값
   */
  modifyLootItemComponentQuantity(
    lootEntity: EntityValue,
    itemConfigId: ConfigIdValue,
    changeValue: IntValue
  ): void {
    const lootEntityObj = parseValue(lootEntity, 'entity')
    const itemConfigIdObj = parseValue(itemConfigId, 'config_id')
    const changeValueObj = parseValue(changeValue, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_loot_item_component_quantity',
      args: [lootEntityObj, itemConfigIdObj, changeValueObj]
    })
  }

  /**
   * 드롭 프리팹의 드롭 컴포넌트에서 지정된 화폐의 수량을 수정한다
   *
   * @param lootEntity 드롭 엔티티
   * @param currencyConfigId 화폐 설정 ID
   * @param changeValue 변경값: 변경 후 값 = 변경 전 값 + 변경값
   */
  modifyLootComponentCurrencyAmount(
    lootEntity: EntityValue,
    currencyConfigId: ConfigIdValue,
    changeValue: IntValue
  ): void {
    const lootEntityObj = parseValue(lootEntity, 'entity')
    const currencyConfigIdObj = parseValue(currencyConfigId, 'config_id')
    const changeValueObj = parseValue(changeValue, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_loot_component_currency_amount',
      args: [lootEntityObj, currencyConfigIdObj, changeValueObj]
    })
  }

  /**
   * 지정된 인벤토리 소유자의 인벤토리 최대 용량을 증가시킨다
   *
   * @param inventoryOwnerEntity 인벤토리 소유자 엔티티
   * @param increaseCapacity 증가 용량
   */
  increaseMaximumInventoryCapacity(
    inventoryOwnerEntity: EntityValue,
    increaseCapacity: IntValue
  ): void {
    const inventoryOwnerEntityObj = parseValue(inventoryOwnerEntity, 'entity')
    const increaseCapacityObj = parseValue(increaseCapacity, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'increase_maximum_inventory_capacity',
      args: [inventoryOwnerEntityObj, increaseCapacityObj]
    })
  }

  /**
   * 대상 엔티티의 미니맵 마커 컴포넌트에서 지정된 ID의 미니맵 마커를 플레이어 목록의 플레이어에게 표시한다
   *
   * @param targetEntity 대상 엔티티: 수정할 미니맵 마커 컴포넌트가 속한 엔티티
   * @param miniMapMarkerId 미니맵 마커 번호: 수정할 특정 미니맵 마커의 번호
   * @param playerList 플레이어 목록: 대상 엔티티의 지정된 미니맵 번호를 볼 수 있는 플레이어 목록
   */
  modifyPlayerListForVisibleMiniMapMarkers(
    targetEntity: EntityValue,
    miniMapMarkerId: IntValue,
    playerList: PlayerEntity[]
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const miniMapMarkerIdObj = parseValue(miniMapMarkerId, 'int')
    const playerListObj = parseValue(playerList, 'entity_list')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_player_list_for_visible_mini_map_markers',
      args: [targetEntityObj, miniMapMarkerIdObj, playerListObj]
    })
  }

  /**
   * 플레이어 마커 옵션이 선택된 경우, 노드 그래프에서 해당 플레이어 엔티티를 입력하면 대상 엔티티의 미니맵 표시가 해당 플레이어의 아바타로 변경된다
   *
   * @param targetEntity 대상 엔티티: 수정할 미니맵 마커 컴포넌트가 속한 엔티티
   * @param miniMapMarkerId 미니맵 마커 번호: 수정할 특정 미니맵 마커의 번호
   * @param correspondingPlayerEntity 대응 플레이어 엔티티: 수정 후 해당 플레이어 엔티티의 아바타로 표시됨
   */
  modifyPlayerMarkersOnTheMiniMap(
    targetEntity: EntityValue,
    miniMapMarkerId: IntValue,
    correspondingPlayerEntity: PlayerEntity
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const miniMapMarkerIdObj = parseValue(miniMapMarkerId, 'int')
    const correspondingPlayerEntityObj = parseValue(correspondingPlayerEntity, 'entity')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_player_markers_on_the_mini_map',
      args: [targetEntityObj, miniMapMarkerIdObj, correspondingPlayerEntityObj]
    })
  }

  /**
   * 입력된 미니맵 마커 ID 목록을 이용해 대상 엔티티의 미니맵 마커 활성 상태를 일괄 수정한다
   *
   * @param targetEntity 대상 엔티티: 수정할 미니맵 마커 컴포넌트가 속한 엔티티
   * @param miniMapMarkerIdList 미니맵 마커 번호 목록: 지정 상태로 설정할 마커 번호 목록. 목록에 없는 마커는 반대 상태로 전환됨
   * @param active 활성화 여부: True이면 목록에 지정된 마커를 활성화하고, 목록에 없는 마커는 비활성화함
   */
  modifyMiniMapMarkerActivationStatus(
    targetEntity: EntityValue,
    miniMapMarkerIdList: IntValue[],
    active: BoolValue
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const miniMapMarkerIdListObj = parseValue(miniMapMarkerIdList, 'int_list')
    const activeObj = parseValue(active, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_mini_map_marker_activation_status',
      args: [targetEntityObj, miniMapMarkerIdListObj, activeObj]
    })
  }

  /**
   * 대상 플레이어의 미니맵 UI 컨트롤의 지도 배율을 수정한다
   *
   * @param targetPlayer 대상 플레이어
   * @param zoomDimensions 줌 크기
   */
  modifyMiniMapZoom(targetPlayer: PlayerEntity, zoomDimensions: FloatValue): void {
    const targetPlayerObj = parseValue(targetPlayer, 'entity')
    const zoomDimensionsObj = parseValue(zoomDimensions, 'float')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_mini_map_zoom',
      args: [targetPlayerObj, zoomDimensionsObj]
    })
  }

  /**
   * 대상 엔티티의 지정된 ID의 미니맵 마커를 입력된 플레이어에게 추적 표시로 설정한다
   *
   * @param targetEntity 대상 엔티티
   * @param miniMapMarkerId 미니맵 마커 번호
   * @param playerList 플레이어 목록
   */
  modifyPlayerListForTrackingMiniMapMarkers(
    targetEntity: EntityValue,
    miniMapMarkerId: IntValue,
    playerList: PlayerEntity[]
  ): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const miniMapMarkerIdObj = parseValue(miniMapMarkerId, 'int')
    const playerListObj = parseValue(playerList, 'entity_list')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_player_list_for_tracking_mini_map_markers',
      args: [targetEntityObj, miniMapMarkerIdObj, playerListObj]
    })
  }

  /**
   * 피조물의 순찰 템플릿을 즉시 전환하고 새 템플릿에 따라 이동한다
   *
   * @param creationEntity 피조물 엔티티
   * @param patrolTemplateId 순찰 템플릿 번호
   */
  switchCreationPatrolTemplate(creationEntity: CreationEntity, patrolTemplateId: IntValue): void {
    const creationEntityObj = parseValue(creationEntity, 'entity')
    const patrolTemplateIdObj = parseValue(patrolTemplateId, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'switch_creation_patrol_template',
      args: [creationEntityObj, patrolTemplateIdObj]
    })
  }

  /**
   * 플레이어 리더보드 점수를 부동소수점으로 설정한다
   *
   * @param playerIdList 플레이어 번호 목록
   * @param leaderboardScore 리더보드 점수
   * @param leaderboardId 리더보드 번호: 외부 시스템 관리에서 지정된 리더보드에 대응하는 번호
   */
  setPlayerLeaderboardScoreAsAFloat(
    playerIdList: IntValue[],
    leaderboardScore: FloatValue,
    leaderboardId: IntValue
  ): void {
    const playerIdListObj = parseValue(playerIdList, 'int_list')
    const leaderboardScoreObj = parseValue(leaderboardScore, 'float')
    const leaderboardIdObj = parseValue(leaderboardId, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_player_leaderboard_score_as_a_float',
      args: [playerIdListObj, leaderboardScoreObj, leaderboardIdObj]
    })
  }

  /**
   * 플레이어 리더보드 점수를 정수로 설정한다
   *
   * @param playerIdList 플레이어 번호 목록
   * @param leaderboardScore 리더보드 점수
   * @param leaderboardId 리더보드 번호: 외부 시스템 관리에서 지정된 리더보드에 대응하는 번호
   */
  setPlayerLeaderboardScoreAsAnInteger(
    playerIdList: IntValue[],
    leaderboardScore: IntValue,
    leaderboardId: IntValue
  ): void {
    const playerIdListObj = parseValue(playerIdList, 'int_list')
    const leaderboardScoreObj = parseValue(leaderboardScore, 'int')
    const leaderboardIdObj = parseValue(leaderboardId, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_player_leaderboard_score_as_an_integer',
      args: [playerIdListObj, leaderboardScoreObj, leaderboardIdObj]
    })
  }

  /**
   * 대상 엔티티에서 지정된 업적 ID의 진행 카운터를 변경한다
   *
   * @param changeEntity 변경 엔티티
   * @param achievementId 업적 번호
   * @param progressTallyChangeValue 진행 카운터 변경값: 변경 후 값 = 변경 전 값 + 변경값
   */
  changeAchievementProgressTally(
    changeEntity: EntityValue,
    achievementId: IntValue,
    progressTallyChangeValue: IntValue
  ): void {
    const changeEntityObj = parseValue(changeEntity, 'entity')
    const achievementIdObj = parseValue(achievementId, 'int')
    const progressTallyChangeValueObj = parseValue(progressTallyChangeValue, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'change_achievement_progress_tally',
      args: [changeEntityObj, achievementIdObj, progressTallyChangeValueObj]
    })
  }

  /**
   * 대상 엔티티에서 지정된 업적 ID의 진행 카운터를 설정한다
   *
   * @param setEntity 설정 엔티티
   * @param achievementId 업적 번호
   * @param progressTally 진행 카운터: 수정 후 진행 카운터가 입력값으로 설정됨
   */
  setAchievementProgressTally(
    setEntity: EntityValue,
    achievementId: IntValue,
    progressTally: IntValue
  ): void {
    const setEntityObj = parseValue(setEntity, 'entity')
    const achievementIdObj = parseValue(achievementId, 'int')
    const progressTallyObj = parseValue(progressTally, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_achievement_progress_tally',
      args: [setEntityObj, achievementIdObj, progressTallyObj]
    })
  }

  /**
   * 스캔 태그 규칙을 설정한다. 설정된 규칙에 따라 스캔 태그 로직이 실행된다
   *
   * @param targetEntity 대상 엔티티
   * @param ruleType 규칙 타입: 시야 우선, 거리 우선
   */
  setScanTagRules(targetEntity: EntityValue, ruleType: ScanRuleType): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ruleTypeObj = parseValue(ruleType, 'enumeration')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_scan_tag_rules',
      args: [targetEntityObj, ruleTypeObj]
    })
  }

  /**
   * 대상 엔티티의 스캔 태그 컴포넌트에서 지정된 ID의 스캔 태그를 활성 상태로 설정한다
   *
   * @param targetEntity 대상 엔티티
   * @param scanTagId 스캔 태그 번호
   */
  setScanComponentSActiveScanTagId(targetEntity: EntityValue, scanTagId: IntValue): void {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const scanTagIdObj = parseValue(scanTagId, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_scan_component_s_active_scan_tag_id',
      args: [targetEntityObj, scanTagIdObj]
    })
  }

  /**
   * 지정된 플레이어의 경쟁 랭크에 적용되는 점수 그룹을 점수 그룹 ID로 전환한다
   *
   * @param playerEntity 플레이어 엔티티
   * @param scoreGroupId 점수 그룹 번호: 외부 시스템 관리에서 지정된 점수 그룹에 대응하는 번호
   */
  switchTheScoringGroupThatAffectsPlayerSCompetitiveRank(
    playerEntity: PlayerEntity,
    scoreGroupId: IntValue
  ): void {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const scoreGroupIdObj = parseValue(scoreGroupId, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'switch_the_scoring_group_that_affects_player_s_competitive_rank',
      args: [playerEntityObj, scoreGroupIdObj]
    })
  }

  /**
   * 정산 상태에 따라 플레이어의 랭크 점수 변화를 설정한다
   *
   * @param playerEntity 플레이어 엔티티
   * @param settlementStatus 정산 상태: 미결정, 승리, 패배, 탈주
   * @param scoreChange 변화 점수
   */
  setPlayerRankScoreChange(
    playerEntity: PlayerEntity,
    settlementStatus: SettlementStatus,
    scoreChange: IntValue
  ): void {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const settlementStatusObj = parseValue(settlementStatus, 'enumeration')
    const scoreChangeObj = parseValue(scoreChange, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_player_rank_score_change',
      args: [playerEntityObj, settlementStatusObj, scoreChangeObj]
    })
  }

  /**
   * 지정된 플레이어의 탈주 허용 여부를 설정한다
   *
   * @param playerEntity 플레이어 엔티티
   * @param valid 허용 여부
   */
  setPlayerEscapeValidity(playerEntity: PlayerEntity, valid: BoolValue): void {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const validObj = parseValue(valid, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_player_escape_validity',
      args: [playerEntityObj, validObj]
    })
  }

  /**
   * 엔티티 배치 그룹의 초기 생성 스위치 상태를 수정한다
   *
   * @param entityDeploymentGroupIndex 엔티티 배치 그룹 인덱스
   * @param activate 활성화 여부: True이면 해당 엔티티 배치 그룹의 초기 생성 스위치가 켜짐
   */
  activateDisableEntityDeploymentGroup(
    entityDeploymentGroupIndex: IntValue,
    activate: BoolValue
  ): void {
    const entityDeploymentGroupIndexObj = parseValue(entityDeploymentGroupIndex, 'int')
    const activateObj = parseValue(activate, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'activate_disable_entity_deployment_group',
      args: [entityDeploymentGroupIndexObj, activateObj]
    })
  }

  /**
   * 채팅 채널 스위치를 설정한다
   *
   * @param channelIndex 채널 인덱스
   * @param textSwitch 텍스트 스위치
   */
  setChatChannelSwitch(channelIndex: IntValue, textSwitch: BoolValue): void {
    const channelIndexObj = parseValue(channelIndex, 'int')
    const textSwitchObj = parseValue(textSwitch, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_chat_channel_switch',
      args: [channelIndexObj, textSwitchObj]
    })
  }

  /**
   * 플레이어의 현재 사용 가능한 채널을 설정한다. 리스트에 있는 채널은 해당 플레이어가 사용 가능하고, 없는 채널은 사용 불가능하다
   *
   * @param playerGuid 플레이어 GUID
   * @param channelIndexList 채널 인덱스 리스트
   */
  setPlayerSCurrentChannel(playerGuid: GuidValue, channelIndexList: IntValue[]): void {
    const playerGuidObj = parseValue(playerGuid, 'guid')
    const channelIndexListObj = parseValue(channelIndexList, 'int_list')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'set_player_s_current_channel',
      args: [playerGuidObj, channelIndexListObj]
    })
  }

  /**
   * 플레이어의 채널 권한을 수정한다
   *
   * @param playerGuid 플레이어 GUID
   * @param channelIndex 채널 인덱스
   * @param join 가입 여부: True이면 해당 채널을 지정된 플레이어가 사용 가능하도록 설정
   */
  modifyPlayerChannelPermission(
    playerGuid: GuidValue,
    channelIndex: IntValue,
    join: BoolValue
  ): void {
    const playerGuidObj = parseValue(playerGuid, 'guid')
    const channelIndexObj = parseValue(channelIndex, 'int')
    const joinObj = parseValue(join, 'bool')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'modify_player_channel_permission',
      args: [playerGuidObj, channelIndexObj, joinObj]
    })
  }

  /**
   * 지정된 플레이어의 원더랜드 선물 상자를 소모한다
   *
   * @param playerEntity 플레이어 엔티티
   * @param giftBoxIndex 선물 상자 인덱스
   * @param consumptionQuantity 소모 수량
   */
  consumeGiftBox(
    playerEntity: PlayerEntity,
    giftBoxIndex: IntValue,
    consumptionQuantity: IntValue
  ): void {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const giftBoxIndexObj = parseValue(giftBoxIndex, 'int')
    const consumptionQuantityObj = parseValue(consumptionQuantity, 'int')
    this.registry.registerNode({
      id: 0,
      type: 'exec',
      nodeType: 'consume_gift_box',
      args: [playerEntityObj, giftBoxIndexObj, consumptionQuantityObj]
    })
  }

  /**
   * 3D 벡터의 x, y, z 컴포넌트를 세 개의 부동소수점 수로 출력한다
   *
   * @param _3dVector 3D 벡터
   */
  split3dVector(_3dVector: Vec3Value): {
    /** X 컴포넌트 */
    xComponent: number
    /** Y 컴포넌트 */
    yComponent: number
    /** Z 컴포넌트 */
    zComponent: number
  } {
    const _3dVectorObj = parseValue(_3dVector, 'vec3')
    if (isPrecomputeEnabled()) {
      const raw = readLiteralVec3(_3dVectorObj)
      if (raw) {
        return {
          xComponent: new float(raw[0]) as unknown as number,
          yComponent: new float(raw[1]) as unknown as number,
          zComponent: new float(raw[2]) as unknown as number
        }
      }
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'split3d_vector',
      args: [_3dVectorObj]
    })
    return {
      xComponent: (() => {
        const ret = new float()
        ret.markPin(ref, 'xComponent', 0)
        return ret as unknown as number
      })(),
      yComponent: (() => {
        const ret = new float()
        ret.markPin(ref, 'yComponent', 1)
        return ret as unknown as number
      })(),
      zComponent: (() => {
        const ret = new float()
        ret.markPin(ref, 'zComponent', 2)
        return ret as unknown as number
      })()
    }
  }

  /**
   * 곱셈 연산을 수행한다. 부동소수점 및 정수 곱셈을 지원한다
   *
   * @param input1
   * @param input2
   * @returns 결과
   */
  multiplication(input1: FloatValue, input2: FloatValue): number
  multiplication(input1: IntValue, input2: IntValue): bigint
  multiplication<T extends 'float' | 'int'>(
    input1: RuntimeParameterValueTypeMap[T],
    input2: RuntimeParameterValueTypeMap[T]
  ): RuntimeReturnValueTypeMap[T] {
    const genericType = matchTypes(['float', 'int'], input1, input2)
    const input1Obj = parseValue(input1, genericType)
    const input2Obj = parseValue(input2, genericType)
    const pre =
      genericType === 'float'
        ? tryPrecomputeFloatBinary(input1Obj, input2Obj, (a, b) => a * b)
        : tryPrecomputeIntBinary(input1Obj, input2Obj, (a, b) => a * b)
    if (pre) return pre as unknown as RuntimeReturnValueTypeMap[T]
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'multiplication',
      args: [input1Obj, input2Obj]
    })
    const ret = new ValueClassMap[genericType]()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as RuntimeReturnValueTypeMap[T]
  }

  /**
   * 나눗셈 연산을 수행한다. 부동소수점 및 정수 나눗셈을 지원한다. 정수 나눗셈은 몫을 반환하며, 제수는 0이 아니어야 한다 (0이면 비정상 값이 반환될 수 있다)
   *
   * @param input1
   * @param input2
   * @returns 결과
   */
  division(input1: FloatValue, input2: FloatValue): number
  division(input1: IntValue, input2: IntValue): bigint
  division<T extends 'float' | 'int'>(
    input1: RuntimeParameterValueTypeMap[T],
    input2: RuntimeParameterValueTypeMap[T]
  ): RuntimeReturnValueTypeMap[T] {
    const genericType = matchTypes(['float', 'int'], input1, input2)
    const input1Obj = parseValue(input1, genericType)
    const input2Obj = parseValue(input2, genericType)
    if (genericType === 'float') {
      if (isPrecomputeEnabled()) {
        const a = readLiteralFloat(input1Obj)
        const b = readLiteralFloat(input2Obj)
        if (a !== null && b !== null && b !== 0) {
          const result = a / b
          if (Number.isFinite(result)) {
            return new float(result) as unknown as RuntimeReturnValueTypeMap[T]
          }
        }
      }
    } else {
      if (isPrecomputeEnabled()) {
        const a = readLiteralInt(input1Obj)
        const b = readLiteralInt(input2Obj)
        if (a !== null && b !== null && b !== 0n) {
          return new int(a / b) as unknown as RuntimeReturnValueTypeMap[T]
        }
      }
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'division',
      args: [input1Obj, input2Obj]
    })
    const ret = new ValueClassMap[genericType]()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as RuntimeReturnValueTypeMap[T]
  }

  /**
   * x, y, z 컴포넌트로 3D 벡터를 생성한다
   *
   * @param xComponent X 컴포넌트
   * @param yComponent Y 컴포넌트
   * @param zComponent Z 컴포넌트
   * @returns 3D 벡터
   */
  create3dVector(xComponent: FloatValue, yComponent: FloatValue, zComponent: FloatValue): vec3 {
    const xComponentObj = parseValue(xComponent, 'float')
    const yComponentObj = parseValue(yComponent, 'float')
    const zComponentObj = parseValue(zComponent, 'float')
    if (isPrecomputeEnabled()) {
      const x = readLiteralFloat(xComponentObj)
      const y = readLiteralFloat(yComponentObj)
      const z = readLiteralFloat(zComponentObj)
      if (x !== null && y !== null && z !== null) {
        return new vec3([x, y, z]) as unknown as vec3
      }
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'create3d_vector',
      args: [xComponentObj, yComponentObj, zComponentObj]
    })
    const ret = new vec3()
    ret.markPin(ref, '_3dVector', 0)
    return ret as unknown as vec3
  }

  /**
   * 지정된 밑으로 진수의 로그를 계산한다. 밑은 음수이거나 1이면 안 되고, 진수는 음수이면 안 된다 (그렇지 않으면 비정상 값이 생성될 수 있다)
   *
   * @param realNumber 진수
   * @param base 밑
   * @returns 결과
   */
  logarithmOperation(realNumber: FloatValue, base: FloatValue): number {
    const realNumberObj = parseValue(realNumber, 'float')
    const baseObj = parseValue(base, 'float')
    if (isPrecomputeEnabled()) {
      const real = readLiteralFloat(realNumberObj)
      const b = readLiteralFloat(baseObj)
      if (real !== null && b !== null && real > 0 && b > 0 && b !== 1) {
        const result = Math.log(real) / Math.log(b)
        if (Number.isFinite(result)) {
          return new float(result) as unknown as number
        }
      }
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'logarithm_operation',
      args: [realNumberObj, baseObj]
    })
    const ret = new float()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as number
  }

  /**
   * 입력값의 아크코사인을 계산하여 라디안 값으로 반환한다
   *
   * @param input 입력
   * @returns 라디안
   */
  arccosineFunction(input: FloatValue): number {
    const inputObj = parseValue(input, 'float')
    const pre = tryPrecomputeFloatUnary(inputObj, (a) => Math.acos(a))
    if (pre) return pre as unknown as number
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'arccosine_function',
      args: [inputObj]
    })
    const ret = new float()
    ret.markPin(ref, 'radian', 0)
    return ret as unknown as number
  }

  /**
   * 입력값의 아크탄젠트를 계산하여 라디안 값으로 반환한다
   *
   * @param input 입력
   * @returns 라디안
   */
  arctangentFunction(input: FloatValue): number {
    const inputObj = parseValue(input, 'float')
    const pre = tryPrecomputeFloatUnary(inputObj, (a) => Math.atan(a))
    if (pre) return pre as unknown as number
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'arctangent_function',
      args: [inputObj]
    })
    const ret = new float()
    ret.markPin(ref, 'radian', 0)
    return ret as unknown as number
  }

  /**
   * 입력값의 아크사인을 계산하여 라디안 값으로 반환한다
   *
   * @param input 입력
   * @returns 라디안
   */
  arcsineFunction(input: FloatValue): number {
    const inputObj = parseValue(input, 'float')
    const pre = tryPrecomputeFloatUnary(inputObj, (a) => Math.asin(a))
    if (pre) return pre as unknown as number
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'arcsine_function',
      args: [inputObj]
    })
    const ret = new float()
    ret.markPin(ref, 'radian', 0)
    return ret as unknown as number
  }

  /**
   * 입력값을 [하한, 상한] 범위로 클램프하여 결과를 출력한다 (양 끝값 포함)
   *
   * @param input 입력
   * @param lowerLimit 하한
   * @param upperLimit 상한
   * @returns 결과
   */
  rangeLimitingOperation(input: FloatValue, lowerLimit: FloatValue, upperLimit: FloatValue): number
  rangeLimitingOperation(input: IntValue, lowerLimit: IntValue, upperLimit: IntValue): bigint
  rangeLimitingOperation<T extends 'float' | 'int'>(
    input: RuntimeParameterValueTypeMap[T],
    lowerLimit: RuntimeParameterValueTypeMap[T],
    upperLimit: RuntimeParameterValueTypeMap[T]
  ): RuntimeReturnValueTypeMap[T] {
    const genericType = matchTypes(['float', 'int'], input, lowerLimit, upperLimit)
    const inputObj = parseValue(input, genericType)
    const lowerLimitObj = parseValue(lowerLimit, genericType)
    const upperLimitObj = parseValue(upperLimit, genericType)
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'range_limiting_operation',
      args: [inputObj, lowerLimitObj, upperLimitObj]
    })
    const ret = new ValueClassMap[genericType]()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as RuntimeReturnValueTypeMap[T]
  }

  /**
   * 앞 벡터와 위 벡터를 오일러 각도로 변환한다
   *
   * @param forwardVector 앞 벡터: 유닛이 바라볼 방향을 나타낸다
   * @param upwardVector 위 벡터: 유닛의 위쪽 방향을 정의한다 (회전 각도 결정에 사용). 기본값은 월드 좌표계의 Y축 양방향
   * @returns 회전값
   */
  directionVectorToRotation(forwardVector: Vec3Value, upwardVector: Vec3Value): vec3 {
    const forwardVectorObj = parseValue(forwardVector, 'vec3')
    const upwardVectorObj = parseValue(upwardVector, 'vec3')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'direction_vector_to_rotation',
      args: [forwardVectorObj, upwardVectorObj]
    })
    const ret = new vec3()
    ret.markPin(ref, 'rotate', 0)
    return ret as unknown as vec3
  }

  /**
   * 포맷된 시간을 타임스탬프로 변환한다
   *
   * @param year 년
   * @param month 월
   * @param day 일
   * @param hour 시
   * @param minute 분
   * @param second 초
   * @returns 타임스탬프
   */
  calculateTimestampFromFormattedTime(
    year: IntValue,
    month: IntValue,
    day: IntValue,
    hour: IntValue,
    minute: IntValue,
    second: IntValue
  ): bigint {
    const yearObj = parseValue(year, 'int')
    const monthObj = parseValue(month, 'int')
    const dayObj = parseValue(day, 'int')
    const hourObj = parseValue(hour, 'int')
    const minuteObj = parseValue(minute, 'int')
    const secondObj = parseValue(second, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'calculate_timestamp_from_formatted_time',
      args: [yearObj, monthObj, dayObj, hourObj, minuteObj, secondObj]
    })
    const ret = new int()
    ret.markPin(ref, 'timestamp', 0)
    return ret as unknown as bigint
  }

  /**
   * 타임스탬프를 포맷된 시간으로 변환한다
   *
   * @param timestamp 타임스탬프
   */
  calculateFormattedTimeFromTimestamp(timestamp: IntValue): {
    /** 년 */
    year: bigint
    /** 월 */
    month: bigint
    /** 일 */
    day: bigint
    /** 시 */
    hour: bigint
    /** 분 */
    minute: bigint
    /** 초 */
    second: bigint
  } {
    const timestampObj = parseValue(timestamp, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'calculate_formatted_time_from_timestamp',
      args: [timestampObj]
    })
    return {
      year: (() => {
        const ret = new int()
        ret.markPin(ref, 'year', 0)
        return ret as unknown as bigint
      })(),
      month: (() => {
        const ret = new int()
        ret.markPin(ref, 'month', 1)
        return ret as unknown as bigint
      })(),
      day: (() => {
        const ret = new int()
        ret.markPin(ref, 'day', 2)
        return ret as unknown as bigint
      })(),
      hour: (() => {
        const ret = new int()
        ret.markPin(ref, 'hour', 3)
        return ret as unknown as bigint
      })(),
      minute: (() => {
        const ret = new int()
        ret.markPin(ref, 'minute', 4)
        return ret as unknown as bigint
      })(),
      second: (() => {
        const ret = new int()
        ret.markPin(ref, 'second', 5)
        return ret as unknown as bigint
      })()
    }
  }

  /**
   * 타임스탬프를 요일로 변환한다
   *
   * @param timestamp 타임스탬프
   * @returns 요일
   */
  calculateDayOfTheWeekFromTimestamp(timestamp: IntValue): bigint {
    const timestampObj = parseValue(timestamp, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'calculate_day_of_the_week_from_timestamp',
      args: [timestampObj]
    })
    const ret = new int()
    ret.markPin(ref, 'weekday', 0)
    return ret as unknown as bigint
  }

  /**
   * 라디안을 도(degree)로 변환한다
   *
   * @param radianValue 라디안 값
   * @returns 각도 값
   */
  radiansToDegrees(radianValue: FloatValue): number {
    const radianValueObj = parseValue(radianValue, 'float')
    const pre = tryPrecomputeFloatUnary(radianValueObj, (a) => (a * 180) / Math.PI)
    if (pre) return pre as unknown as number
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'radians_to_degrees',
      args: [radianValueObj]
    })
    const ret = new float()
    ret.markPin(ref, 'angleValue', 0)
    return ret as unknown as number
  }

  /**
   * 두 부동소수점 수 또는 정수를 더한다
   *
   * @param input1
   * @param input2
   * @returns 결과
   */
  addition(input1: FloatValue, input2: FloatValue): number
  addition(input1: IntValue, input2: IntValue): bigint
  addition<T extends 'float' | 'int'>(
    input1: RuntimeParameterValueTypeMap[T],
    input2: RuntimeParameterValueTypeMap[T]
  ): RuntimeReturnValueTypeMap[T] {
    const genericType = matchTypes(['float', 'int'], input1, input2)
    const input1Obj = parseValue(input1, genericType)
    const input2Obj = parseValue(input2, genericType)
    const pre =
      genericType === 'float'
        ? tryPrecomputeFloatBinary(input1Obj, input2Obj, (a, b) => a + b)
        : tryPrecomputeIntBinary(input1Obj, input2Obj, (a, b) => a + b)
    if (pre) return pre as unknown as RuntimeReturnValueTypeMap[T]
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'addition',
      args: [input1Obj, input2Obj]
    })
    const ret = new ValueClassMap[genericType]()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as RuntimeReturnValueTypeMap[T]
  }

  /**
   * 두 부동소수점 수 또는 정수를 뺀다
   *
   * @param input1
   * @param input2
   * @returns 결과
   */
  subtraction(input1: FloatValue, input2: FloatValue): number
  subtraction(input1: IntValue, input2: IntValue): bigint
  subtraction<T extends 'float' | 'int'>(
    input1: RuntimeParameterValueTypeMap[T],
    input2: RuntimeParameterValueTypeMap[T]
  ): RuntimeReturnValueTypeMap[T] {
    const genericType = matchTypes(['float', 'int'], input1, input2)
    const input1Obj = parseValue(input1, genericType)
    const input2Obj = parseValue(input2, genericType)
    const pre =
      genericType === 'float'
        ? tryPrecomputeFloatBinary(input1Obj, input2Obj, (a, b) => a - b)
        : tryPrecomputeIntBinary(input1Obj, input2Obj, (a, b) => a - b)
    if (pre) return pre as unknown as RuntimeReturnValueTypeMap[T]
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'subtraction',
      args: [input1Obj, input2Obj]
    })
    const ret = new ValueClassMap[genericType]()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as RuntimeReturnValueTypeMap[T]
  }

  /**
   * 도(degree)를 라디안으로 변환한다
   *
   * @param angleValue 각도 값
   * @returns 라디안 값
   */
  degreesToRadians(angleValue: FloatValue): number {
    const angleValueObj = parseValue(angleValue, 'float')
    const pre = tryPrecomputeFloatUnary(angleValueObj, (a) => (a * Math.PI) / 180)
    if (pre) return pre as unknown as number
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'degrees_to_radians',
      args: [angleValueObj]
    })
    const ret = new float()
    ret.markPin(ref, 'radianValue', 0)
    return ret as unknown as number
  }

  /**
   * 두 입력 중 더 큰 값을 반환한다
   *
   * @param input1 입력1
   * @param input2 입력2
   * @returns 더 큰 값
   */
  takeLargerValue(input1: FloatValue, input2: FloatValue): number
  takeLargerValue(input1: IntValue, input2: IntValue): bigint
  takeLargerValue<T extends 'float' | 'int'>(
    input1: RuntimeParameterValueTypeMap[T],
    input2: RuntimeParameterValueTypeMap[T]
  ): RuntimeReturnValueTypeMap[T] {
    const genericType = matchTypes(['float', 'int'], input1, input2)
    const input1Obj = parseValue(input1, genericType)
    const input2Obj = parseValue(input2, genericType)
    const pre =
      genericType === 'float'
        ? tryPrecomputeFloatBinary(input1Obj, input2Obj, (a, b) => Math.max(a, b))
        : tryPrecomputeIntBinary(input1Obj, input2Obj, (a, b) => (a > b ? a : b))
    if (pre) return pre as unknown as RuntimeReturnValueTypeMap[T]
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'take_larger_value',
      args: [input1Obj, input2Obj]
    })
    const ret = new ValueClassMap[genericType]()
    ret.markPin(ref, 'largerValue', 0)
    return ret as unknown as RuntimeReturnValueTypeMap[T]
  }

  /**
   * 두 입력 중 더 작은 값을 반환한다
   *
   * @param input1 입력1
   * @param input2 입력2
   * @returns 더 작은 값
   */
  takeSmallerValue(input1: FloatValue, input2: FloatValue): number
  takeSmallerValue(input1: IntValue, input2: IntValue): bigint
  takeSmallerValue<T extends 'float' | 'int'>(
    input1: RuntimeParameterValueTypeMap[T],
    input2: RuntimeParameterValueTypeMap[T]
  ): RuntimeReturnValueTypeMap[T] {
    const genericType = matchTypes(['float', 'int'], input1, input2)
    const input1Obj = parseValue(input1, genericType)
    const input2Obj = parseValue(input2, genericType)
    const pre =
      genericType === 'float'
        ? tryPrecomputeFloatBinary(input1Obj, input2Obj, (a, b) => Math.min(a, b))
        : tryPrecomputeIntBinary(input1Obj, input2Obj, (a, b) => (a < b ? a : b))
    if (pre) return pre as unknown as RuntimeReturnValueTypeMap[T]
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'take_smaller_value',
      args: [input1Obj, input2Obj]
    })
    const ret = new ValueClassMap[genericType]()
    ret.markPin(ref, 'smallerValue', 0)
    return ret as unknown as RuntimeReturnValueTypeMap[T]
  }

  /**
   * 입력값의 절댓값을 반환한다
   *
   * @param input 입력
   * @returns 결과
   */
  absoluteValueOperation(input: FloatValue): number
  absoluteValueOperation(input: IntValue): bigint
  absoluteValueOperation<T extends 'float' | 'int'>(
    input: RuntimeParameterValueTypeMap[T]
  ): RuntimeReturnValueTypeMap[T] {
    const genericType = matchTypes(['float', 'int'], input)
    const inputObj = parseValue(input, genericType)
    if (genericType === 'float') {
      const pre = tryPrecomputeFloatUnary(inputObj, (a) => Math.abs(a))
      if (pre) return pre as unknown as RuntimeReturnValueTypeMap[T]
    } else {
      const pre = tryPrecomputeIntUnary(inputObj, (a) => (a < 0n ? -a : a))
      if (pre) return pre as unknown as RuntimeReturnValueTypeMap[T]
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'absolute_value_operation',
      args: [inputObj]
    })
    const ret = new ValueClassMap[genericType]()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as RuntimeReturnValueTypeMap[T]
  }

  /**
   * 두 좌표 사이의 유클리드 거리를 계산한다
   *
   * @param coordinatePoint1 좌표점1
   * @param coordinatePoint2 좌표점2
   * @returns 거리
   */
  distanceBetweenTwoCoordinatePoints(
    coordinatePoint1: Vec3Value,
    coordinatePoint2: Vec3Value
  ): number {
    const coordinatePoint1Obj = parseValue(coordinatePoint1, 'vec3')
    const coordinatePoint2Obj = parseValue(coordinatePoint2, 'vec3')
    const pre = tryPrecomputeVec3BinaryToFloat(coordinatePoint1Obj, coordinatePoint2Obj, (a, b) => {
      const dx = a[0] - b[0]
      const dy = a[1] - b[1]
      const dz = a[2] - b[2]
      return Math.sqrt(dx * dx + dy * dy + dz * dz)
    })
    if (pre) return pre as unknown as number
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'distance_between_two_coordinate_points',
      args: [coordinatePoint1Obj, coordinatePoint2Obj]
    })
    const ret = new float()
    ret.markPin(ref, 'distance', 0)
    return ret as unknown as number
  }

  /**
   * 입력 불리언 값에 대해 논리 NOT 연산을 수행하고 결과를 반환한다
   *
   * @param input 입력
   * @returns 결과
   */
  logicalNotOperation(input: BoolValue): boolean {
    const inputObj = parseValue(input, 'bool')
    const pre = tryPrecomputeBoolUnary(inputObj, (a) => !a)
    if (pre) return pre as unknown as boolean
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'logical_not_operation',
      args: [inputObj]
    })
    const ret = new bool()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as boolean
  }

  /**
   * 두 입력 불리언 값에 대해 논리 OR 연산을 수행하고 결과를 반환한다
   *
   * @param input1 입력1
   * @param input2 입력2
   * @returns 결과
   */
  logicalOrOperation(input1: BoolValue, input2: BoolValue): boolean {
    const input1Obj = parseValue(input1, 'bool')
    const input2Obj = parseValue(input2, 'bool')
    const pre = tryPrecomputeBoolBinary(input1Obj, input2Obj, (a, b) => a || b)
    if (pre) return pre as unknown as boolean
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'logical_or_operation',
      args: [input1Obj, input2Obj]
    })
    const ret = new bool()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as boolean
  }

  /**
   * 두 입력 불리언 값에 대해 논리 XOR 연산을 수행하고 결과를 반환한다
   *
   * @param input1 입력1
   * @param input2 입력2
   * @returns 결과
   */
  logicalXorOperation(input1: BoolValue, input2: BoolValue): boolean {
    const input1Obj = parseValue(input1, 'bool')
    const input2Obj = parseValue(input2, 'bool')
    const pre = tryPrecomputeBoolBinary(input1Obj, input2Obj, (a, b) => a !== b)
    if (pre) return pre as unknown as boolean
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'logical_xor_operation',
      args: [input1Obj, input2Obj]
    })
    const ret = new bool()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as boolean
  }

  /**
   * 두 입력 불리언 값에 대해 논리 AND 연산을 수행하고 결과를 반환한다
   *
   * @param input1 입력1
   * @param input2 입력2
   * @returns 결과
   */
  logicalAndOperation(input1: BoolValue, input2: BoolValue): boolean {
    const input1Obj = parseValue(input1, 'bool')
    const input2Obj = parseValue(input2, 'bool')
    const pre = tryPrecomputeBoolBinary(input1Obj, input2Obj, (a, b) => a && b)
    if (pre) return pre as unknown as boolean
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'logical_and_operation',
      args: [input1Obj, input2Obj]
    })
    const ret = new bool()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as boolean
  }

  /**
   * 밑을 지수만큼 거듭제곱한 결과를 반환한다
   *
   * @param base 밑
   * @param exponent 지수
   * @returns 결과
   */
  exponentiation(base: FloatValue, exponent: FloatValue): number
  exponentiation(base: IntValue, exponent: IntValue): bigint
  exponentiation<T extends 'float' | 'int'>(
    base: RuntimeParameterValueTypeMap[T],
    exponent: RuntimeParameterValueTypeMap[T]
  ): RuntimeReturnValueTypeMap[T] {
    const genericType = matchTypes(['float', 'int'], base, exponent)
    const baseObj = parseValue(base, genericType)
    const exponentObj = parseValue(exponent, genericType)
    if (genericType === 'float') {
      const pre = tryPrecomputeFloatBinary(baseObj, exponentObj, (a, b) => Math.pow(a, b))
      if (pre) return pre as unknown as RuntimeReturnValueTypeMap[T]
    } else {
      if (isPrecomputeEnabled()) {
        const a = readLiteralInt(baseObj)
        const b = readLiteralInt(exponentObj)
        if (a !== null && b !== null && b >= 0n) {
          return new int(a ** b) as unknown as RuntimeReturnValueTypeMap[T]
        }
      }
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'exponentiation',
      args: [baseObj, exponentObj]
    })
    const ret = new ValueClassMap[genericType]()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as RuntimeReturnValueTypeMap[T]
  }

  /**
   * 입력2를 입력1로 나눈 나머지를 반환한다
   *
   * @param input1
   * @param input2
   * @returns 결과
   */
  moduloOperation(input1: IntValue, input2: IntValue): bigint {
    const input1Obj = parseValue(input1, 'int')
    const input2Obj = parseValue(input2, 'int')
    if (isPrecomputeEnabled()) {
      const a = readLiteralInt(input1Obj)
      const b = readLiteralInt(input2Obj)
      if (a !== null && b !== null && b !== 0n) {
        return new int(a % b) as unknown as bigint
      }
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'modulo_operation',
      args: [input1Obj, input2Obj]
    })
    const ret = new int()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as bigint
  }

  /**
   * 입력 값의 산술 제곱근을 반환한다
   *
   * @param input 입력
   * @returns 결과
   */
  arithmeticSquareRootOperation(input: FloatValue): number {
    const inputObj = parseValue(input, 'float')
    const pre = tryPrecomputeFloatUnary(inputObj, (a) => Math.sqrt(a))
    if (pre) return pre as unknown as number
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'arithmetic_square_root_operation',
      args: [inputObj]
    })
    const ret = new float()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as number
  }

  /**
   * 입력이 양수이면 1, 음수이면 -1, 0이면 0을 반환한다
   *
   * @param input 입력
   * @returns 결과
   */
  signOperation(input: FloatValue): number
  signOperation(input: IntValue): bigint
  signOperation<T extends 'float' | 'int'>(
    input: RuntimeParameterValueTypeMap[T]
  ): RuntimeReturnValueTypeMap[T] {
    const genericType = matchTypes(['float', 'int'], input)
    const inputObj = parseValue(input, genericType)
    if (genericType === 'float') {
      const pre = tryPrecomputeFloatUnary(inputObj, (a) => {
        const result = Math.sign(a)
        return Object.is(result, -0) ? 0 : result
      })
      if (pre) return pre as unknown as RuntimeReturnValueTypeMap[T]
    } else {
      const pre = tryPrecomputeIntUnary(inputObj, (a) => (a > 0n ? 1n : a < 0n ? -1n : 0n))
      if (pre) return pre as unknown as RuntimeReturnValueTypeMap[T]
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'sign_operation',
      args: [inputObj]
    })
    const ret = new ValueClassMap[genericType]()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as RuntimeReturnValueTypeMap[T]
  }

  /**
   * 지정된 반올림 방식으로 취정수 연산을 수행하고 결과를 반환한다
   *
   * @param input 입력
   * @param roundingMode 취정수 방식: 반올림(일반 규칙으로 취정수) / 올림(입력보다 크고 가장 가까운 정수. 예: 1.2→2, -2.3→-2) / 내림(입력보다 작고 가장 가까운 정수. 예: 1.2→1, -2.3→-3) / 버림(소수 부분 제거, 0 방향으로 취정수. 예: 1.2→1, -2.3→-2)
   * @returns 결과
   */
  roundToIntegerOperation(input: FloatValue, roundingMode: RoundingMode): bigint {
    const inputObj = parseValue(input, 'float')
    const roundingModeObj = parseValue(roundingMode, 'enumeration')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'round_to_integer_operation',
      args: [inputObj, roundingModeObj]
    })
    const ret = new int()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as bigint
  }

  /**
   * 3D 벡터의 길이를 정규화하여 결과를 출력한다
   *
   * @param _3dVector 3D 벡터
   * @returns 결과
   */
  _3dVectorNormalization(_3dVector: Vec3Value): vec3 {
    const _3dVectorObj = parseValue(_3dVector, 'vec3')
    if (isPrecomputeEnabled()) {
      const raw = readLiteralVec3(_3dVectorObj)
      if (raw) {
        const mag = Math.sqrt(raw[0] * raw[0] + raw[1] * raw[1] + raw[2] * raw[2])
        if (Number.isFinite(mag) && mag !== 0) {
          return new vec3([raw[0] / mag, raw[1] / mag, raw[2] / mag]) as unknown as vec3
        }
      }
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: '_3d_vector_normalization',
      args: [_3dVectorObj]
    })
    const ret = new vec3()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as vec3
  }

  /**
   * 두 3D 벡터의 합을 계산한다
   *
   * @param _3dVector1 3D 벡터1
   * @param _3dVector2 3D 벡터2
   * @returns 결과
   */
  _3dVectorAddition(_3dVector1: Vec3Value, _3dVector2: Vec3Value): vec3 {
    const _3dVector1Obj = parseValue(_3dVector1, 'vec3')
    const _3dVector2Obj = parseValue(_3dVector2, 'vec3')
    const pre = tryPrecomputeVec3Binary(_3dVector1Obj, _3dVector2Obj, (a, b) => [
      a[0] + b[0],
      a[1] + b[1],
      a[2] + b[2]
    ])
    if (pre) return pre as unknown as vec3
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: '_3d_vector_addition',
      args: [_3dVector1Obj, _3dVector2Obj]
    })
    const ret = new vec3()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as vec3
  }

  /**
   * 두 3D 벡터 사이의 각도를 계산하여 라디안으로 출력한다
   *
   * @param _3dVector1 3D 벡터1
   * @param _3dVector2 3D 벡터2
   * @returns 끼인각 (라디안)
   */
  _3dVectorAngle(_3dVector1: Vec3Value, _3dVector2: Vec3Value): number {
    const _3dVector1Obj = parseValue(_3dVector1, 'vec3')
    const _3dVector2Obj = parseValue(_3dVector2, 'vec3')
    if (isPrecomputeEnabled()) {
      const a = readLiteralVec3(_3dVector1Obj)
      const b = readLiteralVec3(_3dVector2Obj)
      if (a && b) {
        const magA = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2])
        const magB = Math.sqrt(b[0] * b[0] + b[1] * b[1] + b[2] * b[2])
        if (Number.isFinite(magA) && Number.isFinite(magB) && magA !== 0 && magB !== 0) {
          const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
          const angle = Math.acos(dot / (magA * magB))
          if (Number.isFinite(angle)) {
            return new float(angle) as unknown as number
          }
        }
      }
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: '_3d_vector_angle',
      args: [_3dVector1Obj, _3dVector2Obj]
    })
    const ret = new float()
    ret.markPin(ref, 'angleRadians', 0)
    return ret as unknown as number
  }

  /**
   * 두 3D 벡터의 차를 계산한다
   *
   * @param _3dVector1 3D 벡터1
   * @param _3dVector2 3D 벡터2
   * @returns 결과
   */
  _3dVectorSubtraction(_3dVector1: Vec3Value, _3dVector2: Vec3Value): vec3 {
    const _3dVector1Obj = parseValue(_3dVector1, 'vec3')
    const _3dVector2Obj = parseValue(_3dVector2, 'vec3')
    const pre = tryPrecomputeVec3Binary(_3dVector1Obj, _3dVector2Obj, (a, b) => [
      a[0] - b[0],
      a[1] - b[1],
      a[2] - b[2]
    ])
    if (pre) return pre as unknown as vec3
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: '_3d_vector_subtraction',
      args: [_3dVector1Obj, _3dVector2Obj]
    })
    const ret = new vec3()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as vec3
  }

  /**
   * 입력 3D 벡터의 크기(모)를 계산한다
   *
   * @param _3dVector 3D 벡터
   * @returns 결과
   */
  _3dVectorModuloOperation(_3dVector: Vec3Value): number {
    const _3dVectorObj = parseValue(_3dVector, 'vec3')
    const pre = tryPrecomputeVec3ToFloat(_3dVectorObj, (a) =>
      Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2])
    )
    if (pre) return pre as unknown as number
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: '_3d_vector_modulo_operation',
      args: [_3dVectorObj]
    })
    const ret = new float()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as number
  }

  /**
   * 두 3D 벡터의 내적(점 곱)을 계산한다
   *
   * @param _3dVector1 3D 벡터1
   * @param _3dVector2 3D 벡터2
   * @returns 결과
   */
  _3dVectorDotProduct(_3dVector1: Vec3Value, _3dVector2: Vec3Value): number {
    const _3dVector1Obj = parseValue(_3dVector1, 'vec3')
    const _3dVector2Obj = parseValue(_3dVector2, 'vec3')
    const pre = tryPrecomputeVec3BinaryToFloat(
      _3dVector1Obj,
      _3dVector2Obj,
      (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
    )
    if (pre) return pre as unknown as number
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: '_3d_vector_dot_product',
      args: [_3dVector1Obj, _3dVector2Obj]
    })
    const ret = new float()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as number
  }

  /**
   * 입력 3D 벡터를 스칼라 배율로 스케일링하여 결과를 출력한다
   *
   * @param _3dVector 3D 벡터
   * @param zoomMultiplier 스케일 배율
   * @returns 결과
   */
  _3dVectorZoom(_3dVector: Vec3Value, zoomMultiplier: FloatValue): vec3 {
    const _3dVectorObj = parseValue(_3dVector, 'vec3')
    const zoomMultiplierObj = parseValue(zoomMultiplier, 'float')
    if (isPrecomputeEnabled()) {
      const v = readLiteralVec3(_3dVectorObj)
      const scale = readLiteralFloat(zoomMultiplierObj)
      if (v && scale !== null) {
        return new vec3([v[0] * scale, v[1] * scale, v[2] * scale]) as unknown as vec3
      }
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: '_3d_vector_zoom',
      args: [_3dVectorObj, zoomMultiplierObj]
    })
    const ret = new vec3()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as vec3
  }

  /**
   * 두 3D 벡터의 외적(크로스 곱)을 계산한다
   *
   * @param _3dVector1 3D 벡터1
   * @param _3dVector2 3D 벡터2
   * @returns 결과
   */
  _3dVectorCrossProduct(_3dVector1: Vec3Value, _3dVector2: Vec3Value): vec3 {
    const _3dVector1Obj = parseValue(_3dVector1, 'vec3')
    const _3dVector2Obj = parseValue(_3dVector2, 'vec3')
    const pre = tryPrecomputeVec3Binary(_3dVector1Obj, _3dVector2Obj, (a, b) => [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ])
    if (pre) return pre as unknown as vec3
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: '_3d_vector_cross_product',
      args: [_3dVector1Obj, _3dVector2Obj]
    })
    const ret = new vec3()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as vec3
  }

  /**
   * 회전이 나타내는 오일러 각도에 따라 입력 3D 벡터를 회전하고 결과를 반환한다
   *
   * @param rotate 회전: 특정 오일러 각도 회전을 나타내는 3D 입력 벡터
   * @param rotated3dVector 회전 대상 3D 벡터
   * @returns 결과
   */
  _3dVectorRotation(rotate: Vec3Value, rotated3dVector: Vec3Value): vec3 {
    const rotateObj = parseValue(rotate, 'vec3')
    const rotated3dVectorObj = parseValue(rotated3dVector, 'vec3')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: '_3d_vector_rotation',
      args: [rotateObj, rotated3dVectorObj]
    })
    const ret = new vec3()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as vec3
  }

  /**
   * 좌값이 우값보다 큰지 여부를 반환한다
   *
   * @param leftValue 좌값
   * @param rightValue 우값
   * @returns 결과
   */
  greaterThan(leftValue: FloatValue, rightValue: FloatValue): boolean
  greaterThan(leftValue: IntValue, rightValue: IntValue): boolean
  greaterThan<T extends 'float' | 'int'>(
    leftValue: RuntimeParameterValueTypeMap[T],
    rightValue: RuntimeParameterValueTypeMap[T]
  ): boolean {
    const genericType = matchTypes(['float', 'int'], leftValue, rightValue)
    const leftValueObj = parseValue(leftValue, genericType)
    const rightValueObj = parseValue(rightValue, genericType)
    const pre = tryPrecomputeCompare(genericType, leftValueObj, rightValueObj, (a, b) => a > b)
    if (pre) return pre as unknown as boolean
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'greater_than',
      args: [leftValueObj, rightValueObj]
    })
    const ret = new bool()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as boolean
  }

  /**
   * 좌값이 우값 이상인지 여부를 반환한다
   *
   * @param leftValue 좌값
   * @param rightValue 우값
   * @returns 결과
   */
  greaterThanOrEqualTo(leftValue: FloatValue, rightValue: FloatValue): boolean
  greaterThanOrEqualTo(leftValue: IntValue, rightValue: IntValue): boolean
  greaterThanOrEqualTo<T extends 'float' | 'int'>(
    leftValue: RuntimeParameterValueTypeMap[T],
    rightValue: RuntimeParameterValueTypeMap[T]
  ): boolean {
    const genericType = matchTypes(['float', 'int'], leftValue, rightValue)
    const leftValueObj = parseValue(leftValue, genericType)
    const rightValueObj = parseValue(rightValue, genericType)
    const pre = tryPrecomputeCompare(genericType, leftValueObj, rightValueObj, (a, b) => a >= b)
    if (pre) return pre as unknown as boolean
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'greater_than_or_equal_to',
      args: [leftValueObj, rightValueObj]
    })
    const ret = new bool()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as boolean
  }

  /**
   * 좌값이 우값보다 작은지 여부를 반환한다
   *
   * @param leftValue 좌값
   * @param rightValue 우값
   * @returns 결과
   */
  lessThan(leftValue: FloatValue, rightValue: FloatValue): boolean
  lessThan(leftValue: IntValue, rightValue: IntValue): boolean
  lessThan<T extends 'float' | 'int'>(
    leftValue: RuntimeParameterValueTypeMap[T],
    rightValue: RuntimeParameterValueTypeMap[T]
  ): boolean {
    const genericType = matchTypes(['float', 'int'], leftValue, rightValue)
    const leftValueObj = parseValue(leftValue, genericType)
    const rightValueObj = parseValue(rightValue, genericType)
    const pre = tryPrecomputeCompare(genericType, leftValueObj, rightValueObj, (a, b) => a < b)
    if (pre) return pre as unknown as boolean
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'less_than',
      args: [leftValueObj, rightValueObj]
    })
    const ret = new bool()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as boolean
  }

  /**
   * 좌값이 우값 이하인지 여부를 반환한다
   *
   * @param leftValue 좌값
   * @param rightValue 우값
   * @returns 결과
   */
  lessThanOrEqualTo(leftValue: FloatValue, rightValue: FloatValue): boolean
  lessThanOrEqualTo(leftValue: IntValue, rightValue: IntValue): boolean
  lessThanOrEqualTo<T extends 'float' | 'int'>(
    leftValue: RuntimeParameterValueTypeMap[T],
    rightValue: RuntimeParameterValueTypeMap[T]
  ): boolean {
    const genericType = matchTypes(['float', 'int'], leftValue, rightValue)
    const leftValueObj = parseValue(leftValue, genericType)
    const rightValueObj = parseValue(rightValue, genericType)
    const pre = tryPrecomputeCompare(genericType, leftValueObj, rightValueObj, (a, b) => a <= b)
    if (pre) return pre as unknown as boolean
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'less_than_or_equal_to',
      args: [leftValueObj, rightValueObj]
    })
    const ret = new bool()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as boolean
  }

  /**
   * 입력 라디안의 코사인을 계산한다
   *
   * @param radian 라디안
   * @returns 결과
   */
  cosineFunction(radian: FloatValue): number {
    const radianObj = parseValue(radian, 'float')
    const pre = tryPrecomputeFloatUnary(radianObj, (a) => Math.cos(a))
    if (pre) return pre as unknown as number
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'cosine_function',
      args: [radianObj]
    })
    const ret = new float()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as number
  }

  /**
   * 입력 라디안의 탄젠트를 계산한다
   *
   * @param radian 라디안
   * @returns 결과
   */
  tangentFunction(radian: FloatValue): number {
    const radianObj = parseValue(radian, 'float')
    const pre = tryPrecomputeFloatUnary(radianObj, (a) => Math.tan(a))
    if (pre) return pre as unknown as number
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'tangent_function',
      args: [radianObj]
    })
    const ret = new float()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as number
  }

  /**
   * 입력 라디안의 사인을 계산한다
   *
   * @param radian 라디안
   * @returns 결과
   */
  sineFunction(radian: FloatValue): number {
    const radianObj = parseValue(radian, 'float')
    const pre = tryPrecomputeFloatUnary(radianObj, (a) => Math.sin(a))
    if (pre) return pre as unknown as number
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'sine_function',
      args: [radianObj]
    })
    const ret = new float()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as number
  }

  /**
   * 입력 값을 지정된 비트 수만큼 논리 왼쪽 시프트하여 결과를 출력한다
   *
   * @param value 값
   * @param leftShiftCount 왼쪽 시프트 비트 수
   * @returns 결과
   */
  leftShiftOperation(value: IntValue, leftShiftCount: IntValue): bigint {
    const valueObj = parseValue(value, 'int')
    const leftShiftCountObj = parseValue(leftShiftCount, 'int')
    if (isPrecomputeEnabled()) {
      const v = readLiteralInt(valueObj)
      const c = readLiteralInt(leftShiftCountObj)
      if (v !== null && c !== null && c >= 0n) {
        return new int(v << c) as unknown as bigint
      }
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'left_shift_operation',
      args: [valueObj, leftShiftCountObj]
    })
    const ret = new int()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as bigint
  }

  /**
   * 입력 값을 지정된 비트 수만큼 오른쪽 시프트하여 결과를 출력한다. 부호 비트를 보존하는 산술 오른쪽 시프트를 수행한다
   *
   * @param value 값
   * @param rightShiftCount 오른쪽 시프트 비트 수
   * @returns 결과
   */
  rightShiftOperation(value: IntValue, rightShiftCount: IntValue): bigint {
    const valueObj = parseValue(value, 'int')
    const rightShiftCountObj = parseValue(rightShiftCount, 'int')
    if (isPrecomputeEnabled()) {
      const v = readLiteralInt(valueObj)
      const c = readLiteralInt(rightShiftCountObj)
      if (v !== null && c !== null && c >= 0n) {
        return new int(v >> c) as unknown as bigint
      }
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'right_shift_operation',
      args: [valueObj, rightShiftCountObj]
    })
    const ret = new int()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as bigint
  }

  /**
   * 두 입력 값에 대해 비트 AND 연산을 수행하고 결과를 반환한다
   *
   * @param value1 값1
   * @param value2 값2
   * @returns 결과
   */
  bitwiseAnd(value1: IntValue, value2: IntValue): bigint {
    const value1Obj = parseValue(value1, 'int')
    const value2Obj = parseValue(value2, 'int')
    const pre = tryPrecomputeIntBinary(value1Obj, value2Obj, (a, b) => a & b)
    if (pre) return pre as unknown as bigint
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'bitwise_and',
      args: [value1Obj, value2Obj]
    })
    const ret = new int()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as bigint
  }

  /**
   * 두 입력 값에 대해 비트 OR 연산을 수행하고 결과를 반환한다
   *
   * @param value1 값1
   * @param value2 값2
   * @returns 결과
   */
  bitwiseOr(value1: IntValue, value2: IntValue): bigint {
    const value1Obj = parseValue(value1, 'int')
    const value2Obj = parseValue(value2, 'int')
    const pre = tryPrecomputeIntBinary(value1Obj, value2Obj, (a, b) => a | b)
    if (pre) return pre as unknown as bigint
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'bitwise_or',
      args: [value1Obj, value2Obj]
    })
    const ret = new int()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as bigint
  }

  /**
   * 두 입력 값에 대해 비트 XOR 연산을 수행하고 결과를 반환한다
   *
   * @param value1 값1
   * @param value2 값2
   * @returns 결과
   */
  xorExclusiveOr(value1: IntValue, value2: IntValue): bigint {
    const value1Obj = parseValue(value1, 'int')
    const value2Obj = parseValue(value2, 'int')
    const pre = tryPrecomputeIntBinary(value1Obj, value2Obj, (a, b) => a ^ b)
    if (pre) return pre as unknown as bigint
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'xor_exclusive_or',
      args: [value1Obj, value2Obj]
    })
    const ret = new int()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as bigint
  }

  /**
   * 입력 값에 대해 비트 보수(complement) 연산을 수행하고 결과를 반환한다
   *
   * @param value 값
   * @returns 결과
   */
  bitwiseComplement(value: IntValue): bigint {
    const valueObj = parseValue(value, 'int')
    const pre = tryPrecomputeIntUnary(valueObj, (a) => ~a)
    if (pre) return pre as unknown as bigint
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'bitwise_complement',
      args: [valueObj]
    })
    const ret = new int()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as bigint
  }

  /**
   * 쓰기 값을 이진수로서 대상 값(마찬가지로 이진수)의 [시작 비트, 종료 비트]에 쓴다. 시작 비트는 0부터 시작하며, 쓰기 길이는 시작 비트와 종료 비트를 모두 포함한다. 쓰기 값의 이진 유효 자릿수(왼쪽에서 첫 번째 1부터 계산)가 쓰기 길이를 초과하면 쓰기에 실패하고 원래 값을 반환한다. 쓰기 값이 음수인 경우에도 쓰기 길이를 초과하므로 실패한다(음수의 이진수 첫 번째 비트는 부호 비트 1임)
   *
   * @param writtenValue 대상 값: 쓰기가 적용될 값
   * @param writeValue 쓰기 값: 쓸 값
   * @param writeStartingPosition 시작 비트: 쓰기 시작 위치
   * @param writeEndPosition 종료 비트: 쓰기 종료 위치
   * @returns 결과
   */
  writeByBit(
    writtenValue: IntValue,
    writeValue: IntValue,
    writeStartingPosition: IntValue,
    writeEndPosition: IntValue
  ): bigint {
    const writtenValueObj = parseValue(writtenValue, 'int')
    const writeValueObj = parseValue(writeValue, 'int')
    const writeStartingPositionObj = parseValue(writeStartingPosition, 'int')
    const writeEndPositionObj = parseValue(writeEndPosition, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'write_by_bit',
      args: [writtenValueObj, writeValueObj, writeStartingPositionObj, writeEndPositionObj]
    })
    const ret = new int()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as bigint
  }

  /**
   * 값(이진수 표현)의 [시작 비트, 종료 비트]에서 값을 읽어낸다
   *
   * @param value 값
   * @param readStartingPosition 읽기 시작 비트
   * @param readEndPosition 읽기 종료 비트
   * @returns 결과
   */
  readByBit(value: IntValue, readStartingPosition: IntValue, readEndPosition: IntValue): bigint {
    const valueObj = parseValue(value, 'int')
    const readStartingPositionObj = parseValue(readStartingPosition, 'int')
    const readEndPositionObj = parseValue(readEndPosition, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'read_by_bit',
      args: [valueObj, readStartingPositionObj, readEndPositionObj]
    })
    const ret = new int()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as bigint
  }

  /**
   * 지정한 구조체의 모든 파라미터를 반환한다
   */
  splitStructure(): void {
    this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'split_structure',
      args: []
    })
  }

  /**
   * 여러 파라미터를 하나의 구조체 타입 값으로 합친다
   */
  assembleStructure(): void {
    this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'assemble_structure',
      args: []
    })
  }

  /**
   * 매칭 또는 방 생성을 통한 플레이어 수를 포함하여 대국에 입장하는 이론적 플레이어 수와 입장 방식을 조회한다
   */
  queryGameModeAndPlayerNumber(): {
    /** 플레이어 수 */
    playerCount: bigint
    /**
     * 플레이 방식: 체험, 방 플레이, 매칭 플레이로 구분된다
     */
    playMode: GameplayMode
  } {
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_game_mode_and_player_number',
      args: []
    })
    return {
      playerCount: (() => {
        const ret = new int()
        ret.markPin(ref, 'playerCount', 0)
        return ret as unknown as bigint
      })(),
      playMode: (() => {
        const ret = new enumeration('GameplayMode')
        ret.markPin(ref, 'playMode', 1)
        return ret as unknown as GameplayMode
      })()
    }
  }

  /**
   * 서버의 시간대를 조회한다
   *
   * @returns 시간대
   */
  queryServerTimeZone(): bigint {
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_server_time_zone',
      args: []
    })
    const ret = new int()
    ret.markPin(ref, 'timeZone', 0)
    return ret as unknown as bigint
  }

  /**
   * 현재 타임스탬프(UTC+0 기준)를 조회한다
   *
   * @returns 타임스탬프
   */
  queryTimestampUtc0(): bigint {
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_timestamp_utc0',
      args: []
    })
    const ret = new int()
    ret.markPin(ref, 'timestamp', 0)
    return ret as unknown as bigint
  }

  /**
   * 하한 이상 상한 이하의 무작위 부동소수점 수를 반환한다. 상하한 포함
   *
   * @param lowerLimit 하한
   * @param upperLimit 상한
   * @returns 결과
   */
  getRandomFloatingPointNumber(lowerLimit: FloatValue, upperLimit: FloatValue): number {
    const lowerLimitObj = parseValue(lowerLimit, 'float')
    const upperLimitObj = parseValue(upperLimit, 'float')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_random_floating_point_number',
      args: [lowerLimitObj, upperLimitObj]
    })
    const ret = new float()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as number
  }

  /**
   * 하한 이상 상한 이하의 무작위 정수를 반환한다. 상하한 포함
   *
   * @param lowerLimit 하한
   * @param upperLimit 상한
   * @returns 결과
   */
  getRandomInteger(lowerLimit: IntValue, upperLimit: IntValue): bigint {
    const lowerLimitObj = parseValue(lowerLimit, 'int')
    const upperLimitObj = parseValue(upperLimit, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_random_integer',
      args: [lowerLimitObj, upperLimitObj]
    })
    const ret = new int()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as bigint
  }

  /**
   * 가중치 리스트를 입력받아 가중치 분포에 따라 무작위로 인덱스를 선택한다. 예: 가중치 리스트가 {10, 20, 66, 4}이면 각각 10%, 20%, 66%, 4% 확률로 0, 1, 2, 3을 출력한다
   *
   * @param weightList 가중치 리스트
   * @returns 가중치 인덱스
   */
  weightedRandom(weightList: IntValue[]): bigint {
    const weightListObj = parseValue(weightList, 'int_list')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'weighted_random',
      args: [weightListObj]
    })
    const ret = new int()
    ret.markPin(ref, 'weightId', 0)
    return ret as unknown as bigint
  }

  /**
   * (0,0,-1)을 반환한다
   *
   * @returns (0,0,-1)
   */
  _3dVectorBackward(): vec3 {
    if (isPrecomputeEnabled()) {
      return new vec3([0, 0, -1]) as unknown as vec3
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: '_3d_vector_backward',
      args: []
    })
    const ret = new vec3()
    ret.markPin(ref, '_001', 0)
    return ret as unknown as vec3
  }

  /**
   * (0,0,0)을 반환한다
   *
   * @returns (0,0,0)
   */
  _3dVectorZeroVector(): vec3 {
    if (isPrecomputeEnabled()) {
      return new vec3([0, 0, 0]) as unknown as vec3
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: '_3d_vector_zero_vector',
      args: []
    })
    const ret = new vec3()
    ret.markPin(ref, '_000', 0)
    return ret as unknown as vec3
  }

  /**
   * (0,0,1)을 반환한다
   *
   * @returns (0,0,1)
   */
  _3dVectorForward(): vec3 {
    if (isPrecomputeEnabled()) {
      return new vec3([0, 0, 1]) as unknown as vec3
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: '_3d_vector_forward',
      args: []
    })
    const ret = new vec3()
    ret.markPin(ref, '_001', 0)
    return ret as unknown as vec3
  }

  /**
   * (0,1,0)을 반환한다
   *
   * @returns (0,1,0)
   */
  _3dVectorUp(): vec3 {
    if (isPrecomputeEnabled()) {
      return new vec3([0, 1, 0]) as unknown as vec3
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: '_3d_vector_up',
      args: []
    })
    const ret = new vec3()
    ret.markPin(ref, '_010', 0)
    return ret as unknown as vec3
  }

  /**
   * (0,-1,0)을 반환한다
   *
   * @returns (0,-1,0)
   */
  _3dVectorDown(): vec3 {
    if (isPrecomputeEnabled()) {
      return new vec3([0, -1, 0]) as unknown as vec3
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: '_3d_vector_down',
      args: []
    })
    const ret = new vec3()
    ret.markPin(ref, '_010', 0)
    return ret as unknown as vec3
  }

  /**
   * (1,0,0)을 반환한다
   *
   * @returns (1,0,0)
   */
  _3dVectorRight(): vec3 {
    if (isPrecomputeEnabled()) {
      return new vec3([1, 0, 0]) as unknown as vec3
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: '_3d_vector_right',
      args: []
    })
    const ret = new vec3()
    ret.markPin(ref, '_100', 0)
    return ret as unknown as vec3
  }

  /**
   * (-1,0,0)을 반환한다
   *
   * @returns (-1,0,0)
   */
  _3dVectorLeft(): vec3 {
    if (isPrecomputeEnabled()) {
      return new vec3([-1, 0, 0]) as unknown as vec3
    }
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: '_3d_vector_left',
      args: []
    })
    const ret = new vec3()
    ret.markPin(ref, '_100', 0)
    return ret as unknown as vec3
  }

  /**
   * 원주율 π의 근삿값(≈ 3.142)을 반환한다
   *
   * @returns 원주율
   */
  pi(): number {
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'pi',
      args: []
    })
    const ret = new float()
    ret.markPin(ref, 'pi', 0)
    return ret as unknown as number
  }

  /**
   * 리스트에서 지정한 값을 찾아 해당 값이 나타나는 인덱스 리스트를 반환한다. 예: 대상 리스트가 {1,2,3,2,1}이고 값이 1이면 반환되는 인덱스 리스트는 {0,4}이다
   *
   * @param targetList 대상 리스트
   * @param value 값
   * @returns 인덱스 리스트: 찾지 못하면 빈 리스트를 반환
   */
  searchListAndReturnValueId(targetList: FloatValue[], value: FloatValue): bigint[]
  searchListAndReturnValueId(targetList: IntValue[], value: IntValue): bigint[]
  searchListAndReturnValueId(targetList: BoolValue[], value: BoolValue): bigint[]
  searchListAndReturnValueId(targetList: ConfigIdValue[], value: ConfigIdValue): bigint[]
  searchListAndReturnValueId(targetList: EntityValue[], value: EntityValue): bigint[]
  searchListAndReturnValueId(targetList: FactionValue[], value: FactionValue): bigint[]
  searchListAndReturnValueId(targetList: GuidValue[], value: GuidValue): bigint[]
  searchListAndReturnValueId(targetList: PrefabIdValue[], value: PrefabIdValue): bigint[]
  searchListAndReturnValueId(targetList: StrValue[], value: StrValue): bigint[]
  searchListAndReturnValueId(targetList: Vec3Value[], value: Vec3Value): bigint[]
  searchListAndReturnValueId<
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
    targetList: RuntimeParameterValueTypeMap[T][],
    value: RuntimeParameterValueTypeMap[T]
  ): bigint[] {
    const genericType = matchTypes(
      [
        'float',
        'int',
        'bool',
        'config_id',
        'entity',
        'faction',
        'guid',
        'prefab_id',
        'str',
        'vec3'
      ],
      targetList,
      value
    )
    const targetListObj = parseValue(targetList, `${genericType}_list`)
    const valueObj = parseValue(value, genericType)
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'search_list_and_return_value_id',
      args: [targetListObj, valueObj]
    })
    const ret = new list('int')
    ret.markPin(ref, 'idList', 0)
    return ret as unknown as bigint[]
  }

  /**
   * 리스트에서 지정한 인덱스(0부터 시작)에 해당하는 값을 반환한다
   *
   * @param list 리스트
   * @param id 인덱스
   * @returns 값
   */
  getCorrespondingValueFromList(list: FloatValue[], id: IntValue): number
  getCorrespondingValueFromList(list: IntValue[], id: IntValue): bigint
  getCorrespondingValueFromList(list: BoolValue[], id: IntValue): boolean
  getCorrespondingValueFromList(list: ConfigIdValue[], id: IntValue): configId
  getCorrespondingValueFromList(list: EntityValue[], id: IntValue): entity
  getCorrespondingValueFromList(list: FactionValue[], id: IntValue): faction
  getCorrespondingValueFromList(list: GuidValue[], id: IntValue): guid
  getCorrespondingValueFromList(list: PrefabIdValue[], id: IntValue): prefabId
  getCorrespondingValueFromList(list: StrValue[], id: IntValue): string
  getCorrespondingValueFromList(list: Vec3Value[], id: IntValue): vec3
  getCorrespondingValueFromList<
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
  >(list: RuntimeParameterValueTypeMap[T][], id: IntValue): RuntimeReturnValueTypeMap[T] {
    const genericType = matchTypes(
      [
        'float',
        'int',
        'bool',
        'config_id',
        'entity',
        'faction',
        'guid',
        'prefab_id',
        'str',
        'vec3'
      ],
      list
    )
    const listObj = parseValue(list, `${genericType}_list`)
    const idObj = parseValue(id, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_corresponding_value_from_list',
      args: [listObj, idObj]
    })
    const ret = new ValueClassMap[genericType]()
    ret.markPin(ref, 'value', 0)
    return ret as unknown as RuntimeReturnValueTypeMap[T]
  }

  /**
   * 리스트의 길이(요소 개수)를 반환한다
   *
   * @param list 리스트
   * @returns 길이
   */
  getListLength(list: FloatValue[]): bigint
  getListLength(list: IntValue[]): bigint
  getListLength(list: BoolValue[]): bigint
  getListLength(list: ConfigIdValue[]): bigint
  getListLength(list: EntityValue[]): bigint
  getListLength(list: FactionValue[]): bigint
  getListLength(list: GuidValue[]): bigint
  getListLength(list: PrefabIdValue[]): bigint
  getListLength(list: StrValue[]): bigint
  getListLength(list: Vec3Value[]): bigint
  getListLength<
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
  >(list: RuntimeParameterValueTypeMap[T][]): bigint {
    const genericType = matchTypes(
      [
        'float',
        'int',
        'bool',
        'config_id',
        'entity',
        'faction',
        'guid',
        'prefab_id',
        'str',
        'vec3'
      ],
      list
    )
    const listObj = parseValue(list, `${genericType}_list`)
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_list_length',
      args: [listObj]
    })
    const ret = new int()
    ret.markPin(ref, 'length', 0)
    return ret as unknown as bigint
  }

  /**
   * 부동소수점 또는 정수 리스트에만 적용된다. 리스트의 최댓값을 반환한다
   *
   * @param list 리스트
   * @returns 최댓값
   */
  getMaximumValueFromList(list: FloatValue[]): number
  getMaximumValueFromList(list: IntValue[]): bigint
  getMaximumValueFromList<T extends 'float' | 'int'>(
    list: RuntimeParameterValueTypeMap[T][]
  ): RuntimeReturnValueTypeMap[T] {
    const genericType = matchTypes(['float', 'int'], list)
    const listObj = parseValue(list, `${genericType}_list`)
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_maximum_value_from_list',
      args: [listObj]
    })
    const ret = new ValueClassMap[genericType]()
    ret.markPin(ref, 'maximumValue', 0)
    return ret as unknown as RuntimeReturnValueTypeMap[T]
  }

  /**
   * 부동소수점 또는 정수 리스트에만 적용된다. 리스트의 최솟값을 반환한다
   *
   * @param list 리스트
   * @returns 최솟값
   */
  getMinimumValueFromList(list: FloatValue[]): number
  getMinimumValueFromList(list: IntValue[]): bigint
  getMinimumValueFromList<T extends 'float' | 'int'>(
    list: RuntimeParameterValueTypeMap[T][]
  ): RuntimeReturnValueTypeMap[T] {
    const genericType = matchTypes(['float', 'int'], list)
    const listObj = parseValue(list, `${genericType}_list`)
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_minimum_value_from_list',
      args: [listObj]
    })
    const ret = new ValueClassMap[genericType]()
    ret.markPin(ref, 'minimumValue', 0)
    return ret as unknown as RuntimeReturnValueTypeMap[T]
  }

  /**
   * 리스트에 지정한 값이 포함되어 있는지 여부를 반환한다
   *
   * @param list 리스트
   * @param value 값
   * @returns 포함 여부
   */
  listIncludesThisValue(list: FloatValue[], value: FloatValue): boolean
  listIncludesThisValue(list: IntValue[], value: IntValue): boolean
  listIncludesThisValue(list: BoolValue[], value: BoolValue): boolean
  listIncludesThisValue(list: ConfigIdValue[], value: ConfigIdValue): boolean
  listIncludesThisValue(list: EntityValue[], value: EntityValue): boolean
  listIncludesThisValue(list: FactionValue[], value: FactionValue): boolean
  listIncludesThisValue(list: GuidValue[], value: GuidValue): boolean
  listIncludesThisValue(list: PrefabIdValue[], value: PrefabIdValue): boolean
  listIncludesThisValue(list: StrValue[], value: StrValue): boolean
  listIncludesThisValue(list: Vec3Value[], value: Vec3Value): boolean
  listIncludesThisValue<
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
  >(list: RuntimeParameterValueTypeMap[T][], value: RuntimeParameterValueTypeMap[T]): boolean {
    const genericType = matchTypes(
      [
        'float',
        'int',
        'bool',
        'config_id',
        'entity',
        'faction',
        'guid',
        'prefab_id',
        'str',
        'vec3'
      ],
      list,
      value
    )
    const listObj = parseValue(list, `${genericType}_list`)
    const valueObj = parseValue(value, genericType)
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'list_includes_this_value',
      args: [listObj, valueObj]
    })
    const ret = new bool()
    ret.markPin(ref, 'include', 0)
    return ret as unknown as boolean
  }

  /**
   * 대상 엔티티의 지정된 프리셋 상태 값을 반환한다. 해당 프리셋 상태가 없으면 0을 반환한다
   *
   * @param targetEntity 대상 엔티티
   * @param presetStatusIndex 프리셋 상태 인덱스
   * @returns 프리셋 상태 값
   */
  getPresetStatus(targetEntity: EntityValue, presetStatusIndex: IntValue): bigint {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const presetStatusIndexObj = parseValue(presetStatusIndex, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_preset_status',
      args: [targetEntityObj, presetStatusIndexObj]
    })
    const ret = new int()
    ret.markPin(ref, 'presetStatusValue', 0)
    return ret as unknown as bigint
  }

  /**
   * 지정된 복잡 피조물의 프리셋 상태 값을 반환한다
   *
   * @param targetEntity 대상 엔티티
   * @param presetStatusIndex 프리셋 상태 인덱스
   * @returns 프리셋 상태 값
   */
  getThePresetStatusValueOfTheComplexCreation(
    targetEntity: CreationEntity,
    presetStatusIndex: IntValue
  ): bigint {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const presetStatusIndexObj = parseValue(presetStatusIndex, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_the_preset_status_value_of_the_complex_creation',
      args: [targetEntityObj, presetStatusIndexObj]
    })
    const ret = new int()
    ret.markPin(ref, 'presetStatusValue', 0)
    return ret as unknown as bigint
  }

  /**
   * 캐릭터가 [이동 속도 모니터링] 유닛 상태 효과를 보유하고 있을 때만 조회할 수 있다
   *
   * GSTS 참고: 획득되는 속도는 기대 속도가 아닌 실제 운동 속도이며, 실제로 막혔을 때는 운동 중이라도 0이 된다
   *
   * @param characterEntity 캐릭터 엔티티
   */
  queryCharacterSCurrentMovementSpd(characterEntity: CharacterEntity): {
    /** 현재 속도 */
    currentSpeed: number
    /** 속도 벡터 */
    velocityVector: vec3
  } {
    const characterEntityObj = parseValue(characterEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_character_s_current_movement_spd',
      args: [characterEntityObj]
    })
    return {
      currentSpeed: (() => {
        const ret = new float()
        ret.markPin(ref, 'currentSpeed', 0)
        return ret as unknown as number
      })(),
      velocityVector: (() => {
        const ret = new vec3()
        ret.markPin(ref, 'velocityVector', 1)
        return ret as unknown as vec3
      })()
    }
  }

  /**
   * 지정된 엔티티가 필드에 존재하는지 조회한다. 캐릭터 엔티티는 다운 상태여도 여전히 존재하는 것으로 간주된다
   *
   * @param targetEntity 대상 엔티티
   * @returns 필드 존재 여부
   */
  queryIfEntityIsOnTheField(targetEntity: EntityValue): boolean {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_if_entity_is_on_the_field',
      args: [targetEntityObj]
    })
    const ret = new bool()
    ret.markPin(ref, 'onTheField', 0)
    return ret as unknown as boolean
  }

  /**
   * 현재 씬에 있는 모든 엔티티를 반환한다. 엔티티 리스트의 수가 많을 수 있다
   *
   * @returns 엔티티 리스트
   */
  getAllEntitiesOnTheField(): entity[] {
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_all_entities_on_the_field',
      args: []
    })
    const ret = new list('entity')
    ret.markPin(ref, 'entityList', 0)
    return ret as unknown as entity[]
  }

  /**
   * 현재 씬에 있는 지정된 타입의 모든 엔티티를 반환한다. 엔티티 리스트의 수가 많을 수 있다
   *
   * @param entityType 엔티티 타입: 스테이지, 오브젝트, 플레이어, 캐릭터, 피조물로 구분된다
   * @returns 엔티티 리스트
   */
  getSpecifiedTypeOfEntitiesOnTheField(entityType: EntityType): entity[] {
    const entityTypeObj = parseValue(entityType, 'enumeration')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_specified_type_of_entities_on_the_field',
      args: [entityTypeObj]
    })
    const ret = new list('entity')
    ret.markPin(ref, 'entityList', 0)
    return ret as unknown as entity[]
  }

  /**
   * 현재 씬에서 지정된 프리팹 ID로 생성된 모든 엔티티를 반환한다
   *
   * @param prefabId 프리팹 ID
   * @returns 엔티티 리스트
   */
  getEntitiesWithSpecifiedPrefabOnTheField(prefabId: PrefabIdValue): entity[] {
    const prefabIdObj = parseValue(prefabId, 'prefab_id')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_entities_with_specified_prefab_on_the_field',
      args: [prefabIdObj]
    })
    const ret = new list('entity')
    ret.markPin(ref, 'entityList', 0)
    return ret as unknown as entity[]
  }

  /**
   * 캐릭터 엔티티의 기본 속성을 반환한다
   *
   * @param targetEntity 대상 엔티티
   */
  getCharacterAttribute(targetEntity: CharacterEntity): {
    /** 레벨 */
    level: bigint
    /** 현재 HP */
    currentHp: number
    /** 최대 HP */
    maxHp: number
    /** 현재 공격력 */
    currentAtk: number
    /** 기본 공격력 */
    baseAtk: number
    /** 현재 방어력 */
    currentDef: number
    /** 기본 방어력 */
    baseDef: number
    /** 경직 수치 상한 */
    interruptValueThreshold: number
    /** 현재 경직 수치 */
    currentInterruptValue: number
    /** 현재 경직 상태 */
    currentInterruptStatus: InterruptStatus
  } {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_character_attribute',
      args: [targetEntityObj]
    })
    return {
      level: (() => {
        const ret = new int()
        ret.markPin(ref, 'level', 0)
        return ret as unknown as bigint
      })(),
      currentHp: (() => {
        const ret = new float()
        ret.markPin(ref, 'currentHp', 1)
        return ret as unknown as number
      })(),
      maxHp: (() => {
        const ret = new float()
        ret.markPin(ref, 'maxHp', 2)
        return ret as unknown as number
      })(),
      currentAtk: (() => {
        const ret = new float()
        ret.markPin(ref, 'currentAtk', 3)
        return ret as unknown as number
      })(),
      baseAtk: (() => {
        const ret = new float()
        ret.markPin(ref, 'baseAtk', 4)
        return ret as unknown as number
      })(),
      currentDef: (() => {
        const ret = new float()
        ret.markPin(ref, 'currentDef', 5)
        return ret as unknown as number
      })(),
      baseDef: (() => {
        const ret = new float()
        ret.markPin(ref, 'baseDef', 6)
        return ret as unknown as number
      })(),
      interruptValueThreshold: (() => {
        const ret = new float()
        ret.markPin(ref, 'interruptValueThreshold', 7)
        return ret as unknown as number
      })(),
      currentInterruptValue: (() => {
        const ret = new float()
        ret.markPin(ref, 'currentInterruptValue', 8)
        return ret as unknown as number
      })(),
      currentInterruptStatus: (() => {
        const ret = new enumeration('InterruptStatus')
        ret.markPin(ref, 'currentInterruptStatus', 9)
        return ret as unknown as InterruptStatus
      })()
    }
  }

  /**
   * 엔티티의 고급 속성을 반환한다
   *
   * @param targetEntity 대상 엔티티
   */
  getEntityAdvancedAttribute(targetEntity: EntityValue): {
    /** 치명타 확률 */
    critRate: number
    /** 치명타 피해 */
    critDmg: number
    /** 치유 보너스 */
    healingBonus: number
    /** 받는 치유 보너스 */
    incomingHealingBonus: number
    /** 원소 충전 효율 */
    energyRecharge: number
    /** 쿨다운 감소 */
    cdReduction: number
    /** 보호막 강화 */
    shieldStrength: number
  } {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_entity_advanced_attribute',
      args: [targetEntityObj]
    })
    return {
      critRate: (() => {
        const ret = new float()
        ret.markPin(ref, 'critRate', 0)
        return ret as unknown as number
      })(),
      critDmg: (() => {
        const ret = new float()
        ret.markPin(ref, 'critDmg', 1)
        return ret as unknown as number
      })(),
      healingBonus: (() => {
        const ret = new float()
        ret.markPin(ref, 'healingBonus', 2)
        return ret as unknown as number
      })(),
      incomingHealingBonus: (() => {
        const ret = new float()
        ret.markPin(ref, 'incomingHealingBonus', 3)
        return ret as unknown as number
      })(),
      energyRecharge: (() => {
        const ret = new float()
        ret.markPin(ref, 'energyRecharge', 4)
        return ret as unknown as number
      })(),
      cdReduction: (() => {
        const ret = new float()
        ret.markPin(ref, 'cdReduction', 5)
        return ret as unknown as number
      })(),
      shieldStrength: (() => {
        const ret = new float()
        ret.markPin(ref, 'shieldStrength', 6)
        return ret as unknown as number
      })()
    }
  }

  /**
   * 대상 엔티티의 엔티티 타입을 반환한다
   *
   * @param targetEntity 대상 엔티티
   * @returns 엔티티 타입: 플레이어, 캐릭터, 스테이지, 오브젝트, 피조물 중 하나
   */
  getEntityType(targetEntity: EntityValue): EntityType {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_entity_type',
      args: [targetEntityObj]
    })
    const ret = new enumeration('EntityType')
    ret.markPin(ref, 'entityType', 0)
    return ret as unknown as EntityType
  }

  /**
   * 대상 엔티티의 위치와 회전을 반환한다. 플레이어 엔티티 및 스테이지 엔티티에는 적용되지 않는다
   *
   * @param targetEntity 대상 엔티티
   */
  getEntityLocationAndRotation(targetEntity: EntityOf<'character' | 'object' | 'creation'>): {
    /** 위치 */
    location: vec3
    /** 회전 */
    rotate: vec3
  } {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_entity_location_and_rotation',
      args: [targetEntityObj]
    })
    return {
      location: (() => {
        const ret = new vec3()
        ret.markPin(ref, 'location', 0)
        return ret as unknown as vec3
      })(),
      rotate: (() => {
        const ret = new vec3()
        ret.markPin(ref, 'rotate', 1)
        return ret as unknown as vec3
      })()
    }
  }

  /**
   * 지정된 엔티티의 전방 벡터를 반환한다 (엔티티 로컬 좌표계의 Z축 양의 방향)
   *
   * @param targetEntity 대상 엔티티
   * @returns 전방 벡터
   */
  getEntityForwardVector(targetEntity: EntityValue): vec3 {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_entity_forward_vector',
      args: [targetEntityObj]
    })
    const ret = new vec3()
    ret.markPin(ref, 'forwardVector', 0)
    return ret as unknown as vec3
  }

  /**
   * 지정된 엔티티의 상향 벡터를 반환한다 (엔티티 로컬 좌표계의 Y축 양의 방향)
   *
   * @param targetEntity 대상 엔티티
   * @returns 상향 벡터
   */
  getEntityUpwardVector(targetEntity: EntityValue): vec3 {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_entity_upward_vector',
      args: [targetEntityObj]
    })
    const ret = new vec3()
    ret.markPin(ref, 'upwardVector', 0)
    return ret as unknown as vec3
  }

  /**
   * 지정된 엔티티의 우측 벡터를 반환한다 (엔티티 로컬 좌표계의 X축 양의 방향)
   *
   * @param targetEntity 대상 엔티티
   * @returns 우측 벡터
   */
  getEntityRightVector(targetEntity: EntityValue): vec3 {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_entity_right_vector',
      args: [targetEntityObj]
    })
    const ret = new vec3()
    ret.markPin(ref, 'rightVector', 0)
    return ret as unknown as vec3
  }

  /**
   * 대상 엔티티가 소유한 모든 엔티티의 리스트를 반환한다
   *
   * @param targetEntity 대상 엔티티
   * @returns 엔티티 리스트
   */
  getListOfEntitiesOwnedByTheEntity(targetEntity: EntityValue): entity[] {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_list_of_entities_owned_by_the_entity',
      args: [targetEntityObj]
    })
    const ret = new list('entity')
    ret.markPin(ref, 'entityList', 0)
    return ret as unknown as entity[]
  }

  /**
   * 대상 엔티티의 원소 관련 속성을 반환한다
   *
   * @param targetEntity 대상 엔티티
   */
  getEntityElementalAttribute(targetEntity: EntityValue): {
    /** 불 원소 피해 보너스 */
    pyroDmgBonus: number
    /** 불 원소 저항 */
    pyroRes: number
    /** 물 원소 피해 보너스 */
    hydroDmgBonus: number
    /** 물 원소 저항 */
    hydroRes: number
    /** 풀 원소 피해 보너스 */
    dendroDmgBonus: number
    /** 풀 원소 저항 */
    dendroRes: number
    /** 번개 원소 피해 보너스 */
    electroDmgBonus: number
    /** 번개 원소 저항 */
    electroRes: number
    /** 바람 원소 피해 보너스 */
    anemoDmgBonus: number
    /** 바람 원소 저항 */
    anemoRes: number
    /** 얼음 원소 피해 보너스 */
    cryoDmgBonus: number
    /** 얼음 원소 저항 */
    cryoRes: number
    /** 바위 원소 피해 보너스 */
    geoDmgBonus: number
    /** 바위 원소 저항 */
    geoRes: number
    /** 물리 피해 보너스 */
    physicalDmgBonus: number
    /** 물리 저항 */
    physicalRes: number
  } {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_entity_elemental_attribute',
      args: [targetEntityObj]
    })
    return {
      pyroDmgBonus: (() => {
        const ret = new float()
        ret.markPin(ref, 'pyroDmgBonus', 0)
        return ret as unknown as number
      })(),
      pyroRes: (() => {
        const ret = new float()
        ret.markPin(ref, 'pyroRes', 1)
        return ret as unknown as number
      })(),
      hydroDmgBonus: (() => {
        const ret = new float()
        ret.markPin(ref, 'hydroDmgBonus', 2)
        return ret as unknown as number
      })(),
      hydroRes: (() => {
        const ret = new float()
        ret.markPin(ref, 'hydroRes', 3)
        return ret as unknown as number
      })(),
      dendroDmgBonus: (() => {
        const ret = new float()
        ret.markPin(ref, 'dendroDmgBonus', 4)
        return ret as unknown as number
      })(),
      dendroRes: (() => {
        const ret = new float()
        ret.markPin(ref, 'dendroRes', 5)
        return ret as unknown as number
      })(),
      electroDmgBonus: (() => {
        const ret = new float()
        ret.markPin(ref, 'electroDmgBonus', 6)
        return ret as unknown as number
      })(),
      electroRes: (() => {
        const ret = new float()
        ret.markPin(ref, 'electroRes', 7)
        return ret as unknown as number
      })(),
      anemoDmgBonus: (() => {
        const ret = new float()
        ret.markPin(ref, 'anemoDmgBonus', 8)
        return ret as unknown as number
      })(),
      anemoRes: (() => {
        const ret = new float()
        ret.markPin(ref, 'anemoRes', 9)
        return ret as unknown as number
      })(),
      cryoDmgBonus: (() => {
        const ret = new float()
        ret.markPin(ref, 'cryoDmgBonus', 10)
        return ret as unknown as number
      })(),
      cryoRes: (() => {
        const ret = new float()
        ret.markPin(ref, 'cryoRes', 11)
        return ret as unknown as number
      })(),
      geoDmgBonus: (() => {
        const ret = new float()
        ret.markPin(ref, 'geoDmgBonus', 12)
        return ret as unknown as number
      })(),
      geoRes: (() => {
        const ret = new float()
        ret.markPin(ref, 'geoRes', 13)
        return ret as unknown as number
      })(),
      physicalDmgBonus: (() => {
        const ret = new float()
        ret.markPin(ref, 'physicalDmgBonus', 14)
        return ret as unknown as number
      })(),
      physicalRes: (() => {
        const ret = new float()
        ret.markPin(ref, 'physicalRes', 15)
        return ret as unknown as number
      })()
    }
  }

  /**
   * 엔티티의 원소 부착 상태를 확인한다
   *
   * @param targetEntity 대상 엔티티
   */
  checkEntitySElementalEffectStatus(targetEntity: EntityValue): {
    /** 물 원소 부착 여부 */
    affectedByHydro: boolean
    /** 얼음 원소 부착 여부 */
    affectedByCryo: boolean
    /** 번개 원소 부착 여부 */
    affectedByElectro: boolean
    /** 불 원소 부착 여부 */
    affectedByPyro: boolean
    /** 풀 원소 부착 여부 */
    affectedByDendro: boolean
    /** 바람 원소 부착 여부 */
    affectedByAnemo: boolean
    /** 바위 원소 부착 여부 */
    affectedByGeo: boolean
    /** 빙결 상태 여부 */
    affectedByFrozen: boolean
    /** 감전 상태 여부 (월감전 제외) */
    affectedByElectroCharged: boolean
    /** 연소 상태 여부 */
    affectedByBurning: boolean
    /** 석화 상태 여부 */
    affectedByPetrification: boolean
    /** 격화 상태 여부 */
    affectedByCatalyze: boolean
  } {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'check_entity_s_elemental_effect_status',
      args: [targetEntityObj]
    })
    return {
      affectedByHydro: (() => {
        const ret = new bool()
        ret.markPin(ref, 'affectedByHydro', 0)
        return ret as unknown as boolean
      })(),
      affectedByCryo: (() => {
        const ret = new bool()
        ret.markPin(ref, 'affectedByCryo', 1)
        return ret as unknown as boolean
      })(),
      affectedByElectro: (() => {
        const ret = new bool()
        ret.markPin(ref, 'affectedByElectro', 2)
        return ret as unknown as boolean
      })(),
      affectedByPyro: (() => {
        const ret = new bool()
        ret.markPin(ref, 'affectedByPyro', 3)
        return ret as unknown as boolean
      })(),
      affectedByDendro: (() => {
        const ret = new bool()
        ret.markPin(ref, 'affectedByDendro', 4)
        return ret as unknown as boolean
      })(),
      affectedByAnemo: (() => {
        const ret = new bool()
        ret.markPin(ref, 'affectedByAnemo', 5)
        return ret as unknown as boolean
      })(),
      affectedByGeo: (() => {
        const ret = new bool()
        ret.markPin(ref, 'affectedByGeo', 6)
        return ret as unknown as boolean
      })(),
      affectedByFrozen: (() => {
        const ret = new bool()
        ret.markPin(ref, 'affectedByFrozen', 7)
        return ret as unknown as boolean
      })(),
      affectedByElectroCharged: (() => {
        const ret = new bool()
        ret.markPin(ref, 'affectedByElectroCharged', 8)
        return ret as unknown as boolean
      })(),
      affectedByBurning: (() => {
        const ret = new bool()
        ret.markPin(ref, 'affectedByBurning', 9)
        return ret as unknown as boolean
      })(),
      affectedByPetrification: (() => {
        const ret = new bool()
        ret.markPin(ref, 'affectedByPetrification', 10)
        return ret as unknown as boolean
      })(),
      affectedByCatalyze: (() => {
        const ret = new bool()
        ret.markPin(ref, 'affectedByCatalyze', 11)
        return ret as unknown as boolean
      })()
    }
  }

  /**
   * 오브젝트의 기본 속성을 반환한다
   *
   * @param objectEntity 오브젝트 엔티티
   */
  getObjectAttribute(objectEntity: ObjectEntity): {
    /** 레벨 */
    level: bigint
    /** 현재 HP */
    currentHp: number
    /** 최대 HP */
    maxHp: number
    /** 현재 공격력 */
    currentAtk: number
    /** 기본 공격력 */
    baseAtk: number
    /** 현재 방어력 */
    currentDef: number
    /** 기본 방어력 */
    baseDef: number
  } {
    const objectEntityObj = parseValue(objectEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_object_attribute',
      args: [objectEntityObj]
    })
    return {
      level: (() => {
        const ret = new int()
        ret.markPin(ref, 'level', 0)
        return ret as unknown as bigint
      })(),
      currentHp: (() => {
        const ret = new float()
        ret.markPin(ref, 'currentHp', 1)
        return ret as unknown as number
      })(),
      maxHp: (() => {
        const ret = new float()
        ret.markPin(ref, 'maxHp', 2)
        return ret as unknown as number
      })(),
      currentAtk: (() => {
        const ret = new float()
        ret.markPin(ref, 'currentAtk', 3)
        return ret as unknown as number
      })(),
      baseAtk: (() => {
        const ret = new float()
        ret.markPin(ref, 'baseAtk', 4)
        return ret as unknown as number
      })(),
      currentDef: (() => {
        const ret = new float()
        ret.markPin(ref, 'currentDef', 5)
        return ret as unknown as number
      })(),
      baseDef: (() => {
        const ret = new float()
        ret.markPin(ref, 'baseDef', 6)
        return ret as unknown as number
      })()
    }
  }

  /**
   * 지정된 대상 엔티티의 소유자 엔티티를 반환한다
   *
   * @param targetEntity 대상 엔티티
   * @returns 소유자 엔티티
   */
  getOwnerEntity(targetEntity: EntityValue): entity {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_owner_entity',
      args: [targetEntityObj]
    })
    const ret = new entity()
    ret.markPin(ref, 'ownerEntity', 0)
    return ret as unknown as entity
  }

  /**
   * 대상 엔티티 리스트에서 지정된 구형 범위 내에 있는 엔티티 리스트를 반환한다
   *
   * @param targetEntityList 대상 엔티티 리스트
   * @param centerPoint 중심점
   * @param radius 반경
   * @returns 결과 리스트
   */
  getEntityListBySpecifiedRange(
    targetEntityList: EntityValue[],
    centerPoint: Vec3Value,
    radius: FloatValue
  ): entity[] {
    const targetEntityListObj = parseValue(targetEntityList, 'entity_list')
    const centerPointObj = parseValue(centerPoint, 'vec3')
    const radiusObj = parseValue(radius, 'float')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_entity_list_by_specified_range',
      args: [targetEntityListObj, centerPointObj, radiusObj]
    })
    const ret = new list('entity')
    ret.markPin(ref, 'resultList', 0)
    return ret as unknown as entity[]
  }

  /**
   * 대상 엔티티 리스트에서 지정된 타입의 엔티티 리스트를 반환한다
   *
   * @param targetEntityList 대상 엔티티 리스트
   * @param entityType 엔티티 타입: 플레이어, 캐릭터, 스테이지, 오브젝트, 피조물 중 하나
   * @returns 결과 리스트
   */
  getEntityListBySpecifiedType(targetEntityList: EntityValue[], entityType: EntityType): entity[] {
    const targetEntityListObj = parseValue(targetEntityList, 'entity_list')
    const entityTypeObj = parseValue(entityType, 'enumeration')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_entity_list_by_specified_type',
      args: [targetEntityListObj, entityTypeObj]
    })
    const ret = new list('entity')
    ret.markPin(ref, 'resultList', 0)
    return ret as unknown as entity[]
  }

  /**
   * 대상 엔티티 리스트에서 지정된 프리팹 ID로 생성된 엔티티 리스트를 반환한다
   *
   * @param targetEntityList 대상 엔티티 리스트
   * @param prefabId 프리팹 ID
   * @returns 결과 리스트
   */
  getEntityListBySpecifiedPrefabId(
    targetEntityList: EntityValue[],
    prefabId: PrefabIdValue
  ): entity[] {
    const targetEntityListObj = parseValue(targetEntityList, 'entity_list')
    const prefabIdObj = parseValue(prefabId, 'prefab_id')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_entity_list_by_specified_prefab_id',
      args: [targetEntityListObj, prefabIdObj]
    })
    const ret = new list('entity')
    ret.markPin(ref, 'resultList', 0)
    return ret as unknown as entity[]
  }

  /**
   * 대상 엔티티 리스트에서 특정 진영에 속한 엔티티 리스트를 반환한다
   *
   * @param targetEntityList 대상 엔티티 리스트
   * @param faction 진영
   * @returns 결과 리스트
   */
  getEntityListBySpecifiedFaction(
    targetEntityList: EntityValue[],
    faction: FactionValue
  ): entity[] {
    const targetEntityListObj = parseValue(targetEntityList, 'entity_list')
    const factionObj = parseValue(faction, 'faction')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_entity_list_by_specified_faction',
      args: [targetEntityListObj, factionObj]
    })
    const ret = new list('entity')
    ret.markPin(ref, 'resultList', 0)
    return ret as unknown as entity[]
  }

  /**
   * 이 노드 그래프와 연결된 엔티티를 반환한다
   *
   * @returns 자신 엔티티
   */
  getSelfEntity(): entity {
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_self_entity',
      args: []
    })
    const ret = new entity()
    ret.markPin(ref, 'selfEntity', 0)
    return ret as unknown as entity
  }

  /**
   * 지정된 엔티티의 GUID를 조회한다
   *
   * @param entity 엔티티
   * @returns GUID
   */
  queryGuidByEntity(entity: EntityValue): guid {
    const entityObj = parseValue(entity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_guid_by_entity',
      args: [entityObj]
    })
    const ret = new guid()
    ret.markPin(ref, 'guid', 0)
    return ret as unknown as guid
  }

  /**
   * GUID로 엔티티를 검색한다
   *
   * @param guid GUID
   * @returns 엔티티
   */
  queryEntityByGuid(guid: GuidValue): entity {
    const guidObj = parseValue(guid, 'guid')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_entity_by_guid',
      args: [guidObj]
    })
    const ret = new entity()
    ret.markPin(ref, 'entity', 0)
    return ret as unknown as entity
  }

  /**
   * 현재 환경 시간을 조회한다. 범위는 [0, 24)
   */
  queryCurrentEnvironmentTime(): {
    /**
     * 현재 환경 시간: 값 범위는 [0, 24)
     */
    currentEnvironmentTime: number
    /**
     * 현재 루프 일수: 현재까지 몇 일이 경과했는지
     */
    currentLoopDay: bigint
  } {
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_current_environment_time',
      args: []
    })
    return {
      currentEnvironmentTime: (() => {
        const ret = new float()
        ret.markPin(ref, 'currentEnvironmentTime', 0)
        return ret as unknown as number
      })(),
      currentLoopDay: (() => {
        const ret = new int()
        ret.markPin(ref, 'currentLoopDay', 1)
        return ret as unknown as bigint
      })()
    }
  }

  /**
   * 게임이 진행된 시간을 조회한다. 단위는 초
   *
   * @returns 게임 경과 시간
   */
  queryGameTimeElapsed(): bigint {
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_game_time_elapsed',
      args: []
    })
    const ret = new int()
    ret.markPin(ref, 'gameTimeElapsed', 0)
    return ret as unknown as bigint
  }

  /**
   * 지정한 엔티티의 진영을 조회한다
   *
   * @param targetEntity 대상 엔티티
   * @returns 진영
   */
  queryEntityFaction(targetEntity: EntityValue): faction {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_entity_faction',
      args: [targetEntityObj]
    })
    const ret = new faction()
    ret.markPin(ref, 'faction', 0)
    return ret as unknown as faction
  }

  /**
   * 두 진영이 서로 적대 관계인지 조회한다
   *
   * @param faction1 진영 1
   * @param faction2 진영 2
   * @returns 적대 여부
   */
  queryIfFactionIsHostile(faction1: FactionValue, faction2: FactionValue): boolean {
    const faction1Obj = parseValue(faction1, 'faction')
    const faction2Obj = parseValue(faction2, 'faction')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_if_faction_is_hostile',
      args: [faction1Obj, faction2Obj]
    })
    const ret = new bool()
    ret.markPin(ref, 'hostile', 0)
    return ret as unknown as boolean
  }

  /**
   * 플레이어의 모든 캐릭터가 쓰러졌는지 확인한다
   *
   * @param playerEntity 플레이어 엔티티
   * @returns 결과
   */
  queryIfAllPlayerCharactersAreDown(playerEntity: PlayerEntity): boolean {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_if_all_player_characters_are_down',
      args: [playerEntityObj]
    })
    const ret = new bool()
    ret.markPin(ref, 'result', 0)
    return ret as unknown as boolean
  }

  /**
   * 플레이어 ID를 기반으로 플레이어 GUID를 반환한다. ID는 몇 번째 플레이어인지를 나타낸다
   *
   * GSTS 참고: ID는 1부터 시작한다
   *
   * @param playerId 플레이어 ID
   * @returns 플레이어 GUID
   */
  getPlayerGuidByPlayerId(playerId: IntValue): guid {
    const playerIdObj = parseValue(playerId, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_player_guid_by_player_id',
      args: [playerIdObj]
    })
    const ret = new guid()
    ret.markPin(ref, 'playerGuid', 0)
    return ret as unknown as guid
  }

  /**
   * 플레이어 GUID를 기반으로 플레이어 ID를 반환한다. ID는 몇 번째 플레이어인지를 나타낸다
   *
   * @param playerGuid 플레이어 GUID
   * @returns 플레이어 ID
   */
  getPlayerIdByPlayerGuid(playerGuid: GuidValue): bigint {
    const playerGuidObj = parseValue(playerGuid, 'guid')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_player_id_by_player_guid',
      args: [playerGuidObj]
    })
    const ret = new int()
    ret.markPin(ref, 'playerId', 0)
    return ret as unknown as bigint
  }

  /**
   * 플레이어의 클라이언트 입력 장치 타입을 반환한다. UI 매핑 방식에 따라 결정된다
   *
   * @param playerEntity 플레이어 엔티티
   * @returns 입력 장치 타입: 키보드/마우스, 게임패드, 터치스크린으로 구분됨
   */
  getPlayerClientInputDeviceType(playerEntity: PlayerEntity): InputDeviceType {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_player_client_input_device_type',
      args: [playerEntityObj]
    })
    const ret = new enumeration('InputDeviceType')
    ret.markPin(ref, 'inputDeviceType', 0)
    return ret as unknown as InputDeviceType
  }

  /**
   * 캐릭터 엔티티가 속한 플레이어 엔티티를 반환한다
   *
   * @param characterEntity 캐릭터 엔티티
   * @returns 소속 플레이어 엔티티
   */
  getPlayerEntityToWhichTheCharacterBelongs(characterEntity: CharacterEntity): PlayerEntity {
    const characterEntityObj = parseValue(characterEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_player_entity_to_which_the_character_belongs',
      args: [characterEntityObj]
    })
    const ret = new entity()
    ret.markPin(ref, 'affiliatedPlayerEntity', 0)
    return ret as unknown as PlayerEntity
  }

  /**
   * 지정한 플레이어 엔티티의 부활 소요 시간을 반환한다. 단위는 초
   *
   * @param playerEntity 플레이어 엔티티
   * @returns 소요 시간
   */
  getPlayerReviveTime(playerEntity: PlayerEntity): bigint {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_player_revive_time',
      args: [playerEntityObj]
    })
    const ret = new int()
    ret.markPin(ref, 'duration', 0)
    return ret as unknown as bigint
  }

  /**
   * 플레이어의 닉네임을 반환한다
   *
   * @param playerEntity 플레이어 엔티티
   * @returns 플레이어 닉네임
   */
  getPlayerNickname(playerEntity: PlayerEntity): string {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_player_nickname',
      args: [playerEntityObj]
    })
    const ret = new str()
    ret.markPin(ref, 'playerNickname', 0)
    return ret as unknown as string
  }

  /**
   * 지정한 플레이어 엔티티의 남은 부활 횟수를 반환한다
   *
   * @param playerEntity 플레이어 엔티티
   * @returns 남은 횟수
   */
  getPlayerRemainingRevives(playerEntity: PlayerEntity): bigint {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_player_remaining_revives',
      args: [playerEntityObj]
    })
    const ret = new int()
    ret.markPin(ref, 'remainingTimes', 0)
    return ret as unknown as bigint
  }

  /**
   * 현재 씬에 존재하는 모든 플레이어 엔티티 리스트를 반환한다
   *
   * @returns 플레이어 엔티티 리스트
   */
  getListOfPlayerEntitiesOnTheField(): PlayerEntity[] {
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_list_of_player_entities_on_the_field',
      args: []
    })
    const ret = new list('entity')
    ret.markPin(ref, 'playerEntityList', 0)
    return ret as unknown as PlayerEntity[]
  }

  /**
   * 지정한 플레이어 엔티티의 모든 캐릭터 엔티티 리스트를 반환한다
   *
   * @param playerEntity 플레이어 엔티티
   * @returns 캐릭터 엔티티 리스트
   */
  getAllCharacterEntitiesOfSpecifiedPlayer(playerEntity: PlayerEntity): CharacterEntity[] {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_all_character_entities_of_specified_player',
      args: [playerEntityObj]
    })
    const ret = new list('entity')
    ret.markPin(ref, 'characterEntityList', 0)
    return ret as unknown as CharacterEntity[]
  }

  /**
   * 클래식 모드 전용. 대상 캐릭터의 캐릭터 ID를 반환한다
   *
   * @param targetCharacter 대상 캐릭터
   * @returns 캐릭터 ID
   */
  checkClassicModeCharacterId(targetCharacter: CharacterEntity): bigint {
    const targetCharacterObj = parseValue(targetCharacter, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'check_classic_mode_character_id',
      args: [targetCharacterObj]
    })
    const ret = new int()
    ret.markPin(ref, 'characterId', 0)
    return ret as unknown as bigint
  }

  /**
   * 클래식 모드 전용. 플레이어 파티에서 현재 활성 캐릭터를 반환한다
   *
   * @param playerEntity 플레이어 엔티티
   * @returns 활성 캐릭터 엔티티
   */
  getActiveCharacterOfSpecifiedPlayer(playerEntity: PlayerEntity): CharacterEntity {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_active_character_of_specified_player',
      args: [playerEntityObj]
    })
    const ret = new entity()
    ret.markPin(ref, 'activeCharacterEntity', 0)
    return ret as unknown as CharacterEntity
  }

  /**
   * 팔로우 모션 장치의 대상을 반환한다. 대상 엔티티와 그 GUID를 얻을 수 있다
   *
   * @param targetEntity 대상 엔티티
   */
  getFollowMotionDeviceTarget(targetEntity: EntityValue): {
    /**
     * 팔로우 대상 엔티티
     */
    followTargetEntity: entity
    /**
     * 팔로우 대상 GUID
     */
    followTargetGuid: guid
  } {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_follow_motion_device_target',
      args: [targetEntityObj]
    })
    return {
      followTargetEntity: (() => {
        const ret = new entity()
        ret.markPin(ref, 'followTargetEntity', 0)
        return ret as unknown as entity
      })(),
      followTargetGuid: (() => {
        const ret = new guid()
        ret.markPin(ref, 'followTargetGuid', 1)
        return ret as unknown as guid
      })()
    }
  }

  /**
   * 대상 엔티티에 있는 지정한 글로벌 타이머의 현재 시간을 반환한다
   *
   * @param targetEntity 대상 엔티티
   * @param timerName 타이머 이름
   * @returns 현재 시간
   */
  getCurrentGlobalTimerTime(targetEntity: EntityValue, timerName: StrValue): number {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const timerNameObj = parseValue(timerName, 'str')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_current_global_timer_time',
      args: [targetEntityObj, timerNameObj]
    })
    const ret = new float()
    ret.markPin(ref, 'currentTime', 0)
    return ret as unknown as number
  }

  /**
   * 지정한 플레이어 엔티티에서 현재 활성화된 UI 레이아웃의 인덱스를 반환한다
   *
   * @param playerEntity 플레이어 엔티티
   * @returns 레이아웃 인덱스
   */
  getPlayerSCurrentUiLayout(playerEntity: PlayerEntity): bigint {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_player_s_current_ui_layout',
      args: [playerEntityObj]
    })
    const ret = new int()
    ret.markPin(ref, 'layoutIndex', 0)
    return ret as unknown as bigint
  }

  /**
   * 피조물의 현재 행동에 따라 대상 엔티티가 달라진다. 예를 들어 피조물이 적을 공격 중일 때는 적 엔티티가, 아군을 치유 중일 때는 아군 엔티티가 대상이 된다
   *
   * @param creationEntity 피조물 엔티티: 런타임 피조물 엔티티
   * @returns 대상 엔티티: 피조물이 현재 지능적으로 선택한 대상 엔티티
   */
  getCreationSCurrentTarget(creationEntity: CreationEntity): entity {
    const creationEntityObj = parseValue(creationEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_creation_s_current_target',
      args: [creationEntityObj]
    })
    const ret = new entity()
    ret.markPin(ref, 'targetEntity', 0)
    return ret as unknown as entity
  }

  /**
   * 클래식 모드의 어그로 리스트를 반환한다. 어그로 설정이 [기본 타입]일 때만 유효한 리스트를 출력한다
   *
   * @param creationEntity 피조물 엔티티: 런타임 피조물 엔티티
   * @returns 어그로 리스트: 피조물이 현재 어그로를 보유한 엔티티의 비정렬 리스트
   */
  getAggroListOfCreationInDefaultMode(creationEntity: CreationEntity): entity[] {
    const creationEntityObj = parseValue(creationEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_aggro_list_of_creation_in_default_mode',
      args: [creationEntityObj]
    })
    const ret = new list('entity')
    ret.markPin(ref, 'aggroList', 0)
    return ret as unknown as entity[]
  }

  /**
   * 지정한 피조물의 속성을 반환한다
   *
   * @param creationEntity 피조물 엔티티
   */
  getCreationAttribute(creationEntity: CreationEntity): {
    /**
     * 레벨
     */
    level: bigint
    /**
     * 현재 HP
     */
    currentHp: number
    /**
     * 최대 HP
     */
    maxHp: number
    /**
     * 현재 공격력
     */
    currentAtk: number
    /**
     * 기본 공격력
     */
    baseAtk: number
    /**
     * 경직 수치 상한
     */
    interruptValueThreshold: number
    /**
     * 현재 경직 수치
     */
    currentInterruptValue: number
    /**
     * 현재 경직 상태
     */
    currentInterruptStatus: InterruptStatus
  } {
    const creationEntityObj = parseValue(creationEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_creation_attribute',
      args: [creationEntityObj]
    })
    return {
      level: (() => {
        const ret = new int()
        ret.markPin(ref, 'level', 0)
        return ret as unknown as bigint
      })(),
      currentHp: (() => {
        const ret = new float()
        ret.markPin(ref, 'currentHp', 1)
        return ret as unknown as number
      })(),
      maxHp: (() => {
        const ret = new float()
        ret.markPin(ref, 'maxHp', 2)
        return ret as unknown as number
      })(),
      currentAtk: (() => {
        const ret = new float()
        ret.markPin(ref, 'currentAtk', 3)
        return ret as unknown as number
      })(),
      baseAtk: (() => {
        const ret = new float()
        ret.markPin(ref, 'baseAtk', 4)
        return ret as unknown as number
      })(),
      interruptValueThreshold: (() => {
        const ret = new float()
        ret.markPin(ref, 'interruptValueThreshold', 5)
        return ret as unknown as number
      })(),
      currentInterruptValue: (() => {
        const ret = new float()
        ret.markPin(ref, 'currentInterruptValue', 6)
        return ret as unknown as number
      })(),
      currentInterruptStatus: (() => {
        const ret = new enumeration('InterruptStatus')
        ret.markPin(ref, 'currentInterruptStatus', 7)
        return ret as unknown as InterruptStatus
      })()
    }
  }

  /**
   * 플레이어의 지정한 클래스 레벨을 조회한다
   *
   * @param playerEntity 플레이어 엔티티
   * @param classConfigId 클래스 설정 ID
   * @returns 레벨
   */
  queryPlayerClassLevel(playerEntity: PlayerEntity, classConfigId: ConfigIdValue): bigint {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const classConfigIdObj = parseValue(classConfigId, 'config_id')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_player_class_level',
      args: [playerEntityObj, classConfigIdObj]
    })
    const ret = new int()
    ret.markPin(ref, 'level', 0)
    return ret as unknown as bigint
  }

  /**
   * 플레이어의 현재 클래스를 조회한다. 해당 클래스의 설정 ID를 출력한다
   *
   * @param playerEntity 플레이어 엔티티
   * @returns 클래스 설정 ID
   */
  queryPlayerClass(playerEntity: PlayerEntity): configId {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_player_class',
      args: [playerEntityObj]
    })
    const ret = new configId()
    ret.markPin(ref, 'classConfigId', 0)
    return ret as unknown as configId
  }

  /**
   * 캐릭터의 지정한 슬롯에 있는 스킬을 조회한다. 해당 스킬의 설정 ID를 출력한다
   *
   * @param characterEntity 캐릭터 엔티티
   * @param characterSkillSlot 스킬 슬롯
   * @returns 스킬 설정 ID
   */
  queryCharacterSkill(
    characterEntity: CharacterEntity,
    characterSkillSlot: CharacterSkillSlot
  ): configId {
    const characterEntityObj = parseValue(characterEntity, 'entity')
    const characterSkillSlotObj = parseValue(characterSkillSlot, 'enumeration')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_character_skill',
      args: [characterEntityObj, characterSkillSlotObj]
    })
    const ret = new configId()
    ret.markPin(ref, 'skillConfigId', 0)
    return ret as unknown as configId
  }

  /**
   * 대상 엔티티에서 지정한 설정 ID를 가진 유닛 상태의 모든 슬롯 ID 리스트를 조회한다
   *
   * @param targetEntity 조회 대상 엔티티
   * @param unitStatusConfigId 유닛 상태 설정 ID
   * @returns 슬롯 ID 리스트
   */
  listOfSlotIdsQueryingUnitStatus(
    targetEntity: EntityValue,
    unitStatusConfigId: ConfigIdValue
  ): bigint[] {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const unitStatusConfigIdObj = parseValue(unitStatusConfigId, 'config_id')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'list_of_slot_ids_querying_unit_status',
      args: [targetEntityObj, unitStatusConfigIdObj]
    })
    const ret = new list('int')
    ret.markPin(ref, 'slotIndexList', 0)
    return ret as unknown as bigint[]
  }

  /**
   * 지정한 엔티티가 특정 설정 ID의 유닛 상태를 보유하고 있는지 조회한다
   *
   * @param targetEntity 대상 엔티티
   * @param unitStatusConfigId 유닛 상태 설정 ID
   * @returns 보유 여부
   */
  queryIfEntityHasUnitStatus(
    targetEntity: EntityValue,
    unitStatusConfigId: ConfigIdValue
  ): boolean {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const unitStatusConfigIdObj = parseValue(unitStatusConfigId, 'config_id')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_if_entity_has_unit_status',
      args: [targetEntityObj, unitStatusConfigIdObj]
    })
    const ret = new bool()
    ret.markPin(ref, 'has', 0)
    return ret as unknown as boolean
  }

  /**
   * 대상 엔티티의 지정한 슬롯에 있는 유닛 상태의 스택 수를 조회한다
   *
   * @param queryTargetEntity 조회 대상 엔티티
   * @param unitStatusConfigId 유닛 상태 설정 ID
   * @param slotId 슬롯 ID
   * @returns 스택 수
   */
  queryUnitStatusStacksBySlotId(
    queryTargetEntity: EntityValue,
    unitStatusConfigId: ConfigIdValue,
    slotId: IntValue
  ): bigint {
    const queryTargetEntityObj = parseValue(queryTargetEntity, 'entity')
    const unitStatusConfigIdObj = parseValue(unitStatusConfigId, 'config_id')
    const slotIdObj = parseValue(slotId, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_unit_status_stacks_by_slot_id',
      args: [queryTargetEntityObj, unitStatusConfigIdObj, slotIdObj]
    })
    const ret = new int()
    ret.markPin(ref, 'stacks', 0)
    return ret as unknown as bigint
  }

  /**
   * 대상 엔티티의 지정한 슬롯에 있는 유닛 상태의 적용자를 조회한다
   *
   * @param queryTargetEntity 조회 대상 엔티티
   * @param unitStatusConfigId 유닛 상태 설정 ID
   * @param slotId 슬롯 ID
   * @returns 적용자 엔티티
   */
  queryUnitStatusApplierBySlotId(
    queryTargetEntity: EntityValue,
    unitStatusConfigId: ConfigIdValue,
    slotId: IntValue
  ): entity {
    const queryTargetEntityObj = parseValue(queryTargetEntity, 'entity')
    const unitStatusConfigIdObj = parseValue(unitStatusConfigId, 'config_id')
    const slotIdObj = parseValue(slotId, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_unit_status_applier_by_slot_id',
      args: [queryTargetEntityObj, unitStatusConfigIdObj, slotIdObj]
    })
    const ret = new entity()
    ret.markPin(ref, 'applierEntity', 0)
    return ret as unknown as entity
  }

  /**
   * 씬에서 해당 유닛 태그를 가진 모든 엔티티 리스트를 반환한다
   *
   * @param unitTagIndex 유닛 태그 인덱스
   * @returns 엔티티 리스트
   */
  getEntityListByUnitTag(unitTagIndex: IntValue): entity[] {
    const unitTagIndexObj = parseValue(unitTagIndex, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_entity_list_by_unit_tag',
      args: [unitTagIndexObj]
    })
    const ret = new list('entity')
    ret.markPin(ref, 'entityList', 0)
    return ret as unknown as entity[]
  }

  /**
   * 대상 엔티티가 보유한 모든 유닛 태그 리스트를 반환한다
   *
   * @param targetEntity 대상 엔티티
   * @returns 유닛 태그 리스트
   */
  getEntityUnitTagList(targetEntity: EntityValue): bigint[] {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_entity_unit_tag_list',
      args: [targetEntityObj]
    })
    const ret = new list('int')
    ret.markPin(ref, 'unitTagList', 0)
    return ret as unknown as bigint[]
  }

  /**
   * 글로벌 어그로 전이 배율을 조회한다. [스테이지 설정]에서 구성할 수 있다
   *
   * @returns 글로벌 어그로 전이 배율
   */
  queryGlobalAggroTransferMultiplier(): number {
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_global_aggro_transfer_multiplier',
      args: []
    })
    const ret = new float()
    ret.markPin(ref, 'globalAggroTransferMultiplier', 0)
    return ret as unknown as number
  }

  /**
   * 지정한 엔티티의 어그로 배율을 조회한다
   *
   * @param queryTarget 조회 대상
   * @returns 어그로 배율
   */
  queryTheAggroMultiplierOfTheSpecifiedEntity(queryTarget: EntityValue): number {
    const queryTargetObj = parseValue(queryTarget, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_the_aggro_multiplier_of_the_specified_entity',
      args: [queryTargetObj]
    })
    const ret = new float()
    ret.markPin(ref, 'aggroMultiplier', 0)
    return ret as unknown as number
  }

  /**
   * 어그로 소유자에 대한 대상 엔티티의 어그로 수치를 조회한다
   *
   * @param queryTarget 조회 대상
   * @param aggroOwner 어그로 소유자
   * @returns 어그로 수치
   */
  queryTheAggroValueOfTheSpecifiedEntity(
    queryTarget: EntityValue,
    aggroOwner: EntityValue
  ): bigint {
    const queryTargetObj = parseValue(queryTarget, 'entity')
    const aggroOwnerObj = parseValue(aggroOwner, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_the_aggro_value_of_the_specified_entity',
      args: [queryTargetObj, aggroOwnerObj]
    })
    const ret = new int()
    ret.markPin(ref, 'aggroValue', 0)
    return ret as unknown as bigint
  }

  /**
   * 지정한 엔티티가 전투에 돌입했는지 조회한다
   *
   * @param queryTarget 조회 대상
   * @returns 전투 중 여부
   */
  queryIfSpecifiedEntityIsInCombat(queryTarget: EntityValue): boolean {
    const queryTargetObj = parseValue(queryTarget, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_if_specified_entity_is_in_combat',
      args: [queryTargetObj]
    })
    const ret = new bool()
    ret.markPin(ref, 'inCombat', 0)
    return ret as unknown as boolean
  }

  /**
   * 지정한 대상 엔티티를 어그로 리스트에 포함한 엔티티 목록을 조회한다
   *
   * @param queryTarget 조회 대상
   * @returns 어그로 소유자 리스트
   */
  getListOfOwnersWhoHaveTheTargetInTheirAggroList(queryTarget: EntityValue): entity[] {
    const queryTargetObj = parseValue(queryTarget, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_list_of_owners_who_have_the_target_in_their_aggro_list',
      args: [queryTargetObj]
    })
    const ret = new list('entity')
    ret.markPin(ref, 'aggroOwnerList', 0)
    return ret as unknown as entity[]
  }

  /**
   * 대상 엔티티를 어그로 목표로 삼고 있는 엔티티 목록을 조회한다
   *
   * @param targetEntity 대상 엔티티
   * @returns 어그로 소유자 리스트
   */
  getListOfOwnersThatHaveTheTargetAsTheirAggroTarget(targetEntity: EntityValue): entity[] {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_list_of_owners_that_have_the_target_as_their_aggro_target',
      args: [targetEntityObj]
    })
    const ret = new list('entity')
    ret.markPin(ref, 'aggroOwnerList', 0)
    return ret as unknown as entity[]
  }

  /**
   * 지정한 엔티티의 어그로 리스트를 반환한다
   *
   * @param targetEntity 대상 엔티티
   * @returns 어그로 리스트
   */
  getTheAggroListOfTheSpecifiedEntity(targetEntity: EntityValue): entity[] {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_the_aggro_list_of_the_specified_entity',
      args: [targetEntityObj]
    })
    const ret = new list('entity')
    ret.markPin(ref, 'aggroList', 0)
    return ret as unknown as entity[]
  }

  /**
   * 지정한 엔티티의 어그로 목표를 반환한다
   *
   * @param aggroOwner 어그로 소유자
   * @returns 어그로 목표
   */
  getTheAggroTargetOfTheSpecifiedEntity(aggroOwner: EntityValue): entity {
    const aggroOwnerObj = parseValue(aggroOwner, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_the_aggro_target_of_the_specified_entity',
      args: [aggroOwnerObj]
    })
    const ret = new entity()
    ret.markPin(ref, 'aggroTarget', 0)
    return ret as unknown as entity
  }

  /**
   * 글로벌 경로의 웨이포인트 수를 반환한다
   *
   * @param pathIndex 경로 인덱스
   * @returns 웨이포인트 수
   */
  getTheNumberOfWaypointsInTheGlobalPath(pathIndex: IntValue): bigint {
    const pathIndexObj = parseValue(pathIndex, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_the_number_of_waypoints_in_the_global_path',
      args: [pathIndexObj]
    })
    const ret = new int()
    ret.markPin(ref, 'numberOfWaypoints', 0)
    return ret as unknown as bigint
  }

  /**
   * 지정한 경로의 특정 웨이포인트 정보를 조회한다
   *
   * @param pathIndex 경로 인덱스
   * @param pathWaypointId 경로 웨이포인트 번호
   */
  getSpecifiedWaypointInfo(
    pathIndex: IntValue,
    pathWaypointId: IntValue
  ): {
    /** 웨이포인트 위치 */
    waypointLocation: vec3
    /** 웨이포인트 방향 */
    waypointOrientation: vec3
  } {
    const pathIndexObj = parseValue(pathIndex, 'int')
    const pathWaypointIdObj = parseValue(pathWaypointId, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_specified_waypoint_info',
      args: [pathIndexObj, pathWaypointIdObj]
    })
    return {
      waypointLocation: (() => {
        const ret = new vec3()
        ret.markPin(ref, 'waypointLocation', 0)
        return ret as unknown as vec3
      })(),
      waypointOrientation: (() => {
        const ret = new vec3()
        ret.markPin(ref, 'waypointOrientation', 1)
        return ret as unknown as vec3
      })()
    }
  }

  /**
   * 유닛 태그 ID로 해당 태그를 보유한 모든 프리셋 포인트 목록을 조회한다. 출력 값은 프리셋 포인트 인덱스다
   *
   * @param unitTagId 유닛 태그 인덱스
   * @returns 포인트 인덱스 리스트
   */
  getPresetPointListByUnitTag(unitTagId: IntValue): bigint[] {
    const unitTagIdObj = parseValue(unitTagId, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_preset_point_list_by_unit_tag',
      args: [unitTagIdObj]
    })
    const ret = new list('int')
    ret.markPin(ref, 'pointIndexList', 0)
    return ret as unknown as bigint[]
  }

  /**
   * 지정한 프리셋 포인트의 위치와 회전을 조회한다
   *
   * @param pointIndex 포인트 인덱스
   */
  queryPresetPointPositionRotation(pointIndex: IntValue): {
    /** 위치 */
    location: vec3
    /** 회전 */
    rotate: vec3
  } {
    const pointIndexObj = parseValue(pointIndex, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_preset_point_position_rotation',
      args: [pointIndexObj]
    })
    return {
      location: (() => {
        const ret = new vec3()
        ret.markPin(ref, 'location', 0)
        return ret as unknown as vec3
      })(),
      rotate: (() => {
        const ret = new vec3()
        ret.markPin(ref, 'rotate', 1)
        return ret as unknown as vec3
      })()
    }
  }

  /**
   * 플레이어 정산 성공 상태를 반환한다
   *
   * @param playerEntity 플레이어 엔티티
   * @returns 정산 상태: 미정, 승리, 패배
   */
  getPlayerSettlementSuccessStatus(playerEntity: PlayerEntity): SettlementStatus {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_player_settlement_success_status',
      args: [playerEntityObj]
    })
    const ret = new enumeration('SettlementStatus')
    ret.markPin(ref, 'settlementStatus', 0)
    return ret as unknown as SettlementStatus
  }

  /**
   * 지정한 플레이어 엔티티의 정산 순위 수치를 반환한다
   *
   * @param playerEntity 플레이어 엔티티
   * @returns 순위 수치
   */
  getPlayerSettlementRankingValue(playerEntity: PlayerEntity): bigint {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_player_settlement_ranking_value',
      args: [playerEntityObj]
    })
    const ret = new int()
    ret.markPin(ref, 'rankingValue', 0)
    return ret as unknown as bigint
  }

  /**
   * 진영 정산 성공 상태를 반환한다
   *
   * @param faction 진영
   * @returns 정산 상태: 미정, 승리, 패배
   */
  getFactionSettlementSuccessStatus(faction: FactionValue): SettlementStatus {
    const factionObj = parseValue(faction, 'faction')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_faction_settlement_success_status',
      args: [factionObj]
    })
    const ret = new enumeration('SettlementStatus')
    ret.markPin(ref, 'settlementStatus', 0)
    return ret as unknown as SettlementStatus
  }

  /**
   * 지정한 진영의 정산 순위 수치를 반환한다
   *
   * @param faction 진영
   * @returns 순위 수치
   */
  getFactionSettlementRankingValue(faction: FactionValue): bigint {
    const factionObj = parseValue(faction, 'faction')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_faction_settlement_ranking_value',
      args: [factionObj]
    })
    const ret = new int()
    ret.markPin(ref, 'rankingValue', 0)
    return ret as unknown as bigint
  }

  /**
   * 지정한 딕셔너리에 특정 키가 포함되어 있는지 조회한다
   *
   * @param dictionary 딕셔너리
   * @param key 키
   * @returns 포함 여부
   */
  queryIfDictionaryContainsSpecificKey<K extends DictKeyType, V extends DictValueType>(
    dictionary: dict<K, V>,
    key: RuntimeParameterValueTypeMap[K]
  ): boolean {
    const dictionaryObj = parseValue(dictionary, 'dict')
    const keyObj = parseValue(key, dictionaryObj.getKeyType())
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_if_dictionary_contains_specific_key',
      args: [dictionaryObj, keyObj]
    })
    const ret = new bool()
    ret.markPin(ref, 'include', 0)
    return ret as unknown as boolean
  }

  /**
   * 딕셔너리의 키-값 쌍 수를 조회한다
   *
   * @param dictionary 딕셔너리
   * @returns 길이
   */
  queryDictionarySLength<K extends DictKeyType, V extends DictValueType>(
    dictionary: dict<K, V>
  ): bigint {
    const dictionaryObj = parseValue(dictionary, 'dict')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_dictionary_s_length',
      args: [dictionaryObj]
    })
    const ret = new int()
    ret.markPin(ref, 'length', 0)
    return ret as unknown as bigint
  }

  /**
   * 딕셔너리의 모든 키 목록을 반환한다. 키-값 쌍은 순서가 없으므로, 반환되는 키 리스트가 삽입 순서와 다를 수 있다
   *
   * @param dictionary 딕셔너리
   * @returns 키 리스트
   */
  getListOfKeysFromDictionary<K extends DictKeyType, V extends DictValueType>(
    dictionary: dict<K, V>
  ): RuntimeReturnValueTypeMap[`${K}_list`] {
    const dictionaryObj = parseValue(dictionary, 'dict')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_list_of_keys_from_dictionary',
      args: [dictionaryObj]
    })
    const ret = new list(dictionaryObj.getKeyType())
    ret.markPin(ref, 'keyList', 0)
    return ret as unknown as RuntimeReturnValueTypeMap[`${K}_list`]
  }

  /**
   * 인벤토리 상점에서 지정한 아이템의 판매 정보를 조회한다
   *
   * @param shopOwnerEntity 상점 소유자 엔티티
   * @param shopId 상점 번호
   * @param itemConfigId 아이템 설정 ID
   */
  queryInventoryShopItemSalesInfo(
    shopOwnerEntity: EntityValue,
    shopId: IntValue,
    itemConfigId: ConfigIdValue
  ): {
    /** 판매 화폐 딕셔너리 */
    sellCurrencyDictionary: dict<'config_id', 'int'>
    /** 정렬 우선순위 */
    sortPriority: bigint
    /** 판매 가능 여부 */
    canBeSold: boolean
  } {
    const shopOwnerEntityObj = parseValue(shopOwnerEntity, 'entity')
    const shopIdObj = parseValue(shopId, 'int')
    const itemConfigIdObj = parseValue(itemConfigId, 'config_id')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_inventory_shop_item_sales_info',
      args: [shopOwnerEntityObj, shopIdObj, itemConfigIdObj]
    })
    return {
      sellCurrencyDictionary: (() => {
        const ret = new dict('config_id', 'int')
        ret.markPin(ref, 'sellCurrencyDictionary', 0)
        return ret as unknown as dict<'config_id', 'int'>
      })(),
      sortPriority: (() => {
        const ret = new int()
        ret.markPin(ref, 'sortPriority', 1)
        return ret as unknown as bigint
      })(),
      canBeSold: (() => {
        const ret = new bool()
        ret.markPin(ref, 'canBeSold', 2)
        return ret as unknown as boolean
      })()
    }
  }

  /**
   * 인벤토리 상점의 판매 목록을 조회한다
   *
   * @param shopOwnerEntity 상점 소유자 엔티티
   * @param shopId 상점 번호
   * @returns 아이템 설정 ID 리스트
   */
  queryInventoryShopItemSalesList(shopOwnerEntity: EntityValue, shopId: IntValue): configId[] {
    const shopOwnerEntityObj = parseValue(shopOwnerEntity, 'entity')
    const shopIdObj = parseValue(shopId, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_inventory_shop_item_sales_list',
      args: [shopOwnerEntityObj, shopIdObj]
    })
    const ret = new list('config_id')
    ret.markPin(ref, 'itemConfigIdList', 0)
    return ret as unknown as configId[]
  }

  /**
   * 상점의 매입 목록을 조회한다
   *
   * @param shopOwnerEntity 상점 소유자 엔티티
   * @param shopId 상점 번호
   * @returns 아이템 설정 ID 리스트
   */
  queryShopPurchaseItemList(shopOwnerEntity: EntityValue, shopId: IntValue): configId[] {
    const shopOwnerEntityObj = parseValue(shopOwnerEntity, 'entity')
    const shopIdObj = parseValue(shopId, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_shop_purchase_item_list',
      args: [shopOwnerEntityObj, shopIdObj]
    })
    const ret = new list('config_id')
    ret.markPin(ref, 'itemConfigIdList', 0)
    return ret as unknown as configId[]
  }

  /**
   * 상점에서 지정한 아이템의 매입 정보를 조회한다
   *
   * @param shopOwnerEntity 상점 소유자 엔티티
   * @param shopId 상점 번호
   * @param itemConfigId 아이템 설정 ID
   */
  queryShopItemPurchaseInfo(
    shopOwnerEntity: EntityValue,
    shopId: IntValue,
    itemConfigId: ConfigIdValue
  ): {
    /** 매입 화폐 딕셔너리 */
    purchaseCurrencyDictionary: dict<'config_id', 'int'>
    /** 매입 가능 여부 */
    purchasable: boolean
  } {
    const shopOwnerEntityObj = parseValue(shopOwnerEntity, 'entity')
    const shopIdObj = parseValue(shopId, 'int')
    const itemConfigIdObj = parseValue(itemConfigId, 'config_id')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_shop_item_purchase_info',
      args: [shopOwnerEntityObj, shopIdObj, itemConfigIdObj]
    })
    return {
      purchaseCurrencyDictionary: (() => {
        const ret = new dict('config_id', 'int')
        ret.markPin(ref, 'purchaseCurrencyDictionary', 0)
        return ret as unknown as dict<'config_id', 'int'>
      })(),
      purchasable: (() => {
        const ret = new bool()
        ret.markPin(ref, 'purchasable', 1)
        return ret as unknown as boolean
      })()
    }
  }

  /**
   * 커스텀 상점의 판매 목록을 조회한다. 출력 파라미터는 상품 번호 리스트다
   *
   * @param shopOwnerEntity 상점 소유자 엔티티
   * @param shopId 상점 번호
   * @returns 상품 번호 리스트
   */
  queryCustomShopItemSalesList(shopOwnerEntity: EntityValue, shopId: IntValue): bigint[] {
    const shopOwnerEntityObj = parseValue(shopOwnerEntity, 'entity')
    const shopIdObj = parseValue(shopId, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_custom_shop_item_sales_list',
      args: [shopOwnerEntityObj, shopIdObj]
    })
    const ret = new list('int')
    ret.markPin(ref, 'shopItemIdList', 0)
    return ret as unknown as bigint[]
  }

  /**
   * 커스텀 상점에서 지정한 상품의 판매 정보를 조회한다
   *
   * @param shopOwnerEntity 상점 소유자 엔티티
   * @param shopId 상점 번호
   * @param shopItemId 상품 번호
   */
  queryCustomShopItemSalesInfo(
    shopOwnerEntity: EntityValue,
    shopId: IntValue,
    shopItemId: IntValue
  ): {
    /** 아이템 설정 ID */
    itemConfigId: configId
    /** 판매 화폐 딕셔너리 */
    sellCurrencyDictionary: dict<'config_id', 'int'>
    /** 소속 탭 번호 */
    affiliatedTabId: bigint
    /** 구매 제한 여부 */
    limitPurchase: boolean
    /** 구매 제한 수량 */
    purchaseLimit: bigint
    /** 정렬 우선순위 */
    sortPriority: bigint
    /** 판매 가능 여부 */
    canBeSold: boolean
  } {
    const shopOwnerEntityObj = parseValue(shopOwnerEntity, 'entity')
    const shopIdObj = parseValue(shopId, 'int')
    const shopItemIdObj = parseValue(shopItemId, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_custom_shop_item_sales_info',
      args: [shopOwnerEntityObj, shopIdObj, shopItemIdObj]
    })
    return {
      itemConfigId: (() => {
        const ret = new configId()
        ret.markPin(ref, 'itemConfigId', 0)
        return ret as unknown as configId
      })(),
      sellCurrencyDictionary: (() => {
        const ret = new dict('config_id', 'int')
        ret.markPin(ref, 'sellCurrencyDictionary', 1)
        return ret as unknown as dict<'config_id', 'int'>
      })(),
      affiliatedTabId: (() => {
        const ret = new int()
        ret.markPin(ref, 'affiliatedTabId', 2)
        return ret as unknown as bigint
      })(),
      limitPurchase: (() => {
        const ret = new bool()
        ret.markPin(ref, 'limitPurchase', 3)
        return ret as unknown as boolean
      })(),
      purchaseLimit: (() => {
        const ret = new int()
        ret.markPin(ref, 'purchaseLimit', 4)
        return ret as unknown as bigint
      })(),
      sortPriority: (() => {
        const ret = new int()
        ret.markPin(ref, 'sortPriority', 5)
        return ret as unknown as bigint
      })(),
      canBeSold: (() => {
        const ret = new bool()
        ret.markPin(ref, 'canBeSold', 6)
        return ret as unknown as boolean
      })()
    }
  }

  /**
   * 지정한 장비 슬롯의 장비 인덱스를 반환한다
   *
   * @param targetEntity 대상 엔티티
   * @param row 장비 슬롯 행
   * @param column 장비 슬롯 열
   * @returns 장비 인덱스
   */
  getTheEquipmentIndexOfTheSpecifiedEquipmentSlot(
    targetEntity: EntityValue,
    row: IntValue,
    column: IntValue
  ): bigint {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const rowObj = parseValue(row, 'int')
    const columnObj = parseValue(column, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_the_equipment_index_of_the_specified_equipment_slot',
      args: [targetEntityObj, rowObj, columnObj]
    })
    const ret = new int()
    ret.markPin(ref, 'equipmentIndex', 0)
    return ret as unknown as bigint
  }

  /**
   * 해당 장비 인스턴스의 모든 태그 목록을 조회한다
   *
   * @param equipmentIndex 장비 인덱스
   * @returns 태그 리스트
   */
  queryEquipmentTagList(equipmentIndex: IntValue): configId[] {
    const equipmentIndexObj = parseValue(equipmentIndex, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_equipment_tag_list',
      args: [equipmentIndexObj]
    })
    const ret = new list('config_id')
    ret.markPin(ref, 'tagList', 0)
    return ret as unknown as configId[]
  }

  /**
   * 장비 인덱스로 장비 설정 ID를 조회한다. 장비 인스턴스 인덱스는 [장비 초기화] 이벤트에서 얻을 수 있다
   *
   * @param equipmentIndex 장비 인덱스
   * @returns 장비 설정 ID
   */
  queryEquipmentConfigIdByEquipmentId(equipmentIndex: IntValue): configId {
    const equipmentIndexObj = parseValue(equipmentIndex, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_equipment_config_id_by_equipment_id',
      args: [equipmentIndexObj]
    })
    const ret = new configId()
    ret.markPin(ref, 'equipmentConfigId', 0)
    return ret as unknown as configId
  }

  /**
   * 해당 장비 인스턴스의 모든 어픽스 목록을 반환한다. 장비 초기화 시 어픽스 수치가 무작위로 결정되므로 장비 인스턴스의 어픽스도 별도 인스턴스를 생성한다. 따라서 데이터 타입은 설정 ID가 아닌 정수다
   *
   * @param equipmentIndex 장비 인덱스
   * @returns 장비 어픽스 리스트
   */
  getEquipmentAffixList(equipmentIndex: IntValue): bigint[] {
    const equipmentIndexObj = parseValue(equipmentIndex, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_equipment_affix_list',
      args: [equipmentIndexObj]
    })
    const ret = new list('int')
    ret.markPin(ref, 'equipmentAffixList', 0)
    return ret as unknown as bigint[]
  }

  /**
   * 장비 인스턴스에서 지정한 번호의 어픽스 설정 ID를 반환한다
   *
   * @param equipmentIndex 장비 인덱스
   * @param affixId 어픽스 번호
   * @returns 어픽스 설정 ID
   */
  getEquipmentAffixConfigId(equipmentIndex: IntValue, affixId: IntValue): configId {
    const equipmentIndexObj = parseValue(equipmentIndex, 'int')
    const affixIdObj = parseValue(affixId, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_equipment_affix_config_id',
      args: [equipmentIndexObj, affixIdObj]
    })
    const ret = new configId()
    ret.markPin(ref, 'affixConfigId', 0)
    return ret as unknown as configId
  }

  /**
   * 장비 인스턴스에서 지정한 ID의 어픽스 수치를 반환한다
   *
   * @param equipmentIndex 장비 인덱스
   * @param affixId 어픽스 번호
   * @returns 장비 수치
   */
  getEquipmentAffixValue(equipmentIndex: IntValue, affixId: IntValue): number {
    const equipmentIndexObj = parseValue(equipmentIndex, 'int')
    const affixIdObj = parseValue(affixId, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_equipment_affix_value',
      args: [equipmentIndexObj, affixIdObj]
    })
    const ret = new float()
    ret.markPin(ref, 'affixValue', 0)
    return ret as unknown as number
  }

  /**
   * 인벤토리에서 지정한 설정 ID를 가진 아이템의 수량을 반환한다
   *
   * @param inventoryOwnerEntity 인벤토리 소유자 엔티티
   * @param itemConfigId 아이템 설정 ID
   * @returns 아이템 수량
   */
  getInventoryItemQuantity(inventoryOwnerEntity: EntityValue, itemConfigId: ConfigIdValue): bigint {
    const inventoryOwnerEntityObj = parseValue(inventoryOwnerEntity, 'entity')
    const itemConfigIdObj = parseValue(itemConfigId, 'config_id')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_inventory_item_quantity',
      args: [inventoryOwnerEntityObj, itemConfigIdObj]
    })
    const ret = new int()
    ret.markPin(ref, 'itemQuantity', 0)
    return ret as unknown as bigint
  }

  /**
   * 인벤토리에서 지정한 설정 ID를 가진 화폐의 수량을 반환한다
   *
   * @param inventoryOwnerEntity 인벤토리 소유자 엔티티
   * @param currencyConfigId 화폐 설정 ID
   * @returns 화폐 수량
   */
  getInventoryCurrencyQuantity(
    inventoryOwnerEntity: EntityValue,
    currencyConfigId: ConfigIdValue
  ): bigint {
    const inventoryOwnerEntityObj = parseValue(inventoryOwnerEntity, 'entity')
    const currencyConfigIdObj = parseValue(currencyConfigId, 'config_id')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_inventory_currency_quantity',
      args: [inventoryOwnerEntityObj, currencyConfigIdObj]
    })
    const ret = new int()
    ret.markPin(ref, 'resourceQuantity', 0)
    return ret as unknown as bigint
  }

  /**
   * 인벤토리 용량을 반환한다
   *
   * @param inventoryOwnerEntity 인벤토리 소유자 엔티티
   * @returns 인벤토리 용량
   */
  getInventoryCapacity(inventoryOwnerEntity: EntityValue): bigint {
    const inventoryOwnerEntityObj = parseValue(inventoryOwnerEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_inventory_capacity',
      args: [inventoryOwnerEntityObj]
    })
    const ret = new int()
    ret.markPin(ref, 'inventoryCapacity', 0)
    return ret as unknown as bigint
  }

  /**
   * 인벤토리의 모든 화폐를 반환한다. 화폐 타입과 해당 수량을 포함한다
   *
   * @param inventoryOwnerEntity 인벤토리 소유자 엔티티
   * @returns 화폐 딕셔너리
   */
  getAllCurrencyFromInventory(inventoryOwnerEntity: EntityValue): dict<'config_id', 'int'> {
    const inventoryOwnerEntityObj = parseValue(inventoryOwnerEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_all_currency_from_inventory',
      args: [inventoryOwnerEntityObj]
    })
    const ret = new dict('config_id', 'int')
    ret.markPin(ref, 'currencyDictionary', 0)
    return ret as unknown as dict<'config_id', 'int'>
  }

  /**
   * 인벤토리의 모든 기본 아이템을 반환한다. 아이템 타입과 해당 수량을 포함한다
   *
   * @param inventoryOwnerEntity 인벤토리 소유자 엔티티
   * @returns 기본 아이템 딕셔너리
   */
  getAllBasicItemsFromInventory(inventoryOwnerEntity: EntityValue): dict<'config_id', 'int'> {
    const inventoryOwnerEntityObj = parseValue(inventoryOwnerEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_all_basic_items_from_inventory',
      args: [inventoryOwnerEntityObj]
    })
    const ret = new dict('config_id', 'int')
    ret.markPin(ref, 'basicItemDictionary', 0)
    return ret as unknown as dict<'config_id', 'int'>
  }

  /**
   * 인벤토리의 모든 장비를 반환한다. 출력 파라미터는 모든 장비 인덱스로 구성된 리스트다
   *
   * @param inventoryOwnerEntity 인벤토리 소유자 엔티티
   * @returns 장비 인덱스 리스트
   */
  getAllEquipmentFromInventory(inventoryOwnerEntity: EntityValue): bigint[] {
    const inventoryOwnerEntityObj = parseValue(inventoryOwnerEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_all_equipment_from_inventory',
      args: [inventoryOwnerEntityObj]
    })
    const ret = new list('int')
    ret.markPin(ref, 'equipmentIndexList', 0)
    return ret as unknown as bigint[]
  }

  /**
   * 드롭 프리팹의 드롭 컴포넌트에서 지정한 설정 ID를 가진 아이템의 수량을 반환한다
   *
   * @param lootEntity 드롭 엔티티
   * @param itemConfigId 아이템 설정 ID
   * @returns 아이템 수량
   */
  getLootComponentItemQuantity(lootEntity: EntityValue, itemConfigId: ConfigIdValue): bigint {
    const lootEntityObj = parseValue(lootEntity, 'entity')
    const itemConfigIdObj = parseValue(itemConfigId, 'config_id')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_loot_component_item_quantity',
      args: [lootEntityObj, itemConfigIdObj]
    })
    const ret = new int()
    ret.markPin(ref, 'itemQuantity', 0)
    return ret as unknown as bigint
  }

  /**
   * 드롭 프리팹의 드롭 컴포넌트에서 지정한 설정 ID를 가진 화폐의 수량을 반환한다
   *
   * @param lootEntity 드롭 엔티티
   * @param currencyConfigId 화폐 설정 ID
   * @returns 화폐 수량
   */
  getLootComponentCurrencyQuantity(
    lootEntity: EntityValue,
    currencyConfigId: ConfigIdValue
  ): bigint {
    const lootEntityObj = parseValue(lootEntity, 'entity')
    const currencyConfigIdObj = parseValue(currencyConfigId, 'config_id')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_loot_component_currency_quantity',
      args: [lootEntityObj, currencyConfigIdObj]
    })
    const ret = new int()
    ret.markPin(ref, 'currencyAmount', 0)
    return ret as unknown as bigint
  }

  /**
   * 드롭 프리팹의 드롭 컴포넌트에서 모든 장비를 반환한다
   *
   * @param lootEntity 드롭 엔티티
   * @returns 장비 인덱스 리스트
   */
  getAllEquipmentFromLootComponent(lootEntity: EntityValue): bigint[] {
    const lootEntityObj = parseValue(lootEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_all_equipment_from_loot_component',
      args: [lootEntityObj]
    })
    const ret = new list('int')
    ret.markPin(ref, 'equipmentIndexList', 0)
    return ret as unknown as bigint[]
  }

  /**
   * 드롭 프리팹의 드롭 컴포넌트에서 모든 아이템을 반환한다
   *
   * @param dropperEntity 드롭 엔티티
   * @returns 아이템 딕셔너리
   */
  getAllItemsFromLootComponent(dropperEntity: EntityValue): dict<'config_id', 'int'> {
    const dropperEntityObj = parseValue(dropperEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_all_items_from_loot_component',
      args: [dropperEntityObj]
    })
    const ret = new dict('config_id', 'int')
    ret.markPin(ref, 'itemDictionary', 0)
    return ret as unknown as dict<'config_id', 'int'>
  }

  /**
   * 드롭 프리팹의 드롭 컴포넌트에서 모든 화폐를 반환한다
   *
   * @param dropperEntity 드롭 엔티티
   * @returns 화폐 딕셔너리
   */
  getAllCurrencyFromLootComponent(dropperEntity: EntityValue): dict<'config_id', 'int'> {
    const dropperEntityObj = parseValue(dropperEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_all_currency_from_loot_component',
      args: [dropperEntityObj]
    })
    const ret = new dict('config_id', 'int')
    ret.markPin(ref, 'currencyDictionary', 0)
    return ret as unknown as dict<'config_id', 'int'>
  }

  /**
   * 대상 엔티티의 충돌 트리거 컴포넌트에서 지정한 ID에 해당하는 충돌 트리거 내의 모든 엔티티를 반환한다
   *
   * @param targetEntity 대상 엔티티
   * @param triggerId 트리거 번호
   * @returns 엔티티 리스트
   */
  getAllEntitiesWithinTheCollisionTrigger(
    targetEntity: EntityValue,
    triggerId: IntValue
  ): entity[] {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const triggerIdObj = parseValue(triggerId, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_all_entities_within_the_collision_trigger',
      args: [targetEntityObj, triggerIdObj]
    })
    const ret = new list('entity')
    ret.markPin(ref, 'entityList', 0)
    return ret as unknown as entity[]
  }

  /**
   * 대상 엔티티의 미니맵 마커 컴포넌트에서 지정한 ID에 해당하는 미니맵 마커 정보를 조회한다
   *
   * @param targetEntity 대상 엔티티: 런타임 엔티티
   * @param miniMapMarkerId 미니맵 마커 ID: 조회할 미니맵 마커의 번호
   */
  querySpecifiedMiniMapMarkerInformation(
    targetEntity: EntityValue,
    miniMapMarkerId: IntValue
  ): {
    /**
     * 조회한 미니맵 마커의 활성화 상태
     */
    activationStaet: boolean
    /**
     * 해당 마커를 볼 수 있는 플레이어 리스트
     */
    listOfPlayersWithVisibleMarkers: PlayerEntity[]
    /**
     * 해당 마커를 추적 중인 플레이어 리스트
     */
    listOfPlayersTrackingMarkers: PlayerEntity[]
  } {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const miniMapMarkerIdObj = parseValue(miniMapMarkerId, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_specified_mini_map_marker_information',
      args: [targetEntityObj, miniMapMarkerIdObj]
    })
    return {
      activationStaet: (() => {
        const ret = new bool()
        ret.markPin(ref, 'activationStaet', 0)
        return ret as unknown as boolean
      })(),
      listOfPlayersWithVisibleMarkers: (() => {
        const ret = new list('entity')
        ret.markPin(ref, 'listOfPlayersWithVisibleMarkers', 1)
        return ret as unknown as PlayerEntity[]
      })(),
      listOfPlayersTrackingMarkers: (() => {
        const ret = new list('entity')
        ret.markPin(ref, 'listOfPlayersTrackingMarkers', 2)
        return ret as unknown as PlayerEntity[]
      })()
    }
  }

  /**
   * 엔티티의 현재 미니맵 마커 설정 및 활성화 상태를 조회한다
   *
   * @param targetEntity 대상 엔티티: 런타임 엔티티
   */
  getEntitySMiniMapMarkerStatus(targetEntity: EntityValue): {
    /**
     * 해당 엔티티의 전체 미니맵 마커 ID 리스트
     */
    fullMiniMapMarkerIdList: bigint[]
    /**
     * 해당 엔티티에서 현재 활성화된 미니맵 마커 ID 리스트
     */
    activeMiniMapMarkerIdList: bigint[]
    /**
     * 해당 엔티티에서 현재 비활성화된 미니맵 마커 ID 리스트
     */
    inactiveMiniMapMarkerIdList: bigint[]
  } {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_entity_s_mini_map_marker_status',
      args: [targetEntityObj]
    })
    return {
      fullMiniMapMarkerIdList: (() => {
        const ret = new list('int')
        ret.markPin(ref, 'fullMiniMapMarkerIdList', 0)
        return ret as unknown as bigint[]
      })(),
      activeMiniMapMarkerIdList: (() => {
        const ret = new list('int')
        ret.markPin(ref, 'activeMiniMapMarkerIdList', 1)
        return ret as unknown as bigint[]
      })(),
      inactiveMiniMapMarkerIdList: (() => {
        const ret = new list('int')
        ret.markPin(ref, 'inactiveMiniMapMarkerIdList', 2)
        return ret as unknown as bigint[]
      })()
    }
  }

  /**
   * 지정한 피조물 엔티티의 순찰 템플릿 정보를 반환한다
   *
   * @param creationEntity 피조물 엔티티: 런타임 피조물 엔티티
   */
  getCurrentCreationSPatrolTemplate(creationEntity: CreationEntity): {
    /**
     * 해당 피조물에 현재 적용 중인 순찰 템플릿 ID
     */
    patrolTemplateId: bigint
    /**
     * 해당 피조물의 현재 순찰 템플릿이 참조하는 경로 인덱스
     */
    pathIndex: bigint
    /**
     * 해당 피조물이 다음으로 이동할 웨이포인트 번호
     */
    targetWaypointIndex: bigint
  } {
    const creationEntityObj = parseValue(creationEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_current_creation_s_patrol_template',
      args: [creationEntityObj]
    })
    return {
      patrolTemplateId: (() => {
        const ret = new int()
        ret.markPin(ref, 'patrolTemplateId', 0)
        return ret as unknown as bigint
      })(),
      pathIndex: (() => {
        const ret = new int()
        ret.markPin(ref, 'pathIndex', 1)
        return ret as unknown as bigint
      })(),
      targetWaypointIndex: (() => {
        const ret = new int()
        ret.markPin(ref, 'targetWaypointIndex', 2)
        return ret as unknown as bigint
      })()
    }
  }

  /**
   * 대상 엔티티에서 지정한 ID에 해당하는 업적이 완료되었는지 조회한다
   *
   * @param targetEntity 대상 엔티티
   * @param achievementId 업적 번호
   * @returns 완료 여부
   */
  queryIfAchievementIsCompleted(targetEntity: EntityValue, achievementId: IntValue): boolean {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const achievementIdObj = parseValue(achievementId, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_if_achievement_is_completed',
      args: [targetEntityObj, achievementIdObj]
    })
    const ret = new bool()
    ret.markPin(ref, 'completed', 0)
    return ret as unknown as boolean
  }

  /**
   * 대상 엔티티에서 현재 활성화된 스캔 태그의 설정 ID를 반환한다
   *
   * @param targetEntity 대상 엔티티
   * @returns 스캔 태그 설정 ID
   */
  getTheCurrentlyActiveScanTagConfigId(targetEntity: EntityValue): configId {
    const targetEntityObj = parseValue(targetEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_the_currently_active_scan_tag_config_id',
      args: [targetEntityObj]
    })
    const ret = new configId()
    ret.markPin(ref, 'scanTagConfigId', 0)
    return ret as unknown as configId
  }

  /**
   * 다양한 정산 상태에서 플레이어 엔티티의 랭크 변화 점수를 반환한다
   *
   * @param playerEntity 플레이어 엔티티
   * @param settlementStatus 정산 상태
   * @returns 점수
   */
  getPlayerRankScoreChange(playerEntity: PlayerEntity, settlementStatus: SettlementStatus): bigint {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const settlementStatusObj = parseValue(settlementStatus, 'enumeration')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_player_rank_score_change',
      args: [playerEntityObj, settlementStatusObj]
    })
    const ret = new int()
    ret.markPin(ref, 'score', 0)
    return ret as unknown as bigint
  }

  /**
   * 플레이어의 랭크 관련 정보를 반환한다
   *
   * @param playerEntity 플레이어 엔티티
   */
  getPlayerRankingInfo(playerEntity: PlayerEntity): {
    /**
     * 플레이어 랭크 총점
     */
    playerRankTotalScore: bigint
    /**
     * 플레이어 연승 횟수
     */
    playerWinStreak: bigint
    /**
     * 플레이어 연패 횟수
     */
    playerLoseStreak: bigint
    /**
     * 플레이어 연속 이탈 횟수
     */
    playerConsecutiveEscapes: bigint
  } {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_player_ranking_info',
      args: [playerEntityObj]
    })
    return {
      playerRankTotalScore: (() => {
        const ret = new int()
        ret.markPin(ref, 'playerRankTotalScore', 0)
        return ret as unknown as bigint
      })(),
      playerWinStreak: (() => {
        const ret = new int()
        ret.markPin(ref, 'playerWinStreak', 1)
        return ret as unknown as bigint
      })(),
      playerLoseStreak: (() => {
        const ret = new int()
        ret.markPin(ref, 'playerLoseStreak', 2)
        return ret as unknown as bigint
      })(),
      playerConsecutiveEscapes: (() => {
        const ret = new int()
        ret.markPin(ref, 'playerConsecutiveEscapes', 3)
        return ret as unknown as bigint
      })()
    }
  }

  /**
   * 플레이어의 이탈 허용 여부를 반환한다
   *
   * @param playerEntity 플레이어 엔티티
   * @returns 합법 여부
   */
  getPlayerEscapeValidity(playerEntity: PlayerEntity): boolean {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_player_escape_validity',
      args: [playerEntityObj]
    })
    const ret = new bool()
    ret.markPin(ref, 'valid', 0)
    return ret as unknown as boolean
  }

  /**
   * 현재 스테이지에서 활성화된 엔티티 배치 그룹 리스트를 조회한다
   *
   * @returns 엔티티 배치 그룹 인덱스 리스트
   */
  getCurrentlyActiveEntityDeploymentGroups(): bigint[] {
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_currently_active_entity_deployment_groups',
      args: []
    })
    const ret = new list('int')
    ret.markPin(ref, 'entityDeploymentGroupIndexList', 0)
    return ret as unknown as bigint[]
  }

  /**
   * 플레이어 엔티티에서 지정한 선물 상자의 수량을 조회한다
   *
   * @param playerEntity 플레이어 엔티티
   * @param giftBoxIndex 선물 상자 인덱스
   * @returns 수량
   */
  queryCorrespondingGiftBoxQuantity(playerEntity: PlayerEntity, giftBoxIndex: IntValue): bigint {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const giftBoxIndexObj = parseValue(giftBoxIndex, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_corresponding_gift_box_quantity',
      args: [playerEntityObj, giftBoxIndexObj]
    })
    const ret = new int()
    ret.markPin(ref, 'quantity', 0)
    return ret as unknown as bigint
  }

  /**
   * 플레이어 엔티티에서 지정한 선물 상자의 소비 수량을 조회한다
   *
   * @param playerEntity 플레이어 엔티티
   * @param giftBoxIndex 선물 상자 인덱스
   * @returns 수량
   */
  queryCorrespondingGiftBoxConsumption(playerEntity: PlayerEntity, giftBoxIndex: IntValue): bigint {
    const playerEntityObj = parseValue(playerEntity, 'entity')
    const giftBoxIndexObj = parseValue(giftBoxIndex, 'int')
    const ref = this.registry.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'query_corresponding_gift_box_consumption',
      args: [playerEntityObj, giftBoxIndexObj]
    })
    const ret = new int()
    ret.markPin(ref, 'quantity', 0)
    return ret as unknown as bigint
  }
  // === AUTO-GENERATED END ===
}

type NodeTypeByMethod = typeof NODE_TYPE_BY_METHOD

type MethodAllowedByMode<
  M extends ServerGraphMode,
  K extends keyof ServerExecutionFlowFunctions
> = K extends keyof NodeTypeByMethod ? (NodeTypeByMethod[K] extends M ? K : never) : K

export type ServerExecutionFlowFunctionsByMode<M extends ServerGraphMode> = {
  [K in keyof ServerExecutionFlowFunctions as MethodAllowedByMode<
    M,
    K
  >]: ServerExecutionFlowFunctions[K]
}
