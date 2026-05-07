import { readFileSync, existsSync } from 'fs'
import { getMnemoDir, assertMnemoInit } from '../config.js'
import { openDb, getItem, listStaleItems } from '../db/sqlite.js'
import { print, success, failure } from '../utils/output.js'

export async function runShow(id: string): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)

  const db = openDb(mnemoDir)
  const item = getItem(db, id)
  const staleIds = new Set(listStaleItems(db).map(i => i.id))
  db.close()

  if (!item) {
    print(failure(`Item not found: ${id}`))
    return
  }

  const content = existsSync(item.file_path)
    ? readFileSync(item.file_path, 'utf8')
    : null

  print(success({
    id: item.id,
    title: item.title,
    source_type: item.source_type,
    source_url: item.source_url,
    ingested_at: item.ingested_at,
    last_refreshed: item.last_refreshed,
    stale_after_days: item.stale_after_days,
    tags: JSON.parse(item.tags ?? '[]'),
    stale: staleIds.has(item.id),
    content,
  }))
}
