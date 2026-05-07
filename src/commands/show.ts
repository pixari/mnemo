import { readFileSync, existsSync } from 'fs'
import { getMnemoDir, assertMnemoInit } from '../config.js'
import { openDb, getItem, listStaleItems } from '../db/sqlite.js'
import { print, success, failure } from '../utils/output.js'
import { isTTY, bold, dim, warn, kv, section, line } from '../utils/fmt.js'

export async function runShow(id: string): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)

  const db = openDb(mnemoDir)
  const item = getItem(db, id)
  const staleIds = new Set(listStaleItems(db).map(i => i.id))
  db.close()

  if (!item) {
    if (isTTY()) {
      line(`Item not found: ${id}`)
    } else {
      print(failure(`Item not found: ${id}`))
    }
    return
  }

  const content = existsSync(item.file_path) ? readFileSync(item.file_path, 'utf8') : null
  const isStale = staleIds.has(item.id)

  if (isTTY()) {
    section(item.title + (isStale ? ` ${warn('[STALE]')}` : ''))
    kv('id', item.id)
    kv('type', item.source_type)
    kv('ingested', item.ingested_at.slice(0, 10))
    kv('refreshed', item.last_refreshed?.slice(0, 10) ?? '—')
    kv('stale after', item.stale_after_days ? `${item.stale_after_days} days` : '—')
    const tags = JSON.parse(item.tags ?? '[]') as string[]
    if (tags.length) kv('tags', tags.join(', '))
    if (item.source_url) kv('source', item.source_url)
    if (content) {
      section('Content')
      line(content)
    }
    line()
  } else {
    print(success({
      id: item.id,
      title: item.title,
      source_type: item.source_type,
      source_url: item.source_url,
      ingested_at: item.ingested_at,
      last_refreshed: item.last_refreshed,
      stale_after_days: item.stale_after_days,
      tags: JSON.parse(item.tags ?? '[]'),
      stale: isStale,
      content,
    }))
  }
}
