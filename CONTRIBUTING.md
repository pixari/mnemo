# Contributing to mnemo

Thank you for taking the time to contribute. All contributions are welcome — bug reports, documentation improvements, new features, and thoughtful feedback.

---

## Before you start

**For significant changes:** open an issue first to discuss your approach. This avoids wasted effort on directions that won't be merged and helps us collaborate early.

**For small fixes** (typos, docs, obvious bugs): feel free to open a pull request directly.

---

## Development setup

**Requirements:** Node.js ≥ 18, npm ≥ 9

```bash
git clone https://github.com/pixari/mnemo.git
cd mnemo
npm install
npm run build
npm run typecheck
```

To run the CLI locally during development:

```bash
npm run dev -- <command>
# e.g.
npm run dev -- init
npm run dev -- add "test knowledge item"
```

---

## Commit conventions

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/). This is enforced by a commit-msg hook.

```
feat: add staleness threshold per item
fix: handle empty knowledge directory gracefully
docs: improve search command examples
refactor: extract embedding logic to separate module
test: add integration test for mnemo add
chore: update @xenova/transformers to 2.18
```

**Types:** `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `perf`, `ci`

**Breaking changes:** add `!` after the type and include `BREAKING CHANGE:` in the commit body:
```
feat!: rename --stale-days to --stale-after

BREAKING CHANGE: the --stale-days flag is now --stale-after to align with config key naming
```

---

## Pull request guidelines

- Keep PRs focused. One concern per PR.
- Include a clear description of what changed and why.
- Update documentation if your change affects user-facing behavior.
- All commands must continue to output valid JSON (`{"ok": true, "data": {...}}`).
- Run `npm run typecheck` and `npm run lint` before submitting.

---

## Project structure

```
src/
  cli.ts              Entry point — Commander setup, all commands wired via lazy imports
  config.ts           Path resolution, config read/write, assertMnemoInit guard
  db/
    sqlite.ts         SQLite schema, CRUD operations for item metadata
    lancedb.ts        LanceDB vector store: upsert, search, delete, rebuild
  ingest/
    pipeline.ts       Core ingestion: text → embed → store in LanceDB + SQLite
    embed.ts          Embedding model loading, chunking, query embedding
  commands/
    init.ts           Scaffold .mnemo/, update CLAUDE.md and .gitignore
    add.ts            Ingest plain text
    ingest.ts         Batch import from .mnemo/raw/
    search.ts         Semantic search with staleness flagging
    list.ts           List all items
    show.ts           Show one item (content + metadata)
    stale.ts          List stale items
    refresh.ts        Show how to refresh an item
    remove.ts         Delete item from all stores
    stats.ts          Knowledge base statistics
    reindex.ts        Rebuild LanceDB from knowledge/ files
    doctor.ts         Health checks
    config.ts         Config get/set
  utils/
    hash.ts           SHA-256 content hashing
    id.ts             Nanoid-based ID generation
    output.ts         Result<T> type, success/failure/print helpers
```

---

## Design decisions

**Why mnemo does not fetch URLs or parse PDFs itself**

mnemo's job is to store and retrieve knowledge — not to be a web scraper or document parser. Claude Code (and other AI tools) are far better at reading a URL or PDF, understanding what matters, and distilling a concise, searchable item. Raw content dumps produce large, noisy chunks that hurt retrieval quality. This separation also keeps mnemo's dependency tree minimal.

**Why LanceDB over ChromaDB**

LanceDB runs fully embedded in the Node.js process — no server, no daemon. ChromaDB's Node.js support requires a Python server or HTTP client. For a local developer tool, in-process is strongly preferred.

**Why SQLite alongside LanceDB**

LanceDB handles vectors. SQLite handles structured metadata queries: "list all items where stale_after_days is set and last_refreshed is older than N days." These are SQL queries, not vector similarity queries. Keeping them separate keeps each store simple.

**Why CLAUDE.md over MCP**

CLAUDE.md instructions work on every version of Claude Code without additional configuration. MCP requires registering a server, managing a process, and handling connection errors. The simpler path wins.

---

## Issue labels

| Label | Meaning |
|-------|---------|
| `good first issue` | Suitable for first-time contributors |
| `help wanted` | Community input welcome |
| `bug` | Something is broken |
| `enhancement` | New feature or improvement |
| `documentation` | Docs only |
| `question` | Discussion or clarification needed |
| `wontfix` | Acknowledged but out of scope |

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold these standards.
