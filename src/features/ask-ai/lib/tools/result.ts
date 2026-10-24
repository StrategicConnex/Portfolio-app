export type DataMode = 'live' | 'static' | 'demo'

export interface Provenance {
  source: string
  mode: DataMode
  fetchedAt?: string
}

export interface ToolResult<T> {
  data: T
  provenance: Provenance[]
  warnings?: string[]
}
