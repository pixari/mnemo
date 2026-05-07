import { statSync, existsSync } from 'fs'
import { getMnemoDir, getLanceDir, assertMnemoInit } from '../config.js'
import { openDb, listItems, listStaleItems } from '../db/sqlite.js'
import { countVectors } from '../db/lancedb.js'
import { join } from 'path'
import { print, success } from '../utils/output.js'

export async function runStats(): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)

  const db = openDb(mnemoDir)
  const items = listItems(db)
  const stale = listStaleItems(db)
  db.close()

  const lanceDir = getLanceDir(mnemoDir)
  const totalChunks = await countVectors(lanceDir)

  const dbPath = join(mnemoDir, 'mnemo.db')
  const dbSize = existsSync(dbPath) ? statSync(dbPath).size : 0

  const byType = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.source_type] = (acc[item.source_type] ?? 0) + 1
    return acc
  }, {})

  print(success({
    total_items: items.length,
    total_chunks: totalChunks,
    stale_items: stale.length,
    by_source_type: byType,
    db_size_bytes: dbSize,
  }))
}
