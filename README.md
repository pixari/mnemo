<div align="center">

# mnemo

**Persistent semantic memory for Claude Code and AI-assisted development.**

[![npm version](https://img.shields.io/npm/v/mnemo)](https://www.npmjs.com/package/mnemo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/pixari/mnemo/actions/workflows/ci.yml/badge.svg)](https://github.com/pixari/mnemo/actions/workflows/ci.yml)

</div>

> **Early stage.** mnemo is new and evolving fast. Rough edges exist, things may change. If something breaks or feels off, please open an issue — that's exactly the kind of feedback that helps.

> **Early stage.** mnemo is new and evolving fast. Rough edges exist, things may change. If something breaks or feels off, please open an issue — that's exactly the kind of feedback that helps.

---

AI tools like Claude Code are powerful, but stateless. Every session starts cold. Architectural decisions, discovered constraints, API quirks, and hard-won lessons are either lost or have to be re-explained from scratch.

**mnemo** gives Claude Code a long-term memory. It maintains a local, semantically-searchable knowledge base per project. Claude retrieves relevant context automatically before every task — without you having to think about it.

> The name comes from **Mnemosyne**, the Greek goddess of memory.

---

## How it works

```
you / claude       mnemo add "decision: chose postgres — queries are relational"
                        │
                        ▼
                   embed with all-MiniLM-L6-v2 (local, no API key)
                   store in LanceDB + SQLite
                        │
next session            ▼
claude code        mnemo search "database decision"
                   → returns your note, ranked by relevance
                   → claude uses it as context before responding
```

Two commands. Everything else is automatic.

---

## Install

```bash
npm install -g mnemo
```

**Requirements:** Node.js ≥ 18

The embedding model (~25 MB) is downloaded on first use and cached locally. Nothing leaves your machine.

## Quickstart

```bash
cd my-project
mnemo init
```

Done. This:
- Creates `.mnemo/` (automatically gitignored)
- Sets up the local vector store and metadata database
- Appends a `mnemo` block to `CLAUDE.md` so Claude Code searches mnemo automatically
- Installs a `/mnemo-add` slash command in Claude Code

```bash
mnemo doctor   # verify everything is working
```

---

## Adding knowledge

```bash
# Architectural decisions
mnemo add "decision: chose Zod for runtime validation — catches API drift at the boundary"

# Constraints
mnemo add "constraint: never call the payments API from the frontend — CORS + key exposure"

# Patterns
mnemo add "pattern: all DB queries go through repository classes in src/repositories/"

# API behaviors
mnemo add "api: Stripe webhooks retry 3× — idempotency keys are mandatory"

# Failed approaches
mnemo add "failed: tried React Query here — invalidation logic became unmaintainable, switched to SWR"

# URLs — fetched and indexed automatically
mnemo add https://docs.stripe.com/webhooks

# With metadata
mnemo add "decision: ..." --title "Auth architecture" --tags "auth,security"
```

Drop `.md` or `.txt` files into `.mnemo/raw/` for batch import:

```bash
mnemo ingest
```

---

## Searching

```bash
mnemo search "authentication flow"
mnemo search "why did we pick postgres" --limit 10
```

Claude Code runs this automatically before every task. You rarely need to call it manually.

---

## Claude Code integration

`mnemo init` appends a block to `CLAUDE.md` that instructs Claude Code to:

- **Search before every task** — retrieves relevant context automatically
- **Capture while working** — adds decisions, constraints, patterns, and API notes as they come up

It also installs `/mnemo-add` as a Claude Code slash command — use it to add anything (text, URL, file) without leaving the chat.

---

## CLI reference

```
mnemo init                        Initialize mnemo in the current project
mnemo doctor                      Check mnemo health
mnemo reindex                     Rebuild the vector index from knowledge files

mnemo add <text|url>              Add a knowledge item (text or URL)
  --title <title>                 Override the title
  --tags <tag1,tag2>              Comma-separated tags
  --stale-days <n>                Staleness threshold (URLs only)

mnemo ingest                      Import all .md / .txt files from .mnemo/raw/
  --dry-run                       Preview without importing

mnemo search <query>              Semantic search across the knowledge base
  --limit <n>                     Number of results (default: 5)

mnemo list                        List all knowledge items
  --stale-only                    Show only stale items

mnemo show <id>                   Show full content and metadata of an item

mnemo stale                       List items past their staleness threshold
mnemo refresh <id>                Show how to update an item
  --all-stale                     List all stale items

mnemo remove <id>                 Remove an item
  --force                         Skip confirmation

mnemo stats                       Knowledge base statistics

mnemo config set <key> <value>    Set a config value (stale-days, search-limit)
mnemo config show                 Show current config
```

All commands output **JSON when piped**, human-readable output at the terminal.

---

## Storage

```
your-project/
  .mnemo/                  ← gitignored automatically
    raw/                   ← drop files here for batch import
      added/               ← processed files move here
    knowledge/             ← one .md file per knowledge item
    lancedb/               ← vector index (semantic search)
    mnemo.db               ← SQLite metadata
    config.json            ← project config
  CLAUDE.md                ← updated by mnemo init (commit this)
  .gitignore               ← updated by mnemo init (commit this)
```

**Nothing is shared via git.** `.mnemo/` is gitignored. Knowledge is personal to each developer's environment. `mnemo reindex` rebuilds the vector index from `knowledge/` files if needed.

---

## Design principles

- **Local first** — all data stays on your machine. No cloud, no account, no telemetry.
- **Zero friction** — two commands: `npm install -g mnemo && mnemo init`
- **Invisible when working** — Claude Code searches and captures automatically via `CLAUDE.md`
- **JSON everywhere** — every command outputs structured JSON when piped. Easy to script and build on.
- **Nothing in git** — knowledge is personal. Sharing mechanisms are a future concern.

---

## Contributing

Contributions are welcome — bug reports, documentation, features, and feedback.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.  
For significant changes, open an issue first to align on the approach.

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md) Code of Conduct.

---

## License

[MIT](LICENSE) © Raffaele Pizzari
