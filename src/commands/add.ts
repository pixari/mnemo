import { getMnemoDir, readConfig, assertMnemoInit } from '../config.js'
import { openDb } from '../db/sqlite.js'
import { ingestText } from '../ingest/pipeline.js'
import { print, success, failure } from '../utils/output.js'

interface AddOptions {
  title?: string
  tags?: string
}

export async function runAdd(input: string, opts: AddOptions): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)

  const tags = opts.tags ? opts.tags.split(',').map(t => t.trim()).filter(Boolean) : []

  const db = openDb(mnemoDir)
  const config = readConfig(mnemoDir)

  try {
    const result = await ingestText(mnemoDir, db, config, input, {
      title: opts.title,
      tags,
    })
    print(success(result))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write(`Error: ${msg}\n`)
    print(failure(msg))
  } finally {
    db.close()
  }
}
