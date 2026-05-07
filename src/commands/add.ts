import { getMnemoDir, readConfig, assertMnemoInit } from '../config.js'
import { openDb } from '../db/sqlite.js'
import { ingestText, ingestUrl } from '../ingest/pipeline.js'
import { print, success, failure } from '../utils/output.js'
import { isTTY, ok, dim, line } from '../utils/fmt.js'

interface AddOptions {
  title?: string
  tags?: string
  staleDays?: string
}

export async function runAdd(input: string, opts: AddOptions): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)

  const tags = opts.tags ? opts.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  const staleDays = opts.staleDays ? parseInt(opts.staleDays, 10) : undefined
  const isUrl = /^https?:\/\//i.test(input)

  const db = openDb(mnemoDir)
  const config = readConfig(mnemoDir)

  try {
    const result = isUrl
      ? await ingestUrl(mnemoDir, db, config, input, { title: opts.title, tags, staleDays })
      : await ingestText(mnemoDir, db, config, input, { title: opts.title, tags })

    if (isTTY()) {
      line()
      line(ok(`Added: ${result.title}`))
      line(dim(`  id: ${result.id}  ·  ${result.chunks} chunk${result.chunks === 1 ? '' : 's'}  ·  ${result.source_type}`))
      line()
    } else {
      print(success(result))
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write(`Error: ${msg}\n`)
    print(failure(msg))
  } finally {
    db.close()
  }
}
