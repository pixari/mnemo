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

let _connection: Connection | null = null
let _table: Table<VectorRecord> | null = null

async function getConnection(lanceDir: string): Promise<Connection> {
  if (!_connection) {
    mkdirSync(lanceDir, { recursive: true })
    _connection = await connect(lanceDir)
  }
  return _connection
}

async function getTable(lanceDir: string): Promise<Table<VectorRecord>> {
  if (_table) return _table
  const conn = await getConnection(lanceDir)
  const tables = await conn.tableNames()
  if (tables.includes('items')) {
    _table = (await conn.openTable('items')) as Table<VectorRecord>
  } else {
    _table = (await conn.createTable('items', [])) as Table<VectorRecord>
  }
  return _table
}

export async function upsertVectors(lanceDir: string, records: VectorRecord[]): Promise<void> {
  if (records.length === 0) return
  const table = await getTable(lanceDir)

  const existingIds = records.map(r => r.id)
  if (existingIds.length > 0) {
    try {
      const filter = existingIds.map(id => `id = '${id}'`).join(' OR ')
      await table.delete(filter)
    } catch {
      // table may be empty — ignore
    }
  }

  await table.add(records)
}

export async function deleteVectorsBySourceId(lanceDir: string, sourceId: string): Promise<void> {
  try {
    const table = await getTable(lanceDir)
    await table.delete(`source_id = '${sourceId}'`)
  } catch {
    // table may not exist yet
  }
}

export async function searchVectors(
  lanceDir: string,
  queryEmbedding: number[],
  limit: number
): Promise<Array<{ source_id: string; content_chunk: string; score: number }>> {
  try {
    const table = await getTable(lanceDir)
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
    const table = await getTable(lanceDir)
    const filter = ids.map(id => `source_id = '${id}'`).join(' OR ')
    await table.delete(filter)
  } catch {
    // ignore
  }
}

export async function countVectors(lanceDir: string): Promise<number> {
  try {
    const table = await getTable(lanceDir)
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
    _table = (await conn.createTable('items', records)) as Table<VectorRecord>
  } else {
    _table = (await conn.createTable('items', [])) as Table<VectorRecord>
  }
}
