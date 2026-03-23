import type { value } from './value.js'

export type MetaCallRecordType = 'event' | 'exec' | 'data'

export interface MetaCallRecord {
  id: number
  type: MetaCallRecordType
  nodeType: string
  args: value[]
  signalParams?: Array<{ name: string; type: string }>
}

export type MetaCallRecordRef = Readonly<MetaCallRecord>
