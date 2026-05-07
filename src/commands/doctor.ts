import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { getMnemoDir, getLanceDir } from '../config.js'
import { openDb } from '../db/sqlite.js'
import { print, success } from '../utils/output.js'

interface Check {
  name: string
  ok: boolean
  message: string
  fix?: string
}

export async function runDoctor(): Promise<void> {
  const mnemoDir = getMnemoDir()
  const checks: Check[] = []

  checks.push(checkMnemoDir(mnemoDir))
  checks.push(checkSqlite(mnemoDir))
  checks.push(checkLanceDir(mnemoDir))
  checks.push(checkClaudeMd())

  const allOk = checks.every(c => c.ok)
  print(success({ healthy: allOk, checks }))

  if (!allOk) process.exit(1)
}

function checkMnemoDir(mnemoDir: string): Check {
  if (existsSync(mnemoDir)) {
    return { name: '.mnemo directory', ok: true, message: 'Found' }
  }
  return {
    name: '.mnemo directory',
    ok: false,
    message: 'Not found',
    fix: 'Run: mnemo init',
  }
}

function checkSqlite(mnemoDir: string): Check {
  const dbPath = join(mnemoDir, 'mnemo.db')
  try {
    const db = openDb(mnemoDir)
    const count = (db.prepare('SELECT COUNT(*) as n FROM items').get() as { n: number }).n
    db.close()
    return { name: 'SQLite database', ok: true, message: `Accessible (${count} items)` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      name: 'SQLite database',
      ok: false,
      message: `Error: ${msg}`,
      fix: `Try deleting ${dbPath} and running: mnemo init`,
    }
  }
}

function checkLanceDir(mnemoDir: string): Check {
  const lanceDir = getLanceDir(mnemoDir)
  if (existsSync(lanceDir)) {
    return { name: 'LanceDB directory', ok: true, message: 'Found' }
  }
  return {
    name: 'LanceDB directory',
    ok: false,
    message: 'Not found',
    fix: 'Run: mnemo reindex',
  }
}

function checkClaudeMd(): Check {
  const path = join(process.cwd(), 'CLAUDE.md')
  if (!existsSync(path)) {
    return {
      name: 'CLAUDE.md block',
      ok: false,
      message: 'CLAUDE.md not found',
      fix: 'Run: mnemo init  (it will create CLAUDE.md)',
    }
  }
  const content = readFileSync(path, 'utf8')
  if (content.includes('<!-- mnemo:start')) {
    return { name: 'CLAUDE.md block', ok: true, message: 'mnemo block present' }
  }
  return {
    name: 'CLAUDE.md block',
    ok: false,
    message: 'mnemo block missing from CLAUDE.md',
    fix: 'Run: mnemo init  (it will append the block)',
  }
}
