import { existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync } from 'fs'
import { join, resolve } from 'path'
import { writeConfig, type Config } from '../config.js'
import { openDb } from '../db/sqlite.js'
import { print, success, failure } from '../utils/output.js'
import { isTTY, ok, bold, dim, line } from '../utils/fmt.js'

const MNEMO_URL_COMMAND = `# Add a URL to the mnemo knowledge base

Fetch the URL provided in $ARGUMENTS, extract the key knowledge, and add it to mnemo.

Steps:
1. Fetch the page at $ARGUMENTS using WebFetch
2. Identify the most useful knowledge: decisions, patterns, API behaviors, constraints, concepts
3. Write a concise, distilled summary (not a raw dump) — focus on what a developer would need to recall
4. Choose a short descriptive title
5. Run: \`mnemo add "<distilled content>" --title "<title>"\`
6. Confirm what was added and why it is useful
`

const MNEMO_BLOCK = `
<!-- mnemo:start — do not edit this block manually -->
## mnemo — Project Knowledge

mnemo maintains a semantic knowledge base for this project.

**Before starting any task:**
1. Run: \`mnemo search "<describe the task in 3-5 words>"\`
2. Read the returned items for relevant context
3. Use the retrieved context in your response

**While working — capture knowledge automatically:**
Call \`mnemo add\` when you discover any of the following:
- An architectural decision: why X was chosen over Y
- A non-obvious constraint: why something cannot be done a certain way
- A discovered pattern: how this codebase consistently handles something
- An external API behavior: a quirk, rate limit, or authentication requirement
- A failed approach: what was tried and why it did not work

Format for capture:
\`\`\`
mnemo add "decision: <what was decided> — <why>"
mnemo add "constraint: <what cannot be done> — <why>"
mnemo add "pattern: <what the pattern is>"
mnemo add "api: <service> — <behavior>"
mnemo add "failed: <approach> — <reason>"
\`\`\`

**Do not capture:**
- Routine code changes with no architectural significance
- Information already visible in the codebase (prefer code comments)
- Temporary implementation details
<!-- mnemo:end -->
`

const GITIGNORE_LINE = '.mnemo/'

export async function runInit(): Promise<void> {
  const cwd = process.cwd()
  const mnemoDir = resolve(cwd, '.mnemo')

  if (existsSync(mnemoDir)) {
    if (isTTY()) {
      line('mnemo is already initialized here. Run: mnemo doctor')
    } else {
      print(failure('mnemo is already initialized in this directory. Run `mnemo doctor` to check its health.'))
    }
    return
  }

  mkdirSync(join(mnemoDir, 'raw', 'added'), { recursive: true })
  mkdirSync(join(mnemoDir, 'knowledge'), { recursive: true })
  mkdirSync(join(mnemoDir, 'lancedb'), { recursive: true })

  const config: Config = { staleDays: 30, embeddingModel: 'Xenova/all-MiniLM-L6-v2', searchLimit: 5 }
  writeConfig(mnemoDir, config)

  openDb(mnemoDir).close()

  updateGitignore(cwd)
  updateClaudeMd(cwd)
  installSlashCommands(cwd)

  if (isTTY()) {
    line()
    line(ok(bold('mnemo initialized')))
    line()
    line(dim('  Next steps:'))
    line(`  mnemo add ${dim('"your knowledge here"')}`)
    line(`  mnemo search ${dim('"your query"')}`)
    line(`  mnemo doctor`)
    line()
  } else {
    print(success({
      message: 'mnemo initialized successfully',
      directory: mnemoDir,
      next_steps: [
        'Drop files into .mnemo/raw/ and run: mnemo ingest',
        'Or add knowledge directly: mnemo add "your knowledge here"',
        'Search: mnemo search "your query"',
        'Check health: mnemo doctor',
      ],
    }))
  }
}

function updateGitignore(cwd: string): void {
  const path = join(cwd, '.gitignore')
  if (existsSync(path)) {
    const content = readFileSync(path, 'utf8')
    if (!content.includes(GITIGNORE_LINE)) {
      appendFileSync(path, `\n${GITIGNORE_LINE}\n`)
    }
  } else {
    writeFileSync(path, `${GITIGNORE_LINE}\n`)
  }
}

function installSlashCommands(cwd: string): void {
  const commandsDir = join(cwd, '.claude', 'commands')
  mkdirSync(commandsDir, { recursive: true })
  const dest = join(commandsDir, 'mnemo-url.md')
  if (!existsSync(dest)) {
    writeFileSync(dest, MNEMO_URL_COMMAND)
  }
}

function updateClaudeMd(cwd: string): void {
  const path = join(cwd, 'CLAUDE.md')
  if (existsSync(path)) {
    const content = readFileSync(path, 'utf8')
    if (content.includes('<!-- mnemo:start')) return
    appendFileSync(path, MNEMO_BLOCK)
  } else {
    writeFileSync(path, `# Project Instructions\n${MNEMO_BLOCK}`)
  }
}
