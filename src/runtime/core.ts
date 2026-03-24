import { EnumerationType } from '../definitions/enum.js'
import type { ServerEventPayloadsByMode } from '../definitions/events-payload-mode.js'
import type { ServerEventPayloads } from '../definitions/events-payload.js'
import {
  ServerEventMetadata,
  ServerEventMetadataType,
  ServerEventName
} from '../definitions/events.js'
import { NODE_TYPE_BY_METHOD } from '../definitions/node_modes.js'
import {
  ServerExecutionFlowFunctions,
  type ServerExecutionFlowFunctionsByMode
} from '../definitions/nodes.js'
import type { ServerOnOverloads } from '../definitions/server_on_overloads.js'
import {
  SERVER_EVENT_ZH_TO_EN,
  SERVER_F_ZH_TO_EN,
  type ServerEventNameZh
} from '../definitions/zh_aliases.js'
import type { ExecTailEndpoint, ExecutionFlow } from './execution_flow_types.js'
import { buildIRDocument } from './ir_builder.js'
import type { ServerGraphMode, ServerGraphSubType, Variable } from './IR.js'
import type { MetaCallRecord, MetaCallRecordRef } from './meta_call_types.js'
import { getRuntimeOptions } from './runtime_config.js'
import { installScopedServerGlobals, installServerGlobals } from './server_globals.js'
import {
  bool,
  configId,
  dict,
  ensureLiteralStr,
  entity,
  enumeration,
  float,
  guid,
  int,
  list,
  localVariable,
  prefabId,
  str,
  value,
  vec3,
  type DictValueType
} from './value.js'
import {
  parseVariableDefinitions,
  type NodeGraphVarApi,
  type NodeGraphVariableMeta,
  type VariablesDefinition
} from './variables.js'

export type { MetaCallRecord, MetaCallRecordRef, MetaCallRecordType } from './meta_call_types.js'

export type IRBuildOptions = {
  optimizeA?: boolean
  /**
   * g.server()에 name이 지정되지 않았을 때 사용할 기본 그래프 이름 (보통 runner가 입력 파일명으로 전달)
   */
  defaultName?: string
}

export type ServerLang = 'en' | 'zh'

type ServerGraphOptionsBase<Vars extends VariablesDefinition = VariablesDefinition> = {
  /**
   * 노드 그래프 ID (NodeGraph.id).
   *
   * 인젝션/교체 대상이 될 NodeGraph ID. 기본값은 1073741825.
   */
  id?: number
  /**
   * 노드 에디터에 표시될 그래프 이름 (NodeGraph.name).
   *
   * 생략 시: gsts runner가 defaultName으로 주입하는 입력 파일명이 사용된다.
   */
  name?: string
  /**
   * `_GSTS` 접두사를 자동으로 붙일지 여부 (기본값 true).
   * - true: name/defaultName이 `_GSTS`로 시작하지 않으면 자동으로 `_GSTS_` 접두사를 붙임
   * - false: 접두사 처리를 하지 않음
   */
  prefix?: boolean
  /**
   * 노드 그래프 변수 선언
   */
  variables?: Vars
  /**
   * 언어 설정 (타입 힌트 및 중국어 별칭 해석에만 영향)
   */
  lang?: ServerLang
}

export type ServerGraphOptions<Vars extends VariablesDefinition = VariablesDefinition> =
  | (ServerGraphOptionsBase<Vars> & {
      /**
       * 노드 그래프 모드 (기본값: Beyond Mode).
       */
      mode?: 'beyond'
      /**
       * 서버 노드 그래프 서브 타입 (기본값: `entity`).
       */
      type?: ServerGraphSubType
    })
  | (ServerGraphOptionsBase<Vars> & {
      /**
       * 노드 그래프 모드 (Classic Mode).
       */
      mode: 'classic'
      /**
       * 서버 노드 그래프 서브 타입 (기본값: `entity`; Classic Mode에서는 `class` 불가).
       */
      type?: Exclude<ServerGraphSubType, 'class'>
    })

export type ServerExecutionFlowFunctionsWithVars<
  Vars extends VariablesDefinition,
  Mode extends ServerGraphMode
> = Omit<ServerExecutionFlowFunctionsByMode<Mode>, 'get' | 'set'> & NodeGraphVarApi<Vars>

export type ServerExecutionFlowFunctionsWithVarsZh<
  Vars extends VariablesDefinition,
  Mode extends ServerGraphMode
> = ServerExecutionFlowFunctionsWithVars<Vars, Mode> & {
  [K in keyof typeof SERVER_F_ZH_TO_EN as Extract<
    (typeof SERVER_F_ZH_TO_EN)[K],
    keyof ServerExecutionFlowFunctionsWithVars<Vars, Mode>
  > extends never
    ? never
    : K]: ServerExecutionFlowFunctionsWithVars<Vars, Mode>[Extract<
    (typeof SERVER_F_ZH_TO_EN)[K],
    keyof ServerExecutionFlowFunctionsWithVars<Vars, Mode>
  >]
}

type ServerExecutionFlowFunctionsForLang<
  Vars extends VariablesDefinition,
  Lang extends ServerLang,
  Mode extends ServerGraphMode
> = Lang extends 'zh'
  ? ServerExecutionFlowFunctionsWithVarsZh<Vars, Mode>
  : ServerExecutionFlowFunctionsWithVars<Vars, Mode>

type ServerEventNameAny = ServerEventName | ServerEventNameZh

type ServerEventNameToEn<E> = E extends ServerEventName
  ? E
  : E extends ServerEventNameZh
    ? (typeof SERVER_EVENT_ZH_TO_EN)[E]
    : never

export type ServerGraphApi<
  Vars extends VariablesDefinition,
  Lang extends ServerLang = 'en',
  Mode extends ServerGraphMode = 'beyond'
> = (Lang extends 'zh'
  ? ServerOnOverloads<Vars, Mode, ServerExecutionFlowFunctionsForLang<Vars, 'zh', Mode>, true>
  : ServerOnOverloads<Vars, Mode, ServerExecutionFlowFunctionsForLang<Vars, 'en', Mode>>) & {
  /**
   * 시그널 관리자에 정의된 시그널 트리거 이벤트를 감지한다. 먼저 감지할 시그널 이름을 선택해야 한다.
   *
   * GSTS 참고: 에디터의 시그널 관리자에 시그널을 별도로 등록해야 한다. 시그널 분배를 사용하면 대형 루프 트리거 부하 제한을 피할 수 있어 성능 최적화에 활용 가능하다.
   *
   * @param signalName 감지할 시그널 이름 (리터럴 문자열)
   * @param handler 이벤트 핸들러. `evt`에는 고정 출력 3개(eventSourceEntity, eventSourceGuid, signalSourceEntity)와 커스텀 시그널 인자가 이름으로 포함됨
   * @param signalArgs 시그널 커스텀 인자 정의 배열 (선택). 각 항목은 `name`과 `type`으로 구성. 이름, 타입, 순서는 에디터의 시그널 관리자에 등록된 정의와 반드시 일치해야 한다. 커스텀 인자는 핸들러에서 `evt.인자이름`으로 접근 가능 (출력 인덱스 3부터)
   * @example
   * ```ts
   * .onSignal('DamageSignal', (evt, f) => {
   *   const target = evt.targetEntity  // custom arg
   *   const amount = evt.damageAmount  // custom arg
   * }, [
   *   { name: 'targetEntity', type: 'entity' },
   *   { name: 'damageAmount', type: 'int' }
   * ])
   * ```
   */
  onSignal(
    signalName: string,
    handler: (
      evt: ServerEventPayloadsByMode<Mode>['monitorSignal'] & Record<string, any>,
      f: ServerExecutionFlowFunctionsForLang<Vars, Lang, Mode>
    ) => void,
    signalArgs?: Array<{ name: string; type: string }>
  ): ServerGraphApi<Vars, Lang, Mode>
}

const SERVER_GRAPH_TYPES = new Set<ServerGraphSubType>(['entity', 'status', 'class', 'item'])
const SERVER_GRAPH_MODES = new Set<ServerGraphMode>(['beyond', 'classic'])

function resolveServerGraphType(type?: ServerGraphSubType): ServerGraphSubType {
  const resolved = type ?? 'entity'
  if (!SERVER_GRAPH_TYPES.has(resolved)) {
    throw new Error(`[error] invalid server graph sub type: ${String(type)}`)
  }
  return resolved
}

function resolveServerGraphMode(mode?: ServerGraphMode): ServerGraphMode {
  const resolved = mode ?? 'beyond'
  if (!SERVER_GRAPH_MODES.has(resolved)) {
    throw new Error(`[error] invalid server graph mode: ${String(mode)}`)
  }
  return resolved
}

function assertServerGraphModeCompatible(mode: ServerGraphMode, type: ServerGraphSubType) {
  if (mode === 'classic' && type === 'class') {
    throw new Error('[error] classic mode does not allow class graph type')
  }
}

export type GstsCtxType =
  | 'javascript'
  | 'server_handler'
  | 'server_if'
  | 'server_loop'
  | 'server_switch'

export type GstsCtxApi = {
  readonly ctxType: GstsCtxType
  withCtx<T>(ctxType: GstsCtxType, fn: () => T): T
  isServerCtx(): boolean
  assertServerCtx(): void
  assertCtx(expected: GstsCtxType): void
}

export type GstsPublic = {
  /**
   * 컨텍스트 도구 통합 진입점
   */
  readonly ctx: GstsCtxApi
  /**
   * g.server().on() 핸들러 내부에서만 접근 가능. 그 외에서 접근 시 throw
   */
  readonly f: ServerExecutionFlowFunctions
}

declare global {
  var gsts: GstsPublic
  interface GlobalThis {
    gsts: GstsPublic
  }
}

const kCtxStack: unique symbol = Symbol('gsts_ctxStack')
const kServerF: unique symbol = Symbol('gsts_serverF')

type GstsInternal = GstsPublic & {
  [kCtxStack]?: GstsCtxType[]
  [kServerF]?: ServerExecutionFlowFunctions
}

function ensureGsts(): GstsPublic {
  // @ts-ignore 友好打印bigint
  BigInt.prototype.toJSON = function () {
    return `${Number(this)}n`
  }

  const root = globalThis as unknown as { gsts?: GstsInternal }
  const g = (root.gsts ??= { ctx: {} as unknown as GstsCtxApi } as GstsInternal)

  const stack = (g[kCtxStack] ??= [])

  const ctx: GstsCtxApi = {
    get ctxType() {
      return stack[stack.length - 1] ?? 'javascript'
    },
    withCtx<T>(ctxType: GstsCtxType, fn: () => T): T {
      stack.push(ctxType)
      try {
        return fn()
      } finally {
        stack.pop()
      }
    },
    isServerCtx() {
      return this.ctxType.startsWith('server_')
    },
    assertServerCtx() {
      if (!this.isServerCtx()) {
        throw new Error(
          `[error] gsts.f is only available in server_* ctxType (current: ${this.ctxType})`
        )
      }
    },
    assertCtx(expected: GstsCtxType) {
      if (this.ctxType !== expected) {
        throw new Error(`[error] invalid ctxType: expected ${expected}, got ${this.ctxType}`)
      }
    }
  }
  // @ts-ignore force assign ctx to gsts
  g.ctx = ctx

  if (!Object.getOwnPropertyDescriptor(g, 'f')) {
    Object.defineProperty(g, 'f', {
      configurable: false,
      enumerable: true,
      get() {
        ctx.assertServerCtx()
        if (!g[kServerF]) {
          throw new Error(
            '[error] gsts.f is not bound (did you call it outside g.server().on handler?)'
          )
        }
        return g[kServerF]
      }
    })
  }

  return g
}

ensureGsts()
installServerGlobals()

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

const NODE_MODE_BY_NODE_TYPE = new Map<string, ServerGraphMode>(
  Object.entries(NODE_TYPE_BY_METHOD).map(([methodName, mode]) => [camelToSnake(methodName), mode])
)

function processDictParam(param: ServerEventMetadataType[ServerEventName][number]): value {
  switch (param.name) {
    case 'purchaseItemDictionary':
      return new dict('config_id', 'int')
    default:
      throw new Error(`Unknown dict param: ${param.name}`)
  }
}

export class MetaCallRegistry {
  private recordCounter = 1
  private flows: ExecutionFlow[] = []
  private flowStack: number[] = []
  private readonly graphType: ServerGraphSubType
  private readonly graphMode: ServerGraphMode
  private readonly graphId?: number
  private readonly graphName?: string
  private readonly prefixName: boolean
  private readonly variables: Variable[]
  private readonly variableMetaByName: Map<string, NodeGraphVariableMeta>
  private bootstrapFlow?: ExecutionFlow
  /**
   * return 호출 횟수. 콜백 전후 비교로 return이 호출됐는지 확인
   */
  private returnCallCounter = 0
  /**
   * 현재 활성화된 루프 노드 기록. return 시 전체 break 처리에 사용
   */
  private loopNodeStack: number[] = []

  constructor(
    graphType: ServerGraphSubType = 'entity',
    graphMode: ServerGraphMode = 'beyond',
    graphId?: number,
    graphName?: string,
    prefixName: boolean = true,
    variables: Variable[] = [],
    variableMetaByName: Map<string, NodeGraphVariableMeta> = new Map()
  ) {
    this.graphType = graphType
    this.graphMode = graphMode
    this.graphId = graphId
    this.graphName = graphName
    this.prefixName = prefixName
    this.variables = variables
    this.variableMetaByName = variableMetaByName
  }

  ensureBootstrapFlow(): ExecutionFlow {
    if (this.bootstrapFlow) return this.bootstrapFlow
    if (this.recordCounter !== 1) {
      throw new Error('[error] bootstrap flow must be created before any other nodes')
    }
    this.registerEvent('whenEntityIsCreated', ServerEventMetadata, [])
    const flow = this.flows[this.flows.length - 1]
    this.bootstrapFlow = flow
    return flow
  }

  withFlow<T>(flow: ExecutionFlow, fn: () => T): T {
    const idx = this.flows.indexOf(flow)
    if (idx < 0) {
      throw new Error('[error] flow not found')
    }
    const prevFlowStack = this.flowStack
    this.flowStack = [...prevFlowStack, idx]
    try {
      return fn()
    } finally {
      this.flowStack = prevFlowStack
    }
  }

  ensureVariable(variable: Variable, meta?: NodeGraphVariableMeta) {
    const existing = this.variables.find((v) => v.name === variable.name)
    if (existing) {
      if (existing.type !== variable.type) {
        throw new Error(
          `[error] variable "${variable.name}" already exists with different type (${existing.type} vs ${variable.type})`
        )
      }
      if (existing.type === 'dict') {
        const a = existing.dict
        const b = (variable as Extract<Variable, { type: 'dict' }>).dict
        if (!a || !b || a.k !== b.k || a.v !== b.v) {
          throw new Error(
            `[error] variable "${variable.name}" already exists with different dict types`
          )
        }
      }
      return
    }
    this.variables.push(variable)
    if (meta) this.variableMetaByName.set(variable.name, meta)
  }

  registerTimerCaptureDict(name: string, valueType: DictValueType) {
    this.ensureVariable(
      { name, type: 'dict', dict: { k: 'str', v: valueType } },
      { type: 'dict', dict: { k: 'str', v: valueType } }
    )
  }

  runServerHandler<E extends ServerEventName>(
    eventName: E,
    handler: (evt: ServerEventPayloads[E], f: ServerExecutionFlowFunctions) => void,
    inputArgs: value[] = []
  ) {
    this.ensureBootstrapFlow()
    const evt = this.registerEvent(eventName, ServerEventMetadata, inputArgs)
    const fns = new ServerExecutionFlowFunctions(this)
    const gsts = ensureGsts() as unknown as GstsInternal
    const prevF = gsts[kServerF]
    const prevFlowStack = this.flowStack
    const prevLoopStack = this.loopNodeStack
    const prevReturnCounter = this.returnCallCounter
    const flowIndex = this.flows.length - 1
    const restoreScopedGlobals = installScopedServerGlobals()
    this.flowStack = [...prevFlowStack, flowIndex]
    this.loopNodeStack = []
    this.returnCallCounter = 0
    gsts[kServerF] = fns
    try {
      gsts.ctx.withCtx('server_handler', () => handler(evt, fns as never))
    } finally {
      restoreScopedGlobals()
      gsts[kServerF] = prevF
      this.flowStack = prevFlowStack
      this.loopNodeStack = prevLoopStack
      this.returnCallCounter = prevReturnCounter
    }
  }

  getGraphId(): number | undefined {
    return this.graphId
  }

  getGraphName(): string | undefined {
    return this.graphName
  }

  shouldPrefixName(): boolean {
    return this.prefixName
  }

  private getCurrentExecContext(flow: ExecutionFlow) {
    return flow.execContextStack[flow.execContextStack.length - 1]
  }

  private addEdge(flow: ExecutionFlow, fromNodeId: number, toNodeId: number, sourceIndex?: number) {
    const list = (flow.edges[fromNodeId] ??= [])
    if (sourceIndex === undefined) {
      list.push(toNodeId)
    } else {
      list.push({ node_id: toNodeId, source_index: sourceIndex })
    }
  }

  private connectFromEndpoints(
    flow: ExecutionFlow,
    endpoints: ExecTailEndpoint[],
    toNodeId: number
  ) {
    endpoints.forEach((ep) => this.addEdge(flow, ep.nodeId, toNodeId, ep.sourceIndex))
  }

  connectExecBranchOutput(fromNodeId: number, sourceIndex: number, headNodeId: number) {
    this.addEdge(this.currentFlow, fromNodeId, headNodeId, sourceIndex)
  }

  private get currentFlow(): ExecutionFlow {
    const idx =
      this.flowStack.length > 0 ? this.flowStack[this.flowStack.length - 1] : this.flows.length - 1
    return this.flows[idx]
  }

  /**
   * 현재 레코드 ID를 반환하고 호출 시마다 증가시킴
   */
  private get currentRecordId(): number {
    return this.recordCounter++
  }

  registerEvent<E extends ServerEventName>(
    eventName: E,
    metadata: ServerEventMetadataType,
    inputArgs: value[] = []
  ): ServerEventPayloads[E] {
    const eventParams = metadata[eventName]

    if (!eventParams) {
      throw new Error(`Unknown event: ${eventName}`)
    }

    const eventNode: MetaCallRecord = {
      id: this.currentRecordId,
      type: 'event',
      nodeType: camelToSnake(eventName),
      args: inputArgs
    }

    const eventArgs: value[] = []
    const eventObj = {} as unknown as ServerEventPayloads[E]

    eventParams.forEach((param) => {
      const makePin = () => {
        if (param.typeBase === dict) {
          const v = processDictParam(param)
          v.markPin(eventNode, param.name, eventArgs.length)
          return v
        }
        if (param.typeBase === enumeration) {
          const v = new enumeration(param.typeName as EnumerationType)
          v.markPin(eventNode, param.name, eventArgs.length)
          return v
        }
        const v = new (param.typeBase as Exclude<typeof param.typeBase, typeof dict>)()
        v.markPin(eventNode, param.name, eventArgs.length)
        return v
      }
      if (param.isArray) {
        const l = new list(param.typeName)
        l.markPin(eventNode, param.name, eventArgs.length)
        eventArgs.push(l)
        // @ts-ignore 强制允许
        eventObj[param.name] = l
      } else {
        const arg = makePin()
        eventArgs.push(arg)
        // @ts-ignore 强制允许
        eventObj[param.name] = arg
      }
    })

    // Signal arguments: add dynamic output pins for monitor_signal custom args
    if (
      camelToSnake(eventName) === 'monitor_signal' &&
      (inputArgs as value[] & { _signalArgs?: Array<{ name: string; type: string }> })._signalArgs
    ) {
      const signalTypeClassMap: Record<string, new () => value> = {
        entity,
        guid,
        int,
        bool,
        float,
        str,
        vec3,
        config_id: configId,
        prefab_id: prefabId
      }
      const _signalArgs = (inputArgs as value[] & { _signalArgs?: Array<{ name: string; type: string }> })
        ._signalArgs!
      for (const argDef of _signalArgs) {
        const isArray = argDef.type.endsWith('_list')
        const baseTypeName = isArray ? argDef.type.slice(0, -5) : argDef.type
        if (isArray) {
          const l = new list(baseTypeName as any)
          l.markPin(eventNode, argDef.name, eventArgs.length)
          eventArgs.push(l)
          // @ts-ignore dynamic signal arg
          eventObj[argDef.name] = l
        } else {
          const typeBase = signalTypeClassMap[baseTypeName]
          const v = new typeBase()
          v.markPin(eventNode, argDef.name, eventArgs.length)
          eventArgs.push(v)
          // @ts-ignore dynamic signal arg
          eventObj[argDef.name] = v
        }
      }
      eventNode.signalParams = _signalArgs.map((a) => ({
        name: a.name,
        type: a.type
      }))
    }

    this.flows.push({
      eventNode,
      eventArgs,
      execNodes: [],
      dataNodes: [],
      edges: {},
      execContextStack: [
        {
          // 默认根执行链从事件节点出发
          tailEndpoints: [{ nodeId: eventNode.id }]
        }
      ]
    })

    return eventObj
  }

  /**
   * 지정된 노드의 특정 실행 출력 핀 아래에 실행 체인을 등록한다 (루프 본문/조건 브랜치 용도).
   * 콜백 내에서 등록된 exec 노드는 독립적인 체인을 형성하며, 완료 후 해당 체인의 head가 fromNodeId의 sourceIndex에 자동으로 연결된다.
   */
  withExecBranch(fromNodeId: number, sourceIndex: number, fn: () => void) {
    const current = this.currentFlow
    current.execContextStack.push({ tailEndpoints: [] })

    fn()

    const ctx = current.execContextStack.pop()!
    // fn注册过节点, 则headNodeId才会有值
    if (ctx.headNodeId) {
      this.addEdge(current, fromNodeId, ctx.headNodeId, sourceIndex)
    }

    return {
      tailEndpoints: ctx.tailEndpoints,
      headNodeId: ctx.headNodeId,
      terminatedByReturn: ctx.terminatedByReturn
    }
  }

  /**
   * 다음에 등록될 첫 번째 exec 노드를 지정 노드의 특정 실행 출력 핀에 연결하도록 마킹한다 (일회성).
   * Finite Loop의 Loop Complete 처럼, 루프 노드 이후의 순차 코드를 complete 브랜치에 연결할 때 사용한다.
   */
  markLinkNextExecFrom(fromNodeId: number, sourceIndex: number) {
    const current = this.currentFlow
    const ctx = this.getCurrentExecContext(current)
    ctx.tailEndpoints = [{ nodeId: fromNodeId, sourceIndex }]
    ctx.pendingSourceIndex = sourceIndex
  }

  /**
   * 현재 실행 체인의 tail을 설정한다 (다중 경로 시 사용)
   */
  setCurrentExecTailEndpoints(tailEndpoints: ExecTailEndpoint[]) {
    const current = this.currentFlow
    const ctx = this.getCurrentExecContext(current)
    ctx.tailEndpoints = tailEndpoints
    ctx.pendingSourceIndex = undefined
  }

  /**
   * 현재 실행 경로를 종료한다 (return / continue / break 의미): 해당 브랜치 이후로 실행 와이어를 생성하지 않는다
   */
  returnFromCurrentExecPath(opts?: { countReturn?: boolean }) {
    const current = this.currentFlow
    const ctx = this.getCurrentExecContext(current)
    ctx.terminatedByReturn = true
    ctx.tailEndpoints = []
    ctx.pendingSourceIndex = undefined
    if (opts?.countReturn !== false) this.returnCallCounter += 1
  }

  registerNode(record: MetaCallRecord): MetaCallRecordRef {
    const current = this.currentFlow
    if (!record.id) {
      record.id = this.currentRecordId
    }

    const nodeMode = NODE_MODE_BY_NODE_TYPE.get(record.nodeType)
    if (nodeMode && nodeMode !== this.graphMode) {
      throw new Error(
        `[error] node "${record.nodeType}" is ${nodeMode} mode only (current: ${this.graphMode})`
      )
    }

    if (record.type === 'exec') {
      current.execNodes.push(record)
      const ctx = this.getCurrentExecContext(current)
      if (!ctx.headNodeId) ctx.headNodeId = record.id
      const tails = ctx.tailEndpoints
      if (ctx.pendingSourceIndex !== undefined && tails.length > 1) {
        throw new Error('pendingSourceIndex cannot be used with multiple tail endpoints')
      }
      if (tails.length) {
        const sourceIndex = ctx.pendingSourceIndex
        if (sourceIndex !== undefined) {
          this.connectFromEndpoints(current, [{ nodeId: tails[0].nodeId, sourceIndex }], record.id)
        } else {
          this.connectFromEndpoints(current, tails, record.id)
        }
        ctx.pendingSourceIndex = undefined
      }
      ctx.tailEndpoints = [{ nodeId: record.id }]
    } else if (record.type === 'data') {
      current.dataNodes.push(record)
    } else {
      throw new Error(`registerNode: unknown record type: ${record.type}`)
    }
    return record
  }

  getFlows(): ExecutionFlow[] {
    return this.flows
  }

  getVariables() {
    return this.variables
  }

  getVariableMeta(name: string): NodeGraphVariableMeta | undefined {
    return this.variableMetaByName.get(name)
  }

  getGraphType(): ServerGraphSubType {
    return this.graphType
  }

  getGraphMode(): ServerGraphMode {
    return this.graphMode
  }

  /**
   * 현재 플로우의 return gate 로컬 변수를 가져온다 (없으면 생성: Get Local Variable(false)).
   * return() 마킹 및 루프 complete 지점의 return gate에 사용한다.
   */
  getOrCreateReturnGateLocalVariable(): { localVariable: localVariable; value: bool } {
    const flow = this.currentFlow
    if (flow.returnGateLocalVariable && flow.returnGateValue) {
      return {
        localVariable: flow.returnGateLocalVariable as localVariable,
        value: flow.returnGateValue as bool
      }
    }

    const ref = this.registerNode({
      id: 0,
      type: 'data',
      nodeType: 'get_local_variable',
      args: [new bool(false)]
    })
    const lv = new localVariable()
    lv.markPin(ref, 'localVariable', 0)
    const v = new bool()
    v.markPin(ref, 'value', 1)

    flow.returnGateLocalVariable = lv
    flow.returnGateValue = v
    return { localVariable: lv, value: v }
  }

  withLoop(loopNodeId: number, fn: () => void) {
    this.loopNodeStack.push(loopNodeId)

    fn()

    this.loopNodeStack.pop()
  }

  getActiveLoopNodeIds(): number[] {
    return [...this.loopNodeStack]
  }

  getReturnCallCounter(): number {
    return this.returnCallCounter
  }
}

const serverRegistries: MetaCallRegistry[] = []

type ServerGraphOptionsClassic<Vars extends VariablesDefinition> = Extract<
  ServerGraphOptions<Vars>,
  { mode: 'classic' }
>

type ServerGraphOptionsBeyond<Vars extends VariablesDefinition> = Exclude<
  ServerGraphOptions<Vars>,
  { mode: 'classic' }
>

function server<Vars extends VariablesDefinition = VariablesDefinition>(
  options: ServerGraphOptionsClassic<Vars> & { lang: 'zh' }
): ServerGraphApi<Vars, 'zh', 'classic'>
function server<Vars extends VariablesDefinition = VariablesDefinition>(
  options: ServerGraphOptionsClassic<Vars>
): ServerGraphApi<Vars, 'en', 'classic'>
function server<Vars extends VariablesDefinition = VariablesDefinition>(
  options: ServerGraphOptionsBeyond<Vars> & { lang: 'zh' }
): ServerGraphApi<Vars, 'zh', 'beyond'>
function server<Vars extends VariablesDefinition = VariablesDefinition>(
  options?: ServerGraphOptionsBeyond<Vars>
): ServerGraphApi<Vars, 'en', 'beyond'>
function server<Vars extends VariablesDefinition = VariablesDefinition>(
  options?: ServerGraphOptions<Vars>
): ServerGraphApi<Vars, ServerLang, ServerGraphMode>
function server<Vars extends VariablesDefinition = VariablesDefinition>(
  options?: ServerGraphOptions<Vars>
): any {
  type ResolvedLang = ServerLang
  type ResolvedMode = ServerGraphMode
  const graphType = resolveServerGraphType(options?.type)
  const graphMode = resolveServerGraphMode(options?.mode)
  assertServerGraphModeCompatible(graphMode, graphType)
  const lang = options?.lang ?? 'en'
  const useZhAliases = lang === 'zh'
  const { variables, metaByName } = parseVariableDefinitions(options?.variables)
  const registry = new MetaCallRegistry(
    graphType,
    graphMode,
    options?.id,
    options?.name,
    options?.prefix !== false,
    variables,
    metaByName
  )
  serverRegistries.push(registry)
  const resolveEventName = (eventName: ServerEventNameAny): ServerEventName => {
    if (!useZhAliases) return eventName as ServerEventName
    return (
      (SERVER_EVENT_ZH_TO_EN as Record<string, ServerEventName>)[eventName as string] ??
      (eventName as ServerEventName)
    )
  }

  const applyZhAliases = (fns: ServerExecutionFlowFunctions) => {
    const target = fns as unknown as Record<string, unknown>
    for (const [zhName, enName] of Object.entries(SERVER_F_ZH_TO_EN)) {
      if (Object.prototype.hasOwnProperty.call(target, zhName)) continue
      const fn = (target[enName] as (...args: unknown[]) => unknown) ?? undefined
      if (typeof fn !== 'function') continue
      Object.defineProperty(target, zhName, {
        value: fn,
        writable: false,
        configurable: false,
        enumerable: false
      })
    }
  }

  const runHandler = <E extends ServerEventNameAny>(
    eventName: E,
    handler: (
      evt: ServerEventPayloadsByMode<ResolvedMode>[ServerEventNameToEn<E>],
      f: ServerExecutionFlowFunctionsForLang<Vars, ResolvedLang, ResolvedMode>
    ) => void,
    inputArgs: value[] = []
  ) => {
    const resolvedEventName = resolveEventName(eventName) as ServerEventNameToEn<E>
    const wrappedHandler = (
      evt: ServerEventPayloadsByMode<ResolvedMode>[ServerEventNameToEn<E>],
      f: ServerExecutionFlowFunctions
    ) => {
      if (useZhAliases) applyZhAliases(f)
      handler(
        evt,
        f as unknown as ServerExecutionFlowFunctionsForLang<Vars, ResolvedLang, ResolvedMode>
      )
    }
    registry.runServerHandler(resolvedEventName, wrappedHandler, inputArgs)
  }

  const api = {
    on<E extends ServerEventNameAny>(
      eventName: E,
      handler: (
        evt: ServerEventPayloadsByMode<ResolvedMode>[ServerEventNameToEn<E>],
        f: ServerExecutionFlowFunctionsForLang<Vars, ResolvedLang, ResolvedMode>
      ) => void
    ) {
      runHandler(eventName, handler)
      return this
    },
    onSignal(
      signalName: string,
      handler: (
        evt: ServerEventPayloadsByMode<ResolvedMode>['monitorSignal'] & Record<string, any>,
        f: ServerExecutionFlowFunctionsForLang<Vars, ResolvedLang, ResolvedMode>
      ) => void,
      signalArgs?: Array<{ name: string; type: string }>
    ) {
      const signalNameObj = ensureLiteralStr(signalName, 'signalName')
      const inputArgs: value[] & { _signalArgs?: Array<{ name: string; type: string }> } = [signalNameObj]
      if (signalArgs && signalArgs.length > 0) {
        inputArgs._signalArgs = signalArgs
      }
      runHandler('monitorSignal', handler, inputArgs)
      return this
    }
  }
  return api as ServerGraphApi<Vars, ResolvedLang, ResolvedMode>
}

export const g = {
  server
}

export function printServerGraphRegistries() {
  console.log(JSON.stringify(serverRegistries, null, 2))
}

function removeUnusedNodesFromFlow(flow: ExecutionFlow): ExecutionFlow | null {
  const execById = new Map<number, MetaCallRecord>()
  const dataById = new Map<number, MetaCallRecord>()
  flow.execNodes.forEach((n) => execById.set(n.id, n))
  flow.dataNodes.forEach((n) => dataById.set(n.id, n))

  const reachableExecIds = new Set<number>()
  const visited = new Set<number>([flow.eventNode.id])
  const queue: number[] = [flow.eventNode.id]

  while (queue.length) {
    const current = queue.shift()!
    const nextList = flow.edges[current] ?? []
    nextList.forEach((conn) => {
      const targetId = typeof conn === 'number' ? conn : conn.node_id
      if (!visited.has(targetId)) {
        visited.add(targetId)
        queue.push(targetId)
      }
      if (execById.has(targetId)) reachableExecIds.add(targetId)
    })
  }

  if (reachableExecIds.size === 0) {
    return null
  }

  const usedDataIds = new Set<number>()
  const dataQueue: number[] = []
  const enqueueData = (id: number) => {
    if (usedDataIds.has(id)) return
    usedDataIds.add(id)
    dataQueue.push(id)
  }

  const collectDataDeps = (record: MetaCallRecord) => {
    for (const arg of record.args) {
      const meta = arg.getMetadata()
      if (!meta || meta.kind !== 'pin') continue
      const depId = meta.record.id
      if (dataById.has(depId)) enqueueData(depId)
    }
  }

  reachableExecIds.forEach((id) => {
    const record = execById.get(id)
    if (record) collectDataDeps(record)
  })

  while (dataQueue.length) {
    const id = dataQueue.shift()!
    const record = dataById.get(id)
    if (record) collectDataDeps(record)
  }

  const filteredExecNodes = flow.execNodes.filter((n) => reachableExecIds.has(n.id))
  const filteredDataNodes = flow.dataNodes.filter((n) => usedDataIds.has(n.id))
  const allowedFromIds = new Set<number>([flow.eventNode.id, ...reachableExecIds])
  const filteredEdges: typeof flow.edges = {}

  for (const [fromIdRaw, nextList] of Object.entries(flow.edges)) {
    const fromId = Number(fromIdRaw)
    if (!allowedFromIds.has(fromId)) continue
    const filteredNext = nextList.filter((conn) =>
      reachableExecIds.has(typeof conn === 'number' ? conn : conn.node_id)
    )
    if (filteredNext.length) filteredEdges[fromId] = filteredNext
  }

  return {
    ...flow,
    execNodes: filteredExecNodes,
    dataNodes: filteredDataNodes,
    edges: filteredEdges
  }
}

export function buildServerGraphRegistriesIRDocuments(opts: IRBuildOptions = {}) {
  const removeUnusedNodes = getRuntimeOptions().optimize.removeUnusedNodes
  const prefixName = (raw: string, enable: boolean) => {
    if (!enable) return raw
    if (raw.startsWith('_GSTS')) return raw
    return `_GSTS_${raw}`
  }

  const resolveName = (registry: MetaCallRegistry): string | undefined => {
    const raw = registry.getGraphName()
    if (typeof raw === 'string' && raw.length) return prefixName(raw, registry.shouldPrefixName())
    const def = opts.defaultName
    if (typeof def === 'string' && def.length) return prefixName(def, registry.shouldPrefixName())
    return '_GSTS_Generated_Graph'
  }

  const list = serverRegistries.map((registry) => {
    const flows = registry.getFlows()
    const optimizedFlows = removeUnusedNodes
      ? flows.map(removeUnusedNodesFromFlow).filter((flow) => flow !== null)
      : flows
    return buildIRDocument({
      flows: optimizedFlows,
      variables: registry.getVariables(),
      serverSubType: registry.getGraphType(),
      serverMode: registry.getGraphMode(),
      graphId: registry.getGraphId(),
      graphName: resolveName(registry)
    })
  })
  return list
}
