import { unlinkSync, existsSync } from 'fs'
import { getMnemoDir, getLanceDir, assertMnemoInit } from '../config.js'
import { openDb, getItem, deleteItem } from '../db/sqlite.js'
import { deleteVectorsBySourceId } from '../db/lancedb.js'
import { print, success, failure } from '../utils/output.js'

interface RemoveOptions {
  force?: boolean
}

export async function runRemove(id: string, opts: RemoveOptions): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)

  const db = openDb(mnemoDir)
  const item = getItem(db, id)

  if (!item) {
    db.close()
    print(failure(`Item not found: ${id}`))
    return
  }

  if (!opts.force) {
    const { default: inquirer } = await import('inquirer')
    const { confirmed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmed',
      message: `Remove "${item.title}" (${id})?`,
      default: false,
    }])
    if (!confirmed) {
      db.close()
      print(success({ removed: false, message: 'Cancelled' }))
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

  print(success({ removed: true, id, title: item.title }))
}
