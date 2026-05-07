import { getMnemoDir, assertMnemoInit } from '../config.js'
import { openDb, listStaleItems } from '../db/sqlite.js'
import { print, success } from '../utils/output.js'

export async function runStale(): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)

  const db = openDb(mnemoDir)
  const raw = listStaleItems(db)
  db.close()

  const items = raw.map(item => ({
    id: item.id,
    title: item.title,
    source_type: item.source_type,
    ingested_at: item.ingested_at,
    last_refreshed: item.last_refreshed,
    stale_after_days: item.stale_after_days,
  }))

  print(success({ total: items.length, items }))
}
