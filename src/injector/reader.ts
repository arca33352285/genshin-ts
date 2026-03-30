import { NODE_ID as _NODE_ID } from '../thirdparty/Genshin-Impact-Miliastra-Wonderland-Code-Node-Editor-Pack/node_data/node_id.js'
import { parseMessage, readUint32BE } from './binary.js'
import { buildGraphTypeMap, findNodeGraphTargets } from './node_graph.js'
import { loadGiaProto } from './proto.js'
import type { LenField } from './types.js'

// VarType enum values from gia.proto
const VAR_TYPE_NAMES: Record<number, string> = {
  1: 'entity',
  2: 'guid',
  3: 'int',
  4: 'bool',
  5: 'float',
  6: 'str',
  7: 'guid_list',
  8: 'int_list',
  9: 'bool_list',
  10: 'float_list',
  11: 'str_list',
  12: 'vec3',
  13: 'entity_list',
  14: 'enum',
  15: 'vec3_list',
  16: 'local_variable',
  17: 'faction',
  20: 'config_id',
  21: 'prefab_id',
  22: 'config_id_list',
  23: 'prefab_id_list',
  24: 'faction_list',
  25: 'struct',
  26: 'struct_list',
  27: 'dict',
  28: 'variable_snapshot'
}

// NodeGraph.Id.Type values from gia.proto
const GRAPH_TYPE_NAMES: Record<number, string> = {
  20000: 'entity',
  20001: 'filter',
  20002: 'skills',
  20003: 'status',
  20004: 'class',
  20005: 'item',
  20006: 'integer_filter'
}

export type NodeGraphSummary = {
  id: number
  name: string
  graphType: number
  graphTypeName: string
  nodeCount: number
  variableCount: number
}

export type VariableDetail = {
  name: string
  varType: number
  typeName: string
  initialValue?: string
}

export type NodeDetail = {
  index: number
  nodeId: number
  typeName: string
  x: number
  y: number
  outflowTargets: number[]
  isEventEntry: boolean
  /** Signal name extracted from ClientExecNode pin (only for signal nodes) */
  signalName?: string
}

export type NodeGraphDetail = NodeGraphSummary & {
  variables: VariableDetail[]
  nodes: NodeDetail[]
}

// Build a reverse map from nodeId int → canonical node name
// Prefer non-generic names: when multiple keys share the same ID, skip __Generic suffixes
const NODE_ID = _NODE_ID as unknown as Record<string, number>
const NODE_ID_BY_INT: Map<number, string> = (() => {
  const map = new Map<number, string>()
  for (const [key, id] of Object.entries(NODE_ID)) {
    if (!map.has(id)) {
      map.set(id, key)
    } else if (!key.includes('__Generic')) {
      // replace generic placeholder with cleaner non-generic name
      const existing = map.get(id)!
      if (existing.includes('__Generic')) {
        map.set(id, key)
      }
    }
  }
  return map
})()

function getNodeIdByInt(): Map<number, string> {
  return NODE_ID_BY_INT
}

function resolveNodeTypeName(nodeId: number): string {
  const map = getNodeIdByInt()
  const raw = map.get(nodeId)
  if (!raw) return `node_${nodeId}`
  // Strip __Generic and similar suffixes, then convert Title_Case to camelCase
  return raw
    .replace(/__.*$/, '')
    .toLowerCase()
    .replace(/_([a-z])/g, (_, c: string) => (c as string).toUpperCase())
}

// Event entry nodes have OutFlow pins but are never the target of another node's OutFlow connect.
// We detect this in two steps: first mark which node indices receive InFlow connections from others,
// then any node with an OutFlow pin that is NOT an InFlow target is an event entry.
// Note: pin kind is a string from protobuf ("InFlow", "OutFlow", "InParam", "OutParam", etc.)
function hasOutFlowPin(node: Record<string, unknown>): boolean {
  const pins = node.pins as Array<Record<string, unknown>> | undefined
  if (!pins) return false
  for (const pin of pins) {
    const i1 = pin.i1 as { kind?: string | number } | undefined
    const i2 = pin.i2 as { kind?: string | number } | undefined
    if (i1?.kind === 'OutFlow' || i1?.kind === 2 || i2?.kind === 'OutFlow' || i2?.kind === 2) {
      return true
    }
  }
  return false
}

function collectInFlowTargets(nodes: Array<Record<string, unknown>>): Set<number> {
  const targets = new Set<number>()
  for (const node of nodes) {
    const pins = node.pins as Array<Record<string, unknown>> | undefined
    if (!pins) continue
    for (const pin of pins) {
      const i1 = pin.i1 as { kind?: string | number } | undefined
      const i2 = pin.i2 as { kind?: string | number } | undefined
      const isOutFlow =
        i1?.kind === 'OutFlow' || i1?.kind === 2 || i2?.kind === 'OutFlow' || i2?.kind === 2
      if (!isOutFlow) continue
      const connects = pin.connects as Array<Record<string, unknown>> | undefined
      if (!connects) continue
      for (const conn of connects) {
        const id = conn.id
        if (typeof id === 'number') targets.add(id)
      }
    }
  }
  return targets
}

function getOutflowTargets(node: Record<string, unknown>): number[] {
  const pins = node.pins as Array<Record<string, unknown>> | undefined
  if (!pins) return []
  const targets: number[] = []
  for (const pin of pins) {
    const i1 = pin.i1 as { kind?: string | number } | undefined
    const i2 = pin.i2 as { kind?: string | number } | undefined
    // OutFlow pins carry connections to next nodes (kind can be string or int)
    const isOutFlow =
      i1?.kind === 'OutFlow' || i1?.kind === 2 || i2?.kind === 'OutFlow' || i2?.kind === 2
    if (!isOutFlow) continue
    const connects = pin.connects as Array<Record<string, unknown>> | undefined
    if (!connects) continue
    for (const conn of connects) {
      const id = conn.id
      if (typeof id === 'number') targets.push(id)
    }
  }
  return targets
}

// NodeProperty.Kind enum value for SysGraph (signal/special graph nodes)
const SYS_GRAPH_KIND = 22001

// Extract signal name from a signal node (kind=SysGraph/22001) by reading the ClientExecNode pin's string value
function extractSignalName(node: Record<string, unknown>): string | undefined {
  const genericId = node.genericId as { kind?: string | number } | undefined
  // protobuf enum: raw value is int (22001), toJSON() produces string ("SysGraph")
  if (genericId?.kind !== SYS_GRAPH_KIND && genericId?.kind !== 'SysGraph') return undefined
  const pins = node.pins as Array<Record<string, unknown>> | undefined
  if (!pins) return undefined
  for (const pin of pins) {
    const i1 = pin.i1 as { kind?: string | number } | undefined
    const i2 = pin.i2 as { kind?: string | number } | undefined
    if (i1?.kind === 'ClientExecNode' || i1?.kind === 5 || i2?.kind === 'ClientExecNode' || i2?.kind === 5) {
      const value = pin.value as { bString?: { val?: string } } | undefined
      if (typeof value?.bString?.val === 'string') return value.bString.val
    }
  }
  return undefined
}

function toNumberSafe(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'bigint') return Number(v)
  if (v && typeof v === 'object') {
    const anyV = v as { toNumber?: () => number }
    if (typeof anyV.toNumber === 'function') {
      const n = anyV.toNumber()
      return Number.isFinite(n) ? n : undefined
    }
  }
  return undefined
}

function decodeInitialValue(values: Record<string, unknown> | undefined): string | undefined {
  if (!values) return undefined
  // Check common base value fields (from VarBase oneof)
  const bInt = values.bInt as { val?: unknown } | undefined
  if (bInt?.val !== undefined) return String(toNumberSafe(bInt.val) ?? bInt.val)

  const bFloat = values.bFloat as { val?: unknown } | undefined
  if (bFloat?.val !== undefined) return String(toNumberSafe(bFloat.val) ?? bFloat.val)

  const bString = values.bString as { val?: unknown } | undefined
  if (typeof bString?.val === 'string') return JSON.stringify(bString.val)

  const bEnum = values.bEnum as { val?: unknown } | undefined
  if (bEnum?.val !== undefined) return String(toNumberSafe(bEnum.val) ?? bEnum.val)

  const bVector = values.bVector as { val?: { x?: unknown; y?: unknown; z?: unknown } } | undefined
  if (bVector?.val) {
    const { x, y, z } = bVector.val
    return `vec3(${toNumberSafe(x) ?? 0}, ${toNumberSafe(y) ?? 0}, ${toNumberSafe(z) ?? 0})`
  }

  const bId = values.bId as { val?: unknown } | undefined
  if (bId?.val !== undefined) return String(toNumberSafe(bId.val) ?? bId.val)

  return undefined
}

function decodeNodeGraph(obj: Record<string, unknown>): NodeGraphDetail {
  const rawId = obj.id as { type?: unknown; id?: unknown } | undefined
  const graphType = toNumberSafe(rawId?.type) ?? 0
  const id = toNumberSafe(rawId?.id) ?? 0
  const name = typeof obj.name === 'string' ? obj.name : ''
  const graphTypeName = GRAPH_TYPE_NAMES[graphType] ?? 'unknown'

  const rawVars = obj.graphValues as Array<Record<string, unknown>> | undefined
  const variables: VariableDetail[] = (rawVars ?? []).map((v) => {
    const varName = typeof v.name === 'string' ? v.name : '?'
    const varType = toNumberSafe(v.type) ?? 0
    const typeName = VAR_TYPE_NAMES[varType] ?? `vartype_${varType}`
    const initialValue = decodeInitialValue(v.values as Record<string, unknown> | undefined)
    return { name: varName, varType, typeName, initialValue }
  })

  const rawNodes = obj.nodes as Array<Record<string, unknown>> | undefined
  const rawNodesArr = rawNodes ?? []
  // Two-pass event entry detection:
  // 1. Collect all node indices that receive InFlow connections from other nodes
  const inflowTargets = collectInFlowTargets(rawNodesArr)
  // 2. A node is an event entry if it has OutFlow pins but is never an InFlow target
  const nodes: NodeDetail[] = rawNodesArr.map((n) => {
    const index = toNumberSafe(n.nodeIndex) ?? 0
    const genericId = n.genericId as { nodeId?: unknown } | undefined
    const concreteId = n.concreteId as { nodeId?: unknown } | undefined
    const nodeId = toNumberSafe(concreteId?.nodeId ?? genericId?.nodeId) ?? 0
    const typeName = resolveNodeTypeName(nodeId)
    const x = toNumberSafe(n.x) ?? 0
    const y = toNumberSafe(n.y) ?? 0
    const outflowTargets = getOutflowTargets(n)
    const isEventEntry = hasOutFlowPin(n) && !inflowTargets.has(index)
    const signalName = extractSignalName(n)
    return { index, nodeId, typeName, x, y, outflowTargets, isEventEntry, signalName }
  })

  return {
    id,
    name,
    graphType,
    graphTypeName,
    nodeCount: nodes.length,
    variableCount: variables.length,
    variables,
    nodes
  }
}

function parseGilPayload(gilBytes: Uint8Array): {
  payload: Uint8Array
  fields: LenField[]
  nodeGraphBlobFields: LenField[]
} {
  if (gilBytes.length < 24) {
    throw new Error('[error] GIL file too short')
  }
  const headTag = readUint32BE(gilBytes, 8)
  const tailTag = readUint32BE(gilBytes, gilBytes.length - 4)
  if (headTag !== 0x0326 || tailTag !== 0x0679) {
    throw new Error('[error] invalid GIL header tags')
  }
  const payload = gilBytes.slice(20, -4)
  const fields: LenField[] = []
  const nodeGraphBlobFields: LenField[] = []
  parseMessage(payload, 0, payload.length, 0, 0, 0, 0, 0, 0, 0, fields, { nodeGraphBlobFields })
  return { payload, fields, nodeGraphBlobFields }
}

/**
 * Read all NodeGraph summaries from a GIL file.
 * Does not fully decode each graph — uses the fast varint scanner for id/type only.
 */
export function readGilNodeGraphs(gilBytes: Uint8Array, protoPath?: string): NodeGraphSummary[] {
  const { payload, fields, nodeGraphBlobFields } = parseGilPayload(gilBytes)
  const proto = loadGiaProto(protoPath)
  const scanFields = nodeGraphBlobFields.length ? nodeGraphBlobFields : fields

  // buildGraphTypeMap gives us all id→type mappings without full decode
  const idToType = buildGraphTypeMap(payload, scanFields, proto.nodeGraphMessage)

  // We need names and counts — do a minimal decode for each graph blob
  const summaries: NodeGraphSummary[] = []
  const seenIds = new Set<number>()

  for (const f of scanFields) {
    const depth3 = f.depth === 3 && f.p0 === 10 && f.p1 === 1 && f.p2 === 1
    if (!depth3) continue
    const slice = payload.subarray(f.dataStart, f.dataEnd)
    let obj: Record<string, unknown>
    try {
      obj = proto.nodeGraphMessage.decode(slice) as unknown as Record<string, unknown>
    } catch {
      continue
    }
    const rawId = obj.id as { type?: unknown; id?: unknown } | undefined
    const id = toNumberSafe(rawId?.id)
    if (id === undefined) continue
    if (seenIds.has(id)) continue
    seenIds.add(id)

    const graphType = idToType.get(id) ?? toNumberSafe(rawId?.type) ?? 0
    const graphTypeName = GRAPH_TYPE_NAMES[graphType] ?? 'unknown'
    const name = typeof obj.name === 'string' ? obj.name : ''
    const nodeCount = Array.isArray(obj.nodes) ? (obj.nodes as unknown[]).length : 0
    const varCount = Array.isArray(obj.graphValues) ? (obj.graphValues as unknown[]).length : 0

    summaries.push({ id, name, graphType, graphTypeName, nodeCount, variableCount: varCount })
  }

  // Sort by id for stable output
  summaries.sort((a, b) => a.id - b.id)
  return summaries
}

/**
 * Read and fully decode a single NodeGraph by ID from a GIL file.
 */
export function readGilNodeGraph(
  gilBytes: Uint8Array,
  targetId: number,
  protoPath?: string
): NodeGraphDetail {
  const { payload, fields, nodeGraphBlobFields } = parseGilPayload(gilBytes)
  const proto = loadGiaProto(protoPath)
  const scanFields = nodeGraphBlobFields.length ? nodeGraphBlobFields : fields

  const matches = findNodeGraphTargets(payload, scanFields, proto.nodeGraphMessage, targetId)
  if (matches.length === 0) {
    throw new Error(`[error] NodeGraph not found: ${targetId}`)
  }
  return decodeNodeGraph(matches[0].obj)
}
