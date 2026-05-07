import { getMnemoDir, getLanceDir, readConfig, assertMnemoInit } from '../config.js'
import { openDb, getItem, listStaleItems } from '../db/sqlite.js'
import { searchVectors } from '../db/lancedb.js'
import { embedQuery } from '../ingest/embed.js'
import { print, success, failure } from '../utils/output.js'
import { isTTY, bold, dim, warn, line } from '../utils/fmt.js'

interface SearchOptions {
  limit: string
}

export async function runSearch(query: string, opts: SearchOptions): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)

  const limit = parseInt(opts.limit, 10)
  if (isNaN(limit) || limit < 1) {
    print(failure(`--limit must be a positive integer, got: ${opts.limit}`))
    return
  }

  const config = readConfig(mnemoDir)
  const db = openDb(mnemoDir)

  try {
    const lanceDir = getLanceDir(mnemoDir)
    const queryEmbedding = await embedQuery(query, config)
    const hits = await searchVectors(lanceDir, queryEmbedding, limit)
    const staleIds = new Set(listStaleItems(db).map(i => i.id))

    const items = hits.map(hit => {
      const item = getItem(db, hit.source_id)
      if (!item) return null
      return {
        id: item.id,
        title: item.title,
        score: Math.round(hit.score * 1000) / 1000,
        source_type: item.source_type,
        ingested_at: item.ingested_at,
        tags: JSON.parse(item.tags ?? '[]'),
        stale: staleIds.has(item.id),
        excerpt: hit.content_chunk.slice(0, 200),
        file_path: item.file_path,
      }
    }).filter(Boolean)

    if (isTTY()) {
      if (items.length === 0) {
        line()
        line(dim(`No results for "${query}"`))
        line()
        return
      }
      line()
      items.forEach((item, i) => {
        if (!item) return
        const staleTag = item.stale ? ` ${warn('[STALE]')}` : ''
        line(`${dim(`${i + 1}.`)} ${bold(item.title)}${staleTag}  ${dim(`score: ${item.score}`)}`)
        line(dim(`   ${item.excerpt.replace(/\n/g, ' ')}`))
        line(dim(`   id: ${item.id}  ·  ${item.source_type}  ·  ${item.ingested_at.slice(0, 10)}`))
        line()
      })
    } else {
      if (items.length === 0) {
        print(success({ query, results: [], message: 'No results found' }))
        return
      }
      print(success({ query, results: items }))
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write(`Error: ${msg}\n`)
    print(failure(msg))
  } finally {
    db.close()
  }
}
