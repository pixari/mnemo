import { getMnemoDir, readConfig, updateConfig, assertMnemoInit } from '../config.js'
import { print, success, failure } from '../utils/output.js'

export async function runConfigSet(key: string, value: string): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)

  try {
    const config = updateConfig(mnemoDir, key, value)
    print(success({ updated: { [key]: value }, config }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write(`Error: ${msg}\n`)
    print(failure(msg))
  }
}

export async function runConfigShow(): Promise<void> {
  const mnemoDir = getMnemoDir()
  assertMnemoInit(mnemoDir)
  const config = readConfig(mnemoDir)
  print(success(config))
}
