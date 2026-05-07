import { unlinkSync, existsSync } from 'fs'
import { createInterface } from 'readline'
import { getMnemoDir, getLanceDir, assertMnemoInit } from '../config.js'
import { openDb, getItem, deleteItem } from '../db/sqlite.js'
import { deleteVectorsBySourceId } from '../db/lancedb.js'
import { print, success, failure } from '../utils/output.js'
import { isTTY, ok, dim, line } from '../utils/fmt.js'

interface RemoveOptions {
  force?: boolean
}

function confirm(question: string): Promise<boolean> {
  return new Promise(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    rl.question(question, answer => {
      rl.close()
      resolve(answer.toLowerCase() === 'y')
    })
  })
}

export async function runRemove(id: string, opts: RemoveOptions): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)

  const db = openDb(mnemoDir)
  const item = getItem(db, id)

  if (!item) {
    db.close()
    if (isTTY()) {
      line(`Item not found: ${id}`)
    } else {
      print(failure(`Item not found: ${id}`))
    }
    return
  }

  if (!opts.force) {
    const confirmed = await confirm(`Remove "${item.title}" (${id})? [y/N] `)
    if (!confirmed) {
      db.close()
      if (isTTY()) {
        line(dim('Cancelled.'))
      } else {
        print(success({ removed: false, message: 'Cancelled' }))
      }
      return
    }
  }

  const lanceDir = getLanceDir(mnemoDir)
  await deleteVectorsBySourceId(lanceDir, id)
  deleteItem(db, id)
  db.close()

  if (existsSync(item.file_path)) {
    try { unlinkSync(item.file_path) } catch { /* best-effort */ }
  }

  if (isTTY()) {
    line()
    line(ok(`Removed: ${item.title}`))
    line(dim(`  id: ${id}`))
    line()
  } else {
    print(success({ removed: true, id, title: item.title }))
  }
}
