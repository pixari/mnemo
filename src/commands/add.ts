import { getMnemoDir, readConfig, assertMnemoInit } from '../config.js'
import { openDb } from '../db/sqlite.js'
import { ingestText } from '../ingest/pipeline.js'
import { print, success, failure } from '../utils/output.js'
import { isTTY, ok, dim, line } from '../utils/fmt.js'

interface AddOptions {
  title?: string
  tags?: string
}

export async function runAdd(input: string, opts: AddOptions): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)

  if (/^https?:\/\//i.test(input)) {
    if (isTTY()) {
      process.stderr.write(`Use the slash command instead: /mnemo-url ${input}\n`)
    } else {
      print(failure(`Use the /mnemo-url slash command to ingest URLs. mnemo add only accepts plain text.`))
    }
    return
  }

  const tags = opts.tags ? opts.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  const db = openDb(mnemoDir)
  const config = readConfig(mnemoDir)

  try {
    const result = await ingestText(mnemoDir, db, config, input, { title: opts.title, tags })
    if (isTTY()) {
      line()
      line(ok(`Added: ${result.title}`))
      line(dim(`  id: ${result.id}  ·  ${result.chunks} chunk${result.chunks === 1 ? '' : 's'}`))
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
