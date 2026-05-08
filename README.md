<div align="center">

# mnemo

**Semantic memory for Claude Code — plain files as source of truth, two indexes that can always be rebuilt.**

[![npm version](https://img.shields.io/npm/v/mnemo)](https://www.npmjs.com/package/mnemo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/pixari/mnemo/actions/workflows/ci.yml/badge.svg)](https://github.com/pixari/mnemo/actions/workflows/ci.yml)

</div>

---

> **Early stage.** mnemo is new and evolving fast. Rough edges exist, things may change. If something breaks or feels off, please open an issue — that's exactly the kind of feedback that helps.

---

## The architecture

Most memory tools make the vector database the source of truth. That means your knowledge is opaque, hard to inspect, and tied to the index. Corrupt the index, lose the data.

mnemo separates the roles:

```
.mnemo/
  knowledge/        ← plain .md files, one per item  ← source of truth
  lancedb/          ← vector index for semantic search  ← disposable, rebuilt from knowledge/
  mnemo.db          ← SQLite: titles, tags, staleness, source URLs  ← also rebuilt
```

**Plain files** hold the actual content. They're readable in any editor, diffable, portable.

**LanceDB** is the semantic search layer — it turns natural-language queries into ranked results, but it holds no data that isn't already in the markdown files. `mnemo reindex` regenerates it completely in seconds.

**SQLite** tracks queryable metadata: when an item was ingested, what URL it came from, what tags it has, how stale it is. It's what makes `mnemo list --stale-only` and `mnemo stale` fast without scanning every file. Like the vector index, it's derived — the files are always the authority.

The result: you never lose knowledge to a broken index, and you can always read, edit, or move your data without any tooling.

---

## How it fits into Claude Code

Claude Code is stateless by default. Every session starts cold. Architectural decisions, discovered constraints, API quirks — all gone.

mnemo fixes this with two hooks in `CLAUDE.md`:

1. **Before every task** — Claude runs `mnemo search "task description"` and reads the results as context
2. **While working** — Claude calls `mnemo add "..."` when it discovers something worth remembering

You set it up once. After that it runs invisibly.

---

## Quickstart

```bash
npm install -g mnemo
cd my-project
mnemo init
mnemo doctor
```

`mnemo init` creates `.mnemo/`, appends a block to `CLAUDE.md` that instructs Claude to search and capture automatically, and adds `.mnemo/` to `.gitignore`.

The embedding model (~25 MB, `all-MiniLM-L6-v2`) downloads on first use. Everything runs locally — no API key, no cloud, no telemetry.

---

## Adding knowledge

```bash
# Plain text — distilled by you or Claude
mnemo add "decision: chose Zod for runtime validation — catches API drift at the boundary"
mnemo add "constraint: never call the payments API from the frontend — CORS + key exposure"
mnemo add "pattern: all DB queries go through repository classes in src/repositories/"
mnemo add "api: Stripe webhooks retry 3× — idempotency keys are mandatory"
mnemo add "failed: tried React Query here — invalidation became unmaintainable, switched to SWR"

# URLs — fetched, stripped, and indexed
mnemo add https://docs.stripe.com/webhooks

# Batch import — drop .md or .txt files into .mnemo/raw/ and run:
mnemo ingest

# With metadata
mnemo add "decision: ..." --title "Auth architecture" --tags "auth,security"
```

The `/mnemo-add` slash command is also installed in Claude Code — use it to add anything without leaving the chat.

---

## Staleness — keeping knowledge fresh

Knowledge rots. An API changes, a pattern gets replaced, a decision gets revisited. mnemo tracks this explicitly.

You can set a project-wide default or override it per item:

```bash
mnemo config set stale-days 60                                  # project default
mnemo add https://docs.stripe.com/webhooks --stale-days 14      # override per item
```

SQLite records when the item was ingested and when it was last refreshed. After the threshold passes, `mnemo stale` surfaces it:

```bash
mnemo stale           # list everything past its threshold
mnemo refresh <id>    # show the item and prompt you to update it
```

For text items added without a threshold, staleness is opt-in — you set it when you know the content will drift. For URLs it defaults to your project config (`mnemo config set stale-days 60`).

This is why SQLite exists in the stack. The markdown files hold the content; SQLite holds the time-sensitive metadata that makes staleness queries fast without scanning every file on disk.

---

## Searching

```bash
mnemo search "authentication flow"
mnemo search "why did we pick postgres" --limit 10
```

Results are ranked by semantic similarity. Each hit includes a relevance score and a content excerpt. Claude runs this automatically — you rarely need to call it by hand.

---

## CLI reference

```
mnemo init                        Initialize mnemo in the current project
mnemo doctor                      Check mnemo health
mnemo reindex                     Rebuild the vector index and metadata from knowledge files

mnemo add <text|url>              Add a knowledge item
  --title <title>                 Override the title
  --tags <tag1,tag2>              Comma-separated tags
  --stale-days <n>                Staleness threshold in days (URLs only)

mnemo ingest                      Import all .md / .txt files from .mnemo/raw/
  --dry-run                       Preview without importing

mnemo search <query>              Semantic search
  --limit <n>                     Number of results (default: 5)

mnemo list                        List all knowledge items
  --stale-only                    Show only stale items

mnemo show <id>                   Show full content and metadata

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

## Storage layout

```
your-project/
  .mnemo/                  ← gitignored
    raw/                   ← drop files here for batch import
      added/               ← processed files move here
    knowledge/             ← one .md file per item (source of truth)
    lancedb/               ← vector index (rebuilt from knowledge/ if lost)
    mnemo.db               ← SQLite metadata (rebuilt from knowledge/ if lost)
    config.json            ← project config
  CLAUDE.md                ← commit this — it's how Claude knows to use mnemo
  .gitignore               ← updated by mnemo init
```

`.mnemo/` is gitignored. Knowledge is personal to each developer's environment. There is no shared state — intentionally.

---

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. For significant changes, open an issue first.

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).

---

## License

[MIT](LICENSE) © Raffaele Pizzari
