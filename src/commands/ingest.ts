import { readdirSync, renameSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { getMnemoDir, getRawDir, readConfig, assertMnemoInit } from '../config.js'
import { openDb } from '../db/sqlite.js'
import { ingestRawFile } from '../ingest/pipeline.js'
import { print, success } from '../utils/output.js'

interface IngestOptions {
  dryRun?: boolean
}

const SUPPORTED = new Set(['.md', '.txt', '.markdown'])

export async function runIngest(opts: IngestOptions): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)

  const rawDir = getRawDir(mnemoDir)
  const addedDir = join(rawDir, 'added')

  if (!existsSync(rawDir)) {
    print(success({ processed: 0, failed: 0, skipped: 0, message: 'Raw directory is empty' }))
    return
  }

  const entries = readdirSync(rawDir).filter(f => {
    const ext = extname(f).toLowerCase()
    return SUPPORTED.has(ext)
  })

  if (entries.length === 0) {
    print(success({
      processed: 0,
      failed: 0,
      skipped: 0,
      message: 'No supported files found in .mnemo/raw/ (.md, .txt)',
      hint: 'For other formats, have Claude Code read the file and call: mnemo add "<content>"',
    }))
    return
  }

  if (opts.dryRun) {
    print(success({ dry_run: true, would_process: entries }))
    return
  }

  const db = openDb(mnemoDir)
  const config = readConfig(mnemoDir)
  const results: Array<{ file: string; id: string; title: string; chunks: number }> = []
  const errors: Array<{ file: string; error: string }> = []

  for (const file of entries) {
    const filePath = join(rawDir, file)
    try {
      const result = await ingestRawFile(mnemoDir, db, config, filePath)
      renameSync(filePath, join(addedDir, file))
      results.push({ file, id: result.id, title: result.title, chunks: result.chunks })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      process.stderr.write(`Error processing ${file}: ${msg}\n`)
      errors.push({ file, error: msg })
    }
  }

  db.close()
  print(success({ processed: results.length, failed: errors.length, items: results, errors }))
}
