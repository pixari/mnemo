import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { getMnemoDir, getLanceDir } from '../config.js'
import { openDb } from '../db/sqlite.js'
import { print, success } from '../utils/output.js'
import { isTTY, ok, err, dim, bold, line } from '../utils/fmt.js'

interface Check {
  name: string
  ok: boolean
  message: string
  fix?: string
}

export async function runDoctor(): Promise<void> {
  const mnemoDir = getMnemoDir()
  const checks: Check[] = [
    checkMnemoDir(mnemoDir),
    checkSqlite(mnemoDir),
    checkLanceDir(mnemoDir),
    checkClaudeMd(),
  ]

  const allOk = checks.every(c => c.ok)

  if (isTTY()) {
    line()
    for (const c of checks) {
      if (c.ok) {
        line(`${ok(bold(c.name))}  ${dim(c.message)}`)
      } else {
        line(`${err(bold(c.name))}  ${c.message}`)
        if (c.fix) line(dim(`  fix: ${c.fix}`))
      }
    }
    line()
    line(allOk ? ok('All checks passed') : err('Some checks failed'))
    line()
  } else {
    print(success({ healthy: allOk, checks }))
  }

  if (!allOk) process.exit(1)
}

function checkMnemoDir(mnemoDir: string): Check {
  if (existsSync(mnemoDir)) return { name: '.mnemo directory', ok: true, message: 'Found' }
  return { name: '.mnemo directory', ok: false, message: 'Not found', fix: 'mnemo init' }
}

function checkSqlite(mnemoDir: string): Check {
  try {
    const db = openDb(mnemoDir)
    const count = (db.prepare('SELECT COUNT(*) as n FROM items').get() as { n: number }).n
    db.close()
    return { name: 'SQLite database', ok: true, message: `Accessible (${count} items)` }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { name: 'SQLite database', ok: false, message: msg, fix: 'mnemo init' }
  }
}

function checkLanceDir(mnemoDir: string): Check {
  const lanceDir = getLanceDir(mnemoDir)
  if (existsSync(lanceDir)) return { name: 'LanceDB directory', ok: true, message: 'Found' }
  return { name: 'LanceDB directory', ok: false, message: 'Not found', fix: 'mnemo reindex' }
}

function checkClaudeMd(): Check {
  const path = join(process.cwd(), 'CLAUDE.md')
  if (!existsSync(path)) {
    return { name: 'CLAUDE.md block', ok: false, message: 'CLAUDE.md not found', fix: 'mnemo init' }
  }
  const content = readFileSync(path, 'utf8')
  if (content.includes('<!-- mnemo:start')) {
    return { name: 'CLAUDE.md block', ok: true, message: 'mnemo block present' }
  }
  return { name: 'CLAUDE.md block', ok: false, message: 'mnemo block missing', fix: 'mnemo init' }
}
