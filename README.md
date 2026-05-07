# mnemo

> Persistent semantic knowledge base for Claude Code and AI-assisted development.

AI tools like Claude Code are powerful but stateless. Every session starts cold. Architectural decisions, discovered constraints, external API quirks, and failed approaches are either lost or must be re-explained from scratch.

**mnemo** solves this by maintaining a local, semantically-searchable knowledge base for each project. Claude Code retrieves relevant context automatically before every task — without you having to think about it.

The name comes from **Mnemosyne**, the Greek goddess of memory.

---

## How it works

1. You (or Claude Code) add knowledge: `mnemo add "decision: chose PostgreSQL — our queries are relational"`
2. mnemo embeds it locally using `all-MiniLM-L6-v2` (no API key, ~25 MB, runs on your machine)
3. Before every task, Claude Code runs `mnemo search "task description"` — automatically, triggered by `CLAUDE.md`
4. Relevant context is returned and used in the response

That's the whole loop. Nothing leaves your machine.

---

## Install

```bash
npm install -g mnemo
```

**Requirements:** Node.js ≥ 18

On first use, mnemo downloads the embedding model (~25 MB) to a local cache. This happens once.

## Initialize a project

```bash
cd my-project
mnemo init
```

This:
- Creates `.mnemo/` (gitignored automatically)
- Sets up the local SQLite + LanceDB stores
- Appends a `mnemo` block to `CLAUDE.md` (created if missing)

Verify everything is working:

```bash
mnemo doctor
```

---

## Add knowledge

```bash
# Plain text — the primary interface
mnemo add "decision: we use Zod for runtime validation — catches API drift early"
mnemo add "constraint: never call the payments API directly from the frontend — CORS + key exposure"
mnemo add "pattern: all DB queries go through repository classes in src/repositories/"
mnemo add "api: Stripe webhooks retry 3× — idempotency keys are mandatory"
mnemo add "failed: tried React Query for this — invalidation logic became a mess, switched to SWR"

# With optional metadata
mnemo add "decision: ..." --title "Auth architecture" --tags "auth,security"

# Drop markdown/text files into .mnemo/raw/ and batch-import
mnemo ingest
```

For richer content — URLs, PDFs, code files — have Claude Code read and distill it, then call `mnemo add` with the extracted insight. This produces better, more focused knowledge than raw content dumps.

---

## Search

```bash
mnemo search "authentication flow"
mnemo search "why did we choose postgres" --limit 10
```

Returns JSON with ranked results, relevance scores, and excerpts. Claude Code calls this automatically before every task.

---

## CLI reference

```
mnemo init                        Initialize mnemo in the current project
mnemo doctor                      Check mnemo health
mnemo reindex                     Rebuild the vector index from knowledge files

mnemo add <text>                  Add a knowledge item
  --title <title>                 Custom title
  --tags <tag1,tag2>              Comma-separated tags

mnemo ingest                      Process all .md/.txt files in .mnemo/raw/
  --dry-run                       Show what would be processed

mnemo search <query>              Semantic search
  --limit <n>                     Number of results (default: 5)

mnemo list                        List all items
  --stale-only                    Show only stale items

mnemo show <id>                   Show full content and metadata of an item

mnemo stale                       List items past their staleness threshold
mnemo refresh <id>                Show how to refresh an item
  --all-stale                     List all stale items

mnemo remove <id>                 Remove an item
  --force                         Skip confirmation prompt

mnemo stats                       Knowledge base statistics

mnemo config set <key> <value>    Set a config value (stale-days, search-limit)
mnemo config show                 Show current config
```

All commands output JSON: `{"ok": true, "data": {...}}` or `{"ok": false, "error": "..."}`.

---

## Claude Code integration

`mnemo init` appends a block to `CLAUDE.md` that instructs Claude Code to:

- **Search mnemo before every task** — automatic context retrieval
- **Add to mnemo while working** — capture decisions, constraints, patterns, API quirks, and failed approaches

You do not need to think about this during normal work. It happens automatically.

---

## Design principles

- **Local first** — all data stays on your machine. No cloud, no account, no telemetry.
- **Nothing in git** — `.mnemo/` is gitignored. Knowledge is personal to each developer's environment.
- **Zero friction** — two commands to set up: `npm install -g mnemo && mnemo init`
- **Claude Code as the reader** — mnemo stores and retrieves. Claude Code reads URLs, files, and PDFs, distills what matters, and calls `mnemo add`. Better separation, fewer dependencies.
- **Open output** — every command outputs JSON. Easy to script, pipe, and build on.

---

## Storage

```
{project}/
  .mnemo/                  ← gitignored
    raw/                   ← drop .md/.txt files here for batch import
      added/               ← processed files move here
    knowledge/             ← one .md file per knowledge item
    lancedb/               ← vector index (semantic search)
    mnemo.db               ← SQLite metadata store
    config.json            ← project configuration
  CLAUDE.md                ← updated by mnemo init (committed to git)
  .gitignore               ← updated by mnemo init (committed to git)
```

`mnemo reindex` rebuilds the vector index from the `knowledge/` files. Use this if the index is corrupted or after copying `.mnemo/knowledge/` to a new machine.

---

## Contributing

Contributions are welcome — bug reports, documentation, new features, and feedback.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. For significant changes, open an issue first to discuss the approach.

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/) Code of Conduct.

---

## License

MIT — see [LICENSE](LICENSE).
