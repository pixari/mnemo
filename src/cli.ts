#!/usr/bin/env node
import { Command } from 'commander'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'))

const program = new Command()

program
  .name('mnemo')
  .description('Persistent semantic knowledge base for Claude Code and AI-assisted development')
  .version(pkg.version)

// Setup commands
program
  .command('init')
  .description('Initialize mnemo in the current project')
  .action(async () => {
    const { runInit } = await import('./commands/init.js')
    await runInit()
  })

program
  .command('doctor')
  .description('Check mnemo health: LanceDB, SQLite, CLAUDE.md block')
  .action(async () => {
    const { runDoctor } = await import('./commands/doctor.js')
    await runDoctor()
  })

program
  .command('reindex')
  .description('Rebuild LanceDB index from knowledge files')
  .action(async () => {
    const { runReindex } = await import('./commands/reindex.js')
    await runReindex()
  })

// Ingestion commands
program
  .command('add <input>')
  .description('Add knowledge: plain text or URL')
  .option('--title <title>', 'Custom title')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--stale-days <n>', 'Days before URL content is considered stale (URLs only)')
  .action(async (input, opts) => {
    const { runAdd } = await import('./commands/add.js')
    await runAdd(input, opts)
  })

program
  .command('ingest')
  .description('Process all files in .mnemo/raw/')
  .option('--dry-run', 'Show what would be processed without doing it')
  .action(async (opts) => {
    const { runIngest } = await import('./commands/ingest.js')
    await runIngest(opts)
  })

// Retrieval commands
program
  .command('search <query>')
  .description('Semantic search across the knowledge base')
  .option('--limit <n>', 'Number of results', '5')
  .action(async (query, opts) => {
    const { runSearch } = await import('./commands/search.js')
    await runSearch(query, opts)
  })

program
  .command('list')
  .description('List all knowledge items')
  .option('--stale-only', 'Show only stale items')
  .action(async (opts) => {
    const { runList } = await import('./commands/list.js')
    await runList(opts)
  })

program
  .command('show <id>')
  .description('Show full content and metadata of an item')
  .action(async (id) => {
    const { runShow } = await import('./commands/show.js')
    await runShow(id)
  })

// Staleness commands
program
  .command('stale')
  .description('List items that may be outdated')
  .action(async () => {
    const { runStale } = await import('./commands/stale.js')
    await runStale()
  })

program
  .command('refresh <id>')
  .description('Re-fetch and re-index a URL item')
  .option('--all-stale', 'Refresh all stale URL items')
  .action(async (id, opts) => {
    const { runRefresh } = await import('./commands/refresh.js')
    await runRefresh(id, opts)
  })

// Maintenance commands
program
  .command('remove <id>')
  .description('Remove an item from the knowledge base')
  .option('--force', 'Skip confirmation prompt')
  .action(async (id, opts) => {
    const { runRemove } = await import('./commands/remove.js')
    await runRemove(id, opts)
  })

program
  .command('stats')
  .description('Show knowledge base statistics')
  .action(async () => {
    const { runStats } = await import('./commands/stats.js')
    await runStats()
  })

// Config commands
const config = program
  .command('config')
  .description('Manage mnemo configuration')

config
  .command('set <key> <value>')
  .description('Set a configuration value')
  .action(async (key, value) => {
    const { runConfigSet } = await import('./commands/config.js')
    await runConfigSet(key, value)
  })

config
  .command('show')
  .description('Show current configuration')
  .action(async () => {
    const { runConfigShow } = await import('./commands/config.js')
    await runConfigShow()
  })

program.parse()
