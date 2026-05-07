import { connect } from 'vectordb'
import type { Connection, Table } from 'vectordb'
import { mkdirSync } from 'fs'

export interface VectorRecord {
  id: string
  source_id: string
  chunk_index: number
  content_chunk: string
  embedding: number[]
}

// vectordb types Table<T> where T is the embedding element type (number[]),
// not the record shape — use unknown to avoid the mismatch.
type AnyTable = Table<unknown>

let _connection: Connection | null = null
let _table: AnyTable | null = null

async function getConnection(lanceDir: string): Promise<Connection> {
  if (!_connection) {
    mkdirSync(lanceDir, { recursive: true })
    _connection = await connect(lanceDir)
  }
  return _connection
}

async function openTable(lanceDir: string): Promise<AnyTable | null> {
  if (_table) return _table
  const conn = await getConnection(lanceDir)
  const tables = await conn.tableNames()
  if (tables.includes('items')) {
    _table = (await conn.openTable('items')) as unknown as AnyTable
    return _table
  }
  return null
}

export async function upsertVectors(lanceDir: string, records: VectorRecord[]): Promise<void> {
  if (records.length === 0) return
  const conn = await getConnection(lanceDir)

  if (!_table) {
    const tables = await conn.tableNames()
    if (tables.includes('items')) {
      _table = (await conn.openTable('items')) as unknown as AnyTable
    } else {
      _table = (await conn.createTable('items', records)) as unknown as AnyTable
      return
    }
  }

  try {
    const filter = records.map(r => `id = '${r.id}'`).join(' OR ')
    await _table.delete(filter)
  } catch {
    // table may be empty — ignore
  }

  await _table.add(records)
}

export async function deleteVectorsBySourceId(lanceDir: string, sourceId: string): Promise<void> {
  try {
    const table = await openTable(lanceDir)
    if (!table) return
    await table.delete(`source_id = '${sourceId}'`)
  } catch {
    // ignore
  }
}

export async function searchVectors(
  lanceDir: string,
  queryEmbedding: number[],
  limit: number
): Promise<Array<{ source_id: string; content_chunk: string; score: number }>> {
  try {
    const table = await openTable(lanceDir)
    if (!table) return []
    const results = await table.search(queryEmbedding).limit(limit * 3).execute()
    const seen = new Set<string>()
    const deduped: Array<{ source_id: string; content_chunk: string; score: number }> = []
    for (const r of results) {
      const rec = r as unknown as VectorRecord & { _distance: number }
      if (!seen.has(rec.source_id)) {
        seen.add(rec.source_id)
        deduped.push({
          source_id: rec.source_id,
          content_chunk: rec.content_chunk,
          score: 1 - (rec._distance ?? 0),
        })
      }
      if (deduped.length >= limit) break
    }
    return deduped
  } catch {
    return []
  }
}

export async function deleteAllVectorsBySourceId(lanceDir: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return
  try {
    const table = await openTable(lanceDir)
    if (!table) return
    const filter = ids.map(id => `source_id = '${id}'`).join(' OR ')
    await table.delete(filter)
  } catch {
    // ignore
  }
}

export async function countVectors(lanceDir: string): Promise<number> {
  try {
    const table = await openTable(lanceDir)
    if (!table) return 0
    const all = await table.search(new Array(384).fill(0)).limit(100_000).execute()
    return all.length
  } catch {
    return 0
  }
}

export async function rebuildTable(lanceDir: string, records: VectorRecord[]): Promise<void> {
  const conn = await getConnection(lanceDir)
  const tables = await conn.tableNames()
  if (tables.includes('items')) {
    await conn.dropTable('items')
  }
  _table = null
  if (records.length > 0) {
    _table = (await conn.createTable('items', records)) as unknown as AnyTable
  }
}
