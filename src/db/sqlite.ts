import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export type SourceType = 'text' | 'file' | 'url' | 'raw'

export interface Item {
  id: string
  title: string
  file_path: string
  source_url: string | null
  source_type: SourceType
  content_hash: string
  ingested_at: string
  last_refreshed: string | null
  stale_after_days: number | null
  tags: string
}

export function openDb(mnemoDir: string): Database.Database {
  const dbDir = join(mnemoDir)
  if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true })

  const db = new Database(join(mnemoDir, 'mnemo.db'))
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id               TEXT PRIMARY KEY,
      title            TEXT NOT NULL,
      file_path        TEXT NOT NULL,
      source_url       TEXT,
      source_type      TEXT NOT NULL,
      content_hash     TEXT NOT NULL,
      ingested_at      TEXT NOT NULL,
      last_refreshed   TEXT,
      stale_after_days INTEGER,
      tags             TEXT NOT NULL DEFAULT '[]'
    );

    CREATE INDEX IF NOT EXISTS idx_items_source_url
      ON items(source_url) WHERE source_url IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_items_stale
      ON items(stale_after_days, last_refreshed);
  `)

  return db
}

export function insertItem(db: Database.Database, item: Item): void {
  db.prepare(`
    INSERT OR REPLACE INTO items
      (id, title, file_path, source_url, source_type, content_hash,
       ingested_at, last_refreshed, stale_after_days, tags)
    VALUES
      (@id, @title, @file_path, @source_url, @source_type, @content_hash,
       @ingested_at, @last_refreshed, @stale_after_days, @tags)
  `).run(item)
}

export function getItem(db: Database.Database, id: string): Item | undefined {
  return db.prepare('SELECT * FROM items WHERE id = ?').get(id) as Item | undefined
}

export function listItems(db: Database.Database): Item[] {
  return db.prepare('SELECT * FROM items ORDER BY ingested_at DESC').all() as Item[]
}

export function listStaleItems(db: Database.Database): Item[] {
  return db.prepare(`
    SELECT * FROM items
    WHERE stale_after_days IS NOT NULL
      AND datetime(COALESCE(last_refreshed, ingested_at), '+' || stale_after_days || ' days') < datetime('now')
    ORDER BY ingested_at ASC
  `).all() as Item[]
}

export function updateRefreshed(db: Database.Database, id: string, contentHash: string): void {
  db.prepare(`
    UPDATE items SET last_refreshed = datetime('now'), content_hash = ? WHERE id = ?
  `).run(contentHash, id)
}

export function deleteItem(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM items WHERE id = ?').run(id)
}
