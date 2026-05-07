import { getMnemoDir, assertMnemoInit } from '../config.js'
import { openDb, getItem, listStaleItems } from '../db/sqlite.js'
import { print, success, failure } from '../utils/output.js'
import { isTTY, bold, dim, warn, kv, section, line } from '../utils/fmt.js'

interface RefreshOptions {
  allStale?: boolean
}

export async function runRefresh(id: string, opts: RefreshOptions): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)

  const db = openDb(mnemoDir)

  if (opts.allStale) {
    const stale = listStaleItems(db)
    db.close()
    if (isTTY()) {
      line()
      if (stale.length === 0) {
        line(dim('No stale items.'))
      } else {
        line(dim(`${stale.length} stale item${stale.length === 1 ? '' : 's'}:`))
        for (const s of stale) {
          line(`  ${warn('[STALE]')} ${bold(s.title)}  ${dim(s.id)}`)
          if (s.source_url) line(dim(`    source: ${s.source_url}`))
        }
        line()
        line(dim('To refresh: have Claude Code re-read the source and call: mnemo add "<updated content>"'))
      }
      line()
    } else {
      print(success({
        stale_count: stale.length,
        items: stale.map(i => ({ id: i.id, title: i.title, source_url: i.source_url })),
        message: 'To refresh: have Claude Code re-read the source and call: mnemo add "<updated content>"',
      }))
    }
    return
  }

  const item = getItem(db, id)
  db.close()

  if (!item) {
    if (isTTY()) {
      line(`Item not found: ${id}`)
    } else {
      print(failure(`Item not found: ${id}`))
    }
    return
  }

  if (isTTY()) {
    section(item.title)
    kv('id', item.id)
    kv('ingested', item.ingested_at.slice(0, 10))
    kv('refreshed', item.last_refreshed?.slice(0, 10) ?? '—')
    if (item.source_url) kv('source', item.source_url)
    line()
    line(dim(item.source_url
      ? `To refresh: have Claude Code fetch ${item.source_url} and call: mnemo add "<updated content>"`
      : `To update: mnemo add "<new content>" then mnemo remove ${id}`
    ))
    line()
  } else {
    print(success({
      id: item.id,
      title: item.title,
      source_url: item.source_url,
      ingested_at: item.ingested_at,
      last_refreshed: item.last_refreshed,
      message: item.source_url
        ? `To refresh: have Claude Code fetch ${item.source_url} and call: mnemo add "<updated content>"`
        : `To update: mnemo add "<new content>" then mnemo remove ${id}`,
    }))
  }
}
