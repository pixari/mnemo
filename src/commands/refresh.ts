import { getMnemoDir, assertMnemoInit } from '../config.js'
import { openDb, getItem } from '../db/sqlite.js'
import { print, success, failure } from '../utils/output.js'

interface RefreshOptions {
  allStale?: boolean
}

export async function runRefresh(id: string, opts: RefreshOptions): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)

  const db = openDb(mnemoDir)

  if (opts.allStale) {
    const { listStaleItems } = await import('../db/sqlite.js')
    const stale = listStaleItems(db)
    db.close()
    print(success({
      stale_count: stale.length,
      items: stale.map(i => ({ id: i.id, title: i.title, source_url: i.source_url })),
      message: 'To refresh, have Claude Code re-read the source and run: mnemo add "<updated content>"',
    }))
    return
  }

  const item = getItem(db, id)
  db.close()

  if (!item) {
    print(failure(`Item not found: ${id}`))
    return
  }

  print(success({
    id: item.id,
    title: item.title,
    source_url: item.source_url,
    ingested_at: item.ingested_at,
    last_refreshed: item.last_refreshed,
    message: item.source_url
      ? `To refresh: have Claude Code fetch ${item.source_url} and run: mnemo add "<updated content>"`
      : 'To update: run: mnemo add "<new content>" and then: mnemo remove ' + id,
  }))
}
