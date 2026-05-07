# Project Instructions

<!-- mnemo:start — do not edit this block manually -->
## mnemo — Project Knowledge

mnemo maintains a semantic knowledge base for this project.

**Before starting any task:**
1. Run: `mnemo search "<describe the task in 3-5 words>"`
2. Read the returned items for relevant context
3. Use the retrieved context in your response

**While working — capture knowledge automatically:**
Call `mnemo add` when you discover any of the following:
- An architectural decision: why X was chosen over Y
- A non-obvious constraint: why something cannot be done a certain way
- A discovered pattern: how this codebase consistently handles something
- An external API behavior: a quirk, rate limit, or authentication requirement
- A failed approach: what was tried and why it did not work

Format for capture:
```
mnemo add "decision: <what was decided> — <why>"
mnemo add "constraint: <what cannot be done> — <why>"
mnemo add "pattern: <what the pattern is>"
mnemo add "api: <service> — <behavior>"
mnemo add "failed: <approach> — <reason>"
```

**Do not capture:**
- Routine code changes with no architectural significance
- Information already visible in the codebase (prefer code comments)
- Temporary implementation details
<!-- mnemo:end -->
