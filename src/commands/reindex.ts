import { readFileSync, existsSync } from 'fs'
import { getMnemoDir, getKnowledgeDir, getLanceDir, readConfig, assertMnemoInit } from '../config.js'
import { openDb, listItems } from '../db/sqlite.js'
import { rebuildTable } from '../db/lancedb.js'
import { embedText, chunkText } from '../ingest/embed.js'
import { print, success, failure } from '../utils/output.js'
import { isTTY, ok, err, dim, line } from '../utils/fmt.js'

export async function runReindex(): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)

  const db = openDb(mnemoDir)
  const items = listItems(db)
  db.close()

  const config = readConfig(mnemoDir)
  const lanceDir = getLanceDir(mnemoDir)

  if (isTTY()) {
    line()
    line(dim(`Reindexing ${items.length} items…`))
  }

  const records: Array<{
    id: string; source_id: string; chunk_index: number; content_chunk: string; embedding: number[]
  }> = []

  let processed = 0
  let failed = 0

  for (const item of items) {
    if (!existsSync(item.file_path)) {
      process.stderr.write(`Skipping ${item.id}: file not found\n`)
      failed++
      continue
    }
    try {
      const content = readFileSync(item.file_path, 'utf8')
      const embeddings = await embedText(content, config)
      const chunks = chunkText(content)
      embeddings.forEach((embedding, chunk_index) => {
        records.push({ id: `${item.id}_${chunk_index}`, source_id: item.id, chunk_index, content_chunk: chunks[chunk_index] ?? '', embedding })
      })
      processed++
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      process.stderr.write(`Error reindexing ${item.id}: ${msg}\n`)
      failed++
    }
  }

  try {
    await rebuildTable(lanceDir, records)
    if (isTTY()) {
      line(ok(`Reindexed ${processed} items (${records.length} chunks)`))
      if (failed) line(err(`${failed} items skipped`))
      line()
    } else {
      print(success({ reindexed: processed, failed, total_chunks: records.length }))
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    process.stderr.write(`Error rebuilding index: ${msg}\n`)
    print(failure(msg))
  }
}
