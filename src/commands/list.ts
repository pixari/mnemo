import { getMnemoDir, assertMnemoInit } from '../config.js'
import { openDb, listItems, listStaleItems } from '../db/sqlite.js'
import { print, success } from '../utils/output.js'
import { isTTY, bold, dim, warn, line } from '../utils/fmt.js'

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

  if (isTTY()) {
    if (items.length === 0) {
      line()
      line(dim('No items yet. Run: mnemo add "your knowledge"'))
      line()
      return
    }
    line()
    for (const item of items) {
      const staleTag = item.stale ? ` ${warn('[STALE]')}` : ''
      const tags = item.tags.length ? dim(` [${item.tags.join(', ')}]`) : ''
      line(`${bold(item.title)}${staleTag}${tags}`)
      line(dim(`  ${item.id}  ·  ${item.source_type}  ·  ${item.ingested_at.slice(0, 10)}`))
    }
    line()
    line(dim(`${items.length} item${items.length === 1 ? '' : 's'}`))
    line()
  } else {
    print(success({ total: items.length, items }))
  }
}
