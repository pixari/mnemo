import { getMnemoDir, assertMnemoInit } from '../config.js'
import { openDb, listStaleItems } from '../db/sqlite.js'
import { print, success } from '../utils/output.js'
import { isTTY, bold, dim, warn, line } from '../utils/fmt.js'

export async function runStale(): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)

  const db = openDb(mnemoDir)
  const raw = listStaleItems(db)
  db.close()

  if (isTTY()) {
    if (raw.length === 0) {
      line()
      line(dim('No stale items.'))
      line()
      return
    }
    line()
    for (const item of raw) {
      line(`${warn('[STALE]')} ${bold(item.title)}`)
      line(dim(`  ${item.id}  ·  ingested: ${item.ingested_at.slice(0, 10)}  ·  stale after: ${item.stale_after_days}d`))
    }
    line()
    line(dim(`${raw.length} stale item${raw.length === 1 ? '' : 's'}`))
    line()
  } else {
    print(success({
      total: raw.length,
      items: raw.map(item => ({
        id: item.id,
        title: item.title,
        source_type: item.source_type,
        ingested_at: item.ingested_at,
        last_refreshed: item.last_refreshed,
        stale_after_days: item.stale_after_days,
      })),
    }))
  }
}
