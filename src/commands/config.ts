import { getMnemoDir, readConfig, updateConfig, assertMnemoInit } from '../config.js'
import { print, success, failure } from '../utils/output.js'
import { isTTY, ok, kv, section, line } from '../utils/fmt.js'

export async function runConfigSet(key: string, value: string): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)

  try {
    const config = updateConfig(mnemoDir, key, value)
    if (isTTY()) {
      line()
      line(ok(`${key} = ${value}`))
      line()
    } else {
      print(success({ updated: { [key]: value }, config }))
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    process.stderr.write(`Error: ${msg}\n`)
    print(failure(msg))
  }
}

export async function runConfigShow(): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)
  const config = readConfig(mnemoDir)
  if (isTTY()) {
    section('Config')
    kv('stale-days', config.staleDays)
    kv('search-limit', config.searchLimit)
    kv('embedding-model', config.embeddingModel)
    line()
  } else {
    print(success(config))
  }
}
