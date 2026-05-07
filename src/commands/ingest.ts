import { readdirSync, renameSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { getMnemoDir, getRawDir, readConfig, assertMnemoInit } from '../config.js'
import { openDb } from '../db/sqlite.js'
import { ingestRawFile } from '../ingest/pipeline.js'
import { print, success } from '../utils/output.js'
import { isTTY, ok, err, dim, line } from '../utils/fmt.js'

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
    if (isTTY()) {
      line(dim('Raw directory is empty.'))
    } else {
      print(success({ processed: 0, failed: 0, skipped: 0, message: 'Raw directory is empty' }))
    }
    return
  }

  const entries = readdirSync(rawDir).filter(f => SUPPORTED.has(extname(f).toLowerCase()))

  if (entries.length === 0) {
    if (isTTY()) {
      line()
      line(dim('No supported files found in .mnemo/raw/ (.md, .txt)'))
      line(dim('For other formats, have Claude Code read the file and call: mnemo add "<content>"'))
      line()
    } else {
      print(success({
        processed: 0, failed: 0, skipped: 0,
        message: 'No supported files in .mnemo/raw/',
        hint: 'For other formats, have Claude Code read and call: mnemo add "<content>"',
      }))
    }
    return
  }

  if (opts.dryRun) {
    if (isTTY()) {
      line()
      line(dim(`Would process ${entries.length} file${entries.length === 1 ? '' : 's'}:`))
      entries.forEach(f => line(`  ${f}`))
      line()
    } else {
      print(success({ dry_run: true, would_process: entries }))
    }
    return
  }

  const db = openDb(mnemoDir)
  const config = readConfig(mnemoDir)
  const results: Array<{ file: string; id: string; title: string }> = []
  const errors: Array<{ file: string; error: string }> = []

  for (const file of entries) {
    const filePath = join(rawDir, file)
    try {
      const result = await ingestRawFile(mnemoDir, db, config, filePath)
      renameSync(filePath, join(addedDir, file))
      results.push({ file, id: result.id, title: result.title })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push({ file, error: msg })
    }
  }

  db.close()

  if (isTTY()) {
    line()
    for (const r of results) line(ok(`${r.file}  ${dim(`→ ${r.title}`)}`))
    for (const e of errors) line(err(`${e.file}  ${e.error}`))
    line()
    line(dim(`${results.length} processed, ${errors.length} failed`))
    line()
  } else {
    print(success({ processed: results.length, failed: errors.length, items: results, errors }))
  }
}
