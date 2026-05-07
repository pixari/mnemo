import { getMnemoDir, assertMnemoInit } from '../config.js'
import { openDb, listItems, listStaleItems } from '../db/sqlite.js'
import { print, success } from '../utils/output.js'

interface ListOptions {
  staleOnly?: boolean
}

export async function runList(opts: ListOptions): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)

  const db = openDb(mnemoDir)
  const raw = opts.staleOnly ? listStaleItems(db) : listItems(db)
  const staleIds = new Set(listStaleItems(db).map(i => i.id))
  db.close()

  const items = raw.map(item => ({
    id: item.id,
    title: item.title,
    source_type: item.source_type,
    ingested_at: item.ingested_at,
    tags: JSON.parse(item.tags ?? '[]'),
    stale: staleIds.has(item.id),
  }))

  print(success({ total: items.length, items }))
}
