import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'

export interface Config {
  staleDays: number
  embeddingModel: string
  searchLimit: number
}

const DEFAULTS: Config = {
  staleDays: 30,
  embeddingModel: 'Xenova/all-MiniLM-L6-v2',
  searchLimit: 5,
}

export function getMnemoDir(): string {
  return resolve(process.cwd(), '.mnemo')
}

export function getKnowledgeDir(mnemoDir: string): string {
  return join(mnemoDir, 'knowledge')
}

export function getRawDir(mnemoDir: string): string {
  return join(mnemoDir, 'raw')
}

export function getLanceDir(mnemoDir: string): string {
  return join(mnemoDir, 'lancedb')
}

export function getConfigPath(mnemoDir: string): string {
  return join(mnemoDir, 'config.json')
}

export function readConfig(mnemoDir: string): Config {
  const path = getConfigPath(mnemoDir)
  if (!existsSync(path)) return { ...DEFAULTS }
  try {
    return { ...DEFAULTS, ...JSON.parse(readFileSync(path, 'utf8')) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function writeConfig(mnemoDir: string, config: Config): void {
  mkdirSync(mnemoDir, { recursive: true })
  writeFileSync(getConfigPath(mnemoDir), JSON.stringify(config, null, 2) + '\n')
}

export function updateConfig(mnemoDir: string, key: string, value: string): Config {
  const config = readConfig(mnemoDir)
  if (key === 'stale-days') {
    const n = parseInt(value, 10)
    if (isNaN(n) || n < 1) throw new Error(`stale-days must be a positive integer, got: ${value}`)
    config.staleDays = n
  } else if (key === 'search-limit') {
    const n = parseInt(value, 10)
    if (isNaN(n) || n < 1) throw new Error(`search-limit must be a positive integer, got: ${value}`)
    config.searchLimit = n
  } else {
    throw new Error(`Unknown config key: ${key}. Valid keys: stale-days, search-limit`)
  }
  writeConfig(mnemoDir, config)
  return config
}

export function assertMnemoInit(mnemoDir: string): void {
  if (!existsSync(mnemoDir)) {
    process.stderr.write(
      `mnemo is not initialized in this directory.\nRun: mnemo init\n`
    )
    process.exit(1)
  }
}
