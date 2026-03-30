import fs from 'node:fs'

import { parseMessage } from '../injector/binary.js'
import { findNodeGraphTargets } from '../injector/node_graph.js'
import { loadGiaProto } from '../injector/proto.js'
import { readGilNodeGraph, readGilNodeGraphs } from '../injector/reader.js'
import type { NodeDetail, NodeGraphDetail, NodeGraphSummary } from '../injector/reader.js'
import type { LenField } from '../injector/types.js'
import { createUi } from './ui.js'

const ui = createUi()

export type InspectOptions = {
  id?: string
  json?: boolean
  raw?: boolean
}

function formatSummaryTable(summaries: NodeGraphSummary[]): void {
  if (summaries.length === 0) {
    ui.info('No NodeGraphs found in this file.')
    return
  }

  const header = `  ${'ID'.padEnd(14)} ${'Name'.padEnd(24)} ${'Type'.padEnd(10)} ${'Nodes'.padEnd(7)} Variables`
  const sep = '  ' + '-'.repeat(header.length - 2)
  console.log(`\nFound ${summaries.length} node graph${summaries.length !== 1 ? 's' : ''}:\n`)
  console.log(header)
  console.log(sep)
  for (const s of summaries) {
    const id = String(s.id).padEnd(14)
    const name = (s.name || '(empty)').padEnd(24)
    const type = s.graphTypeName.padEnd(10)
    const nodes = String(s.nodeCount).padEnd(7)
    console.log(`  ${id} ${name} ${type} ${nodes} ${s.variableCount}`)
  }
  console.log()
}

function formatConnectionChain(nodes: NodeDetail[]): string {
  if (nodes.length === 0) return '(none)'
  // Build adjacency list from outflow targets
  const byIndex = new Map<number, NodeDetail>(nodes.map((n) => [n.index, n]))
  const allTargets = new Set<number>(nodes.flatMap((n) => n.outflowTargets))
  const roots = nodes.filter((n) => !allTargets.has(n.index))

  function buildChain(nodeIndex: number, visited = new Set<number>()): string {
    if (visited.has(nodeIndex)) return `#${nodeIndex}(loop)`
    visited.add(nodeIndex)
    const node = byIndex.get(nodeIndex)
    if (!node) return `#${nodeIndex}`
    const label = `#${nodeIndex}(${node.typeName})`
    if (node.outflowTargets.length === 0) return label
    if (node.outflowTargets.length === 1) {
      return `${label} -> ${buildChain(node.outflowTargets[0], new Set(visited))}`
    }
    const branches = node.outflowTargets
      .map((t, i) => `branch[${i}]: ${buildChain(t, new Set(visited))}`)
      .join(', ')
    return `${label} -> {${branches}}`
  }

  return roots.map((r) => buildChain(r.index)).join(' | ')
}

function formatDetail(detail: NodeGraphDetail): void {
  console.log(`\nNodeGraph: ${detail.name || '(unnamed)'} (id=${detail.id}, type=${detail.graphTypeName})\n`)

  if (detail.variables.length > 0) {
    console.log(`Variables (${detail.variables.length}):`)
    for (const v of detail.variables) {
      const val = v.initialValue !== undefined ? ` = ${v.initialValue}` : ''
      console.log(`  ${v.name.padEnd(20)} ${v.typeName}${val}`)
    }
    console.log()
  } else {
    console.log('Variables: (none)\n')
  }

  if (detail.nodes.length > 0) {
    console.log(`Nodes (${detail.nodes.length}):`)
    for (const n of detail.nodes) {
      const entry = n.isEventEntry ? '  [event entry]' : ''
      const signal = n.signalName ? `  (signal: "${n.signalName}")` : ''
      console.log(`  #${String(n.index).padEnd(4)} ${n.typeName}${entry}${signal}`)
    }
    console.log()
    console.log('Connections:')
    console.log(`  ${formatConnectionChain(detail.nodes)}`)
    console.log()
  } else {
    console.log('Nodes: (empty graph)\n')
  }
}

export function runInspect(
  filePath: string,
  cmdOpts: InspectOptions
): void {
  let gilBytes: Uint8Array
  try {
    gilBytes = new Uint8Array(fs.readFileSync(filePath))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    ui.error(`Cannot read file: ${msg}`)
    process.exitCode = 1
    return
  }

  try {
    if (cmdOpts.id !== undefined) {
      const targetId = parseInt(cmdOpts.id, 10)
      if (!Number.isFinite(targetId)) {
        ui.error(`Invalid id: ${cmdOpts.id}`)
        process.exitCode = 1
        return
      }
      const detail = readGilNodeGraph(gilBytes, targetId)

      if (cmdOpts.json) {
        if (cmdOpts.raw) {
          // raw mode: output the raw decoded protobuf NodeGraph object
          const proto = loadGiaProto()
          const payload = gilBytes.slice(20, -4)
          const fields: LenField[] = []
          const nodeGraphBlobFields: LenField[] = []
          parseMessage(payload, 0, payload.length, 0, 0, 0, 0, 0, 0, 0, fields, { nodeGraphBlobFields })
          const scanFields = nodeGraphBlobFields.length ? nodeGraphBlobFields : fields
          const matches = findNodeGraphTargets(payload, scanFields, proto.nodeGraphMessage, targetId)
          if (matches.length > 0) {
            console.log(JSON.stringify(matches[0].obj, null, 2))
          }
        } else {
          console.log(JSON.stringify(detail, null, 2))
        }
      } else {
        formatDetail(detail)
      }
    } else {
      const summaries = readGilNodeGraphs(gilBytes)

      if (cmdOpts.json) {
        console.log(JSON.stringify(summaries, null, 2))
      } else {
        formatSummaryTable(summaries)
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    ui.error(msg.replace('[error]', '').trim())
    process.exitCode = 1
  }
}
