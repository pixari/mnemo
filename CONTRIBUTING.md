# Contributing to mnemo

Thank you for your interest in contributing. All contributions are welcome — bug reports, documentation improvements, new features, and thoughtful feedback.

## Before you start

**For significant changes:** open an issue first to discuss your approach. This avoids wasted effort on directions that won't be merged and gives us a chance to collaborate early.

**For small fixes** (typos, docs, obvious bugs): open a pull request directly.

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
# examples:
npm run dev -- init
npm run dev -- add "test entry"
npm run dev -- search "test"
```

---

## Commit conventions

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/). A commit-msg hook enforces this automatically after `npm install`.

```
feat: add staleness threshold per item
fix: handle empty knowledge directory gracefully
docs: improve search command examples
refactor: extract embedding logic to separate module
test: add integration tests for mnemo add
chore: update dependencies
```

**Types:** `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `perf`, `ci`

**Breaking changes:** add `!` after the type and a `BREAKING CHANGE:` footer:

```
feat!: rename --stale-days to --stale-after

BREAKING CHANGE: the flag --stale-days is now --stale-after
```

---

## Pull request guidelines

- Keep PRs focused. One concern per PR.
- Describe what changed and why — not just what.
- Update documentation if your change affects user-facing behavior.
- All commands must output valid JSON when piped: `{"ok": true, "data": {...}}`.
- Run `npm run typecheck` and `npm run lint` before submitting.

---

## Project structure

```
src/
  cli.ts              Entry point — Commander setup, lazy command imports
  config.ts           Path resolution, config read/write, init guard
  db/
    sqlite.ts         Schema, CRUD for item metadata
    lancedb.ts        Vector store: upsert, search, delete, rebuild
  ingest/
    pipeline.ts       Core flow: input → embed → store
    embed.ts          Model loading, chunking, query embedding
    url.ts            URL fetching and HTML extraction
  commands/           One file per CLI command
  utils/
    fmt.ts            TTY detection, terminal output helpers
    hash.ts           SHA-256 content hashing
    id.ts             Nanoid ID generation
    output.ts         Result<T>, success/failure/print
```

---

## Key design decisions

**Why mnemo does not parse PDFs or complex file formats itself**
mnemo ingests plain text and URLs. For other formats, Claude Code reads the file, extracts what matters, and calls `mnemo add "<distilled content>"`. This keeps mnemo's dependency footprint small and lets Claude do what it's best at.

**Why LanceDB over ChromaDB**
LanceDB is fully embedded — no server, no daemon. ChromaDB's Node.js client requires a Python server. For a local developer tool, in-process is strongly preferred.

**Why SQLite alongside LanceDB**
Structured metadata queries ("list stale URL items older than 30 days") are SQL queries, not vector similarity queries. Keeping the two stores separate keeps each one simple.

**Why CLAUDE.md over MCP**
CLAUDE.md works on every version of Claude Code without additional setup. MCP requires registering a server and managing a process. The simpler path wins for now.

---

## Issue labels

| Label | Meaning |
|-------|---------|
| `good first issue` | Suitable for first-time contributors |
| `help wanted` | Community input welcome |
| `bug` | Something is broken |
| `enhancement` | New feature or improvement |
| `documentation` | Docs only |
| `question` | Discussion or clarification |
| `wontfix` | Acknowledged but out of scope |
