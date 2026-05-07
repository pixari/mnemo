import { writeFileSync, mkdirSync, readFileSync } from 'fs'
import { join, extname } from 'path'
import { generateId } from '../utils/id.js'
import { sha256 } from '../utils/hash.js'
import { openDb, insertItem } from '../db/sqlite.js'
import { upsertVectors } from '../db/lancedb.js'
import { embedText, chunkText } from './embed.js'
import { getKnowledgeDir, getLanceDir, type Config } from '../config.js'
import type { SourceType } from '../db/sqlite.js'

export interface IngestOptions {
  title?: string
  tags?: string[]
  staleDays?: number | null
}

export interface IngestResult {
  id: string
  title: string
  source_type: SourceType
  chunks: number
}

export async function ingestText(
  mnemoDir: string,
  db: ReturnType<typeof openDb>,
  config: Config,
  text: string,
  opts: IngestOptions = {}
): Promise<IngestResult> {
  const content = text.trim()
  if (!content) throw new Error('Content cannot be empty')
  const title = opts.title ?? content.split('\n')[0].replace(/^#\s*/, '').slice(0, 80)
  return ingestContent(mnemoDir, db, config, content, title, 'text', null, opts)
}

export async function ingestRawFile(
  mnemoDir: string,
  db: ReturnType<typeof openDb>,
  config: Config,
  filePath: string,
  opts: IngestOptions = {}
): Promise<IngestResult> {
  const ext = extname(filePath).toLowerCase()
  const supported = new Set(['.md', '.txt', '.markdown'])
  if (!supported.has(ext)) {
    throw new Error(
      `Raw file ingestion only supports .md and .txt files. Got: ${ext}\n` +
      `For other formats, have Claude Code read the file and call: mnemo add "<extracted content>"`
    )
  }
  const content = readFileSync(filePath, 'utf8').trim()
  if (!content) throw new Error(`File is empty: ${filePath}`)
  const firstLine = content.split('\n').find(l => l.trim()) ?? filePath
  const title = opts.title ?? firstLine.replace(/^#\s*/, '').slice(0, 80)
  return ingestContent(mnemoDir, db, config, content, title, 'raw', null, opts)
}

async function ingestContent(
  mnemoDir: string,
  db: ReturnType<typeof openDb>,
  config: Config,
  content: string,
  title: string,
  sourceType: SourceType,
  sourceUrl: string | null,
  opts: IngestOptions
): Promise<IngestResult> {
  const id = generateId()
  const contentHash = sha256(content)
  const now = new Date().toISOString()
  const tags = JSON.stringify(opts.tags ?? [])
  const staleDays = opts.staleDays !== undefined ? opts.staleDays : null

  const knowledgeDir = getKnowledgeDir(mnemoDir)
  mkdirSync(knowledgeDir, { recursive: true })
  const filePath = join(knowledgeDir, `${id}.md`)
  writeFileSync(filePath, content, 'utf8')

  const embeddings = await embedText(content, config)
  const lanceDir = getLanceDir(mnemoDir)
  const chunks = chunkText(content)
  const records = embeddings.map((embedding, chunk_index) => ({
    id: `${id}_${chunk_index}`,
    source_id: id,
    chunk_index,
    content_chunk: chunks[chunk_index] ?? '',
    embedding,
  }))
  await upsertVectors(lanceDir, records)

  insertItem(db, {
    id,
    title,
    file_path: filePath,
    source_url: sourceUrl,
    source_type: sourceType,
    content_hash: contentHash,
    ingested_at: now,
    last_refreshed: null,
    stale_after_days: staleDays ?? null,
    tags,
  })

  return { id, title, source_type: sourceType, chunks: embeddings.length }
}
