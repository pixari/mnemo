import type { Config } from '../config.js'

let _pipeline: ((text: string | string[]) => Promise<{ data: Float32Array }>) | null = null

export async function getEmbedder(config: Config) {
  if (_pipeline) return _pipeline

  const { pipeline } = await import('@xenova/transformers')
  const model = await pipeline('feature-extraction', config.embeddingModel, {
    quantized: true,
  })

  _pipeline = async (text: string | string[]) => {
    const output = await model(text, { pooling: 'mean', normalize: true })
    return { data: output.data as Float32Array }
  }
  return _pipeline
}

export function chunkText(text: string, maxTokens = 512, overlapTokens = 50): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const chunks: string[] = []
  let start = 0
  while (start < words.length) {
    const end = Math.min(start + maxTokens, words.length)
    chunks.push(words.slice(start, end).join(' '))
    if (end >= words.length) break
    start = end - overlapTokens
  }
  return chunks
}

export async function embedText(text: string, config: Config): Promise<number[][]> {
  const chunks = chunkText(text)
  if (chunks.length === 0) return []
  const embedder = await getEmbedder(config)
  const embeddings: number[][] = []
  for (const chunk of chunks) {
    const { data } = await embedder(chunk)
    embeddings.push(Array.from(data))
  }
  return embeddings
}

export async function embedQuery(query: string, config: Config): Promise<number[]> {
  const embedder = await getEmbedder(config)
  const { data } = await embedder(query)
  return Array.from(data)
}
